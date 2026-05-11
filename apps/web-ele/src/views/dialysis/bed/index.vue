<template>
  <div class="sws_container">
    <!-- 顶部工具栏 -->
    <div class="top" style="display: flex;justify-content: space-between;">
      <div>
        <ElButton type="primary" :disabled="currentWeekIndex === 0" @click="onClickPrev">{{ $t('上一周') }}</ElButton>
        <ElButton type="primary" :disabled="currentWeekIndex === weeks.length - 1" @click="onClickNext">{{ $t('下一周') }}</ElButton>
        <ElDatePicker type="daterange" v-model="dateArr" :placeholder="$t('请选择时间段')" style="width: 200px" @change="chooseDate"></ElDatePicker>
        <ElInput v-model="NurseName" :placeholder="$t('请输入护士姓名查询')" style="width: 150px; margin-left: 10px"></ElInput>
        <ElCheckbox v-model="isIdCard" style="margin-left: 10px" @change="idCardChange">{{ $t('显示身份证号') }}</ElCheckbox>
        <ElCheckbox v-model="IsDialyzer" style="margin-left: 10px" @change="idCardChange">{{ $t('显示透析器型号') }}</ElCheckbox>
        <ElCheckbox v-model="IsAnticoagulants" style="margin-left: 10px" @change="idCardChange">{{ $t('显示抗凝剂剂量') }}</ElCheckbox>
        <ElButton type="primary" style="margin-left: 10px" @click="query">{{ $t('查询') }}</ElButton>
        <ElButton type="primary" style="margin-left: 10px" @click="exportBedUsingTable">{{ $t('导出') }}</ElButton>
      </div>
      <span style="color: red">{{ $t('提示') }}：无床位号且背景色为灰色则表示此床位之前使用过，{{ $t('但目前已经禁用') }}</span>
    </div>

    <!-- 床位使用表格 -->
    <div class="ftable">
      <ElLoading v-if="isLoad" :fullscreen="false" style="height: 200px">
        <div>{{ $t('加载中') }}...</div>
      </ElLoading>
      <table cellpadding="0" cellspacing="0" id="bed_using_table">
        <thead class="thead">
          <tr class="line1">
            <th rowspan="2" class="test1">{{ $t('分管护士') }}</th>
            <th rowspan="2" class="test2">{{ $t('分区') }}</th>
            <th rowspan="2" class="test3">{{ $t('床位号') }}</th>
            <th rowspan="2" class="test4">{{ $t('次数') }}</th>
            <th :colspan="item.ChildHeadName.split('|').length" v-for="item in headList" v-html="item.TableHeadName">
            </th>
          </tr>
          <tr>
            <template v-for="(item, index) in headList">
              <th :class="[(isIdCard || IsDialyzer || IsAnticoagulants) ? 'th_wide' : '']" v-for="(i, index1) in item.ChildHeadName.split('|')" v-html="i">
              </th>
            </template>
          </tr>
        </thead>
        <tbody class="tb">
          <tr v-for="(item, index) in bodyList" :class="{ isDisable: item.IsEffective == '0' }">
            <td class="fixed_td1">{{ item.Nurse }}</td>
            <td class="fixed_td2">{{ item.TreatmentRegionName }}</td>
            <td class="fixed_td3">{{ item.BedtNo }}</td>
            <td class="fixed_td4">{{ item.Qty }}</td>
            <template v-for="(key, j) in Object.keys(item).filter((res) => res.indexOf('week_content') == 0)">
              <td
                v-if="showTd(key)"
                v-for="(value, i) in item[key].split('@')"
                v-html="getTdHtml(value.split('|')[1])"
                :id="`${item.No}_${key}_${i}_${getTdPatientId(value.split('|')[1])}`"
                :class="{ isGgray: value.split('|')[0] == '0', 'active-patient-td': getTdPatientId(value.split('|')[1]) === SingleId, 'active-id': isActiveId(item, value, i, key) }"
                :style="value.split('|')[0] == '0' ? '' : `background: ${dialysisColorMap(getTdDialysisType(value.split('|')[1]))}`"
                @click="choosePatBed(item, value, i, key)"
              ></td>
            </template>
          </tr>
        </tbody>
      </table>
      <div style="position: fixed; bottom: 16px; display: flex; justify-content: center; align-items: center; gap: 8px">
        <div>{{ $t('患者') }}：{{ Name }}</div>
        <template v-if="activeIds.length > 0">
          <div>
            <ElButton size="small" @click="onClickActiveId('-')">{{ $t('上一个') }}</ElButton>
            <ElButton size="small" @click="onClickActiveId('+')">{{ $t('下一个') }}</ElButton>
          </div>
          <div>{{ activeIdIndex + 1 }} / {{ activeIds.length }}</div>
        </template>
        <div v-else>{{ $t('当前周次无排班') }}</div>
      </div>
    </div>

    <!-- 排床弹窗 -->
    <ElDialog v-model="modeShow" :title="titleVal" width="900" :close-on-click-modal="false">
      <div>
        <ElForm :label-width="80" style="margin-top: 20px;" class="SpForm" :model="BatchFormData" ref="BatchFormDataRef" :rules="ruleBatchFormdata">
          <ElRow>
            <ElCol :span="10" v-if="ShowPat">
              <ElFormItem :label="$t('患者')" prop="PatientCycleSchedulingId">
                <div style="display: flex;justify-content: flex-start;align-items: center;gap: 6px">
                  <div>
                    <ElSelect v-if="showNotArrangePatient" v-model="BatchFormData.PatientCycleSchedulingId" style="width: 160px">
                      <ElOption v-for="option in notArrangePatientList" :key="option.PatientId" :value="option.PatientId">{{ option.PatientName }}</ElOption>
                    </ElSelect>
                    <ElSelect v-else v-model="BatchFormData.PatientCycleSchedulingId" style="width: 160px" filterable @change="changePat">
                      <ElOption v-for="(option, index) in AllPatList" :value="option.PatientCycleSchedulingId" :key="index">{{ option.PatientName }} ({{ option.ActualShift }})</ElOption>
                    </ElSelect>
                  </div>
                  <ElCheckbox v-model="showNotArrangePatient" @change="onShowNotArrangePatientChange">{{ $t('未排班') }}</ElCheckbox>
                </div>
              </ElFormItem>
            </ElCol>
            <ElCol :span="6">
              <ElFormItem :label="$t('班次')" prop="Shift">
                <ElSelect v-model="BatchFormData.Shift" @change="chooseShift" :disabled="ShowPat">
                  <ElOption v-for="(option, index) in bcData" :value="option.ShiftName" :key="index">{{ option.ShiftName }}</ElOption>
                </ElSelect>
              </ElFormItem>
            </ElCol>
            <ElCol :span="8">
              <ElFormItem :label="$t('治疗模式')" prop="TreatmentModes" style="position: relative;">
                <ElSelect v-model="BatchFormData.TreatmentModes" @change="chooseMode">
                  <ElOption v-if="BatchFormData.PatientCycleSchedulingId" v-for="item, index in ModeArr" :value="item.Value" :key="index">{{ item.Value }}</ElOption>
                </ElSelect>
                <ElButton size="small" type="info" style="position: absolute;left: -5px;top: -23px;" @click="lookTxPlan">{{ $t('查看选中模式透析方案') }}</ElButton>
              </ElFormItem>
            </ElCol>
            <ElCol :span="8">
              <ElFormItem :label="$t('透析器')" prop="Dialyzer">
                <ElSelect v-model="BatchFormData.Dialyzer">
                  <ElOption v-for="item, index in DialyzerArr" :value="item.Value" :key="index">{{ item.Value }}</ElOption>
                </ElSelect>
              </ElFormItem>
            </ElCol>
            <ElCol :span="8">
              <ElFormItem :label="$t('灌流器')" prop="DialysisPerfusion">
                <ElSelect v-model="BatchFormData.DialysisPerfusion">
                  <ElOption v-for="item, index in DialysisPerfusionArr" :value="item.Value" :key="index">{{ item.Value }}</ElOption>
                </ElSelect>
              </ElFormItem>
            </ElCol>
            <ElCol :span="8">
              <ElFormItem :label="$t('床位')" prop="EquipmentId">
                <ElSelect v-model="BatchFormData.EquipmentId" @change="chooseBedNo" :disabled="ShowPat">
                  <ElOption v-for="(option, index) in bedNoArr" v-if="option.SickbedNo" :value="option.EquipmentId" :key="index"> ({{ option.TreatmentRegion }}){{ option.SickbedNo}}</ElOption>
                </ElSelect>
              </ElFormItem>
            </ElCol>
          </ElRow>
          <ElRow>
            <span style="color: red;font-size: 12px;display: inline-block;margin-left: 40px;margin-top: 0;" v-if="bedNoArr.length==0">{{ $t('提示') }}：{{ $t('床位无匹配数据则表示暂无支持该治疗模式的空闲床位') }}</span>
          </ElRow>
        </ElForm>
      </div>
      <template #footer>
        <ElButton type="primary" @click="saveEdit">{{ $t('修改') }}</ElButton>
        <ElButton @click="closeModal">{{ $t('关闭') }}</ElButton>
      </template>
    </ElDialog>

    <!-- 透析方案弹窗 -->
    <ElDialog v-model="TxPlanShow" :title="txPlanTitle" width="1300">
      <div>
        <ElForm :label-width="160" class="SpForm" :model="formValidata" ref="formValidataRef">
          <h4 style="margin-top: 0px;">{{ $t('透析处方设置') }}</h4>
          <div class="solu_info">
            <ElRow>
              <ElCol :span="8">
                <ElFormItem :label="$t('治疗时间(h:m)')">
                  <ElInput readonly v-model="formValidata.TreatHour" style="width: 50%;" /><ElInput readonly v-model="formValidata.TreatMin" style="width: 50%;" />
                </ElFormItem>
              </ElCol>
              <ElCol :span="8">
                <ElFormItem :label="$t('血管通路类别')" prop="BloodAccessType">
                  <ElInput readonly v-model="formValidata.BloodAccessType" />
                </ElFormItem>
              </ElCol>
              <ElCol :span="8">
                <ElFormItem :label="$t('血管通路')" prop="BloodAccess">
                  <ElInput readonly v-model="formValidata.BloodAccess" />
                </ElFormItem>
              </ElCol>
              <ElCol :span="8">
                <ElFormItem :label="$t('置换液补入方式')" prop="FillWay">
                  <ElInput readonly v-model="formValidata.FillWay" />
                </ElFormItem>
              </ElCol>
              <ElCol :span="8">
                <ElFormItem :label="$t('置换液流量(ml/min)')" prop="FluidFlow">
                  <ElInput readonly v-model="formValidata.FluidFlow" />
                </ElFormItem>
              </ElCol>
              <ElCol :span="8">
                <ElFormItem :label="$t('置换液总量(ml)')" prop="FluidTotal">
                  <ElInput v-model="formValidata.FluidTotal" />
                </ElFormItem>
              </ElCol>
              <ElCol :span="8">
                <ElFormItem :label="$t('抗凝剂')" prop="Anticoagulants">
                  <ElInput readonly v-model="formValidata.Anticoagulants" />
                </ElFormItem>
              </ElCol>
              <ElCol :span="8">
                <ElFormItem :label="$t('抗凝剂追加量方式')" prop="AddOnMode">
                  <ElSelect disabled v-model="formValidata.AddOnMode">
                    <ElOption :value="1">{{ $t('每小时追加') }}</ElOption>
                    <ElOption :value="2">{{ $t('一次性追加') }}</ElOption>
                    <ElOption :value="3">{{ $t('持续泵入') }}</ElOption>
                  </ElSelect>
                </ElFormItem>
              </ElCol>
              <ElCol :span="8">
                <ElFormItem :label="$t('抗凝剂提前停止时间(min)')">
                  <ElInput readonly v-model="formValidata.AnticoagulationStopTime" />
                </ElFormItem>
              </ElCol>
              <ElCol :span="8">
                <ElFormItem :label="$t('抗凝剂首剂量')" prop="AnticoagulantsFirstDose">
                  <ElInput readonly style="width: 50%;" v-model="formValidata.AnticoagulantsFirstDose" />
                  <ElInput readonly style="width: 50%;" v-model="formValidata.AnticoagulantsUnitId" />
                </ElFormItem>
              </ElCol>
              <ElCol :span="8">
                <ElFormItem :label="$t('抗凝剂追加总量')+(formValidata.AnticoagulantsUnitId?'('+formValidata.AnticoagulantsUnitId+')':'')" prop="AnticoagulantsBolus">
                  <ElInput readonly :style="{width: formValidata.AddOnMode!=2?'35%':'100%'}" v-model="formValidata.AnticoagulantsBolus"></ElInput>
                  <span v-if="formValidata.AddOnMode!=2">
                    {{ $t('每小时') }} <ElInput readonly style="width:35%;" v-model="formValidata.AnticoagulantsBolusHour" />
                  </span>
                </ElFormItem>
              </ElCol>
              <ElCol :span="8">
                <ElFormItem :label="$t('抗凝剂总量')" prop="AnticoagulantsUnitId">
                  <ElInput readonly style="width: 50%;" v-model="totalNum" />
                  <ElInput readonly style="width: 50%;" v-model="formValidata.AnticoagulantsUnitId" />
                </ElFormItem>
              </ElCol>
              <ElCol :span="8">
                <ElFormItem :label="$t('血流量(ml/min)')" prop="BloodFlow">
                  <ElInput readonly style="width:45%;" v-model="formValidata.BloodFlow" />
                  <span>&nbsp;-&nbsp;</span>
                  <ElInput readonly style="width:46%;" v-model="formValidata.BloodFlowMax" />
                </ElFormItem>
              </ElCol>
              <ElCol :span="8">
                <ElFormItem :label="$t('回血泵速(ml/min)')" prop="BloodSpeed">
                  <ElInput readonly v-model="formValidata.BloodSpeed" />
                </ElFormItem>
              </ElCol>
              <ElCol :span="8">
                <ElFormItem :label="$t('透析液流量(ml/min)')">
                  <ElInput readonly v-model="formValidata.FlowDialy" />
                </ElFormItem>
              </ElCol>
            </ElRow>
          </div>
          <h4>{{ $t('透析液处方') }}</h4>
          <div class="solu_info">
            <ElRow>
              <ElCol :span="8">
                <ElFormItem :label="$t('组合曲线')" prop="Curve_zh">
                  <ElInput readonly v-model="formValidata.Curve_zh" />
                </ElFormItem>
              </ElCol>
              <ElCol :span="8">
                <ElFormItem :label="$t('钙（mmol/L）')" prop="FlowPres_ga">
                  <ElInput readonly v-model="formValidata.FlowPres_ga" />
                </ElFormItem>
              </ElCol>
              <ElCol :span="8">
                <ElFormItem :label="$t('透析液温度（℃）')" prop="TxyTemperature">
                  <ElInput readonly v-model="formValidata.TxyTemperature" />
                </ElFormItem>
              </ElCol>
            </ElRow>
          </div>
          <h4>{{ $t('备注') }}</h4>
          <div class="solu_info" style="padding: 0;border: 0;">
            <ElInput readonly type="textarea" v-model="formValidata.MedPlan" style="width:60%;display: inline-block;"></ElInput>
            <div style="width:40%;display: inline-block;">
              <ElFormItem :label="$t('制定医生')" :label-width="80">
                <ElInput type="text" v-model="formValidata.MakeDoctor" readonly></ElInput>
              </ElFormItem>
            </div>
          </div>
        </ElForm>
      </div>
      <template #footer>
        <ElButton @click="TxPlanShow = false;">{{ $t('关闭') }}</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue';
import {
  ElButton, ElDatePicker, ElInput, ElCheckbox, ElDialog, ElForm, ElFormItem,
  ElSelect, ElOption, ElRow, ElCol, ElLoading, ElMessage, ElMessageBox
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

// ==================== Store ====================

// 本地状态（原系统通过 Vuex 管理，此处用本地 ref 替代）
const SingleId = ref('');
const Name = ref('');
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

// ==================== 响应式数据 ====================

const dateArr = ref<Date[]>([]);
const dateArr1 = ref<string[]>([]);
const headList = ref<any[]>([]);
const classList = ref<any[]>([]);
const bodyList = ref<any[]>([]);
const isLoad = ref(true);
const NurseName = ref('');
const isIdCard = ref(false);
const IsDialyzer = ref(false);
const IsAnticoagulants = ref(false);
const weeks = ref<any[]>([]);
const currentWeekIndex = ref(0);
const bcData = ref<any[]>([]);
const ModeArr = ref<any[]>([]);
const DialyzerArr = ref<any[]>([]);
const DialysisPerfusionArr = ref<any[]>([]);
const modeShow = ref(false);
const titleVal = ref('');
const showNotArrangePatient = ref(false);
const ShowPat = ref(false);
const notArrangePatientList = ref<any[]>([]);
const AllPatList = ref<any[]>([]);
const bedNoArr = ref<any[]>([]);
const spMode = ref<any[]>([]);
const equipList = ref<any[]>([]);
const modeId = ref('');
const itemVal = ref<any>({});
const choosePatItem = ref<any>({});
const BatchFormData = reactive({
  PatientCycleSchedulingId: '',
  TreatmentModes: '',
  Dialyzer: '',
  DialysisPerfusion: '',
  EquipmentId: '',
  Shift: '',
  SickbedNo: ''
});
const BatchFormDataRef = ref<FormInstance>();
const TxPlanShow = ref(false);
const txPlanTitle = ref('');
const formValidata = ref<any>({});
const ruleBatchFormdata = {
  PatientCycleSchedulingId: [{ required: true, type: 'string', message: '患者不能为空', trigger: 'change' }],
  TreatmentModes: [{ required: true, type: 'string', message: '透析模式不能为空', trigger: 'change' }],
  Dialyzer: [{ required: true, type: 'string', message: '透析器不能为空', trigger: 'change' }],
  DialysisPerfusion: [{ required: true, type: 'string', message: '灌流器不能为空', trigger: 'change' }],
  EquipmentId: [{ required: true, type: 'string', message: '床位不能为空', trigger: 'change' }],
  Shift: [{ required: true, type: 'string', message: '班次不能为空', trigger: 'change' }]
};
const activeIds = ref<string[]>([]);
const activeIdIndex = ref(0);
const nowDate = ref('');
const nowShift = ref('');

// ==================== 计算属性 ====================

const totalNum = computed(() => {
  return Number((Number(formValidata.value.AnticoagulantsFirstDose || 0) + Number(formValidata.value.AnticoagulantsBolus || 0)).toFixed(2));
});

// ==================== 方法 ====================

function chooseDate(val: Date[]) {
  dateArr1.value[0] = formatDateString(val[0], 'yyyy-MM-dd');
  dateArr1.value[1] = formatDateString(val[1], 'yyyy-MM-dd');
}

function exportBedUsingTable() {
  if (!bodyList.value.length) {
    ElMessage.warning('数据为空无法导出。');
    return;
  }
  ElMessage.info('导出功能开发中...');
}

function query() {
  getTabHeader();
}

async function getTabHeader() {
  isLoad.value = true;
  const res = await swsApi.swsGet('SchedulingManage/4019', {
    StartDate: dateArr1.value[0],
    EndDate: dateArr1.value[1]
  });
  isLoad.value = false;
  if (res.Code == 200) {
    const { weeks: w, currentWeekIndex: idx } = splitWeeks(res.Data);
    weeks.value = w;
    currentWeekIndex.value = idx;
    headList.value = w[idx];
    getTabBody();
  }
}

async function getTabBody(setActive = true) {
  const res = await swsApi.swsGet('SchedulingManage/4020', {
    StartDate: dateArr1.value[0],
    EndDate: dateArr1.value[1],
    NurseName: NurseName.value,
    IdCard: isIdCard.value,
    IsDialyzer: IsDialyzer.value,
    IsAnticoagulants: IsAnticoagulants.value,
    showPatientId: 1
  });
  if (res.Code == 200) {
    bodyList.value = res.Data;
    getHeadStatistic();
    if (setActive) {
      getActiveIds();
    }
  }
}

function getHeadTdDialysisType(str: string) {
  const match = str.match(/(?:\]|<br\/>)\s*([A-Z]+(?:\+[A-Z]+)*)/);
  return match ? match[1] : '';
}

function getHeadStatistic() {
  headList.value = headList.value.map((head: any) => {
    for (const headKey in head) {
      if (headKey.includes('班次索引_')) {
        delete head[headKey];
      }
    }
    let resetChildHeadName = head.ChildHeadName.split('|');
    resetChildHeadName = resetChildHeadName.map((shift: string) => {
      if (shift.includes('<br/>')) {
        return shift.split('<br/>')[0];
      }
      return shift;
    });
    head.ChildHeadName = resetChildHeadName.join('|');

    bodyList.value.forEach((source: any) => {
      const shifts = source[`week_content_${head.No}`] ? source[`week_content_${head.No}`].split('@') : [];
      shifts.forEach((shift: string, shiftIndex: number) => {
        const dialysisType = getHeadTdDialysisType(shift);
        if (dialysisType) {
          const obj = { [dialysisType]: 1 };
          if (!head[`班次索引_${shiftIndex}`]) {
            head[`班次索引_${shiftIndex}`] = [obj];
          } else {
            head[`班次索引_${shiftIndex}`].push(obj);
          }
        }
      });
    });
    const ChildHeadNames = head.ChildHeadName.split('|');
    const ChildHeadName = ChildHeadNames.map((item: string, index: number) => {
      if (!head[`班次索引_${index}`]) return item;
      const map: any = {};
      head[`班次索引_${index}`].forEach((obj: any) => {
        for (const objKey in obj) {
          if (!map[objKey]) {
            map[objKey] = obj[objKey];
          } else {
            map[objKey]++;
          }
        }
      });
      let statisticText = '';
      for (const mapKey in map) {
        statisticText += `<br/>${mapKey}：${map[mapKey]}`;
      }
      return item + statisticText;
    }).join('|');
    return { ...head, ChildHeadName };
  });
}

function idCardChange() {
  getTabBody();
}

function getTdDialysisType(data: string) {
  const splitData = data.split('<br/>');
  if (!splitData || splitData.length < 1) return '';
  if (!isIdCard.value && !IsDialyzer.value && !IsAnticoagulants.value) return splitData[1];
  if (isIdCard.value || IsDialyzer.value) {
    const nameAndType = splitData[0].split(' ');
    if (nameAndType.length > 1) {
      return nameAndType[1];
    }
  }
  if (IsAnticoagulants.value) return splitData[1];
  return '';
}

function splitWeeks(list: any[]) {
  const weeks: any[] = [];
  let currentWeek: any[] = [];

  list.forEach((item, index) => {
    const isMonday = item.TableHeadName.includes('星期一');
    if (isMonday && currentWeek.length) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    currentWeek.push(item);
    if (index === list.length - 1) {
      weeks.push(currentWeek);
    }
  });

  const today = new Date().toISOString().slice(0, 10);
  let currentWeekIndex = -1;
  weeks.forEach((week, index) => {
    const hit = week.some((item: any) => item.TableHeadName.includes(today));
    if (hit) currentWeekIndex = index;
  });
  return { weeks, currentWeekIndex };
}

function showTd(key: string) {
  if (key && typeof key === 'string') {
    const keySplit = key.split('_');
    if (keySplit.length > 1) {
      const No = keySplit[2];
      const min = headList.value[0].No;
      const max = headList.value[headList.value.length - 1].No;
      return No >= min && No <= max;
    }
  }
  return false;
}

function onClickPrev() {
  if (currentWeekIndex.value === 0) return;
  currentWeekIndex.value--;
  headList.value = weeks.value[currentWeekIndex.value];
  getHeadStatistic();
  getActiveIds();
}

function onClickNext() {
  if (currentWeekIndex.value === weeks.value.length - 1) return;
  currentWeekIndex.value++;
  headList.value = weeks.value[currentWeekIndex.value];
  getHeadStatistic();
  getActiveIds();
}

async function choosePatBed(item: any, value: string, index: number, key: string) {
  if (value.split('|')[0] == '0') return;
  const { EquipmentId, PatientName, BedtNo, TreatmentRegionName } = item;
  const dateItem = headList.value.find((item: any) => `week_content_${item.No}` === key);
  const { ChildHeadName, TableHeadName } = dateItem;
  const Date = dateItem && TableHeadName && TableHeadName.match(/\d{4}-\d{2}-\d{2}/) ? TableHeadName.match(/\d{4}-\d{2}-\d{2}/)[0] : '';
  let Shift = ChildHeadName.split('|')[index];
  if (Shift.includes('<br/>')) {
    Shift = Shift.split('<br/>')[0];
  }
  const patient = value.split('|')[1];
  if (patient) {
    const { Code, Data } = await swsApi.swsGet('SchedulingManage/4010', { Date, Shift, TreatmentRegion: '' });
    if (Code === 200) {
      const target = Data.find((item: any) => item.PatientId === getTdPatientId(value));
      if (!target) ElMessage.warning('该排床无对应患者信息');
      ElMessageBox.confirm('此条排床记录将被删除！删除不可恢复，请谨慎操作！', '确认删除此排床信息', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        const jsonStr = { Id: target.PatientSchedulingId };
        const { Code: delCode, Msg } = await swsApi.swsDelete('SchedulingManage/2003', jsonStr);
        if (delCode == 200) {
          getTabBody(false);
          ElMessage.success(Msg);
        }
      });
    }
    return;
  }
  await Promise.all([
    getEquipmentList(Date, Shift),
    getBcData(Date),
    getNotArrangePatientList(Date)
  ]);

  const equip = equipList.value.find((item: any) => item.EquipmentId === EquipmentId);
  if (!equip) {
    ElMessage.warning('未找到该床位的设备');
    return;
  }
  if (equip.EquipmentState === '1') {
    ElMessage.warning('该设备故障维修中，请选择其他设备');
    return;
  }

  getAllPat(Date, Shift, equip.TreatmentModels, equip.TreatmentRegion);

  if (!PatientName) {
    titleVal.value = '【' + BedtNo + '(' + TreatmentRegionName + ')】排床';
    BatchFormData.PatientCycleSchedulingId = '';
    modeShow.value = true;
    ShowPat.value = true;
    bedNoArr.value = [{ EquipmentId, TreatmentRegion: TreatmentRegionName, SickbedNo: BedtNo }];
    BatchFormData.SickbedNo = BedtNo;
    BatchFormData.EquipmentId = EquipmentId;
    BatchFormData.Shift = Shift;
    nowDate.value = Date;
    nowShift.value = Shift;
  } else {
    ShowPat.value = false;
  }
}

function getAllPat(Date: string, Shift: string, TreatmentModels: string, TreatmentRegion: string) {
  const jsonStr = { Date, Shift, PatientType: '', TreatmentRegion: '', OrderType: 1 };
  swsApi.swsGet('SchedulingManage/4017', jsonStr).then((res) => {
    if (res.Code == 200) {
      const arr = res.Data;
      const modeArr = TreatmentModels.split(',');
      AllPatList.value = arr.filter((item: any) => {
        return modeArr.indexOf(item.ActualDialysisType) !== -1 &&
          (item.PatientTreatmentRegion ? TreatmentRegion == item.PatientTreatmentRegion : true);
      });
    }
  });
}

function getBaseData() {
  const jsonStr = [
    { typeId: 'bd1716eacc88465588324b680fcf7570' },
    { typeId: '9364d9b7b019426a96c61822adcecdeb' },
    { typeId: '27630dca490647f3becc3c27060a75bc' }
  ];
  swsApi.swsGet('SystemDictionary/4006', jsonStr).then((res) => {
    if (res.Code == 200) {
      ModeArr.value = res.Data[1].SystemDictionaryList;
      spMode.value = res.Data[2].SystemDictionaryList;
    }
  });
}

async function getEquipmentList(Date: string, Shift: string) {
  equipList.value = [];
  const jsonStr = { Date, Shift, TreatmentRegion: '' };
  const { Code, Data } = await swsApi.swsGet('SchedulingManage/4010', jsonStr);
  if (Code === 200) {
    equipList.value = Data;
  }
}

async function getBcData(Date: string) {
  bcData.value = [];
  const response = await swsApi.swsGet('PatientShiftSet/4002', { Date });
  if (response.Code == 200) {
    bcData.value = response.Data;
  }
}

async function getNotArrangePatientList(Date: string) {
  try {
    notArrangePatientList.value = [];
    const { Code, Data } = await swsApi.swsGet('SchedulingManage/4014', { MouthDate: formatDateString(Date, 'yyyy-MM') });
    if (Code === 200) {
      Data.forEach((item: any) => {
        const key = 'week_content_' + formatDateString(Date, 'd');
        const value = typeof item[key] === 'string' && item[key].split('|').length > 0 ? item[key].split('|')[1] : '';
        if (!value || value === ' ') {
          notArrangePatientList.value.push(item);
        }
      });
    }
  } catch (e) {
    console.log(e);
  }
}

function onShowNotArrangePatientChange() {
  BatchFormData.PatientCycleSchedulingId = '';
}

function changePat(Id: string) {
  if (!Id) return;
  const item = AllPatList.value.filter((item: any) => item.PatientCycleSchedulingId == Id)[0];
  choosePatItem.value = item;
  BatchFormData.TreatmentModes = item.ActualDialysisType;
  chooseMode(BatchFormData.TreatmentModes, item.ActualDialyzer, item.ActualDialysisPerfusion);
  BatchFormData.Dialyzer = item.ActualDialyzer;
  BatchFormData.DialysisPerfusion = item.ActualDialysisPerfusion;
}

function chooseMode(val: string, ActualDialyzer?: string, ActualDialysisPerfusion?: string) {
  if (!val) return;
  for (const one of ModeArr.value) {
    if (one.Value == val) {
      modeId.value = one.Id;
    }
  }
  const Sjson = { DictionaryId: modeId.value, PatientId: choosePatItem.value.PatientId };
  swsApi.swsGet('DialysisModeSet/4001', Sjson).then((res) => {
    if (res.Code == 200) {
      DialyzerArr.value = res.Data[0].Dialyzer;
      DialysisPerfusionArr.value = res.Data[0].Hemoperfusion;
      if (!ShowPat.value) {
        for (const item of DialyzerArr.value) {
          if (item.IsSelect) {
            BatchFormData.Dialyzer = item.Name;
          }
        }
        for (const item of DialysisPerfusionArr.value) {
          if (item.IsSelect) {
            BatchFormData.DialysisPerfusion = item.Value;
          }
        }
      } else {
        setTimeout(() => {
          BatchFormData.Dialyzer = ActualDialyzer || '';
          BatchFormData.DialysisPerfusion = ActualDialysisPerfusion || '';
        }, 100);
      }
    }
  });
  if (!ShowPat.value) {
    getBedNo(val);
  }
}

function chooseShift(val: string) {
  if (!val) return;
  BatchFormData.Shift = val;
  getBedNo(BatchFormData.TreatmentModes, val);
}

function getBedNo(modeName: string, Shift?: string) {
  const jsonStr = {
    Date: nowDate.value,
    Shift: Shift || nowShift.value,
    PatientId: ShowPat.value ? choosePatItem.value.PatientId : itemVal.value.PatientId,
    DialysisType: modeName,
    TreatmentRegion: itemVal.value.TreatmentRegion
  };
  swsApi.swsPost('SchedulingManage/1007', jsonStr).then((res) => {
    if (res.Code == 200) {
      bedNoArr.value = res.Data;
    }
  });
}

function chooseBedNo(val: string) {
  const one = bedNoArr.value.filter((item: any) => val == item.EquipmentId);
  if (one[0] && one[0].SickbedNo) {
    BatchFormData.SickbedNo = one[0].SickbedNo;
  } else {
    BatchFormData.SickbedNo = '';
  }
}

function lookTxPlan() {
  const jsonStr = {
    PatientId: ShowPat.value ? choosePatItem.value.PatientId : itemVal.value.PatientId,
    DialysisType: modeId.value
  };
  swsApi.swsGet('SchedulingManage/4025', jsonStr).then((res) => {
    if (res.Code == 200) {
      TxPlanShow.value = true;
      if (ShowPat.value) {
        txPlanTitle.value = '查看患者【 ' + choosePatItem.value.PatientName + ' (' + choosePatItem.value.Sex + '  ' + choosePatItem.value.Age + '岁) 】' + BatchFormData.TreatmentModes + '模式的透析方案';
      } else {
        txPlanTitle.value = '查看患者【 ' + itemVal.value.PatientName + ' (' + itemVal.value.Sex + '  ' + itemVal.value.Age + '岁) 】' + BatchFormData.TreatmentModes + '模式的透析方案';
      }
      formValidata.value = res.Data;
    } else {
      ElMessage.warning({ message: '患者没有设置当前治疗模式对应的透析方案，请在透析方案页面中设置后再查看！', duration: 4.5 });
    }
  });
}

function saveEdit() {
  BatchFormDataRef.value?.validate(async (valid) => {
    if (!valid) return;
    if (showNotArrangePatient.value) {
      await onTemporaryArrange();
    } else {
      await onSaveEdit(BatchFormData.PatientCycleSchedulingId);
    }
  });
}

async function getPatientInfo(PatientId: string) {
  let result: any = {};
  try {
    const { Code, Data } = await swsApi.swsGet('SchedulingManage/4005', { Date: nowDate.value, SortName: '', Sort: '' });
    if (Code === 200) {
      const patient = Data.find((item: any) => item.Id === PatientId);
      result = patient || result;
    }
  } catch (e) {
    console.log(e);
  }
  return result;
}

async function onTemporaryArrange() {
  try {
    const { PatientCycleSchedulingId, Shift, TreatmentModes, Dialyzer, DialysisPerfusion, SickbedNo, EquipmentId } = BatchFormData;
    const { PatientType } = await getPatientInfo(PatientCycleSchedulingId);
    const params = {
      Date: nowDate.value,
      PatientId: PatientCycleSchedulingId,
      Shift,
      DialysisType: TreatmentModes,
      Dialyzer,
      DialysisPerfusion,
      SickbedNo,
      PatientType,
      EquipmentId
    };
    const { Code } = await swsApi.swsPost('SchedulingManage/1004', params);
    if (Code === 200) {
      await getPatientCycleSchedulingId(PatientCycleSchedulingId);
    }
  } catch (e) {
    console.log(e);
  }
}

async function getPatientCycleSchedulingId(PatientId: string) {
  try {
    const params = { Date: nowDate.value, Shift: '', PatientType: '', TreatmentRegion: '', OrderType: 1 };
    const { Code, Data } = await swsApi.swsGet('SchedulingManage/4017', params);
    if (Code === 200) {
      const temporaryArrange = Data.find((item: any) => item.PatientId === PatientId);
      if (temporaryArrange) {
        await onSaveEdit(temporaryArrange.PatientCycleSchedulingId);
      }
    }
  } catch (e) {
    console.log(e);
  }
}

async function onSaveEdit(PatientCycleSchedulingId: string) {
  const jsonStr = {
    Id: PatientCycleSchedulingId,
    DialysisType: BatchFormData.TreatmentModes,
    Dialyzer: BatchFormData.Dialyzer,
    DialysisPerfusion: BatchFormData.DialysisPerfusion,
    EquipmentId: BatchFormData.EquipmentId ? BatchFormData.EquipmentId : '',
    SickbedNo: BatchFormData.SickbedNo,
    Shift: BatchFormData.Shift
  };
  const res = await swsApi.swsPut('SchedulingManage/3012', jsonStr);
  if (res.Code == 200) {
    ElMessage.success(res.Msg);
    modeShow.value = false;
    getTabBody(false);
  }
}

function closeModal() {
  modeShow.value = false;
  BatchFormDataRef.value?.resetFields();
}

function getTdHtml(str: string) {
  return str.replace(/\[.*?\]/g, '');
}

function getTdPatientId(str: string) {
  const match = str.match(/\[(.*?)\]/);
  return match ? match[1] : null;
}

function isActiveId(item: any, value: string, i: number, key: string) {
  if (activeIds.value.length === 0) return false;
  const patientId = getTdPatientId(value.split('|')[1]);
  if (patientId) {
    if (activeIds.value[activeIdIndex.value] === `${item.No}_${key}_${i}_${patientId}`) {
      return true;
    }
  }
  return false;
}

function getActiveIds() {
  activeIds.value = [];
  activeIdIndex.value = 0;
  if (!SingleId.value) return;
  bodyList.value.forEach((item: any) => {
    for (const key in item) {
      if (key.includes('week_content') && showTd(key)) {
        const shiftData = item[key].split('@');
        shiftData.forEach((shift: string, index: number) => {
          const patientId = getTdPatientId(shift);
          if (patientId === SingleId.value) {
            activeIds.value.push(`${item.No}_${key}_${index}_${patientId}`);
          }
        });
      }
    }
  });
}

function onClickActiveId(key: string) {
  if (key === '+') {
    if (activeIdIndex.value === activeIds.value.length - 1) {
      if (activeIdIndex.value === 0) {
        scrollToActiveId();
      }
      activeIdIndex.value = 0;
    } else {
      activeIdIndex.value++;
    }
  }
  if (key === '-') {
    if (activeIdIndex.value === 0) {
      if (activeIdIndex.value === activeIds.value.length - 1) {
        scrollToActiveId();
      }
      activeIdIndex.value = activeIds.value.length - 1;
    } else {
      activeIdIndex.value--;
    }
  }
}

function scrollToActiveId() {
  if (activeIds.value.length === 0) return;
  const row = document.getElementById(activeIds.value[activeIdIndex.value]);
  if (!row) return;
  row.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// ==================== 生命周期 ====================

onMounted(() => {
  const date = new Date();
  date.setDate(1);
  const month1 = parseInt(String(date.getMonth() + 1));
  const day = date.getDate();
  const firstDay = date.getFullYear() + '-' + (month1 < 10 ? '0' + month1 : month1) + '-' + (day < 10 ? '0' + day : day);

  const currentMonth = date.getMonth();
  const nextMonth = ++currentMonth;
  const nextMonthFirstDay = new Date(date.getFullYear(), nextMonth, 1);
  const oneDay = 1000 * 60 * 60 * 24;
  const lastTime = new Date(nextMonthFirstDay.getTime() - oneDay);
  const month2 = parseInt(String(lastTime.getMonth() + 1));
  const day2 = lastTime.getDate();
  const lastDay = date.getFullYear() + '-' + (month2 < 10 ? '0' + month2 : month2) + '-' + (day2 < 10 ? '0' + day2 : day2);

  dateArr.value = [new Date(firstDay), new Date(lastDay)];
  dateArr1.value = [firstDay, lastDay];
  getTabHeader();
  getBaseData();
});

watch(SingleId, () => {
  getActiveIds();
});
</script>

<style scoped>
.sws_container {
  height: 100%;
}

.ftable {
  margin-top: 10px;
  height: calc(100% - 72px);
  overflow: auto;
}

.ftable table {
  table-layout: fixed;
  width: 100%;
}

.ftable .active-patient-td {
  background: #87ceeb !important;
}

.ftable .active-id {
  font-weight: 600;
}

.thead {
  position: sticky;
  top: 0;
  z-index: 1000;
}

.thead .line1 th:nth-child(-n + 4) {
  position: sticky;
}

.thead .line1 .test1, .thead .line1 .test2, .thead .line1 .test3, .thead .line1 .test4 {
  position: sticky;
}

.thead .line1 .test1 { left: 0; }
.thead .line1 .test2 { left: 55px; }
.thead .line1 .test3 { left: 110px; }
.thead .line1 .test4 { left: 165px; }

.fixed_td1, .fixed_td2, .fixed_td3, .fixed_td4 {
  position: sticky;
}

.fixed_td1 { left: 0; }
.fixed_td2 { left: 55px; }
.fixed_td3 { left: 110px; }
.fixed_td4 { left: 165px; }

tr th {
  background-color: #87ceeb;
  color: #495060;
  border: 1px solid #e9eaec;
  height: 43px;
  min-width: 55px;
  box-sizing: border-box;
  font-size: 13px;
}

tr td {
  border: 1px solid #e9eaec;
  height: 38px;
  line-height: 1;
  font-size: 14px;
  text-align: center;
  box-sizing: border-box;
  background-color: #fff;
  word-break: break-all;
}

tr td:hover {
  border-bottom: 1px solid green;
}

tr td:nth-of-type(1), tr td:nth-of-type(2) {
  border: 1px solid #e9eaec;
}

.isGgray {
  background: #f4f4f4;
}

.isGgray:hover {
  cursor: not-allowed;
}

.isDisable td {
  background-color: #dedede !important;
}

.th_wide {
  min-width: 150px !important;
}

.solu_info {
  padding: 10px;
  border: 1px solid #e9eaec;
  margin-bottom: 10px;
}
</style>
