/* ════════════════════════════════════
   JP APP — SHARED UTILITIES
   common.js
════════════════════════════════════ */

/**
 * Get the logged-in user email.
 * Checks sessionStorage first (more reliable for file://),
 * then falls back to localStorage.
 * @returns {string|null}
 */
function getUser() {
  return sessionStorage.getItem('jp_user') || localStorage.getItem('jp_user');
}

/**
 * Derive display name from email prefix.
 * @param {string} email
 * @returns {string}
 */
function getUserDisplayName(email) {
  if (!email) return '';
  const namePart = email.split('@')[0];
  return namePart.charAt(0).toUpperCase() + namePart.slice(1);
}

/**
 * Initialize the shared nav bar on page load.
 * Shows the user's name if logged in, otherwise shows "Welcome, Guest"
 * and provides a Sign In link instead of redirecting.
 */
function initNav() {
  const email = getUser();
  const userSpan = document.getElementById('nav-user');
  if (!userSpan) return;

  if (email) {
    // Logged in — show user name + Sign Out button
    userSpan.textContent = 'Welcome, ' + getUserDisplayName(email);
  } else {
    // Not logged in — show generic welcome with a sign-in link
    // No redirect — prevents the file:// localStorage loop
    userSpan.innerHTML = 'Welcome, Guest — <a href="login.html" style="color:var(--orange-dark);font-weight:600">Sign in</a>';
  }
}

/**
 * Log out: clear both storages and redirect to login.
 */
function doLogout() {
  localStorage.removeItem('jp_user');
  sessionStorage.removeItem('jp_user');
  window.location.href = 'login.html';
}

/**
 * Show a toast notification.
 * @param {string} message
 */
function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(function() { toast.classList.remove('show'); }, 2500);
}
