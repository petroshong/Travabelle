import React, { useState, useEffect } from 'react';
import { Brain, Globe, Star, MapPin, Clock, Users, TrendingUp, BookOpen, Camera, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CityInsightsData {
  city: string;
  country: string;
  population?: string;
  currency?: string;
  bestTimeToVisit?: string;
  weather?: string;
  highlights: string[];
  culture: string[];
  food: string[];
  transportation: string[];
  safety: string;
  budget: string;
  aiInsights: {
    summary: string;
    recommendations: string[];
    hiddenGems: string[];
    culturalTips: string[];
  };
  lastUpdated: string;
}

interface CityInsightsProps {
  cityName: string;
  isVisible: boolean;
  onToggle: () => void;
}

const CityInsights: React.FC<CityInsightsProps> = ({ cityName, isVisible, onToggle }) => {
  const [insightsData, setInsightsData] = useState<CityInsightsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isVisible && !insightsData) {
      // For now, show fallback data immediately
      setInsightsData(createFallbackInsights(cityName));
      
      // Also try to fetch real AI data in the background
      fetchCityInsights();
    }
  }, [isVisible, cityName]);

  const fetchCityInsights = async () => {
    setIsLoading(true);
    setError('');

    try {
      // Check if we have the required environment variables
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        throw new Error('Supabase configuration missing');
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/research-city`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ city: cityName }),
      });

      if (!response.ok) {
        throw new Error(`Supabase function not available (${response.status})`);
      }

      const data = await response.json();
      setInsightsData(data);
      console.log('AI insights loaded successfully:', data);
    } catch (err) {
      console.error('Insights error:', err);
      setError('AI insights not available - showing fallback data');
      // Keep the fallback data that was already set
    } finally {
      setIsLoading(false);
    }
  };

  const createFallbackInsights = (city: string): CityInsightsData => {
    // Create more specific fallback data based on the city
    const citySpecificData = getCitySpecificFallback(city);
    
    return {
      city,
      country: citySpecificData.country,
      population: citySpecificData.population,
      currency: citySpecificData.currency,
      bestTimeToVisit: citySpecificData.bestTimeToVisit,
      weather: citySpecificData.weather,
      highlights: citySpecificData.highlights,
      culture: citySpecificData.culture,
      food: citySpecificData.food,
      transportation: citySpecificData.transportation,
      safety: citySpecificData.safety,
      budget: citySpecificData.budget,
      aiInsights: {
        summary: citySpecificData.summary,
        recommendations: citySpecificData.recommendations,
        hiddenGems: citySpecificData.hiddenGems,
        culturalTips: citySpecificData.culturalTips
      },
      lastUpdated: new Date().toISOString().split('T')[0]
    };
  };

  const getCitySpecificFallback = (city: string) => {
    const cityLower = city.toLowerCase();
    
    if (cityLower.includes('san francisco') || cityLower.includes('sf')) {
      return {
        country: 'United States',
        population: '873,965',
        currency: 'USD ($)',
        bestTimeToVisit: 'September to November',
        weather: 'Mediterranean climate with cool summers',
        highlights: ['Golden Gate Bridge', 'Alcatraz Island', 'Fisherman\'s Wharf', 'Lombard Street', 'Union Square'],
        culture: ['Tech innovation hub', 'Diverse neighborhoods', 'LGBTQ+ friendly', 'Artistic community'],
        food: ['Sourdough bread', 'Dungeness crab', 'Mission burritos', 'Ghirardelli chocolate', 'Wine from Napa Valley'],
        transportation: ['Cable cars', 'BART system', 'Uber/Lyft', 'Walking-friendly'],
        safety: 'Generally safe, be cautious in Tenderloin and SOMA areas at night',
        budget: 'Expensive',
        summary: 'San Francisco is a vibrant city known for its iconic Golden Gate Bridge, steep hills, diverse culture, and thriving tech scene. It offers a perfect blend of historic charm and modern innovation.',
        recommendations: [
          'Walk across the Golden Gate Bridge at sunset',
          'Take a ferry to Alcatraz Island',
          'Explore the colorful houses of the Painted Ladies',
          'Ride a historic cable car',
          'Visit the bustling Ferry Building marketplace'
        ],
        hiddenGems: [
          'Sutro Baths ruins with ocean views',
          'Hidden stairways in Telegraph Hill',
          'Local coffee shops in the Mission District'
        ],
        culturalTips: [
          'Layer clothing - weather changes quickly',
          'Be prepared for hills and walking',
          'Respect the local tech culture and startup scene'
        ]
      };
    } else if (cityLower.includes('paris')) {
      return {
        country: 'France',
        population: '2.1 million',
        currency: 'EUR (€)',
        bestTimeToVisit: 'April to June, September to October',
        weather: 'Temperate with mild winters and warm summers',
        highlights: ['Eiffel Tower', 'Louvre Museum', 'Notre-Dame', 'Champs-Élysées', 'Montmartre'],
        culture: ['Art and culture capital', 'Romantic atmosphere', 'Café culture', 'Fashion hub'],
        food: ['Croissants', 'Escargot', 'Coq au vin', 'Macarons', 'Wine and cheese'],
        transportation: ['Metro system', 'Walking', 'Bicycle rentals', 'Taxis'],
        safety: 'Generally safe, beware of pickpockets in tourist areas',
        budget: 'Moderate to Expensive',
        summary: 'Paris, the City of Light, is renowned for its art, fashion, cuisine, and romantic ambiance. It\'s a city where history meets modernity in the most elegant way.',
        recommendations: [
          'Visit the Louvre and see the Mona Lisa',
          'Climb the Eiffel Tower for city views',
          'Stroll along the Seine River',
          'Explore the charming Montmartre district',
          'Enjoy a café au lait at a sidewalk café'
        ],
        hiddenGems: [
          'Secret passages and covered arcades',
          'Hidden gardens like Square du Vert-Galant',
          'Local boulangeries off the beaten path'
        ],
        culturalTips: [
          'Learn basic French phrases',
          'Dress stylishly - Parisians value fashion',
          'Respect meal times and café culture'
        ]
      };
    } else {
      // Generic fallback for other cities
      return {
        country: 'Unknown',
        population: 'Data not available',
        currency: 'Local currency',
        bestTimeToVisit: 'Year-round',
        weather: 'Temperate climate',
        highlights: [`Explore ${city}`, `Cultural sites in ${city}`, `Local attractions`],
        culture: [`Rich ${city} culture`, 'Welcoming locals', 'Traditional values'],
        food: [`Local ${city} specialties`, 'Traditional dishes', 'Street food'],
        transportation: ['Public transport', 'Walking', 'Taxis'],
        safety: 'Standard travel precautions recommended',
        budget: 'Moderate',
        summary: `Discover the vibrant culture and attractions of ${city}, a fascinating destination with rich history and modern amenities.`,
        recommendations: [
          `Visit the main attractions in ${city}`,
          'Explore local markets and shops',
          'Try traditional local cuisine',
          'Take walking tours of historic areas',
          'Experience the local nightlife'
        ],
        hiddenGems: [
          'Local neighborhood cafes',
          'Off-the-beaten-path viewpoints',
          'Hidden local markets'
        ],
        culturalTips: [
          'Respect local customs and traditions',
          'Learn basic greetings in the local language',
          'Observe local dress codes when visiting religious sites'
        ]
      };
    }
  };

  return (
    <div className="border-t bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between hover:bg-purple-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Brain className="w-6 h-6 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">AI City Insights</h3>
          {isLoading && (
            <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          )}
        </div>
        {isVisible ? (
          <ChevronUp className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        )}
      </button>

      {/* Content */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-6">
              {error && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 text-sm">
                  {error} - Showing fallback data
                </div>
              )}

              {insightsData && (
                <>
                  {/* AI Summary */}
                  <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 rounded-lg p-4 text-white">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      AI-Generated Summary
                    </h4>
                    <p className="text-sm leading-relaxed opacity-90">
                      {insightsData.aiInsights.summary}
                    </p>
                  </div>

                  {/* Quick Facts */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <Users className="w-4 h-4 text-blue-600 mb-1" />
                      <p className="text-xs text-gray-500">Population</p>
                      <p className="text-sm font-medium">{insightsData.population}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <Globe className="w-4 h-4 text-green-600 mb-1" />
                      <p className="text-xs text-gray-500">Currency</p>
                      <p className="text-sm font-medium">{insightsData.currency}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <Clock className="w-4 h-4 text-purple-600 mb-1" />
                      <p className="text-xs text-gray-500">Best Time</p>
                      <p className="text-sm font-medium">{insightsData.bestTimeToVisit}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <TrendingUp className="w-4 h-4 text-orange-600 mb-1" />
                      <p className="text-xs text-gray-500">Budget</p>
                      <p className="text-sm font-medium">{insightsData.budget}</p>
                    </div>
                  </div>

                  {/* Top Recommendations */}
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-500" />
                      Top Recommendations
                    </h4>
                    <ul className="space-y-2">
                      {insightsData.aiInsights.recommendations.slice(0, 3).map((rec, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-gray-700">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Hidden Gems */}
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-purple-600" />
                      Hidden Gems
                    </h4>
                    <ul className="space-y-2">
                      {insightsData.aiInsights.hiddenGems.map((gem, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <div className="w-1.5 h-1.5 bg-purple-600 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-gray-700">{gem}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Cultural Tips */}
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-indigo-600" />
                      Cultural Tips
                    </h4>
                    <ul className="space-y-2">
                      {insightsData.aiInsights.culturalTips.slice(0, 2).map((tip, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-gray-700">{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Must-Try Foods */}
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Camera className="w-4 h-4 text-orange-600" />
                      Must-Try Foods
                    </h4>
                    <ul className="space-y-2">
                      {insightsData.food.slice(0, 3).map((food, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <div className="w-1.5 h-1.5 bg-orange-600 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-gray-700">{food}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Safety Info */}
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      🛡️ Safety
                    </h4>
                    <p className="text-sm text-gray-700">{insightsData.safety}</p>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CityInsights;
