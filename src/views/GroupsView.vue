<template>
    <PageLayout>
        <div class="groups-container">
            <div class="header">
                <h1>Groups</h1>
                <div class="actions" v-if="isTeacher">
                    <button class="action-button" @click="showCreateGroupModal = true">
                        <i class="fas fa-plus"></i> Create Group
                    </button>
                    <button class="action-button import">
                        <i class="fas fa-file-import"></i> Import Groups
                    </button>
                </div>
            </div>

            <div v-if="loading" class="loading-state">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading groups...</p>
            </div>

            <div v-else-if="groups.length > 0" class="groups-grid">
                <div v-for="group in groups" :key="group.id" class="group-card">
                    <div class="group-header">
                        <h3>{{ group.name }}</h3>
                        <span class="member-count">
                            <i class="fas fa-users"></i> {{ group.student_count || 0 }}
                        </span>
                    </div>
                    <p class="course-name">{{ group.course_name }}</p>
                    <div class="group-content">
                        <p class="description">{{ group.description || 'No description available' }}</p>
                    </div>
                    <div class="group-footer">
                        <router-link :to="`/group/${group.id}`" class="view-button">
                            View Details
                        </router-link>
                        <div class="actions" v-if="isTeacher">
                            <button class="icon-button edit" @click="editGroup(group)">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="icon-button delete" @click="deleteGroup(group.id)">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div v-else class="empty-state">
                <i class="fas fa-users"></i>
                <h3>No Groups Found</h3>
                <p>{{ isTeacher ? 'Create a new group to get started' : 'You are not a member of any groups yet' }}</p>
            </div>
        </div>
    </PageLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import PageLayout from '../components/Layout/PageLayout.vue';
import { groupService, authService } from '../services/api';

const router = useRouter();
const groups = ref([]);
const loading = ref(true);
const isTeacher = ref(false);
const showCreateGroupModal = ref(false);

const editGroup = (group) => {
    // Implement edit group functionality
    console.log('Edit group:', group);
};

const deleteGroup = async (id) => {
    if (confirm('Are you sure you want to delete this group?')) {
        try {
            // In a real implementation, you would call an API to delete the group
            console.log('Delete group:', id);
            groups.value = groups.value.filter(group => group.id !== id);
        } catch (error) {
            console.error('Error deleting group:', error);
        }
    }
};

onMounted(async () => {
    try {
        // Check if user is a teacher
        const roleResponse = await authService.checkUserRole();
        isTeacher.value = roleResponse.data.role === 'teacher' || roleResponse.data.role === 'admin';

        // Fetch groups
        const response = await groupService.getGroups();
        groups.value = response.data;
    } catch (error) {
        console.error('Error fetching groups:', error);
    } finally {
        loading.value = false;
    }
});
</script>

<style scoped>
.groups-container {
    max-width: 1400px;
    margin: 0 auto;
}

.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
}

.header h1 {
    margin: 0;
    color: #2c3e50;
}

.actions {
    display: flex;
    gap: 1rem;
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
    transition: background-color 0.2s;
}

.action-button.import {
    background-color: #2c3e50;
}

.action-button:hover {
    opacity: 0.9;
}

.loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #7f8c8d;
    font-size: 1rem;
    margin: 2rem 0;
}

.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #7f8c8d;
    font-size: 1rem;
    margin: 2rem 0;
}

.empty-state i {
    font-size: 2rem;
    margin-bottom: 1rem;
}

.groups-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
}

.group-card {
    background: white;
    border-radius: 10px;
    padding: 1.5rem;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.group-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
}

.group-header h3 {
    margin: 0;
    color: #2c3e50;
}

.member-count {
    color: #7f8c8d;
    font-size: 0.9rem;
}

.course-name {
    color: #3498db;
    font-size: 0.9rem;
    margin: 0 0 1rem 0;
}

.description {
    color: #7f8c8d;
    margin: 0;
    font-size: 0.9rem;
}

.group-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 1.5rem;
}

.view-button {
    background-color: #3498db;
    color: white;
    text-decoration: none;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    font-size: 0.9rem;
}

.icon-button {
    background: none;
    border: none;
    cursor: pointer;
    color: #7f8c8d;
    padding: 0.5rem;
    transition: color 0.2s;
}

.icon-button.edit:hover {
    color: #f39c12;
}

.icon-button.delete:hover {
    color: #e74c3c;
}

@media (max-width: 768px) {
    .header {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
    }

    .groups-grid {
        grid-template-columns: 1fr;
    }
}
</style>
