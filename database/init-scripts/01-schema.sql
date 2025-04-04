USE peer_evaluation;

CREATE TABLE
  IF NOT EXISTS `assessments` (
    `id` int (11) NOT NULL AUTO_INCREMENT,
    `title` varchar(255) NOT NULL,
    `description` text DEFAULT NULL,
    `course_id` int (11) NOT NULL,
    `group_id` int (11) DEFAULT NULL,
    `teacher_id` int (11) NOT NULL,
    `due_date` timestamp NOT NULL,
    `created_at` timestamp NULL DEFAULT current_timestamp(),
    `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (`id`),
    KEY `course_id` (`course_id`),
    KEY `group_id` (`group_id`),
    KEY `teacher_id` (`teacher_id`)
  ) ENGINE = InnoDB AUTO_INCREMENT = 3 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

CREATE TABLE
  IF NOT EXISTS `assessment_criteria` (
    `id` int (11) NOT NULL AUTO_INCREMENT,
    `assessment_id` int (11) NOT NULL,
    `name` varchar(255) NOT NULL,
    `description` text DEFAULT NULL,
    `min_score` decimal(5, 2) NOT NULL,
    `max_score` decimal(5, 2) NOT NULL,
    PRIMARY KEY (`id`),
    KEY `assessment_id` (`assessment_id`)
  ) ENGINE = InnoDB AUTO_INCREMENT = 6 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

CREATE TABLE
  IF NOT EXISTS `average_results` (
    `assessment_id` int (11),
    `student_id` int (11),
    `criteria_id` int (11),
    `criteria_name` varchar(255),
    `average_score` decimal(9, 6)
  );

CREATE TABLE
  IF NOT EXISTS `courses` (
    `id` int (11) NOT NULL AUTO_INCREMENT,
    `name` varchar(255) NOT NULL,
    `code` varchar(50) NOT NULL,
    `description` text DEFAULT NULL,
    `created_at` timestamp NULL DEFAULT current_timestamp(),
    `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (`id`),
    UNIQUE KEY `code` (`code`)
  ) ENGINE = InnoDB AUTO_INCREMENT = 4 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

CREATE TABLE
  IF NOT EXISTS `course_students` (
    `id` int (11) NOT NULL AUTO_INCREMENT,
    `course_id` int (11) NOT NULL,
    `student_id` int (11) NOT NULL,
    `created_at` timestamp NULL DEFAULT current_timestamp(),
    PRIMARY KEY (`id`),
    UNIQUE KEY `course_id` (`course_id`, `student_id`),
    KEY `student_id` (`student_id`)
  ) ENGINE = InnoDB AUTO_INCREMENT = 19 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

CREATE TABLE
  IF NOT EXISTS `course_teachers` (
    `id` int (11) NOT NULL AUTO_INCREMENT,
    `course_id` int (11) NOT NULL,
    `teacher_id` int (11) NOT NULL,
    `created_at` timestamp NULL DEFAULT current_timestamp(),
    PRIMARY KEY (`id`),
    UNIQUE KEY `course_id` (`course_id`, `teacher_id`),
    KEY `check_teacher_role` (`teacher_id`)
  ) ENGINE = InnoDB AUTO_INCREMENT = 13 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

CREATE TABLE
  IF NOT EXISTS `groups` (
    `id` int (11) NOT NULL AUTO_INCREMENT,
    `name` varchar(255) NOT NULL,
    `course_id` int (11) NOT NULL,
    `created_at` timestamp NULL DEFAULT current_timestamp(),
    `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (`id`),
    KEY `course_id` (`course_id`)
  ) ENGINE = InnoDB AUTO_INCREMENT = 4 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

CREATE TABLE
  IF NOT EXISTS `group_students` (
    `id` int (11) NOT NULL AUTO_INCREMENT,
    `group_id` int (11) NOT NULL,
    `student_id` int (11) NOT NULL,
    `created_at` timestamp NULL DEFAULT current_timestamp(),
    PRIMARY KEY (`id`),
    UNIQUE KEY `group_id` (`group_id`, `student_id`),
    KEY `student_id` (`student_id`)
  ) ENGINE = InnoDB AUTO_INCREMENT = 16 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

CREATE TABLE
  IF NOT EXISTS `responses` (
    `id` int (11) NOT NULL AUTO_INCREMENT,
    `assessment_id` int (11) NOT NULL,
    `student_id` int (11) NOT NULL,
    `feedback` text DEFAULT NULL,
    `submitted_at` timestamp NULL DEFAULT current_timestamp(),
    PRIMARY KEY (`id`),
    UNIQUE KEY `assessment_id` (`assessment_id`, `student_id`),
    KEY `student_id` (`student_id`)
  ) ENGINE = InnoDB AUTO_INCREMENT = 6 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

CREATE TABLE
  IF NOT EXISTS `results` (
    `id` int (11) NOT NULL AUTO_INCREMENT,
    `response_id` int (11) NOT NULL,
    `criteria_id` int (11) NOT NULL,
    `student_id` int (11) NOT NULL,
    `given_score` decimal(5, 2) NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `response_id` (`response_id`, `criteria_id`, `student_id`),
    KEY `criteria_id` (`criteria_id`),
    KEY `student_id` (`student_id`)
  ) ENGINE = InnoDB AUTO_INCREMENT = 19 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

CREATE TABLE
  IF NOT EXISTS `users` (
    `id` int (11) NOT NULL AUTO_INCREMENT,
    `email` varchar(255) NOT NULL,
    `password` varchar(255) NOT NULL,
    `first_name` varchar(100) NOT NULL,
    `last_name` varchar(100) NOT NULL,
    `role` enum ('student', 'teacher', 'admin') NOT NULL DEFAULT 'student',
    `q_number` varchar(20) DEFAULT NULL,
    `created_at` timestamp NULL DEFAULT current_timestamp(),
    `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (`id`),
    UNIQUE KEY `email` (`email`)
  );

-- Constraints
ALTER TABLE `assessments` ADD CONSTRAINT `assessments_ibfk_1` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `assessments_ibfk_2` FOREIGN KEY (`group_id`) REFERENCES `groups` (`id`) ON DELETE SET NULL,
ADD CONSTRAINT `assessments_ibfk_3` FOREIGN KEY (`teacher_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

ALTER TABLE `assessment_criteria` ADD CONSTRAINT `assessment_criteria_ibfk_1` FOREIGN KEY (`assessment_id`) REFERENCES `assessments` (`id`) ON DELETE CASCADE;

ALTER TABLE `course_students` ADD CONSTRAINT `course_students_ibfk_1` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `course_students_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

ALTER TABLE `course_teachers` ADD CONSTRAINT `check_teacher_role` FOREIGN KEY (`teacher_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD CONSTRAINT `course_teachers_ibfk_1` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `course_teachers_ibfk_2` FOREIGN KEY (`teacher_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

ALTER TABLE `groups` ADD CONSTRAINT `groups_ibfk_1` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE;

ALTER TABLE `group_students` ADD CONSTRAINT `group_students_ibfk_1` FOREIGN KEY (`group_id`) REFERENCES `groups` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `group_students_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

ALTER TABLE `responses` ADD CONSTRAINT `responses_ibfk_1` FOREIGN KEY (`assessment_id`) REFERENCES `assessments` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `responses_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

ALTER TABLE `results` ADD CONSTRAINT `results_ibfk_1` FOREIGN KEY (`response_id`) REFERENCES `responses` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `results_ibfk_2` FOREIGN KEY (`criteria_id`) REFERENCES `assessment_criteria` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `results_ibfk_3` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

COMMIT;