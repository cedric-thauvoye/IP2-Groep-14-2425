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
                        <button v-if="!isStudent" class="feedback-overview-button" @click="showAllFeedback">
                            <i class="fas fa-comments"></i> View All Feedback
                        </button>
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
                        <div class="score-card" :class="assessment.results.overallScoreColor ? `score-${assessment.results.overallScoreColor}` : ''">
                            <div class="score-value">{{ assessment.results.overallAverageDisplay || assessment.results.overallAverage }}</div>
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
                                    <span class="criteria-score" :class="criterion.score_color ? `score-${criterion.score_color}` : ''">{{ criterion.score_display || criterion.average_score }}</span>
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
                                        <td class="score-cell" :class="student.overallScoreColor ? `score-${student.overallScoreColor}` : ''">{{ student.overallAverageDisplay || student.overallAverage }}</td>
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
                                <div class="score-card large" :class="selectedStudent.overallScoreColor ? `score-${selectedStudent.overallScoreColor}` : ''">
                                    <div class="score-value">{{ selectedStudent.overallAverageDisplay || selectedStudent.overallAverage }}</div>
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
                                        <span class="criteria-score" :class="criterion.score_color ? `score-${criterion.score_color}` : ''">{{ criterion.score_display || criterion.average_score }}</span>
                                        <span class="criteria-count">{{ criterion.number_of_ratings }}</span>
                                    </div>
                                </div>
                            </div>

                            <!-- Feedback Sections -->
                            <div class="feedback-sections">
                                <!-- Feedback Received by this student -->
                                <div v-if="selectedStudent.feedbackReceived && selectedStudent.feedbackReceived.length > 0" class="feedback-section">
                                    <h3>Feedback Received</h3>
                                    <div class="feedback-list">
                                        <div
                                            v-for="(feedback, index) in selectedStudent.feedbackReceived"
                                            :key="index"
                                            class="feedback-item"
                                        >
                                            <div class="feedback-header">
                                                <span class="feedback-author">From: {{ feedback.first_name }} {{ feedback.last_name }}</span>
                                                <span class="feedback-date">{{ formatDate(feedback.submitted_at) }}</span>
                                            </div>
                                            <div class="feedback-content">{{ feedback.feedback }}</div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Feedback Given by this student -->
                                <div v-if="selectedStudent.feedbackGiven && selectedStudent.feedbackGiven.feedback" class="feedback-section">
                                    <h3>Feedback Given</h3>
                                    <div class="feedback-item">
                                        <div class="feedback-header">
                                            <span class="feedback-author">
                                                About: {{ selectedStudent.feedbackGiven.evaluated_students || 'Team members' }}
                                            </span>
                                            <span class="feedback-date">{{ formatDate(selectedStudent.feedbackGiven.submitted_at) }}</span>
                                        </div>
                                        <div class="feedback-content">{{ selectedStudent.feedbackGiven.feedback }}</div>
                                    </div>
                                </div>

                                <!-- No feedback message -->
                                <div v-if="(!selectedStudent.feedbackReceived || selectedStudent.feedbackReceived.length === 0) &&
                                         (!selectedStudent.feedbackGiven || !selectedStudent.feedbackGiven.feedback)"
                                     class="no-feedback">
                                    <i class="fas fa-comment-slash"></i>
                                    <p>No feedback available for this student yet.</p>
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

        <!-- Feedback Overview Modal -->
        <div v-if="showFeedbackModal" class="modal-overlay" @click="closeFeedbackModal">
            <div class="modal-content" @click.stop>
                <div class="modal-header">
                    <h2>All Feedback - {{ assessment.title }}</h2>
                    <button class="close-button" @click="closeFeedbackModal">
                        <i class="fas fa-times"></i>
                    </button>
                </div>

                <div class="modal-body">
                    <div v-if="loadingFeedback" class="loading-state">
                        <i class="fas fa-spinner fa-spin"></i>
                        <p>Loading feedback...</p>
                    </div>

                    <div v-else-if="allFeedback.length === 0" class="no-feedback">
                        <i class="fas fa-comment-slash"></i>
                        <p>No feedback has been submitted yet.</p>
                    </div>

                    <div v-else class="feedback-overview">
                        <div
                            v-for="(feedbackItem, index) in allFeedback"
                            :key="index"
                            class="feedback-item-overview"
                        >
                            <div class="feedback-header">
                                <div class="student-info">
                                    <strong>{{ feedbackItem.student.firstName }} {{ feedbackItem.student.lastName }}</strong>
                                    <span class="student-id">({{ feedbackItem.student.qNumber }})</span>
                                </div>
                                <div class="feedback-meta">
                                    <span class="feedback-date">{{ formatDate(feedbackItem.submittedAt) }}</span>
                                    <span v-if="feedbackItem.evaluatedStudents" class="evaluated-students">
                                        About: {{ feedbackItem.evaluatedStudents }}
                                    </span>
                                </div>
                            </div>
                            <div class="feedback-content">{{ feedbackItem.feedback }}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </PageLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import PageLayout from '../components/Layout/PageLayout.vue';
import { assessmentService, authService } from '../services/mockApi';
import { useBackNavigation } from '../composables/useBackNavigation';

const route = useRoute();
const { goBack } = useBackNavigation('/assessments');
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
const showFeedbackModal = ref(false);
const loadingFeedback = ref(false);
const allFeedback = ref([]);

// Format date for display
const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
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

        // Check if there's a student filter from query parameters after results are loaded
        checkAndSelectStudentFromQuery();

        // Check and handle group filtering from query parameters
        checkAndHandleGroupFiltering();

    } catch (err) {
        console.error('Error fetching results:', err);
        error.value = 'Failed to load assessment results. Please try again later.';
    } finally {
        loading.value = false;
    }
};

// Check and select student from query parameters
const checkAndSelectStudentFromQuery = () => {
    const studentIdFromQuery = route.query.studentId;
    if (studentIdFromQuery && !isStudent.value && assessment.value.results) {
        const studentId = parseInt(studentIdFromQuery);
        // Check if the student exists in the results
        const studentExists = assessment.value.results.some(result => result.student.id === studentId);
        if (studentExists) {
            selectStudent(studentId);
        }
    }
};

// Check and handle group filtering from query parameters
const checkAndHandleGroupFiltering = () => {
    const groupIdFromQuery = route.query.groupId;
    const groupNameFromQuery = route.query.groupName;

    if (groupIdFromQuery || groupNameFromQuery) {
        console.log('Group filter applied:', { groupId: groupIdFromQuery, groupName: groupNameFromQuery });

        // You could implement group-specific filtering here if needed
        // For example, filter students by group membership
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

// Show all feedback modal
const showAllFeedback = async () => {
    showFeedbackModal.value = true;
    loadingFeedback.value = true;

    try {
        const { data } = await assessmentService.getAssessmentFeedback(assessmentId);
        allFeedback.value = data.feedback;
    } catch (err) {
        console.error('Error fetching feedback:', err);
        allFeedback.value = [];
    } finally {
        loadingFeedback.value = false;
    }
};

// Close feedback modal
const closeFeedbackModal = () => {
    showFeedbackModal.value = false;
    allFeedback.value = [];
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

.header-actions {
    display: flex;
    gap: 1rem;
}

.feedback-overview-button {
    background-color: #3498db;
    color: white;
    border: none;
    padding: 0.6rem 1.2rem;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 500;
    transition: all 0.2s ease;
}

.feedback-overview-button:hover {
    background-color: #2980b9;
    transform: translateY(-1px);
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

/* Feedback Sections Styling */
.feedback-sections {
    margin-top: 2rem;
}

.feedback-section {
    margin-bottom: 2rem;
    background-color: #f8f9fa;
    border-radius: 8px;
    padding: 1.5rem;
    border-left: 4px solid #3498db;
}

.feedback-section h3 {
    margin: 0 0 1rem 0;
    color: #2c3e50;
    font-size: 1.1rem;
}

.feedback-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.feedback-item {
    background-color: white;
    border-radius: 6px;
    padding: 1rem;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.feedback-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid #e9ecef;
}

.feedback-author {
    font-weight: 600;
    color: #2c3e50;
    font-size: 0.9rem;
}

.feedback-date {
    color: #7f8c8d;
    font-size: 0.85rem;
}

.feedback-content {
    color: #2c3e50;
    line-height: 1.5;
    font-size: 0.95rem;
}

.no-feedback {
    text-align: center;
    padding: 2rem;
    color: #7f8c8d;
    background-color: #f8f9fa;
    border-radius: 8px;
    border: 2px dashed #ddd;
}

.no-feedback i {
    font-size: 2rem;
    margin-bottom: 0.5rem;
    display: block;
}

.no-feedback p {
    margin: 0;
    font-style: italic;
}

/* Modal Styling */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.modal-content {
    background-color: white;
    border-radius: 8px;
    width: 90%;
    max-width: 800px;
    max-height: 80vh;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid #e1e1e1;
    background-color: #f8f9fa;
}

.modal-header h2 {
    margin: 0;
    color: #2c3e50;
    font-size: 1.3rem;
}

.close-button {
    background: none;
    border: none;
    font-size: 1.5rem;
    color: #7f8c8d;
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 4px;
    transition: all 0.2s ease;
}

.close-button:hover {
    color: #e74c3c;
    background-color: rgba(231, 76, 60, 0.1);
}

.modal-body {
    padding: 1.5rem;
    max-height: 60vh;
    overflow-y: auto;
}

.feedback-overview {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.feedback-item-overview {
    background-color: #f8f9fa;
    border-radius: 8px;
    padding: 1.5rem;
    border-left: 4px solid #3498db;
}

.feedback-item-overview .feedback-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1rem;
    flex-wrap: wrap;
    gap: 0.5rem;
}

.student-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.student-info .student-id {
    color: #7f8c8d;
    font-size: 0.9rem;
}

.feedback-meta {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.25rem;
}

.feedback-meta .feedback-date {
    color: #7f8c8d;
    font-size: 0.85rem;
}

.feedback-meta .evaluated-students {
    color: #3498db;
    font-size: 0.85rem;
    font-style: italic;
}

.feedback-item-overview .feedback-content {
    background-color: white;
    padding: 1rem;
    border-radius: 6px;
    border: 1px solid #e9ecef;
    line-height: 1.5;
    color: #2c3e50;
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

/* Score color classes */
.score-excellent {
    color: #27ae60 !important;
    font-weight: bold;
}

.score-good {
    color: #2ecc71 !important;
    font-weight: bold;
}

.score-average {
    color: #f39c12 !important;
    font-weight: bold;
}

.score-below-average {
    color: #e67e22 !important;
    font-weight: bold;
}

.score-poor {
    color: #e74c3c !important;
    font-weight: bold;
}

.score-neutral {
    color: #7f8c8d !important;
}

/* Apply colors to score cards as well */
.score-card.score-excellent .score-value {
    color: #27ae60;
}

.score-card.score-good .score-value {
    color: #2ecc71;
}

.score-card.score-average .score-value {
    color: #f39c12;
}

.score-card.score-below-average .score-value {
    color: #e67e22;
}

.score-card.score-poor .score-value {
    color: #e74c3c;
}

.score-card.score-neutral .score-value {
    color: #7f8c8d;
}
</style>
