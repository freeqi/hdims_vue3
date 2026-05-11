<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue';
import {
  ElSelect,
  ElDatePicker,
  ElInput,
  ElButton,
  ElTag,
  ElMessage,
} from 'element-plus';

// ==================== 类型定义 ====================

interface BedPatient {
  patientName: string;
  patientId: string;
  gender: string;
  age: number;
  bloodInfectious: string; // 血源性传染病标记
  vascularAccess: string;
  treatmentMode: string;
  dialyzer: string;
  anticoagulant: string;
  status: string;
}

interface BedCard {
  bedNo: string;
  treatmentArea: string;
  deviceSerial: string;
  supportedModes: string[];
  patient: BedPatient | null;
}

// ==================== 常量 ====================

const SHIFT_OPTIONS = [
  { label: '上午', value: '上午' },
  { label: '下午', value: '下午' },
  { label: '晚上', value: '晚上' },
];

const AREA_OPTIONS = [
  { label: '一区', value: '一区' },
  { label: '二区', value: '二区' },
  { label: '三区', value: '三区' },
  { label: '四区', value: '四区' },
];

/** 治疗模式对应的背景色 */
const MODE_COLOR_MAP: Record<string, string> = {
  HDF: '#fff3e0',
  'HD+HP': '#fce4ec',
  HD: '#e8f5e9',
  CRRT: '#e3f2fd',
  HF: '#f3e5f5',
};

/** 治疗模式对应的边框色 */
const MODE_BORDER_MAP: Record<string, string> = {
  HDF: '#ff9800',
  'HD+HP': '#e91e63',
  HD: '#4caf50',
  CRRT: '#2196f3',
  HF: '#9c27b0',
};

// ==================== 状态 ====================

const loading = ref(false);
const bedCards = ref<BedCard[]>([]);

// 搜索条件
const searchDate = ref(new Date());
const searchShift = ref('');
const searchAreas = ref<string[]>([]);
const searchKeyword = ref('');

// ==================== API 配置 ====================

function getHeaders() {
  return {
    Account: '',
    Token: '',
    ClientType: 'Web',
    OrgId: '',
    OrgAuthCode: '',
    Department: '',
  };
}

// ==================== API 调用（已注释，使用mock数据） ====================

// import axios from 'axios';

// /** 获取床位排班数据 */
// async function fetchBedScheduleList() {
//   loading.value = true;
//   try {
//     const params = {
//       Date: formatDate(searchDate.value),
//       Shift: searchShift.value,
//       TreatmentRegion: searchAreas.value.join(','),
//     };
//     const res = await axios.get('/api/v1/SchedulingManage/4017', {
//       params,
//       headers: getHeaders(),
//     });
//     if (res.data?.Code === 0) {
//       bedCards.value = res.data.Data ?? [];
//     }
//   } catch (error) {
//     ElMessage.error('获取床位排班数据失败');
//   } finally {
//     loading.value = false;
//   }
// }

// ==================== Mock 数据 ====================

function generateMockBedData(): BedCard[] {
  const areas = ['一区', '二区', '三区', '四区'];
  const supportedModesList = [
    ['HD', 'HDF'],
    ['HD', 'HD+HP'],
    ['HD', 'HDF', 'HF'],
    ['HD', 'CRRT'],
    ['HD', 'HDF', 'HD+HP'],
  ];
  const names = [
    '张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十',
    '郑十一', '冯十二', '陈小明', '林小红', '黄大伟', '杨秀英', '刘建国',
    '吕芳华', '朱志强', '许丽娟', '何国栋', '施美玲',
  ];
  const modes = ['HD', 'HDF', 'HD+HP', 'CRRT', 'HF'];
  const dialyzers = ['FX80', 'FX100', 'F60S', 'F80S'];
  const anticoagulants = ['普通肝素', '低分子肝素', '无肝素', '局部枸橼酸'];
  const accesses = ['动静脉内瘘', '中心静脉导管', '人造血管', '直接穿刺'];
  const infectiousFlags = ['', '乙肝', '丙肝', 'HIV', '梅毒'];

  const cards: BedCard[] = [];

  // 生成20张床位，其中约75%有患者
  for (let i = 0; i < 20; i++) {
    const areaIdx = Math.floor(i / 5);
    const hasPatient = i < 15; // 前15个床位有患者

    cards.push({
      bedNo: `${i + 1}号床`,
      treatmentArea: areas[areaIdx],
      deviceSerial: `DEV-2024-${String(i + 1).padStart(3, '0')}`,
      supportedModes: supportedModesList[i % 5],
      patient: hasPatient
        ? {
            patientName: names[i],
            patientId: `P${String(10001 + i)}`,
            gender: i % 3 === 0 ? '女' : '男',
            age: 30 + (i % 40),
            bloodInfectious: infectiousFlags[i % 5],
            vascularAccess: accesses[i % 4],
            treatmentMode: modes[i % 5],
            dialyzer: dialyzers[i % 4],
            anticoagulant: anticoagulants[i % 4],
            status: i % 5 === 0 ? '透析中' : i % 5 === 1 ? '已签到' : '已排',
          }
        : null,
    });
  }

  return cards;
}

// ==================== 工具函数 ====================

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** 获取卡片背景色 */
function getCardBgColor(card: BedCard): string {
  if (!card.patient) return '#ffffff';
  return MODE_COLOR_MAP[card.patient.treatmentMode] || '#ffffff';
}

/** 获取卡片边框色 */
function getCardBorderColor(card: BedCard): string {
  if (!card.patient) return '#dcdfe6';
  return MODE_BORDER_MAP[card.patient.treatmentMode] || '#dcdfe6';
}

/** 获取传染病标记颜色 */
function getInfectiousTagType(flag: string): '' | 'success' | 'warning' | 'danger' | 'info' {
  const map: Record<string, '' | 'success' | 'warning' | 'danger' | 'info'> = {
    '': 'info',
    乙肝: 'danger',
    丙肝: 'warning',
    HIV: 'danger',
    梅毒: 'warning',
  };
  return map[flag] || 'info';
}

/** 获取状态颜色 */
function getStatusType(status: string): string {
  const map: Record<string, string> = {
    已排: 'info',
    已签到: 'primary',
    透析中: 'success',
    已完成: '',
  };
  return map[status] || 'info';
}

// ==================== 计算属性 ====================

/** 筛选后的床位卡片 */
const filteredBedCards = computed(() => {
  let data = bedCards.value;

  // 按分区筛选
  if (searchAreas.value.length > 0) {
    data = data.filter((card) => searchAreas.value.includes(card.treatmentArea));
  }

  // 按关键词搜索
  if (searchKeyword.value) {
    const kw = searchKeyword.value.toLowerCase();
    data = data.filter((card) => {
      if (card.bedNo.toLowerCase().includes(kw)) return true;
      if (card.deviceSerial.toLowerCase().includes(kw)) return true;
      if (card.patient) {
        return (
          card.patient.patientName.toLowerCase().includes(kw) ||
          card.patient.patientId.toLowerCase().includes(kw)
        );
      }
      return false;
    });
  }

  return data;
});

// ==================== 业务逻辑 ====================

/** 获取床位排班数据（使用mock数据） */
function fetchBedScheduleList() {
  loading.value = true;
  setTimeout(() => {
    bedCards.value = generateMockBedData();
    loading.value = false;
  }, 300);
}

/** 搜索 */
function handleSearch() {
  // 计算属性自动响应
}

/** 重置搜索 */
function handleReset() {
  searchDate.value = new Date();
  searchShift.value = '';
  searchAreas.value = [];
  searchKeyword.value = '';
}

/** 添加患者到床位 */
function handleAddPatient(bed: BedCard) {
  ElMessage.info(`为 ${bed.bedNo} 添加患者（功能开发中）`);
}

/** 跳转患者详情 */
function goToPatientDetail(patientId: string) {
  ElMessage.info(`跳转患者详情: ${patientId}`);
}

// ==================== 生命周期 ====================

onMounted(() => {
  fetchBedScheduleList();
});
</script>

<template>
  <div class="bed-scheduling-tab">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <ElDatePicker
          v-model="searchDate"
          type="date"
          placeholder="选择日期"
          value-format="YYYY-MM-DD"
          style="width: 180px"
        />
        <ElSelect
          v-model="searchShift"
          placeholder="班次"
          clearable
          style="width: 120px"
        >
          <ElOption
            v-for="item in SHIFT_OPTIONS"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </ElSelect>
        <ElSelect
          v-model="searchAreas"
          placeholder="治疗区域"
          clearable
          multiple
          collapse-tags
          collapse-tags-tooltip
          style="width: 200px"
        >
          <ElOption
            v-for="item in AREA_OPTIONS"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </ElSelect>
        <ElInput
          v-model="searchKeyword"
          placeholder="搜索床号/设备号/患者"
          clearable
          style="width: 220px"
          @keyup.enter="handleSearch"
          @clear="handleSearch"
        />
        <ElButton type="primary" @click="handleSearch">查询</ElButton>
        <ElButton @click="handleReset">重置</ElButton>
      </div>
    </div>

    <!-- 图例 -->
    <div class="legend">
      <span class="legend-title">治疗模式：</span>
      <span
        v-for="(color, mode) in MODE_COLOR_MAP"
        :key="mode"
        class="legend-item"
      >
        <span
          class="legend-color"
          :style="{ backgroundColor: color, borderColor: MODE_BORDER_MAP[mode] }"
        />
        {{ mode }}
      </span>
      <span class="legend-item legend-border-solid">
        <span class="legend-line solid-line" /> 已占用
      </span>
      <span class="legend-item legend-border-dashed">
        <span class="legend-line dashed-line" /> 空闲
      </span>
    </div>

    <!-- 床位卡片网格 -->
    <div v-loading="loading" class="bed-grid">
      <div
        v-for="card in filteredBedCards"
        :key="card.bedNo"
        class="bed-card"
        :class="{ 'bed-card--empty': !card.patient }"
        :style="{
          backgroundColor: getCardBgColor(card),
          borderColor: getCardBorderColor(card),
        }"
      >
        <!-- 床位头部信息 -->
        <div class="bed-card__header">
          <span class="bed-card__no">{{ card.bedNo }}</span>
          <ElTag size="small" type="info">{{ card.treatmentArea }}</ElTag>
        </div>

        <!-- 设备信息 -->
        <div class="bed-card__device">
          <span class="device-label">设备：</span>
          <span class="device-serial">{{ card.deviceSerial }}</span>
        </div>

        <!-- 支持的治疗模式 -->
        <div class="bed-card__modes">
          <span
            v-for="mode in card.supportedModes"
            :key="mode"
            class="mode-tag"
            :style="{
              backgroundColor: MODE_BORDER_MAP[mode] + '20',
              color: MODE_BORDER_MAP[mode],
              borderColor: MODE_BORDER_MAP[mode] + '40',
            }"
          >
            {{ mode }}
          </span>
        </div>

        <!-- 分隔线 -->
        <div class="bed-card__divider" />

        <!-- 有患者时显示患者信息 -->
        <template v-if="card.patient">
          <div class="bed-card__patient">
            <div class="patient-name-row">
              <el-link
                type="primary"
                :underline="false"
                @click="goToPatientDetail(card.patient!.patientId)"
              >
                {{ card.patient.patientName }}
              </el-link>
              <ElTag
                v-if="card.patient.bloodInfectious"
                :type="getInfectiousTagType(card.patient.bloodInfectious)"
                size="small"
                effect="dark"
                class="infectious-tag"
              >
                {{ card.patient.bloodInfectious }}
              </ElTag>
              <ElTag
                :type="getStatusType(card.patient.status)"
                size="small"
              >
                {{ card.patient.status }}
              </ElTag>
            </div>
            <div class="patient-info-grid">
              <div class="info-item">
                <span class="info-label">性别：</span>
                <span>{{ card.patient.gender }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">年龄：</span>
                <span>{{ card.patient.age }}岁</span>
              </div>
              <div class="info-item">
                <span class="info-label">编号：</span>
                <span>{{ card.patient.patientId }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">通路：</span>
                <span>{{ card.patient.vascularAccess }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">模式：</span>
                <span>{{ card.patient.treatmentMode }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">透析器：</span>
                <span>{{ card.patient.dialyzer }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">抗凝剂：</span>
                <span>{{ card.patient.anticoagulant }}</span>
              </div>
            </div>
          </div>
        </template>

        <!-- 无患者时显示添加按钮 -->
        <template v-else>
          <div class="bed-card__empty" @click="handleAddPatient(card)">
            <el-icon :size="28" color="#c0c4cc">
              <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
                <path
                  fill="currentColor"
                  d="M512 64a32 32 0 0 1 32 32v192a32 32 0 0 1-64 0V96a32 32 0 0 1 32-32zm0 640a32 32 0 0 1 32 32v192a32 32 0 1 1-64 0V736a32 32 0 0 1 32-32zm448-192a32 32 0 0 1-32 32H736a32 32 0 1 1 0-64h192a32 32 0 0 1 32 32zM288 512a32 32 0 0 1-32 32H64a32 32 0 0 1 0-64h192a32 32 0 0 1 32 32z"
                />
              </svg>
            </el-icon>
            <span class="empty-text">添加患者</span>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.bed-scheduling-tab {
  padding: 0;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}

.toolbar-left {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

/* 图例 */
.legend {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
  padding: 8px 12px;
  background: #fafafa;
  border-radius: 4px;
  font-size: 13px;
  color: #606266;
}

.legend-title {
  font-weight: 600;
  color: #303133;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.legend-color {
  display: inline-block;
  width: 16px;
  height: 16px;
  border-radius: 3px;
  border: 1px solid;
}

.legend-line {
  display: inline-block;
  width: 24px;
  height: 0;
  border-top-width: 2px;
}

.solid-line {
  border-top-style: solid;
  border-top-color: #409eff;
}

.dashed-line {
  border-top-style: dashed;
  border-top-color: #dcdfe6;
}

/* 床位卡片网格 */
.bed-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

/* 床位卡片 */
.bed-card {
  border: 2px solid;
  border-radius: 8px;
  padding: 14px;
  transition: box-shadow 0.3s, transform 0.2s;
  cursor: default;
  background: #fff;
}

.bed-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.bed-card--empty {
  border-style: dashed !important;
  background: #ffffff !important;
}

.bed-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.bed-card__no {
  font-size: 16px;
  font-weight: 700;
  color: #303133;
}

.bed-card__device {
  font-size: 12px;
  color: #909399;
  margin-bottom: 6px;
}

.device-label {
  color: #b0b3b8;
}

.device-serial {
  font-family: 'Courier New', Courier, monospace;
  color: #606266;
}

.bed-card__modes {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.mode-tag {
  display: inline-block;
  padding: 1px 6px;
  font-size: 11px;
  border-radius: 3px;
  border: 1px solid;
  line-height: 1.6;
}

.bed-card__divider {
  height: 1px;
  background: #e4e7ed;
  margin: 10px 0;
}

/* 患者信息 */
.bed-card__patient {
  font-size: 13px;
}

.patient-name-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}

.patient-name-row .el-link {
  font-size: 15px;
  font-weight: 600;
}

.infectious-tag {
  font-size: 11px !important;
}

.patient-info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px 12px;
}

.info-item {
  font-size: 12px;
  color: #606266;
  line-height: 1.8;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.info-label {
  color: #909399;
}

/* 空床位 */
.bed-card__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px 0 8px;
  cursor: pointer;
  transition: color 0.2s;
}

.bed-card__empty:hover {
  color: #409eff;
}

.bed-card__empty:hover .empty-text {
  color: #409eff;
}

.empty-text {
  font-size: 13px;
  color: #c0c4cc;
  margin-top: 4px;
  transition: color 0.2s;
}
</style>
