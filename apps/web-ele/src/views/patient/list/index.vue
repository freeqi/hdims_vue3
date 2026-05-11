<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import { ElButton, ElCard, ElInput, ElMessage, ElSelect, ElOption, ElTooltip, ElTag, ElSwitch } from 'element-plus';

// 患者数据类型定义
interface Patient {
  Id: string;
  PatientNo: string;
  PatientFileNo?: string;
  Name: string;
  Sex: string;
  Age: number;
  Birthday?: string;
  BloodBorneDiseaseId?: string;
  BloodBorneDisease?: string;
  IsTemporaryPatient?: boolean;
  IsFocus?: boolean;
  InHospital?: boolean;
}

const router = useRouter();

// 搜索和筛选状态
const patSearch = ref('');
const staType = ref(1); // 0:全部, 1:在院, 2:其他
const labelId = ref(1);
const isChargeDoctor = ref(false);
const isloading = ref(false);

// 统计数据
const allNum = ref(0);
const inNum = ref(0);

// 当前选中患者
const now = ref('');

// 患者标签列表
const labelArr = ref([
  { Id: '1', Name: '高危患者' },
  { Id: '2', Name: '新入患者' },
  { Id: '3', Name: '长期患者' },
]);

// 模拟患者数据（实际应从API获取）
const staList = ref<Patient[]>([
  {
    Id: '1',
    PatientNo: '2024001001',
    PatientFileNo: 'F001',
    Name: '张三',
    Sex: '男',
    Age: 58,
    BloodBorneDiseaseId: null,
    IsTemporaryPatient: false,
    IsFocus: true,
    InHospital: true,
  },
  {
    Id: '2',
    PatientNo: '2024001002',
    PatientFileNo: 'F002',
    Name: '李四',
    Sex: '女',
    Age: 45,
    BloodBorneDiseaseId: '589cbbd2821b498fa2d5dbe9184d3691',
    BloodBorneDisease: '乙肝',
    IsTemporaryPatient: false,
    IsFocus: false,
    InHospital: true,
  },
  {
    Id: '3',
    PatientNo: '2024001003',
    Name: '王五',
    Sex: '男',
    Age: 62,
    BloodBorneDiseaseId: null,
    IsTemporaryPatient: true,
    IsFocus: false,
    InHospital: false,
  },
]);

// 表头配置
const spanList = [
  { name: '病案号', key: 'PatientNo', width1: '30%', width2: '40%', id: 1 },
  { name: '病历夹', key: 'PatientFileNo', width1: '25%', width2: '25%', id: 2 },
  { name: '年龄', key: 'Age', width1: '20%', width2: '25%', id: 3 },
  { name: '姓名', key: 'Name', width1: '30%', width2: '40%', id: 4 },
];

// 是否显示病历夹列
const PatientFileNo = ref(1);

// 排序状态
const Statues = ref<number | null>(null);
const idRecord = ref<number | null>(null);

// 筛选后的患者列表
const filterData = computed(() => {
  let data = staList.value;
  
  // 按在院状态筛选
  if (staType.value === 1) {
    data = data.filter(item => item.InHospital);
  } else if (staType.value === 2) {
    data = data.filter(item => !item.InHospital);
  }
  
  // 按搜索关键词筛选
  if (patSearch.value) {
    const keyword = patSearch.value.toLowerCase();
    data = data.filter(item => 
      item.Name.toLowerCase().includes(keyword) ||
      item.PatientNo.toLowerCase().includes(keyword)
    );
  }
  
  // 按主管医生筛选（模拟）
  if (isChargeDoctor.value) {
    data = data.filter(item => item.IsFocus);
  }
  
  return data;
});

// 选择患者
function selectPat(id: string) {
  now.value = id;
  // 可以触发父组件事件或跳转到患者详情
  router.push(`/patient/detail/${id}`);
}

// 排序功能
function NumChange(key: string, id: number, status: number) {
  Statues.value = status;
  idRecord.value = id;
  
  // 实现排序逻辑
  staList.value.sort((a: any, b: any) => {
    if (status === 1) {
      return a[key] > b[key] ? 1 : -1;
    } else {
      return a[key] < b[key] ? 1 : -1;
    }
  });
}

// 加载患者数据
function loadAll() {
  isloading.value = true;
  // 模拟API调用
  setTimeout(() => {
    allNum.value = staList.value.length;
    inNum.value = staList.value.filter(item => item.InHospital).length;
    isloading.value = false;
  }, 500);
}

// 选择患者标签
function chooseLabel(val: string) {
  console.log('选择标签:', val);
}

// 状态类型改变
function secStaType(val: number) {
  console.log('状态类型:', val);
}

// 新增患者
function handleAdd() {
  router.push('/patient/edit');
}

// 查看患者
function handleView(patient: Patient) {
  router.push(`/patient/detail/${patient.Id}`);
}

onMounted(() => {
  loadAll();
});
</script>

<template>
  <Page title="患者管理" class="patient-management">
    <div class="flex gap-4">
      <!-- 左侧患者列表 -->
      <ElCard class="w-80 flex-shrink-0">
        <template #header>
          <div class="flex items-center justify-between">
            <span>患者列表</span>
            <ElButton type="primary" size="small" @click="handleAdd">+ 新增</ElButton>
          </div>
        </template>
        
        <!-- 搜索框 -->
        <ElInput
          v-model="patSearch"
          :placeholder="'搜索患者...'"
          class="mb-4"
          clearable
        />
        
        <!-- 筛选条件 -->
        <div class="flex gap-2 mb-4">
          <ElSelect v-model="staType" @change="secStaType" style="width: 50%;">
            <ElOption :value="0" :label="`全部(${allNum})`" />
            <ElOption :value="1" :label="`在院(${inNum})`" />
            <ElOption :value="2" :label="`其他(${allNum - inNum})`" />
          </ElSelect>
          <ElSelect v-model="labelId" @change="chooseLabel" placeholder="患者标签" style="width: 50%;">
            <ElOption :value="1" label="全部" />
            <ElOption v-for="item in labelArr" :key="item.Id" :value="item.Id" :label="item.Name" />
          </ElSelect>
        </div>
        
        <!-- 只看主管患者 -->
        <div class="flex items-center gap-2 mb-4">
          <ElTooltip content="只查看当前账号主管的患者">
            <ElSwitch v-model="isChargeDoctor" @change="loadAll" />
          </ElTooltip>
          <span class="text-sm text-gray-600">只看主管患者</span>
        </div>
        
        <!-- 表头 -->
        <div class="flex border-b pb-2 mb-2 text-sm font-medium text-gray-700">
          <span 
            v-for="item in spanList" 
            :key="item.id"
            class="px-1 cursor-pointer hover:text-blue-500"
            :style="{ width: PatientFileNo==1 ? item.width1 : item.width2 }"
            :class="{ 'hidden': PatientFileNo!=1 && item.id==2 }"
            @click="NumChange(item.key, item.id, Statues === 1 ? 2 : 1)"
          >
            {{ item.name }}
            <span v-if="idRecord === item.id" class="text-blue-500">
              {{ Statues === 1 ? '↑' : '↓' }}
            </span>
          </span>
        </div>
        
        <!-- 患者列表 -->
        <div v-loading="isloading" class="max-h-96 overflow-y-auto">
          <div
            v-for="(item, index) in filterData"
            :key="item.Id"
            class="flex py-2 px-1 cursor-pointer hover:bg-gray-100 text-sm"
            :class="{ 
              'bg-blue-50': item.Id === now,
              'bg-gray-50': index % 2 === 1,
              'border-l-4 border-orange-400': item.IsTemporaryPatient
            }"
            @click="selectPat(item.Id)"
          >
            <!-- 临时患者标识 -->
            <span v-if="item.IsTemporaryPatient" class="absolute left-0 w-1 h-full bg-orange-400"></span>
            
            <!-- 病案号 -->
            <span 
              class="px-1 truncate"
              :style="{ width: PatientFileNo==1 ? '30%' : '40%' }"
            >
              {{ item.PatientNo }}
            </span>
            
            <!-- 病历夹 -->
            <span 
              v-if="PatientFileNo==1"
              class="px-1 truncate"
              style="width: 25%;"
            >
              {{ item.PatientFileNo }}
            </span>
            
            <!-- 年龄 -->
            <span 
              class="px-1 text-green-600"
              :style="{ width: PatientFileNo==1 ? '20%' : '25%' }"
            >
              {{ item.Age }}
            </span>
            
            <!-- 姓名 -->
            <span 
              class="px-1 truncate flex items-center gap-1"
              :style="{ width: PatientFileNo==1 ? '30%' : '40%' }"
            >
              <!-- 性别图标 -->
              <span v-if="item.Sex === '女'" class="text-pink-500">♀</span>
              <span v-else class="text-blue-500">♂</span>
              
              {{ item.Name }}
              
              <!-- 传染病标识 -->
              <ElTag 
                v-if="item.BloodBorneDiseaseId && item.BloodBorneDiseaseId !== '589cbbd2821b498fa2d5dbe9184d3691'" 
                type="danger" 
                size="small"
                class="ml-1"
              >
                {{ item.BloodBorneDisease }}
              </ElTag>
            </span>
          </div>
          
          <!-- 无数据提示 -->
          <div v-if="filterData.length === 0" class="text-center text-gray-500 py-8">
            暂无数据！
          </div>
        </div>
      </ElCard>
      
      <!-- 右侧内容区 -->
      <ElCard class="flex-1">
        <template #header>
          <div class="flex items-center justify-between">
            <span>患者详细信息</span>
            <div class="flex gap-2">
              <ElButton type="primary" @click="handleAdd">新增患者</ElButton>
              <ElButton>导入</ElButton>
              <ElButton>导出</ElButton>
            </div>
          </div>
        </template>
        
        <div class="text-center text-gray-500 py-20">
          <p class="text-lg mb-2">请选择左侧患者查看详情</p>
          <p class="text-sm">或点击"新增患者"创建新患者档案</p>
        </div>
      </ElCard>
    </div>
  </Page>
</template>

<style scoped>
.patient-management {
  :deep(.el-card__header) {
    padding: 12px 20px;
  }
  
  :deep(.el-card__body) {
    padding: 16px;
  }
}
</style>
