import React from 'react';

interface Event {
  _id: string;
  nextServiceDate: string;
  client_name: string;
  serviceType: string;
  // Add other relevant fields from your data, e.g., client_number, address, etc.
}

interface CalendarBoxProps {
  data: Event[];
}

const CalendarBox: React.FC<CalendarBoxProps> = ({ data }) => {
  console.log(data);
  const eventsByDate = data?.reduce((acc: Record<number, Event[]>, event: Event) => {
    const dateKey = new Date(event.nextServiceDate).getDate();
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(event);
    return acc;
  }, {});

  // Get the days in the current month to render the calendar
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, index) => index + 1);

  const bgColors = [
    'bg-green-700/40',  // First color
    'bg-blue-800/40',   // Second color
    'bg-purple-500/40', // Third color
  ];


  return (
    <div className="w-full max-w-full rounded-[10px] bg-white shadow-1 dark:bg-gray-dark dark:shadow-card">
      <table className="w-full">
        <thead>
          <tr className="grid grid-cols-7 rounded-t-[10px] bg-primary text-white">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, index) => (
              <th key={index} className="p-2 text-center">{day}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 5 }).map((_, weekIndex) => (
            <tr key={weekIndex} className="grid grid-cols-7">
              {daysArray.slice(weekIndex * 7, weekIndex * 7 + 7).map((day) => (
                <td key={day} className="relative p-2 border">
                  <span>{day}</span>
                  {eventsByDate[day]?.length > 0 && ( // Use optional chaining to safely access eventsByDate[day]
                    <div className="mt-2 space-y-1">
                      {eventsByDate[day]?.map((event, idx) => (
                        <div
                          key={idx}
                          className={`event ${bgColors[idx % bgColors.length]} rounded text-xs p-2`}
                        >
                          <p className="font-medium text-black">{event.client_name}</p>
                          <p className='text-red-500'>{event.serviceType}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CalendarBox;
