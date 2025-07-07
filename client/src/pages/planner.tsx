import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { WeeklyPlannerView } from '../components/calendar/WeeklyPlannerView';
import { DailyView } from '../components/calendar/DailyView';
import { Sidebar } from '../components/sidebar/Sidebar';
import { MainLayout } from '../components/layout/MainLayout';
import { CalendarEvent, ViewMode } from '../types/calendar';
import { getWeekStartDate, getWeekEndDate, addWeeks, getWeekNumber } from '../utils/dateUtils';
import { apiRequest } from '../lib/queryClient';
import { exportWeeklyToPDF, exportDailyToPDF, exportWeeklyPackageToPDF, generateFilename } from '../utils/pdfExportNew';
import { exportWeeklyForRemarkable, exportDailyForRemarkable, generateRemarkableFilename } from '../utils/pdfExportRemarkable';

export default function PlannerPage() {
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [dailyNotes, setDailyNotes] = useState<Record<string, string>>({});
  const [eventsLoading, setEventsLoading] = useState(false);
  const [selectedCalendars, setSelectedCalendars] = useState<string[]>([]);

  // Get events from API
  const { data: events = [], isLoading: eventsQueryLoading, error: eventsError } = useQuery({
    queryKey: ['/api/calendar/events'],
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on authentication errors
      if (error?.status === 401) return false;
      return failureCount < 2;
    },
    refetchOnWindowFocus: false,
  });

  // Handle events fetch errors
  useEffect(() => {
    if (eventsError) {
      console.warn('Events fetch error:', eventsError);
      // Could show a toast notification here if needed
    }
  }, [eventsError]);

  // Get daily notes from API
  const { data: notesData = {} } = useQuery({
    queryKey: ['/api/notes'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  useEffect(() => {
    if (notesData) {
      setDailyNotes(notesData);
    }
  }, [notesData]);

  // Create event mutation
  const createEventMutation = useMutation({
    mutationFn: async (eventData: Partial<CalendarEvent>) => {
      const response = await apiRequest('POST', '/api/calendar/events', eventData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/calendar/events'] });
    },
  });

  // Update event mutation
  const updateEventMutation = useMutation({
    mutationFn: async ({ eventId, updates }: { eventId: string; updates: Partial<CalendarEvent> }) => {
      const response = await apiRequest('PUT', `/api/calendar/events/${eventId}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/calendar/events'] });
    },
  });

  // Delete event mutation
  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      await apiRequest('DELETE', `/api/calendar/events/${eventId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/calendar/events'] });
    },
  });

  // Update notes mutation
  const updateNotesMutation = useMutation({
    mutationFn: async ({ date, notes }: { date: string; notes: string }) => {
      const response = await apiRequest('PUT', '/api/notes', { date, notes });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notes'] });
    },
  });

  const handleWeekChange = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => addWeeks(prev, direction === 'next' ? 1 : -1));
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setViewMode('day');
  };

  const handleTimeSlotClick = (date: Date, time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const startTime = new Date(date);
    startTime.setHours(hours, minutes, 0, 0);

    const endTime = new Date(startTime);
    endTime.setHours(hours, minutes + 30, 0, 0);

    handleCreateEvent(startTime, endTime);
  };

  const handleEventClick = (event: CalendarEvent) => {
    console.log('Event clicked:', event);
  };

  const handleCreateEvent = async (startTime: Date, endTime: Date) => {
    const title = prompt('Enter event title:');
    if (!title) return;

    const description = prompt('Enter event description (optional):') || '';

    try {
      await createEventMutation.mutateAsync({
        title,
        description,
        startTime,
        endTime,
        source: 'manual',
        color: '#3b82f6'
      });
    } catch (error) {
      console.error('Failed to create event:', error);
    }
  };

  const handleUpdateEvent = async (eventId: string, updates: Partial<CalendarEvent>) => {
    try {
      await updateEventMutation.mutateAsync({ eventId, updates });
    } catch (error) {
      console.error('Failed to update event:', error);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      await deleteEventMutation.mutateAsync(eventId);
    } catch (error) {
      console.error('Failed to delete event:', error);
    }
  };

  const handleEventMove = async (eventId: string, newStartTime: Date, newEndTime: Date) => {
    try {
      await updateEventMutation.mutateAsync({
        eventId,
        updates: { startTime: newStartTime, endTime: newEndTime }
      });
    } catch (error) {
      console.error('Failed to move event:', error);
    }
  };

  const handleUpdateDailyNotes = async (notes: string) => {
    const dateKey = selectedDate.toISOString().split('T')[0];

    setDailyNotes(prev => ({
      ...prev,
      [dateKey]: notes
    }));

    try {
      await updateNotesMutation.mutateAsync({ date: dateKey, notes });
    } catch (error) {
      console.error('Failed to update notes:', error);
    }
  };

  const getCurrentDailyNotes = () => {
    const dateKey = selectedDate.toISOString().split('T')[0];
    return dailyNotes[dateKey] || '';
  };

  // Convert API events to CalendarEvent format and apply calendar filtering
  const calendarEvents: CalendarEvent[] = events.filter((event: any) => {
    const shouldInclude = !selectedCalendars.length || selectedCalendars.includes(event.calendarId);
    return shouldInclude;
  }).map((event: any) => ({
    id: event.id,
    title: event.title,
    description: event.description || '',
    startTime: new Date(event.startTime),
    endTime: new Date(event.endTime),
    source: event.source || 'manual',
    sourceId: event.sourceId,
    color: event.color || '#3b82f6',
    notes: event.notes || '',
    actionItems: event.actionItems || ''
  }));

  const weekStartDate = getWeekStartDate(currentDate);
  const weekEndDate = getWeekEndDate(currentDate);
  const weekNumber = getWeekNumber(currentDate);

  const isLoading = eventsQueryLoading || eventsLoading;

  const downloadPDF = (pdfBase64: string, filename: string) => {
    const byteCharacters = atob(pdfBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'application/pdf' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  const handleExportCurrentView = async (format: 'standard' | 'therapy-notes' | 'annotated' = 'standard') => {
    try {
      let pdfBase64: string;
      let filename: string;

      if (viewMode === 'week') {
        const weekNumber = getWeekNumber(selectedDate);
        if (format === 'therapy-notes') {
          // Use therapy notes template - will import when implemented
          pdfBase64 = await exportWeeklyForRemarkable(weekStartDate, weekEndDate, calendarEvents, weekNumber);
        } else {
          pdfBase64 = await exportWeeklyForRemarkable(weekStartDate, weekEndDate, calendarEvents, weekNumber);
        }
        filename = generateRemarkableFilename('weekly', selectedDate);
      } else {
        const dateKey = selectedDate.toISOString().split('T')[0];
        const notes = dailyNotes[dateKey] || '';
        pdfBase64 = await exportDailyForRemarkable(selectedDate, calendarEvents, notes);
        filename = generateRemarkableFilename('daily', selectedDate);
      }

      downloadPDF(pdfBase64, filename);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export PDF. Please try again.');
    }
  };

  const handleExportDailyView = async () => {
    try {
      const dateKey = selectedDate.toISOString().split('T')[0];
      const notes = dailyNotes[dateKey] || '';
      const pdfBase64 = await exportDailyForRemarkable(selectedDate, calendarEvents, notes);
      const filename = generateRemarkableFilename('daily', selectedDate);

      downloadPDF(pdfBase64, filename);
    } catch (error) {
      console.error('Daily export failed:', error);
      alert('Failed to export daily PDF. Please try again.');
    }
  };

  const handleExportWeeklyPackage = async () => {
    try {
      const weekNumber = getWeekNumber(selectedDate);
      const pdfBase64 = await exportWeeklyForRemarkable(weekStartDate, weekEndDate, calendarEvents, weekNumber);
      const filename = `reMarkable_WeeklyPackage_${selectedDate.toISOString().split('T')[0]}.pdf`;

      downloadPDF(pdfBase64, filename);
    } catch (error) {
      console.error('Weekly package export failed:', error);
      alert('Failed to export weekly package PDF. Please try again.');
    }
  };

  const handleExportTemplateCollection = async () => {
    try {
      const { exportRemarkableTemplateCollection, calculateRemarkableStorageUsage } = await import('../utils/pdfExportRemarkable');
      
      const templates = await exportRemarkableTemplateCollection(selectedDate, 4, ['standard', 'minimal', 'annotated']);
      
      // Calculate storage usage
      const pdfDataArray = templates.map(t => t.data);
      const storageInfo = calculateRemarkableStorageUsage(pdfDataArray);
      
      console.log('Template Collection Storage Usage:', storageInfo);
      
      // Download first template as example
      if (templates.length > 0) {
        downloadPDF(templates[0].data, templates[0].filename);
        
        alert(`Generated ${templates.length} templates. Total size: ${storageInfo.totalSizeMB}MB. Average: ${storageInfo.averageSizeKB}KB per file.`);
      }
    } catch (error) {
      console.error('Template collection export failed:', error);
      alert('Failed to export template collection. Please try again.');
    }
  };

  return (
    <MainLayout>
      <div className="flex h-screen bg-gray-50">
        <Sidebar 
          currentDate={currentDate}
          selectedDate={selectedDate}
          viewMode={viewMode}
          dailyNotes={getCurrentDailyNotes()}
          onDateChange={setCurrentDate}
          onSelectedDateChange={setSelectedDate}
          onViewModeChange={setViewMode}
          onNotesChange={handleUpdateDailyNotes}
          onCreateEvent={handleCreateEvent}
          events={calendarEvents}
          onWeekChange={handleWeekChange}
        />

        <main className="flex-1 overflow-hidden">
          {viewMode === 'week' ? (
            <WeeklyPlannerView
              currentDate={currentDate}
              events={calendarEvents}
              onWeekChange={handleWeekChange}
              onDayClick={handleDayClick}
              onTimeSlotClick={handleTimeSlotClick}
              onEventClick={handleEventClick}
              onEventMove={handleEventMove}
              isLoading={isLoading}
            />
          ) : (
            <DailyView
              selectedDate={selectedDate}
              events={calendarEvents}
              dailyNotes={getCurrentDailyNotes()}
              onPreviousDay={() => {
                const newDate = new Date(selectedDate);
                newDate.setDate(newDate.getDate() - 1);
                setSelectedDate(newDate);
              }}
              onNextDay={() => {
                const newDate = new Date(selectedDate);
                newDate.setDate(newDate.getDate() + 1);
                setSelectedDate(newDate);
              }}
              onBackToWeek={() => setViewMode('week')}
              onEventClick={handleEventClick}
              onUpdateEvent={handleUpdateEvent}
              onUpdateDailyNotes={handleUpdateDailyNotes}
              onEventMove={handleEventMove}
              onCreateEvent={handleCreateEvent}
              onDeleteEvent={handleDeleteEvent}
            />
          )}
        </main>
      </div>
    </MainLayout>
  );
}