import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// ★ 1. 引入 PWA 插件
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    // ★ 2. 設定 PWA 詳細資訊
    VitePWA({
      registerType: 'autoUpdate', // 自動更新 SW
      includeAssets: ['logo.png', 'robots.txt'], // 包含的靜態資源
      manifest: {
        name: '數還數 ClearCount', // 安裝後的 App 名稱
        short_name: '數還數', // 主畫面顯示的短名稱
        description: 'Keep Bills Clear, Keep Friends Near.',
        theme_color: '#4F46E5', // 頂部狀態列顏色 (Indigo)
        background_color: '#ffffff', // 啟動畫面背景色
        display: 'standalone', // ★ 關鍵：這會隱藏瀏覽器網址列，像原生 App
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable' // Android 圓形 Icon 適配
          }
        ]
      }
    })
  ],
});