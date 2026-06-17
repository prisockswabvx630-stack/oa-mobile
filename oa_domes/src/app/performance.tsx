import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { fetchPerformance } from '../api/services';

const GRADE_COLORS: Record<string, string> = {
  S: '#8b5cf6',
  A: '#3b82f6',
  B: '#10b981',
  C: '#f59e0b',
  D: '#ef4444',
};

export default function PerformanceScreen() {
  const router = useRouter();
  const [performance, setPerformance] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const data = await fetchPerformance();
      if (Array.isArray(data) && data.length > 0) {
        setPerformance(data[0]);
      } else if (data && !Array.isArray(data)) {
        setPerformance(data);
      } else {
        setPerformance(null);
      }
    } catch (err: any) {
      Alert.alert('加载失败', err?.message || '无法获取绩效数据');
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

  const grade = performance?.grade || performance?.overallGrade || 'S';
  const totalScore = performance?.totalScore ?? performance?.score ?? 0;
  const gradeColor = GRADE_COLORS[grade] || '#5a5ce5';

  const dimensions = performance?.dimensions || performance?.details || [
    { label: '工作业绩', score: 0, color: '#3b82f6' },
    { label: '团队协作', score: 0, color: '#10b981' },
    { label: '创新能力', score: 0, color: '#f59e0b' },
    { label: '工作态度', score: 0, color: '#8b5cf6' },
  ];

  const comment = performance?.comment || performance?.evaluation || '暂无主管评价';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerIcon}>
          <Feather name="arrow-left" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>绩效管理</Text>
        <TouchableOpacity style={styles.headerIcon}>
          <Feather name="more-horizontal" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#5a5ce5" style={{ marginTop: 40 }} />
      ) : !performance ? (
        <View style={styles.emptyContainer}>
          <Feather name="bar-chart-2" size={48} color="#cbd5e1" />
          <Text style={styles.emptyText}>暂无绩效数据</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.container}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#5a5ce5']} />
          }
        >
          <View style={styles.periodSelector}>
            <Feather name="calendar" size={18} color="#666666" style={{ marginRight: 8 }} />
            <Text style={styles.periodText}>{performance?.period || performance?.quarter || '当前考核周期'}</Text>
            <Feather name="chevron-down" size={18} color="#999999" />
          </View>

          <View style={styles.scoreCard}>
            <Text style={styles.scoreTitle}>综合评级</Text>
            <View style={styles.circleContainer}>
              <View style={[styles.circleOuter, { borderColor: gradeColor }]}>
                <View style={styles.circleInner}>
                  <Text style={[styles.scoreGrade, { color: gradeColor }]}>{grade}</Text>
                  <Text style={styles.scoreNumber}>{totalScore}分</Text>
                </View>
              </View>
            </View>
            <Text style={styles.scoreDesc}>
              {performance?.rank || `评级: ${grade}`}
            </Text>
          </View>

          <View style={styles.dimensionCard}>
            <Text style={styles.sectionTitle}>各项维度得分</Text>

            {dimensions.map((dim: any, idx: number) => (
              <View key={idx} style={styles.dimRow}>
                <View style={styles.dimHeader}>
                  <Text style={styles.dimLabel}>{dim.label || dim.name || `维度${idx + 1}`}</Text>
                  <Text style={styles.dimScore}>{dim.score ?? 0}</Text>
                </View>
                <View style={styles.dimBarBg}>
                  <View
                    style={[
                      styles.dimBarFill,
                      {
                        width: `${dim.score ?? 0}%`,
                        backgroundColor: dim.color || GRADE_COLORS[grade] || '#5a5ce5',
                      },
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>

          <View style={styles.commentCard}>
            <Text style={styles.sectionTitle}>
              主管评价 ({performance?.evaluator || performance?.manager || '直属主管'})
            </Text>
            <Text style={styles.commentText}>{comment}</Text>
          </View>
        </ScrollView>
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
  container: { flex: 1, paddingHorizontal: 16 },
  periodSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginVertical: 16,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 2,
  },
  periodText: { flex: 1, fontSize: 15, color: '#333333', fontWeight: 'bold' },
  scoreCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 2,
  },
  scoreTitle: { fontSize: 16, fontWeight: 'bold', color: '#333333', marginBottom: 20 },
  circleContainer: { alignItems: 'center', marginBottom: 20 },
  circleOuter: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 8,
    borderColor: '#5a5ce5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f5ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreGrade: { fontSize: 40, fontWeight: 'bold', color: '#5a5ce5' },
  scoreNumber: { fontSize: 14, color: '#666666', marginTop: 4 },
  scoreDesc: { fontSize: 13, color: '#10b981', fontWeight: '500' },
  dimensionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 2,
  },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333333', marginBottom: 16 },
  dimRow: { marginBottom: 16 },
  dimHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  dimLabel: { fontSize: 14, color: '#666666' },
  dimScore: { fontSize: 14, fontWeight: 'bold', color: '#333333' },
  dimBarBg: { height: 8, backgroundColor: '#f1f1f1', borderRadius: 4, overflow: 'hidden' },
  dimBarFill: { height: '100%', borderRadius: 4 },
  commentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 40,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 2,
  },
  commentText: { fontSize: 14, color: '#666666', lineHeight: 22 },
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyText: { fontSize: 14, color: '#94a3b8', marginTop: 12 },
});
