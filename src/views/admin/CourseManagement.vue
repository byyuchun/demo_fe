<template>
  <div class="course-management">
    <div class="page-header">
      <a-row justify="space-between" align="middle">
        <a-col>
          <h2>课程管理</h2>
        </a-col>
        <a-col>
          <a-button type="primary" @click="showCreateModal">
            <template #icon><PlusOutlined /></template>
            添加课程
          </a-button>
        </a-col>
      </a-row>
    </div>

    <a-card>
      <a-table
        :columns="columns"
        :data-source="courses"
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
          <template v-if="column.key === 'action'">
            <a-space>
              <a-button size="small" @click="showEditModal(record)">
                <template #icon><EditOutlined /></template>
                编辑
              </a-button>
              <a-popconfirm
                title="确定删除这个课程吗？"
                ok-text="确定"
                cancel-text="取消"
                @confirm="deleteCourse(record.id)"
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

    <!-- 创建/编辑课程的模态框 -->
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
        <a-form-item label="课程名称" name="name">
          <a-input v-model:value="formData.name" placeholder="请输入课程名称" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, reactive, computed } from 'vue';
import { message } from 'ant-design-vue';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons-vue';
import request from '@/utils/request';

interface Course {
  id: number;
  name: string;
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
    
    const courses = ref<Course[]>([]);
    const pagination = reactive({
      current: 1,
      pageSize: 10,
      total: 0,
    });
    
    const formData = reactive({
      id: undefined,
      name: '',
    });
    
    // 表格列定义
    const columns = [
      {
        title: '课程名称',
        dataIndex: 'name',
        key: 'name',
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
        { required: true, message: '请输入课程名称', trigger: 'blur' },
      ],
    };
    
    // 模态框标题
    const modalTitle = computed(() => isEdit.value ? '编辑课程' : '添加课程');
    
    // 加载课程列表
    const loadCourses = async () => {
      loading.value = true;
      try {
        const response = await request.get('/api/h1/course', {
          params: {
            page: pagination.current,
            pageSize: pagination.pageSize,
          },
        });
        courses.value = response.data.data || [];
        pagination.total = response.data.total || 0;
      } catch (error) {
        message.error('加载课程列表失败');
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
    const showEditModal = (record: Course) => {
      isEdit.value = true;
      formData.id = record.id;
      formData.name = record.name;
      modalVisible.value = true;
    };
    
    // 重置表单
    const resetForm = () => {
      formData.id = undefined;
      formData.name = '';
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
          await request.put('/api/h1/course', formData);
          message.success('课程更新成功');
        } else {
          await request.post('/api/h1/course', formData);
          message.success('课程创建成功');
        }
        
        modalVisible.value = false;
        loadCourses();
      } catch (error) {
        message.error(isEdit.value ? '课程更新失败' : '课程创建失败');
      } finally {
        confirmLoading.value = false;
      }
    };
    
    // 取消操作
    const handleCancel = () => {
      modalVisible.value = false;
      resetForm();
    };
    
    // 删除课程
    const deleteCourse = async (id: number) => {
      try {
        await request.delete(`/api/h1/course/${id}`);
        message.success('课程删除成功');
        loadCourses();
      } catch (error) {
        message.error('课程删除失败');
      }
    };
    
    // 处理表格变化
    const handleTableChange = (pag: any) => {
      pagination.current = pag.current;
      pagination.pageSize = pag.pageSize;
      loadCourses();
    };
    
    onMounted(() => {
      loadCourses();
    });
    
    return {
      loading,
      modalVisible,
      confirmLoading,
      isEdit,
      formRef,
      courses,
      pagination,
      formData,
      columns,
      rules,
      modalTitle,
      showCreateModal,
      showEditModal,
      handleSubmit,
      handleCancel,
      deleteCourse,
      handleTableChange,
    };
  },
});
</script>

<style scoped>
.course-management {
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