/**
 * Live audit execution script
 * This will run the audit system and identify issues
 */

// Run comprehensive audit analysis
async function runLiveAudit() {
  console.log('🔍 Starting Live Audit Analysis...');
  
  // Check for critical layout measurements
  console.log('📐 Checking layout measurements...');
  
  // Test DOM element detection
  const timeColumns = document.querySelectorAll('.time-column, [class*="time"], [class*="Time"]');
  const dayColumns = document.querySelectorAll('.day-column, [class*="day"], [class*="Day"]');
  const weeklyGrid = document.querySelector('.weekly-calendar-grid, .weekly-planner, [class*="weekly"]');
  
  console.log('DOM Elements Found:');
  console.log('- Time columns:', timeColumns.length);
  console.log('- Day columns:', dayColumns.length);  
  console.log('- Weekly grid:', weeklyGrid ? 'Found' : 'Not found');
  
  // Check for audit system availability
  if (typeof window.pixelPerfectAuditSystem !== 'undefined') {
    console.log('✅ Pixel-perfect audit system available');
    
    try {
      // Extract measurements
      const measurements = await window.pixelPerfectAuditSystem.extractDashboardMeasurements();
      console.log('📊 Extracted measurements:', measurements);
      
      // Generate config
      const config = window.pixelPerfectAuditSystem.generatePixelPerfectConfig();
      
      // Run audit
      const auditResult = await window.pixelPerfectAuditSystem.runPixelPerfectAudit(config);
      
      console.log('🎯 Audit Results:');
      console.log('Score:', auditResult.score + '%');
      console.log('Inconsistencies:', auditResult.inconsistencies?.length || 0);
      
      if (auditResult.inconsistencies && auditResult.inconsistencies.length > 0) {
        console.log('🔧 Issues to fix:');
        auditResult.inconsistencies.forEach((issue, index) => {
          console.log(`${index + 1}. ${issue.property}: Expected ${issue.expected}, Got ${issue.actual} (Diff: ${issue.difference})`);
        });
        
        return auditResult.inconsistencies;
      } else {
        console.log('✅ No issues found - system is perfect!');
        return [];
      }
    } catch (error) {
      console.log('❌ Audit execution failed:', error.message);
      return [{
        property: 'audit-system',
        issue: 'Audit system error: ' + error.message
      }];
    }
  } else {
    console.log('❌ Pixel-perfect audit system not available');
    return [{
      property: 'audit-system',
      issue: 'Audit system not initialized'
    }];
  }
}

// Execute the audit
runLiveAudit().then(issues => {
  if (issues.length > 0) {
    console.log('🔧 Found', issues.length, 'issues to fix');
    window.foundIssues = issues;
  } else {
    console.log('✅ No issues found');
  }
}).catch(error => {
  console.log('❌ Live audit failed:', error);
});