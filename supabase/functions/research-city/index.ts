import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'false'
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { city } = await req.json();

    if (!city) {
      throw new Error('City name is required');
    }

    console.log(`Starting research for city: ${city}`);

    // Get API keys from environment variables (these are in your Supabase)
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
    const apifyApiToken = Deno.env.get('APIFY_API_TOKEN');
    const googleMapsApiKey = Deno.env.get('GOOGLE_MAPS_API_KEY') || 
                            Deno.env.get('google_map_api_key') ||
                            'AIzaSyCO0kKndUNlmQi3B5mxy4dblg_8WYcuKuk';

    console.log('API Keys available:', {
      anthropic: !!anthropicApiKey,
      apify: !!apifyApiToken,
      googleMaps: !!googleMapsApiKey
    });

    // Step 1: Get basic city data from Google Maps
    const basicCityData = await getBasicCityData(city, googleMapsApiKey);
    console.log('Basic city data retrieved:', basicCityData.city);
    
    // Step 2: Use Apify to get additional data (if available)
    let apifyData = {
      news: [],
      events: [],
      reviews: []
    };
    
    if (apifyApiToken) {
      try {
        console.log('Fetching Apify data...');
        apifyData = await fetchApifyData(city, apifyApiToken);
        console.log('Apify data retrieved successfully');
      } catch (error) {
        console.log('Apify data fetch failed, using fallback:', error.message);
      }
    } else {
      console.log('Apify API token not available, skipping web scraping');
    }

    // Step 3: Use Anthropic Claude for AI insights
    let aiInsights = {};
    if (anthropicApiKey) {
      try {
        console.log('Generating Claude AI insights...');
        aiInsights = await generateClaudeInsights(city, { ...basicCityData, ...apifyData }, anthropicApiKey);
        console.log('Claude insights generated successfully');
      } catch (error) {
        console.log('Claude API failed, using fallback:', error.message);
        aiInsights = createFallbackAIInsights(city);
      }
    } else {
      console.log('Anthropic API key not available, using fallback insights');
      aiInsights = createFallbackAIInsights(city);
    }

    // Combine all data
    const researchData = {
      city: basicCityData.city,
      country: basicCityData.country,
      population: basicCityData.population || 'Data not available',
      currency: basicCityData.currency || 'Local currency',
      language: basicCityData.language || ['Local language'],
      bestTimeToVisit: aiInsights.bestTimeToVisit || 'Year-round',
      weather: aiInsights.weather || 'Temperate climate',
      highlights: aiInsights.highlights || [`Explore ${city}`, `Cultural sites in ${city}`, `Local attractions`],
      culture: aiInsights.culture || [`Rich ${city} culture`, 'Welcoming locals', 'Traditional values'],
      food: aiInsights.food || [`Local ${city} specialties`, 'Traditional dishes', 'Street food'],
      transportation: aiInsights.transportation || ['Public transport', 'Walking', 'Taxis'],
      safety: aiInsights.safety || 'Standard travel precautions recommended',
      budget: aiInsights.budget || 'Moderate',
      news: apifyData.news || [],
      images: basicCityData.images || [],
      aiInsights: {
        summary: aiInsights.summary || `Discover the vibrant culture and attractions of ${city}, a fascinating destination with rich history and modern amenities.`,
        recommendations: aiInsights.recommendations || [
          `Visit the main attractions in ${city}`,
          'Explore local markets and shops',
          'Try traditional local cuisine',
          'Take walking tours of historic areas',
          'Experience the local nightlife'
        ],
        hiddenGems: aiInsights.hiddenGems || [
          'Local neighborhood cafes',
          'Off-the-beaten-path viewpoints',
          'Hidden local markets'
        ],
        culturalTips: aiInsights.culturalTips || [
          'Respect local customs and traditions',
          'Learn basic greetings in the local language',
          'Observe local dress codes when visiting religious sites'
        ]
      },
      lastUpdated: new Date().toISOString().split('T')[0]
    };

    console.log(`Research completed successfully for ${city}`);

    return new Response(JSON.stringify(researchData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Research error:', error);
    return new Response(JSON.stringify({
      error: {
        code: 'RESEARCH_FAILED',
        message: error.message
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Helper functions
async function getBasicCityData(city: string, googleMapsApiKey: string) {
  try {
    // Geocode the city
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(city)}&key=${googleMapsApiKey}`;
    const geocodeResponse = await fetch(geocodeUrl);
    const geocodeData = await geocodeResponse.json();

    if (geocodeData.results && geocodeData.results.length > 0) {
      const location = geocodeData.results[0];
      const addressComponents = location.address_components;
      
      // Extract city and country from address components
      let cityName = city;
      let countryName = 'Unknown';
      
      for (const component of addressComponents) {
        if (component.types.includes('locality')) {
          cityName = component.long_name;
        } else if (component.types.includes('country')) {
          countryName = component.long_name;
        }
      }

      return {
        city: cityName,
        country: countryName,
        coordinates: location.geometry.location,
        formattedAddress: location.formatted_address
      };
    }
  } catch (error) {
    console.log('Geocoding failed:', error);
  }

  return {
    city: city,
    country: 'Unknown',
    coordinates: null,
    formattedAddress: city
  };
}

async function fetchApifyData(city: string, apifyToken: string) {
  try {
    console.log(`Attempting to fetch Apify data for ${city}`);
    
    // Simple web search for city information
    const response = await fetch('https://api.apify.com/v2/acts/apify~google-search-scraper/run-sync-get-dataset-items', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apifyToken}`
      },
      body: JSON.stringify({
        queries: [`${city} travel guide latest news`, `${city} tourism attractions 2024`],
        maxPagesPerQuery: 2,
        resultsPerPage: 5
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Apify response received:', data.length, 'items');
      
      return {
        news: data.slice(0, 5) || [],
        events: [],
        reviews: []
      };
    } else {
      console.log('Apify API responded with error:', response.status);
    }
  } catch (error) {
    console.log('Apify data fetch failed:', error.message);
  }

  return {
    news: [],
    events: [],
    reviews: []
  };
}

async function generateClaudeInsights(city: string, data: any, apiKey: string) {
  try {
    console.log(`Generating Claude insights for ${city}`);
    
    const prompt = `You are an expert travel guide and cultural researcher. Please provide detailed travel insights for ${city}.

Respond with a valid JSON object containing:
{
  "summary": "A compelling 2-sentence overview highlighting what makes ${city} unique",
  "recommendations": ["5 specific must-do activities or places to visit"],
  "hiddenGems": ["3 lesser-known places most tourists miss"],
  "culturalTips": ["3-4 important cultural etiquette and practical tips"],
  "culture": ["3-4 key cultural characteristics and traditions"],
  "food": ["4-5 must-try local foods or dishes"],
  "transportation": ["3-4 main transportation options"],
  "safety": "Brief safety advice and current safety level",
  "budget": "Budget level: Budget/Moderate/Expensive/Luxury",
  "bestTimeToVisit": "Best months/season to visit",
  "weather": "Brief description of typical weather",
  "highlights": ["5 top attractions or experiences"]
}

Make it engaging, accurate, and practical for travelers. Focus on current, useful information.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    if (response.ok) {
      const claudeData = await response.json();
      const content = claudeData.content[0].text;
      
      console.log('Claude response received, parsing JSON...');
      
      try {
        // Extract JSON from the response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsedData = JSON.parse(jsonMatch[0]);
          console.log('Claude insights parsed successfully');
          return parsedData;
        } else {
          throw new Error('No JSON found in Claude response');
        }
      } catch (parseError) {
        console.log('JSON parsing failed, creating structured response from text');
        // If JSON parsing fails, create a structured response
        return {
          summary: content.substring(0, 300) + '...',
          recommendations: ['Explore local attractions', 'Try local cuisine', 'Visit cultural sites', 'Take walking tours', 'Experience nightlife'],
          hiddenGems: ['Local neighborhoods', 'Hidden cafes', 'Secret viewpoints'],
          culturalTips: ['Respect local customs', 'Learn basic phrases', 'Observe dress codes', 'Follow local etiquette'],
          culture: ['Rich history', 'Diverse traditions', 'Friendly locals', 'Cultural festivals'],
          food: ['Local specialties', 'Street food', 'Traditional dishes', 'Modern cuisine', 'Local beverages'],
          transportation: ['Public transport', 'Walking', 'Taxis', 'Ride-sharing'],
          safety: 'Standard travel precautions recommended',
          budget: 'Moderate',
          bestTimeToVisit: 'Year-round',
          weather: 'Temperate climate',
          highlights: ['City center', 'Historical sites', 'Museums', 'Parks', 'Markets']
        };
      }
    } else {
      console.log('Claude API responded with error:', response.status);
      throw new Error(`Claude API error: ${response.status}`);
    }
  } catch (error) {
    console.log('Claude API failed:', error.message);
    throw error;
  }
}

function createFallbackAIInsights(city: string) {
  return {
    summary: `${city} offers a unique blend of culture, history, and modern attractions waiting to be discovered by adventurous travelers. This vibrant destination provides countless opportunities for exploration and memorable experiences.`,
    recommendations: [
      `Explore the historic city center of ${city}`,
      'Visit local museums and cultural institutions',
      'Try authentic local cuisine at traditional restaurants',
      'Take guided walking tours of significant areas',
      'Experience the local markets and shopping districts'
    ],
    hiddenGems: [
      'Local neighborhood cafes frequented by residents',
      'Off-the-beaten-path scenic viewpoints',
      'Traditional markets away from tourist areas'
    ],
    culturalTips: [
      'Respect local customs and traditions',
      'Learn basic greetings in the local language',
      'Dress appropriately when visiting religious or cultural sites',
      'Observe local dining and social etiquette'
    ],
    culture: [`Rich cultural heritage of ${city}`, 'Welcoming and friendly locals', 'Traditional festivals and celebrations', 'Blend of historical and modern influences'],
    food: [`Traditional ${city} specialties`, 'Local street food favorites', 'Regional dishes and delicacies', 'Modern culinary scene', 'Local beverages and drinks'],
    transportation: ['Comprehensive public transportation system', 'Walking-friendly city areas', 'Local taxi and ride-sharing services', 'Bicycle rental options'],
    safety: 'Generally safe for tourists with standard travel precautions recommended. Stay aware of surroundings and keep valuables secure.',
    budget: 'Moderate',
    bestTimeToVisit: 'Year-round destination with seasonal variations',
    weather: 'Temperate climate with distinct seasons',
    highlights: [`Historic landmarks in ${city}`, 'Cultural attractions and museums', 'Local markets and shopping areas', 'Parks and recreational spaces', 'Dining and entertainment districts']
  };
}
