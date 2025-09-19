import React, { useState } from 'react';
import { Search, MapPin, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { tourAPI } from '../lib/supabase';
import { motion } from 'framer-motion';

const CitySearch: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      // First, try to get existing city tours
      let cityData = await tourAPI.getCityTours(searchQuery.trim());
      
      if (!cityData) {
        // If no existing tours, generate new ones
        console.log('Generating new tour for:', searchQuery);
        await tourAPI.generateCityTour(searchQuery.trim());
        
        // Try to get the newly generated tour
        cityData = await tourAPI.getCityTours(searchQuery.trim());
      }
      
      if (cityData) {
        // Navigate to tour page with city data
        navigate(`/tour/${encodeURIComponent(searchQuery.trim())}`, {
          state: { cityData }
        });
      } else {
        setError('Unable to create tour for this city. Please try another city.');
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const popularCities = [
    'San Francisco',
    'New York',
    'Paris',
    'Tokyo',
    'London',
    'Rome'
  ];

  const handlePopularCityClick = (city: string) => {
    setSearchQuery(city);
  };

  return (
    <div className="w-full">
      {/* Search Form */}
      <form onSubmit={handleSearch} className="relative mb-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Enter any city name (e.g., Tokyo, Paris, New York)..."
            className="w-full pl-14 pr-32 py-4 text-lg rounded-full border-2 border-white/30 bg-white/90 backdrop-blur-sm focus:outline-none focus:border-orange-400 focus:bg-white transition-all duration-300"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !searchQuery.trim()}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white px-6 py-2 rounded-full font-semibold transition-all duration-300 flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating Tour...
              </>
            ) : (
              <>
                <MapPin className="w-5 h-5" />
                Start Tour
              </>
            )}
          </button>
        </div>
      </form>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6"
        >
          {error}
        </motion.div>
      )}

      {/* Popular Cities */}
      <div className="text-center">
        <p className="text-white/80 mb-4 text-lg">Or try these popular destinations:</p>
        <div className="flex flex-wrap justify-center gap-3">
          {popularCities.map((city) => (
            <button
              key={city}
              onClick={() => handlePopularCityClick(city)}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-4 py-2 rounded-full border border-white/30 hover:border-white/50 transition-all duration-300 text-sm font-medium"
            >
              {city}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CitySearch;