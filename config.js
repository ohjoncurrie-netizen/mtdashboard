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

// Events data storage - array of event objects
// Each event has: id, name, type, description, countyFips, citySlug, startDate, endDate,
// isRecurring, recurrencePattern, website, contactEmail, contactPhone, address, price,
// createdAt, updatedAt, isActive, featured
window.EVENTS_DATA = JSON.parse(localStorage.getItem('eventsData')) || [];

// Discussion board data storage
// Posts array with replies, ratings, and award tracking
window.DISCUSSION_POSTS = JSON.parse(localStorage.getItem('discussionPosts')) || [];

// Member profiles with ranking and awards
window.MEMBER_PROFILES = JSON.parse(localStorage.getItem('memberProfiles')) || {};

// Awards definitions and tracking
window.AWARDS = {
  montana_expert: { name: 'Montana Expert', icon: '🏆', points: 100, description: 'Shared 10+ high-quality Montana facts', category: 'knowledge' },
  helpful_contributor: { name: 'Helpful Contributor', icon: '🤝', points: 50, description: '5+ helpful replies', category: 'community' },
  wildlife_knowledge: { name: 'Wildlife Whisperer', icon: '🦌', points: 75, description: 'Shared valuable wildlife insights', category: 'knowledge' },
  history_buff: { name: 'History Buff', icon: '📜', points: 75, description: 'Shared Montana historical knowledge', category: 'knowledge' },
  trail_advocate: { name: 'Trail Advocate', icon: '🥾', points: 50, description: 'Shared hiking and outdoor knowledge', category: 'knowledge' },
  community_champion: { name: 'Community Champion', icon: '⭐', points: 150, description: '50+ helpful community contributions', category: 'community' },
  knowledge_seeker: { name: 'Knowledge Seeker', icon: '🎓', points: 25, description: 'Asked insightful questions', category: 'community' },
  regional_master: { name: 'Regional Master', icon: '🗺️', points: 100, description: 'Expert knowledge in multiple regions', category: 'exploration' },
  // Quiz & Knowledge Awards
  quiz_master: { name: 'Quiz Master', icon: '🧠', points: 125, description: 'Aced Montana knowledge quizzes', category: 'quiz' },
  geography_genius: { name: 'Geography Genius', icon: '🌍', points: 100, description: 'Perfect score on Montana geography quiz', category: 'quiz' },
  history_scholar: { name: 'History Scholar', icon: '📚', points: 100, description: 'Mastered Montana history quiz', category: 'quiz' },
  wildlife_expert: { name: 'Wildlife Expert', icon: '🐻', points: 100, description: 'Identified all Montana wildlife species', category: 'quiz' },
  // Route & Exploration Awards
  route_explorer: { name: 'Route Explorer', icon: '🛣️', points: 75, description: 'Explored 5+ scenic routes on the map', category: 'exploration' },
  county_collector: { name: 'County Collector', icon: '📍', points: 125, description: 'Visited and reviewed 10+ county pages', category: 'exploration' },
  peak_bagger: { name: 'Peak Bagger', icon: '⛰️', points: 100, description: 'Explored all mountain peak layers', category: 'exploration' },
  trailblazer: { name: 'Trailblazer', icon: '🔥', points: 150, description: 'First to contribute in 3+ categories', category: 'community' },
  // Helpful & Contribution Awards  
  first_responder: { name: 'First Responder', icon: '🏅', points: 50, description: 'First helpful reply on 5+ discussions', category: 'community' },
  storyteller: { name: 'Storyteller', icon: '📖', points: 75, description: 'Shared 5+ detailed local stories', category: 'knowledge' },
  local_legend: { name: 'Local Legend', icon: '👑', points: 200, description: 'Top contributor with 500+ total points', category: 'prestige' },
  founding_member: { name: 'Founding Member', icon: '🌟', points: 50, description: 'Among the first 10 registered members', category: 'prestige' }
};

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
