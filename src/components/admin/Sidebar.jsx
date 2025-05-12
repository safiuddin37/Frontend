import { motion } from 'framer-motion'
import { FiHome, FiUsers, FiMapPin, FiFileText, FiUser, FiLogOut, FiUserPlus } from 'react-icons/fi'
import { BiRupee } from 'react-icons/bi' // Importing rupee sign icon
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const Sidebar = ({ activeTab, onTabChange, className }) => {
  const [adminProfile, setAdminProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadUserData = () => {
      const userData = localStorage.getItem('userData');
      if (!userData) {
        navigate('/admin');
        return;
      }

      try {
        const parsedData = JSON.parse(userData);
        if (!parsedData || !parsedData._id || !parsedData.token || parsedData.role !== 'admin') {
          localStorage.removeItem('userData');
          navigate('/admin');
          return;
        }
        setAdminProfile(parsedData);
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('userData');
        navigate('/admin');
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('userData');
    navigate('/admin');
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FiHome },
    { id: 'tutors', label: 'Tutors', icon: FiUsers },
    { id: 'hadiya', label: 'Hadiya Mgmt', icon: BiRupee }, // Using rupee icon for Hadiya
    { id: 'centers', label: 'Centers', icon: FiMapPin },
    { id: 'reports', label: 'Reports', icon: FiFileText },
    { id: 'students', label: 'Students', icon: FiUser },
    { id: 'admins', label: 'Admins', icon: FiUserPlus }
  ];

  if (isLoading) {
    return (
      <div className="w-64 bg-white h-screen shadow-lg flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Loading...</span>
      </div>
    );
  }

  if (!adminProfile) {
    return null;
  }

  return (
    <motion.div
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      exit={{ x: -300 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={`fixed top-0 left-0 h-screen w-64 bg-gray-800 text-white shadow-2xl border-r border-gray-700 overflow-hidden flex flex-col ${className}`}
    >
      <div className="p-6 border-b border-gray-700 bg-gray-900">
        <h2 className="text-lg font-bold text-white">Admin Panel</h2>
      </div>
      <nav className="p-4 flex-1 overflow-y-auto">
        <div className="space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`w-full flex items-center px-4 py-3 rounded-xl text-left transition-all duration-300 relative group ${activeTab === tab.id
                ? 'bg-gradient-to-r from-gray-700 to-gray-600 text-white shadow-lg'
                : 'text-gray-300 hover:bg-gray-700 hover:shadow-md'}`}
              aria-current={activeTab === tab.id ? 'page' : undefined}
            >
              <span className={`mr-3 transition-transform duration-300 transform group-hover:scale-110 ${activeTab === tab.id ? 'text-white' : 'text-gray-400'}`}>{tab.icon}</span>
              <span className="font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>
      <div className="p-4 border-t border-gray-700 bg-gray-900">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center px-4 py-3 text-red-500 hover:text-red-600 hover:bg-red-50/80 rounded-xl transition-all duration-300 font-medium"
        >
          <FiLogOut className="mr-2 text-lg" />
          Logout
        </button>
      </div>
    </motion.div>
  );
};

export default Sidebar;