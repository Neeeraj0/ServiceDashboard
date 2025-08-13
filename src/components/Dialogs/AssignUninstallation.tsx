import * as Dialog from "@radix-ui/react-dialog";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import TimePicker from "../TimePicker/TimePicker";
// import '../BreakdownCalls/module.style.css';
import './module.style.css';
import { useAuth } from "@/app/context/AuthContext";
import { useTechnicians } from "@/hooks/useTechnicians";
import { gsap } from 'gsap'; // Add this import

interface ACUnit {
  type: string;
  capacity: string;
  quantity: number;
  orderId?: string;
}

interface Technician {
  name: string;
  technician_id: string;
}

interface DeviceId {
  orderId: string;
  deviceId?: string | null;
  deviceType: string;
  deviceTon: string;
  serialId: string | null;
  _id: string;
}

interface UninstallationTask {
  _id: string;
  addressId: string;
  deviceIds: DeviceId[];
  reasonForUninstallation: string;
  tentativeUninstallationDate: string;
  status: string;
  createdBy: string;
  customerId: string;
  __v: number;
}

interface ShippingAddress {
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
  _id: string;
  contactNumber: string;
  contactPerson: string;
}

interface UninstallationResponse {
  task: UninstallationTask;
  customerName: string;
  shippingAddress: ShippingAddress;
}

interface AssignTaskProps {
  preOrderId: string; // This will be the uninstallation task ID
  parentPreOrderId: string;
  clientName: string;
  clientNumber: string;
  description: string; // This will be the reason for uninstallation
  addressDisplay: string;
  ac_units: ACUnit[]; // Converted from deviceIds
  contactNumber: string;
  contactName: string;
  onTaskAssigned: (id: string) => void;
  uninstallationTaskData: UninstallationResponse; // Complete task data passed from parent
}

export default function AssignUninstallation({
  preOrderId,
  parentPreOrderId,
  clientName,
  clientNumber,
  description,
  addressDisplay,
  ac_units,
  contactNumber,
  contactName,
  onTaskAssigned,
  uninstallationTaskData
}: AssignTaskProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [technicianName, setTechnicianName] = useState("");
  const [servicingDate, setServicingDate] = useState("");
  const [servicingTime, setServicingTime] = useState("");
  const [filteredTechnicians, setFilteredTechnicians] = useState<Technician[]>([]);
  const [selectedTechnicians, setSelectedTechnicians] = useState<Technician[]>([]);
  // const [isAnimating, setIsAnimating] = useState(false);
  const { userName, loading } = useAuth();
  // const [isSubmitting, setIsSubmitting] = useState(false);
  const submitTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false); // <-- Add thi
  const technicians = useTechnicians();

  const truckButtonRef = useRef<HTMLButtonElement>(null);

  const startTruckAnimation = () => {
    if (!truckButtonRef.current) return;
    
    const button = truckButtonRef.current;
    const box = button.querySelector('.box');
    const truck = button.querySelector('.truck');

    if (!button.classList.contains('done')) {
      if (!button.classList.contains('animation')) {
        button.classList.add('animation');

        gsap.to(button, {
          '--box-s': 1,
          '--box-o': 1,
          duration: .3,
          delay: .5
        });

        gsap.to(box, {
          x: 0,
          duration: .4,
          delay: .7
        });

        gsap.to(button, {
          '--hx': -5,
          '--bx': 50,
          duration: .18,
          delay: .92
        });

        gsap.to(box, {
          y: 0,
          duration: .1,
          delay: 1.15
        });

        gsap.set(button, {
          '--truck-y': 0,
          '--truck-y-n': -26
        });

        gsap.to(button, {
          '--truck-y': 1,
          '--truck-y-n': -25,
          duration: .2,
          delay: 1.25,
          onComplete() {
            gsap.timeline({
              onComplete() {
                button.classList.add('done');
              }
            }).to(truck, {
              x: 0,
              duration: .4
            }).to(truck, {
              x: 40,
              duration: 1
            }).to(truck, {
              x: 20,
              duration: .6
            }).to(truck, {
              x: 96,
              duration: .4
            });
            
            gsap.to(button, {
              '--progress': 1,
              duration: 2.4,
              ease: "power2.in"
            });
          }
        });
      }
    }
  };

  // Add this function to reset the animation
  const resetTruckAnimation = () => {
    if (!truckButtonRef.current) return;
    
    const button = truckButtonRef.current;
    const box = button.querySelector('.box');
    const truck = button.querySelector('.truck');

    button.classList.remove('animation', 'done');
    
    gsap.set(truck, { x: 4 });
    gsap.set(button, {
      '--progress': 0,
      '--hx': 0,
      '--bx': 0,
      '--box-s': .5,
      '--box-o': 0,
      '--truck-y': 0,
      '--truck-y-n': -26
    });
    gsap.set(box, {
      x: -24,
      y: -6
    });
  };

  useEffect(() => {
    return () => {
      if (submitTimeoutRef.current) {
        clearTimeout(submitTimeoutRef.current);
      }
    };
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
      toast.error(
        "Invalid input: servicingDate and servicingTime are required"
      );
      return null;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(servicingDate)) {
      toast.error("Invalid servicingDate format. Expected YYYY-MM-DD");
      return null;
    }
    if (!/^\d{2}:\d{2}$/.test(servicingTime)) {
      toast.error("Invalid servicingTime format. Expected HH:MM");
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
    if (isSubmitting || isAnimating) return;
    setIsSubmitting(true);
    setIsAnimating(true);
    startTruckAnimation();
    const timeIn24Hour = convertTo24HourFormat(servicingTime);
    const servicingDateTime = mergeDateTimeToISO(servicingDate, timeIn24Hour);
    
    if (!servicingDateTime) {
      setIsSubmitting(false);
      setIsAnimating(false);
      setIsSubmitted(true);
      return;
    }

    try {
      console.log("Using passed uninstallation task data:", uninstallationTaskData);
      
      const uninstallationTask = uninstallationTaskData.task;
      
      const transformedDevices = uninstallationTask.deviceIds.map((device: any, index: number) => {
        const modelCapacity = device.deviceTon === "S10" ? "S10"
          : device.deviceTon === "S15" ? "S15"
          : device.deviceTon === "S20" ? "S20"
          : device.deviceTon === "S30" ? "S30"
          : device.deviceTon === "C10" ? "C10"
          : device.deviceTon === "C15" ? "C15"
          : device.deviceTon === "C20" ? "C20"
          : device.deviceTon === "C30" ? "C30"
          : device.deviceTon;

        const deviceName = `${device.deviceTon}-${index + 1}`;

        return {
          type: `${device.deviceType} AC`,
          capacity: modelCapacity,
          quantity: 1,
          deviceName: deviceName,
          orderId: device.orderId,
          deviceId: device.deviceId || null,
          serialId: device.serialId || null,
          originalDeviceInfo: device
        };
      });

      const taskDataCreation = {
        title: "Uninstallation",
        description: description || "Uninstallation task",
        servicingDate: servicingDateTime,
        status: "open",
        address: [{ location: addressDisplay }],
        client_number: clientNumber,
        client_name: clientName,
        ac_units: transformedDevices,
        quantity: totalQuantity,
        taskType: "uninstallation",
        approvalPending: false,
        parentPreorder: parentPreOrderId,
        preOrderId: preOrderId,
        assignedTechnicians: selectedTechnicians.map((tech) => tech.name),
        contactPerson: {
          name: contactName,
          phone_number: contactNumber
        },
        assignedBy: userName ? [userName] : [],
        reasonForUninstallation: description,
        customerId: uninstallationTask.customerId
      };

      console.log("Creating technician task with data:", taskDataCreation);

      // Create the technician task
      await axios.post(`http://35.154.208.29:8080/api/tasks`, taskDataCreation, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      await axios.post(
        `http://35.154.208.29:1883/api/uninstallation/updateStatus`,
        {
          status: "assigned",
          id: preOrderId
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_SALES_BACKEND_TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      );

      submitTimeoutRef.current = setTimeout(() => {
        onTaskAssigned(preOrderId);
        toast.success("Uninstallation task assigned successfully");
        setIsOpen(false);
        setIsAnimating(false);
        setIsSubmitting(false);
        setIsSubmitted(false);
        
        // Reset form
        setSelectedTechnicians([]);
        setServicingDate("");
        setServicingTime("");
        setTechnicianName("");
      }, 7000); // Reduced timeout for better UX

    } catch (error: any) {
      console.error("Error assigning uninstallation task:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      toast.error("Failed to assign uninstallation task: " + (error.response?.data?.message || error.message || "Unknown error"));
      setIsSubmitting(false);
      setIsAnimating(false);
    }
  };

  return (
    <div className="flex w-full font-sans">
      <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
        <Dialog.Trigger asChild>
          <button
            onClick={() => setIsOpen(true)}
            className="px-4 py-2 text-sm font-medium text-white hover:bg-[#A14996] w-full border border-1 bg-[#A14996] rounded-lg border-gray-200 text-center"
          >
            Assign Task
          </button>
        </Dialog.Trigger>

        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40" />
          <Dialog.Content 
            className="flex items-center justify-center fixed inset-0 w-full h-full bg-transparent"   
            onPointerDown={(e) => e.stopPropagation()} 
          >
            <div className="w-[35%] h-auto max-h-[80vh] bg-white rounded-lg p-8 shadow-lg relative" onClick={(e) => e.stopPropagation()}>
              <Dialog.Title className="text-center font-sans text-lg font-medium">
                Assign Uninstallation Task
              </Dialog.Title>
              <Dialog.Description className="text-center text-sm text-gray-600 mt-2">
                Select technician and enter uninstallation service details.
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

                <div className="mb-4 max-h-[120px] overflow-y-auto border rounded-md p-2">
                  {selectedTechnicians.length === 0 ? (
                    <p className="text-gray-500 text-sm">No technicians selected</p>
                  ) : (
                    selectedTechnicians.map((tech) => (
                      <div key={tech.technician_id} className="bg-blue-100 text-blue-800 px-3 py-2 rounded-md flex items-center justify-between mb-2">
                        {tech.name}
                        <button 
                          type="button"
                          onClick={() => handleRemoveTechnician(tech.technician_id)} 
                          className="text-red-500 font-bold hover:text-red-700"
                        >
                          ×
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <div className="mb-6">
                  <label className="block font-sans text-[14px] text-gray-700 mb-1">
                    Uninstallation Date
                  </label>
                  <input
                    type="date"
                    className="date-input rounded-md border w-full p-2"
                    value={servicingDate}
                    onChange={(e) => setServicingDate(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-6">
                  <label className="block font-sans text-[14px] text-gray-700 mb-1">
                    Uninstallation Time
                  </label>
                  <select
                    className="form-control w-full p-2 border rounded"
                    value={servicingTime}
                    onChange={(e) => setServicingTime(e.target.value)}
                    required
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
                  <button ref={truckButtonRef} className="truck-button">
                    <span className="default">Submit Task</span>
                    <span className="success font-bold">
                      Adiós, amigo!
                      <svg viewBox="0 0 12 10">
                        <polyline points="1.5 6 4.5 9 10.5 1"></polyline>
                      </svg>
                    </span>
                    <div className="truck">
                      <div className="wheel"></div>
                      <div className="back"></div>
                      <div className="front"></div>
                      <div className="box"></div>
                    </div>
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