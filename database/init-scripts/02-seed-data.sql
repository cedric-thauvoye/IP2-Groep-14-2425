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