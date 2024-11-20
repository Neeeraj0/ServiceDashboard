import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ACUnit, Order } from '@/types/breakdown/Order';
import { ShippingAddress } from '@/types/breakdown/ShippingAddress';
import AssignTask from '../Dialogs/AssignTask';

const OpenBreakdown = () => {
  const [backendData, setBackendData] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [shippingAddresses, setShippingAddresses] = useState<ShippingAddress[]>([]); 
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; 


  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await axios.get('http://35.154.99.208:5000/api/query/queries/all', {
          headers: {
            "Content-Type": "application/json",
          },
        });
        setBackendData(res.data.data); // Assuming res.data is the array you want to set
      } catch (err: any) {
        console.error("Error fetching data: ", err);
        setError(err.message); // Set error message
      } finally {
        setLoading(false); // Set loading to false after fetch is complete
      }
    };

    fetchTasks();
  }, []); 

  const transformOrderModels = (orderModels: (string | number | null)[]): ACUnit[] => {
    const acUnits: ACUnit[] = [];
    for (let i = 0; i < orderModels.length; i += 2) {
        const model = orderModels[i] as string;
        const quantity = (orderModels[i + 1] as number) || 1;
        if (model) acUnits.push({ model, quantity});
    }
    return acUnits;
  };


  // Fetch shipping addresses
  useEffect(() => {
    const fetchShippingAddresses = async () => {
      try {
        const loginResponse = await axios.post('https://testing.backend.summary.circolife.vip/api/login', {
          email: "admin@gmail.com",
          password: "admin@123",
        }, {
          headers: {
            "Content-Type": "application/json",
          },
        });

        const token = loginResponse.data.token;

        const res = await axios.get('http://35.154.208.29:5000/api/summary/address', {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        setShippingAddresses(res.data); // Set the fetched shipping addresses to state
      } catch (err) {
        console.log(err);
      }
    };

    fetchShippingAddresses(); // Call the async function
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error fetching data: {error}</div>;

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'open':
        return 'relative grid items-center px-2 py-1 font-sans text-xs font-bold text-green-900 uppercase rounded-md select-none whitespace-nowrap bg-red-500/20 text-red-500';
      case 'assign':
        return 'relative grid items-center px-2 py-1 font-sans text-xs font-bold text-green-900 uppercase rounded-md select-none whitespace-nowrap bg-yellow-500/200 text-yellow-800';
      case 'complete':
        return 'relative grid items-center px-2 py-1 font-sans text-xs font-bold text-green-900 uppercase rounded-md select-none whitespace-nowrap bg-green-500/20 text-green-800';
      default:
        return 'bg-gray-300 text-black'; 
    }
  };

  console.log("Data fetched from API:", backendData);

  const getShippingAddress = (orderId: string) => {
    const address = shippingAddresses.find(address => address._id === orderId);
    return address?.customerData?.shipping_address[0] || null;
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return (
      <div className="flex flex-col text-sm">
        <span>{date.toLocaleDateString()}</span>
        <span>{date.toLocaleTimeString()}</span>
      </div>
    );
  };

  return (
    <div>
      <table className="w-full text-left table-auto min-w-max">
        <thead>
          <tr>
            <th className="p-4 border-y border-blue-gray-100 bg-blue-gray-50/50 text-sm">Task ID</th>
            <th className="p-4 border-y border-blue-gray-100 bg-blue-gray-50/50 text-sm">Contact Person</th>
            <th className="p-4 border-y border-blue-gray-100 bg-blue-gray-50/50 text-sm">Customer Details</th>
            <th className="p-4 border-y border-blue-gray-100 bg-blue-gray-50/50 text-sm">Issue Reported</th>
            {/* <th className="p-4 border-y border-blue-gray-100 bg-blue-gray-50/50">Status</th> */}
            <th className="p-4 border-y border-blue-gray-100 bg-blue-gray-50/50 text-sm">Customer Address</th>
            <th className="p-4 border-y border-blue-gray-100 bg-blue-gray-50/50 text-sm">Date</th>
            <th className="p-4 border-y border-blue-gray-100 bg-blue-gray-50 /50 text-sm">Device ID</th>
            <th className="p-4 border-y border-blue-gray-100 bg-blue-gray-50/50 text-sm">Action</th>
          </tr>
        </thead>
        <tbody>
          {Array.isArray(backendData) && backendData.length === 0 ? (
            <tr>
              <td colSpan={9} className="text-center">No tasks available</td>
            </tr>
          ) : (
            Array.isArray(backendData) && backendData
            .filter(order => order.queryStatus === "open")
            .map((order, index) => {
              const shippingAddress = getShippingAddress(order._id);
              const addressDisplay = shippingAddress 
                ? `${shippingAddress.line1}, ${shippingAddress.line2 || ''}, ${shippingAddress.city}, ${shippingAddress.state}, ${shippingAddress.pincode}` 
                : "N/A";

              return (
                <tr key={order._id}>
                  <td className="p-2 border-b border-blue-gray-50 text-sm">{index + 1 || "N/A"}</td>
                  <td className="p-2 border-b border-blue-gray-50 text-sm">  {order.contactperson || "N/A"} <br /> {order.contactnumber || "N/A"}</td>
                  <td className="p-2 border-b border-blue-gray-50 text-sm">  {order.contactperson || "N/A"} <br /> {order.contactnumber || "N/A"}</td>
                  <td className="p-2 border-b border-blue-gray-50 text-sm">{order.subject || "N/A"}</td>
                  {/* <td className="p-4 border-b border-blue-gray-50">
                    <div className={`w-max ${getStatusClass(order.queryStatus)}`}>
                      <span>{order.queryStatus}</span>
                    </div>
                  </td> */}
                  <td className="p-2 border-b border-blue-gray-50 text-wrap max-w-50">{addressDisplay}</td>
                  <td className="p-2 border-b border-blue-gray-50 text-wrap text-sm flex-wrap">
                    {formatDate(order.TimeStamp)}
                  </td>
                  <td className="p-2 border-b border-blue-gray-50 text-sm max-w-50">{order.deviceid || "N/A"}</td>
                  <td className="p-2 border-b border-blue-gray-50 mt-[5vh] text-sm">
                    <AssignTask 
                     orderId={order._id}
                     clientName={order.contactperson}
                     clientNumber={order.contactnumber}
                     description={order.summery}
                     complaintRaised={order.TimeStamp}
                     customerComplaint={order.subject}
                     addressDisplay={addressDisplay}
                     ac_units={Array.isArray(order.orderModels) && typeof order.orderModels[0] === "string" 
                      ? transformOrderModels(order.orderModels as (string | number | null)[]) 
                      : order.orderModels as ACUnit[]}
                     />
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

export default OpenBreakdown;