import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'home',
    component: HomeView
  },
  {
    path: '/about',
    name: 'about',
    component: () => import('../views/AboutView.vue')
  },
  // 登录注册路由
  {
    path: '/aregister',
    name: 'aregister',
    component: () => import('../views/register/ARegister.vue')
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/login/Login.vue')
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('../views/profile/Profile.vue')
  },
  {
    path: '/asetting',
    name: 'asetting',
    component: () => import('../views/setting/AdminSetting.vue')
  },
  {
    path: '/usetting',
    name: 'usetting',
    component: () => import('../views/setting/UserSetting.vue')
  },
  {
    path: '/modify',
    name: 'modify',
    component: () => import('../views/modify/Modify.vue')
  },
  {
    path: '/stupass',
    name: 'stupass',
    component: () => import('../views/forget/Stupass.vue')
  },
  {
    path: '/adminpass',
    name: 'adminpass',
    component: () => import('../views/forget/Adminpass.vue')
  },
  {
    path: '/forget',
    name: 'forget',
    component: () => import('../views/forget/Forget.vue')
  },
  // 管理员路由
  {
    path: '/admin',
    component: () => import('../views/layout/AdminLayout.vue'),
    redirect: '/admin/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'dashboard',
        component: () => import('../views/admin/Dashboard.vue')
      },
      {
        path: 'semester',
        name: 'semester',
        component: () => import('../views/admin/SemesterManagement.vue')
      },
      {
        path: 'class',
        name: 'admin-class',
        component: () => import('../views/admin/ClassManagement.vue')
      },
      {
        path: 'course',
        name: 'course',
        component: () => import('../views/admin/CourseManagement.vue')
      },
      {
        path: 'student',
        name: 'student',
        component: () => import('../views/admin/StudentManagement.vue')
      },
      {
        path: 'enrollment',
        name: 'enrollment',
        component: () => import('../views/admin/EnrollmentManagement.vue')
      },
      {
        path: 'teaching-class',
        name: 'teaching-class',
        component: () => import('../views/admin/TeachingClassManagement.vue')
      },
            {
        path: 'schedule',
        name: 'schedule',
        component: () => import('../views/admin/ScheduleManagement.vue')
      },
      {
        path: 'attendance',
        name: 'attendance',
        component: () => import('../views/admin/AttendanceManagement.vue')
      },
      {
        path: 'billing',
        name: 'billing', 
        component: () => import('../views/admin/BillingManagement.vue')
      },
      {
        path: 'api-test',
        name: 'api-test',
        component: () => import('../views/admin/ApiTest.vue')
      },
      {
        path: 'quick-test',
        name: 'quick-test',
        component: () => import('../views/admin/QuickTest.vue')
      }
    ]
  },
  // 旧的管理路由保留以防兼容性问题
  {
    path: '/manage',
    name: 'manage',
    component: () => import('../views/manage/Manage.vue')
  },
  {
    path: '/class',
    name: 'old-class',
    component: () => import('../views/manage1/Class.vue')
  },
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
})

export default router
