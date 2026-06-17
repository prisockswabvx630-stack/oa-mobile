import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { fetchRecycleBin, recoverRecycleItem, deleteRecycleItem, cleanRecycleBin } from '../api/services';

export default function RecycleBinScreen() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRecycleBin = async () => {
    setLoading(true);
    try {
      const data = await fetchRecycleBin();
      setItems(data || []);
    } catch (err) {
      console.error('加载回收站失败:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecycleBin();
  }, []);

  const handleRecover = async (id: number | string, type: string) => {
    Alert.alert('恢复确认', '确定要恢复这条数据吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '恢复',
        onPress: async () => {
          try {
            await recoverRecycleItem(id, type);
            Alert.alert('成功', '数据已恢复');
            await loadRecycleBin();
          } catch (err: any) {
            Alert.alert('恢复失败', err.message || '系统错误');
          }
        }
      }
    ]);
  };

  const handleDelete = async (id: number | string, type: string) => {
    Alert.alert('永久删除', '确定要永久删除这条数据吗？此操作不可撤销。', [
      { text: '取消', style: 'cancel' },
      {
        text: '永久删除',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteRecycleItem(id, type);
            Alert.alert('成功', '数据已永久删除');
            await loadRecycleBin();
          } catch (err: any) {
            Alert.alert('删除失败', err.message || '系统错误');
          }
        }
      }
    ]);
  };

  const handleCleanAll = () => {
    Alert.alert('清空回收站', '确定要清空回收站吗？所有数据将被永久删除，此操作不可撤销。', [
      { text: '取消', style: 'cancel' },
      {
        text: '清空',
        style: 'destructive',
        onPress: async () => {
          try {
            await cleanRecycleBin();
            Alert.alert('成功', '回收站已清空');
            await loadRecycleBin();
          } catch (err: any) {
            Alert.alert('清空失败', err.message || '系统错误');
          }
        }
      }
    ]);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'user': return { name: 'user', color: '#3b82f6' };
      case 'department': return { name: 'building', color: '#8b5cf6' };
      case 'task': return { name: 'check-circle', color: '#10b981' };
      case 'notice': return { name: 'bell', color: '#f59e0b' };
      case 'document': return { name: 'file', color: '#6366f1' };
      case 'project': return { name: 'folder', color: '#ec4899' };
      default: return { name: 'archive', color: '#6b7280' };
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case 'user': return '用户';
      case 'department': return '部门';
      case 'task': return '任务';
      case 'notice': return '公告';
      case 'document': return '文档';
      case 'project': return '项目';
      default: return '数据';
    }
  };

  const formatTime = (d: string) => {
    if (!d) return '--';
    const date = new Date(d);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const renderItem = ({ item }: { item: any }) => {
    const icon = getTypeIcon(item.type);
    return (
      <View style={styles.card}>
        <View style={[styles.iconBox, { backgroundColor: icon.color + '20' }]}>
          <Feather name={icon.name as any} size={20} color={icon.color} />
        </View>
        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={1}>{item.name || item.title || '未知'}</Text>
            <View style={[styles.typeBadge, { backgroundColor: icon.color + '20' }]}>
              <Text style={[styles.typeText, { color: icon.color }]}>{getTypeName(item.type)}</Text>
            </View>
          </View>
          <Text style={styles.timeText}>删除于 {formatTime(item.deleted_at || item.create_time)}</Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.recoverBtn}
            onPress={() => handleRecover(item.id, item.type)}
          >
            <Feather name="rotate-ccw" size={16} color="#10b981" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => handleDelete(item.id, item.type)}
          >
            <Feather name="trash-2" size={16} color="#ef4444" />
          </TouchableOpacity>
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
        <Text style={styles.headerTitle}>回收站</Text>
        {items.length > 0 && (
          <TouchableOpacity style={styles.headerIcon} onPress={handleCleanAll}>
            <Feather name="trash" size={20} color="#ffffff" />
          </TouchableOpacity>
        )}
      </View>

      {items.length > 0 && (
        <View style={styles.infoBar}>
          <Text style={styles.infoText}>共 {items.length} 条已删除数据</Text>
        </View>
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#5a5ce5" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item, index) => item.id?.toString() || index.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Feather name="trash-2" size={48} color="#ccc" />
              <Text style={styles.emptyText}>回收站为空</Text>
              <Text style={styles.emptySubText}>已删除的数据将在此保留30天</Text>
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
  infoBar: { backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f1f1' },
  infoText: { fontSize: 13, color: '#666' },
  listContainer: { padding: 16, paddingBottom: 40 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 12, padding: 14, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5, elevation: 2 },
  iconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  content: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  title: { fontSize: 15, fontWeight: '600', color: '#333', flex: 1, marginRight: 8 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  typeText: { fontSize: 11, fontWeight: '600' },
  timeText: { fontSize: 12, color: '#999' },
  actions: { flexDirection: 'row', gap: 8 },
  recoverBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#ecfdf5', justifyContent: 'center', alignItems: 'center' },
  deleteBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#fef2f2', justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, color: '#999', marginTop: 12 },
  emptySubText: { fontSize: 13, color: '#ccc', marginTop: 4 },
});
