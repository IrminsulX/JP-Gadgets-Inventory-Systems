/* ════════════════════════════════════
   JP APP — JAVASCRIPT
   app.js
════════════════════════════════════ */

// ─────────────────────────────────────
// APP STATE
// ─────────────────────────────────────
const state = {
  userEmail:         '',
  selectedBatch:     null,
  addingBatch:       false,
  editingBatchIndex: null,
  batches: [
    {
      name:  'March Batch 01',
      date:  '2025-03-01',
      items: [
        { product: 'iPhone 15 Pro Max', sku: 'IP15PM', qty: 15, price: '₱3,100' },
        { product: 'iPhone 15 Pro',     sku: 'IP15P',  qty: 20, price: '₱2,800' },
      ]
    },
    {
      name:  'March Batch 02',
      date:  '2025-03-15',
      items: [
        { product: 'iPhone 15',      sku: 'IP15', qty: 18, price: '₱2,100' },
        { product: 'Apple Watch S9', sku: 'AWS9', qty: 10, price: '₱1,200' },
      ]
    }
  ]
};

// ─────────────────────────────────────
// NAVIGATION
// ─────────────────────────────────────

/**
 * Show a screen by ID, hide all others.
 * @param {string} screenId - The ID of the screen element to show.
 */
function goTo(screenId) {
  document.querySelectorAll('.screen').forEach(function(s) {
    s.classList.remove('active');
  });
  document.getElementById(screenId).classList.add('active');
}

// ─────────────────────────────────────
// AUTH — LOGIN
// ─────────────────────────────────────

/**
 * Validate login fields, update profile info, then navigate to dashboard.
 */
function doLogin() {
  const email = document.getElementById('login-email').value.trim();
  const pass  = document.getElementById('login-password').value.trim();

  if (!email || !pass) {
    const form = document.getElementById('login-form');
    form.classList.add('shake');
    setTimeout(function() { form.classList.remove('shake'); }, 400);
    showToast('Please fill in all fields');
    return;
  }

  // Derive display name from email prefix
  state.userEmail      = email;
  const namePart       = email.split('@')[0];
  const displayName    = namePart.charAt(0).toUpperCase() + namePart.slice(1);

  document.getElementById('profile-email').textContent   = email;
  document.getElementById('profile-name').textContent    = displayName;
  document.getElementById('avatar-initials').textContent = namePart.slice(0, 2).toUpperCase();

  renderBatches();
  goTo('screen-dashboard');
}

// ─────────────────────────────────────
// AUTH — FORGOT PASSWORD
// ─────────────────────────────────────

/**
 * Simulate sending a verification email.
 */
function sendVerify() {
  const email = document.getElementById('forgot-email').value.trim();
  if (!email) {
    showToast('Enter your email first');
    return;
  }
  showToast('Verification link sent! ✓');
}

// ─────────────────────────────────────
// AUTH — CHANGE PASSWORD
// ─────────────────────────────────────

/**
 * Validate that both password fields match, then redirect to login.
 */
function doChangePassword() {
  const newPass     = document.getElementById('new-pass').value.trim();
  const confirmPass = document.getElementById('confirm-pass').value.trim();

  if (!newPass || !confirmPass) {
    showToast('Fill in both fields');
    return;
  }
  if (newPass !== confirmPass) {
    showToast('Passwords do not match');
    return;
  }

  showToast('Password changed! ✓');
  setTimeout(function() { goTo('screen-login'); }, 1400);
}

// ─────────────────────────────────────
// AUTH — LOGOUT
// ─────────────────────────────────────

/**
 * Clear login fields and return to the login screen.
 */
function doLogout() {
  document.getElementById('login-email').value    = '';
  document.getElementById('login-password').value = '';
  goTo('screen-login');
}

// ─────────────────────────────────────
// DASHBOARD — TAB SWITCHING
// ─────────────────────────────────────

/**
 * Switch the active dashboard tab.
 * @param {string} tab - One of 'inventory', 'sales', 'expenses'.
 */
function showTab(tab) {
  // Hide all content panels
  document.querySelectorAll('.dashboard-content').forEach(function(t) {
    t.classList.remove('active');
  });
  // Deactivate all tab buttons
  document.querySelectorAll('.tab-item').forEach(function(t) {
    t.classList.remove('active');
  });

  // Activate selected panel and button
  document.getElementById('tab-' + tab).classList.add('active');
  document.getElementById('tab-btn-' + tab).classList.add('active');

  // Sync top-nav "Inventory" link active state
  const navInv = document.getElementById('nav-inventory');
  if (tab === 'inventory') {
    navInv.classList.add('active');
  } else {
    navInv.classList.remove('active');
  }
}

// ─────────────────────────────────────
// INVENTORY — RENDER BATCH SIDEBAR
// ─────────────────────────────────────

/**
 * Re-render the batch pill buttons from state.batches.
 */
function renderBatches() {
  const sidebar = document.getElementById('batch-sidebar');
  sidebar.innerHTML = '';

  state.batches.forEach(function(batch, i) {
    const btn       = document.createElement('button');
    btn.className   = 'batch-pill' + (state.selectedBatch === i ? ' selected' : '');
    btn.onclick     = function() { selectBatch(i); };

    // Batch name text
    const label       = document.createElement('span');
    label.className   = 'batch-pill-label';
    label.textContent = batch.name;
    btn.appendChild(label);

    // Edit icon
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

  // "Add New Batch" button always at the bottom
  const addBtn       = document.createElement('button');
  addBtn.className   = 'batch-pill add-btn' + (state.addingBatch ? ' active-add' : '');
  addBtn.id          = 'add-new-btn';
  addBtn.textContent = 'Add New Batch';
  addBtn.onclick     = toggleAddForm;
  sidebar.appendChild(addBtn);
}

// ─────────────────────────────────────
// INVENTORY — SELECT A BATCH
// ─────────────────────────────────────

/**
 * Select a batch by index, hide the add-form, and display its items.
 * @param {number} i - Index into state.batches.
 */
function selectBatch(i) {
  state.selectedBatch = i;
  state.addingBatch   = false;

  renderBatches();
  document.getElementById('add-batch-form').classList.remove('visible');
  showBatchView(i);
}

/**
 * Populate the batch items table for the given batch index.
 * @param {number} i - Index into state.batches.
 */
function showBatchView(i) {
  const batch = state.batches[i];

  // Hide placeholder, show table
  document.getElementById('inventory-placeholder').style.display = 'none';
  const view = document.getElementById('batch-view');
  view.classList.add('visible');

  // Set heading
  document.getElementById('batch-view-title').textContent =
    batch.name + '  —  ' + batch.date;

  // Build table rows
  const tbody = document.getElementById('batch-items-body');
  if (batch.items.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="4" style="text-align:center;color:var(--muted);padding:20px">' +
      'No items in this batch yet.</td></tr>';
  } else {
    tbody.innerHTML = batch.items.map(function(item) {
      return '<tr>'
        + '<td>' + item.product + '</td>'
        + '<td>' + item.sku     + '</td>'
        + '<td>' + item.qty     + '</td>'
        + '<td>' + item.price   + '</td>'
        + '</tr>';
    }).join('');
  }
}

// ─────────────────────────────────────
// INVENTORY — TOGGLE ADD BATCH FORM
// ─────────────────────────────────────

/**
 * Show or hide the inline "Add New Batch" form.
 */
function toggleAddForm() {
  state.addingBatch   = !state.addingBatch;
  state.selectedBatch = null;
  renderBatches();

  const form = document.getElementById('add-batch-form');

  if (state.addingBatch) {
    form.classList.add('visible');
    document.getElementById('inventory-placeholder').style.display = 'flex';
    document.getElementById('batch-view').classList.remove('visible');
    document.getElementById('batch-name-input').focus();
  } else {
    form.classList.remove('visible');
  }
}

// ─────────────────────────────────────
// INVENTORY — SAVE NEW BATCH
// ─────────────────────────────────────

/**
 * Validate inputs, push new batch to state, and re-render the sidebar.
 */
function saveBatch() {
  const name = document.getElementById('batch-name-input').value.trim();
  const date = document.getElementById('batch-date-input').value;

  if (!name) { showToast('Please enter a batch name'); return; }
  if (!date) { showToast('Please select a date');      return; }

  // Add to state
  state.batches.push({ name: name, date: date, items: [] });

  // Reset form state
  state.addingBatch   = false;
  state.selectedBatch = null;
  document.getElementById('batch-name-input').value = '';
  document.getElementById('batch-date-input').value = '';
  document.getElementById('add-batch-form').classList.remove('visible');
  document.getElementById('inventory-placeholder').style.display = 'flex';
  document.getElementById('batch-view').classList.remove('visible');

  renderBatches();
  showToast('Batch "' + name + '" saved! ✓');
}

// ─────────────────────────────────────
// TOAST NOTIFICATION
// ─────────────────────────────────────

/**
 * Display a brief toast message at the bottom of the screen.
 * @param {string} message - Text to display.
 */
function showToast(message) {
  const toast     = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(function() { toast.classList.remove('show'); }, 2500);
}

// ─────────────────────────────────────
// BATCH ACTIONS — Edit / Add Unit / Delete
// ─────────────────────────────────────

/**
 * Show the actions dropdown near the clicked edit icon.
 * @param {number} i - Batch index.
 * @param {HTMLElement} anchor - The edit icon element for positioning.
 */
function openBatchActions(i, anchor) {
  state.editingBatchIndex = i;
  const dropdown = document.getElementById('batch-actions-dropdown');
  dropdown.classList.add('show');
}

/**
 * Hide the batch-actions dropdown.
 */
function hideBatchActions() {
  document.getElementById('batch-actions-dropdown').classList.remove('show');
}

/**
 * Show the Edit Batch modal (name + date).
 */
function showEditBatchModal() {
  hideBatchActions();
  const batch = state.batches[state.editingBatchIndex];
  document.getElementById('edit-batch-name').value = batch.name;
  document.getElementById('edit-batch-date').value = batch.date;
  document.getElementById('modal-edit-batch').classList.add('show');
  document.getElementById('modal-overlay').classList.add('show');
}

/**
 * Show the Add New Unit modal.
 */
function showAddUnitModal() {
  hideBatchActions();
  document.getElementById('unit-type').value       = '';
  document.getElementById('unit-gb').value         = '';
  document.getElementById('unit-image-url').value   = '';
  document.getElementById('modal-add-unit').classList.add('show');
  document.getElementById('modal-overlay').classList.add('show');
}

/**
 * Show the Delete Batch confirmation modal.
 */
function showDeleteBatchModal() {
  hideBatchActions();
  document.getElementById('modal-delete-batch').classList.add('show');
  document.getElementById('modal-overlay').classList.add('show');
}

/**
 * Close all modals and the overlay.
 */
function closeModal() {
  document.getElementById('modal-overlay').classList.remove('show');
  document.getElementById('modal-edit-batch').classList.remove('show');
  document.getElementById('modal-add-unit').classList.remove('show');
  document.getElementById('modal-delete-batch').classList.remove('show');
  hideBatchActions();
}

/**
 * Save changes to the batch name and date.
 */
function saveEditBatch() {
  const name = document.getElementById('edit-batch-name').value.trim();
  const date = document.getElementById('edit-batch-date').value;

  if (!name) { showToast('Please enter a batch name'); return; }
  if (!date) { showToast('Please select a date');      return; }

  const i = state.editingBatchIndex;
  state.batches[i].name = name;
  state.batches[i].date = date;

  closeModal();
  renderBatches();

  // Refresh batch view if this batch is currently selected
  if (state.selectedBatch === i) {
    showBatchView(i);
  }

  showToast('Batch updated! ✓');
}

/**
 * Add a new unit item to the currently edited batch.
 */
function saveAddUnit() {
  const type      = document.getElementById('unit-type').value.trim();
  const gb        = document.getElementById('unit-gb').value;
  const imageUrl  = document.getElementById('unit-image-url').value.trim();

  if (!type)     { showToast('Please enter a unit type'); return; }
  if (!gb)       { showToast('Please choose a gigabyte option'); return; }

  const i    = state.editingBatchIndex;
  const sku  = type.replace(/\s+/g, '').toUpperCase().slice(0, 6) + '-' + gb;
  const item = {
    product: type + ' ' + gb,
    sku:     sku,
    qty:     1,
    price:   '₱0'
  };

  state.batches[i].items.push(item);

  closeModal();

  // Refresh batch view if this batch is currently selected
  if (state.selectedBatch === i) {
    showBatchView(i);
  }

  showToast('Unit "' + item.product + '" added! ✓');
}

/**
 * Delete the currently edited batch after confirmation.
 */
function deleteBatch() {
  const i = state.editingBatchIndex;
  const name = state.batches[i].name;

  state.batches.splice(i, 1);

  // Reset selection if the deleted batch was selected
  if (state.selectedBatch === i) {
    state.selectedBatch = null;
    document.getElementById('inventory-placeholder').style.display = 'flex';
    document.getElementById('batch-view').classList.remove('visible');
  } else if (state.selectedBatch > i) {
    // Shift selection index if a batch before was removed
    state.selectedBatch--;
  }

  closeModal();
  renderBatches();
  showToast('Batch "' + name + '" deleted. ✓');
}

// ─────────────────────────────────────
// INIT
// ─────────────────────────────────────
renderBatches();
document.getElementById('inventory-placeholder').style.display = 'flex';