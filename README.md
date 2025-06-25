# 🎯 Peer Evaluation System - DEMO

A **demonstration version** of the Peer Evaluation System for educational institutions. This version uses hardcoded data instead of a real API/database, making it perfect for testing and showcasing the application's features.

## 🔑 Demo Login Credentials

| Role | Email | Password | Description |
|------|----------|----------|-------------|
| 👨‍🏫 **Teacher** | `teacher@demo.com` | `teacher123` | Can create assessments, view results, manage courses |
| 👩‍🎓 **Student** | `student1@demo.com` | `student123` | Can complete peer evaluations, view assessments |
| 👑 **Admin** | `admin@demo.com` | `admin123` | Full access to all features and data |

*Additional student accounts: `student2` and `student3` (both use `student123`)*

## ✨ What's Different in Demo Mode

### ✅ **Included:**
- ✅ Complete UI/UX experience
- ✅ All user roles and permissions
- ✅ Assessment creation and submission
- ✅ Results viewing and analytics
- ✅ Course and group management interfaces
- ✅ Responsive design
- ✅ Hardcoded realistic data

### ❌ **Removed:**
- ❌ Real API calls and database
- ❌ Azure AD authentication
- ❌ Docker containers
- ❌ MySQL database
- ❌ File upload/import functionality
- ❌ Email notifications
- ❌ Data persistence (refreshing resets data)

## 🎮 Demo Features to Explore

### **As a Teacher** (`teacher@demo.com` / `teacher123`):
- 📝 **Create Assessments:** Set up peer evaluations with custom criteria
- 📊 **View Results:** See detailed analytics and student performance
- 👥 **Manage Groups:** View team compositions and progress
- 💬 **Read Feedback:** Access anonymous peer feedback
- 🎯 **Track Progress:** Monitor assessment completion rates

### **As a Student** (`student1@demo.com` / `student123`):
- ✍️ **Complete Evaluations:** Rate teammates on various criteria
- 📝 **Provide Feedback:** Give constructive peer feedback
- 📈 **View Assessments:** See pending and completed evaluations
- ⏰ **Check Deadlines:** Monitor due dates and submission status

### **As an Admin** (`admin@demo.com` / `admin123`):
- 🔍 **Full Overview:** Access all courses, groups, and assessments
- 👥 **User Management:** View all users and their roles
- 📊 **System Analytics:** See platform-wide statistics
- ⚙️ **Configuration:** Access administrative features

## 🗂️ Demo Data Structure

The demo includes:
- **2 Courses:** Web Development, Database Systems
- **3 Groups:** Team Alpha, Team Beta, Database Team
- **5 Users:** 1 Teacher, 3 Students, 1 Admin
- **2 Assessments:** Mid-Project Review, Final Assessment
- **Sample Criteria:** Technical Skills, Collaboration, Communication, Leadership

## 🛠️ Technical Stack (Demo)

- **Frontend:** Vue.js 3 + Vite
- **Routing:** Vue Router
- **Styling:** Custom CSS with responsive design
- **Icons:** Font Awesome
- **State:** Local state management with mock data
- **Auth:** Simplified demo authentication

## 📁 Project Structure

```
src/
├── views/
│   ├── DemoLoginView.vue          # Demo login with instructions
│   ├── AssessmentsView.vue        # Main assessments dashboard
│   ├── AssessmentDetailView.vue   # Peer evaluation form
│   ├── ResultsView.vue           # Results overview
│   └── ...
├── services/
│   └── mockApi.js                # Hardcoded API replacement
├── components/
│   └── ...                       # Reusable UI components
└── assets/
    └── main.css                  # Global styles
```

## 🎯 Use Cases

Perfect for:
- 🎓 **Educational demonstrations**
- 👥 **Stakeholder presentations**
- 🧪 **UI/UX testing**
- 📚 **Training sessions**
- 🔍 **Feature showcasing**
- 💡 **Concept validation**

## 📞 Support

This is a demonstration version. For the full production system, refer to the main project.