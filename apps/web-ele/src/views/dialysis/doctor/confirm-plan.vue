<script lang="ts" setup>
import { ref, reactive, computed, watch, nextTick } from 'vue';
import {
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElSelect,
  ElOption,
  ElButton,
  ElCheckbox,
  ElRadio,
  ElRadioGroup,
  ElRow,
  ElCol,
  ElDivider,
  ElMessage,
  ElDescriptions,
  ElDescriptionsItem,
  ElTag,
  ElTable,
  ElTableColumn,
  ElScrollbar,
} from 'element-plus';
import type { FormInstance } from 'element-plus';
import swsApi from '#/api/sws';

// ==================== 类型定义 ====================

/** 病种信息 */
interface PatientDiseaseType {
  DiseTypeCode: string;
  OpspDiseCode: string;
  OpspDiseName: string;
  ValidDate: string;
}

/** 抗凝剂组 */
interface AnticoagulantGroupItem {
  Anticoagulants: string;
  AddOnMode: string;
  AnticoagulationStopTime: string;
  AnticoagulantsFirstDose: number | null;
  AnticoagulantsUnitId: string;
  AnticoagulantsBolus: number | null;
  recordNum: number;
  totalNum: number;
}

/** 置换液配方 */
interface FluidFormulation {
  BaseFluid: string;
  NaCl: number | null;
  InjectionWater: number | null;
  GlucoseInjection: number | null;
  NaHCO3: number | null;
  KCl: number | null;
  CalciumGluconate: number | null;
  MgSO4: number | null;
  Other: string;
}

/** 确认方案主表单数据 */
interface ConfirmPlanForm {
  PatientId: string;
  PatientName: string;
  Sex: string;
  Age: number | null;
  CurrentDryWeight: number | null;
  Shift: string;
  DialysisType: string;
  Dialyzer: string;
  DialysisPerfusion: string;
  PatientType: string;
  TreatmentModeSpecial: string;
  PreSystolicPressure: number | null;
  PreDiastolicPressure: number | null;
  PrePulse: number | null;
  HeartRate: number | null;
  CurrBodyTemperature: number | null;
  WeightGainRate: number | null;
  TreatHour: number | null;
  TreatMin: number | null;
  BloodAccessType: string;
  BloodAccess: string;
  BloodFlow: number | null;
  BloodFlowMax: number | null;
  BloodSpeed: number | null;
  FlowDialy: number | null;
  FillWay: string;
  FluidFlow: number | null;
  FluidTotal: number | null;
  FluidAuto: string;
  Anticoagulants: string;
  AnticoagulantsFirstDose: number | null;
  AnticoagulantsBolus: number | null;
  AnticoagulantsUnitId: string;
  AnticoagulantsBolusHour: number | null;
  AddOnMode: string;
  AnticoagulationStopTime: string;
  IsSequentialDialysis: string;
  SequentialDialysisAloneTime: number | null;
  SequentialDialysisDose: number | null;
  IsNoEat: string;
  MedPlan: string;
  Curve_zh: string;
  Curve_na: string;
  Curve_cl: string;
  TxyTemperature: number | null;
  FlowPres_k: number | null;
  FlowPres_ga: number | null;
  FlowPres_na: number | null;
  FlowPres_hq: number | null;
  Glucose: number | null;
  BeforeDialysisWeight: number | null;
  PreviousAfterDialysisWeight: number | null;
  ClothingWeight: number | null;
  UltraFilRate: number | null;
  NoWeightBasis: string;
  LastNoWeightBasis: string;
  IsFocus: string;
  MsgTag: string;
  FocusMessage: string;
  EdemaType: string;
  GaspType: string;
  PrecordialDiscomfortType: string;
  HAS_BLED: string;
  OtherSpecialDiscomfort: string;
  OtherSpecialDiscomfortRemarks: string;
  OtherTestsAndTreatments: string;
  OtherTestsAndTreatmentsRemarks: string;
  SummaryLastTreatment: string;
  SignDoctorName: string;
  PatientDiseaseType: PatientDiseaseType[];
  AnticoagulantGroup: AnticoagulantGroupItem[];
  FluidFormulation: FluidFormulation;
}

/** 透析前评估表单 */
interface PreAssessmentForm {
  EdemaType: string;
  GaspType: string;
  PrecordialDiscomfortType: string;
  HAS_BLED: string;
  CurrBodyTemperature: number | null;
  PreSystolicPressure: number | null;
  PreDiastolicPressure: number | null;
  SummaryLastTreatment: string;
  OtherSpecialDiscomfort: string;
  OtherSpecialDiscomfortRemarks: string;
  OtherTestsAndTreatments: string;
  OtherTestsAndTreatmentsRemarks: string;
}

// ==================== Props & Emits ====================

const props = defineProps<{
  visible: boolean;
  patientId?: string;
  schedulingId?: string;
}>();

const emit = defineEmits<{
  (e: 'update:visible', val: boolean): void;
  (e: 'confirm', data: ConfirmPlanForm): void;
}>();

// ==================== 弹窗可见性 ====================

const dialogVisible = computed({
  get: () => props.visible,
  set: (val: boolean) => emit('update:visible', val),
});

// ==================== 表单引用 ====================

const mainFormRef = ref<FormInstance>();
const assessFormRef = ref<FormInstance>();

// ==================== 表单数据 ====================

/** 主表单 */
const formData = reactive<ConfirmPlanForm>({
  PatientId: '',
  PatientName: '',
  Sex: '',
  Age: null,
  CurrentDryWeight: null,
  Shift: '',
  DialysisType: '',
  Dialyzer: '',
  DialysisPerfusion: '',
  PatientType: '',
  TreatmentModeSpecial: '',
  PreSystolicPressure: null,
  PreDiastolicPressure: null,
  PrePulse: null,
  HeartRate: null,
  CurrBodyTemperature: null,
  WeightGainRate: null,
  TreatHour: null,
  TreatMin: null,
  BloodAccessType: '',
  BloodAccess: '',
  BloodFlow: null,
  BloodFlowMax: null,
  BloodSpeed: null,
  FlowDialy: null,
  FillWay: '',
  FluidFlow: null,
  FluidTotal: null,
  FluidAuto: '',
  Anticoagulants: '',
  AnticoagulantsFirstDose: null,
  AnticoagulantsBolus: null,
  AnticoagulantsUnitId: '',
  AnticoagulantsBolusHour: null,
  AddOnMode: '',
  AnticoagulationStopTime: '',
  IsSequentialDialysis: '',
  SequentialDialysisAloneTime: null,
  SequentialDialysisDose: null,
  IsNoEat: '',
  MedPlan: '',
  Curve_zh: '',
  Curve_na: '',
  Curve_cl: '',
  TxyTemperature: null,
  FlowPres_k: null,
  FlowPres_ga: null,
  FlowPres_na: null,
  FlowPres_hq: null,
  Glucose: null,
  BeforeDialysisWeight: null,
  PreviousAfterDialysisWeight: null,
  ClothingWeight: null,
  UltraFilRate: null,
  NoWeightBasis: '',
  LastNoWeightBasis: '',
  IsFocus: '',
  MsgTag: '',
  FocusMessage: '',
  EdemaType: '',
  GaspType: '',
  PrecordialDiscomfortType: '',
  HAS_BLED: '',
  OtherSpecialDiscomfort: '',
  OtherSpecialDiscomfortRemarks: '',
  OtherTestsAndTreatments: '',
  OtherTestsAndTreatmentsRemarks: '',
  SummaryLastTreatment: '',
  SignDoctorName: '',
  PatientDiseaseType: [],
  AnticoagulantGroup: [],
  FluidFormulation: {
    BaseFluid: '',
    NaCl: null,
    InjectionWater: null,
    GlucoseInjection: null,
    NaHCO3: null,
    KCl: null,
    CalciumGluconate: null,
    MgSO4: null,
    Other: '',
  },
});

/** 透析前评估表单 */
const assessForm = reactive<PreAssessmentForm>({
  EdemaType: '',
  GaspType: '',
  PrecordialDiscomfortType: '',
  HAS_BLED: '',
  CurrBodyTemperature: null,
  PreSystolicPressure: null,
  PreDiastolicPressure: null,
  SummaryLastTreatment: '',
  OtherSpecialDiscomfort: '',
  OtherSpecialDiscomfortRemarks: '',
  OtherTestsAndTreatments: '',
  OtherTestsAndTreatmentsRemarks: '',
});

// ==================== 下拉选项 ====================

/** 班次选项 */
const shiftOptions = ref<any[]>([]);
/** 透析方式选项 */
const dialysisTypeOptions = ref<any[]>([]);
/** CRRT治疗方式选项 */
const treatmentModeSpecialOptions = ref<any[]>([]);
/** 透析器选项 */
const dialyzerOptions = ref<any[]>([]);
/** 灌流器选项 */
const dialysisPerfusionOptions = ref<any[]>([]);
/** 患者类别选项 */
const patientTypeOptions = ref<any[]>([]);
/** 血管通路类别选项 */
const bloodAccessTypeOptions = ref<any[]>([]);
/** 血管通路选项 */
const bloodAccessOptions = ref<any[]>([]);
/** 抗凝剂选项 */
const anticoagulantsOptions = ref<any[]>([]);
/** 抗凝剂单位选项 */
const anticoagulantUnitOptions = ref<any[]>([]);
/** 追加方式选项 */
const addOnModeOptions = ref<any[]>([]);
/** 置换液方式选项 */
const fillWayOptions = ref<any[]>([]);
/** 曲线选项 */
const curveOptions = ref<any[]>([]);
/** 水潴留类型选项 */
const edemaTypeOptions = ref<any[]>([]);
/** 气促类型选项 */
const gaspTypeOptions = ref<any[]>([]);
/** 心前区不适类型选项 */
const precordialDiscomfortOptions = ref<any[]>([]);
/** HAS_BLED评分选项 */
const hasBledOptions = ref<any[]>([]);
/** 基础液选项 */
const baseFluidOptions = ref<any[]>([]);
/** 未测体重原因选项 */
const noWeightBasisOptions = ref<any[]>([]);

// ==================== 弹窗状态 ====================

const loading = ref(false);
const confirmLoading = ref(false);
const assessDialogVisible = ref(false);
const historyDialogVisible = ref(false);
const historyData = ref<any[]>([]);

// ==================== 计算属性 ====================

/** 治疗时间显示 */
const treatTimeDisplay = computed(() => {
  const h = formData.TreatHour ?? 0;
  const m = formData.TreatMin ?? 0;
  return `${h}小时${m > 0 ? m + '分钟' : ''}`;
});

/** 体重增长率显示 */
const weightGainRateDisplay = computed(() => {
  if (formData.WeightGainRate == null) return '--';
  return `${formData.WeightGainRate}%`;
});

/** 是否显示CRRT区域 */
const showCRRT = computed(() => {
  return formData.DialysisType === 'CRRT' || formData.TreatmentModeSpecial;
});

/** 是否显示序贯透析 */
const showSequential = computed(() => {
  return formData.IsSequentialDialysis === '1';
});

/** 是否显示抗凝剂组 */
const showAnticoagulantGroup = computed(() => {
  return formData.AnticoagulantGroup && formData.AnticoagulantGroup.length > 0;
});

/** 重点关注标签类型 */
const focusTagType = computed(() => {
  if (formData.IsFocus === '1') return 'danger';
  if (formData.MsgTag) return 'warning';
  return 'info';
});

// ==================== 方法 ====================

/** 加载字典数据 */
async function loadDictionaries() {
  try {
    // 加载班次
    const shiftRes = await swsApi.swsGet('DictionaryLinkSet/4002', { type: 'Shift' });
    if (shiftRes.Code === 200 && shiftRes.Data) {
      shiftOptions.value = Array.isArray(shiftRes.Data) ? shiftRes.Data : [];
    }

    // 加载透析方式
    const dialysisTypeRes = await swsApi.swsGet('DictionaryLinkSet/4002', { type: 'DialysisType' });
    if (dialysisTypeRes.Code === 200 && dialysisTypeRes.Data) {
      dialysisTypeOptions.value = Array.isArray(dialysisTypeRes.Data) ? dialysisTypeRes.Data : [];
    }

    // 加载CRRT治疗方式
    const crrtRes = await swsApi.swsGet('DictionaryLinkSet/4002', { type: 'TreatmentModeSpecial' });
    if (crrtRes.Code === 200 && crrtRes.Data) {
      treatmentModeSpecialOptions.value = Array.isArray(crrtRes.Data) ? crrtRes.Data : [];
    }

    // 加载患者类别
    const patientTypeRes = await swsApi.swsGet('DictionaryLinkSet/4002', { type: 'PatientType' });
    if (patientTypeRes.Code === 200 && patientTypeRes.Data) {
      patientTypeOptions.value = Array.isArray(patientTypeRes.Data) ? patientTypeRes.Data : [];
    }

    // 加载血管通路类别
    const bloodAccessTypeRes = await swsApi.swsGet('DictionaryLinkSet/4002', { type: 'BloodAccessType' });
    if (bloodAccessTypeRes.Code === 200 && bloodAccessTypeRes.Data) {
      bloodAccessTypeOptions.value = Array.isArray(bloodAccessTypeRes.Data) ? bloodAccessTypeRes.Data : [];
    }

    // 加载抗凝剂
    const anticoagulantsRes = await swsApi.swsGet('DictionaryLinkSet/4002', { type: 'Anticoagulants' });
    if (anticoagulantsRes.Code === 200 && anticoagulantsRes.Data) {
      anticoagulantsOptions.value = Array.isArray(anticoagulantsRes.Data) ? anticoagulantsRes.Data : [];
    }

    // 加载追加方式
    const addOnModeRes = await swsApi.swsGet('DictionaryLinkSet/4002', { type: 'AddOnMode' });
    if (addOnModeRes.Code === 200 && addOnModeRes.Data) {
      addOnModeOptions.value = Array.isArray(addOnModeRes.Data) ? addOnModeRes.Data : [];
    }

    // 加载置换液方式
    const fillWayRes = await swsApi.swsGet('DictionaryLinkSet/4002', { type: 'FillWay' });
    if (fillWayRes.Code === 200 && fillWayRes.Data) {
      fillWayOptions.value = Array.isArray(fillWayRes.Data) ? fillWayRes.Data : [];
    }

    // 加载曲线
    const curveRes = await swsApi.swsGet('DictionaryLinkSet/4002', { type: 'Curve' });
    if (curveRes.Code === 200 && curveRes.Data) {
      curveOptions.value = Array.isArray(curveRes.Data) ? curveRes.Data : [];
    }

    // 加载水潴留类型
    const edemaRes = await swsApi.swsGet('DictionaryLinkSet/4002', { type: 'EdemaType' });
    if (edemaRes.Code === 200 && edemaRes.Data) {
      edemaTypeOptions.value = Array.isArray(edemaRes.Data) ? edemaRes.Data : [];
    }

    // 加载气促类型
    const gaspRes = await swsApi.swsGet('DictionaryLinkSet/4002', { type: 'GaspType' });
    if (gaspRes.Code === 200 && gaspRes.Data) {
      gaspTypeOptions.value = Array.isArray(gaspRes.Data) ? gaspRes.Data : [];
    }

    // 加载心前区不适类型
    const precordialRes = await swsApi.swsGet('DictionaryLinkSet/4002', { type: 'PrecordialDiscomfortType' });
    if (precordialRes.Code === 200 && precordialRes.Data) {
      precordialDiscomfortOptions.value = Array.isArray(precordialRes.Data) ? precordialRes.Data : [];
    }

    // 加载HAS_BLED评分
    const hasBledRes = await swsApi.swsGet('DictionaryLinkSet/4002', { type: 'HAS_BLED' });
    if (hasBledRes.Code === 200 && hasBledRes.Data) {
      hasBledOptions.value = Array.isArray(hasBledRes.Data) ? hasBledRes.Data : [];
    }

    // 加载基础液
    const baseFluidRes = await swsApi.swsGet('DictionaryLinkSet/4002', { type: 'BaseFluid' });
    if (baseFluidRes.Code === 200 && baseFluidRes.Data) {
      baseFluidOptions.value = Array.isArray(baseFluidRes.Data) ? baseFluidRes.Data : [];
    }

    // 加载未测体重原因
    const noWeightRes = await swsApi.swsGet('DictionaryLinkSet/4002', { type: 'NoWeightBasis' });
    if (noWeightRes.Code === 200 && noWeightRes.Data) {
      noWeightBasisOptions.value = Array.isArray(noWeightRes.Data) ? noWeightRes.Data : [];
    }
  } catch (error) {
    console.error('加载字典数据失败:', error);
  }
}

/** 加载抗凝剂单位 */
async function loadAnticoagulantUnits() {
  try {
    const res = await swsApi.swsGet('UseWays/4004');
    if (res.Code === 200 && res.Data) {
      anticoagulantUnitOptions.value = Array.isArray(res.Data) ? res.Data : [];
    }
  } catch (error) {
    console.error('加载抗凝剂单位失败:', error);
  }
}

/** 加载透析器列表 */
async function loadDialyzerOptions() {
  try {
    const res = await swsApi.swsGet('Inspection/4017', {});
    if (res.Code === 200 && res.Data) {
      dialyzerOptions.value = Array.isArray(res.Data) ? res.Data : [];
    }
  } catch (error) {
    console.error('加载透析器列表失败:', error);
  }
}

/** 加载灌流器列表 */
async function loadDialysisPerfusionOptions() {
  try {
    const res = await swsApi.swsGet('Inspection/4014');
    if (res.Code === 200 && res.Data) {
      dialysisPerfusionOptions.value = Array.isArray(res.Data) ? res.Data : [];
    }
  } catch (error) {
    console.error('加载灌流器列表失败:', error);
  }
}

/** 根据血管通路类别加载血管通路选项 */
async function loadBloodAccessOptions(accessType: string) {
  if (!accessType) {
    bloodAccessOptions.value = [];
    return;
  }
  try {
    const res = await swsApi.swsGet('WsHis/4019', { accessType });
    if (res.Code === 200 && res.Data) {
      bloodAccessOptions.value = Array.isArray(res.Data) ? res.Data : [];
    }
  } catch (error) {
    console.error('加载血管通路列表失败:', error);
  }
}

/** 加载方案数据 */
async function loadPlanData() {
  if (!props.patientId) return;
  loading.value = true;
  try {
    const res = await swsApi.swsGet('SchedulingManage/4023', {
      PatientId: props.patientId,
      SchedulingId: props.schedulingId,
    });
    if (res.Code === 200 && res.Data) {
      const data = res.Data;
      // 填充主表单
      Object.keys(formData).forEach((key) => {
        if (data[key] !== undefined && data[key] !== null) {
          (formData as any)[key] = data[key];
        }
      });
      // 确保 FluidFormulation 存在
      if (data.FluidFormulation) {
        Object.assign(formData.FluidFormulation, data.FluidFormulation);
      }
      // 确保 PatientDiseaseType 存在
      if (data.PatientDiseaseType) {
        formData.PatientDiseaseType = Array.isArray(data.PatientDiseaseType)
          ? data.PatientDiseaseType
          : [];
      }
      // 确保 AnticoagulantGroup 存在
      if (data.AnticoagulantGroup) {
        formData.AnticoagulantGroup = Array.isArray(data.AnticoagulantGroup)
          ? data.AnticoagulantGroup
          : [];
      }
      // 同步评估表单
      syncAssessForm();
      // 加载血管通路
      if (formData.BloodAccessType) {
        await loadBloodAccessOptions(formData.BloodAccessType);
      }
    }
  } catch (error) {
    console.error('加载方案数据失败:', error);
    ElMessage.error('加载方案数据失败');
  } finally {
    loading.value = false;
  }
}

/** 同步评估表单数据 */
function syncAssessForm() {
  assessForm.EdemaType = formData.EdemaType;
  assessForm.GaspType = formData.GaspType;
  assessForm.PrecordialDiscomfortType = formData.PrecordialDiscomfortType;
  assessForm.HAS_BLED = formData.HAS_BLED;
  assessForm.CurrBodyTemperature = formData.CurrBodyTemperature;
  assessForm.PreSystolicPressure = formData.PreSystolicPressure;
  assessForm.PreDiastolicPressure = formData.PreDiastolicPressure;
  assessForm.SummaryLastTreatment = formData.SummaryLastTreatment;
  assessForm.OtherSpecialDiscomfort = formData.OtherSpecialDiscomfort;
  assessForm.OtherSpecialDiscomfortRemarks = formData.OtherSpecialDiscomfortRemarks;
  assessForm.OtherTestsAndTreatments = formData.OtherTestsAndTreatments;
  assessForm.OtherTestsAndTreatmentsRemarks = formData.OtherTestsAndTreatmentsRemarks;
}

/** 从评估表单同步回主表单 */
function syncFromAssessForm() {
  formData.EdemaType = assessForm.EdemaType;
  formData.GaspType = assessForm.GaspType;
  formData.PrecordialDiscomfortType = assessForm.PrecordialDiscomfortType;
  formData.HAS_BLED = assessForm.HAS_BLED;
  formData.CurrBodyTemperature = assessForm.CurrBodyTemperature;
  formData.PreSystolicPressure = assessForm.PreSystolicPressure;
  formData.PreDiastolicPressure = assessForm.PreDiastolicPressure;
  formData.SummaryLastTreatment = assessForm.SummaryLastTreatment;
  formData.OtherSpecialDiscomfort = assessForm.OtherSpecialDiscomfort;
  formData.OtherSpecialDiscomfortRemarks = assessForm.OtherSpecialDiscomfortRemarks;
  formData.OtherTestsAndTreatments = assessForm.OtherTestsAndTreatments;
  formData.OtherTestsAndTreatmentsRemarks = assessForm.OtherTestsAndTreatmentsRemarks;
}

/** 打开透析前评估弹窗 */
function openAssessDialog() {
  syncAssessForm();
  assessDialogVisible.value = true;
}

/** 保存透析前评估 */
async function saveAssessment() {
  if (assessFormRef.value) {
    try {
      await assessFormRef.value.validate();
    } catch {
      return;
    }
  }
  syncFromAssessForm();
  assessDialogVisible.value = false;
  ElMessage.success('透析前评估已保存');
}

/** 查看历史记录 */
async function viewHistory() {
  if (!props.patientId) return;
  try {
    const res = await swsApi.swsGet('SchedulingManage/4023', {
      PatientId: props.patientId,
      History: '1',
    });
    if (res.Code === 200 && res.Data) {
      historyData.value = Array.isArray(res.Data) ? res.Data : [];
      historyDialogVisible.value = true;
    }
  } catch (error) {
    console.error('加载历史记录失败:', error);
    ElMessage.error('加载历史记录失败');
  }
}

/** 确认方案 */
async function handleConfirm() {
  if (mainFormRef.value) {
    try {
      await mainFormRef.value.validate();
    } catch {
      ElMessage.warning('请完善必填信息');
      return;
    }
  }
  confirmLoading.value = true;
  try {
    const params: Record<string, any> = { ...formData };
    // 序列化嵌套对象
    if (formData.FluidFormulation) {
      params.FluidFormulation = JSON.stringify(formData.FluidFormulation);
    }
    if (formData.PatientDiseaseType) {
      params.PatientDiseaseType = JSON.stringify(formData.PatientDiseaseType);
    }
    if (formData.AnticoagulantGroup) {
      params.AnticoagulantGroup = JSON.stringify(formData.AnticoagulantGroup);
    }
    const res = await swsApi.swsPost('DialysisScheme/1001', params);
    if (res.Code === 200) {
      ElMessage.success('方案确认成功');
      emit('confirm', { ...formData });
      dialogVisible.value = false;
    } else {
      ElMessage.error(res.Msg || '方案确认失败');
    }
  } catch (error) {
    console.error('方案确认失败:', error);
    ElMessage.error('方案确认失败');
  } finally {
    confirmLoading.value = false;
  }
}

/** 取消 */
function handleCancel() {
  dialogVisible.value = false;
}

/** 血管通路类别变更 */
function onBloodAccessTypeChange(val: string) {
  formData.BloodAccess = '';
  loadBloodAccessOptions(val);
}

/** 获取下拉选项显示文本 */
function getOptionLabel(options: any[], value: string): string {
  if (!value) return '--';
  const item = options.find((o) => o.Value === value || o.value === value || o.Id === value);
  if (item) {
    return item.Text || item.label || item.Name || '';
  }
  return value;
}

/** 获取抗凝剂单位文本 */
function getUnitLabel(unitId: string): string {
  if (!unitId) return '';
  const item = anticoagulantUnitOptions.value.find(
    (o) => o.Id === unitId || o.Value === unitId || o.value === unitId,
  );
  return item ? item.Text || item.label || item.Name || '' : unitId;
}

// ==================== 监听弹窗打开 ====================

watch(
  () => props.visible,
  async (val) => {
    if (val) {
      // 弹窗打开时加载数据
      await Promise.all([
        loadDictionaries(),
        loadAnticoagulantUnits(),
        loadDialyzerOptions(),
        loadDialysisPerfusionOptions(),
      ]);
      await loadPlanData();
    }
  },
);
</script>

<template>
  <ElDialog
    v-model="dialogVisible"
    title="透析确认方案"
    width="1300px"
    :close-on-click-modal="false"
    destroy-on-close
    top="2vh"
  >
    <ElScrollbar max-height="82vh">
      <div v-loading="loading" class="confirm-plan-container">
        <!-- ========== 头部患者信息 ========== -->
        <div class="plan-header">
          <ElDescriptions :column="4" border size="small">
            <ElDescriptionsItem label="患者姓名">
              <span class="patient-name">{{ formData.PatientName }}</span>
            </ElDescriptionsItem>
            <ElDescriptionsItem label="性别">
              {{ formData.Sex || '--' }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="年龄">
              {{ formData.Age != null ? formData.Age + '岁' : '--' }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="干体重">
              {{ formData.CurrentDryWeight != null ? formData.CurrentDryWeight + 'kg' : '--' }}
            </ElDescriptionsItem>
          </ElDescriptions>
        </div>

        <!-- ========== 本次治疗班次信息 ========== -->
        <ElDivider content-position="left">本次治疗班次信息</ElDivider>
        <ElForm :model="formData" label-width="120px" size="small" class="plan-form">
          <ElRow :gutter="16">
            <ElCol :span="8">
              <ElFormItem label="班次">
                <ElSelect v-model="formData.Shift" placeholder="请选择班次" style="width: 100%">
                  <ElOption
                    v-for="item in shiftOptions"
                    :key="item.Value || item.value || item.Id"
                    :label="item.Text || item.label || item.Name"
                    :value="item.Value || item.value || item.Id"
                  />
                </ElSelect>
              </ElFormItem>
            </ElCol>
            <ElCol :span="8">
              <ElFormItem label="治疗模式">
                <ElSelect v-model="formData.DialysisType" placeholder="请选择治疗模式" style="width: 100%">
                  <ElOption
                    v-for="item in dialysisTypeOptions"
                    :key="item.Value || item.value || item.Id"
                    :label="item.Text || item.label || item.Name"
                    :value="item.Value || item.value || item.Id"
                  />
                </ElSelect>
              </ElFormItem>
            </ElCol>
            <ElCol :span="8">
              <ElFormItem label="CRRT治疗方式">
                <ElSelect
                  v-model="formData.TreatmentModeSpecial"
                  placeholder="请选择CRRT治疗方式"
                  style="width: 100%"
                  clearable
                >
                  <ElOption
                    v-for="item in treatmentModeSpecialOptions"
                    :key="item.Value || item.value || item.Id"
                    :label="item.Text || item.label || item.Name"
                    :value="item.Value || item.value || item.Id"
                  />
                </ElSelect>
              </ElFormItem>
            </ElCol>
          </ElRow>
          <ElRow :gutter="16">
            <ElCol :span="8">
              <ElFormItem label="透析器">
                <ElSelect v-model="formData.Dialyzer" placeholder="请选择透析器" style="width: 100%" filterable clearable>
                  <ElOption
                    v-for="item in dialyzerOptions"
                    :key="item.Value || item.value || item.Id"
                    :label="item.Text || item.label || item.Name"
                    :value="item.Value || item.value || item.Id"
                  />
                </ElSelect>
              </ElFormItem>
            </ElCol>
            <ElCol :span="8">
              <ElFormItem label="灌流器">
                <ElSelect
                  v-model="formData.DialysisPerfusion"
                  placeholder="请选择灌流器"
                  style="width: 100%"
                  filterable
                  clearable
                >
                  <ElOption
                    v-for="item in dialysisPerfusionOptions"
                    :key="item.Value || item.value || item.Id"
                    :label="item.Text || item.label || item.Name"
                    :value="item.Value || item.value || item.Id"
                  />
                </ElSelect>
              </ElFormItem>
            </ElCol>
            <ElCol :span="8">
              <ElFormItem label="患者类别">
                <ElSelect v-model="formData.PatientType" placeholder="请选择患者类别" style="width: 100%">
                  <ElOption
                    v-for="item in patientTypeOptions"
                    :key="item.Value || item.value || item.Id"
                    :label="item.Text || item.label || item.Name"
                    :value="item.Value || item.value || item.Id"
                  />
                </ElSelect>
              </ElFormItem>
            </ElCol>
          </ElRow>
        </ElForm>

        <!-- ========== CRRT置换液配方 ========== -->
        <template v-if="showCRRT">
          <ElDivider content-position="left">CRRT置换液配方</ElDivider>
          <ElForm :model="formData.FluidFormulation" label-width="120px" size="small" class="plan-form">
            <ElRow :gutter="16">
              <ElCol :span="8">
                <ElFormItem label="基础液">
                  <ElSelect
                    v-model="formData.FluidFormulation.BaseFluid"
                    placeholder="请选择基础液"
                    style="width: 100%"
                  >
                    <ElOption
                      v-for="item in baseFluidOptions"
                      :key="item.Value || item.value || item.Id"
                      :label="item.Text || item.label || item.Name"
                      :value="item.Value || item.value || item.Id"
                    />
                  </ElSelect>
                </ElFormItem>
              </ElCol>
              <ElCol :span="8">
                <ElFormItem label="NaCl(ml)">
                  <ElInputNumber
                    v-model="formData.FluidFormulation.NaCl"
                    :min="0"
                    :precision="1"
                    controls-position="right"
                    style="width: 100%"
                  />
                </ElFormItem>
              </ElCol>
              <ElCol :span="8">
                <ElFormItem label="注射用水(ml)">
                  <ElInputNumber
                    v-model="formData.FluidFormulation.InjectionWater"
                    :min="0"
                    :precision="1"
                    controls-position="right"
                    style="width: 100%"
                  />
                </ElFormItem>
              </ElCol>
            </ElRow>
            <ElRow :gutter="16">
              <ElCol :span="8">
                <ElFormItem label="葡萄糖注射液(ml)">
                  <ElInputNumber
                    v-model="formData.FluidFormulation.GlucoseInjection"
                    :min="0"
                    :precision="1"
                    controls-position="right"
                    style="width: 100%"
                  />
                </ElFormItem>
              </ElCol>
              <ElCol :span="8">
                <ElFormItem label="NaHCO3(ml)">
                  <ElInputNumber
                    v-model="formData.FluidFormulation.NaHCO3"
                    :min="0"
                    :precision="1"
                    controls-position="right"
                    style="width: 100%"
                  />
                </ElFormItem>
              </ElCol>
              <ElCol :span="8">
                <ElFormItem label="KCl(ml)">
                  <ElInputNumber
                    v-model="formData.FluidFormulation.KCl"
                    :min="0"
                    :precision="1"
                    controls-position="right"
                    style="width: 100%"
                  />
                </ElFormItem>
              </ElCol>
            </ElRow>
            <ElRow :gutter="16">
              <ElCol :span="8">
                <ElFormItem label="葡萄糖酸钙(ml)">
                  <ElInputNumber
                    v-model="formData.FluidFormulation.CalciumGluconate"
                    :min="0"
                    :precision="1"
                    controls-position="right"
                    style="width: 100%"
                  />
                </ElFormItem>
              </ElCol>
              <ElCol :span="8">
                <ElFormItem label="MgSO4(ml)">
                  <ElInputNumber
                    v-model="formData.FluidFormulation.MgSO4"
                    :min="0"
                    :precision="1"
                    controls-position="right"
                    style="width: 100%"
                  />
                </ElFormItem>
              </ElCol>
              <ElCol :span="8">
                <ElFormItem label="其他">
                  <ElInput
                    v-model="formData.FluidFormulation.Other"
                    placeholder="请输入其他配方"
                  />
                </ElFormItem>
              </ElCol>
            </ElRow>
          </ElForm>
        </template>

        <!-- ========== 透前血压 & 体征 ========== -->
        <ElDivider content-position="left">透前血压 & 体征</ElDivider>
        <ElForm :model="formData" label-width="120px" size="small" class="plan-form">
          <ElRow :gutter="16">
            <ElCol :span="6">
              <ElFormItem label="收缩压(mmHg)">
                <ElInputNumber
                  v-model="formData.PreSystolicPressure"
                  :min="0"
                  :max="300"
                  controls-position="right"
                  style="width: 100%"
                />
              </ElFormItem>
            </ElCol>
            <ElCol :span="6">
              <ElFormItem label="舒张压(mmHg)">
                <ElInputNumber
                  v-model="formData.PreDiastolicPressure"
                  :min="0"
                  :max="200"
                  controls-position="right"
                  style="width: 100%"
                />
              </ElFormItem>
            </ElCol>
            <ElCol :span="6">
              <ElFormItem label="脉搏(次/分)">
                <ElInputNumber
                  v-model="formData.PrePulse"
                  :min="0"
                  :max="200"
                  controls-position="right"
                  style="width: 100%"
                />
              </ElFormItem>
            </ElCol>
            <ElCol :span="6">
              <ElFormItem label="心率(次/分)">
                <ElInputNumber
                  v-model="formData.HeartRate"
                  :min="0"
                  :max="200"
                  controls-position="right"
                  style="width: 100%"
                />
              </ElFormItem>
            </ElCol>
          </ElRow>
          <ElRow :gutter="16">
            <ElCol :span="6">
              <ElFormItem label="体温(℃)">
                <ElInputNumber
                  v-model="formData.CurrBodyTemperature"
                  :min="30"
                  :max="45"
                  :precision="1"
                  controls-position="right"
                  style="width: 100%"
                />
              </ElFormItem>
            </ElCol>
            <ElCol :span="6">
              <ElFormItem label="体重增长率">
                <span class="display-value">{{ weightGainRateDisplay }}</span>
              </ElFormItem>
            </ElCol>
          </ElRow>
        </ElForm>

        <!-- ========== 透析处方设置 ========== -->
        <ElDivider content-position="left">透析处方设置</ElDivider>
        <ElForm :model="formData" label-width="130px" size="small" class="plan-form">
          <ElRow :gutter="16">
            <ElCol :span="8">
              <ElFormItem label="治疗时间">
                <div style="display: flex; align-items: center; gap: 4px; width: 100%">
                  <ElInputNumber
                    v-model="formData.TreatHour"
                    :min="0"
                    :max="12"
                    controls-position="right"
                    style="width: 100px"
                  />
                  <span>时</span>
                  <ElInputNumber
                    v-model="formData.TreatMin"
                    :min="0"
                    :max="59"
                    controls-position="right"
                    style="width: 100px"
                  />
                  <span>分</span>
                </div>
              </ElFormItem>
            </ElCol>
            <ElCol :span="8">
              <ElFormItem label="血管通路类别">
                <ElSelect
                  v-model="formData.BloodAccessType"
                  placeholder="请选择血管通路类别"
                  style="width: 100%"
                  @change="onBloodAccessTypeChange"
                >
                  <ElOption
                    v-for="item in bloodAccessTypeOptions"
                    :key="item.Value || item.value || item.Id"
                    :label="item.Text || item.label || item.Name"
                    :value="item.Value || item.value || item.Id"
                  />
                </ElSelect>
              </ElFormItem>
            </ElCol>
            <ElCol :span="8">
              <ElFormItem label="血管通路">
                <ElSelect
                  v-model="formData.BloodAccess"
                  placeholder="请选择血管通路"
                  style="width: 100%"
                  filterable
                  clearable
                >
                  <ElOption
                    v-for="item in bloodAccessOptions"
                    :key="item.Value || item.value || item.Id"
                    :label="item.Text || item.label || item.Name"
                    :value="item.Value || item.value || item.Id"
                  />
                </ElSelect>
              </ElFormItem>
            </ElCol>
          </ElRow>
          <ElRow :gutter="16">
            <ElCol :span="6">
              <ElFormItem label="血流量(ml/min)">
                <ElInputNumber
                  v-model="formData.BloodFlow"
                  :min="0"
                  :max="500"
                  controls-position="right"
                  style="width: 100%"
                />
              </ElFormItem>
            </ElCol>
            <ElCol :span="6">
              <ElFormItem label="血流量上限">
                <ElInputNumber
                  v-model="formData.BloodFlowMax"
                  :min="0"
                  :max="500"
                  controls-position="right"
                  style="width: 100%"
                />
              </ElFormItem>
            </ElCol>
            <ElCol :span="6">
              <ElFormItem label="回血泵速(ml/min)">
                <ElInputNumber
                  v-model="formData.BloodSpeed"
                  :min="0"
                  :max="500"
                  controls-position="right"
                  style="width: 100%"
                />
              </ElFormItem>
            </ElCol>
            <ElCol :span="6">
              <ElFormItem label="透析液流量(ml/min)">
                <ElInputNumber
                  v-model="formData.FlowDialy"
                  :min="0"
                  :max="1000"
                  controls-position="right"
                  style="width: 100%"
                />
              </ElFormItem>
            </ElCol>
          </ElRow>
          <ElRow :gutter="16">
            <ElCol :span="8">
              <ElFormItem label="置换液方式">
                <ElSelect v-model="formData.FillWay" placeholder="请选择置换液方式" style="width: 100%" clearable>
                  <ElOption
                    v-for="item in fillWayOptions"
                    :key="item.Value || item.value || item.Id"
                    :label="item.Text || item.label || item.Name"
                    :value="item.Value || item.value || item.Id"
                  />
                </ElSelect>
              </ElFormItem>
            </ElCol>
            <ElCol :span="8">
              <ElFormItem label="置换液流量(ml/h)">
                <ElInputNumber
                  v-model="formData.FluidFlow"
                  :min="0"
                  :max="10000"
                  controls-position="right"
                  style="width: 100%"
                />
              </ElFormItem>
            </ElCol>
            <ElCol :span="8">
              <ElFormItem label="置换液总量(ml)">
                <ElInputNumber
                  v-model="formData.FluidTotal"
                  :min="0"
                  :max="50000"
                  controls-position="right"
                  style="width: 100%"
                />
              </ElFormItem>
            </ElCol>
          </ElRow>

          <!-- 抗凝剂设置 -->
          <ElRow :gutter="16">
            <ElCol :span="8">
              <ElFormItem label="抗凝剂">
                <ElSelect v-model="formData.Anticoagulants" placeholder="请选择抗凝剂" style="width: 100%" clearable>
                  <ElOption
                    v-for="item in anticoagulantsOptions"
                    :key="item.Value || item.value || item.Id"
                    :label="item.Text || item.label || item.Name"
                    :value="item.Value || item.value || item.Id"
                  />
                </ElSelect>
              </ElFormItem>
            </ElCol>
            <ElCol :span="8">
              <ElFormItem label="首剂">
                <ElInputNumber
                  v-model="formData.AnticoagulantsFirstDose"
                  :min="0"
                  :precision="1"
                  controls-position="right"
                  style="width: 100%"
                />
              </ElFormItem>
            </ElCol>
            <ElCol :span="8">
              <ElFormItem label="单位">
                <ElSelect v-model="formData.AnticoagulantsUnitId" placeholder="请选择单位" style="width: 100%">
                  <ElOption
                    v-for="item in anticoagulantUnitOptions"
                    :key="item.Id || item.Value || item.value"
                    :label="item.Text || item.label || item.Name"
                    :value="item.Id || item.Value || item.value"
                  />
                </ElSelect>
              </ElFormItem>
            </ElCol>
          </ElRow>
          <ElRow :gutter="16">
            <ElCol :span="8">
              <ElFormItem label="维持量">
                <ElInputNumber
                  v-model="formData.AnticoagulantsBolus"
                  :min="0"
                  :precision="1"
                  controls-position="right"
                  style="width: 100%"
                />
              </ElFormItem>
            </ElCol>
            <ElCol :span="8">
              <ElFormItem label="追加方式">
                <ElSelect v-model="formData.AddOnMode" placeholder="请选择追加方式" style="width: 100%" clearable>
                  <ElOption
                    v-for="item in addOnModeOptions"
                    :key="item.Value || item.value || item.Id"
                    :label="item.Text || item.label || item.Name"
                    :value="item.Value || item.value || item.Id"
                  />
                </ElSelect>
              </ElFormItem>
            </ElCol>
            <ElCol :span="8">
              <ElFormItem label="抗凝剂停止时间">
                <ElInput v-model="formData.AnticoagulationStopTime" placeholder="停止时间" />
              </ElFormItem>
            </ElCol>
          </ElRow>

          <!-- 抗凝剂组（多组抗凝剂） -->
          <template v-if="showAnticoagulantGroup">
            <ElDivider content-position="left" style="margin-top: 8px; margin-bottom: 12px">
              抗凝剂分组
            </ElDivider>
            <div
              v-for="(group, gIdx) in formData.AnticoagulantGroup"
              :key="gIdx"
              class="anticoagulant-group-item"
            >
              <ElRow :gutter="16">
                <ElCol :span="4">
                  <ElFormItem label="组别">
                    <span>{{ group.recordNum }} / {{ group.totalNum }}</span>
                  </ElFormItem>
                </ElCol>
                <ElCol :span="5">
                  <ElFormItem label="抗凝剂">
                    <span>{{ getOptionLabel(anticoagulantsOptions, group.Anticoagulants) }}</span>
                  </ElFormItem>
                </ElCol>
                <ElCol :span="5">
                  <ElFormItem label="首剂">
                    <span>{{ group.AnticoagulantsFirstDose ?? '--' }}</span>
                  </ElFormItem>
                </ElCol>
                <ElCol :span="5">
                  <ElFormItem label="维持量">
                    <span>{{ group.AnticoagulantsBolus ?? '--' }}</span>
                  </ElFormItem>
                </ElCol>
                <ElCol :span="5">
                  <ElFormItem label="追加方式">
                    <span>{{ getOptionLabel(addOnModeOptions, group.AddOnMode) }}</span>
                  </ElFormItem>
                </ElCol>
              </ElRow>
            </div>
          </template>

          <!-- 序贯透析 & 其他 -->
          <ElRow :gutter="16">
            <ElCol :span="8">
              <ElFormItem label="是否序贯透析">
                <ElRadioGroup v-model="formData.IsSequentialDialysis">
                  <ElRadio value="1">是</ElRadio>
                  <ElRadio value="0">否</ElRadio>
                </ElRadioGroup>
              </ElFormItem>
            </ElCol>
            <ElCol :span="8" v-if="showSequential">
              <ElFormItem label="单超时间(min)">
                <ElInputNumber
                  v-model="formData.SequentialDialysisAloneTime"
                  :min="0"
                  controls-position="right"
                  style="width: 100%"
                />
              </ElFormItem>
            </ElCol>
            <ElCol :span="8" v-if="showSequential">
              <ElFormItem label="单超量(ml)">
                <ElInputNumber
                  v-model="formData.SequentialDialysisDose"
                  :min="0"
                  controls-position="right"
                  style="width: 100%"
                />
              </ElFormItem>
            </ElCol>
          </ElRow>
          <ElRow :gutter="16">
            <ElCol :span="8">
              <ElFormItem label="是否禁食">
                <ElRadioGroup v-model="formData.IsNoEat">
                  <ElRadio value="1">是</ElRadio>
                  <ElRadio value="0">否</ElRadio>
                </ElRadioGroup>
              </ElFormItem>
            </ElCol>
            <ElCol :span="16">
              <ElFormItem label="备注">
                <ElInput
                  v-model="formData.MedPlan"
                  type="textarea"
                  :rows="2"
                  placeholder="请输入备注信息"
                />
              </ElFormItem>
            </ElCol>
          </ElRow>
        </ElForm>

        <!-- ========== 透析液处方 ========== -->
        <ElDivider content-position="left">透析液处方</ElDivider>
        <ElForm :model="formData" label-width="130px" size="small" class="plan-form">
          <ElRow :gutter="16">
            <ElCol :span="6">
              <ElFormItem label="组合曲线">
                <ElSelect v-model="formData.Curve_zh" placeholder="请选择" style="width: 100%" clearable>
                  <ElOption
                    v-for="item in curveOptions"
                    :key="item.Value || item.value || item.Id"
                    :label="item.Text || item.label || item.Name"
                    :value="item.Value || item.value || item.Id"
                  />
                </ElSelect>
              </ElFormItem>
            </ElCol>
            <ElCol :span="6">
              <ElFormItem label="钠曲线">
                <ElSelect v-model="formData.Curve_na" placeholder="请选择" style="width: 100%" clearable>
                  <ElOption
                    v-for="item in curveOptions"
                    :key="item.Value || item.value || item.Id"
                    :label="item.Text || item.label || item.Name"
                    :value="item.Value || item.value || item.Id"
                  />
                </ElSelect>
              </ElFormItem>
            </ElCol>
            <ElCol :span="6">
              <ElFormItem label="超滤曲线">
                <ElSelect v-model="formData.Curve_cl" placeholder="请选择" style="width: 100%" clearable>
                  <ElOption
                    v-for="item in curveOptions"
                    :key="item.Value || item.value || item.Id"
                    :label="item.Text || item.label || item.Name"
                    :value="item.Value || item.value || item.Id"
                  />
                </ElSelect>
              </ElFormItem>
            </ElCol>
            <ElCol :span="6">
              <ElFormItem label="温度(℃)">
                <ElInputNumber
                  v-model="formData.TxyTemperature"
                  :min="30"
                  :max="40"
                  :precision="1"
                  controls-position="right"
                  style="width: 100%"
                />
              </ElFormItem>
            </ElCol>
          </ElRow>
          <ElRow :gutter="16">
            <ElCol :span="6">
              <ElFormItem label="钾(mmol/L)">
                <ElInputNumber
                  v-model="formData.FlowPres_k"
                  :min="0"
                  :max="10"
                  :precision="1"
                  controls-position="right"
                  style="width: 100%"
                />
              </ElFormItem>
            </ElCol>
            <ElCol :span="6">
              <ElFormItem label="钙(mmol/L)">
                <ElInputNumber
                  v-model="formData.FlowPres_ga"
                  :min="0"
                  :max="5"
                  :precision="2"
                  controls-position="right"
                  style="width: 100%"
                />
              </ElFormItem>
            </ElCol>
            <ElCol :span="6">
              <ElFormItem label="钠(mmol/L)">
                <ElInputNumber
                  v-model="formData.FlowPres_na"
                  :min="100"
                  :max="160"
                  :precision="1"
                  controls-position="right"
                  style="width: 100%"
                />
              </ElFormItem>
            </ElCol>
            <ElCol :span="6">
              <ElFormItem label="碳酸氢根(mmol/L)">
                <ElInputNumber
                  v-model="formData.FlowPres_hq"
                  :min="0"
                  :max="50"
                  :precision="1"
                  controls-position="right"
                  style="width: 100%"
                />
              </ElFormItem>
            </ElCol>
          </ElRow>
          <ElRow :gutter="16">
            <ElCol :span="6">
              <ElFormItem label="葡萄糖(mmol/L)">
                <ElInputNumber
                  v-model="formData.Glucose"
                  :min="0"
                  :max="20"
                  :precision="1"
                  controls-position="right"
                  style="width: 100%"
                />
              </ElFormItem>
            </ElCol>
          </ElRow>
        </ElForm>

        <!-- ========== 体重 & 超滤量 ========== -->
        <ElDivider content-position="left">体重 & 超滤量</ElDivider>
        <ElForm :model="formData" label-width="140px" size="small" class="plan-form">
          <ElRow :gutter="16">
            <ElCol :span="8">
              <ElFormItem label="上次透后体重(kg)">
                <ElInputNumber
                  v-model="formData.PreviousAfterDialysisWeight"
                  :min="0"
                  :precision="1"
                  controls-position="right"
                  style="width: 100%"
                />
              </ElFormItem>
            </ElCol>
            <ElCol :span="8">
              <ElFormItem label="透前体重(kg)">
                <ElInputNumber
                  v-model="formData.BeforeDialysisWeight"
                  :min="0"
                  :precision="1"
                  controls-position="right"
                  style="width: 100%"
                />
              </ElFormItem>
            </ElCol>
            <ElCol :span="8">
              <ElFormItem label="衣物增减(kg)">
                <ElInputNumber
                  v-model="formData.ClothingWeight"
                  :precision="1"
                  controls-position="right"
                  style="width: 100%"
                />
              </ElFormItem>
            </ElCol>
          </ElRow>
          <ElRow :gutter="16">
            <ElCol :span="8">
              <ElFormItem label="超滤量(ml)">
                <ElInputNumber
                  v-model="formData.UltraFilRate"
                  :min="0"
                  controls-position="right"
                  style="width: 100%"
                />
              </ElFormItem>
            </ElCol>
            <ElCol :span="8">
              <ElFormItem label="未测体重原因">
                <ElSelect
                  v-model="formData.NoWeightBasis"
                  placeholder="请选择"
                  style="width: 100%"
                  clearable
                >
                  <ElOption
                    v-for="item in noWeightBasisOptions"
                    :key="item.Value || item.value || item.Id"
                    :label="item.Text || item.label || item.Name"
                    :value="item.Value || item.value || item.Id"
                  />
                </ElSelect>
              </ElFormItem>
            </ElCol>
            <ElCol :span="8">
              <ElFormItem label="上次未测体重原因">
                <span class="display-value">{{ formData.LastNoWeightBasis || '--' }}</span>
              </ElFormItem>
            </ElCol>
          </ElRow>
        </ElForm>

        <!-- ========== 重点关注 ========== -->
        <ElDivider content-position="left">重点关注</ElDivider>
        <div class="focus-section">
          <ElRow :gutter="16">
            <ElCol :span="4">
              <span>重点关注：</span>
              <ElTag :type="focusTagType" size="small">
                {{ formData.IsFocus === '1' ? '是' : '否' }}
              </ElTag>
            </ElCol>
            <ElCol :span="4">
              <span>标签：</span>
              <ElTag v-if="formData.MsgTag" type="warning" size="small">{{ formData.MsgTag }}</ElTag>
              <span v-else>--</span>
            </ElCol>
            <ElCol :span="16">
              <span>关注信息：</span>
              <span class="focus-message">{{ formData.FocusMessage || '--' }}</span>
            </ElCol>
          </ElRow>
        </div>

        <!-- ========== 病种信息 ========== -->
        <ElDivider content-position="left">病种信息</ElDivider>
        <div class="disease-section" v-if="formData.PatientDiseaseType && formData.PatientDiseaseType.length > 0">
          <ElTable :data="formData.PatientDiseaseType" border size="small" style="width: 100%">
            <ElTableColumn prop="DiseTypeCode" label="病种编码" width="120" />
            <ElTableColumn prop="OpspDiseCode" label="手术病种编码" width="140" />
            <ElTableColumn prop="OpspDiseName" label="手术病种名称" min-width="200" />
            <ElTableColumn prop="ValidDate" label="有效期" width="120" />
          </ElTable>
        </div>
        <div v-else class="no-data-tip">暂无病种信息</div>

        <!-- ========== 签名医生 ========== -->
        <ElDivider content-position="left">签名信息</ElDivider>
        <ElForm :model="formData" label-width="120px" size="small" class="plan-form">
          <ElRow :gutter="16">
            <ElCol :span="8">
              <ElFormItem label="签名医生">
                <ElInput v-model="formData.SignDoctorName" placeholder="签名医生" />
              </ElFormItem>
            </ElCol>
          </ElRow>
        </ElForm>
      </div>
    </ElScrollbar>

    <!-- ========== 底部按钮 ========== -->
    <template #footer>
      <div class="dialog-footer">
        <ElButton @click="openAssessDialog">透析前评估</ElButton>
        <ElButton @click="viewHistory">查看历史记录</ElButton>
        <ElButton type="primary" :loading="confirmLoading" @click="handleConfirm">确认</ElButton>
        <ElButton @click="handleCancel">取消</ElButton>
      </div>
    </template>

    <!-- ========== 透析前评估弹窗 ========== -->
    <ElDialog
      v-model="assessDialogVisible"
      title="透析前评估"
      width="800px"
      :close-on-click-modal="false"
      append-to-body
    >
      <ElForm
        ref="assessFormRef"
        :model="assessForm"
        label-width="140px"
        size="small"
        class="plan-form"
      >
        <ElRow :gutter="16">
          <ElCol :span="12">
            <ElFormItem label="水潴留">
              <ElSelect v-model="assessForm.EdemaType" placeholder="请选择" style="width: 100%" clearable>
                <ElOption
                  v-for="item in edemaTypeOptions"
                  :key="item.Value || item.value || item.Id"
                  :label="item.Text || item.label || item.Name"
                  :value="item.Value || item.value || item.Id"
                />
              </ElSelect>
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="出血风险(HAS_BLED)">
              <ElSelect v-model="assessForm.HAS_BLED" placeholder="请选择" style="width: 100%" clearable>
                <ElOption
                  v-for="item in hasBledOptions"
                  :key="item.Value || item.value || item.Id"
                  :label="item.Text || item.label || item.Name"
                  :value="item.Value || item.value || item.Id"
                />
              </ElSelect>
            </ElFormItem>
          </ElCol>
        </ElRow>
        <ElRow :gutter="16">
          <ElCol :span="12">
            <ElFormItem label="体温(℃)">
              <ElInputNumber
                v-model="assessForm.CurrBodyTemperature"
                :min="30"
                :max="45"
                :precision="1"
                controls-position="right"
                style="width: 100%"
              />
            </ElFormItem>
          </ElCol>
          <ElCol :span="6">
            <ElFormItem label="收缩压(mmHg)">
              <ElInputNumber
                v-model="assessForm.PreSystolicPressure"
                :min="0"
                :max="300"
                controls-position="right"
                style="width: 100%"
              />
            </ElFormItem>
          </ElCol>
          <ElCol :span="6">
            <ElFormItem label="舒张压(mmHg)">
              <ElInputNumber
                v-model="assessForm.PreDiastolicPressure"
                :min="0"
                :max="200"
                controls-position="right"
                style="width: 100%"
              />
            </ElFormItem>
          </ElCol>
        </ElRow>
        <ElRow :gutter="16">
          <ElCol :span="12">
            <ElFormItem label="气促">
              <ElSelect v-model="assessForm.GaspType" placeholder="请选择" style="width: 100%" clearable>
                <ElOption
                  v-for="item in gaspTypeOptions"
                  :key="item.Value || item.value || item.Id"
                  :label="item.Text || item.label || item.Name"
                  :value="item.Value || item.value || item.Id"
                />
              </ElSelect>
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="心前区不适">
              <ElSelect
                v-model="assessForm.PrecordialDiscomfortType"
                placeholder="请选择"
                style="width: 100%"
                clearable
              >
                <ElOption
                  v-for="item in precordialDiscomfortOptions"
                  :key="item.Value || item.value || item.Id"
                  :label="item.Text || item.label || item.Name"
                  :value="item.Value || item.value || item.Id"
                />
              </ElSelect>
            </ElFormItem>
          </ElCol>
        </ElRow>
        <ElRow :gutter="16">
          <ElCol :span="24">
            <ElFormItem label="上次透析后情况">
              <ElInput
                v-model="assessForm.SummaryLastTreatment"
                type="textarea"
                :rows="2"
                placeholder="请输入上次透析后情况"
              />
            </ElFormItem>
          </ElCol>
        </ElRow>
        <ElRow :gutter="16">
          <ElCol :span="12">
            <ElFormItem label="其它特殊不适">
              <ElInput
                v-model="assessForm.OtherSpecialDiscomfort"
                placeholder="请输入"
              />
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="特殊不适备注">
              <ElInput
                v-model="assessForm.OtherSpecialDiscomfortRemarks"
                placeholder="请输入"
              />
            </ElFormItem>
          </ElCol>
        </ElRow>
        <ElRow :gutter="16">
          <ElCol :span="12">
            <ElFormItem label="其它检验">
              <ElInput
                v-model="assessForm.OtherTestsAndTreatments"
                placeholder="请输入"
              />
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="检验备注">
              <ElInput
                v-model="assessForm.OtherTestsAndTreatmentsRemarks"
                placeholder="请输入"
              />
            </ElFormItem>
          </ElCol>
        </ElRow>
      </ElForm>
      <template #footer>
        <ElButton type="primary" @click="saveAssessment">保存</ElButton>
        <ElButton @click="assessDialogVisible = false">取消</ElButton>
      </template>
    </ElDialog>

    <!-- ========== 历史记录弹窗 ========== -->
    <ElDialog
      v-model="historyDialogVisible"
      title="历史记录"
      width="1000px"
      :close-on-click-modal="false"
      append-to-body
    >
      <ElTable :data="historyData" border size="small" style="width: 100%" max-height="500">
        <ElTableColumn prop="Shift" label="班次" width="80" />
        <ElTableColumn prop="DialysisType" label="治疗模式" width="100" />
        <ElTableColumn prop="TreatHour" label="治疗时长" width="100">
          <template #default="{ row }">
            {{ row.TreatHour }}h{{ row.TreatMin ? row.TreatMin + 'm' : '' }}
          </template>
        </ElTableColumn>
        <ElTableColumn prop="BloodFlow" label="血流量" width="90" />
        <ElTableColumn prop="Anticoagulants" label="抗凝剂" width="100" />
        <ElTableColumn prop="Dialyzer" label="透析器" width="120" />
        <ElTableColumn prop="BeforeDialysisWeight" label="透前体重" width="100" />
        <ElTableColumn prop="UltraFilRate" label="超滤量" width="100" />
        <ElTableColumn prop="MedPlan" label="备注" min-width="150" show-overflow-tooltip />
      </ElTable>
      <template #footer>
        <ElButton @click="historyDialogVisible = false">关闭</ElButton>
      </template>
    </ElDialog>
  </ElDialog>
</template>

<style lang="less" scoped>
.confirm-plan-container {
  padding: 0 8px 16px;
}

.plan-header {
  margin-bottom: 8px;

  .patient-name {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
  }
}

.plan-form {
  :deep(.el-form-item) {
    margin-bottom: 12px;
  }

  :deep(.el-form-item__label) {
    font-size: 13px;
    color: #606266;
  }

  :deep(.el-input-number) {
    .el-input__inner {
      text-align: left;
    }
  }
}

.display-value {
  display: inline-block;
  line-height: 32px;
  color: #606266;
  font-size: 13px;
}

.focus-section {
  padding: 8px 16px;
  background-color: #fef0f0;
  border-radius: 4px;
  border: 1px solid #fde2e2;

  span {
    font-size: 13px;
    color: #606266;
  }

  .focus-message {
    color: #e6a23c;
    font-weight: 500;
  }
}

.disease-section {
  margin-bottom: 8px;
}

.no-data-tip {
  text-align: center;
  color: #909399;
  font-size: 13px;
  padding: 12px 0;
}

.anticoagulant-group-item {
  padding: 8px 12px;
  margin-bottom: 8px;
  background-color: #f5f7fa;
  border-radius: 4px;
  border: 1px solid #ebeef5;

  :deep(.el-form-item) {
    margin-bottom: 8px;
  }

  :deep(.el-form-item__label) {
    font-size: 12px;
    color: #909399;
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

:deep(.el-divider__text) {
  font-size: 14px;
  font-weight: 600;
  color: #409eff;
}
</style>
