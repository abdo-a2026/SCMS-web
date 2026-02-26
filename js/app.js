/**
 * SCMS - Main App Controller
 */

let currentPage = 'dashboard';
let globalSearchDebounced;

// ---- Init ----
document.addEventListener('DOMContentLoaded', async () => {
  // Auth check
  const user = checkAuth();
  if (!user) return;

  // Seed demo data
  Store.seedDemo();

  // Apply saved theme
  const theme = localStorage.getItem('scms_theme') || 'dark';
  document.body.setAttribute('data-theme', theme);

  // Apply saved font size
  const fs = localStorage.getItem('scms_fontsize');
  if (fs) document.documentElement.style.fontSize = fs + 'px';

  // Set user info
  document.getElementById('user-name-display').textContent = user.name || 'مستخدم';
  document.getElementById('user-role-display').textContent = user.role === 'admin' ? 'مدير النظام' : 'موظف';
  document.getElementById('user-avatar').textContent = (user.name || 'U').charAt(0);

  // Notifications
  Store.updateNotifBadge();
  renderNotifications();

  // Setup global search
  globalSearchDebounced = debounce(doGlobalSearch, 350);

  // Navigate to dashboard
  await navigate('dashboard');

  // Update nav badge
  const clients = await Store.getClients();
  const badge = document.getElementById('nav-clients-count');
  if (badge) badge.textContent = clients.length;

  // Check follow-ups
  checkFollowUps(clients);

  // Hide loader
  setTimeout(() => {
    document.getElementById('app-loader')?.classList.add('hidden-loader');
  }, 900);
});

// ---- Navigation ----
async function navigate(page, el) {
  currentPage = page;

  // Update active nav
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  if (el) el.classList.add('active');
  else {
    const link = document.querySelector(`.nav-item[data-page="${page}"]`);
    if (link) link.classList.add('active');
  }

  // Update title
  const titles = {
    dashboard: 'لوحة التحكم',
    clients:   'إدارة العملاء',
    pipeline:  'خط الأعمال',
    reports:   'التقارير',
    sources:   'المصادر',
    users:     'المستخدمون',
    settings:  'الإعدادات'
  };
  const titleEl = document.getElementById('page-title');
  if (titleEl) titleEl.textContent = titles[page] || page;

  // Close mobile sidebar
  closeMobileSidebar();

  // Update bottom nav active state
  updateBottomNav(page);

  // Render page
  const area = document.getElementById('content-area');
  area.innerHTML = '<div class="page-loading flex-center" style="height:300px"><i class="fa-solid fa-spinner fa-spin" style="font-size:2rem;color:var(--accent)"></i></div>';

  const pages = {
    dashboard: renderDashboard,
    clients:   renderClients,
    pipeline:  renderPipeline,
    reports:   renderReports,
    sources:   renderSources,
    users:     renderUsers,
    settings:  renderSettings,
  };

  if (pages[page]) {
    await pages[page](area);
  }
}

// ---- Sidebar Toggle ----
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (window.innerWidth <= 768) {
    openMobileSidebar();
  } else {
    sidebar.classList.toggle('collapsed');
  }
}

function openMobileSidebar() {
  const sidebar  = document.getElementById('sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');
  sidebar.classList.add('mobile-open');
  backdrop.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeMobileSidebar() {
  const sidebar  = document.getElementById('sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');
  sidebar.classList.remove('mobile-open');
  backdrop.classList.add('hidden');
  document.body.style.overflow = '';
}

// ---- Bottom Nav ----
function bottomNavClick(page, btn) {
  navigate(page);
  // active state handled by updateBottomNav
}

function updateBottomNav(page) {
  const map = { dashboard: 'bnav-dashboard', clients: 'bnav-clients', pipeline: 'bnav-pipeline' };
  document.querySelectorAll('.bottom-nav-btn:not(.bottom-nav-add)').forEach(b => {
    b.classList.remove('active');
  });
  const id = map[page];
  if (id) document.getElementById(id)?.classList.add('active');
}

// ---- Mobile Search ----
function toggleMobileSearch() {
  const bar = document.getElementById('mobile-search-bar');
  bar.classList.toggle('hidden');
  if (!bar.classList.contains('hidden')) {
    document.getElementById('global-search-m')?.focus();
  }
}

// ---- Global Search ----
function globalSearch(value) {
  globalSearchDebounced(value);
}

function doGlobalSearch(query) {
  if (!query.trim()) return;
  navigate('clients');
  setTimeout(() => {
    const searchInput = document.getElementById('client-search');
    if (searchInput) {
      searchInput.value = query;
      searchInput.dispatchEvent(new Event('input'));
    }
  }, 200);
}

// ---- Notifications ----
function renderNotifications() {
  const list  = document.getElementById('notif-list');
  const notifs = Store.getNotifications();
  if (!list) return;

  if (!notifs.length) {
    list.innerHTML = '<div class="notif-empty">لا توجد إشعارات</div>';
    return;
  }

  list.innerHTML = notifs.slice(0, 20).map(n => `
    <div class="notif-item ${n.read ? '' : 'unread'}">
      <i class="fa-solid ${n.icon} notif-item-icon"></i>
      <div>
        <div class="notif-item-text">${n.text}</div>
        <div class="notif-item-time">${formatDate(n.time)}</div>
      </div>
    </div>
  `).join('');
}

function clearNotifications() {
  Store.markAllRead();
  renderNotifications();
  showToast('تم تعليم الكل كمقروء', 'success');
}

// ---- Check Follow-Ups ----
function checkFollowUps(clients) {
  const overdue = clients.filter(c =>
    c.followUpDate &&
    isOverdue(c.followUpDate) &&
    c.status !== 'closed' &&
    c.status !== 'lost'
  );
  if (overdue.length) {
    Store.addNotification(
      `لديك ${overdue.length} متابعة متأخرة`,
      'fa-calendar-exclamation'
    );
    renderNotifications();
  }
}

