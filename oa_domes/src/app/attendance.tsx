import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { fetchAttendance, clockIn as apiClockIn, clockOut as apiClockOut, unbindDevice } from '../api/services';
import { getCurrentUser } from '../api/session';

// 公司坐标（与后端 sys_config 一致）
const COMPANY_LAT = 38.820564;
const COMPANY_LNG = 115.498772;
const COMPANY_RADIUS = 300; // 米

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// 持久化设备ID
const DEVICE_ID_KEY = 'oa_device_id';
async function getDeviceId(): Promise<string> {
  let id = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = `MOBILE-${Date.now()}-${Math.floor(100000 + Math.random() * 900000)}`;
    await AsyncStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

export default function AttendanceScreen() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [todayRecord, setTodayRecord] = useState<any>(null);
  const [boundDevice, setBoundDevice] = useState<string | null>(null);

  // 真实定位状态
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [distance, setDistance] = useState<number | null>(null);
  const [isWithinRange, setIsWithinRange] = useState(false);

  // 时钟状态
  const [now, setNow] = useState(new Date());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadData = async (userId: number) => {
    try {
      const data = await fetchAttendance({ user_id: userId });
      setRecords(data);

      const latestWithDevice = data.find((r: any) => r.clock_in_device || r.clock_out_device);
      const device = latestWithDevice ? (latestWithDevice.clock_in_device || latestWithDevice.clock_out_device) : null;
      setBoundDevice(device);

      const today = data.find((r: any) => {
        const d = new Date(r.attend_date);
        const now = new Date();
        return d.toISOString().split('T')[0] === now.toISOString().split('T')[0];
      });
      setTodayRecord(today);
    } catch (err) {
      console.error('加载考勤失败:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
    if (user?.id) {
      loadData(user.id);
    } else {
      setLoading(false);
    }
    // 每分钟更新时钟
    timerRef.current = setInterval(() => setNow(new Date()), 60000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const getCurrentLocation = async () => {
    setLocating(true);
    setLocationError('');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('定位权限被拒绝，请在系统设置中开启位置权限');
        setLocating(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });
      const lat = location.coords.latitude;
      const lng = location.coords.longitude;
      setUserLat(lat);
      setUserLng(lng);

      const dist = getDistance(lat, lng, COMPANY_LAT, COMPANY_LNG);
      setDistance(Math.round(dist));
      setIsWithinRange(dist <= COMPANY_RADIUS);
    } catch (err: any) {
      setLocationError('获取位置失败：' + (err.message || '未知错误'));
    } finally {
      setLocating(false);
    }
  };

  const handleClockIn = async () => {
    if (!currentUser?.id) return;
    if (userLat === null || userLng === null) {
      Alert.alert('提示', '请先获取当前位置');
      return;
    }
    try {
      setLoading(true);
      const device = boundDevice || await getDeviceId();
      const res: any = await apiClockIn({
        user_id: currentUser.id,
        latitude: userLat,
        longitude: userLng,
        device,
      });
      if (res?.status === 'fieldwork') {
        Alert.alert('外勤签到成功', `您当前距公司 ${distance}米，已标记为外勤打卡，需管理员审核确认。`);
      } else {
        Alert.alert('签到成功', `打卡状态：${res?.status === 'late' ? '迟到' : '正常'}`);
      }
      await loadData(currentUser.id);
    } catch (err: any) {
      Alert.alert('签到失败', err.message || '系统错误');
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async () => {
    if (!currentUser?.id) return;
    if (userLat === null || userLng === null) {
      Alert.alert('提示', '请先获取当前位置');
      return;
    }
    try {
      setLoading(true);
      const device = boundDevice || await getDeviceId();
      const res: any = await apiClockOut({
        user_id: currentUser.id,
        latitude: userLat,
        longitude: userLng,
        device,
      });
      if (res?.status === 'fieldwork') {
        Alert.alert('外勤签退成功', `您当前距公司 ${distance}米，外勤打卡记录已生成，需管理员审核确认。`);
      } else {
        Alert.alert('下班打卡成功');
      }
      await loadData(currentUser.id);
    } catch (err: any) {
      Alert.alert('打卡失败', err.message || '系统错误');
    } finally {
      setLoading(false);
    }
  };

  const handleUnbindDevice = async () => {
    if (!currentUser?.id) return;
    try {
      setLoading(true);
      await unbindDevice({ user_id: currentUser.id });
      Alert.alert('提示', '设备解绑成功！');
      await loadData(currentUser.id);
    } catch (err: any) {
      Alert.alert('解绑失败', err.message || '系统错误');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (d: string | null) => {
    if (!d) return '--:--';
    const date = new Date(d);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    const days = ['日', '一', '二', '三', '四', '五', '六'];
    return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')} 周${days[date.getDay()]}`;
  };

  const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 星期${['日', '一', '二', '三', '四', '五', '六'][now.getDay()]}`;
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const clockInTime = todayRecord ? formatTime(todayRecord.clock_in_time) : '--:--';
  const clockOutTime = todayRecord ? formatTime(todayRecord.clock_out_time) : '--:--';
  const workHours = todayRecord?.work_hours ? `${todayRecord.work_hours}h` : '--:--';

  const attendDays = records.filter(r => r.status === 'normal' || r.status === 'late').length;
  const lateDays = records.filter(r => r.status === 'late').length;
  const fieldworkDays = records.filter(r => r.status === 'fieldwork' || r.is_fieldwork).length;

  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = { normal: '正常', late: '迟到', early: '早退', late_early: '迟到+早退', fieldwork: '外勤(待审核)', absent: '缺勤' };
    return map[status] || status;
  };

  const getStatusColor = (status: string) => {
    if (status === 'fieldwork') return '#f59e0b';
    if (status === 'late') return '#f59e0b';
    if (status === 'early' || status === 'late_early') return '#ef4444';
    if (status === 'absent') return '#ef4444';
    return '#10b981';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerIcon}>
            <Feather name="arrow-left" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>考勤打卡</Text>
          <View style={styles.headerIcon} />
        </View>
        <ActivityIndicator size="large" color="#5a5ce5" style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerIcon}>
          <Feather name="arrow-left" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>考勤打卡</Text>
        <View style={styles.headerIcon} />
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        <View style={styles.greenBanner}>
          <Text style={styles.bannerDate}>{dateStr}</Text>
          <Text style={styles.bannerTime}>{timeStr}</Text>
          <Text style={styles.bannerSub}>工作时间 09:00 - 18:00</Text>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>上班打卡</Text>
            <Text style={styles.infoValue}>{clockInTime}</Text>
            <Text style={[styles.infoStatus, {color: todayRecord ? getStatusColor(todayRecord.status) : '#999999'}]}>
              {todayRecord ? getStatusLabel(todayRecord.status) : '未打卡'}
            </Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>下班打卡</Text>
            <Text style={styles.infoValue}>{clockOutTime}</Text>
            <Text style={styles.infoStatus}>{clockOutTime !== '--:--' ? '已打卡' : '未打卡'}</Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>工作时长</Text>
            <Text style={styles.infoValue}>{workHours}</Text>
            <Text style={styles.infoStatus}>{todayRecord ? '已完成' : '进行中'}</Text>
          </View>
        </View>

        {/* 定位信息卡片 */}
        <View style={styles.locationCard}>
          <View style={styles.locationHeader}>
            <Text style={styles.locationTitle}>📍 定位信息</Text>
            <TouchableOpacity style={styles.refreshBtn} onPress={getCurrentLocation} disabled={locating}>
              {locating ? (
                <ActivityIndicator size="small" color="#5a5ce5" />
              ) : (
                <Feather name="refresh-cw" size={14} color="#5a5ce5" />
              )}
              <Text style={styles.refreshBtnText}>{locating ? '定位中...' : '获取位置'}</Text>
            </TouchableOpacity>
          </View>

          {locationError ? (
            <View style={styles.locationErrorBox}>
              <Feather name="alert-circle" size={16} color="#ef4444" />
              <Text style={styles.locationErrorText}>{locationError}</Text>
            </View>
          ) : userLat !== null && userLng !== null ? (
            <>
              <View style={styles.locationRow}>
                <Text style={styles.locationLabel}>我的位置</Text>
                <Text style={styles.locationValue}>{userLat.toFixed(5)}, {userLng.toFixed(5)}</Text>
              </View>
              <View style={styles.locationRow}>
                <Text style={styles.locationLabel}>公司位置</Text>
                <Text style={styles.locationValue}>{COMPANY_LAT.toFixed(5)}, {COMPANY_LNG.toFixed(5)}</Text>
              </View>
              <View style={styles.locationRow}>
                <Text style={styles.locationLabel}>距公司</Text>
                <Text style={[styles.locationValue, { color: isWithinRange ? '#10b981' : '#ef4444', fontWeight: 'bold' }]}>
                  {distance} 米
                </Text>
              </View>

              <View style={[styles.rangeStatusBanner, isWithinRange ? styles.rangeOk : styles.rangeOut]}>
                <Feather name={isWithinRange ? 'check-circle' : 'alert-triangle'} size={18} color={isWithinRange ? '#065f46' : '#991b1b'} />
                <View style={{ marginLeft: 10, flex: 1 }}>
                  <Text style={[styles.rangeTitle, { color: isWithinRange ? '#065f46' : '#991b1b' }]}>
                    {isWithinRange ? '在公司考勤范围内' : '不在公司考勤范围内（外勤）'}
                  </Text>
                  <Text style={styles.rangeDesc}>
                    {isWithinRange
                      ? `距公司中心 ${distance}米，在允许的 ${COMPANY_RADIUS}米 半径内`
                      : `距公司中心 ${distance}米，超出 ${COMPANY_RADIUS}米 范围。打卡将标记为外勤，需管理员审核。`}
                  </Text>
                </View>
              </View>
            </>
          ) : (
            <View style={styles.locationEmpty}>
              <Feather name="map-pin" size={32} color="#cbd5e1" />
              <Text style={styles.locationEmptyText}>点击上方按钮获取当前位置</Text>
            </View>
          )}
        </View>

        {/* 设备信息 */}
        {boundDevice && (
          <View style={styles.deviceCard}>
            <View style={styles.deviceRow}>
              <Feather name="smartphone" size={14} color="#64748b" />
              <Text style={styles.deviceLabel}>已绑定设备：</Text>
              <Text style={styles.deviceValue}>{boundDevice}</Text>
            </View>
            <TouchableOpacity style={styles.unbindBtn} onPress={handleUnbindDevice}>
              <Feather name="unlock" size={12} color="#ef4444" />
              <Text style={styles.unbindBtnText}>解绑设备</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 打卡按钮 */}
        <View style={styles.punchButtonsRow}>
          <TouchableOpacity style={[styles.punchBtn, { backgroundColor: '#10b981' }]} activeOpacity={0.9} onPress={handleClockIn}>
            <Feather name="check" size={32} color="#ffffff" style={{marginBottom: 4}} />
            <Text style={styles.punchBtnText}>{isWithinRange ? '签到' : '外勤签到'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.punchBtn, { backgroundColor: '#f59e0b' }]} activeOpacity={0.9} onPress={handleClockOut}>
            <Feather name="clock" size={32} color="#ffffff" style={{marginBottom: 4}} />
            <Text style={styles.punchBtnText}>{isWithinRange ? '下班打卡' : '外勤签退'}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>本月统计</Text>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{attendDays}</Text>
            <Text style={styles.statLabel}>出勤天数</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{lateDays}</Text>
            <Text style={styles.statLabel}>迟到次数</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNum, {color: '#f59e0b'}]}>{fieldworkDays}</Text>
            <Text style={styles.statLabel}>外勤待审</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>打卡记录</Text>
        <View style={styles.recordList}>
          {records.slice(0, 5).map((r, i) => (
            <View key={i} style={[styles.recordRow, i === Math.min(records.length, 5) - 1 && {borderBottomWidth: 0}]}>
              <View style={{flex: 1}}>
                <Text style={styles.recordDay}>{formatDate(r.attend_date)}</Text>
                {(r.status === 'fieldwork' || r.is_fieldwork) && (
                  <Text style={{fontSize: 11, color: '#f59e0b', marginTop: 2}}>外勤 · 待审核</Text>
                )}
              </View>
              <View style={{alignItems: 'flex-end'}}>
                <Text style={styles.recordTimeText}>
                  {formatTime(r.clock_in_time)} - {formatTime(r.clock_out_time)}
                </Text>
                <Text style={{fontSize: 11, color: getStatusColor(r.status), marginTop: 2}}>
                  {getStatusLabel(r.status)}
                </Text>
              </View>
            </View>
          ))}
          {records.length === 0 && (
            <View style={styles.recordRow}>
              <Text style={styles.recordDay}>暂无记录</Text>
            </View>
          )}
        </View>

        <View style={{height: 40}} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f5f6f8' },
  header: { backgroundColor: '#5a5ce5', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, height: 56, zIndex: 10 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#ffffff' },
  headerIcon: { padding: 4 },
  container: { flex: 1 },
  greenBanner: { backgroundColor: '#10b981', paddingTop: 24, paddingBottom: 60, alignItems: 'center' },
  bannerDate: { color: 'rgba(255,255,255,0.9)', fontSize: 14, marginBottom: 12 },
  bannerTime: { color: '#ffffff', fontSize: 56, fontWeight: 'bold', marginBottom: 8 },
  bannerSub: { color: 'rgba(255,255,255,0.9)', fontSize: 13 },
  infoCard: { backgroundColor: '#ffffff', borderRadius: 16, marginHorizontal: 20, marginTop: -30, paddingVertical: 20, flexDirection: 'row', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 5 },
  infoCol: { flex: 1, alignItems: 'center' },
  infoLabel: { fontSize: 13, color: '#999999', marginBottom: 8 },
  infoValue: { fontSize: 18, fontWeight: 'bold', color: '#333333', marginBottom: 6 },
  infoStatus: { fontSize: 13, color: '#999999' },

  // 定位卡片
  locationCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginHorizontal: 20,
    marginTop: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  locationTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  refreshBtnText: {
    fontSize: 13,
    color: '#5a5ce5',
    fontWeight: '600',
  },
  locationErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  locationErrorText: {
    fontSize: 13,
    color: '#991b1b',
    flex: 1,
  },
  locationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  locationLabel: {
    fontSize: 13,
    color: '#64748b',
  },
  locationValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
    fontFamily: 'monospace',
  },
  rangeStatusBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 10,
    marginTop: 14,
  },
  rangeOk: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  rangeOut: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  rangeTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  rangeDesc: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
  },
  locationEmpty: {
    alignItems: 'center',
    paddingVertical: 30,
    gap: 10,
  },
  locationEmptyText: {
    fontSize: 13,
    color: '#94a3b8',
  },

  // 设备信息
  deviceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginHorizontal: 20,
    marginTop: 12,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 2,
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  deviceLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  deviceValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#5a5ce5',
  },
  unbindBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  unbindBtnText: {
    fontSize: 11,
    color: '#ef4444',
    fontWeight: '600',
  },

  // 打卡按钮
  punchButtonsRow: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: 24, marginBottom: 30 },
  punchBtn: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  punchBtnText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  sectionTitle: { fontSize: 17, fontWeight: 'bold', color: '#333333', marginLeft: 20, marginBottom: 16 },
  statsRow: { flexDirection: 'row', paddingHorizontal: 20, justifyContent: 'space-between', marginBottom: 30 },
  statCard: { width: '31%', backgroundColor: '#ffffff', borderRadius: 12, paddingVertical: 16, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5, elevation: 2 },
  statNum: { fontSize: 24, fontWeight: 'bold', color: '#5a5ce5', marginBottom: 6 },
  statLabel: { fontSize: 12, color: '#999999' },
  recordList: { backgroundColor: '#ffffff', borderRadius: 12, marginHorizontal: 20, paddingHorizontal: 16, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5, elevation: 2 },
  recordRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f1f1f1' },
  recordDay: { fontSize: 14, color: '#666666' },
  recordTimeText: { fontSize: 14, fontWeight: '600', color: '#333333' },
});
