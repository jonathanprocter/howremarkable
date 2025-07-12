/**
 * Execute comprehensive audit check to identify issues
 * This script will be executed via browser console
 */

// Main audit execution function
async function executeAuditCheck() {
  console.log('🔍 Starting Comprehensive Audit Check...');
  
  // Check audit system availability
  if (typeof window.pixelPerfectAuditSystem === 'undefined') {
    console.log('❌ Pixel-perfect audit system not available');
    return { error: 'Audit system not found' };
  }
  
  console.log('✅ Audit system available');
  
  try {
    // Step 1: Extract dashboard measurements
    console.log('📐 Extracting dashboard measurements...');
    const measurements = await window.pixelPerfectAuditSystem.extractDashboardMeasurements();
    console.log('✅ Dashboard measurements extracted:', measurements);
    
    // Step 2: Generate pixel-perfect PDF configuration
    console.log('📄 Generating pixel-perfect PDF configuration...');
    const pdfConfig = window.pixelPerfectAuditSystem.generatePixelPerfectConfig();
    console.log('✅ PDF configuration generated:', pdfConfig);
    
    // Step 3: Run pixel-perfect audit
    console.log('🎯 Running pixel-perfect audit...');
    const auditResult = await window.pixelPerfectAuditSystem.runPixelPerfectAudit(pdfConfig);
    console.log('✅ Pixel-perfect audit completed:', auditResult);
    
    // Step 4: Analyze results
    const issues = [];
    
    if (auditResult.score < 100) {
      console.log('⚠️ Issues detected - Score:', auditResult.score + '%');
      console.log('🔧 Inconsistencies found:', auditResult.inconsistencies);
      
      // Collect all inconsistencies
      auditResult.inconsistencies.forEach(inconsistency => {
        issues.push({
          type: 'pixel-perfect',
          property: inconsistency.property,
          expected: inconsistency.expected,
          actual: inconsistency.actual,
          difference: inconsistency.difference,
          severity: inconsistency.severity || 'medium'
        });
      });
      
      console.log('🔧 Total issues to fix:', issues.length);
    } else {
      console.log('✅ Perfect score achieved:', auditResult.score + '%');
    }
    
    // Step 5: Check comprehensive audit if available
    if (window.comprehensiveAuditSystem) {
      console.log('🔍 Running comprehensive audit...');
      try {
        const comprehensiveResult = await window.comprehensiveAuditSystem.runComprehensiveAudit();
        console.log('✅ Comprehensive audit completed:', comprehensiveResult);
        
        if (comprehensiveResult.score < 100) {
          console.log('⚠️ Comprehensive issues detected - Score:', comprehensiveResult.score + '%');
          
          // Add comprehensive issues
          if (comprehensiveResult.issues) {
            comprehensiveResult.issues.forEach(issue => {
              issues.push({
                type: 'comprehensive',
                category: issue.category,
                description: issue.description,
                severity: issue.severity || 'medium'
              });
            });
          }
        }
      } catch (error) {
        console.log('⚠️ Comprehensive audit failed:', error.message);
      }
    }
    
    // Step 6: Return results
    const finalResults = {
      pixelPerfectScore: auditResult.score,
      totalIssues: issues.length,
      issues: issues,
      measurements: measurements,
      pdfConfig: pdfConfig,
      timestamp: new Date().toISOString()
    };
    
    console.log('📊 Final Audit Results:', finalResults);
    
    // Store results globally for access
    window.auditResults = finalResults;
    
    if (issues.length > 0) {
      console.log('🔧 Issues found that need fixing:');
      issues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue.type} - ${issue.property || issue.category}:`, issue);
      });
    } else {
      console.log('✅ No issues found - System is pixel-perfect!');
    }
    
    return finalResults;
    
  } catch (error) {
    console.log('❌ Audit execution failed:', error.message);
    return { error: error.message };
  }
}

// Execute the audit check
executeAuditCheck().then(results => {
  console.log('🎉 Audit check complete!');
  
  if (results.error) {
    console.log('❌ Audit failed:', results.error);
  } else if (results.totalIssues > 0) {
    console.log('🔧 Found', results.totalIssues, 'issues to fix');
    console.log('📋 Access full results via: window.auditResults');
  } else {
    console.log('✅ No issues found - System is perfect!');
  }
}).catch(error => {
  console.log('❌ Audit execution error:', error);
});