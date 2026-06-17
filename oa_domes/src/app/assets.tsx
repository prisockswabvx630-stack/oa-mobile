import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView,
  ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { fetchAssets, createAsset, updateAsset, deleteAsset } from '../api/services';

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  '在用': { bg: '#ecfdf5', text: '#10b981' },
  '闲置': { bg: '#fef3c7', text: '#d97706' },
  '报废': { bg: '#fef2f2', text: '#ef4444' },
};

export default function AssetsScreen() {
  const router = useRouter();
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('在用设备');

  const loadData = useCallback(async () => {
    try {
      const data = await fetchAssets();
      setAssets(Array.isArray(data) ? data : []);
    } catch (err: any) {
      Alert.alert('加载失败', err?.message || '无法获取资产列表');
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

  const filteredData = assets.filter(item =>
    activeTab === '全部' ? true :
    activeTab === '在用设备' ? item.status === '在用' :
    activeTab === '闲置设备' ? item.status === '闲置' :
    item.status === '报废'
  );

  const handleCardPress = (item: any) => {
    Alert.alert(
      item.name || '资产详情',
      `类别: ${item.category || '--'}\n型号: ${item.model || '--'}\n编号: ${item.code || '--'}\n使用人: ${item.user || '--'}\n状态: ${item.status || '--'}`,
      [
        {
          text: item.status === '在用' ? '标记闲置' : item.status === '闲置' ? '标记在用' : '删除',
          style: item.status === '报废' ? 'destructive' : 'default',
          onPress: () =>
            item.status === '报废'
              ? handleDelete(item)
              : handleToggleStatus(item),
        },
        { text: '关闭', style: 'cancel' },
      ]
    );
  };

  const handleToggleStatus = async (item: any) => {
    const nextStatus = item.status === '在用' ? '闲置' : '在用';
    try {
      await updateAsset(item.id, { status: nextStatus });
      setAssets(prev =>
        prev.map(a => (a.id === item.id ? { ...a, status: nextStatus } : a))
      );
      Alert.alert('成功', `资产已标记为「${nextStatus}」`);
    } catch (err: any) {
      Alert.alert('操作失败', err?.message || '请稍后重试');
    }
  };

  const handleDelete = (item: any) => {
    Alert.alert('确认删除', `确定要删除资产「${item.name}」吗？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除', style: 'destructive',
        onPress: async () => {
          try {
            await deleteAsset(item.id);
            setAssets(prev => prev.filter(a => a.id !== item.id));
            Alert.alert('成功', '资产已删除');
          } catch (err: any) {
            Alert.alert('删除失败', err?.message || '请稍后重试');
          }
        },
      },
    ]);
  };

  const handleAddAsset = () => {
    Alert.alert('新增资产', '请输入资产名称', [
      { text: '取消', style: 'cancel' },
      {
        text: '创建示例资产',
        onPress: async () => {
          try {
            await createAsset({ name: '新资产', category: '办公设备', status: '闲置' });
            loadData();
            Alert.alert('成功', '资产已创建');
          } catch (err: any) {
            Alert.alert('创建失败', err?.message || '请稍后重试');
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: any }) => {
    const statusStyle = STATUS_COLORS[item.status] || STATUS_COLORS['闲置'];
    const categoryIcon = item.category === '办公设备' ? 'monitor' : 'briefcase';

    return (
      <TouchableOpacity style={styles.card} activeOpacity={0.8} onPress={() => handleCardPress(item)}>
        <View style={styles.cardHeader}>
          <View style={styles.titleRow}>
            <Feather name={categoryIcon} size={18} color="#5a5ce5" style={{ marginRight: 8 }} />
            <Text style={styles.title}>{item.name || '未命名资产'}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.statusText, { color: statusStyle.text }]}>{item.status || '--'}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>资产类别</Text>
          <Text style={styles.infoValue}>{item.category || '--'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>型号</Text>
          <Text style={styles.infoValue}>{item.model || '--'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>使用人</Text>
          <Text style={styles.infoValue}>{item.user || '--'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>资产编号</Text>
          <Text style={styles.infoValue}>{item.code || '--'}</Text>
        </View>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => Alert.alert('发起维修', `为资产「${item.name}」发起维修申请`)}
        >
          <Text style={styles.actionBtnText}>发起维修</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerIcon}>
          <Feather name="arrow-left" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>资产管理</Text>
        <TouchableOpacity style={styles.headerIcon} onPress={handleAddAsset}>
          <Feather name="plus" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabsWrapper}>
        {['全部', '在用设备', '闲置设备'].map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabItem, activeTab === tab && styles.tabItemActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#5a5ce5" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filteredData}
          renderItem={renderItem}
          keyExtractor={item => String(item.id)}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#5a5ce5']} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Feather name="package" size={48} color="#cbd5e1" />
              <Text style={styles.emptyText}>暂无资产数据</Text>
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
  tabsWrapper: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f1f1',
  },
  tabItem: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: { borderBottomColor: '#5a5ce5' },
  tabText: { fontSize: 15, color: '#999999' },
  tabTextActive: { color: '#5a5ce5', fontWeight: 'bold' },
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  title: { fontSize: 16, fontWeight: 'bold', color: '#333333', flex: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 11, fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: '#f1f1f1', marginBottom: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  infoLabel: { fontSize: 13, color: '#999999' },
  infoValue: { fontSize: 13, color: '#333333', fontWeight: '500' },
  actionBtn: {
    marginTop: 12,
    backgroundColor: '#f0f5ff',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  actionBtnText: { color: '#5a5ce5', fontSize: 14, fontWeight: 'bold' },
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyText: { fontSize: 14, color: '#94a3b8', marginTop: 12 },
});
