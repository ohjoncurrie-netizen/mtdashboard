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
  let storage = null;
  let firebaseReady = false;

  // Check if Firebase compat SDK was loaded (added via <script> in index.html)
  try {
    if (typeof firebase !== 'undefined' && firebaseConfig.apiKey && firebaseConfig.projectId) {
      firebase.initializeApp(firebaseConfig);
      db = firebase.firestore();
      auth = firebase.auth();
      storage = typeof firebase.storage === 'function' ? firebase.storage() : null;
      firebaseReady = true;
      console.log('🔥 Firebase initialized');
    } else {
      console.warn('⚠️ Firebase SDK not loaded or config missing – using localStorage.');
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
          const extractedCode = err?.code || (err?.message?.match(/\((auth\/[a-z-]+)\)/)?.[1]);
          console.error('Firebase login error:', extractedCode, err.message);
          // Translate common error codes into friendly messages
          let msg = err.message;
          if (extractedCode === 'auth/unauthorized-domain') {
            const domain = window.location.hostname;
            msg = `This domain (${domain}) is not authorized in Firebase. Go to Firebase Console → Authentication → Settings → Authorized Domains and add "${domain}".`;
          } else if (extractedCode === 'auth/user-not-found' || extractedCode === 'auth/wrong-password' || extractedCode === 'auth/invalid-credential') {
            msg = 'Incorrect email or password.';
          } else if (extractedCode === 'auth/invalid-email') {
            msg = 'Please enter a valid email address.';
          } else if (extractedCode === 'auth/too-many-requests') {
            msg = 'Too many failed attempts. Please wait a few minutes and try again.';
          } else if (extractedCode === 'auth/network-request-failed') {
            msg = 'Network error — check your internet connection.';
          } else if (extractedCode === 'auth/configuration-not-found') {
            msg = 'Firebase Authentication is not enabled. Enable Email/Password sign-in in the Firebase Console.';
          }
          return { success: false, error: msg };
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

    // ── User Registration ──
    async register(email, password, displayName) {
      if (this.useFirebase) {
        try {
          const cred = await auth.createUserWithEmailAndPassword(email, password);
          // Update profile with display name
          await cred.user.updateProfile({ displayName: displayName || email.split('@')[0] });
          // Create member profile in Firestore
          await db.collection('members').doc(cred.user.uid).set({
            email: email,
            displayName: displayName || email.split('@')[0],
            bio: '',
            avatarEmoji: '👤',
            totalPoints: 0,
            postCount: 0,
            helpfulCount: 0,
            awards: [],
            joinedAt: firebase.firestore.FieldValue.serverTimestamp(),
            settings: {
              emailNotifications: true,
              showOnLeaderboard: true,
              publicProfile: true
            },
            role: 'member'
          });
          return { success: true, user: cred.user };
        } catch (err) {
          return { success: false, error: err.message };
        }
      }
      // localStorage fallback
      const members = JSON.parse(localStorage.getItem('memberProfiles')) || {};
      const uid = 'local_' + Date.now();
      members[displayName || email] = {
        name: displayName || email,
        email: email,
        uid: uid,
        avatarEmoji: '👤',
        bio: '',
        totalPoints: 0,
        postCount: 0,
        helpfulCount: 0,
        awards: [],
        joinedAt: new Date().toISOString(),
        settings: { emailNotifications: true, showOnLeaderboard: true, publicProfile: true },
        role: 'member'
      };
      localStorage.setItem('memberProfiles', JSON.stringify(members));
      localStorage.setItem('currentUser', JSON.stringify({ email, displayName: displayName || email, uid }));
      return { success: true, user: { email, displayName: displayName || email, uid } };
    }

    // ── Forgot Password ──
    async resetPassword(email) {
      if (this.useFirebase) {
        try {
          await auth.sendPasswordResetEmail(email);
          return { success: true, message: 'Password reset email sent. Check your inbox.' };
        } catch (err) {
          return { success: false, error: err.message };
        }
      }
      return { success: false, error: 'Password reset requires Firebase. Contact admin.' };
    }

    // ── Member Profiles ──
    async getMemberProfile(uid) {
      if (this.useFirebase) {
        try {
          const snap = await db.collection('members').doc(uid).get();
          return snap.exists ? { uid: snap.id, ...snap.data() } : null;
        } catch (err) {
          console.error('Error fetching member:', err);
          return null;
        }
      }
      const members = JSON.parse(localStorage.getItem('memberProfiles')) || {};
      for (const [key, member] of Object.entries(members)) {
        if (member.uid === uid || key === uid) return { uid: key, ...member };
      }
      return null;
    }

    async saveMemberProfile(uid, data) {
      if (this.useFirebase) {
        try {
          await db.collection('members').doc(uid).set(data, { merge: true });
        } catch (err) {
          console.error('Error saving member:', err);
        }
      }
      // Always sync localStorage
      const members = JSON.parse(localStorage.getItem('memberProfiles')) || {};
      const key = data.name || data.displayName || uid;
      members[key] = { ...members[key], ...data, uid };
      localStorage.setItem('memberProfiles', JSON.stringify(members));
    }

    async getTopMembers(limit = 20) {
      if (this.useFirebase) {
        try {
          const snap = await db.collection('members')
            .orderBy('totalPoints', 'desc')
            .limit(limit)
            .get();
          const members = [];
          snap.forEach(doc => members.push({ uid: doc.id, ...doc.data() }));
          return members;
        } catch (err) {
          console.error('Error fetching top members:', err);
        }
      }
      const members = JSON.parse(localStorage.getItem('memberProfiles')) || {};
      return Object.entries(members)
        .map(([key, m]) => ({ uid: key, name: m.name || key, ...m }))
        .sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0))
        .slice(0, limit);
    }

    async grantAward(memberKey, awardKey, _grantedBy = 'admin') {
      if (this.useFirebase) {
        try {
          const snap = await db.collection('members').doc(memberKey).get();
          if (snap.exists) {
            const data = snap.data();
            const awards = data.awards || [];
            if (!awards.includes(awardKey)) {
              awards.push(awardKey);
              const bonus = (window.AWARDS && window.AWARDS[awardKey]) ? window.AWARDS[awardKey].points : 0;
              await db.collection('members').doc(memberKey).update({
                awards: awards,
                totalPoints: (data.totalPoints || 0) + bonus
              });
            }
            return { success: true };
          }
          return { success: false, error: 'Member not found' };
        } catch (err) {
          return { success: false, error: err.message };
        }
      }
      // localStorage fallback
      const members = JSON.parse(localStorage.getItem('memberProfiles')) || {};
      if (members[memberKey]) {
        if (!members[memberKey].awards) members[memberKey].awards = [];
        if (!members[memberKey].awards.includes(awardKey)) {
          members[memberKey].awards.push(awardKey);
          const bonus = (window.AWARDS && window.AWARDS[awardKey]) ? window.AWARDS[awardKey].points : 0;
          members[memberKey].totalPoints = (members[memberKey].totalPoints || 0) + bonus;
        }
        localStorage.setItem('memberProfiles', JSON.stringify(members));
        return { success: true };
      }
      return { success: false, error: 'Member not found' };
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

    // ── Marketplace ──
    async getMarketplaceListings() {
      if (this.useFirebase) {
        try {
          const snap = await db.collection('marketplace')
            .orderBy('createdAt', 'desc')
            .get();

          const listings = [];
          snap.forEach(doc => {
            const data = doc.data() || {};
            listings.push({
              id: doc.id,
              ...data,
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : (data.createdAt || new Date().toISOString()),
              updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : (data.updatedAt || null)
            });
          });

          localStorage.setItem('marketplaceListings', JSON.stringify(listings));
          return listings;
        } catch (err) {
          console.error('Error fetching marketplace listings:', err);
        }
      }

      return JSON.parse(localStorage.getItem('marketplaceListings')) || [];
    }

    async uploadMarketplaceImage(file, listingId = 'new') {
      if (!file) return '';

      if (this.useFirebase && storage) {
        const safeName = String(file.name || 'image').replace(/[^a-zA-Z0-9._-]/g, '_');
        const path = `marketplace/${listingId}/${Date.now()}_${safeName}`;
        const ref = storage.ref().child(path);
        await ref.put(file);
        return ref.getDownloadURL();
      }

      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Unable to read image file'));
        reader.readAsDataURL(file);
      });
    }

    async saveMarketplaceListing(listingData) {
      const normalized = {
        title: listingData.title || '',
        description: listingData.description || '',
        price: listingData.price || '',
        category: listingData.category || listingData.type || 'for_sale',
        location: listingData.location || '',
        imageUrl: listingData.imageUrl || '',
        contactInfo: listingData.contactInfo || listingData.contactEmail || '',
        contactName: listingData.contactName || '',
        contactEmail: listingData.contactEmail || '',
        contactPhone: listingData.contactPhone || '',
        userId: listingData.userId || '',
        userName: listingData.userName || '',
        isActive: listingData.isActive !== false
      };

      let saved;
      if (this.useFirebase) {
        if (listingData.id) {
          await db.collection('marketplace').doc(listingData.id).set({
            ...normalized,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          }, { merge: true });

          const doc = await db.collection('marketplace').doc(listingData.id).get();
          const data = doc.data() || {};
          saved = {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : (data.createdAt || new Date().toISOString()),
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : (data.updatedAt || new Date().toISOString())
          };
        } else {
          const createdRef = await db.collection('marketplace').add({
            ...normalized,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          });

          const doc = await createdRef.get();
          const data = doc.data() || {};
          saved = {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : new Date().toISOString()
          };
        }
      } else {
        saved = {
          id: listingData.id || `listing_${Date.now()}`,
          ...normalized,
          createdAt: listingData.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }

      const all = JSON.parse(localStorage.getItem('marketplaceListings')) || [];
      const idx = all.findIndex(item => item.id === saved.id);
      if (idx >= 0) {
        all[idx] = saved;
      } else {
        all.unshift(saved);
      }
      localStorage.setItem('marketplaceListings', JSON.stringify(all));
      return saved;
    }

    async deleteMarketplaceListing(listingId) {
      if (this.useFirebase) {
        await db.collection('marketplace').doc(listingId).delete();
      }

      const all = JSON.parse(localStorage.getItem('marketplaceListings')) || [];
      localStorage.setItem('marketplaceListings', JSON.stringify(all.filter(item => item.id !== listingId)));
      return { success: true };
    }

    // ── Discussion Posts ──
    async getDiscussionPosts() {
      if (this.useFirebase) {
        try {
          const snap = await db.collection('discussions')
            .orderBy('timestamp', 'desc')
            .get();
          const posts = [];
          snap.forEach(doc => posts.push({ id: doc.id, ...doc.data() }));
          return posts;
        } catch (err) {
          console.error('Error fetching discussion posts:', err);
        }
      }
      return JSON.parse(localStorage.getItem('discussionPosts')) || [];
    }

    async saveDiscussionPost(post) {
      if (!post.id) post.id = `post_${Date.now()}`;
      if (this.useFirebase) {
        try {
          await db.collection('discussions').doc(post.id).set(post, { merge: true });
        } catch (err) {
          console.error('Error saving discussion post:', err);
        }
      }
      // Keep localStorage in sync
      const all = JSON.parse(localStorage.getItem('discussionPosts')) || [];
      const idx = all.findIndex(p => p.id === post.id);
      if (idx >= 0) all[idx] = post; else all.unshift(post);
      localStorage.setItem('discussionPosts', JSON.stringify(all));
      return post;
    }

    async updateDiscussionPost(postId, updates) {
      if (this.useFirebase) {
        try {
          await db.collection('discussions').doc(postId).update(updates);
        } catch (err) {
          console.error('Error updating discussion post:', err);
        }
      }
      const all = JSON.parse(localStorage.getItem('discussionPosts')) || [];
      const idx = all.findIndex(p => p.id === postId);
      if (idx >= 0) {
        all[idx] = { ...all[idx], ...updates };
        localStorage.setItem('discussionPosts', JSON.stringify(all));
      }
    }

    async deleteDiscussionPost(postId) {
      if (this.useFirebase) {
        try {
          await db.collection('discussions').doc(postId).delete();
        } catch (err) {
          console.error('Error deleting discussion post:', err);
        }
      }
      const all = JSON.parse(localStorage.getItem('discussionPosts')) || [];
      localStorage.setItem('discussionPosts', JSON.stringify(all.filter(p => p.id !== postId)));
    }

    // ── All Members (for startup hydration) ──
    async getAllMembers() {
      if (this.useFirebase) {
        try {
          const snap = await db.collection('members').get();
          const result = {};
          snap.forEach(doc => {
            const data = doc.data();
            // Key by displayName/name for MEMBER_PROFILES global compatibility
            const key = data.displayName || data.name || doc.id;
            result[key] = { uid: doc.id, ...data };
          });
          return result;
        } catch (err) {
          console.error('Error fetching all members:', err);
        }
      }
      return JSON.parse(localStorage.getItem('memberProfiles')) || {};
    }

    // ── Analytics Tracking ──
    async trackView(entry) {
      // entry = { type, id, name, extra, ts }
      if (this.useFirebase) {
        try {
          await db.collection('analytics').add(entry);
        } catch (_err) {
          // Non-fatal — fall back silently
        }
      }
      // Always persist locally for instant dashboard reads
      const views = JSON.parse(localStorage.getItem('analyticsViews')) || [];
      views.push(entry);
      // Keep last 5000 entries
      if (views.length > 5000) views.splice(0, views.length - 5000);
      localStorage.setItem('analyticsViews', JSON.stringify(views));
      window.ANALYTICS_VIEWS = views;
    }

    async getAnalyticsViews() {
      if (this.useFirebase) {
        try {
          const snap = await db.collection('analytics')
            .orderBy('ts', 'desc')
            .limit(5000)
            .get();
          const views = [];
          snap.forEach(doc => views.push(doc.data()));
          return views;
        } catch (_err) {
          // Fall back to local
        }
      }
      return JSON.parse(localStorage.getItem('analyticsViews')) || [];
    }
  }

  // Expose globally
  window.dataService = new DataService();
  window.firebaseReady = firebaseReady;
})();
