import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert, Modal } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function AboutScreen() {
  const router = useRouter();
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [modalType, setModalType] = useState<'service' | 'privacy' | null>(null);

  const handleCheckUpdate = () => {
    setCheckingUpdate(true);
    setTimeout(() => {
      setCheckingUpdate(false);
      Alert.alert('提示', '当前已是最新版本 (v1.0.0)');
    }, 1200);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerIcon}>
          <Feather name="arrow-left" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>关于应用</Text>
        <View style={styles.headerIcon} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.container}>
        
        {/* App Logo & Meta */}
        <View style={styles.logoSection}>
          <View style={styles.logoBox}>
            <Feather name="briefcase" size={40} color="#ffffff" />
          </View>
          <Text style={styles.appName}>星协办公 (Domes OA)</Text>
          <Text style={styles.versionText}>Version 1.0.0</Text>
        </View>

        {/* 菜单列表 */}
        <View style={styles.menuCard}>
          <TouchableOpacity style={styles.menuRow} onPress={handleCheckUpdate} disabled={checkingUpdate}>
            <Text style={styles.menuTitle}>检查更新</Text>
            {checkingUpdate ? (
              <Text style={styles.menuValue}>检查中...</Text>
            ) : (
              <Text style={styles.menuValue}>新版本检测</Text>
            )}
            <Feather name="chevron-right" size={20} color="#94a3b8" />
          </TouchableOpacity>
          
          <View style={styles.divider} />
          
          <TouchableOpacity style={styles.menuRow} onPress={() => setModalType('service')}>
            <Text style={styles.menuTitle}>用户服务协议</Text>
            <Feather name="chevron-right" size={20} color="#94a3b8" />
          </TouchableOpacity>

          <View style={styles.divider} />
          
          <TouchableOpacity style={styles.menuRow} onPress={() => setModalType('privacy')}>
            <Text style={styles.menuTitle}>隐私政策规范</Text>
            <Feather name="chevron-right" size={20} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        {/* 版权信息 */}
        <View style={styles.footer}>
          <Text style={styles.copyrightText}>Copyright © 2026 星协科技. All Rights Reserved.</Text>
        </View>

      </ScrollView>

      {/* 服务协议与隐私政策弹窗 */}
      <Modal visible={modalType !== null} animationType="slide" transparent={false}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalType(null)} style={styles.modalCloseBtn}>
              <Feather name="x" size={24} color="#333333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {modalType === 'service' ? '用户服务协议' : '隐私政策规范'}
            </Text>
            <View style={{ width: 40 }} />
          </View>
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={true}>
            {modalType === 'service' ? (
              <View style={styles.docWrapper}>
                <Text style={styles.docTitle}>星协移动办公用户服务协议</Text>
                <Text style={styles.docTime}>发布日期：2026年5月22日</Text>
                <Text style={styles.docText}>
                  欢迎您使用星协移动办公系统（以下简称“本服务”）。本服务是星协公司为您和您所在的企业组织（以下简称“企业”）提供的协同办公和事务管理工具。
                </Text>
                <Text style={styles.docSubTitle}>一、 账号使用规范</Text>
                <Text style={styles.docText}>
                  1.1 您的账号通常由您所在的企业或组织分配（如工号或员工账号）。您有义务妥善保管账号密码安全，并对以您账号名义进行的考勤打卡、日常报销提交、敏感数据查阅负完全法律责任。
                </Text>
                <Text style={styles.docText}>
                  1.2 严禁将账号转让、出借给任何第三方，或进行恶意仿真、外挂篡改考勤打卡地理定位（LBS）等作弊违规行为。
                </Text>
                <Text style={styles.docSubTitle}>二、 费用报销及薪资安全</Text>
                <Text style={styles.docText}>
                  2.1 当您使用日常费用报销模块时，必须对所提交明细账目的真实性负责。
                </Text>
                <Text style={styles.docText}>
                  2.2 薪资单模块为您的核心敏感隐私，系统提供二次密码校验与平铺动态半透明水印防截图保护。请妥善保护敏感页面，防止被截屏泄露。
                </Text>
              </View>
            ) : (
              <View style={styles.docWrapper}>
                <Text style={styles.docTitle}>星协移动办公隐私政策规范</Text>
                <Text style={styles.docTime}>更新日期：2026年5月22日</Text>
                <Text style={styles.docText}>
                  我们深知个人隐私对您的重要性，并致力于保护您的个人信息。本隐私政策规范解释了我们在您使用星协系统时收集、使用和存储个人信息的情况。
                </Text>
                <Text style={styles.docSubTitle}>一、 考勤地理定位 (LBS) 数据收集</Text>
                <Text style={styles.docText}>
                  为了完成企业打卡考勤要求，在您使用考勤打卡服务时，系统会获取您的GPS经纬度数据以及当前所连接的公司办公Wi-Fi SSID及硬件设备指纹ID。这部分数据仅用于考勤判定校验，不用于您的日常行为轨迹跟踪。
                </Text>
                <Text style={styles.docSubTitle}>二、 数据使用与隐私保护</Text>
                <Text style={styles.docText}>
                  2.1 我们在隐私设置中为您提供了防骚扰搜索控制、是否公开在线状态等开关配置，您可以根据需要自由调整。
                </Text>
                <Text style={styles.docText}>
                  2.2 我们会对您的操作行为（如登录、安全强退操作等）生成必要的审计日志，以保障系统的整体安全性与合规性。
                </Text>
              </View>
            )}
            <View style={{ height: 60 }} />
          </ScrollView>
        </SafeAreaView>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f5f6f8' },
  header: { backgroundColor: '#5a5ce5', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, height: 56 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#ffffff' },
  headerIcon: { padding: 4, width: 32 },
  container: { flex: 1, paddingHorizontal: 16 },
  logoSection: { alignItems: 'center', marginVertical: 40 },
  logoBox: { width: 80, height: 80, borderRadius: 20, backgroundColor: '#5a5ce5', justifyContent: 'center', alignItems: 'center', shadowColor: '#5a5ce5', shadowOpacity: 0.3, shadowRadius: 10, elevation: 6, marginBottom: 16 },
  appName: { fontSize: 20, fontWeight: 'bold', color: '#1e293b', marginBottom: 6 },
  versionText: { fontSize: 14, color: '#64748b' },
  menuCard: { backgroundColor: '#ffffff', borderRadius: 16, paddingHorizontal: 16, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5, elevation: 2 },
  menuRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 18 },
  menuTitle: { fontSize: 15, color: '#1e293b', fontWeight: '500', flex: 1 },
  menuValue: { fontSize: 14, color: '#94a3b8', marginRight: 8 },
  divider: { height: 1, backgroundColor: '#f1f5f9' },
  footer: { alignItems: 'center', marginTop: 60, marginBottom: 20 },
  copyrightText: { fontSize: 11, color: '#94a3b8' },
  modalContainer: { flex: 1, backgroundColor: '#ffffff' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, height: 56, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  modalCloseBtn: { padding: 4 },
  modalTitle: { fontSize: 17, fontWeight: 'bold', color: '#333333' },
  modalContent: { flex: 1, padding: 20 },
  docWrapper: { paddingBottom: 30 },
  docTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginBottom: 8 },
  docTime: { fontSize: 12, color: '#64748b', marginBottom: 20 },
  docSubTitle: { fontSize: 15, fontWeight: 'bold', color: '#1e293b', marginTop: 20, marginBottom: 10 },
  docText: { fontSize: 14, color: '#475569', lineHeight: 22, marginBottom: 10 }
});
