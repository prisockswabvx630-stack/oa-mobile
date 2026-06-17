import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { fetchHandovers, createHandover, updateHandover } from '../api/services';

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  '待确认': { bg: '#fef3c7', text: '#d97706' },
  '交接中': { bg: '#eff6ff', text: '#3b82f6' },
  '已完成': { bg: '#ecfdf5', text: '#10b981' },
};

export default function HandoverScreen() {
  const router = useRouter();
  const [handovers, setHandovers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const data = await fetchHandovers();
      setHandovers(Array.isArray(data) ? data : []);
    } catch (err: any) {
      Alert.alert('加载失败', err?.message || '无法获取交接列表');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleCardPress = (item: any) => {
    Alert.alert(
      item.title || '交接详情',
      `发送人: ${item.sender || '--'}\n接收人: ${item.receiver || '--'}\n进度: ${item.progress || 0}%\n状态: ${item.status || '--'}`,
      [
        {
          text: item.status === '待确认' ? '确认接收' : '标记完成',
          onPress: () => handleUpdateStatus(item),
        },
        { text: '关闭', style: 'cancel' },
      ]
    );
  };

  const handleUpdateStatus = async (item: any) => {
    const nextStatus = item.status === '待确认' ? '交接中' : '已完成';
    try {
      await updateHandover(item.id, { status: nextStatus });
      setHandovers(prev =>
        prev.map(h => (h.id === item.id ? { ...h, status: nextStatus } : h))
      );
      Alert.alert('成功', `已更新为「${nextStatus}」`);
    } catch (err: any) {
      Alert.alert('操作失败', err?.message || '请稍后重试');
    }
  };

  const handleAddHandover = () => {
    Alert.alert('新建交接', '请输入交接标题', [
      { text: '取消', style: 'cancel' },
      {
        text: '创建示例交接',
        onPress: async () => {
          try {
            await createHandover({ title: '新工作交接', status: '待确认', progress: 0 });
            loadData();
            Alert.alert('成功', '交接已创建');
          } catch (err: any) {
            Alert.alert('创建失败', err?.message || '请稍后重试');
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: any }) => {
    const statusStyle = STATUS_COLORS[item.status] || STATUS_COLORS['待确认'];
    const progress = item.progress != null ? Number(item.progress) : 0;

    return (
      <TouchableOpacity style={styles.card} activeOpacity={0.8} onPress={() => handleCardPress(item)}>
        <View style={styles.cardTop}>
          <View style={styles.iconBox}>
            <Feather name="refresh-cw" size={20} color="#5a5ce5" />
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.taskTitle}>{item.title || '未命名交接'}</Text>
            <Text style={styles.taskMeta}>
              交接给: {item.receiver || '--'} · 发起: {item.sender || '--'}
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.badgeText, { color: statusStyle.text }]}>{item.status || '待确认'}</Text>
          </View>
        </View>
        <View style={styles.progressRow}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progress}%`,
                  backgroundColor: item.status === '已完成' ? '#10b981' : '#5a5ce5',
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>{progress}%</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerIcon}>
          <Feather name="arrow-left" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>工作交接</Text>
        <TouchableOpacity style={styles.headerIcon} onPress={handleAddHandover}>
          <Feather name="plus" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#5a5ce5" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={handovers}
          renderItem={renderItem}
          keyExtractor={item => String(item.id)}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#5a5ce5']} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Feather name="refresh-cw" size={48} color="#cbd5e1" />
              <Text style={styles.emptyText}>暂无交接数据</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f5f6f8' },
  header: {
    backgroundColor: '#5a5ce5',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 56,
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#ffffff' },
  headerIcon: { padding: 4 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 2,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#f0f5ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoBox: { flex: 1 },
  taskTitle: { fontSize: 16, fontWeight: 'bold', color: '#333333', marginBottom: 4 },
  taskMeta: { fontSize: 12, color: '#999999' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: 'bold' },
  progressRow: { flexDirection: 'row', alignItems: 'center' },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#f1f1f1',
    borderRadius: 3,
    marginRight: 12,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 3 },
  progressText: { fontSize: 12, color: '#666666', fontWeight: 'bold', width: 36, textAlign: 'right' },
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyText: { fontSize: 14, color: '#94a3b8', marginTop: 12 },
});
