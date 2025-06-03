import * as Dialog from "@radix-ui/react-dialog";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useAuth } from "@/app/context/AuthContext";
import { useTechnicians } from "@/hooks/useTechnicians";
import toast from "react-hot-toast";
import { ACUnit } from "@/types/routine/AcUnit";

interface Technician {
  name: string;
  technician_id: string;
}

interface AssignTaskProps {
  orderId: string;
  clientName: string;
  clientNumber: string;
  description: string;
  complaintRaised: string;
  addressDisplay: string;
  customerComplaint: string;
  deviceId?: string;
  deviceIds?: string[];     
  acUnits?: ACUnit[];
  totalQuantity?: number;
  isPartial: boolean;
  onTaskAssigned?: () => void; // Add callback prop
}

export default function RoutineAssignTask({
  orderId,
  clientName,
  clientNumber,
  description,
  complaintRaised,
  addressDisplay,
  customerComplaint,
  deviceId,
  deviceIds = [], // Default to empty array if not provided
  acUnits = [], // Default to empty array if not provided
  totalQuantity = 0,// Default to 0 if not provided
  isPartial,
  onTaskAssigned // Add callback prop
}: AssignTaskProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [technicianName, setTechnicianName] = useState("");
  const [servicingDate, setServicingDate] = useState("");
  const [servicingTime, setServicingTime] = useState("");
  const [filteredTechnicians, setFilteredTechnicians] = useState<Technician[]>([]);
  const [selectedTechnicians, setSelectedTechnicians] = useState<Technician[]>([]);
  const [localAcUnits, setLocalAcUnits] = useState<ACUnit[]>(acUnits);
  const [localTotalQuantity, setLocalTotalQuantity] = useState<number>(totalQuantity);
  const {userName} = useAuth();
  const technicians = useTechnicians();
  const apiCalled = useRef(false);
  console.log("address display", addressDisplay);
  
  // Update local state when props change
  useEffect(() => {
    setLocalAcUnits(acUnits);
    setLocalTotalQuantity(totalQuantity);
  }, [acUnits, totalQuantity]);

  const formatSelectedDevices = (deviceId: string, isPartial: boolean, totalQuantity: number) => {
    if (!deviceId) return "No device selected";
    
    const deviceIds = deviceId.split(', ').filter(id => id.trim() !== '');
    const deviceCount = deviceIds.length;
    
    if (!isPartial && deviceCount > 3) {
      return `All devices selected (${deviceCount} devices)`;
    }
    
    if (deviceCount > 3) {
      const firstThree = deviceIds.slice(0, 3).join(', ');
      return `${firstThree} + ${deviceCount - 3} more`;
    }
    
    return deviceId;
  };

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
    setSelectedTechnicians((prev) =>
      prev.some((t) => t.technician_id === tech.technician_id)
        ? prev
        : [...prev, tech]
    );
    setTechnicianName("");
    setFilteredTechnicians([]);
  };

  const handleRemoveTechnician = (techId: string) => {
    setSelectedTechnicians((prev) => prev.filter((tech) => tech.technician_id !== techId));
  };

  function mergeDateTimeToISO(servicingDate: string, servicingTime: string) {
    if (!servicingDate || !servicingTime) return null;
    try {
      const combinedDateTime = `${servicingDate}T${servicingTime}:00.000Z`;
      const date = new Date(combinedDateTime);
      return isNaN(date.getTime()) ? null : date.toISOString();
    } catch (error) {
      console.error("Error in mergeDateTimeToISO:", error);
      return null;
    }
  }

  const handleAssignTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const servicingDateTime = mergeDateTimeToISO(servicingDate, servicingTime);
    if (!servicingDateTime) {
      toast.error("Invalid servicing date or time.");
      return;
    }else if(selectedTechnicians.length === 0){
      toast.error("Need to select at least one technician");
      return;
    }else if(localAcUnits.length === 0){
      return toast.error("You need to select atleast one AC unit for multiple units case");
    }

    const taskDataCreation = {
      orderId: orderId,
      title: "Routine",
      customerComplaint: customerComplaint,
      description: description || 'Periodic service after every 90 days',
      servicingDate: servicingDateTime,
      status: "open",
      address: [{ location: addressDisplay ? addressDisplay : "N/A" }],
      client_number: clientNumber,
      client_name: clientName,
      ac_units: localAcUnits,
      quantity: localTotalQuantity || 1,
      taskType: "routine",
      complaintRaised,
      assignedBy: userName ? [userName] : [], 
      // deviceId: deviceId,
      // deviceIds: deviceIds, // Pass the deviceIds prop
      ...(deviceIds.length > 0
      ? { deviceIds }
      : { deviceId }),
      assignedTechnicians: selectedTechnicians.map((tech) => tech.name),
      isPartial: isPartial,
    };

    console.log("payload", taskDataCreation);

    try {
      await axios.post(`${process.env.NEXT_PUBLIC_SERVICE_BACKEND_API}/api/tasks`, taskDataCreation, {
      // await axios.post(`http://localhost:8080/api/tasks`, taskDataCreation, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      toast.success("Task assigned successfully");
      setIsOpen(false);
      
      if (onTaskAssigned) {
        onTaskAssigned();
      }
    } catch (error) {
      console.error("Error assigning task:", error);
      alert("Failed to assign task");
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // Reset form state when closing the modal
      setSelectedTechnicians([]);
      setTechnicianName("");
      setServicingDate("");
      setServicingTime("");
      apiCalled.current = false;
    }
  };

  return (
    <div className="h-fit w-fit mt-2">
      <Dialog.Root open={isOpen} onOpenChange={handleOpenChange}>
        <Dialog.Trigger asChild>
          <button className="border border-[#A14996] text-gray-800 p-3 rounded-md text-sm">
            + Assign Task
          </button>
        </Dialog.Trigger>

        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40" />
          <Dialog.Content className="flex items-center justify-center fixed inset-0 w-full h-full bg-transparent">
            <div className="w-[35%] h-auto bg-white rounded-lg p-8 shadow-lg relative">
              <Dialog.Title className="text-center font-sans text-lg font-bold">Assign Task</Dialog.Title>
              <Dialog.Description className="text-center text-sm text-gray-600 mt-2">
                Select technician and enter service details.
              </Dialog.Description>

              <Dialog.Close asChild>
                <button
                  aria-label="Close"
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  &times;
                </button>
              </Dialog.Close>

              <form onSubmit={handleAssignTask} className="mt-4">
                <div className="mb-4">
                  <label className="block font-sans text-[14px] text-gray-700 mb-1">Customer Details</label>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm"><span className="font-medium">Customer:</span> {clientName}</p>
                    <p className="text-sm"><span className="font-medium">Contact:</span> {clientNumber}</p>
                    {/* <p className="text-sm"><span className="font-medium truncate">Selected Devices:</span> {deviceId ? deviceId : "No device selected"}</p> */}
                    <p className="text-sm">
                      <span className="font-medium">Selected Devices:</span>{' '}
                      <span className="break-words">
                        {formatSelectedDevices(deviceId || "", isPartial, totalQuantity)}
                      </span>
                    </p>
                    <p className="text-sm"><span className="font-medium">Address:</span> {addressDisplay}</p>
                  </div>
                </div>

                <div className="mb-6 relative">
                  <label className="block font-sans text-[14px] text-gray-700 mb-1">Technician Name</label>
                  <input
                    type="text"
                    className="form-control w-full p-2 border rounded"
                    placeholder="Enter Name"
                    value={technicianName}
                    onChange={handleTechnicianInputChange}
                  />

                  {filteredTechnicians.length > 0 && (
                    <ul className="absolute w-full border border-gray-300 mt-1 max-h-48 overflow-y-auto bg-white rounded-md shadow-lg z-10">
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

                <div className="mb-4">
                  {selectedTechnicians.map((tech) => (
                    <div key={tech.technician_id} className="bg-blue-100 text-blue-800 px-3 py-2 rounded-md flex items-center justify-between mb-2">
                      {tech.name}
                      <button 
                        type="button" 
                        onClick={() => handleRemoveTechnician(tech.technician_id)} 
                        className="text-red-500 font-bold"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mb-6">
                  <label className="block font-sans text-[14px] text-gray-700 mb-1">Servicing Date</label>
                  <input
                    type="date"
                    className="date-input rounded-md border w-full p-2"
                    value={servicingDate}
                    onChange={(e) => setServicingDate(e.target.value)}
                  />
                </div>

                <div className="mb-6">
                  <label className="block font-sans text-[14px] text-gray-700 mb-1">Servicing Time</label>
                  <input
                    type="time"
                    className="time-input rounded-md border w-full p-2"
                    value={servicingTime}
                    onChange={(e) => setServicingTime(e.target.value)}
                  />
                </div>

                <div className="flex justify-center mt-8">
                  <button type="submit" className="bg-purple-600 text-white py-2 px-8 rounded text-[16px] hover:bg-purple-700">
                    Submit
                  </button>
                </div>
              </form>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}