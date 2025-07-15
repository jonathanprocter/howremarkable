
// REMOVED: DevLoginButton component - NO DEV AUTHENTICATION ALLOWED
// This component is no longer needed as all authentication must go through Google OAuth

import React from 'react';
import { Button } from './ui/button';

export function DevLoginButton() {
  return (
    <Button 
      disabled
      className="bg-gray-400 text-gray-600 cursor-not-allowed"
    >
      Dev Login Disabled
    </Button>
  );
}
