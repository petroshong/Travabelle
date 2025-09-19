import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://oamyhuhietubtcrevkph.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hbXlodWhpZXR1YnRjcmV2a3BoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzMDQyMjMsImV4cCI6MjA3Mzg4MDIyM30.qj2lOfl_TaRWzZtAl-QCUq2Z9W0wDWfpCTgecwz7Fnw";

// Create Supabase client instance
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for our database
export interface City {
  id: number;
  name: string;
  country: string;
  description: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  timezone?: string;
  created_at?: string;
  tour_routes?: TourRoute[];
}

export interface TourRoute {
  id: number;
  city_id: number;
  name: string;
  description: string;
  duration: string;
  difficulty: string;
  created_at?: string;
  tour_stops?: TourStop[];
}

export interface TourStop {
  id: number;
  route_id: number;
  name: string;
  category: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  address: string;
  description: string;
  audio_script: string;
  audio_url?: string;
  duration_minutes: number;
  tips: string[];
  stop_order: number;
  created_at?: string;
  rating?: number;
  total_ratings?: number;
}

export interface TourProgress {
  currentStop: number;
  visitedStops: number[];
  totalStops: number;
  startTime?: Date;
  isActive: boolean;
}

// API functions
export const tourAPI = {
  async getCityTours(cityName: string, country?: string): Promise<{ city: City; totalRoutes: number; totalStops: number } | null> {
    try {
      const params = new URLSearchParams({ cityName });
      if (country) params.append('country', country);
      
      // Use direct fetch call to the edge function
      const response = await fetch(`${supabaseUrl}/functions/v1/get-city-tours?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'apikey': supabaseAnonKey
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch city tours: ${response.status}`);
      }
      
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching city tours:', error);
      return null;
    }
  },

  async generateCityTour(cityName: string, country?: string): Promise<any> {
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/generate-city-tour`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'apikey': supabaseAnonKey
        },
        body: JSON.stringify({ cityName, country })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to generate city tour: ${response.status}`);
      }
      
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error generating city tour:', error);
      throw error;
    }
  }
};
