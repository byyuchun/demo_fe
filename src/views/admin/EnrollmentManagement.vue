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

    <!-- 搜索区域 -->
    <a-card class="search-card">
      <a-row :gutter="16" align="middle">
        <a-col :span="8">
          <a-input
            v-model:value="searchKeyword"
            placeholder="请输入学生姓名进行搜索"
            allow-clear
            @change="handleSearch"
            @pressEnter="handleSearch"
          >
            <template #prefix>
              <SearchOutlined />
            </template>
          </a-input>
        </a-col>
        <a-col :span="4">
          <a-button type="primary" @click="handleSearch">
            <template #icon><SearchOutlined /></template>
            搜索
          </a-button>
        </a-col>
        <a-col :span="4">
          <a-button @click="handleReset">
            <template #icon><ReloadOutlined /></template>
            重置
          </a-button>
        </a-col>
      </a-row>
    </a-card>

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
          <template v-if="column.key === 'class_name'">
            <a-tag color="blue">{{ record.class_name }} - {{ record.course_name }}</a-tag>
          </template>
          <template v-else-if="column.key === 'price_per_hour'">
            ¥{{ record.price_per_hour }}/节
          </template>
          <template v-else-if="column.key === 'enrolled_at'">
            {{ formatDate(record.enrolled_at) }}
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
        <a-form-item label="选择学生" name="student_id">
          <a-select
            v-model:value="formData.student_id"
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
        
        <a-form-item label="选择教学班" name="class_course_id">
          <a-select
            v-model:value="formData.class_course_id"
            placeholder="请选择教学班"
            style="width: 100%"
            show-search
            :filter-option="filterOption"
          >
            <a-select-option v-for="classCourse in classCourses" :key="classCourse.id" :value="classCourse.id">
              {{ classCourse.display_name }}
            </a-select-option>
          </a-select>
        </a-form-item>
        
        <a-form-item label="报名时间" name="enrolled_at">
          <a-date-picker
            v-model:value="formData.enrolled_at"
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
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons-vue';
import request from '@/utils/request';
import moment from 'moment';
import { toRFC3339, formatDateDisplay } from '@/utils/dateUtils';
import { studentApi, enrollmentApi } from '@/api/admin';
import { getTeachingClasses, type TeachingClass } from '@/api/teachingClass';

interface Enrollment {
  id: number;
  student_id: number;
  student_name: string;
  class_course_id: number;
  class_name: string;
  course_name: string;
  semester_name: string;
  price_per_hour: number;
  enrolled_at: string;
}

interface Student {
  id: number;
  name: string;
}

interface ClassCourse {
  id: number;
  className: string;
  courseName: string;
  display_name: string;
}

export default defineComponent({
  components: {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    SearchOutlined,
    ReloadOutlined,
  },
  setup() {
    const loading = ref(false);
    const modalVisible = ref(false);
    const confirmLoading = ref(false);
    const isEdit = ref(false);
    const formRef = ref();
    const searchKeyword = ref('');
    
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
      student_id: undefined,
      class_course_id: undefined,
      enrolled_at: null,
    });
    
    // 表格列定义
    const columns = [
      {
        title: '学生姓名',
        dataIndex: 'student_name',
        key: 'student_name',
      },
      {
        title: '教学班',
        dataIndex: 'class_name',
        key: 'class_name',
      },
      {
        title: '学期',
        dataIndex: 'semester_name',
        key: 'semester_name',
      },
      {
        title: '教学班价格',
        dataIndex: 'price_per_hour',
        key: 'price_per_hour',
      },
      {
        title: '报名时间',
        dataIndex: 'enrolled_at',
        key: 'enrolled_at',
      },
      {
        title: '操作',
        key: 'action',
        width: 200,
      },
    ];
    
    // 表单验证规则
    const rules = {
      student_id: [
        { required: true, message: '请选择学生', trigger: 'change' },
      ],
      class_course_id: [
        { required: true, message: '请选择教学班', trigger: 'change' },
      ],
      enrolled_at: [
        { required: true, message: '请选择报名时间', trigger: 'change' },
      ],
    };
    
    // 模态框标题
    const modalTitle = computed(() => isEdit.value ? '编辑报名' : '新增报名');
    
    // 搜索过滤
    const filterOption = (input: string, option: any) => {
      return option.children.toLowerCase().includes(input.toLowerCase());
    };
    
    // 格式化日期（用于显示）
    const formatDate = (date: string) => {
      return formatDateDisplay(date);
    };
    
    // 搜索处理
    const handleSearch = () => {
      pagination.current = 1; // 重置到第一页
      loadEnrollments();
    };
    
    // 重置搜索
    const handleReset = () => {
      searchKeyword.value = '';
      pagination.current = 1;
      loadEnrollments();
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
        const params: any = {};
        if (searchKeyword.value.trim()) {
          params.student_name = searchKeyword.value.trim();
        }
        const response = await enrollmentApi.getWithDetail(params);
        enrollments.value = response.data.data || [];
        pagination.total = (response.data.data || []).length;
      } catch (error) {
        message.error('加载报名列表失败');
      } finally {
        loading.value = false;
      }
    };
    
    // 加载学生列表
    const loadStudents = async () => {
      try {
        const response = await studentApi.getAll();
        students.value = response.data.data || [];
      } catch (error) {
        message.error('加载学生列表失败');
      }
    };
    
    // 加载班级课程列表（教学班）
    const loadClassCourses = async () => {
      try {
        const response = await getTeachingClasses();
        const teachingClasses = response.data.data || [];
        classCourses.value = teachingClasses.map((tc: TeachingClass) => ({
          id: tc.id,
          className: tc.class_name,
          courseName: tc.course_name,
          display_name: tc.display_name,
        }));
      } catch (error) {
        message.error('加载教学班列表失败');
      }
    };
    
    // 显示创建模态框
    const showCreateModal = () => {
      isEdit.value = false;
      resetForm();
      modalVisible.value = true;
    };
    
    // 显示编辑模态框
    const showEditModal = (record: any) => {
      isEdit.value = true;
      formData.id = record.id;
      formData.student_id = record.student_id;
      formData.class_course_id = record.class_course_id;
      formData.enrolled_at = moment(record.enrolled_at);
      modalVisible.value = true;
    };
    
    // 重置表单
    const resetForm = () => {
      formData.id = undefined;
      formData.student_id = undefined;
      formData.class_course_id = undefined;
      formData.enrolled_at = null;
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
          enrolled_at: toRFC3339(formData.enrolled_at, false),
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
      searchKeyword,
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
      handleSearch,
      handleReset,
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

.search-card {
  margin-bottom: 20px;
}
</style> 