import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:file-text',
      order: 3,
      title: $t('page.medical.title'),
    },
    name: 'Medical',
    path: '/medical',
    children: [
      {
        name: 'MedicalRecord',
        path: '/medical/record',
        component: () => import('#/views/medical/record/index.vue'),
        meta: {
          icon: 'lucide:file-minus',
          title: $t('page.medical.record'),
        },
      },
      {
        name: 'NursingRecord',
        path: '/medical/nursing',
        component: () => import('#/views/medical/nursing/index.vue'),
        meta: {
          icon: 'lucide:heart-pulse',
          title: $t('page.medical.nursing'),
        },
      },
      {
        name: 'AssessmentForm',
        path: '/medical/assessment',
        component: () => import('#/views/medical/assessment/index.vue'),
        meta: {
          icon: 'lucide:clipboard-check',
          title: $t('page.medical.assessment'),
        },
      },
      {
        name: 'DoctorOrder',
        path: '/medical/order',
        component: () => import('#/views/medical/order/index.vue'),
        meta: {
          icon: 'lucide:stethoscope',
          title: $t('page.medical.order'),
        },
      },
    ],
  },
];

export default routes;
