const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const db = require('./db');
const { handleAIChat } = require('./aiAssistant');
const emailService = require('./emailService');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
      if (body.length > 1e6) {
        req.destroy();
        reject(new Error('Body too large'));
      }
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

function getAuthToken(req) {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

async function handleRequest(req, res) {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    return res.end();
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const query = parsedUrl.query;

  // --- API Routes ---
  if (pathname.startsWith('/api/')) {
    try {
      // 1. GET /api/products
      if (req.method === 'GET' && pathname === '/api/products') {
        const result = db.getProducts(query);
        return sendJSON(res, 200, result);
      }

      // 2. GET /api/products/:id
      const productMatch = pathname.match(/^\/api\/products\/(\d+)$/);
      if (req.method === 'GET' && productMatch) {
        const prod = db.getProductById(productMatch[1]);
        if (!prod) {
          return sendJSON(res, 404, { error: 'Product not found' });
        }
        return sendJSON(res, 200, prod);
      }

      // 3. GET /api/categories
      if (req.method === 'GET' && pathname === '/api/categories') {
        const categories = db.getCategories();
        return sendJSON(res, 200, categories);
      }

      // 4. POST /api/auth/register
      if (req.method === 'POST' && pathname === '/api/auth/register') {
        const body = await parseBody(req);
        if (!body.name || !body.email || !body.password) {
          return sendJSON(res, 400, { error: 'Name, email, and password are required.' });
        }
        const user = db.registerUser(body);
        return sendJSON(res, 201, { message: 'Registration successful', user });
      }

      // 5. POST /api/auth/login
      if (req.method === 'POST' && pathname === '/api/auth/login') {
        const body = await parseBody(req);
        if (!body.email || !body.password) {
          return sendJSON(res, 400, { error: 'Email and password are required.' });
        }
        const user = db.loginUser(body.email, body.password);
        return sendJSON(res, 200, { message: 'Login successful', user });
      }

      // 6. GET /api/auth/me
      if (req.method === 'GET' && pathname === '/api/auth/me') {
        const token = getAuthToken(req);
        const user = db.getUserByToken(token);
        if (!user) {
          return sendJSON(res, 401, { error: 'Not authenticated' });
        }
        return sendJSON(res, 200, { user });
      }

      // 7. POST /api/orders
      if (req.method === 'POST' && pathname === '/api/orders') {
        const body = await parseBody(req);
        const token = getAuthToken(req);
        const user = db.getUserByToken(token);
        
        if (!body.items || !body.items.length) {
          return sendJSON(res, 400, { error: 'Cart items are required to create an order.' });
        }
        if (!body.shippingAddress || !body.shippingAddress.name || !body.shippingAddress.address) {
          return sendJSON(res, 400, { error: 'Shipping details are incomplete.' });
        }

        const customerEmail = body.customerEmail || (user ? user.email : (body.shippingAddress.email || ''));

        const order = db.createOrder({
          userId: user ? user.id : (body.userId || 'guest'),
          customerEmail,
          items: body.items,
          shippingAddress: body.shippingAddress,
          paymentMethod: body.paymentMethod || 'COD',
          paymentDetails: body.paymentDetails || {},
          totals: body.totals || { grandTotal: 0 }
        });

        // Trigger Order Confirmation Email (Live SMTP or simulation log)
        const emailResult = await emailService.sendOrderConfirmation(order);

        return sendJSON(res, 201, {
          message: 'Order placed successfully!',
          order,
          emailNotice: emailResult.deliveredTo
        });
      }

      // 8. GET /api/orders
      if (req.method === 'GET' && pathname === '/api/orders') {
        const token = getAuthToken(req);
        const user = db.getUserByToken(token);
        const userId = user ? user.id : (query.userId || null);
        const email = user ? user.email : (query.email || null);
        const orders = db.getUserOrders(userId, email);
        return sendJSON(res, 200, { orders });
      }

      // 9. GET /api/orders/:id
      const orderMatch = pathname.match(/^\/api\/orders\/([A-Za-z0-9-]+)$/);
      if (req.method === 'GET' && orderMatch) {
        const order = db.getOrderById(orderMatch[1]);
        if (!order) {
          return sendJSON(res, 404, { error: 'Order not found' });
        }
        return sendJSON(res, 200, order);
      }

      // 10. GET /api/notifications/latest
      if (req.method === 'GET' && pathname === '/api/notifications/latest') {
        const logPath = path.join(__dirname, 'data', 'email_notifications.log');
        let logs = [];
        if (fs.existsSync(logPath)) {
          const lines = fs.readFileSync(logPath, 'utf8').trim().split('\n');
          logs = lines.filter(Boolean).map(l => {
            try { return JSON.parse(l); } catch { return null; }
          }).filter(Boolean).reverse().slice(0, 10);
        }
        return sendJSON(res, 200, { notifications: logs });
      }

      // 11. POST /api/ai/chat
      if (req.method === 'POST' && pathname === '/api/ai/chat') {
        const body = await parseBody(req);
        if (!body.prompt) {
          return sendJSON(res, 400, { error: 'Prompt is required.' });
        }
        const aiResponse = handleAIChat(body.prompt, body.context);
        return sendJSON(res, 200, aiResponse);
      }

      return sendJSON(res, 404, { error: 'Endpoint not found' });
    } catch (err) {
      console.error('API Error:', err);
      return sendJSON(res, 400, { error: err.message || 'Internal Server Error' });
    }
  }

  // --- Static Files Serving ---
  let safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
  if (safePath === '/' || safePath === '') {
    safePath = '/index.html';
  }

  const filePath = path.join(PUBLIC_DIR, safePath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      if (!path.extname(safePath)) {
        const indexPath = path.join(PUBLIC_DIR, 'index.html');
        return fs.readFile(indexPath, (readErr, content) => {
          if (readErr) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            return res.end('404 Not Found');
          }
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(content);
        });
      }

      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('404 Not Found');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=86400'
    });

    fs.createReadStream(filePath).pipe(res);
  });
}

const server = http.createServer(handleRequest);

server.listen(PORT, () => {
  console.log(`===================================================`);
  console.log(`🚀 ZenithKart E-Commerce Platform Server Running!`);
  console.log(`🌐 Local URL: http://localhost:${PORT}`);
  console.log(`📦 Loaded Catalog: 1,040 Authentic Real Products`);
  console.log(`🤖 AI Shopping Assistant: Ready`);
  console.log(`💳 Realistic Multi-Step UPI / COD / Card Gateway: Active`);
  console.log(`📧 Order Confirmation Email Notifications: Active`);
  console.log(`===================================================`);
});

module.exports = server;
