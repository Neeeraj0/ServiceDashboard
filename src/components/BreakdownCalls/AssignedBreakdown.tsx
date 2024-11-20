import React, { useEffect, useState } from 'react';
import axios from 'axios';
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

const AssignedBreakdown: React.FC = () => {
  const [backendData, setBackendData] = useState<Order[]>([]);

  useEffect(() => {
    const fetchAssignedOrders = async () => {
      try {
        const res = await axios.get('http://35.154.208.29:8080/api/breakdown/getAssigned');
        const orders = res.data.map((order: any) => ({
          _id: order._id,
          task_id: order.task_id,
          contactPerson: order.client_name,
          customerDetails: order.client_number,
          issueReported: order.description,
          status: order.status,
          address: order.address.map((addr: Address) => addr.location).join(", ") || "N/A",
          date: new Date(order.servicingDate).toLocaleDateString(),
          deviceId: order.ac_units?.map((unit: any) => `${unit.type} (${unit.capacity})`).join(", ") || "N/A",
          assignedTechnicians: order.assignedTechnicians || []
        }));
        setBackendData(orders);
      } catch (error) {
        console.error(error);
      }
    };

    fetchAssignedOrders();
  }, []);

  console.log(backendData);

  return (
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
      <th className="p-2 border-b border-blue-gray-50 min-w-[200px]">
        <div className="font-semibold text-sm">Issue Reported</div>
      </th>
      <th className="p-2 border-b border-blue-gray-50 min-w-[120px]">
        <div className="font-semibold text-sm">Status</div>
      </th>
      {/* <th className="p-2 border-b border-blue-gray-50 min-w-[250px]">
        <div className="font-semibold text-sm">Customer Address</div>
      </th> */}
      <th className="p-2 border-b border-blue-gray-50 min-w-[120px]">
        <div className="font-semibold text-sm">Date</div>
      </th>
      {/* <th className="p-2 border-b border-blue-gray-50 min-w-[150px]">
        <div className="font-semibold text-sm">Device ID</div>
      </th> */}
      <th className="p-2 border-b border-blue-gray-50 min-w-[100px]">
        <div className="font-semibold text-sm">Action</div>
      </th>
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
          {/* <td className="p-2 border-b border-blue-gray-50 whitespace-normal break-words max-w-xs">
            {order.address || "N/A"}
          </td> */}
          <td className="p-2 border-b border-blue-gray-50 text-sm">{order.date || "N/A"}</td>
          {/* <td className="p-2 border-b border-blue-gray-50 text-sm">{order.deviceId || "N/A"}</td> */}
          <td className="p-2 border-b border-blue-gray-50">
            {/* <button className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:underline">
              Action
            </button> */}
            <ReAssignTask orderId={order._id}/>
          </td>
        </tr>
      ))
    )}
  </tbody>
</table>
  );
};

export default AssignedBreakdown;
