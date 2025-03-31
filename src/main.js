import './assets/main.css'
import '@fortawesome/fontawesome-free/css/all.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// Log environment variables for debugging (will be removed in production)
console.log('Environment variables:');
console.log('AZURE_CLIENT_ID:', import.meta.env.AZURE_CLIENT_ID || '08c46765-3002-426c-bdef-284ecfee5a40');
console.log('AZURE_TENANT_ID:', import.meta.env.AZURE_TENANT_ID || '5e74901d-334f-46e3-96d1-47d842585abd');
console.log('API URL:', import.meta.env.API_URL || 'http://localhost:3000/api');

// Simple app initialization
const app = createApp(App)
app.use(router)
app.mount('#app')
