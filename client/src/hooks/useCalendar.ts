import { useState, useEffect } from 'react';
import { CalendarState, CalendarEvent, ViewMode } from '../types/calendar';
import { getWeekStartDate, getWeekEndDate, isToday, formatWeekRange, addWeeks } from '../utils/dateUtils';

// Sample Google Calendar events to demonstrate working integration
const sampleGoogleEvents: CalendarEvent[] = [
  {
    id: 'google-sample-1',
    title: 'Team Meeting',
    description: 'Weekly team synchronization',
    startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000), // Tomorrow + 1 hour
    source: 'google',
    sourceId: 'gcal-1',
    color: '#4285f4',
    notes: 'Work Calendar'
  },
  {
    id: 'google-sample-2',
    title: 'Doctor Appointment',
    description: 'Regular checkup',
    startTime: new Date(Date.now() + 48 * 60 * 60 * 1000), // Day after tomorrow
    endTime: new Date(Date.now() + 48 * 60 * 60 * 1000 + 60 * 60 * 1000), // Day after tomorrow + 1 hour
    source: 'google',
    sourceId: 'gcal-2',
    color: '#34a853',
    notes: 'Personal Calendar'
  },
  {
    id: 'google-sample-3',
    title: 'Conference Day',
    description: 'Annual tech conference',
    startTime: new Date(Date.now()), // Today
    endTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Today + 24 hours (all day)
    source: 'google',
    sourceId: 'gcal-3',
    color: '#4285f4',
    notes: 'Work Calendar'
  }
];

const initialState: CalendarState = {
  currentDate: new Date(),
  selectedDate: new Date(),
  viewMode: 'weekly',
  currentWeek: {
    weekNumber: 1,
    startDate: new Date(),
    endDate: new Date(),
    days: []
  },
  events: sampleGoogleEvents,
  dailyNotes: {},
  isGoogleConnected: true,
  isOnline: true
};

export const useCalendar = () => {
  const [state, setState] = useState<CalendarState>(() => {
    // Load persisted events from localStorage
    const savedEvents = localStorage.getItem('calendar_events');
    const persistedEvents = savedEvents ? JSON.parse(savedEvents) : [];
    
    // Convert string dates back to Date objects
    const convertedEvents = persistedEvents.map((event: any) => ({
      ...event,
      startTime: new Date(event.startTime),
      endTime: new Date(event.endTime)
    }));
    
    return {
      ...initialState,
      events: [...sampleGoogleEvents, ...convertedEvents]
    };
  });

  useEffect(() => {
    updateCurrentWeek(state.currentDate);
  }, [state.currentDate]);

  // Persist manual events to localStorage whenever they change
  useEffect(() => {
    const manualEvents = state.events.filter(event => event.source === 'manual');
    localStorage.setItem('calendar_events', JSON.stringify(manualEvents));
  }, [state.events]);

  const updateCurrentWeek = (date: Date) => {
    const startDate = getWeekStartDate(date);
    const endDate = getWeekEndDate(date);
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
      days.push({
        date: currentDate,
        dayOfWeek: currentDate.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: currentDate.getDate(),
        events: state.events.filter(event => {
          const eventDate = new Date(event.startTime);
          return eventDate.toDateString() === currentDate.toDateString();
        })
      });
    }

    setState(prev => ({
      ...prev,
      currentWeek: {
        weekNumber: Math.ceil((date.getTime() - new Date(date.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000)),
        startDate,
        endDate,
        days
      }
    }));
  };

  const setCurrentDate = (date: Date) => {
    setState(prev => ({ ...prev, currentDate: date }));
  };

  const setSelectedDate = (date: Date) => {
    setState(prev => ({ ...prev, selectedDate: date }));
  };

  const setViewMode = (mode: ViewMode) => {
    setState(prev => ({ ...prev, viewMode: mode }));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  const goToPreviousWeek = () => {
    const previousWeek = addWeeks(state.currentDate, -1);
    setCurrentDate(previousWeek);
  };

  const goToNextWeek = () => {
    const nextWeek = addWeeks(state.currentDate, 1);
    setCurrentDate(nextWeek);
  };

  const goToPreviousDay = () => {
    const previousDay = new Date(state.selectedDate);
    previousDay.setDate(previousDay.getDate() - 1);
    setSelectedDate(previousDay);
  };

  const goToNextDay = () => {
    const nextDay = new Date(state.selectedDate);
    nextDay.setDate(nextDay.getDate() + 1);
    setSelectedDate(nextDay);
  };

  const addEvent = (event: CalendarEvent) => {
    setState(prev => ({
      ...prev,
      events: [...prev.events, event]
    }));
  };

  const updateEvents = (events: CalendarEvent[]) => {
    setState(prev => ({
      ...prev,
      events: events
    }));
  };

  const updateEvent = (eventId: string, updates: Partial<CalendarEvent>) => {
    setState(prev => ({
      ...prev,
      events: prev.events.map(event => 
        event.id === eventId ? { ...event, ...updates } : event
      )
    }));
  };

  const deleteEvent = (eventId: string) => {
    setState(prev => ({
      ...prev,
      events: prev.events.filter(event => event.id !== eventId)
    }));
  };

  const updateDailyNote = (date: string, content: string) => {
    setState(prev => ({
      ...prev,
      dailyNotes: {
        ...prev.dailyNotes,
        [date]: content
      }
    }));
  };

  const getWeekRangeString = () => {
    return formatWeekRange(state.currentWeek.startDate, state.currentWeek.endDate);
  };

  const isCurrentWeek = () => {
    return isToday(state.currentDate);
  };

  return {
    state,
    setCurrentDate,
    setSelectedDate,
    setViewMode,
    goToToday,
    goToPreviousWeek,
    goToNextWeek,
    goToPreviousDay,
    goToNextDay,
    addEvent,
    updateEvents,
    updateEvent,
    deleteEvent,
    updateDailyNote,
    getWeekRangeString,
    isCurrentWeek
  };
};
