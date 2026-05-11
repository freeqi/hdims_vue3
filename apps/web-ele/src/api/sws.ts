/**
 * 血透系统API封装 - 适配原系统的swsApi调用方式
 * 提供 swsGet, swsPut, swsPost, swsDelete 方法
 */
import { requestClient } from '#/api/request';

/**
 * 标准响应格式
 */
interface SwsResponse<T = any> {
  Code: number;
  Data: T;
  Msg: string;
}

/**
 * GET请求
 * @param url API端点
 * @param params 查询参数
 */
async function swsGet<T = any>(url: string, params?: Record<string, any>): Promise<SwsResponse<T>> {
  const data = await requestClient.get(url, { params });
  return {
    Code: 200,
    Data: data as T,
    Msg: 'success',
  };
}

/**
 * PUT请求
 * @param url API端点
 * @param data 请求体数据
 */
async function swsPut<T = any>(url: string, data?: Record<string, any>): Promise<SwsResponse<T>> {
  const response = await requestClient.put(url, data);
  return {
    Code: 200,
    Data: response as T,
    Msg: 'success',
  };
}

/**
 * POST请求
 * @param url API端点
 * @param data 请求体数据
 */
async function swsPost<T = any>(url: string, data?: Record<string, any>): Promise<SwsResponse<T>> {
  const response = await requestClient.post(url, data);
  return {
    Code: 200,
    Data: response as T,
    Msg: 'success',
  };
}

/**
 * DELETE请求
 * @param url API端点
 * @param params 查询参数
 */
async function swsDelete<T = any>(url: string, params?: Record<string, any>): Promise<SwsResponse<T>> {
  const data = await requestClient.delete(url, { params });
  return {
    Code: 200,
    Data: data as T,
    Msg: 'success',
  };
}

export const swsApi = {
  swsGet,
  swsPut,
  swsPost,
  swsDelete,
};

export default swsApi;
