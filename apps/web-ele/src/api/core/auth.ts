import axios from 'axios';
import { baseRequestClient } from '#/api/request';
import { aesEncrypt } from '#/utils/aes';

export namespace AuthApi {
  /** 登录接口参数 */
  export interface LoginParams {
    password?: string;
    username?: string;
  }

  /** 登录接口返回值 */
  export interface LoginResult {
    accessToken: string;
    userData: any;
  }

  /** 原系统登录返回值 */
  export interface OriginalLoginResult {
    Code: number;
    Data: {
      Token: string;
      account: any;
      employeeId: string;
      name: string;
      Menu: any[];
      Perm: any[];
      Button: any[];
      [key: string]: any;
    };
    Msg: string;
  }
}

/**
 * 登录 - 对接原血透系统
 * 直接使用 axios 发送请求，绕过 Vben 请求封装
 * 原系统接口: POST /api/v1/Account/LoginToken/{加密账号}/{加密密码}
 */
export async function loginApi(data: AuthApi.LoginParams) {
  // 使用与原系统一致的AES加密
  const jmaccount = aesEncrypt(data.username?.trim() || '');
  const jmpwd = aesEncrypt(data.password?.trim() || '');

  // 直接通过Vite代理发送请求
  const response = await axios.post<AuthApi.OriginalLoginResult>(
    `/api/v1/Account/LoginToken/${jmaccount}/${jmpwd}`,
    null,
    {
      headers: {
        'Content-Type': 'application/json',
        ClientType: 'PC',
      },
    },
  );

  const resp = response.data;

  if (resp.Code === 200) {
    return {
      accessToken: resp.Data.Token,
      userData: resp.Data,
    } as AuthApi.LoginResult;
  }

  throw new Error(resp.Msg || '登录失败');
}

/**
 * 获取当前用户信息 - 从sessionStorage读取（原系统方式）
 */
export async function getUserInfoApi() {
  const userInfoStr = sessionStorage.getItem('hdUserInfo');
  if (userInfoStr) {
    try {
      return JSON.parse(userInfoStr);
    } catch {
      // ignore
    }
  }

  return {
    userId: '1',
    username: sessionStorage.getItem('hdUserName') || 'admin',
    realName: sessionStorage.getItem('hdNickName') || '管理员',
    avatar: '',
    desc: '血透系统管理员',
    homePath: '/patient/list',
    roles: ['admin'],
  };
}

/**
 * 退出登录 - 对接原系统
 */
export async function logoutApi() {
  const userName = sessionStorage.getItem('hdUserName');
  if (userName) {
    try {
      const jmaccount = aesEncrypt(userName);
      await axios.post(`/api/v1/Account/LogoutToken/${jmaccount}`);
    } catch {
      // ignore
    }
  }
}

/**
 * 获取用户权限码 - 返回通配符（原系统使用菜单+按钮权限）
 */
export async function getAccessCodesApi() {
  return ['*'];
}
