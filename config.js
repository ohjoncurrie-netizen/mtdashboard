// Montana boundary bounds: SW to NE corners
window.MT_BOUNDS = [
  [44.35, -116.05],  // Southwest corner
  [49.00, -104.04]   // Northeast corner  
];

// Pass data with coordinates
window.CONFIG = {
  passes: [
    { name: 'Beartooth Hwy', lat: 45.0, lng: -109.6, status: 'Seasonally Closed (Oct-Jun)', chains: 'N/A', url: 'https://www.mdt.mt.gov/travinfo/beartooth/', cam: 'https://www.mdt.mt.gov/travinfo/cameras/beartooth.html' },
    { name: 'Marias Pass', lat: 48.5, lng: -113.7, status: 'Open - Dry', chains: 'None', url: 'https://www.mdt.mt.gov/travinfo/', cam: 'https://www.mdt.mt.gov/travinfo/cameras/marias.html' },
    { name: 'Lookout Pass', lat: 47.0, lng: -115.7, status: 'Open - Chains Required', chains: 'Vehicles w/o snow tires/chains', url: 'https://www.mdt.mt.gov/travinfo/', cam: 'https://www.mdt.mt.gov/travinfo/cameras/lookout.html' },
    { name: 'Rogers Pass', lat: 47.2, lng: -112.9, status: 'Open - Icy Patches', chains: 'None', url: 'https://www.mdt.mt.gov/travinfo/', cam: 'https://www.mdt.mt.gov/travinfo/cameras/rogers.html' }
  ],
  weatherStations: [
    { id: 'BZN', lat: 45.78, lng: -111.15, name: 'Bozeman' },
    { id: 'MSO', lat: 46.92, lng: -114.08, name: 'Missoula' },
    { id: 'GTF', lat: 47.50, lng: -111.37, name: 'Great Falls' },
    { id: 'BIL', lat: 45.81, lng: -108.61, name: 'Billings' }
  ]
};

// Simple Montana uMap integration (ID: 1357058)
window.UMAP_ID = 1357058;

// Auto-fetch function for your specific uMap
async function fetchSimpleMontanaUMap() {
  try {
    // Get main map data
    const mapData = await fetch(`https://umap.openstreetmap.fr/en/map/${UMAP_ID}/geojson/`).then(r => r.json());
    
    // Fetch all data layers
    const fullData = { type: 'FeatureCollection', features: [] };
    for (const layer of mapData.datalayers) {
      const layerData = await fetch(`https://umap.openstreetmap.fr${mapData.urls.datalayer_view.replace('{pk}', layer.id)}`).then(r => r.json());
      fullData.features.push(...layerData.features);
    }
    
    return fullData;
  } catch (e) {
    console.error('uMap fetch failed:', e);
    return null;
  }
}
// Simple Montana uMap fetch function
window.fetchSimpleMontanaUMap = async function() {
  try {
    const mapData = await fetch(`https://umap.openstreetmap.fr/en/map/simple-montana_1357058/geojson/`).then(r => r.json());
    const fullData = { type: 'FeatureCollection', features: [] };
    
    // Fetch layers (simplified for your map)
    if (mapData.datalayers && mapData.datalayers.length > 0) {
      const layerData = await fetch(`https://umap.openstreetmap.fr${mapData.urls.datalayer_view.replace('{pk}', mapData.datalayers[0].id)}`).then(r => r.json());
      fullData.features.push(...(layerData.features || []));
    }
    
    return fullData;
  } catch (e) {
    console.error('uMap fetch failed:', e);
    return { type: 'FeatureCollection', features: [] };
  }
};
