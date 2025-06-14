<template>
    <PageLayout>
        <div class="results-container">
            <div class="header">
                <h1>Assessment Results</h1>
                <div class="actions">
                    <button class="action-button" @click="exportResults">
                        <i class="fas fa-file-export"></i> Export Results
                    </button>
                </div>
            </div>

            <div class="filters">
                <div class="filters-grid">
                    <div class="filter-group">
                        <label>Course:</label>
                        <select v-model="selectedCourse" @change="loadGroups">
                            <option value="">All Courses</option>
                            <option v-for="course in courses" :key="course.id" :value="course.id">
                                {{ course.name }}
                            </option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label>Group:</label>
                        <select v-model="selectedGroup">
                            <option value="">All Groups</option>
                            <option v-for="group in availableGroups" :key="group.id" :value="group.id">
                                {{ group.name }}
                            </option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label>Period:</label>
                        <select v-model="selectedPeriod">
                            <option value="all">All Time</option>
                            <option value="month">This Month</option>
                            <option value="semester">This Semester</option>
                        </select>
                    </div>
                </div>
            </div>

            <div v-if="loading" class="loading-state">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading results...</p>
            </div>

            <div v-else class="results-grid">
                <div class="results-card summary">
                    <div class="summary-header">
                        <h2><i class="fas fa-chart-bar"></i> Summary</h2>
                    </div>
                    <div class="summary-stats">
                        <div class="stat-item">
                            <div class="stat-icon">
                                <i class="fas fa-clipboard-list"></i>
                            </div>
                            <div class="stat-content">
                                <span class="stat-value">{{ totalAssessments }}</span>
                                <span class="stat-label">Total Assessments</span>
                            </div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-icon">
                                <i class="fas fa-percentage"></i>
                            </div>
                            <div class="stat-content">
                                <span class="stat-value">{{ averageScore.toFixed(1) }}%</span>
                                <span class="stat-label">Average Score</span>
                            </div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-icon">
                                <i class="fas fa-check-circle"></i>
                            </div>
                            <div class="stat-content">
                                <span class="stat-value">{{ completionRate }}%</span>
                                <span class="stat-label">Completion Rate</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="results-card recent-results">
                    <div class="results-header">
                        <h2><i class="fas fa-table"></i> Recent Results</h2>
                        <div class="results-count" v-if="filteredResults.length > 0">
                            <span>{{ filteredResults.length }} result{{ filteredResults.length !== 1 ? 's' : '' }}</span>
                        </div>
                    </div>

                    <div v-if="filteredResults.length === 0" class="no-results">
                        <i class="fas fa-search"></i>
                        <h3>No Results Found</h3>
                        <p>Try adjusting your filters to see results.</p>
                    </div>

                    <div v-else class="results-table">
                        <div class="table-scroll-hint mobile-only">
                            <i class="fas fa-arrow-right"></i>
                            <span>Swipe to see more details</span>
                        </div>
                        <table>
                            <thead>
                                <tr>
                                    <th class="student-col">Student</th>
                                    <th class="assessment-col">Assessment</th>
                                    <th class="course-col">Course</th>
                                    <th class="group-col">Group</th>
                                    <th class="score-col">Score</th>
                                    <th class="date-col">Date</th>
                                    <th class="actions-col">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="result in filteredResults" :key="`${result.id}-${result.studentId || 'unknown'}`" class="result-row">
                                    <td class="student-col">
                                        <div class="student-info">
                                            <span class="student-name">{{ result.studentName }}</span>
                                        </div>
                                    </td>
                                    <td class="assessment-col">
                                        <div class="assessment-info">
                                            <span class="assessment-title">{{ result.assessmentTitle }}</span>
                                        </div>
                                    </td>
                                    <td class="course-col">{{ result.courseName }}</td>
                                    <td class="group-col">
                                        <span
                                            class="clickable-group"
                                            @click="viewGroupResults(result)"
                                            :title="`View results for ${result.groupName}`"
                                        >
                                            {{ result.groupName }}
                                        </span>
                                    </td>
                                    <td class="score-col">
                                        <span class="score">
                                            {{ formatScoreOnly(result.score, result.maxScore) }}
                                        </span>
                                    </td>
                                    <td class="date-col">{{ formatDate(result.date) }}</td>
                                    <td class="actions-col">
                                        <button class="icon-button" @click="viewDetail(result)" :title="'View details'">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </PageLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import PageLayout from '../components/Layout/PageLayout.vue';
import { courseService, assessmentService, groupService } from '../services/api';

const router = useRouter();
const loading = ref(true);
const selectedCourse = ref('');
const selectedGroup = ref('');
const selectedPeriod = ref('all');
const results = ref([]);
const courses = ref([]);
const availableGroups = ref([]);

// Stats from API data
const totalAssessments = computed(() => {
    const uniqueAssessments = new Set(results.value.map(r => r.id));
    return uniqueAssessments.size;
});

const averageScore = computed(() => {
    if (results.value.length === 0) return 0;

    const validResults = results.value.filter(r => typeof r.score === 'number' && r.maxScore);

    if (validResults.length === 0) return 0;

    const percentages = validResults.map(r => (r.score / r.maxScore) * 100);
    return percentages.reduce((a, b) => a + b, 0) / percentages.length;
});

const completionRate = computed(() => {
    if (results.value.length === 0) return 0;

    const completed = results.value.filter(r => typeof r.score === 'number').length;
    return Math.round((completed / results.value.length) * 100);
});

const filteredResults = computed(() => {
    let filtered = [...results.value];

    if (selectedCourse.value) {
        filtered = filtered.filter(r => r.courseId === parseInt(selectedCourse.value));
    }

    if (selectedGroup.value) {
        filtered = filtered.filter(r => r.groupId === parseInt(selectedGroup.value));
    }

    // Add period filtering logic
    if (selectedPeriod.value === 'month') {
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        filtered = filtered.filter(r => new Date(r.date) >= oneMonthAgo);
    } else if (selectedPeriod.value === 'semester') {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        filtered = filtered.filter(r => new Date(r.date) >= sixMonthsAgo);
    }

    return filtered;
});

const formatDate = (date) => {
    if (!date) return 'N/A';

    try {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch (error) {
        console.error('Error formatting date:', error);
        return date; // Return the original string if parsing fails
    }
};

const formatScoreOnly = (score, maxScore = 20) => {
    if (score === 'N/A' || score === 'Pending' || typeof score !== 'number') {
        return score;
    }
    const percentage = (score / maxScore) * 100;
    return `${percentage.toFixed(1)}%`;
};

const loadGroups = async () => {
    if (!selectedCourse.value) {
        availableGroups.value = [];
        selectedGroup.value = '';
        return;
    }

    try {
        const response = await groupService.getGroups(selectedCourse.value);
        availableGroups.value = response.data;
    } catch (error) {
        console.error('Error loading groups:', error);
        availableGroups.value = [];
    }
};

const exportResults = () => {
    const headers = ['Student', 'Assessment', 'Course', 'Group', 'Score', 'Date'];

    // Escape CSV field to handle commas in data
    const escapeField = (field) => {
        if (field && typeof field === 'string' && (field.includes(',') || field.includes('"'))) {
            return `"${field.replace(/"/g, '""')}"`;
        }
        return field;
    };

    const csvContent = [
        headers.join(','),
        ...filteredResults.value.map(result => [
            escapeField(result.studentName),
            escapeField(result.assessmentTitle),
            escapeField(result.courseName),
            escapeField(result.groupName),
            result.score === 'N/A' || result.score === 'Pending' ? result.score : formatScoreOnly(result.score, result.maxScore),
            formatDate(result.date)
        ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'assessment-results.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

const viewDetail = (result) => {
    // Build query parameters to filter by student
    const query = {};
    if (result.studentId) {
        query.studentId = result.studentId;
    }
    if (result.studentName) {
        query.studentName = result.studentName;
    }

    router.push({
        path: `/assessment/${result.id}/results`,
        query: query
    });
};

const viewGroupResults = (result) => {
    // Navigate to results detail page filtered by group
    const query = {};
    if (result.groupId) {
        query.groupId = result.groupId;
    }
    if (result.groupName) {
        query.groupName = result.groupName;
    }

    router.push({
        path: `/assessment/${result.id}/results`,
        query: query
    });
};

// Helper function to get course ID by name
const getCourseIdByName = (coursesList, courseName) => {
    const course = coursesList.find(c => c.name === courseName);
    return course ? course.id : null;
};

// Fetch data from API
onMounted(async () => {
    try {
        loading.value = true;

        // Fetch courses for filter dropdown
        const coursesResponse = await courseService.getCourses(true); // teacher courses
        courses.value = coursesResponse.data;

        // Fetch completed assessment data
        const completedResponse = await assessmentService.getCompletedAssessments();

        // Create an array to store all individual student results
        const allResults = [];                // Process each assessment
        for (const assessment of completedResponse.data) {
            console.log('Processing assessment:', assessment); // Debug

            // Determine course ID for this assessment
            const courseId = getCourseIdByName(courses.value, assessment.courseName);

            // Get detailed results for this assessment to fetch individual student data
            try {
                const detailResponse = await assessmentService.getAssessmentResults(assessment.id);
                const detailData = detailResponse.data;

                // Get the group ID for this assessment - first try the assessment data itself
                let groupId = null;

                // Check both directly and in detailData for the group ID
                if (assessment.group_id) {
                    groupId = assessment.group_id;
                } else if (detailData && detailData.group_id) {
                    groupId = detailData.group_id;
                }

                // If we couldn't find the group ID from data we have, find groups for this course
                // and match by name if possible
                if (!groupId && courseId && assessment.groupName) {
                    try {
                        const groupsResponse = await groupService.getGroups(courseId);
                        const matchingGroup = groupsResponse.data.find(g => g.name === assessment.groupName);
                        if (matchingGroup) {
                            groupId = matchingGroup.id;
                        }
                    } catch (groupError) {
                        console.error('Error fetching groups for course:', groupError);
                    }
                }

                if (detailData.results && Array.isArray(detailData.results)) {
                    // This is a teacher view with individual student results
                    detailData.results.forEach(studentResult => {
                        // Add each student's result as a separate entry
                        allResults.push({
                            id: assessment.id,
                            studentId: studentResult.student.id,
                            studentName: `${studentResult.student.firstName} ${studentResult.student.lastName}`,
                            studentQNumber: studentResult.student.qNumber,
                            assessmentTitle: detailData.title,
                            courseName: assessment.courseName,
                            courseId: courseId,
                            groupName: assessment.groupName,
                            groupId: groupId,
                            // Format the score correctly - it comes as a string like "8.5"
                            score: studentResult.overallAverage !== 'N/A' ? parseFloat(studentResult.overallAverage) : 'N/A',
                            maxScore: detailData.maxScore || 20, // Get maxScore from assessment details
                            date: assessment.dueDate
                        });
                    });
                } else {
                    // Fallback if detailed results aren't available as expected
                    allResults.push({
                        id: assessment.id,
                        studentName: assessment.studentsCount > 1 ? `${assessment.studentsCount} students` : "1 student",
                        assessmentTitle: assessment.title,
                        courseName: assessment.courseName,
                        courseId: courseId,
                        groupName: assessment.groupName,
                        groupId: groupId,
                        score: 'N/A',
                        maxScore: detailData.maxScore || 20, // Get maxScore from assessment details
                        date: assessment.dueDate
                    });
                }
            } catch (error) {
                console.error(`Error fetching details for assessment ${assessment.id}:`, error);

                // Add minimal data if we couldn't fetch details
                allResults.push({
                    id: assessment.id,
                    studentName: assessment.studentsCount > 1 ? `${assessment.studentsCount} students` : "1 student",
                    assessmentTitle: assessment.title,
                    courseName: assessment.courseName,
                    courseId: courseId,
                    groupName: assessment.groupName,
                    groupId: null,
                    score: 'N/A',
                    maxScore: 20, // Default maxScore when details can't be fetched
                    date: assessment.dueDate
                });
            }
        }

        results.value = allResults;
    } catch (error) {
        console.error('Error loading results data:', error);
    } finally {
        loading.value = false;
    }
});
</script>

<style scoped>
.results-container {
    max-width: 1400px;
    margin: 0 auto;
}

.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
}

/* Mobile responsiveness for header */
@media (max-width: 768px) {
    .header {
        flex-direction: column;
        gap: 1rem;
        margin-bottom: 1.5rem;
        align-items: stretch;
    }

    .actions {
        justify-content: center;
    }

    .action-button {
        width: 100%;
        justify-content: center;
    }
}

@media (max-width: 480px) {
    .header {
        margin-bottom: 1rem;
    }
}

.filters {
    background: white;
    padding: 1.5rem;
    border-radius: 10px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    margin-bottom: 2rem;
}

.filters-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.5rem;
    align-items: end;
}

/* Mobile responsiveness for filters */
@media (max-width: 768px) {
    .filters {
        padding: 1rem;
        margin-bottom: 1.5rem;
    }

    .filters-grid {
        grid-template-columns: 1fr;
        gap: 1rem;
    }
}

@media (max-width: 480px) {
    .filters {
        padding: 0.8rem;
        margin-bottom: 1rem;
    }

    .filters-grid {
        gap: 0.8rem;
    }
}

.filter-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.filter-group label {
    color: #7f8c8d;
    font-weight: 600;
    font-size: 0.9rem;
}

.filter-group select {
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 1rem;
    background: white;
    color: #2c3e50;
    transition: border-color 0.2s ease;
}

.filter-group select:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.1);
}

/* Mobile responsiveness for filter groups */
@media (max-width: 768px) {
    .filter-group {
        gap: 0.4rem;
    }

    .filter-group label {
        font-size: 0.85rem;
    }

    .filter-group select {
        padding: 0.6rem;
        font-size: 0.9rem;
        width: 100%; /* Full width on mobile */
        min-height: 44px; /* Better touch target */
    }
}

@media (max-width: 480px) {
    .filter-group select {
        padding: 0.7rem;
        font-size: 1rem; /* Prevent zoom on iOS */
        height: 48px; /* Even better touch target on small screens */
    }
}

.results-grid {
    display: grid;
    gap: 1.5rem;
}

.results-card {
    background: white;
    border-radius: 10px;
    padding: 1.5rem;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.results-card h2 {
    margin: 0 0 1rem 0;
    color: #ffffff;
    font-size: 1.3rem;
}

/* Mobile responsiveness for results cards */
@media (max-width: 768px) {
    .results-grid {
        gap: 1rem;
    }

    .results-card {
        padding: 1rem;
        border-radius: 8px;
    }

    .results-card h2 {
        font-size: 1.2rem;
        margin-bottom: 0.8rem;
    }
}

@media (max-width: 480px) {
    .results-grid {
        gap: 0.8rem;
    }

    .results-card {
        padding: 0.8rem;
        margin: 0 -0.8rem;
        border-radius: 0;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .results-card:first-child {
        margin-top: 0;
    }

    .results-card h2 {
        font-size: 1.1rem;
    }
}

.summary {
    background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%);
    color: white;
    overflow: hidden;
    position: relative;
}

.summary::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
    animation: pulse 4s ease-in-out infinite;
}

@keyframes pulse {
    0%, 100% { opacity: 0.3; }
    50% { opacity: 0.6; }
}

.summary-header {
    position: relative;
    z-index: 2;
}

.summary-header h2 {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0 0 1.5rem 0;
    font-size: 1.4rem;
    font-weight: 600;
}

.summary-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 1.5rem;
    position: relative;
    z-index: 2;
}

.stat-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    transition: all 0.3s ease;
}

.stat-item:hover {
    background: rgba(255, 255, 255, 0.15);
    transform: translateY(-2px);
}

.stat-icon {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
    flex-shrink: 0;
}

.stat-content {
    flex: 1;
    min-width: 0;
}

.stat-value {
    display: block;
    font-size: 1.8rem;
    font-weight: bold;
    margin-bottom: 0.25rem;
    line-height: 1.2;
}

.stat-label {
    font-size: 0.85rem;
    opacity: 0.9;
    line-height: 1.3;
    word-wrap: break-word;
}

/* Recent Results Styling */
.recent-results {
    position: relative;
}

.results-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    gap: 1rem;
}

.results-header h2 {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0;
    color: #2c3e50;
    font-size: 1.3rem;
    font-weight: 600;
}

.results-count {
    padding: 0.25rem 0.75rem;
    background: #f8f9fa;
    border-radius: 20px;
    font-size: 0.85rem;
    color: #6c757d;
    font-weight: 500;
}

.no-results {
    text-align: center;
    padding: 3rem 2rem;
    color: #7f8c8d;
}

.no-results i {
    font-size: 3rem;
    margin-bottom: 1rem;
    opacity: 0.5;
}

.no-results h3 {
    margin: 0 0 0.5rem 0;
    color: #2c3e50;
    font-weight: 600;
}

.no-results p {
    margin: 0;
    font-size: 0.9rem;
}

.table-scroll-hint {
    display: none;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.6rem 1rem;
    background: #e3f2fd;
    border: 1px solid #bbdefb;
    border-radius: 6px;
    margin-bottom: 1rem;
    font-size: 0.9rem;
    color: #1976d2;
    font-weight: 500;
    width: 100%;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    position: sticky;
    top: 0;
    z-index: 2;
}

.table-scroll-hint i {
    animation: bounce 2s infinite;
}

@keyframes bounce {
    0%, 20%, 50%, 80%, 100% { transform: translateX(0); }
    40% { transform: translateX(4px); }
    60% { transform: translateX(2px); }
}

/* Mobile responsiveness for summary */
@media (max-width: 768px) {
    .summary-header h2 {
        font-size: 1.2rem;
        margin-bottom: 1rem;
    }

    .summary-stats {
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 1rem;
    }

    .stat-item {
        padding: 0.8rem;
        gap: 0.8rem;
    }

    .stat-icon {
        width: 40px;
        height: 40px;
        font-size: 1rem;
    }

    .stat-value {
        font-size: 1.5rem;
    }

    .stat-label {
        font-size: 0.8rem;
    }

    .results-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.8rem;
        margin-bottom: 1rem;
    }

    .results-header h2 {
        font-size: 1.2rem;
    }

    .results-count {
        align-self: flex-end;
    }
}

@media (max-width: 480px) {
    .summary-stats {
        grid-template-columns: 1fr;
        gap: 0.8rem;
    }

    .stat-item {
        padding: 1rem;
        justify-content: center;
        text-align: center;
        flex-direction: column;
        gap: 0.8rem;
    }

    .stat-icon {
        width: 60px;
        height: 60px;
        font-size: 1.5rem;
    }

    .stat-value {
        font-size: 2rem;
    }

    .stat-label {
        font-size: 0.9rem;
    }

    .table-scroll-hint {
        display: flex;
        position: -webkit-sticky; /* For iOS support */
        position: sticky;
        top: 0;
    }

    .no-results {
        padding: 2rem 1rem;
    }

    .no-results i {
        font-size: 2.5rem;
    }
}

.results-table {
    overflow-x: scroll !important; /* Force horizontal scrolling */
    -webkit-overflow-scrolling: touch;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    touch-action: pan-x; /* Better touch handling */
    position: relative; /* Required for sticky to work */
    /* Enhanced touch support */
    scroll-behavior: smooth;
    overscroll-behavior-x: contain;
}

/* Mobile responsiveness for table */
@media (max-width: 768px) {
    .results-table {
        margin: 0 -1rem;
        border-radius: 0;
    }

    table {
        min-width: 650px;
        font-size: 0.9rem;
    }

    th, td {
        padding: 0.8rem 0.5rem;
        white-space: nowrap;
    }

    th:first-child, td:first-child {
        padding-left: 1rem;
        position: sticky;
        left: 0;
        background-color: #fff; /* Match background color */
        z-index: 1; /* Ensure it's above other cells */
        box-shadow: 2px 0 5px rgba(0,0,0,0.1); /* Add shadow for depth */
    }

    th:last-child, td:last-child {
        padding-right: 1rem;
    }

    /* Hide less important columns on smaller screens */
    th:nth-child(3), td:nth-child(3) { /* Course column */
        display: none;
    }
}

@media (max-width: 480px) {
    .results-table {
        margin: 0 -0.8rem;
    }

    table {
        min-width: 500px;
        font-size: 0.8rem;
    }

    th, td {
        padding: 0.6rem 0.4rem;
    }

    th:first-child, td:first-child {
        padding-left: 0.8rem;
        position: sticky;
        left: 0;
        background-color: #fff; /* For normal cells */
        z-index: 1; /* Ensure it's above other cells */
    }

    /* Need to override the background color for header */
    th:first-child {
        background-color: #f8f9fa;
    }

    th:last-child, td:last-child {
        padding-right: 0.8rem;
    }

    /* Hide more columns on very small screens */
    th:nth-child(6), td:nth-child(6) { /* Date column */
        display: none;
    }

    .stat-value {
        font-size: 1.4rem;
    }

    .stat-label {
        font-size: 0.75rem;
    }
}

table {
    width: max-content; /* Ensure table takes up needed space for all columns */
    min-width: 100%;    /* But fills container at minimum */
    border-collapse: collapse;
    margin-top: 1rem;
}

th {
    background-color: #f8f9fa;
    padding: 1rem;
    text-align: left;
    font-weight: 600;
    color: #2c3e50;
    position: sticky;
    top: 0;
    z-index: 2; /* Higher than the sticky column */
    box-shadow: 0 1px 0 rgba(0,0,0,0.1); /* Subtle shadow for depth */
}

td {
    padding: 1rem;
    border-bottom: 1px solid #eee;
    vertical-align: middle;
    transition: background-color 0.15s ease;
}

.score {
    font-weight: 600;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    background-color: #f8f9fa;
    color: #2c3e50;
}

.action-button {
    background-color: #27ae60;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.2s ease;
    font-weight: 500;
}

.action-button:hover {
    background-color: #219a52;
    transform: translateY(-1px);
}

.icon-button {
    background: none;
    border: none;
    color: #3498db;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 4px;
    transition: all 0.2s ease;
    min-width: 36px;
    min-height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.icon-button:hover {
    background-color: #f0f8ff;
    color: #2980b9;
}

.clickable-group {
    color: #3498db;
    cursor: pointer;
    text-decoration: none;
    transition: all 0.2s ease;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    display: inline-block;
    word-break: break-word;
}

.clickable-group:hover {
    background-color: #f0f8ff;
    text-decoration: underline;
    color: #2980b9;
}

.score {
    font-weight: 600;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    background-color: #f8f9fa;
    color: #2c3e50;
    white-space: nowrap;
}

/* Mobile responsiveness for interactive elements */
@media (max-width: 768px) {
    .action-button {
        padding: 0.6rem 1.2rem;
        font-size: 0.9rem;
    }

    .icon-button {
        min-width: 40px;
        min-height: 40px;
        padding: 0.6rem;
    }

    .clickable-group {
        padding: 0.3rem 0.4rem;
        font-size: 0.9rem;
    }

    .score {
        padding: 0.2rem 0.4rem;
        font-size: 0.85rem;
    }
}

@media (max-width: 480px) {
    .action-button {
        padding: 0.7rem 1rem;
        font-size: 0.9rem;
        width: 100%;
        justify-content: center;
    }

    .icon-button {
        min-width: 44px;
        min-height: 44px;
        padding: 0.7rem;
    }

    .clickable-group, .score {
        font-size: 0.8rem;
    }
}

.loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 2rem;
    color: #7f8c8d;
    text-align: center;
}

.loading-state i {
    font-size: 2rem;
    margin-bottom: 1rem;
}

.loading-state p {
    margin: 0;
    font-size: 1rem;
}

/* Mobile responsiveness for loading state */
@media (max-width: 768px) {
    .loading-state {
        padding: 2rem 1rem;
    }

    .loading-state i {
        font-size: 1.8rem;
    }

    .loading-state p {
        font-size: 0.9rem;
    }
}

@media (max-width: 480px) {
    .loading-state {
        padding: 1.5rem 0.8rem;
    }

    .loading-state i {
        font-size: 1.6rem;
    }

    .loading-state p {
        font-size: 0.85rem;
    }
}

/* Container responsiveness */
@media (max-width: 480px) {
    .results-container {
        padding: 0;
    }
}

/* Custom scrollbar for better visibility on mobile */
.results-table::-webkit-scrollbar {
    height: 8px;
    width: 8px;
}

.results-table::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
}

.results-table::-webkit-scrollbar-thumb {
    background: #bbb;
    border-radius: 4px;
}

.results-table::-webkit-scrollbar-thumb:hover {
    background: #999;
}

/* Row hover effect */
tr.result-row:hover {
    background-color: rgba(240, 248, 255, 0.5);
}

/* Student and assessment info */
.student-info, .assessment-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.student-name, .assessment-title {
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 150px;
}

@media (max-width: 768px) {
    .student-name, .assessment-title {
        max-width: 120px;
    }
}

@media (max-width: 480px) {
    .student-name, .assessment-title {
        max-width: 110px;
        font-size: 0.85rem;
    }
}

/* For Firefox */
.results-table {
    scrollbar-width: thin;
    scrollbar-color: #bbb #f1f1f1;
}
</style>
