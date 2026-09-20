"""
ZenithKart - Python Alternative Backend Server
Supports running with Flask (or native Python http.server)
"""
import os
import sys
import json
import mimetypes
from http.server import HTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

PORT = int(os.environ.get("PORT", 5000))
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
PUBLIC_DIR = os.path.join(BASE_DIR, "public")

# Try importing Flask
try:
    from flask import Flask, request, jsonify, send_from_directory
    from flask_cors import CORS

    app = Flask(__name__, static_folder="public", static_url_path="")
    CORS(app)

    def load_products():
        p_path = os.path.join(DATA_DIR, "products.json")
        if os.path.exists(p_path):
            with open(p_path, "r", encoding="utf-8") as f:
                return json.load(f)
        return []

    PRODUCTS = load_products()
    USERS = []
    ORDERS = []

    @app.route("/")
    def index():
        return send_from_directory("public", "index.html")

    @app.route("/api/products", methods=["GET"])
    def get_products():
        cat = request.args.get("category")
        search = request.args.get("search", "").lower()
        sort = request.args.get("sort", "featured")
        page = int(request.args.get("page", 1))
        limit = int(request.args.get("limit", 24))

        results = PRODUCTS
        if cat and cat != "all":
            results = [p for p in results if p.get("category") == cat]
        if search:
            results = [p for p in results if search in p.get("title", "").lower() or search in p.get("brand", "").lower()]

        total = len(results)
        start = (page - 1) * limit
        paginated = results[start:start + limit]

        return jsonify({
            "total": total,
            "page": page,
            "limit": limit,
            "totalPages": (total + limit - 1) // limit,
            "products": paginated
        })

    @app.route("/api/products/<int:pid>", methods=["GET"])
    def get_product_detail(pid):
        for p in PRODUCTS:
            if p["id"] == pid:
                return jsonify(p)
        return jsonify({"error": "Not found"}), 404

    @app.route("/api/categories", methods=["GET"])
    def get_categories():
        cats = {}
        for p in PRODUCTS:
            cid = p.get("category")
            cname = p.get("categoryName")
            if cid not in cats:
                cats[cid] = {"id": cid, "name": cname, "count": 0}
            cats[cid]["count"] += 1
        return jsonify(list(cats.values()))

    @app.route("/api/orders", methods=["POST"])
    def create_order():
        data = request.json or {}
        order_id = f"ZK-{os.urandom(3).hex().upper()}-PY"
        order = {
            "id": order_id,
            "items": data.get("items", []),
            "shippingAddress": data.get("shippingAddress", {}),
            "paymentMethod": data.get("paymentMethod", "COD"),
            "status": "Confirmed",
            "estimatedDelivery": "Within 3-4 Business Days",
            "totals": data.get("totals", {})
        }
        ORDERS.append(order)
        return jsonify({"message": "Order placed successfully!", "order": order}), 201

    if __name__ == "__main__":
        print(f"Starting ZenithKart Python Flask Server on http://localhost:{PORT}")
        app.run(host="0.0.0.0", port=PORT, debug=True)

except ImportError:
    print("Flask not detected in current environment. Using Node.js server.js (recommended) or install flask: pip install -r requirements.txt")
