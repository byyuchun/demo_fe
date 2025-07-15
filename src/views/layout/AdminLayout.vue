<template>
  <div class="admin-layout">
    <a-layout style="min-height: 100vh">
      <a-layout-sider v-model:collapsed="collapsed" :trigger="null" collapsible>
        <div class="logo" />
        <a-menu
          theme="dark"
          mode="inline"
          :default-selected-keys="[current]"
          :selected-keys="[current]"
          @click="handleMenuClick"
        >
          <a-menu-item key="dashboard">
            <HomeOutlined />
            <span>数据概览</span>
          </a-menu-item>
          
          <a-menu-divider />
          
          <a-menu-item key="semester">
            <CalendarOutlined />
            <span>学期管理</span>
          </a-menu-item>
          
          <a-menu-item key="class">
            <TeamOutlined />
            <span>班级管理</span>
          </a-menu-item>
          
          <a-menu-item key="course">
            <BookOutlined />
            <span>课程管理</span>
          </a-menu-item>
          
          <a-menu-item key="student">
            <UserOutlined />
            <span>学生管理</span>
          </a-menu-item>
          
          <a-menu-item key="teaching-class">
            <TeamOutlined />
            <span>教学班管理</span>
          </a-menu-item>
          
          <a-menu-item key="enrollment">
            <FormOutlined />
            <span>报名管理</span>
          </a-menu-item>
          
          <a-menu-item key="schedule">
            <TableOutlined />
            <span>课表管理</span>
          </a-menu-item>
          
          <a-menu-item key="attendance">
            <CheckCircleOutlined />
            <span>打卡管理</span>
          </a-menu-item>
          
          <a-menu-item key="billing">
            <DollarCircleOutlined />
            <span>账单统计</span>
          </a-menu-item>
          
          <a-menu-divider />
          
          <a-menu-item key="quick-test">
            <ExperimentOutlined />
            <span>功能测试</span>
          </a-menu-item>
          
          <a-menu-item key="api-test">
            <ApiOutlined />
            <span>API调试</span>
          </a-menu-item>
        </a-menu>
      </a-layout-sider>
      
      <a-layout>
        <a-layout-header style="background: #fff; padding: 0">
          <div class="header-content">
            <div class="header-left">
              <MenuUnfoldOutlined
                v-if="collapsed"
                class="trigger"
                @click="() => (collapsed = !collapsed)"
              />
              <MenuFoldOutlined
                v-else
                class="trigger"
                @click="() => (collapsed = !collapsed)"
              />
              <span class="page-title">{{ pageTitle }}</span>
            </div>
            
            <div class="header-right">
              <a-dropdown>
                <a-avatar style="background-color: #1890ff; cursor: pointer">
                  <template #icon><UserOutlined /></template>
                </a-avatar>
                <template #overlay>
                  <a-menu>
                    <a-menu-item key="profile">个人资料</a-menu-item>
                    <a-menu-item key="logout" @click="logout">退出登录</a-menu-item>
                  </a-menu>
                </template>
              </a-dropdown>
            </div>
          </div>
        </a-layout-header>
        
        <a-layout-content style="margin: 24px 16px; padding: 24px; background: #fff">
          <router-view />
        </a-layout-content>
      </a-layout>
    </a-layout>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import {
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  HomeOutlined,
  CalendarOutlined,
  TeamOutlined,
  BookOutlined,
  UserOutlined,
  FormOutlined,
  TableOutlined,
  CheckCircleOutlined,
  DollarCircleOutlined,
  ExperimentOutlined,
  ApiOutlined,
} from '@ant-design/icons-vue';

export default defineComponent({
  components: {
    MenuUnfoldOutlined,
    MenuFoldOutlined,
    HomeOutlined,
    CalendarOutlined,
    TeamOutlined,
    BookOutlined,
    UserOutlined,
    FormOutlined,
    TableOutlined,
    CheckCircleOutlined,
    DollarCircleOutlined,
    ExperimentOutlined,
    ApiOutlined,
  },
  setup() {
    const router = useRouter();
    const route = useRoute();
    const collapsed = ref(false);
    
    const current = computed(() => {
      const path = route.path;
      if (path.includes('semester')) return 'semester';
      if (path.includes('class') && !path.includes('teaching-class')) return 'class';
      if (path.includes('teaching-class')) return 'teaching-class';
      if (path.includes('course')) return 'course';
      if (path.includes('student')) return 'student';
      if (path.includes('enrollment')) return 'enrollment';
      if (path.includes('schedule')) return 'schedule';
      if (path.includes('attendance')) return 'attendance';
      if (path.includes('billing')) return 'billing';
      if (path.includes('quick-test')) return 'quick-test';
      if (path.includes('api-test')) return 'api-test';
      return 'dashboard';
    });
    
    const pageTitle = computed(() => {
      const titles = {
        dashboard: '数据概览',
        semester: '学期管理',
        class: '班级管理',
        'teaching-class': '教学班管理',
        course: '课程管理',
        student: '学生管理',
        enrollment: '报名管理',
        schedule: '课表管理',
        attendance: '打卡管理',
        billing: '账单统计',
        'quick-test': '功能测试',
        'api-test': 'API调试',
      };
      return titles[current.value] || '管理系统';
    });
    
    const handleMenuClick = ({ key }) => {
      router.push(`/admin/${key}`);
    };
    
    const logout = () => {
      localStorage.removeItem('token');
      router.push('/login');
    };
    
    return {
      collapsed,
      current,
      pageTitle,
      handleMenuClick,
      logout,
    };
  },
});
</script>

<style scoped>
.admin-layout {
  height: 100vh;
}

.logo {
  height: 32px;
  background: rgba(255, 255, 255, 0.3);
  margin: 16px;
  border-radius: 4px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px;
  height: 64px;
}

.header-left {
  display: flex;
  align-items: center;
}

.trigger {
  font-size: 18px;
  line-height: 64px;
  padding: 0 24px;
  cursor: pointer;
  transition: color 0.3s;
}

.trigger:hover {
  color: #1890ff;
}

.page-title {
  margin-left: 16px;
  font-size: 18px;
  font-weight: 500;
}

.header-right {
  display: flex;
  align-items: center;
}
</style> 