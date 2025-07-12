/**
 * Direct audit runner that executes immediately
 * Copy this into browser console to run audit
 */

(async function() {
  console.log('🔍 Running Audit System Check...');
  
  // Check if audit systems are available
  if (typeof window.pixelPerfectAuditSystem === 'undefined') {
    console.log('❌ Pixel-perfect audit system not found');
    return;
  }
  
  console.log('✅ Audit system found');
  
  try {
    // Extract dashboard measurements with fallback
    const measurements = await window.pixelPerfectAuditSystem.extractDashboardMeasurements();
    console.log('📐 Dashboard measurements:', measurements);
    
    // Generate PDF config
    const pdfConfig = window.pixelPerfectAuditSystem.generatePixelPerfectConfig();
    console.log('📄 PDF config generated');
    
    // Run audit
    const auditResult = await window.pixelPerfectAuditSystem.runPixelPerfectAudit(pdfConfig);
    console.log('🎯 Audit completed');
    console.log('Score:', auditResult.score + '%');
    
    if (auditResult.score < 100) {
      console.log('⚠️ Issues found:');
      auditResult.inconsistencies.forEach((issue, i) => {
        console.log(`${i+1}. ${issue.property}: Expected ${issue.expected}, Got ${issue.actual}`);
      });
      
      // Store issues for fixing
      window.auditIssues = auditResult.inconsistencies;
      console.log('🔧 Issues stored in window.auditIssues for fixing');
    } else {
      console.log('✅ Perfect score - no issues found!');
    }
    
    return auditResult;
    
  } catch (error) {
    console.log('❌ Audit failed:', error.message);
    console.log('Stack:', error.stack);
  }
})();