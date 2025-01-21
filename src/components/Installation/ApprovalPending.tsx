import React, { useEffect, useState } from 'react';
import axios from 'axios';
import InstallationApprove from '../Dialogs/InstallationApprove';
import { formatDate } from '../utils/dateUtils';
import './module.style.css';
import PipingModal from '../Modal/PipingModal';
import Pagination from '../Pagination';

interface Photo {
  url: string;
  orderId: string;
  servicePhase: string; 
  presignedUrl: string;
  s3Key: string;
  serialId: string;
  type: string;
}

interface AssignedTechnicians{
    _id: string,
    name: string,
    email: string,
    role: string,
    phone: string,
    technician_id: string,
}
interface MaterialsUsed{
  materialId: string,
  materialName: string,
  quantityUsed: string,
  QuantityInFt: string,
  sizeUsed:string
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
  photos: Photo[];
  quantity: string;
  assignedDate: string;
  customerComplaint: string;
  materialsUsed: MaterialsUsed[],
  contactPerson: {
    name: string,
    phone_number: string
  },
  endDate: string;
}

const ApprovalPending = () => {
  const [pipingData, setPipingData] = useState<PipingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalImages, setModalImages] = useState<Photo[]>([]);
  // Track approved tasks to prevent them from reappearing
  const [approvedTasks] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [selectedTask, setSelectedTask] = useState<PipingResponse | null>(null);



  const fetchPipingData = async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_SERVICE_BACKEND_API}/api/installation/getApprovalPending`);
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

  const handleViewImages = (photos: Photo[], task: PipingResponse) => {
    setModalImages(photos);
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const indexOfLastOrder = currentPage * itemsPerPage;
  const indexOfFirstOrder = indexOfLastOrder - itemsPerPage;
  const currentOrders = pipingData.slice(indexOfFirstOrder, indexOfLastOrder);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error fetching data: {error}</div>;

  return (
    <div>
      <table className="w-full text-left table-auto min-w-max">
        <thead>
          <tr>
            <th className="p-4 border-y border-blue-gray-100 bg-blue-gray-50/50 text-sm">Task ID</th>
            <th className="p-4 border-y border-blue-gray-100 bg-blue-gray-50/50 text-sm">Photos</th>
            <th className="p-4 border-y border-blue-gray-100 bg-blue-gray-50/50 text-sm">Status</th>
            <th className="p-4 border-y border-blue-gray-100 bg-blue-gray-50/50 text-sm">Technician Name</th>
            <th className="p-4 border-y border-blue-gray-100 bg-blue-gray-50/50 text-sm">Assigned Date & Time</th>
            {/* <th className="p-4 border-y border-blue-gray-100 bg-blue-gray-50/50 text-sm">Contact Person</th> */}
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
            currentOrders.map((task) => {
              const formattedDateTime = formatDate(task.assignedDate); 
              return (
              <tr 
                key={task._id} 
                className={removingIds.has(task.task_id) ? "fade-out" : ""}
              >
                <td className="p-2 border-b border-blue-gray-50 text-sm">{task.task_id}</td>
                <td className="p-4 border-b border-blue-gray-50">
                  {task.photos?.length > 0 ? (
                    <button
                      className="underline text-blue-600"
                      onClick={() => handleViewImages(task.photos, task)}
                    >
                      View Images
                    </button>
                  ) : (
                    "No Images"
                  )}
                </td>
                <td className="p-2 border-b border-blue-gray-50 text-sm">{task.status}</td>
                <td className="p-2 border-b border-blue-gray-50 text-sm max-w-50">
                  {`${task.assignedTechnicians.map(technician => technician.name)}`}
                </td>
                <td className="p-2 border-b border-blue-gray-50 text-sm">
                  <div>{formattedDateTime.date}</div>
                  <div className="text-gray-600">{formattedDateTime.time}</div>
                </td>
                {/* <td className="p-2 border-b border-blue-gray-50 text-sm">
                  {task.contactPerson.name} <br /> {task.contactPerson.phone_number}
                </td> */}
                <td className="p-2 border-b border-blue-gray-50 text-sm whitespace-normal w-40">
                  {task.client_name} <br /> {task.client_number}
                </td>
                <td className="p-2 border-b border-blue-gray-50 text-sm">
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
      {isModalOpen && selectedTask &&(
                <PipingModal isOpen={isModalOpen} 
                onClose={() => {
                  setIsModalOpen(false);
                  setSelectedTask(null);
                }}  
                images={modalImages} 
                taskName="Installation" 
                taskDetails={selectedTask}/>
        )}

      <Pagination
          currentPage={currentPage}
          totalItems={pipingData.length}
          itemsPerPage={itemsPerPage}
          paginate={paginate}
        />
    </div>
  );
};

export default ApprovalPending;
