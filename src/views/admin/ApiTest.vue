<template>
  <div class="api-test">
    <div class="page-header">
      <h2>API 功能测试</h2>
      <p>测试各项API功能是否正常工作</p>
    </div>

    <!-- 基础连接测试 -->
    <a-card title="🔗 基础连接测试" style="margin-bottom: 20px;">
      <a-space direction="vertical" style="width: 100%;">
        <a-space>
          <a-button @click="testConnection" :loading="testing" type="primary">
            测试后端连接
          </a-button>
          <a-tag :color="connectionStatus.color">{{ connectionStatus.text }}</a-tag>
        </a-space>
        
        <a-space>
          <a-button @click="testAuth" :loading="authTesting">
            测试认证状态
          </a-button>
          <a-tag :color="authStatus.color">{{ authStatus.text }}</a-tag>
        </a-space>
      </a-space>
    </a-card>

    <!-- 学生管理测试 -->
    <a-card title="👥 学生管理测试" style="margin-bottom: 20px;">
      <a-space direction="vertical" style="width: 100%;">
        <a-space>
          <a-button @click="testGetStudents" :loading="studentsLoading">
            获取学生列表
          </a-button>
          <a-tag v-if="studentsResult" :color="studentsResult.success ? 'success' : 'error'">
            {{ studentsResult.message }}
          </a-tag>
        </a-space>

        <div v-if="students.length > 0">
          <h4>学生列表 ({{ students.length }} 条记录):</h4>
          <a-table 
            :columns="studentColumns" 
            :data-source="students" 
            size="small" 
            :pagination="false"
            style="max-height: 200px; overflow-y: auto;"
          />
        </div>

        <a-divider />
        
        <div>
          <h4>添加测试学生:</h4>
          <a-space>
            <a-input v-model:value="newStudent.name" placeholder="学生姓名" style="width: 120px;" />
            <a-input v-model:value="newStudent.contact" placeholder="联系方式" style="width: 120px;" />
            <a-input-number v-model:value="newStudent.discount_rate" :min="0.1" :max="1" :step="0.1" placeholder="折扣率" style="width: 100px;" />
            <a-button @click="testCreateStudent" :loading="createStudentLoading" type="primary">
              添加学生
            </a-button>
          </a-space>
        </div>
      </a-space>
    </a-card>

    <!-- 其他功能测试 -->
    <a-card title="📚 其他功能测试" style="margin-bottom: 20px;">
      <a-space wrap>
        <a-button @click="testGetCourses" :loading="coursesLoading">
          获取课程列表
        </a-button>
        <a-button @click="testGetSemesters" :loading="semestersLoading">
          获取学期列表
        </a-button>
        <a-button @click="testGetClasses" :loading="classesLoading">
          获取班级列表
        </a-button>
        <a-button @click="testGetSchedules" :loading="schedulesLoading">
          获取课表列表
        </a-button>
      </a-space>
      
      <div v-if="otherResults.length > 0" style="margin-top: 10px;">
        <a-divider />
        <div v-for="(result, index) in otherResults" :key="index">
          <a-tag :color="result.success ? 'success' : 'error'">
            {{ result.name }}: {{ result.message }}
          </a-tag>
        </div>
      </div>
    </a-card>

    <!-- 调试信息 -->
    <a-card title="🐛 调试信息" v-if="debugLogs.length > 0">
      <div style="max-height: 300px; overflow-y: auto; background: #f5f5f5; padding: 10px; border-radius: 4px;">
        <div v-for="(log, index) in debugLogs" :key="index" style="margin-bottom: 5px; font-family: monospace;">
          <span :style="{ color: log.type === 'error' ? 'red' : log.type === 'success' ? 'green' : 'blue' }">
            [{{ log.time }}] {{ log.type.toUpperCase() }}:
          </span>
          {{ log.message }}
        </div>
      </div>
      <a-button @click="clearLogs" style="margin-top: 10px;">清空日志</a-button>
    </a-card>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { message } from 'ant-design-vue';
import { 
  studentApi, 
  courseApi, 
  semesterApi, 
  classApi, 
  scheduleApi 
} from '@/api/admin';
import request from '@/utils/request';
import storageService from '@/service/storageService';

interface DebugLog {
  time: string;
  type: 'info' | 'success' | 'error';
  message: string;
}

interface TestResult {
  success: boolean;
  message: string;
  name?: string;
}

export default defineComponent({
  setup() {
    const testing = ref(false);
    const authTesting = ref(false);
    const studentsLoading = ref(false);
    const createStudentLoading = ref(false);
    const coursesLoading = ref(false);
    const semestersLoading = ref(false);
    const classesLoading = ref(false);
    const schedulesLoading = ref(false);

    const connectionStatus = ref({ color: 'default', text: '未测试' });
    const authStatus = ref({ color: 'default', text: '未测试' });
    const studentsResult = ref<TestResult | null>(null);
    const otherResults = ref<TestResult[]>([]);

    const students = ref<any[]>([]);
    const debugLogs = ref<DebugLog[]>([]);

    const newStudent = ref({
      name: '测试学生' + Date.now().toString().slice(-4),
      contact: '13800138000',
      discount_rate: 1.0
    });

    const studentColumns = [
      { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
      { title: '姓名', dataIndex: 'name', key: 'name' },
      { title: '联系方式', dataIndex: 'contact', key: 'contact' },
      { title: '折扣率', dataIndex: 'discount_rate', key: 'discount_rate' },
    ];

    // 添加调试日志
    const addLog = (type: 'info' | 'success' | 'error', message: string) => {
      debugLogs.value.unshift({
        time: new Date().toLocaleTimeString(),
        type,
        message
      });
      if (debugLogs.value.length > 50) {
        debugLogs.value = debugLogs.value.slice(0, 50);
      }
    };

    // 清空日志
    const clearLogs = () => {
      debugLogs.value = [];
    };

    // 测试连接
    const testConnection = async () => {
      testing.value = true;
      try {
        addLog('info', '开始测试后端连接...');
        const response = await request.get('/api/h1/course');
        
        connectionStatus.value = { color: 'success', text: '连接正常' };
        addLog('success', `连接成功，状态码: ${response.status}`);
        message.success('后端连接正常');
      } catch (error: any) {
        connectionStatus.value = { color: 'error', text: '连接失败' };
        addLog('error', `连接失败: ${error.message}`);
        
        if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
          message.error('无法连接到后端服务器，请确保后端服务正在运行');
        } else {
          message.error('后端连接失败: ' + error.message);
        }
      } finally {
        testing.value = false;
      }
    };

    // 测试认证
    const testAuth = async () => {
      authTesting.value = true;
      try {
        const token = storageService.get(storageService.USER_TOKEN);
        addLog('info', `检查token: ${token ? '存在' : '不存在'}`);
        
        if (!token) {
          authStatus.value = { color: 'warning', text: '未登录' };
          addLog('error', '未找到认证token');
          message.warning('请先登录管理员账号');
          return;
        }

        const response = await request.get('/api/admin/info');
        authStatus.value = { color: 'success', text: '认证有效' };
        addLog('success', '管理员认证有效');
        message.success('管理员认证有效');
      } catch (error: any) {
        authStatus.value = { color: 'error', text: '认证失败' };
        addLog('error', `认证失败: ${error.message}`);
        
        if (error.response?.status === 401) {
          message.error('管理员认证已过期，请重新登录');
        } else {
          message.error('认证测试失败: ' + error.message);
        }
      } finally {
        authTesting.value = false;
      }
    };

    // 测试获取学生
    const testGetStudents = async () => {
      studentsLoading.value = true;
      try {
        addLog('info', '开始获取学生列表...');
        const response = await studentApi.getAll();
        
        addLog('info', `原始响应: ${JSON.stringify(response.data)}`);
        
        if (response.data && response.data.data) {
          students.value = response.data.data;
          studentsResult.value = {
            success: true,
            message: `成功获取 ${students.value.length} 条学生记录`
          };
          addLog('success', `成功获取学生列表，共 ${students.value.length} 条记录`);
        } else {
          studentsResult.value = {
            success: false,
            message: '响应数据格式异常'
          };
          addLog('error', '响应数据格式异常');
        }
      } catch (error: any) {
        studentsResult.value = {
          success: false,
          message: error.message
        };
        addLog('error', `获取学生列表失败: ${error.message}`);
      } finally {
        studentsLoading.value = false;
      }
    };

    // 测试创建学生
    const testCreateStudent = async () => {
      createStudentLoading.value = true;
      try {
        addLog('info', `创建学生: ${JSON.stringify(newStudent.value)}`);
        const response = await studentApi.create(newStudent.value);
        
        addLog('success', `学生创建成功: ${JSON.stringify(response.data)}`);
        message.success('学生创建成功');
        
        // 重新生成测试数据
        newStudent.value.name = '测试学生' + Date.now().toString().slice(-4);
        
        // 刷新学生列表
        testGetStudents();
      } catch (error: any) {
        addLog('error', `创建学生失败: ${error.message}`);
        message.error('创建学生失败: ' + error.message);
      } finally {
        createStudentLoading.value = false;
      }
    };

    // 测试其他API
    const testGetCourses = async () => {
      coursesLoading.value = true;
      try {
        const response = await courseApi.getAll();
        const count = response.data?.data?.length || 0;
        otherResults.value.push({
          name: '课程',
          success: true,
          message: `获取到 ${count} 条课程记录`
        });
        addLog('success', `课程列表获取成功，共 ${count} 条记录`);
      } catch (error: any) {
        otherResults.value.push({
          name: '课程',
          success: false,
          message: error.message
        });
        addLog('error', `获取课程列表失败: ${error.message}`);
      } finally {
        coursesLoading.value = false;
      }
    };

    const testGetSemesters = async () => {
      semestersLoading.value = true;
      try {
        const response = await semesterApi.getAll();
        const count = response.data?.data?.length || 0;
        otherResults.value.push({
          name: '学期',
          success: true,
          message: `获取到 ${count} 条学期记录`
        });
        addLog('success', `学期列表获取成功，共 ${count} 条记录`);
      } catch (error: any) {
        otherResults.value.push({
          name: '学期',
          success: false,
          message: error.message
        });
        addLog('error', `获取学期列表失败: ${error.message}`);
      } finally {
        semestersLoading.value = false;
      }
    };

    const testGetClasses = async () => {
      classesLoading.value = true;
      try {
        const response = await classApi.getAll();
        const count = response.data?.data?.length || 0;
        otherResults.value.push({
          name: '班级',
          success: true,
          message: `获取到 ${count} 条班级记录`
        });
        addLog('success', `班级列表获取成功，共 ${count} 条记录`);
      } catch (error: any) {
        otherResults.value.push({
          name: '班级',
          success: false,
          message: error.message
        });
        addLog('error', `获取班级列表失败: ${error.message}`);
      } finally {
        classesLoading.value = false;
      }
    };

    const testGetSchedules = async () => {
      schedulesLoading.value = true;
      try {
        const response = await scheduleApi.getAll();
        const count = response.data?.data?.length || 0;
        otherResults.value.push({
          name: '课表',
          success: true,
          message: `获取到 ${count} 条课表记录`
        });
        addLog('success', `课表列表获取成功，共 ${count} 条记录`);
      } catch (error: any) {
        otherResults.value.push({
          name: '课表',
          success: false,
          message: error.message
        });
        addLog('error', `获取课表列表失败: ${error.message}`);
      } finally {
        schedulesLoading.value = false;
      }
    };

    return {
      testing,
      authTesting,
      studentsLoading,
      createStudentLoading,
      coursesLoading,
      semestersLoading,
      classesLoading,
      schedulesLoading,
      connectionStatus,
      authStatus,
      studentsResult,
      otherResults,
      students,
      debugLogs,
      newStudent,
      studentColumns,
      testConnection,
      testAuth,
      testGetStudents,
      testCreateStudent,
      testGetCourses,
      testGetSemesters,
      testGetClasses,
      testGetSchedules,
      clearLogs,
    };
  },
});
</script>

<style scoped>
.api-test {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  color: #1890ff;
}

.page-header p {
  margin: 8px 0 0 0;
  color: #666;
}
</style> 