import { useState, useEffect } from 'react';
import { useCalendar } from '../hooks/useCalendar';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { MainLayout } from '../components/layout/MainLayout';
import { Sidebar } from '../components/sidebar/Sidebar';
import { Header } from '../components/common/Header';
import { WeeklyPlannerView } from '../components/calendar/WeeklyPlannerView';
import { DailyView } from '../components/calendar/DailyView';
import { CalendarLegend } from '../components/calendar/CalendarLegend';
import { CalendarEvent } from '../types/calendar';
import { useToast } from '@/hooks/use-toast';
// Temporarily disabled problematic imports
// import { exportWeeklyToPDF, exportDailyToPDF, exportWeeklyPackageToPDF, generateFilename } from '../utils/pdfExportNew';
// import { 
//   exportWeeklyRemarkableExact,
//   generateRemarkableFilename 
// } from '../utils/remarkablePDFExactMatch';
// import { exportWeeklyRemarkable } from '../utils/simplePDFExport';
// import { exportTemplateMatchPDF } from '../utils/templateMatchPDF';
import { exportHTMLTemplatePDF } from '../utils/htmlTemplatePDF';
import { exportWeeklyCalendar } from '../utils/weeklyCalendarExport';

// Temporary stub functions until PDF exports are fixed
const exportWeeklyPackageToPDF = async (...args: any[]): Promise<string> => { 
  console.log('Weekly package export temporarily disabled'); 
  return Promise.resolve(''); 
};
const exportDailyToPDF = async (...args: any[]): Promise<string> => { 
  console.log('Daily export temporarily disabled'); 
  return Promise.resolve(''); 
};
const exportWeeklyToPDF = async (...args: any[]): Promise<string> => { 
  console.log('Weekly export temporarily disabled'); 
  return Promise.resolve(''); 
};
const exportWeeklyRemarkableExact = async (...args: any[]): Promise<void> => { 
  console.log('Remarkable export temporarily disabled'); 
  return Promise.resolve(); 
};
const generateFilename = (...args: any[]): string => 'export.pdf';
import { getWeekNumber } from '../utils/dateUtils';
import { initializeRemarkableOptimizations } from '../utils/remarkableDisplayOptimizer';

export default function Planner() {
  const {
    state,
    setSelectedDate,
    setViewMode,
    setCurrentDate,
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
  const [selectedCalendars, setSelectedCalendars] = useState<Set<string>>(new Set(['0np7sib5u30o7oc297j5pb259g'])); // Default to SimplePractice calendar selected

  // Initialize reMarkable Pro optimizations on component mount
  useEffect(() => {
    initializeRemarkableOptimizations();
  }, []);

  // Load events from database on component mount
  useEffect(() => {
    const loadDatabaseEvents = async () => {
      try {
        const response = await fetch('/api/events/1'); // TODO: Use actual user ID
        if (response.ok) {
          const dbEvents = await response.json();
          const convertedEvents: CalendarEvent[] = dbEvents.map((event: any) => {
            // Database times are already in correct timezone, just parse them directly
            const startTime = new Date(event.startTime);
            const endTime = new Date(event.endTime);
            
            return {
              id: event.id,
              title: event.title,
              description: event.description || '',
              startTime,
              endTime,
              source: event.source || 'manual',
              sourceId: event.sourceId,
              color: event.color || '#999',
              notes: event.notes || '',
              actionItems: event.actionItems || '',
              calendarId: event.calendarId
            };
          });
          
          updateEvents(convertedEvents);
          
          // Auto-select calendars from database events
          const googleEvents = convertedEvents.filter(event => event.source === 'google' && event.calendarId);
          const calendarIds = Array.from(new Set(googleEvents.map(event => event.calendarId))).filter(id => id) as string[];
          
          if (calendarIds.length > 0) {
            setSelectedCalendars(new Set(calendarIds));
            
            // Create calendar objects for the legend
            const calendarsForLegend = calendarIds.map(calendarId => {
              if (calendarId === 'en.usa#holiday@group.v.calendar.google.com') {
                return { id: calendarId, name: 'Holidays in United States', color: '#4285F4' };
              } else if (calendarId === 'jonathan.procter@gmail.com') {
                return { id: calendarId, name: 'Google', color: '#34A853' };
              } else if (calendarId === '79dfcb90ce59b1b0345b24f5c8d342bd308eac9521d063a684a8bbd377f2b822@group.calendar.google.com') {
                return { id: calendarId, name: 'Simple Practice', color: '#EA4335' };
              } else if (calendarId === 'c2ffec13aa77af8e71cac14a327928e34da57bddaadf18c4e0f669827e1454ff@group.calendar.google.com') {
                return { id: calendarId, name: 'TrevorAI', color: '#FBBC04' };
              } else {
                return { id: calendarId, name: 'Unknown Calendar', color: '#9AA0A6' };
              }
            });
            setGoogleCalendars(calendarsForLegend);
          }
        } else {
          console.warn('Failed to load events from database - response not ok:', response.status);
        }
      } catch (error) {
        console.error('Failed to load events from database:', error);
        toast({
          title: "Error Loading Events",
          description: "Could not load calendar events. Please refresh the page.",
          variant: "destructive"
        });
      }
    };

    // Call the async function and catch any unhandled promise rejections
    loadDatabaseEvents().catch(error => {
      console.error('Unhandled error in loadDatabaseEvents:', error);
    });
  }, []); // Run once on mount

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

      // Update the local state first
      updateEvent(eventId, {
        startTime: newStartTime,
        endTime: newEndTime
      });

      // If it's a Google Calendar event and authenticated, try to update via API
      if (event.source === 'google' && event.sourceId && authStatus.authenticated) {
        try {
          await updateCalendarEvent(event.sourceId, newStartTime, newEndTime, 'primary');
          toast({
            title: "Event Updated",
            description: "Event moved and synced with Google Calendar"
          });
        } catch (apiError) {
          console.error('Google Calendar API update failed:', apiError);
          toast({
            title: "Moved Locally",
            description: "Event moved but couldn't sync with Google Calendar",
            variant: "destructive"
          });
        }
      } else if (event.source === 'google') {
        toast({
          title: "Event Moved",
          description: "Event moved locally (Google Calendar sync requires authentication)"
        });
      } else {
        toast({
          title: "Event Moved",
          description: "Event has been rescheduled"
        });
      }

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
      // Note: We should not directly mutate authStatus here
      // The auth state should be managed through proper hooks
      return true;
    }
    return false;
  };

  const handleExportAction = async (type: string = 'Current View') => {
    try {
      console.log('Starting PDF export for type:', type);
      console.log('Current events count:', currentEvents.length);
      console.log('Current date:', state.currentDate);
      let pdfContent: string;
      let filename: string;

      // Standard PDF exports
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
        try {
          await exportWeeklyCalendar(
            state.currentWeek.startDate,
            state.currentWeek.endDate,
            currentEvents
          );
          
          toast({
            title: "PDF Export",
            description: "Weekly calendar PDF downloaded successfully!"
          });
          return; // exportWeeklyCalendar handles the download
        } catch (calendarError) {
          console.error('Weekly calendar export error:', calendarError);
          throw calendarError;
        }
      } else if (type === 'Daily View') {
        pdfContent = await exportDailyToPDF(
          state.selectedDate,
          currentEvents,
          currentDailyNotes
        );
        filename = generateFilename('daily', state.selectedDate);
      }
      // reMarkable Pro optimized exports
      else if (type === 'reMarkable Weekly') {
        try {
          await exportWeeklyRemarkableExact(
            state.currentWeek.startDate,
            state.currentWeek.endDate,
            currentEvents
          );
          return; // exportWeeklyRemarkableExact handles the download
        } catch (remarkableError) {
          console.error('reMarkable export error:', remarkableError);
          throw remarkableError;
        }
      } else if (type === 'reMarkable Daily') {
        try {
          await exportWeeklyRemarkableExact(
            state.selectedDate,
            state.selectedDate,
            currentEvents
          );
          return; // exportWeeklyRemarkableExact handles the download
        } catch (remarkableError) {
          console.error('reMarkable export error:', remarkableError);
          throw remarkableError;
        }
      } else if (type === 'reMarkable Monthly') {
        try {
          await exportWeeklyRemarkableExact(
            state.currentWeek.startDate,
            state.currentWeek.endDate,
            currentEvents
          );
          return; // exportWeeklyRemarkableExact handles the download
        } catch (remarkableError) {
          console.error('reMarkable export error:', remarkableError);
          throw remarkableError;
        }
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
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "PDF Export",
        description: `${filename} downloaded successfully!`
      });

    } catch (error) {
      console.error('PDF Export Error:', error);
      toast({
        title: "Export Error",
        description: `Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`,
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

  // Enhanced function to sync all event notes to database
  const syncEventToDatabase = async (eventId: string, updates: Partial<CalendarEvent>) => {
    try {
      const event = state.events.find(e => e.id === eventId);
      if (!event) return;

      let apiEndpoint = '';
      let payload = updates;

      if (event.source === 'manual') {
        // Manual events: sync directly to database
        const numericId = parseInt(eventId.replace('manual-', ''));
        if (!isNaN(numericId)) {
          apiEndpoint = `/api/events/${numericId}`;
        }
      } else {
        // For Google Calendar and SimplePractice events: create/update database record for notes
        // Store notes as a separate record linked to the external event
        apiEndpoint = '/api/events';
        payload = {
          title: event.title,
          description: event.description || '',
          startTime: event.startTime,
          endTime: event.endTime,
          source: event.source,
          sourceId: eventId,
          notes: updates.notes || event.notes || '',
          actionItems: updates.actionItems || event.actionItems || '',
          color: event.color
        };
      }

      if (apiEndpoint) {
        const method = event.source === 'manual' ? 'PUT' : 'POST';
        const response = await fetch(apiEndpoint, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        console.log('Event notes synced successfully to database');
      }
    } catch (error) {
      console.error('Failed to sync event to database:', error);
      toast({
        title: "Sync Warning",
        description: "Notes saved locally but may not be persistent. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleQuickAction = async (action: string) => {
    if (action === 'today') {
      goToToday();
    } else if (action === 'sync notes') {
      try {
        // Sync all manual event notes to database
        const manualEvents = state.events.filter(event => event.source === 'manual');
        let syncedCount = 0;
        
        for (const event of manualEvents) {
          try {
            await syncEventToDatabase(event.id, {
              notes: event.notes,
              actionItems: event.actionItems
            });
            syncedCount++;
          } catch (error) {
            console.error(`Failed to sync event ${event.id}:`, error);
          }
        }
        
        toast({
          title: "Notes Synced",
          description: `Successfully synced ${syncedCount} events to database`
        });
      } catch (error) {
        toast({
          title: "Sync Error",
          description: "Failed to sync notes to database",
          variant: "destructive"
        });
      }
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
          sourceId: event.sourceId || event.id, // Google event ID
          color: event.color,
          notes: event.calendarName,
          calendarId: event.calendarId // Calendar ID for filtering
        }));
        
        // Don't override existing events if they already exist in the database
        // Just update calendars and selection - events are already loaded from database
        
        // Only update if no events are currently loaded
        if (state.events.length === 0) {
          updateEvents(googleEvents);
        }
        setGoogleCalendars(calendars);
        
        // Only update calendar selection if none are currently selected
        if (selectedCalendars.size === 0) {
          const calendarIds = calendars?.map((cal: { id: string }) => cal.id) || [];
          const newSelectedCalendars = new Set<string>(calendarIds);
          setSelectedCalendars(newSelectedCalendars);
        }
        
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
    } else if (action === 'select all') {
      const calendarIds = googleCalendars.map(cal => cal.id);
      setSelectedCalendars(new Set(calendarIds));
      toast({
        title: "Calendar Selection",
        description: "All calendars selected"
      });
    } else if (action === 'deselect all') {
      setSelectedCalendars(new Set());
      toast({
        title: "Calendar Selection", 
        description: "All calendars deselected"
      });
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

  // Enhanced event update handler with auto-sync to database
  const handleUpdateEventWithSync = async (eventId: string, updates: Partial<CalendarEvent>) => {
    // Update local state first
    updateEvent(eventId, updates);
    
    // Auto-sync to database if it's a manual event and contains notes/actionItems
    if (updates.notes !== undefined || updates.actionItems !== undefined) {
      await syncEventToDatabase(eventId, updates);
    }
  };

  const handleCreateEvent = async (startTime: Date, endTime: Date) => {
    const newEvent: CalendarEvent = {
      id: `temp-${Date.now()}`, // Temporary ID until saved to database
      title: 'New Appointment',
      description: '',
      startTime,
      endTime,
      source: 'manual',
      color: '#999',
      notes: ''
    };

    // Add to local state immediately for responsiveness
    addEvent(newEvent);
    
    // Create in database and update with real ID
    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 1, // TODO: Use actual user ID from authentication
          title: newEvent.title,
          description: newEvent.description || '',
          startTime: newEvent.startTime.toISOString(),
          endTime: newEvent.endTime.toISOString(),
          source: newEvent.source,
          color: newEvent.color,
          notes: newEvent.notes || ''
        })
      });
      
      if (response.ok) {
        const savedEvent = await response.json();
        // Update the event with the real database ID
        updateEvent(newEvent.id, { id: `db-${savedEvent.id}` });
        
        toast({
          title: "Event Created",
          description: "New appointment added and saved to database."
        });
      } else {
        throw new Error('Failed to save to database');
      }
    } catch (error) {
      console.error('Failed to create event in database:', error);
      toast({
        title: "Event Created",
        description: "New appointment added locally. Click 'Sync Notes' to save to database.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteEvent = (eventId: string) => {
    // Remove from state
    const updatedEvents = state.events.filter(event => event.id !== eventId);
    updateEvents(updatedEvents);
    
    toast({
      title: "Event Deleted",
      description: "Appointment has been removed."
    });
  };

  const handleCalendarToggle = (calendarId: string) => {
    const newSelected = new Set(selectedCalendars);
    if (newSelected.has(calendarId)) {
      newSelected.delete(calendarId);
    } else {
      newSelected.add(calendarId);
    }
    setSelectedCalendars(newSelected);
  };

  // Filter events based on selected calendars
  const currentEvents = state.events.filter(event => {
    if (event.source === 'google') {
      // Use calendarId for Google Calendar events (not sourceId which is the event ID)
      const calendarId = (event as any).calendarId || event.sourceId;
      const isSelected = selectedCalendars.has(calendarId);
      return isSelected;
    }
    // Always show manual and SimplePractice events since there are no toggles for them
    return true;
  });


  
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

      <CalendarLegend
        calendars={googleCalendars}
        selectedCalendars={selectedCalendars}
        onCalendarToggle={handleCalendarToggle}
      />
      
      {state.viewMode === 'weekly' ? (
        <WeeklyPlannerView
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
          onUpdateEvent={handleUpdateEventWithSync}
          onUpdateDailyNotes={handleUpdateDailyNotes}
          onEventMove={handleEventMove}
          onCreateEvent={handleCreateEvent}
          onDeleteEvent={handleDeleteEvent}
        />
      )}
    </MainLayout>
  );
}
