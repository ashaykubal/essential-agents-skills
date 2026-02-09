/**
 * Linting Anti-Patterns
 *
 * DO NOT use these patterns in production code.
 * Each example demonstrates code quality issues.
 */

// Deep nesting - hard to read and maintain
function processOrderUnsafe(order: Order) {
  if (order) {
    if (order.items) {
      if (order.items.length > 0) {
        for (const item of order.items) {
          if (item.quantity > 0) {
            if (item.price > 0) {
              // Finally doing something
              console.log(item);
            }
          }
        }
      }
    }
  }
}

// Long function - doing too many things
async function handleCheckoutUnsafe(cart: Cart, user: User) {
  // Validate cart
  if (!cart.items.length) throw new Error('Empty cart');
  for (const item of cart.items) {
    if (!item.available) throw new Error('Item unavailable');
    if (item.quantity > item.stock) throw new Error('Insufficient stock');
  }

  // Calculate totals
  let subtotal = 0;
  for (const item of cart.items) {
    subtotal += item.price * item.quantity;
  }
  const discount = user.isPremium ? subtotal * 0.1 : 0;
  const tax = (subtotal - discount) * 0.08;
  const shipping = subtotal > 100 ? 0 : 10;
  const total = subtotal - discount + tax + shipping;

  // Create order
  const order = {
    id: generateId(),
    userId: user.id,
    items: cart.items,
    subtotal,
    discount,
    tax,
    shipping,
    total,
    status: 'pending',
    createdAt: new Date(),
  };

  // Save to database
  await db.orders.insert(order);
  await db.carts.delete(cart.id);
  for (const item of cart.items) {
    await db.inventory.decrement(item.productId, item.quantity);
  }

  // Send notifications
  await email.send(user.email, 'orderConfirmation', { order });
  await slack.notify('#sales', `New order: ${order.id} - $${total}`);
  await analytics.track('checkout_complete', { orderId: order.id, total });

  // Update user stats
  user.totalOrders += 1;
  user.totalSpent += total;
  if (user.totalSpent > 1000 && !user.isPremium) {
    user.isPremium = true;
    await email.send(user.email, 'premiumUpgrade', {});
  }
  await db.users.update(user);

  return order;
}

// Generic naming - unclear purpose
function process(data: any) {
  const result = data.map((item: any) => {
    const temp = item.value * 2;
    return { ...item, temp };
  });
  return result;
}

// Single letter variables outside loops
function calculate(a: number, b: number, c: number, d: number) {
  const x = a + b;
  const y = c - d;
  const z = x * y;
  return z;
}

// Misleading names
const userList = getUser(); // Returns single user, not list
const isValid = validateAndSave(data); // Does more than validate
const tempFix = calculatePermanentDiscount(); // Not temporary

// God function - mixed responsibilities
function doEverything(input: string) {
  // Parse
  const parsed = JSON.parse(input);

  // Validate
  if (!parsed.name) throw new Error('Missing name');

  // Transform
  const transformed = { ...parsed, name: parsed.name.toUpperCase() };

  // Log
  console.log('Processing:', transformed);

  // Save
  localStorage.setItem('data', JSON.stringify(transformed));

  // Notify
  dispatchEvent(new CustomEvent('dataUpdated', { detail: transformed }));

  // Return
  return transformed;
}

// Complex conditionals
function canAccessResource(user: User, resource: Resource): boolean {
  return (
    user.role === 'admin' ||
    (user.role === 'manager' && user.department === resource.department) ||
    (user.role === 'employee' &&
      user.department === resource.department &&
      resource.accessLevel === 'public') ||
    user.permissions.includes(resource.id) ||
    (resource.sharedWith.includes(user.id) && !resource.revoked)
  );
}

// Duplicate code
function createUser(data: UserData) {
  if (!data.email) throw new Error('Email required');
  if (!data.email.includes('@')) throw new Error('Invalid email');
  if (data.email.length > 255) throw new Error('Email too long');
  // ...create user
}

function updateUser(id: string, data: UserData) {
  if (!data.email) throw new Error('Email required');
  if (!data.email.includes('@')) throw new Error('Invalid email');
  if (data.email.length > 255) throw new Error('Email too long');
  // ...update user
}

// Inconsistent style
async function fetchDataInconsistent() {
  return fetch('/api/data')
    .then((response) => response.json())
    .then((data) => {
      return processData(data);
    });
}

async function fetchDataInconsistent2() {
  const response = await fetch('/api/other');
  const data = await response.json();
  return processData(data);
}

// Magic numbers
function calculateShipping(weight: number, distance: number): number {
  if (weight < 5) {
    return distance * 0.5 + 3.99;
  } else if (weight < 20) {
    return distance * 0.75 + 7.99;
  } else {
    return distance * 1.25 + 14.99;
  }
}
