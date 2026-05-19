import React, { useState, useCallback, useMemo } from 'react';
import { format } from 'date-fns';
import DatePicker from 'react-datepicker';
import { FiFilter, FiX, FiDownload } from 'react-icons/fi';
import { Calendar1, RotateCcwIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import locationPinCodes, { LocationKey } from '@/types/filters/LocationKeys';
import axios from 'axios';

interface ACModel {
  model: string;
  display: string;
}

const acModels: ACModel[] = [
  { model: 'S10', display: 'Split 1T' },
  { model: 'S15', display: 'Split 1.5T' },
  { model: 'S20', display: 'Split 2T' },
  { model: 'S30', display: 'Split 3T' },
  { model: 'C10', display: 'Cassette 1T' },
  { model: 'C15', display: 'Cassette 1.5T' },
  { model: 'C20', display: 'Cassette 2T' },
  { model: 'C30', display: 'Cassette 3T' },
];

export interface InstallationFilters {
  startDate: string | null;
  endDate: string | null;
  models: string[];
  acTypes: string[];
  locations: string[];
  pincodes: string[];
}

interface InstallationFilterDrawerProps {
  onFilterChange: (filters: InstallationFilters) => void;
}

const emptyFilters: InstallationFilters = {
  startDate: null,
  endDate: null,
  models: [],
  acTypes: [],
  locations: [],
  pincodes: [],
};

const InstallationFilterDrawer: React.FC<InstallationFilterDrawerProps> = ({
  onFilterChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [selectedACTypes, setSelectedACTypes] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [downloadLoading, setDownloadLoading] = useState(false);

  const hasActiveFilters =
    !!startDate ||
    !!endDate ||
    selectedModels.length > 0 ||
    selectedACTypes.length > 0 ||
    selectedLocations.length > 0;

  const handleClickOutside = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).classList.contains('overlay')) {
      setIsOpen(false);
    }
  };

  const handleModelToggle = (value: string) => {
    setSelectedModels(prev =>
      prev.includes(value) ? prev.filter(m => m !== value) : [...prev, value]
    );
  };

  const handleACTypeToggle = (value: string) => {
    setSelectedACTypes(prev =>
      prev.includes(value) ? prev.filter(t => t !== value) : [...prev, value]
    );
  };

  const handleLocationToggle = (value: string) => {
    setSelectedLocations(prev =>
      prev.includes(value) ? prev.filter(l => l !== value) : [...prev, value]
    );
  };

  const derivedPincodes = useMemo(() => {
    return selectedLocations.flatMap((loc) => locationPinCodes[loc as LocationKey] ?? []);
  }, [selectedLocations]);

  const buildFilters = useCallback((): InstallationFilters => {
    return {
      startDate: startDate ? format(startDate, 'yyyy-MM-dd') : null,
      endDate: endDate ? format(endDate, 'yyyy-MM-dd') : null,
      models: selectedModels,
      acTypes: selectedACTypes,
      locations: selectedLocations,
      pincodes: derivedPincodes,
    };
  }, [startDate, endDate, selectedModels, selectedACTypes, selectedLocations, derivedPincodes]);

  const applyFilters = () => {
    onFilterChange(buildFilters());
    toast.success('Filters applied');
    setIsOpen(false);
  };

  const resetFilters = () => {
    setStartDate(null);
    setEndDate(null);
    setSelectedModels([]);
    setSelectedACTypes([]);
    setSelectedLocations([]);
    onFilterChange(emptyFilters);
    toast.success('Filters reset');
  };

  const uniqueACTypes = ['Split', 'Cassette'];

  const downloadExcel = async () => {
    try {
      setDownloadLoading(true);
      toast.success('Preparing download...');

      const filters = buildFilters();
      const requestBody: Record<string, any> = {
        page: 1,
        limit: 100000,
        orderingStatus: true,
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
        ...(filters.models.length && { models: filters.models }),
        ...(filters.acTypes.length && { acTypes: filters.acTypes }),
        ...(filters.pincodes.length && { pincodes: filters.pincodes }),
      };

      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_SALES_BACKEND_API}/api/preOrder/filter/data`,
        requestBody,
        {
          headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_SALES_BACKEND_TOKEN}`,
          },
        }
      );

      const data = res.data.data ?? res.data;
      const XLSX = await import('xlsx');

      const exportData = data.map((order: any) => {
        const acDetails = order.AcDetails.map(
          (ac: any) => `${ac.ac_type} ${ac.model} (${ac.quantity})`
        ).join(', ');

        const addr = order.customer_shipping_address;
        const addressDisplay = addr
          ? [addr.address_line1, addr.address_line2, addr.city, addr.state, addr.pincode]
              .filter(Boolean)
              .join(', ')
          : 'N/A';

        return {
          'Task ID': order._id,
          Customer: order.customer.name,
          'Contact Person': addr?.contactPerson || 'N/A',
          'Contact Number': addr?.contactNumber || 'N/A',
          'AC Details': acDetails,
          'Customer Address': addressDisplay,
          'Installation Date': order.DateofInstallation
            ? new Date(order.DateofInstallation).toLocaleDateString()
            : 'N/A',
          'Installation Time': order.TimeofInstallation || 'N/A',
        };
      });

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Installations');
      XLSX.writeFile(wb, 'installation_tasks.xlsx');
      toast.success('Download complete!');
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Download failed. Please try again.');
    } finally {
      setDownloadLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className={`inline-flex w-fit justify-center gap-x-1.5 rounded-full px-2 py-2 font-semibold text-white text-xl ring-1 shadow-xs ring-inset ring-gray-300 ${
          hasActiveFilters ? 'bg-[#7a2f72]' : 'bg-[#A14996]'
        }`}
        aria-label="Toggle filter drawer"
      >
        <FiFilter className="h-4 w-4 mr-1" />
        {hasActiveFilters && (
          <span className="text-xs font-bold leading-none">
            {[selectedModels, selectedACTypes, selectedLocations].flat().length +
              (startDate ? 1 : 0) +
              (endDate ? 1 : 0)}
          </span>
        )}
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
                <div className="mt-2 space-y-2">
                  {uniqueACTypes.map(type => (
                    <label key={type} className="flex items-center space-x-2">
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
                  {acModels.map(modelInfo => (
                    <label key={modelInfo.model} className="flex items-center space-x-2">
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
                  {Object.keys(locationPinCodes).map(location => (
                    <label key={location} className="flex items-center space-x-2">
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
                  <button
                    onClick={resetFilters}
                    className="w-full rounded-md bg-gray-300 px-4 py-2 mt-2 text-sm flex items-center justify-center gap-2"
                  >
                    <RotateCcwIcon className="text-gray-700" />
                    Reset Filters
                  </button>
                  <button
                    onClick={applyFilters}
                    disabled={!hasActiveFilters}
                    className="w-full bg-blue-600 text-white px-4 py-2 mt-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Apply Filters
                  </button>
                </div>

                <button
                  onClick={downloadExcel}
                  disabled={downloadLoading}
                  className="w-full mt-4 flex items-center justify-center rounded-md bg-green-200 px-4 py-2 text-sm font-medium text-green-800 hover:bg-green-300 border-2 border-green-300"
                >
                  {downloadLoading ? (
                    'Preparing download...'
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