/* ════════════════════════════════════
   JP APP — INVENTORY LOGIC
   inventory.js
   Uses API.js → Express + SQLite backend
════════════════════════════════════ */

// ─────────────────────────────────────
// STATE
// ─────────────────────────────────────
const state = {
  selectedBatch:     null,
  editingBatchIndex: null,
  currentItem:       { batchIdx: null, itemIdx: null, id: null },
  batches:           []
};

// ─────────────────────────────────────
// DATA LOADING
// ─────────────────────────────────────

/** Fetch all batches from the server and refresh the UI. */
async function loadBatches() {
  try {
    state.batches = await API.getBatches();
  } catch (e) {
    console.error('Failed to load batches:', e);
    showToast('Could not connect to server');
  }
}

/** Re-render everything after a mutation. */
async function refresh() {
  await loadBatches();
  renderBatches();
  if (state.selectedBatch !== null) {
    showBatchView(state.selectedBatch);
  }
}

// ─────────────────────────────────────
// RENDER BATCH SIDEBAR
// ─────────────────────────────────────

function renderBatches() {
  const sidebar = document.getElementById('batch-sidebar');
  sidebar.innerHTML = '';

  state.batches.forEach(function(batch, i) {
    const btn       = document.createElement('button');
    btn.className   = 'batch-pill' + (state.selectedBatch === i ? ' selected' : '');
    btn.onclick     = function() { selectBatch(i); };

    const label       = document.createElement('span');
    label.className   = 'batch-pill-label';
    label.textContent = batch.name;
    btn.appendChild(label);

    const editIcon       = document.createElement('span');
    editIcon.className   = 'batch-pill-edit';
    editIcon.textContent = '✎';
    editIcon.title       = 'Edit batch';
    editIcon.onclick     = function(e) {
      e.stopPropagation();
      openBatchActions(i, editIcon);
    };
    btn.appendChild(editIcon);

    sidebar.appendChild(btn);
  });

  const addBtn       = document.createElement('button');
  addBtn.className   = 'batch-pill add-btn';
  addBtn.id          = 'add-new-btn';
  addBtn.textContent = 'Add New Batch';
  addBtn.onclick     = showAddBatchModal;
  sidebar.appendChild(addBtn);
}

// ─────────────────────────────────────
// SELECT BATCH
// ─────────────────────────────────────

function selectBatch(i) {
  state.selectedBatch = i;
  renderBatches();
  showBatchView(i);
}

function showBatchView(i) {
  const batch = state.batches[i];
  if (!batch) return;
  document.getElementById('inventory-placeholder').style.display = 'none';
  const view = document.getElementById('batch-view');
  view.classList.add('visible');
  document.getElementById('batch-view-title').textContent =
    batch.name + '  —  ' + batch.date;

  const grid = document.getElementById('batch-items-grid');
  if (!batch.items || batch.items.length === 0) {
    grid.innerHTML = '<div class="items-empty">No items in this batch yet.</div>';
  } else {
    grid.innerHTML = batch.items.map(function(item) {
      var imgSrc = item.image_url || '';
      var imgHtml = imgSrc
        ? '<img src="' + imgSrc + '" alt="' + item.product + '" loading="lazy">'
        : '<div class="item-card-placeholder">📱</div>';
      return '<div class="item-card" onclick="viewItem(' + item.id + ')">'
        + '<div class="item-card-img">' + imgHtml + '</div>'
        + '<div class="item-card-body">'
        + '<div class="item-card-name">' + item.product + '</div>'
        + '<div class="item-card-sku">' + item.sku + '</div>'
        + '</div>'
        + '<div class="item-card-stock">'
        + '<span class="item-card-qty">' + item.qty + '</span>'
        + '<span class="item-card-label">in stock</span>'
        + '</div>'
        + '</div>';
    }).join('');
  }
}

// ─────────────────────────────────────
// ADD BATCH MODAL
// ─────────────────────────────────────

function showAddBatchModal() {
  document.getElementById('batch-name-input').value = '';
  document.getElementById('batch-date-input').value = '';
  document.getElementById('modal-add-batch').classList.add('show');
  document.getElementById('modal-overlay').classList.add('show');
  setTimeout(function() {
    document.getElementById('batch-name-input').focus();
  }, 100);
}

async function saveBatch() {
  const name = document.getElementById('batch-name-input').value.trim();
  const date = document.getElementById('batch-date-input').value;
  if (!name) { showToast('Please enter a batch name'); return; }
  if (!date) { showToast('Please select a date');      return; }

  try {
    await API.createBatch(name, date);
  } catch (e) { showToast('Server error: ' + e.message); return; }

  state.selectedBatch = null;
  document.getElementById('batch-name-input').value = '';
  document.getElementById('batch-date-input').value = '';

  closeModal();
  await loadBatches();
  renderBatches();
  document.getElementById('inventory-placeholder').style.display = 'flex';
  document.getElementById('batch-view').classList.remove('visible');
  showToast('Batch "' + name + '" saved! ✓');
}

// ─────────────────────────────────────
// BATCH ACTIONS — Edit / Add Unit / Delete
// ─────────────────────────────────────

function openBatchActions(i, anchor) {
  const dropdown = document.getElementById('batch-actions-dropdown');
  if (dropdown.classList.contains('show') && state.editingBatchIndex === i) {
    hideBatchActions();
    return;
  }
  state.editingBatchIndex = i;
  dropdown.classList.add('show');
}

function hideBatchActions() {
  document.getElementById('batch-actions-dropdown').classList.remove('show');
}

function showEditBatchModal() {
  hideBatchActions();
  const batch = state.batches[state.editingBatchIndex];
  document.getElementById('edit-batch-name').value = batch.name;
  document.getElementById('edit-batch-date').value = batch.date;
  document.getElementById('modal-edit-batch').classList.add('show');
  document.getElementById('modal-overlay').classList.add('show');
}

function showAddUnitModal() {
  hideBatchActions();
  document.getElementById('unit-type').value       = '';
  document.getElementById('unit-gb').value         = '';
  document.getElementById('unit-image-url').value   = '';
  document.getElementById('modal-add-unit').classList.add('show');
  document.getElementById('modal-overlay').classList.add('show');
}

function showDeleteBatchModal() {
  hideBatchActions();
  document.getElementById('modal-delete-batch').classList.add('show');
  document.getElementById('modal-overlay').classList.add('show');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('show');
  document.getElementById('modal-add-batch').classList.remove('show');
  document.getElementById('modal-edit-batch').classList.remove('show');
  document.getElementById('modal-add-unit').classList.remove('show');
  document.getElementById('modal-delete-batch').classList.remove('show');
  document.getElementById('modal-item-detail').classList.remove('show');
  hideBatchActions();
}

async function saveEditBatch() {
  const name = document.getElementById('edit-batch-name').value.trim();
  const date = document.getElementById('edit-batch-date').value;
  if (!name) { showToast('Please enter a batch name'); return; }
  if (!date) { showToast('Please select a date');      return; }

  const batch = state.batches[state.editingBatchIndex];
  try {
    await API.updateBatch(batch.id, name, date);
  } catch (e) { showToast('Server error'); return; }

  closeModal();
  await refresh();
  showToast('Batch updated! ✓');
}

async function saveAddUnit() {
  const type      = document.getElementById('unit-type').value.trim();
  const gb        = document.getElementById('unit-gb').value;
  const imageUrl  = document.getElementById('unit-image-url').value.trim();
  if (!type) { showToast('Please enter a unit type'); return; }
  if (!gb)   { showToast('Please choose a gigabyte option'); return; }

  const batch    = state.batches[state.editingBatchIndex];
  const sku      = type.replace(/\s+/g, '').toUpperCase().slice(0, 6) + '-' + gb;
  const newItem  = {
    product:  type + ' ' + gb,
    sku:      sku,
    qty:      1,
    price:    '₱0',
    imageUrl: imageUrl
  };

  try {
    await API.addItem(batch.id, newItem);
  } catch (e) { showToast('Server error'); return; }

  closeModal();
  await refresh();
  showToast('Unit "' + newItem.product + '" added! ✓');
}

async function deleteBatch() {
  const batch = state.batches[state.editingBatchIndex];
  const name  = batch.name;

  try {
    await API.deleteBatch(batch.id);
  } catch (e) { showToast('Server error'); return; }

  if (state.selectedBatch === state.editingBatchIndex) {
    state.selectedBatch = null;
    document.getElementById('inventory-placeholder').style.display = 'flex';
    document.getElementById('batch-view').classList.remove('visible');
  } else if (state.selectedBatch > state.editingBatchIndex) {
    state.selectedBatch--;
  }

  closeModal();
  await loadBatches();
  renderBatches();
  showToast('Batch "' + name + '" deleted. ✓');
}

// ─────────────────────────────────────
// ITEM DETAIL MODAL
// ─────────────────────────────────────

/**
 * Open the item detail modal for the given item ID.
 * @param {number} id — database item id
 */
function viewItem(id) {
  // Find the item across all batches
  for (var b = 0; b < state.batches.length; b++) {
    var items = state.batches[b].items || [];
    for (var j = 0; j < items.length; j++) {
      if (items[j].id === id) {
        state.currentItem = { batchIdx: b, itemIdx: j, id: id };
        var item = items[j];

        document.getElementById('item-detail-title').textContent = item.product;
        document.getElementById('item-orig-price').value = item.orig_price || '';
        document.getElementById('item-sell-price').value = item.sell_price || '';
        document.getElementById('item-stock-num').value = item.qty;
        document.getElementById('item-delete-msg').textContent =
          'Are you sure you want to delete "' + item.product + '"?';

        renderRepairs();
        switchItemTab('price');

        document.getElementById('modal-item-detail').classList.add('show');
        document.getElementById('modal-overlay').classList.add('show');
        return;
      }
    }
  }
  showToast('Item not found');
}

function closeItemModal() {
  document.getElementById('modal-item-detail').classList.remove('show');
  document.getElementById('modal-overlay').classList.remove('show');
  state.currentItem = { batchIdx: null, itemIdx: null, id: null };
  if (state.selectedBatch !== null) {
    showBatchView(state.selectedBatch);
  }
}

function switchItemTab(tab) {
  document.querySelectorAll('.item-tab').forEach(function(t) { t.classList.remove('active'); });
  document.querySelectorAll('.item-panel').forEach(function(p) { p.classList.remove('active'); });
  var tabBtn = document.querySelector('.item-tab[onclick*="' + tab + '"]');
  if (tabBtn) tabBtn.classList.add('active');
  var panel = document.getElementById('item-panel-' + tab);
  if (panel) panel.classList.add('active');
}

async function saveItemPricing() {
  var ci = state.currentItem;
  if (ci.id === null) return;

  var orig = document.getElementById('item-orig-price').value.trim();
  var sell = document.getElementById('item-sell-price').value.trim();

  try {
    await API.updateItem(ci.id, { orig_price: orig, sell_price: sell, price: sell || '₱0' });
  } catch (e) { showToast('Server error'); return; }

  await refresh();
  showToast('Pricing saved! ✓');
}

async function saveItemStock() {
  var ci = state.currentItem;
  if (ci.id === null) return;

  var qty = parseInt(document.getElementById('item-stock-num').value, 10);
  if (isNaN(qty) || qty < 0) { showToast('Please enter a valid stock number'); return; }

  try {
    await API.updateItem(ci.id, { qty: qty });
  } catch (e) { showToast('Server error'); return; }

  await refresh();
  showToast('Stock updated to ' + qty + '! ✓');
}

function renderRepairs() {
  var ci = state.currentItem;
  var tbody = document.getElementById('repair-tbody');
  if (ci.batchIdx === null || ci.itemIdx === null) { tbody.innerHTML = ''; return; }

  var item = state.batches[ci.batchIdx].items[ci.itemIdx];
  var repairs = item.repairs || [];

  if (repairs.length === 0) {
    tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;color:var(--muted);padding:16px">No repair records yet.</td></tr>';
  } else {
    tbody.innerHTML = repairs.map(function(r, idx) {
      return '<tr>'
        + '<td>' + (idx + 1) + '</td>'
        + '<td>' + r.type + '</td>'
        + '<td>' + r.cost + '</td>'
        + '</tr>';
    }).join('');
  }
}

async function createRepair() {
  var ci = state.currentItem;
  if (ci.id === null) return;

  var type = prompt('Enter Type of Repair:');
  if (!type || !type.trim()) return;
  var cost = prompt('Enter Repair Cost:');
  if (!cost || !cost.trim()) return;

  try {
    await API.addRepair(ci.id, type.trim(), cost.trim());
  } catch (e) { showToast('Server error'); return; }

  await refresh();
  renderRepairs();
  showToast('Repair record added! ✓');
}

async function confirmDeleteItem() {
  var ci = state.currentItem;
  if (ci.id === null) return;

  var bIdx = ci.batchIdx;
  var item = state.batches[bIdx].items[ci.itemIdx];
  var name = item.product;

  try {
    await API.deleteItem(ci.id);
  } catch (e) { showToast('Server error'); return; }

  closeItemModal();
  await refresh();
  showToast('"' + name + '" deleted. ✓');
}

// ─────────────────────────────────────
// INIT
// ─────────────────────────────────────
(async function init() {
  initNav();
  await loadBatches();
  renderBatches();
  document.getElementById('inventory-placeholder').style.display = 'flex';
})();
