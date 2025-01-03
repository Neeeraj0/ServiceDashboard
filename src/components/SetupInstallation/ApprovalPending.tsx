import React, { useEffect, useState } from 'react';
import axios from 'axios';
import InstallationApprove from '../Dialogs/InstallationApprove';
import './module.style.css';
import { formatDate } from '../utils/dateUtils';

interface ACUnit{
  type: string;
  model: string;
  quantity: number;
}

interface AssignedTechnicians{
    _id: string,
    name: string,
    email: string,
    role: string,
    phone: string,
    technician_id: string,
}

interface PipingResponse {
  approvalPending: any;
  _id: string;
  title: string;
  description: string;
  assignedTechnicians: AssignedTechnicians[];
  complaintRaised: string | null;
  status: string;
  taskType: string;
  task_id: string;
  client_name: string;
  client_number: string;
  address: {
    location: string;
    latitude: string;
    longitude: string;
  }[];
  ac_units: {
    type: string;
    capacity: string;
    quantity: number;
  }[];
  servicingDate: string;
  assignedDate: string;
  customerComplaint: string;
  contactPerson: {
    name: string,
    phone_number: string
  }
}

const ApprovalPending = () => {
  const [pipingData, setPipingData] = useState<PipingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());
  
  // Track approved tasks to prevent them from reappearing
  const [approvedTasks] = useState<Set<string>>(new Set());

  const fetchPipingData = async () => {
    try {
    //   const res = await axios.get('http://35.154.208.29:8080/api/installation/getApprovalPending');
    const res = await axios.get('http://35.154.208.29:8080/api/setup/getApprovalPending');
      // Filter out any previously approved tasks
      const filteredData = res.data.filter((task: PipingResponse) => !approvedTasks.has(task.task_id));
      setPipingData(filteredData);
    } catch (err: any) {
      if (err.response && err.response.status === 404) {
        setPipingData([]); // Set empty array for no tasks
        setError(null); // Clear any existing errors
      } else {
        console.error("Error fetching piping data:", err);
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchPipingData();
    
    // Set up periodic refresh every 30 seconds
    const intervalId = setInterval(fetchPipingData, 30000);
    
    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  const handleTaskApproval = (taskId: string) => {
    setRemovingIds(prev => new Set(prev).add(taskId));
    
    // Add to approved tasks set to prevent reappearing
    approvedTasks.add(taskId);
    
    setTimeout(() => {
      setPipingData(prevData => prevData.filter(task => task.task_id !== taskId));
      setRemovingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
    }, 3000);
  };

  if (loading) return <div>Loading...</div>;
  if (pipingData.length === 0) {
    return (
      <div className="full-page">
        <img
          src="/images/NoTask/NoTask.gif"
          alt="No tasks available"
          className="w-30 h-30 mx-auto text-center"
        />
      </div>
    );
  }
  if (error) return <div>Error fetching data: {error}</div>;

  return (
    <div>
      <table className="w-full text-left table-auto min-w-max">
        <thead>
          <tr>
            <th className="p-4 border-y border-blue-gray-100 bg-blue-gray-50/50 text-sm">Task ID</th>
            <th className="p-4 border-y border-blue-gray-100 bg-blue-gray-50/50 text-sm">Status</th>
            <th className="p-4 border-y border-blue-gray-100 bg-blue-gray-50/50 text-sm">Technician Name</th>
            <th className="p-4 border-y border-blue-gray-100 bg-blue-gray-50/50 text-sm">Assigned Date & Time</th>
            <th className="p-4 border-y border-blue-gray-100 bg-blue-gray-50/50 text-sm">Contact Person</th>
            <th className="p-4 border-y border-blue-gray-100 bg-blue-gray-50/50 text-sm">Customer Details</th>
            <th className="p-4 border-y border-blue-gray-100 bg-blue-gray-50/50 text-sm">Action</th>
          </tr>
        </thead>
        <tbody>
            {pipingData.length === 0 ? (
                <tr>
                <td colSpan={7} className="text-center p-4">
                    No tasks available
                </td>
                </tr>
            ) : (
                pipingData.map((task) => {
                const formattedDateTime = formatDate(task.assignedDate); // Assuming a formatDate function exists
                return (
                    <tr
                    key={task._id}
                    className={`hover:bg-gray-50 ${removingIds.has(task.task_id) ? "fade-out" : ""}`}
                    >
                    <td className="p-2 border-b border-blue-gray-50 text-sm">
                        {task.task_id || "N/A"}
                    </td>
                    <td className="p-2 border-b border-blue-gray-50 text-sm">
                        <span
                        className={`px-5 py-2 rounded-full text-xs uppercase ${
                            task.status === "open"
                            ? "bg-red-100 text-red-800"
                            : task.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : task.status === "Completed"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                        >
                        {task.status || "N/A"}
                        </span>
                    </td>
                    <td className="p-2 border-b border-blue-gray-50 text-sm">
                        {task.assignedTechnicians?.length > 0 ? (
                        <ul className="list-none">
                            {task.assignedTechnicians.map((technician) => (
                            <li key={technician._id} className="mb-1">
                                {technician.name}
                            </li>
                            ))}
                        </ul>
                        ) : (
                        "No technicians assigned"
                        )}
                    </td>
                    <td className="p-2 border-b border-blue-gray-50 text-sm">
                        <div>{formattedDateTime.date}</div>
                        <div className="text-gray-600">{formattedDateTime.time}</div>
                    </td>
                    <td className="p-2 border-b border-blue-gray-50 text-sm">
                        {task.contactPerson?.name || "N/A"} <br />{" "}
                        {task.contactPerson?.phone_number || "N/A"}
                    </td>
                    <td className="p-2 border-b border-blue-gray-50 text-sm">
                        {task.client_name || "N/A"} <br /> {task.client_number || "N/A"}
                    </td>
                    <td className="p-2 border-b border-blue-gray-50">
                        <InstallationApprove
                        orderId={task.task_id}
                        taskDetails={task}
                        onApprove={() => handleTaskApproval(task.task_id)}
                        />
                    </td>
                    </tr>
                );
                })
            )}
            </tbody>
      </table>
    </div>
  );
};

export default ApprovalPending;
