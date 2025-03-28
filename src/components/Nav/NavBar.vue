<template>
    <div class="nav-container">
        <button v-if="isSmallScreen" @click="toggleNavBar" class="toggle-button">
            <i class="fas fa-bars"></i>
        </button>
        <nav class="navBar" v-if="user" :class="{ show: isNavBarVisible || !isSmallScreen }">
            <button v-if="isSmallScreen" @click="toggleNavBar" class="close-button">
                <i class="fas fa-times"></i>
            </button>

            <!-- Profile Section -->
            <div class="profile">
                <img :src="user.photoURL || 'https://placehold.co/50'" alt="User Avatar" class="avatar">
                <div class="profile-info">
                    <p class="displayName">{{ user.displayName }}</p>
                    <p class="role">{{ userRole }}</p>
                </div>
            </div>

            <!-- Navigation Options -->
            <div class="navOptions">
                <div class="nav-section">
                    <h3>Main</h3>
                    <NavOption to="/home">
                        <i class="fas fa-home"></i> Dashboard
                    </NavOption>
                </div>

                <div class="nav-section">
                    <h3>Academic</h3>
                    <NavOption to="/courses">
                        <i class="fas fa-book"></i> Courses
                    </NavOption>
                    <NavOption to="/groups">
                        <i class="fas fa-users"></i> Groups
                    </NavOption>
                </div>

                <div class="nav-section" v-if="isTeacher">
                    <h3>Management</h3>
                    <NavOption to="/students">
                        <i class="fas fa-user-graduate"></i> Students
                    </NavOption>
                    <NavOption to="/import">
                        <i class="fas fa-file-import"></i> Import Data
                    </NavOption>
                </div>

                <div class="nav-section">
                    <h3>Assessments</h3>
                    <NavOption to="/assessments">
                        <i class="fas fa-tasks"></i> My Assessments
                    </NavOption>
                    <NavOption to="/results" v-if="isTeacher">
                        <i class="fas fa-chart-bar"></i> Results
                    </NavOption>
                </div>

                <div class="nav-section bottom-section">
                    <NavOption to="/" @click="signOutUser" class="logout-option">
                        <i class="fas fa-sign-out-alt"></i> Logout
                    </NavOption>
                </div>
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

const userRole = ref('Student');
const isTeacher = ref(false);

onMounted(() => {
    onAuthStateChanged(auth, (loggedInUser) => {
        user.value = loggedInUser;
        // TODO: Get user role from Firestore
        isTeacher.value = true; // Set this based on user's role
        userRole.value = isTeacher.value ? 'Teacher' : 'Student';
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
    background: linear-gradient(180deg, #2C3E50 0%, #3498DB 100%);
    color: #fff;
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
    background: rgba(255, 255, 255, 0.1);
    padding: 20px;
    border-radius: 10px;
    margin: 20px 0;
}

.profile-info {
    display: flex;
    flex-direction: column;
}

.profile .displayName {
    color: white;
    font-weight: bold;
    margin: 0;
}

.profile .role {
    color: #BDC3C7;
    font-size: 0.8em;
    margin: 5px 0 0 0;
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

.nav-section {
    width: 100%;
    margin: 10px 0;
    padding: 0 15px;
}

.nav-section h3 {
    color: #ECF0F1;
    font-size: 0.8em;
    text-transform: uppercase;
    margin: 20px 0 10px 0;
    padding-left: 10px;
}

.bottom-section {
    margin-top: auto;
    padding-bottom: 20px;
}

.logout-option {
    color: #E74C3C !important;
}

i {
    margin-right: 10px;
    width: 20px;
}
</style>
