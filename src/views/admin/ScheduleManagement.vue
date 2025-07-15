<template>
  <div class="schedule-management">
    <div class="page-header">
      <a-row justify="space-between" align="middle">
        <a-col>
          <h2>课表管理</h2>
          <p>查看和管理 {{ selectedDate.format('YYYY年MM月DD日') }} 的课程安排，支持一键打卡</p>
        </a-col>
        <a-col>
          <a-space>
            <a-button-group>
              <a-button @click="goToYesterday" size="small">昨天</a-button>
              <a-button @click="goToToday" size="small" type="primary">今天</a-button>
              <a-button @click="goToTomorrow" size="small">明天</a-button>
            </a-button-group>
            <a-date-picker
              v-model:value="selectedDate"
              placeholder="选择日期"
              @change="handleDateChange"
              style="width: 150px"
            />
            <a-button type="primary" @click="showCreateModal">
              <template #icon><PlusOutlined /></template>
              新增课表
            </a-button>
          </a-space>
        </a-col>
      </a-row>
    </div>

    <!-- 课表显示区域 -->
    <a-card>
      <div v-if="loading" class="loading-container">
        <a-spin size="large" />
      </div>
      <div v-else>
        <div v-for="(daySchedules, date) in groupedSchedules" :key="date" class="day-schedule">
          <div class="date-header">
            <h3>{{ formatDateHeader(date) }}</h3>
            <a-tag :color="isToday(date) ? 'red' : 'blue'">
              {{ isToday(date) ? '今天' : formatWeekday(date) }}
            </a-tag>
          </div>
          
          <div v-if="daySchedules.length === 0" class="no-schedule">
            <a-empty description="当天无课程安排" />
          </div>
          
          <div v-else class="schedule-list">
            <div 
              v-for="schedule in daySchedules" 
              :key="schedule.id" 
              class="schedule-item"
              :class="{ 'schedule-past': isPastSchedule(schedule) }"
            >
              <div class="schedule-content">
                <div class="schedule-main">
                  <div class="teaching-class">
                    <a-tag color="blue">{{ schedule.class_name }} - {{ schedule.course_name }}</a-tag>
                    <span class="semester">{{ schedule.semester_name }}</span>
                  </div>
                  <div class="schedule-time">
                    <a-tag color="green">
                      {{ formatTime(schedule.start_time) }} - {{ formatTime(schedule.end_time) }}
                    </a-tag>
                  </div>
                </div>
                
                <div class="schedule-actions">
                  <a-space>
                    <a-button 
                      size="small" 
                      type="primary"
                      @click="showAttendanceModal(schedule)"
                      :disabled="!canTakeAttendance(schedule)"
                    >
                      <template #icon><CheckCircleOutlined /></template>
                      {{ getAttendanceButtonText(schedule) }}
                    </a-button>
                    
                    <a-dropdown>
                      <a-button size="small">
                        <template #icon><MoreOutlined /></template>
                      </a-button>
                      <template #overlay>
                        <a-menu>
                          <a-menu-item @click="showEditModal(schedule)">
                            <EditOutlined /> 编辑
                          </a-menu-item>
                          <a-menu-item @click="duplicateSchedule(schedule)">
                            <CopyOutlined /> 复制
                          </a-menu-item>
                          <a-menu-divider />
                          <a-menu-item @click="deleteSchedule(schedule.id)" danger>
                            <DeleteOutlined /> 删除
                          </a-menu-item>
                        </a-menu>
                      </template>
                    </a-dropdown>
                  </a-space>
                </div>
              </div>
              
              <!-- 考勤状态显示 -->
              <div v-if="schedule.attendance_summary" class="attendance-summary">
                <a-tag color="green">出勤: {{ schedule.attendance_summary.present }}</a-tag>
                <a-tag color="orange">请假: {{ schedule.attendance_summary.leave }}</a-tag>
                <a-tag color="red">旷课: {{ schedule.attendance_summary.absent }}</a-tag>
              </div>
            </div>
          </div>
        </div>
      </div>
    </a-card>

    <!-- 创建/编辑课程表的模态框 -->
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
        :rules="rules"
        layout="vertical"
      >
        <a-form-item label="课程日期" name="date">
          <a-date-picker
            v-model:value="formData.date"
            placeholder="请选择课程日期"
            style="width: 100%"
            :disabled-date="disabledDate"
          />
        </a-form-item>
        
        <a-form-item label="选择教学班" name="class_course_id">
          <a-select
            v-model:value="formData.class_course_id"
            placeholder="请选择教学班"
            style="width: 100%"
            show-search
            :filter-option="filterOption"
          >
            <a-select-option v-for="classCourse in availableTeachingClasses" :key="classCourse.id" :value="classCourse.id">
              <div style="display: flex; justify-content: space-between;">
                <span>{{ classCourse.display_name }}</span>
                <span style="color: #666;">{{ classCourse.student_count }}名学生</span>
              </div>
            </a-select-option>
          </a-select>
        </a-form-item>
        
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="开始时间" name="start_time">
              <a-time-picker
                v-model:value="formData.start_time"
                placeholder="开始时间"
                format="HH:mm"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="结束时间" name="end_time">
              <a-time-picker
                v-model:value="formData.end_time"
                placeholder="结束时间"
                format="HH:mm"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
        </a-row>
        
        <a-form-item v-if="formData.class_course_id">
          <template #label>
            <span>预览信息</span>
          </template>
          <a-descriptions size="small" bordered>
            <a-descriptions-item label="教学班">
              {{ getSelectedTeachingClassName() }}
            </a-descriptions-item>
            <a-descriptions-item label="学生数量">
              {{ getSelectedTeachingClassStudentCount() }}名
            </a-descriptions-item>
            <a-descriptions-item label="每小时价格">
              ¥{{ getSelectedTeachingClassPrice() }}
            </a-descriptions-item>
          </a-descriptions>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 打卡模态框 -->
    <a-modal
      v-model:visible="attendanceModalVisible"
      :title="`课程打卡 - ${currentSchedule?.teaching_class_name}`"
      @ok="handleAttendanceSubmit"
      @cancel="handleAttendanceCancel"
      :confirm-loading="attendanceLoading"
      width="800px"
    >
      <div v-if="currentSchedule">
        <a-descriptions size="small" bordered style="margin-bottom: 16px;">
          <a-descriptions-item label="日期">
            {{ formatDate(currentSchedule.date) }}
          </a-descriptions-item>
          <a-descriptions-item label="时间">
            {{ formatTime(currentSchedule.start_time) }} - {{ formatTime(currentSchedule.end_time) }}
          </a-descriptions-item>
          <a-descriptions-item label="教学班">
            {{ currentSchedule.class_name }} - {{ currentSchedule.course_name }}
          </a-descriptions-item>
        </a-descriptions>

        <div style="margin-bottom: 16px;">
          <a-space>
            <a-button @click="selectAllStudents" type="primary">全选</a-button>
            <a-button @click="unselectAllStudents">全不选</a-button>
            <a-button @click="markAbsentSelected" :disabled="!hasSelectedStudents">
              标记选中为旷课
            </a-button>
            <a-input 
              v-model:value="studentSearchText"
              placeholder="搜索学生"
              style="width: 200px"
              allow-clear
            >
              <template #prefix><SearchOutlined /></template>
            </a-input>
          </a-space>
        </div>

        <a-table
          :columns="attendanceColumns"
          :data-source="filteredStudentsForAttendance"
          :loading="attendanceLoading"
          row-key="student_id"
          :row-selection="{
            selectedRowKeys: selectedStudentIds,
            onChange: onStudentSelectionChange,
            getCheckboxProps: (record) => ({ 
              disabled: record.existing_status && record.existing_status !== '旷课' 
            })
          }"
          size="small"
          :pagination="false"
          :scroll="{ y: 300 }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'student_name'">
              <a-tag :color="getStudentStatusColor(record)">
                {{ record.student_name }}
              </a-tag>
            </template>
            <template v-else-if="column.key === 'status'">
              <a-select
                v-model:value="record.attendance_status"
                style="width: 100px"
                size="small"
                @change="onStatusChange(record)"
              >
                <a-select-option value="出勤">出勤</a-select-option>
                <a-select-option value="请假">请假</a-select-option>
                <a-select-option value="旷课">旷课</a-select-option>
              </a-select>
            </template>
            <template v-else-if="column.key === 'existing_status'">
              <a-tag v-if="record.existing_status" :color="getStatusColor(record.existing_status)">
                {{ record.existing_status }}
              </a-tag>
              <span v-else>-</span>
            </template>
          </template>
        </a-table>

        <div style="margin-top: 16px; text-align: center;">
          <a-statistic-group>
            <a-statistic title="出勤" :value="attendanceStats.present" />
            <a-statistic title="请假" :value="attendanceStats.leave" />
            <a-statistic title="旷课" :value="attendanceStats.absent" />
          </a-statistic-group>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, reactive, computed } from 'vue';
import { message } from 'ant-design-vue';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  CheckCircleOutlined,
  MoreOutlined,
  CopyOutlined,
  SearchOutlined
} from '@ant-design/icons-vue';
import request from '@/utils/request';
import moment from 'moment';
import { toRFC3339, formatDateDisplay, localDatetimeToRFC3339, localDateToRFC3339 } from '@/utils/dateUtils';
import { getTeachingClasses, type TeachingClass } from '@/api/teachingClass';
import { scheduleApi, attendanceApi } from '@/api/admin';

interface Schedule {
  id: number;
  class_course_id: number;
  class_name: string;
  course_name: string;
  semester_name: string;
  date: string;
  start_time: string;
  end_time: string;
  attendance_summary?: {
    present: number;
    leave: number;
    absent: number;
  };
}

interface StudentForAttendance {
  student_id: number;
  student_name: string;
  contact: string;
  discount_rate: number;
  existing_status?: string;
  attendance_status: string;
}

export default defineComponent({
  components: {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    CheckCircleOutlined,
    MoreOutlined,
    CopyOutlined,
    SearchOutlined,
  },
  setup() {
    const loading = ref(false);
    const modalVisible = ref(false);
    const attendanceModalVisible = ref(false);
    const confirmLoading = ref(false);
    const attendanceLoading = ref(false);
    const isEdit = ref(false);
    const formRef = ref();
    
    const schedules = ref<Schedule[]>([]);
    const availableTeachingClasses = ref<TeachingClass[]>([]);
    const studentsForAttendance = ref<StudentForAttendance[]>([]);
    const currentSchedule = ref<Schedule | null>(null);
    const selectedDate = ref(moment());
    const studentSearchText = ref('');
    const selectedStudentIds = ref<number[]>([]);
    
    const formData = reactive({
      id: undefined,
      class_course_id: undefined,
      date: null,
      start_time: null,
      end_time: null,
    });
    
    // 表单验证规则
    const rules = {
      class_course_id: [
        { required: true, message: '请选择教学班', trigger: 'change' },
      ],
      date: [
        { required: true, message: '请选择课程日期', trigger: 'change' },
      ],
      start_time: [
        { required: true, message: '请选择开始时间', trigger: 'change' },
      ],
      end_time: [
        { required: true, message: '请选择结束时间', trigger: 'change' },
      ],
    };
    
    // 计算属性：按日期分组的课表
    const groupedSchedules = computed(() => {
      const grouped: Record<string, Schedule[]> = {};
      
      schedules.value.forEach(schedule => {
        const date = schedule.date;
        if (!grouped[date]) {
          grouped[date] = [];
        }
        grouped[date].push(schedule);
      });
      
      // 按日期排序，每天内按时间排序
      const sortedDates = Object.keys(grouped).sort();
      const result: Record<string, Schedule[]> = {};
      
      sortedDates.forEach(date => {
        result[date] = grouped[date].sort((a, b) => 
          a.start_time.localeCompare(b.start_time)
        );
      });
      
      return result;
    });
    
    // 过滤后的学生列表（用于打卡）
    const filteredStudentsForAttendance = computed(() => {
      if (!studentSearchText.value) {
        return studentsForAttendance.value;
      }
      
      const searchText = studentSearchText.value.toLowerCase();
      return studentsForAttendance.value.filter(student => 
        student.student_name.toLowerCase().includes(searchText) ||
        student.contact.toLowerCase().includes(searchText)
      );
    });
    
    // 考勤统计
    const attendanceStats = computed(() => {
      const stats = { present: 0, leave: 0, absent: 0 };
      
      studentsForAttendance.value.forEach(student => {
        switch (student.attendance_status) {
          case '出勤':
            stats.present++;
            break;
          case '请假':
            stats.leave++;
            break;
          case '旷课':
            stats.absent++;
            break;
        }
      });
      
      return stats;
    });
    
    // 是否有选中的学生
    const hasSelectedStudents = computed(() => {
      return selectedStudentIds.value.length > 0;
    });
    
    // 考勤表格列
    const attendanceColumns = [
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
        title: '出勤状态',
        dataIndex: 'status',
        key: 'status',
      },
      {
        title: '已有记录',
        dataIndex: 'existing_status',
        key: 'existing_status',
      },
    ];
    
    // 模态框标题
    const modalTitle = computed(() => isEdit.value ? '编辑课程表' : '新增课程表');
    
    // 格式化日期（用于显示）
    const formatDate = (date: string) => {
      return formatDateDisplay(date);
    };
    
    // 格式化日期头部（不进行时区转换）
    const formatDateHeader = (date: string) => {
      // 直接从日期字符串中提取日期部分，避免时区转换
      const dateStr = date.includes('T') ? date.split('T')[0] : date;
      const [year, month, day] = dateStr.split('-');
      return `${parseInt(month)}月${parseInt(day)}日`;
    };
    
    // 格式化星期（不进行时区转换）
    const formatWeekday = (date: string) => {
      const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      // 直接从日期字符串中提取日期部分，避免时区转换
      const dateStr = date.includes('T') ? date.split('T')[0] : date;
      const dateObj = new Date(dateStr + 'T00:00:00');
      return weekdays[dateObj.getDay()];
    };
    
    // 格式化时间（不进行时区转换）
    const formatTime = (time: string) => {
      // 直接从时间戳字符串中提取时间部分，避免时区转换
      const timeStr = time.includes('T') ? time.split('T')[1] : time;
      return timeStr.split(':').slice(0, 2).join(':');
    };
    
    // 判断是否是今天（不进行时区转换）
    const isToday = (date: string) => {
      const dateStr = date.includes('T') ? date.split('T')[0] : date;
      const today = moment().format('YYYY-MM-DD');
      return dateStr === today;
    };
    
    // 判断课程是否已过时（不进行时区转换）
    const isPastSchedule = (schedule: Schedule) => {
      const dateStr = schedule.date.includes('T') ? schedule.date.split('T')[0] : schedule.date;
      const timeStr = schedule.end_time.includes('T') ? schedule.end_time.split('T')[1] : schedule.end_time;
      const endTime = timeStr.split(':').slice(0, 2).join(':');
      
      const now = moment();
      const today = now.format('YYYY-MM-DD');
      const currentTime = now.format('HH:mm');
      
      if (dateStr < today) {
        return true; // 过去的日期
      } else if (dateStr === today) {
        return endTime < currentTime; // 今天，但时间已过
      } else {
        return false; // 未来的日期
      }
    };
    
    // 判断是否可以打卡（不进行时区转换）
    const canTakeAttendance = (schedule: Schedule) => {
      const dateStr = schedule.date.includes('T') ? schedule.date.split('T')[0] : schedule.date;
      const today = moment().format('YYYY-MM-DD');
      // 只允许当天或之前的课程打卡
      return dateStr <= today;
    };
    
    // 获取打卡按钮文本
    const getAttendanceButtonText = (schedule: Schedule) => {
      if (!canTakeAttendance(schedule)) {
        return '未到时间';
      }
      if (schedule.attendance_summary) {
        return '查看考勤';
      }
      return '课程打卡';
    };
    
    // 日期选择变化处理
    const handleDateChange = () => {
      loadSchedules();
    };

    // 便捷日期导航
    const goToYesterday = () => {
      selectedDate.value = selectedDate.value.clone().subtract(1, 'day');
      loadSchedules();
    };

    const goToToday = () => {
      selectedDate.value = moment();
      loadSchedules();
    };

    const goToTomorrow = () => {
      selectedDate.value = selectedDate.value.clone().add(1, 'day');
      loadSchedules();
    };
    
    // 加载数据
    const loadData = async () => {
      await Promise.all([
        loadSchedules(),
        loadTeachingClasses(),
      ]);
    };
    
    // 加载课程安排列表
    const loadSchedules = async () => {
      loading.value = true;
      try {
        const dateStr = selectedDate.value.format('YYYY-MM-DD');
        
        const response = await scheduleApi.getWithDetail({
          start_date: dateStr,
          end_date: dateStr,
        });
        schedules.value = response.data.data || [];
      } catch (error) {
        message.error('加载课程表失败');
      } finally {
        loading.value = false;
      }
    };
    
    // 加载教学班列表
    const loadTeachingClasses = async () => {
      try {
        const response = await getTeachingClasses();
        availableTeachingClasses.value = response.data.data || [];
      } catch (error) {
        message.error('加载教学班列表失败');
      }
    };
    
    // 禁用过去的日期
    const disabledDate = (current: any) => {
      // 禁用超过30天前的日期
      return current && current < moment().subtract(30, 'days').endOf('day');
    };
    
    // 搜索过滤选项
    const filterOption = (input: string, option: any) => {
      return option.children.toLowerCase().includes(input.toLowerCase());
    };
    
    // 获取选中教学班名称
    const getSelectedTeachingClassName = () => {
      const selected = availableTeachingClasses.value.find(tc => tc.id === formData.class_course_id);
      return selected?.display_name || '';
    };
    
    // 获取选中教学班学生数量
    const getSelectedTeachingClassStudentCount = () => {
      const selected = availableTeachingClasses.value.find(tc => tc.id === formData.class_course_id);
      return selected?.student_count || 0;
    };
    
    // 获取选中教学班价格
    const getSelectedTeachingClassPrice = () => {
      const selected = availableTeachingClasses.value.find(tc => tc.id === formData.class_course_id);
      return selected?.price_per_hour || 0;
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
      formData.class_course_id = record.class_course_id;
      formData.date = moment(record.date);
      // 从完整的时间戳中提取时间部分
      formData.start_time = moment(record.start_time);
      formData.end_time = moment(record.end_time);
      modalVisible.value = true;
    };
    
    // 复制课程表
    const duplicateSchedule = (schedule: Schedule) => {
      isEdit.value = false;
      formData.id = undefined;
      formData.class_course_id = schedule.class_course_id;
      formData.date = moment(schedule.date).add(7, 'days'); // 默认复制到下周同一天
      // 从完整的时间戳中提取时间部分
      formData.start_time = moment(schedule.start_time);
      formData.end_time = moment(schedule.end_time);
      modalVisible.value = true;
    };
    
    // 重置表单
    const resetForm = () => {
      formData.id = undefined;
      formData.class_course_id = undefined;
      formData.date = null;
      formData.start_time = null;
      formData.end_time = null;
      if (formRef.value) {
        formRef.value.clearValidate();
      }
    };
    
    // 显示打卡模态框
    const showAttendanceModal = async (schedule: Schedule) => {
      currentSchedule.value = schedule;
      attendanceModalVisible.value = true;
      await loadStudentsForAttendance(schedule.id);
    };
    
    // 加载课程的学生信息
    const loadStudentsForAttendance = async (scheduleId: number) => {
      attendanceLoading.value = true;
      try {
        // 先获取该课程的所有已报名学生
        const enrollmentResponse = await request.get('/api/h1/enrollment/with-detail', {
          params: { class_course_id: currentSchedule.value?.class_course_id }
        });
        
        // 获取已有的考勤记录
        const attendanceResponse = await request.get('/api/h1/attendance', {
          params: { schedule_id: scheduleId }
        });
        
        const enrolledStudents = enrollmentResponse.data.data || [];
        const existingAttendance = attendanceResponse.data.data || [];
        
        // 为每个学生设置考勤状态
        studentsForAttendance.value = enrolledStudents.map((enrollment: any) => {
          const existing = existingAttendance.find((att: any) => att.student_id === enrollment.student_id);
          return {
            student_id: enrollment.student_id,
            student_name: enrollment.student_name,
            contact: enrollment.contact || '',
            discount_rate: enrollment.discount_rate || 1.0,
            existing_status: existing?.status || null,
            attendance_status: existing?.status || '出勤', // 默认出勤
          };
        });
        
        // 默认全选所有学生
        selectedStudentIds.value = studentsForAttendance.value.map(s => s.student_id);
        
      } catch (error) {
        message.error('加载学生数据失败');
      } finally {
        attendanceLoading.value = false;
      }
    };
    
    // 学生状态颜色
    const getStudentStatusColor = (record: StudentForAttendance) => {
      if (record.existing_status) {
        return getStatusColor(record.existing_status);
      }
      return 'blue';
    };
    
    // 状态颜色
    const getStatusColor = (status: string) => {
      switch (status) {
        case '出勤': return 'green';
        case '请假': return 'orange';
        case '旷课': return 'red';
        default: return 'blue';
      }
    };
    
    // 学生选择变化
    const onStudentSelectionChange = (keys: number[]) => {
      selectedStudentIds.value = keys;
    };
    
    // 状态变化处理
    const onStatusChange = (record: StudentForAttendance) => {
      // 如果改为出勤，自动选中该学生
      if (record.attendance_status === '出勤' && !selectedStudentIds.value.includes(record.student_id)) {
        selectedStudentIds.value.push(record.student_id);
      }
    };
    
    // 全选学生
    const selectAllStudents = () => {
      selectedStudentIds.value = studentsForAttendance.value.map(s => s.student_id);
      // 同时将所有学生状态设为出勤
      studentsForAttendance.value.forEach(student => {
        student.attendance_status = '出勤';
      });
    };
    
    // 全不选学生
    const unselectAllStudents = () => {
      selectedStudentIds.value = [];
    };
    
    // 标记选中学生为旷课
    const markAbsentSelected = () => {
      selectedStudentIds.value.forEach(studentId => {
        const student = studentsForAttendance.value.find(s => s.student_id === studentId);
        if (student) {
          student.attendance_status = '旷课';
        }
      });
    };
    
    // 提交考勤
    const handleAttendanceSubmit = async () => {
      if (!currentSchedule.value) return;
      
      attendanceLoading.value = true;
      try {
        // 为每个学生提交考勤记录
        const promises = studentsForAttendance.value.map(student => {
          return attendanceApi.create({
            schedule_id: currentSchedule.value!.id,
            student_id: student.student_id,
            status: student.attendance_status,
          });
        });
        
        await Promise.all(promises);
        message.success('考勤提交成功');
        attendanceModalVisible.value = false;
        await loadSchedules(); // 重新加载课表以更新考勤状态
      } catch (error) {
        message.error('考勤提交失败');
      } finally {
        attendanceLoading.value = false;
      }
    };
    
    // 取消考勤
    const handleAttendanceCancel = () => {
      attendanceModalVisible.value = false;
      currentSchedule.value = null;
      studentsForAttendance.value = [];
      selectedStudentIds.value = [];
      studentSearchText.value = '';
    };
    
    // 提交表单
    const handleSubmit = async () => {
      try {
        await formRef.value.validate();
        confirmLoading.value = true;
        
        // 组合日期和时间生成完整的时间戳
        const dateStr = formData.date.format('YYYY-MM-DD');
        const startTimeStr = formData.start_time?.format('HH:mm:ss');
        const endTimeStr = formData.end_time?.format('HH:mm:ss');
        
        console.log('表单数据:', {
          date: dateStr,
          startTime: startTimeStr,
          endTime: endTimeStr
        });
        
        const requestData = {
          ...formData,
          date: localDateToRFC3339(formData.date, false),
          start_time: localDatetimeToRFC3339(`${dateStr} ${startTimeStr}`),
          end_time: localDatetimeToRFC3339(`${dateStr} ${endTimeStr}`),
        };
        
        console.log('发送到后端的数据:', {
          date: requestData.date,
          start_time: requestData.start_time,
          end_time: requestData.end_time
        });
        
        if (isEdit.value) {
          await scheduleApi.update(requestData);
          message.success('课程表更新成功');
        } else {
          await scheduleApi.create(requestData);
          message.success('课程表创建成功');
        }
        
        modalVisible.value = false;
        await loadSchedules();
      } catch (error) {
        message.error(isEdit.value ? '课程表更新失败' : '课程表创建失败');
      } finally {
        confirmLoading.value = false;
      }
    };
    
    // 取消操作
    const handleCancel = () => {
      modalVisible.value = false;
      resetForm();
    };
    
    // 删除课程表
    const deleteSchedule = async (id: number) => {
      try {
        await scheduleApi.delete(id);
        message.success('课程表删除成功');
        await loadSchedules();
      } catch (error) {
        message.error('课程表删除失败');
      }
    };
    
    onMounted(() => {
      loadData();
    });
    
    return {
      loading,
      modalVisible,
      attendanceModalVisible,
      confirmLoading,
      attendanceLoading,
      isEdit,
      formRef,
      schedules,
      availableTeachingClasses,
      studentsForAttendance,
      currentSchedule,
      selectedDate,
      studentSearchText,
      selectedStudentIds,
      formData,
      rules,
      modalTitle,
      groupedSchedules,
      filteredStudentsForAttendance,
      attendanceStats,
      hasSelectedStudents,
      attendanceColumns,
      
      formatDate,
      formatDateHeader,
      formatWeekday,
      formatTime,
      isToday,
      isPastSchedule,
      canTakeAttendance,
      getAttendanceButtonText,
      handleDateChange,
      goToYesterday,
      goToToday,
      goToTomorrow,
      disabledDate,
      filterOption,
      getSelectedTeachingClassName,
      getSelectedTeachingClassStudentCount,
      getSelectedTeachingClassPrice,
      
      showCreateModal,
      showEditModal,
      duplicateSchedule,
      showAttendanceModal,
      getStudentStatusColor,
      getStatusColor,
      onStudentSelectionChange,
      onStatusChange,
      selectAllStudents,
      unselectAllStudents,
      markAbsentSelected,
      
      handleSubmit,
      handleCancel,
      handleAttendanceSubmit,
      handleAttendanceCancel,
      deleteSchedule,
    };
  },
});
</script>

<style scoped>
.schedule-management {
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

.loading-container {
  text-align: center;
  padding: 50px 0;
}

.day-schedule {
  margin-bottom: 24px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  overflow: hidden;
}

.date-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.date-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.no-schedule {
  padding: 40px;
  text-align: center;
  background: #fafafa;
}

.schedule-list {
  padding: 16px;
}

.schedule-item {
  background: white;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.schedule-item:hover {
  border-color: #1890ff;
  box-shadow: 0 4px 12px rgba(24,144,255,0.15);
}

.schedule-item:last-child {
  margin-bottom: 0;
}

.schedule-past {
  opacity: 0.6;
  background: #f5f5f5;
}

.schedule-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.schedule-main {
  flex: 1;
}

.teaching-class {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.semester {
  color: #666;
  font-size: 12px;
  margin-left: 8px;
}

.schedule-time {
  display: flex;
  align-items: center;
  gap: 12px;
}

.schedule-actions {
  margin-left: 16px;
}

.attendance-summary {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  gap: 8px;
}
</style> 