import React, { useEffect, useState } from "react";
import { formatDate } from "../utils/dateUtils";

// Types for your data
interface Technician {
  _id: string;
  name: string;
  email: string;
  role: string;
  phone: string;
  technician_id: string;
}

interface Address {
  location: string;
}

interface AcUnit {
  type: string;
  capacity: string;
  quantity: number;
}

interface Task {
  _id: string;
  title: string;
  description: string;
  assignedTechnicians: Technician[];
  complaintRaised: string;
  status: string;
  taskType: string;
  assignedBy: string;
  task_id: string;
  client_name: string;
  client_number: string;
  address: Address[];
  ac_units: AcUnit[];
  servicingDate: string;
  assignedDate: string;
  customerComplaint: string;
  deviceid?: string; // Optional, as it was not in the example
}

const AssignedTasks: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    fetch("https://servicebackend.circolife.vip/api/breakdown/getAssigned")
      .then((res) => res.json())
      .then((data: Task[]) => {
        const firstFive = data.slice(0, 5);
        setTasks(firstFive);
      })
      .catch((err) => console.error("Error fetching tasks", err));
  }, []);

  return (
    <div className="p-4">
      <div className="flex justify-between">
        <h2 className="text-lg font-semibold mb-4">Today&apos;s Assigned Tasks</h2>

        <p className="text-blue-600 cursor-pointer">
            <button onClick={() => window.location.href="/breakdown/assigned"} className="text-blue-600">
                Show All
            </button>
        </p>
      </div>
      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-md p-5">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-gray-100 text-xs uppercase">
            <tr className="rounded-lg">
              <th className="p-2">Task ID</th>
              <th className="p-2">Technician Name</th>
              <th className="p-2">Task Type</th>
              <th className="p-2 w-30">Assigned Date & Time</th>
              <th className="p-2 whitespace-pre-wrap">Task Details</th>
              <th className="p-2 w-30">Contact Person</th>
              <th className="p-2 w-30">Customer Details</th>
              <th className="p-2">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {tasks.map((task) => (
              <tr key={task._id} className="hover:bg-gray-50">
                <td className="p-2">{task.task_id}</td>
                <td className="p-2">
                  {task.assignedTechnicians.map((tech) => (
                    <div key={tech.technician_id}>{tech.name}</div>
                  ))}
                </td>
                <td className="p-2 capitalize">{task.taskType}</td>
                <td className="p-2">
                  {task.assignedDate ? `${formatDate(task.assignedDate).date}` : "N/A"}
                  <br />
                  {task.assignedDate ? `${formatDate(task.assignedDate).time}` : "N/A"}
                </td>
                <td className="p-2 whitespace-pre-wrap">{task.description}</td>
                <td className="p-2">
                  {task.client_name} <br />
                  {task.client_number}
                </td>
                <td className="p-2">{task.customerComplaint}</td>
                <td className="p-2 text-blue-600 cursor-pointer">Assigned</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AssignedTasks;
