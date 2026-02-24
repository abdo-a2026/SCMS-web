/**
 * SCMS - Data Store
 * Handles both demo (localStorage) and Firebase modes
 */

const Store = {
  DEMO_MODE: true,

  // ---- Core Get/Set (localStorage) ----
  get(key) {
    try {
      return JSON.parse(localStorage.getItem(`scms_${key}`)) || null;
    } catch { return null; }
  },

  set(key, value) {
    localStorage.setItem(`scms_${key}`, JSON.stringify(value));
  },

  // ---- Seed Demo Data ----
  seedDemo() {
    if (this.get('demo_seeded')) return;

    // Sources
    this.set('sources', [
      { id: 's1', name: 'إعلانات فيسبوك', active: true, createdAt: '2025-01-01' },
      { id: 's2', name: 'إنستاغرام',       active: true, createdAt: '2025-01-01' },
      { id: 's3', name: 'إحالة من عميل',   active: true, createdAt: '2025-01-01' },
      { id: 's4', name: 'موقع الويب',       active: true, createdAt: '2025-01-01' },
      { id: 's5', name: 'واتساب',           active: true, createdAt: '2025-01-01' },
      { id: 's6', name: 'زيارة مباشرة',    active: false, createdAt: '2025-01-01' },
    ]);

    // Users
    this.set('users', [
      { id: 'u1', name: 'أحمد الموسى',    email: 'admin@scms.iq', role: 'admin',  active: true, createdAt: '2025-01-01' },
      { id: 'u2', name: 'سارة العبيدي',   email: 'sara@scms.iq',  role: 'staff',  active: true, createdAt: '2025-02-01' },
      { id: 'u3', name: 'محمد الجبوري',   email: 'mohd@scms.iq',  role: 'staff',  active: true, createdAt: '2025-02-15' },
    ]);

    // Clients
    const statuses = ['new','contacted','interested','negotiation','closed','lost'];
    const sources  = ['s1','s2','s3','s4','s5'];
    const users    = ['u1','u2','u3'];
    const names    = [
      'علي حسين الكريمي','فاطمة جاسم','حسين عبد الله','نور محمد الأنصاري',
      'كريم سالم العيساوي','زينب الربيعي','عمر طارق الجبوري','رنا أحمد الساعدي',
      'مصطفى حسن الدليمي','أسماء خالد النعيمي','باسم علي الشمري','ليلى عبد الرحمن',
      'ياسر فواز التميمي','هناء سعيد المحمداوي','قاسم ناصر الزيدي'
    ];

    const clients = names.map((name, i) => ({
      id: `c${i+1}`,
      fullName:   name,
      phone:      `07${['70','71','80','81','90'][i%5]}${String(1000000 + i*1234567).slice(0,7)}`,
      email:      `client${i+1}@example.com`,
      sourceId:   sources[i % sources.length],
      status:     statuses[i % statuses.length],
      dealValue:  [500000, 750000, 1200000, 250000, 2000000, 180000, 950000][i % 7],
      notes:      i % 3 === 0 ? 'عميل مهتم جداً، يحتاج متابعة دورية.' : '',
      assignedTo: users[i % users.length],
      followUpDate: i % 4 === 0 ? new Date(Date.now() - 86400000 * (i%3)).toISOString().split('T')[0] : 
                    i % 4 === 1 ? new Date(Date.now() + 86400000 * (i+1)).toISOString().split('T')[0] : '',
      createdAt:  new Date(2025, i%12, (i%28)+1).toISOString(),
      updatedAt:  new Date(2025, i%12, (i%28)+2).toISOString(),
    }));
    this.set('clients', clients);

    // Notifications
    this.set('notifications', [
      { id: 'n1', text: 'موعد متابعة مع علي حسين اليوم', read: false, time: new Date().toISOString(), icon: 'fa-calendar-check' },
      { id: 'n2', text: 'عميل جديد: نور محمد الأنصاري', read: false, time: new Date().toISOString(), icon: 'fa-user-plus' },
      { id: 'n3', text: 'تم إغلاق صفقة بقيمة ١،٢٠٠،٠٠٠ د.ع', read: true,  time: new Date().toISOString(), icon: 'fa-circle-check' },
    ]);

    this.set('demo_seeded', true);
  },

  // ---- CLIENTS ----
  async getClients(filters = {}) {
    if (window.FIREBASE_INITIALIZED && window.db) {
      return this._getClientsFirebase(filters);
    }
    let data = this.get('clients') || [];
    return this._filterClients(data, filters);
  },

  _filterClients(data, filters) {
    let result = [...data];
    if (filters.status && filters.status !== 'all')
      result = result.filter(c => c.status === filters.status);
    if (filters.sourceId && filters.sourceId !== 'all')
      result = result.filter(c => c.sourceId === filters.sourceId);
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(c =>
        c.fullName?.toLowerCase().includes(q) ||
        c.phone?.includes(q) ||
        c.email?.toLowerCase().includes(q)
      );
    }
    if (filters.dateFrom)
      result = result.filter(c => c.createdAt >= filters.dateFrom);
    if (filters.dateTo)
      result = result.filter(c => c.createdAt <= filters.dateTo + 'T23:59:59');
    if (filters.sortBy) {
      result.sort((a, b) => {
        let va = a[filters.sortBy], vb = b[filters.sortBy];
        if (typeof va === 'string') va = va.toLowerCase();
        if (typeof vb === 'string') vb = vb.toLowerCase();
        if (va < vb) return filters.sortDir === 'asc' ? -1 : 1;
        if (va > vb) return filters.sortDir === 'asc' ? 1 : -1;
        return 0;
      });
    } else {
      result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    return result;
  },

  async getClientById(id) {
    const clients = this.get('clients') || [];
    return clients.find(c => c.id === id) || null;
  },

  async saveClient(client) {
    if (window.FIREBASE_INITIALIZED && window.db) {
      return this._saveClientFirebase(client);
    }
    const clients = this.get('clients') || [];
    const isNew = !client.id;
    if (isNew) {
      client.id = genId();
      client.createdAt = nowISO();
    }
    client.updatedAt = nowISO();
    if (isNew) {
      clients.unshift(client);
    } else {
      const idx = clients.findIndex(c => c.id === client.id);
      if (idx >= 0) clients[idx] = client;
    }
    this.set('clients', clients);
    return { success: true, client };
  },

  async deleteClient(id) {
    if (window.FIREBASE_INITIALIZED && window.db) {
      return this._deleteClientFirebase(id);
    }
    let clients = this.get('clients') || [];
    clients = clients.filter(c => c.id !== id);
    this.set('clients', clients);
    return { success: true };
  },

  async updateClientStatus(id, status) {
    const clients = this.get('clients') || [];
    const idx = clients.findIndex(c => c.id === id);
    if (idx >= 0) {
      clients[idx].status = status;
      clients[idx].updatedAt = nowISO();
      this.set('clients', clients);
    }
    if (window.FIREBASE_INITIALIZED && window.db) {
      await window.db.collection('clients').doc(id).update({ status, updatedAt: nowISO() });
    }
    return { success: true };
  },

  // ---- SOURCES ----
  async getSources() {
    if (window.FIREBASE_INITIALIZED && window.db) {
      try {
        const snap = await window.db.collection('sources').get();
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
      } catch (e) {}
    }
    return this.get('sources') || [];
  },

  async saveSource(src) {
    const sources = this.get('sources') || [];
    const isNew = !src.id;
    if (isNew) { src.id = genId(); src.createdAt = nowISO(); }
    if (isNew) sources.unshift(src);
    else {
      const idx = sources.findIndex(s => s.id === src.id);
      if (idx >= 0) sources[idx] = src;
    }
    this.set('sources', sources);
    if (window.FIREBASE_INITIALIZED && window.db) {
      await window.db.collection('sources').doc(src.id).set(src);
    }
    return { success: true };
  },

  async deleteSource(id) {
    let sources = this.get('sources') || [];
    sources = sources.filter(s => s.id !== id);
    this.set('sources', sources);
    if (window.FIREBASE_INITIALIZED && window.db) {
      await window.db.collection('sources').doc(id).delete();
    }
    return { success: true };
  },

  // ---- USERS ----
  async getUsers() {
    return this.get('users') || [];
  },

  async saveUser(user) {
    const users = this.get('users') || [];
    const isNew = !user.id;
    if (isNew) { user.id = genId(); user.createdAt = nowISO(); }
    if (isNew) users.unshift(user);
    else {
      const idx = users.findIndex(u => u.id === user.id);
      if (idx >= 0) users[idx] = user;
    }
    this.set('users', users);
    return { success: true };
  },

  async deleteUser(id) {
    let users = this.get('users') || [];
    users = users.filter(u => u.id !== id);
    this.set('users', users);
    return { success: true };
  },

  // ---- NOTIFICATIONS ----
  getNotifications() {
    return this.get('notifications') || [];
  },

  addNotification(text, icon = 'fa-bell') {
    const notifs = this.getNotifications();
    notifs.unshift({ id: genId(), text, icon, read: false, time: nowISO() });
    this.set('notifications', notifs.slice(0, 50));
    this.updateNotifBadge();
  },

  markAllRead() {
    const notifs = this.getNotifications().map(n => ({ ...n, read: true }));
    this.set('notifications', notifs);
    this.updateNotifBadge();
  },

  updateNotifBadge() {
    const count = this.getNotifications().filter(n => !n.read).length;
    const badge = document.getElementById('notif-badge');
    if (badge) {
      badge.textContent = count;
      badge.style.display = count ? 'flex' : 'none';
    }
  },

  // ---- STATS ----
  async getStats() {
    const clients = await this.getClients();
    const now     = new Date();
    const thisMonth = clients.filter(c => {
      const d = new Date(c.createdAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const lastMonth = clients.filter(c => {
      const d = new Date(c.createdAt);
      const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear();
    });
    const closed = clients.filter(c => c.status === 'closed');
    const revenue = closed.reduce((s, c) => s + (Number(c.dealValue) || 0), 0);
    const conversion = clients.length ? ((closed.length / clients.length) * 100).toFixed(1) : 0;

    return {
      total:      clients.length,
      thisMonth:  thisMonth.length,
      lastMonth:  lastMonth.length,
      closed:     closed.length,
      revenue,
      conversion
    };
  },

  // ---- Firebase implementations ----
  async _getClientsFirebase(filters) {
    try {
      let q = window.db.collection('clients');
      if (filters.status && filters.status !== 'all') q = q.where('status','==',filters.status);
      if (filters.sourceId && filters.sourceId !== 'all') q = q.where('sourceId','==',filters.sourceId);
      const snap = await q.orderBy('createdAt','desc').get();
      let data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      return this._filterClients(data, { ...filters, status: 'all', sourceId: 'all' });
    } catch (e) {
      console.error('Firebase getClients error:', e);
      return this._filterClients(this.get('clients') || [], filters);
    }
  },

  async _saveClientFirebase(client) {
    try {
      const isNew = !client.id;
      if (isNew) client.id = genId();
      client.updatedAt = nowISO();
      if (isNew) client.createdAt = nowISO();
      await window.db.collection('clients').doc(client.id).set(client);
      return { success: true, client };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  async _deleteClientFirebase(id) {
    try {
      await window.db.collection('clients').doc(id).delete();
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
};
