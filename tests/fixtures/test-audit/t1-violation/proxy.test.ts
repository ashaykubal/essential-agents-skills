import * as child_process from 'child_process';
import { ProxyManager } from '../../../src/proxy';

const mockProcess = {
  pid: 12345,
  stdout: { on: jest.fn() },
  stderr: { on: jest.fn() },
  on: jest.fn((event, callback) => {
    if (event === 'spawn') callback();
  }),
  kill: jest.fn(),
};

jest.spyOn(child_process, 'spawn').mockReturnValue(mockProcess as any);

describe('ProxyManager', () => {
  let proxyManager: ProxyManager;

  beforeEach(() => {
    proxyManager = new ProxyManager();
    jest.clearAllMocks();
  });

  afterEach(() => {
    proxyManager.stop();
  });

  describe('start', () => {
    it('should start the proxy successfully', async () => {
      const result = await proxyManager.start(8096);

      expect(child_process.spawn).toHaveBeenCalledWith(
        'proxy',
        ['--port', '8096'],
        expect.any(Object)
      );
      expect(result.pid).toBe(12345);
      expect(result.status).toBe('running');
    });

    it('should handle proxy startup failure', async () => {
      mockProcess.on.mockImplementation((event, callback) => {
        if (event === 'error') callback(new Error('Failed to start'));
      });

      await expect(proxyManager.start(8096)).rejects.toThrow('Failed to start');
    });
  });

  describe('stop', () => {
    it('should stop the proxy', async () => {
      await proxyManager.start(8096);
      await proxyManager.stop();

      expect(mockProcess.kill).toHaveBeenCalled();
    });
  });
});
