/**
 * Linting Recommended Patterns
 *
 * These examples demonstrate clean code practices.
 */

// Early returns instead of deep nesting
function processOrderSafe(order: Order | null) {
  if (!order) return;
  if (!order.items?.length) return;

  for (const item of order.items) {
    if (item.quantity <= 0) continue;
    if (item.price <= 0) continue;

    console.log(item);
  }
}

// Small, focused functions
async function handleCheckoutSafe(cart: Cart, user: User): Promise<Order> {
  validateCart(cart);

  const totals = calculateTotals(cart, user);
  const order = createOrder(cart, user, totals);

  await saveOrder(order, cart);
  await sendNotifications(order, user);
  await updateUserStats(user, totals.total);

  return order;
}

function validateCart(cart: Cart): void {
  if (!cart.items.length) throw new Error('Empty cart');

  for (const item of cart.items) {
    if (!item.available) throw new Error('Item unavailable');
    if (item.quantity > item.stock) throw new Error('Insufficient stock');
  }
}

interface Totals {
  subtotal: number;
  discount: number;
  tax: number;
  shipping: number;
  total: number;
}

function calculateTotals(cart: Cart, user: User): Totals {
  const subtotal = cart.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const discount = user.isPremium ? subtotal * 0.1 : 0;
  const tax = (subtotal - discount) * 0.08;
  const shipping = subtotal > 100 ? 0 : 10;
  const total = subtotal - discount + tax + shipping;

  return { subtotal, discount, tax, shipping, total };
}

// Descriptive naming
function transformProductData(rawProducts: RawProduct[]): TransformedProduct[] {
  return rawProducts.map((product) => {
    const discountedPrice = product.basePrice * 2;
    return { ...product, discountedPrice };
  });
}

// Meaningful variable names
function calculateRectangleArea(
  width: number,
  height: number,
  margin: number,
  padding: number
): number {
  const innerWidth = width - margin * 2;
  const innerHeight = height - padding * 2;
  const area = innerWidth * innerHeight;
  return area;
}

// Accurate naming
const currentUser = getUser(); // Singular, clear
const validationResult = validate(data); // Describes what it returns
const permanentDiscountRate = 0.15; // Accurate description

// Single responsibility functions
function parseInput(input: string): ParsedData {
  return JSON.parse(input);
}

function validateData(data: ParsedData): void {
  if (!data.name) throw new Error('Missing name');
}

function transformData(data: ParsedData): TransformedData {
  return { ...data, name: data.name.toUpperCase() };
}

function saveData(data: TransformedData): void {
  localStorage.setItem('data', JSON.stringify(data));
}

function notifyDataUpdate(data: TransformedData): void {
  dispatchEvent(new CustomEvent('dataUpdated', { detail: data }));
}

function processInput(input: string): TransformedData {
  const parsed = parseInput(input);
  validateData(parsed);
  const transformed = transformData(parsed);
  saveData(transformed);
  notifyDataUpdate(transformed);
  return transformed;
}

// Named conditions for complex logic
function canAccessResource(user: User, resource: Resource): boolean {
  const isAdmin = user.role === 'admin';
  const isManagerOfDepartment =
    user.role === 'manager' && user.department === resource.department;
  const isEmployeeWithPublicAccess =
    user.role === 'employee' &&
    user.department === resource.department &&
    resource.accessLevel === 'public';
  const hasDirectPermission = user.permissions.includes(resource.id);
  const hasSharedAccess =
    resource.sharedWith.includes(user.id) && !resource.revoked;

  return (
    isAdmin ||
    isManagerOfDepartment ||
    isEmployeeWithPublicAccess ||
    hasDirectPermission ||
    hasSharedAccess
  );
}

// Extract shared logic to avoid duplication
function validateEmail(email: string): void {
  if (!email) throw new Error('Email required');
  if (!email.includes('@')) throw new Error('Invalid email');
  if (email.length > 255) throw new Error('Email too long');
}

function createUserSafe(data: UserData) {
  validateEmail(data.email);
  // ...create user
}

function updateUserSafe(id: string, data: UserData) {
  validateEmail(data.email);
  // ...update user
}

// Consistent async style
async function fetchDataConsistent() {
  const response = await fetch('/api/data');
  const data = await response.json();
  return processData(data);
}

async function fetchOtherDataConsistent() {
  const response = await fetch('/api/other');
  const data = await response.json();
  return processData(data);
}

// Named constants instead of magic numbers
const SHIPPING_RATES = {
  LIGHT_PER_MILE: 0.5,
  LIGHT_BASE: 3.99,
  MEDIUM_PER_MILE: 0.75,
  MEDIUM_BASE: 7.99,
  HEAVY_PER_MILE: 1.25,
  HEAVY_BASE: 14.99,
} as const;

const WEIGHT_THRESHOLDS = {
  LIGHT: 5,
  MEDIUM: 20,
} as const;

function calculateShippingSafe(weight: number, distance: number): number {
  if (weight < WEIGHT_THRESHOLDS.LIGHT) {
    return distance * SHIPPING_RATES.LIGHT_PER_MILE + SHIPPING_RATES.LIGHT_BASE;
  }
  if (weight < WEIGHT_THRESHOLDS.MEDIUM) {
    return distance * SHIPPING_RATES.MEDIUM_PER_MILE + SHIPPING_RATES.MEDIUM_BASE;
  }
  return distance * SHIPPING_RATES.HEAVY_PER_MILE + SHIPPING_RATES.HEAVY_BASE;
}
