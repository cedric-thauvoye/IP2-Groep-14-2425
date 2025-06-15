/*
 * MySQL Triggers for Database Rules
 * 
 * INSTRUCTIONS:
 * 1. Connect to your MySQL database
 * 2. Run this file separately after the main schema
 * 3. Execute each trigger block separately if you encounter DELIMITER issues
 */

-- Teacher role check trigger
CREATE TRIGGER check_teacher_role_before_insert
BEFORE INSERT ON course_teachers
FOR EACH ROW
BEGIN
    DECLARE user_role VARCHAR(50);
    SELECT role INTO user_role FROM users WHERE id = NEW.teacher_id;
    
    IF user_role != 'teacher' AND user_role != 'admin' THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Only users with teacher or admin role can be added as course teachers';
    END IF;
END;

-- Prevent role changes trigger
CREATE TRIGGER prevent_teacher_role_change
BEFORE UPDATE ON users
FOR EACH ROW
BEGIN
    IF OLD.role IN ('teacher', 'admin') AND NEW.role = 'student' THEN
        -- Check if user is a teacher for any course
        DECLARE course_count INT;
        SELECT COUNT(*) INTO course_count FROM course_teachers WHERE teacher_id = OLD.id;
        
        IF course_count > 0 THEN
            SIGNAL SQLSTATE '45000' 
            SET MESSAGE_TEXT = 'Cannot change role to student: user is a teacher for one or more courses';
        END IF;
    END IF;
END;
