import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CalendarBox from '../CalenderBox';
import RoutineAssignTask from '../Dialogs/RoutineAssignTask';
import Calendar from '../CalenderBox';
import Pagination from '../Pagination';
import SearchBox from '../SearchBox/SearchBox';
import Loader from '../common/Loader';

// Define TypeScript interfaces
interface ServiceItem {
  _id: string;
  nextServiceDate: string;
  client_name: string;
  client_number?: string;
  deviceId: string;
  serviceType: string;
}

interface GroupedData {
  [date: string]: ServiceItem[];
}

const Upcoming: React.FC = () => {
  const [filter, setFilter] = useState<"7-days" | "month" | "1-days" | "3-days" | "14-days">("1-days"); 
  const [data, setData] = useState<ServiceItem[]>([]); 
  const [loading, setLoading] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage: number = 10; // Number of items per page
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch data based on selected filter
  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      setLoading(true);
      const url = `http://35.154.208.29:8080/api/routine/orders/service-due/${filter}`;
      // const url = `http://localhost:8000/api/routine/orders/service-due/${filter}`;
      try {
        const response = await axios.get<ServiceItem[]>(url);
        setData(response.data); 
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchData();
  }, [filter]); // Add filter to the dependency array
  

  // Function to group data by nextServiceDate
  const groupDataByDate = (data: ServiceItem[]): GroupedData => {
    const groupedData = data.reduce<GroupedData>((acc, item) => {
      const date = new Date(item.nextServiceDate).toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
      if (!acc[date]) acc[date] = [];
      acc[date].push(item);
      return acc;
    }, {});
    return groupedData;
  };

  const filteredData = data.filter((item) =>
    item.client_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedData: GroupedData = groupDataByDate(filteredData);
  const dateKeys: string[] = Object.keys(groupedData);
  
  // Get paginated data for 7-days view
  const indexOfLastDate: number = currentPage * itemsPerPage;
  const indexOfFirstDate: number = indexOfLastDate - itemsPerPage;
  const currentDateKeys: string[] = dateKeys.slice(indexOfFirstDate, indexOfLastDate);

  // Handle page change
  const paginate = (pageNumber: number): void => setCurrentPage(pageNumber);

  // Handle filter change
  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    setFilter(e.target.value as "7-days" | "month");
    setCurrentPage(1); // Reset to first page when changing filter
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex-grow">
            <SearchBox
              placeholder="Search by customer name"
              value={searchQuery}
              onChange={setSearchQuery} 
            />
          </div>
        <h2 className="text-lg font-semibold"></h2>
        <select 
          value={filter} 
          onChange={handleFilterChange} 
          className="p-2 rounded border"
        >
          <option value="1-days">Today</option>
          <option value="7-days">Next 7 Days</option>
          <option value="3-days">Next 3 Days</option>
          <option value="14-days">Next 14 Days</option>
          {/* <option value="month">Month</option> */}
        </select>
      </div>

      {loading ? (
        <Loader />
      ) : (filter === "7-days" || filter === "1-days" || filter === "14-days" || filter === "3-days") ? (
        <div>
          {dateKeys.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <img src='https://img.freepik.com/free-vector/man-saying-no-concept-illustration_114360-13562.jpg?t=st=1744179037~exp=1744182637~hmac=f6bf8756262cbfa1b3e0dd9e50e7ca1ba03b597daae269619c15f6c63f42180b&w=826' className='items-center w-80 h-80 mx-auto justify-center'/>
            </div>
          ) : (
            <>
              {currentDateKeys.map((date) => (
                <div key={date} className="mb-6">
                  <h3 className="text-xl font-bold mb-4">{date}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
                    {groupedData[date].map((item, index) => (
                      <div key={`${item._id}-${index}`} className="border-[#C9C9C9] rounded-xl text-left p-3 shadow-md overflow-x-hidden gap-3 flex flex-col">
                        <p className='text-black font-medium'>Due Date: {new Date(item.nextServiceDate).toLocaleDateString()}</p>
                        <p className='text-black font-medium'>Customer Name: {item.client_name}</p>
                        <p className='text-black font-medium'>Contact No: {item.client_number ? item.client_number : "N/A"}</p>
                        <p className='text-black font-medium'>Devices: {item.deviceId}</p>
                        <p className='text-black font-medium'>Service Type: {item.serviceType}</p>
                        <div className='flex justify-end space-x-2'>
                          <button className="mt-2 bg-[none] text-blue-700 px-4 py-2 rounded">View Customer</button>
                          <RoutineAssignTask 
                            orderId={item._id}
                            clientName={item.client_name}
                            clientNumber={item.client_number || ""}
                            description=""
                            complaintRaised=""
                            customerComplaint=""
                            addressDisplay=""
                            deviceId={item.deviceId}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              
              {dateKeys.length > itemsPerPage && (
                <Pagination
                  currentPage={currentPage}
                  totalItems={dateKeys.length}
                  itemsPerPage={itemsPerPage}
                  paginate={paginate}
                />
              )}
            </>
          )}
        </div>
      ) : 
      (
        <div className="w-full max-w-full rounded-[10px] bg-white shadow-1 dark:bg-gray-dark dark:shadow-card">
          <Calendar data={data}/>
        </div>
      )
      }
    </div>
  );
};

export default Upcoming;