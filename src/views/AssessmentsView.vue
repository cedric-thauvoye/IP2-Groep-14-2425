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

            <!-- Course Filter (only for teachers) -->
            <div v-if="isTeacher" class="course-filter">
                <div class="filter-group">
                    <label for="courseFilter">
                        <i class="fas fa-filter"></i>
                        Filter by Course:
                    </label>
                    <select id="courseFilter" v-model="selectedCourseFilter" class="course-filter-select">
                        <option value="">All Courses</option>
                        <option v-for="course in availableCourses" :key="course" :value="course">
                            {{ course }}
                        </option>
                    </select>
                    <span class="filter-count" v-if="selectedCourseFilter">
                        ({{ filteredAssessmentsCount }} assessment{{ filteredAssessmentsCount !== 1 ? 's' : '' }} shown)
                    </span>
                </div>
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
const selectedCourseFilter = ref('');

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

// Add new computed properties for organizing assessments
const organizedAssessments = computed(() => {
    if (!isTeacher.value) return {};

    // Organize assessments by course and group
    const organized = {};

    // Process pending assessments
    if (activeTab.value === 'pending') {
        pendingAssessments.value
            .filter(assessment => !selectedCourseFilter.value || assessment.courseName === selectedCourseFilter.value)
            .forEach(assessment => {
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
        completedAssessments.value
            .filter(assessment => !selectedCourseFilter.value || assessment.courseName === selectedCourseFilter.value)
            .forEach(assessment => {
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

// Computed property for available courses based on teacher's courses
const availableCourses = computed(() => {
    if (!isTeacher.value) return [];
    return courses.value.map(course => course.name);
});

// Computed property for filtered assessments count
const filteredAssessmentsCount = computed(() => {
    if (!selectedCourseFilter.value) return 0;

    const assessments = activeTab.value === 'pending' ? pendingAssessments.value : completedAssessments.value;
    return assessments.filter(assessment => assessment.courseName === selectedCourseFilter.value).length;
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

/* Course Filter Styles */
.course-filter {
    margin-bottom: 1.5rem;
    padding: 1rem;
    background: #f8f9fa;
    border-radius: 8px;
    border: 1px solid #e9ecef;
}

.filter-group {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
}

.filter-group label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 600;
    color: #495057;
    margin: 0;
}

.filter-group label i {
    color: #6c757d;
}

.course-filter-select {
    padding: 0.5rem 1rem;
    border: 1px solid #ced4da;
    border-radius: 6px;
    background: white;
    font-size: 0.9rem;
    color: #495057;
    min-width: 200px;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.course-filter-select:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
}

.filter-count {
    color: #6c757d;
    font-size: 0.85rem;
    font-style: italic;
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

/* Teacher Card Specific Styles for Shared Classes */
.teacher-assessment-card .assessment-description {
    color: #6c757d;
    line-height: 1.5;
    margin: 0 0 1rem 0;
    font-size: 0.9rem;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.teacher-assessment-card .progress-bar-modern {
    height: 8px;
    background: #e9ecef;
    border-radius: 6px;
    overflow: hidden;
    position: relative;
}

.teacher-assessment-card .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #007bff, #0056b3);
    border-radius: 6px;
    transition: width 0.4s ease;
}

/* Teacher View Layout - Course and Group Headers */
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
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 1.5rem;
    margin-top: 1rem;
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

/* Student Assessment Content */
.student-assessment-card .assessment-description {
    color: #6c757d;
    line-height: 1.5;
    margin: 0 0 1rem 0;
    font-size: 0.9rem;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.assessment-urgency-indicator {
    position: absolute;
    top: 0;
    right: 0;
    width: 0;
    height: 0;
    border-style: solid;
    z-index: 2;
}

.student-assessment-card .overdue-indicator {
    border-width: 0 35px 35px 0;
    border-color: transparent #e74c3c transparent transparent;
    filter: drop-shadow(0 2px 4px rgba(231, 76, 60, 0.3));
}

.student-assessment-card .urgent-indicator {
    border-width: 0 30px 30px 0;
    border-color: transparent #f39c12 transparent transparent;
    filter: drop-shadow(0 2px 4px rgba(243, 156, 18, 0.3));
}

.student-assessment-card .warning-indicator {
    border-width: 0 25px 25px 0;
    border-color: transparent #f1c40f transparent transparent;
    filter: drop-shadow(0 2px 4px rgba(241, 196, 15, 0.3));
}

.student-assessment-card .normal-indicator {
    border-width: 0 20px 20px 0;
    border-color: transparent #27ae60 transparent transparent;
    filter: drop-shadow(0 2px 4px rgba(39, 174, 96, 0.3));
}

.student-assessment-card .assessment-status-badge {
    position: absolute;
    top: 0.75rem;
    right: 0.75rem;
    background: linear-gradient(135deg, #e74c3c, #c0392b);
    color: white;
    padding: 0.4rem 0.8rem;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.3rem;
    box-shadow: 0 3px 12px rgba(231, 76, 60, 0.3);
    z-index: 3;
    border: 1px solid rgba(255, 255, 255, 0.2);
}

.student-assessment-card .completion-badge {
    position: absolute;
    top: 0.75rem;
    right: 0.75rem;
    background: linear-gradient(135deg, #27ae60, #229954);
    color: white;
    padding: 0.4rem 0.8rem;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.3rem;
    box-shadow: 0 3px 12px rgba(39, 174, 96, 0.3);
    z-index: 3;
    border: 1px solid rgba(255, 255, 255, 0.2);
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

.student-assessment-card .due-date-display.overdue {
    color: #e74c3c;
}

.student-assessment-card .due-date-display.urgent {
    color: #f39c12;
}

.student-assessment-card .due-date-display.warning {
    color: #e67e22;
}

.student-assessment-card .due-date-display.normal {
    color: #27ae60;
}

.student-assessment-card .completion-date-display {
    color: #3498db;
}

.student-assessment-card .due-label,
.student-assessment-card .completion-label {
    font-weight: 400;
    color: #6c757d;
}

.student-assessment-card .due-date-time,
.student-assessment-card .completion-date-time {
    font-weight: 600;
}

.student-assessment-card .time-remaining {
    font-size: 0.75rem;
    color: #7f8c8d;
    font-style: italic;
}

.student-assessment-card .submission-status {
    font-size: 0.8rem;
    padding: 0.2rem 0.5rem;
    border-radius: 12px;
    font-weight: 500;
    align-self: flex-start;
}

.student-assessment-card .submission-status.on-time {
    background: #d4edda;
    color: #155724;
}

.student-assessment-card .submission-status.late-submission {
    background: #f8d7da;
    color: #721c24;
}

/* Student Completion status styles */
.student-assessment-card .completion-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.student-assessment-card .completion-status {
    font-size: 0.8rem;
    padding: 0.2rem 0.5rem;
    border-radius: 12px;
    font-weight: 500;
    text-align: center;
}

.student-assessment-card .status-complete {
    background: #d4edda;
    color: #155724;
}

.student-assessment-card .status-deadline {
    background: #fff3cd;
    color: #856404;
}

.student-assessment-card .status-late {
    background: #f8d7da;
    color: #721c24;
}

/* Student Assessment Card Content Styles */
.student-assessment-card .course-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1rem;
    padding: 0.5rem 0.75rem;
    background: linear-gradient(135deg, #f8f9fa, #e9ecef);
    border-radius: 8px;
    border-left: 3px solid #007bff;
}

.student-assessment-card .course-info i {
    color: #007bff;
    font-size: 0.9rem;
}

.student-assessment-card .course-info span {
    color: #495057;
    font-weight: 500;
    font-size: 0.9rem;
}

.student-assessment-card .student-assessment-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.student-assessment-card .progress-section {
    background: linear-gradient(135deg, #f8f9fc, #e8ecf1);
    border-radius: 10px;
    padding: 1rem;
    border: 1px solid #e1e8f0;
}

.student-assessment-card .progress-bar-container {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.5rem;
}

.student-assessment-card .progress-bar {
    flex: 1;
    height: 8px;
    background: #e9ecef;
    border-radius: 10px;
    overflow: hidden;
    position: relative;
}

.student-assessment-card .progress-bar .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #28a745, #20c997);
    border-radius: 10px;
    transition: width 0.4s ease;
    position: relative;
}

.student-assessment-card .progress-bar .progress-fill::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
    animation: shimmer 2s infinite;
}

@keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
}

.student-assessment-card .progress-percentage {
    font-weight: 700;
    color: #28a745;
    font-size: 0.9rem;
    min-width: 40px;
    text-align: right;
}

.student-assessment-card .progress-label {
    font-size: 0.8rem;
    color: #6c757d;
    margin: 0;
    font-weight: 500;
}

.student-assessment-card .results-section {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
}

.student-assessment-card .result-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    background: linear-gradient(135deg, #ffffff, #f8f9fc);
    border-radius: 10px;
    border: 1px solid #e1e8f0;
    transition: all 0.2s ease;
}

.student-assessment-card .result-item:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.student-assessment-card .result-icon {
    width: 2.5rem;
    height: 2.5rem;
    background: linear-gradient(135deg, #007bff, #0056b3);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 1rem;
    flex-shrink: 0;
}

.student-assessment-card .result-details {
    display: flex;
    flex-direction: column;
    min-width: 0;
}

.student-assessment-card .result-label {
    font-size: 0.75rem;
    color: #6c757d;
    margin-bottom: 0.1rem;
    font-weight: 500;
}

.student-assessment-card .result-value {
    font-weight: 700;
    color: #2c3e50;
    font-size: 0.9rem;
}

.student-assessment-card .student-assessment-footer {
    margin-top: auto;
    padding-top: 1rem;
    border-top: 1px solid #e9ecef;
}

.student-assessment-card .continue-button,
.student-assessment-card .results-button {
    width: 100%;
    background: linear-gradient(135deg, #007bff, #0056b3);
    color: white;
    border: none;
    padding: 0.875rem 1rem;
    border-radius: 10px;
    font-weight: 600;
    font-size: 0.9rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
}

.student-assessment-card .continue-button::before,
.student-assessment-card .results-button::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
    transition: left 0.6s ease;
}

.student-assessment-card .continue-button:hover::before,
.student-assessment-card .results-button:hover::before {
    left: 100%;
}

.student-assessment-card .continue-button:hover:not(:disabled),
.student-assessment-card .results-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 123, 255, 0.4);
}

.student-assessment-card .results-button {
    background: linear-gradient(135deg, #28a745, #20c997);
}

.student-assessment-card .results-button:hover {
    box-shadow: 0 6px 20px rgba(40, 167, 69, 0.4);
}

.student-assessment-card .continue-button:disabled {
    background: linear-gradient(135deg, #6c757d, #5a6268);
    cursor: not-allowed;
    opacity: 0.7;
    transform: none;
    box-shadow: none;
}

.student-assessment-card .overdue-notice {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    color: #dc3545;
    font-size: 0.85rem;
    font-weight: 500;
    margin-top: 0.75rem;
    padding: 0.5rem;
    background: linear-gradient(135deg, #f8d7da, #f5c6cb);
    border-radius: 8px;
    border: 1px solid #f5c6cb;
}

/* Responsive Design for Student Cards */
@media (max-width: 768px) {
    .student-assessments-grid {
        grid-template-columns: 1fr;
        gap: 1rem;
    }

    .student-assessment-card {
        padding: 1rem;
    }

    .student-assessment-card .student-assessment-header h3 {
        font-size: 1.1rem;
    }

    .student-assessment-card .results-section {
        grid-template-columns: 1fr;
        gap: 0.5rem;
    }

    .student-assessment-card .result-item {
        padding: 0.5rem;
    }

    .student-assessment-card .result-icon {
        width: 2rem;
        height: 2rem;
        font-size: 0.8rem;
    }

    .student-assessment-card .continue-button,
    .student-assessment-card .results-button {
        padding: 0.75rem;
        font-size: 0.85rem;
    }
}

/* Modern Teacher Assessment Cards - Clean Design */
.teacher-assessment-card {
    background: #ffffff;
    border-radius: 8px;
    padding: 0;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    border: 1px solid #e1e8ed;
    transition: box-shadow 0.2s ease;
    position: relative;
    overflow: hidden;
    height: 350px;
    max-width: 450px;
    width: 100%;
    display: flex;
    flex-direction: column;
}

.teacher-assessment-card:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.teacher-assessment-card.completed {
    background: #f8fcf9;
    border-color: #d4edda;
}

/* Card Status Bar */
.card-status-bar {
    height: 3px;
    width: 100%;
    position: absolute;
    top: 0;
    left: 0;
}

.completed-status {
    background: #28a745;
}

.overdue-status {
    background: #dc3545;
}

.urgent-status {
    background: #fd7e14;
}

.warning-status {
    background: #ffc107;
}

.normal-status {
    background: #007bff;
}

/* Card Header */
.card-header {
    padding: 1.25rem 1.25rem 0.75rem;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
    margin-top: 3px; /* Account for status bar */
}

.title-section {
    flex: 1;
    min-width: 0;
}

.assessment-title {
    font-size: 1.1rem;
    font-weight: 600;
    color: #343a40;
    margin: 0 0 0.5rem 0;
    line-height: 1.3;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
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
    background: #f8f9fa;
    color: #495057;
    padding: 0.25rem 0.6rem;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 500;
    border: 1px solid #dee2e6;
}

.group-badge i {
    font-size: 0.7rem;
}

/* Status Section */
.status-section {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.5rem;
    min-width: 110px;
}

.date-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    border-radius: 6px;
    font-size: 0.8rem;
    font-weight: 500;
    border: 1px solid;
}

.date-info.pending {
    background: #fff3cd;
    color: #856404;
    border-color: #ffeaa7;
}

.date-info.completed {
    background: #d4edda;
    color: #155724;
    border-color: #c3e6cb;
}

.date-info i {
    font-size: 0.8rem;
    flex-shrink: 0;
}

.date-details {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
}

.date-label {
    font-size: 0.65rem;
    opacity: 0.8;
    margin-bottom: 0.1rem;
}

.date-value {
    font-weight: 600;
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
    padding: 0 1.25rem 1rem;
    flex: 1;
    display: flex;
    flex-direction: column;
}

.assessment-description {
    color: #6c757d;
    line-height: 1.4;
    margin-bottom: 1rem;
    font-size: 0.9rem;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
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
    justify-content: flex-start;
    gap: 0.75rem;
    padding: 0.75rem;
    background: #f8f9fa;
    border-radius: 6px;
    border: 1px solid #e9ecef;
    text-align: left;
}

.stat-icon {
    width: 2rem;
    height: 2rem;
    background: #007bff;
    border-radius: 6px;
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
    justify-content: center;
    align-items: flex-start;
    flex: 1;
}

.stat-label {
    font-size: 0.7rem;
    color: #6c757d;
    margin-bottom: 0.1rem;
    line-height: 1.2;
}

.stat-value {
    font-weight: 600;
    color: #343a40;
    font-size: 0.9rem;
    line-height: 1.2;
}

/* Progress Container */
.progress-container {
    background: #f8f9fa;
    border-radius: 6px;
    padding: 0.75rem;
    border: 1px solid #e9ecef;
}

.progress-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
}

.progress-label {
    font-size: 0.8rem;
    color: #6c757d;
    font-weight: 500;
}

.progress-percentage {
    font-weight: 600;
    color: #343a40;
    font-size: 0.85rem;
}

.progress-bar-modern {
    height: 6px;
    background: #e9ecef;
    border-radius: 3px;
    overflow: hidden;
}

.progress-fill {
    height: 100%;
    border-radius: 3px;
    transition: width 0.3s ease;
}

.progress-complete {
    background: #28a745;
}

.progress-high {
    background: #007bff;
}

.progress-medium {
    background: #ffc107;
}

.progress-low {
    background: #fd7e14;
}

.progress-none {
    background: #dc3545;
}

/* Card Footer */
.card-footer {
    padding: 1rem 1.25rem;
    background: #f8f9fa;
    border-top: 1px solid #e9ecef;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    margin-top: auto;
}

.action-buttons {
    display: flex;
    gap: 0.5rem;
}

.action-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    font-weight: 500;
    font-size: 0.8rem;
    cursor: pointer;
    transition: all 0.2s ease;
    text-decoration: none;
}

.action-btn.primary {
    background: #007bff;
    color: white;
}

.action-btn.primary:hover {
    background: #0056b3;
}

.action-btn.secondary {
    background: #6c757d;
    color: white;
}

.action-btn.secondary:hover {
    background: #545b62;
}

.action-btn i {
    font-size: 0.75rem;
}

.quick-stats {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.quick-stat {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    color: #6c757d;
    font-size: 0.75rem;
    font-weight: 500;
}

.quick-stat i {
    color: #007bff;
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
        padding: 1rem;
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
        font-size: 0.75rem;
        padding: 0.5rem;
    }

    .card-footer {
        flex-direction: column;
        align-items: stretch;
        gap: 0.75rem;
        padding: 1rem;
    }

    .quick-stats {
        justify-content: center;
    }
}
</style>
