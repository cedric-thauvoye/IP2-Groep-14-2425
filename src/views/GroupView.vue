<template>
    <div v-if="group">
        <h1>{{ group.name }}</h1>
        <p><strong>ID:</strong> {{ group.id }}</p>
        <h2>Students</h2>
        <ul>
            <li v-for="student in students" :key="student.uid">{{ student.displayName }} ({{ student.email }})</li>
        </ul>
        <h2>Teachers</h2>
        <ul>
            <li v-for="teacher in teachers" :key="teacher.uid">{{ teacher.displayName }} ({{ teacher.email }})</li>
        </ul>
    </div>
    <div v-else>
        <p>Loading group information...</p>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../main'
import { getAuth } from 'firebase/auth'

const route = useRoute()
const group = ref(null)
const students = ref([])
const teachers = ref([])

const fetchUserDetails = async (uid) => {
    const auth = getAuth()
    try {
        const user = await auth.getUser(uid)
        return { uid, displayName: user.displayName, email: user.email }
    } catch (error) {
        console.error("Error fetching user details:", error)
        return null
    }
}

onMounted(async () => {
    const groupId = route.params.groupId
    const groupDoc = await getDoc(doc(db, 'Groups', groupId))
    console.log(groupDoc);

    if (groupDoc.exists()) {
        group.value = { id: groupId, ...groupDoc.data() }
        const studentPromises = group.value.students.map(uid => fetchUserDetails(uid))
        const teacherPromises = group.value.teachers.map(uid => fetchUserDetails(uid))
        students.value = await Promise.all(studentPromises)
        teachers.value = await Promise.all(teacherPromises)
    } else {
        console.error("No such group document!")
    }
})
</script>
