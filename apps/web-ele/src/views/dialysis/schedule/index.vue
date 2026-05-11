<script lang="ts" setup>
import { ref } from 'vue';
import { Page } from '@vben/common-ui';
import { ElTabs, ElTabPane } from 'element-plus';
import CycleSchedulingTab from './tabs/cycle-scheduling-tab.vue';
import MonthSchedulingTab from './tabs/month-scheduling-tab.vue';
import BedSchedulingTab from './tabs/bed-scheduling-tab.vue';

const activeTab = ref('按周期');
</script>

<template>
  <Page title="患者排班">
    <ElTabs v-model="activeTab">
      <ElTabPane label="按周期" name="按周期">
        <CycleSchedulingTab />
      </ElTabPane>
      <ElTabPane label="按月份" name="按月份">
        <MonthSchedulingTab />
      </ElTabPane>
      <ElTabPane label="按床位" name="按床位">
        <BedSchedulingTab />
      </ElTabPane>
    </ElTabs>
  </Page>
</template>
