<template>
    <PageLayout>
        <div class="results-container">
            <div v-if="loading" class="loading-state">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading results...</p>
            </div>

            <div v-else-if="error" class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error</h3>
                <p>{{ error }}</p>
                <button class="back-button" @click="goBack">Go Back</button>
            </div>

            <div v-else class="results-content">
                <!-- Results Header -->
                <div class="results-header">
                    <div class="header-info">
                        <h1>{{ assessment.title }} Results</h1>
                        <div class="meta-info">
                            <div class="meta-item">
                                <i class="fas fa-book"></i>
                                <span>{{ assessment.courseName }}</span>
                            </div>
                            <div class="meta-item">
                                <i class="fas fa-users"></i>
                                <span>{{ assessment.groupName }}</span>
                            </div>
                        </div>
                    </div>
                    <div class="header-actions">
                        <button class="back-button" @click="goBack">
                            <i class="fas fa-arrow-left"></i> Back
                        </button>
                    </div>
                </div>

                <!-- Overall Score -->
                <div class="overall-score">
                    <h2>Overall Results</h2>

                    <!-- For students: show their own results -->
                    <div v-if="isStudent" class="student-result">
                        <div class="score-card">
                            <div class="score-value">{{ assessment.results.overallAverage }}</div>
                            <div class="score-label">Overall Score</div>
                        </div>

                        <div class="criteria-results">
                            <h3>Criteria Ratings</h3>
                            <div class="criteria-table">
                                <div class="criteria-header">
                                    <span class="criteria-name">Criterion</span>
                                    <span class="criteria-score">Average Score</span>
                                    <span class="criteria-count">Ratings</span>
                                </div>

                                <div
                                    v-for="criterion in assessment.results.criteria"
                                    :key="criterion.criteria_id"
                                    class="criteria-row"
                                >
                                    <span class="criteria-name">{{ criterion.criteria_name }}</span>
                                    <span class="criteria-score">{{ criterion.average_score }}</span>
                                    <span class="criteria-count">{{ criterion.number_of_ratings }}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- For teachers: show all student results -->
                    <div v-else class="teacher-results">
                        <div class="results-filter">
                            <label for="student-filter">Filter by Student:</label>
                            <select
                                id="student-filter"
                                v-model="selectedStudentId"
                                @change="updateSelectedStudent"
                            >
                                <option value="">All Students</option>
                                <option
                                    v-for="student in studentsList"
                                    :key="student.id"
                                    :value="student.id"
                                >
                                    {{ student.firstName }} {{ student.lastName }} ({{ student.qNumber }})
                                </option>
                            </select>
                        </div>

                        <!-- Show all students in a table -->
                        <div v-if="!selectedStudentId" class="students-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Student</th>
                                        <th>ID</th>
                                        <th>Overall Score</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="student in assessment.results" :key="student.student.id">
                                        <td>{{ student.student.firstName }} {{ student.student.lastName }}</td>
                                        <td>{{ student.student.qNumber }}</td>
                                        <td class="score-cell">{{ student.overallAverage }}</td>
                                        <td>
                                            <button
                                                class="view-details-button"
                                                @click="selectStudent(student.student.id)"
                                            >
                                                View Details
                                            </button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <!-- Show individual student details -->
                        <div v-else-if="selectedStudent" class="selected-student-results">
                            <div class="student-header">
                                <h3>{{ selectedStudent.student.firstName }} {{ selectedStudent.student.lastName }}</h3>
                                <span class="student-id">{{ selectedStudent.student.qNumber }}</span>
                            </div>

                            <div class="score-summary">
                                <div class="score-card large">
                                    <div class="score-value">{{ selectedStudent.overallAverage }}</div>
                                    <div class="score-label">Overall Score</div>
                                </div>
                            </div>

                            <div class="criteria-results">
                                <h3>Criteria Breakdown</h3>
                                <div class="criteria-table">
                                    <div class="criteria-header">
                                        <span class="criteria-name">Criterion</span>
                                        <span class="criteria-score">Average Score</span>
                                        <span class="criteria-count">Ratings</span>
                                    </div>

                                    <div
                                        v-for="criterion in selectedStudent.criteriaScores"
                                        :key="criterion.criteria_id"
                                        class="criteria-row"
                                    >
                                        <span class="criteria-name">{{ criterion.criteria_name }}</span>
                                        <span class="criteria-score">{{ criterion.average_score }}</span>
                                        <span class="criteria-count">{{ criterion.number_of_ratings }}</span>
                                    </div>
                                </div>
                            </div>

                            <button class="back-to-all-button" @click="selectedStudentId = ''">
                                Back to All Students
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </PageLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import PageLayout from '../components/Layout/PageLayout.vue';
import { assessmentService, authService } from '../services/api';

const router = useRouter();
const route = useRoute();
const assessmentId = route.params.id;

const assessment = ref({
    title: '',
    courseName: '',
    groupName: '',
    results: null
});
const loading = ref(true);
const error = ref(null);
const isStudent = ref(false);
const selectedStudentId = ref('');
const selectedStudent = ref(null);

// Navigate back to the assessments list
const goBack = () => {
    router.push('/assessments');
};

// Fetch assessment results
const fetchResults = async () => {
    try {
        loading.value = true;

        // Check user role
        const { data: roleData } = await authService.checkUserRole();
        isStudent.value = roleData.role === 'student';

        // Get assessment results
        const { data } = await assessmentService.getAssessmentResults(assessmentId);
        assessment.value = data;

    } catch (err) {
        console.error('Error fetching results:', err);
        error.value = 'Failed to load assessment results. Please try again later.';
    } finally {
        loading.value = false;
    }
};

// For teachers: get list of students from results
const studentsList = computed(() => {
    if (isStudent.value || !assessment.value.results) return [];

    return assessment.value.results.map(result => {
        return {
            id: result.student.id,
            firstName: result.student.firstName,
            lastName: result.student.lastName,
            qNumber: result.student.qNumber
        };
    });
});

// Select a specific student to show their details
const selectStudent = (studentId) => {
    selectedStudentId.value = studentId;
    updateSelectedStudent();
};

// Update the selected student object when ID changes
const updateSelectedStudent = () => {
    if (!selectedStudentId.value) {
        selectedStudent.value = null;
        return;
    }

    selectedStudent.value = assessment.value.results.find(
        result => result.student.id === selectedStudentId.value
    );
};

// Load results when component mounts
onMounted(() => {
    fetchResults();
});
</script>

<style scoped>
.results-container {
    max-width: 1000px;
    margin: 0 auto;
    padding-bottom: 3rem;
}

.loading-state, .error-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem;
    text-align: center;
}

.loading-state i, .error-state i {
    font-size: 3rem;
    margin-bottom: 1rem;
    color: #3498db;
}

.error-state i {
    color: #e74c3c;
}

.results-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #e1e1e1;
}

.meta-info {
    display: flex;
    gap: 1.5rem;
    margin-top: 0.75rem;
}

.meta-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #7f8c8d;
    font-size: 0.95rem;
}

.meta-item i {
    color: #3498db;
}

.back-button {
    background-color: #95a5a6;
    color: white;
    border: none;
    padding: 0.6rem 1.2rem;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.overall-score {
    margin-top: 2rem;
}

.score-card {
    background-color: #f9f9f9;
    border-radius: 8px;
    padding: 2rem;
    width: 150px;
    text-align: center;
    margin-bottom: 2rem;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.score-card.large {
    padding: 3rem;
    width: 200px;
}

.score-value {
    font-size: 2.5rem;
    font-weight: bold;
    color: #3498db;
    margin-bottom: 0.5rem;
}

.score-label {
    font-size: 1rem;
    color: #7f8c8d;
}

.criteria-results {
    margin-top: 2rem;
}

.criteria-results h3 {
    margin-bottom: 1rem;
    color: #2c3e50;
}

.criteria-table {
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    overflow: hidden;
}

.criteria-header {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr;
    background-color: #f1f2f6;
    padding: 1rem;
    font-weight: bold;
    color: #2c3e50;
}

.criteria-row {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr;
    padding: 1rem;
    border-top: 1px solid #e1e1e1;
}

.criteria-score {
    text-align: center;
    color: #3498db;
    font-weight: bold;
}

.criteria-count {
    text-align: center;
    color: #7f8c8d;
}

/* Teacher specific styles */
.results-filter {
    margin-bottom: 2rem;
}

.results-filter label {
    display: block;
    margin-bottom: 0.5rem;
    color: #2c3e50;
    font-weight: 600;
}

.results-filter select {
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 1rem;
    min-width: 300px;
}

table {
    width: 100%;
    border-collapse: collapse;
    background-color: white;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

thead th {
    background-color: #f1f2f6;
    padding: 1rem;
    text-align: left;
    color: #2c3e50;
    font-weight: 600;
}

tbody td {
    padding: 1rem;
    border-top: 1px solid #e1e1e1;
    color: #2c3e50;
}

.score-cell {
    font-weight: bold;
    color: #3498db;
}

.view-details-button {
    background-color: #3498db;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
}

.student-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
}

.student-header h3 {
    margin: 0;
    color: #2c3e50;
}

.student-id {
    background-color: #f1f2f6;
    padding: 0.3rem 0.75rem;
    border-radius: 4px;
    font-size: 0.9rem;
    color: #7f8c8d;
}

.score-summary {
    display: flex;
    justify-content: center;
    margin: 2rem 0;
}

.back-to-all-button {
    background-color: #95a5a6;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 6px;
    cursor: pointer;
    margin-top: 2rem;
    display: block;
}

@media (max-width: 768px) {
    .results-header {
        flex-direction: column;
        gap: 1rem;
    }

    .header-actions {
        width: 100%;
    }

    .back-button {
        width: 100%;
        justify-content: center;
    }

    .meta-info {
        flex-direction: column;
        gap: 0.75rem;
    }

    .criteria-header, .criteria-row {
        grid-template-columns: 1fr 1fr 1fr;
    }

    table {
        display: block;
        overflow-x: auto;
    }

    .results-filter select {
        width: 100%;
    }
}
</style>
