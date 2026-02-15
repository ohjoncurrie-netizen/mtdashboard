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

// City data storage – keyed by "{fips}_{city-slug}"
// Each city can have: description, activities, highlights, website, elevation, population
window.CITY_DATA = JSON.parse(localStorage.getItem('cityData')) || {};

// Montana cities by county (FIPS code)
window.COUNTY_CITIES = {
  '30001': ['Kalispell', 'Whitefish', 'Columbia Falls', 'Bigfork'],
  '30003': ['Helena', 'East Helena', 'Montana City'],
  '30005': ['Billings', 'Laurel', 'Shepherd'],
  '30007': ['Powder River (no incorporated cities)'],
  '30009': ['Hinsdale', 'Nashua'],
  '30011': ['Glasgow', 'Opheim'],
  '30013': ['Miles City', 'Baker'],
  '30015': ['Butte', 'Walkerville'],
  '30017': ['Fort Benton', 'Geraldine', 'Highwood'],
  '30019': ['Malta', 'Dodson'],
  '30021': ['Missoula', 'Lolo', 'Frenchtown'],
  '30023': ['Lodge Grass', 'Wyola'],
  '30025': ['Bozeman', 'Belgrade', 'Manhattan', 'Three Forks'],
  '30027': ['Great Falls', 'Malmstrom AFB'],
  '30029': ['Glendive', 'Wibaux'],
  '30031': ['Hardin', 'Crow Agency'],
  '30033': ['Havre', 'Chinook'],
  '30035': ['Dillon', 'Lima', 'Dell'],
  '30037': ['White Sulphur Springs', 'Ringling'],
  '30039': ['Scobey', 'Plentywood'],
  '30041': ['Shelby', 'Conrad', 'Cut Bank'],
  '30043': ['Deer Lodge', 'Anaconda'],
  '30045': ['Lewistown', 'Moore'],
  '30047': ['Forsyth', 'Colstrip'],
  '30049': ['Hamilton', 'Darby', 'Stevensville'],
  '30051': ['Stanford', 'Geyser'],
  '30053': ['Livingston', 'Clyde Park'],
  '30055': ['Wolf Point', 'Poplar', 'Brockton'],
  '30057': ['Roundup', 'Lavina'],
  '30059': ['Thompson Falls', 'Plains'],
  '30061': ['Columbus', 'Absarokee'],
  '30063': ['Libby', 'Troy'],
  '30065': ['Chester', 'Joplin'],
  '30067': ['Jordan (no other cities)'],
  '30069': ['Sidney', 'Fairview'],
  '30071': ['Red Lodge', 'Joliet'],
  '30073': ['Polson', 'Ronan', 'St. Ignatius'],
  '30075': ['Bridger', 'Fromberg', 'Joliet'],
  '30077': ['Terry', 'Mildred'],
  '30079': ['Townsend', 'Toston'],
  '30081': ['Philipsburg', 'Drummond'],
  '30083': ['Superior', 'Alberton'],
  '30085': ['Choteau', 'Fairfield'],
  '30087': ['Hot Springs', 'Dixon'],
  '30089': ['Circle', 'Brockway'],
  '30091': ['Plentywood', 'Medicine Lake'],
  '30093': ['Butte', 'Walkerville'],
  '30095': ['Columbus', 'Absarokee'],
  '30097': ['Big Timber', 'Melville'],
  '30099': ['Choteau', 'Fairfield', 'Dutton'],
  '30101': ['Shelby', 'Sunburst', 'Kevin'],
  '30103': ['Hysham (no other cities)'],
  '30105': ['Glasgow', 'Fort Peck'],
  '30107': ['Harlowton', 'Judith Gap'],
  '30109': ['Wibaux (no other cities)'],
  '30111': ['Billings', 'Laurel', 'Shepherd', 'Lockwood']
};

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
