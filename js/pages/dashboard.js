/**
 * SCMS - Dashboard Page
 */

async function renderDashboard(container) {
  const stats   = await Store.getStats();
  const clients = await Store.getClients();

  const last5 = clients.slice(0, 5);
  const monthlyData = getMonthlyData(clients);
  const statusData  = getStatusData(clients);

  container.innerHTML = `
    <!-- Stats -->
    <div class="stats-grid">
      ${statCard('fa-users', 'إجمالي العملاء', stats.total, 'blue', stats.thisMonth > 0 ? `+${stats.thisMonth} هذا الشهر` : '', 'up')}
      ${statCard('fa-user-plus', 'عملاء هذا الشهر', stats.thisMonth, '', '', '')}
      ${statCard('fa-handshake', 'الصفقات المغلقة', stats.closed, 'green', `${stats.conversion}% معدل التحويل`, 'up')}
      ${statCard('fa-coins', 'إجمالي الإيرادات', formatCurrencyPlain(stats.revenue), 'orange', '', '')}
      ${statCard('fa-chart-line', 'معدل التحويل', stats.conversion + '%', 'red', '', '')}
    </div>

    <!-- Charts -->
    <div class="charts-grid">
      <div class="chart-card">
        <div class="chart-header">
          <div class="chart-title"><i class="fa-solid fa-chart-area"></i> العملاء حسب الأشهر</div>
        </div>
        <div class="chart-canvas-wrap" style="position:relative;height:200px">
          <canvas id="lineChart"></canvas>
        </div>
      </div>
      <div class="chart-card">
        <div class="chart-header">
          <div class="chart-title"><i class="fa-solid fa-chart-pie"></i> توزيع الحالات</div>
        </div>
        <div class="chart-canvas-wrap" style="position:relative;height:200px">
          <canvas id="pieChart"></canvas>
        </div>
      </div>
    </div>

    <!-- Latest Clients -->
    <div class="card">
      <div class="section-header">
        <div class="section-title"><i class="fa-solid fa-clock-rotate-left"></i> آخر العملاء المضافين</div>
        <button class="btn btn-secondary btn-sm" onclick="navigate('clients')">
          <i class="fa-solid fa-arrow-left"></i> عرض الكل
        </button>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>الاسم</th>
              <th>الحالة</th>
              <th>المصدر</th>
              <th>قيمة الصفقة</th>
              <th>التاريخ</th>
            </tr>
          </thead>
          <tbody>
            ${last5.map(c => `
              <tr>
                <td><strong>${c.fullName}</strong></td>
                <td>${statusBadge(c.status)}</td>
                <td>${sourceLabel(c.sourceId)}</td>
                <td>${formatCurrency(c.dealValue)}</td>
                <td>${formatDate(c.createdAt)}</td>
              </tr>
            `).join('') || '<tr><td colspan="5" class="text-center text-muted" style="padding:2rem">لا يوجد عملاء بعد</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
  `;

  // Render Charts
  renderLineChart(monthlyData);
  renderPieChart(statusData);
}

function statCard(icon, label, value, colorClass, change, dir) {
  return `
    <div class="stat-card">
      <div class="stat-icon ${colorClass}"><i class="fa-solid ${icon}"></i></div>
      <div class="stat-label">${label}</div>
      <div class="stat-value">${value}</div>
      ${change ? `<div class="stat-change ${dir}">
        <i class="fa-solid fa-arrow-${dir === 'up' ? 'up' : 'down'}"></i>
        ${change}
      </div>` : ''}
    </div>
  `;
}

function getMonthlyData(clients) {
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleDateString('ar-IQ', { month: 'short' });
    const count = clients.filter(c => {
      const cd = new Date(c.createdAt);
      return cd.getMonth() === d.getMonth() && cd.getFullYear() === d.getFullYear();
    }).length;
    months.push({ label, count });
  }
  return months;
}

function getStatusData(clients) {
  const statuses = ['new','contacted','interested','negotiation','closed','lost'];
  const colors   = ['#3498db','#9b59b6','#f39c12','#e67e22','#2ecc71','#e74c3c'];
  return statuses.map((s, i) => ({
    label: STATUS_LABELS[s],
    count: clients.filter(c => c.status === s).length,
    color: colors[i]
  })).filter(s => s.count > 0);
}

function renderLineChart(data) {
  const ctx = document.getElementById('lineChart');
  if (!ctx || !window.Chart) return;

  const isDark = document.body.getAttribute('data-theme') !== 'light';
  const gridColor = isDark ? 'rgba(196,165,94,0.08)' : 'rgba(26,37,80,0.06)';
  const textColor = isDark ? 'rgba(160,144,112,0.8)' : 'rgba(26,37,80,0.5)';

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.map(d => d.label),
      datasets: [{
        label: 'عملاء جدد',
        data: data.map(d => d.count),
        borderColor: '#c4a55e',
        backgroundColor: 'rgba(196,165,94,0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#c4a55e',
        pointBorderColor: 'transparent',
        pointRadius: 4,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: {
          grid: { color: gridColor },
          ticks: { color: textColor, font: { family: 'Cairo' } }
        },
        y: {
          grid: { color: gridColor },
          ticks: { color: textColor, font: { family: 'Cairo' }, stepSize: 1 },
          beginAtZero: true
        }
      }
    }
  });
}

function renderPieChart(data) {
  const ctx = document.getElementById('pieChart');
  if (!ctx || !window.Chart) return;

  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: data.map(d => d.label),
      datasets: [{
        data: data.map(d => d.count),
        backgroundColor: data.map(d => d.color + 'cc'),
        borderColor: data.map(d => d.color),
        borderWidth: 1,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: document.body.getAttribute('data-theme') !== 'light'
              ? 'rgba(160,144,112,0.9)'
              : 'rgba(26,37,80,0.7)',
            font: { family: 'Cairo', size: 11 },
            padding: 10,
            boxWidth: 10,
          }
        }
      },
      cutout: '60%',
    }
  });
}
