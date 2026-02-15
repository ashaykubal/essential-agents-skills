/**
 * Tests for skip-detector.ts
 *
 * Runs the actual script via tsx against real fixture files and validates
 * JSON output correctness. No mocking of the system under test.
 */

import { execFileSync } from 'child_process';
import * as path from 'path';

// --- Helpers ---

const SCRIPT_PATH = path.resolve(__dirname, '..', '..', 'skills', 'test-audit', 'scripts', 'skip-detector.ts');
const FIXTURES_ROOT = path.resolve(__dirname, '..', 'fixtures', 'test-audit');
const TSX_BIN = path.resolve(__dirname, '..', '..', 'skills', 'test-audit', 'scripts', 'node_modules', '.bin', 'tsx');

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

function runDetector(...filePaths: string[]): string {
  return execFileSync(TSX_BIN, [SCRIPT_PATH, ...filePaths], {
    encoding: 'utf-8',
    timeout: 15000,
  });
}

function parseResult(filePath: string): FileResult {
  const stdout = runDetector(filePath);
  return JSON.parse(stdout) as FileResult;
}

function fixturePath(subPath: string): string {
  return path.resolve(FIXTURES_ROOT, subPath);
}

// --- Tests ---

describe('skip-detector.ts', () => {

  describe('T4 fixture detection (skipped.test.ts)', () => {
    let result: FileResult;

    beforeAll(() => {
      result = parseResult(fixturePath('t4-violation/skipped.test.ts'));
    });

    it('should find exactly 7 markers', () => {
      expect(result.markers).toHaveLength(7);
    });

    it('should report all markers with rule T4', () => {
      for (const marker of result.markers) {
        expect(marker.rule).toBe('T4');
      }
    });

    it('should detect it.skip on line 17', () => {
      const marker = result.markers.find(m => m.line === 17);
      expect(marker).toBeDefined();
      expect(marker!.type).toBe('it.skip');
      expect(marker!.severity).toBe('medium');
      expect(marker!.test_name).toBe('should handle duplicate email registration');
    });

    it('should detect it.todo on line 24', () => {
      const marker = result.markers.find(m => m.line === 24);
      expect(marker).toBeDefined();
      expect(marker!.type).toBe('it.todo');
      expect(marker!.severity).toBe('low');
      expect(marker!.test_name).toBe('should send welcome email after registration');
    });

    it('should detect it.skip on line 33', () => {
      const marker = result.markers.find(m => m.line === 33);
      expect(marker).toBeDefined();
      expect(marker!.type).toBe('it.skip');
      expect(marker!.severity).toBe('medium');
      expect(marker!.test_name).toBe('should validate email format on update');
    });

    it('should detect describe.skip on line 41', () => {
      const marker = result.markers.find(m => m.line === 41);
      expect(marker).toBeDefined();
      expect(marker!.type).toBe('describe.skip');
      expect(marker!.severity).toBe('medium');
      expect(marker!.test_name).toBe('account deletion');
    });

    it('should detect it.only on line 56', () => {
      const marker = result.markers.find(m => m.line === 56);
      expect(marker).toBeDefined();
      expect(marker!.type).toBe('it.only');
      expect(marker!.severity).toBe('high');
      expect(marker!.test_name).toBe('should return null for non-existent user');
    });

    it('should detect it.todo on line 61', () => {
      const marker = result.markers.find(m => m.line === 61);
      expect(marker).toBeDefined();
      expect(marker!.type).toBe('it.todo');
      expect(marker!.severity).toBe('low');
      expect(marker!.test_name).toBe('should enforce password complexity rules');
    });

    it('should detect xit on line 71', () => {
      const marker = result.markers.find(m => m.line === 71);
      expect(marker).toBeDefined();
      expect(marker!.type).toBe('xit');
      expect(marker!.severity).toBe('medium');
      expect(marker!.test_name).toBe('should reject emails without domain');
    });
  });

  describe('summary counts (skipped.test.ts)', () => {
    let result: FileResult;

    beforeAll(() => {
      result = parseResult(fixturePath('t4-violation/skipped.test.ts'));
    });

    it('should report skip_count = 4', () => {
      expect(result.summary.skip_count).toBe(4);
    });

    it('should report only_count = 1', () => {
      expect(result.summary.only_count).toBe(1);
    });

    it('should report todo_count = 2', () => {
      expect(result.summary.todo_count).toBe(2);
    });

    it('should have summary counts that add up to total markers', () => {
      const { skip_count, only_count, todo_count } = result.summary;
      expect(skip_count + only_count + todo_count).toBe(result.markers.length);
    });
  });

  describe('marker ordering', () => {
    it('should return markers sorted by line number', () => {
      const result = parseResult(fixturePath('t4-violation/skipped.test.ts'));
      for (let i = 1; i < result.markers.length; i++) {
        expect(result.markers[i].line).toBeGreaterThan(result.markers[i - 1].line);
      }
    });
  });

  describe('clean fixture (calculator.test.ts)', () => {
    let result: FileResult;

    beforeAll(() => {
      result = parseResult(fixturePath('clean/calculator.test.ts'));
    });

    it('should find zero markers', () => {
      expect(result.markers).toHaveLength(0);
    });

    it('should report all summary counts as 0', () => {
      expect(result.summary.skip_count).toBe(0);
      expect(result.summary.only_count).toBe(0);
      expect(result.summary.todo_count).toBe(0);
    });

    it('should include the resolved file path', () => {
      expect(result.file).toBe(fixturePath('clean/calculator.test.ts'));
    });
  });

  describe('multi-file input', () => {
    it('should return an array when given multiple files', () => {
      const stdout = runDetector(
        fixturePath('t4-violation/skipped.test.ts'),
        fixturePath('clean/calculator.test.ts'),
      );
      const results = JSON.parse(stdout);
      expect(Array.isArray(results)).toBe(true);
      expect(results).toHaveLength(2);
    });

    it('should include correct file paths in multi-file output', () => {
      const file1 = fixturePath('t4-violation/skipped.test.ts');
      const file2 = fixturePath('clean/calculator.test.ts');
      const stdout = runDetector(file1, file2);
      const results = JSON.parse(stdout) as FileResult[];
      expect(results[0].file).toBe(file1);
      expect(results[1].file).toBe(file2);
    });

    it('should return single object (not array) for single file input', () => {
      const stdout = runDetector(fixturePath('clean/calculator.test.ts'));
      const result = JSON.parse(stdout);
      expect(Array.isArray(result)).toBe(false);
      expect(result.file).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should produce error JSON for non-existent file', () => {
      const fakePath = '/tmp/does-not-exist.test.ts';
      const stdout = runDetector(fakePath);
      const result = JSON.parse(stdout) as ErrorOutput;
      expect(result.error).toBeDefined();
      expect(result.file).toBe(fakePath);
    });

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
  });

  describe('severity classification', () => {
    let result: FileResult;

    beforeAll(() => {
      result = parseResult(fixturePath('t4-violation/skipped.test.ts'));
    });

    it('should classify .skip markers as medium severity', () => {
      const skipMarkers = result.markers.filter(m => m.type.includes('.skip'));
      for (const marker of skipMarkers) {
        expect(marker.severity).toBe('medium');
      }
    });

    it('should classify .only markers as high severity', () => {
      const onlyMarkers = result.markers.filter(m => m.type.includes('.only'));
      for (const marker of onlyMarkers) {
        expect(marker.severity).toBe('high');
      }
    });

    it('should classify .todo markers as low severity', () => {
      const todoMarkers = result.markers.filter(m => m.type.includes('.todo'));
      for (const marker of todoMarkers) {
        expect(marker.severity).toBe('low');
      }
    });

    it('should classify x-prefixed markers as medium severity', () => {
      const xMarkers = result.markers.filter(m => m.type.startsWith('x'));
      expect(xMarkers.length).toBeGreaterThan(0);
      for (const marker of xMarkers) {
        expect(marker.severity).toBe('medium');
      }
    });
  });
});
