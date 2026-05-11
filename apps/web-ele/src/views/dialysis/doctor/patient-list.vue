<script lang="ts" setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import {
  ElButton,
  ElInput,
  ElSelect,
  ElOption,
  ElDatePicker,
  ElCascader,
  ElIcon,
  ElTooltip,
  ElScrollbar,
  ElEmpty,
  ElDivider,
} from 'element-plus';
import { Search, ArrowLeft, ArrowRight, User, Female } from '@element-plus/icons-vue';
import swsApi from '#/api/sws';

// ==================== 类型定义 ====================

/** 患者列表项 - 使用原系统字段名 */
interface PatientItem {
  PatientId: string;
  PatientName: string;
  Sex: string;
  Age: number;
  PatientNo?: string;
  PatientFileNo: string;
  SickbedNo: string;
  TreatmentRegion: string;
  DialysisId: string;
  DialysisType: string;
  Dialyzer: string;
  DialysisPerfusion: string;
  CurrentState: number;
  RecordIsItDone: boolean | number;
  PreIsItDone?: boolean | number;
  LeftTime: string;
  ConfirmsCheckNurse?: string;
  ConfirmsCheckDoctor?: string;
  ActualShift: string;
  DialysisProjectPriceCheckDate?: string;
  Birthday?: string;
  Name?: string;
  BloodBorneDisease?: string;
  TreatmentRegionId?: string;
  PatientCycleSchedulingId?: string;
  Id?: string;
  Date?: string;
  SignId?: string;
  LoginTime?: string;
  TreatHour?: number;
  TreatMin?: number;
  DefineColor?: string;
  IsFocus?: boolean;
}

/** 分区选项 */
interface RegionOption {
  Id: string;
  Name: string;
}

/** 班次选项 */
interface ShiftOption {
  ShiftName: string;
}

/** 书写检查/治疗质控选项 */
interface CheckOption {
  value: string;
  label: string;
  children?: CheckOption[];
}

/** 排序选项 */
interface SortOption {
  label: string;
  value: string;
  sortField: string;
}

// ==================== 常量 ====================

/** 排序配置 */
const SORT_OPTIONS: SortOption[] = [
  { label: '床位号', value: 'SickbedNo', sortField: 'SickbedNo' },
  { label: '病历夹', value: 'PatientFileNo', sortField: 'PatientFileNo' },
  { label: '年龄', value: 'Birthday', sortField: 'Birthday' },
  { label: '姓名', value: 'Name', sortField: 'Name' },
];

/** 书写检查级联选项 */
const CHECK_OPTIONS: CheckOption[] = [
  {
    value: '书写检查',
    label: '书写检查',
    children: [
      { value: '未完成', label: '未完成' },
      { value: '已完成', label: '已完成' },
    ],
  },
  {
    value: '治疗质控',
    label: '治疗质控',
    children: [
      { value: '未完成', label: '未完成' },
      { value: '已完成', label: '已完成' },
    ],
  },
];

// ==================== Emits ====================

const emit = defineEmits<{
  (e: 'SendPatItem', item: PatientItem): void;
}>();

// ==================== 状态 ====================

// 面板折叠
const panelCollapsed = ref(false);

// 日期选择
const selectDay = ref<Date>(new Date());

// 搜索
const searchVal = ref('');

// 分区筛选
const FqVal = ref('全部');
const SbFqVal = ref('全部');
const FqArr = ref<RegionOption[]>([]);
const SbFqArr = ref<RegionOption[]>([]);

// 班次筛选
const ShiftVal = ref('全部');
const bcData = ref<ShiftOption[]>([]);

// 书写检查/治疗质控筛选
const value1 = ref<string[]>([]);

// 排序
const spanList = ref('SickbedNo');

// 患者列表
const patList = ref<PatientItem[]>([]);
const loading = ref(false);

// 选中的患者
const selectedPatId = ref<string>('');

// 自动刷新
let refreshTimer: ReturnType<typeof setInterval> | null = null;

// 滚动容器引用
const listContainerRef = ref<HTMLElement | null>(null);

// ==================== 计算属性 ====================

/** 当前选中患者信息 */
const currentPatient = computed<PatientItem | null>(() => {
  if (!selectedPatId.value) return null;
  return patList.value.find((p) => p.PatientId === selectedPatId.value) || null;
});

/** 搜索过滤后的列表 */
const filteredList = computed(() => {
  let list = [...patList.value];

  // 搜索过滤 - 支持按PatientNo/Sex/PatientName/Age搜索
  if (searchVal.value.trim()) {
    const keyword = searchVal.value.trim().toLowerCase();
    list = list.filter((item) => {
      const patientNo = (item.PatientNo || '').toLowerCase();
      const sex = (item.Sex || '').toLowerCase();
      const name = (item.PatientName || '').toLowerCase();
      const age = String(item.Age || '');
      return (
        patientNo.includes(keyword) ||
        sex.includes(keyword) ||
        name.includes(keyword) ||
        age.includes(keyword)
      );
    });
  }

  // 排序
  const sortField = spanList.value;
  list.sort((a, b) => {
    const valA = (a as any)[sortField] || '';
    const valB = (b as any)[sortField] || '';
    if (typeof valA === 'number' && typeof valB === 'number') {
      return valA - valB;
    }
    return String(valA).localeCompare(String(valB), 'zh-CN');
  });

  return list;
});

// ==================== API 调用 ====================

/** 格式化日期为 yyyy-MM-dd */
function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** 获取患者列表 - HistoryDialysisRecords/4004 */
async function loadPatList() {
  loading.value = true;
  try {
    const params: Record<string, any> = {
      Date: formatDate(selectDay.value),
    };

    // 分区筛选
    if (FqVal.value && FqVal.value !== '全部') {
      params.TreatmentRegion = FqVal.value;
    }
    if (SbFqVal.value && SbFqVal.value !== '全部') {
      params.TreatmentRegionDetail = SbFqVal.value;
    }

    // 班次筛选
    if (ShiftVal.value && ShiftVal.value !== '全部') {
      params.Shift = ShiftVal.value;
    }

    // 排序
    const sortOption = SORT_OPTIONS.find((s) => s.value === spanList.value);
    if (sortOption) {
      params.OrderType = SORT_OPTIONS.indexOf(sortOption) + 1;
    }

    const res = await swsApi.swsGet('HistoryDialysisRecords/4004', params);
    if (res.Code === 200) {
      patList.value = (res.Data || []) as PatientItem[];
    }
  } catch (error) {
    console.error('获取患者列表失败:', error);
    patList.value = [];
  } finally {
    loading.value = false;
  }
}

/** 获取分区字典 - SystemDictionary/4006 */
async function loadRegions() {
  try {
    const typeIds = [
      { typeId: 'bd1716eacc88465588324b680fcf7570' }, // 分区
      { typeId: '9364d9b7b019426a96c61822adcecdeb' }, // 子分区
    ];
    const res = await swsApi.swsGet('SystemDictionary/4006', {
      data: JSON.stringify(typeIds),
    });
    if (res.Code === 200) {
      const data = res.Data as any[];
      FqArr.value = data[0]?.SystemDictionaryList || [];
      SbFqArr.value = data[1]?.SystemDictionaryList || [];
    }
  } catch (error) {
    console.error('获取分区字典失败:', error);
  }
}

/** 获取班次设置 - PatientShiftSet/4002 */
async function loadShifts() {
  try {
    const res = await swsApi.swsGet('PatientShiftSet/4002', {
      Date: formatDate(selectDay.value),
    });
    if (res.Code === 200) {
      bcData.value = (res.Data || []) as ShiftOption[];
    }
  } catch (error) {
    console.error('获取班次设置失败:', error);
  }
}

/** 加载所有基础数据 */
async function loadBaseData() {
  await Promise.all([loadRegions(), loadShifts()]);
}

// ==================== 事件处理 ====================

/** 日期变更 */
function onDateChange() {
  loadShifts();
  loadPatList();
}

/** 分区变更 */
function onFqChange() {
  loadPatList();
}

/** 班次变更 */
function onShiftChange() {
  loadPatList();
}

/** 排序变更 */
function onSortChange() {
  // 排序为本地操作，无需重新请求
}

/** 书写检查/治疗质控筛选变更 */
function onCheckChange(val: string[]) {
  // 本地过滤或重新请求
  loadPatList();
}

/** 选中患者 */
function selectPatient(item: PatientItem) {
  selectedPatId.value = item.PatientId;
  emit('SendPatItem', item);
}

/** 切换面板折叠 */
function togglePanel() {
  panelCollapsed.value = !panelCollapsed.value;
}

/** 搜索 */
function onSearch() {
  // 搜索为本地操作
}

/** 清空搜索 */
function clearSearch() {
  searchVal.value = '';
}

/** 启动自动刷新（30秒） */
function startAutoRefresh() {
  stopAutoRefresh();
  refreshTimer = setInterval(() => {
    loadPatList();
  }, 30 * 1000);
}

/** 停止自动刷新 */
function stopAutoRefresh() {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
}

/** 获取性别图标 */
function getSexIcon(sex: string) {
  if (sex === '女' || sex === 'F' || sex === 'f') {
    return Female;
  }
  return User;
}

/** 获取性别颜色 */
function getSexColor(sex: string): string {
  if (sex === '女' || sex === 'F' || sex === 'f') {
    return '#f56c6c';
  }
  return '#409eff';
}

/** 获取 RecordIsItDone 状态文本 */
function getRecordStatusText(done: boolean | number): string {
  if (done === true || done === 1) return '已完成';
  return '未完成';
}

/** 获取 RecordIsItDone 状态颜色 */
function getRecordStatusColor(done: boolean | number): string {
  if (done === true || done === 1) return '#67c23a';
  return '#909399';
}

/** 获取 RecordIsItDone 状态图标 */
function getRecordStatusIcon(done: boolean | number): string {
  if (done === true || done === 1) return '&#10004;';
  return '&#10060;';
}

/** 获取透析模式显示文本 */
function getDialysisModeText(item: PatientItem): string {
  return item.DialysisType || '';
}

/** 获取患者显示信息 */
function getPatientInfoText(item: PatientItem): string {
  const parts: string[] = [];
  if (item.DialysisType) parts.push(item.DialysisType);
  if (item.Dialyzer) parts.push(item.Dialyzer);
  if (item.DialysisPerfusion) parts.push(item.DialysisPerfusion);
  return parts.join(' / ');
}

// ==================== 生命周期 ====================

onMounted(() => {
  loadBaseData();
  loadPatList();
  startAutoRefresh();
});

onUnmounted(() => {
  stopAutoRefresh();
});
</script>

<template>
  <div class="patient-list-container">
    <!-- 左侧患者列表面板 -->
    <div
      class="patient-panel"
      :class="{ 'is-collapsed': panelCollapsed }"
    >
      <!-- 面板头部 -->
      <div class="panel-header">
        <span v-if="!panelCollapsed" class="panel-title">患者列表</span>
        <ElButton
          :icon="panelCollapsed ? ArrowRight : ArrowLeft"
          size="small"
          circle
          class="toggle-btn"
          @click="togglePanel"
        />
      </div>

      <template v-if="!panelCollapsed">
        <!-- 当前选中患者信息 -->
        <div v-if="currentPatient" class="current-patient-info">
          <div class="current-patient-name">
            {{ currentPatient.PatientName }}
          </div>
          <div class="current-patient-detail">
            <span>{{ currentPatient.Sex }}</span>
            <span class="divider">|</span>
            <span>{{ currentPatient.Age }}岁</span>
          </div>
          <div class="current-patient-dialysis">
            {{ getPatientInfoText(currentPatient) }}
          </div>
        </div>
        <ElDivider v-if="currentPatient" style="margin: 8px 0" />

        <!-- 筛选区域 -->
        <div class="filter-area">
          <!-- 日期选择器 -->
          <div class="filter-row">
            <ElDatePicker
              v-model="selectDay"
              type="date"
              placeholder="选择日期"
              size="small"
              style="width: 100%"
              value-format="YYYY-MM-DD"
              @change="onDateChange"
            />
          </div>

          <!-- 搜索框 -->
          <div class="filter-row">
            <ElInput
              v-model="searchVal"
              placeholder="搜索: 编号/性别/姓名/年龄"
              size="small"
              clearable
              :prefix-icon="Search"
              @input="onSearch"
              @clear="clearSearch"
            />
          </div>

          <!-- 分区筛选 -->
          <div class="filter-row">
            <ElSelect
              v-model="FqVal"
              placeholder="分区"
              size="small"
              clearable
              style="width: 100%"
              @change="onFqChange"
            >
              <ElOption label="全部" value="全部" />
              <ElOption
                v-for="item in FqArr"
                :key="item.Id"
                :label="item.Name"
                :value="item.Name"
              />
            </ElSelect>
          </div>

          <!-- 子分区筛选 -->
          <div v-if="SbFqArr.length > 0" class="filter-row">
            <ElSelect
              v-model="SbFqVal"
              placeholder="子分区"
              size="small"
              clearable
              style="width: 100%"
              @change="onFqChange"
            >
              <ElOption label="全部" value="全部" />
              <ElOption
                v-for="item in SbFqArr"
                :key="item.Id"
                :label="item.Name"
                :value="item.Name"
              />
            </ElSelect>
          </div>

          <!-- 班次筛选 -->
          <div class="filter-row">
            <ElSelect
              v-model="ShiftVal"
              placeholder="班次"
              size="small"
              clearable
              style="width: 100%"
              @change="onShiftChange"
            >
              <ElOption label="全部" value="全部" />
              <ElOption
                v-for="(item, index) in bcData"
                :key="index"
                :label="item.ShiftName"
                :value="item.ShiftName"
              />
            </ElSelect>
          </div>

          <!-- 书写检查/治疗质控筛选 -->
          <div class="filter-row">
            <ElCascader
              v-model="value1"
              :options="CHECK_OPTIONS"
              placeholder="书写检查/治疗质控"
              size="small"
              clearable
              style="width: 100%"
              @change="onCheckChange"
            />
          </div>

          <!-- 排序 -->
          <div class="filter-row">
            <ElSelect
              v-model="spanList"
              placeholder="排序方式"
              size="small"
              style="width: 100%"
              @change="onSortChange"
            >
              <ElOption
                v-for="item in SORT_OPTIONS"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </ElSelect>
          </div>
        </div>

        <ElDivider style="margin: 8px 0" />

        <!-- 患者列表 -->
        <div ref="listContainerRef" class="patient-list-scroll" v-loading="loading">
          <ElScrollbar v-if="filteredList.length > 0">
            <div class="patient-list">
              <div
                v-for="item in filteredList"
                :key="item.PatientId"
                class="patient-item"
                :class="{ 'is-selected': selectedPatId === item.PatientId }"
                @click="selectPatient(item)"
              >
                <!-- 床位号和分区 -->
                <div class="item-bed">
                  <span class="bed-no">{{ item.TreatmentRegion }}({{ item.SickbedNo }})</span>
                </div>

                <!-- 患者信息行 -->
                <div class="item-info">
                  <!-- 病历夹号 -->
                  <span class="file-no">{{ item.PatientFileNo }}</span>
                  <!-- 年龄 -->
                  <span class="age">{{ item.Age }}岁</span>
                  <!-- 性别图标 -->
                  <ElIcon
                    class="sex-icon"
                    :style="{ color: getSexColor(item.Sex) }"
                  >
                    <component :is="getSexIcon(item.Sex)" />
                  </ElIcon>
                </div>

                <!-- 姓名行 -->
                <div class="item-name-row">
                  <span
                    class="patient-name"
                    :style="{
                      background: item.DefineColor || 'transparent',
                      padding: item.DefineColor || item.IsFocus ? '0 4px' : '0',
                      borderRadius: item.DefineColor || item.IsFocus ? '2px' : '0',
                    }"
                  >
                    {{ item.PatientName }}
                  </span>
                  <!-- RecordIsItDone图标 -->
                  <ElTooltip
                    :content="getRecordStatusText(item.RecordIsItDone)"
                    placement="top"
                  >
                    <span
                      class="record-status"
                      :style="{ color: getRecordStatusColor(item.RecordIsItDone) }"
                      v-html="getRecordStatusIcon(item.RecordIsItDone)"
                    />
                  </ElTooltip>
                </div>

                <!-- 透析模式 -->
                <div v-if="item.DialysisType" class="item-dialysis-mode">
                  {{ item.DialysisType }}
                </div>
              </div>
            </div>
          </ElScrollbar>
          <ElEmpty
            v-else
            description="暂无患者数据"
            :image-size="60"
          />
        </div>
      </template>
    </div>

    <!-- 右侧内容区域（通过插槽） -->
    <div class="patient-content">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.patient-list-container {
  display: flex;
  height: 100%;
  width: 100%;
  overflow: hidden;
}

/* ==================== 左侧面板 ==================== */

.patient-panel {
  width: 260px;
  min-width: 260px;
  height: 100%;
  background: #fff;
  border-right: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease, min-width 0.3s ease;
  overflow: hidden;
}

.patient-panel.is-collapsed {
  width: 40px;
  min-width: 40px;
}

/* 面板头部 */
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  border-bottom: 1px solid #e4e7ed;
  background: #f5f7fa;
  flex-shrink: 0;
}

.panel-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  white-space: nowrap;
}

.toggle-btn {
  flex-shrink: 0;
}

/* ==================== 当前选中患者信息 ==================== */

.current-patient-info {
  padding: 8px 10px;
  background: #ecf5ff;
  border-radius: 4px;
  margin: 8px 10px 0;
}

.current-patient-name {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.current-patient-detail {
  font-size: 12px;
  color: #606266;
  margin-bottom: 2px;
}

.current-patient-detail .divider {
  margin: 0 6px;
  color: #dcdfe6;
}

.current-patient-dialysis {
  font-size: 11px;
  color: #909399;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ==================== 筛选区域 ==================== */

.filter-area {
  padding: 0 10px;
  flex-shrink: 0;
}

.filter-row {
  margin-bottom: 6px;
}

/* ==================== 患者列表 ==================== */

.patient-list-scroll {
  flex: 1;
  overflow: hidden;
  min-height: 0;
}

.patient-list {
  padding: 0 6px;
}

.patient-item {
  padding: 8px 10px;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  margin-bottom: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #fff;
}

.patient-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.15);
}

.patient-item.is-selected {
  border-color: #409eff;
  background: #ecf5ff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
}

/* 床位号 */
.item-bed {
  margin-bottom: 4px;
}

.bed-no {
  font-size: 12px;
  color: #ff0000;
  font-weight: 600;
}

/* 患者信息行 */
.item-info {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 2px;
}

.file-no {
  font-size: 11px;
  color: #909399;
}

.age {
  font-size: 11px;
  color: #606266;
}

.sex-icon {
  font-size: 14px;
}

/* 姓名行 */
.item-name-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.patient-name {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  cursor: pointer;
}

.record-status {
  font-size: 14px;
  flex-shrink: 0;
  cursor: pointer;
}

/* 透析模式 */
.item-dialysis-mode {
  font-size: 11px;
  color: #909399;
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ==================== 右侧内容区域 ==================== */

.patient-content {
  flex: 1;
  min-width: 0;
  height: 100%;
  overflow: auto;
}
</style>
