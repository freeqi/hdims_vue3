<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';

import { Page } from '@vben/common-ui';

import { 
  ElCard, ElButton, ElTable, ElTableColumn, ElTag, ElDatePicker,
  ElSelect, ElOption, ElInput, ElPagination, ElMessage, ElTooltip,
  ElTabs, ElTabPane, ElDescriptions, ElDescriptionsItem, ElProgress
} from 'element-plus';

// 透析记录类型定义
interface DialysisRecord {
  Id: string;
  PatientId: string;
  PatientNo: string;
  Name: string;
  Sex: string;
  Age: number;
  FounderDate: string;
  DialysisType: string;
  ActualShift: string;
  BedNo: string;
  SerialNumber: string;
  TreatHour: number;
  Status: string;
  BloodBorneDisease?: string;
  TreatmentRegion?: string;
}

// 透析详情类型定义
interface DialysisDetail {
  RecordId: string;
  PatientInfo: any;
  CurrentDialysisProgramInfo: any;
  DoctorAdviceInfo: any[];
  ObserveRecordInfo: any[];
  PostPreTreatMessageInfo: any;
}

const router = useRouter();
const route = useRoute();

// 搜索和筛选条件
const founderDate = ref<[Date, Date] | null>(null);
const treatmentRegion = ref('');
const serialNumber = ref('');
const patientName = ref('');
const status = ref('');

// 分页
const currentPage = ref(1);
const pageSize = ref(20);
const total = ref(0);

// 加载状态
const loading = ref(false);

// 透析记录列表
const recordList = ref<DialysisRecord[]>([
  {
    Id: '1',
    PatientId: '1',
    PatientNo: '2024001001',
    Name: '张三',
    Sex: '男',
    Age: 58,
    FounderDate: '2026-05-10 14:30:00',
    DialysisType: '血液透析',
    ActualShift: '下午班',
    BedNo: 'A01',
    SerialNumber: 'HD001',
    TreatHour: 4,
    Status: '已完成',
    TreatmentRegion: 'A区',
  },
  {
    Id: '2',
    PatientId: '2',
    PatientNo: '2024001002',
    Name: '李四',
    Sex: '女',
    Age: 45,
    FounderDate: '2026-05-10 09:00:00',
    DialysisType: '血液透析滤过',
    ActualShift: '上午班',
    BedNo: 'A02',
    SerialNumber: 'HD002',
    TreatHour: 4,
    Status: '透析中',
    BloodBorneDisease: '乙肝',
    TreatmentRegion: 'A区',
  },
  {
    Id: '3',
    PatientId: '3',
    PatientNo: '2024001003',
    Name: '王五',
    Sex: '男',
    Age: 62,
    FounderDate: '2026-05-10 14:00:00',
    DialysisType: '血液透析',
    ActualShift: '下午班',
    BedNo: 'B01',
    SerialNumber: 'HD003',
    TreatHour: 4,
    Status: '待透析',
    TreatmentRegion: 'B区',
  },
  {
    Id: '4',
    PatientId: '4',
    PatientNo: '2024001004',
    Name: '赵六',
    Sex: '女',
    Age: 55,
    FounderDate: '2026-05-10 09:30:00',
    DialysisType: '血液灌流',
    ActualShift: '上午班',
    BedNo: 'B02',
    SerialNumber: 'HD004',
    TreatHour: 3,
    Status: '已完成',
    TreatmentRegion: 'B区',
  },
]);

// 分区列表
const treatmentRegionList = ref([
  { Id: '1', Name: 'A区' },
  { Id: '2', Name: 'B区' },
  { Id: '3', Name: 'C区' },
]);

// 床位/设备列表
const machineList = ref([
  { Id: '1', BedNo: 'A01', SerialNumber: 'HD001', EquipType: '285b4938d09d425d9bf2f5b0c6c657c1' },
  { Id: '2', BedNo: 'A02', SerialNumber: 'HD002', EquipType: '285b4938d09d425d9bf2f5b0c6c657c1' },
  { Id: '3', BedNo: 'B01', SerialNumber: 'HD003', EquipType: '285b4938d09d425d9bf2f5b0c6c657c1' },
  { Id: '4', BedNo: 'B02', SerialNumber: 'HD004', EquipType: '285b4938d09d425d9bf2f5b0c6c657c1' },
]);

// 选中的记录
const selectedRecords = ref<DialysisRecord[]>([]);

// 当前查看的记录详情
const currentRecord = ref<DialysisRecord | null>(null);
const recordDetail = ref<DialysisDetail | null>(null);

// 状态标签类型映射
const statusTagType: Record<string, 'success' | 'warning' | 'info' | 'danger'> = {
  '已完成': 'success',
  '透析中': 'warning',
  '待透析': 'info',
  '已取消': 'danger',
};

// 筛选后的记录列表
const filteredRecords = computed(() => {
  let data = recordList.value;
  
  if (patientName.value) {
    data = data.filter(item => item.Name.includes(patientName.value));
  }
  
  if (treatmentRegion.value) {
    data = data.filter(item => item.TreatmentRegion === treatmentRegion.value);
  }
  
  if (serialNumber.value) {
    data = data.filter(item => item.SerialNumber === serialNumber.value);
  }
  
  if (status.value) {
    data = data.filter(item => item.Status === status.value);
  }
  
  return data;
});

// 搜索
function handleSearch() {
  loading.value = true;
  setTimeout(() => {
    loading.value = false;
    total.value = filteredRecords.value.length;
  }, 500);
}

// 重置搜索
function handleReset() {
  founderDate.value = null;
  treatmentRegion.value = '';
  serialNumber.value = '';
  patientName.value = '';
  status.value = '';
  handleSearch();
}

// 查看记录详情
function viewRecord(record: DialysisRecord) {
  currentRecord.value = record;
  // 模拟加载详情数据
  recordDetail.value = {
    RecordId: record.Id,
    PatientInfo: {
      Name: record.Name,
      Sex: record.Sex,
      Age: record.Age,
      PatientNo: record.PatientNo,
    },
    CurrentDialysisProgramInfo: {
      DialysisType: record.DialysisType,
      TreatHour: record.TreatHour,
    },
    DoctorAdviceInfo: [],
    ObserveRecordInfo: [],
    PostPreTreatMessageInfo: {},
  };
}

// 编辑记录
function editRecord(record: DialysisRecord) {
  router.push(`/dialysis/record/edit/${record.Id}`);
}

// 新增记录
function addRecord() {
  router.push('/dialysis/record/edit');
}

// 多选打印
function handleMultiPrint() {
  if (selectedRecords.value.length === 0) {
    ElMessage.warning('请选择要打印的记录');
    return;
  }
  ElMessage.success(`已选择 ${selectedRecords.value.length} 条记录进行打印`);
}

// 导出
function handleExport() {
  ElMessage.success('导出成功');
}

// 选择变化
function handleSelectionChange(selection: DialysisRecord[]) {
  selectedRecords.value = selection;
}

// 分页变化
function handlePageChange(page: number) {
  currentPage.value = page;
}

function handleSizeChange(size: number) {
  pageSize.value = size;
  currentPage.value = 1;
}

// 返回列表
function backToList() {
  currentRecord.value = null;
  recordDetail.value = null;
}

onMounted(() => {
  total.value = recordList.value.length;
});
</script>

<template>
  <Page title="透析记录" class="dialysis-record">
    <div class="flex gap-4">
      <!-- 左侧记录列表 -->
      <ElCard class="flex-1">
        <template #header>
          <div class="flex items-center justify-between">
            <span>透析记录列表</span>
            <div class="flex gap-2">
              <ElButton type="primary" @click="addRecord">+ 新增记录</ElButton>
              <ElButton @click="handleMultiPrint">多选打印</ElButton>
              <ElButton @click="handleExport">导出</ElButton>
            </div>
          </div>
        </template>

        <!-- 搜索筛选区 -->
        <div class="mb-4 flex flex-wrap gap-4">
          <ElDatePicker
            v-model="founderDate"
            type="daterange"
            placeholder="选择日期范围"
            style="width: 240px;"
          />
          <ElSelect
            v-model="treatmentRegion"
            placeholder="选择分区"
            clearable
            style="width: 120px;"
          >
            <ElOption
              v-for="item in treatmentRegionList"
              :key="item.Id"
              :value="item.Name"
              :label="item.Name"
            />
          </ElSelect>
          <ElSelect
            v-model="serialNumber"
            placeholder="选择床位"
            clearable
            style="width: 140px;"
          >
            <ElOption
              v-for="item in machineList"
              :key="item.Id"
              :value="item.SerialNumber"
              :label="`${item.BedNo} (${item.SerialNumber})`"
            />
          </ElSelect>
          <ElInput
            v-model="patientName"
            placeholder="输入患者姓名"
            clearable
            style="width: 160px;"
          />
          <ElSelect
            v-model="status"
            placeholder="透析状态"
            clearable
            style="width: 120px;"
          >
            <ElOption value="透析中" label="透析中" />
            <ElOption value="已完成" label="已完成" />
            <ElOption value="待透析" label="待透析" />
            <ElOption value="已取消" label="已取消" />
          </ElSelect>
          <ElButton type="primary" @click="handleSearch">搜索</ElButton>
          <ElButton @click="handleReset">重置</ElButton>
        </div>

        <!-- 记录表格 -->
        <ElTable
          :data="filteredRecords"
          stripe
          border
          v-loading="loading"
          @selection-change="handleSelectionChange"
        >
          <ElTableColumn type="selection" width="55" />
          <ElTableColumn prop="PatientNo" label="病案号" width="120" />
          <ElTableColumn prop="Name" label="姓名" width="100">
            <template #default="{ row }">
              <div class="flex items-center gap-1">
                <span :class="row.Sex === '女' ? 'text-pink-500' : 'text-blue-500'">
                  {{ row.Sex === '女' ? '♀' : '♂' }}
                </span>
                {{ row.Name }}
                <ElTag v-if="row.BloodBorneDisease" type="danger" size="small">
                  {{ row.BloodBorneDisease }}
                </ElTag>
              </div>
            </template>
          </ElTableColumn>
          <ElTableColumn prop="FounderDate" label="透析日期" width="180">
            <template #default="{ row }">
              {{ row.FounderDate.substring(0, 16).replace('T', ' ') }}
            </template>
          </ElTableColumn>
          <ElTableColumn prop="DialysisType" label="透析方式" width="120" />
          <ElTableColumn prop="ActualShift" label="班次" width="90" />
          <ElTableColumn prop="BedNo" label="床位号" width="80" />
          <ElTableColumn prop="TreatHour" label="时长" width="80">
            <template #default="{ row }">
              {{ row.TreatHour }}h
            </template>
          </ElTableColumn>
          <ElTableColumn prop="Status" label="状态" width="90">
            <template #default="{ row }">
              <ElTag :type="statusTagType[row.Status] || 'info'">
                {{ row.Status }}
              </ElTag>
            </template>
          </ElTableColumn>
          <ElTableColumn label="操作" width="150" fixed="right">
            <template #default="{ row }">
              <ElButton type="primary" link @click="viewRecord(row)">查看</ElButton>
              <ElButton type="primary" link @click="editRecord(row)">编辑</ElButton>
            </template>
          </ElTableColumn>
        </ElTable>

        <!-- 分页 -->
        <div class="mt-4 flex justify-end">
          <ElPagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :total="total"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            @current-change="handlePageChange"
            @size-change="handleSizeChange"
          />
        </div>
      </ElCard>

      <!-- 右侧详情面板（可选显示） -->
      <ElCard v-if="currentRecord" class="w-96 flex-shrink-0">
        <template #header>
          <div class="flex items-center justify-between">
            <span>记录详情</span>
            <ElButton link @click="backToList">关闭</ElButton>
          </div>
        </template>

        <ElDescriptions :column="1" border size="small">
          <ElDescriptionsItem label="患者姓名">{{ currentRecord.Name }}</ElDescriptionsItem>
          <ElDescriptionsItem label="病案号">{{ currentRecord.PatientNo }}</ElDescriptionsItem>
          <ElDescriptionsItem label="透析日期">{{ currentRecord.FounderDate.substring(0, 10) }}</ElDescriptionsItem>
          <ElDescriptionsItem label="透析方式">{{ currentRecord.DialysisType }}</ElDescriptionsItem>
          <ElDescriptionsItem label="班次">{{ currentRecord.ActualShift }}</ElDescriptionsItem>
          <ElDescriptionsItem label="床位号">{{ currentRecord.BedNo }}</ElDescriptionsItem>
          <ElDescriptionsItem label="透析时长">{{ currentRecord.TreatHour }}小时</ElDescriptionsItem>
          <ElDescriptionsItem label="状态">
            <ElTag :type="statusTagType[currentRecord.Status]">{{ currentRecord.Status }}</ElTag>
          </ElDescriptionsItem>
        </ElDescriptions>

        <div class="mt-4 flex gap-2">
          <ElButton type="primary" @click="editRecord(currentRecord)">编辑记录</ElButton>
          <ElButton>打印记录单</ElButton>
        </div>
      </ElCard>
    </div>
  </Page>
</template>

<style scoped>
.dialysis-record {
  :deep(.el-card__header) {
    padding: 12px 20px;
  }
}
</style>
