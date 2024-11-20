import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CalendarBox from '../CalenderBox';
import RoutineAssignTask from '../Dialogs/RoutineAssignTask';

const Upcoming = () => {
  const [filter, setFilter] = useState("7-days"); // State for the filter
  const [data, setData] = useState([]); // State for fetched data
  const [loading, setLoading] = useState(false);

  // Fetch data based on selected filter
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const url = filter === "7-days" 
        ? "http://35.154.208.29:8080/api/routine/orders/service-due/7-days" 
        : "http://35.154.208.29:8080/api/routine/orders/service-due/next-month";

      try {
        const response = await axios.get(url);
        setData(response.data); // Assuming the API response is structured as an array
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filter]); 

  // Function to group data by nextServiceDate
  const groupDataByDate = () => {
    const groupedData = data.reduce((acc: any, item: any) => {
      const date = new Date(item.nextServiceDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
      if (!acc[date]) acc[date] = [];
      acc[date].push(item);
      return acc;
    }, {});
    return groupedData;
  };

  const groupedData = groupDataByDate();

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Upcoming Routine Service</h2>
        <select 
          value={filter} 
          onChange={(e) => setFilter(e.target.value)} 
          className="p-2 rounded border"
        >
          <option value="7-days">7 Days</option>
          <option value="month">Month</option>
        </select>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : filter === "7-days" ? (
        <div>
          {Object.keys(groupedData).map((date) => (
            <div key={date} className="mb-6">
              <h3 className="text-xl font-bold mb-4">{date}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
                {groupedData[date].map((item: any, index: any) => (
                  <div key={index} className="border-[#C9C9C9] rounded-xl text-left p-3 shadow-md overflow-x-hidden gap-3 flex flex-col">
                    <p className='text-black font-medium'>Due Date: {new Date(item.nextServiceDate).toLocaleDateString()}</p>
                    <p className='text-black font-medium'>Customer Name: {item.client_name}</p>
                    <p className='text-black font-medium'>Contact No: {item.client_number ? item.client_number : "N/A"}</p>
                    <p className='text-black font-medium'>Devices: {item.deviceId}</p>
                    <p className='text-black font-medium'>Service Type: {item.serviceType}</p>
                    <div className='flex justify-end space-x-2'>
                        <button className="mt-2 bg-blue-500 text-white px-4 py-2 rounded">View Customer</button>
                        {/* <button className="mt-2 ml-2 bg-gray-300 px-4 py-2 rounded">+ Assign</button> */}
                        <RoutineAssignTask 
                                orderId = {item._id}
                                clientName = {item.client_name}
                                clientNumber = {item.client_number}
                                description = ""
                                complaintRaised = ""
                                customerComplaint=''
                                addressDisplay = ""
                                deviceId = {item.deviceId}
                            />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="w-full max-w-full rounded-[10px] bg-white shadow-1 dark:bg-gray-dark dark:shadow-card">
          <CalendarBox data={data}/>
        </div>
      )}
    </div>
  );
};

export default Upcoming;
