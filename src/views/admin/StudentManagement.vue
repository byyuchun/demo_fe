<template>
  <div class="student-management">
    <div class="page-header">
      <a-row justify="space-between" align="middle">
        <a-col>
          <h2>学生管理</h2>
        </a-col>
        <a-col>
          <a-space>
            <a-input-search
                v-model:value="searchKeyword"
                placeholder="搜索学生姓名或联系方式"
                style="width: 300px"
                @search="handleSearch"
            />
            <a-button type="primary" @click="showCreateModal">
              <template #icon><PlusOutlined /></template>
              添加学生
            </a-button>
          </a-space>
        </a-col>
      </a-row>
    </div>

    <a-card>
      <a-table
          :columns="columns"
          :data-source="students"
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
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'discountRate'">
            <a-tag :color="getDiscountColor(record.discountRate)">
              {{ (record.discountRate * 100).toFixed(0) }}%
            </a-tag>
          </template>
          <template v-else-if="column.key === 'action'">
            <a-space>
              <a-button size="small" @click="showEditModal(record)">
                <template #icon><EditOutlined /></template>
                编辑
              </a-button>
              <a-popconfirm
                  title="确定删除这个学生吗？"
                  ok-text="确定"
                  cancel-text="取消"
                  @confirm="deleteStudent(record.id)"
              >
                <a-button size="small" danger>
                  <template #icon><DeleteOutlined /></template>
                  删除
                </a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 创建/编辑学生的模态框 -->
    <a-modal
        v-model:visible="modalVisible"
        :title="modalTitle"
        @ok="handleSubmit"
        @cancel="handleCancel"
        :confirm-loading="confirmLoading"
    >
      <a-form
          ref="formRef"
          :model="formData"
          :rules="rules"
          layout="vertical"
      >
        <a-form-item label="学生姓名" name="name">
          <a-input v-model:value="formData.name" placeholder="请输入学生姓名" />
        </a-form-item>

        <a-form-item label="联系方式" name="contact">
          <a-input v-model:value="formData.contact" placeholder="请输入联系方式" />
        </a-form-item>

        <a-form-item label="折扣" name="discountRate">
          <a-input-number
              v-model:value="formData.discountRate"
              :min="0.1"
              :max="1"
              :step="0.1"
              :precision="2"
              placeholder="折扣"
              style="width: 100%"
          />
          <div class="form-help">1.0 表示无优惠，0.8 表示8折优惠</div>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, reactive, computed } from 'vue';
import { message } from 'ant-design-vue';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons-vue';
import { studentApi } from '@/api/admin';

interface Student {
  id: number;
  name: string;
  contact: string;
  discountRate: number;
}

export default defineComponent({
  components: {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
  },
  setup() {
    const loading = ref(false);
    const modalVisible = ref(false);
    const confirmLoading = ref(false);
    const isEdit = ref(false);
    const formRef = ref();
    const searchKeyword = ref('');

    const students = ref<Student[]>([]);
    const pagination = reactive({
      current: 1,
      pageSize: 10,
      total: 0,
    });

    const formData = reactive({
      id: undefined,
      name: '',
      contact: '',
      discountRate: 1.0,
    });

    const columns = [
      { title: '学生姓名', dataIndex: 'name', key: 'name' },
      { title: '联系方式', dataIndex: 'contact', key: 'contact' },
      { title: '折扣', dataIndex: 'discountRate', key: 'discountRate', width: 100 },
      { title: '操作', key: 'action', width: 200 },
    ];

    const rules = {
      name: [{ required: true, message: '请输入学生姓名', trigger: 'blur' }],
      // contact 不再必填
      discountRate: [{ required: true, message: '请输入折扣', trigger: 'blur' }],
    };

    const modalTitle = computed(() => isEdit.value ? '编辑学生' : '添加学生');

    const getDiscountColor = (rate: number) => {
      if (rate >= 1) return 'default';
      if (rate >= 0.8) return 'green';
      if (rate >= 0.6) return 'orange';
      return 'red';
    };

    const loadStudents = async () => {
      loading.value = true;
      try {
        const res = await studentApi.getAll({ keyword: searchKeyword.value });
        const data = res.data?.data || [];
        students.value = data.map((s: any) => ({
          id: s.id,
          name: s.name,
          contact: s.contact,
          discountRate: s.discount_rate ?? 1,
        }));
        pagination.total = students.value.length;
      } catch (e: any) {
        message.error('加载学生列表失败');
        students.value = [];
        pagination.total = 0;
      } finally {
        loading.value = false;
      }
    };

    const handleSearch = () => {
      pagination.current = 1;
      loadStudents();
    };

    const showCreateModal = () => {
      isEdit.value = false;
      resetForm();
      modalVisible.value = true;
    };

    const showEditModal = (record: Student) => {
      isEdit.value = true;
      formData.id = record.id;
      formData.name = record.name;
      formData.contact = record.contact;
      formData.discountRate = record.discountRate ?? 1.0;
      modalVisible.value = true;
    };

    const resetForm = () => {
      formData.id = undefined;
      formData.name = '';
      formData.contact = '';
      formData.discountRate = 1.0;
      formRef.value?.clearValidate();
    };

    const handleSubmit = async () => {
      await formRef.value.validate();
      confirmLoading.value = true;
      try {
        if (isEdit.value) {
          await studentApi.update({
            id: formData.id!,
            name: formData.name,
            contact: formData.contact,
            discount_rate: formData.discountRate,
          });
          message.success('更新成功');
        } else {
          await studentApi.create({
            name: formData.name,
            contact: formData.contact,
            discount_rate: formData.discountRate,
          });
          message.success('创建成功');
        }
        modalVisible.value = false;
        loadStudents();
      } catch (e: any) {
        message.error('操作失败');
      } finally {
        confirmLoading.value = false;
      }
    };

    const handleCancel = () => {
      modalVisible.value = false;
      resetForm();
    };

    const deleteStudent = async (id: number) => {
      try {
        await studentApi.delete(id);
        message.success('删除成功');
        loadStudents();
      } catch (e: any) {
        message.error('删除失败');
      }
    };

    const handleTableChange = (pag: any) => {
      pagination.current = pag.current;
      pagination.pageSize = pag.pageSize;
      loadStudents();
    };

    onMounted(() => loadStudents());

    return {
      loading,
      modalVisible,
      confirmLoading,
      isEdit,
      formRef,
      searchKeyword,
      students,
      pagination,
      formData,
      columns,
      rules,
      modalTitle,
      getDiscountColor,
      handleSearch,
      showCreateModal,
      showEditModal,
      handleSubmit,
      handleCancel,
      deleteStudent,
      handleTableChange,
    };
  },
});
</script>

<style scoped>
.student-management {
  padding: 20px;
}
.page-header { margin-bottom: 20px; }
.page-header h2 { margin: 0; color: #1890ff; }
.form-help { color: #999; font-size: 12px; margin-top: 4px; }
</style>
