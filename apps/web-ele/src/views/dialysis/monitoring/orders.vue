<script lang="ts" setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { Page } from '@vben/common-ui';
import {
  ElCard,
  ElButton,
  ElTable,
  ElTableColumn,
  ElTag,
  ElInput,
  ElSelect,
  ElOption,
  ElDialog,
  ElForm,
  ElFormItem,
  ElCollapse,
  ElCollapseItem,
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
  bloodInfectious: string;
  shift: string;
}

/** 过敏记录 */
interface AllergyRecord {
  allergyId: string;
  allergen: string;
  allergyType: string;
  severity: string;
  reaction: string;
  discoverDate: string;
}

/** 诊断信息 */
interface DiagnosisInfo {
  diagnosisId: string;
  diagnosisName: string;
  diagnosisCode: string;
  diagnosisType: string;
  diagnosisDate: string;
  isPrimary: boolean;
}

/** 用药方案（医嘱） */
interface MedicationOrder {
  orderId: string;
  category: string;
  content: string;
  drugName: string;
  dosage: string;
  frequency: string;
  usage: string;
  remark: string;
  doctor: string;
  orderTime: string;
  orderType: string;
}

/** 停用医嘱 */
interface StoppedOrder {
  orderId: string;
  category: string;
  content: string;
  stopReason: string;
  stopBy: string;
  stopTime: string;
}

/** 开医嘱表单 */
interface NewOrderForm {
  orderType: string;
  drugName: string;
  dosage: string;
  unit: string;
  frequency: string;
  usage: string;
  remark: string;
}

// ==================== 常量 ====================

const ORDER_TYPE_OPTIONS = [
  { label: '长期医嘱', value: '长期' },
  { label: '临时医嘱', value: '临时' },
];

const FREQUENCY_OPTIONS = [
  { label: 'qd（每日一次）', value: 'qd' },
  { label: 'bid（每日两次）', value: 'bid' },
  { label: 'tid（每日三次）', value: 'tid' },
  { label: 'qid（每日四次）', value: 'qid' },
  { label: 'q8h（每8小时一次）', value: 'q8h' },
  { label: 'q12h（每12小时一次）', value: 'q12h' },
  { label: 'qw（每周一次）', value: 'qw' },
  { label: 'qod（隔日一次）', value: 'qod' },
  { label: 'prn（必要时）', value: 'prn' },
  { label: 'st（立即）', value: 'st' },
  { label: '透析时', value: '透析时' },
];

const USAGE_OPTIONS = [
  { label: '口服', value: '口服' },
  { label: '静脉注射', value: '静脉注射' },
  { label: '静脉滴注', value: '静脉滴注' },
  { label: '皮下注射', value: '皮下注射' },
  { label: '肌肉注射', value: '肌肉注射' },
  { label: '外用', value: '外用' },
  { label: '含服', value: '含服' },
  { label: '吸入', value: '吸入' },
  { label: '透析中给药', value: '透析中给药' },
];

const UNIT_OPTIONS = [
  { label: 'mg', value: 'mg' },
  { label: 'g', value: 'g' },
  { label: 'ml', value: 'ml' },
  { label: 'IU', value: 'IU' },
  { label: 'ug', value: 'ug' },
  { label: '片', value: '片' },
  { label: '粒', value: '粒' },
  { label: '支', value: '支' },
  { label: '袋', value: '袋' },
];

const DRUG_SEARCH_OPTIONS = [
  { label: '低分子肝素钙注射液', value: '低分子肝素钙注射液' },
  { label: '低分子肝素钠注射液', value: '低分子肝素钠注射液' },
  { label: '普通肝素钠注射液', value: '普通肝素钠注射液' },
  { label: '促红细胞生成素注射液（EPO）', value: '促红细胞生成素注射液（EPO）' },
  { label: '蔗糖铁注射液', value: '蔗糖铁注射液' },
  { label: '碳酸氢钠片', value: '碳酸氢钠片' },
  { label: '碳酸钙D3片', value: '碳酸钙D3片' },
  { label: '骨化三醇胶丸（活性维生素D）', value: '骨化三醇胶丸（活性维生素D）' },
  { label: '司维拉姆片', value: '司维拉姆片' },
  { label: '碳酸镧咀嚼片', value: '碳酸镧咀嚼片' },
  { label: '呋塞米片（速尿）', value: '呋塞米片（速尿）' },
  { label: '硝苯地平控释片', value: '硝苯地平控释片' },
  { label: '缬沙坦胶囊', value: '缬沙坦胶囊' },
  { label: '左卡尼汀注射液', value: '左卡尼汀注射液' },
  { label: '维生素B族片', value: '维生素B族片' },
  { label: '叶酸片', value: '叶酸片' },
  { label: '阿托伐他汀钙片', value: '阿托伐他汀钙片' },
  { label: '盐酸曲美他嗪片', value: '盐酸曲美他嗪片' },
];

// ==================== 状态 ====================

const loading = ref(false);

// 左侧患者列表
const patientList = ref<SignedPatient[]>([]);
const selectedPatientId = ref('');
const searchPatient = ref('');

// 过敏记录
const allergyRecords = ref<AllergyRecord[]>([]);

// 诊断信息
const diagnosisList = ref<DiagnosisInfo[]>([]);

// 用药方案
const medicationOrders = ref<MedicationOrder[]>([]);
const activeOrdersExpanded = ref(['长期医嘱', '临时医嘱']);

// 停用医嘱
const stoppedOrders = ref<StoppedOrder[]>([]);
const stoppedOrdersExpanded = ref(['停用医嘱']);

// 治疗模式显示
const treatmentModeDisplay = ref('');
const dialyzerDisplay = ref('');

// 开医嘱弹窗
const orderDialogVisible = ref(false);
const orderFormRef = ref<FormInstance>();
const orderForm = reactive<NewOrderForm>({
  orderType: '长期',
  drugName: '',
  dosage: '',
  unit: 'mg',
  frequency: 'qd',
  usage: '口服',
  remark: '',
});

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

// /** 获取用药方案和过敏记录 */
// async function fetchMedicationAndAllergy(patientId: string) {
//   const res = await axios.get('/api/v1/OpenDoctorAdvice/4003', {
//     params: { PatientId: patientId },
//     headers: getHeaders(),
//   });
//   if (res.data?.Code === 0) {
//     return res.data.Data;
//   }
//   return null;
// }

// /** 获取停用医嘱 */
// async function fetchStoppedOrders(patientId: string) {
//   const res = await axios.get('/api/v1/MedicationPlan/4012', {
//     params: { PatientId: patientId },
//     headers: getHeaders(),
//   });
//   if (res.data?.Code === 0) {
//     return res.data.Data ?? [];
//   }
//   return [];
// }

// /** 获取诊断信息 */
// async function fetchDiagnosisInfo(patientId: string) {
//   const res = await axios.get('/api/v1/CaseHomePage/4001', {
//     params: { PatientId: patientId },
//     headers: getHeaders(),
//   });
//   if (res.data?.Code === 0) {
//     return res.data.Data ?? [];
//   }
//   return [];
// }

// ==================== Mock 数据 ====================

function generateMockPatients(): SignedPatient[] {
  return [
    {
      patientId: 'P10001', patientName: '张三', gender: '男', age: 58,
      bedNo: '1号床', treatmentMode: 'HD', dialyzer: 'FX80',
      bloodInfectious: '乙肝', shift: '上午',
    },
    {
      patientId: 'P10002', patientName: '李四', gender: '女', age: 45,
      bedNo: '2号床', treatmentMode: 'HDF', dialyzer: 'FX100',
      bloodInfectious: '', shift: '上午',
    },
    {
      patientId: 'P10003', patientName: '王五', gender: '男', age: 62,
      bedNo: '3号床', treatmentMode: 'HD+HP', dialyzer: 'F60S',
      bloodInfectious: '丙肝', shift: '上午',
    },
    {
      patientId: 'P10004', patientName: '赵六', gender: '男', age: 71,
      bedNo: '4号床', treatmentMode: 'HD', dialyzer: 'F80S',
      bloodInfectious: '', shift: '上午',
    },
    {
      patientId: 'P10005', patientName: '钱七', gender: '女', age: 53,
      bedNo: '5号床', treatmentMode: 'CRRT', dialyzer: 'Polyflux 17L',
      bloodInfectious: 'HIV', shift: '上午',
    },
    {
      patientId: 'P10006', patientName: '孙八', gender: '男', age: 39,
      bedNo: '6号床', treatmentMode: 'HF', dialyzer: 'FX80',
      bloodInfectious: '', shift: '上午',
    },
    {
      patientId: 'P10007', patientName: '周九', gender: '女', age: 67,
      bedNo: '7号床', treatmentMode: 'HDF', dialyzer: 'FX100',
      bloodInfectious: '梅毒', shift: '上午',
    },
    {
      patientId: 'P10008', patientName: '吴十', gender: '男', age: 44,
      bedNo: '8号床', treatmentMode: 'HD', dialyzer: 'FX80',
      bloodInfectious: '', shift: '上午',
    },
  ];
}

function generateMockAllergies(): AllergyRecord[] {
  return [
    {
      allergyId: 'ALG001',
      allergen: '青霉素类',
      allergyType: '药物过敏',
      severity: '重度',
      reaction: '过敏性休克',
      discoverDate: '2020-03-15',
    },
    {
      allergyId: 'ALG002',
      allergen: '磺胺类药物',
      allergyType: '药物过敏',
      severity: '中度',
      reaction: '皮疹、瘙痒',
      discoverDate: '2021-07-22',
    },
  ];
}

function generateMockDiagnosis(): DiagnosisInfo[] {
  return [
    {
      diagnosisId: 'DG001',
      diagnosisName: '慢性肾脏病5期',
      diagnosisCode: 'N18.5',
      diagnosisType: '主要诊断',
      diagnosisDate: '2022-01-10',
      isPrimary: true,
    },
    {
      diagnosisId: 'DG002',
      diagnosisName: '肾性贫血',
      diagnosisCode: 'D63.1',
      diagnosisType: '并发症',
      diagnosisDate: '2022-01-10',
      isPrimary: false,
    },
    {
      diagnosisId: 'DG003',
      diagnosisName: '肾性骨营养不良',
      diagnosisCode: 'N25.0',
      diagnosisType: '并发症',
      diagnosisDate: '2022-03-15',
      isPrimary: false,
    },
    {
      diagnosisId: 'DG004',
      diagnosisName: '高血压病3级（极高危）',
      diagnosisCode: 'I11.9',
      diagnosisType: '合并症',
      diagnosisDate: '2020-06-20',
      isPrimary: false,
    },
    {
      diagnosisId: 'DG005',
      diagnosisName: '2型糖尿病',
      diagnosisCode: 'E11.9',
      diagnosisType: '合并症',
      diagnosisDate: '2018-09-05',
      isPrimary: false,
    },
  ];
}

function generateMockMedicationOrders(): MedicationOrder[] {
  return [
    {
      orderId: 'ORD001',
      category: '透析用药',
      content: '低分子肝素钙注射液 4000IU 透析时 皮下注射',
      drugName: '低分子肝素钙注射液',
      dosage: '4000IU',
      frequency: '透析时',
      usage: '皮下注射',
      remark: '抗凝',
      doctor: '王主任',
      orderTime: '2026-05-01 08:30:00',
      orderType: '长期',
    },
    {
      orderId: 'ORD002',
      category: '降压药',
      content: '硝苯地平控释片 30mg qd 口服',
      drugName: '硝苯地平控释片',
      dosage: '30mg',
      frequency: 'qd',
      usage: '口服',
      remark: '控制血压',
      doctor: '王主任',
      orderTime: '2026-05-01 08:30:00',
      orderType: '长期',
    },
    {
      orderId: 'ORD003',
      category: '纠正贫血',
      content: '促红细胞生成素注射液（EPO） 3000IU qw 皮下注射',
      drugName: '促红细胞生成素注射液（EPO）',
      dosage: '3000IU',
      frequency: 'qw',
      usage: '皮下注射',
      remark: '目标Hb 110-120g/L',
      doctor: '王主任',
      orderTime: '2026-05-01 08:30:00',
      orderType: '长期',
    },
    {
      orderId: 'ORD004',
      category: '补铁',
      content: '蔗糖铁注射液 100mg qw 透析中给药',
      drugName: '蔗糖铁注射液',
      dosage: '100mg',
      frequency: 'qw',
      usage: '透析中给药',
      remark: '铁蛋白<100ng/ml时使用',
      doctor: '王主任',
      orderTime: '2026-05-01 08:30:00',
      orderType: '长期',
    },
    {
      orderId: 'ORD005',
      category: '钙磷代谢',
      content: '碳酸钙D3片 600mg tid 口服',
      drugName: '碳酸钙D3片',
      dosage: '600mg',
      frequency: 'tid',
      usage: '口服',
      remark: '随餐服用',
      doctor: '王主任',
      orderTime: '2026-05-01 08:30:00',
      orderType: '长期',
    },
    {
      orderId: 'ORD006',
      category: '钙磷代谢',
      content: '骨化三醇胶丸（活性维生素D） 0.25ug qd 口服',
      drugName: '骨化三醇胶丸（活性维生素D）',
      dosage: '0.25ug',
      frequency: 'qd',
      usage: '口服',
      remark: '监测血钙',
      doctor: '王主任',
      orderTime: '2026-05-01 08:30:00',
      orderType: '长期',
    },
    {
      orderId: 'ORD007',
      category: '降脂药',
      content: '阿托伐他汀钙片 20mg qn 口服',
      drugName: '阿托伐他汀钙片',
      dosage: '20mg',
      frequency: 'qd',
      usage: '口服',
      remark: '睡前服用',
      doctor: '李副主任',
      orderTime: '2026-05-01 08:30:00',
      orderType: '长期',
    },
    {
      orderId: 'ORD008',
      category: '营养支持',
      content: '左卡尼汀注射液 1g 透析中给药',
      drugName: '左卡尼汀注射液',
      dosage: '1g',
      frequency: '透析时',
      usage: '透析中给药',
      remark: '改善乏力症状',
      doctor: '李副主任',
      orderTime: '2026-05-01 08:30:00',
      orderType: '长期',
    },
    {
      orderId: 'ORD009',
      category: '透析用药',
      content: '呋塞米片 20mg st 口服',
      drugName: '呋塞米片（速尿）',
      dosage: '20mg',
      frequency: 'st',
      usage: '口服',
      remark: '透析间期水肿明显时使用',
      doctor: '王主任',
      orderTime: '2026-05-10 10:15:00',
      orderType: '临时',
    },
    {
      orderId: 'ORD010',
      category: '透析用药',
      content: '碳酸氢钠片 0.5g tid 口服',
      drugName: '碳酸氢钠片',
      dosage: '0.5g',
      frequency: 'tid',
      usage: '口服',
      remark: '纠正代谢性酸中毒',
      doctor: '李副主任',
      orderTime: '2026-05-10 10:20:00',
      orderType: '临时',
    },
  ];
}

function generateMockStoppedOrders(): StoppedOrder[] {
  return [
    {
      orderId: 'SORD001',
      category: '降压药',
      content: '缬沙坦胶囊 80mg qd 口服',
      stopReason: '血钾偏高，更换为其他降压药',
      stopBy: '王主任',
      stopTime: '2026-04-20 09:00:00',
    },
    {
      orderId: 'SORD002',
      category: '降磷药',
      content: '司维拉姆片 800mg tid 口服',
      stopReason: '患者胃肠道反应严重，无法耐受',
      stopBy: '王主任',
      stopTime: '2026-04-15 14:30:00',
    },
    {
      orderId: 'SORD003',
      category: '纠正贫血',
      content: '促红细胞生成素注射液（EPO） 10000IU qw 皮下注射',
      stopReason: 'Hb已达目标值，调整剂量',
      stopBy: '李副主任',
      stopTime: '2026-03-28 10:00:00',
    },
  ];
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

/** 按医嘱类型分组的长期医嘱 */
const longTermOrders = computed(() => {
  return medicationOrders.value.filter((o) => o.orderType === '长期');
});

/** 按医嘱类型分组的临时医嘱 */
const temporaryOrders = computed(() => {
  return medicationOrders.value.filter((o) => o.orderType === '临时');
});

/** 主要诊断 */
const primaryDiagnosis = computed(() => {
  return diagnosisList.value.filter((d) => d.isPrimary);
});

/** 其他诊断 */
const otherDiagnosis = computed(() => {
  return diagnosisList.value.filter((d) => !d.isPrimary);
});

/** 过敏严重程度标签类型 */
function getSeverityTagType(severity: string): 'danger' | 'warning' | 'info' {
  const map: Record<string, 'danger' | 'warning' | 'info'> = {
    '重度': 'danger',
    '中度': 'warning',
    '轻度': 'info',
  };
  return map[severity] || 'info';
}

/** 医嘱类别标签颜色 */
function getCategoryTagType(category: string): '' | 'success' | 'warning' | 'danger' | 'info' {
  const map: Record<string, '' | 'success' | 'warning' | 'danger' | 'info'> = {
    '透析用药': '',
    '降压药': 'warning',
    '纠正贫血': 'danger',
    '补铁': 'danger',
    '钙磷代谢': 'success',
    '降脂药': 'info',
    '营养支持': 'success',
  };
  return map[category] || 'info';
}

// ==================== 业务逻辑 ====================

function loadPatients() {
  patientList.value = generateMockPatients();
}

function selectPatient(patient: SignedPatient) {
  selectedPatientId.value = patient.patientId;
  treatmentModeDisplay.value = `${patient.treatmentMode} / ${patient.dialyzer}`;
  dialyzerDisplay.value = patient.dialyzer;
  loadPatientData(patient);
}

function loadPatientData(patient: SignedPatient) {
  loading.value = true;
  setTimeout(() => {
    // const [medicationData, stoppedData, diagnosisData] = await Promise.all([...]);
    allergyRecords.value = generateMockAllergies();
    diagnosisList.value = generateMockDiagnosis();
    medicationOrders.value = generateMockMedicationOrders();
    stoppedOrders.value = generateMockStoppedOrders();
    loading.value = false;
  }, 400);
}

/** 更新透析方案 */
function handleUpdateDialysisPlan() {
  ElMessage.info('更新透析方案功能开发中...');
}

/** 打开开医嘱弹窗 */
function handleOpenOrderDialog() {
  if (!selectedPatientId.value) {
    ElMessage.warning('请先选择患者');
    return;
  }
  Object.assign(orderForm, {
    orderType: '长期',
    drugName: '',
    dosage: '',
    unit: 'mg',
    frequency: 'qd',
    usage: '口服',
    remark: '',
  });
  orderDialogVisible.value = true;
}

/** 提交开医嘱 */
async function handleSubmitOrder() {
  if (!orderFormRef.value) return;
  await orderFormRef.value.validate(async (valid) => {
    if (!valid) return;

    try {
      const newOrder: MedicationOrder = {
        orderId: `ORD${Date.now()}`,
        category: '透析用药',
        content: `${orderForm.drugName} ${orderForm.dosage}${orderForm.unit} ${orderForm.frequency} ${orderForm.usage}`,
        drugName: orderForm.drugName,
        dosage: `${orderForm.dosage}${orderForm.unit}`,
        frequency: orderForm.frequency,
        usage: orderForm.usage,
        remark: orderForm.remark,
        doctor: sessionStorage.getItem('hdUserName') || '当前医生',
        orderTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
        orderType: orderForm.orderType,
      };

      medicationOrders.value.push(newOrder);
      orderDialogVisible.value = false;
      ElMessage.success('医嘱开立成功');
    } catch {
      ElMessage.error('开立医嘱失败');
    }
  });
}

/** 停用医嘱 */
function handleStopOrder(order: MedicationOrder) {
  ElMessage.warning(`停用医嘱功能开发中...（${order.drugName}）`);
}

/** 删除医嘱 */
function handleDeleteOrder(order: MedicationOrder) {
  ElMessage.warning(`删除医嘱功能开发中...（${order.drugName}）`);
}

// ==================== 生命周期 ====================

onMounted(() => {
  loadPatients();
});
</script>

<template>
  <Page title="开立医嘱">
    <div class="orders-container">
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

      <!-- ========== 右侧：医嘱内容 ========== -->
      <div v-loading="loading" class="right-panel">
        <template v-if="selectedPatientId">
          <!-- 1. 顶部操作栏 -->
          <div class="top-action-bar">
            <div class="top-action-left">
              <ElButton type="primary" @click="handleUpdateDialysisPlan">
                更新透析方案
              </ElButton>
              <ElButton type="success" @click="handleOpenOrderDialog">
                + 开医嘱
              </ElButton>
            </div>
            <div class="top-action-right">
              <span class="treatment-mode-display">
                治疗模式：<ElTag type="primary" effect="plain">{{ treatmentModeDisplay }}</ElTag>
              </span>
              <span class="dialyzer-display">
                透析器：<ElTag type="success" effect="plain">{{ dialyzerDisplay }}</ElTag>
              </span>
            </div>
          </div>

          <!-- 2. 过敏记录区 -->
          <ElCard
            v-if="allergyRecords.length > 0"
            shadow="never"
            class="section-card allergy-card"
          >
            <template #header>
              <div class="section-title allergy-title">
                <svg viewBox="0 0 1024 1024" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
                  <path fill="#f56c6c" d="M512 64a448 448 0 1 1 0 896 448 448 0 0 1 0-896zm0 192a58.432 58.432 0 0 0-58.24 63.744l23.36 256.192a35.072 35.072 0 0 0 69.76 0l23.296-256.192A58.432 58.432 0 0 0 512 256zm0 512a51.2 51.2 0 1 0 0-102.4 51.2 51.2 0 0 0 0 102.4z" />
                </svg>
                过敏记录
              </div>
            </template>
            <div class="allergy-list">
              <div
                v-for="allergy in allergyRecords"
                :key="allergy.allergyId"
                class="allergy-item"
              >
                <span class="allergy-allergen">{{ allergy.allergen }}</span>
                <ElTag :type="getSeverityTagType(allergy.severity)" size="small" effect="dark">
                  {{ allergy.severity }}
                </ElTag>
                <span class="allergy-reaction">{{ allergy.reaction }}</span>
                <span class="allergy-date">{{ allergy.discoverDate }}</span>
              </div>
            </div>
          </ElCard>

          <!-- 3. 主要诊断区 -->
          <ElCard shadow="never" class="section-card">
            <template #header>
              <div class="section-title">主要诊断</div>
            </template>
            <div class="diagnosis-list">
              <div
                v-for="diagnosis in diagnosisList"
                :key="diagnosis.diagnosisId"
                class="diagnosis-item"
              >
                <ElTag
                  :type="diagnosis.isPrimary ? 'danger' : 'info'"
                  size="small"
                  effect="dark"
                  class="diagnosis-type-tag"
                >
                  {{ diagnosis.diagnosisType }}
                </ElTag>
                <span class="diagnosis-name">{{ diagnosis.diagnosisName }}</span>
                <span class="diagnosis-code">{{ diagnosis.diagnosisCode }}</span>
                <span class="diagnosis-date">{{ diagnosis.diagnosisDate }}</span>
              </div>
            </div>
          </ElCard>

          <!-- 4. 用药方案区（可折叠） -->
          <ElCard shadow="never" class="section-card">
            <template #header>
              <div class="section-title">用药方案</div>
            </template>
            <ElCollapse v-model="activeOrdersExpanded">
              <ElCollapseItem
                v-if="longTermOrders.length > 0"
                title="长期医嘱"
                name="长期医嘱"
              >
                <ElTable
                  :data="longTermOrders"
                  border
                  size="small"
                  class="order-table"
                >
                  <ElTableColumn prop="category" label="类别" width="100" align="center">
                    <template #default="{ row }">
                      <ElTag :type="getCategoryTagType(row.category)" size="small">
                        {{ row.category }}
                      </ElTag>
                    </template>
                  </ElTableColumn>
                  <ElTableColumn prop="content" label="医嘱内容" min-width="280">
                    <template #default="{ row }">
                      <span class="order-content">{{ row.content }}</span>
                    </template>
                  </ElTableColumn>
                  <ElTableColumn prop="remark" label="备注" width="160">
                    <template #default="{ row }">
                      <span class="order-remark">{{ row.remark }}</span>
                    </template>
                  </ElTableColumn>
                  <ElTableColumn prop="doctor" label="医生" width="90" align="center" />
                  <ElTableColumn prop="orderTime" label="下达时间" width="160" align="center">
                    <template #default="{ row }">
                      <span class="order-time">{{ row.orderTime }}</span>
                    </template>
                  </ElTableColumn>
                  <ElTableColumn label="操作" width="120" align="center" fixed="right">
                    <template #default="{ row }">
                      <ElButton type="warning" link size="small" @click="handleStopOrder(row)">
                        停用
                      </ElButton>
                      <ElButton type="danger" link size="small" @click="handleDeleteOrder(row)">
                        删除
                      </ElButton>
                    </template>
                  </ElTableColumn>
                </ElTable>
              </ElCollapseItem>

              <ElCollapseItem
                v-if="temporaryOrders.length > 0"
                title="临时医嘱"
                name="临时医嘱"
              >
                <ElTable
                  :data="temporaryOrders"
                  border
                  size="small"
                  class="order-table"
                >
                  <ElTableColumn prop="category" label="类别" width="100" align="center">
                    <template #default="{ row }">
                      <ElTag :type="getCategoryTagType(row.category)" size="small">
                        {{ row.category }}
                      </ElTag>
                    </template>
                  </ElTableColumn>
                  <ElTableColumn prop="content" label="医嘱内容" min-width="280">
                    <template #default="{ row }">
                      <span class="order-content">{{ row.content }}</span>
                    </template>
                  </ElTableColumn>
                  <ElTableColumn prop="remark" label="备注" width="160">
                    <template #default="{ row }">
                      <span class="order-remark">{{ row.remark }}</span>
                    </template>
                  </ElTableColumn>
                  <ElTableColumn prop="doctor" label="医生" width="90" align="center" />
                  <ElTableColumn prop="orderTime" label="下达时间" width="160" align="center">
                    <template #default="{ row }">
                      <span class="order-time">{{ row.orderTime }}</span>
                    </template>
                  </ElTableColumn>
                  <ElTableColumn label="操作" width="120" align="center" fixed="right">
                    <template #default="{ row }">
                      <ElButton type="warning" link size="small" @click="handleStopOrder(row)">
                        停用
                      </ElButton>
                      <ElButton type="danger" link size="small" @click="handleDeleteOrder(row)">
                        删除
                      </ElButton>
                    </template>
                  </ElTableColumn>
                </ElTable>
              </ElCollapseItem>
            </ElCollapse>
          </ElCard>

          <!-- 5. 停用医嘱区（可折叠） -->
          <ElCard v-if="stoppedOrders.length > 0" shadow="never" class="section-card">
            <template #header>
              <div class="section-title">停用医嘱</div>
            </template>
            <ElCollapse v-model="stoppedOrdersExpanded">
              <ElCollapseItem title="停用医嘱" name="停用医嘱">
                <ElTable
                  :data="stoppedOrders"
                  border
                  size="small"
                  class="order-table stopped-table"
                >
                  <ElTableColumn prop="category" label="类别" width="100" align="center">
                    <template #default="{ row }">
                      <ElTag type="info" size="small">{{ row.category }}</ElTag>
                    </template>
                  </ElTableColumn>
                  <ElTableColumn prop="content" label="医嘱内容" min-width="240">
                    <template #default="{ row }">
                      <span class="order-content stopped-content">{{ row.content }}</span>
                    </template>
                  </ElTableColumn>
                  <ElTableColumn prop="stopReason" label="停用原因" min-width="200">
                    <template #default="{ row }">
                      <span class="stop-reason">{{ row.stopReason }}</span>
                    </template>
                  </ElTableColumn>
                  <ElTableColumn prop="stopBy" label="停用人" width="90" align="center" />
                  <ElTableColumn prop="stopTime" label="停用时间" width="160" align="center">
                    <template #default="{ row }">
                      <span class="order-time">{{ row.stopTime }}</span>
                    </template>
                  </ElTableColumn>
                </ElTable>
              </ElCollapseItem>
            </ElCollapse>
          </ElCard>
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
            <div class="empty-sub">选择患者后将显示医嘱信息</div>
          </div>
        </template>
      </div>
    </div>

    <!-- ========== 开医嘱弹窗 ========== -->
    <ElDialog
      v-model="orderDialogVisible"
      title="开立医嘱"
      width="600px"
      destroy-on-close
    >
      <ElForm
        ref="orderFormRef"
        :model="orderForm"
        :rules="{
          orderType: [{ required: true, message: '请选择医嘱类型', trigger: 'change' }],
          drugName: [{ required: true, message: '请选择药品', trigger: 'change' }],
          dosage: [{ required: true, message: '请输入剂量', trigger: 'blur' }],
          frequency: [{ required: true, message: '请选择频率', trigger: 'change' }],
          usage: [{ required: true, message: '请选择用法', trigger: 'change' }],
        }"
        label-width="90px"
        size="default"
      >
        <ElFormItem label="医嘱类型" prop="orderType">
          <ElSelect v-model="orderForm.orderType" style="width: 100%">
            <ElOption
              v-for="item in ORDER_TYPE_OPTIONS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="药品名称" prop="drugName">
          <ElSelect
            v-model="orderForm.drugName"
            filterable
            placeholder="请搜索选择药品"
            style="width: 100%"
          >
            <ElOption
              v-for="drug in DRUG_SEARCH_OPTIONS"
              :key="drug.value"
              :label="drug.label"
              :value="drug.value"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="剂量" prop="dosage">
          <div class="dosage-row">
            <ElInput v-model="orderForm.dosage" placeholder="请输入剂量" style="flex: 1" />
            <ElSelect v-model="orderForm.unit" style="width: 100px; margin-left: 8px">
              <ElOption
                v-for="item in UNIT_OPTIONS"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </ElSelect>
          </div>
        </ElFormItem>
        <ElFormItem label="频率" prop="frequency">
          <ElSelect v-model="orderForm.frequency" placeholder="请选择频率" style="width: 100%">
            <ElOption
              v-for="item in FREQUENCY_OPTIONS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="用法" prop="usage">
          <ElSelect v-model="orderForm.usage" placeholder="请选择用法" style="width: 100%">
            <ElOption
              v-for="item in USAGE_OPTIONS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="备注">
          <ElInput
            v-model="orderForm.remark"
            type="textarea"
            :rows="2"
            placeholder="请输入备注（选填）"
          />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="orderDialogVisible = false">取消</ElButton>
        <ElButton type="primary" @click="handleSubmitOrder">开医嘱</ElButton>
      </template>
    </ElDialog>
  </Page>
</template>

<style scoped>
/* ==================== 主布局 ==================== */

.orders-container {
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
  display: flex;
  align-items: center;
  gap: 6px;
}

/* ==================== 顶部操作栏 ==================== */

.top-action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  background: #fff;
  border-radius: 4px;
  margin-bottom: 12px;
  border: 1px solid #ebeef5;
}

.top-action-left {
  display: flex;
  gap: 8px;
}

.top-action-right {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 13px;
  color: #606266;
}

.treatment-mode-display,
.dialyzer-display {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* ==================== 过敏记录 ==================== */

.allergy-card :deep(.el-card__header) {
  background: #fef0f0;
  border-bottom-color: #fbc4c4;
}

.allergy-card :deep(.el-card) {
  border-color: #fbc4c4;
}

.allergy-title {
  color: #f56c6c;
}

.allergy-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.allergy-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #fef0f0;
  border-radius: 4px;
  border: 1px solid #fde2e2;
}

.allergy-allergen {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.allergy-reaction {
  font-size: 13px;
  color: #606266;
  flex: 1;
}

.allergy-date {
  font-size: 12px;
  color: #909399;
}

/* ==================== 诊断信息 ==================== */

.diagnosis-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.diagnosis-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 4px;
  transition: background 0.2s;
}

.diagnosis-item:hover {
  background: #f5f7fa;
}

.diagnosis-type-tag {
  flex-shrink: 0;
}

.diagnosis-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.diagnosis-code {
  font-size: 12px;
  color: #909399;
  font-family: 'Courier New', Courier, monospace;
}

.diagnosis-date {
  font-size: 12px;
  color: #c0c4cc;
  margin-left: auto;
}

/* ==================== 医嘱表格 ==================== */

.order-table :deep(.el-table__header th) {
  padding: 6px 0;
  font-size: 12px;
}

.order-table :deep(.el-table__body td) {
  padding: 6px 0;
}

.order-content {
  font-size: 13px;
  color: #303133;
  line-height: 1.5;
}

.order-remark {
  font-size: 12px;
  color: #909399;
}

.order-time {
  font-size: 12px;
  color: #909399;
}

.stopped-content {
  color: #909399;
  text-decoration: line-through;
}

.stop-reason {
  font-size: 12px;
  color: #e6a23c;
}

.stopped-table :deep(.el-table__body tr) {
  background-color: #fafafa;
}

/* ==================== 折叠面板 ==================== */

:deep(.el-collapse) {
  border: none;
}

:deep(.el-collapse-item__header) {
  font-size: 14px;
  font-weight: 600;
  color: #409eff;
  background: #f0f7ff;
  padding: 0 12px;
  border-radius: 4px;
  height: 36px;
  line-height: 36px;
}

:deep(.el-collapse-item__wrap) {
  border: none;
}

:deep(.el-collapse-item__content) {
  padding: 8px 0 0;
}

/* ==================== 弹窗样式 ==================== */

.dosage-row {
  display: flex;
  align-items: center;
  width: 100%;
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
