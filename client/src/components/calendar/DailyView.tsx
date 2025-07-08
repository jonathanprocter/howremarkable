import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { formatDate } from '../../utils/dateUtils';
import { generateTimeSlots } from '../../utils/timeSlots';
import { CalendarEvent } from '../../types/calendar';

interface DailyViewProps {
  selectedDate: Date;
  events: CalendarEvent[];
  dailyNotes: string;
  onPreviousDay: () => void;
  onNextDay: () => void;
  onBackToWeek: () => void;
  onEventClick: (event: CalendarEvent) => void;
  onUpdateEvent: (eventId: string, updates: Partial<CalendarEvent>) => void;
  onUpdateDailyNotes: (notes: string) => void;
  onEventMove?: (eventId: string, newStartTime: Date, newEndTime: Date) => void;
  onCreateEvent?: (startTime: Date, endTime: Date) => void;
  onDeleteEvent?: (eventId: string) => void;
}

export const DailyView = ({
  selectedDate,
  events,
  dailyNotes,
  onPreviousDay,
  onNextDay,
  onBackToWeek,
  onEventClick,
  onUpdateEvent,
  onUpdateDailyNotes,
  onEventMove,
  onCreateEvent,
  onDeleteEvent
}: DailyViewProps) => {
  const [currentNotes, setCurrentNotes] = useState(dailyNotes);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [noteTimers, setNoteTimers] = useState<{[key: string]: NodeJS.Timeout}>({});

  // Get events for the selected date
  const dayEvents = events.filter(event => {
    const eventDate = new Date(event.startTime);
    const selectedDateString = selectedDate.toDateString();
    const eventDateString = eventDate.toDateString();
    const matches = eventDateString === selectedDateString;
    
    console.log(`Event: ${event.title} on ${eventDateString}, Selected: ${selectedDateString}, Matches: ${matches}`);
    
    return matches;
  });

  console.log(`Daily View - Selected date: ${selectedDate.toDateString()}`);
  console.log(`Daily View - Total events: ${events.length}`);
  console.log(`Daily View - Day events: ${dayEvents.length}`);

  // Calculate daily statistics
  const totalEvents = dayEvents.length;
  const totalHours = dayEvents.reduce((sum, event) => {
    return sum + (new Date(event.endTime).getTime() - new Date(event.startTime).getTime()) / (1000 * 60 * 60);
  }, 0);
  const availableHours = 24 - totalHours;
  const freeTimePercentage = Math.round((availableHours / 24) * 100);

  // Use the same time slot generation as weekly view (6:00 to 23:30)
  const timeSlots = generateTimeSlots().map(slot => ({
    ...slot,
    isHour: slot.minute === 0
  }));

  const getEventStyle = (event: CalendarEvent) => {
    const eventStart = new Date(event.startTime);
    const eventEnd = new Date(event.endTime);
    const durationMinutes = (eventEnd.getTime() - eventStart.getTime()) / (1000 * 60);
    
    // Check if this is an all-day event
    const isMarkedAllDay = (event as any).isAllDay;
    const duration = event.endTime.getTime() - event.startTime.getTime();
    const hours = duration / (1000 * 60 * 60);
    const startHour = eventStart.getHours();
    const startMinute = eventStart.getMinutes();
    const isFullDay = startHour === 0 && startMinute === 0 && (hours === 24 || hours % 24 === 0);
    const isAllDayEvent = isMarkedAllDay || isFullDay || hours >= 20;
    
    if (isAllDayEvent) {
      // All-day events should be positioned at the top, not in the timeline
      return {
        className: 'appointment all-day',
        style: {
          top: '0px',
          height: '40px',
          position: 'relative' as const,
          marginBottom: '8px'
        }
      };
    }
    
    // Calculate position based on start time - aligned to time slots exactly
    // Timeline starts at 6:00, so we calculate 30-minute slots since 6:00
    const minutesSince6am = (startHour - 6) * 60 + startMinute;
    const slotsFromStart = minutesSince6am / 30;
    const topPosition = Math.max(0, slotsFromStart * 60);
    
    // Calculate height based on duration
    let height = Math.max(56, (durationMinutes / 30) * 60 - 4); // 60px per 30min slot, minus padding
    
    // Source-specific styling - check if it's a SimplePractice appointment
    let className = 'appointment ';
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
    
    return {
      className,
      style: {
        top: `${topPosition}px`,
        height: `${height}px`
      }
    };
  };

  const toggleEventExpansion = (eventId: string) => {
    setExpandedEventId(expandedEventId === eventId ? null : eventId);
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, event: CalendarEvent) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({
      eventId: event.id,
      startTime: event.startTime,
      endTime: event.endTime
    }));
  };

  const handleDrop = (e: React.DragEvent, slot: any, slotIndex: number) => {
    e.preventDefault();
    try {
      const dragData = JSON.parse(e.dataTransfer.getData('text/plain'));
      const { eventId, startTime, endTime } = dragData;
      
      // Calculate new start time based on slot position
      const slotHour = Math.floor(slotIndex / 2) + 6; // 6:00 AM start, 2 slots per hour
      const slotMinute = (slotIndex % 2) * 30;
      
      const originalStart = new Date(startTime);
      const originalEnd = new Date(endTime);
      const duration = originalEnd.getTime() - originalStart.getTime();
      
      const newStartTime = new Date(selectedDate);
      newStartTime.setHours(slotHour, slotMinute, 0, 0);
      
      const newEndTime = new Date(newStartTime.getTime() + duration);
      
      if (onEventMove) {
        onEventMove(eventId, newStartTime, newEndTime);
      }
    } catch (error) {
      console.error('Error processing drop:', error);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleSlotDoubleClick = (slot: any, slotIndex: number) => {
    if (onCreateEvent) {
      const slotHour = Math.floor(slotIndex / 2) + 6; // 6:00 AM start, 2 slots per hour
      const slotMinute = (slotIndex % 2) * 30;
      
      const startTime = new Date(selectedDate);
      startTime.setHours(slotHour, slotMinute, 0, 0);
      
      const endTime = new Date(startTime);
      endTime.setHours(slotHour, slotMinute + 30, 0, 0); // Default 30-minute duration
      
      onCreateEvent(startTime, endTime);
    }
  };

  const handleEventNotesChange = (eventId: string, field: 'notes' | 'actionItems', value: string) => {
    onUpdateEvent(eventId, { [field]: value });
  };

  const formatEventTime = (event: CalendarEvent) => {
    const start = new Date(event.startTime);
    const end = new Date(event.endTime);
    return `${start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}-${end.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}`;
  };

  const getDayName = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  };

  const getDateString = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="planner-container daily-planner">
      {/* Header - exact match to HTML template */}
      <div className="header">
        <h1>Daily Planner</h1>
        <div className="date-info">{getDayName(selectedDate)}, {getDateString(selectedDate)}</div>
        <div className="navigation">
          <Button
            variant="outline"
            size="sm"
            onClick={onBackToWeek}
            className="mr-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Week
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onPreviousDay}
            className="mr-2"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onNextDay}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Daily Statistics - exact match to HTML template */}
      <div className="daily-stats">
        <div className="stat-item">
          <span className="stat-number">{totalEvents}</span>
          Appointments
        </div>
        <div className="stat-item">
          <span className="stat-number">{totalHours.toFixed(1)}h</span>
          Scheduled
        </div>
        <div className="stat-item">
          <span className="stat-number">{availableHours.toFixed(1)}h</span>
          Available
        </div>
        <div className="stat-item">
          <span className="stat-number">{freeTimePercentage}%</span>
          Free Time
        </div>
      </div>

      {/* Legend - exact match to HTML template */}
      <div className="legend">
        <div className="legend-item">
          <span className="legend-symbol simplepractice"></span>SimplePractice
        </div>
        <div className="legend-item">
          <span className="legend-symbol google-calendar"></span>Google Calendar
        </div>
        <div className="legend-item">
          <span className="legend-symbol personal"></span>Personal
        </div>
      </div>

      {/* All-Day Events Section */}
      {dayEvents.filter(event => {
        const isMarkedAllDay = (event as any).isAllDay;
        const duration = event.endTime.getTime() - event.startTime.getTime();
        const hours = duration / (1000 * 60 * 60);
        const startHour = event.startTime.getHours();
        const startMinute = event.startTime.getMinutes();
        const isFullDay = startHour === 0 && startMinute === 0 && (hours === 24 || hours % 24 === 0);
        return isMarkedAllDay || isFullDay || hours >= 20;
      }).length > 0 && (
        <div className="all-day-section mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <h4 className="text-sm font-medium text-blue-800 mb-2">All Day</h4>
          <div className="space-y-2">
            {dayEvents.filter(event => {
              const isMarkedAllDay = (event as any).isAllDay;
              const duration = event.endTime.getTime() - event.startTime.getTime();
              const hours = duration / (1000 * 60 * 60);
              const startHour = event.startTime.getHours();
              const startMinute = event.startTime.getMinutes();
              const isFullDay = startHour === 0 && startMinute === 0 && (hours === 24 || hours % 24 === 0);
              return isMarkedAllDay || isFullDay || hours >= 20;
            }).map((event) => (
              <div
                key={event.id}
                className="all-day-event p-2 bg-blue-100 border border-blue-300 rounded text-sm cursor-pointer hover:bg-blue-200 transition-colors"
                onClick={() => toggleEventExpansion(event.id)}
              >
                <div className="font-medium text-blue-900">{event.title}</div>
                {event.description && (
                  <div className="text-blue-700 text-xs mt-1">{event.description}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Schedule Grid - CSS Grid for perfect alignment */}
      <div className="schedule-grid">
        {/* Time Column */}
        <div className="time-column">
          {timeSlots.map((slot, index) => (
            <div key={index} className={`time-slot ${slot.isHour ? 'hour' : ''}`}>
              <span className={slot.minute === 0 ? 'text-sm' : 'text-xs'}>
                {slot.time}
              </span>
            </div>
          ))}
        </div>

        {/* Appointments Column */}
        <div className="appointments-column">
          {/* Empty appointment slots for grid background */}
          {timeSlots.map((slot, index) => (
            <div 
              key={index} 
              className={`appointment-slot ${slot.isHour ? 'hour' : ''}`}
              onDrop={(e) => handleDrop(e, slot, index)}
              onDragOver={handleDragOver}
              onDoubleClick={() => handleSlotDoubleClick(slot, index)}
              title="Double-click to create new appointment"
            ></div>
          ))}

          {/* Render timed events as absolutely positioned elements */}
          {dayEvents.filter(event => {
            // Filter out all-day events from the timeline
            const isMarkedAllDay = (event as any).isAllDay;
            const duration = event.endTime.getTime() - event.startTime.getTime();
            const hours = duration / (1000 * 60 * 60);
            const startHour = event.startTime.getHours();
            const startMinute = event.startTime.getMinutes();
            const isFullDay = startHour === 0 && startMinute === 0 && (hours === 24 || hours % 24 === 0);
            return !(isMarkedAllDay || isFullDay || hours >= 20);
          }).map((event) => {
            const { className, style } = getEventStyle(event);
            return (
              <div key={event.id}>
                <div
                  className={className}
                  style={style}
                  draggable
                  onDragStart={(e) => handleDragStart(e, event)}
                  onClick={() => toggleEventExpansion(event.id)}
                >
                  <div className="appointment-layout">
                    {/* Left: Title, Calendar, and Time */}
                    <div className="appointment-left">
                      <div className="appointment-title-bold">{event.title}</div>
                      <div className="appointment-calendar">{event.source} calendar</div>
                      <div className="appointment-time">{formatEventTime(event)}</div>
                    </div>
                    
                    {/* Center: Event Notes (bulleted) - only if they exist */}
                    <div className="appointment-center">
                      {event.notes && (
                        <div className="appointment-notes">
                          <div className="appointment-notes-header">Event Notes</div>
                          {event.notes.split('\n').filter(note => {
                            const cleaned = note.trim().replace(/^•+\s*/, '');
                            return cleaned && cleaned !== '';
                          }).map((note, index) => {
                            const cleaned = note.trim().replace(/^•+\s*/, '');
                            return (
                              <div key={index} className="note-item">• {cleaned}</div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    
                    {/* Right: Action Items - only if they exist */}
                    <div className="appointment-right">
                      {event.actionItems && (
                        <div className="appointment-actions">
                          <div className="appointment-actions-header">Action Items</div>
                          {event.actionItems.split('\n').filter(item => {
                            const cleaned = item.trim().replace(/^•+\s*/, '');
                            return cleaned && cleaned !== '';
                          }).map((item, index) => {
                            const cleaned = item.trim().replace(/^•+\s*/, '');
                            return (
                              <div key={index} className="action-item">• {cleaned}</div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Expanded event details */}
                {expandedEventId === event.id && (
                  <div 
                    className="expanded-event-details"
                    style={{
                      position: 'absolute',
                      top: `${parseInt(style.top) + parseInt(style.height) + 5}px`,
                      left: '8px',
                      right: '8px',
                      background: '#f8f8f8',
                      border: '2px solid #ccc',
                      borderRadius: '4px',
                      padding: '12px',
                      zIndex: 1000,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                  >
                    <div className="space-y-3">
                      <div className="notes-area">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Event Notes
                        </label>
                        <Textarea
                          value={event.notes || ''}
                          onChange={(e) => handleEventNotesChange(event.id, 'notes', e.target.value)}
                          placeholder="Add notes for this appointment..."
                          className="w-full text-sm"
                          rows={3}
                        />
                      </div>
                      <div className="notes-area">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Action Items
                        </label>
                        <Textarea
                          value={event.actionItems || ''}
                          onChange={(e) => handleEventNotesChange(event.id, 'actionItems', e.target.value)}
                          placeholder="Add action items and follow-ups..."
                          className="w-full text-sm"
                          rows={2}
                        />
                      </div>
                      <div className="flex justify-between pt-2">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            if (onDeleteEvent) {
                              onDeleteEvent(event.id);
                            }
                            setExpandedEventId(null);
                          }}
                          className="text-xs"
                        >
                          Delete
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setExpandedEventId(null)}
                          className="text-xs"
                        >
                          Close
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};