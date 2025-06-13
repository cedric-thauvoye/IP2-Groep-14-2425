<template>
    <PageLayout>
        <div class="assessments-container">
            <div class="header">
                <h1>{{ isTeacher ? 'Assessments' : 'My Assessments' }}</h1>
                <div class="actions" v-if="isTeacher || isAdmin">
                    <button class="action-button" @click="openCreateModal">
                        <i class="fas fa-plus"></i> Create Assessment
                    </button>
                </div>
            </div>

            <div class="assessment-tabs">
                <button
                    :class="['tab-button', { active: activeTab === 'pending' }]"
                    @click="activeTab = 'pending'"
                >
                    <i class="fas fa-clock"></i> Pending
                    <span class="badge">{{ pendingAssessments.length }}</span>
                </button>
                <button
                    :class="['tab-button', { active: activeTab === 'completed' }]"
                    @click="activeTab = 'completed'"
                >
                    <i class="fas fa-check-circle"></i> Completed
                    <span class="badge">{{ completedAssessments.length }}</span>
                </button>
            </div>

            <div v-if="loading" class="loading-state">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading assessments...</p>
            </div>

            <!-- Teacher View -->
            <div v-else-if="isTeacher" class="teacher-assessments">
                <div v-for="(courseData, courseName) in organizedAssessments"
                     :key="courseName"
                     class="course-section"
                >
                    <div class="course-header">
                        <h2>{{ courseName }}</h2>
                        <div class="course-stats">
                            <span class="group-count">
                                {{ Object.keys(courseData.groups).length }} Groups
                            </span>
                        </div>
                    </div>

                    <div class="groups-container">
                        <div v-for="(assessments, groupName) in courseData.groups"
                             :key="groupName"
                             class="group-section"
                        >
                            <div class="group-header">
                                <h3>{{ groupName }}</h3>
                            </div>

                            <div class="group-assessments">
                                <div v-for="assessment in assessments"
                                     :key="assessment.id"
                                     :class="['teacher-assessment-card', { 'completed': activeTab === 'completed' || assessment.completedDate }]"
                                >
                                    <!-- Card status indicator -->
                                    <div class="card-status-bar" :class="getCardStatusClass(assessment)"></div>

                                    <!-- Card header with title and status -->
                                    <div class="card-header">
                                        <div class="title-section">
                                            <h4 class="assessment-title">{{ assessment.title }}</h4>
                                            <div class="assessment-meta">
                                                <span class="group-badge">
                                                    <i class="fas fa-users"></i>
                                                    {{ assessment.groupName }}
                                                </span>
                                            </div>
                                        </div>

                                        <div class="status-section">
                                            <!-- Due date or completion info -->
                                            <div v-if="activeTab === 'pending' && !assessment.completedDate" class="date-info pending">
                                                <i class="fas fa-clock"></i>
                                                <div class="date-details">
                                                    <span class="date-label">Due</span>
                                                    <span class="date-value">{{ formatDate(assessment.dueDate) }}</span>
                                                </div>
                                            </div>

                                            <div v-else class="date-info completed">
                                                <i class="fas fa-check-circle"></i>
                                                <div class="date-details">
                                                    <span class="date-label">Completed</span>
                                                    <span class="date-value">{{ formatDate(assessment.completedDate) }}</span>
                                                </div>
                                            </div>

                                            <!-- Completion status badge -->
                                            <div v-if="getCompletionStatus(assessment)"
                                                 :class="['status-badge', getCompletionStatus(assessment).class]">
                                                <i class="fas fa-info-circle"></i>
                                                {{ getCompletionStatus(assessment).text }}
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Card content -->
                                    <div class="card-content">
                                        <p class="assessment-description">{{ assessment.description }}</p>

                                        <!-- Progress and statistics -->
                                        <div class="stats-section">
                                            <div class="response-stats">
                                                <div class="stat-item">
                                                    <div class="stat-icon">
                                                        <i class="fas fa-users"></i>
                                                    </div>
                                                    <div class="stat-details">
                                                        <span class="stat-label">Responses</span>
                                                        <span class="stat-value">{{ assessment.responsesCount }}/{{ assessment.studentsCount }}</span>
                                                    </div>
                                                </div>

                                                <div class="stat-item">
                                                    <div class="stat-icon">
                                                        <i class="fas fa-percentage"></i>
                                                    </div>
                                                    <div class="stat-details">
                                                        <span class="stat-label">Completion</span>
                                                        <span class="stat-value">{{ Math.round((assessment.responsesCount / assessment.studentsCount) * 100) }}%</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <!-- Progress bar -->
                                            <div class="progress-container">
                                                <div class="progress-header">
                                                    <span class="progress-label">Student Participation</span>
                                                    <span class="progress-percentage">{{ Math.round((assessment.responsesCount / assessment.studentsCount) * 100) }}%</span>
                                                </div>
                                                <div class="progress-bar-modern">
                                                    <div class="progress-fill"
                                                         :style="{ width: Math.round((assessment.responsesCount / assessment.studentsCount) * 100) + '%' }"
                                                         :class="getProgressClass(assessment)">
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Card footer with actions -->
                                    <div class="card-footer">
                                        <div class="action-buttons">
                                            <button class="action-btn primary" @click="viewResults(assessment.id)">
                                                <i class="fas fa-chart-line"></i>
                                                <span>View Results</span>
                                            </button>
                                        </div>

                                        <!-- Quick stats -->
                                        <div class="quick-stats">
                                            <div class="quick-stat" v-if="assessment.feedbackCount">
                                                <i class="fas fa-comments"></i>
                                                <span>{{ assessment.feedbackCount }} feedback</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div v-if="Object.keys(organizedAssessments).length === 0" class="empty-state">
                    <i class="fas fa-tasks"></i>
                    <h3>No {{ activeTab === 'pending' ? 'Pending' : 'Completed' }} Assessments</h3>
                    <p>There are no {{ activeTab.toLowerCase() }} assessments in your courses.</p>
                </div>
            </div>

            <!-- Student View -->
            <div v-else-if="activeTab === 'pending' && pendingAssessments.length > 0" class="student-assessments-grid">
                <div v-for="assessment in pendingAssessments"
                     :key="assessment.id"
                     :class="['student-assessment-card', getDueDateClass(assessment.dueDate)]"
                >
                    <div class="assessment-status-badge" v-if="isOverdue(assessment.dueDate)">
                        <i class="fas fa-exclamation-triangle"></i>
                        Overdue
                    </div>
                    <div class="assessment-urgency-indicator" :class="getUrgencyClass(assessment.dueDate)"></div>

                    <div class="student-assessment-header">
                        <h3>{{ assessment.title }}</h3>
                        <div class="due-info">
                            <div :class="['due-date-display', getDueDateClass(assessment.dueDate)]">
                                <i class="fas fa-clock"></i>
                                <span class="due-label">Due:</span>
                                <span class="due-date-time">{{ formatDateTime(assessment.dueDate) }}</span>
                            </div>
                            <div class="time-remaining" v-if="!isOverdue(assessment.dueDate)">
                                {{ getTimeRemaining(assessment.dueDate) }}
                            </div>
                        </div>
                    </div>

                    <div class="course-info">
                        <i class="fas fa-book"></i>
                        <span>{{ assessment.courseName }}</span>
                    </div>

                    <div class="student-assessment-content">
                        <p class="assessment-description">{{ assessment.description }}</p>
                        <div class="progress-section">
                            <div class="progress-bar-container">
                                <div class="progress-bar">
                                    <div class="progress-fill" :style="{ width: assessment.progress + '%' }"></div>
                                </div>
                                <span class="progress-percentage">{{ assessment.progress }}%</span>
                            </div>
                            <p class="progress-label">Progress</p>
                        </div>
                    </div>

                    <div class="student-assessment-footer">
                        <button
                            class="continue-button"
                            @click="startAssessment(assessment.id)"
                            :disabled="isOverdue(assessment.dueDate)"
                        >
                            <i class="fas fa-play"></i>
                            {{ assessment.progress > 0 ? 'Continue Assessment' : 'Start Assessment' }}
                        </button>
                        <div v-if="isOverdue(assessment.dueDate)" class="overdue-notice">
                            <i class="fas fa-times-circle"></i>
                            Too Late to Submit
                        </div>
                    </div>
                </div>
            </div>

            <div v-else-if="activeTab === 'completed' && completedAssessments.length > 0" class="student-assessments-grid">
                <div v-for="assessment in completedAssessments"
                     :key="assessment.id"
                     class="student-assessment-card completed-card"
                >
                    <div class="completion-badge">
                        <i class="fas fa-check-circle"></i>
                        Completed
                    </div>

                    <div class="student-assessment-header">
                        <h3>{{ assessment.title }}</h3>
                        <div class="completion-info">
                            <div class="completion-date-display">
                                <i class="fas fa-calendar-check"></i>
                                <span class="completion-label">Completed:</span>
                                <span class="completion-date-time">{{ formatDateTime(assessment.completedDate) }}</span>
                            </div>
                            <div class="submission-status" :class="getSubmissionStatusClass(assessment)">
                                {{ getSubmissionStatusText(assessment) }}
                            </div>
                        </div>
                    </div>

                    <div class="course-info">
                        <i class="fas fa-book"></i>
                        <span>{{ assessment.courseName }}</span>
                    </div>

                    <div class="student-assessment-content">
                        <p class="assessment-description">{{ assessment.description }}</p>
                        <div class="results-section">
                            <div class="result-item">
                                <div class="result-icon">
                                    <i class="fas fa-star"></i>
                                </div>
                                <div class="result-details">
                                    <span class="result-label">Score</span>
                                    <span class="result-value">{{ assessment.score || 'Pending' }}</span>
                                </div>
                            </div>
                            <div class="result-item">
                                <div class="result-icon">
                                    <i class="fas fa-stopwatch"></i>
                                </div>
                                <div class="result-details">
                                    <span class="result-label">Time Spent</span>
                                    <span class="result-value">{{ assessment.timeSpent || 'N/A' }}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="student-assessment-footer">
                        <button class="results-button" @click="viewResults(assessment.id)">
                            <i class="fas fa-chart-bar"></i>
                            View Detailed Results
                        </button>
                    </div>
                </div>
            </div>

            <div v-else class="empty-state">
                <i class="fas fa-tasks"></i>
                <h3>No {{ activeTab === 'pending' ? 'Pending' : 'Completed' }} Assessments Found</h3>
                <p>{{ activeTab === 'pending' ? 'You currently have no pending assessments to complete.' : 'You have not completed any assessments yet.' }}</p>
            </div>

            <!-- Create Assessment Modal -->
            <div v-if="showCreateModal" class="modal-overlay">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>Create New Assessment</h2>
                        <button class="close-button" @click="showCreateModal = false">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form @submit.prevent="createAssessment">
                            <div class="form-group">
                                <label for="title">Assessment Title *</label>
                                <input
                                    id="title"
                                    v-model="newAssessment.title"
                                    type="text"
                                    required
                                    placeholder="Enter assessment title"
                                />
                            </div>

                            <div class="form-group">
                                <label for="description">Description *</label>
                                <textarea
                                    id="description"
                                    v-model="newAssessment.description"
                                    required
                                    placeholder="Enter assessment description"
                                ></textarea>
                            </div>

                            <div class="form-group">
                                <label for="course">Course *</label>
                                <select
                                    id="course"
                                    v-model="newAssessment.courseId"
                                    required
                                    @change="loadGroups"
                                >
                                    <option value="" disabled>Select a course</option>
                                    <option v-for="course in courses" :key="course.id" :value="course.id">
                                        {{ course.name }}
                                    </option>
                                </select>
                            </div>

                            <div class="form-group">
                                <label>Groups</label>
                                <div class="groups-selection">
                                    <button type="button" class="select-all-button" @click="toggleAllGroups">
                                        {{ newAssessment.groupIds.length === groups.length ? 'Deselect All' : 'Select All Groups' }}
                                    </button>

                                    <div class="groups-grid" v-if="groups.length > 0">
                                        <div v-for="group in groups" :key="group.id" class="group-checkbox">
                                            <input
                                                type="checkbox"
                                                :id="'group-' + group.id"
                                                :value="group.id"
                                                v-model="newAssessment.groupIds"
                                            >
                                            <label :for="'group-' + group.id">{{ group.name }}</label>
                                        </div>
                                    </div>
                                    <div v-else>
                                        <p v-if="newAssessment.courseId" class="no-groups">
                                            No groups available in this course
                                        </p>
                                        <p v-else class="select-course-hint">
                                            Select a course to view available groups
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div class="form-group">
                                <label for="dueDate">Due Date *</label>
                                <input
                                    id="dueDate"
                                    v-model="newAssessment.dueDate"
                                    type="datetime-local"
                                    required
                                />
                            </div>

                            <div class="criteria-section">
                                <h3>Assessment Criteria</h3>
                                <p class="hint">Add at least one criterion to evaluate</p>

                                <div v-for="(criterion, index) in newAssessment.criteria" :key="index" class="criterion-item">
                                    <div class="criterion-header">
                                        <h4>Criterion {{ index + 1 }}</h4>
                                        <button type="button" class="remove-button" @click="removeCriterion(index)">&times;</button>
                                    </div>

                                    <div class="form-group">
                                        <label :for="'criterion-name-' + index">Name *</label>
                                        <input
                                            :id="'criterion-name-' + index"
                                            v-model="criterion.name"
                                            type="text"
                                            required
                                            placeholder="e.g., Teamwork, Communication"
                                        />
                                    </div>

                                    <div class="form-group">
                                        <label :for="'criterion-desc-' + index">Description</label>
                                        <textarea
                                            :id="'criterion-desc-' + index"
                                            v-model="criterion.description"
                                            placeholder="Explain what students should evaluate"
                                        ></textarea>
                                    </div>

                                    <div class="scores-range">
                                        <div class="form-group">
                                            <label :for="'min-score-' + index">Min Score</label>
                                            <input
                                                :id="'min-score-' + index"
                                                v-model.number="criterion.minScore"
                                                type="number"
                                                min="0"
                                                max="9"
                                                required
                                            />
                                        </div>

                                        <div class="form-group">
                                            <label :for="'max-score-' + index">Max Score</label>
                                            <input
                                                :id="'max-score-' + index"
                                                v-model.number="criterion.maxScore"
                                                type="number"
                                                min="1"
                                                max="10"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                <button type="button" class="add-criterion-button" @click="addCriterion">
                                    <i class="fas fa-plus"></i> Add Criterion
                                </button>
                            </div>

                            <div class="form-actions">
                                <button type="button" class="cancel-button" @click="showCreateModal = false">Cancel</button>
                                <button
                                    type="submit"
                                    class="create-button"
                                    :disabled="!isFormValid || isSubmitting"
                                >
                                    <i v-if="isSubmitting" class="fas fa-spinner fa-spin"></i>
                                    <span v-else>Create Assessment</span>
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
import { assessmentService, authService, courseService, groupService } from '../services/api';

const router = useRouter();
const activeTab = ref('pending');
const isTeacher = ref(false);
const isAdmin = ref(false);
const pendingAssessments = ref([]);
const completedAssessments = ref([]);
const loading = ref(true);
const showCreateModal = ref(false);
const courses = ref([]);
const groups = ref([]);
const isSubmitting = ref(false);

const newAssessment = ref({
    title: '',
    description: '',
    courseId: '',
    groupIds: [],  // Changed from groupId to groupIds array
    dueDate: '',
    criteria: [
        {
            name: '',
            description: '',
            minScore: 0,
            maxScore: 10
        }
    ]
});

const isFormValid = computed(() => {
    return newAssessment.value.title &&
           newAssessment.value.description &&
           newAssessment.value.courseId &&
           newAssessment.value.dueDate &&
           newAssessment.value.criteria.length > 0 &&
           newAssessment.value.criteria.every(c =>
                c.name &&
                c.maxScore > c.minScore);
});

const formatDate = (date) => {
    if (!date) return 'N/A';

    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return 'Invalid Date';

    return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

const formatDateTime = (date) => {
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

const isOverdue = (dueDate) => {
    return new Date() > new Date(dueDate);
};

const getDueDateClass = (dueDate) => {
    const now = new Date();
    const due = new Date(dueDate);
    const hoursRemaining = (due - now) / (1000 * 60 * 60);

    if (hoursRemaining < 0) return 'overdue';
    if (hoursRemaining < 24) return 'urgent';
    if (hoursRemaining < 72) return 'warning';
    return 'normal';
};

const getUrgencyClass = (dueDate) => {
    const now = new Date();
    const due = new Date(dueDate);
    const hoursRemaining = (due - now) / (1000 * 60 * 60);

    if (hoursRemaining < 0) return 'overdue-indicator';
    if (hoursRemaining < 24) return 'urgent-indicator';
    if (hoursRemaining < 72) return 'warning-indicator';
    return 'normal-indicator';
};

const getTimeRemaining = (dueDate) => {
    const now = new Date();
    const due = new Date(dueDate);
    const msRemaining = due - now;

    if (msRemaining < 0) return 'Overdue';

    const days = Math.floor(msRemaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((msRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) {
        return `${days} day${days > 1 ? 's' : ''} remaining`;
    } else if (hours > 0) {
        return `${hours} hour${hours > 1 ? 's' : ''} remaining`;
    } else {
        const minutes = Math.floor((msRemaining % (1000 * 60 * 60)) / (1000 * 60));
        return `${minutes} minute${minutes > 1 ? 's' : ''} remaining`;
    }
};

const getSubmissionStatusClass = (assessment) => {
    if (!assessment.dueDate || !assessment.completedDate) return 'on-time';

    const completed = new Date(assessment.completedDate);
    const due = new Date(assessment.dueDate);

    if (isNaN(completed.getTime()) || isNaN(due.getTime())) return 'on-time';

    if (completed > due) return 'late-submission';
    return 'on-time';
};

const getSubmissionStatusText = (assessment) => {
    if (!assessment.dueDate || !assessment.completedDate) return 'On Time';

    const completed = new Date(assessment.completedDate);
    const due = new Date(assessment.dueDate);

    if (isNaN(completed.getTime()) || isNaN(due.getTime())) return 'On Time';

    if (completed > due) return 'Late Submission';
    return 'Submitted On Time';
};

// Helper function to determine completion reason for teachers
const getCompletionStatus = (assessment) => {
    if (!isTeacher.value || !assessment.completedDate) return null;

    const dueDate = new Date(assessment.dueDate);
    const completedDate = new Date(assessment.completedDate);

    // Check if everyone responded before deadline
    if (assessment.responsesCount === assessment.studentsCount && completedDate <= dueDate) {
        return {
            type: 'all-responded',
            text: 'All students responded',
            class: 'status-complete'
        };
    }

    // Check if completed due to deadline
    if (completedDate.getTime() === dueDate.getTime() || Math.abs(completedDate.getTime() - dueDate.getTime()) < 1000) {
        return {
            type: 'deadline-reached',
            text: 'Closed by deadline',
            class: 'status-deadline'
        };
    }

    // Check if all responded after deadline
    if (assessment.responsesCount === assessment.studentsCount && completedDate > dueDate) {
        return {
            type: 'all-responded-late',
            text: 'All students responded (after deadline)',
            class: 'status-late'
        };
    }

        return {
        type: 'unknown',
        text: 'Completed',
        class: 'status-complete'
    };
};

const startAssessment = (id) => {
    router.push(`/assessment/${id}`);
};

const viewResults = (id) => {
    router.push(`/assessment/${id}/results`);
};

const loadCourses = async () => {
    try {
        const { data } = await courseService.getCourses(true); // Get courses where user is teaching
        courses.value = data;
    } catch (error) {
        console.error('Error loading courses:', error);
    }
};

const loadGroups = async () => {
    try {
        if (!newAssessment.value.courseId) return;

        const { data } = await groupService.getGroups(newAssessment.value.courseId);
        groups.value = data;
        newAssessment.value.groupIds = []; // Reset selected groups
    } catch (error) {
        console.error('Error loading groups:', error);
    }
};

const addCriterion = () => {
    newAssessment.value.criteria.push({
        name: '',
        description: '',
        minScore: 0,
        maxScore: 10
    });
};

const removeCriterion = (index) => {
    if (newAssessment.value.criteria.length > 1) {
        newAssessment.value.criteria.splice(index, 1);
    }
};

const createAssessment = async () => {
    try {
        isSubmitting.value = true;

        // Format date for API
        const formattedAssessment = {
            ...newAssessment.value,
            dueDate: new Date(newAssessment.value.dueDate).toISOString()
        };

        await assessmentService.createAssessment(formattedAssessment);

        // Reset form and close modal
        newAssessment.value = {
            title: '',
            description: '',
            courseId: '',
            groupIds: [],
            dueDate: '',
            criteria: [
                {
                    name: '',
                    description: '',
                    minScore: 0,
                    maxScore: 10
                }
            ]
        };

        showCreateModal.value = false;

        // Refresh the assessments list
        const pendingResponse = await assessmentService.getPendingAssessments();
        pendingAssessments.value = pendingResponse.data;

    } catch (error) {
        console.error('Error creating assessment:', error);
        // You could add error handling UI here
    } finally {
        isSubmitting.value = false;
    }
};

// Add function to toggle all groups selection
const toggleAllGroups = () => {
    if (newAssessment.value.groupIds.length === groups.value.length) {
        newAssessment.value.groupIds = [];
    } else {
        newAssessment.value.groupIds = groups.value.map(g => g.id);
    }
};

const isStudent = computed(() => {
    return !isTeacher.value;
});

// Add new computed properties for organizing assessments
const organizedAssessments = computed(() => {
    if (!isTeacher.value) return {};

    // Organize assessments by course and group
    const organized = {};

    // Process pending assessments
    if (activeTab.value === 'pending') {
        pendingAssessments.value.forEach(assessment => {
            if (!organized[assessment.courseName]) {
                organized[assessment.courseName] = {
                    groups: {},
                    courseId: assessment.courseId
                };
            }

            if (!organized[assessment.courseName].groups[assessment.groupName]) {
                organized[assessment.courseName].groups[assessment.groupName] = [];
            }

            // Check if assessment already exists in this group
            const existingAssessment = organized[assessment.courseName].groups[assessment.groupName]
                .find(a => a.title === assessment.title);

            if (!existingAssessment) {
                organized[assessment.courseName].groups[assessment.groupName].push({
                    ...assessment,
                    totalStudents: assessment.studentsCount,
                    completedCount: assessment.responsesCount
                });
            }
        });
    } else {
        // Process completed assessments
        completedAssessments.value.forEach(assessment => {
            if (!organized[assessment.courseName]) {
                organized[assessment.courseName] = {
                    groups: {},
                    courseId: assessment.courseId
                };
            }

            if (!organized[assessment.courseName].groups[assessment.groupName]) {
                organized[assessment.courseName].groups[assessment.groupName] = [];
            }

            // Check if assessment already exists in this group
            const existingAssessment = organized[assessment.courseName].groups[assessment.groupName]
                .find(a => a.title === assessment.title);

            if (!existingAssessment) {
                organized[assessment.courseName].groups[assessment.groupName].push({
                    ...assessment,
                    totalStudents: assessment.studentsCount,
                    completedCount: assessment.responsesCount
                });
            }
        });
    }

    return organized;
});

// Update the onMounted hook
onMounted(async () => {
    try {
        loading.value = true;

        // Check if user is a teacher or admin
        const { data: roleData } = await authService.checkUserRole();
        isTeacher.value = roleData.role === 'teacher' || roleData.role === 'admin';
        isAdmin.value = roleData.role === 'admin';

        // Load assessments based on user role
        if (isTeacher.value) {
            // For teachers, load assessments linked to their courses
            const { data: coursesData } = await courseService.getCourses(true);
            courses.value = coursesData;

            // Get assessments for teacher's courses
            const pendingResponse = await assessmentService.getPendingAssessmentsForTeacher();
            pendingAssessments.value = pendingResponse.data;

            const completedResponse = await assessmentService.getCompletedAssessmentsForTeacher();
            completedAssessments.value = completedResponse.data;
        } else {
            // For students, load their assessments
            const pendingResponse = await assessmentService.getPendingAssessments();
            pendingAssessments.value = pendingResponse.data;

            const completedResponse = await assessmentService.getCompletedAssessments();
            completedAssessments.value = completedResponse.data;
        }
    } catch (error) {
        console.error('Error fetching assessments:', error);
    } finally {
        loading.value = false;
    }
});

const openCreateModal = () => {
    console.log('Opening modal:', {
        isTeacher: isTeacher.value,
        isAdmin: isAdmin.value,
        showCreateModal: showCreateModal.value
    });
    showCreateModal.value = true;
    console.log('Modal state after click:', showCreateModal.value);
};

// Helper functions for card styling
const getCardStatusClass = (assessment) => {
    if (activeTab.value === 'completed' || assessment.completedDate) {
        return 'completed-status';
    }

    const now = new Date();
    const due = new Date(assessment.dueDate);
    const hoursRemaining = (due - now) / (1000 * 60 * 60);

    if (hoursRemaining < 0) return 'overdue-status';
    if (hoursRemaining < 24) return 'urgent-status';
    if (hoursRemaining < 72) return 'warning-status';
    return 'normal-status';
};

const getProgressClass = (assessment) => {
    const percentage = Math.round((assessment.responsesCount / assessment.studentsCount) * 100);

    if (percentage >= 100) return 'progress-complete';
    if (percentage >= 75) return 'progress-high';
    if (percentage >= 50) return 'progress-medium';
    if (percentage >= 25) return 'progress-low';
    return 'progress-none';
};
</script>

<style scoped>
.assessments-container {
    max-width: 1200px;
    margin: 0 auto;
}

/* Modal Overlay */
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

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem 2rem;
    border-bottom: 1px solid #e1e1e1;
}

.modal-header h2 {
    margin: 0;
    color: #2c3e50;
}

.modal-header .close-button {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #7f8c8d;
    padding: 0.5rem;
    transition: color 0.2s ease;
}

.modal-header .close-button:hover {
    color: #34495e;
}

/* Modal Layout */
.modal-content {
    background-color: white;
    border-radius: 10px;
    width: 90%;
    max-width: 800px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}

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

.modal-body {
    padding: 2rem;
}

/* Modal Header */
.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem 2rem;
    border-bottom: 1px solid #e1e1e1;
}

.modal-header h2 {
    margin: 0;
    color: #2c3e50;
}

.modal-header .close-button {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #7f8c8d;
    padding: 0.5rem;
    transition: color 0.2s ease;
}

.modal-header .close-button:hover {
    color: #34495e;
}

/* Form Elements */
.form-group {
    margin-bottom: 1.5rem;
    max-width: 100%;
}

.form-group input,
.form-group textarea,
.form-group select {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 1rem;
    max-width: 100%;
    box-sizing: border-box;
}

/* Groups Selection */
.groups-selection {
    border: 1px solid #e1e1e1;
    border-radius: 8px;
    padding: 1.5rem;
    margin-top: 0.5rem;
    background-color: #f8f9fa;
}

.select-all-button {
    background-color: #fff;
    border: 1px solid #3498db;
    color: #3498db;
    border-radius: 6px;
    padding: 0.75rem 1rem;
    margin-bottom: 1.5rem;
    cursor: pointer;
    width: 100%;
    max-width: 200px;
    text-align: center;
    transition: all 0.2s ease;
    display: block;
    margin-left: auto;
    margin-right: auto;
}

.select-all-button:hover {
    background-color: #3498db;
    color: white;
}

.groups-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 1rem;
    justify-content: center;
    padding: 0 0.5rem;
}

.group-checkbox {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    background-color: white;
    border: 1px solid #e1e1e1;
    border-radius: 6px;
    transition: all 0.2s ease;
}

.group-checkbox:hover {
    border-color: #3498db;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.group-checkbox input[type="checkbox"] {
    margin: 0;
    width: 16px;
    height: 16px;
    cursor: pointer;
}

.group-checkbox label {
    margin: 0;
    cursor: pointer;
    font-size: 0.95rem;
    color: #2c3e50;
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.no-groups, .select-course-hint {
    text-align: center;
    color: #6c757d;
    margin: 2rem 0;
    font-style: italic;
}

/* Assessment Criteria */
.criterion-item {
    background-color: white;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    border-radius: 8px;
    border: 1px solid #e1e1e1;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.scores-range {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
}

.scores-range .form-group {
    margin-bottom: 0;
}

.scores-range input {
    width: 100%;
}

/* Form Actions */
.form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 2rem;
}

.cancel-button {
    padding: 0.75rem 1.5rem;
    border: 1px solid #e74c3c;
    background: white;
    color: #e74c3c;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s ease;
}

.cancel-button:hover {
    background: #e74c3c;
    color: white;
}

.create-button {
    padding: 0.75rem 1.5rem;
    border: none;
    background: #2ecc71;
    color: white;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s ease;
}

.create-button:hover:not(:disabled) {
    background: #27ae60;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.create-button:disabled {
    background: #95a5a6;
    cursor: not-allowed;
    opacity: 0.7;
}

/* Criterion Buttons */
.add-criterion-button {
    width: 100%;
    padding: 0.75rem;
    background: #3498db;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    font-weight: 500;
    transition: all 0.2s ease;
    margin-top: 1rem;
}

.add-criterion-button:hover {
    background: #2980b9;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.add-criterion-button i {
    font-size: 0.9rem;
}

.criterion-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
}

.criterion-header h4 {
    margin: 0;
    color: #2c3e50;
    font-size: 1.1rem;
}

.remove-button {
    background: none;
    border: none;
    color: #e74c3c;
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0.25rem 0.5rem;
    line-height: 1;
    border-radius: 4px;
    transition: all 0.2s ease;
}

.remove-button:hover {
    background: rgba(231, 76, 60, 0.1);
    transform: scale(1.1);
}

.hint {
    color: #7f8c8d;
    font-size: 0.9rem;
    margin-bottom: 1.5rem;
    font-style: italic;
}

.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
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
}

.assessment-tabs {
    display: flex;
    gap: 1rem;
    margin-bottom: 2rem;
}

.tab-button {
    background: none;
    border: none;
    padding: 1rem 2rem;
    cursor: pointer;
    color: #7f8c8d;
    border-bottom: 2px solid transparent;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.tab-button.active {
    color: #3498db;
    border-bottom-color: #3498db;
}

.badge {
    background-color: #ecf0f1;
    padding: 0.2rem 0.6rem;
    border-radius: 12px;
    font-size: 0.8rem;
}

.loading-state, .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem;
    color: #7f8c8d;
}

.loading-state i, .empty-state i {
    font-size: 3rem;
    margin-bottom: 1rem;
}

/* Student Assessments Specific Styles */
.student-assessments-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 1.5rem;
    margin-top: 1.5rem;
}

.student-assessment-card {
    background: white;
    border-radius: 12px;
    padding: 1.25rem;
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    border: 1px solid #e1e1e1;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
}

.student-assessment-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 25px rgba(0,0,0,0.15);
}

.student-assessment-card.overdue {
    border-left: 4px solid #e74c3c;
}

.student-assessment-card.urgent {
    border-left: 4px solid #f39c12;
}

.student-assessment-card.warning {
    border-left: 4px solid #f1c40f;
}

.student-assessment-card.normal {
    border-left: 4px solid #27ae60;
}

.student-assessment-card.completed-card {
    border-left: 4px solid #3498db;
}

.assessment-urgency-indicator {
    position: absolute;
    top: 0;
    right: 0;
    width: 0;
    height: 0;
    border-style: solid;
}

.overdue-indicator {
    border-width: 0 30px 30px 0;
    border-color: transparent #e74c3c transparent transparent;
}

.urgent-indicator {
    border-width: 0 25px 25px 0;
    border-color: transparent #f39c12 transparent transparent;
}

.warning-indicator {
    border-width: 0 20px 20px 0;
    border-color: transparent #f1c40f transparent transparent;
}

.normal-indicator {
    border-width: 0 15px 15px 0;
    border-color: transparent #27ae60 transparent transparent;
}

.assessment-status-badge {
    position: absolute;
    top: 0.6rem;
    right: 0.6rem;
    background: #e74c3c;
    color: white;
    padding: 0.2rem 0.6rem;
    border-radius: 15px;
    font-size: 0.75rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.25rem;
}

.completion-badge {
    position: absolute;
    top: 0.6rem;
    right: 0.6rem;
    background: #27ae60;
    color: white;
    padding: 0.2rem 0.6rem;
    border-radius: 15px;
    font-size: 0.75rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.25rem;
}

.student-assessment-header {
    margin-bottom: 0.75rem;
}

.student-assessment-header h3 {
    margin: 0 0 0.5rem 0;
    color: #2c3e50;
    font-size: 1.2rem;
    font-weight: 600;
    line-height: 1.3;
}

.due-info, .completion-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.due-date-display, .completion-date-display {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.85rem;
    font-weight: 500;
}

.due-date-display.overdue {
    color: #e74c3c;
}

.due-date-display.urgent {
    color: #f39c12;
}

.due-date-display.warning {
    color: #e67e22;
}

.due-date-display.normal {
    color: #27ae60;
}

.completion-date-display {
    color: #3498db;
}

.due-label, .completion-label {
    font-weight: 400;
    color: #6c757d;
}

.due-date-time, .completion-date-time {
    font-weight: 600;
}

.time-remaining {
    font-size: 0.75rem;
    color: #7f8c8d;
    font-style: italic;
}

.submission-status {
    font-size: 0.8rem;
    padding: 0.2rem 0.5rem;
    border-radius: 12px;
    font-weight: 500;
    align-self: flex-start;
}

.submission-status.on-time {
    background: #d4edda;
    color: #155724;
}

.submission-status.late-submission {
    background: #f8d7da;
    color: #721c24;
}

/* Completion status styles */
.completion-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.completion-status {
    font-size: 0.8rem;
    padding: 0.2rem 0.5rem;
    border-radius: 12px;
    font-weight: 500;
    text-align: center;
}

.status-complete {
    background: #d4edda;
    color: #155724;
}

.status-deadline {
    background: #fff3cd;
    color: #856404;
}

.status-late {
    background: #f8d7da;
    color: #721c24;
}

/* Course and Group Headers */
.course-header {
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 2px solid #e8ecf1;
}

.course-header h2 {
    color: #2c3e50;
    font-size: 1.5rem;
    margin: 0;
    font-weight: 600;
}

.group-header {
    margin-bottom: 1rem;
}

.group-header h3 {
    color: #34495e;
    font-size: 1.1rem;
    margin: 0;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.group-header h3::before {
    content: "📁";
    font-size: 0.9rem;
}

/* Teacher Assessment Cards Grid */
.group-assessments {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1.5rem;
    margin-top: 1rem;
}

/* Modern Teacher Assessment Cards - Compact Design */
.teacher-assessment-card {
    background: linear-gradient(135deg, #ffffff 0%, #f8f9fc 100%);
    border-radius: 12px;
    padding: 0;
    box-shadow: 0 3px 12px rgba(0, 0, 0, 0.06);
    border: 1px solid #e8ecf1;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
    height: 320px;
    max-width: 280px;
    width: 100%;
    display: flex;
    flex-direction: column;
}

.teacher-assessment-card:hover {
    transform: translateY(-8px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
    border-color: #3498db;
}

.teacher-assessment-card.completed {
    background: linear-gradient(135deg, #f0f8f5 0%, #e8f5e8 100%);
    border-color: #27ae60;
}

/* Card Status Bar */
.card-status-bar {
    height: 4px;
    width: 100%;
    position: absolute;
    top: 0;
    left: 0;
    border-radius: 16px 16px 0 0;
}

.completed-status {
    background: linear-gradient(90deg, #27ae60, #2ecc71);
}

.overdue-status {
    background: linear-gradient(90deg, #e74c3c, #ec7063);
}

.urgent-status {
    background: linear-gradient(90deg, #f39c12, #f7dc6f);
}

.warning-status {
    background: linear-gradient(90deg, #f1c40f, #f4d03f);
}

.normal-status {
    background: linear-gradient(90deg, #3498db, #5dade2);
}

/* Card Header */
.card-header {
    padding: 1rem 1rem 0.5rem;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 0.75rem;
    margin-top: 4px; /* Account for status bar */
}

.title-section {
    flex: 1;
    min-width: 0; /* For text overflow */
}

.assessment-title {
    font-size: 1.1rem;
    font-weight: 700;
    color: #2c3e50;
    margin: 0 0 0.5rem 0;
    line-height: 1.2;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.assessment-meta {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
}

.group-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    background: linear-gradient(135deg, #3498db, #2980b9);
    color: white;
    padding: 0.25rem 0.6rem;
    border-radius: 15px;
    font-size: 0.75rem;
    font-weight: 500;
    box-shadow: 0 2px 6px rgba(52, 152, 219, 0.25);
}

.group-badge i {
    font-size: 0.7rem;
}

/* Status Section */
.status-section {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.4rem;
    min-width: 100px;
}

.date-info {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.4rem 0.7rem;
    border-radius: 10px;
    font-size: 0.8rem;
    font-weight: 500;
    min-width: 0;
}

.date-info.pending {
    background: linear-gradient(135deg, #fff3cd, #ffeeba);
    color: #856404;
    border: 1px solid #ffeaa7;
}

.date-info.completed {
    background: linear-gradient(135deg, #d4edda, #c3e6cb);
    color: #155724;
    border: 1px solid #b8daff;
}

.date-info i {
    font-size: 0.9rem;
    flex-shrink: 0;
}

.date-details {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    min-width: 0;
}

.date-label {
    font-size: 0.65rem;
    opacity: 0.8;
    margin-bottom: 0.05rem;
}

.date-value {
    font-weight: 600;
    white-space: nowrap;
    font-size: 0.75rem;
}

.status-badge {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.2rem 0.5rem;
    border-radius: 10px;
    font-size: 0.7rem;
    font-weight: 500;
    text-align: center;
}

.status-badge.status-complete {
    background: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
}

.status-badge.status-deadline {
    background: #fff3cd;
    color: #856404;
    border: 1px solid #ffeaa7;
}

.status-badge.status-late {
    background: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
}

/* Card Content */
.card-content {
    padding: 0 1rem 1rem;
    flex: 1;
    display: flex;
    flex-direction: column;
}

.assessment-description {
    color: #5a6c7d;
    line-height: 1.4;
    margin-bottom: 1rem;
    font-size: 0.85rem;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

/* Stats Section */
.stats-section {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.response-stats {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
}

.stat-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    background: rgba(255, 255, 255, 0.8);
    border-radius: 10px;
    border: 1px solid #e8ecf1;
    transition: all 0.2s ease;
}

.stat-item:hover {
    background: rgba(255, 255, 255, 1);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}

.stat-icon {
    width: 2rem;
    height: 2rem;
    background: linear-gradient(135deg, #3498db, #2980b9);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 0.8rem;
    flex-shrink: 0;
}

.stat-details {
    display: flex;
    flex-direction: column;
    min-width: 0;
}

.stat-label {
    font-size: 0.7rem;
    color: #7f8c8d;
    margin-bottom: 0.1rem;
}

.stat-value {
    font-weight: 700;
    color: #2c3e50;
    font-size: 0.9rem;
}

/* Progress Container */
.progress-container {
    background: rgba(255, 255, 255, 0.8);
    border-radius: 10px;
    padding: 0.75rem;
    border: 1px solid #e8ecf1;
}

.progress-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
}

.progress-label {
    font-size: 0.8rem;
    color: #5a6c7d;
    font-weight: 500;
}

.progress-percentage {
    font-weight: 700;
    color: #2c3e50;
    font-size: 0.85rem;
}

.progress-bar-modern {
    height: 6px;
    background: #ecf0f1;
    border-radius: 4px;
    overflow: hidden;
    position: relative;
}

.progress-fill {
    height: 100%;
    border-radius: 6px;
    transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
}

.progress-fill::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, rgba(255,255,255,0.2) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.2) 75%, transparent 75%, transparent);
    background-size: 20px 20px;
    animation: progress-shimmer 2s linear infinite;
}

@keyframes progress-shimmer {
    0% { transform: translateX(-20px); }
    100% { transform: translateX(20px); }
}

.progress-complete {
    background: linear-gradient(90deg, #27ae60, #2ecc71);
}

.progress-high {
    background: linear-gradient(90deg, #3498db, #5dade2);
}

.progress-medium {
    background: linear-gradient(90deg, #f39c12, #f7dc6f);
}

.progress-low {
    background: linear-gradient(90deg, #e67e22, #eb984e);
}

.progress-none {
    background: linear-gradient(90deg, #e74c3c, #ec7063);
}

/* Card Footer */
.card-footer {
    padding: 0.75rem 1rem 1rem;
    background: rgba(248, 249, 252, 0.5);
    border-top: 1px solid #e8ecf1;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.75rem;
    margin-top: auto;
}

.action-buttons {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
}

.action-btn {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.5rem 0.8rem;
    border: none;
    border-radius: 6px;
    font-weight: 600;
    font-size: 0.75rem;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    text-decoration: none;
    position: relative;
    overflow: hidden;
}

.action-btn::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
    transition: left 0.5s;
}

.action-btn:hover::before {
    left: 100%;
}

.action-btn.primary {
    background: linear-gradient(135deg, #3498db, #2980b9);
    color: white;
    box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
}

.action-btn.primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(52, 152, 219, 0.4);
}

.action-btn.secondary {
    background: linear-gradient(135deg, #95a5a6, #7f8c8d);
    color: white;
    box-shadow: 0 4px 12px rgba(149, 165, 166, 0.3);
}

.action-btn.secondary:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(149, 165, 166, 0.4);
}

.action-btn i {
    font-size: 0.7rem;
}

.quick-stats {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.quick-stat {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    color: #7f8c8d;
    font-size: 0.75rem;
    font-weight: 500;
}

.quick-stat i {
    color: #3498db;
    font-size: 0.7rem;
}

/* Responsive Design */
@media (max-width: 1200px) {
    .group-assessments {
        grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    }
}

@media (max-width: 768px) {
    .teacher-assessment-card {
        min-height: auto;
        height: auto;
        max-width: 100%;
    }

    .group-assessments {
        grid-template-columns: 1fr;
    }

    .card-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.75rem;
        padding: 1rem 1rem 0.75rem;
    }

    .status-section {
        align-items: flex-start;
        width: 100%;
        flex-direction: row;
        gap: 0.75rem;
    }

    .date-info {
        align-self: flex-start;
    }

    .response-stats {
        grid-template-columns: 1fr;
        gap: 0.5rem;
    }

    .action-buttons {
        flex-direction: row;
        width: 100%;
        gap: 0.5rem;
    }

    .action-btn {
        justify-content: center;
        flex: 1;
        font-size: 0.7rem;
        padding: 0.4rem 0.6rem;
    }

    .card-footer {
        flex-direction: column;
        align-items: stretch;
        gap: 0.75rem;
        padding: 0.75rem;
    }

    .quick-stats {
        justify-content: center;
    }
}
</style>
