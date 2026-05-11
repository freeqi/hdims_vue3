import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:settings-2',
      order: 6,
      title: $t('page.system.title'),
    },
    name: 'System',
    path: '/system',
    children: [
      {
        name: 'UserManage',
        path: '/system/user',
        component: () => import('#/views/system/user/index.vue'),
        meta: {
          icon: 'lucide:user-cog',
          title: $t('page.system.user'),
        },
      },
      {
        name: 'RoleManage',
        path: '/system/role',
        component: () => import('#/views/system/role/index.vue'),
        meta: {
          icon: 'lucide:user-check',
          title: $t('page.system.role'),
        },
      },
      {
        name: 'PermissionManage',
        path: '/system/permission',
        component: () => import('#/views/system/permission/index.vue'),
        meta: {
          icon: 'lucide:key',
          title: $t('page.system.permission'),
        },
      },
      {
        name: 'ParameterConfig',
        path: '/system/parameter',
        component: () => import('#/views/system/parameter/index.vue'),
        meta: {
          icon: 'lucide:sliders',
          title: $t('page.system.parameter'),
        },
      },
      {
        name: 'LogAudit',
        path: '/system/log',
        component: () => import('#/views/system/log/index.vue'),
        meta: {
          icon: 'lucide:scroll-text',
          title: $t('page.system.log'),
        },
      },
    ],
  },
];

export default routes;
