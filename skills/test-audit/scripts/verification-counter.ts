import { Project, SyntaxKind, Node, CallExpression, SourceFile } from 'ts-morph';
import * as path from 'path';
import * as fs from 'fs';

// --- Types ---

interface FileMetrics {
  file: string;
  metrics: {
    total_lines: number;
    test_logic_lines: number;
    assertion_lines: number;
    setup_lines: number;
    effectiveness_percent: number;
    framework_detected: string;
  };
  breakdown: {
    imports: number;
    comments: number;
    empty_lines: number;
    boilerplate: number;
    test_logic: number;
  };
}

interface ErrorOutput {
  error: string;
  file: string;
}

// --- Constants ---

const TEST_FRAMEWORK_WRAPPERS = new Set([
  'describe', 'it', 'test', 'beforeEach', 'afterEach', 'beforeAll', 'afterAll',
  'fdescribe', 'fit', 'xdescribe', 'xit',
]);

const JEST_VITEST_ASSERTION_PATTERNS = [
  /^expect\b/,
];

const NODE_ASSERT_PATTERNS = [
  /^assert\b/,
  /^assert\./,
];

const CHAI_ASSERTION_PATTERNS = [
  /\.should\./,
  /\.to\./,
  /\.expect\b/,
];

// --- Framework Detection ---

function detectFramework(sourceFile: SourceFile): string {
  const text = sourceFile.getFullText();

  if (text.includes('from \'vitest\'') || text.includes('from "vitest"')) {
    return 'vitest';
  }
  if (text.includes('jest.') || text.includes('from \'@jest') || text.includes('from "@jest')) {
    return 'jest';
  }
  if (text.includes('from \'mocha\'') || text.includes('from "mocha"')) {
    return 'mocha';
  }
  if (text.includes('from \'node:test\'') || text.includes('from "node:test"')) {
    return 'node:test';
  }
  // Default: if it uses describe/it/expect, assume jest (most common)
  if (text.includes('describe(') || text.includes('it(') || text.includes('expect(')) {
    return 'jest';
  }
  return 'unknown';
}

// --- Line Classification ---

function isEmptyLine(line: string): boolean {
  return line.trim() === '';
}

function isCommentLine(line: string): boolean {
  const trimmed = line.trim();
  return trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*') || trimmed.startsWith('*/');
}

function isImportLine(line: string): boolean {
  const trimmed = line.trim();
  return trimmed.startsWith('import ') || trimmed.startsWith('import{') || trimmed.startsWith('from ');
}

// --- AST Analysis ---

function isFrameworkWrapperCall(node: CallExpression): boolean {
  const expr = node.getExpression();
  const text = expr.getText();

  // Direct calls: describe(...), it(...), test(...)
  if (TEST_FRAMEWORK_WRAPPERS.has(text)) {
    return true;
  }

  // Property access calls: describe.skip(...), it.only(...), test.todo(...)
  if (Node.isPropertyAccessExpression(expr)) {
    const objText = expr.getExpression().getText();
    if (TEST_FRAMEWORK_WRAPPERS.has(objText)) {
      return true;
    }
  }

  return false;
}

function isAssertionStatement(lineText: string): boolean {
  const trimmed = lineText.trim();

  for (const pattern of JEST_VITEST_ASSERTION_PATTERNS) {
    if (pattern.test(trimmed)) return true;
  }
  for (const pattern of NODE_ASSERT_PATTERNS) {
    if (pattern.test(trimmed)) return true;
  }
  for (const pattern of CHAI_ASSERTION_PATTERNS) {
    if (pattern.test(trimmed)) return true;
  }

  return false;
}

function getFrameworkWrapperLines(sourceFile: SourceFile): Set<number> {
  const wrapperLines = new Set<number>();

  sourceFile.forEachDescendant((node) => {
    if (!Node.isCallExpression(node)) return;
    if (!isFrameworkWrapperCall(node)) return;

    // The wrapper call line itself (e.g., `describe('Calculator', () => {`)
    const startLine = node.getStartLineNumber();
    wrapperLines.add(startLine);

    // Closing brace of the callback — find the last argument
    const args = node.getArguments();
    if (args.length > 0) {
      const lastArg = args[args.length - 1];
      if (Node.isArrowFunction(lastArg) || Node.isFunctionExpression(lastArg)) {
        const endLine = lastArg.getEndLineNumber();
        // The closing `});` line is boilerplate
        wrapperLines.add(endLine);
      }
    }

    // Also mark the closing `});` of the call expression
    const callEndLine = node.getEndLineNumber();
    wrapperLines.add(callEndLine);
  });

  return wrapperLines;
}

function analyzeFile(filePath: string, project: Project): FileMetrics | ErrorOutput {
  let sourceFile: SourceFile;
  try {
    sourceFile = project.addSourceFileAtPath(filePath);
  } catch (err) {
    return {
      error: `Failed to parse: ${err instanceof Error ? err.message : String(err)}`,
      file: filePath,
    };
  }

  const lines = sourceFile.getFullText().split('\n');
  const totalLines = lines.length;
  const framework = detectFramework(sourceFile);
  const wrapperLines = getFrameworkWrapperLines(sourceFile);

  let importCount = 0;
  let commentCount = 0;
  let emptyCount = 0;
  let boilerplateCount = 0;
  let assertionCount = 0;
  let testLogicCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1; // 1-indexed

    if (isEmptyLine(line)) {
      emptyCount++;
      continue;
    }

    if (isCommentLine(line)) {
      commentCount++;
      continue;
    }

    if (isImportLine(line)) {
      importCount++;
      continue;
    }

    if (wrapperLines.has(lineNum)) {
      boilerplateCount++;
      continue;
    }

    // Remaining lines are test logic
    if (isAssertionStatement(line)) {
      assertionCount++;
    }
    testLogicCount++;
  }

  // Setup lines = test logic minus assertions
  const setupLines = testLogicCount - assertionCount;

  // Effectiveness = assertion lines / test logic lines
  const effectivenessPercent = testLogicCount > 0
    ? Math.round((assertionCount / testLogicCount) * 10000) / 100
    : 0;

  return {
    file: filePath,
    metrics: {
      total_lines: totalLines,
      test_logic_lines: testLogicCount,
      assertion_lines: assertionCount,
      setup_lines: setupLines,
      effectiveness_percent: effectivenessPercent,
      framework_detected: framework,
    },
    breakdown: {
      imports: importCount,
      comments: commentCount,
      empty_lines: emptyCount,
      boilerplate: boilerplateCount,
      test_logic: testLogicCount,
    },
  };
}

// --- Main ---

function main(): void {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    const error: ErrorOutput = {
      error: 'No file paths provided. Usage: verification-counter.ts <file1> [file2] ...',
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

  const results: (FileMetrics | ErrorOutput)[] = [];

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
