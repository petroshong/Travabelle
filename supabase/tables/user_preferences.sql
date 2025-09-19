CREATE TABLE user_preferences (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    preferred_voice VARCHAR(255),
    preferred_duration VARCHAR(100),
    last_city VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);