-- Sample projects
INSERT INTO projects (id, name, description, creator_user_id, created_date) VALUES (1, 'Mobile App Redesign', 'Redesign the mobile application with new UI/UX', 'manager@taskmanager.com', CURRENT_TIMESTAMP - INTERVAL '5 days');
INSERT INTO projects (id, name, description, creator_user_id, created_date) VALUES (2, 'Q2 Infrastructure Upgrade', 'Upgrade infrastructure for better performance and scalability', 'admin@taskmanager.com', CURRENT_TIMESTAMP - INTERVAL '3 days');
INSERT INTO projects (id, name, description, creator_user_id, created_date) VALUES (3, 'Security Audit', 'Comprehensive security audit of all systems', 'manager@taskmanager.com', CURRENT_TIMESTAMP - INTERVAL '1 day');

-- Sample tasks for Mobile App Redesign project
INSERT INTO tasks (id, title, description, status, project_id, assignee_user_id, created_date) VALUES (1, 'Design new login screen', 'Create mockups for the new login screen with modern UI', 'DONE', 1, 'dev@taskmanager.com', CURRENT_TIMESTAMP - INTERVAL '4 days');
INSERT INTO tasks (id, title, description, status, project_id, assignee_user_id, created_date) VALUES (2, 'Implement authentication flow', 'Integrate Keycloak authentication in mobile app', 'IN_PROGRESS', 1, 'dev@taskmanager.com', CURRENT_TIMESTAMP - INTERVAL '3 days');
INSERT INTO tasks (id, title, description, status, project_id, created_date) VALUES (3, 'User testing session', 'Conduct user testing with 10 participants', 'TODO', 1, CURRENT_TIMESTAMP - INTERVAL '2 days');

-- Sample tasks for Q2 Infrastructure Upgrade project
INSERT INTO tasks (id, title, description, status, project_id, assignee_user_id, created_date) VALUES (4, 'Migrate to PostgreSQL 16', 'Upgrade database to PostgreSQL 16', 'DONE', 2, 'dev@taskmanager.com', CURRENT_TIMESTAMP - INTERVAL '2 days');
INSERT INTO tasks (id, title, description, status, project_id, created_date) VALUES (5, 'Configure load balancer', 'Set up and configure load balancer for API servers', 'IN_PROGRESS', 2, CURRENT_TIMESTAMP - INTERVAL '1 day');
INSERT INTO tasks (id, title, description, status, project_id, created_date) VALUES (6, 'Performance benchmarking', 'Run performance tests and document results', 'TODO', 2, CURRENT_TIMESTAMP - INTERVAL '1 day');

-- Sample tasks for Security Audit project
INSERT INTO tasks (id, title, description, status, project_id, created_date) VALUES (7, 'Review authentication mechanisms', 'Audit all authentication and authorization flows', 'TODO', 3, CURRENT_TIMESTAMP - INTERVAL '1 day');
INSERT INTO tasks (id, title, description, status, project_id, created_date) VALUES (8, 'Penetration testing', 'External penetration testing of all public endpoints', 'TODO', 3, CURRENT_TIMESTAMP - INTERVAL '1 day');

-- Reset sequences
ALTER SEQUENCE projects_seq RESTART WITH 4;
ALTER SEQUENCE tasks_seq RESTART WITH 9;
