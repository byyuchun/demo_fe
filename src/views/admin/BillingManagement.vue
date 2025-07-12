<template>
  <div class="billing-management">
    <div class="page-header">
      <a-row justify="space-between" align="middle">
        <a-col>
          <h2>账单统计 & 收费</h2>
        </a-col>
        <a-col>
          <a-space>
            <a-select
              v-model:value="selectedStatus"
              placeholder="选择状态"
              style="width: 120px"
              @change="handleStatusChange"
            >
              <a-select-option value="">全部状态</a-select-option>
              <a-select-option value="未结算">未结算</a-select-option>
              <a-select-option value="已结算">已结算</a-select-option>
              <a-select-option value="部分结算">部分结算</a-select-option>
            </a-select>
            <a-select
              v-model:value="selectedSemester"
              placeholder="选择学期"
              style="width: 200px"
              @change="handleSemesterChange"
            >
              <a-select-option value="">全部学期</a-select-option>
              <a-select-option v-for="semester in semesters" :key="semester.id" :value="semester.id">
                {{ semester.name }}
              </a-select-option>
            </a-select>
            <a-button type="primary" @click="generateBills">
              <template #icon><PlusCircleOutlined /></template>
              生成账单
            </a-button>
          </a-space>
        </a-col>
      </a-row>
    </div>

    <!-- 统计卡片 -->
    <a-row :gutter="16" style="margin-bottom: 20px">
      <a-col :span="6">
        <a-card>
          <a-statistic
            title="总收入"
            :value="statistics.totalIncome"
            prefix="¥"
            :value-style="{ color: '#52c41a' }"
          />
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card>
          <a-statistic
            title="未结算金额"
            :value="statistics.unpaidAmount"
            prefix="¥"
            :value-style="{ color: '#f5222d' }"
          />
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card>
          <a-statistic
            title="本月收入"
            :value="statistics.monthlyIncome"
            prefix="¥"
            :value-style="{ color: '#1890ff' }"
          />
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card>
          <a-statistic
            title="账单总数"
            :value="statistics.totalBills"
            :value-style="{ color: '#722ed1' }"
          />
        </a-card>
      </a-col>
    </a-row>

    <a-card>
      <a-table
        :columns="columns"
        :data-source="bills"
        :loading="loading"
        row-key="id"
        :pagination="{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          showQuickJumper: true,
          onChange: handleTableChange,
        }"
        :row-selection="{
          selectedRowKeys: selectedRowKeys,
          onChange: onSelectChange,
        }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'totalFee'">
            <span class="fee-amount">¥{{ record.totalFee.toFixed(2) }}</span>
          </template>
          <template v-else-if="column.key === 'discountAmount'">
            <span v-if="record.discountAmount > 0" class="discount-amount">
              -¥{{ record.discountAmount.toFixed(2) }}
            </span>
            <span v-else>-</span>
          </template>
          <template v-else-if="column.key === 'finalAmount'">
            <span class="final-amount">¥{{ record.finalAmount.toFixed(2) }}</span>
          </template>
          <template v-else-if="column.key === 'status'">
            <a-tag :color="getStatusColor(record.status)">
              {{ record.status }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'finalizedAt'">
            {{ formatDate(record.finalizedAt) }}
          </template>
          <template v-else-if="column.key === 'action'">
            <a-space>
              <a-button size="small" @click="viewBillDetail(record)">
                <template #icon><EyeOutlined /></template>
                查看详情
              </a-button>
              <a-button 
                v-if="record.status === '未结算'" 
                size="small" 
                type="primary"
                @click="showPaymentModal(record)"
              >
                <template #icon><DollarCircleOutlined /></template>
                收费
              </a-button>
              <a-button
                v-if="record.status === '已结算'"
                size="small"
                @click="showReceiptModal(record)"
              >
                <template #icon><FileTextOutlined /></template>
                收据
              </a-button>
            </a-space>
          </template>
        </template>
      </a-table>
      
      <!-- 批量操作 -->
      <div v-if="selectedRowKeys.length > 0" class="batch-actions">
        <a-space>
          <span>已选择 {{ selectedRowKeys.length }} 项</span>
          <a-button type="primary" @click="batchPayment">
            批量收费
          </a-button>
          <a-button @click="clearSelection">
            清空选择
          </a-button>
        </a-space>
      </div>
    </a-card>

    <!-- 收费模态框 -->
    <a-modal
      v-model:open="paymentModalVisible"
      title="学生收费"
      @ok="handlePaymentSubmit"
      @cancel="handlePaymentCancel"
      :confirm-loading="paymentConfirmLoading"
      width="600px"
    >
      <div v-if="currentBill">
        <a-descriptions :column="2" bordered style="margin-bottom: 16px">
          <a-descriptions-item label="学生姓名">{{ currentBill.studentName }}</a-descriptions-item>
          <a-descriptions-item label="学期">{{ currentBill.semesterName }}</a-descriptions-item>
          <a-descriptions-item label="原价">¥{{ currentBill.totalFee.toFixed(2) }}</a-descriptions-item>
          <a-descriptions-item label="优惠金额">¥{{ currentBill.discountAmount.toFixed(2) }}</a-descriptions-item>
          <a-descriptions-item label="应收金额" :span="2">
            <span class="final-amount">¥{{ currentBill.finalAmount.toFixed(2) }}</span>
          </a-descriptions-item>
        </a-descriptions>
        
        <a-form
          ref="paymentFormRef"
          :model="paymentFormData"
          :rules="paymentRules"
          layout="vertical"
        >
          <a-form-item label="收费金额" name="amount">
            <a-input-number
              v-model:value="paymentFormData.amount"
              :min="0"
              :max="currentBill.finalAmount"
              :precision="2"
              placeholder="请输入收费金额"
              style="width: 100%"
            />
          </a-form-item>
          
          <a-form-item label="收费方式" name="paymentMethod">
            <a-select
              v-model:value="paymentFormData.paymentMethod"
              placeholder="请选择收费方式"
              style="width: 100%"
            >
              <a-select-option value="现金">现金</a-select-option>
              <a-select-option value="微信">微信</a-select-option>
              <a-select-option value="支付宝">支付宝</a-select-option>
              <a-select-option value="银行卡">银行卡</a-select-option>
            </a-select>
          </a-form-item>
          
          <a-form-item label="备注">
            <a-textarea 
              v-model:value="paymentFormData.remark" 
              placeholder="收费备注信息"
              :rows="3"
            />
          </a-form-item>
        </a-form>
      </div>
    </a-modal>

    <!-- 账单详情模态框 -->
    <a-modal
      v-model:open="billDetailModalVisible"
      title="账单详情"
      @cancel="handleBillDetailCancel"
      :footer="null"
      width="800px"
    >
      <div v-if="billDetail">
        <a-descriptions :column="2" bordered style="margin-bottom: 16px">
          <a-descriptions-item label="学生姓名">{{ billDetail.studentName }}</a-descriptions-item>
          <a-descriptions-item label="学期">{{ billDetail.semesterName }}</a-descriptions-item>
          <a-descriptions-item label="生成时间">{{ formatDate(billDetail.finalizedAt) }}</a-descriptions-item>
          <a-descriptions-item label="状态">
            <a-tag :color="getStatusColor(billDetail.status)">{{ billDetail.status }}</a-tag>
          </a-descriptions-item>
        </a-descriptions>
        
        <h4>课程明细</h4>
        <a-table
          :columns="detailColumns"
          :data-source="billDetail.items"
          :pagination="false"
          size="small"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'amount'">
              ¥{{ record.amount.toFixed(2) }}
            </template>
          </template>
        </a-table>
        
        <div class="bill-summary">
          <a-row>
            <a-col :span="18"></a-col>
            <a-col :span="6">
              <div class="summary-item">
                <span>小计: ¥{{ billDetail.totalFee.toFixed(2) }}</span>
              </div>
              <div class="summary-item">
                <span>优惠: -¥{{ billDetail.discountAmount.toFixed(2) }}</span>
              </div>
              <div class="summary-item total">
                <span>合计: ¥{{ billDetail.finalAmount.toFixed(2) }}</span>
              </div>
            </a-col>
          </a-row>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, reactive } from 'vue';
import { message } from 'ant-design-vue';
import { 
  PlusCircleOutlined, 
  EyeOutlined, 
  DollarCircleOutlined, 
  FileTextOutlined 
} from '@ant-design/icons-vue';
import request from '@/utils/request';
import moment from 'moment';

interface Bill {
  id: number;
  studentId: number;
  studentName: string;
  semesterId: number;
  semesterName: string;
  totalFee: number;
  discountAmount: number;
  finalAmount: number;
  status: string;
  finalizedAt: string;
}

interface Semester {
  id: number;
  name: string;
}

export default defineComponent({
  components: {
    PlusCircleOutlined,
    EyeOutlined,
    DollarCircleOutlined,
    FileTextOutlined,
  },
  setup() {
    const loading = ref(false);
    const paymentModalVisible = ref(false);
    const billDetailModalVisible = ref(false);
    const paymentConfirmLoading = ref(false);
    const paymentFormRef = ref();
    const selectedStatus = ref('');
    const selectedSemester = ref('');
    const selectedRowKeys = ref<number[]>([]);
    
    const bills = ref<Bill[]>([]);
    const semesters = ref<Semester[]>([]);
    const currentBill = ref<Bill | null>(null);
    const billDetail = ref(null);
    
    const statistics = ref({
      totalIncome: 0,
      unpaidAmount: 0,
      monthlyIncome: 0,
      totalBills: 0,
    });
    
    const pagination = reactive({
      current: 1,
      pageSize: 10,
      total: 0,
    });
    
    const paymentFormData = reactive({
      amount: 0,
      paymentMethod: '',
      remark: '',
    });
    
    // 表格列定义
    const columns = [
      {
        title: '学生姓名',
        dataIndex: 'studentName',
        key: 'studentName',
      },
      {
        title: '学期',
        dataIndex: 'semesterName',
        key: 'semesterName',
      },
      {
        title: '总费用',
        dataIndex: 'totalFee',
        key: 'totalFee',
      },
      {
        title: '优惠金额',
        dataIndex: 'discountAmount',
        key: 'discountAmount',
      },
      {
        title: '应收金额',
        dataIndex: 'finalAmount',
        key: 'finalAmount',
      },
      {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        width: 100,
      },
      {
        title: '生成时间',
        dataIndex: 'finalizedAt',
        key: 'finalizedAt',
      },
      {
        title: '操作',
        key: 'action',
        width: 200,
      },
    ];
    
    const detailColumns = [
      {
        title: '课程名称',
        dataIndex: 'courseName',
        key: 'courseName',
      },
      {
        title: '课时数',
        dataIndex: 'hours',
        key: 'hours',
      },
      {
        title: '单价',
        dataIndex: 'pricePerHour',
        key: 'pricePerHour',
      },
      {
        title: '金额',
        dataIndex: 'amount',
        key: 'amount',
      },
    ];
    
    // 表单验证规则
    const paymentRules = {
      amount: [
        { required: true, message: '请输入收费金额', trigger: 'blur' },
      ],
      paymentMethod: [
        { required: true, message: '请选择收费方式', trigger: 'change' },
      ],
    };
    
    // 获取状态颜色
    const getStatusColor = (status: string) => {
      switch (status) {
        case '已结算':
          return 'green';
        case '未结算':
          return 'red';
        case '部分结算':
          return 'orange';
        default:
          return 'default';
      }
    };
    
    // 格式化日期
    const formatDate = (date: string) => {
      return moment(date).format('YYYY-MM-DD');
    };
    
    // 加载数据
    const loadData = async () => {
      await Promise.all([
        loadBills(),
        loadSemesters(),
        loadStatistics(),
      ]);
    };
    
    // 加载账单列表
    const loadBills = async () => {
      loading.value = true;
      try {
        const response = await request.get('/api/h1/student-semester-bill', {
          params: {
            page: pagination.current,
            pageSize: pagination.pageSize,
            status: selectedStatus.value || undefined,
            semesterId: selectedSemester.value || undefined,
          },
        });
        bills.value = response.data.data || [];
        pagination.total = response.data.total || 0;
      } catch (error) {
        message.error('加载账单列表失败');
      } finally {
        loading.value = false;
      }
    };
    
    // 加载学期列表
    const loadSemesters = async () => {
      try {
        const response = await request.get('/api/h1/semester');
        semesters.value = response.data.data || [];
      } catch (error) {
        message.error('加载学期列表失败');
      }
    };
    
    // 加载统计数据
    const loadStatistics = async () => {
      try {
        const response = await request.get('/api/h1/student-semester-bill/statistics');
        statistics.value = response.data.data || {};
      } catch (error) {
        message.error('加载统计数据失败');
      }
    };
    
    // 状态变化处理
    const handleStatusChange = () => {
      pagination.current = 1;
      loadBills();
    };
    
    // 学期变化处理
    const handleSemesterChange = () => {
      pagination.current = 1;
      loadBills();
    };
    
    // 生成账单
    const generateBills = async () => {
      try {
        await request.post('/api/h1/student-semester-bill/generate');
        message.success('账单生成成功');
        loadBills();
        loadStatistics();
      } catch (error) {
        message.error('账单生成失败');
      }
    };
    
    // 查看账单详情
    const viewBillDetail = async (record: Bill) => {
      try {
        const response = await request.get(`/api/h1/student-semester-bill/${record.id}/detail`);
        billDetail.value = response.data.data;
        billDetailModalVisible.value = true;
      } catch (error) {
        message.error('加载账单详情失败');
      }
    };
    
    // 显示收费模态框
    const showPaymentModal = (record: Bill) => {
      currentBill.value = record;
      paymentFormData.amount = record.finalAmount;
      paymentFormData.paymentMethod = '';
      paymentFormData.remark = '';
      paymentModalVisible.value = true;
    };
    
    // 显示收据模态框
    const showReceiptModal = (record: Bill) => {
      message.info('收据打印功能待实现');
    };
    
    // 提交收费
    const handlePaymentSubmit = async () => {
      try {
        await paymentFormRef.value.validate();
        paymentConfirmLoading.value = true;
        
        await request.post(`/api/h1/student-semester-bill/${currentBill.value.id}/payment`, {
          amount: paymentFormData.amount,
          paymentMethod: paymentFormData.paymentMethod,
          remark: paymentFormData.remark,
        });
        
        message.success('收费成功');
        paymentModalVisible.value = false;
        loadBills();
        loadStatistics();
      } catch (error) {
        message.error('收费失败');
      } finally {
        paymentConfirmLoading.value = false;
      }
    };
    
    // 批量收费
    const batchPayment = async () => {
      try {
        await request.post('/api/h1/student-semester-bill/batch-payment', {
          billIds: selectedRowKeys.value,
        });
        message.success('批量收费成功');
        clearSelection();
        loadBills();
        loadStatistics();
      } catch (error) {
        message.error('批量收费失败');
      }
    };
    
    // 选择变化
    const onSelectChange = (keys: number[]) => {
      selectedRowKeys.value = keys;
    };
    
    // 清空选择
    const clearSelection = () => {
      selectedRowKeys.value = [];
    };
    
    // 取消操作
    const handlePaymentCancel = () => {
      paymentModalVisible.value = false;
      currentBill.value = null;
    };
    
    const handleBillDetailCancel = () => {
      billDetailModalVisible.value = false;
      billDetail.value = null;
    };
    
    // 处理表格变化
    const handleTableChange = (pag: any) => {
      pagination.current = pag.current;
      pagination.pageSize = pag.pageSize;
      loadBills();
    };
    
    onMounted(() => {
      loadData();
    });
    
    return {
      loading,
      paymentModalVisible,
      billDetailModalVisible,
      paymentConfirmLoading,
      paymentFormRef,
      selectedStatus,
      selectedSemester,
      selectedRowKeys,
      bills,
      semesters,
      currentBill,
      billDetail,
      statistics,
      pagination,
      paymentFormData,
      columns,
      detailColumns,
      paymentRules,
      getStatusColor,
      formatDate,
      handleStatusChange,
      handleSemesterChange,
      generateBills,
      viewBillDetail,
      showPaymentModal,
      showReceiptModal,
      handlePaymentSubmit,
      batchPayment,
      onSelectChange,
      clearSelection,
      handlePaymentCancel,
      handleBillDetailCancel,
      handleTableChange,
    };
  },
});
</script>

<style scoped>
.billing-management {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  color: #1890ff;
}

.fee-amount {
  font-weight: bold;
  color: #52c41a;
}

.discount-amount {
  color: #f5222d;
}

.final-amount {
  font-weight: bold;
  color: #1890ff;
  font-size: 16px;
}

.batch-actions {
  margin-top: 16px;
  padding: 16px;
  background: #f5f5f5;
  border-radius: 4px;
}

.bill-summary {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e8e8e8;
}

.summary-item {
  text-align: right;
  padding: 4px 0;
}

.summary-item.total {
  font-weight: bold;
  font-size: 16px;
  color: #1890ff;
  border-top: 1px solid #e8e8e8;
  margin-top: 8px;
  padding-top: 8px;
}
</style> 