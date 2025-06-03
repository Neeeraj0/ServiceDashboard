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
  clientName: string;
  deviceId: string;
  customerId: string;
  customerName: string;
  clientNumber: string;
  description: string;
  complaintRaised: string;
  addressDisplay: string;
  customerComplaint: string;
  ac_units: ACUnit[];
  onTaskAssigned: (id: string) => void; // Callback prop
}

// Cache for fetched technicians to avoid repeated API calls
let techniciansCache: Technician[] | null = null;

export default React.memo(function AssignTask({
  orderId,
  clientName,
  customerName,
  deviceId,
  customerId,
  clientNumber,
  description,
  complaintRaised,
  addressDisplay,
  customerComplaint,
  ac_units,
  onTaskAssigned
}: AssignTaskProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [technicianName, setTechnicianName] = useState("");
  const [servicingDate, setServicingDate] = useState("");
  const [servicingTime, setServicingTime] = useState("");
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [filteredTechnicians, setFilteredTechnicians] = useState<Technician[]>([]);
  const [selectedTechnicians, setSelectedTechnicians] = useState<Technician[]>([]);
  const [isButtonClicked, setIsButtonClicked] = useState(false);
  const {userName} = useAuth();
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
          localStorage.setItem("technicians", JSON.stringify(response.data)); // Cache the data
          setTechnicians(response.data); // Update state with fresh data
          console.log('Fetched technicians:', response);
        } catch (error) {
          console.error('Error fetching technicians:', error);
          toast.error('Failed to load technicians');
        }
      }
    };
  
    fetchTechnicians();
  }, []);
  
  
  const refreshTechnicians = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_SERVICE_BACKEND_API}/api/technicians/getTechnicians`);
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
      client_number: clientNumber,
      client_name: customerName ? customerName : clientName,
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
      // await axios.post(`http://localhost:8080/api/tasks`, taskDataCreation, {
      //   headers: { "Content-Type": "application/json" },
      // });

      // Update query status
      await axios.patch(
        // `https://production.circolife.vip/api/query/changeQueryStatus/${orderId}`,
        `${process.env.NEXT_PUBLIC_CIRCOLIFE_PRODUCTION_API}/api/queryApi/updateQueryStatus/${orderId}`,
        { queryStatus: "Assigned" },
        { headers: { "Content-Type": "application/json" } }
      );

      toast.success("Task assigned successfully");
      submitTimeout.current = setTimeout(() => {
        onTaskAssigned(orderId);
        setIsOpen(false);
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

  const timeOptions = generateTimeOptions(30); // 30-minute intervals

  useEffect(() => {
    setIsButtonClicked(
      selectedTechnicians.length > 0 &&
      servicingDate !== "" &&
      servicingTime !== ""
    );
  }, [selectedTechnicians, servicingDate, servicingTime]);
  return (
    <div className="flex w-full font-sans">
      <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
        <Dialog.Trigger asChild>
        <button
          onClick={() => setIsOpen(true)}
          className="px-4 py-2 flex items-center gap-2 text-sm font-medium text-black bg-white rounded text-center mx-auto"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            shapeRendering="geometricPrecision"
            width="15"
            height="15"
            textRendering="geometricPrecision"
            imageRendering="optimizeQuality"
            fillRule="evenodd"
            clipRule="evenodd"
            viewBox="0 0 419 511.67"
            className="shrink-0"
          >
            <path d="M314.98 303.62c57.47 0 104.02 46.59 104.02 104.03 0 57.47-46.58 104.02-104.02 104.02-57.47 0-104.02-46.58-104.02-104.02 0-57.47 46.58-104.03 104.02-104.03zM41.73 59.27h23.93v24.38H41.73c-4.54 0-8.7 1.76-11.8 4.61l-.45.49c-3.14 3.13-5.1 7.48-5.1 12.24v315.53c0 4.75 1.96 9.1 5.1 12.24 3.13 3.15 7.48 5.11 12.25 5.11h142.62c1.68 8.44 4.17 16.6 7.36 24.38H41.73c-11.41 0-21.86-4.71-29.42-12.26C4.72 438.44 0 427.99 0 416.52V100.99c0-11.48 4.7-21.92 12.25-29.47l.79-.72c7.5-7.13 17.62-11.53 28.69-11.53zm297.55 217.37V100.99c0-4.74-1.96-9.09-5.12-12.24-3.11-3.15-7.47-5.1-12.24-5.1h-23.91V59.27h23.91c11.45 0 21.86 4.72 29.42 12.26 7.61 7.56 12.32 18.02 12.32 29.46V283.6c-7.79-3.06-15.95-5.41-24.38-6.96zm-206.75-8.07c-7.13 0-12.92-5.79-12.92-12.92s5.79-12.93 12.92-12.93h142.83c7.13 0 12.92 5.8 12.92 12.93s-5.79 12.92-12.92 12.92H132.53zM89.5 241.22c7.98 0 14.44 6.46 14.44 14.44 0 7.97-6.46 14.43-14.44 14.43-7.97 0-14.44-6.46-14.44-14.43 0-7.98 6.47-14.44 14.44-14.44zm0 78.62c7.98 0 14.44 6.46 14.44 14.44 0 7.97-6.46 14.43-14.44 14.43-7.97 0-14.44-6.46-14.44-14.43 0-7.98 6.47-14.44 14.44-14.44zm43.04 27.35c-7.13 0-12.93-5.79-12.93-12.92s5.8-12.93 12.93-12.93h80.96a133.608 133.608 0 0 0-17.26 25.85h-63.7zM89.5 162.6c7.98 0 14.44 6.46 14.44 14.44 0 7.98-6.46 14.44-14.44 14.44-7.97 0-14.44-6.46-14.44-14.44 0-7.98 6.47-14.44 14.44-14.44zm43.03 27.37c-7.13 0-12.92-5.8-12.92-12.93s5.79-12.92 12.92-12.92h142.83c7.13 0 12.92 5.79 12.92 12.92s-5.79 12.93-12.92 12.93H132.53zM93 39.4h46.13C141.84 17.18 159.77 0 181.52 0c21.62 0 39.45 16.95 42.34 38.94l46.76.46c2.61 0 4.7 2.09 4.7 4.71v51.84c0 2.6-2.09 4.7-4.7 4.7H93.05c-2.56 0-4.71-2.1-4.71-4.7V44.11A4.638 4.638 0 0 1 93 39.4zm88.03-19.25c12.3 0 22.26 9.98 22.26 22.27 0 12.3-9.96 22.26-22.26 22.26-12.29 0-22.26-9.96-22.26-22.26 0-12.29 9.97-22.27 22.26-22.27zm118.39 346.9c-.04-4.59-.46-7.86 5.23-7.79l18.45.23c5.95-.04 7.53 1.86 7.46 7.43v25.16h25.02c4.59-.03 7.86-.46 7.78 5.24l-.22 18.44c.03 5.96-1.86 7.54-7.43 7.48h-25.15v25.14c.07 5.57-1.51 7.46-7.46 7.43l-18.45.22c-5.69.09-5.27-3.2-5.23-7.79v-25h-25.16c-5.59.06-7.47-1.52-7.44-7.48l-.22-18.44c-.09-5.7 3.2-5.27 7.79-5.24h25.03v-25.03z"/>
          </svg>
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

                {/* <button onClick={refreshTechnicians} className="text-blue-500 hover:underline w-fit">
                  Refresh Technicians
                </button> */}

                <div className="flex justify-center mt-8">
                  {/* <button
                    type="submit"
                    disabled={!isButtonClicked}
                    className={`bg-purple-600 text-white py-2 px-8 rounded text-sm hover:bg-purple-700`}
                  >
                    Submit
                  </button> */}
                  <button
                    type="submit"
                    disabled={!isButtonClicked || isSubmitting}
                    className={`bg-purple-600 text-white py-2 px-8 rounded text-sm hover:bg-purple-700 
                      ${(isSubmitting || !isButtonClicked) ? 'opacity-50 cursor-not-allowed w-10vw' : ''}`}
                  >
                    {/* {isSubmitting ? 'Submitting...' : 'Submit'} */}
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
