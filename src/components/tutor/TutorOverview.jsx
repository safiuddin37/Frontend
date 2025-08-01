import { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { MapContainer, TileLayer, Marker, useMap, Circle } from 'react-leaflet'
import { FiUsers, FiClock, FiCheck, FiX, FiHelpCircle, FiSmartphone, FiMonitor } from 'react-icons/fi'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import useGet from '../CustomHooks/useGet'
import usePost from '../CustomHooks/usePost'
import useTodayAttendance from './useTodayAttendance'
import axios from 'axios';

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Custom marker icons
const createCustomIcon = (color) => {
  return L.icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${color}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  })
}

const redIcon = createCustomIcon('red')
const blueIcon = createCustomIcon('blue')
const orangeIcon = createCustomIcon('orange') // For IP-based locations

// Fallback when the Geolocation API fails or is unavailable – uses an IP lookup service.
// WARNING: IP-based location is only city-level accurate (can be kilometers off)
const fetchLocationFallback = async () => {
  console.warn('⚠️ Attempting IP-based location fallback - this will be much less accurate than GPS');
  
  try {
    // Simple IP-based lookup (≈ city-level). Free up to 30k calls / month.
    const response = await axios.get('https://ipapi.co/json/', { timeout: 8000 });
    const { latitude, longitude, error, city, region, country } = response.data;
    
    if (error) {
      console.error('IP geolocation service error:', error);
      return null;
    }
    
    // Validate coordinates more strictly
    if (latitude && longitude && 
        typeof latitude === 'number' && typeof longitude === 'number' &&
        latitude >= -90 && latitude <= 90 && 
        longitude >= -180 && longitude <= 180) {
      
      console.warn(`📍 IP-based location: ${city}, ${region}, ${country}`);
      console.warn(`⚠️ Coordinates: ${latitude}, ${longitude} - Accuracy: City-level (~1-10km radius)`);
      
      return { 
        lat: latitude, 
        lng: longitude,
        isIPBased: true, // Flag to indicate this is not GPS
        accuracy: 5000 // Assume 5km accuracy for IP-based location
      };
    } else {
      console.error('Invalid coordinates from IP service:', { latitude, longitude });
    }
  } catch (error) {
    console.error('Primary IP geolocation service failed:', error);
    
    // Don't try alternative services - they're usually less accurate
    // and we want to encourage users to enable GPS instead
    console.warn('Not attempting alternative IP services - please enable GPS for accurate location');
  }
  return null;
};

const LocationMarker = ({ onLocationUpdate, onLocationError }) => {
  const [position, setPosition] = useState(null)
  const [isIPBased, setIsIPBased] = useState(false)
  const map = useMap()
  const watchIdRef = useRef(null)
  const hasAnimatedRef = useRef(false)
  const [locationError, setLocationError] = useState(null)
  const escalateTimerRef = useRef(null)
  const hasInitialLocationRef = useRef(false)
  const fallbackRequestedRef = useRef(false);
  const lastErrorTimeRef = useRef(0);
  const lastValidPositionRef = useRef(null);
  const accuracyHistoryRef = useRef([]);

  useEffect(() => {
    if (!navigator.geolocation) {
      // Only use IP fallback as last resort, and warn user about accuracy
      fetchLocationFallback().then((fallbackPosition) => {
        if (fallbackPosition) {
          setPosition(fallbackPosition);
          setIsIPBased(true);
          onLocationUpdate(fallbackPosition);
          console.warn('Using IP-based location - accuracy may be several kilometers off');
        } else {
          setLocationError('Unable to determine location.');
        }
      });
      return;
    }

    const DESIRED_ACCURACY = 200; // meters - relaxed for better compatibility
    const MAX_DISTANCE_JUMP = 2000; // meters - relaxed to allow valid location changes
    const MIN_ACCURACY_FOR_INITIAL = 1000; // meters - much more relaxed for initial reading
    
    // Calculate distance between two coordinates in meters
    const calculateDistance = (lat1, lng1, lat2, lng2) => {
      const R = 6371e3; // Earth's radius in meters
      const φ1 = lat1 * Math.PI/180;
      const φ2 = lat2 * Math.PI/180;
      const Δφ = (lat2-lat1) * Math.PI/180;
      const Δλ = (lng2-lng1) * Math.PI/180;

      const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

      return R * c;
    };

    const handleSuccess = ({ latitude, longitude, accuracy }) => {
      console.log('Location received:', { latitude, longitude, accuracy });
      
      const latlng = { lat: latitude, lng: longitude };
      
      // Validate coordinates
      if (!latitude || !longitude || 
          latitude < -90 || latitude > 90 || 
          longitude < -180 || longitude > 180) {
        console.warn('Invalid coordinates received:', { latitude, longitude });
        return;
      }

      // For the first location reading, accept it to get immediate positioning
      if (!hasInitialLocationRef.current) {
        console.log('First location reading accepted:', { latitude, longitude, accuracy });
        
        setPosition(latlng);
        setIsIPBased(false); // This is GPS-based location
        onLocationUpdate(latlng);
        hasInitialLocationRef.current = true;
        lastValidPositionRef.current = latlng;
        
        // Track accuracy history
        accuracyHistoryRef.current.push(accuracy || 999);
        if (accuracyHistoryRef.current.length > 5) {
          accuracyHistoryRef.current.shift();
        }
        
        if (!hasAnimatedRef.current) {
          map.flyTo(latlng, 17, { animate: true }); // Initial animation, zoom in to 17
          hasAnimatedRef.current = true;
        }
        return;
      }
      
      // For subsequent readings, apply basic filters only
      if (accuracy && accuracy > DESIRED_ACCURACY) {
        console.log('Ignoring very inaccurate reading:', accuracy);
        return;
      }

      // Check for unrealistic distance jumps (possible GPS glitch)
      if (lastValidPositionRef.current) {
        const distance = calculateDistance(
          lastValidPositionRef.current.lat, 
          lastValidPositionRef.current.lng,
          latitude, 
          longitude
        );
        
        if (distance > MAX_DISTANCE_JUMP) {
          console.warn(`Ignoring location jump of ${Math.round(distance)}m - likely GPS error`);
          return;
        }
      }

      // Track accuracy history (simplified)
      accuracyHistoryRef.current.push(accuracy || 999);
      if (accuracyHistoryRef.current.length > 3) {
        accuracyHistoryRef.current.shift();
      }
      
      setPosition(latlng);
      setIsIPBased(false); // This is GPS-based location
      onLocationUpdate(latlng);
      lastValidPositionRef.current = latlng;
      map.setView(latlng, map.getZoom(), { animate: false }); // Always keep user centered, no animation
    };

    const errorHandlerWrapper = (error) => {
      const now = Date.now();
      if (now - lastErrorTimeRef.current > 5000) { // Only handle errors every 5s
        lastErrorTimeRef.current = now;
        handleError(error);
      }
    };

    const handleError = (error) => {
      let message = '';
      let shouldShowHelp = false;
      
      switch (error.code) {
        case error.PERMISSION_DENIED:
          message = 'Location access denied. Click "Get Help" to learn how to enable location permissions.';
          shouldShowHelp = true;
          break;
        case error.POSITION_UNAVAILABLE:
          message = 'Location information is unavailable. Please check your GPS settings.';
          shouldShowHelp = true;
          break;
        case error.TIMEOUT:
          message = 'Location request timed out. Trying fallback method...';
          break;
        case error.UNKNOWN_ERROR:
        default:
          message = 'An unknown error occurred while retrieving location.';
          shouldShowHelp = true;
          break;
      }
      console.error('Geolocation error:', error);
      setLocationError(message);
      
      // Notify parent component about the error
      if (onLocationError) {
        onLocationError(message, shouldShowHelp);
      }

      // Clear any existing geolocation watchers or timers to prevent
      // the error callback from firing repeatedly
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (escalateTimerRef.current) {
        clearTimeout(escalateTimerRef.current);
        escalateTimerRef.current = null;
      }

      // For permission denied, don't try fallback as it won't be more accurate
      if (error.code === error.PERMISSION_DENIED) {
        return;
      }

      // Try IP fallback for timeout and position unavailable errors
      if ((error.code === error.TIMEOUT || error.code === error.POSITION_UNAVAILABLE) && !fallbackRequestedRef.current) {
        fallbackRequestedRef.current = true;
        console.warn('GPS failed - attempting IP fallback (less accurate)');
        
        fetchLocationFallback().then((fallbackPosition) => {
          if (fallbackPosition) {
            setPosition(fallbackPosition);
            setIsIPBased(true);
            onLocationUpdate(fallbackPosition);
            setLocationError('Using approximate location - GPS unavailable');
            console.warn('Using IP-based location as fallback - accuracy may be several kilometers off');
            
            // Clear the error after successful fallback
            if (onLocationError) {
              onLocationError(null, false);
            }
          } else {
            const finalMessage = 'Unable to determine location from any source. Please check your settings.';
            setLocationError(finalMessage);
            if (onLocationError) {
              onLocationError(finalMessage, true);
            }
          }
        });
      }
    };

    // Start with standard GPS options for better compatibility
    const standardOptions = { 
      enableHighAccuracy: false, 
      maximumAge: 60000, // Accept locations up to 1 minute old
      timeout: 10000 
    };

    // First, try to get current position with standard accuracy
    navigator.geolocation.getCurrentPosition(
      pos => handleSuccess({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy
      }),
      errorHandlerWrapper,
      standardOptions
    );

    // Start watching position for continuous updates
    watchIdRef.current = navigator.geolocation.watchPosition(
      pos => handleSuccess({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy
      }),
      errorHandlerWrapper,
      standardOptions
    );

    // Try high accuracy after getting initial location
    escalateTimerRef.current = setTimeout(() => {
      if (hasInitialLocationRef.current) {
        console.log('Upgrading to high-accuracy GPS for better precision');
        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current);
        }
        watchIdRef.current = navigator.geolocation.watchPosition(
          pos => handleSuccess({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy
          }),
          errorHandlerWrapper,
          { enableHighAccuracy: true, maximumAge: 30000, timeout: 15000 }
        );
      }
    }, 5000);

    // Clean-up on unmount
    return () => {
      if (escalateTimerRef.current) {
        clearTimeout(escalateTimerRef.current);
      }
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [map, onLocationUpdate]);

  return position === null ? null : (
    <Marker 
      position={position} 
      icon={isIPBased ? orangeIcon : redIcon}
      title={isIPBased ? "Approximate location (IP-based)" : "GPS location"}
    />
  )
}

// Location Help Modal Component
const LocationHelpModal = ({ isOpen, onClose, deviceInfo }) => {
  if (!isOpen) return null;

  const getInstructions = () => {
    const { deviceType, browserName, isIOS, isAndroid, isChrome, isFirefox, isSafari } = deviceInfo;

    const instructions = {
      common: [
        "Make sure you're connected to the internet",
        "Ensure GPS/Location Services are enabled on your device",
        "Allow location access when prompted by the browser"
      ],
      ios: {
        safari: [
          "1. Go to iPhone Settings → Privacy & Security → Location Services",
          "2. Make sure Location Services is ON",
          "3. Scroll down and tap 'Safari'",
          "4. Select 'While Using App' or 'Ask Next Time'",
          "5. Refresh this page and allow location access"
        ],
        chrome: [
          "1. Go to iPhone Settings → Privacy & Security → Location Services",
          "2. Make sure Location Services is ON",
          "3. Open Chrome → Settings → Site Settings → Location",
          "4. Make sure location access is allowed",
          "5. Refresh this page and allow location access"
        ]
      },
      android: {
        chrome: [
          "1. Go to Android Settings → Location → Turn ON",
          "2. In Chrome, tap the lock icon next to the URL",
          "3. Tap 'Permissions' → Location → Allow",
          "4. Or go to Chrome Settings → Site Settings → Location → Allow",
          "5. Refresh this page"
        ],
        firefox: [
          "1. Go to Android Settings → Location → Turn ON",
          "2. In Firefox, tap the shield icon → Permissions",
          "3. Allow location access",
          "4. Or go to Firefox Settings → Site Settings → Location",
          "5. Refresh this page"
        ]
      },
      desktop: {
        chrome: [
          "1. Click the location icon in the address bar",
          "2. Select 'Always allow location access'",
          "3. Or go to Chrome Settings → Privacy → Site Settings → Location",
          "4. Make sure this site is allowed",
          "5. Refresh this page"
        ],
        firefox: [
          "1. Click the shield icon in the address bar",
          "2. Turn off 'Enhanced Tracking Protection' for this site",
          "3. Or go to Firefox Settings → Privacy → Permissions → Location",
          "4. Allow location access for this site",
          "5. Refresh this page"
        ],
        safari: [
          "1. Go to Safari → Preferences → Websites → Location",
          "2. Find this website and set to 'Allow'",
          "3. Or click 'Allow' when prompted",
          "4. Refresh this page"
        ]
      }
    };

    let specificInstructions = [];
    
    if (isIOS) {
      specificInstructions = isSafari ? instructions.ios.safari : instructions.ios.chrome;
    } else if (isAndroid) {
      specificInstructions = isChrome ? instructions.android.chrome : instructions.android.firefox;
    } else {
      if (isChrome) specificInstructions = instructions.desktop.chrome;
      else if (isFirefox) specificInstructions = instructions.desktop.firefox;
      else if (isSafari) specificInstructions = instructions.desktop.safari;
      else specificInstructions = instructions.desktop.chrome; // Default to Chrome instructions
    }

    return { common: instructions.common, specific: specificInstructions };
  };

  const instructions = getInstructions();

  return (
    <motion.div 
      className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div 
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                <FiHelpCircle className="text-blue-600 text-xl" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Location Access Help</h2>
                <p className="text-gray-600">
                  {deviceInfo.deviceType} • {deviceInfo.browserName}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <FiX className="text-xl text-gray-500" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Problem Diagnosis */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center mr-3">
                <FiX className="text-red-600 text-sm" />
              </div>
              What's the Problem?
            </h3>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-red-800 mb-2">
                Your browser cannot access your device's location. This could be because:
              </p>
              <ul className="text-red-700 text-sm space-y-1 ml-4">
                <li>• Location permissions are denied</li>
                <li>• GPS/Location Services are turned off</li>
                <li>• Browser settings are blocking location access</li>
                <li>• You're using an insecure connection (HTTP instead of HTTPS)</li>
              </ul>
            </div>
          </div>

          {/* General Steps */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                <span className="text-blue-600 text-sm font-bold">1</span>
              </div>
              General Steps (All Devices)
            </h3>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <ul className="text-blue-800 space-y-2">
                {instructions.common.map((step, index) => (
                  <li key={index} className="flex items-start">
                    <div className="w-2 h-2 rounded-full bg-blue-400 mt-2 mr-3 flex-shrink-0"></div>
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Device-Specific Steps */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mr-3">
                <span className="text-green-600 text-sm font-bold">2</span>
              </div>
              Device-Specific Steps
              <div className="ml-3 flex items-center">
                {deviceInfo.isMobile ? (
                  <FiSmartphone className="text-gray-500" />
                ) : (
                  <FiMonitor className="text-gray-500" />
                )}
                <span className="ml-1 text-sm text-gray-500">
                  {deviceInfo.deviceType} • {deviceInfo.browserName}
                </span>
              </div>
            </h3>
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <ol className="text-green-800 space-y-3">
                {instructions.specific.map((step, index) => (
                  <li key={index} className="flex items-start">
                    <div className="w-6 h-6 rounded-full bg-green-200 flex items-center justify-center mr-3 flex-shrink-0 mt-0.5">
                      <span className="text-green-700 text-xs font-bold">{index + 1}</span>
                    </div>
                    <span className="font-medium">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* Troubleshooting Tips */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <div className="w-6 h-6 rounded-full bg-yellow-100 flex items-center justify-center mr-3">
                <span className="text-yellow-600 text-sm font-bold">!</span>
              </div>
              Still Not Working?
            </h3>
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <ul className="text-yellow-800 space-y-2">
                <li className="flex items-start">
                  <div className="w-2 h-2 rounded-full bg-yellow-400 mt-2 mr-3 flex-shrink-0"></div>
                  Try refreshing the page after changing settings
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 rounded-full bg-yellow-400 mt-2 mr-3 flex-shrink-0"></div>
                  Clear your browser cache and cookies
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 rounded-full bg-yellow-400 mt-2 mr-3 flex-shrink-0"></div>
                  Try using a different browser (Chrome recommended)
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 rounded-full bg-yellow-400 mt-2 mr-3 flex-shrink-0"></div>
                  Make sure you're using HTTPS (secure connection)
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 rounded-full bg-yellow-400 mt-2 mr-3 flex-shrink-0"></div>
                  Restart your browser completely
                </li>
              </ul>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => {
                onClose();
                window.location.reload();
              }}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
            >
              I've Fixed It - Refresh Page
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-medium"
            >
              Close Help
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};



const TutorOverview = () => {
  const { alreadyMarked, loading: attendanceCheckLoading, error: attendanceCheckError } = useTodayAttendance();
  const [showDeniedPopover, setShowDeniedPopover] = useState(false);
  const popoverRef = useRef();

  const [currentTime, setCurrentTime] = useState(new Date())
  const [currentLocation, setCurrentLocation] = useState(null)
  const [locationMatch, setLocationMatch] = useState(null)
  const [attendanceMarked, setAttendanceMarked] = useState(false)
  const [error, setError] = useState(null)
  const [locationError, setLocationError] = useState(null)
  const [distance, setDistance] = useState(null)
  const [isLocationLoading, setIsLocationLoading] = useState(true)
  const [showLocationHelp, setShowLocationHelp] = useState(false)
  const locationMarkerRef = useRef(null)

  // Get tutor data from localStorage
  const tutorData = JSON.parse(localStorage.getItem('userData') || '{}')
  const { post } = usePost()

  // Get center location from tutor data
  const centerLocation = tutorData.assignedCenter?.coordinates
    ? {
        lat: parseFloat(tutorData.assignedCenter.coordinates[0]),
        lng: parseFloat(tutorData.assignedCenter.coordinates[1])
      }
    : null

  // Fetch students
  const { response: students, loading } = useGet('/students')

  // Calculate counts
  const totalStudents = students ? students.length : 0
  // Get students in the same center as the tutor
  const centerStudents = students ? students.filter(s => {
    const studentCenterId = s.assignedCenter && (typeof s.assignedCenter === 'string' ? s.assignedCenter : s.assignedCenter._id);
    const tutorCenterId = tutorData.assignedCenter && (typeof tutorData.assignedCenter === 'string' ? tutorData.assignedCenter : tutorData.assignedCenter._id);
    return studentCenterId === tutorCenterId;
  }).length : 0

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const handleLocationUpdate = useCallback((location) => {
    // Validate location data
    if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
      console.error('Invalid location data received:', location);
      setLocationError('Invalid location data received');
      setIsLocationLoading(false);
      return;
    }

    // Check for valid coordinate ranges
    if (location.lat < -90 || location.lat > 90 || location.lng < -180 || location.lng > 180) {
      console.error('Location coordinates out of valid range:', location);
      setLocationError('Location coordinates are invalid');
      setIsLocationLoading(false);
      return;
    }

    console.log('Valid location update received:', location);
    setLocationError(null);
    setCurrentLocation(location);
    setIsLocationLoading(false);
    
    if (centerLocation) {
      // Calculate distance between current location and center location
      const calculatedDistance = calculateDistance(location, centerLocation);
      setDistance(calculatedDistance);
      console.log('Distance to center:', calculatedDistance, 'km');
      setLocationMatch(calculatedDistance <= 0.1); // Within 100 meters (0.1 km)
    }
  }, [centerLocation]);

  const handleLocationError = useCallback((errorMessage, shouldShowHelp) => {
    setLocationError(errorMessage);
    setIsLocationLoading(false);
    
    // Auto-show help for critical errors
    if (shouldShowHelp && errorMessage.includes('denied')) {
      // Auto-show help after a short delay for permission denied errors
      setTimeout(() => {
        setShowLocationHelp(true);
      }, 2000);
    }
  }, []);

  // Function to detect user's device and browser
  const getDeviceInfo = () => {
    const userAgent = navigator.userAgent;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(userAgent);
    const isAndroid = /Android/.test(userAgent);
    const isChrome = /Chrome/.test(userAgent);
    const isFirefox = /Firefox/.test(userAgent);
    const isSafari = /Safari/.test(userAgent) && !isChrome;
    const isEdge = /Edge/.test(userAgent);

    return {
      isMobile,
      isIOS,
      isAndroid,
      isChrome,
      isFirefox,
      isSafari,
      isEdge,
      browserName: isChrome ? 'Chrome' : isFirefox ? 'Firefox' : isSafari ? 'Safari' : isEdge ? 'Edge' : 'Unknown',
      deviceType: isIOS ? 'iOS' : isAndroid ? 'Android' : isMobile ? 'Mobile' : 'Desktop'
    };
  };

  const handleRefreshLocation = useCallback(() => {
    setIsLocationLoading(true);
    setLocationError(null);
    setCurrentLocation(null);
    setLocationMatch(null);
    setDistance(null);
    
    // Force a new location request
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          handleLocationUpdate(location);
        },
        (error) => {
          console.error('Manual location refresh failed:', error);
          setLocationError('Failed to refresh location. Please try again.');
          setIsLocationLoading(false);
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
      );
    } else {
      fetchLocationFallback().then((fallbackPosition) => {
        if (fallbackPosition) {
          handleLocationUpdate(fallbackPosition);
        } else {
          setLocationError('Unable to determine location.');
          setIsLocationLoading(false);
        }
      });
    }
  }, [handleLocationUpdate, centerLocation]);

  const calculateDistance = (loc1, loc2) => {
    // Haversine formula to calculate distance between two points
    const R = 6371 // Earth's radius in km
    const dLat = (loc2.lat - loc1.lat) * Math.PI / 180
    const dLon = (loc2.lng - loc1.lng) * Math.PI / 180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(loc1.lat * Math.PI / 180) * Math.cos(loc2.lat * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  const handleMarkAttendance = async () => {
    if (locationMatch && currentLocation) {
      try {
        const userDataString = localStorage.getItem('userData'); // Changed from 'user' to 'userData' for consistency
        const token = userDataString ? JSON.parse(userDataString).token : null;
        if (!token) {
          throw new Error('Authentication token not found')
        }

        const response = await fetch(`${import.meta.env.VITE_API_URL}/tutors/attendance`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            currentLocation: [currentLocation.lat, currentLocation.lng]
          })
        })

        const data = await response.json()
        if (data.message === 'Attendance submitted successfully') {
          setAttendanceMarked(true)
          setError(null)
        }
      } catch (error) {
        // Detect duplicate key error (E11000) from backend
        if (error.message && error.message.includes('E11000')) {
          setShowDeniedPopover(true);
        } else {
          setError(error.message || 'Failed to mark attendance');
        }
        console.error('Error marking attendance:', error);
      }
    }
  }

  // handleReset function removed

  if (!centerLocation) {
    return <div className="text-center text-red-600 p-4">
      Unable to load center location. Please log in again.
    </div>
  }

  return (
    <div className="min-h-screen w-full bg-[conic-gradient(at_top_right,_var(--tw-gradient-stops))] from-blue-100 via-accent-50 to-primary-50 py-6 px-4 sm:px-6 lg:px-8">
      {/* Dashboard Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">Tutor Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back, {tutorData.name || 'Tutor'}</p>
      </div>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Students Card */}
        <div className="rounded-xl shadow-lg bg-gradient-to-tr from-primary-600 to-accent-600 text-white p-4 flex flex-col items-center justify-center transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-primary-500/20">
          <div className="w-10 h-10 rounded-full bg-white bg-opacity-20 flex items-center justify-center mb-2 backdrop-blur-sm">
            <FiUsers className="text-xl text-white" />
          </div>
          <div className="text-2xl font-bold mb-0.5">
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
              </svg>
            ) : centerStudents}
          </div>
          <div className="text-sm font-medium tracking-wide opacity-90">Center Students all</div>
        </div>

        {/* Time Card */}
        <div className="rounded-xl shadow-lg bg-gradient-to-tr from-blue-600 to-blue-400 text-white p-4 flex flex-col items-center justify-center transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/20">
          <div className="w-10 h-10 rounded-full bg-white bg-opacity-20 flex items-center justify-center mb-2 backdrop-blur-sm">
            <FiClock className="text-xl text-white" />
          </div>
          <div className="text-2xl font-bold mb-0.5">
            {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div className="text-sm font-medium tracking-wide opacity-90">Current Time</div>
        </div>

        {/* Attendance Status Card */}
        <div className="rounded-xl shadow-lg bg-gradient-to-tr from-green-600 to-emerald-400 text-white p-4 flex flex-col items-center justify-center transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-green-500/20">
          <div className="w-10 h-10 rounded-full bg-white bg-opacity-20 flex items-center justify-center mb-2 backdrop-blur-sm">
            {attendanceMarked || alreadyMarked ? (
              <FiCheck className="text-xl text-white" />
            ) : (
              <FiClock className="text-xl text-white" />
            )}
          </div>
          <div className="text-2xl font-bold mb-0.5 text-center">
            {attendanceMarked || alreadyMarked ? 'Marked' : 'Pending'}
          </div>
          <div className="text-sm font-medium tracking-wide opacity-90">Today's Attendance</div>
        </div>
      </div>

      {showDeniedPopover && (
        <motion.div 
          ref={popoverRef} 
          className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-30 px-4 sm:px-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div 
            className="bg-white rounded-lg shadow-xl p-5 sm:p-6 max-w-sm w-full flex flex-col items-center"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
          >
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-3">
              <FiX className="text-red-600 text-xl" />
            </div>
            <div className="text-red-600 text-xl font-bold mb-2">Request Denied</div>
            <div className="text-gray-700 text-center mb-4">Attendance has already been marked for today.</div>
            <button
              className="px-5 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 w-full sm:w-auto"
              onClick={() => setShowDeniedPopover(false)}
            >
              Close
            </button>
          </motion.div>
        </motion.div>
      )}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 sm:p-8 border border-white/20"
      >
        <h2 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent mb-6">Mark Attendance</h2>
        {attendanceCheckLoading ? (
          <div className="mb-6 p-4 bg-blue-50/80 backdrop-blur-sm text-blue-700 rounded-xl border border-blue-100 flex items-center">
            <svg className="animate-spin h-5 w-5 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
            </svg>
            Checking attendance status...
          </div>
        ) : alreadyMarked ? (
          <div className="mb-6 p-4 bg-green-50/80 backdrop-blur-sm text-green-700 rounded-xl border border-green-100 flex items-center">
            <FiCheck className="h-5 w-5 mr-3" />
            Today's attendance has already been marked.
          </div>
        ) : (
          <>
            {isLocationLoading && !currentLocation && (
              <div className="mb-6 p-4 bg-blue-50/80 backdrop-blur-sm text-blue-700 rounded-xl border border-blue-100 flex items-center">
                <svg className="animate-spin h-5 w-5 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                </svg>
                Getting your current location... Please ensure location permissions are enabled.
              </div>
            )}
            {error && (
              <div className="mb-6 p-4 bg-red-50/80 backdrop-blur-sm text-red-700 rounded-xl border border-red-100 flex items-center">
                <FiX className="h-5 w-5 mr-3" />
                {error}
              </div>
            )}
            {locationError && (
              <div className="mb-6 p-4 bg-red-50/80 backdrop-blur-sm text-red-700 rounded-xl border border-red-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <FiX className="h-5 w-5 mr-3" />
                    {locationError}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleRefreshLocation}
                    className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
                  >
                    Retry
                  </button>
                  <button
                    onClick={() => setShowLocationHelp(true)}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium flex items-center"
                  >
                    <FiHelpCircle className="w-4 h-4 mr-1" />
                    Get Help
                  </button>
                </div>
              </div>
            )}
            <div className="relative h-[300px] sm:h-[350px] md:h-[400px] rounded-2xl overflow-hidden mb-6 shadow-2xl border border-white/20 bg-white/5 backdrop-blur-sm transition-all duration-300 hover:shadow-accent-500/20">
              <MapContainer
                center={[centerLocation.lat, centerLocation.lng]}
                zoom={15}
                style={{ height: '100%', width: '100%' }}
                attributionControl={false}
                className="z-10"
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <LocationMarker 
                  onLocationUpdate={handleLocationUpdate} 
                  onLocationError={handleLocationError}
                />
                <Marker 
                  position={[centerLocation.lat, centerLocation.lng]} 
                  icon={blueIcon}
                />
                <Circle
                  center={[centerLocation.lat, centerLocation.lng]}
                  radius={100}
                  pathOptions={{ color: '#4F46E5', fillColor: '#4F46E5', fillOpacity: 0.1 }}
                />
              </MapContainer>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div className="w-full sm:w-auto">
                {isLocationLoading ? (
                  <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/20 shadow-lg transition-all duration-300">
                    <div className="flex items-center">
                      <svg className="animate-spin h-4 w-4 mr-3 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                      </svg>
                      <p className="text-base sm:text-lg font-medium text-blue-600">
                        Detecting location...
                      </p>
                    </div>
                  </div>
                ) : locationMatch !== null ? (
                  <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/20 shadow-lg transition-all duration-300 hover:shadow-xl hover:shadow-primary-500/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className={`w-4 h-4 rounded-full mr-3 ${locationMatch ? 'bg-green-500' : 'bg-red-500'} shadow-lg`}></div>
                        <div>
                          <p className={`text-base sm:text-lg font-medium ${locationMatch ? 'text-green-600' : 'text-red-600'}`}>
                            {locationMatch 
                              ? 'Location verified'
                              : 'Location mismatch'}
                          </p>
                          {distance !== null && (
                            <p className="text-sm text-gray-500">
                              Distance: {(distance * 1000).toFixed(0)}m from center
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={handleRefreshLocation}
                        disabled={isLocationLoading}
                        className="ml-3 p-2 text-gray-500 hover:text-blue-600 transition-colors"
                        title="Refresh location"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ) : currentLocation === null && !locationError ? (
                  <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/20 shadow-lg transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-4 h-4 rounded-full mr-3 bg-yellow-500 shadow-lg"></div>
                        <p className="text-base sm:text-lg font-medium text-yellow-600">
                          Waiting for location...
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleRefreshLocation}
                          className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
                          title="Try to get location"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setShowLocationHelp(true)}
                          className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
                          title="Get help with location"
                        >
                          <FiHelpCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
              <div className="flex gap-4 w-full sm:w-auto justify-end">
                <button
                  onClick={handleMarkAttendance}
                  disabled={!locationMatch || attendanceMarked || isLocationLoading}
                  className={`px-6 py-3 rounded-xl transition-all duration-300 flex items-center justify-center flex-1 sm:flex-none text-base font-medium shadow-lg ${
                    locationMatch && !attendanceMarked && !isLocationLoading
                      ? 'bg-gradient-to-r from-green-600 to-emerald-500 text-white hover:shadow-xl hover:shadow-green-500/25 hover:-translate-y-0.5'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {attendanceMarked ? <FiCheck className="mr-2 text-lg" /> : null}
                  {attendanceMarked ? 'Marked' : 'Mark Attendance'}
                </button>
              </div>
            </div>
          </>
        )}
      </motion.div>

      {/* Location Help Modal */}
      <LocationHelpModal 
        isOpen={showLocationHelp}
        onClose={() => setShowLocationHelp(false)}
        deviceInfo={getDeviceInfo()}
      />
    </div>
  )
}

export default TutorOverview
