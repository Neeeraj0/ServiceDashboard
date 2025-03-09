import React, { useState, useCallback, useEffect, useMemo } from "react";
import { format } from "date-fns";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FiFilter, FiX, FiDownload, FiCheck } from "react-icons/fi";
import * as XLSX from "xlsx";
import issuesList from '../utils/IssuesList';
import locationPinCodes, { LocationKey } from "@/types/filters/LocationKeys";
import { Order } from "@/types/breakdown/Order";
import { ShippingAddress } from "@/types/breakdown/ShippingAddress";
import toast from "react-hot-toast";
import { Calendar1, RotateCcwIcon } from "lucide-react";

interface FilterDrawerProps {
  originalData: Order[];
  setFilteredData: (data: Order[]) => void;
  shippingAddresses: ShippingAddress[];
  dateField: string; // New prop for the date field
}

const FilterDrawer: React.FC<FilterDrawerProps> = ({ 
  originalData, 
  setFilteredData,
  shippingAddresses
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [selectedIssues, setSelectedIssues] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Helper function to get shipping address for an order
  const getShippingAddress = useCallback((orderId: string) => {
    const address = shippingAddresses.find((address) => address._id === orderId);
    return address?.customerData?.shipping_address[0] || null;
  }, [shippingAddresses]);

  const handleToggleDrawer = () => {
    setIsOpen((prev) => !prev);
  };

  const handleClickOutside = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).classList.contains("overlay")) {
      setIsOpen(false);
    }
  };

  const handleIssueToggle = (value: string) => {
    setSelectedIssues((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value]
    );
  };

  const handleLocationToggle = (value: string) => {
    setSelectedLocations((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value]
    );
  };

  const resetFilters = () => {
    setStartDate(null);
    setEndDate(null);
    setSelectedIssues([]);
    setSelectedLocations([]);
    setFilteredData(originalData);
    toast.success("Filters reset");
  };

  const downloadExcel = async () => {
    try {
      setLoading(true);
      toast.success("Preparing download...");
      
      // Prepare data for export
      const exportData = originalData
        .filter(order => !order.queryStatus && order.status === true)
        .map((order) => {
          const shippingAddress = getShippingAddress(order._id);
          const addressDisplay = shippingAddress
            ? `${shippingAddress.line1}, ${shippingAddress.line2 || ""}, ${shippingAddress.city}, ${shippingAddress.state}, ${shippingAddress.pincode}`
            : "N/A";
            
          return {
            "Task ID": order._id,
            "Contact Person": order.contactperson,
            "Contact Number": order.contactnumber,
            "Issue Reported": order.subject,
            "Summary": order.summary,
            "Customer Address": addressDisplay,
            "Date": new Date(order.TimeStamp).toLocaleString(),
            "Device ID": order.deviceid,
          };
        });
      
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Tasks");
      XLSX.writeFile(wb, "service_tasks.xlsx");
      toast.success("Download complete!");
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Download failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = useCallback(() => {
    let filtered = [...originalData].filter(order => !order.queryStatus && order.status === true);

    // Apply date filter
    if (startDate && endDate) {
      filtered = filtered.filter((order) => {
        const orderDate = new Date(order.TimeStamp);
        return orderDate >= startDate && orderDate <= endDate;
      });
    }

    // Apply issue filter
    if (selectedIssues.length > 0) {
      filtered = filtered.filter((order) => 
        selectedIssues.includes(order.subject)
      );
    }

    // Apply location filter
    if (selectedLocations.length > 0) {
      filtered = filtered.filter((order) => {
        const shippingAddress = getShippingAddress(order._id);
        return shippingAddress
          ? selectedLocations.some((location) => 
              locationPinCodes[location as LocationKey]?.includes(shippingAddress.pincode)
            )
          : false;
      });
    }

    setFilteredData(filtered);
    toast.success(`${filtered.length} tasks found`);
  }, [startDate, endDate, selectedIssues, selectedLocations, originalData, getShippingAddress, setFilteredData]);

  useEffect(() => {
    if (isOpen) return; // Don't auto-apply when drawer opens
    console.log("startDate", startDate);
    console.log("endDate", endDate);
    console.log("selectedIssues", selectedIssues);
    console.log("selectedLocations", selectedLocations);
    // Apply filters automatically when filter values change
    if (startDate || endDate || selectedIssues.length > 0 || selectedLocations.length > 0) {
      applyFilters();
    }
  }, [startDate, endDate, selectedIssues, selectedLocations, applyFilters, isOpen]);

  return (
    <div className="relative">
      <button
        onClick={handleToggleDrawer}
        className="inline-flex w-[fit-content] justify-center gap-x-1.5 rounded-full bg-[#A14996] px-2 py-2  font-semibold text-white text-xl ring-1 shadow-xs ring-gray-300 ring-inset"
        aria-label="Toggle filter drawer"
      >
        <FiFilter className="h-4 w-4 mr-1" />
      </button>

      {isOpen && (
        <div
          className="overlay fixed inset-0 z-40 bg-black bg-opacity-50 transition-opacity"
          onClick={handleClickOutside}
        >
          <div
            className="absolute right-0 h-full w-full max-w-md transform bg-white p-6 shadow-xl transition-transform duration-300 ease-in-out sm:w-96 rounded-l-2xl"
            role="dialog"
            aria-modal="true"
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
                      onChange={(date: Date | null) => setStartDate(date)}
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
                      onChange={(date: Date | null) => setEndDate(date)}
                      selectsEnd
                      startDate={startDate}
                      endDate={endDate}
                      minDate={startDate || undefined}
                      placeholderText="End Date"
                      className="w-full rounded-md border border-gray-300 p-2 cursor-pointer"
                      dateFormat="yyyy-MM-dd"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900">Issues</h3>
                <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                  {issuesList.map((issue, index) => (
                    <label
                      key={index}
                      className="flex items-center space-x-2"
                    >
                      <input
                        type="checkbox"
                        checked={selectedIssues.includes(issue)}
                        onChange={() => handleIssueToggle(issue)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm">{issue}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900">Locations</h3>
                <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                  {Object.keys(locationPinCodes).map((location) => (
                    <label
                      key={location}
                      className="flex items-center space-x-2"
                    >
                      <input
                        type="checkbox"
                        checked={selectedLocations.includes(location)}
                        onChange={() => handleLocationToggle(location)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm">{location}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="flex space-x-4">
                  <button onClick={resetFilters} className="w-full rounded-md bg-gray-300 px-4 py-2 mt-2 text-sm flex items-center justify-center gap-2">
                      <RotateCcwIcon className="text-gray-700" />
                      Reset Filters
                  </button>
                  <button 
                    onClick={applyFilters} 
                    className="w-full bg-blue-600 text-white px-4 py-2 mt-2 rounded-md"
                    disabled={!selectedIssues.length && !startDate && !endDate && !selectedLocations.length}
                  >
                    Apply Filters
                </button>
                </div>

                <button
                  onClick={downloadExcel}
                  disabled={loading}
                  className="w-full mt-4 flex items-center justify-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
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
        </div>
      )}
    </div>
  );
};

export default FilterDrawer;