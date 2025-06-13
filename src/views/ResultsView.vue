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

            <div v-if="loading" class="loading-state">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading results...</p>
            </div>

            <div v-else class="results-grid">
                <div class="results-card summary">
                    <h2>Summary</h2>
                    <div class="summary-stats">
                        <div class="stat-item">
                            <span class="stat-value">{{ totalAssessments }}</span>
                            <span class="stat-label">Total Assessments</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value">{{ averageScore.toFixed(1) }}%</span>
                            <span class="stat-label">Average Score</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value">{{ completionRate }}%</span>
                            <span class="stat-label">Completion Rate</span>
                        </div>
                    </div>
                </div>

                <div class="results-card">
                    <h2>Recent Results</h2>
                    <div class="results-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>Assessment</th>
                                    <th>Course</th>
                                    <th>Group</th>
                                    <th>Score</th>
                                    <th>Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="result in filteredResults" :key="`${result.id}-${result.studentId || 'unknown'}`">
                                    <td>{{ result.studentName }}</td>
                                    <td>{{ result.assessmentTitle }}</td>
                                    <td>{{ result.courseName }}</td>
                                    <td>{{ result.groupName }}</td>
                                    <td>
                                        <span class="score">
                                            {{ formatScoreOnly(result.score, result.maxScore) }}
                                        </span>
                                    </td>
                                    <td>{{ formatDate(result.date) }}</td>
                                    <td>
                                        <button class="icon-button" @click="viewDetail(result.id)">
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

const viewDetail = (id) => {
    router.push(`/assessment/${id}/results`);
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

.filters {
    background: white;
    padding: 1.5rem;
    border-radius: 10px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    margin-bottom: 2rem;
}

.filter-group {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.filter-group label {
    min-width: 80px;
    color: #7f8c8d;
}

.filter-group select {
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 5px;
    width: 200px;
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

.summary {
    background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%);
    color: white;
}

.summary-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 2rem;
    margin-top: 1.5rem;
}

.stat-item {
    text-align: center;
}

.stat-value {
    display: block;
    font-size: 2rem;
    font-weight: bold;
    margin-bottom: 0.5rem;
}

.stat-label {
    font-size: 0.9rem;
    opacity: 0.9;
}

.results-table {
    overflow-x: auto;
}

table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 1rem;
}

th {
    background-color: #f8f9fa;
    padding: 1rem;
    text-align: left;
    font-weight: 600;
    color: #2c3e50;
}

td {
    padding: 1rem;
    border-bottom: 1px solid #eee;
}

.score {
    font-weight: 600;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    background-color: #f8f9fa;
    color: #2c3e50;
}

.icon-button {
    background: none;
    border: none;
    color: #3498db;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 4px;
    transition: background-color 0.2s;
}

.icon-button:hover {
    background-color: #f8f9fa;
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
    transition: background-color 0.2s;
}

.action-button:hover {
    background-color: #219a52;
}

.loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    color: #7f8c8d;
}

@media (max-width: 768px) {
    .header {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
    }

    .filters {
        flex-direction: column;
        gap: 1rem;
    }

    .filter-group {
        flex-direction: column;
        align-items: flex-start;
    }

    .filter-group select {
        width: 100%;
    }

    .summary-stats {
        grid-template-columns: 1fr;
        gap: 1rem;
    }
}
</style>
