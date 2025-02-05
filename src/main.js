import './assets/main.css'
import '@fortawesome/fontawesome-free/css/all.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

import { initializeApp } from 'firebase/app'
import { getAnalytics } from 'firebase/analytics'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
    apiKey: 'AIzaSyAoYnXc1dhvCsc0J5tZ3fMH9A9cEHZ7JE0',
    authDomain: 'peerevaluation-odisee.firebaseapp.com',
    databaseURL: 'https://peerevaluation-odisee-default-rtdb.europe-west1.firebasedatabase.app',
    projectId: 'peerevaluation-odisee',
    storageBucket: 'peerevaluation-odisee.firebasestorage.app',
    messagingSenderId: '704206259117',
    appId: '1:704206259117:web:5947ed34a7d13d8efbd724',
    measurementId: 'G-BL43TD4PRB',
}

const fApp = initializeApp(firebaseConfig)
const analytics = getAnalytics(fApp)
const db = getFirestore(fApp)

export { db }

const app = createApp(App)

app.use(router)

app.mount('#app')
