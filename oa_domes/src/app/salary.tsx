import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, Modal, TextInput, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { fetchSalary, login } from '../api/services';
import { getCurrentUser, isSalaryLockEnabled } from '../api/session';

export default function SalaryScreen() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showSalary, setShowSalary] = useState(false);
  const [salaryData, setSalaryData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 二次安全验证状态
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [typedPassword, setTypedPassword] = useState('');
  const [verifyingPassword, setVerifyingPassword] = useState(false);

  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);

    fetchSalary()
      .then(data => {
        if (data && data.length > 0) {
          setSalaryData(data[0]);
        }
      })
      .catch(err => console.error('加载薪资失败:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleToggleShowSalary = () => {
    if (showSalary) {
      // 隐藏薪资不需要密码
      setShowSalary(false);
    } else {
      // 如果隐私设置中开启了密码校验，则弹出校验框
      if (isSalaryLockEnabled()) {
        setPasswordModalVisible(true);
      } else {
        setShowSalary(true);
      }
    }
  };

  const handleVerifyPassword = async () => {
    if (!typedPassword) {
      Alert.alert('提示', '请输入密码');
      return;
    }
    if (!currentUser?.username) {
      Alert.alert('错误', '用户数据未加载');
      return;
    }

    try {
      setVerifyingPassword(true);
      await login(currentUser.username, typedPassword);
      setPasswordModalVisible(false);
      setTypedPassword('');
      setShowSalary(true);
    } catch (err: any) {
      Alert.alert('校验失败', err.message || '密码错误，请重新输入');
    } finally {
      setVerifyingPassword(false);
    }
  };

  const formatMoney = (v: number | string | null | undefined) => {
    if (v === null || v === undefined) return '0.00';
    return Number(v).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const month = salaryData?.month || '--';
  const netSalary = salaryData ? Number(salaryData.net_salary) : 0;
  const baseSalary = salaryData ? Number(salaryData.base_salary) : 0;
  const perfBonus = salaryData ? Number(salaryData.performance_bonus) : 0;
  const mealAllow = salaryData ? Number(salaryData.meal_allowance || 0) : 0;
  const transportAllow = salaryData ? Number(salaryData.transport_allowance || 0) : 0;
  const socialSec = salaryData ? Number(salaryData.social_security) : 0;
  const housingFund = salaryData ? Number(salaryData.housing_fund) : 0;

  // 安全防截图倾斜平铺水印组件
  const WatermarkOverlay = () => {
    if (!currentUser) return null;
    const watermarkText = `${currentUser.real_name} ${currentUser.emp_no}  `;
    const rows = Array.from({ length: 16 });
    const cols = Array.from({ length: 4 });
    return (
      <View style={styles.watermarkContainer} pointerEvents="none">
        {rows.map((_, rowIndex) => (
          <View key={rowIndex} style={styles.watermarkRow}>
            {cols.map((_, colIndex) => (
              <Text key={colIndex} style={styles.watermarkText}>
                {watermarkText}
              </Text>
            ))}
          </View>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerIcon}>
            <Feather name="arrow-left" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>薪资单</Text>
          <View style={styles.headerIcon} />
        </View>
        <ActivityIndicator size="large" color="#5a5ce5" style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerIcon}>
          <Feather name="arrow-left" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>薪资单</Text>
        <TouchableOpacity style={styles.headerIcon} onPress={() => Alert.alert('提示', '薪资单已成功加密下载')}>
          <Feather name="download" size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1, position: 'relative' }}>
        {/* 平铺安全水印 */}
        <WatermarkOverlay />

        <ScrollView showsVerticalScrollIndicator={false} style={styles.container}>

          <View style={styles.monthSelector}>
            <Feather name="chevron-left" size={20} color="#666666" />
            <Text style={styles.monthText}>{month}</Text>
            <Feather name="chevron-right" size={20} color="#666666" />
          </View>

          <View style={styles.salaryCard}>
            <View style={styles.salaryHeader}>
              <Text style={styles.salaryLabel}>实发薪资 (元)</Text>
              <TouchableOpacity onPress={handleToggleShowSalary}>
                <Feather name={showSalary ? "eye" : "eye-off"} size={20} color="#ffffff" />
              </TouchableOpacity>
            </View>
            <Text style={styles.salaryAmount}>
              {showSalary ? formatMoney(netSalary) : '****.**'}
            </Text>
          </View>

          <View style={styles.detailsCard}>
            <Text style={styles.sectionTitle}>薪资明细</Text>

            <View style={styles.detailGroup}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>基本工资</Text>
                <Text style={styles.detailValue}>{showSalary ? `¥ ${formatMoney(baseSalary)}` : '***'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>绩效奖金</Text>
                <Text style={styles.detailValue}>{showSalary ? `¥ ${formatMoney(perfBonus)}` : '***'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>交通补贴</Text>
                <Text style={styles.detailValue}>{showSalary ? `¥ ${formatMoney(transportAllow)}` : '***'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>餐补</Text>
                <Text style={styles.detailValue}>{showSalary ? `¥ ${formatMoney(mealAllow)}` : '***'}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <Text style={styles.sectionTitle}>扣款明细</Text>

            <View style={styles.detailGroup}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>代扣社保</Text>
                <Text style={[styles.detailValue, {color: '#ef4444'}]}>{showSalary ? `- ¥ ${formatMoney(socialSec)}` : '***'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>代扣公积金</Text>
                <Text style={[styles.detailValue, {color: '#ef4444'}]}>{showSalary ? `- ¥ ${formatMoney(housingFund)}` : '***'}</Text>
              </View>
            </View>

          </View>
        </ScrollView>
      </View>

      {/* 二次安全认证密码弹窗 */}
      <Modal visible={passwordModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.passwordCard}>
            <View style={styles.shieldIconContainer}>
              <Feather name="shield" size={32} color="#5a5ce5" />
            </View>
            <Text style={styles.passwordTitle}>安全校验</Text>
            <Text style={styles.passwordSub}>查看薪资明细需验证您的登录密码</Text>
            <TextInput
              style={styles.passwordInput}
              placeholder="请输入登录密码"
              placeholderTextColor="#94a3b8"
              secureTextEntry
              value={typedPassword}
              onChangeText={setTypedPassword}
              onSubmitEditing={handleVerifyPassword}
              autoFocus
            />
            {verifyingPassword && <ActivityIndicator color="#5a5ce5" style={{ marginVertical: 8 }} />}
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.modalBtnCancel} onPress={() => { setPasswordModalVisible(false); setTypedPassword(''); }}>
                <Text style={styles.modalBtnCancelText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnConfirm} onPress={handleVerifyPassword} disabled={verifyingPassword}>
                <Text style={styles.modalBtnConfirmText}>确认</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f5f6f8' },
  header: { backgroundColor: '#5a5ce5', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, height: 56 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#ffffff' },
  headerIcon: { padding: 4 },
  container: { flex: 1, paddingHorizontal: 16 },
  monthSelector: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 20, marginVertical: 16, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5, elevation: 2 },
  monthText: { fontSize: 16, fontWeight: 'bold', color: '#333333' },
  salaryCard: { backgroundColor: '#5a5ce5', borderRadius: 16, padding: 24, marginBottom: 16, shadowColor: '#5a5ce5', shadowOpacity: 0.3, shadowRadius: 10, elevation: 8 },
  salaryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  salaryLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  salaryAmount: { fontSize: 36, fontWeight: 'bold', color: '#ffffff' },
  detailsCard: { backgroundColor: '#ffffff', borderRadius: 16, padding: 20, marginBottom: 40, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5, elevation: 2 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333333', marginBottom: 16 },
  detailGroup: { marginBottom: 8 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  detailLabel: { fontSize: 14, color: '#666666' },
  detailValue: { fontSize: 14, fontWeight: 'bold', color: '#333333' },
  divider: { height: 1, backgroundColor: '#f1f1f1', marginVertical: 16 },
  
  // 水印背景平铺样式
  watermarkContainer: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.05,
    overflow: 'hidden',
    zIndex: 999,
  },
  watermarkRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 32,
    transform: [{ rotate: '-25deg' }],
  },
  watermarkText: {
    fontSize: 13,
    color: '#000000',
    fontWeight: '600',
    marginHorizontal: 15,
  },

  // 密码弹窗样式
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  passwordCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  shieldIconContainer: {
    alignItems: 'center',
    marginBottom: 16,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  passwordTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 8,
  },
  passwordSub: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 20,
  },
  passwordInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1e293b',
    marginBottom: 20,
    backgroundColor: '#f8fafc',
  },
  modalBtns: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalBtnCancel: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginRight: 8,
  },
  modalBtnCancelText: {
    color: '#475569',
    fontWeight: '600',
    fontSize: 15,
  },
  modalBtnConfirm: {
    flex: 1,
    backgroundColor: '#5a5ce5',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginLeft: 8,
  },
  modalBtnConfirmText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 15,
  },
});
