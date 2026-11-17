-- D1 Schema for insta-store (Cloudflare SQLite)

CREATE TABLE IF NOT EXISTS store_config (
	id INTEGER PRIMARY KEY CHECK (id = 1),
	store_name TEXT NOT NULL,
	tagline TEXT NOT NULL,
	logo_url TEXT,
	preset_id TEXT NOT NULL DEFAULT 'flagship_editorial',
	custom_accent TEXT,
	custom_btn_bg TEXT,
	custom_btn_text TEXT,
	radius_preset TEXT NOT NULL DEFAULT 'sharp',
	language_mode TEXT NOT NULL DEFAULT 'both',
	default_lang TEXT NOT NULL DEFAULT 'ar',
	currency TEXT NOT NULL DEFAULT 'ج.م',
	announcement_text TEXT,
	hero_title TEXT NOT NULL,
	hero_subtitle TEXT NOT NULL,
	hero_cta_label TEXT NOT NULL,
	hero_cta_href TEXT NOT NULL DEFAULT '/shop',
	hero_poster_url TEXT NOT NULL,
	hero_video_url TEXT,
	whatsapp_number TEXT,
	instagram_url TEXT,
	default_size_guide TEXT,
	global_free_shipping_threshold INTEGER,
	meta_pixel_id TEXT,
	tiktok_pixel_id TEXT,
	homepage_sections_json TEXT NOT NULL DEFAULT '{}',
	updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS collections (
	id TEXT PRIMARY KEY,
	name TEXT NOT NULL,
	slug TEXT NOT NULL UNIQUE,
	image_url TEXT NOT NULL,
	sort_order INTEGER NOT NULL DEFAULT 0,
	is_visible INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS products (
	id TEXT PRIMARY KEY,
	title TEXT NOT NULL,
	slug TEXT NOT NULL UNIQUE,
	description TEXT NOT NULL,
	fabric_care TEXT,
	size_guide TEXT,
	base_price INTEGER NOT NULL,
	compare_at_price INTEGER,
	collection_id TEXT NOT NULL,
	images_json TEXT NOT NULL DEFAULT '[]',
	status TEXT NOT NULL DEFAULT 'hidden' CHECK (status IN ('published', 'hidden')),
	is_featured INTEGER NOT NULL DEFAULT 0,
	was_ever_published INTEGER NOT NULL DEFAULT 0,
	deleted_at TEXT,
	created_at TEXT NOT NULL,
	FOREIGN KEY (collection_id) REFERENCES collections(id)
);

CREATE INDEX IF NOT EXISTS idx_products_status_deleted ON products(status, deleted_at);
CREATE INDEX IF NOT EXISTS idx_products_collection ON products(collection_id);

CREATE TABLE IF NOT EXISTS variants (
	id TEXT PRIMARY KEY,
	product_id TEXT NOT NULL,
	size TEXT NOT NULL,
	color_name TEXT NOT NULL,
	color_hex TEXT NOT NULL,
	stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
	price_override INTEGER,
	FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_variants_product ON variants(product_id);

CREATE TABLE IF NOT EXISTS media_assets (
	id TEXT PRIMARY KEY,
	public_id TEXT NOT NULL UNIQUE,
	secure_url TEXT NOT NULL,
	resource_type TEXT NOT NULL CHECK (resource_type IN ('image', 'video')),
	bytes INTEGER NOT NULL DEFAULT 0,
	owner_ref TEXT,
	created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS shipping_zones (
	id TEXT PRIMARY KEY,
	name TEXT NOT NULL UNIQUE,
	fee INTEGER NOT NULL CHECK (fee >= 0),
	free_shipping_threshold INTEGER,
	is_active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS coupons (
	id TEXT PRIMARY KEY,
	code TEXT NOT NULL UNIQUE,
	type TEXT NOT NULL CHECK (type IN ('percentage', 'fixed')),
	value INTEGER NOT NULL CHECK (value > 0),
	min_subtotal INTEGER,
	max_uses INTEGER,
	used_count INTEGER NOT NULL DEFAULT 0,
	expires_at TEXT,
	is_active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS orders (
	id TEXT PRIMARY KEY,
	order_code TEXT NOT NULL UNIQUE,
	customer_name TEXT NOT NULL,
	customer_phone TEXT NOT NULL,
	shipping_zone_id TEXT NOT NULL,
	shipping_zone_name TEXT NOT NULL,
	address TEXT NOT NULL,
	notes TEXT,
	items_json TEXT NOT NULL,
	subtotal INTEGER NOT NULL,
	coupon_code TEXT,
	discount_amount INTEGER NOT NULL DEFAULT 0,
	shipping_fee INTEGER NOT NULL DEFAULT 0,
	total_amount INTEGER NOT NULL,
	status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'confirmed', 'shipped', 'delivered', 'cancelled')),
	stock_state TEXT NOT NULL DEFAULT 'reserved' CHECK (stock_state IN ('reserved', 'released')),
	idempotency_key TEXT NOT NULL UNIQUE,
	created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_orders_status_created ON orders(status, created_at DESC);

CREATE TABLE IF NOT EXISTS admin_users (
	id TEXT PRIMARY KEY,
	email TEXT NOT NULL UNIQUE,
	password_hash TEXT NOT NULL,
	session_version INTEGER NOT NULL DEFAULT 1,
	must_change_password INTEGER NOT NULL DEFAULT 0,
	failed_attempts INTEGER NOT NULL DEFAULT 0,
	locked_until TEXT,
	created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS rate_limits (
	key TEXT PRIMARY KEY,
	hits INTEGER NOT NULL DEFAULT 0,
	window_start_ms INTEGER NOT NULL
);
