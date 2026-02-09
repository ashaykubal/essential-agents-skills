/**
 * Coding Standards Recommended Patterns
 *
 * These examples demonstrate good coding standards.
 */

// CS1: Single Responsibility - Each function does one thing
async function validateOrder(order: Order): Promise<void> {
  if (!order.items.length) {
    throw new OrderValidationError('Empty order');
  }
}

function calculateOrderTotal(order: Order): number {
  return order.items.reduce((sum, item) => sum + item.price, 0);
}

async function saveOrder(order: Order): Promise<void> {
  await database.orders.save(order);
}

async function notifyOrderConfirmation(order: Order): Promise<void> {
  await emailService.send(order.customer.email, 'Order confirmed');
}

async function trackOrderProcessed(order: Order): Promise<void> {
  await analytics.track('order_processed', order.id);
}

// Composition of single-responsibility functions
async function processOrderClean(order: Order): Promise<Order> {
  await validateOrder(order);
  order.total = calculateOrderTotal(order);
  await saveOrder(order);
  await notifyOrderConfirmation(order);
  await trackOrderProcessed(order);
  return order;
}

// CS2: Named Constants - No Magic Values
const DISCOUNT_THRESHOLDS = {
  MINIMUM_FOR_DISCOUNT: 100,
} as const;

const DISCOUNT_RATES = {
  GOLD: 0.2,
  SILVER: 0.1,
  DEFAULT: 0.05,
} as const;

type CustomerType = 'gold' | 'silver' | 'bronze';

function calculateDiscountClean(total: number, customerType: CustomerType): number {
  if (total <= DISCOUNT_THRESHOLDS.MINIMUM_FOR_DISCOUNT) {
    return total * DISCOUNT_RATES.DEFAULT;
  }

  const rate = customerType === 'gold'
    ? DISCOUNT_RATES.GOLD
    : customerType === 'silver'
    ? DISCOUNT_RATES.SILVER
    : DISCOUNT_RATES.DEFAULT;

  return total * rate;
}

// CS2: Explicit Transformation - Return new object instead of mutation
function normalizeUserClean(user: User): NormalizedUser {
  return {
    ...user,
    email: user.email.toLowerCase(),
    name: user.name.trim(),
    normalizedAt: new Date(),
  };
}

// CS2: Explicit Dependencies - Pass state as parameter
interface Transaction {
  id: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed';
}

function processPaymentClean(
  transaction: Transaction,
  amount: number
): Transaction {
  return {
    ...transaction,
    amount,
    status: 'processing',
  };
}

// CS2: Pure Getters - No side effects
class UserProfileClean {
  private _views = 0;
  private readonly id: string;

  get viewCount(): number {
    return this._views;
  }

  // Side effect is explicit method, not hidden in getter
  recordView(): void {
    this._views++;
  }

  // Analytics tracking is separate concern
  trackProfileView(): void {
    analytics.track('profile_viewed', this.id);
  }
}

// CS3: Fail Fast - Propagate errors with context
async function fetchDataClean(id: string): Promise<Data> {
  try {
    return await api.getData(id);
  } catch (error) {
    // Log for debugging
    console.error(`Failed to fetch data for id=${id}:`, error);
    // Re-throw with context
    throw new DataFetchError(`Failed to fetch data: ${id}`, { cause: error });
  }
}

// CS3: Fail on Invalid Input
function parseConfigClean(raw: string): Config {
  try {
    const parsed = JSON.parse(raw);
    return validateConfig(parsed);
  } catch (error) {
    throw new ConfigParseError('Invalid configuration', { cause: error });
  }
}

// CS3: Input Validation at Boundaries
function calculateAgeClean(birthYear: number): number {
  const currentYear = new Date().getFullYear();

  if (!Number.isInteger(birthYear)) {
    throw new ValidationError('Birth year must be an integer');
  }
  if (birthYear < 1900) {
    throw new ValidationError('Birth year too far in the past');
  }
  if (birthYear > currentYear) {
    throw new ValidationError('Birth year cannot be in the future');
  }

  return currentYear - birthYear;
}

// CS4: Clean Imports - Only import what's used
import { neededHelper } from './utils';
import type { Config, Data } from './types';

// CS4: All Variables Used
function processItemsClean(items: Item[]): string[] {
  // Only declare what's needed
  return items.map((item) => item.name);
}

// CS4: No Commented-Out Code - Delete unused code
function handleRequestClean(req: Request) {
  // Old implementation deleted, not commented
  return processNewWay(req);
}

// CS4: No Dead Code - All paths reachable
function processClean(value: number): number {
  if (value > 0) {
    return value * 2;
  }
  return value;
}

/**
 * Calculate a complex weighted metric from data points.
 *
 * @param data - Array of metric data points to analyze
 * @param weights - Weight for each data point (must match data length)
 * @param normalize - Whether to normalize the result to 0-1 range
 * @param threshold - Minimum value to include in calculation
 * @returns Calculated metric with metadata
 *
 * @example
 * ```typescript
 * const result = calculateComplexMetric(
 *   [{ value: 10 }, { value: 20 }],
 *   [0.3, 0.7],
 *   true,
 *   5
 * );
 * ```
 */
export function calculateComplexMetricClean(
  data: MetricData[],
  weights: number[],
  normalize: boolean,
  threshold: number
): ComplexResult {
  validateInputs(data, weights, threshold);
  return internalCalculation(data, weights, normalize, threshold);
}

// Consistent Error Handling
async function fetchAllClean(): Promise<FetchResult> {
  // Consistent try-catch for all operations
  try {
    const [users, orders, products] = await Promise.all([
      fetch('/users').then((r) => r.json()),
      fetch('/orders').then((r) => r.json()),
      fetch('/products').then((r) => r.json()),
    ]);

    return { users, orders, products, success: true };
  } catch (error) {
    console.error('Failed to fetch data:', error);
    throw new DataFetchError('Failed to load data', { cause: error });
  }
}

// Consistent Async Style
async function loadDataClean(): Promise<ProcessedData> {
  // Consistent await throughout
  const config = await loadConfig();
  const response = await fetch(config.url);
  const data = await response.json();
  return processData(data);
}
