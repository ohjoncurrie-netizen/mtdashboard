class MTApp {
  constructor() {
    this.passMarkers = [];
    this.weatherMarkers = [];
    this.uMapLayer = null;
    this.map = null;
    this.init();
  }

  async init() {
    // Initialize map (existing code)
    this.map = L.map('map', {
      minZoom: 6, maxZoom: 12, maxBounds: MT_BOUNDS, maxBoundsViscosity: 1.0
    }).setView([46.6, -110.0], 7);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors | MT Roads + Simple Montana Dashboard',
      minZoom: 6, maxZoom: 12
    }).addTo(this.map);

    this.map.setMaxBounds(MT_BOUNDS);
    this.map.fitBounds(MT_BOUNDS, { padding: [20, 20], maxZoom: 8 });

    // Load ALL layers
    await this.loadUMapLayer();      // NEW: Your Simple Montana uMap
    this.addPassMarkers();           // Pass markers
    this.renderPassList();           // Pass list
    this.refreshData();              // Weather
    setInterval(() => this.refreshData(), 300000);
  }

  // NEW: Load your Simple Montana uMap
  async loadUMapLayer() {
    try {
      const data = await fetchSimpleMontanaUMap();
      if (!data || !data.features.length) {
        console.log('No uMap data found');
        return;
      }

      // Remove existing uMap layer
      if (this.uMapLayer) this.map.removeLayer(this.uMapLayer);

      // Add Simple Montana layers with your theme
      this.uMapLayer = L.geoJSON(data, {
        style: feature => ({
          color: '#00ff88',      // Your green accent
          weight: feature.geometry.type === 'LineString' ? 4 : 2,
          opacity: 0.9,
          fillOpacity: feature.geometry.type !== 'Point' ? 0.2 : 0.7
        }),
        pointToLayer: (feature, latlng) => 
          L.circleMarker(latlng, {
            radius: 7,
            fillColor: '#00ff88',
            color: '#fff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
          }),
        onEachFeature: (feature, layer) => {
          const props = feature.properties || {};
          layer.bindPopup(`
            <div style="min-width: 220px; font-family: -apple-system, sans-serif;">
              <b style="color: var(--accent);">${props.name || props.title || 'Simple Montana'}</b>
              ${props.description ? `<br>${props.description}` : ''}
              ${props.popupContent ? `<br><small>${props.popupContent}</small>` : ''}
            </div>
          `);
        }
      }).addTo(this.map);

      console.log(`✅ Loaded ${data.features.length} Simple Montana features`);
    } catch (error) {
      console.error('Simple Montana uMap failed:', error);
    }
  }

  // NEW: Toggle uMap visibility
  toggleUMap() {
    if (this.uMapLayer) {
      if (this.map.hasLayer(this.uMapLayer)) {
        this.map.removeLayer(this.uMapLayer);
      } else {
        this.map.addLayer(this.uMapLayer);
      }
    }
  }

  // Keep ALL your existing methods unchanged:
  // addPassMarkers(), refreshData(), addWeatherMarkers(), etc.
  // ... (rest of your existing methods stay exactly the same)
}

// Global methods for buttons
document.addEventListener('DOMContentLoaded', () => {
  window.MTApp = new MTApp();
});


// Global functions for HTML buttons - ADD THIS
window.MTApp = {
  refreshData: () => window.mtAppInstance.refreshData(),
  toggleTheme: () => window.mtAppInstance.toggleTheme(),
  toggleUMap: () => window.mtAppInstance.toggleUMap()
};

// Update the constructor to expose instance globally
class MTApp {
  constructor() {
    this.passMarkers = [];
    this.weatherMarkers = [];
    this.uMapLayer = null;
    this.map = null;
    window.mtAppInstance = this;  // ADD THIS LINE
    this.init();
  }
  // ... rest of your class unchanged
}
