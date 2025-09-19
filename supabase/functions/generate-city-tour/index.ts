Deno.serve(async (req) => {
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
        const { cityName, country } = await req.json();

        if (!cityName) {
            throw new Error('City name is required');
        }

        // Get environment variables
        // TODO: In production, set GOOGLE_MAPS_API_KEY in Supabase project environment variables
        const googleMapsApiKey = Deno.env.get('GOOGLE_MAPS_API_KEY') || 
                                 Deno.env.get('google_map_api_key') ||
                                 'AIzaSyCO0kKndUNlmQi3B5mxy4dblg_8WYcuKuk'; // Temporary fallback - REMOVE IN PRODUCTION
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!googleMapsApiKey) {
            console.error('Google Maps API key not found in environment variables');
            throw new Error('Google Maps API key not configured. Please set GOOGLE_MAPS_API_KEY environment variable.');
        }

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        // First, geocode the city to get coordinates
        const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(cityName + (country ? ', ' + country : ''))}&key=${googleMapsApiKey}`;
        
        const geocodeResponse = await fetch(geocodeUrl);
        const geocodeData = await geocodeResponse.json();

        if (!geocodeData.results || geocodeData.results.length === 0) {
            throw new Error('City not found');
        }

        const cityLocation = geocodeData.results[0].geometry.location;
        const formattedAddress = geocodeData.results[0].formatted_address;
        const addressComponents = geocodeData.results[0].address_components;
        
        // Extract country from address components
        const countryComponent = addressComponents.find(component => 
            component.types.includes('country')
        );
        const detectedCountry = countryComponent ? countryComponent.long_name : country || 'Unknown';

        // Search for tourist attractions in the city
        const placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${cityLocation.lat},${cityLocation.lng}&radius=10000&type=tourist_attraction&key=${googleMapsApiKey}`;
        
        const placesResponse = await fetch(placesUrl);
        const placesData = await placesResponse.json();

        if (!placesData.results || placesData.results.length === 0) {
            throw new Error('No tourist attractions found for this city');
        }

        // Get top 6 attractions (or less if not available)
        const topAttractions = placesData.results
            .filter(place => place.rating && place.rating >= 4.0)
            .sort((a, b) => {
                // Sort by rating and number of reviews
                const scoreA = (a.rating || 0) * Math.log(a.user_ratings_total || 1);
                const scoreB = (b.rating || 0) * Math.log(b.user_ratings_total || 1);
                return scoreB - scoreA;
            })
            .slice(0, 6);

        // Generate detailed information for each attraction
        const tourStops = [];
        
        for (let i = 0; i < topAttractions.length; i++) {
            const place = topAttractions[i];
            
            // Get detailed place information
            const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_address,geometry,types,rating,user_ratings_total,opening_hours,website,formatted_phone_number&key=${googleMapsApiKey}`;
            
            const detailsResponse = await fetch(detailsUrl);
            const detailsData = await detailsResponse.json();
            
            if (detailsData.result) {
                const placeDetails = detailsData.result;
                
                // Generate category based on place types
                let category = 'Attraction';
                if (placeDetails.types.includes('museum')) category = 'Museum';
                else if (placeDetails.types.includes('park')) category = 'Park';
                else if (placeDetails.types.includes('place_of_worship')) category = 'Religious Site';
                else if (placeDetails.types.includes('shopping_mall')) category = 'Shopping';
                else if (placeDetails.types.includes('amusement_park')) category = 'Entertainment';
                else if (placeDetails.types.includes('natural_feature')) category = 'Natural Landmark';
                else if (placeDetails.types.includes('establishment')) category = 'Landmark';

                // Generate audio script
                const audioScript = `Welcome to ${placeDetails.name}, one of the must-see attractions in ${cityName}. This ${category.toLowerCase()} is highly rated by visitors with ${placeDetails.rating} stars from ${placeDetails.user_ratings_total} reviews. Located at ${placeDetails.formatted_address}, this destination offers a unique experience that captures the essence of ${cityName}. Take your time to explore and appreciate what makes this place special.`;

                // Generate tips based on place type and information
                const tips = [];
                if (placeDetails.opening_hours) {
                    tips.push('Check opening hours before visiting');
                }
                if (placeDetails.website) {
                    tips.push('Visit the official website for more information');
                }
                if (placeDetails.types.includes('museum')) {
                    tips.push('Allow 1-2 hours for your visit');
                }
                if (placeDetails.types.includes('park')) {
                    tips.push('Great for photos and relaxation');
                }
                tips.push('Popular with visitors - arrive early to avoid crowds');

                tourStops.push({
                    name: placeDetails.name,
                    category: category,
                    coordinates: {
                        lat: placeDetails.geometry.location.lat,
                        lng: placeDetails.geometry.location.lng
                    },
                    address: placeDetails.formatted_address,
                    description: `A highly-rated ${category.toLowerCase()} in ${cityName}, known for its ${placeDetails.rating}-star rating from ${placeDetails.user_ratings_total} visitor reviews.`,
                    audio_script: audioScript,
                    duration_minutes: 20 + (i * 5), // Varying durations
                    tips: tips,
                    stop_order: i + 1,
                    rating: placeDetails.rating,
                    total_ratings: placeDetails.user_ratings_total
                });
            }
        }

        if (tourStops.length === 0) {
            throw new Error('No suitable attractions found for tour generation');
        }

        // Check if city already exists in database
        const existingCityResponse = await fetch(`${supabaseUrl}/rest/v1/cities?name=eq.${encodeURIComponent(cityName)}&country=eq.${encodeURIComponent(detectedCountry)}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            }
        });

        let cityId;
        const existingCities = await existingCityResponse.json();
        
        if (existingCities && existingCities.length > 0) {
            cityId = existingCities[0].id;
        } else {
            // Create new city
            const cityData = {
                name: cityName,
                country: detectedCountry,
                description: `Discover the highlights of ${cityName}, a vibrant destination in ${detectedCountry}. This dynamic tour will take you through the city's most popular attractions and landmarks.`,
                coordinates: cityLocation,
                timezone: 'UTC' // Default timezone, could be improved with timezone API
            };

            const cityResponse = await fetch(`${supabaseUrl}/rest/v1/cities`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(cityData)
            });

            if (!cityResponse.ok) {
                throw new Error('Failed to create city record');
            }

            const cityResult = await cityResponse.json();
            cityId = cityResult[0].id;
        }

        // Create or update tour route
        const routeData = {
            city_id: cityId,
            name: `${cityName} Highlights Tour`,
            description: `Explore the best of ${cityName} with this comprehensive tour of top-rated attractions and landmarks.`,
            duration: `${Math.ceil(tourStops.length * 0.5)}-${Math.ceil(tourStops.length * 0.7)} hours`,
            difficulty: 'Easy to Moderate'
        };

        // Check if route already exists
        const existingRouteResponse = await fetch(`${supabaseUrl}/rest/v1/tour_routes?city_id=eq.${cityId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            }
        });

        let routeId;
        const existingRoutes = await existingRouteResponse.json();
        
        if (existingRoutes && existingRoutes.length > 0) {
            routeId = existingRoutes[0].id;
            
            // Update existing route
            const updateRouteResponse = await fetch(`${supabaseUrl}/rest/v1/tour_routes?id=eq.${routeId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(routeData)
            });

            if (!updateRouteResponse.ok) {
                throw new Error('Failed to update tour route');
            }

            // Delete existing tour stops
            await fetch(`${supabaseUrl}/rest/v1/tour_stops?route_id=eq.${routeId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                }
            });
        } else {
            // Create new route
            const routeResponse = await fetch(`${supabaseUrl}/rest/v1/tour_routes`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(routeData)
            });

            if (!routeResponse.ok) {
                throw new Error('Failed to create tour route');
            }

            const routeResult = await routeResponse.json();
            routeId = routeResult[0].id;
        }

        // Insert tour stops
        const stopsWithRouteId = tourStops.map(stop => ({
            route_id: routeId,
            name: stop.name,
            category: stop.category,
            coordinates: stop.coordinates,
            address: stop.address,
            description: stop.description,
            audio_script: stop.audio_script,
            duration_minutes: stop.duration_minutes,
            tips: stop.tips,
            stop_order: stop.stop_order
        }));

        console.log('Inserting tour stops:', JSON.stringify(stopsWithRouteId.slice(0, 1))); // Log first stop for debugging

        const stopsResponse = await fetch(`${supabaseUrl}/rest/v1/tour_stops`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(stopsWithRouteId)
        });

        if (!stopsResponse.ok) {
            const errorText = await stopsResponse.text();
            console.error('Tour stops insertion failed:', errorText);
            throw new Error(`Failed to create tour stops: ${errorText}`);
        }

        const result = {
            data: {
                cityId: cityId,
                routeId: routeId,
                cityName: cityName,
                country: detectedCountry,
                coordinates: cityLocation,
                tourStops: tourStops.length,
                message: `Successfully generated tour for ${cityName} with ${tourStops.length} stops`
            }
        };

        return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Tour generation error:', error);

        const errorResponse = {
            error: {
                code: 'TOUR_GENERATION_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});