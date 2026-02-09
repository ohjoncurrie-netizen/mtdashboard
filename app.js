class MTApp {
  constructor() {
    this.passMarkers = [];
    this.weatherMarkers = [];
    this.map = null;
    this.init();
  }

  init() {
    // Initialize map
    this.map = L.map('map', {
      minZoom: 6,
      maxZoom: 12,
      maxBounds: MT_BOUNDS,
      maxBoundsViscosity: 1.0
    }).setView([46.6, -110.0], 7);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors | MT Roads Dashboard',
      minZoom: 6,
      maxZoom: 12
    }).addTo(this.map);

    // Lock map to Montana
    this.map.setMaxBounds(MT_BOUNDS);
    this.map.fitBounds(MT_BOUNDS, { padding: [20, 20], maxZoom: 8 });

    // Initial render
    this.addPassMarkers();
    this.renderPassList();
    this.refreshData();
    setInterval(() => this.refreshData(), 300000); // 5 min
  }

  addPassMarkers() {
    this.passMarkers.forEach(marker => this.map.removeLayer(marker));
    this.passMarkers = [];
    
    CONFIG.passes.forEach((pass) => {
      const statusClass = pass.status.includes('Open') ? 'open' : 
                         pass.status.includes('Closed') ? 'closed' : 'chains';
      const color = statusClass === 'open' ? '#0f0' : 
                   statusClass === 'closed' ? '#f00' : '#ffaa00';
      
      const marker = L.marker([pass.lat, pass.lng], {
        icon: L.divIcon({
          className: `pass-marker ${statusClass}`,
          html: `<div style="background: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 3px solid #fff; box-shadow: 0 0 10px ${color};"></div>`,
          iconSize: [26, 26], iconAnchor: [13, 13]
        })
      }).addTo(this.map)
      .bindPopup(`
        <b>🏔️ ${pass.name}</b><br>
        <span class="status ${statusClass}">${pass.status}</span><br>
        Chains: ${pass.chains}<br>
        <a href="${pass.url}" target="_blank" class="mdt-link">MDT Report →</a><br>
        <a href="${pass.cam}" target="_blank" class="mdt-link">📷 Live Cam →</a>
      `);
      
      this.passMarkers.push(marker);
    });
  }

  async refreshData() {
    await this.fetchWeather();
    document.getElementById('last-updated').textContent = 
      `Last updated: ${new Date().toLocaleTimeString()}`;
  }

  addWeatherMarkers(weatherData) {
    this.weatherMarkers.forEach(marker => this.map.removeLayer(marker));
    this.weatherMarkers = [];
    
    CONFIG.weatherStations.forEach(station => {
      const stationData = weatherData?.find(w => w.station_id === station.id);
      if (stationData) {
        const temp = Math.round(stationData.air_temp_f || 0);
        const color = temp > 32 ? '#ffaa00' : '#00aaff';
        
        const marker = L.marker([station.lat, station.lng], {
          icon: L.divIcon({
            className: 'weather-marker',
            html: `<div style="background: ${color}; width: 16px; height: 16px; border-radius: 50%; border: 2px solid #fff;"></div>`,
            iconSize: [20, 20], iconAnchor: [10, 10]
          })
        }).addTo(this.map)
        .bindPopup(`
          <b>🌤️ ${station.name} (${station.id})</b><br>
          ${temp}°F | ${(stationData.wind_speed_mph || 0).toFixed(1)}mph<br>
          Precip: ${(stationData.precip_in || 0).toFixed(2)}"
        `);
        
        this.weatherMarkers.push(marker);
      }
    });
  }

  renderPassList() {
    let html = '';
    CONFIG.passes.forEach(pass => {
      const statusClass = pass.status.includes('Open') ? 'status-open' : 
                         pass.status.includes('Closed') ? 'status-closed' : 'status-chains';
      html += `
        <div style="margin-bottom: 1rem; padding: 1rem; background: rgba(255,255,255,0.05); border-radius: 0.5rem;">
          <strong>${pass.name}</strong><br>
          <div class="status ${statusClass}">${pass.status}</div>
          <div>${pass.chains}</div>
          <a href="${pass.url}" target="_blank" class="mdt-link">MDT →</a>
        </div>
      `;
    });
    document.getElementById('passes-list').innerHTML = html;
  }

  renderWeatherList(data) {
    let html = '';
    CONFIG.weatherStations.forEach(station => {
      const stationData = data?.find(w => w.station_id === station.id);
      if (stationData) {
        html += `
          <div class="weather-item">
            <strong>${station.name}</strong><br>
            ${Math.round(stationData.air_temp_f || 0)}°F<br>
            ${(stationData.wind_speed_mph || 0).toFixed(1)}mph
          </div>
        `;
      }
    });
    document.getElementById('weather-stations').innerHTML = html || '<p>No weather data</p>';
  }

  async fetchWeather() {
    try {
      const resp = await fetch('https://mesonet.climate.umt.edu/api/v2/latest/?limit=20');
      const data = await resp.json();
      this.addWeatherMarkers(data);
      this.renderWeatherList(data);
    } catch(e) {
      console.error('Weather fetch failed');
    }
  }

  toggleTheme() {
    const html = document.documentElement;
    html.setAttribute('data-theme', html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  }
}

// Initialize app when DOM loads
document.addEventListener('DOMContentLoaded', () => {
  window.MTApp = new MTApp();
});
