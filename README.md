# Simple Montana - Montana County Explorer

[![Firebase Hosting](https://img.shields.io/badge/Hosted%20on-Firebase-FFCA28?style=flat-square&logo=firebase)](https://firebase.google.com)
[![Built with Vite](https://img.shields.io/badge/Built%20with-Vite-646CFF?style=flat-square&logo=vite)](https://vitejs.dev)
[![React](https://img.shields.io/badge/React-18.2-61DAFB?style=flat-square&logo=react)](https://react.dev)

An interactive educational platform for exploring Montana's geography, history, and local culture. Visit **[simpleMontana.com](https://simplemontana.com)** to discover "The Treasure State" through an engaging map interface.

## 🌄 Overview

Montana County Explorer is a comprehensive web application that brings Montana's 56 counties to life through:
- **Interactive county maps** with detailed boundary visualization
- **Business directory** with location-based listings
- **Educational content** about Montana's history, geography, and culture
- **Community features** including discussion boards and member profiles
- **Events calendar** for local happenings across the state
- **Quiz system** to test and enhance your Montana knowledge

## ✨ Features

### 🗺️ Interactive Mapping
- **Leaflet-based map** displaying all 56 Montana counties
- Real-time boundary visualization using GeoJSON data
- Click on any county to explore detailed information
- Integration with Google Maps API for geocoding

### 📍 Business Directory
- Add and browse local businesses across Montana
- Location-based markers on the interactive map
- Business information including contact details, websites, and descriptions
- Admin panel for managing business listings

### 🏛️ County Information System
- Detailed county profiles with historical facts
- City-specific information and highlights
- Editable content through admin interface
- Quick facts and statistics for each region

### 🎓 Educational Features
- Montana history and geography quizzes
- Knowledge awards and achievement system
- Interactive discussion boards
- Member profiles with ranking system

### 📅 Events Management
- Local events calendar
- Recurring event support
- County and city-specific event filtering
- Featured events highlighting

### 🎨 Modern UI/UX
- Responsive design built with Tailwind CSS
- Smooth animations using Framer Motion
- Dark mode interface optimized for readability
- Accessible navigation and sidebar controls

## 🛠️ Technology Stack

### Frontend
- **React 18.2** - UI component framework
- **Vite** - Build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **Lucide React** - Icon library

### Mapping & Geospatial
- **Leaflet** - Interactive map library
- **Google Maps API** - Geocoding services
- **GeoJSON** - County boundary data

### Backend & Hosting
- **Firebase Hosting** - Production deployment
- **Firebase** - Optional backend services
- **LocalStorage** - Client-side data persistence

### Development Tools
- **ESLint** - Code linting
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixing

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ and npm
- Git
- A Google Maps API key (for geocoding features)
- Firebase account (for deployment)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ohjoncurrie-netizen/mtdashboard.git
   cd mtdashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up API keys**
   - Add your Google Maps API key in the Google Maps script tag in `index.html`
   - Configure Firebase settings in `firebase-config.js` if using Firebase features
   - **Important:** Never commit API keys to version control. Consider using environment variables or a `.env` file for production deployments

4. **Start development server**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:5173`

### Development Scripts

- `npm run dev` - Start Vite development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint code quality checks
- `npm run deploy` - Deploy to Firebase Hosting

## 📦 Building for Production

```bash
# Create optimized production build
npm run build

# Preview the production build
npm run preview
```

The build output will be in the `dist/` directory.

## 🌐 Deployment

This project uses Firebase Hosting **multi-site** configuration:

| Target | Public Dir | URL |
|--------|-----------|-----|
| `main` | `dist/` | `simplemontana.com` (Montana Explorer app) |
| `landing` | `dist/` → `/landing/index.html` | `landing.simplemontana.com` (React landing page) |

```bash
# Deploy both hosting targets
npm run deploy
```

Or deploy individually:
```bash
firebase deploy --only hosting:main
firebase deploy --only hosting:landing
```

> **Note:** Before deploying the `landing` target for the first time, create a second Firebase Hosting site named `simplemontana-landing` in the [Firebase Console](https://console.firebase.google.com) and connect your subdomain to it.

The main site is hosted at: **simpleMontana.com**

## 📁 Project Structure

```
mtdashboard/
├── src/                    # Source files
│   └── main.jsx           # React entry point (renders LandingPage only)
├── landing/                # Subdomain entry point
│   └── index.html         # HTML template for landing subdomain (built to dist/landing/)
├── dist/                   # Production build output
│   ├── landing/           # Built landing page (served by landing subdomain)
│   └── assets/            # Shared JS/CSS assets
├── public/                 # Static assets
├── app.js                  # Core application logic
├── config.js              # Configuration and data
├── LandingPage.jsx        # Landing page React component
├── index.html             # Main HTML template (Montana Explorer app)
├── index-landing.html     # Legacy landing page HTML (superseded by landing/index.html)
├── styles.css             # Base styles
├── modern-enhancements.css # Enhanced styling
├── simple_montana.geojson # County boundary data
├── firebase-config.js     # Firebase configuration
├── vite.config.js         # Vite configuration
├── tailwind.config.js     # Tailwind CSS configuration
└── package.json           # Project dependencies
```

## 🎯 Key Data Files

- **simple_montana.geojson** - Montana county boundary polygons
- **config.js** - County cities, events, awards, and configuration
- **app.js** - Main application class with mapping logic

## 🔐 Admin Features

The platform includes an admin panel for:
- Managing business listings
- Editing county and city information
- Managing events
- Moderating discussion posts

Access the admin panel through the login interface (requires authentication).

## 🤝 Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure your code:
- Passes ESLint checks (`npm run lint`)
- Follows the existing code style
- Includes appropriate comments where needed

## 📄 License

This project is part of the Simple Montana initiative to provide educational resources about Montana.

## 🙏 Acknowledgments

- **Montana State Government** - For providing public geographic data
- **OpenStreetMap** - For mapping resources
- **uMap** - For Simple Montana feature layers
- **Montana Fish, Wildlife & Parks** - For outdoor recreation information
- **Visit Montana** - For tourism resources

## 📞 Contact & Support

For questions, suggestions, or issues:
- Open an issue on GitHub
- Visit [simpleMontana.com](https://simplemontana.com)

---

**Made with ❤️ for Montana - The Treasure State**

🏔️ Explore • 📚 Learn • 🌟 Discover
