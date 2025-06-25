<template>
    <div class="nav-container">
        <button v-if="isSmallScreen" @click="toggleNavBar" class="toggle-button">
            <i class="fas fa-bars"></i>
        </button>

        <!-- Mobile overlay backdrop -->
        <div
            v-if="isSmallScreen && isNavBarVisible"
            class="nav-overlay"
            @click="toggleNavBar"
        ></div>

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
                    <NavOption to="/home" @click="handleNavOptionClick">
                        <i class="fas fa-home"></i> Dashboard
                    </NavOption>
                </div>

                <div class="nav-section">
                    <h3>Academic</h3>
                    <NavOption to="/courses" @click="handleNavOptionClick">
                        <i class="fas fa-book"></i> Courses
                    </NavOption>
                    <NavOption to="/groups" @click="handleNavOptionClick">
                        <i class="fas fa-users"></i> Groups
                    </NavOption>
                </div>

                <div class="nav-section" v-if="isTeacher">
                    <h3>Management</h3>
                    <NavOption to="/students" @click="handleNavOptionClick">
                        <i class="fas fa-user-graduate"></i> Students
                    </NavOption>
                    <!-- Import Data removed for demo -->
                </div>

                <!-- Admin Section -->
                <div class="nav-section" v-if="isAdmin">
                    <h3>Administration</h3>
                    <NavOption to="/admin" @click="handleNavOptionClick">
                        <i class="fas fa-cog"></i> Admin Dashboard
                    </NavOption>
                </div>

                <div class="nav-section">
                    <h3>Assessments</h3>
                    <NavOption to="/assessments" @click="handleNavOptionClick">
                        <i class="fas fa-tasks"></i> {{ isTeacher || isAdmin ? 'Assessments' : 'My Assessments' }}
                    </NavOption>
                    <NavOption to="/results" v-if="isTeacher" @click="handleNavOptionClick">
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
import { authService } from '../../services/mockApi';

const user = ref(null);
const isNavBarVisible = ref(false);
const isSmallScreen = ref(window.innerWidth < 768); // Changed from 1150 to 768 for mobile
const router = useRouter();

const toggleNavBar = () => {
    isNavBarVisible.value = !isNavBarVisible.value;

    // Add/remove body scroll lock when menu is open on mobile
    if (isSmallScreen.value) {
        document.body.style.overflow = isNavBarVisible.value ? 'hidden' : '';
    }

    const mainElement = document.querySelector('main');
    if (mainElement) {
        if (isSmallScreen.value) {
            // On mobile, don't adjust margin, just handle overlay
            mainElement.style.marginLeft = '';
        } else {
            // On larger screens, adjust margin as before
            mainElement.style.marginLeft = isNavBarVisible.value ? '20%' : '0';
        }
    }
};

const updateScreenSize = () => {
    const previousIsSmallScreen = isSmallScreen.value;
    isSmallScreen.value = window.innerWidth < 768; // Changed from 1150 to 768

    // Reset body overflow when switching from mobile to desktop
    if (previousIsSmallScreen && !isSmallScreen.value) {
        document.body.style.overflow = '';
    }

    if (!isSmallScreen.value) {
        isNavBarVisible.value = true;
        document.querySelector('main').style.marginLeft = '20%';
    } else {
        isNavBarVisible.value = false;
        document.querySelector('main').style.marginLeft = '0';
    }
};

// Close nav when clicking outside on mobile
const handleClickOutside = (event) => {
    if (isSmallScreen.value && isNavBarVisible.value) {
        const navBar = document.querySelector('.navBar');
        const toggleButton = document.querySelector('.toggle-button');

        if (navBar && !navBar.contains(event.target) && !toggleButton.contains(event.target)) {
            toggleNavBar();
        }
    }
};

// Handle nav option click - close mobile nav
const handleNavOptionClick = () => {
    if (isSmallScreen.value && isNavBarVisible.value) {
        toggleNavBar();
    }
};

// Touch gesture handling for mobile
let touchStartX = 0;
let touchStartY = 0;

const handleTouchStart = (event) => {
    if (isSmallScreen.value && isNavBarVisible.value) {
        touchStartX = event.touches[0].clientX;
        touchStartY = event.touches[0].clientY;
    }
};

const handleTouchEnd = (event) => {
    if (isSmallScreen.value && isNavBarVisible.value) {
        const touchEndX = event.changedTouches[0].clientX;
        const touchEndY = event.changedTouches[0].clientY;
        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;

        // Check if it's a horizontal swipe (more horizontal than vertical movement)
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
            // Swipe left to close navigation
            if (deltaX < -50) {
                toggleNavBar();
            }
        }
    }
};

// Add event listener for clicks outside
onMounted(async () => {
    document.addEventListener('click', handleClickOutside);
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('resize', updateScreenSize);

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

onBeforeUnmount(() => {
    document.removeEventListener('click', handleClickOutside);
    document.removeEventListener('touchstart', handleTouchStart);
    document.removeEventListener('touchend', handleTouchEnd);
    window.removeEventListener('resize', updateScreenSize);
    // Reset body overflow on unmount
    document.body.style.overflow = '';
});

const getInitials = computed(() => {
  const first = user.value.firstName || user.value.first_name || '';
  const last = user.value.lastName || user.value.last_name || '';
  return `${first?.[0] || ''}${last?.[0] || ''}`.toUpperCase();
});

const signOutUser = async () => {
    try {
        console.log("User initiated logout...");

        // Simple demo logout
        await authService.logout();
        user.value = null;

        // Redirect to login
        router.push('/');

    } catch (error) {
        console.error("Sign out error:", error);

        // Fallback: manually clear everything and redirect
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        user.value = null;

        // Force navigation to login
        router.push('/');
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
</script>

<style scoped>
.nav-container {
    display: flex;
}

/* Mobile overlay backdrop */
.nav-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 999;
    opacity: 0;
    animation: fadeIn 0.3s ease forwards;
}

@keyframes fadeIn {
    to {
        opacity: 1;
    }
}

/* Mobile toggle button */
.toggle-button {
    position: fixed;
    top: 15px;
    left: 15px;
    z-index: 1001;
    background-color: #3498DB;
    color: white;
    border: none;
    border-radius: 8px;
    width: 45px;
    height: 45px;
    font-size: 18px;
    cursor: pointer;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    transition: all 0.3s ease;
}

.toggle-button:hover {
    background-color: #2980B9;
    transform: scale(1.05);
}

.toggle-button:active {
    transform: scale(0.95);
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
    overflow-y: auto;
    overflow-x: hidden;
    z-index: 1000;

    /* Updated scrollbar styling */
    scrollbar-width: thin;
    scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
}

/* Mobile styles */
@media (max-width: 768px) {
    .navBar {
        width: 280px; /* Fixed width for mobile instead of percentage */
        box-shadow: 2px 0 10px rgba(0, 0, 0, 0.3);
    }
}

/* Tablet styles */
@media (min-width: 769px) and (max-width: 1150px) {
    .navBar {
        width: 25%; /* Slightly wider for tablets */
    }
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

.close-button {
    position: absolute;
    top: 15px;
    right: 15px;
    background-color: rgba(255, 255, 255, 0.2);
    color: white;
    border: none;
    border-radius: 50%;
    width: 35px;
    height: 35px;
    font-size: 16px;
    cursor: pointer;
    transition: all 0.3s ease;
}

.close-button:hover {
    background-color: rgba(255, 255, 255, 0.3);
    transform: scale(1.1);
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

@media (max-width: 768px) {
    .profile {
        margin: 70px 0 20px 0; /* Add top margin to account for close button */
        padding: 15px;
    }
}

.profile-info {
    display: flex;
    flex-direction: column;
    min-width: 0; /* Prevent overflow */
}

.profile .displayName {
    color: white;
    font-weight: bold;
    margin: 0;
    font-size: 14px;
    word-wrap: break-word;
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
  flex-shrink: 0; /* Prevent shrinking */
}

@media (max-width: 768px) {
    .avatar {
        width: 40px;
        height: 40px;
    }
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

@media (max-width: 768px) {
    .avatar.initials {
        font-size: 14px;
    }
}


/* NAV OPTIONS */
.navOptions {
    display: flex;
    margin-top: 20px;
    flex-direction: column;
    width: 100%;
    padding-bottom: 20px; /* Add bottom padding for mobile */
}

.nav-section {
    width: 100%;
    margin: 10px 0;
    padding: 0 15px;
}

@media (max-width: 768px) {
    .nav-section {
        padding: 0 10px;
    }
}

.nav-section h3 {
    color: #ECF0F1;
    font-size: 0.8em;
    text-transform: uppercase;
    margin: 20px 0 10px 0;
    padding-left: 10px;
}

@media (max-width: 768px) {
    .nav-section h3 {
        font-size: 0.75em;
        margin: 15px 0 8px 0;
        padding-left: 5px;
    }
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

@media (max-width: 768px) {
    i {
        margin-right: 8px;
        width: 18px;
    }
}
</style>
