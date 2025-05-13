import { Info, X, Phone, Mail, MapPin, Calendar, CreditCard, Package, Clock, Heart, Tag, FileText, Loader } from "lucide-react";
import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "@/app/context/AuthContext";
import toast from "react-hot-toast";

interface CustomerInfoButtonProps {
  queryId?: string;
  customerId?: string;
  customerEmail?: string;
  customerName?: string;
  customerPhone?: string;
}

interface Address {
    flat?: string;
    area?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
  }

interface UserData {
  _id: string;
  Fullname?: string;
  mobile?: string;
  email?: string;
  flat?: string;
  area?: string;
  address?: Address;
  city?: string;
  state?: string;
  pincode?: string;
  kycStatus?: boolean;
  onBoardingDate?: string;
  createdAt?: string;
  devices?: string[];
  updatedAt?: string;
}

interface QueryData {
  _id: string;
  userid?: string;
  contactperson?: string;
  contactnumber?: string;
  contactemail?: string;
  subject?: string;
  summery?: string;
  queryStatus?: string;
  status?: boolean;
  TimeStamp: string;
  resolvenote?: string;
  resolvedAt?: string;
}

interface CustomerData {
  name: string;
  email: string;
  phone: string;
  address: string;
  joinDate: string;
  orders: number;
  lastOrder: string;
  favoriteItems: number;
  tags: string[];
  notes: string;
  deviceIds: string[];
}

export default function CustomerInfoButton({ 
  queryId, 
  customerId, 
  customerEmail, 
  customerName, 
  customerPhone 
}: CustomerInfoButtonProps) {
  const [showPanel, setShowPanel] = useState<boolean>(false);
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [note, setNote] = useState('');
  const {userName} = useAuth();

  const fetchCustomerData = async (): Promise<void> => {
    console.log("Fetching customer data for:", customerId || customerEmail);
    setLoading(true);
    setError(null);
    
    try {
      // Fetch customer data from the users collection using userId or email
      const res = await axios.get<{
        success: boolean;
        data: {
          user: UserData;
          queries: QueryData[];
          stats?: any;
        };
      }>(`https://production.circolife.vip/api/query/userInfo/${customerId || customerEmail}`, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('authToken')}`
        },
      });
      
      const userData = res.data.data.user;
      const queryHistory = res.data.data.queries || [];
      
      // Format the customer data
      const formattedCustomer: CustomerData = {
        name: userData.Fullname || customerName || "N/A",
        email: userData.email || customerEmail || "N/A",
        phone: userData.mobile || customerPhone || "N/A",
        address: formatAddress(userData),
        joinDate: formatDate(userData.onBoardingDate || userData.createdAt),
        orders: queryHistory.length,
        lastOrder: queryHistory.length > 0 ? 
          formatDate(queryHistory[0].TimeStamp) : "No orders",
        favoriteItems: userData.devices?.length || 0,
        tags: generateTags(userData, queryHistory),
        notes: extractRelevantNotes(queryHistory),
        deviceIds: userData.devices || []
      };
      
      setCustomer(formattedCustomer);
    } catch (err) {
      console.error("Error fetching customer data:", err);
      setError("Customer Not Found");
      
      if (customerName || customerEmail || customerPhone) {
        setCustomer({
          name: customerName || "N/A",
          email: customerEmail || "N/A",
          phone: customerPhone || "N/A",
          address: "N/A",
          joinDate: "N/A",
          orders: 0,
          lastOrder: "N/A",
          favoriteItems: 0,
          tags: ["New Customer"],
          notes: "No additional information available.",
          deviceIds: []
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const formatAddress = (userData: UserData | null): string => {
    if (!userData || !userData.address) return "N/A";
  
    const addr = userData.address;
  
    return [
      addr.flat,
      addr.area,
      addr.address,
      addr.city,
      addr.state,
      addr.pincode
    ]
      .filter((part): part is string => !!part && part.trim() !== "")
      .join(', ') || "Address not available";
  };
  
  
  const formatDate = (timestamp?: string): string => {
    if (!timestamp) return "N/A";
    try {
      const date = new Date(timestamp);
      return date.toLocaleDateString("en-IN", { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (e) {
      return "Invalid date";
    }
  };
  
  const generateTags = (userData: UserData, queryHistory: QueryData[]): string[] => {
    const tags: string[] = [];
    
    // User tenure
    if (userData.onBoardingDate || userData.createdAt) {
      const joinDate = new Date(userData.onBoardingDate || userData.createdAt || "");
      const monthsActive = Math.floor((new Date().getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
      
      if (monthsActive > 12) tags.push("Loyal");
      else if (monthsActive < 1) tags.push("New");
    }
    
    // Query frequency
    if (queryHistory.length > 10) tags.push("Recurring");
    if (queryHistory.length === 0) tags.push("First Contact");
    
    // KYC status
    if (userData.kycStatus) tags.push("KYC Verified");
    
    // Devices
    if (userData.devices && userData.devices.length > 0) tags.push("Has Devices");
    
    return tags.length > 0 ? tags : ["Customer"];
  };
  
  const extractRelevantNotes = (queryHistory: QueryData[]): string => {
    if (!queryHistory || queryHistory.length === 0) return "No previous interactions.";
    
    // Extract info from recent queries
    const recentQueries = queryHistory.slice(0, 3);
    
    const notes = recentQueries.map(query => {
      const date = formatDate(query.TimeStamp);
      const issue = query.subject || "Unknown issue";
      const status = query.queryStatus || (query.status ? "Open" : "Resolved");
      const resolution = query.resolvenote ? `Resolution: ${query.resolvenote}` : '';
      
      return `${date}: ${issue} (${status}). ${resolution}`;
    }).join('\n');
    
    return notes || "No specific notes available.";
  };

  useEffect(() => {
    if (showPanel) {
      console.log("Panel opened, fetching customer data...");
      fetchCustomerData();
    }
  }, [showPanel, customerId, customerEmail]);

  const handleContactInformationSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitting contact information:", note);
    try {
      const response = await axios.put(
        `https://production.circolife.vip/api/query/queries/${queryId}/contact-log`,
        {
          note,
          contactedBy: userName, // e.g. from context or auth
        },
        // {
        //   headers: {
        //     "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
        //     "Content-Type": "application/json"
        //   }
        // }
      );
  
      toast.success("Contact log added:", response.data);
      setShowContactDialog(false);
      setNote('');
    } catch (err) {
      console.error("Failed to log contact:", err);
      alert("Could not save contact log.");
    }
  }

  return (
    <div className="relative">
      <div className="relative inline-block group ml-10">
        <button
          type="button"
          onClick={() => setShowPanel(true)}
          className="rounded-full bg-blue-100 p-1.5 text-blue-600 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
          aria-label="View customer information"
        >
          <Info size={16} />
        </button>
        
        <div className="tooltip-info absolute bottom-full left-1/2 mb-2 -translate-x-1/2 transform opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200">
          <div className="rounded bg-gray-800 px-2 py-1 text-xs text-white shadow-lg">
            View customer details
            <div className="tooltip-arrow absolute left-1/2 top-full -ml-1 border-4 border-transparent border-t-gray-800"></div>
          </div>
        </div>
      </div>

      {showPanel && (
        <div className="fixed rounded-l-2xl inset-y-0 right-0 w-80 bg-white shadow-xl z-50 border-l border-gray-200 overflow-auto animate-slide-in-right">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Customer Profile</h3>
              <button 
                onClick={() => setShowPanel(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <X size={20} />
              </button>
            </div>
            
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader size={32} className="text-blue-500 animate-spin" />
                <p className="mt-4 text-gray-500">Loading customer data...</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 p-4 rounded-xl mb-6">
                <p className="text-red-600">{error}</p>
                <button 
                  onClick={fetchCustomerData} 
                  className="mt-2 text-sm text-blue-600 hover:underline"
                >
                  Retry
                </button>
              </div>
            ) : customer ? (
              <>
                {/* Customer name with gradient background */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl mb-6">
                  <h2 className="text-xl font-bold text-gray-800">{customer.name}</h2>
                  <p className="text-sm text-blue-600">{customer.email}</p>
                </div>
                
                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {customer.tags.map((tag, index) => (
                    <span key={index} className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center">
                      <Tag size={12} className="mr-1" />
                      {tag}
                    </span>
                  ))}
                </div>
                
                {/* Contact Information section */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Contact Information</h4>
                  <div className="space-y-3 bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-start">
                      <Phone size={16} className="text-gray-500 mt-1 mr-3 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-gray-500">Phone</p>
                        <a href={`tel:${customer.phone}`} className="text-sm text-blue-600 hover:underline">
                          {customer.phone}
                        </a>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <Mail size={16} className="text-gray-500 mt-1 mr-3 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-gray-500">Email</p>
                        <a href={`mailto:${customer.email}`} className="text-sm text-blue-600 hover:underline">
                          {customer.email}
                        </a>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <MapPin size={16} className="text-gray-500 mt-1 mr-3 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-gray-500">Address</p>
                        <p className="text-sm text-gray-800">{customer.address}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Customer Stats section */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Customer Stats</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center mb-1">
                        <Calendar size={14} className="text-indigo-500 mr-2" />
                        <p className="text-xs font-medium text-gray-500">Customer Since</p>
                      </div>
                      <p className="text-sm font-medium text-gray-800">{customer.joinDate}</p>
                    </div>
                    
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center mb-1">
                        <Package size={14} className="text-indigo-500 mr-2" />
                        <p className="text-xs font-medium text-gray-500">Total Tickets</p>
                      </div>
                      <p className="text-sm font-medium text-gray-800">{customer.orders}</p>
                    </div>
                    
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center mb-1">
                        <Clock size={14} className="text-indigo-500 mr-2" />
                        <p className="text-xs font-medium text-gray-500">Last Ticket</p>
                      </div>
                      <p className="text-sm font-medium text-gray-800">{customer.lastOrder}</p>
                    </div>
                  </div>
                </div>
                
                {/* Device IDs section (if available) */}
                {customer.deviceIds && customer.deviceIds.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                      Registered Devices
                    </h4>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <ul className="text-sm">
                        {customer.deviceIds.map((device, index) => (
                          <li key={index} className="py-1 border-b last:border-b-0 border-gray-100">
                            {device || "Unknown Device"}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
                
                {/* Notes section */}
                <div>
                  <h4 className="flex items-center text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    <FileText size={14} className="mr-2" />
                    Recent Interactions
                  </h4>
                  <div className="bg-yellow-50 p-3 rounded-lg border-l-4 border-yellow-300">
                    <p className="text-sm text-gray-700 whitespace-pre-line">{customer.notes}</p>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="mt-6 pt-6 border-t border-gray-200 cursor-pointer">
                  <a 
                    onClick={(e) => {
                        e.preventDefault();
                        setShowPanel(false);
                        setShowContactDialog(true);
                      }}
                    className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                  >
                    <Phone size={16} />
                    Contact Customer
                  </a>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No customer data available</p>
              </div>
            )}
          </div>
        </div>
      )}
      
      {showPanel && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-25 z-40 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setShowPanel(false)}
        />
      )}

        {showContactDialog && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-30 flex items-center justify-center">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative">
            <button 
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                onClick={() => setShowContactDialog(false)}
            >
                <X size={20} />
            </button>

            <h2 className="text-lg font-semibold text-gray-900 mb-4">Log Customer Contact</h2>

            <div className="bg-yellow-100 text-yellow-800 text-sm rounded-md p-3 mb-4 border-l-4 border-yellow-400">
                Your contact information will be logged and verified by the service head.
            </div>

            <form
                onSubmit={handleContactInformationSubmission}
                className="space-y-4"
            >
                <label className="block text-sm font-medium text-gray-700 mb-1">
                Interaction Note
                </label>
                <textarea
                className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-blue-500 focus:border-blue-500 resize-none"
                rows={4}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                required
                />

                <button
                onSubmit={() => handleContactInformationSubmission}
                type="submit"
                className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md font-medium"
                >
                Submit Log
                </button>
            </form>
            </div>
        </div>
        )}

    </div>
  );
}