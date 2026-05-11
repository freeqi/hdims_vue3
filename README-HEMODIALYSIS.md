# 山外山血透智能管理系统 - Vben Admin 重构版

## 项目简介

基于 Vben Admin 5.0 + Vue3 + TypeScript + Element Plus 的企业级血透智能管理系统前端重构项目。

## 技术栈

- **前端框架**: Vue 3.4+
- **构建工具**: Vite 5.0+
- **开发语言**: TypeScript 5.0+
- **UI组件库**: Element Plus
- **状态管理**: Pinia
- **路由管理**: Vue Router 4.0+
- **表格组件**: Vxe Table
- **表单引擎**: Vben Form

## 项目结构

```
apps/
├── web-ele/              # Element Plus 版本主应用
│   ├── src/
│   │   ├── api/          # API接口定义
│   │   ├── router/       # 路由配置
│   │   │   └── routes/
│   │   │       └── modules/
│   │   │           ├── patient.ts    # 患者管理路由
│   │   │           ├── dialysis.ts   # 透析管理路由
│   │   │           ├── medical.ts    # 医疗文书路由
│   │   │           ├── device.ts     # 设备管理路由
│   │   │           ├── operation.ts  # 运营管理路由
│   │   │           └── system.ts     # 系统管理路由
│   │   ├── views/        # 页面视图
│   │   │   ├── patient/  # 患者管理模块
│   │   │   ├── dialysis/ # 透析管理模块
│   │   │   ├── medical/  # 医疗文书模块
│   │   │   ├── device/   # 设备管理模块
│   │   │   ├── operation/# 运营管理模块
│   │   │   └── system/   # 系统管理模块
│   │   └── locales/      # 国际化配置
│   └── package.json
├── backend-mock/         # Mock服务端
└── ...
```

## 功能模块

### 1. 患者管理 (Patient)
- 患者列表
- 患者详情
- 患者编辑/新增
- 患者档案

### 2. 透析管理 (Dialysis)
- 透析记录
- 透析排班
- 透析监控
- 床位管理

### 3. 医疗文书 (Medical)
- 病历管理
- 护理记录
- 评估表单
- 医嘱管理

### 4. 设备管理 (Device)
- 设备监控
- 设备台账
- 质控管理
- 耗材管理

### 5. 运营管理 (Operation)
- 排班管理
- 统计分析
- 报表中心

### 6. 系统管理 (System)
- 用户管理
- 角色管理
- 权限管理
- 参数配置
- 日志审计

## 快速开始

### 安装依赖

```bash
# 使用 pnpm（推荐）
pnpm install

# 或使用 npm
npm install
```

### 启动开发服务器

```bash
# 启动 Element Plus 版本
pnpm dev:ele

# 或
cd apps/web-ele
pnpm dev
```

### 构建生产环境

```bash
# 构建 Element Plus 版本
pnpm build:ele
```

## 开发规范

### 路由配置

路由文件位于 `src/router/routes/modules/` 目录下，按模块划分：

```typescript
const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:users',
      order: 1,
      title: '患者管理',
    },
    name: 'Patient',
    path: '/patient',
    children: [
      // 子路由配置
    ],
  },
];
```

### 表单配置

使用 Vben Form 进行表单配置化开发：

```typescript
const [Form, formApi] = useVbenForm({
  schema: [
    {
      component: 'Input',
      fieldName: 'name',
      label: '患者姓名',
      rules: 'required',
    },
    // 更多字段...
  ],
});
```

### 表格配置

使用 Vxe Table 进行表格配置化开发：

```typescript
const [Grid] = useVbenVxeGrid({
  gridOptions: {
    columns: [
      { field: 'name', title: '姓名' },
      // 更多列...
    ],
  },
});
```

## 与原系统对比

| 特性 | 原系统 (Vue2+iView) | 新系统 (Vben+Vue3) |
|------|---------------------|-------------------|
| 技术栈 | Vue2 + iView | Vue3 + Element Plus |
| 开发效率 | 表单页面2-3天/页 | 配置化页面2-4小时/页 |
| 代码复用 | 复用率约30% | 复用率70%+ |
| 多端适配 | PC/平板两套代码 | 一套代码多端适配 |
| 打印功能 | 每类打印单独开发 | 模板化配置 |
| 性能 | 首屏3-5秒 | 首屏<2秒 |

## 重构进度

- [x] 项目初始化
- [x] 路由配置（6大模块）
- [x] 国际化配置
- [ ] 患者管理模块
  - [x] 患者列表页面
  - [x] 患者编辑页面
  - [ ] 患者详情页面
  - [ ] 患者档案页面
- [ ] 透析管理模块
- [ ] 医疗文书模块
- [ ] 设备管理模块
- [ ] 运营管理模块
- [ ] 系统管理模块
- [ ] 打印服务层
- [ ] Mock数据完善

## 注意事项

1. 本项目基于 Vben Admin 5.0 开发，与旧版本不兼容
2. 需要使用 Node.js 18+ 版本
3. 推荐使用 pnpm 作为包管理器
4. 代码提交前请运行 `pnpm lint` 检查代码规范

## 相关链接

- [Vben Admin 官方文档](https://doc.vben.pro/)
- [Element Plus 官方文档](https://element-plus.org/)
- [Vue3 官方文档](https://vuejs.org/)
