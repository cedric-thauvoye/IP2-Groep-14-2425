<template>
    <PageLayout>
        <div class="students-container">
            <div class="header">
                <h1>Students</h1>
                <div class="actions" v-if="isAdmin">
                    <router-link to="/import" class="action-button"> <i class="fas fa-file-import"></i> Import Students </router-link>
                    <button class="action-button export-button" @click="exportStudents">
                        <i class="fas fa-file-export"></i> Export XLSX
                    </button>
                    <button class="action-button" @click="showAddStudentModal = true"><i class="fas fa-user-plus"></i> Add Student</button>
                </div>
            </div>

            <div class="filters-section">
                <div class="filters-row">
                    <div class="search-box">
                        <i class="fas fa-search"></i>
                        <input type="text" v-model="searchQuery" placeholder="Search students..." @input="filterStudents" />
                    </div>

                    <div class="filter-group">
                        <select v-model="filters.courseFilter" @change="filterStudents" class="filter-select">
                            <option value="all">All Courses</option>
                            <option value="enrolled">Has Enrollments</option>
                            <option value="unenrolled">No Enrollments</option>
                            <option v-for="course in availableCourses" :key="course.id" :value="course.id">
                                {{ course.name }}
                            </option>
                        </select>

                        <select v-model="filters.qNumberFilter" @change="filterStudents" class="filter-select">
                            <option value="all">All Q-Numbers</option>
                            <option value="valid">Valid Format</option>
                            <option value="missing">Missing Q-Number</option>
                        </select>

                        <select v-model="sortBy" @change="sortStudents" class="filter-select">
                            <option value="name-asc">Name (A-Z)</option>
                            <option value="name-desc">Name (Z-A)</option>
                            <option value="email-asc">Email (A-Z)</option>
                            <option value="email-desc">Email (Z-A)</option>
                            <option value="qnumber-asc">Q-Number (A-Z)</option>
                            <option value="qnumber-desc">Q-Number (Z-A)</option>
                        </select>
                    </div>

                    <button v-if="hasActiveFilters" @click="clearFilters" class="clear-filters">
                        <i class="fas fa-times"></i> Clear Filters
                    </button>
                </div>

                <div class="results-info" v-if="students.length > 0">
                    Showing {{ filteredStudents.length }} of {{ students.length }} students
                    <span v-if="hasActiveFilters" class="filter-indicator">
                        (filtered)
                    </span>
                </div>
            </div>

            <div v-if="loading" class="loading-state">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading students...</p>
            </div>

            <div v-else>
                <table class="students-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Q-Number</th>
                            <th>Enrollments</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="student in filteredStudents" :key="student.id">
                            <td>{{ student.first_name }} {{ student.last_name }}</td>
                            <td>{{ student.email }}</td>
                            <td>
                                <span :class="{ 'invalid-qnumber': !isValidQNumber(student.q_number) }">
                                    {{ student.q_number || 'Not set' }}
                                </span>
                            </td>
                            <td>
                                <div class="enrollment-info">
                                    <span class="enrollment-count">{{ getEnrollmentCount(student.id) }} courses</span>
                                    <div v-if="getStudentCourses(student.id).length > 0" class="course-list">
                                        <span v-for="course in getStudentCourses(student.id).slice(0, 2)" :key="course.id" class="course-chip">
                                            {{ course.name }}
                                        </span>
                                        <span v-if="getStudentCourses(student.id).length > 2" class="more-courses">
                                            +{{ getStudentCourses(student.id).length - 2 }} more
                                        </span>
                                    </div>
                                </div>
                            </td>
                            <td>
                                <div class="action-buttons">
                                    <router-link :to="`/user/${student.id}`" class="view-button">
                                        <i class="fas fa-eye"></i>
                                    </router-link>
                                    <button v-if="isAdmin" class="edit-button" @click="editStudent(student.id)">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>

                <div v-if="filteredStudents.length === 0" class="empty-state">
                    <i class="fas fa-user-graduate"></i>
                    <h3>No Students Found</h3>
                    <p>Try adjusting your search filters or import students.</p>
                </div>
            </div>

            <!-- Edit Student Modal -->
            <div v-if="showEditStudentModal && editingStudent" class="modal-overlay">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>Edit Student</h2>
                        <button class="close-button" @click="showEditStudentModal = false">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <form @submit.prevent="saveEditedStudent">
                            <div class="form-group">
                                <label for="first-name">First Name</label>
                                <input type="text" id="first-name" v-model="editingStudent.first_name" required />
                            </div>
                            <div class="form-group">
                                <label for="last-name">Last Name</label>
                                <input type="text" id="last-name" v-model="editingStudent.last_name" required />
                            </div>
                            <div class="form-group">
                                <label for="email">Email</label>
                                <input type="email" id="email" v-model="editingStudent.email" required />
                            </div>
                            <div class="form-group">
                                <label for="q-number">Q-Number</label>
                                <input type="text" id="q-number" v-model="editingStudent.q_number" required />
                            </div>
                            <div class="form-actions">
                                <button type="button" class="cancel-button" @click="showEditStudentModal = false">Cancel</button>
                                <button type="submit" class="save-button">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
                <!-- Add User Modal -->
                <div v-if="showAddStudentModal" class="modal-overlay">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h2>Add New User</h2>
                            <button class="close-button" @click="showAddStudentModal = false">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="modal-body">
                            <StudentDetailView @close="showAddStudentModal = false" @created="fetchStudents" />
                        </div>
                    </div>
                </div>
            </div>

            <!-- Add Student Modal -->
            <div v-if="showAddStudentModal" class="modal-overlay">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>Add Student</h2>
                        <button class="close-button" @click="showAddStudentModal = false">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <form @submit.prevent="addStudent">
                            <div class="form-group">
                                <label for="new-first-name">First Name</label>
                                <input type="text" id="new-first-name" v-model="newStudent.first_name" required />
                            </div>
                            <div class="form-group">
                                <label for="new-last-name">Last Name</label>
                                <input type="text" id="new-last-name" v-model="newStudent.last_name" required />
                            </div>
                            <div class="form-group">
                                <label for="new-email">Email</label>
                                <input type="email" id="new-email" v-model="newStudent.email" required />
                            </div>
                            <div class="form-group">
                                <label for="new-q-number">Q-Number</label>
                                <input type="text" id="new-q-number" v-model="newStudent.q_number" required />
                            </div>
                            <div class="form-group">
                                <label for="new-password">Password</label>
                                <input type="password" id="new-password" v-model="newStudent.password" required />
                            </div>
                            <div class="form-actions">
                                <button type="button" class="cancel-button" @click="showAddStudentModal = false">Cancel</button>
                                <button type="submit" class="save-button" :disabled="isAddingStudent">
                                    <i v-if="isAddingStudent" class="fas fa-spinner fa-spin"></i>
                                    <span v-else>Add Student</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </PageLayout>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import PageLayout from '../components/Layout/PageLayout.vue';
import { userService, authService, courseService } from '../services/api';
import notificationStore from '../stores/notificationStore';
import StudentDetailView from '@/views/StudentDetailView.vue';
import * as XLSX from 'xlsx';

const router = useRouter();
const students = ref([]);
const loading = ref(true);
const isAdmin = ref(false);
const searchQuery = ref('');
const filteredStudents = ref([]);
const showAddStudentModal = ref(false);
const showEditStudentModal = ref(false);
const editingStudent = ref(null);
const newStudent = ref({
    first_name: '',
    last_name: '',
    email: '',
    q_number: '',
    password: '',
    role: 'student'
});
const isAddingStudent = ref(false);

// New filtering and export variables
const availableCourses = ref([]);
const studentCourses = ref({}); // Map of student ID to courses
const sortBy = ref('name-asc');
const filters = ref({
    courseFilter: 'all',
    qNumberFilter: 'all'
});

// Computed property to check if filters are active
const hasActiveFilters = computed(() => {
    return searchQuery.value !== '' ||
           filters.value.courseFilter !== 'all' ||
           filters.value.qNumberFilter !== 'all' ||
           sortBy.value !== 'name-asc';
});

// Get all students and their course enrollments
const fetchStudents = async () => {
    try {
        const response = await userService.getStudents();
        students.value = response.data;

        // Fetch course enrollments for each student
        await fetchStudentCourses();

        filteredStudents.value = [...students.value];
        sortStudents();
    } catch (error) {
        console.error('Error fetching students:', error);
    } finally {
        loading.value = false;
    }
};

// Fetch available courses for filtering
const fetchCourses = async () => {
    try {
        const response = await courseService.getCourses();
        availableCourses.value = response.data;
    } catch (error) {
        console.error('Error fetching courses:', error);
    }
};

// Fetch course enrollments for students
const fetchStudentCourses = async () => {
    try {
        // Use the existing user detail endpoint which includes courses
        for (const student of students.value) {
            try {
                const response = await userService.getUserById(student.id);
                studentCourses.value[student.id] = response.data.courses || [];
            } catch (error) {
                console.warn(`Could not fetch courses for student ${student.id}:`, error);
                studentCourses.value[student.id] = [];
            }
        }
    } catch (error) {
        console.error('Error fetching student courses:', error);
        // Set empty arrays for all students
        students.value.forEach(student => {
            studentCourses.value[student.id] = [];
        });
    }
};

// Utility functions
const isValidQNumber = (qNumber) => {
    if (!qNumber) return false;
    // Assume Q-number format is Q followed by digits (e.g., Q123456)
    return /^Q\d{6}$/.test(qNumber);
};

const getEnrollmentCount = (studentId) => {
    return studentCourses.value[studentId]?.length || 0;
};

const getStudentCourses = (studentId) => {
    return studentCourses.value[studentId] || [];
};

// Enhanced filtering function
const filterStudents = () => {
    let filtered = [...students.value];

    // Search filter
    if (searchQuery.value) {
        const searchTerm = searchQuery.value.toLowerCase();
        filtered = filtered.filter((student) => {
            return (
                student.first_name.toLowerCase().includes(searchTerm) ||
                student.last_name.toLowerCase().includes(searchTerm) ||
                student.email.toLowerCase().includes(searchTerm) ||
                (student.q_number && student.q_number.toLowerCase().includes(searchTerm))
            );
        });
    }

    // Course filter
    if (filters.value.courseFilter !== 'all') {
        if (filters.value.courseFilter === 'enrolled') {
            filtered = filtered.filter(student => getEnrollmentCount(student.id) > 0);
        } else if (filters.value.courseFilter === 'unenrolled') {
            filtered = filtered.filter(student => getEnrollmentCount(student.id) === 0);
        } else {
            // Filter by specific course
            filtered = filtered.filter(student =>
                getStudentCourses(student.id).some(course => course.id == filters.value.courseFilter)
            );
        }
    }

    // Q-Number filter
    if (filters.value.qNumberFilter !== 'all') {
        if (filters.value.qNumberFilter === 'valid') {
            filtered = filtered.filter(student => isValidQNumber(student.q_number));
        } else if (filters.value.qNumberFilter === 'missing') {
            filtered = filtered.filter(student => !student.q_number || student.q_number.trim() === '');
        }
    }

    filteredStudents.value = filtered;
    sortStudents();
};

// Sorting function
const sortStudents = () => {
    const sorted = [...filteredStudents.value];

    const [field, direction] = sortBy.value.split('-');
    const isAscending = direction === 'asc';

    switch (field) {
        case 'name':
            sorted.sort((a, b) => {
                const nameA = `${a.first_name} ${a.last_name}`.toLowerCase();
                const nameB = `${b.first_name} ${b.last_name}`.toLowerCase();
                const result = nameA.localeCompare(nameB);
                return isAscending ? result : -result;
            });
            break;
        case 'email':
            sorted.sort((a, b) => {
                const result = a.email.localeCompare(b.email);
                return isAscending ? result : -result;
            });
            break;
        case 'qnumber':
            sorted.sort((a, b) => {
                const result = (a.q_number || '').localeCompare(b.q_number || '');
                return isAscending ? result : -result;
            });
            break;
    }

    filteredStudents.value = sorted;
};

// Clear all filters
const clearFilters = () => {
    searchQuery.value = '';
    filters.value.courseFilter = 'all';
    filters.value.qNumberFilter = 'all';
    sortBy.value = 'name-asc';
    filterStudents();
};

// Export functionality
const exportStudents = () => {
    try {
        // Prepare data for XLSX export
        const exportData = filteredStudents.value.map(student => {
            const courses = getStudentCourses(student.id);
            const courseNames = courses.map(c => c.name).join('; ');

            return {
                'Full Name': `${student.first_name} ${student.last_name}`,
                'First Name': student.first_name,
                'Last Name': student.last_name,
                'Email': student.email,
                'Q-Number': student.q_number || '',
                'Course Enrollments': courseNames,
                'Total Courses': courses.length,
                'Q-Number Valid': isValidQNumber(student.q_number) ? 'Yes' : 'No'
            };
        });

        // Create workbook and worksheet
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(exportData);

        // Auto-size columns
        const columnWidths = [
            { wch: 20 }, // Full Name
            { wch: 15 }, // First Name
            { wch: 15 }, // Last Name
            { wch: 30 }, // Email
            { wch: 12 }, // Q-Number
            { wch: 40 }, // Course Enrollments
            { wch: 12 }, // Total Courses
            { wch: 15 }  // Q-Number Valid
        ];
        worksheet['!cols'] = columnWidths;

        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');

        // Generate filename with current date
        const currentDate = new Date().toISOString().split('T')[0];
        const filename = `students_export_${currentDate}.xlsx`;

        // Write and download file
        XLSX.writeFile(workbook, filename);

        notificationStore.success(`Exported ${filteredStudents.value.length} students to ${filename}`);
    } catch (error) {
        console.error('Error exporting students:', error);
        notificationStore.error('Failed to export students. Please try again.');
    }
};

// Check if user is an admin
const checkUserRole = async () => {
    try {
        const response = await authService.checkUserRole();
        isAdmin.value = response.data.role === 'admin';
    } catch (error) {
        console.error('Error checking user role:', error);
    }
};

// Edit student function
const editStudent = (id) => {
    const student = students.value.find((s) => s.id === id);
    if (student) {
        editingStudent.value = { ...student };
        showEditStudentModal.value = true;
    }
};

// Save edited student
const saveEditedStudent = async () => {
    try {
        await userService.updateUser(editingStudent.value.id, editingStudent.value);

        const index = students.value.findIndex((s) => s.id === editingStudent.value.id);
        if (index !== -1) {
            students.value[index] = { ...editingStudent.value };
            filterStudents();
        }

        showEditStudentModal.value = false;
        editingStudent.value = null;
        notificationStore.success('Student information updated successfully.');
    } catch (error) {
        console.error('Error updating student:', error);
        notificationStore.error('Failed to update student. Please try again.');
    }
};

// Add a new student
const addStudent = async () => {
    isAddingStudent.value = true;
    try {
        await userService.createUser(newStudent.value);

        // Reset form and close modal
        newStudent.value = {
            first_name: '',
            last_name: '',
            email: '',
            q_number: '',
            password: '',
            role: 'student'
        };
        showAddStudentModal.value = false;

        // Refresh students list
        await fetchStudents();
        notificationStore.success('Student added successfully.');
    } catch (error) {
        console.error('Error adding student:', error);
        notificationStore.error('Failed to add student. Please try again.');
    } finally {
        isAddingStudent.value = false;
    }
};

onMounted(async () => {
    await checkUserRole();
    await fetchCourses();
    await fetchStudents();
});
</script>

<style scoped>
.students-container {
    max-width: 1400px;
    margin: 0 auto;
}

.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
}

.actions {
    display: flex;
    gap: 1rem;
}

.action-button {
    background-color: #3498db;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    text-decoration: none;
    font-size: 1rem;
    transition: background-color 0.2s;
}

.action-button:hover {
    background-color: #2980b9;
}

.export-button {
    background-color: #27ae60;
}

.export-button:hover {
    background-color: #229954;
}

/* Filters Section Styles */
.filters-section {
    background: white;
    border-radius: 10px;
    padding: 1.5rem;
    margin-bottom: 2rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.filters-row {
    display: flex;
    gap: 1rem;
    align-items: center;
    flex-wrap: wrap;
}

.filter-group {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
}

.filter-select {
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 6px;
    background: white;
    font-size: 0.9rem;
    min-width: 140px;
}

.clear-filters {
    background: #e74c3c;
    color: white;
    border: none;
    padding: 0.75rem 1rem;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
    transition: background-color 0.2s;
}

.clear-filters:hover {
    background: #c0392b;
}

.results-info {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #eee;
    color: #7f8c8d;
    font-size: 0.9rem;
}

.filter-indicator {
    color: #e74c3c;
    font-weight: 500;
}

/* Table enhancements */
.invalid-qnumber {
    color: #e74c3c;
    font-style: italic;
}

.enrollment-info {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.enrollment-count {
    font-weight: 500;
    color: #2c3e50;
}

.course-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
}

.course-chip {
    background: #ebf5fb;
    color: #3498db;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.8rem;
    border: 1px solid #d5e8f7;
}

.more-courses {
    color: #7f8c8d;
    font-size: 0.8rem;
    font-style: italic;
}

.filters {
    display: flex;
    margin-bottom: 2rem;
}

.search-box {
    flex: 1;
    position: relative;
    display: flex;
    align-items: center;
}

.search-box i {
    position: absolute;
    left: 1rem;
    top: 50%;
    transform: translateY(-50%);
    color: #7f8c8d;
}

.search-box input {
    width: 100%;
    padding: 0.75rem 1rem 0.75rem 2.5rem;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 1rem;
    height: 46px;
    box-sizing: border-box;
}

.students-table {
    width: 100%;
    border-collapse: collapse;
    background: white;
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.students-table th,
.students-table td {
    padding: 1rem;
    text-align: left;
}

.students-table th {
    background: #f9f9f9;
    font-weight: 600;
    color: #2c3e50;
}

.students-table tr:not(:last-child) td {
    border-bottom: 1px solid #eee;
}

.action-buttons {
    display: flex;
    gap: 0.5rem;
}

.view-button,
.edit-button {
    background: none;
    border: none;
    cursor: pointer;
    color: #7f8c8d;
    padding: 0.5rem;
    border-radius: 4px;
    transition: all 0.2s;
}

.view-button:hover {
    color: #3498db;
    background: #ebf5fb;
}

.edit-button:hover {
    color: #f39c12;
    background: #fef9e7;
}

.loading-state,
.empty-state {
    text-align: center;
    padding: 3rem;
    color: #7f8c8d;
}

.loading-state i,
.empty-state i {
    font-size: 3rem;
    margin-bottom: 1rem;
}

/* Modal styles */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.modal-content {
    background: white;
    border-radius: 10px;
    width: 500px;
    max-width: 90%;
    max-height: 90vh;
    overflow-y: auto;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid #eee;
}

.modal-header h2 {
    margin: 0;
    font-size: 1.2rem;
}

.close-button {
    background: none;
    border: none;
    font-size: 1.2rem;
    cursor: pointer;
}

.modal-body {
    padding: 1.5rem;
}

.form-group {
    margin-bottom: 1rem;
}

.form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
}

.form-group input,
.form-group textarea,
.form-group select {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 6px;
    box-sizing: border-box;
    max-width: 100%;
}

.form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 1.5rem;
}

.cancel-button {
    background: #f8f9fa;
    border: 1px solid #ddd;
    padding: 0.75rem 1.5rem;
    border-radius: 6px;
    cursor: pointer;
}

.save-button {
    background: #3498db;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 6px;
    cursor: pointer;
}

@media (max-width: 992px) {
    .students-table {
        display: block;
        overflow-x: auto;
    }
}

@media (max-width: 768px) {
    .header {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
    }

    .actions {
        width: 100%;
        justify-content: flex-start;
        flex-wrap: wrap;
    }

    .filters-row {
        flex-direction: column;
        align-items: stretch;
        gap: 1rem;
    }

    .filter-group {
        flex-direction: column;
        gap: 0.5rem;
    }

    .filter-select {
        min-width: unset;
        width: 100%;
    }

    .search-box {
        width: 100%;
    }

    .clear-filters {
        align-self: flex-start;
    }

    .students-table th:nth-child(4),
    .students-table td:nth-child(4) {
        display: none;
    }

    .course-list {
        flex-direction: column;
        gap: 0.25rem;
    }
}
</style>
