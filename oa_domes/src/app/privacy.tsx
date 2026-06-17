import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Switch, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { isSalaryLockEnabled, setSalaryLockEnabled } from '../api/session';

export default function PrivacyScreen() {
  const router = useRouter();

  // 隐私选项状态
  const [searchByPhone, setSearchByPhone] = useState(true);
  const [searchByEmail, setSearchByEmail] = useState(true);
  const [showOnlineStatus, setShowOnlineStatus] = useState(true);
  const [salaryLock, setSalaryLock] = useState(true);

  useEffect(() => {
    setSalaryLock(isSalaryLockEnabled());
  }, []);

  const handleSalaryLockChange = (val: boolean) => {
    setSalaryLock(val);
    setSalaryLockEnabled(val);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerIcon}>
          <Feather name="arrow-left" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>隐私设置</Text>
        <View style={styles.headerIcon} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.container}>
        
        <Text style={styles.sectionTitle}>联系与搜索隐私</Text>
        <View style={styles.card}>
          <View style={styles.switchRow}>
            <View style={styles.switchCol}>
              <Text style={styles.switchTitle}>允许通过手机号搜索我</Text>
              <Text style={styles.switchSub}>开启后，同事可以在通讯录中通过输入完整手机号找到您</Text>
            </View>
            <Switch
              value={searchByPhone}
              onValueChange={setSearchByPhone}
              trackColor={{ false: '#e2e8f0', true: '#c7d2fe' }}
              thumbColor={searchByPhone ? '#5a5ce5' : '#cbd5e1'}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.switchRow}>
            <View style={styles.switchCol}>
              <Text style={styles.switchTitle}>允许通过电子邮箱搜索我</Text>
              <Text style={styles.switchSub}>开启后，同事可以通过输入您的公司企业邮箱地址找到您</Text>
            </View>
            <Switch
              value={searchByEmail}
              onValueChange={setSearchByEmail}
              trackColor={{ false: '#e2e8f0', true: '#c7d2fe' }}
              thumbColor={searchByEmail ? '#5a5ce5' : '#cbd5e1'}
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>状态与展示设置</Text>
        <View style={styles.card}>
          <View style={styles.switchRow}>
            <View style={styles.switchCol}>
              <Text style={styles.switchTitle}>向同事展示我的在线状态</Text>
              <Text style={styles.switchSub}>关闭后，工作台和通讯录中不会显示您是否在线</Text>
            </View>
            <Switch
              value={showOnlineStatus}
              onValueChange={setShowOnlineStatus}
              trackColor={{ false: '#e2e8f0', true: '#c7d2fe' }}
              thumbColor={showOnlineStatus ? '#5a5ce5' : '#cbd5e1'}
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>财务安全机制</Text>
        <View style={[styles.card, { marginBottom: 30 }]}>
          <View style={styles.switchRow}>
            <View style={styles.switchCol}>
              <Text style={styles.switchTitle}>工资条查询密码验证保护</Text>
              <Text style={styles.switchSub}>开启后，在查看敏感工资条明细时，每次都需要验证登录密码</Text>
            </View>
            <Switch
              value={salaryLock}
              onValueChange={handleSalaryLockChange}
              trackColor={{ false: '#e2e8f0', true: '#c7d2fe' }}
              thumbColor={salaryLock ? '#5a5ce5' : '#cbd5e1'}
            />
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f5f6f8' },
  header: { backgroundColor: '#5a5ce5', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, height: 56 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#ffffff' },
  headerIcon: { padding: 4, width: 32 },
  container: { flex: 1, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#64748b', marginTop: 24, marginBottom: 8, paddingLeft: 4 },
  card: { backgroundColor: '#ffffff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5, elevation: 2 },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 8 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  switchCol: { flex: 1, marginRight: 16 },
  switchTitle: { fontSize: 15, color: '#1e293b', fontWeight: '500', marginBottom: 2 },
  switchSub: { fontSize: 12, color: '#64748b' }
});
