import React from 'react';
import { generateTimeSlots } from '../../utils/timeSlots';
import { CalendarEvent } from '../../types/calendar';
import { getWeekNumber, getWeekStartDate, getWeekEndDate } from '../../utils/dateUtils';

interface WeeklyPlannerViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onWeekChange: (direction: 'prev' | 'next') => void;
  onDayClick: (date: Date) => void;
  onTimeSlotClick: (date: Date, time: string) => void;
  onEventClick: (event: CalendarEvent) => void;
  onEventMove?: (eventId: string, newStartTime: Date, newEndTime: Date) => void;
  isLoading?: boolean;
}

export const WeeklyPlannerView = ({
  currentDate,
  events,
  onWeekChange,
  onDayClick,
  onTimeSlotClick,
  onEventClick,
  onEventMove,
  isLoading
}: WeeklyPlannerViewProps) => {
  const timeSlots = generateTimeSlots();

  // Generate week days from currentDate
  const weekStartDate = getWeekStartDate(currentDate);
  const weekEndDate = getWeekEndDate(currentDate);
  const weekNumber = getWeekNumber(currentDate);

  // Generate the week array
  const week = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStartDate);
    date.setDate(weekStartDate.getDate() + i);
    week.push({
      date,
      dayOfWeek: date.toLocaleDateString('en-US', { weekday: 'long' }),
      dayNumber: date.getDate(),
      events: events.filter(event => 
        new Date(event.startTime).toDateString() === date.toDateString()
      )
    });
  }

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
    const dayEvents = events.filter(event => {
      try {
        if (!event || !event.startTime) return false;
        return new Date(event.startTime).toDateString() === date.toDateString();
      } catch (error) {
        console.error('Error filtering day events:', error);
        return false;
      }
    });

    const slotEvents = dayEvents.filter(event => {
      try {
        const eventDate = new Date(event.startTime);
        const eventStartMinutes = eventDate.getHours() * 60 + eventDate.getMinutes();
        const slotStartMinutes = slot.hour * 60 + slot.minute;

        return eventStartMinutes >= slotStartMinutes && 
               eventStartMinutes < slotStartMinutes + 30;
      } catch (error) {
        console.error('Error filtering slot events:', error);
        return false;
      }
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
        >
          <div className="appointment-name">{event.title}</div>
          <div className="appointment-time">{startTime}-{endTime}</div>
        </div>
      );
    });
  };

  if (isLoading) {
    return (
      <div className="planner-container">
        <div className="header">
          <h1>Loading...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="planner-container">
      {/* Header - exact match to HTML */}
      <div className="header">
        <h1>Weekly Planner</h1>
        <div className="week-info">
          {weekStartDate?.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}-
          {weekEndDate?.toLocaleDateString('en-US', { day: 'numeric', year: 'numeric' })}, {weekEndDate?.getFullYear()} • Week {weekNumber}
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
          <span className="legend-symbol personal"></span>Personal
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

            const slotElements = [];

            // Time slot label
            slotElements.push(
              <div key={`time-${slot.hour}-${slot.minute}`} className={`time-slot ${isHour ? 'hour' : ''}`}>
                {slot.time}
              </div>
            );

            // Calendar cells for each day
            week.forEach((day, dayIndex) => {
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
                >
                  {renderTimeSlotEvents(day.date, slot, slotIndex)}
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