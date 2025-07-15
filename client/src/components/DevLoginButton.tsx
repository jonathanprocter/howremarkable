
import React, { useState } from 'react';
import { Button } from './ui/button';

export function DevLoginButton() {
  const [isLogging, setIsLogging] = useState(false);

  const handleDevLogin = async () => {
    setIsLogging(true);
    window.location.href = '/api/auth/google';
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
