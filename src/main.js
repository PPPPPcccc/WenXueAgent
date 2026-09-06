import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './styles/ink.css'

const app = createApp(App)
app.use(router)
app.mount('#app')
