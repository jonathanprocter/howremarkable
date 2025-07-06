import { useState } from 'react';
import { useCalendar } from '../hooks/useCalendar';
import { MainLayout } from '../components/layout/MainLayout';
import { Sidebar } from '../components/sidebar/Sidebar';
import { Header } from '../components/common/Header';
import { WeeklyCalendarGrid } from '../components/calendar/WeeklyCalendarGrid';
import { DailyView } from '../components/calendar/DailyView';
import { CalendarEvent } from '../types/calendar';
import { useToast } from '@/hooks/use-toast';

export default function Planner() {
  const {
    state,
    setSelectedDate,
    setViewMode,
    goToToday,
    goToPreviousWeek,
    goToNextWeek,
    goToPreviousDay,
    goToNextDay,
    addEvent,
    updateEvent,
    updateDailyNote,
    getWeekRangeString,
    isCurrentWeek
  } = useCalendar();

  const { toast } = useToast();

  // Sample events for demonstration
  const [sampleEvents] = useState<CalendarEvent[]>([
    {
      id: '1',
      title: 'Dan v. Supervision',
      startTime: new Date(2025, 6, 7, 16, 0), // July 7, 2025, 4:00 PM
      endTime: new Date(2025, 6, 7, 17, 0),
      source: 'simplepractice',
      color: '#6495ED'
    },
    {
      id: '2',
      title: 'Ruben Spillers Appointment',
      startTime: new Date(2025, 6, 8, 16, 0), // July 8, 2025, 4:00 PM
      endTime: new Date(2025, 6, 8, 17, 0),
      source: 'simplepractice',
      color: '#6495ED'
    },
    {
      id: '3',
      title: 'Coffee with Nora',
      startTime: new Date(2025, 6, 9, 17, 30), // July 9, 2025, 5:30 PM
      endTime: new Date(2025, 6, 9, 18, 30),
      source: 'manual',
      color: '#4299e1'
    },
    {
      id: '4',
      title: 'Sarah Palladino Appointment',
      startTime: new Date(2025, 6, 10, 15, 0), // July 10, 2025, 3:00 PM
      endTime: new Date(2025, 6, 10, 16, 0),
      source: 'simplepractice',
      color: '#6495ED',
      notes: 'Regular therapy session.',
      actionItems: 'Follow up on homework exercises...'
    }
  ]);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setViewMode('daily');
  };

  const handleBackToWeek = () => {
    setViewMode('weekly');
  };

  const handleTimeSlotClick = (date: Date, time: string) => {
    // Handle time slot click for event creation
    console.log('Time slot clicked:', date, time);
  };

  const handleEventClick = (event: CalendarEvent) => {
    console.log('Event clicked:', event);
  };

  const handleConnectGoogle = () => {
    toast({
      title: "Google Calendar Integration",
      description: "Google Calendar connection feature coming soon!"
    });
  };

  const handleExportAction = (type: string) => {
    toast({
      title: "PDF Export",
      description: `${type} export feature coming soon!`
    });
  };

  const handleQuickAction = (action: string) => {
    if (action === 'today') {
      goToToday();
    } else {
      toast({
        title: "Quick Action",
        description: `${action} feature coming soon!`
      });
    }
  };

  const handleUpdateDailyNotes = (notes: string) => {
    const dateString = state.selectedDate.toISOString().split('T')[0];
    updateDailyNote(dateString, notes);
    toast({
      title: "Daily Notes",
      description: "Notes saved successfully!"
    });
  };

  const currentEvents = [...state.events, ...sampleEvents];
  const currentDateString = state.selectedDate.toISOString().split('T')[0];
  const currentDailyNotes = state.dailyNotes[currentDateString] || '';

  return (
    <MainLayout
      sidebar={
        <Sidebar
          state={state}
          onDateSelect={handleDateSelect}
          onGoToToday={() => handleQuickAction('today')}
          onGoToDate={() => handleQuickAction('go to date')}
          onRefreshEvents={() => handleQuickAction('refresh events')}
          onSyncNotes={() => handleQuickAction('sync notes')}
          onSelectAll={() => handleQuickAction('select all')}
          onDeselectAll={() => handleQuickAction('deselect all')}
          onExportCurrentView={() => handleExportAction('Current View')}
          onExportWeeklyPackage={() => handleExportAction('Weekly Package')}
          onExportDailyView={() => handleExportAction('Daily View')}
          onExportFullMonth={() => handleExportAction('Full Month')}
          onExportToGoogleDrive={(type) => handleExportAction(`Google Drive ${type}`)}
          onSaveNotes={handleUpdateDailyNotes}
        />
      }
    >
      <Header
        weekRangeString={getWeekRangeString()}
        isOnline={state.isOnline}
        isCurrentWeek={isCurrentWeek()}
        onConnectGoogle={handleConnectGoogle}
        onPreviousWeek={goToPreviousWeek}
        onToday={goToToday}
        onNextWeek={goToNextWeek}
      />

      {state.viewMode === 'weekly' ? (
        <WeeklyCalendarGrid
          week={state.currentWeek.days}
          events={currentEvents}
          onDayClick={handleDayClick}
          onTimeSlotClick={handleTimeSlotClick}
          onEventClick={handleEventClick}
        />
      ) : (
        <DailyView
          selectedDate={state.selectedDate}
          events={currentEvents}
          dailyNotes={currentDailyNotes}
          onPreviousDay={goToPreviousDay}
          onNextDay={goToNextDay}
          onBackToWeek={handleBackToWeek}
          onEventClick={handleEventClick}
          onUpdateEvent={updateEvent}
          onUpdateDailyNotes={handleUpdateDailyNotes}
        />
      )}
    </MainLayout>
  );
}
