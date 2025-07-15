import request from '@/utils/request';

export interface TeachingClass {
  id: number;
  class_id: number;
  course_id: number;
  semester_id: number;
  price_per_hour: number;
  class_name: string;
  course_name: string;
  semester_name: string;
  student_count: number;
  schedule_count: number;
  display_name: string;
}

export interface TeachingClassRequest {
  id?: number;
  class_id: number;
  course_id: number;
  semester_id: number;
  price_per_hour: number;
}

export interface EnrolledStudent {
  id: number;
  student_id: number;
  student_name: string;
  contact: string;
  discount_rate: number;
  enrolled_at: string;
}

export interface StudentInfo {
  id: number;
  name: string;
  contact: string;
  discount_rate: number;
}

export interface TeachingClassStudent {
  class_course_id: number;
  display_name: string;
  enrolled_students: EnrolledStudent[];
  available_students: StudentInfo[];
}

export interface BatchEnrollRequest {
  class_course_id: number;
  student_ids: number[];
}

export interface BatchUnenrollRequest {
  class_course_id: number;
  student_ids: number[];
}

// 获取教学班列表
export const getTeachingClasses = (semesterId?: number) => {
  const params = semesterId ? { semester_id: semesterId } : {};
  return request.get('/api/h1/teaching-class', { params });
};

// 创建教学班
export const createTeachingClass = (data: TeachingClassRequest) => {
  return request.post('/api/h1/teaching-class', data);
};

// 更新教学班
export const updateTeachingClass = (data: TeachingClassRequest) => {
  return request.put('/api/h1/teaching-class', data);
};

// 删除教学班
export const deleteTeachingClass = (id: number) => {
  return request.delete(`/api/h1/teaching-class/${id}`);
};

// 获取教学班学生信息
export const getTeachingClassStudents = (id: number) => {
  return request.get(`/api/h1/teaching-class/${id}/students`);
};

// 批量报名学生
export const batchEnrollStudents = (data: BatchEnrollRequest) => {
  return request.post('/api/h1/teaching-class/batch-enroll', data);
};

// 批量退课学生
export const batchUnenrollStudents = (data: BatchUnenrollRequest) => {
  return request.post('/api/h1/teaching-class/batch-unenroll', data);
}; 