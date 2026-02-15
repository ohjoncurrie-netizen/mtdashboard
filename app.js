// Add Google Maps global init
function initGoogleMaps() {
  window.googleMapsLoaded = true;
}

class MTApp {
  constructor() {
    this.map = null;
    this.countyLayer = null;
    this.geocoder = null;
    this.businessMarkers = [];
    this.allCounties = [];
    this.currentEditingCounty = null;
  }

  async init() {
    // Wait for Google Maps to load
    while (!window.googleMapsLoaded) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    this.geocoder = new google.maps.Geocoder();
    
    // Initialize the map
    this.initMap();
    
    // Load county boundaries
    await this.loadCountyBoundaries();
    
    // Setup event listeners
    this.setupEventListeners();
    
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
    
    // Apply vintage parchment filter via CSS after tiles load
    setTimeout(() => {
      const mapContainer = document.getElementById('map');
      if (mapContainer) {
        const tiles = mapContainer.querySelector('.leaflet-tile-pane');
        if (tiles) {
          tiles.style.filter = 'sepia(0.4) contrast(0.9) brightness(1.1) saturate(0.7)';
        }
      }
    }, 500);
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
      
      // County name mapping (FIPS code to county name)
      const countyNames = {
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
      
      // Create a GeoJSON layer with click functionality
      this.countyLayer = L.geoJSON(montanaCounties, {
        style: {
          fillColor: '#d4a574',
          weight: 2.5,
          opacity: 0.9,
          color: '#8B4513',
          dashArray: '5, 3',
          fillOpacity: 0.05
        },
        onEachFeature: (feature, layer) => {
          // Get county name from FIPS code
          const fipsCode = feature.id || feature.properties.FIPS || feature.properties.GEO_ID;
          const countyName = countyNames[fipsCode] || `County ${fipsCode}`;
          
          // Highlight on hover
          layer.on('mouseover', function() {
            this.setStyle({
              fillOpacity: 0.25,
              weight: 3.5,
              color: '#8B0000'
            });
          });
          
          layer.on('mouseout', function() {
            this.setStyle({
              fillOpacity: 0.05,
              weight: 2.5,
              color: '#8B4513'
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
    
    // City modal close
    const cityModalClose = document.getElementById('city-modal-close');
    const cityModalBack = document.getElementById('city-modal-back');
    if (cityModalClose) {
      cityModalClose.addEventListener('click', () => this.closeCityModal());
    }
    if (cityModalBack) {
      cityModalBack.addEventListener('click', () => this.closeCityModal());
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
    
    // County search
    const countySearch = document.getElementById('county-search');
    if (countySearch) {
      countySearch.addEventListener('input', (e) => this.filterCounties(e.target.value));
    }
    
    // County edit form
    const countyEditForm = document.getElementById('county-edit-form');
    if (countyEditForm) {
      countyEditForm.addEventListener('submit', (e) => this.handleCountyUpdate(e));
    }
    
    // Modal close buttons
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const modalCancelBtn = document.getElementById('modal-cancel-btn');
    if (modalCloseBtn) {
      modalCloseBtn.addEventListener('click', () => this.closeModal());
    }
    if (modalCancelBtn) {
      modalCancelBtn.addEventListener('click', () => this.closeModal());
    }
    
    // Admin settings form
    const adminSettingsForm = document.getElementById('admin-settings-form');
    if (adminSettingsForm) {
      adminSettingsForm.addEventListener('submit', (e) => this.handlePasswordChange(e));
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

  toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    
    if (sidebar && overlay) {
      const isOpen = sidebar.classList.contains('open');
      
      if (isOpen) {
        this.closeSidebar();
      } else {
        sidebar.classList.add('open');
        overlay.classList.add('active');
      }
    }
  }

  closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    
    if (sidebar && overlay) {
      sidebar.classList.remove('open');
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
    const modal = document.getElementById('city-modal');
    const title = document.getElementById('city-modal-title');
    const countyInfo = document.getElementById('city-county-info');
    const businessList = document.getElementById('city-businesses-list');
    const cityNameSpan = document.getElementById('city-name-businesses');
    
    if (!modal) return;
    
    // Set city info
    title.textContent = cityName;
    countyInfo.textContent = `${countyName} • FIPS: ${fipsCode}`;
    cityNameSpan.textContent = cityName;
    
    // Filter businesses by city
    const cityBusinesses = BUSINESSES.filter(b => 
      b.active && b.city === cityName && b.county === fipsCode
    );
    
    // Display businesses
    if (cityBusinesses.length > 0) {
      businessList.innerHTML = cityBusinesses.map(biz => `
        <div class="business-item" style="padding: 12px; margin-bottom: 10px; background: var(--parchment-light); 
             border: 1px solid var(--wood-dark); border-radius: 6px;">
          <h4 style="margin: 0 0 8px 0; color: var(--wood-dark);">
            ${biz.icon} ${biz.name}
          </h4>
          <p style="margin: 4px 0; color: var(--ink-dark); font-size: 0.9em;">
            📍 ${biz.address}
          </p>
          ${biz.phone ? `<p style="margin: 4px 0; color: var(--ink-dark); font-size: 0.9em;">📞 ${biz.phone}</p>` : ''}
          ${biz.website ? `
            <p style="margin: 8px 0 0 0;">
              <a href="${biz.website}" target="_blank" style="color: var(--wood-dark); text-decoration: underline;">
                Visit Website
              </a>
            </p>
          ` : ''}
        </div>
      `).join('');
    } else {
      businessList.innerHTML = `
        <p style="color: var(--ink-dark); font-style: italic;">
          No businesses registered in ${cityName} yet. Be the first!
        </p>
      `;
    }
    
    modal.style.display = 'block';
  }

  closeCityModal() {
    const modal = document.getElementById('city-modal');
    if (modal) {
      modal.style.display = 'none';
    }
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
    const otherSections = ['business-form-section', 'map-section'];
    
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

  handleAdminLogin(e) {
    e.preventDefault();
    const password = document.getElementById('admin-password').value;
    
    if (password === ADMIN_CONFIG.password) {
      ADMIN_CONFIG.isLoggedIn = true;
      document.getElementById('admin-login').style.display = 'none';
      document.getElementById('admin-dashboard').style.display = 'block';
      document.getElementById('admin-password').value = '';
      this.loadCountyList();
    } else {
      alert('❌ Incorrect password. Please try again.');
      document.getElementById('admin-password').value = '';
    }
  }

  handleAdminLogout() {
    ADMIN_CONFIG.isLoggedIn = false;
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
  }

  loadCountyList() {
    const countyList = document.getElementById('county-list');
    if (!countyList) return;
    
    // Get all Montana counties from our data
    const countyNames = {
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

  handleCountyUpdate(e) {
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
    
    // Save to COUNTY_DATA
    COUNTY_DATA[fips] = countyData;
    localStorage.setItem('countyData', JSON.stringify(COUNTY_DATA));
    
    // Update the county list display
    this.loadCountyList();
    
    // Close modal
    this.closeModal();
    
    alert('✅ County information updated successfully!');
  }

  handlePasswordChange(e) {
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
    
    ADMIN_CONFIG.password = newPassword;
    localStorage.setItem('adminPassword', newPassword);
    
    document.getElementById('new-password').value = '';
    document.getElementById('confirm-password').value = '';
    
    alert('✅ Admin password updated successfully!');
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
}

// Initialize app when DOM is ready
let app; // Global reference for inline event handlers
document.addEventListener('DOMContentLoaded', () => {
  app = new MTApp();
  app.init();
});
