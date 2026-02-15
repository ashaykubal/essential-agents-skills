import { OrderService } from '../../../src/order-service';
import { PaymentService } from '../../../src/payment-service';
import { InventoryService } from '../../../src/inventory-service';

describe('Order Processing Workflow Integration', () => {
  let orderService: OrderService;
  let paymentService: PaymentService;
  let inventoryService: InventoryService;

  beforeEach(() => {
    orderService = new OrderService();
    paymentService = new PaymentService();
    inventoryService = new InventoryService();
  });

  describe('createOrder', () => {
    it('should create an order with inventory check', async () => {
      const items = [{ productId: 'PROD-1', quantity: 2 }];

      const order = await orderService.createOrder(items);

      expect(order.id).toBeDefined();
      expect(order.status).toBe('pending');
      expect(order.items).toEqual(items);
    });
  });

  describe('processOrder', () => {
    it('should process order and charge payment', async () => {
      const mockOrderData = {
        id: 'ORDER-123',
        status: 'pending',
        items: [{ productId: 'PROD-1', quantity: 2 }],
        total: 99.99,
      };

      const result = await orderService.processOrder(mockOrderData);

      expect(result.status).toBe('processed');
      expect(result.paymentId).toBeDefined();
    });

    it('should update inventory after processing', async () => {
      const mockOrderData = {
        id: 'ORDER-456',
        status: 'pending',
        items: [{ productId: 'PROD-2', quantity: 1 }],
        total: 49.99,
      };

      await orderService.processOrder(mockOrderData);

      const inventory = await inventoryService.getStock('PROD-2');
      expect(inventory.reserved).toBeGreaterThan(0);
    });
  });

  describe('completeOrder', () => {
    it('should complete the full order workflow', async () => {
      const mockOrder = { id: 'ORDER-789', status: 'pending', total: 150.0 };
      const mockProcessedOrder = { ...mockOrder, status: 'processed', paymentId: 'PAY-1' };

      const result = await orderService.completeOrder(mockProcessedOrder);

      expect(result.status).toBe('completed');
    });
  });
});
