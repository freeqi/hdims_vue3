import { defineConfig } from '@vben/vite-config';

import ElementPlus from 'unplugin-element-plus/vite';

export default defineConfig(async () => {
  return {
    application: {},
    vite: {
      plugins: [
        ElementPlus({
          format: 'esm',
        }),
      ],
      server: {
        proxy: {
          '/api': {
            changeOrigin: false,
            rewrite: (path) => path.replace(/^\/api/, '/api'),
            target: 'http://online.swskj.com:8080',
            timeout: 30_000,
            proxyTimeout: 30_000,
            ws: true,
            configure: (proxy) => {
              proxy.on('proxyReq', (proxyReq, req) => {
                proxyReq.setHeader('Host', 'online.swskj.com:8080');
              });
            },
          },
        },
      },
    },
  };
});
