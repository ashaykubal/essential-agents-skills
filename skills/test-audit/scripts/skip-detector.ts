import { Project, SyntaxKind, Node, CallExpression, SourceFile } from 'ts-morph';
import * as path from 'path';
import * as fs from 'fs';

// --- Types ---

interface SkipMarker {
  type: string;
  line: number;
  test_name: string;
  severity: 'high' | 'medium' | 'low';
  rule: 'T4';
}

interface FileResult {
  file: string;
  markers: SkipMarker[];
  summary: {
    skip_count: number;
    only_count: number;
    todo_count: number;
  };
}

interface ErrorOutput {
  error: string;
  file: string;
}

// --- Constants ---

// Maps object.method patterns to marker types and severity
const PROPERTY_ACCESS_PATTERNS: Record<string, Record<string, { type: string; severity: SkipMarker['severity']; category: 'skip' | 'only' | 'todo' }>> = {
  'describe': {
    'skip': { type: 'describe.skip', severity: 'medium', category: 'skip' },
    'only': { type: 'describe.only', severity: 'high', category: 'only' },
  },
  'it': {
    'skip': { type: 'it.skip', severity: 'medium', category: 'skip' },
    'only': { type: 'it.only', severity: 'high', category: 'only' },
    'todo': { type: 'it.todo', severity: 'low', category: 'todo' },
  },
  'test': {
    'skip': { type: 'test.skip', severity: 'medium', category: 'skip' },
    'only': { type: 'test.only', severity: 'high', category: 'only' },
    'todo': { type: 'test.todo', severity: 'low', category: 'todo' },
  },
};

// Direct call patterns (xdescribe, xit, fdescribe, fit)
const DIRECT_CALL_PATTERNS: Record<string, { type: string; severity: SkipMarker['severity']; category: 'skip' | 'only' | 'todo' }> = {
  'xdescribe': { type: 'xdescribe', severity: 'medium', category: 'skip' },
  'xit': { type: 'xit', severity: 'medium', category: 'skip' },
  'fdescribe': { type: 'fdescribe', severity: 'high', category: 'only' },
  'fit': { type: 'fit', severity: 'high', category: 'only' },
};

// --- AST Analysis ---

function extractTestName(node: CallExpression): string {
  const args = node.getArguments();
  if (args.length > 0 && Node.isStringLiteral(args[0])) {
    return args[0].getLiteralText();
  }
  if (args.length > 0 && Node.isTemplateExpression(args[0])) {
    return args[0].getText();
  }
  if (args.length > 0 && Node.isNoSubstitutionTemplateLiteral(args[0])) {
    return args[0].getLiteralText();
  }
  return '<unnamed>';
}

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

  const markers: SkipMarker[] = [];

  sourceFile.forEachDescendant((node) => {
    if (!Node.isCallExpression(node)) return;

    const expr = node.getExpression();

    // Check property access patterns: describe.skip(), it.only(), test.todo(), etc.
    if (Node.isPropertyAccessExpression(expr)) {
      const objText = expr.getExpression().getText();
      const propText = expr.getName();
      const patternGroup = PROPERTY_ACCESS_PATTERNS[objText];

      if (patternGroup && patternGroup[propText]) {
        const pattern = patternGroup[propText];
        markers.push({
          type: pattern.type,
          line: node.getStartLineNumber(),
          test_name: extractTestName(node),
          severity: pattern.severity,
          rule: 'T4',
        });
        return;
      }
    }

    // Check direct call patterns: xdescribe(), xit(), fdescribe(), fit()
    if (Node.isIdentifier(expr)) {
      const name = expr.getText();
      const pattern = DIRECT_CALL_PATTERNS[name];

      if (pattern) {
        markers.push({
          type: pattern.type,
          line: node.getStartLineNumber(),
          test_name: extractTestName(node),
          severity: pattern.severity,
          rule: 'T4',
        });
      }
    }
  });

  // Sort markers by line number
  markers.sort((a, b) => a.line - b.line);

  // Compute summary counts
  let skipCount = 0;
  let onlyCount = 0;
  let todoCount = 0;

  for (const marker of markers) {
    const markerType = marker.type;
    // Determine category from the pattern tables
    if (markerType.includes('.skip') || markerType.startsWith('x')) {
      skipCount++;
    } else if (markerType.includes('.only') || markerType.startsWith('f')) {
      onlyCount++;
    } else if (markerType.includes('.todo')) {
      todoCount++;
    }
  }

  return {
    file: filePath,
    markers,
    summary: {
      skip_count: skipCount,
      only_count: onlyCount,
      todo_count: todoCount,
    },
  };
}

// --- Main ---

function main(): void {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    const error: ErrorOutput = {
      error: 'No file paths provided. Usage: skip-detector.ts <file1> [file2] ...',
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
