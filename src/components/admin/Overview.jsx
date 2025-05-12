import { motion, AnimatePresence } from 'framer-motion'
import { FiUsers, FiMapPin, FiClock, FiUser, FiCheck, FiX } from 'react-icons/fi'
import useGet from '../CustomHooks/useGet'
import { useState, useMemo, useEffect } from 'react'
import { format } from 'date-fns'
import { toast } from 'react-hot-toast'

// Reusable Popover component for feedback
const Popover = ({ isOpen, onClose, title, message, type = 'success' }) => {
  if (!isOpen) return null;
  
  const bgColor = type === 'success' ? 'bg-green-50 border-green-200' : 
                  type === 'error' ? 'bg-red-50 border-red-200' : 
                  'bg-blue-50 border-blue-200';
                  
  const textColor = type === 'success' ? 'text-green-700' : 
                    type === 'error' ? 'text-red-700' : 
                    'text-blue-700';
  
  return (
    <div className="fixed top-6 right-6 z-50">
      <div className={`rounded-lg shadow-lg p-4 ${bgColor} border ${textColor} max-w-md animate-fade-in`}>
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold">{title || (type === 'success' ? 'Success!' : 'Notice')}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FiX size={18} />
          </button>
        </div>
        <p>{message}</p>
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, title, value, trend, color }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={`${color} rounded-2xl p-6 shadow-lg backdrop-blur-lg bg-opacity-10 border border-slate-700/20`}
  >
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <div className="flex items-center mb-2">
          <Icon className="w-5 h-5 mr-2 text-slate-50" />
          <h3 className="text-sm font-medium text-slate-400">{title}</h3>
        </div>
        <div className="flex items-baseline">
          <p className="text-2xl font-semibold text-slate-50">{value}</p>
          {trend && (
            <span className={`ml-2 text-sm ${trend > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {trend > 0 ? '+' : ''}{trend}%
            </span>
          )}
        </div>
      </div>
    </div>
  </motion.div>
);

const Overview = () => {
  // State for clearing activity
  const [clearingActivity, setClearingActivity] = useState(false);
  const [showPopover, setShowPopover] = useState(false);
  const [popoverMessage, setPopoverMessage] = useState('');
  
  // Fetch tutors, centers, and tutor applications
  const { response: tutors, loading: tutorsLoading } = useGet('/tutors')
  const { response: centers, loading: centersLoading } = useGet('/centers')
  const { response: tutorApps, loading: appsLoading } = useGet('/tutor-applications')

  // Fetch recent attendance directly from Attendance collection
  const { response: recentAttendance, loading: attendanceLoading, refetch: refetchAttendance } = useGet('/attendance/recent');
  
  // Local state to manage attendance display
  const [localAttendance, setLocalAttendance] = useState([]);
  
  // Update local attendance state when recentAttendance changes
  useEffect(() => {
    if (recentAttendance) {
      setLocalAttendance(recentAttendance);
    }
  }, [recentAttendance]);

  // Function to clear recent activity from the view
  const handleClearActivity = async () => {
    if (clearingActivity) return;
    
    setClearingActivity(true);
    try {
      // Get admin JWT to verify admin is logged in
      const userStr = localStorage.getItem('userData');
      let token = null;
      if (userStr) {
        try {
          const userObj = JSON.parse(userStr);
          token = userObj.token;
        } catch (e) {
          console.error('Error parsing userData from localStorage:', e);
          token = null;
        }
      }
      
      if (!token) {
        setPopoverMessage('Authentication required. Please log in again.');
        setShowPopover(true);
        setClearingActivity(false);
        return;
      }
      
      // Clear the local state to provide visual feedback
      setLocalAttendance([]);
      
      // Show toast notification
      toast.success('Activity feed cleared!', {
        position: 'top-right',
        duration: 3000
      });
      
      // Set a flag in localStorage to persist this cleared state
      localStorage.setItem('activityLastCleared', new Date().toISOString());
      
      // Show success message
      setPopoverMessage('Activity feed cleared successfully!');
      setShowPopover(true);
      
      // Auto-hide popover after 3 seconds
      setTimeout(() => {
        setShowPopover(false);
      }, 3000);
    } catch (error) {
      console.error('Error in clear activity:', error);
      setPopoverMessage(`An error occurred. Please try again.`);
      setShowPopover(true);
    } finally {
      setClearingActivity(false);
    }
  };

  // Remove old attendanceRecords logic


  const attendancePercentage = useMemo(() => {
    if (!tutors || tutors.length === 0 || !recentAttendance) return '0%';

    const today = format(new Date(), 'yyyy-MM-dd');
    const attendedToday = new Set();

    recentAttendance.forEach(record => {
      if (
        format(new Date(record.date), 'yyyy-MM-dd') === today &&
        record.status === 'present' &&
        record.tutor && record.tutor._id
      ) {
        attendedToday.add(record.tutor._id);
      }
    });

    return `${attendedToday.size}/${tutors.length}`;
  }, [tutors, recentAttendance]);

  const stats = [
    { label: 'Total Tutors', value: tutorsLoading ? '...' : tutors?.length || 0, icon: FiUsers },
    { label: 'Total Centers', value: centersLoading ? '...' : centers?.length || 0, icon: FiMapPin },
    { label: 'Attendance', value: attendancePercentage, icon: FiClock }
  ]

  // Format date for recent activity
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isLoading = tutorsLoading || centersLoading || appsLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-50 p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Welcome Section */}
          <div className="mb-8 animate-pulse">
            <div className="h-8 w-64 bg-slate-800 rounded-lg mb-2"></div>
            <div className="h-4 w-48 bg-slate-800 rounded-lg"></div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-slate-800 rounded-2xl p-6 animate-pulse">
                <div className="flex items-center mb-2">
                  <div className="w-5 h-5 bg-slate-700 rounded mr-2"></div>
                  <div className="h-4 w-24 bg-slate-700 rounded"></div>
                </div>
                <div className="h-8 w-16 bg-slate-700 rounded mt-2"></div>
              </div>
            ))}
          </div>

          {/* Recent Activity */}
          <div className="bg-slate-800 rounded-2xl p-6 animate-pulse">
            <div className="flex justify-between items-center mb-6">
              <div>
                <div className="h-6 w-32 bg-slate-700 rounded mb-2"></div>
                <div className="h-4 w-48 bg-slate-700 rounded"></div>
              </div>
              <div className="h-10 w-24 bg-slate-700 rounded"></div>
            </div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-slate-700 rounded-full"></div>
                    <div>
                      <div className="h-4 w-32 bg-slate-700 rounded mb-2"></div>
                      <div className="h-3 w-48 bg-slate-700 rounded"></div>
                    </div>
                  </div>
                  <div className="h-4 w-20 bg-slate-700 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Dashboard Overview</h1>
          <p className="text-lg text-slate-400">Welcome to the dashboard!</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <StatCard key={i} icon={stat.icon} title={stat.label} value={stat.value} />
          ))}
        </div>

        {/* Recent Activity */}
        <div className="bg-slate-800 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Recent Activity</h2>
            <button onClick={handleClearActivity} className="text-slate-400 hover:text-slate-50">
              Clear Activity
            </button>
          </div>
          <div className="space-y-4">
            {localAttendance.map((record, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-slate-700 rounded-full"></div>
                  <div>
                    <p className="text-lg font-medium text-slate-50">{record.tutor.name}</p>
                    <p className="text-sm text-slate-400">{formatDate(record.date)}</p>
                  </div>
                </div>
                <div className="text-lg font-medium text-slate-50">{record.status}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview