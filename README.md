# 🛍️ ZenithKart — Next-Gen Indian E-Commerce Web Platform

> A full-featured, ultra-smooth e-commerce application inspired by Amazon and Flipkart, boasting **1,000+ products**, intelligent live search, real-time cart, Indian payment checkout (UPI, Cash on Delivery, Cards), order tracking, user auth, and an integrated **AI Shopping Assistant**.

---

## 🌟 Key Highlights & Features

### 1. 📦 Massive 1,000+ Product Catalog
- **8 Diverse Categories**:
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
  - Interactive hero banner carousel with auto-play and dot navigation.
  - Deal of the Day section with a live countdown timer (`ENDS IN: 05h : 34m : 48s`).
  - Instant debounced search bar with live autocomplete dropdown and product thumbnails.
  - Multi-faceted filter sidebar: Price range slider, brand checklist, minimum rating, minimum discount, and "Deals Only" toggle.
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
- Order confirmation screen with unique order ID (`ZK-xxxxxx`), estimated delivery date, and a visual 4-step tracking stepper (`Confirmed ➔ Packed ➔ Shipped ➔ Delivered`).

### 5. 🤖 Zenith AI Shopping Assistant
- Floating chat bubble with quick prompt chips.
- Conversational product recommendations by price budget, category, or occasion (e.g., *"Suggest gaming laptops under 80000"*, *"Gift ideas under 2000"*).
- Instant order tracking: Ask *"Track order ZK-xxxxxx"* to see real-time order status.

### 6. 🔐 User Authentication & Orders History
- User registration and login with secure PBKDF2 password hashing and salt.
- "Quick One-Click Demo Login" for instant testing.
- My Orders portal showing past orders, delivery addresses, and tracking status.

---

## 🚀 Quick Start (Run Locally)

### Option 1: Node.js (Recommended — 0 External Dependencies Required)
The project comes with a built-in zero-dependency HTTP server that works right out of the box with standard Node.js:

```bash
# 1. Navigate to the project directory
cd zenithkart

# 2. Run the server
node server.js
```

Open your browser and visit: **`http://localhost:3000`**

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

To push this project to your GitHub repository:

```bash
# Initialize git repository
git init

# Add all files
git add .

# Commit changes
git commit -m "Initial commit: ZenithKart E-Commerce Platform"

# Add your GitHub remote repository URL
git remote add origin https://github.com/<YOUR_USERNAME>/<YOUR_REPOSITORY_NAME>.git

# Push to main branch
git branch -M main
git push -u origin main
```

---

## ☁️ Deploy to Render in 2 Minutes

This repository includes a ready-to-use `render.yaml` configuration file for 1-click deployment on Render.

1. Go to [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** ➔ **Web Service**.
3. Connect your GitHub repository (`zenithkart`).
4. Configure settings:
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Port**: `10000` (Render will automatically detect the port)
5. Click **Create Web Service**. Your store will be live in under 2 minutes!

---

## 📁 Project File Structure

```
zenithkart/
├── data/
│   ├── database.json        # Persistent database (users, products, orders)
│   └── products.json        # 1,080+ curated products across 8 categories
├── public/
│   ├── css/
│   │   └── styles.css       # Responsive, ultra-smooth styling (Flipkart/Amazon style)
│   ├── images/
│   │   ├── favicon.svg      # ZenithKart brand favicon
│   │   └── logo.svg         # Modern vector logo
│   ├── js/
│   │   └── app.js           # Client-side state, cart, checkout, AI assistant, search
│   └── index.html           # Single-page e-commerce storefront
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

---

## 👥 Authorship & Credits
Designed and engineered for **Devajyoti Ghosh**.
