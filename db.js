const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DB_FILE = path.join(__dirname, 'data', 'database.json');
const PRODUCTS_FILE = path.join(__dirname, 'data', 'products.json');

class Database {
  constructor() {
    this.data = {
      users: [],
      products: [],
      orders: []
    };
    this.init();
  }

  init() {
    // Check if database file exists
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        this.data = JSON.parse(raw);
      } catch (err) {
        console.error('Error reading database file, reinitializing:', err);
      }
    }

    // Load products if not loaded
    if (!this.data.products || this.data.products.length === 0) {
      if (fs.existsSync(PRODUCTS_FILE)) {
        try {
          const rawProd = fs.readFileSync(PRODUCTS_FILE, 'utf8');
          this.data.products = JSON.parse(rawProd);
          console.log(`Loaded ${this.data.products.length} products into database.`);
        } catch (err) {
          console.error('Error loading products.json:', err);
        }
      }
    }

    // Seed default test user if empty
    if (!this.data.users || this.data.users.length === 0) {
      const salt = crypto.randomBytes(16).toString('hex');
      const hash = crypto.pbkdf2Sync('password123', salt, 1000, 64, 'sha512').toString('hex');
      this.data.users = [
        {
          id: 'usr_demo_1',
          name: 'Demo Customer',
          email: 'demo@zenithkart.com',
          phone: '+91 98765 43210',
          salt,
          passwordHash: hash,
          createdAt: new Date().toISOString()
        }
      ];
    }

    if (!this.data.orders) {
      this.data.orders = [];
    }

    this.save();
  }

  save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (err) {
      console.error('Error saving database:', err);
    }
  }

  // --- Products ---
  getProducts(filters = {}) {
    let list = [...this.data.products];

    // Search query across title, brand, description, category
    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      list = list.filter(p => 
        p.title.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.categoryName.toLowerCase().includes(q) ||
        p.subCategory.toLowerCase().includes(q)
      );
    }

    // Category filter
    if (filters.category && filters.category !== 'all') {
      list = list.filter(p => p.category === filters.category);
    }

    // Brand filter
    if (filters.brand) {
      const brands = Array.isArray(filters.brand) ? filters.brand : [filters.brand];
      list = list.filter(p => brands.includes(p.brand));
    }

    // Price range
    if (filters.minPrice) {
      const minP = Number(filters.minPrice);
      if (!isNaN(minP)) list = list.filter(p => p.price >= minP);
    }
    if (filters.maxPrice) {
      const maxP = Number(filters.maxPrice);
      if (!isNaN(maxP)) list = list.filter(p => p.price <= maxP);
    }

    // Rating
    if (filters.minRating) {
      const minR = Number(filters.minRating);
      if (!isNaN(minR)) list = list.filter(p => p.rating >= minR);
    }

    // Deals only
    if (filters.dealsOnly === 'true' || filters.dealsOnly === true) {
      list = list.filter(p => p.isDealOfTheDay || p.discountPercent >= 40);
    }

    // Sorting
    if (filters.sort) {
      switch (filters.sort) {
        case 'price_asc':
          list.sort((a, b) => a.price - b.price);
          break;
        case 'price_desc':
          list.sort((a, b) => b.price - a.price);
          break;
        case 'discount_desc':
          list.sort((a, b) => b.discountPercent - a.discountPercent);
          break;
        case 'rating_desc':
          list.sort((a, b) => b.rating - a.rating);
          break;
        case 'reviews_desc':
          list.sort((a, b) => b.reviewCount - a.reviewCount);
          break;
        default:
          // Popularity / default
          break;
      }
    }

    const total = list.length;
    const page = Math.max(1, parseInt(filters.page) || 1);
    const limit = Math.max(1, parseInt(filters.limit) || 24);
    const start = (page - 1) * limit;
    const paginated = list.slice(start, start + limit);

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      products: paginated
    };
  }

  getProductById(id) {
    const numId = Number(id);
    return this.data.products.find(p => p.id === numId) || null;
  }

  getCategories() {
    const map = {};
    for (const p of this.data.products) {
      if (!map[p.category]) {
        map[p.category] = {
          id: p.category,
          name: p.categoryName,
          count: 0,
          subCategories: new Set()
        };
      }
      map[p.category].count++;
      map[p.category].subCategories.add(p.subCategory);
    }

    return Object.values(map).map(c => ({
      ...c,
      subCategories: Array.from(c.subCategories)
    }));
  }

  // --- Users & Auth ---
  registerUser({ name, email, password, phone }) {
    const cleanEmail = email.trim().toLowerCase();
    const existing = this.data.users.find(u => u.email === cleanEmail);
    if (existing) {
      throw new Error('An account with this email address already exists.');
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');

    const newUser = {
      id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      name: name.trim(),
      email: cleanEmail,
      phone: phone ? phone.trim() : '',
      salt,
      passwordHash: hash,
      createdAt: new Date().toISOString()
    };

    this.data.users.push(newUser);
    this.save();

    // Return user without sensitive salt/hash
    return {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone,
      token: Buffer.from(`${newUser.id}:${cleanEmail}:${Date.now()}`).toString('base64')
    };
  }

  loginUser(email, password) {
    const cleanEmail = email.trim().toLowerCase();
    const user = this.data.users.find(u => u.email === cleanEmail);
    if (!user) {
      throw new Error('Invalid email or password.');
    }

    const hash = crypto.pbkdf2Sync(password, user.salt, 1000, 64, 'sha512').toString('hex');
    if (hash !== user.passwordHash) {
      throw new Error('Invalid email or password.');
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      token: Buffer.from(`${user.id}:${cleanEmail}:${Date.now()}`).toString('base64')
    };
  }

  getUserByToken(token) {
    if (!token) return null;
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf8');
      const [userId, email] = decoded.split(':');
      const user = this.data.users.find(u => u.id === userId && u.email === email);
      if (!user) return null;
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone
      };
    } catch {
      return null;
    }
  }

  // --- Orders ---
  createOrder({ userId, items, shippingAddress, paymentMethod, paymentDetails, totals }) {
    const orderId = 'ZK-' + Date.now().toString().slice(-6) + '-' + Math.floor(1000 + Math.random() * 9000);
    const newOrder = {
      id: orderId,
      userId: userId || 'guest',
      items,
      shippingAddress,
      paymentMethod, // 'UPI', 'COD', 'CARD', 'NETBANKING'
      paymentDetails: paymentDetails || {},
      totals,
      status: paymentMethod === 'COD' ? 'Confirmed (Cash on Delivery)' : 'Paid & Confirmed',
      trackingStatus: 'Processing',
      createdAt: new Date().toISOString(),
      estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toDateString()
    };

    this.data.orders.unshift(newOrder);
    this.save();
    return newOrder;
  }

  getUserOrders(userId) {
    if (!userId) return [];
    return this.data.orders.filter(o => o.userId === userId);
  }

  getOrderById(orderId) {
    return this.data.orders.find(o => o.id === orderId) || null;
  }
}

module.exports = new Database();
