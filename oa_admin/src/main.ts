import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { permissionDirective } from './utils/permission'

const app = createApp(App)

// 注册权限指令
app.directive('permission', permissionDirective)

app.mount('#app')
