import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TextInput, TouchableOpacity, Alert, FlatList, ActivityIndicator, Modal } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { fetchExpenses, createExpense, deleteExpense } from '../api/services';
import { getCurrentUser } from '../api/session';

interface ExpenseDetailInput {
  item_date: string;
  category: string;
  amount: string;
  description: string;
  invoice_url: string;
}

export default function ExpenseScreen() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'verified'>('all');

  // 新建报销状态
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState('日常报销');
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState<ExpenseDetailInput[]>([
    { item_date: new Date().toISOString().split('T')[0], category: '餐饮', amount: '', description: '', invoice_url: '' }
  ]);
  const [submitting, setSubmitting] = useState(false);

  // 查看详情状态
  const [selectedExpense, setSelectedExpense] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const loadData = async (userId: number) => {
    try {
      setLoading(true);
      const res = await fetchExpenses({ user_id: userId });
      setExpenses(res);
    } catch (err) {
      console.error('加载报销单失败:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
    if (user?.id) {
      loadData(user.id);
    } else {
      setLoading(false);
    }
  }, []);

  const handleAddDetailRow = () => {
    setDetails([
      ...details,
      { item_date: new Date().toISOString().split('T')[0], category: '交通', amount: '', description: '', invoice_url: '' }
    ]);
  };

  const handleRemoveDetailRow = (index: number) => {
    if (details.length === 1) {
      Alert.alert('提示', '请至少保留一条报销明细');
      return;
    }
    const updated = [...details];
    updated.splice(index, 1);
    setDetails(updated);
  };

  const handleUpdateDetailField = (index: number, field: keyof ExpenseDetailInput, val: string) => {
    const updated = [...details];
    updated[index] = { ...updated[index], [field]: val };
    setDetails(updated);
  };

  // 计算实时总金额
  const calculateTotalAmount = () => {
    return details.reduce((sum, item) => {
      const amt = parseFloat(item.amount);
      return sum + (isNaN(amt) ? 0 : amt);
    }, 0);
  };

  const handleSubmitExpense = async () => {
    if (!title.trim()) {
      Alert.alert('提示', '请输入报销单标题');
      return;
    }
    
    // 校验明细
    for (let i = 0; i < details.length; i++) {
      const item = details[i];
      if (!item.amount || isNaN(parseFloat(item.amount)) || parseFloat(item.amount) <= 0) {
        Alert.alert('提示', `第 ${i + 1} 项明细请输入有效的报销金额`);
        return;
      }
      if (!item.category) {
        Alert.alert('提示', `第 ${i + 1} 项明细请选择消费类别`);
        return;
      }
    }

    try {
      setSubmitting(true);
      const totalAmount = calculateTotalAmount();
      const payload = {
        user_id: currentUser.id,
        title,
        type,
        reason,
        total_amount: totalAmount,
        details: details.map(d => ({
          item_date: d.item_date,
          category: d.category,
          amount: parseFloat(d.amount),
          description: d.description,
          invoice_url: d.invoice_url
        }))
      };

      await createExpense(payload);
      Alert.alert('成功', '报销申请提交成功！');
      setShowCreateModal(false);
      // 重置表单
      setTitle('');
      setType('日常报销');
      setReason('');
      setDetails([
        { item_date: new Date().toISOString().split('T')[0], category: '餐饮', amount: '', description: '', invoice_url: '' }
      ]);
      // 重新加载列表
      await loadData(currentUser.id);
    } catch (err: any) {
      Alert.alert('错误', err.message || '系统服务出错，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExpense = async (id: number | string) => {
    Alert.alert('删除确认', '确定要删除此报销单吗？此操作无法撤销。', [
      { text: '取消', style: 'cancel' },
      {
        text: '确定',
        onPress: async () => {
          try {
            setLoading(true);
            await deleteExpense(id);
            Alert.alert('提示', '删除成功');
            setShowDetailModal(false);
            await loadData(currentUser.id);
          } catch (err: any) {
            Alert.alert('错误', err.message || '网络连接失败');
          } finally {
            setLoading(false);
          }
        }
      }
    ]);
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '待审批';
      case 'approved': return '已通过';
      case 'rejected': return '被驳回';
      case 'verified': return '已核销';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return { bg: '#fef3c7', text: '#d97706' };
      case 'approved': return { bg: '#dcfce7', text: '#16a34a' };
      case 'rejected': return { bg: '#fee2e2', text: '#ef4444' };
      case 'verified': return { bg: '#e0e7ff', text: '#4f46e5' };
      default: return { bg: '#f1f5f9', text: '#64748b' };
    }
  };

  const filteredExpenses = expenses.filter(e => {
    if (activeTab === 'all') return true;
    return e.status === activeTab;
  });

  const renderExpenseItem = ({ item }: { item: any }) => {
    const statusStyle = getStatusColor(item.status);
    const dateStr = new Date(item.create_time).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
    
    return (
      <TouchableOpacity 
        style={styles.expenseCard} 
        activeOpacity={0.7} 
        onPress={() => { setSelectedExpense(item); setShowDetailModal(true); }}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.statusText, { color: statusStyle.text }]}>{getStatusText(item.status)}</Text>
          </View>
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.cardType}>{item.type}</Text>
          <Text style={styles.cardAmount}>¥{parseFloat(item.total_amount).toFixed(2)}</Text>
        </View>
        <View style={styles.cardFooter}>
          <Feather name="clock" size={12} color="#94a3b8" />
          <Text style={styles.cardDate}>{dateStr} 发起</Text>
          {item.details && item.details.length > 0 && (
            <Text style={styles.cardDetailsCount}>{item.details.length}笔明细</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerIcon}>
          <Feather name="arrow-left" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>费用报销</Text>
        <TouchableOpacity style={styles.headerIcon} onPress={() => setShowCreateModal(true)}>
          <Feather name="plus" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {(['all', 'pending', 'approved', 'rejected', 'verified'] as const).map(tab => (
          <TouchableOpacity 
            key={tab} 
            style={[styles.tabItem, activeTab === tab && styles.tabItemActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'all' ? '全部' : getStatusText(tab)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#5a5ce5" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filteredExpenses}
          renderItem={renderExpenseItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Feather name="file-text" size={48} color="#cbd5e1" style={{ marginBottom: 12 }} />
              <Text style={styles.emptyText}>暂无相关报销单记录</Text>
            </View>
          }
        />
      )}

      {/* 新增报销单弹出层 */}
      <Modal visible={showCreateModal} animationType="slide" transparent={false}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCreateModal(false)} style={styles.modalCloseBtn}>
              <Feather name="x" size={24} color="#333333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>填写报销申请</Text>
            <TouchableOpacity onPress={handleSubmitExpense} disabled={submitting}>
              {submitting ? (
                <ActivityIndicator color="#5a5ce5" size="small" />
              ) : (
                <Text style={styles.modalSaveBtnText}>提交</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* 主表信息 */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>报销单标题</Text>
              <TextInput
                style={styles.formInput}
                placeholder="例如: 5月商务出差费用报销"
                placeholderTextColor="#94a3b8"
                value={title}
                onChangeText={setTitle}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>报销类型</Text>
              <View style={styles.typeSelectorRow}>
                {['日常报销', '差旅报销', '采购报销', '其它报销'].map(t => (
                  <TouchableOpacity 
                    key={t} 
                    style={[styles.typeBtn, type === t && styles.typeBtnActive]} 
                    onPress={() => setType(t)}
                  >
                    <Text style={[styles.typeBtnText, type === t && styles.typeBtnTextActive]}>{t.replace('报销','')}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>报销总说明</Text>
              <TextInput
                style={[styles.formInput, { height: 60, textAlignVertical: 'top' }]}
                placeholder="请输入相关的项目背景或差旅说明"
                placeholderTextColor="#94a3b8"
                multiline
                value={reason}
                onChangeText={setReason}
              />
            </View>

            {/* 子明细列表 */}
            <View style={styles.detailsHeaderRow}>
              <Text style={styles.detailsSectionTitle}>报销明细行</Text>
              <TouchableOpacity style={styles.addDetailBtn} onPress={handleAddDetailRow}>
                <Feather name="plus-circle" size={16} color="#5a5ce5" />
                <Text style={styles.addDetailBtnText}>增加行</Text>
              </TouchableOpacity>
            </View>

            {details.map((detail, idx) => (
              <View key={idx} style={styles.detailRowCard}>
                <View style={styles.detailRowHeader}>
                  <Text style={styles.detailRowIndex}>明细 #{idx + 1}</Text>
                  <TouchableOpacity onPress={() => handleRemoveDetailRow(idx)}>
                    <Feather name="trash-2" size={16} color="#ef4444" />
                  </TouchableOpacity>
                </View>

                <View style={styles.rowFormGrid}>
                  <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.formLabelSub}>发生日期</Text>
                    <TextInput
                      style={styles.formInputSub}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor="#94a3b8"
                      value={detail.item_date}
                      onChangeText={v => handleUpdateDetailField(idx, 'item_date', v)}
                    />
                  </View>

                  <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.formLabelSub}>分类</Text>
                    <TextInput
                      style={styles.formInputSub}
                      placeholder="餐饮/交通/住宿/其它"
                      placeholderTextColor="#94a3b8"
                      value={detail.category}
                      onChangeText={v => handleUpdateDetailField(idx, 'category', v)}
                    />
                  </View>
                </View>

                <View style={styles.rowFormGrid}>
                  <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.formLabelSub}>金额 (元)</Text>
                    <TextInput
                      style={styles.formInputSub}
                      placeholder="0.00"
                      placeholderTextColor="#94a3b8"
                      keyboardType="numeric"
                      value={detail.amount}
                      onChangeText={v => handleUpdateDetailField(idx, 'amount', v)}
                    />
                  </View>
                  <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.formLabelSub}>发票附件URL (选填)</Text>
                    <TextInput
                      style={styles.formInputSub}
                      placeholder="图片网址"
                      placeholderTextColor="#94a3b8"
                      value={detail.invoice_url}
                      onChangeText={v => handleUpdateDetailField(idx, 'invoice_url', v)}
                    />
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabelSub}>费用描述</Text>
                  <TextInput
                    style={styles.formInputSub}
                    placeholder="请输入该笔支出的具体用途"
                    placeholderTextColor="#94a3b8"
                    value={detail.description}
                    onChangeText={v => handleUpdateDetailField(idx, 'description', v)}
                  />
                </View>
              </View>
            ))}

            {/* 汇总信息 */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>自动统计总计：</Text>
              <Text style={styles.summaryValue}>¥ {calculateTotalAmount().toFixed(2)}</Text>
            </View>

            <View style={{ height: 60 }} />
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* 报销详情弹窗 */}
      <Modal visible={showDetailModal} animationType="slide" transparent={false}>
        {selectedExpense && (
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowDetailModal(false)} style={styles.modalCloseBtn}>
                <Feather name="arrow-left" size={24} color="#333333" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>报销单详情</Text>
              <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {/* 基本状态面板 */}
              <View style={styles.detailOverviewCard}>
                <Text style={styles.detailOverNo}>报销单号: {selectedExpense.expense_no}</Text>
                <Text style={styles.detailOverTitle}>{selectedExpense.title}</Text>
                <Text style={styles.detailOverAmount}>¥ {parseFloat(selectedExpense.total_amount).toFixed(2)}</Text>
                
                <View style={styles.overviewMetaGrid}>
                  <View style={styles.metaBox}>
                    <Text style={styles.metaLabel}>报销类型</Text>
                    <Text style={styles.metaVal}>{selectedExpense.type}</Text>
                  </View>
                  <View style={styles.metaBox}>
                    <Text style={styles.metaLabel}>当前状态</Text>
                    <Text style={[styles.metaVal, { color: getStatusColor(selectedExpense.status).text }]}>
                      {getStatusText(selectedExpense.status)}
                    </Text>
                  </View>
                </View>
              </View>

              {/* 申请说明 */}
              {selectedExpense.reason ? (
                <View style={styles.detailSection}>
                  <Text style={styles.detailsSectionTitle}>报销说明</Text>
                  <Text style={styles.detailText}>{selectedExpense.reason}</Text>
                </View>
              ) : null}

              {/* 财务批注 */}
              {selectedExpense.financial_remark ? (
                <View style={[styles.detailSection, { backgroundColor: '#fee2e2' }]}>
                  <Text style={[styles.detailsSectionTitle, { color: '#ef4444' }]}>财务/审批批注</Text>
                  <Text style={[styles.detailText, { color: '#b91c1c' }]}>{selectedExpense.financial_remark}</Text>
                </View>
              ) : null}

              {/* 明细项 */}
              <Text style={styles.detailsSectionTitle}>消费明细项目</Text>
              {selectedExpense.details && selectedExpense.details.map((d: any, index: number) => (
                <View key={d.id?.toString() || index} style={styles.detailItemRow}>
                  <View style={styles.itemRowHeader}>
                    <Text style={styles.itemCategory}>{d.category}</Text>
                    <Text style={styles.itemAmount}>¥ {parseFloat(d.amount).toFixed(2)}</Text>
                  </View>
                  <Text style={styles.itemDate}>{new Date(d.item_date).toLocaleDateString('zh-CN')} 发生</Text>
                  {d.description ? (
                    <Text style={styles.itemDesc}>{d.description}</Text>
                  ) : null}
                  {d.invoice_url ? (
                    <Text style={styles.itemInvoice}>发票附件: {d.invoice_url}</Text>
                  ) : null}
                </View>
              ))}

              {/* 操作按钮 (如果是 pending 或 rejected，允许删除重新提交) */}
              {(selectedExpense.status === 'pending' || selectedExpense.status === 'rejected') && (
                <TouchableOpacity 
                  style={styles.deleteBtn} 
                  onPress={() => handleDeleteExpense(selectedExpense.id)}
                >
                  <Feather name="trash-2" size={18} color="#ffffff" style={{ marginRight: 6 }} />
                  <Text style={styles.deleteBtnText}>撤销并删除该申请</Text>
                </TouchableOpacity>
              )}

              <View style={{ height: 60 }} />
            </ScrollView>
          </SafeAreaView>
        )}
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f5f6f8' },
  header: { backgroundColor: '#5a5ce5', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, height: 56 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#ffffff' },
  headerIcon: { padding: 4 },
  tabBar: { flexDirection: 'row', backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#f1f1f1' },
  tabItem: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabItemActive: { borderBottomWidth: 2, borderBottomColor: '#5a5ce5' },
  tabText: { fontSize: 14, color: '#94a3b8' },
  tabTextActive: { color: '#5a5ce5', fontWeight: 'bold' },
  listContainer: { padding: 16, paddingBottom: 40 },
  expenseCard: { backgroundColor: '#ffffff', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 5, elevation: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b', flex: 1, marginRight: 8 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 11, fontWeight: 'bold' },
  cardBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardType: { fontSize: 13, color: '#64748b' },
  cardAmount: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  cardFooter: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f8fafc', paddingTop: 10 },
  cardDate: { fontSize: 12, color: '#94a3b8', marginLeft: 4, flex: 1 },
  cardDetailsCount: { fontSize: 12, color: '#5a5ce5', fontWeight: '500' },
  emptyContainer: { alignItems: 'center', marginVertical: 80 },
  emptyText: { color: '#94a3b8', fontSize: 14 },
  
  // 弹窗与表单样式
  modalContainer: { flex: 1, backgroundColor: '#f8fafc' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, height: 56, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  modalCloseBtn: { padding: 4 },
  modalTitle: { fontSize: 17, fontWeight: 'bold', color: '#1e293b' },
  modalSaveBtnText: { color: '#5a5ce5', fontSize: 16, fontWeight: 'bold' },
  modalContent: { flex: 1, padding: 16 },
  formGroup: { marginBottom: 16 },
  formLabel: { fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 8 },
  formLabelSub: { fontSize: 12, fontWeight: '500', color: '#64748b', marginBottom: 4 },
  formInput: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, color: '#1e293b' },
  formInputSub: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, fontSize: 13, color: '#1e293b' },
  typeSelectorRow: { flexDirection: 'row', flexWrap: 'wrap' },
  typeBtn: { backgroundColor: '#f1f5f9', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12, marginRight: 8, marginBottom: 8 },
  typeBtnActive: { backgroundColor: '#c7d2fe' },
  typeBtnText: { fontSize: 13, color: '#475569', fontWeight: '500' },
  typeBtnTextActive: { color: '#5a5ce5', fontWeight: 'bold' },
  
  // 明细卡片
  detailsHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 12 },
  detailsSectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#1e293b' },
  addDetailBtn: { flexDirection: 'row', alignItems: 'center' },
  addDetailBtnText: { color: '#5a5ce5', fontSize: 13, fontWeight: '600', marginLeft: 4 },
  detailRowCard: { backgroundColor: '#ffffff', borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  detailRowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  detailRowIndex: { fontSize: 13, fontWeight: 'bold', color: '#5a5ce5' },
  rowFormGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryCard: { flexDirection: 'row', backgroundColor: '#e0e7ff', borderRadius: 12, padding: 16, alignItems: 'center', justifyContent: 'flex-end', marginTop: 16 },
  summaryLabel: { fontSize: 15, fontWeight: '600', color: '#4f46e5' },
  summaryValue: { fontSize: 20, fontWeight: 'bold', color: '#4f46e5' },

  // 详情弹窗样式
  detailOverviewCard: { backgroundColor: '#ffffff', borderRadius: 16, padding: 20, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5, elevation: 1, marginBottom: 16 },
  detailOverNo: { fontSize: 12, color: '#94a3b8', marginBottom: 8 },
  detailOverTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginBottom: 12, textAlign: 'center' },
  detailOverAmount: { fontSize: 32, fontWeight: 'bold', color: '#1e293b', marginBottom: 16 },
  overviewMetaGrid: { flexDirection: 'row', width: '100%', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 16 },
  metaBox: { flex: 1, alignItems: 'center' },
  metaLabel: { fontSize: 12, color: '#94a3b8', marginBottom: 4 },
  metaVal: { fontSize: 14, fontWeight: '600', color: '#334155' },
  detailSection: { backgroundColor: '#ffffff', borderRadius: 12, padding: 16, marginBottom: 16 },
  detailText: { fontSize: 14, color: '#334155', lineHeight: 20 },
  detailItemRow: { backgroundColor: '#ffffff', borderRadius: 12, padding: 14, marginBottom: 8, borderLeftWidth: 3, borderLeftColor: '#5a5ce5' },
  itemRowHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  itemCategory: { fontSize: 15, fontWeight: 'bold', color: '#1e293b' },
  itemAmount: { fontSize: 15, fontWeight: 'bold', color: '#1e293b' },
  itemDate: { fontSize: 12, color: '#94a3b8', marginBottom: 6 },
  itemDesc: { fontSize: 13, color: '#475569', marginBottom: 4 },
  itemInvoice: { fontSize: 11, color: '#5a5ce5' },
  deleteBtn: { backgroundColor: '#ef4444', borderRadius: 12, paddingVertical: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  deleteBtnText: { color: '#ffffff', fontSize: 15, fontWeight: 'bold' }
});
