"use client"

import { useState, useMemo } from "react"
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// Define incoming data structure (from API)
type IncomingData = {
  _id: string
  nextServiceDate: string
  client_name: string
  serviceType: string
  [key: string]: any
}

// Define calendar event structure
type Event = {
  id: string
  title: string
  date: Date
  category: "work" | "personal" | "important" | "holiday"
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

export default function Calendar({ data = [] }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  console.log( "data", data)
  const events: Event[] = useMemo(() => {
    return data.map((item) => ({
      id: item._id,
      title: item.client_name,
      date: new Date(item.nextServiceDate),
      category: "important", // You can make this dynamic if needed
    }))
  }, [data])

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

  const getEventsForDate = (date: Date) => {
    return events.filter(
      (event) =>
        event.date.getDate() === date.getDate() &&
        event.date.getMonth() === date.getMonth() &&
        event.date.getFullYear() === date.getFullYear()
    )
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

  const calendarDays = []

  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(<div key={`empty-${i}`} className="h-24 border border-gray-200 p-1"></div>)
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentYear, currentMonth, day)
    const dateEvents = getEventsForDate(date)

    calendarDays.push(
      <div
        key={day}
        className={cn(
          "h-24 border border-gray-200 p-1 transition-colors",
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
          {dateEvents.map((event) => (
            <div
              key={event.id}
              className={cn(
                "text-xs px-1 py-0.5 rounded truncate border",
                categoryColors[event.category]
              )}
              title={event.title}
            >
              {event.title}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg bg-card text-card-foreground shadow-sm ">
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
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 border border-blue-200">
              important
            </span>
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800 border border-purple-200">
              very important
            </span>
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800 border border-red-200">
              very very important
            </span>
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 border border-green-200">
              Jaruri
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
