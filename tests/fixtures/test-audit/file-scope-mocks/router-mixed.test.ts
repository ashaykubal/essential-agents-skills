/**
 * Tests for CLI Router
 */

import { routeCommand, parseArgs } from '../../../src/cli/router';
import { Database } from '../../../src/db';

// Mock the registry for link tests
jest.mock('../../../src/workpackage/registry', () => {
  return {
    RegistryManager: jest.fn().mockImplementation(() => ({
      resolve: jest.fn((id: string) => {
        if (id === 'P2.7') return { id: 'P2.7', name: 'Test WP' };
        return null;
      }),
    })),
  };
});

// Mock the audit logger
jest.mock('../../../src/audit-log', () => {
  return {
    AuditLogger: jest.fn().mockImplementation(() => ({
      logUpdate: jest.fn(),
    })),
  };
});

describe('CLI Router', () => {
  describe('parseArgs', () => {
    it('should parse subcommand and flags', () => {
      const result = parseArgs(['show', 'TD-001', '--dir=/tmp']);
      expect(result.subcommand).toBe('show');
      expect(result.args).toEqual(['TD-001']);
    });

    it('should default to status', () => {
      const result = parseArgs(['--dir=/tmp']);
      expect(result.subcommand).toBe('status');
    });
  });

  describe('routeCommand', () => {
    it('should route to show handler', async () => {
      const result = await routeCommand(['show', 'TD-001', '--dir=/tmp']);
      expect(result.success).toBe(true);
    });

    it('should route to link handler', async () => {
      const result = await routeCommand(['link', 'TD-001', '--to=P2.7', '--dir=/tmp']);
      expect(result.success).toBe(true);
    });
  });

  describe('Integration: Full workflows', () => {
    it('should complete link then unlink workflow', async () => {
      const linkResult = await routeCommand(['link', 'TD-001', '--to=P2.7', '--dir=/tmp']);
      expect(linkResult.success).toBe(true);

      const unlinkResult = await routeCommand(['unlink', 'TD-001', '--dir=/tmp']);
      expect(unlinkResult.success).toBe(true);
    });

    it('should complete supersession workflow', async () => {
      const result = await routeCommand(['supersede', 'TD-001', 'TD-002', '--dir=/tmp']);
      expect(result.success).toBe(true);
    });
  });
});
