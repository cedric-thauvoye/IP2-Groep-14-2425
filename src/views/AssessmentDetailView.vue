<template>
    <PageLayout>
        <div class="assessment-detail-container">
            <div v-if="loading" class="loading-state">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading assessment...</p>
            </div>

            <div v-else-if="error" class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error</h3>
                <p>{{ error }}</p>
                <button class="back-button" @click="goBack">Go Back</button>
            </div>

            <div v-else class="assessment-content">
                <!-- Assessment Header -->
                <div class="assessment-header">
                    <div class="header-info">
                        <h1>{{ assessment.title }}</h1>
                        <div class="meta-info">
                            <div class="meta-item">
                                <i class="fas fa-book"></i>
                                <span>{{ assessment.courseName }}</span>
                            </div>
                            <div class="meta-item">
                                <i class="fas fa-users"></i>
                                <span>{{ assessment.groupName }}</span>
                            </div>
                            <div class="meta-item">
                                <i class="fas fa-calendar"></i>
                                <span>Due: {{ formatDate(assessment.dueDate) }}</span>
                            </div>
                        </div>
                    </div>
                    <div class="header-actions">
                        <button class="back-button" @click="goBack">
                            <i class="fas fa-arrow-left"></i> Back
                        </button>
                    </div>
                </div>

                <!-- Assessment Description -->
                <div class="assessment-description">
                    <h3>Description</h3>
                    <p>{{ assessment.description }}</p>
                </div>

                <!-- Evaluation Form -->
                <form @submit.prevent="submitAssessment" class="evaluation-form">
                    <div class="evaluation-instructions">
                        <h2>Peer Evaluation</h2>
                        <p>Rate each team member based on the criteria below. Your responses will be anonymous to other students.</p>
                    </div>

                    <div v-if="assessment.submitted" class="submitted-notice">
                        <i class="fas fa-check-circle"></i>
                        <p>You have already submitted this assessment. You can still edit and resubmit if needed.</p>
                    </div>

                    <!-- Students to Evaluate -->
                    <div class="students-container">
                        <div v-for="student in assessment.studentsToEvaluate" :key="student.id" class="student-evaluation-card">
                            <div class="student-header">
                                <h3>{{ student.first_name }} {{ student.last_name }}</h3>
                                <span class="student-id">{{ student.q_number }}</span>
                            </div>

                            <div v-for="criterion in assessment.criteria" :key="criterion.id" class="criterion-evaluation">
                                <div class="criterion-info">
                                    <h4>{{ criterion.name }}</h4>
                                    <p>{{ criterion.description }}</p>
                                </div>

                                <div class="rating-scale">
                                    <div class="scale-labels">
                                        <span>{{ criterion.minScore }} - Poor</span>
                                        <span>{{ criterion.maxScore }} - Excellent</span>
                                    </div>

                                    <div class="rating-buttons">
                                        <div
                                            v-for="n in calculateRange(criterion.minScore, criterion.maxScore)"
                                            :key="n"
                                            class="rating-option"
                                        >
                                            <input
                                                type="radio"
                                                :id="`criterion-${criterion.id}-student-${student.id}-score-${criterion.minScore + n - 1}`"
                                                :name="`criterion-${criterion.id}-student-${student.id}`"
                                                :value="criterion.minScore + n - 1"
                                                v-model="scores[`${criterion.id}-${student.id}`]"
                                            />
                                            <label
                                                :for="`criterion-${criterion.id}-student-${student.id}-score-${criterion.minScore + n - 1}`"
                                                :class="{ selected: scores[`${criterion.id}-${student.id}`] === criterion.minScore + n - 1 }"
                                            >
                                                {{ criterion.minScore + n - 1 }}
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Overall Feedback -->
                    <div class="feedback-section">
                        <h3>Overall Feedback</h3>
                        <p>Share any additional comments about your team's performance (optional)</p>
                        <textarea
                            v-model="feedback"
                            placeholder="Enter your feedback here..."
                            rows="4"
                        ></textarea>
                    </div>

                    <!-- Submit Button -->
                    <div class="submission-actions">
                        <button type="button" class="cancel-button" @click="goBack">Cancel</button>
                        <button
                            type="submit"
                            class="submit-button"
                            :disabled="!isFormValid || submitting"
                        >
                            <i v-if="submitting" class="fas fa-spinner fa-spin"></i>
                            <span v-else>{{ assessment.submitted ? 'Update Response' : 'Submit Assessment' }}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </PageLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import PageLayout from '../components/Layout/PageLayout.vue';
import { assessmentService } from '../services/mockApi';
import { useBackNavigation } from '../composables/useBackNavigation';

const router = useRouter();
const route = useRoute();
const { goBack } = useBackNavigation('/assessments');
const assessmentId = route.params.id;

const assessment = ref({
    title: '',
    courseName: '',
    groupName: '',
    description: '',
    dueDate: '',
    criteria: [],
    studentsToEvaluate: [],
    submitted: false,
    givenScores: []
});
const loading = ref(true);
const error = ref(null);
const submitting = ref(false);
const feedback = ref('');
const scores = ref({});

// Helper function for date formatting
const formatDate = (date) => {
    if (!date) return 'N/A';

    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return 'Invalid Date';

    return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

// Helper function to calculate range
const calculateRange = (min, max) => {
    // Ensure both values are numbers
    min = parseFloat(min);
    max = parseFloat(max);

    // Check if values are valid
    if (isNaN(min) || isNaN(max)) {
        console.error('Invalid min or max score:', min, max);
        return 0; // Return 0 to avoid errors
    }

    const range = Math.floor(max - min + 1);
    return range > 0 ? range : 0;
};

// Check if all required ratings have been provided
const isFormValid = computed(() => {
    if (!assessment.value || !assessment.value.criteria || !assessment.value.studentsToEvaluate) {
        return false;
    }

    let allCriteriaRated = true;

    for (const criterion of assessment.value.criteria) {
        for (const student of assessment.value.studentsToEvaluate) {
            const key = `${criterion.id}-${student.id}`;
            if (scores.value[key] === undefined || scores.value[key] === null) {
                allCriteriaRated = false;
                break;
            }
        }

        if (!allCriteriaRated) break;
    }

    return allCriteriaRated;
});

// Fetch the assessment details
const fetchAssessment = async () => {
    try {
        loading.value = true;
        const { data } = await assessmentService.getAssessmentById(assessmentId);
        assessment.value = data;

        // If there are already given scores, pre-populate the form
        if (data.givenScores && data.givenScores.length > 0) {
            for (const score of data.givenScores) {
                scores.value[`${score.criteria_id}-${score.student_id}`] = score.given_score;
            }
        }

        // Set feedback if available
        if (data.feedback) {
            feedback.value = data.feedback;
        }
    } catch (err) {
        console.error('Error fetching assessment:', err);
        error.value = 'Failed to load assessment. Please try again later.';
    } finally {
        loading.value = false;
    }
};

// Submit the assessment
const submitAssessment = async () => {
    if (!isFormValid.value) {
        return;
    }

    try {
        submitting.value = true;

        // Format scores for API
        const formattedScores = [];
        for (const criterion of assessment.value.criteria) {
            for (const student of assessment.value.studentsToEvaluate) {
                const key = `${criterion.id}-${student.id}`;
                formattedScores.push({
                    criteriaId: criterion.id,
                    studentId: student.id,
                    score: scores.value[key]
                });
            }
        }

        // Submit to API
        await assessmentService.submitAssessment(assessmentId, {
            feedback: feedback.value,
            scores: formattedScores
        });

        // Navigate to results or back to assessments list
        router.push('/assessments');
    } catch (err) {
        console.error('Error submitting assessment:', err);
        error.value = 'Failed to submit assessment. Please try again.';
    } finally {
        submitting.value = false;
    }
};

// Load the assessment when component mounts
onMounted(() => {
    fetchAssessment();
});
</script>

<style scoped>
.assessment-detail-container {
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

.assessment-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #e1e1e1;
}

.meta-info {
    display: flex;
    flex-wrap: wrap;
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

.assessment-description {
    background-color: #f9f9f9;
    padding: 1.5rem;
    border-radius: 8px;
    margin-bottom: 2rem;
}

.assessment-description h3 {
    margin-top: 0;
    margin-bottom: 0.75rem;
    color: #2c3e50;
}

.evaluation-instructions {
    margin-bottom: 2rem;
}

.submitted-notice {
    background-color: #d4edda;
    color: #155724;
    padding: 1rem;
    border-radius: 8px;
    margin-bottom: 2rem;
    display: flex;
    align-items: center;
    gap: 1rem;
}

.submitted-notice i {
    font-size: 1.5rem;
}

.students-container {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    margin-bottom: 2rem;
}

.student-evaluation-card {
    background-color: white;
    border-radius: 10px;
    padding: 1.5rem;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}

.student-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid #e1e1e1;
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

.criterion-evaluation {
    margin-bottom: 2rem;
}

.student-criterion-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.8rem;
    background-color: #f1f8fe;
    padding: 0.5rem 0.8rem;
    border-radius: 6px;
    border-left: 3px solid #3498db;
}

.student-criterion-label .evaluating-text {
    color: #7f8c8d;
    font-size: 0.9rem;
}

.student-criterion-label .student-name {
    color: #2c3e50;
    font-weight: bold;
}

.criterion-info h4 {
    margin-top: 0;
    margin-bottom: 0.5rem;
    color: #2c3e50;
}

.criterion-info p {
    color: #7f8c8d;
    margin-top: 0;
    margin-bottom: 1rem;
    font-size: 0.95rem;
}

.rating-scale {
    margin-top: 1rem;
}

.scale-labels {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.75rem;
    color: #7f8c8d;
    font-size: 0.9rem;
}

.rating-buttons {
    display: flex;
    justify-content: space-between;
    gap: 0.5rem;
}

.rating-option {
    flex: 1;
}

.rating-option input {
    display: none;
}

.rating-option label {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 2.5rem;
    background-color: #f1f2f6;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    color: #7f8c8d;
    font-weight: bold;
}

.rating-option label:hover {
    background-color: #e1e4e8;
}

.rating-option label.selected {
    background-color: #3498db;
    color: white;
}

.feedback-section {
    margin-top: 3rem;
    margin-bottom: 2rem;
}

.feedback-section h3 {
    margin-top: 0;
    margin-bottom: 0.75rem;
}

.feedback-section p {
    color: #7f8c8d;
    margin-top: 0;
    margin-bottom: 1rem;
}

.feedback-section textarea {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 1rem;
    resize: vertical;
}

.submission-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 2rem;
}

.cancel-button {
    background-color: #95a5a6;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 6px;
    cursor: pointer;
}

.submit-button {
    background-color: #3498db;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.submit-button:disabled {
    background-color: #bdc3c7;
    cursor: not-allowed;
}

@media (max-width: 768px) {
    .assessment-header {
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

    .rating-buttons {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 0.25rem;
    }

    .submission-actions {
        flex-direction: column;
    }

    .cancel-button, .submit-button {
        width: 100%;
        justify-content: center;
    }
}
</style>
