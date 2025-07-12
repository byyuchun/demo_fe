<template>
  <div class="dashboard">
    <a-row :gutter="16">
      <!-- 统计卡片 -->
      <a-col :span="6">
        <a-card>
          <a-statistic
            title="总学生数"
            :value="statistics.studentCount"
            :prefix="h(UserOutlined)"
            :value-style="{ color: '#1890ff' }"
          />
        </a-card>
      </a-col>
      
      <a-col :span="6">
        <a-card>
          <a-statistic
            title="总课程数"
            :value="statistics.courseCount"
            :prefix="h(BookOutlined)"
            :value-style="{ color: '#52c41a' }"
          />
        </a-card>
      </a-col>
      
      <a-col :span="6">
        <a-card>
          <a-statistic
            title="总班级数"
            :value="statistics.classCount"
            :prefix="h(TeamOutlined)"
            :value-style="{ color: '#722ed1' }"
          />
        </a-card>
      </a-col>
      
      <a-col :span="6">
        <a-card>
          <a-statistic
            title="本月收入"
            :value="statistics.monthlyIncome"
            prefix="¥"
            :value-style="{ color: '#f5222d' }"
          />
        </a-card>
      </a-col>
    </a-row>
    
    <a-row :gutter="16" style="margin-top: 16px">
      <!-- 图表区域 -->
      <a-col :span="12">
        <a-card title="出勤率趋势">
          <div ref="attendanceChart" style="height: 300px"></div>
        </a-card>
      </a-col>
      
      <a-col :span="12">
        <a-card title="收入趋势">
          <div ref="incomeChart" style="height: 300px"></div>
        </a-card>
      </a-col>
    </a-row>
    
    <a-row :gutter="16" style="margin-top: 16px">
      <!-- 最新报名 -->
      <a-col :span="12">
        <a-card title="最新报名">
          <a-list
            :data-source="recentEnrollments"
            size="small"
          >
            <template #renderItem="{ item }">
              <a-list-item>
                <a-list-item-meta>
                  <template #title>{{ item.studentName }}</template>
                  <template #description>{{ item.className }} - {{ item.courseName }}</template>
                </a-list-item-meta>
                <div>{{ formatDate(item.enrolledAt) }}</div>
              </a-list-item>
            </template>
          </a-list>
        </a-card>
      </a-col>
      
      <!-- 待处理事项 -->
      <a-col :span="12">
        <a-card title="待处理事项">
          <a-list
            :data-source="pendingTasks"
            size="small"
          >
            <template #renderItem="{ item }">
              <a-list-item>
                <a-list-item-meta>
                  <template #title>{{ item.title }}</template>
                  <template #description>{{ item.description }}</template>
                </a-list-item-meta>
                <a-badge :count="item.count" :number-style="{ backgroundColor: '#f50' }" />
              </a-list-item>
            </template>
          </a-list>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, h } from 'vue';
import { UserOutlined, BookOutlined, TeamOutlined } from '@ant-design/icons-vue';
import * as echarts from 'echarts';
import { statisticsApi } from '@/api/admin';

export default defineComponent({
  setup() {
    const attendanceChart = ref();
    const incomeChart = ref();
    
    // 统计数据
    const statistics = ref({
      studentCount: 0,
      courseCount: 0,
      classCount: 0,
      monthlyIncome: 0,
    });
    
    // 最新报名
    const recentEnrollments = ref([
      {
        studentName: '张三',
        className: '高一A班',
        courseName: '数学',
        enrolledAt: new Date(),
      },
      {
        studentName: '李四',
        className: '高一B班',
        courseName: '物理',
        enrolledAt: new Date(),
      },
      {
        studentName: '王五',
        className: '高二A班',
        courseName: '化学',
        enrolledAt: new Date(),
      },
    ]);
    
    // 待处理事项
    const pendingTasks = ref([
      {
        title: '未结算账单',
        description: '需要处理的学生账单',
        count: 5,
      },
      {
        title: '缺勤记录',
        description: '需要跟进的缺勤学生',
        count: 3,
      },
      {
        title: '补课申请',
        description: '待审批的补课申请',
        count: 2,
      },
    ]);
    
    // 格式化日期
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('zh-CN');
    };
    
    // 初始化图表
    const initCharts = () => {
      // 出勤率趋势图
      const attendanceChartInstance = echarts.init(attendanceChart.value);
      attendanceChartInstance.setOption({
        title: {
          text: '出勤率(%)',
          left: 'center',
          textStyle: {
            fontSize: 14,
          },
        },
        tooltip: {
          trigger: 'axis',
        },
        xAxis: {
          type: 'category',
          data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
        },
        yAxis: {
          type: 'value',
          min: 0,
          max: 100,
        },
        series: [
          {
            data: [95, 92, 88, 94, 90, 96, 89],
            type: 'line',
            smooth: true,
            areaStyle: {
              opacity: 0.3,
            },
          },
        ],
      });
      
      // 收入趋势图
      const incomeChartInstance = echarts.init(incomeChart.value);
      incomeChartInstance.setOption({
        title: {
          text: '收入(元)',
          left: 'center',
          textStyle: {
            fontSize: 14,
          },
        },
        tooltip: {
          trigger: 'axis',
        },
        xAxis: {
          type: 'category',
          data: ['1月', '2月', '3月', '4月', '5月', '6月'],
        },
        yAxis: {
          type: 'value',
        },
        series: [
          {
            data: [15000, 18000, 22000, 25000, 28000, 32000],
            type: 'bar',
            itemStyle: {
              color: '#1890ff',
            },
          },
        ],
      });
    };
    
    // 加载统计数据
    const loadStatistics = async () => {
      try {
        const data = await statisticsApi.getOverview();
        statistics.value = {
          studentCount: data.studentCount,
          courseCount: data.courseCount,
          classCount: data.classCount,
          monthlyIncome: data.monthlyIncome,
        };
      } catch (error) {
        console.error('加载统计数据失败:', error);
        // 保持默认值
        statistics.value = {
          studentCount: 0,
          courseCount: 0,
          classCount: 0,
          monthlyIncome: 0,
        };
      }
    };
    
    onMounted(() => {
      loadStatistics();
      initCharts();
    });
    
    return {
      h,
      statistics,
      recentEnrollments,
      pendingTasks,
      attendanceChart,
      incomeChart,
      formatDate,
      UserOutlined,
      BookOutlined,
      TeamOutlined,
    };
  },
});
</script>

<style scoped>
.dashboard {
  padding: 20px;
}

.ant-card {
  margin-bottom: 16px;
}

.ant-statistic {
  text-align: center;
}
</style> 