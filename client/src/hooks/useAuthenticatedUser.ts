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
        console.log('✅ User authenticated:', authData.user.email);
        setUser(authData.user);
      } else {
        console.log('❌ User not authenticated');
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