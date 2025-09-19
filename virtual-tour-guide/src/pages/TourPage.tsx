import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, Users } from 'lucide-react';
import { City, tourAPI, TourProgress } from '../lib/supabase';
import TourMap from '../components/TourMap';
import TourControls from '../components/TourControls';
import TourInfo from '../components/TourInfo';
import AudioPlayer from '../components/AudioPlayer';
import LoadingSpinner from '../components/LoadingSpinner';
import CityInsights from '../components/CityInsights';
import { motion } from 'framer-motion';
import { useAudioManager } from '../hooks/useAudioManager';

const TourPage: React.FC = () => {
  const { cityName } = useParams<{ cityName: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [cityData, setCityData] = useState<{ city: City; totalRoutes: number; totalStops: number } | null>(
    location.state?.cityData || null
  );
  const [isLoading, setIsLoading] = useState(!cityData);
  const [error, setError] = useState('');
  const [tourProgress, setTourProgress] = useState<TourProgress>({
    currentStop: 0,
    visitedStops: [],
    totalStops: 0,
    isActive: false
  });
  const [showCityInsights, setShowCityInsights] = useState(false);
  const { stopAllAudio } = useAudioManager();

  useEffect(() => {
    const loadCityData = async () => {
      if (!cityData && cityName) {
        setIsLoading(true);
        setError('');
        
        try {
          const data = await tourAPI.getCityTours(decodeURIComponent(cityName));
          
          if (data) {
            setCityData(data);
            setTourProgress(prev => ({
              ...prev,
              totalStops: data.totalStops
            }));
          } else {
            setError('Tour not found. Redirecting to home...');
            setTimeout(() => navigate('/'), 3000);
          }
        } catch (err) {
          console.error('Error loading city data:', err);
          setError('Failed to load tour data. Please try again.');
        } finally {
          setIsLoading(false);
        }
      } else if (cityData) {
        setTourProgress(prev => ({
          ...prev,
          totalStops: cityData.totalStops
        }));
      }
    };

    loadCityData();
  }, [cityName, cityData, navigate]);

  const handleStartTour = () => {
    setTourProgress(prev => ({
      ...prev,
      currentStop: 0,
      visitedStops: [0],
      startTime: new Date(),
      isActive: true
    }));
    
    // Auto-switch to street view when starting tour
    setTimeout(() => {
      // This will trigger the street view to show automatically
      // The TourMap component will handle the street view initialization
    }, 1000);
  };

  const handleStopNavigation = (stopIndex: number) => {
    // Stop all current audio before navigating
    stopAllAudio();
    
    setTourProgress(prev => {
      const newVisitedStops = prev.visitedStops.includes(stopIndex)
        ? prev.visitedStops
        : [...prev.visitedStops, stopIndex];
      
      return {
        ...prev,
        currentStop: stopIndex,
        visitedStops: newVisitedStops
      };
    });
  };

  const handleNextStop = () => {
    if (cityData && tourProgress.currentStop < cityData.totalStops - 1) {
      // Stop all current audio
      stopAllAudio();
      handleStopNavigation(tourProgress.currentStop + 1);
    }
  };

  const handlePreviousStop = () => {
    if (tourProgress.currentStop > 0) {
      // Stop all current audio
      stopAllAudio();
      handleStopNavigation(tourProgress.currentStop - 1);
    }
  };

  const handleGenerateAudio = async (audioScript: string): Promise<string | null> => {
    try {
      // This would integrate with a TTS service to generate high-quality audio
      // For now, we'll return null to use browser TTS
      console.log('Audio generation requested for:', audioScript.substring(0, 50) + '...');
      
      // In a production environment, you would:
      // 1. Call a TTS service (OpenAI, Google Cloud TTS, ElevenLabs, etc.)
      // 2. Upload the generated audio to Supabase Storage
      // 3. Return the public URL
      
      return null;
    } catch (error) {
      console.error('Failed to generate audio:', error);
      return null;
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading your virtual tour..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Oops!</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  if (!cityData) {
    return null;
  }

  const currentRoute = cityData.city.tour_routes?.[0];
  const currentStop = currentRoute?.tour_stops?.[tourProgress.currentStop];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {cityData.city.name}, {cityData.city.country}
                </h1>
                <p className="text-sm text-gray-600">{currentRoute?.name}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>{currentRoute?.duration}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>{cityData.totalStops} stops</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users className="w-4 h-4" />
                <span>{currentRoute?.difficulty}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row h-[calc(100vh-80px)]">
        {/* Map Section */}
        <div className="lg:w-2/3 h-[50vh] lg:h-full relative">
          <TourMap
            city={cityData.city}
            currentStop={currentStop}
            allStops={currentRoute?.tour_stops || []}
            onStopClick={handleStopNavigation}
            onNextStop={handleNextStop}
            onPreviousStop={handlePreviousStop}
            autoStreetView={tourProgress.isActive}
          />
        </div>

        {/* Sidebar */}
        <div className="lg:w-1/3 flex flex-col bg-white border-l">
          {/* Tour Controls */}
          <div className="p-6 border-b">
            <TourControls
              tourProgress={tourProgress}
              onStartTour={handleStartTour}
              onNextStop={handleNextStop}
              onPreviousStop={handlePreviousStop}
              totalStops={cityData.totalStops}
            />
          </div>

          {/* Audio Player */}
          {currentStop && tourProgress.isActive && (
            <div className="p-6 border-b">
              <AudioPlayer
                audioScript={currentStop.audio_script}
                audioUrl={currentStop.audio_url}
                stopName={currentStop.name}
                onGenerateAudio={handleGenerateAudio}
                autoPlay={true}
                playerId={`stop-${tourProgress.currentStop}`}
              />
            </div>
          )}

          {/* Tour Information */}
          <div className="flex-1 overflow-y-auto">
            <TourInfo
              currentStop={currentStop}
              tourProgress={tourProgress}
              cityData={cityData}
            />
          </div>

          {/* City Insights */}
          {cityData && (
            <CityInsights
              cityName={cityData.city.name}
              isVisible={showCityInsights}
              onToggle={() => setShowCityInsights(!showCityInsights)}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default TourPage;