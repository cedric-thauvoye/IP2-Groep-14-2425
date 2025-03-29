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
                    <select v-model="selectedCourse">
                        <option value="">All Courses</option>
                        <option v-for="course in courses" :key="course.id" :value="course.id">
                            {{ course.name }}
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
                            <span class="stat-value">{{ averageScore.toFixed(1) }}</span>
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
                                    <th>Score</th>
                                    <th>Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="result in filteredResults" :key="result.id">
                                    <td>{{ result.studentName }}</td>
                                    <td>{{ result.assessmentTitle }}</td>
                                    <td>{{ result.courseName }}</td>
                                    <td>
                                        <span class="score" :class="getScoreClass(result.score)">
                                            {{ result.score }}/10
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
import { courseService, assessmentService } from '../services/api';

const router = useRouter();
const loading = ref(true);
const selectedCourse = ref('');
const selectedPeriod = ref('all');
const results = ref([]);
const courses = ref([]);

// Mock data for testing
const totalAssessments = computed(() => results.value.length);
const averageScore = computed(() => {
    if (results.value.length === 0) return 0;
    const scores = results.value.map(r => parseFloat(r.score));
    return scores.reduce((a, b) => a + b, 0) / scores.length;
});
const completionRate = computed(() => 85); // Mock data

const filteredResults = computed(() => {
    let filtered = [...results.value];
    if (selectedCourse.value) {
        filtered = filtered.filter(r => r.courseId === parseInt(selectedCourse.value));
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
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

const getScoreClass = (score) => {
    score = parseFloat(score);
    if (score >= 8) return 'excellent';
    if (score >= 6) return 'good';
    return 'needs-improvement';
};

const exportResults = () => {
    const headers = ['Student', 'Assessment', 'Course', 'Score', 'Date'];
    const csvContent = [
        headers.join(','),
        ...filteredResults.value.map(result => [
            result.studentName,
            result.assessmentTitle,
            result.courseName,
            result.score,
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

// Fetch data from API
onMounted(async () => {
    try {
        // Fetch courses for filter dropdown
        const coursesResponse = await courseService.getCourses(true); // teacher courses
        courses.value = coursesResponse.data;

        // We would fetch results from an API endpoint, but for now use mock data
        // In the future, implement an API endpoint for getting all assessment results
        results.value = [
            {
                id: 1,
                studentName: 'Alice Johnson',
                assessmentTitle: 'Web Development Final',
                courseName: 'Web Development',
                courseId: 1,
                score: '8.5',
                date: '2024-01-15'
            },
            {
                id: 2,
                studentName: 'Bob Smith',
                assessmentTitle: 'Database Project',
                courseName: 'Database Design',
                courseId: 3,
                score: '7.2',
                date: '2024-01-20'
            },
            {
                id: 3,
                studentName: 'Charlie Davis',
                assessmentTitle: 'Team Collaboration',
                courseName: 'Project Management',
                courseId: 2,
                score: '9.0',
                date: '2024-01-10'
            }
        ];
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
}

.score.excellent {
    background-color: #d4edda;
    color: #155724;
}

.score.good {
    background-color: #fff3cd;
    color: #856404;
}

.score.needs-improvement {
    background-color: #f8d7da;
    color: #721c24;
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
