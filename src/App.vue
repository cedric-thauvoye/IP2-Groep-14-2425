<template>
	<router-view></router-view>
</template>

<script setup>
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { ref, onMounted } from 'vue';

const auth = getAuth();
const user = ref(null);

const signOutUser = () => {
	signOut(auth).then(() => {
		user.value = null;
	}).catch((error) => {
		console.error("Sign out error:", error);
	});
};

onMounted(() => {
	onAuthStateChanged(auth, (loggedInUser) => {
		user.value = loggedInUser;
	});
});
</script>