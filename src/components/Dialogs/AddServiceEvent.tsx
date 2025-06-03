"use client"

import { useEffect, useState, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectContent, SelectValue, SelectItem } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import toast from "react-hot-toast"
import axios from "axios"
import { X } from "lucide-react"

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
  quantity: "1", // Default quantity to 1
  pmServiceCycle: "",
  pmServiceCycleError: "", // Added error state for PM Service Cycle
  address: {
    state: "Maharashtra",
    city: "",
    pincode: "",
    location: "",
  }
}

const AddServiceEventModal = ({ open, onClose, defaultDate }: Props) => {
  const [formData, setFormData] = useState(initialForm)
  const [suggestions, setSuggestions] = useState<Customer[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [customerDevices, setCustomerDevices] = useState<CustomerDevice[]>([])
  const [shippingAddresses, setShippingAddresses] = useState<ShippingAddress[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string>("")
  const [selectedDevices, setSelectedDevices] = useState<CustomerDevice[]>([])
  console.log("selected device", selectedDevices);
  const suggestionsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      setFormData({ ...initialForm, nextServiceDate: defaultDate, endServiceDate: defaultDate })
      setSearchTerm("")
      setSuggestions([])
      setCustomerDevices([])
      setShippingAddresses([])
      setSelectedAddressId("")
      setSelectedDevices([])
    }
  }, [open, defaultDate])

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

  useEffect(() => {
    const fetchCustomers = async () => {
      if (searchTerm.trim().length < 2) {
        setSuggestions([])
        return
      }

      try {
        // const response = await axios.get(`http://localhost:5000/api/customers/findCustomer/${encodeURIComponent(searchTerm)}`)
        const response = await axios.get(`${process.env.NEXT_PUBLIC_CIRCOLIFE_PRODUCTION_API}/api/customers/findCustomer/${encodeURIComponent(searchTerm)}`)
        setSuggestions(response.data || [])
      } catch (error) {
        console.error("Error fetching customer suggestions:", error)
        setSuggestions([])
      }
    }

    const debounceTimer = setTimeout(() => {
      fetchCustomers()
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [searchTerm])

  // When address is selected, automatically select all devices associated with it
  useEffect(() => {
    if (selectedAddressId) {
      const devicesForAddress = customerDevices.filter(device => device.addressid === selectedAddressId)
      setSelectedDevices(devicesForAddress)

      // If there's at least one device, populate form with first device details
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
      // const response = await axios.get(`http://localhost:5000/api/customers/customerdetails/info/${customerId}`)
      const response = await axios.get(`${process.env.NEXT_PUBLIC_CIRCOLIFE_PRODUCTION_API}/api/customers/customerdetails/info/${customerId}`)

      if (response.data) {
        const { customerDetails, shippingAddress } = response.data;
        
        if (Array.isArray(customerDetails)) {
          setCustomerDevices(customerDetails);
        }
        
        if (Array.isArray(shippingAddress)) {
          setShippingAddresses(shippingAddress);
        }
      }
    } catch (error) {
      console.error("Error fetching customer details:", error)
      toast.error("Could not fetch customer details")
    }
  }

  const selectAddress = (address: ShippingAddress) => {
    setSelectedAddressId(address._id);
    updateAddressFields(address);
  }

  const updateAddressFields = (address: ShippingAddress) => {
    const formattedAddress = `${address.line1}, ${address.line2}, ${address.city}, ${address.state}, ${address.pincode}`;
    setFormData(prev => ({
      ...prev,
      shippingAddress: formattedAddress,
      address: {
        state: address.state || "Maharashtra",
        city: address.city || "",
        pincode: address.pincode || "",
        location: `${address.line1}, ${address.line2}` || "",
      }

    }));
    console.log('address', address);
  }

  const handleDeviceSelection = (device: CustomerDevice) => {
    setFormData(prev => ({
      ...prev,
      client_number: device.mobile || prev.client_number,
      acType: device.ac_type || prev.acType,
      serialId: device.serialid || prev.serialId,
      deviceId: device.deviceid || prev.deviceId,
    }));
  }

  // Filter devices based on selected address ID
  const filteredDevices = selectedAddressId
    ? customerDevices.filter(device => device.addressid === selectedAddressId)
    : [];

  if (!open) return null

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    if (name === "client_name") {
      setSearchTerm(value)
      setShowSuggestions(true)
      setFormData(prev => ({ ...prev, client_name: value, client_id: "" }))
      // Clear customer data when searching for a new customer
      setCustomerDevices([])
      setShippingAddresses([])
      setSelectedAddressId("")
      setSelectedDevices([])
    } else if (name === "pmServiceCycle") {
      // Validate that input is only numbers
      if (value === '' || /^\d+$/.test(value)) {
        setFormData(prev => ({ 
          ...prev, 
          pmServiceCycle: value,
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

    // Fetch customer details
    fetchCustomerDetails(customer.customer_id)
  }

  const handleSelectChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async () => {
    if (!selectedDevices.length) {
      toast.error("No devices selected for the address");
      return;
    }

    const requiredFields = [
      "client_name", "client_number", "serviceType",
      "nextServiceDate", "shippingAddress"
    ];

    if (formData.isRecurring) {
      requiredFields.push("endServiceDate");
    }

    for (const field of requiredFields) {
      if (!formData[field as keyof typeof formData]) {
        toast.error(`Missing field: ${field}`);
        return;
      }
    }

    if (
      formData.isRecurring &&
      new Date(formData.endServiceDate) <= new Date(formData.nextServiceDate)
    ) {
      toast.error("End date must be after start date");
      return;
    }

    // Check if PM Service Cycle has an error
    if (formData.pmServiceCycleError) {
      toast.error("Please fix the PM Service Cycle field");
      return;
    }

    try {
      const devices = selectedDevices.map(device => ({
        serialId: device.serialid || "",
        deviceId: device.deviceid,
        model: device.model,
        acType: device.ac_type
      }));

      const { quantity, model, pmServiceCycleError, deviceId, ...restFormData } = formData;

      const payload = {
        ...restFormData,
        address: formData.address,
        nextServiceDate: "",
        pmServiceCycleStart: formData.nextServiceDate,
        pmServiceCycleEnd: formData.endServiceDate,
        pmServiceCycle: formData.pmServiceCycle,
        lastProcessed: new Date(),
        customer_id: formData.client_id,
        devices
      };

      console.log("pm service payload", payload);
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVICE_BACKEND_API}/api/routine/createPmServiceEvent`,
        payload
      );
      console.log(response);
      if (response.status === 201) {
        toast.success(`Service events created for ${devices.length} device(s)`);
        onClose();
      } else if (response.status === 400) {
        toast.error(response.data.message || "Failed to create service events");
      }
    } catch (err) {
      console.error(err);
      if (axios.isAxiosError(err)) {
        const errorMessage = err.response?.data?.message || "Failed to create service events";
        toast.error(errorMessage);
      } else {
        toast.error("An unexpected error occurred");
      }
    }
  };

  const determineModel = (acType: string, tonnage: string) => {
    if (acType === "Split") {
      switch(tonnage) {
        case "1": return "S10";
        case "1.5": return "S15";
        case "2": return "S20";
        default: return "S15";
      }
    } else if (acType === "Cassette") {
      switch(tonnage) {
        case "2": return "C20";
        case "3": return "C30";
        default: return "C20";
      }
    }

    // Default fallback
    return acType === "Split" ? "S15" : "C20";
  }

  // Organize device information by type for better display
  const getDeviceCountByType = () => {
    if (!filteredDevices.length) return null;

    const deviceTypeCount: Record<string, number> = {};

    filteredDevices.forEach(device => {
      const deviceType = `${device.ac_type} ${device.model}`;
      deviceTypeCount[deviceType] = (deviceTypeCount[deviceType] || 0) + 1;
    });

    return deviceTypeCount;
  }

  const deviceCounts = getDeviceCountByType();

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
      <div className="max-w-screen-xl mx-auto px-6 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-semibold">Add New Service Event</h1>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="grid gap-4">
          {/* Client Name with Autocomplete */}
          <div className="grid grid-cols-1 gap-1 relative">
            <Label htmlFor="client_name">Client Name</Label>
            <Input 
              id="client_name" 
              name="client_name" 
              className=""
              value={searchTerm} 
              onChange={handleChange} 
              placeholder="Search clients..." 
              onFocus={() => searchTerm && setShowSuggestions(true)}
            />
            
            {showSuggestions && suggestions.length > 0 && (
              <div 
                ref={suggestionsRef}
                className="absolute z-10 mt-14 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-y-auto"
              >
                {suggestions.map((customer) => (
                  <div 
                    key={customer.customer_id} 
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => handleSelectCustomer(customer)}
                  >
                    <div className="font-medium">{customer.name}</div>
                    <div className="text-xs text-gray-500">{customer.customer_id}</div>
                  </div>
                ))}
              </div>
            )}
            
            {formData.client_id && (
              <div className="text-xs text-gray-500 mt-1">
                Selected Customer ID: {formData.client_id}
              </div>
            )}
          </div>

          {/* Shipping Address Selection */}
          {shippingAddresses.length > 0 && (
            <div className="mt-4 mb-2">
              <h2 className="text-lg font-medium mb-2">Shipping Addresses</h2>
              <div className="border rounded-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Select</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">City</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">State</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact Person</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact Number</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {shippingAddresses.map((address) => (
                      <tr 
                        key={address._id} 
                        className={`hover:bg-gray-50 cursor-pointer ${selectedAddressId === address._id ? 'bg-blue-50' : ''}`}
                        onClick={() => selectAddress(address)}
                      >
                        <td className="px-4 py-2">
                          <input 
                            type="radio" 
                            name="addressSelection" 
                            checked={selectedAddressId === address._id}
                            onChange={() => selectAddress(address)}
                            className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {address.line1}, {address.line2}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">{address.city}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{address.state}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{address.contactPerson}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{address.contactNumber}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Device Summary when address is selected */}
          {selectedAddressId && deviceCounts && (
            <div className="mt-4 p-4 border border-gray-200 rounded-md">
              <h2 className="text-md font-medium mb-2">Selected Devices Summary</h2>
              <div className="flex flex-wrap gap-4">
                {Object.entries(deviceCounts).map(([deviceType, count]) => (
                  <div key={deviceType} className="bg-blue-50 px-3 py-2 rounded-md">
                    <span className="font-medium">{deviceType}:</span> {count} device{count > 1 ? 's' : ''}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Customer Devices - Only show when address is selected */}
          {selectedAddressId && filteredDevices.length > 0 && (
            <div className="mt-4 mb-2">
              <h2 className="text-lg font-medium mb-2">Device Details for Selected Address</h2>
              <div className="border rounded-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Device ID</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AC Type</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Model</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serial ID</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mobile</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredDevices.map((device) => (
                      <tr 
                        key={device._id} 
                        className="hover:bg-gray-50"
                      >
                        <td className="px-4 py-2 text-sm text-gray-900">{device.deviceid}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{device.ac_type}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{device.model}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{device.serialid}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{device.mobile}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Show message when address is selected but no devices are found */}
          {selectedAddressId && filteredDevices.length === 0 && (
            <div className="mt-4 p-4 border border-gray-200 rounded-md bg-gray-50">
              <p className="text-sm text-gray-600">No devices found for the selected address.</p>
            </div>
          )}

          <InputBlock label="Client Number" name="client_number" value={formData.client_number} onChange={handleChange} />

          <SelectBlock label="Service Type" name="serviceType" value={formData.serviceType} onChange={handleSelectChange} options={["dry", "wet", "maintenance"]} />
          
          {/* PM Service Cycle with numerical validation */}
          {/* <div className="grid gap-1">
            <Label htmlFor="pmServiceCycle">PM Service Cycle</Label>
            <Input 
              id="pmServiceCycle" 
              name="pmServiceCycle" 
              value={formData.pmServiceCycle} 
              onChange={handleChange} 
              placeholder="Enter numbers only" 
            />
            {formData.pmServiceCycleError && (
              <div className="text-xs text-red-500 mt-1">{formData.pmServiceCycleError}</div>
            )}
          </div> */}

          {/* Service Date Section */}
          <div className="grid gap-1">
            <Label htmlFor="serviceDates">Service Date{formData.isRecurring ? " Range" : ""}</Label>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Input 
                  id="nextServiceDate" 
                  name="nextServiceDate" 
                  type="date" 
                  value={formData.nextServiceDate} 
                  onChange={handleChange} 
                  placeholder="Start Date" 
                />
                {formData.nextServiceDate && <div className="text-xs text-gray-500 mt-1">Start Date</div>}
              </div>
              
              {formData.isRecurring && (
                <>
                  <div className="flex items-center justify-center">
                    <span className="font-medium text-gray-700">To</span>
                  </div>
                  <div className="flex-1">
                    <Input 
                      id="endServiceDate" 
                      name="endServiceDate" 
                      type="date" 
                      value={formData.endServiceDate} 
                      onChange={handleChange} 
                      placeholder="End Date" 
                    />
                    <div className="text-xs text-gray-500 mt-1">End Date</div>
                  </div>
                </>
              )}
            </div>
            {formData.isRecurring && (
              <div className="grid gap-1 mt-3">
                <Label htmlFor="pmServiceCycle">PM Service Cycle</Label>
                <Input 
                  id="pmServiceCycle" 
                  name="pmServiceCycle" 
                  value={formData.pmServiceCycle} 
                  onChange={handleChange} 
                  placeholder="Enter numbers only" 
                />
                {formData.pmServiceCycleError && (
                  <div className="text-xs text-red-500 mt-1">{formData.pmServiceCycleError}</div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Label htmlFor="isRecurring">Is Recurring</Label>
            <Checkbox id="isRecurring" className="border border-black" checked={formData.isRecurring} onCheckedChange={(val) => setFormData({ ...formData, isRecurring: !!val })} />
          </div>

          <InputBlock label="Shipping Address" name="shippingAddress" value={formData.shippingAddress} onChange={handleChange} />

          <div className="grid grid-cols-2 gap-2">
            <InputBlock label="Location" name="address.location" value={formData.address.location} onChange={handleChange} />
            <InputBlock label="City" name="address.city" value={formData.address.city} onChange={handleChange} />
            <InputBlock label="State" name="address.state" value={formData.address.state} onChange={handleChange} />
            <InputBlock label="Pincode" name="address.pincode" value={formData.address.pincode} onChange={handleChange} />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => handleSubmit()}>Save</Button>
        </div>
      </div>
    </div>
  )
}

const InputBlock = ({ label, name, value, onChange, type = "text" }: any) => (
  <div className="grid gap-1">
    <Label htmlFor={name}>{label}</Label>
    <Input id={name} name={name} type={type} value={value} onChange={onChange} placeholder={label} />
  </div>
)

const SelectBlock = ({ label, name, value, onChange, options }: any) => (
  <div className="grid gap-1">
    <Label htmlFor={name}>{label}</Label>
    <Select value={value} onValueChange={(val: string) => onChange(name, val)}>
      <SelectTrigger><SelectValue placeholder={`Select ${label}`} /></SelectTrigger>
      <SelectContent>
        {options.map((opt: string) => (
          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
)

export default AddServiceEventModal