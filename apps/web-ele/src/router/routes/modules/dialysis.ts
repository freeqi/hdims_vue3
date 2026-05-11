import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:activity',
      order: 2,
      title: $t('page.dialysis.title'),
    },
    name: 'Dialysis',
    path: '/dialysis',
    children: [
      {
        name: 'DialysisRecord',
        path: '/dialysis/record',
        component: () => import('#/views/dialysis/record/index.vue'),
        meta: {
          icon: 'lucide:clipboard-list',
          title: $t('page.dialysis.record'),
        },
      },
      {
        name: 'DialysisRecordEdit',
        path: '/dialysis/record/edit/:id?',
        component: () => import('#/views/dialysis/record/edit.vue'),
        meta: {
          hideInMenu: true,
          title: $t('page.dialysis.recordEdit'),
        },
      },
      {
        name: 'DialysisSchedule',
        path: '/dialysis/schedule',
        component: () => import('#/views/dialysis/schedule/index.vue'),
        meta: {
          icon: 'lucide:calendar',
          title: $t('page.dialysis.schedule'),
        },
      },
      {
        name: 'DialysisMonitoring',
        path: '/dialysis/monitoring',
        component: () => import('#/views/dialysis/monitoring/index.vue'),
        meta: {
          icon: 'lucide:monitor',
          title: $t('page.dialysis.monitoring'),
        },
      },
      {
        name: 'DialysisBed',
        path: '/dialysis/bed',
        component: () => import('#/views/dialysis/bed/index.vue'),
        meta: {
          icon: 'lucide:bed',
          title: $t('page.dialysis.bed'),
        },
      },
      {
        name: 'DialysisOrders',
        path: '/dialysis/orders',
        component: () => import('#/views/dialysis/monitoring/orders.vue'),
        meta: {
          icon: 'lucide:file-text',
          title: $t('page.dialysis.orders'),
        },
      },
      {
        name: 'DialysisDoctor',
        path: '/dialysis/doctor',
        component: () => import('#/views/dialysis/doctor/index.vue'),
        meta: {
          icon: 'lucide:stethoscope',
          title: $t('page.dialysis.doctor'),
        },
      },
      {
        name: 'DialysisDoctorConfirmPlan',
        path: '/dialysis/doctor/confirm-plan',
        component: () => import('#/views/dialysis/doctor/confirm-plan.vue'),
        meta: {
          hideInMenu: true,
          title: $t('page.dialysis.confirmPlan'),
        },
      },
      {
        name: 'DialysisDoctorDialysisMode',
        path: '/dialysis/doctor/dialysis-mode',
        component: () => import('#/views/dialysis/doctor/dialysis-mode.vue'),
        meta: {
          hideInMenu: true,
          title: $t('page.dialysis.dialysisMode'),
        },
      },
      {
        name: 'DialysisDoctorCheckItem',
        path: '/dialysis/doctor/check-item',
        component: () => import('#/views/dialysis/doctor/check-item.vue'),
        meta: {
          hideInMenu: true,
          title: $t('page.dialysis.checkItem'),
        },
      },
    ],
  },
];

export default routes;
