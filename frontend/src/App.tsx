import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { fetchDemoJson } from './demoApi';

type ViewMode = 'customer' | 'admin';
const DEMO_MODE = __DEMO_MODE__;

type MenuCategory = {
  id: number;
  name: string;
  description: string;
  displayOrder?: number;
  items?: MenuItem[];
};

type MenuItem = {
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

type DashboardSummary = {
  totalOrders: number;
  totalSales: number;
  averageOrderValue: number;
  pendingOrders: number;
  readyOrders: number;
};

type Order = {
  id: number;
  status: string;
  total: number;
  orderType: string;
  createdAt: string;
  items: Array<{
    id?: number;
    itemName: string;
    quantity: number;
    unitPrice: number;
    notes?: string;
  }>;
  statusHistory?: Array<{
    id: number;
    status: string;
    changedAt: string;
  }>;
};

type Promotion = {
  id: number;
  code: string;
  name: string;
  type: string;
  value: number;
  minimumOrder: number;
  active: boolean;
};

type CartItem = {
  item: MenuItem;
  quantity: number;
  notes: string;
};

type AuthUser = {
  email: string;
  fullName: string;
  roles: string[];
};

const FALLBACK_FOOD_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='560' viewBox='0 0 800 560'%3E%3Crect width='800' height='560' fill='%232d261f'/%3E%3Cpath d='M0 430h800v130H0z' fill='%236b3a23'/%3E%3Ctext x='400' y='285' text-anchor='middle' fill='%23f2c078' font-family='sans-serif' font-size='42' font-weight='700'%3ETEXAS SMASH BBQ%3C/text%3E%3Ctext x='400' y='335' text-anchor='middle' fill='%23f8eee2' font-family='sans-serif' font-size='22'%3EFresh from the smokehouse%3C/text%3E%3C/svg%3E";

const ORDER_STATUSES = ['NEW', 'CONFIRMED', 'PREPARING', 'READY', 'SERVING', 'COMPLETED', 'CANCELLED'];

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  if (DEMO_MODE) return fetchDemoJson<T>(url, init);

  const headers = new Headers(init?.headers);
  const method = (init?.method ?? 'GET').toUpperCase();
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    const csrfResponse = await fetch('/api/auth/csrf', { credentials: 'same-origin' });
    if (!csrfResponse.ok) throw new Error('Unable to verify this request. Refresh the page and try again.');
    const csrf = await csrfResponse.json() as { csrfToken: string };
    headers.set('X-XSRF-TOKEN', csrf.csrfToken);
  }
  const response = await fetch(url, { ...init, headers, credentials: 'same-origin' });
  if (!response.ok) {
    const body = await response.text();
    let message = body || 'Request failed';
    try {
      const parsed = JSON.parse(body) as { message?: string };
      message = parsed.message ?? message;
    } catch {
      // Keep plain-text API errors as-is.
    }
    throw new Error(message);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export default function App() {
  const [view, setView] = useState<ViewMode>('customer');
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [restaurant, setRestaurant] = useState<{ name: string; address: string; currency: string } | null>(null);
  const [menuLoading, setMenuLoading] = useState(true);
  const [menuError, setMenuError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [selectedAddOnIds, setSelectedAddOnIds] = useState<number[]>([]);
  const [itemNotes, setItemNotes] = useState('');
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authForm, setAuthForm] = useState({ email: '', password: '', fullName: '' });
  const [authBusy, setAuthBusy] = useState(false);
  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [kitchenOrders, setKitchenOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [authError, setAuthError] = useState('');
  const [orderStatus, setOrderStatus] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [notice, setNotice] = useState('');
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '', displayOrder: '1' });
  const [promotionForm, setPromotionForm] = useState({ code: '', name: '', type: 'PERCENTAGE', value: '10', minimumOrder: '30', active: true });
  const [itemForm, setItemForm] = useState({
    categoryId: '',
    name: '',
    description: '',
    price: '16.00',
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=80',
    dietaryLabel: '',
    tag: 'Popular',
    prepTimeMinutes: '15',
    featured: true,
    available: true
  });

  const allMenuItems = useMemo(() => categories.flatMap((category) => category.items ?? []), [categories]);
  const totalItems = useMemo(() => cart.reduce((sum, entry) => sum + entry.quantity, 0), [cart]);
  const subtotal = useMemo(
    () => cart.reduce((sum, entry) => sum + entry.item.price * entry.quantity, 0),
    [cart]
  );
  const estimatedTax = Math.round(subtotal * 0.0825 * 100) / 100;
  const estimatedServiceCharge = Math.round(subtotal * 0.05 * 100) / 100;
  const estimatedTotal = subtotal + estimatedTax + estimatedServiceCharge;
  const filteredCategories = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase();
    return categories
      .filter((category) => activeCategory === 'All' || category.name === activeCategory)
      .map((category) => ({
        ...category,
        items: (category.items ?? []).filter((item) =>
          !query || `${item.name} ${item.description} ${category.name}`.toLocaleLowerCase().includes(query)
        )
      }))
      .filter((category) => (category.items ?? []).length > 0);
  }, [activeCategory, categories, searchQuery]);

  function formatMoney(amount: number): string {
    return new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR' }).format(amount);
  }

  async function refreshAdminData() {
    try {
      const [summary, orderList, itemList, categoryList, kitchenList, promotionList] = await Promise.all([
        fetchJson<DashboardSummary>('/api/admin/dashboard'),
        fetchJson<Order[]>('/api/admin/orders'),
        fetchJson<MenuItem[]>('/api/admin/menu/items'),
        fetchJson<MenuCategory[]>('/api/public/menu'),
        fetchJson<Order[]>('/api/kitchen/orders'),
        fetchJson<Promotion[]>('/api/admin/promotions')
      ]);
      setDashboard(summary);
      setOrders(orderList);
      setMenuItems(itemList);
      setCategories(categoryList);
      setKitchenOrders(kitchenList);
      setPromotions(promotionList);
    } catch (error) {
      setDashboard(null);
      setOrders([]);
      setMenuItems([]);
      setKitchenOrders([]);
      setPromotions([]);
      setNotice(error instanceof Error ? error.message : 'Unable to load staff data.');
    }
  }

  useEffect(() => {
    fetchJson<MenuCategory[]>('/api/public/menu')
      .then((menu) => {
        setCategories(menu);
        setMenuError('');
      })
      .catch((error: unknown) => {
        setCategories([]);
        setMenuError(error instanceof Error ? error.message : 'The menu could not be loaded.');
      })
      .finally(() => setMenuLoading(false));

    fetchJson<{ name: string; address: string; currency: string }>('/api/public/restaurant')
      .then(setRestaurant)
      .catch(() => setRestaurant(null));
  }, []);

  useEffect(() => {
    fetchJson<AuthUser>('/api/auth/me')
      .then((user) => {
        setCurrentUser(user ?? null);
      })
      .catch(() => setCurrentUser(null));
  }, []);

  const canManageRestaurant = currentUser?.roles.some((role) => role === 'ADMIN' || role === 'MANAGER') ?? false;

  useEffect(() => {
    if (view !== 'admin') return;
    if (!canManageRestaurant) {
      setView('customer');
      setNotice('Sign in with an admin or manager account to open the staff dashboard.');
      return;
    }
    void refreshAdminData();
  }, [view, canManageRestaurant]);

  async function submitAuthentication(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthBusy(true);
    setAuthError('');
    try {
      if (authMode === 'register') {
        await fetchJson<AuthUser>('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: authForm.email.trim(),
            password: authForm.password,
            fullName: authForm.fullName.trim()
          })
        });
      }

      const user = await fetchJson<AuthUser>('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authForm.email.trim(), password: authForm.password })
      });
      setCurrentUser(user);
      setAuthMode('login');
      setAuthOpen(false);
      setAuthForm({ email: '', password: '', fullName: '' });
      setNotice(`Signed in as ${user.fullName}.`);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Unable to sign in.');
    } finally {
      setAuthBusy(false);
    }
  }

  async function signOut() {
    try {
      await fetchJson<void>('/api/auth/logout', { method: 'POST' });
      setCurrentUser(null);
      setView('customer');
      setAuthMode('login');
      setAuthOpen(false);
      setDashboard(null);
      setOrders([]);
      setKitchenOrders([]);
      setMenuItems([]);
      setPromotions([]);
      setNotice('You have signed out.');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Unable to sign out.');
    }
  }

  function addToCart(item: MenuItem, quantity = 1, notes = '') {
    if (!item.available || quantity < 1) return;
    setCart((current) => {
      const existing = current.find((entry) => entry.item.id === item.id && entry.notes === notes);
      if (existing) {
        return current.map((entry) =>
          entry.item.id === item.id && entry.notes === notes
            ? { ...entry, quantity: entry.quantity + quantity }
            : entry
        );
      }
      return [...current, { item, quantity, notes }];
    });
  }

  function updateQuantity(itemId: number, notes: string, delta: number) {
    setCart((current) =>
      current
        .map((entry) =>
          entry.item.id === itemId && entry.notes === notes
            ? { ...entry, quantity: Math.max(0, entry.quantity + delta) }
            : entry
        )
        .filter((entry) => entry.quantity > 0)
    );
  }

  function removeFromCart(itemId: number, notes: string) {
    setCart((current) => current.filter((entry) => entry.item.id !== itemId || entry.notes !== notes));
  }

  function openItemDetails(item: MenuItem) {
    setSelectedItem(item);
    setSelectedQuantity(1);
    setSelectedAddOnIds([]);
    setItemNotes('');
  }

  function addSelectedItemToCart() {
    if (!selectedItem?.available) return;
    addToCart(selectedItem, selectedQuantity, itemNotes.trim());
    selectedAddOnIds.forEach((id) => {
      const addOn = allMenuItems.find((item) => item.id === id);
      if (addOn?.available) addToCart(addOn, selectedQuantity);
    });
    setOrderStatus(`${selectedQuantity} × ${selectedItem.name} added to your order.`);
    setSelectedItem(null);
  }

  function toggleAddOn(itemId: number) {
    setSelectedAddOnIds((current) =>
      current.includes(itemId) ? current.filter((id) => id !== itemId) : [...current, itemId]
    );
  }

  async function submitOrder() {
    if (cart.length === 0) {
      setOrderStatus('Add at least one item to the cart before checkout.');
      return;
    }
    if (!currentUser) {
      setAuthError('Sign in or create an account to place your order.');
      setAuthOpen(true);
      return;
    }

    setSubmittingOrder(true);
    setAuthError('');
    setOrderStatus('');
    try {
      const payload = {
        orderType: 'DINE_IN',
        promoCode: promoCode.trim(),
        items: cart.map(({ item, quantity, notes }) => ({
          menuItemId: item.id,
          quantity,
          notes
        }))
      };

      const response = await fetchJson<{ id: number; status: string; total: number }>('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      setOrderStatus(DEMO_MODE
        ? `Demo order #${response.id} saved in this browser with status ${response.status}. Total ${formatMoney(response.total)}.`
        : `Order #${response.id} placed with status ${response.status}. Total ${formatMoney(response.total)}.`);
      setCart([]);
      setPromoCode('');
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Could not place order');
    } finally {
      setSubmittingOrder(false);
    }
  }

  async function createPromotion() {
    try {
      await fetchJson<Promotion>('/api/admin/promotions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code: promotionForm.code,
          name: promotionForm.name,
          type: promotionForm.type,
          value: Number(promotionForm.value),
          minimumOrder: Number(promotionForm.minimumOrder),
          active: promotionForm.active
        })
      });
      setPromotionForm({ code: '', name: '', type: 'PERCENTAGE', value: '10', minimumOrder: '30', active: true });
      setNotice('Promotion created successfully.');
      await refreshAdminData();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Unable to create promotion');
    }
  }

  async function createCategory() {
    try {
      await fetchJson<MenuCategory>('/api/admin/menu/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: categoryForm.name,
          description: categoryForm.description || 'Fresh menu options',
          displayOrder: Number(categoryForm.displayOrder || 1)
        })
      });
      setCategoryForm({ name: '', description: '', displayOrder: '1' });
      setNotice('Category created successfully.');
      await refreshAdminData();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Unable to create category');
    }
  }

  async function createItem() {
    try {
      await fetchJson<MenuItem>('/api/admin/menu/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          categoryId: Number(itemForm.categoryId),
          name: itemForm.name,
          description: itemForm.description || 'Freshly prepared menu item',
          price: Number(itemForm.price),
          imageUrl: itemForm.imageUrl,
          dietaryLabel: itemForm.dietaryLabel,
          tag: itemForm.tag,
          prepTimeMinutes: Number(itemForm.prepTimeMinutes),
          featured: itemForm.featured,
          available: itemForm.available
        })
      });
      setItemForm({
        categoryId: '',
        name: '',
        description: '',
        price: '16.00',
        imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=80',
        dietaryLabel: '',
        tag: 'Popular',
        prepTimeMinutes: '15',
        featured: true,
        available: true
      });
      setNotice('Menu item created successfully.');
      await refreshAdminData();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Unable to create item');
    }
  }

  async function updateOrderStatus(orderId: number, status: string) {
    try {
      await fetchJson<Order>(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });
      setNotice(`Order #${orderId} marked as ${status}.`);
      await refreshAdminData();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Unable to update order status');
    }
  }

  async function toggleItemAvailability(itemId: number, available: boolean) {
    try {
      await fetchJson<MenuItem>(`/api/admin/menu/items/${itemId}/availability`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ available })
      });
      setNotice(`Item marked ${available ? 'available' : 'unavailable'}.`);
      await refreshAdminData();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Unable to toggle availability');
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Texas Smash BBQ</p>
          <h1>{restaurant?.name ?? 'Texas Smash BBQ'}</h1>
        </div>
        <div className="auth-panel">
          <div className="view-toggle">
            <button className={view === 'customer' ? 'active' : ''} onClick={() => setView('customer')}>Customer</button>
            {canManageRestaurant && (
              <button className={view === 'admin' ? 'active' : ''} onClick={() => setView('admin')}>Staff portal</button>
            )}
          </div>
          {currentUser ? (
            <div className="account-controls">
              <span className="account-name">{currentUser.fullName}</span>
              <button type="button" className="secondary-action" onClick={signOut}>Sign out</button>
            </div>
          ) : (
            <button type="button" className="primary-action sign-in-button" onClick={() => {
              setAuthError('');
              setAuthMode('login');
              setAuthOpen(true);
            }}>
              Sign in
            </button>
          )}
        </div>
      </header>

      {DEMO_MODE && (
        <aside className="demo-banner" role="note">
          <strong>GitHub Pages demo:</strong> accounts, menu changes, promotions, and demo orders are stored only in this browser.
          No restaurant receives orders, and no payments are processed. Do not enter a real password.
        </aside>
      )}

      {authOpen && (
        <div className="modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setAuthOpen(false);
        }}>
          <section className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title">
            <button type="button" className="modal-close" aria-label="Close sign in" onClick={() => setAuthOpen(false)}>×</button>
            <p className="eyebrow">TEXAS SMASH BBQ</p>
            <h2 id="auth-title">{authMode === 'login' ? 'Welcome back' : 'Create your account'}</h2>
            <p className="auth-description">
              {authMode === 'login' ? 'Sign in to place orders and manage your account.' : 'Create a customer account to place and track your orders.'}
            </p>
            {DEMO_MODE && authMode === 'login' && (
              <p className="demo-credentials">
                Demo staff: admin@texassmashbbq.com / admin123 · manager@texassmashbbq.com / manager123 · staff@texassmashbbq.com / staff123
              </p>
            )}
            <form className="auth-form" onSubmit={submitAuthentication}>
              {authMode === 'register' && (
                <label>
                  Full name
                  <input
                    autoComplete="name"
                    value={authForm.fullName}
                    onChange={(event) => setAuthForm((current) => ({ ...current, fullName: event.target.value }))}
                    required
                    maxLength={100}
                  />
                </label>
              )}
              <label>
                Email address
                <input
                  type="email"
                  autoComplete="email"
                  value={authForm.email}
                  onChange={(event) => setAuthForm((current) => ({ ...current, email: event.target.value }))}
                  required
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                  value={authForm.password}
                  onChange={(event) => setAuthForm((current) => ({ ...current, password: event.target.value }))}
                  minLength={authMode === 'register' ? 8 : undefined}
                  required
                />
              </label>
              {authError && <p className="error" role="alert">{authError}</p>}
              <button type="submit" className="checkout" disabled={authBusy}>
                {authBusy ? 'Please wait…' : authMode === 'login' ? 'Sign in' : 'Create account'}
              </button>
            </form>
            <p className="auth-switch">
              {authMode === 'login' ? 'New to Texas Smash BBQ?' : 'Already have an account?'}
              {' '}
              <button type="button" onClick={() => {
                setAuthMode((mode) => mode === 'login' ? 'register' : 'login');
                setAuthError('');
              }}>
                {authMode === 'login' ? 'Create account' : 'Sign in'}
              </button>
            </p>
          </section>
        </div>
      )}

      {view === 'customer' && (
        <main className="layout">
          <section className="menu-panel">
            <div className="hero-card">
              <div className="hero-copy">
                <span className="hero-kicker">LOW & SLOW · FRESH OFF THE GRILL</span>
                <p>Fresh smokehouse favorites</p>
                <h2>Big Texas flavour.<br />Made for your appetite.</h2>
                <span className="hero-caption">Smash burgers, slow-smoked BBQ, and all the sides.</span>
              </div>
              <span className="pill">Made fresh to order</span>
            </div>

            <div className="menu-toolbar">
              <div>
                <p className="eyebrow">THE MENU</p>
                <h2>Find your new favourite</h2>
              </div>
              <label className="menu-search">
                <span aria-hidden="true">⌕</span>
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search burgers, brisket, sides..."
                  aria-label="Search menu"
                />
              </label>
            </div>

            <nav className="category-nav" aria-label="Menu categories">
              <button
                type="button"
                className={activeCategory === 'All' ? 'active' : ''}
                onClick={() => setActiveCategory('All')}
              >
                All
              </button>
              {categories.map((category) => (
                <button
                  type="button"
                  className={activeCategory === category.name ? 'active' : ''}
                  key={category.id}
                  onClick={() => {
                    setActiveCategory(category.name);
                    window.setTimeout(
                      () => document.getElementById(`menu-category-${category.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
                      0
                    );
                  }}
                >
                  {category.name}
                </button>
              ))}
            </nav>

            {menuLoading ? (
              <div className="menu-message" role="status">Loading the menu…</div>
            ) : menuError ? (
              <div className="menu-message menu-error" role="alert">
                <strong>We couldn’t load the menu.</strong>
                <span>{menuError}</span>
                <button type="button" className="secondary-action" onClick={() => window.location.reload()}>Try again</button>
              </div>
            ) : filteredCategories.length === 0 ? (
              <div className="menu-message">No menu items match your search. Try another dish or category.</div>
            ) : (
              filteredCategories.map((category) => (
                <section className="category-section" id={`menu-category-${category.id}`} key={category.id}>
                  <div className="section-header">
                    <div>
                      <p className="eyebrow">{category.name.toLocaleUpperCase()}</p>
                      <h3>{category.name}</h3>
                    </div>
                    <span>{category.items?.length ?? 0} items</span>
                  </div>
                  <div className="item-grid">
                    {(category.items ?? []).map((item) => (
                      <article className={`menu-item ${!item.available ? 'unavailable' : ''}`} key={item.id}>
                        <div className="menu-image-wrap">
                          <img
                            src={item.imageUrl || FALLBACK_FOOD_IMAGE}
                            alt={item.name}
                            loading="lazy"
                            onError={(event) => { event.currentTarget.src = FALLBACK_FOOD_IMAGE; }}
                          />
                          {item.tag && (
                            <span className={`item-badge ${item.tag.toLowerCase().includes('signature') ? 'signature' : ''}`}>
                              {item.tag === 'ADD_ON' ? 'Add-on' : item.tag === 'UPGRADE' ? 'Upgrade' : item.tag}
                            </span>
                          )}
                          {!item.available && <span className="availability-badge">Currently unavailable</span>}
                        </div>
                        <div className="item-body">
                          <div className="item-head">
                            <strong>{item.name}</strong>
                            <span className="price">{formatMoney(item.price)}</span>
                          </div>
                          <p>{item.description}</p>
                          <div className="menu-card-footer">
                            <span>{item.prepTimeMinutes} min</span>
                            <button
                              type="button"
                              className="menu-item-action"
                              onClick={() => openItemDetails(item)}
                              disabled={!item.available}
                              aria-label={`View ${item.name} details`}
                            >
                              {item.available ? 'Customize +' : 'Unavailable'}
                            </button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              ))
            )}
          </section>

          <aside className="cart-panel">
            <div className="cart-heading">
              <div>
                <p className="eyebrow">YOUR ORDER</p>
                <h3>Smokehouse cart</h3>
              </div>
              <span className="cart-count">{totalItems}</span>
            </div>
            {cart.length === 0 ? (
              <div className="cart-empty">
                <span aria-hidden="true">♨</span>
                <strong>Your cart is waiting</strong>
                <p>Add a favourite from the menu to get started.</p>
              </div>
            ) : (
              cart.map((entry) => (
                <div className="cart-row" key={`${entry.item.id}-${entry.notes}`}>
                  <div>
                    <strong>{entry.item.name}</strong>
                    <small>{formatMoney(entry.item.price)} each</small>
                    {entry.notes && <small className="cart-note">{entry.notes}</small>}
                  </div>
                  <div className="cart-line-actions">
                    <strong>{formatMoney(entry.item.price * entry.quantity)}</strong>
                    <div className="qty-controls">
                      <button type="button" aria-label={`Decrease ${entry.item.name}`} onClick={() => updateQuantity(entry.item.id, entry.notes, -1)}>−</button>
                      <span>{entry.quantity}</span>
                      <button type="button" aria-label={`Increase ${entry.item.name}`} onClick={() => updateQuantity(entry.item.id, entry.notes, 1)}>+</button>
                      <button type="button" className="remove-item" aria-label={`Remove ${entry.item.name}`} onClick={() => removeFromCart(entry.item.id, entry.notes)}>×</button>
                    </div>
                  </div>
                </div>
              ))
            )}
            <div className="promo-row">
              <label htmlFor="promo-code">Promo code</label>
              <input id="promo-code" value={promoCode} onChange={(event) => setPromoCode(event.target.value.toUpperCase())} placeholder="Enter code" />
            </div>
            <div className="cart-totals">
              <div><span>Subtotal</span><strong>{formatMoney(subtotal)}</strong></div>
              <div><span>Estimated tax</span><strong>{formatMoney(estimatedTax)}</strong></div>
              <div><span>Estimated service charge</span><strong>{formatMoney(estimatedServiceCharge)}</strong></div>
              <div className="cart-grand-total"><span>Estimated total</span><strong>{formatMoney(estimatedTotal)}</strong></div>
              {promoCode.trim() && <small>Any promotion discount is confirmed by the order service.</small>}
            </div>
            <button className="checkout" onClick={submitOrder} disabled={cart.length === 0 || submittingOrder}>
              {submittingOrder ? (DEMO_MODE ? 'Saving demo order…' : 'Placing order…') : (DEMO_MODE ? 'Place demo order' : 'Place order')}
            </button>
            <p className="checkout-note">
              {DEMO_MODE
                ? 'This creates a sample order in this browser only. It is not sent to the restaurant.'
                : 'Final total and order status are confirmed by the restaurant service.'}
            </p>
            {authError && <p className="error">{authError}</p>}
            {orderStatus && <p className="success">{orderStatus}</p>}

            {dashboard && (
              <div className="stats-box">
                <h4>Today at a glance</h4>
                <ul>
                  <li>Orders: {dashboard.totalOrders}</li>
                  <li>Sales: {formatMoney(dashboard.totalSales)}</li>
                  <li>Avg: {formatMoney(dashboard.averageOrderValue)}</li>
                  <li>Pending: {dashboard.pendingOrders}</li>
                </ul>
              </div>
            )}
          </aside>
        </main>
      )}

      {view === 'customer' && selectedItem && (
        <div className="modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setSelectedItem(null);
        }}>
          <section className="item-modal" role="dialog" aria-modal="true" aria-labelledby="item-modal-title">
            <button type="button" className="modal-close" aria-label="Close item details" onClick={() => setSelectedItem(null)}>×</button>
            <img
              className="modal-image"
              src={selectedItem.imageUrl || FALLBACK_FOOD_IMAGE}
              alt={selectedItem.name}
              onError={(event) => { event.currentTarget.src = FALLBACK_FOOD_IMAGE; }}
            />
            <div className="modal-content">
              <p className="eyebrow">{selectedItem.category?.name ?? 'TEXAS SMASH BBQ'}</p>
              <div className="item-head">
                <h2 id="item-modal-title">{selectedItem.name}</h2>
                <strong className="price">{formatMoney(selectedItem.price)}</strong>
              </div>
              <p>{selectedItem.description}</p>
              <div className="modal-quantity">
                <span>Quantity</span>
                <div className="qty-controls">
                  <button type="button" aria-label="Decrease quantity" onClick={() => setSelectedQuantity((quantity) => Math.max(1, quantity - 1))}>−</button>
                  <strong>{selectedQuantity}</strong>
                  <button type="button" aria-label="Increase quantity" onClick={() => setSelectedQuantity((quantity) => Math.min(20, quantity + 1))}>+</button>
                </div>
              </div>
              {[
                {
                  title: 'Burger upgrades',
                  items: selectedItem.category?.name === 'Smash Burgers'
                    ? allMenuItems.filter((item) => item.tag === 'UPGRADE')
                    : []
                },
                { title: 'Cheese & sauces', items: allMenuItems.filter((item) => item.tag === 'ADD_ON') },
                { title: 'Add a side', items: allMenuItems.filter((item) => item.category?.name === 'Sides and Loaded Fries' && item.tag !== 'ADD_ON') },
                { title: 'Add a drink', items: allMenuItems.filter((item) => item.category?.name === 'Drinks') }
              ].map((section) => section.items.length > 0 && (
                <fieldset className="addon-section" key={section.title}>
                  <legend>{section.title}</legend>
                  {section.items.map((item) => (
                    <label className="addon-choice" key={item.id}>
                      <input
                        type="checkbox"
                        checked={selectedAddOnIds.includes(item.id)}
                        onChange={() => toggleAddOn(item.id)}
                        disabled={!item.available}
                      />
                      <span>{item.name}{!item.available && ' · unavailable'}</span>
                      <strong>{formatMoney(item.price)}</strong>
                    </label>
                  ))}
                </fieldset>
              ))}
              <label className="special-instructions">
                Special instructions <span>(optional)</span>
                <textarea value={itemNotes} onChange={(event) => setItemNotes(event.target.value)} maxLength={240} placeholder="Anything you'd like us to know?" />
              </label>
              <p className="addon-note">Selected extras are added as separate menu items and priced by the restaurant menu.</p>
              <button
                type="button"
                className="checkout modal-add-button"
                onClick={addSelectedItemToCart}
                disabled={!selectedItem.available}
              >
                Add {selectedQuantity} to order · {formatMoney(
                  (selectedItem.price + selectedAddOnIds.reduce((sum, id) => {
                    const item = allMenuItems.find((menuItem) => menuItem.id === id);
                    return sum + (item?.available ? item.price : 0);
                  }, 0)) * selectedQuantity
                )}
              </button>
            </div>
          </section>
        </div>
      )}

      {view === 'admin' && (
        <main className="admin-main">
          <div className="admin-grid">
            <section className="panel">
              <h3>Dashboard summary</h3>
              {dashboard ? (
                <div className="stats-grid">
                  <div><span>Total orders</span><strong>{dashboard.totalOrders}</strong></div>
                  <div><span>Sales</span><strong>{formatMoney(dashboard.totalSales)}</strong></div>
                  <div><span>Average</span><strong>{formatMoney(dashboard.averageOrderValue)}</strong></div>
                  <div><span>Ready</span><strong>{dashboard.readyOrders}</strong></div>
                </div>
              ) : (
                <p className="empty-state">Admin login required to access the dashboard.</p>
              )}
            </section>

            <section className="panel">
              <h3>Create category</h3>
              <div className="form-grid">
                <input value={categoryForm.name} onChange={(event) => setCategoryForm((current) => ({ ...current, name: event.target.value }))} placeholder="Category name" />
                <input value={categoryForm.description} onChange={(event) => setCategoryForm((current) => ({ ...current, description: event.target.value }))} placeholder="Description" />
                <input value={categoryForm.displayOrder} onChange={(event) => setCategoryForm((current) => ({ ...current, displayOrder: event.target.value }))} placeholder="Display order" type="number" />
              </div>
              <button className="primary-action" onClick={createCategory}>Save category</button>
            </section>

            <section className="panel">
              <h3>Promotions</h3>
              <div className="form-grid">
                <input value={promotionForm.code} onChange={(event) => setPromotionForm((current) => ({ ...current, code: event.target.value }))} placeholder="Promo code" />
                <input value={promotionForm.name} onChange={(event) => setPromotionForm((current) => ({ ...current, name: event.target.value }))} placeholder="Promotion name" />
                <select value={promotionForm.type} onChange={(event) => setPromotionForm((current) => ({ ...current, type: event.target.value }))}>
                  <option value="PERCENTAGE">Percentage</option>
                  <option value="FIXED">Fixed</option>
                </select>
                <input value={promotionForm.value} onChange={(event) => setPromotionForm((current) => ({ ...current, value: event.target.value }))} placeholder="Value" type="number" />
                <input value={promotionForm.minimumOrder} onChange={(event) => setPromotionForm((current) => ({ ...current, minimumOrder: event.target.value }))} placeholder="Minimum order" type="number" />
                <label><input type="checkbox" checked={promotionForm.active} onChange={(event) => setPromotionForm((current) => ({ ...current, active: event.target.checked }))} /> Active</label>
              </div>
              <button className="primary-action" onClick={createPromotion}>Create promotion</button>
              {promotions.length > 0 && (
                <div className="promo-list">
                  {promotions.map((promotion) => (
                    <div className="promo-pill" key={promotion.id}>
                      {promotion.code} • {promotion.type === 'PERCENTAGE' ? `${promotion.value}%` : formatMoney(promotion.value)}
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="panel">
              <h3>Add menu item</h3>
              <div className="form-grid">
                <select value={itemForm.categoryId} onChange={(event) => setItemForm((current) => ({ ...current, categoryId: event.target.value }))}>
                  <option value="">Select category</option>
                  {categories.map((category) => (
                    <option value={category.id} key={category.id}>{category.name}</option>
                  ))}
                </select>
                <input value={itemForm.name} onChange={(event) => setItemForm((current) => ({ ...current, name: event.target.value }))} placeholder="Item name" />
                <input value={itemForm.description} onChange={(event) => setItemForm((current) => ({ ...current, description: event.target.value }))} placeholder="Description" />
                <input value={itemForm.price} onChange={(event) => setItemForm((current) => ({ ...current, price: event.target.value }))} placeholder="Price" type="number" step="0.01" />
                <input value={itemForm.imageUrl} onChange={(event) => setItemForm((current) => ({ ...current, imageUrl: event.target.value }))} placeholder="Image URL" />
                <input value={itemForm.dietaryLabel} onChange={(event) => setItemForm((current) => ({ ...current, dietaryLabel: event.target.value }))} placeholder="Dietary label" />
                <input value={itemForm.tag} onChange={(event) => setItemForm((current) => ({ ...current, tag: event.target.value }))} placeholder="Tag" />
                <input value={itemForm.prepTimeMinutes} onChange={(event) => setItemForm((current) => ({ ...current, prepTimeMinutes: event.target.value }))} placeholder="Prep time" type="number" />
                <label><input type="checkbox" checked={itemForm.featured} onChange={(event) => setItemForm((current) => ({ ...current, featured: event.target.checked }))} /> Featured</label>
                <label><input type="checkbox" checked={itemForm.available} onChange={(event) => setItemForm((current) => ({ ...current, available: event.target.checked }))} /> Available</label>
              </div>
              <button className="primary-action" onClick={createItem}>Save item</button>
            </section>

            <section className="panel wide-panel">
              <h3>Order management</h3>
              {orders.length === 0 ? (
                <p className="empty-state">No orders yet.</p>
              ) : (
                <div className="order-list">
                  {orders.map((order) => (
                    <div className="order-card" key={order.id}>
                      <div className="order-topline">
                        <strong>#{order.id}</strong>
                        <span className="status-badge">{order.status}</span>
                      </div>
                      <div className="order-meta">
                        <span>{order.orderType}</span>
                        <span>{new Date(order.createdAt).toLocaleString()}</span>
                      </div>
                      <ul>
                        {order.items.map((item, index) => (
                          <li key={`${order.id}-${index}`}>
                            {item.quantity}x {item.itemName}
                            {item.notes ? ` — ${item.notes}` : ''}
                          </li>
                        ))}
                      </ul>
                      <div className="order-actions">
                        <select value={order.status} onChange={(event) => updateOrderStatus(order.id, event.target.value)}>
                          {ORDER_STATUSES.map((status) => (
                            <option value={status} key={status}>{status}</option>
                          ))}
                        </select>
                        <strong>{formatMoney(Number(order.total))}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="panel wide-panel">
              <h3>Kitchen display</h3>
              {kitchenOrders.length === 0 ? (
                <p className="empty-state">No active kitchen orders.</p>
              ) : (
                <div className="order-list">
                  {kitchenOrders.map((order) => (
                    <div className="order-card" key={order.id}>
                      <div className="order-topline">
                        <strong>Kitchen #{order.id}</strong>
                        <span className="status-badge">{order.status}</span>
                      </div>
                      <div className="order-meta">
                        <span>{order.orderType}</span>
                        <span>{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <ul>
                        {order.items.map((item, index) => (
                          <li key={`${order.id}-${index}`}>{item.quantity}x {item.itemName}</li>
                        ))}
                      </ul>
                      <div className="order-actions">
                        <select value={order.status} onChange={(event) => updateOrderStatus(order.id, event.target.value)}>
                          {ORDER_STATUSES.map((status) => (
                            <option value={status} key={status}>{status}</option>
                          ))}
                        </select>
                        <strong>{formatMoney(Number(order.total))}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="panel wide-panel">
              <h3>Menu inventory</h3>
              <div className="menu-table">
                <div className="table-head row">
                  <span>Item</span>
                  <span>Category</span>
                  <span>Price</span>
                  <span>Status</span>
                </div>
                {menuItems.map((item) => (
                  <div className="row" key={item.id}>
                    <span>{item.name}</span>
                    <span>{item.category?.name ?? 'General'}</span>
                    <span>{formatMoney(item.price)}</span>
                    <button onClick={() => toggleItemAvailability(item.id, !item.available)}>
                      {item.available ? 'Available' : 'Unavailable'}
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </div>
          {notice && <p className="success admin-notice">{notice}</p>}
          {!canManageRestaurant && <p className="error admin-notice">You do not have permission to manage the restaurant.</p>}
        </main>
      )}
    </div>
  );
}
