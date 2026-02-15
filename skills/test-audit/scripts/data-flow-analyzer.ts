import { Project, Node, CallExpression, SourceFile, Block, SyntaxKind } from 'ts-morph';
import * as path from 'path';
import * as fs from 'fs';

// --- Types ---

interface Violation {
  line: number;
  type: 'T3+';
  confidence: 'high' | 'medium' | 'low';
  variable: string;
  source: 'object_literal' | 'array_literal' | 'mock_import' | 'spread_object';
  message: string;
  suggestion: string;
}

interface FileResult {
  file: string;
  violations: Violation[];
}

interface ErrorOutput {
  error: string;
  file: string;
}

type SourceKind =
  | 'object_literal'
  | 'array_literal'
  | 'spread_object'
  | 'call_expression'
  | 'new_expression'
  | 'primitive'
  | 'parameter'
  | 'unknown';

interface VariableSource {
  kind: SourceKind;
  line: number;
  name: string;
}

// --- Constants ---

const TEST_FUNCTIONS = new Set(['it', 'test']);
const DESCRIBE_FUNCTIONS = new Set(['describe']);
const ALL_TEST_WRAPPERS = new Set([...TEST_FUNCTIONS, ...DESCRIBE_FUNCTIONS]);

const MOCK_NAME_PATTERN = /^(mock|fake|stub|dummy)/i;

const SETUP_FUNCTIONS = new Set(['beforeEach', 'afterEach', 'beforeAll', 'afterAll']);

// --- AST Helpers ---

/**
 * Determines the source kind of an initializer expression.
 */
function classifyInitializer(initNode: Node): SourceKind {
  // Object literal: { key: value }
  if (Node.isObjectLiteralExpression(initNode)) {
    // Check if it uses spread — still a manually constructed literal
    const hasSpread = initNode.getProperties().some(
      (p) => Node.isSpreadAssignment(p)
    );
    return hasSpread ? 'spread_object' : 'object_literal';
  }

  // Array literal: [item1, item2]
  if (Node.isArrayLiteralExpression(initNode)) {
    return 'array_literal';
  }

  // Call expression: someFunction() or await someFunction()
  if (Node.isCallExpression(initNode)) {
    return 'call_expression';
  }
  if (Node.isAwaitExpression(initNode)) {
    const inner = initNode.getExpression();
    if (Node.isCallExpression(inner)) {
      return 'call_expression';
    }
  }

  // New expression: new Service()
  if (Node.isNewExpression(initNode)) {
    return 'new_expression';
  }

  // Primitive literals
  if (
    Node.isStringLiteral(initNode) ||
    Node.isNumericLiteral(initNode) ||
    Node.isNoSubstitutionTemplateLiteral(initNode) ||
    Node.isTemplateExpression(initNode) ||
    initNode.getKind() === SyntaxKind.TrueKeyword ||
    initNode.getKind() === SyntaxKind.FalseKeyword ||
    initNode.getKind() === SyntaxKind.NullKeyword ||
    initNode.getKind() === SyntaxKind.UndefinedKeyword
  ) {
    return 'primitive';
  }

  // As-expression: { ... } as SomeType — unwrap
  if (Node.isAsExpression(initNode)) {
    return classifyInitializer(initNode.getExpression());
  }

  // Parenthesized: (expr) — unwrap
  if (Node.isParenthesizedExpression(initNode)) {
    return classifyInitializer(initNode.getExpression());
  }

  // Satisfies expression — unwrap
  if (Node.isSatisfiesExpression(initNode)) {
    return classifyInitializer(initNode.getExpression());
  }

  return 'unknown';
}

/**
 * Builds a map of variable name -> source info within a block of code.
 */
function buildVariableMap(block: Node): Map<string, VariableSource> {
  const varMap = new Map<string, VariableSource>();

  block.forEachDescendant((node) => {
    if (!Node.isVariableDeclaration(node)) return;

    const name = node.getName();
    const init = node.getInitializer();
    if (!init) return;

    const kind = classifyInitializer(init);
    varMap.set(name, {
      kind,
      line: node.getStartLineNumber(),
      name,
    });
  });

  return varMap;
}

/**
 * Checks if a test name or describe block suggests integration context.
 */
function isIntegrationContext(testName: string, describeNames: string[]): boolean {
  const allNames = [testName, ...describeNames].join(' ').toLowerCase();
  return (
    allNames.includes('integration') ||
    allNames.includes('workflow') ||
    allNames.includes('e2e') ||
    allNames.includes('end-to-end') ||
    allNames.includes('end to end')
  );
}

/**
 * Extracts the test name from a test/it call expression.
 */
function extractTestName(node: CallExpression): string {
  const args = node.getArguments();
  if (args.length > 0 && Node.isStringLiteral(args[0])) {
    return args[0].getLiteralText();
  }
  if (args.length > 0 && Node.isNoSubstitutionTemplateLiteral(args[0])) {
    return args[0].getLiteralText();
  }
  return '<unnamed>';
}

/**
 * Gets the callback body from a test/describe function call.
 */
function getCallbackBody(node: CallExpression): Node | undefined {
  const args = node.getArguments();
  for (const arg of args) {
    if (Node.isArrowFunction(arg) || Node.isFunctionExpression(arg)) {
      return arg.getBody();
    }
  }
  return undefined;
}

/**
 * Collects enclosing describe names for context.
 */
function getDescribeAncestors(node: Node): string[] {
  const names: string[] = [];
  let current = node.getParent();
  while (current) {
    if (Node.isCallExpression(current)) {
      const expr = current.getExpression();
      const text = Node.isIdentifier(expr) ? expr.getText() : '';
      if (DESCRIBE_FUNCTIONS.has(text)) {
        const dArgs = current.getArguments();
        if (dArgs.length > 0 && Node.isStringLiteral(dArgs[0])) {
          names.push(dArgs[0].getLiteralText());
        }
      }
      // Also check describe.skip, describe.only
      if (Node.isPropertyAccessExpression(expr)) {
        const objText = expr.getExpression().getText();
        if (DESCRIBE_FUNCTIONS.has(objText)) {
          const dArgs = current.getArguments();
          if (dArgs.length > 0 && Node.isStringLiteral(dArgs[0])) {
            names.push(dArgs[0].getLiteralText());
          }
        }
      }
    }
    current = current.getParent();
  }
  return names;
}

/**
 * Gets the root identifier name from a property access chain.
 * e.g., mockOrder.id → 'mockOrder', mockOrder.items[0].name → 'mockOrder'
 */
function getRootIdentifier(node: Node): string | undefined {
  if (Node.isIdentifier(node)) {
    return node.getText();
  }
  if (Node.isPropertyAccessExpression(node)) {
    return getRootIdentifier(node.getExpression());
  }
  if (Node.isElementAccessExpression(node)) {
    return getRootIdentifier(node.getExpression());
  }
  return undefined;
}

/**
 * Flags a variable as a violation if it traces back to an object/array literal.
 */
function flagVariableIfLiteral(
  varName: string,
  varMap: Map<string, VariableSource>,
  flaggedVars: Set<string>,
  isIntegration: boolean,
  violations: Violation[],
): void {
  const source = varMap.get(varName);
  if (!source) return;
  if (flaggedVars.has(varName)) return;

  if (
    source.kind === 'object_literal' ||
    source.kind === 'array_literal' ||
    source.kind === 'spread_object'
  ) {
    const isMockName = MOCK_NAME_PATTERN.test(varName);
    const confidence = isMockName ? 'high' : isIntegration ? 'high' : 'medium';
    violations.push({
      line: source.line,
      type: 'T3+',
      confidence,
      variable: varName,
      source: source.kind,
      message: `Variable '${varName}' is manually constructed — breaks integration chain`,
      suggestion: 'Replace with factory function or upstream function output',
    });
    flaggedVars.add(varName);
  }
}

/**
 * Finds all function call arguments within a test body and checks
 * if any reference variables that trace back to object/array literals.
 */
function findViolationsInTestBody(
  body: Node,
  varMap: Map<string, VariableSource>,
  testName: string,
  describeNames: string[],
): Violation[] {
  const violations: Violation[] = [];
  const flaggedVars = new Set<string>();
  const isIntegration = isIntegrationContext(testName, describeNames);

  body.forEachDescendant((node) => {
    if (!Node.isCallExpression(node)) return;

    const expr = node.getExpression();

    // Skip assertion calls — variables in expect() aren't violations
    if (Node.isIdentifier(expr) && expr.getText() === 'expect') return;
    if (Node.isPropertyAccessExpression(expr)) {
      // Skip chained assertion methods like .toBe(), .toEqual()
      const rootObj = getRootObject(expr);
      if (rootObj === 'expect') return;
    }

    // Skip setup functions
    if (Node.isIdentifier(expr) && SETUP_FUNCTIONS.has(expr.getText())) return;

    // Check each argument for references to manually-constructed variables.
    for (const arg of node.getArguments()) {
      // Case 1: Variable passed directly — e.g., processOrder(mockOrderData)
      if (Node.isIdentifier(arg)) {
        flagVariableIfLiteral(arg.getText(), varMap, flaggedVars, isIntegration, violations);
        continue;
      }

      // Case 2: Inline object whose property values reference manually-constructed
      // variables via property access — e.g., processPayment({ orderId: mockOrder.id })
      // Pure-primitive inline objects like createOrder({ customerId: 'x' }) are NOT flagged.
      if (Node.isObjectLiteralExpression(arg)) {
        for (const prop of arg.getProperties()) {
          if (!Node.isPropertyAssignment(prop)) continue;
          const init = prop.getInitializer();
          if (!init) continue;
          // Check for mockOrder.id pattern
          if (Node.isPropertyAccessExpression(init)) {
            const rootName = getRootIdentifier(init);
            if (rootName) {
              flagVariableIfLiteral(rootName, varMap, flaggedVars, isIntegration, violations);
            }
          }
          // Check for direct variable reference as property value: { data: mockOrder }
          if (Node.isIdentifier(init)) {
            flagVariableIfLiteral(init.getText(), varMap, flaggedVars, isIntegration, violations);
          }
        }
        continue;
      }

      // Case 3: Property access as direct argument — e.g., releaseReservation(mockOrder.id)
      if (Node.isPropertyAccessExpression(arg)) {
        const rootName = getRootIdentifier(arg);
        if (rootName) {
          flagVariableIfLiteral(rootName, varMap, flaggedVars, isIntegration, violations);
        }
      }
    }
  });

  return violations;
}

/**
 * Gets the root object name from a property access chain.
 * e.g., expect(x).toBe(y) → 'expect'
 */
function getRootObject(node: Node): string {
  if (Node.isIdentifier(node)) {
    return node.getText();
  }
  if (Node.isPropertyAccessExpression(node)) {
    return getRootObject(node.getExpression());
  }
  if (Node.isCallExpression(node)) {
    return getRootObject(node.getExpression());
  }
  return '';
}

// --- File Analysis ---

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

  const violations: Violation[] = [];

  // Find all test/it calls and analyze their bodies
  sourceFile.forEachDescendant((node) => {
    if (!Node.isCallExpression(node)) return;

    const expr = node.getExpression();
    let funcName = '';

    if (Node.isIdentifier(expr)) {
      funcName = expr.getText();
    } else if (Node.isPropertyAccessExpression(expr)) {
      // Handle it.skip, test.only, etc.
      funcName = expr.getExpression().getText();
    }

    if (!TEST_FUNCTIONS.has(funcName)) return;

    const testName = extractTestName(node);
    const describeNames = getDescribeAncestors(node);
    const body = getCallbackBody(node);
    if (!body) return;

    // Build variable map for this test body
    const varMap = buildVariableMap(body);

    // Also include variables from enclosing scope (beforeEach, describe-level)
    // by walking up to the nearest describe body
    const describeBody = findEnclosingDescribeBody(node);
    if (describeBody) {
      const outerVars = buildVariableMap(describeBody);
      // Only add outer vars that aren't already in the test body map
      for (const [name, source] of outerVars) {
        if (!varMap.has(name)) {
          varMap.set(name, source);
        }
      }
    }

    const testViolations = findViolationsInTestBody(body, varMap, testName, describeNames);
    violations.push(...testViolations);
  });

  // Deduplicate by variable + line (same var flagged from multiple tests)
  const seen = new Set<string>();
  const deduped = violations.filter((v) => {
    const key = `${v.variable}:${v.line}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Sort by line number
  deduped.sort((a, b) => a.line - b.line);

  return {
    file: filePath,
    violations: deduped,
  };
}

/**
 * Finds the enclosing describe callback body for a test node.
 */
function findEnclosingDescribeBody(node: Node): Node | undefined {
  let current = node.getParent();
  while (current) {
    if (Node.isCallExpression(current)) {
      const expr = current.getExpression();
      let funcName = '';
      if (Node.isIdentifier(expr)) {
        funcName = expr.getText();
      } else if (Node.isPropertyAccessExpression(expr)) {
        funcName = expr.getExpression().getText();
      }
      if (DESCRIBE_FUNCTIONS.has(funcName)) {
        return getCallbackBody(current);
      }
    }
    current = current.getParent();
  }
  return undefined;
}

// --- Main ---

function main(): void {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    const error: ErrorOutput = {
      error: 'No file paths provided. Usage: data-flow-analyzer.ts <file1> [file2] ...',
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
