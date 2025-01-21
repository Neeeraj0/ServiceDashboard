"use client"

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import PipingAssignTask from '../Dialogs/PipingAssignTask';
import MoveToInstallation from '../Dialogs/MoveToInstallation';
import AssignInstallation from '../Dialogs/AssignInstallation';
import AssignSetup from '../Dialogs/AssignSetup';

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
    contactPerson: string;
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
    addressId: string;
    contactPerson: string;
    contactNumber: string;
  };
  paidamount: number;
  orderingStatus: boolean;
  paymentStatusFullPayment: string;
  paymentStatusToken: string;
  preOrdertimestamp: string;
  DateofSiteSurvey: string;
  DateofInstallation: string;
}

interface SiteSurveyDetail {
  _id: string;
  PreOrderId: string;
}

// Updated interface to match the new data structure
interface InstallationTask {
  _id: string;
  title: string;
  description: string;
  status: string;
  taskType: string;
  task_id: string;
  client_name: string;
  client_number: string;
  address: { location: string }[];
  ac_units: {
    type: string;
    capacity: string;
    quantity: number;
    model: string;
    orderId: string;
  }[];
  servicingDate: string;
  assignedDate: string;
  quantity: number;
  contactPerson: {
    name: string;
    phone_number: string;
  };
  assignedTechnicians: string[];
}

const OpenSetup = () => {
  let [preorderData, setPreorderData] = useState<PreorderResponse[]>([]);
  const [siteSurveyDetails, setSiteSurveyDetails] = useState<SiteSurveyDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PreorderResponse | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  let [installationTasks, setInstallationTasks] = useState<InstallationTask[]>([]);
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; 

  useEffect(() => {
    const fetchPreorderData = async () => {
      try {
        const res1 = await axios.get(`${process.env.NEXT_PUBLIC_SALES_BACKEND_API}/api/preOrder/getall/preorders`);
        // const res = await axios.get('https://salestrackbackend.circolife.vip/api/preOrder/getall/preorders');
        const res2 = await axios.get(`${process.env.NEXT_PUBLIC_SERVICE_BACKEND_API}/api/setup`);
        const filteredTasks = res1.data.filter((task1: any) => 
          !res2.data.some((task2: any) => task1._id === task2.preOrderId)
        );
        setPreorderData(filteredTasks);
      } catch (err: any) {
        console.error("Error fetching preorder data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPreorderData();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>No Records found: {error}</div>;


  const modelToTonnage = {
    "10": "1T",
    "15": "1.5T",
    "20": "2T",
    "30": "3T",
  };

  const formatACDetails = (acDetails: PreorderResponse['AcDetails']) => {
    const groupedDetails: Record<string, string[]> = {};
  
    acDetails.forEach((ac) => {
      const tonnage = modelToTonnage[ac.model as keyof typeof modelToTonnage] || ac.model;
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

  const openModal = (order: PreorderResponse) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    console.log('function called');
    setIsModalOpen(false);
    setSelectedOrder(null);
  };

  const handleTaskAssigned = (id: string) => {
    setRemovingId(id); // Start fade-out animation

    console.log("inside the handle task assigned function", id);
    setTimeout(() => {
      setPreorderData((prevData) => prevData.filter((task) => task._id !== id));
      setRemovingId(null); 
    }, 300); // Match animation duration
  };

  preorderData = preorderData.filter((order) => order.orderingStatus);

  // Calculate the current orders to display
  const indexOfLastOrder = currentPage * itemsPerPage;
  const indexOfFirstOrder = indexOfLastOrder - itemsPerPage;
  const currentOrders = preorderData.slice(indexOfFirstOrder, indexOfLastOrder);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const transformAcDetailsToAcUnits = (acDetails: PreorderResponse['AcDetails']) =>
    acDetails.map((ac) => ({
      type: ac.ac_type,
      capacity: ac.model, // Assuming 'model' is equivalent to 'capacity'
      quantity: ac.quantity,
      model: "",
      orderId: ac?._id,
    }));

  return (
    <div>
      <table className="w-full text-left table-auto min-w-max">
        <thead>
          <tr>
            <th className="p-4 border-y border-blue-gray-100 bg-blue-gray-50/50 text-sm">Task ID</th>
            <th className="p-4 border-y border-blue-gray-100 bg-blue-gray-50/50 text-sm">Contact Person</th>
            <th className="p-4 border-y border-blue-gray-100 bg-blue-gray-50/50 text-sm">Customer Details</th>
            <th className="p-4 border-y border-blue-gray-100 bg-blue-gray-50/50 text-sm">AC Details</th>
            <th className="p-4 border-y border-blue-gray-100 bg-blue-gray-50/50 text-sm">Customer Address</th>
            <th className="p-4 border-y border-blue-gray-100 bg-blue-gray-50/50 text-sm max-w-40">Date of Installation</th>
            <th className="p-4 border-y border-blue-gray-100 bg-blue-gray-50/50 text-sm">Action</th>
          </tr>
        </thead>
        <tbody>
          {preorderData.length === 0 ? (
            <tr>
              <td colSpan={9} className="text-center">No preorders available</td>
            </tr>
          ) : (
            currentOrders.map((order, index) => {
              const serialNumber =  indexOfFirstOrder + index + 1; // Calculate serial number
              const acUnits = transformAcDetailsToAcUnits(order.AcDetails);


              const address = `${order.customer_shipping_address.address_line1}, ${order.customer_shipping_address.address_line2 || ''}, ${order.customer_shipping_address.city}, ${order.customer_shipping_address.state}, ${order.customer_shipping_address.pincode}`;

              return (
                <tr key={order._id} className={removingId === order._id ? "fade-out" : ""} >
                  {/* <td className="p-2 border-b border-blue-gray-50 text-sm">{order.customer.customer_id}</td>
                   */}
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
                    {`${address}`}
                  </td>
                  <td className="p-2 border-b border-blue-gray-50 text-sm">
                    { order.DateofSiteSurvey ? new Date(order.DateofSiteSurvey).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    }) : (
                      "Not Provided"
                    )}
                  </td>
                  <td className="p-2 border-b border-blue-gray-50 text-sm relative dropdown-container">
                    <AssignSetup
                                          preOrderId={order._id}
                                          clientName={order.customer.name}
                                          clientNumber={order.customer.mobile}
                                          description={"Setup Installation"}
                                          addressDisplay={order.customer_shipping_address.address_line1 + order.customer_shipping_address.address_line2}
                                          ac_units={acUnits}
                                          contactNumber={order?.customer_shipping_address?.contactNumber}
                                          contactName={order?.customer_shipping_address?.contactPerson}
                                          onTaskAssigned={handleTaskAssigned} 
                      />
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      <div className="pagination">
        <button
          className={`pagination-button ${currentPage === 1 ? 'disabled' : ''}`}
          onClick={() => paginate(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </button>
        {Array.from({ length: Math.ceil(preorderData.length / itemsPerPage) }, (_, index) => (
          <button
            key={index + 1}
            onClick={() => paginate(index + 1)}
            className={`pagination-button ${currentPage === index + 1 ? 'active' : ''}`}
          >
            {index + 1}
          </button>
        ))}
        <button
          className={`pagination-button ${currentPage === Math.ceil(preorderData.length / itemsPerPage) ? 'disabled' : ''}`}
          onClick={() => paginate(currentPage + 1)}
          disabled={currentPage === Math.ceil(preorderData.length / itemsPerPage)}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default OpenSetup;