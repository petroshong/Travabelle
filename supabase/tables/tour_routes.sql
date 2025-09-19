CREATE TABLE tour_routes (
    id SERIAL PRIMARY KEY,
    city_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    duration VARCHAR(100),
    difficulty VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);