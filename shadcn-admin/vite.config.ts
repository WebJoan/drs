import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'

// Определяем, запускаемся ли мы внутри Docker контейнера
const isDocker = process.env.NODE_ENV === 'development' && 
                 (process.env.DOCKER_ENV === 'true' || process.cwd() === '/app')

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    TanStackRouterVite({
      target: 'react',
      autoCodeSplitting: false,
    }),
    react(),
    tailwindcss(),
  ],
  server: {
    host: isDocker ? '0.0.0.0' : 'localhost',
    port: 5173,
    strictPort: true,
    // Разрешенные хосты для dev сервера
    allowedHosts: ['jiman.ru'],
    // Дополнительные настройки безопасности для dev сервера
    cors: {
      origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
      credentials: true,
    },
    proxy: {
      // Проксирование API запросов к Django backend
      "^/(api)|(media)|(static)/": {
        target: isDocker ? "http://api:8000" : "http://localhost:8000",
        changeOrigin: true,
        secure: false,
        ws: true,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),

      // fix loading all icon chunks in dev mode
      // https://github.com/tabler/tabler-icons/issues/1233
      '@tabler/icons-react': '@tabler/icons-react/dist/esm/icons/index.mjs',
    },
  },
})
