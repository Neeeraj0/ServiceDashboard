import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Modal from '../Modal/Modal';
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
  date: string;
  deviceId: string;
  assignedTechnicians: Technician[];
  photos: Photo[]; 
  ac_units: ACUnit[];

}

const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    };
    return date.toLocaleDateString('en-US', options);
};
  

const Assigned: React.FC = () => {
  const [backendData, setBackendData] = useState<Order[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalImages, setModalImages] = useState<Photo[]>([]);

  useEffect(() => {
    const fetchCompletedOrders = async () => {
      try {
        const res = await axios.get('http://35.154.208.29:8080/api/routine/getAssigned');
        const orders = res.data.map((order: any) => ({
          _id: order._id,
          task_id: order.task_id,
          contactPerson: order.client_name,
          customerDetails: order.client_number,
          issueReported: order.customerComplaint,
          status: order.status,
          ac_units: order.ac_units || [],
          address: order.address.map((addr: Address) => addr.location).join(", ") || "N/A",
          date: new Date(order.assignedDate).toLocaleDateString(),
          deviceId: order.deviceId || "N/A",
          assignedTechnicians: order.assignedTechnicians || [],
          photos: order.photos || [] 
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
          <th className="p-4 border-b border-blue-gray-50 min-w-[120px]">Task ID</th>
          <th className="p-4 border-b border-blue-gray-50 min-w-[150px]">No of ACs</th>
          <th className="p-4 border-b border-blue-gray-50 min-w-[150px]">Service Type</th>
          <th className="p-4 border-b border-blue-gray-50 min-w-[150px]">Contact Person</th>
          <th className="p-4 border-b border-blue-gray-50 min-w-[180px]">Csutomer Details</th>
          <th className="p-4 border-b border-blue-gray-50 min-w-[200px]">Customer Address</th>
          <th className="p-4 border-b border-blue-gray-50 min-w-[120px] whitespace-normal w-25">Assigned Date & Time</th>
          <th className="p-4 border-b border-blue-gray-50 min-w-[250px]">Device ID</th>
          <th className="p-4 border-b border-blue-gray-50 min-w-[120px]">Action</th>
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
              <td className="p-4 border-b border-blue-gray-50 text-sm">{order.task_id || "N/A"}</td>
              <td
                    className="py-3 text-sm border-none"
                    style={{ width: "10%" }}
                  >
                    <div className="text-center">
                      {order.ac_units.map((unit, index) => (
                        <div key={index}>
                          {unit.type}: {unit.quantity}
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
              <td className="p-4 border-b border-blue-gray-50 text-sm">{order.date || "N/A"}</td>
              <td className="p-4 border-b border-blue-gray-50 whitespace-normal break-words max-w-xs">
                {order.deviceId || "N/A"}
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
