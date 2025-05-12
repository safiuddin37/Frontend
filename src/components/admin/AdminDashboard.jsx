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
    <div className="flex flex-col h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Mobile Header - Only visible on small screens */}
      <header className="md:hidden bg-white/80 backdrop-blur-sm shadow-lg p-4 flex justify-between items-center sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {sidebarOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
          <h1 className="ml-3 text-xl font-semibold text-gray-800">Admin Panel</h1>
        </div>
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white text-lg font-medium">
            {user?.name.charAt(0)}
          </div>
        </div>
      </header>
      
      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Responsive behavior */}
        <div className={`
          ${sidebarOpen ? 'fixed inset-0 z-40 md:relative md:inset-auto' : 'hidden md:block'}
          md:relative w-full md:w-64 md:flex-shrink-0 transition-all duration-300 ease-in-out
        `}>
          {/* Mobile Overlay */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-30 md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Sidebar */}
          <Sidebar
            activeTab={activeTab}
            setActiveTab={(tab) => {
              setActiveTab(tab);
              if (window.innerWidth < 768) setSidebarOpen(false);
            }}
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />

          {/* Main Content */}
          <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
              <div className="bg-white/60 backdrop-blur-sm shadow-xl rounded-2xl p-6 border border-white/20">
                {renderContent()}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
