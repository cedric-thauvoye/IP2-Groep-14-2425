<template>
    <PageLayout>
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
        <div v-if="loading" class="loading-state">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Loading students...</p>
        </div>
        <table class="students-table" v-else>
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Q-Number</th>
                    <th>Groups</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="student in students" :key="student.id">
                    <td>{{ student.first_name }} {{ student.last_name }}</td>
                    <td>{{ student.email }}</td>
                    <td>{{ student.q_number }}</td>
                    <td>{{ student.groups ? student.groups.join(', ') : 'None' }}</td>
                    <td>
                        <button class="edit-button" @click="editStudent(student.id)">Edit</button>
                        <button class="delete-button" @click="deleteStudent(student.id)">Delete</button>
                    </td>
                </tr>
            </tbody>
        </table>
    </PageLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import PageLayout from '../components/Layout/PageLayout.vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const students = ref([]);
const loading = ref(true);

const fetchStudents = async () => {
    loading.value = true;
    try {
        // This endpoint doesn't exist yet in our API, so we'll mock it
        // In a real implementation, you would create a students service in the API
        // const response = await axios.get('/api/students');
        // students.value = response.data;

        // Mock data
        students.value = [
            {
                id: 1,
                first_name: 'Alice',
                last_name: 'Johnson',
                email: 'alice@example.com',
                q_number: 'q1703022',
                groups: ['Web Development Team 1', 'Project Management Group A']
            },
            {
                id: 2,
                first_name: 'Bob',
                last_name: 'Smith',
                email: 'bob@example.com',
                q_number: 'q1703023',
                groups: ['Web Development Team 2']
            },
            {
                id: 3,
                first_name: 'Charlie',
                last_name: 'Davis',
                email: 'charlie@example.com',
                q_number: 'q1703024',
                groups: ['Database Design Group C']
            }
        ];
    } catch (error) {
        console.error('Error fetching students:', error);
    } finally {
        loading.value = false;
    }
};

const editStudent = (id) => {
    // Navigate to student edit view or show a modal
    console.log('Edit student:', id);
};

const deleteStudent = async (id) => {
    if (confirm('Are you sure you want to delete this student?')) {
        try {
            // This endpoint doesn't exist yet in our API
            // In a real implementation, you would make a delete request
            // await axios.delete(`/api/students/${id}`);
            students.value = students.value.filter(student => student.id !== id);
        } catch (error) {
            console.error('Error deleting student:', error);
        }
    }
};

const exportStudents = () => {
    // Convert students data to CSV format
    const headers = ['Name', 'Email', 'Q-Number', 'Groups'];
    const csvContent = [
        headers.join(','),
        ...students.value.map(student => [
            `${student.first_name} ${student.last_name}`,
            student.email,
            student.q_number,
            student.groups ? student.groups.join(';') : ''
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

onMounted(() => {
    fetchStudents();
});
</script>

<style scoped>
main {
    padding: 20px;
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

.loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 50px;
    gap: 20px;
}

.loading-state i {
    font-size: 2rem;
    color: #3498DB;
}
</style>
