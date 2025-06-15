USE peer_evaluation;

INSERT INTO
    `users` (
        `id`,
        `email`,
        `password`,
        `first_name`,
        `last_name`,
        `role`,
        `q_number`,
        `created_at`,
        `updated_at`
    )
VALUES
    (
        1,
        'cedric.thauvoye@student.odisee.be',
        '$2a$10$lrjKJx0l9WUbHWS7WQXG/.Gvmwi./.Rgo7DNVVmvxhdaB86dKy9Hm',
        'Cédric',
        'Thauvoye',
        'student',
        'q673209',
        '2025-03-28 21:01:13',
        '2025-04-01 12:18:39'
    ),
    (
        2,
        'sam.vanbuggenhout@odisee.be',
        '$2a$10$bIpmPj81.9BfPeoIFNTTluH/56Gln2c9awhJOfZzSO45OfBxdbz5.',
        'Sam',
        'Van Buggenhout',
        'teacher',
        NULL,
        '2025-03-28 21:01:16',
        '2025-04-03 21:42:00'
    ),
    (
        3,
        'nabil.zahmidi@student.odisee.be',
        '$2a$10$uJ5YQtYtTLJlRPbC0MXGz.7yZ0vtRJ.BtIOmKHw9/BGGPYxvgAfFS',
        'Nabil',
        'Zahmidi',
        'student',
        'q1703023',
        '2025-03-29 19:34:02',
        '2025-03-30 19:29:09'
    ),
    (
        4,
        'mohamed.elbaoudi@student.odisee.be',
        '$2a$10$KNO61UBJiSQUQMIXUVTh0edlx4Nl7x88Wfcnv4qgbF6ZwbjSmCURW',
        'Mohamed',
        'El Baoudi',
        'student',
        'q278837',
        '2025-04-03 16:37:58',
        '2025-04-03 16:37:58'
    );

-- Insert courses
INSERT INTO `courses` (`id`, `name`, `code`, `created_at`, `updated_at`)
VALUES
    (1, 'Web & Mobile', 'WEB101', NOW(), NOW()),
    (2, 'Advanced Web & Mobile', 'WEB202', NOW(), NOW()),
    (3, 'Workfield 2', 'WRK102', NOW(), NOW()),
    (4, 'Content Management', 'CM301', NOW(), NOW()),
    (5, 'International Week', 'INT100', NOW(), NOW());

-- Insert groups
INSERT INTO `groups` (`id`, `name`, `course_id`, `created_at`, `updated_at`)
VALUES
    (1, 'Group FinFlo', 1, NOW(), NOW()),
    (2, 'Group FinFlo', 2, NOW(), NOW()),
    (3, 'Group A06', 4, NOW(), NOW()),
    (4, 'Group 14', 5, NOW(), NOW()),
    (5, 'Group 15', 5, NOW(), NOW());

-- Assign students to courses
INSERT INTO `course_students` (`course_id`, `student_id`, `created_at`)
VALUES
    -- Cedric's courses
    (1, 1, NOW()),
    (2, 1, NOW()),
    (3, 1, NOW()),
    (4, 1, NOW()),
    (5, 1, NOW()),
    
    -- Nabil's courses
    (1, 3, NOW()),
    (2, 3, NOW()),
    (3, 3, NOW()),
    (4, 3, NOW()),
    (5, 3, NOW());

-- Assign students to groups
INSERT INTO `group_students` (`group_id`, `student_id`, `created_at`)
VALUES
    -- Cedric's groups
    (1, 1, NOW()),  -- Web & Mobile - Group FinFlo
    (2, 1, NOW()),  -- Advanced Web & Mobile - Group FinFlo
    (3, 1, NOW()),  -- Content Management - Group A06
    (4, 1, NOW()),  -- International Week - Group 14
    
    -- Nabil's groups
    (1, 3, NOW()),  -- Web & Mobile - Group FinFlo
    (2, 3, NOW()),  -- Advanced Web & Mobile - Group FinFlo
    (3, 3, NOW()),  -- Content Management - Group A06
    (5, 3, NOW());  -- International Week - Group 15

-- Assign teacher to courses
INSERT INTO `course_teachers` (`course_id`, `teacher_id`, `created_at`)
VALUES
    (1, 2, NOW()),  -- Sam teaches Web & Mobile
    (2, 2, NOW()),  -- Sam teaches Advanced Web & Mobile
    (3, 2, NOW()),  -- Sam teaches Workfield 2
    (4, 2, NOW()),  -- Sam teaches Content Management
    (5, 2, NOW());  -- Sam teaches International Week

-- Restore foreign key checks
SET FOREIGN_KEY_CHECKS = @OLD_FOREIGN_KEY_CHECKS;