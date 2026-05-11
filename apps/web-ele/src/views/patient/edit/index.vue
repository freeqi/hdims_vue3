<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import { 
  ElCard, ElButton, ElMessage, ElSteps, ElStep, ElUpload,
  ElRadioGroup, ElRadio, ElDatePicker, ElOption, ElSelect, ElInput, ElInputNumber
} from 'element-plus';

import { useVbenForm } from '#/adapter/form';

const route = useRoute();
const router = useRouter();
const patientId = route.params.id as string;
const isEdit = !!patientId;
const activeStep = ref(0);
const loading = ref(false);

// 下拉选项数据
const cardTypeOptions = [
  { Id: '1', Name: '身份证' },
  { Id: '2', Name: '护照' },
  { Id: '3', Name: '军官证' },
  { Id: '4', Name: '其他' },
];

const sexOptions = [
  { Id: '男', Name: '男' },
  { Id: '女', Name: '女' },
];

const nationOptions = [
  { Id: '1', Name: '汉族' },
  { Id: '2', Name: '回族' },
  { Id: '3', Name: '藏族' },
  { Id: '4', Name: '维吾尔族' },
  { Id: '5', Name: '苗族' },
  { Id: '6', Name: '彝族' },
  { Id: '7', Name: '壮族' },
  { Id: '8', Name: '其他' },
];

const professionalOptions = [
  { Id: '1', Name: '在职人员' },
  { Id: '2', Name: '退休人员' },
  { Id: '3', Name: '农民' },
  { Id: '4', Name: '学生' },
  { Id: '5', Name: '无业' },
  { Id: '6', Name: '其他' },
];

const educationOptions = [
  { Id: '1', Name: '小学' },
  { Id: '2', Name: '初中' },
  { Id: '3', Name: '高中' },
  { Id: '4', Name: '大专' },
  { Id: '5', Name: '本科' },
  { Id: '6', Name: '硕士' },
  { Id: '7', Name: '博士' },
];

const maritalOptions = [
  { Id: '1', Name: '未婚' },
  { Id: '2', Name: '已婚' },
  { Id: '3', Name: '离异' },
  { Id: '4', Name: '丧偶' },
];

const hospitalStateOptions = [
  { Id: '1', Name: '在院' },
  { Id: '2', Name: '出院' },
  { Id: '3', Name: '转院' },
  { Id: '4', Name: '死亡' },
];

const bloodTypeOptions = [
  { Id: 'A', Name: 'A型' },
  { Id: 'B', Name: 'B型' },
  { Id: 'AB', Name: 'AB型' },
  { Id: 'O', Name: 'O型' },
];

const dialysisTypeOptions = [
  { Id: 'HD', Name: '血液透析(HD)' },
  { Id: 'HDF', Name: '血液透析滤过(HDF)' },
  { Id: 'HP', Name: '血液灌流(HP)' },
  { Id: 'PE', Name: '血浆置换(PE)' },
  { Id: 'CRRT', Name: '连续性肾脏替代治疗(CRRT)' },
];

const dialysisFrequencyOptions = [
  { Id: '1', Name: '每周2次' },
  { Id: '2', Name: '每周3次' },
  { Id: '3', Name: '每周4次' },
  { Id: '4', Name: '隔日1次' },
];

const vascularAccessOptions = [
  { Id: '1', Name: '动静脉内瘘' },
  { Id: '2', Name: '中心静脉导管' },
  { Id: '3', Name: '人工血管' },
  { Id: '4', Name: '直接穿刺' },
];

// 基本信息表单
const [BasicForm, basicFormApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
  },
  layout: 'horizontal',
  wrapperClass: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  handleSubmit: (values) => {
    console.log('基本信息:', values);
  },
  schema: [
    {
      component: 'Input',
      fieldName: 'Name',
      label: '姓名',
      rules: 'required',
      componentProps: {
        placeholder: '请输入姓名',
      },
    },
    {
      component: 'Input',
      fieldName: 'Alias',
      label: '别名',
      componentProps: {
        placeholder: '请输入别名',
      },
    },
    {
      component: 'RadioGroup',
      fieldName: 'Sex',
      label: '性别',
      rules: 'required',
      componentProps: {
        options: sexOptions.map(item => ({ value: item.Id, label: item.Name })),
      },
    },
    {
      component: 'DatePicker',
      fieldName: 'Birthday',
      label: '出生日期',
      componentProps: {
        placeholder: '请选择出生日期',
        type: 'date',
      },
    },
    {
      component: 'InputNumber',
      fieldName: 'Age',
      label: '年龄',
      componentProps: {
        placeholder: '自动计算',
        disabled: true,
        min: 0,
        max: 150,
      },
    },
    {
      component: 'Select',
      fieldName: 'CardType',
      label: '证件类型',
      componentProps: {
        options: cardTypeOptions.map(item => ({ value: item.Id, label: item.Name })),
        placeholder: '请选择证件类型',
      },
    },
    {
      component: 'Input',
      fieldName: 'CardNum',
      label: '证件号码',
      componentProps: {
        placeholder: '请输入证件号码',
      },
    },
    {
      component: 'Select',
      fieldName: 'Nation',
      label: '民族',
      componentProps: {
        options: nationOptions.map(item => ({ value: item.Name, label: item.Name })),
        placeholder: '请选择民族',
        filterable: true,
        clearable: true,
      },
    },
    {
      component: 'Select',
      fieldName: 'Professional',
      label: '职业',
      componentProps: {
        options: professionalOptions.map(item => ({ value: item.Name, label: item.Name })),
        placeholder: '请选择职业',
        filterable: true,
        clearable: true,
      },
    },
    {
      component: 'Select',
      fieldName: 'EducationBackground',
      label: '学历',
      componentProps: {
        options: educationOptions.map(item => ({ value: item.Id, label: item.Name })),
        placeholder: '请选择学历',
      },
    },
    {
      component: 'Select',
      fieldName: 'Marital',
      label: '婚姻状况',
      componentProps: {
        options: maritalOptions.map(item => ({ value: item.Id, label: item.Name })),
        placeholder: '请选择婚姻状况',
      },
    },
    {
      component: 'InputNumber',
      fieldName: 'Height',
      label: '身高(cm)',
      componentProps: {
        placeholder: '请输入身高',
        min: 50,
        max: 250,
      },
    },
    {
      component: 'Input',
      fieldName: 'WorkUnit',
      label: '工作单位',
      componentProps: {
        placeholder: '请输入工作单位',
      },
    },
    {
      component: 'Input',
      fieldName: 'CensusRegister',
      label: '籍贯',
      componentProps: {
        placeholder: '请输入籍贯',
      },
    },
    {
      component: 'Textarea',
      fieldName: 'Remark',
      label: '备注',
      componentProps: {
        placeholder: '请输入备注',
        rows: 2,
      },
    },
  ],
});

// 联系方式表单
const [ContactForm, contactFormApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
  },
  layout: 'horizontal',
  wrapperClass: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  handleSubmit: (values) => {
    console.log('联系方式:', values);
  },
  schema: [
    {
      component: 'Input',
      fieldName: 'ContactPhone',
      label: '本人联系电话',
      componentProps: {
        placeholder: '请输入7/8/11位的号码',
      },
    },
    {
      component: 'Input',
      fieldName: 'ContactAddress',
      label: '本人联系地址',
      componentProps: {
        placeholder: '请输入联系地址',
      },
    },
    {
      component: 'Input',
      fieldName: 'EmergencyContact1',
      label: '紧急联系人1',
      componentProps: {
        placeholder: '请输入紧急联系人',
      },
    },
    {
      component: 'Input',
      fieldName: 'EmergencyContactNumber1',
      label: '紧急联系电话1',
      componentProps: {
        placeholder: '请输入联系电话',
      },
    },
    {
      component: 'Input',
      fieldName: 'Relationship1',
      label: '与联系人关系1',
      componentProps: {
        placeholder: '请输入关系',
      },
    },
    {
      component: 'Input',
      fieldName: 'EmergencyContact2',
      label: '紧急联系人2',
      componentProps: {
        placeholder: '请输入紧急联系人',
      },
    },
    {
      component: 'Input',
      fieldName: 'EmergencyContactNumber2',
      label: '紧急联系电话2',
      componentProps: {
        placeholder: '请输入联系电话',
      },
    },
    {
      component: 'Input',
      fieldName: 'Relationship2',
      label: '与联系人关系2',
      componentProps: {
        placeholder: '请输入关系',
      },
    },
  ],
});

// 诊疗信息表单
const [MedicalForm, medicalFormApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
  },
  layout: 'horizontal',
  wrapperClass: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  handleSubmit: (values) => {
    console.log('诊疗信息:', values);
  },
  schema: [
    {
      component: 'Input',
      fieldName: 'PatientNo',
      label: '患者编号',
      rules: 'required',
      componentProps: {
        placeholder: '请输入患者编号',
        disabled: isEdit,
      },
    },
    {
      component: 'Input',
      fieldName: 'PatientFileNo',
      label: '病历夹编号',
      componentProps: {
        placeholder: '请输入病历夹编号',
      },
    },
    {
      component: 'Input',
      fieldName: 'PatientZYNo',
      label: '住院号',
      componentProps: {
        placeholder: '请输入住院号',
      },
    },
    {
      component: 'DatePicker',
      fieldName: 'ReceiveDate',
      label: '接诊日期',
      componentProps: {
        placeholder: '请选择接诊日期',
        type: 'date',
      },
    },
    {
      component: 'Select',
      fieldName: 'HospitalState',
      label: '在院状态',
      componentProps: {
        options: hospitalStateOptions.map(item => ({ value: item.Name, label: item.Name })),
        placeholder: '请选择在院状态',
      },
    },
    {
      component: 'Select',
      fieldName: 'BloodType',
      label: '血型',
      componentProps: {
        options: bloodTypeOptions.map(item => ({ value: item.Id, label: item.Name })),
        placeholder: '请选择血型',
      },
    },
    {
      component: 'Select',
      fieldName: 'DialysisType',
      label: '透析方式',
      componentProps: {
        options: dialysisTypeOptions.map(item => ({ value: item.Id, label: item.Name })),
        placeholder: '请选择透析方式',
      },
    },
    {
      component: 'Select',
      fieldName: 'DialysisFrequency',
      label: '透析频率',
      componentProps: {
        options: dialysisFrequencyOptions.map(item => ({ value: item.Id, label: item.Name })),
        placeholder: '请选择透析频率',
      },
    },
    {
      component: 'DatePicker',
      fieldName: 'FirstDialysisDate',
      label: '首次透析日期',
      componentProps: {
        placeholder: '请选择首次透析日期',
        type: 'date',
      },
    },
    {
      component: 'InputNumber',
      fieldName: 'DryWeight',
      label: '干体重(kg)',
      componentProps: {
        placeholder: '请输入干体重',
        min: 20,
        max: 200,
        precision: 2,
      },
    },
    {
      component: 'InputNumber',
      fieldName: 'TargetWeightLoss',
      label: '目标超滤量(L)',
      componentProps: {
        placeholder: '请输入目标超滤量',
        min: 0,
        max: 10,
        precision: 2,
      },
    },
    {
      component: 'Select',
      fieldName: 'VascularAccess',
      label: '血管通路',
      componentProps: {
        options: vascularAccessOptions.map(item => ({ value: item.Name, label: item.Name })),
        placeholder: '请选择血管通路',
      },
    },
    {
      component: 'Input',
      fieldName: 'AccessPosition',
      label: '通路位置',
      componentProps: {
        placeholder: '如：左前臂',
      },
    },
    {
      component: 'InputNumber',
      fieldName: 'BloodFlowRate',
      label: '血流量(ml/min)',
      componentProps: {
        placeholder: '请输入血流量',
        min: 100,
        max: 500,
      },
    },
  ],
});

// 提交所有表单
async function handleSubmit() {
  loading.value = true;
  try {
    const basicValues = await basicFormApi.validate();
    const contactValues = await contactFormApi.validate();
    const medicalValues = await medicalFormApi.validate();
    
    const submitData = {
      ...basicValues,
      ...contactValues,
      ...medicalValues,
    };
    
    console.log('提交数据:', submitData);
    ElMessage.success(isEdit ? '修改成功' : '新增成功');
    router.push('/patient/list');
  } catch (error) {
    ElMessage.error('请检查表单填写是否正确');
  } finally {
    loading.value = false;
  }
}

function handleCancel() {
  router.back();
}

function nextStep() {
  if (activeStep.value < 2) {
    activeStep.value++;
  }
}

function prevStep() {
  if (activeStep.value > 0) {
    activeStep.value--;
  }
}

// 上传头像
function handleBeforeUpload(file: File) {
  console.log('上传头像:', file.name);
  return false;
}

// 加载患者数据（编辑模式）
onMounted(() => {
  if (isEdit) {
    // 模拟加载患者数据
    basicFormApi.setValues({
      Name: '张三',
      Alias: '小张',
      Sex: '男',
      Birthday: '1966-05-15',
      Age: 58,
      CardType: '1',
      CardNum: '510***********1234',
      Nation: '汉族',
      Professional: '退休人员',
      EducationBackground: '3',
      Marital: '2',
      Height: 170,
      WorkUnit: '某机械厂',
      CensusRegister: '四川省成都市',
      Remark: '患者配合度良好',
    });
    
    contactFormApi.setValues({
      ContactPhone: '138****1234',
      ContactAddress: '四川省成都市武侯区XX路XX号',
      EmergencyContact1: '张某某',
      EmergencyContactNumber1: '139****5678',
      Relationship1: '父子',
      EmergencyContact2: '李某某',
      EmergencyContactNumber2: '137****9012',
      Relationship2: '配偶',
    });
    
    medicalFormApi.setValues({
      PatientNo: '2024001001',
      PatientFileNo: 'F001',
      PatientZYNo: 'ZY20240001',
      ReceiveDate: '2024-01-15',
      HospitalState: '在院',
      BloodType: 'A',
      DialysisType: 'HD',
      DialysisFrequency: '2',
      FirstDialysisDate: '2024-01-20',
      DryWeight: 65.5,
      TargetWeightLoss: 2.5,
      VascularAccess: '动静脉内瘘',
      AccessPosition: '左前臂',
      BloodFlowRate: 280,
    });
  }
});
</script>

<template>
  <Page :title="isEdit ? '编辑患者' : '新增患者'" class="patient-edit">
    <ElCard>
      <template #header>
        <div class="flex items-center justify-between">
          <span>{{ isEdit ? '编辑患者信息' : '新增患者信息' }}</span>
          <div class="flex gap-2">
            <ElButton @click="handleCancel">取消</ElButton>
            <ElButton type="primary" :loading="loading" @click="handleSubmit">保存</ElButton>
          </div>
        </div>
      </template>
      
      <!-- 步骤条 -->
      <ElSteps :active="activeStep" finish-status="success" class="mb-8">
        <ElStep title="基本信息" description="填写患者基本资料" />
        <ElStep title="联系方式" description="填写联系信息" />
        <ElStep title="诊疗信息" description="填写透析治疗方案" />
      </ElSteps>

      <!-- 步骤内容 -->
      <div v-show="activeStep === 0">
        <div class="mb-4">
          <span class="text-gray-600 text-sm">患者头像：</span>
          <ElUpload
            action=""
            :before-upload="handleBeforeUpload"
            :show-file-list="false"
            accept="image/*"
          >
            <ElButton size="small">上传头像</ElButton>
          </ElUpload>
        </div>
        <BasicForm />
      </div>

      <div v-show="activeStep === 1">
        <ContactForm />
      </div>

      <div v-show="activeStep === 2">
        <MedicalForm />
      </div>

      <!-- 步骤导航 -->
      <div class="flex justify-center gap-4 mt-8">
        <ElButton v-if="activeStep > 0" @click="prevStep">上一步</ElButton>
        <ElButton v-if="activeStep < 2" type="primary" @click="nextStep">下一步</ElButton>
        <ElButton v-if="activeStep === 2" type="primary" :loading="loading" @click="handleSubmit">
          保存
        </ElButton>
      </div>
    </ElCard>
  </Page>
</template>

<style scoped>
.patient-edit {
  :deep(.el-card__header) {
    padding: 12px 20px;
  }
}
</style>
