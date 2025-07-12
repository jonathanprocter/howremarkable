/**
 * Run comprehensive audit system to identify issues
 */

// Load and run the audit system
const auditScript = `
console.log('🔍 Starting Comprehensive Audit System...');

// Check if audit systems are available
if (typeof window.pixelPerfectAuditSystem === 'undefined') {
  console.log('❌ Pixel-perfect audit system not found');
} else {
  console.log('✅ Pixel-perfect audit system available');
}

if (typeof window.comprehensiveAuditSystem === 'undefined') {
  console.log('❌ Comprehensive audit system not found');
} else {
  console.log('✅ Comprehensive audit system available');
}

// Run pixel-perfect audit
async function runPixelPerfectAudit() {
  try {
    console.log('🎯 Running Pixel-Perfect Audit...');
    
    // Extract dashboard measurements
    const measurements = await window.pixelPerfectAuditSystem.extractDashboardMeasurements();
    console.log('📐 Dashboard measurements:', measurements);
    
    // Generate PDF config
    const pdfConfig = window.pixelPerfectAuditSystem.generatePixelPerfectConfig();
    console.log('📄 PDF configuration:', pdfConfig);
    
    // Run audit
    const auditResult = await window.pixelPerfectAuditSystem.runPixelPerfectAudit(pdfConfig);
    console.log('🎯 Pixel-Perfect Audit Result:', auditResult);
    
    if (auditResult.score < 100) {
      console.log('⚠️ Issues found - Score:', auditResult.score + '%');
      console.log('🔧 Inconsistencies to fix:', auditResult.inconsistencies);
    } else {
      console.log('✅ Perfect score achieved:', auditResult.score + '%');
    }
    
    return auditResult;
    
  } catch (error) {
    console.log('❌ Pixel-perfect audit failed:', error.message);
    return null;
  }
}

// Run comprehensive audit
async function runComprehensiveAudit() {
  try {
    console.log('🔍 Running Comprehensive Audit...');
    
    const auditResult = await window.comprehensiveAuditSystem.runComprehensiveAudit();
    console.log('🔍 Comprehensive Audit Result:', auditResult);
    
    if (auditResult.score < 100) {
      console.log('⚠️ Issues found - Score:', auditResult.score + '%');
      console.log('🔧 Issues to fix:', auditResult.issues);
    } else {
      console.log('✅ Perfect score achieved:', auditResult.score + '%');
    }
    
    return auditResult;
    
  } catch (error) {
    console.log('❌ Comprehensive audit failed:', error.message);
    return null;
  }
}

// Run both audits
async function runAllAudits() {
  console.log('🚀 Running All Audit Systems...');
  
  const pixelPerfectResult = await runPixelPerfectAudit();
  const comprehensiveResult = await runComprehensiveAudit();
  
  console.log('📊 Final Audit Summary:');
  console.log('- Pixel-Perfect Score:', pixelPerfectResult ? pixelPerfectResult.score + '%' : 'Failed');
  console.log('- Comprehensive Score:', comprehensiveResult ? comprehensiveResult.score + '%' : 'Failed');
  
  // Collect all issues
  const allIssues = [];
  if (pixelPerfectResult && pixelPerfectResult.inconsistencies) {
    allIssues.push(...pixelPerfectResult.inconsistencies);
  }
  if (comprehensiveResult && comprehensiveResult.issues) {
    allIssues.push(...comprehensiveResult.issues);
  }
  
  if (allIssues.length > 0) {
    console.log('🔧 Total Issues Found:', allIssues.length);
    console.log('📋 Issues to Fix:', allIssues);
    
    // Store results for developer access
    window.auditResults = {
      pixelPerfect: pixelPerfectResult,
      comprehensive: comprehensiveResult,
      allIssues: allIssues
    };
    
    return allIssues;
  } else {
    console.log('✅ No issues found - System is perfect!');
    return [];
  }
}

// Execute the audit
runAllAudits().then(issues => {
  console.log('🎉 Audit complete!');
  if (issues.length > 0) {
    console.log('🔧 Ready to fix', issues.length, 'issues');
  } else {
    console.log('✅ No fixes needed');
  }
}).catch(error => {
  console.log('❌ Audit execution failed:', error);
});
`;

console.log(auditScript);
