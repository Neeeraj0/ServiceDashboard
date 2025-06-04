import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CalendarBox from '../CalenderBox';
import RoutineAssignTask from '../Dialogs/RoutineAssignTask';
import Calendar from '../CalenderBox';
import Pagination from '../Pagination';
import SearchBox from '../SearchBox/SearchBox';
import Loader from '../common/Loader';

interface Device {
  deviceId: string;
  acType: string;
  address: string;
  model: string;
  serialId: string;
  pmServiceCycle: string;
  nextServiceDate: string;
  upcomingServiceDates: string[];
  serviceType: string;
  installationTimestamp?: string;
  pmServiceCycleStart?: string;
  pmServiceCycleEnd?: string;
  serviceCount?: number;
}

interface GroupedDevice {
  addressId: string;
  address: string;
  customerId: string;
  acType: string;
  model: string;
  client_name: string;
  client_number: string;
  devices: Device[];
}

interface GroupedByDate {
  [date: string]: GroupedDevice[];
}

// Define the IncomingData interface to match what Calendar expects
interface IncomingData {
  _id: string;
  nextServiceDate: string;
  client_name: string;
  pmServiceCycle: string;
  serviceType: string;
  client_number?: string;
  address?: string;
  model?: string;
  quantity?: number | null;
  acType?: string;
  serialId?: string;
  deviceId?: string;
  [key: string]: any;
}

// Define AC Unit for task assignment
interface ACUnit {
  type: string;
  capacity: string;
  quantity: number;
  deviceName: string;
}

// Interface for assigned task response
interface AssignedTask {
  _id: string;
  orderId: string;
  deviceId: string;
  isPartial: boolean;
  client_name: string;
  status: string;
  // Add other fields as needed
}

const Upcoming: React.FC = () => {
  const [filter, setFilter] = useState<"7-days" | "30-days" | "1" | "3-days" | "14-days">("1");
  const [data, setData] = useState<GroupedDevice[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage: number = 10;
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCards, setExpandedCards] = useState<{ [key: string]: boolean }>({});
  const [selectedDevices, setSelectedDevices] = useState<{ [key: string]: Set<string> }>({});
  const [assignedTasks, setAssignedTasks] = useState<AssignedTask[]>([]);

  // Fetch assigned tasks
  const fetchAssignedTasks = async (): Promise<void> => {
    try {
      const response = await axios.get<AssignedTask[]>(`${process.env.NEXT_PUBLIC_SERVICE_BACKEND_API}/api/routine/getRoutineServices`);
      // const response = await axios.get<AssignedTask[]>('http://localhost:8080/api/routine/getRoutineServices');
      setAssignedTasks(response.data);
    } catch (error) {
      console.error("Error fetching assigned tasks:", error);
    }
  };

  // Check if a group should be hidden (fully assigned)
  const isGroupFullyAssigned = (group: GroupedDevice): boolean => {
    const assignedTask = assignedTasks.find(task => task.orderId === group.addressId);
    return assignedTask ? !assignedTask.isPartial : false;
  };

  // Get assigned device IDs for a group (for partial assignments)
  const getAssignedDeviceIds = (group: GroupedDevice): Set<string> => {
    const assignedTask = assignedTasks.find(task => task.orderId === group.addressId);
    if (assignedTask && assignedTask.isPartial) {
      // Parse the deviceId string (comma-separated) into a Set
      const deviceIds = assignedTask.deviceId.split(', ').map(id => id.trim());
      return new Set(deviceIds);
    }
    return new Set();
  };

  // Filter out assigned devices from group devices (for partial assignments)
  const getAvailableDevices = (group: GroupedDevice): Device[] => {
    const assignedDeviceIds = getAssignedDeviceIds(group);
    return group.devices.filter(device => !assignedDeviceIds.has(device.deviceId));
  };

  useEffect(() => {
    // const fetchData = async (): Promise<void> => {
    //   setLoading(true);
    //   const url = `http://localhost:8080/api/routine/orders/service-due/${filter}`;
    //   try {
    //     const response = await axios.get<GroupedDevice[]>(url);

    //     const enrichedData = await Promise.all(response.data.map(enrichWithDeviceIds));
    //     setData(enrichedData);
    //     // setData(response.data);
    //     // Initialize selected devices with the first device for each group
    //     const initialSelectedDevices: { [key: string]: Set<string> } = {};
    //     response.data.forEach(group => {
    //       const availableDevices = getAvailableDevices(group);
    //       if (availableDevices.length === 1) {
    //         initialSelectedDevices[group.addressId] = new Set([availableDevices[0].deviceId]);
    //       }
    //     });
    //     setSelectedDevices(initialSelectedDevices);
    //   } catch (error) {
    //     console.error("Error fetching data:", error);
    //   } finally {
    //     setLoading(false);
    //   }
    // };

    const fetchData = async (): Promise<void> => {
  setLoading(true);
  const url = `${process.env.NEXT_PUBLIC_SERVICE_BACKEND_API}/api/routine/orders/service-due/${filter}`;
  try {
    const response = await axios.get<GroupedDevice[]>(url);
    const enriched = await Promise.all(response.data.map(enrichWithDeviceIds));
    setData(enriched);

    const initialSelectedDevices: { [key: string]: Set<string> } = {};
    enriched.forEach(group => {
      const availableDevices = getAvailableDevices(group);
      if (availableDevices.length === 1) {
        initialSelectedDevices[group.addressId] = new Set([availableDevices[0].deviceId]);
      }
    });
    setSelectedDevices(initialSelectedDevices);
  } catch (error) {
    console.error("Error fetching data:", error);
  } finally {
    setLoading(false);
  }
};


    const fetchAllData = async () => {
      await fetchAssignedTasks();
      await fetchData();
    };

    fetchAllData();
  }, [filter]);

  // Refresh assigned tasks when a task is assigned
  const handleTaskAssigned = async () => {
    await fetchAssignedTasks();
    // Optionally refresh the main data as well
    const url = `${process.env.NEXT_PUBLIC_SERVICE_BACKEND_API}/api/routine/orders/service-due/${filter}`;
    try {
      const response = await axios.get<GroupedDevice[]>(url);
      setData(response.data);
    } catch (error) {
      console.error("Error refreshing data:", error);
    }
  };

  // const transformDataForCalendar = (groupedData: GroupedDevice[]): IncomingData[] => {
  //   return groupedData
  //     .filter(group => !isGroupFullyAssigned(group)) // Filter out fully assigned groups
  //     .flatMap(group => {
  //       const availableDevices = getAvailableDevices(group);
  //       return availableDevices.map(device => ({
  //         _id: group.addressId,
  //         address: device.address,
  //         nextServiceDate: device.nextServiceDate,
  //         pmServiceCycle: device.pmServiceCycle,
  //         upcomingServiceDates: device.upcomingServiceDates,
  //         client_name: group.client_name,
  //         serviceType: device.serviceType,
  //         client_number: group.client_number,
  //         model: device.model,
  //         acType: device.acType,
  //         deviceId: device.deviceId,
  //         serialId: device.serialId
  //       }));
  //     });
  // };

  // Transform selected devices into AC units format for RoutineAssignTask
  // 1. First, let's debug the data transformation
const transformDataForCalendar = (groupedData: GroupedDevice[]): IncomingData[] => {
  return groupedData
    .filter(group => !isGroupFullyAssigned(group)) // Filter out fully assigned groups
    .flatMap(group => {
      const availableDevices = getAvailableDevices(group);
      return availableDevices.map(device => ({
        _id: group.addressId,
        address: device.address,
        nextServiceDate: device.nextServiceDate,
        pmServiceCycle: device.pmServiceCycle,
        upcomingServiceDates: device.upcomingServiceDates, // ✅ ADD THIS LINE
        client_name: group.client_name,
        serviceType: device.serviceType,
        client_number: group.client_number,
        model: device.model,
        acType: device.acType,
        deviceId: device.deviceId,
        serialId: device.serialId
      }));
    });
};

  
  const transformToACUnits = (group: GroupedDevice, selectedDeviceIds: Set<string>): ACUnit[] => {
    const availableDevices = getAvailableDevices(group);
    return Array.from(selectedDeviceIds).map((deviceId, index) => {
      const device = availableDevices.find(d => d.deviceId === deviceId);
      return {
        type: device?.acType ? `${device.acType} AC` : '', // fallback to empty if undefined
        capacity: device?.model || '',
        quantity: 1,
        deviceId: deviceId,
        deviceName: `${device?.model || 'Unknown'}-${index + 1}` // index starts from 1
      };
    });
  };

  // Get total quantity of selected devices
  const getTotalQuantity = (selectedDeviceIds: Set<string>): number => {
    return selectedDeviceIds.size;
  };

  const getGroupAddress = (group: GroupedDevice): string => {
    const availableDevices = getAvailableDevices(group);
    return availableDevices.length > 0 ? availableDevices[0].address : 'Address not available';
  };

  const groupDataByDate = (data: GroupedDevice[]): GroupedByDate => {
    return data
      .filter(group => !isGroupFullyAssigned(group)) // Filter out fully assigned groups
      .reduce((acc, item) => {
        const availableDevices = getAvailableDevices(item);
        if (availableDevices && availableDevices.length > 0) {
          const date = new Date(availableDevices[0].nextServiceDate).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          });
          if (!acc[date]) acc[date] = [];
          // Update the group with only available devices
          acc[date].push({
            ...item,
            devices: availableDevices
          });
        }
        return acc;
      }, {} as GroupedByDate);
  };

  const filteredData = data.filter(item =>
    item.client_name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    !isGroupFullyAssigned(item) // Filter out fully assigned groups
  );

  const groupedData: GroupedByDate = groupDataByDate(filteredData);
  const dateKeys: string[] = Object.keys(groupedData);

  const indexOfLastDate: number = currentPage * itemsPerPage;
  const indexOfFirstDate: number = indexOfLastDate - itemsPerPage;
  const currentDateKeys: string[] = dateKeys.slice(indexOfFirstDate, indexOfLastDate);

  const paginate = (pageNumber: number): void => setCurrentPage(pageNumber);

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    setFilter(e.target.value as "7-days" | "30-days" | "1" | "3-days" | "14-days");
    setCurrentPage(1);
  };

  const fetchCustomerDeviceDetails = async (customerId: string) => {
  try {
    // const response = await axios.get(`http://localhost:5000/api/customers/customerdetails/info/${customerId}`);
    const response = await axios.get(`${process.env.NEXT_PUBLIC_CIRCOLIFE_PRODUCTION_API}/api/customers/customerdetails/info/${customerId}`);
    return response.data; 
  } catch (error) {
    console.error("Failed to fetch customer device details:", error);
    return null;
  }
};

const enrichWithDeviceIds = async (group: GroupedDevice): Promise<GroupedDevice> => {
  const customerDetails = await fetchCustomerDeviceDetails(group.customerId);
  if (customerDetails && customerDetails.customerDetails) {
    // Filter for only matching addressId entries
    const matchingDevices = customerDetails.customerDetails.filter(
      (d: any) => d.addressid == group.addressId
    );
    
    console.log("group", group);
    console.log("matchingDevices", matchingDevices);
    
    // Instead of mapping over group.devices (which only has 1 item),
    // create a device entry for each matching device from customerDetails
    const enrichedDevices = matchingDevices.map((customerDevice: any) => {
      // Use the first device from group.devices as template for service info
      const templateDevice = group.devices[0];
      
      return {
        ...templateDevice, // Copy service info (nextServiceDate, pmServiceCycle, etc.)
        deviceId: customerDevice.deviceid,
        serialId: customerDevice.serialid || '',
        model: customerDevice.model || templateDevice.model || '',
        acType: customerDevice.ac_type || templateDevice.acType || ''
      };
    });
    
    console.log("enrichedDevices", enrichedDevices);
    return { ...group, devices: enrichedDevices };
  }
  return group;
};

  const calendarData = transformDataForCalendar(data);
  console.log("Original data:", data);
  console.log("Transformed data for calendar:", calendarData);
  console.log("Sample transformed item:", calendarData[0]);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex-grow">
          <SearchBox
            placeholder="Search by customer name"
            value={searchQuery}
            onChange={setSearchQuery}
          />
        </div>
        <select
          value={filter}
          onChange={handleFilterChange}
          className="p-2 rounded border"
        >
          <option value="30-days">Month</option>
          <option value="1">Today</option>
          <option value="7-days">Next 7 Days</option>
          <option value="3-days">Next 3 Days</option>
          <option value="14-days">Next 14 Days</option>
        </select>
      </div>

      {loading ? (
        <Loader />
      ) : (filter === "7-days" || filter === "1" || filter === "14-days" || filter === "3-days") ? (
        <div>
          {dateKeys.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <img
                src='https://img.freepik.com/free-vector/man-saying-no-concept-illustration_114360-13562.jpg?t=st=1744179037~exp=1744182637~hmac=f6bf8756262cbfa1b3e0dd9e50e7ca1ba03b597daae269619c15f6c63f42180b&w=826'
                className='items-center w-80 h-80 mx-auto justify-center'
              />
            </div>
          ) : (
            <>
              {currentDateKeys.map((date) => (
                <div key={date} className="mb-6">
                  <h3 className="text-xl font-bold mb-4">{date}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
                    {groupedData[date].map((group, index) => {
                      const cardKey = group.addressId;
                      const isExpanded = expandedCards[cardKey] || false;
                      const selectedSet = selectedDevices[cardKey] || new Set<string>();
                      const address = getGroupAddress(group);
                      const availableDevices = getAvailableDevices(group);
                      const isPartial = selectedSet.size > 0 && selectedSet.size < availableDevices.length;
                      const isAllSelected = selectedSet.size === availableDevices.length;

                      console.log("is partial", isPartial);
                      console.log("is all selected", isAllSelected);

                      const toggleExpand = () => {
                        setExpandedCards(prev => ({
                          ...prev,
                          [cardKey]: !prev[cardKey]
                        }));
                      };

                      const handleCheckboxChange = (deviceId: string) => {
                        setSelectedDevices(prev => {
                          const newSet = new Set(prev[cardKey] || []);
                          if (newSet.has(deviceId)) {
                            newSet.delete(deviceId);
                          } else {
                            newSet.add(deviceId);
                          }
                          return { ...prev, [cardKey]: newSet };
                        });
                      };

                      // Get selected devices as array
                      const selectedDeviceArray = Array.from(selectedSet);
                      
                      // Transform to AC units for task assignment
                      const acUnits = transformToACUnits(group, selectedSet);
                      const totalQuantity = getTotalQuantity(selectedSet);

                      return (
                        <div
                          key={cardKey}
                          className="border-[#C9C9C9] rounded-xl text-left p-3 shadow-md flex flex-col space-y-2"
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-black font-medium">Customer Name: {group.client_name}</p>
                              <p className="text-black font-medium">Customer ID: {group.customerId}</p>
                              <p className="text-black font-medium">Contact Number: <b>{group.client_number}</b></p>
                              <p className="text-black font-medium">
                                Due: {new Date(availableDevices[0].nextServiceDate).toLocaleDateString()}
                              </p>
                              <p className="text-black font-medium">Service Cycle: <b>{availableDevices[0].pmServiceCycle}</b></p>
                              <p className="text-black font-medium">Shipping Address: <b>{address}</b></p>
                            </div>
                            <button
                              className="text-sm text-blue-600 hover:underline"
                              onClick={toggleExpand}
                            >
                              {isExpanded ? "Collapse" : "Expand"}
                            </button>
                          </div>

                          <div className="border-t pt-2">
                            <p className="text-black font-medium">Available Devices ({availableDevices.length}):</p>

                            {!isExpanded ? (
                              <div className="flex flex-wrap items-center gap-2">
                                {availableDevices.slice(0, 2).map((device) => (
                                  <span key={device.deviceId} className="bg-gray-100 px-2 py-1 rounded text-sm">
                                    {device.deviceId}
                                  </span>
                                ))}
                                {availableDevices.length > 2 && (
                                  <span className="text-sm text-gray-500">
                                    + {availableDevices.length - 2} more
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div className="mt-2">
                                <div className="mt-2">
                                  <label className="flex items-center mb-2 text-sm font-medium">
                                    <input
                                      type="checkbox"
                                      className="mr-2"
                                      checked={selectedSet.size === availableDevices.length}
                                      onChange={() => {
                                        setSelectedDevices(prev => {
                                          const allDeviceIds = availableDevices.map(d => d.deviceId);
                                          const isAllSelected = selectedSet.size === allDeviceIds.length;
                                          return {
                                            ...prev,
                                            [cardKey]: isAllSelected ? new Set() : new Set(allDeviceIds)
                                          };
                                        });
                                      }}
                                    />
                                    {selectedSet.size === availableDevices.length ? "Unselect All" : "Select All"}
                                  </label>

                                  {availableDevices.map((device) => (
                                    <label key={device.deviceId} className="flex items-center mb-1 text-sm">
                                      <input
                                        type="checkbox"
                                        className="mr-2"
                                        checked={selectedSet.has(device.deviceId)}
                                        onChange={() => handleCheckboxChange(device.deviceId)}
                                      />
                                      {device.deviceId} ({device.serviceType})
                                    </label>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex justify-between items-center mt-3">
                            <button className="flex items-center text-sm text-gray-600">
                              <span className="mr-2">ℹ️</span> View Customer
                            </button>
                            <RoutineAssignTask
                              orderId={group.addressId}
                              clientName={group.client_name}
                              clientNumber={group.client_number}
                              description="Periodic service"
                              complaintRaised=""
                              customerComplaint=""
                              addressDisplay={address}
                              // deviceId={selectedDeviceArray.join(', ')}
                              acUnits={acUnits}
                              totalQuantity={totalQuantity}
                              isPartial={isPartial}
                              onTaskAssigned={handleTaskAssigned} // Add this callback
                                {...(selectedDeviceArray.length === 1
                                ? { deviceId: selectedDeviceArray[0] }
                                : { deviceIds: selectedDeviceArray })}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {dateKeys.length > itemsPerPage && (
                <Pagination
                  currentPage={currentPage}
                  totalItems={dateKeys.length}
                  itemsPerPage={itemsPerPage}
                  paginate={paginate}
                />
              )}
            </>
          )}
        </div>
      ) : (
        <div className="w-full max-w-full rounded-[10px] bg-white shadow-1 dark:bg-gray-dark dark:shadow-card">
          {/* Pass the transformed data to Calendar */}
          {/* <Calendar data={transformDataForCalendar(data)} /> */}
          <Calendar data={calendarData} />
        </div>
      )}
    </div>
  );
};

export default Upcoming;