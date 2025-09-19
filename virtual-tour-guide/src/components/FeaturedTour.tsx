import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, MapPin, Star, Play } from 'lucide-react';
import { motion } from 'framer-motion';

const FeaturedTour: React.FC = () => {
  const navigate = useNavigate();

  const handleStartTour = () => {
    navigate('/tour/San Francisco');
  };

  const highlights = [
    {
      name: 'Union Square',
      image: '/images/union_square_san_francisco_aerial_shopping_district_tour_stop.jpg',
      description: 'Shopping and cultural heart of the city'
    },
    {
      name: 'Golden Gate Bridge',
      image: '/images/golden_gate_bridge_tourist_plaza_san_francisco.jpg',
      description: 'Iconic suspension bridge and engineering marvel'
    },
    {
      name: 'Chinatown Gate',
      image: '/images/union_square_san_francisco_plaza_shopping_district_daytime.jpg',
      description: 'Oldest Chinatown in North America'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="bg-white rounded-2xl shadow-2xl overflow-hidden"
    >
      {/* Main Image */}
      <div className="relative h-80 md:h-96">
        <img
          src="/images/san_francisco_golden_gate_bridge_sunrise_hero_image.jpg"
          alt="San Francisco Tour"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
        
        {/* Play Button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleStartTour}
            className="bg-orange-500 hover:bg-orange-600 text-white rounded-full p-6 shadow-2xl transition-colors duration-300"
          >
            <Play className="w-8 h-8 ml-1" fill="currentColor" />
          </motion.button>
        </div>

        {/* Tour Badge */}
        <div className="absolute top-6 left-6">
          <span className="bg-orange-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
            Featured Tour
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-8">
        <div className="mb-6">
          <h3 className="text-3xl font-bold text-gray-900 mb-3">
            Classic San Francisco Highlights
          </h3>
          <p className="text-gray-600 text-lg leading-relaxed">
            Experience San Francisco's most iconic landmarks and neighborhoods on this comprehensive virtual walking tour. From Union Square to the Golden Gate Bridge, discover the stories and secrets that make this city unique.
          </p>
        </div>

        {/* Tour Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-orange-500" />
            <div>
              <p className="font-semibold text-gray-900">4-5 Hours</p>
              <p className="text-sm text-gray-600">Total Duration</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <MapPin className="w-6 h-6 text-orange-500" />
            <div>
              <p className="font-semibold text-gray-900">6 Stops</p>
              <p className="text-sm text-gray-600">Key Locations</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Star className="w-6 h-6 text-orange-500" />
            <div>
              <p className="font-semibold text-gray-900">Premium</p>
              <p className="text-sm text-gray-600">Experience</p>
            </div>
          </div>
        </div>

        {/* Highlights */}
        <div className="mb-8">
          <h4 className="text-xl font-semibold text-gray-900 mb-4">Tour Highlights</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {highlights.map((highlight, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-4">
                <img
                  src={highlight.image}
                  alt={highlight.name}
                  className="w-full h-32 object-cover rounded-lg mb-3"
                />
                <h5 className="font-semibold text-gray-900 mb-1">{highlight.name}</h5>
                <p className="text-sm text-gray-600">{highlight.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Button */}
        <div className="text-center">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleStartTour}
            className="bg-gradient-to-r from-blue-600 to-orange-600 hover:from-blue-700 hover:to-orange-700 text-white px-8 py-4 rounded-full text-lg font-semibold shadow-lg transition-all duration-300"
          >
            Start San Francisco Tour
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default FeaturedTour;