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
}

export const WeeklyCalendarGrid = ({
  week,
  events,
  onDayClick,
  onTimeSlotClick,
  onEventClick
}: WeeklyCalendarGridProps) => {
  const timeSlots = generateTimeSlots();

  const getEventsForTimeSlot = (date: Date, timeSlot: { time: string; hour: number; minute: number }) => {
    return events.filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate.toDateString() === date.toDateString() && 
             isEventInTimeSlot(event, timeSlot);
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

      {/* Time slots */}
      {timeSlots.map((timeSlot, slotIndex) => (
        <div key={slotIndex} className="contents">
          {/* Time column */}
          <div className="time-slot p-2 text-sm font-medium text-gray-600 border-r border-gray-300 bg-gray-50">
            {timeSlot.time}
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
              >
                {slotEvents.map((event, eventIndex) => {
                  if (!isFirstSlotOfEvent(event)) return null;
                  
                  return (
                    <div
                      key={eventIndex}
                      className={cn(
                        "event-block absolute left-1 right-1 top-0",
                        `event-block ${event.source}`
                      )}
                      style={getEventStyle(event)}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick(event);
                      }}
                    >
                      <div className="text-xs font-medium text-gray-800 truncate">
                        {event.title}
                      </div>
                      <div className="text-xs text-gray-600 truncate">
                        {event.startTime.toLocaleTimeString('en-US', { 
                          hour: 'numeric', 
                          minute: '2-digit', 
                          hour12: true 
                        })} - {event.endTime.toLocaleTimeString('en-US', { 
                          hour: 'numeric', 
                          minute: '2-digit', 
                          hour12: true 
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
