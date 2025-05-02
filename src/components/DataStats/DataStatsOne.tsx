"use client";

import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useAuth } from '@/app/context/AuthContext';
import Chart from 'chart.js/auto';
import { Loader2, Plus, RefreshCwIcon } from 'lucide-react';
import AssignedTasks from './getAssigned';
import OverdueTasks from './getOverdue';

// Define the type based on the actual API response structure
type BreakdownSummary = {
  _id: string;
  userid: string;
  contactperson: string;
  contactnumber: string;
  contactemail: string;
  image: string;
  subject: string;
  summery: string;
  type: string;
  status: boolean;
  deviceid: string;
  TimeStamp: string;
  customer_id: string;
  address: string;
  __v: number;
  queryStatus?: string;
  resolvedAt?: string;
  resolvenote?: string;
  flat: string;
  area: string;
  city: string;
  state: string;
  pincode: string;
  longitude: string;
  latitude: string;
  orderModels: any[];
};

type TaskSubjectCount = {
  [key: string]: number;
};

type TaskStatusCount = {
  today: number;
  pending: number;
  completed: number;
  overdue: number;
};

const TaskCard = ({ task }: { task: any }) => {

  const handleAssign = () => {
    console.log("Assigning task:", task);
    window.location.href = `/breakdown/open`;
  }
  // Determine task type based on API data
  const getTaskType = (task: any) => {
    if (task.type === "Query") return "Breakdown Call";
    if (task.orderModels && task.orderModels.length > 0) {
      return `Routine Service - ${task.orderModels[0]?.serviceType || "Standard"}`;
    }
    return task.type || "Service";
  };

  return (
    <div className="p-3 bg-white rounded-lg shadow-md mb-4 border-l border-gray-200">
      <div className="flex justify-between items-start">
        <div>
          <div className="mb-2">
            <span className="text-lg font-semibold text-gray-800">Customer Name : </span>
            <span className="text-lg text-gray-800">{task.contactperson || "N/A"}</span>
          </div>
          <div className="mb-2">
            <span className="text-lg font-semibold text-gray-800">Customer Mobile : </span>
            <span className="text-lg text-gray-800">{task.contactnumber || "N/A"}</span>
          </div>
          <div className="mb-2">
            <span className="text-lg font-semibold text-gray-800">Task Type : </span>
            <span className="text-lg text-gray-800">{getTaskType(task)}</span>
          </div>
          {task.subject && (
            <div className="mb-2">
              <span className="text-lg font-semibold text-gray-800">Issue found: </span>
              <span className="text-lg text-gray-800">{task.subject}</span>
            </div>
          )}
          <div className="mb-2">
              <span className="text-lg font-semibold text-gray-800">Devices: </span>
              <span className="text-lg text-gray-800">{task.deviceid || "Non App User"}</span>
          </div>
        </div>
        <button 
          onClick={handleAssign}
          className="px-4 py-2 text-blue-500 bg-gray-200 hover:bg-blue-50 rounded-md font-medium flex items-center">
          <Plus className="w-4 h-4 mr-1" /> Assign
        </button>
      </div>
    </div>
  );
};

function Dashboard() {
  const [backendData, setBackendData] = useState<BreakdownSummary[]>([]);
  const [todayTasksCount, setTodayTasksCount] = useState(0);
  const [displayCount, setDisplayCount] = useState(0);
  const [breakdownCounts, setBreakdownCounts] = useState<TaskStatusCount>({
    today: 0,
    pending: 0,
    completed: 0,
    overdue: 0
  });
  const { userName, loading } = useAuth();
  const [tasksBySubject, setTasksBySubject] = useState<TaskSubjectCount>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  const chartContainer = useRef<HTMLDivElement>(null);
  const [timeFilter, setTimeFilter] = useState('7 Days');
  const [todayTasks, setTodayTasks] = useState<any[]>([]);

  // Calculate tasks by subject for today
  const calculateTodayTasksBySubject = (tasks: BreakdownSummary[]) => {
    const todayDate = new Date().toISOString().split('T')[0];
    const todayTasks = tasks.filter(task => 
      task.TimeStamp.split('T')[0] === todayDate
    );

    console.log("Today's tasks:", todayTasks);

    const subjectCount: TaskSubjectCount = {};
    todayTasks.forEach(task => {
      const subject = task.subject || 'Unspecified';
      subjectCount[subject] = (subjectCount[subject] || 0) + 1;
    });

    console.log("Task subjects calculated:", subjectCount);
    setTasksBySubject(subjectCount);
    
    // Add a small delay to ensure DOM is ready
    setTimeout(() => {
      updateChart(subjectCount);
    }, 100);
  };

  // Calculate breakdown status counts
  const calculateBreakdownCounts = (tasks: BreakdownSummary[]) => {
    const todayDate = new Date().toISOString().split('T')[0];
    const now = new Date();
    
    // Today's tasks
    const todayTasks = tasks.filter(task => 
      task.TimeStamp.split('T')[0] === todayDate
    ).length;
    
    // Pending tasks (no resolvedAt and status is not complete)
    const pendingTasks = tasks.filter(task => 
      !task.resolvedAt && task.queryStatus !== 'complete'
    ).length;
    
    // Completed tasks (have resolvedAt or status is complete)
    const completedTasks = tasks.filter(task => 
      task.resolvedAt || task.queryStatus === 'complete'
    ).length;
    
    // Overdue tasks (older than today and not resolved)
    const overdueTasks = tasks.filter(task => {
      const taskDate = new Date(task.TimeStamp);
      return taskDate < now && !task.resolvedAt && task.queryStatus !== 'complete';
    }).length;
    
    setBreakdownCounts({
      today: todayTasks,
      pending: pendingTasks,
      completed: completedTasks,
      overdue: overdueTasks
    });
    
    setTodayTasksCount(todayTasks);
  };

  const updateChart = (subjectCount: TaskSubjectCount) => {
    if (!chartRef.current) {
      console.error("Chart canvas reference is null");
      return;
    }
    if (chartInstance.current) {
      console.log("Destroying existing chart instance");
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) {
      console.error("Failed to get canvas context");
      return;
    }

    try {
      console.log("Creating new chart instance");
      chartInstance.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: Object.keys(subjectCount),
          datasets: [{
            label: 'Breakdown Issues',
            data: Object.values(subjectCount),
            backgroundColor: 'rgba(173, 216, 230, 0.7)',
            borderColor: 'rgba(173, 216, 230, 1)',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          indexAxis: 'y', // Horizontal bar chart
          plugins: {
            legend: {
              display: false
            },
            title: {
              display: true,
              font: {
                size: 16,
                weight: 'bold'
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: {
                display: false
              }
            },
            x: {
              beginAtZero: true,
              grid: {
                color: 'rgba(0, 0, 0, 0.05)'
              },
              ticks: {
                stepSize: 1
              }
            }
          }
        }
      });
      console.log("Chart created successfully");
    } catch (err) {
      console.error("Error creating chart:", err);
      setError("Failed to create chart");
    }
  };

  // Function to get time-based greeting
  const getTimeBasedGreeting = () => {
    const currentHour = new Date().getHours();
    
    if (currentHour < 12) {
      return {
        greeting: "Good Morning",
        icon: "/images/task/greet.png", // Replace with your actual image path
      };
    }
  
    if (currentHour < 18) {
      return {
        greeting: "Good Afternoon",
        icon: "/images/task/greet.png", // Optional different image
      };
    }
  
    return {
      greeting: "Good Evening",
      icon: "/images/task/night-greet.png", // Replace with your actual image path
    };
  };
  
  // Animated counter effect
  useEffect(() => {
    let start = 0;
    const end = todayTasksCount;
    const duration = 1000; // Animation duration in milliseconds
    const increment = end / (duration / 16); // Update every 16ms (60fps)
    
    if (start === end) return;

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setDisplayCount(end);
        clearInterval(timer);
      } else {
        setDisplayCount(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [todayTasksCount]);

  // Fetching tasks from the API
  const fetchTasks = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await axios.get('https://production.circolife.vip/api/query/queries/all', {
        headers: {
          "Content-Type": "application/json",
        },
      });
      console.log("Fetched Data: ", res.data.allQueries);
      
      // Process and enhance the data
      const processedData = res.data.allQueries.map((order: any) => ({
        ...order,
        contactperson: order.contactperson || "N/A",
        contactnumber: order.contactnumber || "N/A",
        subject: order.subject || "N/A",
        summary: order.summery || "N/A",
        address: [
          order.flat || '',
          order.area || '',
          order.address || '',
          order.city || '',
          order.state || '',
          order.pincode || ''
        ]
          .filter(part => part.trim() !== '') // Remove empty parts
          .join(', ') || "N/A", // Join non-empty parts with a comma
        deviceid: order.deviceid || "N/A",
        orderModels: order.orderModels || [],
      }));
      const activeOrders = processedData.filter(
        (order: any) =>
          order.status === true &&
          (!order.queryStatus || order.queryStatus.toLowerCase() === "open")
      );
      setBackendData(activeOrders);
      
      // Get the latest 3 tasks (sort by timestamp desc)
      const sortedTasks = [...activeOrders].sort((a, b) => 
        new Date(b.TimeStamp).getTime() - new Date(a.TimeStamp).getTime()
      );
      
      // Take first 3 tasks
      setTodayTasks(sortedTasks.slice(0, 3));
      
      calculateBreakdownCounts(processedData);
      calculateTodayTasksBySubject(processedData);
      setIsLoading(false);
    } catch (err) {
      console.error("API Error:", err);
      setError("Failed to fetch data");
      setIsLoading(false);
      setBackendData([]); 
      setTodayTasks([]);
      calculateBreakdownCounts([]);
      calculateTodayTasksBySubject([]);
    }
  };
  
  // Initialize data on component mount
  useEffect(() => {
    fetchTasks();
    
    // Set up resize observer for chart responsiveness
    const resizeObserver = new ResizeObserver(() => {
      if (chartInstance.current) {
        chartInstance.current.resize();
      }
    });
    
    if (chartContainer.current) {
      resizeObserver.observe(chartContainer.current);
    }
    
    return () => {
      resizeObserver.disconnect();
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, []);

  // Additional effect to handle chart creation after DOM is fully ready
  useEffect(() => {
    if (Object.keys(tasksBySubject).length > 0 && chartRef.current) {
      updateChart(tasksBySubject);
    }
  }, [chartRef.current]);

  // Force chart recreation when window is resized
  useEffect(() => {
    const handleResize = () => {
      if (chartInstance.current && Object.keys(tasksBySubject).length > 0) {
        // Short timeout to let the resize complete
        setTimeout(() => {
          updateChart(tasksBySubject);
        }, 100);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [tasksBySubject]);
  
  const { greeting, icon } = getTimeBasedGreeting();

  // If auth is still loading, show a loading spinner
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-center">
        <div className="flex flex-col w-full">
          {/* User Greeting Section */}
          <div className="pb-6 pt-2 flex">
            <h1 className="text-4xl font-extrabold text-black dark:text-white flex items-center space-x-3">
              <img src={icon} alt={greeting} className="w-20 h-20" />
              <span className="text-gray-500 dark:text-gray-400">
                {greeting}
              </span>, 
              {userName?.split(' ')[0] || "User"}
            </h1>
          </div>

          {isLoading ? (
            <div className="flex justify-center mt-[40vh] lg:mt-[50vh] items-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 p-4 rounded-lg border border-red-200 text-red-700">
              <p>{error}</p>
              <button 
                onClick={fetchTasks}
                className="mt-2 px-4 py-2 bg-red-100 hover:bg-red-200 rounded-lg text-sm"
              >
                Retry
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-10">
                {/* Routine Servicing Section */}
                <div className="rounded-lg p-6">
                  <h2 className="text-xl font-extrabold text-gray-800 mb-4 dark:text-white">Routine Servicing</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg shadow-md bg-white border-b  p-4">
                      <p className="text-gray-700 font-medium">Today&apos;s tasks</p>
                      <div className="mt-2 flex items-center justify-center rounded-full bg-pink-100 text-pink-700 font-bold text-sm w-16 h-16">
                        1 
                      </div>
                    </div>
                    <div className="rounded-lg shadow-md bg-white border-b  p-4">
                      <p className="text-gray-700 font-medium">Pending</p>
                      <div className="mt-2 flex items-center justify-center rounded-full bg-cyan-100 text-cyan-700 font-bold text-sm w-16 h-16">
                        1 
                      </div>
                    </div>
                    <div className="rounded-lg shadow-md bg-white border-b p-4">
                      <p className="text-gray-700 font-medium">Completed</p>
                      <div className="mt-2 flex items-center justify-center rounded-full bg-green-100 text-green-700 font-bold text-sm w-16 h-16">
                        1 
                      </div>
                    </div>
                    <div className="rounded-lg shadow-md bg-white border-b p-4">
                      <p className="text-gray-700 font-medium">Overdue</p>
                      <div className="mt-2 flex items-center justify-center rounded-full bg-red-100 text-red-700 font-bold text-sm w-16 h-16">
                        1 
                      </div>
                    </div>
                  </div>
                </div>

                {/* Breakdown Call Section */}
                <div className="rounded-lg p-6">
                  <h2 className="text-xl font-extrabold text-gray-800 mb-4 dark:text-white">Breakdown Calls</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg shadow-md bg-white border-b p-4">
                      <p className="text-gray-700 font-medium">Today&apos;s tasks</p>
                      <div className="mt-2 flex items-center justify-center rounded-full bg-pink-100 text-pink-700 font-bold text-sm w-16 h-16">
                        {displayCount}
                      </div>
                    </div>
                    <div className="rounded-lg shadow-md bg-white border-b p-4">
                      <p className="text-gray-700 font-medium">Pending</p>
                      <div className="mt-2 flex items-center justify-center rounded-full bg-cyan-100 text-cyan-700 font-bold text-sm w-16 h-16">
                        {breakdownCounts.pending}
                      </div>
                    </div>
                    <div className="rounded-lg shadow-md bg-white border-b p-4">
                      <p className="text-gray-700 font-medium">Completed</p>
                      <div className="mt-2 flex items-center justify-center rounded-full bg-green-100 text-green-700 font-bold text-sm w-16 h-16">
                        {breakdownCounts.completed}
                      </div>
                    </div>
                    <div className="rounded-lg shadow-md bg-white border-b p-4">
                      <p className="text-gray-700 font-medium">Overdue</p>
                      <div className="mt-2 flex items-center justify-center rounded-full bg-red-100 text-red-700 font-bold text-sm w-16 h-16">
                        {breakdownCounts.overdue}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Chart Section - MODIFIED */}
              <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left side: Chart Section */}
                <div className="rounded-lg p-6 bg-white shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">Breakdown Issues</h2>
                    <div className="relative">
                      <select 
                        value={timeFilter}
                        onChange={(e) => setTimeFilter(e.target.value)}
                        className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                      >
                        <option value="7 Days">7 Days</option>
                        <option value="14 Days">14 Days</option>
                        <option value="30 Days">30 Days</option>
                      </select>
                    </div>
                  </div>
                  <div ref={chartContainer} className="h-[400px] w-full relative">
                    {Object.keys(tasksBySubject).length === 0 ? (
                      <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                        No breakdown issues found
                      </div>
                    ) : null}
                    <canvas ref={chartRef}></canvas>
                  </div>
                  <div className="mt-4 flex flex-row items-right justify-end">
                    <button 
                      onClick={fetchTasks} 
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm flex items-center space-x-2"
                    >
                      <RefreshCwIcon />
                      <span>Refresh Data</span>
                    </button>
                  </div>
                </div>

                {/* Right side: Today's Open Tasks */}
                <div className="flex flex-col">
                  <div className="bg-green-300 shadow-lg rounded-lg inline-block px-8 py-4 mb-6">
                    <h2 className="text-xl font-bold text-gray-800">Today's Open Tasks</h2>
                  </div>
                  <div className="bg-white rounded-xl p-6 shadow-sm flex-grow overflow-y-auto max-h-[500px]">
                    {todayTasks.length > 0 ? (
                      todayTasks.map((task) => (
                        <TaskCard key={task._id} task={task} />
                      ))
                    ) : (
                      <div className="py-8 text-center text-gray-500">
                        No tasks available for today
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      <AssignedTasks />
      <OverdueTasks />
    </>
  );   
}

export default Dashboard;