import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ReAssignTask from '../Dialogs/ReAssignTask';
import Pagination from '../Pagination';
import SearchBox from '../SearchBox/SearchBox';
import { useRefresh } from '@/app/context/RefreshContext';
import { formatDate } from '../utils/dateUtils';
import AcInstallationDetails from '../ToolTips/AcInstallationDetails';
import AssignedFilter from '../Filters/AssignedFilter';

interface Address {
  location: string;
  latitude: string;
  longitude: string;
}

interface FilterParams {
  startDate: string | null;
  endDate: string | null;
  statuses: string[];
}

interface Technician {
  _id: string;
  name: string;
  email: string;
  phone: string;
  technician_id: string;
}

interface Device {
  deviceName: string;
  model: string;
  status: string;
}

interface Order {
  _id: string;
  task_id: string;
  contactPerson: string;
  customerDetails: string;
  issueReported: string;
  status: string;
  address: string;
  date: string;
  scheduledDate: string;
  deviceId: string;
  devices?: Device[];
  assignedTechnicians: Technician[];
}

interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

const AssignedInstallation: React.FC = () => {
  const [backendData, setBackendData] = useState<Order[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasAssignAccess, setHasAssignAccess] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<FilterParams>({
    startDate: null,
    endDate: null,
    statuses: [],
  });
  const itemsPerPage = 10;
  const { refreshKey } = useRefresh();

  // Decode token to check role
  useEffect(() => {
    const checkUserAccess = () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(
            atob(base64)
              .split('')
              .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
              .join('')
          );
          const decodedToken = JSON.parse(jsonPayload);
          setHasAssignAccess(decodedToken.role !== 'viewAccess');
        } catch (err) {
          console.error('Error decoding token:', err);
          setHasAssignAccess(false);
        }
      }
    };
    checkUserAccess();
  }, []);

  // Main fetch — runs on page change, filter change, or refresh
  useEffect(() => {
    const hasFilters =
      activeFilters.startDate ||
      activeFilters.endDate ||
      activeFilters.statuses.length > 0;

    if (hasFilters) {
      fetchFilteredData(activeFilters, currentPage);
    } else {
      fetchAssignedOrders(currentPage);
    }
  }, [currentPage, activeFilters, refreshKey, searchQuery]);

  // Reset to page 1 when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const mapOrder = (order: any): Order => {
    // Map ac_units to devices format for AcInstallationDetails component
    const devices = order.ac_units?.map((unit: any, index: number) => ({
      deviceName: `${unit.type} - Unit ${index + 1}`,
      model: unit.capacity,
      status: order.status === 'Completed' 
        ? 'Installation Completed' 
        : order.status === 'open' 
        ? 'Installation Open' 
        : 'Installation Pending',
    })) || [];

    return {
      _id: order._id,
      task_id: order.task_id,
      contactPerson: order.client_name,
      customerDetails: order.client_number,
      issueReported: order.description,
      status: order.status,
      devices,
      address:
        order.address?.map((addr: Address) => addr.location).join(', ') || 'N/A',
      date: order.servicingDate,
      scheduledDate: order.scheduledDate || '',
      deviceId:
        order.ac_units
          ?.map((unit: any) => `${unit.type} (${unit.capacity})`)
          .join(', ') || 'N/A',
      assignedTechnicians: order.assignedTechnicians || [],
    };
  };

  const parseResponse = (response: any) => {
    const responseData = response?.data;
    const data = Array.isArray(responseData)
      ? responseData
      : responseData?.data ?? responseData ?? [];

    const pagination = responseData?.pagination ?? responseData?.data?.pagination;
    const totalItems =
      pagination?.totalItems ?? responseData?.totalItems ?? data.length;

    return { data, totalItems };
  };

  const fetchAssignedOrders = async (page: number) => {
    setIsLoading(true);
    try {
      const params: any = { page, limit: itemsPerPage };
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_SERVICE_BACKEND_API}/api/installation/getAssigned`,
        { params }
      );

      const { data, totalItems: total } = parseResponse(res);
      setBackendData(data.map(mapOrder));
      setTotalItems(total);
    } catch (error) {
      console.error('Failed to fetch assigned orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFilteredData = async (filters: FilterParams, page: number) => {
    setIsLoading(true);
    try {
      const requestBody: any = { page, limit: itemsPerPage };

      if (filters.startDate) requestBody.startDate = filters.startDate;
      if (filters.endDate) requestBody.endDate = filters.endDate;
      if (filters.statuses?.length) requestBody.statuses = filters.statuses;
      if (searchQuery.trim()) requestBody.search = searchQuery.trim();

      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVICE_BACKEND_API}/api/installation/getFilteredAssigned`,
        requestBody
      );

      const { data, totalItems: total } = parseResponse(res);
      setBackendData(data.map(mapOrder));
      setTotalItems(total);
    } catch (err) {
      console.error('Failed to fetch filtered installation data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (filters: FilterParams) => {
    setActiveFilters(filters);
    setCurrentPage(1); // reset to first page on new filter
  };

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // Client-side search on current page data
  const filteredOrders = backendData.filter((order) =>
    order.contactPerson?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const currentOrders = searchQuery ? filteredOrders : backendData;
  const paginationTotalItems = searchQuery ? filteredOrders.length : totalItems;

  return (
    <div>
      {/* Search + Filter Row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex-grow">
          <SearchBox
            placeholder="Search by customer name"
            value={searchQuery}
            onChange={setSearchQuery}
          />
        </div>
        <AssignedFilter fetchFilteredData={handleFilterChange} />
      </div>

      {/* Table */}
      <table className="w-full text-left table-auto min-w-max">
        <thead>
          <tr className="bg-gray-50">
            <th className="p-2 border-b border-blue-gray-50 min-w-[120px]">
              <div className="font-semibold text-sm">Task ID</div>
            </th>
            <th className="p-2 border-b border-blue-gray-50 min-w-[150px] w-40">
              <div className="font-semibold text-sm">Contact Person</div>
            </th>
            <th className="p-2 border-b border-blue-gray-50 min-w-[150px]">
              <div className="font-semibold text-sm">Customer Details</div>
            </th>
            <th className="p-2 border-b border-blue-gray-50 min-w-[180px]">
              <div className="font-semibold text-sm">Assigned Technicians</div>
            </th>
            <th className="p-2 border-b border-blue-gray-50 min-w-[180px]">
              <div className="font-semibold text-sm">Installation Details</div>
            </th>
            <th className="p-2 border-b border-blue-gray-50 min-w-[120px]">
              <div className="font-semibold text-sm">Status</div>
            </th>
            <th className="p-2 border-b border-blue-gray-50 min-w-[120px]">
              <div className="font-semibold text-sm">Date & Time</div>
            </th>
            {hasAssignAccess && (
              <th className="p-2 border-b border-blue-gray-50 min-w-[100px]">
                <div className="font-semibold text-sm">Action</div>
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={hasAssignAccess ? 8 : 7} className="text-center p-8">
                <div className="flex items-center justify-center gap-2 text-gray-500">
                  <svg
                    className="animate-spin h-5 w-5 text-blue-500"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    />
                  </svg>
                  <span className="text-sm">Loading tasks...</span>
                </div>
              </td>
            </tr>
          ) : currentOrders.length === 0 ? (
            <tr>
              <td
                colSpan={hasAssignAccess ? 8 : 7}
                className="text-center p-4 text-gray-500 text-sm"
              >
                No tasks available
              </td>
            </tr>
          ) : (
            currentOrders.map((order) => (
              <tr key={order._id} className="hover:bg-gray-50">
                <td className="p-2 border-b border-blue-gray-50 text-sm">
                  {order.task_id || 'N/A'}
                </td>
                <td className="p-2 border-b border-blue-gray-50 text-sm">
                  {order.contactPerson || 'N/A'}
                </td>
                <td className="p-2 border-b border-blue-gray-50 text-sm">
                  {order.customerDetails || 'N/A'}
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
                    <span className="text-gray-400 italic text-xs">
                      No technicians assigned
                    </span>
                  )}
                </td>
                <td className="p-2 border-b border-blue-gray-50 text-sm max-w-50">
                  <AcInstallationDetails devices={order.devices || []} />
                </td>
                <td className="p-2 border-b border-blue-gray-50 text-sm">
                  <span
                    className={`px-5 py-2 rounded-full text-xs uppercase ${
                      order.status === 'open'
                        ? 'bg-red-100 text-red-800'
                        : order.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : order.status === 'Completed'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {order.status || 'N/A'}
                  </span>
                </td>
                <td className="p-2 border-b border-blue-gray-50 text-sm">
                  {order.date
                    ? `${formatDate(order.date).date} ${formatDate(order.date).time}`
                    : 'N/A'}
                </td>
                {hasAssignAccess && (
                  <td className="p-2 border-b border-blue-gray-50">
                    <ReAssignTask orderId={order._id} />
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalItems={paginationTotalItems}
        itemsPerPage={itemsPerPage}
        paginate={paginate}
      />
    </div>
  );
};

export default AssignedInstallation;