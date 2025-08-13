import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import AssignInstallation from '../Dialogs/AssignInstallation';
import SearchBox from '../SearchBox/SearchBox';
import { useRefresh } from '@/app/context/RefreshContext';
import toast from 'react-hot-toast';
import { formatDate } from '../utils/dateUtils';
import FilterDrawer from '../Filters/Filters';
import InstallationFilterDrawer from '../Filters/OpenInstallationFilters';
import Pagination from '../Pagination';
import ErrorPage from '../ErrorPage/Error';
import AssignUninstallation from '../Dialogs/AssignUninstallation';

interface DeviceId {
  orderId: string;
  deviceId?: string | null;
  deviceType: string;
  deviceTon: string;
  serialId: string | null;
  _id: string;
}

interface UninstallationTask {
  _id: string;
  addressId: string;
  deviceIds: DeviceId[];
  reasonForUninstallation: string;
  tentativeUninstallationDate: string;
  status: string;
  createdBy: string;
  customerId: string;
  __v: number;
}

interface ShippingAddress {
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
  _id: string;
  contactNumber: string;
  contactPerson: string;
}

interface UninstallationResponse {
  task: UninstallationTask;
  customerName: string;
  shippingAddress: ShippingAddress;
}

interface ApiResponse {
  success: boolean;
  message: string;
  currentPage: number;
  pageSize: number;
  data: UninstallationResponse[];
}

const OpenUninstallation = () => {
  const [allUninstallationData, setAllUninstallationData] = useState<UninstallationResponse[]>([]);
  const [filteredUninstallations, setFilteredUninstallations] = useState<UninstallationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [hasAssignAccess, setHasAssignAccess] = useState(true);
  const { triggerRefresh, refreshKey } = useRefresh();
  const itemsPerPage = 10;

  const modelToTonnage: { [key: string]: string } = {
    "S10": "Split 1T",
    "S15": "Split 1.5T", 
    "S20": "Split 2T",
    "S30": "Split 3T",
    "C10": "Cassette 1T",
    "C15": "Cassette 1.5T",
    "C20": "Cassette 2T",
    "C30": "Cassette 3T",
  };

  // Check token for user access
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
          setHasAssignAccess(false);
        }
      }
    };

    checkUserAccess();
  }, []);

  // Fetch uninstallation data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get<ApiResponse>(
          `http://35.154.208.29:1883/api/uninstallation?page=${currentPage}&pageSize=${itemsPerPage}${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ''}`,
          {
            headers: {
              Authorization: `Bearer ${process.env.NEXT_PUBLIC_SALES_BACKEND_TOKEN}`,
            },
          }
        );

        if (response.data.success) {
            console.log("Fetched Uninstallation Data:", response.data.data);
            const filteredData = response.data.data.filter(task => task.task.status.toLowerCase() === 'pending');
            console.log("Filtered Uninstallation Data:", filteredData);
            setAllUninstallationData(filteredData);
            setFilteredUninstallations(filteredData);
            setTotalPages(Math.ceil(filteredData.length / itemsPerPage));
            setTotalItems(filteredData.length);
        }
      } catch (err: any) {
        console.error('Error fetching uninstallation data:', err);
        setError(err.response?.data?.message || 'Failed to fetch uninstallation data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentPage, refreshKey, searchQuery]);

  // Filter data based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredUninstallations(allUninstallationData);
    } else {
      const filtered = allUninstallationData.filter(item =>
        item.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.task.customerId.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredUninstallations(filtered);
      setCurrentPage(1);
    }
  }, [allUninstallationData, searchQuery]);

  const formatDeviceDetails = (deviceIds: DeviceId[]) => {
    const groupedDevices: Record<string, { quantity: number, tonnage: string }> = {};

    deviceIds.forEach((device) => {
      const tonnage = modelToTonnage[device.deviceTon] || device.deviceTon;
      
      if (!groupedDevices[device.deviceTon]) {
        groupedDevices[device.deviceTon] = { quantity: 0, tonnage };
      }
      groupedDevices[device.deviceTon].quantity += 1;
    });

    return Object.values(groupedDevices)
      .map(({ tonnage, quantity }) => `${tonnage} (${quantity})`)
      .join(', ');
  };

  const handleTaskAssigned = useCallback((id: string) => {
    setRemovingId(id);
    setTimeout(() => {
      setFilteredUninstallations(prev => prev.filter(task => task.task._id !== id));
      setRemovingId(null);
    }, 300);
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <ErrorPage error={error} />;

  const paginate = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const handleRefresh = () => {
    toast.success('Data Refreshed Successfully');
    triggerRefresh();
  };

  const formatUninstallationDate = (dateString: string) => {
  const date = new Date(dateString);

  return {
    date: date.toLocaleDateString('en-GB', { timeZone: 'UTC' }),  // Force UTC for date
    time: date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'UTC'  // Force UTC for time
    })
  };
};

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className='flex-grow'>
          <SearchBox 
            placeholder="Search by customer name or customer ID"
            value={searchQuery}
            onChange={setSearchQuery}
          />
        </div>
        <div className='flex gap-2 ml-[auto] '>
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
          {/* <InstallationFilterDrawer 
            originalData={allUninstallationData} 
            setFilteredData={setFilteredUninstallations} 
          /> */}
        </div>
      </div>

      <table className="w-full text-left table-auto min-w-max">
        <thead>
          <tr>
            <th className="p-4 border-y border-blue-gray-100 bg-blue-gray-50/50 text-sm">Task ID</th>
            <th className="p-4 border-y border-blue-gray-100 bg-blue-gray-50/50 text-sm">Contact Person</th>
            <th className="p-4 border-y border-blue-gray-100 bg-blue-gray-50/50 text-sm">Customer Details</th>
            <th className="p-4 border-y border-blue-gray-100 bg-blue-gray-50/50 text-sm">Device Details</th>
            <th className="p-4 border-y border-blue-gray-100 bg-blue-gray-50/50 text-sm">Customer Address</th>
            <th className="p-4 border-y border-blue-gray-100 bg-blue-gray-50/50 text-sm">Reason</th>
            <th className="p-4 border-y border-blue-gray-100 bg-blue-gray-50/50 text-sm max-w-40">Uninstallation Date & Time</th>
            <th className="p-4 border-y border-blue-gray-100 bg-blue-gray-50/50 text-sm">Status</th>
            {hasAssignAccess && (
              <th className="p-4 border-y border-blue-gray-100 bg-blue-gray-50/50 text-sm">Action</th>
            )}
          </tr>
        </thead>
        <tbody>
          {filteredUninstallations.length === 0 ? (
            <tr>
              <td colSpan={hasAssignAccess ? 9 : 8} className="text-center p-4">No uninstallation tasks available</td>
            </tr>
          ) : (
            filteredUninstallations.map((item, index) => {
              const serialNumber = (currentPage - 1) * itemsPerPage + index + 1;
              const { task, customerName, shippingAddress } = item;
              
              const formattedDateTime = formatUninstallationDate(task.tentativeUninstallationDate);
              
              const address = `${shippingAddress.line1}, ${shippingAddress.line2 || ''}, ${shippingAddress.city}, ${shippingAddress.state}, ${shippingAddress.pincode}`;

              // Convert devices to ac_units format for AssignInstallation component
              const acUnits = task.deviceIds.map(device => ({
                type: device.deviceType + " AC",
                capacity: device.deviceTon,
                quantity: 1
              }));

              return (
                <tr key={task._id} className={removingId === task._id ? 'fade-out' : ''}>
                  <td className="p-2 border-b border-blue-gray-50 text-sm">{serialNumber}</td>
                  <td className="p-2 border-b border-blue-gray-50 text-sm">
                    {shippingAddress.contactPerson && shippingAddress.contactNumber
                      ? (
                        <>
                          {shippingAddress.contactPerson} <br />
                          {shippingAddress.contactNumber}
                        </>
                      )
                      : (
                        <div className="flex items-center justify-center text-red-500 font-extrabold bg-red-100 px-2 py-1 rounded-md shadow-[0_0_5px_rgba(239,68,68,0.5)] h-full w-fit text-xs">
                          Not Mentioned
                        </div>
                      )}
                  </td>
                  <td className="p-2 border-b border-blue-gray-50 text-sm whitespace-normal w-50">
                    <div>
                      <div className="font-medium">{customerName}</div>
                      <div className="text-xs text-gray-500">{task.customerId}</div>
                    </div>
                  </td>
                  <td className="p-2 border-b border-blue-gray-50 text-sm whitespace-pre-line w-40">
                    {formatDeviceDetails(task.deviceIds)}
                  </td>
                  <td className="p-2 border-b border-blue-gray-50 text-sm whitespace-normal w-40">
                    {address}
                  </td>
                  <td className="p-2 border-b border-blue-gray-50 text-sm">
                    <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                      {task.reasonForUninstallation}
                    </span>
                  </td>
                  <td className="p-2 border-b border-blue-gray-50 text-sm">
                    {formattedDateTime.date} 
                    <br />
                    {formattedDateTime.time}
                  </td>
                  <td className="p-2 border-b border-blue-gray-50 text-sm">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      task.status === 'pending' 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : task.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                    </span>
                  </td>
                  {hasAssignAccess && (
                    <td className="p-2 border-b border-blue-gray-50 text-sm relative dropdown-container">
                       <AssignUninstallation 
                        preOrderId={task._id}
                        parentPreOrderId=""
                        clientName={customerName}
                        clientNumber={shippingAddress.contactNumber}
                        description={task.reasonForUninstallation}
                        onTaskAssigned={handleTaskAssigned}
                        ac_units={acUnits}
                        addressDisplay={address}
                        contactName={shippingAddress.contactPerson}
                        contactNumber={shippingAddress.contactNumber}
                        uninstallationTaskData={item} // Pass complete task data
                      />
                    </td>
                  )}
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      <Pagination
        currentPage={currentPage}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        paginate={paginate}
      />
    </div>
  );
};

export default OpenUninstallation;