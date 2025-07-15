<template>
  <div class="dashboard">
    <div class="page-header">
      <h1>管理员控制台</h1>
      <p>欢迎使用学生上课打卡与收费管理系统</p>
    </div>

    <!-- API连接测试 -->
    <a-card title="🔧 系统状态检测" style="margin-bottom: 20px;">
      <a-space direction="vertical" style="width: 100%;">
        <a-space>
          <a-button @click="testConnection" :loading="testing">
            测试后端连接
          </a-button>
          <a-tag :color="connectionStatus.color">{{ connectionStatus.text }}</a-tag>
        </a-space>
        
        <a-space>
          <a-button @click="testAuth" :loading="authTesting">
            测试管理员认证
          </a-button>
          <a-tag :color="authStatus.color">{{ authStatus.text }}</a-tag>
        </a-space>

        <div v-if="debugInfo">
          <a-divider>调试信息</a-divider>
          <pre style="background: #f5f5f5; padding: 10px; border-radius: 4px;">{{ debugInfo }}</pre>
        </div>
      </a-space>
    </a-card>

    <!-- 系统概览 -->
    <a-row :gutter="16" style="margin-bottom: 20px;">
      <a-col :span="6">
        <a-card>
          <a-statistic
            title="学生总数"
            :value="statistics.studentCount"
            prefix="👥"
            :loading="statsLoading"
          />
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card>
          <a-statistic
            title="课程总数"
            :value="statistics.courseCount"
            prefix="📚"
            :loading="statsLoading"
          />
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card>
          <a-statistic
            title="班级总数"
            :value="statistics.classCount"
            prefix="🏫"
            :loading="statsLoading"
          />
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card>
          <a-statistic
            title="本月收入"
            :value="statistics.monthlyIncome"
            prefix="💰"
            :precision="2"
            suffix="元"
            :loading="statsLoading"
          />
        </a-card>
      </a-col>
    </a-row>

    <!-- 今日课表 -->
    <a-card title="📅 今日课表" style="margin-bottom: 20px;">
      <a-table
        :columns="scheduleColumns"
        :data-source="todaySchedules"
        :loading="scheduleLoading"
        size="small"
        :pagination="false"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'time'">
            {{ formatTime(record.start_time) }} - {{ formatTime(record.end_time) }}
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 快速操作 -->
    <a-card title="⚡ 快速操作">
      <a-space wrap>
        <a-button type="primary" @click="$router.push('/admin/student')">
          添加学生
        </a-button>
        <a-button @click="$router.push('/admin/course')">
          管理课程
        </a-button>
        <a-button @click="$router.push('/admin/class')">
          管理班级
        </a-button>
        <a-button @click="$router.push('/admin/teaching-class')">
          教学班管理
        </a-button>
        <a-button @click="$router.push('/admin/schedule')">
          排课管理
        </a-button>
        <a-button @click="$router.push('/admin/attendance')">
          出勤管理
        </a-button>
        <a-button @click="$router.push('/admin/billing')">
          账单管理
        </a-button>
        <a-divider type="vertical" />
        <a-button type="dashed" @click="$router.push('/admin/api-test')">
          🔧 API测试
        </a-button>
      </a-space>
    </a-card>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import { statisticsApi, scheduleApi, studentApi } from '@/api/admin';
import request from '@/utils/request';
import storageService from '@/service/storageService';

export default defineComponent({
  setup() {
    const testing = ref(false);
    const authTesting = ref(false);
    const statsLoading = ref(false);
    const scheduleLoading = ref(false);
    const debugInfo = ref('');
    
    const connectionStatus = ref({
      color: 'default',
      text: '未测试'
    });
    
    const authStatus = ref({
      color: 'default', 
      text: '未测试'
    });

    const statistics = ref({
      studentCount: 0,
      courseCount: 0,
      classCount: 0,
      monthlyIncome: 0
    });

    const todaySchedules = ref([]);

    const scheduleColumns = [
      {
        title: '时间',
        key: 'time',
        width: 150,
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
        title: '学期',
        dataIndex: 'semester_name',
        key: 'semester_name',
      },
    ];

    // 测试后端连接
    const testConnection = async () => {
      testing.value = true;
      debugInfo.value = '';
      
      try {
        // 测试简单的后端连接
        const response = await request.get('/api/h1/course');
        
        connectionStatus.value = {
          color: 'success',
          text: '连接正常'
        };
        
        debugInfo.value = `连接成功!\n响应状态: ${response.status}\n响应数据: ${JSON.stringify(response.data, null, 2)}`;
        message.success('后端连接正常');
        
      } catch (error: any) {
        connectionStatus.value = {
          color: 'error',
          text: '连接失败'
        };
        
        debugInfo.value = `连接失败!\n错误信息: ${error.message}\n错误详情: ${JSON.stringify(error.response?.data || error, null, 2)}`;
        console.error('连接测试失败:', error);
        
        if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
          message.error('无法连接到后端服务器 (localhost:9090)，请确保后端服务正在运行');
        } else {
          message.error('后端连接测试失败: ' + error.message);
        }
      } finally {
        testing.value = false;
      }
    };

    // 测试管理员认证
    const testAuth = async () => {
      authTesting.value = true;
      
      try {
        const token = storageService.get(storageService.USER_TOKEN);
        
        if (!token) {
          authStatus.value = {
            color: 'warning',
            text: '未登录'
          };
          message.warning('请先登录管理员账号');
          return;
        }

        // 测试需要认证的接口
        const response = await request.get('/api/admin/info');
        
        authStatus.value = {
          color: 'success',
          text: '认证有效'
        };
        
        message.success('管理员认证有效');
        
      } catch (error: any) {
        authStatus.value = {
          color: 'error',
          text: '认证失败'
        };
        
        if (error.response?.status === 401) {
          message.error('管理员认证已过期，请重新登录');
        } else {
          message.error('认证测试失败: ' + error.message);
        }
      } finally {
        authTesting.value = false;
      }
    };

    // 加载统计数据
    const loadStatistics = async () => {
      statsLoading.value = true;
      try {
        const data = await statisticsApi.getOverview();
        statistics.value = data;
      } catch (error) {
        console.error('加载统计数据失败:', error);
      } finally {
        statsLoading.value = false;
      }
    };

    // 加载今日课表
    const loadTodaySchedules = async () => {
      scheduleLoading.value = true;
      try {
        const response = await scheduleApi.getToday();
        todaySchedules.value = response.data.data || [];
      } catch (error) {
        console.error('加载今日课表失败:', error);
      } finally {
        scheduleLoading.value = false;
      }
    };

    // 格式化时间
    const formatTime = (timeStr: string) => {
      if (!timeStr) return '';
      const date = new Date(timeStr);
      return date.toLocaleTimeString('zh-CN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    };

    onMounted(() => {
      loadStatistics();
      loadTodaySchedules();
    });

    return {
      testing,
      authTesting,
      statsLoading,
      scheduleLoading,
      debugInfo,
      connectionStatus,
      authStatus,
      statistics,
      todaySchedules,
      scheduleColumns,
      testConnection,
      testAuth,
      formatTime,
    };
  },
});
</script>

<style scoped>
.dashboard {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h1 {
  margin: 0;
  color: #1890ff;
}

.page-header p {
  margin: 8px 0 0 0;
  color: #666;
}
</style> 