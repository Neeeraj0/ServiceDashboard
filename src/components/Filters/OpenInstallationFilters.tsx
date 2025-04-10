import React, { useState, useCallback, useEffect, useMemo } from "react";
import { format } from "date-fns";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FiFilter, FiX, FiDownload } from "react-icons/fi";
// import * as XLSX from "xlsx";
import { Calendar1, RotateCcwIcon } from "lucide-react";
import toast from "react-hot-toast";
import locationPinCodes, { LocationKey } from "@/types/filters/LocationKeys";

interface ACModel {
  model: string;
  display: string;
}

// AC models with user-friendly display names
const acModels: ACModel[] = [
  { model: "S10", display: "Split 1T" },
  { model: "S15", display: "Split 1.5T" },
  { model: "S20", display: "Split 2T" },
  { model: "S30", display: "Split 3T" },
  { model: "C10", display: "Cassette 1T" },
  { model: "C15", display: "Cassette 1.5T" },
  { model: "C20", display: "Cassette 2T" },
  { model: "C30", display: "Cassette 3T" },
];

interface PreorderResponse {
    _id: string;
    customer: {
      customer_id: string;
      name: string;
      email: string;
      mobile: string;
    };
    superAdmin: string;
    brandName: string;
    AcDetails: {
      ac_type: string;
      subscription_price: number;
      fixedPriceAfter3Years: number;
      model: string;
      installation_price: number;
      plan_year: string;
      deposit: number;
      quantity: number;
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
      contactPerson: string;
      contactNumber: string;
    };
    customer_billing_address: {
      gst_number: string;
      address_line1: string;
      address_line2: string;
      pincode: string;
      city: string;
      country: string;
      state: string;
    };
    parentPreorder: string;
    orderingStatus: boolean;
    preOrdertimestamp: string;
    paidamount: number;
    DateofSiteSurvey?: string;
    DateofInstallation?: string;
    TimeofInstallation?: string;
  }

interface InstallationFilterDrawerProps {
  originalData: PreorderResponse[];
  setFilteredData: (data: PreorderResponse[]) => void;
}

const InstallationFilterDrawer: React.FC<InstallationFilterDrawerProps> = ({
  originalData,
  setFilteredData,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [selectedACTypes, setSelectedACTypes] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const handleToggleDrawer = () => {
    setIsOpen((prev) => !prev);
  };

  const handleClickOutside = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).classList.contains("overlay")) {
      setIsOpen(false);
    }
  };

  const handleModelToggle = (value: string) => {
    setSelectedModels((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value]
    );
  };

  const handleACTypeToggle = (value: string) => {
    setSelectedACTypes((prev) =>
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
    setSelectedModels([]);
    setSelectedACTypes([]);
    setSelectedLocations([]);
    setFilteredData(originalData);
    toast.success("Filters reset");
  };

  const downloadExcel = async () => {
    try {
      setLoading(true);
      toast.success("Preparing download...");
      const XLSX = await import("xlsx"); 
      
      // Prepare data for export
      const exportData = originalData.map((order) => {
        const acDetails = order.AcDetails.map(ac => 
          `${ac.ac_type} ${ac.model} (${ac.quantity})`
        ).join(", ");
        
        const addressDisplay = order.customer_shipping_address
          ? `${order.customer_shipping_address.address_line1}, ${order.customer_shipping_address.address_line2 || ""}, ${order.customer_shipping_address.city}, ${order.customer_shipping_address.state}, ${order.customer_shipping_address.pincode}`
          : "N/A";
            
        return {
          "Task ID": order._id,
          "Customer": order.customer.name,
          "Contact Person": order.customer_shipping_address.contactPerson || "N/A",
          "Contact Number": order.customer_shipping_address.contactNumber || "N/A",
          "AC Details": acDetails,
          "Customer Address": addressDisplay,
          "Installation Date": order.DateofInstallation ? new Date(order.DateofInstallation).toLocaleDateString() : "N/A",
          "Installation Time": order.TimeofInstallation || "N/A",
        };
      });
      
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Installations");
      XLSX.writeFile(wb, "installation_tasks.xlsx");
      toast.success("Download complete!");
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Download failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Extract unique AC types from data
  const uniqueACTypes = useMemo(() => {
    const typesSet = new Set<string>();
    originalData.forEach(order => {
      order.AcDetails.forEach(ac => {
        if (ac.ac_type) typesSet.add(ac.ac_type);
      });
    });
    return Array.from(typesSet);
  }, [originalData]);

  const applyFilters = useCallback(() => {
    let filtered = [...originalData];

    // Apply date filter
    if (startDate && endDate) {
      filtered = filtered.filter((order) => {
        if (!order.DateofInstallation) return false;
        const installDate = new Date(order.DateofInstallation);
        return installDate >= startDate && installDate <= endDate;
      });
    }

    // Apply AC model filter
    if (selectedModels.length > 0) {
      filtered = filtered.filter((order) => 
        order.AcDetails.some(ac => selectedModels.includes(ac.model))
      );
    }

    // Apply AC type filter
    if (selectedACTypes.length > 0) {
      filtered = filtered.filter((order) => 
        order.AcDetails.some(ac => selectedACTypes.includes(ac.ac_type))
      );
    }

    // Apply location filter
    if (selectedLocations.length > 0) {
      filtered = filtered.filter((order) => {
        const pincode = order.customer_shipping_address?.pincode;
        if (!pincode) return false;
        
        return selectedLocations.some((location) => 
          locationPinCodes[location as LocationKey]?.includes(pincode)
        );
      });
    }

    setFilteredData(filtered);
    toast.success(`${filtered.length} installations found`);
  }, [startDate, endDate, selectedModels, selectedACTypes, selectedLocations, originalData, setFilteredData]);

  useEffect(() => {
    if (isOpen) return; // Don't auto-apply when drawer opens
    
    // Apply filters automatically when filter values change
    if (startDate || endDate || selectedModels.length > 0 || selectedACTypes.length > 0 || selectedLocations.length > 0) {
      applyFilters();
    }
  }, [startDate, endDate, selectedModels, selectedACTypes, selectedLocations, applyFilters, isOpen]);

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
          onClick={handleClickOutside}
        >
          <div
            className="absolute right-0 h-full w-full max-w-md transform bg-white p-6 shadow-xl transition-transform duration-300 ease-in-out sm:w-96 rounded-l-2xl"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Installation Filters</h2>
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
                <h3 className="text-lg font-medium text-gray-900">Installation Date Range</h3>
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
                      className="w-full rounded-md border border-gray-300 p-2"
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
                      className="w-full rounded-md border border-gray-300 p-2"
                      dateFormat="yyyy-MM-dd"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900">AC Types</h3>
                <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                  {uniqueACTypes.map((type: any, index: any) => (
                    <label
                      key={index}
                      className="flex items-center space-x-2"
                    >
                      <input
                        type="checkbox"
                        checked={selectedACTypes.includes(type)}
                        onChange={() => handleACTypeToggle(type)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900">AC Models</h3>
                <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                  {acModels.map((modelInfo, index) => (
                    <label
                      key={index}
                      className="flex items-center space-x-2"
                    >
                      <input
                        type="checkbox"
                        checked={selectedModels.includes(modelInfo.model)}
                        onChange={() => handleModelToggle(modelInfo.model)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm">{modelInfo.display}</span>
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
                    disabled={!selectedModels.length && !selectedACTypes.length && !startDate && !endDate && !selectedLocations.length}
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
        </div>
      )}
    </div>
  );
};

export default InstallationFilterDrawer;