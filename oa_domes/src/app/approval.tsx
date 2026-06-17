import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { fetchApprovals, updateApproval } from '../api/services';
import { getCurrentUser } from '../api/session';

const BADGE_MAP: Record<string, { bg: string; text: string }> = {
  'leave': { bg: '#bfdbfe', text: '#3b82f6' },
  'expense': { bg: '#fef3c7', text: '#d97706' },
  'travel': { bg: '#dcfce7', text: '#16a34a' },
  'overtime': { bg: '#f3e8ff', text: '#9333ea' },
};

const TYPE_LABELS: Record<string, string> = {
  'leave': '请假',
  'expense': '报销',
  'travel': '出差',
  'overtime': '加班',
};

export default function ApprovalScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('pending');
  const [approvals, setApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    setCurrentUser(getCurrentUser());
  }, []);

  const formatDateTime = (d: string) => {
    if (!d) return '';
    const date = new Date(d);
    return `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const loadApprovals = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      let data = [];
      if (activeTab === 'pending') {
        const allPending = await fetchApprovals({ status: 'pending' });
        // Filter out those initiated by me
        data = allPending.filter((a: any) => Number(a.applicant_id) !== Number(currentUser.id));
      } else if (activeTab === 'initiated') {
        data = await fetchApprovals({ applicant_id: currentUser.id });
      } else {
        const all = await fetchApprovals();
        data = all.filter((a: any) => a.status === 'approved' || a.status === 'rejected');
      }

      const mapped = data.map((a: any) => {
        const badge = BADGE_MAP[a.type] || { bg: '#e5e7eb', text: '#6b7280' };
        return {
          id: String(a.id),
          type: TYPE_LABELS[a.type] || a.type,
          applicant: a.applicant_name || '未知',
          dept: a.dept_name || '',
          reason: a.title,
          content: a.content || '',
          status: a.status,
          date: formatDateTime(a.create_time),
          badgeColor: badge.bg,
          badgeText: badge.text
        };
      });
      setApprovals(mapped);
    } catch (err) {
      console.error('加载审批失败:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApprovals();
  }, [activeTab, currentUser]);

  const handleAction = async (id: string, newStatus: string) => {
    try {
      setLoading(true);
      await updateApproval(id, { status: newStatus });
      Alert.alert('提示', '处理成功');
      await loadApprovals();
    } catch (err: any) {
      Alert.alert('处理失败', err.message || '系统错误');
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={[styles.badge, { backgroundColor: item.badgeColor }]}>
          <Text style={[styles.badgeText, { color: item.badgeText }]}>{item.type}</Text>
        </View>
        <Text style={styles.dateText}>{item.date}</Text>
      </View>

      <Text style={styles.title}>{item.reason}</Text>
      <View style={styles.metaRow}>
        <Feather name="info" size={14} color="#999999" />
        <Text style={styles.metaText} numberOfLines={1}>{item.content || '无详情描述'}</Text>
      </View>

      <View style={styles.cardBottom}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}><Text style={styles.avatarLetter}>{item.applicant[0] || 'U'}</Text></View>
          <Text style={styles.userName}>{item.applicant} · {item.dept}</Text>
        </View>
        
        {activeTab === 'pending' ? (
          <View style={styles.actions}>
            <TouchableOpacity style={styles.btnReject} onPress={() => handleAction(item.id, '已拒绝')}>
              <Text style={styles.textReject}>拒绝</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnApprove} onPress={() => handleAction(item.id, '已通过')}>
              <Text style={styles.textApprove}>同意</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.actions}>
            <Text style={{
              fontSize: 13,
              fontWeight: 'bold',
              color: item.status === 'approved' ? '#10b981' : (item.status === 'rejected' ? '#ef4444' : '#f59e0b')
            }}>
              {item.status === 'approved' ? '已同意' : (item.status === 'rejected' ? '已拒绝' : '审批中')}
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerIcon}>
          <Feather name="arrow-left" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>审批中心</Text>
        <TouchableOpacity style={styles.headerIcon}>
          <Feather name="plus" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabsWrapper}>
        {[{ key: 'pending', label: '待我审批' }, { key: 'initiated', label: '我已发起' }, { key: 'approved', label: '我已审批' }].map(tab => (
          <TouchableOpacity key={tab.key} style={[styles.tabItem, activeTab === tab.key && styles.tabItemActive]} onPress={() => setActiveTab(tab.key)}>
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#5a5ce5" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={approvals}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f5f6f8' },
  header: { backgroundColor: '#5a5ce5', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, height: 56 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#ffffff' },
  headerIcon: { padding: 4 },
  tabsWrapper: { flexDirection: 'row', backgroundColor: '#ffffff', paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#f1f1f1' },
  tabItem: { flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabItemActive: { borderBottomColor: '#5a5ce5' },
  tabText: { fontSize: 15, color: '#999999' },
  tabTextActive: { color: '#5a5ce5', fontWeight: 'bold' },
  list: { padding: 16, paddingBottom: 40 },
  card: { backgroundColor: '#ffffff', borderRadius: 12, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  badgeText: { fontSize: 12, fontWeight: 'bold' },
  dateText: { fontSize: 12, color: '#999999' },
  title: { fontSize: 17, fontWeight: 'bold', color: '#333333', marginBottom: 8 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  metaText: { fontSize: 14, color: '#666666', marginLeft: 6 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f5f5f5', paddingTop: 16 },
  userInfo: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#e0e7ff', justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  avatarLetter: { color: '#5a5ce5', fontSize: 14, fontWeight: 'bold' },
  userName: { fontSize: 14, color: '#333333' },
  actions: { flexDirection: 'row' },
  btnReject: { backgroundColor: '#fef2f2', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 16, marginRight: 8 },
  textReject: { color: '#ef4444', fontSize: 13, fontWeight: '500' },
  btnApprove: { backgroundColor: '#ecfdf5', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 16 },
  textApprove: { color: '#10b981', fontSize: 13, fontWeight: '500' }
});
