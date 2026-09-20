const db = require('./db');

function handleAIChat(prompt, context = {}) {
  const query = prompt.toLowerCase();
  let responseText = "";
  let recommendedProducts = [];

  // Check if it's order tracking
  const orderMatch = prompt.match(/ZK-\d+-\d+/i);
  if (orderMatch) {
    const order = db.getOrderById(orderMatch[0].toUpperCase());
    if (order) {
      return {
        reply: `Here are the details for Order **${order.id}**:\n\n• **Status**: ${order.status}\n• **Tracking**: ${order.trackingStatus} 🚚\n• **Estimated Delivery**: ${order.estimatedDelivery}\n• **Total Amount**: ₹${order.totals.grandTotal.toLocaleString('en-IN')}\n• **Payment Method**: ${order.paymentMethod}`,
        products: []
      };
    } else {
      return {
        reply: `I searched our records for Order ID **${orderMatch[0]}**, but couldn't find an active order. Please double check the ID in your profile orders tab.`,
        products: []
      };
    }
  }

  // Detect price limits
  let maxPrice = null;
  let minPrice = null;
  const underMatch = query.match(/(?:under|below|less than|within)\s*(?:rs\.?|inr|₹)?\s*(\d+k?)/i);
  if (underMatch) {
    let val = underMatch[1].toLowerCase();
    if (val.endsWith('k')) {
      maxPrice = parseInt(val) * 1000;
    } else {
      maxPrice = parseInt(val);
    }
  }

  // Detect category keywords
  let targetCategory = null;
  if (query.includes('phone') || query.includes('mobile') || query.includes('tablet') || query.includes('ipad') || query.includes('samsung') || query.includes('pixel') || query.includes('oneplus') || query.includes('infinix')) {
    targetCategory = 'mobiles';
  } else if (query.includes('laptop') || query.includes('headphone') || query.includes('earphone') || query.includes('mouse') || query.includes('keyboard') || query.includes('watch') || query.includes('electronics')) {
    targetCategory = 'electronics';
  } else if (query.includes('men') || query.includes('shirt') || query.includes('jeans') || query.includes('sneaker') || query.includes('shoe')) {
    targetCategory = 'fashion-men';
  } else if (query.includes('women') || query.includes('kurta') || query.includes('dress') || query.includes('jewelry') || query.includes('necklace') || query.includes('handbag')) {
    targetCategory = 'fashion-women';
  } else if (query.includes('kitchen') || query.includes('fryer') || query.includes('blender') || query.includes('cookware') || query.includes('purifier')) {
    targetCategory = 'home-kitchen';
  } else if (query.includes('fitness') || query.includes('gym') || query.includes('yoga') || query.includes('dumbbell') || query.includes('badminton') || query.includes('sport')) {
    targetCategory = 'sports-fitness';
  } else if (query.includes('beauty') || query.includes('skincare') || query.includes('serum') || query.includes('perfume') || query.includes('sunscreen') || query.includes('grooming')) {
    targetCategory = 'beauty-grooming';
  } else if (query.includes('book') || query.includes('pen') || query.includes('stationery') || query.includes('calculator') || query.includes('journal')) {
    targetCategory = 'books-stationery';
  }

  // Detect brands
  const brands = ["Samsung", "Apple", "Dell", "HP", "Sony", "boAt", "Nike", "Adidas", "Puma", "Philips", "Infinix", "OnePlus", "GIVA", "Prestige"];
  let matchedBrand = brands.find(b => query.includes(b.toLowerCase()));

  // Query DB
  const filterParams = {
    limit: 6,
    sort: 'rating_desc'
  };
  if (targetCategory) filterParams.category = targetCategory;
  if (matchedBrand) filterParams.brand = matchedBrand;
  if (maxPrice) filterParams.maxPrice = maxPrice;
  if (query.includes('deal') || query.includes('discount') || query.includes('offer')) {
    filterParams.dealsOnly = true;
    filterParams.sort = 'discount_desc';
  }

  // Extract relevant search words if no specific category or brand
  if (!targetCategory && !matchedBrand) {
    const cleanSearch = query.replace(/(find|suggest|show|recommend|me|some|best|cheap|good|the|a|for|under|below|rs|inr)/g, '').trim();
    if (cleanSearch.length > 2) {
      filterParams.search = cleanSearch.split(' ')[0];
    }
  }

  const result = db.getProducts(filterParams);
  recommendedProducts = result.products.slice(0, 4);

  if (recommendedProducts.length > 0) {
    const priceText = maxPrice ? ` under ₹${maxPrice.toLocaleString('en-IN')}` : '';
    const brandText = matchedBrand ? ` by ${matchedBrand}` : '';
    responseText = `I found some top-rated options${brandText}${priceText} with great customer reviews and current festive offers! Here are my top recommendations for you:`;
  } else {
    // Fallback popular deals
    const fallback = db.getProducts({ dealsOnly: true, limit: 3 });
    recommendedProducts = fallback.products;
    responseText = `I couldn't find exact matches for that specific combination, but here are some of our hottest trending deals and bestselling products right now:`;
  }

  return {
    reply: responseText,
    products: recommendedProducts.map(p => ({
      id: p.id,
      title: p.title,
      price: p.price,
      mrp: p.mrp,
      discountPercent: p.discountPercent,
      rating: p.rating,
      image: p.image,
      categoryName: p.categoryName
    }))
  };
}

module.exports = { handleAIChat };
