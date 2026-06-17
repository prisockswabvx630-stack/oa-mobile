import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput, FlatList } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  fetchDepartments,
  fetchPositions,
  fetchSystemSettings,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  createPosition,
  updatePosition,
  deletePosition,
} from '../api/services';
import { getCurrentUser } from '../api/session';
import FormModal from '../components/FormModal';
import FormItem from '../components/FormItem';
import ConfirmDialog from '../components/ConfirmDialog';

export default function SettingsScreen() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'departments' | 'positions' | 'system'>('departments');

  // 部门数据
  const [departments, setDepartments] = useState<any[]>([]);
  const [deptLoading, setDeptLoading] = useState(false);

  // 职位数据
  const [positions, setPositions] = useState<any[]>([]);
  const [posLoading, setPosLoading] = useState(false);

  // 系统设置
  const [systemSettings, setSystemSettings] = useState<any>(null);
  const [settingsLoading, setSettingsLoading] = useState(false);

  // 部门CRUD状态
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingDept, setEditingDept] = useState<any>(null);
  const [deptForm, setDeptForm] = useState({ name: '', description: '' });

  // 职位CRUD状态
  const [showPosModal, setShowPosModal] = useState(false);
  const [editingPos, setEditingPos] = useState<any>(null);
  const [posForm, setPosForm] = useState({ name: '', deptId: '' });

  // 删除确认
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteType, setDeleteType] = useState<'department' | 'position'>('department');
  const [deleteId, setDeleteId] = useState<number | string | null>(null);

  useEffect(() => {
    setCurrentUser(getCurrentUser());
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    setDeptLoading(true);
    try {
      const data = await fetchDepartments();
      setDepartments(data || []);
    } catch (err) {
      console.error('加载部门失败:', err);
    } finally {
      setDeptLoading(false);
      setLoading(false);
    }
  };

  const loadPositions = async () => {
    setPosLoading(true);
    try {
      const data = await fetchPositions();
      setPositions(data || []);
    } catch (err) {
      console.error('加载职位失败:', err);
    } finally {
      setPosLoading(false);
    }
  };

  const loadSystemSettings = async () => {
    setSettingsLoading(true);
    try {
      const data = await fetchSystemSettings();
      setSystemSettings(data);
    } catch (err) {
      console.error('加载系统设置失败:', err);
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleTabChange = (tab: 'departments' | 'positions' | 'system') => {
    setActiveTab(tab);
    if (tab === 'departments' && departments.length === 0) {
      loadDepartments();
    } else if (tab === 'positions' && positions.length === 0) {
      loadPositions();
    } else if (tab === 'system' && !systemSettings) {
      loadSystemSettings();
    }
  };

  // 部门CRUD
  const resetDeptForm = () => {
    setDeptForm({ name: '', description: '' });
    setEditingDept(null);
  };

  const openCreateDept = () => {
    resetDeptForm();
    setShowDeptModal(true);
  };

  const openEditDept = (dept: any) => {
    setEditingDept(dept);
    setDeptForm({ name: dept.name || '', description: dept.description || '' });
    setShowDeptModal(true);
  };

  const handleDeptSubmit = async () => {
    if (!deptForm.name.trim()) {
      Alert.alert('提示', '请输入部门名称');
      return;
    }

    setSubmitting(true);
    try {
      if (editingDept) {
        await updateDepartment(editingDept.id, deptForm);
        Alert.alert('成功', '部门已更新');
      } else {
        await createDepartment(deptForm);
        Alert.alert('成功', '部门已创建');
      }
      setShowDeptModal(false);
      resetDeptForm();
      await loadDepartments();
    } catch (err: any) {
      Alert.alert('操作失败', err.message || '系统错误');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDept = async () => {
    if (!deleteId) return;
    try {
      if (deleteType === 'department') {
        await deleteDepartment(deleteId);
        Alert.alert('成功', '部门已删除');
      } else {
        await deletePosition(deleteId);
        Alert.alert('成功', '职位已删除');
      }
      setShowDeleteDialog(false);
      setDeleteId(null);
      if (deleteType === 'department') {
        await loadDepartments();
      } else {
        await loadPositions();
      }
    } catch (err: any) {
      Alert.alert('删除失败', err.message || '系统错误');
    }
  };

  // 职位CRUD
  const resetPosForm = () => {
    setPosForm({ name: '', deptId: '' });
    setEditingPos(null);
  };

  const openCreatePos = () => {
    resetPosForm();
    setShowPosModal(true);
  };

  const openEditPos = (pos: any) => {
    setEditingPos(pos);
    setPosForm({ name: pos.name || '', deptId: String(pos.dept_id || '') });
    setShowPosModal(true);
  };

  const handlePosSubmit = async () => {
    if (!posForm.name.trim()) {
      Alert.alert('提示', '请输入职位名称');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: posForm.name,
        dept_id: posForm.deptId ? Number(posForm.deptId) : null,
      };

      if (editingPos) {
        await updatePosition(editingPos.id, payload);
        Alert.alert('成功', '职位已更新');
      } else {
        await createPosition(payload);
        Alert.alert('成功', '职位已创建');
      }
      setShowPosModal(false);
      resetPosForm();
      await loadPositions();
    } catch (err: any) {
      Alert.alert('操作失败', err.message || '系统错误');
    } finally {
      setSubmitting(false);
    }
  };

  const renderDepartmentItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.listItem}
      onLongPress={() => {
        Alert.alert(
          '部门操作',
          `对"${item.name}"进行操作`,
          [
            { text: '编辑', onPress: () => openEditDept(item) },
            { text: '删除', style: 'destructive', onPress: () => {
              setDeleteType('department');
              setDeleteId(item.id);
              setShowDeleteDialog(true);
            }},
            { text: '取消', style: 'cancel' },
          ]
        );
      }}
      activeOpacity={0.7}
    >
      <View style={styles.listItemIcon}>
        <Feather name="briefcase" size={20} color="#5a5ce5" />
      </View>
      <View style={styles.listItemContent}>
        <Text style={styles.listItemTitle}>{item.name}</Text>
        <Text style={styles.listItemDesc}>{item.description || '暂无描述'}</Text>
      </View>
      <Text style={styles.listItemCount}>{item.employee_count || 0}人</Text>
    </TouchableOpacity>
  );

  const renderPositionItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.listItem}
      onLongPress={() => {
        Alert.alert(
          '职位操作',
          `对"${item.name}"进行操作`,
          [
            { text: '编辑', onPress: () => openEditPos(item) },
            { text: '删除', style: 'destructive', onPress: () => {
              setDeleteType('position');
              setDeleteId(item.id);
              setShowDeleteDialog(true);
            }},
            { text: '取消', style: 'cancel' },
          ]
        );
      }}
      activeOpacity={0.7}
    >
      <View style={styles.listItemIcon}>
        <Feather name="briefcase" size={20} color="#10b981" />
      </View>
      <View style={styles.listItemContent}>
        <Text style={styles.listItemTitle}>{item.name}</Text>
        <Text style={styles.listItemDesc}>{item.dept_name || '未知部门'}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerIcon}>
            <Feather name="arrow-left" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>系统设置</Text>
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
        <Text style={styles.headerTitle}>系统设置</Text>
        <View style={styles.headerIcon} />
      </View>

      {/* Tab切换 */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'departments' && styles.tabItemActive]}
          onPress={() => handleTabChange('departments')}
        >
          <Text style={[styles.tabText, activeTab === 'departments' && styles.tabTextActive]}>部门管理</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'positions' && styles.tabItemActive]}
          onPress={() => handleTabChange('positions')}
        >
          <Text style={[styles.tabText, activeTab === 'positions' && styles.tabTextActive]}>职位管理</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'system' && styles.tabItemActive]}
          onPress={() => handleTabChange('system')}
        >
          <Text style={[styles.tabText, activeTab === 'system' && styles.tabTextActive]}>系统参数</Text>
        </TouchableOpacity>
      </View>

      {/* 内容区域 */}
      {activeTab === 'departments' && (
        deptLoading ? (
          <ActivityIndicator size="large" color="#5a5ce5" style={{ marginTop: 40 }} />
        ) : (
          <>
            <TouchableOpacity style={styles.addBtn} onPress={openCreateDept}>
              <Feather name="plus" size={18} color="#ffffff" />
              <Text style={styles.addBtnText}>添加部门</Text>
            </TouchableOpacity>
            <FlatList
              data={departments}
              renderItem={renderDepartmentItem}
              keyExtractor={item => item.id?.toString() || Math.random().toString()}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Feather name="inbox" size={48} color="#ccc" />
                  <Text style={styles.emptyText}>暂无部门数据</Text>
                </View>
              }
            />
          </>
        )
      )}

      {activeTab === 'positions' && (
        posLoading ? (
          <ActivityIndicator size="large" color="#5a5ce5" style={{ marginTop: 40 }} />
        ) : (
          <>
            <TouchableOpacity style={styles.addBtn} onPress={openCreatePos}>
              <Feather name="plus" size={18} color="#ffffff" />
              <Text style={styles.addBtnText}>添加职位</Text>
            </TouchableOpacity>
            <FlatList
              data={positions}
              renderItem={renderPositionItem}
              keyExtractor={item => item.id?.toString() || Math.random().toString()}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Feather name="inbox" size={48} color="#ccc" />
                  <Text style={styles.emptyText}>暂无职位数据</Text>
                </View>
              }
            />
          </>
        )
      )}

      {activeTab === 'system' && (
        settingsLoading ? (
          <ActivityIndicator size="large" color="#5a5ce5" style={{ marginTop: 40 }} />
        ) : (
          <ScrollView style={styles.settingsContainer} contentContainerStyle={styles.settingsContent}>
            <View style={styles.settingsSection}>
              <Text style={styles.settingsSectionTitle}>基本信息</Text>
              <View style={styles.settingsRow}>
                <Text style={styles.settingsLabel}>系统名称</Text>
                <Text style={styles.settingsValue}>{systemSettings?.system_name || '智能OA系统'}</Text>
              </View>
              <View style={styles.settingsRow}>
                <Text style={styles.settingsLabel}>系统版本</Text>
                <Text style={styles.settingsValue}>{systemSettings?.version || 'v1.0.0'}</Text>
              </View>
            </View>

            <View style={styles.settingsSection}>
              <Text style={styles.settingsSectionTitle}>考勤规则</Text>
              <View style={styles.settingsRow}>
                <Text style={styles.settingsLabel}>上班时间</Text>
                <Text style={styles.settingsValue}>{systemSettings?.work_start_time || '09:00'}</Text>
              </View>
              <View style={styles.settingsRow}>
                <Text style={styles.settingsLabel}>下班时间</Text>
                <Text style={styles.settingsValue}>{systemSettings?.work_end_time || '18:00'}</Text>
              </View>
              <View style={styles.settingsRow}>
                <Text style={styles.settingsLabel}>弹性时间</Text>
                <Text style={styles.settingsValue}>{systemSettings?.flexible_minutes || 30}分钟</Text>
              </View>
            </View>

            <View style={styles.settingsSection}>
              <Text style={styles.settingsSectionTitle}>公司信息</Text>
              <View style={styles.settingsRow}>
                <Text style={styles.settingsLabel}>公司名称</Text>
                <Text style={styles.settingsValue}>{systemSettings?.company_name || '--'}</Text>
              </View>
              <View style={styles.settingsRow}>
                <Text style={styles.settingsLabel}>联系电话</Text>
                <Text style={styles.settingsValue}>{systemSettings?.company_phone || '--'}</Text>
              </View>
              <View style={styles.settingsRow}>
                <Text style={styles.settingsLabel}>公司地址</Text>
                <Text style={styles.settingsValue}>{systemSettings?.company_address || '--'}</Text>
              </View>
            </View>
          </ScrollView>
        )
      )}

      {/* 部门创建/编辑弹窗 */}
      <FormModal
        visible={showDeptModal}
        title={editingDept ? '编辑部门' : '创建部门'}
        onClose={() => {
          setShowDeptModal(false);
          resetDeptForm();
        }}
        onSubmit={handleDeptSubmit}
        submitting={submitting}
      >
        <FormItem label="部门名称" required>
          <TextInput
            style={styles.input}
            placeholder="请输入部门名称"
            value={deptForm.name}
            onChangeText={text => setDeptForm(prev => ({ ...prev, name: text }))}
          />
        </FormItem>
        <FormItem label="部门描述">
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="请输入部门描述"
            multiline
            numberOfLines={3}
            value={deptForm.description}
            onChangeText={text => setDeptForm(prev => ({ ...prev, description: text }))}
          />
        </FormItem>
      </FormModal>

      {/* 职位创建/编辑弹窗 */}
      <FormModal
        visible={showPosModal}
        title={editingPos ? '编辑职位' : '创建职位'}
        onClose={() => {
          setShowPosModal(false);
          resetPosForm();
        }}
        onSubmit={handlePosSubmit}
        submitting={submitting}
      >
        <FormItem label="职位名称" required>
          <TextInput
            style={styles.input}
            placeholder="请输入职位名称"
            value={posForm.name}
            onChangeText={text => setPosForm(prev => ({ ...prev, name: text }))}
          />
        </FormItem>
        <FormItem label="所属部门">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {departments.map(dept => (
              <TouchableOpacity
                key={dept.id}
                style={[styles.chip, posForm.deptId === String(dept.id) && styles.chipActive]}
                onPress={() => setPosForm(prev => ({ ...prev, deptId: String(dept.id) }))}
              >
                <Text style={[styles.chipText, posForm.deptId === String(dept.id) && styles.chipTextActive]}>
                  {dept.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </FormItem>
      </FormModal>

      {/* 删除确认弹窗 */}
      <ConfirmDialog
        visible={showDeleteDialog}
        title={deleteType === 'department' ? '删除部门' : '删除职位'}
        message={`确定要删除这个${deleteType === 'department' ? '部门' : '职位'}吗？此操作不可撤销。`}
        onConfirm={handleDeleteDept}
        onCancel={() => {
          setShowDeleteDialog(false);
          setDeleteId(null);
        }}
        confirmText="删除"
        destructive
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f5f6f8' },
  header: { backgroundColor: '#5a5ce5', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, height: 56 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#ffffff' },
  headerIcon: { padding: 4 },
  tabBar: { flexDirection: 'row', backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#f1f1f1' },
  tabItem: { flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabItemActive: { borderBottomColor: '#5a5ce5' },
  tabText: { fontSize: 14, color: '#999999' },
  tabTextActive: { color: '#5a5ce5', fontWeight: 'bold' },
  listContainer: { padding: 16, paddingBottom: 40 },
  listItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5, elevation: 2 },
  listItemIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#f0f5ff', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  listItemContent: { flex: 1 },
  listItemTitle: { fontSize: 16, fontWeight: 'bold', color: '#333333', marginBottom: 4 },
  listItemDesc: { fontSize: 13, color: '#666666' },
  listItemCount: { fontSize: 14, color: '#5a5ce5', fontWeight: 'bold' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, color: '#999', marginTop: 12 },
  settingsContainer: { flex: 1 },
  settingsContent: { padding: 16, paddingBottom: 40 },
  settingsSection: { backgroundColor: '#ffffff', borderRadius: 12, padding: 16, marginBottom: 16 },
  settingsSectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333333', marginBottom: 16 },
  settingsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  settingsLabel: { fontSize: 14, color: '#666666' },
  settingsValue: { fontSize: 14, color: '#333333', fontWeight: '500' },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#5a5ce5',
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  addBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: '#5a5ce5',
  },
  chipText: {
    fontSize: 13,
    color: '#666',
  },
  chipTextActive: {
    color: '#fff',
    fontWeight: '500',
  },
});
