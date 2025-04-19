"use client";

import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { ACUnit, Order } from "@/types/breakdown/Order";
import { ShippingAddress } from "@/types/breakdown/ShippingAddress";
import "./module.style.css";
import Papa from "papaparse";
import SearchBox from "../SearchBox/SearchBox";
import Pagination from "../Pagination";
import DropdownDefaultTwo from "../Dropdowns/DropdownDefaultTwo";
import { useRefresh } from "@/app/context/RefreshContext";
import toast from "react-hot-toast";
import Loader from "../common/Loader";
import FilterDrawer from "../Filters/Filters";
import { useRouter } from 'next/navigation';

interface OpenBreakdownProps {
  onLoadingComplete?: () => void;
}

const OpenBreakdown: React.FC<OpenBreakdownProps> = ({ onLoadingComplete }) => {
  const [backendData, setBackendData] = useState<Order[]>([]);
  const [originalData, setOriginalData] = useState<Order[]>([]);
  const [filteredData, setFilteredData] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [shippingAddresses, setShippingAddresses] = useState<ShippingAddress[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Number of items per page
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [showAnimation, setShowAnimation] = useState(false);
  const [hasAssignAccess, setHasAssignAccess] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { triggerRefresh, refreshKey } = useRefresh();
  const router = useRouter();
  // Check token
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
        // const res = await axios.get("https://production.circolife.vip/api/query/queries/all", {
          const res = await axios.get("http://app.dev.circolife.vip/api/query/queries/all", {
          headers: {
            "Content-Type": "application/json",
          },
        });

        const fetchedData = res.data.allQueries.map((order: any) => ({
          ...order,
          contactperson: order.contactperson || "N/A",
          contactnumber: order.contactnumber || "N/A",
          subject: order.subject || "N/A",
          summary: order.summery || "N/A",
          address: [
            order.flat || '',
            order.area || '',
            order.address || '',
            order.city || '',
            order.state || '',
            order.pincode || ''
        ]
            .filter(part => part.trim() !== '') // Remove empty parts
            .join(', ') || "N/A", // Join non-empty parts with a comma
          deviceid: order.deviceid || "N/A",
          orderModels: order.orderModels || [],
        }));

        setBackendData(fetchedData);
        setOriginalData(fetchedData);
        setFilteredData(fetchedData);
        
      } catch (err: any) {
        console.error("Error fetching data: ", err);
        setError(err.message);
      } finally {
        setLoading(false);
        onLoadingComplete?.();
      }
    };

    fetchTasks();
  }, [onLoadingComplete, refreshKey]);

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

  // useEffect(() => {
  //   const fetchShippingAddresses = async () => {
  //     try {
  //       const loginResponse = await axios.post(
  //         "https://testing.backend.summary.circolife.vip/api/login",
  //         {
  //           email: "admin@gmail.com",
  //           password: "admin@123",
  //         },
  //         {
  //           headers: {
  //             "Content-Type": "application/json",
  //           },
  //         }
  //       );

  //       const token = loginResponse.data.token;

  //       const res = await axios.get("https://testing.backend.summary.circolife.vip/api/summary/address", {
  //         headers: {
  //           Authorization: `Bearer ${token}`,
  //           "Content-Type": "application/json",
  //         },
  //       });

  //       setShippingAddresses(res.data);
  //     } catch (err) {
  //       console.error(err);
  //     }
  //   };

  //   fetchShippingAddresses();
  // }, []);

  const getShippingAddress = (orderId: string) => {
    const address = shippingAddresses.find((address) => address._id === orderId);
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

  const downloadCSV = () => {
    setShowAnimation(true);
    const csvData = filteredData
      .filter(order => !order.queryStatus && order.status === true)
      .map((order) => ({
        "Task ID": order._id,
        "Contact Person": order.contactperson,
        "Contact Number": order.contactnumber,
        "Issue Reported": order.subject,
        "Actual Address": order?.address,
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

  // Filter active orders and apply search query
  const activeOrders = filteredData.filter(
    (order) => !order.queryStatus && order.status === true
  );
  
  const searchFilteredOrders = activeOrders.filter((order) =>
    order.contactperson.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get current page items
  const indexOfLastOrder = currentPage * itemsPerPage;
  const indexOfFirstOrder = indexOfLastOrder - itemsPerPage;
  const currentOrders = searchFilteredOrders.slice(
    indexOfFirstOrder,
    indexOfLastOrder
  );

  const handleTaskAssigned = (id: string) => {
    setRemovingId(id); // Start fade-out animation
    setTimeout(() => {
      setFilteredData((prevData) => prevData.filter((task) => task._id !== id));
      setBackendData((prevData) => prevData.filter((task) => task._id !== id));
      setRemovingId(null); // Clear the `removingId` after removal
    }, 500); // Match animation duration
  };

  const handleMarkAsResolved = (id: string) => {
    setRemovingId(id); 
    console.log("Marking as resolved...", id);
  
    setTimeout(() => {
      const updateData = (prevData: Order[]) =>
        prevData.map((task) =>
          task._id === id ? { ...task, status: false } : task
        ).filter((task) => task.status !== false);
      
      setFilteredData(updateData);
      setBackendData(updateData);
      setRemovingId(null); 
    }, 500); 
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handleRefresh = () => {
    toast.success('Data refreshing...');
    triggerRefresh();
  }

  const handleRaiseQuery = () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      toast.error('Authentication required');
      return;
    }
    
    const queryURL = new URL('https://devquerys.circolives.in');
    // const queryURL = new URL('http://192.168.0.111:5174/');
    queryURL.searchParams.append('from', "service");
    queryURL.searchParams.append('auth', token);
    window.location.href = queryURL.toString();
  };

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  if (loading) return <Loader />;
  if (error) return <div>Error fetching data: {error}</div>;

  return (
    <>
      <div className="top-0 bg-white z-20 flex items-center justify-between mb-4">
        <div className="flex-grow">
          <SearchBox 
            placeholder="Search by customer name"
            value={searchQuery}
            onChange={setSearchQuery} 
          />
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-2 ml-auto">
          <div className="relative group inline-block w-full sm:w-auto mb-2 sm:mb-0">
            <button className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-[#A14996] border border-[#A14996] rounded-lg hover:bg-[#f9f0f9] w-full sm:w-auto" onClick={handleRaiseQuery}>
              {/* <img src="/images/task/raiseQuery.png" width={30} height={30} alt="Query icon" /> */}
              Raise A Query
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleRefresh}
              className="p-2 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200"
              title="Refresh data"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 4v6h-6"/>
                <path d="M1 20v-6h6"/>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
              </svg>
            </button>

            <FilterDrawer
              originalData={originalData}
              setFilteredData={setFilteredData}
              shippingAddresses={shippingAddresses}
            />
          </div>
</div>
      </div>
    <div className="overflow-x-auto">

      {showAnimation && (
        <div className="animation-overlay">
          <img src={'/images/illustration/Animation - 1734419092020.gif'} alt="Loading..." className="animation-gif" />
        </div>
      )}

      <table className="w-full text-left table-auto min-w-max mt-10">
        <thead>
          <tr>
            <th className="p-4 border-y border-blue-gray-100 bg-blue-gray-50/50 text-sm">Task ID</th>
            <th className="p-4 border-y border-blue-gray-100 bg-blue-gray-50/50 text-sm">Contact Person</th>
            <th className="p-4 border-y border-blue-gray-100 bg-blue-gray-50/50 text-sm">Customer Details</th>
            <th className="p-4 border-y border-blue-gray-100 bg-blue-gray-50/50 text-sm">Issue Reported</th>
            <th className="p-4 border-y border-blue-gray-100 bg-blue-gray-50/50 text-sm">Issue Description</th>
            <th className="p-4 border-y border-blue-gray-100 bg-blue-gray-50/50 text-sm">Customer Address</th>
            <th className="p-4 border-y border-blue-gray-100 bg-blue-gray-50/50 text-sm">Date</th>
            <th className="p-4 border-y border-blue-gray-100 bg-blue-gray-50/50 text-sm">Device ID</th>
            {hasAssignAccess && <th className="p-4 border-y border-blue-gray-100 bg-blue-gray-50/50 text-sm">Assign Task</th>}
          </tr>
        </thead>
        <tbody>
          {currentOrders.length === 0 ? (
            <tr>
              <td colSpan={8} className="p-4 text-center text-gray-500">
                No tasks available. Try adjusting your search or filters.
              </td>
            </tr>
          ) : (
            currentOrders.map((order, index) => {
              const shippingAddress = getShippingAddress(order._id);
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
                  <td className="p-2 border-b border-blue-gray-50 text-sm max-w-50">
                    {order.subject}
                  </td>
                  <td className="p-2 border-b border-blue-gray-50 text-sm max-w-50">
                    {order.summary}
                  </td>
                  <td className="p-2 border-b border-blue-gray-50 text-wrap max-w-50">
                    {(order.address !== "N/A" && order.address !== "Not Available") ? order?.address : addressDisplay}
                  </td>
                  <td className="p-2 border-b border-blue-gray-50 text-wrap text-sm flex-wrap">
                    {formatDate(order.TimeStamp)}
                  </td>
                  <td className="p-2 border-b border-blue-gray-50 text-sm max-w-50">
                    {order.deviceid && order.deviceid !== "Select Device" ? order.deviceid : "N/A"}
                  </td>
                  {hasAssignAccess && (
                  <td className="p-2 border-b border-blue-gray-50 mt-[5vh] text-sm">
                    <DropdownDefaultTwo 
                       orderId={order._id} 
                       order={order}
                       getShippingAddress={getShippingAddress} 
                       transformOrderModels={transformOrderModels} 
                       onTaskAssigned={handleTaskAssigned} 
                       onResolved={handleMarkAsResolved}
                    />
                  </td>
                  )}
                </tr>
              );
            })
          )}
        </tbody>
      </table>

    </div>
    <Pagination
      currentPage={currentPage}
      totalItems={searchFilteredOrders.length}
      itemsPerPage={itemsPerPage}
      paginate={paginate}
    />
    </>
  );
};

export default OpenBreakdown;