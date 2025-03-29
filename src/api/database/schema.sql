-- Create Users Table (students & teachers) if not exists
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role ENUM('student', 'teacher', 'admin') NOT NULL DEFAULT 'student',
    q_number VARCHAR(20) NULL,  -- q-number for students, NULL for teachers
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    -- q-number should only be set for students
    CONSTRAINT q_number_students CHECK (
        (role = 'student' AND q_number IS NOT NULL) OR
        (role != 'student')
    )
);

-- Create Courses Table if not exists
CREATE TABLE IF NOT EXISTS courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create Course Teachers Junction Table if not exists
CREATE TABLE IF NOT EXISTS course_teachers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    teacher_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(course_id, teacher_id)
);

-- Create Course Students Junction Table if not exists
CREATE TABLE IF NOT EXISTS course_students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    student_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(course_id, student_id)
);

-- Create Groups Table if not exists
CREATE TABLE IF NOT EXISTS `groups` (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    course_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- Create Group Students Junction Table if not exists
CREATE TABLE IF NOT EXISTS group_students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    group_id INT NOT NULL,
    student_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES `groups`(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(group_id, student_id)
);

-- Create Assessments Table if not exists
CREATE TABLE IF NOT EXISTS assessments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    course_id INT NOT NULL,
    group_id INT NULL,
    teacher_id INT NOT NULL,
    due_date TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (group_id) REFERENCES `groups`(id) ON DELETE SET NULL,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create Assessment Criteria Table if not exists
CREATE TABLE IF NOT EXISTS assessment_criteria (
    id INT AUTO_INCREMENT PRIMARY KEY,
    assessment_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    min_score DECIMAL(5,2) NOT NULL,
    max_score DECIMAL(5,2) NOT NULL,
    FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE
);

-- Create Responses Table (feedback responses) if not exists
CREATE TABLE IF NOT EXISTS responses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    assessment_id INT NOT NULL,
    student_id INT NOT NULL,
    feedback TEXT,
    submitted_at TIMESTAMP NULL,
    FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(assessment_id, student_id)
);

-- Create Results Table (feedback scores) if not exists
CREATE TABLE IF NOT EXISTS results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    response_id INT NOT NULL,
    criteria_id INT NOT NULL,
    student_id INT NOT NULL,  -- Student being evaluated
    given_score DECIMAL(5,2) NOT NULL,
    FOREIGN KEY (response_id) REFERENCES responses(id) ON DELETE CASCADE,
    FOREIGN KEY (criteria_id) REFERENCES assessment_criteria(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(response_id, criteria_id, student_id)
);

-- Create View for Average Results
-- Drop and recreate view (views can't use IF NOT EXISTS)
DROP VIEW IF EXISTS average_results;
CREATE VIEW average_results AS
SELECT 
    ac.assessment_id,
    r.student_id,
    ac.id AS criteria_id,
    ac.name AS criteria_name,
    AVG(res.given_score) AS average_score
FROM 
    assessment_criteria ac
JOIN 
    results res ON ac.id = res.criteria_id
JOIN 
    responses r ON res.response_id = r.id
GROUP BY 
    ac.assessment_id, r.student_id, ac.id;

-- Insert sample data only if tables are empty
-- This ensures we don't duplicate data on schema updates

-- Insert sample users if none exist
INSERT INTO users (email, password, first_name, last_name, role, q_number)
SELECT 'teacher1@example.com', '$2a$10$uJ5YQtYtTLJlRPbC0MXGz.7yZ0vtRJ.BtIOmKHw9/BGGPYxvgAfFS', 'John', 'Doe', 'teacher', NULL
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'teacher1@example.com');

INSERT INTO users (email, password, first_name, last_name, role, q_number)
SELECT 'teacher2@example.com', '$2a$10$uJ5YQtYtTLJlRPbC0MXGz.7yZ0vtRJ.BtIOmKHw9/BGGPYxvgAfFS', 'Jane', 'Smith', 'teacher', NULL
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'teacher2@example.com');

INSERT INTO users (email, password, first_name, last_name, role, q_number)
SELECT 'student1@example.com', '$2a$10$uJ5YQtYtTLJlRPbC0MXGz.7yZ0vtRJ.BtIOmKHw9/BGGPYxvgAfFS', 'Alice', 'Johnson', 'student', 'q1703022'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'student1@example.com');

INSERT INTO users (email, password, first_name, last_name, role, q_number)
SELECT 'student2@example.com', '$2a$10$uJ5YQtYtTLJlRPbC0MXGz.7yZ0vtRJ.BtIOmKHw9/BGGPYxvgAfFS', 'Bob', 'Brown', 'student', 'q1703023'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'student2@example.com');

INSERT INTO users (email, password, first_name, last_name, role, q_number)
SELECT 'student3@example.com', '$2a$10$uJ5YQtYtTLJlRPbC0MXGz.7yZ0vtRJ.BtIOmKHw9/BGGPYxvgAfFS', 'Charlie', 'Davis', 'student', 'q1703024'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'student3@example.com');

-- Insert sample courses if none exist
INSERT INTO courses (name, code, description)
SELECT 'Web Development', 'WEB101', 'Introduction to web development'
WHERE NOT EXISTS (SELECT 1 FROM courses WHERE code = 'WEB101');

INSERT INTO courses (name, code, description)
SELECT 'Project Management', 'PM202', 'Project management methodologies'
WHERE NOT EXISTS (SELECT 1 FROM courses WHERE code = 'PM202');

INSERT INTO courses (name, code, description)
SELECT 'Database Design', 'DB303', 'Database design and normalization'
WHERE NOT EXISTS (SELECT 1 FROM courses WHERE code = 'DB303');

-- Create variables for existing IDs
SET @teacher1_id = (SELECT id FROM users WHERE email = 'teacher1@example.com');
SET @teacher2_id = (SELECT id FROM users WHERE email = 'teacher2@example.com');
SET @student1_id = (SELECT id FROM users WHERE email = 'student1@example.com');
SET @student2_id = (SELECT id FROM users WHERE email = 'student2@example.com');
SET @student3_id = (SELECT id FROM users WHERE email = 'student3@example.com');
SET @course1_id = (SELECT id FROM courses WHERE code = 'WEB101');
SET @course2_id = (SELECT id FROM courses WHERE code = 'PM202');
SET @course3_id = (SELECT id FROM courses WHERE code = 'DB303');

-- Assign Teachers to Courses if not already assigned
INSERT INTO course_teachers (course_id, teacher_id)
SELECT @course1_id, @teacher1_id
WHERE @course1_id IS NOT NULL AND @teacher1_id IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM course_teachers WHERE course_id = @course1_id AND teacher_id = @teacher1_id);

INSERT INTO course_teachers (course_id, teacher_id)
SELECT @course2_id, @teacher2_id
WHERE @course2_id IS NOT NULL AND @teacher2_id IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM course_teachers WHERE course_id = @course2_id AND teacher_id = @teacher2_id);

INSERT INTO course_teachers (course_id, teacher_id)
SELECT @course3_id, @teacher1_id
WHERE @course3_id IS NOT NULL AND @teacher1_id IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM course_teachers WHERE course_id = @course3_id AND teacher_id = @teacher1_id);

-- Assign Students to Courses if not already assigned
INSERT INTO course_students (course_id, student_id)
SELECT @course1_id, @student1_id
WHERE @course1_id IS NOT NULL AND @student1_id IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM course_students WHERE course_id = @course1_id AND student_id = @student1_id);

INSERT INTO course_students (course_id, student_id)
SELECT @course1_id, @student2_id
WHERE @course1_id IS NOT NULL AND @student2_id IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM course_students WHERE course_id = @course1_id AND student_id = @student2_id);

INSERT INTO course_students (course_id, student_id)
SELECT @course1_id, @student3_id
WHERE @course1_id IS NOT NULL AND @student3_id IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM course_students WHERE course_id = @course1_id AND student_id = @student3_id);

INSERT INTO course_students (course_id, student_id)
SELECT @course2_id, @student1_id
WHERE @course2_id IS NOT NULL AND @student1_id IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM course_students WHERE course_id = @course2_id AND student_id = @student1_id);

INSERT INTO course_students (course_id, student_id)
SELECT @course2_id, @student2_id
WHERE @course2_id IS NOT NULL AND @student2_id IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM course_students WHERE course_id = @course2_id AND student_id = @student2_id);

INSERT INTO course_students (course_id, student_id)
SELECT @course3_id, @student3_id
WHERE @course3_id IS NOT NULL AND @student3_id IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM course_students WHERE course_id = @course3_id AND student_id = @student3_id);

-- Create Groups if they don't exist
INSERT INTO `groups` (name, course_id)
SELECT 'Group A', @course1_id
WHERE @course1_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM `groups` WHERE name = 'Group A' AND course_id = @course1_id);

INSERT INTO `groups` (name, course_id)
SELECT 'Group B', @course1_id  
WHERE @course1_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM `groups` WHERE name = 'Group B' AND course_id = @course1_id);

INSERT INTO `groups` (name, course_id)
SELECT 'Team 1', @course2_id
WHERE @course2_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM `groups` WHERE name = 'Team 1' AND course_id = @course2_id);

-- Create variables for group IDs
SET @group1_id = (SELECT id FROM `groups` WHERE name = 'Group A' AND course_id = @course1_id);
SET @group2_id = (SELECT id FROM `groups` WHERE name = 'Group B' AND course_id = @course1_id);
SET @group3_id = (SELECT id FROM `groups` WHERE name = 'Team 1' AND course_id = @course2_id);

-- Assign Students to Groups if not already assigned
INSERT INTO group_students (group_id, student_id)
SELECT @group1_id, @student1_id
WHERE @group1_id IS NOT NULL AND @student1_id IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM group_students WHERE group_id = @group1_id AND student_id = @student1_id);

INSERT INTO group_students (group_id, student_id)
SELECT @group1_id, @student2_id
WHERE @group1_id IS NOT NULL AND @student2_id IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM group_students WHERE group_id = @group1_id AND student_id = @student2_id);

INSERT INTO group_students (group_id, student_id)
SELECT @group2_id, @student3_id
WHERE @group2_id IS NOT NULL AND @student3_id IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM group_students WHERE group_id = @group2_id AND student_id = @student3_id);

INSERT INTO group_students (group_id, student_id)
SELECT @group3_id, @student1_id
WHERE @group3_id IS NOT NULL AND @student1_id IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM group_students WHERE group_id = @group3_id AND student_id = @student1_id);

INSERT INTO group_students (group_id, student_id)
SELECT @group3_id, @student2_id
WHERE @group3_id IS NOT NULL AND @student2_id IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM group_students WHERE group_id = @group3_id AND student_id = @student2_id);

-- Create Assessments if they don't exist
INSERT INTO assessments (title, description, course_id, group_id, teacher_id, due_date)
SELECT 'Peer Review - Web Project', 'Evaluate your team members\' contributions to the web project', @course1_id, @group1_id, @teacher1_id, DATE_ADD(NOW(), INTERVAL 7 DAY)
WHERE @course1_id IS NOT NULL AND @group1_id IS NOT NULL AND @teacher1_id IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM assessments WHERE title = 'Peer Review - Web Project' AND course_id = @course1_id);

INSERT INTO assessments (title, description, course_id, group_id, teacher_id, due_date)
SELECT 'Team Collaboration Assessment', 'Rate how well your team collaborated on the project', @course2_id, @group3_id, @teacher2_id, DATE_ADD(NOW(), INTERVAL 14 DAY)
WHERE @course2_id IS NOT NULL AND @group3_id IS NOT NULL AND @teacher2_id IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM assessments WHERE title = 'Team Collaboration Assessment' AND course_id = @course2_id);

-- Create variables for assessment IDs
SET @assessment1_id = (SELECT id FROM assessments WHERE title = 'Peer Review - Web Project' AND course_id = @course1_id);
SET @assessment2_id = (SELECT id FROM assessments WHERE title = 'Team Collaboration Assessment' AND course_id = @course2_id);

-- Create Assessment Criteria if they don't exist
INSERT INTO assessment_criteria (assessment_id, name, description, min_score, max_score)
SELECT @assessment1_id, 'Technical Skills', 'Evaluate technical coding abilities', 0, 10
WHERE @assessment1_id IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM assessment_criteria WHERE assessment_id = @assessment1_id AND name = 'Technical Skills');

INSERT INTO assessment_criteria (assessment_id, name, description, min_score, max_score)
SELECT @assessment1_id, 'Collaboration', 'Ability to work with others', 0, 10
WHERE @assessment1_id IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM assessment_criteria WHERE assessment_id = @assessment1_id AND name = 'Collaboration');

INSERT INTO assessment_criteria (assessment_id, name, description, min_score, max_score)
SELECT @assessment1_id, 'Communication', 'Clear and effective communication', 0, 10
WHERE @assessment1_id IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM assessment_criteria WHERE assessment_id = @assessment1_id AND name = 'Communication');

INSERT INTO assessment_criteria (assessment_id, name, description, min_score, max_score)
SELECT @assessment2_id, 'Leadership', 'Taking initiative and leading discussions', 0, 10
WHERE @assessment2_id IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM assessment_criteria WHERE assessment_id = @assessment2_id AND name = 'Leadership');

INSERT INTO assessment_criteria (assessment_id, name, description, min_score, max_score)
SELECT @assessment2_id, 'Time Management', 'Meeting deadlines and managing time effectively', 0, 10
WHERE @assessment2_id IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM assessment_criteria WHERE assessment_id = @assessment2_id AND name = 'Time Management');

-- Set variables for criteria IDs
SET @criteria1_id = (SELECT id FROM assessment_criteria WHERE assessment_id = @assessment1_id AND name = 'Technical Skills');
SET @criteria2_id = (SELECT id FROM assessment_criteria WHERE assessment_id = @assessment1_id AND name = 'Collaboration');
SET @criteria3_id = (SELECT id FROM assessment_criteria WHERE assessment_id = @assessment1_id AND name = 'Communication');

-- Sample Responses if they don't exist
INSERT INTO responses (assessment_id, student_id, feedback, submitted_at)
SELECT @assessment1_id, @student1_id, 'Bob was great at coding but could improve communication.', DATE_SUB(NOW(), INTERVAL 2 DAY)
WHERE @assessment1_id IS NOT NULL AND @student1_id IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM responses WHERE assessment_id = @assessment1_id AND student_id = @student1_id);

INSERT INTO responses (assessment_id, student_id, feedback, submitted_at)
SELECT @assessment1_id, @student2_id, 'Alice was an excellent collaborator and communicator.', DATE_SUB(NOW(), INTERVAL 3 DAY)
WHERE @assessment1_id IS NOT NULL AND @student2_id IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM responses WHERE assessment_id = @assessment1_id AND student_id = @student2_id);

-- Set variables for response IDs
SET @response1_id = (SELECT id FROM responses WHERE assessment_id = @assessment1_id AND student_id = @student1_id);
SET @response2_id = (SELECT id FROM responses WHERE assessment_id = @assessment1_id AND student_id = @student2_id);

-- Sample Results if they don't exist
-- Alice (ID @student1_id) evaluating Bob (ID @student2_id)
INSERT INTO results (response_id, criteria_id, student_id, given_score)
SELECT @response1_id, @criteria1_id, @student2_id, 9
WHERE @response1_id IS NOT NULL AND @criteria1_id IS NOT NULL AND @student2_id IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM results WHERE response_id = @response1_id AND criteria_id = @criteria1_id AND student_id = @student2_id);

INSERT INTO results (response_id, criteria_id, student_id, given_score)
SELECT @response1_id, @criteria2_id, @student2_id, 7
WHERE @response1_id IS NOT NULL AND @criteria2_id IS NOT NULL AND @student2_id IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM results WHERE response_id = @response1_id AND criteria_id = @criteria2_id AND student_id = @student2_id);

INSERT INTO results (response_id, criteria_id, student_id, given_score)
SELECT @response1_id, @criteria3_id, @student2_id, 6
WHERE @response1_id IS NOT NULL AND @criteria3_id IS NOT NULL AND @student2_id IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM results WHERE response_id = @response1_id AND criteria_id = @criteria3_id AND student_id = @student2_id);

-- Bob (ID @student2_id) evaluating Alice (ID @student1_id)
INSERT INTO results (response_id, criteria_id, student_id, given_score)
SELECT @response2_id, @criteria1_id, @student1_id, 8
WHERE @response2_id IS NOT NULL AND @criteria1_id IS NOT NULL AND @student1_id IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM results WHERE response_id = @response2_id AND criteria_id = @criteria1_id AND student_id = @student1_id);

INSERT INTO results (response_id, criteria_id, student_id, given_score)
SELECT @response2_id, @criteria2_id, @student1_id, 9
WHERE @response2_id IS NOT NULL AND @criteria2_id IS NOT NULL AND @student1_id IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM results WHERE response_id = @response2_id AND criteria_id = @criteria2_id AND student_id = @student1_id);

INSERT INTO results (response_id, criteria_id, student_id, given_score)
SELECT @response2_id, @criteria3_id, @student1_id, 9
WHERE @response2_id IS NOT NULL AND @criteria3_id IS NOT NULL AND @student1_id IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM results WHERE response_id = @response2_id AND criteria_id = @criteria3_id AND student_id = @student1_id);
