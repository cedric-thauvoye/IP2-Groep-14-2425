<template>
    <div v-if="user">
        <p>Redirecting to home...</p>
    </div>
    <div v-else>
        <p><button @click="signInWithMicrosoft">Sign in With Microsoft</button></p>
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
