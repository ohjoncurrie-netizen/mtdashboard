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

// Analytics tracking — array of view events kept in localStorage
// Each entry: { type, id, name, extra, ts }
window.ANALYTICS_VIEWS = JSON.parse(localStorage.getItem('analyticsViews')) || [];

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

// Montana cities by county (FIPS code) — US Census Bureau FIPS 30001–30111
window.COUNTY_CITIES = {
  '30001': ['Dillon', 'Lima', 'Dell', 'Wisdom'],                              // Beaverhead
  '30003': ['Hardin', 'Lodge Grass', 'Crow Agency', 'Wyola'],                 // Big Horn
  '30005': ['Chinook', 'Harlem', 'Dodson', 'Zurich'],                         // Blaine
  '30007': ['Townsend', 'Toston'],                                             // Broadwater
  '30009': ['Red Lodge', 'Joliet', 'Bridger', 'Fromberg'],                    // Carbon
  '30011': ['Ekalaka'],                                                        // Carter
  '30013': ['Great Falls', 'Belt', 'Cascade'],                                // Cascade
  '30015': ['Fort Benton', 'Geraldine', 'Highwood', 'Big Sandy'],             // Chouteau
  '30017': ['Miles City'],                                                     // Custer
  '30019': ['Scobey'],                                                         // Daniels
  '30021': ['Glendive', 'Richey'],                                             // Dawson
  '30023': ['Anaconda'],                                                       // Deer Lodge
  '30025': ['Baker', 'Plevna'],                                               // Fallon
  '30027': ['Lewistown', 'Moore', 'Grass Range'],                             // Fergus
  '30029': ['Kalispell', 'Whitefish', 'Columbia Falls', 'Bigfork', 'Lakeside'], // Flathead
  '30031': ['Bozeman', 'Belgrade', 'Manhattan', 'Three Forks', 'West Yellowstone'], // Gallatin
  '30033': ['Jordan'],                                                         // Garfield
  '30035': ['Cut Bank', 'Browning'],                                           // Glacier
  '30037': ['Ryegate'],                                                        // Golden Valley
  '30039': ['Philipsburg', 'Drummond'],                                        // Granite
  '30041': ['Havre', 'Box Elder', 'Rudyard'],                                  // Hill
  '30043': ['Boulder', 'Whitehall', 'Clancy'],                                // Jefferson
  '30045': ['Stanford', 'Geyser', 'Hobson'],                                  // Judith Basin
  '30047': ['Polson', 'Ronan', 'St. Ignatius', 'Pablo'],                      // Lake
  '30049': ['Helena', 'East Helena'],                                          // Lewis and Clark
  '30051': ['Chester', 'Joplin'],                                              // Liberty
  '30053': ['Libby', 'Troy', 'Eureka'],                                        // Lincoln
  '30055': ['Circle', 'Brockway'],                                             // McCone
  '30057': ['Ennis', 'Twin Bridges', 'Virginia City', 'Sheridan'],            // Madison
  '30059': ['White Sulphur Springs', 'Ringling'],                              // Meagher
  '30061': ['Superior', 'Alberton', 'St. Regis'],                             // Mineral
  '30063': ['Missoula', 'Lolo', 'Frenchtown'],                                // Missoula
  '30065': ['Roundup', 'Lavina'],                                              // Musselshell
  '30067': ['Livingston', 'Gardiner', 'Clyde Park'],                          // Park
  '30069': ['Winnett'],                                                        // Petroleum
  '30071': ['Malta', 'Dodson', 'Saco'],                                       // Phillips
  '30073': ['Conrad', 'Valier'],                                               // Pondera
  '30075': ['Broadus', 'Ashland'],                                             // Powder River
  '30077': ['Deer Lodge'],                                                     // Powell
  '30079': ['Terry', 'Mildred'],                                               // Prairie
  '30081': ['Hamilton', 'Darby', 'Stevensville', 'Corvallis', 'Victor'],      // Ravalli
  '30083': ['Sidney', 'Fairview', 'Lambert'],                                  // Richland
  '30085': ['Wolf Point', 'Poplar', 'Brockton', 'Culbertson'],                // Roosevelt
  '30087': ['Forsyth', 'Colstrip'],                                            // Rosebud
  '30089': ['Thompson Falls', 'Plains', 'Hot Springs', 'Dixon'],              // Sanders
  '30091': ['Plentywood', 'Medicine Lake'],                                    // Sheridan
  '30093': ['Butte', 'Walkerville'],                                           // Silver Bow
  '30095': ['Columbus', 'Absarokee'],                                          // Stillwater
  '30097': ['Big Timber', 'Melville'],                                         // Sweet Grass
  '30099': ['Choteau', 'Fairfield', 'Dutton'],                                // Teton
  '30101': ['Shelby', 'Sunburst', 'Kevin'],                                    // Toole
  '30103': ['Hysham'],                                                         // Treasure
  '30105': ['Glasgow', 'Fort Peck', 'Nashua', 'Hinsdale'],                    // Valley
  '30107': ['Harlowton', 'Judith Gap'],                                        // Wheatland
  '30109': ['Wibaux'],                                                         // Wibaux
  '30111': ['Billings', 'Laurel', 'Shepherd', 'Lockwood']                     // Yellowstone
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
