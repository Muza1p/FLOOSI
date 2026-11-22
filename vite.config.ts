import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'TADBIRI | تدبيري',
        short_name: 'تدبيري',
        description: 'إدارة أموالك ومصاريفك بذكاء وسهولة',
        theme_color: '#101820',
        background_color: '#101820',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: '/icons.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
        ],
      },
    }),
  ],
})
