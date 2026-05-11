<template>
  <Page title="透析模式设置" class="dialysis-mode-page">
    <div class="dialysis-mode-container">
      <!-- 左侧面板：透析模式列表 -->
      <div class="left-panel">
        <div class="search-bar">
          <ElInput
            v-model="searchKeyword"
            placeholder="搜索模式名称/编码"
            clearable
            size="default"
            @input="onSearchInput"
          >
            <template #prefix>
              <span class="icon-search">🔍</span>
            </template>
          </ElInput>
          <ElButton
            type="primary"
            link
            class="view-all-btn"
            @click="onViewAll"
          >
            查看所有
          </ElButton>
        </div>

        <div class="mode-list" v-loading="listLoading">
          <div
            v-for="item in filteredModeList"
            :key="item.Id"
            class="mode-item"
            :class="{ active: selectedMode && selectedMode.Id === item.Id }"
            @click="onSelectMode(item)"
          >
            <div class="mode-value">{{ item.Value }}</div>
            <div class="mode-name">{{ item.Name }}</div>
          </div>
          <div
            v-if="filteredModeList.length === 0 && !listLoading"
            class="empty-tip"
          >
            暂无数据
          </div>
        </div>
      </div>

      <!-- 右侧内容区 -->
      <div class="right-panel" v-loading="detailLoading">
        <template v-if="selectedMode">
          <ElRow :gutter="16">
            <!-- 左侧5列：可选透析器/灌流器 -->
            <ElCol :span="5">
              <ElCard shadow="never" class="selection-card">
                <template #header>
                  <span class="card-title">可选透析器</span>
                </template>
                <ElCheckboxGroup
                  v-model="selectedDialyzerIds"
                  class="checkbox-group"
                >
                  <ElCheckbox
                    v-for="item in dialyserData"
                    :key="item.Id"
                    :value="item.Id"
                    class="checkbox-item"
                  >
                    {{ item.Name }}
                  </ElCheckbox>
                </ElCheckboxGroup>
                <div
                  v-if="dialyserData.length === 0"
                  class="empty-tip-small"
                >
                  暂无透析器数据
                </div>
              </ElCard>

              <ElCard shadow="never" class="selection-card mt-3">
                <template #header>
                  <span class="card-title">可选灌流器</span>
                </template>
                <ElCheckboxGroup
                  v-model="selectedHemoperfusionIds"
                  class="checkbox-group"
                >
                  <ElCheckbox
                    v-for="item in perfusionData"
                    :key="item.Id"
                    :value="item.Id"
                    class="checkbox-item"
                  >
                    {{ item.Name }}
                  </ElCheckbox>
                </ElCheckboxGroup>
                <div
                  v-if="perfusionData.length === 0"
                  class="empty-tip-small"
                >
                  暂无灌流器数据
                </div>
              </ElCard>

              <ElButton
                type="primary"
                class="save-btn mt-3"
                :loading="saveLoading"
                @click="onSave"
              >
                保存
              </ElButton>
            </ElCol>

            <!-- 右侧19列：详情表格 -->
            <ElCol :span="19">
              <ElCard shadow="never" class="detail-card">
                <template #header>
                  <span class="card-title">
                    当前模式关联详情 - {{ selectedMode.Value }}
                  </span>
                </template>
                <ElTable
                  :data="detailData"
                  border
                  stripe
                  style="width: 100%"
                  max-height="calc(100vh - 260px)"
                >
                  <ElTableColumn
                    prop="Mode"
                    label="模式"
                    min-width="120"
                  />
                  <ElTableColumn
                    prop="Name"
                    label="名称"
                    min-width="180"
                  />
                  <ElTableColumn
                    prop="Value"
                    label="编码"
                    min-width="150"
                  />
                </ElTable>
                <div
                  v-if="detailData.length === 0"
                  class="empty-tip"
                >
                  暂无关联数据
                </div>
              </ElCard>
            </ElCol>
          </ElRow>
        </template>

        <div v-else class="no-selection-tip">
          请从左侧选择一个透析模式
        </div>
      </div>
    </div>
  </Page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { Page } from '@vben/common-ui';
import {
  ElRow,
  ElCol,
  ElCard,
  ElInput,
  ElButton,
  ElCheckboxGroup,
  ElCheckbox,
  ElTable,
  ElTableColumn,
  ElMessage,
} from 'element-plus';
import swsApi from '#/api/sws';

// ==================== 类型定义 ====================

/** 字典项 */
interface DictionaryItem {
  Id: string;
  Value: string;
  Name: string;
  DictionaryId?: string;
}

/** 字典组响应项 */
interface DictionaryGroup {
  TypeId: string;
  SystemDictionaryList: DictionaryItem[];
}

/** 透析器/灌流器数据项 */
interface DialyzerItem {
  Id: string;
  Name: string;
  Value: string;
  IsSelect?: boolean;
}

/** 模式设置详情 */
interface ModeSetDetail {
  Mode: string;
  DictionaryId: string;
  Dialyzer: DialyzerItem[];
  Filter: DialyzerItem[];
  Hemoperfusion: DialyzerItem[];
}

/** 详情表格行 */
interface DetailTableRow {
  Mode: string;
  Name: string;
  Value: string;
}

// ==================== 常量 ====================

/** 治疗类型 TypeId */
const TREATMENT_TYPE_ID = '9364d9b7b019426a96c61822adcecdeb';
/** 透析器 TypeId */
const DIALYZER_TYPE_ID = '5189c272d88b4e50ae636d2e9ca694dc';
/** 灌流器 TypeId */
const HEMOPERFUSION_TYPE_ID = '0894eef655284f0bb4840f2db089527d';

// ==================== 响应式数据 ====================

/** 搜索关键字 */
const searchKeyword = ref('');

/** 透析模式列表（原始） */
const dialysListD = ref<DictionaryItem[]>([]);

/** 可选透析器数据 */
const dialyserData = ref<DialyzerItem[]>([]);

/** 可选灌流器数据 */
const perfusionData = ref<DialyzerItem[]>([]);

/** 当前选中的模式 */
const selectedMode = ref<DictionaryItem | null>(null);

/** 当前模式关联详情 */
const detailData = ref<DetailTableRow[]>([]);

/** 选中的透析器 Id 列表 */
const selectedDialyzerIds = ref<string[]>([]);

/** 选中的灌流器 Id 列表 */
const selectedHemoperfusionIds = ref<string[]>([]);

/** 列表加载状态 */
const listLoading = ref(false);

/** 详情加载状态 */
const detailLoading = ref(false);

/** 保存加载状态 */
const saveLoading = ref(false);

// ==================== 计算属性 ====================

/** 搜索过滤后的模式列表 */
const filteredModeList = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase();
  if (!keyword) {
    return dialysListD.value;
  }
  return dialysListD.value.filter(
    (item) =>
      item.Name.toLowerCase().includes(keyword) ||
      item.Value.toLowerCase().includes(keyword),
  );
});

// ==================== 方法 ====================

/** 搜索输入 */
function onSearchInput() {
  // 搜索由 computed 自动处理
}

/** 查看所有 - 清空搜索 */
function onViewAll() {
  searchKeyword.value = '';
}

/** 选中模式 */
function onSelectMode(item: DictionaryItem) {
  selectedMode.value = item;
  loadModeDetail(item);
}

/**
 * 加载字典数据
 * 调用 SystemDictionary/4006 获取治疗类型、透析器、灌流器字典
 */
async function loadDictionaryData() {
  listLoading.value = true;
  try {
    const params = [
      { typeId: TREATMENT_TYPE_ID },
      { typeId: DIALYZER_TYPE_ID },
      { typeId: HEMOPERFUSION_TYPE_ID },
    ];
    const res = await swsApi.swsGet('SystemDictionary/4006', params);
    if (res.Code === 200 && Array.isArray(res.Data)) {
      // res.Data 是数组，按请求顺序返回
      // 索引0: 治疗类型 -> dialysListD
      // 索引1: 透析器 -> dialyserData
      // 索引2: 灌流器 -> perfusionData
      for (const group of res.Data) {
        if (group.TypeId === TREATMENT_TYPE_ID) {
          dialysListD.value = group.SystemDictionaryList || [];
        } else if (group.TypeId === DIALYZER_TYPE_ID) {
          dialyserData.value = group.SystemDictionaryList || [];
        } else if (group.TypeId === HEMOPERFUSION_TYPE_ID) {
          perfusionData.value = group.SystemDictionaryList || [];
        }
      }
    }
  } catch (error) {
    console.error('加载字典数据失败:', error);
    ElMessage.error('加载字典数据失败');
  } finally {
    listLoading.value = false;
  }
}

/**
 * 加载模式详情
 * 调用 DialysisModeSet/4001 根据 DictionaryId 查询模式对应的透析器/滤过器/灌流器
 */
async function loadModeDetail(item: DictionaryItem) {
  detailLoading.value = true;
  selectedDialyzerIds.value = [];
  selectedHemoperfusionIds.value = [];
  detailData.value = [];
  try {
    const params = { DictionaryId: item.Id };
    const res = await swsApi.swsGet('DialysisModeSet/4001', params);
    if (res.Code === 200 && res.Data) {
      const data: ModeSetDetail = res.Data;

      // 回显已选中的透析器
      if (Array.isArray(data.Dialyzer)) {
        selectedDialyzerIds.value = data.Dialyzer
          .filter((d: DialyzerItem) => d.IsSelect)
          .map((d: DialyzerItem) => d.Id);
      }

      // 回显已选中的灌流器
      if (Array.isArray(data.Hemoperfusion)) {
        selectedHemoperfusionIds.value = data.Hemoperfusion
          .filter((h: DialyzerItem) => h.IsSelect)
          .map((h: DialyzerItem) => h.Id);
      }

      // 构建详情表格数据：合并透析器、滤过器、灌流器
      const rows: DetailTableRow[] = [];
      const modeName = item.Value;

      if (Array.isArray(data.Dialyzer)) {
        for (const d of data.Dialyzer) {
          rows.push({ Mode: modeName, Name: d.Name, Value: d.Value });
        }
      }
      if (Array.isArray(data.Filter)) {
        for (const f of data.Filter) {
          rows.push({ Mode: modeName, Name: f.Name, Value: f.Value });
        }
      }
      if (Array.isArray(data.Hemoperfusion)) {
        for (const h of data.Hemoperfusion) {
          rows.push({ Mode: modeName, Name: h.Name, Value: h.Value });
        }
      }

      detailData.value = rows;
    }
  } catch (error) {
    console.error('加载模式详情失败:', error);
    ElMessage.error('加载模式详情失败');
  } finally {
    detailLoading.value = false;
  }
}

/**
 * 保存模式设置
 * 调用 DialysisModeSet/1001 保存
 */
async function onSave() {
  if (!selectedMode.value) {
    ElMessage.warning('请先选择一个透析模式');
    return;
  }

  saveLoading.value = true;
  try {
    // 构建 Dialyzer 数组：根据选中的 Id 匹配完整对象
    const Dialyzer: DialyzerItem[] = dialyserData.value
      .filter((d) => selectedDialyzerIds.value.includes(d.Id))
      .map((d) => ({ ...d, IsSelect: true }));

    // 构建 Filter 数组（当前页面无滤过器选择，传空）
    const Filter: DialyzerItem[] = [];

    // 构建 Hemoperfusion 数组：根据选中的 Id 匹配完整对象
    const Hemoperfusion: DialyzerItem[] = perfusionData.value
      .filter((h) => selectedHemoperfusionIds.value.includes(h.Id))
      .map((h) => ({ ...h, IsSelect: true }));

    const params = {
      Mode: selectedMode.value.Value,
      DictionaryId: selectedMode.value.Id,
      Dialyzer,
      Filter,
      Hemoperfusion,
    };

    const res = await swsApi.swsPost('DialysisModeSet/1001', params);
    if (res.Code === 200) {
      ElMessage.success('保存成功');
      // 保存成功后刷新详情
      loadModeDetail(selectedMode.value);
    } else {
      ElMessage.error(res.Msg || '保存失败');
    }
  } catch (error) {
    console.error('保存失败:', error);
    ElMessage.error('保存失败');
  } finally {
    saveLoading.value = false;
  }
}

/**
 * 获取所有选中的值
 * 调用 DialysisModeSet/4003
 */
async function loadAllSelectedValues() {
  try {
    const res = await swsApi.swsGet('DialysisModeSet/4003');
    if (res.Code === 200) {
      return res.Data;
    }
  } catch (error) {
    console.error('获取选中值失败:', error);
  }
  return null;
}

// ==================== 生命周期 ====================

onMounted(() => {
  loadDictionaryData();
});
</script>

<style scoped>
.dialysis-mode-page {
  height: 100%;
}

.dialysis-mode-container {
  display: flex;
  height: calc(100vh - 140px);
  gap: 12px;
}

/* ========== 左侧面板 ========== */

.left-panel {
  width: 240px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  background: #fff;
}

.search-bar {
  padding: 10px;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.icon-search {
  font-size: 12px;
}

.view-all-btn {
  align-self: flex-end;
  font-size: 12px;
  padding: 0;
}

.mode-list {
  flex: 1;
  overflow-y: auto;
  padding: 4px 0;
}

.mode-item {
  padding: 10px 14px;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.2s;
}

.mode-item:hover {
  background-color: #ecf5ff;
}

.mode-item.active {
  background-color: #d9ecff;
  border-left: 3px solid #409eff;
}

.mode-value {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 2px;
}

.mode-name {
  font-size: 12px;
  color: #909399;
}

.empty-tip {
  text-align: center;
  color: #c0c4cc;
  padding: 40px 0;
  font-size: 14px;
}

.empty-tip-small {
  text-align: center;
  color: #c0c4cc;
  padding: 16px 0;
  font-size: 12px;
}

/* ========== 右侧面板 ========== */

.right-panel {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.no-selection-tip {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #c0c4cc;
  font-size: 16px;
}

.selection-card {
  height: calc(50vh - 140px);
  display: flex;
  flex-direction: column;
}

.selection-card :deep(.el-card__body) {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.detail-card {
  height: calc(100vh - 200px);
}

.detail-card :deep(.el-card__body) {
  padding: 12px;
}

.card-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.checkbox-item {
  margin-right: 0 !important;
  width: 100%;
}

.save-btn {
  width: 100%;
}

.mt-3 {
  margin-top: 12px;
}
</style>
