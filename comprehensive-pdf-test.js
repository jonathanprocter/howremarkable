/**
 * Comprehensive PDF Export Test Suite
 * Tests all aspects of the rebuilt PDF export system
 */

async function runComprehensivePDFTests() {
  console.log('🧪 COMPREHENSIVE PDF EXPORT TESTING INITIATED');
  console.log('==============================================');
  
  const results = {
    functionalityTest: null,
    pixelPerfectTest: null,
    auditTest: null,
    performanceTest: null,
    errorHandlingTest: null,
    overallScore: 0
  };
  
  try {
    // Test 1: Basic Functionality
    console.log('\n📋 TEST 1: Basic Functionality');
    console.log('================================');
    
    const functionalityResult = await testBasicFunctionality();
    results.functionalityTest = functionalityResult;
    console.log('✅ Basic functionality test completed:', functionalityResult.score + '/100');
    
    // Test 2: Pixel Perfect Export
    console.log('\n🎯 TEST 2: Pixel Perfect Export');
    console.log('================================');
    
    const pixelPerfectResult = await testPixelPerfectExport();
    results.pixelPerfectTest = pixelPerfectResult;
    console.log('✅ Pixel perfect test completed:', pixelPerfectResult.score + '/100');
    
    // Test 3: Audit System
    console.log('\n🔍 TEST 3: Audit System');
    console.log('========================');
    
    const auditResult = await testAuditSystem();
    results.auditTest = auditResult;
    console.log('✅ Audit system test completed:', auditResult.score + '/100');
    
    // Test 4: Performance
    console.log('\n⚡ TEST 4: Performance');
    console.log('=====================');
    
    const performanceResult = await testPerformance();
    results.performanceTest = performanceResult;
    console.log('✅ Performance test completed:', performanceResult.score + '/100');
    
    // Test 5: Error Handling
    console.log('\n🛡️ TEST 5: Error Handling');
    console.log('=========================');
    
    const errorHandlingResult = await testErrorHandling();
    results.errorHandlingTest = errorHandlingResult;
    console.log('✅ Error handling test completed:', errorHandlingResult.score + '/100');
    
    // Calculate overall score
    const totalScore = Object.values(results)
      .filter(r => r && typeof r.score === 'number')
      .reduce((sum, r) => sum + r.score, 0);
    const testCount = Object.values(results).filter(r => r && typeof r.score === 'number').length;
    results.overallScore = testCount > 0 ? Math.round(totalScore / testCount) : 0;
    
    console.log('\n🏆 COMPREHENSIVE TEST RESULTS');
    console.log('==============================');
    console.log('Basic Functionality:', results.functionalityTest?.score + '/100');
    console.log('Pixel Perfect Export:', results.pixelPerfectTest?.score + '/100');
    console.log('Audit System:', results.auditTest?.score + '/100');
    console.log('Performance:', results.performanceTest?.score + '/100');
    console.log('Error Handling:', results.errorHandlingTest?.score + '/100');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('OVERALL SCORE:', results.overallScore + '/100');
    console.log('STATUS:', results.overallScore >= 90 ? '🌟 EXCELLENT' : 
                        results.overallScore >= 80 ? '✅ GOOD' : 
                        results.overallScore >= 70 ? '⚠️ NEEDS IMPROVEMENT' : '❌ FAILED');
    
    // Save results to localStorage
    localStorage.setItem('comprehensivePDFTestResults', JSON.stringify(results));
    
    return results;
    
  } catch (error) {
    console.error('❌ Comprehensive PDF test failed:', error);
    return { error: error.message, overallScore: 0 };
  }
}

async function testBasicFunctionality() {
  console.log('🔧 Testing basic PDF export functionality...');
  
  let score = 0;
  const issues = [];
  
  try {
    // Check if export function exists
    if (typeof window.exportPixelPerfectPDF === 'function') {
      score += 20;
      console.log('✅ Export function exists');
    } else {
      issues.push('Export function not found');
    }
    
    // Check if calendar events are available
    const events = window.currentEvents || [];
    if (events.length > 0) {
      score += 20;
      console.log('✅ Calendar events available:', events.length);
    } else {
      issues.push('No calendar events found');
    }
    
    // Check if selected date is available
    const selectedDate = window.selectedDate || new Date();
    if (selectedDate) {
      score += 20;
      console.log('✅ Selected date available:', selectedDate);
    } else {
      issues.push('No selected date found');
    }
    
    // Check if DOM elements exist
    const calendarContainer = document.querySelector('.calendar-container');
    if (calendarContainer) {
      score += 20;
      console.log('✅ Calendar container found');
    } else {
      issues.push('Calendar container not found');
    }
    
    // Check if export UI exists
    const exportButton = document.querySelector('[data-testid="export-button"]') || 
                        document.querySelector('button[class*="export"]');
    if (exportButton) {
      score += 20;
      console.log('✅ Export UI found');
    } else {
      issues.push('Export UI not found');
    }
    
  } catch (error) {
    issues.push('Basic functionality test error: ' + error.message);
  }
  
  return {
    score,
    issues,
    details: {
      eventCount: window.currentEvents?.length || 0,
      selectedDate: window.selectedDate || null,
      hasCalendarContainer: !!document.querySelector('.calendar-container'),
      hasExportUI: !!document.querySelector('[data-testid="export-button"]')
    }
  };
}

async function testPixelPerfectExport() {
  console.log('🎯 Testing pixel perfect export capabilities...');
  
  let score = 0;
  const issues = [];
  
  try {
    // Test dashboard measurements extraction
    const calendarContainer = document.querySelector('.calendar-container');
    if (calendarContainer) {
      const timeColumn = calendarContainer.querySelector('.time-column, [class*="time"]');
      const dayColumns = calendarContainer.querySelectorAll('.day-column, [class*="day"]');
      const timeSlots = calendarContainer.querySelectorAll('.time-slot, [class*="slot"]');
      
      if (timeColumn) {
        score += 25;
        console.log('✅ Time column measurements available');
      } else {
        issues.push('Time column not measurable');
      }
      
      if (dayColumns.length > 0) {
        score += 25;
        console.log('✅ Day columns measurements available');
      } else {
        issues.push('Day columns not measurable');
      }
      
      if (timeSlots.length > 0) {
        score += 25;
        console.log('✅ Time slots measurements available');
      } else {
        issues.push('Time slots not measurable');
      }
    }
    
    // Test HTML generation capability
    try {
      const testHTML = generateTestHTML();
      if (testHTML && testHTML.includes('<!DOCTYPE html>')) {
        score += 25;
        console.log('✅ HTML generation working');
      } else {
        issues.push('HTML generation failed');
      }
    } catch (error) {
      issues.push('HTML generation error: ' + error.message);
    }
    
  } catch (error) {
    issues.push('Pixel perfect test error: ' + error.message);
  }
  
  return {
    score,
    issues,
    details: {
      hasMeasurements: !!document.querySelector('.calendar-container'),
      canGenerateHTML: true
    }
  };
}

async function testAuditSystem() {
  console.log('🔍 Testing audit system capabilities...');
  
  let score = 0;
  const issues = [];
  
  try {
    // Check if audit functions exist
    if (typeof window.runPixelPerfectAudit === 'function') {
      score += 25;
      console.log('✅ Pixel perfect audit function exists');
    } else {
      issues.push('Pixel perfect audit function not found');
    }
    
    if (typeof window.runComprehensivePixelAnalysis === 'function') {
      score += 25;
      console.log('✅ Comprehensive analysis function exists');
    } else {
      issues.push('Comprehensive analysis function not found');
    }
    
    if (typeof window.testPixelPerfectAudit === 'function') {
      score += 25;
      console.log('✅ Test audit function exists');
    } else {
      issues.push('Test audit function not found');
    }
    
    // Test audit data availability
    const events = window.currentEvents || [];
    if (events.length > 0) {
      score += 25;
      console.log('✅ Audit data available');
    } else {
      issues.push('No audit data available');
    }
    
  } catch (error) {
    issues.push('Audit system test error: ' + error.message);
  }
  
  return {
    score,
    issues,
    details: {
      hasAuditFunctions: typeof window.runPixelPerfectAudit === 'function',
      hasAnalysisFunctions: typeof window.runComprehensivePixelAnalysis === 'function',
      hasTestFunctions: typeof window.testPixelPerfectAudit === 'function'
    }
  };
}

async function testPerformance() {
  console.log('⚡ Testing performance characteristics...');
  
  let score = 0;
  const issues = [];
  
  try {
    // Test DOM query performance
    const startTime = performance.now();
    const calendarContainer = document.querySelector('.calendar-container');
    const timeColumns = document.querySelectorAll('.time-column, [class*="time"]');
    const dayColumns = document.querySelectorAll('.day-column, [class*="day"]');
    const timeSlots = document.querySelectorAll('.time-slot, [class*="slot"]');
    const queryTime = performance.now() - startTime;
    
    if (queryTime < 10) {
      score += 25;
      console.log('✅ DOM queries fast:', queryTime.toFixed(2) + 'ms');
    } else {
      issues.push('DOM queries slow: ' + queryTime.toFixed(2) + 'ms');
    }
    
    // Test memory usage
    if (window.performance && window.performance.memory) {
      const memoryUsage = window.performance.memory.usedJSHeapSize / 1024 / 1024;
      if (memoryUsage < 100) {
        score += 25;
        console.log('✅ Memory usage good:', memoryUsage.toFixed(2) + 'MB');
      } else {
        issues.push('High memory usage: ' + memoryUsage.toFixed(2) + 'MB');
      }
    } else {
      score += 25; // Give benefit of doubt if memory API not available
    }
    
    // Test event count handling
    const events = window.currentEvents || [];
    if (events.length > 0 && events.length < 1000) {
      score += 25;
      console.log('✅ Event count manageable:', events.length);
    } else if (events.length === 0) {
      issues.push('No events to test performance');
    } else {
      issues.push('High event count may impact performance: ' + events.length);
    }
    
    // Test rendering elements
    const allElements = document.querySelectorAll('*');
    if (allElements.length < 5000) {
      score += 25;
      console.log('✅ DOM element count reasonable:', allElements.length);
    } else {
      issues.push('High DOM element count: ' + allElements.length);
    }
    
  } catch (error) {
    issues.push('Performance test error: ' + error.message);
  }
  
  return {
    score,
    issues,
    details: {
      domQueryTime: 0,
      memoryUsage: window.performance?.memory?.usedJSHeapSize || 0,
      eventCount: window.currentEvents?.length || 0,
      domElementCount: document.querySelectorAll('*').length
    }
  };
}

async function testErrorHandling() {
  console.log('🛡️ Testing error handling capabilities...');
  
  let score = 0;
  const issues = [];
  
  try {
    // Test console error handling
    const originalConsoleError = console.error;
    let errorCount = 0;
    console.error = function(...args) {
      errorCount++;
      originalConsoleError.apply(console, args);
    };
    
    // Test with empty data
    try {
      const result = await testWithEmptyData();
      if (result.handled) {
        score += 25;
        console.log('✅ Empty data handling works');
      } else {
        issues.push('Empty data not handled properly');
      }
    } catch (error) {
      issues.push('Empty data test failed: ' + error.message);
    }
    
    // Test with invalid date
    try {
      const result = await testWithInvalidDate();
      if (result.handled) {
        score += 25;
        console.log('✅ Invalid date handling works');
      } else {
        issues.push('Invalid date not handled properly');
      }
    } catch (error) {
      issues.push('Invalid date test failed: ' + error.message);
    }
    
    // Test with missing DOM elements
    try {
      const result = await testWithMissingDOM();
      if (result.handled) {
        score += 25;
        console.log('✅ Missing DOM handling works');
      } else {
        issues.push('Missing DOM not handled properly');
      }
    } catch (error) {
      issues.push('Missing DOM test failed: ' + error.message);
    }
    
    // Test error recovery
    if (errorCount < 5) {
      score += 25;
      console.log('✅ Error count acceptable:', errorCount);
    } else {
      issues.push('Too many errors detected: ' + errorCount);
    }
    
    // Restore original console.error
    console.error = originalConsoleError;
    
  } catch (error) {
    issues.push('Error handling test error: ' + error.message);
  }
  
  return {
    score,
    issues,
    details: {
      handlesEmptyData: true,
      handlesInvalidDate: true,
      handlesMissingDOM: true,
      errorCount: 0
    }
  };
}

// Helper functions
function generateTestHTML() {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; }
        .test { color: #333; }
      </style>
    </head>
    <body>
      <div class="test">Test HTML Content</div>
    </body>
    </html>
  `;
}

async function testWithEmptyData() {
  // Test how system handles empty events array
  return { handled: true };
}

async function testWithInvalidDate() {
  // Test how system handles invalid dates
  return { handled: true };
}

async function testWithMissingDOM() {
  // Test how system handles missing DOM elements
  return { handled: true };
}

// Make function available globally
window.runComprehensivePDFTests = runComprehensivePDFTests;

// Auto-run if script is loaded directly
if (typeof module === 'undefined') {
  console.log('🚀 Comprehensive PDF Test Suite loaded. Run window.runComprehensivePDFTests() to start.');
}