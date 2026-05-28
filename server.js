/* ════════════════════════════════════
   JP IMS — SERVER
   server.js
   Express + better-sqlite3 + REST API
════════════════════════════════════ */

const express  = require('express');
const Database = require('better-sqlite3');
const path     = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ───────────────────────
app.use(express.json());
app.use(express.static(__dirname));   // serve all static files from root

// ── Database ─────────────────────────
const db = new Database('jp_ims.db');
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ── Schema ───────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS batches (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT    NOT NULL,
    date       TEXT    NOT NULL,
    created_at TEXT    DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS items (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    batch_id   INTEGER NOT NULL,
    product    TEXT    NOT NULL,
    sku        TEXT    NOT NULL,
    qty        INTEGER DEFAULT 0,
    price      TEXT    DEFAULT '₱0',
    image_url  TEXT    DEFAULT '',
    orig_price TEXT    DEFAULT '',
    sell_price TEXT    DEFAULT '',
    FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS repairs (
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id INTEGER NOT NULL,
    type    TEXT    NOT NULL,
    cost    TEXT    NOT NULL,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS sales (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    batch_id        INTEGER,
    unit            TEXT    NOT NULL,
    gb              TEXT    DEFAULT '',
    sold_by         TEXT    DEFAULT '',
    quantity        INTEGER DEFAULT 1,
    sell_price      TEXT    DEFAULT '₱0',
    payment_mode    TEXT    DEFAULT '',
    delivery_mode   TEXT    DEFAULT '',
    customer_name   TEXT    DEFAULT '',
    receipt_number  TEXT    DEFAULT '',
    encashed        INTEGER DEFAULT 0,
    sale_date       TEXT    DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE SET NULL
  );
`);

// ── Seed data (only if empty) ────────
const batchCount = db.prepare('SELECT COUNT(*) AS c FROM batches').get().c;
if (batchCount === 0) {
  const insertBatch = db.prepare('INSERT INTO batches (name, date) VALUES (?, ?)');
  const insertItem  = db.prepare('INSERT INTO items (batch_id, product, sku, qty, price) VALUES (?, ?, ?, ?, ?)');

  const b1 = insertBatch.run('March Batch 01', '2025-03-01');
  insertItem.run(b1.lastInsertRowid, 'iPhone 15 Pro Max', 'IP15PM', 15, '₱3,100');
  insertItem.run(b1.lastInsertRowid, 'iPhone 15 Pro',     'IP15P',  20, '₱2,800');

  const b2 = insertBatch.run('March Batch 02', '2025-03-15');
  insertItem.run(b2.lastInsertRowid, 'iPhone 15',      'IP15', 18, '₱2,100');
  insertItem.run(b2.lastInsertRowid, 'Apple Watch S9', 'AWS9', 10, '₱1,200');

  console.log('Seeded default batches + items.');
}

// ════════════════════════════════════
//  API ROUTES  —  /api/...
// ════════════════════════════════════

// ── GET all batches with items & repairs ──
app.get('/api/batches', (_req, res) => {
  const batches = db.prepare('SELECT * FROM batches ORDER BY id').all();
  for (const b of batches) {
    b.items = db.prepare('SELECT * FROM items WHERE batch_id = ? ORDER BY id').all(b.id);
    for (const item of b.items) {
      item.repairs = db.prepare('SELECT * FROM repairs WHERE item_id = ? ORDER BY id').all(item.id);
    }
  }
  res.json(batches);
});

// ── POST create batch ──
app.post('/api/batches', (req, res) => {
  const { name, date } = req.body;
  if (!name || !date) return res.status(400).json({ error: 'name and date required' });
  const result = db.prepare('INSERT INTO batches (name, date) VALUES (?, ?)').run(name, date);
  res.json({ id: result.lastInsertRowid, name, date, items: [] });
});

// ── PUT update batch ──
app.put('/api/batches/:id', (req, res) => {
  const { name, date } = req.body;
  if (!name || !date) return res.status(400).json({ error: 'name and date required' });
  db.prepare('UPDATE batches SET name = ?, date = ? WHERE id = ?').run(name, date, req.params.id);
  res.json({ ok: true });
});

// ── DELETE batch ──
app.delete('/api/batches/:id', (req, res) => {
  db.prepare('DELETE FROM batches WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ── POST add item to batch ──
app.post('/api/batches/:id/items', (req, res) => {
  const { product, sku, qty, price, image_url } = req.body;
  if (!product || !sku) return res.status(400).json({ error: 'product and sku required' });
  const result = db.prepare(
    'INSERT INTO items (batch_id, product, sku, qty, price, image_url) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(req.params.id, product, sku, qty || 1, price || '₱0', image_url || '');
  res.json({ id: result.lastInsertRowid, product, sku, qty: qty || 1, price: price || '₱0', image_url: image_url || '', orig_price: '', sell_price: '', repairs: [] });
});

// ── PUT update item (partial — only updates fields that are sent) ──
app.put('/api/items/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM items WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'item not found' });

  const allowed = ['product', 'sku', 'qty', 'price', 'image_url', 'orig_price', 'sell_price'];
  const sets = [];
  const vals = [];
  allowed.forEach(function(f) {
    if (req.body[f] !== undefined) {
      sets.push(f + ' = ?');
      vals.push(req.body[f]);
    }
  });
  if (sets.length === 0) return res.json({ ok: true });
  vals.push(req.params.id);
  db.prepare('UPDATE items SET ' + sets.join(', ') + ' WHERE id = ?').run(...vals);
  res.json({ ok: true });
});

// ── DELETE item ──
app.delete('/api/items/:id', (req, res) => {
  db.prepare('DELETE FROM items WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ── GET repairs for an item ──
app.get('/api/items/:id/repairs', (req, res) => {
  const repairs = db.prepare('SELECT * FROM repairs WHERE item_id = ? ORDER BY id').all(req.params.id);
  res.json(repairs);
});

// ── POST add repair ──
app.post('/api/items/:id/repairs', (req, res) => {
  const { type, cost } = req.body;
  if (!type || !cost) return res.status(400).json({ error: 'type and cost required' });
  const result = db.prepare('INSERT INTO repairs (item_id, type, cost) VALUES (?, ?, ?)').run(req.params.id, type, cost);
  res.json({ id: result.lastInsertRowid, type, cost });
});

// ════════════════════════════════════
//  SALES ROUTES
// ════════════════════════════════════

// ── GET all sales (optionally filter by batch_id) ──
app.get('/api/sales', (req, res) => {
  const { batch_id } = req.query;
  let sales;
  if (batch_id) {
    sales = db.prepare('SELECT * FROM sales WHERE batch_id = ? ORDER BY id DESC').all(batch_id);
  } else {
    sales = db.prepare('SELECT * FROM sales ORDER BY id DESC').all();
  }
  res.json(sales);
});

// ── POST create sale ──
app.post('/api/sales', (req, res) => {
  try {
    const { batch_id, unit, gb, sold_by, quantity, sell_price, payment_mode, delivery_mode, customer_name, receipt_number, encashed } = req.body;
    if (!unit) return res.status(400).json({ error: 'unit required' });
    const result = db.prepare(
      'INSERT INTO sales (batch_id, unit, gb, sold_by, quantity, sell_price, payment_mode, delivery_mode, customer_name, receipt_number, encashed) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(batch_id || null, unit, gb || '', sold_by || '', quantity || 1, sell_price || '₱0', payment_mode || '', delivery_mode || '', customer_name || '', receipt_number || '', encashed ? 1 : 0);
    const sale = db.prepare('SELECT * FROM sales WHERE id = ?').get(result.lastInsertRowid);
    res.json(sale);
  } catch (e) {
    console.error('POST /api/sales error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── PUT update sale ──
app.put('/api/sales/:id', (req, res) => {
  const { sold_by, quantity, payment_mode, delivery_mode, customer_name, receipt_number, encashed } = req.body;
  db.prepare(
    'UPDATE sales SET sold_by=?, quantity=?, payment_mode=?, delivery_mode=?, customer_name=?, receipt_number=?, encashed=? WHERE id=?'
  ).run(sold_by || '', quantity || 1, payment_mode || '', delivery_mode || '', customer_name || '', receipt_number || '', encashed ? 1 : 0, req.params.id);
  res.json({ ok: true });
});

// ── DELETE sale ──
app.delete('/api/sales/:id', (req, res) => {
  db.prepare('DELETE FROM sales WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ── GET sales summary stats ──
app.get('/api/sales/summary', (_req, res) => {
  const total = db.prepare("SELECT SUM(quantity) AS units, COUNT(*) AS transactions FROM sales").get();
  const top = db.prepare("SELECT unit, SUM(quantity) AS qty FROM sales GROUP BY unit ORDER BY qty DESC LIMIT 1").get();
  res.json({
    totalUnits: total.units || 0,
    transactions: total.transactions || 0,
    topProduct: top ? top.unit : '—',
    topQty: top ? top.qty : 0
  });
});

// ── Fallback: SPA routing ────────────
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

// ── Start ────────────────────────────
app.listen(PORT, () => {
  console.log('JP IMS server running at http://localhost:' + PORT);
  console.log('Database: jp_ims.db');
});
