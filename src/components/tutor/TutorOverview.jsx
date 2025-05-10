import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MapContainer, TileLayer, Marker, useMap, Circle } from 'react-leaflet'
import { FiUsers, FiClock, FiCheck, FiX } from 'react-icons/fi'
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

const LocationMarker = ({ onLocationUpdate }) => {
  const [position, setPosition] = useState(null)
  const map = useMap()

  useEffect(() => {
    map.locate({
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 5000
    }).on("locationfound", function (e) {
      const newPosition = e.latlng
      setPosition(newPosition)
      map.flyTo(newPosition, map.getZoom())
      onLocationUpdate(newPosition)
    }).on("locationerror", function (e) {
      console.error("Location error:", e.message)
    })
  }, [map])

  return position === null ? null : <Marker position={position} icon={redIcon} />
}

import { useRef } from 'react';

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

  const handleLocationUpdate = (location) => {
    setCurrentLocation(location)
    if (centerLocation) {
      // Calculate distance between current location and center location
      const calculatedDistance = calculateDistance(location, centerLocation)
      setDistance(calculatedDistance)
      setLocationMatch(calculatedDistance <= 1.3) // Within 1300 meters (1.3 km)
    }
  }

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

        const response = await fetch('http://localhost:5000/api/tutors/attendance', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
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
    <div className="space-y-6">
      <div className="mb-4">
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 flex items-center justify-between transition-all duration-300 hover:shadow-xl">
           <div>
             <div className="text-xl sm:text-2xl font-bold text-primary-600">
               {loading ? (
                 <svg className="animate-spin h-5 w-5 sm:h-6 sm:w-6 text-primary-600 inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                   <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                   <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                 </svg>
               ) : centerStudents}
             </div>
             <div className="text-sm sm:text-base text-gray-600">Center Students</div>
           </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-50 flex items-center justify-center">
            <FiUsers className="text-2xl sm:text-3xl text-blue-500" />
          </div>
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
        className="bg-white rounded-xl shadow-lg p-4 sm:p-6"
      >
        <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Mark Attendance</h2>
        {attendanceCheckLoading ? (
          <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded">Checking attendance status...</div>
        ) : alreadyMarked ? (
          <div className="mb-4 p-3 bg-green-50 text-green-700 rounded">Today's attendance has already been marked.</div>
        ) : (
          <>
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded">
                {error}
              </div>
            )}
            {locationError && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg">
                {locationError}
              </div>
            )}
            <div className="h-[300px] sm:h-[350px] md:h-[400px] rounded-lg overflow-hidden mb-4 shadow-md border border-gray-100">
              <MapContainer
                center={[centerLocation.lat, centerLocation.lng]}
                zoom={15}
                style={{ height: '100%', width: '100%' }}
                attributionControl={false}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <LocationMarker onLocationUpdate={handleLocationUpdate} />
                <Marker 
                  position={[centerLocation.lat, centerLocation.lng]} 
                  icon={blueIcon}
                />
                <Circle
                  center={[centerLocation.lat, centerLocation.lng]}
                  radius={1300}
                  pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.1 }}
                />
              </MapContainer>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
              <div className="w-full sm:w-auto">
                {locationMatch !== null && (
                  <div className="space-y-1 sm:space-y-2 bg-white rounded-lg p-3 border border-gray-100 shadow-sm">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-2 ${locationMatch ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <p className={`text-sm sm:text-base font-medium ${locationMatch ? 'text-green-600' : 'text-red-600'}`}>
                        {locationMatch 
                          ? 'Location verified'
                          : 'Location mismatch'}
                      </p>
                    </div>
                    {/* Distance to center text removed */}
                  </div>
                )}
              </div>
              <div className="flex gap-3 sm:gap-4 w-full sm:w-auto justify-end">
                <button
                  onClick={handleMarkAttendance}
                  disabled={!locationMatch || attendanceMarked}
                  className={`px-3 sm:px-4 py-2 rounded-lg transition-colors flex items-center justify-center flex-1 sm:flex-none text-sm sm:text-base ${
                    locationMatch && !attendanceMarked
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {attendanceMarked ? <FiCheck className="mr-2" /> : null}
                  {attendanceMarked ? 'Marked' : 'Mark Attendance'}
                </button>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </div>
  )
}

export default TutorOverview