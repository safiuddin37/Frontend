import { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { MapContainer, TileLayer, Marker, useMap, Circle } from 'react-leaflet'
import { FiUsers, FiClock, FiCheck, FiX, FiHelpCircle } from 'react-icons/fi'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import useGet from '../CustomHooks/useGet'
import usePost from '../CustomHooks/usePost'
import useTodayAttendance from './useTodayAttendance'

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

const LocationMarker = ({ onLocationUpdate, onLocationError }) => {
  const [position, setPosition] = useState(null)
  const map = useMap()
  const watchIdRef = useRef(null)
  const hasAnimatedRef = useRef(false)

  useEffect(() => {
    if (!navigator.geolocation) {
      const message = 'Geolocation is not supported by this browser. Please use a modern browser with GPS support.';
      if (onLocationError) {
        onLocationError(message, true);
      }
      return;
    }

    const handleSuccess = (position) => {
      const { latitude, longitude, accuracy } = position.coords;
      console.log('GPS Location received:', { latitude, longitude, accuracy });
      
      // Basic coordinate validation
      if (!latitude || !longitude || 
          latitude < -90 || latitude > 90 || 
          longitude < -180 || longitude > 180) {
        console.warn('Invalid GPS coordinates received:', { latitude, longitude });
        return;
      }

      const latlng = { lat: latitude, lng: longitude };
      setPosition(latlng);
      onLocationUpdate(latlng);
      
      // Animate to location on first successful reading
      if (!hasAnimatedRef.current) {
        map.flyTo(latlng, 16, { animate: true });
        hasAnimatedRef.current = true;
      } else {
        // Just update position without animation for subsequent updates
        map.setView(latlng, map.getZoom(), { animate: false });
      }
    };

    const handleError = (error) => {
      let message = '';
      let shouldShowHelp = false;
      
      switch (error.code) {
        case error.PERMISSION_DENIED:
          message = 'Location access denied. Please allow location access and refresh the page.';
          shouldShowHelp = true;
          break;
        case error.POSITION_UNAVAILABLE:
          message = 'Location information is unavailable. Please check your GPS settings.';
          shouldShowHelp = true;
          break;
        case error.TIMEOUT:
          message = 'Location request timed out. Please try again.';
          shouldShowHelp = true;
          break;
        default:
          message = 'An error occurred while retrieving location. Please try again.';
          shouldShowHelp = true;
          break;
      }
      
      console.error('Geolocation error:', error);
      if (onLocationError) {
        onLocationError(message, shouldShowHelp);
      }
    };

    // Simple, reliable GPS options
    const gpsOptions = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 30000
    };

    // Get initial position
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, gpsOptions);

    // Watch position for continuous updates
    watchIdRef.current = navigator.geolocation.watchPosition(handleSuccess, handleError, gpsOptions);

    // Cleanup on unmount
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [map, onLocationUpdate, onLocationError]);

  return position === null ? null : (
    <Marker 
      position={position} 
      icon={redIcon}
      title="Your current GPS location"
    />
  )
}

// Simple Location Help Modal Component
const LocationHelpModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <motion.div 
      className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div 
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
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
                <h2 className="text-2xl font-bold text-gray-900">Location Help</h2>
                <p className="text-gray-600">Enable GPS access</p>
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
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">How to Enable Location Access:</h3>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <ul className="text-blue-800 space-y-3">
                <li className="flex items-start">
                  <div className="w-2 h-2 rounded-full bg-blue-400 mt-2 mr-3 flex-shrink-0"></div>
                  <span>Make sure GPS/Location Services are enabled on your device</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 rounded-full bg-blue-400 mt-2 mr-3 flex-shrink-0"></div>
                  <span>Allow location access when prompted by the browser</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 rounded-full bg-blue-400 mt-2 mr-3 flex-shrink-0"></div>
                  <span>Refresh the page and try again</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 rounded-full bg-blue-400 mt-2 mr-3 flex-shrink-0"></div>
                  <span>Make sure you're using HTTPS (secure connection)</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Got it
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
  const [isLocationLoading, setIsLocationLoading] = useState(true)
  const [showLocationHelp, setShowLocationHelp] = useState(false)
  const [distance, setDistance] = useState(null)

  // Get center data
  const { data: centerData, loading: centerLoading, error: centerError } = useGet('/center/tutor-center')
  const centerLocation = centerData?.center?.location

  // Post attendance
  const { postData: markAttendance, loading: markingAttendance } = usePost('/attendance/mark')

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Set attendance as marked if already marked today
  useEffect(() => {
    if (alreadyMarked) {
      setAttendanceMarked(true);
    }
  }, [alreadyMarked]);

  // Calculate distance when both locations are available
  useEffect(() => {
    if (currentLocation && centerLocation) {
      const calculateDistance = (lat1, lng1, lat2, lng2) => {
        const R = 6371 // Earth's radius in kilometers
        const dLat = (lat2 - lat1) * Math.PI / 180
        const dLng = (lng2 - lng1) * Math.PI / 180
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
          Math.sin(dLng / 2) * Math.sin(dLng / 2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        return R * c
      }

      const calculatedDistance = calculateDistance(
        currentLocation.lat,
        currentLocation.lng,
        centerLocation.coordinates[1],
        centerLocation.coordinates[0]
      )

      setDistance(calculatedDistance)
      console.log('Distance to center:', calculatedDistance, 'km')
      setLocationMatch(calculatedDistance <= 0.1) // Within 100 meters (0.1 km)
    }
  }, [currentLocation, centerLocation])

  const handleLocationError = useCallback((errorMessage, shouldShowHelp) => {
    setLocationError(errorMessage);
    setIsLocationLoading(false);
    
    // Auto-show help for critical errors
    if (shouldShowHelp && errorMessage && errorMessage.includes('denied')) {
      // Auto-show help after a short delay for permission denied errors
      setTimeout(() => {
        setShowLocationHelp(true);
      }, 2000);
    }
  }, []);

  const handleRefreshLocation = useCallback(() => {
    setIsLocationLoading(true);
    setLocationError(null);
    setCurrentLocation(null);
    setLocationMatch(null);
    setDistance(null);
    
    // Force a page reload to restart geolocation
    window.location.reload();
  }, []);

  const handleLocationUpdate = useCallback((location) => {
    setCurrentLocation(location);
    setIsLocationLoading(false);
    setLocationError(null);
  }, []);

  const handleMarkAttendance = async () => {
    if (!locationMatch || attendanceMarked) return

    try {
      const result = await markAttendance({
        location: {
          type: 'Point',
          coordinates: [currentLocation.lng, currentLocation.lat]
        }
      })

      if (result.success) {
        setAttendanceMarked(true)
        setError(null)
      } else {
        setError(result.message || 'Failed to mark attendance')
      }
    } catch (err) {
      setError('Failed to mark attendance. Please try again.')
      console.error('Attendance marking error:', err)
    }
  }

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    })
  }

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (centerLoading || attendanceCheckLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (centerError || attendanceCheckError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <p className="text-red-600">{centerError || attendanceCheckError}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold text-gray-900 mb-2"
          >
            Tutor Dashboard
          </motion.h1>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-gray-600"
          >
            <p className="text-lg">{formatDate(currentTime)}</p>
            <p className="text-2xl font-mono font-semibold text-blue-600">
              {formatTime(currentTime)}
            </p>
          </motion.div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
          >
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                <FiUsers className="text-blue-600 text-xl" />
              </div>
              <div>
                <p className="text-gray-600 text-sm">Center</p>
                <p className="text-xl font-semibold text-gray-900">
                  {centerData?.center?.name || 'Loading...'}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
          >
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mr-4">
                <FiClock className="text-green-600 text-xl" />
              </div>
              <div>
                <p className="text-gray-600 text-sm">Status</p>
                <p className="text-xl font-semibold text-gray-900">
                  {attendanceMarked ? 'Present' : 'Not Marked'}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
          >
            <div className="flex items-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 ${
                locationMatch ? 'bg-green-100' : 'bg-red-100'
              }`}>
                <div className={`w-3 h-3 rounded-full ${
                  locationMatch ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Location</p>
                <p className="text-xl font-semibold text-gray-900">
                  {isLocationLoading ? 'Detecting...' : 
                   locationMatch ? 'In Range' : 
                   locationError ? 'Error' : 'Out of Range'}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Map and Attendance Section */}
        {centerLocation && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8"
            >
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Location Tracking</h2>
                <p className="text-gray-600">
                  You must be within 100 meters of the center to mark attendance
                </p>
                {distance !== null && (
                  <p className="text-sm text-gray-500 mt-1">
                    Distance to center: {(distance * 1000).toFixed(0)} meters
                  </p>
                )}
              </div>
              
              <div className="h-96 relative">
                <MapContainer
                  center={[centerLocation.coordinates[1], centerLocation.coordinates[0]]}
                  zoom={16}
                  className="h-full w-full"
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  
                  {/* Center marker */}
                  <Marker
                    position={[centerLocation.coordinates[1], centerLocation.coordinates[0]]}
                    icon={blueIcon}
                    title="Center Location"
                  />
                  
                  {/* Attendance radius */}
                  <Circle
                    center={[centerLocation.coordinates[1], centerLocation.coordinates[0]]}
                    radius={100}
                    pathOptions={{
                      color: locationMatch ? '#10b981' : '#ef4444',
                      fillColor: locationMatch ? '#10b981' : '#ef4444',
                      fillOpacity: 0.1
                    }}
                  />
                  
                  {/* User location marker */}
                  <LocationMarker 
                    onLocationUpdate={handleLocationUpdate}
                    onLocationError={handleLocationError}
                  />
                </MapContainer>

                {/* Location error overlay */}
                {locationError && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000]">
                    <div className="bg-white rounded-xl p-6 max-w-md mx-4 text-center">
                      <div className="text-red-500 text-4xl mb-4">📍</div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Location Access Required</h3>
                      <p className="text-gray-600 mb-4 text-sm">{locationError}</p>
                      <div className="flex gap-2 justify-center">
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
                )}
              </div>
              
              <div className="p-6 bg-gray-50">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-center sm:text-left">
                    <p className="text-sm text-gray-600 mb-1">Attendance Status</p>
                    <p className={`text-lg font-semibold ${
                      attendanceMarked ? 'text-green-600' : 
                      locationMatch ? 'text-blue-600' : 'text-red-600'
                    }`}>
                      {attendanceMarked ? 'Already Marked Today' :
                       locationMatch ? 'Ready to Mark' : 
                       isLocationLoading ? 'Detecting Location...' : 'Out of Range'}
                    </p>
                  </div>
                  
                  <button
                    onClick={handleMarkAttendance}
                    disabled={!locationMatch || attendanceMarked || isLocationLoading}
                    className={`px-8 py-3 rounded-xl transition-all duration-300 flex items-center justify-center text-base font-medium shadow-lg ${
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
            </motion.div>
          </>
        )}

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6"
          >
            <p className="text-red-800">{error}</p>
          </motion.div>
        )}
      </motion.div>

      {/* Location Help Modal */}
      <LocationHelpModal
        isOpen={showLocationHelp}
        onClose={() => setShowLocationHelp(false)}
      />
    </div>
  )
}

export default TutorOverview