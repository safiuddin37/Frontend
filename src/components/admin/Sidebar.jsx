import { motion } from 'framer-motion'
import { FiHome, FiUsers, FiMapPin, FiFileText, FiUser, FiLogOut, FiUserPlus } from 'react-icons/fi'
import { BiRupee } from 'react-icons/bi' // Importing rupee sign icon
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const Sidebar = ({ activeTab, setActiveTab, isOpen, onClose }) => {
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
      initial={false}
      animate={{ x: isOpen ? 0 : -280 }}
      className={`fixed md:relative top-0 left-0 h-screen z-40 w-[280px] md:w-64 bg-gradient-to-b from-indigo-900 via-purple-900 to-indigo-900 shadow-2xl border-r border-white/10 flex flex-col`}
    >
      {/* Profile Section */}
      <div className="p-6 border-b border-white/10 bg-black/20">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-400 to-purple-400 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
            <FiUser size={24} />
          </div>
          <div>
            <h3 className="font-bold text-white/90">{adminProfile?.name}</h3>
            <p className="text-sm text-white/60">Administrator</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6">
        <div className="px-4 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center px-4 py-3 rounded-xl text-left transition-all duration-300 relative group ${activeTab === tab.id
                ? 'bg-gradient-to-r from-indigo-400 to-purple-400 text-white shadow-lg shadow-indigo-500/30'
                : 'text-white/70 hover:bg-white/10'}`}
            >
              <span className={`mr-3 transition-transform duration-300 transform group-hover:scale-110 ${activeTab === tab.id ? 'text-white' : 'text-white/70'}`}>
                <tab.icon size={20} />
              </span>
              <span className="font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-white/10 bg-black/20 mt-auto">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all duration-300 font-medium group"
        >
          <FiLogOut className="mr-2 text-lg group-hover:scale-110 transition-transform duration-300" />
          Logout
        </button>
      </div>
    </motion.div>
  );
};

export default Sidebar;