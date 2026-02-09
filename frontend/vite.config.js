import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://api.pixelforge.pro',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api/, '/backend'),
        configure: (proxy) => {
          proxy.on('proxyRes', (proxyRes) => {
            const setCookie = proxyRes.headers['set-cookie'];
            if (setCookie) {
              proxyRes.headers['set-cookie'] = setCookie.map(cookie =>
                cookie
                  .replace(/Domain=[^;]+/i, 'Domain=localhost')
                  .replace(/; Secure/i, '')
                  .replace(/SameSite=None/i, 'SameSite=Lax')
              );
            }
          });
        },
      },
    },
  },
})
