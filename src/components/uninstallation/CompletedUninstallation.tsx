import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Modal from '../Modal/Modal';
import CompletedApproveTask from '../Dialogs/ApproveTask';
import RoutineAssignTask from '../Dialogs/RoutineAssignTask';
import RoutineApproveTask from '../Dialogs/RoutineApprove';
import { formatDate } from '../utils/dateUtils';
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
  approvalPending?: boolean;
  TAT1: string;
  TAT2: string;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalTasks: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  limit: number;
}

interface ApiResponse {
  tasks: any[];
  pagination: PaginationInfo;
}

const CompletedUninstallation: React.FC = () => {
  const [backendData, setBackendData] = useState<Order[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalImages, setModalImages] = useState<Photo[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasAssignAccess, setHasAssignAccess] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [paginationInfo, setPaginationInfo] = useState<PaginationInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
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

  const fetchCompletedOrders = async (page: number = 1, limit: number = 10) => {
    setIsLoading(true);
    try {
      const res = await axios.get<ApiResponse>(
        `${process.env.NEXT_PUBLIC_SERVICE_BACKEND_API}/getCompleted/installation?page=${page}&limit=${limit}`
      );
      // const res = await axios.get<ApiResponse>(`http://localhost:8080/getCompleted/uninstallation?page=${page}&limit=${limit}`);
      const orders: Order[] = res.data.tasks.map((order: any) => ({
        _id: order._id,
        task_id: order.task_id,
        contactPerson: order.client_name || "N/A",
        customerDetails: order.client_number || "N/A",
        issueReported: order.customerComplaint || order.description || "N/A",
        issueFound: order.issueFound || "N/A",
        materialsUsed: order.materialsUsed
        ? order.materialsUsed.flatMap((material: any) => material.materials || [])
        : [], // Flatten nested materials  
        isPeriodicService: order.periodicService || false,
        approvalPending: order.approvalPending || false, 
        status: order.status,
        TAT1: order.TAT1?.toString() || "0",
        TAT2: order.TAT2?.toString() || "0",
        address: order.address?.map((addr: Address) => addr.location).join(", ") || "N/A",
        assignedDate: order.assignedDate,
        endDate: order.endDate,
        date: order.assignedDate ? new Date(order.assignedDate).toLocaleDateString() : "N/A",
        note: order.note || order.description || "",
        deviceId: order.deviceId || "N/A",
        assignedTechnicians: order.assignedTechnicians || [],
        photos: order.photos || [],
        issueObserved: order.issueObserved || order.description || "N/A"
      }));
      
      setBackendData(orders);
      setPaginationInfo(res.data.pagination);
    } catch (error) {
      console.error(error);
      setBackendData([]);
      setPaginationInfo(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCompletedOrders(currentPage, itemsPerPage);
  }, [refreshKey, currentPage]);

  // Reset to page 1 when search query changes
  useEffect(() => {
    if (searchQuery) {
      setCurrentPage(1);
      // For search, you might want to implement server-side search
      // For now, we'll keep the existing client-side filtering
      fetchCompletedOrders(1, itemsPerPage);
    } else {
      fetchCompletedOrders(currentPage, itemsPerPage);
    }
  }, [searchQuery]);

  const handleViewImages = (photos: Photo[]) => {
    setModalImages(photos);
    setIsModalOpen(true);
  };

  // Filter orders based on search query (client-side filtering)
  const filteredOrders = backendData.filter((order) =>
    order.contactPerson?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // For paginated API, we don't need to slice the data as it's already paginated
  const currentOrders = searchQuery ? filteredOrders : backendData;

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

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

      {isLoading && (
        <div className="flex justify-center items-center p-8">
          <div className="text-lg">Loading...</div>
        </div>
      )}

      <table className="w-full text-left table-auto min-w-max">
        <thead>
          <tr className="bg-gray-50">
            <th className="p-2 border-b border-blue-gray-50 min-w-[120px]">
              <div className="font-semibold text-sm">Task ID</div>
            </th>
            <th className="p-1 border-b border-blue-gray-50 min-w-[90px] whitespace-normal w-25">
              <div className="font-semibold text-sm text-center">Images</div>
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
              <div className="font-semibold text-sm max-w-[95px]">Assigned Date & Time</div>
            </th>
            <th className="p-1 border-b border-blue-gray-50 whitespace-normal">
              <div className="font-semibold text-sm max-w-[95px]">Closure Date & Time</div>
            </th>
            {hasAssignAccess && (
              <th className="p-1 border-b border-blue-gray-50 min-w-[150px]">
                  <div className="font-semibold text-sm text-center">Action</div>
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {currentOrders.length === 0 && !isLoading ? (
            <tr>
              <td colSpan={10} className="text-center p-4">
                {searchQuery ? "No tasks found matching your search" : "No tasks available"}
              </td>
            </tr>
          ) : (
            currentOrders.map((order) => {
                const formattedAssignedDate = formatDate(order?.assignedDate);
                const formattedClosureDate = formatDate(order?.endDate);
            return (
                <tr key={order._id} className="hover:bg-gray-50">
                    <td className="p-2 border-b border-blue-gray-50 text-sm truncate">{order.task_id || "N/A"}</td>
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
                    <td className="p-4 border-b border-blue-gray-50 text-xs">
                      {formattedAssignedDate.date || 'N/A'} {formattedAssignedDate.time || 'N/A'}
                    </td>
                    <td className="p-4 border-b border-blue-gray-50 text-xs">
                      {formattedClosureDate.date || 'N/A'} {formattedClosureDate.time || 'N/A'}
                    </td>
                    {hasAssignAccess && (
                    <td className="p-2 border-b border-blue-gray-50 text-sm whitespace-normal break-words max-w-xs z-99999">
                        <ReAssignTask orderId={order._id}/>
                    </td>
                    )}
                </tr>
                );
            })
          )}
        </tbody>
      </table>

      {isModalOpen && (
            <PipingModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} images={modalImages}  taskName={"uninstallation"}/>
        )}

      {/* Updated Pagination Component */}
      {paginationInfo && !searchQuery && (
        <div className="mt-4 flex justify-center">
          <Pagination
            currentPage={paginationInfo.currentPage}
            totalItems={paginationInfo.totalTasks}
            itemsPerPage={paginationInfo.limit}
            paginate={handlePageChange}
          />
        </div>
      )}

      {paginationInfo && !searchQuery && (
        <div className="mt-2 text-center text-sm text-gray-600">
          Showing {((paginationInfo.currentPage - 1) * paginationInfo.limit) + 1} to{' '}
          {Math.min(paginationInfo.currentPage * paginationInfo.limit, paginationInfo.totalTasks)} of{' '}
          {paginationInfo.totalTasks} tasks
        </div>
      )}
    </div>
  );
};

export default CompletedUninstallation;