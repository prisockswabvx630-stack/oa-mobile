import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert, Modal, TextInput,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { fetchTasks, createTask, updateTask, deleteTask, completeTask, assignTask } from '../api/services';

export default function TasksScreen() {
  const router = useRouter();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState('medium');

  const loadData = useCallback(async () => {
    try {
      const data = await fetchTasks();
      setTasks(Array.isArray(data) ? data : []);
    } catch (err: any) {
      Alert.alert('加载失败', err?.message || '无法获取任务列表');
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

  const formatDate = (d: string) => {
    if (!d) return '--';
    const date = new Date(d);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const days = Math.ceil(diff / 86400000);
    if (days === 0) return '今天';
    if (days === 1) return '明天';
    if (days === -1) return '昨天';
    return `${date.getMonth() + 1}-${date.getDate()}`;
  };

  const toggleTask = async (item: any) => {
    const isDone = item.status === 'completed';
    try {
      if (isDone) {
        await updateTask(item.id, { status: 'pending' });
        setTasks(prev =>
          prev.map(t => (t.id === item.id ? { ...t, status: 'pending' } : t))
        );
      } else {
        await completeTask(item.id);
        setTasks(prev =>
          prev.map(t => (t.id === item.id ? { ...t, status: 'completed' } : t))
        );
      }
    } catch (err: any) {
      Alert.alert('操作失败', err?.message || '请稍后重试');
    }
  };

  const handleDeleteTask = (item: any) => {
    Alert.alert('确认删除', `确定要删除任务「${item.title}」吗？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteTask(item.id);
            setTasks(prev => prev.filter(t => t.id !== item.id));
            Alert.alert('成功', '任务已删除');
          } catch (err: any) {
            Alert.alert('删除失败', err?.message || '请稍后重试');
          }
        },
      },
    ]);
  };

  const handleCreateTask = async () => {
    if (!newTitle.trim()) {
      Alert.alert('提示', '请输入任务标题');
      return;
    }
    try {
      const created = await createTask({ title: newTitle.trim(), priority: newPriority, status: 'pending' });
      setModalVisible(false);
      setNewTitle('');
      setNewPriority('medium');
      loadData();
      Alert.alert('成功', '任务已创建');
    } catch (err: any) {
      Alert.alert('创建失败', err?.message || '请稍后重试');
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const isDone = item.status === 'completed';
    const priority = item.priority || 'medium';
    const priorityLabel = priority === 'high' ? '高' : priority === 'medium' ? '中' : '低';

    return (
      <TouchableOpacity
        style={[styles.taskCard, isDone && styles.taskCardDone]}
        activeOpacity={0.8}
        onPress={() => toggleTask(item)}
        onLongPress={() => handleDeleteTask(item)}
      >
        <View style={[styles.checkbox, isDone && styles.checkboxDone]}>
          {isDone && <Feather name="check" size={16} color="#ffffff" />}
        </View>
        <View style={styles.taskContent}>
          <Text style={[styles.taskTitle, isDone && styles.taskTitleDone]}>{item.title || '未命名任务'}</Text>
          <View style={styles.taskMeta}>
            <View style={styles.dateBadge}>
              <Feather name="calendar" size={12} color="#999999" />
              <Text style={styles.dateText}>{formatDate(item.due_date || item.deadline)}</Text>
            </View>
            {!isDone && (
              <View
                style={[
                  styles.priorityBadge,
                  priority === 'high' ? styles.priHigh : priority === 'medium' ? styles.priMed : styles.priLow,
                ]}
              >
                <Text
                  style={[
                    styles.priorityText,
                    priority === 'high'
                      ? styles.priTextHigh
                      : priority === 'medium'
                      ? styles.priTextMed
                      : styles.priTextLow,
                  ]}
                >
                  {priorityLabel}优先级
                </Text>
              </View>
            )}
          </View>
          {item.assignee_name && (
            <Text style={styles.assigneeText}>
              <Feather name="user" size={11} color="#94a3b8" /> {item.assignee_name}
            </Text>
          )}
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
        <Text style={styles.headerTitle}>任务管理</Text>
        <TouchableOpacity style={styles.headerIcon} onPress={() => setModalVisible(true)}>
          <Feather name="plus" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#5a5ce5" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={tasks}
          renderItem={renderItem}
          keyExtractor={item => String(item.id)}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#5a5ce5']} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Feather name="check-square" size={48} color="#cbd5e1" />
              <Text style={styles.emptyText}>暂无任务</Text>
            </View>
          }
        />
      )}

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>新建任务</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="请输入任务标题"
              placeholderTextColor="#94a3b8"
              value={newTitle}
              onChangeText={setNewTitle}
            />
            <Text style={styles.modalLabel}>优先级</Text>
            <View style={styles.priorityRow}>
              {(['low', 'medium', 'high'] as const).map(p => (
                <TouchableOpacity
                  key={p}
                  style={[styles.priorityOption, newPriority === p && styles.priorityOptionActive]}
                  onPress={() => setNewPriority(p)}
                >
                  <Text style={[styles.priorityOptionText, newPriority === p && styles.priorityOptionTextActive]}>
                    {p === 'high' ? '高' : p === 'medium' ? '中' : '低'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => {
                  setModalVisible(false);
                  setNewTitle('');
                }}
              >
                <Text style={styles.modalBtnCancelText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.modalBtnConfirm]} onPress={handleCreateTask}>
                <Text style={styles.modalBtnConfirmText}>创建</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  taskCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 2,
  },
  taskCardDone: { opacity: 0.6, backgroundColor: '#fafafa' },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  checkboxDone: { backgroundColor: '#10b981', borderColor: '#10b981' },
  taskContent: { flex: 1 },
  taskTitle: { fontSize: 16, color: '#333333', fontWeight: '500', marginBottom: 8 },
  taskTitleDone: { textDecorationLine: 'line-through', color: '#999999' },
  taskMeta: { flexDirection: 'row', alignItems: 'center' },
  dateBadge: { flexDirection: 'row', alignItems: 'center', marginRight: 12 },
  dateText: { fontSize: 12, color: '#999999', marginLeft: 4 },
  priorityBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  priHigh: { backgroundColor: '#fef2f2' },
  priMed: { backgroundColor: '#fefce8' },
  priLow: { backgroundColor: '#eff6ff' },
  priorityText: { fontSize: 10, fontWeight: 'bold' },
  priTextHigh: { color: '#ef4444' },
  priTextMed: { color: '#f59e0b' },
  priTextLow: { color: '#3b82f6' },
  assigneeText: { fontSize: 12, color: '#94a3b8', marginTop: 6 },
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyText: { fontSize: 14, color: '#94a3b8', marginTop: 12 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333333', marginBottom: 16 },
  modalInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#333333',
    marginBottom: 16,
  },
  modalLabel: { fontSize: 14, color: '#666666', marginBottom: 8 },
  priorityRow: { flexDirection: 'row', marginBottom: 20 },
  priorityOption: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  priorityOptionActive: { borderColor: '#5a5ce5', backgroundColor: '#f0f5ff' },
  priorityOptionText: { fontSize: 14, color: '#666666' },
  priorityOptionTextActive: { color: '#5a5ce5', fontWeight: 'bold' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end' },
  modalBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, marginLeft: 12 },
  modalBtnCancel: { backgroundColor: '#f1f5f9' },
  modalBtnCancelText: { color: '#666666', fontSize: 14, fontWeight: '600' },
  modalBtnConfirm: { backgroundColor: '#5a5ce5' },
  modalBtnConfirmText: { color: '#ffffff', fontSize: 14, fontWeight: '600' },
});
