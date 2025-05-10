import { motion } from 'framer-motion'
import { FiLogOut, FiUser } from 'react-icons/fi'
import { useState, useEffect } from 'react'
import { useNavigate } from "react-router-dom";

const TutorSidebar = ({ activeTab, setActiveTab, tabs, isMobile }) => {
  const [showProfile, setShowProfile] = useState(false);
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [tutorProfile, setTutorProfile] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('userData'); // Changed 'user' to 'userData'
    if (userData) {
      setTutorProfile(JSON.parse(userData));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("userData"); // Changed to remove 'userData'
    // localStorage.removeItem("token"); // Token is usually part of userData, so this might be redundant or handled if token is stored separately
    setIsLoggedIn(false); // This state might need to be lifted if it controls parent component
    navigate("/tutor");
  };

  if (!tutorProfile) {
    return null; // or a loading spinner
  }

  // Get center name from tutor profile
  const getCenterName = () => {
    if (tutorProfile.assignedCenter?.name) {
      return tutorProfile.assignedCenter.name;
    }
    return 'Center not assigned';
  };

  return (
    <aside className={`bg-white shadow-xl ${isMobile ? 'w-64 h-full overflow-y-auto' : 'w-64 fixed h-screen bg-gradient-to-b from-white to-blue-50'}`}>
      <div className="p-4 sm:p-6 border-b border-blue-100">
        <div 
          className="flex items-center cursor-pointer group"
          onClick={() => setShowProfile(!showProfile)}
          aria-expanded={showProfile}
          aria-haspopup="true"
        >
          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 mr-3 group-hover:bg-primary-200 transition-colors">
            <FiUser size={20} />
          </div>
          <div className="overflow-hidden">
            <h2 className="text-lg font-semibold text-gray-900 truncate">{tutorProfile.name}</h2>
            <p className="text-sm text-gray-600 truncate">{getCenterName()}</p>
          </div>
        </div>
      </div>
      
      <nav className="mt-4 sm:mt-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`w-full flex items-center px-4 sm:px-6 py-3 text-left transition-all duration-300 relative ${
              activeTab === tab.id
                ? 'text-primary-600 bg-primary-50 border-r-4 border-primary-600'
                : 'text-gray-600 hover:bg-primary-50 hover:text-primary-600'
            }`}
            aria-current={activeTab === tab.id ? 'page' : undefined}
          >
            <span className="mr-3 transition-transform duration-300 transform group-hover:scale-110">
              {tab.icon}
            </span>
            <span className="font-medium">{tab.label}</span>
          </button>
        ))}
      </nav>

      {showProfile && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute top-20 left-4 right-4 bg-white rounded-lg shadow-xl p-4 z-50 border border-gray-100"
        >
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold">Profile Details</h3>
            <button 
              onClick={() => setShowProfile(false)}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Close profile details"
            >
              <FiX size={18} />
            </button>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm flex flex-wrap">
              <span className="text-gray-600 w-24 flex-shrink-0">Email:</span> 
              <span className="flex-1 break-all">{tutorProfile.email}</span>
            </p>
            <p className="text-sm flex flex-wrap">
              <span className="text-gray-600 w-24 flex-shrink-0">Phone:</span> 
              <span className="flex-1">{tutorProfile.phone}</span>
            </p>
            <p className="text-sm flex flex-wrap">
              <span className="text-gray-600 w-24 flex-shrink-0">Center:</span> 
              <span className="flex-1">{getCenterName()}</span>
            </p>
            <p className="text-sm flex flex-wrap">
              <span className="text-gray-600 w-24 flex-shrink-0">Join Date:</span> 
              <span className="flex-1">{new Date(tutorProfile.createdAt).toLocaleDateString()}</span>
            </p>
            {tutorProfile.subjects && tutorProfile.subjects.length > 0 && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Subjects:</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {tutorProfile.subjects.map((subject, index) => (
                    <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                      {subject}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      <div className={`${isMobile ? 'mt-8 border-t border-blue-100 p-4 sm:p-6' : 'absolute bottom-0 w-full p-4 sm:p-6 border-t border-blue-100 bg-white bg-opacity-90 backdrop-blur-sm'}`}>
        <button 
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center justify-center sm:justify-start px-4 py-2 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
          aria-label="Logout from account"
        >
          <FiLogOut className="mr-3" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  )
}

export default TutorSidebar