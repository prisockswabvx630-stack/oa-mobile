import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView, Switch,
  TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@notification_settings';

interface NotificationSettings {
  sysPush: boolean;
  taskPush: boolean;
  attendPush: boolean;
  sound: boolean;
  vibrate: boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  sysPush: true,
  taskPush: true,
  attendPush: false,
  sound: true,
  vibrate: true,
};

export default function NotificationsScreen() {
  const router = useRouter();

  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [cacheSize, setCacheSize] = useState('14.2 MB');
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSettings(JSON.parse(stored));
      }
    } catch (err) {
      console.error('加载通知设置失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveSetting = async (key: keyof NotificationSettings, value: boolean) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      Alert.alert('保存失败', '无法保存通知设置');
    }
  };

  const handleClearCache = () => {
    if (cacheSize === '0 B') {
      Alert.alert('提示', '暂无缓存需要清理');
      return;
    }
    Alert.alert(
      '确认清理',
      '清理缓存不会删除您的重要数据与账号设置。是否继续？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          onPress: () => {
            setClearing(true);
            setTimeout(() => {
              setClearing(false);
              setCacheSize('0 B');
              Alert.alert('提示', '缓存清理成功！');
            }, 1500);
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#5a5ce5" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerIcon}>
          <Feather name="arrow-left" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>消息通知设置</Text>
        <View style={styles.headerIcon} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.container}>
        <Text style={styles.sectionTitle}>推送类别</Text>
        <View style={styles.card}>
          <View style={styles.switchRow}>
            <View style={styles.switchCol}>
              <Text style={styles.switchTitle}>系统消息通知</Text>
              <Text style={styles.switchSub}>开启后将接收公司公告、系统维护等消息</Text>
            </View>
            <Switch
              value={settings.sysPush}
              onValueChange={(v) => saveSetting('sysPush', v)}
              trackColor={{ false: '#e2e8f0', true: '#c7d2fe' }}
              thumbColor={settings.sysPush ? '#5a5ce5' : '#cbd5e1'}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.switchRow}>
            <View style={styles.switchCol}>
              <Text style={styles.switchTitle}>待办任务提醒</Text>
              <Text style={styles.switchSub}>开启后将在有新的指派任务或截止日期前接收提醒</Text>
            </View>
            <Switch
              value={settings.taskPush}
              onValueChange={(v) => saveSetting('taskPush', v)}
              trackColor={{ false: '#e2e8f0', true: '#c7d2fe' }}
              thumbColor={settings.taskPush ? '#5a5ce5' : '#cbd5e1'}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.switchRow}>
            <View style={styles.switchCol}>
              <Text style={styles.switchTitle}>考勤异常提醒</Text>
              <Text style={styles.switchSub}>打卡迟到、缺卡时发送即时警告</Text>
            </View>
            <Switch
              value={settings.attendPush}
              onValueChange={(v) => saveSetting('attendPush', v)}
              trackColor={{ false: '#e2e8f0', true: '#c7d2fe' }}
              thumbColor={settings.attendPush ? '#5a5ce5' : '#cbd5e1'}
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>通知方式</Text>
        <View style={styles.card}>
          <View style={styles.switchRow}>
            <View style={styles.switchCol}>
              <Text style={styles.switchTitle}>声音</Text>
            </View>
            <Switch
              value={settings.sound}
              onValueChange={(v) => saveSetting('sound', v)}
              trackColor={{ false: '#e2e8f0', true: '#c7d2fe' }}
              thumbColor={settings.sound ? '#5a5ce5' : '#cbd5e1'}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.switchRow}>
            <View style={styles.switchCol}>
              <Text style={styles.switchTitle}>振动</Text>
            </View>
            <Switch
              value={settings.vibrate}
              onValueChange={(v) => saveSetting('vibrate', v)}
              trackColor={{ false: '#e2e8f0', true: '#c7d2fe' }}
              thumbColor={settings.vibrate ? '#5a5ce5' : '#cbd5e1'}
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>存储管理</Text>
        <View style={[styles.card, { marginBottom: 30 }]}>
          <TouchableOpacity style={styles.clearRow} onPress={handleClearCache} disabled={clearing}>
            <View style={{ flex: 1 }}>
              <Text style={styles.clearTitle}>清理缓存</Text>
              <Text style={styles.clearSub}>清理本地临时图片、数据包缓存</Text>
            </View>
            {clearing ? (
              <ActivityIndicator color="#5a5ce5" size="small" />
            ) : (
              <Text style={styles.cacheText}>{cacheSize}</Text>
            )}
            <Feather name="chevron-right" size={20} color="#94a3b8" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  headerIcon: { padding: 4, width: 32 },
  container: { flex: 1, paddingHorizontal: 16 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#64748b',
    marginTop: 24,
    marginBottom: 8,
    paddingLeft: 4,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 2,
  },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 8 },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  switchCol: { flex: 1, marginRight: 16 },
  switchTitle: { fontSize: 15, color: '#1e293b', fontWeight: '500', marginBottom: 2 },
  switchSub: { fontSize: 12, color: '#64748b' },
  clearRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  clearTitle: { fontSize: 15, color: '#1e293b', fontWeight: '500', marginBottom: 2 },
  clearSub: { fontSize: 12, color: '#64748b' },
  cacheText: { fontSize: 15, color: '#94a3b8', fontWeight: '500' },
});
