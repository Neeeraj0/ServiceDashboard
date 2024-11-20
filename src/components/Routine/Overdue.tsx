import React, { useEffect, useState } from 'react';
import axios from 'axios';

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

interface ACUnit {
    type: string;
    quantity: number;
    capacity: string;
  }  
  

interface Order {
  _id: string;
  task_id: string;
  contactPerson: string;
  clientName: string;
  clientNumber: string;
  issueReported: string;
  status: string;
  address: string;
  date: string;
  deviceId: string;
  ac_units: ACUnit[];
  assignedTechnicians: Technician[];
}

const Overdue: React.FC = () => {
  const [backendData, setBackendData] = useState<Order[]>([]);

  useEffect(() => {
    const fetchAssignedOrders = async () => {
      try {
        const res = await axios.get('http://35.154.208.29:8080/api/routine/getOverdue');
        const orders = res.data.map((order: any) => ({
          _id: order._id,
          task_id: order.task_id,
          clientName: order.client_name,
          clientNumber: order.client_number,
          issueReported: order.description,
          status: order.status,
          address: order.address.map((addr: Address) => addr.location).join(", ") || "N/A",
          date: new Date(order.servicingDate).toLocaleDateString(),
          deviceId: order.deviceId,
          ac_units: order.ac_units || [],
          assignedTechnicians: order.assignedTechnicians || []
        }));
        setBackendData(orders);
      } catch (error) {
        console.error('Error fetching assigned orders:', error);
      }
    };

    fetchAssignedOrders();
  }, []);

  return (
    <div className="">
      <table className="w-full text-left table-auto min-w-max">
        <thead>
          <tr className="bg-gray-50">
            <th className="p-4 border-b border-gray-200">Task ID</th>
            <th className="p-4 border-b border-gray-200">No of AC</th>
            <th className="p-4 border-b border-gray-200">Service Type</th>
            <th className="p-4 border-b border-gray-200">Contact Person</th>
            <th className="p-4 border-b border-gray-200">Customer Details</th>
            <th className="p-4 border-b border-gray-200">Customer Address</th>
            <th className="p-4 border-b border-gray-200">Date</th>
            <th className="p-4 border-b border-gray-200">Device ID</th>
            <th className="p-4 border-b border-gray-200">Action</th>
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
                <td className="p-4 border-b border-gray-200">{order.task_id || "N/A"}</td>
                <td className="p-4 border-b border-gray-200">
                  {order.ac_units && order.ac_units.length > 0
                    ? order.ac_units.map((unit, index) => (
                        <div key={index}>
                          {unit.type}: {unit.quantity}
                        </div>
                      ))
                    : "N/A"}
                </td>
                <td className="p-4 border-b border-gray-200">routine </td>
                <td className="p-4 border-b border-gray-200">{order.contactPerson || "N/A"} </td>
                <td className="p-4 border-b border-gray-200">{order.clientName && order.clientNumber
    ? `${order.clientName} ${order.clientNumber}`
    : "N/A"}</td>
                <td className="p-4 border-b border-gray-200">{order.address || "N/A"}</td>
                <td className="p-4 border-b border-gray-200">{order.date || "N/A"}</td>
                <td className="p-4 border-b border-gray-200">{order.deviceId || "N/A"}</td>
                <td className="p-4 border-b border-gray-200">
                  <button className="text-blue-500 hover:text-blue-700">Open</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Overdue;
