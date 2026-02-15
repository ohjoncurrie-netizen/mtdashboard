import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync, mkdirSync, existsSync } from 'fs'
import { resolve } from 'path'

// Custom plugin to copy static files
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
  }
})

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), copyStaticFiles()],
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
