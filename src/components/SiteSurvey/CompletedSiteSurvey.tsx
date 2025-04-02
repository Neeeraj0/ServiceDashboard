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
import { formatDate } from '../utils/dateUtils';
import { format } from 'date-fns';

interface AcUnit {
    type: string;
    capacity: string;
    quantity: number;
    orderId?: string | null;
}
  

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
  closureDate: string;
  date: string;
  note: string;
  deviceId: string;
  assignedTechnicians: Technician[];
  photos: Photo[];
  materialsUsed: MaterialUsed[];
  issueObserved: string;
  isPeriodicService: boolean;
  ac_units?: AcUnit[];
  reportPresignedUrl?: string; // Add this property
  TAT2: string;
}

const CompletedInstallation: React.FC = () => {
  const [backendData, setBackendData] = useState<Order[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalImages, setModalImages] = useState<Photo[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasAssignAccess, setHasAssignAccess] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [reportUrl, setReportUrl] = useState<string>("");
const [isReportModalOpen, setIsReportModalOpen] = useState(false);
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

    const handleViewReport = (url: string) => {
        setReportUrl(url);
        setIsReportModalOpen(true);
      };
  const handleApproveTaskSuccess = (approvedTaskId: string) => {
    // Filter out tasks with `approvalPending` set to true
    setBackendData((prevData) => prevData.filter((order) => order._id !== approvedTaskId));
  };

  useEffect(() => {
    const fetchCompletedOrders = async () => {
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_SERVICE_BACKEND_API}/api/siteSurveyDetails/getCompletedSiteSurveys`);
        // const res = await axios.get('http://localhost:8000/api/siteSurveyDetails/getCompletedSiteSurveys');
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
          address: order.address.map((addr: Address) => addr.location).join(", ") || "N/A",
          date: order.assignedDate,
          closureDate: order.endDate,
          deviceId: order.deviceId || "N/A",
          assignedTechnicians: order.assignedTechnicians || [],
          photos: order.photos || [],// Assuming photos are included in the API response
          ac_units: order.ac_units || [],// Add this line to include AC units
          reportPresignedUrl: order.reportPresignedUrl || "" // Add this line
        }));
        setBackendData(orders);
      } catch (error) {
        console.error(error);
      }
    };

    fetchCompletedOrders();
  }, [refreshKey]);

  const formatAcUnits = (acUnits: AcUnit[]): string => {
    if (!acUnits || acUnits.length === 0) return "N/A";

    console.log('line 153', acUnits);
    
    // Group by type
    const typeGroups: { [key: string]: { [capacity: string]: number } } = {};
    
    acUnits.forEach(unit => {
      if (!typeGroups[unit.type]) {
        typeGroups[unit.type] = {};
      }
      
      // Extract the numeric part from capacity (e.g., "S10" -> "1", "C20" -> "2")
      const capacity = unit.capacity.substring(1, 2) + "T";
      
      if (!typeGroups[unit.type][capacity]) {
        typeGroups[unit.type][capacity] = 0;
      }
      
      typeGroups[unit.type][capacity] += unit.quantity;
    });
    
    // Format the output
    const result = Object.keys(typeGroups).map(type => {
      const capacities = Object.keys(typeGroups[type]).map(cap => 
        `${cap} (${typeGroups[type][cap]})`
      ).join(", ");
      
      return `${type}: ${capacities}`;
    }).join(" ");
    
    return result;
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
    <table className="w-full text-left table-auto min-w-max gap-10">
      <thead>
        <tr className="bg-gray-50">
          <th className="p-2 border-b border-blue-gray-50 min-w-[120px]">
            <div className="font-semibold text-sm">Task ID</div>
          </th>
          <th className="p-1 border-b border-blue-gray-50 min-w-[150px]">
            <div className="font-semibold text-sm">Customer Details</div>
          </th>
          <th className="p-1 border-b border-blue-gray-50 min-w-[150px]">
            <div className="font-semibold text-sm">Assigned Technicians</div>
          </th>
          
          <th className="p-1 border-b border-blue-gray-50  whitespace-normal w-50">
            <div className="font-semibold text-sm">Assigned Date & Time</div>
          </th>
          <th className="p-1 border-b border-blue-gray-50 min-w-[90px] whitespace-normal w-50">
            <div className="font-semibold text-sm">Closure Date & Time</div>
          </th>
          <th className="p-1 border-b border-blue-gray-50 min-w-[120px] whitespace-normal w-25">
            <div className="font-semibold text-sm">AC Details</div>
          </th>
          <th className="p-1 border-b border-blue-gray-50 min-w-[120px] whitespace-normal w-50">
            <div className="font-semibold text-sm">Customer address</div>
          </th>
          <th className="p-1 border-b border-blue-gray-50 min-w-[120px] whitespace-normal w-25">
            <div className="font-semibold text-sm">Report</div>
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
                {order.contactPerson}
                <br />
                {order.customerDetails}
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
                {order.date ? (
                        <>                
                        {order.date ? `${formatDate(order.date).time}` : "N/A"}

                        <div>{format(new Date(order.date), 'do MMMM')}</div>
                        </>
                    ) : (
                        "N/A"
                    )}
              </td>
              <td className="p-2 border-b border-blue-gray-50 text-sm">
                {order.closureDate ? (
                    <>
                    <div>{format(new Date(order.closureDate), 'h:mm a')}</div>

                    <div>{format(new Date(order.closureDate), 'do MMMM')}</div>
                    </>
                ) : (
                    "N/A"
                )}
              </td>
              <td className="p-2 border-b border-blue-gray-50 text-sm">
                {order.ac_units ? formatAcUnits(order.ac_units) : "N/A"}
              </td>
              <td className="p-2 border-b border-blue-gray-50 text-sm">
                {order.address}
              </td>
              {order.reportPresignedUrl ? (
                <button
                    onClick={() => handleViewReport(order?.reportPresignedUrl || "")}
                    className="px-3 py-1 text-white rounded transition-colors align-center text-center mt-10"
                >
                    <span className="flex items-center text-blue-800 text-sm w-30">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                        </svg>
                        View Report
                    </span>
                </button>
                ) : (
                "No report available"
                )}
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

        {isReportModalOpen && (
            <ReportModal 
                isOpen={isReportModalOpen} 
                onClose={() => setIsReportModalOpen(false)} 
                reportUrl={reportUrl} 
            />
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

const ReportModal: React.FC<{ isOpen: boolean; onClose: () => void; reportUrl: string }> = ({ 
  isOpen, 
  onClose, 
  reportUrl 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-4 w-full max-w-6xl h-5/6 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Site Survey Report</h2>
          <button 
            className="text-gray-500 hover:text-gray-700"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        <div className="flex-grow">
          <iframe 
            src={reportUrl} 
            className="w-full h-full" 
            title="Site Survey Report"
          />
        </div>
      </div>
    </div>
  );
};
