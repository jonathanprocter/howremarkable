import { useState } from 'react';
import { ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { formatDate } from '../../utils/dateUtils';
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
  onEventMove
}: DailyViewProps) => {
  const [currentNotes, setCurrentNotes] = useState(dailyNotes);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  // Get events for the selected date
  const dayEvents = events.filter(event => 
    new Date(event.startTime).toDateString() === selectedDate.toDateString()
  );

  // Calculate daily statistics
  const totalEvents = dayEvents.length;
  const totalHours = dayEvents.reduce((sum, event) => {
    return sum + (new Date(event.endTime).getTime() - new Date(event.startTime).getTime()) / (1000 * 60 * 60);
  }, 0);
  const availableHours = 24 - totalHours;
  const freeTimePercentage = Math.round((availableHours / 24) * 100);

  // Generate time slots from 06:00 to 21:30 (matching HTML template)
  const timeSlots = [];
  for (let hour = 6; hour <= 21; hour++) {
    timeSlots.push({ hour, minute: 0, time: `${hour.toString().padStart(2, '0')}:00`, isHour: true });
    if (hour < 21) {
      timeSlots.push({ hour, minute: 30, time: `${hour.toString().padStart(2, '0')}:30`, isHour: false });
    }
  }

  const getEventStyle = (event: CalendarEvent) => {
    const eventStart = new Date(event.startTime);
    const eventEnd = new Date(event.endTime);
    const durationMinutes = (eventEnd.getTime() - eventStart.getTime()) / (1000 * 60);
    
    // Calculate position based on start time - aligned to time slots exactly
    const startHour = eventStart.getHours();
    const startMinute = eventStart.getMinutes();
    
    // Calculate exact position based on time slot index from 6:00 AM
    const hoursSince6am = startHour - 6;
    const slotIndex = hoursSince6am * 2 + (startMinute >= 30 ? 1 : 0);
    const topPosition = Math.max(0, slotIndex * 60); // 60px per slot to match CSS, ensure non-negative
    
    // Debug log for positioning
    console.log(`Event: ${event.title}, Start: ${startHour}:${startMinute.toString().padStart(2, '0')}, SlotIndex: ${slotIndex}, TopPosition: ${topPosition}px`);
    
    // Calculate height based on duration
    let height = Math.max(56, (durationMinutes / 30) * 60 - 4); // 60px per 30min slot, minus padding
    
    // Source-specific styling - check if it's a SimplePractice appointment
    let className = 'appointment ';
    const isSimplePractice = event.source === 'simplepractice' || 
                           event.notes?.toLowerCase().includes('simple practice') ||
                           event.title?.toLowerCase().includes('simple practice') ||
                           event.description?.toLowerCase().includes('simple practice');
    
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

      {/* Schedule Grid - exact match to HTML template */}
      <div className="schedule-grid">
        {/* Time Column */}
        <div className="time-column">
          {timeSlots.map((slot, index) => (
            <div key={index} className={`time-slot ${slot.isHour ? 'hour' : ''}`}>
              {slot.time}
            </div>
          ))}
        </div>

        {/* Appointments Column */}
        <div className="appointments-column">
          {/* Empty appointment slots for grid background */}
          {timeSlots.map((slot, index) => (
            <div key={index} className={`appointment-slot ${slot.isHour ? 'hour' : ''}`}></div>
          ))}

          {/* Render events as absolutely positioned elements */}
          {dayEvents.map((event) => {
            const { className, style } = getEventStyle(event);
            return (
              <div key={event.id}>
                <div
                  className={className}
                  style={style}
                  onClick={() => toggleEventExpansion(event.id)}
                >
                  <div className="appointment-header">
                    <div className="appointment-title">{event.title}</div>
                    <div className="appointment-time">{formatEventTime(event)}</div>
                  </div>
                  <div className="appointment-calendar">{event.source} calendar</div>
                  {event.description && (
                    <div className="appointment-description">{event.description}</div>
                  )}
                  {event.notes && (
                    <div className="appointment-notes">{event.notes}</div>
                  )}
                  {event.actionItems && (
                    <div className="appointment-actions">
                      <div className="action-item">{event.actionItems}</div>
                    </div>
                  )}
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
                      <div className="flex justify-end pt-2">
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