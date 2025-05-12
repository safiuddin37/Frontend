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
      <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
        <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-slate-800 to-blue-800 bg-clip-text text-transparent">Dashboard Overview</h1>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3].map((i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/60 backdrop-blur-sm rounded-xl p-6 animate-pulse shadow-lg shadow-slate-200/50"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm h-4 w-24 bg-gray-200 rounded"></p>
                  <p className="text-2xl font-bold mt-1 h-6 w-20 bg-gray-200 rounded"></p>
                </div>
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 animate-pulse shadow-lg shadow-slate-200/50 border border-slate-100">
          <h2 className="text-xl font-semibold mb-4 h-6 bg-gray-200 rounded"></h2>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 bg-gray-200 rounded-full"></div>
                  <div>
                    <p className="font-medium h-4 w-24 bg-gray-200 rounded"></p>
                    <p className="text-sm text-gray-600 mt-1 h-4 w-20 bg-gray-200 rounded"></p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-violet-50 to-rose-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-amber-600 bg-clip-text text-transparent">Dashboard Overview</h1>
        <p className="text-slate-600 mb-8">Welcome to your admin control center</p>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg shadow-violet-200/30 border border-violet-100/20 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">{stat.label}</p>
                <p className="text-3xl font-bold mt-1 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-amber-600 bg-clip-text text-transparent">{stat.value}</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-amber-500 text-white shadow-lg shadow-violet-200/50">
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg shadow-violet-200/30 border border-violet-100/20">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-violet-600 via-fuchsia-600 to-amber-600 bg-clip-text text-transparent mb-1">Recent Activity</h2>
          <p className="text-slate-500 text-sm mb-4">Track the latest updates and changes</p>
          <button
            onClick={handleClearActivity}
            disabled={clearingActivity}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${clearingActivity ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-red-50/50 text-red-600 hover:bg-red-100/50 border border-red-200/50 hover:shadow-md hover:-translate-y-0.5'} backdrop-blur-sm transition-all duration-300`}
          >
            {clearingActivity ? 'Clearing...' : 'Clear Activity'}
          </button>
        </div>
        <div className="space-y-4">
          {attendanceLoading ? (
            <div className="flex items-center justify-center p-8 text-violet-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500 mr-3"></div>
              <span className="bg-gradient-to-r from-violet-600 via-fuchsia-600 to-amber-600 bg-clip-text text-transparent font-medium">
                Loading recent activity...
              </span>
            </div>
          ) : localAttendance && localAttendance.length > 0 ? (
            localAttendance.slice(0, 5).map((record, index) => (
              <motion.div
                key={record._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20, transition: { duration: 0.3 } }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <FiCheck className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="font-medium bg-gradient-to-r from-violet-600 via-fuchsia-600 to-amber-600 bg-clip-text text-transparent">{record.tutor?.name || 'Unknown Tutor'}</p>
                    <p className="text-sm text-slate-600">Marked attendance at <span className="font-medium text-fuchsia-600">{record.center?.name || 'Unknown Center'}</span></p>
                  </div>
                </div>
                <span className="text-sm text-slate-500 font-medium px-3 py-1 bg-violet-50/50 rounded-lg border border-violet-100/30">{formatDate(record.createdAt)}</span>
              </motion.div>
            ))
          ) : (
            <p className="text-gray-500">No recent activity</p>
          )}
        </div>
      </div>
      
      {/* Feedback Popover */}
      <Popover
        isOpen={showPopover}
        onClose={() => setShowPopover(false)}
        message={popoverMessage}
        type={popoverMessage.includes('success') ? 'success' : 'error'}
      />
      </div>
    </div>
  );
}

export default Overview