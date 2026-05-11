<script lang="ts" setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { Page } from '@vben/common-ui';
import {
  ElCard,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElSelect,
  ElOption,
  ElButton,
  ElDatePicker,
  ElTimePicker,
  ElCheckbox,
  ElCheckboxGroup,
  ElTable,
  ElTableColumn,
  ElTag,
  ElDivider,
  ElMessage,
  ElDescriptions,
  ElDescriptionsItem,
  ElRow,
  ElCol,
} from 'element-plus';
import type { FormInstance } from 'element-plus';
import { requestClient } from '#/api/request';

// ==================== 类型定义 ====================

/** 已签到患者 - 使用原系统字段名 */
interface SignedPatient {
  PatientId: string;
  PatientName: string;
  Name?: string;
  Sex: string;
  Age: number;
  SickbedNo: string;
  DialysisType: string;
  ActualDialysisType?: string;
  Dialyzer: string;
  ActualDialyzer?: string;
  DialysisPerfusion: string;
  BloodAccess: string;
  ActualShift: string;
  BloodBorneDisease: string;
  DialysisId: string;
  SignId: string;
  PatientCycleSchedulingId?: string;
  CurrentState: number;
  State?: number;
  Id: string;
}

/** 透析过程记录行 - 使用原系统字段名 */
interface ProcessRecord {
  Id?: string;
  DialysisId?: string;
  PatientId?: string;
  TimePoint: string;
  ObserveTime?: string;
  BloodFlow: number | null;
  VenousPressure: number | null;
  ArterialPressure?: number | null;
  TMP: number | null;
  TransmembranePressure?: number | null;
  UFRate: number | null;
  UltraFiltration?: number | null;
  UFVolume: number | null;
  UltraFilRate?: number | null;
  DialysateFlow: number | null;
  TxyFlowRate?: number | null;
  DialysateTemp: number | null;
  TxyTemperature?: number | null;
  AnticoagulantAdd: string;
  AnticoagulantAddition?: string;
  Remark: string;
  RecordType?: number;
  SortNo?: number;
  // 生命体征
  SystolicPressure?: number | null;
  DiastolicPressure?: number | null;
  Pulse?: number | null;
  HeartRate?: number | null;
  Breath?: number | null;
  Temperature?: number | null;
  SpO2?: number | null;
}

/** API响应格式 - 原系统标准格式 */
interface ApiResponse<T> {
  Code: number;
  Data: T;
  Msg: string;
}

/** 透析记录详情数据 - 原系统返回结构 */
interface DialysisRecordDetail {
  // 患者信息
  PatientId?: string;
  Name?: string;
  Sex?: string;
  Age?: number;
  SickbedNo?: string;
  ActualShift?: string;
  Date?: string;
  FounderDate?: string;
  // 透析方案
  DialysisType?: string;
  TreatHour?: number;
  TreatMin?: number;
  BloodFlow?: number;
  BloodFlowMax?: number;
  FlowDialy?: number;
  DialysateFlow?: number;
  UltraFilRate?: number;
  TxyTemperature?: number;
  DialysateTemp?: number;
  // 抗凝剂
  Anticoagulants?: string;
  AnticoagulantsFirstDose?: number;
  AnticoagulantsBolus?: number;
  AnticoagulantsUnitId?: string;
  AnticoagulantsUnitName?: string;
  AddOnMode?: number;
  AnticoagulationStopTime?: number;
  // 透析液成分
  FlowPres_na?: number;
  FlowPres_ga?: number;
  FlowPres_hq?: number;
  FlowPres_k?: number;
  Glucose?: number;
  // 透析器/灌流器
  Dialyzer?: string;
  DialysisPerfusion?: string;
  BloodAccess?: string;
  VascularAccess?: string;
  // 体重相关
  CurrentDryWeight?: number;
  CurrentBeforeDialysisWeight?: number;
  PreviousAfterDialysisWeight?: number;
  PostWeight?: number | null;
  WeightChange?: number | null;
  ClothingWeight?: number;
  // 透析小结
  ActualTreatHour?: number;
  ActualTreatMin?: number;
  ActualUltraFilRate?: number;
  Symptoms?: string;
  TreatmentMeasures?: string;
  DoctorSign?: string;
  // 状态
  State?: number;
  DialysisId?: string;
  SignId?: string;
}

// ==================== swsApi 封装 - 与原系统完全一致 ====================

const swsApi = {
  /** GET请求 - 原系统模式 */
  async swsGet<T>(url: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    const response = await requestClient.get(`/v1/${url}`, { params });
    return response as unknown as ApiResponse<T>;
  },

  /** POST请求 - 原系统模式 */
  async swsPost<T>(url: string, data?: Record<string, any>): Promise<ApiResponse<T>> {
    const response = await requestClient.post(`/v1/${url}`, data);
    return response as unknown as ApiResponse<T>;
  },

  /** PUT请求 - 原系统模式 */
  async swsPut<T>(url: string, data?: Record<string, any>): Promise<ApiResponse<T>> {
    const response = await requestClient.put(`/v1/${url}`, data);
    return response as unknown as ApiResponse<T>;
  },

  /** DELETE请求 - 原系统模式 */
  async swsDelete<T>(url: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    const response = await requestClient.delete(`/v1/${url}`, { params });
    return response as unknown as ApiResponse<T>;
  },
};

// ==================== 常量定义 ====================

const SHIFT_OPTIONS = [
  { label: '上午', value: '上午' },
  { label: '下午', value: '下午' },
  { label: '晚上', value: '晚上' },
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

const VASCULAR_ACCESS_OPTIONS = [
  { label: '动静脉内瘘', value: '动静脉内瘘' },
  { label: '中心静脉导管', value: '中心静脉导管' },
  { label: '人造血管', value: '人造血管' },
  { label: '直接穿刺', value: '直接穿刺' },
];

const ANTICOAGULANT_OPTIONS = [
  { label: '普通肝素', value: '普通肝素' },
  { label: '低分子肝素', value: '低分子肝素' },
  { label: '无肝素', value: '无肝素' },
  { label: '局部枸橼酸', value: '局部枸橼酸' },
  { label: '阿加曲班', value: '阿加曲班' },
];

const ADDITIONAL_METHOD_OPTIONS = [
  { label: '每小时追加', value: 1 },
  { label: '一次性追加', value: 2 },
  { label: '持续泵入', value: 3 },
];

const SYMPTOM_OPTIONS = [
  '低血压',
  '高血压',
  '肌肉痉挛',
  '恶心呕吐',
  '头痛',
  '胸痛',
  '心律失常',
  '皮肤瘙痒',
  '发热',
  '出血',
  '过敏反应',
  '失衡综合征',
  '透析器凝血',
  '空气栓塞',
];

// ==================== 状态定义 ====================

const loading = ref(false);
const saving = ref(false);

// 左侧患者列表
const patientList = ref<SignedPatient[]>([]);
const selectedPatientId = ref('');
const searchPatient = ref('');

// 表单引用
const basicFormRef = ref<FormInstance>();
const prescriptionFormRef = ref<FormInstance>();
const summaryFormRef = ref<FormInstance>();

// 当前透析记录ID和签到ID - 使用原系统字段名
const currentDialysisId = ref('');
const currentSignId = ref('');
const currentState = ref(0);

// 患者基本信息 - 使用原系统字段名
const basicInfo = reactive({
  PatientId: '',
  PatientName: '',
  Name: '',
  Sex: '',
  Age: 0,
  SickbedNo: '',
  Date: '',
  FounderDate: '',
  ActualShift: '',
  BloodBorneDisease: '',
  DialysisNumber: 0,
});

// 透前信息 - 使用原系统字段名
const preDialysisInfo = reactive({
  CurrentDryWeight: 0,
  PreviousAfterDialysisWeight: 0,
  CurrentBeforeDialysisWeight: 0,
  ClothingWeight: 0,
  WeightGainRate: '',
  EdemaType: '',
  GaspType: '',
  PrecordialDiscomfortType: '',
  HAS_BLED: '',
  LastDialysisRemarks: '',
  OtherSpecialDiscomfort: '',
  OtherSpecialDiscomfortRemarks: '',
});

// 透析处方表单 - 使用原系统字段名 (PostPreTreatMessageInfo)
const prescription = reactive({
  // 治疗方案
  DialysisType: '',
  TreatHour: 4,
  TreatMin: 0,
  // 治疗参数
  BloodFlow: 250,
  BloodFlowMax: 300,
  FlowDialy: 500,
  DialysateFlow: 500,
  UltraFilRate: 2000,
  TxyTemperature: 36.5,
  DialysateTemp: 36.5,
  // 透析器/灌流器
  Dialyzer: '',
  DialysisPerfusion: '',
  BloodAccess: '',
  VascularAccess: '',
  // 抗凝方案
  Anticoagulants: '低分子肝素',
  AnticoagulantsFirstDose: 0,
  AnticoagulantsBolus: 0,
  AnticoagulantsUnitId: 'IU',
  AnticoagulantsUnitName: 'IU',
  AddOnMode: 1,
  AnticoagulationStopTime: 0,
  // 透析液处方
  FlowPres_na: 140,
  FlowPres_ga: 1.5,
  FlowPres_hq: 32,
  FlowPres_k: 2.0,
  Glucose: 1.0,
});

// 透析过程记录 - 使用原系统字段名 (ObserveRecordInfo)
const processRecords = ref<ProcessRecord[]>([]);

// 透析小结 - 使用原系统字段名
const summary = reactive({
  ActualTreatHour: 4,
  ActualTreatMin: 0,
  ActualUltraFilRate: 0,
  PreWeight: null as number | null,
  PostWeight: null as number | null,
  WeightChange: null as number | null,
  Symptoms: [] as string[],
  TreatmentMeasures: '',
  DoctorSign: '',
});

// ==================== 计算属性 ====================

const filteredPatients = computed(() => {
  if (!searchPatient.value) return patientList.value;
  const kw = searchPatient.value.toLowerCase();
  return patientList.value.filter(
    (p) =>
      p.PatientName?.toLowerCase().includes(kw) ||
      p.Name?.toLowerCase().includes(kw) ||
      p.SickbedNo?.toLowerCase().includes(kw) ||
      p.PatientId?.toLowerCase().includes(kw),
  );
});

const selectedPatient = computed(() => {
  return patientList.value.find((p) => p.PatientId === selectedPatientId.value);
});

const treatmentModeLabel = computed(() => {
  const item = TREATMENT_MODE_OPTIONS.find((o) => o.value === prescription.DialysisType);
  return item ? item.label : prescription.DialysisType;
});

// 抗凝剂总量计算
const totalAnticoagulantDose = computed(() => {
  return Number(prescription.AnticoagulantsFirstDose) + Number(prescription.AnticoagulantsBolus);
});

// ==================== API 方法 - 与原系统完全一致 ====================

/** 获取已签到患者列表 - 使用原系统API: SchedulingManage/4005 */
async function getPatientInfo() {
  loading.value = true;
  try {
    const jsonStr = {
      Date: new Date().toISOString(),
      SortName: 'SickbedNo',
      Sort: 'asc',
    };
    const res = await swsApi.swsGet<SignedPatient[]>('SchedulingManage/4005', jsonStr);
    if (res.Code === 200 && res.Data) {
      patientList.value = res.Data.map((item: any) => ({
        PatientId: item.PatientId || item.Id,
        PatientName: item.Name || item.PatientName,
        Name: item.Name,
        Sex: item.Sex,
        Age: item.Age,
        SickbedNo: item.SickbedNo,
        DialysisType: item.DialysisType || item.ActualDialysisType,
        ActualDialysisType: item.ActualDialysisType,
        Dialyzer: item.Dialyzer || item.ActualDialyzer,
        ActualDialyzer: item.ActualDialyzer,
        DialysisPerfusion: item.DialysisPerfusion,
        BloodAccess: item.BloodAccess,
        ActualShift: item.ActualShift,
        BloodBorneDisease: item.BloodBorneDisease,
        DialysisId: item.DialysisId,
        SignId: item.PatientCycleSchedulingId || item.SignId,
        PatientCycleSchedulingId: item.PatientCycleSchedulingId,
        CurrentState: item.CurrentState || item.State,
        State: item.State,
        Id: item.Id,
      }));
    }
  } catch (error) {
    console.error('获取患者列表失败:', error);
    ElMessage.error('获取患者列表失败');
  } finally {
    loading.value = false;
  }
}

/** 获取透析记录 - 使用原系统API: DialysisRecordManage/4001 */
async function getDialysisRecord(patient: SignedPatient) {
  loading.value = true;
  try {
    // 获取透析记录详情 - 原系统API调用方式
    const jsonStr = {
      PatientId: patient.PatientId,
      DialysisId: patient.DialysisId,
    };

    // 调用原系统API获取透析记录
    const res = await swsApi.swsGet<DialysisRecordDetail>('DialysisRecordManage/4001', jsonStr);

    if (res.Code === 200 && res.Data) {
      const data = res.Data;

      // 填充基本信息 - 使用原系统字段名
      basicInfo.PatientId = patient.PatientId;
      basicInfo.PatientName = data.Name || patient.PatientName || '';
      basicInfo.Name = data.Name || patient.Name || '';
      basicInfo.Sex = data.Sex || patient.Sex || '';
      basicInfo.Age = data.Age || patient.Age || 0;
      basicInfo.SickbedNo = data.SickbedNo || patient.SickbedNo || '';
      basicInfo.Date = data.Date ? data.Date.substring(0, 10) : new Date().toISOString().slice(0, 10);
      basicInfo.FounderDate = data.FounderDate ? data.FounderDate.substring(0, 10) : basicInfo.Date;
      basicInfo.ActualShift = data.ActualShift || patient.ActualShift || '';

      // 填充透前信息 - 使用原系统字段名
      preDialysisInfo.CurrentDryWeight = data.CurrentDryWeight || 0;
      preDialysisInfo.CurrentBeforeDialysisWeight = data.CurrentBeforeDialysisWeight || 0;
      preDialysisInfo.PreviousAfterDialysisWeight = data.PreviousAfterDialysisWeight || 0;
      preDialysisInfo.PostWeight = data.PostWeight || 0;

      // 填充透析处方 - 使用原系统字段名 (与PostPreTreatMessageInfo对应)
      prescription.DialysisType = data.DialysisType || patient.DialysisType || 'HD';
      prescription.TreatHour = data.TreatHour || 4;
      prescription.TreatMin = data.TreatMin || 0;
      prescription.BloodFlow = data.BloodFlow || 250;
      prescription.BloodFlowMax = data.BloodFlowMax || 300;
      // 原系统使用FlowDialy作为透析液流量字段名
      prescription.FlowDialy = data.FlowDialy || data.DialysateFlow || 500;
      prescription.DialysateFlow = data.FlowDialy || data.DialysateFlow || 500;
      prescription.UltraFilRate = data.UltraFilRate || 2000;
      // 原系统使用TxyTemperature作为透析液温度字段名
      prescription.TxyTemperature = data.TxyTemperature || data.DialysateTemp || 36.5;
      prescription.DialysateTemp = data.TxyTemperature || data.DialysateTemp || 36.5;
      prescription.Anticoagulants = data.Anticoagulants || '低分子肝素';
      prescription.AnticoagulantsFirstDose = data.AnticoagulantsFirstDose || 0;
      prescription.AnticoagulantsBolus = data.AnticoagulantsBolus || 0;
      prescription.AnticoagulantsUnitId = data.AnticoagulantsUnitId || data.AnticoagulantsUnitName || 'IU';
      prescription.AnticoagulantsUnitName = data.AnticoagulantsUnitName || data.AnticoagulantsUnitId || 'IU';
      prescription.AddOnMode = data.AddOnMode || 1;
      prescription.AnticoagulationStopTime = data.AnticoagulationStopTime || 0;
      prescription.FlowPres_na = data.FlowPres_na || 140;
      prescription.FlowPres_ga = data.FlowPres_ga || 1.5;
      prescription.FlowPres_hq = data.FlowPres_hq || 32;
      prescription.FlowPres_k = data.FlowPres_k || 2.0;
      prescription.Glucose = data.Glucose || 1.0;
      prescription.Dialyzer = data.Dialyzer || patient.Dialyzer || '';
      prescription.DialysisPerfusion = data.DialysisPerfusion || patient.DialysisPerfusion || '';
      prescription.BloodAccess = data.BloodAccess || data.VascularAccess || patient.BloodAccess || '';
      prescription.VascularAccess = data.VascularAccess || data.BloodAccess || patient.BloodAccess || '';

      // 获取过程记录数据 - 使用原系统API
      await getProcessRecords(patient.PatientId, patient.DialysisId);

      // 填充透析小结 - 使用原系统字段名
      summary.ActualTreatHour = data.ActualTreatHour || data.TreatHour || 4;
      summary.ActualTreatMin = data.ActualTreatMin || data.TreatMin || 0;
      summary.ActualUltraFilRate = data.ActualUltraFilRate || 0;
      summary.PreWeight = data.CurrentBeforeDialysisWeight || null;
      summary.PostWeight = data.PostWeight || null;
      summary.WeightChange = data.WeightChange || null;
      summary.Symptoms = data.Symptoms ? data.Symptoms.split(',') : [];
      summary.TreatmentMeasures = data.TreatmentMeasures || '';
      summary.DoctorSign = data.DoctorSign || '';
    }
  } catch (error) {
    console.error('获取透析记录失败:', error);
    ElMessage.error('获取透析记录失败');
  } finally {
    loading.value = false;
  }
}

/** 获取透析过程记录 - 使用原系统API: DialysisRecordManage/4002 */
async function getProcessRecords(patientId: string, dialysisId: string) {
  try {
    const jsonStr = {
      PatientId: patientId,
      DialysisId: dialysisId,
    };

    // 调用原系统API获取过程记录
    const res = await swsApi.swsGet<any>('DialysisRecordManage/4002', jsonStr);

    if (res.Code === 200 && res.Data) {
      // 原系统返回的观察记录字段名为ObserveRecordInfo
      const records = res.Data.ObserveRecordInfo || res.Data.ProcessRecords || [];
      if (records.length > 0) {
        processRecords.value = records.map((item: any) => ({
          Id: item.Id,
          DialysisId: item.DialysisId,
          PatientId: item.PatientId,
          TimePoint: item.TimePoint || formatTimePoint(item.ObserveTime),
          ObserveTime: item.ObserveTime,
          BloodFlow: item.BloodFlow,
          VenousPressure: item.VenousPressure,
          ArterialPressure: item.ArterialPressure,
          TMP: item.TMP || item.TransmembranePressure,
          TransmembranePressure: item.TransmembranePressure || item.TMP,
          UFRate: item.UFRate || item.UltraFiltration,
          UltraFiltration: item.UltraFiltration || item.UFRate,
          UFVolume: item.UFVolume || item.UltraFilRate,
          UltraFilRate: item.UltraFilRate || item.UFVolume,
          DialysateFlow: item.DialysateFlow || item.TxyFlowRate,
          TxyFlowRate: item.TxyFlowRate || item.DialysateFlow,
          DialysateTemp: item.DialysateTemp || item.TxyTemperature,
          TxyTemperature: item.TxyTemperature || item.DialysateTemp,
          AnticoagulantAdd: item.AnticoagulantAdd || item.AnticoagulantAddition || '',
          AnticoagulantAddition: item.AnticoagulantAddition || item.AnticoagulantAdd || '',
          Remark: item.Remark || item.IllnessObservation || '',
          RecordType: item.RecordType,
          SortNo: item.SortNo,
          // 生命体征
          SystolicPressure: item.SystolicPressure,
          DiastolicPressure: item.DiastolicPressure,
          Pulse: item.Pulse,
          HeartRate: item.HeartRate,
          Breath: item.Breath,
          Temperature: item.Temperature,
          SpO2: item.SpO2,
        }));
      } else {
        // 生成默认过程记录时间点
        generateDefaultProcessRecords();
      }
    } else {
      generateDefaultProcessRecords();
    }
  } catch (error) {
    console.error('获取过程记录失败:', error);
    generateDefaultProcessRecords();
  }
}

/** 格式化时间点 */
function formatTimePoint(observeTime?: string): string {
  if (!observeTime) return '';
  const time = observeTime.substring(11, 16);
  return time;
}

/** 生成默认过程记录 */
function generateDefaultProcessRecords() {
  const totalMinutes = prescription.TreatHour * 60 + prescription.TreatMin;
  const hourCount = Math.ceil(totalMinutes / 60);

  const records: ProcessRecord[] = [];
  for (let i = 0; i <= hourCount; i++) {
    const h = i;
    const timeLabel = i === 0 ? '上机' : i === hourCount ? '下机' : `${h}h`;

    records.push({
      TimePoint: timeLabel,
      BloodFlow: i === 0 ? 0 : i === hourCount ? 0 : prescription.BloodFlow,
      VenousPressure: null,
      TMP: null,
      UFRate: i === 0 ? 0 : i === hourCount ? 0 : Math.floor(prescription.UltraFilRate / hourCount),
      UFVolume: i === 0 ? 0 : i === hourCount ? prescription.UltraFilRate : Math.floor((i / hourCount) * prescription.UltraFilRate),
      DialysateFlow: i === 0 || i === hourCount ? 0 : prescription.FlowDialy,
      DialysateTemp: i === 0 || i === hourCount ? null : prescription.TxyTemperature,
      AnticoagulantAdd: '',
      Remark: '',
      RecordType: 0,
      SortNo: i,
    });
  }
  processRecords.value = records;
}

/** 保存透析记录 - 使用原系统API: DialysisRecordManage/3001 */
async function saveDialysisRecord() {
  if (!selectedPatientId.value) {
    ElMessage.warning('请先选择患者');
    return;
  }

  saving.value = true;
  try {
    // 构建保存数据 - 使用原系统字段名 (与PostPreTreatMessageInfo对应)
    const payload = {
      PatientId: selectedPatientId.value,
      DialysisId: currentDialysisId.value,
      SignId: currentSignId.value,
      // 透析方案数据 - 使用原系统字段名
      DialysisType: prescription.DialysisType,
      TreatHour: prescription.TreatHour,
      TreatMin: prescription.TreatMin,
      BloodFlow: prescription.BloodFlow,
      BloodFlowMax: prescription.BloodFlowMax,
      // 原系统使用FlowDialy作为透析液流量字段名
      FlowDialy: prescription.FlowDialy,
      UltraFilRate: prescription.UltraFilRate,
      // 原系统使用TxyTemperature作为透析液温度字段名
      TxyTemperature: prescription.TxyTemperature,
      // 抗凝方案 - 使用原系统字段名
      Anticoagulants: prescription.Anticoagulants,
      AnticoagulantsFirstDose: prescription.AnticoagulantsFirstDose,
      AnticoagulantsBolus: prescription.AnticoagulantsBolus,
      AnticoagulantsUnitId: prescription.AnticoagulantsUnitId,
      AddOnMode: prescription.AddOnMode,
      AnticoagulationStopTime: prescription.AnticoagulationStopTime,
      // 透析液处方 - 使用原系统字段名
      FlowPres_na: prescription.FlowPres_na,
      FlowPres_ga: prescription.FlowPres_ga,
      FlowPres_hq: prescription.FlowPres_hq,
      FlowPres_k: prescription.FlowPres_k,
      Glucose: prescription.Glucose,
      // 透析器/灌流器
      Dialyzer: prescription.Dialyzer,
      DialysisPerfusion: prescription.DialysisPerfusion,
      BloodAccess: prescription.BloodAccess,
      VascularAccess: prescription.VascularAccess,
      // 过程记录
      ProcessRecords: processRecords.value,
      ObserveRecordInfo: processRecords.value,
    };

    // 调用原系统保存API
    const res = await swsApi.swsPut('DialysisRecordManage/3001', payload);

    if (res.Code === 200) {
      ElMessage.success('透析记录保存成功');
    } else {
      ElMessage.error(res.Msg || '保存失败');
    }
  } catch (error) {
    console.error('保存透析记录失败:', error);
    ElMessage.error('保存失败，请重试');
  } finally {
    saving.value = false;
  }
}

/** 保存透析小结 - 使用原系统API: DialysisRecordManage/3002 */
async function saveDialysisSummary() {
  if (!selectedPatientId.value) {
    ElMessage.warning('请先选择患者');
    return;
  }

  saving.value = true;
  try {
    // 构建保存数据 - 使用原系统字段名
    const payload = {
      PatientId: selectedPatientId.value,
      DialysisId: currentDialysisId.value,
      SignId: currentSignId.value,
      // 透析小结 - 使用原系统字段名
      ActualTreatHour: summary.ActualTreatHour,
      ActualTreatMin: summary.ActualTreatMin,
      ActualUltraFilRate: summary.ActualUltraFilRate,
      PreWeight: summary.PreWeight,
      PostWeight: summary.PostWeight,
      WeightChange: summary.WeightChange,
      Symptoms: summary.Symptoms.join(','),
      TreatmentMeasures: summary.TreatmentMeasures,
      DoctorSign: summary.DoctorSign,
    };

    // 调用原系统保存API
    const res = await swsApi.swsPut('DialysisRecordManage/3002', payload);

    if (res.Code === 200) {
      ElMessage.success('透析小结保存成功');
    } else {
      ElMessage.error(res.Msg || '保存失败');
    }
  } catch (error) {
    console.error('保存透析小结失败:', error);
    ElMessage.error('保存小结失败，请重试');
  } finally {
    saving.value = false;
  }
}

/** 保存并下机 - 使用原系统API: DialysisRecordManage/3007 */
async function saveAndFinish() {
  if (!selectedPatientId.value) {
    ElMessage.warning('请先选择患者');
    return;
  }

  try {
    await saveDialysisRecord();
    await saveDialysisSummary();

    // 调用下机API - 使用原系统字段名
    const payload = {
      DialysisId: currentDialysisId.value,
      State: 6, // 下机状态
    };

    const res = await swsApi.swsPut('DialysisRecordManage/3007', payload);

    if (res.Code === 200) {
      ElMessage.success('透析记录已保存，患者已下机');
      // 刷新患者列表
      await getPatientInfo();
    }
  } catch (error) {
    console.error('下机操作失败:', error);
    ElMessage.error('操作失败，请重试');
  }
}

/** 添加过程记录行 */
function addProcessRecord() {
  const newRecord: ProcessRecord = {
    TimePoint: '',
    BloodFlow: prescription.BloodFlow,
    VenousPressure: null,
    TMP: null,
    UFRate: null,
    UFVolume: null,
    DialysateFlow: prescription.FlowDialy,
    DialysateTemp: prescription.TxyTemperature,
    AnticoagulantAdd: '',
    Remark: '',
    RecordType: 0,
    SortNo: processRecords.value.length,
  };
  processRecords.value.push(newRecord);
}

/** 删除过程记录行 */
async function removeProcessRecord(index: number, record?: ProcessRecord) {
  if (record?.Id) {
    // 如果有ID，调用删除API
    try {
      const res = await swsApi.swsDelete('DialysisRecordManage/3004', {
        Id: record.Id,
      });
      if (res.Code === 200) {
        processRecords.value.splice(index, 1);
        ElMessage.success('删除成功');
      }
    } catch (error) {
      console.error('删除记录失败:', error);
      ElMessage.error('删除失败');
    }
  } else {
    processRecords.value.splice(index, 1);
  }
}

// ==================== 业务逻辑 ====================

function selectPatient(patient: SignedPatient) {
  selectedPatientId.value = patient.PatientId;
  currentDialysisId.value = patient.DialysisId;
  currentSignId.value = patient.SignId;
  currentState.value = patient.CurrentState;
  getDialysisRecord(patient);
}

/** 计算体重变化 */
function onPostWeightChange(val: number | null) {
  if (val !== null && summary.PreWeight !== null) {
    summary.WeightChange = Math.round((val - summary.PreWeight) * 10) / 10;
  }
}

/** 计算实际治疗时间 */
function calculateActualTime() {
  const totalMinutes = prescription.TreatHour * 60 + prescription.TreatMin;
  summary.ActualTreatHour = Math.floor(totalMinutes / 60);
  summary.ActualTreatMin = totalMinutes % 60;
}

/** 打印 */
function handlePrint() {
  ElMessage.info('打印功能开发中...');
}

// ==================== 生命周期 ====================

onMounted(() => {
  getPatientInfo();
});
</script>

<template>
  <Page title="透析记录单">
    <div class="dialysis-record-container">
      <!-- ========== 左侧：已签到患者列表 ========== -->
      <div class="left-panel">
        <div class="panel-header">已签到患者</div>
        <ElInput
          v-model="searchPatient"
          placeholder="搜索患者姓名/床位"
          clearable
          size="small"
          class="patient-search"
        />
        <div class="patient-list">
          <div
            v-for="patient in filteredPatients"
            :key="patient.PatientId"
            class="patient-item"
            :class="{ 'patient-item--active': selectedPatientId === patient.PatientId }"
            @click="selectPatient(patient)"
          >
            <div class="patient-item__name">
              {{ patient.PatientName }}
              <ElTag
                v-if="patient.BloodBorneDisease"
                :type="patient.BloodBorneDisease === 'HIV' || patient.BloodBorneDisease === '乙肝' ? 'danger' : 'warning'"
                size="small"
                effect="dark"
                class="infectious-tag"
              >
                {{ patient.BloodBorneDisease }}
              </ElTag>
            </div>
            <div class="patient-item__info">
              <span>{{ patient.SickbedNo }}</span>
              <span>{{ patient.Sex }}/{{ patient.Age }}岁</span>
            </div>
            <div class="patient-item__mode">
              <ElTag size="small" :type="patient.DialysisType === 'HD' ? 'success' : 'warning'">
                {{ patient.DialysisType }}
              </ElTag>
            </div>
          </div>
          <div v-if="filteredPatients.length === 0" class="no-data">
            暂无已签到患者
          </div>
        </div>
      </div>

      <!-- ========== 右侧：透析记录单内容 ========== -->
      <div v-loading="loading" class="right-panel">
        <template v-if="selectedPatientId">
          <!-- 1. 基本信息区 -->
          <ElCard shadow="never" class="section-card">
            <template #header>
              <div class="section-title">基本信息</div>
            </template>
            <ElForm
              ref="basicFormRef"
              :model="basicInfo"
              label-width="90px"
              size="small"
              :inline="true"
              class="info-form"
            >
              <ElFormItem label="患者姓名">
                <ElInput v-model="basicInfo.PatientName" disabled style="width: 100px" />
              </ElFormItem>
              <ElFormItem label="性别">
                <ElInput v-model="basicInfo.Sex" disabled style="width: 60px" />
              </ElFormItem>
              <ElFormItem label="年龄">
                <ElInput :model-value="String(basicInfo.Age)" disabled style="width: 60px" />
              </ElFormItem>
              <ElFormItem label="床号">
                <ElInput v-model="basicInfo.SickbedNo" disabled style="width: 80px" />
              </ElFormItem>
              <ElFormItem label="透析日期">
                <ElDatePicker
                  v-model="basicInfo.Date"
                  type="date"
                  placeholder="选择日期"
                  value-format="YYYY-MM-DD"
                  style="width: 160px"
                />
              </ElFormItem>
              <ElFormItem label="班次">
                <ElSelect v-model="basicInfo.ActualShift" style="width: 100px">
                  <ElOption
                    v-for="item in SHIFT_OPTIONS"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </ElSelect>
              </ElFormItem>
            </ElForm>
          </ElCard>

          <!-- 2. 透前信息区 -->
          <ElCard shadow="never" class="section-card">
            <template #header>
              <div class="section-title">治疗前情况</div>
            </template>
            <ElDescriptions :column="5" size="small" border>
              <ElDescriptionsItem label="干体重">{{ preDialysisInfo.CurrentDryWeight }} Kg</ElDescriptionsItem>
              <ElDescriptionsItem label="上次透后">{{ preDialysisInfo.PreviousAfterDialysisWeight || '/' }} Kg</ElDescriptionsItem>
              <ElDescriptionsItem label="本次透前">{{ preDialysisInfo.CurrentBeforeDialysisWeight || '/' }} Kg</ElDescriptionsItem>
              <ElDescriptionsItem label="衣物重量">{{ preDialysisInfo.ClothingWeight }} Kg</ElDescriptionsItem>
              <ElDescriptionsItem label="体重增长率">{{ preDialysisInfo.WeightGainRate || '/' }}</ElDescriptionsItem>
            </ElDescriptions>
          </ElCard>

          <!-- 3. 透析处方区 -->
          <ElCard shadow="never" class="section-card">
            <template #header>
              <div class="section-title">透析处方</div>
            </template>
            <ElForm
              ref="prescriptionFormRef"
              :model="prescription"
              label-width="140px"
              size="small"
              :inline="true"
              class="info-form"
            >
              <ElFormItem label="治疗模式">
                <ElSelect v-model="prescription.DialysisType" style="width: 200px">
                  <ElOption
                    v-for="item in TREATMENT_MODE_OPTIONS"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </ElSelect>
              </ElFormItem>
              <ElFormItem label="治疗时间">
                <ElInputNumber v-model="prescription.TreatHour" :min="0" :max="12" style="width: 90px" />
                <span class="form-unit">时</span>
                <ElInputNumber v-model="prescription.TreatMin" :min="0" :max="59" style="width: 90px" />
                <span class="form-unit">分</span>
              </ElFormItem>
              <ElFormItem label="血流量">
                <ElInputNumber v-model="prescription.BloodFlow" :min="0" :max="500" :step="10" style="width: 100px" />
                <span class="form-unit">ml/min</span>
                <template v-if="prescription.BloodFlowMax">
                  <span class="form-unit">~</span>
                  <ElInputNumber v-model="prescription.BloodFlowMax" :min="0" :max="500" :step="10" style="width: 100px" />
                  <span class="form-unit">ml/min</span>
                </template>
              </ElFormItem>
              <ElFormItem label="透析液流量">
                <ElInputNumber v-model="prescription.FlowDialy" :min="0" :max="1000" :step="50" style="width: 120px" />
                <span class="form-unit">ml/min</span>
              </ElFormItem>
              <ElFormItem label="目标超滤量">
                <ElInputNumber v-model="prescription.UltraFilRate" :min="0" :max="10000" :step="100" style="width: 120px" />
                <span class="form-unit">ml</span>
              </ElFormItem>
              <ElFormItem label="透析液温度">
                <ElInputNumber v-model="prescription.TxyTemperature" :min="34" :max="39" :step="0.5" :precision="1" style="width: 120px" />
                <span class="form-unit">℃</span>
              </ElFormItem>
              <ElFormItem label="透析器">
                <ElSelect v-model="prescription.Dialyzer" style="width: 150px">
                  <ElOption
                    v-for="item in DIALYZER_OPTIONS"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </ElSelect>
              </ElFormItem>
              <ElFormItem label="灌流器">
                <ElSelect v-model="prescription.DialysisPerfusion" clearable style="width: 120px">
                  <ElOption
                    v-for="item in PERFUSOR_OPTIONS"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </ElSelect>
              </ElFormItem>
              <ElFormItem label="血管通路">
                <ElSelect v-model="prescription.BloodAccess" style="width: 140px">
                  <ElOption
                    v-for="item in VASCULAR_ACCESS_OPTIONS"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </ElSelect>
              </ElFormItem>
              <ElDivider content-position="left">抗凝方案</ElDivider>
              <ElFormItem label="抗凝剂类型">
                <ElSelect v-model="prescription.Anticoagulants" style="width: 140px">
                  <ElOption
                    v-for="item in ANTICOAGULANT_OPTIONS"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </ElSelect>
              </ElFormItem>
              <template v-if="prescription.Anticoagulants !== '无肝素'">
                <ElFormItem label="首剂量">
                  <ElInputNumber v-model="prescription.AnticoagulantsFirstDose" :min="0" :step="100" style="width: 120px" />
                  <span class="form-unit">{{ prescription.AnticoagulantsUnitId }}</span>
                </ElFormItem>
                <ElFormItem label="追加量">
                  <ElInputNumber v-model="prescription.AnticoagulantsBolus" :min="0" :step="100" style="width: 120px" />
                  <span class="form-unit">{{ prescription.AnticoagulantsUnitId }}</span>
                </ElFormItem>
                <ElFormItem label="追加方式">
                  <ElSelect v-model="prescription.AddOnMode" style="width: 140px">
                    <ElOption
                      v-for="item in ADDITIONAL_METHOD_OPTIONS"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"
                    />
                  </ElSelect>
                </ElFormItem>
                <ElFormItem label="提前停止时间">
                  <ElInputNumber v-model="prescription.AnticoagulationStopTime" :min="0" :step="10" style="width: 120px" />
                  <span class="form-unit">分钟</span>
                </ElFormItem>
                <ElFormItem label="维持总量">
                  <ElInput :model-value="String(totalAnticoagulantDose)" disabled style="width: 120px" />
                  <span class="form-unit">{{ prescription.AnticoagulantsUnitId }}</span>
                </ElFormItem>
              </template>
              <ElDivider content-position="left">透析液成分</ElDivider>
              <ElFormItem label="钠浓度">
                <ElInputNumber v-model="prescription.FlowPres_na" :min="130" :max="155" :step="1" style="width: 120px" />
                <span class="form-unit">mmol/L</span>
              </ElFormItem>
              <ElFormItem label="钙浓度">
                <ElInputNumber v-model="prescription.FlowPres_ga" :min="1.0" :max="2.0" :step="0.1" :precision="1" style="width: 120px" />
                <span class="form-unit">mmol/L</span>
              </ElFormItem>
              <ElFormItem label="碳酸氢根浓度">
                <ElInputNumber v-model="prescription.FlowPres_hq" :min="20" :max="45" :step="1" style="width: 120px" />
                <span class="form-unit">mmol/L</span>
              </ElFormItem>
              <ElFormItem label="钾浓度">
                <ElInputNumber v-model="prescription.FlowPres_k" :min="0" :max="4" :step="0.5" :precision="1" style="width: 120px" />
                <span class="form-unit">mmol/L</span>
              </ElFormItem>
            </ElForm>
          </ElCard>

          <!-- 4. 透析过程记录区 -->
          <ElCard shadow="never" class="section-card">
            <template #header>
              <div class="section-title">
                透析过程记录
                <ElButton type="primary" size="small" @click="addProcessRecord" style="margin-left: 10px;">
                  添加记录
                </ElButton>
              </div>
            </template>
            <ElTable
              :data="processRecords"
              border
              size="small"
              class="process-table"
              max-height="400"
            >
              <ElTableColumn type="index" label="序号" width="50" align="center" />
              <ElTableColumn label="时间点" prop="TimePoint" width="80" align="center" />
              <ElTableColumn label="血流量" prop="BloodFlow" width="90" align="center">
                <template #default="{ row }">
                  <ElInputNumber v-model="row.BloodFlow" :min="0" :max="500" :step="10" size="small" style="width: 80px" />
                </template>
              </ElTableColumn>
              <ElTableColumn label="静脉压" prop="VenousPressure" width="90" align="center">
                <template #default="{ row }">
                  <ElInputNumber v-model="row.VenousPressure" :min="-100" :max="300" :step="5" size="small" style="width: 80px" />
                </template>
              </ElTableColumn>
              <ElTableColumn label="跨膜压" prop="TMP" width="90" align="center">
                <template #default="{ row }">
                  <ElInputNumber v-model="row.TMP" :min="-100" :max="500" :step="5" size="small" style="width: 80px" />
                </template>
              </ElTableColumn>
              <ElTableColumn label="超滤率" prop="UFRate" width="90" align="center">
                <template #default="{ row }">
                  <ElInputNumber v-model="row.UFRate" :min="0" :max="5000" :step="100" size="small" style="width: 80px" />
                </template>
              </ElTableColumn>
              <ElTableColumn label="已超滤量" prop="UFVolume" width="100" align="center">
                <template #default="{ row }">
                  <ElInputNumber v-model="row.UFVolume" :min="0" :max="10000" :step="100" size="small" style="width: 90px" />
                </template>
              </ElTableColumn>
              <ElTableColumn label="透析液流量" prop="DialysateFlow" width="100" align="center">
                <template #default="{ row }">
                  <ElInputNumber v-model="row.DialysateFlow" :min="0" :max="1000" :step="50" size="small" style="width: 90px" />
                </template>
              </ElTableColumn>
              <ElTableColumn label="透析液温度" prop="DialysateTemp" width="100" align="center">
                <template #default="{ row }">
                  <ElInputNumber v-model="row.DialysateTemp" :min="34" :max="39" :step="0.5" :precision="1" size="small" style="width: 90px" />
                </template>
              </ElTableColumn>
              <ElTableColumn label="抗凝追加" prop="AnticoagulantAdd" width="100" align="center">
                <template #default="{ row }">
                  <ElInput v-model="row.AnticoagulantAdd" size="small" style="width: 90px" />
                </template>
              </ElTableColumn>
              <ElTableColumn label="病情观察" prop="Remark" min-width="150">
                <template #default="{ row }">
                  <ElInput v-model="row.Remark" size="small" placeholder="请输入病情观察记录" />
                </template>
              </ElTableColumn>
              <ElTableColumn label="操作" width="70" align="center" fixed="right">
                <template #default="{ $index, row }">
                  <ElButton type="danger" size="small" @click="removeProcessRecord($index, row)">删除</ElButton>
                </template>
              </ElTableColumn>
            </ElTable>
          </ElCard>

          <!-- 5. 透析小结区 -->
          <ElCard shadow="never" class="section-card">
            <template #header>
              <div class="section-title">透析小结</div>
            </template>
            <ElForm
              ref="summaryFormRef"
              :model="summary"
              label-width="120px"
              size="small"
              :inline="true"
              class="info-form"
            >
              <ElFormItem label="实际治疗时间">
                <ElInputNumber v-model="summary.ActualTreatHour" :min="0" :max="12" style="width: 90px" />
                <span class="form-unit">时</span>
                <ElInputNumber v-model="summary.ActualTreatMin" :min="0" :max="59" style="width: 90px" />
                <span class="form-unit">分</span>
              </ElFormItem>
              <ElFormItem label="实际超滤量">
                <ElInputNumber v-model="summary.ActualUltraFilRate" :min="0" :max="10000" :step="100" style="width: 120px" />
                <span class="form-unit">ml</span>
              </ElFormItem>
              <ElFormItem label="透前体重">
                <ElInputNumber v-model="summary.PreWeight" :min="0" :max="200" :precision="1" :step="0.1" style="width: 120px" />
                <span class="form-unit">Kg</span>
              </ElFormItem>
              <ElFormItem label="透后体重">
                <ElInputNumber v-model="summary.PostWeight" :min="0" :max="200" :precision="1" :step="0.1" style="width: 120px" @change="onPostWeightChange" />
                <span class="form-unit">Kg</span>
              </ElFormItem>
              <ElFormItem label="体重变化">
                <ElInputNumber v-model="summary.WeightChange" :min="-50" :max="50" :precision="1" :step="0.1" style="width: 120px" disabled />
                <span class="form-unit">Kg</span>
              </ElFormItem>
              <ElFormItem label="不良反应" class="full-width">
                <ElCheckboxGroup v-model="summary.Symptoms">
                  <ElCheckbox v-for="symptom in SYMPTOM_OPTIONS" :key="symptom" :label="symptom">
                    {{ symptom }}
                  </ElCheckbox>
                </ElCheckboxGroup>
              </ElFormItem>
              <ElFormItem label="处理措施" class="full-width">
                <ElInput
                  v-model="summary.TreatmentMeasures"
                  type="textarea"
                  :rows="2"
                  placeholder="请输入处理措施"
                  style="width: 600px"
                />
              </ElFormItem>
              <ElFormItem label="医生签名">
                <ElInput v-model="summary.DoctorSign" style="width: 150px" />
              </ElFormItem>
            </ElForm>
          </ElCard>

          <!-- 操作按钮区 -->
          <div class="action-bar">
            <ElButton type="primary" size="large" :loading="saving" @click="saveDialysisRecord">
              保存透析记录
            </ElButton>
            <ElButton type="success" size="large" :loading="saving" @click="saveDialysisSummary">
              保存透析小结
            </ElButton>
            <ElButton type="warning" size="large" :loading="saving" @click="saveAndFinish">
              保存并下机
            </ElButton>
            <ElButton size="large" @click="handlePrint">
              打印记录单
            </ElButton>
          </div>
        </template>
        <div v-else class="no-selection">
          <ElTag type="info" size="large">请从左侧选择患者</ElTag>
        </div>
      </div>
    </div>
  </Page>
</template>

<style scoped>
.dialysis-record-container {
  display: flex;
  height: calc(100vh - 120px);
  gap: 10px;
}

.left-panel {
  width: 240px;
  flex-shrink: 0;
  background: #fff;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
}

.panel-header {
  padding: 12px 15px;
  font-weight: bold;
  border-bottom: 1px solid #e4e7ed;
  background: #f5f7fa;
}

.patient-search {
  padding: 10px;
}

.patient-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 10px 10px;
}

.patient-item {
  padding: 10px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.patient-item:hover {
  background: #f5f7fa;
}

.patient-item--active {
  background: #ecf5ff;
  border-color: #409eff;
}

.patient-item__name {
  font-weight: bold;
  margin-bottom: 5px;
  display: flex;
  align-items: center;
  gap: 5px;
}

.patient-item__info {
  font-size: 12px;
  color: #666;
  margin-bottom: 5px;
  display: flex;
  justify-content: space-between;
}

.patient-item__mode {
  display: flex;
  gap: 5px;
}

.infectious-tag {
  font-size: 10px;
}

.no-data {
  text-align: center;
  padding: 20px;
  color: #999;
  font-size: 14px;
}

.right-panel {
  flex: 1;
  overflow-y: auto;
  padding-right: 10px;
}

.section-card {
  margin-bottom: 15px;
}

.section-title {
  font-weight: bold;
  font-size: 15px;
}

.info-form {
  :deep(.el-form-item) {
    margin-bottom: 10px;
    margin-right: 15px;
  }
}

.form-unit {
  margin: 0 8px 0 4px;
  color: #666;
}

.process-table {
  width: 100%;
}

.full-width {
  width: 100%;
  :deep(.el-form-item__content) {
    width: calc(100% - 120px);
  }
}

.action-bar {
  display: flex;
  gap: 15px;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 4px;
  justify-content: center;
  margin-top: 10px;
}

.no-selection {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 400px;
}
</style>
