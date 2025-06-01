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
            <div class="profile" v-if="user">
                <div class="avatar" v-if="user.photoURL">
                    <img :src="user.photoURL" alt="User Avatar" />
                </div>
                <div class="avatar initials" v-else>
                     {{ getInitials }}
                </div>
                <div class="profile-info">
                    <p class="displayName">{{ user.firstName || user.first_name }} {{ user.lastName || user.last_name }}</p>
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

                <!-- Admin Section -->
                <div class="nav-section" v-if="isAdmin">
                    <h3>Administration</h3>
                    <NavOption to="/admin">
                        <i class="fas fa-cog"></i> Admin Dashboard
                    </NavOption>
                </div>

                <div class="nav-section">
                    <h3>Assessments</h3>
                    <NavOption to="/assessments">
                        <i class="fas fa-tasks"></i> {{ isTeacher || isAdmin ? 'Assessments' : 'My Assessments' }}
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
import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
import { useRouter } from 'vue-router';
import NavOption from './NavOption.vue';
import { authService } from '../../services/api';

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

const getInitials = computed(() => {
  const first = user.value.firstName || user.value.first_name || '';
  const last = user.value.lastName || user.value.last_name || '';
  return `${first?.[0] || ''}${last?.[0] || ''}`.toUpperCase();
});


const signOutUser = async () => {
    try {
        // Clear local tokens
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        user.value = null;

        // Just navigate to login page, without Microsoft logout
        router.push('/?logout=true');
    } catch (error) {
        console.error("Sign out error:", error);
        // Fallback: force navigation to login
        window.location.href = '/';
    }
};

const userRole = ref('Student');
const isTeacher = ref(false);
const isAdmin = ref(false);

const checkUserRole = async () => {
    try {
        const roleResponse = await authService.checkUserRole();
        console.log('NavBar - User role check response:', roleResponse.data);
        isTeacher.value = roleResponse.data.role === 'teacher' || roleResponse.data.role === 'admin';
        isAdmin.value = roleResponse.data.role === 'admin';
        console.log('NavBar - isAdmin:', isAdmin.value);
        userRole.value = roleResponse.data.role === 'admin'
                        ? 'Administrator'
                        : (isTeacher.value ? 'Teacher' : 'Student');
    } catch (error) {
        console.error('Error checking user role:', error);
    }
};

onMounted(async () => {
    // Check if there's a saved token
    const token = localStorage.getItem('auth_token');
    if (token) {
        try {
            const response = await authService.getCurrentUser();
            console.table(response.data.user);
            // Handle different property naming conventions that might come from the API
            user.value = {
                ...response.data.user,
                firstName: response.data.user.first_name || response.data.user.firstName,
                lastName: response.data.user.last_name || response.data.user.lastName
            };

            console.log("user", user.value);

            // Get user role - use the new function
            await checkUserRole();
        } catch (error) {
            console.error('Failed to retrieve user:', error);
            // Clear invalid token
            localStorage.removeItem('auth_token');
            router.push('/');
        }
    } else {
        router.push('/');
    }

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
    overflow-y: auto; /* Enable vertical scrolling */
    overflow-x: hidden; /* Hide horizontal scrollbar */

    /* Updated scrollbar styling */
    scrollbar-width: thin;
    scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
}

/* Updated WebKit scrollbar styling */
.navBar::-webkit-scrollbar {
    width: 4px;
}

.navBar::-webkit-scrollbar-track {
    background: transparent;
}

.navBar::-webkit-scrollbar-thumb {
    background-color: rgba(255, 255, 255, 0.2);
    border-radius: 4px;
    border: none;
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

.avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar.initials {
  background-color: #ccc;
  color: #fff;
  font-weight: bold;
  font-size: 18px;
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
