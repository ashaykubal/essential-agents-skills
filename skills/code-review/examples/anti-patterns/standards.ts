/**
 * Coding Standards Anti-Patterns
 *
 * DO NOT use these patterns in production code.
 * Each example violates coding standards.
 */

// CS1: Multiple Responsibilities
// BAD: Function does validation, transformation, persistence, AND notification
async function processOrderViolation(order: Order) {
  // Validate
  if (!order.items.length) throw new Error('Empty order');

  // Transform
  order.total = order.items.reduce((sum, i) => sum + i.price, 0);

  // Persist
  await database.orders.save(order);

  // Notify
  await emailService.send(order.customer.email, 'Order confirmed');

  // Track
  await analytics.track('order_processed', order.id);

  return order;
}

// CS2: Magic Values
// BAD: Hardcoded values without explanation
function calculateDiscountViolation(total: number, customerType: string): number {
  if (total > 100) {
    if (customerType === 'gold') {
      return total * 0.2;
    } else if (customerType === 'silver') {
      return total * 0.1;
    }
  }
  return total * 0.05;
}

// CS2: Hidden Mutation
// BAD: Function modifies input object without indicating it
function normalizeUserViolation(user: User) {
  user.email = user.email.toLowerCase();
  user.name = user.name.trim();
  user.createdAt = new Date();
  // Returns void but mutated input
}

// CS2: Implicit Global State
// BAD: Function depends on undeclared global
let currentTransaction: Transaction;

function processPaymentViolation(amount: number) {
  // Uses global state without indicating dependency
  currentTransaction.amount = amount;
  currentTransaction.status = 'processing';
}

// CS2: Side Effect in Getter
// BAD: Property access triggers external action
class UserProfileViolation {
  private _views = 0;

  get viewCount(): number {
    // Side effect: logs to analytics
    analytics.track('profile_viewed', this.id);
    this._views++;
    return this._views;
  }
}

// CS3: Silent Failure
// BAD: Catches and swallows error
async function fetchDataViolation(id: string) {
  try {
    return await api.getData(id);
  } catch (error) {
    // Silent failure - no logging, no re-throw
    return null;
  }
}

// CS3: Default on Error
// BAD: Returns default instead of failing
function parseConfigViolation(raw: string): Config {
  try {
    return JSON.parse(raw);
  } catch {
    // Returns invalid default, masking the error
    return { apiUrl: 'http://localhost', timeout: 5000 };
  }
}

// CS3: Missing Input Validation
// BAD: Public function without validation
function calculateAgeViolation(birthYear: number): number {
  // No validation - negative years, future years accepted
  return new Date().getFullYear() - birthYear;
}

// CS4: Unused Imports
import { unusedHelper, anotherUnused } from './utils';
import * as everythingUnused from './everything';

// CS4: Unused Variables
function processItemsViolation(items: Item[]) {
  const unusedConfig = loadConfig();
  const unusedHelper = createHelper();

  return items.map((item) => item.name);
}

// CS4: Commented-Out Code
function handleRequestViolation(req: Request) {
  // const oldWay = processOldWay(req);
  // if (oldWay.success) {
  //   return oldWay.result;
  // }

  // TODO: Remove old code after migration
  // const legacyResult = legacyHandler(req);
  // legacyResult.transformed = true;
  // return legacyResult;

  return processNewWay(req);
}

// CS4: Dead Code
function processWithDeadCode(value: number): number {
  if (value > 0) {
    return value * 2;
  }

  return value;

  // Dead code - unreachable
  console.log('This never executes');
  return value * 3;
}

// Missing Documentation on Public API
export function calculateComplexMetric(
  data: MetricData[],
  weights: number[],
  normalize: boolean,
  threshold: number
): ComplexResult {
  // No documentation for public function with many parameters
  // Users have to read the code to understand behavior
  return internalCalculation(data, weights, normalize, threshold);
}

// Outdated Documentation
/**
 * Processes user data
 * @param user - The user to process
 * @deprecated Use newProcessUser instead
 */
function processUserViolation(user: User, options: ProcessOptions): Result {
  // Function signature changed but docs not updated
  // 'options' parameter not documented
  // Not actually deprecated
  return doProcessing(user, options);
}

// Inconsistent Error Handling
async function fetchAllViolation() {
  // Mix of error handling styles in same function
  const users = await fetch('/users').catch(() => []);

  let orders;
  try {
    orders = await fetch('/orders');
  } catch (e) {
    orders = [];
  }

  const products = await fetch('/products'); // No error handling

  return { users, orders, products };
}

// Inconsistent Async Style
async function loadDataViolation() {
  // Mix of .then() and await in same function
  const config = await loadConfig();

  return fetch(config.url)
    .then((res) => res.json())
    .then((data) => {
      return processData(data);
    });
}
