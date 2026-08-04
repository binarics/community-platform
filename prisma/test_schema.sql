-- Test schema for initial GitHub repo integration testing
-- Created via gh CLI authenticated session

CREATE TABLE IF NOT EXISTS test_users (
    id         SERIAL PRIMARY KEY,
    username   VARCHAR(50)  UNIQUE NOT NULL,
    email      VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS test_posts (
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER REFERENCES test_users(id) ON DELETE CASCADE,
    title      VARCHAR(200) NOT NULL,
    content    TEXT,
    published  BOOLEAN      DEFAULT false,
    created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- Sample data for testing
INSERT INTO test_users (username, email)
VALUES ('testuser', 'test@example.com')
ON CONFLICT (username) DO NOTHING;

INSERT INTO test_posts (user_id, title, content, published)
SELECT u.id, 'Hello World', 'This is a test post.', true
FROM test_users u
WHERE u.username = 'testuser'
ON CONFLICT DO NOTHING;
