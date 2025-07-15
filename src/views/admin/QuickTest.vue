<template>
  <div class="quick-test">
    <a-card title="功能验证测试">
      <a-space direction="vertical" style="width: 100%">
        <a-alert 
          message="这个页面用于快速验证所有管理功能是否正常工作" 
          type="info" 
          show-icon 
        />
        
        <!-- 学生管理测试 -->
        <a-card size="small" title="学生管理功能测试">
          <a-space>
            <a-button @click="testStudentCreate" :loading="studentLoading">
              测试创建学生
            </a-button>
            <a-button @click="testStudentList" :loading="studentLoading">
              测试获取学生列表
            </a-button>
            <a-tag :color="studentStatus === '成功' ? 'green' : studentStatus === '失败' ? 'red' : 'blue'">
              状态: {{ studentStatus }}
            </a-tag>
          </a-space>
          <div v-if="studentResult" style="margin-top: 8px;">
            <a-typography-text code>{{ studentResult }}</a-typography-text>
          </div>
        </a-card>

        <!-- 学期管理测试 -->
        <a-card size="small" title="学期管理功能测试">
          <a-space>
            <a-button @click="testSemesterCreate" :loading="semesterLoading">
              测试创建学期
            </a-button>
            <a-button @click="testSemesterList" :loading="semesterLoading">
              测试获取学期列表
            </a-button>
            <a-tag :color="semesterStatus === '成功' ? 'green' : semesterStatus === '失败' ? 'red' : 'blue'">
              状态: {{ semesterStatus }}
            </a-tag>
          </a-space>
          <div v-if="semesterResult" style="margin-top: 8px;">
            <a-typography-text code>{{ semesterResult }}</a-typography-text>
          </div>
        </a-card>

        <!-- 课程管理测试 -->
        <a-card size="small" title="课程管理功能测试">
          <a-space>
            <a-button @click="testCourseCreate" :loading="courseLoading">
              测试创建课程
            </a-button>
            <a-button @click="testCourseList" :loading="courseLoading">
              测试获取课程列表
            </a-button>
            <a-tag :color="courseStatus === '成功' ? 'green' : courseStatus === '失败' ? 'red' : 'blue'">
              状态: {{ courseStatus }}
            </a-tag>
          </a-space>
          <div v-if="courseResult" style="margin-top: 8px;">
            <a-typography-text code>{{ courseResult }}</a-typography-text>
          </div>
        </a-card>

        <!-- 班级管理测试 -->
        <a-card size="small" title="班级管理功能测试">
          <a-space>
            <a-button @click="testClassCreate" :loading="classLoading">
              测试创建班级
            </a-button>
            <a-button @click="testClassList" :loading="classLoading">
              测试获取班级列表
            </a-button>
            <a-tag :color="classStatus === '成功' ? 'green' : classStatus === '失败' ? 'red' : 'blue'">
              状态: {{ classStatus }}
            </a-tag>
          </a-space>
          <div v-if="classResult" style="margin-top: 8px;">
            <a-typography-text code>{{ classResult }}</a-typography-text>
          </div>
        </a-card>

        <!-- 快速操作 -->
        <a-card size="small" title="快速操作">
          <a-space>
            <a-button type="primary" @click="testAllFunctions" :loading="allLoading">
              一键测试所有功能
            </a-button>
            <a-button @click="clearResults">
              清除结果
            </a-button>
            <a-button @click="goToStudentManagement">
              前往学生管理
            </a-button>
            <a-button @click="goToClassManagement">
              前往班级管理
            </a-button>
          </a-space>
        </a-card>

        <!-- 整体状态 -->
        <a-card size="small" title="整体测试结果" v-if="overallResult">
          <a-result
            :status="overallResult.status"
            :title="overallResult.title"
            :sub-title="overallResult.subtitle"
          />
        </a-card>
      </a-space>
    </a-card>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import { studentApi, semesterApi, courseApi, classApi } from '@/api/admin';

export default defineComponent({
  setup() {
    const router = useRouter();
    
    // 加载状态
    const studentLoading = ref(false);
    const semesterLoading = ref(false);
    const courseLoading = ref(false);
    const classLoading = ref(false);
    const allLoading = ref(false);

    // 测试状态
    const studentStatus = ref('未测试');
    const semesterStatus = ref('未测试');
    const courseStatus = ref('未测试');
    const classStatus = ref('未测试');

    // 测试结果
    const studentResult = ref('');
    const semesterResult = ref('');
    const courseResult = ref('');
    const classResult = ref('');
    const overallResult = ref(null);

    // 测试学生功能
    const testStudentCreate = async () => {
      studentLoading.value = true;
      try {
        const testData = {
          name: `测试学生${Date.now()}`,
          contact: '12345678901',
          discount_rate: 1.0
        };
        const response = await studentApi.create(testData);
        studentStatus.value = '成功';
        studentResult.value = '学生创建成功';
        console.log('学生创建测试成功:', response);
      } catch (error: any) {
        studentStatus.value = '失败';
        studentResult.value = error.response?.data?.message || error.message;
        console.error('学生创建测试失败:', error);
      } finally {
        studentLoading.value = false;
      }
    };

    const testStudentList = async () => {
      studentLoading.value = true;
      try {
        const response = await studentApi.getAll();
        studentStatus.value = '成功';
        studentResult.value = `获取到 ${response.data?.data?.length || 0} 个学生`;
        console.log('学生列表测试成功:', response);
      } catch (error: any) {
        studentStatus.value = '失败';
        studentResult.value = error.response?.data?.message || error.message;
        console.error('学生列表测试失败:', error);
      } finally {
        studentLoading.value = false;
      }
    };

    // 测试学期功能
    const testSemesterCreate = async () => {
      semesterLoading.value = true;
      try {
        const testData = {
          name: `测试学期${Date.now()}`,
          start_date: '2024-01-01',
          end_date: '2024-06-30'
        };
        const response = await semesterApi.create(testData);
        semesterStatus.value = '成功';
        semesterResult.value = '学期创建成功';
        console.log('学期创建测试成功:', response);
      } catch (error: any) {
        semesterStatus.value = '失败';
        semesterResult.value = error.response?.data?.message || error.message;
        console.error('学期创建测试失败:', error);
      } finally {
        semesterLoading.value = false;
      }
    };

    const testSemesterList = async () => {
      semesterLoading.value = true;
      try {
        const response = await semesterApi.getAll();
        semesterStatus.value = '成功';
        semesterResult.value = `获取到 ${response.data?.data?.length || 0} 个学期`;
        console.log('学期列表测试成功:', response);
      } catch (error: any) {
        semesterStatus.value = '失败';
        semesterResult.value = error.response?.data?.message || error.message;
        console.error('学期列表测试失败:', error);
      } finally {
        semesterLoading.value = false;
      }
    };

    // 测试课程功能
    const testCourseCreate = async () => {
      courseLoading.value = true;
      try {
        const testData = {
          name: `测试课程${Date.now()}`
        };
        const response = await courseApi.create(testData);
        courseStatus.value = '成功';
        courseResult.value = '课程创建成功';
        console.log('课程创建测试成功:', response);
      } catch (error: any) {
        courseStatus.value = '失败';
        courseResult.value = error.response?.data?.message || error.message;
        console.error('课程创建测试失败:', error);
      } finally {
        courseLoading.value = false;
      }
    };

    const testCourseList = async () => {
      courseLoading.value = true;
      try {
        const response = await courseApi.getAll();
        courseStatus.value = '成功';
        courseResult.value = `获取到 ${response.data?.data?.length || 0} 个课程`;
        console.log('课程列表测试成功:', response);
      } catch (error: any) {
        courseStatus.value = '失败';
        courseResult.value = error.response?.data?.message || error.message;
        console.error('课程列表测试失败:', error);
      } finally {
        courseLoading.value = false;
      }
    };

    // 测试班级功能 - 需要先有学期
    const testClassCreate = async () => {
      classLoading.value = true;
      try {
        // 先获取学期列表
        const semestersResponse = await semesterApi.getAll();
        const semesters = semestersResponse.data?.data || [];
        
        if (semesters.length === 0) {
          throw new Error('需要先创建学期才能创建班级');
        }

        const testData = {
          name: `测试班级${Date.now()}`,
          semester_id: semesters[0].id
        };
        const response = await classApi.create(testData);
        classStatus.value = '成功';
        classResult.value = '班级创建成功';
        console.log('班级创建测试成功:', response);
      } catch (error: any) {
        classStatus.value = '失败';
        classResult.value = error.response?.data?.message || error.message;
        console.error('班级创建测试失败:', error);
      } finally {
        classLoading.value = false;
      }
    };

    const testClassList = async () => {
      classLoading.value = true;
      try {
        const response = await classApi.getAll();
        classStatus.value = '成功';
        classResult.value = `获取到 ${response.data?.data?.length || 0} 个班级`;
        console.log('班级列表测试成功:', response);
      } catch (error: any) {
        classStatus.value = '失败';
        classResult.value = error.response?.data?.message || error.message;
        console.error('班级列表测试失败:', error);
      } finally {
        classLoading.value = false;
      }
    };

    // 测试所有功能
    const testAllFunctions = async () => {
      allLoading.value = true;
      clearResults();
      
      try {
        await testStudentList();
        await testSemesterList();
        await testCourseList();
        await testClassList();

        const successCount = [studentStatus.value, semesterStatus.value, courseStatus.value, classStatus.value]
          .filter(status => status === '成功').length;
        
        if (successCount === 4) {
          overallResult.value = {
            status: 'success',
            title: '所有功能测试通过',
            subtitle: '学生、学期、课程、班级管理功能都正常工作'
          };
          message.success('所有功能测试通过！');
        } else {
          overallResult.value = {
            status: 'warning',
            title: `部分功能异常`,
            subtitle: `${successCount}/4 个功能正常，请检查失败的功能`
          };
          message.warning('部分功能测试失败，请检查详情');
        }
      } catch (error) {
        overallResult.value = {
          status: 'error',
          title: '测试过程中出现异常',
          subtitle: '请检查网络连接和后端服务状态'
        };
        message.error('测试过程中出现异常');
      } finally {
        allLoading.value = false;
      }
    };

    // 清除结果
    const clearResults = () => {
      studentStatus.value = '未测试';
      semesterStatus.value = '未测试';
      courseStatus.value = '未测试';
      classStatus.value = '未测试';
      studentResult.value = '';
      semesterResult.value = '';
      courseResult.value = '';
      classResult.value = '';
      overallResult.value = null;
    };

    // 导航功能
    const goToStudentManagement = () => {
      router.push('/admin/student');
    };

    const goToClassManagement = () => {
      router.push('/admin/class');
    };

    return {
      // 加载状态
      studentLoading,
      semesterLoading,
      courseLoading,
      classLoading,
      allLoading,
      
      // 测试状态
      studentStatus,
      semesterStatus,
      courseStatus,
      classStatus,
      
      // 测试结果
      studentResult,
      semesterResult,
      courseResult,
      classResult,
      overallResult,
      
      // 方法
      testStudentCreate,
      testStudentList,
      testSemesterCreate,
      testSemesterList,
      testCourseCreate,
      testCourseList,
      testClassCreate,
      testClassList,
      testAllFunctions,
      clearResults,
      goToStudentManagement,
      goToClassManagement,
    };
  },
});
</script>

<style scoped>
.quick-test {
  padding: 24px;
}
</style> 