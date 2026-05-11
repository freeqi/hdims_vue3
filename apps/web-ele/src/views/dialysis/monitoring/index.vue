<script lang="ts" setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue';
import { Page } from '@vben/common-ui';
import {
  ElButton,
  ElInput,
  ElSelect,
  ElOption,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInputNumber,
  ElTag,
  ElMessage,
  ElDescriptions,
  ElDescriptionsItem,
  ElDivider,
  ElTooltip,
  ElEmpty,
  ElCard,
} from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';

// ==================== 类型定义 ====================

/** 签到状态枚举 */
enum SignStatus {
  Pending = 0,    // 待签到
  SignedIn = 5,   // 已签到
  Dialyzing = 10, // 透析中
  Completed = 15, // 已完成
  OffMachine = 20, // 下机
}

/** 已签到患者列表项 */
interface SignedPatient {
  patientId: string;
  patientName: string;
  gender: string;
  age: number;
  patientNo: string;
  bedNo: string;
  treatmentArea: string;
  treatmentMode: string;
  state: SignStatus;
  bloodInfectious: string;
  signInTime?: string;
}

/** 患者详细信息 */
interface PatientInfo {
  patientId: string;
  patientName: string;
  gender: string;
  age: number;
  patientNo: string;
  treatmentArea: string;
  bedNo: string;
  treatmentMode: string;
  dialyzer: string;
  anticoagulant: string;
  anticoagulantFirstDose: string;
  anticoagulantAdditionalDose: string;
  vascularAccess: string;
  allergyRecord: string;
  mainDiagnosis: string;
  dryWeight: number;
}

/** 透析处方信息 */
interface DialysisPrescription {
  treatmentTime: string;
  bloodFlowRate: string;
  dialysateFlowRate: string;
  ultrafiltrationVolume: string;
  targetWeightLoss: string;
  dialysateTemperature: string;
  anticoagulantFirstDose: string;
  anticoagulantAdditionalDose: string;
}

/** 签到表单 */
interface SignInForm {
  preWeight: number | undefined;
  systolicBP: number | undefined;
  diastolicBP: number | undefined;
  heartRate: number | undefined;
  temperature: number | undefined;
  remark: string;
}

/** 干体重调整表单 */
interface DryWeightForm {
  currentDryWeight: number;
  newDryWeight: number | undefined;
  reason: string;
}

/** 传染病检查记录 */
interface InfectiousRecord {
  id: string;
  itemName: string;
  result: string;
  checkDate: string;
  reportDate: string;
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

/** 签到状态标签配置 */
const STATUS_TAG_MAP: Record<
  SignStatus,
  { label: string; type: '' | 'success' | 'warning' | 'danger' | 'info' }
> = {
  [SignStatus.Pending]: { label: '待签到', type: 'info' },
  [SignStatus.SignedIn]: { label: '已签到', type: 'success' },
  [SignStatus.Dialyzing]: { label: '透析中', type: '' },
  [SignStatus.Completed]: { label: '已完成', type: 'success' },
  [SignStatus.OffMachine]: { label: '下机', type: 'warning' },
};

// ==================== 状态 ====================

const loading = ref(false);

// 左栏
const leftCollapsed = ref(false);
const searchKeyword = ref('');
const filterArea = ref('');

// 中栏
const currentDateTime = ref('');
const currentShift = ref('上午');
const selectedPatientId = ref<string | null>(null);
const dateTimeTimer = ref<ReturnType<typeof setInterval> | null>(null);

// 患者列表
const patientList = ref<SignedPatient[]>([]);

// 选中患者详情
const selectedPatient = ref<SignedPatient | null>(null);
const patientInfo = ref<PatientInfo | null>(null);
const prescriptionInfo = ref<DialysisPrescription | null>(null);

// 签到表单
const signInFormRef = ref<FormInstance>();
const signInForm = reactive<SignInForm>({
  preWeight: undefined,
  systolicBP: undefined,
  diastolicBP: undefined,
  heartRate: undefined,
  temperature: undefined,
  remark: '',
});

const signInFormRules: FormRules<SignInForm> = {
  preWeight: [
    { required: true, message: '请输入透析前体重', trigger: 'blur' },
    { type: 'number', min: 20, max: 200, message: '体重范围 20-200kg', trigger: 'blur' },
  ],
  systolicBP: [
    { type: 'number', min: 60, max: 260, message: '收缩压范围 60-260mmHg', trigger: 'blur' },
  ],
  diastolicBP: [
    { type: 'number', min: 30, max: 160, message: '舒张压范围 30-160mmHg', trigger: 'blur' },
  ],
  heartRate: [
    { type: 'number', min: 30, max: 200, message: '心率范围 30-200次/分', trigger: 'blur' },
  ],
  temperature: [
    { type: 'number', min: 34, max: 42, message: '体温范围 34-42°C', trigger: 'blur' },
  ],
};

// 弹窗
const dryWeightDialogVisible = ref(false);
const dryWeightFormRef = ref<FormInstance>();
const dryWeightForm = reactive<DryWeightForm>({
  currentDryWeight: 0,
  newDryWeight: undefined,
  reason: '',
});

const infectiousDialogVisible = ref(false);
const infectiousRecords = ref<InfectiousRecord[]>([]);

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

// /** 获取已签到患者列表 */
// async function fetchSignedPatients() {
//   loading.value = true;
//   try {
//     const res = await axios.get('/api/v1/SignInManage/4001', {
//       params: { Shift: currentShift.value, Area: filterArea.value },
//       headers: getHeaders(),
//     });
//     if (res.data?.Code === 200) {
//       patientList.value = res.data.Data ?? [];
//     }
//   } finally {
//     loading.value = false;
//   }
// }

// /** 确认签到 */
// async function confirmSignIn(data: SignInForm) {
//   const res = await axios.post('/api/v1/SignInManage/1001', {
//     PatientId: selectedPatientId.value,
//     PreWeight: data.preWeight,
//     SystolicBP: data.systolicBP,
//     DiastolicBP: data.diastolicBP,
//     HeartRate: data.heartRate,
//     Temperature: data.temperature,
//     Remark: data.remark,
//   }, { headers: getHeaders() });
//   return res.data;
// }

// /** 获取患者信息 */
// async function fetchPatientInfo(patientId: string) {
//   const res = await axios.get('/api/v1/OpenDoctorAdvice/4003', {
//     params: { PatientId: patientId },
//     headers: getHeaders(),
//   });
//   if (res.data?.Code === 200) {
//     patientInfo.value = res.data.Data;
//   }
// }

// /** 获取诊断信息 */
// async function fetchDiagnosisInfo(patientId: string) {
//   const res = await axios.get('/api/v1/CaseHomePage/4001', {
//     params: { PatientId: patientId },
//     headers: getHeaders(),
//   });
//   if (res.data?.Code === 200) {
//     // 合并诊断信息到 patientInfo
//   }
// }

// /** 获取排班信息 */
// async function fetchScheduleInfo() {
//   const res = await axios.get('/api/v1/SchedulingManage/4017', {
//     headers: getHeaders(),
//   });
//   if (res.data?.Code === 200) {
//     // 更新排班相关数据
//   }
// }

// ==================== Mock 数据 ====================

function generateMockPatients(): SignedPatient[] {
  return [
    {
      patientId: 'P10001', patientName: '张三', gender: '男', age: 58,
      patientNo: '2024001001', bedNo: '1号床', treatmentArea: '一区',
      treatmentMode: 'HD', state: SignStatus.SignedIn, bloodInfectious: '乙肝',
      signInTime: '2026-05-11 07:35',
    },
    {
      patientId: 'P10002', patientName: '李四', gender: '女', age: 45,
      patientNo: '2024001002', bedNo: '2号床', treatmentArea: '一区',
      treatmentMode: 'HDF', state: SignStatus.Dialyzing, bloodInfectious: '',
      signInTime: '2026-05-11 07:40',
    },
    {
      patientId: 'P10003', patientName: '王五', gender: '男', age: 62,
      patientNo: '2024001003', bedNo: '3号床', treatmentArea: '一区',
      treatmentMode: 'HD+HP', state: SignStatus.Pending, bloodInfectious: '丙肝',
    },
    {
      patientId: 'P10004', patientName: '赵六', gender: '男', age: 71,
      patientNo: '2024001004', bedNo: '4号床', treatmentArea: '二区',
      treatmentMode: 'HD', state: SignStatus.Completed, bloodInfectious: '',
      signInTime: '2026-05-11 07:50',
    },
    {
      patientId: 'P10005', patientName: '钱七', gender: '女', age: 53,
      patientNo: '2024001005', bedNo: '5号床', treatmentArea: '二区',
      treatmentMode: 'CRRT', state: SignStatus.OffMachine, bloodInfectious: 'HIV',
      signInTime: '2026-05-11 07:55',
    },
    {
      patientId: 'P10006', patientName: '孙八', gender: '男', age: 39,
      patientNo: '2024001006', bedNo: '7号床', treatmentArea: '三区',
      treatmentMode: 'HF', state: SignStatus.SignedIn, bloodInfectious: '',
      signInTime: '2026-05-11 08:00',
    },
    {
      patientId: 'P10007', patientName: '周九', gender: '女', age: 67,
      patientNo: '2024001007', bedNo: '10号床', treatmentArea: '三区',
      treatmentMode: 'HDF', state: SignStatus.Pending, bloodInfectious: '梅毒',
    },
    {
      patientId: 'P10008', patientName: '吴十', gender: '男', age: 44,
      patientNo: '2024001008', bedNo: '11号床', treatmentArea: '四区',
      treatmentMode: 'HD', state: SignStatus.Dialyzing, bloodInfectious: '',
      signInTime: '2026-05-11 08:10',
    },
    {
      patientId: 'P10009', patientName: '郑十一', gender: '女', age: 56,
      patientNo: '2024001009', bedNo: '12号床', treatmentArea: '四区',
      treatmentMode: 'HD', state: SignStatus.Pending, bloodInfectious: '乙肝',
    },
    {
      patientId: 'P10010', patientName: '冯十二', gender: '男', age: 68,
      patientNo: '2024001010', bedNo: '13号床', treatmentArea: '四区',
      treatmentMode: 'HD+HP', state: SignStatus.SignedIn, bloodInfectious: '',
      signInTime: '2026-05-11 08:15',
    },
  ];
}

function generateMockPatientInfo(patientId: string): PatientInfo {
  const infoMap: Record<string, PatientInfo> = {
    P10001: {
      patientId: 'P10001', patientName: '张三', gender: '男', age: 58,
      patientNo: '2024001001', treatmentArea: '一区', bedNo: '1号床',
      treatmentMode: 'HD', dialyzer: 'FX80', anticoagulant: '低分子肝素',
      anticoagulantFirstDose: '4000IU', anticoagulantAdditionalDose: '追加 2000IU/4h',
      vascularAccess: '动静脉内瘘（左前臂）', allergyRecord: '青霉素过敏',
      mainDiagnosis: '慢性肾脏病5期、肾性贫血、肾性骨病',
      dryWeight: 68.5,
    },
    P10002: {
      patientId: 'P10002', patientName: '李四', gender: '女', age: 45,
      patientNo: '2024001002', treatmentArea: '一区', bedNo: '2号床',
      treatmentMode: 'HDF', dialyzer: 'FX100', anticoagulant: '普通肝素',
      anticoagulantFirstDose: '2000IU', anticoagulantAdditionalDose: '追加 1000IU/4h',
      vascularAccess: '中心静脉导管（右颈内）', allergyRecord: '无',
      mainDiagnosis: '慢性肾脏病5期、糖尿病肾病',
      dryWeight: 55.0,
    },
    P10003: {
      patientId: 'P10003', patientName: '王五', gender: '男', age: 62,
      patientNo: '2024001003', treatmentArea: '一区', bedNo: '3号床',
      treatmentMode: 'HD+HP', dialyzer: 'F60S', anticoagulant: '低分子肝素',
      anticoagulantFirstDose: '5000IU', anticoagulantAdditionalDose: '追加 2500IU/4h',
      vascularAccess: '动静脉内瘘（右前臂）', allergyRecord: '无',
      mainDiagnosis: '慢性肾脏病5期、高血压肾病',
      dryWeight: 72.0,
    },
    P10004: {
      patientId: 'P10004', patientName: '赵六', gender: '男', age: 71,
      patientNo: '2024001004', treatmentArea: '二区', bedNo: '4号床',
      treatmentMode: 'HD', dialyzer: 'F80S', anticoagulant: '无肝素',
      anticoagulantFirstDose: '-', anticoagulantAdditionalDose: '-',
      vascularAccess: '人造血管（左上臂）', allergyRecord: '磺胺类药物过敏',
      mainDiagnosis: '慢性肾脏病5期、冠心病',
      dryWeight: 65.0,
    },
    P10005: {
      patientId: 'P10005', patientName: '钱七', gender: '女', age: 53,
      patientNo: '2024001005', treatmentArea: '二区', bedNo: '5号床',
      treatmentMode: 'CRRT', dialyzer: 'Polyflux 17L', anticoagulant: '局部枸橼酸',
      anticoagulantFirstDose: '200ml/h', anticoagulantAdditionalDose: '-',
      vascularAccess: '中心静脉导管（右股静脉）', allergyRecord: '头孢类过敏',
      mainDiagnosis: '急性肾损伤、脓毒症',
      dryWeight: 58.0,
    },
    P10006: {
      patientId: 'P10006', patientName: '孙八', gender: '男', age: 39,
      patientNo: '2024001006', treatmentArea: '三区', bedNo: '7号床',
      treatmentMode: 'HF', dialyzer: 'FX80', anticoagulant: '低分子肝素',
      anticoagulantFirstDose: '4000IU', anticoagulantAdditionalDose: '追加 2000IU/4h',
      vascularAccess: '动静脉内瘘（左前臂）', allergyRecord: '无',
      mainDiagnosis: '慢性肾脏病5期、IgA肾病',
      dryWeight: 75.0,
    },
    P10007: {
      patientId: 'P10007', patientName: '周九', gender: '女', age: 67,
      patientNo: '2024001007', treatmentArea: '三区', bedNo: '10号床',
      treatmentMode: 'HDF', dialyzer: 'FX100', anticoagulant: '普通肝素',
      anticoagulantFirstDose: '1500IU', anticoagulantAdditionalDose: '追加 750IU/4h',
      vascularAccess: '直接穿刺（右桡动脉）', allergyRecord: '无',
      mainDiagnosis: '慢性肾脏病5期、高血压肾病、肾性贫血',
      dryWeight: 52.0,
    },
    P10008: {
      patientId: 'P10008', patientName: '吴十', gender: '男', age: 44,
      patientNo: '2024001008', treatmentArea: '四区', bedNo: '11号床',
      treatmentMode: 'HD', dialyzer: 'FX80', anticoagulant: '低分子肝素',
      anticoagulantFirstDose: '4000IU', anticoagulantAdditionalDose: '追加 2000IU/4h',
      vascularAccess: '动静脉内瘘（右前臂）', allergyRecord: '无',
      mainDiagnosis: '慢性肾脏病5期',
      dryWeight: 70.0,
    },
    P10009: {
      patientId: 'P10009', patientName: '郑十一', gender: '女', age: 56,
      patientNo: '2024001009', treatmentArea: '四区', bedNo: '12号床',
      treatmentMode: 'HD', dialyzer: 'F60S', anticoagulant: '低分子肝素',
      anticoagulantFirstDose: '3000IU', anticoagulantAdditionalDose: '追加 1500IU/4h',
      vascularAccess: '中心静脉导管（左颈内）', allergyRecord: '无',
      mainDiagnosis: '慢性肾脏病5期、糖尿病肾病、视网膜病变',
      dryWeight: 60.0,
    },
    P10010: {
      patientId: 'P10010', patientName: '冯十二', gender: '男', age: 68,
      patientNo: '2024001010', treatmentArea: '四区', bedNo: '13号床',
      treatmentMode: 'HD+HP', dialyzer: 'F60S', anticoagulant: '低分子肝素',
      anticoagulantFirstDose: '4000IU', anticoagulantAdditionalDose: '追加 2000IU/4h',
      vascularAccess: '动静脉内瘘（左前臂）', allergyRecord: '无',
      mainDiagnosis: '慢性肾脏病5期、多囊肾',
      dryWeight: 78.0,
    },
  };
  return infoMap[patientId] || infoMap['P10001']!;
}

function generateMockPrescription(patientId: string): DialysisPrescription {
  const base: DialysisPrescription = {
    treatmentTime: '4小时',
    bloodFlowRate: '250ml/min',
    dialysateFlowRate: '500ml/min',
    ultrafiltrationVolume: '2000ml',
    targetWeightLoss: '2.0kg',
    dialysateTemperature: '36.5°C',
    anticoagulantFirstDose: '4000IU',
    anticoagulantAdditionalDose: '追加 2000IU/4h',
  };

  const overrides: Partial<Record<string, DialysisPrescription>> = {
    P10002: { treatmentTime: '4.5小时', bloodFlowRate: '280ml/min', ultrafiltrationVolume: '2500ml', targetWeightLoss: '2.5kg' },
    P10003: { treatmentTime: '4小时', bloodFlowRate: '230ml/min', ultrafiltrationVolume: '3000ml', targetWeightLoss: '3.0kg' },
    P10005: { treatmentTime: '24小时', bloodFlowRate: '200ml/min', dialysateFlowRate: '-', ultrafiltrationVolume: '1000ml/h', targetWeightLoss: '-', dialysateTemperature: '37.0°C', anticoagulantFirstDose: '200ml/h', anticoagulantAdditionalDose: '-' },
    P10006: { treatmentTime: '4小时', bloodFlowRate: '260ml/min', ultrafiltrationVolume: '1800ml', targetWeightLoss: '1.8kg' },
  };

  return overrides[patientId] ? { ...base, ...overrides[patientId] } : base;
}

function generateMockInfectiousRecords(patientId: string): InfectiousRecord[] {
  const records: Record<string, InfectiousRecord[]> = {
    P10001: [
      { id: 'IR001', itemName: '乙肝表面抗原(HBsAg)', result: '阳性(+)', checkDate: '2026-04-20', reportDate: '2026-04-22' },
      { id: 'IR002', itemName: '乙肝e抗原(HBeAg)', result: '阴性(-)', checkDate: '2026-04-20', reportDate: '2026-04-22' },
      { id: 'IR003', itemName: '丙肝抗体(anti-HCV)', result: '阴性(-)', checkDate: '2026-04-20', reportDate: '2026-04-22' },
      { id: 'IR004', itemName: 'HIV抗体', result: '阴性(-)', checkDate: '2026-04-20', reportDate: '2026-04-22' },
      { id: 'IR005', itemName: '梅毒螺旋体抗体', result: '阴性(-)', checkDate: '2026-04-20', reportDate: '2026-04-22' },
    ],
    P10003: [
      { id: 'IR006', itemName: '乙肝表面抗原(HBsAg)', result: '阴性(-)', checkDate: '2026-04-18', reportDate: '2026-04-20' },
      { id: 'IR007', itemName: '丙肝抗体(anti-HCV)', result: '阳性(+)', checkDate: '2026-04-18', reportDate: '2026-04-20' },
      { id: 'IR008', itemName: 'HIV抗体', result: '阴性(-)', checkDate: '2026-04-18', reportDate: '2026-04-20' },
      { id: 'IR009', itemName: '梅毒螺旋体抗体', result: '阴性(-)', checkDate: '2026-04-18', reportDate: '2026-04-20' },
    ],
    P10005: [
      { id: 'IR010', itemName: '乙肝表面抗原(HBsAg)', result: '阴性(-)', checkDate: '2026-05-01', reportDate: '2026-05-03' },
      { id: 'IR011', itemName: '丙肝抗体(anti-HCV)', result: '阴性(-)', checkDate: '2026-05-01', reportDate: '2026-05-03' },
      { id: 'IR012', itemName: 'HIV抗体', result: '阳性(+)', checkDate: '2026-05-01', reportDate: '2026-05-03' },
      { id: 'IR013', itemName: '梅毒螺旋体抗体', result: '阴性(-)', checkDate: '2026-05-01', reportDate: '2026-05-03' },
    ],
    P10007: [
      { id: 'IR014', itemName: '乙肝表面抗原(HBsAg)', result: '阴性(-)', checkDate: '2026-04-25', reportDate: '2026-04-27' },
      { id: 'IR015', itemName: '丙肝抗体(anti-HCV)', result: '阴性(-)', checkDate: '2026-04-25', reportDate: '2026-04-27' },
      { id: 'IR016', itemName: 'HIV抗体', result: '阴性(-)', checkDate: '2026-04-25', reportDate: '2026-04-27' },
      { id: 'IR017', itemName: '梅毒螺旋体抗体', result: '阳性(+)', checkDate: '2026-04-25', reportDate: '2026-04-27' },
    ],
    P10009: [
      { id: 'IR018', itemName: '乙肝表面抗原(HBsAg)', result: '阳性(+)', checkDate: '2026-04-28', reportDate: '2026-04-30' },
      { id: 'IR019', itemName: '丙肝抗体(anti-HCV)', result: '阴性(-)', checkDate: '2026-04-28', reportDate: '2026-04-30' },
      { id: 'IR020', itemName: 'HIV抗体', result: '阴性(-)', checkDate: '2026-04-28', reportDate: '2026-04-30' },
      { id: 'IR021', itemName: '梅毒螺旋体抗体', result: '阴性(-)', checkDate: '2026-04-28', reportDate: '2026-04-30' },
    ],
  };

  return records[patientId] || [
    { id: 'IR_DEFAULT_1', itemName: '乙肝表面抗原(HBsAg)', result: '阴性(-)', checkDate: '2026-04-20', reportDate: '2026-04-22' },
    { id: 'IR_DEFAULT_2', itemName: '丙肝抗体(anti-HCV)', result: '阴性(-)', checkDate: '2026-04-20', reportDate: '2026-04-22' },
    { id: 'IR_DEFAULT_3', itemName: 'HIV抗体', result: '阴性(-)', checkDate: '2026-04-20', reportDate: '2026-04-22' },
    { id: 'IR_DEFAULT_4', itemName: '梅毒螺旋体抗体', result: '阴性(-)', checkDate: '2026-04-20', reportDate: '2026-04-22' },
  ];
}

// ==================== 工具函数 ====================

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDateTime(date: Date): string {
  const y = date.getFullYear();
  const mo = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const mi = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  return `${y}-${mo}-${d} ${h}:${mi}:${s}`;
}

function getShiftByHour(): string {
  const hour = new Date().getHours();
  if (hour < 12) return '上午';
  if (hour < 18) return '下午';
  return '晚上';
}

function getStatusTag(status: SignStatus) {
  return STATUS_TAG_MAP[status] || { label: '未知', type: 'info' as const };
}

// ==================== 计算属性 ====================

/** 筛选后的患者列表 */
const filteredPatients = computed(() => {
  let data = patientList.value;
  if (filterArea.value) {
    data = data.filter((p) => p.treatmentArea === filterArea.value);
  }
  if (searchKeyword.value) {
    const kw = searchKeyword.value.toLowerCase();
    data = data.filter(
      (p) =>
        p.patientName.toLowerCase().includes(kw) ||
        p.patientNo.toLowerCase().includes(kw) ||
        p.bedNo.toLowerCase().includes(kw) ||
        p.treatmentMode.toLowerCase().includes(kw),
    );
  }
  return data;
});

/** 当前选中患者是否已签到 */
const isSelectedSignedIn = computed(() => {
  return selectedPatient.value && selectedPatient.value.state >= SignStatus.SignedIn;
});

/** 当前选中患者是否待签到 */
const isSelectedPending = computed(() => {
  return selectedPatient.value && selectedPatient.value.state < SignStatus.SignedIn;
});

/** 统计数据 */
const stats = computed(() => {
  const total = patientList.value.length;
  const signed = patientList.value.filter((p) => p.state >= SignStatus.SignedIn).length;
  const pending = patientList.value.filter((p) => p.state < SignStatus.SignedIn).length;
  const dialyzing = patientList.value.filter((p) => p.state === SignStatus.Dialyzing).length;
  const completed = patientList.value.filter((p) => p.state === SignStatus.Completed).length;
  return { total, signed, pending, dialyzing, completed };
});

// ==================== 业务逻辑 ====================

/** 更新当前时间 */
function updateDateTime() {
  currentDateTime.value = formatDateTime(new Date());
}

/** 加载患者列表 */
function loadPatients() {
  loading.value = true;
  setTimeout(() => {
    patientList.value = generateMockPatients();
    loading.value = false;
  }, 300);
}

/** 选中患者 */
function handleSelectPatient(patient: SignedPatient) {
  selectedPatientId.value = patient.patientId;
  selectedPatient.value = patient;

  if (patient.state >= SignStatus.SignedIn) {
    // 已签到，加载患者详情
    patientInfo.value = generateMockPatientInfo(patient.patientId);
    prescriptionInfo.value = generateMockPrescription(patient.patientId);
  } else {
    patientInfo.value = null;
    prescriptionInfo.value = null;
  }

  // 重置签到表单
  Object.assign(signInForm, {
    preWeight: undefined,
    systolicBP: undefined,
    diastolicBP: undefined,
    heartRate: undefined,
    temperature: undefined,
    remark: '',
  });
}

/** 确认签到 */
async function handleSignIn() {
  if (!signInFormRef.value || !selectedPatientId.value) return;
  await signInFormRef.value.validate(async (valid) => {
    if (!valid) return;
    try {
      // await confirmSignIn(signInForm);
      ElMessage.success(`患者"${selectedPatient.value?.patientName}"签到成功`);
      // 更新本地状态
      if (selectedPatient.value) {
        selectedPatient.value.state = SignStatus.SignedIn;
        selectedPatient.value.signInTime = formatDateTime(new Date());
        const idx = patientList.value.findIndex((p) => p.patientId === selectedPatientId.value);
        if (idx !== -1) {
          patientList.value[idx]!.state = SignStatus.SignedIn;
          patientList.value[idx]!.signInTime = formatDateTime(new Date());
        }
        // 加载详情
        patientInfo.value = generateMockPatientInfo(selectedPatient.value.patientId);
        prescriptionInfo.value = generateMockPrescription(selectedPatient.value.patientId);
      }
    } catch {
      ElMessage.error('签到失败，请重试');
    }
  });
}

/** 切换左栏收缩状态 */
function toggleLeftPanel() {
  leftCollapsed.value = !leftCollapsed.value;
  localStorage.setItem('signIn_leftCollapsed', String(leftCollapsed.value));
}

/** 更新透析方案 */
function handleUpdatePrescription() {
  ElMessage.info('更新透析方案功能开发中...');
}

/** 开医嘱 */
function handleOpenDoctorAdvice() {
  ElMessage.info('开医嘱功能开发中...');
}

/** 透析记录单 */
function handleDialysisRecord() {
  ElMessage.info('透析记录单功能开发中...');
}

/** 上机 */
function handleStartMachine() {
  if (!selectedPatient.value) return;
  ElMessage.success(`患者"${selectedPatient.value.patientName}"已上机`);
  selectedPatient.value.state = SignStatus.Dialyzing;
  const idx = patientList.value.findIndex((p) => p.patientId === selectedPatientId.value);
  if (idx !== -1) {
    patientList.value[idx]!.state = SignStatus.Dialyzing;
  }
}

/** 下机 */
function handleStopMachine() {
  if (!selectedPatient.value) return;
  ElMessage.success(`患者"${selectedPatient.value.patientName}"已下机`);
  selectedPatient.value.state = SignStatus.OffMachine;
  const idx = patientList.value.findIndex((p) => p.patientId === selectedPatientId.value);
  if (idx !== -1) {
    patientList.value[idx]!.state = SignStatus.OffMachine;
  }
}

/** 打开干体重调整弹窗 */
function handleOpenDryWeightDialog() {
  if (!patientInfo.value) return;
  dryWeightForm.currentDryWeight = patientInfo.value.dryWeight;
  dryWeightForm.newDryWeight = undefined;
  dryWeightForm.reason = '';
  dryWeightDialogVisible.value = true;
}

/** 确认干体重调整 */
async function handleDryWeightSubmit() {
  if (!dryWeightFormRef.value) return;
  await dryWeightFormRef.value.validate(async (valid) => {
    if (!valid) return;
    try {
      ElMessage.success('干体重调整成功');
      if (patientInfo.value) {
        patientInfo.value.dryWeight = dryWeightForm.newDryWeight!;
      }
      dryWeightDialogVisible.value = false;
    } catch {
      ElMessage.error('干体重调整失败');
    }
  });
}

/** 打开传染病检查弹窗 */
function handleOpenInfectiousDialog() {
  if (!selectedPatientId.value) return;
  infectiousRecords.value = generateMockInfectiousRecords(selectedPatientId.value);
  infectiousDialogVisible.value = true;
}

/** 获取传染病结果标签类型 */
function getInfectiousResultType(result: string): '' | 'success' | 'warning' | 'danger' | 'info' {
  if (result.includes('阳性') || result.includes('+')) return 'danger';
  if (result.includes('阴性') || result.includes('-')) return 'success';
  return 'info';
}

// ==================== 生命周期 ====================

onMounted(() => {
  // 恢复左栏收缩状态
  const saved = localStorage.getItem('signIn_leftCollapsed');
  if (saved !== null) {
    leftCollapsed.value = saved === 'true';
  }

  // 初始化时间
  updateDateTime();
  dateTimeTimer.value = setInterval(updateDateTime, 1000);

  // 初始化班次
  currentShift.value = getShiftByHour();

  // 加载数据
  loadPatients();
});

onUnmounted(() => {
  if (dateTimeTimer.value) {
    clearInterval(dateTimeTimer.value);
  }
});
</script>

<template>
  <Page title="患者签到">
    <div class="sign-in-container">
      <!-- ========== 左栏：已签到患者列表 ========== -->
      <div
        class="left-panel"
        :class="{ 'left-panel--collapsed': leftCollapsed }"
      >
        <!-- 收缩/展开按钮 -->
        <div class="collapse-btn" @click="toggleLeftPanel">
          <svg
            viewBox="0 0 1024 1024"
            width="16"
            height="16"
            xmlns="http://www.w3.org/2000/svg"
            :style="{ transform: leftCollapsed ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }"
          >
            <path
              fill="currentColor"
              d="M348.2 761.6L607.4 512 348.2 262.4c-12.8-12.8-12.8-33.8 0-46.6 12.8-12.8 33.8-12.8 46.6 0l284.8 275.2c12.8 12.8 12.8 33.8 0 46.6L394.8 812.8c-12.8 12.8-33.8 12.8-46.6 0-12.8-12.8-12.8-33.8 0-46.6z"
            />
          </svg>
        </div>

        <!-- 搜索框 -->
        <div v-show="!leftCollapsed" class="left-search">
          <ElInput
            v-model="searchKeyword"
            placeholder="搜索患者姓名/编号"
            clearable
            size="small"
          />
        </div>

        <!-- 统计 -->
        <div v-show="!leftCollapsed" class="patient-stats-bar">
          <span>共 <b>{{ stats.total }}</b> 人</span>
          <span class="stat-signed">已签 <b>{{ stats.signed }}</b></span>
          <span class="stat-pending">待签 <b>{{ stats.pending }}</b></span>
        </div>

        <!-- 患者列表 -->
        <div v-show="!leftCollapsed" v-loading="loading" class="patient-list">
          <div
            v-for="patient in filteredPatients"
            :key="patient.patientId"
            class="patient-item"
            :class="{ 'patient-item--active': selectedPatientId === patient.patientId }"
            @click="handleSelectPatient(patient)"
          >
            <div class="patient-item__header">
              <span class="patient-item__name">{{ patient.patientName }}</span>
              <span
                v-if="patient.bloodInfectious"
                class="infectious-dot"
                :title="patient.bloodInfectious"
              />
              <ElTag
                :type="getStatusTag(patient.state).type"
                size="small"
                effect="light"
                class="status-tag"
              >
                {{ getStatusTag(patient.state).label }}
              </ElTag>
            </div>
            <div class="patient-item__info">
              <span class="bed-info">{{ patient.bedNo }}</span>
              <span class="mode-info">{{ patient.treatmentMode }}</span>
            </div>
          </div>
          <div v-if="filteredPatients.length === 0 && !loading" class="no-data">
            暂无患者数据
          </div>
        </div>
      </div>

      <!-- ========== 中栏：签到操作区域 ========== -->
      <div class="center-panel">
        <!-- 顶部信息栏 -->
        <div class="top-bar">
          <div class="top-bar__left">
            <span class="current-datetime">{{ currentDateTime }}</span>
            <ElDivider direction="vertical" />
            <span class="current-shift">班次：</span>
            <ElSelect v-model="currentShift" size="small" style="width: 90px" @change="loadPatients">
              <ElOption
                v-for="item in SHIFT_OPTIONS"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </ElSelect>
            <ElDivider direction="vertical" />
            <span class="filter-label">分区：</span>
            <ElSelect
              v-model="filterArea"
              placeholder="全部"
              clearable
              size="small"
              style="width: 100px"
              @change="loadPatients"
            >
              <ElOption
                v-for="item in AREA_OPTIONS"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </ElSelect>
          </div>
          <div class="top-bar__right">
            <ElTag type="info" effect="plain" size="small">
              透析中 {{ stats.dialyzing }} 人
            </ElTag>
            <ElTag type="success" effect="plain" size="small">
              已完成 {{ stats.completed }} 人
            </ElTag>
          </div>
        </div>

        <!-- 主体内容 -->
        <div class="main-content">
          <!-- 未选择患者 -->
          <div v-if="!selectedPatient" class="empty-state">
            <ElEmpty description="请从左侧选择患者" />
          </div>

          <!-- 选中患者但未签到 -->
          <div v-else-if="isSelectedPending" class="sign-in-section">
            <div class="sign-in-prompt">
              <ElTag type="warning" size="large" effect="light">
                该患者还未确认签到
              </ElTag>
            </div>

            <ElCard shadow="hover" class="sign-in-card">
              <template #header>
                <div class="card-header">
                  <span class="card-header__title">签到信息</span>
                  <span class="card-header__patient">
                    {{ selectedPatient.patientName }} / {{ selectedPatient.bedNo }}
                  </span>
                </div>
              </template>
              <ElForm
                ref="signInFormRef"
                :model="signInForm"
                :rules="signInFormRules"
                label-width="120px"
                label-position="right"
                size="default"
              >
                <ElFormItem label="透析前体重" prop="preWeight">
                  <ElInputNumber
                    v-model="signInForm.preWeight"
                    :min="20"
                    :max="200"
                    :precision="1"
                    :step="0.5"
                    placeholder="请输入透析前体重"
                    style="width: 220px"
                  />
                  <span class="form-unit">kg</span>
                </ElFormItem>
                <ElFormItem label="收缩压" prop="systolicBP">
                  <ElInputNumber
                    v-model="signInForm.systolicBP"
                    :min="60"
                    :max="260"
                    :step="1"
                    placeholder="收缩压"
                    style="width: 220px"
                  />
                  <span class="form-unit">mmHg</span>
                </ElFormItem>
                <ElFormItem label="舒张压" prop="diastolicBP">
                  <ElInputNumber
                    v-model="signInForm.diastolicBP"
                    :min="30"
                    :max="160"
                    :step="1"
                    placeholder="舒张压"
                    style="width: 220px"
                  />
                  <span class="form-unit">mmHg</span>
                </ElFormItem>
                <ElFormItem label="心率" prop="heartRate">
                  <ElInputNumber
                    v-model="signInForm.heartRate"
                    :min="30"
                    :max="200"
                    :step="1"
                    placeholder="心率"
                    style="width: 220px"
                  />
                  <span class="form-unit">次/分</span>
                </ElFormItem>
                <ElFormItem label="体温" prop="temperature">
                  <ElInputNumber
                    v-model="signInForm.temperature"
                    :min="34"
                    :max="42"
                    :precision="1"
                    :step="0.1"
                    placeholder="体温"
                    style="width: 220px"
                  />
                  <span class="form-unit">&deg;C</span>
                </ElFormItem>
                <ElFormItem label="透析前评估" prop="remark">
                  <ElInput
                    v-model="signInForm.remark"
                    type="textarea"
                    :rows="3"
                    placeholder="请输入透析前评估备注（选填）"
                    maxlength="500"
                    show-word-limit
                  />
                </ElFormItem>
                <ElFormItem>
                  <ElButton type="primary" size="large" @click="handleSignIn">
                    确认签到
                  </ElButton>
                </ElFormItem>
              </ElForm>
            </ElCard>
          </div>

          <!-- 已签到 -->
          <div v-else-if="isSelectedSignedIn" class="patient-detail-section">
            <!-- 患者基本信息卡片 -->
            <ElCard shadow="hover" class="detail-card">
              <template #header>
                <div class="card-header">
                  <span class="card-header__title">患者基本信息</span>
                  <div class="card-header__actions">
                    <ElTooltip content="干体重调整" placement="top">
                      <ElButton type="warning" link size="small" @click="handleOpenDryWeightDialog">
                        干体重调整
                      </ElButton>
                    </ElTooltip>
                    <ElTooltip content="传染病检查" placement="top">
                      <ElButton type="danger" link size="small" @click="handleOpenInfectiousDialog">
                        传染病检查
                      </ElButton>
                    </ElTooltip>
                  </div>
                </div>
              </template>
              <template v-if="patientInfo">
                <ElDescriptions :column="3" border size="small">
                  <ElDescriptionsItem label="姓名">{{ patientInfo.patientName }}</ElDescriptionsItem>
                  <ElDescriptionsItem label="性别">{{ patientInfo.gender }}</ElDescriptionsItem>
                  <ElDescriptionsItem label="年龄">{{ patientInfo.age }}岁</ElDescriptionsItem>
                  <ElDescriptionsItem label="患者编号">{{ patientInfo.patientNo }}</ElDescriptionsItem>
                  <ElDescriptionsItem label="治疗区域">{{ patientInfo.treatmentArea }}</ElDescriptionsItem>
                  <ElDescriptionsItem label="床号">{{ patientInfo.bedNo }}</ElDescriptionsItem>
                  <ElDescriptionsItem label="治疗模式">
                    <ElTag size="small" type="primary">{{ patientInfo.treatmentMode }}</ElTag>
                  </ElDescriptionsItem>
                  <ElDescriptionsItem label="透析器">{{ patientInfo.dialyzer }}</ElDescriptionsItem>
                  <ElDescriptionsItem label="干体重">
                    <span class="dry-weight-value">{{ patientInfo.dryWeight }} kg</span>
                  </ElDescriptionsItem>
                  <ElDescriptionsItem label="抗凝剂">{{ patientInfo.anticoagulant }}</ElDescriptionsItem>
                  <ElDescriptionsItem label="抗凝剂首剂">{{ patientInfo.anticoagulantFirstDose }}</ElDescriptionsItem>
                  <ElDescriptionsItem label="抗凝剂追加">{{ patientInfo.anticoagulantAdditionalDose }}</ElDescriptionsItem>
                  <ElDescriptionsItem label="血管通路">{{ patientInfo.vascularAccess }}</ElDescriptionsItem>
                  <ElDescriptionsItem label="过敏记录" :span="2">
                    <span :class="{ 'allergy-warning': patientInfo.allergyRecord && patientInfo.allergyRecord !== '无' }">
                      {{ patientInfo.allergyRecord || '无' }}
                    </span>
                  </ElDescriptionsItem>
                  <ElDescriptionsItem label="主要诊断" :span="3">
                    {{ patientInfo.mainDiagnosis }}
                  </ElDescriptionsItem>
                </ElDescriptions>
              </template>
            </ElCard>

            <!-- 透析处方信息卡片 -->
            <ElCard shadow="hover" class="detail-card">
              <template #header>
                <div class="card-header">
                  <span class="card-header__title">透析处方</span>
                </div>
              </template>
              <template v-if="prescriptionInfo">
                <ElDescriptions :column="3" border size="small">
                  <ElDescriptionsItem label="治疗时间">{{ prescriptionInfo.treatmentTime }}</ElDescriptionsItem>
                  <ElDescriptionsItem label="血流量">{{ prescriptionInfo.bloodFlowRate }}</ElDescriptionsItem>
                  <ElDescriptionsItem label="透析液流量">{{ prescriptionInfo.dialysateFlowRate }}</ElDescriptionsItem>
                  <ElDescriptionsItem label="超滤量">{{ prescriptionInfo.ultrafiltrationVolume }}</ElDescriptionsItem>
                  <ElDescriptionsItem label="目标脱水量">{{ prescriptionInfo.targetWeightLoss }}</ElDescriptionsItem>
                  <ElDescriptionsItem label="透析液温度">{{ prescriptionInfo.dialysateTemperature }}</ElDescriptionsItem>
                  <ElDescriptionsItem label="抗凝剂首剂">{{ prescriptionInfo.anticoagulantFirstDose }}</ElDescriptionsItem>
                  <ElDescriptionsItem label="抗凝剂追加">{{ prescriptionInfo.anticoagulantAdditionalDose }}</ElDescriptionsItem>
                </ElDescriptions>
              </template>
            </ElCard>

            <!-- 操作按钮区 -->
            <div class="action-buttons">
              <ElButton type="primary" plain @click="handleUpdatePrescription">
                更新透析方案
              </ElButton>
              <ElButton type="success" plain @click="handleOpenDoctorAdvice">
                开医嘱
              </ElButton>
              <ElButton type="info" plain @click="handleDialysisRecord">
                透析记录单
              </ElButton>
              <ElDivider direction="vertical" />
              <ElButton
                v-if="selectedPatient?.state === SignStatus.SignedIn"
                type="primary"
                @click="handleStartMachine"
              >
                上机
              </ElButton>
              <ElButton
                v-if="selectedPatient?.state === SignStatus.Dialyzing"
                type="warning"
                @click="handleStopMachine"
              >
                下机
              </ElButton>
              <ElTag
                v-if="selectedPatient?.state === SignStatus.OffMachine || selectedPatient?.state === SignStatus.Completed"
                type="success"
                effect="dark"
                size="large"
              >
                {{ getStatusTag(selectedPatient.state).label }}
              </ElTag>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ========== 干体重调整弹窗 ========== -->
    <ElDialog
      v-model="dryWeightDialogVisible"
      title="干体重调整"
      width="480px"
      destroy-on-close
    >
      <ElForm
        ref="dryWeightFormRef"
        :model="dryWeightForm"
        :rules="{
          newDryWeight: [
            { required: true, message: '请输入新干体重', trigger: 'blur' },
            { type: 'number', min: 30, max: 150, message: '干体重范围 30-150kg', trigger: 'blur' },
          ],
          reason: [{ required: true, message: '请输入调整原因', trigger: 'blur' }],
        }"
        label-width="100px"
      >
        <ElFormItem label="当前干体重">
          <span class="dry-weight-display">{{ dryWeightForm.currentDryWeight }} kg</span>
        </ElFormItem>
        <ElFormItem label="新干体重" prop="newDryWeight">
          <ElInputNumber
            v-model="dryWeightForm.newDryWeight"
            :min="30"
            :max="150"
            :precision="1"
            :step="0.5"
            placeholder="请输入新干体重"
            style="width: 100%"
          />
        </ElFormItem>
        <ElFormItem label="调整原因" prop="reason">
          <ElInput
            v-model="dryWeightForm.reason"
            type="textarea"
            :rows="3"
            placeholder="请输入干体重调整原因"
            maxlength="200"
            show-word-limit
          />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="dryWeightDialogVisible = false">取消</ElButton>
        <ElButton type="primary" @click="handleDryWeightSubmit">确认调整</ElButton>
      </template>
    </ElDialog>

    <!-- ========== 传染病检查弹窗 ========== -->
    <ElDialog
      v-model="infectiousDialogVisible"
      title="传染病检查结果"
      width="700px"
      destroy-on-close
    >
      <div v-if="selectedPatient" class="infectious-header">
        <span>患者：{{ selectedPatient.patientName }}</span>
        <ElTag
          v-if="selectedPatient.bloodInfectious"
          type="danger"
          size="small"
          effect="dark"
        >
          {{ selectedPatient.bloodInfectious }}
        </ElTag>
      </div>
      <ElDescriptions :column="1" border size="small" class="infectious-table">
        <ElDescriptionsItem
          v-for="record in infectiousRecords"
          :key="record.id"
          :label="record.itemName"
        >
          <div class="infectious-result-row">
            <ElTag
              :type="getInfectiousResultType(record.result)"
              size="small"
              effect="light"
            >
              {{ record.result }}
            </ElTag>
            <span class="infectious-date">
              检查日期：{{ record.checkDate }} | 报告日期：{{ record.reportDate }}
            </span>
          </div>
        </ElDescriptionsItem>
      </ElDescriptions>
      <template #footer>
        <ElButton @click="infectiousDialogVisible = false">关闭</ElButton>
      </template>
    </ElDialog>
  </Page>
</template>

<style scoped>
/* ==================== 三栏布局（左栏 + 中栏） ==================== */

.sign-in-container {
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
  width: 250px;
  flex-shrink: 0;
  background: #fff;
  border-right: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
  position: relative;
  overflow: hidden;
}

.left-panel--collapsed {
  width: 130px;
}

.collapse-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 36px;
  cursor: pointer;
  border-bottom: 1px solid #e4e7ed;
  color: #606266;
  transition: color 0.2s, background 0.2s;
  flex-shrink: 0;
}

.collapse-btn:hover {
  color: #409eff;
  background: #ecf5ff;
}

.left-search {
  padding: 8px 10px;
  flex-shrink: 0;
}

.patient-stats-bar {
  padding: 6px 10px;
  font-size: 12px;
  color: #606266;
  background: #fafafa;
  border-bottom: 1px solid #ebeef5;
  flex-shrink: 0;
  display: flex;
  gap: 8px;
}

.patient-stats-bar b {
  color: #409eff;
}

.stat-signed {
  color: #67c23a;
}

.stat-signed b {
  color: #67c23a !important;
}

.stat-pending {
  color: #e6a23c;
}

.stat-pending b {
  color: #e6a23c !important;
}

.patient-list {
  flex: 1;
  overflow-y: auto;
  padding: 4px 0;
}

.patient-item {
  padding: 10px 12px;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
  transition: background 0.2s;
}

.patient-item:hover {
  background: #ecf5ff;
}

.patient-item--active {
  background: #d9ecff;
  border-left: 3px solid #409eff;
}

.patient-item__header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.patient-item__name {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.infectious-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #f56c6c;
  flex-shrink: 0;
}

.status-tag {
  margin-left: auto;
  font-size: 11px !important;
}

.patient-item__info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #909399;
}

.bed-info {
  color: #606266;
  font-weight: 500;
}

.mode-info {
  color: #409eff;
  font-weight: 500;
}

.no-data {
  text-align: center;
  color: #c0c4cc;
  padding: 40px 0;
  font-size: 13px;
}

/* ==================== 中栏 ==================== */

.center-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
}

/* 顶部信息栏 */
.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 10px 16px;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  flex-shrink: 0;
}

.top-bar__left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.top-bar__right {
  display: flex;
  align-items: center;
  gap: 6px;
}

.current-datetime {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  font-family: 'Courier New', Courier, monospace;
}

.current-shift,
.filter-label {
  font-size: 13px;
  color: #606266;
}

/* 主体内容 */
.main-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

/* 空状态 */
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

/* 签到区域 */
.sign-in-section {
  max-width: 700px;
  margin: 0 auto;
}

.sign-in-prompt {
  text-align: center;
  margin-bottom: 20px;
}

.sign-in-card {
  margin-bottom: 16px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header__title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.card-header__patient {
  font-size: 13px;
  color: #909399;
}

.card-header__actions {
  display: flex;
  gap: 4px;
}

.form-unit {
  margin-left: 8px;
  color: #909399;
  font-size: 13px;
}

/* 患者详情区域 */
.patient-detail-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-card {
  flex-shrink: 0;
}

.dry-weight-value {
  font-weight: 700;
  color: #e6a23c;
  font-size: 14px;
}

.allergy-warning {
  color: #f56c6c;
  font-weight: 600;
}

/* 操作按钮区 */
.action-buttons {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 0;
  flex-wrap: wrap;
}

/* ==================== 弹窗内样式 ==================== */

.dry-weight-display {
  font-size: 18px;
  font-weight: 700;
  color: #e6a23c;
}

.infectious-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.infectious-table {
  margin-top: 8px;
}

.infectious-result-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.infectious-date {
  font-size: 12px;
  color: #909399;
}

/* ==================== Element Plus 深度覆盖 ==================== */

:deep(.el-descriptions__label) {
  width: 100px;
  min-width: 100px;
}

:deep(.el-card__header) {
  padding: 12px 16px;
}

:deep(.el-card__body) {
  padding: 16px;
}

:deep(.el-divider--vertical) {
  height: 1.2em;
}
</style>
