# Montana County Explorer - Setup Guide

## Overview

Montana County Explorer is an interactive educational map application for exploring Montana's 56 counties, cities, businesses, and events. It features a discussion board with awards and member ranking system to encourage community engagement.

## Features

- **Interactive Map**: Leaflet-powered map with county boundaries and custom layers
- **County & City Pages**: Detailed information about Montana's counties and cities
- **Business Directory**: Add and manage local businesses with geocoding
- **Events System**: Track community, business, historical, and outdoor events
- **Discussion Board**: Community discussions with categories and search
- **Awards System**: 8 achievement badges for community contributions
- **Member Rankings**: Leaderboard showing top contributors
- **Admin Panel**: Manage all content with a password-protected admin interface

## Quick Start

### Prerequisites

- Node.js 18 or higher
- npm (comes with Node.js)
- Git
- A GitHub account (for deployment)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
   cd YOUR_REPO
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   Navigate to `http://localhost:3000`

### Production Build

```bash
npm run build
```

This creates a `dist/` folder with all production-ready files.

## Deployment to GitHub Pages

### Step 1: Enable GitHub Pages

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Pages**
3. Under "Build and deployment", select **GitHub Actions** as the source
4. The workflow will automatically deploy on push to `main`

### Step 2: Configure Custom Domain (Optional)

If you have a custom domain:

1. Update the `CNAME` file with your domain name
2. In GitHub repo settings → Pages, add your custom domain
3. Enable "Enforce HTTPS"

### Step 3: Push Changes

```bash
git add .
git commit -m "Your commit message"
git push origin main
```

The GitHub Actions workflow will automatically:
- Install dependencies
- Build the project
- Deploy to GitHub Pages

## Configuration

### Firebase (Optional)

For cloud data persistence, configure Firebase:

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Firestore Database and Authentication
3. Update `firebase-config.js` with your project credentials:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

Without Firebase, the app uses localStorage for data persistence.

### Google Maps API

The app uses Google Maps Geocoding API for business address lookup:

1. Get an API key from [Google Cloud Console](https://console.cloud.google.com)
2. Enable the Geocoding API
3. Update the API key in `index.html`:

```html
<script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=geometry&callback=initGoogleMaps"></script>
```

### Admin Panel

Default admin password: `admin123`

To change the password, update `config.js`:

```javascript
window.ADMIN_CONFIG = {
  password: 'your-secure-password'
};
```

## Project Structure

```
├── index.html              # Main HTML file
├── app.js                  # Core application logic
├── config.js               # Data structures and configuration
├── firebase-config.js      # Firebase/localStorage data service
├── styles.css              # Base styling
├── modern-enhancements.css # Premium UI enhancements
├── simple_montana.geojson  # Montana county boundaries
├── vite.config.js          # Build configuration
├── package.json            # Dependencies
├── CNAME                   # Custom domain (if applicable)
└── .github/
    └── workflows/
        └── static.yml      # GitHub Pages deployment workflow
```

## Discussion Board & Awards

### Categories
- 🦌 Wildlife & Nature
- 📜 History & Culture
- 🏔️ Hiking & Outdoor
- 🏘️ Cities & Towns
- 🪨 Geology & Geography
- 💡 Local Tips & Advice
- 🗨️ General Discussion

### Awards System

| Award | Icon | Points | Requirement |
|-------|------|--------|-------------|
| Montana Expert | 🏆 | 100 | 10+ quality posts |
| Helpful Contributor | 🤝 | 50 | 5+ helpful replies |
| Wildlife Whisperer | 🦌 | 75 | Wildlife insights |
| History Buff | 📜 | 75 | Historical knowledge |
| Trail Advocate | 🥾 | 50 | Hiking/outdoor tips |
| Community Champion | ⭐ | 150 | 50+ contributions |
| Knowledge Seeker | 🎓 | 25 | Insightful questions |
| Regional Master | 🗺️ | 100 | Multi-region expertise |

### Point System
- Wildlife/History/Geology posts: 15 points
- Hiking posts: 10 points
- Other posts: 5 points
- Helpful vote received: +5 points

## Explorer Layers

Toggle these map layers to explore Montana:

- 🌊 Watersheds & Rivers
- 🐻 Grizzly Bear Territory
- ⛰️ Mountain Peaks (10k+)
- 🛤️ Lewis & Clark Trail
- 🏛️ Native American Lands
- 👻 Ghost Towns
- ⛏️ Historic Mines
- 🌾 Agricultural Regions
- 💨 Wind Farms
- 🌿 Nature Hot Spots
- 🌲 National Forests
- 🦌 Wildlife Viewing Areas
- 🛣️ Scenic Byways
- ♨️ Geothermal Features
- 🏔️ Wilderness Areas
- 🪨 Geological Wonders

## Troubleshooting

### Build fails with "vite not found"
```bash
npm install
npm run build
```

### Map doesn't load
- Check browser console for errors
- Verify Leaflet CSS/JS are loading
- Ensure GeoJSON file exists

### Data not persisting
- Check localStorage is enabled in browser
- For Firebase, verify credentials in firebase-config.js
- Check browser console for Firebase errors

### GitHub Pages 404
- Ensure GitHub Pages is enabled in repo settings
- Check that the workflow completed successfully
- Verify CNAME matches your domain (if using custom domain)

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -m "Add your feature"`
4. Push to branch: `git push origin feature/your-feature`
5. Open a Pull Request

## License

MIT License - See LICENSE file for details.

## Support

For issues or questions, open a GitHub issue or contact the maintainers.

---

Built with ❤️ for Montana
