<template>
  <div class="doctor-layout">
    <!-- 左侧患者列表 -->
    <PatientList
      :suofang="suofang"
      @on-change="handleSfChange"
      @SendPatItem="onSendPatItem"
    />
    <!-- 右侧内容区 -->
    <div class="infor_cont" :class="{ on: suofang }">
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import PatientList from './patient-list.vue';

defineOptions({
  name: 'DialysisDoctor',
});

const props = defineProps<{
  isSj?: boolean;
  isXj?: boolean;
}>();

const emit = defineEmits<{
  (e: 'select', name: string): void;
  (e: 'SendPatItem', item: any): void;
}>();

const suofang = ref(false);

function handleSfChange(state: boolean) {
  suofang.value = state;
  localStorage.setItem('isSuo', String(state));
}

function onSendPatItem(item: any) {
  emit('SendPatItem', item);
}
</script>

<style scoped>
.doctor-layout {
  height: 100%;
  position: relative;
}

.infor_cont {
  height: 99.5%;
  position: absolute;
  right: 10px;
  left: 260px;
  top: 2px;
  bottom: 0;
  border-radius: 4px;
  overflow-y: auto;
}

.infor_cont.on {
  left: 130px;
}
</style>
