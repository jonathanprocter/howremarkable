import React from 'react';
import { generateTimeSlots } from '../../utils/timeSlots';
import { CalendarEvent, CalendarDay } from '../../types/calendar';
import { getWeekNumber } from '../../utils/dateUtils';

interface WeeklyPlannerViewProps {
  week: CalendarDay[];
  events: CalendarEvent[];
  onDayClick: (date: Date) => void;
  onTimeSlotClick: (date: Date, time: string) => void;
  onEventClick: (event: CalendarEvent) => void;
  onEventMove?: (eventId: string, newStartTime: Date, newEndTime: Date) => void;
}

export const WeeklyPlannerView = ({
  week,
  events,
  onDayClick,
  onTimeSlotClick,
  onEventClick,
  onEventMove
}: WeeklyPlannerViewProps) => {
  const timeSlots = generateTimeSlots();
  const weekStartDate = week[0]?.date;
  const weekEndDate = week[6]?.date;
  const weekNumber = weekStartDate ? getWeekNumber(weekStartDate) : 1;
  
  // Calculate statistics ONLY for the current week
  const weekEvents = events.filter(event => {
    const eventDate = new Date(event.startTime);
    const weekStart = new Date(weekStartDate);
    const weekEnd = new Date(weekEndDate);
    
    // Set to start/end of day for proper comparison
    weekStart.setHours(0, 0, 0, 0);
    weekEnd.setHours(23, 59, 59, 999);
    
    return eventDate >= weekStart && eventDate <= weekEnd;
  });
  
  const totalEvents = weekEvents.length;
  const totalHours = weekEvents.reduce((sum, event) => {
    return sum + (new Date(event.endTime).getTime() - new Date(event.startTime).getTime()) / (1000 * 60 * 60);
  }, 0);
  
  const getEventStyle = (event: CalendarEvent) => {
    const eventStart = new Date(event.startTime);
    const eventEnd = new Date(event.endTime);
    const durationMinutes = (eventEnd.getTime() - eventStart.getTime()) / (1000 * 60);
    
    // Base appointment styles matching HTML
    let className = 'appointment ';
    
    // Check if it's a SimplePractice appointment
    const isSimplePractice = event.source === 'simplepractice' || 
                           event.notes?.toLowerCase().includes('simple practice') ||
                           event.title?.toLowerCase().includes('simple practice') ||
                           event.description?.toLowerCase().includes('simple practice') ||
                           event.title?.toLowerCase().includes('appointment'); // SimplePractice appointments sync as "X Appointment"
    
    if (isSimplePractice) {
      className += 'simplepractice ';
    } else if (event.source === 'google') {
      className += 'google-calendar ';
    } else {
      className += 'personal ';
    }
    
    // Duration classes
    if (durationMinutes >= 90) {
      className += 'duration-90';
    } else if (durationMinutes >= 60) {
      className += 'duration-60';
    } else {
      className += 'duration-30';
    }
    
    return className;
  };

  const renderTimeSlotEvents = (date: Date, slot: any, slotIndex: number) => {
    const dayEvents = events.filter(event => 
      new Date(event.startTime).toDateString() === date.toDateString()
    );

    const slotEvents = dayEvents.filter(event => {
      const eventDate = new Date(event.startTime);
      const eventStartMinutes = eventDate.getHours() * 60 + eventDate.getMinutes();
      const slotStartMinutes = slot.hour * 60 + slot.minute;
      
      return eventStartMinutes >= slotStartMinutes && 
             eventStartMinutes < slotStartMinutes + 30;
    });

    return slotEvents.map(event => {
      const eventStart = new Date(event.startTime);
      const eventEnd = new Date(event.endTime);
      const durationMinutes = (eventEnd.getTime() - eventStart.getTime()) / (1000 * 60);
      const slots = Math.ceil(durationMinutes / 30);
      
      const startTime = eventStart.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: false 
      });
      const endTime = eventEnd.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: false 
      });

      return (
        <div
          key={event.id}
          className={`appointment ${getEventStyle(event)}`}
          style={{
            height: `${slots * 30 - 4}px`,
            position: 'absolute',
            top: '2px',
            left: '2px',
            right: '2px',
            zIndex: 10,
            cursor: 'pointer'
          }}
          onClick={() => {
            // Navigate to daily view for this appointment's date
            const appointmentDate = new Date(event.startTime);
            onDayClick(appointmentDate);
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '0.8';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '1';
          }}
          title="Click to view daily schedule"
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData('text/plain', JSON.stringify({
              eventId: event.id,
              originalStartTime: event.startTime.toISOString(),
              originalEndTime: event.endTime.toISOString(),
              duration: event.endTime.getTime() - event.startTime.getTime()
            }));
          }}
        >
          <div className="appointment-name">{event.title}</div>
          <div className="appointment-time">{startTime}-{endTime}</div>
        </div>
      );
    });
  };

  return (
    <div className="planner-container">
      {/* Header - exact match to HTML */}
      <div className="header">
        <h1>Weekly Planner</h1>
        <div className="week-info">
          {weekStartDate?.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}-
          {weekEndDate?.toLocaleDateString('en-US', { day: 'numeric' })} • Week {weekNumber}
        </div>
      </div>

      {/* Week Statistics - exact match to HTML */}
      <div className="week-stats">
        <div className="stat-card">
          <span className="stat-number">{totalEvents}</span>
          Total Appointments
        </div>
        <div className="stat-card">
          <span className="stat-number">{totalHours.toFixed(1)}h</span>
          Scheduled Time
        </div>
        <div className="stat-card">
          <span className="stat-number">{(totalHours / 7).toFixed(1)}h</span>
          Daily Average
        </div>
        <div className="stat-card">
          <span className="stat-number">{(168 - totalHours).toFixed(0)}h</span>
          Available Time
        </div>
      </div>

      {/* Legend - exact match to HTML */}
      <div className="legend">
        <span className="legend-item">
          <span className="legend-symbol simplepractice"></span>SimplePractice
        </span>
        <span className="legend-item">
          <span className="legend-symbol google-calendar"></span>Google Calendar
        </span>
        <span className="legend-item">
          <span className="legend-symbol personal"></span>Holidays in United States
        </span>
      </div>

      {/* Calendar Container - exact match to HTML */}
      <div className="calendar-container">
        <div className="calendar-grid">
          {/* Headers */}
          <div className="time-header">TIME</div>
          {week.map((day, index) => {
            const dayName = day.date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
            const dayNum = day.date.getDate();
            
            return (
              <div key={index} className="day-header" onClick={() => onDayClick(day.date)}>
                <div className="day-name">{dayName}</div>
                <div className="day-date">{dayNum}</div>
              </div>
            );
          })}

          {/* Time slots grid */}
          {timeSlots.map((slot, slotIndex) => {
            const isHour = slot.minute === 0;
            
            // Time slot label
            return [
              <div key={`time-${slot.hour}-${slot.minute}`} className={`time-slot ${isHour ? 'hour' : ''}`}>
                <span className={isHour ? 'text-sm' : 'text-xs'}>
                  {slot.time}
                </span>
              </div>,
              
              // Calendar cells for each day
              ...week.map((day, dayIndex) => (
                <div
                  key={`${slotIndex}-${dayIndex}`}
                  className={`calendar-cell ${isHour ? 'hour' : 'half-hour'}`}
                  onClick={() => onTimeSlotClick(day.date, slot.time)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (!onEventMove) return;

                    try {
                      const dragData = JSON.parse(e.dataTransfer.getData('text/plain'));
                      const newStartTime = new Date(day.date);
                      newStartTime.setHours(slot.hour, slot.minute, 0, 0);
                      
                      const newEndTime = new Date(newStartTime.getTime() + dragData.duration);
                      
                      onEventMove(dragData.eventId, newStartTime, newEndTime);
                    } catch (error) {
                      console.error('Error handling drop:', error);
                    }
                  }}
                >
                  {renderTimeSlotEvents(day.date, slot, slotIndex)}
                </div>
              ))
            ];
          }).flat()}
        </div>
      </div>

    </div>
  );
};