/**
 * SCMS - Utilities
 */

// ---- Toast Notifications ----
function showToast(message, type = 'info', duration = 3500) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const icons = {
    success: 'fa-circle-check',
    error:   'fa-circle-xmark',
    warning: 'fa-triangle-exclamation',
    info:    'fa-circle-info'
  };

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <i class="fa-solid ${icons[type] || icons.info} toast-icon"></i>
    <span class="toast-msg">${message}</span>
  `;
  container.appendChild(toast);

  // Auto remove
  setTimeout(() => {
    toast.classList.add('hiding');
    setTimeout(() => toast.remove(), 350);
  }, duration);
}

// ---- Confirm Dialog ----
let confirmCallback = null;

function showConfirm(title, msg, callback) {
  document.getElementById('confirm-title').textContent = title;
  document.getElementById('confirm-msg').textContent = msg;
  document.getElementById('confirm-overlay').classList.remove('hidden');
  document.getElementById('confirm-dialog').classList.remove('hidden');
  confirmCallback = callback;

  document.getElementById('confirm-yes').onclick = () => {
    closeConfirm();
    if (confirmCallback) confirmCallback();
  };
}

function closeConfirm() {
  document.getElementById('confirm-overlay').classList.add('hidden');
  document.getElementById('confirm-dialog').classList.add('hidden');
  confirmCallback = null;
}

// ---- Modal ----
function openModal(html, title = '') {
  const container = document.getElementById('modal-container');
  const overlay   = document.getElementById('modal-overlay');
  if (!container || !overlay) return;

  container.innerHTML = `
    <div class="modal-header">
      <div class="modal-title">${title}</div>
      <button class="modal-close" onclick="closeModal()"><i class="fa-solid fa-xmark"></i></button>
    </div>
    ${html}
  `;
  container.classList.remove('hidden');
  overlay.classList.remove('hidden');
}

function closeModal() {
  document.getElementById('modal-container').classList.add('hidden');
  document.getElementById('modal-overlay').classList.add('hidden');
}

function closeModalOutside(e) {
  if (e.target === document.getElementById('modal-overlay')) closeModal();
}

// ---- Debounce ----
function debounce(fn, ms = 300) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

// ---- Format Currency (Iraqi Dinar) ----
function formatCurrency(amount) {
  if (!amount && amount !== 0) return '—';
  return Number(amount).toLocaleString('ar-IQ') + ' <span class="currency">د.ع</span>';
}

function formatCurrencyPlain(amount) {
  if (!amount && amount !== 0) return '0';
  return Number(amount).toLocaleString('ar-IQ') + ' د.ع';
}

// ---- Format Date ----
function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d)) return '—';
  return d.toLocaleDateString('ar-IQ', { year: 'numeric', month: 'short', day: 'numeric' });
}

function isOverdue(dateStr) {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

// ---- Status Labels ----
const STATUS_LABELS = {
  new:          'جديد',
  contacted:    'تم التواصل',
  interested:   'مهتم',
  negotiation:  'تفاوض',
  closed:       'مغلق',
  lost:         'خسارة'
};

const STATUS_BADGES = {
  new:          'badge-new',
  contacted:    'badge-contacted',
  interested:   'badge-interested',
  negotiation:  'badge-negotiation',
  closed:       'badge-closed',
  lost:         'badge-lost'
};

function statusBadge(status) {
  const cls = STATUS_BADGES[status] || 'badge-new';
  const lbl = STATUS_LABELS[status] || status;
  return `<span class="badge ${cls}">${lbl}</span>`;
}

// ---- Source label ----
function sourceLabel(sourceId) {
  const sources = Store.get('sources') || [];
  const src = sources.find(s => s.id === sourceId);
  return src ? src.name : (sourceId || '—');
}

// ---- User label ----
function userLabel(userId) {
  const users = Store.get('users') || [];
  const u = users.find(u => u.id === userId);
  return u ? u.name : '—';
}

// ---- Toggle Password ----
function togglePassword() {
  const input = document.getElementById('login-password');
  const icon  = document.getElementById('eye-icon');
  if (!input) return;
  if (input.type === 'password') {
    input.type = 'text';
    icon.className = 'fa-solid fa-eye-slash';
  } else {
    input.type = 'password';
    icon.className = 'fa-solid fa-eye';
  }
}

// ---- Unique ID ----
function genId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// ---- Close dropdowns on outside click ----
document.addEventListener('click', (e) => {
  // User dropdown
  const userMenu = document.getElementById('user-dropdown');
  if (userMenu && !e.target.closest('.user-menu')) {
    userMenu.classList.add('hidden');
  }
  // Action menus
  document.querySelectorAll('.actions-dropdown.show').forEach(d => {
    if (!e.target.closest('.actions-menu')) d.classList.remove('show');
  });
  // Notifications
  const notifPanel = document.getElementById('notif-panel');
  if (notifPanel && !e.target.closest('#notif-btn') && !e.target.closest('#notif-panel')) {
    notifPanel.classList.add('hidden');
  }
});

function toggleUserMenu() {
  document.getElementById('user-dropdown')?.classList.toggle('hidden');
}

function toggleNotifications() {
  document.getElementById('notif-panel')?.classList.toggle('hidden');
}

// ---- Date Time Now ----
function nowISO() {
  return new Date().toISOString();
}

// ---- Search highlight ----
function highlightText(text, query) {
  if (!query) return text;
  const re = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')})`, 'gi');
  return String(text).replace(re, '<mark>$1</mark>');
}
