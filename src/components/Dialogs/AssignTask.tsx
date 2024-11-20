import * as Dialog from "@radix-ui/react-dialog";
import { useState, useEffect } from "react";
import axios from "axios";
import { ACUnit } from "@/types/breakdown/Order";

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

export default function AssignTask({
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
  const [selectedTechnicians, setSelectedTechnicians] = useState<Technician[]>([]); // Track selected technicians
  console.log(ac_units);
  useEffect(() => {
    const fetchTechnicians = async () => {
      try {
        const response = await axios.get(`http://35.154.208.29:8080/api/technicians/getTechnicians`);
        setTechnicians(response.data); 
      } catch (error) {
        console.error("Error fetching technicians:", error);
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

  const transformedACUnits = ac_units;
  const totalQuantity = transformedACUnits?.reduce((total, ac) => total + (ac.quantity || 1), 0);
  const queryData = {
    queryStatus: "assign",
  };

  const transformedACUnit = ac_units?.map((unit) => {
    let type, capacity;
  
    // Determine type and capacity based on model
    if (unit.model.startsWith("S")) {
      type = "Split AC";
      capacity = unit.model === "S10" ? "S10" : unit.model === "S15" ? "S15" : unit.model === "S20" ? "S20" : unit.model;
    } else if (unit.model.startsWith("C")) {
      type = "Cassette AC";
      capacity = unit.model === "C10" ? "C10" : unit.model === "C15" ? "C15" : unit.model === "C20" ? "C20": unit.model === "C30" ? "C30" : unit.model;
    } else {
      type = "Split AC"; // or handle other types as needed
      capacity = unit.model;
    }
  
    return {
      type,
      capacity,
      quantity: unit.quantity,
    };
  });
  

  const handleAssignTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const servicingDateTime = mergeDateTimeToISO(servicingDate, servicingTime);
    if (!servicingDateTime) {
      alert("Invalid servicing date or time.");
      return;
    }

    const taskDataCreation = {
      _id: orderId,
      title: "Breakdown",
      customerComplaint: customerComplaint,
      description,
      servicingDate: servicingDateTime,
      status: "open",
      address: [{ location: addressDisplay }],
      client_number: clientNumber,
      client_name: clientName,
      // ac_units: transformedACUnits?.map((unit) => ({
      //   type: "Split AC",
      //   capacity: unit.model,
      //   quantity: unit.quantity,
      // })),
      ac_units: transformedACUnit,
      quantity: 1,
      taskType: "breakdown",
      complaintRaised,
      assignedTechnicians: selectedTechnicians.map((tech) => tech.name), // Send selected technician names
    };

    try {
      await axios.post(`http://35.154.208.29:8080/api/tasks`, taskDataCreation, {
      //  await axios.post(`http://localhost:8000/api/tasks`, taskDataCreation, {
        headers: {
          "Content-Type": "application/json",
        },
      })
      axios({
        method: "PUT",
        url: `${'http://35.154.99.208:5000/api/query/changeQueryStatus'}/${orderId}`,
        headers: {
          "Content-Type": "application/json",
        },
        data: queryData,
      })
        .then((res) => {
          alert("Task assigned successfully");
        })
        .catch((err) => {
          console.log(err);
        });

      alert("Task assigned successfully");
      setIsOpen(false); // Close modal
    } catch (error) {
      console.error("Error assigning task:", error);
      alert("Failed to assign task");
    }
  };

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
                  <label className="block font-sans text-[14px] text-gray-700 mb-1">
                    Servicing Date
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
                    Servicing Time
                  </label>
                  <input
                    type="time"
                    className="time-input rounded-md border w-full p-2"
                    value={servicingTime}
                    onChange={(e) => setServicingTime(e.target.value)}
                  />
                </div>

                <div className="flex justify-center mt-8">
                  <button
                    type="submit"
                    className="bg-purple-600 text-white py-2 px-8 rounded text-[16px] hover:bg-purple-700"
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
}
