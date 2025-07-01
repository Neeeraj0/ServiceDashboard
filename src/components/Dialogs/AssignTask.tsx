import * as Dialog from "@radix-ui/react-dialog";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { ACUnit } from "@/types/breakdown/Order";
import toast from "react-hot-toast";
import React from "react";
import '../BreakdownCalls/module.style.css';
import { useAuth } from "@/app/context/AuthContext";

interface Technician {
  name: string;
  technician_id: string;
}

interface AssignTaskProps {
  orderId: string;
  contactPerson: string;
  contactNumber: string;
  deviceId: string;
  customerId: string;
  customerName: string;
  customerNumber: string;
  description: string;
  complaintRaised: string;
  addressDisplay: string;
  addressId: string;
  customerComplaint: string;
  ac_units: ACUnit[];
  onTaskAssigned: (id: string) => void;
  closeDropdown: () => void;
  // Add these props to control modal from parent
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

// Cache for fetched technicians to avoid repeated API calls
let techniciansCache: Technician[] | null = null;

export default React.memo(function AssignTask({
  orderId,
  customerName,
  customerNumber,
  contactPerson,
  contactNumber,
  deviceId,
  customerId,
  description,
  complaintRaised,
  addressDisplay,
  customerComplaint,
  addressId,
  ac_units,
  onTaskAssigned,
  closeDropdown,
  isOpen,
  onOpenChange
}: AssignTaskProps) {
  // Remove internal isOpen state - use props instead
  const [technicianName, setTechnicianName] = useState("");
  const [servicingDate, setServicingDate] = useState("");
  const [servicingTime, setServicingTime] = useState("");
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [filteredTechnicians, setFilteredTechnicians] = useState<Technician[]>([]);
  const [selectedTechnicians, setSelectedTechnicians] = useState<Technician[]>([]);
  const [isButtonClicked, setIsButtonClicked] = useState(false);
  const {userName, userId} = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitTimeout = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const fetchTechnicians = async () => {
      const cachedTechnicians = JSON.parse(localStorage.getItem("technicians") || "[]");
  
      if (cachedTechnicians.length > 0) {
        setTechnicians(cachedTechnicians);
      }
  
      if (cachedTechnicians.length === 0) {
        try {
          const response = await axios.get(`${process.env.NEXT_PUBLIC_SERVICE_BACKEND_API}/api/technicians/getTechnicians`);
          localStorage.setItem("technicians", JSON.stringify(response.data));
          setTechnicians(response.data);
          console.log('Fetched technicians:', response);
        } catch (error) {
          console.error('Error fetching technicians:', error);
          toast.error('Failed to load technicians');
        }
      }
    };
  
    fetchTechnicians();
  }, []);  

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
    setSelectedTechnicians((prev) =>
      prev.filter((tech) => tech.technician_id !== techId)
    );
  };

  function mergeDateTimeToISO(servicingDate: string, servicingTime: string) {
    if (!servicingDate || !servicingTime) {
      console.error(
        "Invalid input: servicingDate and servicingTime are required"
      );
      return null;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(servicingDate)) {
      console.error("Invalid servicingDate format. Expected YYYY-MM-DD");
      return null;
    }
    if (!/^\d{2}:\d{2}$/.test(servicingTime)) {
      console.error("Invalid servicingTime format. Expected HH:MM");
      return null;
    }

    try {
      const combinedDateTime = `${servicingDate}T${servicingTime}:00.000Z`;
      const date = new Date(combinedDateTime);
      if (isNaN(date.getTime())) {
        throw new Error("Invalid date created");
      }
      return date.toISOString();
    } catch (error) {
      console.error("Error in mergeDateTimeToISO:", error);
      return null;
    }
  }

  function convertTo24HourFormat(time: string): string {
    const [timePart, period] = time.split(" ");
    let [hours, minutes] = timePart.split(":").map(Number);
  
    if (period === "PM" && hours !== 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;
  
    return `${hours?.toString().padStart(2, "0")}:${minutes?.toString().padStart(2, "0")}`;
  }

  const transformedACUnit =
  ac_units && ac_units.length > 0
    ? ac_units.map((unit) => {
        let type, capacity;
        console.log("units", unit);

        if (
          unit?.model === "1 Ton" ||
          unit?.model === "1.5 Ton" ||
          unit?.model === "2 Ton" ||
          unit?.model === "3 Ton"
        ) {
          type = "Split AC";
          capacity =
            unit.model === "1 Ton"
              ? "S10"
              : unit.model === "1.5 Ton"
              ? "S15"
              : unit.model === "2 Ton"
              ? "S20"
              : unit.model === "3 Ton"
              ? "S30"
              : unit.model;
        } 
        else if (unit?.model?.startsWith("S")) {
          type = "Split AC";
          capacity =
            unit.model === "S10"
              ? "S10"
              : unit.model === "S15"
              ? "S15"
              : unit.model === "S20"
              ? "S20"
              : unit.model;
        } 
        else if (unit?.model?.startsWith("C")) {
          type = "Cassette AC";
          capacity =
            unit.model === "C10"
              ? "C10"
              : unit.model === "C15"
              ? "C15"
              : unit.model === "C20"
              ? "C20"
              : unit.model === "C30"
              ? "C30"
              : unit.model;
        } 
        else {
          type = "Split AC";
          capacity = unit?.model;
        }

        return {
          type,
          capacity,
          quantity: unit?.quantity,
        };
      })
    : [
        {
          type: "Split AC",
          capacity: "S10",
          quantity: 1,
        },
      ];

  const handleAssignTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) {
      return;
    }
    if (submitTimeout.current) {
      clearTimeout(submitTimeout.current);
    }
    setIsSubmitting(true);
    const timeIn24Hour = convertTo24HourFormat(servicingTime);
    const servicingDateTime = mergeDateTimeToISO(servicingDate, timeIn24Hour);
    if (!servicingDateTime) {
      alert("Invalid servicing date or time.");
      return;
    }

    const taskDataCreation = {
      _id: orderId,
      title: "Breakdown",
      customerComplaint,
      description,
      servicingDate: servicingDateTime,
      status: "open",
      deviceId: deviceId,
      address: [{ location: addressDisplay }],
      customerId: customerId,
      addressId: addressId,
      contactPerson: contactPerson ? contactPerson : "Not available",
      contactNumber: contactNumber ? contactNumber : "Not available",
      client_number: customerNumber || contactNumber || "not available",
      client_name: customerName,
      ac_units: transformedACUnit,
      taskType: "breakdown",
      complaintRaised,
      assignedTechnicians: selectedTechnicians.map((tech) => tech.name),
      assignedBy: userName ? [userName] : [], 
    };

    try {
      await axios.post(`${process.env.NEXT_PUBLIC_SERVICE_BACKEND_API}/api/tasks`, taskDataCreation, {
        headers: { "Content-Type": "application/json" },
      });

      console.log("task data", taskDataCreation);

      await axios.put(
        `${process.env.NEXT_PUBLIC_CIRCOLIFE_PRODUCTION_API}/api/queryApi/updateQueryStatus/${orderId}`,
        { queryStatus: "Assigned" },
        { headers: { "Content-Type": "application/json" } }
      );

      toast.success("Task assigned successfully");
      submitTimeout.current = setTimeout(() => {
        onTaskAssigned(orderId);
        onOpenChange(false); // Close modal using prop
        setIsSubmitting(false);
      }, 5000);
    } catch (error) {
      console.error("Error assigning task:", error);
      toast.error("Failed to assign task");
    }
  };

  const generateTimeOptions = (interval: number) => {
    const options = [];
    const startTime = new Date();
    startTime.setHours(0, 0, 0, 0);

    for (let i = 0; i < 24 * 60; i += interval) {
      const time = new Date(startTime.getTime() + i * 60000);
      const hours = time.getHours();
      const minutes = time.getMinutes().toString().padStart(2, "0");
      const period = hours < 12 ? "AM" : "PM";
      const formattedHours = hours % 12 || 12;
      options.push(`${formattedHours}:${minutes} ${period}`);
    }

    return options;
  };

  const timeOptions = generateTimeOptions(30);

  useEffect(() => {
    setIsButtonClicked(
      selectedTechnicians.length > 0 &&
      servicingDate !== "" &&
      servicingTime !== ""
    );
  }, [selectedTechnicians, servicingDate, servicingTime]);

  return (
    <div className="flex w-full font-sans">
      <Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40" />
          <Dialog.Content className="flex items-center justify-center fixed inset-0 w-full h-full bg-transparent">
            <div className="w-[35%] h-auto bg-white rounded-lg p-8 shadow-lg relative">
              <Dialog.Title className="text-center font-sans text-lg font-medium">
                Assign Task
              </Dialog.Title>
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
                  <label className="block text-sm text-gray-700 mb-1">
                    Technician Name
                  </label>
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

                <div className="mb-4 max-h-[90px] overflow-y-scroll border rounded-md p-2 flex flex-wrap gap-2">
                  {selectedTechnicians.map((tech) => (
                    <div key={tech.technician_id} className="bg-blue-100 text-blue-800 px-3 py-2 rounded-md flex items-center justify-between mb-2">
                      {tech.name}
                      <button onClick={() => handleRemoveTechnician(tech.technician_id)} className="text-red-500 font-bold">
                        ×
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mb-6">
                  <label className="block text-sm text-gray-700 mb-1">
                    Assigning Date
                  </label>
                  <input
                    type="date"
                    className="form-control w-full p-2 border rounded"
                    value={servicingDate}
                    onChange={(e) => setServicingDate(e.target.value)}
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm text-gray-700 mb-1">
                    Assigning Time
                  </label>
                  <select
                    className="form-control w-full p-2 border rounded"
                    value={servicingTime}
                    onChange={(e) => setServicingTime(e.target.value)}
                  >
                    <option value="">Select Time</option>
                    {timeOptions.map((time, index) => (
                      <option key={index} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-center mt-8">
                  <button
                    type="submit"
                    disabled={!isButtonClicked || isSubmitting}
                    className={`bg-purple-600 text-white py-2 px-8 rounded text-sm hover:bg-purple-700 
                      ${(isSubmitting || !isButtonClicked) ? 'opacity-50 cursor-not-allowed w-10vw' : ''}`}
                  >
                    {isSubmitting ? (
                      <svg
                        className="animate-spin h-5 w-5 text-white mx-auto"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 1 1 16 0A8 8 0 0 1 4 12z"
                        ></path>
                      </svg>
                    ) : (
                      'Submit'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
});