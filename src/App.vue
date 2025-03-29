<template>
	<router-view></router-view>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { authService } from './services/api';

const user = ref(null);

onMounted(async () => {
	// Check if there's a saved token
	const token = localStorage.getItem('auth_token');
	if (token) {
		try {
			const response = await authService.getCurrentUser();
			user.value = response.data.user;
		} catch (error) {
			console.error('Failed to retrieve user:', error);
			// Clear invalid token
			localStorage.removeItem('auth_token');
		}
	}
});
</script>
