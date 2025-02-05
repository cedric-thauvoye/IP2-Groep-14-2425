<template>
    <div class="nav-container">
        <button v-if="isSmallScreen" @click="toggleNavBar" class="toggle-button">
            <i class="fas fa-bars"></i>
        </button>
        <nav class="navBar" v-if="user" :class="{ show: isNavBarVisible || !isSmallScreen }">
            <button v-if="isSmallScreen" @click="toggleNavBar" class="close-button">
                <i class="fas fa-times"></i>
            </button>
            <div class="profile">
                <img :src="user.photoURL || 'https://placehold.co/50'" alt="User Avatar" class="avatar">
                <p class="displayName">{{ user.displayName }}</p>
            </div>
            <div class="navOptions">
                <NavOption to="/home">Home</NavOption>
                <NavOption to="/profile">Profile</NavOption>
                <NavOption to="/" color="#ff2828" @click="signOutUser">Logout</NavOption>
            </div>
        </nav>
    </div>
</template>

<script setup>
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import NavOption from './NavOption.vue';

const auth = getAuth();
const user = ref(null);
const isNavBarVisible = ref(false);
const isSmallScreen = ref(window.innerWidth < 1150);
const router = useRouter();

const toggleNavBar = () => {
    isNavBarVisible.value = !isNavBarVisible.value;
    document.querySelector('main').style.marginLeft = isNavBarVisible.value ? '20%' : '0';
};

const updateScreenSize = () => {
    isSmallScreen.value = window.innerWidth < 1150;
    if (!isSmallScreen.value) {
        isNavBarVisible.value = true;
        document.querySelector('main').style.marginLeft = '20%';
    } else {
        isNavBarVisible.value = false;
        document.querySelector('main').style.marginLeft = '0';
    }
};

window.addEventListener('resize', updateScreenSize);

onBeforeUnmount(() => {
    window.removeEventListener('resize', updateScreenSize);
});

const signOutUser = () => {
    signOut(auth).then(() => {
        user.value = null;
        router.push('/');
    }).catch((error) => {
        console.error("Sign out error:", error);
    });
};

onMounted(() => {
    onAuthStateChanged(auth, (loggedInUser) => {
        user.value = loggedInUser;
    });
    updateScreenSize();
});
</script>

<style scoped>
.nav-container {
    display: flex;
}

.navBar {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 10px;
    background-color: #FAFAFA;
    color: white;
    position: fixed;
    top: 0;
    left: 0;
    height: 100%;
    width: 20%;
    box-sizing: border-box;
    transform: translateX(-100%);
    transition: transform 0.3s ease;
}

.navBar.show {
    transform: translateX(0);
}

.toggle-button,
.close-button {
    background-color: #e6e6e6;
    border: none;
    font-size: 24px;
    cursor: pointer;
}

.toggle-button {
    margin-left: 10px;
}

.close-button {
    align-self: flex-end;
}

/* PROFILE */
.profile {
    display: flex;
    width: 100%;
    align-items: center;
    gap: 10px;
}

.profile .displayName {
    color: black;
    font-weight: bold;
}

.profile .avatar {
    width: 50px;
    border-radius: 50%;
}

/* NAV OPTIONS */
.navOptions {
    display: flex;
    margin-top: 20px;
    flex-direction: column;
    width: 100%;
}
</style>
