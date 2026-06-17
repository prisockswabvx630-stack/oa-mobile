import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, Image, SafeAreaView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { fetchEmployees } from '../api/services';

export default function HrManagementScreen() {
  const router = useRouter();
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmployees()
      .then(data => {
        const mapped = data.map((u: any) => ({
          id: String(u.id),
          name: u.real_name,
          role: u.pos_name || '',
          dept: u.dept_name || '',
          status: u.status === 1 ? (u.probation_end ? '试用期' : '在职') : '离职',
          joinDate: u.entry_date ? new Date(u.entry_date).toISOString().split('T')[0] : '--',
          avatar: u.avatar || `https://i.pravatar.cc/150?img=${u.id}`
        }));
        setEmployees(mapped);
      })
      .catch(err => console.error('加载员工失败:', err))
      .finally(() => setLoading(false));
  }, []);

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Image source={{ uri: item.avatar }} style={styles.avatar} />
        <View style={styles.info}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.role}>{item.dept} • {item.role}</Text>
        </View>
        <View style={[styles.badge, item.status === '试用期' ? styles.badgeWarning : styles.badgeSuccess]}>
          <Text style={[styles.badgeText, item.status === '试用期' ? styles.textWarning : styles.textSuccess]}>{item.status}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.detailRow}>
        <Feather name="calendar" size={14} color="#999999" />
        <Text style={styles.detailText}>入职日期: {item.joinDate}</Text>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionBtn}>
          <Text style={styles.actionBtnText}>档案</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Text style={styles.actionBtnText}>合同</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Text style={styles.actionBtnText}>调岗</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerIcon}>
          <Feather name="arrow-left" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>人事管理</Text>
        <TouchableOpacity style={styles.headerIcon}>
          <Feather name="plus" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <View style={styles.container}>
        <View style={styles.searchContainer}>
          <Feather name="search" size={18} color="#999999" style={{marginRight: 8}} />
          <TextInput
            style={styles.searchInput}
            placeholder="搜索员工姓名、部门、职位..."
            placeholderTextColor="#999999"
          />
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{employees.length}</Text>
            <Text style={styles.statLabel}>在职人数</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>0</Text>
            <Text style={styles.statLabel}>本月新入职</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{employees.filter(e => e.status === '试用期').length}</Text>
            <Text style={styles.statLabel}>待转正</Text>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#5a5ce5" style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={employees}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{paddingBottom: 40}}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f5f6f8' },
  header: { backgroundColor: '#5a5ce5', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, height: 56 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#ffffff' },
  headerIcon: { padding: 4 },
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 20, paddingHorizontal: 16, height: 44, marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5, elevation: 2 },
  searchInput: { flex: 1, color: '#333333', fontSize: 14 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  statBox: { width: '31%', backgroundColor: '#ffffff', borderRadius: 12, paddingVertical: 16, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5, elevation: 2 },
  statNum: { fontSize: 22, fontWeight: 'bold', color: '#5a5ce5', marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#999999' },
  card: { backgroundColor: '#ffffff', borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, marginRight: 12 },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: 'bold', color: '#333333', marginBottom: 4 },
  role: { fontSize: 13, color: '#666666' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: 'bold' },
  badgeSuccess: { backgroundColor: '#ecfdf5' },
  badgeWarning: { backgroundColor: '#fef3c7' },
  textSuccess: { color: '#10b981', fontSize: 11, fontWeight: 'bold' },
  textWarning: { color: '#d97706', fontSize: 11, fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: '#f1f1f1', marginBottom: 12 },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  detailText: { fontSize: 13, color: '#666666', marginLeft: 8 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between' },
  actionBtn: { flex: 1, backgroundColor: '#f0f5ff', paddingVertical: 8, borderRadius: 8, alignItems: 'center', marginHorizontal: 4 },
  actionBtnText: { color: '#5a5ce5', fontSize: 13, fontWeight: '500' }
});
