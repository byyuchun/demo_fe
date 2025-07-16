import { createApp } from 'vue'
import Antd from 'ant-design-vue'
import App from './App.vue'
import router from './router'
import store from './store'
import axios from 'axios'
import VueAxios from 'vue-axios'
import STable from '@surely-vue/table';
import 'ant-design-vue/dist/antd.css'

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

// 设置axios全局默认配置
axios.defaults.baseURL = getApiBaseUrl()
axios.defaults.timeout = 10000
axios.defaults.headers.common['Content-Type'] = 'application/json'

createApp(App).use(Antd).use(STable).use(store).use(router).use(VueAxios,axios).mount('#app')
