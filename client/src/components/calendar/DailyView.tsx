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
  onUpdateDailyNotes
}: DailyViewProps) => {
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [currentNotes, setCurrentNotes] = useState(dailyNotes);

  const timeSlots = generateTimeSlots();
  const dayEvents = events.filter(event => {
    const eventDate = new Date(event.startTime);
    return eventDate.toDateString() === selectedDate.toDateString();
  });

  // Separate all-day events from timed events
  const allDayEvents = dayEvents.filter(event => {
    const duration = event.endTime.getTime() - event.startTime.getTime();
    const hours = duration / (1000 * 60 * 60);
    return hours >= 20; // Consider events 20+ hours as all-day
  });
  
  const timedEvents = dayEvents.filter(event => {
    const duration = event.endTime.getTime() - event.startTime.getTime();
    const hours = duration / (1000 * 60 * 60);
    return hours < 20;
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
            <div className="grid grid-cols-8 border-b border-gray-300 bg-blue-50">
              <div className="time-slot p-2 text-sm font-medium text-gray-600 bg-blue-100 border-r border-gray-300 text-center">
                All Day
              </div>
              <div className="time-slot p-3 col-span-7 space-y-2">
                {allDayEvents.map((event) => (
                  <div key={event.id} className="space-y-2">
                    <div
                      className={cn(
                        "event-block cursor-pointer",
                        `event-block ${event.source}`
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
            const slotEvents = timedEvents.filter(event => 
              isEventInTimeSlot(event, timeSlot)
            );
            
            // Only show events in their starting time slot
            const isFirstSlotOfEvent = (event: CalendarEvent) => {
              const eventStart = new Date(event.startTime);
              const eventStartMinutes = eventStart.getHours() * 60 + eventStart.getMinutes();
              const slotStartMinutes = timeSlot.hour * 60 + timeSlot.minute;
              
              return eventStartMinutes >= slotStartMinutes && eventStartMinutes < slotStartMinutes + 30;
            };
            
            return (
              <div key={index} className="grid grid-cols-8 border-b border-gray-300 last:border-b-0">
                <div className="time-slot p-2 text-sm font-medium text-gray-600 bg-gray-50 border-r border-gray-300 text-center">
                  {timeSlot.time}
                </div>
                <div className="time-slot p-3 relative col-span-7">
                  {slotEvents.filter(isFirstSlotOfEvent).map((event) => {
                    const duration = getEventDurationInSlots(event);
                    const eventHeight = duration * 40; // 40px per slot to match time-slot height
                    
                    return (
                      <div key={event.id} className="space-y-2">
                        <div
                          className={cn(
                            "event-block cursor-pointer absolute left-2 right-2 top-0",
                            `event-block ${event.source}`
                          )}
                          style={{ 
                            height: `${eventHeight}px`,
                            zIndex: 10
                          }}
                          onClick={() => toggleEventExpansion(event.id)}
                        >
                          <div className="text-sm font-medium text-gray-800">
                            {event.title}
                          </div>
                          <div className="text-xs text-gray-600">
                            {event.notes || event.source} • {event.startTime.toLocaleTimeString('en-US', { 
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