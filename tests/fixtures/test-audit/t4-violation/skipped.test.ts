import { UserService } from '../../../src/user-service';
import { EmailValidator } from '../../../src/email-validator';

describe('UserService', () => {
  let userService: UserService;

  beforeEach(() => {
    userService = new UserService();
  });

  it('should create a new user', async () => {
    const user = await userService.create({ name: 'Alice', email: 'alice@example.com' });
    expect(user.id).toBeDefined();
    expect(user.name).toBe('Alice');
  });

  it.skip('should handle duplicate email registration', async () => {
    await userService.create({ name: 'Bob', email: 'bob@example.com' });
    await expect(
      userService.create({ name: 'Bob2', email: 'bob@example.com' })
    ).rejects.toThrow('Email already exists');
  });

  it.todo('should send welcome email after registration');

  describe('profile updates', () => {
    it('should update user name', async () => {
      const user = await userService.create({ name: 'Charlie', email: 'charlie@example.com' });
      const updated = await userService.update(user.id, { name: 'Charles' });
      expect(updated.name).toBe('Charles');
    });

    it.skip('should validate email format on update', async () => {
      const user = await userService.create({ name: 'Dave', email: 'dave@example.com' });
      await expect(
        userService.update(user.id, { email: 'not-an-email' })
      ).rejects.toThrow('Invalid email');
    });
  });

  describe.skip('account deletion', () => {
    it('should soft delete user account', async () => {
      const user = await userService.create({ name: 'Eve', email: 'eve@example.com' });
      await userService.delete(user.id);
      const found = await userService.findById(user.id);
      expect(found.deletedAt).toBeDefined();
    });

    it('should prevent login after deletion', async () => {
      const user = await userService.create({ name: 'Frank', email: 'frank@example.com' });
      await userService.delete(user.id);
      await expect(userService.login(user.id)).rejects.toThrow('Account deleted');
    });
  });

  it.only('should return null for non-existent user', async () => {
    const user = await userService.findById('non-existent-id');
    expect(user).toBeNull();
  });

  it.todo('should enforce password complexity rules');
});

describe('EmailValidator', () => {
  const validator = new EmailValidator();

  it('should accept valid emails', () => {
    expect(validator.isValid('test@example.com')).toBe(true);
  });

  xit('should reject emails without domain', () => {
    expect(validator.isValid('nodomain@')).toBe(false);
  });

  it('should reject empty string', () => {
    expect(validator.isValid('')).toBe(false);
  });
});
