/* ════════════════════════════════════
   JP APP — AUTH LOGIC
   auth.js
════════════════════════════════════ */

/**
 * Show a screen by ID, hide all others.
 * @param {string} screenId
 */
function goTo(screenId) {
  document.querySelectorAll('.screen').forEach(function(s) {
    s.classList.remove('active');
  });
  var el = document.getElementById(screenId);
  if (el) el.classList.add('active');
}

/**
 * Validate login fields, store user, redirect to dashboard.
 */
function doLogin() {
  const email = document.getElementById('login-email').value.trim();
  const pass  = document.getElementById('login-password').value.trim();

  if (!email || !pass) {
    shakeForm('login-form');
    showToast('Please fill in all fields');
    return;
  }

  // Check against registered users
  const users = getRegisteredUsers();
  if (users[email]) {
    // Registered user — validate password
    if (users[email].password !== pass) {
      shakeForm('login-form');
      showToast('Incorrect password');
      return;
    }
  }
  // If not registered, allow login anyway (backward-compatible demo mode)

  // Store in both storages for cross-page reliability
  localStorage.setItem('jp_user', email);
  sessionStorage.setItem('jp_user', email);
  showToast('Logged in! Redirecting…');
  setTimeout(function() {
    window.location.href = 'dashboard.html';
  }, 600);
}

/**
 * Sign up a new user: validate, register, and redirect to dashboard.
 */
function doSignup() {
  const name    = document.getElementById('signup-name').value.trim();
  const email   = document.getElementById('signup-email').value.trim();
  const pass    = document.getElementById('signup-password').value.trim();
  const confirm = document.getElementById('signup-confirm').value.trim();

  if (!name)    { shakeForm('signup-form'); showToast('Please enter your name'); return; }
  if (!email)   { shakeForm('signup-form'); showToast('Please enter an email'); return; }
  if (!pass)    { shakeForm('signup-form'); showToast('Please enter a password'); return; }
  if (pass !== confirm) {
    shakeForm('signup-form');
    showToast('Passwords do not match');
    return;
  }

  // Check if email already registered
  const users = getRegisteredUsers();
  if (users[email]) {
    shakeForm('signup-form');
    showToast('An account with this email already exists');
    return;
  }

  // Register user
  users[email] = { name: name, email: email, password: pass };
  localStorage.setItem('jp_users', JSON.stringify(users));

  // Auto-login — store in both storages
  localStorage.setItem('jp_user', email);
  sessionStorage.setItem('jp_user', email);
  showToast('Account created! Redirecting…');
  setTimeout(function() {
    window.location.href = 'dashboard.html';
  }, 800);
}

/**
 * Retrieve registered users object from localStorage.
 * @returns {Object}
 */
function getRegisteredUsers() {
  try {
    return JSON.parse(localStorage.getItem('jp_users') || '{}');
  } catch (e) {
    return {};
  }
}

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

/**
 * Validate password change and redirect to login.
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

/**
 * Shake a form element briefly.
 * @param {string} formId
 */
function shakeForm(formId) {
  const form = document.getElementById(formId);
  if (!form) return;
  form.classList.add('shake');
  setTimeout(function() { form.classList.remove('shake'); }, 400);
}

/**
 * Toast notification.
 */
function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(function() { toast.classList.remove('show'); }, 2500);
}
