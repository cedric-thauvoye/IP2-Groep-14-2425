<template>
  <div class="debug-panel">
    <h3>Debug Panel</h3>
    <button @click="checkRole">Check Role</button>
    <div class="role-info" v-if="roleInfo">
      <p><strong>Role:</strong> {{ roleInfo.role }}</p>
      <p><strong>Is Admin:</strong> {{ roleInfo.role === 'admin' }}</p>
      <p><strong>Token:</strong> {{ hasToken ? 'Present' : 'Missing' }}</p>
    </div>
    <button v-if="roleInfo && roleInfo.role !== 'admin'" @click="makeAdmin">
      Make Admin (Debug)
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { authService } from '../../services/api';
import notificationStore from '../../stores/notificationStore';

const roleInfo = ref(null);
const hasToken = ref(false);

const checkRole = async () => {
  hasToken.value = !!localStorage.getItem('auth_token');
  try {
    const response = await authService.checkUserRole();
    roleInfo.value = response.data;
    console.log('Current role:', response.data);
  } catch (error) {
    console.error('Error checking role:', error);
  }
};

// Debug function to set user as admin in localStorage
// Note: This is ONLY for debugging - in a real app, role changes would be done through backend
const makeAdmin = () => {
  try {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    // Decode token (simple decode, not verification)
    const parts = token.split('.');
    if (parts.length !== 3) return;

    const payload = JSON.parse(atob(parts[1]));
    console.log('Current token payload:', payload);

    // Modify payload to make user admin (note: this doesn't change server-side roles)
    payload.role = 'admin';

    // In a real app, you'd need to get a new token from the server
    // This is just a client-side trick for debugging
    notificationStore.warning('For debugging: User role changed to admin in local token. This is a client-side change only.');
    console.log('Modified payload:', payload);

    // Force a page reload to apply the change
    window.location.reload();
  } catch (error) {
    console.error('Error modifying token:', error);
  }
};

// Run check on mount
checkRole();
</script>

<style scoped>
.debug-panel {
  margin-top: 20px;
  padding: 15px;
  border: 2px dashed #f00;
  background: #fff8f8;
  border-radius: 8px;
}

.role-info {
  margin-top: 10px;
  padding: 10px;
  background: #f8f8f8;
  border-radius: 6px;
}

button {
  background: #3498db;
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 10px;
}
</style>
