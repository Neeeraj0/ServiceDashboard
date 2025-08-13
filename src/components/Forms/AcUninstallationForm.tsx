"use client"

import { useEffect, useState, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectContent, SelectValue, SelectItem } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { X, ChevronLeft, ChevronRight, Search } from "lucide-react"
import axios from "axios"
import { useTechnicians } from "@/hooks/useTechnicians"
import toast from "react-hot-toast"
import { Technician } from "@/types/Technician"
import { useAuth } from "@/app/context/AuthContext"

type Props = {
  open: boolean
  onClose: () => void
  defaultDate: string
}

type Customer = {
  customer_id: string
  name: string
}

type ShippingAddress = {
  _id: string
  line1: string
  line2: string
  city: string
  state: string
  pincode: string
  contactNumber: string
  contactPerson: string
}

type CustomerDevice = {
  _id: string
  customer_id: string
  orderId: string
  email: string
  ac_type: string
  model: string
  addressid: string
  serialid: string
  deviceid: string
  mobile: string
}

const initialForm = {
  client_name: "",
  client_id: "",
  client_number: "",
  serviceType: "dry",
  nextServiceDate: "",
  endServiceDate: "",
  model: "S15",
  acType: "Split",
  serialId: "",
  deviceId: "",
  shippingAddress: "",
  isRecurring: false,
  quantity: "1",
  pmServiceCycle: "",
  pmServiceCycleError: "",
  address: {
    state: "Maharashtra",
    city: "",
    pincode: "",
    location: "",
  }
}

const steps = [
  { id: 1, title: "Find Customer", subtitle: "Search and select customer" },
  { id: 2, title: "Select Address", subtitle: "Choose service location" },
  { id: 3, title: "Choose AC Units", subtitle: "Select devices for service" },
  { id: 4, title: "Schedule Service", subtitle: "Set service details" }
]

const AcUninstallationForm = ({ open, onClose, defaultDate }: Props) => {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState(initialForm)
  const [suggestions, setSuggestions] = useState<Customer[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [customerDevices, setCustomerDevices] = useState<CustomerDevice[]>([])
  const [shippingAddresses, setShippingAddresses] = useState<ShippingAddress[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string>("")
  const [selectedDevices, setSelectedDevices] = useState<CustomerDevice[]>([])
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const technicians = useTechnicians();
  const [technicianName, setTechnicianName] = useState("");
  const [filteredTechnicians, setFilteredTechnicians] = useState<Technician[]>([]);
  const [selectedTechnicians, setSelectedTechnicians] = useState<Technician[]>([]);
  const [servicingTime, setServicingTime] = useState("");           // e.g. 09:00
  const [isSubmitting, setIsSubmitting] = useState(false);
  // const { userName } = useAuth ? useAuth() : { userName: "" }; 
  useEffect(() => {
    if (open) {
      setCurrentStep(1)
      setFormData({ ...initialForm, nextServiceDate: defaultDate, endServiceDate: defaultDate })
      setSearchTerm("")
      setSuggestions([])
      setCustomerDevices([])
      setShippingAddresses([])
      setSelectedAddressId("")
      setSelectedDevices([])
    }
  }, [open, defaultDate])

  const generateTimeOptions = (interval = 30) => {
  const options = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += interval) {
      options.push(
        `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`
      );
    }
  }
  return options;
};
const timeOptions = generateTimeOptions(30); 

const handleTechnicianInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const input = e.target.value;
  setTechnicianName(input);

  setFilteredTechnicians(
    technicians.filter((tech) =>
      tech.name.toLowerCase().includes(input.toLowerCase())
    )
  );
};

const handleSelectTechnician = (tech: Technician) => {
  if (!selectedTechnicians.some((t) => t.technician_id === tech.technician_id)) {
    setSelectedTechnicians((prev) => [...prev, tech]);
  }
  setTechnicianName("");
  setFilteredTechnicians([]);
};

const handleRemoveTechnician = (id: string) => {
  setSelectedTechnicians((prev) => prev.filter((t) => t.technician_id !== id));
};

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Simulate API calls with mock data
  useEffect(() => {
  const fetchCustomers = async () => {
    if (searchTerm.trim().length < 2) {
      setSuggestions([])
      return
    }
    try {
      const response = await axios.get(
        // `${process.env.NEXT_PUBLIC_CIRCOLIFE_PRODUCTION_API}/api/customers/findCustomer/${encodeURIComponent(searchTerm)}`
        `https://app.dev.circolife.vip/api/customers/findCustomer/${encodeURIComponent(searchTerm)}`
        // `http://35.154.99.208:5000/api/customers/findCustomer/${encodeURIComponent(searchTerm)}`
      );
      setSuggestions(response.data || []);
    } catch (error) {
      console.error("Error fetching customer suggestions:", error);
      setSuggestions([]);
    }
  };

  const debounceTimer = setTimeout(fetchCustomers, 300);
  return () => clearTimeout(debounceTimer);
}, [searchTerm]);

  // When address is selected, automatically select all devices associated with it
  useEffect(() => {
    if (selectedAddressId) {
      const devicesForAddress = customerDevices.filter(device => device.addressid === selectedAddressId)
      setSelectedDevices(devicesForAddress)

      if (devicesForAddress.length > 0) {
        const firstDevice = devicesForAddress[0]
        setFormData(prev => ({
          ...prev,
          address_id: firstDevice.addressid,
          client_number: firstDevice.mobile || prev.client_number,
          acType: firstDevice.ac_type || prev.acType,
          serialId: firstDevice.serialid || prev.serialId,
          deviceId: firstDevice.deviceid || prev.deviceId,
        }))
      }
    } else {
      setSelectedDevices([])
    }
  }, [selectedAddressId, customerDevices])

  const fetchCustomerDetails = async (customerId: string) => {
  try {
    const response = await axios.get(
      // `https://prodappapi.circolives.in/api/customers/customerdetails/info/${customerId}`
      `https://app.dev.circolife.vip/api/customers/customerdetails/info/${customerId}`
      // `http://35.154.99.208:5000/api/customers/customerdetails/info/${customerId}`
    );
    const { customerDetails, shippingAddress } = response.data;

    setCustomerDevices(customerDetails || []);
    setShippingAddresses(shippingAddress || []);
  } catch (error) {
    console.error("Failed fetching customer details:", error);
    setCustomerDevices([]);
    setShippingAddresses([]);
  }
};

  const selectAddress = (address: ShippingAddress) => {
    setSelectedAddressId(address._id)
    updateAddressFields(address)
  }

  const updateAddressFields = (address: ShippingAddress) => {
    const formattedAddress = `${address.line1}, ${address.line2}, ${address.city}, ${address.state}, ${address.pincode}`
    setFormData(prev => ({
      ...prev,
      shippingAddress: formattedAddress,
      address: {
        state: address.state || "Maharashtra",
        city: address.city || "",
        pincode: address.pincode || "",
        location: `${address.line1}, ${address.line2}` || "",
      }
    }))
  }

  const filteredDevices = selectedAddressId
    ? customerDevices.filter(device => device.addressid === selectedAddressId)
    : []

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    if (name === "client_name") {
      setSearchTerm(value)
      setShowSuggestions(true)
      setFormData(prev => ({ ...prev, client_name: value, client_id: "" }))
      setCustomerDevices([])
      setShippingAddresses([])
      setSelectedAddressId("")
      setSelectedDevices([])
    } else if (name === "pmServiceCycle") {
      if (value === '' || /^\d+$/.test(value)) {
        setFormData(prev => ({ 
          ...prev, 
          pmServiceCycle: value,
          pmServiceCycleError: ""
        }))
      } else {
        setFormData(prev => ({ 
          ...prev, 
          pmServiceCycleError: "Please enter numbers only" 
        }))
      }
    } else if (name.includes("address.")) {
      const key = name.split(".")[1]
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [key]: value,
        }
      }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleSelectCustomer = (customer: Customer) => {
    setFormData(prev => ({
      ...prev,
      client_name: customer.name,
      client_id: customer.customer_id
    }))
    setSearchTerm(customer.name)
    setShowSuggestions(false)
    fetchCustomerDetails(customer.customer_id)
  }

  const handleSelectChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 1:
        return formData.client_id !== ""
      case 2:
        return selectedAddressId !== ""
      case 3:
        return selectedDevices.length > 0
      case 4:
        return true
      default:
        return false
    }
  }

  const handleSubmit = async () => {
  setIsSubmitting(true);

  if (!formData.nextServiceDate || !servicingTime) {
    toast.error("Service date and time required");
    setIsSubmitting(false);
    return;
  }
  if (!selectedTechnicians.length) {
    toast.error("Please assign at least one technician");
    setIsSubmitting(false);
    return;
  }
  // Merge date & time to ISO string (as you do in AssignInstallation)
  const servicingDateTime = new Date(
    formData.nextServiceDate + "T" + servicingTime + ":00.000Z"
  ).toISOString();

  const deviceCountMap: Record<string, number> = {};

  // Prepare transformed AC units data
  const ac_units = filteredDevices.map((device) => {
  const model = device.model;
  deviceCountMap[model] = (deviceCountMap[model] || 0) + 1;
  const count = deviceCountMap[model];

  const deviceName = `${model}-${count}`; // e.g. "S15-1", "S15-2", etc.

  return {
    type: device.ac_type + " AC",
    capacity: model,
    orderId: device.orderId,
    quantity: 1,
    deviceName, // << your unique deviceName here
  };
});

console.log("ac_units:", ac_units);
  const totalQuantity = ac_units.length;

  // Address and contact info
  const selectedAddress = shippingAddresses.find(addr => addr._id === selectedAddressId);

  // Build the payload
  const taskDataCreation = {
    title: "Uninstallation",
    description: "Uninstallation task",
    servicingDate: servicingDateTime,
    status: "open",
    address: selectedAddress
      ? [{
          location: `${selectedAddress.line1}, ${selectedAddress.line2}, ${selectedAddress.city}, ${selectedAddress.state} - ${selectedAddress.pincode}`,
        }]
      : [],
    client_number: formData.client_number,
    client_name: formData.client_name,
    ac_units: ac_units,
    quantity: totalQuantity,
    taskType: "uninstallation",
    approvalPending: false,
    parentPreorder: null, // or include if you use preorder logic
    preOrderId: null,
    assignedTechnicians: selectedTechnicians.map((tech) => tech.name),
    contactPerson: selectedAddress
      ? {
          name: selectedAddress.contactPerson,
          phone_number: selectedAddress.contactNumber,
        }
      : { name: "", phone_number: "" },
    // assignedBy: userName ? [userName] : [],
  };

  console.log("payload:", taskDataCreation);

  try {
    await axios.post(`${process.env.NEXT_PUBLIC_SERVICE_BACKEND_API}/api/tasks`, taskDataCreation, {
    // await axios.post(`http://localhost:8080/api/tasks`, taskDataCreation, {
      headers: { "Content-Type": "application/json" },
    });
    toast.success("Uninstallation task assigned!");
    console.log("search term:", searchTerm);
    setFormData({ ...initialForm, nextServiceDate: defaultDate, endServiceDate: defaultDate });
    setSelectedAddressId("");
    setSelectedDevices([]);
    setSearchTerm("");
    setSelectedTechnicians([]);
    setTechnicianName("");
    setServicingTime("");
    setCurrentStep(1);
    onClose();
  } catch (error) {
    toast.error("Failed to assign task");
    console.error(error);
  }
  setIsSubmitting(false);
};


  const getDeviceCountByType = () => {
    if (!filteredDevices.length) return null

    const deviceTypeCount: Record<string, number> = {}
    filteredDevices.forEach(device => {
      const deviceType = `${device.ac_type} ${device.model}`
      deviceTypeCount[deviceType] = (deviceTypeCount[deviceType] || 0) + 1
    })
    return deviceTypeCount
  }

  if (!open) return null

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            {/* <div className="text-center mb-8">
              <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="130" height="130" viewBox="0 0 48 48">
                <linearGradient id="SVGID_1__Gk3Olb6r3F6E_gr1" x1="38.222" x2="10.027" y1="13.981" y2="42.176" gradientUnits="userSpaceOnUse"><stop offset=".014" stop-color="#fe6d60"></stop><stop offset=".046" stop-color="#fe766a"></stop><stop offset=".208" stop-color="#fea097"></stop><stop offset=".37" stop-color="#ffc2bd"></stop><stop offset=".532" stop-color="#ffddda"></stop><stop offset=".692" stop-color="#fff0ee"></stop><stop offset=".849" stop-color="#fffbfb"></stop><stop offset="1" stop-color="#fff"></stop></linearGradient><path fill="url(#SVGID_1__Gk3Olb6r3F6E_gr1)" d="M40.517,25.217h-2.903c0.563-1.547,0.886-3.21,0.886-4.953c0-8.008-6.492-14.5-14.5-14.5s-14.5,6.492-14.5,14.5	c0,1.742,0.323,3.405,0.886,4.953H7.983C7.44,25.217,7,25.658,7,26.201v11.319c0,2.172,1.761,3.933,3.933,3.933h26.634	c2.172,0,3.933-1.761,3.933-3.933V26.201C41.5,25.658,41.06,25.217,40.517,25.217z"></path><path fill="none" stroke="#e02f24" stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M18.917,7.416C20.499,6.824,22.212,6.5,24,6.5c8.008,0,14.5,6.492,14.5,14.5"></path><path fill="none" stroke="#e02f24" stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M9.5,21c0-3.239,1.062-6.23,2.857-8.643"></path><path fill="none" stroke="#e02f24" stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M32.34,41.5h-7.809H10.5c-2.209,0-4-1.791-4-4v-11c0-0.552,0.448-1,1-1h12.33"></path><path fill="none" stroke="#e02f24" stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M26.404,25.5H40.5c0.552,0,1,0.448,1,1v7.202"></path><path fill="none" stroke="#e02f24" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10" stroke-width="3" d="M24,17.5c1.933,0,3.5,1.567,3.5,3.5c0,0.242-0.024,0.478-0.071,0.705"></path><line x1="6.804" x2="41.196" y1="6.804" y2="41.196" fill="none" stroke="#e02f24" stroke-linecap="round" stroke-linejoin="round" stroke-width="3"></line>
              </svg>
              <h2 className="text-2xl font-semibold mb-2">Find Customer</h2>
              <p className="text-gray-600">Search for an existing customer</p>
            </div> */}

            <div className="rounded-lg p-6">
              <div className="flex items-center justify-center gap-6 mb-8">
                <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="130" height="130" viewBox="0 0 48 48">
                <linearGradient id="SVGID_1__Gk3Olb6r3F6E_gr1" x1="38.222" x2="10.027" y1="13.981" y2="42.176" gradientUnits="userSpaceOnUse"><stop offset=".014" stop-color="#fe6d60"></stop><stop offset=".046" stop-color="#fe766a"></stop><stop offset=".208" stop-color="#fea097"></stop><stop offset=".37" stop-color="#ffc2bd"></stop><stop offset=".532" stop-color="#ffddda"></stop><stop offset=".692" stop-color="#fff0ee"></stop><stop offset=".849" stop-color="#fffbfb"></stop><stop offset="1" stop-color="#fff"></stop></linearGradient><path fill="url(#SVGID_1__Gk3Olb6r3F6E_gr1)" d="M40.517,25.217h-2.903c0.563-1.547,0.886-3.21,0.886-4.953c0-8.008-6.492-14.5-14.5-14.5s-14.5,6.492-14.5,14.5	c0,1.742,0.323,3.405,0.886,4.953H7.983C7.44,25.217,7,25.658,7,26.201v11.319c0,2.172,1.761,3.933,3.933,3.933h26.634	c2.172,0,3.933-1.761,3.933-3.933V26.201C41.5,25.658,41.06,25.217,40.517,25.217z"></path><path fill="none" stroke="#e02f24" stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M18.917,7.416C20.499,6.824,22.212,6.5,24,6.5c8.008,0,14.5,6.492,14.5,14.5"></path><path fill="none" stroke="#e02f24" stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M9.5,21c0-3.239,1.062-6.23,2.857-8.643"></path><path fill="none" stroke="#e02f24" stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M32.34,41.5h-7.809H10.5c-2.209,0-4-1.791-4-4v-11c0-0.552,0.448-1,1-1h12.33"></path><path fill="none" stroke="#e02f24" stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M26.404,25.5H40.5c0.552,0,1,0.448,1,1v7.202"></path><path fill="none" stroke="#e02f24" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10" stroke-width="3" d="M24,17.5c1.933,0,3.5,1.567,3.5,3.5c0,0.242-0.024,0.478-0.071,0.705"></path><line x1="6.804" x2="41.196" y1="6.804" y2="41.196" fill="none" stroke="#e02f24" stroke-linecap="round" stroke-linejoin="round" stroke-width="3"></line>
              </svg>
                <div className="text-left">
                  <h2 className="text-2xl font-semibold mb-2">Find Customer</h2>
                  <p className="text-gray-600">Search for an existing customer</p>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <Input 
                id="client_name" 
                name="client_name" 
                className="text-lg py-3"
                value={searchTerm} 
                onChange={handleChange} 
                placeholder="Search customer by name" 
                onFocus={() => searchTerm && setShowSuggestions(true)}
              />
              
              {showSuggestions && suggestions.length > 0 && (
                <div 
                  ref={suggestionsRef}
                  className="absolute z-10 mt-2 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-y-auto"
                >
                  {suggestions.map((customer) => (
                    <div 
                      key={customer.customer_id} 
                      className="px-4 py-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                      onClick={() => handleSelectCustomer(customer)}
                    >
                      <div className="font-medium text-lg">{customer.name}</div>
                      <div className="text-sm text-gray-500">{customer.customer_id}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {formData.client_id && (
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <div className="flex items-center">
                  <div className="h-2 w-2 bg-green-500 rounded-full mr-3"></div>
                  <div>
                    <div className="font-medium text-green-800">{formData.client_name}</div>
                    <div className="text-sm text-green-600">Customer ID: {formData.client_id}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="h-12 w-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-semibold">2</span>
              </div>
              <h2 className="text-2xl font-semibold mb-2">Select Address</h2>
              <p className="text-gray-600">Choose the service location for this customer</p>
            </div>

            {shippingAddresses.length > 0 ? (
              <div className="space-y-3">
                {shippingAddresses.map((address) => (
                  <div 
                    key={address._id} 
                    className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                      selectedAddressId === address._id 
                        ? 'border-blue-500 bg-blue-50 shadow-md' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => selectAddress(address)}
                  >
                    <div className="flex items-start">
                      <input 
                        type="radio" 
                        name="addressSelection" 
                        checked={selectedAddressId === address._id}
                        onChange={() => selectAddress(address)}
                        className="mt-1 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <div className="ml-3 flex-1">
                        <div className="font-medium text-gray-900">
                          {address.line1}, {address.line2}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {address.city}, {address.state} - {address.pincode}
                        </div>
                        <div className="text-sm text-gray-500 mt-2">
                          <span className="font-medium">Contact:</span> {address.contactPerson} ({address.contactNumber})
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No addresses found for this customer</p>
              </div>
            )}
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="h-12 w-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-semibold">3</span>
              </div>
              <h2 className="text-2xl font-semibold mb-2">Choose AC Units</h2>
              <p className="text-gray-600">Select the devices that need servicing</p>
            </div>

            {selectedAddressId && filteredDevices.length > 0 ? (
              <>
                {/* Device Summary */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 mb-3">Selected Devices Summary</h3>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(getDeviceCountByType() || {}).map(([deviceType, count]) => (
                      <div key={deviceType} className="bg-white px-3 py-1 rounded-full text-sm">
                        <span className="font-medium">{deviceType}:</span> {count} unit{count > 1 ? 's' : ''}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Device Details */}
                <div className="space-y-3">
                  <h3 className="font-medium text-gray-900">Device Details</h3>
                  {filteredDevices.map((device) => (
                    <div 
                      key={device._id} 
                      className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                    >
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-600">Device ID:</span>
                          <div className="text-gray-900">{device.deviceid}</div>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">AC Type:</span>
                          <div className="text-gray-900">{device.ac_type}</div>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Model:</span>
                          <div className="text-gray-900">{device.model}</div>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Serial ID:</span>
                          <div className="text-gray-900">{device.serialid}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No devices found for the selected address</p>
              </div>
            )}
          </div>
        )

      case 4:
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="h-12 w-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-white font-semibold">4</span>
        </div>
        <h2 className="text-2xl font-semibold mb-2">Schedule Service</h2>
        <p className="text-gray-600">Assign technician and set service schedule</p>
      </div>

      <div className="grid gap-4">
        {/* Client info, dates etc as before */}
        <div className="grid gap-2">
          <Label htmlFor="client_number">Client Number</Label>
          <Input 
            id="client_number"
            name="client_number"
            value={formData.client_number}
            onChange={handleChange}
            placeholder="Client Number"
          />
        </div>

        {/* Technician select */}
        <div className="mb-2 relative">
          <Label>Technician Name</Label>
          <Input
            type="text"
            placeholder="Enter Name"
            value={technicianName}
            onChange={handleTechnicianInputChange}
          />
          {filteredTechnicians.length > 0 && (
            <ul className="absolute z-10 w-full bg-white border rounded max-h-48 overflow-y-auto shadow">
              {filteredTechnicians.map((tech) => (
                <li
                  key={tech.technician_id}
                  className="p-2 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSelectTechnician(tech)}
                >
                  {tech.name}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex flex-wrap gap-2 mb-3">
          {selectedTechnicians.map((tech) => (
            <span
              key={tech.technician_id}
              className="bg-blue-100 text-blue-800 px-3 py-1 rounded flex items-center"
            >
              {tech.name}
              <button
                onClick={() => handleRemoveTechnician(tech.technician_id)}
                className="ml-2 text-red-400"
                type="button"
              >×</button>
            </span>
          ))}
        </div>

        <div className="grid gap-2">
          <Label>Service Date</Label>
          <Input
            id="nextServiceDate"
            name="nextServiceDate"
            type="date"
            value={formData.nextServiceDate}
            onChange={handleChange}
          />
        </div>
        <div className="grid gap-2">
          <Label>Service Time</Label>
          <select
            className="form-control border px-2 py-1 rounded"
            value={servicingTime}
            onChange={(e) => setServicingTime(e.target.value)}
          >
            <option value="">Select Time</option>
            {timeOptions.map((time, idx) => (
              <option key={idx} value={time}>{time}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );

      default:
        return null
    }
  }

  return (
    <div className="w-full my-12 rounded-xl shadow-xl border bg-white">
      <div className="mx-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-semibold">Schedule a Uninstallation</h1>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="bg-gray-50 px-6 py-4">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex items-center">
                  <div className={`
                    flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium
                    ${currentStep >= step.id 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-300 text-gray-600'
                    }
                  `}>
                    {step.id}
                  </div>
                  <div className="ml-3 hidden sm:block">
                    <div className={`text-sm font-extrabold ${
                      currentStep >= step.id ? 'text-blue-600' : 'text-gray-500'
                    }`}>
                      {step.title}
                    </div>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-4 ${
                    currentStep > step.id ? 'bg-blue-500' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="px-6 py-8 min-h-[500px]">
          {renderStepContent()}
        </div>

        {/* Navigation Footer */}
        <div className="bg-white border-t border-gray-200 px-6 py-4">
          <div className="flex justify-between items-center">
            <Button 
              variant="outline" 
              className="cursor-pointer"
              onClick={prevStep} 
              disabled={currentStep === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            
            <div className="text-sm text-gray-500">
              Step {currentStep} of {steps.length}
            </div>
            
            {currentStep === 4 ? (
              <Button 
                onClick={handleSubmit}
                className="cursor-pointer"
                disabled={!canProceedToNextStep()}
              >
                Complete Service Event
              </Button>
            ) : (
              <Button 
                onClick={nextStep} 
                disabled={!canProceedToNextStep()}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AcUninstallationForm
