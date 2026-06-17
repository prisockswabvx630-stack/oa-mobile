import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { fetchNotices } from '../api/services';

export default function NoticesScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('全部');
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotices()
      .then(data => {
        const mapped = data.map((n: any) => ({
          id: String(n.id),
          type: n.type === 'company' ? '公告' : '制度',
          title: n.title,
          date: formatTime(n.publish_time || n.create_time),
          unread: true,
          content: n.content || ''
        }));
        setNotices(mapped);
      })
      .catch(err => console.error('加载公告失败:', err))
      .finally(() => setLoading(false));
  }, []);

  const formatTime = (d: string) => {
    if (!d) return '';
    const date = new Date(d);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    if (diff < 86400000) return `今天 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    if (diff < 172800000) return `昨天 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.card} activeOpacity={0.7}>
      <View style={styles.cardHeader}>
        <View style={styles.titleRow}>
          {item.unread && <View style={styles.unreadDot} />}
          <Text style={[styles.cardTitle, !item.unread && { color: '#999999' }]} numberOfLines={1}>{item.title}</Text>
        </View>
        <Text style={styles.dateText}>{item.date}</Text>
      </View>
      <Text style={styles.contentText} numberOfLines={2}>{item.content}</Text>
      <View style={styles.cardFooter}>
        <View style={[styles.typeBadge, item.type === '公告' ? styles.badgeYellow : styles.badgePurple]}>
          <Text style={[styles.typeText, item.type === '公告' ? styles.textYellow : styles.textPurple]}>{item.type}</Text>
        </View>
        <Feather name="chevron-right" size={16} color="#999999" />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerIcon}>
          <Feather name="arrow-left" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>公告通知</Text>
        <TouchableOpacity style={styles.headerIcon}>
          <Feather name="check-square" size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <View style={styles.container}>
        <View style={styles.tabContainer}>
          {['全部', '系统公告', '规章制度'].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#5a5ce5" style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={notices.filter(n => {
              if (activeTab === '系统公告') return n.type === '公告';
              if (activeTab === '规章制度') return n.type === '制度';
              return true;
            })}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{paddingBottom: 40}}
            ListEmptyComponent={<Text style={{textAlign:'center',color:'#999',marginTop:40}}>暂无公告</Text>}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f5f6f8' },
  header: { backgroundColor: '#5a5ce5', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, height: 56 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#ffffff' },
  headerIcon: { padding: 4 },
  container: { flex: 1, paddingHorizontal: 16 },
  tabContainer: { flexDirection: 'row', marginVertical: 16 },
  tab: { paddingVertical: 6, paddingHorizontal: 16, borderRadius: 20, marginRight: 12, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8f0' },
  activeTab: { backgroundColor: '#f0f5ff', borderColor: '#5a5ce5' },
  tabText: { color: '#666666', fontSize: 13, fontWeight: '600' },
  activeTabText: { color: '#5a5ce5' },
  card: { backgroundColor: '#ffffff', borderRadius: 16, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef4444', marginRight: 8 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#333333', flex: 1 },
  dateText: { fontSize: 12, color: '#999999' },
  contentText: { fontSize: 14, color: '#666666', lineHeight: 22, marginBottom: 16 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f1f1f1', paddingTop: 16 },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  typeText: { fontSize: 12, fontWeight: 'bold' },
  badgeYellow: { backgroundColor: '#fef3c7' },
  textYellow: { color: '#d97706', fontSize: 12, fontWeight: 'bold' },
  badgePurple: { backgroundColor: '#f3e8ff' },
  textPurple: { color: '#9333ea', fontSize: 12, fontWeight: 'bold' },
});
