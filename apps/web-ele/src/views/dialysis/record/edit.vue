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
} from 'element-plus';
import type { FormInstance } from 'element-plus';

// ==================== 类型定义 ====================

/** 已签到患者 */
interface SignedPatient {
  patientId: string;
  patientName: string;
  gender: string;
  age: number;
  bedNo: string;
  treatmentMode: string;
  dialyzer: string;
  perfusor: string;
  vascularAccess: string;
  shift: string;
  bloodInfectious: string;
  dialysisId: string;
}

/** 透析过程记录行 */
interface ProcessRecord {
  timePoint: string;
  bloodFlow: number | null;
  venousPressure: number | null;
  tmp: number | null;
  ufRate: number | null;
  ufVolume: number | null;
  dialysateFlow: number | null;
  dialysateTemp: number | null;
  anticoagulantAdd: string;
  remark: string;
}

/** 透析小结 */
interface DialysisSummary {
  actualTreatmentTime: string;
  actualUfVolume: number | null;
  postWeight: number | null;
  weightChange: number | null;
  symptoms: string[];
  treatmentMeasures: string;
  doctorSign: string;
}

/** 透析记录完整数据 */
interface DialysisRecordData {
  basicInfo: {
    patientName: string;
    gender: string;
    age: number;
    bedNo: string;
    dialysisDate: string;
    shift: string;
    treatmentMode: string;
    dialyzer: string;
    perfusor: string;
    vascularAccess: string;
  };
  prescription: {
    treatmentHour: number;
    treatmentMinute: number;
    bloodFlow: number;
    dialysateFlow: number;
    targetUfVolume: number;
    dialysateTemp: number;
    anticoagulantType: string;
    firstDose: string;
    additionalDose: string;
    additionalMethod: string;
    sodiumConcentration: number;
    calciumConcentration: number;
    bicarbonateConcentration: number;
  };
  processRecords: ProcessRecord[];
  summary: DialysisSummary;
}

// ==================== 常量 ====================

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
  { label: '每小时追加', value: '每小时追加' },
  { label: '一次性追加', value: '一次性追加' },
  { label: '持续泵入', value: '持续泵入' },
  { label: '无追加', value: '无追加' },
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

// ==================== 状态 ====================

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

// 基本信息表单
const basicInfo = reactive({
  patientName: '',
  gender: '',
  age: 0,
  bedNo: '',
  dialysisDate: '',
  shift: '',
  treatmentMode: '',
  dialyzer: '',
  perfusor: '',
  vascularAccess: '',
});

// 透析处方表单
const prescription = reactive({
  treatmentHour: 4,
  treatmentMinute: 0,
  bloodFlow: 250,
  dialysateFlow: 500,
  targetUfVolume: 2000,
  dialysateTemp: 36.5,
  anticoagulantType: '低分子肝素',
  firstDose: '4000IU',
  additionalDose: '',
  additionalMethod: '每小时追加',
  sodiumConcentration: 140,
  calciumConcentration: 1.5,
  bicarbonateConcentration: 32,
});

// 透析过程记录
const processRecords = ref<ProcessRecord[]>([]);

// 透析小结
const summary = reactive<DialysisSummary>({
  actualTreatmentTime: '',
  actualUfVolume: null,
  postWeight: null,
  weightChange: null,
  symptoms: [],
  treatmentMeasures: '',
  doctorSign: '',
});

// 透析前体重（用于计算体重变化）
const preWeight = ref(65.0);

// 当前透析ID
const currentDialysisId = ref('');

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

// /** 获取透析记录 */
// async function fetchDialysisRecord(dialysisId: string) {
//   const res = await axios.get('/api/v1/DialysisRecord/4001', {
//     params: { DialysisId: dialysisId },
//     headers: getHeaders(),
//   });
//   if (res.data?.Code === 0) {
//     return res.data.Data;
//   }
//   return null;
// }

// /** 保存透析记录 */
// async function saveDialysisRecord(data: any) {
//   const res = await axios.post('/api/v1/DialysisRecord/1001', data, {
//     headers: getHeaders(),
//   });
//   return res.data;
// }

// /** 保存透析小结 */
// async function saveDialysisSummary(data: any) {
//   const res = await axios.post('/api/v1/DialysisRecord/1002', data, {
//     headers: getHeaders(),
//   });
//   return res.data;
// }

// ==================== Mock 数据 ====================

function generateMockPatients(): SignedPatient[] {
  return [
    {
      patientId: 'P10001', patientName: '张三', gender: '男', age: 58,
      bedNo: '1号床', treatmentMode: 'HD', dialyzer: 'FX80', perfusor: '',
      vascularAccess: '动静脉内瘘', shift: '上午', bloodInfectious: '乙肝',
      dialysisId: 'DIA001',
    },
    {
      patientId: 'P10002', patientName: '李四', gender: '女', age: 45,
      bedNo: '2号床', treatmentMode: 'HDF', dialyzer: 'FX100', perfusor: '',
      vascularAccess: '中心静脉导管', shift: '上午', bloodInfectious: '',
      dialysisId: 'DIA002',
    },
    {
      patientId: 'P10003', patientName: '王五', gender: '男', age: 62,
      bedNo: '3号床', treatmentMode: 'HD+HP', dialyzer: 'F60S', perfusor: 'HA330',
      vascularAccess: '动静脉内瘘', shift: '上午', bloodInfectious: '丙肝',
      dialysisId: 'DIA003',
    },
    {
      patientId: 'P10004', patientName: '赵六', gender: '男', age: 71,
      bedNo: '4号床', treatmentMode: 'HD', dialyzer: 'F80S', perfusor: '',
      vascularAccess: '人造血管', shift: '上午', bloodInfectious: '',
      dialysisId: 'DIA004',
    },
    {
      patientId: 'P10005', patientName: '钱七', gender: '女', age: 53,
      bedNo: '5号床', treatmentMode: 'CRRT', dialyzer: 'Polyflux 17L', perfusor: '',
      vascularAccess: '中心静脉导管', shift: '上午', bloodInfectious: 'HIV',
      dialysisId: 'DIA005',
    },
    {
      patientId: 'P10006', patientName: '孙八', gender: '男', age: 39,
      bedNo: '6号床', treatmentMode: 'HF', dialyzer: 'FX80', perfusor: '',
      vascularAccess: '动静脉内瘘', shift: '上午', bloodInfectious: '',
      dialysisId: 'DIA006',
    },
    {
      patientId: 'P10007', patientName: '周九', gender: '女', age: 67,
      bedNo: '7号床', treatmentMode: 'HDF', dialyzer: 'FX100', perfusor: '',
      vascularAccess: '直接穿刺', shift: '上午', bloodInfectious: '梅毒',
      dialysisId: 'DIA007',
    },
    {
      patientId: 'P10008', patientName: '吴十', gender: '男', age: 44,
      bedNo: '8号床', treatmentMode: 'HD', dialyzer: 'FX80', perfusor: '',
      vascularAccess: '动静脉内瘘', shift: '上午', bloodInfectious: '',
      dialysisId: 'DIA008',
    },
  ];
}

function generateMockDialysisRecord(patient: SignedPatient): DialysisRecordData {
  const totalMinutes = patient.treatmentMode === 'CRRT' ? 360 : 240;
  const hourCount = Math.ceil(totalMinutes / 60);

  const processRecords: ProcessRecord[] = [];
  for (let i = 0; i <= hourCount; i++) {
    const minutes = i * 60;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    const timeLabel = i === 0 ? '上机' : i === hourCount ? '下机' : `${h}h`;

    processRecords.push({
      timePoint: timeLabel,
      bloodFlow: i === 0 ? 0 : i === hourCount ? 0 : 220 + Math.floor(Math.random() * 60),
      venousPressure: i === 0 ? null : 80 + Math.floor(Math.random() * 80),
      tmp: i === 0 ? null : 100 + Math.floor(Math.random() * 100),
      ufRate: i === 0 ? 0 : i === hourCount ? 0 : 400 + Math.floor(Math.random() * 300),
      ufVolume: i === 0 ? 0 : i === hourCount ? 2000 : Math.floor((i / hourCount) * 2000),
      dialysateFlow: i === 0 || i === hourCount ? 0 : 500,
      dialysateTemp: i === 0 || i === hourCount ? null : 36.5,
      anticoagulantAdd: i === 0 ? '首剂 4000IU' : i === hourCount ? '' : i % 2 === 0 ? '追加 1000IU' : '',
      remark: i === 0 ? '穿刺顺利，引血通畅' : i === hourCount ? '透析顺利，安全下机' : '',
    });
  }

  return {
    basicInfo: {
      patientName: patient.patientName,
      gender: patient.gender,
      age: patient.age,
      bedNo: patient.bedNo,
      dialysisDate: new Date().toISOString().slice(0, 10),
      shift: patient.shift,
      treatmentMode: patient.treatmentMode,
      dialyzer: patient.dialyzer,
      perfusor: patient.perfusor,
      vascularAccess: patient.vascularAccess,
    },
    prescription: {
      treatmentHour: Math.floor(totalMinutes / 60),
      treatmentMinute: totalMinutes % 60,
      bloodFlow: 250,
      dialysateFlow: 500,
      targetUfVolume: 2000,
      dialysateTemp: 36.5,
      anticoagulantType: '低分子肝素',
      firstDose: '4000IU',
      additionalDose: '1000IU',
      additionalMethod: '每小时追加',
      sodiumConcentration: 140,
      calciumConcentration: 1.5,
      bicarbonateConcentration: 32,
    },
    processRecords,
    summary: {
      actualTreatmentTime: `${Math.floor(totalMinutes / 60)}小时${totalMinutes % 60}分钟`,
      actualUfVolume: 1950,
      postWeight: 63.5,
      weightChange: -1.5,
      symptoms: [],
      treatmentMeasures: '',
      doctorSign: '',
    },
  };
}

// ==================== 计算属性 ====================

const filteredPatients = computed(() => {
  if (!searchPatient.value) return patientList.value;
  const kw = searchPatient.value.toLowerCase();
  return patientList.value.filter(
    (p) =>
      p.patientName.toLowerCase().includes(kw) ||
      p.bedNo.toLowerCase().includes(kw) ||
      p.patientId.toLowerCase().includes(kw),
  );
});

const selectedPatient = computed(() => {
  return patientList.value.find((p) => p.patientId === selectedPatientId.value);
});

const treatmentModeLabel = computed(() => {
  const item = TREATMENT_MODE_OPTIONS.find((o) => o.value === basicInfo.treatmentMode);
  return item ? item.label : basicInfo.treatmentMode;
});

// ==================== 业务逻辑 ====================

function loadPatients() {
  patientList.value = generateMockPatients();
}

function selectPatient(patient: SignedPatient) {
  selectedPatientId.value = patient.patientId;
  currentDialysisId.value = patient.dialysisId;
  loadDialysisRecord(patient);
}

function loadDialysisRecord(patient: SignedPatient) {
  loading.value = true;
  setTimeout(() => {
    // const data = await fetchDialysisRecord(patient.dialysisId);
    const data = generateMockDialysisRecord(patient);

    // 填充基本信息
    Object.assign(basicInfo, data.basicInfo);
    basicInfo.dialysisDate = new Date().toISOString().slice(0, 10);

    // 填充处方
    Object.assign(prescription, data.prescription);

    // 填充过程记录
    processRecords.value = data.processRecords;

    // 填充小结
    Object.assign(summary, data.summary);

    // 模拟透析前体重
    preWeight.value = (data.summary.postWeight || 65) + Math.abs(data.summary.weightChange || 1.5);

    loading.value = false;
  }, 400);
}

/** 保存透析记录 */
async function handleSave() {
  if (!selectedPatientId.value) {
    ElMessage.warning('请先选择患者');
    return;
  }

  saving.value = true;
  try {
    const payload = {
      DialysisId: currentDialysisId.value,
      PatientId: selectedPatientId.value,
      BasicInfo: { ...basicInfo },
      Prescription: { ...prescription },
      ProcessRecords: processRecords.value,
    };
    // await saveDialysisRecord(payload);
    await new Promise((resolve) => setTimeout(resolve, 500));
    ElMessage.success('透析记录保存成功');
  } catch {
    ElMessage.error('保存失败，请重试');
  } finally {
    saving.value = false;
  }
}

/** 保存透析小结 */
async function handleSaveSummary() {
  if (!selectedPatientId.value) {
    ElMessage.warning('请先选择患者');
    return;
  }

  saving.value = true;
  try {
    const payload = {
      DialysisId: currentDialysisId.value,
      PatientId: selectedPatientId.value,
      Summary: { ...summary },
    };
    // await saveDialysisSummary(payload);
    await new Promise((resolve) => setTimeout(resolve, 500));
    ElMessage.success('透析小结保存成功');
  } catch {
    ElMessage.error('保存小结失败，请重试');
  } finally {
    saving.value = false;
  }
}

/** 打印 */
function handlePrint() {
  ElMessage.info('打印功能开发中...');
}

/** 保存并下机 */
async function handleSaveAndFinish() {
  if (!selectedPatientId.value) {
    ElMessage.warning('请先选择患者');
    return;
  }

  try {
    await handleSave();
    await handleSaveSummary();
    ElMessage.success('透析记录已保存，患者已下机');
  } catch {
    // 已在各自方法中处理
  }
}

/** 计算体重变化 */
function onPostWeightChange(val: number | null) {
  if (val !== null && preWeight.value) {
    summary.weightChange = Math.round((val - preWeight.value) * 10) / 10;
  }
}

// ==================== 生命周期 ====================

onMounted(() => {
  loadPatients();
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
            :key="patient.patientId"
            class="patient-item"
            :class="{ 'patient-item--active': selectedPatientId === patient.patientId }"
            @click="selectPatient(patient)"
          >
            <div class="patient-item__name">
              {{ patient.patientName }}
              <ElTag
                v-if="patient.bloodInfectious"
                :type="patient.bloodInfectious === 'HIV' || patient.bloodInfectious === '乙肝' ? 'danger' : 'warning'"
                size="small"
                effect="dark"
                class="infectious-tag"
              >
                {{ patient.bloodInfectious }}
              </ElTag>
            </div>
            <div class="patient-item__info">
              <span>{{ patient.bedNo }}</span>
              <span>{{ patient.gender }}/{{ patient.age }}岁</span>
            </div>
            <div class="patient-item__mode">
              <ElTag size="small" :type="patient.treatmentMode === 'HD' ? 'success' : 'warning'">
                {{ patient.treatmentMode }}
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
                <ElInput v-model="basicInfo.patientName" disabled style="width: 100px" />
              </ElFormItem>
              <ElFormItem label="性别">
                <ElInput v-model="basicInfo.gender" disabled style="width: 60px" />
              </ElFormItem>
              <ElFormItem label="年龄">
                <ElInput :model-value="String(basicInfo.age)" disabled style="width: 60px" />
              </ElFormItem>
              <ElFormItem label="床号">
                <ElInput v-model="basicInfo.bedNo" disabled style="width: 80px" />
              </ElFormItem>
              <ElFormItem label="透析日期">
                <ElDatePicker
                  v-model="basicInfo.dialysisDate"
                  type="date"
                  placeholder="选择日期"
                  value-format="YYYY-MM-DD"
                  style="width: 160px"
                />
              </ElFormItem>
              <ElFormItem label="班次">
                <ElSelect v-model="basicInfo.shift" style="width: 100px">
                  <ElOption
                    v-for="item in SHIFT_OPTIONS"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </ElSelect>
              </ElFormItem>
              <ElFormItem label="治疗模式">
                <ElSelect v-model="basicInfo.treatmentMode" style="width: 200px">
                  <ElOption
                    v-for="item in TREATMENT_MODE_OPTIONS"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </ElSelect>
              </ElFormItem>
              <ElFormItem label="透析器">
                <ElSelect v-model="basicInfo.dialyzer" style="width: 120px">
                  <ElOption
                    v-for="item in DIALYZER_OPTIONS"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </ElSelect>
              </ElFormItem>
              <ElFormItem label="灌流器">
                <ElSelect v-model="basicInfo.perfusor" clearable style="width: 120px">
                  <ElOption
                    v-for="item in PERFUSOR_OPTIONS"
                    :key="item.value"
                    :label="item.label || '无'"
                    :value="item.value"
                  />
                </ElSelect>
              </ElFormItem>
              <ElFormItem label="血管通路">
                <ElSelect v-model="basicInfo.vascularAccess" style="width: 140px">
                  <ElOption
                    v-for="item in VASCULAR_ACCESS_OPTIONS"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </ElSelect>
              </ElFormItem>
            </ElForm>
          </ElCard>

          <!-- 2. 透析处方区 -->
          <ElCard shadow="never" class="section-card">
            <template #header>
              <div class="section-title">透析处方</div>
            </template>
            <ElForm
              ref="prescriptionFormRef"
              :model="prescription"
              label-width="120px"
              size="small"
              :inline="true"
              class="info-form"
            >
              <ElFormItem label="治疗时间">
                <ElInputNumber v-model="prescription.treatmentHour" :min="0" :max="12" style="width: 90px" />
                <span class="form-unit">时</span>
                <ElInputNumber v-model="prescription.treatmentMinute" :min="0" :max="59" style="width: 90px" />
                <span class="form-unit">分</span>
              </ElFormItem>
              <ElFormItem label="血流量">
                <ElInputNumber v-model="prescription.bloodFlow" :min="0" :max="500" :step="10" style="width: 120px" />
                <span class="form-unit">ml/min</span>
              </ElFormItem>
              <ElFormItem label="透析液流量">
                <ElInputNumber v-model="prescription.dialysateFlow" :min="0" :max="1000" :step="50" style="width: 120px" />
                <span class="form-unit">ml/min</span>
              </ElFormItem>
              <ElFormItem label="目标脱水量">
                <ElInputNumber v-model="prescription.targetUfVolume" :min="0" :max="10000" :step="100" style="width: 120px" />
                <span class="form-unit">ml</span>
              </ElFormItem>
              <ElFormItem label="透析液温度">
                <ElInputNumber v-model="prescription.dialysateTemp" :min="34" :max="39" :step="0.5" :precision="1" style="width: 120px" />
                <span class="form-unit">℃</span>
              </ElFormItem>
              <ElFormItem label="抗凝剂类型">
                <ElSelect v-model="prescription.anticoagulantType" style="width: 140px">
                  <ElOption
                    v-for="item in ANTICOAGULANT_OPTIONS"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </ElSelect>
              </ElFormItem>
              <ElFormItem label="首剂量">
                <ElInput v-model="prescription.firstDose" placeholder="如 4000IU" style="width: 120px" />
              </ElFormItem>
              <ElFormItem label="追加量">
                <ElInput v-model="prescription.additionalDose" placeholder="如 1000IU" style="width: 120px" />
              </ElFormItem>
              <ElFormItem label="追加方式">
                <ElSelect v-model="prescription.additionalMethod" style="width: 140px">
                  <ElOption
                    v-for="item in ADDITIONAL_METHOD_OPTIONS"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </ElSelect>
              </ElFormItem>
              <ElFormItem label="钠浓度">
                <ElInputNumber v-model="prescription.sodiumConcentration" :min="130" :max="155" :step="1" style="width: 120px" />
                <span class="form-unit">mmol/L</span>
              </ElFormItem>
              <ElFormItem label="钙浓度">
                <ElInputNumber v-model="prescription.calciumConcentration" :min="1.0" :max="2.0" :step="0.1" :precision="1" style="width: 120px" />
                <span class="form-unit">mmol/L</span>
              </ElFormItem>
              <ElFormItem label="碳酸氢根浓度">
                <ElInputNumber v-model="prescription.bicarbonateConcentration" :min="20" :max="45" :step="1" style="width: 120px" />
                <span class="form-unit">mmol/L</span>
              </ElFormItem>
            </ElForm>
          </ElCard>

          <!-- 3. 透析过程记录区 -->
          <ElCard shadow="never" class="section-card">
            <template #header>
              <div class="section-title">透析过程记录</div>
            </template>
            <ElTable
              :data="processRecords"
              border
              size="small"
              class="process-table"
              max-height="320"
            >
              <ElTableColumn prop="timePoint" label="时间点" width="80" fixed align="center" />
              <ElTableColumn label="血流量\n(ml/min)" width="110" align="center">
                <template #default="{ row }">
                  <ElInputNumber
                    v-model="row.bloodFlow"
                    :min="0"
                    :max="500"
                    size="small"
                    :controls="false"
                    style="width: 80px"
                  />
                </template>
              </ElTableColumn>
              <ElTableColumn label="静脉压\n(mmHg)" width="110" align="center">
                <template #default="{ row }">
                  <ElInputNumber
                    v-model="row.venousPressure"
                    :min="0"
                    :max="400"
                    size="small"
                    :controls="false"
                    style="width: 80px"
                  />
                </template>
              </ElTableColumn>
              <ElTableColumn label="跨膜压\n(mmHg)" width="110" align="center">
                <template #default="{ row }">
                  <ElInputNumber
                    v-model="row.tmp"
                    :min="0"
                    :max="600"
                    size="small"
                    :controls="false"
                    style="width: 80px"
                  />
                </template>
              </ElTableColumn>
              <ElTableColumn label="超滤率\n(ml/h)" width="110" align="center">
                <template #default="{ row }">
                  <ElInputNumber
                    v-model="row.ufRate"
                    :min="0"
                    :max="3000"
                    size="small"
                    :controls="false"
                    style="width: 80px"
                  />
                </template>
              </ElTableColumn>
              <ElTableColumn label="超滤量\n(ml)" width="110" align="center">
                <template #default="{ row }">
                  <ElInputNumber
                    v-model="row.ufVolume"
                    :min="0"
                    :max="10000"
                    size="small"
                    :controls="false"
                    style="width: 80px"
                  />
                </template>
              </ElTableColumn>
              <ElTableColumn label="透析液流量\n(ml/min)" width="120" align="center">
                <template #default="{ row }">
                  <ElInputNumber
                    v-model="row.dialysateFlow"
                    :min="0"
                    :max="1000"
                    size="small"
                    :controls="false"
                    style="width: 80px"
                  />
                </template>
              </ElTableColumn>
              <ElTableColumn label="透析液温度\n(℃)" width="110" align="center">
                <template #default="{ row }">
                  <ElInputNumber
                    v-model="row.dialysateTemp"
                    :min="34"
                    :max="39"
                    :step="0.5"
                    :precision="1"
                    size="small"
                    :controls="false"
                    style="width: 80px"
                  />
                </template>
              </ElTableColumn>
              <ElTableColumn label="抗凝剂追加" width="140">
                <template #default="{ row }">
                  <ElInput v-model="row.anticoagulantAdd" size="small" />
                </template>
              </ElTableColumn>
              <ElTableColumn label="处理记录/备注" min-width="160">
                <template #default="{ row }">
                  <ElInput v-model="row.remark" size="small" />
                </template>
              </ElTableColumn>
            </ElTable>
          </ElCard>

          <!-- 4. 透析小结区 -->
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
                <ElInput v-model="summary.actualTreatmentTime" placeholder="如 4小时0分钟" style="width: 160px" />
              </ElFormItem>
              <ElFormItem label="实际超滤量">
                <ElInputNumber v-model="summary.actualUfVolume" :min="0" :max="10000" :step="50" style="width: 120px" />
                <span class="form-unit">ml</span>
              </ElFormItem>
              <ElFormItem label="透析前体重">
                <ElInputNumber v-model="preWeight" :min="0" :max="300" :step="0.1" :precision="1" style="width: 120px" />
                <span class="form-unit">kg</span>
              </ElFormItem>
              <ElFormItem label="透析后体重">
                <ElInputNumber
                  v-model="summary.postWeight"
                  :min="0"
                  :max="300"
                  :step="0.1"
                  :precision="1"
                  style="width: 120px"
                  @change="onPostWeightChange"
                />
                <span class="form-unit">kg</span>
              </ElFormItem>
              <ElFormItem label="体重变化">
                <ElInput
                  :model-value="summary.weightChange !== null ? `${summary.weightChange > 0 ? '+' : ''}${summary.weightChange} kg` : ''"
                  disabled
                  style="width: 120px"
                />
              </ElFormItem>
            </ElForm>

            <ElDivider content-position="left">透析中症状/并发症</ElDivider>
            <ElCheckboxGroup v-model="summary.symptoms" class="symptoms-group">
              <ElCheckbox
                v-for="symptom in SYMPTOM_OPTIONS"
                :key="symptom"
                :label="symptom"
                :value="symptom"
              />
            </ElCheckboxGroup>

            <ElDivider content-position="left">处理措施</ElDivider>
            <ElInput
              v-model="summary.treatmentMeasures"
              type="textarea"
              :rows="3"
              placeholder="请输入处理措施..."
              style="width: 100%"
            />

            <ElDivider content-position="left">医生签名</ElDivider>
            <ElInput
              v-model="summary.doctorSign"
              placeholder="请输入医生姓名"
              style="width: 200px"
            />
          </ElCard>

          <!-- 5. 底部操作区 -->
          <div class="action-bar">
            <ElButton type="primary" :loading="saving" @click="handleSave">
              保存记录
            </ElButton>
            <ElButton @click="handlePrint">
              打印
            </ElButton>
            <ElButton type="success" :loading="saving" @click="handleSaveAndFinish">
              保存并下机
            </ElButton>
          </div>
        </template>

        <!-- 未选择患者时显示提示 -->
        <template v-else>
          <div class="empty-state">
            <div class="empty-icon">
              <svg viewBox="0 0 1024 1024" width="64" height="64" xmlns="http://www.w3.org/2000/svg">
                <path fill="#c0c4cc" d="M512 64a32 32 0 0 1 32 32v192a32 32 0 0 1-64 0V96a32 32 0 0 1 32-32zm0 640a32 32 0 0 1 32 32v192a32 32 0 1 1-64 0V736a32 32 0 0 1 32-32zM196 544a32 32 0 0 1 32-32h192a32 32 0 1 1 0 64H228a32 32 0 0 1-32-32zm384-32a32 32 0 0 1 0 64h192a32 32 0 1 1 0-64H580z" />
              </svg>
            </div>
            <div class="empty-text">请从左侧选择一位已签到患者</div>
            <div class="empty-sub">选择患者后将显示透析记录单</div>
          </div>
        </template>
      </div>
    </div>
  </Page>
</template>

<style scoped>
/* ==================== 主布局 ==================== */

.dialysis-record-container {
  display: flex;
  height: calc(100vh - 140px);
  min-height: 600px;
  gap: 0;
  background: #f5f7fa;
  border-radius: 4px;
  overflow: hidden;
}

/* ==================== 左侧患者列表 ==================== */

.left-panel {
  width: 200px;
  flex-shrink: 0;
  background: #fff;
  border-right: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  border-bottom: 1px solid #e4e7ed;
  background: #fafafa;
}

.patient-search {
  margin: 8px;
  flex-shrink: 0;
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

.patient-item__name {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 4px;
}

.infectious-tag {
  font-size: 10px !important;
  transform: scale(0.85);
}

.patient-item__info {
  font-size: 11px;
  color: #909399;
  margin-top: 4px;
  display: flex;
  gap: 8px;
}

.patient-item__mode {
  margin-top: 4px;
}

.no-data {
  text-align: center;
  color: #c0c4cc;
  padding: 40px 0;
  font-size: 13px;
}

/* ==================== 右侧内容区 ==================== */

.right-panel {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.section-card {
  margin-bottom: 12px;
}

.section-card :deep(.el-card__header) {
  padding: 8px 16px;
  background: #fafbfc;
  border-bottom: 1px solid #ebeef5;
}

.section-card :deep(.el-card__body) {
  padding: 12px 16px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

/* ==================== 表单样式 ==================== */

.info-form {
  display: flex;
  flex-wrap: wrap;
  gap: 0;
}

.info-form :deep(.el-form-item) {
  margin-bottom: 8px;
  margin-right: 16px;
}

.form-unit {
  margin-left: 4px;
  font-size: 12px;
  color: #909399;
  white-space: nowrap;
}

/* ==================== 过程记录表格 ==================== */

.process-table :deep(.el-table__header th) {
  padding: 4px 0;
  font-size: 12px;
}

.process-table :deep(.el-table__body td) {
  padding: 4px 0;
}

.process-table :deep(.el-input-number .el-input__inner) {
  text-align: center;
  padding: 0 4px;
}

.process-table :deep(.el-input .el-input__inner) {
  padding: 0 4px;
}

/* ==================== 症状多选 ==================== */

.symptoms-group {
  display: flex;
  flex-wrap: wrap;
  gap: 0;
}

.symptoms-group :deep(.el-checkbox) {
  margin-right: 16px;
  margin-bottom: 8px;
}

/* ==================== 操作栏 ==================== */

.action-bar {
  display: flex;
  justify-content: center;
  gap: 16px;
  padding: 16px 0 24px;
  background: #fff;
  border-top: 1px solid #ebeef5;
  margin-top: 12px;
  border-radius: 4px;
}

/* ==================== 空状态 ==================== */

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 400px;
}

.empty-icon {
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-text {
  font-size: 16px;
  color: #909399;
  margin-bottom: 8px;
}

.empty-sub {
  font-size: 13px;
  color: #c0c4cc;
}
</style>
