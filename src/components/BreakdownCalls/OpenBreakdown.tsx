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
import ErrorPage from "../ErrorPage/Error";
import AssignedFilter from "../Filters/AssignedFilter";
import CustomerInfoButton from "../ToolTips/CustomerContact";

interface OpenBreakdownProps {
  onLoadingComplete?: () => void;
}

interface FilterParams {
  startDate: string | null;
  endDate: string | null;
  issues: string[];
  locations: string[];
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
  const [assignModalData, setAssignModalData] = useState<Order | null>(null);
  const [resolvedModalData, setResolvedModalData] = useState<Order | null>(null); 
  const [currentFilters, setCurrentFilters] = useState<FilterParams>({
  startDate: null,
  endDate: null,
  issues: [],
  locations: []
});
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

  const fetchTasks = async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_CIRCOLIFE_PRODUCTION_API}/api/query/queries/all`, {
        // const res = await axios.get("https://app.dev.circolife.vip/api/query/queries/all", {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `${process.env.NEXT_PUBLIC_CIRCOLIFE_PRODUCTION_TOKEN}`
        },
      });

      const fetchedData = res.data.allQueries.map((order: any) => ({
        ...order,
        contactperson: order.contactperson || "N/A",
        contactnumber: order.contactnumber || "N/A",
        subject: order.subject || "N/A",
        summary: order.summery || "N/A",
        deviceCount: order.deviceCount || 1,
        address: order.address,
        deviceid: order.deviceid || "N/A",
        addressId: order.addressid || "N/A",
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
  useEffect(() => {
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

  const getShippingAddress = (orderId: string) => {
    const address = shippingAddresses.find((address) => address._id === orderId);
    return address?.customerData?.shipping_address[0] || null;
  };

  // const formatDate = (timestamp: string) => {
  //   const date = new Date(timestamp);
  //   return (
  //     <div className="flex flex-col text-sm">
  //       <span>{date.toLocaleDateString()}</span>
  //       <span>{date.toLocaleTimeString()}</span>
  //     </div>
  //   );
  // };

  const formatDate = (timestamp: string) => {
  // Use regex or split to isolate date and time
  const [datePart, timePartRaw] = timestamp.split("T");

  const timePart = timePartRaw?.split(".")[0] || ""; // remove milliseconds
  const [hours24, minutes, seconds] = timePart.split(":");

  let hours = parseInt(hours24, 10);
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;

  const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes}:${seconds} ${ampm}`;

  const [year, month, day] = datePart.split("-");

  return (
    <div className="flex flex-col text-sm">
      <span>{`${parseInt(month)}/${parseInt(day)}/${year}`}</span>
      <span>{formattedTime}</span>
    </div>
  );
};



  const activeOrders = filteredData.filter(
    (order) =>
      order.status === true &&
      (!order.queryStatus || order.queryStatus.toLowerCase() === "open")
  );
  
  const searchFilteredOrders = activeOrders.filter((order) =>
    order?.customerName?.toLowerCase().includes(searchQuery.toLowerCase())
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

  const fetchFilteredData = async (filters: FilterParams) => {
    try {
      setLoading(true);
      setCurrentFilters(filters); // Update current filters
      // Prepare request body
      const requestBody: any = {};

      if (filters.startDate) {
        requestBody.startDate = filters.startDate;
      }
      
      if (filters.endDate) {
        requestBody.endDate = filters.endDate;
      }

      if (filters.issues.length > 0) {
        requestBody.issues = filters.issues;
      }else{
        requestBody.issues = [];
      }
      
      if (filters.locations.length > 0) {
        requestBody.locations = filters.locations;
      }else{
        requestBody.locations = [];
      }
      
      // If no filters applied, fetch all data
      if (Object.keys(requestBody).length === 0) {
        return fetchTasks();
      }
      
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_CIRCOLIFE_PRODUCTION_API}/api/query/queries/filter`,
        requestBody,
        {
          headers: {
            "Authorization": `${process.env.NEXT_PUBLIC_CIRCOLIFE_PRODUCTION_TOKEN}`
          }
        }
      );

      const orders = res.data.filteredQueries.map((order: any) => ({
        ...order,
        contactperson: order.contactperson || "N/A",
        contactnumber: order.contactnumber || "N/A",
        subject: order.subject || "N/A",
        summary: order.summery || "N/A",
        deviceCount: order?.deviceCount || 1,
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
      
      setBackendData(orders);
      setFilteredData(orders); 
    } catch (error) {
      console.error("Error fetching filtered data:", error);
      toast.error("Failed to apply filters");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadExcel = async () => {
    try {
      setLoading(true);
      toast.success("Preparing download...");
  
      const XLSX = await import("xlsx");
  
      const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
      };
  
      // Export exactly what's shown in UI (active, open, search-filtered)
      const dataToExport = searchFilteredOrders;
  
      const exportData = dataToExport.map((order: Order, index) => {
        const shippingAddress = getShippingAddress(order._id);
        const addressDisplay = shippingAddress
          ? `${shippingAddress.line1}, ${shippingAddress.line2 || ""}, ${shippingAddress.city}, ${shippingAddress.state}, ${shippingAddress.pincode}`
          : order.address;
  
        return {
          "S.No": index + 1,
          "Contact Person": order.contactperson,
          "Contact Number": order.contactnumber,
          "Issue Reported": order.subject,
          "Issue Summary": order.summary,
          "Customer Address": addressDisplay || "N/A",
          "Date": formatDate(order.TimeStamp),
          "Device ID": order.deviceid || "N/A",
        };
      });
  
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Breakdowns");
  
      XLSX.writeFile(wb, "breakdown_tasks.xlsx");
  
      toast.success("Download complete!");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download Excel.");
    } finally {
      setLoading(false);
    }
  };
  

  // const handleRaiseQueryBeta = () => {
  //   const token = localStorage.getItem('authToken');
  //   if (!token) {
  //     toast.error('Authentication required');
  //     return;
  //   }
    
  //   const queryURL = new URL('https://devquerys.circolives.in');
  //   // const queryURL = new URL('http://192.168.0.111:5174/');
  //   queryURL.searchParams.append('from', "service");
  //   queryURL.searchParams.append('auth', token);
  //   window.location.href = queryURL.toString();
  // };

  const handleRaiseQueryClassic = () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      toast.error('Authentication required');
      return;
    }
    
    const queryURL = new URL(`${process.env.NEXT_PUBLIC_QUERY_DASHBOARD}`);
    queryURL.searchParams.append('from', "service");
    queryURL.searchParams.append('auth', token);
    window.location.href = queryURL.toString();
  };

    // Pagination logic
    const indexOfLastOrder = currentPage * itemsPerPage;
    const indexOfFirstOrder = indexOfLastOrder - itemsPerPage;
    const filteredOrders = searchFilteredOrders.filter((order) =>
      order?.customerName?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  
    const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  if (loading) return <Loader />;
  if (error) return <ErrorPage error={error} />;

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
          <div className="relative group gap-2 lg:flex lg:gap-3 w-full sm:w-auto mb-2 sm:mb-0">
            {/* <button className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-[#A14996] border border-[#A14996] rounded-lg hover:bg-[#f9f0f9] w-full sm:w-auto" onClick={handleRaiseQueryBeta}>
              Raise A Query New
            </button> */}
            <button className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-[#A14996] border border-[#A14996] rounded-lg hover:bg-[#f9f0f9] w-full sm:w-auto mt-2 lg:mt-0" onClick={handleRaiseQueryClassic}>
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
              fetchFilteredData={fetchFilteredData}
              handleDownloadExcel={handleDownloadExcel}
              initialStartDate={currentFilters.startDate}
              initialEndDate={currentFilters.endDate}
              initialIssues={currentFilters.issues}
              initialLocations={currentFilters.locations}
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
            <th className="p-4 border-y border-blue-gray-100 bg-blue-gray-50/50 text-sm">Contact Customer</th>
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
                    Name: {order.contactperson} <br /> 
                    Number: {order.contactnumber} <br />
                    {order.alternateContactPersonName && order.alternateNumber && (
                      <b className="font-bold">Alternate: {order.alternateContactPersonName} <br /> {order.alternateNumber} </b>
                    )}
                  </td>
                  <td className="p-2 border-b border-blue-gray-50 text-sm max-w-50">
                    Name: {order.customerName ? order.customerName : order.contactperson} <br /> 
                    Number: {order.customerNumber}
                  </td>
                  <td className="p-2 border-b border-blue-gray-50 text-sm max-w-50">
                    {order.subject}
                  </td>
                  <td className="p-2 border-b border-blue-gray-50 text-sm max-w-50">
                    {"Count: " + (order?.deviceCount ?? "1")} <br />
                    {order.summary}
                  </td>
                  <td className="p-2 border-b border-blue-gray-50 text-wrap max-w-50">
                    {(order.address !== "N/A" && order.address !== "Not Available") ? order?.address : addressDisplay}
                  </td>
                  <td className="p-2 border-b border-blue-gray-50 text-wrap max-w-50">
                    <CustomerInfoButton
                      queryId = {order._id}
                      customerId = {order.userid}
                      customerEmail = {order.contactemail}
                      customerName = {order.contactperson}
                      customerPhone = {order.contactnumber} 
                    />
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
      {/* <Pagination
        currentPage={currentPage}
        totalItems={searchFilteredOrders.length}
        itemsPerPage={itemsPerPage}
        paginate={paginate}
      /> */}
      <Pagination
        currentPage={currentPage}
        totalItems={filteredOrders.length}
        itemsPerPage={itemsPerPage}
        paginate={paginate}
      />
    </>
  );
};

export default OpenBreakdown;