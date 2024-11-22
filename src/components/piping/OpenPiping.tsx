import React, { useEffect, useState } from 'react';
import axios from 'axios';
import PipingAssignTask from '../Dialogs/PipingAssignTask';
import MoveToInstallation from '../Dialogs/MoveToInstallation';
import toast from 'react-hot-toast';

interface PreorderResponse {
  customer: {
    customer_id: string;
    name: string;
    email: string;
    mobile: string;
  };
  _id: string;
  AcDetails: {
    ac_type: string;
    subscription_price: number;
    fixedPriceAfter3Years: number;
    model: string;
    installation_price: number;
    plan_year: string;
    deposit: number;
    quantity: number;
    _id: string;
  }[];
  Ac_totalAmount: number;
  materialsdetails: {
    material_name: string;
    material_price: number;
    quantity: number;
    _id: string;
  }[];
  materialTotalAmount: number;
  status: string;
  with_material: boolean;
  pending_amount: number;
  executive_id: string;
  customer_shipping_address: {
    address_line1: string;
    address_line2: string;
    pincode: string;
    city: string;
    country: string;
    state: string;
    contactPerson: string;
    contactNumber: string;
  }[];
  PaymentStatus: string;
  orderingStatus: boolean;
  OrderDate: string;
  PreOrderId: string;
  paymentStatusFullPayment: string;
  paymentStatusToken: string;
  paymentStatusCustomPayment: string;
}

interface PreorderWithStatus extends PreorderResponse {
  status: "Order Created" | "No Order Created";
  orderId?: string; // Add optional orderId field
}

const OpenPiping = () => {
  const [preorderData, setPreorderData] = useState<PreorderWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null); // Track which dropdown is open
  const [isInstallationDialogOpen, setIsInstallationDialogOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  useEffect(() => {
    const fetchPreorderData = async () => {
      try {
        // Fetch preorders from the primary API
        const res = await axios.get("http://35.154.208.29:8080/api/SiteSurveyDetails/preOrders/piping");
        // const res = await axios.get("http://localhost:8000/api/SiteSurveyDetails/preOrders/piping");

        if (res.status === 404) {
          // Handle 404 case, display custom message for 'No records found for piping installation'
          setError('No preorders available');
          setLoading(false);
          return; // Exit if no data found
        }

        const preorders: PreorderResponse[] = res.data;
  
        // Fetch statuses from the secondary API for each PreOrderId
        const updatedPreorders: PreorderWithStatus[] = await Promise.all(
          preorders.map(async (preorder): Promise<PreorderWithStatus> => {
            const statusRes = await axios.get(
              `http://13.201.4.68:8080/api/preOrder/orders/detail/${preorder.PreOrderId}`
              // `http://3.110.27.89:5000/api/preOrder/orders/detail/${preorder.PreOrderId}`
            );
            const isOrderCreated = Array.isArray(statusRes.data) && statusRes.data.length > 0;
            const orderId = isOrderCreated ? statusRes.data[0]._id : undefined;
            return {
              ...preorder,
              status: isOrderCreated ? "Order Created" : "No Order Created",
              orderId,
            };
          })
        );
  
        setPreorderData(updatedPreorders); // Now this will not throw a type error
      } catch (err: any) {
        console.error("Error fetching preorder data:", err);
         // If the error is from the backend with a custom message (e.g., "No records found")
      if (err.response && err.response.status === 404 && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Error fetching data');
      }
      } finally {
        setLoading(false);
      }
    };
  
    fetchPreorderData();
  }, []);  

  console.log(preorderData);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.dropdown-container')) {
        setOpenDropdownId(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const toggleDropdown = (orderId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent event from bubbling up
    setOpenDropdownId(openDropdownId === orderId ? null : orderId);
  };

  if (loading) return <div>Loading...</div>;
  // if (error) return <div>Error fetching data: {error}</div>;

  const handleMoveToInstallation = async () => {
    if (!selectedOrderId) return;
    try {
      // Close the dialog
      setIsInstallationDialogOpen(false);
      setSelectedOrderId(null);
      toast.success('Order moved to installation successfully! 🎉');
    } catch (error) {
      console.error('Error moving to installation:', error);
    }
  };

  return (
    <div>
      <table className="w-full text-left table-auto min-w-max">
        <thead>
          <tr>
            <th className="p-4 border-y border-blue-gray-100 bg-blue-gray-50/50 text-sm">Customer ID</th>
            <th className="p-4 border-y border-blue-gray-100 bg-blue-gray-50/50 text-sm">Contact Person</th>
            <th className="p-4 border-y border-blue-gray-100 bg-blue-gray-50/50 text-sm">Payment Status</th>
            <th className="p-4 border-y border-blue-gray-100 bg-blue-gray-50/50 text-sm">Customer Details</th>
            <th className="p-4 border-y border-blue-gray-100 bg-blue-gray-50/50 text-sm">Customer Address</th>
            <th className="p-4 border-y border-blue-gray-100 bg-blue-gray-50/50 text-sm">PreOrder Date</th>
            <th className="p-4 border-y border-blue-gray-100 bg-blue-gray-50/50 text-sm">Action</th>
          </tr>
        </thead>
        <tbody>
        {loading ? (
              <tr>
                <td colSpan={9} className="text-center">Loading...</td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={9} className="text-center">No Preorders available</td>
              </tr>
            ) : preorderData.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center">No preorders available</td>
              </tr>
            ) : (
            preorderData.map((order) => {
              const acUnits = order.AcDetails.map(ac => ({
                type: ac.ac_type,
                model: ac.model,
                quantity: ac.quantity,
                OrderId: ac._id
              }));

              const address = order.customer_shipping_address.length > 0
                ? `${order.customer_shipping_address[0].address_line1}, ${order.customer_shipping_address[0].address_line2 || ''}, ${order.customer_shipping_address[0].city}, ${order.customer_shipping_address[0].state}, ${order.customer_shipping_address[0].pincode}`
                : 'Address not available';

              const paymentStatusColor = Number(order.PaymentStatus) < Number(order.materialTotalAmount)  ? "bg-green-200 text-green-800" : "bg-red-100 text-red-800";
              const paymentStatusText = Number(order.PaymentStatus) < Number(order.materialTotalAmount) ? "Payment Completed" : "Payment Pending";


              return (
                <tr key={order._id}>
                  <td className="p-2 border-b border-blue-gray-50 text-sm">{order.customer.customer_id}</td>
                  <td className="p-2 border-b border-blue-gray-50 text-sm whitespace-pre-line">
                    {order.customer_shipping_address[0]?.contactPerson || ''} <br />
                    {order.customer_shipping_address[0]?.contactNumber || ''}
                  </td>
                  <td className="p-2 border-b border-blue-gray-50 text-sm">
                    <span className={`inline-block px-2 py-1 font-sans text-xs font-bold rounded shadow-md ${paymentStatusColor}`}>
                      {paymentStatusText}
                    </span>
                  </td>
                  <td className="p-2 border-b border-blue-gray-50 text-sm">{order.customer.name}</td>
                  <td className="p-2 border-b border-blue-gray-50 text-sm whitespace-normal w-40">
                    {address}
                  </td>
                  <td className="p-2 border-b border-blue-gray-50 text-sm">
                    {new Date(order.OrderDate).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                  </td>
                  <td className="p-2 border-b border-blue-gray-50 text-sm relative dropdown-container">
                    <button 
                      onClick={(e) => toggleDropdown(order._id, e)}
                      className={`text-white bg-blue-700 focus:ring-4 focus:outline-none font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center`}
                    >
                      Action
                      <svg className="w-2.5 h-2.5 ms-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4"/>
                      </svg>
                    </button>

                    <MoveToInstallation 
                      isOpen={isInstallationDialogOpen}
                      onClose={() => {
                        setIsInstallationDialogOpen(false);
                        setSelectedOrderId(null);
                      }}
                      onConfirm={handleMoveToInstallation}
                      title="Are you sure you want to move this task to Installation?"
                      description={`Moving order ${order.customer.customer_id} to Installation`}
                    />

                    {openDropdownId === order._id && (
                      <div className="z-10 bg-white divide-y divide-gray-100 rounded-lg shadow w-44 absolute ml-[-2vw]">
                        <ul className="py-2 text-sm text-gray-700" aria-labelledby="dropdownDefaultButton">
                          <li>
                            <PipingAssignTask 
                              addressDisplay={`${order.customer_shipping_address[0].address_line1} ${order.customer_shipping_address[0].address_line2} ${order.customer_shipping_address[0].city} ${order.customer_shipping_address[0].state}`}
                              preOrderId={order.PreOrderId} 
                              clientName={order.customer.name}
                              clientNumber={order.customer.mobile}
                              description=''
                              complaintRaised=''
                              customerComplaint=''
                              contactName={order.customer_shipping_address[0].contactPerson}
                              contactNumber={order.customer_shipping_address[0].contactNumber}
                              ac_units={acUnits}
                            />
                          </li>
                          <li>
                            <button
                                className="block px-4 py-2 hover:bg-gray-100 w-full text-left border-1 border-gray-200"
                                onClick={() => {
                                  setSelectedOrderId(order._id);
                                  setIsInstallationDialogOpen(true);
                                  setOpenDropdownId(null); 
                                }}
                              >
                                Move to Installation
                            </button>
                          </li>
                        </ul>
                      </div>
                    )}
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

export default OpenPiping;
