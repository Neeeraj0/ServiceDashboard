"use client";
import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, RefreshCw } from 'lucide-react';
import DefaultLayout from '@/components/Layouts/DefaultLaout';
import TaskDetailsModal from '@/app/calendar/TaskDetailsModal';

const TechnicianGanttChart = () => {
  const [technicians, setTechnicians] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [filterStatus, setFilterStatus] = useState('free');

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const techResponse = await fetch('https://servicebackend.circolife.vip/api/technicians/getTechnicians');
      // const techResponse = await fetch('http://localhost:8080/api/technicians/getTechnicians');
      const techData = await techResponse.json();
      
      const taskResponse = await fetch('https://servicebackend.circolife.vip/api/technicians/getTodaysAssignedTask');
      // const taskResponse = await fetch('http://localhost:8080/api/technicians/getTodaysAssignedTask');
      const taskData = await taskResponse.json();

      const processedTechs = (Array.isArray(techData) ? techData : []).map(tech => ({
        ...tech,
        id: tech.technician_id // Use technician_id as the primary identifier
      }));

      const processedTasks = (Array.isArray(taskData.data) ? taskData.data : [])
        .filter(task => task.assignedTechnicians && task.assignedTechnicians.length > 0)
        .map(task => {
          const techIds = task.assignedTechnicians.map(tech => 
            typeof tech === 'string' ? tech : tech.technician_id
          );
          
          return {
            ...task,
            id: task._id?.$oid || task._id,
            assignedTechnicianIds: techIds, // Store just the technician_ids
            // date: new Date(task.servicingDate?.$date || task.servicingDate || task.startDate)
            date: parseISTDate(task.servicingDate || task.startDate),
            durationHours: 2 
          };
        });

      setTechnicians(processedTechs);
      setTasks(processedTasks);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert(`Failed to fetch data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Get tasks assigned to a specific technician by technician_id
  const getTechnicianTasks = (technicianId) => {
    return tasks.filter(task => 
      task.assignedTechnicianIds.includes(technicianId)
    );
  };

  // Helper function to parse IST string ignoring 'Z'
function parseISTDate(dateStr) {
  // Remove 'Z' if present
  if (dateStr.endsWith('Z')) {
    dateStr = dateStr.slice(0, -1);
  }
  // Append '+05:30' timezone offset
  return new Date(dateStr + '+05:30');
}


  // Generate time slots from 8AM to 8PM
  const timeSlots = Array.from({ length: 16 }, (_, i) => {
    const hour = i + 8;
    return {
      hour,
      label: `${hour.toString().padStart(2, '0')}:00`,
      start: new Date(new Date(selectedDate).setHours(hour, 0, 0, 0)),
      end: new Date(new Date(selectedDate).setHours(hour + 1, 0, 0, 0))
    };
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="animate-spin h-8 w-8 text-blue-500" />
        <span className="ml-2 text-gray-600">Loading data...</span>
      </div>
    );
  }

  const taskTypeColors = {
  installation: 'bg-blue-500',
  breakdown: 'bg-red-500',
  routine: 'bg-green-500',
  setup: 'bg-purple-500',
  siteSurvey: 'bg-yellow-500',
  default: 'bg-gray-400' // fallback color
};


  return (
    <DefaultLayout>
      <div className="p-6 bg-white min-h-screen">
        <div className="max-w-7xl mx-auto">
          {/* Header and controls */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-8 w-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Technician Schedule</h1>
                  <p className="text-gray-600">View assignments for {new Date(selectedDate).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                {/* <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                /> */}
                <button
                  onClick={fetchData}
                  className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center gap-3">
                <User className="h-6 w-6 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Technicians</p>
                  <p className="text-xl font-bold">{technicians.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center gap-3">
                <div className="h-6 w-6 bg-green-100 rounded-full flex items-center justify-center">
                  <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Available</p>
                  <p className="text-xl font-bold text-green-600">
                    {technicians.filter(tech => 
                      getTechnicianTasks(tech.id).length === 0
                    ).length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center gap-3">
                <div className="h-6 w-6 bg-red-100 rounded-full flex items-center justify-center">
                  <div className="h-3 w-3 bg-red-500 rounded-full"></div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Assigned</p>
                  <p className="text-xl font-bold text-red-600">
                    {technicians.filter(tech => 
                      getTechnicianTasks(tech.id).length > 0
                    ).length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center gap-3">
                <Clock className="h-6 w-6 text-orange-600" />
                <div>
                  <p className="text-sm text-gray-600">Active Tasks</p>
                  <p className="text-xl font-bold text-orange-600">
                    {tasks.filter(task => 
                      !['completed', 'cancelled'].includes(task.status?.toLowerCase())
                    ).length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4 mb-4">
            {Object.entries(taskTypeColors).filter(([key]) => key !== 'default').map(([type, colorClass]) => (
              <div key={type} className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded ${colorClass}`}></div>
                <span className="capitalize text-sm">{type}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-end mb-4">
            <label className="mr-2 font-medium text-sm text-gray-700 mt-2">Show:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="free">Free Technicians</option>
              <option value="occupied">Occupied Technicians</option>
            </select>
          </div>

          {/* Schedule Grid */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b">
              <h2 className="font-semibold text-gray-900">Assignment Timeline</h2>
            </div>
            
            <div className="overflow-x-auto">
              <div className="min-w-max">
                {/* Header Row */}
                <div className="flex border-b">
                  <div className="w-48 px-4 py-3 font-medium text-gray-700 border-r">Technician</div>
                  {timeSlots.map(slot => (
                    <div key={slot.label} className="w-24 px-2 py-3 text-sm font-medium text-gray-600 text-center border-r">
                      {slot.label}
                    </div>
                  ))}
                </div>

                {/* Technician Rows */}
                {/* {technicians.map(tech => { */}
                {technicians
                .filter(tech => {
                  const isOccupied = getTechnicianTasks(tech.id).length > 0;
                  return filterStatus === 'occupied' ? isOccupied : !isOccupied;
                })
                .map(tech => {
                  const techTasks = getTechnicianTasks(tech.id);

                  return (
                    <div key={tech.id} className="flex border-b relative" style={{ position: 'relative' }}>
                      {/* Technician Info */}
                      <div className="w-48 px-4 py-3 border-r z-10 relative bg-white">
                        <div className="flex items-center gap-2">
                          <div className={`h-3 w-3 rounded-full ${techTasks.length > 0 ? 'bg-red-500' : 'bg-green-500'}`}></div>
                          <div>
                            <p className="font-medium">{tech.name}</p>
                            <p className="text-xs text-gray-500">{tech.technician_id}</p>
                          </div>
                        </div>
                      </div>

                      {/* Time Slots Container */}
                      <div className="flex flex-grow relative h-fit">
                        {/* Render all empty slots */}
                        {timeSlots.map(slot => (
                          <div key={slot.label} className="w-24 border-r h-12 ml-5"></div>
                        ))}

                        {/* Render task candles */}
                        {techTasks.map(task => {
                          console.log('Task:', task);
                          const taskStart = task.date;
                          console.log('Task:', task.task_id);
                          console.log('Task Start:', taskStart);
                          console.log('task.durationHours:', task.durationHours);
                          const taskEnd = new Date(taskStart.getTime() + task.durationHours * 60 * 60 * 1000);
                          console.log('Task End:', taskEnd);
                          // Calculate start index (slot index)
                          const startSlotIndex = timeSlots.findIndex(slot =>
                            taskStart >= slot.start && taskStart < slot.end
                          );

                          if (startSlotIndex === -1) return null; // task outside slots

                          // Calculate duration in slots (rounded)
                          const durationMs = taskEnd - taskStart;
                          const slotDurationMs = 60 * 60 * 1000; // 1 hour
                          const spanSlots = Math.ceil(durationMs / slotDurationMs);

                          // Calculate left offset and width in pixels
                          const slotWidth = 96; // 24 * 4 px approx (w-24 = 6rem = 96px)
                          const left = startSlotIndex * slotWidth;
                          const width = spanSlots * slotWidth;

                          const taskColor = taskTypeColors[task.taskType?.toLowerCase()] || taskTypeColors.default;

                          return (
                            <div
                              key={task.id}
                              className={`absolute top-0 bottom-0 ${taskColor} rounded text-white p-1 overflow-hidden cursor-pointer gap-10`}
                              style={{
                                left,
                                width,
                                zIndex: 20,
                              }}
                                // onClick={() => setSelectedTask(task)}
                                onClick={() => {
                                  const assignedTechId = task.assignedTechnicianIds?.[0]; 
                                  const assignedTech = technicians.find(tech => tech.id === assignedTechId);

                                  setSelectedTask({
                                    ...task,
                                    technicianProfileUrl: assignedTech?.profilePicture?.presignedUrl || null,
                                  });
                                }}

                              title={`${task.taskType} - ${task.client_name || ''}\n${task.date.toLocaleTimeString()}`}
                            >
                              <p className="text-xs font-medium truncate">{task.taskType}</p>
                              <p className="text-[10px]">{task.client_name}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
      <TaskDetailsModal task={selectedTask} onClose={() => setSelectedTask(null)} />
    </DefaultLayout>
  );
};

export default TechnicianGanttChart;