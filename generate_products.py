import json
import random

categories = [
    {
        "id": "mobiles",
        "name": "Mobiles & Tablets",
        "icon": "📱",
        "brands": ["Samsung", "Apple", "OnePlus", "Infinix", "Xiaomi", "Realme", "Google Pixel", "Motorola", "iQOO", "Nothing"],
        "subcategories": ["Flagship 5G Phones", "Budget 5G Phones", "Gaming Smartphones", "iPads & Tablets", "Foldables & Flips"],
        "templates": [
            ("{brand} {model} 5G ({ram}GB RAM, {storage}GB Storage)", 14999, 129999, 10, 45),
            ("{brand} Tab {model} WiFi+LTE ({screen}\" Display)", 12999, 79999, 15, 40),
            ("{brand} Ultra Gaming Phone with Liquid Cooling", 24999, 89999, 12, 38)
        ],
        "models": ["Neo 12", "Pro Max 15", "Edge 50", "Nord CE", "Galaxy S24", "Note 40 Pro", "Phone 2a", "Pad Air", "Pixel 9", "Z Fold", "Speedster 7", "Prime X"],
        "images": [
            "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1567581935884-3349723552ca?w=600&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1580910051074-3eb694886505?w=600&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600&auto=format&fit=crop&q=80"
        ]
    },
    {
        "id": "electronics",
        "name": "Electronics & Laptops",
        "icon": "💻",
        "brands": ["Dell", "HP", "Lenovo", "Asus", "Acer", "Sony", "boAt", "Bose", "JBL", "Logitech"],
        "subcategories": ["Gaming Laptops", "Thin & Light Laptops", "Wireless Headphones", "Smartwatches", "Computer Accessories", "Mechanical Keyboards"],
        "templates": [
            ("{brand} {model} Gaming Laptop (16GB RAM, 512GB SSD, RTX 4060)", 54999, 149999, 15, 35),
            ("{brand} Noise Cancelling Bluetooth Headphones", 2499, 29999, 20, 60),
            ("{brand} Pro Wireless Ergonomic Gaming Mouse", 999, 7999, 25, 55),
            ("{brand} RGB Mechanical Gaming Keyboard (Custom Switches)", 1999, 12999, 20, 50),
            ("{brand} Smart Fitness Watch with AMOLED Display & Calling", 1499, 24999, 30, 70)
        ],
        "models": ["Inspiron 15", "Predator Helios", "ZenBook Flip", "Rockerz ANC", "WH-1000XM5", "Legion Pro", "Pavilion x360", "Apex Strike", "Aura Pro", "Master MX3"],
        "images": [
            "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80"
        ]
    },
    {
        "id": "fashion-men",
        "name": "Men's Fashion",
        "icon": "👔",
        "brands": ["Puma", "Nike", "Adidas", "Levi's", "Allen Solly", "Roadster", "Peter England", "Tommy Hilfiger", "Van Heusen", "U.S. Polo Assn."],
        "subcategories": ["Casual T-Shirts", "Slim-Fit Formal Shirts", "Denim Jeans", "Running Shoes & Sneakers", "Jackets & Hoodies", "Smart Watches & Belts"],
        "templates": [
            ("{brand} Men's Pure Cotton Slim Fit Casual Shirt", 899, 3499, 30, 65),
            ("{brand} Lightweight Breathable Running Sneakers", 1499, 8999, 25, 60),
            ("{brand} Premium Washed Stretch Denim Jeans", 1299, 4999, 20, 55),
            ("{brand} Solid Regular Fit Graphic Cotton T-Shirt", 499, 1999, 35, 70),
            ("{brand} Classic Bomber Jacket with Zipper Pockets", 1999, 6999, 25, 60)
        ],
        "models": ["AeroFit", "AirMax Drift", "Original 501", "FlexStride", "Urban Edge", "Classic Elite", "StreetWear Pro", "Nordic Comfort"],
        "images": [
            "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=600&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600&auto=format&fit=crop&q=80"
        ]
    },
    {
        "id": "fashion-women",
        "name": "Women's Fashion",
        "icon": "👗",
        "brands": ["Biba", "W for Woman", "Zara", "H&M", "Forever 21", "GIVA", "Lavie", "Bata", "Caprese", "FabIndia"],
        "subcategories": ["Ethnic Kurta Sets", "Western Party Dresses", "Designer Handbags", "Sterling Silver Jewelry", "Footwear & Heels", "Winter Sweaters"],
        "templates": [
            ("{brand} Embroidered Silk Anarkali Kurta Set with Dupatta", 1499, 7999, 30, 65),
            ("{brand} Floral Print Tiered Maxi Dress", 999, 4499, 25, 60),
            ("{brand} 925 Sterling Silver Zircon Solitaire Pendant Necklace", 1299, 5999, 20, 50),
            ("{brand} Faux Leather Structured Shoulder Tote Bag", 1199, 4999, 35, 65),
            ("{brand} Block Heel Comfort Fashion Sandals", 899, 3999, 30, 60)
        ],
        "models": ["Bloom & Blossom", "Glamour Walk", "Royal Velvet", "Serenade", "Celestial Spark", "Aurora Chic", "Boho Bliss"],
        "images": [
            "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=600&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600&auto=format&fit=crop&q=80"
        ]
    },
    {
        "id": "home-kitchen",
        "name": "Home & Kitchen",
        "icon": "🏠",
        "brands": ["Philips", "Prestige", "Bajaj", "Wonderchef", "Milton", "Wakefit", "Solimo", "Havells", "Kent", "Bosch"],
        "subcategories": ["Smart Air Fryers", "Nutri-Blenders & Mixers", "Non-Stick Cookware Sets", "Orthopedic Mattresses", "Water Purifiers", "LED Ceiling Lights"],
        "templates": [
            ("{brand} Digital Rapid-Air 4.2L Smart Air Fryer", 3499, 11999, 25, 55),
            ("{brand} 400W High-Speed Bullet Nutri-Blender & Smoothie Maker", 1799, 5999, 30, 60),
            ("{brand} 3-Piece Granite Non-Stick Induction Cookware Set", 1299, 4999, 35, 65),
            ("{brand} RO + UV + UF Mineral Alkaline Water Purifier", 7999, 21999, 20, 45),
            ("{brand} Stainless Steel Vacuum Insulated 1L Thermos Flask", 699, 2499, 25, 50)
        ],
        "models": ["SuperChef Pro", "NutriFast", "ThermoShield", "PureDrop 7X", "Diamond Cook", "Aroma Elegance", "EcoBreeze"],
        "images": [
            "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=600&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=600&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=600&auto=format&fit=crop&q=80"
        ]
    },
    {
        "id": "sports-fitness",
        "name": "Sports & Fitness",
        "icon": "⚽",
        "brands": ["Decathlon", "Nivia", "Cosco", "Yonex", "Kore", "Boldfit", "Fitkit", "Vector X", "Stag", "Strauss"],
        "subcategories": ["Badminton Racquets", "Home Gym Dumbbell Kits", "Yoga Mats & Straps", "Football & Basketballs", "Resistance Bands", "Smart Fitness Equipment"],
        "templates": [
            ("{brand} Carbon Graphite High Tension Badminton Racquet with Full Cover", 1299, 5499, 25, 55),
            ("{brand} 20kg Adjustable Rubber Dumbbells Home Gym Set", 1499, 4999, 35, 65),
            ("{brand} High Density 6mm Anti-Skid Eco-Friendly Yoga Mat", 599, 2199, 30, 60),
            ("{brand} Size 5 Professional Match Football (Hand Stitched)", 699, 2499, 25, 50),
            ("{brand} Heavy-Duty Exercise Resistance Loop Bands (Set of 5)", 399, 1499, 40, 70)
        ],
        "models": ["AstroPower 99", "Titan Iron", "FlexZen Pro", "StrikeForce", "NitroSpeed", "AeroSmash"],
        "images": [
            "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=600&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=600&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=600&auto=format&fit=crop&q=80"
        ]
    },
    {
        "id": "beauty-grooming",
        "name": "Beauty & Grooming",
        "icon": "💄",
        "brands": ["Nivea", "L'Oreal", "The Derma Co", "Mamaearth", "Beardo", "Bombay Shaving Co", "Garnier", "Minimalist", "Maybelline", "Lakme"],
        "subcategories": ["Face Serums & Sunscreens", "Hair Growth Oils & Shampoos", "Beard Grooming Kits", "Electric Trimmers", "Perfumes & Deodorants", "Makeup Palettes"],
        "templates": [
            ("{brand} 10% Niacinamide & Zinc Face Serum (30ml)", 399, 999, 15, 45),
            ("{brand} Waterproof Cordless Beard & Hair Trimmer with Quick Charge", 899, 2999, 30, 60),
            ("{brand} Ultra Matte SPF 50 PA++++ Gel Sunscreen (50g)", 449, 899, 15, 40),
            ("{brand} Premium Long-Lasting Luxury Eau De Parfum (100ml)", 799, 3499, 35, 65),
            ("{brand} Onion Hair Fall Control Shampoo + Conditioner Combo", 549, 1299, 25, 50)
        ],
        "models": ["GlowShield", "ProGroom 3000", "HydraLuxe", "Oud Noir", "PureActive", "Radiance Plus"],
        "images": [
            "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1608248597359-00918731b674?w=600&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1594035910387-fea47794261f?w=600&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600&auto=format&fit=crop&q=80"
        ]
    },
    {
        "id": "books-stationery",
        "name": "Books & Stationery",
        "icon": "📚",
        "brands": ["Penguin", "HarperCollins", "Classmate", "Parker", "Casio", "Oxford", "Rupa", "Bloomsbury", "Faber-Castell", "Camlin"],
        "subcategories": ["Self-Help & Finance", "Fiction & Thrillers", "Scientific Calculators", "Luxury Fountain Pens", "Hardbound Bullet Journals", "Competitive Exam Guides"],
        "templates": [
            ("{brand} {book_title} (Bestselling Paperback Edition)", 299, 999, 20, 50),
            ("{brand} FX-991CW Advanced Non-Programmable Scientific Calculator", 1199, 1895, 10, 25),
            ("{brand} Premium Matte Finish Refillable Rollerball Pen in Gift Box", 499, 2499, 25, 55),
            ("{brand} A5 Dotted Grid Vegan Leather Bullet Journal (192 Pages)", 349, 1199, 30, 60),
            ("{brand} Professional 48-Color Artist Watercolour Cake & Brush Set", 499, 1799, 25, 55)
        ],
        "models": ["Atomic Habits", "Psychology of Money", "Deep Work", "Ikigai", "The Alchemist", "Clean Code", "Thinking Fast & Slow", "Rich Dad Poor Dad"],
        "images": [
            "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=600&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?w=600&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&auto=format&fit=crop&q=80"
        ]
    }
]

badges = ["Deal of the Day", "Bestseller", "Trending", "Hot Offer", "Limited Stock", "Festive Special", "Mega Discount", ""]
offer_templates = [
    "Bank Offer: 10% Instant Discount on HDFC & SBI Credit Cards on orders above ₹1,999",
    "Special Offer: Extra ₹200 off on UPI payments (GPay, PhonePe, Paytm)",
    "No Cost EMI available on major bank cards starting at ₹499/month",
    "Buy 2 items from this collection and get an extra 10% OFF automatically",
    "Free Express Delivery for Prime & Plus Members"
]

products = []
product_id = 1
random.seed(42)

# Generate at least 1,050 products evenly across the 8 categories
per_category_count = 135  # 8 * 135 = 1080 products

for cat in categories:
    cat_id = cat["id"]
    cat_name = cat["name"]
    brands = cat["brands"]
    subcategories = cat["subcategories"]
    templates = cat["templates"]
    models = cat["models"]
    img_list = cat["images"]
    
    for i in range(per_category_count):
        brand = random.choice(brands)
        subcat = random.choice(subcategories)
        tpl_choice = random.choice(templates)
        template_str, min_p, max_p, min_disc, max_disc = tpl_choice
        
        # Fill template
        model_name = random.choice(models)
        ram_val = random.choice([6, 8, 12, 16])
        storage_val = random.choice([128, 256, 512, 1024])
        screen_val = random.choice([10.5, 11.2, 12.4, 14.0])
        
        title = template_str.format(
            brand=brand,
            model=model_name,
            book_title=model_name,
            ram=ram_val,
            storage=storage_val,
            screen=screen_val
        )
        # Add variation indicator to make each title unique
        variant = f"Variant #{i+1} ({random.choice(['Matte Black', 'Glacier Blue', 'Titanium Grey', 'Forest Green', 'Sunset Gold', 'Silver Frost', 'Obsidian', 'Snow White'])})"
        full_title = f"{title} - {variant}"
        
        # Pricing
        mrp = round(random.randint(min_p, max_p) / 50) * 50
        disc_pct = random.randint(min_disc, max_disc)
        discount_price = round((mrp * (100 - disc_pct) / 100) / 10) * 10
        if discount_price >= mrp:
            discount_price = mrp - 100
        
        rating = round(random.uniform(3.7, 4.9), 1)
        review_count = random.randint(35, 18500)
        stock = random.randint(5, 120)
        badge = random.choice(badges) if (i % 3 == 0) else ""
        is_deal = (badge in ["Deal of the Day", "Mega Discount"] or i % 7 == 0)
        
        image_url = img_list[i % len(img_list)]
        
        product = {
            "id": product_id,
            "title": full_title,
            "brand": brand,
            "category": cat_id,
            "categoryName": cat_name,
            "subCategory": subcat,
            "mrp": mrp,
            "price": discount_price,
            "discountPercent": disc_pct,
            "rating": rating,
            "reviewCount": review_count,
            "stock": stock,
            "badge": badge,
            "isDealOfTheDay": is_deal,
            "image": image_url,
            "description": f"Experience unparalleled performance and quality with the {full_title}. Engineered with cutting-edge craftsmanship from {brand}, this product meets rigorous international standards. Includes 1-year official brand warranty, genuine box accessories, and 7-day hassle-free replacement.",
            "specs": {
                "Brand": brand,
                "Model": model_name,
                "Category": cat_name,
                "Sub-Category": subcat,
                "Warranty": "1 Year Manufacturer Warranty",
                "Delivery": "Eligible for Free Standard & Cash on Delivery (COD)",
                "Origin": "India"
            },
            "offers": random.sample(offer_templates, 3)
        }
        products.append(product)
        product_id += 1

output_file = "/working_dir/c_1530d9f6e787dcfa/zenithkart/data/products.json"
with open(output_file, "w", encoding="utf-8") as f:
    json.dump(products, f, indent=2)

print(f"Successfully generated {len(products)} products and saved to {output_file}!")
