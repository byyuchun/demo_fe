<template>
  <div class="semester-management">
    <div class="page-header">
      <a-row justify="space-between" align="middle">
        <a-col>
          <h2>学期管理</h2>
        </a-col>
        <a-col>
          <a-button type="primary" @click="showCreateModal">
            <template #icon><PlusOutlined /></template>
            添加学期
          </a-button>
        </a-col>
      </a-row>
    </div>

    <a-card>
      <a-table
        :columns="columns"
        :data-source="semesters"
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
          <template v-if="column.key === 'startDate'">
            {{ formatDate(record.startDate) }}
          </template>
          <template v-else-if="column.key === 'endDate'">
            {{ formatDate(record.endDate) }}
          </template>
          <template v-else-if="column.key === 'action'">
            <a-space>
              <a-button size="small" @click="showEditModal(record)">
                <template #icon><EditOutlined /></template>
                编辑
              </a-button>
              <a-popconfirm
                title="确定删除这个学期吗？"
                ok-text="确定"
                cancel-text="取消"
                @confirm="deleteSemester(record.id)"
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

    <!-- 创建/编辑学期的模态框 -->
    <a-modal
      v-model:visible="modalVisible"
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
        <a-form-item label="学期名称" name="name">
          <a-input v-model:value="formData.name" placeholder="请输入学期名称" />
        </a-form-item>
        
        <a-form-item label="开始日期" name="startDate">
          <a-date-picker
            v-model:value="formData.startDate"
            placeholder="请选择开始日期"
            style="width: 100%"
          />
        </a-form-item>
        
        <a-form-item label="结束日期" name="endDate">
          <a-date-picker
            v-model:value="formData.endDate"
            placeholder="请选择结束日期"
            style="width: 100%"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, reactive, computed } from 'vue';
import { message } from 'ant-design-vue';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons-vue';
import { semesterApi } from '@/api/admin';
import moment from 'moment';
import { toRFC3339, formatDateDisplay } from '@/utils/dateUtils';

interface Semester {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
}

export default defineComponent({
  components: {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
  },
  setup() {
    const loading = ref(false);
    const modalVisible = ref(false);
    const confirmLoading = ref(false);
    const isEdit = ref(false);
    const formRef = ref();
    
    const semesters = ref<Semester[]>([]);
    const pagination = reactive({
      current: 1,
      pageSize: 10,
      total: 0,
    });
    
    const formData = reactive({
      id: undefined,
      name: '',
      startDate: null,
      endDate: null,
    });
    
    // 表格列定义
    const columns = [
      {
        title: '学期名称',
        dataIndex: 'name',
        key: 'name',
      },
      {
        title: '开始日期',
        dataIndex: 'startDate',
        key: 'startDate',
      },
      {
        title: '结束日期',
        dataIndex: 'endDate',
        key: 'endDate',
      },
      {
        title: '操作',
        key: 'action',
        width: 200,
      },
    ];
    
    // 表单验证规则
    const rules = {
      name: [
        { required: true, message: '请输入学期名称', trigger: 'blur' },
      ],
      startDate: [
        { required: true, message: '请选择开始日期', trigger: 'change' },
      ],
      endDate: [
        { required: true, message: '请选择结束日期', trigger: 'change' },
      ],
    };
    
    // 模态框标题
    const modalTitle = computed(() => isEdit.value ? '编辑学期' : '添加学期');
    
    // 格式化日期（用于显示）
    const formatDate = (date: string) => {
      return formatDateDisplay(date);
    };
    
    // 加载学期列表
    const loadSemesters = async () => {
      loading.value = true;
      try {
        const response = await semesterApi.getAll();
        semesters.value = response.data.data || [];
        pagination.total = semesters.value.length;
      } catch (error) {
        message.error('加载学期列表失败');
      } finally {
        loading.value = false;
      }
    };
    
    // 显示创建模态框
    const showCreateModal = () => {
      isEdit.value = false;
      resetForm();
      modalVisible.value = true;
    };
    
    // 显示编辑模态框
    const showEditModal = (record: Semester) => {
      isEdit.value = true;
      formData.id = record.id;
      formData.name = record.name;
      formData.startDate = moment(record.startDate);
      formData.endDate = moment(record.endDate);
      modalVisible.value = true;
    };
    
    // 重置表单
    const resetForm = () => {
      formData.id = undefined;
      formData.name = '';
      formData.startDate = null;
      formData.endDate = null;
      if (formRef.value) {
        formRef.value.clearValidate();
      }
    };
    
    // 提交表单
    const handleSubmit = async () => {
      try {
        await formRef.value.validate();
        confirmLoading.value = true;
        
        const requestData = {
          name: formData.name,
          start_date: toRFC3339(formData.startDate, false),
          end_date: toRFC3339(formData.endDate, true),
        };
        
        if (isEdit.value) {
          await semesterApi.update({
            id: formData.id,
            ...requestData,
          });
          message.success('学期更新成功');
        } else {
          await semesterApi.create(requestData);
          message.success('学期创建成功');
        }
        
        modalVisible.value = false;
        loadSemesters();
      } catch (error) {
        message.error(isEdit.value ? '学期更新失败' : '学期创建失败');
      } finally {
        confirmLoading.value = false;
      }
    };
    
    // 取消操作
    const handleCancel = () => {
      modalVisible.value = false;
      resetForm();
    };
    
    // 删除学期
    const deleteSemester = async (id: number) => {
      try {
        await semesterApi.delete(id);
        message.success('学期删除成功');
        loadSemesters();
      } catch (error) {
        message.error('学期删除失败');
      }
    };
    
    // 处理表格变化
    const handleTableChange = (pagination: any) => {
      pagination.current = pagination.current;
      pagination.pageSize = pagination.pageSize;
      loadSemesters();
    };
    
    onMounted(() => {
      loadSemesters();
    });
    
    return {
      loading,
      modalVisible,
      confirmLoading,
      isEdit,
      formRef,
      semesters,
      pagination,
      formData,
      columns,
      rules,
      modalTitle,
      formatDate,
      showCreateModal,
      showEditModal,
      handleSubmit,
      handleCancel,
      deleteSemester,
      handleTableChange,
    };
  },
});
</script>

<style scoped>
.semester-management {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  color: #1890ff;
}
</style> 