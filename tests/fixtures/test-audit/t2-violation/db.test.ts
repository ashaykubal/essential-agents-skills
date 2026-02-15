import { ConfigService } from '../../../src/config';
import { Database } from '../../../src/database';
import { Logger } from '../../../src/logger';
import { EventEmitter } from '../../../src/events';

jest.mock('../../../src/database');
jest.mock('../../../src/logger');
jest.mock('../../../src/events');

const mockDb = {
  save: jest.fn().mockResolvedValue({ id: 'config-1' }),
  find: jest.fn().mockResolvedValue({ id: 'config-1', value: 'test' }),
  delete: jest.fn().mockResolvedValue(true),
};

const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
};

const mockEvents = {
  emit: jest.fn(),
};

describe('ConfigService', () => {
  let configService: ConfigService;

  beforeEach(() => {
    (Database as jest.Mock).mockImplementation(() => mockDb);
    (Logger as jest.Mock).mockImplementation(() => mockLogger);
    (EventEmitter as jest.Mock).mockImplementation(() => mockEvents);

    configService = new ConfigService();
    jest.clearAllMocks();
  });

  describe('saveConfig', () => {
    it('should save configuration', async () => {
      const config = { key: 'theme', value: 'dark' };

      await configService.saveConfig(config);

      expect(mockDb.save).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalled();
    });

    it('should emit event after save', async () => {
      const config = { key: 'language', value: 'en' };

      await configService.saveConfig(config);

      expect(mockEvents.emit).toHaveBeenCalled();
    });
  });

  describe('deleteConfig', () => {
    it('should delete configuration', async () => {
      await configService.deleteConfig('config-1');

      expect(mockDb.delete).toHaveBeenCalled();
    });
  });

  describe('getConfig', () => {
    it('should return configuration value', async () => {
      const result = await configService.getConfig('config-1');

      expect(result).toEqual({ id: 'config-1', value: 'test' });
    });
  });
});
