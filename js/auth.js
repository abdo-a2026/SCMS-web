/**
 * SCMS - Authentication
 */

// ---- Login page logic ----
const loginForm = document.getElementById('login-form');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email    = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const errEl    = document.getElementById('login-error');
    const btnText  = document.querySelector('#btn-login .btn-text');
    const btnArrow = document.querySelector('#btn-login .btn-arrow');
    const btnLoader = document.querySelector('#btn-login .btn-loader');

    // Basic validation
    if (!email || !password) {
      showLoginError('يرجى إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }

    // Loading state
    btnText.textContent = 'جاري التحقق...';
    btnArrow.classList.add('hidden');
    btnLoader.classList.remove('hidden');
    errEl.classList.add('hidden');

    try {
      if (window.FIREBASE_INITIALIZED && window.auth) {
        // Firebase login
        await window.auth.signInWithEmailAndPassword(email, password);
        const user = window.auth.currentUser;
        sessionStorage.setItem('scms_user', JSON.stringify({
          uid: user.uid,
          email: user.email,
          name: user.displayName || email.split('@')[0],
          role: 'admin'
        }));
        showToast('تم تسجيل الدخول بنجاح!', 'success');
        setTimeout(() => { window.location.href = 'app.html'; }, 800);
      } else {
        // Demo mode - check stored credentials
        const users = JSON.parse(localStorage.getItem('scms_users') || '[]');
        const u = users.find(u => u.email === email);
        if (u && (password === 'demo123' || password === u.password)) {
          sessionStorage.setItem('scms_user', JSON.stringify(u));
          showToast('تم تسجيل الدخول (وضع تجريبي)', 'success');
          setTimeout(() => { window.location.href = 'app.html'; }, 800);
        } else if (email === 'admin@scms.iq' && password === 'demo123') {
          sessionStorage.setItem('scms_user', JSON.stringify({
            id: 'u1', name: 'أحمد الموسى', email: 'admin@scms.iq', role: 'admin'
          }));
          showToast('تم تسجيل الدخول (وضع تجريبي)', 'success');
          setTimeout(() => { window.location.href = 'app.html'; }, 800);
        } else {
          showLoginError('البريد الإلكتروني أو كلمة المرور غير صحيحة');
          resetLoginBtn();
        }
      }
    } catch (err) {
      const msgs = {
        'auth/user-not-found':     'البريد الإلكتروني غير مسجل',
        'auth/wrong-password':     'كلمة المرور غير صحيحة',
        'auth/invalid-email':      'صيغة البريد الإلكتروني غير صحيحة',
        'auth/too-many-requests':  'تم تجاوز عدد المحاولات، حاول لاحقاً',
        'auth/network-request-failed': 'تعذر الاتصال بالشبكة',
      };
      showLoginError(msgs[err.code] || 'حدث خطأ، حاول مرة أخرى');
      resetLoginBtn();
    }
  });
}

function showLoginError(msg) {
  const el = document.getElementById('login-error');
  if (el) { el.textContent = msg; el.classList.remove('hidden'); }
}

function resetLoginBtn() {
  const btnText  = document.querySelector('#btn-login .btn-text');
  const btnArrow = document.querySelector('#btn-login .btn-arrow');
  const btnLoader = document.querySelector('#btn-login .btn-loader');
  if (btnText)  btnText.textContent = 'تسجيل الدخول';
  if (btnArrow) btnArrow.classList.remove('hidden');
  if (btnLoader) btnLoader.classList.add('hidden');
}

// ---- Demo Login ----
function demoLogin() {
  sessionStorage.setItem('scms_user', JSON.stringify({
    id: 'u1', name: 'أحمد الموسى', email: 'admin@scms.iq', role: 'admin'
  }));
  showToast('مرحباً! جاري فتح البرنامج التجريبي...', 'info');
  setTimeout(() => { window.location.href = 'app.html'; }, 900);
}

// ---- Logout ----
function logout() {
  if (window.FIREBASE_INITIALIZED && window.auth) {
    window.auth.signOut();
  }
  sessionStorage.removeItem('scms_user');
  window.location.href = 'index.html';
}

// ---- Auth Guard (for app.html) ----
function checkAuth() {
  const user = sessionStorage.getItem('scms_user');
  if (!user) {
    window.location.href = 'index.html';
    return null;
  }
  return JSON.parse(user);
}

// ---- Get current user ----
function getCurrentUser() {
  const u = sessionStorage.getItem('scms_user');
  return u ? JSON.parse(u) : null;
}
