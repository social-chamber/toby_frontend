"use client"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { useBookingStore } from "@/store/booking/index"
import { useQuery } from "@tanstack/react-query"
import { isBefore, startOfDay } from "date-fns"
import moment from "moment"

interface TimeSlot {
  start: string
  end: string
  available: boolean
}

interface TimeSlotsApiRes {
  status: boolean
  message: string
  data: TimeSlot[]
}

export default function TimeSelection() {
  const { service, setStep, selectedCategoryName } = useBookingStore()
  const { selectedDate, selectDate, selectTimeSlot, selectedTimeSlot, room } = useBookingStore()

  const serviceId = service?._id
  const roomId = room?._id;

  // Keep using moment for API request format as before
  const dateOnly = selectedDate ? moment(selectedDate).format("YYYY-MM-DD") : ""

  // Fetch available time slots for the selected date
  const { data, isLoading: loadingTimeSlots } = useQuery<TimeSlotsApiRes>({
    queryKey: ["timeSlots", service, selectedDate?.toISOString(), roomId],
    queryFn: () =>
      fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/booking/check-availability`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          date: dateOnly,
          serviceId: serviceId,
          roomId: roomId,
        }),
      }).then((res) => res.json()),
    enabled: !!serviceId && !!dateOnly,
  })

  console.log("data", data);

  // Function to format time in 12-hour format
  const formatTime = (timeString: string): string => {
    if (!timeString) return ""

    // Parse the time string (assuming format like "09:00" or "14:30")
    const [hoursStr, minutesStr] = timeString.split(":")
    const hours = Number.parseInt(hoursStr, 10)
    const minutes = Number.parseInt(minutesStr, 10)

    if (isNaN(hours) || isNaN(minutes)) return timeString

    // Convert to 12-hour format
    const period = hours >= 12 ? "PM" : "AM"
    const hours12 = hours % 12 || 12 // Convert 0 to 12 for 12 AM and 12 to 12 for 12 PM

    return `${hours12}:${minutes.toString().padStart(2, "0")} ${period}`
  }

  // Format time for compact header, e.g., 00:00 -> 12am, 09:00 -> 9am
  const formatCompactTime = (timeString: string): string => {
    if (!timeString) return ""
    const [hoursStr, minutesStr] = timeString.split(":")
    let hours = Number.parseInt(hoursStr, 10)
    const minutes = Number.parseInt(minutesStr, 10)
    const period = hours >= 12 ? "pm" : "am"
    hours = hours % 12 || 12
    return `${hours}${minutes === 0 ? "" : ":" + minutes.toString().padStart(2, "0")}${period}`
  }

  // Build booking title like: Sat/Sun(12am-9am) Midnight Package or Mon-Fri (12am-9am) Non-Peak
  const buildBookingTitle = (): string => {
    if (!service) return "Available Times"
    const days = service.availableDays || []
    const isWeekendOnly = days.length === 2 && days.includes("Sat" as any) && days.includes("Sun" as any)
    const isWeekdayOnly = days.length === 5 && ["Mon","Tue","Wed","Thu","Fri"].every(d => days.includes(d as any))
    const dayLabel = isWeekendOnly ? "Sat/Sun" : (isWeekdayOnly ? "Mon-Fri" : "")
    const startLabel = formatCompactTime(service.timeRange?.start || "")
    const endLabel = formatCompactTime(service.timeRange?.end || "")
    const timeLabel = startLabel && endLabel ? `(${startLabel}-${endLabel})` : ""
    const name = (service.name || "").trim()

    // Build a prefix from derived day/time, but avoid duplicating if the name already includes it
    const prefix = [dayLabel, timeLabel].filter(Boolean).join(" ").trim()

    if (!name && !prefix) return "Available Times"
    if (!prefix) return name || "Available Times"

    const normalized = (s: string) => s.replace(/\s+/g, " ").toLowerCase().trim()
    if (normalized(name).includes(normalized(prefix))) {
      return name
    }

    return [prefix, name].filter(Boolean).join(" ").trim() || "Available Times"
  }



  // Redirect if no service is selected
  if (!serviceId) {
    return (
      <div className="text-center py-8">
        <p className="text-lg font-medium">Please select a service first</p>
        <Button onClick={() => setStep("services")} className="mt-4 bg-orange-500 hover:bg-orange-600">
          Go to Service Selection
        </Button>
      </div>
    )
  }

  // Function to disable past dates
  const isPastDate = (date: Date) => {
    return isBefore(date, startOfDay(new Date()))
  }

  // Disable days not in service.availableDays (e.g., only enable Sat/Sun)
  const isUnavailableDay = (date: Date) => {
    if (!service?.availableDays) return false
    const dayShort = date.toLocaleDateString("en-SG", { weekday: "short" })
    return !service.availableDays.includes(dayShort as any)
  }

  // Ensure we have complete 24-hour slots
  const timeSlots = data?.data ?? undefined

  // Restrict selectable slots for specific Hourly override: Sat/Sun (12am-12am) Peak -> allow 12:00 AM to 9:00 AM only
  let isWeekendPeakAllDay = false
  if (selectedCategoryName === "Hourly" && service) {
    const name = (service.name || "").toLowerCase()
    isWeekendPeakAllDay = name.includes("sat/sun (12am-12am) peak")
    if (isWeekendPeakAllDay && Array.isArray(timeSlots)) {
      // We will render a single block instead; keep fetch but ignore hourly listing
    }
  }

  // For Packages: render a single selection block representing the full span
  const isPackage = selectedCategoryName === "Packages"
  let packageBlock: { start: string; end: string } | null = null
  let isPackageAvailable = true
  
  if (isPackage && service?.timeRange?.start && service?.timeRange?.end) {
    packageBlock = { start: service.timeRange.start, end: service.timeRange.end }
    
    // Check if the package time slot is available by looking at the API response
    if (timeSlots && Array.isArray(timeSlots)) {
      // For packages, check if any slot within the package time range is unavailable
      const packageStart = service.timeRange.start
      const packageEnd = service.timeRange.end
      
      // Find slots that are within the package time range
      const packageSlots = timeSlots.filter(slot => {
        // Check if slot is within package time range
        return slot.start >= packageStart && slot.end <= packageEnd
      })
      
      // Package is available if all package slots are available
      isPackageAvailable = packageSlots.length > 0 && packageSlots.every(slot => slot.available)
      
      // Debug logging
      console.log('Package availability check:', {
        packageStart,
        packageEnd,
        packageSlots: packageSlots.length,
        isPackageAvailable,
        slots: packageSlots.map(slot => ({ start: slot.start, end: slot.end, available: slot.available }))
      })
    }
  }

  // For the specific Hourly weekend peak all-day: render a single block 12:00 AM - 9:00 AM
  const weekendPeakSingleBlock = isWeekendPeakAllDay ? { start: "00:00", end: "09:00" } : null
  const isDisabled = !selectedTimeSlot ? true : selectedTimeSlot.length === 0 || (isPackage && !isPackageAvailable)

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="border rounded-lg p-4 max-h-96">
        <h2 className="font-medium text-orange-500 mb-4">Select Date</h2>

        <Calendar
          mode="single"
          selected={selectedDate || undefined}
          onSelect={(date) => selectDate(date || null)}
          className="rounded-md w-full"
          disabled={(date) => isPastDate(date) || isUnavailableDay(date)}
          defaultMonth={new Date()} // Start with current month
        />
      </div>

      <div className="border rounded-lg p-4">
        <h2 className="font-medium text-orange-500 mb-4">{buildBookingTitle()}</h2>

        {!selectedDate ? (
          <p className="text-center py-8 text-gray-500">Please select a date to view available times</p>
        ) : loadingTimeSlots ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 bg-gray-100 animate-pulse rounded"></div>
            ))}
          </div>
        ) : isWeekendPeakAllDay && weekendPeakSingleBlock ? (
          <div className="space-y-2">
            <button
              onClick={() => {
                selectTimeSlot({ start: weekendPeakSingleBlock.start, end: weekendPeakSingleBlock.end })
              }}
              className={cn(
                "w-full py-3 px-4 border border-yellow-400 rounded text-center transition-colors hover:bg-yellow-50",
                selectedTimeSlot?.some((s) => s.start === weekendPeakSingleBlock.start && s.end === weekendPeakSingleBlock.end) &&
                  "bg-orange-500 text-white border-orange-500"
              )}
            >
              {formatTime(weekendPeakSingleBlock.start)} - {formatTime(weekendPeakSingleBlock.end)}
            </button>
          </div>
        ) : isPackage && packageBlock ? (
          <div className="space-y-2">
            {!isPackageAvailable && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-red-700 font-medium">This package is already booked for this date</span>
                </div>
                <p className="text-red-600 text-sm mt-1">Please select a different date or package</p>
              </div>
            )}
            <button
              onClick={() => {
                if (isPackageAvailable) {
                  selectTimeSlot({ start: packageBlock!.start, end: packageBlock!.end })
                }
              }}
              disabled={!isPackageAvailable}
              className={cn(
                "w-full py-3 px-4 border rounded text-center transition-colors",
                isPackageAvailable 
                  ? "border-yellow-400 hover:bg-yellow-50" 
                  : "border-red-300 bg-red-50 cursor-not-allowed",
                selectedTimeSlot?.some((s) => s.start === packageBlock!.start && s.end === packageBlock!.end) &&
                  "bg-orange-500 text-white border-orange-500"
              )}
            >
              {formatTime(packageBlock.start)} - {formatTime(packageBlock.end)}
              {!isPackageAvailable && (
                <span className="block text-sm text-red-600 mt-1">❌ Already Booked</span>
              )}
            </button>
          </div>
        ) : timeSlots && timeSlots.length > 0 ? (
          <div className="space-y-2">
            {/* Show booking status summary */}
            {(() => {
              const availableSlots = timeSlots.filter(slot => slot.available).length;
              const totalSlots = timeSlots.length;
              const bookedSlots = totalSlots - availableSlots;
              
              if (bookedSlots > 0) {
                return (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-blue-700 font-medium">Booking Status</span>
                      <span className="text-blue-600 text-sm">{availableSlots}/{totalSlots} slots available</span>
                    </div>
                    {bookedSlots > 0 && (
                      <p className="text-blue-600 text-sm mt-1">
                        {bookedSlots} slot{bookedSlots > 1 ? 's' : ''} already booked
                      </p>
                    )}
                  </div>
                );
              }
              return null;
            })()}
            
            {timeSlots.map((slot: TimeSlot, i) => (
              <button
                key={i}
                onClick={() => {
                  if (slot.available) {
                    selectTimeSlot({
                      start: slot.start,
                      end: slot.end,
                    })
                  }
                }}
                disabled={!slot.available}
                className={cn(
                  "w-full py-3 px-4 border rounded text-center transition-colors",
                  slot.available 
                    ? "border-yellow-400 hover:bg-yellow-50" 
                    : "border-red-300 bg-red-50 cursor-not-allowed",
                  selectedTimeSlot?.some((s) => s.start === slot.start && s.end === slot.end) &&
                    "bg-orange-500 text-white border-orange-500"
                )}
              >
                <div className="flex items-center justify-between">
                  <span>{formatTime(slot.start)} - {formatTime(slot.end)}</span>
                  {!slot.available && (
                    <span className="text-red-600 text-sm">❌ Booked</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-red-700 font-medium">No Available Slots</span>
              </div>
              <p className="text-red-600 text-sm">All time slots for this date are already booked.</p>
              <p className="text-red-500 text-xs mt-2">Please select a different date.</p>
            </div>
          </div>
        )}

        {/* <div className="mt-4 text-sm text-gray-600">Total slots: {timeSlots.length}/24</div> */}

        <Button
          className={cn(
            "mt-4 w-full",
            isDisabled 
              ? "bg-gray-400 cursor-not-allowed" 
              : "bg-orange-500 hover:bg-orange-500/80"
          )}
          onClick={() => setStep("confirm")}
          disabled={!!isDisabled}
        >
          {isDisabled ? "No Slots Selected" : "Continue"}
        </Button>
      </div>
    </div>
  )
}
