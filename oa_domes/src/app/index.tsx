import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { login } from '../api/services';
import { setCurrentUser } from '../api/session';

export default function LoginScreen() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('提示', '请输入用户名和密码');
      return;
    }
    setLoading(true);
    try {
      const user = await login(username, password);
      await setCurrentUser(user);
      router.replace('/workbench');
    } catch (error: any) {
      Alert.alert('登录失败', error.message || '用户名或密码错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.inner}
        keyboardShouldPersistTaps="handled"
      >
          <View style={styles.headerContainer}>
            <View style={styles.logoPlaceholder}>
              <Text style={styles.logoText}>OA</Text>
            </View>
            <Text style={styles.title}>智能OA办公</Text>
            <Text style={styles.subtitle}>高效办公 智慧管理</Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="用户名/工号"
                placeholderTextColor="rgba(255,255,255,0.7)"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="密码"
                placeholderTextColor="rgba(255,255,255,0.7)"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <TouchableOpacity style={styles.loginButton} onPress={handleLogin} activeOpacity={0.8} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#6358ee" />
              ) : (
                <Text style={styles.loginButtonText}>登 录</Text>
              )}
            </TouchableOpacity>

            <View style={styles.linksRow}>
              <TouchableOpacity onPress={() => Alert.alert('提示', '请联系系统管理员重置密码。')}>
                <Text style={styles.linkText}>忘记密码?</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => Alert.alert('提示', '请联系管理员开通账号。')}>
                <Text style={styles.linkText}>新用户注册</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>其他登录方式</Text>
            <View style={styles.socialRow}>
              <TouchableOpacity style={styles.socialBtn} onPress={() => Alert.alert('提示', '企业微信登录暂未开放')}><Text style={styles.socialText}>企微</Text></TouchableOpacity>
              <TouchableOpacity style={styles.socialBtn} onPress={() => Alert.alert('提示', '钉钉登录暂未开放')}><Text style={styles.socialText}>钉钉</Text></TouchableOpacity>
              <TouchableOpacity style={styles.socialBtn} onPress={() => Alert.alert('提示', '微信登录暂未开放')}><Text style={styles.socialText}>微信</Text></TouchableOpacity>
            </View>
          </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#6358ee',
  },
  inner: {
    flexGrow: 1,
    paddingHorizontal: 40,
    justifyContent: 'center',
    paddingVertical: 40,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  logoText: {
    fontSize: 36,
    fontWeight: '400',
    color: '#ffffff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 1,
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 24,
    height: 56,
    marginBottom: 20,
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
  },
  loginButton: {
    backgroundColor: '#ffffff',
    borderRadius: 30,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  loginButtonText: {
    color: '#6358ee',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 4,
  },
  linksRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingHorizontal: 10,
  },
  linkText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  footerContainer: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  footerText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    marginBottom: 20,
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  socialBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  socialText: {
    color: '#ffffff',
    fontSize: 13,
  }
});
