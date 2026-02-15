import { NotificationService } from '../../src/services/notification-service';
import { EmailProvider } from '../../src/providers/email-provider';
import { SmsProvider } from '../../src/providers/sms-provider';
import { createTestUser, buildNotification } from '../helpers/test-data-factory';

describe('NotificationService', () => {
  let notificationService: NotificationService;
  let emailProvider: EmailProvider;
  let smsProvider: SmsProvider;

  beforeEach(() => {
    emailProvider = new EmailProvider();
    smsProvider = new SmsProvider();
    notificationService = new NotificationService(emailProvider, smsProvider);
  });

  it('should send email notification to user', async () => {
    const user = createTestUser({ email: 'test@example.com' });
    const notification = buildNotification({
      userId: user.id,
      type: 'welcome',
      channel: 'email',
    });

    const result = await notificationService.send(notification);

    expect(result.success).toBe(true);
    expect(result.channel).toBe('email');
    expect(result.recipientId).toBe(user.id);
  });

  it('should queue notifications when provider is unavailable', async () => {
    const user = createTestUser();
    const notification = buildNotification({
      userId: user.id,
      type: 'alert',
      priority: 'high',
    });

    await emailProvider.setAvailability(false);

    const result = await notificationService.send(notification);

    expect(result.queued).toBe(true);

    const queuedItem = await notificationService.getQueuedNotification(
      notification.id
    );

    expect(queuedItem.status).toBe('pending');
  });

  it('should send multi-channel notification for high priority alerts', async () => {
    const user = createTestUser({
      email: 'alert@example.com',
      phone: '+1234567890',
    });

    const emailNotification = buildNotification({
      userId: user.id,
      type: 'security_alert',
      channel: 'email',
      priority: 'critical',
    });

    const emailResult = await notificationService.send(emailNotification);

    const smsNotification = buildNotification({
      userId: user.id,
      type: 'security_alert',
      channel: 'sms',
      priority: 'critical',
    });

    const smsResult = await notificationService.send(smsNotification);

    expect(emailResult.success).toBe(true);
    expect(smsResult.success).toBe(true);
  });

  it('should batch process scheduled notifications', async () => {
    const users = [
      createTestUser({ id: 'user-001' }),
      createTestUser({ id: 'user-002' }),
      createTestUser({ id: 'user-003' }),
    ];

    const notifications = users.map((user) =>
      buildNotification({
        userId: user.id,
        type: 'newsletter',
        scheduledFor: new Date('2026-02-14T10:00:00Z'),
      })
    );

    const batchId = await notificationService.scheduleBatch(notifications);
    const batch = await notificationService.getBatch(batchId);

    expect(batch.notifications.length).toBe(3);
    expect(batch.status).toBe('scheduled');

    const processedBatch = await notificationService.processBatch(batchId);

    expect(processedBatch.completedCount).toBe(3);
  });

  it('should retry failed notifications with exponential backoff', async () => {
    const user = createTestUser();
    const notification = buildNotification({
      userId: user.id,
      type: 'transaction_receipt',
      retryPolicy: 'exponential',
    });

    await emailProvider.simulateFailure(3);

    const result = await notificationService.sendWithRetry(notification);

    const attempts = await notificationService.getDeliveryAttempts(
      notification.id
    );

    expect(attempts.length).toBeGreaterThan(1);
    expect(result.success).toBe(true);
  });

  it('should track delivery status and update metrics', async () => {
    const user = createTestUser();
    const notification = buildNotification({
      userId: user.id,
      type: 'promotional',
    });

    const sendResult = await notificationService.send(notification);

    const delivery = await notificationService.trackDelivery(sendResult.id);

    await notificationService.recordOpen(sendResult.id);

    const metrics = await notificationService.getMetrics({
      notificationId: notification.id,
    });

    expect(delivery.status).toBe('delivered');
    expect(metrics.openRate).toBeGreaterThan(0);
  });
});
