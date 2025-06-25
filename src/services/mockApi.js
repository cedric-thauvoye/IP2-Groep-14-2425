/**
 * Mock API Service for Demo
 * This replaces the real API with hardcoded data for demonstration purposes
 */

// Mock delay to simulate network requests
const mockDelay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

// Demo users with simple credentials
const DEMO_USERS = {
  'teacher': {
    id: 1,
    email: 'teacher@demo.com',
    password: 'teacher123',
    first_name: 'John',
    last_name: 'Teacher',
    role: 'teacher',
    q_number: null
  },
  'student1': {
    id: 2,
    email: 'student1@demo.com',
    password: 'student123',
    first_name: 'Alice',
    last_name: 'Student',
    role: 'student',
    q_number: 'q123456'
  },
  'student2': {
    id: 3,
    email: 'student2@demo.com',
    password: 'student123',
    first_name: 'Bob',
    last_name: 'Johnson',
    role: 'student',
    q_number: 'q234567'
  },
  'student3': {
    id: 4,
    email: 'student3@demo.com',
    password: 'student123',
    first_name: 'Carol',
    last_name: 'Wilson',
    role: 'student',
    q_number: 'q345678'
  },
  'admin': {
    id: 5,
    email: 'admin@demo.com',
    password: 'admin123',
    first_name: 'Super',
    last_name: 'Admin',
    role: 'admin',
    q_number: null
  }
};

// Demo courses
const DEMO_COURSES = [
  {
    id: 1,
    name: 'Web Development',
    description: 'Learn modern web development with Vue.js and Node.js',
    code: 'WEB101',
    teacherId: 1
  },
  {
    id: 2,
    name: 'Database Systems',
    description: 'Introduction to relational databases and SQL',
    code: 'DB201',
    teacherId: 1,
  }
];

// Demo groups
const DEMO_GROUPS = [
  {
    id: 1,
    name: 'Team Alpha',
    description: 'Frontend development team',
    courseId: 1,
    course_id: 1,
    courseName: 'Web Development',
    studentIds: [2, 3],
    students: [
      { id: 2, first_name: 'Alice', last_name: 'Student', q_number: 'q123456' },
      { id: 3, first_name: 'Bob', last_name: 'Johnson', q_number: 'q234567' }
    ]
  },
  {
    id: 2,
    name: 'Team Beta',
    description: 'Backend development team',
    courseId: 1,
    course_id: 1,
    courseName: 'Web Development',
    studentIds: [3, 4],
    students: [
      { id: 3, first_name: 'Bob', last_name: 'Johnson', q_number: 'q234567' },
      { id: 4, first_name: 'Carol', last_name: 'Wilson', q_number: 'q345678' }
    ]
  },
  {
    id: 3,
    name: 'Database Team',
    description: 'Database project group',
    courseId: 2,
    course_id: 2,
    courseName: 'Database Systems',
    studentIds: [2, 4],
    students: [
      { id: 2, first_name: 'Alice', last_name: 'Student', q_number: 'q123456' },
      { id: 4, first_name: 'Carol', last_name: 'Wilson', q_number: 'q345678' }
    ]
  }
];

// Demo assessments
const DEMO_ASSESSMENTS = [
  {
    id: 1,
    title: 'Mid-Project Peer Review',
    description: 'Evaluate your teammates\' contributions so far in the web development project',
    courseId: 1,
    courseName: 'Web Development',
    groupId: 1,
    groupName: 'Team Alpha',
    group_id: 1,
    teacherId: 1,
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    criteria: [
      {
        id: 1,
        name: 'Technical Skills',
        description: 'Evaluate coding abilities and technical knowledge',
        minScore: 0,
        maxScore: 10,
        min_score: 0,
        max_score: 10
      },
      {
        id: 2,
        name: 'Collaboration',
        description: 'How well they work with the team',
        minScore: 0,
        maxScore: 10,
        min_score: 0,
        max_score: 10
      },
      {
        id: 3,
        name: 'Communication',
        description: 'Clear and effective communication skills',
        minScore: 0,
        maxScore: 10,
        min_score: 0,
        max_score: 10
      }
    ],
    responsesCount: 1,
    responses_count: 1,
    studentsCount: 2,
    students_count: 2,
    feedbackCount: 1,
    feedback_count: 1
  },
  {
    id: 2,
    title: 'Final Project Assessment',
    description: 'Final evaluation of team performance',
    courseId: 1,
    courseName: 'Web Development',
    groupId: 2,
    groupName: 'Team Beta',
    group_id: 2,
    teacherId: 1,
    dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago (completed)
    due_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    completedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    completed_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    criteria: [
      {
        id: 4,
        name: 'Leadership',
        description: 'Taking initiative and guiding the team',
        minScore: 0,
        maxScore: 10,
        min_score: 0,
        max_score: 10
      },
      {
        id: 5,
        name: 'Problem Solving',
        description: 'Ability to solve complex problems',
        minScore: 0,
        maxScore: 10,
        min_score: 0,
        max_score: 10
      }
    ],
    responsesCount: 1,
    responses_count: 1,
    studentsCount: 1,
    students_count: 1,
    feedbackCount: 1,
    feedback_count: 1
  }
];

// Demo responses and results
const DEMO_RESPONSES = [
  {
    id: 1,
    assessmentId: 1,
    studentId: 2, // Alice evaluating Bob
    feedback: 'Bob is excellent at coding and always helps others understand difficult concepts.',
    submittedAt: new Date().toISOString(),
    submitted_at: new Date().toISOString()
  }
];

const DEMO_RESULTS = [
  // Alice (student 2) evaluating Bob (student 3) in assessment 1
  { id: 1, responseId: 1, criteriaId: 1, studentId: 3, givenScore: 9 }, // Technical Skills
  { id: 2, responseId: 1, criteriaId: 2, studentId: 3, givenScore: 8 }, // Collaboration
  { id: 3, responseId: 1, criteriaId: 3, studentId: 3, givenScore: 7 }  // Communication
];

// Current user state
let currentUser = null;
let authToken = null;

// Helper functions
const findUser = (identifier) => {
  return Object.values(DEMO_USERS).find(user =>
    user.email === identifier || Object.keys(DEMO_USERS).find(key => key === identifier)
  );
};

const getUserAssessments = (userId, isPending = true) => {
  const user = Object.values(DEMO_USERS).find(u => u.id === userId);
  if (!user) return [];

  if (user.role === 'student') {
    // Get groups the student is in
    const userGroups = DEMO_GROUPS.filter(group => group.studentIds.includes(userId));
    const groupIds = userGroups.map(g => g.id);

    return DEMO_ASSESSMENTS.filter(assessment => {
      const isInGroup = groupIds.includes(assessment.groupId);
      const isCompleted = !!assessment.completedDate;
      return isInGroup && (isPending ? !isCompleted : isCompleted);
    });
  } else if (user.role === 'teacher') {
    // Teachers see assessments they created
    return DEMO_ASSESSMENTS.filter(assessment => {
      const isCompleted = !!assessment.completedDate;
      return assessment.teacherId === userId && (isPending ? !isCompleted : isCompleted);
    });
  }

  return [];
};

// Mock API Service
export const mockApiService = {
  // Authentication
  async login(email, password) {
    await mockDelay();

    // Try direct email login
    let user = findUser(email);

    // Try username login (for simple demo credentials)
    if (!user) {
      user = DEMO_USERS[email]; // email could be username like "teacher"
    }

    if (!user || user.password !== password) {
      throw new Error('Invalid credentials');
    }

    authToken = `demo_token_${user.id}`;
    currentUser = { ...user };
    localStorage.setItem('auth_token', authToken);
    localStorage.setItem('user', JSON.stringify(currentUser));

    return {
      data: {
        token: authToken,
        user: currentUser
      }
    };
  },

  async logout() {
    await mockDelay(100);
    currentUser = null;
    authToken = null;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    return { data: { message: 'Logged out successfully' } };
  },

  async getCurrentUser() {
    await mockDelay(100);
    if (!currentUser) {
      // Try to restore from localStorage
      const stored = localStorage.getItem('user');
      if (stored) {
        currentUser = JSON.parse(stored);
      } else {
        throw new Error('Not authenticated');
      }
    }
    return { data: { user: currentUser } };
  },

  async checkUserRole() {
    await mockDelay(100);
    if (!currentUser) {
      const stored = localStorage.getItem('user');
      if (stored) {
        currentUser = JSON.parse(stored);
      } else {
        throw new Error('Not authenticated');
      }
    }
    return { data: { role: currentUser.role } };
  },

  // Assessments
  async getPendingAssessments() {
    await mockDelay();
    if (!currentUser) throw new Error('Not authenticated');

    const assessments = getUserAssessments(currentUser.id, true);
    return { data: assessments };
  },

  async getCompletedAssessments() {
    await mockDelay();
    if (!currentUser) throw new Error('Not authenticated');

    const assessments = getUserAssessments(currentUser.id, false);
    return { data: assessments };
  },

  async getAssessmentById(id) {
    await mockDelay();
    if (!currentUser) throw new Error('Not authenticated');

    const assessment = DEMO_ASSESSMENTS.find(a => a.id === parseInt(id));
    if (!assessment) throw new Error('Assessment not found');

    let result = { ...assessment };

    if (currentUser.role === 'student') {
      // Get other students in the same group to evaluate
      const group = DEMO_GROUPS.find(g => g.id === assessment.groupId);
      const studentsToEvaluate = group.students.filter(s => s.id !== currentUser.id);

      // Check if student already submitted
      const existingResponse = DEMO_RESPONSES.find(r =>
        r.assessmentId === assessment.id && r.studentId === currentUser.id
      );

      result.studentsToEvaluate = studentsToEvaluate;
      result.submitted = !!existingResponse;
      result.responseId = existingResponse?.id;
      result.feedback = existingResponse?.feedback || '';

      if (existingResponse) {
        const givenScores = DEMO_RESULTS.filter(r => r.responseId === existingResponse.id);
        result.givenScores = givenScores.map(score => ({
          criteria_id: score.criteriaId,
          student_id: score.studentId,
          given_score: score.givenScore
        }));
      }
    }

    return { data: result };
  },

  async submitAssessment(id, submissionData) {
    await mockDelay();
    if (!currentUser) throw new Error('Not authenticated');

    const { feedback, scores } = submissionData;

    // Simulate saving the response
    console.log('Demo: Submitting assessment', id, 'with data:', submissionData);

    return {
      data: {
        message: 'Assessment submitted successfully',
        responseId: Math.floor(Math.random() * 1000) + 100
      }
    };
  },

  async createAssessment(assessmentData) {
    await mockDelay();
    if (!currentUser || currentUser.role !== 'teacher') {
      throw new Error('Only teachers can create assessments');
    }

    console.log('Demo: Creating assessment:', assessmentData);

    return {
      data: {
        id: Math.floor(Math.random() * 1000) + 100,
        message: 'Assessment created successfully'
      }
    };
  },

  async getAssessmentResults(id) {
    await mockDelay();
    if (!currentUser) throw new Error('Not authenticated');

    const assessment = DEMO_ASSESSMENTS.find(a => a.id === parseInt(id));
    if (!assessment) throw new Error('Assessment not found');

    // Mock results data
    const results = [];
    const group = DEMO_GROUPS.find(g => g.id === assessment.groupId);

    if (group) {
      for (const student of group.students) {
        results.push({
          student: {
            id: student.id,
            firstName: student.first_name,
            lastName: student.last_name,
            q_number: student.q_number
          },
          criteriaScores: assessment.criteria.map(criterion => ({
            id: criterion.id,
            name: criterion.name,
            max_score: criterion.maxScore,
            average_score: Math.random() * criterion.maxScore * 0.8 + criterion.maxScore * 0.2, // Random score between 20-100% of max
            score_display: `${(Math.random() * criterion.maxScore * 0.8 + criterion.maxScore * 0.2).toFixed(1)}/${criterion.maxScore}`,
            score_color: 'good'
          })),
          overallAverage: (Math.random() * 8 + 2).toFixed(1), // Random between 2-10
          overallAverageDisplay: `${(Math.random() * 8 + 2).toFixed(1)}/10`,
          overallScoreColor: 'good',
          feedbackReceived: [
            {
              feedback: 'Great teammate, very collaborative and helpful!',
              from_first_name: 'Demo',
              from_last_name: 'Peer',
              submitted_at: new Date().toISOString()
            }
          ]
        });
      }
    }

    return {
      data: {
        id: assessment.id,
        title: assessment.title,
        courseName: assessment.courseName,
        groupName: assessment.groupName,
        description: assessment.description,
        dueDate: assessment.dueDate,
        maxScore: 10,
        criteria: assessment.criteria,
        results: results
      }
    };
  },

  // Courses
  async getCourses(teaching = false) {
    await mockDelay();
    if (!currentUser) throw new Error('Not authenticated');

    let courses = DEMO_COURSES;
    if (teaching && currentUser.role === 'teacher') {
      courses = courses.filter(c => c.teacherId === currentUser.id);
    }

    // Add counts for each course
    const coursesWithCounts = courses.map(course => {
      // Count students (all students are enrolled for demo)
      const studentsCount = Object.values(DEMO_USERS).filter(u => u.role === 'student').length;

      // Count assessments for this course
      const assessmentsCount = DEMO_ASSESSMENTS.filter(a => a.courseId === course.id).length;

      // Count groups for this course
      const groupsCount = DEMO_GROUPS.filter(g => g.courseId === course.id).length;

      return {
        ...course,
        // The CoursesView specifically expects these properties:
        student_count: studentsCount,
        assessment_count: assessmentsCount,
        // Additional variations for compatibility
        studentsCount,
        students_count: studentsCount,
        studentCount: studentsCount,
        enrolledStudents: studentsCount,
        assessmentsCount,
        assessments_count: assessmentsCount,
        assessmentCount: assessmentsCount,
        groupsCount,
        groups_count: groupsCount,
        groupCount: groupsCount,
        // Additional count properties that might be expected
        totalStudents: studentsCount,
        totalAssessments: assessmentsCount,
        totalGroups: groupsCount
      };
    });

    return { data: coursesWithCounts };
  },

  async getCourseById(id) {
    await mockDelay();
    const course = DEMO_COURSES.find(c => c.id === parseInt(id));
    if (!course) throw new Error('Course not found');

    // Get teacher
    const teacher = Object.values(DEMO_USERS).find(u => u.id === course.teacherId);

    // Get students enrolled in this course (all students for demo)
    const students = Object.values(DEMO_USERS).filter(u => u.role === 'student');

    // Get groups for this course
    const groups = DEMO_GROUPS.filter(g => g.courseId === parseInt(id));

    return {
      data: {
        ...course,
        teacher: teacher,
        teachers: [teacher], // Some views might expect this format
        students: students,
        groups: groups,
        studentsCount: students.length,
        groupsCount: groups.length
      }
    };
  },

  // Groups
  async getGroups(courseId) {
    await mockDelay();
    if (!currentUser) throw new Error('Not authenticated');

    let groups = DEMO_GROUPS;
    if (courseId) {
      groups = groups.filter(g => g.courseId === parseInt(courseId));
    }

    // Add student counts to each group
    const groupsWithCounts = groups.map(group => ({
      ...group,
      student_count: group.students ? group.students.length : 0,
      studentsCount: group.students ? group.students.length : 0,
      studentCount: group.students ? group.students.length : 0
    }));

    return { data: groupsWithCounts };
  },

  async getGroupById(id) {
    await mockDelay();
    const group = DEMO_GROUPS.find(g => g.id === parseInt(id));
    if (!group) throw new Error('Group not found');

    // Add more detailed student info
    const detailedGroup = {
      ...group,
      course: DEMO_COURSES.find(c => c.id === group.courseId),
      assessments: DEMO_ASSESSMENTS.filter(a => a.groupId === group.id)
    };

    return { data: detailedGroup };
  },

  // Users
  async getStudents() {
    await mockDelay();
    const students = Object.values(DEMO_USERS).filter(u => u.role === 'student');
    return { data: students };
  },

  async getAllUsers() {
    await mockDelay();
    return { data: Object.values(DEMO_USERS) };
  }
};

// Export services in the same format as the original API
export const authService = {
  login: mockApiService.login,
  logout: mockApiService.logout,
  getCurrentUser: mockApiService.getCurrentUser,
  checkUserRole: mockApiService.checkUserRole,
  // Add other methods that don't apply to demo
  register: () => Promise.reject(new Error('Registration not available in demo')),
  loginWithMicrosoft: () => Promise.reject(new Error('Microsoft login not available in demo')),
  verifyPassword: (password) => Promise.resolve({ data: { valid: true } })
};

export const assessmentService = {
  getPendingAssessments: mockApiService.getPendingAssessments,
  getCompletedAssessments: mockApiService.getCompletedAssessments,
  getPendingAssessmentsForTeacher: mockApiService.getPendingAssessments,
  getCompletedAssessmentsForTeacher: mockApiService.getCompletedAssessments,
  getAssessmentById: mockApiService.getAssessmentById,
  createAssessment: mockApiService.createAssessment,
  submitAssessment: mockApiService.submitAssessment,
  getAssessmentResults: mockApiService.getAssessmentResults,
  getAssessmentFeedback: (id) => Promise.resolve({
    data: {
      assessment: { id, title: 'Demo Assessment' },
      feedback: [{
        feedback: 'Demo feedback content',
        student: { first_name: 'Demo', last_name: 'Student' }
      }]
    }
  }),
  updateAssessment: () => Promise.reject(new Error('Update not available in demo')),
  deleteAssessment: () => Promise.reject(new Error('Delete not available in demo'))
};

export const courseService = {
  getCourses: mockApiService.getCourses,
  getCourseById: mockApiService.getCourseById,
  createCourse: () => Promise.reject(new Error('Create course not available in demo')),
  updateCourse: () => Promise.reject(new Error('Update course not available in demo')),
  deleteCourse: () => Promise.reject(new Error('Delete course not available in demo')),
  addStudentToCourse: () => Promise.reject(new Error('Add student not available in demo')),
  removeStudentFromCourse: () => Promise.reject(new Error('Remove student not available in demo')),
  getUserCourses: mockApiService.getCourses
};

export const groupService = {
  getGroups: mockApiService.getGroups,
  getGroupById: mockApiService.getGroupById,
  createGroup: () => Promise.reject(new Error('Create group not available in demo')),
  createGroupForCourse: () => Promise.reject(new Error('Create group not available in demo')),
  updateGroup: () => Promise.reject(new Error('Update group not available in demo')),
  deleteGroup: () => Promise.reject(new Error('Delete group not available in demo')),
  addStudentToGroup: () => Promise.reject(new Error('Add student not available in demo')),
  removeStudentFromGroup: () => Promise.reject(new Error('Remove student not available in demo')),
  getAvailableStudents: mockApiService.getStudents
};

export const userService = {
  getStudents: mockApiService.getStudents,
  getAllUsers: mockApiService.getAllUsers,
  getTeachers: () => Promise.resolve({
    data: Object.values(DEMO_USERS).filter(u => u.role === 'teacher')
  }),
  getUserById: (id) => {
    const user = Object.values(DEMO_USERS).find(u => u.id === parseInt(id));
    if (!user) return Promise.resolve({ data: null });

    // Add course enrollments for students
    if (user.role === 'student') {
      const courses = DEMO_COURSES.map(course => ({
        id: course.id,
        name: course.name,
        code: course.code,
        description: course.description
      }));
      return Promise.resolve({
        data: { ...user, courses }
      });
    }

    return Promise.resolve({ data: user });
  },
  createUser: () => Promise.reject(new Error('Create user not available in demo')),
  updateUser: () => Promise.reject(new Error('Update user not available in demo')),
  deleteUser: () => Promise.reject(new Error('Delete user not available in demo')),
  importStudents: () => Promise.reject(new Error('Import not available in demo'))
};

export const importService = {
  previewStudents: () => Promise.reject(new Error('Import not available in demo')),
  importStudents: () => Promise.reject(new Error('Import not available in demo')),
  previewGroups: () => Promise.reject(new Error('Import not available in demo')),
  importGroups: () => Promise.reject(new Error('Import not available in demo')),
  getStudentTemplate: () => Promise.reject(new Error('Import not available in demo')),
  getGroupTemplate: () => Promise.reject(new Error('Import not available in demo'))
};

export default {
  auth: authService,
  assessments: assessmentService,
  courses: courseService,
  groups: groupService,
  users: userService,
  import: importService
};
