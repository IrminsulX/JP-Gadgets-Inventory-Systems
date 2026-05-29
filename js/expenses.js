/* ════════════════════════════════════
   JP APP — EXPENSES LOGIC
   expenses.js
   Uses API.js → Express + SQLite backend
════════════════════════════════════ */

// ─────────────────────────────────────
// STATE
// ─────────────────────────────────────

const expenseState = {
  selectedBatch: null,
  editingBatchIndex: null,
  batches: []
};

// Ordered category list used for summaries
const ALL_CATEGORIES = [
  'Office Supplies',
  'Shipping Fees',
  'Utilities (Internet/Electricity)',
  'Food/Meals',
  'Transportation',
  'Marketing/Ads',
  'Employee Salary',
  'Other'
];

// ─────────────────────────────────────
// DATA LOADING
// ─────────────────────────────────────

async function loadBatches() {
  try {
    expenseState.batches = await API.getExpenseBatches();
  } catch (e) {
    console.error('Failed to load expense batches:', e);
    showToast('Could not connect to server');
  }
}

async function refresh() {
  await loadBatches();
  renderExpenseBatches();
  if (expenseState.selectedBatch !== null) {
    showExpenseBatchView(expenseState.selectedBatch);
  }
}

// ─────────────────────────────────────
// RENDER EXPENSE BATCH SIDEBAR
// ─────────────────────────────────────

function renderExpenseBatches() {
  const sidebar = document.getElementById('expense-batch-sidebar');
  if (!sidebar) return;
  sidebar.innerHTML = '';

  expenseState.batches.forEach(function(batch, i) {
    const btn       = document.createElement('button');
    btn.className   = 'batch-pill' + (expenseState.selectedBatch === i ? ' selected' : '');
    btn.onclick     = function() { selectExpenseBatch(i); };

    const label       = document.createElement('span');
    label.className   = 'batch-pill-label';
    label.textContent = batch.name;
    btn.appendChild(label);

    const editIcon       = document.createElement('span');
    editIcon.className   = 'batch-pill-edit';
    editIcon.textContent = '\u270E';
    editIcon.title       = 'Add expenses to this batch';
    editIcon.onclick     = function(e) {
      e.stopPropagation();
      openAddExpenseModal(i);
    };
    btn.appendChild(editIcon);

    sidebar.appendChild(btn);
  });

  const addBtn       = document.createElement('button');
  addBtn.className   = 'batch-pill add-btn';
  addBtn.textContent = 'Add Expense Batch';
  addBtn.onclick     = openAddBatchModal;
  sidebar.appendChild(addBtn);
}

// ─────────────────────────────────────
// SELECT EXPENSE BATCH
// ─────────────────────────────────────

function selectExpenseBatch(i) {
  expenseState.selectedBatch = i;
  renderExpenseBatches();
  showExpenseBatchView(i);
}

function showExpenseBatchView(i) {
  const batch = expenseState.batches[i];
  if (!batch) return;

  document.getElementById('expense-placeholder').style.display = 'none';
  const view = document.getElementById('expense-batch-view');
  view.classList.add('visible');
  document.getElementById('expense-batch-view-title').textContent =
    'Details for: ' + batch.name;

  const catTotals = {};
  ALL_CATEGORIES.forEach(function(cat) { catTotals[cat] = 0; });
  var grandTotal = 0;

  (batch.expenses || []).forEach(function(exp) {
    var cat = exp.category;
    if (catTotals.hasOwnProperty(cat)) {
      catTotals[cat] += exp.amount;
    } else {
      catTotals['Other'] += exp.amount;
    }
    grandTotal += exp.amount;
  });

  var html = '';
  ALL_CATEGORIES.forEach(function(cat) {
    var total = catTotals[cat];
    html += '<div class="summary-row">'
      + '<span class="summary-cat">' + escapeHTML(cat) + '</span>'
      + '<span class="summary-amount">\u20B1' + formatNumber(total) + '</span>'
      + '<button class="summary-dots" onclick="openCategoryDetail(\'' + escapeHTML(cat) + '\')" title="View details">\u2026</button>'
      + '</div>';
  });

  html += '<div class="summary-row summary-total-row">'
    + '<span class="summary-cat">Total All</span>'
    + '<span class="summary-amount">\u20B1' + formatNumber(grandTotal) + '</span>'
    + '<span class="summary-dots-placeholder"></span>'
    + '</div>';

  document.getElementById('expense-summary-container').innerHTML = html;
}

// ─────────────────────────────────────
// CATEGORY DETAIL MODAL
// ─────────────────────────────────────

function openCategoryDetail(categoryName) {
  var i = expenseState.selectedBatch;
  if (i === null) return;

  var batch = expenseState.batches[i];
  var matches = (batch.expenses || []).filter(function(exp) {
    return exp.category === categoryName;
  });

  document.getElementById('category-detail-title').textContent = categoryName;

  var tbody = document.getElementById('receipt-tbody');
  var catTotal = 0;

  if (matches.length === 0) {
    tbody.innerHTML = '<tr><td colspan="3" class="receipt-empty">No expenses in this category.</td></tr>';
  } else {
    tbody.innerHTML = matches.map(function(exp) {
      catTotal += exp.amount;
      return '<tr>'
        + '<td>' + escapeHTML(exp.description || '\u2014') + '</td>'
        + '<td>' + escapeHTML(exp.date || '') + '</td>'
        + '<td class="receipt-amount-col">\u20B1' + formatNumber(exp.amount) + '</td>'
        + '</tr>';
    }).join('');
  }

  document.getElementById('receipt-total').textContent = 'Total: \u20B1' + formatNumber(catTotal);

  document.getElementById('modal-category-detail').classList.add('show');
  document.getElementById('expense-modal-overlay').classList.add('show');
}

function closeCategoryDetail() {
  document.getElementById('modal-category-detail').classList.remove('show');
  document.getElementById('expense-modal-overlay').classList.remove('show');
}

// ─────────────────────────────────────
// MODAL — ADD NEW EXPENSES
// ─────────────────────────────────────

function openAddExpenseModal(batchIndex) {
  expenseState.editingBatchIndex = batchIndex;
  document.getElementById('expense-category').value = '';
  document.getElementById('expense-amount').value = '';
  document.getElementById('expense-desc').value = '';
  document.getElementById('modal-add-expense').classList.add('show');
  document.getElementById('expense-modal-overlay').classList.add('show');
  setTimeout(function() {
    document.getElementById('expense-category').focus();
  }, 100);
}

function closeExpenseModal() {
  document.getElementById('modal-add-expense').classList.remove('show');
  document.getElementById('modal-add-expense-batch').classList.remove('show');
  document.getElementById('modal-category-detail').classList.remove('show');
  document.getElementById('expense-modal-overlay').classList.remove('show');
}

async function saveExpense() {
  var category    = document.getElementById('expense-category').value;
  var amountStr   = document.getElementById('expense-amount').value.trim();
  var description = document.getElementById('expense-desc').value.trim();

  if (!category)   { showToast('Please select a category'); return; }
  if (!amountStr)  { showToast('Please enter an amount');   return; }

  var amount = parseFloat(amountStr);
  if (isNaN(amount) || amount < 0) {
    showToast('Please enter a valid amount');
    return;
  }

  var i = expenseState.editingBatchIndex;
  if (i === null || i === undefined || !expenseState.batches[i]) {
    showToast('No batch selected. Please click a batch first.');
    return;
  }

  var batchId = expenseState.batches[i].id;
  var today = new Date().toISOString().slice(0, 10);

  try {
    await API.addExpense(batchId, {
      category:    category,
      amount:      amount,
      description: description,
      date:        today
    });
  } catch (e) {
    showToast('Server error: ' + e.message);
    return;
  }

  closeExpenseModal();

  expenseState.selectedBatch = i;
  await loadBatches();
  renderExpenseBatches();
  showExpenseBatchView(i);

  showToast('Expense added! \u2713');
}

// ─────────────────────────────────────
// ADD EXPENSE BATCH MODAL
// ─────────────────────────────────────

function openAddBatchModal() {
  document.getElementById('expense-batch-name').value = '';
  document.getElementById('expense-batch-date').value = '';
  document.getElementById('modal-add-expense-batch').classList.add('show');
  document.getElementById('expense-modal-overlay').classList.add('show');
  setTimeout(function() {
    document.getElementById('expense-batch-name').focus();
  }, 100);
}

async function saveExpenseBatch() {
  var name = document.getElementById('expense-batch-name').value.trim();
  var date = document.getElementById('expense-batch-date').value;

  if (!name) { showToast('Please enter a batch name'); return; }
  if (!date) { showToast('Please select a date');      return; }

  try {
    await API.createExpenseBatch(name, date);
  } catch (e) {
    showToast('Server error: ' + e.message);
    return;
  }

  closeExpenseModal();
  expenseState.selectedBatch = null;
  document.getElementById('expense-placeholder').style.display = 'flex';
  document.getElementById('expense-batch-view').classList.remove('visible');

  await loadBatches();
  renderExpenseBatches();
  showToast('Expense batch "' + name + '" created! \u2713');
}

// ─────────────────────────────────────
// HELPERS
// ─────────────────────────────────────

function escapeHTML(str) {
  var div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function formatNumber(num) {
  if (num === undefined || num === null) return '0.00';
  var n = parseFloat(num);
  if (isNaN(n)) return '0.00';
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ─────────────────────────────────────
// INIT
// ─────────────────────────────────────
(async function init() {
  initNav();
  await loadBatches();
  renderExpenseBatches();
  document.getElementById('expense-placeholder').style.display = 'flex';
})();
