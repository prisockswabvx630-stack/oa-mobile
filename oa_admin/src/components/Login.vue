<template>
  <div class="login-fullscreen">
    <div class="login-card">
      <div class="login-logo">OA</div>
      <h1 class="login-title">智能OA办公系统</h1>
      <p class="login-subtitle">管理后台登录</p>

      <form @submit.prevent="handleSubmit">
        <div class="login-form-group">
          <label class="login-label">账号</label>
          <input ref="usernameInput" type="text" class="login-input" v-model="username" placeholder="请输入账号">
        </div>
        <div class="login-form-group">
          <label class="login-label">密码</label>
          <input type="password" class="login-input" v-model="password" placeholder="请输入密码">
        </div>
        <div class="login-form-group">
          <label class="login-label">验证码</label>
          <div class="captcha-container">
            <input type="text" class="login-input captcha-input" v-model="captchaInput" placeholder="请输入验证码">
            <div class="captcha-code-box" @click="generateCaptcha">{{ captchaCode }}</div>
          </div>
        </div>

        <div class="login-options">
          <label class="remember-me">
            <input type="checkbox" v-model="rememberMe"> 记住密码
          </label>
          <a class="forgot-password" @click.prevent="forgotPassword">忘记密码？</a>
        </div>

        <button type="submit" class="btn-login">登 录</button>
      </form>

      <div class="login-third-party">
        <div class="third-party-divider">其他登录方式</div>
        <div class="third-party-btns">
          <button class="third-party-btn" @click="thirdPartyLogin('企业微信')">企业微信</button>
          <button class="third-party-btn" @click="thirdPartyLogin('钉钉')">钉钉</button>
          <button class="third-party-btn" @click="thirdPartyLogin('SSO单点')">SSO单点</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue';
import { login } from '../api';

const emit = defineEmits(['login-success']);

const username = ref('');
const password = ref('');
const captchaInput = ref('');
const captchaCode = ref('');
const rememberMe = ref(true);
const usernameInput = ref<HTMLInputElement | null>(null);

const generateCaptcha = () => {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  captchaCode.value = code;
};

const handleSubmit = async () => {
  if (captchaInput.value.toUpperCase() !== captchaCode.value) {
    alert('验证码输入错误！');
    generateCaptcha();
    return;
  }

  try {
    const user = await login(username.value, password.value);
    if (user) {
      localStorage.setItem('currentUser', JSON.stringify(user));
      emit('login-success');
    }
  } catch (error: any) {
    alert(error.message || '用户名或密码错误！');
    generateCaptcha();
  }
};

const forgotPassword = () => {
  alert('请联系系统管理员重置密码。');
};

const thirdPartyLogin = (platform: string) => {
  alert(`${platform} 登录功能尚未开放，请使用账号密码登录。`);
};

onMounted(() => {
  generateCaptcha();
  nextTick(() => usernameInput.value?.focus());
});
</script>
