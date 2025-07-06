import { useState } from 'react';
import { ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { generateTimeSlots, isEventInTimeSlot, getEventDurationInSlots } from '../../utils/timeSlots';
import { formatDate } from '../../utils/dateUtils';
import { CalendarEvent } from '../../types/calendar';
import { cn } from '@/lib/utils';

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
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [currentNotes, setCurrentNotes] = useState(dailyNotes);
  const [draggedEvent, setDraggedEvent] = useState<CalendarEvent | null>(null);

  const handleDragStart = (e: React.DragEvent, event: CalendarEvent) => {
    setDraggedEvent(event);
    e.dataTransfer.setData('text/plain', event.id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, timeSlot: { hour: number; minute: number }) => {
    e.preventDefault();
    
    if (!draggedEvent || !onEventMove) return;
    
    const newStartTime = new Date(selectedDate);
    newStartTime.setHours(timeSlot.hour, timeSlot.minute, 0, 0);
    
    // Calculate the duration of the original event
    const originalDuration = draggedEvent.endTime.getTime() - draggedEvent.startTime.getTime();
    const newEndTime = new Date(newStartTime.getTime() + originalDuration);
    
    onEventMove(draggedEvent.id, newStartTime, newEndTime);
    setDraggedEvent(null);
  };

  const timeSlots = generateTimeSlots();
  const dayEvents = events.filter(event => {
    const eventDate = new Date(event.startTime);
    const selectedDateStr = selectedDate.toDateString();
    const eventDateStr = eventDate.toDateString();
    
    // For all-day events, also check if the date falls within the event's date range
    const duration = event.endTime.getTime() - event.startTime.getTime();
    const hours = duration / (1000 * 60 * 60);
    const isAllDayEvent = (event as any).isAllDay || hours >= 20;
    
    if (isAllDayEvent) {
      // For all-day events, check if the selected date falls within the event range
      const selectedDateOnly = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
      const eventStartOnly = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
      const eventEndDate = new Date(event.endTime);
      const eventEndOnly = new Date(eventEndDate.getFullYear(), eventEndDate.getMonth(), eventEndDate.getDate());
      
      return selectedDateOnly >= eventStartOnly && selectedDateOnly < eventEndOnly;
    }
    
    return eventDateStr === selectedDateStr;
  });

  // Separate all-day events from timed events
  const allDayEvents = dayEvents.filter(event => {
    // First check if backend marked it as all-day
    if ((event as any).isAllDay) return true;
    
    // Fallback: Check if event is all-day by looking at duration and time patterns
    const duration = event.endTime.getTime() - event.startTime.getTime();
    const hours = duration / (1000 * 60 * 60);
    
    // Check if event starts at midnight and duration is 24 hours or multiple of 24
    const startHour = event.startTime.getHours();
    const startMinute = event.startTime.getMinutes();
    const isFullDay = startHour === 0 && startMinute === 0 && (hours === 24 || hours % 24 === 0);
    
    // Also check for events that span 20+ hours or are exactly 24 hours
    return isFullDay || hours >= 20;
  });
  
  const timedEvents = dayEvents.filter(event => {
    // First check if backend marked it as all-day
    if ((event as any).isAllDay) return false;
    
    const duration = event.endTime.getTime() - event.startTime.getTime();
    const hours = duration / (1000 * 60 * 60);
    const startHour = event.startTime.getHours();
    const startMinute = event.startTime.getMinutes();
    const isFullDay = startHour === 0 && startMinute === 0 && (hours === 24 || hours % 24 === 0);
    
    return !isFullDay && hours < 20;
  });

  const toggleEventExpansion = (eventId: string) => {
    setExpandedEventId(expandedEventId === eventId ? null : eventId);
  };

  const handleEventNotesChange = (eventId: string, field: 'notes' | 'actionItems', value: string) => {
    onUpdateEvent(eventId, { [field]: value });
  };

  const handleDailyNotesChange = () => {
    onUpdateDailyNotes(currentNotes);
  };

  return (
    <div className="remarkable-width mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onBackToWeek}
            className="flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Week
          </Button>
          <h2 className="text-2xl font-bold text-gray-900">
            {formatDate(selectedDate)}
          </h2>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onPreviousDay}
            className="flex items-center"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous Day
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onNextDay}
            className="flex items-center"
          >
            Next Day
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Schedule Section */}
        <div className="border border-gray-300 rounded-lg overflow-hidden">
          <div className="grid grid-cols-8 border-b border-gray-300">
            <div className="time-header p-3 text-sm font-semibold text-center">
              Time
            </div>
            <div className="time-header p-3 text-sm font-semibold col-span-7">
              Event
            </div>
          </div>
          
          {/* All-Day Events Section */}
          {allDayEvents.length > 0 && (
            <div className="grid grid-cols-8 border-b border-gray-300 bg-red-50">
              <div className="time-slot p-2 text-sm font-medium text-gray-600 bg-red-100 border-r border-gray-300 text-center">
                All Day
              </div>
              <div className="time-slot p-3 col-span-7 space-y-2">
                {allDayEvents.map((event) => (
                  <div key={event.id} className="space-y-2">
                    <div
                      className={cn(
                        "event-block cursor-pointer",
                        `event-block ${event.source}`,
                        "event-block all-day"
                      )}
                      onClick={() => toggleEventExpansion(event.id)}
                    >
                      <div className="text-sm font-medium text-gray-800">
                        {event.title}
                      </div>
                      <div className="text-xs text-gray-600">
                        {event.notes || event.source} • All Day Event
                      </div>
                    </div>
                    
                    {expandedEventId === event.id && (
                      <div className="expanded-event mt-2 p-3 bg-gray-50 rounded border">
                        <div className="space-y-3">
                          <div className="notes-area">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Event Notes
                            </label>
                            <Textarea
                              value={event.notes || ''}
                              onChange={(e) => handleEventNotesChange(event.id, 'notes', e.target.value)}
                              placeholder="All-day event details..."
                              className="w-full"
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
                              placeholder="Tasks and follow-ups..."
                              className="w-full"
                              rows={2}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Time slots grid */}
          {timeSlots.map((timeSlot, index) => {
            // Find events that should start in this specific time slot
            const slotEvents = timedEvents.filter(event => {
              const eventStart = new Date(event.startTime);
              const eventHour = eventStart.getHours();
              const eventMinute = eventStart.getMinutes();
              
              // Round event minutes to nearest 30-minute slot
              const roundedMinute = eventMinute >= 30 ? 30 : 0;
              
              return timeSlot.hour === eventHour && timeSlot.minute === roundedMinute;
            });
            
            return (
              <div key={index} className="grid grid-cols-8 border-b border-gray-300 last:border-b-0">
                <div className="time-slot p-2 text-sm font-medium text-gray-600 bg-gray-50 border-r border-gray-300 text-center">
                  {timeSlot.time}
                </div>
                <div 
                  className="time-slot p-3 relative col-span-7 hover:bg-gray-50"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, timeSlot)}
                >
                  {slotEvents.map((event) => {
                    const duration = getEventDurationInSlots(event);
                    const eventHeight = duration * 40; // 40px per slot to match time-slot height
                    
                    return (
                      <div key={event.id} className="relative">
                        <div
                          className={cn(
                            "event-block cursor-pointer",
                            `event-block ${event.source}`,
                            event.source === 'google' && "cursor-move"
                          )}
                          style={{ 
                            height: `${eventHeight}px`,
                            zIndex: 10,
                            position: duration > 1 ? 'absolute' : 'relative',
                            top: 0,
                            left: 0,
                            right: 0
                          }}
                          draggable={event.source === 'google'}
                          onDragStart={(e) => handleDragStart(e, event)}
                          onClick={() => toggleEventExpansion(event.id)}
                        >
                          <div className="text-sm font-medium text-gray-800">
                            {event.title}
                          </div>
                          <div className="text-xs text-gray-600">
                            {event.notes || event.source} • {event.startTime.toLocaleTimeString('en-US', { 
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
                        
                        {expandedEventId === event.id && (
                          <div className="expanded-event mt-2 p-3 bg-gray-50 rounded border">
                            <div className="space-y-3">
                              <div className="notes-area">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Meeting Notes
                                </label>
                                <Textarea
                                  value={event.notes || ''}
                                  onChange={(e) => handleEventNotesChange(event.id, 'notes', e.target.value)}
                                  placeholder="Regular therapy session."
                                  className="w-full"
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
                                  placeholder="Process recent events.&#10;Homework assignment"
                                  className="w-full"
                                  rows={2}
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Daily Notes Section */}
        <div className="border border-gray-300 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3 text-gray-900">Daily Notes</h3>
          <Textarea
            value={currentNotes}
            onChange={(e) => setCurrentNotes(e.target.value)}
            onBlur={handleDailyNotesChange}
            placeholder="Add your daily notes, reflections, and thoughts here..."
            className="w-full resize-none"
            rows={8}
          />
        </div>
      </div>
    </div>
  );
};