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
    } else if (event.title.includes('Holiday')) {
      className += 'holiday ';
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
    // Add debug for every call on Monday AND 08:00 slots
    if (date.getDay() === 1 || slot.time === '08:00') {
      console.log(`🔍 Checking slot ${slot.time} for ${date.toDateString()}, events count: ${events.length}`);
    }
    
    // Get all events for this specific day
    const dayEvents = events.filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate.toDateString() === date.toDateString();
    });
    
    // Critical debugging for Monday date filtering
    if (date.getDay() === 1 && slot.time === '08:00') {
      console.log(`🚨 CRITICAL MONDAY 08:00 DEBUG:`);
      console.log(`- Target date: ${date.toDateString()} (day: ${date.getDay()})`);
      console.log(`- Total events: ${events.length}`);
      console.log(`- Events filtered for this day: ${dayEvents.length}`);
      
      // Show first 5 events with their dates
      const sampleEvents = events.slice(0, 5);
      console.log(`- Sample events and dates:`, sampleEvents.map(e => ({
        title: e.title,
        originalStartTime: e.startTime,
        parsedDate: new Date(e.startTime),
        dateString: new Date(e.startTime).toDateString(),
        matches: new Date(e.startTime).toDateString() === date.toDateString()
      })));
      
      // Check for Monday events specifically
      const mondayEvents = events.filter(e => new Date(e.startTime).getDay() === 1);
      console.log(`- Total Monday events: ${mondayEvents.length}`);
      if (mondayEvents.length > 0) {
        console.log(`- Monday event examples:`, mondayEvents.slice(0, 3).map(e => `"${e.title}" on ${new Date(e.startTime).toDateString()}`));
      }
    }
    
    // Find events that start at this time slot
    const slotEvents = dayEvents.filter(event => {
      const eventStart = new Date(event.startTime);
      const eventHour = eventStart.getHours();
      const eventMinute = eventStart.getMinutes();
      
      const slotMatches = eventHour === slot.hour && eventMinute === slot.minute;
      if (slotMatches && (date.getDay() === 1 || slot.time === '08:00')) {
        console.log(`✅ Event "${event.title}" fits in slot ${slot.time} on ${date.toDateString()}`);
      }
      return slotMatches;
    });

    // CRITICAL: Return JSX elements for rendering in the calendar grid
    if (slotEvents.length === 0) {
      return [];
    }

    console.log(`🎯 RENDERING ${slotEvents.length} events for ${slot.time} on ${date.toDateString()}`);

    return slotEvents.map((event, index) => {
      const eventStart = new Date(event.startTime);
      const eventEnd = new Date(event.endTime);
      const durationMinutes = (eventEnd.getTime() - eventStart.getTime()) / (1000 * 60);
      
      // Calculate visual height based on duration
      const slotsSpanned = Math.ceil(durationMinutes / 30);
      const heightInPixels = Math.max(30, slotsSpanned * 35);
      
      const eventName = event.title.replace(' Appointment', '').toUpperCase();
      
      console.log(`📍 Creating visual element for "${eventName}" with height ${heightInPixels}px and class ${getEventStyle(event)}`);
      
      return (
        <div
          key={`${event.id}-${index}`}
          className={getEventStyle(event)}
          style={{
            position: 'absolute',
            top: '1px',
            left: '1px',
            right: '1px',
            bottom: '1px',
            minHeight: '32px',
            zIndex: 20,
            fontSize: '10px',
            padding: '4px',
            fontWeight: 'bold',
            overflow: 'hidden',
            cursor: 'pointer',
            borderRadius: '4px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            // EXTREME DEBUG VISIBILITY - Make appointments impossible to miss
            backgroundColor: '#FF0000 !important', // Bright red background
            border: '3px solid #00FF00 !important', // Bright green border  
            color: '#FFFFFF !important', // White text
            boxShadow: '0 0 10px #FF00FF !important' // Purple glow
          }}
          onClick={() => onEventClick(event)}
          draggable={true}
          onDragStart={(e) => {
            e.dataTransfer.setData('text/plain', JSON.stringify({
              eventId: event.id,
              duration: eventEnd.getTime() - eventStart.getTime()
            }));
          }}
        >
          <div className="appointment-name" style={{ lineHeight: '1.1', fontSize: '12px', fontWeight: 'bold', color: '#FFFFFF' }}>
            🔥 {eventName} 🔥
          </div>
          <div className="appointment-time" style={{ fontSize: '10px', color: '#FFFFFF', fontWeight: 'bold' }}>
            ⚡ {eventStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ⚡
          </div>
        </div>
      );
    });
  };

  return (
    <div className="planner-container" style={{ marginTop: '0', paddingTop: '0' }}>
      {/* Header - exact match to HTML */}
      <div className="header" style={{ marginTop: '0', paddingTop: '8px' }}>
        <h1 style={{ margin: '0', marginBottom: '4px' }}>Weekly Planner</h1>
        <div className="week-info" style={{ margin: '0' }}>
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
        <div className="legend-header">
          <h3>📅 Calendar Legend</h3>
        </div>
        <div className="legend-grid">
          {/* SimplePractice */}
          <div className="legend-item">
            <div className="legend-symbol simplepractice" style={{borderLeft: '6px solid #4285F4'}}></div>
            <span>SimplePractice (274 events)</span>
          </div>
          {/* Google Calendar */}
          <div className="legend-item">
            <div className="legend-symbol google" style={{border: '3px dashed #34d399'}}></div>
            <span>Google Calendar (29 events)</span>
          </div>
          {/* US Holidays */}
          <div className="legend-item">
            <div className="legend-symbol personal" style={{background: '#fbbf24', border: '3px solid #f59e0b'}}></div>
            <span>US Holidays</span>
          </div>
        </div>
      </div>

      {/* Enhanced Visual Legend - Left side positioning */}
      <div className="legend" style={{ 
        background: '#F8F9FA', 
        border: '2px solid #E5E7EB', 
        borderRadius: '8px',
        padding: '12px',
        marginBottom: '16px'
      }}>
        <div className="flex items-center justify-start gap-8 py-2">
          <div className="flex items-center gap-2">
            <div 
              className="w-6 h-5" 
              style={{
                backgroundColor: '#E3F2FD',
                border: '2px solid #6495ED',
                borderRadius: '4px'
              }}
            ></div>
            <span className="text-blue-700 font-bold text-sm">🔵 SimplePractice (274 events)</span>
          </div>
          <div className="flex items-center gap-2">
            <div 
              className="w-6 h-5" 
              style={{
                backgroundColor: '#E8F5E8',
                border: '2px dashed #22C55E',
                borderRadius: '4px'
              }}
            ></div>
            <span className="text-green-700 font-bold text-sm">🟢 Google Calendar (29 events)</span>
          </div>
          <div className="flex items-center gap-2">
            <div 
              className="w-6 h-5" 
              style={{
                backgroundColor: '#FEF3C7',
                border: '2px solid #F59E0B',
                borderRadius: '4px'
              }}
            ></div>
            <span className="text-yellow-700 font-bold text-sm">🟡 US Holidays</span>
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
              
              // Debug log for Monday specifically
              if (day.date.getDay() === 1 && dayEvents && dayEvents.length > 0) {
                console.log(`🎨 Monday slot ${slot.time}: Generated ${dayEvents.length} visual elements`);
              }
              
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
                  style={{ 
                    position: 'relative', 
                    minHeight: '35px',
                    backgroundColor: isHour ? '#FAFAFA' : '#FFFFFF',
                    borderBottom: isHour ? '1px solid #E0E0E0' : '1px solid #F0F0F0'
                  }}
                >
                  {dayEvents}
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