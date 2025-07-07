import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { MainLayout } from '../components/layout/MainLayout';
import { WeeklyPlannerView } from '../components/calendar/WeeklyPlannerView';
import { DailyView } from '../components/calendar/DailyView';
import { CalendarLegend } from '../components/calendar/CalendarLegend';
import { CalendarEvent, ViewMode } from '../types/calendar';
import { useToast } from '@/hooks/use-toast';
import { exportWeeklyToPDF, exportDailyToPDF, exportWeeklyPackageToPDF, generateFilename } from '../utils/pdfExportSimple';
import { getWeekNumber, getWeekStartDate, getWeekEndDate } from '../utils/dateUtils';
import { queryClient, apiRequest } from '../lib/queryClient';

export default function Planner() {
  const [viewMode, setViewMode] = useState<ViewMode>('weekly');
  const [currentDate] = useState(() => new Date(2025, 6, 7)); // Fixed to July 7, 2025
  const [selectedDate, setSelectedDate] = useState(() => new Date(2025, 6, 7));
  const [dailyNotes, setDailyNotes] = useState<Record<string, string>>({});
  const [selectedCalendars, setSelectedCalendars] = useState(new Set(['personal', 'google', 'simplepractice']));
  const { toast } = useToast();

  // Simplified events fetch - no authentication required
  const { data: events = [], isLoading } = useQuery({
    queryKey: ['/api/events/1'], // Use user ID 1 for demo
    staleTime: 1000 * 60 * 5,
    retry: false
  });

  // Get daily notes - directly use the result without causing re-renders
  const { data: notesData = {} } = useQuery({
    queryKey: ['/api/notes'],
    staleTime: 1000 * 60 * 5,
  });

  // Use notes data directly instead of state to avoid infinite loops
  const currentNotes = notesData || {};

  // Calculate current week
  const weekStartDate = getWeekStartDate(currentDate);
  const weekEndDate = getWeekEndDate(currentDate);
  const weekNumber = getWeekNumber(currentDate);

  // Filter events by selected calendars
  const filteredEvents = events.filter((event: CalendarEvent) => {
    if (event.source === 'manual') return selectedCalendars.has('personal');
    if (event.source === 'google') return selectedCalendars.has('google');
    if (event.source === 'simplepractice' || event.title.toLowerCase().includes('appointment')) {
      return selectedCalendars.has('simplepractice');
    }
    return selectedCalendars.has('personal');
  });

  // Calendar legend data
  const calendars = [
    { id: 'simplepractice', name: 'SimplePractice', color: '#6495ED' },
    { id: 'google', name: 'Google Calendar', color: '#4285f4' },
    { id: 'personal', name: 'Personal', color: '#34a853' }
  ];

  const handleCalendarToggle = (calendarId: string) => {
    const newSelected = new Set(selectedCalendars);
    if (newSelected.has(calendarId)) {
      newSelected.delete(calendarId);
    } else {
      newSelected.add(calendarId);
    }
    setSelectedCalendars(newSelected);
  };

  const handlePDFExport = async (type: string) => {
    try {
      let pdfContent: string;
      let filename: string;

      if (type === 'Weekly Package') {
        pdfContent = await exportWeeklyPackageToPDF(
          weekStartDate,
          weekEndDate,
          filteredEvents,
          weekNumber,
          dailyNotes
        );
        filename = generateFilename('weekly-package', weekStartDate);
      } else if (type === 'Current View') {
        pdfContent = await exportWeeklyToPDF(
          weekStartDate,
          weekEndDate,
          filteredEvents,
          weekNumber
        );
        filename = generateFilename('weekly', weekStartDate);
      } else if (type === 'Daily View') {
        const currentDailyNotes = dailyNotes[selectedDate.toISOString().split('T')[0]] || '';
        pdfContent = await exportDailyToPDF(
          selectedDate,
          filteredEvents,
          currentDailyNotes
        );
        filename = generateFilename('daily', selectedDate);
      } else {
        toast({
          title: "PDF Export",
          description: `${type} export feature coming soon!`
        });
        return;
      }

      // Create download link
      const link = document.createElement('a');
      link.href = pdfContent;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "PDF Export",
        description: `${type} exported successfully!`
      });

    } catch (error) {
      console.error('PDF Export Error:', error);
      toast({
        title: "Export Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setViewMode('daily');
  };

  const handleEventClick = (event: CalendarEvent) => {
    // Handle event click
    console.log('Event clicked:', event);
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-lg">Loading planner...</div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="h-full flex flex-col">
        {/* Header Controls */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">Digital Planner</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('weekly')}
                className={`px-3 py-1 rounded ${viewMode === 'weekly' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              >
                Weekly
              </button>
              <button
                onClick={() => setViewMode('daily')}
                className={`px-3 py-1 rounded ${viewMode === 'daily' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              >
                Daily
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePDFExport('Current View')}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Export PDF
            </button>
            <button
              onClick={() => handlePDFExport('Weekly Package')}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Weekly Package
            </button>
          </div>
        </div>

        {/* Calendar Legend */}
        <div className="px-4 py-2 border-b">
          <CalendarLegend
            calendars={calendars}
            selectedCalendars={selectedCalendars}
            onCalendarToggle={handleCalendarToggle}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          {viewMode === 'weekly' ? (
            <WeeklyPlannerView
              currentDate={currentDate}
              events={filteredEvents}
              onDateSelect={handleDateSelect}
              onDayClick={handleDayClick}
              onEventClick={handleEventClick}
            />
          ) : (
            <DailyView
              selectedDate={selectedDate}
              events={filteredEvents.filter(event => {
                const eventDate = new Date(event.startTime);
                return eventDate.toDateString() === selectedDate.toDateString();
              })}
              dailyNotes={dailyNotes[selectedDate.toISOString().split('T')[0]] || ''}
              onPreviousDay={() => {
                const prevDay = new Date(selectedDate);
                prevDay.setDate(prevDay.getDate() - 1);
                setSelectedDate(prevDay);
              }}
              onNextDay={() => {
                const nextDay = new Date(selectedDate);
                nextDay.setDate(nextDay.getDate() + 1);
                setSelectedDate(nextDay);
              }}
              onBackToWeek={() => setViewMode('weekly')}
              onEventClick={handleEventClick}
              onUpdateEvent={() => {}}
              onUpdateDailyNotes={(notes) => {
                const dateKey = selectedDate.toISOString().split('T')[0];
                setDailyNotes(prev => ({ ...prev, [dateKey]: notes }));
              }}
            />
          )}
        </div>
      </div>
    </MainLayout>
  );
}