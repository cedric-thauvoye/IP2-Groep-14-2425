<template>
    <NavBar />
    <main>
        <div v-if="user">
            <p>Welcome, {{ user.displayName }}!</p>
            <p><button @click="signOutUser">Sign Out</button></p>
            <div v-if="courses.length">
                <h2>Your Courses</h2>
                <ul>
                    <li v-for="course in courses" :key="course.id">
                        <router-link :to="'/course/' + course.id">{{ course.name }}</router-link>
                    </li>
                </ul>
            </div>
            <div v-else>
                <p>You are not enrolled in any courses.</p>
            </div>
        </div>
        <div v-else>
            <p>Please sign in to access the home page.</p>
        </div>
    </main>
</template>

<script setup>
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import NavBar from '../components/Nav/NavBar.vue';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../main';

const auth = getAuth();
const user = ref(null);
const courses = ref([]);
const router = useRouter();

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
        if (loggedInUser) {
            const qCourses = query(collection(db, 'Courses'), where('students', 'array-contains', loggedInUser.uid));
            onSnapshot(qCourses, (querySnapshotCourses) => {
                courses.value = querySnapshotCourses.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                console.log(courses.value);
            });
        }
    });
});
</script>
