import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ReAssignTask from '../Dialogs/ReAssignTask';
import Pagination from '../Pagination';
import SearchBox from '../SearchBox/SearchBox';
import DatePicker2 from '../DateFilter/DatePicker2';
import { useRefresh } from '@/app/context/RefreshContext';
import toast from 'react-hot-toast';
import ClickOutside from '../ClickOutside';
import {onLoadingCompleteProp} from '@/types/Loader/Loading';
import { formatDate } from '../utils/dateUtils';
import FilterDrawer from '../Filters/Filters';
import AssignedFilterDrawer from '../Filters/AssignedFilters';
import DateInfoTooltip from '../ToolTips/breakdownDateInfo';

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
interface AssignedBreakdownProps {
  onLoadingComplete: () => void;
}

const AssignedBreakdown: React.FC<AssignedBreakdownProps> = ({ onLoadingComplete }) => {
  let [backendData, setBackendData] = useState<Order[]>([]);
  const [hasAssignAccess, setHasAssignAccess] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
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
    const fetchAssignedOrders = async () => {
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_SERVICE_BACKEND_API}/api/breakdown/getAssigned`);
        // const res = await axios.get(`http://localhost:8000/api/breakdown/getAssigned`);
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
        setOriginalData(orders);
      } catch (error) {
        console.error(error);
      } finally{
        onLoadingComplete();
      }
    };

    fetchAssignedOrders();
  }, [refreshKey, onLoadingComplete]);

  useEffect(() => {
    if (selectedStartDate || selectedEndDate) {
      const filteredData = originalData.filter((order) => {
        const orderDate = new Date(order.date);
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
    toast.success('data refreshing...');
    triggerRefresh();
  }
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
              <AssignedFilterDrawer 
                originalData={originalData} 
                setFilteredData={setBackendData}
              />
            </div>
      </div>
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
                {/* <th className="p-2 border-b border-blue-gray-50 min-w-[150px]">
                  <div className="font-semibold text-sm">Device ID</div>
                </th> */}
                {hasAssignAccess && ( <th className="p-2 border-b border-blue-gray-50 min-w-[100px]">
                  <div className="font-semibold text-sm">Action</div>
                </th> )}
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
                      {order.address != "N/A" ? order.address : "Non App User"}
                    </td>
                    <td className="p-2 border-b border-blue-gray-50 text-sm">
                        <DateInfoTooltip 
                          assignedDate={order.date} 
                          scheduledDate={order.scheduledDate}
                          complaintRaisedDate={order.complaintRaised}
                        />
                    </td>
                    {/* <td className="p-2 border-b border-blue-gray-50 text-sm">{order.deviceId || "N/A"}</td> */}
                    <td className="p-2 border-b border-blue-gray-50">
                      {/* <button className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:underline">
                        Action
                      </button> */}
                      {hasAssignAccess && (
                        <ReAssignTask orderId={order._id}/>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            </table>
          </div>
        </div>
      </div>
      <Pagination
            currentPage={currentPage}
            totalItems={backendData.length}
            itemsPerPage={itemsPerPage}
            paginate={paginate}
        />
    </>
  );
};

export default AssignedBreakdown;
