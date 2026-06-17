import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TextInput, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { fetchContacts } from '../api/services';
import BottomTabBar from '../components/BottomTabBar';

export default function ContactsScreen() {
  const router = useRouter();
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchContacts()
      .then(data => setContacts(Array.isArray(data) ? data : []))
      .catch(err => console.error('加载通讯录失败:', err))
      .finally(() => setLoading(false));
  }, []);

  const filteredContacts = searchQuery.trim()
    ? contacts.filter(c =>
        (c.name || '').includes(searchQuery) ||
        (c.dept || '').includes(searchQuery) ||
        (c.role || '').includes(searchQuery)
      )
    : contacts;

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <Image source={{ uri: item.avatar }} style={styles.avatar} />
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.desc}>{item.dept} • {item.role}</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn}>
          <Feather name="message-circle" size={18} color="#5a5ce5" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#ecfdf5', marginLeft: 8}]}>
          <Feather name="phone" size={18} color="#10b981" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerIcon} />
        <Text style={styles.headerTitle}>通讯录</Text>
        <TouchableOpacity style={styles.headerIcon}>
          <Feather name="user-plus" size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <View style={styles.container}>
        <View style={styles.searchContainer}>
          <Feather name="search" size={18} color="#999999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="搜索姓名、部门、职位..."
            placeholderTextColor="#999999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <TouchableOpacity style={styles.orgEntry}>
          <View style={styles.orgIconBox}>
            <Feather name="git-merge" size={20} color="#5a5ce5" />
          </View>
          <Text style={styles.orgText}>组织架构</Text>
          <Feather name="chevron-right" size={20} color="#999999" />
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>常用联系人</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#5a5ce5" style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={filteredContacts}
            renderItem={renderItem}
            keyExtractor={item => String(item.id)}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{paddingBottom: 80}}
            ListEmptyComponent={<Text style={{textAlign:'center',color:'#999',marginTop:40}}>暂无联系人</Text>}
          />
        )}
      </View>

      {/* Bottom Tab Bar */}
      <BottomTabBar />
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
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, color: '#333333', fontSize: 14 },
  orgEntry: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', padding: 16, borderRadius: 16, marginBottom: 24, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5, elevation: 2 },
  orgIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#f0f5ff', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  orgText: { flex: 1, fontSize: 16, color: '#333333', fontWeight: 'bold' },
  sectionTitle: { fontSize: 14, color: '#999999', marginBottom: 12, marginLeft: 4 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', padding: 16, borderRadius: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5, elevation: 2 },
  avatar: { width: 44, height: 44, borderRadius: 22, marginRight: 12 },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: 'bold', color: '#333333', marginBottom: 4 },
  desc: { fontSize: 13, color: '#666666' },
  actions: { flexDirection: 'row' },
  actionBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f0f5ff', justifyContent: 'center', alignItems: 'center' }
});
