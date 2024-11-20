import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BreakdownSummary } from '@/types/breakdownSummary';

function Dashboard() {
  const [backendData, setBackendData] = useState<BreakdownSummary[]>([]);
  const [counts, setCounts] = useState({
    today: 0,
    pending: 0,
    completed: 0,
    overdue: 0
  });

  // Fetching tasks from the API
  const fetchTasks = async () => {
    try {
      const res = await axios.get('http://35.154.99.208:5000/api/query/queries/all', {
        headers: {
          "Content-Type": "application/json",
        },
      });
      console.log("Fetched Data: ", res.data.data);
      setBackendData(res.data.data as BreakdownSummary[]);

      // Count tasks based on queryStatus and other criteria
      calculateCounts(res.data.data);
    } catch (err) {
      console.log(err);
    }
  };

  // Calculate counts for different categories
  const calculateCounts = (tasks: BreakdownSummary[]) => {
    const todayDate = new Date().toISOString().split('T')[0]; // Get today's date in yyyy-mm-dd format
  
    let today = 0;
    let pending = 0;
    let completed = 0;
    let overdue = 0;
  
    tasks.forEach((task: BreakdownSummary) => { // Now `task` is typed as `Task`
      const taskDate = task.TimeStamp.split('T')[0]; // Extract date part from timestamp
      const lastUpdatedDate = task.lastUpdated?.split('T')[0] || ''; // Extract date from lastUpdated
  
      // Today's tasks (created today)
      if (taskDate === todayDate) {
        today++;
      }
  
      // Pending tasks (open and status = true)
      if (task.queryStatus === 'open' && task.status === true) {
        pending++;
      }
  
      // Completed tasks (completed tasks)
      if (task.queryStatus === 'complete') {
        completed++;
      }
  
      // Overdue tasks (open but last updated date is older than today)
      if (task.queryStatus === 'open' && lastUpdatedDate < todayDate) {
        overdue++;
      }
    });
  
    setCounts({
      today,
      pending,
      completed,
      overdue
    });
  };
  
  // Fetch tasks when the component mounts
  useEffect(() => {
    fetchTasks();
  }, []);

  return (
    <div className="flex items-center justify-center">
      <div className="flex flex-col w-[100vw]">
        <div className="grid grid-cols-12 gap-4 md:grid-cols-6 lg:grid-cols-12">
          {/* Routine Servicing Section */}
          <div className="rounded-lg shadow-lg bg-white dark:bg-gray-dark col-span-12 md:col-span-6 lg:col-span-6 w-full">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 dark:text-white">Routine Servicing</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg shadow-md bg-white border-b border-gray-500 p-4">
                <p className="text-gray-700 font-medium">Today's tasks</p>
                <div className="mt-2 flex items-center justify-center rounded-full bg-pink-100 text-pink-700 font-bold text-sm w-16 h-16">
                  1 (dummy)
                </div>
              </div>
              <div className="rounded-lg shadow-md bg-white border-b border-gray-500 p-4">
                <p className="text-gray-700 font-medium">Pending</p>
                <div className="mt-2 flex items-center justify-center rounded-full bg-cyan-100 text-cyan-700 font-bold text-sm w-16 h-16">
                  1 (dummy)

                </div>
              </div>
              <div className="rounded-lg shadow-md bg-white border-b border-gray-500 p-4">
                <p className="text-gray-700 font-medium">Completed</p>
                <div className="mt-2 flex items-center justify-center rounded-full bg-green-100 text-green-700 font-bold text-sm w-16 h-16">
                  1 (dummy)  
                </div>
              </div>
              <div className="rounded-lg shadow-md bg-white border-b border-gray-500 p-4">
                <p className="text-gray-700 font-medium">Overdue</p>
                <div className="mt-2 flex items-center justify-center rounded-full bg-red-100 text-red-700 font-bold text-sm w-16 h-16">
                  1 (dummy)
                </div>
              </div>
            </div>
          </div>

          {/* Breakdown Call Section */}
          <div className="rounded-lg shadow-lg bg-white dark:bg-gray-dark col-span-12 md:col-span-6 lg:col-span-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 dark:text-white">Breakdown Call</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg shadow-md bg-white border-b border-gray-500 p-4">
                <p className="text-gray-700 font-medium">Today's tasks</p>
                <div className="mt-2 flex items-center justify-center rounded-full bg-pink-100 text-pink-700 font-bold text-sm w-16 h-16">
                  {counts.today}
                </div>
              </div>
              <div className="rounded-lg shadow-md bg-white border-b border-gray-500 p-4">
                <p className="text-gray-700 font-medium">Pending</p>
                <div className="mt-2 flex items-center justify-center rounded-full bg-cyan-100 text-cyan-700 font-bold text-sm w-16 h-16">
                  {counts.pending}
                </div>
              </div>
              <div className="rounded-lg shadow-md bg-white border-b border-gray-500 p-4">
                <p className="text-gray-700 font-medium">Completed</p>
                <div className="mt-2 flex items-center justify-center rounded-full bg-green-100 text-green-700 font-bold text-sm w-16 h-16">
                  {counts.completed}
                </div>
              </div>
              <div className="rounded-lg shadow-md bg-white border-b border-gray-500 p-4">
                <p className="text-gray-700 font-medium">Overdue</p>
                <div className="mt-2 flex items-center justify-center rounded-full bg-red-100 text-red-700 font-bold text-sm w-16 h-16">
                  {counts.overdue}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
