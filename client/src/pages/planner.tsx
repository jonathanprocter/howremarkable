import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { CalendarEvent, CalendarDay, ViewMode, CalendarState } from '@/types/calendar';
import { WeeklyPlannerView } from '@/components/calendar/WeeklyPlannerView';
import { DailyView } from '@/components/calendar/DailyView';
import { CalendarLegend } from '@/components/calendar/CalendarLegend';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { GoogleCalendarIntegration } from '@/components/sidebar/GoogleCalendarIntegration';
import { Loader2, Calendar, FileText, Download, Upload, Eye, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuthenticatedUser } from '@/hooks/useAuthenticatedUser';
import { LoadingState } from '@/components/common/LoadingState';
import { generateWeekDays } from '@/utils/dateUtils';
import { extractDashboardStyles, logStyleComparison } from '@/utils/dashboardStyleExtractor';
import { runPixelPerfectAudit } from '@/utils/pixelPerfectAudit';
import { exportExactGridPDF } from '@/utils/exactGridPDFExport';
import { exportDailyToPDF } from '@/utils/dailyPDFExport';
import { exportWeeklyPackage } from '@/utils/weeklyPackageExport';
import { exportTrulyPixelPerfectWeeklyPDF } from '@/utils/trulyPixelPerfectExport';
import { exportExactWeeklySpec } from '@/utils/exactWeeklySpecExport';
import { exportDynamicDailyPlannerPDF } from '@/utils/dynamicDailyPlannerPDF';

export default function Planner() {
  const { user, isLoading: userLoading } = useAuthenticatedUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State management
  const [viewMode, setViewMode] = useState<ViewMode>('weekly');
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    try {
      return new Date();
    } catch (error) {
      console.warn('Failed to create initial date, using fallback');
      return new Date(Date.now());
    }
  });
  const [currentWeek, setCurrentWeek] = useState<CalendarDay[]>([]);
  const [calendarFilters, setCalendarFilters] = useState({
    simplepractice: true,
    google: true,
    personal: true
  });

  // Initialize week
  useEffect(() => {
    const week = generateWeekDays(selectedDate);
    setCurrentWeek(week);
  }, [selectedDate]);

  // Fetch events
  const { data: events = [], isLoading: eventsLoading, error: eventsError } = useQuery({
    queryKey: ['/api/events'],
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 30 * 60 * 1000, // 30 minutes
  });

  // Google Calendar data with error handling
  const { data: googleCalendarData, isLoading: isLoadingGoogleEvents, error: googleCalendarError } = useQuery({
    queryKey: ['/api/calendar/events'],
    queryFn: async () => {
      const response = await fetch('/api/calendar/events');
      if (!response.ok) {
        throw new Error('Failed to fetch Google Calendar events');
      }
      return response.json();
    },
    retry: 1,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const googleEvents = googleCalendarData?.events || [];
  const googleCalendars = googleCalendarData?.calendars || [];
  const isGoogleCalendarConnected = !googleCalendarError && googleEvents.length > 0;

  // Combine and filter events
  const allEvents = [...events, ...googleEvents].filter(event => {
    const eventSource = event.source || 'manual';
    if (eventSource === 'simplepractice' && !calendarFilters.simplepractice) return false;
    if (eventSource === 'google' && !calendarFilters.google) return false;
    if (eventSource === 'manual' && !calendarFilters.personal) return false;
    return true;
  });

  // Event mutations
  const createEventMutation = useMutation({
    mutationFn: (eventData: Partial<CalendarEvent>) => 
      apiRequest('/api/events', { method: 'POST', body: eventData }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      toast({ title: 'Event created successfully' });
    },
    onError: (error) => {
      toast({ title: 'Failed to create event', variant: 'destructive' });
    }
  });

  const updateEventMutation = useMutation({
    mutationFn: ({ id, ...eventData }: { id: string } & Partial<CalendarEvent>) =>
      apiRequest(`/api/events/${id}`, { method: 'PUT', body: eventData }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      toast({ title: 'Event updated successfully' });
    },
    onError: (error) => {
      toast({ title: 'Failed to update event', variant: 'destructive' });
    }
  });

  const deleteEventMutation = useMutation({
    mutationFn: (eventId: string) => 
      apiRequest(`/api/events/${eventId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      toast({ title: 'Event deleted successfully' });
    },
    onError: (error) => {
      toast({ title: 'Failed to delete event', variant: 'destructive' });
    }
  });

  // Event handlers
  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setViewMode('daily');
  };

  const handleTimeSlotClick = (date: Date, time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const startTime = new Date(date);
    startTime.setHours(hours, minutes, 0, 0);

    const endTime = new Date(startTime);
    endTime.setHours(hours + 1, minutes, 0, 0);

    const newEvent: Partial<CalendarEvent> = {
      title: 'New Event',
      startTime,
      endTime,
      source: 'manual',
      color: '#3b82f6',
      description: ''
    };

    createEventMutation.mutate(newEvent);
  };

  const handleEventClick = (event: CalendarEvent) => {
    // Handle event click - could open edit modal
    console.log('Event clicked:', event);
  };

  const handleEventMove = (eventId: string, newStartTime: Date, newEndTime: Date) => {
    updateEventMutation.mutate({
      id: eventId,
      startTime: newStartTime,
      endTime: newEndTime
    });
  };

  // Export handlers
  const handleExportPDF = async (exportType: string) => {
    try {
      toast({ title: 'Generating PDF export...' });

      switch (exportType) {
        case 'weekly':
          await exportExactGridPDF(currentWeek, allEvents);
          break;
        case 'daily':
          await exportDailyToPDF(selectedDate, allEvents);
          break;
        case 'weekly-package':
          await exportWeeklyPackage(currentWeek, allEvents);
          break;
        case 'pixel-perfect':
          await exportTrulyPixelPerfectWeeklyPDF(currentWeek, allEvents);
          break;
        case 'exact-weekly-spec':
          await exportExactWeeklySpec(currentWeek[0]?.date || new Date(), currentWeek[6]?.date || new Date(), allEvents);
          break;
        case 'dynamic-daily':
          await exportDynamicDailyPlannerPDF(selectedDate, allEvents);
          break;
        default:
          throw new Error('Unknown export type');
      }

      toast({ title: 'PDF export completed successfully' });
    } catch (error) {
      console.error('Export failed:', error);
      toast({ title: 'Export failed', variant: 'destructive' });
    }
  };

  // Audit handlers
  const handleRunAudit = async () => {
    try {
      toast({ title: 'Running pixel-perfect audit...' });
      const auditResults = await runPixelPerfectAudit();
      console.log('Audit results:', auditResults);
      toast({ title: 'Audit completed - check console for results' });
    } catch (error) {
      console.error('Audit failed:', error);
      toast({ title: 'Audit failed', variant: 'destructive' });
    }
  };

  // Sync handlers
  const handleSyncCalendarEvents = async () => {
    try {
      toast({ title: 'Syncing calendar events...' });

      // Force refresh both event sources
      await queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/calendar/events'] });

      // Refetch both queries
      await queryClient.refetchQueries({ queryKey: ['/api/events'] });
      await queryClient.refetchQueries({ queryKey: ['/api/calendar/events'] });

      toast({ 
        title: 'Calendar events synced successfully',
        description: `Found ${allEvents.length} total events`
      });
    } catch (error) {
      console.error('Failed to sync calendar events:', error);
      toast({ 
        title: 'Failed to sync calendar events', 
        variant: 'destructive',
        description: 'Please check your Google Calendar connection'
      });
    }
  };

  // Additional handlers for Google Calendar integration
  const handleReconnectGoogle = () => {
    // Implement the logic to reconnect to Google Calendar
    console.log("Reconnecting to Google Calendar...");
  };

  const handleRefreshCalendars = () => {
    // Implement the logic to refresh Google Calendars
    console.log("Refreshing Google Calendars...");
  };

  // Navigation
  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    setSelectedDate(newDate);
  };

  const navigateDay = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    setSelectedDate(newDate);
  };

  // Loading states
  if (userLoading) {
    return <LoadingState message="Loading user authentication..." />;
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Please log in to access the planner.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isLoading = eventsLoading || googleEventsLoading;

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-[1404px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold">reMarkable Pro Digital Planner</h1>
            <Badge variant="outline" className="text-sm">
              {viewMode === 'weekly' ? 'Weekly View' : 'Daily View'}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'weekly' ? 'default' : 'outline'}
              onClick={() => setViewMode('weekly')}
              size="sm"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Weekly
            </Button>
            <Button
              variant={viewMode === 'daily' ? 'default' : 'outline'}
              onClick={() => setViewMode('daily')}
              size="sm"
            >
              <FileText className="h-4 w-4 mr-2" />
              Daily
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => viewMode === 'weekly' ? navigateWeek('prev') : navigateDay('prev')}
              size="sm"
            >
              ← Previous
            </Button>
            <Button
              variant="outline"
              onClick={() => viewMode === 'weekly' ? navigateWeek('next') : navigateDay('next')}
              size="sm"
            >
              Next →
            </Button>
          </div>

          <div className="text-lg font-semibold">
            {viewMode === 'weekly' 
              ? `Week of ${currentWeek[0]?.date.toLocaleDateString()} - ${currentWeek[6]?.date.toLocaleDateString()}`
              : selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
            }
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Calendar View */}
          <div className="lg:col-span-3">
            <Card>
              <CardContent className="p-6">
                {isLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span className="ml-2">Loading calendar...</span>
                  </div>
                ) : viewMode === 'weekly' ? (
                  <WeeklyPlannerView
                    week={currentWeek}
                    events={allEvents}
                    onDayClick={handleDayClick}
                    onTimeSlotClick={handleTimeSlotClick}
                    onEventClick={handleEventClick}
                    onEventMove={handleEventMove}
                  />
                ) : (
                  <DailyView
                    selectedDate={selectedDate}
                    events={allEvents.filter(event => {
                      const eventDate = new Date(event.startTime);
                      return eventDate.toDateString() === selectedDate.toDateString();
                    })}
                    dailyNotes=""
                    onPreviousDay={() => navigateDay('prev')}
                    onNextDay={() => navigateDay('next')}
                    onBackToWeek={() => setViewMode('weekly')}
                    onEventClick={handleEventClick}
                    onUpdateEvent={(eventId, updates) => {
                      updateEventMutation.mutate({ id: eventId, ...updates });
                    }}
                    onUpdateDailyNotes={(notes) => {
                      // Handle daily notes update if needed
                    }}
                    onEventMove={handleEventMove}
                    onCreateEvent={(startTime, endTime) => {
                      const newEvent: Partial<CalendarEvent> = {
                        title: 'New Event',
                        startTime,
                        endTime,
                        source: 'manual',
                        color: '#3b82f6',
                        description: ''
                      };
                      createEventMutation.mutate(newEvent);
                    }}
                    onDeleteEvent={(eventId) => {
                      deleteEventMutation.mutate(eventId);
                    }}
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setSelectedDate(new Date())}
                    className="w-full"
                    size="sm"
                  >
                    Go to Today
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
                      queryClient.invalidateQueries({ queryKey: ['/api/calendar/events'] });
                    }}
                    className="w-full"
                    size="sm"
                  >
                    Refresh Events
                  </Button>
                  <Button 
                    onClick={handleSyncCalendarEvents}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    size="sm"
                  >
                    Sync Calendar Events
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Google Calendar Integration */}
            <GoogleCalendarIntegration
              isConnected={isGoogleCalendarConnected}
              calendars={googleCalendars}
              isLoading={isLoadingGoogleEvents}
              onSelectAll={() => setCalendarFilters(prev => ({ ...prev, google: true, personal: true, simplepractice: true }))}
              onDeselectAll={() => setCalendarFilters(prev => ({ ...prev, google: false, personal: false, simplepractice: false }))}
              onReconnect={handleReconnectGoogle}
              onRefreshCalendars={handleRefreshCalendars}
            />

            {/* Calendar Legend */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Calendar Filters</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="personal"
                      checked={calendarFilters.personal}
                      onChange={(e) => setCalendarFilters(prev => ({ ...prev, personal: e.target.checked }))}
                      className="rounded"
                    />
                    <div className="w-3 h-3 bg-blue-500 rounded"></div>
                    <label htmlFor="personal" className="text-sm">Personal Events ({events.filter(e => e.source === 'manual').length})</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="google"
                      checked={calendarFilters.google}
                      onChange={(e) => setCalendarFilters(prev => ({ ...prev, google: e.target.checked }))}
                      className="rounded"
                    />
                    <div className="w-3 h-3 bg-green-500 rounded"></div>
                    <label htmlFor="google" className="text-sm">Google Calendar ({googleEvents.length})</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="simplepractice"
                      checked={calendarFilters.simplepractice}
                      onChange={(e) => setCalendarFilters(prev => ({ ...prev, simplepractice: e.target.checked }))}
                      className="rounded"
                    />
                    <div className="w-3 h-3 bg-purple-500 rounded"></div>
                    <label htmlFor="simplepractice" className="text-sm">SimplePractice (0)</label>
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t">
                  <p className="text-xs text-gray-500">
                    Total events: {allEvents.length} | Displayed: {allEvents.length}
                  </p>
                  {googleCalendarError && (
                    <p className="text-xs text-red-500 mt-1">
                      Google Calendar error: Authentication required
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Export Options */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Export Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExportPDF('weekly')}
                  className="w-full justify-start"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Weekly PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExportPDF('daily')}
                  className="w-full justify-start"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Daily PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExportPDF('pixel-perfect')}
                  className="w-full justify-start bg-emerald-50 hover:bg-emerald-100"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Pixel Perfect
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExportPDF('exact-weekly-spec')}
                  className="w-full justify-start"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exact Weekly Spec
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExportPDF('dynamic-daily')}
                  className="w-full justify-start bg-emerald-50 hover:bg-emerald-100"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Dynamic Daily
                </Button>
              </CardContent>
            </Card>

            {/* Audit Tools */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Audit Tools</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRunAudit}
                  className="w-full justify-start"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Run Pixel Audit
                </Button>
              </CardContent>
            </Card>

            {/* Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total Events:</span>
                    <span className="font-medium">{allEvents.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>This Week:</span>
                    <span className="font-medium">
                      {allEvents.filter(event => {
                        const eventDate = new Date(event.startTime);
                        const weekStart = currentWeek[0]?.date;
                        const weekEnd = currentWeek[6]?.date;
                        return weekStart && weekEnd && eventDate >= weekStart && eventDate <= weekEnd;
                      }).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Today:</span>
                    <span className="font-medium">
                      {allEvents.filter(event => {
                        const eventDate = new Date(event.startTime);
                        return eventDate.toDateString() === new Date().toDateString();
                      }).length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}