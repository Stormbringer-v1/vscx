-- Wait for tables to be created by alembic
-- This init script will be called after the tables exist

-- Create default admin user
-- Password: admin123
INSERT INTO users (username, email, hashed_password, is_active, is_superuser, created_at)
SELECT 
    'admin',
    'admin@vscx.local',
    '$2b$12$24nkl3ebANZ8U5MQIhmtc.m4A8qJipZdYBrWFhuzZY4ANaPpmWMCa',
    true,
    true,
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin');
