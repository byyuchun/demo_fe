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
              <a-button size="small" @click="viewClassCourses(record)">
                <template #icon><BookOutlined /></template>
                课程设置
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
        <a-form-item label="班级名称" name="name">
          <a-input v-model:value="formData.name" placeholder="请输入班级名称" />
        </a-form-item>
        
        <a-form-item label="所属学期" name="semesterId">
          <a-select
            v-model:value="formData.semesterId"
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

    <!-- 班级课程设置模态框 -->
    <a-modal
      v-model:open="coursesModalVisible"
      title="班级课程设置"
      width="800px"
      @ok="handleCoursesSubmit"
      @cancel="handleCoursesCancel"
      :confirm-loading="coursesConfirmLoading"
    >
      <div class="courses-header">
        <h3>{{ currentClass.name }} - 课程设置</h3>
        <a-button type="primary" size="small" @click="showAddCourseModal">
          <template #icon><PlusOutlined /></template>
          添加课程
        </a-button>
      </div>
      
      <a-table
        :columns="courseColumns"
        :data-source="classCourses"
        :loading="coursesLoading"
        row-key="id"
        :pagination="false"
        size="small"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'pricePerHour'">
            ¥{{ record.pricePerHour }}
          </template>
          <template v-else-if="column.key === 'action'">
            <a-space>
              <a-button size="small" @click="editClassCourse(record)">
                <template #icon><EditOutlined /></template>
                编辑
              </a-button>
              <a-popconfirm
                title="确定删除这个课程吗？"
                ok-text="确定"
                cancel-text="取消"
                @confirm="deleteClassCourse(record.id)"
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
    </a-modal>

    <!-- 添加课程到班级的模态框 -->
    <a-modal
      v-model:open="addCourseModalVisible"
      title="添加课程"
      @ok="handleAddCourse"
      @cancel="handleAddCourseCancel"
      :confirm-loading="addCourseConfirmLoading"
    >
      <a-form
        ref="addCourseFormRef"
        :model="addCourseFormData"
        :rules="addCourseRules"
        layout="vertical"
      >
        <a-form-item label="选择课程" name="courseId">
          <a-select
            v-model:value="addCourseFormData.courseId"
            placeholder="请选择课程"
            style="width: 100%"
          >
            <a-select-option v-for="course in availableCourses" :key="course.id" :value="course.id">
              {{ course.name }}
            </a-select-option>
          </a-select>
        </a-form-item>
        
        <a-form-item label="每小时价格" name="pricePerHour">
          <a-input-number
            v-model:value="addCourseFormData.pricePerHour"
            :min="0"
            :precision="2"
            placeholder="请输入每小时价格"
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
import { PlusOutlined, EditOutlined, DeleteOutlined, BookOutlined } from '@ant-design/icons-vue';
import request from '@/utils/request';

interface Class {
  id: number;
  name: string;
  semesterId: number;
  semesterName: string;
}

interface Semester {
  id: number;
  name: string;
}

interface Course {
  id: number;
  name: string;
}

interface ClassCourse {
  id: number;
  courseId: number;
  courseName: string;
  pricePerHour: number;
}

export default defineComponent({
  components: {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    BookOutlined,
  },
  setup() {
    const loading = ref(false);
    const modalVisible = ref(false);
    const coursesModalVisible = ref(false);
    const addCourseModalVisible = ref(false);
    const confirmLoading = ref(false);
    const coursesConfirmLoading = ref(false);
    const addCourseConfirmLoading = ref(false);
    const coursesLoading = ref(false);
    const isEdit = ref(false);
    const formRef = ref();
    const addCourseFormRef = ref();
    const selectedSemester = ref('');
    
    const classes = ref<Class[]>([]);
    const semesters = ref<Semester[]>([]);
    const courses = ref<Course[]>([]);
    const classCourses = ref<ClassCourse[]>([]);
    const currentClass = ref<Class>({} as Class);
    
    const pagination = reactive({
      current: 1,
      pageSize: 10,
      total: 0,
    });
    
    const formData = reactive({
      id: undefined,
      name: '',
      semesterId: undefined,
    });
    
    const addCourseFormData = reactive({
      courseId: undefined,
      pricePerHour: undefined,
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
        width: 250,
      },
    ];
    
    const courseColumns = [
      {
        title: '课程名称',
        dataIndex: 'courseName',
        key: 'courseName',
      },
      {
        title: '每小时价格',
        dataIndex: 'pricePerHour',
        key: 'pricePerHour',
      },
      {
        title: '操作',
        key: 'action',
        width: 150,
      },
    ];
    
    // 表单验证规则
    const rules = {
      name: [
        { required: true, message: '请输入班级名称', trigger: 'blur' },
      ],
      semesterId: [
        { required: true, message: '请选择学期', trigger: 'change' },
      ],
    };
    
    const addCourseRules = {
      courseId: [
        { required: true, message: '请选择课程', trigger: 'change' },
      ],
      pricePerHour: [
        { required: true, message: '请输入每小时价格', trigger: 'blur' },
      ],
    };
    
    // 模态框标题
    const modalTitle = computed(() => isEdit.value ? '编辑班级' : '添加班级');
    
    // 可用课程列表
    const availableCourses = computed(() => {
      const usedCourseIds = classCourses.value.map(cc => cc.courseId);
      return courses.value.filter(course => !usedCourseIds.includes(course.id));
    });
    
    // 加载学期列表
    const loadSemesters = async () => {
      try {
        const response = await request.get('/api/h1/semester');
        semesters.value = response.data.data || [];
      } catch (error) {
        message.error('加载学期列表失败');
      }
    };
    
    // 加载课程列表
    const loadCourses = async () => {
      try {
        const response = await request.get('/api/h1/course');
        courses.value = response.data.data || [];
      } catch (error) {
        message.error('加载课程列表失败');
      }
    };
    
    // 加载班级列表
    const loadClasses = async () => {
      loading.value = true;
      try {
        const response = await request.get('/api/h1/class', {
          params: {
            page: pagination.current,
            pageSize: pagination.pageSize,
            semesterId: selectedSemester.value || undefined,
          },
        });
        classes.value = response.data.data || [];
        pagination.total = response.data.total || 0;
      } catch (error) {
        message.error('加载班级列表失败');
      } finally {
        loading.value = false;
      }
    };
    
    // 加载班级课程
    const loadClassCourses = async (classId: number) => {
      coursesLoading.value = true;
      try {
        const response = await request.get(`/api/h1/class-course?classId=${classId}`);
        classCourses.value = response.data.data || [];
      } catch (error) {
        message.error('加载班级课程失败');
      } finally {
        coursesLoading.value = false;
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
      formData.semesterId = record.semesterId;
      modalVisible.value = true;
    };
    
    // 查看班级课程
    const viewClassCourses = (record: Class) => {
      currentClass.value = record;
      loadClassCourses(record.id);
      coursesModalVisible.value = true;
    };
    
    // 显示添加课程模态框
    const showAddCourseModal = () => {
      resetAddCourseForm();
      addCourseModalVisible.value = true;
    };
    
    // 重置表单
    const resetForm = () => {
      formData.id = undefined;
      formData.name = '';
      formData.semesterId = undefined;
      if (formRef.value) {
        formRef.value.clearValidate();
      }
    };
    
    const resetAddCourseForm = () => {
      addCourseFormData.courseId = undefined;
      addCourseFormData.pricePerHour = undefined;
      if (addCourseFormRef.value) {
        addCourseFormRef.value.clearValidate();
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
    
    // 添加课程到班级
    const handleAddCourse = async () => {
      try {
        await addCourseFormRef.value.validate();
        addCourseConfirmLoading.value = true;
        
        await request.post('/api/h1/class-course', {
          classId: currentClass.value.id,
          courseId: addCourseFormData.courseId,
          semesterId: currentClass.value.semesterId,
          pricePerHour: addCourseFormData.pricePerHour,
        });
        
        message.success('课程添加成功');
        addCourseModalVisible.value = false;
        loadClassCourses(currentClass.value.id);
      } catch (error) {
        message.error('课程添加失败');
      } finally {
        addCourseConfirmLoading.value = false;
      }
    };
    
    // 删除班级课程
    const deleteClassCourse = async (id: number) => {
      try {
        await request.delete(`/api/h1/class-course/${id}`);
        message.success('课程删除成功');
        loadClassCourses(currentClass.value.id);
      } catch (error) {
        message.error('课程删除失败');
      }
    };
    
    // 取消操作
    const handleCancel = () => {
      modalVisible.value = false;
      resetForm();
    };
    
    const handleCoursesCancel = () => {
      coursesModalVisible.value = false;
    };
    
    const handleAddCourseCancel = () => {
      addCourseModalVisible.value = false;
      resetAddCourseForm();
    };
    
    const handleCoursesSubmit = () => {
      coursesModalVisible.value = false;
    };
    
    // 编辑班级课程
    const editClassCourse = (record: ClassCourse) => {
      // 这里可以实现编辑功能
      message.info('编辑功能待实现');
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
      loadCourses();
      loadClasses();
    });
    
    return {
      loading,
      modalVisible,
      coursesModalVisible,
      addCourseModalVisible,
      confirmLoading,
      coursesConfirmLoading,
      addCourseConfirmLoading,
      coursesLoading,
      isEdit,
      formRef,
      addCourseFormRef,
      selectedSemester,
      classes,
      semesters,
      courses,
      classCourses,
      currentClass,
      pagination,
      formData,
      addCourseFormData,
      columns,
      courseColumns,
      rules,
      addCourseRules,
      modalTitle,
      availableCourses,
      handleSemesterChange,
      showCreateModal,
      showEditModal,
      viewClassCourses,
      showAddCourseModal,
      handleSubmit,
      handleAddCourse,
      handleCancel,
      handleCoursesCancel,
      handleAddCourseCancel,
      handleCoursesSubmit,
      editClassCourse,
      deleteClass,
      deleteClassCourse,
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

.courses-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.courses-header h3 {
  margin: 0;
  color: #1890ff;
}
</style> 