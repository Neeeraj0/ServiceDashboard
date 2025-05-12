import React, { useState, useCallback } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FiFilter, FiX, FiDownload } from "react-icons/fi";
import toast from "react-hot-toast";
import { Calendar1, CalendarCheck2, RotateCcwIcon } from "lucide-react";
import { formatDate } from "../utils/dateUtils";

interface Technician {
  _id: string;
  name: string;
  email: string;
  phone: string;
  technician_id: string;
}

interface Device {
  deviceName: string;
  model: string;
  status: string;
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
  device?: Device[];
  scheduledDate: string;
  deviceId: string;
  assignedTechnicians: Technician[];
}

interface FilterDrawerProps {
  fetchFilteredData: (filters: FilterParams) => void;
}

interface FilterParams {
  startDate: string | null;   // ← previously Date | null
  endDate: string | null;
  statuses: string[];
}


const AssignedFilter: React.FC<FilterDrawerProps> = ({ fetchFilteredData }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const handleToggle = (value: string, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter((prev) => (prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]));
  };

  const handleToggleDrawer = () => {
    setIsOpen((prev) => !prev);
  };

  const resetFilters = () => {
    setStartDate(null);
    setEndDate(null);
    setSelectedStatuses([]);
    fetchFilteredData({
      startDate: null,
      endDate: null,
      statuses: []
    });
    toast.success("Filters reset");
  };

  const downloadExcel = async () => {
    try {
      setLoading(true);
      const XLSX = await import("xlsx"); 
      toast.success("Preparing download...");

      // You'll need to modify this to get the filtered data from the API
      const formatDateToYMD = (date: Date | null) =>
        date ? `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}` : null;
      const response = await fetch(`${process.env.NEXT_PUBLIC_SERVICE_BACKEND_API}/api/breakdown/getFilteredAssigned`, {
        // const response = await fetch(`http://localhost:8080/api/breakdown/getFilteredAssigned`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        
        body: JSON.stringify({
          startDate: formatDateToYMD(startDate),
          endDate: formatDateToYMD(endDate),
          statuses: selectedStatuses
        })
      });

      const data = await response.json();
      
      const exportData = data.map((order: any) => ({
        "ID": order._id,
        "Task ID": order.task_id,
        "Contact Person": order.contactPerson,
        "Customer Details": order.client_name,
        "Customer Phone": order.client_number,
        "Assigned Technicians": order.assignedTechnicians.map((tech: Technician) => tech.name).join(", ") || "N/A",
        "Status": order.status,
        "Customer Address": order.address[0].location || "N/A",
        "Issue Reported": order.customerComplaint || "N/A",
        "Scheduled Date": order.servicingDate ? `${formatDate(order.servicingDate).date} ${formatDate(order.servicingDate).time}` : "N/A",
        "Assigned Date": order.assignedDate ? `${formatDate(order.assignedDate).date} ${formatDate(order.assignedDate).time}` : "N/A",
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Filtered Orders");
      XLSX.writeFile(wb, "filtered_orders.xlsx");

      toast.success("Download complete!");
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Download failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = useCallback(() => {
    const formatToLocalDateString = (date: Date | null) =>
      date ? `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2,'0')}-${date.getDate().toString().padStart(2,'0')}` : null;

    // fetchFilteredData({
    //   startDate,
    //   endDate,
    //   statuses: selectedStatuses
    // });

    fetchFilteredData({
      startDate: formatToLocalDateString(startDate),
      endDate: formatToLocalDateString(endDate),
      statuses: selectedStatuses
    });

    console.log("Applied Filters:", {
      startDate: startDate,
      endDate: endDate ,
      statuses: selectedStatuses
    });
    
    setIsOpen(false);
    toast.success("Applying filters...");
  }, [startDate, endDate, selectedStatuses, fetchFilteredData]);

  return (
    <div className="relative">
      <button
        onClick={handleToggleDrawer}
        className="inline-flex w-[fit-content] justify-center gap-x-1.5 rounded-full bg-[#A14996] px-2 py-2 font-semibold text-white text-xl ring-1 shadow-xs ring-gray-300 ring-inset"
        aria-label="Toggle filter drawer"
      >
        <FiFilter className="h-4 w-4 mr-1" />
      </button>

      {isOpen && (
        <div
          className="overlay fixed inset-0 z-40 bg-black bg-opacity-50 transition-opacity"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="absolute right-0 h-full w-full max-w-md transform bg-white p-6 shadow-xl transition-transform duration-300 ease-in-out sm:w-96 rounded-l-2xl"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()} // Prevent click event from closing the drawer
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Filters</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-full p-2 hover:bg-gray-100"
                aria-label="Close filter drawer"
              >
                <FiX className="h-6 w-6" />
              </button>
            </div>

            <div className="mt-6 space-y-6 max-h-[calc(100vh-150px)] overflow-y-auto pr-2">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Date Range</h3>
                <div className="mt-2 space-y-2">
                    <div className="flex flex-row gap-5">
                        <Calendar1 />
                        <DatePicker
                            selected={startDate}
                            onChange={(date) => setStartDate(date)}
                            selectsStart
                            startDate={startDate}
                            endDate={endDate}
                            placeholderText="Start Date"
                            className="w-full rounded-md border border-gray-300 p-2 cursor-pointer"
                            dateFormat="yyyy-MM-dd"
                        />
                    </div>
                    <div className="flex flex-row gap-5">
                        <Calendar1 />
                        <DatePicker
                            selected={endDate}
                            onChange={(date) => setEndDate(date)}
                            selectsEnd
                            startDate={startDate}
                            endDate={endDate}
                            placeholderText="End Date"
                            className="w-full rounded-md border border-gray-300 p-2 cursor-pointer"
                            dateFormat="yyyy-MM-dd"
                        />
                    </div>
                </div>
                <div className="mt-20 flex flex-col gap-5">
                <h3 className="text-lg font-medium">Status</h3>
                {['open', 'pending'].map((status) => (
                  <label 
                  key={status} 
                  className={`w-full p-2 gap-5 rounded-md items-center cursor-pointer flex ${
                    selectedStatuses.includes(status) 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'bg-gray-200 text-gray-400 hover:text-black'
                  }`}
                >
                  <input 
                    type="checkbox" 
                    checked={selectedStatuses.includes(status)} 
                    onChange={() => handleToggle(status, setSelectedStatuses)} 
                    className={`mr-2 ${
                      selectedStatuses.includes(status) 
                        ? 'accent-blue-600' 
                        : 'text-gray-200'
                    }`} 
                  /> 
                  <span className={selectedStatuses.includes(status) ? 'font-medium' : ''}>{status}</span>
                  {selectedStatuses.includes(status) && (
                    <span className="ml-auto bg-blue-600 text-white text-xs px-2 py-1 rounded">{status}</span>
                  )}
                </label>
                ))}
              </div>
              </div>
              <div className="flex flex-row gap-5">
                <button onClick={resetFilters} className="w-full rounded-md bg-gray-300 px-4 py-2 mt-2 text-sm flex items-center justify-center gap-2">
                    <RotateCcwIcon className="text-gray-700" />
                    Reset Filters
                </button>
                <button 
                    onClick={applyFilters} 
                    className="w-full bg-blue-600 text-white px-4 py-2 mt-2 rounded-md"
                    disabled={!startDate && !endDate && !selectedStatuses.length}
                >
                    Apply Filters
                </button>
              </div>
              <button
                onClick={downloadExcel}
                disabled={loading}
                className="w-full mt-4 flex items-center justify-center rounded-md bg-green-200 px-4 py-2 text-sm font-medium text-green-800 hover:bg-green-300 hover:border-green-400 border-2 border-green-300"
             >
                {loading ? (
                    "Preparing download..."
                ) : (
                     <>
                        <FiDownload className="mr-2" />
                            Download as Excel
                        </>
                )}
            </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignedFilter;