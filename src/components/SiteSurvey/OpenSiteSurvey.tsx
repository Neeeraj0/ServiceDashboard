import React, { useEffect, useState } from 'react';
import axios from 'axios';
import PipingAssignTask from '../Dialogs/PipingAssignTask';
import MoveToInstallation from '../Dialogs/MoveToInstallation';
import './module.style.css'
import SiteSurveyForm from './SiteSurveyForm/SiteSurveyForm';

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
  orderingStatus: boolean;
  paymentStatusFullPayment: string;
  paymentStatusToken: string;
  preOrdertimestamp: string;
  DateofSiteSurvey: string;
  DateofInstallation: string;
}

const OpenSiteSurvey = () => {
  const [preorderData, setPreorderData] = useState<PreorderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PreorderResponse | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; 

  useEffect(() => {
    const fetchPreorderData = async () => {
      try {
        // const res = await axios.get('http://3.110.115.219:5000/api/preOrder/getall/preorders');
        const res = await axios.get('http://13.201.4.68:8080/api/preOrder/getall/preorders');
        setPreorderData(res.data);
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

  // Calculate the current orders to display
  const indexOfLastOrder = currentPage * itemsPerPage;
  const indexOfFirstOrder = indexOfLastOrder - itemsPerPage;
  const currentOrders = preorderData.slice(indexOfFirstOrder, indexOfLastOrder);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

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
            <th className="p-4 border-y border-blue-gray-100 bg-blue-gray-50/50 text-sm">Date</th>
            <th className="p-4 border-y border-blue-gray-100 bg-blue-gray-50/50 text-sm">Action</th>
          </tr>
        </thead>
        <tbody>
          {preorderData.length === 0 ? (
            <tr>
              <td colSpan={9} className="text-center">No preorders available</td>
            </tr>
          ) : (
            currentOrders.map((order) => {
              const acUnits = order.AcDetails.map(ac => ({
                type: ac.ac_type,
                model: ac.model,
                quantity: ac.quantity
              }));

              const address = `${order.customer_shipping_address.address_line1}, ${order.customer_shipping_address.address_line2 || ''}, ${order.customer_shipping_address.city}, ${order.customer_shipping_address.state}, ${order.customer_shipping_address.pincode}`;

              return (
                <tr key={order._id}>
                  <td className="p-2 border-b border-blue-gray-50 text-sm">{order.customer.customer_id}</td>
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
                    {new Date(order.DateofSiteSurvey).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="p-2 border-b border-blue-gray-50 text-sm relative dropdown-container">
                    <button 
                      onClick={() => openModal(order)}
                      className="text-red-700 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
                    >
                      Mark as Completed
                    </button>
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

      {isModalOpen && (
        <SiteSurveyForm closeModal={closeModal} orderData={selectedOrder} />
      )}
    </div>
  );
};

export default OpenSiteSurvey;