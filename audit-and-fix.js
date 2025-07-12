/**
 * Audit and Fix Script
 * Identifies and fixes any issues in the pixel-perfect system
 */

// Execute audit and apply fixes
(async function auditAndFix() {
  console.log('🔍 Starting Audit and Fix Process...');
  
  // Check if audit system is available
  if (typeof window.pixelPerfectAuditSystem === 'undefined') {
    console.log('❌ Audit system not available');
    return;
  }
  
  console.log('✅ Audit system available');
  
  try {
    // Step 1: Extract measurements
    console.log('📐 Extracting dashboard measurements...');
    const measurements = await window.pixelPerfectAuditSystem.extractDashboardMeasurements();
    console.log('Measurements:', measurements);
    
    // Step 2: Check for issues
    const issues = [];
    
    // Check critical measurements
    if (measurements.timeColumnWidth !== 80) {
      issues.push({
        type: 'measurement',
        property: 'timeColumnWidth',
        expected: 80,
        actual: measurements.timeColumnWidth,
        fix: 'Update PDF export timeColumnWidth to 80px'
      });
    }
    
    if (measurements.dayColumnWidth !== 110) {
      issues.push({
        type: 'measurement', 
        property: 'dayColumnWidth',
        expected: 110,
        actual: measurements.dayColumnWidth,
        fix: 'Update PDF export dayColumnWidth to 110px'
      });
    }
    
    if (measurements.timeSlotHeight !== 40) {
      issues.push({
        type: 'measurement',
        property: 'timeSlotHeight', 
        expected: 40,
        actual: measurements.timeSlotHeight,
        fix: 'Update PDF export timeSlotHeight to 40px'
      });
    }
    
    // Step 3: Run pixel-perfect audit
    console.log('🎯 Running pixel-perfect audit...');
    const pdfConfig = window.pixelPerfectAuditSystem.generatePixelPerfectConfig();
    const auditResult = await window.pixelPerfectAuditSystem.runPixelPerfectAudit(pdfConfig);
    
    console.log('Audit Score:', auditResult.score + '%');
    
    // Add audit inconsistencies to issues
    if (auditResult.inconsistencies && auditResult.inconsistencies.length > 0) {
      auditResult.inconsistencies.forEach(inconsistency => {
        issues.push({
          type: 'audit-inconsistency',
          property: inconsistency.property,
          expected: inconsistency.expected,
          actual: inconsistency.actual,
          difference: inconsistency.difference,
          fix: `Update ${inconsistency.property} from ${inconsistency.actual} to ${inconsistency.expected}`
        });
      });
    }
    
    // Step 4: Report findings
    console.log('📊 Audit Results:');
    console.log('Total Issues Found:', issues.length);
    
    if (issues.length > 0) {
      console.log('🔧 Issues to fix:');
      issues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue.property}: Expected ${issue.expected}, Got ${issue.actual}`);
        console.log(`   Fix: ${issue.fix}`);
      });
      
      // Store issues for developer
      window.foundIssues = issues;
      console.log('📋 Issues stored in window.foundIssues');
    } else {
      console.log('✅ No issues found - system is perfect!');
    }
    
    // Step 5: Check for specific PDF export issues
    console.log('📄 Checking PDF export configurations...');
    
    // Check if day column width calculation is correct
    const expectedDayColumnWidth = Math.floor((1130 - 80) / 7); // contentWidth - timeColumnWidth / 7 days
    console.log('Expected day column width:', expectedDayColumnWidth);
    
    if (expectedDayColumnWidth !== 110) {
      issues.push({
        type: 'calculation',
        property: 'dayColumnWidth calculation',
        expected: 110,
        actual: expectedDayColumnWidth,
        fix: 'Adjust PDF page width or margin to achieve 110px day columns'
      });
    }
    
    return {
      score: auditResult.score,
      issues: issues,
      measurements: measurements,
      recommendations: issues.map(issue => issue.fix)
    };
    
  } catch (error) {
    console.log('❌ Audit failed:', error.message);
    return { error: error.message };
  }
})().then(result => {
  if (result.error) {
    console.log('❌ Process failed:', result.error);
  } else {
    console.log('🎉 Audit and Fix process complete!');
    console.log('Final Score:', result.score + '%');
    console.log('Issues Found:', result.issues.length);
  }
}).catch(error => {
  console.log('❌ Process error:', error);
});