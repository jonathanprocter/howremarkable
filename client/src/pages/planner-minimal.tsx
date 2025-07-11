import { useState, useEffect } from 'react';
import { useCalendar } from '../hooks/useCalendar';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { useAuthenticatedUser } from '../hooks/useAuthenticatedUser';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { MainLayout } from '../components/layout/MainLayout';
import { useToast } from '@/hooks/use-toast';

export default function PlannerMinimal() {
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
  const { user: authenticatedUser, isLoading: userLoading, error: userError, refetch: refetchUser } = useAuthenticatedUser();
  const { toast } = useToast();

  // Show loading state for user authentication
  if (userLoading) {
    return (
      <MainLayout>
        <LoadingState 
          isLoading={true} 
          loadingText="Authenticating user..." 
        >
          <div />
        </LoadingState>
      </MainLayout>
    );
  }

  // Show error if user authentication failed
  if (userError || !authenticatedUser) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center p-8 text-center min-h-screen">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
            <h1 className="text-xl font-semibold text-gray-900 mb-4">
              Welcome to reMarkable Pro Digital Planner
            </h1>
            <p className="text-gray-600 mb-6">
              Please sign in with Google to access your calendar and start planning.
            </p>
            <div className="space-y-4">
              <button
                onClick={() => window.location.href = '/api/auth/google'}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Sign in with Google
              </button>
              <button
                onClick={async () => {
                  try {
                    const response = await fetch('/api/auth/dev-login', { method: 'POST' });
                    const result = await response.json();
                    if (result.success) {
                      toast({
                        title: "Development Login Successful",
                        description: "You are now logged in with development credentials."
                      });
                      refetchUser();
                    } else {
                      throw new Error(result.message || 'Login failed');
                    }
                  } catch (error) {
                    toast({
                      title: "Login Error",
                      description: error instanceof Error ? error.message : "Could not log in",
                      variant: "destructive"
                    });
                  }
                }}
                className="w-full px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
              >
                Development Login
              </button>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <ErrorBoundary onError={(error, errorInfo) => {
      console.error('Planner component error:', error, errorInfo);
      toast({
        title: "Application Error",
        description: "An unexpected error occurred. The page will reload automatically.",
        variant: "destructive"
      });
    }}>
      <MainLayout>
        <div className="flex flex-col items-center justify-center p-8 text-center min-h-screen">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
            <h1 className="text-xl font-semibold text-gray-900 mb-4">
              reMarkable Pro Digital Planner
            </h1>
            <p className="text-gray-600 mb-6">
              Welcome {authenticatedUser?.name || authenticatedUser?.email}! 
              Your planner is loading...
            </p>
            <div className="space-y-4">
              <div className="text-sm text-gray-500">
                Auth Status: {authStatus.authenticated ? 'Connected' : 'Not connected'}
              </div>
              <div className="text-sm text-gray-500">
                Events: {state.events.length}
              </div>
              <div className="text-sm text-gray-500">
                View Mode: {state.viewMode}
              </div>
              <div className="text-sm text-gray-500">
                Selected Date: {state.selectedDate.toDateString()}
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    </ErrorBoundary>
  );
}