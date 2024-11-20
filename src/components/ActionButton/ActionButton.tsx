import React, { useState } from 'react';
import CompletedApproveTask from '../Dialogs/ApproveTask';
import ReAssignTask from '../Dialogs/ReAssignTask';

interface ActionButtonProps {
  orderId: string;
}

const ActionButton: React.FC<ActionButtonProps> = ({ orderId }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedAction, setSelectedAction] = useState<null | 'approve' | 'reassign'>(null);

  const handleActionClick = () => {
    setShowDropdown((prev) => !prev); // Toggle dropdown visibility
  };

  const handleSelectAction = (action: 'approve' | 'reassign') => {
    setSelectedAction(action);
    setShowDropdown(false);
  };

  return (
    <div className="relative inline-block">
      <button
        className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:underline"
        onClick={handleActionClick}
      >
        Action
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute z-10 bg-white shadow-md rounded border mt-1">
          <button
            onClick={() => handleSelectAction('reassign')}
            className="block px-4 py-2 text-gray-800 hover:bg-gray-100 w-full text-left"
          >
            Reassign & Reschedule
          </button>
          <button
            onClick={() => handleSelectAction('approve')}
            className="block px-4 py-2 text-gray-800 hover:bg-gray-100 w-full text-left"
          >
            Approve Task
          </button>
        </div>
      )}

      {/* Conditionally render components based on selection */}
      {selectedAction === 'approve' && <CompletedApproveTask orderId={orderId} />}
      {selectedAction === 'reassign' && <ReAssignTask orderId={orderId} />}
    </div>
  );
};

export default ActionButton;
