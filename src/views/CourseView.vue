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
        <h2>Groups</h2>
        <ul>
            <li v-for="group in groups" :key="group.id">
                <router-link :to="'/course/' + course.id + '/groups/' + group.id">{{ group.name }}</router-link>
            </li>
        </ul>
    </div>
    <div v-else>
        <p>Loading course information...</p>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { doc, getDoc, collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '../main'
import { fetchUserDetailsBatch } from '../api/userApi'
import { getAuth, onAuthStateChanged } from 'firebase/auth'

const route = useRoute()
const course = ref(null)
const students = ref([])
const teachers = ref([])
const groups = ref([])

onMounted(() => {
    const auth = getAuth()

    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            console.error('No authenticated user found')
            return
        }

        const courseId = route.params.courseId

        try {
            const courseRef = doc(db, 'Courses', courseId)
            const courseDoc = await getDoc(courseRef)
            if (courseDoc.exists()) {
                course.value = { id: courseId, ...courseDoc.data() }
                const studentUids = course.value.students
                const teacherUids = course.value.teachers
                students.value = await fetchUserDetailsBatch(studentUids)
                teachers.value = await fetchUserDetailsBatch(teacherUids)

                const qGroups = query(collection(db, 'Groups'), where('course_id', '==', courseRef))

                onSnapshot(qGroups, (querySnapshotGroups) => {
                    groups.value = querySnapshotGroups.docs.map(doc => ({ id: doc.id, ...doc.data() }))
                    console.log('Groups:', groups.value)
                }, (error) => {
                    console.error('Error fetching groups:', error)
                })
            } else {
                console.error("No such course document!")
            }
        } catch (error) {
            console.error('Error fetching course document:', error)
        }
    })
})
</script>
