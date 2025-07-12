<template>
  <div class="enrollment-management">
    <div class="page-header">
      <a-row justify="space-between" align="middle">
        <a-col>
          <h2>报名管理</h2>
        </a-col>
        <a-col>
          <a-button type="primary" @click="showCreateModal">
            <template #icon><PlusOutlined /></template>
            新增报名
          </a-button>
        </a-col>
      </a-row>
    </div>

    <a-card>
      <a-table
        :columns="columns"
        :data-source="enrollments"
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
          <template v-if="column.key === 'enrolledAt'">
            {{ formatDate(record.enrolledAt) }}
          </template>
          <template v-else-if="column.key === 'action'">
            <a-space>
              <a-button size="small" @click="showEditModal(record)">
                <template #icon><EditOutlined /></template>
                编辑
              </a-button>
              <a-popconfirm
                title="确定删除这个报名记录吗？"
                ok-text="确定"
                cancel-text="取消"
                @confirm="deleteEnrollment(record.id)"
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

    <!-- 创建/编辑报名的模态框 -->
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
        <a-form-item label="选择学生" name="studentId">
          <a-select
            v-model:value="formData.studentId"
            placeholder="请选择学生"
            style="width: 100%"
            show-search
            :filter-option="filterOption"
          >
            <a-select-option v-for="student in students" :key="student.id" :value="student.id">
              {{ student.name }}
            </a-select-option>
          </a-select>
        </a-form-item>
        
        <a-form-item label="选择班级课程" name="classCourseId">
          <a-select
            v-model:value="formData.classCourseId"
            placeholder="请选择班级课程"
            style="width: 100%"
          >
            <a-select-option v-for="classCourse in classCourses" :key="classCourse.id" :value="classCourse.id">
              {{ classCourse.className }} - {{ classCourse.courseName }}
            </a-select-option>
          </a-select>
        </a-form-item>
        
        <a-form-item label="报名时间" name="enrolledAt">
          <a-date-picker
            v-model:value="formData.enrolledAt"
            placeholder="请选择报名时间"
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
import request from '@/utils/request';
import moment from 'moment';

interface Enrollment {
  id: number;
  studentId: number;
  studentName: string;
  classCourseId: number;
  className: string;
  courseName: string;
  enrolledAt: string;
}

interface Student {
  id: number;
  name: string;
}

interface ClassCourse {
  id: number;
  className: string;
  courseName: string;
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
    
    const enrollments = ref<Enrollment[]>([]);
    const students = ref<Student[]>([]);
    const classCourses = ref<ClassCourse[]>([]);
    
    const pagination = reactive({
      current: 1,
      pageSize: 10,
      total: 0,
    });
    
    const formData = reactive({
      id: undefined,
      studentId: undefined,
      classCourseId: undefined,
      enrolledAt: null,
    });
    
    // 表格列定义
    const columns = [
      {
        title: '学生姓名',
        dataIndex: 'studentName',
        key: 'studentName',
      },
      {
        title: '班级',
        dataIndex: 'className',
        key: 'className',
      },
      {
        title: '课程',
        dataIndex: 'courseName',
        key: 'courseName',
      },
      {
        title: '报名时间',
        dataIndex: 'enrolledAt',
        key: 'enrolledAt',
      },
      {
        title: '操作',
        key: 'action',
        width: 200,
      },
    ];
    
    // 表单验证规则
    const rules = {
      studentId: [
        { required: true, message: '请选择学生', trigger: 'change' },
      ],
      classCourseId: [
        { required: true, message: '请选择班级课程', trigger: 'change' },
      ],
      enrolledAt: [
        { required: true, message: '请选择报名时间', trigger: 'change' },
      ],
    };
    
    // 模态框标题
    const modalTitle = computed(() => isEdit.value ? '编辑报名' : '新增报名');
    
    // 搜索过滤
    const filterOption = (input: string, option: any) => {
      return option.children.toLowerCase().includes(input.toLowerCase());
    };
    
    // 格式化日期
    const formatDate = (date: string) => {
      return moment(date).format('YYYY-MM-DD');
    };
    
    // 加载数据
    const loadData = async () => {
      await Promise.all([
        loadEnrollments(),
        loadStudents(),
        loadClassCourses(),
      ]);
    };
    
    // 加载报名列表
    const loadEnrollments = async () => {
      loading.value = true;
      try {
        const response = await request.get('/api/h1/enrollment', {
          params: {
            page: pagination.current,
            pageSize: pagination.pageSize,
          },
        });
        enrollments.value = response.data.data || [];
        pagination.total = response.data.total || 0;
      } catch (error) {
        message.error('加载报名列表失败');
      } finally {
        loading.value = false;
      }
    };
    
    // 加载学生列表
    const loadStudents = async () => {
      try {
        const response = await request.get('/api/h1/student');
        students.value = response.data.data || [];
      } catch (error) {
        message.error('加载学生列表失败');
      }
    };
    
    // 加载班级课程列表
    const loadClassCourses = async () => {
      try {
        const response = await request.get('/api/h1/class-course');
        classCourses.value = response.data.data || [];
      } catch (error) {
        message.error('加载班级课程列表失败');
      }
    };
    
    // 显示创建模态框
    const showCreateModal = () => {
      isEdit.value = false;
      resetForm();
      modalVisible.value = true;
    };
    
    // 显示编辑模态框
    const showEditModal = (record: Enrollment) => {
      isEdit.value = true;
      formData.id = record.id;
      formData.studentId = record.studentId;
      formData.classCourseId = record.classCourseId;
      formData.enrolledAt = moment(record.enrolledAt);
      modalVisible.value = true;
    };
    
    // 重置表单
    const resetForm = () => {
      formData.id = undefined;
      formData.studentId = undefined;
      formData.classCourseId = undefined;
      formData.enrolledAt = null;
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
          ...formData,
          enrolledAt: formData.enrolledAt.format('YYYY-MM-DD'),
        };
        
        if (isEdit.value) {
          await request.put('/api/h1/enrollment', requestData);
          message.success('报名更新成功');
        } else {
          await request.post('/api/h1/enrollment', requestData);
          message.success('报名创建成功');
        }
        
        modalVisible.value = false;
        loadEnrollments();
      } catch (error) {
        message.error(isEdit.value ? '报名更新失败' : '报名创建失败');
      } finally {
        confirmLoading.value = false;
      }
    };
    
    // 取消操作
    const handleCancel = () => {
      modalVisible.value = false;
      resetForm();
    };
    
    // 删除报名
    const deleteEnrollment = async (id: number) => {
      try {
        await request.delete(`/api/h1/enrollment/${id}`);
        message.success('报名删除成功');
        loadEnrollments();
      } catch (error) {
        message.error('报名删除失败');
      }
    };
    
    // 处理表格变化
    const handleTableChange = (pag: any) => {
      pagination.current = pag.current;
      pagination.pageSize = pag.pageSize;
      loadEnrollments();
    };
    
    onMounted(() => {
      loadData();
    });
    
    return {
      loading,
      modalVisible,
      confirmLoading,
      isEdit,
      formRef,
      enrollments,
      students,
      classCourses,
      pagination,
      formData,
      columns,
      rules,
      modalTitle,
      filterOption,
      formatDate,
      showCreateModal,
      showEditModal,
      handleSubmit,
      handleCancel,
      deleteEnrollment,
      handleTableChange,
    };
  },
});
</script>

<style scoped>
.enrollment-management {
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