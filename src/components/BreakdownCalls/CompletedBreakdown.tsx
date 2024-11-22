import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Modal from '../Modal/Modal';
import Completed from '../Routine/Completed';
import CompletedApproveTask from '../Dialogs/ApproveTask';
import ActionButton from '../ActionButton/ActionButton';

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
  issueFound: string;
  status: string;
  address: string;
  assignedDate: string;
  endDate: string;
  date: string;
  deviceId: string;
  assignedTechnicians: Technician[];
  photos: Photo[]; 
  materialsUsed: MaterialUsed[];
  issueObserved: string;
  isPeriodicService: boolean;
  TAT1: string;
  TAT2: string;
}

const CompletedBreakdown: React.FC = () => {
  const [backendData, setBackendData] = useState<Order[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalImages, setModalImages] = useState<Photo[]>([]);

  useEffect(() => {
    const fetchCompletedOrders = async () => {
      try {
        const res = await axios.get('http://35.154.208.29:8080/api/breakdown/getCompleted');
        const orders = res.data.map((order: any) => ({
          _id: order._id,
          task_id: order.task_id,
          contactPerson: order.client_name,
          customerDetails: order.client_number,
          issueReported: order.customerComplaint,
          issueObserved: order.issueObserved,
materialsUsed: order.materialsUsed
          ? order.materialsUsed.flatMap((material: any) => material.materials || [])
          : [], // Flatten nested materials         
          assignedDate: new Date(order.assignedDate).toLocaleString(), // Convert to readable date-time
          endDate: new Date(order.endDate).toLocaleString(),
          status: order.status,
          address: order.address.map((addr: Address) => addr.location).join(", ") || "N/A",
          date: new Date(order.servicingDate).toLocaleDateString(),
          deviceId: order.ac_units?.map((unit: any) => `${unit.type} (${unit.capacity})`).join(", ") || "N/A",
          assignedTechnicians: order.assignedTechnicians || [],
          photos: order.photos || [],// Assuming photos are included in the API response
          isPeriodicService: order.isPeriodicService,
          TAT1: order.TAT1,
          TAT2: order.TAT2
        }));
        setBackendData(orders);
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
          <th className="p-2 border-b border-blue-gray-50 min-w-[120px] text-sm">Task ID</th>
          <th className="p-2 border-b border-blue-gray-50 w-25 min-w-[70px] text-sm whitespace-normal">Before & After Images</th>
          <th className="p-2 border-b border-blue-gray-50 min-w-[120px] text-sm">Technician Names</th>
          <th className="p-2 border-b border-blue-gray-50 min-w-[120px] text-sm">Issue Reported</th>
          <th className="p-2 border-b border-blue-gray-50 min-w-[120px] text-sm">Issue Found</th>
          <th className="p-2 border-b border-blue-gray-50 min-w-[120px] text-sm">Material Used</th>
          <th className="p-2 border-b border-blue-gray-50 min-w-[120px] text-sm whitespace-normal w-22">Assigned Date & Time</th>
          <th className="p-2 border-b border-blue-gray-50 min-w-[120px] text-sm whitespace-normal w-25">Closure Date & Time</th>
          <th className="p-2 border-b border-blue-gray-50 min-w-[120px] text-sm w-25 whitespace-normal">Routine Services Completed</th>
          <th className="p-2 border-b border-blue-gray-50 min-w-[120px] text-sm">TAT 1</th>
          <th className="p-2 border-b border-blue-gray-50 min-w-[120px] text-sm">TAT 2</th>
          <th className="p-2 border-b border-blue-gray-50 min-w-[120px] text-sm">Action</th>
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
              <td className="p-4 border-b border-blue-gray-50 text-xs">{order.task_id || "N/A"}</td>
              <td className="p-4 border-b border-blue-gray-50 text-sm">
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
              <td className="p-2 border-b border-blue-gray-50 text-sm">
                {order.assignedTechnicians.map(technician => technician.name)}
              </td>
              <td className="p-2 border-b border-blue-gray-50 text-sm">{order.issueReported || "N/A"}</td>
              <td className="p-2 border-b border-blue-gray-50 text-sm max-w-40 flex-wrap">{order.issueObserved || "N/A"}</td>
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
              <td className="p-4 border-b border-blue-gray-50 text-xs">{order.assignedDate || "N/A"}</td>
              <td className="p-4 border-b border-blue-gray-50 text-xs">{order.endDate || "N/A"}</td>
              <td className="p-4 border-b border-blue-gray-50 text-sm">
                  {order.isPeriodicService !== undefined && order.isPeriodicService !== null ? 
                (order.isPeriodicService ? "Yes" : "No") : "N/A"}
              </td>
              <td className="p-4 border-b border-blue-gray-50 whitespace-normal break-words max-w-xs">
                {order.TAT1 || "N/A"}
              </td>
              <td className="p-4 border-b border-blue-gray-50 whitespace-normal break-words max-w-xs">
                {order.TAT2 || "N/A"}
              </td>
              <td className="p-2 border-b border-blue-gray-50">
                {/* <button className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:underline">
                Action
                </button> */}
                <ActionButton orderId={order._id}/>
                {/* <CompletedApproveTask orderId={order._id}/> */}
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

export default CompletedBreakdown;
