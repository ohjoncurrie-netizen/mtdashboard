// Firebase Configuration & Backend Service
// ==========================================
// Provides a unified DataService API. When Firebase is configured, it
// reads/writes Firestore. Otherwise it falls back to localStorage.
//
// SETUP: 
//   1) Create a Firebase project at https://console.firebase.google.com
//   2) Enable Email/Password auth in Authentication → Sign-in method
//   3) Create a Firestore database (start in test mode is fine)
//   4) Paste your config below (replace the placeholder values)
//   5) The app will auto-detect Firebase and switch from localStorage

(function() {
  'use strict';

  // ─── Firebase Project Config ───
  const firebaseConfig = {

    apiKey: "AIzaSyCBILJQHJBRK6LN6x7yF2BwLwiXd80PlJQ",

    authDomain: "simplemontana-7d1da.firebaseapp.com",

    projectId: "simplemontana-7d1da",

    storageBucket: "simplemontana-7d1da.firebasestorage.app",

    messagingSenderId: "531058290354",

    appId: "1:531058290354:web:f5563186d8d9d398eb23ab",

    measurementId: "G-CJ4PS2DCEB"

  };


  let db = null;
  let auth = null;
  let firebaseReady = false;

  // Check if Firebase compat SDK was loaded (added via <script> in index.html)
  try {
    if (firebaseConfig.apiKey !== "AIzaSyCBILJQHJBRK6LN6x7yF2BwLwiXd80PlJQ" &&
        typeof firebase !== 'undefined') {
      firebase.initializeApp(firebaseConfig);
      db = firebase.firestore();
      auth = firebase.auth();
      firebaseReady = true;
      console.log('🔥 Firebase initialized');
    } else if (firebaseConfig.apiKey === "AIzaSyCBILJQHJBRK6LN6x7yF2BwLwiXd80PlJQ") {
      console.warn('⚠️ Firebase not configured – using localStorage. Edit firebase-config.js with your credentials.');
    }
  } catch (err) {
    console.warn('⚠️ Firebase init failed, using localStorage:', err.message);
  }

  // ─── Data Service ───
  class DataService {
    constructor() {
      this.useFirebase = firebaseReady;
    }

    isFirebase() { return this.useFirebase; }

    // ── Auth ──
    async login(email, password) {
      if (this.useFirebase) {
        try {
          const cred = await auth.signInWithEmailAndPassword(email, password);
          return { success: true, user: cred.user };
        } catch (err) {
          return { success: false, error: err.message };
        }
      }
      // localStorage fallback – simple password check
      const storedPw = localStorage.getItem('adminPassword') || 'admin123';
      if (password === storedPw) {
        return { success: true, user: { email: email || 'admin@local', uid: 'local' } };
      }
      return { success: false, error: 'Incorrect password.' };
    }

    async logout() {
      if (this.useFirebase) await auth.signOut();
    }

    onAuthChange(callback) {
      if (this.useFirebase) return auth.onAuthStateChanged(callback);
      return () => {};
    }

    async changePassword(newPassword) {
      if (this.useFirebase && auth.currentUser) {
        try {
          await auth.currentUser.updatePassword(newPassword);
          return { success: true };
        } catch (err) {
          return { success: false, error: err.message };
        }
      }
      localStorage.setItem('adminPassword', newPassword);
      return { success: true };
    }

    // ── County Data ──
    async getCountyData(fipsCode) {
      if (this.useFirebase) {
        const snap = await db.collection('counties').doc(fipsCode).get();
        return snap.exists ? snap.data() : null;
      }
      const all = JSON.parse(localStorage.getItem('countyData')) || {};
      return all[fipsCode] || null;
    }

    async getAllCountyData() {
      if (this.useFirebase) {
        const snap = await db.collection('counties').get();
        const result = {};
        snap.forEach(d => { result[d.id] = d.data(); });
        return result;
      }
      return JSON.parse(localStorage.getItem('countyData')) || {};
    }

    async saveCountyData(fipsCode, data) {
      if (this.useFirebase) {
        await db.collection('counties').doc(fipsCode).set(data, { merge: true });
      }
      // Always keep localStorage in sync as cache
      const all = JSON.parse(localStorage.getItem('countyData')) || {};
      all[fipsCode] = data;
      localStorage.setItem('countyData', JSON.stringify(all));
    }

    // ── City Data ──
    async getCityData(fipsCode, citySlug) {
      const key = `${fipsCode}_${citySlug}`;
      if (this.useFirebase) {
        const snap = await db.collection('cities').doc(key).get();
        return snap.exists ? snap.data() : null;
      }
      const all = JSON.parse(localStorage.getItem('cityData')) || {};
      return all[key] || null;
    }

    async getAllCityData() {
      if (this.useFirebase) {
        const snap = await db.collection('cities').get();
        const result = {};
        snap.forEach(d => { result[d.id] = d.data(); });
        return result;
      }
      return JSON.parse(localStorage.getItem('cityData')) || {};
    }

    async saveCityData(fipsCode, citySlug, data) {
      const key = `${fipsCode}_${citySlug}`;
      if (this.useFirebase) {
        await db.collection('cities').doc(key).set(data, { merge: true });
      }
      const all = JSON.parse(localStorage.getItem('cityData')) || {};
      all[key] = data;
      localStorage.setItem('cityData', JSON.stringify(all));
    }

    // ── Businesses ──
    async getBusinesses() {
      if (this.useFirebase) {
        const snap = await db.collection('businesses').get();
        const result = [];
        snap.forEach(d => { result.push({ id: d.id, ...d.data() }); });
        return result;
      }
      return JSON.parse(localStorage.getItem('mtBusinesses')) || [];
    }

    async saveBusiness(business) {
      if (this.useFirebase) {
        await db.collection('businesses').doc(business.id).set(business);
      }
      const all = JSON.parse(localStorage.getItem('mtBusinesses')) || [];
      const idx = all.findIndex(b => b.id === business.id);
      if (idx >= 0) all[idx] = business; else all.push(business);
      localStorage.setItem('mtBusinesses', JSON.stringify(all));
    }

    async saveAllBusinesses(businesses) {
      if (this.useFirebase) {
        for (const b of businesses) {
          await db.collection('businesses').doc(b.id).set(b);
        }
      }
      localStorage.setItem('mtBusinesses', JSON.stringify(businesses));
    }
  }

  // Expose globally
  window.dataService = new DataService();
  window.firebaseReady = firebaseReady;
})();
