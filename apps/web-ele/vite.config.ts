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
            target: 'http://online.swskj.com:8080',
            changeOrigin: true,
            // 重写路径：去掉 /api 前缀
            rewrite: (path) => path.replace(/^\/api/, ''),
            // 配置代理请求头，修复 Host 问题
            configure: (proxy, _options) => {
              proxy.on('proxyReq', (proxyReq, req) => {
                // 关键：设置正确的 Host 头，避免发送 localhost
                proxyReq.setHeader('Host', 'online.swskj.com');
                // 可选：移除 origin 头
                proxyReq.removeHeader('origin');
              });
            },
          },
        },
      },
    },
  };
});
