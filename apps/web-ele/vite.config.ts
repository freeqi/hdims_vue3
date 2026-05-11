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
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api/, '/api'),
            // 血透系统线上后端地址
            target: 'http://online.swskj.com:8080',
            timeout: 30_000, // 代理超时30秒
            proxyTimeout: 30_000, // 代理超时30秒
            ws: true,
            configure: (proxy) => {
              proxy.on('error', (err) => {
                console.log('[proxy error]', err.message);
              });
              proxy.on('proxyReq', (proxyReq, req) => {
                console.log('[proxy request]', req.method, req.url);
              });
              proxy.on('proxyRes', (proxyRes, req) => {
                console.log('[proxy response]', proxyRes.statusCode, req.url);
              });
            },
          },
        },
      },
    },
  };
});
