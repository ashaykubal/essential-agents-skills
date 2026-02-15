/**
 * Tests for integration-mock-detector.ts
 *
 * Runs the actual script via tsx against real fixture files and validates
 * JSON output correctness. No mocking of the system under test.
 */

import { execFileSync } from 'child_process';
import * as path from 'path';

// --- Helpers ---

const SCRIPT_PATH = path.resolve(__dirname, '..', '..', 'skills', 'test-audit', 'scripts', 'integration-mock-detector.ts');
const FIXTURES_ROOT = path.resolve(__dirname, '..', 'fixtures', 'test-audit');
const TSX_BIN = path.resolve(__dirname, '..', '..', 'skills', 'test-audit', 'scripts', 'node_modules', '.bin', 'tsx');

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

describe('integration-mock-detector.ts', () => {

  describe('t3-mixed-type fixture (error-handling.test.ts)', () => {
    let result: FileResult;

    beforeAll(() => {
      result = parseResult(fixturePath('t3-mixed-type/error-handling.test.ts'));
    });

    it('should detect the integration section by keyword in describe name', () => {
      const section = result.sections.find(s => s.name === 'Error Handling Integration');
      expect(section).toBeDefined();
      expect(section!.type).toBe('integration');
      expect(section!.signal).toBe('keyword_in_name');
    });

    it('should report exactly 1 integration section', () => {
      expect(result.summary.integration_sections).toBe(1);
    });

    it('should report 0 e2e sections', () => {
      expect(result.summary.e2e_sections).toBe(0);
    });

    it('should find exactly 4 T3 leads in the integration section', () => {
      expect(result.leads).toHaveLength(4);
      expect(result.summary.leads_count).toBe(4);
    });

    it('should report all leads as T3 type with high confidence', () => {
      for (const lead of result.leads) {
        expect(lead.type).toBe('T3');
        expect(lead.confidence).toBe('high');
        expect(lead.block_type).toBe('integration');
      }
    });

    it('should detect jest.fn() chain on line 108', () => {
      const lead = result.leads.find(l => l.line === 108);
      expect(lead).toBeDefined();
      expect(lead!.mock_pattern).toContain('jest.fn()');
      expect(lead!.enclosing_block).toBe('Error Handling Integration');
    });

    it('should detect jest.fn().mockRejectedValue() on line 123', () => {
      const lead = result.leads.find(l => l.line === 123);
      expect(lead).toBeDefined();
      expect(lead!.mock_pattern).toBe('jest.fn().mockRejectedValue()');
    });

    it('should detect jest.fn().mockResolvedValue() on line 124', () => {
      const lead = result.leads.find(l => l.line === 124);
      expect(lead).toBeDefined();
      expect(lead!.mock_pattern).toBe('jest.fn().mockResolvedValue()');
    });

    it('should detect jest.fn() triple chain on line 137', () => {
      const lead = result.leads.find(l => l.line === 137);
      expect(lead).toBeDefined();
      expect(lead!.mock_pattern).toContain('jest.fn()');
      expect(lead!.mock_pattern).toContain('mockRejectedValueOnce()');
      expect(lead!.mock_pattern).toContain('mockResolvedValue()');
    });

    it('should NOT flag jest.fn() calls in unit test sections', () => {
      // Lines 40, 48, 60, 73, 82, 91, 92 are jest.fn() in unit sections
      // None of them should appear in leads
      const unitLines = [40, 48, 60, 73, 82, 91, 92];
      for (const line of unitLines) {
        const lead = result.leads.find(l => l.line === line);
        expect(lead).toBeUndefined();
      }
    });

    it('should include suggestion text in all leads', () => {
      for (const lead of result.leads) {
        expect(lead.suggestion).toContain('Integration tests should use real operations');
        expect(lead.message).toContain('integration test block');
      }
    });
  });

  describe('clean fixture (calculator.test.ts)', () => {
    let result: FileResult;

    beforeAll(() => {
      result = parseResult(fixturePath('clean/calculator.test.ts'));
    });

    it('should find 0 sections', () => {
      expect(result.sections).toHaveLength(0);
    });

    it('should find 0 leads', () => {
      expect(result.leads).toHaveLength(0);
    });

    it('should report all summary counts as 0', () => {
      expect(result.summary.sections_found).toBe(0);
      expect(result.summary.integration_sections).toBe(0);
      expect(result.summary.e2e_sections).toBe(0);
      expect(result.summary.leads_count).toBe(0);
      expect(result.summary.mock_calls_in_integration).toBe(0);
      expect(result.summary.mock_calls_in_e2e).toBe(0);
    });

    it('should include the resolved file path', () => {
      expect(result.file).toBe(fixturePath('clean/calculator.test.ts'));
    });
  });

  describe('mixed-types fixture (everything.test.ts)', () => {
    let result: FileResult;

    beforeAll(() => {
      result = parseResult(fixturePath('mixed-types/everything.test.ts'));
    });

    it('should detect integration section by keyword', () => {
      const section = result.sections.find(s => s.type === 'integration');
      expect(section).toBeDefined();
      expect(section!.name).toBe('UserService Integration Tests');
      expect(section!.signal).toBe('keyword_in_name');
    });

    it('should detect e2e section by keyword', () => {
      const section = result.sections.find(s => s.type === 'e2e');
      expect(section).toBeDefined();
      expect(section!.name).toBe('User Registration E2E');
      expect(section!.signal).toBe('keyword_in_name');
    });

    it('should find 2 sections (1 integration + 1 e2e)', () => {
      expect(result.summary.sections_found).toBe(2);
      expect(result.summary.integration_sections).toBe(1);
      expect(result.summary.e2e_sections).toBe(1);
    });

    it('should find 0 leads (no mock calls in integration/e2e sections)', () => {
      expect(result.leads).toHaveLength(0);
      expect(result.summary.leads_count).toBe(0);
    });
  });

  describe('lead ordering', () => {
    it('should return leads sorted by line number', () => {
      const result = parseResult(fixturePath('t3-mixed-type/error-handling.test.ts'));
      for (let i = 1; i < result.leads.length; i++) {
        expect(result.leads[i].line).toBeGreaterThan(result.leads[i - 1].line);
      }
    });
  });

  describe('chain deduplication', () => {
    it('should report one lead per outermost chain call, not per link', () => {
      const result = parseResult(fixturePath('t3-mixed-type/error-handling.test.ts'));
      // Line 108: jest.fn().mockRejectedValueOnce().mockResolvedValue() = 1 lead, not 3
      // Line 137: jest.fn().mockRejectedValueOnce().mockRejectedValueOnce().mockResolvedValue() = 1 lead, not 4
      expect(result.leads).toHaveLength(4); // 4 separate chains, not 11+ links
    });

    it('should include full chain pattern in mock_pattern string', () => {
      const result = parseResult(fixturePath('t3-mixed-type/error-handling.test.ts'));
      const lead108 = result.leads.find(l => l.line === 108);
      expect(lead108).toBeDefined();
      // Pattern should show full chain, not just inner jest.fn()
      expect(lead108!.mock_pattern).toContain('mockRejectedValueOnce()');
      expect(lead108!.mock_pattern).toContain('mockResolvedValue()');
    });
  });

  describe('multi-file input', () => {
    it('should return an array when given multiple files', () => {
      const stdout = runDetector(
        fixturePath('clean/calculator.test.ts'),
        fixturePath('t3-mixed-type/error-handling.test.ts'),
      );
      const results = JSON.parse(stdout);
      expect(Array.isArray(results)).toBe(true);
      expect(results).toHaveLength(2);
    });

    it('should include correct file paths in multi-file output', () => {
      const file1 = fixturePath('clean/calculator.test.ts');
      const file2 = fixturePath('t3-mixed-type/error-handling.test.ts');
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

  describe('file-scope mock detection', () => {
    describe('router-mixed.test.ts (file-scope mocks + integration section)', () => {
      let result: FileResult;

      beforeAll(() => {
        result = parseResult(fixturePath('file-scope-mocks/router-mixed.test.ts'));
      });

      it('should detect the integration section', () => {
        const section = result.sections.find(s => s.name === 'Integration: Full workflows');
        expect(section).toBeDefined();
        expect(section!.type).toBe('integration');
      });

      it('should detect file-scope jest.mock() affecting integration section', () => {
        const fileScopeLeads = result.leads.filter(l =>
          l.enclosing_block.startsWith('FILE_SCOPE')
        );
        expect(fileScopeLeads.length).toBeGreaterThanOrEqual(2);
      });

      it('should report each file-scope mock with correct pattern', () => {
        const fileScopeLeads = result.leads.filter(l =>
          l.enclosing_block.startsWith('FILE_SCOPE')
        );
        const patterns = fileScopeLeads.map(l => l.mock_pattern);
        expect(patterns).toContain('jest.mock()');
      });

      it('should reference the affected integration section in enclosing_block', () => {
        const fileScopeLeads = result.leads.filter(l =>
          l.enclosing_block.startsWith('FILE_SCOPE')
        );
        for (const lead of fileScopeLeads) {
          expect(lead.enclosing_block).toContain('Integration: Full workflows');
        }
      });

      it('should have file_scope_mocks count in summary', () => {
        expect(result.summary.file_scope_mocks).toBeGreaterThanOrEqual(2);
      });

      it('should include suggestion about file splitting', () => {
        const fileScopeLeads = result.leads.filter(l =>
          l.enclosing_block.startsWith('FILE_SCOPE')
        );
        for (const lead of fileScopeLeads) {
          expect(lead.suggestion).toContain('separate test file');
        }
      });
    });

    describe('unit-only.test.ts (file-scope mocks, no integration sections)', () => {
      let result: FileResult;

      beforeAll(() => {
        result = parseResult(fixturePath('file-scope-mocks/unit-only.test.ts'));
      });

      it('should find 0 integration/e2e sections', () => {
        expect(result.summary.integration_sections).toBe(0);
        expect(result.summary.e2e_sections).toBe(0);
      });

      it('should NOT flag file-scope mocks when no integration sections exist', () => {
        expect(result.leads).toHaveLength(0);
        expect(result.summary.file_scope_mocks).toBe(0);
      });
    });
  });

  describe('summary accuracy', () => {
    it('should have mock_calls_in_integration match leads with block_type integration', () => {
      const result = parseResult(fixturePath('t3-mixed-type/error-handling.test.ts'));
      const integrationLeads = result.leads.filter(l => l.block_type === 'integration');
      expect(result.summary.mock_calls_in_integration).toBe(integrationLeads.length);
    });

    it('should have mock_calls_in_e2e match leads with block_type e2e', () => {
      const result = parseResult(fixturePath('t3-mixed-type/error-handling.test.ts'));
      const e2eLeads = result.leads.filter(l => l.block_type === 'e2e');
      expect(result.summary.mock_calls_in_e2e).toBe(e2eLeads.length);
    });

    it('should have leads_count match total leads array length', () => {
      const result = parseResult(fixturePath('t3-mixed-type/error-handling.test.ts'));
      expect(result.summary.leads_count).toBe(result.leads.length);
    });

    it('should have sections_found match integration + e2e counts', () => {
      const result = parseResult(fixturePath('mixed-types/everything.test.ts'));
      expect(result.summary.sections_found).toBe(
        result.summary.integration_sections + result.summary.e2e_sections
      );
    });
  });
});
