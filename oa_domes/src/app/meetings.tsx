import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { fetchMeetings } from '../api/services';

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  ongoing: { label: '进行中', color: '#10b981', bg: '#ecfdf5' },
  upcoming: { label: '即将开始', color: '#3b82f6', bg: '#eff6ff' },
  not_started: { label: '未开始', color: '#6b7280', bg: '#f3f4f6' },
  ended: { label: '已结束', color: '#9ca3af', bg: '#f3f4f6' },
  cancelled: { label: '已取消', color: '#ef4444', bg: '#fef2f2' },
};

export default function MeetingsScreen() {
  const router = useRouter();
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const today = new Date();
  const dateStr = `今天，${today.getMonth() + 1}月${today.getDate()}日`;

  const loadData = useCallback(async () => {
    try {
      const data = await fetchMeetings();
      setMeetings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('加载会议失败:', err);
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

  const formatTime = (isoStr: string) => {
    if (!isoStr) return '--:--';
    const d = new Date(isoStr);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const getStatusInfo = (status: string) => {
    return STATUS_MAP[status] || STATUS_MAP.not_started;
  };

  const renderItem = ({ item }: { item: any }) => {
    const statusInfo = getStatusInfo(item.status);
    const startTime = formatTime(item.start_time);
    const endTime = formatTime(item.end_time);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => Alert.alert(item.title, `会议室: ${item.room || '待定'}\n组织者: ${item.organizer || '未知'}\n参会人数: ${item.attendees || 0}\n${item.minutes || '暂无纪要'}`)}
        onLongPress={() => {
          if (item.status === 'not_started') {
            Alert.alert('操作', item.title, [
              { text: '取消', style: 'cancel' },
            ]);
          }
        }}
      >
        <View style={styles.timeColumn}>
          <Text style={styles.timeText}>{startTime}</Text>
          <Text style={styles.timeSubText}>至 {endTime}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.contentColumn}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
          </View>

          {item.room ? (
            <View style={styles.infoRow}>
              <Feather name="map-pin" size={12} color="#999999" />
              <Text style={styles.infoText}>{item.room}</Text>
            </View>
          ) : null}
          <View style={styles.infoRow}>
            <Feather name="user" size={12} color="#999999" />
            <Text style={styles.infoText}>发起人: {item.organizer || '未知'}</Text>
          </View>

          <View style={styles.cardFooter}>
            <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
              <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
            </View>

            <TouchableOpacity
              style={[styles.joinBtn, item.status !== 'ongoing' && styles.joinBtnDisabled]}
              onPress={() => {
                if (item.status === 'ongoing') {
                  Alert.alert('提示', '会议进行中，请通过电脑端加入');
                } else {
                  Alert.alert('会议详情', `状态: ${statusInfo.label}\n时间: ${startTime} - ${endTime}\n会议室: ${item.room || '待定'}`);
                }
              }}
            >
              <Text style={[styles.joinBtnText, item.status !== 'ongoing' && styles.joinBtnTextDisabled]}>
                {item.status === 'ongoing' ? '立即进入' : '查看详情'}
              </Text>
            </TouchableOpacity>
          </View>
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
        <Text style={styles.headerTitle}>会议管理</Text>
        <View style={styles.headerIcon} />
      </View>

      <View style={styles.dateSelector}>
        <Feather name="calendar" size={20} color="#5a5ce5" />
        <Text style={styles.dateText}>{dateStr}</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#5a5ce5" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={meetings}
          renderItem={renderItem}
          keyExtractor={item => String(item.id)}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Feather name="calendar" size={48} color="#d1d5db" />
              <Text style={styles.emptyText}>暂无会议安排</Text>
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
  headerIcon: { padding: 4, width: 32 },
  dateSelector: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  dateText: { fontSize: 16, color: '#333333', fontWeight: 'bold', marginLeft: 10 },
  emptyState: { alignItems: 'center', marginTop: 80 },
  emptyText: { color: '#999999', fontSize: 15, marginTop: 16 },
  card: { flexDirection: 'row', backgroundColor: '#ffffff', borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5, elevation: 2 },
  timeColumn: { width: 60, alignItems: 'center', justifyContent: 'center' },
  timeText: { fontSize: 16, fontWeight: 'bold', color: '#5a5ce5', marginBottom: 4 },
  timeSubText: { fontSize: 11, color: '#999999' },
  divider: { width: 1, backgroundColor: '#f1f1f1', marginHorizontal: 12 },
  contentColumn: { flex: 1 },
  cardHeader: { marginBottom: 8 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#333333' },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  infoText: { fontSize: 12, color: '#666666', marginLeft: 6 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 11, fontWeight: 'bold' },
  joinBtn: { backgroundColor: '#5a5ce5', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12 },
  joinBtnDisabled: { backgroundColor: '#f1f1f1' },
  joinBtnText: { color: '#ffffff', fontSize: 12, fontWeight: 'bold' },
  joinBtnTextDisabled: { color: '#999999' },
});
