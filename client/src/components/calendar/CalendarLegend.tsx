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
  // Define the three main calendar types to match the screenshot
  const calendarTypes = [
    { 
      key: 'simplepractice', 
      label: 'SimplePractice', 
      color: '#4F46E5',
      selected: true // Always selected for SimplePractice events
    },
    { 
      key: 'google', 
      label: 'Google Calendar', 
      color: '#10B981',
      selected: calendars.some(cal => selectedCalendars.has(cal.id))
    },
    { 
      key: 'personal', 
      label: 'Personal', 
      color: '#6B7280',
      selected: true // Always selected for manual events
    }
  ];

  const handleTypeToggle = (type: string) => {
    if (type === 'google') {
      // Toggle all Google calendars
      const googleCalIds = calendars.map(cal => cal.id);
      const hasAnySelected = googleCalIds.some(id => selectedCalendars.has(id));
      
      if (hasAnySelected) {
        // Deselect all Google calendars
        googleCalIds.forEach(id => onCalendarToggle?.(id));
      } else {
        // Select all Google calendars
        googleCalIds.forEach(id => {
          if (!selectedCalendars.has(id)) {
            onCalendarToggle?.(id);
          }
        });
      }
    }
    // SimplePractice and Personal are always on, so no toggle needed
  };

  return (
    <div className="mb-4 p-2 bg-white border border-gray-200 rounded-sm">
      <div className="flex items-center gap-6">
        {calendarTypes.map((type) => (
          <div 
            key={type.key}
            className={`flex items-center space-x-2 cursor-pointer ${
              type.key === 'google' ? 'hover:bg-gray-50 px-2 py-1 rounded' : ''
            }`}
            onClick={() => type.key === 'google' ? handleTypeToggle(type.key) : undefined}
          >
            <div 
              className={`w-4 h-4 border-2 rounded-sm flex items-center justify-center ${
                type.selected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
              }`}
            >
              {type.selected && (
                <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <span className="text-sm text-gray-700">{type.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};