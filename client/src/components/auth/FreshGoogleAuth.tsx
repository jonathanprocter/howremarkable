import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';

interface AuthStatus {
  isConnected: boolean;
  eventCount?: number;
  error?: string;
  loading?: boolean;
}

export function FreshGoogleAuth() {
  const [authStatus, setAuthStatus] = useState<AuthStatus>({ isConnected: false });
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    // Check URL parameters for auth results
    const urlParams = new URLSearchParams(window.location.search);
    const authResult = urlParams.get('google_auth');
    
    if (authResult === 'success') {
      setAuthStatus({ isConnected: true });
      testConnection();
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    } else if (authResult === 'error') {
      setAuthStatus({ isConnected: false, error: 'Authentication failed' });
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const startFreshAuth = () => {
    console.log('🚀 Starting fresh Google OAuth...');
    setAuthStatus({ isConnected: false, loading: true });
    window.location.href = '/api/auth/google/fresh';
  };

  const testConnection = async () => {
    setTesting(true);
    try {
      const response = await fetch('/api/auth/google/fresh-test');
      const data = await response.json();
      
      if (data.success) {
        setAuthStatus({
          isConnected: true,
          eventCount: data.eventCount,
          error: undefined
        });
      } else {
        setAuthStatus({
          isConnected: false,
          error: data.error || 'Connection test failed'
        });
      }
    } catch (error) {
      setAuthStatus({
        isConnected: false,
        error: 'Failed to test connection'
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ExternalLink className="h-5 w-5" />
          Google Calendar Connection
        </CardTitle>
        <CardDescription>
          Connect your Google Calendar to sync events
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {authStatus.loading && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Connecting to Google Calendar...
            </AlertDescription>
          </Alert>
        )}

        {authStatus.isConnected ? (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              ✅ Google Calendar connected successfully!
              {authStatus.eventCount !== undefined && (
                <span className="block mt-1">
                  Found {authStatus.eventCount} events
                </span>
              )}
            </AlertDescription>
          </Alert>
        ) : authStatus.error ? (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {authStatus.error}
            </AlertDescription>
          </Alert>
        ) : (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Not connected to Google Calendar
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          {!authStatus.isConnected && (
            <Button 
              onClick={startFreshAuth}
              disabled={authStatus.loading}
              className="w-full"
            >
              {authStatus.loading ? 'Connecting...' : 'Connect Google Calendar'}
            </Button>
          )}
          
          <Button 
            onClick={testConnection}
            disabled={testing}
            variant="outline"
            className="w-full"
          >
            {testing ? 'Testing...' : 'Test Connection'}
          </Button>
        </div>

        <div className="text-xs text-gray-500 space-y-1">
          <p>• This will open Google's authorization page</p>
          <p>• You'll be redirected back after authorization</p>
          <p>• Your calendar events will sync immediately</p>
        </div>
      </CardContent>
    </Card>
  );
}