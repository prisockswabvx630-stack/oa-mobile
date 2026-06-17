import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { fetchOperationLogs } from '../api/services';

export default function OperationLogsScreen() {
  const router = useRouter();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadLogs = async (pageNum: number = 1) => {
    if (pageNum === 1) setLoading(true);
    try {
      const data = await fetchOperationLogs({ page: pageNum, page_size: 20 });
      if (data && data.length > 0) {
        if (pageNum === 1) {
          setLogs(data);
        } else {
          setLogs(prev => [...prev, ...data]);
        }
        setHasMore(data.length >= 20);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error('加载操作日志失败:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadLogs(nextPage);
    }
  };

  const formatTime = (d: string) => {
    if (!d) return '--';
    const date = new Date(d);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
    return `${date.getMonth() + 1}-${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const getActionIcon = (action: string) => {
    if (action?.includes('创建') || action?.includes('新增')) return { name: 'plus-circle', color: '#10b981' };
    if (action?.includes('编辑') || action?.includes('更新')) return { name: 'edit', color: '#3b82f6' };
    if (action?.includes('删除')) return { name: 'trash-2', color: '#ef4444' };
    if (action?.includes('登录')) return { name: 'log-in', color: '#8b5cf6' };
    if (action?.includes('导出')) return { name: 'download', color: '#f59e0b' };
    return { name: 'activity', color: '#6b7280' };
  };

  const renderItem = ({ item }: { item: any }) => {
    const icon = getActionIcon(item.action);
    return (
      <View style={styles.card}>
        <View style={[styles.iconBox, { backgroundColor: icon.color + '20' }]}>
          <Feather name={icon.name as any} size={18} color={icon.color} />
        </View>
        <View style={styles.content}>
          <Text style={styles.actionText}>{item.action || '未知操作'}</Text>
          <Text style={styles.detailText} numberOfLines={2}>
            {item.user_name || '系统'} - {item.detail || item.module || '无详情'}
          </Text>
          <Text style={styles.timeText}>{formatTime(item.create_time)}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerIcon}>
          <Feather name="arrow-left" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>操作日志</Text>
        <View style={styles.headerIcon} />
      </View>

      {loading && page === 1 ? (
        <ActivityIndicator size="large" color="#5a5ce5" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={logs}
          renderItem={renderItem}
          keyExtractor={(item, index) => item.id?.toString() || index.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loading && page > 1 ? (
              <ActivityIndicator size="small" color="#5a5ce5" style={{ marginVertical: 16 }} />
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Feather name="file-text" size={48} color="#ccc" />
              <Text style={styles.emptyText}>暂无操作日志</Text>
            </View>
          }
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
  listContainer: { padding: 16, paddingBottom: 40 },
  card: { flexDirection: 'row', backgroundColor: '#ffffff', borderRadius: 12, padding: 14, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5, elevation: 2 },
  iconBox: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  content: { flex: 1 },
  actionText: { fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 4 },
  detailText: { fontSize: 13, color: '#666', marginBottom: 4 },
  timeText: { fontSize: 12, color: '#999' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, color: '#999', marginTop: 12 },
});
