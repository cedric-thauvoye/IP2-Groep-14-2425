<template>
    <div v-if="course">
        <h1>{{ course.name }}</h1>
        <p><strong>ID:</strong> {{ course.id }}</p>
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
        <p>Loading course information...</p>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../main'
import { getAuth } from 'firebase/auth'

const route = useRoute()
const course = ref(null)
const students = ref([])
const teachers = ref([])

const fetchUserDetails = async (uid) => {
    const auth = getAuth()
    try {
        const user = await getUser(auth, uid)
        return { uid, displayName: user.displayName, email: user.email }
    } catch (error) {
        console.error("Error fetching user details:", error)
        return null
    }
}

onMounted(async () => {
    const courseId = route.params.courseId
    const courseDoc = await getDoc(doc(db, 'Courses', courseId))
    if (courseDoc.exists()) {
        course.value = { id: courseId, ...courseDoc.data() }
        const studentPromises = course.value.students.map(uid => fetchUserDetails(uid))
        const teacherPromises = course.value.teachers.map(uid => fetchUserDetails(uid))
        students.value = await Promise.all(studentPromises)
        teachers.value = await Promise.all(teacherPromises)
    } else {
        console.error("No such course document!")
    }
})
</script>
