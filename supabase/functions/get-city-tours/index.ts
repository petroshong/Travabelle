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
        const url = new URL(req.url);
        const cityId = url.searchParams.get('cityId');
        const cityName = url.searchParams.get('cityName');
        const country = url.searchParams.get('country');

        // Get environment variables
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        let cityQuery = `${supabaseUrl}/rest/v1/cities`;

        if (cityId) {
            cityQuery += `?id=eq.${cityId}`;
        } else if (cityName) {
            cityQuery += `?name=eq.${encodeURIComponent(cityName)}`;
            if (country) {
                cityQuery += `&country=eq.${encodeURIComponent(country)}`;
            }
        } else {
            throw new Error('Either cityId or cityName is required');
        }

        const cityResponse = await fetch(cityQuery, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            }
        });

        if (!cityResponse.ok) {
            throw new Error('Failed to fetch city data');
        }

        const cities = await cityResponse.json();

        if (!cities || cities.length === 0) {
            return new Response(JSON.stringify({
                data: null,
                message: 'City not found'
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const city = cities[0];

        // Fetch tour routes for the city
        const routesResponse = await fetch(`${supabaseUrl}/rest/v1/tour_routes?city_id=eq.${city.id}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            }
        });

        let tour_routes = [];
        if (routesResponse.ok) {
            tour_routes = await routesResponse.json();

            // Fetch tour stops for each route
            for (let route of tour_routes) {
                const stopsResponse = await fetch(`${supabaseUrl}/rest/v1/tour_stops?route_id=eq.${route.id}&order=stop_order.asc`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    }
                });

                if (stopsResponse.ok) {
                    route.tour_stops = await stopsResponse.json();
                } else {
                    route.tour_stops = [];
                }
            }
        }

        city.tour_routes = tour_routes;

        const result = {
            data: {
                city: city,
                totalRoutes: city.tour_routes ? city.tour_routes.length : 0,
                totalStops: city.tour_routes ? city.tour_routes.reduce((sum, route) => sum + (route.tour_stops ? route.tour_stops.length : 0), 0) : 0
            }
        };

        return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Get city tours error:', error);

        const errorResponse = {
            error: {
                code: 'GET_TOURS_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});