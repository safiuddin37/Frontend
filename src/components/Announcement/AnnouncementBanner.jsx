import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX } from 'react-icons/fi';

const AnnouncementBanner = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [dismissedIds, setDismissedIds] = useState([]);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/announcements`);
        const data = await res.json();
        if (Array.isArray(data)) setAnnouncements(data);
      } catch (err) {
        console.error('Failed to load announcements', err);
      }
    };
    fetchAnnouncements();
  }, []);

  const visible = announcements.filter(a => !dismissedIds.includes(a._id));

  const handleDismiss = (id) => {
    setDismissedIds(prev => [...prev, id]);
  };

  return (
    <div className="fixed top-0 inset-x-0 z-50">
      <AnimatePresence>
        {visible.map((a) => (
          <motion.div
            key={a._id}
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="bg-primary-600 text-white px-4 py-3 flex items-start justify-between shadow-lg"
          >
            <div>
              <p className="font-semibold">{a.title}</p>
              <p className="text-sm leading-snug">{a.body}</p>
            </div>
            <button onClick={() => handleDismiss(a._id)} className="ml-4 mt-1 text-white opacity-75 hover:opacity-100">
              <FiX />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default AnnouncementBanner;
