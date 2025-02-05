<template>
    <div v-if="group">
        <h1>{{ group.name }}</h1>
        <p><strong>ID:</strong> {{ group.id }}</p>
        <h2>Students</h2>
        <ul>
            <li v-for="student in students" :key="student.uid">{{ student.displayName }} ({{ student.email }})</li>
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
import { fetchUserDetailsBatch } from '../api/userApi'

const route = useRoute()
const group = ref(null)
const students = ref([])

onMounted(async () => {
    const groupId = route.params.groupId
    const groupDoc = await getDoc(doc(db, 'Groups', groupId))
    console.log(groupDoc)

    if (groupDoc.exists()) {
        group.value = { id: groupId, ...groupDoc.data() }
        const studentUids = group.value.students
        students.value = await fetchUserDetailsBatch(studentUids)
    } else {
        console.error("No such group document!")
    }
})
</script>
