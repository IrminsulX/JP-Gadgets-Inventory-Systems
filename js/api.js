/* ════════════════════════════════════
   JP APP — API CLIENT
   api.js
   Fetch wrapper for the Express + SQLite backend
════════════════════════════════════ */

const API = (function() {

  const BASE = '';  // same origin

  async function request(method, url, body) {
    const opts = {
      method: method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(BASE + url, opts);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || res.statusText);
    }
    return res.json();
  }

  return {

    // ── Batches ──────────────────────

    /** Get all batches with nested items and repairs */
    getBatches:     ()              => request('GET',    '/api/batches'),

    /** Create a new batch */
    createBatch:    (name, date)    => request('POST',   '/api/batches', { name, date }),

    /** Update batch name and date */
    updateBatch:    (id, name, date) => request('PUT',  '/api/batches/' + id, { name, date }),

    /** Delete a batch (cascades items + repairs) */
    deleteBatch:    (id)            => request('DELETE', '/api/batches/' + id),

    // ── Items ────────────────────────

    /** Add an item to a batch */
    addItem: (batchId, item) => request('POST', '/api/batches/' + batchId + '/items', {
      product:   item.product,
      sku:       item.sku,
      qty:       item.qty || 1,
      price:     item.price || '₱0',
      image_url: item.imageUrl || ''
    }),

    /** Update item fields (qty, price, orig_price, sell_price, image_url, etc.) */
    updateItem: (id, data) => request('PUT', '/api/items/' + id, data),

    /** Delete an item */
    deleteItem: (id) => request('DELETE', '/api/items/' + id),

    // ── Repairs ──────────────────────

    /** Get all repairs for an item */
    getRepairs: (itemId) => request('GET', '/api/items/' + itemId + '/repairs'),

    /** Add a repair record */
    addRepair: (itemId, type, cost) => request('POST', '/api/items/' + itemId + '/repairs', { type, cost }),

    // ── Sales ────────────────────────

    /** Get all sales, optionally filtered by batch_id */
    getSales: (batchId) => {
      var url = '/api/sales';
      if (batchId) url += '?batch_id=' + batchId;
      return request('GET', url);
    },

    /** Create a new sale record */
    createSale: (data) => request('POST', '/api/sales', data),

    /** Update a sale record */
    updateSale: (id, data) => request('PUT', '/api/sales/' + id, data),

    /** Delete a sale */
    deleteSale: (id) => request('DELETE', '/api/sales/' + id),

    /** Get sales summary stats */
    getSalesSummary: () => request('GET', '/api/sales/summary'),

    // ── Expenses ─────────────────────

    /** Get all expense batches with nested expenses */
    getExpenseBatches: () => request('GET', '/api/expense-batches'),

    /** Create a new expense batch */
    createExpenseBatch: (name, date) => request('POST', '/api/expense-batches', { name, date }),

    /** Delete an expense batch */
    deleteExpenseBatch: (id) => request('DELETE', '/api/expense-batches/' + id),

    /** Add an expense to a batch */
    addExpense: (batchId, data) => request('POST', '/api/expense-batches/' + batchId + '/expenses', data)
  };

})();
