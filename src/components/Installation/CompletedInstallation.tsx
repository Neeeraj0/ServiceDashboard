import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Modal from '../Modal/Modal';
import CompletedApproveTask from '../Dialogs/ApproveTask';
import RoutineAssignTask from '../Dialogs/RoutineAssignTask';
import RoutineApproveTask from '../Dialogs/RoutineApprove';
import './module.style.css';
import PipingModal from '../Modal/PipingModal';
import ReAssignTask from '../Dialogs/ReAssignTask';
import Pagination from '../Pagination';
import SearchBox from '../SearchBox/SearchBox';
import { useRefresh } from '@/app/context/RefreshContext';
import CompletedFilterDrawer from '../Filters/CompletedFilters';

interface Address {
  location: string;
  latitude: string;
  longitude: string;
}

interface Technician {
    _id: string;
    name: string;
    email: string;
    phone: string;
    technician_id: string;
}

interface Photo {
    url: string;
    servicePhase: string; 
    orderId: string;
    presignedUrl: string;
    s3Key: string;
    serialId: string;
    type: string;
}
interface MaterialUsed {
    materialName: string;
    sizeUsed?: string;
    quantityUsed?: number;
}

interface Order {
  _id: string;
  task_id: string;
  contactPerson: string;
  customerDetails: string;
  issueReported: string;
  issueFound: string;
  status: string;
  address: string;
  assignedDate: string;
  endDate: string;
  date: string;
  note: string;
  deviceId: string;
  assignedTechnicians: Technician[];
  photos: Photo[];
  materialsUsed: MaterialUsed[];
  issueObserved: string;
  isPeriodicService: boolean;
  TAT1: string;
  TAT2: string;
}

const CompletedInstallation: React.FC = () => {
  const [backendData, setBackendData] = useState<Order[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalImages, setModalImages] = useState<Photo[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasAssignAccess, setHasAssignAccess] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { triggerRefresh, refreshKey } = useRefresh();
  const itemsPerPage = 10;

    //checktoken
    useEffect(() => {
      const checkUserAccess = () => {
        const token = localStorage.getItem('authToken');
        if (token) {
          try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
              return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            
            const decodedToken = JSON.parse(jsonPayload);
            
            setHasAssignAccess(decodedToken.role !== "viewAccess");
          } catch (err) {
            console.error("Error decoding token:", err);
            setHasAssignAccess(false); // Default to no access if token is invalid
          }
        }
      };
  
      checkUserAccess();
    }, []);

  const handleApproveTaskSuccess = (approvedTaskId: string) => {
    // Filter out tasks with `approvalPending` set to true
    setBackendData((prevData) => prevData.filter((order) => order._id !== approvedTaskId));
  };

  useEffect(() => {
    const fetchCompletedOrders = async () => {
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_SERVICE_BACKEND_API}/api/installation/getCompleted/installation`);
        // const res = await axios.get('http://localhost:8000/api/installation/getCompleted/installation');
        const orders = res.data.map((order: any) => ({
          _id: order._id,
          task_id: order.task_id,
          contactPerson: order.client_name,
          customerDetails: order.client_number,
          issueReported: order.customerComplaint,
          materialsUsed: order.materialsUsed
          ? order.materialsUsed.flatMap((material: any) => material.materials || [])
          : [], // Flatten nested materials  
          isPeriodicService: order.periodicService,
          approvalPending: order.approvalPending, 
          status: order.status,
          TAT1: order.TAT1,
          TAT2: order.TAT2,
          address: order.address.map((addr: Address) => addr.location).join(", ") || "N/A",
          date: new Date(order.assignedDate).toLocaleDateString(),
          closureDate: new Date(order.endDate).toLocaleDateString(),
          deviceId: order.deviceId || "N/A",
          assignedTechnicians: order.assignedTechnicians || [],
          photos: order.photos || [] // Assuming photos are included in the API response
        }));
        setBackendData(orders);
      } catch (error) {
        console.error(error);
      }
    };

    fetchCompletedOrders();
  }, [refreshKey]);

  const handleViewImages = (photos: Photo[]) => {
    setModalImages(photos);
    setIsModalOpen(true);
  };
  const indexOfLastOrder = currentPage * itemsPerPage;
  const indexOfFirstOrder = indexOfLastOrder - itemsPerPage;
  const filteredOrders = backendData.filter((order) =>
    order.contactPerson?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  let currentOrders = filteredOrders.slice(
    indexOfFirstOrder,
    indexOfLastOrder
  );
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

   useEffect(() => {
      setCurrentPage(1);
    }, [searchQuery]);

  
  return (
    <div>
      <div className="flex items-center justify-between mb-4">  
        <div className='flex-grow'>
          <SearchBox 
            placeholder="Search by customer name"
            value={searchQuery}
            onChange={setSearchQuery}
          />
        </div>
        
      </div>
    <table className="w-full text-left table-auto min-w-max">
      <thead>
        <tr className="bg-gray-50">
          <th className="p-2 border-b border-blue-gray-50 min-w-[120px]">
            <div className="font-semibold text-sm">Task ID</div>
          </th>
          <th className="p-1 border-b border-blue-gray-50 min-w-[90px] whitespace-normal w-25">
            <div className="font-semibold text-sm">Before & After Images</div>
          </th>
          <th className="p-1 border-b border-blue-gray-50 min-w-[150px]">
            <div className="font-semibold text-sm">Technician Names</div>
          </th>
          <th className="p-1 border-b border-blue-gray-50 min-w-[150px]">
            <div className="font-semibold text-sm">Customer Details</div>
          </th>
          <th className="p-1 border-b border-blue-gray-50 min-w-[180px]">
            <div className="font-semibold text-sm">Material Used</div>
          </th>
          <th className="p-1 border-b border-blue-gray-50  whitespace-normal">
            <div className="font-semibold text-sm">Assigned Date & Time</div>
          </th>
          <th className="p-1 border-b border-blue-gray-50 min-w-[90px] whitespace-normal w-20">
            <div className="font-semibold text-sm">Closure Date & Time</div>
          </th>
          <th className="p-1 border-b border-blue-gray-50 min-w-[120px] whitespace-normal w-25">
            <div className="font-semibold text-sm">TAT1</div>
          </th>
          <th className="p-1 border-b border-blue-gray-50 min-w-[150px]">
            <div className="font-semibold text-sm">TAT2</div>
          </th>
          {hasAssignAccess && (
            <th className="p-1 border-b border-blue-gray-50 min-w-[150px]">
                <div className="font-semibold text-sm">Action</div>
            </th>
          )}
        </tr>
      </thead>
      <tbody>
        {backendData.length === 0 ? (
          <tr>
            <td colSpan={9} className="text-center p-4">No tasks available</td>
          </tr>
        ) : (
          currentOrders.map((order) => (
            <tr key={order._id} className="hover:bg-gray-50">
              <td className="p-2 border-b border-blue-gray-50 text-sm">{order.task_id || "N/A"}</td>
              <td className="p-2 border-b border-blue-gray-50 text-sm">
                  {order.photos?.length > 0 ? (
                    <button
                      className="underline text-blue-600"
                      onClick={() => handleViewImages(order.photos)}
                    >
                      View Images
                    </button>
                  ) : (
                    "No Images"
                  )}
                </td>
                <td className="p-2 border-b border-blue-gray-50 text-sm">
                {order.assignedTechnicians?.length > 0 ? (
                  <ul className="list-none">
                    {order.assignedTechnicians.map((technician) => (
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
                {order.contactPerson}
                <br />
                {order.customerDetails}
              </td>
              {/* <td className="p-4 border-b border-blue-gray-50">{order.issueReported || "N/A"}</td> */}
              <td className="p-2 border-b border-blue-gray-50 text-sm">
                {order.materialsUsed.length > 0 ? (
                  <ul className="list-disc ml-4">
                    {order.materialsUsed.map((material, index) => (
                      <li key={index}>
                        {material.materialName}
                        {material.sizeUsed ? ` - Size: ${material.sizeUsed}` : ""}
                        {material.quantityUsed ? ` - Quantity: ${material.quantityUsed}` : ""}
                      </li>
                    ))}
                  </ul>
                ) : (
                  "No Materials Used"
                )}
              </td>
              <td className="p-2 border-b border-blue-gray-50 text-sm">{order.date || "N/A"}</td>
              <td className="p-2 border-b border-blue-gray-50 text-sm">{order.endDate || "N/A"}</td>
              <td className="p-2 border-b border-blue-gray-50 text-sm">{order.TAT1 ? order.TAT1 : "0"}</td>
              <td className="p-2 border-b border-blue-gray-50 text-sm">{order.TAT2 ? order.TAT2 : "0"}</td>
              <td className="p-2 border-b border-blue-gray-50 text-sm whitespace-normal break-words max-w-xs z-99999">
                {/* <RoutineApproveTask orderId={order._id} /> */}
                {hasAssignAccess && (
                  <ReAssignTask orderId={order._id}/>
                )}
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
        {isModalOpen && (
                <PipingModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} images={modalImages} />
        )}

        <Pagination
          currentPage={currentPage}
          totalItems={backendData.length}
          itemsPerPage={itemsPerPage}
          paginate={paginate}
        />
    </div>
  );
};

export default CompletedInstallation;
