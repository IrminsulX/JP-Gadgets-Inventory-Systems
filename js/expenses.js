/* ════════════════════════════════════
   JP APP — EXPENSES LOGIC
   expenses.js
   Batch pills with Edit icon → Add New Expenses modal
════════════════════════════════════ */

// ─────────────────────────────────────
// STATE
// ─────────────────────────────────────
const expenseState = {
  selectedBatch: null,
  editingBatchIndex: null,
  batches: [
    {
      name: 'March Expenses',
      date: '2025-03-01',
      expenses: []
    },
    {
      name: 'April Expenses',
      date: '2025-04-01',
      expenses: []
    }
  ]
};

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

    // Batch name label
    const label       = document.createElement('span');
    label.className   = 'batch-pill-label';
    label.textContent = batch.name;
    btn.appendChild(label);

    // Edit icon — opens "Add New Expenses" modal
    const editIcon       = document.createElement('span');
    editIcon.className   = 'batch-pill-edit';
    editIcon.textContent = '✎';
    editIcon.title       = 'Add expenses to this batch';
    editIcon.onclick     = function(e) {
      e.stopPropagation();
      openAddExpenseModal(i);
    };
    btn.appendChild(editIcon);

    sidebar.appendChild(btn);
  });

  // "Add Expense Batch" button
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
    batch.name + '  \u2014  ' + batch.date;

  const list = document.getElementById('expense-items-list');
  if (!batch.expenses || batch.expenses.length === 0) {
    list.innerHTML =
      '<div class="expense-row" style="justify-content:center;border-left-color:var(--muted)">' +
      '<span style="color:var(--muted);font-style:italic">No expenses yet. Click \u2710 to add.</span>' +
      '</div>';
  } else {
    list.innerHTML = batch.expenses.map(function(exp, idx) {
      return '<div class="expense-row" style="animation-delay:' + (idx * 0.05).toFixed(2) + 's">'
        + '<div class="exp-name">' + escapeHTML(exp.category) + '</div>'
        + '<div class="exp-desc-text">' + escapeHTML(exp.description || '\u2014') + '</div>'
        + '<div class="exp-date">' + escapeHTML(exp.date || '') + '</div>'
        + '<div class="exp-amount">\u20B1' + formatNumber(exp.amount) + '</div>'
        + '</div>';
    }).join('');
  }
}

// ─────────────────────────────────────
// MODAL — ADD NEW EXPENSES
// ─────────────────────────────────────

function openAddExpenseModal(batchIndex) {
  expenseState.editingBatchIndex = batchIndex;
  // Clear form
  document.getElementById('expense-category').value = '';
  document.getElementById('expense-amount').value = '';
  document.getElementById('expense-desc').value = '';
  // Show modal
  document.getElementById('modal-add-expense').classList.add('show');
  document.getElementById('expense-modal-overlay').classList.add('show');
  // Focus first field
  setTimeout(function() {
    document.getElementById('expense-category').focus();
  }, 100);
}

function closeExpenseModal() {
  document.getElementById('modal-add-expense').classList.remove('show');
  document.getElementById('modal-add-expense-batch').classList.remove('show');
  document.getElementById('expense-modal-overlay').classList.remove('show');
}

function saveExpense() {
  const category    = document.getElementById('expense-category').value;
  const amountStr   = document.getElementById('expense-amount').value.trim();
  const description = document.getElementById('expense-desc').value.trim();

  // Validation
  if (!category)   { showToast('Please select a category'); return; }
  if (!amountStr)  { showToast('Please enter an amount');   return; }

  const amount = parseFloat(amountStr);
  if (isNaN(amount) || amount < 0) {
    showToast('Please enter a valid amount');
    return;
  }

  const i = expenseState.editingBatchIndex;
  if (i === null || !expenseState.batches[i]) return;

  // Add expense to the batch
  const today = new Date().toISOString().slice(0, 10);
  expenseState.batches[i].expenses.push({
    category:    category,
    amount:      amount,
    description: description,
    date:        today
  });

  closeExpenseModal();

  // Refresh view if this batch is currently selected
  if (expenseState.selectedBatch === i) {
    showExpenseBatchView(i);
  }

  const batchName = expenseState.batches[i].name;
  showToast('Expense added to "' + batchName + '"! \u2713');
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

function saveExpenseBatch() {
  const name = document.getElementById('expense-batch-name').value.trim();
  const date = document.getElementById('expense-batch-date').value;

  if (!name) { showToast('Please enter a batch name'); return; }
  if (!date) { showToast('Please select a date');      return; }

  expenseState.batches.push({
    name:     name,
    date:     date,
    expenses: []
  });

  closeExpenseModal();
  expenseState.selectedBatch = null;
  document.getElementById('expense-placeholder').style.display = 'flex';
  document.getElementById('expense-batch-view').classList.remove('visible');
  renderExpenseBatches();
  showToast('Expense batch "' + name + '" created! \u2713');
}

// ─────────────────────────────────────
// HELPERS
// ─────────────────────────────────────

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function formatNumber(num) {
  if (num === undefined || num === null) return '0.00';
  const n = parseFloat(num);
  if (isNaN(n)) return '0.00';
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ─────────────────────────────────────
// INIT
// ─────────────────────────────────────
(function init() {
  initNav();
  renderExpenseBatches();
  document.getElementById('expense-placeholder').style.display = 'flex';
})();
