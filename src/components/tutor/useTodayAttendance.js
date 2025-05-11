import { useEffect, useState, useCallback } from 'react';
import { format } from 'date-fns';

// Custom hook to check if today's attendance is already marked for the logged-in tutor
export default function useTodayAttendance() {
  const [alreadyMarked, setAlreadyMarked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Function to refresh the attendance check
  const refreshAttendanceCheck = useCallback(() => {
    setRefreshKey(prevKey => prevKey + 1);
  }, []);

  // Check for attendance records
  const checkAttendance = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      const token = userData.token;
      const tutorId = userData._id;
      
      if (!token || !tutorId) {
        setLoading(false);
        setError('Not logged in');
        return;
      }
      
      const today = format(new Date(), 'yyyy-MM-dd');
      const response = await fetch('https://mtc-backend-jn5y.onrender.com/api/attendance/recent', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error('Not authorized. Please login again.');
        } else {
          throw new Error(`Failed to fetch attendance: ${response.status}`);
        }
      }
      
      const records = await response.json();
      // Check if any record matches today's date for the current tutor
      const found = records.some(
        r => r.tutor && 
        (typeof r.tutor === 'string' ? r.tutor === tutorId : r.tutor._id === tutorId) && 
        format(new Date(r.date || r.createdAt), 'yyyy-MM-dd') === today
      );
      
      setAlreadyMarked(found);
      setLoading(false);
    } catch (e) {
      console.error('Error checking attendance:', e);
      setError(e.message);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAttendance();
    
    // Setup an interval to check every 5 minutes (for long sessions)
    const intervalId = setInterval(() => {
      checkAttendance();
    }, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [checkAttendance, refreshKey]);

  return { alreadyMarked, loading, error };
}
