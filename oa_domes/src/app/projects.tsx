import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert, Image,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { fetchProjects, createProject, updateProject, deleteProject } from '../api/services';

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  '进行中': { bg: '#f0f5ff', text: '#5a5ce5' },
  '已完成': { bg: '#ecfdf5', text: '#10b981' },
  '未开始': { bg: '#f1f5f9', text: '#64748b' },
};

export default function ProjectsScreen() {
  const router = useRouter();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const data = await fetchProjects();
      setProjects(Array.isArray(data) ? data : []);
    } catch (err: any) {
      Alert.alert('加载失败', err?.message || '无法获取项目列表');
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
      item.name || '项目详情',
      `状态: ${item.status || '--'}\n进度: ${item.progress ?? 0}%\n负责人: ${item.owner || '--'}\n剩余天数: ${item.daysLeft ?? '--'}`,
      [
        { text: '删除', style: 'destructive', onPress: () => handleDelete(item) },
        { text: '完成', onPress: () => handleComplete(item) },
        { text: '关闭', style: 'cancel' },
      ]
    );
  };

  const handleDelete = (item: any) => {
    Alert.alert('确认删除', `确定要删除项目「${item.name}」吗？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除', style: 'destructive',
        onPress: async () => {
          try {
            await deleteProject(item.id);
            setProjects(prev => prev.filter(p => p.id !== item.id));
            Alert.alert('成功', '项目已删除');
          } catch (err: any) {
            Alert.alert('删除失败', err?.message || '请稍后重试');
          }
        },
      },
    ]);
  };

  const handleComplete = async (item: any) => {
    try {
      await updateProject(item.id, { status: '已完成', progress: 100 });
      setProjects(prev =>
        prev.map(p => (p.id === item.id ? { ...p, status: '已完成', progress: 100 } : p))
      );
      Alert.alert('成功', '项目已标记为完成');
    } catch (err: any) {
      Alert.alert('操作失败', err?.message || '请稍后重试');
    }
  };

  const handleAddProject = () => {
    Alert.alert('新建项目', '请输入项目名称', [
      { text: '取消', style: 'cancel' },
      {
        text: '创建示例项目',
        onPress: async () => {
          try {
            await createProject({ name: '新项目', status: '未开始', progress: 0 });
            loadData();
            Alert.alert('成功', '项目已创建');
          } catch (err: any) {
            Alert.alert('创建失败', err?.message || '请稍后重试');
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: any }) => {
    const statusStyle = STATUS_COLORS[item.status] || STATUS_COLORS['未开始'];
    const progress = item.progress ?? 0;

    return (
      <TouchableOpacity style={styles.card} activeOpacity={0.8} onPress={() => handleCardPress(item)}>
        <View style={styles.cardHeader}>
          <Text style={styles.projectTitle}>{item.name || '未命名项目'}</Text>
          <Feather name="more-horizontal" size={20} color="#999999" />
        </View>

        <View style={styles.statusRow}>
          <View style={[styles.badge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.badgeText, { color: statusStyle.text }]}>{item.status || '未开始'}</Text>
          </View>
          <Text style={styles.daysText}>
            {item.daysLeft > 0 ? `剩余 ${item.daysLeft} 天` : item.status === '已完成' ? '已按时交付' : '--'}
          </Text>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>项目进度</Text>
            <Text style={styles.progressValue}>{progress}%</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${progress}%`,
                  backgroundColor:
                    progress === 100 ? '#10b981' : progress < 50 ? '#ef4444' : '#5a5ce5',
                },
              ]}
            />
          </View>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.ownerText}>
            <Feather name="user" size={12} color="#999" /> {item.owner || '--'}
          </Text>
          <TouchableOpacity
            style={styles.enterBtn}
            onPress={() => Alert.alert('进入项目', `进入「${item.name}」`)}
          >
            <Text style={styles.enterBtnText}>进入项目</Text>
          </TouchableOpacity>
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
        <Text style={styles.headerTitle}>项目管理</Text>
        <TouchableOpacity style={styles.headerIcon} onPress={handleAddProject}>
          <Feather name="plus" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#5a5ce5" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={projects}
          renderItem={renderItem}
          keyExtractor={item => String(item.id)}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#5a5ce5']} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Feather name="folder" size={48} color="#cbd5e1" />
              <Text style={styles.emptyText}>暂无项目数据</Text>
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
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  projectTitle: { fontSize: 18, fontWeight: 'bold', color: '#333333', flex: 1 },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 12, fontWeight: 'bold' },
  daysText: { fontSize: 13, color: '#999999' },
  progressContainer: { marginBottom: 20 },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: { fontSize: 13, color: '#666666' },
  progressValue: { fontSize: 13, fontWeight: 'bold', color: '#333333' },
  progressBarBg: {
    height: 8,
    backgroundColor: '#f1f1f1',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: { height: '100%', borderRadius: 4 },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f1f1',
  },
  ownerText: { fontSize: 13, color: '#999999' },
  enterBtn: {
    backgroundColor: '#5a5ce5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  enterBtnText: { color: '#ffffff', fontSize: 13, fontWeight: 'bold' },
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyText: { fontSize: 14, color: '#94a3b8', marginTop: 12 },
});
