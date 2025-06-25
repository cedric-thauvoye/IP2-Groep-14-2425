<template>
    <div class="login-container">
        <div class="login-card">
            <div class="login-header">
                <img src="/logo.png" alt="Logo" class="logo">
                <h1>Peer Assessment Tool</h1>
                <p class="subtitle">🎯 DEMO VERSION - Try it out!</p>
            </div>

            <!-- Quick Login Section -->
            <div class="quick-login">
                <h3 class="quick-login-title">🚀 Quick Demo Login</h3>
                <div class="quick-buttons">
                    <button @click="quickLogin('teacher')" class="quick-btn teacher">
                        <i class="fas fa-chalkboard-teacher"></i>
                        Login as Teacher
                    </button>
                    <button @click="quickLogin('student1')" class="quick-btn student">
                        <i class="fas fa-user-graduate"></i>
                        Login as Student
                    </button>
                    <button @click="quickLogin('admin')" class="quick-btn admin">
                        <i class="fas fa-user-shield"></i>
                        Login as Admin
                    </button>
                </div>
                <p class="demo-note">
                    <i class="fas fa-info-circle"></i>
                    This is a demonstration version with hardcoded data. No real authentication required!
                </p>
            </div>

            <div v-if="loading" class="loading-state">
                <i class="fas fa-circle-notch fa-spin"></i>
                <p>Logging in...</p>
            </div>

            <div v-else class="login-content">
                <div v-if="authError" class="error-message">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>{{ authError }}</p>
                </div>

                <form @submit.prevent="handleLogin">
                    <div class="form-group">
                        <label for="username">Username / Email</label>
                        <input
                            type="text"
                            id="username"
                            v-model="username"
                            placeholder="Try: teacher@demo.com, student1@demo.com, or admin@demo.com"
                            required
                        >
                    </div>
                    <div class="form-group">
                        <label for="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            v-model="password"
                            placeholder="Try: teacher123, student123, or admin123"
                            required
                        >
                    </div>
                    <button type="submit" class="login-button" :disabled="loading">
                        <i class="fas fa-sign-in-alt"></i>
                        Sign in to Demo
                    </button>
                </form>

                <div class="demo-info">
                    <h4>🎮 What you can explore:</h4>
                    <ul>
                        <li><strong>As Teacher:</strong> Create assessments, view results, manage courses</li>
                        <li><strong>As Student:</strong> Complete peer evaluations, view your assessments</li>
                        <li><strong>As Admin:</strong> Full access to all features and data</li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { authService } from '../services/mockApi';  // Using mock API instead

const username = ref('');
const password = ref('');
const loading = ref(false);
const authError = ref('');
const router = useRouter();

// Demo credentials mapping
const DEMO_CREDENTIALS = {
    'teacher': 'teacher123',
    'student1': 'student123',
    'student2': 'student123',
    'student3': 'student123',
    'admin': 'admin123'
};

// Demo email mapping for quick login
const DEMO_EMAILS = {
    'teacher': 'teacher@demo.com',
    'student1': 'student1@demo.com',
    'student2': 'student2@demo.com',
    'student3': 'student3@demo.com',
    'admin': 'admin@demo.com'
};

// Check authentication status at startup
const checkAuth = async () => {
    try {
        const token = localStorage.getItem('auth_token');
        if (token) {
            router.push('/home');
            return;
        }
    } catch (error) {
        console.error("Auth check error:", error);
    }
};

const handleLogin = async () => {
    loading.value = true;
    authError.value = '';

    try {
        const response = await authService.login(username.value, password.value);
        if (response.data && response.data.token) {
            localStorage.setItem('auth_token', response.data.token);
            router.push('/home');
        }
    } catch (error) {
        console.error('Login error:', error);
        authError.value = error.message || 'Invalid credentials. Try the demo accounts above!';
    } finally {
        loading.value = false;
    }
};

const quickLogin = async (role) => {
    username.value = DEMO_EMAILS[role] || role; // Use email for login
    password.value = DEMO_CREDENTIALS[role];
    await handleLogin();
};

onMounted(() => {
    checkAuth();
});
</script>

<style scoped>
.login-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 1rem;
}

.login-card {
    background: white;
    border-radius: 12px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
    padding: 2rem;
    width: 100%;
    max-width: 500px;
    position: relative;
    overflow: hidden;
}

.login-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #667eea, #764ba2);
}

.login-header {
    text-align: center;
    margin-bottom: 2rem;
}

.logo {
    width: 120px;
    height: auto;
    margin-bottom: 1rem;
    max-width: 120px;
    object-fit: contain;
}

.login-header h1 {
    color: #2c3e50;
    margin: 0 0 0.5rem 0;
    font-size: 2rem;
    font-weight: 600;
}

.subtitle {
    color: #ff6b6b;
    font-size: 1.1rem;
    margin: 0;
    font-weight: 600;
}

.demo-instructions {
    background: #f8f9ff;
    border: 2px solid #e3f2fd;
    border-radius: 8px;
    padding: 1.5rem;
    margin-bottom: 2rem;
}

.demo-instructions h3 {
    color: #1976d2;
    margin: 0 0 1rem 0;
    font-size: 1.2rem;
}

.demo-accounts {
    display: grid;
    gap: 1rem;
    margin-bottom: 1rem;
}

.demo-account {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.75rem;
    background: white;
    border-radius: 6px;
    border: 1px solid #e0e0e0;
}

.role {
    padding: 0.4rem 0.8rem;
    border-radius: 20px;
    font-size: 0.85rem;
    font-weight: 600;
    min-width: 80px;
    text-align: center;
}

.role.teacher {
    background: #e3f2fd;
    color: #1976d2;
}

.role.student {
    background: #e8f5e8;
    color: #388e3c;
}

.role.admin {
    background: #fff3e0;
    color: #f57c00;
}

.credentials {
    font-size: 0.9rem;
    line-height: 1.4;
}

.demo-note {
    background: #fff3cd;
    color: #856404;
    padding: 0.75rem;
    border-radius: 6px;
    margin: 0;
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.loading-state {
    text-align: center;
    padding: 2rem;
    color: #666;
}

.loading-state i {
    font-size: 2rem;
    margin-bottom: 1rem;
    color: #667eea;
}

.error-message {
    background: #ffebee;
    color: #c62828;
    padding: 1rem;
    border-radius: 6px;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.form-group {
    margin-bottom: 1.5rem;
}

.form-group label {
    display: block;
    margin-bottom: 0.5rem;
    color: #2c3e50;
    font-weight: 500;
}

.form-group input {
    width: 100%;
    padding: 0.75rem;
    border: 2px solid #e0e0e0;
    border-radius: 6px;
    font-size: 1rem;
    transition: border-color 0.3s ease;
    box-sizing: border-box;
}

.form-group input:focus {
    outline: none;
    border-color: #667eea;
}

.login-button {
    width: 100%;
    padding: 0.875rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
}

.login-button:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
}

.login-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.quick-login {
    margin: 2rem 0;
    padding: 1.5rem;
    background: #fafafa;
    border-radius: 8px;
    border: 1px solid #e0e0e0;
    transition: box-shadow 0.2s ease;
}

.quick-login:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.quick-login h3 {
    text-align: center;
    margin: 0 0 1rem 0;
    color: #666;
    font-weight: 500;
}

.quick-buttons {
    display: grid;
    gap: 1rem;
    margin-bottom: 1.5rem;
}

.quick-btn {
    padding: 0.75rem;
    border: 2px solid transparent;
    border-radius: 6px;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
}

.quick-btn.teacher {
    background: #e3f2fd;
    color: #1976d2;
    border-color: #bbdefb;
}

.quick-btn.teacher:hover {
    background: #bbdefb;
    transform: translateY(-1px);
}

.quick-btn.student {
    background: #e8f5e8;
    color: #388e3c;
    border-color: #c8e6c9;
}

.quick-btn.student:hover {
    background: #c8e6c9;
    transform: translateY(-1px);
}

.quick-btn.admin {
    background: #fff3e0;
    color: #f57c00;
    border-color: #ffcc02;
}

.quick-btn.admin:hover {
    background: #ffcc02;
    color: white;
    transform: translateY(-1px);
}

.demo-info {
    background: #f0f4f8;
    padding: 1.5rem;
    border-radius: 8px;
    margin-top: 2rem;
}

.demo-info h4 {
    color: #2c3e50;
    margin: 0 0 1rem 0;
    font-size: 1.1rem;
}

.demo-info ul {
    margin: 0;
    padding-left: 1.5rem;
    color: #555;
}

.demo-info li {
    margin-bottom: 0.5rem;
    line-height: 1.4;
}

@media (max-width: 768px) {
    .login-card {
        margin: 1rem;
        padding: 1.5rem;
    }

    .demo-accounts {
        grid-template-columns: 1fr;
    }

    .demo-account {
        flex-direction: column;
        text-align: center;
        gap: 0.5rem;
    }
}
</style>
