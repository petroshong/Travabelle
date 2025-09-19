CREATE TABLE tour_stops (
    id SERIAL PRIMARY KEY,
    route_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    coordinates JSONB NOT NULL,
    address TEXT,
    description TEXT,
    audio_script TEXT,
    audio_url VARCHAR(500),
    duration_minutes INTEGER,
    tips JSONB,
    stop_order INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);