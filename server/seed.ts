import { query } from './db';

export async function seedDatabase() {
  console.log('Seeding Supabase PostgreSQL database for MIO...');

  // 1. Seed Notifications
  await query(`
    INSERT INTO notifications (user_id, title, message, type)
    VALUES 
      (NULL, 'System Update', 'Welcome to MIO Luxury Curation.', 'system')
    ON CONFLICT DO NOTHING;
  `);

  // 2. Shipping Methods
  const shipRes = await query('SELECT COUNT(*)::int as count FROM shipping_methods');
  if (shipRes.rows[0].count === 0) {
    await query(`
      INSERT INTO shipping_methods (name, description, price, estimated_days_min, estimated_days_max, is_active)
      VALUES 
        ('MIO Standard Courier', 'Climate-neutral ground transit in signature packaging', 15.00, 3, 5, true),
        ('White Glove Express', 'Next-evening priority courier with scheduled delivery window', 35.00, 1, 2, true),
        ('Same-Day Atelier Hand Delivery', 'Dedicated courier delivery directly to your door in select metros', 75.00, 1, 1, true);
    `);
  }

  // 3. Coupons
  const couponRes = await query('SELECT COUNT(*)::int as count FROM coupons');
  if (couponRes.rows[0].count === 0) {
    await query(`
      INSERT INTO coupons (code, description, discount_type, discount_value, minimum_order_amount, maximum_discount, usage_limit, is_active)
      VALUES 
        ('MIO15', '15% privilege discount for connoisseurs', 'percentage', 15.00, 150.00, 200.00, 500, true),
        ('WELCOME10', '10% privilege discount on your debut acquisition', 'percentage', 10.00, 100.00, 100.00, 1000, true),
        ('ATELIER50', '$50 tier deduction on prestige orders exceeding $300', 'fixed', 50.00, 300.00, null, 250, true);
    `);
  }

  // 4. Categories
  const catCount = await query('SELECT COUNT(*)::int as count FROM categories');
  let catMap: Record<string, string> = {};

  if (catCount.rows[0].count === 0) {
    const cats = [
      {
        name: 'Fine Jewelry',
        description: 'Sculptural solid gold, platinum, and ethically sourced diamond silhouettes.',
        image_url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=1000&auto=format&fit=crop',
      },
      {
        name: 'Tailored Silks & Wool',
        description: 'Impeccably draped silk twill, merino wool, and structured atelier outerwear.',
        image_url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1000&auto=format&fit=crop',
      },
      {
        name: 'Artisanal Leather',
        description: 'Hand-burnished Italian calfskin travel pieces, totes, and structured cases.',
        image_url: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=1000&auto=format&fit=crop',
      },
      {
        name: 'Signature Fragrances',
        description: 'Small-batch extract de parfum concocted with rare resins and botanical essences.',
        image_url: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=1000&auto=format&fit=crop',
      },
      {
        name: 'Architectural Homeware',
        description: 'Hand-blown Murano glassware, travertine stone objects, and tactile ceramic vessels.',
        image_url: 'https://images.unsplash.com/photo-1616046229478-9901c5536a45?q=80&w=1000&auto=format&fit=crop',
      },
    ];

    for (const c of cats) {
      const res = await query<{ id: string }>(
        'INSERT INTO categories (name, description, image_url, is_active) VALUES ($1, $2, $3, true) RETURNING id',
        [c.name, c.description, c.image_url]
      );
      catMap[c.name] = res.rows[0].id;
    }
  } else {
    const existingCats = await query<{ id: string; name: string }>('SELECT id, name FROM categories');
    existingCats.rows.forEach(c => {
      catMap[c.name] = c.id;
    });
  }

  // 5. Products & Variants & Images
  const prodCount = await query('SELECT COUNT(*)::int as count FROM products');
  if (prodCount.rows[0].count === 0) {
    const productsData = [
      {
        category: 'Fine Jewelry',
        title: 'Aura Pavé Continuum Ring',
        slug: 'aura-pave-continuum-ring',
        description: 'Handcrafted in 18-karat recycled yellow gold, encircled with hand-selected brilliant cut lab-grown diamonds (0.65 ctw) set in an undulating continuous wave.',
        brand: 'MIO Atelier',
        base_price: 680.00,
        variants: [
          { sku: 'MIO-AUR-RG-5', size: '5', color: '18k Yellow Gold', price: 680.00, stock: 12 },
          { sku: 'MIO-AUR-RG-6', size: '6', color: '18k Yellow Gold', price: 680.00, stock: 16 },
          { sku: 'MIO-AUR-RG-7', size: '7', color: '18k Yellow Gold', price: 680.00, stock: 9 },
          { sku: 'MIO-AUR-WG-6', size: '6', color: '18k White Gold', price: 710.00, stock: 8 },
        ],
        images: [
          { url: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=1000&auto=format&fit=crop', is_primary: true },
          { url: 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?q=80&w=1000&auto=format&fit=crop', is_primary: false },
        ],
        reviews: [
          { rating: 5, title: 'Breathtaking finish', comment: 'The continuous undulating silhouette catches ambient light in the most subtle way.' },
          { rating: 5, title: 'Perfection in solid gold', comment: 'Weighty, beautifully polished, and arrived in gorgeous suede packaging.' },
        ],
      },
      {
        category: 'Fine Jewelry',
        title: 'Lumière Baroque Pearl Drop Pendant',
        slug: 'lumiere-baroque-pearl-drop-pendant',
        description: 'An organic freshwater baroque pearl cradled within a solid 14k gold wire armature, hung on an adjustable 18-inch diamond-cut curb chain.',
        brand: 'MIO Atelier',
        base_price: 340.00,
        variants: [
          { sku: 'MIO-LUM-PRL-GLD', size: 'One Size (18")', color: 'Yellow Gold / Pearl', price: 340.00, stock: 24 },
          { sku: 'MIO-LUM-PRL-SLV', size: 'One Size (18")', color: 'Rhodium Silver / Pearl', price: 290.00, stock: 15 },
        ],
        images: [
          { url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=1000&auto=format&fit=crop', is_primary: true },
          { url: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=1000&auto=format&fit=crop', is_primary: false },
        ],
        reviews: [
          { rating: 5, title: 'Unique heirloom', comment: 'Every baroque pearl has its own character. Truly one of one.' },
        ],
      },
      {
        category: 'Tailored Silks & Wool',
        title: 'The Solstice Heavy Silk Trench',
        slug: 'solstice-heavy-silk-trench',
        description: 'Crafted from 32-momme double silk georgette with a natural matte sheen. Featuring storm flaps, tonal horn buttons, and an architectural belted drape.',
        brand: 'MIO Studio',
        base_price: 890.00,
        variants: [
          { sku: 'MIO-SOL-TRN-S-CHR', size: 'Small (EU 36)', color: 'Obsidian Charcoal', price: 890.00, stock: 6 },
          { sku: 'MIO-SOL-TRN-M-CHR', size: 'Medium (EU 38)', color: 'Obsidian Charcoal', price: 890.00, stock: 11 },
          { sku: 'MIO-SOL-TRN-L-CHR', size: 'Large (EU 40)', color: 'Obsidian Charcoal', price: 890.00, stock: 7 },
          { sku: 'MIO-SOL-TRN-M-CAM', size: 'Medium (EU 38)', color: 'Toasted Camel', price: 890.00, stock: 8 },
        ],
        images: [
          { url: 'https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=1000&auto=format&fit=crop', is_primary: true },
          { url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop', is_primary: false },
        ],
        reviews: [
          { rating: 5, title: 'Incredible movement', comment: 'Flows like liquid when walking. The drape and craftsmanship are comparable to Savile Row.' },
        ],
      },
      {
        category: 'Tailored Silks & Wool',
        title: 'Verona Cashmere Roll-Neck Knit',
        slug: 'verona-cashmere-roll-neck-knit',
        description: 'Spun from pure Grade-A Inner Mongolian cashmere, seven-gauge rib knit with reinforced seamless cuffs and a relaxed, enveloping collar.',
        brand: 'MIO Studio',
        base_price: 460.00,
        variants: [
          { sku: 'MIO-VRN-KNT-S-IVR', size: 'Small', color: 'Ecru Ivory', price: 460.00, stock: 14 },
          { sku: 'MIO-VRN-KNT-M-IVR', size: 'Medium', color: 'Ecru Ivory', price: 460.00, stock: 18 },
          { sku: 'MIO-VRN-KNT-L-IVR', size: 'Large', color: 'Ecru Ivory', price: 460.00, stock: 10 },
          { sku: 'MIO-VRN-KNT-M-NAV', size: 'Medium', color: 'Midnight Navy', price: 460.00, stock: 15 },
        ],
        images: [
          { url: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?q=80&w=1000&auto=format&fit=crop', is_primary: true },
          { url: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=1000&auto=format&fit=crop', is_primary: false },
        ],
        reviews: [
          { rating: 5, title: 'Supreme warmth', comment: 'Cloud-soft texture that does not pill. Effortlessly elegant.' },
        ],
      },
      {
        category: 'Artisanal Leather',
        title: 'Calder Structured Weekender in Saddle Calfskin',
        slug: 'calder-structured-weekender',
        description: 'Vegetable-tanned Tuscan calfskin structured with solid brushed brass hardware. Features an interior laptop sleeve, suede-lined compartments, and protective metal feet.',
        brand: 'MIO Pelletteria',
        base_price: 950.00,
        variants: [
          { sku: 'MIO-CLD-SDL-TAN', size: '50cm Cabin Size', color: 'Saddle Cognac', price: 950.00, stock: 7 },
          { sku: 'MIO-CLD-SDL-BLK', size: '50cm Cabin Size', color: 'Nero Black', price: 950.00, stock: 9 },
        ],
        images: [
          { url: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=1000&auto=format&fit=crop', is_primary: true },
          { url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=1000&auto=format&fit=crop', is_primary: false },
        ],
        reviews: [
          { rating: 5, title: 'The ultimate travel companion', comment: 'Fits overhead cabins effortlessly. The leather patina develops richer with every journey.' },
        ],
      },
      {
        category: 'Artisanal Leather',
        title: 'Paloma Minimalist Envelope Crossbody',
        slug: 'paloma-minimalist-envelope-crossbody',
        description: 'Geometric flap silhouette with concealed magnetic closure, removable leather strap, and internal card organizers. Designed to transition seamlessly from day to soiree.',
        brand: 'MIO Pelletteria',
        base_price: 520.00,
        variants: [
          { sku: 'MIO-PLM-CRS-BLK', size: 'Compact (22cm)', color: 'Matte Black', price: 520.00, stock: 15 },
          { sku: 'MIO-PLM-CRS-TAU', size: 'Compact (22cm)', color: 'Dove Taupe', price: 520.00, stock: 11 },
          { sku: 'MIO-PLM-CRS-BRG', size: 'Compact (22cm)', color: 'Deep Burgundy', price: 520.00, stock: 8 },
        ],
        images: [
          { url: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?q=80&w=1000&auto=format&fit=crop', is_primary: true },
          { url: 'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?q=80&w=1000&auto=format&fit=crop', is_primary: false },
        ],
        reviews: [
          { rating: 5, title: 'Understated luxury', comment: 'Zero loud logos, just pure form and sublime leather.' },
        ],
      },
      {
        category: 'Signature Fragrances',
        title: 'N° 07 Ambre Nocturne Extrait',
        slug: 'ambre-nocturne-extrait',
        description: 'A deeply contemplative fragrance opening with smoked cardamom and pink peppercorn, yielding to aged labdanum, iris root, and warm bourbon vanilla.',
        brand: 'MIO Parfumerie',
        base_price: 260.00,
        variants: [
          { sku: 'MIO-PRF-AMB-50', size: '50ml Flacon', color: 'Amber Glass', price: 260.00, stock: 35 },
          { sku: 'MIO-PRF-AMB-100', size: '100ml Flacon', color: 'Amber Glass', price: 380.00, stock: 20 },
        ],
        images: [
          { url: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=1000&auto=format&fit=crop', is_primary: true },
          { url: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?q=80&w=1000&auto=format&fit=crop', is_primary: false },
        ],
        reviews: [
          { rating: 5, title: 'Enigmatic and lingering', comment: 'Stays on cashmere scarves for days. A mysterious, intimate sillage.' },
        ],
      },
      {
        category: 'Signature Fragrances',
        title: 'Santal Vesper Botanical Reed Diffuser',
        slug: 'santal-vesper-botanical-diffuser',
        description: 'Natural rattan reeds diffusing pure Australian sandalwood, white cypress, and crushed violet leaf inside a heavyweight fluted smoke glass decanter.',
        brand: 'MIO Parfumerie',
        base_price: 135.00,
        variants: [
          { sku: 'MIO-DIF-SNT-250', size: '250ml', color: 'Smoke Glass', price: 135.00, stock: 28 },
        ],
        images: [
          { url: 'https://images.unsplash.com/photo-1615397349754-cfa2066a298e?q=80&w=1000&auto=format&fit=crop', is_primary: true },
        ],
        reviews: [
          { rating: 5, title: 'Transforms any room', comment: 'Calming and grounding scent profile. Looks like a sculpture on our mantle.' },
        ],
      },
      {
        category: 'Architectural Homeware',
        title: 'Forma Travertine Fluted Pedestal Bowl',
        slug: 'forma-travertine-fluted-pedestal-bowl',
        description: 'Carved from a single block of unpolished Roman travertine stone. The fluted exterior highlights natural porous sedimentary veins and organic mineral tones.',
        brand: 'MIO Maison',
        base_price: 280.00,
        variants: [
          { sku: 'MIO-TRV-BWL-S', size: '20cm Diameter', color: 'Natural Travertine', price: 280.00, stock: 10 },
          { sku: 'MIO-TRV-BWL-L', size: '30cm Diameter', color: 'Natural Travertine', price: 360.00, stock: 6 },
        ],
        images: [
          { url: 'https://images.unsplash.com/photo-1616046229478-9901c5536a45?q=80&w=1000&auto=format&fit=crop', is_primary: true },
          { url: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?q=80&w=1000&auto=format&fit=crop', is_primary: false },
        ],
        reviews: [
          { rating: 5, title: 'Museum quality', comment: 'Extremely heavy, majestic stone centerpiece. Complimented by every guest.' },
        ],
      },
      {
        category: 'Architectural Homeware',
        title: 'Verre Murano Hand-Blown Highball Set',
        slug: 'verre-murano-hand-blown-highball-set',
        description: 'Set of four mouth-blown crystal highball tumblers crafted in Murano, Italy. Optical swirling ribs catch light and evoke tidal ripples.',
        brand: 'MIO Maison',
        base_price: 190.00,
        variants: [
          { sku: 'MIO-MRN-HGB-CLR', size: 'Set of 4 (350ml)', color: 'Clear Optical', price: 190.00, stock: 19 },
          { sku: 'MIO-MRN-HGB-SMK', size: 'Set of 4 (350ml)', color: 'Fumé Amber', price: 210.00, stock: 12 },
        ],
        images: [
          { url: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=1000&auto=format&fit=crop', is_primary: true },
        ],
        reviews: [
          { rating: 5, title: 'Tactile delight', comment: 'The crystal rings with a clear chime and feels weighted in the palm.' },
        ],
      },
    ];

    for (const p of productsData) {
      const catId = catMap[p.category] || null;
      const prodRes = await query<{ id: string }>(
        `INSERT INTO products (category_id, title, slug, description, brand, base_price, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, true)
         RETURNING id`,
        [catId, p.title, p.slug, p.description, p.brand, p.base_price]
      );
      const productId = prodRes.rows[0].id;

      // Variants
      for (const v of p.variants) {
        const vRes = await query<{ id: string }>(
          `INSERT INTO product_variants (product_id, sku, size, color, price, stock_quantity, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, true)
           RETURNING id`,
          [productId, v.sku, v.size, v.color, v.price, v.stock]
        );
        // Log initial stock inventory transaction
        await query(
          `INSERT INTO inventory_transactions (product_variant_id, transaction_type, quantity, note)
           VALUES ($1, 'restock', $2, 'Initial Atelier inbound launch allocation')`,
          [vRes.rows[0].id, v.stock]
        );
      }

      // Images
      let ord = 0;
      for (const img of p.images) {
        await query(
          `INSERT INTO product_images (product_id, image_url, alt_text, display_order, is_primary)
           VALUES ($1, $2, $3, $4, $5)`,
          [productId, img.url, p.title, ord++, img.is_primary]
        );
      }

      // Reviews
      for (const r of p.reviews) {
        await query(
          `INSERT INTO reviews (product_id, rating, title, comment, is_verified_purchase, is_approved)
           VALUES ($1, $2, $3, $4, true, true)`,
          [productId, r.rating, r.title, r.comment]
        );
      }
    }
  }

  // Log system initialization audit
  await query(`
    INSERT INTO admin_audit_logs (action, entity_type, old_data, new_data)
    VALUES ('SYSTEM_SEED', 'STOREFRONT', null, '{"status": "initialized", "brand": "MIO"}');
  `);

  console.log('Seeding completed successfully!');
}
