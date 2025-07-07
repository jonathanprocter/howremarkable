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
    <div className="mb-2 p-2 bg-yellow-50 border-2 border-yellow-400 rounded-lg shadow-sm" style={{ marginTop: '0', paddingTop: '8px' }}>
      {/* Appointment Type Legend */}
      <div className="mb-2 pb-2 border-b border-yellow-200">
        <h4 className="text-sm font-bold text-gray-800 mb-2 uppercase tracking-wide">📅 Calendar Legend</h4>
        <div className="flex items-center gap-6 flex-wrap text-sm">
          <div className="flex items-center space-x-3 bg-white px-3 py-2 rounded shadow-sm">
            <div className="w-4 h-4 bg-blue-50 border-2 border-blue-500 relative" style={{borderLeft: '6px solid #4285F4'}}>
              <div className="absolute inset-0 bg-blue-100 opacity-30"></div>
            </div>
            <span className="text-blue-700 font-semibold">SimplePractice (274 events)</span>
          </div>
          <div className="flex items-center space-x-3 bg-white px-3 py-2 rounded shadow-sm">
            <div className="w-4 h-4 bg-white border-2 border-green-500 border-dashed relative">
              <div className="absolute inset-1 border border-green-400 border-dashed"></div>
            </div>
            <span className="text-green-700 font-semibold">Google Calendar (29 events)</span>
          </div>
          <div className="flex items-center space-x-3 bg-white px-3 py-2 rounded shadow-sm">
            <div className="w-4 h-4 bg-yellow-500 border-2 border-yellow-600 relative">
              <div className="absolute inset-0 bg-yellow-400"></div>
            </div>
            <span className="text-yellow-700 font-semibold">US Holidays</span>
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