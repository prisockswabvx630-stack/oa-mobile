import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface FAQItem {
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    question: '如何进行日常/外勤考勤打卡？',
    answer: '点击工作台的“考勤打卡”，在办公室范围内（200米）打卡即可。若在办公室外或无公司Wi-Fi，打卡会标记为外勤，您可以在打卡仿真控制台中调试直连Office_Wifi或修改虚拟坐标。'
  },
  {
    question: '日常费用报销如何提交和核销？',
    answer: '在工作台进入“费用报销”，点击新增报销单。输入报销总标题、分类，并动态添加各项报销明细（如交通、餐饮等金额与描述）后提交。提交后，财务部门会在管理后台看到并进行打款核销。'
  },
  {
    question: '工资条查看的二次身份认证是什么？',
    answer: '为了您的财务信息安全，每次点击薪资单的眼睛图标时，若在“隐私设置”中开启了“工资条密码校验”，系统会要求您输入当前账号的登录密码，通过服务器校验后才能解锁查看。'
  },
  {
    question: '消息推送未读角标无法同步更新？',
    answer: '当您在移动端收到待办或公告消息时，右上角和底部消息 Tab 会显示未读数。点击进入“消息中心”查看未读消息会自动触发已读更新，并将全局未读数递减。如果未更新，可尝试下拉刷新。'
  }
];

export default function HelpScreen() {
  const router = useRouter();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  // 反馈表单状态
  const [feedbackType, setFeedbackType] = useState<'bug' | 'suggest' | 'question'>('suggest');
  const [content, setContent] = useState('');
  const [contact, setContact] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const handleSubmit = () => {
    if (!content.trim()) {
      Alert.alert('提示', '请填写反馈内容');
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setContent('');
      setContact('');
      Alert.alert('提交成功', '感谢您的宝贵建议！我们已收到您的反馈，会尽快处理。');
    }, 1500);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerIcon}>
          <Feather name="arrow-left" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>帮助与反馈</Text>
        <View style={styles.headerIcon} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.container}>
        
        {/* FAQ 常见问题 */}
        <Text style={styles.sectionTitle}>常见问题 FAQ</Text>
        <View style={styles.faqWrapper}>
          {FAQS.map((item, index) => {
            const isExpanded = expandedIndex === index;
            return (
              <View key={index} style={styles.faqCard}>
                <TouchableOpacity style={styles.faqHeader} onPress={() => toggleExpand(index)} activeOpacity={0.7}>
                  <Text style={styles.faqQuestion}>{item.question}</Text>
                  <Feather 
                    name={isExpanded ? "chevron-up" : "chevron-down"} 
                    size={18} 
                    color="#64748b" 
                  />
                </TouchableOpacity>
                {isExpanded && (
                  <View style={styles.faqContent}>
                    <Text style={styles.faqAnswer}>{item.answer}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* 意见反馈表单 */}
        <Text style={styles.sectionTitle}>意见与建议</Text>
        <View style={[styles.card, { marginBottom: 40 }]}>
          
          <Text style={styles.label}>反馈类型</Text>
          <View style={styles.typeContainer}>
            <TouchableOpacity 
              style={[styles.typeBtn, feedbackType === 'suggest' && styles.typeBtnActive]} 
              onPress={() => setFeedbackType('suggest')}
            >
              <Text style={[styles.typeText, feedbackType === 'suggest' && styles.typeTextActive]}>功能建议</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.typeBtn, feedbackType === 'bug' && styles.typeBtnActive]} 
              onPress={() => setFeedbackType('bug')}
            >
              <Text style={[styles.typeText, feedbackType === 'bug' && styles.typeTextActive]}>程序问题</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.typeBtn, feedbackType === 'question' && styles.typeBtnActive]} 
              onPress={() => setFeedbackType('question')}
            >
              <Text style={[styles.typeText, feedbackType === 'question' && styles.typeTextActive]}>其他问题</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>反馈内容</Text>
          <TextInput
            style={styles.textArea}
            multiline
            numberOfLines={5}
            placeholder="请详细描述您遇到的问题或提出的功能建议，以便我们能更好地为您服务..."
            placeholderTextColor="#94a3b8"
            value={content}
            onChangeText={setContent}
            textAlignVertical="top"
          />

          <Text style={styles.label}>联系方式 (选填)</Text>
          <TextInput
            style={styles.input}
            placeholder="留下微信号/手机号/邮箱，方便我们联系您"
            placeholderTextColor="#94a3b8"
            value={contact}
            onChangeText={setContact}
          />

          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
            {submitting ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.submitBtnText}>提交意见</Text>
            )}
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f5f6f8' },
  header: { backgroundColor: '#5a5ce5', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, height: 56 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#ffffff' },
  headerIcon: { padding: 4, width: 32 },
  container: { flex: 1, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#64748b', marginTop: 24, marginBottom: 8, paddingLeft: 4 },
  faqWrapper: { marginBottom: 12 },
  faqCard: { backgroundColor: '#ffffff', borderRadius: 12, marginBottom: 8, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 3, elevation: 1 },
  faqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  faqQuestion: { fontSize: 14, fontWeight: '600', color: '#1e293b', flex: 1, marginRight: 12 },
  faqContent: { padding: 16, paddingTop: 0, borderTopWidth: 1, borderTopColor: '#f8fafc' },
  faqAnswer: { fontSize: 13, color: '#475569', lineHeight: 20 },
  card: { backgroundColor: '#ffffff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5, elevation: 2 },
  label: { fontSize: 13, fontWeight: '600', color: '#64748b', marginTop: 12, marginBottom: 8 },
  typeContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  typeBtn: { flex: 1, backgroundColor: '#f1f5f9', borderRadius: 10, paddingVertical: 10, alignItems: 'center', marginHorizontal: 4 },
  typeBtnActive: { backgroundColor: '#c7d2fe' },
  typeText: { fontSize: 13, color: '#475569', fontWeight: '500' },
  typeTextActive: { color: '#5a5ce5', fontWeight: 'bold' },
  textArea: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 12, fontSize: 14, color: '#1e293b', height: 120 },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 12, fontSize: 14, color: '#1e293b', marginTop: 4 },
  submitBtn: { backgroundColor: '#5a5ce5', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 24 },
  submitBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '600' }
});
