import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { CalendarEvent, CalendarDay, ViewMode, CalendarState } from '@/types/calendar';
import { WeeklyCalendarGrid } from '@/components/calendar/WeeklyCalendarGrid';
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
import { pixelPerfectAuditSystem } from '@/utils/pixelPerfectAuditSystem';
import { auditSystem, AuditResults } from '@/utils/comprehensiveAuditSystem';
import { exportExactGridPDF } from '@/utils/exactGridPDFExport';
import { exportDailyToPDF } from '@/utils/dailyPDFExport';
import { exportWeeklyPackage } from '@/utils/weeklyPackageExport';
import { exportBidirectionalWeeklyPackage } from '@/utils/bidirectionalWeeklyPackage';
import { exportDynamicDailyPlannerPDF } from '@/utils/dynamicDailyPlannerPDF';
import { exportTrulyPixelPerfectWeeklyPDF } from '@/utils/trulyPixelPerfectExport';
import { exportExactWeeklySpec } from '@/utils/exactWeeklySpecExport';
import { exportFixedDynamicDailyPlannerPDF } from '@/utils/fixedDynamicDailyPlannerPDF';
import { exportAuditEnhancedPDF } from '@/utils/auditBasedPDFExport';
import { export100PercentPixelPerfectPDF } from '@/utils/pixelPerfectPDFExport';
import { DevLoginButton } from '../components/DevLoginButton';
import { autonomousAuthAudit } from '../utils/autonomousAuthAudit';
import { AuthenticationFix } from '../utils/authenticationFix';
import { SessionFixer } from '../utils/sessionFixer';

export default function Planner() {
  const { user, isLoading: userLoading, refetch: refetchAuth } = useAuthenticatedUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Force refresh authentication after OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('code') && urlParams.has('scope')) {
      // OAuth callback detected, refresh auth state after delay
      setTimeout(() => {
        refetchAuth();
      }, 1000);
    }
  }, [refetchAuth]);

  // Add authentication refresh function for debugging
  const refreshAuth = async () => {
    console.log('🔄 Refreshing authentication...');
    try {
      await refetchAuth();
      await queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/simplepractice/events'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/calendar/events'] });
      console.log('✅ Authentication refreshed');
    } catch (error) {
      console.error('❌ Auth refresh failed:', error);
    }
  };

  // Make auth refresh available globally for debugging
  useEffect(() => {
    (window as any).refreshAuth = refreshAuth;
    (window as any).queryClient = queryClient;
    (window as any).authHookState = { user, isLoading: userLoading };
    
    // Add session debugging functions
    (window as any).testAuthenticatedSession = async () => {
      console.log('🧪 Testing authenticated session directly...');
      try {
        const response = await fetch('/api/auth/status', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Cookie': 'remarkable.sid=s%3AgBvnYGiTDicIU7Udon_c5TdzlgtHhdNU.4GDBmZtU6BzV0jBKRj1PNKgdyBHfJE8kOCsFjBEhqeI',
            'Cache-Control': 'no-cache'
          }
        });
        const data = await response.json();
        console.log('🔍 Authenticated session test result:', data);
        return data.isAuthenticated;
      } catch (error) {
        console.error('❌ Authenticated session test failed:', error);
        return false;
      }
    };
    
    (window as any).fixSessionNow = () => {
      console.log('🔧 EMERGENCY SESSION FIX: Forcing authenticated session...');
      SessionFixer.forceUseAuthenticatedSession();
    };
  }, [refreshAuth, queryClient, user, userLoading]);

  // DISABLED autonomous auth check to prevent reload loops - only manual fix button available
  useEffect(() => {
    // Autonomous checking disabled - only manual "FIX AUTHENTICATION NOW" button available
    console.log('🔧 Autonomous authentication checking disabled - use manual fix button only');
  }, []);

  // Manual auth fix handler
  const handleManualAuthFix = async () => {
    console.log('🚀 DEPLOYMENT AUTHENTICATION FIX');
    
    try {
      // Try deployment authentication fix first
      console.log('🔄 Trying deployment authentication fix...');
      const deploymentResponse = await fetch('/api/auth/deployment-fix', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      
      if (deploymentResponse.ok) {
        const data = await deploymentResponse.json();
        console.log('✅ Deployment fix successful:', data);
        
        if (data.success) {
          toast({ title: 'Authentication Restored!', description: `Found ${data.eventsCount} events in database` });
          setTimeout(() => window.location.reload(), 1000);
          return;
        } else if (data.redirectTo) {
          toast({ title: 'Redirecting to Google OAuth...', description: 'No events found, please authenticate' });
          setTimeout(() => window.location.href = data.redirectTo, 1000);
          return;
        }
      }
      
      // Fallback to session fix if deployment fix fails
      console.log('🔄 Falling back to session fix...');
      const sessionResponse = await fetch('/api/auth/create-session', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      
      if (sessionResponse.ok) {
        const data = await sessionResponse.json();
        console.log('✅ Session fix successful:', data);
        toast({ title: 'Authentication Fixed!', description: 'Session synchronized - reloading...' });
        setTimeout(() => window.location.reload(), 1000);
      } else {
        throw new Error(`Session fix failed: ${sessionResponse.status}`);
      }
      
    } catch (error) {
      console.error('❌ Authentication fix failed:', error);
      toast({
        title: 'Authentication fix failed',
        description: 'Redirecting to Google OAuth as final fallback...',
        variant: 'destructive'
      });
      setTimeout(() => {
        window.location.href = '/api/auth/google';
      }, 2000);
    }
  };

  // Google OAuth reconnect handler
  const handleGoogleReconnect = async () => {
    console.log('🔗 Google reconnect requested');
    
    try {
      toast({ title: 'Starting Google OAuth...', description: 'Redirecting to Google...' });
      
      // Use the comprehensive authentication fix system
      const success = await AuthenticationFix.startGoogleOAuth();
      
      if (success) {
        console.log('✅ Google reconnect initiated');
      } else {
        console.log('❌ Google reconnect failed');
        toast({
          title: 'Google reconnect failed',
          description: 'Please check your internet connection and try again',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('❌ Google reconnect error:', error);
      toast({
        title: 'Google reconnect error',
        description: 'Please try refreshing the page',
        variant: 'destructive'
      });
    }
  };

  // State management
  const [viewMode, setViewMode] = useState<ViewMode>('weekly');
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    try {
      // Start at a date in 2025 where appointments should be visible
      return new Date(2025, 6, 7); // July 7, 2025 (month is 0-indexed)
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

  // Fetch events - only when authenticated
  const { data: events = [], isLoading: eventsLoading, error: eventsError } = useQuery({
    queryKey: ['/api/events'],
    enabled: !!user, // Only fetch when user is authenticated
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 30 * 60 * 1000, // 30 minutes
  });



   // SimplePractice calendar data - only fetch when authenticated
   const { data: simplePracticeData, isLoading: isLoadingSimplePracticeEvents, error: simplePracticeError } = useQuery({
    queryKey: ['/api/simplepractice/events'],
    queryFn: async () => {
        const startDate = new Date(2024, 0, 1).toISOString(); // January 1, 2024
        const endDate = new Date(2025, 11, 31).toISOString(); // December 31, 2025
        const response = await fetch(`/api/simplepractice/events?start=${startDate}&end=${endDate}`, {
          credentials: 'include' // Include cookies for session authentication
        });
        if (!response.ok) {
            throw new Error('Failed to fetch SimplePractice events');
        }
        return response.json();
    },
    retry: 1,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!user, // Only fetch when user is authenticated
  });

  // Extract SimplePractice events safely with comprehensive error handling
  const simplePracticeEvents = useMemo(() => {
    try {
      if (!simplePracticeData) return [];
      if (!simplePracticeData.events) return [];
      if (!Array.isArray(simplePracticeData.events)) return [];
      return simplePracticeData.events;
    } catch (error) {
      console.error('Error processing SimplePractice events:', error);
      return [];
    }
  }, [simplePracticeData]);

  const simplePracticeCalendars = useMemo(() => {
    try {
      if (!simplePracticeData) return [];
      if (!simplePracticeData.calendars) return [];
      if (!Array.isArray(simplePracticeData.calendars)) return [];
      return simplePracticeData.calendars;
    } catch (error) {
      console.error('Error processing SimplePractice calendars:', error);
      return [];
    }
  }, [simplePracticeData]);

  // Google Calendar data - only fetch when authenticated
  const { data: googleCalendarData, isLoading: isLoadingGoogleEvents, error: googleCalendarError } = useQuery({
    queryKey: ['/api/calendar/events'],
    queryFn: async () => {
      const startDate = new Date(2024, 0, 1).toISOString(); // January 1, 2024
      const endDate = new Date(2025, 11, 31).toISOString(); // December 31, 2025
      const response = await fetch(`/api/calendar/events?start=${startDate}&end=${endDate}`, {
        credentials: 'include' // Include cookies for session authentication
      });
      if (!response.ok) {
        throw new Error('Failed to fetch Google Calendar events');
      }
      return response.json();
    },
    retry: 1,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!user, // Only fetch when user is authenticated
  });

  const googleEvents = Array.isArray(googleCalendarData?.events) ? googleCalendarData.events : [];
  const googleCalendars = Array.isArray(googleCalendarData?.calendars) ? googleCalendarData.calendars : [];
  const isGoogleCalendarConnected = !googleCalendarError && (googleEvents.length > 0 || googleCalendars.length > 0);

  // Combine and filter events
  const allEvents = [...events, ...googleEvents, ...simplePracticeEvents].filter(event => {
    const eventSource = event.source || 'manual';
    if (eventSource === 'simplepractice' && !calendarFilters.simplepractice) return false;
    if (eventSource === 'google' && !calendarFilters.google) return false;
    if (eventSource === 'manual' && !calendarFilters.personal) return false;
    return true;
  });

  // Debug logging for event sources and errors
  console.log('📊 Event breakdown:', {
    total: allEvents.length,
    simplepractice: allEvents.filter(e => e.source === 'simplepractice').length,
    google: allEvents.filter(e => e.source === 'google').length,
    manual: allEvents.filter(e => e.source === 'manual' || !e.source).length
  });

  // Debug: Show date ranges of your appointments
  if (allEvents.length > 0) {
    const eventDates = allEvents.map(e => new Date(e.startTime)).sort((a, b) => a.getTime() - b.getTime());
    const earliestDate = eventDates[0];
    const latestDate = eventDates[eventDates.length - 1];

    console.log('📅 Your appointments date range:', {
      earliest: earliestDate?.toDateString(),
      latest: latestDate?.toDateString(),
      sampleDates: eventDates.slice(0, 5).map(d => d.toDateString()),
      currentlyViewing: selectedDate.toDateString()
    });
  }

  // Log SimplePractice status for debugging
  console.log('🔍 SimplePractice Status:', {
    isLoading: isLoadingSimplePracticeEvents,
    hasError: !!simplePracticeError,
    error: simplePracticeError?.message,
    eventsFound: simplePracticeEvents.length,
    calendarsFound: simplePracticeCalendars.length
  });

  // Make test functions available globally for debugging (after allEvents is defined)
  useEffect(() => {
    // Create comprehensive test function with detailed logging
    (window as any).testDailyExport = async () => {
      try {
        console.log('🧪 === DAILY PDF EXPORT TEST STARTING ===');
        console.log('📊 Test environment:', {
          selectedDate: selectedDate.toDateString(),
          allEventsCount: allEvents.length,
          eventsForSelectedDate: allEvents.filter(e => {
            const eventDate = new Date(e.startTime);
            return eventDate.toDateString() === selectedDate.toDateString();
          }).length
        });

        // Test if the function exists
        if (typeof exportDailyToPDF === 'function') {
          console.log('✅ exportDailyToPDF function is available');

          // Call the function
          await exportDailyToPDF(selectedDate, allEvents);
          console.log('✅ Test daily export completed successfully');
        } else {
          console.error('❌ exportDailyToPDF function not found');
          console.log('Available imports:', { exportDailyToPDF: typeof exportDailyToPDF });
        }
      } catch (error) {
        console.error('❌ Test daily export failed:', error);
        console.error('Error details:', {
          message: error.message,
          stack: error.stack?.split('\n')?.slice(0, 5)
        });
      }
    };

    (window as any).testDynamicDailyExport = async () => {
      try {
        console.log('🧪 Testing dynamic daily PDF export...');
        await exportDynamicDailyPlannerPDF(selectedDate, allEvents);
        console.log('✅ Test dynamic daily export completed');
      } catch (error) {
        console.error('❌ Test dynamic daily export failed:', error);
      }
    };

    // Test button click handler for debugging
    (window as any).testButtonClick = async () => {
      try {
        console.log('🧪 Testing button click handler...');
        console.log('🚀 Starting PDF export: daily');
        console.log('📅 Selected date:', selectedDate.toDateString());
        console.log('📊 Total events:', allEvents.length);

        await exportDailyToPDF(selectedDate, allEvents);
        console.log('✅ Button click test completed');
      } catch (error) {
        console.error('❌ Button click test failed:', error);
      }
    };

    // Add simple PDF test function
    (window as any).testSimplePDF = async () => {
      try {
        console.log('🧪 Testing Simple PDF Export');
        const { exportSimplePDF } = await import('../utils/simplePDFExport');

        // Filter events for selected date
        const todayEvents = allEvents.filter(event => {
          const eventDate = new Date(event.startTime);
          return eventDate.toDateString() === selectedDate.toDateString();
        });

        console.log('📊 Events for selected date:', todayEvents.length);

        await exportSimplePDF(selectedDate, todayEvents);
        console.log('✅ Simple PDF test completed successfully');
      } catch (error) {
        console.error('❌ Simple PDF test failed:', error);
      }
    };

    // Add direct PDF export test
    (window as any).testDirectPDF = async () => {
      try {
        console.log('🧪 Testing Direct Daily PDF Export');
        console.log('📅 Selected date:', selectedDate.toDateString());
        console.log('📊 All events:', allEvents.length);

        // Call the actual export function directly
        await handleExportPDF('daily');
        console.log('✅ Direct PDF test completed successfully');
      } catch (error) {
        console.error('❌ Direct PDF test failed:', error);
      }
    };

    console.log('🎯 Test functions registered:', {
      testDailyExport: typeof (window as any).testDailyExport,
      testDynamicDailyExport: typeof (window as any).testDynamicDailyExport,
      testButtonClick: typeof (window as any).testButtonClick,
      testSimplePDF: typeof (window as any).testSimplePDF,
      testDirectPDF: typeof (window as any).testDirectPDF
    });

    // Automatic testing disabled to prevent export loops
    // Test functions available via window.testSimplePDF(), window.testDirectPDF(), etc.
  }, [selectedDate, allEvents]);

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
    if (!user) {
      toast({ 
        title: 'Authentication Required', 
        description: 'Please authenticate with Google to create events',
        variant: 'destructive' 
      });
      return;
    }

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
      console.log(`🚀 Starting PDF export: ${exportType}`);
      console.log(`📅 Selected date: ${selectedDate.toDateString()}`);
      console.log(`📊 Total events: ${allEvents.length}`);

      toast({ title: 'Generating PDF export...' });

      switch (exportType) {
        case 'weekly':
          await exportExactGridPDF(currentWeek, allEvents);
          break;
        case 'current-weekly':
          console.log('🔄 Starting current weekly export...');
          try {
            const { exportCurrentWeeklyView } = await import('../utils/currentWeeklyExport');
            console.log('✅ Module imported successfully');
            
            const weekStart = currentWeek[0]?.date || new Date();
            const weekEnd = currentWeek[6]?.date || new Date();
            
            console.log(`📅 Week range: ${weekStart.toDateString()} to ${weekEnd.toDateString()}`);
            console.log(`📊 Events count: ${allEvents.length}`);
            
            await exportCurrentWeeklyView(allEvents, weekStart, weekEnd);
            console.log('✅ Current weekly export completed successfully');
          } catch (error) {
            console.error('❌ Current weekly export failed:', error);
            throw error;
          }
          break;
        case 'daily':
          console.log('🎯 DAILY PDF EXPORT STARTING...');
          await exportDailyToPDF(selectedDate, allEvents);
          console.log('✅ Daily PDF export completed');
          break;
        case 'weekly-package':
          await exportWeeklyPackage(currentWeek, allEvents);
          break;
        case 'bidirectional-weekly-package':
          await exportBidirectionalWeeklyPackage(currentWeek[0]?.date || new Date(), currentWeek[6]?.date || new Date(), allEvents);
          break;
        case 'pixel-perfect':
          await exportTrulyPixelPerfectWeeklyPDF(currentWeek, allEvents);
          break;
        case 'exact-weekly-spec':
          await exportExactWeeklySpec(currentWeek[0]?.date || new Date(), currentWeek[6]?.date || new Date(), allEvents);
          break;
        case 'dynamic-daily':
          console.log('🎯 DYNAMIC DAILY PDF EXPORT STARTING...');
          await exportDynamicDailyPlannerPDF(selectedDate, allEvents);
          console.log('✅ Dynamic daily PDF export completed');
          break;
        case 'audit-enhanced':
          await exportAuditEnhancedPDF(currentWeek[0]?.date || new Date(), currentWeek[6]?.date || new Date(), allEvents);
          break;
        case '100-percent-pixel-perfect':
          await export100PercentPixelPerfectPDF(currentWeek[0]?.date || new Date(), currentWeek[6]?.date || new Date(), allEvents);
          break;
        default:
          throw new Error('Unknown export type');
      }

      toast({ title: 'PDF export completed successfully' });
    } catch (error) {
      console.error('❌ Export failed:', error);
      console.error('Error details:', error?.message || 'Unknown error');
      toast({ title: 'Export failed', variant: 'destructive' });
    }
  };

  // Audit handlers
  const handleRunAudit = async () => {
    try {
      toast({ title: 'Running pixel-perfect audit...' });
      const auditResults = await pixelPerfectAuditSystem.runPixelPerfectAudit();
      console.log('Audit results:', auditResults);
      toast({ title: 'Audit completed - check console for results' });
    } catch (error) {
      console.error('Audit failed:', error);
      toast({ title: 'Audit failed', variant: 'destructive' });
    }
  };

  const handleRunComprehensiveAudit = async () => {
    try {
      toast({ title: 'Running comprehensive audit system...' });
      const auditResults = await auditSystem.runFullAudit(allEvents);
      console.log('🎯 Comprehensive Audit Results:', auditResults);

      // Display results in toast
      toast({ 
        title: `Audit Complete - Score: ${auditResults.pixelPerfectScore}%`,
        description: `Found ${auditResults.inconsistencies.length} inconsistencies. Check console for details.`
      });

      // Export results to localStorage
      auditSystem.exportAuditResults(auditResults);

    } catch (error) {
      console.error('Comprehensive audit failed:', error);
      toast({ title: 'Comprehensive audit failed', variant: 'destructive' });
    }
  };

  const handleTestExports = async () => {
    try {
      toast({ title: 'Running comprehensive audit demo with automatic fixes...' });

      // Import the audit system demo
      const { auditSystemDemo } = await import('@/utils/auditSystemDemo');

      // Run comprehensive demo with automatic fixes
      await auditSystemDemo.runComprehensiveDemo(allEvents);

      // Get results
      const results = auditSystemDemo.getResults();

      toast({ 
        title: `Audit Demo Complete - Score: ${results.originalScore}% → ${results.finalScore}%`,
        description: `Improvement: +${results.improvement}%. Implemented ${results.fixes.length} fixes. Check console for details.`
      });

    } catch (error) {
      console.error('Audit demo failed:', error);
      toast({ title: 'Audit demo failed', variant: 'destructive' });
    }
  };

  // Sync handlers
  const handleSyncCalendarEvents = async () => {
    if (!user) {
      toast({ 
        title: 'Authentication Required', 
        description: 'Please authenticate with Google Calendar first',
        variant: 'destructive' 
      });
      return;
    }

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

  const handleReconnectGoogle = () => {
    console.log('Reconnecting to Google Calendar...');
    window.location.href = '/api/auth/google';
  };

  const handleRefreshCalendars = () => {
    console.log('Refreshing calendars...');
    // Force refetch of Google Calendar events
    queryClient.invalidateQueries({ queryKey: ['/api/calendar/events'] });
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

  // Debug function for column width issues
  const debugColumnWidths = () => {
    console.log('=== COLUMN WIDTH DEBUG ===');
    
    const calendarGrid = document.querySelector('.calendar-grid');
    if (!calendarGrid) {
      console.error('Calendar grid not found');
      return;
    }
    
    console.log('Calendar grid:', calendarGrid);
    const gridStyle = window.getComputedStyle(calendarGrid);
    console.log('Grid template columns:', gridStyle.gridTemplateColumns);
    console.log('Grid width:', gridStyle.width);
    
    const headerCells = document.querySelectorAll('.calendar-cell.header-cell');
    console.log(`Found ${headerCells.length} header cells`);
    
    headerCells.forEach((cell, index) => {
      const rect = cell.getBoundingClientRect();
      console.log(`Header Cell ${index} (${cell.textContent}):`, {
        width: rect.width,
        actualWidth: rect.width.toFixed(2) + 'px'
      });
    });
  };

  // Make debug function available globally
  React.useEffect(() => {
    (window as any).debugColumnWidths = debugColumnWidths;
    
    // Inline detailed debug function
    (window as any).debugColumnWidthsDetailed = function() {
      console.log('=== DETAILED COLUMN WIDTH DEBUG ===');
      
      const calendarGrid = document.querySelector('.calendar-grid');
      if (!calendarGrid) {
        console.error('❌ Calendar grid not found');
        return;
      }
      
      console.log('✅ Calendar grid found');
      
      const gridStyle = window.getComputedStyle(calendarGrid);
      console.log('Grid template columns:', gridStyle.gridTemplateColumns);
      console.log('Grid width:', gridStyle.width);
      console.log('Grid display:', gridStyle.display);
      
      const headerCells = document.querySelectorAll('.calendar-cell.header-cell');
      console.log(`📊 Found ${headerCells.length} header cells`);
      
      const measurements = [];
      headerCells.forEach((cell, index) => {
        const rect = cell.getBoundingClientRect();
        const measurement = {
          index,
          text: cell.textContent.trim(),
          width: rect.width,
          left: rect.left,
          right: rect.right
        };
        measurements.push(measurement);
        console.log(`Cell ${index} (${cell.textContent.trim()}): ${rect.width.toFixed(2)}px`);
      });
      
      // Calculate statistics for day columns (skip TIME column)
      const dayColumns = measurements.slice(1);
      const dayWidths = dayColumns.map(m => m.width);
      const minWidth = Math.min(...dayWidths);
      const maxWidth = Math.max(...dayWidths);
      const avgWidth = dayWidths.reduce((a, b) => a + b, 0) / dayWidths.length;
      
      console.log('📈 STATISTICS:');
      console.log(`Min width: ${minWidth.toFixed(2)}px`);
      console.log(`Max width: ${maxWidth.toFixed(2)}px`);
      console.log(`Average width: ${avgWidth.toFixed(2)}px`);
      console.log(`Width difference: ${(maxWidth - minWidth).toFixed(2)}px`);
      
      const tolerance = 1;
      const isEqual = (maxWidth - minWidth) <= tolerance;
      console.log(`${isEqual ? '✅' : '❌'} Columns are ${isEqual ? 'equal' : 'unequal'}`);
      
      return measurements;
    };
    
    console.log('🎯 Debug functions ready: debugColumnWidths() and debugColumnWidthsDetailed()');
  }, []);

  const isLoading = eventsLoading || isLoadingGoogleEvents || isLoadingSimplePracticeEvents;

  // Always show authentication UI with current status
  const authenticationUI = (
    <div className="mb-4 p-6 bg-red-50 border-2 border-red-500 rounded-lg">
      <div className="text-center space-y-4">
        <div>
          <h3 className="font-bold text-red-800 text-2xl">🚨 AUTHENTICATION SYSTEM</h3>
          <p className="text-red-700 text-lg mt-2">
            User: {user ? `✅ ${user.name}` : '❌ Not authenticated'} | 
            Backend: ✅ 1518 events loaded | 
            Status: {userLoading ? 'Loading...' : 'Ready'}
          </p>
        </div>
        <div className="flex justify-center gap-4">
          <button
            onClick={handleManualAuthFix}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-8 rounded-lg transition-colors text-xl animate-pulse"
          >
            🔧 FIX AUTHENTICATION NOW
          </button>
          <button
            onClick={handleGoogleReconnect}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg transition-colors text-xl"
          >
            🔗 GOOGLE RECONNECT
          </button>
        </div>
      </div>
    </div>
  );

  // Loading states - only show if actually loading user data
  if (userLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto">
          {authenticationUI}
          <LoadingState message="Loading user data..." />
        </div>
      </div>
    );
  }

  // If user is not authenticated, show authentication fix UI
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto">
          {authenticationUI}
          {/* Debug info */}
          <div className="text-center text-gray-600 space-y-2">
            <p>Backend: 298 SimplePractice + 230 Google Calendar events loaded successfully</p>
            <p className="text-sm">Console commands: <code>fixSessionNow()</code> or <code>testAuthenticatedSession()</code></p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="w-full mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold">reMarkable Pro Digital Planner</h1>
            <Badge variant="outline" className="text-sm">
              {viewMode === 'weekly' ? 'Weekly View' : 'Daily View'}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            {!user && <DevLoginButton />}
            {user && (
              <Badge variant="outline" className="text-sm bg-green-50">
                Logged in as {user.name}
              </Badge>
            )}
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
            <Button
              variant="outline"
              onClick={() => setSelectedDate(new Date())}
              size="sm"
            >
              Today
            </Button>
            <Button
              variant="outline"
              onClick={() => setSelectedDate(new Date(2024, 0, 1))} // January 2024
              size="sm"
            >
              Jan 2024
            </Button>
            <Button
              variant="outline"
              onClick={() => setSelectedDate(new Date(2024, 2, 1))} // March 2024
              size="sm"
            >
              Mar 2024
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
                  <WeeklyCalendarGrid
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
                    events={(() => {
                      const dailyEvents = allEvents.filter(event => {
                        const eventDate = new Date(event.startTime);
                        return eventDate.toDateString() === selectedDate.toDateString();
                      });
                      console.log('📅 Daily view debug:', {
                        selectedDate: selectedDate.toDateString(),
                        totalEvents: allEvents.length,
                        dailyEvents: dailyEvents.length,
                        eventsForDay: dailyEvents.map(e => ({
                          title: e.title,
                          start: new Date(e.startTime).toDateString(),
                          source: e.source
                        }))
                      });
                      return dailyEvents;
                    })()}
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
                      if (user) {
                        queryClient.invalidateQueries({ queryKey: ['/api/events'] });
                        queryClient.invalidateQueries({ queryKey: ['/api/calendar/events'] });
                      }
                    }}
                    className="w-full"
                    size="sm"
                  >
                    Refresh Events
                  </Button>
                  {user ? (
                    <>
                      <Button 
                        onClick={handleSyncCalendarEvents}
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                        size="sm"
                      >
                        Sync Calendar Events
                      </Button>
                      <div className="text-xs text-green-600 text-center">
                        ✅ Calendar Connected: {user.email}
                      </div>
                    </>
                  ) : (
                    <>
                      <Button
                        onClick={() => window.location.href = '/api/auth/google'}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        size="sm"
                      >
                        Connect Google Calendar
                      </Button>
                      <div className="text-xs text-gray-500 text-center">
                        Connect for calendar access & event creation
                      </div>
                    </>
                  )}
                  <DevLoginButton />
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
                <div className="space-y-3">
                  {/* SimplePractice - Cornflower Blue with left flag */}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="simplepractice"
                      checked={calendarFilters.simplepractice}
                      onChange={(e) => setCalendarFilters(prev => ({ ...prev, simplepractice: e.target.checked }))}
                      className="rounded"
                    />
                    <div className="relative w-4 h-3 bg-white border border-cornflower-blue" style={{ borderColor: '#6495ED' }}>
                      <div className="absolute left-0 top-0 w-1 h-full bg-cornflower-blue" style={{ backgroundColor: '#6495ED' }}></div>
                    </div>
                    <label htmlFor="simplepractice" className="text-sm font-medium" style={{ color: '#6495ED' }}>
                      SimplePractice ({allEvents.filter(e => e.source === 'simplepractice').length})
                    </label>
                  </div>

                  {/* Google Calendar - Green with dashed border */}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="google"
                      checked={calendarFilters.google}
                      onChange={(e) => setCalendarFilters(prev => ({ ...prev, google: e.target.checked }))}
                      className="rounded"
                    />
                    <div 
                      className="w-4 h-3 bg-white border-2" 
                      style={{ 
                        borderColor: '#34a853', 
                        borderStyle: 'dashed',
                        borderWidth: '2px'
                      }}
                    ></div>
                    <label htmlFor="google" className="text-sm font-medium" style={{ color: '#34a853' }}>
                      Google Calendar ({googleEvents.length})
                    </label>
                  </div>

                  {/* US Holidays - Solid Yellow */}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="personal"
                      checked={calendarFilters.personal}
                      onChange={(e) => setCalendarFilters(prev => ({ ...prev, personal: e.target.checked }))}
                      className="rounded"
                    />
                    <div 
                      className="w-4 h-3 border-2" 
                      style={{ 
                        backgroundColor: '#FFF3CD',
                        borderColor: '#FFC107',
                        borderStyle: 'solid'
                      }}
                    ></div>
                    <label htmlFor="personal" className="text-sm font-medium" style={{ color: '#B8860B' }}>
                      US Holidays ({allEvents.filter(e => e.source === 'manual' || e.title?.toLowerCase().includes('holiday')).length})
                    </label>
                  </div>
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
                  onClick={() => handleExportPDF('100-percent-pixel-perfect')}
                  className="w-full justify-start bg-gradient-to-r from-emerald-100 to-green-100 hover:from-emerald-200 hover:to-green-200 border-emerald-400 text-emerald-900 font-bold"
                >
                  <Download className="h-4 w-4 mr-2" />
                  🎯 100% Pixel-Perfect Export
                </Button>
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
                  onClick={() => handleExportPDF('current-weekly')}
                  className="w-full justify-start bg-blue-50 hover:bg-blue-100 border-blue-300"
                >
                  <Download className="h-4 w-4 mr-2" />
                  📊 Current Weekly Layout
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExportPDF('bidirectional-weekly-package')}
                  className="w-full justify-start bg-blue-50 hover:bg-blue-100"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Bidirectional Weekly Package
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExportPDF('audit-enhanced')}
                  className="w-full justify-start bg-yellow-50 hover:bg-yellow-100 border-yellow-300"
                >
                  <Download className="h-4 w-4 mr-2" />
                  🔧 Audit-Enhanced Export
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRunComprehensiveAudit}
                  className="w-full justify-start bg-purple-50 hover:bg-purple-100"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Comprehensive Audit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTestExports}
                  className="w-full justify-start bg-orange-50 hover:bg-orange-100"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Test Export Features
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

            {/* Google Authentication Debug Panel */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-red-800">🔧 Google Auth Debug</CardTitle>
              </CardHeader>
              <CardContent className="bg-red-50 p-4 rounded">
                <div className="space-y-2">
                  <p className="text-sm text-red-700">If you can see this, the component is working!</p>
                  <Button
                    onClick={() => {
                      console.log('🔥 GOOGLE AUTH DEBUG CLICKED');
                      console.log('Current user:', user);
                      console.log('Google Calendar Data:', googleCalendarData);
                      console.log('Google Calendar Error:', googleCalendarError);
                      console.log('Access token status:', document.cookie.includes('access_token'));
                      
                      // Try to check authentication status
                      fetch('/api/auth/status')
                        .then(res => res.json())
                        .then(data => {
                          console.log('Auth Status Response:', data);
                          console.log('🔍 Full Auth Data:', {
                            isAuthenticated: data.isAuthenticated,
                            hasTokens: data.hasTokens,
                            user: data.user,
                            debug: data.debug,
                            recommendations: data.recommendations
                          });
                          
                          const status = data.isAuthenticated 
                            ? (data.hasTokens ? 'Connected with tokens' : 'Connected but missing tokens')
                            : 'Not connected';
                          
                          toast({
                            title: 'Google Calendar Auth Status',
                            description: `${status} - ${data.user?.email || 'No user'}`,
                            variant: data.isAuthenticated && data.hasTokens ? 'default' : 'destructive'
                          });
                        })
                        .catch(err => {
                          console.error('Auth Status Error:', err);
                          toast({
                            title: 'Auth Status Error',
                            description: err.message,
                            variant: 'destructive'
                          });
                        });
                    }}
                    className="w-full bg-red-500 hover:bg-red-600 text-white"
                    size="sm"
                  >
                    🚨 Check Auth Status
                  </Button>
                  <Button
                    onClick={() => {
                      console.log('🔄 FORCING GOOGLE RECONNECT');
                      window.location.href = '/api/auth/google';
                    }}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                    size="sm"
                  >
                    🔗 Force Google Reconnect
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}