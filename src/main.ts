import { createApp } from 'vue'
import Antd from 'ant-design-vue'
import App from './App.vue'
import router from './router'
import store from './store'
import axios from 'axios'
import VueAxios from 'vue-axios'
import STable from '@surely-vue/table';
import 'ant-design-vue/dist/antd.css'

// 设置axios全局默认配置
axios.defaults.baseURL = 'http://localhost:9090'
axios.defaults.timeout = 10000
axios.defaults.headers.common['Content-Type'] = 'application/json'

createApp(App).use(Antd).use(STable).use(store).use(router).use(VueAxios,axios).mount('#app')
