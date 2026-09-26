/**
 * ZenithKart E-Commerce Application Frontend
 * Clean, Responsive, 100% Privacy-Preserving Architecture
 */

// Global Application State
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
  carouselIndex: 0,
  carouselTimer: null,
  pendingOrderData: null,
  gatewayTimerInterval: null
};

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initCarousel();
  initCarouselTouch();
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
  } catch (err) {
    console.error('Failed to load categories', err);
  }
}

// --- Fetch & Render Products ---
async function fetchProducts() {
  const grid = document.getElementById('products-grid');
  if (!grid) return;

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
        <p style="color: var(--text-muted); margin-top: 6px;">Try adjusting your search keywords, clearing filters, or browsing other categories.</p>
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
            <span class="rating-pill">★ ${p.rating}</span>
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

  let html = `<button class="page-btn" ${page === 1 ? 'disabled' : ''} onclick="changePage(${page - 1})">‹ Previous</button>`;

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

  html += `<button class="page-btn" ${page === totalPages ? 'disabled' : ''} onclick="changePage(${page + 1})">Next ›</button>`;
  container.innerHTML = html;
}

function changePage(newPage) {
  state.activeFilters.page = newPage;
  fetchProducts();
  window.scrollTo({ top: 380, behavior: 'smooth' });
}

function extractAndRenderBrands(products) {
  const brandSet = new Set(products.map(p => p.brand));
  const container = document.getElementById('brand-filter-list');
  if (!container || container.children.length > 5) return;

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
  state.activeFilters.category = cb.checked ? cb.value : 'all';
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
  document.getElementById('products-grid')?.scrollIntoView({ behavior: 'smooth' });
}

function updateCategoryPillsHighlight() {
  document.querySelectorAll('.cat-pill').forEach(pill => {
    pill.classList.toggle('active', pill.dataset.cat === state.activeFilters.category);
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

  // Update mobile filter badge
  const mobBadge = document.getElementById('mobile-filter-badge');
  if (mobBadge) {
    mobBadge.textContent = chips.length;
    mobBadge.style.display = chips.length > 0 ? 'inline-block' : 'none';
  }
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
  const searchInput = document.getElementById('search-input');
  if (searchInput) searchInput.value = '';
  const minP = document.getElementById('filter-min-price');
  if (minP) minP.value = '';
  const maxP = document.getElementById('filter-max-price');
  if (maxP) maxP.value = '';
  const dealsCb = document.getElementById('filter-deals-only');
  if (dealsCb) dealsCb.checked = false;
  document.querySelectorAll('input[type="checkbox"]').forEach(c => c.checked = false);
  document.querySelectorAll('input[type="radio"]').forEach(c => c.checked = false);
  updateCategoryPillsHighlight();
  fetchProducts();
}

// --- Search Bar & Live Autocomplete ---
function initSearchAutocomplete() {
  const input = document.getElementById('search-input');
  const catSelect = document.getElementById('search-category');
  const btn = document.getElementById('search-btn');
  const clearBtn = document.getElementById('search-clear');
  const dropdown = document.getElementById('search-suggestions');

  if (!input) return;
  let debounceTimer = null;

  input.addEventListener('input', () => {
    const val = input.value.trim();
    if (clearBtn) clearBtn.style.display = val ? 'block' : 'none';

    clearTimeout(debounceTimer);
    if (val.length < 2) {
      if (dropdown) dropdown.style.display = 'none';
      return;
    }

    debounceTimer = setTimeout(async () => {
      try {
        const cat = catSelect && catSelect.value !== 'all' ? `&category=${catSelect.value}` : '';
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
        if (dropdown) dropdown.style.display = 'none';
      }
    }, 200);
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') executeSearch();
  });

  if (btn) btn.addEventListener('click', executeSearch);

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      input.value = '';
      clearBtn.style.display = 'none';
      if (dropdown) dropdown.style.display = 'none';
      state.activeFilters.search = '';
      state.activeFilters.page = 1;
      fetchProducts();
    });
  }

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-wrapper') && dropdown) {
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
  const dropdown = document.getElementById('search-suggestions');
  if (dropdown) dropdown.style.display = 'none';
  openProductModal(productId);
}

function executeSearch() {
  const input = document.getElementById('search-input');
  const catSelect = document.getElementById('search-category');
  const dropdown = document.getElementById('search-suggestions');
  if (dropdown) dropdown.style.display = 'none';

  if (input) state.activeFilters.search = input.value.trim();
  if (catSelect && catSelect.value !== 'all') {
    state.activeFilters.category = catSelect.value;
  }
  state.activeFilters.page = 1;
  fetchProducts();

  document.getElementById('products-grid')?.scrollIntoView({ behavior: 'smooth' });
}

// --- Category Ribbon Handling ---
function initNavbar() {
  document.querySelectorAll('.cat-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      const cat = pill.dataset.cat;
      if (cat === 'deals') {
        state.activeFilters.dealsOnly = true;
        const dealsCb = document.getElementById('filter-deals-only');
        if (dealsCb) dealsCb.checked = true;
        state.activeFilters.category = 'all';
      } else {
        state.activeFilters.category = cat;
        state.activeFilters.dealsOnly = false;
        const dealsCb = document.getElementById('filter-deals-only');
        if (dealsCb) dealsCb.checked = false;
      }
      updateCategoryPillsHighlight();
      state.activeFilters.page = 1;
      fetchProducts();
      document.getElementById('products-grid')?.scrollIntoView({ behavior: 'smooth' });
    });
  });
}

// --- Hero Banner Carousel & Touch Support ---
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

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      resetCarouselTimer();
      goToSlide(state.carouselIndex + 1);
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      resetCarouselTimer();
      goToSlide(state.carouselIndex - 1);
    });
  }

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

function initCarouselTouch() {
  const container = document.getElementById('carousel-container');
  if (!container) return;

  let startX = 0;
  let endX = 0;

  container.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
  }, { passive: true });

  container.addEventListener('touchmove', (e) => {
    endX = e.touches[0].clientX;
  }, { passive: true });

  container.addEventListener('touchend', () => {
    const diff = startX - endX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        document.getElementById('carousel-next')?.click();
      } else {
        document.getElementById('carousel-prev')?.click();
      }
    }
    startX = 0;
    endX = 0;
  });
}

// --- Deals Countdown Timer ---
function initCountdownTimer() {
  let totalSeconds = 5 * 3600 + 34 * 60 + 48;

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
    const savings = p.mrp - p.price;

    content.innerHTML = `
      <div class="detail-gallery">
        <img src="${p.image}" class="main-preview-img" id="detail-main-img" alt="${p.title}" onerror="this.src='/images/logo.svg'">
      </div>

      <div class="detail-content">
        <span class="product-brand" style="font-size: 0.85rem;">${p.brand} Official</span>
        <h2 style="font-size: 1.35rem; font-weight: 800; line-height: 1.3; margin: 4px 0 10px;">${p.title}</h2>

        <div class="product-rating-row" style="margin-bottom: 14px;">
          <span class="rating-pill" style="font-size: 0.82rem; padding: 3px 8px;">★ ${p.rating}</span>
          <span class="reviews-count" style="font-size: 0.85rem;">${p.reviewCount.toLocaleString('en-IN')} Verified Ratings</span>
          <span style="color: var(--success); font-weight: 700; font-size: 0.82rem; margin-left: 8px;">✓ In Stock (${p.stock} units)</span>
        </div>

        <div class="product-price-row" style="margin-bottom: 12px;">
          <span class="price-current" style="font-size: 1.8rem; color: var(--primary);">₹${p.price.toLocaleString('en-IN')}</span>
          <span class="price-mrp" style="font-size: 1rem;">₹${p.mrp.toLocaleString('en-IN')}</span>
          <span class="badge-discount" style="font-size: 0.82rem; padding: 4px 8px;">${p.discountPercent}% OFF</span>
        </div>
        <div style="font-size: 0.82rem; color: var(--success); font-weight: 700; margin-bottom: 16px;">
          🎉 You save ₹${savings.toLocaleString('en-IN')} (Inclusive of all taxes)
        </div>

        <div class="offers-list">
          <strong style="color: #92400E; display: block; margin-bottom: 6px;">Available Bank & Payment Offers:</strong>
          <ul>
            ${p.offers ? p.offers.map(o => `<li>${o}</li>`).join('') : '<li>Flat 10% Instant Discount on Bank Cards</li>'}
          </ul>
        </div>

        <div style="display: flex; gap: 14px; align-items: center; margin-bottom: 20px;">
          <div style="display: flex; align-items: center; gap: 8px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 4px 8px;">
            <span style="font-size: 0.82rem; font-weight: 600;">Qty:</span>
            <select id="detail-qty" style="border: none; outline: none; font-weight: 700; cursor: pointer;">
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
            </select>
          </div>

          <button class="slide-btn" style="flex: 1; background: var(--primary);" onclick="addToCartFromDetail(${p.id})">
            🛒 Add to Cart
          </button>
          <button class="slide-btn" style="flex: 1; background: var(--accent); color: #000;" onclick="buyNowFromDetail(${p.id})">
            ⚡ Buy Now
          </button>
        </div>

        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; text-align: center; background: #F8FAFC; padding: 10px; border-radius: var(--radius-md); font-size: 0.78rem; font-weight: 700; color: var(--text-muted); margin-bottom: 20px;">
          <div>🛡️ 100% Genuine</div>
          <div>🔄 7 Days Replacement</div>
          <div>🚚 Free COD Delivery</div>
        </div>

        <h4 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 8px;">Product Specifications</h4>
        <table class="detail-specs-table">
          ${Object.entries(p.specs || {}).map(([k, v]) => `
            <tr>
              <td class="spec-key">${k}</td>
              <td>${v}</td>
            </tr>
          `).join('')}
        </table>

        <h4 style="font-size: 0.95rem; font-weight: 700; margin-top: 16px; margin-bottom: 6px;">Overview</h4>
        <p style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.5;">${p.description}</p>
      </div>

      <!-- Mobile Sticky Bottom CTA -->
      <div class="detail-mobile-bottom-bar">
        <button class="slide-btn" style="background: var(--primary);" onclick="addToCartFromDetail(${p.id})">
          🛒 Add to Cart
        </button>
        <button class="slide-btn" style="background: var(--accent); color: #000;" onclick="buyNowFromDetail(${p.id})">
          ⚡ Buy Now
        </button>
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
  const qty = parseInt(document.getElementById('detail-qty')?.value) || 1;
  addToCart(productId, qty, true);
  closeProductModal();
}

function buyNowFromDetail(productId) {
  const qty = parseInt(document.getElementById('detail-qty')?.value) || 1;
  addToCart(productId, qty, false);
  closeProductModal();
  initiateOrderCheckout();
}

function quickBuyNow(productId) {
  addToCart(productId, 1, false);
  initiateOrderCheckout();
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
  const mobBadge = document.getElementById('mob-cart-badge');
  if (badge) badge.textContent = totalItems;
  if (drawerCount) drawerCount.textContent = totalItems;
  if (mobBadge) mobBadge.textContent = totalItems;
}

function toggleCartDrawer(forceOpen = null) {
  const backdrop = document.getElementById('cart-backdrop');
  const drawer = document.getElementById('cart-drawer');

  const shouldOpen = forceOpen !== null ? forceOpen : !drawer.classList.contains('open');

  if (shouldOpen) {
    renderCart();
    backdrop?.classList.add('open');
    drawer?.classList.add('open');
    document.body.style.overflow = 'hidden';
  } else {
    backdrop?.classList.remove('open');
    drawer?.classList.remove('open');
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
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 16px;">Explore our 1,000+ authentic real products!</p>
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
  showToast(`Viewing ${state.wishlist.length} saved wishlist items`);
}

// --- Authentication Gate & Checkout Initiation ---
function proceedToCheckout() {
  if (state.cart.length === 0) {
    showToast('Your cart is empty');
    return;
  }
  toggleCartDrawer(false);

  // If user is not logged in, prompt authentication gate
  if (!state.currentUser) {
    openAuthGateModal();
  } else {
    openCheckoutModal();
  }
}

function initiateOrderCheckout() {
  if (!state.currentUser) {
    openAuthGateModal();
  } else {
    openCheckoutModal();
  }
}

function openAuthGateModal() {
  const modal = document.getElementById('auth-gate-modal');
  if (modal) {
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
}

function closeAuthGateModal() {
  const modal = document.getElementById('auth-gate-modal');
  if (modal) modal.classList.remove('open');
  document.body.style.overflow = 'auto';
}

function continueAsGuestCheckout() {
  closeAuthGateModal();
  openCheckoutModal();
}

// --- Checkout Modal ---
function openCheckoutModal() {
  const modal = document.getElementById('checkout-modal');
  if (!modal) return;

  renderCart();
  const grandTotal = state.calculatedTotals ? state.calculatedTotals.grandTotal : 0;
  document.getElementById('checkout-payable-total').textContent = `₹${grandTotal.toLocaleString('en-IN')}`;

  // Fill user details cleanly if logged in
  const userStatus = document.getElementById('checkout-user-status');
  if (state.currentUser) {
    userStatus.innerHTML = `Signed in as <strong>${state.currentUser.name}</strong> (${state.currentUser.email})`;
    if (document.getElementById('ship-name').value === '') {
      document.getElementById('ship-name').value = state.currentUser.name || '';
    }
    if (document.getElementById('ship-email').value === '') {
      document.getElementById('ship-email').value = state.currentUser.email || '';
    }
    if (document.getElementById('ship-phone').value === '') {
      document.getElementById('ship-phone').value = state.currentUser.phone || '';
    }

    // Auto-fill saved address if available
    if (state.currentUser.savedAddress) {
      const sa = state.currentUser.savedAddress;
      if (sa.address) document.getElementById('ship-address').value = sa.address;
      if (sa.city) document.getElementById('ship-city').value = sa.city;
      if (sa.pincode) document.getElementById('ship-pincode').value = sa.pincode;
    }
  } else {
    userStatus.textContent = 'Checking out as Guest';
  }

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

// --- Step 2: Realistic Payment Gateway Simulation Flow ---
function startPaymentGatewayFlow() {
  const name = document.getElementById('ship-name').value.trim();
  const email = document.getElementById('ship-email').value.trim();
  const phone = document.getElementById('ship-phone').value.trim();
  const address = document.getElementById('ship-address').value.trim();
  const city = document.getElementById('ship-city').value.trim();
  const pincode = document.getElementById('ship-pincode').value.trim();

  // Strict Validation
  if (!name || !email || !phone || !address || !city || !pincode) {
    showToast('Please fill in all mandatory delivery address fields.');
    return;
  }

  // Validate Email
  if (!email.includes('@') || !email.includes('.')) {
    showToast('Please enter a valid email address.');
    document.getElementById('ship-email').focus();
    return;
  }

  // Validate Mobile
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  if (cleanPhone.length < 10) {
    showToast('Please enter a valid 10-digit mobile number.');
    document.getElementById('ship-phone').focus();
    return;
  }

  const shippingAddress = { name, email, phone, address, city, pincode };
  const grandTotal = state.calculatedTotals ? state.calculatedTotals.grandTotal : 0;

  state.pendingOrderData = {
    shippingAddress,
    grandTotal,
    paymentMethod: state.selectedPayment,
    customerEmail: email
  };

  closeCheckoutModal();
  openGatewayModal();
}

function openGatewayModal() {
  const modal = document.getElementById('gateway-modal');
  if (!modal) return;

  const upiView = document.getElementById('gateway-upi-view');
  const cardView = document.getElementById('gateway-card-view');
  const codView = document.getElementById('gateway-cod-view');

  upiView.style.display = 'none';
  cardView.style.display = 'none';
  codView.style.display = 'none';

  const amountStr = `₹${(state.pendingOrderData.grandTotal).toLocaleString('en-IN')}`;

  if (state.selectedPayment === 'UPI') {
    upiView.style.display = 'block';
    const upiTarget = document.getElementById('upi-vpa-input').value.trim() || state.selectedUPIApp;
    document.getElementById('gateway-upi-target').textContent = upiTarget;
    document.getElementById('gateway-upi-amount').textContent = amountStr;
    startGatewayTimer();
  } else if (state.selectedPayment === 'CARD') {
    cardView.style.display = 'block';
  } else if (state.selectedPayment === 'COD') {
    codView.style.display = 'block';
    document.getElementById('gateway-cod-amount').textContent = amountStr;
  }

  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeGatewayModal() {
  const modal = document.getElementById('gateway-modal');
  if (modal) modal.classList.remove('open');
  clearInterval(state.gatewayTimerInterval);
  document.body.style.overflow = 'auto';
}

function startGatewayTimer() {
  let seconds = 299; // 04:59
  const timerEl = document.getElementById('gateway-timer');
  clearInterval(state.gatewayTimerInterval);

  state.gatewayTimerInterval = setInterval(() => {
    seconds--;
    if (seconds <= 0) {
      clearInterval(state.gatewayTimerInterval);
      showToast('UPI Session Timed Out. Please retry.');
      closeGatewayModal();
      return;
    }
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (timerEl) timerEl.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }, 1000);
}

// Simulate Interactive UPI Payment Approval
async function simulateUPIApproval() {
  const btn = document.getElementById('btn-approve-upi');
  const statusEl = document.getElementById('gateway-upi-status');
  btn.disabled = true;

  statusEl.innerHTML = `<span class="payment-processing-pulse"></span> Verifying UPI mandate with NPCI & Bank...`;

  setTimeout(async () => {
    statusEl.innerHTML = `<strong style="color: var(--success);">✓ UPI Payment Verified! Transaction Ref: UPI-${Date.now().toString().slice(-6)}</strong>`;
    
    setTimeout(async () => {
      await finalizeOrderPlacement('UPI', {
        app: state.selectedUPIApp,
        transactionRef: 'UPI-' + Date.now().toString().slice(-6),
        status: 'PAID_SUCCESS'
      });
      closeGatewayModal();
    }, 1000);
  }, 1800);
}

// Simulate Interactive 3D-Secure Bank Card Authorization
async function simulateCardAuthorization() {
  const btn = document.getElementById('btn-submit-otp');
  const statusEl = document.getElementById('gateway-card-status');
  btn.disabled = true;

  statusEl.innerHTML = `<span class="payment-processing-pulse"></span> Connecting to Issuer Bank 3D-Secure Gateway...`;

  setTimeout(async () => {
    statusEl.innerHTML = `<strong style="color: var(--success);">✓ Bank Authorization Approved!</strong>`;

    setTimeout(async () => {
      await finalizeOrderPlacement('CARD', {
        authCode: 'AUTH-' + Math.floor(100000 + Math.random() * 900000),
        status: 'PAID_SUCCESS'
      });
      closeGatewayModal();
    }, 1000);
  }, 1800);
}

// Confirm Cash on Delivery Order
async function confirmCODOrder() {
  const btn = document.getElementById('btn-confirm-cod');
  btn.disabled = true;
  btn.textContent = 'Registering COD Order...';

  await finalizeOrderPlacement('COD', {
    status: 'PAYMENT_PENDING_DOORSTEP'
  });
  closeGatewayModal();
}

// Finalize Order Creation & Trigger Email Notification
async function finalizeOrderPlacement(paymentMethod, paymentDetails) {
  try {
    const res = await apiCall('/api/orders', 'POST', {
      items: state.cart.map(i => ({
        id: i.id,
        title: i.product.title,
        price: i.product.price,
        qty: i.qty,
        image: i.product.image
      })),
      shippingAddress: state.pendingOrderData.shippingAddress,
      customerEmail: state.pendingOrderData.customerEmail,
      paymentMethod,
      paymentDetails,
      totals: state.calculatedTotals
    });

    // Clear Cart
    state.cart = [];
    localStorage.setItem('zk_cart', JSON.stringify(state.cart));
    updateCartBadge();

    // Show celebration modal
    openOrderSuccessModal(res.order, res.emailNotice);
  } catch (err) {
    showToast(err.message || 'Failed to place order.');
  }
}

function openOrderSuccessModal(order, emailNotice) {
  const modal = document.getElementById('order-success-modal');
  if (!modal) return;

  document.getElementById('success-order-id').textContent = order.id;
  document.getElementById('success-delivery-date').textContent = order.estimatedDelivery;
  document.getElementById('success-payment-method').textContent = order.status;
  document.getElementById('success-email-notice').textContent = order.customerEmail || 'your email';

  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
  showToast('Order confirmed! Invoice generated.');
}

function closeOrderSuccessModal() {
  const modal = document.getElementById('order-success-modal');
  if (modal) modal.classList.remove('open');
  document.body.style.overflow = 'auto';
}

// --- Orders History & Mobile Orders View ---
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
          <span>Deliver to: <strong>${o.shippingAddress.name}, ${o.shippingAddress.city}</strong></span>
          <strong style="color: var(--text-main);">₹${(o.totals ? o.totals.grandTotal : 0).toLocaleString('en-IN')}</strong>
        </div>
        <div style="margin-top: 8px; font-size: 0.78rem; color: var(--text-muted);">
          📧 Updates sent to: <strong>${o.customerEmail || o.shippingAddress.email}</strong>
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

// --- Auth & User State Management ---
function checkUserSession() {
  const navName = document.getElementById('user-nav-name');
  const logoutBtn = document.getElementById('btn-logout');

  if (state.currentUser && navName) {
    navName.textContent = state.currentUser.name.split(' ')[0];
    if (logoutBtn) logoutBtn.style.display = 'inline-block';
  } else if (navName) {
    navName.textContent = 'Sign In';
    if (logoutBtn) logoutBtn.style.display = 'none';
  }
}

function handleUserNavClick() {
  if (state.currentUser) {
    openOrdersModal();
  } else {
    openAuthModal('login');
  }
}

function openAuthModal(defaultTab = 'login') {
  const modal = document.getElementById('auth-modal');
  if (modal) {
    switchAuthTab(defaultTab);
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
  document.getElementById('tab-login')?.classList.toggle('active', tab === 'login');
  document.getElementById('tab-register')?.classList.toggle('active', tab === 'register');
  const formLogin = document.getElementById('form-login');
  const formReg = document.getElementById('form-register');
  if (formLogin) formLogin.style.display = tab === 'login' ? 'block' : 'none';
  if (formReg) formReg.style.display = tab === 'register' ? 'block' : 'none';
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

function logoutUser() {
  state.currentUser = null;
  localStorage.removeItem('zk_user');
  checkUserSession();
  closeOrdersModal();
  showToast('You have been logged out.');
}

// --- Mobile Navigation Bar Handler ---
function handleMobileNav(tab) {
  document.querySelectorAll('.mobile-nav-item').forEach(btn => btn.classList.remove('active'));

  if (tab === 'home') {
    document.getElementById('mob-nav-home')?.classList.add('active');
    resetAllFilters();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else if (tab === 'categories') {
    document.getElementById('mob-nav-cat')?.classList.add('active');
    openMobileCategoriesSheet();
  } else if (tab === 'deals') {
    document.getElementById('mob-nav-deals')?.classList.add('active');
    state.activeFilters.dealsOnly = true;
    const dealsCb = document.getElementById('filter-deals-only');
    if (dealsCb) dealsCb.checked = true;
    state.activeFilters.page = 1;
    fetchProducts();
    document.getElementById('products-grid')?.scrollIntoView({ behavior: 'smooth' });
  } else if (tab === 'orders') {
    document.getElementById('mob-nav-orders')?.classList.add('active');
    openOrdersModal();
  } else if (tab === 'cart') {
    document.getElementById('mob-nav-cart')?.classList.add('active');
    toggleCartDrawer(true);
  }
}

// Mobile Sort & Categories Sheets
function openMobileSortSheet() {
  document.getElementById('sort-backdrop')?.classList.add('open');
  document.getElementById('sort-sheet')?.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeMobileSortSheet() {
  document.getElementById('sort-backdrop')?.classList.remove('open');
  document.getElementById('sort-sheet')?.classList.remove('open');
  document.body.style.overflow = 'auto';
}

function selectMobileSort(sortValue) {
  state.activeFilters.sort = sortValue;
  const select = document.getElementById('sort-select');
  if (select) select.value = sortValue;

  document.querySelectorAll('.sort-option').forEach(opt => {
    opt.classList.toggle('selected', opt.dataset.sort === sortValue);
  });

  closeMobileSortSheet();
  state.activeFilters.page = 1;
  fetchProducts();
}

function openMobileCategoriesSheet() {
  const container = document.getElementById('mobile-categories-list');
  if (container && state.categories.length > 0) {
    container.innerHTML = `
      <div class="sort-option ${state.activeFilters.category === 'all' ? 'selected' : ''}" onclick="selectMobileCategory('all')">
        <span>⚡ All Categories</span>
        <span>1,040 products</span>
      </div>
      ${state.categories.map(c => `
        <div class="sort-option ${state.activeFilters.category === c.id ? 'selected' : ''}" onclick="selectMobileCategory('${c.id}')">
          <span>${c.name}</span>
          <span style="font-size: 0.8rem; color: var(--text-muted);">${c.count} items</span>
        </div>
      `).join('')}
    `;
  }
  document.getElementById('categories-backdrop')?.classList.add('open');
  document.getElementById('categories-sheet')?.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeMobileCategoriesSheet() {
  document.getElementById('categories-backdrop')?.classList.remove('open');
  document.getElementById('categories-sheet')?.classList.remove('open');
  document.body.style.overflow = 'auto';
}

function selectMobileCategory(catId) {
  closeMobileCategoriesSheet();
  applyCategoryFilter(catId);
}

function toggleMobileFilterSheet(isOpen) {
  const sidebar = document.getElementById('filters-sidebar');
  const backdrop = document.getElementById('filter-sheet-backdrop');
  const closeBtn = document.getElementById('filter-sheet-close');

  if (isOpen) {
    sidebar?.classList.add('open-mobile');
    backdrop?.classList.add('open');
    if (closeBtn) closeBtn.style.display = 'block';
    document.body.style.overflow = 'hidden';
  } else {
    sidebar?.classList.remove('open-mobile');
    backdrop?.classList.remove('open');
    if (closeBtn) closeBtn.style.display = 'none';
    document.body.style.overflow = 'auto';
  }
}

function toggleMobileDeals() {
  state.activeFilters.dealsOnly = !state.activeFilters.dealsOnly;
  const btn = document.getElementById('mob-deals-btn');
  const cb = document.getElementById('filter-deals-only');
  if (btn) btn.classList.toggle('active', state.activeFilters.dealsOnly);
  if (cb) cb.checked = state.activeFilters.dealsOnly;
  state.activeFilters.page = 1;
  fetchProducts();
}

// --- AI Shopping Assistant ---
function toggleAIChat() {
  const win = document.getElementById('ai-chat-window');
  if (!win) return;
  win.classList.toggle('open');
  if (win.classList.contains('open')) {
    document.getElementById('ai-user-input')?.focus();
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
  const input = document.getElementById('ai-user-input');
  if (input) {
    input.value = text;
    executeAIChat();
  }
}

async function executeAIChat() {
  const input = document.getElementById('ai-user-input');
  const container = document.getElementById('ai-chat-messages');
  const prompt = input.value.trim();
  if (!prompt) return;

  const userMsg = document.createElement('div');
  userMsg.className = 'ai-msg user';
  userMsg.textContent = prompt;
  container.appendChild(userMsg);
  input.value = '';
  container.scrollTop = container.scrollHeight;

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
  const newLoc = prompt('Enter your City and Pincode for delivery:', 'Mumbai 400001');
  if (newLoc && newLoc.trim()) {
    document.getElementById('header-location').textContent = newLoc.trim();
    showToast(`Delivery location set to ${newLoc.trim()}!`);
  }
}

// PWA Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(err => {
      console.log('ServiceWorker not registered in environment:', err);
    });
  });
}
