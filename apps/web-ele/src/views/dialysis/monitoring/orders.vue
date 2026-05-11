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
  ElMessage,
  ElMessageBox,
} from 'element-plus';
import type { FormInstance } from 'element-plus';
import { swsApi } from '#/api';

// ==================== 类型定义 ====================

/** 已签到患者 */
interface SignedPatient {
  PatientId: string;
  PatientName: string;
  Gender: string;
  Age: number;
  BedNo: string;
  TreatmentMode: string;
  Dialyzer: string;
  BloodInfectious: string;
  Shift: string;
}

/** 过敏记录 */
interface AllergyRecord {
  AllergyId: string;
  Allergen: string;
  AllergyType: string;
  Severity: string;
  Reaction: string;
  DiscoverDate: string;
}

/** 诊断信息 */
interface DiagnosisInfo {
  DiagnosisId: string;
  DiagnosisName: string;
  DiagnosisCode: string;
  DiagnosisType: string;
  DiagnosisDate: string;
  IsPrimary: boolean;
}

/** 医嘱项目 */
interface OrderItem {
  Id: string;
  OrderId: string;
  OrderName: string;
  OrderType: string;
  OrderStatus: string;
  OrderTime: string;
  Category: string;
  Content: string;
  DrugName: string;
  Dosage: string;
  Frequency: string;
  Usage: string;
  Remark: string;
  Doctor: string;
  PerformStatus: number;
  ChargeStatus: string;
  AssociatePresDetailId: string | null;
  MedicalAdviceType: number;
  MedicalItemType: number;
  MedicalItemName: string;
  Specifications: string;
  SingleDose: number;
  DoseUnitName: string;
  FrequencyName: string;
  UsageName: string;
  PrescriptionDate: string;
  RejectState: number;
  RejectName: string;
  RejectUserName: string;
  RejectTime: string;
  RejectReason: string;
  DataState: number;
  IsVisible: string;
}

/** 停用医嘱 */
interface StoppedOrder {
  OrderId: string;
  Category: string;
  Content: string;
  StopReason: string;
  StopBy: string;
  StopTime: string;
}

/** 处方单 */
interface Prescription {
  Id: string;
  PrescriptionNo: string;
  ChargeType: string;
  ChargeStatus: string;
  MedicalAdviceSign: number;
  LongDoctorAdviceType: string;
  CurrPrescriptionDiagnosis: string;
}

/** 开医嘱表单 */
interface NewOrderForm {
  OrderType: string;
  DrugName: string;
  Dosage: string;
  Unit: string;
  Frequency: string;
  Usage: string;
  Remark: string;
  CategoryId: string;
  MedicalItemId: string;
  PrescribingQty: number;
  PrescribingUnit: string;
  WhetherToCharge: number;
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

// ==================== 状态 ====================

const loading = ref(false);
const tableLoading = ref(false);

// 左侧患者列表
const patientList = ref<SignedPatient[]>([]);
const selectedPatientId = ref('');
const searchPatient = ref('');

// 过敏记录
const allergyRecords = ref<AllergyRecord[]>([]);

// 诊断信息
const diagnosisList = ref<DiagnosisInfo[]>([]);

// 医嘱数据
const orderList = ref<OrderItem[]>([]);
const activeOrdersExpanded = ref(['长期医嘱', '临时医嘱']);

// 停用医嘱
const stoppedOrders = ref<StoppedOrder[]>([]);
const stoppedOrdersExpanded = ref(['停用医嘱']);

// 处方单列表
const prescriptionList = ref<Prescription[]>([]);
const selectedPrescriptionId = ref('');

// 当前透析记录ID
const dialysisId = ref('');
const signId = ref('');

// 治疗模式显示
const treatmentModeDisplay = ref('');
const dialyzerDisplay = ref('');

// 医嘱类型标签
const adviceId = ref('1'); // 1=透析医嘱, 3=医疗嘱咐

// 开医嘱弹窗
const orderDialogVisible = ref(false);
const orderFormRef = ref<FormInstance>();
const orderForm = reactive<NewOrderForm>({
  OrderType: '长期',
  DrugName: '',
  Dosage: '',
  Unit: 'mg',
  Frequency: 'qd',
  Usage: '口服',
  Remark: '',
  CategoryId: '',
  MedicalItemId: '',
  PrescribingQty: 1,
  PrescribingUnit: '',
  WhetherToCharge: 1,
});

// 药品类别
const categoryList = ref<any[]>([]);

// 频次和用法
const frequencyItems = ref<any[]>([]);
const usageItems = ref<any[]>([]);

// ==================== 计算属性 ====================

const filteredPatients = computed(() => {
  if (!searchPatient.value) return patientList.value;
  const kw = searchPatient.value.toLowerCase();
  return patientList.value.filter(
    (p) =>
      p.PatientName.toLowerCase().includes(kw) ||
      p.BedNo.toLowerCase().includes(kw) ||
      p.PatientId.toLowerCase().includes(kw),
  );
});

const selectedPatient = computed(() => {
  return patientList.value.find((p) => p.PatientId === selectedPatientId.value);
});

/** 按医嘱类型分组的长期医嘱 */
const longTermOrders = computed(() => {
  return orderList.value.filter((o) => o.OrderType === '长期');
});

/** 按医嘱类型分组的临时医嘱 */
const temporaryOrders = computed(() => {
  return orderList.value.filter((o) => o.OrderType === '临时');
});

/** 主要诊断 */
const primaryDiagnosis = computed(() => {
  return diagnosisList.value.filter((d) => d.IsPrimary);
});

/** 其他诊断 */
const otherDiagnosis = computed(() => {
  return diagnosisList.value.filter((d) => !d.IsPrimary);
});

// ==================== API 调用 ====================

/** 获取已签到患者列表 */
async function getSignedPatientList() {
  try {
    const date = new Date().toISOString().split('T')[0];
    const res = await swsApi.swsGet('SchedulingManage/4006', {
      Date: date,
      Shift: '',
    });
    if (res.Code === 200 && res.Data) {
      patientList.value = res.Data.map((item: any) => ({
        PatientId: item.PatientId,
        PatientName: item.PatientName,
        Gender: item.Sex,
        Age: item.Age,
        BedNo: item.BedNo || item.SickbedNo || '',
        TreatmentMode: item.ActualDialysisType || item.DialysisType || '',
        Dialyzer: item.Dialyzer || '',
        BloodInfectious: item.BloodInfectious || '',
        Shift: item.ActualShift || item.Shift || '',
      }));
    }
  } catch (error) {
    ElMessage.error('获取患者列表失败');
  }
}

/** 获取患者透析记录 */
async function getDialysisRecord(patientId: string) {
  try {
    const date = new Date().toISOString().split('T')[0];
    const res = await swsApi.swsGet('DialysisRecordManage/4001', {
      PatientId: patientId,
      PatientCycleSchedulingId: signId.value,
    });
    if (res.Code === 200 && res.Data) {
      dialysisId.value = res.Data.Id || '';
      treatmentModeDisplay.value = `${res.Data.DialysisType || ''} / ${res.Data.Dialyzer || ''}`;
      dialyzerDisplay.value = res.Data.Dialyzer || '';
    }
  } catch (error) {
    console.error('获取透析记录失败', error);
  }
}

/** 获取过敏记录 */
async function getAllergyRecords(patientId: string) {
  try {
    const res = await swsApi.swsGet('OpenDoctorAdvice/4003', {
      PatientId: patientId,
    });
    if (res.Code === 200 && res.Data) {
      allergyRecords.value = res.Data.AllergyList || [];
    }
  } catch (error) {
    console.error('获取过敏记录失败', error);
  }
}

/** 获取诊断信息 */
async function getDiagnosisInfo(patientId: string) {
  try {
    const res = await swsApi.swsGet('CaseHomePage/4001', {
      PatientId: patientId,
    });
    if (res.Code === 200 && res.Data) {
      diagnosisList.value = res.Data || [];
    }
  } catch (error) {
    console.error('获取诊断信息失败', error);
  }
}

/** 获取医嘱列表 */
async function getOrderList(medicalAdviceType: string = '1') {
  if (!selectedPatientId.value) return;
  
  tableLoading.value = true;
  try {
    const res = await swsApi.swsGet('OpenDoctorAdvice/4001', {
      PatientId: selectedPatientId.value,
      MedicalAdviceType: medicalAdviceType,
      DialysisId: dialysisId.value,
    });
    if (res.Code === 200 && res.Data) {
      prescriptionList.value = res.Data.map((item: any) => ({
        Id: item.Id,
        PrescriptionNo: item.PrescriptionNo,
        ChargeType: item.ChargeType,
        ChargeStatus: item.ChargeStatus,
        MedicalAdviceSign: item.MedicalAdviceSign,
        LongDoctorAdviceType: item.LongDoctorAdviceType,
        CurrPrescriptionDiagnosis: item.CurrPrescriptionDiagnosis,
      }));
      
      // 默认选中第一个处方单
      if (prescriptionList.value.length > 0 && !selectedPrescriptionId.value) {
        selectedPrescriptionId.value = prescriptionList.value[0].Id;
        await getPrescriptionDetail(selectedPrescriptionId.value);
      }
    }
  } catch (error) {
    ElMessage.error('获取医嘱列表失败');
  } finally {
    tableLoading.value = false;
  }
}

/** 获取处方单明细 */
async function getPrescriptionDetail(prescriptionId: string) {
  if (!prescriptionId) return;
  
  tableLoading.value = true;
  try {
    const res = await swsApi.swsGet('OpenDoctorAdvice/4004', {
      PrescriptionId: prescriptionId,
    });
    if (res.Code === 200 && res.Data) {
      orderList.value = res.Data.map((item: any) => ({
        Id: item.Id,
        OrderId: item.Id,
        OrderName: item.MedicalItemName,
        OrderType: item.MedicalAdviceType === 1 ? '长期' : '临时',
        OrderStatus: item.ChargeStatus === '1' ? '未收费' : '已收费',
        OrderTime: item.PrescriptionDate,
        Category: item.CatalogueName || '透析用药',
        Content: item.MedicalContent,
        DrugName: item.MedicalItemName,
        Dosage: `${item.SingleDose || ''} ${item.DoseUnitName || ''}`,
        Frequency: item.FrequencyName,
        Usage: item.UsageName,
        Remark: item.Remark,
        Doctor: item.DoctorName,
        PerformStatus: item.PerformStatus,
        ChargeStatus: item.ChargeStatus,
        AssociatePresDetailId: item.AssociatePresDetailId,
        MedicalAdviceType: item.MedicalAdviceType,
        MedicalItemType: item.MedicalItemType,
        MedicalItemName: item.MedicalItemName,
        Specifications: item.Specifications,
        SingleDose: item.SingleDose,
        DoseUnitName: item.DoseUnitName,
        FrequencyName: item.FrequencyName,
        UsageName: item.UsageName,
        PrescriptionDate: item.PrescriptionDate,
        RejectState: item.RejectState,
        RejectName: item.RejectName,
        RejectUserName: item.RejectUserName,
        RejectTime: item.RejectTime,
        RejectReason: item.RejectReason,
        DataState: item.DataState,
        IsVisible: item.IsVisible,
      }));
    }
  } catch (error) {
    ElMessage.error('获取处方明细失败');
  } finally {
    tableLoading.value = false;
  }
}

/** 获取停用医嘱 */
async function getStoppedOrders(patientId: string) {
  try {
    const res = await swsApi.swsGet('MedicationPlan/4012', {
      PatientId: patientId,
    });
    if (res.Code === 200 && res.Data) {
      stoppedOrders.value = res.Data || [];
    }
  } catch (error) {
    console.error('获取停用医嘱失败', error);
  }
}

/** 获取药品类别 */
async function getCategoryList() {
  try {
    const res = await swsApi.swsGet('MedicationPlan/4002', {});
    if (res.Code === 200 && res.Data) {
      categoryList.value = res.Data;
    }
  } catch (error) {
    console.error('获取药品类别失败', error);
  }
}

/** 获取用法和频次 */
async function getWayType() {
  try {
    const res = await swsApi.swsGet('UseWays/4004', {});
    if (res.Code === 200 && res.Data) {
      const arr1 = [];
      const arr2 = [];
      for (const item of res.Data) {
        if (item.WayType === 1) {
          arr1.push(item);
        } else if (item.WayType === 2) {
          arr2.push(item);
        }
      }
      usageItems.value = arr1;
      frequencyItems.value = arr2;
    }
  } catch (error) {
    console.error('获取用法频次失败', error);
  }
}

/** 保存医嘱 */
async function saveOrder(formData: NewOrderForm) {
  try {
    const jsonStr = {
      PatientId: selectedPatientId.value,
      MedicalAdviceType: 1,
      PrescriptionId: selectedPrescriptionId.value,
      MaterialId: formData.MedicalItemId,
      CategoryId: formData.CategoryId,
      MedicalContent: `${formData.DrugName} ${formData.Dosage}${formData.Unit} ${formData.Frequency} ${formData.Usage}`,
      PrescribingQty: formData.PrescribingQty,
      PrescribingUnit: formData.PrescribingUnit,
      SingleDose: Number(formData.Dosage),
      DoseUnitName: formData.Unit,
      FrequencyId: formData.Frequency,
      UsageId: formData.Usage,
      WhetherToCharge: formData.WhetherToCharge,
      Remark: formData.Remark,
      DialysisId: dialysisId.value,
      PrescriptionDate: new Date().toISOString().replace('T', ' ').slice(0, 19),
    };
    
    const res = await swsApi.swsPost('OpenDoctorAdvice/1001', jsonStr);
    if (res.Code === 200) {
      ElMessage.success(res.Msg || '医嘱开立成功');
      orderDialogVisible.value = false;
      // 刷新列表
      getPrescriptionDetail(selectedPrescriptionId.value);
    } else {
      ElMessage.error(res.Msg || '开立医嘱失败');
    }
  } catch (error) {
    ElMessage.error('开立医嘱失败');
  }
}

/** 删除医嘱 */
async function deleteOrder(orderId: string) {
  try {
    const res = await swsApi.swsDelete('OpenDoctorAdvice/2001', {
      Id: orderId,
    });
    if (res.Code === 200) {
      ElMessage.success(res.Msg || '删除成功');
      // 刷新列表
      getPrescriptionDetail(selectedPrescriptionId.value);
    } else {
      ElMessage.error(res.Msg || '删除失败');
    }
  } catch (error) {
    ElMessage.error('删除医嘱失败');
  }
}

/** 停用医嘱 */
async function stopOrder(orderId: string) {
  try {
    const res = await swsApi.swsPut('OpenDoctorAdvice/3003', {
      Id: orderId,
    });
    if (res.Code === 200) {
      ElMessage.success(res.Msg || '停用成功');
      // 刷新列表
      getPrescriptionDetail(selectedPrescriptionId.value);
    } else {
      ElMessage.error(res.Msg || '停用失败');
    }
  } catch (error) {
    ElMessage.error('停用医嘱失败');
  }
}

/** 新增处方单 */
async function addPrescription() {
  try {
    const res = await swsApi.swsPost('OpenDoctorAdvice/1002', {
      PatientId: selectedPatientId.value,
      PatientCycleSchedulingId: signId.value,
      MedicalAdviceType: adviceId.value,
      DialysisId: dialysisId.value,
    });
    if (res.Code === 200) {
      ElMessage.success(res.Msg || '新增处方单成功');
      getOrderList(adviceId.value);
    } else {
      ElMessage.error(res.Msg || '新增处方单失败');
    }
  } catch (error) {
    ElMessage.error('新增处方单失败');
  }
}

/** 删除处方单 */
async function deletePrescription(prescriptionId: string) {
  try {
    const res = await swsApi.swsDelete('OpenDoctorAdvice/2002', {
      Id: prescriptionId,
    });
    if (res.Code === 200) {
      ElMessage.success(res.Msg || '删除处方单成功');
      selectedPrescriptionId.value = '';
      getOrderList(adviceId.value);
    } else {
      ElMessage.error(res.Msg || '删除处方单失败');
    }
  } catch (error) {
    ElMessage.error('删除处方单失败');
  }
}

// ==================== 业务逻辑 ====================

function selectPatient(patient: SignedPatient) {
  selectedPatientId.value = patient.PatientId;
  treatmentModeDisplay.value = `${patient.TreatmentMode} / ${patient.Dialyzer}`;
  dialyzerDisplay.value = patient.Dialyzer;
  loadPatientData(patient);
}

async function loadPatientData(patient: SignedPatient) {
  loading.value = true;
  await Promise.all([
    getDialysisRecord(patient.PatientId),
    getAllergyRecords(patient.PatientId),
    getDiagnosisInfo(patient.PatientId),
    getOrderList(adviceId.value),
    getStoppedOrders(patient.PatientId),
  ]);
  loading.value = false;
}

/** 选择处方单 */
function selectPrescription(prescription: Prescription) {
  selectedPrescriptionId.value = prescription.Id;
  getPrescriptionDetail(prescription.Id);
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
  if (!selectedPrescriptionId.value) {
    ElMessage.warning('请先选择或创建处方单');
    return;
  }
  
  // 重置表单
  Object.assign(orderForm, {
    OrderType: '长期',
    DrugName: '',
    Dosage: '',
    Unit: 'mg',
    Frequency: 'qd',
    Usage: '口服',
    Remark: '',
    CategoryId: '',
    MedicalItemId: '',
    PrescribingQty: 1,
    PrescribingUnit: '',
    WhetherToCharge: 1,
  });
  
  orderDialogVisible.value = true;
}

/** 提交开医嘱 */
async function handleSubmitOrder() {
  if (!orderFormRef.value) return;
  await orderFormRef.value.validate(async (valid) => {
    if (!valid) return;
    await saveOrder(orderForm);
  });
}

/** 停用医嘱 */
function handleStopOrder(order: OrderItem) {
  ElMessageBox.confirm(
    `确定要停用医嘱【${order.OrderName}】吗？`,
    '确认停用',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    stopOrder(order.OrderId);
  });
}

/** 删除医嘱 */
function handleDeleteOrder(order: OrderItem) {
  ElMessageBox.confirm(
    `确定要删除医嘱【${order.OrderName}】吗？删除后不可恢复！`,
    '确认删除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'danger',
    }
  ).then(() => {
    deleteOrder(order.OrderId);
  });
}

/** 新增处方单 */
function handleAddPrescription() {
  if (!selectedPatientId.value) {
    ElMessage.warning('请先选择患者');
    return;
  }
  addPrescription();
}

/** 删除处方单 */
function handleDeletePrescription(prescription: Prescription) {
  ElMessageBox.confirm(
    `确定要删除处方单【${prescription.PrescriptionNo}】吗？删除后不可恢复！`,
    '确认删除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'danger',
    }
  ).then(() => {
    deletePrescription(prescription.Id);
  });
}

/** 切换医嘱类型 */
function handleAdviceChange(type: string) {
  adviceId.value = type;
  selectedPrescriptionId.value = '';
  orderList.value = [];
  getOrderList(type);
}

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

/** 获取行样式 */
function getRowClassName({ row }: { row: OrderItem }) {
  if (row.DataState === 2) {
    return 'disabled-row';
  }
  if (row.IsVisible === '0' && row.MedicalItemType !== 5) {
    return 'unexecuted-row';
  }
  if (row.PerformStatus === 2) {
    return 'red-row';
  }
  return '';
}

// ==================== 生命周期 ====================

onMounted(() => {
  getSignedPatientList();
  getCategoryList();
  getWayType();
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
            :key="patient.PatientId"
            class="patient-item"
            :class="{ 'patient-item--active': selectedPatientId === patient.PatientId }"
            @click="selectPatient(patient)"
          >
            <div class="patient-item__name">
              {{ patient.PatientName }}
              <ElTag
                v-if="patient.BloodInfectious"
                :type="patient.BloodInfectious === 'HIV' || patient.BloodInfectious === '乙肝' ? 'danger' : 'warning'"
                size="small"
                effect="dark"
                class="infectious-tag"
              >
                {{ patient.BloodInfectious }}
              </ElTag>
            </div>
            <div class="patient-item__info">
              <span>{{ patient.BedNo }}</span>
              <span>{{ patient.Gender }}/{{ patient.Age }}岁</span>
            </div>
            <div class="patient-item__mode">
              <ElTag size="small" :type="patient.TreatmentMode === 'HD' ? 'success' : 'warning'">
                {{ patient.TreatmentMode }}
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
              <ElButton type="warning" @click="handleAddPrescription">
                + 新增处方单
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

          <!-- 2. 处方单列表 -->
          <ElCard shadow="never" class="section-card" v-if="prescriptionList.length > 0">
            <template #header>
              <div class="section-title">处方单列表</div>
            </template>
            <div class="prescription-list">
              <div
                v-for="prescription in prescriptionList"
                :key="prescription.Id"
                class="prescription-item"
                :class="{ 'prescription-item--active': selectedPrescriptionId === prescription.Id }"
                @click="selectPrescription(prescription)"
              >
                <span class="prescription-no">{{ prescription.PrescriptionNo }}</span>
                <ElTag
                  :type="prescription.ChargeType === '自费' ? 'info' : prescription.ChargeType === '特病医保' ? 'warning' : 'success'"
                  size="small"
                >
                  {{ prescription.ChargeType }}
                </ElTag>
                <span
                  class="delete-prescription"
                  @click.stop="handleDeletePrescription(prescription)"
                >
                  <i class="el-icon-close">×</i>
                </span>
              </div>
            </div>
          </ElCard>

          <!-- 3. 过敏记录区 -->
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
                :key="allergy.AllergyId"
                class="allergy-item"
              >
                <span class="allergy-allergen">{{ allergy.Allergen }}</span>
                <ElTag :type="getSeverityTagType(allergy.Severity)" size="small" effect="dark">
                  {{ allergy.Severity }}
                </ElTag>
                <span class="allergy-reaction">{{ allergy.Reaction }}</span>
                <span class="allergy-date">{{ allergy.DiscoverDate }}</span>
              </div>
            </div>
          </ElCard>

          <!-- 4. 主要诊断区 -->
          <ElCard shadow="never" class="section-card">
            <template #header>
              <div class="section-title">主要诊断</div>
            </template>
            <div class="diagnosis-list">
              <div
                v-for="diagnosis in diagnosisList"
                :key="diagnosis.DiagnosisId"
                class="diagnosis-item"
              >
                <ElTag
                  :type="diagnosis.IsPrimary ? 'danger' : 'info'"
                  size="small"
                  effect="dark"
                  class="diagnosis-type-tag"
                >
                  {{ diagnosis.DiagnosisType }}
                </ElTag>
                <span class="diagnosis-name">{{ diagnosis.DiagnosisName }}</span>
                <span class="diagnosis-code">{{ diagnosis.DiagnosisCode }}</span>
                <span class="diagnosis-date">{{ diagnosis.DiagnosisDate }}</span>
              </div>
            </div>
          </ElCard>

          <!-- 5. 用药方案区（可折叠） -->
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
                  :row-class-name="getRowClassName"
                  v-loading="tableLoading"
                >
                  <ElTableColumn prop="Category" label="类别" width="100" align="center">
                    <template #default="{ row }">
                      <ElTag :type="getCategoryTagType(row.Category)" size="small">
                        {{ row.Category }}
                      </ElTag>
                    </template>
                  </ElTableColumn>
                  <ElTableColumn prop="Content" label="医嘱内容" min-width="280">
                    <template #default="{ row }">
                      <span class="order-content">{{ row.Content }}</span>
                    </template>
                  </ElTableColumn>
                  <ElTableColumn prop="Remark" label="备注" width="160">
                    <template #default="{ row }">
                      <span class="order-remark">{{ row.Remark }}</span>
                    </template>
                  </ElTableColumn>
                  <ElTableColumn prop="Doctor" label="医生" width="90" align="center" />
                  <ElTableColumn prop="OrderTime" label="下达时间" width="160" align="center">
                    <template #default="{ row }">
                      <span class="order-time">{{ row.OrderTime }}</span>
                    </template>
                  </ElTableColumn>
                  <ElTableColumn label="操作" width="120" align="center" fixed="right">
                    <template #default="{ row }">
                      <ElButton
                        v-if="row.PerformStatus !== 1"
                        type="warning"
                        link
                        size="small"
                        @click="handleStopOrder(row)"
                      >
                        停用
                      </ElButton>
                      <ElButton
                        v-if="row.PerformStatus !== 1"
                        type="danger"
                        link
                        size="small"
                        @click="handleDeleteOrder(row)"
                      >
                        删除
                      </ElButton>
                      <span v-else>已执行</span>
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
                  :row-class-name="getRowClassName"
                  v-loading="tableLoading"
                >
                  <ElTableColumn prop="Category" label="类别" width="100" align="center">
                    <template #default="{ row }">
                      <ElTag :type="getCategoryTagType(row.Category)" size="small">
                        {{ row.Category }}
                      </ElTag>
                    </template>
                  </ElTableColumn>
                  <ElTableColumn prop="Content" label="医嘱内容" min-width="280">
                    <template #default="{ row }">
                      <span class="order-content">{{ row.Content }}</span>
                    </template>
                  </ElTableColumn>
                  <ElTableColumn prop="Remark" label="备注" width="160">
                    <template #default="{ row }">
                      <span class="order-remark">{{ row.Remark }}</span>
                    </template>
                  </ElTableColumn>
                  <ElTableColumn prop="Doctor" label="医生" width="90" align="center" />
                  <ElTableColumn prop="OrderTime" label="下达时间" width="160" align="center">
                    <template #default="{ row }">
                      <span class="order-time">{{ row.OrderTime }}</span>
                    </template>
                  </ElTableColumn>
                  <ElTableColumn label="操作" width="120" align="center" fixed="right">
                    <template #default="{ row }">
                      <ElButton
                        v-if="row.PerformStatus !== 1"
                        type="warning"
                        link
                        size="small"
                        @click="handleStopOrder(row)"
                      >
                        停用
                      </ElButton>
                      <ElButton
                        v-if="row.PerformStatus !== 1"
                        type="danger"
                        link
                        size="small"
                        @click="handleDeleteOrder(row)"
                      >
                        删除
                      </ElButton>
                      <span v-else>已执行</span>
                    </template>
                  </ElTableColumn>
                </ElTable>
              </ElCollapseItem>
            </ElCollapse>
          </ElCard>

          <!-- 6. 停用医嘱区（可折叠） -->
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
                  <ElTableColumn prop="Category" label="类别" width="100" align="center">
                    <template #default="{ row }">
                      <ElTag type="info" size="small">{{ row.Category }}</ElTag>
                    </template>
                  </ElTableColumn>
                  <ElTableColumn prop="Content" label="医嘱内容" min-width="240">
                    <template #default="{ row }">
                      <span class="order-content stopped-content">{{ row.Content }}</span>
                    </template>
                  </ElTableColumn>
                  <ElTableColumn prop="StopReason" label="停用原因" min-width="200">
                    <template #default="{ row }">
                      <span class="stop-reason">{{ row.StopReason }}</span>
                    </template>
                  </ElTableColumn>
                  <ElTableColumn prop="StopBy" label="停用人" width="90" align="center" />
                  <ElTableColumn prop="StopTime" label="停用时间" width="160" align="center">
                    <template #default="{ row }">
                      <span class="order-time">{{ row.StopTime }}</span>
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
          OrderType: [{ required: true, message: '请选择医嘱类型', trigger: 'change' }],
          DrugName: [{ required: true, message: '请输入药品名称', trigger: 'blur' }],
          Dosage: [{ required: true, message: '请输入剂量', trigger: 'blur' }],
          Frequency: [{ required: true, message: '请选择频率', trigger: 'change' }],
          Usage: [{ required: true, message: '请选择用法', trigger: 'change' }],
        }"
        label-width="90px"
        size="default"
      >
        <ElFormItem label="医嘱类型" prop="OrderType">
          <ElSelect v-model="orderForm.OrderType" style="width: 100%">
            <ElOption
              v-for="item in ORDER_TYPE_OPTIONS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="药品名称" prop="DrugName">
          <ElInput
            v-model="orderForm.DrugName"
            placeholder="请输入药品名称"
          />
        </ElFormItem>
        <ElFormItem label="剂量" prop="Dosage">
          <div class="dosage-row">
            <ElInput v-model="orderForm.Dosage" placeholder="请输入剂量" style="flex: 1" />
            <ElSelect v-model="orderForm.Unit" style="width: 100px; margin-left: 8px">
              <ElOption
                v-for="item in UNIT_OPTIONS"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </ElSelect>
          </div>
        </ElFormItem>
        <ElFormItem label="频率" prop="Frequency">
          <ElSelect v-model="orderForm.Frequency" placeholder="请选择频率" style="width: 100%">
            <ElOption
              v-for="item in FREQUENCY_OPTIONS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="用法" prop="Usage">
          <ElSelect v-model="orderForm.Usage" placeholder="请选择用法" style="width: 100%">
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
            v-model="orderForm.Remark"
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

/* ==================== 处方单列表 ==================== */

.prescription-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.prescription-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f5f7fa;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.prescription-item:hover {
  background: #ecf5ff;
  border-color: #409eff;
}

.prescription-item--active {
  background: #409eff;
  border-color: #409eff;
  color: #fff;
}

.prescription-item--active .prescription-no {
  color: #fff;
}

.prescription-no {
  font-weight: 600;
  color: #303133;
}

.delete-prescription {
  margin-left: 4px;
  padding: 2px 6px;
  cursor: pointer;
  border-radius: 3px;
}

.delete-prescription:hover {
  background: rgba(255, 255, 255, 0.2);
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

/* 行状态样式 */
:deep(.disabled-row) {
  background-color: #f5f7fa;
  color: #c0c4cc;
}

:deep(.unexecuted-row) {
  background-color: #ffffcc;
}

:deep(.red-row) {
  color: #f56c6c;
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
