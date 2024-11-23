import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Modal from '../Modal/Modal';
import CompletedApproveTask from '../Dialogs/ApproveTask';
import RoutineAssignTask from '../Dialogs/RoutineAssignTask';
import RoutineApproveTask from '../Dialogs/RoutineApprove';
import PipingModal from '../Modal/PipingModal';
import ReAssignTask from '../Dialogs/ReAssignTask';

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
  status: string;
  address: string;
  date: string;
  closureDate: string;
  deviceId: string;
  isPeriodicService: boolean;
  assignedTechnicians: Technician[];
  photos: Photo[]; 
  materialsUsed: MaterialUsed[];
  TAT1: string;
  TAT2: string;
}

const CompletedPiping: React.FC = () => {
  const [backendData, setBackendData] = useState<Order[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalImages, setModalImages] = useState<Photo[]>([]);

  const handleApproveTaskSuccess = (approvedTaskId: string) => {
    // Filter out tasks with `approvalPending` set to true
    setBackendData((prevData) => prevData.filter((order) => order._id !== approvedTaskId));
  };

  useEffect(() => {
    const fetchCompletedOrders = async () => {
      try {
        const res = await axios.get('http://35.154.208.29:8080/api/piping/getCompleted');
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
          TAT1: order.TAT1,
          TAT2: order.TAT2,
          address: order.address.map((addr: Address) => addr.location).join(", ") || "N/A",
          date: new Date(order.assignedDate).toLocaleDateString(),
          closureDate: new Date(order.endDate).toLocaleDateString(),
          deviceId: order.deviceId || "N/A",
          assignedTechnicians: order.assignedTechnicians || [],
          photos: order.photos || [] // Assuming photos are included in the API response
        }));
        setBackendData(orders);
      } catch (error) {
        console.error(error);
      }
    };

    fetchCompletedOrders();
  }, []);

  const handleViewImages = (photos: Photo[]) => {
    // Set all photos directly without filtering
    setModalImages(photos);
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
          <th className="p-4 border-b border-blue-gray-50 min-w-[90px] whitespace-normal w-25">Before & After Images</th>
          <th className="p-4 border-b border-blue-gray-50 min-w-[150px]">Technician Names</th>
          {/* <th className="p-4 border-b border-blue-gray-50 min-w-[150px]">Issue Reported</th> */}
          <th className="p-4 border-b border-blue-gray-50 min-w-[180px]">Material Used</th>
          <th className="p-4 border-b border-blue-gray-50  whitespace-normal w-25">Assigned Date & Time</th>
          <th className="p-4 border-b border-blue-gray-50 min-w-[120px] whitespace-normal w-25">Closure Date & Time</th>
          <th className="p-4 border-b border-blue-gray-50 min-w-[120px] whitespace-normal w-25">TAT1</th>
          <th className="p-4 border-b border-blue-gray-50 min-w-[150px]">TAT2</th>
          <th className="p-4 border-b border-blue-gray-50 min-w-[150px]">Action</th>
        </tr>
      </thead>
      <tbody>
        {backendData.length === 0 ? (
          <tr>
            <td colSpan={9} className="text-center p-4">No tasks available</td>
          </tr>
        ) : (
          backendData.map((order) => (
            <tr key={order._id} className="hover:bg-gray-50">
              <td className="p-4 border-b border-blue-gray-50">{order.task_id || "N/A"}</td>
              <td className="p-4 border-b border-blue-gray-50">
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
                <td className="p-4 border-b border-blue-gray-50">
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
              {/* <td className="p-4 border-b border-blue-gray-50">{order.issueReported || "N/A"}</td> */}
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
              <td className="p-4 border-b border-blue-gray-50">{order.date || "N/A"}</td>
              <td className="p-4 border-b border-blue-gray-50">{order.closureDate || "N/A"}</td>
              <td className="p-4 border-b border-blue-gray-50">{order.TAT1 ? order.TAT1 : "0"}</td>
              <td className="p-4 border-b border-blue-gray-50">{order.TAT2 ? order.TAT2 : "0"}</td>
              <td className="p-4 border-b border-blue-gray-50 whitespace-normal break-words max-w-xs z-99999">
                {/* <RoutineApproveTask orderId={order._id} /> */}
                <ReAssignTask orderId={order._id}/>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
        {isModalOpen && (
                <PipingModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} images={modalImages} />
        )}
    </div>
  );
};

export default CompletedPiping;
