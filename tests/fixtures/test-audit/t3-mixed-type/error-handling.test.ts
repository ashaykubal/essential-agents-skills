import { categorizeError, calculateBackoff, withRetry, ErrorHandlerService } from '@/lib/error-handling';

describe('Error Categorization', () => {
  it('should categorize network errors', () => {
    const error = new Error('ECONNREFUSED');
    expect(categorizeError(error)).toBe('network');
  });

  it('should categorize validation errors', () => {
    const error = new Error('Invalid input: email required');
    expect(categorizeError(error)).toBe('validation');
  });

  it('should categorize timeout errors', () => {
    const error = new Error('Request timeout after 30000ms');
    expect(categorizeError(error)).toBe('timeout');
  });

  it('should return unknown for unrecognized errors', () => {
    const error = new Error('Something went wrong');
    expect(categorizeError(error)).toBe('unknown');
  });
});

describe('Backoff Calculation', () => {
  it('should calculate exponential backoff', () => {
    expect(calculateBackoff(0)).toBe(1000);
    expect(calculateBackoff(1)).toBe(2000);
    expect(calculateBackoff(2)).toBe(4000);
  });

  it('should cap backoff at maximum value', () => {
    expect(calculateBackoff(10)).toBe(30000);
    expect(calculateBackoff(20)).toBe(30000);
  });
});

describe('Retry Mechanism', () => {
  it('should succeed on first attempt', async () => {
    const operation = jest.fn().mockResolvedValue('success');
    const result = await withRetry(operation, { maxAttempts: 3 });

    expect(result).toBe('success');
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure and eventually succeed', async () => {
    const operation = jest.fn()
      .mockRejectedValueOnce(new Error('First failure'))
      .mockRejectedValueOnce(new Error('Second failure'))
      .mockResolvedValue('success');

    const result = await withRetry(operation, { maxAttempts: 3 });

    expect(result).toBe('success');
    expect(operation).toHaveBeenCalledTimes(3);
  });

  it('should throw after max attempts exceeded', async () => {
    const operation = jest.fn().mockRejectedValue(new Error('Persistent failure'));

    await expect(
      withRetry(operation, { maxAttempts: 3 })
    ).rejects.toThrow('Persistent failure');

    expect(operation).toHaveBeenCalledTimes(3);
  });
});

describe('ErrorHandlerService', () => {
  it('should attempt auto-repair for network errors', async () => {
    const service = new ErrorHandlerService();
    const repairFn = jest.fn().mockResolvedValue(true);

    await service.handle(new Error('ECONNREFUSED'), { repairFn });

    expect(repairFn).toHaveBeenCalled();
  });

  it('should skip repair for validation errors', async () => {
    const service = new ErrorHandlerService();
    const repairFn = jest.fn();

    await service.handle(new Error('Invalid input'), { repairFn });

    expect(repairFn).not.toHaveBeenCalled();
  });

  it('should invoke user choice callback when repair fails', async () => {
    const service = new ErrorHandlerService();
    const repairFn = jest.fn().mockResolvedValue(false);
    const userChoiceFn = jest.fn().mockResolvedValue('abort');

    const result = await service.handle(new Error('ETIMEDOUT'), {
      repairFn,
      userChoiceFn
    });

    expect(repairFn).toHaveBeenCalled();
    expect(userChoiceFn).toHaveBeenCalled();
    expect(result.action).toBe('abort');
  });
});

describe('Error Handling Integration', () => {
  it('should handle transient network errors with retry and recovery', async () => {
    const service = new ErrorHandlerService();
    const operation = jest.fn()
      .mockRejectedValueOnce(new Error('ECONNRESET'))
      .mockResolvedValue({ data: 'recovered' });

    const result = await service.executeWithRetry(operation, {
      maxAttempts: 3,
      autoRepair: true
    });

    expect(result).toEqual({ data: 'recovered' });
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it('should escalate to user when auto-repair exhausted', async () => {
    const service = new ErrorHandlerService();
    const operation = jest.fn().mockRejectedValue(new Error('ECONNREFUSED'));
    const userChoiceFn = jest.fn().mockResolvedValue('retry');

    await service.executeWithRetry(operation, {
      maxAttempts: 2,
      autoRepair: true,
      userChoiceFn
    });

    expect(userChoiceFn).toHaveBeenCalled();
  });

  it('should track error metrics across retry attempts', async () => {
    const service = new ErrorHandlerService();
    const operation = jest.fn()
      .mockRejectedValueOnce(new Error('Timeout'))
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValue('success');

    await service.executeWithRetry(operation, { maxAttempts: 5 });

    const metrics = service.getMetrics();
    expect(metrics.totalAttempts).toBe(3);
    expect(metrics.errorsByCategory).toHaveProperty('timeout');
    expect(metrics.errorsByCategory).toHaveProperty('network');
  });
});
