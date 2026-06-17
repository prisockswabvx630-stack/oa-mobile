import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { fetchAttendanceDetail, submitAttendanceAppeal } from '../api/services';
import { getCurrentUser } from '../api/session';

export default function AttendanceDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<any>(null);
  const [showAppealModal, setShowAppealModal] = useState(false);
  const [appealType, setAppealType] = useState('late');
  const [appealReason, setAppealReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadDetail();
  }, [id]);

  const loadDetail = async () => {
    setLoading(true);
    try {
      const res = await fetchAttendanceDetail(id as string);
      setDetail(res);
    } catch (error: any) {
      Alert.alert('错误', error.message || '加载考勤详情失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAppeal = async () => {
    if (!appealReason.trim()) {
      Alert.alert('提示', '请填写申诉原因');
      return;
    }

    setSubmitting(true);
    try {
      await submitAttendanceAppeal({
        attendance_id: id as string,
        appeal_type: appealType,
        reason: appealReason
      });
      Alert.alert('成功', '申诉提交成功，等待审批');
      setShowAppealModal(false);
      setAppealReason('');
      loadDetail();
    } catch (error: any) {
      Alert.alert('错误', error.message || '申诉提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (time: string) => {
    if (!time) return '--:--';
    return new Date(time).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: string) => {
    if (!date) return '--';
    return new Date(date).toLocaleDateString('zh-CN');
  };

  const getStatusText = (status: string) => {
    const map: Record<string, string> = {
      normal: '正常',
      late: '迟到',
      early: '早退',
      late_early: '迟到+早退',
      absent: '缺勤',
      out_of_range: '外勤打卡'
    };
    return map[status] || status;
  };

  const getStatusColor = (status: string) => {
    if (status === 'normal') return '#10b981';
    if (status.includes('late') || status.includes('early')) return '#f59e0b';
    if (status === 'absent') return '#ef4444';
    return '#6b7280';
  };

  const getPenaltyTypeText = (type: string) => {
    const map: Record<string, string> = {
      late: '迟到处罚',
      early: '早退处罚',
      absent: '缺勤处罚',
      overtime: '加班奖励'
    };
    return map[type] || type;
  };

  const getPenaltyStatusText = (status: string) => {
    const map: Record<string, string> = {
      pending: '待处理',
      appealed: '已申诉',
      approved: '已通过',
      rejected: '已拒绝'
    };
    return map[status] || status;
  };

  const getAppealStatusText = (status: string) => {
    const map: Record<string, string> = {
      pending: '待审批',
      approved: '已通过',
      rejected: '已拒绝'
    };
    return map[status] || status;
  };

  const canAppeal = () => {
    if (!detail) return false;
    const hasPendingPenalty = detail.penalties?.some((p: any) => p.status === 'pending');
    const hasNoPendingAppeal = !detail.appeals?.some((a: any) => a.status === 'pending');
    return hasPendingPenalty && hasNoPendingAppeal;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6358ee" />
        <Text style={styles.loadingText}>加载中...</Text>
      </View>
    );
  }

  if (!detail) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>加载失败</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadDetail}>
          <Text style={styles.retryButtonText}>重试</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>考勤详情</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* 基本信息卡片 */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{formatDate(detail.attend_date)} 考勤记录</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(detail.status) + '20' }]}>
              <Text style={[styles.statusText, { color: getStatusColor(detail.status) }]}>
                {getStatusText(detail.status)}
              </Text>
            </View>
          </View>

          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>员工姓名</Text>
              <Text style={styles.infoValue}>{detail.user_name}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>部门</Text>
              <Text style={styles.infoValue}>{detail.dept_name}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>上班打卡</Text>
              <Text style={styles.infoValue}>{formatTime(detail.clock_in_time)}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>下班打卡</Text>
              <Text style={styles.infoValue}>{formatTime(detail.clock_out_time)}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>工作时长</Text>
              <Text style={styles.infoValue}>{detail.work_hours || 0}小时</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>打卡地点</Text>
              <Text style={styles.infoValue}>{detail.clock_in_location || detail.clock_out_location || '--'}</Text>
            </View>
          </View>
        </View>

        {/* 工资影响卡片 */}
        {detail.salaryImpact && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>工资影响</Text>
            <View style={[
              styles.salaryImpact,
              detail.salaryImpact.type === 'bonus' && styles.salaryBonus,
              detail.salaryImpact.type === 'penalty' && styles.salaryPenalty
            ]}>
              <Text style={styles.impactIcon}>
                {detail.salaryImpact.type === 'bonus' ? '💰' : detail.salaryImpact.type === 'penalty' ? '⚠️' : '✅'}
              </Text>
              <View style={styles.impactInfo}>
                <Text style={[
                  styles.impactAmount,
                  detail.salaryImpact.type === 'bonus' && { color: '#10b981' },
                  detail.salaryImpact.type === 'penalty' && { color: '#ef4444' }
                ]}>
                  {detail.salaryImpact.type === 'bonus' ? '+' : ''}{detail.salaryImpact.amount}元
                </Text>
                <Text style={styles.impactDesc}>{detail.salaryImpact.description}</Text>
              </View>
            </View>
          </View>
        )}

        {/* 处罚记录卡片 */}
        {detail.penalties && detail.penalties.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>处罚记录</Text>
            {detail.penalties.map((penalty: any) => (
              <View key={penalty.id} style={styles.penaltyItem}>
                <View style={styles.penaltyInfo}>
                  <Text style={styles.penaltyType}>{getPenaltyTypeText(penalty.type)}</Text>
                  <Text style={styles.penaltyDesc}>{penalty.description}</Text>
                  <Text style={styles.penaltyAmount}>处罚金额: {penalty.amount}元</Text>
                </View>
                <View style={styles.penaltyStatus}>
                  <View style={[styles.statusBadge, { backgroundColor: penalty.status === 'pending' ? '#fef3c7' : '#e5e7eb' }]}>
                    <Text style={[styles.statusText, { color: penalty.status === 'pending' ? '#d97706' : '#6b7280' }]}>
                      {getPenaltyStatusText(penalty.status)}
                    </Text>
                  </View>
                  {penalty.status === 'pending' && (
                    <TouchableOpacity
                      style={styles.appealButton}
                      onPress={() => {
                        setAppealType(penalty.type);
                        setShowAppealModal(true);
                      }}
                    >
                      <Text style={styles.appealButtonText}>申诉</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* 申诉记录卡片 */}
        {detail.appeals && detail.appeals.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>申诉记录</Text>
            {detail.appeals.map((appeal: any) => (
              <View key={appeal.id} style={styles.appealItem}>
                <View style={styles.appealInfo}>
                  <Text style={styles.appealType}>
                    {appeal.type === 'late' ? '迟到申诉' : appeal.type === 'early' ? '早退申诉' : '缺勤申诉'}
                  </Text>
                  <Text style={styles.appealReason}>{appeal.reason}</Text>
                  <Text style={styles.appealTime}>提交时间: {formatDate(appeal.createTime)}</Text>
                </View>
                <View style={styles.appealStatus}>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: appeal.status === 'pending' ? '#fef3c7' : appeal.status === 'approved' ? '#d1fae5' : '#fee2e2' }
                  ]}>
                    <Text style={[
                      styles.statusText,
                      { color: appeal.status === 'pending' ? '#d97706' : appeal.status === 'approved' ? '#059669' : '#dc2626' }
                    ]}>
                      {getAppealStatusText(appeal.status)}
                    </Text>
                  </View>
                  {appeal.approveRemark && (
                    <Text style={styles.approveRemark}>审批备注: {appeal.approveRemark}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* 操作按钮 */}
        <View style={styles.actionButtons}>
          {canAppeal() && (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => setShowAppealModal(true)}
            >
              <Text style={styles.primaryButtonText}>提交申诉</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* 申诉对话框 */}
      <Modal
        visible={showAppealModal}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>提交考勤申诉</Text>
              <TouchableOpacity onPress={() => setShowAppealModal(false)}>
                <Feather name="x" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.label}>申诉类型</Text>
              <View style={styles.typeSelector}>
                {['late', 'early', 'absent'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeOption,
                      appealType === type && styles.typeOptionActive
                    ]}
                    onPress={() => setAppealType(type)}
                  >
                    <Text style={[
                      styles.typeOptionText,
                      appealType === type && styles.typeOptionTextActive
                    ]}>
                      {type === 'late' ? '迟到' : type === 'early' ? '早退' : '缺勤'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>申诉原因</Text>
              <TextInput
                style={styles.textArea}
                multiline
                numberOfLines={4}
                placeholder="请详细说明申诉原因..."
                value={appealReason}
                onChangeText={setAppealReason}
              />
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowAppealModal(false)}
              >
                <Text style={styles.cancelButtonText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                onPress={handleSubmitAppeal}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.submitButtonText}>提交申诉</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#666',
    marginBottom: 12,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#6358ee',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  header: {
    backgroundColor: '#6358ee',
    paddingTop: 48,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  infoItem: {
    width: '48%',
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  salaryImpact: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    marginTop: 12,
  },
  salaryBonus: {
    backgroundColor: '#f0fdf4',
  },
  salaryPenalty: {
    backgroundColor: '#fef2f2',
  },
  impactIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  impactInfo: {
    flex: 1,
  },
  impactAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  impactDesc: {
    fontSize: 13,
    color: '#666',
  },
  penaltyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginTop: 12,
  },
  penaltyInfo: {
    flex: 1,
  },
  penaltyType: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  penaltyDesc: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  penaltyAmount: {
    fontSize: 12,
    color: '#999',
  },
  penaltyStatus: {
    alignItems: 'flex-end',
    gap: 8,
  },
  appealButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#6358ee',
    borderRadius: 6,
  },
  appealButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  appealItem: {
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginTop: 12,
  },
  appealInfo: {
    marginBottom: 8,
  },
  appealType: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  appealReason: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  appealTime: {
    fontSize: 12,
    color: '#999',
  },
  appealStatus: {
    alignItems: 'flex-start',
    gap: 4,
  },
  approveRemark: {
    fontSize: 12,
    color: '#666',
  },
  actionButtons: {
    marginTop: 8,
    marginBottom: 32,
  },
  primaryButton: {
    backgroundColor: '#6358ee',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalBody: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  typeOption: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d9d9d9',
    alignItems: 'center',
  },
  typeOptionActive: {
    borderColor: '#6358ee',
    backgroundColor: '#6358ee10',
  },
  typeOptionText: {
    fontSize: 14,
    color: '#666',
  },
  typeOptionTextActive: {
    color: '#6358ee',
    fontWeight: '500',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#d9d9d9',
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d9d9d9',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#6358ee',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
