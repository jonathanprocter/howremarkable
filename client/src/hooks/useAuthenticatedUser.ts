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

      // Try multiple times to get authentication status
      let authData = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const response = await fetch('/api/auth/status', {
            signal: controller.signal,
            credentials: 'include', // Include cookies for session authentication
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache',
            },
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            throw new Error(`Authentication check failed: ${response.status}`);
          }

          authData = await response.json();
          console.log(`🔍 Auth attempt ${attempt + 1}:`, authData);
          
          if (authData.isAuthenticated && authData.user) {
            break; // Found valid authentication
          }
          
          // Wait before retry
          if (attempt < 2) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        } catch (attemptError) {
          console.warn(`Auth attempt ${attempt + 1} failed:`, attemptError);
          if (attempt === 2) throw attemptError;
        }
      }

      if (authData && authData.isAuthenticated && authData.user) {
        console.log('✅ User authenticated:', authData.user.email);
        setUser(authData.user);
      } else {
        console.log('❌ User not authenticated after all attempts');
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