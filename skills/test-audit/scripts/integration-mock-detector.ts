import { Project, Node, CallExpression, SourceFile, SyntaxKind } from 'ts-morph';
import * as path from 'path';
import * as fs from 'fs';

// --- Types ---

interface SectionInfo {
  name: string;
  type: 'integration' | 'e2e';
  signal: 'keyword_in_name' | 'comment_header' | 'inherited';
  line_start: number;
  line_end: number;
}

interface MockLead {
  line: number;
  type: 'T3';
  confidence: 'high' | 'medium';
  mock_pattern: string;
  enclosing_block: string;
  block_type: 'integration' | 'e2e';
  message: string;
  suggestion: string;
}

interface FileResult {
  file: string;
  sections: SectionInfo[];
  leads: MockLead[];
  summary: {
    sections_found: number;
    integration_sections: number;
    e2e_sections: number;
    leads_count: number;
    mock_calls_in_integration: number;
    mock_calls_in_e2e: number;
    file_scope_mocks: number;
  };
}

interface ErrorOutput {
  error: string;
  file: string;
}

// --- Constants ---

// Keywords that signal integration or e2e test sections (case-insensitive)
const INTEGRATION_KEYWORDS = /\b(integration|integ)\b/i;
const E2E_KEYWORDS = /\b(e2e|end[- ]?to[- ]?end|acceptance|system)\b/i;

// Comment patterns for section headers
const COMMENT_INTEGRATION_PATTERN = /\b(integration\s*test|integration)\b/i;
const COMMENT_E2E_PATTERN = /\b(e2e|end[- ]?to[- ]?end|acceptance\s*test|system\s*test)\b/i;

// Mock framework patterns — property access form (obj.method)
const MOCK_PROPERTY_PATTERNS: Record<string, Record<string, string>> = {
  jest: {
    fn: 'jest.fn()',
    mock: 'jest.mock()',
    spyOn: 'jest.spyOn()',
  },
  vi: {
    fn: 'vi.fn()',
    mock: 'vi.mock()',
    spyOn: 'vi.spyOn()',
  },
  sinon: {
    stub: 'sinon.stub()',
    mock: 'sinon.mock()',
    fake: 'sinon.fake()',
    spy: 'sinon.spy()',
  },
};

// --- Section Classification ---

/**
 * Classify a describe block's test type based on its name text.
 */
function classifyByName(name: string): 'integration' | 'e2e' | null {
  if (E2E_KEYWORDS.test(name)) return 'e2e';
  if (INTEGRATION_KEYWORDS.test(name)) return 'integration';
  return null;
}

/**
 * Check preceding comments/siblings for section header markers.
 * Looks at comments immediately before a describe() call.
 */
function classifyByPrecedingComments(node: Node): 'integration' | 'e2e' | null {
  // Walk backward through siblings looking for comments
  const parent = node.getParent();
  if (!parent) return null;

  const children = parent.getChildren();
  const nodeIndex = children.indexOf(node);

  // Check up to 3 siblings before this node for comments
  for (let i = nodeIndex - 1; i >= Math.max(0, nodeIndex - 3); i--) {
    const sibling = children[i];
    const kind = sibling.getKind();

    if (kind === SyntaxKind.SingleLineCommentTrivia ||
        kind === SyntaxKind.MultiLineCommentTrivia) {
      const text = sibling.getText();
      if (COMMENT_E2E_PATTERN.test(text)) return 'e2e';
      if (COMMENT_INTEGRATION_PATTERN.test(text)) return 'integration';
    }
  }

  // Also check leading comment ranges on the statement containing this node
  const statement = findContainingStatement(node);
  if (statement) {
    const leadingComments = statement.getLeadingCommentRanges();
    for (const comment of leadingComments) {
      const text = comment.getText();
      if (COMMENT_E2E_PATTERN.test(text)) return 'e2e';
      if (COMMENT_INTEGRATION_PATTERN.test(text)) return 'integration';
    }
  }

  return null;
}

/**
 * Find the statement (expression statement) containing a node.
 */
function findContainingStatement(node: Node): Node | null {
  let current: Node | undefined = node;
  while (current) {
    if (Node.isExpressionStatement(current)) return current;
    current = current.getParent();
  }
  return null;
}

// --- Mock Detection ---

/**
 * Check if a call expression is a mock framework call.
 * Returns the pattern string (e.g., "jest.fn()") or null.
 */
function identifyMockCall(node: CallExpression): string | null {
  const expr = node.getExpression();

  // Property access: jest.fn(), jest.mock(), sinon.stub(), etc.
  if (Node.isPropertyAccessExpression(expr)) {
    const objText = expr.getExpression().getText();
    const propText = expr.getName();

    // Direct match: jest.fn(), vi.mock(), sinon.stub()
    const group = MOCK_PROPERTY_PATTERNS[objText];
    if (group && group[propText]) {
      return group[propText];
    }

    // Chain detection: jest.fn().mockResolvedValue(), jest.fn().mockImplementation()
    // The outer call is .mockResolvedValue(), inner is jest.fn()
    const innerExpr = expr.getExpression();
    if (Node.isCallExpression(innerExpr)) {
      const innerPattern = identifyMockCall(innerExpr);
      if (innerPattern) {
        return `${innerPattern}.${propText}()`;
      }
    }
  }

  return null;
}

// --- Describe Block Analysis ---

interface DescribeBlock {
  name: string;
  type: 'integration' | 'e2e' | null;
  signal: 'keyword_in_name' | 'comment_header' | 'inherited' | null;
  lineStart: number;
  lineEnd: number;
  node: CallExpression;
}

/**
 * Extract the name from a describe() call's first argument.
 */
function getDescribeName(node: CallExpression): string | null {
  const args = node.getArguments();
  if (args.length > 0 && Node.isStringLiteral(args[0])) {
    return args[0].getLiteralText();
  }
  if (args.length > 0 && Node.isNoSubstitutionTemplateLiteral(args[0])) {
    return args[0].getLiteralText();
  }
  return null;
}

/**
 * Check if a call expression is a describe() call.
 */
function isDescribeCall(node: CallExpression): boolean {
  const expr = node.getExpression();
  if (Node.isIdentifier(expr)) {
    return expr.getText() === 'describe';
  }
  // describe.skip, describe.only
  if (Node.isPropertyAccessExpression(expr)) {
    const obj = expr.getExpression();
    return Node.isIdentifier(obj) && obj.getText() === 'describe';
  }
  return false;
}

/**
 * Find all describe blocks and classify them.
 */
function findDescribeBlocks(sourceFile: SourceFile): DescribeBlock[] {
  const blocks: DescribeBlock[] = [];

  sourceFile.forEachDescendant((node) => {
    if (!Node.isCallExpression(node)) return;
    if (!isDescribeCall(node)) return;

    const name = getDescribeName(node);
    if (!name) return;

    const lineStart = node.getStartLineNumber();
    const lineEnd = node.getEndLineNumber();

    // Classify by name first
    let type = classifyByName(name);
    let signal: DescribeBlock['signal'] = type ? 'keyword_in_name' : null;

    // If not classified by name, check preceding comments
    if (!type) {
      type = classifyByPrecedingComments(node);
      signal = type ? 'comment_header' : null;
    }

    blocks.push({ name, type, signal, lineStart, lineEnd, node });
  });

  return blocks;
}

/**
 * Apply inheritance: nested describe blocks inherit parent type.
 */
function applyInheritance(blocks: DescribeBlock[]): void {
  for (const block of blocks) {
    if (block.type) continue; // Already classified

    // Check if this block is nested inside a classified block
    for (const parent of blocks) {
      if (!parent.type) continue;
      if (parent === block) continue;

      if (block.lineStart >= parent.lineStart && block.lineEnd <= parent.lineEnd) {
        block.type = parent.type;
        block.signal = 'inherited';
        break;
      }
    }
  }
}

// --- Main Analysis ---

function analyzeFile(filePath: string, project: Project): FileResult | ErrorOutput {
  let sourceFile: SourceFile;
  try {
    sourceFile = project.addSourceFileAtPath(filePath);
  } catch (err) {
    return {
      error: `Failed to parse: ${err instanceof Error ? err.message : String(err)}`,
      file: filePath,
    };
  }

  // Step 1: Find and classify describe blocks
  const blocks = findDescribeBlocks(sourceFile);
  applyInheritance(blocks);

  // Step 2: Collect sections (classified blocks only)
  const sections: SectionInfo[] = blocks
    .filter((b) => b.type !== null)
    .map((b) => ({
      name: b.name,
      type: b.type!,
      signal: b.signal!,
      line_start: b.lineStart,
      line_end: b.lineEnd,
    }));

  // Step 3: Find mock calls within classified sections
  // Only report the outermost call in a chain to avoid duplicates.
  // e.g., jest.fn().mockRejectedValueOnce().mockResolvedValue() is ONE lead, not three.
  const leads: MockLead[] = [];

  sourceFile.forEachDescendant((node) => {
    if (!Node.isCallExpression(node)) return;

    const mockPattern = identifyMockCall(node);
    if (!mockPattern) return;

    // Skip if this CallExpression is consumed by an outer chain call.
    // AST structure: inner CallExpr → PropertyAccessExpr → outer CallExpr
    const parent = node.getParent();
    if (parent && Node.isPropertyAccessExpression(parent)) {
      const grandparent = parent.getParent();
      if (grandparent && Node.isCallExpression(grandparent)) {
        // This node is an inner link in a chain — the outer call will be reported
        return;
      }
    }

    const line = node.getStartLineNumber();

    // Check if this mock call is inside a classified section
    for (const section of sections) {
      if (line >= section.line_start && line <= section.line_end) {
        leads.push({
          line,
          type: 'T3',
          confidence: 'high',
          mock_pattern: mockPattern,
          enclosing_block: section.name,
          block_type: section.type,
          message: `Mock call '${mockPattern}' in ${section.type} test block '${section.name}'`,
          suggestion: `${section.type === 'e2e' ? 'E2E' : 'Integration'} tests should use real operations. Replace mock with actual implementation.`,
        });
        break; // Don't double-count if nested sections overlap
      }
    }
  });

  // Step 3b: Detect file-scope mock calls that affect integration/e2e sections
  // File-scope mocks (jest.mock, vi.mock) outside all describe blocks contaminate ALL tests
  const integrationOrE2eSections = sections.filter(
    (s) => s.type === 'integration' || s.type === 'e2e',
  );
  let fileScopeMockCount = 0;

  if (integrationOrE2eSections.length > 0) {
    const allBlockRanges = blocks.map((b) => ({ start: b.lineStart, end: b.lineEnd }));

    sourceFile.forEachDescendant((node) => {
      if (!Node.isCallExpression(node)) return;

      const mockPattern = identifyMockCall(node);
      if (!mockPattern) return;

      // Skip chain-inner nodes (same dedup as Step 3)
      const parent = node.getParent();
      if (parent && Node.isPropertyAccessExpression(parent)) {
        const grandparent = parent.getParent();
        if (grandparent && Node.isCallExpression(grandparent)) return;
      }

      const line = node.getStartLineNumber();

      // Check if this mock is OUTSIDE all describe blocks (file-scope)
      const isInsideDescribe = allBlockRanges.some(
        (r) => line >= r.start && line <= r.end,
      );
      if (isInsideDescribe) return; // Already handled in Step 3

      fileScopeMockCount++;

      // File-scope mock found + integration sections exist → T3 lead per section
      for (const section of integrationOrE2eSections) {
        leads.push({
          line,
          type: 'T3',
          confidence: 'high',
          mock_pattern: mockPattern,
          enclosing_block: `FILE_SCOPE → ${section.name}`,
          block_type: section.type,
          message: `File-scope mock '${mockPattern}' at line ${line} affects ${section.type} section '${section.name}' (lines ${section.line_start}-${section.line_end})`,
          suggestion: `Move to separate test file or scope mock to unit test blocks only. ${section.type === 'e2e' ? 'E2E' : 'Integration'} tests should not be affected by file-scope mocks.`,
        });
      }
    });
  }

  // Sort leads by line number
  leads.sort((a, b) => a.line - b.line);

  // Step 4: Compute summary
  const integrationSections = sections.filter((s) => s.type === 'integration').length;
  const e2eSections = sections.filter((s) => s.type === 'e2e').length;
  const mockInIntegration = leads.filter((l) => l.block_type === 'integration').length;
  const mockInE2e = leads.filter((l) => l.block_type === 'e2e').length;

  return {
    file: filePath,
    sections,
    leads,
    summary: {
      sections_found: sections.length,
      integration_sections: integrationSections,
      e2e_sections: e2eSections,
      leads_count: leads.length,
      mock_calls_in_integration: mockInIntegration,
      mock_calls_in_e2e: mockInE2e,
      file_scope_mocks: fileScopeMockCount,
    },
  };
}

// --- Main ---

function main(): void {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    const error: ErrorOutput = {
      error: 'No file paths provided. Usage: integration-mock-detector.ts <file1> [file2] ...',
      file: '',
    };
    process.stderr.write(JSON.stringify(error) + '\n');
    process.exit(1);
  }

  const project = new Project({
    tsConfigFilePath: undefined,
    skipAddingFilesFromTsConfig: true,
    compilerOptions: {
      allowJs: true,
      checkJs: false,
      noEmit: true,
      strict: false,
      skipLibCheck: true,
    },
  });

  // Expand directory args to individual test files
  const filePaths: string[] = [];
  for (const arg of args) {
    const resolved = path.resolve(arg);
    if (fs.existsSync(resolved) && fs.statSync(resolved).isDirectory()) {
      const entries = fs.readdirSync(resolved).filter(f => /\.(test|spec)\.[tj]sx?$/.test(f));
      filePaths.push(...entries.map(f => path.join(resolved, f)));
    } else {
      filePaths.push(resolved);
    }
  }

  const results: (FileResult | ErrorOutput)[] = [];

  for (const filePath of filePaths) {
    const result = analyzeFile(filePath, project);
    results.push(result);
  }

  if (results.length === 1) {
    process.stdout.write(JSON.stringify(results[0], null, 2) + '\n');
  } else {
    process.stdout.write(JSON.stringify(results, null, 2) + '\n');
  }
}

main();
