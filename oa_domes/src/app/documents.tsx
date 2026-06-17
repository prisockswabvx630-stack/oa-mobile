import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { fetchDocuments } from '../api/services';

export default function DocumentsScreen() {
  const router = useRouter();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('全部');

  useEffect(() => {
    fetchDocuments()
      .then(data => {
        const mapped = data.map((d: any) => ({
          id: String(d.id),
          name: d.doc_name,
          type: mapDocType(d.doc_type),
          size: d.file_size ? formatSize(Number(d.file_size)) : '--',
          date: d.create_time ? new Date(d.create_time).toISOString().split('T')[0] : '--',
          author: d.uploader_name || '--'
        }));
        setDocuments(mapped);
      })
      .catch(err => console.error('加载文档失败:', err))
      .finally(() => setLoading(false));
  }, []);

  const mapDocType = (type: string) => {
    if (!type) return 'file';
    const t = type.toLowerCase();
    if (t.includes('pdf')) return 'pdf';
    if (t.includes('xls') || t.includes('excel')) return 'excel';
    if (t.includes('doc') || t.includes('word')) return 'word';
    if (t.includes('mp4') || t.includes('video')) return 'video';
    return 'file';
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const getIconForType = (type: string) => {
    switch(type) {
      case 'pdf': return { name: 'file-text', color: '#ef4444' };
      case 'excel': return { name: 'pie-chart', color: '#10b981' };
      case 'word': return { name: 'file-text', color: '#3b82f6' };
      case 'video': return { name: 'film', color: '#f59e0b' };
      default: return { name: 'file', color: '#666666' };
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const icon = getIconForType(item.type);

    return (
      <View style={styles.card}>
        <View style={styles.iconBox}>
          <Feather name={icon.name as any} size={24} color={icon.color} />
        </View>

        <View style={styles.contentCol}>
          <Text style={styles.docName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.docMeta}>{item.size} • {item.date} • {item.author}</Text>
        </View>

        <TouchableOpacity style={styles.actionBtn}>
          <Feather name="more-vertical" size={20} color="#999999" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerIcon}>
          <Feather name="arrow-left" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>文档中心</Text>
        <TouchableOpacity style={styles.headerIcon}>
          <Feather name="folder-plus" size={22} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <View style={styles.container}>
        <View style={styles.searchContainer}>
          <Feather name="search" size={18} color="#999999" style={{marginRight: 8}} />
          <TextInput
            style={styles.searchInput}
            placeholder="搜索文件名、作者..."
            placeholderTextColor="#999999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={styles.filterRow}>
          {['全部', '最近使用', '共享给我'].map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.filterBtn, activeFilter === f && styles.filterBtnActive]}
              onPress={() => setActiveFilter(f)}
            >
              <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#5a5ce5" style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={documents.filter(d => {
              if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                if (!d.name.toLowerCase().includes(q) && !(d.author || '').toLowerCase().includes(q)) return false;
              }
              if (activeFilter === '最近使用') {
                // 最近7天的文档
                const docDate = new Date(d.date);
                const weekAgo = new Date(Date.now() - 7 * 86400000);
                return docDate >= weekAgo;
              }
              return true;
            })}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{paddingBottom: 40}}
            ListEmptyComponent={<Text style={{textAlign:'center',color:'#999',marginTop:40}}>暂无文档</Text>}
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
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 20, paddingHorizontal: 16, height: 44, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5, elevation: 2 },
  searchInput: { flex: 1, color: '#333333', fontSize: 14 },
  filterRow: { flexDirection: 'row', marginBottom: 20 },
  filterBtn: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 16, backgroundColor: '#ffffff', marginRight: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  filterBtnActive: { backgroundColor: '#f0f5ff', borderColor: '#5a5ce5' },
  filterText: { fontSize: 13, color: '#666666' },
  filterTextActive: { color: '#5a5ce5', fontWeight: 'bold' },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5, elevation: 2 },
  iconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#f8f9fa', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  contentCol: { flex: 1 },
  docName: { fontSize: 15, fontWeight: 'bold', color: '#333333', marginBottom: 6 },
  docMeta: { fontSize: 12, color: '#999999' },
  actionBtn: { padding: 8 }
});
