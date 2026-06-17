import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { fetchMessages, markMessageAsRead } from '../api/services';
import BottomTabBar from '../components/BottomTabBar';

export default function MessagesScreen() {
  const router = useRouter();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMessages = () => {
    fetchMessages()
      .then(data => {
        const mapped = data.map((m: any) => ({
          id: String(m.id),
          type: m.type || 'system',
          title: m.title,
          desc: m.content,
          time: formatTime(m.create_time),
          unread: m.is_read ? 0 : 1
        }));
        setMessages(mapped);
      })
      .catch(err => console.error('加载消息失败:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadMessages();
  }, []);

  const handlePressMessage = async (id: string, unread: number) => {
    if (unread === 0) return;
    try {
      await markMessageAsRead(id);
      // 更新本地状态，设为已读
      setMessages(prev => prev.map(m => m.id === id ? { ...m, unread: 0 } : m));
    } catch (err) {
      console.error('标记消息已读失败:', err);
    }
  };

  const formatTime = (d: string) => {
    if (!d) return '';
    const date = new Date(d);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    if (diff < 86400000) return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
    if (diff < 172800000) return '昨天';
    return `${date.getMonth() + 1}-${date.getDate()}`;
  };

  const renderItem = ({ item }: { item: any }) => {
    let icon, bgColor;
    if (item.type === 'system') {
      icon = 'bell'; bgColor = '#3b82f6';
    } else if (item.type === 'approval') {
      icon = 'check-square'; bgColor = '#10b981';
    } else {
      icon = 'mail'; bgColor = '#8b5cf6';
    }

    return (
      <TouchableOpacity 
        style={styles.itemContainer} 
        activeOpacity={0.7}
        onPress={() => handlePressMessage(item.id, item.unread)}
      >
        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, { backgroundColor: bgColor, justifyContent: 'center', alignItems: 'center' }]}>
            <Feather name={icon as any} size={24} color="#ffffff" />
          </View>
          {item.unread > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unread}</Text>
            </View>
          )}
        </View>
        <View style={styles.contentContainer}>
          <View style={styles.topRow}>
            <Text style={[styles.title, item.unread > 0 ? styles.titleUnread : styles.titleRead]} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.time}>{item.time}</Text>
          </View>
          <Text style={[styles.desc, item.unread > 0 ? styles.descUnread : styles.descRead]} numberOfLines={1}>
            {item.desc}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerIcon} />
        <Text style={styles.headerTitle}>消息中心</Text>
        <TouchableOpacity style={styles.headerIcon} onPress={loadMessages}>
          <Feather name="rotate-cw" size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#5a5ce5" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={messages}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{padding: 16, paddingBottom: 80}}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 80 }}>
              <Feather name="mail" size={48} color="#cbd5e1" style={{ marginBottom: 12 }} />
              <Text style={{ color: '#94a3b8', fontSize: 14 }}>暂无消息通知</Text>
            </View>
          }
        />
      )}

      {/* Bottom Tab Bar */}
      <BottomTabBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#ffffff' },
  header: { backgroundColor: '#5a5ce5', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, height: 56 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#ffffff' },
  headerIcon: { padding: 4 },
  itemContainer: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  avatarContainer: { position: 'relative', marginRight: 16 },
  avatar: { width: 50, height: 50, borderRadius: 25 },
  unreadBadge: { position: 'absolute', top: -2, right: -2, backgroundColor: '#ef4444', minWidth: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#ffffff', paddingHorizontal: 4 },
  unreadText: { color: '#ffffff', fontSize: 10, fontWeight: 'bold' },
  contentContainer: { flex: 1, borderBottomWidth: 1, borderBottomColor: '#f1f1f1', paddingBottom: 16, paddingTop: 4 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  title: { fontSize: 16, flex: 1, marginRight: 8 },
  titleUnread: { fontWeight: 'bold', color: '#1e293b' },
  titleRead: { fontWeight: 'normal', color: '#64748b' },
  time: { fontSize: 12, color: '#999999' },
  desc: { fontSize: 14 },
  descUnread: { color: '#334155', fontWeight: '500' },
  descRead: { color: '#94a3b8' }
});
