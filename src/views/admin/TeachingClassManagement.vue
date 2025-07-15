<template>
  <div class="teaching-class-management">
    <div class="page-header">
      <a-row justify="space-between" align="middle">
        <a-col>
          <h2>教学班管理</h2>
          <p>管理年级课程组合，如"三年级数学"、"高一物理"等</p>
        </a-col>
        <a-col>
          <a-space>
            <a-select
              v-model:value="selectedSemester"
              placeholder="选择学期"
              style="width: 200px"
              @change="handleSemesterChange"
              allow-clear
            >
              <a-select-option value="">全部学期</a-select-option>
              <a-select-option v-for="semester in semesters" :key="semester.id" :value="semester.id">
                {{ semester.name }}
              </a-select-option>
            </a-select>
            <a-button type="primary" @click="showCreateModal">
              <template #icon><PlusOutlined /></template>
              创建教学班
            </a-button>
          </a-space>
        </a-col>
      </a-row>
    </div>

    <a-card>
      <a-table
        :columns="columns"
        :data-source="teachingClasses"
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
          <template v-if="column.key === 'display_name'">
            <a-tag color="blue">{{ record.display_name }}</a-tag>
          </template>
          <template v-else-if="column.key === 'price_per_hour'">
            ¥{{ record.price_per_hour }}/小时
          </template>
          <template v-else-if="column.key === 'student_count'">
            <a-badge :count="record.student_count" style="background-color: #52c41a" />
          </template>
          <template v-else-if="column.key === 'schedule_count'">
            <a-badge :count="record.schedule_count" style="background-color: #1890ff" />
          </template>
          <template v-else-if="column.key === 'action'">
            <a-space>
              <a-button size="small" @click="showStudentModal(record)">
                <template #icon><UserOutlined /></template>
                学生管理
              </a-button>
              <a-button size="small" @click="showEditModal(record)">
                <template #icon><EditOutlined /></template>
                编辑
              </a-button>
              <a-popconfirm
                title="确定删除这个教学班吗？删除后相关的报名记录和课程表也会被删除。"
                ok-text="确定"
                cancel-text="取消"
                @confirm="deleteTeachingClass(record.id)"
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

    <!-- 创建/编辑教学班的模态框 -->
    <a-modal
      v-model:visible="modalVisible"
      :title="modalTitle"
      @ok="handleSubmit"
      @cancel="handleCancel"
      :confirm-loading="confirmLoading"
      width="600px"
    >
      <a-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        layout="vertical"
      >
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="学期" name="semester_id">
              <a-select
                v-model:value="formData.semester_id"
                placeholder="选择学期"
                @change="loadClasses"
              >
                <a-select-option v-for="semester in semesters" :key="semester.id" :value="semester.id">
                  {{ semester.name }}
                </a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="班级" name="class_id">
              <a-select
                v-model:value="formData.class_id"
                placeholder="选择班级"
                :disabled="!formData.semester_id"
              >
                <a-select-option v-for="clazz in classes" :key="clazz.id" :value="clazz.id">
                  {{ clazz.name }}
                </a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
        
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="课程" name="course_id">
              <a-select
                v-model:value="formData.course_id"
                placeholder="选择课程"
              >
                <a-select-option v-for="course in courses" :key="course.id" :value="course.id">
                  {{ course.name }}
                </a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="教学班价格(元)" name="price_per_hour">
              <a-input-number
                v-model:value="formData.price_per_hour"
                :min="0"
                :step="10"
                style="width: 100%"
                placeholder="输入价格"
              />
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
    </a-modal>

    <!-- 学生管理模态框 -->
    <a-modal
      v-model:visible="studentModalVisible"
      :title="`学生管理 - ${currentTeachingClass?.display_name}`"
      @cancel="handleStudentModalCancel"
      width="1200px"
      :footer="null"
    >
      <!-- 统计信息 -->
      <a-row :gutter="16" style="margin-bottom: 16px;">
        <a-col :span="8">
          <a-statistic title="已报名学生" :value="studentData?.enrolled_students?.length || 0" />
        </a-col>
        <a-col :span="8">
          <a-statistic title="可报名学生" :value="studentData?.available_students?.length || 0" />
        </a-col>
        <a-col :span="8">
          <a-statistic title="总学生数" :value="(studentData?.enrolled_students?.length || 0) + (studentData?.available_students?.length || 0)" />
        </a-col>
      </a-row>

      <a-tabs>
        <a-tab-pane key="enrolled" tab="已报名学生">
          <div style="margin-bottom: 16px;">
            <a-row justify="space-between">
              <a-col>
                <a-space>
                  <a-button 
                    type="primary" 
                    danger
                    @click="batchUnenroll"
                    :disabled="selectedEnrolledStudents.length === 0"
                  >
                    <template #icon><UserDeleteOutlined /></template>
                    批量退课 ({{ selectedEnrolledStudents.length }})
                  </a-button>
                  <a-button @click="refreshStudentData">
                    <template #icon><ReloadOutlined /></template>
                    刷新
                  </a-button>
                </a-space>
              </a-col>
              <a-col>
                <a-input
                  v-model:value="enrolledSearchText"
                  placeholder="搜索已报名学生"
                  style="width: 250px"
                  allow-clear
                >
                  <template #prefix><SearchOutlined /></template>
                </a-input>
              </a-col>
            </a-row>
          </div>
          
          <a-table
            :columns="enrolledColumns"
            :data-source="filteredEnrolledStudents"
            :loading="studentLoading"
            row-key="student_id"
            :row-selection="{
              selectedRowKeys: selectedEnrolledStudents,
              onChange: (keys) => { selectedEnrolledStudents = keys; }
            }"
            size="small"
            :pagination="{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 名学生`
            }"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'student_name'">
                <a-tag color="green">{{ record.student_name }}</a-tag>
              </template>
              <template v-else-if="column.key === 'enrolled_at'">
                {{ formatDate(record.enrolled_at) }}
              </template>
              <template v-else-if="column.key === 'discount_rate'">
                <a-tag :color="record.discount_rate < 1 ? 'orange' : 'blue'">
                  {{ (record.discount_rate * 100).toFixed(0) }}%
                </a-tag>
              </template>
              <template v-else-if="column.key === 'action'">
                <a-button 
                  size="small" 
                  danger 
                  @click="unenrollSingle(record.student_id)"
                >
                  退课
                </a-button>
              </template>
            </template>
          </a-table>
        </a-tab-pane>
        
        <a-tab-pane key="available" tab="可报名学生">
          <div style="margin-bottom: 16px;">
            <a-row justify="space-between">
              <a-col>
                <a-space>
                  <a-button 
                    type="primary"
                    @click="batchEnroll"
                    :disabled="selectedAvailableStudents.length === 0"
                  >
                    <template #icon><UserAddOutlined /></template>
                    批量报名 ({{ selectedAvailableStudents.length }})
                  </a-button>
                  <a-button @click="selectAllAvailable">
                    全选当前页
                  </a-button>
                  <a-button @click="clearAvailableSelection">
                    清空选择
                  </a-button>
                </a-space>
              </a-col>
              <a-col>
                <a-input
                  v-model:value="availableSearchText"
                  placeholder="搜索学生姓名或联系方式"
                  style="width: 250px"
                  allow-clear
                >
                  <template #prefix><SearchOutlined /></template>
                </a-input>
              </a-col>
            </a-row>
          </div>
          
          <a-table
            :columns="availableColumns"
            :data-source="filteredAvailableStudents"
            :loading="studentLoading"
            row-key="id"
            :row-selection="{
              selectedRowKeys: selectedAvailableStudents,
              onChange: (keys) => { selectedAvailableStudents = keys; }
            }"
            size="small"
            :pagination="{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 名学生`
            }"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'name'">
                <a-tag color="blue">{{ record.name }}</a-tag>
              </template>
              <template v-else-if="column.key === 'discount_rate'">
                <a-tag :color="record.discount_rate < 1 ? 'orange' : 'blue'">
                  {{ (record.discount_rate * 100).toFixed(0) }}%
                </a-tag>
              </template>
              <template v-else-if="column.key === 'action'">
                <a-button 
                  size="small" 
                  type="primary" 
                  @click="enrollSingle(record.id)"
                >
                  报名
                </a-button>
              </template>
            </template>
          </a-table>
        </a-tab-pane>
      </a-tabs>
    </a-modal>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, reactive, onMounted, computed } from 'vue';
import { message } from 'ant-design-vue';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  UserAddOutlined,
  UserDeleteOutlined,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons-vue';
import type { FormInstance } from 'ant-design-vue';
import { 
  getTeachingClasses, 
  createTeachingClass, 
  updateTeachingClass, 
  deleteTeachingClass,
  getTeachingClassStudents,
  batchEnrollStudents,
  batchUnenrollStudents,
  type TeachingClass,
  type TeachingClassRequest,
  type TeachingClassStudent
} from '@/api/teachingClass';
import { semesterApi, classApi, courseApi } from '@/api/admin';
import { formatDateDisplay } from '@/utils/dateUtils';

interface Semester {
  id: number;
  name: string;
}

interface Class {
  id: number;
  name: string;
  semester_id: number;
}

interface Course {
  id: number;
  name: string;
}

export default defineComponent({
  components: {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    UserOutlined,
    UserAddOutlined,
    UserDeleteOutlined,
    ReloadOutlined,
    SearchOutlined,
  },
  setup() {
    const loading = ref(false);
    const modalVisible = ref(false);
    const studentModalVisible = ref(false);
    const confirmLoading = ref(false);
    const studentLoading = ref(false);
    const formRef = ref<FormInstance>();
    const selectedSemester = ref<number | undefined>(undefined);
    const enrolledSearchText = ref('');
    const availableSearchText = ref('');
    
    const teachingClasses = ref<TeachingClass[]>([]);
    const semesters = ref<Semester[]>([]);
    const classes = ref<Class[]>([]);
    const courses = ref<Course[]>([]);
    const currentTeachingClass = ref<TeachingClass | null>(null);
    const studentData = ref<TeachingClassStudent | null>(null);
    
    const selectedEnrolledStudents = ref<number[]>([]);
    const selectedAvailableStudents = ref<number[]>([]);
    
    const pagination = reactive({
      current: 1,
      pageSize: 10,
      total: 0,
    });
    
    const formData = reactive<TeachingClassRequest>({
      semester_id: 0,
      class_id: 0,
      course_id: 0,
      price_per_hour: 0,
    });
    
    const formRules = {
      semester_id: [{ required: true, message: '请选择学期' }],
      class_id: [{ required: true, message: '请选择班级' }],
      course_id: [{ required: true, message: '请选择课程' }],
      price_per_hour: [{ required: true, message: '请输入教学班价格' }],
    };
    
    const modalTitle = computed(() => {
      return formData.id ? '编辑教学班' : '创建教学班';
    });
    
    // 过滤已报名学生
    const filteredEnrolledStudents = computed(() => {
      if (!studentData.value || !enrolledSearchText.value) {
        return studentData.value?.enrolled_students || [];
      }
      
      const searchText = enrolledSearchText.value.toLowerCase();
      return studentData.value.enrolled_students.filter(student => 
        student.student_name.toLowerCase().includes(searchText) ||
        student.contact.toLowerCase().includes(searchText)
      );
    });
    
    // 过滤可报名学生
    const filteredAvailableStudents = computed(() => {
      if (!studentData.value || !availableSearchText.value) {
        return studentData.value?.available_students || [];
      }
      
      const searchText = availableSearchText.value.toLowerCase();
      return studentData.value.available_students.filter(student => 
        student.name.toLowerCase().includes(searchText) ||
        student.contact.toLowerCase().includes(searchText)
      );
    });
    
    // 表格列定义
    const columns = [
      {
        title: '教学班名称',
        dataIndex: 'display_name',
        key: 'display_name',
      },
      {
        title: '学期',
        dataIndex: 'semester_name',
        key: 'semester_name',
      },
      {
        title: '班级',
        dataIndex: 'class_name',
        key: 'class_name',
      },
      {
        title: '课程',
        dataIndex: 'course_name',
        key: 'course_name',
      },
      {
        title: '教学班价格',
        dataIndex: 'price_per_hour',
        key: 'price_per_hour',
      },
      {
        title: '学生数量',
        dataIndex: 'student_count',
        key: 'student_count',
      },
      {
        title: '课程表数量',
        dataIndex: 'schedule_count',
        key: 'schedule_count',
      },
      {
        title: '操作',
        key: 'action',
        width: 250,
      },
    ];
    
    // 已报名学生表格列
    const enrolledColumns = [
      {
        title: '学生姓名',
        dataIndex: 'student_name',
        key: 'student_name',
      },
      {
        title: '联系方式',
        dataIndex: 'contact',
        key: 'contact',
      },
      {
        title: '折扣率',
        dataIndex: 'discount_rate',
        key: 'discount_rate',
      },
      {
        title: '报名时间',
        dataIndex: 'enrolled_at',
        key: 'enrolled_at',
      },
      {
        title: '操作',
        key: 'action',
        width: 80,
      },
    ];
    
    // 可报名学生表格列
    const availableColumns = [
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
        title: '折扣率',
        dataIndex: 'discount_rate',
        key: 'discount_rate',
      },
      {
        title: '操作',
        key: 'action',
        width: 80,
      },
    ];
    
    // 加载数据
    const loadData = async () => {
      await Promise.all([
        loadTeachingClasses(),
        loadSemesters(),
        loadCourses(),
      ]);
    };
    
    // 加载教学班列表
    const loadTeachingClasses = async () => {
      loading.value = true;
      try {
        const response = await getTeachingClasses(selectedSemester.value);
        teachingClasses.value = response.data.data || [];
        pagination.total = teachingClasses.value.length;
      } catch (error) {
        message.error('加载教学班列表失败');
      } finally {
        loading.value = false;
      }
    };
    
    // 加载学期列表
    const loadSemesters = async () => {
      try {
        const response = await semesterApi.getAll();
        semesters.value = response.data.data || [];
      } catch (error) {
        message.error('加载学期列表失败');
      }
    };
    
    // 加载班级列表
    const loadClasses = async () => {
      if (!formData.semester_id) {
        classes.value = [];
        return;
      }
      
      try {
        const response = await classApi.getWithSemester(formData.semester_id);
        classes.value = response.data.data || [];
      } catch (error) {
        message.error('加载班级列表失败');
      }
    };
    
    // 加载课程列表
    const loadCourses = async () => {
      try {
        const response = await courseApi.getAll();
        courses.value = response.data.data || [];
      } catch (error) {
        message.error('加载课程列表失败');
      }
    };
    
    // 学期变化处理
    const handleSemesterChange = () => {
      pagination.current = 1;
      loadTeachingClasses();
    };
    
    // 表格分页处理
    const handleTableChange = (page: any) => {
      pagination.current = page.current;
      pagination.pageSize = page.pageSize;
    };
    
    // 显示创建模态框
    const showCreateModal = () => {
      Object.assign(formData, {
        id: undefined,
        semester_id: selectedSemester.value || 0,
        class_id: 0,
        course_id: 0,
        price_per_hour: 0,
      });
      classes.value = [];
      modalVisible.value = true;
    };
    
    // 显示编辑模态框
    const showEditModal = (record: TeachingClass) => {
      Object.assign(formData, {
        id: record.id,
        semester_id: record.semester_id,
        class_id: record.class_id,
        course_id: record.course_id,
        price_per_hour: record.price_per_hour,
      });
      loadClasses();
      modalVisible.value = true;
    };
    
    // 显示学生管理模态框
    const showStudentModal = async (record: TeachingClass) => {
      currentTeachingClass.value = record;
      studentModalVisible.value = true;
      await loadStudentData(record.id);
    };
    
    // 加载学生数据
    const loadStudentData = async (teachingClassId: number) => {
      studentLoading.value = true;
      try {
        const response = await getTeachingClassStudents(teachingClassId);
        studentData.value = response.data.data;
        selectedEnrolledStudents.value = [];
        selectedAvailableStudents.value = [];
        enrolledSearchText.value = '';
        availableSearchText.value = '';
      } catch (error) {
        message.error('加载学生数据失败');
      } finally {
        studentLoading.value = false;
      }
    };
    
    // 刷新学生数据
    const refreshStudentData = () => {
      if (currentTeachingClass.value) {
        loadStudentData(currentTeachingClass.value.id);
      }
    };
    
    // 批量报名
    const batchEnroll = async () => {
      if (!currentTeachingClass.value || selectedAvailableStudents.value.length === 0) {
        return;
      }
      
      try {
        const response = await batchEnrollStudents({
          class_course_id: currentTeachingClass.value.id,
          student_ids: selectedAvailableStudents.value,
        });
        
        const result = response.data.data;
        if (result.failure_count === 0) {
          message.success(`批量报名成功，共报名 ${result.success_count} 名学生`);
        } else {
          message.warning(`批量报名完成，成功 ${result.success_count} 名，失败 ${result.failure_count} 名`);
        }
        
        await refreshStudentData();
        await loadTeachingClasses();
      } catch (error) {
        message.error('批量报名失败');
      }
    };
    
    // 批量退课
    const batchUnenroll = async () => {
      if (!currentTeachingClass.value || selectedEnrolledStudents.value.length === 0) {
        return;
      }
      
      try {
        const response = await batchUnenrollStudents({
          class_course_id: currentTeachingClass.value.id,
          student_ids: selectedEnrolledStudents.value,
        });
        
        const result = response.data.data;
        if (result.failure_count === 0) {
          message.success(`批量退课成功，共退课 ${result.success_count} 名学生`);
        } else {
          message.warning(`批量退课完成，成功 ${result.success_count} 名，失败 ${result.failure_count} 名`);
        }
        
        await refreshStudentData();
        await loadTeachingClasses();
      } catch (error) {
        message.error('批量退课失败');
      }
    };
    
    // 单个学生报名
    const enrollSingle = async (studentId: number) => {
      if (!currentTeachingClass.value) return;
      
      try {
        await batchEnrollStudents({
          class_course_id: currentTeachingClass.value.id,
          student_ids: [studentId],
        });
        
        message.success('学生报名成功');
        await refreshStudentData();
        await loadTeachingClasses();
      } catch (error) {
        message.error('学生报名失败');
      }
    };
    
    // 单个学生退课
    const unenrollSingle = async (studentId: number) => {
      if (!currentTeachingClass.value) return;
      
      try {
        await batchUnenrollStudents({
          class_course_id: currentTeachingClass.value.id,
          student_ids: [studentId],
        });
        
        message.success('学生退课成功');
        await refreshStudentData();
        await loadTeachingClasses();
      } catch (error) {
        message.error('学生退课失败');
      }
    };
    
    // 全选当前页可报名学生
    const selectAllAvailable = () => {
      selectedAvailableStudents.value = filteredAvailableStudents.value.map(student => student.id);
    };
    
    // 清空可报名学生选择
    const clearAvailableSelection = () => {
      selectedAvailableStudents.value = [];
    };
    
    // 提交表单
    const handleSubmit = async () => {
      try {
        await formRef.value?.validate();
        confirmLoading.value = true;
        
        if (formData.id) {
          await updateTeachingClass(formData);
          message.success('更新成功');
        } else {
          await createTeachingClass(formData);
          message.success('创建成功');
        }
        
        modalVisible.value = false;
        await loadTeachingClasses();
      } catch (error) {
        console.error('提交失败:', error);
      } finally {
        confirmLoading.value = false;
      }
    };
    
    // 取消表单
    const handleCancel = () => {
      modalVisible.value = false;
      formRef.value?.resetFields();
    };
    
    // 取消学生管理
    const handleStudentModalCancel = () => {
      studentModalVisible.value = false;
      currentTeachingClass.value = null;
      studentData.value = null;
    };
    
    // 删除教学班
    const handleDeleteTeachingClass = async (id: number) => {
      try {
        await deleteTeachingClass(id);
        message.success('删除成功');
        await loadTeachingClasses();
      } catch (error) {
        message.error('删除失败');
      }
    };
    
    // 格式化日期
    const formatDate = (date: string) => {
      return formatDateDisplay(date);
    };
    
    onMounted(() => {
      loadData();
    });
    
    return {
      loading,
      modalVisible,
      studentModalVisible,
      confirmLoading,
      studentLoading,
      formRef,
      selectedSemester,
      enrolledSearchText,
      availableSearchText,
      teachingClasses,
      semesters,
      classes,
      courses,
      currentTeachingClass,
      studentData,
      selectedEnrolledStudents,
      selectedAvailableStudents,
      pagination,
      formData,
      formRules,
      modalTitle,
      filteredEnrolledStudents,
      filteredAvailableStudents,
      columns,
      enrolledColumns,
      availableColumns,
      
      handleSemesterChange,
      handleTableChange,
      showCreateModal,
      showEditModal,
      showStudentModal,
      loadClasses,
      refreshStudentData,
      batchEnroll,
      batchUnenroll,
      enrollSingle,
      unenrollSingle,
      selectAllAvailable,
      clearAvailableSelection,
      handleSubmit,
      handleCancel,
      handleStudentModalCancel,
      deleteTeachingClass: handleDeleteTeachingClass,
      formatDate,
    };
  },
});
</script>

<style scoped>
.teaching-class-management {
  padding: 0;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  color: #333;
}

.page-header p {
  margin: 4px 0 0 0;
  color: #666;
  font-size: 14px;
}
</style> 