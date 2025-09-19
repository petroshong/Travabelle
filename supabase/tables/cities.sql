CREATE TABLE cities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    country VARCHAR(255) NOT NULL,
    description TEXT,
    coordinates JSONB,
    timezone VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);