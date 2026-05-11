/**
 * 该文件根据血透系统业务逻辑进行调整
 */
import type { RequestClientOptions } from '@vben/request';

import { useAppConfig } from '@vben/hooks';
import { preferences } from '@vben/preferences';
import {
  errorMessageResponseInterceptor,
  RequestClient,
} from '@vben/request';
import { useAccessStore } from '@vben/stores';

import { ElMessage } from 'element-plus';

import { useAuthStore } from '#/store';

const { apiURL } = useAppConfig(import.meta.env, import.meta.env.PROD);

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

      // 使用原系统的请求头格式
      if (token) {
        config.headers.Token = token;
      }
      if (userName) {
        config.headers.Account = encodeURIComponent(userName) + (employeeId ? `|${employeeId}` : '');
      }
      config.headers.ClientType = 'PC';
      config.headers['Content-Type'] = 'application/json; charset=utf-8';

      return config;
    },
  });

  // 响应处理 - 适配原系统 { Code: 200, Data: {...}, Msg: "..." } 格式
  client.addResponseInterceptor((response) => {
    const { data } = response;
    // 原系统返回格式
    if (data && typeof data === 'object' && 'Code' in data) {
      if (data.Code === 200) {
        // 登录成功，返回Data部分
        response.data = data.Data;
      } else if (data.Code === 361) {
        // Token过期/身份认证无效
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

export const baseRequestClient = new RequestClient({ baseURL: apiURL });
