/**
 * Tests for Parser utilities
 */

import { parse, validate } from '../../../src/parser';

// File-scope mock — but no integration sections, so NOT a T3 lead
jest.mock('../../../src/logger', () => {
  return {
    Logger: jest.fn().mockImplementation(() => ({
      info: jest.fn(),
      error: jest.fn(),
    })),
  };
});

describe('Parser', () => {
  describe('parse', () => {
    it('should parse valid input', () => {
      const result = parse('key=value');
      expect(result).toEqual({ key: 'value' });
    });

    it('should handle empty input', () => {
      const result = parse('');
      expect(result).toEqual({});
    });
  });

  describe('validate', () => {
    it('should accept valid config', () => {
      const result = validate({ key: 'value' });
      expect(result.valid).toBe(true);
    });
  });
});
