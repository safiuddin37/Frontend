import { useState } from 'react';

const YouTubeLazyPlayer = ({ videoId, className = "", height = "350px" }) => {
  const [isPlayerVisible, setIsPlayerVisible] = useState(false);

  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

  return (
    <div
      className={`relative rounded-lg overflow-hidden shadow-lg cursor-pointer ${className}`}
      style={{ height }}
      onClick={() => setIsPlayerVisible(true)}
    >
      {!isPlayerVisible ? (
        <>
          {/* Thumbnail */}
          <img
            src={thumbnailUrl}
            alt="YouTube Video Thumbnail"
            className="object-cover w-full h-full"
          />
          {/* Play Button Overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
            <svg
              className="w-16 h-16 text-white"
              fill="currentColor"
              viewBox="0 0 84 84"
            >
              <circle cx="42" cy="42" r="42" opacity="0.5" />
              <polygon points="33,24 63,42 33,60" fill="white" />
            </svg>
          </div>
        </>
      ) : (
        <>
          {/* Actual YouTube iframe */}
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
            frameBorder="0"
            allow="autoplay; encrypted-media"
            allowFullScreen
            title="YouTube Video"
            className="w-full h-full"
          />
        </>
      )}
    </div>
  );
};

export default YouTubeLazyPlayer;
