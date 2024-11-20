import React, { useEffect, useState } from 'react';
import axios from 'axios';
import PipingAssignTask from '../Dialogs/PipingAssignTask';

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
}

const AssignedPiping = () => {
  const [pipingData, setPipingData] = useState<PipingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch piping data
  useEffect(() => {
    const fetchPipingData = async () => {
      try {
        const res = await axios.get('http://35.154.208.29:8080/api/piping');
        setPipingData(res.data);
      } catch (err: any) {
        console.error("Error fetching piping data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPipingData();
  }, []);

  if (loading) return <div>Loading...</div>;
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
              <td colSpan={7} className="text-center">No tasks available</td>
            </tr>
          ) : (
            pipingData.map((task) => {
              const address = task.address.length > 0 ? task.address[0].location : "N/A";
              
              return (
                <tr key={task._id}>
                  <td className="p-2 border-b border-blue-gray-50 text-sm">{task.task_id}</td>
                  <td className="p-2 border-b border-blue-gray-50 text-sm">{task.status}</td>
                  <td className="p-2 border-b border-blue-gray-50 text-sm">
                    {/* {task.assignedTechnicians.join(', ') || "N/A"} */}
                    {task.assignedTechnicians.map(technician => technician.name)}
                  </td>
                  <td className="p-2 border-b border-blue-gray-50 text-sm">
                    {new Date(task.assignedDate).toLocaleString()}
                  </td>
                  <td className="p-2 border-b border-blue-gray-50 text-sm">{task.client_name}</td>
                  <td className="p-2 border-b border-blue-gray-50 text-sm whitespace-normal w-40">
                    {address}
                  </td>
                  <td className="p-2 border-b border-blue-gray-50 text-sm">
                    {/* <PipingAssignTask
                      addressDisplay={address}
                      orderId={task._id}
                      clientName={task.client_name}
                      clientNumber={task.client_number}
                      description={task.description}
                      complaintRaised={task.complaintRaised || ""}
                      customerComplaint={task.customerComplaint}
                      ac_units={task.ac_units}
                    /> */}
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

export default AssignedPiping;
