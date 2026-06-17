import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const MENU_SECTIONS = [
  {
    title: '办公管理',
    items: [
      { icon: 'check-square', label: '审批管理', route: '/approval', color: '#3b82f6' },
      { icon: 'calendar', label: '会议管理', route: '/meetings', color: '#ec4899' },
      { icon: 'file-text', label: '文档管理', route: '/documents', color: '#eab308' },
      { icon: 'check-circle', label: '任务管理', route: '/tasks', color: '#d97706' },
      { icon: 'calendar', label: '日程管理', route: '/schedule', color: '#22c55e' },
      { icon: 'git-branch', label: '流程管理', route: '/workflows', color: '#8b5cf6' },
    ],
  },
  {
    title: '业务管理',
    items: [
      { icon: 'briefcase', label: '项目管理', route: '/projects', color: '#3b82f6' },
      { icon: 'trending-up', label: '绩效管理', route: '/performance', color: '#10b981' },
      { icon: 'dollar-sign', label: '薪资管理', route: '/salary', color: '#f43f5e' },
      { icon: 'monitor', label: '资产管理', route: '/assets', color: '#06b6d4' },
      { icon: 'credit-card', label: '报销管理', route: '/expense', color: '#f59e0b' },
    ],
  },
  {
    title: '团队协作',
    items: [
      { icon: 'repeat', label: '工作交接', route: '/handover', color: '#6366f1' },
      { icon: 'bell', label: '公告通知', route: '/notices', color: '#ef4444' },
      { icon: 'mail', label: '消息中心', route: '/messages', color: '#3b82f6' },
      { icon: 'users', label: '通讯录', route: '/contacts', color: '#10b981' },
    ],
  },
  {
    title: '系统',
    items: [
      { icon: 'shield', label: '账号安全', route: '/security', color: '#3b82f6' },
      { icon: 'bell', label: '通知设置', route: '/notifications', color: '#f59e0b' },
      { icon: 'lock', label: '隐私设置', route: '/privacy', color: '#10b981' },
      { icon: 'clipboard', label: '操作日志', route: '/operation-logs', color: '#6b7280' },
      { icon: 'trash-2', label: '回收站', route: '/recycle-bin', color: '#ef4444' },
      { icon: 'settings', label: '系统设置', route: '/settings', color: '#8b5cf6' },
      { icon: 'help-circle', label: '帮助反馈', route: '/help', color: '#6366f1' },
      { icon: 'info', label: '关于', route: '/about', color: '#ec4899' },
    ],
  },
];

export default function ExploreScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>更多功能</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {MENU_SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionGrid}>
              {section.items.map((item) => (
                <TouchableOpacity
                  key={item.label}
                  style={styles.gridItem}
                  onPress={() => router.push(item.route as any)}
                >
                  <View style={[styles.iconBox, { backgroundColor: `${item.color}15` }]}>
                    <Feather name={item.icon as any} size={22} color={item.color} />
                  </View>
                  <Text style={styles.gridLabel}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f5f6f8' },
  header: { backgroundColor: '#5a5ce5', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#ffffff' },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: '#666666', marginBottom: 12, marginLeft: 4 },
  sectionGrid: { backgroundColor: '#ffffff', borderRadius: 16, flexDirection: 'row', flexWrap: 'wrap', padding: 8, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5, elevation: 2 },
  gridItem: { width: '25%', alignItems: 'center', paddingVertical: 14 },
  iconBox: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  gridLabel: { fontSize: 12, color: '#333333' },
});
