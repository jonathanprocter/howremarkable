import React from 'react';
import { CalendarEvent, CalendarDay } from '../../types/calendar';
import { WeeklyCalendarGrid } from './WeeklyCalendarGrid';

interface WeeklyPlannerViewProps {
  week: CalendarDay[];
  events: CalendarEvent[];
  onDayClick: (date: Date) => void;
  onTimeSlotClick: (date: Date, time: string) => void;
  onEventClick: (event: CalendarEvent) => void;
  onEventMove?: (eventId: string, newStartTime: Date, newEndTime: Date) => void;
}

export const WeeklyPlannerView = ({
  week,
  events,
  onDayClick,
  onTimeSlotClick,
  onEventClick,
  onEventMove
}: WeeklyPlannerViewProps) => {
  // Transform week data for the grid component
  const weekData = week.map(day => ({
    date: day.date,
    dayOfWeek: day.dayOfWeek,
    dayNumber: day.dayNumber
  }));

  // Calculate statistics
  const totalEvents = events.length;
  const simplePracticeEvents = events.filter(e => 
    e.title.includes('Appointment') || e.source === 'simplepractice'
  ).length;
  const googleEvents = events.filter(e => e.source === 'google').length;
  const totalHours = events.reduce((sum, event) => {
    const duration = (new Date(event.endTime).getTime() - new Date(event.startTime).getTime()) / (1000 * 60 * 60);
    return sum + duration;
  }, 0);

  return (
    <div className="weekly-planner-container">
      {/* Header Section */}
      <div className="planner-header bg-white border-b-2 border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold text-gray-800">
            Weekly Planner
          </div>
          <div className="text-lg text-gray-600">
            {week[0]?.date.toLocaleDateString()} - {week[6]?.date.toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Legend Section */}
      <div className="legend-section bg-gray-50 border-b border-gray-200 p-4">
        <div className="flex items-center justify-start gap-8 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-6 h-5 bg-blue-100 border-2 border-blue-500 rounded"></div>
            <span className="text-blue-700 font-bold text-sm">
              SimplePractice ({simplePracticeEvents} events)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-5 bg-green-100 border-2 border-dashed border-green-500 rounded"></div>
            <span className="text-green-700 font-bold text-sm">
              Google Calendar ({googleEvents} events)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-5 bg-yellow-100 border-2 border-yellow-500 rounded"></div>
            <span className="text-yellow-700 font-bold text-sm">US Holidays</span>
          </div>
          <div className="text-gray-700 font-bold text-sm">
            Total: {totalEvents} events • {Math.round(totalHours)} hours
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="calendar-section bg-white">
        <WeeklyCalendarGrid
          week={weekData}
          events={events}
          onTimeSlotClick={onTimeSlotClick}
          onEventClick={onEventClick}
        />
      </div>
    </div>
  );
};