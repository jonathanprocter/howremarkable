import { useState, useEffect } from 'react';

interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  googleId?: string;
  accessToken?: string;
}

interface UseAuthenticatedUserReturn {
  user: AuthenticatedUser | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useAuthenticatedUser = (): UseAuthenticatedUserReturn => {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch('/api/auth/status', {
        signal: controller.signal,
        credentials: 'include', // Include cookies for session
        headers: {
          'Content-Type': 'application/json',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Authentication check failed: ${response.status}`);
      }

      const authData = await response.json();

      if (authData.authenticated && authData.user) {
        setUser(authData.user);
      } else {
        // If not authenticated, try development auto-login
        console.log('Not authenticated, attempting auto-login...');
        try {
          const devLoginResponse = await fetch('/api/auth/dev-login', { 
            method: 'POST',
            credentials: 'include'
          });
          if (devLoginResponse.ok) {
            const devResult = await devLoginResponse.json();
            if (devResult.success) {
              console.log('Auto-login successful');
              setUser(devResult.user);
              return; // Successfully logged in
            }
          }
        } catch (autoLoginError) {
          console.log('Auto-login failed:', autoLoginError);
        }
        setUser(null);
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        setError('Authentication check timed out');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to check authentication');
      }
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  return {
    user,
    isLoading,
    error,
    refetch: fetchUser
  };
};