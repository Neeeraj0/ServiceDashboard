"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { ACUnit, Order } from "@/types/breakdown/Order";
import { ShippingAddress } from "@/types/breakdown/ShippingAddress";
import AssignTask from "../Dialogs/AssignTask";
import "./module.style.css";
import Papa from "papaparse";

const OpenBreakdown = () => {
  let [backendData, setBackendData] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [shippingAddresses, setShippingAddresses] = useState<ShippingAddress[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Number of items per page
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [showAnimation, setShowAnimation] = useState(false);
  const [hasAssignAccess, setHasAssignAccess] = useState(true);

  //check token
  useEffect(() => {
    const checkUserAccess = () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          }).join(''));
          
          const decodedToken = JSON.parse(jsonPayload);
          
          setHasAssignAccess(decodedToken.role !== "viewAccess");
        } catch (err) {
          console.error("Error decoding token:", err);
          setHasAssignAccess(false); // Default to no access if token is invalid
        }
      }
    };

    checkUserAccess();
  }, []);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await axios.get("https://production.circolife.vip/api/query/queries/all", {
          headers: {
            "Content-Type": "application/json",
          },
        });

        setBackendData(
          res.data.data.map((order: any) => ({
            ...order,
            contactperson: order.contactperson || "N/A",
            contactnumber: order.contactnumber || "N/A",
            subject: order.subject || "N/A",
            deviceid: order.deviceid || "N/A",
            orderModels: order.orderModels || [],
          }))
        );
      } catch (err: any) {
        console.error("Error fetching data: ", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  // Transform orderModels to ACUnit array
  const transformOrderModels = (orderModels: (string | number | null)[]): ACUnit[] => {
    const acUnits: ACUnit[] = [];
    for (let i = 0; i < orderModels.length; i += 2) {
      const model = orderModels[i] as string;
      const quantity = (orderModels[i + 1] as number) || 1;
      if (model && model !== "Select Device") {
        acUnits.push({ model, quantity });
      }
    }
    return acUnits;
  };

  useEffect(() => {
    const fetchShippingAddresses = async () => {
      try {
        const loginResponse = await axios.post(
          "https://testing.backend.summary.circolife.vip/api/login",
          {
            email: "admin@gmail.com",
            password: "admin@123",
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        const token = loginResponse.data.token;
        console.log("token", token);

        const res = await axios.get("https://testing.backend.summary.circolife.vip/api/summary/address", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        setShippingAddresses(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchShippingAddresses();
  }, []);

  const getShippingAddress = (orderId: string) => {
    const address = shippingAddresses.find((address) => address._id === orderId);
    return address?.customerData?.shipping_address[0] || null;
  };

  console.log("shipping address", shippingAddresses);

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return (
      <div className="flex flex-col text-sm">
        <span>{date.toLocaleDateString()}</span>
        <span>{date.toLocaleTimeString()}</span>
      </div>
    );
  };

  const downloadCSV = () => {
    setShowAnimation(true);
    const csvData = backendData.map((order) => ({
      "Task ID": order._id,
      "Contact Person": order.contactperson,
      "Contact Number": order.contactnumber,
      "Issue Reported": order.subject,
      "Customer Address": shippingAddresses.find((address) => address._id === order._id)
        ?.customerData?.shipping_address[0]?.line1 || "N/A",
      "Date": new Date(order.TimeStamp).toLocaleString(),
      "Device ID": order.deviceid,
    }));

    // Generate and download CSV
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    setTimeout(() => {
      link.download = "complaints.csv";
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }, 2000)
    // Hide animation after 5 seconds
    setTimeout(() => {
      setShowAnimation(false);
    }, 5000);
  };

  const indexOfLastOrder = currentPage * itemsPerPage;
  const indexOfFirstOrder = indexOfLastOrder - itemsPerPage;
  backendData =backendData.filter(
    (order) => !order.queryStatus && order.status === true
  );
  const currentOrders = backendData.slice(indexOfFirstOrder, indexOfLastOrder);

  const handleTaskAssigned = (id: string) => {
    setRemovingId(id); // Start fade-out animation
    setTimeout(() => {
      setBackendData((prevData) => prevData.filter((task) => task._id !== id));
      setRemovingId(null); // Clear the `removingId` after removal
    }, 500); // Match animation duration
  };

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error fetching data: {error}</div>;

  return (
    <div className="overflow-x-auto">
      {showAnimation && (
        <div className="animation-overlay">
          <img src={'/images/illustration/Animation - 1734419092020.gif'} alt="Loading..." className="animation-gif" />
        </div>
      )}
      <div className="flex absolute justify-end w-full mt-[-2vh] lg:mt-[-5vh] ml-[-5vw]">
        <button
          onClick={downloadCSV}
          className="px-4 py-2 bg-green-500 text-white font-bold shadow-xl rounded hover:bg-green-600"
        >
          Download to Excel 📊
        </button>
      </div>

      <table className="w-full text-left table-auto min-w-max mt-10">
        <thead>
          <tr>
            <th className="p-4 border-y border-blue-gray-100 bg-blue-gray-50/50 text-sm">Task ID</th>
            <th className="p-4 border-y border-blue-gray-100 bg-blue-gray-50/50 text-sm">Contact Person</th>
            <th className="p-4 border-y border-blue-gray-100 bg-blue-gray-50/50 text-sm">Customer Details</th>
            <th className="p-4 border-y border-blue-gray-100 bg-blue-gray-50/50 text-sm">Issue Reported</th>
            <th className="p-4 border-y border-blue-gray-100 bg-blue-gray-50/50 text-sm">Customer Address</th>
            <th className="p-4 border-y border-blue-gray-100 bg-blue-gray-50/50 text-sm">Date</th>
            <th className="p-4 border-y border-blue-gray-100 bg-blue-gray-50/50 text-sm">Device ID</th>
            {hasAssignAccess && <th className="p-4 border-y border-blue-gray-100 bg-blue-gray-50/50 text-sm">Assign Task</th>}
          </tr>
        </thead>
        <tbody>
          {currentOrders.length === 0 ? (
            <tr>
              <td colSpan={8} className="text-center">
                No tasks available
              </td>
            </tr>
          ) : (
            currentOrders.map((order, index) => {
              const shippingAddress = getShippingAddress(order._id);
              console.log("shipping address", shippingAddress);
              const addressDisplay = shippingAddress
                ? `${shippingAddress.line1}, ${shippingAddress.line2 || ""}, ${shippingAddress.city}, ${shippingAddress.state}, ${shippingAddress.pincode}`
                : "N/A";

              return (
                <tr key={order._id} className={removingId === order._id ? "fade-out" : ""}>
                  <td className="p-2 border-b border-blue-gray-50 text-sm">{index + 1}</td>
                  <td className="p-2 border-b border-blue-gray-50 text-sm max-w-50">
                    {order.contactperson} <br /> {order.contactnumber}
                  </td>
                  <td className="p-2 border-b border-blue-gray-50 text-sm max-w-50">
                    {order.contactperson} <br /> {order.contactnumber}
                  </td>
                  <td className="p-2 border-b border-blue-gray-50 text-sm">{order.subject}</td>
                  <td className="p-2 border-b border-blue-gray-50 text-wrap max-w-50">{addressDisplay}</td>
                  <td className="p-2 border-b border-blue-gray-50 text-wrap text-sm flex-wrap">
                    {formatDate(order.TimeStamp)}
                  </td>
                  <td className="p-2 border-b border-blue-gray-50 text-sm max-w-50">
                    {order.deviceid && order.deviceid !== "Select Device" ? order.deviceid : "N/A"}
                  </td>
                  {hasAssignAccess && (
                  <td className="p-2 border-b border-blue-gray-50 mt-[5vh] text-sm">
                    <AssignTask
                      orderId={order._id}
                      clientName={order.contactperson}
                      clientNumber={order.contactnumber}
                      description={order.summery}
                      complaintRaised={order.TimeStamp}
                      customerComplaint={order.subject}
                      addressDisplay={addressDisplay}
                      ac_units={
                        Array.isArray(order.orderModels) && typeof order.orderModels[0] === "string"
                          ? transformOrderModels(order.orderModels as (string | number | null)[])
                          : (order.orderModels as ACUnit[])
                      }
                      onTaskAssigned={handleTaskAssigned} 
                    />
                  </td>
                  )}
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {/* Pagination Controls */}
      <Pagination
        totalPages={Math.ceil(backendData.length / itemsPerPage)}
        currentPage={currentPage}
        paginate={paginate}
      />
    </div>
  );
};

const Pagination = ({
  totalPages,
  currentPage,
  paginate,
}: {
  totalPages: number;
  currentPage: number;
  paginate: (page: number) => void;
}) => {
  const visiblePages = 5; // Number of pages to display
  const pages = [];

  const startPage = Math.max(currentPage - Math.floor(visiblePages / 2), 1);
  const endPage = Math.min(startPage + visiblePages - 1, totalPages);

  const adjustedStart = Math.max(endPage - visiblePages + 1, 1);

  for (let i = adjustedStart; i <= endPage; i++) {
    pages.push(
      <button
        key={i}
        onClick={() => paginate(i)}
        className={`pagination-button ${currentPage === i ? "active" : ""}`}
      >
        {i}
      </button>
    );
  }

  return (
    <div className="pagination">
      <button
        className="pagination-button"
        onClick={() => paginate(1)}
        disabled={currentPage === 1}
      >
        First
      </button>
      <button
        className="pagination-button"
        onClick={() => paginate(currentPage - 1)}
        disabled={currentPage === 1}
      >
        Previous
      </button>

      {pages}

      <button
        className="pagination-button"
        onClick={() => paginate(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Next
      </button>
      <button
        className="pagination-button"
        onClick={() => paginate(totalPages)}
        disabled={currentPage === totalPages}
      >
        Last
      </button>
    </div>
  );
};

export default OpenBreakdown;
