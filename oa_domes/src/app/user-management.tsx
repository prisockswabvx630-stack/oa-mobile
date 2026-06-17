import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, ActivityIndicator, Alert, TextInput, Modal, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { fetchUsers, createUser, updateUser, deleteUser, resetUserPassword, fetchDepartments, fetchPositions } from '../api/services';
import { getCurrentUser } from '../api/session';
import FormModal from '../components/FormModal';
import FormItem from '../components/FormItem';
import ConfirmDialog from '../components/ConfirmDialog';

export default function UserManagementScreen() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');

  // 部门和职位数据
  const [departments, setDepartments] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);

  // 创建/编辑相关状态
  const [showFormModal, setShowFormModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    username: '',
    realName: '',
    gender: '1',
    phone: '',
    email: '',
    deptId: '',
    posId: '',
    password: '',
  });

  // 删除确认
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // 重置密码确认
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetId, setResetId] = useState<string | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await fetchUsers();
      setUsers(data || []);
    } catch (err) {
      console.error('加载用户失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadDepartmentsAndPositions = async () => {
    try {
      const [deptData, posData] = await Promise.all([
        fetchDepartments(),
        fetchPositions(),
      ]);
      setDepartments(deptData || []);
      setPositions(posData || []);
    } catch (err) {
      console.error('加载部门职位失败:', err);
    }
  };

  useEffect(() => {
    setCurrentUser(getCurrentUser());
    loadUsers();
    loadDepartmentsAndPositions();
  }, []);

  const filteredUsers = users.filter(u => {
    if (!searchText) return true;
    const search = searchText.toLowerCase();
    return (
      u.real_name?.toLowerCase().includes(search) ||
      u.username?.toLowerCase().includes(search) ||
      u.dept_name?.toLowerCase().includes(search) ||
      u.pos_name?.toLowerCase().includes(search)
    );
  });

  const resetForm = () => {
    setFormData({
      username: '',
      realName: '',
      gender: '1',
      phone: '',
      email: '',
      deptId: '',
      posId: '',
      password: '',
    });
    setEditingUser(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowFormModal(true);
  };

  const openEditModal = (user: any) => {
    setEditingUser(user);
    setFormData({
      username: user.username || '',
      realName: user.real_name || '',
      gender: String(user.gender || '1'),
      phone: user.phone || '',
      email: user.email || '',
      deptId: String(user.dept_id || ''),
      posId: String(user.pos_id || ''),
      password: '',
    });
    setShowFormModal(true);
  };

  const handleSubmit = async () => {
    if (!formData.username.trim()) {
      Alert.alert('提示', '请输入用户名');
      return;
    }
    if (!formData.realName.trim()) {
      Alert.alert('提示', '请输入真实姓名');
      return;
    }
    if (!editingUser && !formData.password) {
      Alert.alert('提示', '请输入初始密码');
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        username: formData.username,
        real_name: formData.realName,
        gender: parseInt(formData.gender, 10),
        phone: formData.phone,
        email: formData.email,
        dept_id: formData.deptId ? parseInt(formData.deptId, 10) : null,
        pos_id: formData.posId ? parseInt(formData.posId, 10) : null,
      };

      if (!editingUser) {
        payload.password = formData.password;
      }

      if (editingUser) {
        await updateUser(editingUser.id, payload);
        Alert.alert('成功', '用户信息已更新');
      } else {
        await createUser(payload);
        Alert.alert('成功', '用户已创建');
      }

      setShowFormModal(false);
      resetForm();
      await loadUsers();
    } catch (err: any) {
      Alert.alert('操作失败', err.message || '系统错误');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteUser(deleteId);
      Alert.alert('成功', '用户已禁用');
      setShowDeleteDialog(false);
      setDeleteId(null);
      await loadUsers();
    } catch (err: any) {
      Alert.alert('操作失败', err.message || '系统错误');
    }
  };

  const handleResetPassword = async () => {
    if (!resetId) return;
    try {
      await resetUserPassword(resetId);
      Alert.alert('成功', '密码已重置为默认密码：123456');
      setShowResetDialog(false);
      setResetId(null);
    } catch (err: any) {
      Alert.alert('操作失败', err.message || '系统错误');
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.card}
      onLongPress={() => {
        Alert.alert(
          '用户操作',
          `对"${item.real_name}"进行操作`,
          [
            { text: '编辑', onPress: () => openEditModal(item) },
            { text: '重置密码', onPress: () => {
              setResetId(String(item.id));
              setShowResetDialog(true);
            }},
            { text: '禁用', style: 'destructive', onPress: () => {
              setDeleteId(String(item.id));
              setShowDeleteDialog(true);
            }},
            { text: '取消', style: 'cancel' },
          ]
        );
      }}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.real_name?.[0] || 'U'}</Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.real_name}</Text>
          <Text style={styles.userRole}>{item.dept_name || '未知部门'} • {item.pos_name || '未知职位'}</Text>
        </View>
        <View style={[styles.statusBadge, item.status === 1 ? styles.statusActive : styles.statusInactive]}>
          <Text style={[styles.statusText, item.status === 1 ? styles.textActive : styles.textInactive]}>
            {item.status === 1 ? '正常' : '禁用'}
          </Text>
        </View>
      </View>
      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <Feather name="user" size={14} color="#999" />
          <Text style={styles.infoText}>用户名: {item.username}</Text>
        </View>
        <View style={styles.infoRow}>
          <Feather name="phone" size={14} color="#999" />
          <Text style={styles.infoText}>手机: {item.phone || '--'}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerIcon}>
          <Feather name="arrow-left" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>用户管理</Text>
        <TouchableOpacity style={styles.headerIcon} onPress={openCreateModal}>
          <Feather name="plus" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Feather name="search" size={18} color="#999" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="搜索用户姓名、部门、职位..."
          placeholderTextColor="#999"
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{users.length}</Text>
          <Text style={styles.statLabel}>总用户数</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{users.filter(u => u.status === 1).length}</Text>
          <Text style={styles.statLabel}>正常用户</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{users.filter(u => u.status !== 1).length}</Text>
          <Text style={styles.statLabel}>禁用用户</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#5a5ce5" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filteredUsers}
          renderItem={renderItem}
          keyExtractor={item => item.id?.toString() || Math.random().toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Feather name="users" size={48} color="#ccc" />
              <Text style={styles.emptyText}>暂无用户数据</Text>
            </View>
          }
        />
      )}

      {/* 创建/编辑用户弹窗 */}
      <FormModal
        visible={showFormModal}
        title={editingUser ? '编辑用户' : '创建用户'}
        onClose={() => {
          setShowFormModal(false);
          resetForm();
        }}
        onSubmit={handleSubmit}
        submitting={submitting}
      >
        <FormItem label="用户名" required>
          <TextInput
            style={styles.input}
            placeholder="请输入用户名"
            value={formData.username}
            onChangeText={text => setFormData(prev => ({ ...prev, username: text }))}
            editable={!editingUser}
          />
        </FormItem>

        <FormItem label="真实姓名" required>
          <TextInput
            style={styles.input}
            placeholder="请输入真实姓名"
            value={formData.realName}
            onChangeText={text => setFormData(prev => ({ ...prev, realName: text }))}
          />
        </FormItem>

        <FormItem label="性别">
          <View style={styles.genderRow}>
            <TouchableOpacity
              style={[styles.genderChip, formData.gender === '1' && styles.genderChipActive]}
              onPress={() => setFormData(prev => ({ ...prev, gender: '1' }))}
            >
              <Text style={[styles.genderChipText, formData.gender === '1' && styles.genderChipTextActive]}>男</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.genderChip, formData.gender === '2' && styles.genderChipActive]}
              onPress={() => setFormData(prev => ({ ...prev, gender: '2' }))}
            >
              <Text style={[styles.genderChipText, formData.gender === '2' && styles.genderChipTextActive]}>女</Text>
            </TouchableOpacity>
          </View>
        </FormItem>

        <FormItem label="手机号">
          <TextInput
            style={styles.input}
            placeholder="请输入手机号"
            keyboardType="phone-pad"
            value={formData.phone}
            onChangeText={text => setFormData(prev => ({ ...prev, phone: text }))}
          />
        </FormItem>

        <FormItem label="邮箱">
          <TextInput
            style={styles.input}
            placeholder="请输入邮箱"
            keyboardType="email-address"
            value={formData.email}
            onChangeText={text => setFormData(prev => ({ ...prev, email: text }))}
          />
        </FormItem>

        <FormItem label="部门">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {departments.map(dept => (
              <TouchableOpacity
                key={dept.id}
                style={[styles.chip, formData.deptId === String(dept.id) && styles.chipActive]}
                onPress={() => setFormData(prev => ({ ...prev, deptId: String(dept.id) }))}
              >
                <Text style={[styles.chipText, formData.deptId === String(dept.id) && styles.chipTextActive]}>
                  {dept.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </FormItem>

        <FormItem label="职位">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {positions.map(pos => (
              <TouchableOpacity
                key={pos.id}
                style={[styles.chip, formData.posId === String(pos.id) && styles.chipActive]}
                onPress={() => setFormData(prev => ({ ...prev, posId: String(pos.id) }))}
              >
                <Text style={[styles.chipText, formData.posId === String(pos.id) && styles.chipTextActive]}>
                  {pos.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </FormItem>

        {!editingUser && (
          <FormItem label="初始密码" required>
            <TextInput
              style={styles.input}
              placeholder="请输入初始密码"
              secureTextEntry
              value={formData.password}
              onChangeText={text => setFormData(prev => ({ ...prev, password: text }))}
            />
          </FormItem>
        )}
      </FormModal>

      {/* 删除确认弹窗 */}
      <ConfirmDialog
        visible={showDeleteDialog}
        title="禁用用户"
        message="确定要禁用这个用户吗？禁用后该用户将无法登录系统。"
        onConfirm={handleDelete}
        onCancel={() => {
          setShowDeleteDialog(false);
          setDeleteId(null);
        }}
        confirmText="禁用"
        destructive
      />

      {/* 重置密码确认弹窗 */}
      <ConfirmDialog
        visible={showResetDialog}
        title="重置密码"
        message="确定要重置该用户的密码吗？重置后密码将变为：123456"
        onConfirm={handleResetPassword}
        onCancel={() => {
          setShowResetDialog(false);
          setResetId(null);
        }}
        confirmText="重置"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f5f6f8' },
  header: { backgroundColor: '#5a5ce5', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, height: 56 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#ffffff' },
  headerIcon: { padding: 4 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 20, paddingHorizontal: 16, height: 44, marginHorizontal: 16, marginTop: 16, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5, elevation: 2 },
  searchInput: { flex: 1, color: '#333', fontSize: 14 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: 16, marginTop: 16 },
  statBox: { width: '31%', backgroundColor: '#ffffff', borderRadius: 12, paddingVertical: 16, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5, elevation: 2 },
  statNum: { fontSize: 22, fontWeight: 'bold', color: '#5a5ce5', marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#999' },
  listContainer: { padding: 16, paddingBottom: 40 },
  card: { backgroundColor: '#ffffff', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#e0e7ff', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { color: '#5a5ce5', fontSize: 18, fontWeight: 'bold' },
  userInfo: { flex: 1 },
  userName: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  userRole: { fontSize: 13, color: '#666' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusActive: { backgroundColor: '#ecfdf5' },
  statusInactive: { backgroundColor: '#fee2e2' },
  statusText: { fontSize: 11, fontWeight: 'bold' },
  textActive: { color: '#10b981' },
  textInactive: { color: '#ef4444' },
  cardBody: { borderTopWidth: 1, borderTopColor: '#f1f1f1', paddingTop: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  infoText: { fontSize: 13, color: '#666', marginLeft: 8 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, color: '#999', marginTop: 12 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e5e5', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#333' },
  genderRow: { flexDirection: 'row', gap: 8 },
  genderChip: { flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: '#f0f0f0', alignItems: 'center' },
  genderChipActive: { backgroundColor: '#5a5ce5' },
  genderChipText: { fontSize: 14, color: '#666' },
  genderChipTextActive: { color: '#fff', fontWeight: '500' },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f0f0f0', marginRight: 8 },
  chipActive: { backgroundColor: '#5a5ce5' },
  chipText: { fontSize: 13, color: '#666' },
  chipTextActive: { color: '#fff', fontWeight: '500' },
});
