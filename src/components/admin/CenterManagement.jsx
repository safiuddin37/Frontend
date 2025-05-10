import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import { FiEdit2, FiTrash2, FiX, FiMapPin, FiAlertTriangle, FiFilter } from 'react-icons/fi';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import useGet from '../CustomHooks/useGet';
import { reverseGeocode } from './utils/reverseGeocode';
import { toast } from 'react-hot-toast';
import { useCenterRefetch } from '../../context/CenterRefetchContext';

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const LocationPicker = ({ position, setPosition }) => {
  useMapEvents({
    click: (e) => {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  return position ? <Marker position={position} /> : null;
};

const CenterManagement = () => {
  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(null);
  const [editingCenter, setEditingCenter] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [filters, setFilters] = useState({
    centerName: '',
    area: '',
    sadarName: '',
    tutorName: ''
  });
  const [formData, setFormData] = useState({
    name: '',
    tutors: '',
    students: '',
    sadarName: '',
    sadarContact: '',
    coordinates: '',
    location: '',
    area: ''
  });
  const [mapCenter, setMapCenter] = useState([17.3850, 78.4867]);
  const [markerPosition, setMarkerPosition] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingCenter, setDeletingCenter] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Get centers data with our fixed useGet hook
  const { response: centers, error, loading, refetch } = useGet("/Centers");
  const refetchContext = useCenterRefetch();

  useEffect(() => {
    if (refetchContext) {
      refetchContext.current = refetch;
    }
  }, [refetch, refetchContext]);

  const handleCoordinatesChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, coordinates: value }));
    
    if (value) {
      const parts = value.split(/[, ]+/).filter(part => part.trim() !== '');
      
      if (parts.length === 2) {
        const lat = parseFloat(parts[0]);
        const lng = parseFloat(parts[1]);
        
        if (!isNaN(lat) && !isNaN(lng)) {
          setMapCenter([lat, lng]);
          setMarkerPosition([lat, lng]);
          
          // Call reverse geocoding
          reverseGeocode(lat, lng)
            .then((address) => {
              setFormData(prev => ({ ...prev, location: address || '' }));
            })
            .catch((error) => {
              console.error('Error during reverse geocoding:', error);
              setFormData(prev => ({ ...prev, location: 'Could not determine location' }));
            });
          return;
        }
      }
    }
    
    // If we get here, either the input is empty or invalid
    setFormData(prev => ({ ...prev, location: '' }));
    setMarkerPosition(null);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEdit = (center) => {
    setEditingCenter(center);
    setFormData({
      name: center.name,
      tutors: center.tutors?.length || 0,
      students: center.students?.length || 0,
      sadarName: center.sadarName,
      sadarContact: center.sadarContact,
      coordinates: center.coordinates.join(', '),
      location: center.location,
      area: center.area
    });
    setMapCenter(center.coordinates);
    setMarkerPosition(center.coordinates);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate required fields
      if (!formData.name || !formData.sadarName || !formData.sadarContact || !formData.coordinates) {
        throw new Error('Please fill all required fields');
      }

      const [lat, lng] = formData.coordinates.split(/[, ]+/).map(coord => parseFloat(coord.trim()));
      
      if (isNaN(lat) || isNaN(lng)) {
        throw new Error('Invalid coordinates format. Please use "latitude, longitude"');
      }

      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('tutors', formData.tutors);
      formDataToSend.append('students', formData.students);
      formDataToSend.append('sadarName', formData.sadarName);
      formDataToSend.append('sadarContact', formData.sadarContact);
      formDataToSend.append('coordinates', JSON.stringify([lat, lng]));
      formDataToSend.append('location', formData.location);
      formDataToSend.append('area', formData.area);

      const userDataString = localStorage.getItem('userData');
      const token = userDataString ? JSON.parse(userDataString).token : null;
      if (!token) {
        throw new Error('No token found in local storage');
      }
      // Define URL based on whether we're editing or creating
      let url;
      if (editingCenter) {
        url = `http://localhost:5000/api/centers/${editingCenter._id}`;
      } else {
        url = 'http://localhost:5000/api/centers';
      }

      const response = await fetch(url, {
        method: editingCenter ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save center');
      }

      await refetch();
      setShowForm(false);
      setEditingCenter(null);
      setFormData({
        name: '',
        tutors: '',
        students: '',
        sadarName: '',
        sadarContact: '',
        coordinates: '',
        location: '',
        area: ''
      });
      toast.success(editingCenter ? 'Center updated successfully!' : 'Center added successfully!');
    } catch (error) {
      console.error('Error:', error);
      toast.error(error.message || 'Failed to save center');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (center) => {
    setDeletingCenter(center);
  };

  const confirmDelete = async () => {
    if (!deletingCenter) return;

    setIsDeleting(true);
    try {
      const userDataString = localStorage.getItem('userData');
      const token = userDataString ? JSON.parse(userDataString).token : null;
      if (!token) {
        throw new Error('No token found in local storage');
      }
      const response = await fetch(`http://localhost:5000/api/centers/${deletingCenter._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete center');
      }

      await refetch();
      toast.success('Center deleted successfully');
    } catch (error) {
      console.error('Error:', error);
      toast.error(error.message || 'Failed to delete center');
    } finally {
      setIsDeleting(false);
      setDeletingCenter(null);
    }
  };

  if (loading) {
    return (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      <span className="ml-3 text-gray-600">Loading Centers...</span>
    </div>
  );}
  if (error) return <p>Error loading centers: {error}</p>;
  if (!centers) return <p>No centers found.</p>;

  const filteredCenters = centers.filter(center => {
    // If all filters are empty, show all centers
    if (!filters.centerName && !filters.area && !filters.sadarName && !filters.tutorName) {
      return true;
    }

    // Check each filter only if it has a value
    const matchesCenterName = !filters.centerName || 
      center.name?.toLowerCase().includes(filters.centerName.toLowerCase());
    
    const matchesArea = !filters.area || 
      center.area?.toLowerCase().includes(filters.area.toLowerCase());
    
    const matchesSadarName = !filters.sadarName || 
      center.sadarName?.toLowerCase().includes(filters.sadarName.toLowerCase());
    
    const matchesTutorName = !filters.tutorName || 
      center.tutors?.some(tutor => 
        tutor.name?.toLowerCase().includes(filters.tutorName.toLowerCase())
      );

    return matchesCenterName && matchesArea && matchesSadarName && matchesTutorName;
  });

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Center Management
        </h1>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg"
        >
          Add New Center
        </button>
      </div>

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">{editingCenter ? 'Edit Center' : 'Add New Center'}</h2>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingCenter(null);
                    setFormData({
                      name: '',
                      tutors: '',
                      students: '',
                      sadarName: '',
                      sadarContact: '',
                      coordinates: '',
                      location: '',
                      area: ''
                    });
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FiX size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Center Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Area</label>
                    <input
                      type="text"
                      name="area"
                      value={formData.area}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sadar Name</label>
                    <input
                      type="text"
                      name="sadarName"
                      value={formData.sadarName}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sadar Contact</label>
                    <input
                      type="text"
                      name="sadarContact"
                      value={formData.sadarContact}
                      onChange={handleChange}
                      pattern="[0-9]{10}"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      required
                    />
                    <p className="mt-1 text-sm text-gray-500">10-digit mobile number</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Coordinates (Lat, Lng)</label>
                    <input
                      type="text"
                      name="coordinates"
                      value={formData.coordinates}
                      onChange={handleCoordinatesChange}
                      placeholder="e.g. 17.3850, 78.4867"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      required
                    />
                    <div className="mt-1 flex items-start text-sm text-blue-600">
                      <FiMapPin className="mr-1.5 mt-0.5 flex-shrink-0" />
                      <span>
                        <span className="font-medium">Quick tip:</span> Right-click any location on Google Maps and select "Copy coordinates" to paste here
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location (Auto-generated)</label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      readOnly
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="h-[300px] rounded-lg overflow-hidden border border-gray-300 mt-4">
                  <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
                    <LocationPicker position={markerPosition} setPosition={(pos) => {
                      if (pos) {
                        setFormData(prev => ({
                          ...prev,
                          coordinates: `${pos[0]}, ${pos[1]}`,
                        }));
                        setMarkerPosition(pos);
                        setMapCenter(pos);
                        
                        reverseGeocode(pos[0], pos[1])
                          .then((address) => {
                            setFormData(prev => ({ ...prev, location: address || '' }));
                          })
                          .catch((error) => {
                            console.error('Error during reverse geocoding:', error);
                            setFormData(prev => ({ ...prev, location: 'Could not determine location' }));
                          });
                      }
                    }} />
                  </MapContainer>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Saving...' : (editingCenter ? 'Update Center' : 'Add Center')}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Centers</h2>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <FiFilter className="text-gray-600" />
              <span className="text-sm font-medium">Filters</span>
            </button>
          </div>
        </div>

        {/* Filter Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Center Name</label>
                  <input
                    type="text"
                    name="centerName"
                    value={filters.centerName}
                    onChange={handleFilterChange}
                    placeholder="Search center name..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Area</label>
                  <input
                    type="text"
                    name="area"
                    value={filters.area}
                    onChange={handleFilterChange}
                    placeholder="Search area..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sadar Name</label>
                  <input
                    type="text"
                    name="sadarName"
                    value={filters.sadarName}
                    onChange={handleFilterChange}
                    placeholder="Search sadar name..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tutor Name</label>
                  <input
                    type="text"
                    name="tutorName"
                    value={filters.tutorName}
                    onChange={handleFilterChange}
                    placeholder="Search tutor name..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Center Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Area
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sadar Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sadar Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tutors
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Students
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCenters.map((center) => (
                <tr
                  key={center._id}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => setShowDetails(center)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{center.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{center.area}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{center.sadarName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{center.sadarContact}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{center.tutors?.length || 0}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{center.students?.length || 0}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex space-x-3" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(center);
                        }}
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        <FiEdit2 size={18} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(center);
                        }}
                        className="text-red-600 hover:text-red-800 transition-colors"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="flex justify-between items-start p-6 border-b">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Center Details
                </h2>
                <button
                  onClick={() => setShowDetails(null)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <FiX size={20} />
                </button>
              </div>

              <div className="overflow-y-auto p-6 space-y-6">
                <div className="flex items-center">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white text-xl font-medium">
                    {showDetails.name.charAt(0)}
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-bold text-gray-900">{showDetails.name}</h3>
                    <p className="text-sm text-gray-500">{showDetails.area}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="font-medium">{showDetails.location}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Area</p>
                    <p className="font-medium">{showDetails.area}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Sadar Name</p>
                    <p className="font-medium">{showDetails.sadarName}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Sadar Contact</p>
                    <p className="font-medium">{showDetails.sadarContact}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Coordinates</p>
                    <p className="font-medium">{showDetails.coordinates?.join(', ') || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Number of Tutors</p>
                    <p className="font-medium">{showDetails.tutors?.length || 0}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Number of Students</p>
                    <p className="font-medium">{showDetails.students?.length || 0}</p>
                  </div>
                </div>

                {showDetails.coordinates && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 mb-2">Location Map</p>
                    <div className="h-[200px] rounded-lg overflow-hidden border border-gray-300">
                      <MapContainer
                        center={showDetails.coordinates}
                        zoom={13}
                        style={{ height: '100%', width: '100%' }}
                      >
                        <TileLayer
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        />
                        <Marker position={showDetails.coordinates} />
                      </MapContainer>
                    </div>
                  </div>
                )}

                {showDetails.images && showDetails.images.length > 0 && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 mb-2">Center Images</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {showDetails.images.map((image, index) => (
                        <div key={index} className="relative aspect-square">
                          <img
                            src={image.url}
                            alt={`Center image ${index + 1}`}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingCenter && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md"
            >
              <div className="flex items-center mb-4">
                <div className="bg-red-100 p-3 rounded-full text-red-600 mr-4">
                  <FiAlertTriangle size={24} />
                </div>
                <h2 className="text-xl font-bold">Delete Center</h2>
              </div>

              <p className="text-gray-600 mb-6">
                Are you sure you want to delete the center "{deletingCenter.name}"? This action cannot be undone.
              </p>

              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setDeletingCenter(null)}
                  disabled={isDeleting}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 flex items-center"
                >
                  {isDeleting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Deleting...
                    </>
                  ) : (
                    'Delete Center'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CenterManagement;