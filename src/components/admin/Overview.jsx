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
  const [localAttendance, setLocalAttendance] = useState([]);
  const [clearingActivity, setClearingActivity] = useState(false);
  const [showPopover, setShowPopover] = useState(false);
  const [popoverMessage, setPopoverMessage] = useState('');

  const { response: tutors, loading: tutorsLoading } = useGet('/tutors');
  const { response: centers, loading: centersLoading } = useGet('/centers');
  const { response: tutorApps, loading: appsLoading } = useGet('/tutor-applications');
  const { response: recentAttendance, loading: attendanceLoading } = useGet('/attendance/recent');

  useEffect(() => {
    if (recentAttendance) {
      setLocalAttendance(recentAttendance);
    }
  }, [recentAttendance]);

  const stats = [
    {
      label: 'Total Tutors',
      value: tutors?.length || 0,
      icon: FiUsers
    },
    {
      label: 'Total Centers',
      value: centers?.length || 0,
      icon: FiMapPin
    },
    {
      label: 'New Applications',
      value: tutorApps?.length || 0,
      icon: FiFileText
    }
  ];

  const handleClearActivity = async () => {
    if (clearingActivity) return;
    setClearingActivity(true);

    try {
      const userStr = localStorage.getItem('userData');
      let token = null;
      if (userStr) {
        const userObj = JSON.parse(userStr);
        token = userObj.token;
      }

      if (!token) {
        throw new Error('Authentication required');
      }

      setLocalAttendance([]);
      setPopoverMessage('Activity feed cleared successfully!');
      setShowPopover(true);
    } catch (error) {
      console.error('Error clearing activity:', error);
      setPopoverMessage('Failed to clear activity. Please try again.');
      setShowPopover(true);
    } finally {
      setClearingActivity(false);
      setTimeout(() => setShowPopover(false), 3000);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const isLoading = tutorsLoading || centersLoading || appsLoading;

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-teal-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-sky-600 via-blue-600 to-teal-600 bg-clip-text text-transparent">Dashboard Overview</h1>
        <p className="text-slate-600 mb-8">Welcome to your admin control center</p>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg shadow-blue-100 border border-sky-100 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium">{stat.label}</p>
                  <p className="text-3xl font-bold mt-1 bg-gradient-to-r from-sky-600 via-blue-600 to-teal-600 bg-clip-text text-transparent">{stat.value}</p>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-sky-500 via-blue-500 to-teal-500 text-white shadow-md">
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg shadow-blue-100 border border-sky-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-sky-600 via-blue-600 to-teal-600 bg-clip-text text-transparent mb-1">Recent Activity</h2>
              <p className="text-slate-500 text-sm">Track the latest updates and changes</p>
            </div>
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
              <div className="flex items-center justify-center p-8 text-blue-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3"></div>
                <span className="bg-gradient-to-r from-sky-600 via-blue-600 to-teal-600 bg-clip-text text-transparent font-medium">
                  Loading recent activity...
                </span>
              </div>
            ) : localAttendance && localAttendance.length > 0 ? (
              localAttendance.slice(0, 5).map((record, index) => (
                <motion.div
                  key={record._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 bg-white/80 rounded-xl border border-sky-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
                >
                  <div className="flex items-center space-x-3">
                    <FiCheck className="w-5 h-5 text-teal-500" />
                    <div>
                      <p className="font-medium bg-gradient-to-r from-sky-600 via-blue-600 to-teal-600 bg-clip-text text-transparent">{record.tutor?.name || 'Unknown Tutor'}</p>
                      <p className="text-sm text-slate-600">Marked attendance at <span className="font-medium text-blue-600">{record.center?.name || 'Unknown Center'}</span></p>
                    </div>
                  </div>
                  <span className="text-sm text-slate-500 font-medium px-3 py-1 bg-sky-50/50 rounded-lg border border-sky-100/30">{formatDate(record.createdAt)}</span>
                </motion.div>
              ))
            ) : (
              <p className="text-center text-slate-500 py-8">No recent activity</p>
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