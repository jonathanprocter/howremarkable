
import React, { useState } from 'react';
import { Button } from './ui/button';

export function DevLoginButton() {
  const [isLogging, setIsLogging] = useState(false);

  const handleDevLogin = async () => {
    setIsLogging(true);
    try {
      const response = await fetch('/api/auth/dev-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Development login successful:', data);
        // Small delay to ensure session is saved
        setTimeout(() => {
          window.location.reload();
        }, 200);
      } else {
        console.error('❌ Development login failed');
        setIsLogging(false);
      }
    } catch (error) {
      console.error('❌ Development login error:', error);
      setIsLogging(false);
    }
  };

  return (
    <Button 
      onClick={handleDevLogin}
      disabled={isLogging}
      className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
    >
      {isLogging ? '🔄 Logging in...' : '🔧 Quick Login'}
    </Button>
  );
}
