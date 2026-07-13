import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/bunny-stream-api': {
        target: 'https://video.bunnycdn.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/bunny-stream-api/, ''),
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.error('[Proxy Error]:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('[Proxy Request]:', req.method, req.url);
            console.log('Incoming Headers:', req.headers);
            const accessKey = req.headers['accesskey'] || req.headers['AccessKey'] || req.headers['access-key'];
            if (accessKey) {
              proxyReq.setHeader('AccessKey', accessKey);
              console.log('Forced AccessKey header on proxy request:', accessKey);
            }
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('[Proxy Response]:', proxyRes.statusCode, req.url);
          });
        }
      },
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        timeout: 10 * 60 * 1000,
        proxyTimeout: 10 * 60 * 1000
      }
    }
  }
})
