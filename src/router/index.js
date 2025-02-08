import { createRouter, createWebHistory } from 'vue-router'

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
            path: '/courses',
            name: 'courses',
            component: () => import('../views/CoursesView.vue'),
        },
        {
            path: '/groups',
            name: 'groups',
            component: () => import('../views/GroupsView.vue'),
        },
        {
            path: '/students',
            name: 'students',
            component: () => import('../views/StudentsView.vue'),
        },
        {
            path: '/assessments',
            name: 'assessments',
            component: () => import('../views/AssessmentsView.vue'),
        },
        {
            path: '/results',
            name: 'results',
            component: () => import('../views/ResultsView.vue'),
        },
        {
            path: '/import',
            name: 'import',
            component: () => import('../views/ImportView.vue'),
        }
    ],
})

export default router
