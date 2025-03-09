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
  issueReported: string;
  status: string;
  address: string;
  date: string;
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
        const orders = res.data.map((order: any) => ({
          _id: order._id,
          task_id: order.task_id,
          contactPerson: order.client_name,
          customerDetails: order.client_number,
          issueReported: order.description,
          status: order.status,
          address: order.address.map((addr: Address) => addr.location).join(", ") || "N/A",
          date: order.assignedDate,
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
            {/* <button
            type="button"
            className="inline-flex w-[fit-content] justify-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 shadow-xs ring-gray-300 ring-inset hover:bg-gray-50"
            onClick={toggleDropdown}
          >
            Filters 🌪️
            <svg
            className="-mr-1 size-5 text-gray-400"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
                clipRule="evenodd"
              />
            </svg>
            </button> */}
            <AssignedFilterDrawer 
              originalData={originalData} 
              setFilteredData={setBackendData}
            />
          </div>

        {isOpen && (
          <ClickOutside onClick={() => setIsOpen(false)}>
            <div className="absolute right-0 z-10 mt-10 w-56 origin-top-right rounded-md bg-white ring-1 shadow-lg ring-black/5 focus:outline-hidden">
              <div className="py-1">
                <div
                  className="flex justify-between items-center px-4 py-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-100"
                  onClick={() => setIsOpen(false)}
                >
                  Filters <span className="text-red-500 font-bold cursor-pointer">❌</span>
                </div>
                <div
                  className="block px-4 py-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-100"
                  onClick={openDatePicker}
                >
                  Date
                </div>
              </div>
            </div>
          </ClickOutside>
      )}

          {showDatePicker && (
              <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 mt-[-60vh]">
                <div className="bg-white rounded-lg shadow-lg p-6 relative w-96">
                  <button className="absolute top-2 right-2 text-gray-600 hover:text-red-500 text-lg" onClick={closeDatePicker}>
                    ❌
                  </button>
                  <h2 className="text-lg font-semibold mb-4 text-center">Select Date Range</h2>
                  <DatePicker2
                    selectedStartDate={selectedStartDate}
                    selectedEndDate={selectedEndDate}
                    setSelectedStartDate={setSelectedStartDate}
                    setSelectedEndDate={setSelectedEndDate}
                  />
                   <div className="flex justify-center mt-4 space-x-4">
                    <button
                      className="px-4 py-2 bg-white text-gray-700 font-semibold rounded"
                      onClick={resetDatePicker}
                    >
                      Clear Date
                    </button>
                    <button
                      className="px-4 py-2 bg-blue-500 text-white font-semibold rounded hover:bg-blue-600"
                      onClick={closeDatePicker}
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            )}
       </div>
    <table className="w-full text-left table-auto min-w-max">
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
              {order.date ? `${formatDate(order.date).date} ${formatDate(order.date).time}` : "N/A"}
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

<Pagination
          currentPage={currentPage}
          totalItems={backendData.length}
          itemsPerPage={itemsPerPage}
          paginate={paginate}
        />

  </div>
  );
};

export default AssignedBreakdown;
