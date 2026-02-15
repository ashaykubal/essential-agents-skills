/**
 * Tests for data-flow-analyzer.ts
 *
 * Runs the actual script via tsx against real fixture files and validates
 * JSON output correctness. No mocking of the system under test.
 */

import { execFileSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// --- Helpers ---

const SCRIPT_PATH = path.resolve(__dirname, '..', '..', 'skills', 'test-audit', 'scripts', 'data-flow-analyzer.ts');
const FIXTURES_ROOT = path.resolve(__dirname, '..', 'fixtures', 'test-audit');
const TSX_BIN = path.resolve(__dirname, '..', '..', 'skills', 'test-audit', 'scripts', 'node_modules', '.bin', 'tsx');

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

const TMP_DIR = '/tmp/claude/data-flow-analyzer-tests';

function runAnalyzer(...filePaths: string[]): string {
  return execFileSync(TSX_BIN, [SCRIPT_PATH, ...filePaths], {
    encoding: 'utf-8',
    timeout: 15000,
  });
}

function parseResult(filePath: string): FileResult {
  const stdout = runAnalyzer(filePath);
  return JSON.parse(stdout) as FileResult;
}

function fixturePath(subPath: string): string {
  return path.resolve(FIXTURES_ROOT, subPath);
}

function writeTmpFixture(name: string, content: string): string {
  const filePath = path.join(TMP_DIR, name);
  fs.writeFileSync(filePath, content, 'utf-8');
  return filePath;
}

// --- Setup / Teardown ---

beforeAll(() => {
  fs.mkdirSync(TMP_DIR, { recursive: true });
});

afterAll(() => {
  fs.rmSync(TMP_DIR, { recursive: true, force: true });
});

// --- Tests ---

describe('data-flow-analyzer.ts', () => {

  describe('T3+ violation detection (workflow.integration.ts)', () => {
    let result: FileResult;

    beforeAll(() => {
      result = parseResult(fixturePath('t3plus-violation/workflow.integration.ts'));
    });

    it('should report all violations with type T3+', () => {
      expect(result.violations.length).toBeGreaterThan(0);
      for (const v of result.violations) {
        expect(v.type).toBe('T3+');
      }
    });

    it('should detect mockOrderData on line 30', () => {
      const v = result.violations.find(v => v.line === 30);
      expect(v).toBeDefined();
      expect(v!.variable).toBe('mockOrderData');
      expect(v!.source).toBe('object_literal');
      expect(v!.confidence).toBe('high');
    });

    it('should detect mockOrderData on line 44', () => {
      const v = result.violations.find(v => v.line === 44);
      expect(v).toBeDefined();
      expect(v!.variable).toBe('mockOrderData');
      expect(v!.source).toBe('object_literal');
      expect(v!.confidence).toBe('high');
    });

    it('should NOT flag mockOrder on line 60 (only used in spread, not as function arg)', () => {
      // mockOrder is { id: 'ORDER-789', ... } but it's only consumed by the spread
      // on line 61: { ...mockOrder, status: 'processed', paymentId: 'PAY-1' }
      // It is NOT passed directly as a function argument, so no violation.
      const v = result.violations.find(v => v.line === 60 && v.variable === 'mockOrder');
      expect(v).toBeUndefined();
    });

    it('should detect mockProcessedOrder (spread) on line 61', () => {
      const v = result.violations.find(v => v.line === 61);
      expect(v).toBeDefined();
      expect(v!.variable).toBe('mockProcessedOrder');
      expect(v!.source).toBe('spread_object');
      expect(v!.confidence).toBe('high');
    });

    it('should flag items variable on line 18 as array_literal', () => {
      // Line 18: const items = [{ productId: 'PROD-1', quantity: 2 }];
      // Variable assigned to array literal, then passed to createOrder(items)
      const v = result.violations.find(v => v.line === 18);
      expect(v).toBeDefined();
      expect(v!.variable).toBe('items');
      expect(v!.source).toBe('array_literal');
    });

    it('should include the resolved file path', () => {
      expect(result.file).toBe(fixturePath('t3plus-violation/workflow.integration.ts'));
    });
  });

  describe('violation ordering', () => {
    it('should return violations sorted by line number', () => {
      const result = parseResult(fixturePath('t3plus-violation/workflow.integration.ts'));
      for (let i = 1; i < result.violations.length; i++) {
        expect(result.violations[i].line).toBeGreaterThanOrEqual(result.violations[i - 1].line);
      }
    });
  });

  describe('clean fixture (calculator.test.ts)', () => {
    let result: FileResult;

    beforeAll(() => {
      result = parseResult(fixturePath('clean/calculator.test.ts'));
    });

    it('should find zero violations', () => {
      expect(result.violations).toHaveLength(0);
    });

    it('should include the resolved file path', () => {
      expect(result.file).toBe(fixturePath('clean/calculator.test.ts'));
    });
  });

  describe('T3 fixture (api.integration.ts) — jest.mock is T3 not T3+', () => {
    let result: FileResult;

    beforeAll(() => {
      result = parseResult(fixturePath('t3-violation/api.integration.ts'));
    });

    it('should not flag jest.mock as T3+ violation', () => {
      // jest.mock is a T3 violation (mocking), not a T3+ data-flow violation
      const jestMockViolation = result.violations.find(
        v => v.message.toLowerCase().includes('jest.mock')
      );
      expect(jestMockViolation).toBeUndefined();
    });
  });

  describe('inline object literals — NOT flagged', () => {
    let tmpFile: string;

    beforeAll(() => {
      tmpFile = writeTmpFixture('inline-objects.test.ts', `
describe('service integration', () => {
  it('should process data', async () => {
    const service = new DataService();
    const result = await service.process({ name: 'test', value: 42 });
    expect(result).toBeDefined();
  });
});
`);
    });

    it('should not flag inline object literals as violations', () => {
      // Inline objects as function arguments are input parameters, not
      // broken integration chains. Only VARIABLES traced to literals are violations.
      const result = parseResult(tmpFile);
      expect(result.violations).toHaveLength(0);
    });
  });

  describe('variables from call expressions — NOT flagged', () => {
    let tmpFile: string;

    beforeAll(() => {
      tmpFile = writeTmpFixture('call-expr.test.ts', `
describe('workflow', () => {
  it('should use upstream output', async () => {
    const order = await createOrder();
    const result = await processOrder(order);
    expect(result.status).toBe('done');
  });
});
`);
    });

    it('should not flag variables initialized from call expressions', () => {
      const result = parseResult(tmpFile);
      expect(result.violations).toHaveLength(0);
    });
  });

  describe('variables from new expressions — NOT flagged', () => {
    let tmpFile: string;

    beforeAll(() => {
      tmpFile = writeTmpFixture('new-expr.test.ts', `
describe('service tests', () => {
  it('should create service', () => {
    const service = new OrderService();
    const handler = new RequestHandler(service);
    expect(handler).toBeDefined();
  });
});
`);
    });

    it('should not flag variables initialized from new expressions', () => {
      const result = parseResult(tmpFile);
      expect(result.violations).toHaveLength(0);
    });
  });

  describe('mock-named variables get high confidence', () => {
    let tmpFile: string;

    beforeAll(() => {
      tmpFile = writeTmpFixture('mock-named.test.ts', `
describe('data processing', () => {
  it('should handle mock data', () => {
    const mockUser = { id: 1, name: 'Test' };
    const fakeConfig = { timeout: 5000 };
    const stubResponse = { status: 200, body: 'ok' };
    processUser(mockUser);
    applyConfig(fakeConfig);
    handleResponse(stubResponse);
  });
});
`);
    });

    it('should assign high confidence to mock-prefixed variables', () => {
      const result = parseResult(tmpFile);
      const mockViolation = result.violations.find(v => v.variable === 'mockUser');
      expect(mockViolation).toBeDefined();
      expect(mockViolation!.confidence).toBe('high');
    });

    it('should assign high confidence to fake-prefixed variables', () => {
      const result = parseResult(tmpFile);
      const fakeViolation = result.violations.find(v => v.variable === 'fakeConfig');
      expect(fakeViolation).toBeDefined();
      expect(fakeViolation!.confidence).toBe('high');
    });

    it('should assign high confidence to stub-prefixed variables', () => {
      const result = parseResult(tmpFile);
      const stubViolation = result.violations.find(v => v.variable === 'stubResponse');
      expect(stubViolation).toBeDefined();
      expect(stubViolation!.confidence).toBe('high');
    });
  });

  describe('integration context detection', () => {
    let integrationFile: string;
    let nonIntegrationFile: string;

    beforeAll(() => {
      integrationFile = writeTmpFixture('integration-context.test.ts', `
describe('order integration workflow', () => {
  it('should process order end-to-end', () => {
    const data = { id: 1, value: 'test' };
    processOrder(data);
    expect(true).toBe(true);
  });
});
`);
      nonIntegrationFile = writeTmpFixture('unit-context.test.ts', `
describe('calculator', () => {
  it('should compute sum', () => {
    const data = { a: 1, b: 2 };
    computeSum(data);
    expect(true).toBe(true);
  });
});
`);
    });

    it('should assign high confidence when describe name includes "integration"', () => {
      const result = parseResult(integrationFile);
      const v = result.violations.find(v => v.variable === 'data');
      expect(v).toBeDefined();
      expect(v!.confidence).toBe('high');
    });

    it('should assign medium confidence in non-integration context', () => {
      const result = parseResult(nonIntegrationFile);
      const v = result.violations.find(v => v.variable === 'data');
      expect(v).toBeDefined();
      expect(v!.confidence).toBe('medium');
    });
  });

  describe('spread objects', () => {
    let tmpFile: string;

    beforeAll(() => {
      tmpFile = writeTmpFixture('spread-objects.test.ts', `
describe('order tests', () => {
  it('should handle spread objects', () => {
    const base = { id: 1 };
    const extended = { ...base, extra: 'val' };
    processOrder(extended);
    expect(true).toBe(true);
  });
});
`);
    });

    it('should detect spread objects as violations', () => {
      const result = parseResult(tmpFile);
      const v = result.violations.find(v => v.variable === 'extended');
      expect(v).toBeDefined();
      expect(v!.source).toBe('spread_object');
    });
  });

  describe('error handling', () => {
    it('should exit with code 1 when no arguments given', () => {
      expect(() => {
        execFileSync(TSX_BIN, [SCRIPT_PATH], {
          encoding: 'utf-8',
          timeout: 15000,
        });
      }).toThrow();
    });

    it('should write error JSON to stderr when no arguments given', () => {
      try {
        execFileSync(TSX_BIN, [SCRIPT_PATH], {
          encoding: 'utf-8',
          timeout: 15000,
        });
      } catch (err: any) {
        const stderr = err.stderr as string;
        const parsed = JSON.parse(stderr.trim());
        expect(parsed.error).toContain('No file paths provided');
        expect(parsed.file).toBe('');
      }
    });

    it('should produce error JSON for non-existent file', () => {
      const fakePath = '/tmp/claude/does-not-exist.test.ts';
      const stdout = runAnalyzer(fakePath);
      const result = JSON.parse(stdout) as ErrorOutput;
      expect(result.error).toBeDefined();
      expect(result.file).toContain(fakePath);
    });
  });

  describe('multi-file support', () => {
    it('should return an array when given multiple files', () => {
      const stdout = runAnalyzer(
        fixturePath('t3plus-violation/workflow.integration.ts'),
        fixturePath('clean/calculator.test.ts'),
      );
      const results = JSON.parse(stdout);
      expect(Array.isArray(results)).toBe(true);
      expect(results).toHaveLength(2);
    });

    it('should include correct file paths in multi-file output', () => {
      const file1 = fixturePath('t3plus-violation/workflow.integration.ts');
      const file2 = fixturePath('clean/calculator.test.ts');
      const stdout = runAnalyzer(file1, file2);
      const results = JSON.parse(stdout) as FileResult[];
      expect(results[0].file).toBe(file1);
      expect(results[1].file).toBe(file2);
    });

    it('should return single object (not array) for single file input', () => {
      const stdout = runAnalyzer(fixturePath('clean/calculator.test.ts'));
      const result = JSON.parse(stdout);
      expect(Array.isArray(result)).toBe(false);
      expect(result.file).toBeDefined();
    });

    it('should include violations from first file and none from second', () => {
      const stdout = runAnalyzer(
        fixturePath('t3plus-violation/workflow.integration.ts'),
        fixturePath('clean/calculator.test.ts'),
      );
      const results = JSON.parse(stdout) as FileResult[];
      expect(results[0].violations.length).toBeGreaterThan(0);
      expect(results[1].violations).toHaveLength(0);
    });
  });

  describe('empty file handling', () => {
    let tmpFile: string;

    beforeAll(() => {
      tmpFile = writeTmpFixture('empty.test.ts', '');
    });

    it('should not crash on empty file', () => {
      const result = parseResult(tmpFile);
      expect(result.violations).toHaveLength(0);
    });

    it('should include file path in output', () => {
      const result = parseResult(tmpFile);
      expect(result.file).toBe(tmpFile);
    });
  });

  describe('assertion arguments NOT flagged', () => {
    let tmpFile: string;

    beforeAll(() => {
      tmpFile = writeTmpFixture('assertion-args.test.ts', `
describe('assertion tests', () => {
  it('should not flag variables used only in assertions', () => {
    const mockData = { id: 1, name: 'test' };
    const result = processData();
    expect(result).toEqual(mockData);
  });
});
`);
    });

    it('should not flag variables only used in expect() calls', () => {
      const result = parseResult(tmpFile);
      // mockData is only used in expect().toEqual(mockData), not as a function arg
      const v = result.violations.find(v => v.variable === 'mockData');
      expect(v).toBeUndefined();
    });
  });

  describe('variables in beforeEach scope', () => {
    let tmpFile: string;

    beforeAll(() => {
      tmpFile = writeTmpFixture('before-each-scope.test.ts', `
describe('order workflow integration', () => {
  const mockConfig = { timeout: 5000, retries: 3 };

  it('should use config', () => {
    initService(mockConfig);
    expect(true).toBe(true);
  });
});
`);
    });

    it('should detect violations in variables declared in enclosing describe scope', () => {
      const result = parseResult(tmpFile);
      const v = result.violations.find(v => v.variable === 'mockConfig');
      expect(v).toBeDefined();
      expect(v!.source).toBe('object_literal');
    });
  });

  describe('primitives NOT flagged', () => {
    let tmpFile: string;

    beforeAll(() => {
      tmpFile = writeTmpFixture('primitives.test.ts', `
describe('primitive tests', () => {
  it('should not flag primitive values', () => {
    const name = 'test-user';
    const count = 42;
    const flag = true;
    processUser(name);
    setCount(count);
    toggle(flag);
    expect(true).toBe(true);
  });
});
`);
    });

    it('should not flag primitive string, number, or boolean variables', () => {
      const result = parseResult(tmpFile);
      expect(result.violations).toHaveLength(0);
    });
  });

  describe('as-expression unwrapping', () => {
    let tmpFile: string;

    beforeAll(() => {
      tmpFile = writeTmpFixture('as-expression.test.ts', `
interface Order {
  id: string;
  status: string;
}

describe('type casting', () => {
  it('should detect object literals with as-expression', () => {
    const mockOrder = { id: 'ORD-1', status: 'pending' } as Order;
    processOrder(mockOrder);
    expect(true).toBe(true);
  });
});
`);
    });

    it('should detect object literals wrapped in as-expressions', () => {
      const result = parseResult(tmpFile);
      const v = result.violations.find(v => v.variable === 'mockOrder');
      expect(v).toBeDefined();
      expect(v!.source).toBe('object_literal');
    });
  });

  describe('deduplication', () => {
    let tmpFile: string;

    beforeAll(() => {
      tmpFile = writeTmpFixture('dedup.test.ts', `
describe('dedup tests', () => {
  const sharedData = { key: 'val' };

  it('test one', () => {
    fn1(sharedData);
    expect(true).toBe(true);
  });

  it('test two', () => {
    fn2(sharedData);
    expect(true).toBe(true);
  });
});
`);
    });

    it('should deduplicate violations for the same variable at the same line', () => {
      const result = parseResult(tmpFile);
      const sharedViolations = result.violations.filter(v => v.variable === 'sharedData');
      // Same variable, same declaration line — should be deduped to 1
      expect(sharedViolations).toHaveLength(1);
    });
  });
});
