# 🚀 Quick Start Guide - Montana Educational Map Landing Page

## What I've Created

I've built a **professional, modern SaaS-style landing page** for your Montana Educational Map with:

✅ **Dark Mode Design** - Deep slate background (#0f172a) with Montana Pine & Sky Blue accents  
✅ **Bento Box Grid Layout** - Modern feature showcase  
✅ **Smooth Animations** - Using Framer Motion  
✅ **Fully Responsive** - Mobile-first design  
✅ **Professional Typography** - Inter font stack  
✅ **React + Tailwind CSS** - Modern tech stack  

## 📋 Prerequisites

Before you can run the landing page, you need:

1. **Node.js** (version 18 or higher)
   - Download from: https://nodejs.org/
   - Choose the LTS version
   - This includes npm (Node Package Manager)

## 🎯 Setup Instructions

### Step 1: Install Node.js
1. Go to https://nodejs.org/
2. Download the LTS version
3. Run the installer
4. Verify installation by opening a new terminal and running:
   ```bash
   node --version
   npm --version
   ```

### Step 2: Install Dependencies
Once Node.js is installed, run:
```bash
npm install
```

This will install:
- React 18
- Tailwind CSS
- Framer Motion
- Lucide React (icons)
- Vite (build tool)

### Step 3: Start Development Server
```bash
npm run dev
```

Your landing page will open at `http://localhost:3000`

### Step 4: Build for Production
When ready to deploy:
```bash
npm run build
```

The optimized files will be in the `dist` folder.

## 📁 Files Created

```
├── LandingPage.jsx           # Main React component
├── index-landing.html        # HTML entry point
├── src/
│   ├── main.jsx             # React app initialization
│   └── index.css            # Tailwind CSS imports
├── package.json             # Dependencies
├── tailwind.config.js       # Tailwind configuration
├── vite.config.js           # Vite build configuration
├── postcss.config.js        # PostCSS configuration
├── .eslintrc.cjs            # Code linting rules
├── .gitignore               # Git ignore rules
└── README-LANDING.md        # Documentation

```

## 🎨 Design Features

### Navigation
- Minimalist top bar
- GitHub icon link (links to your repo)
- "Launch Map" CTA button (links to `index.html`)

### Hero Section
- Large gradient headline: "Explore Montana's Rich History"
- Mesh gradient background with Montana colors
- Two CTAs: "Start Exploring" and "View Documentation"

### Social Proof Strip
- 9+ Interactive Layers
- 100+ Historic Locations
- Open Data Sources
- 100% Free for Educators

### Feature Grid (Bento Box)
1. **Interactive Layers** (Large card) - Showcases watersheds, peaks, wildlife, historic sites
2. **Historical Data** - Lewis & Clark Trail, Native American lands
3. **Classroom Ready** - Educational features for grades 4-12
4. **Open Source** - GitHub integration

### Footer
- Resource links
- Connect links
- "Built in Montana" badge

## 🔗 Integration with Existing Map

The landing page links to your existing map (`index.html`) via:
- "Launch Map" button in navigation
- "Start Exploring" button in hero
- "Launch Interactive Map" in CTA section

## 🌐 Deployment Options

### Option 1: GitHub Pages (Free)
1. Build the project: `npm run build`
2. Deploy the `dist` folder to GitHub Pages

### Option 2: Vercel (Free, Recommended)
1. Push to GitHub
2. Import project on vercel.com
3. Auto-deploys on every push

### Option 3: Netlify (Free)
1. Push to GitHub
2. Import project on netlify.com
3. Configure build command: `npm run build`
4. Configure publish directory: `dist`

## 🎯 Next Steps

1. **Install Node.js** if you haven't already
2. **Run `npm install`** to get all dependencies
3. **Run `npm run dev`** to see your landing page
4. **Customize** colors, text, or features as needed
5. **Deploy** to your preferred hosting platform

## 💡 Tips

- The landing page is completely separate from your existing map
- You can use `index-landing.html` as your homepage
- All buttons link back to your existing `index.html` map
- The design is fully customizable via `LandingPage.jsx`
- Colors can be adjusted in `tailwind.config.js`

## 🆘 Need Help?

If you encounter any issues:
1. Make sure Node.js is installed: `node --version`
2. Delete `node_modules` and run `npm install` again
3. Check that all files are in the correct locations
4. Ensure you're running commands from the project root directory

---

**Ready to launch!** 🚀 Once you install Node.js, you'll have a professional landing page for your Montana Educational Map!
