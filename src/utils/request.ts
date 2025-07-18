import axios from 'axios'
import { message } from 'ant-design-vue'
import storageService from '@/service/storageService'

// 自动检测环境并设置API基础URL
function getApiBaseUrl(): string {
  const hostname = window.location.hostname;
  
  // 如果访问的是服务器IP，则使用服务器地址
  if (hostname === '118.25.157.30') {
    return 'http://118.25.157.30:9090';
  }
  
  // 如果是localhost或127.0.0.1，使用本地地址
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:9090';
  }
  
  // 默认使用相对路径（适用于前后端部署在同一域名下的情况）
  return '';
}

// 创建axios实例
const request = axios.create({
  baseURL: getApiBaseUrl(), // 自动检测环境的后端接口地址
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    // 从localStorage获取token
    const token = storageService.get(storageService.USER_TOKEN)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    const res = response.data
    
    // 后端返回的成功状态码
    if (res.code === 200 || response.status === 200) {
      return response
    } else {
      // 显示错误信息
      message.error(res.message || '请求失败')
      return Promise.reject(new Error(res.message || '请求失败'))
    }
  },
  (error) => {
    console.error('请求错误:', error)
    
    if (error.response) {
      const { status, data } = error.response
      
      switch (status) {
        case 401:
          message.error('未授权，请重新登录')
          // 清除token并跳转到登录页面
          storageService.set(storageService.USER_TOKEN, '')
          storageService.set(storageService.USER_INFO, '')
          window.location.href = '/login'
          break
        case 403:
          message.error('拒绝访问')
          break
        case 404:
          message.error('请求的资源不存在')
          break
        case 500:
          message.error('服务器内部错误')
          break
        default:
          message.error(data?.message || data?.msg || '请求失败')
      }
    } else if (error.request) {
      message.error('网络错误，请检查网络连接')
    } else {
      message.error('请求配置错误')
    }
    
    return Promise.reject(error)
  }
)

export default request