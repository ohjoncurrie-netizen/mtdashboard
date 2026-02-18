// Add Google Maps global init
function initGoogleMaps() {
  window.googleMapsLoaded = true;
}

const COUNTY_NAME_MAP = {
  '30001': 'Beaverhead County', '30003': 'Big Horn County', '30005': 'Blaine County',
  '30007': 'Broadwater County', '30009': 'Carbon County', '30011': 'Carter County',
  '30013': 'Cascade County', '30015': 'Chouteau County', '30017': 'Custer County',
  '30019': 'Daniels County', '30021': 'Dawson County', '30023': 'Deer Lodge County',
  '30025': 'Fallon County', '30027': 'Fergus County', '30029': 'Flathead County',
  '30031': 'Gallatin County', '30033': 'Garfield County', '30035': 'Glacier County',
  '30037': 'Golden Valley County', '30039': 'Granite County', '30041': 'Hill County',
  '30043': 'Jefferson County', '30045': 'Judith Basin County', '30047': 'Lake County',
  '30049': 'Lewis and Clark County', '30051': 'Liberty County', '30053': 'Lincoln County',
  '30055': 'McCone County', '30057': 'Madison County', '30059': 'Meagher County',
  '30061': 'Mineral County', '30063': 'Missoula County', '30065': 'Musselshell County',
  '30067': 'Park County', '30069': 'Petroleum County', '30071': 'Phillips County',
  '30073': 'Pondera County', '30075': 'Powder River County', '30077': 'Powell County',
  '30079': 'Prairie County', '30081': 'Ravalli County', '30083': 'Richland County',
  '30085': 'Roosevelt County', '30087': 'Rosebud County', '30089': 'Sanders County',
  '30091': 'Sheridan County', '30093': 'Silver Bow County', '30095': 'Stillwater County',
  '30097': 'Sweet Grass County', '30099': 'Teton County', '30101': 'Toole County',
  '30103': 'Treasure County', '30105': 'Valley County', '30107': 'Wheatland County',
  '30109': 'Wibaux County', '30111': 'Yellowstone County'
};

class MTApp {
  constructor() {
    this.map = null;
    this.countyLayer = null;
    this.geocoder = null;
    this.businessMarkers = [];
    this.allCounties = [];
    this.currentEditingCounty = null;
    this.currentEditingCity = null;
    this.currentCounty = null;
    this.currentCity = null;
    this.pendingCountyEdit = null;
    this.layers = {};
    this.layerData = this.initializeLayerData();
    this.countySlugToFips = this.buildCountySlugMap();
    this.isUpdatingHash = false;
    this.ds = window.dataService; // Data service (Firebase or localStorage)
  }

  async init() {
    // Setup event listeners FIRST — these don't need Google Maps
    this.setupEventListeners();
    this.setupAuthListeners();
    this.updateAuthUI(null);

    // Initialize the Leaflet map (no Google Maps dependency)
    this.initMap();

    // Load county boundaries
    await this.loadCountyBoundaries();

    // Initialize layer controller and HUD
    this.initializeLayerController();
    this.initializeHUD();

    // Wait for Google Maps with a timeout (only needed for geocoder)
    const googleMapsReady = await Promise.race([
      new Promise(resolve => {
        if (window.googleMapsLoaded) return resolve(true);
        const check = setInterval(() => {
          if (window.googleMapsLoaded) { clearInterval(check); resolve(true); }
        }, 100);
      }),
      new Promise(resolve => setTimeout(() => resolve(false), 8000))
    ]);

    if (googleMapsReady) {
      this.geocoder = new google.maps.Geocoder();
    } else {
      console.warn('⚠️ Google Maps API did not load — geocoder unavailable');
    }
    
    // Populate county dropdown in business form
    this.populateCountyDropdown();
    
    // Check business expiration
    this.checkBusinessExpiration();
    
    // Add business markers
    this.addBusinessMarkers();
    
    // Render business list
    this.renderBusinessList();
    
    // Update footer timestamp
    this.updateTimestamp();

    // Setup county directory
    this.buildCountyDirectory();

    // Update login note based on Firebase availability
    const loginNote = document.getElementById('admin-login-note');
    if (loginNote) {
      if (this.ds && this.ds.isFirebase()) {
        loginNote.textContent = 'Use your Firebase admin email & password.';
      } else {
        loginNote.textContent = 'Default password: admin123 (Configure Firebase for multi-user support)';
      }
    }

    // Setup Firebase auth state listener for auto-login
    if (this.ds && this.ds.isFirebase()) {
      this.ds.onAuthChange((user) => {
        if (user) {
          // User is signed in
          ADMIN_CONFIG.isLoggedIn = true;
          console.log('User authenticated:', user.email);
          // If admin panel is open, show dashboard
          const adminSection = document.getElementById('admin-section');
          const adminLogin = document.getElementById('admin-login');
          const adminDashboard = document.getElementById('admin-dashboard');
          if (adminSection && adminSection.style.display !== 'none') {
            if (adminLogin) adminLogin.style.display = 'none';
            if (adminDashboard) {
              adminDashboard.style.display = 'block';
              this.loadCountyList();
            }
          }
        } else {
          // User is signed out
          ADMIN_CONFIG.isLoggedIn = false;
        }
      });
    }

    // Handle any deep links
    this.handleRouteFromHash();
    window.addEventListener('hashchange', () => this.handleRouteFromHash());
    
    console.log('✅ Montana County Explorer initialized');
  }

  populateCountyDropdown() {
    const countySelect = document.getElementById('biz-county');
    if (!countySelect) return;
    
    // County names mapping
    const countyNames = {
      '30001': 'Flathead', '30003': 'Broadwater', '30005': 'Yellowstone',
      '30007': 'Powder River', '30009': 'Valley', '30011': 'Phillips',
      '30013': 'Custer', '30015': 'Silver Bow', '30017': 'Chouteau',
      '30019': 'Phillips', '30021': 'Missoula', '30023': 'Big Horn',
      '30025': 'Gallatin', '30027': 'Cascade', '30029': 'Dawson',
      '30031': 'Big Horn', '30033': 'Hill', '30035': 'Beaverhead',
      '30037': 'Meagher', '30039': 'Daniels', '30041': 'Toole',
      '30043': 'Powell', '30045': 'Fergus', '30047': 'Rosebud',
      '30049': 'Ravalli', '30051': 'Judith Basin', '30053': 'Park',
      '30055': 'Roosevelt', '30057': 'Musselshell', '30059': 'Sanders',
      '30061': 'Stillwater', '30063': 'Lincoln', '30065': 'Liberty',
      '30067': 'Garfield', '30069': 'Richland', '30071': 'Carbon',
      '30073': 'Lake', '30075': 'Carbon', '30077': 'Prairie',
      '30079': 'Broadwater', '30081': 'Granite', '30083': 'Mineral',
      '30085': 'Teton', '30087': 'Sanders', '30089': 'McCone',
      '30091': 'Sheridan', '30093': 'Silver Bow', '30095': 'Stillwater',
      '30097': 'Sweet Grass', '30099': 'Teton', '30101': 'Toole',
      '30103': 'Treasure', '30105': 'Valley', '30107': 'Wheatland',
      '30109': 'Wibaux', '30111': 'Yellowstone'
    };
    
    // Clear existing options except the first one
    countySelect.innerHTML = '<option value="">Select County...</option>';
    
    // Add all counties alphabetically
    Object.entries(countyNames)
      .sort((a, b) => a[1].localeCompare(b[1]))
      .forEach(([fips, name]) => {
        const option = document.createElement('option');
        option.value = fips;
        option.textContent = name + ' County';
        countySelect.appendChild(option);
      });
  }

  updateTimestamp() {
    const timestampEl = document.getElementById('last-updated');
    if (timestampEl) {
      const now = new Date();
      timestampEl.textContent = `Last updated: ${now.toLocaleDateString()} at ${now.toLocaleTimeString()}`;
    }
  }

  initMap() {
    // Montana boundaries (with slight buffer)
    const montanaBounds = [
      [44.0, -116.5], // Southwest corner
      [49.2, -104.0]  // Northeast corner
    ];
    
    // Initialize Leaflet map centered on Montana
    this.map = L.map('map', {
      center: [46.8797, -110.3626], // Montana center
      zoom: 7,
      minZoom: 6,
      maxZoom: 13,
      maxBounds: montanaBounds,
      maxBoundsViscosity: 1.0 // Makes boundary completely solid (no panning outside)
    });

    // Add vintage-styled base layer using ESRI World Topo Map (free and reliable)
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
      attribution: '&copy; <a href="https://www.esri.com/" target="_blank">Esri</a>',
      maxZoom: 18
    }).addTo(this.map);
  }

  async loadCountyBoundaries() {
    try {
      // Try to load county boundaries from public GeoJSON source
      // Using U.S. Census Bureau county boundaries for Montana (FIPS code 30)
      const countyUrl = 'https://raw.githubusercontent.com/plotly/datasets/master/geojson-counties-fips.json';
      
      const response = await fetch(countyUrl);
      const allCountiesData = await response.json();
      
      // Filter for Montana counties only (FIPS codes starting with "30")
      const montanaCounties = {
        type: 'FeatureCollection',
        features: allCountiesData.features.filter(feature => {
          const fipsCode = feature.id || feature.properties.FIPS || feature.properties.GEO_ID;
          return fipsCode && fipsCode.toString().startsWith('30');
        })
      };
      
      console.log(`Found ${montanaCounties.features.length} Montana counties`);
      
      
      // Create a GeoJSON layer with click functionality
      this.countyLayer = L.geoJSON(montanaCounties, {
        style: {
          fillColor: '#1e3a5f',
          weight: 2,
          opacity: 0.8,
          color: '#2d5a8e',
          dashArray: '4, 4',
          fillOpacity: 0.06
        },
        onEachFeature: (feature, layer) => {
          // Get county name from FIPS code
          const fipsCode = feature.id || feature.properties.FIPS || feature.properties.GEO_ID;
          const countyName = COUNTY_NAME_MAP[fipsCode] || `County ${fipsCode}`;
          
          // Highlight on hover
          layer.on('mouseover', function() {
            this.setStyle({
              fillOpacity: 0.2,
              weight: 3,
              color: '#d4a843'
            });
          });
          
          layer.on('mouseout', function() {
            this.setStyle({
              fillOpacity: 0.06,
              weight: 2,
              color: '#2d5a8e'
            });
          });
          
          // Get custom county data if available
          const customData = COUNTY_DATA[fipsCode] || {};
          
          // Create popup content with enhanced styling using custom data
          let popupContent = `
            <div>
              <h3>📍 ${countyName}</h3>
              <p style="margin: 8px 0; color: var(--ink-dark);">
                <strong>FIPS:</strong> ${fipsCode}
              </p>
              <p style="margin: 10px 0;">
                <a href="#" onclick="window.mtApp.openCountyPage('${fipsCode}', '${countyName}'); return false;"
                   style="color: var(--wood-dark); text-decoration: underline; font-weight: 600;">
                  Open County Page
                </a>
              </p>
          `;
          
          // Add custom data if available
          if (customData.description) {
            popupContent += `
              <p style="margin: 10px 0; color: var(--ink-dark); line-height: 1.6;">
                ${customData.description}
              </p>
            `;
          }
          
          if (customData.seat) {
            popupContent += `
              <p style="margin: 8px 0; color: var(--ink-dark);">
                <strong>County Seat:</strong> ${customData.seat}
              </p>
            `;
          }
          
          if (customData.population) {
            popupContent += `
              <p style="margin: 8px 0; color: var(--ink-dark);">
                <strong>Population:</strong> ${customData.population}
              </p>
            `;
          }
          
          if (customData.established) {
            popupContent += `
              <p style="margin: 8px 0; color: var(--ink-dark);">
                <strong>Established:</strong> ${customData.established}
              </p>
            `;
          }
          
          if (customData.area) {
            popupContent += `
              <p style="margin: 8px 0; color: var(--ink-dark);">
                <strong>Area:</strong> ${customData.area} sq mi
              </p>
            `;
          }
          
          if (customData.poi) {
            popupContent += `
              <p style="margin: 8px 0; color: var(--ink-dark);">
                <strong>Points of Interest:</strong> ${customData.poi}
              </p>
            `;
          }
          
          if (customData.website) {
            popupContent += `
              <p style="margin: 10px 0;">
                <a href="${customData.website}" target="_blank" style="color: var(--wood-dark); text-decoration: underline;">
                  Visit County Website
                </a>
              </p>
            `;
          }
          
          // Add cities list
          const cities = COUNTY_CITIES[fipsCode] || [];
          if (cities.length > 0) {
            popupContent += `
              <div style="margin-top: 15px; padding-top: 15px; border-top: 2px solid var(--parchment-dark);">
                <p style="margin: 8px 0; color: var(--wood-dark);"><strong>🏘️ Cities & Towns:</strong></p>
                <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px;">
            `;
            
            cities.forEach(city => {
              popupContent += `
                <a href="#" 
                   onclick="window.mtApp.openCityPage('${city}', '${countyName}', '${fipsCode}'); return false;"
                   style="display: inline-block; padding: 4px 10px; background: var(--parchment-light); 
                          border: 1px solid var(--wood-dark); border-radius: 4px; color: var(--wood-dark); 
                          text-decoration: none; font-size: 0.9em; transition: all 0.2s;"
                   onmouseover="this.style.background='var(--wood-dark)'; this.style.color='var(--parchment-light)';"
                   onmouseout="this.style.background='var(--parchment-light)'; this.style.color='var(--wood-dark)';">
                  ${city}
                </a>
              `;
            });
            
            popupContent += `
                </div>
              </div>
            `;
          }
          
          popupContent += `</div>`;
          
          // Bind popup to layer
          layer.bindPopup(popupContent, {
            maxWidth: 350,
            className: 'county-popup'
          });
          
          // Open popup on click
          layer.on('click', function(e) {
            this.openPopup();
            // Optionally zoom to county bounds
            // this._map.fitBounds(this.getBounds());
          });
          
          // Add tooltip on hover for quick reference
          layer.bindTooltip(countyName, {
            permanent: false,
            direction: 'center',
            className: 'county-label'
          });
        }
      }).addTo(this.map);
      
      // Fit map to Montana counties
      this.map.fitBounds(this.countyLayer.getBounds());
      
      console.log('✅ Montana county boundaries loaded with click functionality');
      
    } catch (error) {
      console.error('❌ Failed to load county boundaries:', error);
      alert('Could not load county boundaries. Check console for details.');
    }
  }

  setupEventListeners() {
    // Sidebar toggle
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebarClose = document.getElementById('sidebar-close');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    
    if (sidebarToggle) {
      sidebarToggle.addEventListener('click', () => this.toggleSidebar());
    }
    if (sidebarClose) {
      sidebarClose.addEventListener('click', () => this.closeSidebar());
    }
    if (sidebarOverlay) {
      sidebarOverlay.addEventListener('click', () => this.closeSidebar());
    }
    
    // Sidebar navigation links
    const sidebarAdmin = document.getElementById('sidebar-admin');
    const sidebarBusiness = document.getElementById('sidebar-business');
    const sidebarDirectory = document.getElementById('sidebar-directory');
    
    if (sidebarAdmin) {
      sidebarAdmin.addEventListener('click', (e) => {
        e.preventDefault();
        this.closeSidebar();
        this.toggleAdminPanel();
      });
    }
    
    if (sidebarBusiness) {
      sidebarBusiness.addEventListener('click', (e) => {
        e.preventDefault();
        this.closeSidebar();
        this.toggleBusinessForm();
      });
    }

    if (sidebarDirectory) {
      sidebarDirectory.addEventListener('click', (e) => {
        e.preventDefault();
        this.closeSidebar();
        this.showDirectory();
      });
    }
    
    // Directory button in header
    const directoryBtn = document.getElementById('directory-btn');
    if (directoryBtn) {
      directoryBtn.addEventListener('click', () => this.showDirectory());
    }

    // Directory search
    const directorySearch = document.getElementById('directory-search');
    if (directorySearch) {
      directorySearch.addEventListener('input', (e) => this.filterDirectory(e.target.value));
    }

    // Directory back
    const directoryBack = document.getElementById('directory-back-map');
    if (directoryBack) {
      directoryBack.addEventListener('click', () => this.showMapView());
    }

    // Business form submit
    const businessForm = document.getElementById('business-form');
    if (businessForm) {
      businessForm.addEventListener('submit', (e) => this.handleBusinessSubmit(e));
    }
    
    // County dropdown change - update cities
    const countySelect = document.getElementById('biz-county');
    if (countySelect) {
      countySelect.addEventListener('change', (e) => this.updateCityDropdown(e.target.value));
    }
    
    // City modal close (map popup modal)
    const cityModalClose = document.getElementById('city-modal-close');
    const cityModalBack = document.getElementById('city-modal-back');
    if (cityModalClose) {
      cityModalClose.addEventListener('click', () => this.closeCityModal());
    }
    if (cityModalBack) {
      cityModalBack.addEventListener('click', () => this.closeCityModal());
    }

    // County page actions
    const countyBack = document.getElementById('county-back-map');
    const countyEdit = document.getElementById('county-open-admin');

    if (countyBack) {
      countyBack.addEventListener('click', () => this.showMapView());
    }

    if (countyEdit) {
      countyEdit.addEventListener('click', () => {
        if (this.currentCounty) {
          this.openAdminForCounty(this.currentCounty.fips, this.currentCounty.name);
        }
      });
    }

    // City page actions
    const cityBackCounty = document.getElementById('city-back-county');
    const cityEditBtn = document.getElementById('city-open-admin');

    if (cityBackCounty) {
      cityBackCounty.addEventListener('click', () => {
        if (this.currentCounty) {
          this.openCountyPage(this.currentCounty.fips, this.currentCounty.name);
        }
      });
    }

    if (cityEditBtn) {
      cityEditBtn.addEventListener('click', () => {
        if (this.currentCity && this.currentCounty) {
          this.openAdminForCity(this.currentCounty.fips, this.currentCity.name);
        }
      });
    }
    
    // UMap button
    const umapBtn = document.getElementById('umap-btn');
    if (umapBtn) {
      umapBtn.addEventListener('click', () => this.toggleCountyLayer());
    }
    
    // Business button
    const businessBtn = document.getElementById('business-btn');
    if (businessBtn) {
      businessBtn.addEventListener('click', () => this.toggleBusinessForm());
    }

    // Discussion button
    const discussionBtn = document.getElementById('discussion-btn');
    if (discussionBtn) {
      discussionBtn.addEventListener('click', () => this.toggleDiscussionBoard());
    }
    
    // HUD toggle button
    const hudToggleBtn = document.getElementById('hud-toggle-btn');
    if (hudToggleBtn) {
      hudToggleBtn.addEventListener('click', () => this.toggleHUDPanel());
    }
    
    // Admin button
    const adminBtn = document.getElementById('admin-btn');
    if (adminBtn) {
      adminBtn.addEventListener('click', () => this.toggleAdminPanel());
    }
    
    // Admin login
    const adminLoginForm = document.getElementById('admin-login-form');
    if (adminLoginForm) {
      adminLoginForm.addEventListener('submit', (e) => this.handleAdminLogin(e));
    }
    
    // Admin logout
    const adminLogoutBtn = document.getElementById('admin-logout-btn');
    if (adminLogoutBtn) {
      adminLogoutBtn.addEventListener('click', () => this.handleAdminLogout());
    }
    
    // Admin tabs
    document.querySelectorAll('.admin-tab').forEach(tab => {
      tab.addEventListener('click', (e) => this.switchAdminTab(e.target.dataset.tab));
    });
    
    // County search (admin panel)
    const countySearch = document.getElementById('county-search');
    if (countySearch) {
      countySearch.addEventListener('input', (e) => this.filterCounties(e.target.value));
    }

    // City admin county selector
    const cityAdminCounty = document.getElementById('city-admin-county');
    if (cityAdminCounty) {
      cityAdminCounty.addEventListener('change', (e) => this.loadCityList(e.target.value));
    }

    // City admin search
    const cityAdminSearch = document.getElementById('city-admin-search');
    if (cityAdminSearch) {
      cityAdminSearch.addEventListener('input', (e) => this.filterCityList(e.target.value));
    }
    
    // County edit form
    const countyEditForm = document.getElementById('county-edit-form');
    if (countyEditForm) {
      countyEditForm.addEventListener('submit', (e) => this.handleCountyUpdate(e));
    }

    // City edit form
    const cityEditForm = document.getElementById('city-edit-form');
    if (cityEditForm) {
      cityEditForm.addEventListener('submit', (e) => this.handleCityUpdate(e));
    }
    
    // Modal close buttons (county)
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const modalCancelBtn = document.getElementById('modal-cancel-btn');
    if (modalCloseBtn) {
      modalCloseBtn.addEventListener('click', () => this.closeModal());
    }
    if (modalCancelBtn) {
      modalCancelBtn.addEventListener('click', () => this.closeModal());
    }

    // Modal close buttons (city)
    const cityModalCloseBtn = document.getElementById('city-modal-close-btn');
    const cityModalCancelBtn = document.getElementById('city-modal-cancel-btn');
    if (cityModalCloseBtn) {
      cityModalCloseBtn.addEventListener('click', () => this.closeCityEditModal());
    }
    if (cityModalCancelBtn) {
      cityModalCancelBtn.addEventListener('click', () => this.closeCityEditModal());
    }
    
    // Admin settings form
    const adminSettingsForm = document.getElementById('admin-settings-form');
    if (adminSettingsForm) {
      adminSettingsForm.addEventListener('submit', (e) => this.handlePasswordChange(e));
    }

    // ===== USER MANAGEMENT =====

    // Add user button
    const addUserBtn = document.getElementById('add-user-btn');
    if (addUserBtn) {
      addUserBtn.addEventListener('click', () => this.openAddUserModal());
    }

    // Add user form
    const addUserForm = document.getElementById('add-user-form');
    if (addUserForm) {
      addUserForm.addEventListener('submit', (e) => this.handleAddUser(e));
    }

    // User modal close buttons
    const userModalCloseBtn = document.getElementById('user-modal-close-btn');
    const userModalCancelBtn = document.getElementById('user-modal-cancel-btn');
    if (userModalCloseBtn) {
      userModalCloseBtn.addEventListener('click', () => this.closeAddUserModal());
    }
    if (userModalCancelBtn) {
      userModalCancelBtn.addEventListener('click', () => this.closeAddUserModal());
    }

    // ===== EVENTS ADMIN =====

    // Add event button
    const addEventBtn = document.getElementById('add-event-btn');
    if (addEventBtn) {
      addEventBtn.addEventListener('click', () => this.openEventEditor());
    }

    // Event filter dropdowns and search
    const eventFilterCounty = document.getElementById('event-filter-county');
    const eventFilterType = document.getElementById('event-filter-type');
    const eventSearch = document.getElementById('event-search');

    if (eventFilterCounty) {
      eventFilterCounty.addEventListener('change', () => this.filterEventList());
    }
    if (eventFilterType) {
      eventFilterType.addEventListener('change', () => this.filterEventList());
    }
    if (eventSearch) {
      eventSearch.addEventListener('input', () => this.filterEventList());
    }

    // Event edit form
    const eventEditForm = document.getElementById('event-edit-form');
    if (eventEditForm) {
      eventEditForm.addEventListener('submit', (e) => this.handleEventSubmit(e));
    }

    // Event county dropdown change - update cities
    const eventCountySelect = document.getElementById('edit-event-county');
    if (eventCountySelect) {
      eventCountySelect.addEventListener('change', (e) => this.updateEventCityDropdown(e.target.value));
    }

    // Event modal close buttons
    const eventModalCloseBtn = document.getElementById('event-modal-close-btn');
    const eventModalCancelBtn = document.getElementById('event-modal-cancel-btn');
    const eventDeleteBtn = document.getElementById('event-delete-btn');

    if (eventModalCloseBtn) {
      eventModalCloseBtn.addEventListener('click', () => this.closeEventEditModal());
    }
    if (eventModalCancelBtn) {
      eventModalCancelBtn.addEventListener('click', () => this.closeEventEditModal());
    }
    if (eventDeleteBtn) {
      eventDeleteBtn.addEventListener('click', () => this.handleEventDelete());
    }
  }

  toggleCountyLayer() {
    if (this.countyLayer) {
      if (this.map.hasLayer(this.countyLayer)) {
        this.map.removeLayer(this.countyLayer);
        console.log('County layer hidden');
      } else {
        this.map.addLayer(this.countyLayer);
        console.log('County layer shown');
      }
    }
  }

  toggleBusinessForm() {
    const formSection = document.getElementById('business-form-section');
    if (formSection) {
      formSection.style.display = formSection.style.display === 'none' ? 'block' : 'none';
    }
  }

  toggleDiscussionBoard() {
    const mapSection = document.getElementById('map-section');
    const discussionSection = document.getElementById('discussion-section');
    
    if (discussionSection) {
      // Hide map, show discussion
      if (discussionSection.style.display === 'none') {
        discussionSection.style.display = 'block';
        if (mapSection) mapSection.style.display = 'none';
        this.initializeDiscussionBoard();
      } else {
        discussionSection.style.display = 'none';
        if (mapSection) mapSection.style.display = 'block';
      }
    }
  }

  initializeDiscussionBoard() {
    // Setup discussion form
    const discussionForm = document.getElementById('discussion-post-form');
    if (discussionForm) {
      discussionForm.addEventListener('submit', (e) => this.handleDiscussionPost(e));
    }

    // Setup filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.filterDiscussions(e.target.dataset.filter));
    });

    // Setup search
    const searchInput = document.getElementById('discussion-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => this.searchDiscussions(e.target.value));
    }

    // Close button
    const closeBtn = document.getElementById('discussion-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.toggleDiscussionBoard());
    }

    // Render initial discussions
    this.renderDiscussions();
    this.updateLeaderboard();
  }

  async handleDiscussionPost(e) {
    e.preventDefault();

    const username = document.getElementById('discussion-username').value.trim();
    const topic = document.getElementById('discussion-topic').value.trim();
    const message = document.getElementById('discussion-message').value.trim();
    const category = document.getElementById('discussion-category').value;

    if (!username || !topic || !message || !category) {
      this.showNotification('❌ Please fill in all fields', 'error');
      return;
    }

    // Create post object
    const post = {
      id: `post_${Date.now()}`,
      username: username,
      topic: topic,
      message: message,
      category: category,
      timestamp: new Date().toISOString(),
      helpful: 0,
      replies: [],
      points: 0
    };

    // Award points based on category expertise
    if (category === 'wildlife') post.points = 15;
    else if (category === 'history') post.points = 15;
    else if (category === 'hiking') post.points = 10;
    else if (category === 'geology') post.points = 15;
    else post.points = 5;

    // Add to discussions
    DISCUSSION_POSTS.unshift(post);
    localStorage.setItem('discussionPosts', JSON.stringify(DISCUSSION_POSTS));

    // Update or create member profile
    if (!MEMBER_PROFILES[username]) {
      MEMBER_PROFILES[username] = {
        name: username,
        totalPoints: 0,
        postCount: 0,
        awards: []
      };
    }
    MEMBER_PROFILES[username].totalPoints += post.points;
    MEMBER_PROFILES[username].postCount += 1;
    localStorage.setItem('memberProfiles', JSON.stringify(MEMBER_PROFILES));

    // Check for awards
    this.awardMembersForActivity(username);

    this.showNotification(`✅ Discussion posted! You earned ${post.points} points!`, 'success');
    e.target.reset();
    this.renderDiscussions();
    this.updateLeaderboard();
  }

  getCategoryEmoji(category) {
    const categoryMaps = {
      'wildlife': '🦌',
      'history': '📜',
      'hiking': '🏔️',
      'cities': '🏘️',
      'geology': '🪨',
      'tips': '💡',
      'general': '🗨️'
    };
    return categoryMaps[category] || '🗨️';
  }

  getCategoryLabel(category) {
    const labels = {
      'wildlife': 'Wildlife & Nature',
      'history': 'History & Culture',
      'hiking': 'Hiking & Outdoor',
      'cities': 'Cities & Towns',
      'geology': 'Geology & Geography',
      'tips': 'Local Tips',
      'general': 'General'
    };
    return labels[category] || 'General';
  }

  renderDiscussions(filter = 'all', searchTerm = '') {
    const list = document.getElementById('discussions-list');
    if (!list) return;

    let filtered = DISCUSSION_POSTS;

    // Filter by category
    if (filter !== 'all') {
      filtered = filtered.filter(p => p.category === filter);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.topic.toLowerCase().includes(term) ||
        p.message.toLowerCase().includes(term) ||
        p.username.toLowerCase().includes(term)
      );
    }

    if (filtered.length === 0) {
      list.innerHTML = '<p class="empty-state">No discussions found.</p>';
      return;
    }

    list.innerHTML = filtered.map(post => `
      <div class="discussion-post">
        <div class="post-header">
          <div class="post-author">
            <span class="post-author-name">${this.escapeHtml(post.username)}</span>
            <span class="post-author-rank">${this.getMemberRank(post.username)}</span>
          </div>
          <span class="post-time">${this.formatDate(post.timestamp)}</span>
        </div>
        <span class="post-category-badge">${this.getCategoryEmoji(post.category)} ${this.getCategoryLabel(post.category)}</span>
        <h3 class="post-topic">${this.escapeHtml(post.topic)}</h3>
        <div class="post-content">${this.escapeHtml(post.message)}</div>
        <div class="post-stats">
          <div class="stat-item">👍 <span>${post.helpful || 0} Helpful</span></div>
          <div class="stat-item">⭐ <span>${post.points} Points</span></div>
          <div class="stat-item">💬 <span>${post.replies ? post.replies.length : 0} Replies</span></div>
        </div>
        <div class="post-actions">
          <button class="action-btn" onclick="mtApp.markPostHelpful('${post.id}')">👍 Helpful</button>
          <button class="action-btn" onclick="mtApp.togglePostReplies('${post.id}')">💬 Reply</button>
        </div>
        <div id="replies-${post.id}" class="post-replies" style="display: none;"></div>
      </div>
    `).join('');
  }

  markPostHelpful(postId) {
    const post = DISCUSSION_POSTS.find(p => p.id === postId);
    if (post) {
      post.helpful = (post.helpful || 0) + 1;
      post.points = (post.points || 0) + 5;
      
      // Award helpful contributor badge
      this.awardMembersForActivity(post.username);
      
      localStorage.setItem('discussionPosts', JSON.stringify(DISCUSSION_POSTS));
      this.showNotification('✅ Marked as helpful! Author earned bonus points', 'success');
      this.renderDiscussions();
      this.updateLeaderboard();
    }
  }

  togglePostReplies(postId) {
    const repliesContainer = document.getElementById(`replies-${postId}`);
    if (repliesContainer) {
      repliesContainer.style.display = repliesContainer.style.display === 'none' ? 'block' : 'none';
    }
  }

  filterDiscussions(category) {
    // Update active button
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    
    // Find and activate the clicked button
    if (event && event.target) {
      event.target.classList.add('active');
    }
    
    this.renderDiscussions(category);
  }

  searchDiscussions(term) {
    const activeFilter = document.querySelector('.filter-btn.active')?.dataset.filter || 'all';
    this.renderDiscussions(activeFilter, term);
  }

  updateLeaderboard() {
    const leaderboard = document.getElementById('leaderboard');
    if (!leaderboard) return;

    const members = Object.values(MEMBER_PROFILES)
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .slice(0, 10);

    if (members.length === 0) {
      leaderboard.innerHTML = '<p class="empty-state">No members yet</p>';
      return;
    }

    leaderboard.innerHTML = members.map((member, index) => `
      <div class="member-item">
        <span class="member-rank">#${index + 1}</span>
        <span class="member-name">${this.escapeHtml(member.name)}</span>
        <span class="member-points">${member.totalPoints} pts • ${member.postCount} posts</span>
      </div>
    `).join('');
  }

  awardMembersForActivity(username) {
    if (!MEMBER_PROFILES[username]) return;

    const member = MEMBER_PROFILES[username];
    const currentAwards = member.awards || [];

    // Check for award eligibility
    if (member.postCount >= 10 && !currentAwards.includes('montana_expert')) {
      member.awards.push('montana_expert');
      this.showNotification(`🏆 ${username} earned the "Montana Expert" award!`, 'success');
    }
    if (member.totalPoints >= 200 && !currentAwards.includes('community_champion')) {
      member.awards.push('community_champion');
      this.showNotification(`⭐ ${username} earned the "Community Champion" award!`, 'success');
    }

    localStorage.setItem('memberProfiles', JSON.stringify(MEMBER_PROFILES));
  }

  getMemberRank(username) {
    const member = MEMBER_PROFILES[username];
    if (!member) return '👤 Member';
    if (member.awards?.includes('community_champion')) return '⭐ Champion';
    if (member.awards?.includes('montana_expert')) return '🏆 Expert';
    if (member.totalPoints >= 100) return '⭐ Star Member';
    if (member.totalPoints >= 50) return '✨ Active Member';
    return '👤 Member';
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  formatDate(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  }

  toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    
    if (sidebar && overlay) {
      const isOpen = sidebar.classList.contains('active');
      
      if (isOpen) {
        this.closeSidebar();
      } else {
        sidebar.classList.add('active');
        overlay.classList.add('active');
      }
    }
  }

  closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    
    if (sidebar && overlay) {
      sidebar.classList.remove('active');
      overlay.classList.remove('active');
    }
  }

  updateCityDropdown(fipsCode) {
    const citySelect = document.getElementById('biz-city');
    if (!citySelect) return;
    
    citySelect.innerHTML = '<option value="">Select City...</option>';
    
    const cities = COUNTY_CITIES[fipsCode] || [];
    cities.forEach(city => {
      const option = document.createElement('option');
      option.value = city;
      option.textContent = city;
      citySelect.appendChild(option);
    });
    
    citySelect.disabled = cities.length === 0;
  }

  openCityPage(cityName, countyName, fipsCode) {
    this.currentCounty = { fips: fipsCode, name: countyName };
    this.currentCity = { name: cityName };
    this.renderCityPage(cityName, countyName, fipsCode);
    this.showCityPage();
    this.setBreadcrumb({ countyName, cityName });
    this.setHash(`/montana/${this.slugify(countyName)}/${this.slugify(cityName)}`);
    const cityEditBtn = document.getElementById('city-open-admin');
    if (cityEditBtn) cityEditBtn.style.display = ADMIN_CONFIG.isLoggedIn ? '' : 'none';
  }

  renderCityPage(cityName, countyName, fipsCode) {
    const titleEl = document.getElementById('city-page-title');
    const countyLabel = document.getElementById('city-page-county-label');
    const descriptionEl = document.getElementById('city-page-description');
    const metaEl = document.getElementById('city-meta');
    const activitiesEl = document.getElementById('city-page-activities');
    const highlightsEl = document.getElementById('city-page-highlights');
    const businessesEl = document.getElementById('city-page-businesses');

    if (!titleEl) return;

    const citySlug = this.slugify(cityName);
    const key = `${fipsCode}_${citySlug}`;
    const cityData = CITY_DATA[key] || {};

    titleEl.textContent = cityName;
    countyLabel.textContent = `${countyName} · Montana`;
    descriptionEl.textContent = cityData.description || `Discover ${cityName}, a community in ${countyName}, Montana.`;

    // Meta
    const metaItems = [
      { label: 'Population', value: cityData.population },
      { label: 'Elevation', value: cityData.elevation },
      { label: 'Website', value: cityData.website, isLink: true }
    ].filter(i => i.value);

    if (metaItems.length) {
      metaEl.innerHTML = metaItems.map(item => {
        if (item.isLink) {
          return `<div class="county-meta-item"><span>${item.label}</span><a href="${item.value}" target="_blank">${item.value}</a></div>`;
        }
        return `<div class="county-meta-item"><span>${item.label}</span><strong>${item.value}</strong></div>`;
      }).join('');
    } else {
      metaEl.innerHTML = '';
    }

    // Activities
    if (cityData.activities) {
      const items = cityData.activities.split(',').map(a => a.trim()).filter(Boolean);
      activitiesEl.innerHTML = items.map(a => `<span class="city-chip">${a}</span>`).join(' ');
    } else {
      activitiesEl.innerHTML = '<em>No activities listed yet. Add them in the admin panel.</em>';
    }

    // Highlights
    if (cityData.highlights) {
      const items = cityData.highlights.split(',').map(h => h.trim()).filter(Boolean);
      highlightsEl.innerHTML = items.map(h => `<span class="city-chip">${h}</span>`).join(' ');
    } else {
      highlightsEl.innerHTML = '<em>No highlights listed yet.</em>';
    }

    // Businesses in this city
    const cityBusinesses = BUSINESSES.filter(b =>
      b.active && b.city === cityName && b.county === fipsCode
    );
    if (cityBusinesses.length > 0) {
      businessesEl.innerHTML = cityBusinesses.map(biz => `
        <div class="business-item" style="padding: 12px; margin-bottom: 10px; background: var(--parchment-light);
             border: 1px solid var(--wood-dark); border-radius: 6px;">
          <h4 style="margin: 0 0 8px 0; color: var(--wood-dark);">
            ${biz.icon} ${biz.name}
          </h4>
          <p style="margin: 4px 0; color: var(--ink-dark); font-size: 0.9em;">📍 ${biz.address}</p>
          ${biz.phone ? `<p style="margin: 4px 0; color: var(--ink-dark); font-size: 0.9em;">📞 ${biz.phone}</p>` : ''}
          ${biz.website ? `<p style="margin: 8px 0 0 0;"><a href="${biz.website}" target="_blank" style="color: var(--wood-dark); text-decoration: underline;">Visit Website</a></p>` : ''}
        </div>
      `).join('');
    } else {
      businessesEl.innerHTML = `<p style="color: var(--ink-dark); font-style: italic;">No businesses registered in ${cityName} yet. Be the first!</p>`;
    }

    // Render events
    const eventsEl = document.getElementById('city-events-list');
    if (eventsEl) {
      const cityEvents = this.getCityEvents(fipsCode, citySlug);
      eventsEl.innerHTML = this.renderEventsSection(cityEvents);
    }
  }

  showCityPage() {
    const cityPage = document.getElementById('city-page');
    const countyPage = document.getElementById('county-page');
    const mapSection = document.getElementById('map-section');
    const infoSection = document.getElementById('info-section');
    const directory = document.getElementById('directory-section');
    const cityModal = document.getElementById('city-modal');

    if (cityPage) cityPage.style.display = 'block';
    if (countyPage) countyPage.style.display = 'none';
    if (mapSection) mapSection.style.display = 'none';
    if (infoSection) infoSection.style.display = 'none';
    if (directory) directory.style.display = 'none';
    if (cityModal) cityModal.style.display = 'none';
  }

  closeCityModal() {
    const modal = document.getElementById('city-modal');
    if (modal) {
      modal.style.display = 'none';
    }

    if (this.currentCounty) {
      this.currentCity = null;
      this.openCountyPage(this.currentCounty.fips, this.currentCounty.name);
    }
  }

  // ===== COUNTY DIRECTORY =====

  buildCountyDirectory() {
    const grid = document.getElementById('directory-grid');
    if (!grid) return;

    // Populate city admin county dropdown too
    const cityAdminCounty = document.getElementById('city-admin-county');

    const entries = Object.entries(COUNTY_NAME_MAP)
      .map(([fips, name]) => ({ fips, name, shortName: name.replace(/\s+County$/i, '') }))
      .sort((a, b) => a.shortName.localeCompare(b.shortName));

    this._directoryEntries = entries; // cache for search

    this.renderDirectoryGrid(entries);

    // Populate city admin county dropdown
    if (cityAdminCounty) {
      cityAdminCounty.innerHTML = '<option value="">Select County...</option>';
      entries.forEach(({ fips, name }) => {
        const opt = document.createElement('option');
        opt.value = fips;
        opt.textContent = name;
        cityAdminCounty.appendChild(opt);
      });
    }
  }

  renderDirectoryGrid(entries) {
    const grid = document.getElementById('directory-grid');
    if (!grid) return;

    if (entries.length === 0) {
      grid.innerHTML = '<p class="empty-state">No counties match your search.</p>';
      return;
    }

    grid.innerHTML = entries.map(({ fips, name, shortName }) => {
      const data = COUNTY_DATA[fips] || {};
      const cities = COUNTY_CITIES[fips] || [];
      return `
        <a href="#/montana/${this.slugify(name)}" class="directory-card"
           onclick="window.mtApp.openCountyPage('${fips}', '${name.replace(/'/g, "\\'")}'); return false;">
          <h4>${shortName}</h4>
          <div class="directory-card-meta">
            ${data.seat ? `<span>🏛️ ${data.seat}</span>` : ''}
            ${data.population ? `<span>👥 ${data.population}</span>` : ''}
            <span>🏘️ ${cities.length} cities</span>
          </div>
        </a>
      `;
    }).join('');
  }

  filterDirectory(term) {
    if (!this._directoryEntries) return;
    if (!term) {
      this.renderDirectoryGrid(this._directoryEntries);
      return;
    }
    const lower = term.toLowerCase();
    const filtered = this._directoryEntries.filter(e =>
      e.name.toLowerCase().includes(lower) ||
      e.shortName.toLowerCase().includes(lower) ||
      e.fips.includes(term)
    );
    this.renderDirectoryGrid(filtered);
  }

  showDirectory() {
    const directory = document.getElementById('directory-section');
    const mapSection = document.getElementById('map-section');
    const countyPage = document.getElementById('county-page');
    const cityPage = document.getElementById('city-page');
    const adminSection = document.getElementById('admin-section');
    const businessForm = document.getElementById('business-form-section');

    if (directory) directory.style.display = 'block';
    if (mapSection) mapSection.style.display = 'none';
    if (countyPage) countyPage.style.display = 'none';
    if (cityPage) cityPage.style.display = 'none';
    if (adminSection) adminSection.style.display = 'none';
    if (businessForm) businessForm.style.display = 'none';

    this.currentCounty = null;
    this.currentCity = null;
    this.setBreadcrumb({});
    this.setHash('/montana');
  }

  refresh() {
    window.location.reload();
  }

  addBusinessMarkers() {
    // Clear existing markers
    this.businessMarkers.forEach(marker => this.map.removeLayer(marker));
    this.businessMarkers = [];
    
    // Add markers for active businesses
    BUSINESSES.filter(b => b.active).forEach(business => {
      const displayAddress = business.city ? `${business.address}, ${business.city}` : (business.fullAddress || business.address);
      const marker = L.marker([business.lat, business.lng])
        .bindPopup(`
          <div>
            <h3>${business.icon} ${business.name}</h3>
            <p style="margin: 8px 0;">📍 ${displayAddress}</p>
            ${business.phone ? `<p style="margin: 8px 0;">📞 ${business.phone}</p>` : ''}
            ${business.website ? `<p style="margin: 8px 0;"><a href="${business.website}" target="_blank" style="color: var(--wood-dark); text-decoration: underline;">Visit Website</a></p>` : ''}
          </div>
        `)
        .addTo(this.map);
      
      this.businessMarkers.push(marker);
    });
  }

  async handleBusinessSubmit(e) {
    e.preventDefault();
    
    const button = e.target.querySelector('button');
    const originalText = button.textContent;
    button.textContent = 'Geocoding Location...';
    button.disabled = true;

    try {
      const county = document.getElementById('biz-county').value;
      const city = document.getElementById('biz-city').value;
      const address = document.getElementById('biz-address').value;
      
      if (!county || !city) {
        throw new Error('Please select both county and city');
      }
      
      // 🌍 REAL GOOGLE MAPS GEOCODING
      const fullAddress = `${address}, ${city}, Montana, USA`;
      const geocodeResult = await new Promise((resolve, reject) => {
        this.geocoder.geocode(
          { 
            address: fullAddress,
            componentRestrictions: { country: 'US', administrativeArea: 'MT' }
          },
          (results, status) => {
            if (status === 'OK' && results[0]) {
              resolve({
                lat: results[0].geometry.location.lat(),
                lng: results[0].geometry.location.lng(),
                formatted: results[0].formatted_address
              });
            } else {
              reject(new Error(`Geocoding failed: ${status}`));
            }
          }
        );
      });

      // Create business with REAL coordinates
      const business = {
        id: 'biz_' + Date.now(),
        name: document.getElementById('biz-name').value,
        county: county,
        city: city,
        address: address,
        fullAddress: geocodeResult.formatted,
        phone: document.getElementById('biz-phone').value,
        website: document.getElementById('biz-website').value,
        icon: document.getElementById('biz-icon').value || '🏪',
        lat: geocodeResult.lat,
        lng: geocodeResult.lng,
        active: true,
        expires: new Date(Date.now() + 30*24*60*60*1000).toISOString()
      };

      BUSINESSES.push(business);
      localStorage.setItem('mtBusinesses', JSON.stringify(BUSINESSES));
      
      this.addBusinessMarkers();
      this.renderBusinessList();
      
      alert(`✅ ${business.name} added successfully!\n📍 ${city}, ${geocodeResult.formatted}\n💳 Subscription activated. Expires: ${new Date(business.expires).toLocaleDateString()}`);
      
      document.getElementById('business-form').reset();
      document.getElementById('biz-city').innerHTML = '<option value="">Select County First...</option>';
      document.getElementById('business-form-section').style.display = 'none';
      
    } catch (error) {
      alert(`❌ ${error.message}\n\nPlease verify the address and try again.`);
    } finally {
      button.textContent = originalText;
      button.disabled = false;
    }
  }

  renderBusinessList() {
    const businessList = document.getElementById('business-list');
    if (!businessList) return;
    
    const activeBusinesses = BUSINESSES.filter(b => b.active);
    
    if (activeBusinesses.length === 0) {
      businessList.innerHTML = '<p class="empty-state">No businesses listed yet</p>';
      return;
    }
    
    businessList.innerHTML = activeBusinesses.map(business => `
      <div style="padding: 0.75rem; margin-bottom: 0.75rem; border-bottom: 1px solid var(--parchment-dark);">
        <strong>${business.icon} ${business.name}</strong><br>
        <small style="color: var(--ink-light);">${business.address}</small>
        ${business.phone ? `<br><small>📞 ${business.phone}</small>` : ''}
      </div>
    `).join('');
  }

  // ===== ADMIN PANEL METHODS =====
  
  toggleAdminPanel() {
    const adminSection = document.getElementById('admin-section');
    const otherSections = ['business-form-section', 'map-section', 'county-page', 'city-page', 'directory-section'];
    
    if (adminSection.style.display === 'none') {
      adminSection.style.display = 'block';
      otherSections.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
      });
      
      // Load counties if logged in
      if (ADMIN_CONFIG.isLoggedIn) {
        document.getElementById('admin-login').style.display = 'none';
        document.getElementById('admin-dashboard').style.display = 'block';
        this.loadCountyList();
      } else {
        document.getElementById('admin-login').style.display = 'block';
        document.getElementById('admin-dashboard').style.display = 'none';
      }
    } else {
      adminSection.style.display = 'none';
      const mapSection = document.querySelector('.map-section');
      if (mapSection) mapSection.style.display = 'block';
    }
  }

  async handleAdminLogin(e) {
    e.preventDefault();
    const password = document.getElementById('admin-password').value;
    const email = document.getElementById('admin-email')?.value || '';
    const errorDiv = document.getElementById('admin-login-error');

    // Hide previous errors
    if (errorDiv) {
      errorDiv.style.display = 'none';
      errorDiv.textContent = '';
    }

    const result = await this.ds.login(email, password);

    if (result.success) {
      ADMIN_CONFIG.isLoggedIn = true;
      document.getElementById('admin-login').style.display = 'none';
      document.getElementById('admin-dashboard').style.display = 'block';
      document.getElementById('admin-password').value = '';
      document.getElementById('admin-email').value = '';
      this.loadCountyList();
      if (this.pendingCountyEdit) {
        if (this.pendingCountyEdit.isCity) {
          this.openAdminForCity(this.pendingCountyEdit.fips, this.pendingCountyEdit.name);
        } else {
          this.openCountyEditor(this.pendingCountyEdit.fips, this.pendingCountyEdit.name);
        }
        this.pendingCountyEdit = null;
      }
    } else {
      // Show error message
      if (errorDiv) {
        errorDiv.textContent = `❌ ${result.error}`;
        errorDiv.style.display = 'block';
      }
      document.getElementById('admin-password').value = '';
    }
  }

  async handleAdminLogout() {
    ADMIN_CONFIG.isLoggedIn = false;
    if (this.ds) await this.ds.logout();
    document.getElementById('admin-dashboard').style.display = 'none';
    document.getElementById('admin-login').style.display = 'block';
    document.getElementById('admin-section').style.display = 'none';
    const mapSection = document.querySelector('.map-section');
    if (mapSection) mapSection.style.display = 'block';
  }

  switchAdminTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.admin-tab').forEach(tab => {
      tab.classList.remove('active');
      if (tab.dataset.tab === tabName) {
        tab.classList.add('active');
      }
    });

    // Update tab content
    document.querySelectorAll('.admin-tab-content').forEach(content => {
      content.style.display = 'none';
    });

    const activeTab = document.getElementById(`tab-${tabName}`);
    if (activeTab) {
      activeTab.style.display = 'block';
    }

    // Load data for specific tabs
    if (tabName === 'users') {
      this.loadUserList();
    } else if (tabName === 'events') {
      this.populateEventCountyDropdown();
      this.loadEventList();
    } else if (tabName === 'community-awards') {
      this.setupCommunityAwardsTab();
    }
  }

  loadCountyList() {
    const countyList = document.getElementById('county-list');
    if (!countyList) return;
    
    // Get all Montana counties from our data
    const countyNames = COUNTY_NAME_MAP;
    
    this.allCounties = Object.entries(countyNames).map(([fips, name]) => ({
      fips,
      name,
      data: COUNTY_DATA[fips] || null
    }));
    
    this.renderCountyList(this.allCounties);
  }

  renderCountyList(counties) {
    const countyList = document.getElementById('county-list');
    if (!countyList) return;
    
    if (counties.length === 0) {
      countyList.innerHTML = '<p class="empty-state">No counties found</p>';
      return;
    }
    
    countyList.innerHTML = counties.map(county => {
      const hasData = county.data && Object.keys(county.data).length > 0;
      return `
        <div class="county-item" data-fips="${county.fips}">
          <div class="county-item-info">
            <h4>${county.name}</h4>
            <p>FIPS: ${county.fips}</p>
          </div>
          <div class="county-item-status">
            <span class="status-badge ${hasData ? 'has-data' : 'no-data'}">
              ${hasData ? '✓ Customized' : 'Default'}
            </span>
            <button class="edit-btn" onclick="app.openCountyEditor('${county.fips}', '${county.name}')">
              Edit
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  filterCounties(searchTerm) {
    if (!searchTerm) {
      this.renderCountyList(this.allCounties);
      return;
    }
    
    const filtered = this.allCounties.filter(county =>
      county.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      county.fips.includes(searchTerm)
    );
    
    this.renderCountyList(filtered);
  }

  openCountyEditor(fips, name) {
    this.currentEditingCounty = fips;
    const countyData = COUNTY_DATA[fips] || {};
    
    // Populate form
    document.getElementById('modal-county-name').textContent = `Edit ${name}`;
    document.getElementById('edit-county-id').value = fips;
    document.getElementById('edit-county-display-name').value = name;
    document.getElementById('edit-county-description').value = countyData.description || '';
    document.getElementById('edit-county-population').value = countyData.population || '';
    document.getElementById('edit-county-seat').value = countyData.seat || '';
    document.getElementById('edit-county-established').value = countyData.established || '';
    document.getElementById('edit-county-area').value = countyData.area || '';
    document.getElementById('edit-county-website').value = countyData.website || '';
    document.getElementById('edit-county-poi').value = countyData.poi || '';
    
    // Show modal
    document.getElementById('county-edit-modal').style.display = 'flex';
  }

  closeModal() {
    document.getElementById('county-edit-modal').style.display = 'none';
    this.currentEditingCounty = null;
  }

  async handleCountyUpdate(e) {
    e.preventDefault();
    
    const fips = document.getElementById('edit-county-id').value;
    const countyData = {
      description: document.getElementById('edit-county-description').value,
      population: document.getElementById('edit-county-population').value,
      seat: document.getElementById('edit-county-seat').value,
      established: document.getElementById('edit-county-established').value,
      area: document.getElementById('edit-county-area').value,
      website: document.getElementById('edit-county-website').value,
      poi: document.getElementById('edit-county-poi').value
    };
    
    // Save via data service (Firebase + localStorage)
    if (this.ds) {
      await this.ds.saveCountyData(fips, countyData);
    }
    // Also update in-memory
    COUNTY_DATA[fips] = countyData;
    
    // Update the county list display
    this.loadCountyList();
    
    // Close modal
    this.closeModal();

    if (this.currentCounty && this.currentCounty.fips === fips) {
      this.renderCountyPage(fips, this.currentCounty.name);
    }

    // Refresh directory card
    this.buildCountyDirectory();
    
    alert('✅ County information updated successfully!');
  }

  async handlePasswordChange(e) {
    e.preventDefault();
    
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    if (!newPassword || !confirmPassword) {
      alert('❌ Please fill in both password fields.');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      alert('❌ Passwords do not match.');
      return;
    }
    
    if (newPassword.length < 6) {
      alert('❌ Password must be at least 6 characters long.');
      return;
    }

    if (this.ds) {
      const result = await this.ds.changePassword(newPassword);
      if (!result.success) {
        alert(`❌ ${result.error}`);
        return;
      }
    }
    
    ADMIN_CONFIG.password = newPassword;
    localStorage.setItem('adminPassword', newPassword);
    
    document.getElementById('new-password').value = '';
    document.getElementById('confirm-password').value = '';
    
    alert('✅ Admin password updated successfully!');
  }

  buildCountySlugMap() {
    const slugMap = {};
    Object.entries(COUNTY_NAME_MAP).forEach(([fips, name]) => {
      const cleaned = name.replace(/\s+County$/i, '');
      slugMap[this.slugify(cleaned)] = fips;
    });
    return slugMap;
  }

  slugify(value) {
    return value
      .toString()
      .toLowerCase()
      .replace(/\s+county$/i, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  setHash(path) {
    if (this.isUpdatingHash) return;
    this.isUpdatingHash = true;
    window.location.hash = `#${path}`;
    window.setTimeout(() => {
      this.isUpdatingHash = false;
    }, 0);
  }

  setBreadcrumb({ countyName = null, cityName = null }) {
    const countyEl = document.getElementById('breadcrumb-county');
    const cityEl = document.getElementById('breadcrumb-city');
    const countySep = document.getElementById('breadcrumb-sep-county');
    const citySep = document.getElementById('breadcrumb-sep-city');

    if (!countyEl || !cityEl || !countySep || !citySep) return;

    if (countyName) {
      countyEl.textContent = countyName;
      countyEl.classList.remove('disabled');
      countyEl.href = `#/montana/${this.slugify(countyName)}`;
      countyEl.style.display = 'inline-flex';
      countySep.style.display = 'inline-flex';
    } else {
      countyEl.textContent = 'County';
      countyEl.classList.add('disabled');
      countyEl.href = '#/montana';
      countyEl.style.display = 'none';
      countySep.style.display = 'none';
    }

    if (cityName) {
      cityEl.textContent = cityName;
      cityEl.style.display = 'inline-flex';
      citySep.style.display = 'inline-flex';
    } else {
      cityEl.textContent = 'City';
      cityEl.style.display = 'none';
      citySep.style.display = 'none';
    }
  }

  showCountyPage() {
    const countyPage = document.getElementById('county-page');
    const mapSection = document.getElementById('map-section');
    const infoSection = document.getElementById('info-section');
    const cityPage = document.getElementById('city-page');
    const directory = document.getElementById('directory-section');

    if (countyPage) countyPage.style.display = 'block';
    if (mapSection) mapSection.style.display = 'none';
    if (infoSection) infoSection.style.display = 'none';
    if (cityPage) cityPage.style.display = 'none';
    if (directory) directory.style.display = 'none';
  }

  showMapView() {
    const countyPage = document.getElementById('county-page');
    const mapSection = document.getElementById('map-section');
    const cityPage = document.getElementById('city-page');
    const directory = document.getElementById('directory-section');
    const adminSection = document.getElementById('admin-section');
    const businessForm = document.getElementById('business-form-section');

    if (countyPage) countyPage.style.display = 'none';
    if (mapSection) mapSection.style.display = 'block';
    if (cityPage) cityPage.style.display = 'none';
    if (directory) directory.style.display = 'none';
    if (adminSection) adminSection.style.display = 'none';
    if (businessForm) businessForm.style.display = 'none';

    this.currentCounty = null;
    this.currentCity = null;
    this.setBreadcrumb({});
    this.setHash('/montana');
  }

  renderCountyPage(fipsCode, countyName) {
    const titleEl = document.getElementById('county-page-title');
    const descriptionEl = document.getElementById('county-page-description');
    const metaEl = document.getElementById('county-meta');
    const citiesEl = document.getElementById('county-cities-list');

    if (!titleEl || !descriptionEl || !metaEl || !citiesEl) return;

    const countyData = COUNTY_DATA[fipsCode] || {};
    const description = countyData.description || `Explore ${countyName} and discover local history, landmarks, and activities.`;

    titleEl.textContent = countyName;
    descriptionEl.textContent = description;

    const metaItems = [
      { label: 'County Seat', value: countyData.seat },
      { label: 'Population', value: countyData.population },
      { label: 'Established', value: countyData.established },
      { label: 'Area (sq mi)', value: countyData.area },
      { label: 'Website', value: countyData.website, isLink: true },
      { label: 'Points of Interest', value: countyData.poi }
    ].filter(item => item.value);

    if (metaItems.length === 0) {
      metaEl.innerHTML = '<p class="empty-state">No custom county details yet. Add them in the admin panel.</p>';
    } else {
      metaEl.innerHTML = metaItems.map(item => {
        if (item.isLink) {
          return `
            <div class="county-meta-item">
              <span>${item.label}</span>
              <a href="${item.value}" target="_blank">${item.value}</a>
            </div>
          `;
        }

        return `
          <div class="county-meta-item">
            <span>${item.label}</span>
            <strong>${item.value}</strong>
          </div>
        `;
      }).join('');
    }

    const cities = COUNTY_CITIES[fipsCode] || [];
    if (cities.length === 0) {
      citiesEl.innerHTML = '<p class="empty-state">No cities listed yet.</p>';
    } else {
      citiesEl.innerHTML = cities.map(city => `
        <button class="city-chip" onclick="window.mtApp.openCityPage('${city}', '${countyName}', '${fipsCode}')">
          ${city}
        </button>
      `).join('');
    }

    // Render events
    const eventsEl = document.getElementById('county-events-list');
    if (eventsEl) {
      const countyEvents = this.getCountyEvents(fipsCode);
      eventsEl.innerHTML = this.renderEventsSection(countyEvents);
    }
  }

  openCountyPage(fipsCode, countyName) {
    this.currentCounty = { fips: fipsCode, name: countyName };
    this.currentCity = null;
    this.renderCountyPage(fipsCode, countyName);
    this.showCountyPage();
    this.setBreadcrumb({ countyName });
    this.setHash(`/montana/${this.slugify(countyName)}`);
  }

  handleRouteFromHash() {
    if (this.isUpdatingHash) return;

    const rawHash = window.location.hash || '#/montana';
    const path = rawHash.replace('#', '').trim();
    const segments = path.split('/').filter(Boolean);

    if (segments.length === 0 || segments[0] !== 'montana') {
      this.showMapView();
      return;
    }

    if (segments.length === 1) {
      this.showMapView();
      return;
    }

    const countySlug = segments[1];
    const fips = this.countySlugToFips[countySlug];
    const countyName = fips ? COUNTY_NAME_MAP[fips] : null;

    if (!fips || !countyName) {
      this.showMapView();
      return;
    }

    if (segments.length === 2) {
      this.currentCounty = { fips, name: countyName };
      this.currentCity = null;
      this.renderCountyPage(fips, countyName);
      this.showCountyPage();
      this.setBreadcrumb({ countyName });
      return;
    }

    const citySlug = segments[2];
    const cityName = (COUNTY_CITIES[fips] || []).find(city => this.slugify(city) === citySlug);
    if (cityName) {
      this.currentCounty = { fips, name: countyName };
      this.currentCity = { name: cityName };
      this.renderCityPage(cityName, countyName, fips);
      this.showCityPage();
      this.setBreadcrumb({ countyName, cityName });
    } else {
      this.openCountyPage(fips, countyName);
    }
  }

  openAdminForCounty(fipsCode, countyName) {
    const adminSection = document.getElementById('admin-section');

    if (!adminSection || !fipsCode || !countyName) return;

    if (adminSection.style.display === 'none') {
      this.toggleAdminPanel();
    }

    if (ADMIN_CONFIG.isLoggedIn) {
      this.openCountyEditor(fipsCode, countyName);
    } else {
      this.pendingCountyEdit = { fips: fipsCode, name: countyName };
    }
  }

  // ===== City Admin Methods =====

  openAdminForCity(fipsCode, cityName) {
    const adminSection = document.getElementById('admin-section');
    if (!adminSection || !fipsCode || !cityName) return;

    if (adminSection.style.display === 'none') {
      this.toggleAdminPanel();
    }

    if (ADMIN_CONFIG.isLoggedIn) {
      // Switch to cities tab and open editor
      this.switchAdminTab('cities');
      const countySelect = document.getElementById('city-admin-county');
      if (countySelect) countySelect.value = fipsCode;
      this.loadCityList(fipsCode);
      setTimeout(() => {
        this.openCityEditor(fipsCode, cityName);
      }, 100);
    } else {
      this.pendingCountyEdit = { fips: fipsCode, name: cityName, isCity: true };
    }
  }

  loadCityList(fipsCode) {
    const cityList = document.getElementById('city-list');
    if (!cityList) return;

    if (!fipsCode) {
      cityList.innerHTML = '<p class="empty-state">Select a county to see its cities.</p>';
      this._currentCityListFips = null;
      this._currentCityListEntries = null;
      return;
    }

    this._currentCityListFips = fipsCode;
    const cities = COUNTY_CITIES[fipsCode] || [];
    const countyName = COUNTY_NAME_MAP[fipsCode] || 'Unknown County';

    this._currentCityListEntries = cities.map(city => {
      const slug = this.slugify(city);
      const key = `${fipsCode}_${slug}`;
      const data = CITY_DATA[key] || null;
      return { name: city, slug, key, data, fips: fipsCode, countyName };
    });

    this.renderCityList(this._currentCityListEntries);
  }

  renderCityList(entries) {
    const cityList = document.getElementById('city-list');
    if (!cityList) return;

    if (!entries || entries.length === 0) {
      cityList.innerHTML = '<p class="empty-state">No cities found for this county.</p>';
      return;
    }

    cityList.innerHTML = entries.map(city => {
      const hasData = city.data && Object.keys(city.data).length > 0;
      return `
        <div class="county-item" data-city="${city.slug}">
          <div class="county-item-info">
            <h4>${city.name}</h4>
            <p>${city.countyName}</p>
          </div>
          <div class="county-item-status">
            <span class="status-badge ${hasData ? 'has-data' : 'no-data'}">
              ${hasData ? '✓ Customized' : 'Default'}
            </span>
            <button class="edit-btn" onclick="app.openCityEditor('${city.fips}', '${city.name.replace(/'/g, "\\'")}')">
              Edit
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  filterCityList(term) {
    if (!this._currentCityListEntries) return;
    if (!term) {
      this.renderCityList(this._currentCityListEntries);
      return;
    }
    const lower = term.toLowerCase();
    const filtered = this._currentCityListEntries.filter(c =>
      c.name.toLowerCase().includes(lower)
    );
    this.renderCityList(filtered);
  }

  openCityEditor(fips, cityName) {
    this.currentEditingCity = { fips, name: cityName };
    const slug = this.slugify(cityName);
    const key = `${fips}_${slug}`;
    const cityData = CITY_DATA[key] || {};

    document.getElementById('modal-city-name').textContent = `Edit ${cityName}`;
    document.getElementById('edit-city-fips').value = fips;
    document.getElementById('edit-city-slug').value = slug;
    document.getElementById('edit-city-display-name').value = cityName;
    document.getElementById('edit-city-description').value = cityData.description || '';
    document.getElementById('edit-city-population').value = cityData.population || '';
    document.getElementById('edit-city-elevation').value = cityData.elevation || '';
    document.getElementById('edit-city-website').value = cityData.website || '';
    document.getElementById('edit-city-activities').value = cityData.activities || '';
    document.getElementById('edit-city-highlights').value = cityData.highlights || '';

    document.getElementById('city-edit-modal').style.display = 'flex';
  }

  closeCityEditModal() {
    document.getElementById('city-edit-modal').style.display = 'none';
    this.currentEditingCity = null;
  }

  async handleCityUpdate(e) {
    e.preventDefault();

    const fips = document.getElementById('edit-city-fips').value;
    const slug = document.getElementById('edit-city-slug').value;
    const cityData = {
      description: document.getElementById('edit-city-description').value,
      population: document.getElementById('edit-city-population').value,
      elevation: document.getElementById('edit-city-elevation').value,
      website: document.getElementById('edit-city-website').value,
      activities: document.getElementById('edit-city-activities').value,
      highlights: document.getElementById('edit-city-highlights').value
    };

    const key = `${fips}_${slug}`;

    // Save via data service
    if (this.ds) {
      await this.ds.saveCityData(fips, slug, cityData);
    }
    // Update in-memory
    CITY_DATA[key] = cityData;

    // Refresh city list
    if (this._currentCityListFips) {
      this.loadCityList(this._currentCityListFips);
    }

    // Close modal
    this.closeCityEditModal();

    // Refresh city page if we're viewing this city
    if (this.currentCity && this.currentCounty && this.currentCounty.fips === fips) {
      const currentSlug = this.slugify(this.currentCity.name);
      if (currentSlug === slug) {
        this.renderCityPage(this.currentCity.name, this.currentCounty.name, fips);
      }
    }

    alert('✅ City information updated successfully!');
  }

  checkBusinessExpiration() {
    const now = new Date();
    BUSINESSES.forEach(business => {
      if (new Date(business.expires) < now) {
        business.active = false;
      }
    });
    localStorage.setItem('mtBusinesses', JSON.stringify(BUSINESSES));
  }

  // ===== Layer Controller Methods =====
  
  initializeLayerData() {
    return {
      watersheds: {
        name: 'Watersheds',
        features: [
          { name: 'Missouri River Basin', lat: 47.5, lng: -111.0, type: 'polygon' },
          { name: 'Yellowstone River Basin', lat: 46.0, lng: -108.5, type: 'polygon' },
          { name: 'Columbia River Basin', lat: 47.8, lng: -114.5, type: 'polygon' }
        ],
        color: '#4A90E2',
        fact: 'Montana is the only state that drains to three different oceans: the Pacific, Atlantic, and Hudson Bay!'
      },
      grizzly: {
        name: 'Grizzly Bear Ranges',
        features: [
          { name: 'Northern Continental Divide Ecosystem', lat: 48.5, lng: -113.5, radius: 50000 },
          { name: 'Greater Yellowstone Ecosystem', lat: 45.0, lng: -110.5, radius: 40000 }
        ],
        color: '#8B4513',
        fact: 'Montana\'s grizzly population is around 1,900 bears, making it one of the best habitats in the lower 48 states!'
      },
      peaks: {
        name: 'Major Mountain Peaks',
        features: [
          { name: 'Granite Peak (12,807 ft)', lat: 45.1634, lng: -109.8075 },
          { name: 'Mount Wood (12,649 ft)', lat: 45.1689, lng: -109.8442 },
          { name: 'Castle Mountain (12,612 ft)', lat: 45.1456, lng: -109.8206 },
          { name: 'Whitetail Peak (12,551 ft)', lat: 45.1292, lng: -109.8561 },
          { name: 'Mount Peal (12,395 ft)', lat: 45.1178, lng: -109.8978 }
        ],
        color: '#696969',
        fact: 'Granite Peak is Montana\'s highest point at 12,807 feet and requires technical climbing skills to summit!'
      },
      'lewis-clark': {
        name: 'Lewis & Clark Trail',
        features: [
          { name: 'Great Falls Portage', lat: 47.5053, lng: -111.2977 },
          { name: 'Three Forks', lat: 45.8924, lng: -111.5502 },
          { name: 'Lemhi Pass', lat: 44.6869, lng: -113.4097 },
          { name: 'Travelers\' Rest', lat: 46.8126, lng: -114.0899 },
          { name: 'Camp Disappointment', lat: 48.8333, lng: -112.5833 }
        ],
        color: '#D2691E',
        fact: 'Lewis and Clark spent more time in Montana than any other state - from April 1805 to August 1806!'
      },
      'native-lands': {
        name: 'Native American Ancestral Lands',
        features: [
          { name: 'Blackfeet Nation', lat: 48.5, lng: -113.0, radius: 50000 },
          { name: 'Crow Nation', lat: 45.5, lng: -107.5, radius: 40000 },
          { name: 'Salish & Kootenai', lat: 47.5, lng: -114.0, radius: 35000 },
          { name: 'Northern Cheyenne', lat: 45.6, lng: -106.5, radius: 30000 },
          { name: 'Assiniboine & Sioux', lat: 48.2, lng: -105.5, radius: 35000 }
        ],
        color: '#CD853F',
        fact: 'Montana is home to seven Indian reservations, representing 12 distinct tribal nations with rich cultural heritage!'
      },
      'ghost-towns': {
        name: 'Historic Ghost Towns',
        features: [
          { name: 'Bannack', lat: 45.1617, lng: -112.9994 },
          { name: 'Virginia City', lat: 45.2938, lng: -111.9428 },
          { name: 'Garnet', lat: 46.8833, lng: -113.3667 },
          { name: 'Coolidge', lat: 45.8833, lng: -109.7167 },
          { name: 'Granite', lat: 46.5667, lng: -113.3833 }
        ],
        color: '#A9A9A9',
        fact: 'Bannack was Montana\'s first territorial capital in 1864, now a well-preserved ghost town with over 50 structures!'
      },
      mines: {
        name: 'Active Mines',
        features: [
          { name: 'Stillwater Mine (Platinum)', lat: 45.4833, lng: -109.8833 },
          { name: 'Montana Tunnels (Gold)', lat: 46.2833, lng: -111.8500 },
          { name: 'Golden Sunlight (Gold)', lat: 45.8167, lng: -112.0667 }
        ],
        color: '#FFD700',
        fact: 'The Stillwater Mine produces platinum and palladium - Montana is one of only two places in the US where platinum is mined!'
      },
      agriculture: {
        name: 'Agriculture Zones',
        features: [
          { name: 'Golden Triangle (Wheat)', lat: 48.0, lng: -110.5, radius: 60000 },
          { name: 'Gallatin Valley (Diversified)', lat: 45.7, lng: -111.0, radius: 30000 },
          { name: 'Yellowstone Valley (Sugar Beets)', lat: 46.3, lng: -108.0, radius: 45000 }
        ],
        color: '#90EE90',
        fact: 'Montana\'s "Golden Triangle" produces over 40% of the state\'s wheat - one of the most productive wheat regions in the world!'
      },
      'wind-farms': {
        name: 'Wind Energy Farms',
        features: [
          { name: 'Rim Rock Wind Farm', lat: 47.7667, lng: -111.5833 },
          { name: 'Glacier Wind Farm', lat: 48.2833, lng: -111.4167 },
          { name: 'Spion Kop Wind Farm', lat: 47.8333, lng: -111.5000 }
        ],
        color: '#87CEEB',
        fact: 'Montana has one of the best wind energy potentials in the US, with capacity to power millions of homes!'
      },
      'nature-hotspots': {
        name: 'Nature Hot Spots',
        features: [
          { name: 'Glacier National Park', lat: 48.5, lng: -113.8, radius: 50000 },
          { name: 'Yellowstone National Park', lat: 45.0, lng: -110.5, radius: 60000 },
          { name: 'Beartooth Scenic Highway', lat: 45.4, lng: -109.8 },
          { name: 'Mission Mountains', lat: 47.7, lng: -113.8, radius: 30000 },
          { name: 'Bob Marshall Wilderness', lat: 47.9, lng: -112.5, radius: 45000 }
        ],
        color: '#228B22',
        fact: 'Montana\'s nature hot spots attract millions of visitors annually to experience pristine wilderness and incredible biodiversity!'
      },
      'national-forests': {
        name: 'National Forests',
        features: [
          { name: 'Flathead National Forest', lat: 48.0, lng: -113.5, radius: 70000 },
          { name: 'Kootenai National Forest', lat: 48.5, lng: -115.5, radius: 50000 },
          { name: 'Gallatin National Forest', lat: 45.3, lng: -110.5, radius: 60000 },
          { name: 'Bitterroot National Forest', lat: 46.0, lng: -113.8, radius: 55000 },
          { name: 'Custer National Forest', lat: 45.4, lng: -109.0, radius: 35000 }
        ],
        color: '#2D5016',
        fact: 'Montana contains nearly 19 million acres of National Forest land - perfect for hiking, camping, and outdoor recreation!'
      },
      'wildlife-viewing': {
        name: 'Wildlife Viewing Areas',
        features: [
          { name: 'National Bison Range', lat: 47.8, lng: -114.1 },
          { name: 'Rocky Mountain Elk Foundation', lat: 47.9, lng: -113.9 },
          { name: 'Lee Metcalf Refuge', lat: 46.8, lng: -113.6 },
          { name: 'Medicine Lake National Wildlife Refuge', lat: 48.5, lng: -104.5 },
          { name: 'Charles M. Russell NWR', lat: 48.5, lng: -107.5, radius: 80000 }
        ],
        color: '#FF6B35',
        fact: 'Montana is one of the best destinations in North America for wildlife viewing - home to bears, elk, buffalo, and eagles!'
      },
      'scenic-byways': {
        name: 'Scenic Byways & Drives',
        features: [
          { name: 'Going-to-the-Sun Road', lat: 48.4, lng: -113.8 },
          { name: 'Beartooth Highway', lat: 45.4, lng: -109.8 },
          { name: 'Kings Hill Scenic Byway', lat: 46.8, lng: -110.9 },
          { name: 'Elkhorn Scenic Loop', lat: 46.6, lng: -112.7 },
          { name: 'Paradise Valley Loop', lat: 46.7, lng: -111.3 }
        ],
        color: '#FF8C42',
        fact: 'Montana\'s scenic byways offer some of the most stunning drives in America, with mountain vistas and pristine wilderness!'
      },
      'geothermal': {
        name: 'Geothermal Features',
        features: [
          { name: 'Mammoth Hot Springs', lat: 44.9741, lng: -110.8442 },
          { name: 'Norris Geyser Basin', lat: 44.7320, lng: -110.7086 },
          { name: 'White Mountain Hot Springs', lat: 45.8, lng: -110.4 },
          { name: 'Broadwater Hot Springs', lat: 46.6, lng: -111.9 },
          { name: 'Ennis Hot Springs', lat: 45.3, lng: -111.7 }
        ],
        color: '#FF4500',
        fact: 'Montana lies along the northern edge of the world\'s largest geothermal zone - Yellowstone Super Volcano!'
      },
      'wilderness-areas': {
        name: 'Protected Wilderness Areas',
        features: [
          { name: 'Abel Tasman Wilderness', lat: 45.7, lng: -112.0, radius: 35000 },
          { name: 'Anaconda-Pintlar Wilderness', lat: 45.9, lng: -112.8, radius: 40000 },
          { name: 'Beartooth Absaroka Wilderness', lat: 45.2, lng: -109.5, radius: 50000 },
          { name: 'Cabinet Mountains Wilderness', lat: 47.8, lng: -114.0, radius: 30000 },
          { name: 'Gates of the Mountains Wilderness', lat: 46.9, lng: -111.4, radius: 25000 }
        ],
        color: '#1B4D3E',
        fact: 'Montana protects over 3.5 million acres of designated Wilderness - pristine backcountry for solitude and adventure!'
      },
      'geological-wonders': {
        name: 'Geological Wonders',
        features: [
          { name: 'Giant Springs', lat: 47.5, lng: -111.3 },
          { name: 'The Pinnacles', lat: 48.3, lng: -115.1 },
          { name: 'Makoshika State Park', lat: 48.3, lng: -105.0 },
          { name: 'Missouri River Breaks', lat: 47.8, lng: -109.5, radius: 50000 },
          { name: 'Medicine Rocks State Park', lat: 48.5, lng: -105.3 }
        ],
        color: '#8B7355',
        fact: 'Montana\'s geological features reveal 2 billion years of Earth\'s history - from ancient granite to colorful badlands!'
      }
    };
  }

  initializeLayerController() {
    // Layer toggle button
    const layerToggleBtn = document.getElementById('layer-toggle-btn');
    const layerController = document.querySelector('.layer-controller');
    
    if (layerToggleBtn && layerController) {
      layerToggleBtn.addEventListener('click', () => {
        layerController.classList.toggle('collapsed');
      });
    }
    
    // Layer checkboxes
    const layerCheckboxes = document.querySelectorAll('.layer-checkbox');
    layerCheckboxes.forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const layerName = e.target.dataset.layer;
        if (e.target.checked) {
          this.addLayer(layerName);
        } else {
          this.removeLayer(layerName);
        }
      });
    });
  }

  addLayer(layerName) {
    const layerInfo = this.layerData[layerName];
    if (!layerInfo || this.layers[layerName]) return;
    
    const layerGroup = L.layerGroup();
    
    layerInfo.features.forEach(feature => {
      if (feature.radius) {
        // Create circle for area features
        const circle = L.circle([feature.lat, feature.lng], {
          color: layerInfo.color,
          fillColor: layerInfo.color,
          fillOpacity: 0.2,
          radius: feature.radius,
          weight: 2
        }).bindPopup(`<strong>${feature.name}</strong><br>${layerInfo.name}`);
        
        circle.addTo(layerGroup);
      } else {
        // Create marker for point features
        const marker = L.circleMarker([feature.lat, feature.lng], {
          color: layerInfo.color,
          fillColor: layerInfo.color,
          fillOpacity: 0.7,
          radius: 8,
          weight: 2
        }).bindPopup(`<strong>${feature.name}</strong><br>${layerInfo.name}`);
        
        marker.addTo(layerGroup);
      }
    });
    
    layerGroup.addTo(this.map);
    this.layers[layerName] = layerGroup;
    
    // Update HUD with layer fact
    this.updateHUD(layerInfo.fact, layerInfo.name);
  }

  removeLayer(layerName) {
    if (this.layers[layerName]) {
      this.map.removeLayer(this.layers[layerName]);
      delete this.layers[layerName];
    }
  }

  // ===== HUD Methods =====
  
  initializeHUD() {
    const hudClose = document.getElementById('hud-close');
    const hudPanel = document.getElementById('hud-panel');
    
    if (hudClose && hudPanel) {
      hudClose.addEventListener('click', () => {
        hudPanel.classList.add('hidden');
      });
    }
    
    // Update HUD based on map movement
    this.map.on('moveend', () => {
      this.updateHUDBasedOnLocation();
    });
  }

  updateHUD(fact, location = 'Montana') {
    const hudContent = document.getElementById('hud-content');
    const hudLocation = document.getElementById('hud-location');
    const hudPanel = document.getElementById('hud-panel');
    
    if (hudContent && hudLocation && hudPanel) {
      hudContent.innerHTML = `<p>${fact}</p>`;
      hudLocation.textContent = location;
      hudPanel.classList.remove('hidden');
    }
  }

  updateHUDBasedOnLocation() {
    const center = this.map.getCenter();
    const facts = this.getRegionalFacts(center.lat, center.lng);
    
    if (facts.length > 0) {
      const randomFact = facts[Math.floor(Math.random() * facts.length)];
      this.updateHUD(randomFact.fact, randomFact.region);
    }
  }

  getRegionalFacts(lat, lng) {
    const facts = [];
    
    // Western Montana
    if (lng < -112) {
      facts.push({
        region: 'Western Montana',
        fact: 'This region is home to Glacier National Park, featuring over 700 miles of trails and stunning mountain scenery!'
      });
      facts.push({
        region: 'Western Montana',
        fact: 'The Bitterroot Valley was the site of the first permanent settlement by non-indigenous people in Montana in 1841.'
      });
    }
    
    // Central Montana
    if (lng >= -112 && lng < -108) {
      facts.push({
        region: 'Central Montana',
        fact: 'The Continental Divide runs through this region - water on one side flows to the Pacific, the other to the Atlantic!'
      });
      facts.push({
        region: 'Central Montana',
        fact: 'Great Falls has the most powerful freshwater waterfalls in the United States!'
      });
    }
    
    // Eastern Montana
    if (lng >= -108) {
      facts.push({
        region: 'Eastern Montana',
        fact: 'The Yellowstone River is the longest free-flowing river in the lower 48 states at 692 miles!'
      });
      facts.push({
        region: 'Eastern Montana',
        fact: 'Montana produces over 28% of U.S. coal, with most mines located in the southeastern region!'
      });
    }
    
    // Northern Montana
    if (lat > 47.5) {
      facts.push({
        region: 'Northern Montana',
        fact: 'The northern border with Canada spans 545 miles, the longest international border for any U.S. state!'
      });
    }
    
    // Southern Montana
    if (lat <= 45.5) {
      facts.push({
        region: 'Southern Montana',
        fact: 'Yellowstone National Park (mostly in Wyoming) extends into Montana\'s southern border!'
      });
    }
    
    // General Montana facts
    facts.push({
      region: 'Montana',
      fact: 'Montana has the largest migrating elk herd in the nation, with over 150,000 elk!'
    });
    facts.push({
      region: 'Montana',
      fact: 'The state fossil is the duck-billed dinosaur - over 14 species of dinosaurs have been discovered here!'
    });
    
    return facts;
  }

  toggleHUDPanel() {
    const hudPanel = document.getElementById('hud-panel');
    if (hudPanel) {
      hudPanel.classList.toggle('hidden');
    }
  }

  // ============================================
  // NOTIFICATION SYSTEM
  // ============================================

  showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.classList.add('show');
    }, 10);

    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  // ============================================
  // USER MANAGEMENT
  // ============================================

  async loadUserList() {
    const userList = document.getElementById('user-list');
    const usersHeader = document.getElementById('users-header');
    const userHelpText = document.getElementById('user-help-text');

    if (!this.ds) return;

    // Show/hide add user button based on Firebase availability
    if (this.ds.isFirebase()) {
      if (usersHeader) usersHeader.style.display = 'flex';
      if (userHelpText) userHelpText.textContent = 'Add and manage admin users who can edit county and event information.';
    } else {
      if (usersHeader) usersHeader.style.display = 'none';
      if (userHelpText) userHelpText.textContent = 'Multi-user authentication requires Firebase. Configure Firebase in firebase-config.js to enable this feature.';
    }

    const users = await this.ds.getUserList();
    this.renderUserList(users);
  }

  renderUserList(users) {
    const userList = document.getElementById('user-list');
    if (!userList) return;

    if (users.length === 0) {
      userList.innerHTML = '<p class="empty-state">No users found.</p>';
      return;
    }

    userList.innerHTML = users.map(user => `
      <div class="user-item">
        <div class="user-item-info">
          <h4>${user.displayName || user.email}<span class="user-role-badge">${user.role || 'admin'}</span></h4>
          <p>${user.email}</p>
          ${user.createdAt ? `<p style="font-size: 0.8rem;">Created: ${new Date(user.createdAt).toLocaleDateString()}</p>` : ''}
        </div>
        <div class="user-actions">
          ${user.uid !== 'local' && this.ds.isFirebase() ? `<button class="nav-btn danger" onclick="mtApp.handleDeleteUser('${user.uid}')">Delete</button>` : ''}
        </div>
      </div>
    `).join('');
  }

  openAddUserModal() {
    const modal = document.getElementById('add-user-modal');
    if (modal) {
      modal.style.display = 'flex';
      // Clear form
      document.getElementById('new-user-email').value = '';
      document.getElementById('new-user-name').value = '';
      document.getElementById('new-user-password').value = '';
      document.getElementById('new-user-role').value = 'admin';
    }
  }

  closeAddUserModal() {
    const modal = document.getElementById('add-user-modal');
    if (modal) modal.style.display = 'none';
  }

  async handleAddUser(e) {
    e.preventDefault();
    const email = document.getElementById('new-user-email').value;
    const displayName = document.getElementById('new-user-name').value;
    const password = document.getElementById('new-user-password').value;
    const role = document.getElementById('new-user-role').value;

    if (!email || !password) {
      this.showNotification('Please fill in all required fields.', 'error');
      return;
    }

    if (password.length < 6) {
      this.showNotification('Password must be at least 6 characters.', 'error');
      return;
    }

    const result = await this.ds.createUser(email, password, displayName, role);

    if (result.success) {
      this.showNotification(result.message || 'User added successfully!', 'success');
      this.closeAddUserModal();
      this.loadUserList();
    } else {
      this.showNotification(result.error, 'error');
    }
  }

  async handleDeleteUser(userId) {
    const confirmed = confirm(
      'Are you sure you want to remove this admin user?\n\n' +
      'They will lose access to the admin panel immediately.'
    );

    if (!confirmed) return;

    const result = await this.ds.deleteUser(userId);

    if (result.success) {
      this.showNotification('User removed successfully.', 'success');
      this.loadUserList();
    } else {
      this.showNotification(result.error, 'error');
    }
  }

  // ============================================
  // EVENTS ADMIN
  // ============================================

  async loadEventList(filters = {}) {
    const eventList = document.getElementById('event-list');
    if (!eventList) return;

    const events = await this.ds.getAllEvents();

    // Apply filters
    let filtered = events;
    if (filters.countyFips) {
      filtered = filtered.filter(e => e.countyFips === filters.countyFips);
    }
    if (filters.type) {
      filtered = filtered.filter(e => e.type === filters.type);
    }
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(e =>
        e.name.toLowerCase().includes(searchLower) ||
        (e.description && e.description.toLowerCase().includes(searchLower))
      );
    }

    this.renderEventList(filtered);
  }

  renderEventList(events) {
    const eventList = document.getElementById('event-list');
    if (!eventList) return;

    if (events.length === 0) {
      eventList.innerHTML = '<p class="empty-state">No events found.</p>';
      return;
    }

    const typeIcons = {
      community: '🎉',
      business: '🏪',
      historical: '📜',
      outdoor: '🏔️'
    };

    const typeNames = {
      community: 'Community',
      business: 'Business',
      historical: 'Historical',
      outdoor: 'Outdoor'
    };

    eventList.innerHTML = events.map(event => {
      const countyName = COUNTY_NAME_MAP[event.countyFips] || event.countyFips;
      const dateStr = event.startDate ? new Date(event.startDate).toLocaleDateString() : 'No date';

      return `
        <div class="event-item" onclick="mtApp.openEventEditor('${event.id}')">
          <div class="event-item-info">
            <h4>
              ${event.featured ? '⭐ ' : ''}${event.name}
              <span class="event-type-badge">${typeIcons[event.type] || ''} ${typeNames[event.type] || event.type}</span>
            </h4>
            <p>${countyName}${event.citySlug ? ` - ${event.citySlug}` : ''} • ${dateStr}</p>
            <p>${event.description ? event.description.substring(0, 100) + (event.description.length > 100 ? '...' : '') : ''}</p>
          </div>
        </div>
      `;
    }).join('');
  }

  async filterEventList() {
    const countyFilter = document.getElementById('event-filter-county')?.value || '';
    const typeFilter = document.getElementById('event-filter-type')?.value || '';
    const searchInput = document.getElementById('event-search')?.value || '';

    await this.loadEventList({
      countyFips: countyFilter,
      type: typeFilter,
      search: searchInput
    });
  }

  async openEventEditor(eventId = null) {
    const modal = document.getElementById('event-edit-modal');
    const title = document.getElementById('event-modal-title');
    const deleteBtn = document.getElementById('event-delete-btn');

    if (!modal) return;

    // Populate county dropdown
    this.populateEventCountyDropdown();

    if (eventId) {
      // Edit existing event
      const events = await this.ds.getAllEvents();
      const event = events.find(e => e.id === eventId);

      if (!event) {
        this.showNotification('Event not found.', 'error');
        return;
      }

      title.textContent = 'Edit Event';
      deleteBtn.style.display = 'block';

      document.getElementById('edit-event-id').value = event.id;
      document.getElementById('edit-event-name').value = event.name || '';
      document.getElementById('edit-event-type').value = event.type || 'community';
      document.getElementById('edit-event-featured').checked = event.featured || false;
      document.getElementById('edit-event-description').value = event.description || '';
      document.getElementById('edit-event-county').value = event.countyFips || '';

      // Update city dropdown based on county
      await this.updateEventCityDropdown(event.countyFips);
      document.getElementById('edit-event-city').value = event.citySlug || '';

      document.getElementById('edit-event-start').value = event.startDate || '';
      document.getElementById('edit-event-end').value = event.endDate || '';
      document.getElementById('edit-event-recurring').value = event.recurrencePattern || '';
      document.getElementById('edit-event-price').value = event.price || '';
      document.getElementById('edit-event-address').value = event.address || '';
      document.getElementById('edit-event-website').value = event.website || '';
      document.getElementById('edit-event-email').value = event.contactEmail || '';
      document.getElementById('edit-event-phone').value = event.contactPhone || '';
    } else {
      // New event
      title.textContent = 'Add Event';
      deleteBtn.style.display = 'none';

      document.getElementById('edit-event-id').value = '';
      document.getElementById('edit-event-name').value = '';
      document.getElementById('edit-event-type').value = 'community';
      document.getElementById('edit-event-featured').checked = false;
      document.getElementById('edit-event-description').value = '';
      document.getElementById('edit-event-county').value = '';
      document.getElementById('edit-event-city').innerHTML = '<option value="">County-wide</option>';
      document.getElementById('edit-event-start').value = '';
      document.getElementById('edit-event-end').value = '';
      document.getElementById('edit-event-recurring').value = '';
      document.getElementById('edit-event-price').value = '';
      document.getElementById('edit-event-address').value = '';
      document.getElementById('edit-event-website').value = '';
      document.getElementById('edit-event-email').value = '';
      document.getElementById('edit-event-phone').value = '';
    }

    modal.style.display = 'flex';
  }

  closeEventEditModal() {
    const modal = document.getElementById('event-edit-modal');
    if (modal) modal.style.display = 'none';
  }

  async handleEventSubmit(e) {
    e.preventDefault();
    const button = e.target.querySelector('button[type="submit"]');
    const originalText = button.textContent;
    button.textContent = 'Saving...';
    button.disabled = true;

    try {
      const eventId = document.getElementById('edit-event-id').value;
      const currentUser = this.ds.getCurrentUser();

      const eventData = {
        name: document.getElementById('edit-event-name').value,
        type: document.getElementById('edit-event-type').value,
        featured: document.getElementById('edit-event-featured').checked,
        description: document.getElementById('edit-event-description').value,
        countyFips: document.getElementById('edit-event-county').value,
        citySlug: document.getElementById('edit-event-city').value || null,
        startDate: document.getElementById('edit-event-start').value || null,
        endDate: document.getElementById('edit-event-end').value || null,
        recurrencePattern: document.getElementById('edit-event-recurring').value || null,
        price: document.getElementById('edit-event-price').value || null,
        address: document.getElementById('edit-event-address').value || null,
        website: document.getElementById('edit-event-website').value || null,
        contactEmail: document.getElementById('edit-event-email').value || null,
        contactPhone: document.getElementById('edit-event-phone').value || null,
        isActive: true,
        createdBy: currentUser ? currentUser.uid : 'system'
      };

      if (eventId) {
        eventData.id = eventId;
      }

      await this.ds.saveEvent(eventData);

      // Update global EVENTS_DATA
      const allEvents = await this.ds.getAllEvents();
      EVENTS_DATA.length = 0;
      EVENTS_DATA.push(...allEvents);

      this.showNotification('Event saved successfully!', 'success');
      this.closeEventEditModal();
      this.filterEventList();
    } catch (error) {
      console.error('Error saving event:', error);
      this.showNotification('Failed to save event. Please try again.', 'error');
    } finally {
      button.textContent = originalText;
      button.disabled = false;
    }
  }

  async handleEventDelete() {
    const eventId = document.getElementById('edit-event-id').value;
    if (!eventId) return;

    const eventName = document.getElementById('edit-event-name').value;
    const confirmed = confirm(
      `Are you sure you want to delete "${eventName}"?\n\n` +
      'This action cannot be undone.'
    );

    if (!confirmed) return;

    try {
      await this.ds.deleteEvent(eventId);

      // Update global EVENTS_DATA
      const allEvents = await this.ds.getAllEvents();
      EVENTS_DATA.length = 0;
      EVENTS_DATA.push(...allEvents);

      this.showNotification('Event deleted successfully.', 'success');
      this.closeEventEditModal();
      this.filterEventList();
    } catch (error) {
      console.error('Error deleting event:', error);
      this.showNotification('Failed to delete event.', 'error');
    }
  }

  async updateEventCityDropdown(fipsCode) {
    const citySelect = document.getElementById('edit-event-city');
    if (!citySelect) return;

    citySelect.innerHTML = '<option value="">County-wide</option>';

    if (!fipsCode || !COUNTY_CITIES[fipsCode]) return;

    const cities = COUNTY_CITIES[fipsCode];
    cities.forEach(cityName => {
      const option = document.createElement('option');
      option.value = this.slugify(cityName);
      option.textContent = cityName;
      citySelect.appendChild(option);
    });
  }

  populateEventCountyDropdown() {
    const countySelect = document.getElementById('edit-event-county');
    const filterCountySelect = document.getElementById('event-filter-county');

    if (countySelect) {
      countySelect.innerHTML = '<option value="">Select County...</option>';
      Object.entries(COUNTY_NAME_MAP)
        .sort((a, b) => a[1].localeCompare(b[1]))
        .forEach(([fips, name]) => {
          const option = document.createElement('option');
          option.value = fips;
          option.textContent = name;
          countySelect.appendChild(option);
        });
    }

    if (filterCountySelect && filterCountySelect.children.length <= 1) {
      filterCountySelect.innerHTML = '<option value="">All Counties</option>';
      Object.entries(COUNTY_NAME_MAP)
        .sort((a, b) => a[1].localeCompare(b[1]))
        .forEach(([fips, name]) => {
          const option = document.createElement('option');
          option.value = fips;
          option.textContent = name;
          filterCountySelect.appendChild(option);
        });
    }
  }

  // ============================================
  // EVENTS DISPLAY (County/City Pages)
  // ============================================

  getCountyEvents(fipsCode) {
    const now = new Date();
    return EVENTS_DATA
      .filter(evt => evt.countyFips === fipsCode && evt.isActive)
      .filter(evt => !evt.startDate || new Date(evt.startDate) >= now || evt.recurrencePattern)
      .sort((a, b) => {
        if (!a.startDate) return 1;
        if (!b.startDate) return -1;
        return new Date(a.startDate) - new Date(b.startDate);
      });
  }

  getCityEvents(fipsCode, citySlug) {
    const now = new Date();
    return EVENTS_DATA
      .filter(evt =>
        evt.countyFips === fipsCode &&
        evt.isActive &&
        (!evt.citySlug || evt.citySlug === citySlug)
      )
      .filter(evt => !evt.startDate || new Date(evt.startDate) >= now || evt.recurrencePattern)
      .sort((a, b) => {
        if (!a.startDate) return 1;
        if (!b.startDate) return -1;
        return new Date(a.startDate) - new Date(b.startDate);
      });
  }

  renderEventsSection(events) {
    if (events.length === 0) {
      return '<p class="empty-state">No upcoming events.</p>';
    }

    const grouped = this.groupEventsByType(events);
    let html = '';

    const typeIcons = {
      community: '🎉',
      business: '🏪',
      historical: '📜',
      outdoor: '🏔️'
    };

    const typeNames = {
      community: 'Community Events',
      business: 'Business Events',
      historical: 'Historical Events & Facts',
      outdoor: 'Outdoor Activities'
    };

    for (const [type, typeEvents] of Object.entries(grouped)) {
      html += `<div class="event-type-section">
        <h4>${typeIcons[type]} ${typeNames[type]}</h4>
        ${typeEvents.map(evt => this.renderEventCard(evt)).join('')}
      </div>`;
    }

    return html;
  }

  renderEventCard(event) {
    const dateStr = event.startDate
      ? this.formatEventDate(event.startDate, event.endDate, event.recurrencePattern)
      : '';

    return `
      <div class="event-card">
        ${event.featured ? '<span class="event-badge">Featured</span>' : ''}
        <h5>${event.name}</h5>
        <p class="event-description">${event.description}</p>
        ${dateStr ? `<p class="event-date">📅 ${dateStr}</p>` : ''}
        ${event.price ? `<p class="event-price">💵 ${event.price}</p>` : ''}
        ${event.address ? `<p class="event-date">📍 ${event.address}</p>` : ''}
        ${event.website ? `<a href="${event.website}" target="_blank" class="event-link">Learn More →</a>` : ''}
      </div>
    `;
  }

  formatEventDate(start, end, recurrence) {
    if (!start) return '';

    const startDate = new Date(start);
    const endDate = end ? new Date(end) : null;

    if (recurrence === 'annual') {
      return `Annual - ${startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`;
    }

    if (recurrence === 'monthly') {
      return `Monthly - ${startDate.toLocaleDateString('en-US', { day: 'numeric' })}`;
    }

    if (recurrence === 'weekly') {
      return `Weekly - ${startDate.toLocaleDateString('en-US', { weekday: 'long' })}`;
    }

    if (endDate) {
      return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
    }

    return startDate.toLocaleDateString();
  }

  groupEventsByType(events) {
    return events.reduce((acc, evt) => {
      if (!acc[evt.type]) acc[evt.type] = [];
      acc[evt.type].push(evt);
      return acc;
    }, {});
  }

  // ============================================
  // AUTHENTICATION & USER MANAGEMENT
  // ============================================

  setupAuthListeners() {
    // Sign in / Register buttons
    document.getElementById('auth-signin-btn')?.addEventListener('click', () => this.showAuthModal('signin'));
    document.getElementById('auth-register-btn')?.addEventListener('click', () => this.showAuthModal('register'));
    document.getElementById('auth-close-btn')?.addEventListener('click', () => this.closeAuthModal());

    // Auth tab navigation
    document.querySelectorAll('.auth-tab').forEach(tab => {
      tab.addEventListener('click', (e) => this.switchAuthTab(e.target.dataset.authTab));
    });

    // Tab navigation links
    document.getElementById('auth-goto-register')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.switchAuthTab('register');
    });
    document.getElementById('auth-goto-signin')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.switchAuthTab('signin');
    });
    document.getElementById('auth-goto-signin2')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.switchAuthTab('signin');
    });
    document.getElementById('auth-goto-forgot')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.switchAuthTab('forgot');
    });

    // Forms
    document.getElementById('signin-form')?.addEventListener('submit', (e) => this.handleSignIn(e));
    document.getElementById('register-form')?.addEventListener('submit', (e) => this.handleRegister(e));
    document.getElementById('forgot-form')?.addEventListener('submit', (e) => this.handleForgotPassword(e));

    // Avatar picker
    document.querySelectorAll('#avatar-picker .avatar-option').forEach(opt => {
      opt.addEventListener('click', (e) => {
        document.querySelectorAll('#avatar-picker .avatar-option').forEach(o => o.classList.remove('selected'));
        e.target.classList.add('selected');
        document.getElementById('register-avatar').value = e.target.dataset.emoji;
      });
    });

    // Profile button
    document.getElementById('user-profile-btn')?.addEventListener('click', () => this.showProfileModal());
    document.getElementById('profile-close-btn')?.addEventListener('click', () => this.closeProfileModal());
    document.getElementById('user-signout-btn')?.addEventListener('click', () => this.handleSignOut());

    // Profile settings form
    document.getElementById('profile-settings-form')?.addEventListener('submit', (e) => this.handleProfileUpdate(e));

    // Profile avatar picker
    document.querySelectorAll('#profile-avatar-picker .avatar-option').forEach(opt => {
      opt.addEventListener('click', (e) => {
        document.querySelectorAll('#profile-avatar-picker .avatar-option').forEach(o => o.classList.remove('selected'));
        e.target.classList.add('selected');
        document.getElementById('profile-edit-avatar').value = e.target.dataset.emoji;
      });
    });

    // Awards page
    document.getElementById('awards-btn')?.addEventListener('click', () => this.showAwardsPage());
    document.getElementById('awards-page-close-btn')?.addEventListener('click', () => this.closeAwardsPage());

    // Auth state listener
    if (this.ds && this.ds.onAuthChange) {
      this.ds.onAuthChange((user) => {
        this.updateAuthUI(user);
      });
    }
  }

  showAuthModal(tab = 'signin') {
    const authSection = document.getElementById('auth-section');
    if (authSection) {
      authSection.style.display = 'block';
      this.switchAuthTab(tab);
    }
  }

  closeAuthModal() {
    const authSection = document.getElementById('auth-section');
    if (authSection) authSection.style.display = 'none';
  }

  switchAuthTab(tabName) {
    document.querySelectorAll('.auth-tab-content').forEach(tab => tab.style.display = 'none');
    document.querySelectorAll('.auth-tab').forEach(tab => tab.classList.remove('active'));
    
    const content = document.getElementById(`auth-tab-${tabName}`);
    const tab = document.querySelector(`.auth-tab[data-auth-tab="${tabName}"]`);
    if (content) content.style.display = 'block';
    if (tab) tab.classList.add('active');
  }

  async handleSignIn(e) {
    e.preventDefault();
    const email = document.getElementById('signin-email').value.trim();
    const password = document.getElementById('signin-password').value.trim();
    const errorEl = document.getElementById('signin-error');

    errorEl.style.display = 'none';

    if (!email || !password) {
      errorEl.textContent = 'Please fill in all fields';
      errorEl.style.display = 'block';
      return;
    }

    const result = await this.ds.login(email, password);
    if (result.success) {
      // Store current user
      localStorage.setItem('currentUser', JSON.stringify(result.user));
      this.closeAuthModal();
      this.showNotification('✅ Signed in successfully!', 'success');
      this.updateAuthUI(result.user);
      e.target.reset();
    } else {
      errorEl.textContent = result.error || 'Sign in failed';
      errorEl.style.display = 'block';
    }
  }

  async handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('register-name').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value.trim();
    const confirm = document.getElementById('register-confirm').value.trim();
    const avatar = document.getElementById('register-avatar').value;
    const errorEl = document.getElementById('register-error');

    errorEl.style.display = 'none';

    if (!name || !email || !password) {
      errorEl.textContent = 'Please fill in all required fields';
      errorEl.style.display = 'block';
      return;
    }

    if (password !== confirm) {
      errorEl.textContent = 'Passwords do not match';
      errorEl.style.display = 'block';
      return;
    }

    if (password.length < 6) {
      errorEl.textContent = 'Password must be at least 6 characters';
      errorEl.style.display = 'block';
      return;
    }

    const result = await this.ds.register(email, password, name);
    if (result.success) {
      // Store member profile
      localStorage.setItem('currentUser', JSON.stringify({ email, displayName: name, uid: result.user.uid || email }));
      
      // Create/update member profile entry
      const profiles = JSON.parse(localStorage.getItem('memberProfiles')) || {};
      profiles[name] = {
        name: name,
        email: email,
        totalPoints: 0,
        postCount: 0,
        helpfulCount: 0,
        awards: [],
        avatarEmoji: avatar,
        bio: '',
        joinedAt: new Date().toISOString(),
        role: 'member'
      };
      localStorage.setItem('memberProfiles', JSON.stringify(profiles));

      this.closeAuthModal();
      this.showNotification(`🎉 Welcome to Montana Explorer, ${name}!`, 'success');
      this.updateAuthUI(result.user);
      e.target.reset();
    } else {
      errorEl.textContent = result.error || 'Registration failed';
      errorEl.style.display = 'block';
    }
  }

  async handleForgotPassword(e) {
    e.preventDefault();
    const email = document.getElementById('forgot-email').value.trim();
    const errorEl = document.getElementById('forgot-error');
    const successEl = document.getElementById('forgot-success');

    errorEl.style.display = 'none';
    successEl.style.display = 'none';

    if (!email) {
      errorEl.textContent = 'Please enter your email address';
      errorEl.style.display = 'block';
      return;
    }

    const result = await this.ds.resetPassword(email);
    if (result.success) {
      successEl.textContent = result.message || '✅ Password reset email sent!';
      successEl.style.display = 'block';
      e.target.reset();
      setTimeout(() => {
        this.switchAuthTab('signin');
      }, 3000);
    } else {
      errorEl.textContent = result.error || 'Password reset failed';
      errorEl.style.display = 'block';
    }
  }

  async handleSignOut() {
    await this.ds.logout();
    localStorage.removeItem('currentUser');
    this.updateAuthUI(null);
    this.closeProfileModal();
    this.showNotification('✅ Signed out successfully', 'success');
  }

  updateAuthUI(user) {
    const authNav = document.getElementById('auth-nav');
    const userNav = document.getElementById('user-nav');

    if (user && (user.email || user.displayName)) {
      // Show user nav
      if (authNav) authNav.style.display = 'none';
      if (userNav) {
        userNav.style.display = 'flex';
        const displayName = user.displayName || user.email?.split('@')[0] || 'User';
        const members = JSON.parse(localStorage.getItem('memberProfiles')) || {};
        const member = Object.values(members).find(m => m.email === user.email || m.name === displayName);
        const avatar = member?.avatarEmoji || '👤';
        document.getElementById('user-display-name').textContent = displayName;
        document.getElementById('user-avatar-emoji').textContent = avatar;
      }
      this.currentUser = { email: user.email, displayName: user.displayName || displayName, uid: user.uid };
    } else {
      // Show auth nav
      if (authNav) authNav.style.display = 'flex';
      if (userNav) userNav.style.display = 'none';
      this.currentUser = null;
    }
  }

  showProfileModal() {
    const profileSection = document.getElementById('profile-section');
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const displayName = currentUser.displayName || currentUser.email?.split('@')[0] || 'Member';
    
    const members = JSON.parse(localStorage.getItem('memberProfiles')) || {};
    const member = members[displayName] || Object.values(members).find(m => m.email === currentUser.email);

    if (profileSection && member) {
      profileSection.style.display = 'block';
      
      // Load profile data
      document.getElementById('profile-avatar-display').textContent = member.avatarEmoji || '👤';
      document.getElementById('profile-display-name').textContent = member.name || displayName;
      document.getElementById('profile-total-points').textContent = member.totalPoints || 0;
      document.getElementById('profile-post-count').textContent = member.postCount || 0;
      document.getElementById('profile-award-count').textContent = (member.awards || []).length;

      // Update rank
      document.getElementById('profile-rank').textContent = this.getMemberRank(displayName);

      // Load form
      document.getElementById('profile-edit-name').value = member.name || '';
      document.getElementById('profile-edit-bio').value = member.bio || '';
      document.getElementById('profile-edit-avatar').value = member.avatarEmoji || '👤';
      document.getElementById('profile-show-leaderboard').checked = member.settings?.showOnLeaderboard ?? true;
      document.getElementById('profile-public-profile').checked = member.settings?.publicProfile ?? true;

      // Update avatar picker
      document.querySelectorAll('#profile-avatar-picker .avatar-option').forEach(opt => {
        opt.classList.toggle('selected', opt.dataset.emoji === (member.avatarEmoji || '👤'));
      });

      // Render awards
      this.renderMemberAwards(member);
    }
  }

  closeProfileModal() {
    const profileSection = document.getElementById('profile-section');
    if (profileSection) profileSection.style.display = 'none';
  }

  async handleProfileUpdate(e) {
    e.preventDefault();
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const displayName = currentUser.displayName || currentUser.email?.split('@')[0] || 'Member';
    const newName = document.getElementById('profile-edit-name').value.trim() || displayName;
    const bio = document.getElementById('profile-edit-bio').value.trim();
    const avatar = document.getElementById('profile-edit-avatar').value;
    const showLeaderboard = document.getElementById('profile-show-leaderboard').checked;
    const publicProfile = document.getElementById('profile-public-profile').checked;

    const members = JSON.parse(localStorage.getItem('memberProfiles')) || {};
    const oldKey = Object.keys(members).find(k => members[k].email === currentUser.email);

    if (oldKey && oldKey !== newName) {
      delete members[oldKey];
    }

    members[newName] = {
      ...members[newName],
      name: newName,
      bio: bio,
      avatarEmoji: avatar,
      settings: {
        showOnLeaderboard: showLeaderboard,
        publicProfile: publicProfile,
        emailNotifications: members[newName]?.settings?.emailNotifications ?? true
      }
    };

    localStorage.setItem('memberProfiles', JSON.stringify(members));

    // Update current user
    currentUser.displayName = newName;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));

    this.showNotification('✅ Profile updated successfully!', 'success');
    this.updateAuthUI(currentUser);
  }

  renderMemberAwards(member) {
    const awardsGrid = document.getElementById('profile-awards-grid');
    const awards = member.awards || [];

    if (awards.length === 0) {
      awardsGrid.innerHTML = '<p class="empty-state">No awards earned yet. Start contributing!</p>';
      return;
    }

    awardsGrid.innerHTML = awards.map(awardKey => {
      const award = AWARDS[awardKey];
      if (!award) return '';
      return `
        <div class="award-badge-large" title="${award.name}">
          <span class="award-badge-icon">${award.icon}</span>
          <div class="award-badge-info">
            <strong>${award.name}</strong>
            <p>${award.description}</p>
            <span class="award-badge-points">+${award.points} points</span>
          </div>
        </div>
      `;
    }).join('');
  }

  showAwardsPage() {
    const awardsSection = document.getElementById('awards-page-section');
    if (awardsSection) {
      awardsSection.style.display = 'block';
      this.renderTopLeaderboard();
      this.renderAwardsCatalog();
    }
  }

  closeAwardsPage() {
    const awardsSection = document.getElementById('awards-page-section');
    if (awardsSection) awardsSection.style.display = 'none';
  }

  async renderTopLeaderboard() {
    const members = JSON.parse(localStorage.getItem('memberProfiles')) || {};
    const topMembers = Object.entries(members)
      .map(([key, m]) => ({ key, ...m }))
      .filter(m => m.settings?.showOnLeaderboard !== false)
      .sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0))
      .slice(0, 20);

    // Top 3 Podium
    const podiumHtml = topMembers.slice(0, 3).map((member, idx) => {
      const medals = ['🥇', '🥈', '🥉'];
      return `
        <div class="podium-position podium-${idx + 1}">
          <div class="podium-medal">${medals[idx]}</div>
          <div class="podium-avatar">${member.avatarEmoji || '👤'}</div>
          <div class="podium-name">#${idx + 1} ${this.escapeHtml(member.name)}</div>
          <div class="podium-points">${member.totalPoints} points</div>
        </div>
      `;
    }).join('');

    const podium = document.getElementById('top3-podium');
    if (podium) podium.innerHTML = podiumHtml;

    // Full leaderboard (4-20)
    const leaderboardHtml = topMembers.slice(3, 20).map((member, idx) => `
      <div class="leaderboard-row">
        <span class="lb-rank">#${idx + 4}</span>
        <span class="lb-avatar">${member.avatarEmoji || '👤'}</span>
        <span class="lb-name">${this.escapeHtml(member.name)}</span>
        <span class="lb-awards">${(member.awards || []).length} 🎖️</span>
        <span class="lb-points">${member.totalPoints} pts</span>
      </div>
    `).join('');

    const leaderboard = document.getElementById('full-leaderboard');
    if (leaderboard) {
      leaderboard.innerHTML = leaderboardHtml || '<p class="empty-state">No members on leaderboard yet</p>';
    }
  }

  renderAwardsCatalog() {
    const catalogHtml = Object.entries(AWARDS).map(([key, award]) => `
      <div class="award-catalog-item">
        <div class="award-catalog-icon">${award.icon}</div>
        <div class="award-catalog-content">
          <h4>${award.name}</h4>
          <p>${award.description}</p>
          <div class="award-catalog-meta">
            <span class="award-catalog-points">+${award.points} pts</span>
            <span class="award-catalog-category">${award.category}</span>
          </div>
        </div>
      </div>
    `).join('');

    const catalog = document.getElementById('awards-catalog');
    if (catalog) catalog.innerHTML = catalogHtml;
  }

  // ============================================
  // ADMIN: COMMUNITY AWARDS MANAGEMENT
  // ============================================

  setupCommunityAwardsTab() {
    document.getElementById('grant-award-btn')?.addEventListener('click', () => this.grantCommunityAward());
    document.getElementById('award-member-select')?.addEventListener('change', (e) => this.onMemberSelected(e.target.value));
    document.getElementById('award-type-select')?.addEventListener('change', (e) => this.onAwardSelected(e.target.value));
    document.getElementById('admin-member-search')?.addEventListener('input', (e) => this.searchAdminMembers(e.target.value));

    // Load award types
    const awardSelect = document.getElementById('award-type-select');
    if (awardSelect) {
      Object.entries(AWARDS).forEach(([key, award]) => {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = `${award.icon} ${award.name} (+${award.points} pts)`;
        awardSelect.appendChild(option);
      });
    }

    // Load members
    this.loadAdminMembers();
  }

  loadAdminMembers() {
    const members = JSON.parse(localStorage.getItem('memberProfiles')) || {};
   const memberSelect = document.getElementById('award-member-select');
    
    if (memberSelect) {
      // Clear existing options (keep placeholder)
      memberSelect.innerHTML = '<option value="">Choose a member...</option>';
      
      Object.entries(members).forEach(([key, member]) => {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = `${member.avatarEmoji || '👤'} ${member.name || key} (${member.totalPoints || 0} pts)`;
        memberSelect.appendChild(option);
      });
    }

    this.renderAdminMemberList(members);
  }

  renderAdminMemberList(members, search = '') {
    const list = document.getElementById('admin-member-list');
    if (!list) return;

    const filtered = Object.entries(members)
      .filter(([k, m]) => !search || m.name?.toLowerCase().includes(search) || k.toLowerCase().includes(search))
      .sort((a, b) => (b[1].totalPoints || 0) - (a[1].totalPoints || 0));

    if (filtered.length === 0) {
      list.innerHTML = '<p class="empty-state">No members found</p>';
      return;
    }

    list.innerHTML = filtered.map(([key, member]) => `
      <div class="admin-member-card">
        <div class="admin-member-header">
          <span class="admin-member-avatar">${member.avatarEmoji || '👤'} ${this.escapeHtml(member.name || key)}</span>
          <span class="admin-member-points">${member.totalPoints || 0} pts</span>
        </div>
        <div class="admin-member-awards">
          ${(member.awards || []).slice(0, 5).map(awardKey => {
            const award = AWARDS[awardKey];
            return award ? `<span class="admin-member-award" title="${award.name}">${award.icon}</span>` : '';
          }).join('')}
          ${(member.awards || []).length > 5 ? `<span class="admin-member-more">+${(member.awards || []).length - 5}</span>` : ''}
        </div>
      </div>
    `).join('');
  }

  searchAdminMembers(term) {
    const members = JSON.parse(localStorage.getItem('memberProfiles')) || {};
    this.renderAdminMemberList(members, term);
  }

  onMemberSelected(memberKey) {
    const grantBtn = document.getElementById('grant-award-btn');
    if (grantBtn) grantBtn.disabled = !memberKey;
  }

  onAwardSelected(awardKey) {
    const preview = document.getElementById('award-preview');
    const award = AWARDS[awardKey];

    if (!award || !preview) return;

    document.getElementById('award-preview-icon').textContent = award.icon;
    document.getElementById('award-preview-name').textContent = award.name;
    document.getElementById('award-preview-desc').textContent = award.description;
    document.getElementById('award-preview-points').textContent = `+${award.points} points`;
    preview.style.display = 'block';
  }

  async grantCommunityAward() {
    const memberKey = document.getElementById('award-member-select').value;
    const awardKey = document.getElementById('award-type-select').value;

    if (!memberKey || !awardKey) {
      this.showNotification('❌ Please select a member and award', 'error');
      return;
    }

    const result = await this.ds.grantAward(memberKey, awardKey, 'admin');
    if (result.success) {
      this.showNotification(`🎉 Award granted to ${memberKey}!`, 'success');
      this.loadAdminMembers();
      document.getElementById('award-member-select').value = '';
      document.getElementById('award-type-select').value = '';
      document.getElementById('award-preview').style.display = 'none';
      document.getElementById('grant-award-btn').disabled = true;
    } else {
      this.showNotification(result.error || 'Failed to grant award', 'error');
    }
  }
}

// Initialize app when DOM is ready
let app; // Global reference for inline event handlers
document.addEventListener('DOMContentLoaded', () => {
  app = new MTApp();
  window.mtApp = app;
  app.init();
});
