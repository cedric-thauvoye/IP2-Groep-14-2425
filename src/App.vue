<template>
	<router-view></router-view>
</template>

<script setup>
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { ref, onMounted } from 'vue';

const auth = getAuth();
const user = ref(null);

onMounted(() => {
	onAuthStateChanged(auth, (loggedInUser) => {
		user.value = loggedInUser;
	});
});
</script>
