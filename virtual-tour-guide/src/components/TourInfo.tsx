import React from 'react';
import { MapPin, Clock, Star, Lightbulb, Navigation } from 'lucide-react';
import { TourStop, TourProgress, City } from '../lib/supabase';
import { motion } from 'framer-motion';

interface TourInfoProps {
  currentStop?: TourStop;
  tourProgress: TourProgress;
  cityData: { city: City; totalRoutes: number; totalStops: number };
}

const TourInfo: React.FC<TourInfoProps> = ({ currentStop, tourProgress, cityData }) => {
  const currentRoute = cityData.city.tour_routes?.[0];

  if (!tourProgress.isActive) {
    return (
      <div className="p-6">
        <div className="text-center mb-8">
          <img
            src="/images/world_map_destination_pins_europe_africa.jpg"
            alt="Virtual Tour"
            className="w-32 h-32 mx-auto rounded-lg object-cover mb-4"
          />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Ready to Explore {cityData.city.name}?
          </h3>
          <p className="text-gray-600">
            Click "Start Virtual Tour" to begin your immersive journey through this amazing city.
          </p>
        </div>

        {/* City Overview */}
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900">About This Tour</h4>
          <p className="text-sm text-gray-600 leading-relaxed">
            {cityData.city.description}
          </p>
          
          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{cityData.totalStops}</p>
              <p className="text-xs text-gray-600">Tour Stops</p>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <p className="text-2xl font-bold text-orange-600">{currentRoute?.duration}</p>
              <p className="text-xs text-gray-600">Duration</p>
            </div>
          </div>
        </div>

        {/* Tour Stops Preview */}
        {currentRoute?.tour_stops && (
          <div className="mt-6">
            <h4 className="font-semibold text-gray-900 mb-3">Tour Highlights</h4>
            <div className="space-y-2">
              {currentRoute.tour_stops.slice(0, 3).map((stop, index) => (
                <div key={stop.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-semibold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm text-gray-900">{stop.name}</p>
                    <p className="text-xs text-gray-600">{stop.category}</p>
                  </div>
                </div>
              ))}
              {currentRoute.tour_stops.length > 3 && (
                <p className="text-xs text-gray-500 text-center pt-2">
                  +{currentRoute.tour_stops.length - 3} more stops
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (!currentStop) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">No stop information available.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Current Stop Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
            {tourProgress.currentStop + 1}
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">{currentStop.name}</h3>
            <p className="text-sm text-orange-600 font-medium">{currentStop.category}</p>
          </div>
        </div>
      </div>

      {/* Stop Details */}
      <div className="space-y-4">
        <div>
          <h4 className="font-semibold text-gray-900 mb-2">About This Location</h4>
          <p className="text-sm text-gray-700 leading-relaxed">{currentStop.description}</p>
        </div>

        {/* Location Info */}
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-900">Address</p>
              <p className="text-sm text-gray-600">{currentStop.address}</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <Clock className="w-4 h-4 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-900">Recommended Visit Time</p>
              <p className="text-sm text-gray-600">{currentStop.duration_minutes} minutes</p>
            </div>
          </div>

          {currentStop.rating && (
            <div className="flex items-start gap-3">
              <Star className="w-4 h-4 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">Visitor Rating</p>
                <p className="text-sm text-gray-600">
                  {currentStop.rating} stars ({currentStop.total_ratings} reviews)
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Tips */}
        {currentStop.tips && currentStop.tips.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-4 h-4 text-orange-500" />
              <h4 className="font-semibold text-gray-900">Local Tips</h4>
            </div>
            <ul className="space-y-2">
              {currentStop.tips.map((tip, index) => (
                <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 flex-shrink-0"></span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Navigation to Next Stop */}
      {tourProgress.currentStop < tourProgress.totalStops - 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-50 to-orange-50 rounded-lg p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <Navigation className="w-4 h-4 text-blue-600" />
            <h4 className="font-semibold text-gray-900">Next Stop</h4>
          </div>
          {currentRoute?.tour_stops && currentRoute.tour_stops[tourProgress.currentStop + 1] && (
            <div>
              <p className="font-medium text-sm text-gray-900">
                {currentRoute.tour_stops[tourProgress.currentStop + 1].name}
              </p>
              <p className="text-xs text-gray-600">
                {currentRoute.tour_stops[tourProgress.currentStop + 1].category}
              </p>
            </div>
          )}
        </motion.div>
      )}

      {/* Tour Complete */}
      {tourProgress.currentStop >= tourProgress.totalStops - 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 text-center"
        >
          <h4 className="font-semibold text-gray-900 mb-2">Tour Complete!</h4>
          <p className="text-sm text-gray-600">
            Congratulations! You've completed your virtual tour of {cityData.city.name}.
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default TourInfo;