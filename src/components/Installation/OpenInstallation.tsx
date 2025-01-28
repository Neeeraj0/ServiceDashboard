import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import './module.style.css'
import AssignInstallation from '../Dialogs/AssignInstallation';

interface PreorderResponse {
  _id: string;
  customer: {
    customer_id: string;
    name: string;
    email: string;
    mobile: string;
  };
  superAdmin: string;
  brandName: string;
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
  material_totalAmount: number;
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
  };
  customer_billing_address: {
    gst_number: string;
    address_line1: string;
    address_line2: string;
    pincode: string;
    city: string;
    country: string;
    state: string;
  };
  orderingStatus: boolean;
  preOrdertimestamp: string;
  paidamount: number;
  DateofSiteSurvey?: string;
  DateofInstallation?: string;
  TimeofInstallation?: string;
}

interface SiteSurveyDetail {
  _id: string;
  PreOrderId: string;
}

const OpenInstallation = () => {
  const [allPreorderData, setAllPreorderData] = useState<PreorderResponse[]>([]);
  const [filteredPreorders, setFilteredPreorders] = useState<PreorderResponse[]>([]);
  const [siteSurveyDetails, setSiteSurveyDetails] = useState<SiteSurveyDetail[]>([]);
  const [assignedTasks, setAssignedTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const itemsPerPage = 10;

  const modelToTonnage: { [key: string]: string } = {
    "S10": "1T",
    "S15": "1.5T",
    "S20": "2T",
    "S30": "3T",
  };

  const fetchData = async () => {
    try {
      const [preordersRes, assignedTasksRes] = await Promise.all([
        axios.get('https://salestrackbackend.circolife.vip/api/preOrder/getall/preorders', {
          headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_SALES_BACKEND_TOKEN}`,
          },
        }),
        axios.get(`${process.env.NEXT_PUBLIC_SERVICE_BACKEND_API}/api/installation/getAssigned`),
      ]);
  
      // Filter orders where orderingStatus is true
      const ordersWithOrderingStatus = preordersRes.data.filter(
        (order: PreorderResponse) => order.orderingStatus === true
      );
  
      // Extract assigned task `preOrderId` for filtering
      const assignedPreorderIds = new Set(
        assignedTasksRes.data.map((task: { preOrderId: string }) => task.preOrderId)
      );
  
      // Filter orders that are not assigned
      const unassignedOrders = ordersWithOrderingStatus.filter(
        (order: PreorderResponse) => !assignedPreorderIds.has(order._id)
      );
  
      setAllPreorderData(ordersWithOrderingStatus);
      setAssignedTasks(assignedTasksRes.data);
      setFilteredPreorders(unassignedOrders);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };  

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const assignedPreorderIds = new Set(
      assignedTasks.map((task: { preOrderId: string }) => task.preOrderId)
    );
  
    const unassignedOrders = allPreorderData.filter(
      (order: PreorderResponse) => !assignedPreorderIds.has(order._id)
    );
    
    // Apply search filter
    const searchFiltered = unassignedOrders.filter(order => 
      order.customer.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  
    setFilteredPreorders(searchFiltered);
    setCurrentPage(1); // Reset to first page when search changes
  }, [allPreorderData, assignedTasks, searchQuery]);

  const formatACDetails = (acDetails: PreorderResponse['AcDetails']) => {
    const groupedDetails: Record<string, string[]> = {};
  
    acDetails.forEach((ac) => {
      const tonnage = modelToTonnage[ac.model] || ac.model;
      const formattedAC = `${tonnage} (${ac.quantity})`;
  
      if (!groupedDetails[ac.ac_type]) {
        groupedDetails[ac.ac_type] = [];
      }
      groupedDetails[ac.ac_type].push(formattedAC);
    });
  
    return Object.entries(groupedDetails)
      .map(([type, details]) => `${type}: ${details.join(', ')}`)
      .join('\n');
  };

  const handleTaskAssigned = useCallback((id: string) => {
    setRemovingId(id);
    setTimeout(() => {
      setFilteredPreorders(prev => prev.filter(task => task._id !== id));
      setRemovingId(null);
    }, 300);
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>No Records found: {error}</div>;

  const indexOfLastOrder = currentPage * itemsPerPage;
  const indexOfFirstOrder = indexOfLastOrder - itemsPerPage;
  const currentOrders = filteredPreorders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(filteredPreorders.length / itemsPerPage);

  const paginate = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  return (
    <div>
        <div className="flex m-5 rounded-md border-2 border-[#A14996] overflow-hidden w-[fit-content] p-2 justify-start">
        <input
            type="text"
            className="outline-none focus:outline-none border-none focus:ring-0 bg-transparente"
            placeholder="Search by customer name"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        <button type='button' className="flex items-center justify-center bg-[#A14996] px-5 rounded-xl">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192.904 192.904" width="16px" className="fill-white">
            <path
              d="m190.707 180.101-47.078-47.077c11.702-14.072 18.752-32.142 18.752-51.831C162.381 36.423 125.959 0 81.191 0 36.422 0 0 36.423 0 81.193c0 44.767 36.422 81.187 81.191 81.187 19.688 0 37.759-7.049 51.831-18.751l47.079 47.078a7.474 7.474 0 0 0 5.303 2.197 7.498 7.498 0 0 0 5.303-12.803zM15 81.193C15 44.694 44.693 15 81.191 15c36.497 0 66.189 29.694 66.189 66.193 0 36.496-29.692 66.187-66.189 66.187C44.693 147.38 15 117.689 15 81.193z">
            </path>
          </svg>
        </button>
      </div>
      <table className="w-full text-left table-auto min-w-max">
        <thead>
          <tr>
            <th className="p-4 border-y border-blue-gray-100 bg-blue-gray-50/50 text-sm">Task ID</th>
            <th className="p-4 border-y border-blue-gray-100 bg-blue-gray-50/50 text-sm">Contact Person</th>
            <th className="p-4 border-y border-blue-gray-100 bg-blue-gray-50/50 text-sm">Customer Details</th>
            <th className="p-4 border-y border-blue-gray-100 bg-blue-gray-50/50 text-sm">AC Details</th>
            <th className="p-4 border-y border-blue-gray-100 bg-blue-gray-50/50 text-sm">Customer Address</th>
            <th className="p-4 border-y border-blue-gray-100 bg-blue-gray-50/50 text-sm max-w-40">Installation Date & Time</th>
            <th className="p-4 border-y border-blue-gray-100 bg-blue-gray-50/50 text-sm">Action</th>
          </tr>
        </thead>
        <tbody>
          {currentOrders.length === 0 ? (
            <tr>
              <td colSpan={9} className="text-center">No preorders available</td>
            </tr>
          ) : (
            currentOrders.map((order, index) => {
              const serialNumber = indexOfFirstOrder + index + 1;
              const acUnits = order.AcDetails.map(ac => ({
                type: ac.ac_type + " AC",
                capacity: ac.model,
                quantity: ac.quantity
              }));

              const address = `${order.customer_shipping_address.address_line1}, ${order.customer_shipping_address.address_line2 || ''}, ${order.customer_shipping_address.city}, ${order.customer_shipping_address.state}, ${order.customer_shipping_address.pincode}`;

              return (
                <tr key={order._id} className={removingId === order._id ? 'fade-out' : ''}>
                  <td className="p-2 border-b border-blue-gray-50 text-sm">{serialNumber}</td>
                  <td className="p-2 border-b border-blue-gray-50 text-sm">
                    {order.customer_shipping_address.contactPerson && order.customer_shipping_address.contactNumber
                      ? (
                        <>
                          {order.customer_shipping_address.contactPerson} <br />
                          {order.customer_shipping_address.contactNumber}
                        </>
                      )
                      : "N/A"}
                  </td>
                  <td className="p-2 border-b border-blue-gray-50 text-sm whitespace-normal w-50">{order.customer.name}</td>
                  <td className="p-2 border-b border-blue-gray-50 text-sm whitespace-pre-line w-40">
                    {formatACDetails(order.AcDetails)}
                  </td>
                  <td className="p-2 border-b border-blue-gray-50 text-sm whitespace-normal w-40">
                    {address}
                  </td>
                  <td className="p-2 border-b border-blue-gray-50 text-sm">
                    {order.DateofInstallation ? new Date(order.DateofInstallation).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    }) : "Not Provided"}
                    {order.TimeofInstallation}
                  </td>
                  <td className="p-2 border-b border-blue-gray-50 text-sm relative dropdown-container">
                    <AssignInstallation 
                      preOrderId={order._id}
                      clientName={order.customer.name}
                      clientNumber={order.customer.mobile}
                      description=""
                      onTaskAssigned={handleTaskAssigned}
                      ac_units={acUnits}
                      addressDisplay={address}
                      contactName={order.customer_shipping_address.contactPerson}
                      contactNumber={order.customer_shipping_address.contactNumber}
                    />
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      <div className="pagination flex flex-wrap justigy-center gap-2">
        <button
          className={`pagination-button ${currentPage === 1 ? 'disabled' : ''}`}
          onClick={() => paginate(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </button>
        {Array.from({ length: totalPages }, (_, index) => (
          <button
            key={index + 1}
            onClick={() => paginate(index + 1)}
            className={`pagination-button ${currentPage === index + 1 ? 'active' : ''}`}
          >
            {index + 1}
          </button>
        ))}
        <button
          className={`pagination-button ${currentPage === totalPages ? 'disabled' : ''}`}
          onClick={() => paginate(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default OpenInstallation;