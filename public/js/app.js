/**
 * ZenithKart E-Commerce Application Frontend
 * Modern, Ultra-Smooth, Zero-Lag Architecture
 */

// Global State
const state = {
  currentUser: JSON.parse(localStorage.getItem('zk_user')) || null,
  cart: JSON.parse(localStorage.getItem('zk_cart')) || [],
  wishlist: JSON.parse(localStorage.getItem('zk_wishlist')) || [],
  coupon: JSON.parse(localStorage.getItem('zk_coupon')) || null,
  selectedPayment: 'UPI',
  selectedUPIApp: 'Google Pay',
  activeFilters: {
    category: 'all',
    search: '',
    brands: [],
    minPrice: '',
    maxPrice: '',
    minRating: '',
    minDiscount: '',
    dealsOnly: false,
    sort: 'featured',
    page: 1,
    limit: 24
  },
  categories: [],
  brands: [],
  carouselIndex: 0,
  carouselTimer: null
};

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initCarousel();
  initCountdownTimer();
  initSearchAutocomplete();
  fetchCategories();
  fetchProducts();
  updateCartBadge();
  updateWishlistBadge();
  checkUserSession();
});

// --- API Helpers ---
async function apiCall(endpoint, method = 'GET', body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token || (state.currentUser && state.currentUser.token)) {
    headers['Authorization'] = `Bearer ${token || state.currentUser.token}`;
  }
  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  try {
    const res = await fetch(endpoint, options);
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Server error');
    }
    return data;
  } catch (err) {
    console.error(`API Error on ${endpoint}:`, err);
    throw err;
  }
}

// --- Categories & Filter Population ---
async function fetchCategories() {
  try {
    const data = await apiCall('/api/categories');
    state.categories = data;

    // Populate category filter checkboxes in sidebar
    const container = document.getElementById('category-filter-list');
    if (container) {
      container.innerHTML = data.map(c => `
        <label class="filter-checkbox-label">
          <input type="checkbox" value="${c.id}" class="filter-cat-cb" onchange="handleCategoryCheckboxChange(this)">
          <span>${c.name}</span>
          <span class="filter-count">${c.count}</span>
        </label>
      `).join('');
    }

    // Populate brands
    const allBrands = new Set();
    data.forEach(c => {
      // Brands can be fetched or extracted
    });
  } catch (err) {
    console.error('Failed to load categories', err);
  }
}

// --- Fetch & Render Products ---
async function fetchProducts() {
  const grid = document.getElementById('products-grid');
  if (!grid) return;

  // Show loading shimmer
  grid.innerHTML = Array(8).fill(0).map(() => `
    <div class="product-card" style="opacity: 0.6;">
      <div class="product-img-wrapper" style="background: #E2E8F0; animation: pulse 1.2s infinite ease-in-out;"></div>
      <div class="product-info">
        <div style="height: 12px; width: 40%; background: #E2E8F0; margin-bottom: 8px; border-radius: 4px;"></div>
        <div style="height: 18px; width: 90%; background: #E2E8F0; margin-bottom: 12px; border-radius: 4px;"></div>
        <div style="height: 24px; width: 60%; background: #E2E8F0; border-radius: 4px;"></div>
      </div>
    </div>
  `).join('');

  // Build query string
  const p = new URLSearchParams();
  p.append('page', state.activeFilters.page);
  p.append('limit', state.activeFilters.limit);
  if (state.activeFilters.category && state.activeFilters.category !== 'all') {
    p.append('category', state.activeFilters.category);
  }
  if (state.activeFilters.search) {
    p.append('search', state.activeFilters.search);
  }
  if (state.activeFilters.brands.length) {
    state.activeFilters.brands.forEach(b => p.append('brand', b));
  }
  if (state.activeFilters.minPrice) p.append('minPrice', state.activeFilters.minPrice);
  if (state.activeFilters.maxPrice) p.append('maxPrice', state.activeFilters.maxPrice);
  if (state.activeFilters.minRating) p.append('minRating', state.activeFilters.minRating);
  if (state.activeFilters.dealsOnly) p.append('dealsOnly', 'true');
  if (state.activeFilters.sort && state.activeFilters.sort !== 'featured') {
    p.append('sort', state.activeFilters.sort);
  }

  try {
    const data = await apiCall(`/api/products?${p.toString()}`);
    renderProductsGrid(data.products);
    renderPagination(data.total, data.page, data.limit, data.totalPages);
    updateCatalogStats(data.total, data.page, data.limit);
    renderActiveFilterChips();
    extractAndRenderBrands(data.products);
  } catch (err) {
    grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px;">
      <h3>Failed to load products</h3>
      <p style="color: var(--text-muted);">${err.message}</p>
      <button class="btn-card-cart" onclick="fetchProducts()" style="margin-top: 10px;">Retry</button>
    </div>`;
  }
}

function renderProductsGrid(products) {
  const grid = document.getElementById('products-grid');
  if (!products || products.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; background: #FFF; border-radius: var(--radius-md); border: 1px dashed var(--border-color);">
        <div style="font-size: 3rem; margin-bottom: 12px;">🔍</div>
        <h3 style="font-size: 1.3rem; font-weight: 700;">No matching products found</h3>
        <p style="color: var(--text-muted); margin-top: 6px;">Try adjusting your filters, clearing search keywords, or selecting another category.</p>
        <button class="slide-btn" onclick="resetAllFilters()" style="margin-top: 16px;">Reset All Filters</button>
      </div>
    `;
    return;
  }

  grid.innerHTML = products.map(p => {
    const isWishlisted = state.wishlist.includes(p.id);
    const savings = p.mrp - p.price;
    return `
      <div class="product-card" onclick="openProductModal(${p.id})">
        <div class="product-badges">
          ${p.discountPercent ? `<span class="badge-discount">${p.discountPercent}% OFF</span>` : ''}
          ${p.badge ? `<span class="badge-special">${p.badge}</span>` : ''}
        </div>

        <button class="product-wishlist-btn ${isWishlisted ? 'active' : ''}" 
          onclick="event.stopPropagation(); toggleWishlist(${p.id})" 
          title="${isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}">
          ${isWishlisted ? '❤️' : '🤍'}
        </button>

        <div class="product-img-wrapper">
          <img class="product-img" src="${p.image}" alt="${p.title}" loading="lazy" onerror="this.src='/images/logo.svg'">
        </div>

        <div class="product-info">
          <span class="product-brand">${p.brand}</span>
          <h4 class="product-title" title="${p.title}">${p.title}</h4>

          <div class="product-rating-row">
            <span class="rating-pill">
              ★ ${p.rating}
            </span>
            <span class="reviews-count">(${p.reviewCount.toLocaleString('en-IN')})</span>
          </div>

          <div class="product-price-row">
            <span class="price-current">₹${p.price.toLocaleString('en-IN')}</span>
            <span class="price-mrp">₹${p.mrp.toLocaleString('en-IN')}</span>
            <span class="price-saved">Save ₹${savings.toLocaleString('en-IN')}</span>
          </div>

          <div class="product-card-actions" onclick="event.stopPropagation()">
            <button class="btn-card-cart" onclick="addToCart(${p.id}, 1, true)">Add to Cart</button>
            <button class="btn-card-buy" onclick="quickBuyNow(${p.id})">Buy Now</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function updateCatalogStats(total, page, limit) {
  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);
  const el = document.getElementById('catalog-count-text');
  if (el) {
    el.innerHTML = `Showing <strong>${start} - ${end}</strong> of <strong>${total.toLocaleString('en-IN')}</strong> products`;
  }
}

function renderPagination(total, page, limit, totalPages) {
  const container = document.getElementById('pagination-controls');
  if (!container) return;

  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }

  let html = '';
  // Prev button
  html += `<button class="page-btn" ${page === 1 ? 'disabled' : ''} onclick="changePage(${page - 1})">‹ Previous</button>`;

  // Numbered pages
  let startPage = Math.max(1, page - 2);
  let endPage = Math.min(totalPages, startPage + 4);
  if (endPage - startPage < 4) {
    startPage = Math.max(1, endPage - 4);
  }

  if (startPage > 1) {
    html += `<button class="page-btn" onclick="changePage(1)">1</button>`;
    if (startPage > 2) html += `<span style="padding: 0 4px;">...</span>`;
  }

  for (let i = startPage; i <= endPage; i++) {
    html += `<button class="page-btn ${i === page ? 'active' : ''}" onclick="changePage(${i})">${i}</button>`;
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) html += `<span style="padding: 0 4px;">...</span>`;
    html += `<button class="page-btn" onclick="changePage(${totalPages})">${totalPages}</button>`;
  }

  // Next button
  html += `<button class="page-btn" ${page === totalPages ? 'disabled' : ''} onclick="changePage(${page + 1})">Next ›</button>`;

  container.innerHTML = html;
}

function changePage(newPage) {
  state.activeFilters.page = newPage;
  fetchProducts();
  window.scrollTo({ top: 400, behavior: 'smooth' });
}

function extractAndRenderBrands(products) {
  const brandSet = new Set(products.map(p => p.brand));
  const container = document.getElementById('brand-filter-list');
  if (!container || container.children.length > 5) return; // Keep existing if loaded

  container.innerHTML = Array.from(brandSet).slice(0, 10).map(b => `
    <label class="filter-checkbox-label">
      <input type="checkbox" value="${b}" class="filter-brand-cb" onchange="handleBrandCheckboxChange(this)" ${state.activeFilters.brands.includes(b) ? 'checked' : ''}>
      <span>${b}</span>
    </label>
  `).join('');
}

// --- Active Filters & Handlers ---
function applyFilters() {
  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) state.activeFilters.sort = sortSelect.value;

  const minP = document.getElementById('filter-min-price');
  if (minP) state.activeFilters.minPrice = minP.value;

  const maxP = document.getElementById('filter-max-price');
  if (maxP) state.activeFilters.maxPrice = maxP.value;

  const dealsOnly = document.getElementById('filter-deals-only');
  if (dealsOnly) state.activeFilters.dealsOnly = dealsOnly.checked;

  const ratingRadio = document.querySelector('input[name="rating-filter"]:checked');
  if (ratingRadio) state.activeFilters.minRating = ratingRadio.value;

  state.activeFilters.page = 1;
  fetchProducts();
}

function handleCategoryCheckboxChange(cb) {
  if (cb.checked) {
    state.activeFilters.category = cb.value;
  } else {
    state.activeFilters.category = 'all';
  }
  // Uncheck others
  document.querySelectorAll('.filter-cat-cb').forEach(el => {
    if (el !== cb) el.checked = false;
  });
  updateCategoryPillsHighlight();
  state.activeFilters.page = 1;
  fetchProducts();
}

function handleBrandCheckboxChange(cb) {
  if (cb.checked) {
    state.activeFilters.brands.push(cb.value);
  } else {
    state.activeFilters.brands = state.activeFilters.brands.filter(b => b !== cb.value);
  }
  state.activeFilters.page = 1;
  fetchProducts();
}

function applyCategoryFilter(catId) {
  state.activeFilters.category = catId;
  updateCategoryPillsHighlight();
  state.activeFilters.page = 1;
  fetchProducts();
  const el = document.getElementById('products-grid');
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}

function updateCategoryPillsHighlight() {
  document.querySelectorAll('.cat-pill').forEach(pill => {
    if (pill.dataset.cat === state.activeFilters.category) {
      pill.classList.add('active');
    } else {
      pill.classList.remove('active');
    }
  });
}

function renderActiveFilterChips() {
  const container = document.getElementById('active-filter-chips');
  if (!container) return;

  const chips = [];
  if (state.activeFilters.category && state.activeFilters.category !== 'all') {
    chips.push({ label: `Category: ${state.activeFilters.category}`, action: () => { state.activeFilters.category = 'all'; applyFilters(); } });
  }
  if (state.activeFilters.search) {
    chips.push({ label: `Search: "${state.activeFilters.search}"`, action: () => { state.activeFilters.search = ''; document.getElementById('search-input').value = ''; applyFilters(); } });
  }
  if (state.activeFilters.dealsOnly) {
    chips.push({ label: `Deals (40%+)`, action: () => { state.activeFilters.dealsOnly = false; document.getElementById('filter-deals-only').checked = false; applyFilters(); } });
  }
  state.activeFilters.brands.forEach(b => {
    chips.push({ label: `Brand: ${b}`, action: () => { state.activeFilters.brands = state.activeFilters.brands.filter(item => item !== b); applyFilters(); } });
  });
  if (state.activeFilters.minPrice || state.activeFilters.maxPrice) {
    chips.push({ label: `₹${state.activeFilters.minPrice || '0'} - ₹${state.activeFilters.maxPrice || 'Any'}`, action: () => { state.activeFilters.minPrice = ''; state.activeFilters.maxPrice = ''; document.getElementById('filter-min-price').value = ''; document.getElementById('filter-max-price').value = ''; applyFilters(); } });
  }

  container.innerHTML = chips.map((c, idx) => `
    <span class="filter-chip">
      ${c.label}
      <span class="filter-chip-remove" onclick="removeFilterChip(${idx})">✕</span>
    </span>
  `).join('');

  window._activeFilterActions = chips.map(c => c.action);
}

function removeFilterChip(idx) {
  if (window._activeFilterActions && window._activeFilterActions[idx]) {
    window._activeFilterActions[idx]();
  }
}

function resetAllFilters() {
  state.activeFilters = {
    category: 'all',
    search: '',
    brands: [],
    minPrice: '',
    maxPrice: '',
    minRating: '',
    minDiscount: '',
    dealsOnly: false,
    sort: 'featured',
    page: 1,
    limit: 24
  };
  document.getElementById('search-input').value = '';
  document.getElementById('filter-min-price').value = '';
  document.getElementById('filter-max-price').value = '';
  document.getElementById('filter-deals-only').checked = false;
  document.querySelectorAll('input[type="checkbox"]').forEach(c => c.checked = false);
  document.querySelectorAll('input[type="radio"]').forEach(c => c.checked = false);
  updateCategoryPillsHighlight();
  fetchProducts();
}

// --- Search Bar & Autocomplete ---
function initSearchAutocomplete() {
  const input = document.getElementById('search-input');
  const catSelect = document.getElementById('search-category');
  const btn = document.getElementById('search-btn');
  const clearBtn = document.getElementById('search-clear');
  const dropdown = document.getElementById('search-suggestions');

  let debounceTimer = null;

  input.addEventListener('input', () => {
    const val = input.value.trim();
    clearBtn.style.display = val ? 'block' : 'none';

    clearTimeout(debounceTimer);
    if (val.length < 2) {
      dropdown.style.display = 'none';
      return;
    }

    debounceTimer = setTimeout(async () => {
      try {
        const cat = catSelect.value !== 'all' ? `&category=${catSelect.value}` : '';
        const data = await apiCall(`/api/products?search=${encodeURIComponent(val)}&limit=6${cat}`);
        if (data.products && data.products.length > 0) {
          dropdown.innerHTML = data.products.map(p => `
            <div class="suggestion-item" onclick="selectSuggestion(${p.id})">
              <img src="${p.image}" class="suggestion-thumb" alt="${p.title}" onerror="this.src='/images/logo.svg'">
              <span class="suggestion-title">${highlightText(p.title, val)}</span>
              <span class="suggestion-price">₹${p.price.toLocaleString('en-IN')}</span>
            </div>
          `).join('');
          dropdown.style.display = 'block';
        } else {
          dropdown.style.display = 'none';
        }
      } catch (err) {
        dropdown.style.display = 'none';
      }
    }, 200);
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      executeSearch();
    }
  });

  btn.addEventListener('click', executeSearch);

  clearBtn.addEventListener('click', () => {
    input.value = '';
    clearBtn.style.display = 'none';
    dropdown.style.display = 'none';
    state.activeFilters.search = '';
    state.activeFilters.page = 1;
    fetchProducts();
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-wrapper')) {
      dropdown.style.display = 'none';
    }
  });
}

function highlightText(text, query) {
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return text.substring(0, idx) + '<strong>' + text.substring(idx, idx + query.length) + '</strong>' + text.substring(idx + query.length);
}

function selectSuggestion(productId) {
  document.getElementById('search-suggestions').style.display = 'none';
  openProductModal(productId);
}

function executeSearch() {
  const input = document.getElementById('search-input');
  const catSelect = document.getElementById('search-category');
  document.getElementById('search-suggestions').style.display = 'none';

  state.activeFilters.search = input.value.trim();
  if (catSelect.value !== 'all') {
    state.activeFilters.category = catSelect.value;
  }
  state.activeFilters.page = 1;
  fetchProducts();

  const grid = document.getElementById('products-grid');
  if (grid) grid.scrollIntoView({ behavior: 'smooth' });
}

// --- Category Ribbon Event Handling ---
function initNavbar() {
  document.querySelectorAll('.cat-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      const cat = pill.dataset.cat;
      if (cat === 'deals') {
        state.activeFilters.dealsOnly = true;
        document.getElementById('filter-deals-only').checked = true;
        state.activeFilters.category = 'all';
      } else {
        state.activeFilters.category = cat;
        state.activeFilters.dealsOnly = false;
        document.getElementById('filter-deals-only').checked = false;
      }
      updateCategoryPillsHighlight();
      state.activeFilters.page = 1;
      fetchProducts();
      document.getElementById('products-grid').scrollIntoView({ behavior: 'smooth' });
    });
  });
}

// --- Hero Banner Carousel ---
function initCarousel() {
  const track = document.getElementById('carousel-track');
  const slides = document.querySelectorAll('.carousel-slide');
  const dots = document.querySelectorAll('.carousel-dot');
  const prevBtn = document.getElementById('carousel-prev');
  const nextBtn = document.getElementById('carousel-next');

  if (!track || slides.length === 0) return;

  function goToSlide(index) {
    state.carouselIndex = (index + slides.length) % slides.length;
    track.style.transform = `translateX(-${state.carouselIndex * 100}%)`;
    dots.forEach((dot, idx) => {
      dot.classList.toggle('active', idx === state.carouselIndex);
    });
  }

  nextBtn.addEventListener('click', () => {
    resetCarouselTimer();
    goToSlide(state.carouselIndex + 1);
  });

  prevBtn.addEventListener('click', () => {
    resetCarouselTimer();
    goToSlide(state.carouselIndex - 1);
  });

  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      resetCarouselTimer();
      goToSlide(parseInt(dot.dataset.index));
    });
  });

  function startCarouselTimer() {
    state.carouselTimer = setInterval(() => {
      goToSlide(state.carouselIndex + 1);
    }, 5000);
  }

  function resetCarouselTimer() {
    clearInterval(state.carouselTimer);
    startCarouselTimer();
  }

  startCarouselTimer();
}

// --- Flash Deals Countdown Timer ---
function initCountdownTimer() {
  let totalSeconds = 5 * 3600 + 34 * 60 + 48; // 5h 34m 48s

  setInterval(() => {
    totalSeconds--;
    if (totalSeconds < 0) totalSeconds = 24 * 3600;

    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;

    const elH = document.getElementById('timer-hours');
    const elM = document.getElementById('timer-mins');
    const elS = document.getElementById('timer-secs');

    if (elH) elH.textContent = String(h).padStart(2, '0');
    if (elM) elM.textContent = String(m).padStart(2, '0');
    if (elS) elS.textContent = String(s).padStart(2, '0');
  }, 1000);
}

// --- Product Details Modal ---
async function openProductModal(id) {
  const modal = document.getElementById('product-modal');
  const content = document.getElementById('product-detail-content');
  if (!modal || !content) return;

  modal.classList.add('open');
  document.body.style.overflow = 'hidden';

  content.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 60px;">
    <div style="font-size: 2rem;">⚡ Loading product specifications...</div>
  </div>`;

  try {
    const p = await apiCall(`/api/products/${id}`);
    const isWishlisted = state.wishlist.includes(p.id);
    const savings = p.mrp - p.price;

    content.innerHTML = `
      <!-- Left: Image Gallery -->
      <div class="detail-gallery">
        <img src="${p.image}" class="main-preview-img" id="detail-main-img" alt="${p.title}" onerror="this.src='/images/logo.svg'">
        <div style="display: flex; gap: 8px; justify-content: center;">
          <img src="${p.image}" style="width: 50px; height: 50px; object-fit: contain; border: 2px solid var(--primary); border-radius: 6px; padding: 2px; cursor: pointer;">
          <img src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&auto=format&fit=crop&q=80" style="width: 50px; height: 50px; object-fit: contain; border: 1px solid #E2E8F0; border-radius: 6px; padding: 2px; cursor: pointer;" onclick="document.getElementById('detail-main-img').src=this.src">
          <img src="https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=300&auto=format&fit=crop&q=80" style="width: 50px; height: 50px; object-fit: contain; border: 1px solid #E2E8F0; border-radius: 6px; padding: 2px; cursor: pointer;" onclick="document.getElementById('detail-main-img').src=this.src">
        </div>
      </div>

      <!-- Right: Product Information & Buy Actions -->
      <div class="detail-content">
        <span class="product-brand" style="font-size: 0.85rem;">${p.brand} Official Store</span>
        <h2 style="font-size: 1.35rem; font-weight: 800; line-height: 1.3; margin: 4px 0 10px;">${p.title}</h2>

        <div class="product-rating-row" style="margin-bottom: 14px;">
          <span class="rating-pill" style="font-size: 0.82rem; padding: 3px 8px;">★ ${p.rating}</span>
          <span class="reviews-count" style="font-size: 0.85rem;">${p.reviewCount.toLocaleString('en-IN')} Ratings & Verified Reviews</span>
          <span style="color: var(--success); font-weight: 700; font-size: 0.82rem; margin-left: 8px;">✓ In Stock (${p.stock} units left)</span>
        </div>

        <div class="product-price-row" style="margin-bottom: 12px;">
          <span class="price-current" style="font-size: 1.8rem; color: var(--primary);">₹${p.price.toLocaleString('en-IN')}</span>
          <span class="price-mrp" style="font-size: 1rem;">₹${p.mrp.toLocaleString('en-IN')}</span>
          <span class="badge-discount" style="font-size: 0.82rem; padding: 4px 8px;">${p.discountPercent}% OFF</span>
        </div>
        <div style="font-size: 0.82rem; color: var(--success); font-weight: 700; margin-bottom: 16px;">
          🎉 You save ₹${savings.toLocaleString('en-IN')} (Inclusive of all taxes)
        </div>

        <!-- Available Offers -->
        <div class="offers-list">
          <strong style="color: #92400E; display: block; margin-bottom: 6px;">Available Bank & UPI Offers:</strong>
          <ul>
            ${p.offers ? p.offers.map(o => `<li>${o}</li>`).join('') : '<li>Flat 10% Instant Discount on UPI & Bank Cards</li>'}
          </ul>
        </div>

        <!-- Quantity & CTA Buttons -->
        <div style="display: flex; gap: 14px; align-items: center; margin-bottom: 20px;">
          <div style="display: flex; align-items: center; gap: 8px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 4px 8px;">
            <span style="font-size: 0.82rem; font-weight: 600;">Qty:</span>
            <select id="detail-qty" style="border: none; outline: none; font-weight: 700; cursor: pointer;">
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
            </select>
          </div>

          <button class="slide-btn" style="flex: 1; background: var(--primary);" onclick="addToCartFromDetail(${p.id})">
            🛒 Add to Cart
          </button>
          <button class="slide-btn" style="flex: 1; background: var(--accent); color: #000;" onclick="buyNowFromDetail(${p.id})">
            ⚡ Buy Now
          </button>
        </div>

        <!-- Trust Badges -->
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; text-align: center; background: #F8FAFC; padding: 10px; border-radius: var(--radius-md); font-size: 0.78rem; font-weight: 700; color: var(--text-muted); margin-bottom: 20px;">
          <div>🛡️ 100% Genuine</div>
          <div>🔄 7 Days Replacement</div>
          <div>🚚 Free COD Delivery</div>
        </div>

        <!-- Specifications -->
        <h4 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 8px;">Product Specifications</h4>
        <table class="detail-specs-table">
          ${Object.entries(p.specs || {}).map(([k, v]) => `
            <tr>
              <td class="spec-key">${k}</td>
              <td>${v}</td>
            </tr>
          `).join('')}
        </table>

        <!-- Description -->
        <h4 style="font-size: 0.95rem; font-weight: 700; margin-top: 16px; margin-bottom: 6px;">Overview</h4>
        <p style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.5;">${p.description}</p>
      </div>
    `;
  } catch (err) {
    content.innerHTML = `<div style="padding: 40px; text-align: center;">Error loading product details: ${err.message}</div>`;
  }
}

function closeProductModal() {
  const modal = document.getElementById('product-modal');
  if (modal) modal.classList.remove('open');
  document.body.style.overflow = 'auto';
}

function addToCartFromDetail(productId) {
  const qty = parseInt(document.getElementById('detail-qty').value) || 1;
  addToCart(productId, qty, true);
  closeProductModal();
}

function buyNowFromDetail(productId) {
  const qty = parseInt(document.getElementById('detail-qty').value) || 1;
  addToCart(productId, qty, false);
  closeProductModal();
  proceedToCheckout();
}

function quickBuyNow(productId) {
  addToCart(productId, 1, false);
  proceedToCheckout();
}

// --- Cart System ---
async function addToCart(productId, qty = 1, openDrawer = false) {
  try {
    let p = null;
    const existingIndex = state.cart.findIndex(item => item.id === productId);

    if (existingIndex > -1) {
      state.cart[existingIndex].qty += qty;
      p = state.cart[existingIndex].product;
    } else {
      p = await apiCall(`/api/products/${productId}`);
      state.cart.push({
        id: productId,
        product: p,
        qty: qty
      });
    }

    localStorage.setItem('zk_cart', JSON.stringify(state.cart));
    updateCartBadge();
    showToast(`Added "${p.title.substring(0, 24)}..." to cart!`);

    if (openDrawer) {
      renderCart();
      toggleCartDrawer(true);
    }
  } catch (err) {
    showToast('Failed to add product to cart');
  }
}

function updateCartBadge() {
  const totalItems = state.cart.reduce((sum, item) => sum + item.qty, 0);
  const badge = document.getElementById('cart-count');
  const drawerCount = document.getElementById('cart-drawer-count');
  if (badge) badge.textContent = totalItems;
  if (drawerCount) drawerCount.textContent = totalItems;
}

function toggleCartDrawer(forceOpen = null) {
  const backdrop = document.getElementById('cart-backdrop');
  const drawer = document.getElementById('cart-drawer');

  const shouldOpen = forceOpen !== null ? forceOpen : !drawer.classList.contains('open');

  if (shouldOpen) {
    renderCart();
    backdrop.classList.add('open');
    drawer.classList.add('open');
    document.body.style.overflow = 'hidden';
  } else {
    backdrop.classList.remove('open');
    drawer.classList.remove('open');
    document.body.style.overflow = 'auto';
  }
}

function renderCart() {
  const container = document.getElementById('cart-items-container');
  const footer = document.getElementById('cart-drawer-footer');
  if (!container) return;

  if (state.cart.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 60px 20px;">
        <div style="font-size: 3rem; margin-bottom: 10px;">🛒</div>
        <h4 style="font-weight: 700; margin-bottom: 6px;">Your Shopping Cart is Empty</h4>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 16px;">Explore our 1,000+ top-rated products with festive offers!</p>
        <button class="slide-btn" onclick="toggleCartDrawer(false)">Start Shopping</button>
      </div>
    `;
    if (footer) footer.style.display = 'none';
    return;
  }

  if (footer) footer.style.display = 'block';

  let totalMRP = 0;
  let totalSellPrice = 0;

  container.innerHTML = state.cart.map(item => {
    const p = item.product;
    const itemMRP = p.mrp * item.qty;
    const itemTotal = p.price * item.qty;
    totalMRP += itemMRP;
    totalSellPrice += itemTotal;

    return `
      <div class="cart-item-row">
        <img src="${p.image}" class="cart-item-img" alt="${p.title}" onerror="this.src='/images/logo.svg'">
        <div class="cart-item-details">
          <h5 class="cart-item-title">${p.title}</h5>
          <div class="cart-item-price-row">
            <strong style="font-size: 0.95rem;">₹${itemTotal.toLocaleString('en-IN')}</strong>
            <span style="font-size: 0.78rem; text-decoration: line-through; color: var(--text-light);">₹${itemMRP.toLocaleString('en-IN')}</span>
          </div>
          <div class="cart-qty-controls">
            <button class="qty-btn" onclick="updateCartQty(${item.id}, -1)">-</button>
            <span class="qty-val">${item.qty}</span>
            <button class="qty-btn" onclick="updateCartQty(${item.id}, 1)">+</button>
            <button class="cart-remove-item" onclick="removeCartItem(${item.id})">Remove</button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Calculate discounts and grand total
  const productDiscount = totalMRP - totalSellPrice;
  let couponDiscount = 0;
  if (state.coupon) {
    if (state.coupon.percent) {
      couponDiscount = Math.round(totalSellPrice * (state.coupon.percent / 100));
    } else if (state.coupon.flat) {
      couponDiscount = state.coupon.flat;
    }
  }

  const grandTotal = Math.max(0, totalSellPrice - couponDiscount);
  const totalSavings = productDiscount + couponDiscount;

  document.getElementById('summary-mrp').textContent = `₹${totalMRP.toLocaleString('en-IN')}`;
  document.getElementById('summary-discount').textContent = `- ₹${productDiscount.toLocaleString('en-IN')}`;
  
  const couponRow = document.getElementById('row-coupon');
  if (couponDiscount > 0) {
    couponRow.style.display = 'table-row';
    document.getElementById('summary-coupon').textContent = `- ₹${couponDiscount.toLocaleString('en-IN')}`;
  } else {
    couponRow.style.display = 'none';
  }

  document.getElementById('summary-grand-total').textContent = `₹${grandTotal.toLocaleString('en-IN')}`;
  document.getElementById('total-savings-text').textContent = `₹${totalSavings.toLocaleString('en-IN')}`;

  state.calculatedTotals = {
    totalMRP,
    productDiscount,
    couponDiscount,
    grandTotal,
    totalSavings
  };
}

function updateCartQty(id, delta) {
  const item = state.cart.find(i => i.id === id);
  if (!item) return;

  item.qty += delta;
  if (item.qty <= 0) {
    removeCartItem(id);
    return;
  }

  localStorage.setItem('zk_cart', JSON.stringify(state.cart));
  updateCartBadge();
  renderCart();
}

function removeCartItem(id) {
  state.cart = state.cart.filter(i => i.id !== id);
  localStorage.setItem('zk_cart', JSON.stringify(state.cart));
  updateCartBadge();
  renderCart();
  showToast('Item removed from cart');
}

function applyCoupon() {
  const input = document.getElementById('coupon-input');
  const msg = document.getElementById('coupon-msg');
  const code = input.value.trim().toUpperCase();

  if (code === 'FESTIVE10') {
    state.coupon = { code: 'FESTIVE10', percent: 10 };
    msg.style.color = 'var(--success-dark)';
    msg.textContent = '✓ Coupon FESTIVE10 applied: 10% Extra Discount!';
    showToast('Coupon FESTIVE10 applied!');
  } else if (code === 'UPI200') {
    state.coupon = { code: 'UPI200', flat: 200 };
    msg.style.color = 'var(--success-dark)';
    msg.textContent = '✓ Coupon UPI200 applied: Flat ₹200 OFF!';
    showToast('Coupon UPI200 applied!');
  } else if (code === 'SUPER50') {
    state.coupon = { code: 'SUPER50', percent: 15 };
    msg.style.color = 'var(--success-dark)';
    msg.textContent = '✓ Coupon SUPER50 applied: 15% Mega Discount!';
    showToast('Coupon SUPER50 applied!');
  } else {
    state.coupon = null;
    msg.style.color = 'var(--danger)';
    msg.textContent = 'Invalid coupon code. Try FESTIVE10 or UPI200.';
  }

  localStorage.setItem('zk_coupon', JSON.stringify(state.coupon));
  renderCart();
}

// --- Wishlist System ---
function toggleWishlist(productId) {
  const index = state.wishlist.indexOf(productId);
  if (index > -1) {
    state.wishlist.splice(index, 1);
    showToast('Removed from wishlist');
  } else {
    state.wishlist.push(productId);
    showToast('Saved to your wishlist! ❤️');
  }
  localStorage.setItem('zk_wishlist', JSON.stringify(state.wishlist));
  updateWishlistBadge();
  fetchProducts();
}

function updateWishlistBadge() {
  const badge = document.getElementById('wishlist-count');
  if (badge) badge.textContent = state.wishlist.length;
}

function openWishlistModal() {
  if (state.wishlist.length === 0) {
    showToast('Your wishlist is empty.');
    return;
  }
  state.activeFilters.search = '';
  // Show wishlisted items by setting filter
  showToast(`Viewing ${state.wishlist.length} saved wishlist items`);
}

// --- Checkout & Payment Processing ---
function proceedToCheckout() {
  if (state.cart.length === 0) {
    showToast('Your cart is empty');
    return;
  }
  toggleCartDrawer(false);

  const modal = document.getElementById('checkout-modal');
  if (!modal) return;

  renderCart();
  const grandTotal = state.calculatedTotals ? state.calculatedTotals.grandTotal : 0;
  document.getElementById('checkout-payable-total').textContent = `₹${grandTotal.toLocaleString('en-IN')}`;

  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCheckoutModal() {
  const modal = document.getElementById('checkout-modal');
  if (modal) modal.classList.remove('open');
  document.body.style.overflow = 'auto';
}

function switchPaymentTab(method) {
  state.selectedPayment = method;
  document.querySelectorAll('.payment-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.method === method);
  });
  document.querySelectorAll('.payment-tab-panel').forEach(panel => {
    panel.classList.toggle('active', panel.id === `panel-${method}`);
  });
}

function selectUPIApp(el, appName) {
  state.selectedUPIApp = appName;
  document.querySelectorAll('.upi-app-badge').forEach(b => b.classList.remove('selected'));
  el.classList.add('selected');
}

async function executePlaceOrder() {
  const btn = document.getElementById('btn-place-order');
  btn.disabled = true;
  btn.textContent = 'Processing Payment & Creating Order...';

  const name = document.getElementById('ship-name').value.trim();
  const phone = document.getElementById('ship-phone').value.trim();
  const address = document.getElementById('ship-address').value.trim();
  const city = document.getElementById('ship-city').value.trim();
  const pincode = document.getElementById('ship-pincode').value.trim();

  if (!name || !address || !phone) {
    showToast('Please fill all mandatory shipping fields.');
    btn.disabled = false;
    btn.textContent = 'Confirm & Place Order ➔';
    return;
  }

  const shippingAddress = { name, phone, address, city, pincode };
  const paymentDetails = {
    method: state.selectedPayment,
    app: state.selectedPayment === 'UPI' ? state.selectedUPIApp : null,
    upiVpa: state.selectedPayment === 'UPI' ? document.getElementById('upi-vpa-input').value : null
  };

  try {
    const res = await apiCall('/api/orders', 'POST', {
      items: state.cart.map(i => ({
        id: i.id,
        title: i.product.title,
        price: i.product.price,
        qty: i.qty,
        image: i.product.image
      })),
      shippingAddress,
      paymentMethod: state.selectedPayment,
      paymentDetails,
      totals: state.calculatedTotals
    });

    // Clear Cart
    state.cart = [];
    localStorage.setItem('zk_cart', JSON.stringify(state.cart));
    updateCartBadge();

    closeCheckoutModal();
    openOrderSuccessModal(res.order);
  } catch (err) {
    showToast(err.message || 'Failed to process order.');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Confirm & Place Order ➔';
  }
}

function openOrderSuccessModal(order) {
  const modal = document.getElementById('order-success-modal');
  if (!modal) return;

  document.getElementById('success-order-id').textContent = order.id;
  document.getElementById('success-delivery-date').textContent = order.estimatedDelivery;
  document.getElementById('success-payment-method').textContent = `${order.paymentMethod} (${order.status})`;

  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeOrderSuccessModal() {
  const modal = document.getElementById('order-success-modal');
  if (modal) modal.classList.remove('open');
  document.body.style.overflow = 'auto';
}

// --- Orders History Modal ---
async function openOrdersModal() {
  const modal = document.getElementById('orders-modal');
  const listContainer = document.getElementById('user-orders-list');
  if (!modal || !listContainer) return;

  modal.classList.add('open');
  document.body.style.overflow = 'hidden';

  listContainer.innerHTML = '<div style="text-align: center; padding: 40px;">Fetching your orders...</div>';

  try {
    const data = await apiCall('/api/orders');
    if (!data.orders || data.orders.length === 0) {
      listContainer.innerHTML = `
        <div style="text-align: center; padding: 40px;">
          <div style="font-size: 2.5rem; margin-bottom: 10px;">📦</div>
          <h4>No orders found yet</h4>
          <p style="color: var(--text-muted); font-size: 0.88rem;">Place your first order today and track delivery right here!</p>
        </div>
      `;
      return;
    }

    listContainer.innerHTML = data.orders.map(o => `
      <div style="border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 16px; margin-bottom: 14px; background: #F8FAFC;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #E2E8F0; padding-bottom: 8px; margin-bottom: 10px;">
          <div>
            <strong style="color: var(--primary); font-family: monospace;">${o.id}</strong>
            <span style="font-size: 0.78rem; color: var(--text-muted); margin-left: 10px;">${new Date(o.createdAt).toLocaleDateString()}</span>
          </div>
          <span class="badge-special">${o.status}</span>
        </div>
        <div style="display: flex; gap: 12px; margin-bottom: 10px; overflow-x: auto;">
          ${o.items.map(item => `
            <img src="${item.image}" style="width: 44px; height: 44px; object-fit: contain; background: #FFF; border-radius: 4px; border: 1px solid #E2E8F0;" title="${item.title} (Qty: ${item.qty})">
          `).join('')}
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 0.85rem;">
          <span>Deliver to: <strong>${o.shippingAddress.name}, ${o.shippingAddress.city} (${o.shippingAddress.pincode})</strong></span>
          <strong style="color: var(--text-main);">₹${(o.totals ? o.totals.grandTotal : 0).toLocaleString('en-IN')}</strong>
        </div>
      </div>
    `).join('');
  } catch (err) {
    listContainer.innerHTML = `<div style="text-align: center; color: var(--danger); padding: 20px;">Failed to load orders: ${err.message}</div>`;
  }
}

function closeOrdersModal() {
  const modal = document.getElementById('orders-modal');
  if (modal) modal.classList.remove('open');
  document.body.style.overflow = 'auto';
}

// --- Auth & User State ---
function checkUserSession() {
  const navName = document.getElementById('user-nav-name');
  if (state.currentUser && navName) {
    navName.textContent = state.currentUser.name.split(' ')[0];
  }
}

function handleUserNavClick() {
  if (state.currentUser) {
    openOrdersModal();
  } else {
    openAuthModal();
  }
}

function openAuthModal() {
  const modal = document.getElementById('auth-modal');
  if (modal) {
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
}

function closeAuthModal() {
  const modal = document.getElementById('auth-modal');
  if (modal) {
    modal.classList.remove('open');
    document.body.style.overflow = 'auto';
  }
}

function switchAuthTab(tab) {
  document.getElementById('tab-login').classList.toggle('active', tab === 'login');
  document.getElementById('tab-register').classList.toggle('active', tab === 'register');
  document.getElementById('form-login').style.display = tab === 'login' ? 'block' : 'none';
  document.getElementById('form-register').style.display = tab === 'register' ? 'block' : 'none';
}

async function handleLoginSubmit(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  try {
    const res = await apiCall('/api/auth/login', 'POST', { email, password });
    state.currentUser = res.user;
    localStorage.setItem('zk_user', JSON.stringify(res.user));
    checkUserSession();
    closeAuthModal();
    showToast(`Welcome back, ${res.user.name}!`);
  } catch (err) {
    showToast(err.message || 'Login failed');
  }
}

async function quickDemoLogin() {
  try {
    const res = await apiCall('/api/auth/login', 'POST', {
      email: 'demo@zenithkart.com',
      password: 'password123'
    });
    state.currentUser = res.user;
    localStorage.setItem('zk_user', JSON.stringify(res.user));
    checkUserSession();
    closeAuthModal();
    showToast(`Logged in as ${res.user.name}`);
  } catch (err) {
    showToast('Demo login error: ' + err.message);
  }
}

async function handleRegisterSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const phone = document.getElementById('reg-phone').value.trim();
  const password = document.getElementById('reg-password').value;

  try {
    const res = await apiCall('/api/auth/register', 'POST', { name, email, phone, password });
    state.currentUser = res.user;
    localStorage.setItem('zk_user', JSON.stringify(res.user));
    checkUserSession();
    closeAuthModal();
    showToast(`Account created! Welcome, ${res.user.name}!`);
  } catch (err) {
    showToast(err.message || 'Registration failed');
  }
}

// --- AI Shopping Assistant ---
function toggleAIChat() {
  const win = document.getElementById('ai-chat-window');
  if (!win) return;
  win.classList.toggle('open');
  if (win.classList.contains('open')) {
    document.getElementById('ai-user-input').focus();
  }
}

function openAIChat(prompt = null) {
  const win = document.getElementById('ai-chat-window');
  if (win) {
    win.classList.add('open');
    if (prompt) {
      document.getElementById('ai-user-input').value = prompt;
      executeAIChat();
    }
  }
}

function sendQuickPrompt(text) {
  document.getElementById('ai-user-input').value = text;
  executeAIChat();
}

async function executeAIChat() {
  const input = document.getElementById('ai-user-input');
  const container = document.getElementById('ai-chat-messages');
  const prompt = input.value.trim();
  if (!prompt) return;

  // Append user message
  const userMsg = document.createElement('div');
  userMsg.className = 'ai-msg user';
  userMsg.textContent = prompt;
  container.appendChild(userMsg);
  input.value = '';
  container.scrollTop = container.scrollHeight;

  // Append typing bot msg
  const botMsg = document.createElement('div');
  botMsg.className = 'ai-msg bot';
  botMsg.innerHTML = `<span>Thinking... 🤖</span>`;
  container.appendChild(botMsg);
  container.scrollTop = container.scrollHeight;

  try {
    const res = await apiCall('/api/ai/chat', 'POST', { prompt });
    let html = `<div>${res.reply.replace(/\n/g, '<br>')}</div>`;

    if (res.products && res.products.length > 0) {
      html += `
        <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 10px;">
          ${res.products.map(p => `
            <div style="display: flex; gap: 8px; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; padding: 6px; align-items: center;">
              <img src="${p.image}" style="width: 40px; height: 40px; object-fit: contain; border-radius: 4px;" onerror="this.src='/images/logo.svg'">
              <div style="flex: 1; font-size: 0.78rem;">
                <div style="font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 180px;">${p.title}</div>
                <div style="color: var(--primary); font-weight: 700;">₹${p.price.toLocaleString('en-IN')} <span style="color: var(--success); font-size: 0.7rem;">(${p.discountPercent}% OFF)</span></div>
              </div>
              <button class="btn-card-cart" style="padding: 4px 8px; font-size: 0.72rem;" onclick="openProductModal(${p.id})">View</button>
            </div>
          `).join('')}
        </div>
      `;
    }

    botMsg.innerHTML = html;
    container.scrollTop = container.scrollHeight;
  } catch (err) {
    botMsg.innerHTML = `Sorry, I encountered an error searching our catalog: ${err.message}`;
  }
}

// --- Toast Notifications ---
function showToast(msg) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast-msg';
  toast.innerHTML = `<span>✨</span><span>${msg}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function openAddressEdit() {
  const newLoc = prompt('Enter your City and Pincode for delivery:', 'Bolpur 731204');
  if (newLoc && newLoc.trim()) {
    document.getElementById('header-location').textContent = newLoc.trim();
    showToast(`Delivery location updated to ${newLoc.trim()}!`);
  }
}
