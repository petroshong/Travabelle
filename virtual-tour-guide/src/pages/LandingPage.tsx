import React, { useState } from 'react';
import { Search, MapPin, Clock, Star, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { tourAPI } from '../lib/supabase';
import { motion } from 'framer-motion';

const LandingPage: React.FC = () => {
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

  const handleCityClick = async (cityName: string) => {
    setIsLoading(true);
    setError('');

    try {
      // First, try to get existing city tours
      let cityData = await tourAPI.getCityTours(cityName);
      
      if (!cityData) {
        // If no existing tours, generate new ones
        console.log('Generating new tour for:', cityName);
        await tourAPI.generateCityTour(cityName);
        
        // Try to get the newly generated tour
        cityData = await tourAPI.getCityTours(cityName);
      }
      
      if (cityData) {
        // Navigate to tour page with city data
        navigate(`/tour/${encodeURIComponent(cityName)}`, {
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

  const popularTours = [
    {
      name: 'London City Tour',
      image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&h=600&fit=crop&crop=center',
      duration: '2 hours',
      distance: '1.3 miles',
      city: 'London'
    },
    {
      name: 'New York City Tour',
      image: 'https://images.unsplash.com/photo-1518391846015-55a9cc003b25?w=800&h=600&fit=crop&crop=center',
      duration: '2 hours',
      distance: '1.3 miles',
      city: 'New York'
    },
    {
      name: 'San Francisco City Tour',
      image: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&h=600&fit=crop&crop=center',
      duration: '2 hours',
      distance: '1.3 miles',
      city: 'San Francisco'
    },
    {
      name: 'Paris City Tour',
      image: 'https://images.unsplash.com/photo-1549144511-f099e773c147?w=800&h=600&fit=crop&crop=center',
      duration: '2 hours',
      distance: '1.3 miles',
      city: 'Paris'
    },
    {
      name: 'Seattle City Tour',
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&crop=center',
      duration: '2 hours',
      distance: '1.3 miles',
      city: 'Seattle'
    },
    {
      name: 'Tokyo City Tour',
      image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&h=600&fit=crop&crop=center',
      duration: '2 hours',
      distance: '1.3 miles',
      city: 'Tokyo'
    },
    {
      name: 'Barcelona City Tour',
      image: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=800&h=600&fit=crop&crop=center',
      duration: '2.5 hours',
      distance: '1.8 miles',
      city: 'Barcelona'
    },
    {
      name: 'Sydney City Tour',
      image: 'https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?w=800&h=600&fit=crop&crop=center',
      duration: '2 hours',
      distance: '1.5 miles',
      city: 'Sydney'
    }
  ];


  const popularCities = ['San Francisco', 'New York', 'Tokyo', 'London', 'Barcelona', 'Sydney'];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative h-screen overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800" style={{
        backgroundImage: 'url("https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=1920&h=1080&fit=crop&crop=center")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}>
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=1920&h=1080&fit=crop&crop=center"
            alt="Beautiful city skyline with mountains"
            className="w-full h-full object-cover object-center"
            onError={(e) => {
              console.log('Hero image failed to load');
              e.currentTarget.style.display = 'none';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/30 to-black/50"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 h-full flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-center p-6">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="text-white text-3xl font-bold"
            >
              Travabelle
            </motion.div>
            <motion.button
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
            >
              Sign In
            </motion.button>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex items-center justify-center px-6">
            <div className="text-center max-w-4xl w-full">
              {/* Main Heading */}
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-5xl md:text-7xl font-bold text-white mb-8 leading-tight"
              >
                What city do you want to explore?
              </motion.h1>

              {/* Search Bar */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="max-w-2xl mx-auto mb-8"
              >
                <form onSubmit={handleSearch} className="relative">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Enter a city name (Tokyo, Paris, New York, etc)"
                      className="w-full pl-6 pr-32 py-4 text-lg rounded-full border-2 border-white/30 bg-white/90 backdrop-blur-sm focus:outline-none focus:border-teal-400 focus:bg-white transition-all duration-300"
                      disabled={isLoading}
                    />
                    <button
                      type="submit"
                      disabled={isLoading || !searchQuery.trim()}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-teal-500 hover:bg-teal-600 disabled:bg-gray-400 text-white px-6 py-2 rounded-full font-semibold transition-all duration-300 flex items-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Finding Tour...
                        </>
                      ) : (
                        <>
                          <Search className="w-5 h-5" />
                          Find Tour
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
                    className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mt-4"
                  >
                    {error}
                  </motion.div>
                )}

                {/* Popular Cities */}
                <div className="mt-6">
                  <p className="text-white/80 mb-4 text-lg">Try these other popular destinations</p>
                  <div className="flex flex-wrap justify-center gap-3">
                    {popularCities.map((city) => (
                      <button
                        key={city}
                        onClick={() => handleCityClick(city)}
                        className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-4 py-2 rounded-full border border-white/30 hover:border-white/50 transition-all duration-300 text-sm font-medium"
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Walking Tours Section */}
      <section className="py-16 px-6 bg-white pb-20">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-teal-600 mb-6">
              Popular Walking Tours
            </h2>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {popularTours.map((tour, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer group relative border border-gray-200"
                onClick={() => handleCityClick(tour.city)}
              >
                <div className="relative h-64 overflow-hidden bg-gradient-to-br from-blue-400 to-purple-500">
                  <img
                    src={tour.image}
                    alt={tour.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      console.log(`Image failed to load for ${tour.city}:`, tour.image);
                      e.currentTarget.src = 'https://via.placeholder.com/800x600/4F46E5/FFFFFF?text=' + encodeURIComponent(tour.city);
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                  
                  {/* City Name Overlay - Top Left */}
                  <div className="absolute top-4 left-4 text-white">
                    <h3 className="font-bold text-xl">
                      {tour.city}
                    </h3>
                  </div>
                  
                  {/* Play Button Overlay - Center */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-white/90 backdrop-blur-sm rounded-full p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <Play className="w-6 h-6 text-teal-600" />
                    </div>
                  </div>

                  {/* Tour Details Overlay - Bottom */}
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span className="font-medium">{tour.duration}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span className="font-medium">{tour.distance}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;