import React, { useEffect, useState } from 'react';
import axios from 'axios';
import InstallationApprove from '../Dialogs/InstallationApprove';
import { formatDate } from '../utils/dateUtils';
import './module.style.css';
import PipingModal from '../Modal/PipingModal';
import Pagination from '../Pagination';
import SearchBox from '../SearchBox/SearchBox';
import DatePicker2 from '../DateFilter/DatePicker2';
import { useRefresh } from '@/app/context/RefreshContext';
import ClickOutside from '../ClickOutside';

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

interface ApprovalPendingInstallationProps {
  onLoadingComplete: () => void;
}

const ApprovalPending: React.FC<ApprovalPendingInstallationProps> = ({onLoadingComplete}) => {
  const [pipingData, setPipingData] = useState<PipingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalImages, setModalImages] = useState<Photo[]>([]);
  const [approvedTasks] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 20; // Match your API default
  const [selectedTask, setSelectedTask] = useState<PipingResponse | null>(null);
  const [hasAssignAccess, setHasAssignAccess] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedStartDate, setSelectedStartDate] = useState<string | null>(null);
  const [selectedEndDate, setSelectedEndDate] = useState<string | null>(null);
  const { triggerRefresh, refreshKey } = useRefresh();

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset to page 1 when search query or dates change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, selectedStartDate, selectedEndDate]);

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

  const fetchPipingData = async (page = 1, limit = itemsPerPage) => {
    try {
      setLoading(true);
      
      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      // Add search parameter if exists
      if (debouncedSearchQuery.trim()) {
        params.append('search', debouncedSearchQuery.trim());
      }

      // Add date filters if they exist
      if (selectedStartDate) {
        params.append('startDate', selectedStartDate);
      }
      if (selectedEndDate) {
        params.append('endDate', selectedEndDate);
      }

      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_SERVICE_BACKEND_API}/api/installation/getApprovalPending?${params.toString()}`
        // `http://localhost:8080/api/installation/getApprovalPending?${params.toString()}`
      );
      
      // Handle the response based on your API structure
      // You might need to update your API to return totalCount
      const data = Array.isArray(res.data) ? res.data : res.data.tasks || [];
      const total = res.data.totalCount || data.length;
      
      const filteredData = data.filter((task: PipingResponse) => !approvedTasks.has(task.task_id));
      
      setPipingData(filteredData);
      setTotalItems(total);
      setError(null);
    } catch (err: any) {
      if (err.response && err.response.status === 404) {
        setPipingData([]); 
        setTotalItems(0);
        setError(null); 
      } else {
        console.error("Error fetching piping data:", err);
        setError(err.message);
      }
    } finally {
      setLoading(false);
      onLoadingComplete();
    }
  };

  // Fetch data when page, search, or date filters change
  useEffect(() => {
    fetchPipingData(currentPage, itemsPerPage);
  }, [currentPage, debouncedSearchQuery, selectedStartDate, selectedEndDate, refreshKey]);

  const handleTaskApproval = (taskId: string) => {
    setRemovingIds(prev => new Set(prev).add(taskId));
    
    approvedTasks.add(taskId);
    
    setTimeout(() => {
      setPipingData(prevData => prevData.filter(task => task.task_id !== taskId));
      setRemovingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
      
      // Optionally refetch data to maintain correct pagination
      fetchPipingData(currentPage, itemsPerPage);
    }, 3000);
  };

  const handleViewImages = (photos: Photo[], task: PipingResponse) => {
    setModalImages(photos);
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const paginate = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  if (loading && currentPage === 1) return <div>Loading...</div>;

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
          <div className='flex gap-2 ml-auto'>
            <button
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
            </button>
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
      
      {loading && currentPage > 1 && (
        <div className="text-center py-2">Loading more data...</div>
      )}
      
      <table className="w-full text-left table-auto min-w-max">
        <thead>
          <tr>
            <th className="p-4 border-y border-blue-gray-100 bg-blue-gray-50/50 text-sm">Task ID</th>
            <th className="p-4 border-y border-blue-gray-100 bg-blue-gray-50/50 text-sm">Photos</th>
            <th className="p-4 border-y border-blue-gray-100 bg-blue-gray-50/50 text-sm">Status</th>
            <th className="p-4 border-y border-blue-gray-100 bg-blue-gray-50/50 text-sm">Technician Name</th>
            <th className="p-4 border-y border-blue-gray-100 bg-blue-gray-50/50 text-sm">Assigned Date & Time</th>
            <th className="p-4 border-y border-blue-gray-100 bg-blue-gray-50/50 text-sm">Customer Details</th>
            {hasAssignAccess && (
              <th className="p-4 border-y border-blue-gray-100 bg-blue-gray-50/50 text-sm">Action</th>
            )}
          </tr>
        </thead>
        <tbody>
          {pipingData.length === 0 ? (
            <tr>
              <td colSpan={hasAssignAccess ? 7 : 6} className="text-center p-8">
                {loading ? "Loading..." : "No tasks available"}
              </td>
            </tr>
          ) : (
            pipingData.map((task) => {
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
                <td className="p-2 border-b border-blue-gray-50 text-sm whitespace-normal w-40">
                  {task.client_name} <br /> {task.client_number}
                </td>
                {hasAssignAccess && (
                  <td className="p-2 border-b border-blue-gray-50 text-sm">
                    <InstallationApprove 
                      orderId={task.task_id} 
                      taskDetails={task}
                      onApprove={() => handleTaskApproval(task.task_id)} 
                    />
                  </td>
                )}
              </tr>
              );
            })
          )}
        </tbody>
      </table>
      
      {isModalOpen && selectedTask &&(
        <PipingModal 
          isOpen={isModalOpen} 
          onClose={() => {
            setIsModalOpen(false);
            setSelectedTask(null);
          }}  
          images={modalImages} 
          taskName="Installation" 
          taskDetails={selectedTask}
        />
      )}

      <Pagination
        currentPage={currentPage}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        paginate={paginate}
      />
    </div>
  );
};

export default ApprovalPending;