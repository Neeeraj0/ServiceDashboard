import React from 'react';

interface Technician {
  _id: string;
  name: string;
  technician_id: string;
  profilePicture?: {
    presignedUrl: string;
  };
}

interface Task {
  id: string;
  taskType: string;
  client_name?: string;
  date: Date;
  status?: string;
  description?: string;
  assignedTechnicians: Technician[];
  assignedTechnicianIds: string[];
  technicianProfileUrl?: string;
}

interface TaskDetailsModalProps {
  task: Task | null;
  onClose: () => void;
}

const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({ task, onClose }) => {
  if (!task) return null;
  console.log('Task Details:', task);
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 z-40 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
        >
          &times;
        </button>

        <h3 className="text-lg font-semibold mb-2">
          {task.taskType} - {task.client_name}
        </h3>

        <p><strong>Date:</strong> {task.date.toLocaleDateString()}</p>
        <p><strong>Time:</strong> {task.date.toLocaleTimeString()}</p>
        <p><strong>Status:</strong> {task.status || 'N/A'}</p>
        <p><strong>Description:</strong> {task.description || 'No description provided.'}</p>
        <p><strong>Duration:</strong> 2 hours</p>

        <div className="mt-4">
          <p className="font-semibold mb-2">Assigned Technicians:</p>
          {task.assignedTechnicians.map((tech) => (
            <div key={tech._id} className="flex items-center gap-3 mb-2">
              {task.technicianProfileUrl ? (
                <img
                  src={task.technicianProfileUrl || task.technicianProfileUrl}
                  alt={tech.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-sm font-bold text-white">
                  {tech.name[0]}
                </div>
              )}
              <div>
                <p className="font-medium">{tech.name}</p>
                <p className="text-xs text-gray-500">{tech.technician_id}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TaskDetailsModal;
