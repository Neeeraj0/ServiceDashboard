import React from 'react';
import { formatDate } from '../utils/dateUtils';

interface DateInfoTooltipProps {
  assignedDate?: string;
  scheduledDate?: string;
  complaintRaisedDate?: string;
}

const DateInfoTooltip: React.FC<DateInfoTooltipProps> = ({ 
    assignedDate, 
    scheduledDate, 
    complaintRaisedDate 
  }) => {
    return (
      <div className="relative inline-block group h-full">
        <button
          className="p-1 rounded-full text-blue-600 hover:bg-blue-100 transition-colors"
          aria-label="Date information"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
        </button>
        
        <div className="absolute invisible opacity-0 group-hover:visible group-hover:opacity-100 bottom-full left-1/2 -translate-x-1/2 mb-2 w-[350px] h-auto transition-all duration-300 ease-out transform z-[9999]">
          <div className="relative p-4 bg-white rounded-2xl shadow-lg border border-gray-200">
            <h4 className="text-sm font-semibold text-gray-800 mb-2">Task Timeline</h4>
            
            <div className="space-y-2 text-sm">
              {complaintRaisedDate && (
                <div className="flex items-center justify-between">
                  <span className="bg-red-100 text-red-800 px-2 py-1 rounded-md">Complaint Raised:</span>
                  <span className="text-gray-700">{formatDate(complaintRaisedDate).date} {formatDate(complaintRaisedDate).time}</span>
                </div>
              )}
              
              {assignedDate && (
                <div className="flex items-center justify-between">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md">Assigned:</span>
                  <span className="text-gray-700">{formatDate(assignedDate).date} {formatDate(assignedDate).time}</span>
                </div>
              )}
              
              {scheduledDate && (
                <div className="flex items-center justify-between">
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-md">Scheduled:</span>
                  <span className="text-gray-700">{formatDate(scheduledDate).date} {formatDate(scheduledDate).time}</span>
                </div>
              )}
              
              {!complaintRaisedDate && !assignedDate && !scheduledDate && (
                <div className="text-gray-500">No date information available</div>
              )}
            </div>
          </div>
          
          {/* Arrow */}
          <div className="absolute w-3 h-3 bg-white border-r border-b border-gray-200 transform rotate-45 -bottom-1.5 left-1/2 -translate-x-1/2"></div>
        </div>
      </div>
    );
  };

export default DateInfoTooltip;