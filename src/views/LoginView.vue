<template>
    <div class="login-container">
        <div class="login-card">
            <div class="login-header">
                <img src="/logo.png" alt="Logo" class="logo">
                <h1>Peer Assessment Tool</h1>
                <p class="subtitle">Sign in with your Odisee account</p>
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
                        <label for="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            v-model="email"
                            placeholder="Enter your email"
                            required
                        >
                    </div>
                    <div class="form-group">
                        <label for="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            v-model="password"
                            placeholder="Enter your password"
                            required
                        >
                    </div>
                    <button type="submit" class="login-button">
                        <i class="fas fa-sign-in-alt"></i>
                        Sign in
                    </button>
                </form>
                <div class="separator">OR</div>
                <button @click="signInWithMicrosoft" class="login-button microsoft">
                    <i class="fab fa-microsoft"></i>
                    Sign in with Microsoft
                </button>
                <p class="login-info">This application is only available for Odisee students and staff.</p>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { authService } from '../services/api';
import { loginWithRedirect, handleRedirectPromise, getAccount, acquireToken } from '../services/msalService';

const email = ref('');
const password = ref('');
const loading = ref(false);
const authError = ref('');
const router = useRouter();

// Check authentication status at startup
const checkAuth = async () => {
    try {
        // Check if user is already logged in via token
        const token = localStorage.getItem('auth_token');
        if (token) {
            router.push('/home');
            return;
        }

        // Handle Microsoft login redirect response
        try {
            const accessToken = await handleRedirectPromise();
            console.log("Access token received:", accessToken ? "Yes" : "No");
            if (accessToken) {
                await handleMicrosoftAuth(accessToken);
                return;
            }
        } catch (redirectError) {
            console.error("Redirect handling error:", redirectError);
            authError.value = "Error processing Microsoft login. Please try again or use email login.";
        }

        // Check if we have a Microsoft account in cache
        try {
            const account = await getAccount(); // Now this is async
            if (account) {
                console.log("Found cached account:", account.username);
                loading.value = true;
                try {
                    const token = await acquireToken();
                    if (token) {
                        await handleMicrosoftAuth(token);
                    } else {
                        loading.value = false;
                    }
                } catch (tokenError) {
                    console.error("Token acquisition error:", tokenError);
                    loading.value = false;
                }
            }
        } catch (accountError) {
            console.error("Error getting account:", accountError);
        }
    } catch (error) {
        console.error("Auth check error:", error);
        loading.value = false;
        authError.value = "Authentication error: " + (error.message || "Unknown error");
    }
};

const handleMicrosoftAuth = async (msalToken) => {
    try {
        loading.value = true;
        console.log("Authenticating with token...");
        // Make sure authService.loginWithMicrosoft is properly implemented
        const response = await authService.loginWithMicrosoft(msalToken);
        console.log("Microsoft auth response:", response.data);

        if (response.data && response.data.token) {
            localStorage.setItem('auth_token', response.data.token);

            // Also store user data in localStorage for immediate access
            if (response.data.user) {
                localStorage.setItem('user_data', JSON.stringify(response.data.user));
            }

            router.push('/home');
        }
    } catch (error) {
        console.error('Microsoft auth error:', error);
        authError.value = error.response?.data?.message || 'Microsoft authentication failed. Please try again.';
        loading.value = false;
    }
};

const handleLogin = async () => {
    loading.value = true;
    authError.value = '';

    try {
        const response = await authService.login(email.value, password.value);
        if (response.data && response.data.token) {
            localStorage.setItem('auth_token', response.data.token);
            router.push('/home');
        }
    } catch (error) {
        console.error('Login error:', error);
        authError.value = error.response?.data?.message || 'Failed to login. Please try again.';
    } finally {
        loading.value = false;
    }
};

const signInWithMicrosoft = async () => {
    try {
        loading.value = true;
        authError.value = '';

        // Add explicit debugging for Azure tenant issues
        console.log("Starting Microsoft login with client ID:",
                    '08c46765-3002-426c-bdef-284ecfee5a40');
        console.log("Tenant ID being used:",
                    '5e74901d-334f-46e3-96d1-47d842585abd');

        await loginWithRedirect();
        // The page will be redirected, so execution won't continue here
    } catch (error) {
        console.error("Error starting Microsoft login:", error);
        authError.value = "Failed to login with Microsoft: " + (error.message || "Unknown error");
        loading.value = false;
    }
};

// Add this function to properly handle different logout scenarios
const handleLogout = () => {
    // Check if we're coming from a logout operation
    const isLoggingOut = new URLSearchParams(window.location.search).get('logout') === 'true';

    if (isLoggingOut) {
        // Clear any remaining tokens and session data
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        sessionStorage.clear();

        // Clear the URL parameter
        window.history.replaceState({}, document.title, window.location.pathname);
    }
};

onMounted(() => {
    handleLogout();
    checkAuth();
});
</script>

<style scoped>
.login-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #2C3E50 0%, #3498DB 100%);
    padding: 20px;
}

.login-card {
    background: white;
    border-radius: 15px;
    padding: 40px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    width: 100%;
    max-width: 400px;
    text-align: center;
}

.login-header {
    margin-bottom: 30px;
}

.logo {
    /*width: 80px;*/
    height: 80px;
    margin-bottom: 20px;
}

h1 {
    color: #2C3E50;
    font-size: 24px;
    margin: 0 0 10px 0;
}

.subtitle {
    color: #7F8C8D;
    margin: 0;
    font-size: 16px;
}

.form-group {
    margin-bottom: 20px;
    text-align: left;
}

.form-group label {
    display: block;
    margin-bottom: 5px;
    color: #2C3E50;
    font-weight: 500;
}

.form-group input {
    width: 100%;
    padding: 12px;
    border: 1px solid #BDC3C7;
    border-radius: 6px;
    font-size: 16px;
    box-sizing: border-box;
}

.login-button {
    background-color: #2C3E50;
    color: white;
    border: none;
    padding: 15px 30px;
    border-radius: 8px;
    font-size: 16px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    margin: 20px 0;
    transition: background-color 0.3s ease;
}

.login-button:hover {
    background-color: #34495E;
}

.login-button.microsoft {
    background-color: #0078D4;
}

.login-button.microsoft:hover {
    background-color: #106EBE;
}

.login-button i {
    margin-right: 10px;
    font-size: 20px;
}

.separator {
    display: flex;
    align-items: center;
    text-align: center;
    color: #7F8C8D;
    margin: 15px 0;
}

.separator::before,
.separator::after {
    content: '';
    flex: 1;
    border-bottom: 1px solid #E0E0E0;
}

.separator::before {
    margin-right: 10px;
}

.separator::after {
    margin-left: 10px;
}

.login-info {
    color: #7F8C8D;
    font-size: 14px;
    margin-top: 20px;
}

.loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 15px;
    color: #2C3E50;
}

.loading-state i {
    font-size: 30px;
    color: #3498DB;
}

.error-message {
    background-color: #FADBD8;
    color: #C0392B;
    padding: 15px;
    border-radius: 6px;
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    gap: 10px;
}

.error-message i {
    font-size: 20px;
}

@media (max-width: 480px) {
    .login-card {
        padding: 30px 20px;
    }

    h1 {
        font-size: 20px;
    }

    .subtitle {
        font-size: 14px;
    }
}
</style>
