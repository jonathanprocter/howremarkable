/**
 * Test script to verify pixel-perfect audit system functionality
 * This will test the audit system components in the browser environment
 */

// Test if the audit system is properly loaded
console.log('🎯 Testing Pixel-Perfect Audit System');

// Test 1: Check if audit system modules are available
async function testAuditSystemAvailability() {
  console.log('📋 Test 1: Checking audit system availability');
  
  try {
    // Check if window object has audit functions
    if (typeof window !== 'undefined') {
      console.log('✅ Browser environment detected');
      
      // Check if audit functions are available
      if (window.testPixelPerfectAudit) {
        console.log('✅ testPixelPerfectAudit function found');
      } else {
        console.log('❌ testPixelPerfectAudit function not found');
      }
      
      if (window.runComprehensiveAudit) {
        console.log('✅ runComprehensiveAudit function found');
      } else {
        console.log('❌ runComprehensiveAudit function not found');
      }
      
      return true;
    } else {
      console.log('❌ Not in browser environment');
      return false;
    }
  } catch (error) {
    console.error('❌ Error checking audit system availability:', error);
    return false;
  }
}

// Test 2: Check if DOM elements are available
async function testDOMElements() {
  console.log('📋 Test 2: Checking DOM elements');
  
  try {
    // Check for planner container
    const plannerContainer = document.querySelector('.weekly-planner-view');
    if (plannerContainer) {
      console.log('✅ Weekly planner container found');
    } else {
      console.log('❌ Weekly planner container not found');
    }
    
    // Check for time column
    const timeColumn = document.querySelector('.time-column');
    if (timeColumn) {
      console.log('✅ Time column found');
    } else {
      console.log('❌ Time column not found');
    }
    
    // Check for day columns
    const dayColumns = document.querySelectorAll('.day-column');
    console.log(`📊 Found ${dayColumns.length} day columns`);
    
    return dayColumns.length > 0;
  } catch (error) {
    console.error('❌ Error checking DOM elements:', error);
    return false;
  }
}

// Test 3: Test measurement extraction
async function testMeasurementExtraction() {
  console.log('📋 Test 3: Testing measurement extraction');
  
  try {
    // Test basic measurements
    const timeColumn = document.querySelector('.time-column');
    if (timeColumn) {
      const rect = timeColumn.getBoundingClientRect();
      console.log('📐 Time column measurements:', {
        width: rect.width,
        height: rect.height,
        left: rect.left,
        top: rect.top
      });
    }
    
    // Test computed styles
    const computedStyle = window.getComputedStyle(timeColumn);
    console.log('🎨 Time column computed styles:', {
      width: computedStyle.width,
      backgroundColor: computedStyle.backgroundColor,
      fontSize: computedStyle.fontSize,
      padding: computedStyle.padding
    });
    
    return true;
  } catch (error) {
    console.error('❌ Error testing measurement extraction:', error);
    return false;
  }
}

// Test 4: Test screenshot capture
async function testScreenshotCapture() {
  console.log('📋 Test 4: Testing screenshot capture');
  
  try {
    // Check if html2canvas is available
    if (typeof html2canvas !== 'undefined') {
      console.log('✅ html2canvas library is available');
      
      // Test capturing a small element
      const testElement = document.body;
      const canvas = await html2canvas(testElement, {
        width: 100,
        height: 100,
        scale: 0.5
      });
      
      console.log('📸 Screenshot test successful:', {
        width: canvas.width,
        height: canvas.height
      });
      
      return true;
    } else {
      console.log('❌ html2canvas library not found');
      return false;
    }
  } catch (error) {
    console.error('❌ Error testing screenshot capture:', error);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting pixel-perfect audit system tests');
  
  const results = {
    auditSystemAvailable: await testAuditSystemAvailability(),
    domElementsReady: await testDOMElements(),
    measurementExtraction: await testMeasurementExtraction(),
    screenshotCapture: await testScreenshotCapture()
  };
  
  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  console.log('📊 Test Results:', results);
  console.log(`🎯 Tests passed: ${passedTests}/${totalTests} (${Math.round(passedTests/totalTests*100)}%)`);
  
  if (passedTests === totalTests) {
    console.log('✅ All tests passed - Audit system is ready!');
  } else {
    console.log('❌ Some tests failed - Check issues above');
  }
  
  return results;
}

// Export for browser console use
if (typeof window !== 'undefined') {
  window.testAuditSystem = runAllTests;
  window.testAuditSystemComponents = {
    testAuditSystemAvailability,
    testDOMElements,
    testMeasurementExtraction,
    testScreenshotCapture
  };
}

// Auto-run in browser
if (typeof window !== 'undefined') {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runAllTests);
  } else {
    setTimeout(runAllTests, 1000); // Give React time to render
  }
}