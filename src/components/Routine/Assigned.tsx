import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Modal from '../Modal/Modal';
import ReAssignTask from '../Dialogs/ReAssignTask';
import { formatDate } from '../utils/dateUtils';
import AcInstallationDetails from '../ToolTips/AcInstallationDetails';
import RoutineServiceDetails from '../ToolTips/routineServiceDetails';

interface DeviceIdDisplayProps {
  deviceIds: string[]; // Accept both single string and array of strings
  maxVisible?: number;
}

const DeviceIdDisplay: React.FC<DeviceIdDisplayProps> = ({ 
  deviceIds, 
  maxVisible = 2 
}) => {
  const [showAll, setShowAll] = useState(false);
  
  if (!deviceIds || deviceIds.length === 0) {
    return <span>N/A</span>;
  }

  console.log("Device IDs:", deviceIds);

  const visibleIds = showAll ? deviceIds : deviceIds.slice(0, maxVisible);
  const remainingCount = deviceIds.length - maxVisible;

  return (
    <div className="relative">
      <div className="text-sm">
        {visibleIds.map((id, index) => (
          <div key={index} className="text-xs text-gray-600 mb-1">
            {id}
          </div>
        ))}
        
        {!showAll && remainingCount > 0 && (
          <button
            onClick={() => setShowAll(true)}
            className="inline-flex items-center gap-1 text-xs text-blue-800 hover:text-blue-800 font-medium"
          >
            <svg 
              className="w-3 h-3" 
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path 
                fillRule="evenodd" 
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" 
                clipRule="evenodd" 
              />
            </svg>
            +{remainingCount} more
          </button>
        )}
        
        {showAll && (
          <button
            onClick={() => setShowAll(false)}
            className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 font-medium mt-1"
          >
            Show less
          </button>
        )}
      </div>
    </div>
  );
};

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
    type: string;
}

interface ACUnit {
    type: string;
    quantity: number;
    capacity: string;
}

interface Order {
  _id: string;
  task_id: string;
  contactPerson: string;
  customerDetails: string;
  issueReported: string;
  status: string;
  address: string;
  assignedDate: string;
  scheduledDate: string;
  deviceId: string;
  deviceIds: string[]; // Add this to handle array of device IDs
  assignedTechnicians: Technician[];
  photos: Photo[]; 
  ac_units: ACUnit[];
  routineServiceDetails: {
      completed: number,
      total: number,
      message: string
    }
}

const Assigned: React.FC = () => {
  const [backendData, setBackendData] = useState<Order[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalImages, setModalImages] = useState<Photo[]>([]);

  useEffect(() => {
    const fetchCompletedOrders = async () => {
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_SERVICE_BACKEND_API}/api/routine/getAssigned`);
        const orders = res.data.map((order: any) => ({
          _id: order._id,
          task_id: order.task_id,
          contactPerson: order.client_name,
          customerDetails: order.client_number,
          issueReported: order.customerComplaint,
          status: order.status,
          ac_units: order.ac_units || [],
          address: order.address.map((addr: Address) => addr.location).join(", ") || "N/A",
          assignedDate: order.assignedDate,
          scheduledDate: order.servicingDate,
          deviceId: order.deviceId || "N/A",
          deviceIds: order.deviceIds || [], // Handle the array of device IDs
          assignedTechnicians: order.assignedTechnicians || [],
          routineServiceDetails: order.routineServiceDetails || { completed: 0, total: 0, message: "" },
          photos: order.photos || [] 
        }));
        setBackendData(orders);
        console.log("Fetched orders:", backendData);
      } catch (error) {
        console.error(error);
      }
    };

    fetchCompletedOrders();
  }, []);

  const handleViewImages = (photos: Photo[]) => {
    const beforeImages = photos.filter(photo => photo.servicePhase === "before");
    const afterImages = photos.filter(photo => photo.servicePhase === "after");
    setModalImages([...beforeImages, ...afterImages]);
    setIsModalOpen(true);
  };

  console.log(backendData);
  console.log(modalImages);
  
  return (
    <div>
    <table className="w-full text-left table-auto min-w-max">
      <thead>
        <tr className="bg-gray-50">
          <th className="p-4 border-b border-blue-gray-50 min-w-[120px]">Task ID</th>
          <th className="p-4 border-b border-blue-gray-50 min-w-[150px]">No of ACs</th>
          <th className="p-4 border-b border-blue-gray-50 min-w-[150px]">Service Type</th>
          <th className="p-4 border-b border-blue-gray-50 min-w-[150px]">Contact Person</th>
          <th className="p-4 border-b border-blue-gray-50 min-w-[180px]">Customer Details</th>
          <th className="p-4 border-b border-blue-gray-50 min-w-[200px]">Customer Address</th>
          <th className="p-4 border-b border-blue-gray-50 min-w-[120px] whitespace-normal">Assigned Date & Time</th>
          <th className="p-4 border-b border-blue-gray-50 min-w-[120px] whitespace-normal">Scheduled Date & Time</th>
          <th className="p-4 border-b border-blue-gray-50 min-w-[180px]">Device ID</th>
          <th className="p-4 border-b border-blue-gray-50 min-w-[180px]">Routine Service Details</th>
          <th className="p-4 border-b border-blue-gray-50 min-w-[120px]">Action</th>
        </tr>
      </thead>
      <tbody>
        {backendData.length === 0 ? (
          <tr>
            <td colSpan={10} className="text-center p-4">No tasks available</td>
          </tr>
        ) : (
          backendData.map((order) => (
            <tr key={order._id} className="hover:bg-gray-50">
              <td className="p-4 border-b border-blue-gray-50 text-sm">{order.task_id || "N/A"}</td>
              <td
                    className="py-3 text-sm border-none"
                    style={{ width: "10%" }}
                  >
                    <div className="text-center">
                      {order.ac_units.map((unit, index) => (
                        <div key={index}>
                          {unit.type}: {unit.quantity} ({unit.capacity})
                        </div>
                      ))}
                    </div>
                  </td>
              <td className="p-4 border-b border-blue-gray-50 text-sm">routine</td>
              <td className="p-4 border-b border-blue-gray-50 text-sm">
                {order.contactPerson ? (
                    <div>
                    <div>{order.contactPerson}</div>
                    <div>{order.customerDetails}</div>
                    </div>
                ) : "N/A"}
              </td>
              <td className="p-4 border-b border-blue-gray-50 text-sm">
                {order.contactPerson ? (
                    <div>
                    <div>{order.contactPerson}</div>
                    <div>{order.customerDetails}</div>
                    </div>
                ) : "N/A"}
              </td>
              <td className="p-4 border-b border-blue-gray-50 text-sm max-w-50 flex-wrap">{order.address|| "N/A"}</td>
              <td className="text-gray-700">{formatDate(order.assignedDate).date} {formatDate(order.assignedDate).time}</td>
              <td className="text-gray-700">{formatDate(order.scheduledDate).date} {formatDate(order.scheduledDate).time}</td>
              <td className="p-4 border-b border-blue-gray-50 max-w-xs text-sm">
                  {Array.isArray(order.deviceIds) && order.deviceIds.length > 0 ? (
                    <DeviceIdDisplay deviceIds={order.deviceIds} maxVisible={2} />
                  ) : (
                    <div>{order.deviceId}</div>
                  )}
                {/* <DeviceIdDisplay deviceIds={Array.isArray(order.deviceIds) ? order.deviceIds : [order.deviceIds]} maxVisible={2} /> */}
              </td>
              <td className="p-4 border-b border-blue-gray-50 text-sm">
                 {order.routineServiceDetails ? (
                    <RoutineServiceDetails
                      totalUnits={order.routineServiceDetails.total}
                      completedUnits={order.routineServiceDetails.completed}
                      message={order.routineServiceDetails.message}
                    />
                  ) : (
                    <div>Loading service details...</div>
                  )}
              </td>
              <td className="p-4 border-b border-blue-gray-50 text-sm">
                <ReAssignTask orderId={order._id} />
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
        {isModalOpen && (
                <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} images={modalImages} />
        )}
    </div>
  );
};

export default Assigned;