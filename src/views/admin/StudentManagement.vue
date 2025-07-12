<template>
  <div class="student-management">
    <div class="page-header">
      <a-row justify="space-between" align="middle">
        <a-col>
          <h2>学生管理</h2>
        </a-col>
        <a-col>
          <a-space>
            <a-input-search
              v-model:value="searchKeyword"
              placeholder="搜索学生姓名或联系方式"
              style="width: 300px"
              @search="handleSearch"
            />
            <a-button type="primary" @click="showCreateModal">
              <template #icon><PlusOutlined /></template>
              添加学生
            </a-button>
          </a-space>
        </a-col>
      </a-row>
    </div>

    <a-card>
      <a-table
        :columns="columns"
        :data-source="students"
        :loading="loading"
        row-key="id"
        :pagination="{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          showQuickJumper: true,
          onChange: handleTableChange,
        }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'discountRate'">
            <a-tag :color="getDiscountColor(record.discountRate)">
              {{ (record.discountRate * 100).toFixed(0) }}%
            </a-tag>
          </template>
          <template v-else-if="column.key === 'action'">
            <a-space>
              <a-button size="small" @click="showEditModal(record)">
                <template #icon><EditOutlined /></template>
                编辑
              </a-button>
              <a-button size="small" @click="showDiscountModal(record)">
                <template #icon><PercentageOutlined /></template>
                设置优惠
              </a-button>
              <a-popconfirm
                title="确定删除这个学生吗？"
                ok-text="确定"
                cancel-text="取消"
                @confirm="deleteStudent(record.id)"
              >
                <a-button size="small" danger>
                  <template #icon><DeleteOutlined /></template>
                  删除
                </a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 创建/编辑学生的模态框 -->
    <a-modal
      v-model:open="modalVisible"
      :title="modalTitle"
      @ok="handleSubmit"
      @cancel="handleCancel"
      :confirm-loading="confirmLoading"
    >
      <a-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        layout="vertical"
      >
        <a-form-item label="学生姓名" name="name">
          <a-input v-model:value="formData.name" placeholder="请输入学生姓名" />
        </a-form-item>
        
        <a-form-item label="联系方式" name="contact">
          <a-input v-model:value="formData.contact" placeholder="请输入联系方式" />
        </a-form-item>
        
        <a-form-item label="优惠率" name="discountRate">
          <a-input-number
            v-model:value="formData.discountRate"
            :min="0.1"
            :max="1"
            :step="0.1"
            :precision="2"
            placeholder="请输入优惠率"
            style="width: 100%"
          />
          <div class="form-help">1.0 表示无优惠，0.8 表示8折优惠</div>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 设置优惠的模态框 -->
    <a-modal
      v-model:open="discountModalVisible"
      title="设置学生优惠"
      @ok="handleDiscountSubmit"
      @cancel="handleDiscountCancel"
      :confirm-loading="discountConfirmLoading"
    >
      <a-form
        ref="discountFormRef"
        :model="discountFormData"
        :rules="discountRules"
        layout="vertical"
      >
        <a-form-item label="学生姓名">
          <a-input :value="discountFormData.studentName" disabled />
        </a-form-item>
        
        <a-form-item label="优惠率" name="discountRate">
          <a-slider
            v-model:value="discountFormData.discountRate"
            :min="0.1"
            :max="1"
            :step="0.05"
            :marks="discountMarks"
          />
          <div class="discount-preview">
            <span>当前优惠率: {{ (discountFormData.discountRate * 100).toFixed(0) }}%</span>
            <span v-if="discountFormData.discountRate < 1" class="discount-text">
              ({{ (100 - discountFormData.discountRate * 100).toFixed(0) }}折)
            </span>
          </div>
        </a-form-item>
        
        <a-form-item label="备注">
          <a-textarea v-model:value="discountFormData.remark" placeholder="优惠原因或备注" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, reactive, computed } from 'vue';
import { message } from 'ant-design-vue';
import { PlusOutlined, EditOutlined, DeleteOutlined, PercentageOutlined } from '@ant-design/icons-vue';
import { studentApi } from '@/api/admin';

interface Student {
  id: number;
  name: string;
  contact: string;
  discountRate: number;
}

export default defineComponent({
  components: {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    PercentageOutlined,
  },
  setup() {
    const loading = ref(false);
    const modalVisible = ref(false);
    const discountModalVisible = ref(false);
    const confirmLoading = ref(false);
    const discountConfirmLoading = ref(false);
    const isEdit = ref(false);
    const formRef = ref();
    const discountFormRef = ref();
    const searchKeyword = ref('');
    
    const students = ref<Student[]>([]);
    const pagination = reactive({
      current: 1,
      pageSize: 10,
      total: 0,
    });
    
    const formData = reactive({
      id: undefined,
      name: '',
      contact: '',
      discountRate: 1.0,
    });
    
    const discountFormData = reactive({
      id: undefined,
      studentName: '',
      discountRate: 1.0,
      remark: '',
    });
    
    // 表格列定义
    const columns = [
      {
        title: '学生姓名',
        dataIndex: 'name',
        key: 'name',
      },
      {
        title: '联系方式',
        dataIndex: 'contact',
        key: 'contact',
      },
      {
        title: '优惠率',
        dataIndex: 'discountRate',
        key: 'discountRate',
        width: 100,
      },
      {
        title: '操作',
        key: 'action',
        width: 250,
      },
    ];
    
    // 表单验证规则
    const rules = {
      name: [
        { required: true, message: '请输入学生姓名', trigger: 'blur' },
      ],
      contact: [
        { required: true, message: '请输入联系方式', trigger: 'blur' },
      ],
      discountRate: [
        { required: true, message: '请输入优惠率', trigger: 'blur' },
      ],
    };
    
    const discountRules = {
      discountRate: [
        { required: true, message: '请设置优惠率', trigger: 'blur' },
      ],
    };
    
    // 优惠率标记
    const discountMarks = {
      0.1: '1折',
      0.2: '2折',
      0.3: '3折',
      0.4: '4折',
      0.5: '5折',
      0.6: '6折',
      0.7: '7折',
      0.8: '8折',
      0.9: '9折',
      1.0: '无优惠',
    };
    
    // 模态框标题
    const modalTitle = computed(() => isEdit.value ? '编辑学生' : '添加学生');
    
    // 获取优惠率颜色
    const getDiscountColor = (rate: number) => {
      if (rate >= 1) return 'default';
      if (rate >= 0.8) return 'green';
      if (rate >= 0.6) return 'orange';
      return 'red';
    };
    
    // 加载学生列表
    const loadStudents = async () => {
      loading.value = true;
      try {
        const response = await studentApi.getAll();
        students.value = response.data.data || [];
        pagination.total = students.value.length;
      } catch (error) {
        message.error('加载学生列表失败');
      } finally {
        loading.value = false;
      }
    };
    
    // 搜索学生
    const handleSearch = () => {
      pagination.current = 1;
      loadStudents();
    };
    
    // 显示创建模态框
    const showCreateModal = () => {
      isEdit.value = false;
      resetForm();
      modalVisible.value = true;
    };
    
    // 显示编辑模态框
    const showEditModal = (record: Student) => {
      isEdit.value = true;
      formData.id = record.id;
      formData.name = record.name;
      formData.contact = record.contact;
      formData.discountRate = record.discountRate;
      modalVisible.value = true;
    };
    
    // 显示优惠设置模态框
    const showDiscountModal = (record: Student) => {
      discountFormData.id = record.id;
      discountFormData.studentName = record.name;
      discountFormData.discountRate = record.discountRate;
      discountFormData.remark = '';
      discountModalVisible.value = true;
    };
    
    // 重置表单
    const resetForm = () => {
      formData.id = undefined;
      formData.name = '';
      formData.contact = '';
      formData.discountRate = 1.0;
      if (formRef.value) {
        formRef.value.clearValidate();
      }
    };
    
    // 提交表单
    const handleSubmit = async () => {
      try {
        await formRef.value.validate();
        confirmLoading.value = true;
        
        if (isEdit.value) {
          await studentApi.update({
            id: formData.id,
            name: formData.name,
            contact: formData.contact,
            discount_rate: formData.discountRate,
          });
          message.success('学生信息更新成功');
        } else {
          await studentApi.create({
            name: formData.name,
            contact: formData.contact,
            discount_rate: formData.discountRate,
          });
          message.success('学生添加成功');
        }
        
        modalVisible.value = false;
        loadStudents();
      } catch (error) {
        message.error(isEdit.value ? '学生信息更新失败' : '学生添加失败');
      } finally {
        confirmLoading.value = false;
      }
    };
    
    // 提交优惠设置
    const handleDiscountSubmit = async () => {
      try {
        await discountFormRef.value.validate();
        discountConfirmLoading.value = true;
        
        await studentApi.update({
          id: discountFormData.id,
          discount_rate: discountFormData.discountRate,
        });
        
        message.success('优惠设置成功');
        discountModalVisible.value = false;
        loadStudents();
      } catch (error) {
        message.error('优惠设置失败');
      } finally {
        discountConfirmLoading.value = false;
      }
    };
    
    // 取消操作
    const handleCancel = () => {
      modalVisible.value = false;
      resetForm();
    };
    
    const handleDiscountCancel = () => {
      discountModalVisible.value = false;
    };
    
    // 删除学生
    const deleteStudent = async (id: number) => {
      try {
        await studentApi.delete(id);
        message.success('学生删除成功');
        loadStudents();
      } catch (error) {
        message.error('学生删除失败');
      }
    };
    
    // 处理表格变化
    const handleTableChange = (pag: any) => {
      pagination.current = pag.current;
      pagination.pageSize = pag.pageSize;
      loadStudents();
    };
    
    onMounted(() => {
      loadStudents();
    });
    
    return {
      loading,
      modalVisible,
      discountModalVisible,
      confirmLoading,
      discountConfirmLoading,
      isEdit,
      formRef,
      discountFormRef,
      searchKeyword,
      students,
      pagination,
      formData,
      discountFormData,
      columns,
      rules,
      discountRules,
      discountMarks,
      modalTitle,
      getDiscountColor,
      handleSearch,
      showCreateModal,
      showEditModal,
      showDiscountModal,
      handleSubmit,
      handleDiscountSubmit,
      handleCancel,
      handleDiscountCancel,
      deleteStudent,
      handleTableChange,
    };
  },
});
</script>

<style scoped>
.student-management {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  color: #1890ff;
}

.form-help {
  color: #999;
  font-size: 12px;
  margin-top: 4px;
}

.discount-preview {
  margin-top: 10px;
  padding: 10px;
  background: #f5f5f5;
  border-radius: 4px;
}

.discount-text {
  color: #f5222d;
  font-weight: bold;
  margin-left: 10px;
}
</style> 