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
    // Debug: Log when we're checking Monday
    if (date.getDay() === 1) {
      console.log(`🔍 Checking slot ${slot.time} for ${date.toDateString()}, events count: ${events.length}`);
    }
    
    const dayEvents = events.filter(event => 
      new Date(event.startTime).toDateString() === date.toDateString()
    );

    if (date.getDay() === 1 && dayEvents.length > 0) {
      console.log(`📅 Found ${dayEvents.length} events for Monday: ${dayEvents.map(e => e.title).join(', ')}`);
    }

    const slotEvents = dayEvents.filter(event => {
      const eventDate = new Date(event.startTime);
      const eventStartMinutes = eventDate.getHours() * 60 + eventDate.getMinutes();
      const slotStartMinutes = slot.hour * 60 + slot.minute;
      
      const isInSlot = eventStartMinutes >= slotStartMinutes && eventStartMinutes < slotStartMinutes + 30;
      
      if (isInSlot && date.getDay() === 1) {
        console.log(`✅ Event "${event.title}" fits in slot ${slot.time}`);
      }
      
      return isInSlot;
    });

    return slotEvents.map(event => {
      const eventStart = new Date(event.startTime);
      const eventEnd = new Date(event.endTime);
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

      // Clean up appointment title
      const cleanTitle = event.title
        .replace(/\s+Appointment$/i, '')
        .replace(/^\w+\s+/, '') // Remove first word if it's a prefix
        .trim() || event.title;

      return (
        <div
          key={event.id}
          className={getEventStyle(event)}
          onClick={() => onEventClick(event)}
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData('text/plain', JSON.stringify({
              eventId: event.id,
              originalStartTime: event.startTime.toISOString(),
              originalEndTime: event.endTime.toISOString(),
              duration: event.endTime.getTime() - event.startTime.getTime()
            }));
          }}
          style={{
            position: 'absolute',
            top: '1px',
            left: '1px',
            right: '1px',
            height: '32px',
            zIndex: 15,
            fontSize: '8px',
            padding: '2px 4px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}
        >
          <div className="appointment-name" style={{ fontSize: '8px', fontWeight: 'bold', color: 'inherit' }}>
            {cleanTitle.toUpperCase()}
          </div>
          <div className="appointment-time" style={{ fontSize: '6px', opacity: '0.8' }}>
            {startTime}
          </div>
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

      {/* Enhanced Visual Legend */}
      <div className="legend bg-yellow-50 border-t-4 border-yellow-400">
        <div className="flex items-center justify-center gap-8 py-3">
          <div className="flex items-center gap-2">
            <div className="w-5 h-4 bg-blue-50 border-2 border-blue-500 relative" style={{borderLeft: '6px solid #4285F4'}}>
              <div className="absolute inset-0 bg-blue-100 opacity-30"></div>
            </div>
            <span className="text-blue-700 font-bold text-sm">SimplePractice (274 events)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-4 bg-white border-2 border-green-500 border-dashed relative">
              <div className="absolute inset-1 border border-green-400 border-dashed"></div>
            </div>
            <span className="text-green-700 font-bold text-sm">Google Calendar (29 events)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-4 bg-yellow-500 border-2 border-yellow-600">
            </div>
            <span className="text-yellow-700 font-bold text-sm">US Holidays</span>
          </div>
          <div className="text-gray-700 font-bold text-sm">
            Total: 303 events • 481 hours • Week 28 (July 7-13)
          </div>
        </div>
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
            
            const slotElements = [];
            
            // Time slot label
            slotElements.push(
              <div key={`time-${slot.hour}-${slot.minute}`} className={`time-slot ${isHour ? 'hour' : ''}`}>
                <span className={isHour ? 'text-sm' : 'text-xs'}>
                  {slot.time}
                </span>
              </div>
            );
            
            // Calendar cells for each day with proper event positioning
            week.forEach((day, dayIndex) => {
              const dayEvents = renderTimeSlotEvents(day.date, slot, slotIndex);
              
              slotElements.push(
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
                  style={{ position: 'relative', minHeight: '35px' }}
                >
                  {dayEvents.length > 0 && dayEvents}
                </div>
              );
            });
            
            return slotElements;
          }).flat()}
        </div>
      </div>
    </div>
  );
};