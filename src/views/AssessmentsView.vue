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
                                     class="assessment-card"
                                >
                                    <div class="assessment-header">
                                        <h4>{{ assessment.title }}</h4>
                                        <span class="due-date" v-if="activeTab === 'pending'">
                                            Due: {{ formatDate(assessment.dueDate) }}
                                        </span>
                                        <span class="completion-date" v-else>
                                            Completed: {{ formatDate(assessment.completedDate) }}
                                        </span>
                                    </div>

                                    <div class="assessment-content">
                                        <p>{{ assessment.description }}</p>
                                        <div class="completion-stats">
                                            <div class="stats-row">
                                                <span>Responses:</span>
                                                <span class="stat-value">
                                                    {{ assessment.completedCount }}/{{ assessment.totalStudents }}
                                                </span>
                                            </div>
                                            <div class="progress-bar">
                                                <div
                                                    class="progress"
                                                    :style="{ width: (assessment.completedCount / assessment.totalStudents * 100) + '%' }"
                                                ></div>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="assessment-footer">
                                        <button class="view-button" @click="viewResults(assessment.id)">
                                            <i class="fas fa-chart-bar"></i>
                                            View Results
                                        </button>
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
            <div v-else-if="activeTab === 'pending' && pendingAssessments.length > 0" class="assessments-grid">
                <div v-for="assessment in pendingAssessments"
                     :key="assessment.id"
                     class="assessment-card"
                >
                    <div class="assessment-header">
                        <h3>{{ assessment.title }}</h3>
                        <span class="due-date">Due: {{ formatDate(assessment.dueDate) }}</span>
                    </div>
                    <p class="course-name">{{ assessment.courseName }}</p>
                    <div class="assessment-content">
                        <p>{{ assessment.description }}</p>
                        <div class="progress-bar">
                            <div class="progress" :style="{ width: assessment.progress + '%' }"></div>
                        </div>
                        <p class="progress-text">{{ assessment.progress }}% Complete</p>
                    </div>
                    <div class="assessment-footer">
                        <button v-if="isStudent" class="start-button" @click="startAssessment(assessment.id)">
                            Continue Assessment
                        </button>
                        <button v-else class="view-button" @click="viewResults(assessment.id)">
                            View Assessment
                        </button>
                    </div>
                </div>
            </div>

            <div v-else-if="activeTab === 'completed' && completedAssessments.length > 0" class="assessments-grid">
                <div v-for="assessment in completedAssessments"
                     :key="assessment.id"
                     class="assessment-card completed"
                >
                    <div class="assessment-header">
                        <h3>{{ assessment.title }}</h3>
                        <span class="completion-date">Completed: {{ formatDate(assessment.completedDate) }}</span>
                    </div>
                    <p class="course-name">{{ assessment.courseName }}</p>
                    <div class="assessment-content">
                        <p>{{ assessment.description }}</p>
                        <div class="stats">
                            <div class="stat">
                                <span class="label">Score</span>
                                <span class="value">{{ assessment.score }}</span>
                            </div>
                            <div class="stat">
                                <span class="label">Time Spent</span>
                                <span class="value">{{ assessment.timeSpent }}</span>
                            </div>
                        </div>
                    </div>
                    <div class="assessment-footer">
                        <button class="view-button" @click="viewResults(assessment.id)">
                            <i class="fas fa-chart-bar"></i>
                            View Results
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
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
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

.assessments-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
}

.assessment-card {
    background: white;
    border-radius: 10px;
    padding: 1.5rem;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    border: 1px solid #e1e1e1;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.assessment-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.assessment-header h4 {
    margin: 0;
    color: #2c3e50;
    font-size: 1.1rem;
}

.due-date, .completion-date {
    font-size: 0.9rem;
    color: #666;
}

.teacher-assessments {
    margin-top: 2rem;
}

.course-section {
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    margin-bottom: 2rem;
    overflow: hidden;
}

.course-header {
    background-color: #f8f9fa;
    padding: 1.5rem;
    border-bottom: 1px solid #e1e1e1;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.course-header h2 {
    margin: 0;
    color: #2c3e50;
    font-size: 1.5rem;
}

.course-stats {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.group-count {
    background-color: #e1e1e1;
    padding: 0.4rem 0.8rem;
    border-radius: 20px;
    font-size: 0.9rem;
    color: #666;
}

.groups-container {
    padding: 1.5rem;
}

.group-section {
    background-color: #fff;
    border-radius: 8px;
    border: 1px solid #e1e1e1;
    margin-bottom: 1.5rem;
}

.group-header {
    padding: 1rem 1.5rem;
    border-bottom: 1px solid #e1e1e1;
    background-color: #f8f9fa;
}

.group-header h3 {
    margin: 0;
    color: #34495e;
    font-size: 1.2rem;
}

.group-assessments {
    padding: 1.5rem;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
}

.completion-stats {
    margin-top: 1rem;
}

.stats-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
    color: #666;
    font-size: 0.9rem;
}

.stat-value {
    font-weight: 600;
    color: #2c3e50;
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

.assessment-footer {
    margin-top: 1.5rem;
    text-align: right;
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
}

.start-button, .view-button {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    color: white;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.2s ease;
}

.start-button {
    background-color: #3498db;
}

.start-button:hover {
    background-color: #2980b9;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.view-button {
    background-color: #2c3e50;
    position: relative;
    overflow: hidden;
}

.view-button:hover {
    background-color: #34495e;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.view-button:before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
        120deg,
        transparent,
        rgba(255, 255, 255, 0.2),
        transparent
    );
    transition: 0.5s;
}

.view-button:hover:before {
    left: 100%;
}

.view-button i, .start-button i {
    font-size: 1rem;
}
</style>
