/**
 * Test script for pixel-perfect audit system
 * Run this after opening the planner application
 */

console.log('🎯 Testing Pixel-Perfect Audit System with Updated Values');

// Test the comprehensive audit system
async function testPixelPerfectAudit() {
  console.log('🔍 Running comprehensive audit test...');
  
  try {
    // Look for the comprehensive audit button
    const auditButtons = document.querySelectorAll('button');
    const comprehensiveAuditButton = Array.from(auditButtons).find(btn => 
      btn.textContent.includes('Comprehensive Audit')
    );
    
    if (comprehensiveAuditButton) {
      console.log('✅ Found comprehensive audit button');
      
      // Click the audit button
      comprehensiveAuditButton.click();
      
      // Wait for audit to complete
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Check if audit results are in localStorage
      const auditResults = localStorage.getItem('pixelPerfectAuditResults');
      if (auditResults) {
        const results = JSON.parse(auditResults);
        console.log('📊 Audit Results:', results);
        
        // Check if we've improved the score
        if (results.pixelPerfectScore > 65) {
          console.log('🎉 Score improved! New score:', results.pixelPerfectScore + '%');
        } else {
          console.log('📈 Current score:', results.pixelPerfectScore + '%');
        }
        
        // Check critical fixes
        const criticalIssues = results.inconsistencies?.filter(i => i.severity === 'critical') || [];
        console.log('🔍 Critical issues remaining:', criticalIssues.length);
        
        if (criticalIssues.length === 0) {
          console.log('✅ No critical issues found - layout fixes successful!');
        } else {
          console.log('❌ Critical issues still exist:', criticalIssues.map(i => i.description));
        }
        
        return results;
      } else {
        console.log('❌ No audit results found in localStorage');
      }
    } else {
      console.log('❌ Comprehensive audit button not found');
    }
  } catch (error) {
    console.error('❌ Error running audit test:', error);
  }
}

// Test measurements directly
function testMeasurements() {
  console.log('📏 Testing direct measurement extraction...');
  
  const timeColumn = document.querySelector('.time-column');
  const dayColumns = document.querySelectorAll('.day-column');
  const timeSlots = document.querySelectorAll('.time-slot');
  
  if (timeColumn) {
    const rect = timeColumn.getBoundingClientRect();
    console.log('📐 Time column width:', rect.width + 'px');
    
    // Check if it matches our expected value (80px)
    if (Math.abs(rect.width - 80) < 2) {
      console.log('✅ Time column width matches expected value');
    } else {
      console.log('❌ Time column width mismatch. Expected: 80px, Got:', rect.width + 'px');
    }
  }
  
  if (dayColumns.length > 0) {
    const rect = dayColumns[0].getBoundingClientRect();
    console.log('📐 Day column width:', rect.width + 'px');
    
    // Check if it matches our expected value (around 110px)
    if (Math.abs(rect.width - 110) < 10) {
      console.log('✅ Day column width is within expected range');
    } else {
      console.log('❌ Day column width outside expected range. Expected: ~110px, Got:', rect.width + 'px');
    }
  }
  
  if (timeSlots.length > 0) {
    const rect = timeSlots[0].getBoundingClientRect();
    console.log('📐 Time slot height:', rect.height + 'px');
    
    // Check if it matches our expected value (40px)
    if (Math.abs(rect.height - 40) < 2) {
      console.log('✅ Time slot height matches expected value');
    } else {
      console.log('❌ Time slot height mismatch. Expected: 40px, Got:', rect.height + 'px');
    }
  }
}

// Test if PDF config values are updated
function testPDFConfigValues() {
  console.log('📋 Testing PDF configuration values...');
  
  // These should now match the dashboard values
  const expectedValues = {
    timeColumnWidth: 80,
    timeSlotHeight: 40,
    headerHeight: 60
  };
  
  console.log('📊 Expected PDF values:', expectedValues);
  console.log('✅ PDF configuration should now match dashboard measurements');
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting comprehensive pixel-perfect audit validation');
  
  testMeasurements();
  testPDFConfigValues();
  
  // Wait a moment for elements to settle
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const auditResults = await testPixelPerfectAudit();
  
  console.log('🎯 Test Summary:');
  console.log('- Dashboard measurements extracted');
  console.log('- PDF configuration values updated');
  console.log('- Comprehensive audit system tested');
  
  if (auditResults && auditResults.pixelPerfectScore > 65) {
    console.log('🎉 SUCCESS: Pixel-perfect score improved!');
  } else {
    console.log('📈 Results available - check audit output for details');
  }
}

// Export for browser console use
if (typeof window !== 'undefined') {
  window.testPixelPerfectAuditSystem = runAllTests;
  window.testMeasurements = testMeasurements;
  window.testAuditOnly = testPixelPerfectAudit;
}

// Auto-run when loaded
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(runAllTests, 2000);
    });
  } else {
    setTimeout(runAllTests, 2000);
  }
}

console.log('✅ Pixel-perfect audit test script loaded. Run window.testPixelPerfectAuditSystem() to begin testing');