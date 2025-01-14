import React, { useEffect, useState } from 'react';
import axios from 'axios';
import PipingAssignTask from '../Dialogs/PipingAssignTask';
import MoveToInstallation from '../Dialogs/MoveToInstallation';
import toast from 'react-hot-toast';
import AssignTask from '../Dialogs/AssignTask';
import AssignInstallation from '../Dialogs/AssignInstallation';

// Updated interface to match the new data structure
interface InstallationTask {
  _id: string;
  title: string;
  description: string;
  status: string;
  taskType: string;
  task_id: string;
  client_name: string;
  client_number: string;
  address: { location: string }[];
  ac_units: {
    type: string;
    capacity: string;
    quantity: number;
    orderId: string;
  }[];
  servicingDate: string;
  assignedDate: string;
  quantity: number;
  contactPerson: {
    name: string;
    phone_number: string;
  };
  assignedTechnicians: string[];
}

const OpenInstallation = () => {
  let [installationTasks, setInstallationTasks] = useState<InstallationTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [isInstallationDialogOpen, setIsInstallationDialogOpen] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchInstallationTasks = async () => {
      try {
        // const res = await axios.get("http://localhost:8000/api/piping/getApprovedPiping");
        const res = await axios.get(`${process.env.NEXT_PUBLIC_NEXT_SERVICE_BACKEND_API}/api/piping/getApprovedPiping`);
        
        if (res.status === 404 || !res.data) {
          setError('No installation tasks available');
          setLoading(false);
          return;
        }

        // const res2 = await axios.get("http://localhost:8000/api/installation/getAssigned");
        const res2 = await axios.get(`${process.env.NEXT_PUBLIC_SERVICE_BACKEND_API}/api/installation/getAssigned`);

        console.log(res.data.map((prevData: any) => prevData._id))
        console.log(res2.data.map((prevData: any) => prevData.preOrderId))
        const filteredTasks = res.data.filter((task1: any) => 
          !res2.data.some((task2: any) => task1._id === task2.preOrderId)
        );
        console.log('filtered tasks', filteredTasks);

        setInstallationTasks(filteredTasks);
        setLoading(false);
      } catch (err: any) {
        console.error("Error fetching installation tasks:", err);
        setError(err.response?.data?.message || 'Error fetching data');
        setLoading(false);
      }
    };
  
    fetchInstallationTasks();
  }, []);  

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.dropdown-container')) {
        setOpenDropdownId(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Function to handle task removal
  const handleTaskAssigned = (id: string) => {
    setRemovingId(id); // Start fade-out animation
    setTimeout(() => {
      setInstallationTasks((prevData) => prevData.filter((task) => task._id !== id));
      setRemovingId(null); 
    }, 300); // Match animation duration
  };


  return (
    <div>
      <table className="w-full text-left table-auto min-w-max">
        <thead>
          <tr>
            <th className="p-4 border-y border-blue-gray-100 bg-blue-gray-50/50 text-sm">Task ID</th>
            <th className="p-4 border-y border-blue-gray-100 bg-blue-gray-50/50 text-sm">Customer Details</th>
            <th className="p-4 border-y border-blue-gray-100 bg-blue-gray-50/50 text-sm">Status</th>
            <th className="p-4 border-y border-blue-gray-100 bg-blue-gray-50/50 text-sm">Contact Person</th>
            <th className="p-4 border-y border-blue-gray-100 bg-blue-gray-50/50 text-sm">Address</th>
            <th className="p-4 border-y border-blue-gray-100 bg-blue-gray-50/50 text-sm">Servicing Date</th>
            <th className="p-4 border-y border-blue-gray-100 bg-blue-gray-50/50 text-sm">Action</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={8} className="text-center">Loading...</td>
            </tr>
          ) : error ? (
            <tr>
              <td colSpan={8} className="text-center">{error}</td>
            </tr>
          ) : installationTasks.length === 0 ? (
            <tr>
              <td colSpan={8} className="text-center">No installation tasks available</td>
            </tr>
          ) : (
            installationTasks.map((task) => {
              const acUnitsDisplay = task.ac_units.map(unit => 
                `${unit.quantity}x ${unit.type} (${unit.capacity})`
              ).join(', ');

              return (
                <tr key={task._id} className={removingId === task._id ? "fade-out" : ""}>
                  <td className="p-2 border-b border-blue-gray-50 text-sm">{task.task_id}</td>
                  <td className="p-2 border-b border-blue-gray-50 text-sm">{task.client_name}</td>
                  <td className="p-2 border-b border-blue-gray-50 text-sm">
                    <span className={`inline-block px-2 py-1 font-sans text-xs font-bold rounded shadow-md 
                      ${task.status === 'open' ? 'bg-green-200 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {task.status}
                    </span>
                  </td>
                  <td className="p-2 border-b border-blue-gray-50 text-sm">
                    {task.contactPerson?.name} <br />
                    {task?.contactPerson?.phone_number}
                  </td>
                  <td className="p-2 border-b border-blue-gray-50 text-sm whitespace-normal w-40">
                    {task.address[0]?.location || 'No address provided'}
                  </td>
                  {/* <td className="p-2 border-b border-blue-gray-50 text-sm max-w-50">{acUnitsDisplay}</td> */}
                  <td className="p-2 border-b border-blue-gray-50 text-sm">
                    {new Date(task.servicingDate).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="p-2 border-b border-blue-gray-50 mt-[5vh] text-sm">
                    {/* <AssignInstallation
                      orderId={task._id}
                      clientName={task.contactPerson.name}
                      clientNumber={task.contactPerson.phone_number}
                      description={task.description}
                      addressDisplay={task.address[0].location}
                      ac_units={
                        task.ac_units
                      }
                    /> */}
                    <AssignInstallation
                      preOrderId={task._id}
                      clientName={task.client_name}
                      clientNumber={task.client_number}
                      description={task.description}
                      addressDisplay={task.address[0]?.location || 'No address provided'}
                      ac_units={task.ac_units}
                      contactNumber={task.contactPerson?.phone_number}
                      contactName={task.contactPerson?.name}
                      onTaskAssigned={handleTaskAssigned} 
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

export default OpenInstallation;