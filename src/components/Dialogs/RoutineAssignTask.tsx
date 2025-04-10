import * as Dialog from "@radix-ui/react-dialog";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { ACUnit } from "@/types/routine/AcUnit";
import { useAuth } from "@/app/context/AuthContext";
import { useTechnicians } from "@/hooks/useTechnicians";
import toast from "react-hot-toast";

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
  deviceId: string;
}

export default function RoutineAssignTask({
  orderId,
  clientName,
  clientNumber,
  description,
  complaintRaised,
  addressDisplay,
  customerComplaint,
  deviceId
}: AssignTaskProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [technicianName, setTechnicianName] = useState("");
  const [servicingDate, setServicingDate] = useState("");
  const [servicingTime, setServicingTime] = useState("");
  const [filteredTechnicians, setFilteredTechnicians] = useState<Technician[]>([]);
  const [selectedTechnicians, setSelectedTechnicians] = useState<Technician[]>([]);
  const [acUnits, setAcUnits] = useState<ACUnit[]>([]);
  const [totalQuantity, setTotalQuantity] = useState<number>(0);
  const {userName} = useAuth();
  const [address, setAddress] = useState<string>("");
  const [deviceName, setDeviceName] = useState("");
  const technicians = useTechnicians();
  const apiCalled = useRef(false);
  
  useEffect(() => {
    const fetchACDetails = async () => {
      if (!isOpen || !orderId || apiCalled.current) return;
      
      try {
        apiCalled.current = true;
        const response = await axios.get(`http://localhost:5000/api/orders/getOrderById/${orderId}`);
        const orders = response.data.data;
        
        const acDetails = orders.map((order: any) => ({
          model: order.model,
          quantity: order.quantity || 1,
          type: order.ac_type === "split" ? "Split AC" : "Cassette AC",
          deviceName: order.deviceName 
        }));

        const quantity = orders.reduce((total: number, order: any) => total + order.quantity, 0);

        setAcUnits(acDetails);
        setTotalQuantity(quantity);
      } catch (error) {
        console.error("Error fetching AC details:", error);
      }
    };

    fetchACDetails();
    
    // Cleanup function to reset the apiCalled ref when the modal closes
    return () => {
      if (!isOpen) {
        apiCalled.current = false;
      }
    };
  }, [orderId, isOpen]);

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
      alert("Invalid servicing date or time.");
      return;
    }

    const taskDataCreation = {
      orderId: orderId,
      title: "Routine",
      customerComplaint: customerComplaint,
      description: 'Periodic service after every 90 days',
      servicingDate: servicingDateTime,
      status: "open",
      address: [{ location: address ? address : "N/A" }],
      client_number: clientNumber,
      client_name: clientName,
      ac_units: acUnits.map((unit) => ({
        type: 'Split AC',
        capacity: unit.model,
        quantity: unit.quantity,
        deviceName: unit.deviceName
      })),
      quantity: totalQuantity,
      taskType: "routine",
      complaintRaised,
      assignedBy: userName ? [userName] : [], 
      deviceId: deviceId,
      assignedTechnicians: selectedTechnicians.map((tech) => tech.name),
    };

    try {
      await axios.post(`http://35.154.208.29:8080/api/tasks`, taskDataCreation, {
      // await axios.post(`http://localhost:8000/api/tasks`, taskDataCreation, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      toast.success("Task assigned successfully");
      setIsOpen(false);
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