<template>
  <div class="paibanx">
    <!-- 顶部工具栏 -->
    <div style="display: flex">
      <div style="display: flex; justify-content: flex-start; align-items: center">
        <ElButton type="info" @click="exportTable">{{ $t('导出排班表') }}</ElButton>
        <ElButton type="success" v-if="HZPB_AUTO" v-show="now == -1" @click="autoPb" :loading="autoLoading">{{ $t('自动排班') }}</ElButton>
        <ElButton type="success" v-if="HZPB_AUTO_P" v-show="now != -1" @click="autoSinglePb" :loading="autoLoading">{{ $t('个人排班') }}</ElButton>
        <ElButton type="primary" @click="multiChangeModal = true" v-if="$config.isvip()" class="now_vip">{{ $t('批量修改透析器') }}/{{ $t('灌流器') }}</ElButton>
        <ElButton type="primary" :loading="autoLoading" :disabled="CycleValue == 0 && currentWeekIndex === 0" @click="loadDataPrev">{{ $t('上一周期') }}</ElButton>
        <ElButton type="primary" :loading="autoLoading" @click="loadDataNext">{{ $t('下一周期') }}</ElButton>
        <ElButton type="danger" v-if="HZPB_DELETE_ALL" v-show="now == -1" @click="deleteData" :loading="autoLoading">{{ $t('删除全部排班') }}</ElButton>
        <ElButton type="danger" v-if="HZPB_DELETE_P" v-show="now != -1" @click="deleteData" :loading="autoLoading">{{ $t('删除个人排班') }}</ElButton>
        <ElButton type="info" @click="queryList" v-if="$config.isvip()" class="now_vip">{{ $t('根据时间段查询') }}</ElButton>
      </div>
      <div style="margin-left: auto;display: flex; justify-content: flex-start; align-items: center">
        <ElCheckbox v-model="showDialyzer">{{ $t('显示透析器') }}</ElCheckbox>
        <ElDatePicker type="date" style="width: 150px" v-model="sdate" @change="selectSearchDate" :placeholder="$t('请选择日期')"></ElDatePicker>
        <ElButton type="primary" :loading="searchLoading" @click="searchSch">{{ $t('查询') }}</ElButton>
        <ElButton type="success" v-if="HZQD_NEW" @click="querySign" :loading="loading2">{{ $t('生成签到表') }}</ElButton>
        <ElButton type="info" @click="goBed">{{ $t('去排床') }}</ElButton>
        <ElButton type="primary" @click="lookResidue" v-show="now != -1" v-if="$config.isvip()" class="now_vip">{{ $t('耗材剩余情况') }}</ElButton>
      </div>
    </div>

    <!-- 排班表格 -->
    <div class="ftablex">
      <table :class="{tabled:1,single:now!=-1}" id="pbTable" cellpadding="0" cellspacing="0">
        <thead class="thead">
          <tr :class="{fshow:now!=-1}">
            <th class="test1" style="width: 40px">{{ $t('序号') }}</th>
            <th class="test2" style="width: 80px">{{ $t('姓名') }}</th>
            <th v-for="item in tableHead" :colspan="item.colspan" :key="item.date">
              <p v-html="item.date"></p>
            </th>
          </tr>
          <tr>
            <th class="test1" style="width: 40px"></th>
            <th class="test2" style="width: 80px"></th>
            <th v-for="item in tableHeadWithShift" :key="item.date + item.shift">{{ item.shift }}</th>
          </tr>
        </thead>
        <tbody ref="viewBox" id="dass">
          <tr v-for="(item,index) in filterData" :key="index" style="position: relative;">
            <td class="test1" style="text-align: center;width: 40px">{{ item.No }}</td>
            <td class="test2" style="text-align: center;width: 80px" @click="clickPat(item.PatientId)">{{ item.PatientName }}</td>
            <td
              v-for="headItem in tableHeadWithShift"
              :class="{ disabledTd:pbTdstatus(item[`week_content_${headItem.index}`]) != 1 }"
              :style="pbTdstatus(item[`week_content_${headItem.index}`]) != 1 ? '' : `background: ${dialysisColorMap(getFormatTdDialysisType(item, `week_content_${headItem.index}_${headItem.shift}`))}`"
              @click="onClickPatientShift(item, headItem.index, headItem.shift)"
            >
              <template v-if="item.cycleShiftMap && item.cycleShiftMap[`week_content_${headItem.index}_${headItem.shift}`]">
                <div>{{ item.cycleShiftMap[`week_content_${headItem.index}_${headItem.shift}`].dialysisType }}</div>
                <div v-show="showDialyzer">{{item.cycleShiftMap[`week_content_${headItem.index}_${headItem.shift}`].dialyzer }}</div>
              </template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 批量修改透析器/灌流器弹窗 -->
    <ElDialog v-model="multiChangeModal" width="800" :draggable="true" :title="$t('批量修改透析器')+'/'+ $t('灌流器')">
      <ElForm ref="multiChangeFormRef" :model="multiChangeForm" :rules="multiChangeFormRule" label-width="80px">
        <ElRow>
          <ElCol :span="8">
            <ElFormItem :label="$t('修改类型')" prop="FieldName">
              <ElSelect v-model="multiChangeForm.FieldName" @change="changeMultiType">
                <ElOption v-for="item in changeTypeList" :value="item.Key" :key="item.Key">{{ item.Name }}</ElOption>
              </ElSelect>
            </ElFormItem>
          </ElCol>
          <ElCol :span="16">
            <ElFormItem :label="$t('选择患者')" prop="selectedPatientIds">
              <ElSelect filterable multiple v-model="multiChangeForm.selectedPatientIds" @change="changeHospitals">
                <ElOption value="0">{{ $t('全部') }}</ElOption>
                <ElOption v-for="item in patientList" :value="item.Id" :key="item.Id">{{ item.Name }}</ElOption>
              </ElSelect>
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem :label="$t('旧值')" prop="OldValue">
              <ElSelect v-model="multiChangeForm.OldValue" :placeholder="$t('请选择旧值')">
                <ElOption v-for="ff in autoChangeList" :value="ff.Name" :key="ff.Name">{{ ff.Name }}</ElOption>
              </ElSelect>
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem :label="$t('新值')" prop="NewValue">
              <ElSelect v-model="multiChangeForm.NewValue" :placeholder="$t('请选择新值')">
                <ElOption v-for="ff in autoChangeList" :value="ff.Name" :key="ff.Name">{{ ff.Name }}</ElOption>
              </ElSelect>
            </ElFormItem>
          </ElCol>
        </ElRow>
        <ElRow>
          <ElCol :span="12">
            <ElFormItem :label="$t('时间段')">
              <ElDatePicker type="daterange" v-model="multiChangeForm.TimeRange" @change="changeTimeRange" :placeholder="$t('请选择日期范围')" style="width: 100%;" />
            </ElFormItem>
          </ElCol>
        </ElRow>
      </ElForm>
      <template #footer>
        <ElButton type="primary" @click="multiChangeDialysis" :loading="multiSaveLoading">{{ $t('确定') }}</ElButton>
        <ElButton @click="multiChangeModal = false; multiChangeFormRef?.resetFields();">{{ $t('取消') }}</ElButton>
      </template>
    </ElDialog>

    <!-- 患者排班弹窗 -->
    <ElDialog v-model="pbMoadl" :title="$t('患者排班') + ' ' + patName + '/' + patDate" width="600">
      <div>
        <ElRow style="margin-top: 20px">
          <ElForm :model="pdData" label-position="top">
            <ElCol :span="12" style="padding: 0 8px">
              <ElFormItem :label="$t('班次')">
                <ElSelect v-model="pdData.Shift">
                  <ElOption v-for="(option, index) in bcData" :value="option.ShiftName" :key="index">{{ option.ShiftName }}</ElOption>
                </ElSelect>
              </ElFormItem>
              <ElFormItem :label="$t('透析器')">
                <ElSelect v-model="pdData.Dialyzer">
                  <ElOption v-for="(option, index) in zlmsData" :value="option.Name" :key="index">{{ option.Name }}</ElOption>
                </ElSelect>
              </ElFormItem>
            </ElCol>
            <ElCol :span="12" style="padding: 0 8px">
              <ElFormItem :label="$t('治疗模式')">
                <ElSelect v-model="pdData.DialysisType" @change="DialysisTypeMd">
                  <ElOption v-for="(option, index) in filterTxqDataNew" :value="option.Value" :key="index">{{ option.Name }}</ElOption>
                </ElSelect>
              </ElFormItem>
              <ElFormItem v-if="pdData.DialysisType && pdData.DialysisType.includes('HP')" :label="$t('灌流器')">
                <ElSelect v-model="pdData.DialysisPerfusion">
                  <ElOption v-for="(option, index) in glqDataNew" :value="option.Value" :key="index">{{ option.Name }}</ElOption>
                </ElSelect>
              </ElFormItem>
            </ElCol>
            <ElCol :span="12" style="padding: 0 8px">
              <ElFormItem :label="$t('患者类型')">
                <ElSelect v-model="pdData.PatientType">
                  <ElOption v-for="(option, index) in PatientTypeList" :value="option.Id" :key="index">{{ option.Name }}</ElOption>
                </ElSelect>
              </ElFormItem>
            </ElCol>
          </ElForm>
        </ElRow>
      </div>
      <template #footer>
        <ElButton type="primary" @click="addPb" :loading="submitLoading">{{ $t('提交') }}</ElButton>
        <ElButton @click="pbMoadl = false">{{ $t('取消') }}</ElButton>
        <ElButton type="danger" style="margin-right: 100px" @click="delPb" v-if="pdData.DialysisPerfusion" :loading="deleteLoading">{{ $t('删除') }}</ElButton>
      </template>
    </ElDialog>

    <!-- 重新排班弹窗 -->
    <ElDialog v-model="reschedulingModel" :title="$t('重新排班')" width="800" @close="reschedulingCancel">
      <div>
        <ElRow style="margin-top: 20px">
          <ElForm :model="reschedulingData" label-position="top" :rules="reschedulingRule">
            <ElCol :span="24" style="padding: 0 8px">
              <ElFormItem :label="$t('日期(多选)')">
                <ElDatePicker v-model="reschedulingData.DateList" type="dates" @change="changeDate" class="w-100"></ElDatePicker>
              </ElFormItem>
            </ElCol>
            <ElCol :span="16" style="padding: 0 8px">
              <ElFormItem :label="$t('选择患者')" prop="selectedPatientIds">
                <ElSelect filterable multiple v-model="reschedulingData.selectedPatientIds" @change="changeAllSelect">
                  <ElOption value="0">{{ $t('全部') }}</ElOption>
                  <ElOption v-for="item in patientList" :value="item.Id" :key="item.Id">{{ item.Name }}</ElOption>
                </ElSelect>
              </ElFormItem>
            </ElCol>
            <ElCol :span="8" style="padding: 0 8px">
              <ElFormItem :label="$t('班次')">
                <ElSelect v-model="reschedulingData.Shift">
                  <ElOption v-for="(option, index) in allShift" :value="option.Name" :key="index">{{ option.Name }}</ElOption>
                </ElSelect>
              </ElFormItem>
            </ElCol>
            <ElCol :span="8" style="padding: 0 8px">
              <ElFormItem :label="$t('治疗模式')">
                <ElSelect v-model="pdData.DialysisType" @change="DialysisTypeMd">
                  <ElOption v-for="(option, index) in txqDataNew" :value="option.Value" :key="index">{{ option.Name }}</ElOption>
                </ElSelect>
              </ElFormItem>
            </ElCol>
            <ElCol :span="8" style="padding: 0 8px">
              <ElFormItem :label="$t('透析器')">
                <ElSelect v-model="pdData.Dialyzer">
                  <ElOption v-for="(option, index) in zlmsData" :value="option.Name" :key="index">{{ option.Name }}</ElOption>
                </ElSelect>
              </ElFormItem>
            </ElCol>
            <ElCol :span="8" style="padding: 0 8px">
              <ElFormItem :label="$t('灌流器')">
                <ElSelect v-model="pdData.DialysisPerfusion">
                  <ElOption v-for="(option, index) in glqDataNew" :value="option.Value" :key="index">{{ option.Name }}</ElOption>
                </ElSelect>
              </ElFormItem>
            </ElCol>
            <ElCol :span="8" style="padding: 0 8px">
              <ElFormItem :label="$t('患者类型')">
                <ElSelect v-model="pdData.PatientType">
                  <ElOption v-for="(option, index) in PatientTypeList" :value="option.Id" :key="index">{{ option.Name }}</ElOption>
                </ElSelect>
              </ElFormItem>
            </ElCol>
          </ElForm>
        </ElRow>
      </div>
      <template #footer>
        <ElButton type="primary" @click="addResetPb" :loading="submitLoading">{{ $t('提交') }}</ElButton>
        <ElButton @click="reschedulingCancel">{{ $t('取消') }}</ElButton>
        <ElButton type="danger" style="margin-right: 100px" @click="delPb" v-if="pdData.DialysisPerfusion" :loading="deleteLoading">{{ $t('删除') }}</ElButton>
      </template>
    </ElDialog>

    <!-- 耗材剩余情况弹窗 -->
    <ElDialog :title="patientName" width="1500" v-model="residueModal">
      <ElTable :columns="columns" :data="tabSingelData" border size="small"></ElTable>
      <template #footer>
        <ElButton @click="cancelResidue">{{ $t('取消') }}</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  ElButton, ElSelect, ElDatePicker, ElCheckbox, ElDialog, ElForm, ElFormItem,
  ElOption, ElRow, ElCol, ElTable, ElMessage, ElMessageBox
} from 'element-plus';
import type { FormInstance } from 'element-plus';
import { swsApi } from '#/api/sws';

// ==================== 日期格式化工具 ====================

function formatDateString(date: Date | string, pattern: string): string {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return pattern
    .replace('yyyy', String(year))
    .replace('MM', month)
    .replace('dd', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
}

// ==================== 类型定义 ====================

interface PatientItem {
  Id: string;
  Name: string;
}

interface ShiftItem {
  ShiftName: string;
}

interface DictionaryItem {
  Id: string;
  Name: string;
  Value: string;
}

interface TableHeadItem {
  date: string;
  colspan: number;
}

interface TableHeadWithShiftItem {
  date: string;
  shift: string;
  index: number;
}

interface CycleShiftMapItem {
  dialysisType: string;
  dialyzer: string;
}

interface TableBodyItem {
  No: number;
  PatientId: string;
  PatientName: string;
  cycleShiftMap?: Record<string, CycleShiftMapItem>;
  [key: string]: any;
}

interface MultiChangeForm {
  FieldName: string;
  PatientIds: string;
  OldValue: string;
  NewValue: string;
  IsAll: number;
  selectedPatientIds: string[];
  TimeRange: Date[];
}

interface PdData {
  PatientId: string;
  Shift: string;
  DialysisType: string;
  Dialyzer: string;
  DialysisPerfusion: string;
  PatientType: string;
}

interface ReschedulingData {
  DateList: Date[];
  selectedPatientIds: string[];
  Shift: string;
}

// ==================== Store & Router ====================

const route = useRoute();
const router = useRouter();

// 本地状态（原系统通过 Vuex 管理，此处用本地 ref 替代）
const SingleId = ref('');
const dialysisColorMap = (type: string) => {
  const colorMap: Record<string, string> = {
    'HD': '#e6f7ff',
    'HDF': '#f6ffed',
    'HF': '#fff7e6',
    'HP': '#fff1f0',
    'CRRT': '#f9f0ff',
  };
  return colorMap[type] || '#ffffff';
};

// ==================== 权限按钮 ====================

const HZQD_NEW = ref(true);
const HZPB_AUTO = ref(true);
const HZPB_AUTO_P = ref(true);
const HZPB_DELETE_ALL = ref(true);
const HZPB_DELETE_P = ref(true);

// ==================== 响应式数据 ====================

const TypeArr = ref<string[]>([]);
const MaxCount = ref(0);
const isLoad1 = ref(false);
const nameVal = ref('name1');
const shiftDateRange = ref<Date[]>([]);
const shiftDateRange1 = ref<string[]>([]);
const shiftHeaderData = ref<any[]>([]);
const shiftCententData = ref<any[]>([]);
const options = ref({
  disabledDate(date: Date) {
    return date && date.valueOf() < Date.now() - 86400000;
  }
});
const dateRange = ref<Date[]>([]);
const dateRange1 = ref<string[]>([]);
const dateArrShow = ref(false);
const bcAllData = ref<ShiftItem[]>([]);
const Shift = ref('');
const headList = ref<any[]>([]);
const bodyList = ref<any[]>([]);
const isLoad = ref(true);
const loadTip = ref('数据查询中，请稍等...');
const tabData = ref<any[]>([]);
const tabSingelData = ref<any[]>([]);
const columns = ref<any[]>([]);
const patientName = ref('');
const residueModal = ref(false);
const tableHeadData = reactive({ c_w1: '' });
const allShift = ref<ShiftItem[]>([]);
const reschedulingData = reactive<ReschedulingData>({
  DateList: [],
  selectedPatientIds: [],
  Shift: ''
});
const PatientTypeList = ref<DictionaryItem[]>([]);
const tablebodyData = ref<TableBodyItem[]>([]);
const zandata = ref<any[]>([]);
const pbMoadl = ref(false);
const searchModal = ref(false);
const submitLoading = ref(false);
const deleteAllLoading = ref(false);
const deleteLoading = ref(false);
const autoLoading = ref(false);
const searchLoading = ref(false);
const CycleValue = ref(0);
const patName = ref('');
const patDate = ref('');
const pdData = reactive<PdData>({
  PatientId: '',
  Shift: '',
  DialysisType: '',
  Dialyzer: '',
  DialysisPerfusion: '',
  PatientType: ''
});
const now = ref(-1);
const index = ref(1);
const onePeopleboData = ref<TableBodyItem | null>(null);
const bcData = ref<ShiftItem[]>([]);
const txqDataNew = ref<DictionaryItem[]>([]);
const zlmsData = ref<any[]>([]);
const glqDataNew = ref<DictionaryItem[]>([]);
const searchData = ref<any[]>([]);
const SearchDate = ref('');
const sdate = ref<Date | null>(null);
const myShift = ref(1);
const options3 = ref({
  disabledDate(date: Date) {
    return date && date.valueOf() < Date.now();
  }
});
const loading2 = ref(false);
const multiChangeModal = ref(false);
const multiChangeForm = reactive<MultiChangeForm>({
  FieldName: '',
  PatientIds: '',
  OldValue: '',
  NewValue: '',
  IsAll: 0,
  selectedPatientIds: [],
  TimeRange: []
});
const multiChangeFormRef = ref<FormInstance>();
const multiChangeFormRule = {
  selectedPatientIds: [
    { required: true, message: '患者不能为空', trigger: 'change', type: 'array' }
  ],
  FieldName: [
    { required: true, message: '修改类型不能为空', trigger: 'change' }
  ],
  OldValue: [
    { required: true, message: '旧值不能为空', trigger: 'change' }
  ],
  NewValue: [
    { required: true, message: '新值不能为空', trigger: 'change' }
  ]
};
const reschedulingRule = ref({});
const changeTypeList = ref([
  { Id: 0, Name: '透析器', Key: 'Dialyzer' },
  { Id: 1, Name: '灌流器', Key: 'DialysisPerfusion' }
]);
const patientList = ref<PatientItem[]>([]);
const autoChangeList = ref<any[]>([]);
const multiSaveLoading = ref(false);
const reschedulingModel = ref(false);
const TimeRange = ref<Date[]>([]);
const tongjiData = ref<any[]>([]);
const isLoadingTJ = ref<any>(null);
const firstIndex = ref<string>('');
const lastIndex = ref<string>('');
const patientInfoSections = ref([
  { start: 8, end: 14 },
  { start: 15, end: 21 },
  { start: 22, end: 28 },
  { start: 29, end: 35 }
]);
const shiftData = ref<any[]>([]);
const tableHead = ref<TableHeadItem[]>([]);
const tableHeadWithShift = ref<TableHeadWithShiftItem[]>([]);
const currentWeekIndex = ref(0);
const weeks = reactive({
  tableHead: [] as TableHeadItem[],
  tableHeadWithShift: [] as TableHeadWithShiftItem[]
});
const filterTxqDataNew = ref<DictionaryItem[]>([]);
const showDialyzer = ref(false);

// ==================== 计算属性 ====================

const filterData = computed(() => {
  if (now.value == -1) {
    return tablebodyData.value;
  } else {
    if (tablebodyData.value.length > 0) {
      return tablebodyData.value.filter(item => item.PatientId === now.value);
    } else {
      return [];
    }
  }
});

// ==================== 方法 ====================

function getMonthsBetweenDates(dateStr1: string, dateStr2: string): number {
  const date1 = new Date(dateStr1);
  const date2 = new Date(dateStr2);
  return (
    (date2.getFullYear() - date1.getFullYear()) * 12 +
    (date2.getMonth() - date1.getMonth())
  );
}

function getNextMonth(date1: string, months: number): string {
  const date2 = new Date(date1);
  date2.setMonth(date2.getMonth() + months);
  return formatDateString(date2, 'yyyy-MM');
}

async function loadTj(Id: string) {
  tongjiData.value = [];
  if (!zandata.value[0]) return;

  const firstToLastMonth = getMonthsBetweenDates(firstIndex.value, lastIndex.value);
  const arr: any[] = [];
  for (let i = 0; i <= firstToLastMonth; i++) {
    const mouth = getNextMonth(firstIndex.value, i);
    const Sjson = {
      MouthDate: mouth,
      PatientId: Id
    };
    const response = await swsApi.swsGet('SchedulingManage/4018', Sjson);
    if (response.Code == 200) {
      const obj: any = {};
      obj[`${parseInt(mouth.substr(-2))}`] = response.Data.Dic;
      arr.push(obj);
    }
  }
  tongjiData.value = [...new Set([...arr])];
}

function queryList() {
  dateArrShow.value = true;
  dateRange.value = setDefaultDateRange();
  dateRange1.value = JSON.parse(JSON.stringify(dateRange.value));
  shiftDateRange.value = setDefaultDateRange();
  shiftDateRange1.value = JSON.parse(JSON.stringify(dateRange.value));
  changeTab('name1');
}

function changeTab(val: string) {
  nameVal.value = val;
  if (val == 'name1') {
    getWeekData();
  } else {
    getShitAllData();
  }
}

function changeDateArr1(val: Date[]) {
  shiftDateRange.value = val;
  shiftDateRange1.value = val.map(d => formatDateString(d, 'yyyy-MM-dd'));
  getShitAllData();
}

function changeDateArr(val: Date[]) {
  dateRange.value = val;
  dateRange1.value = val.map(d => formatDateString(d, 'yyyy-MM-dd'));
  getWeekData();
}

function setDefaultDateRange(): Date[] {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(monday.getDate() - dayOfWeek + 1);
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  return [monday, sunday];
}

function changeShift() {
  if (nameVal.value == 'name1') {
    getWeekData();
  } else {
    getShitAllData();
  }
}

async function getWeekData() {
  if (!dateRange1.value[0]) {
    ElMessage.warning('请选择时间段后查询！');
    return;
  }
  const jsonStr = {
    StartDate: dateRange1.value[0],
    EndDate: dateRange1.value[1],
    Shift: Shift.value
  };
  headList.value = [];
  bodyList.value = [];
  loadTip.value = '数据查询中，请稍等...';
  const res = await swsApi.swsGet('SchedulingManage/4026', jsonStr);
  if (res.Code == 200) {
    isLoad.value = false;
    headList.value = res.Data.HeaderList;
    bodyList.value = res.Data.DataList;
  } else {
    isLoad.value = true;
    loadTip.value = '查询无数据';
  }
}

async function getShitAllData() {
  const jsonStr = {
    StartDate: shiftDateRange1.value[0],
    EndDate: shiftDateRange1.value[1],
    Shift: Shift.value
  };
  const res = await swsApi.swsGet('SchedulingManage/4028', jsonStr);
  if (res.Code == 200) {
    shiftHeaderData.value = res.Data.HeaderList;
    const arr = res.Data.DataList;
    const maxLength = Math.max(...arr.map((item: any) => item.ActualShifts.length));
    const tableData = [];
    for (let i = 0; i < maxLength; i++) {
      const group = arr.map((day: any) => {
        if (i < day.ActualShifts.length) {
          return day.ActualShifts[i];
        } else {
          return {
            PatientName: '',
            ActualDialysisType: '',
            ActualDialyzer: '',
            ActualDialysisPerfusion: '',
            Anticoagulants: '',
            AnticoagulantsDose: null,
            AnticoagulantsUnit: '',
            PatientCardNum: '',
            PatientId: ''
          };
        }
      });
      tableData.push(group);
    }
    shiftCententData.value = tableData;
    MaxCount.value = res.Data.MaxCount;
  } else {
    shiftHeaderData.value = [];
    shiftCententData.value = [];
    MaxCount.value = 0;
  }
}

function cancelResidue() {
  residueModal.value = false;
  tabSingelData.value = [];
}

function changeDate(e: string) {
  reschedulingData.DateList = e.split(',').map(d => new Date(d));
}

function reschedulingCancel() {
  reschedulingModel.value = false;
}

function lookResidue() {
  tabSingelData.value = [];
  patientName.value = filterData.value[0]?.PatientName + '的耗材剩余情况';
  tabData.value.forEach((item) => {
    if (item.PatientName == filterData.value[0]?.PatientName) {
      tabSingelData.value.push(item);
    }
  });
  residueModal.value = true;
}

async function getAllResidue() {
  const json = { EndDate: null };
  const res = await swsApi.swsGet('BookkeepingManagement/4008', json);
  if (res.Code == 200) {
    columns.value = res.Data.Header;
    for (const i in columns.value) {
      columns.value[i].align = 'center';
      if (i == '0') {
        columns.value[i].width = 100;
        columns.value[i].fixed = 'left';
      }
    }
  }
}

function exportTable() {
  ElMessage.info('导出功能开发中...');
}

function autoPb() {
  ElMessage.info('自动排班功能开发中...');
}

function autoSinglePb() {
  ElMessage.info('个人排班功能开发中...');
}

function deleteData() {
  ElMessageBox.confirm('确定要删除排班吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    ElMessage.success('删除成功');
  });
}

function querySign() {
  ElMessage.info('生成签到表功能开发中...');
}

function goBed() {
  router.push('/dialysis/bed');
}

function selectSearchDate(val: Date) {
  sdate.value = val;
}

function searchSch() {
  ElMessage.info('查询功能开发中...');
}

function clickPat(PatientId: string) {
  SingleId.value = PatientId;
}

function pbTdstatus(val: string): number {
  if (!val) return 0;
  return 1;
}

function getFormatTdDialysisType(item: any, key: string): string {
  if (item.cycleShiftMap && item.cycleShiftMap[key]) {
    return item.cycleShiftMap[key].dialysisType;
  }
  return '';
}

function onClickPatientShift(item: TableBodyItem, index: number, shift: string) {
  patName.value = item.PatientName;
  pdData.PatientId = item.PatientId;
  pbMoadl.value = true;
}

function changeMultiType() {
  // 修改类型变更
}

function changeHospitals() {
  // 选择患者变更
}

function changeTimeRange() {
  // 时间段变更
}

function changeAllSelect() {
  // 全选变更
}

function DialysisTypeMd() {
  // 治疗模式变更
}

async function addPb() {
  submitLoading.value = true;
  try {
    const params = {
      PatientId: pdData.PatientId,
      Shift: pdData.Shift,
      DialysisType: pdData.DialysisType,
      Dialyzer: pdData.Dialyzer,
      DialysisPerfusion: pdData.DialysisPerfusion,
      PatientType: pdData.PatientType
    };
    const res = await swsApi.swsPost('SchedulingManage/4001', params);
    if (res.Code == 200) {
      ElMessage.success(res.Msg || '排班成功');
      pbMoadl.value = false;
      load();
    } else {
      ElMessage.error(res.Msg || '排班失败');
    }
  } finally {
    submitLoading.value = false;
  }
}

async function delPb() {
  deleteLoading.value = true;
  try {
    const params = {
      PatientId: pdData.PatientId,
      Date: patDate.value,
      Shift: pdData.Shift
    };
    const res = await swsApi.swsDelete('SchedulingManage/4003', params);
    if (res.Code == 200) {
      ElMessage.success(res.Msg || '删除成功');
      pbMoadl.value = false;
      load();
    } else {
      ElMessage.error(res.Msg || '删除失败');
    }
  } finally {
    deleteLoading.value = false;
  }
}

async function addResetPb() {
  submitLoading.value = true;
  try {
    const params = {
      PatientIds: reschedulingData.selectedPatientIds.join(','),
      DateList: reschedulingData.DateList.map(d => formatDateString(d, 'yyyy-MM-dd')),
      Shift: reschedulingData.Shift,
      DialysisType: pdData.DialysisType,
      Dialyzer: pdData.Dialyzer,
      DialysisPerfusion: pdData.DialysisPerfusion,
      PatientType: pdData.PatientType
    };
    const res = await swsApi.swsPost('SchedulingManage/4002', params);
    if (res.Code == 200) {
      ElMessage.success(res.Msg || '重新排班成功');
      reschedulingModel.value = false;
      load();
    } else {
      ElMessage.error(res.Msg || '重新排班失败');
    }
  } finally {
    submitLoading.value = false;
  }
}

async function multiChangeDialysis() {
  multiSaveLoading.value = true;
  try {
    const params = {
      FieldName: multiChangeForm.FieldName,
      PatientIds: multiChangeForm.selectedPatientIds.join(','),
      OldValue: multiChangeForm.OldValue,
      NewValue: multiChangeForm.NewValue,
      IsAll: multiChangeForm.IsAll,
      StartDate: multiChangeForm.TimeRange[0] ? formatDateString(multiChangeForm.TimeRange[0], 'yyyy-MM-dd') : '',
      EndDate: multiChangeForm.TimeRange[1] ? formatDateString(multiChangeForm.TimeRange[1], 'yyyy-MM-dd') : ''
    };
    const res = await swsApi.swsPut('SchedulingManage/3011', params);
    if (res.Code == 200) {
      ElMessage.success(res.Msg || '批量修改成功');
      multiChangeModal.value = false;
      load();
    } else {
      ElMessage.error(res.Msg || '批量修改失败');
    }
  } finally {
    multiSaveLoading.value = false;
  }
}

function loadDataPrev() {
  CycleValue.value--;
  load();
}

function loadDataNext() {
  CycleValue.value++;
  load();
}

async function load() {
  // 加载排班数据
  const res = await swsApi.swsGet('SchedulingManage/4017', {
    Date: formatDateString(new Date(), 'yyyy-MM-dd'),
    Shift: '',
    PatientType: '',
    TreatmentRegion: '',
    OrderType: 1
  });
  if (res.Code == 200) {
    tablebodyData.value = res.Data;
  }
}

async function publicMd() {
  // 获取公共数据
  const res = await swsApi.swsGet('SystemDictionary/4006', [
    { typeId: 'bd1716eacc88465588324b680fcf7570' },
    { typeId: '9364d9b7b019426a96c61822adcecdeb' }
  ]);
  if (res.Code == 200) {
    txqDataNew.value = res.Data[1].SystemDictionaryList;
    filterTxqDataNew.value = res.Data[1].SystemDictionaryList;
  }
}

async function loadDictionary() {
  // 加载字典数据
  const res = await swsApi.swsGet('PatientShiftSet/4002', {
    Date: formatDateString(new Date(), 'yyyy-MM-dd')
  });
  if (res.Code == 200) {
    bcData.value = res.Data;
    allShift.value = res.Data;
  }
}

// ==================== 生命周期 ====================

onMounted(() => {
  load();
  publicMd();
  loadDictionary();
  getAllResidue();
});

watch(() => route.name, (newRoute) => {
  if (newRoute == 'patients_scheduling') {
    load();
    now.value = SingleId.value;
  }
});

watch(now, (newVal, oldVal) => {
  if (newVal !== -1 && newVal !== oldVal) {
    loadTj(String(newVal));
  }
});

watch(SingleId, (newVal, oldVal) => {
  if (newVal !== -1 && newVal !== oldVal) {
    loadTj(String(newVal));
  }
});
</script>

<style scoped>
.paibanx {
  padding: 16px;
}

.ftablex {
  margin-top: 16px;
  overflow: auto;
}

.ftablex table {
  width: 100%;
  border-collapse: collapse;
}

.ftablex th,
.ftablex td {
  border: 1px solid #e9eaec;
  padding: 8px;
  text-align: center;
}

.ftablex th {
  background-color: #f8f8f9;
  font-weight: bold;
}

.ftablex .disabledTd {
  background-color: #f4f4f4;
  cursor: not-allowed;
}

.tabled {
  table-layout: fixed;
}

.tabled.single {
  width: auto;
}

.thead th {
  position: sticky;
  top: 0;
  z-index: 1;
}

.test1, .test2 {
  position: sticky;
  left: 0;
  background-color: #f8f8f9;
  z-index: 2;
}

.test1 {
  width: 40px;
}

.test2 {
  width: 80px;
}
</style>
