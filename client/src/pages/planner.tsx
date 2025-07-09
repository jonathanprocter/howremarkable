import { useState, useEffect } from 'react';
import { useCalendar } from '../hooks/useCalendar';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { MainLayout } from '../components/layout/MainLayout';
import { Sidebar } from '../components/sidebar/Sidebar';
import { Header } from '../components/common/Header';
import { WeeklyPlannerView } from '../components/calendar/WeeklyPlannerView';
import { WeeklyCalendarGrid } from '../components/calendar/WeeklyCalendarGrid';
import { DailyView } from '../components/calendar/DailyView';
import { CalendarLegend } from '../components/calendar/CalendarLegend';
import { CalendarEvent } from '../types/calendar';
import { useToast } from '@/hooks/use-toast';
import { exportHTMLTemplatePDF } from '../utils/htmlTemplatePDF';
import { exportWeeklyCalendarHTML } from '../utils/htmlWeeklyExport';
import { exportExactGridPDF } from '../utils/exactGridPDFExport';
import { generateCompleteExportData, exportToText, exportToJSON, exportToCSV, testExportData } from '../utils/completePDFExport';

// Import the daily PDF export functions
import { exportDailyToPDF } from '../utils/dailyPDFExport';
import { exportExactDailyPDF } from '../utils/exactDailyPDFExport';



// Temporary stub functions for other exports until they're fixed
const exportWeeklyPackageToPDF = async (...args: any[]): Promise<string> => { 
  console.log('Weekly package export temporarily disabled'); 
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
const generateFilename = (type: string, date: Date): string => {
  const dateStr = date.toISOString().split('T')[0];
  return `${type}-${dateStr}.pdf`;
};
import { getWeekNumber } from '../utils/dateUtils';
import { initializeRemarkableOptimizations } from '../utils/remarkableDisplayOptimizer';
import { simpleNavigationFix } from '../utils/simpleNavigationFix';

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

  // Initialize reMarkable Pro optimizations and simple navigation fix on component mount
  useEffect(() => {
    initializeRemarkableOptimizations();
    // Run simple navigation fix after component mounts
    setTimeout(simpleNavigationFix, 500);
  }, []);

  // Load events from database on component mount
  useEffect(() => {
    const loadDatabaseEvents = async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      try {
        const response = await fetch('/api/events/1', { // TODO: Use actual user ID
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
          },
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const dbEvents = await response.json();
        
        if (!Array.isArray(dbEvents)) {
          throw new Error('Invalid response format: expected array of events');
        }

        const convertedEvents: CalendarEvent[] = dbEvents.map((event: any) => {
          // Validate required fields
          if (!event.id || !event.title || !event.startTime || !event.endTime) {
            throw new Error(`Invalid event data: missing required fields for event ${event.id}`);
          }

          // Database times are already in correct timezone, just parse them directly
          const startTime = new Date(event.startTime);
          const endTime = new Date(event.endTime);

          // Validate dates
          if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
            throw new Error(`Invalid date format for event ${event.id}`);
          }

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

        console.log(`Successfully loaded ${convertedEvents.length} events from database`);
      } catch (error) {
        clearTimeout(timeoutId);
        
        if (error.name === 'AbortError') {
          console.error('Database event loading timed out');
          toast({
            title: "Loading Timeout",
            description: "Event loading took too long. Please check your connection and try again.",
            variant: "destructive"
          });
        } else {
          console.error('Failed to load events from database:', error);
          toast({
            title: "Error Loading Events",
            description: error instanceof Error ? error.message : "Could not load calendar events. Please refresh the page.",
            variant: "destructive"
          });
        }
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
    console.log('🚀 EXPORT BUTTON CLICKED! Type:', type);
    try {
      console.log('=== STARTING EXPORT ===');
      console.log('Export type:', type);
      console.log('Current view mode:', state.viewMode);
      console.log('Current events count:', currentEvents.length);
      console.log('Selected date:', state.selectedDate);
      console.log('Current week start:', state.currentWeek.startDate);
      console.log('Current week end:', state.currentWeek.endDate);

      // First, let's test the data to see what we're working with
      console.log('=== DEBUGGING CURRENT EVENTS ===');
      currentEvents.forEach((event, index) => {
        console.log(`Event ${index + 1}:`, {
          id: event.id,
          title: event.title,
          startTime: event.startTime,
          endTime: event.endTime,
          source: event.source
        });
      });

      // Generate complete export data
      const selectedDateForExport = state.viewMode === 'daily' ? state.selectedDate : state.currentDate;
      const currentDateString = selectedDateForExport.toISOString().split('T')[0];
      const dailyNotes = state.dailyNotes[currentDateString] || '';

      console.log('=== EXPORT DATA GENERATION ===');
      console.log('Selected date for export:', selectedDateForExport.toDateString());
      console.log('Current events being passed to generateCompleteExportData:', currentEvents.length);
      console.log('Daily notes:', dailyNotes);

      const exportData = generateCompleteExportData(
        selectedDateForExport,
        currentEvents,
        dailyNotes
      );

      console.log('Generated export data:', exportData);

      // For daily exports, allow proceeding even with no appointments
      if (exportData.appointments.length === 0 && type !== 'Daily View' && type !== 'reMarkable Daily' && type !== 'Current View') {
        toast({
          title: "No Appointments",
          description: `No appointments found for ${exportData.date}. Check your calendar filters.`,
          variant: "destructive"
        });
        return;
      }

      if (exportData.appointments.length === 0) {
        console.log('WARNING: No appointments found, but proceeding with daily export anyway');
      }

      // Export based on type
      let fileContent: string;
      let fileName: string;
      let mimeType: string;

      console.log('=== EXPORT TYPE DEBUG ===');
      console.log('Export type received:', JSON.stringify(type));
      console.log('Type length:', type.length);
      console.log('Type === "Daily View":', type === 'Daily View');

      switch (type) {
        case 'Current View':
          // For current view, use the appropriate export based on view mode
          if (state.viewMode === 'daily') {
            // Export daily view as PDF
            try {
              console.log('=== BEFORE DAILY PDF EXPORT ===');
              console.log('Selected date:', selectedDateForExport.toDateString());
              console.log('Current events count:', currentEvents.length);
              
              // Filter events for debugging
              const dayEvents = currentEvents.filter(event => {
                const eventDate = new Date(event.startTime);
                return eventDate.getFullYear() === selectedDateForExport.getFullYear() &&
                       eventDate.getMonth() === selectedDateForExport.getMonth() &&
                       eventDate.getDate() === selectedDateForExport.getDate();
              });
              
              console.log('Day events count:', dayEvents.length);
              dayEvents.forEach((event, i) => {
                const duration = (event.endTime.getTime() - event.startTime.getTime()) / (1000 * 60);
                console.log(`Event ${i+1}: "${event.title}" - Duration: ${duration} minutes`);
              });
              
              await exportExactDailyPDF(selectedDateForExport, currentEvents);
              
              toast({
                title: "Export Successful",
                description: `Daily planner PDF downloaded with ${dayEvents.length} appointments!`
              });
              return;
            } catch (dailyError) {
              console.error('=== DAILY PDF EXPORT ERROR ===');
              console.error('Error details:', dailyError);
              console.error('Stack trace:', dailyError.stack);
              toast({
                title: "Export Failed",
                description: `Daily PDF export failed: ${dailyError.message}`,
                variant: "destructive"
              });
              return;
            }
          } else {
            // Export weekly view as PDF
            try {
              await exportExactGridPDF(
                state.currentWeek.startDate,
                state.currentWeek.endDate,
                currentEvents
              );

              toast({
                title: "Export Successful",
                description: "Weekly calendar PDF downloaded successfully!"
              });
              return;
            } catch (weeklyError) {
              console.error('Weekly PDF export error:', weeklyError);
              throw weeklyError;
            }
          }
          break;
        
        case 'Daily View':
        case 'reMarkable Daily':
          // Export daily view as PDF using the correct daily export function
          try {
            console.log(`=== BEFORE ${type} PDF EXPORT ===`);
            console.log('Selected date:', selectedDateForExport.toDateString());
            console.log('Current events count:', currentEvents.length);
            
            // Filter events for debugging
            const dayEvents = currentEvents.filter(event => {
              const eventDate = new Date(event.startTime);
              const matches = eventDate.toDateString() === selectedDateForExport.toDateString();
              console.log(`Daily Export Filter - Event: ${event.title} on ${eventDate.toDateString()}, Selected: ${selectedDateForExport.toDateString()}, Matches: ${matches}`);
              return matches;
            });
            
            console.log('Day events count:', dayEvents.length);
            dayEvents.forEach((event, i) => {
              const duration = (event.endTime.getTime() - event.startTime.getTime()) / (1000 * 60);
              console.log(`Event ${i+1}: "${event.title}" - Duration: ${duration} minutes`);
            });
            
            if (dayEvents.length === 0) {
              console.log('WARNING: No events found for selected date');
              console.log('Available events dates:');
              currentEvents.forEach(event => {
                console.log(`  - ${event.title}: ${new Date(event.startTime).toDateString()}`);
              });
            }
            
            // Use the dedicated daily export function directly
            await exportExactDailyPDF(selectedDateForExport, currentEvents);
            
            toast({
              title: "Export Successful",
              description: `Daily planner PDF downloaded with ${dayEvents.length} appointments!`
            });
            return;
          } catch (dailyError) {
            console.error('=== DAILY EXPORT CASE ERROR ===');
            console.error('Error details:', dailyError);
            console.error('Error stack:', dailyError.stack);
            toast({
              title: "Export Failed",
              description: `Daily PDF export failed: ${dailyError.message}`,
              variant: "destructive"
            });
            return;
          }

        case 'Weekly Package':
          // Export comprehensive weekly package with all daily pages
          try {
            // Import the weekly package export function
            const { exportWeeklyPackage } = await import('../utils/weeklyPackageExport');
            
            console.log('=== WEEKLY PACKAGE EXPORT START ===');
            console.log('Week start:', state.currentWeek.startDate.toDateString());
            console.log('Week end:', state.currentWeek.endDate.toDateString());
            console.log('Total events:', currentEvents.length);
            
            // Filter events for the current week
            const weekEvents = currentEvents.filter(event => {
              const eventDate = new Date(event.startTime);
              return eventDate >= state.currentWeek.startDate && eventDate <= state.currentWeek.endDate;
            });
            
            console.log('Week events:', weekEvents.length);
            
            await exportWeeklyPackage(
              state.currentWeek.startDate,
              state.currentWeek.endDate,
              currentEvents
            );

            toast({
              title: "Weekly Package Export Successful",
              description: `Complete weekly package with 8 pages downloaded! (1 weekly overview + 7 daily pages)`
            });
            return;
          } catch (weeklyError) {
            console.error('Weekly package export error:', weeklyError);
            toast({
              title: "Export Failed",
              description: `Weekly package export failed: ${weeklyError.message}`,
              variant: "destructive"
            });
            return;
          }
          break;

        case 'reMarkable Weekly':
          // Export weekly view as PDF using the working export function
          try {
            await exportExactGridPDF(
              state.currentWeek.startDate,
              state.currentWeek.endDate,
              currentEvents
            );

            toast({
              title: "Export Successful",
              description: "Weekly calendar PDF downloaded successfully!"
            });
            return;
          } catch (weeklyError) {
            console.error('Weekly PDF export error:', weeklyError);
            throw weeklyError;
          }
          break;

        case 'JSON Export':
          fileContent = exportToJSON(exportData);
          fileName = `daily-planner-${selectedDateForExport.toISOString().split('T')[0]}.json`;
          mimeType = 'application/json';
          break;

        case 'CSV Export':
          fileContent = exportToCSV(exportData);
          fileName = `daily-planner-${selectedDateForExport.toISOString().split('T')[0]}.csv`;
          mimeType = 'text/csv';
          break;

        case 'Test Export':
          // This will download a test file and log everything to console
          testExportData(currentEvents, selectedDateForExport);
          toast({
            title: "Test Export Complete",
            description: "Check console and downloads for test data"
          });
          return;

        default:
          fileContent = exportToText(exportData);
          fileName = `planner-export-${selectedDateForExport.toISOString().split('T')[0]}.txt`;
          mimeType = 'text/plain';
      }

      // Create and download the file
      const blob = new Blob([fileContent], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log('=== EXPORT COMPLETE ===');
      console.log('File name:', fileName);
      console.log('File size:', fileContent.length, 'characters');
      console.log('Appointments exported:', exportData.appointments.length);

      toast({
        title: "Export Successful",
        description: `${fileName} downloaded with ${exportData.appointments.length} appointments!`
      });

    } catch (error) {
      console.error('=== EXPORT ERROR ===', error);
      toast({
        title: "Export Error",
        description: `Failed to generate export: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    }
  };

  // Helper function for weekly text export
  const generateWeeklyText = (weeklyData: any[]): string => {
    let output = 'WEEKLY PLANNER\n';
    output += `Week of ${weeklyData[0]?.date} - ${weeklyData[weeklyData.length - 1]?.date}\n`;
    output += '='.repeat(80) + '\n\n';

    let totalAppointments = 0;
    
    weeklyData.forEach((dayData, index) => {
      output += `${dayData.date}\n`;
      output += '-'.repeat(40) + '\n';
      
      if (dayData.appointments.length === 0) {
        output += 'No appointments\n';
      } else {
        dayData.appointments.forEach((apt: any, aptIndex: number) => {
          output += `${aptIndex + 1}. ${apt.time} - ${apt.title} (${apt.source})\n`;
          if (apt.notes && apt.notes.trim()) {
            output += `   Notes: ${apt.notes}\n`;
          }
        });
        totalAppointments += dayData.appointments.length;
      }
      
      if (dayData.dailyNotes && dayData.dailyNotes.trim()) {
        output += `Daily Notes: ${dayData.dailyNotes}\n`;
      }
      
      output += '\n';
    });

    output += `\nWEEK SUMMARY: ${totalAppointments} total appointments\n`;
    
    return output;
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
        // Check current view mode to determine export type
        if (state.viewMode === 'daily') {
          // For Google Drive, we need to generate the PDF content, not download it
          // So we'll use a different approach for daily export to Drive
          toast({
            title: "Google Drive Export",
            description: "Daily view Google Drive export feature coming soon!"
          });
          return;
        } else {
          const weekNumber = getWeekNumber(state.currentDate);
          pdfContent = await exportWeeklyToPDF(
            state.currentWeek.startDate,
            state.currentWeek.endDate,
            currentEvents,
            weekNumber
          );
          filename = generateFilename('weekly', state.currentWeek.startDate);
        }
      } else if (type === 'daily') {
        // For Google Drive, daily export needs special handling
        toast({
          title: "Google Drive Export",
          description: "Daily view Google Drive export feature coming soon!"
        });
        return;
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
      console.log('Syncing event to database:', eventId, updates);

      // Find the event in our state
      const event = state.events.find(e => e.id === eventId);
      if (!event) {
        console.error('Event not found in state:', eventId);
        return;
      }

      // Prepare the payload with only the fields we want to sync
      const payload: any = {};
      if (updates.notes !== undefined) payload.notes = updates.notes;
      if (updates.actionItems !== undefined) payload.actionItems = updates.actionItems;

      let apiEndpoint = null;
      let method = 'PUT';

      if (event.source === 'google' && event.sourceId) {
        // For Google Calendar events, update by sourceId
        apiEndpoint = `/api/events/source/${event.sourceId}`;
        method = 'PUT';
      } else if (event.source === 'manual') {
        // For manual events, update by database ID
        // Try to parse the ID as a number, if it fails, it might be a temporary ID
        const dbId = parseInt(eventId.replace('temp-', ''));
        if (!isNaN(dbId) && !eventId.startsWith('temp-')) {
          apiEndpoint = `/api/events/${dbId}`;
          method = 'PUT';
        } else {
          // This is a new manual event, create it
          payload.userId = 1; // Default user for development
          payload.title = event.title;
          payload.description = event.description || '';
          payload.startTime = event.startTime;
          payload.endTime = event.endTime;
          payload.source = 'manual';
          payload.color = event.color;

          apiEndpoint = '/api/events';
          method = 'POST';
        }
      } else {
        console.log('Skipping sync for unsupported event type:', event.source);
        return;
      }

      if (apiEndpoint) {
        const response = await fetch(apiEndpoint, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
        }

        const result = await response.json();
        console.log('Event notes synced successfully to database:', result);

        // Update the event ID if it was a temporary one
        if (method === 'POST' && result.id) {
          updateEvent(eventId, { id: result.id.toString() });
        }
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
          onExportCurrentView={(type) => {
            console.log('🎯 onExportCurrentView called with type:', type);
            console.log('🎯 About to call handleExportAction');
            try {
              handleExportAction(type || 'Current View');
              console.log('🎯 handleExportAction called successfully');
            } catch (error) {
              console.error('🎯 Error in handleExportAction:', error);
            }
          }}
          onExportWeeklyPackage={() => handleExportAction('Weekly Package')}
          onExportDailyView={() => {
            console.log('📱 Daily View Export Button Clicked!');
            handleExportAction('Daily View');
          }}
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