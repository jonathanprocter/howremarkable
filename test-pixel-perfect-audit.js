/**
 * Test script for pixel-perfect audit system
 * Run this after opening the planner application
 */

async function testPixelPerfectAudit() {
  try {
    console.log('🔍 STARTING PIXEL-PERFECT AUDIT TEST');
    console.log('='.repeat(80));
    
    // Wait for the app to load
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if audit function is available
    if (typeof window.testPixelPerfectAudit === 'function') {
      console.log('✅ Audit function found in window context');
      await window.testPixelPerfectAudit();
    } else {
      console.log('❌ Audit function not found, running manual test');
      
      // Manual test
      if (window.currentEvents && window.selectedDate) {
        console.log(`📊 Found ${window.currentEvents.length} events for ${window.selectedDate.toDateString()}`);
        
        // Import and run audit
        const { runPixelPerfectAudit } = await import('./client/src/utils/pixelPerfectAudit.js');
        const result = await runPixelPerfectAudit(window.selectedDate, window.currentEvents);
        
        console.log('🎯 AUDIT RESULTS:');
        console.log(`Score: ${result.percentage}%`);
        console.log(`Issues: ${result.issues.length}`);
        console.log(`Recommendations: ${result.recommendations.length}`);
        
        // Save results
        localStorage.setItem('auditResults', JSON.stringify(result));
        
      } else {
        console.log('❌ No events or selected date found in window context');
      }
    }
    
  } catch (error) {
    console.error('❌ Audit test failed:', error);
  }
}

// Run the test
testPixelPerfectAudit();