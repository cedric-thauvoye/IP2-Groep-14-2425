<template>
    <PageLayout>
        <div class="groups-container">
            <div class="header">
                <h1>Groups</h1>
                <div class="actions" v-if="isTeacher">
                    <button class="action-button">
                        <i class="fas fa-plus"></i> Create Group
                    </button>
                    <button class="action-button import">
                        <i class="fas fa-file-import"></i> Import Groups
                    </button>
                </div>
            </div>

            <div class="groups-grid">
                <div v-for="group in groups" :key="group.id" class="group-card">
                    <div class="group-header">
                        <h3>{{ group.name }}</h3>
                        <span class="member-count">
                            <i class="fas fa-users"></i> {{ group.students?.length || 0 }}
                        </span>
                    </div>
                    <p class="course-name">{{ group.courseName }}</p>
                    <div class="group-content">
                        <p class="description">{{ group.description || 'No description available' }}</p>
                    </div>
                    <div class="group-footer">
                        <router-link :to="`/group/${group.id}`" class="view-button">
                            View Details
                        </router-link>
                        <div class="actions" v-if="isTeacher">
                            <button class="icon-button edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="icon-button delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </PageLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../main';
import PageLayout from '../components/Layout/PageLayout.vue';

const groups = ref([]);
const isTeacher = ref(true); // TODO: Implement proper role check

onMounted(() => {
    const q = query(collection(db, 'Groups'));
    onSnapshot(q, (querySnapshot) => {
        groups.value = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    });
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
