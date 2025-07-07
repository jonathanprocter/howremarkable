import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface AuthUser {
  id: string;
  email: string;
  name: string;
}

export const useGoogleAuth = () => {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(true);

  // Get authentication status
  const { data: authData, isLoading: authLoading, error: authError } = useQuery({
    queryKey: ['/api/auth/status'],
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  useEffect(() => {
    if (!authLoading) {
      setIsLoading(false);
    }
  }, [authLoading]);

  const connectGoogle = () => {
    window.location.href = '/api/auth/google';
  };

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/auth/logout', { 
        method: 'POST',
        credentials: 'include' 
      });
      if (!response.ok) {
        throw new Error('Logout failed');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/calendar/events'] });
    },
  });

  const disconnect = () => {
    disconnectMutation.mutate();
  };

  // Provide default values to prevent undefined errors
  const isAuthenticated = Boolean(authData?.authenticated);
  const user = authData?.user as AuthUser | null;

  return {
    isAuthenticated,
    user,
    isLoading: isLoading || authLoading,
    error: authError,
    connectGoogle,
    disconnect,
    isDisconnecting: disconnectMutation.isPending
  };
};