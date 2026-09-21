# 🛍️ ZenithKart — Next-Gen Indian E-Commerce Web Platform

> A full-featured, ultra-smooth, **mobile-responsive** e-commerce application inspired by Amazon and Flipkart, boasting **1,000+ products**, intelligent live search, real-time cart, Indian payment checkout (UPI, Cash on Delivery, Cards), order tracking, user auth, and an integrated **AI Shopping Assistant**.

---

## 📱 Mobile-First & Touchscreen Optimization

ZenithKart is built from the ground up to feel like a native mobile app on smartphones (iPhone, Android) and tablets:

1. **Native-Feel Mobile Bottom Navigation Bar**:
   - Fixed at the bottom of the screen with quick access to:
     - 🏠 **Home**: Instant jump to top and catalog refresh.
     - 🗂️ **Categories**: Interactive bottom sheet displaying all 8 categories with product counts.
     - ⚡ **Deals**: Instant toggle for 40%+ lightning offers.
     - 🛒 **Cart**: Real-time counter badge synced with slide-over drawer.
     - 👤 **Account**: One-tap sign in, registration, or order history.
2. **2-Column Mobile Product Grid**:
   - Follows the industry-standard layout of Flipkart and Amazon mobile apps.
   - Clean, touch-friendly product cards with discount badges, star ratings, and optimized image heights.
3. **Touch-Swipe Gestures on Hero Carousel**:
   - Native touch listeners (`touchstart`, `touchmove`, `touchend`) allow users to swipe between promotional banners with their finger.
4. **Sticky Mobile Filter & Sort Toolbar**:
   - Pinned beneath the category ribbon on mobile with quick buttons:
     - `⇅ Sort`: Opens a smooth slide-up bottom sheet with sorting options.
     - `🔥 Deals`: 1-tap filter for big discount items.
     - `⚙️ Filters`: Opens a full filter sheet with an active filter counter badge.
5. **Thumb-Friendly Sticky Bottom Bar on Product Details**:
   - When viewing any product on mobile, a sticky bottom action bar appears with full-width **"Add to Cart"** and **"Buy Now"** buttons for effortless single-hand shopping.
6. **Mobile Ergonomics & iOS Safari Optimization**:
   - Viewport set with `viewport-fit=cover` for notch support.
   - Inputs formatted to 16px to prevent unwanted iOS auto-zoom.
   - Safe area inset padding (`env(safe-area-inset-bottom)`) for modern bezel-less smartphones.

---

## 🌟 Key Highlights & Features

### 1. 📦 Massive 1,000+ Product Catalog
- **8 Core Categories**:
  - 📱 Mobiles & Tablets (Flagship 5G phones, iPads, Gaming phones)
  - 💻 Electronics & Laptops (Gaming laptops, ANC headphones, Smartwatches, Keyboards)
  - 👔 Men's Fashion (Casual shirts, Denim jeans, Sneakers, Jackets)
  - 👗 Women's Fashion (Anarkali kurtas, Silver jewelry, Western dresses, Tote bags)
  - 🏠 Home & Kitchen (Digital air fryers, Nutri-blenders, Water purifiers, Cookware)
  - ⚽ Sports & Fitness (Badminton racquets, Dumbbell home gym kits, Yoga mats)
  - 💄 Beauty & Grooming (Face serums, Waterproof trimmers, Luxury perfumes)
  - 📚 Books & Stationery (Bestsellers, Scientific calculators, Fountain pens)
- Realistic pricing in Indian Rupees (₹), MRP strikethrough, and discount badges up to 70% OFF.
- Specifications table, customer star ratings, verified review counts, and stock indicators.

### 2. ⚡ Lightning-Fast, Zero-Lag Frontend
- **Amazon & Flipkart Inspired Modern Aesthetic**:
  - Top announcement banner with festive coupon promotions.
  - Interactive hero banner carousel with auto-play, dot navigation, and mobile swipe.
  - Deal of the Day section with a live countdown timer (`ENDS IN: 05h : 34m : 48s`).
  - Instant debounced search bar with live autocomplete dropdown and product thumbnails.
  - Multi-faceted filter sidebar / mobile sheet: Price range slider, brand checklist, minimum rating, minimum discount, and "Deals Only" toggle.
  - Sorting: Price Low-to-High, High-to-Low, Biggest Discount, Highest Rating, and Most Reviewed.
  - Clean pagination with smooth auto-scroll.

### 3. 🛒 Real-Time Cart & Coupon Engine
- Slide-over cart drawer with instant quantity increments/decrements (+ / -) and item removal.
- Real-time coupon validator with instant savings calculation:
  - `FESTIVE10` — Extra 10% Discount
  - `UPI200` — Flat ₹200 OFF
  - `SUPER50` — 15% Mega Discount
- Price breakdown: Total MRP, Product Discount, Coupon Discount, Free Delivery guarantee, and Total Savings display.

### 4. 💳 Indian Payment Gateway & Checkout
- Delivery address confirmation with pre-filled defaults.
- **Payment Methods**:
  - ⚡ **UPI**: One-click selection for Google Pay, PhonePe, Paytm, BHIM, or enter any UPI VPA (e.g. `user@okhdfcbank`) with 5% instant discount.
  - 💵 **Cash on Delivery (COD)**: Doorstep cash/QR option.
  - 💳 **Credit / Debit Cards**: Card number, Expiry, CVV validation.
- Order confirmation screen with unique order ID (`ZK-XXXXXX`), estimated delivery date, and a visual 4-step tracking stepper (`Confirmed ➔ Packed ➔ Shipped ➔ Delivered`).

### 5. 🤖 Zenith AI Shopping Assistant
- Floating chat bubble (positioned cleanly above mobile nav bar).
- Conversational product recommendations by price budget, category, or occasion (e.g., *"Suggest gaming laptops under 80000"*, *"Gift ideas under 2000"*).
- Instant order tracking: Ask *"Track order ZK-XXXXXX"* to see real-time order status.

### 6. 🔐 User Authentication & Orders History
- User registration and login with secure PBKDF2 password hashing and salt.
- "Quick One-Click Demo Login" for instant testing.
- My Orders portal showing past orders, delivery addresses, and tracking status.

---

## 🚀 Quick Start (Run Locally)

### Option 1: Node.js (Recommended — 0 External Dependencies Required)
```bash
cd zenithkart
node server.js
```
Open your browser (or mobile browser / responsive device simulator) and visit: **`http://localhost:3000`**

### Option 2: Express.js (With NPM)
```bash
npm install
npm start
```

### Option 3: Python (Alternative)
```bash
pip install -r requirements.txt
python app.py
```

---

## 🌐 Deploy to GitHub

```bash
cd zenithkart
git init
git add .
git commit -m "feat: mobile responsiveness and touch compatibility"
git branch -M main
git remote add origin https://github.com/<YOUR_USERNAME>/<YOUR_REPOSITORY_NAME>.git
git push -u origin main
```

---

## ☁️ Deploy to Render in 2 Minutes

This repository includes a ready-to-use `render.yaml` configuration file for 1-click deployment on Render.

1. Go to [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** ➔ **Web Service**.
3. Connect your GitHub repository (`zenithkart`).
4. Build & start commands are pre-configured:
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
5. Click **Create Web Service**.

---

## 📁 Project File Structure

```
zenithkart/
├── data/
│   ├── database.json        # Persistent store for users, products, and orders
│   └── products.json        # 1,080+ categorized products
├── public/
│   ├── css/
│   │   └── styles.css       # Full responsive styles + mobile bottom sheets & navbar
│   ├── images/
│   │   ├── favicon.svg      # ZenithKart brand icon
│   │   └── logo.svg         # High-resolution vector logo
│   ├── js/
│   │   └── app.js           # Client logic, search, cart, checkout, touch & mobile sheets
│   └── index.html           # Responsive storefront with mobile bottom navigation
├── aiAssistant.js           # Smart product recommendation & order tracking AI engine
├── app.py                   # Python backend alternative
├── db.js                    # Database manager (PBKDF2 auth, orders, products querying)
├── generate_products.py     # Product generator script for 1,000+ items
├── package.json             # NPM metadata and dependencies
├── render.yaml              # Render blueprint for one-click deployment
├── requirements.txt         # Python dependencies
├── server.js                # High-performance server (Express & native fallback)
└── README.md                # Comprehensive documentation
```
