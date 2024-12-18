import * as Dialog from "@radix-ui/react-dialog";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { ACUnit } from "@/types/breakdown/Order";
import toast from "react-hot-toast";
import React from "react";


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
  ac_units: ACUnit[];
}

// Cache for fetched technicians to avoid repeated API calls
let techniciansCache: Technician[] | null = null;

export default React.memo(function AssignTask({
  orderId,
  clientName,
  clientNumber,
  description,
  complaintRaised,
  addressDisplay,
  customerComplaint,
  ac_units,
}: AssignTaskProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [technicianName, setTechnicianName] = useState("");
  const [servicingDate, setServicingDate] = useState("");
  const [servicingTime, setServicingTime] = useState("");
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [filteredTechnicians, setFilteredTechnicians] = useState<Technician[]>([]);
  const [selectedTechnicians, setSelectedTechnicians] = useState<Technician[]>([]);

  // // Fetch technicians with caching
  // useEffect(() => {
  //   const fetchTechnicians = async () => {
  //     if (techniciansCache) {
  //       setTechnicians(techniciansCache);
  //     } else {
  //       try {
  //         const response = await axios.get(`http://35.154.208.29:8080/api/technicians/getTechnicians`);
  //         techniciansCache = response.data;
  //         setTechnicians(response.data);
  //       } catch (error) {
  //         console.error("Error fetching technicians:", error);
  //         toast.error("Failed to load technicians");
  //       }
  //     }
  //   };
  //   fetchTechnicians();
  // }, []);

  useEffect(() => {
    const fetchTechnicians = async () => {
      const cachedTechnicians = JSON.parse(localStorage.getItem("technicians") || "[]");
      setTechnicians(cachedTechnicians); // Serve cached data immediately
      
      if(!technicians){
        try {
          const response = await axios.get(`http://35.154.208.29:8080/api/technicians/getTechnicians`);
          localStorage.setItem("technicians", JSON.stringify(response.data)); // Update cache
          setTechnicians(response.data); // Update with fresh data
        } catch (error) {
          console.error("Error fetching technicians:", error);
          toast.error("Failed to load technicians");
        }
      }
    };
    fetchTechnicians();
  }, []);
  
  const refreshTechnicians = async () => {
    try {
      const response = await axios.get(`http://35.154.208.29:8080/api/technicians/getTechnicians`);
      localStorage.setItem("technicians", JSON.stringify(response.data));
      setTechnicians(response.data);
      toast.success("Technicians list updated");
    } catch (error) {
      console.error("Error refreshing technicians:", error);
      toast.error("Failed to refresh technicians");
    }
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
    const [timePart, period] = time.split(" "); // e.g., "9:00 AM"
    let [hours, minutes] = timePart.split(":").map(Number);
  
    if (period === "PM" && hours !== 12) hours += 12; // Convert PM to 24-hour format
    if (period === "AM" && hours === 12) hours = 0; // Handle midnight (12:00 AM)
  
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  }

  const transformedACUnit =
  ac_units && ac_units.length > 0
    ? ac_units.map((unit) => {
        let type, capacity;
        console.log("units", unit);

        // If model is a standard ton size, set type to Split AC
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
        // Handle existing S or C prefixed models
        else if (unit?.model.startsWith("S")) {
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
        else if (unit?.model.startsWith("C")) {
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
          // Fallback for any other model
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
      address: [{ location: addressDisplay }],
      client_number: clientNumber,
      client_name: clientName,
      ac_units: transformedACUnit,
      taskType: "breakdown",
      complaintRaised,
      assignedTechnicians: selectedTechnicians.map((tech) => tech.name),
    };

    try {
      await axios.post(`http://35.154.208.29:8080/api/tasks`, taskDataCreation, {
        headers: { "Content-Type": "application/json" },
      });

      // Update query status
      await axios.put(
        `http://devappapi.circolives.in/api/query/changeQueryStatus/${orderId}`,
        { queryStatus: "assign" },
        { headers: { "Content-Type": "application/json" } }
      );

      toast.success("Task assigned successfully");
      setIsOpen(false); // Close modal
    } catch (error) {
      console.error("Error assigning task:", error);
      toast.error("Failed to assign task");
    }
  };

  // Generate time options for the dropdown
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

  const timeOptions = generateTimeOptions(30); // 30-minute intervals


  return (
    <div className="flex w-full font-sans">
      <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
        <Dialog.Trigger asChild>
          <button
            onClick={() => setIsOpen(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded hover:bg-blue-600"
          >
            Assign Task
          </button>
        </Dialog.Trigger>

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

                <div className="mb-4">
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
                  {/* <input
                    type="time"
                    className="form-control w-full p-2 border rounded"
                    value={servicingTime}
                    onChange={(e) => setServicingTime(e.target.value)}
                  /> */}
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

                <button onClick={refreshTechnicians} className="text-blue-500 hover:underline w-fit">
                  Refresh Technicians
                </button>

                <div className="flex justify-center mt-8">
                  <button
                    type="submit"
                    className="bg-purple-600 text-white py-2 px-8 rounded text-sm hover:bg-purple-700"
                  >
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
});
