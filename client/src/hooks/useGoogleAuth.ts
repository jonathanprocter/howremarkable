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
      const data = await response.json();
      setAuthStatus(data);
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
      // Refresh auth status
      setTimeout(checkAuthStatus, 100);
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
        throw new Error('Failed to fetch calendar events');
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

  return {
    authStatus,
    isLoading,
    connectGoogle,
    logout,
    fetchCalendarEvents,
    uploadToDrive,
    refreshAuthStatus: checkAuthStatus
  };
};