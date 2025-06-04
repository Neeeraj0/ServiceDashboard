import React, { useState } from 'react';

interface DeviceIdDisplayProps {
  deviceIds: string[];
  maxVisible?: number;
}

const DeviceIdDisplay: React.FC<DeviceIdDisplayProps> = ({ 
  deviceIds, 
  maxVisible = 2 
}) => {
  const [showAll, setShowAll] = useState(false);
  
  if (!deviceIds || deviceIds.length === 0) {
    return <span>N/A</span>;
  }

  const visibleIds = showAll ? deviceIds : deviceIds.slice(0, maxVisible);
  const remainingCount = deviceIds.length - maxVisible;

  return (
    <div className="relative">
      <div className="text-sm">
        {visibleIds.map((id, index) => (
          <div key={index} className="text-xs text-gray-600 mb-1">
            {id}
          </div>
        ))}
        
        {!showAll && remainingCount > 0 && (
          <button
            onClick={() => setShowAll(true)}
            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            <svg 
              className="w-3 h-3" 
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path 
                fillRule="evenodd" 
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" 
                clipRule="evenodd" 
              />
            </svg>
            +{remainingCount} more
          </button>
        )}
        
        {showAll && (
          <button
            onClick={() => setShowAll(false)}
            className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 font-medium mt-1"
          >
            Show less
          </button>
        )}
      </div>
    </div>
  );
};

export default DeviceIdDisplay;