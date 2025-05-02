import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ReAssignTask from '../Dialogs/ReAssignTask';
import Pagination from '../Pagination';
import SearchBox from '../SearchBox/SearchBox';
import { useRefresh } from '@/app/context/RefreshContext';
import toast from 'react-hot-toast';
import {onLoadingCompleteProp} from '@/types/Loader/Loading';
import AssignedFilterDrawer from '../Filters/AssignedFilters';
import DateInfoTooltip from '../ToolTips/breakdownDateInfo';
import AssignedFilter from '../Filters/AssignedFilter';

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

interface Order {
  _id: string;
  task_id: string;
  contactPerson: string;
  customerDetails: string;
  complaintRaised?: string;
  issueReported: string;
  status: string;
  address: string;
  date: string;
  scheduledDate: string;
  deviceId: string;
  assignedTechnicians: Technician[];
}

interface FilterParams {
  startDate: string | null;   // ← previously Date | null
  endDate: string | null;
  statuses: string[];
}


interface AssignedBreakdownProps {
  onLoadingComplete: () => void;
}

const AssignedBreakdown: React.FC<AssignedBreakdownProps> = ({ onLoadingComplete }) => {
  const [backendData, setBackendData] = useState<Order[]>([]);
  const [hasAssignAccess, setHasAssignAccess] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Number of items per page
  const [isLoading, setIsLoading] = useState(false);
  const { triggerRefresh, refreshKey } = useRefresh();

  // Check user access rights
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

  // Fetch data on load and refreshKey change
  useEffect(() => {
    fetchAssignedOrders();
  }, [refreshKey]);

  // Fetch initial data
  const fetchAssignedOrders = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get(`${process.env.NEXT_PUBLIC_SERVICE_BACKEND_API}/api/breakdown/getAssigned`);
      
      const orders = res.data.map((order: any) => ({
        _id: order._id,
        task_id: order.task_id,
        contactPerson: order.client_name,
        complaintRaised: order.complaintRaised,
        customerDetails: order.client_number,
        issueReported: order.description,
        status: order.status,
        address: order.address.map((addr: Address) => addr.location).join(", ") || "N/A",
        date: order.assignedDate,
        scheduledDate: order.servicingDate,
        deviceId: order.ac_units?.map((unit: any) => `${unit.type} (${unit.capacity})`).join(", ") || "N/A",
        assignedTechnicians: order.assignedTechnicians || []
      }));
      
      setBackendData(orders);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch assigned tasks");
    } finally {
      setIsLoading(false);
      onLoadingComplete();
    }
  };

  // Fetch filtered data using API
  const fetchFilteredData = async (filters: FilterParams) => {
    try {
      setIsLoading(true);
      // Prepare request body
      const requestBody: any = {};
      
      if (filters.startDate) {
        requestBody.startDate = filters.startDate;
      }
      
      if (filters.endDate) {
        requestBody.endDate = filters.endDate;
      }
      
      if (filters.statuses && filters.statuses.length > 0) {
        requestBody.statuses = filters.statuses;
      }
      
      // If no filters applied, fetch all data
      if (Object.keys(requestBody).length === 0) {
        return fetchAssignedOrders();
      }
      
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVICE_BACKEND_API}/api/breakdown/getFilteredAssigned`,
        requestBody
      );

      const orders = res.data.map((order: any) => ({
        _id: order._id,
        task_id: order.task_id,
        contactPerson: order.client_name,
        complaintRaised: order.complaintRaised,
        customerDetails: order.client_number,
        issueReported: order.description,
        status: order.status,
        address: order.address.map((addr: Address) => addr.location).join(", ") || "N/A",
        date: order.assignedDate,
        scheduledDate: order.servicingDate,
        deviceId: order.ac_units?.map((unit: any) => `${unit.type} (${unit.capacity})`).join(", ") || "N/A",
        assignedTechnicians: order.assignedTechnicians || []
      }));
      
      setBackendData(orders);
      toast.success(`${orders.length} tasks found`);
      
    } catch (error) {
      console.error("Error fetching filtered data:", error);
      toast.error("Failed to apply filters");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Pagination logic
  const indexOfLastOrder = currentPage * itemsPerPage;
  const indexOfFirstOrder = indexOfLastOrder - itemsPerPage;
  const filteredOrders = backendData.filter((order) =>
    order.contactPerson.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const handleRefresh = () => {
    toast.success('Data refreshing...');
    triggerRefresh();
  };

  return (
    <>
      <div className="top-0 bg-white flex items-center justify-between mb-4 z-0">    
        <div className='flex-grow z-0'>
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
          <AssignedFilter fetchFilteredData={fetchFilteredData} />
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className='relative'>
          <div className='overflow-visible'>
            <div className="overflow-visible">
              <table className="w-full text-left table-auto min-w-max z-0">
                <thead>
                  <tr className="">
                    <th className="p-2 border-b border-blue-gray-50 min-w-[120px]">
                      <div className="font-semibold text-sm">Task ID</div>
                    </th>
                    <th className="p-2 border-b border-blue-gray-50 min-w-[150px]">
                      <div className="font-semibold text-sm">Contact Person</div>
                    </th>
                    <th className="p-2 border-b border-blue-gray-50 min-w-[150px]">
                      <div className="font-semibold text-sm">Customer Details</div>
                    </th>
                    <th className="p-2 border-b border-blue-gray-50 min-w-[180px]">
                      <div className="font-semibold text-sm">Assigned Technicians</div>
                    </th>
                    <th className="p-2 border-b border-blue-gray-50 min-w-[200px]">
                      <div className="font-semibold text-sm">Issue Reported</div>
                    </th>
                    <th className="p-2 border-b border-blue-gray-50 min-w-[120px]">
                      <div className="font-semibold text-sm">Status</div>
                    </th>
                    <th className="p-2 border-b border-blue-gray-50 min-w-[250px]">
                      <div className="font-semibold text-sm">Customer Address</div>
                    </th>
                    <th className="p-2 border-b border-blue-gray-50 min-w-[120px]">
                      <div className="font-semibold text-sm">Date</div>
                    </th>
                    {hasAssignAccess && (
                      <th className="p-2 border-b border-blue-gray-50 min-w-[100px]">
                        <div className="font-semibold text-sm">Action</div>
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {backendData.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="text-center p-4">No tasks available</td>
                    </tr>
                  ) : (
                    currentOrders.map((order) => (
                      <tr key={order._id} className="hover:bg-gray-50">
                        <td className="p-2 border-b border-blue-gray-50 text-sm">{order.task_id || "N/A"}</td>
                        <td className="p-2 border-b border-blue-gray-50 text-sm max-w-50">{order.contactPerson || "N/A"}</td>
                        <td className="p-2 border-b border-blue-gray-50 text-sm">{order.customerDetails || "N/A"}</td>
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
                        <td className="p-2 border-b border-blue-gray-50 text-sm max-w-50">{order.issueReported || "N/A"}</td>
                        <td className="p-2 border-b border-blue-gray-50 text-sm">
                          <span className={`px-5 py-2 rounded-full text-xs uppercase ${
                            order.status === 'open' ? 'bg-red-100 text-red-800':
                            order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                            order.status === 'Completed' ? 'bg-green-100 text-green-800' : 
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {order.status || "N/A"}
                          </span>
                        </td>
                        <td className="p-2 border-b border-blue-gray-50 whitespace-normal break-words max-w-xs">
                          {order.address !== "N/A" ? order.address : "Non App User"}
                        </td>
                        <td className="p-2 border-b border-blue-gray-50 text-sm">
                          <DateInfoTooltip 
                            assignedDate={order.date} 
                            scheduledDate={order.scheduledDate}
                            complaintRaisedDate={order.complaintRaised}
                          />
                        </td>
                        {hasAssignAccess && (
                          <td className="p-2 border-b border-blue-gray-50">
                            <ReAssignTask orderId={order._id}/>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      
      <Pagination
        currentPage={currentPage}
        totalItems={filteredOrders.length}
        itemsPerPage={itemsPerPage}
        paginate={paginate}
      />
    </>
  );
};

export default AssignedBreakdown;