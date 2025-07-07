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
    <div className="weekly-planner-view">
      <WeeklyCalendarGrid
        week={weekData}
        events={events}
        onTimeSlotClick={onTimeSlotClick}
        onEventClick={onEventClick}
      />
    </div>
  );
};