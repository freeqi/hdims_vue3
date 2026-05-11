import axios from 'axios';
import { aesEncrypt } from '#/utils/aes';

// 直接请求后端地址，不走 Vite 代理
const API_BASE = 'http://online.swskj.com:8080';

// 创建专用 axios 实例，baseURL 直接指向后端
const apiAxios = axios.create({
  baseURL: '', // 使用相对路径
  timeout: 30_000,
});

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

  /** 机构信息返回值 */
  export interface OrganizationResult {
    Code: number;
    Data: {
      OrganizationInfo: {
        Id: string;
        Name: string;
        NameUS: string;
        OrgAuthCode: string;
        MedicalCardBindingIP: string;
        LoginBackgroundImage: string;
        LoginIcon: string;
      };
      OrgDepartment: Array<{
        Id: string;
        Name: string;
      }>;
      MachineCode: string;
      AuthorizeInfo: {
        AuthStatus: boolean;
      };
    };
    Msg: string;
  }
}

/**
 * 获取机构信息 - 登录前必须先调用
 * 原系统接口: GET /api/v1/Open/4003
 */
export async function getOrganizationApi() {
  const response = await apiAxios.get<AuthApi.OrganizationResult>(
    '/api/v1/Open/4003',
    {
      headers: {
        'Content-Type': 'application/json',
        Account: 'null|null', // 必须包含，即使为空
        Token: 'null', // 必须包含，即使为空
        ClientType: 'PC',
      },
    },
  );

  const resp = response.data;

  if (resp.Code === 200) {
    const { OrganizationInfo, OrgDepartment, MachineCode } = resp.Data;

    sessionStorage.setItem('hdOrgId', OrganizationInfo.Id);
    sessionStorage.setItem('hdOrgAuthCode', OrganizationInfo.OrgAuthCode);
    sessionStorage.setItem('hdMachineCode', MachineCode);
    sessionStorage.setItem('hdAgyName', OrganizationInfo.Name);
    sessionStorage.setItem('hdYqArr', JSON.stringify(OrgDepartment));

    if (OrgDepartment.length === 1) {
      sessionStorage.setItem('hdEmpDepartment', OrgDepartment[0].Id);
    }

    return resp.Data;
  }

  throw new Error(resp.Msg || '获取机构信息失败');
}

/**
 * 登录 - 对接原血透系统
 * 原系统接口: POST /api/v1/Account/LoginToken/{加密账号}/{加密密码}
 */
export async function loginApi(data: AuthApi.LoginParams) {
  const jmaccount = aesEncrypt(data.username?.trim() || '');
  const jmpwd = aesEncrypt(data.password?.trim() || '');

  const orgId = sessionStorage.getItem('hdOrgId') || '';
  const orgAuthCode = sessionStorage.getItem('hdOrgAuthCode') || '';
  const empDepartment = sessionStorage.getItem('hdEmpDepartment') || '';

  const response = await apiAxios.post<AuthApi.OriginalLoginResult>(
    `/api/v1/Account/LoginToken/${jmaccount}/${jmpwd}`,
    null,
    {
      headers: {
        'Content-Type': 'application/json',
        Account: 'null|null',
        Token: 'null', // 登录时Token为空
        ClientType: 'PC',
        OrgId: orgId,
        OrgAuthCode: orgAuthCode,
        Department: empDepartment,
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
 * 获取当前用户信息
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
 * 退出登录
 */
export async function logoutApi() {
  const userName = sessionStorage.getItem('hdUserName');
  const token = sessionStorage.getItem('hdToken') || '';
  const orgId = sessionStorage.getItem('hdOrgId') || '';
  const orgAuthCode = sessionStorage.getItem('hdOrgAuthCode') || '';
  const empDepartment = sessionStorage.getItem('hdEmpDepartment') || '';

  if (userName) {
    try {
      const jmaccount = aesEncrypt(userName);
      await apiAxios.post(`/api/v1/Account/LogoutToken/${jmaccount}`, null, {
        headers: {
          Account: encodeURIComponent(userName),
          Token: token,
          ClientType: 'PC',
          OrgId: orgId,
          OrgAuthCode: orgAuthCode,
          Department: empDepartment,
        },
      });
    } catch {
      // ignore
    }
  }
}

/**
 * 获取用户权限码
 */
export async function getAccessCodesApi() {
  return ['*'];
}
