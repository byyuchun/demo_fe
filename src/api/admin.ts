import request from '@/utils/request'

// 学生管理接口
export const studentApi = {
  // 获取所有学生
  // getAll: () => request.get('/api/h1/student'),

  // 获取所有学生（支持搜索）
  getAll: (params?: { keyword?: string }) =>
      request.get('/api/h1/student', { params }),


  // 获取单个学生
  getById: (id: number) => request.get(`/api/h1/student/${id}`),
  
  // 创建学生
  create: (data: { name: string; contact: string; discount_rate: number }) => 
    request.post('/api/h1/student', data),
  
  // 更新学生
  update: (data: { id: number; name?: string; contact?: string; discount_rate?: number }) => 
    request.put('/api/h1/student', data),
  
  // 删除学生
  delete: (id: number) => request.delete(`/api/h1/student/${id}`)
}

// 学期管理接口
export const semesterApi = {
  // 获取所有学期
  getAll: () => request.get('/api/h1/semester'),
  
  // 获取单个学期
  getById: (id: number) => request.get(`/api/h1/semester/${id}`),
  
  // 创建学期
  create: (data: { name: string; start_date: string; end_date: string }) => 
    request.post('/api/h1/semester', data),
  
  // 更新学期
  update: (data: { id: number; name?: string; start_date?: string; end_date?: string }) => 
    request.put('/api/h1/semester', data),
  
  // 删除学期
  delete: (id: number) => request.delete(`/api/h1/semester/${id}`)
}

// 课程管理接口
export const courseApi = {
  // 获取所有课程
  getAll: () => request.get('/api/h1/course'),
  
  // 获取单个课程
  getById: (id: number) => request.get(`/api/h1/course/${id}`),
  
  // 创建课程
  create: (data: { name: string }) => 
    request.post('/api/h1/course', data),
  
  // 更新课程
  update: (data: { id: number; name?: string }) => 
    request.put('/api/h1/course', data),
  
  // 删除课程
  delete: (id: number) => request.delete(`/api/h1/course/${id}`)
}

// 班级管理接口
export const classApi = {
  // 获取所有班级
  getAll: () => request.get('/api/h1/class'),
  
  // 获取单个班级
  getById: (id: number) => request.get(`/api/h1/class/${id}`),
  
  // 创建班级
  create: (data: { name: string; semester_id: number }) => 
    request.post('/api/h1/class', data),
  
  // 更新班级
  update: (data: { id: number; name?: string; semester_id?: number }) => 
    request.put('/api/h1/class', data),
  
  // 删除班级
  delete: (id: number) => request.delete(`/api/h1/class/${id}`),

  // 获取班级及学期信息
  getWithSemester: (semester_id?: number) => 
    request.get('/api/h1/class/with-semester', { params: { semester_id } }),

  // 获取班级的课程列表
  getClassCourses: (class_id: number) => 
    request.get(`/api/h1/class/${class_id}/courses`)
}

// 班级课程关系接口
export const classCourseApi = {
  // 获取所有班级课程关系
  getAll: () => request.get('/api/h1/class-course'),
  
  // 获取单个班级课程关系
  getById: (id: number) => request.get(`/api/h1/class-course/${id}`),
  
  // 创建班级课程关系
  create: (data: { class_id: number; course_id: number; semester_id: number; price_per_hour: number }) => 
    request.post('/api/h1/class-course', data),
  
  // 更新班级课程关系
  update: (data: { id: number; class_id?: number; course_id?: number; semester_id?: number; price_per_hour?: number }) => 
    request.put('/api/h1/class-course', data),
  
  // 删除班级课程关系
  delete: (id: number) => request.delete(`/api/h1/class-course/${id}`)
}

// 报名管理接口
export const enrollmentApi = {
  // 获取所有报名记录
  getAll: () => request.get('/api/h1/enrollment'),
  
  // 获取单个报名记录
  getById: (id: number) => request.get(`/api/h1/enrollment/${id}`),
  
  // 创建报名记录
  create: (data: { student_id: number; class_course_id: number }) => 
    request.post('/api/h1/enrollment', data),
  
  // 更新报名记录
  update: (data: { id: number; student_id?: number; class_course_id?: number; enrolled_at?: string }) => 
    request.put('/api/h1/enrollment', data),
  
  // 删除报名记录
  delete: (id: number) => request.delete(`/api/h1/enrollment/${id}`),

  // 获取报名详情列表
  getWithDetail: (params?: { student_id?: number; semester_id?: number; class_course_id?: number; student_name?: string }) => 
    request.get('/api/h1/enrollment/with-detail', { params }),

  // 学生报名
  enroll: (data: { student_id: number; class_course_id: number }) => 
    request.post('/api/h1/enrollment/enroll', data),

  // 获取学生的报名记录
  getStudentEnrollments: (student_id: number) => 
    request.get(`/api/h1/enrollment/student/${student_id}`)
}

// 课程表管理接口
export const scheduleApi = {
  // 获取所有课程表
  getAll: () => request.get('/api/h1/schedule'),
  
  // 获取单个课程表
  getById: (id: number) => request.get(`/api/h1/schedule/${id}`),
  
  // 创建课程表
  create: (data: { class_course_id: number; date: string; start_time: string; end_time: string }) => 
    request.post('/api/h1/schedule', data),
  
  // 更新课程表
  update: (data: { id: number; class_course_id?: number; date?: string; start_time?: string; end_time?: string }) => 
    request.put('/api/h1/schedule', data),
  
  // 删除课程表
  delete: (id: number) => request.delete(`/api/h1/schedule/${id}`),

  // 获取课表详情列表
  getWithDetail: (params?: { class_course_id?: number; date?: string; start_date?: string; end_date?: string }) => 
    request.get('/api/h1/schedule/with-detail', { params }),

  // 批量创建课表
  createBatch: (data: { 
    class_course_id: number; 
    start_date: string; 
    end_date: string; 
    week_days: number[]; 
    start_hour: number; 
    start_minute: number; 
    end_hour: number; 
    end_minute: number; 
  }) => request.post('/api/h1/schedule/batch', data),

  // 获取今日课表
  getToday: () => request.get('/api/h1/schedule/today'),

  // 获取学生的课表
  getStudentSchedules: (student_id: number, start_date?: string, end_date?: string) => 
    request.get('/api/h1/schedule/student', { params: { student_id, start_date, end_date } })
}

// 考勤管理接口
export const attendanceApi = {
  // 获取所有考勤记录
  getAll: () => request.get('/api/h1/attendance'),
  
  // 获取单个考勤记录
  getById: (id: number) => request.get(`/api/h1/attendance/${id}`),
  
  // 创建考勤记录
  create: (data: { schedule_id: number; student_id: number; status: string; makeup_schedule_id?: number }) => 
    request.post('/api/h1/attendance', data),
  
  // 更新考勤记录
  update: (data: { id: number; schedule_id?: number; student_id?: number; checked_at?: string; status?: string; makeup_schedule_id?: number }) => 
    request.put('/api/h1/attendance', data),
  
  // 删除考勤记录
  delete: (id: number) => request.delete(`/api/h1/attendance/${id}`),

  // 学生打卡
  checkIn: (data: { schedule_id: number; student_id: number }) => 
    request.post('/api/h1/attendance/check-in', data),

  // 申请补签
  applyMakeup: (data: { original_schedule_id: number; makeup_schedule_id: number; student_id: number }) => 
    request.post('/api/h1/attendance/apply-makeup', data),

  // 获取学生出勤记录
  getStudentAttendance: (student_id: number, semester_id?: number) => 
    request.get('/api/h1/attendance/student', { params: { student_id, semester_id } }),

  // 标记缺勤
  markAbsent: (data: { schedule_id: number; student_id: number; status: string }) => 
    request.post('/api/h1/attendance/mark-absent', data)
}

// 账单管理接口
export const billApi = {
  // 获取所有账单
  getAll: () => request.get('/api/h1/student-semester-bill'),
  
  // 获取单个账单
  getById: (id: number) => request.get(`/api/h1/student-semester-bill/${id}`),
  
  // 创建账单
  create: (data: { 
    student_id: number; 
    semester_id: number; 
    total_fee: number; 
    status?: string;
  }) => request.post('/api/h1/student-semester-bill', data),
  
  // 更新账单
  update: (data: { 
    id: number; 
    student_id?: number; 
    semester_id?: number; 
    total_fee?: number; 
    finalized_at?: string;
    status?: string;
  }) => request.put('/api/h1/student-semester-bill', data),
  
  // 删除账单
  delete: (id: number) => request.delete(`/api/h1/student-semester-bill/${id}`),

  // 生成学期账单
  generate: (data: { student_id: number; semester_id: number }) => 
    request.post('/api/h1/student-semester-bill/generate', data),

  // 获取账单详情
  getDetail: (student_id: number, semester_id: number) => 
    request.get('/api/h1/student-semester-bill/detail', { params: { student_id, semester_id } }),

  // 支付账单
  pay: (data: { student_id: number; semester_id: number }) => 
    request.post('/api/h1/student-semester-bill/pay', data),

  // 获取所有账单详情
  getAllWithDetail: (semester_id?: number) => 
    request.get('/api/h1/student-semester-bill/all-with-detail', { params: { semester_id } })
}

// 统计接口
export const statisticsApi = {
  // 获取总体统计数据
  getOverview: async () => {
    const [studentsRes, coursesRes, classesRes, billsRes] = await Promise.all([
      studentApi.getAll(),
      courseApi.getAll(),
      classApi.getAll(),
      billApi.getAllWithDetail()
    ])
    
    const students = studentsRes.data?.data || []
    const courses = coursesRes.data?.data || []
    const classes = classesRes.data?.data || []
    const bills = billsRes.data?.data || []
    
    // 计算本月收入
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    
    const monthlyIncome = bills
      .filter(bill => {
        if (bill.finalized_at) {
          const paymentDate = new Date(bill.finalized_at)
          return paymentDate.getMonth() === currentMonth && 
                 paymentDate.getFullYear() === currentYear &&
                 bill.status === '已结算'
        }
        return false
      })
      .reduce((total, bill) => total + (bill.total_fee || 0), 0)
    
    return {
      studentCount: students.length,
      courseCount: courses.length,
      classCount: classes.length,
      monthlyIncome: monthlyIncome
    }
  }
} 