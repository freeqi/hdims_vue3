<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue';
import {
  ElTable,
  ElTableColumn,
  ElButton,
  ElSelect,
  ElDatePicker,
  ElInput,
  ElDialog,
  ElForm,
  ElFormItem,
  ElOption,
  ElMessage,
  ElMessageBox,
  ElPagination,
} from 'element-plus';
import type { FormInstance } from 'element-plus';

// ==================== 类型定义 ====================

interface ScheduleItem {
  id: string;
  bedNo: string;
  patientName: string;
  patientId: string;
  gender: string;
  age: number;
  treatmentArea: string;
  shift: string;
  treatmentMode: string;
  dialyzer: string;
  perfusor: string;
  anticoagulant: string;
  vascularAccess: string;
  status: string;
  date: string;
}

interface ScheduleFormData {
  patientId: string;
  patientName: string;
  bedNo: string;
  date: string;
  shift: string;
  treatmentArea: string;
  treatmentMode: string;
  dialyzer: string;
  perfusor: string;
  anticoagulant: string;
  vascularAccess: string;
}

// ==================== 常量 ====================

const SHIFT_OPTIONS = [
  { label: '上午', value: '上午' },
  { label: '下午', value: '下午' },
  { label: '晚上', value: '晚上' },
];

const AREA_OPTIONS = [
  { label: '一区', value: '一区' },
  { label: '二区', value: '二区' },
  { label: '三区', value: '三区' },
  { label: '四区', value: '四区' },
];

const TREATMENT_MODE_OPTIONS = [
  { label: 'HD', value: 'HD' },
  { label: 'HDF', value: 'HDF' },
  { label: 'HD+HP', value: 'HD+HP' },
  { label: 'CRRT', value: 'CRRT' },
  { label: 'HF', value: 'HF' },
];

const DIALYZER_OPTIONS = [
  { label: 'FX80', value: 'FX80' },
  { label: 'FX100', value: 'FX100' },
  { label: 'F60S', value: 'F60S' },
  { label: 'F80S', value: 'F80S' },
];

const ANTICOAGULANT_OPTIONS = [
  { label: '普通肝素', value: '普通肝素' },
  { label: '低分子肝素', value: '低分子肝素' },
  { label: '无肝素', value: '无肝素' },
  { label: '局部枸橼酸', value: '局部枸橼酸' },
];

const VASCULAR_ACCESS_OPTIONS = [
  { label: '动静脉内瘘', value: '动静脉内瘘' },
  { label: '中心静脉导管', value: '中心静脉导管' },
  { label: '人造血管', value: '人造血管' },
  { label: '直接穿刺', value: '直接穿刺' },
];

const STATUS_MAP: Record<string, { text: string; type: string }> = {
  已排: { text: '已排', type: 'info' },
  未排: { text: '未排', type: 'warning' },
  已签到: { text: '已签到', type: 'primary' },
  透析中: { text: '透析中', type: 'success' },
  已完成: { text: '已完成', type: '' },
};

// ==================== 状态 ====================

const loading = ref(false);
const tableData = ref<ScheduleItem[]>([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(20);

// 搜索条件
const searchDate = ref(new Date());
const searchShift = ref('');
const searchAreas = ref<string[]>([]);
const searchKeyword = ref('');

// 弹窗
const dialogVisible = ref(false);
const dialogTitle = ref('新增排班');
const formRef = ref<FormInstance>();
const formData = reactive<ScheduleFormData>({
  patientId: '',
  patientName: '',
  bedNo: '',
  date: '',
  shift: '',
  treatmentArea: '',
  treatmentMode: '',
  dialyzer: '',
  perfusor: '',
  anticoagulant: '',
  vascularAccess: '',
});

const formRules = reactive({
  patientId: [{ required: true, message: '请选择患者', trigger: 'change' }],
  bedNo: [{ required: true, message: '请选择床位', trigger: 'change' }],
  date: [{ required: true, message: '请选择日期', trigger: 'change' }],
  shift: [{ required: true, message: '请选择班次', trigger: 'change' }],
  treatmentMode: [{ required: true, message: '请选择治疗模式', trigger: 'change' }],
  anticoagulant: [{ required: true, message: '请选择抗凝剂', trigger: 'change' }],
});

// ==================== API 配置 ====================

// 请求头配置（后续从store或cookie中获取）
function getHeaders() {
  return {
    Account: '',
    Token: '',
    ClientType: 'Web',
    OrgId: '',
    OrgAuthCode: '',
    Department: '',
  };
}

// ==================== API 调用（已注释，使用mock数据） ====================

// import axios from 'axios';

// /** 获取排班列表 */
// async function fetchScheduleList() {
//   loading.value = true;
//   try {
//     const params = {
//       Date: formatDate(searchDate.value),
//       Shift: searchShift.value,
//       PatientType: '',
//       TreatmentRegion: searchAreas.value.join(','),
//       OrderType: '',
//       PageIndex: currentPage.value,
//       PageSize: pageSize.value,
//     };
//     const res = await axios.get('/api/v1/SchedulingManage/4017', {
//       params,
//       headers: getHeaders(),
//     });
//     if (res.data?.Code === 0) {
//       tableData.value = res.data.Data?.List ?? [];
//       total.value = res.data.Data?.Total ?? 0;
//     }
//   } catch (error) {
//     ElMessage.error('获取排班列表失败');
//   } finally {
//     loading.value = false;
//   }
// }

// /** 新增排班 */
// async function addSchedule(data: ScheduleFormData) {
//   const res = await axios.post('/api/v1/SchedulingManage/1004', data, {
//     headers: getHeaders(),
//   });
//   if (res.data?.Code === 0) {
//     ElMessage.success('新增排班成功');
//     fetchScheduleList();
//   } else {
//     ElMessage.error(res.data?.Message || '新增排班失败');
//   }
// }

// /** 修改排班 */
// async function updateSchedule(data: ScheduleFormData & { id: string }) {
//   const res = await axios.put('/api/v1/SchedulingManage/3012', data, {
//     headers: getHeaders(),
//   });
//   if (res.data?.Code === 0) {
//     ElMessage.success('修改排班成功');
//     fetchScheduleList();
//   } else {
//     ElMessage.error(res.data?.Message || '修改排班失败');
//   }
// }

// /** 删除排班 */
// async function deleteSchedule(id: string) {
//   const res = await axios.delete('/api/v1/SchedulingManage/2003', {
//     params: { id },
//     headers: getHeaders(),
//   });
//   if (res.data?.Code === 0) {
//     ElMessage.success('删除排班成功');
//     fetchScheduleList();
//   } else {
//     ElMessage.error(res.data?.Message || '删除排班失败');
//   }
// }

// ==================== Mock 数据 ====================

function generateMockData(): ScheduleItem[] {
  const names = [
    '张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十',
    '郑十一', '冯十二', '陈小明', '林小红', '黄大伟', '杨秀英', '刘建国',
    '吕芳华', '朱志强', '许丽娟', '何国栋', '施美玲',
  ];
  const modes = ['HD', 'HDF', 'HD+HP', 'CRRT', 'HF'];
  const dialyzers = ['FX80', 'FX100', 'F60S', 'F80S'];
  const anticoagulants = ['普通肝素', '低分子肝素', '无肝素', '局部枸橼酸'];
  const accesses = ['动静脉内瘘', '中心静脉导管', '人造血管', '直接穿刺'];
  const statuses = ['已排', '未排', '已签到', '透析中', '已完成'];
  const areas = ['一区', '二区', '三区', '四区'];
  const shifts = ['上午', '下午', '晚上'];

  const list: ScheduleItem[] = [];
  for (let i = 0; i < 20; i++) {
    list.push({
      id: `SCH${String(i + 1).padStart(4, '0')}`,
      bedNo: `${i + 1}号床`,
      patientName: names[i],
      patientId: `P${String(10001 + i)}`,
      gender: i % 3 === 0 ? '女' : '男',
      age: 30 + (i % 40),
      treatmentArea: areas[i % 4],
      shift: shifts[i % 3],
      treatmentMode: modes[i % 5],
      dialyzer: dialyzers[i % 4],
      perfusor: i % 3 === 2 ? 'HA330' : '',
      anticoagulant: anticoagulants[i % 4],
      vascularAccess: accesses[i % 4],
      status: statuses[i % 5],
      date: formatDate(searchDate.value),
    });
  }
  return list;
}

// ==================== 工具函数 ====================

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// ==================== 业务逻辑 ====================

/** 获取排班列表（使用mock数据） */
function fetchScheduleList() {
  loading.value = true;
  setTimeout(() => {
    let data = generateMockData();

    // 按班次筛选
    if (searchShift.value) {
      data = data.filter((item) => item.shift === searchShift.value);
    }

    // 按分区筛选
    if (searchAreas.value.length > 0) {
      data = data.filter((item) => searchAreas.value.includes(item.treatmentArea));
    }

    // 按关键词搜索
    if (searchKeyword.value) {
      const kw = searchKeyword.value.toLowerCase();
      data = data.filter(
        (item) =>
          item.patientName.toLowerCase().includes(kw) ||
          item.bedNo.includes(kw) ||
          item.patientId.toLowerCase().includes(kw),
      );
    }

    total.value = data.length;
    const start = (currentPage.value - 1) * pageSize.value;
    tableData.value = data.slice(start, start + pageSize.value);
    loading.value = false;
  }, 300);
}

/** 搜索 */
function handleSearch() {
  currentPage.value = 1;
  fetchScheduleList();
}

/** 重置搜索 */
function handleReset() {
  searchDate.value = new Date();
  searchShift.value = '';
  searchAreas.value = [];
  searchKeyword.value = '';
  currentPage.value = 1;
  fetchScheduleList();
}

/** 分页变化 */
function handlePageChange(page: number) {
  currentPage.value = page;
  fetchScheduleList();
}

function handleSizeChange(size: number) {
  pageSize.value = size;
  currentPage.value = 1;
  fetchScheduleList();
}

/** 新增排班 */
function handleAdd() {
  dialogTitle.value = '新增排班';
  resetForm();
  formData.date = formatDate(searchDate.value);
  dialogVisible.value = true;
}

/** 修改排班 */
function handleEdit(row: ScheduleItem) {
  dialogTitle.value = '修改排班';
  Object.assign(formData, {
    patientId: row.patientId,
    patientName: row.patientName,
    bedNo: row.bedNo,
    date: row.date,
    shift: row.shift,
    treatmentArea: row.treatmentArea,
    treatmentMode: row.treatmentMode,
    dialyzer: row.dialyzer,
    perfusor: row.perfusor,
    anticoagulant: row.anticoagulant,
    vascularAccess: row.vascularAccess,
  });
  dialogVisible.value = true;
}

/** 删除排班 */
async function handleDelete(row: ScheduleItem) {
  try {
    await ElMessageBox.confirm(
      `确定要删除患者"${row.patientName}"的排班吗？`,
      '提示',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' },
    );
    // await deleteSchedule(row.id);
    ElMessage.success('删除排班成功');
    fetchScheduleList();
  } catch {
    // 用户取消
  }
}

/** 提交表单 */
async function handleSubmit() {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (!valid) return;
    try {
      // if (dialogTitle.value === '新增排班') {
      //   await addSchedule(formData);
      // } else {
      //   await updateSchedule({ ...formData, id: editingId.value });
      // }
      ElMessage.success(dialogTitle.value === '新增排班' ? '新增排班成功' : '修改排班成功');
      dialogVisible.value = false;
      fetchScheduleList();
    } catch {
      ElMessage.error('操作失败');
    }
  });
}

/** 导出 */
function handleExport() {
  ElMessage.info('导出功能开发中...');
}

/** 重置表单 */
function resetForm() {
  Object.assign(formData, {
    patientId: '',
    patientName: '',
    bedNo: '',
    date: '',
    shift: '',
    treatmentArea: '',
    treatmentMode: '',
    dialyzer: '',
    perfusor: '',
    anticoagulant: '',
    vascularAccess: '',
  });
  formRef.value?.resetFields();
}

/** 跳转患者详情 */
function goToPatientDetail(patientId: string) {
  ElMessage.info(`跳转患者详情: ${patientId}`);
  // router.push({ name: 'PatientDetail', params: { id: patientId } });
}

/** 获取状态标签类型 */
function getStatusType(status: string): string {
  return STATUS_MAP[status]?.type ?? 'info';
}

// ==================== 生命周期 ====================

onMounted(() => {
  fetchScheduleList();
});
</script>

<template>
  <div class="cycle-scheduling-tab">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <ElDatePicker
          v-model="searchDate"
          type="date"
          placeholder="选择排班日期"
          value-format="YYYY-MM-DD"
          style="width: 180px"
          @change="handleSearch"
        />
        <ElSelect
          v-model="searchShift"
          placeholder="班次"
          clearable
          style="width: 120px"
          @change="handleSearch"
        >
          <ElOption
            v-for="item in SHIFT_OPTIONS"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </ElSelect>
        <ElSelect
          v-model="searchAreas"
          placeholder="治疗区域"
          clearable
          multiple
          collapse-tags
          collapse-tags-tooltip
          style="width: 200px"
          @change="handleSearch"
        >
          <ElOption
            v-for="item in AREA_OPTIONS"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </ElSelect>
        <ElInput
          v-model="searchKeyword"
          placeholder="搜索姓名/床号/患者编号"
          clearable
          style="width: 220px"
          @keyup.enter="handleSearch"
          @clear="handleSearch"
        />
        <ElButton type="primary" @click="handleSearch">查询</ElButton>
        <ElButton @click="handleReset">重置</ElButton>
      </div>
      <div class="toolbar-right">
        <ElButton type="primary" @click="handleAdd">新增排班</ElButton>
        <ElButton @click="handleExport">导出</ElButton>
      </div>
    </div>

    <!-- 表格 -->
    <ElTable
      v-loading="loading"
      :data="tableData"
      border
      stripe
      style="width: 100%"
      :header-cell-style="{ background: '#f5f7fa', color: '#606266' }"
    >
      <ElTableColumn type="index" label="序号" width="60" align="center" />
      <ElTableColumn prop="bedNo" label="床号" width="80" align="center" />
      <ElTableColumn prop="patientName" label="姓名" width="90" align="center">
        <template #default="{ row }">
          <el-link type="primary" @click="goToPatientDetail(row.patientId)">
            {{ row.patientName }}
          </el-link>
        </template>
      </ElTableColumn>
      <ElTableColumn prop="gender" label="性别" width="60" align="center" />
      <ElTableColumn prop="age" label="年龄" width="60" align="center" />
      <ElTableColumn prop="treatmentArea" label="治疗区域" width="90" align="center" />
      <ElTableColumn prop="shift" label="班次" width="80" align="center" />
      <ElTableColumn prop="treatmentMode" label="治疗模式" width="90" align="center" />
      <ElTableColumn prop="dialyzer" label="透析器" width="90" align="center" />
      <ElTableColumn prop="perfusor" label="灌流器" width="90" align="center" />
      <ElTableColumn prop="anticoagulant" label="抗凝剂" width="110" align="center" />
      <ElTableColumn prop="vascularAccess" label="血管通路" width="120" align="center" />
      <ElTableColumn prop="status" label="状态" width="90" align="center">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)" size="small">
            {{ row.status }}
          </el-tag>
        </template>
      </ElTableColumn>
      <ElTableColumn label="操作" width="140" align="center" fixed="right">
        <template #default="{ row }">
          <ElButton type="primary" link size="small" @click="handleEdit(row)">
            修改
          </ElButton>
          <ElButton type="danger" link size="small" @click="handleDelete(row)">
            删除
          </ElButton>
        </template>
      </ElTableColumn>
    </ElTable>

    <!-- 分页 -->
    <div class="pagination-wrapper">
      <ElPagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        background
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
      />
    </div>

    <!-- 新增/修改弹窗 -->
    <ElDialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="650px"
      destroy-on-close
      @closed="resetForm"
    >
      <ElForm
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
        label-position="right"
      >
        <ElFormItem label="患者" prop="patientId">
          <ElSelect
            v-model="formData.patientId"
            placeholder="请选择患者"
            filterable
            style="width: 100%"
          >
            <ElOption label="张三 (P10001)" value="P10001" />
            <ElOption label="李四 (P10002)" value="P10002" />
            <ElOption label="王五 (P10003)" value="P10003" />
            <ElOption label="赵六 (P10004)" value="P10004" />
            <ElOption label="钱七 (P10005)" value="P10005" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="床位" prop="bedNo">
          <ElSelect
            v-model="formData.bedNo"
            placeholder="请选择床位"
            style="width: 100%"
          >
            <ElOption v-for="i in 20" :key="i" :label="`${i}号床`" :value="`${i}号床`" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="日期" prop="date">
          <ElDatePicker
            v-model="formData.date"
            type="date"
            placeholder="选择日期"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </ElFormItem>
        <ElFormItem label="班次" prop="shift">
          <ElSelect v-model="formData.shift" placeholder="请选择班次" style="width: 100%">
            <ElOption
              v-for="item in SHIFT_OPTIONS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="治疗区域" prop="treatmentArea">
          <ElSelect
            v-model="formData.treatmentArea"
            placeholder="请选择治疗区域"
            style="width: 100%"
          >
            <ElOption
              v-for="item in AREA_OPTIONS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="治疗模式" prop="treatmentMode">
          <ElSelect
            v-model="formData.treatmentMode"
            placeholder="请选择治疗模式"
            style="width: 100%"
          >
            <ElOption
              v-for="item in TREATMENT_MODE_OPTIONS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="透析器" prop="dialyzer">
          <ElSelect
            v-model="formData.dialyzer"
            placeholder="请选择透析器"
            style="width: 100%"
          >
            <ElOption
              v-for="item in DIALYZER_OPTIONS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="灌流器" prop="perfusor">
          <ElInput v-model="formData.perfusor" placeholder="请输入灌流器（选填）" />
        </ElFormItem>
        <ElFormItem label="抗凝剂" prop="anticoagulant">
          <ElSelect
            v-model="formData.anticoagulant"
            placeholder="请选择抗凝剂"
            style="width: 100%"
          >
            <ElOption
              v-for="item in ANTICOAGULANT_OPTIONS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="血管通路" prop="vascularAccess">
          <ElSelect
            v-model="formData.vascularAccess"
            placeholder="请选择血管通路"
            style="width: 100%"
          >
            <ElOption
              v-for="item in VASCULAR_ACCESS_OPTIONS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </ElSelect>
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton type="primary" @click="handleSubmit">确定</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<style scoped>
.cycle-scheduling-tab {
  padding: 0;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}

.toolbar-left {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
