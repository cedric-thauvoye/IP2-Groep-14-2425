-- Create Users Table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role ENUM('student', 'teacher', 'admin') NOT NULL DEFAULT 'student',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create Courses Table
CREATE TABLE courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create Assessments Table
CREATE TABLE assessments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    course_id INT NOT NULL,
    created_by INT NOT NULL,
    due_date TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Create User Assessments Table (junction table)
CREATE TABLE user_assessments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    assessment_id INT NOT NULL,
    progress INT DEFAULT 0,
    completed BOOLEAN DEFAULT 0,
    completed_date TIMESTAMP NULL,
    score DECIMAL(4,2) NULL,
    time_spent VARCHAR(50) NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (assessment_id) REFERENCES assessments(id),
    UNIQUE(user_id, assessment_id)
);

-- Create Assessment Questions Table
CREATE TABLE assessment_questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    assessment_id INT NOT NULL,
    question_text TEXT NOT NULL,
    question_type ENUM('multiple_choice', 'essay', 'rating') NOT NULL,
    order_position INT NOT NULL,
    FOREIGN KEY (assessment_id) REFERENCES assessments(id)
);

-- Create Question Options Table (for multiple choice)
CREATE TABLE question_options (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question_id INT NOT NULL,
    option_text VARCHAR(255) NOT NULL,
    FOREIGN KEY (question_id) REFERENCES assessment_questions(id)
);

-- Create User Responses Table
CREATE TABLE user_responses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    question_id INT NOT NULL,
    response_text TEXT NULL,
    selected_option_id INT NULL,
    rating_value INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (question_id) REFERENCES assessment_questions(id),
    FOREIGN KEY (selected_option_id) REFERENCES question_options(id)
);

-- Add some sample data
INSERT INTO users (email, password, first_name, last_name, role) 
VALUES 
('teacher@example.com', '$2a$10$uJ5YQtYtTLJlRPbC0MXGz.7yZ0vtRJ.BtIOmKHw9/BGGPYxvgAfFS', 'Teacher', 'User', 'teacher'),
('student@example.com', '$2a$10$uJ5YQtYtTLJlRPbC0MXGz.7yZ0vtRJ.BtIOmKHw9/BGGPYxvgAfFS', 'Student', 'User', 'student');

INSERT INTO courses (name, code, description)
VALUES 
('Web Development', 'WEB101', 'Introduction to web development'),
('Project Management', 'PM202', 'Project management methodologies');
