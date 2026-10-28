type DemoItem = {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  dietaryLabel: string;
  tag: string;
  prepTimeMinutes: number;
  available: boolean;
  featured: boolean;
  category?: { id: number; name: string };
};

type DemoCategory = {
  id: number;
  name: string;
  description: string;
  displayOrder: number;
  active: boolean;
  items: DemoItem[];
};

type DemoOrder = {
  id: number;
  email: string;
  status: string;
  total: number;
  orderType: string;
  createdAt: string;
  items: Array<{ itemName: string; quantity: number; unitPrice: number; notes?: string }>;
  statusHistory: Array<{ id: number; status: string; changedAt: string }>;
};

type DemoUser = {
  email: string;
  password: string;
  fullName: string;
  roles: string[];
};

type DemoState = {
  categories: DemoCategory[];
  orders: DemoOrder[];
  promotions: Array<{ id: number; code: string; name: string; type: string; value: number; minimumOrder: number; active: boolean }>;
  users: DemoUser[];
  currentUser: Omit<DemoUser, 'password'> | null;
  nextId: number;
};

const STORAGE_KEY = 'texas-smash-bbq-github-pages-demo-v1';

const categorySeed = [
  { name: 'Smash Burgers', description: 'Crispy-edged patties, toasted buns, and house-made toppings.' },
  { name: 'Texas BBQ', description: 'Low-and-slow smoked favourites, served fresh.' },
  { name: 'Chicken', description: 'Crispy, juicy, and made to order.' },
  { name: 'Sides and Loaded Fries', description: 'Comfort-food sides and loaded-up fries.' },
  { name: 'Combos and Meal Deals', description: 'A full meal with your choice of BBQ favourites.' },
  { name: 'Drinks', description: 'Cold drinks, creamy shakes, and house lemonade.' },
  { name: 'Desserts', description: 'A sweet finish to your smokehouse meal.' }
];

const menuSeed: Array<[number, string, string, number, string, boolean, string, number]> = [
  [0, 'Classic Smash Burger', 'Single smashed beef patty, American cheese, pickles, and house burger sauce.', 19.9, 'photo-1568901346375-23c9450c58cd', true, 'Popular', 15],
  [0, 'Double Cheese Smash', 'Two crispy-edged beef patties layered with double cheese, pickles, and house sauce.', 27.9, 'photo-1553979459-d2229ba7433a', true, 'Popular', 18],
  [0, 'Signature BBQ Smash', 'Double smash patties, smoked cheddar, crispy onions, and tangy Texas BBQ sauce.', 25.9, 'photo-1550547660-d9450f859349', true, 'Signature', 18],
  [0, 'Spicy Jalapeño Smash', 'Beef patty, pepper jack, jalapeños, and a smoky chipotle mayo.', 24.9, 'photo-1553979459-d2229ba7433a', false, 'Spicy', 18],
  [1, 'Smoked Beef Brisket', 'Slow-smoked beef brisket with house BBQ sauce and a soft brioche bun.', 34.9, 'photo-1544025162-d76694265947', true, 'Signature', 25],
  [1, 'BBQ Beef Short Ribs', 'Tender, slow-smoked beef short ribs glazed with our peppery BBQ sauce.', 42.9, 'photo-1544025162-d76694265947', true, 'Popular', 30],
  [1, 'Pulled Beef Sandwich', 'Smoky pulled beef piled high with slaw and BBQ sauce on a toasted bun.', 25.9, 'photo-1553909489-cd47e0ef937f', false, 'Popular', 18],
  [1, 'BBQ Feast Platter', 'Brisket, pulled beef, short rib, slaw, pickles, and two classic sides.', 69.9, 'photo-1529193591184-b1d58069ecdd', true, 'Signature', 35],
  [2, 'Crispy Chicken Burger', 'Buttermilk-style crispy chicken, lettuce, pickles, and creamy house sauce.', 20.9, 'photo-1606755962773-d324e0a13086', true, 'Popular', 15],
  [2, 'Chicken Tenders', 'Golden-crisp chicken tenders served with your choice of dipping sauce.', 18.9, 'photo-1562967914-608f82629710', false, 'Popular', 15],
  [3, 'Classic Fries', 'Hot, golden fries finished with a pinch of seasoning.', 8.9, 'photo-1573080496219-bb080dd4f877', false, '', 8],
  [3, 'Loaded BBQ Beef Fries', 'Crispy fries topped with chopped smoked beef, cheese sauce, and BBQ drizzle.', 18.9, 'photo-1576100402379-8a2997d2c02f', true, 'Popular', 12],
  [3, 'Onion Rings', 'Crunchy battered onion rings with a smoky dipping sauce.', 10.9, 'photo-1639024471283-03518883512d', false, '', 10],
  [3, 'Mac and Cheese', 'Creamy macaroni with a rich, toasted cheese topping.', 11.9, 'photo-1543339494-b4cd4f7ba686', false, 'Popular', 12],
  [3, 'Extra Smash Patty', 'Add one extra seasoned beef patty to your burger.', 8.9, 'photo-1553979459-d2229ba7433a', false, 'UPGRADE', 5],
  [3, 'Extra Cheese', 'A serving of melted cheese to make your meal extra indulgent.', 3, 'photo-1485963631004-f2f00b1d6606', false, 'ADD_ON', 2],
  [3, 'Smoky BBQ Sauce', 'A pot of our smoky, tangy house BBQ sauce.', 1.5, 'photo-1472476443507-c7a5948772fc', false, 'ADD_ON', 1],
  [3, 'Jalapeño Sauce', 'A creamy, gently spicy jalapeño dipping sauce.', 1.5, 'photo-1472476443507-c7a5948772fc', false, 'ADD_ON', 1],
  [4, 'Burger Meal Combo', 'Classic Smash Burger with fries and a regular soft drink.', 32.9, 'photo-1568901346375-23c9450c58cd', true, 'Meal deal', 20],
  [4, 'Chicken Tenders Combo', 'Chicken tenders with fries, a regular soft drink, and dipping sauce.', 28.9, 'photo-1562967914-608f82629710', false, 'Meal deal', 18],
  [5, 'Milkshake', 'Thick and creamy hand-spun shake. Choose chocolate, vanilla, or strawberry.', 12.9, 'photo-1572490122747-3968b75cc699', true, 'Popular', 5],
  [5, 'Soft Drink', 'A chilled can of your favourite classic soft drink.', 5.9, 'photo-1544145945-f90425340c7e', false, '', 2],
  [5, 'Texas Lemonade', 'Fresh, bright lemonade served over ice.', 7.9, 'photo-1513558161293-cdaf765ed2e6', false, 'House favourite', 4],
  [5, 'Bottled Water', 'Chilled bottled mineral water.', 3.9, 'photo-1523362628745-0c100150b504', false, '', 1],
  [6, 'Brownie with Ice Cream', 'Warm chocolate brownie served with a scoop of vanilla ice cream.', 14.9, 'photo-1606313564200-e75d5e30476c', true, 'Popular', 8],
  [6, 'Banana Pudding', 'Creamy Southern-style banana pudding layered with vanilla wafers.', 11.9, 'photo-1551024601-bec78aea704b', false, 'House favourite', 5]
];

function createInitialState(): DemoState {
  const categories: DemoCategory[] = categorySeed.map((category, index) => ({
    id: index + 1,
    ...category,
    displayOrder: index + 1,
    active: true,
    items: []
  }));
  let itemId = 1;
  menuSeed.forEach(([categoryIndex, name, description, price, photoId, featured, tag, prepTimeMinutes]) => {
    const category = categories[categoryIndex];
    category.items.push({
      id: itemId++,
      name,
      description,
      price,
      imageUrl: `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=900&q=80`,
      dietaryLabel: '',
      tag,
      prepTimeMinutes,
      available: true,
      featured,
      category: { id: category.id, name: category.name }
    });
  });
  return {
    categories,
    orders: [],
    promotions: [
      { id: 1, code: 'SMASH10', name: '10% lunch deal', type: 'PERCENTAGE', value: 10, minimumOrder: 30, active: true },
      { id: 2, code: 'BBQ5', name: 'RM5 off', type: 'FIXED', value: 5, minimumOrder: 25, active: true }
    ],
    users: [
      { email: 'admin@texassmashbbq.com', password: 'admin123', fullName: 'Demo Admin', roles: ['ADMIN'] },
      { email: 'manager@texassmashbbq.com', password: 'manager123', fullName: 'Demo Manager', roles: ['MANAGER'] }
    ],
    currentUser: null,
    nextId: itemId
  };
}

function readState(): DemoState {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return createInitialState();
  try {
    return JSON.parse(saved) as DemoState;
  } catch (error) {
    const detail = error instanceof Error ? ` (${error.message})` : '';
    throw new Error(`Saved demo data could not be read. Clear this site's local storage to restart the demo.${detail}`);
  }
}

function saveState(state: DemoState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function publicUser(user: DemoUser): Omit<DemoUser, 'password'> {
  const { password: _password, ...details } = user;
  return details;
}

function requireRole(state: DemoState, roles: string[]): void {
  if (!state.currentUser || !state.currentUser.roles.some((role) => roles.includes(role))) {
    throw new Error('You do not have permission to perform this action.');
  }
}

function getAllItems(state: DemoState): DemoItem[] {
  return state.categories.flatMap((category) => category.items);
}

export async function fetchDemoJson<T>(url: string, init?: RequestInit): Promise<T> {
  await Promise.resolve();
  const state = readState();
  const path = new URL(url, window.location.origin).pathname.replace(/\/+$/, '');
  const method = (init?.method ?? 'GET').toUpperCase();
  const body = init?.body ? JSON.parse(String(init.body)) as Record<string, unknown> : {};
  let result: unknown;

  if (path === '/api/auth/csrf' && method === 'GET') {
    result = { csrfToken: 'github-pages-demo-token' };
  } else if (path === '/api/auth/me' && method === 'GET') {
    result = state.currentUser;
  } else if (path === '/api/auth/register' && method === 'POST') {
    const email = String(body.email ?? '').trim().toLowerCase();
    const password = String(body.password ?? '');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Enter a valid email address.');
    if (password.length < 8) throw new Error('Password must be at least 8 characters.');
    if (password.length > 72) throw new Error('Password must be 72 characters or fewer.');
    if (state.users.some((user) => user.email === email)) throw new Error('An account with that email already exists.');
    const user: DemoUser = {
      email,
      password,
      fullName: String(body.fullName ?? email.split('@')[0]).trim(),
      roles: ['CUSTOMER']
    };
    state.users.push(user);
    saveState(state);
    result = publicUser(user);
  } else if (path === '/api/auth/login' && method === 'POST') {
    const email = String(body.email ?? '').trim().toLowerCase();
    const user = state.users.find((candidate) => candidate.email === email && candidate.password === body.password);
    if (!user) throw new Error('Email or password is incorrect.');
    state.currentUser = publicUser(user);
    saveState(state);
    result = state.currentUser;
  } else if (path === '/api/auth/logout' && method === 'POST') {
    state.currentUser = null;
    saveState(state);
    result = undefined;
  } else if (path === '/api/public/restaurant' && method === 'GET') {
    result = { name: 'Texas Smash BBQ', address: 'Kuala Lumpur, Malaysia', currency: 'MYR' };
  } else if (path === '/api/public/menu' && method === 'GET') {
    result = state.categories.filter((category) => category.active);
  } else if (path === '/api/admin/dashboard' && method === 'GET') {
    requireRole(state, ['ADMIN', 'MANAGER']);
    const salesOrders = state.orders.filter((order) => order.status !== 'CANCELLED');
    const totalSales = salesOrders.reduce((total, order) => total + order.total, 0);
    result = {
      totalOrders: state.orders.length,
      totalSales,
      averageOrderValue: salesOrders.length ? totalSales / salesOrders.length : 0,
      pendingOrders: state.orders.filter((order) => ['NEW', 'CONFIRMED'].includes(order.status)).length,
      readyOrders: state.orders.filter((order) => order.status === 'READY').length
    };
  } else if (path === '/api/admin/orders' && method === 'GET') {
    requireRole(state, ['ADMIN', 'MANAGER']);
    result = state.orders;
  } else if (path === '/api/kitchen/orders' && method === 'GET') {
    requireRole(state, ['ADMIN', 'MANAGER', 'STAFF']);
    result = state.orders.filter((order) => !['COMPLETED', 'CANCELLED'].includes(order.status));
  } else if (path === '/api/admin/menu/items' && method === 'GET') {
    requireRole(state, ['ADMIN', 'MANAGER']);
    result = getAllItems(state);
  } else if (path === '/api/admin/menu/categories' && method === 'GET') {
    requireRole(state, ['ADMIN', 'MANAGER']);
    result = state.categories;
  } else if (path === '/api/admin/menu/categories' && method === 'POST') {
    requireRole(state, ['ADMIN', 'MANAGER']);
    const category: DemoCategory = {
      id: state.nextId++,
      name: String(body.name ?? '').trim(),
      description: String(body.description ?? ''),
      displayOrder: Number(body.displayOrder ?? 1),
      active: true,
      items: []
    };
    if (!category.name) throw new Error('Category name is required.');
    state.categories.push(category);
    saveState(state);
    result = category;
  } else if (path === '/api/admin/menu/items' && method === 'POST') {
    requireRole(state, ['ADMIN', 'MANAGER']);
    const category = state.categories.find((entry) => entry.id === Number(body.categoryId));
    if (!category) throw new Error('Menu category not found.');
    const item: DemoItem = {
      id: state.nextId++,
      name: String(body.name ?? ''),
      description: String(body.description ?? ''),
      price: Number(body.price),
      imageUrl: String(body.imageUrl ?? ''),
      dietaryLabel: String(body.dietaryLabel ?? ''),
      tag: String(body.tag ?? ''),
      prepTimeMinutes: Number(body.prepTimeMinutes ?? 10),
      featured: Boolean(body.featured),
      available: Boolean(body.available),
      category: { id: category.id, name: category.name }
    };
    category.items.push(item);
    saveState(state);
    result = item;
  } else if (/^\/api\/admin\/menu\/items\/\d+\/availability$/.test(path) && method === 'PATCH') {
    requireRole(state, ['ADMIN', 'MANAGER']);
    const itemId = Number(path.split('/')[5]);
    const item = getAllItems(state).find((entry) => entry.id === itemId);
    if (!item) throw new Error('Menu item not found.');
    item.available = Boolean(body.available);
    saveState(state);
    result = item;
  } else if (path === '/api/admin/promotions' && method === 'GET') {
    requireRole(state, ['ADMIN', 'MANAGER']);
    result = state.promotions;
  } else if (path === '/api/admin/promotions' && method === 'POST') {
    requireRole(state, ['ADMIN', 'MANAGER']);
    const code = String(body.code ?? '').trim().toUpperCase();
    if (!code) throw new Error('Promotion code is required.');
    if (state.promotions.some((promotion) => promotion.code.toUpperCase() === code)) throw new Error('Promotion code already exists.');
    const promotion = {
      id: state.nextId++,
      code,
      name: String(body.name ?? ''),
      type: String(body.type ?? 'PERCENTAGE'),
      value: Number(body.value ?? 0),
      minimumOrder: Number(body.minimumOrder ?? 0),
      active: Boolean(body.active)
    };
    state.promotions.push(promotion);
    saveState(state);
    result = promotion;
  } else if (path === '/api/orders' && method === 'POST') {
    if (!state.currentUser) throw new Error('Sign in to place a demo order.');
    const requestedItems = Array.isArray(body.items) ? body.items as Array<Record<string, unknown>> : [];
    if (requestedItems.length === 0) throw new Error('Order must include at least one item.');
    const orderItems = requestedItems.map((requested) => {
      const item = getAllItems(state).find((candidate) => candidate.id === Number(requested.menuItemId));
      if (!item || !item.available) throw new Error('One of the selected items is unavailable.');
      return {
        itemName: item.name,
        quantity: Math.max(1, Number(requested.quantity)),
        unitPrice: item.price,
        notes: String(requested.notes ?? '')
      };
    });
    const subtotal = orderItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const tax = Math.round(subtotal * 0.0825 * 100) / 100;
    const serviceCharge = Math.round(subtotal * 0.05 * 100) / 100;
    const promotion = state.promotions.find((entry) =>
      entry.active && entry.code.toUpperCase() === String(body.promoCode ?? '').trim().toUpperCase()
      && subtotal >= entry.minimumOrder
    );
    const discount = promotion
      ? promotion.type === 'PERCENTAGE'
        ? Math.round(subtotal * promotion.value) / 100
        : Math.min(subtotal, promotion.value)
      : 0;
    const order: DemoOrder = {
      id: state.nextId++,
      email: state.currentUser.email,
      status: 'NEW',
      total: Math.max(0, Math.round((subtotal + tax + serviceCharge - discount) * 100) / 100),
      orderType: String(body.orderType ?? 'DINE_IN'),
      createdAt: new Date().toISOString(),
      items: orderItems,
      statusHistory: [{ id: state.nextId++, status: 'NEW', changedAt: new Date().toISOString() }]
    };
    state.orders.unshift(order);
    saveState(state);
    result = { id: order.id, status: order.status, total: order.total };
  } else if (path === '/api/orders' && method === 'GET') {
    if (!state.currentUser) throw new Error('Please sign in to view orders.');
    result = state.currentUser.roles.some((role) => ['ADMIN', 'MANAGER', 'STAFF'].includes(role))
      ? state.orders
      : state.orders.filter((order) => order.email === state.currentUser?.email);
  } else if (/^\/api\/admin\/orders\/\d+\/status$/.test(path) && method === 'PATCH') {
    requireRole(state, ['ADMIN', 'MANAGER']);
    const orderId = Number(path.split('/')[4]);
    const order = state.orders.find((entry) => entry.id === orderId);
    const status = String(body.status ?? '').toUpperCase();
    if (!order) throw new Error('Order not found.');
    if (!['NEW', 'CONFIRMED', 'PREPARING', 'READY', 'SERVING', 'COMPLETED', 'CANCELLED'].includes(status)) {
      throw new Error('Unsupported order status.');
    }
    order.status = status;
    order.statusHistory.push({ id: state.nextId++, status, changedAt: new Date().toISOString() });
    saveState(state);
    result = order;
  } else {
    throw new Error(`Demo does not implement ${method} ${path}.`);
  }

  return result as T;
}

export function resetDemoData(): void {
  localStorage.removeItem(STORAGE_KEY);
  window.location.reload();
}
