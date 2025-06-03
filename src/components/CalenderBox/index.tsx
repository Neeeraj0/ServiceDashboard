"use client"

import { useState, useMemo } from "react"
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import toast from "react-hot-toast"
import axios from "axios"
import { Checkbox } from "../ui/checkbox"
import AddServiceEventModal from "../Dialogs/AddServiceEvent"

// Define incoming data structure (from API)
type IncomingData = {
  _id: string
  nextServiceDate: string
  upcomingServiceDates?: string[] // Add upcoming service dates array
  client_name: string
  serviceType: string
  client_number?: string
  address?: string,
  model?: string
  quantity?: number | null
  acType?: string
  serialId?: string
  deviceId?: string
  [key: string]: any
}

// Define calendar event structure
type Event = {
  id: string
  title: string
  date: Date
  category: "work" | "personal" | "important" | "holiday"
  isUpcoming?: boolean // Flag to distinguish upcoming dates
}

// Define grouped event structure
type GroupedEvent = {
  title: string
  count: number
  category: "work" | "personal" | "important" | "holiday"
  ids: string[]
  hasUpcoming?: boolean // Flag to show if group contains upcoming dates
}

type CalendarProps = {
  data?: IncomingData[]
}

// Category color mapping
const categoryColors = {
  work: "bg-blue-100 text-blue-800 border-blue-200",
  personal: "bg-purple-100 text-purple-800 border-purple-200",
  important: "bg-red-100 text-red-800 border-red-200",
  holiday: "bg-green-100 text-green-800 border-green-200",
}

// Color mapping for upcoming service dates
const upcomingColors = {
  work: "bg-orange-100 text-orange-800 border-orange-200",
  personal: "bg-amber-100 text-amber-800 border-amber-200",
  important: "bg-yellow-100 text-yellow-800 border-yellow-200",
  holiday: "bg-lime-100 text-lime-800 border-lime-200",
}

// Initial form data
const initialFormData = {
  client_name: "",
  client_number: "",
  serviceType: "dry",
  nextServiceDate: "",
  model: "S15",
  acType: "Split",
  serialId: "",
  deviceId: "",
  address: "",
  quantity: null
}

export default function Calendar({ data = [] }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState<Omit<IncomingData, "_id">>(initialFormData)
  
  // Format date to YYYY-MM-DD for date input
  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0]
  }

  // const events: Event[] = useMemo(() => {
  //   const allEvents: Event[] = []
  //   console.log("Data received:", data);
  //   data.forEach((item) => {
  //     // Add the main nextServiceDate
  //     allEvents.push({
  //       id: item._id,
  //       title: item.client_name,
  //       date: new Date(item.nextServiceDate),
  //       category: "important",
  //       isUpcoming: false
  //     })
      
  //     // Add all upcoming service dates if available
  //     if (item.upcomingServiceDates && Array.isArray(item.upcomingServiceDates)) {
  //       item.upcomingServiceDates.forEach((upcomingDate, index) => {
  //         allEvents.push({
  //           id: `${item._id}_upcoming_${index}`,
  //           title: item.client_name,
  //           date: new Date(upcomingDate),
  //           category: "important",
  //           isUpcoming: true
  //         })
  //       })
  //     }
  //   })
    
  //   return allEvents
  // }, [data])

  const events: Event[] = useMemo(() => {
  console.log("=== CALENDAR EVENTS DEBUG ===");
  console.log("Calendar received data:", data);
  
  const allEvents: Event[] = []
  
  data.forEach((item, index) => {
    console.log(`\n--- Processing Item ${index}: ${item.client_name} ---`);
    console.log("nextServiceDate:", item.nextServiceDate);
    console.log("upcomingServiceDates:", item.upcomingServiceDates);
    
    // Validate nextServiceDate
    if (!item.nextServiceDate) {
      console.warn(`⚠️  No nextServiceDate for ${item.client_name}`);
      return;
    }
    
    const nextServiceDateObj = new Date(item.nextServiceDate);
    console.log("Parsed nextServiceDate:", nextServiceDateObj);
    console.log("Is valid date:", !isNaN(nextServiceDateObj.getTime()));
    
    // Add the main nextServiceDate
    allEvents.push({
      id: item._id,
      title: item.client_name,
      date: nextServiceDateObj,
      category: "important",
      isUpcoming: false
    })
    console.log(`✅ Added main service date for ${item.client_name}`);
    
    // Add all upcoming service dates if available
    if (item.upcomingServiceDates && Array.isArray(item.upcomingServiceDates)) {
      console.log(`Processing ${item.upcomingServiceDates.length} upcoming dates:`);
      
      item.upcomingServiceDates.forEach((upcomingDate, upcomingIndex) => {
        console.log(`  ${upcomingIndex + 1}. ${upcomingDate}`);
        
        const upcomingDateObj = new Date(upcomingDate);
        console.log(`     Parsed: ${upcomingDateObj}`);
        console.log(`     Valid: ${!isNaN(upcomingDateObj.getTime())}`);
        
        if (!isNaN(upcomingDateObj.getTime())) {
          allEvents.push({
            id: `${item._id}_upcoming_${upcomingIndex}`,
            title: item.client_name,
            date: upcomingDateObj,
            category: "important",
            isUpcoming: true
          });
          console.log(`     ✅ Added upcoming date`);
        } else {
          console.log(`     ❌ Invalid date, skipped`);
        }
      });
    } else {
      console.log(`No upcoming service dates for ${item.client_name}`);
      console.log("upcomingServiceDates value:", item.upcomingServiceDates);
      console.log("Is array:", Array.isArray(item.upcomingServiceDates));
    }
  });
  
  console.log("\n=== FINAL EVENTS SUMMARY ===");
  console.log("Total events created:", allEvents.length);
  
  // Group events by month for easier debugging
  const eventsByMonth = allEvents.reduce((acc, event) => {
    const monthKey = `${event.date.getFullYear()}-${event.date.getMonth() + 1}`;
    if (!acc[monthKey]) acc[monthKey] = [];
    acc[monthKey].push(event);
    return acc;
  }, {} as Record<string, Event[]>);
  
  Object.entries(eventsByMonth).forEach(([month, events]) => {
    console.log(`${month}: ${events.length} events`);
    events.forEach(event => {
      console.log(`  - ${event.title} on ${event.date.toDateString()} (${event.isUpcoming ? 'upcoming' : 'main'})`);
    });
  });
  
  return allEvents;
}, [data]);

  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay()
  const monthName = new Date(currentYear, currentMonth).toLocaleString("default", { month: "long" })
  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  const prevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1))
  }

  // const getEventsForDate = (date: Date) => {
  //   const dateEvents = events.filter(
  //     (event) =>
  //       event.date.getDate() === date.getDate() &&
  //       event.date.getMonth() === date.getMonth() &&
  //       event.date.getFullYear() === date.getFullYear()
  //   )

  //   // Group events by title and count them
  //   const groupedEvents: GroupedEvent[] = []
  //   const eventGroups = new Map<string, Event[]>()

  //   // Group events by title
  //   dateEvents.forEach(event => {
  //     if (!eventGroups.has(event.title)) {
  //       eventGroups.set(event.title, [])
  //     }
  //     eventGroups.get(event.title)!.push(event)
  //   })

  //   // Convert to grouped events with counts
  //   eventGroups.forEach((events, title) => {
  //     const hasUpcoming = events.some(e => e.isUpcoming)
  //     const nextServiceCount = events.filter(e => !e.isUpcoming).length
  //     const upcomingCount = events.filter(e => e.isUpcoming).length
      
  //     groupedEvents.push({
  //       title,
  //       count: events.length,
  //       category: events[0].category,
  //       ids: events.map(e => e.id),
  //       hasUpcoming
  //     })
  //   })

  //   return groupedEvents
  // }

  const getEventsForDate = (date: Date) => {
  const dateString = date.toDateString();
  console.log(`\n=== Getting events for ${dateString} ===`);
  
  const dateEvents = events.filter(
    (event) => {
      const matches = event.date.getDate() === date.getDate() &&
        event.date.getMonth() === date.getMonth() &&
        event.date.getFullYear() === date.getFullYear();
      
      if (matches) {
        console.log(`  ✅ Found event: ${event.title} (${event.isUpcoming ? 'upcoming' : 'main'})`);
      }
      
      return matches;
    }
  );

  console.log(`Total events found for ${dateString}:`, dateEvents.length);

  // Group events by title and count them
  const groupedEvents: GroupedEvent[] = []
  const eventGroups = new Map<string, Event[]>()

  // Group events by title
  dateEvents.forEach(event => {
    if (!eventGroups.has(event.title)) {
      eventGroups.set(event.title, [])
    }
    eventGroups.get(event.title)!.push(event)
  })

  // Convert to grouped events with counts
  eventGroups.forEach((events, title) => {
    const hasUpcoming = events.some(e => e.isUpcoming)
    
    groupedEvents.push({
      title,
      count: events.length,
      category: events[0].category,
      ids: events.map(e => e.id),
      hasUpcoming
    })
    
    console.log(`  Grouped: ${title} - ${events.length} event(s), hasUpcoming: ${hasUpcoming}`);
  })

  return groupedEvents;
}

  const isToday = (date: Date) => {
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  const isFuture = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    date.setHours(0, 0, 0, 0)
    return date > today
  }

  const isSelected = (date: Date) => {
    if (!selectedDate) return false
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    )
  }

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.')
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent as keyof typeof formData] as any,
          [child]: value
        }
      })
    } else {
      setFormData({
        ...formData,
        [name]: value
      })
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value
    })
  }

  const handleAddEvent = () => {
    // Open modal with selected date (if any) or today's date
    if (selectedDate) {
      setFormData({
        ...initialFormData,
        nextServiceDate: formatDateForInput(selectedDate)
      })
    } else {
      setFormData({
        ...initialFormData,
        nextServiceDate: formatDateForInput(new Date())
      })
    }
    setIsDialogOpen(true)
  }

  const handleSubmit = async () => {
    // Validation
    if(!formData.acType || !formData.client_name || !formData.client_number || 
       !formData.serviceType || !formData.nextServiceDate || 
       !formData.serialId || !formData.deviceId) {
      toast.error(
        "Please enter all required details",
      );
      console.log("form data",formData);    
      return;
    }

    try {
      const now = new Date().toISOString();
      const eventData = {
        ...formData,
        model: determineModel(formData.acType, formData.tonnage),
        lastProcessed: now
      };

      const response = await axios.post('http://localhost:8080/api/routine/createPmServiceEvent', eventData);
      
      if (response.status === 201) {
        toast.success(
          "Event added successfully",
        );
        
        setIsDialogOpen(false);
        setFormData(initialFormData);
      }
    } catch (error) {
      console.error("Error saving event:", error);
      toast.error(
       "Failed to save event. Please try again.",
      );
    }
  }

  const determineModel = (acType: string, tonnage: string) => {
    if (acType === "Split") {
      switch(tonnage) {
        case "1": return "S10";
        case "1.5": return "S15";
        case "2": return "S20";
        default: return "S15";
      }
    } else if (acType === "Cassette") {
      switch(tonnage) {
        case "2": return "C20";
        case "3": return "C30";
        default: return "C20";
      }
    }
    
    // Default fallback
    return acType === "Split" ? "S15" : "C20";
  }

  const calendarDays = []

  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(<div key={`empty-${i}`} className="h-24 border border-gray-200 p-1"></div>)
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentYear, currentMonth, day)
    const groupedEvents = getEventsForDate(date)

    calendarDays.push(
      <div
        key={day}
        className={cn(
          "h-24 border border-gray-200 p-1 transition-colors cursor-pointer",
          isToday(date) ? "bg-blue-50" : "",
          isFuture(date) ? "bg-gray-50" : "",
          isSelected(date) ? "ring-2 ring-primary ring-inset" : ""
        )}
        onClick={() => setSelectedDate(date)}
      >
        <div className="flex justify-between">
          <span
            className={cn(
              "inline-flex h-6 w-6 items-center justify-center rounded-full text-sm",
              isToday(date) ? "bg-primary text-primary-foreground" : ""
            )}
          >
            {day}
          </span>
        </div>
        <div className="mt-1 space-y-1 overflow-y-auto max-h-16">
          {groupedEvents.map((groupedEvent, index) => {
            // Use different colors for events that have upcoming service dates
            const colorClass = groupedEvent.hasUpcoming 
              ? upcomingColors[groupedEvent.category]
              : categoryColors[groupedEvent.category]
            
            return (
              <div
                key={`${groupedEvent.title}-${index}`}
                className={cn(
                  "text-xs px-1 py-0.5 rounded border flex justify-between items-center",
                  colorClass
                )}
                title={`${groupedEvent.title} (${groupedEvent.count} event${groupedEvent.count > 1 ? 's' : ''}${groupedEvent.hasUpcoming ? ' - includes upcoming dates' : ''})`}
              >
                <span className="truncate flex-1 mr-1">
                  {groupedEvent.title}
                  {groupedEvent.hasUpcoming && <span className="ml-1 text-xs">📅</span>}
                </span>
                {groupedEvent.count > 1 && (
                  <span className="bg-white bg-opacity-80 text-xs px-1 rounded-full font-medium min-w-4 h-4 flex items-center justify-center">
                    {groupedEvent.count}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg bg-card text-card-foreground shadow-sm">
      <div className="p-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {monthName} {currentYear}
        </h2>
        <div className="flex space-x-2">
          <Button variant="outline" size="icon" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button onClick={handleAddEvent} className="ml-4">
            <Plus className="h-4 w-4 mr-2" /> Add Event
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-px border-t">
        {daysOfWeek.map((day) => (
          <div key={day} className="p-2 text-center text-sm font-medium">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px">{calendarDays}</div>
      <div className="p-4 border-t">
        <div className="flex flex-wrap gap-2">
          <div className="text-sm font-medium">Event Categories:</div>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800 border border-red-200">
              Next Service Date
            </span>
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800 border border-yellow-200">
              Upcoming Service Dates 📅
            </span>
          </div>
        </div>
      </div>

      <AddServiceEventModal
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        defaultDate={formatDateForInput(selectedDate || new Date())}
      />
    </div>
  )
}