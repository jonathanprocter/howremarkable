import { useQuery } from '@tanstack/react-query';

interface AuthResponse {
  isAuthenticated: boolean;
  user?: {
    id: string;
    email: string;
    name: string;
    displayName: string;
    accessToken?: string;
    refreshToken?: string;
    provider?: string;
  };
  hasTokens: boolean;
}

export const useAuthenticatedUser = () => {
  const { data, isLoading, error, refetch } = useQuery<AuthResponse>({
    queryKey: ['/api/auth/status'],
    queryFn: async () => {
      const response = await fetch('/api/auth/status');
      if (!response.ok) {
        throw new Error('Failed to fetch auth status');
      }
      return response.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1
  });

  const user = data?.user;
  const isAuthenticated = data?.isAuthenticated || false;
  const hasTokens = data?.hasTokens || false;

  return {
    user,
    isAuthenticated,
    hasTokens,
    isLoading,
    error,
    refetch
  };
};