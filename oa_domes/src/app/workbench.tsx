import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter, useNavigation } from 'expo-router';
import { fetchApprovals, fetchNotices, fetchMessages } from '../api/services';
import { getCurrentUser } from '../api/session';
import BottomTabBar from '../components/BottomTabBar';

const MENU_ITEMS = [
  { id: '1', title: '审批', icon: 'check-square', route: '/approval', bgColor: '#f0f5ff', color: '#6366f1' },
  { id: '2', title: '考勤', icon: 'clock', route: '/attendance', bgColor: '#ecfdf5', color: '#10b981' },
  { id: '3', title: '通讯录', icon: 'users', route: '/contacts', bgColor: '#eff6ff', color: '#3b82f6' },
  { id: '4', title: '任务', icon: 'check-circle', route: '/tasks', bgColor: '#fef3c7', color: '#d97706' },
  { id: '5', title: '会议', icon: 'calendar', route: '/meetings', bgColor: '#fdf2f8', color: '#ec4899' },
  { id: '6', title: '日程', icon: 'calendar', route: '/schedule', bgColor: '#f0fdf4', color: '#22c55e' },
  { id: '7', title: '文档', icon: 'file-text', route: '/documents', bgColor: '#fefce8', color: '#eab308' },
  { id: '8', title: '薪资', icon: 'dollar-sign', route: '/salary', bgColor: '#fff1f2', color: '#f43f5e' },
  { id: '9', title: '报销', icon: 'credit-card', route: '/expense', bgColor: '#ecfeff', color: '#06b6d4' },
];

export default function WorkbenchScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [approvals, setApprovals] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [apprData, noticeData, msgData] = await Promise.all([
        fetchApprovals({ status: 'pending' }),
        fetchNotices(),
        fetchMessages()
      ]);
      setApprovals(apprData);
      setNotices(noticeData);
      
      // 动态计算未读消息数
      if (Array.isArray(msgData)) {
        const unreads = msgData.filter((m: any) => !m.is_read).length;
        setUnreadCount(unreads);
      }
    } catch (err) {
      console.error('加载工作台数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentUser(getCurrentUser());
    loadData();

    // 每次页面获得焦点（例如从消息中心返回）时自动重新加载，保证未读数、待办数最新
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });
    return unsubscribe;
  }, [navigation]);

  const pendingCount = approvals.length;
  const greetingName = currentUser?.real_name || '用户';
  const avatarLetter = greetingName[0] || 'U';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerBg}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greetingTitle}>Hi, {greetingName}</Text>
            <Text style={styles.greetingSub}>早上好, 今天有 {pendingCount} 条待办事项</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerIconBtn} onPress={() => router.push('/messages')}>
              <Feather name="mail" size={20} color="#ffffff" />
              {unreadCount > 0 && (
                <View style={styles.redBadge}>
                  <Text style={styles.redBadgeText}>{unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerAvatarBtn} onPress={() => router.push('/profile')}>
              <Text style={styles.headerAvatarText}>{avatarLetter}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.searchWrapper}>
        <View style={styles.searchBar}>
          <Feather name="search" size={18} color="#94a3b8" style={{marginRight: 8}} />
          <TextInput placeholder="搜索同事、审批、公告..." placeholderTextColor="#94a3b8" style={styles.searchInput} />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.container} contentContainerStyle={{paddingTop: 10}}>
        
        <Text style={styles.sectionTitle}>常用功能</Text>
        <View style={styles.gridContainer}>
          {MENU_ITEMS.map((item) => (
            <TouchableOpacity key={item.id} style={styles.gridItem} onPress={() => router.push(item.route as any)}>
              <View style={[styles.iconBox, { backgroundColor: item.bgColor }]}>
                <Feather name={item.icon as any} size={24} color={item.color} />
              </View>
              <Text style={styles.gridText}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>待办事项</Text>
          <TouchableOpacity onPress={() => router.push('/approval')}><Text style={styles.moreText}>全部 &gt;</Text></TouchableOpacity>
        </View>

        {approvals.slice(0, 2).map((item) => (
          <View key={item.id.toString()} style={styles.todoCard}>
            <View style={[styles.cardBorderLeft, { backgroundColor: item.type === '请假' ? '#3b82f6' : '#f59e0b' }]} />
            <View style={styles.cardContent}>
              <Text style={styles.todoTitle}>{item.type}审批 - {item.applicant_name}</Text>
              <Text style={styles.todoMeta}>{item.title} | {item.content}</Text>
              <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/approval')}>
                <Text style={styles.actionBtnText}>去处理</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {approvals.length === 0 && (
          <View style={styles.todoCard}>
            <View style={[styles.cardBorderLeft, { backgroundColor: '#10b981' }]} />
            <View style={styles.cardContent}>
              <Text style={styles.todoTitle}>暂无待办事项</Text>
              <Text style={styles.todoMeta}>今天的工作都处理完啦，继续保持！</Text>
            </View>
          </View>
        )}
        
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>公告通知</Text>
          <TouchableOpacity onPress={() => router.push('/notices')}><Text style={styles.moreText}>全部 &gt;</Text></TouchableOpacity>
        </View>

        {notices.slice(0, 1).map((notice) => (
          <TouchableOpacity key={notice.id.toString()} style={styles.noticeCard} onPress={() => router.push('/notices')} activeOpacity={0.7}>
            <View style={styles.noticeBadge}><Text style={styles.noticeBadgeText}>公告</Text></View>
            <View style={{flex: 1}}>
              <Text style={styles.noticeTitle}>{notice.title}</Text>
              <Text style={styles.todoMeta}>{notice.content ? notice.content.slice(0, 40) + '...' : ''}</Text>
            </View>
          </TouchableOpacity>
        ))}

        {notices.length === 0 && (
          <View style={styles.noticeCard}>
            <View style={styles.noticeBadge}><Text style={styles.noticeBadgeText}>公告</Text></View>
            <View style={{flex: 1}}>
              <Text style={styles.noticeTitle}>暂无最新公告</Text>
            </View>
          </View>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Bottom Tab Bar */}
      <BottomTabBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f5f6f8' },
  headerBg: { backgroundColor: '#5a5ce5', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 60, zIndex: 1 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greetingTitle: { fontSize: 24, fontWeight: 'bold', color: '#ffffff', marginBottom: 4 },
  greetingSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  headerIconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginRight: 12, position: 'relative' },
  headerAvatarBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  headerAvatarText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  searchWrapper: { paddingHorizontal: 20, marginTop: -25, zIndex: 10 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', height: 50, borderRadius: 25, paddingHorizontal: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 4 },
  searchInput: { flex: 1, fontSize: 14, color: '#333333' },
  container: { flex: 1, paddingHorizontal: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333333', marginTop: 20, marginBottom: 16 },
  moreText: { fontSize: 14, color: '#5a5ce5' },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', backgroundColor: '#ffffff', borderRadius: 16, padding: 16, paddingBottom: 0 },
  gridItem: { width: '25%', alignItems: 'center', marginBottom: 20 },
  iconBox: { width: 50, height: 50, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  gridText: { fontSize: 13, color: '#666666' },
  todoCard: { flexDirection: 'row', backgroundColor: '#ffffff', borderRadius: 12, marginBottom: 12, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5, elevation: 2 },
  cardBorderLeft: { width: 4 },
  cardContent: { flex: 1, padding: 16 },
  todoTitle: { fontSize: 16, fontWeight: '600', color: '#333333', marginBottom: 6 },
  todoMeta: { fontSize: 13, color: '#999999', marginBottom: 12 },
  actionBtn: { backgroundColor: '#f0f5ff', alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 12 },
  actionBtnText: { color: '#5a5ce5', fontSize: 12, fontWeight: '600' },
  noticeCard: { flexDirection: 'row', backgroundColor: '#ffffff', borderRadius: 12, padding: 16, marginBottom: 12, alignItems: 'center' },
  noticeBadge: { backgroundColor: '#fef3c7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginRight: 12 },
  noticeBadgeText: { color: '#d97706', fontSize: 12, fontWeight: 'bold' },
  noticeTitle: { fontSize: 15, fontWeight: '500', color: '#333333', marginBottom: 6 },
  // 红色通知角标
  redBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ef4444',
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#5a5ce5'
  },
  redBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: 'bold',
  },
});
