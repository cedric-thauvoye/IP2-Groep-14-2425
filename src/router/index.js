import { createRouter, createWebHistory } from 'vue-router'
import { authService } from '../services/api'

// View imports
import LoginView from '../views/LoginView.vue'
import HomeView from '../views/HomeView.vue'
import CoursesView from '../views/CoursesView.vue'
import GroupsView from '../views/GroupsView.vue'
import StudentsView from '../views/StudentsView.vue'
import ImportView from '../views/ImportView.vue'
import AssessmentsView from '../views/AssessmentsView.vue'
import ResultsView from '../views/ResultsView.vue'
import AssessmentDetailView from '../views/AssessmentDetailView.vue'
import ResultsDetailView from '../views/ResultsDetailView.vue'

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
    {
      path: '/course/:id',
      name: 'course-detail',
      component: () => import('../views/CourseDetailView.vue'),
      beforeEnter: requireAuth
    },
    {
      path: '/groups',
      name: 'groups',
      component: GroupsView,
      beforeEnter: requireAuth
    },
    {
      path: '/group/:id',
      name: 'group-detail',
      component: () => import('../views/GroupDetailView.vue'),
      beforeEnter: requireAuth
    },
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
    {
      path: '/assessment/:id',
      name: 'assessment-detail',
      component: AssessmentDetailView,
      beforeEnter: requireAuth
    },
    {
      path: '/assessment/:id/results',
      name: 'assessment-results',
      component: ResultsDetailView,
      beforeEnter: requireAuth
    },
    {
      path: '/results',
      name: 'results',
      component: ResultsView,
      beforeEnter: requireAuth
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
    },
    // Admin routes
    {
      path: '/admin',
      name: 'admin-dashboard',
      component: () => import('../views/AdminDashboardView.vue'),
      beforeEnter: async (to, from, next) => {
        const token = localStorage.getItem('auth_token');
        if (!token) {
          console.log('Admin route: No token found, redirecting to login');
          next({ name: 'login' });
          return;
        }

        try {
          console.log('Admin route: Checking user role');
          const response = await authService.checkUserRole();
          console.log('Admin route: User role check response:', response.data);

          if (response.data && response.data.role === 'admin') {
            console.log('Admin route: User is admin, allowing access');
            next();
          } else {
            console.log('Admin route: User is not admin, redirecting to home');
            next({ name: 'home' });
          }
        } catch (error) {
          console.error('Error checking admin status:', error);
          next({ name: 'login' });
        }
      }
    },
    {
      path: '/user/:id',
      name: 'user-detail',
      component: () => import('../views/UserDetailView.vue'),
      beforeEnter: requireAuth
    }
  ]
})

export default router
