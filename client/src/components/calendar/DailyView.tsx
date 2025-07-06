import { useState } from 'react';
import { ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { generateTimeSlots, isEventInTimeSlot } from '../../utils/timeSlots';
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
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          {formatDate(selectedDate)}
        </h2>
        <div className="flex justify-center space-x-4">
          <Button 
            variant="outline" 
            onClick={onPreviousDay}
            className="flex items-center"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous Day
          </Button>
          <Button 
            onClick={onBackToWeek}
            className="bg-blue-600 hover:bg-blue-700 flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Week View
          </Button>
          <Button 
            variant="outline" 
            onClick={onNextDay}
            className="flex items-center"
          >
            Next Day
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Schedule Column */}
        <div className="space-y-4">
          <div className="border border-gray-300 rounded-lg overflow-hidden">
            <div className="time-header p-3 text-sm font-semibold">
              {formatDate(selectedDate)} Schedule
            </div>
            
            <div className="p-4 space-y-3">
              {dayEvents.map((event) => (
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
                      {event.source} • {event.startTime.toLocaleTimeString('en-US', { 
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
                    <div className="expanded-event">
                      <div className="space-y-3">
                        <div className="notes-area">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Meeting Notes
                          </label>
                          <Textarea
                            value={event.notes || ''}
                            onChange={(e) => handleEventNotesChange(event.id, 'notes', e.target.value)}
                            placeholder="Add your meeting notes here..."
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
                            placeholder="Add action items here..."
                            className="w-full"
                            rows={2}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {dayEvents.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No events scheduled for this day
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Daily Notes Column */}
        <div className="space-y-4">
          <div className="border border-gray-300 rounded-lg p-4">
            <h3 className="text-sm font-semibold mb-3 text-gray-900">Daily Notes</h3>
            <Textarea
              value={currentNotes}
              onChange={(e) => setCurrentNotes(e.target.value)}
              onBlur={handleDailyNotesChange}
              placeholder="Add your daily notes, reflections, and thoughts here..."
              className="w-full resize-none"
              rows={16}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
