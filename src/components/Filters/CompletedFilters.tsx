import React, { useState, useCallback, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FiFilter, FiX, FiDownload } from "react-icons/fi";
// import * as XLSX from "xlsx";
import toast from "react-hot-toast";
import { Calendar1, RotateCcwIcon } from "lucide-react";
import { formatDate } from "../utils/dateUtils";
import issuesList from '../utils/IssuesList';
import axios from "axios";

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
  setFilteredData: (data: Order[]) => void;
  filters: {
    startDate: Date | null;
    endDate: Date | null;
    selectedIssues: string[];
    selectedLocations: string[];
    selectedTechnicians: string[];
    isPeriodicService: string | null;
  };
  setFilters: (filters: any) => void;
  triggerRefresh: () => void;
}

const CompletedFilterDrawer: React.FC<FilterDrawerProps> = ({ 
  setFilteredData,
  filters,
  setFilters,
  triggerRefresh
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [dropdownOptions, setDropdownOptions] = useState({
    issues: [] as string[],
    locations: [] as string[],
    technicians: [] as Array<{_id: string, name: string}>
  });

  // Fetch filter options from backend
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_SERVICE_BACKEND_API}/api/breakdown/filter-options`
        );
        setDropdownOptions({
          issues: res.data.issues || [],
          locations: res.data.locations || [],
          technicians: res.data.technicians || []
        });
      } catch (error) {
        console.error('Failed to fetch filter options:', error);
      }
    };
    
    fetchFilterOptions();
  }, []);

  const handleToggleDrawer = () => {
    setIsOpen((prev) => !prev);
  };

  const handleToggle = (key: string, value: string) => {
    setFilters((prev: any) => {
      const currentArray = prev[key] as string[];
      return {
        ...prev,
        [key]: currentArray.includes(value) 
          ? currentArray.filter(item => item !== value)
          : [...currentArray, value]
      };
    });
  };

  const handleRadioChange = (value: string | null) => {
    setFilters((prev: any) => ({
      ...prev,
      isPeriodicService: value
    }));
  };

  const resetFilters = () => {
    setFilters({
      startDate: null,
      endDate: null,
      selectedIssues: [],
      selectedLocations: [],
      selectedTechnicians: [],
      isPeriodicService: null
    });
    triggerRefresh();
    toast.success("Filters reset");
  };

  const applyFilters = () => {
    triggerRefresh();
    setIsOpen(false);
  };

  const downloadExcel = async () => {
    try {
      setLoading(true);
      toast.success("Preparing download...");
      const XLSX = await import("xlsx"); 

      // Fetch all data with current filters
      const formatToLocalYMD = (date: Date) => 
       `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
      const params = {
        limit: 10000, // Adjust based on your needs
        ...(filters.startDate && { startDate: formatToLocalYMD(filters.startDate) }),
        ...(filters.endDate && { endDate: formatToLocalYMD(filters.endDate) }),
        ...(filters.selectedIssues.length > 0 && { issues: filters.selectedIssues.join(',') }),
        // ...(filters.selectedLocations.length > 0 && { locations: filters.selectedLocations.join(',') }),
        // ...(filters.selectedTechnicians.length > 0 && { technicians: filters.selectedTechnicians.join(',') }),
        ...(filters.isPeriodicService !== null && { 
          periodicService: filters.isPeriodicService === 'yes' ? 'true' : 'false' 
        })
      };

      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_SERVICE_BACKEND_API}/api/breakdown/v2/getCompletedDetails`,
        { params }
      );

      const exportData = res.data.tasks.map((order: any) => ({
        "Task ID": order.task_id,
        "Contact Person": order.client_name,
        "Customer Details": order.client_number,
        "Issue Reported": order.customerComplaint,
        "Issue Found": order.issueObserved,
        "Assigned Technicians": order.assignedTechnicians?.map((tech: any) => tech.name).join(", ") || "N/A",
        "Resolve Note": order.note,
        "Materials Used": order.materialsUsed
          ? order.materialsUsed.flatMap((m: any) => 
              m.materials?.map((mat: any) => 
                `${mat.materialName}${mat.quantityUsed ? ` (${mat.quantityUsed})` : ''}`
              ) || []
          ).join(", ")
          : "N/A",
        "Customer Address": order.address?.map((addr: any) => addr.location).join(", ") || "N/A",
        "Assigned Date": order.assignedDate ? formatDate(order.assignedDate).date + " " + formatDate(order.assignedDate).time : "N/A",
        "Closure Date": order.endDate ? formatDate(order.endDate).date + " " + formatDate(order.endDate).time : "N/A",
        "Device ID": order.ac_units?.map((unit: any) => `${unit.type} (${unit.capacity})`).join(", ") || "N/A",
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
                      selected={filters.startDate}
                      // onChange={(date) => setFilters((prev: any) => ({...prev, startDate: date}))}
                      onChange={(date) => setFilters((prev: any) => ({
                        ...prev,
                        startDate: date ? new Date(date.setHours(12, 0, 0, 0)) : null
                      }))}
                      selectsStart
                      startDate={filters.startDate}
                      endDate={filters.endDate}
                      placeholderText="Start Date"
                      className="w-full rounded-md border border-gray-300 p-2 cursor-pointer"
                      dateFormat="yyyy-MM-dd"
                    />
                  </div>
                  <div className="flex flex-row gap-5">
                    <Calendar1 />
                    <DatePicker
                      selected={filters.endDate}
                      // onChange={(date) => setFilters((prev: any) => ({...prev, endDate: date}))}
                      onChange={(date) => setFilters((prev: any) => ({
                        ...prev,
                        endDate: date ? new Date(date.setHours(12, 0, 0, 0)) : null
                      }))}
                      selectsEnd
                      startDate={filters.startDate}
                      endDate={filters.endDate}
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
                  {dropdownOptions.issues.map((issue) => (
                    <label
                      key={issue}
                      className={`w-full p-2 gap-5 rounded-md items-center cursor-pointer flex mb-2 ${
                        filters.selectedIssues.includes(issue)
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-gray-200 text-gray-400 hover:text-black'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={filters.selectedIssues.includes(issue)}
                        onChange={() => handleToggle('selectedIssues', issue)}
                        className={`mr-2 ${
                          filters.selectedIssues.includes(issue)
                            ? 'accent-blue-600'
                            : 'text-gray-200'
                        }`}
                      />
                      <span className={filters.selectedIssues.includes(issue) ? 'font-medium' : ''}>{issue}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Location Filter */}
              <div>
                <h3 className="text-lg font-medium text-gray-900">Location</h3>
                <div className="mt-2 max-h-40 overflow-y-auto">
                  {dropdownOptions.locations.map((location) => (
                    <label
                      key={location}
                      className={`w-full p-2 gap-5 rounded-md items-center cursor-pointer flex mb-2 ${
                        filters.selectedLocations.includes(location)
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-gray-200 text-gray-400 hover:text-black'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={filters.selectedLocations.includes(location)}
                        onChange={() => handleToggle('selectedLocations', location)}
                        className={`mr-2 ${
                          filters.selectedLocations.includes(location)
                            ? 'accent-blue-600'
                            : 'text-gray-200'
                        }`}
                      />
                      <span className={filters.selectedLocations.includes(location) ? 'font-medium' : ''}>{location}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Periodic Service Filter */}
              <div>
                <h3 className="text-lg font-medium text-gray-900">Routine Services</h3>
                <div className="mt-2 space-y-2">
                  <label className={`w-full p-2 gap-5 rounded-md items-center cursor-pointer flex ${
                    filters.isPeriodicService === "yes" ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-400 hover:text-black'
                  }`}>
                    <input
                      type="radio"
                      checked={filters.isPeriodicService === "yes"}
                      onChange={() => handleRadioChange("yes")}
                      className={`mr-2 ${
                        filters.isPeriodicService === "yes" ? 'accent-blue-600' : 'text-gray-200'
                      }`}
                    />
                    <span className={filters.isPeriodicService === "yes" ? 'font-medium' : ''}>Yes</span>
                  </label>
                  <label className={`w-full p-2 gap-5 rounded-md items-center cursor-pointer flex ${
                    filters.isPeriodicService === "no" ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-400 hover:text-black'
                  }`}>
                    <input
                      type="radio"
                      checked={filters.isPeriodicService === "no"}
                      onChange={() => handleRadioChange("no")}
                      className={`mr-2 ${
                        filters.isPeriodicService === "no" ? 'accent-blue-600' : 'text-gray-200'
                      }`}
                    />
                    <span className={filters.isPeriodicService === "no" ? 'font-medium' : ''}>No</span>
                  </label>
                  <label className={`w-full p-2 gap-5 rounded-md items-center cursor-pointer flex ${
                    filters.isPeriodicService === null ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-400 hover:text-black'
                  }`}>
                    <input
                      type="radio"
                      checked={filters.isPeriodicService === null}
                      onChange={() => handleRadioChange(null)}
                      className={`mr-2 ${
                        filters.isPeriodicService === null ? 'accent-blue-600' : 'text-gray-200'
                      }`}
                    />
                    <span className={filters.isPeriodicService === null ? 'font-medium' : ''}>All</span>
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
                  disabled={
                    !filters.selectedIssues.length && 
                    !filters.startDate && 
                    !filters.endDate && 
                    !filters.selectedLocations.length && 
                    !filters.selectedTechnicians.length && 
                    filters.isPeriodicService === null
                  }
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