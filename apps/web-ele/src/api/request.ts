/**
 * 该文件根据血透系统业务逻辑进行调整
 * 直接请求后端地址，不走 Vite 代理
 */
import type { RequestClientOptions } from '@vben/request';

import {
  errorMessageResponseInterceptor,
  RequestClient,
} from '@vben/request';

import { ElMessage } from 'element-plus';

import { useAuthStore } from '#/store';

// 直接请求后端地址
const apiURL = 'http://online.swskj.com:8080';

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
