<script lang="ts" setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue';
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
  ElMessageBox,
  ElDescriptions,
  ElDescriptionsItem,
  ElDivider,
  ElTooltip,
  ElEmpty,
  ElCard,
  ElDatePicker,
  ElTable,
  ElTableColumn,
  ElPagination,
} from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import { swsApi } from '#/api/sws';

// ==================== 类型定义 ====================

/** 患者签到状态枚举 */
enum CurrentState {
  Pending = 2,      // 待排床
  Ready = 3,        // 待签到
  SignedIn = 4,     // 已签到
  Dialyzing = 5,    // 透析中
  OffMachine = 6,   // 下机
}

/** 签到列表项 - 使用原系统字段名 */
interface SignInPatient {
  Id: string;
  PatientId: string;
  PatientName: string;
  Sex: string;
  Age: number;
  PatientNo: string;
  PatientFileNo: string;
  SickbedNo: string;
  EquipmentSerialNumber: string;
  TreatmentRegion: string;
  TreatmentRegionId: string;
  ActualShift: string;
  ActualDialysisType: string;
  ActualDialyzer: string;
  ActualDialysisPerfusion: string;
  CurrentState: CurrentState;
  CurrentDryWeight: number;
  CurrentBeforeDialysisWeight: number | null;
  CurrentAfterDialysisWeight: number | null;
  PostWeight: number | null;
  displayPostWeight: number | null;
  UltraFilRate: number;
  PreSystolicPressure: number;
  PreDiastolicPressure: number;
  PostSystolicPressure: number;
  PostDiastolicPressure: number;
  ObserveSystolicPressure: number;
  ObserveDiastolicPressure: number;
  BloodBorneDisease: string;
  BloodBorneDiseaseId: string;
  Date: string;
  DialysisId: string;
  SignId: string;
  PatientCycleSchedulingId: string;
  EquipmentId: string;
  DialysisTypeId: string;
  PatientTreatmentRegion: string;
  LoginTime: string;
  LeftTime: string;
  TreatHour: number;
  TreatMin: number;
  SchedulingUserName: string;
  SchedulingBedUserName: string;
  RejectPrescriptionDetails: any[];
  NoWeightBasis: string;
  showWeightFlag: number;
  postNoWeightBasis: string;
  formatAnticoagulants: string[];
  Anticoagulants: string;
  AnticoagulantsFirstDose: number;
  AnticoagulantsBolus: number;
  AnticoagulantsUnitId: string;
  AnticoagulantGroup: string;
  ClothingWeight: number;
  PostPreTreatMessageId: string;
  DefineColor: string;
  IsFocus: boolean;
  FeatureByPhot: string;
}

/** 班次选项 */
interface ShiftOption {
  ShiftName: string;
}

/** 分区选项 */
interface RegionOption {
  Id: string;
  Name: string;
}

/** 患者类型选项 */
interface PatientTypeOption {
  Id: string;
  Name: string;
}

/** 透析模式选项 */
interface DialysisTypeOption {
  Id: string;
  Value: string;
}

/** 床位选项 */
interface BedOption {
  EquipmentId: string;
  SickbedNo: string;
  TreatmentRegion: string;
}

/** 干体重历史记录 */
interface DryWeightHistory {
  DryWeight: number;
  DryWeightSetDate: string;
}

/** 传染病检查信息 */
interface InfectionDetail {
  PatientId: string;
  RemindType: number;
  CategoryDisplayName: string;
  NextCheckDays: number;
  newCheckDate: string;
  NextCheckDate: string;
  OutResult: number;
  SourceCheckDate: string;
  SourceTransferDate: string;
}

/** 透析器和灌流器选项 */
interface DialyzerOption {
  Name: string;
  Value: string;
  IsSelect: boolean;
}

// ==================== 常量 ====================

const SORT_OPTIONS = [
  { label: '按床位排序', value: '1' },
  { label: '按姓名排序', value: '2' },
  { label: '按称重时间排序', value: '3' },
  { label: '按患者编号排序', value: '4' },
  { label: '按已称重未签到排序', value: '5' },
];

const SIGN_STATUS_OPTIONS = [
  { label: '全部', value: '全部' },
  { label: '未签到', value: '未签到' },
  { label: '已签到', value: '已签到' },
];

/** 状态标签配置 */
const STATUS_TAG_MAP: Record<number, { label: string; type: '' | 'success' | 'warning' | 'danger' | 'info' }> = {
  [CurrentState.Pending]: { label: '待排床', type: 'info' },
  [CurrentState.Ready]: { label: '待签到', type: 'warning' },
  [CurrentState.SignedIn]: { label: '已签到', type: 'success' },
  [CurrentState.Dialyzing]: { label: '透析中', type: '' },
  [CurrentState.OffMachine]: { label: '下机', type: 'danger' },
};

// ==================== 状态 ====================

const loading = ref(false);
const loading2 = ref(false);

// 搜索和筛选
const patNameSearchVal = ref('');
const selectDay = ref<Date>(new Date());
const PxType = ref('1');
const myShift = ref('全部');
const myFq = ref('全部');
const TreatmentRegionDetail = ref('全部');
const signStatus = ref('全部');
const PatientType = ref('全部');

// 数据列表
const tableData = ref<SignInPatient[]>([]);
const bcData = ref<ShiftOption[]>([]);
const FqData = ref<RegionOption[]>([]);
const FqChildData = ref<RegionOption[]>([]);
const PatientTypeList = ref<PatientTypeOption[]>([]);
const txqDataNew = ref<DialysisTypeOption[]>([]);
const checkInfectionList = ref<InfectionDetail[]>([]);

// 透析器和灌流器
const DialyzerArr = ref<DialyzerOption[]>([]);
const DialysisPerfusionArr = ref<DialyzerOption[]>([]);

// 选中的患者
const selectedPatient = ref<SignInPatient | null>(null);
const selectedPatientId = ref<string | null>(null);

// 排班弹窗
const shiftShow = ref(false);
const tempshiftShow = ref(false);
const shiftData = reactive({
  Date: '',
  Shift: '',
  DialysisType: '',
  Dialyzer: '',
  DialysisPerfusion: '',
  SickbedNo: '',
  EquipmentId: '',
  PatientId: '',
});
const bedNoArr = ref<BedOption[]>([]);
const rowValue = ref<SignInPatient | null>(null);

// 分区修改弹窗
const RegionShow = ref(false);
const RegionVal = ref<SignInPatient | null>(null);
const TreatmentRegionId = ref('');

// 干体重调整弹窗
const changeShow = ref(false);
const CurrentDryWeight = ref<number | null>(null);
const rowVal = ref<SignInPatient | null>(null);
const his_list = ref<DryWeightHistory[]>([]);

// 未测体重签到弹窗
const NoWeightShow = ref(false);
const NoWeightWhyVal = ref<SignInPatient | null>(null);
const NoWeightBasis = ref('');

// 定时刷新
const loadTime = ref(5);
const autoLaodC = ref('default');
const loadQ = ref(false);
let qrT: ReturnType<typeof setInterval> | null = null;

// 权限控制
const pbshow = ref(true);
const pbshow2 = ref(true);
const lockState = ref(false);

// 列表类型
const listType = ref('表格');

// 列配置
const columns = ref([
  { title: '姓名', key: 'PatientName', width: 120 },
  { title: '', key: 'config', width: 120, isConfig: true },
  { title: '床号', key: 'SickbedNo', width: 80 },
  { title: '机器编号', key: 'EquipmentSerialNumber', width: 80 },
  { title: '分区', key: 'TreatmentRegion', width: 80 },
  { title: '班次', key: 'ActualShift', width: 60 },
  { title: '治疗模式', key: 'ActualDialysisType', width: 100 },
  { title: '透析器', key: 'ActualDialyzer', width: 100 },
  { title: '灌流器', key: 'ActualDialysisPerfusion', width: 100 },
  { title: '抗凝剂', key: 'formatAnticoagulants', width: 100 },
  { title: '干体重', key: 'CurrentDryWeight', minWidth: 60 },
  { title: '本次透前称重&最新血压', key: 'CurrentBeforeDialysisWeight', minWidth: 156 },
  { title: '透后体重&血压', key: 'CurrentAfterDialysisWeight', minWidth: 156 },
  { title: '超滤量', key: 'UltraFilRate', minWidth: 65 },
  { title: '排班', key: 'SchedulingUserName', minWidth: 55 },
  { title: '排床', key: 'SchedulingBedUserName', minWidth: 55 },
  { title: '操作', key: 'Action', width: 140 },
]);

// 方案数据
const planData = reactive({
  id: '',
  CurrentState: 0,
  PatientId: '',
  Date: '',
  PatientName: '',
  CardNum: '',
});

// 医嘱数据
const orderData = reactive({
  patId: '',
  signId: '',
  DialysisId: '',
  PatientName: '',
});
const orderShow = ref(false);

// 传染病详情弹窗
const showInfectionDetails = ref(false);
const infectionPatientName = ref('');
const infectionDetail = ref<Partial<InfectionDetail>>({});

// 透析记录单弹窗
const txjld_show = ref(false);
const txjld_Item = ref<Partial<SignInPatient>>({});

// 配置项
const IsUsingAnticoagulants = ref(sessionStorage.getItem('IsUsingAnticoagulants') === '1');
const IsSubtractClothingWeight = ref(sessionStorage.getItem('IsSubtractClothingWeight') === '1');
const IsCheckInAllowedWithoutBed = ref(sessionStorage.getItem('IsCheckInAllowedWithoutBed') === '1');

// ==================== 计算属性 ====================

/** 筛选后的患者列表 */
const filterTabData = computed(() => {
  let arr = tableData.value;
  if (patNameSearchVal.value) {
    arr = arr.filter((item) =>
      item.PatientName?.includes(patNameSearchVal.value)
    );
  }
  if (signStatus.value === '未签到') {
    arr = arr.filter((item) => item.CurrentState < 4);
  } else if (signStatus.value === '已签到') {
    arr = arr.filter((item) => item.CurrentState >= 4);
  }
  return arr;
});

/** 统计数据 */
const stats = computed(() => {
  const total = tableData.value.length;
  const signed = tableData.value.filter((p) => p.CurrentState >= 4).length;
  return { total, signed };
});

/** 已签到列表 */
const isQd = computed(() => {
  return tableData.value.filter((item) => item.CurrentState === 5 || item.CurrentState === 6);
});

// ==================== API 调用 ====================

/** 获取系统字典数据 */
async function loadMenu() {
  const typeIds = [
    { typeId: 'e24f4c400b274d229d7d6b5498f9bea8' },
    { typeId: '6d44c940094e47748380002db1ea8cf1' },
    { typeId: 'c0ec599396f94e8b9d808f17783bf49e' },
    { typeId: '3741c81ad02c42adaf12de523cf73d43' },
    { typeId: '40742936d4fb464b8f63ce719190782d' },
    { typeId: 'f5abc3fb7fa74532994113531c1fd065' },
    { typeId: '02a89c9dd3c64b31b807f2e8e912dfd5' },
    { typeId: 'd4fd6f79ff5b412dbc0f5ce3bc6ef7d2' },
    { typeId: 'a056c9a05f0041fcb6f71cd0f10e9ae2' },
    { typeId: 'b593d5e9890d49c9b8a429e44136da94' },
    { typeId: 'f74335ed3a7140838fc18b0b2517307a' },
    { typeId: '1f6cff3e66064101a8fcfd57036df07b' },
    { typeId: '320dae4786fa467fa10fc14302906d02' },
    { typeId: '0c09ff442f7f4164985502ba1b038b42' },
    { typeId: '9364d9b7b019426a96c61822adcecdeb' },
    { typeId: '5189c272d88b4e50ae636d2e9ca694dc' },
    { typeId: '0894eef655284f0bb4840f2db089527d' },
    { typeId: 'bd1716eacc88465588324b680fcf7570' },
    { typeId: '21475ef3ced24b54a65b69bf7b69596f' },
    { typeId: '4b6feb8247374ae69409098260041591' },
  ];
  const res = await swsApi.swsGet('SystemDictionary/4006', { data: JSON.stringify(typeIds) });
  if (res.Code === 200) {
    const data = res.Data as any[];
    txqDataNew.value = data[14]?.SystemDictionaryList || [];
    FqData.value = data[17]?.SystemDictionaryList || [];
    PatientTypeList.value = data[18]?.SystemDictionaryList || [];
    FqChildData.value = data[19]?.SystemDictionaryList || [];
  }
  PatientShiftSet();
}

/** 获取班次设置 */
async function PatientShiftSet() {
  const selectday = formatDate(selectDay.value);
  const res = await swsApi.swsGet('PatientShiftSet/4002', { Date: selectday });
  if (res.Code === 200) {
    bcData.value = res.Data as ShiftOption[];
  }
}

/** 查询签到列表 */
async function queryList(showLoading = true) {
  if (showLoading) {
    loading.value = true;
  }

  const nowday = formatDate(new Date());
  const selectday = formatDate(selectDay.value);

  // 判断是否过期
  pbshow.value = !(nowday > selectday && !sessionStorage.getItem('gengxin'));
  pbshow2.value = nowday === selectday;

  const myShiftVal = myShift.value === '全部' ? '' : myShift.value;
  const myFqVal = myFq.value === '全部' ? '' : myFq.value;
  const TreatmentRegionDetailVal = TreatmentRegionDetail.value === '全部' ? '' : TreatmentRegionDetail.value;

  const params = {
    Date: selectday,
    Shift: myShiftVal,
    PatientType: PatientType.value === '全部' ? '' : PatientType.value,
    TreatmentRegion: myFqVal,
    OrderType: PxType.value,
    TreatmentRegionDetail: TreatmentRegionDetailVal,
  };

  try {
    const res = await swsApi.swsGet('SchedulingManage/4017', params);
    loading.value = false;

    if (res.Code === 200) {
      const data = (res.Data as SignInPatient[]).map((item) => {
        const formatAnticoagulants: string[] = [];
        const {
          Anticoagulants,
          AnticoagulantsFirstDose,
          AnticoagulantsBolus,
          AnticoagulantsUnitId,
          AnticoagulantGroup,
          PostWeight,
          ClothingWeight,
          NoWeightBasis,
        } = item;

        const handleFormatAnticoagulants = (anticoagulantsList: any[]) => {
          anticoagulantsList.forEach((acItem) => {
            const {
              Anticoagulants: AcName,
              AnticoagulantsFirstDose: AcFirst,
              AnticoagulantsBolus: AcBolus,
              AnticoagulantsUnitId: AcUnit,
            } = acItem;
            const initialDose = !AcFirst || Number.isNaN(AcFirst) ? 0 : AcFirst;
            const addDose = !AcBolus || Number.isNaN(AcBolus) ? 0 : AcBolus;
            const totalDose = initialDose + addDose;
            const doseUnit = AcUnit || '';
            formatAnticoagulants.push(
              AcName === '无肝素' ? AcName : `${AcName}(${totalDose}${doseUnit})`
            );
          });
        };

        if (AnticoagulantGroup && IsUsingAnticoagulants.value) {
          handleFormatAnticoagulants(JSON.parse(AnticoagulantGroup));
        } else if (Anticoagulants) {
          handleFormatAnticoagulants([
            {
              Anticoagulants,
              AnticoagulantsFirstDose,
              AnticoagulantsBolus,
              AnticoagulantsUnitId,
            },
          ]);
        } else {
          formatAnticoagulants.push(Anticoagulants);
        }

        // 处理透后体重
        let displayPostWeight = PostWeight;
        if (IsSubtractClothingWeight.value && PostWeight && ClothingWeight) {
          displayPostWeight = parseFloat(String(PostWeight)) - parseFloat(String(ClothingWeight));
        }

        return {
          ...item,
          formatAnticoagulants,
          showWeightFlag: NoWeightBasis ? 0 : 1,
          postNoWeightBasis: NoWeightBasis || '',
          displayPostWeight,
        };
      });
      tableData.value = data;
    }
  } catch (error) {
    loading.value = false;
    tableData.value = [];
  }

  getCheckInfectionList();
}

/** 生成签到 */
async function querySign() {
  loading2.value = true;
  const params = {
    Date: formatDate(selectDay.value),
  };
  try {
    await swsApi.swsPut('SchedulingManage/3001', params);
    ElMessage.success('生成成功');
    queryList();
  } finally {
    loading2.value = false;
  }
}

/** 签到 */
async function SignClick(row: SignInPatient) {
  if (lockState.value) return;

  let weight = row.CurrentBeforeDialysisWeight;
  if (weight !== null && weight !== undefined && weight !== '') {
    if (isNaN(Number(weight))) {
      ElMessage.warning('体重请输入数字！');
      return;
    }
    weight = Number(weight);
    if (weight === 0) {
      NoWeightWhy(row);
    } else {
      await doSignIn(row, weight);
    }
  } else {
    ElMessage.warning('体重不能为空！未测体重请填0！');
  }
}

/** 执行签到 */
async function doSignIn(row: SignInPatient, weight: number) {
  lockState.value = true;
  const params = {
    Id: row.Id,
    PatientId: row.PatientId,
    CurrentBeforeDialysisWeight: weight,
    NoWeightBasis: row.NoWeightBasis,
  };
  try {
    const res = await swsApi.swsPut('SchedulingManage/3002', params);
    if (res.Code === 200) {
      ElMessage.success(res.Msg || '签到成功');
    }
    queryList();
  } finally {
    lockState.value = false;
  }
}

/** 未测体重签到 */
function NoWeightWhy(row: SignInPatient) {
  NoWeightWhyVal.value = row;
  NoWeightBasis.value = row.NoWeightBasis || '';
  NoWeightShow.value = true;
}

/** 保存未测体重原因并签到 */
async function saveNoWeightBasis() {
  if (!NoWeightBasis.value || NoWeightBasis.value.trim() === '') {
    ElMessage.warning('请输入未测体重的原因！');
    return;
  }
  const params = {
    Id: NoWeightWhyVal.value?.Id,
    NoWeightBasis: NoWeightBasis.value,
    CurrentBeforeDialysisWeight: 0,
  };
  const res = await swsApi.swsPut('SchedulingManage/3016', params);
  if (res.Code === 200) {
    NoWeightShow.value = false;
    if (NoWeightWhyVal.value) {
      await doSignIn(NoWeightWhyVal.value, 0);
    }
  }
}

/** 删除签到 */
async function deleteQd(id: string) {
  try {
    await ElMessageBox.confirm('此条签到表记录将被删除！删除不可恢复，请谨慎操作！', '确认删除此条签到表记录', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });
    const res = await swsApi.swsDelete('SchedulingManage/2006', { Id: id });
    if (res.Code === 200) {
      ElMessage.success(res.Msg || '删除成功');
      queryList();
    }
  } catch (error) {
    // 用户取消
  }
}

/** 删除所有签到 */
async function DeleteAll() {
  try {
    await ElMessageBox.confirm('删除不可恢复，请谨慎操作！', '确认删除所有签到吗', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });
    const res = await swsApi.swsDelete('SchedulingManage/2008', { Date: formatDate(selectDay.value) });
    if (res.Code === 200) {
      ElMessage.success(res.Msg || '删除成功');
      queryList();
    }
  } catch (error) {
    // 用户取消
  }
}

/** 获取干体重历史 */
async function getHis() {
  if (!rowVal.value) return;
  const params = { PatientId: rowVal.value.PatientId };
  const res = await swsApi.swsGet('SchedulingManage/4024', params);
  if (res.Code === 200) {
    his_list.value = res.Data as DryWeightHistory[];
  }
}

/** 保存干体重 */
async function saveWeight() {
  if (!rowVal.value || CurrentDryWeight.value === null) return;
  try {
    await ElMessageBox.confirm('提示：此干体重会添加到干体重调整记录中，后续会使用此干体重！确认请点击确定。', '确认修改干体重吗？', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });
    const params = {
      Id: rowVal.value.Id,
      CurrentDryWeight: CurrentDryWeight.value,
    };
    const res = await swsApi.swsPut('SchedulingManage/3011', params);
    if (res.Code === 200) {
      ElMessage.success(res.Msg || '干体重调整成功');
      changeShow.value = false;
      queryList();
    }
  } catch (error) {
    // 用户取消
  }
}

/** 获取床位列表 */
async function getBedNo(row: SignInPatient) {
  if (!shiftData.DialysisType) return;
  const nowDate = row.Date ? row.Date.substring(0, 10) : formatDate(new Date());
  const params = {
    Date: nowDate,
    Shift: shiftData.Shift,
    PatientId: row.PatientId || row.Id,
    DialysisType: shiftData.DialysisType,
    TreatmentRegion: tempshiftShow.value ? row.TreatmentRegion : row.PatientTreatmentRegion,
  };
  const res = await swsApi.swsPost('SchedulingManage/1007', params);
  if (res.Code === 200) {
    bedNoArr.value = res.Data as BedOption[];
  }
}

/** 获取透析器和灌流器 */
async function getTxqGlq(row: SignInPatient, record?: number) {
  const params = {
    DictionaryId: row.DialysisTypeId,
    PatientId: row.PatientId,
  };
  const res = await swsApi.swsGet('DialysisModeSet/4001', params);
  if (res.Code === 200) {
    const data = res.Data as any[];
    DialyzerArr.value = data[0]?.Dialyzer || [];
    DialysisPerfusionArr.value = data[0]?.Hemoperfusion || [];
    if (record === 1) {
      const defaultDialyzer = DialyzerArr.value.find((item) => item.IsSelect);
      const defaultPerfusion = DialysisPerfusionArr.value.find((item) => item.IsSelect);
      shiftData.Dialyzer = defaultDialyzer?.Name || '';
      shiftData.DialysisPerfusion = defaultPerfusion?.Value || '';
    } else {
      shiftData.Dialyzer = rowValue.value?.ActualDialyzer || '';
      shiftData.DialysisPerfusion = rowValue.value?.ActualDialysisPerfusion || '';
    }
  }
}

/** 保存排班 */
async function saveShift() {
  if (tempshiftShow.value) {
    await addPb();
    return;
  }
  const params = {
    Id: rowValue.value?.Id,
    PatientId: rowValue.value?.PatientId,
    Date: rowValue.value?.Date?.substring(0, 10),
    Shift: shiftData.Shift,
    DialysisType: shiftData.DialysisType,
    EquipmentId: shiftData.EquipmentId || '',
    SickbedNo: shiftData.SickbedNo,
    Dialyzer: shiftData.Dialyzer,
    DialysisPerfusion: shiftData.DialysisPerfusion,
  };
  const res = await swsApi.swsPut('SchedulingManage/3012', params);
  if (res.Code === 200) {
    ElMessage.success(res.Msg || '保存成功');
    shiftShow.value = false;
    queryList();
  }
}

/** 添加临时排班 */
async function addPb() {
  if (
    shiftData.Shift === '' ||
    shiftData.DialysisType === '' ||
    shiftData.Dialyzer === '' ||
    shiftData.DialysisPerfusion === ''
  ) {
    ElMessage.warning('请输入信息！');
    return;
  }
  const params = {
    ...shiftData,
    PatientId: selectedPatientId.value,
    Date: formatDate(new Date(shiftData.Date)),
  };
  const res = await swsApi.swsPost('SchedulingManage/1004', params);
  if (res.Code === 200) {
    ElMessage.success(res.Msg || '添加成功');
    shiftShow.value = false;
    tempshiftShow.value = false;
    queryList();
  }
}

/** 保存分区修改 */
async function saveRegion() {
  if (!TreatmentRegionId.value) {
    ElMessage.warning('请选择分区后再保存！');
    return;
  }
  const TreatmentRegion = FqData.value.find((item) => item.Id === TreatmentRegionId.value)?.Name;
  const params = {
    Id: RegionVal.value?.Id,
    TreatmentRegion,
    TreatmentRegionId: TreatmentRegionId.value,
  };
  const res = await swsApi.swsPut('SchedulingManage/3015', params);
  if (res.Code === 200) {
    ElMessage.success(res.Msg || '分区修改成功');
    RegionShow.value = false;
    queryList();
  }
}

/** 呼叫患者 */
async function call(Id: string) {
  const res = await swsApi.swsPut('SchedulingManage/3009', { Id });
  if (res.Code === 200) {
    ElMessage.success(res.Msg || '呼叫成功');
  }
}

/** 更新透后体重 */
async function updatePostWeight(item: SignInPatient) {
  const params = {
    Id: item.PostPreTreatMessageId,
    PatientId: item.PatientId,
    PostWeight: item.PostWeight,
    DialysisId: item.DialysisId,
    UpdateOnly: 1,
  };
  const res = await swsApi.swsPost('DialysisRecordManage/1005', params);
  if (res.Code === 200) {
    ElMessage.success(res.Msg || '更新成功');
    queryList();
  }
}

/** 获取传染病临期列表 */
async function getCheckInfectionList() {
  checkInfectionList.value = [];
  if (!selectDay.value) return;
  const params = { CurrDateTime: formatDate(selectDay.value) };
  const res = await swsApi.swsGet('DialysisRecordManage/4023', params);
  if (res.Code === 200) {
    checkInfectionList.value = res.Data as InfectionDetail[];
  }
}

/** 获取传染病详情 */
async function clickPatientCheckInfection(patient: SignInPatient) {
  const params = { PatientId: patient.PatientId };
  const res = await swsApi.swsGet('DialysisRecordManage/4020', params);
  if (res.Code === 200) {
    infectionDetail.value = res.Data as InfectionDetail;
    infectionPatientName.value = patient.PatientName;
    showInfectionDetails.value = true;
  }
}

/** 打开确认方案弹窗 */
function Qrshow(
  id: string,
  CurrentState: number,
  PatientId: string,
  Date: string,
  PatientName: string,
  DialysisId: string,
  SignId: string,
  CardNum?: string
) {
  planData.id = id;
  planData.CurrentState = CurrentState;
  planData.PatientId = PatientId;
  planData.Date = Date;
  planData.PatientName = PatientName;
  planData.CardNum = CardNum || '';
  // 这里应该打开确认方案弹窗组件
  ElMessage.info('打开确认方案弹窗');
}

/** 开医嘱 */
function openOrder(PatientId: string, DialysisId: string, Id: string, PatientName: string) {
  orderData.patId = PatientId;
  orderData.DialysisId = DialysisId;
  orderData.signId = Id;
  orderData.PatientName = PatientName;
  orderShow.value = true;
}

/** 打开透析记录单 */
function handleTxjld(row: SignInPatient) {
  txjld_Item.value = row;
  txjld_show.value = true;
}

// ==================== 工具函数 ====================

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDateString(date: string | Date | null, fmt?: string): string {
  if (!date) return '';
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  if (fmt === 'yyyy-MM-dd HH:mm') {
    return `${y}-${m}-${day} ${h}:${min}`;
  }
  return `${y}-${m}-${day}`;
}

function getStatusTag(state: number) {
  return STATUS_TAG_MAP[state] || { label: '未知', type: 'info' as const };
}

function getXyText(row: SignInPatient): string {
  let xy = '';
  if (row.PostSystolicPressure) {
    xy = `${row.PostSystolicPressure} / ${row.PostDiastolicPressure}(mmHg)`;
  } else if (row.ObserveSystolicPressure) {
    xy = `${row.ObserveSystolicPressure} / ${row.ObserveDiastolicPressure}(mmHg)`;
  } else if (row.PreSystolicPressure) {
    xy = `${row.PreSystolicPressure} / ${row.PreDiastolicPressure}(mmHg)`;
  }
  return xy;
}

function getMText(row: SignInPatient): string {
  const IsShowNoWeightBasis = sessionStorage.getItem('IsShowNoWeightBasis') === '1';
  if (row.NoWeightBasis && IsShowNoWeightBasis) {
    return row.NoWeightBasis;
  }
  return `${row.CurrentBeforeDialysisWeight === 0 ? '/ ' : row.CurrentBeforeDialysisWeight}(Kg)`;
}

function getPressureText(systolic?: number, diastolic?: number): string {
  return systolic && diastolic ? `${systolic} / ${diastolic}(mmHg)` : '';
}

function showInfection(patient: SignInPatient): boolean {
  const detail = checkInfectionList.value.find((item) => item.PatientId === patient.PatientId);
  return !!(detail && detail.RemindType);
}

function infectionDetailColor(patient: SignInPatient): string {
  const detail = checkInfectionList.value.find((item) => item.PatientId === patient.PatientId);
  if (detail) {
    return detail.RemindType === 2 ? 'danger' : detail.RemindType === 1 ? 'warning' : 'info';
  }
  return 'info';
}

function calcProgress(startTime: string, endTime: string | null, expectedEndTime: string): number {
  const start = new Date(startTime).getTime();
  const expectedEnd = new Date(expectedEndTime).getTime();
  const end = endTime ? new Date(endTime).getTime() : 0;
  const now = Date.now();
  const expectedDuration = expectedEnd - start;

  if (now <= start) return 0;
  if (end && expectedEnd) {
    if (end < expectedEnd) {
      const actualDuration = end - start;
      return Math.floor((actualDuration / expectedDuration) * 100);
    } else {
      return 100;
    }
  }
  if (!end && expectedEnd) {
    const elapsedTime = now - start;
    return Math.min(Math.floor((elapsedTime / expectedDuration) * 100), 100);
  }
  return 0;
}

function getExpectedEndTime(row: SignInPatient): string {
  if (row.LoginTime) {
    const start = new Date(row.LoginTime).getTime();
    const duration = (row.TreatHour || 0) * 60 * 60 * 1000 + (row.TreatMin || 0) * 60 * 1000;
    return new Date(start + duration).toISOString().substring(0, 16);
  }
  return '';
}

function getProgressColor(endTime: string | null, expectedEndTime: string): string {
  const now = new Date();
  if (endTime) {
    const diff = Math.abs(new Date(endTime).getTime() - new Date(expectedEndTime).getTime()) / (1000 * 60);
    if (diff >= 30) return 'red';
    if (diff >= 15) return 'orange';
    if (diff > 5) return 'blue';
    return 'green';
  } else {
    const diff = (now.getTime() - new Date(expectedEndTime).getTime()) / (1000 * 60);
    return diff >= 30 ? 'red' : 'green';
  }
}

function progressTooltip(startTime: string, endTime: string | null, expectedEndTime: string): string {
  const fmt = 'yyyy-MM-dd HH:mm';
  const formatStartTime = formatDateString(startTime, fmt);
  const formatEndTime = formatDateString(endTime, fmt);
  const formatExpectedEndTime = formatDateString(expectedEndTime, fmt);
  return `上机时间: ${formatStartTime}\n下机时间: ${formatEndTime}\n预计下机时间: ${formatExpectedEndTime}`;
}

function diffMinutes(time1: string | Date, time2: string | Date): number {
  const t1 = new Date(time1).getTime();
  const t2 = new Date(time2).getTime();
  return Math.floor((t1 - t2) / (1000 * 60));
}

function rowClassName(row: SignInPatient): string {
  if (row.RejectPrescriptionDetails && row.RejectPrescriptionDetails.length > 0) {
    return 'table-reject-row';
  }
  return '';
}

// ==================== 事件处理 ====================

function handleSelectPatient(row: SignInPatient) {
  selectedPatientId.value = row.PatientId;
  selectedPatient.value = row;
}

function changeShift(row: SignInPatient) {
  rowValue.value = JSON.parse(JSON.stringify(row));
  shiftData.DialysisType = row.ActualDialysisType;
  shiftData.Shift = row.ActualShift;
  getBedNo(row);
  getTxqGlq(row);
  shiftShow.value = true;
  tempshiftShow.value = false;
}

function changeRegion(row: SignInPatient) {
  TreatmentRegionId.value = row.TreatmentRegionId;
  RegionVal.value = row;
  RegionShow.value = true;
}

function changeDryW(row: SignInPatient) {
  rowVal.value = row;
  CurrentDryWeight.value = row.CurrentDryWeight;
  changeShow.value = true;
  getHis();
}

function chooseShift(val: string) {
  shiftData.Shift = val;
  if (rowValue.value) {
    getBedNo(rowValue.value);
  }
}

function chooseDialysisType(val: string) {
  shiftData.DialysisType = val;
  if (rowValue.value) {
    getBedNo(rowValue.value);
    const typeId = txqDataNew.value.find((item) => item.Value === val)?.Id;
    getTxqGlq({ ...rowValue.value, DialysisTypeId: typeId } as SignInPatient, 1);
  }
}

function chooseBedNo(val: string) {
  const bed = bedNoArr.value.find((item) => item.EquipmentId === val);
  shiftData.SickbedNo = bed?.SickbedNo || '';
}

function showTempclick() {
  tempshiftShow.value = true;
  shiftData.Date = formatDate(new Date());
  shiftData.Shift = '';
  shiftData.DialysisType = '';
  shiftData.Dialyzer = '';
  shiftData.DialysisPerfusion = '';
  shiftData.SickbedNo = '';
  shiftData.EquipmentId = '';
  shiftShow.value = true;
}

function dayCg() {
  PatientShiftSet();
  queryList();
}

function choosePxType() {
  localStorage.setItem('PxType', PxType.value);
  queryList();
}

function choosemyShift() {
  if (myShift.value) {
    sessionStorage.setItem('myShift', myShift.value);
  }
  queryList();
}

function autoLaod() {
  if (loadQ.value) {
    if (qrT) clearInterval(qrT);
    loadQ.value = false;
    autoLaodC.value = 'default';
  } else {
    const t = (loadTime.value || 5) * 1000;
    qrT = setInterval(() => {
      queryList(false);
    }, t);
    loadQ.value = true;
    autoLaodC.value = 'primary';
  }
}

function shiftListType() {
  listType.value = listType.value === '表格' ? '卡片' : '表格';
}

function toPrintPrescription() {
  const shift = myShift.value;
  const date = formatDate(selectDay.value);
  const url = window.location.href.split('#')[0];
  const furl = `${url}#/print/prescription_execution_form_print/${date}/${shift}`;
  window.open(furl);
}

// ==================== 生命周期 ====================

onMounted(() => {
  // 初始化班次
  const hour = new Date().getHours();
  if (hour < 12) {
    myShift.value = sessionStorage.getItem('myShift') || '上午';
  } else {
    myShift.value = sessionStorage.getItem('myShift') || '下午';
  }

  // 加载排序方式
  if (localStorage.getItem('PxType')) {
    PxType.value = localStorage.getItem('PxType') || '1';
  }

  loadMenu();
  queryList();
});

onUnmounted(() => {
  if (qrT) clearInterval(qrT);
});
</script>

<template>
  <Page title="患者签到">
    <div class="sign-in-container">
      <!-- 筛选栏 -->
      <div class="filter-bar">
        <ElInput
          v-model="patNameSearchVal"
          placeholder="患者姓名筛选"
          clearable
          style="width: 110px"
          class="m-r-10"
        />
        <ElDatePicker
          v-model="selectDay"
          type="date"
          placeholder="请选择"
          style="width: 115px"
          class="m-r-10"
          @change="dayCg"
        />
        <ElSelect v-model="PxType" placeholder="请选择排序方式" @change="choosePxType" class="w-100 m-r-10">
          <ElOption v-for="item in SORT_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
        </ElSelect>
        <ElSelect v-model="myShift" @change="choosemyShift" class="w-80 m-r-10">
          <ElOption value="全部" label="全部" />
          <ElOption v-for="(option, index) in bcData" :key="index" :value="option.ShiftName" :label="option.ShiftName" />
        </ElSelect>
        <ElSelect v-model="myFq" @change="queryList" class="w-80 m-r-10">
          <ElOption value="全部" label="全部" />
          <ElOption v-for="(item, index) in FqData" :key="item.Id" :value="item.Name" :label="item.Name" />
        </ElSelect>
        <ElSelect v-model="TreatmentRegionDetail" @change="queryList" class="w-120 m-r-10" style="width: 120px">
          <ElOption value="全部" label="全部子分区" />
          <ElOption v-for="(item, index) in FqChildData" :key="item.Id" :value="item.Id" :label="item.Name" />
        </ElSelect>
        <ElSelect v-model="signStatus" class="w-80 m-r-10">
          <ElOption v-for="item in SIGN_STATUS_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
        </ElSelect>
        <ElSelect v-model="PatientType" class="w-80 m-r-10" @change="queryList">
          <ElOption value="全部" label="全部" />
          <ElOption v-for="(item, index) in PatientTypeList" :key="item.Id" :value="item.Id" :label="item.Name" />
        </ElSelect>
        <ElButton type="info" class="m-r-10" @click="queryList" :loading="loading">查询</ElButton>
        <ElButton type="success" class="m-r-10" @click="querySign" :loading="loading2">生成</ElButton>
        <ElButton type="primary" class="m-r-10" @click="showTempclick">临时签到</ElButton>
        <ElButton class="m-r-10" @click="toPrintPrescription">打印处方执行单</ElButton>
        <ElButton type="danger" class="m-r-10" @click="DeleteAll">删除</ElButton>
        <div style="display: inline-block">
          <ElInputNumber class="m-r-10" :min="1" style="width: 50px; margin-right: 0" v-model="loadTime" />
          <ElButton :type="autoLaodC" @click="autoLaod">定时刷新</ElButton>
        </div>
        <h5 style="display: inline-block; vertical-align: middle; margin-left: 10px">
          统计：<span style="color: green">{{ stats.signed }}</span> /
          <span style="color: blue">{{ stats.total }}</span>
        </h5>
        <div class="list-type-tag" @click="shiftListType">{{ listType === '表格' ? '卡片' : '表格' }}</div>
      </div>

      <!-- 数据表格 -->
      <div v-if="listType === '表格'" v-loading="loading" class="table-container">
        <ElTable :data="filterTabData" style="width: 100%" height="calc(100vh - 280px)" border :row-class-name="rowClassName">
          <ElTableColumn prop="PatientName" label="姓名" width="120" fixed="left">
            <template #default="{ row }">
              <div style="display: flex; align-items: center; flex-direction: column">
                <div style="display: flex; justify-content: center; align-items: center">
                  <span
                    @click="handleTxjld(row)"
                    :style="{
                      background: row.DefineColor ? row.DefineColor : '',
                      padding: row.IsFocus || row.DefineColor ? '0 4px' : 0,
                      cursor: 'pointer',
                    }"
                  >
                    {{ row.PatientName }}
                  </span>
                  <ElTag
                    v-if="showInfection(row)"
                    style="cursor: pointer; margin-left: 4px"
                    :type="infectionDetailColor(row)"
                    size="small"
                    @click="clickPatientCheckInfection(row)"
                  >
                    传
                  </ElTag>
                </div>
                <ElButton v-if="pbshow" type="primary" size="small" style="margin-top: 4px" @click="call(row.Id)">
                  呼叫
                </ElButton>
              </div>
            </template>
          </ElTableColumn>
          <ElTableColumn prop="SickbedNo" label="床号" width="80">
            <template #default="{ row }">
              <span style="color: #ff0000; font-weight: 600">{{ row.SickbedNo }}</span>
            </template>
          </ElTableColumn>
          <ElTableColumn prop="EquipmentSerialNumber" label="机器编号" width="100" />
          <ElTableColumn prop="TreatmentRegion" label="分区" width="80">
            <template #default="{ row }">
              <span style="cursor: pointer; color: #515a6e" @click="changeRegion(row)">{{ row.TreatmentRegion }}</span>
            </template>
          </ElTableColumn>
          <ElTableColumn prop="ActualShift" label="班次" width="80">
            <template #default="{ row }">
              <span style="cursor: pointer; color: #515a6e" @click="changeShift(row)">{{ row.ActualShift }}</span>
            </template>
          </ElTableColumn>
          <ElTableColumn prop="ActualDialysisType" label="治疗模式" width="100">
            <template #default="{ row }">
              <span style="cursor: pointer" @click="changeShift(row)">{{ row.ActualDialysisType }}</span>
            </template>
          </ElTableColumn>
          <ElTableColumn prop="ActualDialyzer" label="透析器" width="100">
            <template #default="{ row }">
              <span style="cursor: pointer" @click="changeShift(row)">{{ row.ActualDialyzer }}</span>
            </template>
          </ElTableColumn>
          <ElTableColumn prop="ActualDialysisPerfusion" label="灌流器" width="100">
            <template #default="{ row }">
              <span v-if="row.ActualDialysisPerfusion !== '不使用'" style="cursor: pointer" @click="changeShift(row)">
                {{ row.ActualDialysisPerfusion }}
              </span>
            </template>
          </ElTableColumn>
          <ElTableColumn prop="formatAnticoagulants" label="抗凝剂" width="120">
            <template #default="{ row }">
              <div v-for="item in row.formatAnticoagulants" :key="item">{{ item }}</div>
            </template>
          </ElTableColumn>
          <ElTableColumn prop="CurrentDryWeight" label="干体重" width="80">
            <template #default="{ row }">
              <span style="cursor: pointer; color: #e6a23c; font-weight: 600" @click="changeDryW(row)">
                {{ row.CurrentDryWeight }}
              </span>
            </template>
          </ElTableColumn>
          <ElTableColumn label="本次透前称重&最新血压" min-width="180">
            <template #default="{ row }">
              <div v-if="pbshow && row.CurrentState >= 3" style="min-width: 156px">
                <div v-if="row.CurrentState < 4" style="display: flex; align-items: center; gap: 8px">
                  <ElInput v-model="row.CurrentBeforeDialysisWeight" style="width: 80px" />
                  <ElButton type="success" size="small" @click="SignClick(row)">签到</ElButton>
                  <span style="font-size: 11px">{{ getXyText(row) }}</span>
                </div>
                <div v-else-if="row.CurrentState === 2">
                  <div v-if="row.NoWeightBasis && sessionStorage.getItem('IsShowNoWeightBasis') === '1'">
                    <ElInput v-model="row.NoWeightBasis" type="textarea" readonly style="width: 120px" />
                    <p style="font-size: 11px">{{ getXyText(row) }}</p>
                  </div>
                  <div v-else-if="row.CurrentBeforeDialysisWeight">
                    <ElInput v-model="row.CurrentBeforeDialysisWeight" readonly style="width: 80px" />
                    <p style="font-size: 11px">{{ getXyText(row) }}</p>
                  </div>
                </div>
                <div v-else>
                  <ElTag type="success" size="small">已签到</ElTag>
                  <span style="margin-left: 8px">{{ getMText(row) }}</span>
                  <span style="margin-left: 8px; font-size: 11px">{{ getXyText(row) }}</span>
                </div>
              </div>
            </template>
          </ElTableColumn>
          <ElTableColumn label="透后体重&血压" min-width="180">
            <template #default="{ row }">
              <div v-if="row.PostPreTreatMessageId" style="display: flex; align-items: center; gap: 8px">
                <ElInput v-model="row.displayPostWeight" style="width: 80px" />
                <ElButton type="primary" size="small" @click="updatePostWeight(row)">更新</ElButton>
                <span style="font-size: 11px">
                  {{ getPressureText(row.PostSystolicPressure, row.PostDiastolicPressure) }}
                </span>
              </div>
            </template>
          </ElTableColumn>
          <ElTableColumn prop="UltraFilRate" label="超滤量" width="100">
            <template #default="{ row }">
              {{ row.UltraFilRate ? row.UltraFilRate + 'ml' : '' }}
            </template>
          </ElTableColumn>
          <ElTableColumn prop="SchedulingUserName" label="排班" width="80" />
          <ElTableColumn prop="SchedulingBedUserName" label="排床" width="80" />
          <ElTableColumn label="操作" width="140" fixed="right">
            <template #default="{ row }">
              <div v-if="pbshow">
                <template v-if="row.CurrentState === 2">
                  <ElButton type="danger" size="small" @click="deleteQd(row.Id)">删除</ElButton>
                </template>
                <template v-else-if="row.CurrentState >= 4">
                  <ElButton
                    type="success"
                    size="small"
                    @click="
                      Qrshow(
                        row.Id,
                        row.CurrentState,
                        row.PatientId,
                        row.Date,
                        row.PatientName,
                        row.DialysisId,
                        row.SignId
                      )
                    "
                  >
                    确认
                  </ElButton>
                  <ElButton type="primary" size="small" @click="openOrder(row.PatientId, row.DialysisId, row.Id, row.PatientName)">
                    开医嘱
                  </ElButton>
                </template>
              </div>
              <ElTag v-else type="danger" size="small">已过期</ElTag>
            </template>
          </ElTableColumn>
        </ElTable>
      </div>

      <!-- 卡片视图 -->
      <div v-else v-loading="loading" class="card-container">
        <div v-for="row in filterTabData" :key="row.Id" class="patient-card">
          <div class="card-header">
            <div class="patient-info">
              <span class="patient-name" @click="handleTxjld(row)" :style="{ background: row.DefineColor ? row.DefineColor : '' }">{{ row.PatientName }}</span>
              <ElTag v-if="showInfection(row)" :type="infectionDetailColor(row)" size="small" @click="clickPatientCheckInfection(row)">传</ElTag>
              <span class="patient-gender">{{ row.Sex }} / {{ row.Age }}岁</span>
            </div>
            <div class="status-indicator">
              <div
                class="status-dot"
                :style="{ background: row.CurrentState >= 4 ? '#17bb5e' : '#909399' }"
              ></div>
              <span :style="{ color: row.CurrentState >= 4 ? '#17bb5e' : '#909399' }">
                {{ row.CurrentState >= 4 ? '已签到' : '未签到' }}
              </span>
            </div>
          </div>
          <div class="card-body">
            <div class="info-row">
              <span class="bed-no" v-if="row.SickbedNo">{{ row.SickbedNo }}</span>
              <span v-if="row.SickbedNo && row.EquipmentSerialNumber"> / </span>
              <span v-if="row.EquipmentSerialNumber">{{ row.EquipmentSerialNumber }}</span>
            </div>
            <div class="info-row">
              <span class="region" @click="changeRegion(row)">{{ row.TreatmentRegion || '-' }}</span>
              <span> / </span>
              <span class="shift" @click="changeShift(row)">{{ row.ActualShift || '-' }}</span>
            </div>
            <div class="dialysis-tags">
              <span class="tag" v-if="row.ActualDialysisType">{{ row.ActualDialysisType }}</span>
              <span class="tag" v-if="row.ActualDialyzer" @click="changeShift(row)">{{ row.ActualDialyzer }}</span>
              <span class="tag" v-if="row.ActualDialysisPerfusion && row.ActualDialysisPerfusion !== '不使用'" @click="changeShift(row)">
                {{ row.ActualDialysisPerfusion }}
              </span>
            </div>
            <div class="anticoagulants" v-if="row.formatAnticoagulants && row.formatAnticoagulants.length">
              抗凝剂：<span v-for="(item, index) in row.formatAnticoagulants" :key="index">{{ item }}{{ index === row.formatAnticoagulants.length - 1 ? '' : '、' }}</span>
            </div>
            <div class="weight-row">
              <div class="dry-weight">
                干体重：<span class="GTZ" @click="changeDryW(row)">{{ row.CurrentDryWeight }} Kg</span>
              </div>
              <div class="ultra-fil" v-if="row.UltraFilRate">
                超滤量：{{ row.UltraFilRate }}ml
              </div>
            </div>
            <ElDivider />
            <div class="pre-dialysis">
              <div v-if="((IsCheckInAllowedWithoutBed && row.CurrentState < 3) || row.CurrentState === 3) && pbshow">
                <div style="display: flex; align-items: center; gap: 8px">
                  <span>透前称重：</span>
                  <ElInput v-model="row.CurrentBeforeDialysisWeight" style="width: 80px" />
                  <ElButton type="success" size="small" @click="SignClick(row)">签到</ElButton>
                </div>
                <div style="margin-top: 4px">透前血压：{{ getXyText(row) }}</div>
              </div>
              <div v-else-if="row.CurrentState === 2">
                <div v-if="row.NoWeightBasis && sessionStorage.getItem('IsShowNoWeightBasis') === '1'">
                  <ElInput v-model="row.NoWeightBasis" type="textarea" readonly />
                  <div>透前血压：{{ getXyText(row) }}</div>
                </div>
                <div v-else-if="row.CurrentBeforeDialysisWeight">
                  <ElInput v-model="row.CurrentBeforeDialysisWeight" readonly style="width: 80px" />
                  <div>透前血压：{{ getXyText(row) }}</div>
                </div>
              </div>
              <div v-else-if="row.CurrentBeforeDialysisWeight != null || row.NoWeightBasis">
                <div>
                  透前称重：{{ getMText(row) }}
                  <span style="margin-left: 16px">透前血压：{{ getXyText(row) }}</span>
                </div>
              </div>
            </div>
            <div class="post-dialysis" v-if="row.PostPreTreatMessageId">
              <ElDivider />
              <div style="display: flex; align-items: center; gap: 8px">
                <span>{{ IsSubtractClothingWeight ? '透后称重' : '透后体重' }}：</span>
                <ElInput v-model="row.displayPostWeight" style="width: 80px" />
                <ElButton type="primary" size="small" @click="updatePostWeight(row)">更新</ElButton>
                <span>透后血压：{{ getPressureText(row.PostSystolicPressure, row.PostDiastolicPressure) }}</span>
              </div>
            </div>
            <div class="progress-section" v-if="row.LoginTime && (getExpectedEndTime(row) || row.LeftTime)">
              <ElDivider />
              <div class="progress-info">
                <ElProgress
                  :percentage="calcProgress(row.LoginTime, row.LeftTime, getExpectedEndTime(row))"
                  :status="getProgressColor(row.LeftTime, getExpectedEndTime(row)) === 'red' ? 'exception' : 'success'"
                  :stroke-width="12"
                  :text-inside="true"
                />
                <div class="time-info">
                  <span>{{ formatDateString(row.LoginTime, 'HH:mm') }}</span>
                  <span> / </span>
                  <span>{{ formatDateString(row.LeftTime || getExpectedEndTime(row), 'HH:mm') }}</span>
                </div>
              </div>
            </div>
          </div>
          <div class="card-actions">
            <ElButton v-if="pbshow" type="primary" size="small" @click="call(row.Id)">呼叫</ElButton>
            <template v-if="pbshow">
              <template v-if="row.CurrentState === 2">
                <ElButton type="danger" size="small" @click="deleteQd(row.Id)">删除</ElButton>
              </template>
              <template v-else-if="row.CurrentState >= 4">
                <ElButton
                  type="success"
                  size="small"
                  @click="Qrshow(row.Id, row.CurrentState, row.PatientId, row.Date, row.PatientName, row.DialysisId, row.SignId)"
                >
                  确认
                </ElButton>
                <ElButton type="primary" size="small" @click="openOrder(row.PatientId, row.DialysisId, row.Id, row.PatientName)">
                  开医嘱
                </ElButton>
              </template>
            </template>
            <ElTag v-else type="danger" size="small">已过期</ElTag>
          </div>
        </div>
        <ElEmpty v-if="filterTabData.length === 0" description="暂无数据" />
      </div>

      <!-- 干体重调整弹窗 -->
      <ElDialog
        v-model="changeShow"
        :title="`[ ${rowVal?.PatientName} ] 本次干体重调整`"
        width="300px"
      >
        <div>
          <ElInputNumber v-model="CurrentDryWeight" :min="1" style="width: 100%" />
        </div>
        <div class="his-list">
          <div>历史记录:</div>
          <div style="margin-left: 10px">
            <div v-for="(item, index) in his_list" :key="index">
              <span style="display: inline-block; width: 48px">{{ item.DryWeight }}Kg</span>
              <span style="margin-left: 40px; color: gray">
                {{ item.DryWeightSetDate && formatDateString(item.DryWeightSetDate, 'yyyy-MM-dd hh:mm:ss') }}
              </span>
            </div>
          </div>
        </div>
        <template #footer>
          <ElButton type="primary" @click="saveWeight">修改</ElButton>
          <ElButton @click="changeShow = false">取消</ElButton>
        </template>
      </ElDialog>

      <!-- 排班弹窗 -->
      <ElDialog
        v-model="shiftShow"
        :title="tempshiftShow ? `临时排班【${rowValue?.PatientName} ${rowValue?.Age}岁】` : `修改排班信息【${rowValue?.PatientName} ${rowValue?.Age}岁】`"
        width="900px"
      >
        <ElForm :model="shiftData" label-width="90px">
          <div style="display: flex; flex-wrap: wrap; gap: 16px">
            <ElFormItem label="日期" v-if="tempshiftShow" style="width: 280px">
              <ElDatePicker v-model="shiftData.Date" type="date" placeholder="请选择" style="width: 100%" />
            </ElFormItem>
            <ElFormItem label="班次" required style="width: 280px">
              <ElSelect v-model="shiftData.Shift" @change="chooseShift" style="width: 100%">
                <ElOption v-for="(option, index) in bcData" :key="index" :value="option.ShiftName" :label="option.ShiftName" />
              </ElSelect>
            </ElFormItem>
            <ElFormItem label="透析模式" required style="width: 280px">
              <ElSelect v-model="shiftData.DialysisType" @change="chooseDialysisType" style="width: 100%">
                <ElOption v-for="(option, index) in txqDataNew" :key="index" :value="option.Value" :label="option.Value" />
              </ElSelect>
            </ElFormItem>
            <ElFormItem label="透析器" required style="width: 280px">
              <ElSelect v-model="shiftData.Dialyzer" style="width: 100%">
                <ElOption v-for="(item, index) in DialyzerArr" :key="index" :value="item.Name || item.Value" :label="item.Name || item.Value" />
              </ElSelect>
            </ElFormItem>
            <ElFormItem label="灌流器" required style="width: 280px">
              <ElSelect v-model="shiftData.DialysisPerfusion" style="width: 100%">
                <ElOption v-for="(item, index) in DialysisPerfusionArr" :key="index" :value="item.Value" :label="item.Value" />
              </ElSelect>
            </ElFormItem>
            <ElFormItem label="床位" style="width: 280px">
              <ElSelect v-model="shiftData.EquipmentId" @change="chooseBedNo" style="width: 100%">
                <ElOption v-for="(option, index) in bedNoArr" :key="index" :value="option.EquipmentId" :label="`(${option.TreatmentRegion})${option.SickbedNo}`" />
              </ElSelect>
            </ElFormItem>
          </div>
        </ElForm>
        <template #footer>
          <ElButton type="primary" @click="saveShift">保存</ElButton>
          <ElButton @click="shiftShow = false">取消</ElButton>
        </template>
      </ElDialog>

      <!-- 分区修改弹窗 -->
      <ElDialog
        v-model="RegionShow"
        :title="`修改患者分区【${RegionVal?.PatientName}】`"
        width="400px"
      >
        <div>
          <p style="font-size: 12px; color: red; margin-bottom: 10px">提示：此次修改的分区仅作用于当前次透析。</p>
          <ElSelect v-model="TreatmentRegionId" style="width: 100%">
            <ElOption v-for="item in FqData" :key="item.Id" :value="item.Id" :label="item.Name" />
          </ElSelect>
        </div>
        <template #footer>
          <ElButton type="primary" @click="saveRegion">保存</ElButton>
          <ElButton @click="RegionShow = false">取消</ElButton>
        </template>
      </ElDialog>

      <!-- 未测体重签到弹窗 -->
      <ElDialog
        v-model="NoWeightShow"
        :title="`未测体重签到【${NoWeightWhyVal?.PatientName}】`"
        width="400px"
      >
        <div>
          <p style="font-size: 18px; color: red; margin-bottom: 10px">！提示：输入的体重为0，即表示患者透前体重不详</p>
          <ElInput v-model="NoWeightBasis" type="textarea" placeholder="请输入未测体重原因" :rows="2" />
        </div>
        <template #footer>
          <ElButton type="primary" @click="saveNoWeightBasis">保存并签到</ElButton>
          <ElButton @click="NoWeightShow = false">取消</ElButton>
        </template>
      </ElDialog>

      <!-- 传染病详情弹窗 -->
      <ElDialog
        v-model="showInfectionDetails"
        :title="`传染病明细 ${infectionPatientName}`"
        width="680px"
      >
        <ElForm label-width="120px">
          <div style="display: flex; flex-wrap: wrap">
            <ElFormItem label="检验项目：" style="width: 50%">{{ infectionDetail.CategoryDisplayName }}</ElFormItem>
            <ElFormItem label="距到期日天数：" style="width: 50%">{{ infectionDetail.NextCheckDays }}</ElFormItem>
            <ElFormItem label="上次检查时间：" style="width: 50%">{{ infectionDetail.newCheckDate }}</ElFormItem>
            <ElFormItem label="本次应检查时间：" style="width: 50%">{{ infectionDetail.NextCheckDate }}</ElFormItem>
          </div>
        </ElForm>
        <template #footer>
          <ElButton @click="showInfectionDetails = false">取消</ElButton>
        </template>
      </ElDialog>

      <!-- 透析记录单弹窗 -->
      <ElDialog
        v-model="txjld_show"
        :title="`【${txjld_Item.PatientName}】的透析记录单`"
        width="1300px"
        :footer="false"
      >
        <div>透析记录单组件</div>
      </ElDialog>

      <!-- 开医嘱弹窗 -->
      <ElDialog
        v-model="orderShow"
        :title="`开立医嘱（${orderData.PatientName || '/'}）`"
        width="1300px"
      >
        <div>开医嘱组件</div>
        <template #footer>
          <ElButton @click="orderShow = false">关闭</ElButton>
        </template>
      </ElDialog>
    </div>
  </Page>
</template>

<style scoped>
.sign-in-container {
  padding: 16px;
}

.filter-bar {
  margin-bottom: 16px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.m-r-10 {
  margin-right: 10px;
}

.w-80 {
  width: 80px;
}

.w-100 {
  width: 100px;
}

.w-120 {
  width: 120px;
}

.list-type-tag {
  display: inline-block;
  padding: 4px 12px;
  background: #f0f2f5;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  margin-left: 10px;
}

.list-type-tag:hover {
  background: #e4e7ed;
}

.table-container {
  background: #fff;
  border-radius: 4px;
}

.card-container {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  padding: 16px;
}

.patient-card {
  width: calc(33.333% - 11px);
  min-width: 320px;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 16px;
  position: relative;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.patient-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.patient-name {
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  padding: 0 4px;
}

.patient-gender {
  color: #606266;
  font-size: 14px;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
}

.status-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
}

.card-body {
  font-size: 14px;
}

.info-row {
  margin-bottom: 8px;
}

.bed-no {
  color: #ff0000;
  font-weight: 600;
}

.region, .shift {
  cursor: pointer;
  font-weight: 600;
}

.dialysis-tags {
  display: flex;
  gap: 8px;
  margin: 8px 0;
  flex-wrap: wrap;
}

.tag {
  padding: 2px 8px;
  background: #f0f2f5;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
}

.anticoagulants {
  margin: 8px 0;
}

.weight-row {
  display: flex;
  gap: 16px;
  margin: 8px 0;
}

.dry-weight .GTZ {
  cursor: pointer;
  color: #e6a23c;
  font-weight: 600;
}

.pre-dialysis, .post-dialysis {
  margin: 8px 0;
}

.progress-section {
  margin-top: 8px;
}

.progress-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.time-info {
  color: #606266;
  font-size: 12px;
  white-space: nowrap;
}

.card-actions {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  gap: 8px;
}

.his-list {
  margin-top: 16px;
  max-height: 200px;
  overflow-y: auto;
}

:deep(.table-reject-row) {
  background-color: #fff0f0 !important;
}

@media (max-width: 1440px) {
  .patient-card {
    width: calc(50% - 8px);
  }
}

@media (max-width: 768px) {
  .patient-card {
    width: 100%;
  }
}
</style>
