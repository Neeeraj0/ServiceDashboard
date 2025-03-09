"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import DefaultLayout from "@/components/Layouts/DefaultLaout";
import { formatDate } from "@/components/utils/dateUtils";
import Papa from "papaparse";
import './module.style.css';

const TaskHistoryPage = () => {
  const { userName, userId} = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_SERVICE_BACKEND_API}/api/users/assigned-by/${userId}`);
        const data = await res.json();
        if (data.success) {
          setTasks(data.tasks);
        }
      } catch (error) {
        console.error("Error fetching tasks: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  const downloadCSV = () => {
    setShowAnimation(true);

    const csvData = tasks.map((task) => ({
      "Assigned Technicians": task.assignedTechnicians.map((tech) => tech.name).join(", "),
      "Client Name": task.client_name,
      "Client Number": task.client_number,
      "Task ID": task.task_id,
      "Task Type": task.taskType,
      "Assigned Date": (() => {
        const formattedDate = formatDate(task.assignedDate);
        return `${formattedDate.date} ${formattedDate.time}`;
      })(),
      Status:
        task.status === "open"
          ? "OPEN"
          : task.status === "pending"
          ? "PENDING"
          : "COMPLETED",
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    setTimeout(() => {
      link.download = "task_history.csv";
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }, 2000);

    setTimeout(() => {
      setShowAnimation(false);
    }, 3000);
  };


  return (
    <DefaultLayout>
      <h5 className="text-gray-800 font-bold">Tasks Assigned By You</h5>
      <section className="bg-white dark:bg-gray-900 py-3 sm:py-5">
        <div className=" mx-auto max-w-screen-[100vw]">
          <div className="relative overflow-hidden bg-white shadow-md dark:bg-gray-800 sm:rounded-lg">
            <div className="flex flex-col px-4 py-3 space-y-3 lg:flex-row lg:items-center lg:justify-between lg:space-y-0 lg:space-x-4">
              <div className="flex justify-between flex-1 space-x-4">
                <h1 className="text-black font-extrabold">Total Tasks: {tasks.length}</h1>

                <button 
                type="button" 
                onClick={downloadCSV}
                class="flex items-center justify-center flex-shrink-0 px-3 py-2 text-sm font-medium text-green-700 bg-white border border-gray-200 rounded-lg focus:outline-none hover:bg-gray-100 hover:text-primary-700 focus:z-10 focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700">
                      <svg class="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewbox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                      </svg>
                      Export
                  </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              {loading ? (
                <p className="p-4">Loading tasks...</p>
              ) : tasks.length === 0 ? (
                <p className="p-4">No tasks found.</p>
              ) : (
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                    <tr>
                      <th className="px-4 py-3">Assigned Technicians</th>
                      <th className="px-4 py-3">Client Name</th>
                      <th className="px-4 py-3">Client Number</th>
                      <th className="px-4 py-3">Task ID</th>
                      <th className="px-4 py-3">Task Type</th>
                      <th className="px-4 py-3">Assigned Date</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map((task) => (
                      <tr
                        key={task._id}
                        className="border-b dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <td className="px-4 py-2">
                          {task.assignedTechnicians
                            .map((tech) => tech.name)
                            .join(", ") || "No Technicians Assigned"}
                        </td>
                        <td className="px-4 py-2">{task.client_name}</td>
                        <td className="px-4 py-2">{task.client_number}</td>
                        <td className="px-4 py-2">{task.task_id}</td>
                        <td className="px-4 py-2 capitalize">{task.taskType}</td>
                        <td className="px-4 py-2">
                        {(() => {
                            const formattedDate = formatDate(task.assignedDate);
                            return `${formattedDate.date} ${formattedDate.time}`;
                        })()}
                        </td>
                        <td className="px-4 py-2 capitalize font-extrabold status-cell">
                          {task.status === "open" && <span className="status-dot open"> OPEN</span>}
                          {task.status === "pending" && <span className="status-dot pending"> PENDING</span>}
                          {task.status === "Completed" && <span className="status-dot completed"> COMPLETED</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            {/* pagination */}
          </div>
        </div>
      </section>
      {showAnimation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
            <img
            src={'/images/illustration/Animation - 1734419092020.gif'}
            alt="Downloading..."
            className="w-40 h-40"
            />
            <p className="absolute bottom-10 text-white font-bold text-lg">
            Downloading CSV...
            </p>
        </div>
        )}
    </DefaultLayout>
  );
};

export default TaskHistoryPage;
