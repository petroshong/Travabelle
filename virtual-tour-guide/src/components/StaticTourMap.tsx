import React from 'react';
import { City, TourStop } from '../lib/supabase';
import { MapPin, Navigation, Clock } from 'lucide-react';

interface StaticTourMapProps {
  city: City;
  currentStop?: TourStop;
  allStops: TourStop[];
  onStopClick: (stopIndex: number) => void;
}

const StaticTourMap: React.FC<StaticTourMapProps> = ({ 
  city, 
  currentStop, 
  allStops, 
  onStopClick 
}) => {
  // Create a simple coordinate-based visualization
  const mapBounds = allStops.reduce(
    (bounds, stop) => ({
      minLat: Math.min(bounds.minLat, stop.coordinates.lat),
      maxLat: Math.max(bounds.maxLat, stop.coordinates.lat),
      minLng: Math.min(bounds.minLng, stop.coordinates.lng),
      maxLng: Math.max(bounds.maxLng, stop.coordinates.lng),
    }),
    {
      minLat: allStops[0]?.coordinates.lat || city.coordinates.lat,
      maxLat: allStops[0]?.coordinates.lat || city.coordinates.lat,
      minLng: allStops[0]?.coordinates.lng || city.coordinates.lng,
      maxLng: allStops[0]?.coordinates.lng || city.coordinates.lng,
    }
  );

  // Add padding to bounds
  const latPadding = (mapBounds.maxLat - mapBounds.minLat) * 0.1 || 0.01;
  const lngPadding = (mapBounds.maxLng - mapBounds.minLng) * 0.1 || 0.01;

  const adjustedBounds = {
    minLat: mapBounds.minLat - latPadding,
    maxLat: mapBounds.maxLat + latPadding,
    minLng: mapBounds.minLng - lngPadding,
    maxLng: mapBounds.maxLng + lngPadding,
  };

  // Convert coordinates to SVG coordinates
  const convertToSVG = (lat: number, lng: number) => {
    const x = ((lng - adjustedBounds.minLng) / (adjustedBounds.maxLng - adjustedBounds.minLng)) * 800;
    const y = ((adjustedBounds.maxLat - lat) / (adjustedBounds.maxLat - adjustedBounds.minLat)) * 600;
    return { x, y };
  };

  return (
    <div className="relative w-full h-full bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="absolute top-4 left-4 right-4 z-10">
        <div className="bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-lg border">
          <h3 className="font-semibold text-gray-900 mb-1">
            {city.name}, {city.country}
          </h3>
          <p className="text-sm text-gray-600 flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Interactive tour with {allStops.length} stops
          </p>
        </div>
      </div>

      {/* Simple coordinate-based visualization */}
      <div className="w-full h-full relative">
        <svg 
          viewBox="0 0 800 600" 
          className="w-full h-full"
          style={{ minHeight: '400px' }}
        >
          {/* Background grid */}
          <defs>
            <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#e5e7eb" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          {/* Tour route path */}
          {allStops.length > 1 && (
            <path
              d={`M ${allStops.map((stop, index) => {
                const { x, y } = convertToSVG(stop.coordinates.lat, stop.coordinates.lng);
                return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
              }).join(' ')}`}
              stroke="#3b82f6"
              strokeWidth="3"
              fill="none"
              strokeDasharray="5,5"
              opacity="0.6"
            />
          )}

          {/* Tour stops */}
          {allStops.map((stop, index) => {
            const { x, y } = convertToSVG(stop.coordinates.lat, stop.coordinates.lng);
            const isCurrentStop = currentStop?.id === stop.id;
            
            return (
              <g key={stop.id}>
                {/* Stop marker */}
                <circle
                  cx={x}
                  cy={y}
                  r={isCurrentStop ? 16 : 12}
                  fill={isCurrentStop ? '#f97316' : '#3b82f6'}
                  stroke="white"
                  strokeWidth="3"
                  className="cursor-pointer transition-all duration-200 hover:scale-110"
                  onClick={() => onStopClick(index)}
                />
                
                {/* Stop number */}
                <text
                  x={x}
                  y={y + 4}
                  textAnchor="middle"
                  fill="white"
                  fontSize="12"
                  fontWeight="bold"
                  className="pointer-events-none"
                >
                  {index + 1}
                </text>
                
                {/* Stop name (show on hover or if current) */}
                {isCurrentStop && (
                  <g>
                    <rect
                      x={x - 60}
                      y={y - 45}
                      width="120"
                      height="25"
                      fill="white"
                      stroke="#e5e7eb"
                      rx="4"
                      className="drop-shadow-sm"
                    />
                    <text
                      x={x}
                      y={y - 28}
                      textAnchor="middle"
                      fill="#374151"
                      fontSize="10"
                      fontWeight="600"
                      className="pointer-events-none"
                    >
                      {stop.name.length > 15 ? `${stop.name.substring(0, 15)}...` : stop.name}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Current stop info */}
      {currentStop && (
        <div className="absolute bottom-4 left-4 right-4 z-10">
          <div className="bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-lg border">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">{currentStop.name}</h4>
                <p className="text-sm text-gray-600 mb-2">{currentStop.category}</p>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    <span>{currentStop.address}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{currentStop.duration_minutes} min</span>
                  </div>
                </div>
              </div>
              <Navigation className="w-5 h-5 text-gray-400" />
            </div>
          </div>
        </div>
      )}

      {/* Google Maps alternative notice */}
      <div className="absolute top-4 right-4 z-10">
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs text-blue-700">
          Simplified map view
        </div>
      </div>
    </div>
  );
};

export default StaticTourMap;
