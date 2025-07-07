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
  // Only show Google calendar names - no SimplePractice or Personal categories
  const calendarItems = calendars.map(cal => ({
    id: cal.id,
    name: cal.name,
    color: cal.color || '#10B981',
    selected: selectedCalendars.has(cal.id),
    type: 'google'
  }));

  const handleCalendarToggle = (calendarId: string, type: string) => {
    if (type === 'google') {
      onCalendarToggle?.(calendarId);
    }
    // SimplePractice and Personal are always on, so no toggle needed
  };

  return (
    <div className="mb-4 p-2 bg-white border border-gray-200 rounded-sm">
      {/* Appointment Type Legend */}
      <div className="mb-3 pb-2 border-b border-gray-100">
        <h4 className="text-xs font-semibold text-gray-700 mb-2">Appointment Types</h4>
        <div className="flex items-center gap-4 flex-wrap text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-50 border-2 border-blue-500" style={{borderLeft: '8px solid #6495ED'}}></div>
            <span className="text-blue-700 font-medium">SimplePractice</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gray-50 border-2 border-gray-400 border-dashed" style={{borderLeft: '4px solid #10b981'}}></div>
            <span className="text-gray-600 font-medium">Google Calendar</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-50 border-2 border-yellow-500" style={{borderStyle: 'double'}}></div>
            <span className="text-yellow-700 font-medium">Personal</span>
          </div>
        </div>
      </div>
      
      {/* Google Calendar Selection */}
      <div>
        <h4 className="text-xs font-semibold text-gray-700 mb-2">Google Calendars</h4>
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
    </div>
  );
};