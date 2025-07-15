<template>
  <div class="class-management">
    <div class="page-header">
      <a-row justify="space-between" align="middle">
        <a-col>
          <h2>班级管理</h2>
        </a-col>
        <a-col>
          <a-space>
            <a-select
              v-model:value="selectedSemester"
              placeholder="选择学期"
              style="width: 200px"
              @change="handleSemesterChange"
            >
              <a-select-option value="">全部学期</a-select-option>
              <a-select-option v-for="semester in semesters" :key="semester.id" :value="semester.id">
                {{ semester.name }}
              </a-select-option>
            </a-select>
            <a-button type="primary" @click="showCreateModal">
              <template #icon><PlusOutlined /></template>
              添加班级
            </a-button>
          </a-space>
        </a-col>
      </a-row>
    </div>

    <a-card>
      <a-table
        :columns="columns"
        :data-source="classes"
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
          <template v-if="column.key === 'semesterName'">
            <a-tag color="blue">{{ record.semesterName }}</a-tag>
          </template>
          <template v-else-if="column.key === 'action'">
            <a-space>
              <a-button size="small" @click="showEditModal(record)">
                <template #icon><EditOutlined /></template>
                编辑
              </a-button>
              <a-popconfirm
                title="确定删除这个班级吗？"
                ok-text="确定"
                cancel-text="取消"
                @confirm="deleteClass(record.id)"
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

    <!-- 创建/编辑班级的模态框 -->
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
        <a-form-item label="班级名称" name="name">
          <a-input v-model:value="formData.name" placeholder="请输入班级名称" />
        </a-form-item>
        
        <a-form-item label="所属学期" name="semester_id">
          <a-select
            v-model:value="formData.semester_id"
            placeholder="请选择学期"
            style="width: 100%"
          >
            <a-select-option v-for="semester in semesters" :key="semester.id" :value="semester.id">
              {{ semester.name }}
            </a-select-option>
          </a-select>
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

interface Class {
  id: number;
  name: string;
  semester_id: number;
  semesterName: string;
}

interface Semester {
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
    const selectedSemester = ref('');
    
    const classes = ref<Class[]>([]);
    const semesters = ref<Semester[]>([]);
    
    const pagination = reactive({
      current: 1,
      pageSize: 10,
      total: 0,
    });
    
    const formData = reactive({
      id: undefined,
      name: '',
      semester_id: undefined,
    });
    
    // 表格列定义
    const columns = [
      {
        title: '班级名称',
        dataIndex: 'name',
        key: 'name',
      },
      {
        title: '所属学期',
        dataIndex: 'semesterName',
        key: 'semesterName',
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
        { required: true, message: '请输入班级名称', trigger: 'blur' },
      ],
      semester_id: [
        { required: true, message: '请选择学期', trigger: 'change' },
      ],
    };
    
    // 模态框标题
    const modalTitle = computed(() => isEdit.value ? '编辑班级' : '添加班级');
    
    // 加载学期列表
    const loadSemesters = async () => {
      try {
        const response = await request.get('/api/h1/semester');
        semesters.value = response.data.data || [];
      } catch (error) {
        message.error('加载学期列表失败');
      }
    };
    
    // 加载班级列表
    const loadClasses = async () => {
      loading.value = true;
      try {
        const response = await request.get('/api/h1/class/with-semester', {
          params: {
            semester_id: selectedSemester.value || undefined,
          },
        });
        classes.value = response.data.data || [];
        pagination.total = classes.value.length; // 前端分页
      } catch (error) {
        message.error('加载班级列表失败');
      } finally {
        loading.value = false;
      }
    };
    
    // 学期变化处理
    const handleSemesterChange = () => {
      pagination.current = 1;
      loadClasses();
    };
    
    // 显示创建模态框
    const showCreateModal = () => {
      isEdit.value = false;
      resetForm();
      modalVisible.value = true;
    };
    
    // 显示编辑模态框
    const showEditModal = (record: Class) => {
      isEdit.value = true;
      formData.id = record.id;
      formData.name = record.name;
      formData.semester_id = record.semester_id;
      modalVisible.value = true;
    };
    
    // 重置表单
    const resetForm = () => {
      formData.id = undefined;
      formData.name = '';
      formData.semester_id = undefined;
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
          await request.put('/api/h1/class', formData);
          message.success('班级更新成功');
        } else {
          await request.post('/api/h1/class', formData);
          message.success('班级创建成功');
        }
        
        modalVisible.value = false;
        loadClasses();
      } catch (error) {
        message.error(isEdit.value ? '班级更新失败' : '班级创建失败');
      } finally {
        confirmLoading.value = false;
      }
    };
    
    // 取消操作
    const handleCancel = () => {
      modalVisible.value = false;
      resetForm();
    };
    
    // 删除班级
    const deleteClass = async (id: number) => {
      try {
        await request.delete(`/api/h1/class/${id}`);
        message.success('班级删除成功');
        loadClasses();
      } catch (error) {
        message.error('班级删除失败');
      }
    };
    
    // 处理表格变化
    const handleTableChange = (pag: any) => {
      pagination.current = pag.current;
      pagination.pageSize = pag.pageSize;
      loadClasses();
    };
    
    onMounted(() => {
      loadSemesters();
      loadClasses();
    });
    
    return {
      loading,
      modalVisible,
      confirmLoading,
      isEdit,
      formRef,
      selectedSemester,
      classes,
      semesters,
      pagination,
      formData,
      columns,
      rules,
      modalTitle,
      handleSemesterChange,
      showCreateModal,
      showEditModal,
      handleSubmit,
      handleCancel,
      deleteClass,
      handleTableChange,
    };
  },
});
</script>

<style scoped>
.class-management {
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