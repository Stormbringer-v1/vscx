-- Create default admin user
-- Password: admin123
INSERT INTO users (username, email, hashed_password, is_active, is_superuser, created_at)
VALUES (
    'admin',
    'admin@vscx.local',
    '$2b$12$24nkl3ebANZ8U5MQIhmtc.m4A8qJipZdYBrWFhuzZY4ANaPpmWMCa',
    true,
    true,
    NOW()
) ON CONFLICT (username) DO NOTHING;
