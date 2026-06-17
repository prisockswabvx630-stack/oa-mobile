import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert, ActivityIndicator, RefreshControl, TextInput, Modal } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { fetchSchedules, createSchedule, deleteSchedule } from '../api/services';

const TYPE_COLORS: Record<string, string> = {
  meeting: '#3b82f6',
  interview: '#10b981',
  task: '#f59e0b',
  reminder: '#ef4444',
  default: '#8b5cf6',
};

export default function ScheduleScreen() {
  const router = useRouter();
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newLocation, setNewLocation] = useState('');

  const today = new Date();
  const dateStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
  const weekStr = `星期${weekDays[today.getDay()]}`;

  const loadData = useCallback(async () => {
    try {
      const data = await fetchSchedules();
      setSchedules(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('加载日程失败:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleCreate = async () => {
    if (!newTitle.trim()) {
      Alert.alert('提示', '请输入日程标题');
      return;
    }
    try {
      const now = new Date();
      const startTime = newTime ? new Date(`${now.toISOString().slice(0, 10)}T${newTime}:00`) : now;
      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
      await createSchedule({
        title: newTitle.trim(),
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        location: newLocation.trim() || '',
      });
      setShowModal(false);
      setNewTitle('');
      setNewTime('');
      setNewLocation('');
      loadData();
    } catch (err: any) {
      Alert.alert('创建失败', err.message || '请稍后重试');
    }
  };

  const handleDelete = (id: number, title: string) => {
    Alert.alert('删除日程', `确认删除「${title}」？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除', style: 'destructive', onPress: async () => {
          try {
            await deleteSchedule(id);
            loadData();
          } catch (err: any) {
            Alert.alert('删除失败', err.message || '请稍后重试');
          }
        }
      },
    ]);
  };

  const formatTime = (isoStr: string) => {
    if (!isoStr) return '--:--';
    const d = new Date(isoStr);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const formatDuration = (start: string, end: string) => {
    if (!start || !end) return '';
    const diff = new Date(end).getTime() - new Date(start).getTime();
    const min = Math.round(diff / 60000);
    if (min < 60) return `${min}分钟`;
    return `${(min / 60).toFixed(1).replace('.0', '')}小时`;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerIcon}>
          <Feather name="arrow-left" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>日程管理</Text>
        <TouchableOpacity style={styles.headerIcon} onPress={() => setShowModal(true)}>
          <Feather name="plus" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <View style={styles.container}>
        <View style={styles.dateSelector}>
          <Feather name="calendar" size={20} color="#5a5ce5" />
          <Text style={styles.dateText}>{dateStr}, {weekStr}</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#5a5ce5" style={{ marginTop: 40 }} />
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          >
            {schedules.length === 0 ? (
              <View style={styles.emptyState}>
                <Feather name="calendar" size={48} color="#d1d5db" />
                <Text style={styles.emptyText}>暂无日程安排</Text>
                <TouchableOpacity style={styles.emptyBtn} onPress={() => setShowModal(true)}>
                  <Text style={styles.emptyBtnText}>添加日程</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.timelineContainer}>
                {schedules.map((item, index) => {
                  const color = TYPE_COLORS[item.type] || TYPE_COLORS.default;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.timelineRow}
                      onLongPress={() => handleDelete(item.id, item.title)}
                    >
                      <View style={styles.timeColumn}>
                        <Text style={styles.timeText}>{formatTime(item.start_time)}</Text>
                        <Text style={styles.durationText}>{formatDuration(item.start_time, item.end_time)}</Text>
                      </View>

                      <View style={styles.lineColumn}>
                        <View style={[styles.dot, { borderColor: color }]} />
                        {index !== schedules.length - 1 && <View style={styles.line} />}
                      </View>

                      <View style={styles.contentColumn}>
                        <View style={styles.card}>
                          <View style={[styles.cardBorder, { backgroundColor: color }]} />
                          <View style={styles.cardInner}>
                            <Text style={styles.cardTitle}>{item.title}</Text>
                            {item.location ? (
                              <View style={styles.cardFooter}>
                                <Feather name="map-pin" size={12} color="#999999" />
                                <Text style={styles.cardFooterText}>{item.location}</Text>
                              </View>
                            ) : null}
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </ScrollView>
        )}
      </View>

      {/* 新建日程弹窗 */}
      <Modal visible={showModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>新建日程</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="日程标题"
              value={newTitle}
              onChangeText={setNewTitle}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="时间 (如 14:00)"
              value={newTime}
              onChangeText={setNewTime}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="地点 (可选)"
              value={newLocation}
              onChangeText={setNewLocation}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setShowModal(false)}>
                <Text style={styles.modalCancelText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={handleCreate}>
                <Text style={styles.modalConfirmText}>创建</Text>
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
  header: { backgroundColor: '#5a5ce5', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, height: 56 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#ffffff' },
  headerIcon: { padding: 4 },
  container: { flex: 1, paddingHorizontal: 16 },
  dateSelector: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12, marginVertical: 16, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5, elevation: 2 },
  dateText: { flex: 1, color: '#333333', fontSize: 15, fontWeight: 'bold', marginLeft: 12 },
  emptyState: { alignItems: 'center', marginTop: 80 },
  emptyText: { color: '#999999', fontSize: 15, marginTop: 16 },
  emptyBtn: { backgroundColor: '#5a5ce5', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20, marginTop: 16 },
  emptyBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '600' },
  timelineContainer: { marginTop: 10 },
  timelineRow: { flexDirection: 'row', minHeight: 90 },
  timeColumn: { width: 50, alignItems: 'flex-end', paddingTop: 2 },
  timeText: { fontSize: 14, fontWeight: 'bold', color: '#333333' },
  durationText: { fontSize: 12, color: '#999999', marginTop: 4 },
  lineColumn: { width: 40, alignItems: 'center' },
  dot: { width: 14, height: 14, borderRadius: 7, borderWidth: 3, backgroundColor: '#ffffff', zIndex: 10, marginTop: 2 },
  line: { width: 2, flex: 1, backgroundColor: '#e2e8f0', marginTop: -14, marginBottom: -4, zIndex: 1 },
  contentColumn: { flex: 1, paddingBottom: 24 },
  card: { flexDirection: 'row', backgroundColor: '#ffffff', borderRadius: 12, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5, elevation: 2 },
  cardBorder: { width: 4 },
  cardInner: { flex: 1, padding: 16 },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#333333', marginBottom: 4 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  cardFooterText: { fontSize: 12, color: '#999999', marginLeft: 6 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#ffffff', borderRadius: 16, padding: 24, width: '85%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333333', marginBottom: 20, textAlign: 'center' },
  modalInput: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, marginBottom: 12 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 },
  modalCancel: { paddingHorizontal: 20, paddingVertical: 10, marginRight: 12 },
  modalCancelText: { color: '#999999', fontSize: 15 },
  modalConfirm: { backgroundColor: '#5a5ce5', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  modalConfirmText: { color: '#ffffff', fontSize: 15, fontWeight: '600' },
});
