import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync, mkdirSync, existsSync, readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'

// Skip Vite's import analysis on plain (non-module) JS files
const skipPlainScripts = () => ({
  name: 'skip-plain-scripts',
  enforce: 'pre',
  transform(code, id) {
    const skipFiles = ['app.js', 'config.js', 'firebase-config.js']
    if (skipFiles.some(f => id.endsWith(f))) {
      return { code, map: null }
    }
  }
})

// Custom plugin to copy static files and fix CSS links in dist HTML
const copyStaticFiles = () => ({
  name: 'copy-static-files',
  closeBundle() {
    const filesToCopy = [
      'app.js',
      'config.js',
      'firebase-config.js',
      'styles.css',
      'modern-enhancements.css',
      'simple_montana.geojson',
      'CNAME'
    ]
    
    filesToCopy.forEach(file => {
      const src = resolve(__dirname, file)
      const dest = resolve(__dirname, 'dist', file)
      if (existsSync(src)) {
        copyFileSync(src, dest)
        console.log(`Copied ${file} to dist/`)
      }
    })

    // Re-inject CSS links that Vite strips during build
    const distHtml = resolve(__dirname, 'dist', 'index.html')
    if (existsSync(distHtml)) {
      let html = readFileSync(distHtml, 'utf-8')
      if (!html.includes('href="styles.css"')) {
        html = html.replace(
          '</head>',
          '  <link rel="stylesheet" href="styles.css">\n  <link rel="stylesheet" href="modern-enhancements.css">\n</head>'
        )
        writeFileSync(distHtml, html, 'utf-8')
        console.log('Injected styles.css and modern-enhancements.css into dist/index.html')
      }
    }
  }
})

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), skipPlainScripts(), copyStaticFiles()],
  server: {
    port: 3000,
    open: true
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      }
    }
  }
})
