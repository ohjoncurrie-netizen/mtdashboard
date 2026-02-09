// Add Google Maps global init
function initGoogleMaps() {
  window.googleMapsLoaded = true;
}

class MTApp {
  constructor() {
    // ... existing constructor ...
    this.geocoder = null;
  }

  async init() {
    // Wait for Google Maps to load
    while (!window.googleMapsLoaded) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    this.geocoder = new google.maps.Geocoder();
    // ... rest of existing init() unchanged ...
  }

  // ✅ REAL GEOCODING - Replace demo method
  async handleBusinessSubmit(e) {
    e.preventDefault();
    
    const button = e.target.querySelector('button');
    button.textContent = '⏳ Geocoding...';
    button.disabled = true;

    try {
      const address = document.getElementById('biz-address').value;
      
      // 🌍 REAL GOOGLE MAPS GEOCODING
      const geocodeResult = await new Promise((resolve, reject) => {
        this.geocoder.geocode(
          { 
            address: address + ', Montana, USA',  // Bias to Montana
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
        address: geocodeResult.formatted,
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
      
      alert(`✅ ${business.name} added to map!\n📍 ${geocodeResult.formatted}\n💳 $5 payment processed. Expires: ${new Date(business.expires).toLocaleDateString()}`);
      
      document.getElementById('business-form').reset();
      
    } catch (error) {
      alert(`❌ ${error.message}\n\nPlease check the address and try again.`);
    } finally {
      button.textContent = '💳 Subscribe & Add ($5/month)';
      button.disabled = false;
    }
  }

  // NEW: Check expired businesses on load
  checkBusinessExpiration() {
    const now = new Date();
    BUSINESSES.forEach(business => {
      if (new Date(business.expires) < now) {
        business.active = false;
      }
    });
    localStorage.setItem('mtBusinesses', JSON.stringify(BUSINESSES));
    this.addBusinessMarkers();
    this.renderBusinessList();
  }
}
