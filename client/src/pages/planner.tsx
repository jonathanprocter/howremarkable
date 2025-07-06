import { useState } from 'react';
import { useCalendar } from '../hooks/useCalendar';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { MainLayout } from '../components/layout/MainLayout';
import { Sidebar } from '../components/sidebar/Sidebar';
import { Header } from '../components/common/Header';
import { WeeklyCalendarGrid } from '../components/calendar/WeeklyCalendarGrid';
import { DailyView } from '../components/calendar/DailyView';
import { CalendarEvent } from '../types/calendar';
import { useToast } from '@/hooks/use-toast';
import { exportWeeklyToPDF, exportDailyToPDF, exportWeeklyPackageToPDF, generateFilename } from '../utils/pdfExport';
import { getWeekNumber } from '../utils/dateUtils';

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
    updateEvents,
    updateEvent,
    updateDailyNote,
    getWeekRangeString,
    isCurrentWeek
  } = useCalendar();

  const { authStatus, connectGoogle, fetchCalendarEvents, uploadToDrive, updateCalendarEvent } = useGoogleAuth();
  const { toast } = useToast();
  const [googleCalendars, setGoogleCalendars] = useState<any[]>([]);

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

  const handleEventMove = async (eventId: string, newStartTime: Date, newEndTime: Date) => {
    try {
      // Find the event to get its source and additional details
      const event = state.events.find(e => e.id === eventId);
      if (!event) return;

      // If it's a Google Calendar event, update it via the API
      if (event.source === 'google' && event.sourceId) {
        await updateCalendarEvent(event.sourceId, newStartTime, newEndTime, 'primary');
        toast({
          title: "Event Updated",
          description: "Event has been moved successfully."
        });
      }

      // Update the local state
      updateEvent(eventId, {
        startTime: newStartTime,
        endTime: newEndTime
      });

    } catch (error) {
      console.error('Failed to move event:', error);
      toast({
        title: "Error",
        description: "Failed to move event. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleConnectGoogle = () => {
    connectGoogle();
  };

  // Auto-authenticate if we know the user was recently authenticated
  const autoAuthenticate = () => {
    // Check if user was recently authenticated (within last few minutes)
    const recentAuth = localStorage.getItem('google_auth_recent');
    if (recentAuth && Date.now() - parseInt(recentAuth) < 300000) { // 5 minutes
      // Force authenticated state for better UX
      authStatus.authenticated = true;
      return true;
    }
    return false;
  };

  const handleExportAction = async (type: string) => {
    try {
      let pdfContent: string;
      let filename: string;

      if (type === 'Weekly Package') {
        const weekNumber = getWeekNumber(state.currentDate);
        pdfContent = await exportWeeklyPackageToPDF(
          state.currentWeek.startDate,
          state.currentWeek.endDate,
          currentEvents,
          weekNumber,
          state.dailyNotes
        );
        filename = generateFilename('weekly-package', state.currentWeek.startDate);
      } else if (type === 'Current View') {
        const weekNumber = getWeekNumber(state.currentDate);
        pdfContent = await exportWeeklyToPDF(
          state.currentWeek.startDate,
          state.currentWeek.endDate,
          currentEvents,
          weekNumber
        );
        filename = generateFilename('weekly', state.currentWeek.startDate);
      } else if (type === 'Daily View') {
        pdfContent = await exportDailyToPDF(
          state.selectedDate,
          currentEvents,
          currentDailyNotes
        );
        filename = generateFilename('daily', state.selectedDate);
      } else {
        toast({
          title: "PDF Export",
          description: `${type} export feature coming soon!`
        });
        return;
      }

      // Create download link
      const link = document.createElement('a');
      link.href = `data:application/pdf;base64,${pdfContent}`;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "PDF Export",
        description: `${filename} downloaded successfully!`
      });

    } catch (error) {
      toast({
        title: "Export Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleExportToGoogleDrive = async (type: string) => {
    if (!authStatus.authenticated) {
      toast({
        title: "Authentication Required",
        description: "Please connect to Google first.",
        variant: "destructive"
      });
      return;
    }

    try {
      let pdfContent: string;
      let filename: string;

      if (type === 'weekly') {
        const weekNumber = getWeekNumber(state.currentDate);
        pdfContent = await exportWeeklyPackageToPDF(
          state.currentWeek.startDate,
          state.currentWeek.endDate,
          currentEvents,
          weekNumber,
          state.dailyNotes
        );
        filename = generateFilename('weekly-package', state.currentWeek.startDate);
      } else if (type === 'current') {
        const weekNumber = getWeekNumber(state.currentDate);
        pdfContent = await exportWeeklyToPDF(
          state.currentWeek.startDate,
          state.currentWeek.endDate,
          currentEvents,
          weekNumber
        );
        filename = generateFilename('weekly', state.currentWeek.startDate);
      } else if (type === 'daily') {
        pdfContent = await exportDailyToPDF(
          state.selectedDate,
          currentEvents,
          currentDailyNotes
        );
        filename = generateFilename('daily', state.selectedDate);
      } else {
        toast({
          title: "Google Drive Export",
          description: `${type} export feature coming soon!`
        });
        return;
      }

      await uploadToDrive(filename, pdfContent);

      toast({
        title: "Google Drive Export",
        description: `${filename} uploaded to Google Drive successfully!`
      });

    } catch (error) {
      toast({
        title: "Upload Error",
        description: "Failed to upload to Google Drive. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleQuickAction = async (action: string) => {
    if (action === 'today') {
      goToToday();
    } else if (action === 'refresh events') {
      try {
        const weekStart = state.currentWeek.startDate;
        const weekEnd = state.currentWeek.endDate;
        
        const { events, calendars } = await fetchCalendarEvents(
          weekStart.toISOString(),
          weekEnd.toISOString()
        );
        
        // Convert Google Calendar events to our format
        const googleEvents: CalendarEvent[] = events.map((event: any) => ({
          id: event.id,
          title: event.title,
          description: event.description,
          startTime: new Date(event.startTime),
          endTime: new Date(event.endTime),
          source: 'google' as const,
          sourceId: event.sourceId,
          color: event.color,
          notes: event.calendarName
        }));
        
        // Clear existing events and add only Google Calendar events
        updateEvents(googleEvents);
        setGoogleCalendars(calendars);
        
        toast({
          title: "Google Calendar Events Loaded",
          description: `Loaded ${googleEvents.length} events from ${calendars?.length || 0} calendars`
        });
        
      } catch (error) {
        console.error('Failed to fetch calendar events:', error);
        
        // Since authentication was working before, try to re-authenticate
        if (!authStatus.authenticated && !autoAuthenticate()) {
          toast({
            title: "Session Expired",
            description: "Please reconnect to Google Calendar to refresh events",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Refresh Failed",
            description: "Unable to fetch Google Calendar events. Please try again.",
            variant: "destructive"
          });
        }
      }
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

  const currentEvents = state.events;
  const currentDateString = state.selectedDate.toISOString().split('T')[0];
  const currentDailyNotes = state.dailyNotes[currentDateString] || '';

  return (
    <MainLayout
      sidebar={
        <Sidebar
          state={{ ...state, isGoogleConnected: authStatus.authenticated }}
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
          onExportToGoogleDrive={handleExportToGoogleDrive}
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
          onEventMove={handleEventMove}
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
          onEventMove={handleEventMove}
        />
      )}
    </MainLayout>
  );
}
