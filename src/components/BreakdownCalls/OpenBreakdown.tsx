"use client";

import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { ACUnit, Order } from "@/types/breakdown/Order";
import { ShippingAddress } from "@/types/breakdown/ShippingAddress";
import AssignTask from "../Dialogs/AssignTask";
import "./module.style.css";
import Papa from "papaparse";
import SearchBox from "../SearchBox/SearchBox";
import issuesList from '../utils/IssuesList';
import DatePicker2 from "../DateFilter/DatePicker2";
import locationPinCodes, { LocationKey } from "@/types/filters/LocationKeys";
import Pagination from "../Pagination";
import DropdownDefaultTwo from "../Dropdowns/DropdownDefaultTwo";
import { useRefresh } from "@/app/context/RefreshContext";
import toast from "react-hot-toast";
import ClickOutside from "../ClickOutside";
import Loader from "../common/Loader";
import { Loader2 } from "lucide-react";

interface OpenBreakdownProps {
  onLoadingComplete?: () => void;
}

const OpenBreakdown: React.FC<OpenBreakdownProps> = ({ onLoadingComplete }) => {
  let [backendData, setBackendData] = useState<Order[]>([]);
  const [originalData, setOriginalData] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [shippingAddresses, setShippingAddresses] = useState<ShippingAddress[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Number of items per page
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [showAnimation, setShowAnimation] = useState(false);
  const [hasAssignAccess, setHasAssignAccess] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [selectedIssues, setSelectedIssues] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedStartDate, setSelectedStartDate] = useState<string | null>(null);
  const [selectedEndDate, setSelectedEndDate] = useState<string | null>(null);
  const filterDropdownRef = useRef<HTMLDivElement>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showIssueFilter, setShowIssueFilter] = useState(false);
  const [showLocationFilter, setShowLocationFilter] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { triggerRefresh, refreshKey } = useRefresh();

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
    let filteredData = originalData;

    if (selectedStartDate || selectedEndDate) {
        filteredData = originalData.filter((order) => {
            const orderDate = new Date(order.TimeStamp).toISOString().split("T")[0]; // Convert to YYYY-MM-DD
            
            if (selectedStartDate && selectedEndDate) {
                return orderDate >= selectedStartDate && orderDate <= selectedEndDate;
            } else if (selectedStartDate) {
                return orderDate === selectedStartDate;
            }
            return true;
        });
    }

    if (selectedIssues.length > 0) {
        filteredData = filteredData.filter((order) => selectedIssues.includes(order.subject));
    }

    if (selectedLocations.length > 0) {
        filteredData = filteredData.filter((order) => {
            const shippingAddress = getShippingAddress(order._id);
            return shippingAddress
                ? selectedLocations.some((location) => locationPinCodes[location as LocationKey]?.includes(shippingAddress.pincode))
                : false;
        });
    }

    setBackendData(filteredData);
}, [selectedStartDate, selectedEndDate, selectedIssues, selectedLocations, originalData]);
 

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await axios.get("https://production.circolife.vip/api/query/queries/all", {
          headers: {
            "Content-Type": "application/json",
          },
        });

        const fetchedData = res.data.data.map((order: any) => ({
          ...order,
          contactperson: order.contactperson || "N/A",
          contactnumber: order.contactnumber || "N/A",
          subject: order.subject || "N/A",
          summary: order.summery || "N/A",
          deviceid: order.deviceid || "N/A",
          orderModels: order.orderModels || [],
        }));

        setBackendData(fetchedData);
        setOriginalData(fetchedData);
        
      } catch (err: any) {
        console.error("Error fetching data: ", err);
        setError(err.message);
      } finally {
        setLoading(false);
        onLoadingComplete?.();
      }
    };

    fetchTasks();
  }, [refreshKey, onLoadingComplete]);

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
  const filteredOrders = backendData.filter((order) =>
    order.contactperson.toLowerCase().includes(searchQuery.toLowerCase())
  );

  let currentOrders = filteredOrders.slice(
    indexOfFirstOrder,
    indexOfLastOrder
  );


  const handleTaskAssigned = (id: string) => {
    setRemovingId(id); // Start fade-out animation
    setTimeout(() => {
      setBackendData((prevData) => prevData.filter((task) => task._id !== id));
      setRemovingId(null); // Clear the `removingId` after removal
    }, 500); // Match animation duration
  };

  const handleMarkAsResolved = (id: string) => {
    setRemovingId(id); 

    console.log("Marking as resolved...", id);
  
    setTimeout(() => {
      setBackendData((prevData) =>
        prevData.map((task) =>
          task._id === id ? { ...task, status: false } : task
        ).filter((task) => task.status !== false) 
      );
      setRemovingId(null); 
    }, 500); 
  };


  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
        setSelectedFilter(null);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const openDatePicker = () => {
    setShowDatePicker(true);
  };

  const closeDatePicker = () => {
    setShowDatePicker(false);
  };

  const openFilterByIssue = () => {
    setShowIssueFilter(true);
  };
  const closeFilterByIssue = () => {
    setShowIssueFilter(false);
    setIsOpen(false);
  }

  const resetDatePicker = () => {
    setSelectedStartDate(null);
    setSelectedEndDate(null);
    setBackendData(originalData);
  };

  const handleIssueSelection = (issue: string) => {
    setSelectedIssues((prevIssues) => {
      if (prevIssues.includes(issue)) {
        return prevIssues.filter((i) => i !== issue);
      } else {
        return [...prevIssues, issue];
      }
    });
  };
  
  const openFilterByLocation = () => {
    setShowLocationFilter(true);
  };
  
  const closeFilterByLocation = () => {
    setSelectedLocations([]);
    setShowLocationFilter(false);
    setIsOpen(false);
    setBackendData(originalData);
  };

  const resetFilterByIssue = () => {
    setSelectedIssues([]);
    setShowIssueFilter(false);
    setIsOpen(false);
    setBackendData(originalData);
  };


  const handleLocationSelection = (location: LocationKey) => {
    setSelectedLocations((prevLocations) => {
      if (prevLocations.includes(location)) {
        return prevLocations.filter((loc) => loc !== location);
      } else {
        return [...prevLocations, location];
      }
    });
  };

  const handleRefresh = () => {
    toast.success('data refreshing...');
    triggerRefresh();
  }

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  if (loading) return (
    <Loader />
  );
  if (error) return <div>Error fetching data: {error}</div>;

  return (
    <div className="overflow-x-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex-grow">
          <SearchBox 
          placeholder="Search by customer name"
          value={searchQuery}
          onChange={setSearchQuery} />
        </div>

        <div className="flex gap-2 ml-auto">
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
          <button
            type="button"
            className="inline-flex w-[fit-content] justify-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 shadow-xs ring-gray-300 ring-inset hover:bg-gray-50"
            onClick={toggleDropdown}
          >
            Filters 🌪️
            <svg
              className="-mr-1 size-5 text-gray-400"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

      {isOpen && (
        <ClickOutside onClick={() => setIsOpen(false)}>
          <div className="absolute right-0 z-10 mt-10 w-56 origin-top-right rounded-md bg-white ring-1 shadow-lg ring-black/5 focus:outline-hidden">
            <div className="py-1">
              <div
                className="flex justify-between items-center px-4 py-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-100"
                onClick={() => setIsOpen(false)}
              >
                Filters <span className="text-red-500 font-bold cursor-pointer">❌</span>
              </div>
              <div
                className="block px-4 py-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-100"
                onClick={openDatePicker}
              >
                Date
              </div>
              <div
                className="block px-4 py-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-100"
                onClick={openFilterByIssue}
              >
                Issue
              </div>
              <div
                className="block px-4 py-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-100"
                onClick={openFilterByLocation}
              >
                Location
              </div>
              <button
                onClick={downloadCSV}
                className="px-4 py-2 bg-green-500 text-white font-bold shadow-xl rounded hover:bg-green-600"
              >
                Download to Excel 📊
              </button>
            </div>
          </div>
        </ClickOutside>
      )}

      {showDatePicker && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 mt-[-60vh]">
          <div className="bg-white rounded-lg shadow-lg p-6 relative w-96">
            <button className="absolute top-2 right-2 text-gray-600 hover:text-red-500 text-lg" onClick={closeDatePicker}>
              ❌
            </button>
            <h2 className="text-lg font-semibold mb-4 text-center">Select Date Range</h2>
            <DatePicker2
              selectedStartDate={selectedStartDate}
              selectedEndDate={selectedEndDate}
              setSelectedStartDate={setSelectedStartDate}
              setSelectedEndDate={setSelectedEndDate}
            />
             <div className="flex justify-center mt-4 space-x-4">
              <button
                className="px-4 py-2 bg-white text-gray-700 font-semibold rounded"
                onClick={resetDatePicker}
              >
                Clear Date
              </button>
              <button
                className="px-4 py-2 bg-blue-500 text-white font-semibold rounded hover:bg-blue-600"
                onClick={closeDatePicker}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

        {showIssueFilter && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 mt-[-30vh]">
            <div className="bg-white rounded-lg shadow-lg p-6 relative w-96">
             <button className="absolute top-2 right-2 text-gray-600 hover:text-red-500 text-lg" onClick={closeFilterByIssue}>
              ❌
            </button>
              <ul className="space-y-2">
                  {issuesList.map((issue, index) => (
                    <li key={index} className="flex items-center">
                      <input
                        type="checkbox"
                        id={issue}
                        checked={selectedIssues.includes(issue)}
                        onChange={() => handleIssueSelection(issue)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor={issue} className="ml-2 text-sm text-gray-700">
                        {issue}
                      </label>
                    </li>
                  ))}
                </ul>
                <div className="flex justify-end mt-3 space-x-2">
                  <button
                    onClick={resetFilterByIssue}
                    className="px-3 py-1 text-sm bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    Reset
                  </button>
                  <button
                    onClick={() => setShowIssueFilter(false)}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Apply
                  </button>
                </div>
              </div>
          </div>
      )}

        {showLocationFilter && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 mt-[-30vh]">
            <div className="bg-white rounded-lg shadow-lg p-6 relative w-96">
              <button className="absolute top-2 right-2 text-gray-600 hover:text-red-500 text-lg" onClick={closeFilterByLocation}>
                ❌
              </button>
              <h2 className="text-lg font-semibold mb-4 text-center">Select Locations</h2>
              <ul className="space-y-2">
              {Object.keys(locationPinCodes).map((location) => (
                <li key={location} className="flex items-center">
                  <input
                    type="checkbox"
                    id={location}
                    checked={selectedLocations.includes(location)}
                    onChange={() => handleLocationSelection(location as LocationKey)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor={location} className="ml-2 text-sm text-gray-700">
                    {location}
                  </label>
                </li>
              ))}
              </ul>
              <div className="flex justify-end mt-3 space-x-2">
                <button
                  onClick={closeFilterByLocation}
                  className="px-3 py-1 text-sm bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Reset
                </button>
                <button
                  onClick={() => setShowLocationFilter(false)} 
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
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
                       {order.subject === "Others" ? `${order.subject} - ${order.summary}` : order.subject}
                  </td>
                  <td className="p-2 border-b border-blue-gray-50 text-wrap max-w-50">{addressDisplay}</td>
                  <td className="p-2 border-b border-blue-gray-50 text-wrap text-sm flex-wrap">
                    {formatDate(order.TimeStamp)}
                  </td>
                  <td className="p-2 border-b border-blue-gray-50 text-sm max-w-50">
                    {order.deviceid && order.deviceid !== "Select Device" ? order.deviceid : "N/A"}
                  </td>
                  {hasAssignAccess && (
                  <td className="p-2 border-b border-blue-gray-50 mt-[5vh] text-sm">
                    {/* <AssignTask
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
                    /> */}
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

      <Pagination
          currentPage={currentPage}
          totalItems={backendData.length}
          itemsPerPage={itemsPerPage}
          paginate={paginate}
        />
    </div>
  );
};

export default OpenBreakdown;
