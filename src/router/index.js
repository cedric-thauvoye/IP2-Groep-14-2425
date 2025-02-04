import { createRouter, createWebHistory } from 'vue-router'
import CourseView from '../views/CourseView.vue'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'login',
            component: () => import('../views/LoginView.vue'),
        },
        {
            path: '/home',
            name: 'home',
            component: () => import('../views/HomeView.vue'),
        },
        {
            path: '/about',
            name: 'about',
            component: () => import('../views/AboutView.vue'),
        },
        {
            path: '/course/:courseId',
            name: 'CourseView',
            component: CourseView,
        },
    ],
})

export default router
