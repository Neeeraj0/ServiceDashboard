import React, { useState, useCallback, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FiFilter, FiX, FiDownload } from "react-icons/fi";
import * as XLSX from "xlsx";
import toast from "react-hot-toast";
import { Calendar1, RotateCcwIcon } from "lucide-react";
import { formatDate } from "../utils/dateUtils";
import issuesList from '../utils/IssuesList';

interface Technician {
  _id: string;
  name: string;
  email: string;
  phone: string;
  technician_id: string;
}

interface Photo {
  url: string;
  servicePhase: string;
  presignedUrl: string;
  s3Key: string;
  serialId: string;
  orderId: string;
  type: string;
}

interface MaterialUsed {
  materialName: string;
  sizeUsed?: string;
  quantityUsed?: number;
}

interface Order {
  _id: string;
  task_id: string;
  contactPerson: string;
  customerDetails: string;
  issueReported: string;
  issueFound: string;
  status: string;
  address: string;
  assignedDate: string;
  endDate: string;
  date: string;
  note: string;
  deviceId: string;
  assignedTechnicians: Technician[];
  photos: Photo[];
  materialsUsed: MaterialUsed[];
  issueObserved: string;
  isPeriodicService: boolean;
  TAT1: string;
  TAT2: string;
}

interface FilterDrawerProps {
  originalData: Order[];
  setFilteredData: (data: Order[]) => void;
}

const CompletedFilterDrawer: React.FC<FilterDrawerProps> = ({ originalData, setFilteredData }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [selectedIssues, setSelectedIssues] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedTechnicians, setSelectedTechnicians] = useState<string[]>([]);
  const [isPeriodicService, setIsPeriodicService] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Extract unique issues from originalData
//   const uniqueIssues = [...new Set(originalData.map(order => order.issueReported))].filter(Boolean);
  
  // Extract unique technician names
  const allTechnicians = originalData.flatMap(order => 
    order.assignedTechnicians.map(tech => tech.name)
  );
//   const uniqueTechnicians = [...new Set(allTechnicians)].filter(Boolean);

  // Extract unique locations (using first part of address)
  const extractLocation = (address: string) => {
    return address.split(',')[0].trim();
  };
//   const uniqueLocations = [...new Set(originalData.map(order => extractLocation(order.address)))].filter(Boolean);

  const handleToggleDrawer = () => {
    setIsOpen((prev) => !prev);
  };

  const handleToggle = (value: string, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter((prev) => (prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]));
  };

  const handleRadioChange = (value: string | null) => {
    setIsPeriodicService(value);
  };

  const resetFilters = () => {
    setStartDate(null);
    setEndDate(null);
    setSelectedIssues([]);
    setSelectedLocations([]);
    setSelectedTechnicians([]);
    setIsPeriodicService(null);
    setFilteredData(originalData);
    toast.success("Filters reset");
  };

  const downloadExcel = async () => {
    try {
      setLoading(true);
      toast.success("Preparing download...");

      const exportData = originalData.map((order) => ({
        "Task ID": order.task_id,
        "Contact Person": order.contactPerson,
        "Customer Details": order.customerDetails,
        "Issue Reported": order.issueReported,
        "Issue Found": order.issueFound,
        "Assigned Technicians": order.assignedTechnicians.map((tech) => tech.name).join(", ") || "N/A",
        "Resolve Note": order.note,
        "Materials Used": order.materialsUsed.map(m => `${m.materialName}${m.quantityUsed ? ` (${m.quantityUsed})` : ''}`).join(", "),
        "Customer Address": order.address,
        "Assigned Date": order.assignedDate ? `${formatDate(order.assignedDate).date} ${formatDate(order.assignedDate).time}` : "N/A",
        "Closure Date": order.endDate ? `${formatDate(order.endDate).date} ${formatDate(order.endDate).time}` : "N/A",
        "Device ID": order.deviceId,
        "Routine Services": order.isPeriodicService ? "Yes" : "No",
        "TAT1": order.TAT1,
        "TAT2": order.TAT2,
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Completed Tasks");
      XLSX.writeFile(wb, "completed_tasks.xlsx");

      toast.success("Download complete!");
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Download failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = useCallback(() => {
    let filtered = [...originalData];

    // Apply date filter for assigned date
    if (startDate && endDate) {
      filtered = filtered.filter((order) => {
        const orderDate = new Date(order.assignedDate);
        return orderDate >= startDate && orderDate <= endDate;
      });
    }

    // Apply issue filter
    if (selectedIssues.length > 0) {
      filtered = filtered.filter((order) => selectedIssues.includes(order.issueReported));
    }

    // Apply location filter
    if (selectedLocations.length > 0) {
      filtered = filtered.filter((order) => {
        const location = extractLocation(order.address);
        return selectedLocations.includes(location);
      });
    }

    // Apply technician filter
    if (selectedTechnicians.length > 0) {
      filtered = filtered.filter((order) => {
        return order.assignedTechnicians.some(tech => 
          selectedTechnicians.includes(tech.name)
        );
      });
    }

    // Apply periodic service filter
    if (isPeriodicService !== null) {
      filtered = filtered.filter((order) => {
        if (isPeriodicService === "yes") {
          return order.isPeriodicService === true;
        } else if (isPeriodicService === "no") {
          return order.isPeriodicService === false;
        }
        return true;
      });
    }

    setFilteredData(filtered);
    toast.success(`${filtered.length} tasks found`);
  }, [startDate, endDate, selectedIssues, selectedLocations, selectedTechnicians, isPeriodicService, originalData, setFilteredData]);

  useEffect(() => {
    if (!isOpen) {
      if (startDate || endDate || selectedIssues.length > 0 || selectedLocations.length > 0 || selectedTechnicians.length > 0 || isPeriodicService !== null) {
        applyFilters();
      }
    }
  }, [startDate, endDate, selectedIssues, selectedLocations, selectedTechnicians, isPeriodicService, applyFilters, isOpen]);

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
            onClick={(e) => e.stopPropagation()}
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
              {/* Date Range Filter */}
              <div>
                <h3 className="text-lg font-medium text-gray-900">Service Date Range</h3>
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
              </div>

              {/* Issue Reported Filter */}
              <div>
                <h3 className="text-lg font-medium text-gray-900">Issue Reported</h3>
                <div className="mt-2 max-h-40 overflow-y-auto">
                  {issuesList.map((issue) => (
                    <label
                      key={issue}
                      className={`w-full p-2 gap-5 rounded-md items-center cursor-pointer flex mb-2 ${
                        selectedIssues.includes(issue)
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-gray-200 text-gray-400 hover:text-black'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedIssues.includes(issue)}
                        onChange={() => handleToggle(issue, setSelectedIssues)}
                        className={`mr-2 ${
                          selectedIssues.includes(issue)
                            ? 'accent-blue-600'
                            : 'text-gray-200'
                        }`}
                      />
                      <span className={selectedIssues.includes(issue) ? 'font-medium' : ''}>{issue}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Technician Filter */}
              {/* <div>
                <h3 className="text-lg font-medium text-gray-900">Technician</h3>
                <div className="mt-2 max-h-40 overflow-y-auto">
                  {uniqueTechnicians.map((tech) => (
                    <label
                      key={tech}
                      className={`w-full p-2 gap-5 rounded-md items-center cursor-pointer flex mb-2 ${
                        selectedTechnicians.includes(tech)
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-gray-200 text-gray-400 hover:text-black'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedTechnicians.includes(tech)}
                        onChange={() => handleToggle(tech, setSelectedTechnicians)}
                        className={`mr-2 ${
                          selectedTechnicians.includes(tech)
                            ? 'accent-blue-600'
                            : 'text-gray-200'
                        }`}
                      />
                      <span className={selectedTechnicians.includes(tech) ? 'font-medium' : ''}>{tech}</span>
                    </label>
                  ))}
                </div>
              </div> */}

              {/* Location Filter */}
              {/* <div>
                <h3 className="text-lg font-medium text-gray-900">Location</h3>
                <div className="mt-2 max-h-40 overflow-y-auto">
                  {uniqueLocations.map((location) => (
                    <label
                      key={location}
                      className={`w-full p-2 gap-5 rounded-md items-center cursor-pointer flex mb-2 ${
                        selectedLocations.includes(location)
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-gray-200 text-gray-400 hover:text-black'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedLocations.includes(location)}
                        onChange={() => handleToggle(location, setSelectedLocations)}
                        className={`mr-2 ${
                          selectedLocations.includes(location)
                            ? 'accent-blue-600'
                            : 'text-gray-200'
                        }`}
                      />
                      <span className={selectedLocations.includes(location) ? 'font-medium' : ''}>{location}</span>
                    </label>
                  ))}
                </div>
              </div> */}

              {/* Periodic Service Filter */}
              <div>
                <h3 className="text-lg font-medium text-gray-900">Routine Services</h3>
                <div className="mt-2 space-y-2">
                  <label className={`w-full p-2 gap-5 rounded-md items-center cursor-pointer flex ${
                    isPeriodicService === "yes" ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-400 hover:text-black'
                  }`}>
                    <input
                      type="radio"
                      checked={isPeriodicService === "yes"}
                      onChange={() => handleRadioChange("yes")}
                      className={`mr-2 ${
                        isPeriodicService === "yes" ? 'accent-blue-600' : 'text-gray-200'
                      }`}
                    />
                    <span className={isPeriodicService === "yes" ? 'font-medium' : ''}>Yes</span>
                  </label>
                  <label className={`w-full p-2 gap-5 rounded-md items-center cursor-pointer flex ${
                    isPeriodicService === "no" ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-400 hover:text-black'
                  }`}>
                    <input
                      type="radio"
                      checked={isPeriodicService === "no"}
                      onChange={() => handleRadioChange("no")}
                      className={`mr-2 ${
                        isPeriodicService === "no" ? 'accent-blue-600' : 'text-gray-200'
                      }`}
                    />
                    <span className={isPeriodicService === "no" ? 'font-medium' : ''}>No</span>
                  </label>
                  <label className={`w-full p-2 gap-5 rounded-md items-center cursor-pointer flex ${
                    isPeriodicService === null ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-400 hover:text-black'
                  }`}>
                    <input
                      type="radio"
                      checked={isPeriodicService === null}
                      onChange={() => handleRadioChange(null)}
                      className={`mr-2 ${
                        isPeriodicService === null ? 'accent-blue-600' : 'text-gray-200'
                      }`}
                    />
                    <span className={isPeriodicService === null ? 'font-medium' : ''}>All</span>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-row gap-5">
                <button 
                  onClick={resetFilters} 
                  className="w-full rounded-md bg-gray-300 px-4 py-2 mt-2 text-sm flex items-center justify-center gap-2"
                >
                  <RotateCcwIcon className="text-gray-700" />
                  Reset Filters
                </button>
                <button 
                  onClick={applyFilters} 
                  className="w-full bg-blue-600 text-white px-4 py-2 mt-2 rounded-md"
                  disabled={!selectedIssues.length && !startDate && !endDate && !selectedLocations.length && !selectedTechnicians.length && isPeriodicService === null}
                >
                  Apply Filters
                </button>
              </div>
              
              {/* Download Button */}
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

export default CompletedFilterDrawer;