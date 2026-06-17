import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { fetchProcessTemplates } from '../api/services';

export default function WorkflowsScreen() {
  const router = useRouter();
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('全部模板');

  const loadData = useCallback(async () => {
    try {
      const data = await fetchProcessTemplates();
      setTemplates(Array.isArray(data) ? data : []);
    } catch (err: any) {
      Alert.alert('加载失败', err?.message || '无法获取流程模板');
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

  const filteredData = templates.filter(item => {
    if (activeTab === '全部模板') return true;
    if (activeTab === '已启用') return item.status === '已启用' || item.status === '启用' || item.enabled;
    if (activeTab === '已停用') return item.status === '已停用' || item.status === '停用' || !item.enabled;
    return true;
  });

  const handleCardPress = (item: any) => {
    Alert.alert(
      item.name || '流程模板详情',
      `编码: ${item.code || '--'}\n范围: ${item.scope || '--'}\n状态: ${item.status || '--'}\n描述: ${item.description || '无'}`,
      [
        {
          text: item.enabled || item.status === '已启用' ? '停用' : '启用',
          onPress: () => {
            Alert.alert('提示', `已${item.enabled || item.status === '已启用' ? '停用' : '启用'}模板「${item.name}」`);
          },
        },
        { text: '关闭', style: 'cancel' },
      ]
    );
  };

  const renderItem = ({ item }: { item: any }) => {
    const isEnabled = item.enabled || item.status === '已启用' || item.status === '启用';

    return (
      <TouchableOpacity style={styles.card} activeOpacity={0.8} onPress={() => handleCardPress(item)}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{item.name || '未命名模板'}</Text>
          <Text style={[styles.statusText, isEnabled ? styles.statusActive : styles.statusInactive]}>
            {item.status || (isEnabled ? '已启用' : '已停用')}
          </Text>
        </View>
        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <Feather name="code" size={14} color="#999999" />
            <Text style={styles.infoText}>编码: {item.code || '--'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Feather name="layers" size={14} color="#999999" />
            <Text style={styles.infoText}>适用范围: {item.scope || '--'}</Text>
          </View>
        </View>
        <View style={styles.cardFooter}>
          <View style={styles.stepContainer}>
            <View style={[styles.stepDot, { backgroundColor: isEnabled ? '#10b981' : '#94a3b8' }]} />
            <Text style={styles.stepText}>
              版本: <Text style={{ color: '#333333', fontWeight: 'bold' }}>{item.version || '--'}</Text>
            </Text>
          </View>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => Alert.alert('发起流程', `使用模板「${item.name}」发起新流程`)}
          >
            <Text style={styles.actionBtnText}>发起</Text>
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
        <Text style={styles.headerTitle}>流程管理</Text>
        <TouchableOpacity style={styles.headerIcon}>
          <Feather name="plus" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabsWrapper}>
        {['全部模板', '已启用', '已停用'].map(tab => (
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
              <Feather name="git-branch" size={48} color="#cbd5e1" />
              <Text style={styles.emptyText}>暂无流程模板</Text>
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
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: { borderBottomColor: '#5a5ce5' },
  tabText: { fontSize: 15, color: '#999999' },
  activeTabText: { color: '#5a5ce5', fontWeight: 'bold' },
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
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#333333', flex: 1 },
  statusText: { fontSize: 12, fontWeight: 'bold' },
  statusActive: { color: '#10b981' },
  statusInactive: { color: '#94a3b8' },
  cardBody: { marginBottom: 16 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  infoText: { fontSize: 13, color: '#666666', marginLeft: 8 },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f1f1',
  },
  stepContainer: { flexDirection: 'row', alignItems: 'center' },
  stepDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  stepText: { fontSize: 13, color: '#999999' },
  actionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: '#f0f5ff',
    borderRadius: 12,
  },
  actionBtnText: { color: '#5a5ce5', fontSize: 13, fontWeight: '600' },
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyText: { fontSize: 14, color: '#94a3b8', marginTop: 12 },
});
