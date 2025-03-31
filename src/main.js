import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './assets/main.css'
import { config } from './config'

// Create Vue app
const app = createApp(App)

// Make config available globally to components
app.config.globalProperties.$config = config

// Use router
app.use(router)

// Mount app
app.mount('#app')

// Ensure Font Awesome is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Check if Font Awesome is already included
  const hasFontAwesome = document.querySelector('link[href*="font-awesome"]') ||
                        document.querySelector('link[href*="fontawesome"]');

  if (!hasFontAwesome) {
    // Add Font Awesome if not already included
    const fontAwesomeLink = document.createElement('link');
    fontAwesomeLink.rel = 'stylesheet';
    fontAwesomeLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css';
    document.head.appendChild(fontAwesomeLink);
    console.log('Font Awesome was automatically added to the page');
  }
});

// Log config in development mode
if (import.meta.env.DEV) {
  console.log('App Config:', config)
}
