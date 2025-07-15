import { Button } from '@/components/ui/button';

export function CleanAuthButton() {
  const handleGoogleOAuth = () => {
    console.log('🔗 Starting Google OAuth flow');
    window.location.href = '/api/auth/google';
  };

  return (
    <Button 
      onClick={handleGoogleOAuth}
      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
    >
      🔐 Sign in with Google
    </Button>
  );
}