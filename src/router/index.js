import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import CourseView from '../views/CourseView.vue';
import GroupView from '../views/GroupView.vue';
import LoginView from '../views/LoginView.vue'; // Import LoginView

const routes = [
    {
        path: '/login',
        name: 'login',
        component: LoginView
    },
    {
        path: '/home',
        name: 'home',
        component: HomeView
    },
    {
        path: '/course/:courseId',
        name: 'course',
        component: CourseView
    },
    {
        path: '/course/:courseId/groups/:groupId',
        name: 'group',
        component: GroupView
    }
];

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes
});

export default router;
