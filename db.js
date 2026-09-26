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
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        this.data = JSON.parse(raw);
      } catch (err) {
        console.error('Error reading database file, reinitializing:', err);
      }
    }

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

    if (!this.data.users) this.data.users = [];
    if (!this.data.orders) this.data.orders = [];
    this.save();
  }

  save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (err) {
      console.error('Error saving database:', err);
    }
  }

  // --- Products Catalog ---
  getProducts(filters = {}) {
    let list = [...this.data.products];

    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      list = list.filter(p => 
        p.title.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        (p.categoryName && p.categoryName.toLowerCase().includes(q)) ||
        (p.subCategory && p.subCategory.toLowerCase().includes(q))
      );
    }

    if (filters.category && filters.category !== 'all') {
      list = list.filter(p => p.category === filters.category);
    }

    if (filters.brand) {
      const brands = Array.isArray(filters.brand) ? filters.brand : [filters.brand];
      list = list.filter(p => brands.includes(p.brand));
    }

    if (filters.minPrice) {
      const minP = Number(filters.minPrice);
      if (!isNaN(minP)) list = list.filter(p => p.price >= minP);
    }
    if (filters.maxPrice) {
      const maxP = Number(filters.maxPrice);
      if (!isNaN(maxP)) list = list.filter(p => p.price <= maxP);
    }

    if (filters.minRating) {
      const minR = Number(filters.minRating);
      if (!isNaN(minR)) list = list.filter(p => p.rating >= minR);
    }

    if (filters.dealsOnly === 'true' || filters.dealsOnly === true) {
      list = list.filter(p => p.isDealOfTheDay || p.discountPercent >= 40);
    }

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
          name: p.categoryName || p.category,
          count: 0,
          subCategories: new Set()
        };
      }
      map[p.category].count++;
      if (p.subCategory) map[p.category].subCategories.add(p.subCategory);
    }

    return Object.values(map).map(c => ({
      ...c,
      subCategories: Array.from(c.subCategories)
    }));
  }

  // --- Users & Authentication ---
  registerUser({ name, email, password, phone }) {
    const cleanEmail = email.trim().toLowerCase();
    const existing = this.data.users.find(u => u.email === cleanEmail);
    if (existing) {
      throw new Error('An account with this email address already exists. Please Sign In.');
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');

    const newUser = {
      id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      name: name.trim(),
      email: cleanEmail,
      phone: phone ? phone.trim() : '',
      savedAddress: null,
      salt,
      passwordHash: hash,
      createdAt: new Date().toISOString()
    };

    this.data.users.push(newUser);
    this.save();

    return {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone,
      savedAddress: newUser.savedAddress,
      token: Buffer.from(`${newUser.id}:${cleanEmail}:${Date.now()}`).toString('base64')
    };
  }

  loginUser(email, password) {
    const cleanEmail = email.trim().toLowerCase();
    const user = this.data.users.find(u => u.email === cleanEmail);
    if (!user) {
      throw new Error('Invalid email or password. Please check your credentials or Create Account.');
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
      savedAddress: user.savedAddress || null,
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
        phone: user.phone,
        savedAddress: user.savedAddress || null
      };
    } catch {
      return null;
    }
  }

  updateUserAddress(userId, address) {
    const user = this.data.users.find(u => u.id === userId);
    if (user) {
      user.savedAddress = address;
      this.save();
    }
  }

  // --- Orders & Tracking ---
  createOrder({ userId, customerEmail, items, shippingAddress, paymentMethod, paymentDetails, totals }) {
    const orderId = 'ZK-' + Date.now().toString().slice(-6) + '-' + Math.floor(1000 + Math.random() * 9000);
    
    // Status should accurately reflect payment method
    let orderStatus = 'Payment Verified & Confirmed';
    if (paymentMethod === 'COD') {
      orderStatus = 'Confirmed (Cash on Delivery)';
    } else if (paymentMethod === 'UPI') {
      orderStatus = 'Paid via UPI (Ref: ' + (paymentDetails.transactionRef || 'UPI-' + Date.now().toString().slice(-6)) + ')';
    } else if (paymentMethod === 'CARD') {
      orderStatus = 'Paid via Card (Bank Auth Verified)';
    }

    const newOrder = {
      id: orderId,
      userId: userId || 'guest',
      customerEmail: customerEmail || (shippingAddress ? shippingAddress.email : ''),
      items,
      shippingAddress,
      paymentMethod,
      paymentDetails: paymentDetails || {},
      totals,
      status: orderStatus,
      trackingStatus: 'Processing',
      createdAt: new Date().toISOString(),
      estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toDateString()
    };

    this.data.orders.unshift(newOrder);

    // Save address for logged-in user if available
    if (userId && userId !== 'guest') {
      this.updateUserAddress(userId, shippingAddress);
    }

    this.save();
    return newOrder;
  }

  getUserOrders(userId, email = null) {
    if (!userId && !email) return [];
    return this.data.orders.filter(o => 
      (userId && userId !== 'guest' && o.userId === userId) ||
      (email && o.customerEmail && o.customerEmail.toLowerCase() === email.toLowerCase())
    );
  }

  getOrderById(orderId) {
    return this.data.orders.find(o => o.id === orderId) || null;
  }
}

module.exports = new Database();
