<template>
    <PageLayout>
        <div class="admin-dashboard">
            <h1>Admin Dashboard</h1>

            <!-- Admin Navigation -->
            <div class="admin-nav">
                <div class="nav-pills">
                    <button class="nav-pill" :class="{ active: activeTab === 'overview' }" @click="activeTab = 'overview'">
                        <i class="fas fa-th-large"></i> Overview
                    </button>
                    <button class="nav-pill" :class="{ active: activeTab === 'courses' }" @click="activeTab = 'courses'">
                        <i class="fas fa-book"></i> Courses
                    </button>
                    <button class="nav-pill" :class="{ active: activeTab === 'groups' }" @click="activeTab = 'groups'">
                        <i class="fas fa-users"></i> Groups
                    </button>
                    <button class="nav-pill" :class="{ active: activeTab === 'users' }" @click="activeTab = 'users'">
                        <i class="fas fa-user"></i> Users
                    </button>
                </div>
            </div>

            <!-- Overview Tab -->
            <div v-if="activeTab === 'overview'" class="admin-section">
                <div class="overview-stats">
                    <div class="stat-card">
                        <i class="fas fa-users"></i>
                        <div class="stat-content">
                            <h3>Total Users</h3>
                            <p class="stat-number">{{ stats.totalUsers }}</p>
                            <div class="stat-breakdown">
                                <span>{{ stats.studentCount }} Students</span>
                                <span>{{ stats.teacherCount }} Teachers</span>
                                <span>{{ stats.adminCount }} Admins</span>
                            </div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <i class="fas fa-book"></i>
                        <div class="stat-content">
                            <h3>Total Courses</h3>
                            <p class="stat-number">{{ stats.courseCount }}</p>
                            <div class="stat-breakdown">
                                <span>{{ stats.activeCoursesCount }} Active</span>
                            </div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <i class="fas fa-users"></i>
                        <div class="stat-content">
                            <h3>Total Groups</h3>
                            <p class="stat-number">{{ stats.groupCount }}</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <i class="fas fa-tasks"></i>
                        <div class="stat-content">
                            <h3>Assessments</h3>
                            <p class="stat-number">{{ stats.assessmentCount }}</p>
                            <div class="stat-breakdown">
                                <span>{{ stats.activeAssessmentsCount }} Active</span>
                                <span>{{ stats.completedAssessmentsCount }} Completed</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Courses Tab -->
            <div v-if="activeTab === 'courses'" class="admin-section">
                <div class="section-header">
                    <h2>All Courses</h2>
                    <div class="controls">
                        <div class="search-box">
                            <i class="fas fa-search"></i>
                            <input type="text" v-model="courseFilters.search" placeholder="Search courses..." @input="filterCourses" />
                        </div>
                        <select v-model="courseFilters.status" @change="filterCourses">
                            <option value="all">All Statuses</option>
                            <option value="active">Active</option>
                            <option value="archived">Archived</option>
                        </select>
                        <button class="add-button" @click="showCourseModal = true"><i class="fas fa-plus"></i> Add Course</button>
                    </div>
                </div>

                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Code</th>
                            <th>Students</th>
                            <th>Teachers</th>
                            <th>Groups</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="course in filteredCourses" :key="course.id">
                            <td>{{ course.name }}</td>
                            <td>{{ course.code }}</td>
                            <td>{{ course.studentCount || 0 }}</td>
                            <td>{{ course.teacherCount || 0 }}</td>
                            <td>{{ course.groupCount || 0 }}</td>
                            <td>
                                <span class="status-badge" :class="course.status">
                                    {{ course.status.charAt(0).toUpperCase() + course.status.slice(1) }}
                                </span>
                            </td>
                            <td class="actions">
                                <button class="action-button view" @click="viewCourse(course.id)">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button class="action-button edit" @click="editCourse(course)">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="action-button delete" @click="confirmDeleteCourse(course)">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>

                <div v-if="filteredCourses.length === 0" class="empty-state">
                    <i class="fas fa-book"></i>
                    <h3>No courses found</h3>
                    <p>Try adjusting your search criteria or create a new course</p>
                </div>
            </div>

            <!-- Groups Tab -->
            <div v-if="activeTab === 'groups'" class="admin-section">
                <div class="section-header">
                    <h2>All Groups</h2>
                    <div class="controls">
                        <div class="search-box">
                            <i class="fas fa-search"></i>
                            <input type="text" v-model="groupFilters.search" placeholder="Search groups..." @input="filterGroups" />
                        </div>
                        <select v-model="groupFilters.course" @change="filterGroups">
                            <option value="all">All Courses</option>
                            <option v-for="course in courses" :key="course.id" :value="course.id">
                                {{ course.name }}
                            </option>
                        </select>
                        <button class="add-button" @click="showGroupModal = true"><i class="fas fa-plus"></i> Add Group</button>
                    </div>
                </div>

                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Course</th>
                            <th>Students</th>
                            <th>Assessments</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="group in filteredGroups" :key="group.id">
                            <td>{{ group.name }}</td>
                            <td>
                                <router-link :to="`/course/${group.course_id}`" class="course-link">
                                    {{ group.course_name }}
                                </router-link>
                            </td>
                            <td>{{ group.student_count || 0 }}</td>
                            <td>{{ group.assessment_count || 0 }}</td>
                            <td class="actions">
                                <button class="action-button view" @click="viewGroup(group.id)">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button class="action-button edit" @click="editGroup(group)">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="action-button delete" @click="confirmDeleteGroup(group)">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>

                <div v-if="filteredGroups.length === 0" class="empty-state">
                    <i class="fas fa-users"></i>
                    <h3>No groups found</h3>
                    <p>Try adjusting your search criteria or create a new group</p>
                </div>
            </div>

            <!-- Users Tab -->
            <div v-if="activeTab === 'users'" class="admin-section">
                <div class="section-header">
                    <h2>All Users</h2>
                    <div class="controls">
                        <div class="search-box">
                            <i class="fas fa-search"></i>
                            <input type="text" v-model="userFilters.search" placeholder="Search users..." @input="filterUsers" />
                        </div>
                        <select v-model="userFilters.role" @change="filterUsers">
                            <option value="all">All Roles</option>
                            <option value="student">Students</option>
                            <option value="teacher">Teachers</option>
                            <option value="admin">Admins</option>
                        </select>
                        <button class="add-button" @click="showUserModal = true"><i class="fas fa-plus"></i> Add User</button>
                    </div>
                </div>

                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Courses</th>
                            <th>Groups</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="user in filteredUsers" :key="user.id">
                            <td>{{ user.first_name }} {{ user.last_name }}</td>
                            <td>{{ user.email }}</td>
                            <td>
                                <span class="role-badge" :class="user.role">
                                    {{ user.role.charAt(0).toUpperCase() + user.role.slice(1) }}
                                </span>
                            </td>
                            <td>{{ user.courseCount || 0 }}</td>
                            <td>{{ user.groupCount || 0 }}</td>
                            <td class="actions">
                                <button class="action-button view" @click="viewUser(user.id)">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button class="action-button edit" @click="editUser(user)">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="action-button delete" @click="confirmDeleteUser(user)">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>

                <div v-if="filteredUsers.length === 0" class="empty-state">
                    <i class="fas fa-user"></i>
                    <h3>No users found</h3>
                    <p>Try adjusting your search criteria or add a new user</p>
                </div>
            </div>

            <!-- Edit Course Modal -->
            <div v-if="showEditCourseModal && editingCourse" class="modal-overlay">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>Edit Course</h2>
                        <button class="close-button" @click="showEditCourseModal = false">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <form @submit.prevent="saveEditedCourse">
                            <div class="form-group">
                                <label for="course-name">Course Name</label>
                                <input type="text" id="course-name" v-model="editingCourse.name" required />
                            </div>
                            <div class="form-group">
                                <label for="course-code">Course Code</label>
                                <input type="text" id="course-code" v-model="editingCourse.code" required />
                            </div>
                            <div class="form-group">
                                <label for="course-description">Description</label>
                                <textarea id="course-description" v-model="editingCourse.description" rows="4"></textarea>
                            </div>
                            <div class="form-group">
                                <label for="course-status">Status</label>
                                <select id="course-status" v-model="editingCourse.status">
                                    <option value="active">Active</option>
                                    <option value="archived">Archived</option>
                                </select>
                            </div>
                            <div class="form-actions">
                                <button type="button" class="cancel-button" @click="showEditCourseModal = false">Cancel</button>
                                <button type="submit" class="save-button">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            <!-- Edit Group Modal -->
            <div v-if="showEditGroupModal && editingGroup" class="modal-overlay">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>Edit Group</h2>
                        <button class="close-button" @click="showEditGroupModal = false">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <form @submit.prevent="saveEditedGroup">
                            <div class="form-group">
                                <label for="group-name">Group Name</label>
                                <input type="text" id="group-name" v-model="editingGroup.name" required />
                            </div>
                            <div class="form-group">
                                <label for="group-course">Course</label>
                                <select id="group-course" v-model="editingGroup.course_id">
                                    <option v-for="course in courses" :key="course.id" :value="course.id">
                                        {{ course.name }}
                                    </option>
                                </select>
                            </div>
                            <div class="form-actions">
                                <button type="button" class="cancel-button" @click="showEditGroupModal = false">Cancel</button>
                                <button type="submit" class="save-button">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            <!-- Edit User Modal -->
            <div v-if="showEditUserModal && editingUser" class="modal-overlay">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>Edit User</h2>
                        <button class="close-button" @click="showEditUserModal = false">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <form @submit.prevent="saveEditedUser">
                            <div class="form-group">
                                <label for="first-name">First Name</label>
                                <input type="text" id="first-name" v-model="editingUser.first_name" required />
                            </div>
                            <div class="form-group">
                                <label for="last-name">Last Name</label>
                                <input type="text" id="last-name" v-model="editingUser.last_name" required />
                            </div>
                            <div class="form-group">
                                <label for="email">Email</label>
                                <input type="email" id="email" v-model="editingUser.email" required />
                            </div>
                            <div class="form-group">
                                <label for="role">Role</label>
                                <select id="role" v-model="editingUser.role" required>
                                    <option value="student">Student</option>
                                    <option value="teacher">Teacher</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <div v-if="editingUser.role === 'student'" class="form-group">
                                <label for="q-number">Q-Number</label>
                                <input type="text" id="q-number" v-model="editingUser.q_number" required />
                            </div>
                            <div class="form-actions">
                                <button type="button" class="cancel-button" @click="showEditUserModal = false">Cancel</button>
                                <button type="submit" class="save-button">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            <!-- Delete Confirmation Modal -->
            <div v-if="showDeleteModal" class="modal-overlay show">
                <div class="modal-content confirmation-modal">
                    <div class="modal-header">
                        <h2>Confirm Deletion</h2>
                        <button class="close-button" @click="showDeleteModal = false">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="warning-icon">
                            <i class="fas fa-exclamation-triangle"></i>
                        </div>
                        <p class="confirmation-text">{{ deleteMessage }}</p>
                        <p class="permanent-note">This action cannot be undone.</p>
                        <div class="security-verification">
                            <label for="admin-password">Admin Password:</label>
                            <input type="password" id="admin-password" v-model="adminPassword" placeholder="Enter your password to confirm" />
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="cancel-button" @click="showDeleteModal = false">Cancel</button>
                        <button class="confirm-button" :disabled="!adminPassword" @click="performDelete">Confirm Delete</button>
                    </div>
                </div>
            </div>
        </div>
        <!-- Add User Modal -->
        <div v-if="showUserModal" class="modal-overlay">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Add New User</h2>
                    <button class="close-button" @click="showUserModal = false">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <StudentDetailView @close="showUserModal = false" @created="fetchData" />
                </div>
            </div>
        </div>
    </PageLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import PageLayout from '../components/Layout/PageLayout.vue';
import { courseService, groupService, authService, userService } from '../services/api';
import notificationStore from '../stores/notificationStore';
import StudentDetailView from '@/views/StudentDetailView.vue';
import { assessmentService } from '../services/api';

const router = useRouter();
const activeTab = ref('overview');

// Stats data
const stats = ref({
    totalUsers: 0,
    studentCount: 0,
    teacherCount: 0,
    adminCount: 0,
    courseCount: 0,
    activeCoursesCount: 0,
    groupCount: 0,
    assessmentCount: 0,
    activeAssessmentsCount: 0,
    completedAssessmentsCount: 0
});

// Data arrays
const courses = ref([]);
const groups = ref([]);
const users = ref([]);

// Filters
const courseFilters = ref({ search: '', status: 'all' });
const groupFilters = ref({ search: '', course: 'all' });
const userFilters = ref({ search: '', role: 'all' });

// Filtered data
const filteredCourses = ref([]);
const filteredGroups = ref([]);
const filteredUsers = ref([]);

// Modal states
const showCourseModal = ref(false);
const showGroupModal = ref(false);
const showUserModal = ref(false);
const showDeleteModal = ref(false);
const showEditCourseModal = ref(false);
const showEditGroupModal = ref(false);
const showEditUserModal = ref(false);

// Edit operation state
const editingCourse = ref(null);
const editingGroup = ref(null);
const editingUser = ref(null);

// Delete operation state
const deleteType = ref('');
const deleteObject = ref(null);
const deleteMessage = ref('');
const adminPassword = ref('');

// Filter functions
const filterCourses = () => {
    const searchTerm = courseFilters.value.search.toLowerCase();
    const statusFilter = courseFilters.value.status;

    filteredCourses.value = courses.value.filter((course) => {
        const matchesSearch = course.name.toLowerCase().includes(searchTerm) || course.code.toLowerCase().includes(searchTerm);
        const matchesStatus = statusFilter === 'all' || course.status === statusFilter;

        return matchesSearch && matchesStatus;
    });
};

const filterGroups = () => {
    const searchTerm = groupFilters.value.search.toLowerCase();
    const courseFilter = groupFilters.value.course;

    filteredGroups.value = groups.value.filter((group) => {
        const matchesSearch = group.name.toLowerCase().includes(searchTerm) || group.course_name.toLowerCase().includes(searchTerm);
        const matchesCourse = courseFilter === 'all' || group.course_id === parseInt(courseFilter);

        return matchesSearch && matchesCourse;
    });
};

const filterUsers = () => {
    const searchTerm = userFilters.value.search.toLowerCase();
    const roleFilter = userFilters.value.role;

    filteredUsers.value = users.value.filter((user) => {
        const matchesSearch =
            user.first_name.toLowerCase().includes(searchTerm) ||
            user.last_name.toLowerCase().includes(searchTerm) ||
            user.email.toLowerCase().includes(searchTerm);
        const matchesRole = roleFilter === 'all' || user.role === roleFilter;

        return matchesSearch && matchesRole;
    });
};

// View details
const viewCourse = (id) => {
    router.push(`/course/${id}`);
};

const viewGroup = (id) => {
    router.push(`/group/${id}`);
};

const viewUser = (id) => {
    router.push(`/user/${id}`);
};

// Edit functions
const editCourse = (course) => {
    editingCourse.value = { ...course };
    showEditCourseModal.value = true;
};

const editGroup = (group) => {
    editingGroup.value = { ...group };
    showEditGroupModal.value = true;
};

const editUser = (user) => {
    editingUser.value = { ...user };
    showEditUserModal.value = true;
};

// Save edited data
const saveEditedCourse = async () => {
    try {
        await courseService.updateCourse(editingCourse.value.id, editingCourse.value);
        const index = courses.value.findIndex((c) => c.id === editingCourse.value.id);
        if (index !== -1) {
            courses.value[index] = { ...editingCourse.value };
            filterCourses();
        }
        showEditCourseModal.value = false;
        editingCourse.value = null;
    } catch (error) {
        console.error('Error saving edited course:', error);
    }
};

const saveEditedGroup = async () => {
    try {
        await groupService.updateGroup(editingGroup.value.id, editingGroup.value);
        const index = groups.value.findIndex((g) => g.id === editingGroup.value.id);
        if (index !== -1) {
            groups.value[index] = { ...editingGroup.value };
            filterGroups();
        }
        showEditGroupModal.value = false;
        editingGroup.value = null;
    } catch (error) {
        console.error('Error saving edited group:', error);
    }
};

const saveEditedUser = async () => {
    try {
        await userService.updateUser(editingUser.value.id, editingUser.value);
        const index = users.value.findIndex((u) => u.id === editingUser.value.id);
        if (index !== -1) {
            users.value[index] = { ...editingUser.value };
            filterUsers();
        }
        showEditUserModal.value = false;
        editingUser.value = null;
    } catch (error) {
        console.error('Error saving edited user:', error);
    }
};

// Delete confirmation
const confirmDeleteCourse = (course) => {
    deleteType.value = 'course';
    deleteObject.value = course;
    deleteMessage.value = `Are you sure you want to delete the course "${course.name}"?`;
    showDeleteModal.value = true;
    adminPassword.value = '';
};

const confirmDeleteGroup = (group) => {
    deleteType.value = 'group';
    deleteObject.value = group;
    deleteMessage.value = `Are you sure you want to delete the group "${group.name}"?`;
    showDeleteModal.value = true;
    adminPassword.value = '';
};

const confirmDeleteUser = (user) => {
    deleteType.value = 'user';
    deleteObject.value = user;
    deleteMessage.value = `Are you sure you want to delete the user "${user.first_name} ${user.last_name}"?`;
    showDeleteModal.value = true;
    adminPassword.value = '';
};

// Perform delete after confirmation
const performDelete = async () => {
    try {
        // Verify admin password first
        const verification = await authService.verifyPassword(adminPassword.value);
        if (!verification.data.valid) {
            notificationStore.error('Incorrect password. Delete operation cancelled.');
            return;
        }

        // Perform the deletion based on type
        switch (deleteType.value) {
            case 'course':
                await courseService.deleteCourse(deleteObject.value.id);
                courses.value = courses.value.filter((c) => c.id !== deleteObject.value.id);
                filterCourses();
                break;
            case 'group':
                await groupService.deleteGroup(deleteObject.value.id);
                groups.value = groups.value.filter((g) => g.id !== deleteObject.value.id);
                filterGroups();
                break;
            case 'user':
                await userService.deleteUser(deleteObject.value.id);
                users.value = users.value.filter((u) => u.id !== deleteObject.value.id);
                filterUsers();
                break;
        }

        // Store the type before clearing state
        const deletedType = deleteType.value;

        // Reset and close modal
        showDeleteModal.value = false;
        deleteObject.value = null;
        deleteType.value = '';
        deleteMessage.value = '';
        adminPassword.value = '';

        // Update stats after deletion
        fetchStats();
        notificationStore.success(`${deletedType} was successfully deleted.`);
    } catch (error) {
        console.error('Error performing delete:', error);
        notificationStore.error(`Error deleting ${deleteType.value}: ${error.message}`);
    }
};

// Fetch data from API
const fetchStats = async () => {
    try {
        // In a real implementation, you would have an API endpoint for admin stats
        // For now, we'll compute from our loaded data
        const [pendingResponse, completedResponse] = await Promise.all([
            assessmentService.getPendingAssessments(),
            assessmentService.getCompletedAssessments()
        ]);

        const pendingCount = pendingResponse.data.length;
        const completedCount = completedResponse.data.length;

        stats.value = {
            totalUsers: users.value.length,
            studentCount: users.value.filter((u) => u.role === 'student').length,
            teacherCount: users.value.filter((u) => u.role === 'teacher').length,
            adminCount: users.value.filter((u) => u.role === 'admin').length,
            courseCount: courses.value.length,
            activeCoursesCount: courses.value.filter((c) => c.status === 'active').length,
            groupCount: groups.value.length,
            assessmentCount: pendingCount + completedCount,
            activeAssessmentsCount: pendingCount,
            completedAssessmentsCount: completedCount
        };
    } catch (error) {
        console.error('Error fetching stats:', error);
    }
};

// Fetch all necessary data
const fetchData = async () => {
    try {
        // Check if user is an admin - add more verbose logging
        console.log('AdminDashboard: Checking if user is admin');
        const roleResponse = await authService.checkUserRole();
        console.log('AdminDashboard: User role response:', roleResponse.data);

        if (roleResponse.data.role !== 'admin') {
            console.log('AdminDashboard: User is not admin, redirecting to home');
            router.push('/home');
            return;
        }

        console.log('AdminDashboard: User is admin, loading data');

        // Fetch courses with admin=true parameter to get all courses
        const coursesResponse = await courseService.getCourses(true);
        console.log('Admin: Courses data received:', coursesResponse.data);
        courses.value = coursesResponse.data.map((course) => ({
            ...course,
            status: course.status || 'active', // Default to active if status not provided
            studentCount: course.student_count || 0,
            teacherCount: course.teacher_count || 0,
            groupCount: course.group_count || 0
        }));
        filteredCourses.value = [...courses.value];

        // Fetch all groups (admin parameter to get all groups)
        const groupsResponse = await groupService.getGroups();
        console.log('Admin: Groups data received:', groupsResponse.data);
        groups.value = groupsResponse.data;
        filteredGroups.value = [...groups.value];

        // Fetch all users
        try {
            const usersResponse = await userService.getAllUsers();
            console.log('Admin: Users data received:', usersResponse.data);
            users.value = usersResponse.data.map((user) => ({
                ...user,
                courseCount: user.course_count || 0,
                groupCount: user.group_count || 0
            }));
            filteredUsers.value = [...users.value];
        } catch (error) {
            console.error('Error fetching all users:', error);
        }

        // Update stats based on fetched data
        fetchStats();
    } catch (error) {
        console.error('Error fetching data:', error);
    }
};

onMounted(() => {
    fetchData();
});
</script>

<style scoped>
.admin-dashboard {
    max-width: 1400px;
    margin: 0 auto;
}

.admin-nav {
    margin: 1.5rem 0;
}

.nav-pills {
    display: flex;
    gap: 0.5rem;
    background: white;
    padding: 0.5rem;
    border-radius: 10px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.nav-pill {
    background: none;
    border: none;
    padding: 0.75rem 1.5rem;
    cursor: pointer;
    border-radius: 8px;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: background-color 0.2s;
}

.nav-pill.active {
    background: #3498db;
    color: white;
}

.admin-section {
    margin-top: 2rem;
}

.overview-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
}

.stat-card {
    background: white;
    padding: 1.5rem;
    border-radius: 10px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
}

.stat-card i {
    font-size: 2.5rem;
    color: #3498db;
    margin-right: 1.5rem;
}

.stat-content h3 {
    margin: 0;
    font-size: 1rem;
    color: #2c3e50;
}

.stat-number {
    font-size: 2rem;
    font-weight: bold;
    margin: 0.5rem 0;
}

.stat-breakdown {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    font-size: 0.8rem;
    color: #7f8c8d;
}

.recent-activity {
    background: white;
    border-radius: 10px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    padding: 1.5rem;
}

.activity-list {
    margin-top: 1rem;
}

.activity-item {
    display: flex;
    padding: 1rem 0;
    border-bottom: 1px solid #eee;
}

.activity-icon {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: #ebf5fb;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 1rem;
}

.activity-icon.user i {
    color: #3498db;
}
.activity-icon.course i {
    color: #2ecc71;
}
.activity-icon.group i {
    color: #f39c12;
}
.activity-icon.assessment i {
    color: #9b59b6;
}

.activity-content {
    flex: 1;
}

.activity-text {
    margin: 0;
}

.activity-time {
    font-size: 0.8rem;
    color: #7f8c8d;
}

.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
    gap: 1rem;
}

.controls {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
}

.search-box {
    position: relative;
}

.search-box i {
    position: absolute;
    left: 10px;
    top: 50%;
    transform: translateY(-50%);
    color: #7f8c8d;
}

.search-box input {
    padding: 0.5rem 0.5rem 0.5rem 2.5rem;
    border: 1px solid #ddd;
    border-radius: 6px;
    min-width: 200px;
}

.controls select {
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 6px;
}

.add-button {
    background: #2ecc71;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.data-table {
    width: 100%;
    border-collapse: collapse;
    background: white;
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.data-table th,
.data-table td {
    padding: 1rem;
    text-align: left;
}

.data-table th {
    background: #f9f9f9;
    font-weight: 600;
    color: #2c3e50;
}

.data-table tr:not(:last-child) td {
    border-bottom: 1px solid #eee;
}

.status-badge,
.role-badge {
    font-weight: 600;
    font-size: 0.8rem;
    border-radius: 20px;
    padding: 0.25rem 0.75rem;
}

.status-badge.active {
    background: #d4edda;
    color: #155724;
}

.status-badge.archived {
    background: #f8d7da;
    color: #721c24;
}

.role-badge.student {
    background: #cce5ff;
    color: #004085;
}

.role-badge.teacher {
    background: #d4edda;
    color: #155724;
}

.role-badge.admin {
    background: #d6d8d9;
    color: #1b1e21;
}

.actions {
    white-space: nowrap;
}

.action-button {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 4px;
    transition: all 0.2s;
}

.action-button.view:hover {
    background: #ebf5fb;
    color: #3498db;
}

.action-button.edit:hover {
    background: #fef9e7;
    color: #f39c12;
}

.action-button.delete:hover {
    background: #fadbd8;
    color: #e74c3c;
}

.empty-state {
    text-align: center;
    padding: 2rem;
    background: white;
    border-radius: 10px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.empty-state i {
    font-size: 2rem;
    margin-bottom: 1rem;
}

.empty-state h3 {
    font-weight: 600;
    margin-bottom: 0.5rem;
}

.empty-state p {
    color: #7f8c8d;
}

.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.modal-content {
    background: white;
    border-radius: 10px;
    width: 500px;
    max-width: 90%;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
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
    color: #2c3e50;
}

.close-button {
    background: none;
    border: none;
    font-size: 1.2rem;
    cursor: pointer;
    color: #7f8c8d;
    transition: color 0.2s;
}

.close-button:hover {
    color: #e74c3c;
}

.modal-body {
    padding: 1.5rem;
}

.form-group {
    margin-bottom: 1.25rem;
}

.form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #2c3e50;
}

.form-group input,
.form-group select,
.form-group textarea {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 1rem;
    transition: border-color 0.2s;
    box-sizing: border-box; /* Add this to include padding in width calculation */
    max-width: 100%; /* Ensure inputs don't exceed their container */
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
    border-color: #3498db;
    outline: none;
}

.form-group textarea {
    resize: vertical;
    min-height: 80px;
}

.form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 1.5rem;
}

.modal-footer {
    display: flex;
    justify-content: center;
    gap: 1rem;
    padding: 1rem 1.5rem;
}

.cancel-button {
    background: #f8f9fa;
    border: 1px solid #ddd;
    padding: 0.75rem 1.5rem;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.95rem;
    transition: background-color 0.2s;
}

.cancel-button:hover {
    background: #e9ecef;
}

.save-button {
    background: #3498db;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.95rem;
    transition: background-color 0.2s;
}

.save-button:hover {
    background: #2980b9;
}

.confirm-button {
    background: #e74c3c;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.95rem;
    transition: background-color 0.2s;
}

.confirm-button:hover {
    background: #c0392b;
}

.confirm-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

/* Confirmation modal styles */
.confirmation-modal {
    max-width: 450px;
}

.confirmation-modal .modal-header {
    background: #f8f9fa;
}

.confirmation-modal .modal-body {
    padding: 2rem;
    text-align: center;
}

.warning-icon {
    color: #e74c3c;
    font-size: 3rem;
    margin-bottom: 1.5rem;
}

.confirmation-text {
    font-size: 1.1rem;
    color: #2c3e50;
    margin-bottom: 0.5rem;
}

.permanent-note {
    color: #7f8c8d;
    font-size: 0.9rem;
    margin-bottom: 2rem;
}

.security-verification {
    background: #f8f9fa;
    padding: 1.5rem;
    border-radius: 8px;
    text-align: left;
    display: flex;
    flex-direction: column;
}

.security-verification label {
    display: block;
    margin-bottom: 0.75rem;
    color: #2c3e50;
    font-weight: 500;
}

.security-verification input {
    width: calc(100% - 1.5rem);
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 1rem;
    transition: all 0.2s ease;
    margin: 0 auto;
}

.security-verification input:focus {
    border-color: #3498db;
    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.1);
    outline: none;
}

.modal-footer {
    padding: 1rem 1.5rem;
    background: #f8f9fa;
    border-top: 1px solid #eee;
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
}

.modal-footer .cancel-button {
    background: white;
    border: 1px solid #ddd;
    padding: 0.75rem 1.5rem;
    border-radius: 6px;
    font-size: 0.95rem;
    color: #2c3e50;
    transition: all 0.2s ease;
}

.modal-footer .cancel-button:hover {
    background: #f8f9fa;
    border-color: #c8c9ca;
}

.modal-footer .confirm-button {
    background: #e74c3c;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 6px;
    font-size: 0.95rem;
    transition: all 0.2s ease;
}

.modal-footer .confirm-button:hover:not(:disabled) {
    background: #c0392b;
}

.modal-footer .confirm-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

/* Add smooth transition for modal */
.modal-overlay {
    transition: all 0.2s ease;
    opacity: 1;
}

.modal-content {
    transition: all 0.2s ease;
    transform: translateY(0);
}

.modal-overlay.show {
    opacity: 1;
}

.modal-overlay.show .modal-content {
    transform: translateY(0);
}

/* Responsive adjustments */
@media (max-width: 768px) {
    .overview-stats {
        grid-template-columns: 1fr;
    }

    .section-header {
        flex-direction: column;
        align-items: flex-start;
    }

    .controls {
        flex-direction: column;
        align-items: flex-start;
        width: 100%;
    }

    .search-box,
    .controls select {
        width: 100%;
    }

    .search-box input {
        width: 100%;
    }

    .add-button {
        width: 100%;
        justify-content: center;
    }

    .data-table {
        display: block;
        overflow-x: auto;
    }
}

/* Course link styles */
.course-link {
    color: #3498db;
    text-decoration: none;
    transition: all 0.2s ease;
    cursor: pointer;
}

.course-link:hover {
    text-decoration: underline;
    color: #2980b9;
}
</style>
