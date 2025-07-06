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
  // Create calendar items with specific Google calendar names + standard categories
  const calendarItems = [
    { 
      id: 'simplepractice', 
      name: 'SimplePractice', 
      color: '#4F46E5',
      selected: true, // Always selected for SimplePractice events
      type: 'static'
    },
    ...calendars.map(cal => ({
      id: cal.id,
      name: cal.name,
      color: cal.color || '#10B981',
      selected: selectedCalendars.has(cal.id),
      type: 'google'
    })),
    { 
      id: 'personal', 
      name: 'Personal', 
      color: '#6B7280',
      selected: true, // Always selected for manual events
      type: 'static'
    }
  ];

  const handleCalendarToggle = (calendarId: string, type: string) => {
    if (type === 'google') {
      onCalendarToggle?.(calendarId);
    }
    // SimplePractice and Personal are always on, so no toggle needed
  };

  return (
    <div className="mb-4 p-2 bg-white border border-gray-200 rounded-sm">
      <div className="flex items-center gap-4 flex-wrap">
        {calendarItems.map((calendar) => (
          <div 
            key={calendar.id}
            className={`flex items-center space-x-2 ${
              calendar.type === 'google' ? 'cursor-pointer hover:bg-gray-50 px-2 py-1 rounded' : ''
            }`}
            onClick={() => handleCalendarToggle(calendar.id, calendar.type)}
          >
            <div 
              className={`w-4 h-4 border-2 rounded-sm flex items-center justify-center ${
                calendar.selected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
              }`}
            >
              {calendar.selected && (
                <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <span className="text-sm text-gray-700">{calendar.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};