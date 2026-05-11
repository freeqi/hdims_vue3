<template>
  <div class="check_item">
    <div class="header">
      <ElButton type="primary" @click="add">{{ $t('新增') }}</ElButton>
    </div>
    <ElTable :data="itemList" v-loading="tableLoading" border>
      <ElTableColumn prop="ItemsName" :label="$t('项目名称')" min-width="200" />
      <ElTableColumn prop="BloodVesselColor" :label="$t('采血管颜色')" width="120">
        <template #default="{ row }">
          <div class="color-cell">
            <span class="color-block" :style="{ background: row.BloodVesselColor }"></span>
          </div>
        </template>
      </ElTableColumn>
      <ElTableColumn prop="SortNo" :label="$t('排序号')" width="100" />
      <ElTableColumn prop="Remark" :label="$t('备注')" min-width="150" />
      <ElTableColumn :label="$t('操作')" align="center" width="120" fixed="right">
        <template #default="{ row }">
          <ElButton type="primary" link size="small" @click="update(row)">{{ $t('编辑') }}</ElButton>
          <ElButton type="danger" link size="small" @click="deleteItem(row.Id)">{{ $t('删除') }}</ElButton>
        </template>
      </ElTableColumn>
    </ElTable>

    <!-- 新增/编辑弹窗 -->
    <ElDialog v-model="modalFlag" :title="title + $t('检验项目')" width="600" @close="cancel">
      <ElForm :model="formData" ref="formDataRef" :rules="formDataRules" :label-width="90">
        <ElFormItem :label="$t('项目名称')" prop="ItemsName">
          <ElInput v-model="formData.ItemsName" />
        </ElFormItem>
        <ElFormItem :label="$t('采血管颜色')" prop="BloodVesselColor">
          <ElSelect v-model="formData.BloodVesselColor" style="width: 100%">
            <ElOption v-for="item in colors" :key="item.color" :value="item.color" :label="item.name">
              <span>{{ item.name }}</span>
              <span class="color-option" :style="{ background: item.color }"></span>
            </ElOption>
          </ElSelect>
        </ElFormItem>
        <ElFormItem :label="$t('排序号')" prop="SortNo">
          <ElInputNumber v-model="formData.SortNo" style="width: 100%" />
        </ElFormItem>
        <ElFormItem :label="$t('备注')">
          <ElInput v-model="formData.Remark" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton type="primary" @click="save">{{ $t('保存') }}</ElButton>
        <ElButton @click="cancel">{{ $t('取消') }}</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import {
  ElButton, ElTable, ElTableColumn, ElDialog, ElForm, ElFormItem,
  ElInput, ElInputNumber, ElSelect, ElOption, ElMessage, ElMessageBox
} from 'element-plus';
import type { FormInstance } from 'element-plus';
import { swsApi } from '#/api/sws';

defineOptions({
  name: 'CheckItem',
});

// ==================== 响应式数据 ====================

const modalFlag = ref(false);
const tableLoading = ref(false);
const title = ref('');
const itemList = ref<any[]>([]);

const colors = [
  { name: '红色', color: '#FF3203' },
  { name: '橘黄色', color: '#FFC100' },
  { name: '金黄色', color: '#FFFD03' },
  { name: '浅绿色', color: '#93D250' },
  { name: '紫色', color: '#722EA7' },
  { name: '墨绿色', color: '#006505' },
  { name: '浅蓝色', color: '#8BB1E0' },
  { name: '黑色', color: '#000100' },
  { name: '灰色', color: '#A8A8A8' },
];

const formData = reactive({
  Id: '',
  ItemsName: '',
  BloodVesselColor: '',
  SortNo: null as number | null,
  Remark: '',
});

const formDataRef = ref<FormInstance>();
const formDataRules = {
  ItemsName: [{ required: true, message: '请输入项目名称', trigger: 'change' }],
  SortNo: [{ required: true, message: '请输入排序号', trigger: 'change', type: 'number' as const }],
  BloodVesselColor: [{ required: true, message: '请选择采血管颜色', trigger: 'change' }],
};

// ==================== 方法 ====================

async function load() {
  tableLoading.value = true;
  itemList.value = [];
  try {
    const res = await swsApi.swsGet('InspectionPlanManage/4001');
    if (res.Code == 200) {
      itemList.value = res.Data;
    }
  } finally {
    tableLoading.value = false;
  }
}

function add() {
  cancel();
  modalFlag.value = true;
  title.value = '新增';
}

function update(row: any) {
  formData.Id = row.Id;
  formData.ItemsName = row.ItemsName;
  formData.BloodVesselColor = row.BloodVesselColor;
  formData.SortNo = row.SortNo;
  formData.Remark = row.Remark || '';
  title.value = '编辑';
  modalFlag.value = true;
}

function cancel() {
  modalFlag.value = false;
  formDataRef.value?.resetFields();
  formData.Id = '';
  formData.ItemsName = '';
  formData.BloodVesselColor = '';
  formData.SortNo = null;
  formData.Remark = '';
}

async function save() {
  if (!formDataRef.value) return;
  await formDataRef.value.validate(async (valid) => {
    if (!valid) return;
    if (title.value === '新增') {
      const res = await swsApi.swsPost('InspectionPlanManage/1001', {
        ItemsName: formData.ItemsName,
        BloodVesselColor: formData.BloodVesselColor,
        SortNo: formData.SortNo,
        Remark: formData.Remark,
      });
      if (res.Code == 200) {
        ElMessage.success('新增成功！');
        modalFlag.value = false;
        load();
      }
    } else {
      const res = await swsApi.swsPut('InspectionPlanManage/3001', {
        Id: formData.Id,
        ItemsName: formData.ItemsName,
        BloodVesselColor: formData.BloodVesselColor,
        SortNo: formData.SortNo,
        Remark: formData.Remark,
      });
      if (res.Code == 200) {
        ElMessage.success('修改成功！');
        modalFlag.value = false;
        load();
      }
    }
  });
}

async function deleteItem(Id: string) {
  try {
    await ElMessageBox.confirm('确定要删除该检验项目吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });
    const res = await swsApi.swsDelete('InspectionPlanManage/2001', { Id });
    if (res.Code == 200) {
      ElMessage.success('删除成功！');
      load();
    }
  } catch {
    // 用户取消
  }
}

// ==================== 生命周期 ====================

onMounted(() => {
  load();
});
</script>

<style scoped>
.check_item {
  padding: 16px;
}

.header {
  margin-bottom: 10px;
}

.color-cell {
  display: flex;
  align-items: center;
  justify-content: center;
}

.color-block {
  display: inline-block;
  width: 30px;
  height: 16px;
  border: 1px solid #dcdfe6;
  border-radius: 2px;
}

.color-option {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 1px solid #dcdfe6;
  border-radius: 2px;
  margin-left: 8px;
  vertical-align: middle;
}
</style>
