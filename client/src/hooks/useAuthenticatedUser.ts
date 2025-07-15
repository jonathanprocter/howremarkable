import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface User {
  id: string;
  email: string;
  name: string;
  displayName?: string;
}

interface AuthResponse {
  isAuthenticated: boolean;
  user: User | null;
  hasTokens: boolean;
  debug?: any;
}

export const useAuthenticatedUser = () => {
  const { data, isLoading, error, refetch } = useQuery<AuthResponse>({
    queryKey: ['/api/auth/status'],
    queryFn: async () => {
      const response = await fetch('/api/auth/status', {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache',
          'Cookie': document.cookie // Ensure cookies are sent
        }
      });

      if (!response.ok) {
        throw new Error('Auth status check failed');
      }

      const result = await response.json();

      // If not authenticated, try deployment fix once
      if (!result.isAuthenticated) {
        try {
          const deploymentResponse = await fetch('/api/auth/deployment-fix', {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache'
            }
          });

          if (deploymentResponse.ok) {
            const deploymentResult = await deploymentResponse.json();
            if (deploymentResult.success && deploymentResult.user) {
              // Return authenticated result directly
              return {
                isAuthenticated: true,
                user: deploymentResult.user,
                hasTokens: true
              };
            }
          }
        } catch (error) {
          console.error('Auth deployment fix failed:', error);
        }
      }

      return result;
    },
    retry: (failureCount, error) => {
      // Retry up to 3 times
      if (failureCount < 3) {
        console.log(`🔄 Auth query retry ${failureCount + 1}/3`);
        return true;
      }
      return false;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // 1 minute
    refetchOnWindowFocus: true,
  });

  const user = data?.isAuthenticated ? data.user : null;
  const hasTokens = data?.hasTokens || false;

  return {
    user,
    hasTokens,
    isLoading,
    error,
    refetch,
    isAuthenticated: !!user,
    authData: data
  };
};