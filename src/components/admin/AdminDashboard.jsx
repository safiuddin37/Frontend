import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Overview from './Overview';
import TutorManagement from './TutorManagement';
import CenterManagement from './CenterManagement';
import ReportManagement from './ReportManagement';
import StudentManagement from './StudentManagement';
import AdminManagement from './AdminManagement';
import HadiyaManagement from './HadiyaManagement';
import { FiMenu, FiX } from 'react-icons/fi'; // Icons for mobile menu toggle

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false); // State to control sidebar visibility on mobile
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check if there's a tab param in location state and set active tab accordingly
    if (location.state && location.state.activeTab) {
      setActiveTab(location.state.activeTab);
      // Clear the state after using it to prevent it from persisting on refresh
      window.history.replaceState({}, document.title);
    }
    
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
        setUser(parsedData);
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

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <Overview />;
      case 'tutors':
        return <TutorManagement />;
      case 'centers':
        return <CenterManagement />;
      case 'reports':
        return <ReportManagement />;
      case 'students':
        return <StudentManagement />;
      case 'admins':
        return <AdminManagement />;
      case 'hadiya': // Added hadiya case
        return <HadiyaManagement />;
      default:
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Welcome, {user?.name}</h1>
            <p className="text-gray-600">Select a section from the sidebar to get started.</p>
          </div>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Loading...</span>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} className="w-64 bg-gray-800 text-white" />
      <div className="flex-1 p-6">
        <div className="bg-white/80 backdrop-blur-lg rounded-xl shadow-md p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
