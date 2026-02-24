/**
 * SCMS - Sources Page
 */
async function renderSources(container) {
  const sources = await Store.getSources();

  container.innerHTML = `
    <div class="section-header">
      <div class="section-title"><i class="fa-solid fa-layer-group"></i> إدارة المصادر</div>
      <button class="btn btn-primary" onclick="openSourceModal()">
        <i class="fa-solid fa-plus"></i> إضافة مصدر
      </button>
    </div>
    <div class="card" style="padding:0;overflow:hidden">
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>اسم المصدر</th>
              <th>الحالة</th>
              <th>تاريخ الإضافة</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody id="sources-tbody">
            ${sources.length ? sources.map(s => `
              <tr>
                <td><strong>${s.name}</strong></td>
                <td>
                  <span class="badge ${s.active ? 'badge-closed' : 'badge-lost'}">
                    ${s.active ? 'نشط' : 'معطل'}
                  </span>
                </td>
                <td style="color:var(--text-muted);font-size:.8rem">${formatDate(s.createdAt)}</td>
                <td>
                  <div style="display:flex;gap:6px">
                    <button class="btn btn-secondary btn-sm" onclick="openSourceModal('${s.id}')">
                      <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="btn btn-secondary btn-sm" onclick="toggleSourceStatus('${s.id}', ${s.active})">
                      <i class="fa-solid fa-power-off"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="deleteSourceConfirm('${s.id}')">
                      <i class="fa-solid fa-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            `).join('') : '<tr><td colspan="4"><div class="empty-state"><i class="fa-solid fa-layer-group"></i><p>لا توجد مصادر مضافة</p></div></td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function openSourceModal(id = null) {
  const sources = Store.get('sources') || [];
  const s = id ? sources.find(x => x.id === id) : {};

  const html = `
    <div class="modal-body">
      <div class="form-group">
        <label><i class="fa-solid fa-tag"></i> اسم المصدر</label>
        <input class="form-control" id="src-name" value="${s?.name||''}" placeholder="مثال: إعلانات فيسبوك"/>
      </div>
      <div class="form-group">
        <label><i class="fa-solid fa-toggle-on"></i> الحالة</label>
        <select class="form-control" id="src-active">
          <option value="1" ${s?.active!==false?'selected':''}>نشط</option>
          <option value="0" ${s?.active===false?'selected':''}>معطل</option>
        </select>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-primary" onclick="saveSource('${id||''}')">
        <i class="fa-solid fa-floppy-disk"></i> حفظ
      </button>
      <button class="btn btn-ghost" onclick="closeModal()">إلغاء</button>
    </div>
  `;
  openModal(html, id ? 'تعديل المصدر' : 'إضافة مصدر جديد');
}

async function saveSource(id) {
  const name   = document.getElementById('src-name')?.value.trim();
  const active = document.getElementById('src-active')?.value === '1';
  if (!name) { showToast('يرجى إدخال اسم المصدر', 'warning'); return; }
  await Store.saveSource({ id: id||null, name, active });
  closeModal();
  showToast(id ? 'تم تحديث المصدر' : 'تمت إضافة المصدر', 'success');
  renderSources(document.getElementById('content-area'));
}

async function toggleSourceStatus(id, currentActive) {
  const sources = Store.get('sources') || [];
  const idx = sources.findIndex(s=>s.id===id);
  if (idx>=0) {
    sources[idx].active = !currentActive;
    Store.set('sources', sources);
    showToast(`تم ${!currentActive ? 'تفعيل' : 'تعطيل'} المصدر`, 'info');
    renderSources(document.getElementById('content-area'));
  }
}

function deleteSourceConfirm(id) {
  showConfirm('حذف المصدر', 'هل أنت متأكد؟ لن يمكن التراجع.', async () => {
    await Store.deleteSource(id);
    showToast('تم حذف المصدر', 'success');
    renderSources(document.getElementById('content-area'));
  });
}

// ============================================================
// USERS PAGE
// ============================================================
async function renderUsers(container) {
  const users = await Store.getUsers();

  container.innerHTML = `
    <div class="section-header">
      <div class="section-title"><i class="fa-solid fa-user-shield"></i> إدارة المستخدمين</div>
      <button class="btn btn-primary" onclick="openUserModal()">
        <i class="fa-solid fa-plus"></i> إضافة مستخدم
      </button>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:1rem">
      ${users.map(u => `
        <div class="card" style="display:flex;align-items:flex-start;gap:1rem">
          <div style="width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,var(--accent),var(--beige-300));
            display:flex;align-items:center;justify-content:center;font-size:1.2rem;font-weight:900;
            color:var(--navy-900);flex-shrink:0">${u.name?.charAt(0)||'U'}</div>
          <div style="flex:1;min-width:0">
            <div style="font-weight:700;margin-bottom:3px">${u.name}</div>
            <div style="font-size:.78rem;color:var(--text-muted);margin-bottom:8px">${u.email}</div>
            <div style="display:flex;align-items:center;gap:8px">
              <span class="badge ${u.role==='admin'?'badge-closed':'badge-new'}">
                ${u.role==='admin'?'مدير':'موظف'}
              </span>
              <span class="badge ${u.active?'badge-closed':'badge-lost'}">
                ${u.active?'نشط':'معطل'}
              </span>
            </div>
          </div>
          <div style="display:flex;flex-direction:column;gap:6px">
            <button class="btn btn-secondary btn-sm" onclick="openUserModal('${u.id}')">
              <i class="fa-solid fa-pen"></i>
            </button>
            <button class="btn btn-danger btn-sm" onclick="deleteUserConfirm('${u.id}')">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </div>
      `).join('') || '<div class="empty-state"><i class="fa-solid fa-users"></i><p>لا يوجد مستخدمون</p></div>'}
    </div>
  `;
}

function openUserModal(id = null) {
  const users = Store.get('users') || [];
  const u = id ? users.find(x=>x.id===id) : {};

  const html = `
    <div class="modal-body">
      <div class="form-row">
        <div class="form-group">
          <label><i class="fa-solid fa-user"></i> الاسم الكامل</label>
          <input class="form-control" id="uf-name" value="${u?.name||''}"/>
        </div>
        <div class="form-group">
          <label><i class="fa-solid fa-envelope"></i> البريد الإلكتروني</label>
          <input class="form-control" id="uf-email" value="${u?.email||''}" type="email"/>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label><i class="fa-solid fa-shield"></i> الصلاحية</label>
          <select class="form-control" id="uf-role">
            <option value="admin" ${u?.role==='admin'?'selected':''}>مدير (Admin)</option>
            <option value="staff" ${u?.role==='staff'?'selected':''}>موظف (Staff)</option>
          </select>
        </div>
        <div class="form-group">
          <label><i class="fa-solid fa-toggle-on"></i> الحالة</label>
          <select class="form-control" id="uf-active">
            <option value="1" ${u?.active!==false?'selected':''}>نشط</option>
            <option value="0" ${u?.active===false?'selected':''}>معطل</option>
          </select>
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-primary" onclick="saveUser('${id||''}')">
        <i class="fa-solid fa-floppy-disk"></i> حفظ
      </button>
      <button class="btn btn-ghost" onclick="closeModal()">إلغاء</button>
    </div>
  `;
  openModal(html, id ? 'تعديل المستخدم' : 'إضافة مستخدم جديد');
}

async function saveUser(id) {
  const name  = document.getElementById('uf-name')?.value.trim();
  const email = document.getElementById('uf-email')?.value.trim();
  if (!name || !email) { showToast('يرجى إدخال الاسم والبريد الإلكتروني', 'warning'); return; }
  await Store.saveUser({
    id: id||null, name, email,
    role:   document.getElementById('uf-role')?.value   || 'staff',
    active: document.getElementById('uf-active')?.value === '1',
  });
  closeModal();
  showToast(id ? 'تم تحديث المستخدم' : 'تمت إضافة المستخدم', 'success');
  renderUsers(document.getElementById('content-area'));
}

function deleteUserConfirm(id) {
  const cur = getCurrentUser();
  if (cur && cur.id === id) { showToast('لا يمكنك حذف حسابك الحالي', 'warning'); return; }
  showConfirm('حذف المستخدم', 'هل أنت متأكد؟', async () => {
    await Store.deleteUser(id);
    showToast('تم حذف المستخدم', 'success');
    renderUsers(document.getElementById('content-area'));
  });
}

// ============================================================
// SETTINGS PAGE
// ============================================================
function renderSettings(container) {
  const savedCfg = JSON.parse(localStorage.getItem('scms_firebase_config') || '{}');
  const theme = localStorage.getItem('scms_theme') || 'dark';
  const lang  = localStorage.getItem('scms_lang')  || 'ar';

  container.innerHTML = `
    <div class="section-header">
      <div class="section-title"><i class="fa-solid fa-gear"></i> الإعدادات</div>
    </div>

    <div class="settings-grid">
      <!-- Settings Nav -->
      <div class="card" style="padding:1rem">
        <div class="settings-nav">
          <div class="settings-nav-item active" onclick="switchSettingsTab('appearance',this)">
            <i class="fa-solid fa-palette"></i> المظهر
          </div>
          <div class="settings-nav-item" onclick="switchSettingsTab('firebase',this)">
            <i class="fa-solid fa-database"></i> ربط Firebase
          </div>
          <div class="settings-nav-item" onclick="switchSettingsTab('account',this)">
            <i class="fa-solid fa-user-gear"></i> الحساب
          </div>
          <div class="settings-nav-item" onclick="switchSettingsTab('data',this)">
            <i class="fa-solid fa-file-export"></i> البيانات
          </div>
        </div>
      </div>

      <!-- Settings Content -->
      <div>
        <!-- Appearance -->
        <div class="card settings-section active" id="tab-appearance">
          <div class="section-title mb-2"><i class="fa-solid fa-palette"></i> المظهر</div>

          <div class="settings-row">
            <div class="settings-row-info">
              <h4>الوضع الداكن</h4>
              <p>التبديل بين الوضع الداكن والفاتح</p>
            </div>
            <div class="toggle-switch ${theme==='dark'?'on':''}" id="dark-toggle" onclick="toggleDarkMode()"></div>
          </div>

          <div class="settings-row">
            <div class="settings-row-info">
              <h4>حجم الخط</h4>
              <p>تغيير حجم خط واجهة البرنامج</p>
            </div>
            <select class="form-control" style="width:120px" onchange="changeFontSize(this.value)" id="font-size-select">
              <option value="14" ${(localStorage.getItem('scms_fontsize')||'15')==='14'?'selected':''}>صغير</option>
              <option value="15" ${(localStorage.getItem('scms_fontsize')||'15')==='15'?'selected':''}>متوسط</option>
              <option value="16" ${(localStorage.getItem('scms_fontsize')||'15')==='16'?'selected':''}>كبير</option>
            </select>
          </div>

          <div class="settings-row">
            <div class="settings-row-info">
              <h4>تقليص الشريط الجانبي تلقائياً</h4>
              <p>طيّ الشريط عند الشاشات الصغيرة</p>
            </div>
            <div class="toggle-switch ${localStorage.getItem('scms_autosidebar')==='1'?'on':''}"
              onclick="toggleAutoSidebar(this)"></div>
          </div>
        </div>

        <!-- Firebase -->
        <div class="card settings-section" id="tab-firebase">
          <div class="section-title mb-2"><i class="fa-solid fa-database"></i> ربط Firebase</div>
          <p style="color:var(--text-secondary);font-size:.875rem;margin-bottom:1.5rem;line-height:1.7">
            ربط النظام بمشروع Firebase الخاص بك لتخزين البيانات بشكل دائم في السحابة.
            البيانات حالياً محفوظة محلياً في المتصفح (وضع تجريبي).
          </p>

          <div class="firebase-setup-card">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:1rem">
              <i class="fa-solid fa-circle${window.FIREBASE_INITIALIZED?'-check':'-xmark'}"
                style="color:${window.FIREBASE_INITIALIZED?'var(--success)':'var(--danger)'}"></i>
              <strong>${window.FIREBASE_INITIALIZED ? 'متصل بـ Firebase' : 'غير متصل (وضع تجريبي)'}</strong>
            </div>

            <div class="form-group">
              <label><i class="fa-solid fa-key"></i> API Key</label>
              <input class="form-control" id="fb-apikey" value="${savedCfg.apiKey||''}" placeholder="AIza..."/>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label><i class="fa-solid fa-server"></i> Auth Domain</label>
                <input class="form-control" id="fb-authdomain" value="${savedCfg.authDomain||''}" placeholder="project.firebaseapp.com"/>
              </div>
              <div class="form-group">
                <label><i class="fa-solid fa-database"></i> Project ID</label>
                <input class="form-control" id="fb-projectid" value="${savedCfg.projectId||''}" placeholder="your-project-id"/>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label><i class="fa-solid fa-hard-drive"></i> Storage Bucket</label>
                <input class="form-control" id="fb-storagebucket" value="${savedCfg.storageBucket||''}" placeholder="project.appspot.com"/>
              </div>
              <div class="form-group">
                <label><i class="fa-solid fa-message"></i> Messaging Sender ID</label>
                <input class="form-control" id="fb-senderid" value="${savedCfg.messagingSenderId||''}" placeholder="123456789"/>
              </div>
            </div>
            <div class="form-group">
              <label><i class="fa-solid fa-fingerprint"></i> App ID</label>
              <input class="form-control" id="fb-appid" value="${savedCfg.appId||''}" placeholder="1:xxx:web:xxx"/>
            </div>

            <div style="display:flex;gap:10px;margin-top:1rem">
              <button class="btn btn-primary" onclick="saveFirebaseConfig()">
                <i class="fa-solid fa-link"></i> حفظ والاتصال
              </button>
              <button class="btn btn-danger btn-sm" onclick="clearFirebaseConfig()">
                <i class="fa-solid fa-unlink"></i> فصل الاتصال
              </button>
            </div>

            <div style="margin-top:1.5rem;padding:1rem;background:var(--bg-secondary);border-radius:var(--radius);font-size:.8rem;color:var(--text-muted)">
              <i class="fa-solid fa-circle-info" style="color:var(--accent)"></i>
              <strong> خطوات الربط:</strong><br>
              1. اذهب إلى <a href="https://console.firebase.google.com" target="_blank" style="color:var(--accent)">console.firebase.google.com</a><br>
              2. أنشئ مشروعاً جديداً أو اختر موجوداً<br>
              3. أضف تطبيق ويب واحصل على الإعدادات<br>
              4. فعّل Authentication (Email/Password) و Firestore Database<br>
              5. الصق الإعدادات في الحقول أعلاه واضغط حفظ
            </div>
          </div>
        </div>

        <!-- Account -->
        <div class="card settings-section" id="tab-account">
          <div class="section-title mb-2"><i class="fa-solid fa-user-gear"></i> إعدادات الحساب</div>
          ${renderAccountSettings()}
        </div>

        <!-- Data -->
        <div class="card settings-section" id="tab-data">
          <div class="section-title mb-2"><i class="fa-solid fa-database"></i> إدارة البيانات</div>

          <div class="settings-row">
            <div class="settings-row-info">
              <h4>تصدير جميع البيانات</h4>
              <p>تصدير بيانات العملاء بصيغة TSV لفتحها في Excel أو Google Sheets</p>
            </div>
            <button class="btn btn-secondary" onclick="exportClientsToTSV()">
              <i class="fa-solid fa-file-export"></i> تصدير
            </button>
          </div>

          <div class="settings-row">
            <div class="settings-row-info">
              <h4>إعادة تعيين البيانات التجريبية</h4>
              <p style="color:var(--danger)">سيتم حذف جميع البيانات واستعادة البيانات التجريبية</p>
            </div>
            <button class="btn btn-danger" onclick="resetDemoData()">
              <i class="fa-solid fa-rotate-left"></i> إعادة تعيين
            </button>
          </div>

          <div style="margin-top:1.5rem;padding:1rem;background:var(--bg-secondary);border-radius:var(--radius);font-size:.8rem">
            <strong><i class="fa-solid fa-circle-question" style="color:var(--accent)"></i> كيف أفتح ملف TSV؟</strong><br><br>
            <strong>Microsoft Excel:</strong> افتح Excel ← بيانات ← من نص/CSV ← اختر الملف ← Delimited ← Tab<br><br>
            <strong>Google Sheets:</strong> افتح Sheets ← ملف ← استيراد ← ارفع الملف ← فاصل: Tab<br><br>
            <strong>LibreOffice Calc:</strong> افتح LibreOffice ← اختر الملف ← فاصل: Tab
          </div>
        </div>
      </div>
    </div>
  `;

  // Apply saved font size
  const fs = localStorage.getItem('scms_fontsize');
  if (fs) document.documentElement.style.fontSize = fs + 'px';
}

function renderAccountSettings() {
  const user = getCurrentUser() || {};
  return `
    <div class="form-row">
      <div class="form-group">
        <label><i class="fa-solid fa-user"></i> الاسم</label>
        <input class="form-control" id="acc-name" value="${user.name||''}"/>
      </div>
      <div class="form-group">
        <label><i class="fa-solid fa-envelope"></i> البريد الإلكتروني</label>
        <input class="form-control" id="acc-email" value="${user.email||''}" type="email"/>
      </div>
    </div>
    <button class="btn btn-primary" onclick="saveAccountSettings()">
      <i class="fa-solid fa-floppy-disk"></i> حفظ التغييرات
    </button>
  `;
}

function saveAccountSettings() {
  const user  = getCurrentUser() || {};
  user.name  = document.getElementById('acc-name')?.value.trim() || user.name;
  user.email = document.getElementById('acc-email')?.value.trim() || user.email;
  sessionStorage.setItem('scms_user', JSON.stringify(user));
  document.getElementById('user-name-display').textContent = user.name;
  document.getElementById('user-avatar').textContent = user.name.charAt(0);
  showToast('تم حفظ إعدادات الحساب', 'success');
}

function switchSettingsTab(tab, el) {
  document.querySelectorAll('.settings-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.settings-nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById(`tab-${tab}`)?.classList.add('active');
  el.classList.add('active');
}

function toggleDarkMode() {
  const body  = document.body;
  const current = body.getAttribute('data-theme');
  const next  = current === 'dark' ? 'light' : 'dark';
  body.setAttribute('data-theme', next);
  localStorage.setItem('scms_theme', next);
  const tog = document.getElementById('dark-toggle');
  if (tog) tog.classList.toggle('on', next === 'dark');
  showToast(`تم التبديل إلى الوضع ${next === 'dark' ? 'الداكن' : 'الفاتح'}`, 'info');
}

function changeFontSize(size) {
  document.documentElement.style.fontSize = size + 'px';
  localStorage.setItem('scms_fontsize', size);
  showToast('تم تغيير حجم الخط', 'info');
}

function toggleAutoSidebar(tog) {
  tog.classList.toggle('on');
  localStorage.setItem('scms_autosidebar', tog.classList.contains('on') ? '1' : '0');
}

async function saveFirebaseConfig() {
  const cfg = {
    apiKey:            document.getElementById('fb-apikey')?.value.trim(),
    authDomain:        document.getElementById('fb-authdomain')?.value.trim(),
    projectId:         document.getElementById('fb-projectid')?.value.trim(),
    storageBucket:     document.getElementById('fb-storagebucket')?.value.trim(),
    messagingSenderId: document.getElementById('fb-senderid')?.value.trim(),
    appId:             document.getElementById('fb-appid')?.value.trim(),
  };

  if (!cfg.apiKey || !cfg.projectId) {
    showToast('يرجى إدخال API Key و Project ID على الأقل', 'warning');
    return;
  }

  localStorage.setItem('scms_firebase_config', JSON.stringify(cfg));
  showToast('جاري الاتصال بـ Firebase...', 'info');

  const ok = await initFirebase(cfg);
  if (ok) {
    showToast('تم الاتصال بـ Firebase بنجاح!', 'success');
  } else {
    showToast('فشل الاتصال. تحقق من الإعدادات.', 'error');
  }
}

function clearFirebaseConfig() {
  showConfirm('فصل Firebase', 'هل أنت متأكد؟ ستعمل البيانات محلياً.', () => {
    localStorage.removeItem('scms_firebase_config');
    window.FIREBASE_INITIALIZED = false;
    window.db   = null;
    window.auth = null;
    showToast('تم فصل الاتصال بـ Firebase', 'info');
  });
}

function resetDemoData() {
  showConfirm('إعادة تعيين البيانات', 'سيتم حذف جميع البيانات. هل أنت متأكد؟', () => {
    localStorage.removeItem('scms_demo_seeded');
    localStorage.removeItem('scms_clients');
    localStorage.removeItem('scms_sources');
    localStorage.removeItem('scms_users');
    localStorage.removeItem('scms_notifications');
    Store.seedDemo();
    showToast('تم إعادة تعيين البيانات التجريبية', 'success');
  });
}
