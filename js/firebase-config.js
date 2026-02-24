/**
 * SCMS - Firebase Configuration
 * 
 * To connect to Firebase:
 * 1. Go to https://console.firebase.google.com
 * 2. Create a new project
 * 3. Add a Web app
 * 4. Copy your config object and replace the values below
 * 5. Enable Authentication (Email/Password) and Firestore
 */

// ============================================================
// REPLACE THESE VALUES WITH YOUR FIREBASE PROJECT CONFIG
// ============================================================
const FIREBASE_CONFIG = {
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT_ID.firebaseapp.com",
  projectId:         "YOUR_PROJECT_ID",
  storageBucket:     "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId:             "YOUR_APP_ID"
};
// ============================================================

// Firebase state
window.FIREBASE_INITIALIZED = false;
window.db = null;
window.auth = null;
window.firebaseApp = null;

/**
 * Initialize Firebase - called from settings page
 * or auto-called on app start if config exists in localStorage
 */
async function initFirebase(config = null) {
  try {
    const cfg = config || JSON.parse(localStorage.getItem('scms_firebase_config') || 'null');
    if (!cfg || !cfg.apiKey || cfg.apiKey === 'YOUR_API_KEY') {
      console.log('Firebase: No valid config found. Running in demo mode.');
      return false;
    }

    // Dynamically load Firebase SDK
    if (!window.firebase) {
      await loadScript('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
      await loadScript('https://www.gstatic.com/firebasejs/10.7.0/firebase-auth-compat.js');
      await loadScript('https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore-compat.js');
    }

    // Initialize if not already
    if (!window.firebaseApp) {
      window.firebaseApp = firebase.initializeApp(cfg);
      window.auth = firebase.auth();
      window.db = firebase.firestore();
      window.FIREBASE_INITIALIZED = true;
    }

    console.log('Firebase: Connected successfully');
    return true;
  } catch (err) {
    console.error('Firebase init error:', err);
    return false;
  }
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

// Auto-init on page load
document.addEventListener('DOMContentLoaded', () => {
  initFirebase();
});
