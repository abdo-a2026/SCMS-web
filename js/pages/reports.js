/**
 * SCMS - Reports Page
 */

async function renderReports(container) {
  const clients = await Store.getClients();
  const sources = await Store.getSources();

  const closed = clients.filter(c => c.status === 'closed');
  const revenue = closed.reduce((s,c) => s + (Number(c.dealValue)||0), 0);
  const avgDeal = closed.length ? (revenue / closed.length) : 0;
  const convRate = clients.length ? ((closed.length / clients.length) * 100).toFixed(1) : 0;

  // Source performance
  const srcPerf = sources.map(src => {
    const srcClients = clients.filter(c => c.sourceId === src.id);
    const srcClosed  = srcClients.filter(c => c.status === 'closed');
    const srcRevenue = srcClosed.reduce((s,c) => s + (Number(c.dealValue)||0), 0);
    const srcConv    = srcClients.length ? ((srcClosed.length / srcClients.length)*100).toFixed(1) : '0.0';
    return {
      name: src.name,
      total: srcClients.length,
      closed: srcClosed.length,
      revenue: srcRevenue,
      conv: srcConv
    };
  }).filter(s => s.total > 0).sort((a,b) => b.total - a.total);

  container.innerHTML = `
    <!-- Summary Cards -->
    <div class="reports-grid" style="margin-bottom:1.5rem">
      <div class="stat-card">
        <div class="stat-icon green"><i class="fa-solid fa-coins"></i></div>
        <div class="stat-label">إجمالي الإيرادات</div>
        <div class="stat-value" style="font-size:1.1rem">${revenue.toLocaleString('ar-IQ')} د.ع</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon blue"><i class="fa-solid fa-handshake"></i></div>
        <div class="stat-label">الصفقات المغلقة</div>
        <div class="stat-value">${closed.length}</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon orange"><i class="fa-solid fa-chart-bar"></i></div>
        <div class="stat-label">متوسط قيمة الصفقة</div>
        <div class="stat-value" style="font-size:1rem">${Math.round(avgDeal).toLocaleString('ar-IQ')} د.ع</div>
      </div>
    </div>

    <!-- Charts -->
    <div class="charts-grid" style="margin-bottom:1.5rem">
      <div class="chart-card">
        <div class="chart-header">
          <div class="chart-title"><i class="fa-solid fa-chart-line"></i> الإيرادات الشهرية</div>
        </div>
        <div style="position:relative;height:200px">
          <canvas id="revenueChart"></canvas>
        </div>
      </div>
      <div class="chart-card">
        <div class="chart-header">
          <div class="chart-title"><i class="fa-solid fa-percent"></i> معدل التحويل الكلي</div>
        </div>
        <div class="flex-center" style="height:80px;flex-direction:column;gap:.5rem">
          <div style="font-size:3rem;font-weight:900;color:var(--accent)">${convRate}%</div>
          <div style="color:var(--text-muted);font-size:.875rem">${closed.length} من ${clients.length} عميل</div>
        </div>
        <div style="position:relative;height:100px">
          <canvas id="convChart"></canvas>
        </div>
      </div>
    </div>

    <!-- Source Performance -->
    <div class="card">
      <div class="section-header">
        <div class="section-title"><i class="fa-solid fa-layer-group"></i> أداء المصادر</div>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>المصدر</th>
              <th>العملاء</th>
              <th>المغلق</th>
              <th>الإيرادات</th>
              <th>معدل التحويل</th>
            </tr>
          </thead>
          <tbody>
            ${srcPerf.length ? srcPerf.map(s => `
              <tr>
                <td><strong>${s.name}</strong></td>
                <td>${s.total}</td>
                <td>${s.closed}</td>
                <td>${s.revenue.toLocaleString('ar-IQ')} د.ع</td>
                <td>
                  <div style="display:flex;align-items:center;gap:8px">
                    <div style="flex:1;height:6px;background:var(--bg-hover);border-radius:3px;overflow:hidden">
                      <div style="width:${s.conv}%;height:100%;background:var(--accent);border-radius:3px"></div>
                    </div>
                    <span style="font-weight:700;font-size:.8rem;color:var(--accent)">${s.conv}%</span>
                  </div>
                </td>
              </tr>
            `).join('') : '<tr><td colspan="5" class="text-center text-muted" style="padding:2rem">لا توجد بيانات</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
  `;

  renderRevenueChart(clients);
  renderConvChart(clients, sources);
}

function renderRevenueChart(clients) {
  const ctx = document.getElementById('revenueChart');
  if (!ctx || !window.Chart) return;

  const now = new Date();
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleDateString('ar-IQ', { month: 'short' });
    const rev = clients
      .filter(c => {
        const cd = new Date(c.createdAt);
        return c.status === 'closed' &&
          cd.getMonth() === d.getMonth() &&
          cd.getFullYear() === d.getFullYear();
      })
      .reduce((s,c) => s + (Number(c.dealValue)||0), 0);
    months.push({ label, rev });
  }

  const isDark = document.body.getAttribute('data-theme') !== 'light';
  const gc = isDark ? 'rgba(196,165,94,0.08)' : 'rgba(26,37,80,0.06)';
  const tc = isDark ? 'rgba(160,144,112,0.8)' : 'rgba(26,37,80,0.5)';

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: months.map(m=>m.label),
      datasets: [{
        label: 'الإيرادات (د.ع)',
        data: months.map(m=>m.rev),
        backgroundColor: 'rgba(196,165,94,0.3)',
        borderColor: '#c4a55e',
        borderWidth: 1,
        borderRadius: 6,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: gc }, ticks: { color: tc, font: { family: 'Cairo' } } },
        y: { grid: { color: gc }, ticks: { color: tc, font: { family: 'Cairo' } }, beginAtZero: true }
      }
    }
  });
}

function renderConvChart(clients, sources) {
  const ctx = document.getElementById('convChart');
  if (!ctx || !window.Chart) return;

  const top = sources
    .map(s => ({
      name: s.name,
      conv: (() => {
        const sc = clients.filter(c=>c.sourceId===s.id);
        const cl = sc.filter(c=>c.status==='closed');
        return sc.length ? parseFloat(((cl.length/sc.length)*100).toFixed(1)) : 0;
      })()
    }))
    .filter(s=>s.conv>0)
    .slice(0,5);

  const isDark = document.body.getAttribute('data-theme') !== 'light';
  const tc = isDark ? 'rgba(160,144,112,0.8)' : 'rgba(26,37,80,0.5)';

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: top.map(s=>s.name),
      datasets: [{
        data: top.map(s=>s.conv),
        backgroundColor: ['#3498db','#9b59b6','#f39c12','#2ecc71','#e74c3c'].map(c=>c+'99'),
        borderColor:     ['#3498db','#9b59b6','#f39c12','#2ecc71','#e74c3c'],
        borderWidth: 1,
        borderRadius: 4,
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { display: false, beginAtZero: true, max: 100 },
        y: { ticks: { color: tc, font: { family: 'Cairo', size: 11 } }, grid: { display: false } }
      }
    }
  });
}
