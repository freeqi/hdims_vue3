import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:users',
      order: 1,
      title: $t('page.patient.title'),
    },
    name: 'Patient',
    path: '/patient',
    children: [
      {
        name: 'PatientList',
        path: '/patient/list',
        component: () => import('#/views/patient/list/index.vue'),
        meta: {
          icon: 'lucide:list',
          title: $t('page.patient.list'),
        },
      },
      {
        name: 'PatientDetail',
        path: '/patient/detail/:id',
        component: () => import('#/views/patient/detail/index.vue'),
        meta: {
          hideInMenu: true,
          title: $t('page.patient.detail'),
        },
      },
      {
        name: 'PatientEdit',
        path: '/patient/edit/:id?',
        component: () => import('#/views/patient/edit/index.vue'),
        meta: {
          hideInMenu: true,
          title: $t('page.patient.edit'),
        },
      },
      {
        name: 'PatientArchive',
        path: '/patient/archive',
        component: () => import('#/views/patient/archive/index.vue'),
        meta: {
          icon: 'lucide:archive',
          title: $t('page.patient.archive'),
        },
      },
    ],
  },
];

export default routes;
