// Existing MT_BOUNDS and CONFIG unchanged...

// NEW: Business listings (loaded from localStorage for demo)
window.BUSINESSES = JSON.parse(localStorage.getItem('mtBusinesses')) || [
  {
    id: 'demo-cafe',
    name: 'Mountain Brew Cafe ☕',
    lat: 45.677, lng: -111.038,
    address: '15 Main St, Bozeman',
    phone: '(406) 555-0123',
    website: 'https://example.com/cafe',
    icon: '☕',
    active: true,
    expires: new Date(Date.now() + 30*24*60*60*1000).toISOString() // 30 days
  }
];

// County data storage - editable via admin panel
window.COUNTY_DATA = JSON.parse(localStorage.getItem('countyData')) || {};

// Admin credentials (stored in localStorage for security)
window.ADMIN_CONFIG = {
  password: localStorage.getItem('adminPassword') || 'admin123', // Default password
  isLoggedIn: false
};

// Simple Montana uMap fetch function (unchanged)...
window.fetchSimpleMontanaUMap = async function() {
  try {
    const response = await fetch('https://umap.openstreetmap.fr/en/map/simple-montana_1357058/geojson/');
    if (!response.ok) return { type: 'FeatureCollection', features: [] };
    const data = await response.json();
    console.log('✅ Loaded Simple Montana uMap:', data.features?.length || 0, 'features');
    return data;
  } catch (e) {
    console.error('uMap fetch failed:', e);
    return { type: 'FeatureCollection', features: [] };
  }
};
