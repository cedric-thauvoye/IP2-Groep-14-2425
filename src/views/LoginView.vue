<template>
    <div class="login-container">
        <div class="login-card">
            <div class="login-header">
                <img src="https://placehold.co/50" alt="Logo" class="logo">
                <h1>Peer Assessment Tool</h1>
                <p class="subtitle">Sign in with your Odisee account</p>
            </div>

            <div v-if="user" class="loading-state">
                <i class="fas fa-circle-notch fa-spin"></i>
                <p>Redirecting to dashboard...</p>
            </div>
            <div v-else class="login-content">
                <button @click="signInWithMicrosoft" class="login-button">
                    <i class="fab fa-microsoft"></i>
                    Sign in with Microsoft
                </button>
                <p class="login-info">This application is only available for Odisee students and staff.</p>
            </div>
        </div>
    </div>
</template>

<script setup>
import { getAuth, OAuthProvider, signInWithPopup, onAuthStateChanged } from 'firebase/auth';
import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';

const auth = getAuth();
const user = ref(null);
const router = useRouter();

const signInWithMicrosoft = () => {
    const provider = new OAuthProvider('microsoft.com');
    provider.setCustomParameters({
        prompt: 'consent', // Forces the user to select an account
        tenant: "5e74901d-334f-46e3-96d1-47d842585abd" // Odisee tenant ID
    });
    signInWithPopup(auth, provider)
        .then((result) => {
            user.value = result.user;
            console.log("Logged in as: ", user.value.displayName);
        })
        .catch((error) => {
            console.error(error);
        });
};

onMounted(() => {
    onAuthStateChanged(auth, (loggedInUser) => {
        user.value = loggedInUser;
    });
});

watch(user, (newUser) => {
    if (newUser) {
        router.push('/home');
    }
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
    width: 80px;
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

.login-button i {
    margin-right: 10px;
    font-size: 20px;
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
