import { useEffect, useState, useRef } from 'react';
import { FiX, FiBell } from 'react-icons/fi';
import { AnimatePresence, motion } from 'framer-motion';

const BAR_HEIGHT = 40; // Reduced height for compact look
const SLIDE_INTERVAL = 4000; // ms

const AnnouncementBanner = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [current, setCurrent] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const res = await fetch(`https://mtc-backend-jn5y.onrender.com/api/announcements`);
        const data = await res.json();
        if (Array.isArray(data) && data.length) setAnnouncements(data);
      } catch (err) {
        console.error('Failed to load announcements', err);
      }
    };
    fetchAnnouncements();
  }, []);

  // Carousel auto-slide
  useEffect(() => {
    if (announcements.length <= 1) return;
    intervalRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % announcements.length);
    }, SLIDE_INTERVAL);
    return () => clearInterval(intervalRef.current);
  }, [announcements]);

  if (!announcements.length || dismissed) return null;
  const announcement = announcements[current];

  return (
    <div
      className="fixed left-0 right-0 z-40 shadow-lg flex items-center"
      style={{ top: 96, height: BAR_HEIGHT, minHeight: BAR_HEIGHT, background: 'linear-gradient(90deg, #2563eb 0%, #1e40af 100%)' }}
    >
      <div className="flex items-center h-full pl-3 pr-1">
        <FiBell className="text-base md:text-lg" />
      </div>
      <div className="flex-1 flex items-center h-full px-1 md:px-3 overflow-x-auto" style={{overflow: 'auto'}}>
        <AnimatePresence mode="wait">
          <motion.div
            key={announcement._id}
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 80, damping: 18 }}
            className="w-full flex items-center"
            style={{ minHeight: BAR_HEIGHT, lineHeight: '1.2' }}
          >
            <span className="font-bold text-xs md:text-sm mr-2 md:mr-3 whitespace-nowrap" style={{flexShrink: 0}}>{announcement.title}:</span>
            <span className="text-xs md:text-sm font-normal break-words" style={{wordBreak: 'break-word'}}>{announcement.body}</span>
          </motion.div>
        </AnimatePresence>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="h-full px-2 md:px-3 text-white/80 hover:text-white text-lg md:text-xl flex items-center"
        aria-label="Dismiss"
      >
        <FiX />
      </button>
    </div>
  );
};

export default AnnouncementBanner;