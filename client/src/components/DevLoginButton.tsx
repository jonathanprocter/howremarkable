
import React from 'react';
import { Button } from './ui/button';

export function DevLoginButton() {
  const handleDevLogin = async () => {
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
        // Reload page to update authentication state
        window.location.reload();
      } else {
        console.error('❌ Development login failed');
      }
    } catch (error) {
      console.error('❌ Development login error:', error);
    }
  };

  return (
    <Button 
      onClick={handleDevLogin}
      variant="outline"
      className="mb-4"
    >
      🔧 Dev Login
    </Button>
  );
}
