<template>
  <div class="schedule-management">
    <div class="page-header">
      <a-row justify="space-between" align="middle">
        <a-col>
          <h2>课表管理</h2>
        </a-col>
        <a-col>
          <a-button type="primary" @click="showCreateModal">
            <template #icon><PlusOutlined /></template>
            新增课程安排
          </a-button>
        </a-col>
      </a-row>
    </div>

    <a-card>
      <a-table
        :columns="columns"
        :data-source="schedules"
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
          <template v-if="column.key === 'date'">
            {{ formatDate(record.date) }}
          </template>
          <template v-else-if="column.key === 'startTime'">
            {{ formatTime(record.startTime) }}
          </template>
          <template v-else-if="column.key === 'endTime'">
            {{ formatTime(record.endTime) }}
          </template>
          <template v-else-if="column.key === 'action'">
            <a-space>
              <a-button size="small" @click="showEditModal(record)">
                <template #icon><EditOutlined /></template>
                编辑
              </a-button>
              <a-popconfirm
                title="确定删除这个课程安排吗？"
                ok-text="确定"
                cancel-text="取消"
                @confirm="deleteSchedule(record.id)"
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

    <!-- 创建/编辑课程安排的模态框 -->
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
        
        <a-form-item label="上课日期" name="date">
          <a-date-picker
            v-model:value="formData.date"
            placeholder="请选择上课日期"
            style="width: 100%"
          />
        </a-form-item>
        
        <a-form-item label="开始时间" name="startTime">
          <a-time-picker
            v-model:value="formData.startTime"
            placeholder="请选择开始时间"
            style="width: 100%"
          />
        </a-form-item>
        
        <a-form-item label="结束时间" name="endTime">
          <a-time-picker
            v-model:value="formData.endTime"
            placeholder="请选择结束时间"
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

interface Schedule {
  id: number;
  classCourseId: number;
  className: string;
  courseName: string;
  date: string;
  startTime: string;
  endTime: string;
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
    
    const schedules = ref<Schedule[]>([]);
    const classCourses = ref<ClassCourse[]>([]);
    
    const pagination = reactive({
      current: 1,
      pageSize: 10,
      total: 0,
    });
    
    const formData = reactive({
      id: undefined,
      classCourseId: undefined,
      date: null,
      startTime: null,
      endTime: null,
    });
    
    // 表格列定义
    const columns = [
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
        title: '上课日期',
        dataIndex: 'date',
        key: 'date',
      },
      {
        title: '开始时间',
        dataIndex: 'startTime',
        key: 'startTime',
      },
      {
        title: '结束时间',
        dataIndex: 'endTime',
        key: 'endTime',
      },
      {
        title: '操作',
        key: 'action',
        width: 200,
      },
    ];
    
    // 表单验证规则
    const rules = {
      classCourseId: [
        { required: true, message: '请选择班级课程', trigger: 'change' },
      ],
      date: [
        { required: true, message: '请选择上课日期', trigger: 'change' },
      ],
      startTime: [
        { required: true, message: '请选择开始时间', trigger: 'change' },
      ],
      endTime: [
        { required: true, message: '请选择结束时间', trigger: 'change' },
      ],
    };
    
    // 模态框标题
    const modalTitle = computed(() => isEdit.value ? '编辑课程安排' : '新增课程安排');
    
    // 格式化日期
    const formatDate = (date: string) => {
      return moment(date).format('YYYY-MM-DD');
    };
    
    // 格式化时间
    const formatTime = (time: string) => {
      return moment(time).format('HH:mm');
    };
    
    // 加载数据
    const loadData = async () => {
      await Promise.all([
        loadSchedules(),
        loadClassCourses(),
      ]);
    };
    
    // 加载课程安排列表
    const loadSchedules = async () => {
      loading.value = true;
      try {
        const response = await request.get('/api/h1/schedule', {
          params: {
            page: pagination.current,
            pageSize: pagination.pageSize,
          },
        });
        schedules.value = response.data.data || [];
        pagination.total = response.data.total || 0;
      } catch (error) {
        message.error('加载课程安排列表失败');
      } finally {
        loading.value = false;
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
    const showEditModal = (record: Schedule) => {
      isEdit.value = true;
      formData.id = record.id;
      formData.classCourseId = record.classCourseId;
      formData.date = moment(record.date);
      formData.startTime = moment(record.startTime, 'HH:mm');
      formData.endTime = moment(record.endTime, 'HH:mm');
      modalVisible.value = true;
    };
    
    // 重置表单
    const resetForm = () => {
      formData.id = undefined;
      formData.classCourseId = undefined;
      formData.date = null;
      formData.startTime = null;
      formData.endTime = null;
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
          date: formData.date.format('YYYY-MM-DD'),
          startTime: formData.startTime.format('HH:mm'),
          endTime: formData.endTime.format('HH:mm'),
        };
        
        if (isEdit.value) {
          await request.put('/api/h1/schedule', requestData);
          message.success('课程安排更新成功');
        } else {
          await request.post('/api/h1/schedule', requestData);
          message.success('课程安排创建成功');
        }
        
        modalVisible.value = false;
        loadSchedules();
      } catch (error) {
        message.error(isEdit.value ? '课程安排更新失败' : '课程安排创建失败');
      } finally {
        confirmLoading.value = false;
      }
    };
    
    // 取消操作
    const handleCancel = () => {
      modalVisible.value = false;
      resetForm();
    };
    
    // 删除课程安排
    const deleteSchedule = async (id: number) => {
      try {
        await request.delete(`/api/h1/schedule/${id}`);
        message.success('课程安排删除成功');
        loadSchedules();
      } catch (error) {
        message.error('课程安排删除失败');
      }
    };
    
    // 处理表格变化
    const handleTableChange = (pag: any) => {
      pagination.current = pag.current;
      pagination.pageSize = pag.pageSize;
      loadSchedules();
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
      schedules,
      classCourses,
      pagination,
      formData,
      columns,
      rules,
      modalTitle,
      formatDate,
      formatTime,
      showCreateModal,
      showEditModal,
      handleSubmit,
      handleCancel,
      deleteSchedule,
      handleTableChange,
    };
  },
});
</script>

<style scoped>
.schedule-management {
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