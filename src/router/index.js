import { createRouter, createWebHistory } from 'vue-router'

// View imports
import LoginView from '../views/LoginView.vue'
import HomeView from '../views/HomeView.vue'
import CoursesView from '../views/CoursesView.vue'
import GroupsView from '../views/GroupsView.vue'
import StudentsView from '../views/StudentsView.vue'
import ImportView from '../views/ImportView.vue'
import AssessmentsView from '../views/AssessmentsView.vue'
import ResultsView from '../views/ResultsView.vue'

// Auth guard function to check for token
const requireAuth = (to, from, next) => {
  const token = localStorage.getItem('auth_token')
  if (!token) {
    next({ name: 'login' })
  } else {
    next()
  }
}

// Routes configuration
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'login',
      component: LoginView
    },
    {
      path: '/home',
      name: 'home',
      component: HomeView,
      beforeEnter: requireAuth
    },
    {
      path: '/courses',
      name: 'courses',
      component: CoursesView,
      beforeEnter: requireAuth
    },
    // {
    //   path: '/course/:id',
    //   name: 'course-detail',
    //   component: () => import('../views/CourseDetailView.vue'),
    //   beforeEnter: requireAuth
    // },
    {
      path: '/groups',
      name: 'groups',
      component: GroupsView,
      beforeEnter: requireAuth
    },
    // {
    //   path: '/group/:id',
    //   name: 'group-detail',
    //   component: () => import('../views/GroupDetailView.vue'),
    //   beforeEnter: requireAuth
    // },
    {
      path: '/students',
      name: 'students',
      component: StudentsView,
      beforeEnter: requireAuth
    },
    {
      path: '/import',
      name: 'import',
      component: ImportView,
      beforeEnter: requireAuth
    },
    {
      path: '/assessments',
      name: 'assessments',
      component: AssessmentsView,
      beforeEnter: requireAuth
    },
    // {
    //   path: '/assessment/:id',
    //   name: 'assessment-detail',
    //   component: () => import('../views/AssessmentDetailView.vue'),
    //   beforeEnter: requireAuth
    // },
    // {
    //   path: '/assessment/:id/results',
    //   name: 'assessment-results',
    //   component: () => import('../views/AssessmentResultsView.vue'),
    //   beforeEnter: requireAuth
    // },
    {
      path: '/results',
      name: 'results',
      component: ResultsView,
      beforeEnter: requireAuth
    },
    {
      path: '/admin',
      name: 'admin',
      component: () => import('../views/AdminView.vue'),
      beforeEnter: async (to, from, next) => {
        const token = localStorage.getItem('auth_token');
        if (!token) {
          next({ name: 'login' });
          return;
        }

        try {
          // Check if user is admin
          const response = await fetch('/api/auth/role', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (!response.ok) {
            throw new Error('Failed to check user role');
          }

          const data = await response.json();
          if (data.role === 'admin') {
            next();
          } else {
            next({ name: 'home' });
          }
        } catch (error) {
          console.error('Error checking admin status:', error);
          next({ name: 'login' });
        }
      }
    },
    {
      path: '/logout',
      name: 'logout',
      beforeEnter: async (to, from, next) => {
        // Just clear local tokens without Microsoft logout
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');

        // Redirect to login with logout parameter
        next({ name: 'login', query: { logout: 'true' } });
      }
    }
  ]
})

export default router
