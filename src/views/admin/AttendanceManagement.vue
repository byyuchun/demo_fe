<template>
  <div class="attendance-management">
    <div class="page-header">
      <a-row justify="space-between" align="middle">
        <a-col>
          <h2>打卡管理</h2>
        </a-col>
        <a-col>
          <a-space>
            <a-select
              v-model:value="selectedStatus"
              placeholder="选择状态"
              style="width: 120px"
              @change="handleStatusChange"
            >
              <a-select-option value="">全部状态</a-select-option>
              <a-select-option value="出勤">出勤</a-select-option>
              <a-select-option value="请假">请假</a-select-option>
              <a-select-option value="旷课">旷课</a-select-option>
              <a-select-option value="补签">补签</a-select-option>
            </a-select>
            <a-range-picker
              v-model:value="dateRange"
              @change="handleDateChange"
              style="width: 300px"
            />
            <a-button type="primary" @click="showMakeupModal">
              <template #icon><PlusOutlined /></template>
              补签
            </a-button>
          </a-space>
        </a-col>
      </a-row>
    </div>

    <a-card>
      <a-table
        :columns="columns"
        :data-source="attendances"
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
          <template v-if="column.key === 'status'">
            <a-tag :color="getStatusColor(record.status)">
              {{ record.status }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'class_time'">
            {{ formatTime(record.start_time) }} - {{ formatTime(record.end_time) }}
          </template>
          <template v-else-if="column.key === 'checked_at'">
            {{ formatDateTime(record.checked_at) }}
          </template>
          <template v-else-if="column.key === 'schedule_date'">
            {{ formatDate(record.schedule_date) }}
          </template>
          <template v-else-if="column.key === 'makeup_schedule_id'">
            <a-tag v-if="record.makeup_schedule_id" color="orange">
              补课安排
            </a-tag>
            <span v-else>-</span>
          </template>
          <template v-else-if="column.key === 'action'">
            <a-space>
              <a-button 
                v-if="record.status === '旷课' || record.status === '请假'" 
                size="small" 
                type="primary" 
                @click="showMakeupModalForRecord(record)"
              >
                <template #icon><ClockCircleOutlined /></template>
                补签
              </a-button>
              <a-button 
                v-if="record.status === '补签'" 
                size="small" 
                @click="viewMakeupDetails(record)"
              >
                <template #icon><EyeOutlined /></template>
                查看补课
              </a-button>
              <a-popconfirm
                v-if="record.status === '补签'"
                title="确定取消补签吗？"
                ok-text="确定"
                cancel-text="取消"
                @confirm="cancelMakeup(record.id)"
              >
                <a-button size="small" danger>
                  <template #icon><CloseOutlined /></template>
                  取消补签
                </a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 补签模态框 -->
    <a-modal
      v-model:visible="makeupModalVisible"
      title="学生补签"
      @ok="handleMakeupSubmit"
      @cancel="handleMakeupCancel"
      :confirm-loading="makeupConfirmLoading"
      width="600px"
    >
      <a-form
        ref="makeupFormRef"
        :model="makeupFormData"
        :rules="makeupRules"
        layout="vertical"
      >
        <a-form-item label="选择学生" name="student_id">
          <a-select
            v-model:value="makeupFormData.student_id"
            placeholder="请选择学生"
            style="width: 100%"
            show-search
            :filter-option="filterStudentOption"
          >
            <a-select-option v-for="student in students" :key="student.id" :value="student.id">
              {{ student.name }}
            </a-select-option>
          </a-select>
        </a-form-item>
        
        <a-form-item label="选择课程安排" name="schedule_id">
          <a-select
            v-model:value="makeupFormData.schedule_id"
            placeholder="请选择课程安排"
            style="width: 100%"
            @change="handleScheduleChange"
          >
            <a-select-option v-for="schedule in schedules" :key="schedule.id" :value="schedule.id">
              {{ schedule.className }} - {{ schedule.courseName }} ({{ formatDate(schedule.date) }})
            </a-select-option>
          </a-select>
        </a-form-item>
        
        <a-form-item label="补课安排" name="makeup_schedule_id">
          <a-select
            v-model:value="makeupFormData.makeup_schedule_id"
            placeholder="请选择补课安排"
            style="width: 100%"
          >
            <a-select-option v-for="schedule in availableMakeupSchedules" :key="schedule.id" :value="schedule.id">
              {{ schedule.className }} - {{ schedule.courseName }} ({{ formatDate(schedule.date) }})
            </a-select-option>
          </a-select>
        </a-form-item>
        
        <a-form-item label="补签时间" name="checked_at">
          <a-date-picker
            v-model:value="makeupFormData.checked_at"
            show-time
            placeholder="请选择补签时间"
            style="width: 100%"
          />
        </a-form-item>
        
        <a-form-item label="备注">
          <a-textarea 
            v-model:value="makeupFormData.remark" 
            placeholder="补签原因或备注"
            :rows="3"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 补课详情模态框 -->
    <a-modal
      v-model:visible="makeupDetailModalVisible"
      title="补课详情"
      @cancel="handleMakeupDetailCancel"
      :footer="null"
      width="500px"
    >
      <div v-if="makeupDetail">
        <a-descriptions :column="1" bordered>
          <a-descriptions-item label="学生姓名">{{ makeupDetail.studentName }}</a-descriptions-item>
          <a-descriptions-item label="原课程">{{ makeupDetail.originalCourse }}</a-descriptions-item>
          <a-descriptions-item label="原上课日期">{{ formatDate(makeupDetail.originalDate) }}</a-descriptions-item>
          <a-descriptions-item label="补课课程">{{ makeupDetail.makeupCourse }}</a-descriptions-item>
          <a-descriptions-item label="补课日期">{{ formatDate(makeupDetail.makeupDate) }}</a-descriptions-item>
          <a-descriptions-item label="补签时间">{{ formatDateTime(makeupDetail.checkedAt) }}</a-descriptions-item>
          <a-descriptions-item label="备注">{{ makeupDetail.remark || '-' }}</a-descriptions-item>
        </a-descriptions>
      </div>
    </a-modal>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, reactive } from 'vue';
import { message } from 'ant-design-vue';
import { PlusOutlined, ClockCircleOutlined, EyeOutlined, CloseOutlined } from '@ant-design/icons-vue';
import request from '@/utils/request';
import moment from 'moment';
import { toRFC3339, formatDateDisplay, formatDatetimeDisplay, datetimeToRFC3339 } from '@/utils/dateUtils';

interface Attendance {
  id: number;
  student_id: number;
  student_name: string;
  schedule_id: number;
  schedule_date: string;
  start_time: string;
  end_time: string;
  class_name: string;
  course_name: string;
  checked_at: string;
  status: string;
  makeup_schedule_id: number;
}

interface Student {
  id: number;
  name: string;
}

interface Schedule {
  id: number;
  className: string;
  courseName: string;
  date: string;
}

export default defineComponent({
  components: {
    PlusOutlined,
    ClockCircleOutlined,
    EyeOutlined,
    CloseOutlined,
  },
  setup() {
    const loading = ref(false);
    const makeupModalVisible = ref(false);
    const makeupDetailModalVisible = ref(false);
    const makeupConfirmLoading = ref(false);
    const makeupFormRef = ref();
    const selectedStatus = ref('');
    const dateRange = ref([]);
    
    const attendances = ref<Attendance[]>([]);
    const students = ref<Student[]>([]);
    const schedules = ref<Schedule[]>([]);
    const availableMakeupSchedules = ref<Schedule[]>([]);
    const makeupDetail = ref(null);
    
    const pagination = reactive({
      current: 1,
      pageSize: 10,
      total: 0,
    });
    
    const makeupFormData = reactive({
      student_id: undefined,
      schedule_id: undefined,
      makeup_schedule_id: undefined,
      checked_at: null,
      remark: '',
    });
    
    // 表格列定义
    const columns = [
      {
        title: '学生姓名',
        dataIndex: 'student_name',
        key: 'student_name',
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
        title: '上课日期',
        dataIndex: 'schedule_date',
        key: 'schedule_date',
      },
      {
        title: '上课时间',
        key: 'class_time',
        width: 150,
      },
      {
        title: '打卡时间',
        dataIndex: 'checked_at',
        key: 'checked_at',
      },
      {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        width: 100,
      },
      {
        title: '补课安排',
        dataIndex: 'makeup_schedule_id',
        key: 'makeup_schedule_id',
        width: 100,
      },
      {
        title: '操作',
        key: 'action',
        width: 200,
      },
    ];
    
    // 表单验证规则
    const makeupRules = {
      student_id: [
        { required: true, message: '请选择学生', trigger: 'change' },
      ],
      schedule_id: [
        { required: true, message: '请选择课程安排', trigger: 'change' },
      ],
      checked_at: [
        { required: true, message: '请选择补签时间', trigger: 'change' },
      ],
    };
    
    // 获取状态颜色
    const getStatusColor = (status: string) => {
      switch (status) {
        case '出勤':
          return 'green';
        case '请假':
          return 'orange';
        case '旷课':
          return 'red';
        case '补签':
          return 'blue';
        default:
          return 'default';
      }
    };
    
    // 格式化日期（用于显示）
    const formatDate = (date: string) => {
      return formatDateDisplay(date);
    };
    
    // 格式化日期时间（用于显示）
    const formatDateTime = (datetime: string) => {
      return formatDatetimeDisplay(datetime);
    };

    // 格式化时间（用于显示）
    const formatTime = (time: string) => {
      // 直接从时间戳字符串中提取时间部分，避免时区转换
      const timeStr = time.includes('T') ? time.split('T')[1] : time;
      return timeStr.split(':').slice(0, 2).join(':');
    };
    
    // 学生搜索过滤
    const filterStudentOption = (input: string, option: any) => {
      return option.children.toLowerCase().includes(input.toLowerCase());
    };
    
    // 加载数据
    const loadData = async () => {
      await Promise.all([
        loadAttendances(),
        loadStudents(),
        loadSchedules(),
      ]);
    };
    
    // 加载出勤记录
    const loadAttendances = async () => {
      loading.value = true;
      try {
        const params: any = {};
        if (selectedStatus.value) {
          params.status = selectedStatus.value;
        }
        if (dateRange.value && dateRange.value[0] && dateRange.value[1]) {
          params.start_date = dateRange.value[0].format('YYYY-MM-DD');
          params.end_date = dateRange.value[1].format('YYYY-MM-DD');
        }
        
        const response = await request.get('/api/h1/attendance', { params });
        attendances.value = response.data.data || [];
        pagination.total = response.data.total || 0;
      } catch (error) {
        message.error('加载出勤记录失败');
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
    
    // 加载课程安排
    const loadSchedules = async () => {
      try {
        const response = await request.get('/api/h1/schedule');
        schedules.value = response.data.data || [];
      } catch (error) {
        message.error('加载课程安排失败');
      }
    };
    
    // 状态变化处理
    const handleStatusChange = () => {
      pagination.current = 1;
      loadAttendances();
    };
    
    // 日期变化处理
    const handleDateChange = () => {
      pagination.current = 1;
      loadAttendances();
    };
    
    // 课程安排变化处理
    const handleScheduleChange = () => {
      // 加载可用的补课安排
      availableMakeupSchedules.value = schedules.value.filter(s => s.id !== makeupFormData.schedule_id);
    };
    
    // 显示补签模态框
    const showMakeupModal = () => {
      resetMakeupForm();
      makeupModalVisible.value = true;
    };
    
    // 为特定记录显示补签模态框
    const showMakeupModalForRecord = (record: Attendance) => {
      resetMakeupForm();
              makeupFormData.student_id = record.student_id;
      makeupFormData.schedule_id = record.schedule_id;
      makeupFormData.checked_at = moment();
      handleScheduleChange();
      makeupModalVisible.value = true;
    };
    
    // 查看补课详情
    const viewMakeupDetails = async (record: Attendance) => {
      try {
        const response = await request.get(`/api/h1/attendance/${record.id}/makeup-detail`);
        makeupDetail.value = response.data.data;
        makeupDetailModalVisible.value = true;
      } catch (error) {
        message.error('加载补课详情失败');
      }
    };
    
    // 重置表单
    const resetMakeupForm = () => {
      makeupFormData.student_id = undefined;
      makeupFormData.schedule_id = undefined;
      makeupFormData.makeup_schedule_id = undefined;
      makeupFormData.checked_at = null;
      makeupFormData.remark = '';
      availableMakeupSchedules.value = [];
      if (makeupFormRef.value) {
        makeupFormRef.value.clearValidate();
      }
    };
    
    // 提交补签
    const handleMakeupSubmit = async () => {
      try {
        await makeupFormRef.value.validate();
        makeupConfirmLoading.value = true;
        
        await request.post('/api/h1/attendance/admin-makeup', {
          schedule_id: makeupFormData.schedule_id,
          student_id: makeupFormData.student_id,
          makeup_schedule_id: makeupFormData.makeup_schedule_id || null,
        });
        
        message.success('补签成功');
        makeupModalVisible.value = false;
        resetMakeupForm();
        loadAttendances();
      } catch (error) {
        message.error('补签失败');
      } finally {
        makeupConfirmLoading.value = false;
      }
    };
    
    // 取消补签
    const cancelMakeup = async (id: number) => {
      try {
        await request.put(`/api/h1/attendance/${id}`, {
          status: '缺勤',
          makeupScheduleId: null,
        });
        message.success('补签已取消');
        loadAttendances();
      } catch (error) {
        message.error('取消补签失败');
      }
    };
    
    // 取消操作
    const handleMakeupCancel = () => {
      makeupModalVisible.value = false;
      resetMakeupForm();
    };
    
    const handleMakeupDetailCancel = () => {
      makeupDetailModalVisible.value = false;
      makeupDetail.value = null;
    };
    
    // 处理表格变化
    const handleTableChange = (pag: any) => {
      pagination.current = pag.current;
      pagination.pageSize = pag.pageSize;
      loadAttendances();
    };
    
    onMounted(() => {
      loadData();
    });
    
    return {
      loading,
      makeupModalVisible,
      makeupDetailModalVisible,
      makeupConfirmLoading,
      makeupFormRef,
      selectedStatus,
      dateRange,
      attendances,
      students,
      schedules,
      availableMakeupSchedules,
      makeupDetail,
      pagination,
      makeupFormData,
      columns,
      makeupRules,
      getStatusColor,
      formatDate,
      formatDateTime,
      formatTime,
      filterStudentOption,
      handleStatusChange,
      handleDateChange,
      handleScheduleChange,
      showMakeupModal,
      showMakeupModalForRecord,
      viewMakeupDetails,
      handleMakeupSubmit,
      cancelMakeup,
      handleMakeupCancel,
      handleMakeupDetailCancel,
      handleTableChange,
    };
  },
});
</script>

<style scoped>
.attendance-management {
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