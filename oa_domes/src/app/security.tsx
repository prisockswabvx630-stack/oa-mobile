import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TextInput, TouchableOpacity, Alert, Switch, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getCurrentUser } from '../api/session';
import { changePassword } from '../api/services';

export default function SecurityScreen() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // 修改密码表单
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 安全设置
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [mfaEnabled, setMfaEnabled] = useState(false);

  useEffect(() => {
    setCurrentUser(getCurrentUser());
  }, []);

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert('提示', '请填写完整的所有密码字段');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('提示', '新密码与确认密码不一致');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('提示', '新密码长度不能少于6位');
      return;
    }

    try {
      setSubmitting(true);
      await changePassword(currentUser.id, {
        oldPassword,
        newPassword
      });
      Alert.alert('成功', '您的密码已修改成功！');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      Alert.alert('错误', err.message || '修改密码失败');
    } finally {
      setSubmitting(false);
    }
  };

  const username = currentUser?.username || 'admin';
  const mobile = currentUser?.mobile || '13800138000';
  const email = currentUser?.email || 'admin@company.com';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerIcon}>
          <Feather name="arrow-left" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>账号与安全</Text>
        <View style={styles.headerIcon} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.container}>
        
        {/* 基本账号信息 */}
        <Text style={styles.sectionTitle}>账号信息</Text>
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>账号用户名</Text>
            <Text style={styles.infoValue}>{username}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>绑定手机</Text>
            <Text style={styles.infoValue}>{mobile.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>绑定邮箱</Text>
            <Text style={styles.infoValue}>{email}</Text>
          </View>
        </View>

        {/* 生物识别与安全验证 */}
        <Text style={styles.sectionTitle}>安全设置</Text>
        <View style={styles.card}>
          <View style={styles.switchRow}>
            <View style={styles.switchCol}>
              <Text style={styles.switchTitle}>生物识别登录</Text>
              <Text style={styles.switchSub}>开启后支持使用指纹/面容快速登录</Text>
            </View>
            <Switch
              value={biometricEnabled}
              onValueChange={setBiometricEnabled}
              trackColor={{ false: '#e2e8f0', true: '#c7d2fe' }}
              thumbColor={biometricEnabled ? '#5a5ce5' : '#cbd5e1'}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.switchRow}>
            <View style={styles.switchCol}>
              <Text style={styles.switchTitle}>双重身份验证 (MFA)</Text>
              <Text style={styles.switchSub}>敏感操作（如查看薪资）需短信二次确认</Text>
            </View>
            <Switch
              value={mfaEnabled}
              onValueChange={setMfaEnabled}
              trackColor={{ false: '#e2e8f0', true: '#c7d2fe' }}
              thumbColor={mfaEnabled ? '#5a5ce5' : '#cbd5e1'}
            />
          </View>
        </View>

        {/* 修改密码表单 */}
        <Text style={styles.sectionTitle}>修改登录密码</Text>
        <View style={styles.card}>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>原密码</Text>
            <TextInput
              style={styles.input}
              placeholder="请输入原登录密码"
              placeholderTextColor="#94a3b8"
              secureTextEntry
              value={oldPassword}
              onChangeText={setOldPassword}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>新密码</Text>
            <TextInput
              style={styles.input}
              placeholder="请输入新密码 (不小于6位)"
              placeholderTextColor="#94a3b8"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>确认新密码</Text>
            <TextInput
              style={styles.input}
              placeholder="请再次输入新密码"
              placeholderTextColor="#94a3b8"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
          </View>

          <TouchableOpacity 
            style={[styles.btnSubmit, submitting && styles.btnDisabled]} 
            onPress={handleChangePassword}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.btnSubmitText}>保存修改</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* 登录设备日志 */}
        <Text style={styles.sectionTitle}>最近登录设备</Text>
        <View style={[styles.card, { marginBottom: 30 }]}>
          <View style={styles.deviceRow}>
            <Feather name="phone" size={20} color="#5a5ce5" style={styles.deviceIcon} />
            <View style={{ flex: 1 }}>
              <Text style={styles.deviceTitle}>此设备 ({mockDeviceInfo()})</Text>
              <Text style={styles.deviceMeta}>刚刚 · 北京 · 正常活跃中</Text>
            </View>
            <Text style={styles.deviceStatus}>在线</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.deviceRow}>
            <Feather name="monitor" size={20} color="#94a3b8" style={styles.deviceIcon} />
            <View style={{ flex: 1 }}>
              <Text style={styles.deviceTitle}>Chrome (Windows 11)</Text>
              <Text style={styles.deviceMeta}>1小时前 · 北京 · 登录活动</Text>
            </View>
            <Text style={[styles.deviceStatus, { color: '#94a3b8' }]}>离线</Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

function mockDeviceInfo() {
  return 'Mobile Handset';
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f5f6f8' },
  header: { backgroundColor: '#5a5ce5', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, height: 56 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#ffffff' },
  headerIcon: { padding: 4, width: 32 },
  container: { flex: 1, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#64748b', marginTop: 24, marginBottom: 8, paddingLeft: 4 },
  card: { backgroundColor: '#ffffff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5, elevation: 2 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  infoLabel: { fontSize: 15, color: '#475569' },
  infoValue: { fontSize: 15, color: '#1e293b', fontWeight: '500' },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 4 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  switchCol: { flex: 1, marginRight: 16 },
  switchTitle: { fontSize: 15, color: '#1e293b', fontWeight: '500', marginBottom: 2 },
  switchSub: { fontSize: 12, color: '#64748b' },
  inputWrapper: { paddingVertical: 8 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#64748b', marginBottom: 6 },
  input: { fontSize: 15, color: '#1e293b', paddingVertical: 8, paddingHorizontal: 4 },
  btnSubmit: { backgroundColor: '#5a5ce5', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
  btnSubmitText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  btnDisabled: { backgroundColor: '#94a3b8' },
  deviceRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  deviceIcon: { marginRight: 16, padding: 8, backgroundColor: '#f1f5f9', borderRadius: 10 },
  deviceTitle: { fontSize: 15, fontWeight: '500', color: '#1e293b' },
  deviceMeta: { fontSize: 12, color: '#64748b', marginTop: 2 },
  deviceStatus: { fontSize: 13, fontWeight: '600', color: '#10b981' }
});
