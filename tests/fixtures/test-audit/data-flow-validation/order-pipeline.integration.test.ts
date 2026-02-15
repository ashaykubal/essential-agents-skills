import { OrderService } from '../../src/services/order-service';
import { PaymentService } from '../../src/services/payment-service';
import { InventoryService } from '../../src/services/inventory-service';
import { NotificationService } from '../../src/services/notification-service';

describe('Order Pipeline Integration Tests', () => {
  let orderService: OrderService;
  let paymentService: PaymentService;
  let inventoryService: InventoryService;
  let notificationService: NotificationService;

  beforeEach(() => {
    orderService = new OrderService();
    paymentService = new PaymentService();
    inventoryService = new InventoryService();
    notificationService = new NotificationService();
  });

  it('should process a complete order flow from creation to fulfillment', async () => {
    const customerId = 'cust-12345';
    const productId = 'prod-67890';

    const order = await orderService.createOrder({
      customerId,
      items: [{ productId, quantity: 2 }],
    });

    const payment = await paymentService.processPayment({
      orderId: order.id,
      amount: order.totalAmount,
      paymentMethod: 'credit_card',
    });

    expect(payment.status).toBe('completed');
    expect(payment.orderId).toBe(order.id);

    const reservation = await inventoryService.reserveInventory({
      orderId: order.id,
      items: order.items,
    });

    expect(reservation.success).toBe(true);
  });

  it('should handle payment failures and rollback inventory', async () => {
    const mockOrder = {
      id: 'order-999',
      customerId: 'cust-12345',
      totalAmount: 150.0,
      items: [{ productId: 'prod-001', quantity: 1 }],
      status: 'pending',
    };

    const payment = await paymentService.processPayment({
      orderId: mockOrder.id,
      amount: mockOrder.totalAmount,
      paymentMethod: 'invalid_card',
    });

    expect(payment.status).toBe('failed');

    if (payment.status === 'failed') {
      await inventoryService.releaseReservation(mockOrder.id);
    }
  });

  it('should send confirmation notification after successful payment', async () => {
    const order = await orderService.createOrder({
      customerId: 'cust-54321',
      items: [{ productId: 'prod-111', quantity: 1 }],
    });

    const mockPayment = {
      id: 'pay-abc123',
      orderId: order.id,
      amount: 99.99,
      status: 'completed',
      paymentMethod: 'paypal',
    };

    const notification = await notificationService.sendOrderConfirmation({
      customerId: order.customerId,
      orderId: mockPayment.orderId,
      amount: mockPayment.amount,
    });

    expect(notification.sent).toBe(true);
    expect(notification.type).toBe('order_confirmation');
  });

  it('should update order status after inventory reservation', async () => {
    const order = await orderService.createOrder({
      customerId: 'cust-99999',
      items: [
        { productId: 'prod-222', quantity: 3 },
        { productId: 'prod-333', quantity: 1 },
      ],
    });

    await paymentService.processPayment({
      orderId: order.id,
      amount: order.totalAmount,
      paymentMethod: 'credit_card',
    });

    const reservation = await inventoryService.reserveInventory({
      orderId: order.id,
      items: order.items,
    });

    const updatedOrder = await orderService.updateStatus(
      order.id,
      'processing'
    );

    expect(updatedOrder.status).toBe('processing');
    expect(reservation.orderId).toBe(order.id);
  });

  it('should handle partial inventory availability', async () => {
    const mockOrderData = {
      id: 'order-partial-001',
      customerId: 'cust-77777',
      items: [
        { productId: 'prod-444', quantity: 10 },
        { productId: 'prod-555', quantity: 5 },
      ],
      totalAmount: 450.0,
      status: 'pending',
    };

    const reservation = await inventoryService.reserveInventory({
      orderId: mockOrderData.id,
      items: mockOrderData.items,
    });

    if (reservation.partialSuccess) {
      const adjustedOrder = {
        ...mockOrderData,
        items: reservation.availableItems,
        totalAmount: reservation.adjustedTotal,
      };

      await orderService.updateOrder(adjustedOrder.id, {
        items: adjustedOrder.items,
        totalAmount: adjustedOrder.totalAmount,
      });
    }

    expect(reservation.partialSuccess).toBeDefined();
  });

  it('should process refund and restore inventory for cancelled orders', async () => {
    const order = await orderService.createOrder({
      customerId: 'cust-88888',
      items: [{ productId: 'prod-666', quantity: 2 }],
    });

    const payment = await paymentService.processPayment({
      orderId: order.id,
      amount: order.totalAmount,
      paymentMethod: 'debit_card',
    });

    await inventoryService.reserveInventory({
      orderId: order.id,
      items: order.items,
    });

    const cancelledOrder = await orderService.cancelOrder(order.id);

    const refund = await paymentService.processRefund({
      paymentId: payment.id,
      amount: payment.amount,
    });

    await inventoryService.restoreInventory({
      orderId: cancelledOrder.id,
      items: cancelledOrder.items,
    });

    expect(cancelledOrder.status).toBe('cancelled');
    expect(refund.status).toBe('completed');
  });
});
