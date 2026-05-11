import axios from 'axios';
import { aesEncrypt } from '#/utils/aes';

// 后端服务器地址（用于设置 Host 请求头）
const BACKEND_HOST = 'online.swskj.com';

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
 * 注意：此接口也需要包含 Account|Token|ClientType 请求头（即使为空）
 */
export async function getOrganizationApi() {
  const response = await axios.get<AuthApi.OrganizationResult>(
    '/api/v1/Open/4003',
    {
      headers: {
        'Content-Type': 'application/json',
        Account: '', // 必须包含，即使为空
        Token: '', // 必须包含，即使为空
        ClientType: 'PC',
        Host: BACKEND_HOST, // 覆盖代理默认的 localhost Host 头
      },
    },
  );

  const resp = response.data;

  if (resp.Code === 200) {
    const { OrganizationInfo, OrgDepartment, MachineCode } = resp.Data;

    // 存储机构信息到 sessionStorage
    sessionStorage.setItem('hdOrgId', OrganizationInfo.Id);
    sessionStorage.setItem('hdOrgAuthCode', OrganizationInfo.OrgAuthCode);
    sessionStorage.setItem('hdMachineCode', MachineCode);
    sessionStorage.setItem('hdAgyName', OrganizationInfo.Name);
    sessionStorage.setItem('hdYqArr', JSON.stringify(OrgDepartment));

    // 如果只有一个院区，自动选择
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
  // 使用与原系统一致的AES加密
  const jmaccount = aesEncrypt(data.username?.trim() || '');
  const jmpwd = aesEncrypt(data.password?.trim() || '');

  // 从 sessionStorage 获取机构信息
  const orgId = sessionStorage.getItem('hdOrgId') || '';
  const orgAuthCode = sessionStorage.getItem('hdOrgAuthCode') || '';
  const empDepartment = sessionStorage.getItem('hdEmpDepartment') || '';

  // 直接通过Vite代理发送请求
  const response = await axios.post<AuthApi.OriginalLoginResult>(
    `/api/v1/Account/LoginToken/${jmaccount}/${jmpwd}`,
    null,
    {
      headers: {
        'Content-Type': 'application/json',
        Account: encodeURIComponent(data.username?.trim() || ''),
        Token: '', // 登录时Token为空
        ClientType: 'PC',
        OrgId: orgId,
        OrgAuthCode: orgAuthCode,
        Department: empDepartment,
        Host: BACKEND_HOST, // 覆盖代理默认的 localhost Host 头
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
  const token = sessionStorage.getItem('hdToken') || '';
  const orgId = sessionStorage.getItem('hdOrgId') || '';
  const orgAuthCode = sessionStorage.getItem('hdOrgAuthCode') || '';
  const empDepartment = sessionStorage.getItem('hdEmpDepartment') || '';

  if (userName) {
    try {
      const jmaccount = aesEncrypt(userName);
      await axios.post(
        `/api/v1/Account/LogoutToken/${jmaccount}`,
        null,
        {
          headers: {
            Account: encodeURIComponent(userName),
            Token: token,
            ClientType: 'PC',
            OrgId: orgId,
            OrgAuthCode: orgAuthCode,
            Department: empDepartment,
            Host: BACKEND_HOST, // 覆盖代理默认的 localhost Host 头
          },
        },
      );
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
