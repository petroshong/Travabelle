import React, { useState, useEffect, useRef } from 'react';
import { GOOGLE_MAPS_API_KEY } from '../lib/maps';
import { City, TourStop } from '../lib/supabase';
import { MapPin, Eye, Navigation, Map, Compass } from 'lucide-react';
import StaticTourMap from './StaticTourMap';
import LandmarkFactsPanel from './LandmarkFactsPanel';

// Extend window interface for Google Maps
declare global {
  interface Window {
    google: typeof google;
  }
}

interface TourMapProps {
  city: City;
  currentStop?: TourStop;
  allStops: TourStop[];
  onStopClick: (stopIndex: number) => void;
  onNextStop?: () => void;
  onPreviousStop?: () => void;
  autoStreetView?: boolean;
}

const TourMap: React.FC<TourMapProps> = ({ city, currentStop, allStops, onStopClick, onNextStop, onPreviousStop, autoStreetView = false }) => {
  const [showStreetView, setShowStreetView] = useState(false);
  const [selectedStop, setSelectedStop] = useState<TourStop | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isMapLoading, setIsMapLoading] = useState(true);
  const [travelMode, setTravelMode] = useState<'walking' | 'bicycling'>('walking');
  const [isSimulating, setIsSimulating] = useState(false);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [routeLandmarks, setRouteLandmarks] = useState<any[]>([]);
  const [showLandmarks, setShowLandmarks] = useState(true);
  const [showFactsPanel, setShowFactsPanel] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);
  const [isAutoSwitching, setIsAutoSwitching] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const streetViewRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const streetViewInstance = useRef<google.maps.StreetViewPanorama | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const landmarkMarkersRef = useRef<google.maps.Marker[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const simulationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Default to Paris center if coordinates are missing or invalid
  const defaultCenter = { lat: 48.8566, lng: 2.3522 }; // Paris, France
  
  const mapCenter = currentStop && currentStop.coordinates
    ? { lat: currentStop.coordinates.lat, lng: currentStop.coordinates.lng }
    : city && city.coordinates
    ? { lat: city.coordinates.lat, lng: city.coordinates.lng }
    : defaultCenter;

  // Load Google Maps API
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const loadGoogleMaps = () => {
      // Check if Google Maps is already loaded
      if (window.google && window.google.maps) {
        console.log('Google Maps already loaded');
        initMap();
        return;
      }

      // Check if script is already loading
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        console.log('Google Maps script already exists, waiting for load...');
        existingScript.addEventListener('load', initMap);
        return;
      }

      console.log('Loading Google Maps API with key:', GOOGLE_MAPS_API_KEY.substring(0, 20) + '...');

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=geometry,places,directions`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        console.log('Google Maps API loaded successfully');
        clearTimeout(timeoutId);
        initMap();
      };
      
      script.onerror = (error) => {
        console.error('Failed to load Google Maps API:', error);
        console.error('API Key:', GOOGLE_MAPS_API_KEY);
        clearTimeout(timeoutId);
        setMapError('Failed to load Google Maps. Please check your internet connection and API key.');
        setIsMapLoading(false);
      };
      
      document.head.appendChild(script);

      // Set a timeout fallback
      timeoutId = setTimeout(() => {
        console.warn('Google Maps loading timeout, showing fallback');
        setMapError('Map loading timed out. Showing simplified view.');
        setIsMapLoading(false);
      }, 10000); // 10 second timeout
    };

    loadGoogleMaps();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  const initMap = () => {
    if (!mapRef.current || mapInstance.current) return;

    try {
      if (!window.google || !window.google.maps) {
        throw new Error('Google Maps API not loaded');
      }

      console.log('Initializing map with center:', mapCenter);
      console.log('All stops:', allStops.length, allStops);

      // Initialize map
      mapInstance.current = new google.maps.Map(mapRef.current, {
        center: mapCenter,
        zoom: 14,
        mapTypeControl: true,
        mapTypeControlOptions: {
          style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
          position: google.maps.ControlPosition.TOP_CENTER,
        },
        zoomControl: true,
        zoomControlOptions: {
          position: google.maps.ControlPosition.RIGHT_CENTER
        },
        scaleControl: true,
        streetViewControl: true,
        streetViewControlOptions: {
          position: google.maps.ControlPosition.RIGHT_TOP
        },
        fullscreenControl: true,
        styles: [
          {
            featureType: "all",
            elementType: "geometry.fill",
            stylers: [{ weight: "2.00" }]
          },
          {
            featureType: "water",
            elementType: "geometry.fill",
            stylers: [{ color: "#c8d7d4" }]
          },
          {
            featureType: "poi",
            elementType: "labels.icon",
            stylers: [{ visibility: "on" }]
          }
        ]
      });

      // Initialize directions service and renderer
      directionsServiceRef.current = new google.maps.DirectionsService();
      directionsRendererRef.current = new google.maps.DirectionsRenderer({
        polylineOptions: {
          strokeColor: travelMode === 'walking' ? '#2563eb' : '#16a34a',
          strokeWeight: 4,
          strokeOpacity: 0.8,
        },
        suppressMarkers: true, // We'll use our custom markers
      });
      directionsRendererRef.current.setMap(mapInstance.current);

      // Add markers for all stops
      addMarkers();
      
      // Calculate and display route
      if (allStops.length > 1) {
        calculateRoute();
      }
      
      setIsMapLoading(false);
      setMapError(null);
    } catch (error) {
      console.error('Error initializing map:', error);
      setMapError('Failed to initialize Google Maps. Please refresh the page.');
      setIsMapLoading(false);
    }
  };

  const addMarkers = () => {
    if (!mapInstance.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    console.log('Adding markers for stops:', allStops);

    // Add new markers (only if we have valid stops)
    if (allStops && allStops.length > 0) {
      allStops.forEach((stop, index) => {
        if (!stop.coordinates || !stop.coordinates.lat || !stop.coordinates.lng) {
          console.warn('Invalid coordinates for stop:', stop);
          return;
        }

        const marker = new google.maps.Marker({
        position: { lat: stop.coordinates.lat, lng: stop.coordinates.lng },
        map: mapInstance.current,
        title: stop.name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: currentStop?.id === stop.id ? '#f97316' : '#3b82f6',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
          scale: currentStop?.id === stop.id ? 12 : 8,
        },
        label: {
          text: (index + 1).toString(),
          color: 'white',
          fontWeight: 'bold',
          fontSize: '12px'
        }
      });

      marker.addListener('click', () => {
        setSelectedStop(stop);
        onStopClick(index);
        
        // Show info window
        if (infoWindowRef.current) {
          infoWindowRef.current.close();
        }
        
        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="padding: 8px; max-width: 250px;">
              <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold;">${stop.name}</h3>
              <p style="margin: 0 0 8px 0; color: #666; font-size: 12px;">${stop.category}</p>
              <p style="margin: 0 0 8px 0; font-size: 14px; line-height: 1.4;">${stop.description}</p>
              <p style="margin: 0; font-size: 12px; color: #888;">
                <strong>Duration:</strong> ${stop.duration_minutes} minutes
              </p>
            </div>
          `
        });
        
        infoWindow.open(mapInstance.current, marker);
        infoWindowRef.current = infoWindow;
      });

      markersRef.current.push(marker);
    });
    } else {
      console.log('No stops to display markers for');
    }
  };

  const calculateRoute = async () => {
    if (!directionsServiceRef.current || !directionsRendererRef.current || allStops.length < 2) return;

    try {
      const waypoints = allStops.slice(1, -1).map(stop => ({
        location: new google.maps.LatLng(stop.coordinates.lat, stop.coordinates.lng),
        stopover: true
      }));

      const request: google.maps.DirectionsRequest = {
        origin: new google.maps.LatLng(allStops[0].coordinates.lat, allStops[0].coordinates.lng),
        destination: new google.maps.LatLng(allStops[allStops.length - 1].coordinates.lat, allStops[allStops.length - 1].coordinates.lng),
        waypoints: waypoints,
        travelMode: travelMode === 'walking' ? google.maps.TravelMode.WALKING : google.maps.TravelMode.BICYCLING,
        optimizeWaypoints: true,
      };

      directionsServiceRef.current.route(request, (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          directionsRendererRef.current?.setDirections(result);
          
          // Update polyline color based on travel mode
          directionsRendererRef.current?.setOptions({
            polylineOptions: {
              strokeColor: travelMode === 'walking' ? '#2563eb' : '#16a34a',
              strokeWeight: 4,
              strokeOpacity: 0.8,
            }
          });

          // Extract route information
          const route = result.routes[0];
          if (route.legs.length > 0) {
            const totalDistance = route.legs.reduce((sum, leg) => sum + (leg.distance?.value || 0), 0);
            const totalDuration = route.legs.reduce((sum, leg) => sum + (leg.duration?.value || 0), 0);
            
            setRouteInfo({
              distance: `${(totalDistance / 1000).toFixed(1)} km`,
              duration: `${Math.round(totalDuration / 60)} min`
            });
          }

          // Find landmarks along the route
          findLandmarksAlongRoute(result);
        } else {
          console.error('Directions request failed:', status);
        }
      });
    } catch (error) {
      console.error('Error calculating route:', error);
    }
  };

  const findLandmarksAlongRoute = async (directionsResult: google.maps.DirectionsResult) => {
    if (!mapInstance.current) return;

    const placesService = new google.maps.places.PlacesService(mapInstance.current);
    const landmarks: any[] = [];

    // Get points along the route
    const route = directionsResult.routes[0];
    const leg = route.legs[0];
    
    // Sample points along the route every 500 meters
    const samplePoints = [];
    for (let i = 0; i < leg.steps.length; i += 2) {
      const step = leg.steps[i];
      if (step.start_location) {
        samplePoints.push(step.start_location);
      }
    }

    // Search for landmarks near each sample point
    for (const point of samplePoints) {
      try {
        const request: google.maps.places.PlaceSearchRequest = {
          location: point,
          radius: 200, // 200 meter radius
          type: 'point_of_interest'
        };

        placesService.nearbySearch(request, (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            const filteredResults = results.filter(place => 
              place.rating && place.rating > 4.0 && place.user_ratings_total && place.user_ratings_total > 50
            ).slice(0, 2); // Take top 2 landmarks per point

            landmarks.push(...filteredResults);
            setRouteLandmarks([...landmarks]);
            
            if (showLandmarks) {
              addLandmarkMarkers(filteredResults);
            }
          }
        });
      } catch (error) {
        console.error('Error finding landmarks:', error);
      }
    }
  };

  const addLandmarkMarkers = (landmarks: google.maps.places.PlaceResult[]) => {
    if (!mapInstance.current) return;

    // Clear existing landmark markers
    landmarkMarkersRef.current.forEach(marker => marker.setMap(null));
    landmarkMarkersRef.current = [];

    landmarks.forEach((landmark) => {
      if (landmark.geometry && landmark.geometry.location) {
        const marker = new google.maps.Marker({
          position: landmark.geometry.location,
          map: mapInstance.current,
          title: landmark.name,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: '#f59e0b',
            fillOpacity: 0.8,
            strokeColor: '#ffffff',
            strokeWeight: 2,
            scale: 6,
          },
        });

        marker.addListener('click', () => {
          if (infoWindowRef.current) {
            infoWindowRef.current.close();
          }
          
          const infoWindow = new google.maps.InfoWindow({
            content: `
              <div style="padding: 8px; max-width: 200px;">
                <h4 style="margin: 0 0 4px 0; font-size: 14px; font-weight: bold;">${landmark.name}</h4>
                <p style="margin: 0 0 4px 0; font-size: 12px; color: #666;">
                  ⭐ ${landmark.rating} (${landmark.user_ratings_total} reviews)
                </p>
                <p style="margin: 0; font-size: 11px; color: #888;">
                  Landmark along your route
                </p>
              </div>
            `
          });
          
          infoWindow.open(mapInstance.current, marker);
          infoWindowRef.current = infoWindow;
        });

        landmarkMarkersRef.current.push(marker);
      }
    });
  };

  const initStreetView = (retryCount = 0) => {
    if (!streetViewRef.current || streetViewInstance.current) return;

    // Ensure Google Maps is loaded
    if (!window.google || !window.google.maps || !window.google.maps.StreetViewService) {
      console.error('Google Maps Street View API not loaded');
      return;
    }

    const position = currentStop
      ? { lat: currentStop.coordinates.lat, lng: currentStop.coordinates.lng }
      : { lat: city.coordinates.lat, lng: city.coordinates.lng };

    console.log('Initializing street view at position:', position);

    // Set a timeout to show error if street view doesn't load
    const timeoutId = setTimeout(() => {
      console.warn('Street view loading timeout');
      const loadingIndicator = streetViewRef.current?.querySelector('.absolute.inset-0');
      if (loadingIndicator) {
        loadingIndicator.innerHTML = `
          <div class="text-center">
            <div class="text-red-500 mb-4">
              <svg class="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">Street View Unavailable</h3>
            <p class="text-gray-600 mb-4">Street view is not available at this location</p>
            <button 
              onclick="this.parentElement.parentElement.parentElement.style.display='none'; window.dispatchEvent(new CustomEvent('closeStreetView'));"
              class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Return to Map
            </button>
          </div>
        `;
      }
    }, 10000); // 10 second timeout

    // Check if street view is available at this location
    const streetViewService = new google.maps.StreetViewService();
    streetViewService.getPanorama({ location: position, radius: 50 }, (data, status) => {
      console.log('Street view status:', status, 'Data:', data);
      
      if (status === google.maps.StreetViewStatus.OK && data) {
        console.log('Street view data found, initializing panorama...');
        
        try {
          streetViewInstance.current = new google.maps.StreetViewPanorama(streetViewRef.current, {
            position: position,
            pov: { heading: 0, pitch: 0 },
            zoom: 1,
            addressControl: true,
            linksControl: true,
            panControl: true,
            enableCloseButton: false,
            fullscreenControl: true,
            visible: true,
            motionTracking: false,
            motionTrackingControl: false
          });

          console.log('Street view panorama created successfully');

          // Clear timeout since street view loaded successfully
          clearTimeout(timeoutId);

          // Hide loading indicator once street view loads
          const loadingIndicator = streetViewRef.current?.querySelector('.absolute.inset-0');
          if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
          }

          // Add click listener to go back to map view
          streetViewInstance.current.addListener('closeclick', () => {
            setShowStreetView(false);
          });

          // Add status change listener to handle loading issues
          streetViewInstance.current.addListener('status_changed', () => {
            const status = streetViewInstance.current?.getStatus();
            console.log('Street view status changed:', status);
            if (status === google.maps.StreetViewStatus.OK) {
              // Street view loaded successfully
              const loadingIndicator = streetViewRef.current?.querySelector('.absolute.inset-0');
              if (loadingIndicator) {
                loadingIndicator.style.display = 'none';
              }
            }
          });

          // Add position changed listener
          streetViewInstance.current.addListener('position_changed', () => {
            console.log('Street view position changed');
          });
        } catch (error) {
          console.error('Error creating street view panorama:', error);
          // Retry once if it fails
          if (retryCount < 1) {
            console.log('Retrying street view initialization...');
            setTimeout(() => initStreetView(retryCount + 1), 1000);
          }
        }
      } else {
        console.warn('Street View not available at this location');
        // Try to find nearby street view
        streetViewService.getPanorama({ location: position, radius: 200 }, (nearbyData, nearbyStatus) => {
          console.log('Nearby street view status:', nearbyStatus, 'Data:', nearbyData);
          
          if (nearbyStatus === google.maps.StreetViewStatus.OK && nearbyData) {
            const nearbyPosition = nearbyData.location?.latLng;
            if (nearbyPosition) {
              console.log('Found nearby street view at:', nearbyPosition);
              
              try {
                streetViewInstance.current = new google.maps.StreetViewPanorama(streetViewRef.current, {
                  position: nearbyPosition,
                  pov: { heading: 0, pitch: 0 },
                  zoom: 1,
                  addressControl: true,
                  linksControl: true,
                  panControl: true,
                  enableCloseButton: false,
                  fullscreenControl: true,
                  visible: true,
                  motionTracking: false,
                  motionTrackingControl: false
                });
                
                console.log('Nearby street view panorama created successfully');
                
                // Clear timeout since street view loaded successfully
                clearTimeout(timeoutId);
                
                // Hide loading indicator
                const loadingIndicator = streetViewRef.current?.querySelector('.absolute.inset-0');
                if (loadingIndicator) {
                  loadingIndicator.style.display = 'none';
                }
                
                // Add click listener to go back to map view
                streetViewInstance.current.addListener('closeclick', () => {
                  setShowStreetView(false);
                });

                // Add status change listener to handle loading issues
                streetViewInstance.current.addListener('status_changed', () => {
                  const status = streetViewInstance.current?.getStatus();
                  console.log('Street view status changed:', status);
                  if (status === google.maps.StreetViewStatus.OK) {
                    // Street view loaded successfully
                    const loadingIndicator = streetViewRef.current?.querySelector('.absolute.inset-0');
                    if (loadingIndicator) {
                      loadingIndicator.style.display = 'none';
                    }
                  }
                });
              } catch (error) {
                console.error('Error creating nearby street view panorama:', error);
                // Retry once if it fails
                if (retryCount < 1) {
                  console.log('Retrying nearby street view initialization...');
                  setTimeout(() => initStreetView(retryCount + 1), 1000);
                }
              }
            }
          } else {
            console.log('No street view available nearby either');
          }
        });
      }
    });
  };

  // Journey simulation functions
  const startJourneySimulation = () => {
    if (!directionsRendererRef.current || allStops.length < 2) return;
    
    setIsSimulating(true);
    setCurrentProgress(0);
    setShowFactsPanel(true);
    
    const speed = travelMode === 'walking' ? 5 : 15; // km/h
    const updateInterval = 1000; // 1 second
    const progressIncrement = (speed * 1000) / (3600 * updateInterval); // Progress per second
    
    simulationIntervalRef.current = setInterval(() => {
      setCurrentProgress(prev => {
        const newProgress = prev + progressIncrement;
        if (newProgress >= 100) {
          stopJourneySimulation();
          return 100;
        }
        return newProgress;
      });
    }, updateInterval);
  };

  const stopJourneySimulation = () => {
    setIsSimulating(false);
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
    }
  };

  const toggleLandmarks = () => {
    setShowLandmarks(!showLandmarks);
    if (!showLandmarks) {
      // Show landmarks
      addLandmarkMarkers(routeLandmarks);
    } else {
      // Hide landmarks
      landmarkMarkersRef.current.forEach(marker => marker.setMap(null));
      landmarkMarkersRef.current = [];
    }
  };

  // Update travel mode and recalculate route
  const changeTravelMode = (newMode: 'walking' | 'bicycling') => {
    setTravelMode(newMode);
    if (mapInstance.current && allStops.length > 1) {
      calculateRoute();
    }
  };

  // Update map center when current stop changes
  useEffect(() => {
    if (mapInstance.current && currentStop) {
      mapInstance.current.panTo({ lat: currentStop.coordinates.lat, lng: currentStop.coordinates.lng });
      mapInstance.current.setZoom(16);
      addMarkers(); // Refresh markers to update current stop highlighting
    }
  }, [currentStop]);

  // Update route when travel mode changes
  useEffect(() => {
    if (mapInstance.current && allStops.length > 1) {
      calculateRoute();
    }
  }, [travelMode]);

  // Cleanup function
  useEffect(() => {
    const handleCloseStreetView = () => {
      setShowStreetView(false);
    };

    window.addEventListener('closeStreetView', handleCloseStreetView);

    return () => {
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
      }
      window.removeEventListener('closeStreetView', handleCloseStreetView);
    };
  }, []);

  // Update street view when current stop changes
  useEffect(() => {
    if (streetViewInstance.current && currentStop) {
      streetViewInstance.current.setPosition({ lat: currentStop.coordinates.lat, lng: currentStop.coordinates.lng });
    }
  }, [currentStop]);

  // Auto-enable street view when tour starts
  useEffect(() => {
    if (autoStreetView && currentStop && !showStreetView) {
      console.log('Auto-enabling street view for tour start');
      setShowStreetView(true);
      setTimeout(() => {
        if (streetViewInstance.current) {
          streetViewInstance.current.setVisible(false);
          streetViewInstance.current = null;
        }
        initStreetView();
      }, 200);
    }
  }, [autoStreetView, currentStop, showStreetView]);

  const toggleStreetView = () => {
    const newShowStreetView = !showStreetView;
    setShowStreetView(newShowStreetView);
    
    if (newShowStreetView) {
      // Initialize street view after DOM update
      setTimeout(() => {
        if (streetViewInstance.current) {
          streetViewInstance.current.setVisible(false);
          streetViewInstance.current = null;
        }
        initStreetView();
      }, 100);
    } else {
      // Clean up street view instance
      if (streetViewInstance.current) {
        streetViewInstance.current.setVisible(false);
        streetViewInstance.current = null;
      }
    }
  };

  // Auto-navigate to street view when stop changes
  const navigateToStreetView = (stopIndex: number) => {
    if (allStops[stopIndex]) {
      onStopClick(stopIndex);
      // Auto-switch to street view after a short delay
      setTimeout(() => {
        if (!showStreetView) {
          setShowStreetView(true);
          setTimeout(() => {
            if (streetViewInstance.current) {
              streetViewInstance.current.setVisible(false);
              streetViewInstance.current = null;
            }
            initStreetView();
          }, 100);
        } else {
          // Update existing street view position
          if (streetViewInstance.current) {
            const newPosition = {
              lat: allStops[stopIndex].coordinates.lat,
              lng: allStops[stopIndex].coordinates.lng
            };
            streetViewInstance.current.setPosition(newPosition);
          }
        }
      }, 500);
    }
  };

  // Enhanced next/previous functions with street view
  const handleNextStop = () => {
    if (onNextStop) {
      onNextStop();
      // Show auto-switching indicator
      setIsAutoSwitching(true);
      
      // Auto-switch to street view and update position
      setTimeout(() => {
        if (!showStreetView) {
          // If not in street view mode, switch to it
          setShowStreetView(true);
          setTimeout(() => {
            if (streetViewInstance.current) {
              streetViewInstance.current.setVisible(false);
              streetViewInstance.current = null;
            }
            initStreetView();
            setIsAutoSwitching(false);
          }, 100);
        } else {
          // If already in street view mode, update position with smooth transition
          if (streetViewInstance.current && currentStop) {
            const newPosition = {
              lat: currentStop.coordinates.lat,
              lng: currentStop.coordinates.lng
            };
            
            // Add a smooth transition effect
            streetViewInstance.current.setPosition(newPosition);
            
            // Add a brief fade effect
            const streetViewElement = streetViewRef.current;
            if (streetViewElement) {
              streetViewElement.style.opacity = '0.7';
              setTimeout(() => {
                if (streetViewElement) {
                  streetViewElement.style.opacity = '1';
                }
              }, 300);
            }
            
            setIsAutoSwitching(false);
          }
        }
      }, 500);
    }
  };

  const handlePreviousStop = () => {
    if (onPreviousStop) {
      onPreviousStop();
      // Show auto-switching indicator
      setIsAutoSwitching(true);
      
      // Auto-switch to street view and update position
      setTimeout(() => {
        if (!showStreetView) {
          // If not in street view mode, switch to it
          setShowStreetView(true);
          setTimeout(() => {
            if (streetViewInstance.current) {
              streetViewInstance.current.setVisible(false);
              streetViewInstance.current = null;
            }
            initStreetView();
            setIsAutoSwitching(false);
          }, 100);
        } else {
          // If already in street view mode, update position with smooth transition
          if (streetViewInstance.current && currentStop) {
            const newPosition = {
              lat: currentStop.coordinates.lat,
              lng: currentStop.coordinates.lng
            };
            
            // Add a smooth transition effect
            streetViewInstance.current.setPosition(newPosition);
            
            // Add a brief fade effect
            const streetViewElement = streetViewRef.current;
            if (streetViewElement) {
              streetViewElement.style.opacity = '0.7';
              setTimeout(() => {
                if (streetViewElement) {
                  streetViewElement.style.opacity = '1';
                }
              }, 300);
            }
            
            setIsAutoSwitching(false);
          }
        }
      }, 500);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight' && onNextStop) {
        handleNextStop();
      } else if (event.key === 'ArrowLeft' && onPreviousStop) {
        handlePreviousStop();
      } else if (event.key === 's' || event.key === 'S') {
        setShowStreetView(true);
      } else if (event.key === 'm' || event.key === 'M') {
        setShowStreetView(false);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [onNextStop, onPreviousStop, showStreetView, currentStop]);

  return (
    <div className="relative w-full h-full">
      {/* Landmark Facts Panel */}
      {showFactsPanel && (
        <LandmarkFactsPanel
          landmarks={routeLandmarks}
          isSimulating={isSimulating}
          currentProgress={currentProgress}
          onClose={() => setShowFactsPanel(false)}
        />
      )}

      {/* Loading State */}
      {isMapLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 mb-2">Loading Google Maps...</p>
            <p className="text-xs text-gray-500">This may take a few seconds</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 text-xs text-blue-600 hover:text-blue-700 underline"
            >
              Force Refresh
            </button>
          </div>
        </div>
      )}

      {/* Error State - Show Static Map */}
      {mapError && !isMapLoading && (
        <StaticTourMap
          city={city}
          currentStop={currentStop}
          allStops={allStops}
          onStopClick={onStopClick}
        />
      )}

      {/* Map Container */}
      <div
        ref={mapRef}
        className={`w-full h-full transition-opacity duration-300 ${
          showStreetView || mapError ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
        style={{
          display: (showStreetView || mapError) ? 'none' : 'block',
          minHeight: '400px'
        }}
      />
      
      {/* Street View Container */}
      {showStreetView && (
        <div 
          ref={streetViewRef} 
          className="w-full h-full relative bg-gray-900 transition-opacity duration-300"
          style={{ minHeight: '400px' }}
        >
          {/* Street View Loading Indicator */}
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading Street View...</p>
              <p className="text-xs text-gray-500 mt-2">This may take a few seconds</p>
            </div>
          </div>
        </div>
      )}

      {/* Auto-switching indicator */}
      {isAutoSwitching && (
        <div className="absolute top-4 right-4 z-20 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          <span className="text-sm font-medium">Switching to Street View...</span>
        </div>
      )}

      {/* View Mode Indicators */}
      {showStreetView && autoStreetView && (
        <div className="absolute top-4 right-4 z-20 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <Eye className="w-4 h-4" />
          <span className="text-sm font-medium">Street View Mode</span>
        </div>
      )}
      
      {!showStreetView && autoStreetView && (
        <div className="absolute top-4 right-4 z-20 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <Map className="w-4 h-4" />
          <span className="text-sm font-medium">Map Overview</span>
        </div>
      )}



      {/* Route Information */}
      {routeInfo && !currentStop && (
        <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-lg border">
          <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <span className={travelMode === 'walking' ? 'text-blue-600' : 'text-green-600'}>
              {travelMode === 'walking' ? '🚶‍♂️' : '🚴‍♂️'}
            </span>
            Route Overview
          </h3>
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-1 text-gray-600">
              <span>📏</span>
              <span>{routeInfo.distance}</span>
            </div>
            <div className="flex items-center gap-1 text-gray-600">
              <span>⏱️</span>
              <span>{routeInfo.duration}</span>
            </div>
          </div>
          {isSimulating && (
            <div className="mt-2 text-xs text-blue-600">
              Journey in progress... {Math.round(currentProgress)}% complete
            </div>
          )}
        </div>
      )}

      {/* Current Stop Overlay */}
      {currentStop && (
        <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-lg border max-w-sm">
          <h3 className="font-semibold text-gray-900 mb-1">{currentStop.name}</h3>
          <p className="text-sm text-gray-600 mb-2">{currentStop.category}</p>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <MapPin className="w-3 h-3" />
            <span>{currentStop.address}</span>
          </div>
          {routeInfo && (
            <div className="flex gap-4 text-xs text-gray-500 mt-2">
              <span>📏 {routeInfo.distance}</span>
              <span>⏱️ {routeInfo.duration}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TourMap;