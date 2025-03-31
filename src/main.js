import './assets/main.css'
import '@fortawesome/fontawesome-free/css/all.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// Log environment variables for debugging (will be removed in production)
console.log('Environment variables:');
console.log('VITE_AZURE_CLIENT_ID:', import.meta.env.VITE_AZURE_CLIENT_ID);
console.log('VITE_AZURE_TENANT_ID:', import.meta.env.VITE_AZURE_TENANT_ID);
console.log('API URL:', import.meta.env.VITE_API_URL);

// Simple app initialization
const app = createApp(App)
app.use(router)
app.mount('#app')
