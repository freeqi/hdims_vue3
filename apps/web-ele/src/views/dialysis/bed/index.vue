<script lang="ts" setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { Page } from '@vben/common-ui';
import {
  ElMenu,
  ElSubMenu,
  ElMenuItem,
  ElButton,
  ElInput,
  ElSelect,
  ElOption,
  ElDialog,
  ElForm,
  ElFormItem,
  ElDatePicker,
  ElTag,
  ElMessage,
  ElMessageBox,
  ElDescriptions,
  ElDescriptionsItem,
  ElDivider,
  ElTooltip,
} from 'element-plus';
import type { FormInstance } from 'element-plus';

// ==================== 类型定义 ====================

/** 日期班次菜单项 */
interface DateShiftItem {
  date: string;
  weekDay: string;
  shifts: string[];
}

/** 已排床患者信息 */
interface BedPatient {
  scheduleId: string;
  patientId: string;
  patientName: string;
  gender: string;
  age: number;
  patientNo: string;
  bloodInfectious: string;
  vascularAccess: string;
  treatmentMode: string;
  dialyzer: string;
  perfusor: string;
  anticoagulant: string;
  anticoagulantDose: string;
}

/** 床位/设备卡片 */
interface BedCard {
  bedId: string;
  bedNo: string;
  treatmentArea: string;
  deviceSerial: string;
  supportedModes: string[];
  isFault: boolean;
  patient: BedPatient | null;
}

/** 未排床患者 */
interface UnscheduledPatient {
  patientId: string;
  patientName: string;
  gender: string;
  age: number;
  treatmentMode: string;
  treatmentArea: string;
  shift: string;
  bloodInfectious: string;
}

/** 排床/修改表单数据 */
interface ScheduleFormData {
  scheduleId: string;
  patientId: string;
  patientName: string;
  shift: string;
  treatmentMode: string;
  dialyzer: string;
  perfusor: string;
  bedId: string;
  bedNo: string;
  date: string;
}

/** 透析方案数据 */
interface DialysisPrescription {
  treatmentTime: string;
  vascularAccess: string;
  replacementFluid: string;
  anticoagulant: string;
  anticoagulantDose: string;
  bloodFlowRate: string;
  dialysateFlowRate: string;
  dryWeight: string;
  ultrafiltrationVolume: string;
  sodiumConcentration: string;
  temperature: string;
  calciumConcentration: string;
  potassiumConcentration: string;
  bicarbonateConcentration: string;
  glucoseConcentration: string;
  dialysateCombo: string;
  heparinAmount: string;
  heparinStopTime: string;
  replacementMode: string;
  replacementVolume: string;
  remark: string;
}

/** 复制排床表单 */
interface CopyScheduleForm {
  sourceDate: string;
  sourceShift: string;
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

const TREATMENT_MODE_OPTIONS = [
  { label: 'HD（血液透析）', value: 'HD' },
  { label: 'HDF（血液透析滤过）', value: 'HDF' },
  { label: 'HD+HP（血液透析+血液灌流）', value: 'HD+HP' },
  { label: 'CRRT（连续肾脏替代治疗）', value: 'CRRT' },
  { label: 'HF（血液滤过）', value: 'HF' },
];

const DIALYZER_OPTIONS = [
  { label: 'FX80', value: 'FX80' },
  { label: 'FX100', value: 'FX100' },
  { label: 'F60S', value: 'F60S' },
  { label: 'F80S', value: 'F80S' },
  { label: 'Polyflux 14L', value: 'Polyflux 14L' },
  { label: 'Polyflux 17L', value: 'Polyflux 17L' },
];

const PERFUSOR_OPTIONS = [
  { label: 'HA330', value: 'HA330' },
  { label: 'HA230', value: 'HA230' },
  { label: 'DX-10', value: 'DX-10' },
  { label: '无', value: '' },
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

// 周期与日期班次
const cycleDates = ref<DateShiftItem[]>([]);
const currentDate = ref('');
const currentShift = ref('');
const cycleOffset = ref(0);

// 床位数据
const bedCards = ref<BedCard[]>([]);

// 未排床患者
const unscheduledPatients = ref<UnscheduledPatient[]>([]);

// 筛选
const filterAreas = ref<string[]>([]);
const searchScheduled = ref('');
const searchUnscheduled = ref('');

// 弹窗
const scheduleDialogVisible = ref(false);
const scheduleDialogTitle = ref('排床');
const scheduleFormRef = ref<FormInstance>();
const scheduleFormData = reactive<ScheduleFormData>({
  scheduleId: '',
  patientId: '',
  patientName: '',
  shift: '',
  treatmentMode: '',
  dialyzer: '',
  perfusor: '',
  bedId: '',
  bedNo: '',
  date: '',
});

const changeBedDialogVisible = ref(false);
const changeBedFormRef = ref<FormInstance>();
const changeBedTarget = ref('');
const changeBedSource = reactive<{ scheduleId: string; bedNo: string }>({
  scheduleId: '',
  bedNo: '',
});

const copyDialogVisible = ref(false);
const copyFormRef = ref<FormInstance>();
const copyForm = reactive<CopyScheduleForm>({
  sourceDate: '',
  sourceShift: '',
});

const prescriptionDialogVisible = ref(false);
const prescriptionData = ref<DialysisPrescription | null>(null);

// 拖拽状态
const dragPatient = ref<UnscheduledPatient | null>(null);
const dragOverBedId = ref<string | null>(null);

// ==================== API 配置 ====================

function getHeaders() {
  return {
    hdToken: sessionStorage.getItem('hdToken') || '',
    hdUserName: sessionStorage.getItem('hdUserName') || '',
    hdOrgId: sessionStorage.getItem('hdOrgId') || '',
    hdOrgAuthCode: sessionStorage.getItem('hdOrgAuthCode') || '',
    hdEmpDepartment: sessionStorage.getItem('hdEmpDepartment') || '',
    ClientType: 'Web',
  };
}

// ==================== API 调用（已注释，使用mock数据） ====================

// import axios from 'axios';

// /** 获取周期日期列表 */
// async function fetchCycleDates() {
//   const res = await axios.get('/api/v1/SchedulingManage/4007', {
//     params: { offset: cycleOffset.value },
//     headers: getHeaders(),
//   });
//   if (res.data?.Code === 0) {
//     cycleDates.value = res.data.Data ?? [];
//   }
// }

// /** 获取排床数据 */
// async function fetchBedScheduleData() {
//   loading.value = true;
//   try {
//     const res = await axios.get('/api/v1/SchedulingManage/4010', {
//       params: { Date: currentDate.value, Shift: currentShift.value },
//       headers: getHeaders(),
//     });
//     if (res.data?.Code === 0) {
//       bedCards.value = res.data.Data ?? [];
//     }
//   } finally {
//     loading.value = false;
//   }
// }

// /** 获取未排床患者 */
// async function fetchUnscheduledPatients() {
//   const res = await axios.get('/api/v1/SchedulingManage/4009', {
//     params: { Date: currentDate.value, Shift: currentShift.value },
//     headers: getHeaders(),
//   });
//   if (res.data?.Code === 0) {
//     unscheduledPatients.value = res.data.Data ?? [];
//   }
// }

// /** 保存排床 */
// async function saveSchedule(data: ScheduleFormData) {
//   const res = await axios.put('/api/v1/SchedulingManage/3012', data, {
//     headers: getHeaders(),
//   });
//   return res.data;
// }

// /** 删除排床 */
// async function deleteSchedule(scheduleId: string) {
//   const res = await axios.delete('/api/v1/SchedulingManage/2003', {
//     params: { id: scheduleId },
//     headers: getHeaders(),
//   });
//   return res.data;
// }

// /** 删除全部排床 */
// async function deleteAllSchedules() {
//   const res = await axios.delete('/api/v1/SchedulingManage/2004', {
//     params: { Date: currentDate.value, Shift: currentShift.value },
//     headers: getHeaders(),
//   });
//   return res.data;
// }

// /** 自动排床 */
// async function autoSchedule() {
//   const res = await axios.post('/api/v1/SchedulingManage/1005', {
//     Date: currentDate.value,
//     Shift: currentShift.value,
//   }, { headers: getHeaders() });
//   return res.data;
// }

// /** 换床 */
// async function changeBed(scheduleId: string, newBedId: string) {
//   const res = await axios.put('/api/v1/SchedulingManage/3004', {
//     scheduleId,
//     newBedId,
//   }, { headers: getHeaders() });
//   return res.data;
// }

// /** 复制排床 */
// async function copySchedule(sourceDate: string, sourceShift: string) {
//   const res = await axios.post('/api/v1/SchedulingManage/1009', {
//     sourceDate,
//     sourceShift,
//     targetDate: currentDate.value,
//     targetShift: currentShift.value,
//   }, { headers: getHeaders() });
//   return res.data;
// }

// /** 获取可用床位 */
// async function fetchAvailableBeds(treatmentMode: string) {
//   const res = await axios.get('/api/v1/SchedulingManage/4008', {
//     params: { TreatmentMode: treatmentMode, Date: currentDate.value, Shift: currentShift.value },
//     headers: getHeaders(),
//   });
//   return res.data;
// }

// /** 获取透析方案 */
// async function fetchPrescription(treatmentMode: string) {
//   const res = await axios.get('/api/v1/SchedulingManage/4025', {
//     params: { TreatmentMode: treatmentMode },
//     headers: getHeaders(),
//   });
//   return res.data;
// }

// ==================== Mock 数据 ====================

/** 生成周期日期列表 */
function generateMockCycleDates(): DateShiftItem[] {
  const items: DateShiftItem[] = [];
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const base = new Date();
  base.setDate(base.getDate() + cycleOffset.value * 7 - base.getDay() + 1); // 本周一

  for (let i = 0; i < 7; i++) {
    const d = new Date(base);
    d.setDate(d.getDate() + i);
    const dateStr = formatDate(d);
    items.push({
      date: dateStr,
      weekDay: weekDays[d.getDay()],
      shifts: ['上午', '下午', '晚上'],
    });
  }
  return items;
}

/** 生成床位数据 */
function generateMockBedCards(): BedCard[] {
  const areas = ['一区', '一区', '一区', '二区', '二区', '二区', '二区', '三区', '三区', '三区', '三区', '三区', '四区', '四区', '四区', '四区'];
  const supportedModesList = [
    ['HD', 'HDF'],
    ['HD', 'HDF'],
    ['HD', 'HD+HP'],
    ['HD', 'HDF', 'HF'],
    ['HD', 'HDF'],
    ['HD', 'CRRT'],
    ['HD', 'HDF', 'HD+HP'],
    ['HD', 'HDF'],
    ['HD', 'HD+HP'],
    ['HD', 'HDF', 'HF'],
    ['HD', 'HDF'],
    ['HD', 'CRRT'],
    ['HD', 'HDF', 'HD+HP'],
    ['HD', 'HDF'],
    ['HD', 'HD+HP'],
    ['HD', 'HDF'],
  ];

  const patients: (BedPatient | null)[] = [
    {
      scheduleId: 'SCH001', patientId: 'P10001', patientName: '张三', gender: '男', age: 58,
      patientNo: '2024001001', bloodInfectious: '乙肝', vascularAccess: '动静脉内瘘',
      treatmentMode: 'HD', dialyzer: 'FX80', perfusor: '', anticoagulant: '低分子肝素', anticoagulantDose: '4000IU',
    },
    {
      scheduleId: 'SCH002', patientId: 'P10002', patientName: '李四', gender: '女', age: 45,
      patientNo: '2024001002', bloodInfectious: '', vascularAccess: '中心静脉导管',
      treatmentMode: 'HDF', dialyzer: 'FX100', perfusor: '', anticoagulant: '普通肝素', anticoagulantDose: '2000IU',
    },
    {
      scheduleId: 'SCH003', patientId: 'P10003', patientName: '王五', gender: '男', age: 62,
      patientNo: '2024001003', bloodInfectious: '丙肝', vascularAccess: '动静脉内瘘',
      treatmentMode: 'HD+HP', dialyzer: 'F60S', perfusor: 'HA330', anticoagulant: '低分子肝素', anticoagulantDose: '5000IU',
    },
    {
      scheduleId: 'SCH004', patientId: 'P10004', patientName: '赵六', gender: '男', age: 71,
      patientNo: '2024001004', bloodInfectious: '', vascularAccess: '人造血管',
      treatmentMode: 'HD', dialyzer: 'F80S', perfusor: '', anticoagulant: '无肝素', anticoagulantDose: '',
    },
    {
      scheduleId: 'SCH005', patientId: 'P10005', patientName: '钱七', gender: '女', age: 53,
      patientNo: '2024001005', bloodInfectious: 'HIV', vascularAccess: '中心静脉导管',
      treatmentMode: 'CRRT', dialyzer: 'Polyflux 17L', perfusor: '', anticoagulant: '局部枸橼酸', anticoagulantDose: '200ml/h',
    },
    null, // 6号床空
    {
      scheduleId: 'SCH006', patientId: 'P10006', patientName: '孙八', gender: '男', age: 39,
      patientNo: '2024001006', bloodInfectious: '', vascularAccess: '动静脉内瘘',
      treatmentMode: 'HF', dialyzer: 'FX80', perfusor: '', anticoagulant: '低分子肝素', anticoagulantDose: '4000IU',
    },
    null, // 8号床空
    null, // 9号床空
    {
      scheduleId: 'SCH007', patientId: 'P10007', patientName: '周九', gender: '女', age: 67,
      patientNo: '2024001007', bloodInfectious: '梅毒', vascularAccess: '直接穿刺',
      treatmentMode: 'HDF', dialyzer: 'FX100', perfusor: '', anticoagulant: '普通肝素', anticoagulantDose: '1500IU',
    },
    null, // 11号床空
    null, // 12号床空
    null, // 13号床空
    null, // 14号床空
    null, // 15号床空
    null, // 16号床空
  ];

  const cards: BedCard[] = [];
  for (let i = 0; i < 16; i++) {
    cards.push({
      bedId: `BED${String(i + 1).padStart(3, '0')}`,
      bedNo: `${i + 1}号床`,
      treatmentArea: areas[i] || '一区',
      deviceSerial: `DEV-2024-${String(i + 1).padStart(3, '0')}`,
      supportedModes: supportedModesList[i] || ['HD'],
      isFault: i === 7, // 8号床设备故障
      patient: patients[i] || null,
    });
  }
  return cards;
}

/** 生成未排床患者 */
function generateMockUnscheduledPatients(): UnscheduledPatient[] {
  return [
    { patientId: 'P10008', patientName: '吴十', gender: '男', age: 44, treatmentMode: 'HD', treatmentArea: '一区', shift: '上午', bloodInfectious: '' },
    { patientId: 'P10009', patientName: '郑十一', gender: '女', age: 56, treatmentMode: 'HDF', treatmentArea: '二区', shift: '上午', bloodInfectious: '乙肝' },
    { patientId: 'P10010', patientName: '冯十二', gender: '男', age: 68, treatmentMode: 'HD+HP', treatmentArea: '三区', shift: '上午', bloodInfectious: '' },
    { patientId: 'P10011', patientName: '陈小明', gender: '男', age: 33, treatmentMode: 'HD', treatmentArea: '一区', shift: '上午', bloodInfectious: '丙肝' },
    { patientId: 'P10012', patientName: '林小红', gender: '女', age: 49, treatmentMode: 'CRRT', treatmentArea: '四区', shift: '上午', bloodInfectious: '' },
    { patientId: 'P10013', patientName: '黄大伟', gender: '男', age: 72, treatmentMode: 'HF', treatmentArea: '二区', shift: '上午', bloodInfectious: '' },
    { patientId: 'P10014', patientName: '杨秀英', gender: '女', age: 61, treatmentMode: 'HD', treatmentArea: '三区', shift: '上午', bloodInfectious: '梅毒' },
  ];
}

/** 生成透析方案mock数据 */
function generateMockPrescription(): DialysisPrescription {
  return {
    treatmentTime: '4小时',
    vascularAccess: '动静脉内瘘',
    replacementFluid: '前稀释',
    anticoagulant: '低分子肝素',
    anticoagulantDose: '4000IU',
    bloodFlowRate: '250ml/min',
    dialysateFlowRate: '500ml/min',
    dryWeight: '65kg',
    ultrafiltrationVolume: '2000ml',
    sodiumConcentration: '140mmol/L',
    temperature: '36.5°C',
    calciumConcentration: '1.5mmol/L',
    potassiumConcentration: '2.0mmol/L',
    bicarbonateConcentration: '32mmol/L',
    glucoseConcentration: '5.5mmol/L',
    dialysateCombo: '标准曲线',
    heparinAmount: '2000IU',
    heparinStopTime: '提前1小时',
    replacementMode: '前稀释',
    replacementVolume: '18L',
    remark: '患者血管通路良好，透析过程顺利。',
  };
}

// ==================== 工具函数 ====================

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getCardBgColor(card: BedCard): string {
  if (!card.patient) return '#ffffff';
  return MODE_COLOR_MAP[card.patient.treatmentMode] || '#ffffff';
}

function getCardBorderColor(card: BedCard): string {
  if (!card.patient) return '#dcdfe6';
  return MODE_BORDER_MAP[card.patient.treatmentMode] || '#dcdfe6';
}

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

// ==================== 计算属性 ====================

/** 筛选后的床位卡片 */
const filteredBedCards = computed(() => {
  let data = bedCards.value;
  if (filterAreas.value.length > 0) {
    data = data.filter((card) => filterAreas.value.includes(card.treatmentArea));
  }
  if (searchScheduled.value) {
    const kw = searchScheduled.value.toLowerCase();
    data = data.filter((card) => {
      if (card.bedNo.toLowerCase().includes(kw)) return true;
      if (card.deviceSerial.toLowerCase().includes(kw)) return true;
      if (card.patient) {
        return (
          card.patient.patientName.toLowerCase().includes(kw) ||
          card.patient.patientNo.toLowerCase().includes(kw)
        );
      }
      return false;
    });
  }
  return data;
});

/** 筛选后的未排床患者 */
const filteredUnscheduledPatients = computed(() => {
  if (!searchUnscheduled.value) return unscheduledPatients.value;
  const kw = searchUnscheduled.value.toLowerCase();
  return unscheduledPatients.value.filter(
    (p) =>
      p.patientName.toLowerCase().includes(kw) ||
      p.patientId.toLowerCase().includes(kw) ||
      p.treatmentMode.toLowerCase().includes(kw),
  );
});

/** 统计数据 */
const stats = computed(() => {
  const scheduled = bedCards.value.filter((c) => c.patient !== null).length;
  const unscheduled = unscheduledPatients.value.length;
  return { scheduled, unscheduled, total: scheduled + unscheduled };
});

/** 可用床位列表（排床弹窗中根据治疗模式过滤） */
const availableBeds = computed(() => {
  if (!scheduleFormData.treatmentMode) return [];
  return bedCards.value.filter(
    (bed) =>
      !bed.isFault &&
      !bed.patient &&
      bed.supportedModes.includes(scheduleFormData.treatmentMode),
  );
});

/** 当前选中的日期显示文本 */
const currentDateDisplay = computed(() => {
  if (!currentDate.value) return '';
  const item = cycleDates.value.find((d) => d.date === currentDate.value);
  return item ? `${item.date} ${item.weekDay}` : currentDate.value;
});

// ==================== 业务逻辑 ====================

/** 加载周期日期 */
function loadCycleDates() {
  cycleDates.value = generateMockCycleDates();
  // 默认选中第一个日期的第一个班次
  if (cycleDates.value.length > 0 && !currentDate.value) {
    currentDate.value = cycleDates.value[0]!.date;
    currentShift.value = '上午';
  }
}

/** 加载排床数据 */
function loadBedData() {
  loading.value = true;
  setTimeout(() => {
    bedCards.value = generateMockBedCards();
    unscheduledPatients.value = generateMockUnscheduledPatients();
    loading.value = false;
  }, 300);
}

/** 切换日期班次 */
function handleDateShiftChange(date: string, shift: string) {
  currentDate.value = date;
  currentShift.value = shift;
  loadBedData();
}

/** 上一周期 */
function prevCycle() {
  cycleOffset.value--;
  loadCycleDates();
  loadBedData();
}

/** 下一周期 */
function nextCycle() {
  cycleOffset.value++;
  loadCycleDates();
  loadBedData();
}

/** 自动排床 */
async function handleAutoSchedule() {
  try {
    await ElMessageBox.confirm('确定要自动排床吗？系统将根据患者治疗模式自动分配床位。', '自动排床', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });
    // await autoSchedule();
    ElMessage.success('自动排床成功');
    loadBedData();
  } catch {
    // 用户取消
  }
}

/** 删除全部排床 */
async function handleDeleteAll() {
  try {
    await ElMessageBox.confirm('确定要删除当前班次的全部排床吗？此操作不可撤销。', '删除全部排床', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });
    // await deleteAllSchedules();
    ElMessage.success('已删除全部排床');
    loadBedData();
  } catch {
    // 用户取消
  }
}

/** 复制排床 */
function handleCopySchedule() {
  copyForm.sourceDate = '';
  copyForm.sourceShift = '';
  copyDialogVisible.value = true;
}

/** 确认复制排床 */
async function confirmCopySchedule() {
  if (!copyFormRef.value) return;
  await copyFormRef.value.validate(async (valid) => {
    if (!valid) return;
    try {
      // await copySchedule(copyForm.sourceDate, copyForm.sourceShift);
      ElMessage.success('复制排床成功');
      copyDialogVisible.value = false;
      loadBedData();
    } catch {
      ElMessage.error('复制排床失败');
    }
  });
}

/** 打印排床 */
function handlePrint() {
  ElMessage.info('打印功能开发中...');
}

/** 点击空床位 - 打开排床弹窗 */
function handleEmptyBedClick(bed: BedCard) {
  scheduleDialogTitle.value = '排床';
  Object.assign(scheduleFormData, {
    scheduleId: '',
    patientId: '',
    patientName: '',
    shift: currentShift.value,
    treatmentMode: '',
    dialyzer: '',
    perfusor: '',
    bedId: bed.bedId,
    bedNo: bed.bedNo,
    date: currentDate.value,
  });
  scheduleDialogVisible.value = true;
}

/** 点击治疗模式 - 修改治疗模式 */
function handleTreatmentModeClick(bed: BedCard) {
  if (!bed.patient) return;
  scheduleDialogTitle.value = '修改排床';
  Object.assign(scheduleFormData, {
    scheduleId: bed.patient.scheduleId,
    patientId: bed.patient.patientId,
    patientName: bed.patient.patientName,
    shift: currentShift.value,
    treatmentMode: bed.patient.treatmentMode,
    dialyzer: bed.patient.dialyzer,
    perfusor: bed.patient.perfusor,
    bedId: bed.bedId,
    bedNo: bed.bedNo,
    date: currentDate.value,
  });
  scheduleDialogVisible.value = true;
}

/** 提交排床/修改 */
async function handleScheduleSubmit() {
  if (!scheduleFormRef.value) return;
  await scheduleFormRef.value.validate(async (valid) => {
    if (!valid) return;
    try {
      // await saveSchedule(scheduleFormData);
      ElMessage.success(scheduleDialogTitle.value === '排床' ? '排床成功' : '修改成功');
      scheduleDialogVisible.value = false;
      loadBedData();
    } catch {
      ElMessage.error('操作失败');
    }
  });
}

/** 换床 */
function handleChangeBed(bed: BedCard) {
  if (!bed.patient) return;
  changeBedSource.scheduleId = bed.patient.scheduleId;
  changeBedSource.bedNo = bed.bedNo;
  changeBedTarget.value = '';
  changeBedDialogVisible.value = true;
}

/** 确认换床 */
async function confirmChangeBed() {
  if (!changeBedFormRef.value) return;
  await changeBedFormRef.value.validate(async (valid) => {
    if (!valid) return;
    try {
      // await changeBed(changeBedSource.scheduleId, changeBedTarget.value);
      ElMessage.success('换床成功');
      changeBedDialogVisible.value = false;
      loadBedData();
    } catch {
      ElMessage.error('换床失败');
    }
  });
}

/** 删除单个排床 */
async function handleDeleteSchedule(bed: BedCard) {
  if (!bed.patient) return;
  try {
    await ElMessageBox.confirm(
      `确定要删除患者"${bed.patient.patientName}"在${bed.bedNo}的排床吗？`,
      '删除排床',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' },
    );
    // await deleteSchedule(bed.patient.scheduleId);
    ElMessage.success('删除排床成功');
    loadBedData();
  } catch {
    // 用户取消
  }
}

/** 查看透析方案 */
function handleViewPrescription() {
  prescriptionData.value = generateMockPrescription();
  prescriptionDialogVisible.value = true;
}

/** 从右侧拖拽患者到床位 */
function onDragStart(e: DragEvent, patient: UnscheduledPatient) {
  dragPatient.value = patient;
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', patient.patientId);
  }
}

function onDragOver(e: DragEvent, bedId: string) {
  e.preventDefault();
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = 'move';
  }
  dragOverBedId.value = bedId;
}

function onDragLeave(_e: DragEvent, _bedId: string) {
  dragOverBedId.value = null;
}

function onDrop(e: DragEvent, bed: BedCard) {
  e.preventDefault();
  dragOverBedId.value = null;
  if (!dragPatient.value || bed.patient || bed.isFault) return;
  // 检查治疗模式是否匹配
  if (!bed.supportedModes.includes(dragPatient.value.treatmentMode)) {
    ElMessage.warning(`${bed.bedNo}不支持${dragPatient.value.treatmentMode}治疗模式`);
    return;
  }
  // 模拟排床
  ElMessage.success(`已将患者"${dragPatient.value.patientName}"排到${bed.bedNo}`);
  dragPatient.value = null;
  loadBedData();
}

function onDragEnd() {
  dragPatient.value = null;
  dragOverBedId.value = null;
}

// ==================== 生命周期 ====================

onMounted(() => {
  loadCycleDates();
  loadBedData();
});
</script>

<template>
  <Page title="患者排床">
    <div class="sort-bed-container">
      <!-- ========== 左栏：日期班次选择面板 ========== -->
      <div class="left-panel">
        <div class="cycle-nav">
          <ElButton size="small" @click="prevCycle">&laquo; 上一周期</ElButton>
          <ElButton size="small" @click="nextCycle">下一周期 &raquo;</ElButton>
        </div>
        <ElMenu
          :default-active="`${currentDate}-${currentShift}`"
          class="date-shift-menu"
          @select="(key: string) => { const [d, s] = key.split('---'); handleDateShiftChange(d, s); }"
        >
          <ElSubMenu
            v-for="dateItem in cycleDates"
            :key="dateItem.date"
            :index="dateItem.date"
          >
            <template #title>
              <span class="date-title">{{ dateItem.date.slice(5) }}</span>
              <span class="date-weekday">{{ dateItem.weekDay }}</span>
            </template>
            <ElMenuItem
              v-for="shift in dateItem.shifts"
              :key="`${dateItem.date}---${shift}`"
              :index="`${dateItem.date}---${shift}`"
            >
              {{ shift }}
            </ElMenuItem>
          </ElSubMenu>
        </ElMenu>
      </div>

      <!-- ========== 中栏：床位网格 ========== -->
      <div class="center-panel">
        <!-- 顶部工具栏 -->
        <div class="toolbar">
          <div class="toolbar-left">
            <ElButton type="primary" size="small" @click="handleAutoSchedule">
              自动排床
            </ElButton>
            <ElButton size="small" @click="handleDeleteAll">
              删除全部
            </ElButton>
            <ElButton size="small" @click="handleCopySchedule">
              复制排床
            </ElButton>
            <ElButton size="small" @click="handlePrint">
              打印排床
            </ElButton>
            <ElSelect
              v-model="filterAreas"
              placeholder="分区筛选"
              clearable
              multiple
              collapse-tags
              collapse-tags-tooltip
              style="width: 180px"
            >
              <ElOption
                v-for="item in AREA_OPTIONS"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </ElSelect>
            <ElInput
              v-model="searchScheduled"
              placeholder="搜索已排床患者"
              clearable
              style="width: 200px"
            />
          </div>
          <div class="toolbar-right">
            <span class="current-date">{{ currentDateDisplay }} {{ currentShift }}</span>
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
        </div>

        <!-- 床位卡片网格 -->
        <div v-loading="loading" class="bed-grid">
          <div
            v-for="card in filteredBedCards"
            :key="card.bedId"
            class="bed-card"
            :class="{
              'bed-card--empty': !card.patient,
              'bed-card--fault': card.isFault,
              'bed-card--drag-over': dragOverBedId === card.bedId,
            }"
            :style="{
              backgroundColor: getCardBgColor(card),
              borderColor: getCardBorderColor(card),
            }"
            @dragover="onDragOver($event, card.bedId)"
            @dragleave="onDragLeave($event, card.bedId)"
            @drop="onDrop($event, card)"
          >
            <!-- 设备故障标记 -->
            <div v-if="card.isFault" class="fault-badge">故障</div>

            <!-- 床位头部信息 -->
            <div class="bed-card__header">
              <span class="bed-card__no">{{ card.bedNo }}</span>
              <ElTag size="small" type="info">{{ card.treatmentArea }}</ElTag>
            </div>

            <!-- 设备信息 -->
            <div class="bed-card__device">
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
                <!-- 操作按钮行 -->
                <div class="patient-actions">
                  <ElTooltip content="换床" placement="top">
                    <ElButton
                      type="primary"
                      link
                      size="small"
                      @click.stop="handleChangeBed(card)"
                    >
                      <svg viewBox="0 0 1024 1024" width="14" height="14" xmlns="http://www.w3.org/2000/svg">
                        <path fill="currentColor" d="M909.1 209.3l-56.4 44.7C790.8 150.7 712.7 80 621.3 80 470.9 80 349.3 201.6 349.3 352c0 40.3 8.7 78.5 24.3 113.1L328.3 488c-17.3-42.1-26.8-88-26.8-136 0-176.7 143.1-320 320-320 120.6 0 225.5 66.8 280.2 165.5l49.8-39.4L960 256l-50.9 46.7zM114.9 814.7l56.4-44.7C233.2 873.3 311.3 944 402.7 944c150.4 0 272-121.6 272-272 0-40.3-8.7-78.5-24.3-113.1l45.3-22.9c17.3 42.1 26.8 88 26.8 136 0 176.7-143.1 320-320 320-120.6 0-225.5-66.8-280.2-165.5l-49.8 39.4L64 768l50.9-46.7z" />
                      </svg>
                    </ElButton>
                  </ElTooltip>
                  <ElTooltip content="删除排床" placement="top">
                    <ElButton
                      type="danger"
                      link
                      size="small"
                      @click.stop="handleDeleteSchedule(card)"
                    >
                      <svg viewBox="0 0 1024 1024" width="14" height="14" xmlns="http://www.w3.org/2000/svg">
                        <path fill="currentColor" d="M512 64a32 32 0 0 1 32 32v192a32 32 0 0 1-64 0V96a32 32 0 0 1 32-32zm0 640a32 32 0 0 1 32 32v192a32 32 0 1 1-64 0V736a32 32 0 0 1 32-32zM196 544a32 32 0 0 1 32-32h192a32 32 0 1 1 0 64H228a32 32 0 0 1-32-32zm384-32a32 32 0 0 1 0 64h192a32 32 0 1 1 0-64H580z" />
                      </svg>
                    </ElButton>
                  </ElTooltip>
                </div>

                <!-- 患者姓名+传染病标记 -->
                <div class="patient-name-row">
                  <span class="patient-name">{{ card.patient.patientName }}</span>
                  <ElTag
                    v-if="card.patient.bloodInfectious"
                    :type="getInfectiousTagType(card.patient.bloodInfectious)"
                    size="small"
                    effect="dark"
                    class="infectious-tag"
                  >
                    {{ card.patient.bloodInfectious }}
                  </ElTag>
                  <span class="patient-gender-age">
                    {{ card.patient.gender }} / {{ card.patient.age }}岁
                  </span>
                </div>

                <!-- 患者编号 -->
                <div class="patient-no">{{ card.patient.patientNo }}</div>

                <!-- 血管通路 -->
                <div class="patient-info-row">
                  <span class="info-label">通路：</span>{{ card.patient.vascularAccess }}
                </div>

                <!-- 治疗模式/透析器/灌流器（可点击修改） -->
                <div
                  class="treatment-mode-row"
                  @click.stop="handleTreatmentModeClick(card)"
                >
                  <span class="mode-highlight">
                    {{ card.patient.treatmentMode }}
                  </span>
                  <span v-if="card.patient.dialyzer" class="dialyzer-text">
                    / {{ card.patient.dialyzer }}
                  </span>
                  <span v-if="card.patient.perfusor" class="perfusor-text">
                    / {{ card.patient.perfusor }}
                  </span>
                </div>

                <!-- 抗凝剂信息 -->
                <div class="patient-info-row">
                  <span class="info-label">抗凝：</span>
                  {{ card.patient.anticoagulant }}
                  <span v-if="card.patient.anticoagulantDose">
                    ({{ card.patient.anticoagulantDose }})
                  </span>
                </div>
              </div>
            </template>

            <!-- 无患者时显示添加按钮 -->
            <template v-else>
              <div
                class="bed-card__empty"
                @click="handleEmptyBedClick(card)"
              >
                <svg viewBox="0 0 1024 1024" width="32" height="32" xmlns="http://www.w3.org/2000/svg">
                  <path fill="#c0c4cc" d="M512 64a32 32 0 0 1 32 32v192a32 32 0 0 1-64 0V96a32 32 0 0 1 32-32zm0 640a32 32 0 0 1 32 32v192a32 32 0 1 1-64 0V736a32 32 0 0 1 32-32zm448-192a32 32 0 0 1-32 32H736a32 32 0 1 1 0-64h192a32 32 0 0 1 32 32zM288 512a32 32 0 0 1-32 32H64a32 32 0 0 1 0-64h192a32 32 0 0 1 32 32z" />
                </svg>
                <span class="empty-text">点击排床或拖拽患者</span>
              </div>
            </template>
          </div>
        </div>
      </div>

      <!-- ========== 右栏：未排床患者列表 ========== -->
      <div class="right-panel">
        <ElInput
          v-model="searchUnscheduled"
          placeholder="搜索未排床患者"
          clearable
          size="small"
          class="unscheduled-search"
        />
        <div class="patient-stats">
          已排<span class="stat-num">{{ stats.scheduled }}</span>人
          未排<span class="stat-num warn">{{ stats.unscheduled }}</span>人
          共<span class="stat-num">{{ stats.total }}</span>人
        </div>
        <div class="unscheduled-list">
          <div
            v-for="patient in filteredUnscheduledPatients"
            :key="patient.patientId"
            class="unscheduled-item"
            draggable="true"
            @dragstart="onDragStart($event, patient)"
            @dragend="onDragEnd"
            @click="handleEmptyBedClick({ bedId: '', bedNo: '', treatmentArea: patient.treatmentArea, deviceSerial: '', supportedModes: [patient.treatmentMode], isFault: false, patient: null } as BedCard)"
          >
            <span class="unscheduled-name">{{ patient.patientName }}</span>
            <ElTag
              v-if="patient.bloodInfectious"
              :type="getInfectiousTagType(patient.bloodInfectious)"
              size="small"
              effect="dark"
              class="infectious-tag-small"
            >
              {{ patient.bloodInfectious }}
            </ElTag>
            <div class="unscheduled-info">
              <span>{{ patient.age }}岁</span>
              <span class="mode-tag-small" :style="{ color: MODE_BORDER_MAP[patient.treatmentMode] }">
                {{ patient.treatmentMode }}
              </span>
              <span>{{ patient.treatmentArea }}</span>
              <span>{{ patient.shift }}</span>
            </div>
          </div>
          <div v-if="filteredUnscheduledPatients.length === 0" class="no-data">
            暂无未排床患者
          </div>
        </div>
      </div>
    </div>

    <!-- ========== 排床/修改弹窗 ========== -->
    <ElDialog
      v-model="scheduleDialogVisible"
      :title="scheduleDialogTitle"
      width="900px"
      destroy-on-close
    >
      <ElForm
        ref="scheduleFormRef"
        :model="scheduleFormData"
        :rules="{
          patientId: [{ required: true, message: '请选择患者', trigger: 'change' }],
          shift: [{ required: true, message: '请选择班次', trigger: 'change' }],
          treatmentMode: [{ required: true, message: '请选择治疗模式', trigger: 'change' }],
          bedId: [{ required: true, message: '请选择床位', trigger: 'change' }],
        }"
        label-width="100px"
      >
        <ElFormItem label="患者" prop="patientId">
          <ElSelect
            v-model="scheduleFormData.patientId"
            placeholder="请选择患者"
            filterable
            style="width: 100%"
          >
            <ElOption
              v-for="p in unscheduledPatients"
              :key="p.patientId"
              :label="`${p.patientName} (${p.patientId})`"
              :value="p.patientId"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="班次" prop="shift">
          <ElSelect v-model="scheduleFormData.shift" placeholder="请选择班次" style="width: 100%">
            <ElOption
              v-for="item in SHIFT_OPTIONS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="治疗模式" prop="treatmentMode">
          <ElSelect
            v-model="scheduleFormData.treatmentMode"
            placeholder="请选择治疗模式"
            style="width: 100%"
          >
            <ElOption
              v-for="item in TREATMENT_MODE_OPTIONS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="透析器" prop="dialyzer">
          <ElSelect
            v-model="scheduleFormData.dialyzer"
            placeholder="请选择透析器"
            style="width: 100%"
          >
            <ElOption
              v-for="item in DIALYZER_OPTIONS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="灌流器" prop="perfusor">
          <ElSelect
            v-model="scheduleFormData.perfusor"
            placeholder="请选择灌流器（选填）"
            clearable
            style="width: 100%"
          >
            <ElOption
              v-for="item in PERFUSOR_OPTIONS"
              :key="item.value"
              :label="item.label || '无'"
              :value="item.value"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="床位" prop="bedId">
          <ElSelect
            v-model="scheduleFormData.bedId"
            placeholder="请选择床位"
            filterable
            style="width: 100%"
          >
            <ElOption
              v-for="bed in availableBeds"
              :key="bed.bedId"
              :label="`${bed.bedNo} - ${bed.treatmentArea} - ${bed.deviceSerial}`"
              :value="bed.bedId"
            />
          </ElSelect>
          <div v-if="scheduleFormData.treatmentMode && availableBeds.length === 0" class="no-bed-hint">
            当前治疗模式下无可用床位
          </div>
        </ElFormItem>
        <ElFormItem>
          <ElButton type="primary" link @click="handleViewPrescription">
            查看选中模式透析方案
          </ElButton>
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="scheduleDialogVisible = false">取消</ElButton>
        <ElButton type="primary" @click="handleScheduleSubmit">确定</ElButton>
      </template>
    </ElDialog>

    <!-- ========== 换床弹窗 ========== -->
    <ElDialog
      v-model="changeBedDialogVisible"
      title="换床"
      width="450px"
      destroy-on-close
    >
      <ElForm
        ref="changeBedFormRef"
        :model="{ targetBed: changeBedTarget }"
        :rules="{ targetBed: [{ required: true, message: '请选择新床位', trigger: 'change' }] }"
        label-width="80px"
      >
        <ElFormItem label="当前床位">
          <span>{{ changeBedSource.bedNo }}</span>
        </ElFormItem>
        <ElFormItem label="新床位" prop="targetBed">
          <ElSelect
            v-model="changeBedTarget"
            placeholder="请选择新床位"
            filterable
            style="width: 100%"
          >
            <ElOption
              v-for="bed in bedCards.filter(b => !b.isFault && !b.patient)"
              :key="bed.bedId"
              :label="`${bed.bedNo} - ${bed.treatmentArea}`"
              :value="bed.bedId"
            />
          </ElSelect>
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="changeBedDialogVisible = false">取消</ElButton>
        <ElButton type="primary" @click="confirmChangeBed">确定换床</ElButton>
      </template>
    </ElDialog>

    <!-- ========== 复制排床弹窗 ========== -->
    <ElDialog
      v-model="copyDialogVisible"
      title="复制排床"
      width="450px"
      destroy-on-close
    >
      <ElForm
        ref="copyFormRef"
        :model="copyForm"
        :rules="{
          sourceDate: [{ required: true, message: '请选择来源日期', trigger: 'change' }],
          sourceShift: [{ required: true, message: '请选择来源班次', trigger: 'change' }],
        }"
        label-width="80px"
      >
        <ElFormItem label="来源日期" prop="sourceDate">
          <ElDatePicker
            v-model="copyForm.sourceDate"
            type="date"
            placeholder="选择来源日期"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </ElFormItem>
        <ElFormItem label="来源班次" prop="sourceShift">
          <ElSelect v-model="copyForm.sourceShift" placeholder="请选择来源班次" style="width: 100%">
            <ElOption
              v-for="item in SHIFT_OPTIONS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="目标日期">
          <span>{{ currentDate }}</span>
        </ElFormItem>
        <ElFormItem label="目标班次">
          <span>{{ currentShift }}</span>
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="copyDialogVisible = false">取消</ElButton>
        <ElButton type="primary" @click="confirmCopySchedule">确定复制</ElButton>
      </template>
    </ElDialog>

    <!-- ========== 透析方案查看弹窗 ========== -->
    <ElDialog
      v-model="prescriptionDialogVisible"
      title="透析方案详情"
      width="1300px"
      destroy-on-close
    >
      <template v-if="prescriptionData">
        <ElDivider content-position="left">透析处方设置</ElDivider>
        <ElDescriptions :column="3" border size="small">
          <ElDescriptionsItem label="治疗时间">{{ prescriptionData.treatmentTime }}</ElDescriptionsItem>
          <ElDescriptionsItem label="血管通路">{{ prescriptionData.vascularAccess }}</ElDescriptionsItem>
          <ElDescriptionsItem label="置换液方式">{{ prescriptionData.replacementFluid }}</ElDescriptionsItem>
          <ElDescriptionsItem label="抗凝剂">{{ prescriptionData.anticoagulant }}</ElDescriptionsItem>
          <ElDescriptionsItem label="抗凝剂剂量">{{ prescriptionData.anticoagulantDose }}</ElDescriptionsItem>
          <ElDescriptionsItem label="血流量">{{ prescriptionData.bloodFlowRate }}</ElDescriptionsItem>
          <ElDescriptionsItem label="透析液流量">{{ prescriptionData.dialysateFlowRate }}</ElDescriptionsItem>
          <ElDescriptionsItem label="干体重">{{ prescriptionData.dryWeight }}</ElDescriptionsItem>
          <ElDescriptionsItem label="超滤量">{{ prescriptionData.ultrafiltrationVolume }}</ElDescriptionsItem>
          <ElDescriptionsItem label="钠浓度">{{ prescriptionData.sodiumConcentration }}</ElDescriptionsItem>
          <ElDescriptionsItem label="透析液温度">{{ prescriptionData.temperature }}</ElDescriptionsItem>
          <ElDescriptionsItem label="置换模式">{{ prescriptionData.replacementMode }}</ElDescriptionsItem>
          <ElDescriptionsItem label="置换液量">{{ prescriptionData.replacementVolume }}</ElDescriptionsItem>
          <ElDescriptionsItem label="肝素量">{{ prescriptionData.heparinAmount }}</ElDescriptionsItem>
          <ElDescriptionsItem label="肝素停药时间">{{ prescriptionData.heparinStopTime }}</ElDescriptionsItem>
        </ElDescriptions>

        <ElDivider content-position="left">透析液处方</ElDivider>
        <ElDescriptions :column="3" border size="small">
          <ElDescriptionsItem label="组合曲线">{{ prescriptionData.dialysateCombo }}</ElDescriptionsItem>
          <ElDescriptionsItem label="钙">{{ prescriptionData.calciumConcentration }}</ElDescriptionsItem>
          <ElDescriptionsItem label="钾">{{ prescriptionData.potassiumConcentration }}</ElDescriptionsItem>
          <ElDescriptionsItem label="碳酸氢根">{{ prescriptionData.bicarbonateConcentration }}</ElDescriptionsItem>
          <ElDescriptionsItem label="葡萄糖">{{ prescriptionData.glucoseConcentration }}</ElDescriptionsItem>
        </ElDescriptions>

        <ElDivider content-position="left">备注</ElDivider>
        <div class="prescription-remark">{{ prescriptionData.remark }}</div>
      </template>
      <template #footer>
        <ElButton @click="prescriptionDialogVisible = false">关闭</ElButton>
      </template>
    </ElDialog>
  </Page>
</template>

<style scoped>
/* ==================== 三栏布局 ==================== */

.sort-bed-container {
  display: flex;
  height: calc(100vh - 140px);
  min-height: 600px;
  gap: 0;
  background: #f5f7fa;
  border-radius: 4px;
  overflow: hidden;
}

/* ==================== 左栏 ==================== */

.left-panel {
  width: 120px;
  flex-shrink: 0;
  background: #fff;
  border-right: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
}

.cycle-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px;
  border-bottom: 1px solid #e4e7ed;
}

.cycle-nav .el-button {
  width: 100%;
  font-size: 12px;
}

.date-shift-menu {
  border-right: none;
  flex: 1;
  overflow-y: auto;
}

.date-title {
  font-weight: 600;
  font-size: 13px;
}

.date-weekday {
  font-size: 11px;
  color: #909399;
  margin-left: 4px;
}

/* ==================== 中栏 ==================== */

.center-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 10px 12px;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
}

.toolbar-left {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}

.toolbar-right {
  flex-shrink: 0;
}

.current-date {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

/* 图例 */
.legend {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 12px;
  background: #fafafa;
  border-bottom: 1px solid #ebeef5;
  font-size: 12px;
  color: #606266;
}

.legend-title {
  font-weight: 600;
  color: #303133;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 3px;
}

.legend-color {
  display: inline-block;
  width: 14px;
  height: 14px;
  border-radius: 3px;
  border: 1px solid;
}

/* 床位网格 */
.bed-grid {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 12px;
  align-content: start;
}

/* ==================== 床位卡片 ==================== */

.bed-card {
  border: 2px solid;
  border-radius: 8px;
  padding: 12px;
  transition: box-shadow 0.3s, transform 0.2s;
  cursor: default;
  background: #fff;
  position: relative;
  min-height: 180px;
}

.bed-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.bed-card--empty {
  border-style: dashed !important;
  background: #ffffff !important;
}

.bed-card--fault {
  opacity: 0.7;
}

.bed-card--drag-over {
  border-style: dashed !important;
  border-color: #409eff !important;
  background: #ecf5ff !important;
  box-shadow: 0 0 8px rgba(64, 158, 255, 0.4);
}

.fault-badge {
  position: absolute;
  top: 0;
  right: 0;
  background: #f56c6c;
  color: #fff;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 0 6px 0 6px;
  font-weight: 600;
}

.bed-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.bed-card__no {
  font-size: 15px;
  font-weight: 700;
  color: #303133;
}

.bed-card__device {
  font-size: 11px;
  color: #909399;
  margin-bottom: 4px;
}

.device-serial {
  font-family: 'Courier New', Courier, monospace;
  color: #606266;
}

.bed-card__modes {
  display: flex;
  gap: 3px;
  flex-wrap: wrap;
  margin-bottom: 6px;
}

.mode-tag {
  display: inline-block;
  padding: 0 5px;
  font-size: 10px;
  border-radius: 3px;
  border: 1px solid;
  line-height: 1.6;
}

.bed-card__divider {
  height: 1px;
  background: #e4e7ed;
  margin: 8px 0;
}

/* ==================== 患者信息 ==================== */

.bed-card__patient {
  font-size: 13px;
}

.patient-actions {
  display: flex;
  justify-content: flex-end;
  gap: 2px;
  margin-bottom: 4px;
}

.patient-name-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
  flex-wrap: wrap;
}

.patient-name {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.patient-gender-age {
  font-size: 12px;
  color: #909399;
}

.infectious-tag {
  font-size: 10px !important;
  transform: scale(0.9);
}

.patient-no {
  font-size: 11px;
  color: #909399;
  margin-bottom: 4px;
  font-family: 'Courier New', Courier, monospace;
}

.patient-info-row {
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

.treatment-mode-row {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-wrap: wrap;
  margin: 4px 0;
  cursor: pointer;
  padding: 3px 6px;
  border-radius: 4px;
  background: rgba(255, 152, 0, 0.08);
  transition: background 0.2s;
}

.treatment-mode-row:hover {
  background: rgba(255, 152, 0, 0.18);
}

.mode-highlight {
  color: #e6a23c;
  font-weight: 600;
  font-size: 13px;
}

.dialyzer-text,
.perfusor-text {
  color: #606266;
  font-size: 12px;
}

/* ==================== 空床位 ==================== */

.bed-card__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px 0 10px;
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
  font-size: 12px;
  color: #c0c4cc;
  margin-top: 6px;
  transition: color 0.2s;
}

/* ==================== 右栏 ==================== */

.right-panel {
  width: 220px;
  flex-shrink: 0;
  background: #fff;
  border-left: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.unscheduled-search {
  margin: 8px;
  flex-shrink: 0;
}

.patient-stats {
  padding: 6px 12px;
  font-size: 12px;
  color: #606266;
  background: #fafafa;
  border-bottom: 1px solid #ebeef5;
  flex-shrink: 0;
}

.stat-num {
  font-weight: 700;
  color: #409eff;
  margin: 0 2px;
}

.stat-num.warn {
  color: #e6a23c;
}

.unscheduled-list {
  flex: 1;
  overflow-y: auto;
  padding: 4px 0;
}

.unscheduled-item {
  padding: 8px 12px;
  cursor: grab;
  border-bottom: 1px solid #f0f0f0;
  transition: background 0.2s;
}

.unscheduled-item:hover {
  background: #ecf5ff;
}

.unscheduled-item:active {
  cursor: grabbing;
}

.unscheduled-name {
  font-size: 14px;
  font-weight: 700;
  color: #e6a23c;
}

.infectious-tag-small {
  font-size: 10px !important;
  transform: scale(0.85);
  margin-left: 4px;
}

.unscheduled-info {
  display: flex;
  gap: 6px;
  font-size: 11px;
  color: #909399;
  margin-top: 4px;
  flex-wrap: wrap;
}

.mode-tag-small {
  font-weight: 600;
}

.no-data {
  text-align: center;
  color: #c0c4cc;
  padding: 40px 0;
  font-size: 13px;
}

/* ==================== 弹窗内样式 ==================== */

.no-bed-hint {
  color: #e6a23c;
  font-size: 12px;
  margin-top: 4px;
}

.prescription-remark {
  padding: 12px;
  background: #fafafa;
  border-radius: 4px;
  font-size: 13px;
  color: #606266;
  line-height: 1.8;
}

/* ==================== Element Plus 深度覆盖 ==================== */

:deep(.el-menu) {
  border-right: none;
}

:deep(.el-sub-menu__title) {
  height: 40px;
  line-height: 40px;
  font-size: 13px;
  padding: 0 12px !important;
}

:deep(.el-menu-item) {
  height: 36px;
  line-height: 36px;
  font-size: 12px;
  padding: 0 12px 0 28px !important;
}

:deep(.el-menu--collapse) {
  width: 120px;
}
</style>
