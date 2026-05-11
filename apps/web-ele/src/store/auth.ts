import type { Recordable, UserInfo } from '@vben/types';

import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { LOGIN_PATH } from '@vben/constants';
import { preferences } from '@vben/preferences';
import { resetAllStores, useAccessStore, useUserStore } from '@vben/stores';

import { ElMessage, ElNotification } from 'element-plus';
import { defineStore } from 'pinia';

import { getAccessCodesApi, getUserInfoApi, loginApi, logoutApi } from '#/api';
import { $t } from '#/locales';

export const useAuthStore = defineStore('auth', () => {
  const accessStore = useAccessStore();
  const userStore = useUserStore();
  const router = useRouter();

  const loginLoading = ref(false);

  /**
   * 异步处理登录操作 - 对接原血透系统
   */
  async function authLogin(
    params: Recordable<any>,
    onSuccess?: () => Promise<void> | void,
  ) {
    let userInfo: null | UserInfo = null;
    try {
      loginLoading.value = true;

      // 调用原系统登录接口
      const loginResult: any = await loginApi(params);
      const { accessToken, userData } = loginResult;

      if (accessToken) {
        // 存储Token到Vben的accessStore（用于路由守卫判断）
        accessStore.setAccessToken(accessToken);

        // 将原系统用户数据存入sessionStorage（兼容原系统请求头）
        sessionStorage.setItem('hdToken', userData.Token || accessToken);
        sessionStorage.setItem('hdUserName', userData.account || params.username || '');
        sessionStorage.setItem('hdEmployeeId', userData.employeeId || '');
        sessionStorage.setItem('hdNickName', userData.name || params.username || '');

        // 存储完整用户信息
        sessionStorage.setItem('hdUserInfo', JSON.stringify({
          userId: '1',
          username: userData.account || params.username || '',
          realName: userData.name || params.username || '',
          avatar: '',
          desc: '血透系统管理员',
          homePath: '/patient/list',
          roles: ['admin'],
        }));

        // 存储菜单和权限（原系统格式）
        if (userData.Menu) {
          sessionStorage.setItem('hdMenu', JSON.stringify(userData.Menu));
        }
        if (userData.Perm) {
          sessionStorage.setItem('hdPerm', JSON.stringify(userData.Perm));
        }

        // 获取用户信息
        const fetchUserInfoResult = await getUserInfoApi();
        userInfo = fetchUserInfoResult;
        userStore.setUserInfo(userInfo);

        // 获取权限码（返回通配符，允许访问所有路由）
        const accessCodes = await getAccessCodesApi();
        accessStore.setAccessCodes(accessCodes);

        if (accessStore.loginExpired) {
          accessStore.setLoginExpired(false);
        } else {
          onSuccess
            ? await onSuccess?.()
            : await router.push(
                userInfo.homePath || preferences.app.defaultHomePath,
              );
        }

        if (userInfo?.realName) {
          ElNotification({
            message: `${$t('authentication.loginSuccessDesc')}:${userInfo?.realName}`,
            title: $t('authentication.loginSuccess'),
            type: 'success',
          });
        }
      }
    } catch (error: any) {
      ElMessage.error(error?.message || '登录失败，请检查用户名和密码');
    } finally {
      loginLoading.value = false;
    }

    return {
      userInfo,
    };
  }

  async function logout(redirect: boolean = true) {
    try {
      await logoutApi();
    } catch {
      // 不做任何处理
    }

    // 清除sessionStorage中的原系统数据
    sessionStorage.removeItem('hdToken');
    sessionStorage.removeItem('hdUserName');
    sessionStorage.removeItem('hdEmployeeId');
    sessionStorage.removeItem('hdNickName');
    sessionStorage.removeItem('hdUserInfo');
    sessionStorage.removeItem('hdMenu');
    sessionStorage.removeItem('hdPerm');

    resetAllStores();
    accessStore.setLoginExpired(false);

    await router.replace({
      path: LOGIN_PATH,
      query: redirect
        ? {
            redirect: encodeURIComponent(router.currentRoute.value.fullPath),
          }
        : {},
    });
  }

  async function fetchUserInfo() {
    const userInfo = await getUserInfoApi();
    userStore.setUserInfo(userInfo);
    return userInfo;
  }

  function $reset() {
    loginLoading.value = false;
  }

  return {
    $reset,
    authLogin,
    fetchUserInfo,
    loginLoading,
    logout,
  };
});
