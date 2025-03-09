import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Modal from '../Modal/Modal';
import CompletedApproveTask from '../Dialogs/ApproveTask';
import { formatDate } from '../utils/dateUtils';
import Pagination from '../Pagination';
import SearchBox from '../SearchBox/SearchBox';
import DatePicker2 from '../DateFilter/DatePicker2';
import { useRefresh } from '@/app/context/RefreshContext';
import toast from 'react-hot-toast';
import ClickOutside from '../ClickOutside';
import AssignedFilterDrawer from '../Filters/AssignedFilters';
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
    presignedUrl: string;
    s3Key: string;
    serialId: string;
    orderId: string;
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

interface CompletedBreakdownProps {
  onLoadingComplete: () => void;
}

const CompletedBreakdown: React.FC<CompletedBreakdownProps> = ({onLoadingComplete}) => {
  const [backendData, setBackendData] = useState<Order[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalImages, setModalImages] = useState<Photo[]>([]);
  const [selectedTask, setSelectedTask] = useState<Order | null>(null);
  const [hasAssignAccess, setHasAssignAccess] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const itemsPerPage = 10; // Number of items per page
  const [isOpen, setIsOpen] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedStartDate, setSelectedStartDate] = useState<string | null>(null);
  const [selectedEndDate, setSelectedEndDate] = useState<string | null>(null);
  const [originalData, setOriginalData] = useState<Order[]>([]);
  const { triggerRefresh, refreshKey } = useRefresh();
  
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

   useEffect(() => {
      if (selectedStartDate || selectedEndDate) {
        const filteredData = originalData.filter((order) => {
          const orderDate = new Date(order.assignedDate);
          const orderLocalDate = new Date(
            orderDate.getFullYear(),
            orderDate.getMonth(),
            orderDate.getDate(),
            orderDate.getHours() + 5, 
            orderDate.getMinutes() + 30 
          ).toISOString().split('T')[0];
  
          console.log('orderLocalDate', orderLocalDate);
          console.log('selectedStartDate', selectedStartDate);
          console.log('selectedEndDate', selectedEndDate);
  
          if (selectedStartDate && selectedEndDate) {
            return orderLocalDate >= selectedStartDate && orderLocalDate <= selectedEndDate;
          } else if (selectedStartDate) {
            return orderLocalDate === selectedStartDate;
          }
          return true;
        });
        setBackendData(filteredData);
      } else {
        setBackendData(originalData);
      }
    }, [selectedStartDate, selectedEndDate, originalData]); 

  useEffect(() => {
    const fetchCompletedOrders = async () => {
      try {
        const resOrders = await axios.get(`${process.env.NEXT_PUBLIC_SERVICE_BACKEND_API}/api/breakdown/getCompleted`);
        // const resOrders = await axios.get(`http://35.154.208.29:8080/api/breakdown/getCompleted`);
        const orders = resOrders.data.map((order: any) => ({
          _id: order._id,
          task_id: order.task_id,
          contactPerson: order.client_name,
          customerDetails: order.client_number,
          issueReported: order.customerComplaint,
          issueObserved: order.issueObserved,
          note: order.note,
          materialsUsed: order.materialsUsed
            ? order.materialsUsed.flatMap((material: any) => material.materials || [])
            : [], // Flatten nested materials         
          assignedDate: order.assignedDate,
          endDate: order.endDate,
          status: order.status,
          address: order?.address?.map((addr: Address) => addr.location).join(", ") || "N/A",
          date: new Date(order.servicingDate).toLocaleDateString(),
          deviceId: order.ac_units?.map((unit: any) => `${unit.type} (${unit.capacity})`).join(", ") || "N/A",
          assignedTechnicians: order.assignedTechnicians || [],
          photos: order.photos || [],
          isPeriodicService: order.isPeriodicService,
          TAT1: order.TAT1,
          TAT2: order.TAT2
        }));
  
        const resQueries = await axios.get('https://production.circolife.vip/api/query/queries/all');
        console.log('line 93', resQueries);
        const completedQueryIds = resQueries?.data.data
          .filter((query: any) => query.queryStatus === 'complete')
          .map((query: any) => query._id);
  
        const filteredOrders = orders.filter((order: any) => !completedQueryIds.includes(order._id));
        console.log('Filtered Orders:', filteredOrders);
        setBackendData(filteredOrders);
        setOriginalData(filteredOrders);
      } catch (error) {
        console.error(error);
      } finally{
        onLoadingComplete();
      }
    };
  
    fetchCompletedOrders();
  }, [refreshKey, onLoadingComplete]);

  const removeCompletedTask = (orderId: string) => {
    const updatedData = backendData.filter(order => order._id !== orderId);
    setBackendData(updatedData);
  };

  const handleViewImages = (photos: Photo[], task: Order) => {
    const beforeImages = photos.filter(photo => photo.servicePhase === "before");
    const afterImages = photos.filter(photo => photo.servicePhase === "after");
    setModalImages([...beforeImages, ...afterImages]);
    setSelectedTask(task)
    setIsModalOpen(true);
  };

  const indexOfLastOrder = currentPage * itemsPerPage;
  const indexOfFirstOrder = indexOfLastOrder - itemsPerPage;
  const filteredOrders = backendData.filter((order) =>
    order.contactPerson.toLowerCase().includes(searchQuery.toLowerCase())
  );
  let currentOrders = filteredOrders.slice(
    indexOfFirstOrder,
    indexOfLastOrder
  );

    useEffect(() => {
      setCurrentPage(1);
    }, [searchQuery]);
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const openDatePicker = () => {
    setShowDatePicker(true);
  };

  const closeDatePicker = () => {
    setShowDatePicker(false);
  };

  const resetDatePicker = () => {
    setSelectedStartDate(null);
    setSelectedEndDate(null);
    setBackendData(originalData);
  };

  const handleRefresh = () => {
    toast.success("Data refreshed successfully");
    triggerRefresh();
  }
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
          <div className='flex gap-2 ml-auto'>
          <button 
              onClick={handleRefresh}
              className="p-2 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200"
              title="Refresh data"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 4v6h-6"/>
                <path d="M1 20v-6h6"/>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
              </svg>
            </button>
            <CompletedFilterDrawer 
              originalData={originalData}
              setFilteredData={setBackendData}
            />
          </div>
    </div>
    <table className="w-full text-left table-auto min-w-max">
      <thead>
        <tr className="bg-gray-50">
          <th className="p-2 border-b border-blue-gray-50 min-w-[120px] text-sm">Task ID</th>
          <th className="p-2 border-b border-blue-gray-50 w-45 min-w-[70px] text-sm whitespace-normal">Before & After Images</th>
          <th className="p-2 border-b border-blue-gray-50 min-w-[120px] text-sm">Technician Names</th>
          <th className="p-2 border-b border-blue-gray-50 min-w-[120px] text-sm">Customer Details</th>
          <th className="p-2 border-b border-blue-gray-50 min-w-[120px] text-sm">Issue Reported</th>
          <th className="p-2 border-b border-blue-gray-50 min-w-[120px] text-sm">Issue Found</th>
          <th className="p-2 border-b border-blue-gray-50 min-w-[120px] text-sm">Resolve Note</th>
          <th className="p-2 border-b border-blue-gray-50 min-w-[120px] text-sm">Material Used</th>
          <th className="p-2 border-b border-blue-gray-50 min-w-[120px] text-sm whitespace-normal w-22">Assigned Date & Time</th>
          <th className="p-2 border-b border-blue-gray-50 min-w-[120px] text-sm whitespace-normal w-25">Closure Date & Time</th>
          <th className="p-2 border-b border-blue-gray-50 min-w-[120px] text-sm w-25 whitespace-normal">Routine Services Completed</th>
          <th className="p-2 border-b border-blue-gray-50 min-w-[120px] text-sm">TAT 1</th>
          <th className="p-2 border-b border-blue-gray-50 min-w-[120px] text-sm">TAT 2</th>
          {hasAssignAccess && <th className="p-2 border-b border-blue-gray-50 min-w-[120px] text-sm">Action</th>}
        </tr>
      </thead>
      <tbody>
        {backendData.length === 0 ? (
          <tr>
            <td colSpan={9} className="text-center p-4">No tasks available</td>
          </tr>
        ) : (
          currentOrders.map((order) => {
            const formattedAssignedDate = formatDate(order?.assignedDate);
            const formattedClosureDate = formatDate(order?.endDate);
            return(
            <tr key={order._id} className="hover:bg-gray-50">
              <td className="p-4 border-b border-blue-gray-50 text-xs">{order.task_id || "N/A"}</td>
              <td className="p-4 border-b border-blue-gray-50 text-sm">
                  {order.photos?.length > 0 ? (
                    <button
                      className="underline text-blue-600"
                      onClick={() => handleViewImages(order.photos, order)}
                    >
                      View Images
                    </button>
                  ) : (
                    "No Images"
                  )}
                </td>
              <td className="p-2 border-b border-blue-gray-50 text-sm max-w-50">
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
              <td className="p-2 border-b border-blue-gray-50 text-sm max-w-50">
                {order.contactPerson || "N/A"}
                <br />
                {order.customerDetails || "N/A"}
              </td>
              <td className="p-2 border-b border-blue-gray-50 text-sm">{order.issueReported || "N/A"}</td>
              <td className="p-2 border-b border-blue-gray-50 text-sm max-w-40 flex-wrap">{order.issueObserved || "N/A"}</td>
              <td className="p-2 border-b border-blue-gray-50 text-sm max-w-40 flex-wrap">{order.note || "N/A"}</td>
              <td className="p-2 border-b border-blue-gray-50 text-sm">
                {order.materialsUsed.length > 0 ? (
                  <ul className="ml-4">
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
              <td className="p-4 border-b border-blue-gray-50 text-xs">
                { formattedAssignedDate.date || "N/A"}
                {" "}
                { formattedAssignedDate.time || "N/A"}
                </td>
              <td className="p-4 border-b border-blue-gray-50 text-xs">
                { formattedClosureDate.date || "N/A"}
                {" "}
                { formattedClosureDate.time || "N/A"}
              </td>
              <td className="p-4 border-b border-blue-gray-50 text-sm">
                  {order.isPeriodicService !== undefined && order.isPeriodicService !== null ? 
                (order.isPeriodicService ? "Yes" : "No") : "N/A"}
              </td>
              <td className="p-4 border-b border-blue-gray-50 whitespace-normal break-words max-w-xs">
                {order.TAT1 }
              </td>
              <td className="p-4 border-b border-blue-gray-50 whitespace-normal break-words max-w-xs">
                {order.TAT2 }
              </td>
              <td className="p-2 border-b border-blue-gray-50">
                {/* <button className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:underline">
                Action
                </button> */}
                {/* <ActionButton orderId={order._id}/> */}
                {hasAssignAccess && (
                  <CompletedApproveTask 
                    orderId={order._id}
                    onTaskApproved={() => removeCompletedTask(order._id)}
                  />
                )}
               </td>
            </tr>
            );
          })
        )}
      </tbody>
    </table>
        {isModalOpen && (
                <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} images={modalImages} />
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

export default CompletedBreakdown;
