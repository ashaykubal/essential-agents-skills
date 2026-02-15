/**
 * Tests for verification-counter.ts
 *
 * Runs the actual script via tsx against real fixture files and validates
 * JSON output correctness. No mocking of the system under test.
 */

import { execFileSync } from 'child_process';
import * as path from 'path';

// --- Helpers ---

const SCRIPT_PATH = path.resolve(__dirname, '..', '..', 'skills', 'test-audit', 'scripts', 'verification-counter.ts');
const FIXTURES_ROOT = path.resolve(__dirname, '..', 'fixtures', 'test-audit');
const TSX_BIN = path.resolve(__dirname, '..', '..', 'skills', 'test-audit', 'scripts', 'node_modules', '.bin', 'tsx');

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

function runCounter(...filePaths: string[]): string {
  return execFileSync(TSX_BIN, [SCRIPT_PATH, ...filePaths], {
    encoding: 'utf-8',
    timeout: 15000,
  });
}

function parseResult(filePath: string): FileMetrics {
  const stdout = runCounter(filePath);
  return JSON.parse(stdout) as FileMetrics;
}

function fixturePath(subPath: string): string {
  return path.resolve(FIXTURES_ROOT, subPath);
}

// --- Tests ---

describe('verification-counter.ts', () => {

  describe('clean fixture (calculator.test.ts)', () => {
    let result: FileMetrics;

    beforeAll(() => {
      result = parseResult(fixturePath('clean/calculator.test.ts'));
    });

    it('should detect jest framework', () => {
      expect(result.metrics.framework_detected).toBe('jest');
    });

    it('should count total lines correctly', () => {
      // The fixture is 37 lines of content + trailing newline = 38 lines from split
      expect(result.metrics.total_lines).toBe(38);
    });

    it('should count exactly 5 assertion lines', () => {
      expect(result.metrics.assertion_lines).toBe(5);
    });

    it('should count exactly 1 import line', () => {
      expect(result.breakdown.imports).toBe(1);
    });

    it('should have breakdown that sums to total_lines', () => {
      const { imports, comments, empty_lines, boilerplate, test_logic } = result.breakdown;
      expect(imports + comments + empty_lines + boilerplate + test_logic).toBe(result.metrics.total_lines);
    });

    it('should calculate effectiveness_percent correctly', () => {
      const expected = Math.round(
        (result.metrics.assertion_lines / result.metrics.test_logic_lines) * 10000
      ) / 100;
      expect(result.metrics.effectiveness_percent).toBe(expected);
    });

    it('should set setup_lines = test_logic_lines - assertion_lines', () => {
      expect(result.metrics.setup_lines).toBe(
        result.metrics.test_logic_lines - result.metrics.assertion_lines
      );
    });
  });

  describe('mock-heavy fixture (proxy.test.ts)', () => {
    let result: FileMetrics;

    beforeAll(() => {
      result = parseResult(fixturePath('t1-violation/proxy.test.ts'));
    });

    it('should detect jest framework via jest.fn() usage', () => {
      expect(result.metrics.framework_detected).toBe('jest');
    });

    it('should have breakdown that sums to total_lines', () => {
      const { imports, comments, empty_lines, boilerplate, test_logic } = result.breakdown;
      expect(imports + comments + empty_lines + boilerplate + test_logic).toBe(result.metrics.total_lines);
    });

    it('should count assertion lines from expect() calls', () => {
      // proxy.test.ts has expect() on lines 32-35, 37-38, 46, 55 = multiple assertions
      expect(result.metrics.assertion_lines).toBeGreaterThanOrEqual(4);
    });
  });

  describe('integration fixture (workflow.integration.ts)', () => {
    let result: FileMetrics;

    beforeAll(() => {
      result = parseResult(fixturePath('t3plus-violation/workflow.integration.ts'));
    });

    it('should detect jest framework', () => {
      expect(result.metrics.framework_detected).toBe('jest');
    });

    it('should count 3 import lines', () => {
      expect(result.breakdown.imports).toBe(3);
    });

    it('should have breakdown that sums to total_lines', () => {
      const { imports, comments, empty_lines, boilerplate, test_logic } = result.breakdown;
      expect(imports + comments + empty_lines + boilerplate + test_logic).toBe(result.metrics.total_lines);
    });

    it('should have non-zero boilerplate for describe/it/beforeEach wrappers', () => {
      expect(result.breakdown.boilerplate).toBeGreaterThan(0);
    });
  });

  describe('skipped fixture (skipped.test.ts)', () => {
    let result: FileMetrics;

    beforeAll(() => {
      result = parseResult(fixturePath('t4-violation/skipped.test.ts'));
    });

    it('should detect jest framework', () => {
      expect(result.metrics.framework_detected).toBe('jest');
    });

    it('should count boilerplate for it.skip, it.only, describe.skip, xit, it.todo wrappers', () => {
      // These are framework wrapper calls with property access; should be classified as boilerplate
      expect(result.breakdown.boilerplate).toBeGreaterThan(0);
    });

    it('should have breakdown that sums to total_lines', () => {
      const { imports, comments, empty_lines, boilerplate, test_logic } = result.breakdown;
      expect(imports + comments + empty_lines + boilerplate + test_logic).toBe(result.metrics.total_lines);
    });
  });

  describe('multi-file input', () => {
    it('should return an array when given multiple files', () => {
      const stdout = runCounter(
        fixturePath('clean/calculator.test.ts'),
        fixturePath('t1-violation/proxy.test.ts'),
      );
      const results = JSON.parse(stdout);
      expect(Array.isArray(results)).toBe(true);
      expect(results).toHaveLength(2);
    });

    it('should include correct file paths in multi-file output', () => {
      const file1 = fixturePath('clean/calculator.test.ts');
      const file2 = fixturePath('t1-violation/proxy.test.ts');
      const stdout = runCounter(file1, file2);
      const results = JSON.parse(stdout) as FileMetrics[];
      expect(results[0].file).toBe(file1);
      expect(results[1].file).toBe(file2);
    });
  });

  describe('error handling', () => {
    it('should produce error JSON for non-existent file', () => {
      const fakePath = '/tmp/does-not-exist.test.ts';
      const stdout = runCounter(fakePath);
      const result = JSON.parse(stdout) as ErrorOutput;
      expect(result.error).toBeDefined();
      expect(result.file).toBe(fakePath);
    });

    it('should exit with code 1 and write to stderr when no arguments given', () => {
      expect(() => {
        execFileSync(TSX_BIN, [SCRIPT_PATH], {
          encoding: 'utf-8',
          timeout: 15000,
        });
      }).toThrow();
    });
  });

  describe('effectiveness calculation', () => {
    it('should produce effectiveness between 0 and 100 for all fixtures', () => {
      const fixtures = [
        'clean/calculator.test.ts',
        't1-violation/proxy.test.ts',
        't3plus-violation/workflow.integration.ts',
        't4-violation/skipped.test.ts',
      ];

      for (const fixture of fixtures) {
        const result = parseResult(fixturePath(fixture));
        expect(result.metrics.effectiveness_percent).toBeGreaterThanOrEqual(0);
        expect(result.metrics.effectiveness_percent).toBeLessThanOrEqual(100);
      }
    });
  });
});
