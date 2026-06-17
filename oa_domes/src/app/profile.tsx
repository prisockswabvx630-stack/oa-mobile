import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getCurrentUser, clearSession } from '../api/session';
import BottomTabBar from '../components/BottomTabBar';

export default function ProfileScreen() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    setCurrentUser(getCurrentUser());
  }, []);

  const handleLogout = async () => {
    await clearSession();
    router.replace('/');
  };

  const name = currentUser?.real_name || '未知';
  const posName = currentUser?.sys_position?.pos_name || '普通员工';
  const deptName = currentUser?.sys_department?.dept_name || '未分配部门';
  const role = `${posName} • ${deptName}`;
  const empNo = currentUser?.emp_no || 'EMP10001';
  const avatar = currentUser?.avatar || `https://i.pravatar.cc/150?img=${currentUser?.id || 1}`;
  const statusText = currentUser?.status === 1 ? '正常' : '禁用';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerIcon} />
        <Text style={styles.headerTitle}>个人中心</Text>
        <TouchableOpacity style={styles.headerIcon}>
          <Feather name="settings" size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.container}>

        {/* Profile Info */}
        <View style={styles.profileSection}>
          <Image source={{ uri: avatar }} style={styles.avatar} />
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.role}>{role}</Text>
          <View style={styles.tagContainer}>
            <View style={styles.tag}><Text style={styles.tagText}>工号: {empNo}</Text></View>
            <View style={[styles.tag, {backgroundColor: '#ecfdf5'}]}><Text style={[styles.tagText, {color: '#10b981'}]}>状态: {statusText}</Text></View>
          </View>
        </View>

        {/* Info Grid */}
        <View style={styles.statsCard}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{empNo}</Text>
            <Text style={styles.statLabel}>工号</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{deptName}</Text>
            <Text style={styles.statLabel}>部门</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{posName}</Text>
            <Text style={styles.statLabel}>职位</Text>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuGroup}>
          <MenuItem icon="shield" title="账号与安全" color="#3b82f6" route="/security" />
          <MenuItem icon="bell" title="消息通知设置" color="#f59e0b" route="/notifications" />
          <MenuItem icon="lock" title="隐私设置" color="#10b981" route="/privacy" />
        </View>

        <View style={styles.menuGroup}>
          <MenuItem icon="help-circle" title="帮助与反馈" color="#8b5cf6" route="/help" />
          <MenuItem icon="info" title="关于应用" color="#ec4899" value="v1.0.0" route="/about" />
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>退出登录</Text>
        </TouchableOpacity>

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Bottom Tab Bar */}
      <BottomTabBar />
    </SafeAreaView>
  );
}

function MenuItem({ icon, title, color, value, route }: any) {
  const router = useRouter();
  return (
    <TouchableOpacity style={styles.menuItem} onPress={() => route && router.push(route)}>
      <View style={[styles.iconBox, { backgroundColor: `${color}15` }]}>
        <Feather name={icon} size={18} color={color} />
      </View>
      <Text style={styles.menuTitle}>{title}</Text>
      {value && <Text style={styles.menuValue}>{value}</Text>}
      <Feather name="chevron-right" size={20} color="#999999" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f5f6f8' },
  header: { backgroundColor: '#5a5ce5', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, height: 56 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#ffffff' },
  headerIcon: { padding: 4 },
  container: { flex: 1, paddingHorizontal: 16 },
  profileSection: { alignItems: 'center', marginTop: 30, marginBottom: 32 },
  avatar: { width: 90, height: 90, borderRadius: 45, marginBottom: 16, borderWidth: 3, borderColor: '#ffffff', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  name: { fontSize: 22, fontWeight: 'bold', color: '#333333', marginBottom: 8 },
  role: { fontSize: 14, color: '#666666', marginBottom: 16 },
  tagContainer: { flexDirection: 'row' },
  tag: { backgroundColor: '#f1f1f1', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginRight: 8 },
  tagText: { color: '#666666', fontSize: 12, fontWeight: '600' },
  statsCard: { flexDirection: 'row', backgroundColor: '#ffffff', borderRadius: 16, padding: 20, marginBottom: 24, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5, elevation: 2 },
  statBox: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: 'bold', color: '#5a5ce5', marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#999999' },
  statDivider: { width: 1, height: 40, backgroundColor: '#f1f1f1' },
  menuGroup: { backgroundColor: '#ffffff', borderRadius: 16, marginBottom: 16, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5, elevation: 2 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f8f8f8' },
  iconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  menuTitle: { flex: 1, fontSize: 15, color: '#333333', fontWeight: '500' },
  menuValue: { fontSize: 14, color: '#999999', marginRight: 12 },
  logoutBtn: { backgroundColor: '#ffffff', borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 10, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5, elevation: 2 },
  logoutText: { color: '#ef4444', fontSize: 16, fontWeight: 'bold' }
});
