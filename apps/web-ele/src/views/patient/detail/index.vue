<script lang="ts" setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import { 
  ElCard, ElTabs, ElTabPane, ElButton, ElTag, ElDescriptions, ElDescriptionsItem,
  ElTimeline, ElTimelineItem, ElTable, ElTableColumn, ElEmpty, ElImage, ElMessage
} from 'element-plus';

// 患者信息类型定义
interface PatientInfo {
  Id: string;
  PatientNo: string;
  PatientFileNo: string;
  PatientZYNo?: string;
  Name: string;
  Alias?: string;
  Sex: string;
  Age: number;
  Birthday: string;
  CardType?: string;
  CardNum?: string;
  Nation?: string;
  Professional?: string;
  EducationBackground?: string;
  Marital?: string;
  WorkUnit?: string;
  CensusRegister?: string;
  Height?: number;
  ContactPhone?: string;
  ContactAddress?: string;
  EmergencyContact1?: string;
  EmergencyContactNumber1?: string;
  Relationship1?: string;
  EmergencyContact2?: string;
  EmergencyContactNumber2?: string;
  Relationship2?: string;
  HospitalState: string;
  ReceiveDate?: string;
  BloodBorneDiseaseId?: string;
  BloodBorneDisease?: string;
  FeatureByPhot?: string;
  Remark?: string;
}

// 透析记录类型定义
interface DialysisRecord {
  Id: string;
  PatientId: string;
  FounderDate: string;
  DialysisType: string;
  ActualShift: string;
  BedNo?: string;
  SerialNumber?: string;
  TreatHour?: number;
  Status: string;
}

const route = useRoute();
const router = useRouter();
const patientId = route.params.id as string;

// 当前激活的标签页
const activeTab = ref('basic');

// 患者基本信息
const patientInfo = ref<PatientInfo>({
  Id: patientId,
  PatientNo: '2024001001',
  PatientFileNo: 'F001',
  PatientZYNo: 'ZY20240001',
  Name: '张三',
  Alias: '小张',
  Sex: '男',
  Age: 58,
  Birthday: '1966-05-15',
  CardType: '身份证',
  CardNum: '510***********1234',
  Nation: '汉族',
  Professional: '退休人员',
  EducationBackground: '高中',
  Marital: '已婚',
  WorkUnit: '某机械厂',
  CensusRegister: '四川省成都市',
  Height: 170,
  ContactPhone: '138****1234',
  ContactAddress: '四川省成都市武侯区XX路XX号',
  EmergencyContact1: '张某某',
  EmergencyContactNumber1: '139****5678',
  Relationship1: '父子',
  EmergencyContact2: '李某某',
  EmergencyContactNumber2: '137****9012',
  Relationship2: '配偶',
  HospitalState: '在院',
  ReceiveDate: '2024-01-15',
  BloodBorneDiseaseId: null,
  BloodBorneDisease: null,
  Remark: '患者配合度良好',
});

// 透析历史记录
const dialysisRecords = ref<DialysisRecord[]>([
  {
    Id: '1',
    PatientId: patientId,
    FounderDate: '2026-05-10 14:30:00',
    DialysisType: '血液透析',
    ActualShift: '下午班',
    BedNo: 'A01',
    SerialNumber: 'HD001',
    TreatHour: 4,
    Status: '已完成',
  },
  {
    Id: '2',
    PatientId: patientId,
    FounderDate: '2026-05-07 09:00:00',
    DialysisType: '血液透析滤过',
    ActualShift: '上午班',
    BedNo: 'A01',
    SerialNumber: 'HD001',
    TreatHour: 4,
    Status: '已完成',
  },
  {
    Id: '3',
    PatientId: patientId,
    FounderDate: '2026-05-04 14:30:00',
    DialysisType: '血液透析',
    ActualShift: '下午班',
    BedNo: 'B02',
    SerialNumber: 'HD002',
    TreatHour: 4,
    Status: '已完成',
  },
]);

// 计算属性：性别标签类型
const sexTagType = computed(() => {
  return patientInfo.value.Sex === '男' ? 'primary' : 'danger';
});

// 计算属性：在院状态标签类型
const hospitalStateTagType = computed(() => {
  return patientInfo.value.HospitalState === '在院' ? 'success' : 'info';
});

// 返回列表
function goBack() {
  router.push('/patient/list');
}

// 编辑患者
function handleEdit() {
  router.push(`/patient/edit/${patientId}`);
}

// 查看透析记录详情
function viewDialysisRecord(recordId: string) {
  router.push(`/dialysis/record/detail/${recordId}`);
}

// 新增透析记录
function addDialysisRecord() {
  router.push(`/dialysis/record/edit?patientId=${patientId}`);
}

// 导出患者信息
function exportPatientInfo() {
  ElMessage.success('导出患者信息成功');
}

// 打印患者档案
function printPatientRecord() {
  ElMessage.success('打印患者档案成功');
}
</script>

<template>
  <Page :title="`患者详情 - ${patientInfo.Name}`" class="patient-detail">
    <template #header-actions>
      <div class="flex gap-2">
        <ElButton @click="goBack">返回列表</ElButton>
        <ElButton @click="exportPatientInfo">导出信息</ElButton>
        <ElButton @click="printPatientRecord">打印档案</ElButton>
        <ElButton type="primary" @click="handleEdit">编辑患者</ElButton>
      </div>
    </template>

    <!-- 患者基本信息卡片 -->
    <ElCard class="mb-4">
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <!-- 患者头像 -->
            <div class="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center text-2xl text-gray-500">
              {{ patientInfo.Name.charAt(0) }}
            </div>
            <div>
              <div class="flex items-center gap-2 text-xl font-bold">
                {{ patientInfo.Name }}
                <ElTag :type="sexTagType" size="small">{{ patientInfo.Sex }}</ElTag>
                <ElTag :type="hospitalStateTagType" size="small">{{ patientInfo.HospitalState }}</ElTag>
                <ElTag v-if="patientInfo.BloodBorneDisease" type="danger" size="small">
                  {{ patientInfo.BloodBorneDisease }}
                </ElTag>
              </div>
              <div class="text-gray-500 text-sm mt-1">
                病案号：{{ patientInfo.PatientNo }} | 
                病历夹：{{ patientInfo.PatientFileNo }} | 
                年龄：{{ patientInfo.Age }}岁
              </div>
            </div>
          </div>
        </div>
      </template>

      <ElTabs v-model="activeTab">
        <!-- 基本信息 -->
        <ElTabPane label="基本信息" name="basic">
          <ElDescriptions :column="3" border>
            <ElDescriptionsItem label="姓名">{{ patientInfo.Name }}</ElDescriptionsItem>
            <ElDescriptionsItem label="别名">{{ patientInfo.Alias || '-' }}</ElDescriptionsItem>
            <ElDescriptionsItem label="性别">{{ patientInfo.Sex }}</ElDescriptionsItem>
            <ElDescriptionsItem label="出生日期">{{ patientInfo.Birthday }}</ElDescriptionsItem>
            <ElDescriptionsItem label="年龄">{{ patientInfo.Age }}岁</ElDescriptionsItem>
            <ElDescriptionsItem label="民族">{{ patientInfo.Nation || '-' }}</ElDescriptionsItem>
            <ElDescriptionsItem label="证件类型">{{ patientInfo.CardType || '-' }}</ElDescriptionsItem>
            <ElDescriptionsItem label="证件号码">{{ patientInfo.CardNum || '-' }}</ElDescriptionsItem>
            <ElDescriptionsItem label="职业">{{ patientInfo.Professional || '-' }}</ElDescriptionsItem>
            <ElDescriptionsItem label="学历">{{ patientInfo.EducationBackground || '-' }}</ElDescriptionsItem>
            <ElDescriptionsItem label="婚姻状况">{{ patientInfo.Marital || '-' }}</ElDescriptionsItem>
            <ElDescriptionsItem label="身高">{{ patientInfo.Height ? patientInfo.Height + 'cm' : '-' }}</ElDescriptionsItem>
            <ElDescriptionsItem label="工作单位" :span="2">{{ patientInfo.WorkUnit || '-' }}</ElDescriptionsItem>
            <ElDescriptionsItem label="籍贯">{{ patientInfo.CensusRegister || '-' }}</ElDescriptionsItem>
            <ElDescriptionsItem label="备注" :span="3">{{ patientInfo.Remark || '-' }}</ElDescriptionsItem>
          </ElDescriptions>
        </ElTabPane>

        <!-- 联系方式 -->
        <ElTabPane label="联系方式" name="contact">
          <ElDescriptions :column="3" border>
            <ElDescriptionsItem label="本人联系电话">{{ patientInfo.ContactPhone || '-' }}</ElDescriptionsItem>
            <ElDescriptionsItem label="本人联系地址" :span="2">{{ patientInfo.ContactAddress || '-' }}</ElDescriptionsItem>
            <ElDescriptionsItem label="紧急联系人1">{{ patientInfo.EmergencyContact1 || '-' }}</ElDescriptionsItem>
            <ElDescriptionsItem label="紧急联系电话1">{{ patientInfo.EmergencyContactNumber1 || '-' }}</ElDescriptionsItem>
            <ElDescriptionsItem label="与联系人关系1">{{ patientInfo.Relationship1 || '-' }}</ElDescriptionsItem>
            <ElDescriptionsItem label="紧急联系人2">{{ patientInfo.EmergencyContact2 || '-' }}</ElDescriptionsItem>
            <ElDescriptionsItem label="紧急联系电话2">{{ patientInfo.EmergencyContactNumber2 || '-' }}</ElDescriptionsItem>
            <ElDescriptionsItem label="与联系人关系2">{{ patientInfo.Relationship2 || '-' }}</ElDescriptionsItem>
          </ElDescriptions>
        </ElTabPane>

        <!-- 诊疗信息 -->
        <ElTabPane label="诊疗信息" name="medical">
          <ElDescriptions :column="3" border>
            <ElDescriptionsItem label="患者编号">{{ patientInfo.PatientNo }}</ElDescriptionsItem>
            <ElDescriptionsItem label="病历夹编号">{{ patientInfo.PatientFileNo }}</ElDescriptionsItem>
            <ElDescriptionsItem label="住院号">{{ patientInfo.PatientZYNo || '-' }}</ElDescriptionsItem>
            <ElDescriptionsItem label="接诊日期">{{ patientInfo.ReceiveDate || '-' }}</ElDescriptionsItem>
            <ElDescriptionsItem label="在院状态">
              <ElTag :type="hospitalStateTagType">{{ patientInfo.HospitalState }}</ElTag>
            </ElDescriptionsItem>
            <ElDescriptionsItem label="血源性传染病">
              <ElTag v-if="patientInfo.BloodBorneDisease" type="danger">
                {{ patientInfo.BloodBorneDisease }}
              </ElTag>
              <span v-else>无</span>
            </ElDescriptionsItem>
          </ElDescriptions>
        </ElTabPane>

        <!-- 透析历史 -->
        <ElTabPane label="透析历史" name="dialysis">
          <div class="mb-4">
            <ElButton type="primary" @click="addDialysisRecord">+ 新增透析记录</ElButton>
          </div>
          
          <ElTable :data="dialysisRecords" stripe border>
            <ElTableColumn prop="FounderDate" label="透析日期" width="180">
              <template #default="{ row }">
                {{ row.FounderDate.substring(0, 10) }}
              </template>
            </ElTableColumn>
            <ElTableColumn prop="DialysisType" label="透析方式" width="140" />
            <ElTableColumn prop="ActualShift" label="班次" width="100" />
            <ElTableColumn prop="BedNo" label="床位号" width="90" />
            <ElTableColumn prop="TreatHour" label="透析时长" width="100">
              <template #default="{ row }">
                {{ row.TreatHour }}小时
              </template>
            </ElTableColumn>
            <ElTableColumn prop="Status" label="状态" width="100">
              <template #default="{ row }">
                <ElTag :type="row.Status === '已完成' ? 'success' : 'warning'">
                  {{ row.Status }}
                </ElTag>
              </template>
            </ElTableColumn>
            <ElTableColumn label="操作" width="120" fixed="right">
              <template #default="{ row }">
                <ElButton type="primary" link @click="viewDialysisRecord(row.Id)">
                  查看详情
                </ElButton>
              </template>
            </ElTableColumn>
          </ElTable>
        </ElTabPane>
      </ElTabs>
    </ElCard>
  </Page>
</template>

<style scoped>
.patient-detail {
  :deep(.el-card__header) {
    padding: 16px 20px;
  }
  
  :deep(.el-descriptions__label) {
    font-weight: 500;
    background-color: #f5f7fa;
  }
}
</style>
