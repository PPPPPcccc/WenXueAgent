import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './fonts/local-fonts.css'   /* 本地子集化字体 */
import './styles/ink.css'         /* 全局水墨风样式 */

const app = createApp(App)
app.use(router)
app.mount('#app')
