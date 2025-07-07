import React from 'react';
import { CalendarEvent } from '../../types/calendar';

interface WeeklyCalendarGridProps {
  week: Array<{ date: Date; dayOfWeek: string; dayNumber: number }>;
  events: CalendarEvent[];
  onTimeSlotClick: (date: Date, time: string) => void;
  onEventClick: (event: CalendarEvent) => void;
}

const timeSlots = [
  '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30',
  '22:00', '22:30', '23:00', '23:30'
];

export const WeeklyCalendarGrid: React.FC<WeeklyCalendarGridProps> = ({
  week,
  events,
  onTimeSlotClick,
  onEventClick
}) => {
  const getEventsForTimeSlot = (date: Date, timeSlot: string) => {
    const [hour, minute] = timeSlot.split(':').map(Number);
    
    return events.filter(event => {
      const eventDate = new Date(event.startTime);
      const eventDay = eventDate.toDateString();
      const slotDay = date.toDateString();
      
      if (eventDay !== slotDay) return false;
      
      const eventHour = eventDate.getHours();
      const eventMinute = eventDate.getMinutes();
      
      return eventHour === hour && eventMinute === minute;
    });
  };

  const getEventStyle = (event: CalendarEvent) => {
    const isSimplePractice = event.title.includes('Appointment') || event.source === 'simplepractice';
    const isHoliday = event.title.includes('Holiday');
    
    if (isSimplePractice) {
      return 'bg-blue-100 border-2 border-blue-500 text-blue-800';
    } else if (event.source === 'google') {
      return 'bg-green-100 border-2 border-dashed border-green-500 text-green-800';
    } else if (isHoliday) {
      return 'bg-yellow-100 border-2 border-yellow-500 text-yellow-800';
    } else {
      return 'bg-gray-100 border-2 border-gray-500 text-gray-800';
    }
  };

  return (
    <div className="calendar-grid">
      {/* Header row with days */}
      <div className="grid grid-cols-8 border-b-2 border-gray-300">
        <div className="p-2 font-bold text-center bg-gray-100">Time</div>
        {week.map((day, index) => (
          <div key={index} className="p-2 font-bold text-center bg-gray-100 border-l border-gray-300">
            <div className="text-sm">{day.dayOfWeek}</div>
            <div className="text-lg">{day.dayNumber}</div>
          </div>
        ))}
      </div>

      {/* Time slots */}
      {timeSlots.map((timeSlot, slotIndex) => (
        <div key={timeSlot} className="grid grid-cols-8 border-b border-gray-200 min-h-[40px]">
          {/* Time column */}
          <div className="p-2 text-sm font-medium bg-gray-50 border-r border-gray-300 flex items-center">
            {timeSlot}
          </div>
          
          {/* Day columns */}
          {week.map((day, dayIndex) => {
            const slotEvents = getEventsForTimeSlot(day.date, timeSlot);
            
            return (
              <div
                key={`${slotIndex}-${dayIndex}`}
                className="relative border-l border-gray-200 p-1 cursor-pointer hover:bg-gray-50"
                onClick={() => onTimeSlotClick(day.date, timeSlot)}
              >
                {slotEvents.map((event, eventIndex) => {
                  const cleanTitle = event.title.replace(' Appointment', '').toUpperCase();
                  
                  return (
                    <div
                      key={`${event.id}-${eventIndex}`}
                      className={`${getEventStyle(event)} p-1 rounded text-xs font-bold cursor-pointer mb-1`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick(event);
                      }}
                    >
                      <div className="truncate">{cleanTitle}</div>
                      <div className="text-[10px] opacity-75">{timeSlot}</div>
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