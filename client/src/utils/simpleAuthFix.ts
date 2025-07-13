/**
 * Simple Authentication Fix System
 * Direct approach to fix session synchronization issues
 */

export class SimpleAuthFix {
  
  static async fixAuthenticationNow(): Promise<boolean> {
    console.log('🔧 SIMPLE AUTH FIX: Starting direct authentication fix...');
    
    try {
      // Step 1: Force refresh the authentication hook
      if ((window as any).refreshAuth) {
        console.log('🔧 Refreshing authentication hook...');
        await (window as any).refreshAuth();
      }
      
      // Step 2: Clear and refresh all queries
      if ((window as any).queryClient) {
        console.log('🔧 Clearing all queries...');
        (window as any).queryClient.clear();
        await (window as any).queryClient.invalidateQueries();
      }
      
      // Step 3: Wait for synchronization
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Step 4: Test if fix worked
      const authTest = await fetch('/api/auth/status', {
        credentials: 'include'
      });
      
      if (authTest.ok) {
        const authData = await authTest.json();
        if (authData.isAuthenticated && authData.user) {
          console.log('✅ SIMPLE AUTH FIX: Authentication restored successfully!');
          return true;
        }
      }
      
      // Step 5: If still not working, try page reload
      console.log('🔧 Authentication still not synchronized, reloading page...');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
      return false;
      
    } catch (error) {
      console.error('❌ SIMPLE AUTH FIX: Error during authentication fix:', error);
      
      // Last resort: reload the page
      console.log('🔧 Last resort: Reloading page to fix authentication...');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
      return false;
    }
  }
  
  static async testAuthenticationStatus(): Promise<{isAuthenticated: boolean; user: any}> {
    try {
      const response = await fetch('/api/auth/status', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        return {
          isAuthenticated: data.isAuthenticated,
          user: data.user
        };
      }
      
      return { isAuthenticated: false, user: null };
    } catch (error) {
      console.error('❌ Error testing auth status:', error);
      return { isAuthenticated: false, user: null };
    }
  }
}

// Export singleton instance
export const simpleAuthFix = new SimpleAuthFix();