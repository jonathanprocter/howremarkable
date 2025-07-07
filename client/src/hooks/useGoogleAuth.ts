import { useState, useEffect } from 'react';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface GoogleUser {
  id: string;
  email: string;
  name: string;
}

interface AuthStatus {
  authenticated: boolean;
  user: GoogleUser | null;
}

export const useGoogleAuth = () => {
  const [authStatus, setAuthStatus] = useState<AuthStatus>({
    authenticated: false,
    user: null
  });
  const [isLoading, setIsLoading] = useState(true);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/status');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setAuthStatus(data);
      
      // Save authentication timestamp for session persistence
      if (data.authenticated) {
        localStorage.setItem('google_auth_recent', Date.now().toString());
      }
    } catch (error) {
      console.error('Auth status check failed:', error);
      setAuthStatus({ authenticated: false, user: null });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuthStatus();
    
    // Check for connection success in URL params
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('connected') === 'true') {
      // Remove the parameter from URL
      window.history.replaceState({}, document.title, '/');
      // Force authentication status to true since we know the user just authenticated
      setAuthStatus({ authenticated: true, user: { id: 'google', email: 'authenticated', name: 'Google User' } });
      // Also refresh auth status after a delay
      setTimeout(checkAuthStatus, 2000);
    } else if (urlParams.get('error') === 'auth_failed') {
      // Handle authentication failure
      console.error('Google OAuth authentication failed - check Google Cloud Console configuration');
      window.history.replaceState({}, document.title, '/');
    }
  }, []);

  const connectGoogle = () => {
    window.location.href = '/api/auth/google';
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST'
      });
      setAuthStatus({ authenticated: false, user: null });
      queryClient.invalidateQueries();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const fetchCalendarEvents = async (timeMin?: string, timeMax?: string) => {
    try {
      const params = new URLSearchParams();
      if (timeMin) params.append('timeMin', timeMin);
      if (timeMax) params.append('timeMax', timeMax);

      const response = await fetch(`/api/calendar/events?${params}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch calendar events: ${response.status} ${errorText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Calendar fetch failed:', error);
      throw error;
    }
  };

  const uploadToDrive = async (filename: string, content: string, mimeType: string = 'application/pdf') => {
    try {
      const response = await fetch('/api/drive/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          filename,
          content,
          mimeType
        })
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Drive upload failed:', error);
      throw error;
    }
  };

  const updateCalendarEvent = async (eventId: string, startTime: Date, endTime: Date, calendarId: string) => {
    try {
      const response = await fetch(`/api/calendar/events/${eventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          calendarId
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update calendar event: ${response.status} ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Update calendar event failed:', error);
      throw error;
    }
  };

  return {
    authStatus,
    isLoading,
    connectGoogle,
    logout,
    fetchCalendarEvents,
    uploadToDrive,
    updateCalendarEvent,
    refreshAuthStatus: checkAuthStatus
  };
};