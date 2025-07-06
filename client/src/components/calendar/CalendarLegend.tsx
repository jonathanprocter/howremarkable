import React from 'react';

interface Calendar {
  id: string;
  name: string;
  color: string;
}

interface CalendarLegendProps {
  calendars: Calendar[];
  selectedCalendars: Set<string>;
  onCalendarToggle?: (calendarId: string) => void;
}

export const CalendarLegend = ({ calendars, selectedCalendars, onCalendarToggle }: CalendarLegendProps) => {
  if (calendars.length === 0) {
    return null;
  }

  return (
    <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
      <h4 className="text-sm font-medium text-gray-700 mb-2">Calendar Sources</h4>
      <div className="flex flex-wrap gap-3">
        {/* Default calendar types */}
        <div className="flex items-center space-x-2">
          <div 
            className="w-3 h-3 rounded-full border"
            style={{ backgroundColor: '#6495ED', borderColor: '#4169E1' }}
          />
          <span className="text-xs text-gray-600">SimplePractice</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <div 
            className="w-3 h-3 rounded-full border"
            style={{ backgroundColor: '#999', borderColor: '#666' }}
          />
          <span className="text-xs text-gray-600">Manual</span>
        </div>

        {/* Google Calendar sources */}
        {calendars.map((calendar) => (
          <div 
            key={calendar.id}
            className={`flex items-center space-x-2 cursor-pointer transition-opacity ${
              selectedCalendars.has(calendar.id) ? 'opacity-100' : 'opacity-40'
            }`}
            onClick={() => onCalendarToggle?.(calendar.id)}
          >
            <div 
              className="w-3 h-3 rounded-full border-2"
              style={{ 
                backgroundColor: selectedCalendars.has(calendar.id) ? calendar.color : 'transparent',
                borderColor: calendar.color 
              }}
            />
            <span className="text-xs text-gray-600">{calendar.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};