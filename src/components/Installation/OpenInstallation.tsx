import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import AssignInstallation from '../Dialogs/AssignInstallation';
import SearchBox from '../SearchBox/SearchBox';
import { useRefresh } from '@/app/context/RefreshContext';
import toast from 'react-hot-toast';
import { formatDate } from '../utils/dateUtils';
import InstallationFilterDrawer, {
  InstallationFilters,
} from '../Filters/OpenInstallationFilters';
import Pagination from '../Pagination';
import ErrorPage from '../ErrorPage/Error';

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

const defaultInstallationFilters: InstallationFilters = {
  startDate: null,
  endDate: null,
  models: [],
  acTypes: [],
  locations: [],
  pincodes: [],
};

const OpenInstallation = () => {
  const [allPreorderData, setAllPreorderData] = useState<PreorderResponse[]>([]);
  const [filteredPreorders, setFilteredPreorders] = useState<PreorderResponse[]>([]);
  const [assignedTasks, setAssignedTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [hasAssignAccess, setHasAssignAccess] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [installationFilters, setInstallationFilters] =
    useState<InstallationFilters>(defaultInstallationFilters);

  const { triggerRefresh, refreshKey } = useRefresh();

  const itemsPerPage = 10;

  const modelToTonnage: { [key: string]: string } = {
    S10: 'Split 1T',
    S15: 'Split 1.5T',
    S20: 'Split 2T',
    S30: 'Split 3T',
    C10: 'Cassette 1T',
    C15: 'Cassette 1.5T',
    C20: 'Cassette 2T',
    C30: 'Cassette 3T',
    C40: 'Cassette 4T',
  };

  useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedSearch(searchQuery);
  }, 500);

  return () => clearTimeout(timer);
}, [searchQuery]);

  useEffect(() => {
    const checkUserAccess = () => {
      const token = localStorage.getItem('authToken');

      if (token) {
        try {
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');

          const jsonPayload = decodeURIComponent(
            atob(base64)
              .split('')
              .map((c) => {
                return `%${('00' + c.charCodeAt(0).toString(16)).slice(-2)}`;
              })
              .join('')
          );

          const decodedToken = JSON.parse(jsonPayload);
          setHasAssignAccess(decodedToken.role !== 'viewAccess');
        } catch (err) {
          console.error('Error decoding token:', err);
          setHasAssignAccess(false);
        }
      }
    };

    checkUserAccess();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const requestBody: Record<string, any> = {
          endDate: installationFilters.endDate || '',
          limit: itemsPerPage,
          page: currentPage,
          searchText: debouncedSearch,
          startDate: installationFilters.startDate || '',
          tokenStatus: '',
          verificationStatus: '',
          orderingStatus: true,
        };

        if (installationFilters.models.length > 0) {
          requestBody.models = installationFilters.models;
        }

        if (installationFilters.acTypes.length > 0) {
          requestBody.acTypes = installationFilters.acTypes;
        }

        if (installationFilters.pincodes.length > 0) {
          requestBody.pincodes = installationFilters.pincodes;
        }

        const [preordersRes] = await Promise.all([
          axios.post(
            `${process.env.NEXT_PUBLIC_SALES_BACKEND_API}/api/preOrder/get/filter/data`,
            requestBody,
            {
              headers: {
                Authorization: `Bearer ${process.env.NEXT_PUBLIC_SALES_BACKEND_TOKEN}`,
              },
            }
          )
        ]);

        const preorderList: PreorderResponse[] =
          preordersRes.data?.data ||
          preordersRes.data?.preorders ||
          preordersRes.data?.orders ||
          [];

        const total =
          preordersRes.data?.pagination?.total ||
          preordersRes.data?.total ||
          preordersRes.data?.totalCount ||
          preordersRes.data?.count ||
          preorderList.length;

        const ordersWithOrderingStatus = preorderList.filter(
          (order: PreorderResponse) =>
            order.AcDetails?.length > 0 && order.orderingStatus === true
        );  

        setAllPreorderData(ordersWithOrderingStatus);
        setFilteredPreorders(ordersWithOrderingStatus);
        setTotalItems(total);
      } catch (err: any) {
        console.error('Error fetching data:', err);
        setError(err.response?.data || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [refreshKey, currentPage, debouncedSearch, installationFilters]);

  const formatACDetails = (acDetails: PreorderResponse['AcDetails']) => {
    const groupedDetails: Record<string, { quantity: number; tonnage: string }> = {};

    acDetails.forEach((ac) => {
      const tonnage = modelToTonnage[ac.model] || ac.model;

      if (!groupedDetails[ac.model]) {
        groupedDetails[ac.model] = { quantity: 0, tonnage };
      }

      groupedDetails[ac.model].quantity += ac.quantity;
    });

    return Object.values(groupedDetails)
      .map(({ tonnage, quantity }) => `${tonnage} (${quantity})`)
      .join(', ');
  };

  const handleTaskAssigned = useCallback((id: string) => {
    setRemovingId(id);

    setTimeout(() => {
      setFilteredPreorders((prev) => prev.filter((task) => task._id !== id));
      setRemovingId(null);
    }, 300);
  }, []);

  const paginate = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleFilterChange = (filters: InstallationFilters) => {
    setInstallationFilters(filters);
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    toast.success('Data Refreshed Successfully');
    triggerRefresh();
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <ErrorPage error={error} />;

  const currentOrders = filteredPreorders;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex-grow">
          <SearchBox
            placeholder="Search by customer name"
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>

        <div className="flex gap-2 ml-[auto]">
          <button
            onClick={handleRefresh}
            className="p-2 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200"
            title="Refresh data"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M23 4v6h-6" />
              <path d="M1 20v-6h6" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
          </button>

          <InstallationFilterDrawer onFilterChange={handleFilterChange} />
        </div>
      </div>

      <table className="w-full text-left table-auto min-w-max">
        <thead>
          <tr>
            <th className="p-4 border-y border-blue-gray-100 bg-blue-gray-50/50 text-sm">
              Task ID
            </th>
            <th className="p-4 border-y border-blue-gray-100 bg-blue-gray-50/50 text-sm">
              Contact Person
            </th>
            <th className="p-4 border-y border-blue-gray-100 bg-blue-gray-50/50 text-sm">
              Customer Details
            </th>
            <th className="p-4 border-y border-blue-gray-100 bg-blue-gray-50/50 text-sm">
              AC Details
            </th>
            <th className="p-4 border-y border-blue-gray-100 bg-blue-gray-50/50 text-sm">
              Customer Address
            </th>
            <th className="p-4 border-y border-blue-gray-100 bg-blue-gray-50/50 text-sm max-w-40">
              Installation Date & Time
            </th>
            {hasAssignAccess && (
              <th className="p-4 border-y border-blue-gray-100 bg-blue-gray-50/50 text-sm">
                Action
              </th>
            )}
          </tr>
        </thead>

        <tbody>
          {currentOrders.length === 0 ? (
            <tr>
              <td colSpan={9} className="text-center">
                No preorders available
              </td>
            </tr>
          ) : (
            currentOrders.map((order, index) => {
              const serialNumber = (currentPage - 1) * itemsPerPage + index + 1;

              const acUnits = order.AcDetails.map((ac) => ({
                type: `${ac.ac_type} AC`,
                capacity: ac.model,
                quantity: ac.quantity,
              }));

              const formattedDateTime = formatDate(order.DateofInstallation);

              const shippingAddress = order.customer_shipping_address;

              const address = shippingAddress
                ? [
                    shippingAddress.address_line1,
                    shippingAddress.address_line2,
                    shippingAddress.city,
                    shippingAddress.state,
                    shippingAddress.pincode,
                  ]
                    .filter(Boolean)
                    .join(', ')
                : 'N/A';

              return (
                <tr
                  key={order._id}
                  className={removingId === order._id ? 'fade-out' : ''}
                >
                  <td className="p-2 border-b border-blue-gray-50 text-sm">
                    {serialNumber}
                  </td>

                  <td className="p-2 border-b border-blue-gray-50 text-sm">
                    {shippingAddress?.contactPerson && shippingAddress?.contactNumber ? (
                      <>
                        {shippingAddress.contactPerson}
                        <br />
                        {shippingAddress.contactNumber}
                      </>
                    ) : (
                      <div className="flex items-center justify-center text-red-500 font-extrabold bg-red-100 px-2 py-1 rounded-md shadow-[0_0_5px_rgba(239,68,68,0.5)] h-full w-fit text-xs">
                        Not Mentioned
                      </div>
                    )}
                  </td>

                  <td className="p-2 border-b border-blue-gray-50 text-sm whitespace-normal w-50">
                    {order.customer?.name || 'N/A'}
                  </td>

                  <td className="p-2 border-b border-blue-gray-50 text-sm whitespace-pre-line w-40">
                    {formatACDetails(order.AcDetails)}
                  </td>

                  <td className="p-2 border-b border-blue-gray-50 text-sm whitespace-normal w-40">
                    {address}
                  </td>

                  <td className="p-2 border-b border-blue-gray-50 text-sm">
                    {formattedDateTime.date}
                    <br />
                    {order.TimeofInstallation || 'N/A'}
                  </td>

                  {hasAssignAccess && (
                    <td className="p-2 border-b border-blue-gray-50 text-sm relative dropdown-container">
                      <AssignInstallation
                        preOrderId={order._id}
                        parentPreOrderId={order.parentPreorder}
                        clientName={order.customer?.name || ''}
                        clientNumber={order.customer?.mobile || ''}
                        description=""
                        onTaskAssigned={handleTaskAssigned}
                        ac_units={acUnits}
                        addressDisplay={address}
                        contactName={shippingAddress?.contactPerson || ''}
                        contactNumber={shippingAddress?.contactNumber || ''}
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
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        paginate={paginate}
      />
    </div>
  );
};

export default OpenInstallation;