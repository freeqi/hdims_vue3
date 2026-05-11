import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:bar-chart',
      order: 5,
      title: $t('page.operation.title'),
    },
    name: 'Operation',
    path: '/operation',
    children: [
      {
        name: 'ScheduleManage',
        path: '/operation/schedule',
        component: () => import('#/views/operation/schedule/index.vue'),
        meta: {
          icon: 'lucide:calendar-days',
          title: $t('page.operation.schedule'),
        },
      },
      {
        name: 'StatisticsAnalysis',
        path: '/operation/statistics',
        component: () => import('#/views/operation/statistics/index.vue'),
        meta: {
          icon: 'lucide:pie-chart',
          title: $t('page.operation.statistics'),
        },
      },
      {
        name: 'ReportCenter',
        path: '/operation/report',
        component: () => import('#/views/operation/report/index.vue'),
        meta: {
          icon: 'lucide:file-bar-chart',
          title: $t('page.operation.report'),
        },
      },
    ],
  },
];

export default routes;
