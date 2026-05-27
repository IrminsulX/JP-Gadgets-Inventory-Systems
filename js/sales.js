/* ════════════════════════════════════
   JP APP — SALES LOGIC
   sales.js
   Uses API.js → Express + SQLite backend
════════════════════════════════════ */

const salesState = {
  selectedBatch: null,
  batches:       [],
  sales:         []
};

// ─────────────────────────────────────
// DATA LOADING
// ─────────────────────────────────────

async function loadSalesBatches() {
  try {
    salesState.batches = await API.getBatches();
  } catch (e) {
    console.error(e);
    showToast('Could not connect to server');
  }
}

async function loadSales(batchId) {
  try {
    salesState.sales = await API.getSales(batchId);
  } catch (e) {
    console.error(e);
  }
}

async function refreshSales() {
  await loadSalesBatches();
  renderSalesBatches();
  if (salesState.selectedBatch !== null) {
    await loadSales(salesState.batches[salesState.selectedBatch].id);
    renderSalesList();
  }
}

// ─────────────────────────────────────
// RENDER BATCH SIDEBAR
// ─────────────────────────────────────

function renderSalesBatches() {
  var sidebar = document.getElementById('sales-batch-sidebar');
  sidebar.innerHTML = '';

  salesState.batches.forEach(function(batch, i) {
    var btn = document.createElement('button');
    btn.className = 'batch-pill' + (salesState.selectedBatch === i ? ' selected' : '');
    btn.onclick = function() { selectSalesBatch(i); };

    var label = document.createElement('span');
    label.className = 'batch-pill-label';
    label.textContent = batch.name;
    btn.appendChild(label);

    var plusIcon = document.createElement('span');
    plusIcon.className = 'batch-pill-plus';
    plusIcon.textContent = '+';
    plusIcon.title = 'Add sale to this batch';
    plusIcon.onclick = function(e) {
      e.stopPropagation();
      openAddSaleModal(i);
    };
    btn.appendChild(plusIcon);

    sidebar.appendChild(btn);
  });
}

// ─────────────────────────────────────
// SELECT BATCH
// ─────────────────────────────────────

async function selectSalesBatch(i) {
  salesState.selectedBatch = i;
  renderSalesBatches();

  var batch = salesState.batches[i];
  document.getElementById('sales-placeholder').style.display = 'none';
  document.getElementById('sales-overview').style.display = 'block';
  document.getElementById('sales-overview-title').textContent = 'SALES OVERVIEW (' + batch.name + ')';

  await loadSales(batch.id);
  renderSalesList();
}

// ─────────────────────────────────────
// RENDER SALES TABLE
// ─────────────────────────────────────

function renderSalesList() {
  var tbody = document.getElementById('sales-tbody');
  var batch = salesState.batches[salesState.selectedBatch];
  var items = batch ? (batch.items || []) : [];

  // Helper: find stock for a unit
  function getStock(unit) {
    for (var k = 0; k < items.length; k++) {
      if (items[k].product === unit) return items[k].qty;
    }
    return '—';
  }

  // Calculate total
  var total = 0;
  salesState.sales.forEach(function(s) {
    var price = parseFloat(s.sell_price.replace(/[^0-9.]/g, '')) || 0;
    total += price * s.quantity;
  });
  document.getElementById('sales-total').textContent = 'Total Sales (Calculated): ₱' + total.toLocaleString();

  if (salesState.sales.length === 0) {
    tbody.innerHTML = '<tr><td colspan="13" style="text-align:center;color:var(--muted);padding:24px;font-style:italic">No sales recorded for this batch yet.</td></tr>';
    return;
  }

  tbody.innerHTML = salesState.sales.map(function(s) {
    var encashedCell = s.encashed
      ? '<span style="color:#27ae60;font-weight:600">✓</span>'
      : '<span style="color:#e67e22;font-weight:600">✗</span>';
    var dateStr = s.sale_date ? s.sale_date.split(' ')[0] : '—';
    return '<tr>'
      + '<td>' + s.unit + '</td>'
      + '<td>' + (s.gb || '—') + '</td>'
      + '<td>' + s.quantity + '</td>'
      + '<td>' + (s.customer_name || '—') + '</td>'
      + '<td>' + (s.payment_mode || '—') + '</td>'
      + '<td>' + (s.delivery_mode || '—') + '</td>'
      + '<td>' + (s.sold_by || '—') + '</td>'
      + '<td>' + (s.receipt_number || '—') + '</td>'
      + '<td>' + s.sell_price + '</td>'
      + '<td>' + encashedCell + '</td>'
      + '<td>' + getStock(s.unit) + '</td>'
      + '<td style="font-size:11px">' + dateStr + '</td>'
      + '<td><span class="sale-edit-icon" onclick="openEditSaleModal(' + s.id + ')" title="Edit sale">✎</span></td>'
      + '</tr>';
  }).join('');
}

// ─────────────────────────────────────
// ADD SALE MODAL
// ─────────────────────────────────────

var currentSaleBatchIdx = null;

function openAddSaleModal(batchIdx) {
  currentSaleBatchIdx = batchIdx;
  var batch = salesState.batches[batchIdx];

  var unitSelect = document.getElementById('sale-unit');
  unitSelect.innerHTML = '<option value="">Select Unit From Stock</option>';
  (batch.items || []).forEach(function(item) {
    unitSelect.innerHTML += '<option value="' + item.product + '" data-price="' + (item.sell_price || item.price || '₱0') + '">' + item.product + '</option>';
  });

  document.getElementById('sale-gb').value = '';
  document.getElementById('sale-soldby').value = '';
  document.getElementById('sale-qty').value = '1';
  document.getElementById('sale-payment').value = '';
  document.getElementById('sale-delivery').value = '';
  document.getElementById('sale-customer').value = '';
  document.getElementById('sale-receipt').value = '';
  document.getElementById('sale-encashed').checked = false;
  toggleReceiptField();

  document.getElementById('modal-add-sale').classList.add('show');
  document.getElementById('modal-overlay').classList.add('show');
}

function toggleReceiptField() {
  var del = document.getElementById('sale-delivery').value;
  document.getElementById('receipt-group').style.display = (del === 'LBC') ? 'block' : 'none';
}

function closeSaleModal() {
  document.getElementById('modal-add-sale').classList.remove('show');
  document.getElementById('modal-overlay').classList.remove('show');
  currentSaleBatchIdx = null;
}

async function saveSale() {
  var unit    = document.getElementById('sale-unit').value;
  var opt     = document.getElementById('sale-unit').selectedOptions[0];
  var price   = opt ? opt.getAttribute('data-price') : '₱0';
  var gb      = document.getElementById('sale-gb').value;
  var soldBy  = document.getElementById('sale-soldby').value;
  var qty     = parseInt(document.getElementById('sale-qty').value, 10) || 1;
  var payment = document.getElementById('sale-payment').value;
  var deliver = document.getElementById('sale-delivery').value;
  var cust    = document.getElementById('sale-customer').value.trim();
  var receipt = document.getElementById('sale-receipt').value.trim();
  var encashed = document.getElementById('sale-encashed').checked ? 1 : 0;

  if (!unit)    { showToast('Please select a unit'); return; }
  if (!soldBy)  { showToast('Please select who sold it'); return; }
  if (!payment) { showToast('Please select payment mode'); return; }
  if (!deliver) { showToast('Please select delivery mode'); return; }
  if (!cust)    { showToast('Please enter customer name'); return; }

  var batch = salesState.batches[currentSaleBatchIdx];

  try {
    await API.createSale({
      batch_id:       batch.id,
      unit:           unit,
      gb:             gb,
      sold_by:        soldBy,
      quantity:       qty,
      sell_price:     price,
      payment_mode:   payment,
      delivery_mode:  deliver,
      customer_name:  cust,
      receipt_number: receipt,
      encashed:       encashed
    });
  } catch (e) { console.error(e); showToast('Error: ' + e.message); return; }

  closeSaleModal();
  await loadSales(batch.id);
  renderSalesList();
  showToast('Sale recorded! ✓');
}

// ─────────────────────────────────────
// EDIT SALE MODAL
// ─────────────────────────────────────

function openEditSaleModal(saleId) {
  // Find the sale in state
  var sale = null;
  for (var i = 0; i < salesState.sales.length; i++) {
    if (salesState.sales[i].id === saleId) { sale = salesState.sales[i]; break; }
  }
  if (!sale) return;

  document.getElementById('edit-sale-id').value = sale.id;
  document.getElementById('edit-sale-payment').value = sale.payment_mode || '';
  document.getElementById('edit-sale-delivery').value = sale.delivery_mode || '';
  document.getElementById('edit-sale-qty').value = sale.quantity;
  document.getElementById('edit-sale-receipt').value = sale.receipt_number || '';
  document.getElementById('edit-sale-encashed').checked = !!sale.encashed;

  document.getElementById('modal-edit-sale').classList.add('show');
  document.getElementById('modal-overlay').classList.add('show');
}

function closeEditSaleModal() {
  document.getElementById('modal-edit-sale').classList.remove('show');
  document.getElementById('modal-overlay').classList.remove('show');
}

async function saveEditSale() {
  var id       = document.getElementById('edit-sale-id').value;
  var payment  = document.getElementById('edit-sale-payment').value;
  var delivery = document.getElementById('edit-sale-delivery').value;
  var qty      = parseInt(document.getElementById('edit-sale-qty').value, 10) || 1;
  var receipt  = document.getElementById('edit-sale-receipt').value.trim();
  var encashed = document.getElementById('edit-sale-encashed').checked ? 1 : 0;

  try {
    await API.updateSale(id, {
      payment_mode:  payment,
      delivery_mode: delivery,
      quantity:      qty,
      receipt_number: receipt,
      encashed:      encashed
    });
  } catch (e) { console.error(e); showToast('Error: ' + e.message); return; }

  closeEditSaleModal();
  var batch = salesState.batches[salesState.selectedBatch];
  await loadSales(batch.id);
  renderSalesList();
  showToast('Sale updated! ✓');
}

// ─────────────────────────────────────
// INIT
// ─────────────────────────────────────
(async function init() {
  initNav();
  await loadSalesBatches();
  renderSalesBatches();
})();
