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

    getCurrentUser() {
      if (this.useFirebase) {
        return auth.currentUser;
      }
      // localStorage fallback - return mock user if logged in
      const isLoggedIn = JSON.parse(localStorage.getItem('adminConfig') || '{}').isLoggedIn;
      if (isLoggedIn) {
        return { email: 'admin@local', uid: 'local' };
      }
      return null;
    }

    // ── User Management ──
    async getUserList() {
      if (this.useFirebase) {
        try {
          const snap = await db.collection('users').get();
          const users = [];
          snap.forEach(doc => {
            users.push({ uid: doc.id, ...doc.data() });
          });
          return users;
        } catch (err) {
          console.error('Error fetching users:', err);
          return [];
        }
      }
      // localStorage fallback - return single admin user
      return [{
        uid: 'local',
        email: 'admin@local',
        role: 'admin',
        displayName: 'Local Admin',
        createdAt: new Date().toISOString()
      }];
    }

    async createUser(email, password, displayName, role = 'admin') {
      if (this.useFirebase) {
        try {
          // Note: Creating users from client-side requires admin SDK or Cloud Function
          // For now, we'll store user metadata and they can sign up manually
          // A better approach would be to use a Cloud Function
          const currentUser = auth.currentUser;

          // Create user metadata in Firestore
          const userId = `user_${Date.now()}`;
          await db.collection('users').doc(userId).set({
            email,
            role,
            displayName: displayName || email.split('@')[0],
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            createdBy: currentUser ? currentUser.uid : 'system',
            pendingActivation: true,
            tempPassword: password // They should change this on first login
          });

          return {
            success: true,
            message: 'User invited. They should sign up with this email and password.'
          };
        } catch (err) {
          return { success: false, error: err.message };
        }
      }
      // localStorage doesn't support multiple users
      return { success: false, error: 'Multi-user not supported in localStorage mode. Configure Firebase.' };
    }

    async deleteUser(userId) {
      if (this.useFirebase) {
        try {
          await db.collection('users').doc(userId).delete();
          return { success: true };
        } catch (err) {
          return { success: false, error: err.message };
        }
      }
      return { success: false, error: 'Cannot delete users in localStorage mode.' };
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

    // ── Events ──
    async getEvents(filters = {}) {
      let events = [];

      if (this.useFirebase) {
        let query = db.collection('events');

        // Apply filters if provided
        if (filters.countyFips) {
          query = query.where('countyFips', '==', filters.countyFips);
        }
        if (filters.citySlug) {
          query = query.where('citySlug', '==', filters.citySlug);
        }
        if (filters.type) {
          query = query.where('type', '==', filters.type);
        }
        if (filters.isActive !== undefined) {
          query = query.where('isActive', '==', filters.isActive);
        }

        const snap = await query.get();
        snap.forEach(doc => {
          events.push({ id: doc.id, ...doc.data() });
        });
      } else {
        events = JSON.parse(localStorage.getItem('eventsData')) || [];

        // Apply filters manually for localStorage
        if (filters.countyFips) {
          events = events.filter(e => e.countyFips === filters.countyFips);
        }
        if (filters.citySlug) {
          events = events.filter(e => e.citySlug === filters.citySlug);
        }
        if (filters.type) {
          events = events.filter(e => e.type === filters.type);
        }
        if (filters.isActive !== undefined) {
          events = events.filter(e => e.isActive === filters.isActive);
        }
      }

      return events;
    }

    async getAllEvents() {
      if (this.useFirebase) {
        const snap = await db.collection('events').get();
        const events = [];
        snap.forEach(doc => {
          events.push({ id: doc.id, ...doc.data() });
        });
        return events;
      }
      return JSON.parse(localStorage.getItem('eventsData')) || [];
    }

    async getEventsByCounty(fipsCode) {
      return this.getEvents({ countyFips: fipsCode, isActive: true });
    }

    async getEventsByCity(fipsCode, citySlug) {
      if (this.useFirebase) {
        const snap = await db.collection('events')
          .where('countyFips', '==', fipsCode)
          .where('isActive', '==', true)
          .get();

        const events = [];
        snap.forEach(doc => {
          const data = { id: doc.id, ...doc.data() };
          // Include county-wide events (no citySlug) or city-specific events
          if (!data.citySlug || data.citySlug === citySlug) {
            events.push(data);
          }
        });
        return events;
      }

      const allEvents = JSON.parse(localStorage.getItem('eventsData')) || [];
      return allEvents.filter(e =>
        e.countyFips === fipsCode &&
        e.isActive &&
        (!e.citySlug || e.citySlug === citySlug)
      );
    }

    async saveEvent(eventData) {
      // Generate ID if new event
      if (!eventData.id) {
        eventData.id = `evt_${Date.now()}`;
      }

      // Add/update timestamps
      if (this.useFirebase) {
        if (!eventData.createdAt) {
          eventData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        }
        eventData.updatedAt = firebase.firestore.FieldValue.serverTimestamp();

        await db.collection('events').doc(eventData.id).set(eventData, { merge: true });
      }

      // Always sync to localStorage
      const all = JSON.parse(localStorage.getItem('eventsData')) || [];
      const idx = all.findIndex(e => e.id === eventData.id);

      // Add timestamp for localStorage
      if (!eventData.createdAt) {
        eventData.createdAt = new Date().toISOString();
      }
      eventData.updatedAt = new Date().toISOString();

      if (idx >= 0) {
        all[idx] = eventData;
      } else {
        all.push(eventData);
      }
      localStorage.setItem('eventsData', JSON.stringify(all));

      return eventData;
    }

    async deleteEvent(eventId) {
      if (this.useFirebase) {
        await db.collection('events').doc(eventId).delete();
      }

      const all = JSON.parse(localStorage.getItem('eventsData')) || [];
      const filtered = all.filter(e => e.id !== eventId);
      localStorage.setItem('eventsData', JSON.stringify(filtered));
    }
  }

  // Expose globally
  window.dataService = new DataService();
  window.firebaseReady = firebaseReady;
})();
