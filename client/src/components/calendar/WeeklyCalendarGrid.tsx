import { generateTimeSlots, getEventDurationInSlots, isEventInTimeSlot } from '../../utils/timeSlots';
import { formatDateShort } from '../../utils/dateUtils';
import { CalendarEvent, CalendarDay } from '../../types/calendar';
import { cn } from '@/lib/utils';

interface WeeklyCalendarGridProps {
  week: CalendarDay[];
  events: CalendarEvent[];
  onDayClick: (date: Date) => void;
  onTimeSlotClick: (date: Date, time: string) => void;
  onEventClick: (event: CalendarEvent) => void;
  onEventMove?: (eventId: string, newStartTime: Date, newEndTime: Date) => void;
}

export const WeeklyCalendarGrid = ({
  week,
  events,
  onDayClick,
  onTimeSlotClick,
  onEventClick,
  onEventMove
}: WeeklyCalendarGridProps) => {
  const timeSlots = generateTimeSlots();
  
  const handleDragStart = (e: React.DragEvent, event: CalendarEvent) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({
      eventId: event.id,
      originalStartTime: event.startTime.toISOString(),
      originalEndTime: event.endTime.toISOString(),
      duration: event.endTime.getTime() - event.startTime.getTime()
    }));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, date: Date, timeSlot: { hour: number; minute: number }) => {
    e.preventDefault();
    if (!onEventMove) return;

    try {
      const dragData = JSON.parse(e.dataTransfer.getData('text/plain'));
      const newStartTime = new Date(date);
      newStartTime.setHours(timeSlot.hour, timeSlot.minute, 0, 0);
      
      const newEndTime = new Date(newStartTime.getTime() + dragData.duration);
      
      onEventMove(dragData.eventId, newStartTime, newEndTime);
    } catch (error) {
      console.error('Error handling drop:', error);
    }
  };

  const getAllDayEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.startTime);
      
      // Check if backend marked it as all-day
      const isMarkedAllDay = (event as any).isAllDay;
      
      // Check if event is all-day by looking at duration and time patterns
      const duration = event.endTime.getTime() - event.startTime.getTime();
      const hours = duration / (1000 * 60 * 60);
      const startHour = event.startTime.getHours();
      const startMinute = event.startTime.getMinutes();
      const isFullDay = startHour === 0 && startMinute === 0 && (hours === 24 || hours % 24 === 0);
      const isAllDayEvent = isMarkedAllDay || isFullDay || hours >= 20;
      
      if (!isAllDayEvent) return false;
      
      // For all-day events, check if the date falls within the event range
      const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const eventStartOnly = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
      const eventEndDate = new Date(event.endTime);
      const eventEndOnly = new Date(eventEndDate.getFullYear(), eventEndDate.getMonth(), eventEndDate.getDate());
      
      return dateOnly >= eventStartOnly && dateOnly < eventEndOnly;
    });
  };

  const getEventsForTimeSlot = (date: Date, timeSlot: { time: string; hour: number; minute: number }) => {
    return events.filter(event => {
      const eventDate = new Date(event.startTime);
      
      // Filter out all-day events from time slots
      const isMarkedAllDay = (event as any).isAllDay;
      const duration = event.endTime.getTime() - event.startTime.getTime();
      const hours = duration / (1000 * 60 * 60);
      const startHour = event.startTime.getHours();
      const startMinute = event.startTime.getMinutes();
      const isFullDay = startHour === 0 && startMinute === 0 && (hours === 24 || hours % 24 === 0);
      const isAllDayEvent = isMarkedAllDay || isFullDay || hours >= 20;
      
      // Skip all-day events
      if (isAllDayEvent) return false;
      
      // For timed events, use simple date string comparison
      if (eventDate.toDateString() !== date.toDateString()) return false;
      
      return isEventInTimeSlot(event, timeSlot);
    });
  };

  const getEventStyle = (event: CalendarEvent) => {
    const duration = getEventDurationInSlots(event);
    const height = duration * 40; // 40px per slot
    
    return {
      height: `${height}px`,
      marginBottom: duration > 1 ? '0px' : '2px',
      zIndex: 20 // Ensure events appear above other elements
    };
  }

  const getEventSourceClass = (event: CalendarEvent) => {
    // Check if it's a SimplePractice appointment
    const isSimplePractice = event.source === 'simplepractice' || 
                           event.notes?.toLowerCase().includes('simple practice') ||
                           event.title?.toLowerCase().includes('simple practice') ||
                           event.description?.toLowerCase().includes('simple practice') ||
                           event.title?.toLowerCase().includes('appointment'); // SimplePractice appointments sync as "X Appointment"
    
    if (isSimplePractice) {
      return 'event-block simplepractice';
    } else if (event.source === 'google') {
      return 'event-block google';
    } else {
      return 'event-block manual';
    }
  };

  return (
    <div className="grid grid-cols-8 border border-gray-300 rounded-lg overflow-hidden">
      {/* Headers */}
      <div className="time-header p-3 text-sm font-semibold text-center border-r border-gray-300">
        Time
      </div>
      {week.map((day, index) => (
        <div
          key={index}
          className="day-header p-3 text-sm font-semibold text-center border-r border-gray-300 last:border-r-0"
          onClick={() => onDayClick(day.date)}
        >
          {day.dayOfWeek} {formatDateShort(day.date)}
        </div>
      ))}

      {/* All-Day Events Section */}
      <div className="all-day-header p-2 text-sm font-medium text-gray-600 bg-red-100 border-r border-gray-300 border-b border-gray-300 text-center">
        All Day
      </div>
      {week.map((day, dayIndex) => {
        const allDayEvents = getAllDayEventsForDate(day.date);
        return (
          <div key={`allday-${dayIndex}`} className="all-day-slot p-2 bg-red-50 border-r border-gray-300 border-b border-gray-300 last:border-r-0 min-h-[60px]">
            {allDayEvents.map((event) => (
              <div
                key={event.id}
                className={cn(
                  "event-block cursor-pointer mb-1",
                  "event-block all-day"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  onEventClick(event);
                }}
              >
                <div className="text-xs font-medium text-gray-800 truncate">
                  {event.title}
                </div>
              </div>
            ))}
          </div>
        );
      })}

      {/* Time slots */}
      {timeSlots.map((timeSlot, slotIndex) => (
        <div key={slotIndex} className="contents">
          {/* Time column */}
          <div className="time-slot p-2 border-r border-gray-300 bg-gray-50">
            <div className={cn(
              "text-gray-600 font-medium",
              timeSlot.minute === 0 ? "text-xs" : "text-sm" // Top of hour (smaller), 30-minute (larger)
            )}>
              {timeSlot.time}
            </div>
          </div>
          
          {/* Day columns */}
          {week.map((day, dayIndex) => {
            const slotEvents = getEventsForTimeSlot(day.date, timeSlot);
            const isFirstSlotOfEvent = (event: CalendarEvent) => {
              const eventStart = new Date(event.startTime);
              const slotStart = new Date(day.date);
              slotStart.setHours(timeSlot.hour, timeSlot.minute, 0, 0);
              
              // Check if this is the exact start time slot for the event
              const eventStartMinutes = eventStart.getHours() * 60 + eventStart.getMinutes();
              const slotStartMinutes = timeSlot.hour * 60 + timeSlot.minute;
              
              // Return true only if this is the first slot that contains the event start time
              return eventStartMinutes >= slotStartMinutes && eventStartMinutes < slotStartMinutes + 30;
            };

            return (
              <div
                key={dayIndex}
                className="time-slot border-r border-gray-300 last:border-r-0 relative cursor-pointer hover:bg-gray-50"
                onClick={() => onTimeSlotClick(day.date, timeSlot.time)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, day.date, timeSlot)}
              >
                {slotEvents.map((event, eventIndex) => {
                  if (!isFirstSlotOfEvent(event)) return null;
                  
                  return (
                    <div
                      key={eventIndex}
                      className={cn(
                        "event-block absolute left-1 right-1 top-0 cursor-move",
                        getEventSourceClass(event)
                      )}
                      style={getEventStyle(event)}
                      draggable={event.source === 'google'}
                      onDragStart={(e) => handleDragStart(e, event)}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick(event);
                      }}
                    >
                      <div className="text-xs font-medium text-gray-800 leading-tight break-words">
                        {event.title}
                      </div>
                      <div className="text-xs text-gray-600 leading-tight">
                        {event.startTime.toLocaleTimeString('en-US', { 
                          hour: '2-digit', 
                          minute: '2-digit', 
                          hour12: false 
                        })} - {event.endTime.toLocaleTimeString('en-US', { 
                          hour: '2-digit', 
                          minute: '2-digit', 
                          hour12: false 
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};
