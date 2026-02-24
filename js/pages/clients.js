/**
 * SCMS - Clients Page
 */

let clientsState = {
  filters: { status: 'all', sourceId: 'all', search: '', dateFrom: '', dateTo: '' },
  sort: { by: '', dir: 'asc' },
  page: 1,
  perPage: 10,
  selected: new Set(),
};

async function renderClients(container) {
  const sources = await Store.getSources();

  container.innerHTML = `
    <!-- Header -->
    <div class="section-header">
      <div class="section-title"><i class="fa-solid fa-users"></i> قائمة العملاء</div>
      <div class="flex gap-1">
        <button class="btn btn-secondary btn-sm" onclick="exportClientsToTSV()">
          <i class="fa-solid fa-file-export"></i> تصدير TSV
        </button>
        <button class="btn btn-primary" onclick="openClientModal()">
          <i class="fa-solid fa-plus"></i> إضافة عميل
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters-bar">
      <div class="filter-group">
        <i class="fa-solid fa-search" style="color:var(--text-muted)"></i>
        <input type="text" id="client-search" placeholder="بحث بالاسم أو الهاتف..."
          oninput="onClientFilter()" value="${clientsState.filters.search}"
          style="min-width:180px"/>
      </div>
      <div class="filter-group">
        <label>الحالة:</label>
        <select id="filter-status" onchange="onClientFilter()">
          <option value="all">الكل</option>
          ${Object.entries(STATUS_LABELS).map(([v,l]) =>
            `<option value="${v}" ${clientsState.filters.status===v?'selected':''}>${l}</option>`
          ).join('')}
        </select>
      </div>
      <div class="filter-group">
        <label>المصدر:</label>
        <select id="filter-source" onchange="onClientFilter()">
          <option value="all">الكل</option>
          ${sources.map(s =>
            `<option value="${s.id}" ${clientsState.filters.sourceId===s.id?'selected':''}>${s.name}</option>`
          ).join('')}
        </select>
      </div>
      <div class="filter-group">
        <label><i class="fa-solid fa-calendar"></i></label>
        <input type="date" id="filter-date-from" onchange="onClientFilter()" value="${clientsState.filters.dateFrom}"/>
        <span style="color:var(--text-muted);font-size:.8rem">إلى</span>
        <input type="date" id="filter-date-to" onchange="onClientFilter()" value="${clientsState.filters.dateTo}"/>
      </div>
      <button class="btn btn-ghost btn-sm" onclick="resetClientFilters()">
        <i class="fa-solid fa-rotate-left"></i> إعادة تعيين
      </button>
    </div>

    <!-- Per Page -->
    <div class="flex" style="align-items:center;gap:1rem;margin-bottom:.75rem">
      <span style="font-size:.8rem;color:var(--text-muted)">عرض:</span>
      <select class="form-control" style="width:80px;padding:5px 10px" onchange="changePerPage(this.value)">
        <option value="10" ${clientsState.perPage===10?'selected':''}>10</option>
        <option value="25" ${clientsState.perPage===25?'selected':''}>25</option>
        <option value="50" ${clientsState.perPage===50?'selected':''}>50</option>
      </select>
      <span id="clients-count-label" style="font-size:.8rem;color:var(--text-muted)"></span>
    </div>

    <!-- Table -->
    <div class="card" style="padding:0;overflow:hidden">
      <div class="table-wrap">
        <table class="data-table" id="clients-table">
          <thead>
            <tr>
              <th class="checkbox-col"><input type="checkbox" id="select-all" onchange="toggleSelectAll(this)"/></th>
              ${thSort('fullName',  'الاسم')}
              ${thSort('phone',     'الهاتف')}
              ${thSort('sourceId',  'المصدر')}
              ${thSort('status',    'الحالة')}
              ${thSort('dealValue', 'قيمة الصفقة')}
              ${thSort('followUpDate', 'المتابعة')}
              ${thSort('createdAt', 'التاريخ')}
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody id="clients-tbody">
            <tr><td colspan="9" class="flex-center" style="padding:2rem;color:var(--text-muted)">
              <i class="fa-solid fa-spinner fa-spin" style="margin-left:8px"></i> جاري التحميل...
            </td></tr>
          </tbody>
        </table>
      </div>
      <div id="clients-pagination" style="padding:0 1rem"></div>
    </div>
  `;

  await loadClientsTable();
}

function thSort(field, label) {
  const active = clientsState.sort.by === field;
  const dir = clientsState.sort.dir;
  return `<th class="${active?'sorted':''}" onclick="sortClients('${field}')">
    ${label}
    <i class="fa-solid fa-sort${active ? (dir==='asc'?'-up':'-down') : ''} sort-icon"></i>
  </th>`;
}

async function loadClientsTable() {
  const filters = {
    ...clientsState.filters,
    sortBy: clientsState.sort.by,
    sortDir: clientsState.sort.dir,
  };

  const all = await Store.getClients(filters);
  const total = all.length;
  const start = (clientsState.page - 1) * clientsState.perPage;
  const page = all.slice(start, start + clientsState.perPage);

  // Count label
  const lbl = document.getElementById('clients-count-label');
  if (lbl) lbl.textContent = `إجمالي ${total} عميل`;

  // Update nav badge
  const badge = document.getElementById('nav-clients-count');
  if (badge) badge.textContent = total;

  const tbody = document.getElementById('clients-tbody');
  if (!tbody) return;

  if (!page.length) {
    tbody.innerHTML = `<tr><td colspan="9">
      <div class="empty-state">
        <i class="fa-solid fa-users-slash"></i>
        <p>لا يوجد عملاء مطابقون للبحث</p>
      </div>
    </td></tr>`;
  } else {
    tbody.innerHTML = page.map(c => clientRow(c)).join('');
  }

  // Pagination
  renderPagination(total, 'clients-pagination', (p) => {
    clientsState.page = p;
    loadClientsTable();
  });
}

function clientRow(c) {
  const overdue = c.followUpDate && isOverdue(c.followUpDate) && c.status !== 'closed' && c.status !== 'lost';
  return `
    <tr id="row-${c.id}">
      <td><input type="checkbox" class="row-checkbox" value="${c.id}" onchange="toggleRowSelect('${c.id}', this)"/></td>
      <td><strong>${c.fullName}</strong>
        ${c.email ? `<br><small style="color:var(--text-muted)">${c.email}</small>` : ''}
      </td>
      <td><a href="tel:${c.phone}" style="color:var(--accent)">${c.phone}</a></td>
      <td>${sourceLabel(c.sourceId)}</td>
      <td>${statusBadge(c.status)}</td>
      <td>${formatCurrency(c.dealValue)}</td>
      <td style="${overdue ? 'color:var(--danger);font-weight:700' : ''}">
        ${c.followUpDate ? `<i class="fa-solid fa-calendar${overdue?'-exclamation':'-check'}" style="margin-left:4px"></i>${formatDate(c.followUpDate)}` : '—'}
      </td>
      <td style="color:var(--text-muted);font-size:.8rem">${formatDate(c.createdAt)}</td>
      <td>
        <div class="actions-menu">
          <button class="actions-trigger" onclick="toggleActionsMenu('${c.id}', event)">
            <i class="fa-solid fa-ellipsis-vertical"></i>
          </button>
          <div class="actions-dropdown" id="actions-${c.id}">
            <a href="#" onclick="viewClient('${c.id}')"><i class="fa-solid fa-eye"></i> عرض</a>
            <a href="#" onclick="openClientModal('${c.id}')"><i class="fa-solid fa-pen"></i> تعديل</a>
            <a href="#" onclick="openStatusModal('${c.id}')"><i class="fa-solid fa-arrow-right-arrow-left"></i> تغيير الحالة</a>
            <div class="dropdown-divider"></div>
            <a href="#" class="danger" onclick="deleteClientConfirm('${c.id}')"><i class="fa-solid fa-trash"></i> حذف</a>
          </div>
        </div>
      </td>
    </tr>
  `;
}

function toggleActionsMenu(id, e) {
  e.stopPropagation();
  const menu = document.getElementById(`actions-${id}`);
  document.querySelectorAll('.actions-dropdown.show').forEach(d => {
    if (d !== menu) d.classList.remove('show');
  });
  menu?.classList.toggle('show');
}

// ---- Filters ----
const onClientFilterDebounced = debounce(() => {
  clientsState.page = 1;
  loadClientsTable();
}, 300);

function onClientFilter() {
  clientsState.filters.search   = document.getElementById('client-search')?.value || '';
  clientsState.filters.status   = document.getElementById('filter-status')?.value  || 'all';
  clientsState.filters.sourceId = document.getElementById('filter-source')?.value  || 'all';
  clientsState.filters.dateFrom = document.getElementById('filter-date-from')?.value || '';
  clientsState.filters.dateTo   = document.getElementById('filter-date-to')?.value   || '';
  onClientFilterDebounced();
}

function resetClientFilters() {
  clientsState.filters = { status: 'all', sourceId: 'all', search: '', dateFrom: '', dateTo: '' };
  clientsState.page = 1;
  ['client-search','filter-date-from','filter-date-to'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  ['filter-status','filter-source'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = 'all';
  });
  loadClientsTable();
}

function sortClients(field) {
  if (clientsState.sort.by === field) {
    clientsState.sort.dir = clientsState.sort.dir === 'asc' ? 'desc' : 'asc';
  } else {
    clientsState.sort.by  = field;
    clientsState.sort.dir = 'asc';
  }
  loadClientsTable();
}

function changePerPage(val) {
  clientsState.perPage = parseInt(val);
  clientsState.page = 1;
  loadClientsTable();
}

// ---- Select ----
function toggleSelectAll(cb) {
  document.querySelectorAll('.row-checkbox').forEach(c => {
    c.checked = cb.checked;
    if (cb.checked) clientsState.selected.add(c.value);
    else clientsState.selected.clear();
  });
}

function toggleRowSelect(id, cb) {
  if (cb.checked) clientsState.selected.add(id);
  else clientsState.selected.delete(id);
}

// ---- Pagination Helper ----
function renderPagination(total, containerId, callback) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const totalPages = Math.ceil(total / clientsState.perPage);
  if (totalPages <= 1) { container.innerHTML = ''; return; }

  let html = '<div class="pagination">';
  html += `<button class="page-btn" onclick="(${callback.toString()})(${clientsState.page - 1})" ${clientsState.page===1?'disabled':''}>
    <i class="fa-solid fa-chevron-right"></i>
  </button>`;

  for (let p = 1; p <= totalPages; p++) {
    if (totalPages > 7 && p > 2 && p < totalPages - 1 && Math.abs(p - clientsState.page) > 1) {
      if (p === 3 || p === totalPages - 2) html += '<span style="padding:0 4px;color:var(--text-muted)">...</span>';
      continue;
    }
    html += `<button class="page-btn ${p === clientsState.page ? 'active' : ''}" onclick="(${callback.toString()})(${p})">${p}</button>`;
  }

  html += `<button class="page-btn" onclick="(${callback.toString()})(${clientsState.page + 1})" ${clientsState.page===totalPages?'disabled':''}>
    <i class="fa-solid fa-chevron-left"></i>
  </button>`;
  html += '</div>';
  container.innerHTML = html;
}

// ---- Add/Edit Client Modal ----
async function openClientModal(id = null) {
  const sources = await Store.getSources();
  const users   = await Store.getUsers();
  let c = id ? await Store.getClientById(id) : {};
  if (!c) c = {};

  const title = id ? 'تعديل بيانات العميل' : 'إضافة عميل جديد';

  const html = `
    <div class="modal-body">
      <div class="form-row">
        <div class="form-group">
          <label><i class="fa-solid fa-user"></i> الاسم الكامل <span style="color:var(--danger)">*</span></label>
          <input class="form-control" id="cf-name" value="${c.fullName||''}" placeholder="الاسم الثلاثي"/>
        </div>
        <div class="form-group">
          <label><i class="fa-solid fa-phone"></i> رقم الهاتف <span style="color:var(--danger)">*</span></label>
          <input class="form-control" id="cf-phone" value="${c.phone||''}" placeholder="07X-XXXXXXX"/>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label><i class="fa-solid fa-envelope"></i> البريد الإلكتروني</label>
          <input class="form-control" id="cf-email" value="${c.email||''}" placeholder="اختياري"/>
        </div>
        <div class="form-group">
          <label><i class="fa-solid fa-layer-group"></i> المصدر</label>
          <select class="form-control" id="cf-source">
            <option value="">اختر المصدر</option>
            ${sources.filter(s=>s.active).map(s =>
              `<option value="${s.id}" ${c.sourceId===s.id?'selected':''}>${s.name}</option>`
            ).join('')}
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label><i class="fa-solid fa-tag"></i> الحالة</label>
          <select class="form-control" id="cf-status">
            ${Object.entries(STATUS_LABELS).map(([v,l]) =>
              `<option value="${v}" ${(c.status||'new')===v?'selected':''}>${l}</option>`
            ).join('')}
          </select>
        </div>
        <div class="form-group">
          <label><i class="fa-solid fa-coins"></i> قيمة الصفقة (د.ع)</label>
          <input class="form-control" id="cf-value" type="number" value="${c.dealValue||''}" placeholder="0"/>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label><i class="fa-solid fa-user-tie"></i> مسند إلى</label>
          <select class="form-control" id="cf-assigned">
            <option value="">اختر المسؤول</option>
            ${users.map(u =>
              `<option value="${u.id}" ${c.assignedTo===u.id?'selected':''}>${u.name}</option>`
            ).join('')}
          </select>
        </div>
        <div class="form-group">
          <label><i class="fa-solid fa-calendar-check"></i> موعد المتابعة</label>
          <input class="form-control" id="cf-followup" type="date" value="${c.followUpDate||''}"/>
        </div>
      </div>
      <div class="form-group">
        <label><i class="fa-solid fa-note-sticky"></i> ملاحظات</label>
        <textarea class="form-control" id="cf-notes" rows="3" placeholder="ملاحظات إضافية...">${c.notes||''}</textarea>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-primary" onclick="saveClientForm('${id||''}')">
        <i class="fa-solid fa-floppy-disk"></i> حفظ
      </button>
      <button class="btn btn-ghost" onclick="closeModal()">إلغاء</button>
    </div>
  `;

  openModal(html, title);
}

async function saveClientForm(id) {
  const name  = document.getElementById('cf-name')?.value.trim();
  const phone = document.getElementById('cf-phone')?.value.trim();

  if (!name || !phone) {
    showToast('يرجى إدخال الاسم الكامل ورقم الهاتف', 'warning');
    return;
  }

  const client = {
    id: id || null,
    fullName:    name,
    phone,
    email:       document.getElementById('cf-email')?.value.trim() || '',
    sourceId:    document.getElementById('cf-source')?.value || '',
    status:      document.getElementById('cf-status')?.value || 'new',
    dealValue:   Number(document.getElementById('cf-value')?.value) || 0,
    assignedTo:  document.getElementById('cf-assigned')?.value || '',
    followUpDate:document.getElementById('cf-followup')?.value || '',
    notes:       document.getElementById('cf-notes')?.value.trim() || '',
  };

  const res = await Store.saveClient(client);
  if (res.success) {
    closeModal();
    showToast(id ? 'تم تحديث بيانات العميل' : 'تمت إضافة العميل بنجاح', 'success');
    if (!id) Store.addNotification(`عميل جديد: ${name}`, 'fa-user-plus');
    await loadClientsTable();
  } else {
    showToast('حدث خطأ أثناء الحفظ', 'error');
  }
}

// ---- View Client ----
async function viewClient(id) {
  const c = await Store.getClientById(id);
  if (!c) return;

  const html = `
    <div class="modal-body">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
        ${infoRow('الاسم الكامل', c.fullName, 'fa-user')}
        ${infoRow('الهاتف', `<a href="tel:${c.phone}" style="color:var(--accent)">${c.phone}</a>`, 'fa-phone')}
        ${infoRow('البريد الإلكتروني', c.email||'—', 'fa-envelope')}
        ${infoRow('المصدر', sourceLabel(c.sourceId), 'fa-layer-group')}
        ${infoRow('الحالة', statusBadge(c.status), 'fa-tag')}
        ${infoRow('قيمة الصفقة', formatCurrency(c.dealValue), 'fa-coins')}
        ${infoRow('مسند إلى', userLabel(c.assignedTo), 'fa-user-tie')}
        ${infoRow('موعد المتابعة', formatDate(c.followUpDate), 'fa-calendar')}
        ${infoRow('تاريخ الإضافة', formatDate(c.createdAt), 'fa-clock')}
      </div>
      ${c.notes ? `<div style="margin-top:1rem;background:var(--bg-secondary);padding:1rem;border-radius:var(--radius);border-right:3px solid var(--accent)">
        <div style="font-size:.75rem;color:var(--text-muted);margin-bottom:.5rem"><i class="fa-solid fa-note-sticky"></i> ملاحظات</div>
        <div style="font-size:.875rem">${c.notes}</div>
      </div>` : ''}
    </div>
    <div class="modal-footer">
      <button class="btn btn-primary" onclick="closeModal();openClientModal('${id}')">
        <i class="fa-solid fa-pen"></i> تعديل
      </button>
      <button class="btn btn-ghost" onclick="closeModal()">إغلاق</button>
    </div>
  `;
  openModal(html, 'بيانات العميل');
}

function infoRow(label, value, icon) {
  return `
    <div>
      <div style="font-size:.72rem;color:var(--text-muted);margin-bottom:4px;display:flex;align-items:center;gap:6px">
        <i class="fa-solid ${icon}" style="color:var(--accent)"></i> ${label}
      </div>
      <div style="font-size:.9rem;font-weight:600">${value}</div>
    </div>
  `;
}

// ---- Status Modal ----
async function openStatusModal(id) {
  const c = await Store.getClientById(id);
  if (!c) return;

  const html = `
    <div class="modal-body">
      <p style="color:var(--text-secondary);margin-bottom:1rem">تغيير حالة العميل: <strong>${c.fullName}</strong></p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem">
        ${Object.entries(STATUS_LABELS).map(([v,l]) => `
          <button class="btn ${c.status===v ? 'btn-primary' : 'btn-secondary'}"
            onclick="changeClientStatus('${id}','${v}')"
            style="justify-content:center">
            ${l}
          </button>
        `).join('')}
      </div>
    </div>
  `;
  openModal(html, 'تغيير حالة العميل');
}

async function changeClientStatus(id, status) {
  await Store.updateClientStatus(id, status);
  closeModal();
  showToast(`تم تغيير الحالة إلى "${STATUS_LABELS[status]}"`, 'success');
  await loadClientsTable();
}

// ---- Delete ----
function deleteClientConfirm(id) {
  showConfirm('حذف العميل', 'هل أنت متأكد من حذف هذا العميل؟ لا يمكن التراجع.', async () => {
    const res = await Store.deleteClient(id);
    if (res.success) {
      showToast('تم حذف العميل', 'success');
      await loadClientsTable();
    } else {
      showToast('حدث خطأ أثناء الحذف', 'error');
    }
  });
}

// ---- Export TSV ----
async function exportClientsToTSV() {
  const clients = await Store.getClients(clientsState.filters);
  const sources = await Store.getSources();
  const users   = await Store.getUsers();

  const headers = ['الاسم','الهاتف','البريد الإلكتروني','المصدر','الحالة','قيمة الصفقة (د.ع)','ملاحظات','مسند إلى','موعد المتابعة','تاريخ الإضافة'];
  const rows = clients.map(c => [
    c.fullName,
    c.phone,
    c.email||'',
    sources.find(s=>s.id===c.sourceId)?.name || '',
    STATUS_LABELS[c.status] || c.status,
    c.dealValue||0,
    c.notes||'',
    users.find(u=>u.id===c.assignedTo)?.name || '',
    c.followUpDate||'',
    c.createdAt ? c.createdAt.split('T')[0] : '',
  ]);

  const tsv = [headers, ...rows].map(r => r.join('\t')).join('\n');
  const bom = '\uFEFF'; // BOM for Arabic
  const blob = new Blob([bom + tsv], { type: 'text/tab-separated-values;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `SCMS_Clients_${new Date().toISOString().split('T')[0]}.tsv`;
  a.click();
  URL.revokeObjectURL(url);

  // Show how-to message
  showToast('تم تصدير الملف! لفتحه: افتح Excel ← بيانات ← من نص/CSV، أو افتحه في Google Sheets', 'info', 6000);
}
