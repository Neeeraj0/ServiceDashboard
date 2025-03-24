import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ReAssignTask from '../Dialogs/ReAssignTask';
import Pagination from '../Pagination';
import SearchBox from '../SearchBox/SearchBox';
import DatePicker2 from '../DateFilter/DatePicker2';
import { useRefresh } from '@/app/context/RefreshContext';
import ClickOutside from '../ClickOutside';
import { formatDate } from '../utils/dateUtils';
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
  scheduledDate: string;
  deviceId: string;
  assignedTechnicians: Technician[];
}

const AssignedSiteSurvey: React.FC = () => {
  const [backendData, setBackendData] = useState<Order[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasAssignAccess, setHasAssignAccess] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const itemsPerPage = 10;
  const [isOpen, setIsOpen] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [originalData, setOriginalData] = useState<Order[]>([]);
  const [selectedStartDate, setSelectedStartDate] = useState<string | null>(null);
  const [selectedEndDate, setSelectedEndDate] = useState<string | null>(null);
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
        const res = await axios.get('http://localhost:8000/api/siteSurveyDetails/getAssigned');
        // const res = await axios.get(`${process.env.NEXT_PUBLIC_SERVICE_BACKEND_API}/api/installation/getAssigned`);
        const orders = res.data
        .filter((order: any) => order.status === 'open' || order.status === 'pending') // Add this filter to only keep "open" or "pending" orders
        .map((order: any) => ({
          _id: order._id,
          task_id: order.task_id,
          contactPerson: order.client_name,
          customerDetails: order.client_number,
          issueReported: order.description,
          status: order.status,
          address: order.address.map((addr: Address) => addr.location).join(", ") || "N/A",
          date: order.servicingDate,
          deviceId: order.ac_units?.map((unit: any) => `${unit.type} (${unit.capacity})`).join(", ") || "N/A",
          assignedTechnicians: order.assignedTechnicians || []
        }));
        setBackendData(orders);
        setOriginalData(orders);
      } catch (error) {
        console.error(error);
      }
    };

    fetchAssignedOrders();
  }, []);

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
    
    useEffect(() => {
      let filteredData = originalData;
  
      if (selectedStartDate || selectedEndDate) {
          filteredData = originalData.filter((order) => {
              const orderDate = new Date(order.date).toISOString().split("T")[0]; // Convert to YYYY-MM-DD
              
              if (selectedStartDate && selectedEndDate) {
                  return orderDate >= selectedStartDate && orderDate <= selectedEndDate;
              } else if (selectedStartDate) {
                  return orderDate === selectedStartDate;
              }
              return true;
          });
      }
      setBackendData(filteredData);
  }, [selectedStartDate, selectedEndDate, originalData]);
  
  const indexOfLastOrder = currentPage * itemsPerPage;
  const indexOfFirstOrder = indexOfLastOrder - itemsPerPage;
  // const currentOrders = backendData.slice(indexOfFirstOrder, indexOfLastOrder);
  const filteredOrders = backendData.filter((order) =>
    order.contactPerson.toLowerCase().includes(searchQuery.toLowerCase())
  );

  let currentOrders = filteredOrders.slice(
    indexOfFirstOrder,
    indexOfLastOrder
  );

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  useEffect(() => {
      setCurrentPage(1);
  }, [searchQuery]);

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
          <AssignedFilterDrawer 
                        originalData={originalData} 
                        setFilteredData={setBackendData}
                      />
        </div>
    <table className="w-full text-left table-auto min-w-max">
      <thead>
        <tr className="bg-gray-50">
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
          
          <th className="p-2 border-b border-blue-gray-50 min-w-[120px]">
            <div className="font-semibold text-sm">Status</div>
          </th>
          {/* <th className="p-2 border-b border-blue-gray-50 min-w-[250px]">
            <div className="font-semibold text-sm">Customer Address</div>
          </th> */}
          <th className="p-2 border-b border-blue-gray-50 min-w-[120px]">
            <div className="font-semibold text-sm">Date & Time</div>
          </th>
          {/* <th className="p-2 border-b border-blue-gray-50 min-w-[150px]">
            <div className="font-semibold text-sm">Device ID</div>
          </th> */}
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
              <td className="p-2 border-b border-blue-gray-50 text-sm">{order.contactPerson || "N/A"}</td>
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
              {/* <td className="p-2 border-b border-blue-gray-50 text-sm max-w-50">{order.issueReported || "N/A"}</td> */}
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
              {/* <td className="p-2 border-b border-blue-gray-50 whitespace-normal break-words max-w-xs">
                {order.address || "N/A"}
              </td> */}
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

export default AssignedSiteSurvey;
