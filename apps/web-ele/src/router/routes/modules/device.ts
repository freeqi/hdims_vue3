import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:settings',
      order: 4,
      title: $t('page.device.title'),
    },
    name: 'Device',
    path: '/device',
    children: [
      {
        name: 'DeviceMonitor',
        path: '/device/monitor',
        component: () => import('#/views/device/monitor/index.vue'),
        meta: {
          icon: 'lucide:activity',
          title: $t('page.device.monitor'),
        },
      },
      {
        name: 'DeviceList',
        path: '/device/list',
        component: () => import('#/views/device/list/index.vue'),
        meta: {
          icon: 'lucide:cpu',
          title: $t('page.device.list'),
        },
      },
      {
        name: 'QualityControl',
        path: '/device/quality',
        component: () => import('#/views/device/quality/index.vue'),
        meta: {
          icon: 'lucide:shield-check',
          title: $t('page.device.quality'),
        },
      },
      {
        name: 'ConsumableManage',
        path: '/device/consumable',
        component: () => import('#/views/device/consumable/index.vue'),
        meta: {
          icon: 'lucide:package',
          title: $t('page.device.consumable'),
        },
      },
    ],
  },
];

export default routes;
