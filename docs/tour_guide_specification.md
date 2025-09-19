# Virtual Tour Guide Application Specification

## Overview
A dynamic web application that provides immersive virtual walking tours of any city worldwide, starting with San Francisco as the showcase example.

## Core Features

### 1. Dynamic City Input
- Users can enter any city name worldwide
- Intelligent city search with autocomplete
- Fallback to major landmarks if city data is limited
- Real-time tour generation using Google Maps APIs

### 2. Interactive Tour Experience
- **Google Maps Integration**: Street View, satellite view, and interactive mapping
- **Voice Narration**: AI-generated audio descriptions for each location
- **Step-by-step Navigation**: Clear progression through tour stops
- **Rich Content**: Historical information, tips, and interesting facts
- **Mobile-Responsive**: Works seamlessly on phones and tablets

### 3. Tour Content Structure
- **Curated Tours**: Pre-built detailed tours (starting with SF)
- **Dynamic Tours**: AI-generated tours for any city using Places API
- **Multiple Routes**: Different themes (historic, cultural, scenic, etc.)
- **Flexible Duration**: 2-6 hour tour options

### 4. Technical Implementation

#### Frontend
- **Framework**: React with TypeScript
- **Styling**: Tailwind CSS for responsive design
- **Map Library**: Google Maps JavaScript API
- **Audio**: Web Audio API with generated voice narration

#### Backend
- **Database**: Supabase for tour data and user preferences
- **APIs**: Google Maps (Places, Directions, Street View)
- **Audio Generation**: Text-to-speech for location narration

#### Data Structure
```json
{
  "city": "San Francisco",
  "tour_routes": [
    {
      "name": "Classic Highlights",
      "stops": [
        {
          "name": "Union Square",
          "coordinates": {"lat": 37.7879, "lng": -122.4075},
          "audio_script": "Welcome to Union Square...",
          "duration_minutes": 15,
          "tips": ["Great starting point"]
        }
      ]
    }
  ]
}
```

## User Experience Flow

1. **Landing Page**: City search/input with SF as featured example
2. **Tour Selection**: Choose from available routes or generate new one
3. **Tour Experience**: 
   - Interactive map with current location highlighted
   - Audio narration for each stop
   - Street View integration
   - Next/Previous navigation
   - Progress tracking
4. **Tour Completion**: Summary and option to explore another city

## Success Metrics
- Seamless city search and tour generation
- High-quality audio narration
- Smooth map interactions
- Mobile-friendly experience
- Fast loading times
- Engaging content for any city

## Development Phases

### Phase 1: Foundation
- Set up Supabase backend
- Implement Google Maps integration
- Create SF tour data structure

### Phase 2: Core Features
- Build city search functionality
- Implement audio generation
- Create tour navigation system

### Phase 3: Enhancement
- Add dynamic tour generation
- Optimize mobile experience
- Implement user preferences

### Phase 4: Polish
- Performance optimization
- Advanced tour customization
- Social sharing features
