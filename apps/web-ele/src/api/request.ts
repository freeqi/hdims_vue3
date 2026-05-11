/**
 * 该文件根据血透系统业务逻辑进行调整
 * 使用 Vite 代理转发请求到后端
 */
import type { RequestClientOptions } from '@vben/request';

import {
  errorMessageResponseInterceptor,
  RequestClient,
} from '@vben/request';

import { ElMessage } from 'element-plus';

import { useAuthStore } from '#/store';

// 使用相对路径，通过 Vite 代理转发
// 代理配置在 vite.config.ts 中
const apiURL = '/api';

function createRequestClient(baseURL: string, options?: RequestClientOptions) {
  const client = new RequestClient({
    ...options,
    baseURL,
  });

  // 请求头处理 - 适配原血透系统
  client.addRequestInterceptor({
    fulfilled: async (config) => {
      const token = sessionStorage.getItem('hdToken');
      const userName = sessionStorage.getItem('hdUserName');
      const employeeId = sessionStorage.getItem('hdEmployeeId');
      const orgId = sessionStorage.getItem('hdOrgId');
      const orgAuthCode = sessionStorage.getItem('hdOrgAuthCode');
      const empDepartment = sessionStorage.getItem('hdEmpDepartment');

      config.headers.Token = token || '';
      config.headers.Account = userName
        ? encodeURIComponent(userName) + (employeeId ? `|${employeeId}` : '')
        : '';
      config.headers.ClientType = 'PC';
      config.headers.OrgId = orgId || '';
      config.headers.OrgAuthCode = orgAuthCode || '';
      config.headers.Department = empDepartment || '';
      config.headers['Content-Type'] = 'application/json; charset=utf-8';

      return config;
    },
  });

  // 响应处理 - 适配原系统 { Code: 200, Data: {...}, Msg: "..." } 格式
  client.addResponseInterceptor((response) => {
    const { data } = response;
    if (data && typeof data === 'object' && 'Code' in data) {
      if (data.Code === 200) {
        response.data = data.Data;
      } else if (data.Code === 361) {
        ElMessage.error('登录已过期，请重新登录');
        const authStore = useAuthStore();
        authStore.logout();
        return Promise.reject(new Error(data.Msg || '身份认证无效'));
      } else {
        ElMessage.error(data.Msg || '请求失败');
        return Promise.reject(new Error(data.Msg || '请求失败'));
      }
    }
    return response;
  });

  // 通用的错误处理
  client.addResponseInterceptor(
    errorMessageResponseInterceptor((msg: string, error) => {
      const responseData = error?.response?.data ?? {};
      const errorMessage = responseData?.Msg ?? responseData?.message ?? '';
      ElMessage.error(errorMessage || msg);
    }),
  );

  return client;
}

export const requestClient = createRequestClient(apiURL, {
  responseReturn: 'data',
});

export const baseRequestClient = createRequestClient(apiURL, {
  responseReturn: 'raw',
});
