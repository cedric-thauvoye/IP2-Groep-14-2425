<template>
    <NavBar />
    <main>
        <h1>Students Management</h1>
        <div class="actions">
            <button class="add-button">
                <i class="fas fa-plus"></i> Add Student
            </button>
            <button class="import-button">
                <i class="fas fa-file-import"></i> Import Students
            </button>
            <button class="export-button" @click="exportStudents">
                <i class="fas fa-file-export"></i> Export Students
            </button>
        </div>
        <table class="students-table">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Groups</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="student in students" :key="student.id">
                    <td>{{ student.name }}</td>
                    <td>{{ student.email }}</td>
                    <td>{{ student.groups.join(', ') }}</td>
                    <td>
                        <button class="edit-button">Edit</button>
                        <button class="delete-button">Delete</button>
                    </td>
                </tr>
            </tbody>
        </table>
    </main>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../main';
import NavBar from '../components/Nav/NavBar.vue';

const students = ref([]);

onMounted(() => {
    const q = query(collection(db, 'Users'), where('role', '==', 'student'));
    onSnapshot(q, (querySnapshot) => {
        students.value = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    });
});

const exportStudents = () => {
    // Convert students data to CSV format
    const headers = ['Name', 'Email', 'Groups'];
    const csvContent = [
        headers.join(','),
        ...students.value.map(student => [
            student.name,
            student.email,
            student.groups.join(';')
        ].join(','))
    ].join('\n');

    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'students.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
</script>

<style scoped>
main {
    padding: 20px;
    margin-left: 20%;
}

.actions {
    margin-bottom: 20px;
    display: flex;
    gap: 10px;
}

.add-button, .import-button {
    background-color: #3498DB;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 5px;
    cursor: pointer;
}

.import-button {
    background-color: #2C3E50;
}

.students-table {
    width: 100%;
    border-collapse: collapse;
    background: white;
    border-radius: 10px;
    overflow: hidden;
}

.students-table th,
.students-table td {
    padding: 12px;
    text-align: left;
    border-bottom: 1px solid #eee;
}

.students-table th {
    background-color: #f5f5f5;
}

.edit-button, .delete-button {
    padding: 5px 10px;
    border: none;
    border-radius: 3px;
    cursor: pointer;
    margin-right: 5px;
}

.edit-button {
    background-color: #f39c12;
    color: white;
}

.delete-button {
    background-color: #e74c3c;
    color: white;
}

.export-button {
    background-color: #27ae60;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 5px;
    cursor: pointer;
}

.export-button:hover {
    background-color: #219a52;
}
</style>
