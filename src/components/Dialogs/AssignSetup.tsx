import * as Dialog from "@radix-ui/react-dialog";
import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import TimePicker from "../TimePicker/TimePicker";
import '../BreakdownCalls/module.style.css';
import { useAuth } from "@/app/context/AuthContext";

interface ACUnit {
  type: string;
  capacity: string;
  quantity: number;
  model: string;
  orderId: string; // Make sure this matches the property you are using
}

interface Technician {
  name: string;
  technician_id: string;
}

interface AssignTaskProps {
  preOrderId: string;
  clientName: string;
  clientNumber: string;
  description: string;
  addressDisplay: string;
  ac_units: ACUnit[];
  contactNumber: string;
  contactName: string;
  onTaskAssigned: (id: string) => void; // Callback prop
}

interface SiteSurveyDetail {
  _id: string;
  PreOrderId: string;
}

export default function AssignSetup({
  preOrderId,
  clientName,
  clientNumber,
  addressDisplay,
  ac_units,
  contactNumber,
  contactName,
  onTaskAssigned
}: AssignTaskProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [siteSurveyDetails, setSiteSurveyDetails] = useState<SiteSurveyDetail[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [technicianName, setTechnicianName] = useState("");
  const [servicingDate, setServicingDate] = useState("");
  const [servicingTime, setServicingTime] = useState("");
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [filteredTechnicians, setFilteredTechnicians] = useState<Technician[]>([]);
  const [selectedTechnicians, setSelectedTechnicians] = useState<Technician[]>([]); // Track selected technicians
  const [isAnimating, setIsAnimating] = useState(false);
  const {userName} = useAuth();
  const isFormValid = servicingDate && servicingTime && selectedTechnicians.length > 0;

  console.log(ac_units);
  useEffect(() => {
    const fetchTechnicians = async () => {
      const cachedTechnicians = JSON.parse(localStorage.getItem("technicians") || "[]");
  
      if (cachedTechnicians.length > 0) {
        setTechnicians(cachedTechnicians); // Serve cached data immediately
      } else {
        try {
          const response = await axios.get(`${process.env.NEXT_PUBLIC_SERVICE_BACKEND_API}/api/technicians/getTechnicians`);
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
    console.log(servicingDate, servicingTime);
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

  const transformedACUnits = ac_units;
  const totalQuantity = transformedACUnits?.reduce((total, ac) => total + (ac.quantity || 1), 0);

  const handleAssignTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAnimating(true)
    const timeIn24Hour = convertTo24HourFormat(servicingTime);
    const servicingDateTime = mergeDateTimeToISO(servicingDate, timeIn24Hour);
    if (!servicingDateTime) {
      alert("Invalid servicing date or time.");
      return;
    }

    const orderResponse = await axios.get(`${process.env.NEXT_PUBLIC_SALES_BACKEND_API}/api/preOrder/orders/detail/${preOrderId}`);
    const orders = orderResponse.data;

    const orderMap: { [key: string]: string[] } = {}; // key: model, value: array of order IDs
    const usedOrderIds = new Set<string>(); // Track used order IDs
    
    orders.forEach((order: any) => {
      const model = order.model; // Assuming 'model' is the key to match
      if (!orderMap[model]) {
        orderMap[model] = [];
      }
      orderMap[model].push(order._id);
    });

    const transformedAC = ac_units.flatMap((unit) => {
      const modelCapacity =
        unit.capacity === "10"
          ? "1 Ton"
          : unit.capacity === "15"
          ? "1.5 Ton"
          : unit.capacity === "20"
          ? "2 Ton"
          : unit.capacity;
      const orderIds = orderMap[unit.capacity] || []; // Get all order IDs for this capacity
    
      return Array.from({ length: unit.quantity }, (_, i) => {
        // Find the next unused orderId that matches the model
        let orderId = null;
        for (let j = 0; j < orderIds.length; j++) {
          if (!usedOrderIds.has(orderIds[j])) {
            orderId = orderIds[j];
            usedOrderIds.add(orderId); // Mark this orderId as used
            break;
          }
        }
    
        // Dynamically generate the device name
        const deviceName =
          unit.type === "Split AC"
            ? `S${unit.capacity}-${i + 1}`
            : unit.type === "Cassette AC"
            ? `C${unit.capacity}-${i + 1}`
            : `${unit.capacity}-${i + 1}`; // Default case if the type is neither Split nor Cassette
    
        return {
          type: unit.type + " AC",
          capacity: modelCapacity,
          quantity: 1,
          deviceName: deviceName, // Correct dynamic device name
          orderId: orderId, // Assign the unique orderId or null if none are left
        };
      });
    });

    console.log('ac display', transformedACUnits);

    const taskDataCreation = {
      title: "Setup Installation Task",
      // customerComplaint: customerComplaint,
      description: "Setup task",
      servicingDate: servicingDateTime,
      status: "open",
      address: [{ location: addressDisplay }],
      client_number: clientNumber,
      client_name: clientName,
      ac_units: transformedAC,
      quantity: totalQuantity,
      taskType: "setup",
      approvalPending: false,
      preOrderId: preOrderId,
      assignedTechnicians: selectedTechnicians.map((tech) => tech.name), // Send selected technician names
      contactPerson: {
        name: contactName,
        phone_number: contactNumber
      },
      assignedBy: userName ? [userName] : [], // Add assignedBy with user's name

    };

    console.log(taskDataCreation);

    try {
      await axios.post(`${process.env.NEXT_PUBLIC_SERVICE_BACKEND_API}/api/tasks`, taskDataCreation, {
      //  await axios.post(`http://localhost:8000/api/tasks`, taskDataCreation, {
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then((res) => {
          setTimeout(() => {
            onTaskAssigned(preOrderId); // Notify parent component
            toast.success("Setup Task assigned successfully");
            setIsOpen(false); // Close modal
            setIsAnimating(false)
          }, 5000); 
        })
        .catch((err) => {
          console.log(err);
          toast.error("Error occured while assigning Task!", err);
        });

      // toast.success("Task assigned successfully");
    } catch (error) {
      console.error("Error assigning task:", error);
      alert("Failed to assign task");
    }
  };

  return (
    <div className="flex w-full font-sans z-9999">
      <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
        <Dialog.Trigger asChild>
          <button
            onClick={() => setIsOpen(true)}
            className="px-4 py-2 text-sm font-medium text-white hover:bg-blue-800  w-full border border-1 bg-blue-600 rounded-lg border-gray-200 text-center"
          >
            Assign Task
          </button>
        </Dialog.Trigger>

        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40" />
          <Dialog.Content className="flex items-center justify-center fixed inset-0 w-full h-full bg-transparent"   
          onPointerDown={(e) => e.stopPropagation()} // Prevent click propagation
          >
            <div className="w-[35%] h-auto  bg-white rounded-lg p-8 shadow-lg relative" onClick={(e) => e.stopPropagation()}>
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
                  <label className="block font-sans text-[14px] text-gray-700 mb-1">
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

                {/* <div className="mb-4 flex gap-5">
                  {selectedTechnicians.map((tech) => (
                    <div key={tech.technician_id} className="bg-blue-100 w-fit text-blue-800 px-3 py-2 rounded-md flex items-center justify-between mb-2">
                      {tech.name}
                      <button onClick={() => handleRemoveTechnician(tech.technician_id)} className="text-red-500 font-bold">
                        ×
                      </button>
                    </div>
                  ))}
                </div> */}

                <div className="mb-4 max-h-[90px] overflow-y-scroll border rounded-md p-2 flex flex-wrap gap-2">
                  {selectedTechnicians.map((tech) => (
                    <div 
                      key={tech.technician_id} 
                      className="bg-blue-100 text-blue-800 px-3 py-2 rounded-md flex items-center gap-2"
                    >
                      <span>{tech.name}</span>
                      <button 
                        onClick={() => handleRemoveTechnician(tech.technician_id)}
                        className="text-red-500 hover:text-red-700 font-bold ml-1"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mb-6">
                  <label className="block font-sans text-[14px] text-gray-700 mb-1">
                    Assigning Date
                  </label>
                  <input
                    type="date"
                    className="date-input rounded-md border w-full p-2"
                    value={servicingDate}
                    onChange={(e) => setServicingDate(e.target.value)}
                  />
                </div>

                <div className="mb-6">
                  <label className="block font-sans text-[14px] text-gray-700 mb-1">
                    Assigning Time
                  </label>
                  {/* <input
                    type="time"
                    className="time-input rounded-md border w-full p-2"
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

                {/* <div className="flex justify-center mt-8">
                  <button
                    type="submit"
                    className="bg-purple-600 text-white py-2 px-8 rounded text-[16px] hover:bg-purple-700"
                  >
                    Submit
                  </button>
                </div> */}

                <div className="flex justify-center mt-8">
                  <button
                    type="submit"
                    className={`order ${isAnimating ? "animate" : ""}`}
                    disabled={!isFormValid}
                  >
                    <span className="default">Submit</span>
                    <span className="success p-5">Installation will be done soon ✅</span>
                    <svg viewBox="0 0 12 10">
                      <polyline points="1.5 6 4.5 9 10.5 1" />
                    </svg>
                    <div className="box"></div>
                    <div className="truck">
                      <div className="back"></div>
                      <div className="front">
                        <div className="window"></div>
                      </div>
                      <div className="light top"></div>
                      <div className="light bottom"></div>
                    </div>
                    <div className="lines"></div>
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
