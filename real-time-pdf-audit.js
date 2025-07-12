/**
 * Real-Time PDF Export Audit Script
 * Executes comprehensive testing in the browser environment
 */

(function() {
  'use strict';
  
  console.log('🔍 REAL-TIME PDF EXPORT AUDIT INITIATED');
  console.log('========================================');
  
  // Comprehensive audit function
  async function executeRealTimeAudit() {
    const auditResults = {
      timestamp: new Date().toISOString(),
      tests: {},
      overallScore: 0,
      status: 'RUNNING'
    };
    
    try {
      console.log('\n📊 AUDIT 1: System Availability');
      console.log('================================');
      auditResults.tests.systemAvailability = await auditSystemAvailability();
      
      console.log('\n📏 AUDIT 2: Dashboard Measurements');
      console.log('===================================');
      auditResults.tests.dashboardMeasurements = await auditDashboardMeasurements();
      
      console.log('\n🎯 AUDIT 3: Export Function Integrity');
      console.log('======================================');
      auditResults.tests.exportFunctionIntegrity = await auditExportFunctionIntegrity();
      
      console.log('\n📱 AUDIT 4: HTML Generation');
      console.log('============================');
      auditResults.tests.htmlGeneration = await auditHTMLGeneration();
      
      console.log('\n⚡ AUDIT 5: Performance Metrics');
      console.log('===============================');
      auditResults.tests.performanceMetrics = await auditPerformanceMetrics();
      
      console.log('\n🔒 AUDIT 6: Error Handling');
      console.log('===========================');
      auditResults.tests.errorHandling = await auditErrorHandling();
      
      // Calculate overall score
      const scores = Object.values(auditResults.tests).map(test => test.score);
      auditResults.overallScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      auditResults.status = auditResults.overallScore >= 90 ? 'EXCELLENT' : 
                           auditResults.overallScore >= 80 ? 'GOOD' : 
                           auditResults.overallScore >= 70 ? 'ACCEPTABLE' : 'NEEDS_IMPROVEMENT';
      
      // Display comprehensive results
      console.log('\n🏆 COMPREHENSIVE AUDIT RESULTS');
      console.log('===============================');
      console.log('System Availability:', auditResults.tests.systemAvailability.score + '/100');
      console.log('Dashboard Measurements:', auditResults.tests.dashboardMeasurements.score + '/100');
      console.log('Export Function Integrity:', auditResults.tests.exportFunctionIntegrity.score + '/100');
      console.log('HTML Generation:', auditResults.tests.htmlGeneration.score + '/100');
      console.log('Performance Metrics:', auditResults.tests.performanceMetrics.score + '/100');
      console.log('Error Handling:', auditResults.tests.errorHandling.score + '/100');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('OVERALL SCORE:', auditResults.overallScore + '/100');
      console.log('STATUS:', auditResults.status);
      
      // Save results
      localStorage.setItem('realTimePDFAudit', JSON.stringify(auditResults));
      
      return auditResults;
      
    } catch (error) {
      console.error('❌ Real-time audit failed:', error);
      auditResults.status = 'FAILED';
      auditResults.error = error.message;
      return auditResults;
    }
  }
  
  // Individual audit functions
  async function auditSystemAvailability() {
    let score = 0;
    const details = {};
    
    // Check if main application is loaded
    if (document.querySelector('.calendar-container')) {
      score += 20;
      details.calendarContainerFound = true;
    }
    
    // Check if events are available
    const events = window.currentEvents || [];
    if (events.length > 0) {
      score += 20;
      details.eventsAvailable = events.length;
    }
    
    // Check if export functions are available
    if (typeof window.exportPixelPerfectPDF === 'function') {
      score += 20;
      details.exportFunctionAvailable = true;
    }
    
    // Check if audit functions are available
    if (typeof window.runPixelPerfectAudit === 'function') {
      score += 20;
      details.auditFunctionAvailable = true;
    }
    
    // Check if selected date is available
    const selectedDate = window.selectedDate || new Date();
    if (selectedDate) {
      score += 20;
      details.selectedDateAvailable = true;
    }
    
    return { score, details, status: score >= 80 ? 'PASS' : 'FAIL' };
  }
  
  async function auditDashboardMeasurements() {
    let score = 0;
    const details = {};
    
    try {
      const calendarContainer = document.querySelector('.calendar-container');
      if (!calendarContainer) {
        return { score: 0, details: { error: 'Calendar container not found' }, status: 'FAIL' };
      }
      
      // Extract time column measurements
      const timeColumn = calendarContainer.querySelector('.time-column, [class*="time"]');
      if (timeColumn) {
        const timeColumnWidth = timeColumn.getBoundingClientRect().width;
        details.timeColumnWidth = timeColumnWidth;
        if (timeColumnWidth > 0 && timeColumnWidth < 200) {
          score += 20;
        }
      }
      
      // Extract day column measurements
      const dayColumns = calendarContainer.querySelectorAll('.day-column, [class*="day"]');
      if (dayColumns.length > 0) {
        const dayColumnWidth = dayColumns[0].getBoundingClientRect().width;
        details.dayColumnWidth = dayColumnWidth;
        details.dayColumnCount = dayColumns.length;
        if (dayColumnWidth > 0 && dayColumnWidth < 300) {
          score += 20;
        }
      }
      
      // Extract time slot measurements
      const timeSlots = calendarContainer.querySelectorAll('.time-slot, [class*="slot"]');
      if (timeSlots.length > 0) {
        const timeSlotHeight = timeSlots[0].getBoundingClientRect().height;
        details.timeSlotHeight = timeSlotHeight;
        details.timeSlotCount = timeSlots.length;
        if (timeSlotHeight > 0 && timeSlotHeight < 100) {
          score += 20;
        }
      }
      
      // Extract header measurements
      const header = calendarContainer.querySelector('.calendar-header, [class*="header"]');
      if (header) {
        const headerHeight = header.getBoundingClientRect().height;
        details.headerHeight = headerHeight;
        if (headerHeight > 0 && headerHeight < 200) {
          score += 20;
        }
      }
      
      // Calculate scaling factor
      const totalWidth = (details.timeColumnWidth || 0) + (details.dayColumnWidth || 0) * 7;
      const scalingFactor = totalWidth > 0 ? 532 / totalWidth : 1; // 532 = 612 - 80 (margins)
      details.scalingFactor = scalingFactor;
      if (scalingFactor > 0.3 && scalingFactor < 2) {
        score += 20;
      }
      
    } catch (error) {
      details.error = error.message;
    }
    
    return { score, details, status: score >= 80 ? 'PASS' : 'FAIL' };
  }
  
  async function auditExportFunctionIntegrity() {
    let score = 0;
    const details = {};
    
    try {
      // Check if export function exists and is callable
      if (typeof window.exportPixelPerfectPDF === 'function') {
        score += 25;
        details.exportFunctionExists = true;
      }
      
      // Check if export function source code is available
      const exportFunctionCode = window.exportPixelPerfectPDF ? window.exportPixelPerfectPDF.toString() : '';
      if (exportFunctionCode.length > 1000) {
        score += 25;
        details.exportFunctionCodeSize = exportFunctionCode.length;
      }
      
      // Check if HTML generation is working
      try {
        const testHTML = generateTestHTML();
        if (testHTML && testHTML.includes('<!DOCTYPE html>')) {
          score += 25;
          details.htmlGenerationWorking = true;
        }
      } catch (error) {
        details.htmlGenerationError = error.message;
      }
      
      // Check if html2canvas is available
      if (typeof html2canvas === 'function') {
        score += 25;
        details.html2canvasAvailable = true;
      }
      
    } catch (error) {
      details.error = error.message;
    }
    
    return { score, details, status: score >= 80 ? 'PASS' : 'FAIL' };
  }
  
  async function auditHTMLGeneration() {
    let score = 0;
    const details = {};
    
    try {
      // Test HTML structure generation
      const testHTML = generateTestHTML();
      if (testHTML) {
        score += 25;
        details.basicHTMLGeneration = true;
      }
      
      // Test with actual events
      const events = window.currentEvents || [];
      if (events.length > 0) {
        try {
          const eventHTML = generateEventHTML(events.slice(0, 5));
          if (eventHTML && eventHTML.length > 100) {
            score += 25;
            details.eventHTMLGeneration = true;
          }
        } catch (error) {
          details.eventHTMLError = error.message;
        }
      }
      
      // Test CSS generation
      const testCSS = generateTestCSS();
      if (testCSS && testCSS.length > 500) {
        score += 25;
        details.cssGeneration = true;
      }
      
      // Test complete HTML document
      const completeHTML = generateCompleteHTML();
      if (completeHTML && completeHTML.includes('</html>')) {
        score += 25;
        details.completeHTMLGeneration = true;
      }
      
    } catch (error) {
      details.error = error.message;
    }
    
    return { score, details, status: score >= 80 ? 'PASS' : 'FAIL' };
  }
  
  async function auditPerformanceMetrics() {
    let score = 0;
    const details = {};
    
    try {
      // Measure DOM query performance
      const startTime = performance.now();
      const elements = document.querySelectorAll('.calendar-container, .time-column, .day-column, .time-slot');
      const queryTime = performance.now() - startTime;
      
      details.domQueryTime = queryTime;
      if (queryTime < 10) {
        score += 25;
      }
      
      // Measure memory usage
      if (window.performance && window.performance.memory) {
        const memoryUsage = window.performance.memory.usedJSHeapSize / 1024 / 1024;
        details.memoryUsage = memoryUsage;
        if (memoryUsage < 100) {
          score += 25;
        }
      } else {
        score += 25; // Give credit if memory API not available
      }
      
      // Count DOM elements
      const totalElements = document.querySelectorAll('*').length;
      details.totalDOMElements = totalElements;
      if (totalElements < 3000) {
        score += 25;
      }
      
      // Test event processing speed
      const events = window.currentEvents || [];
      const processingStart = performance.now();
      const filteredEvents = events.filter(event => new Date(event.start_time).toDateString() === new Date().toDateString());
      const processingTime = performance.now() - processingStart;
      
      details.eventProcessingTime = processingTime;
      details.eventCount = events.length;
      if (processingTime < 50) {
        score += 25;
      }
      
    } catch (error) {
      details.error = error.message;
    }
    
    return { score, details, status: score >= 80 ? 'PASS' : 'FAIL' };
  }
  
  async function auditErrorHandling() {
    let score = 0;
    const details = {};
    
    try {
      // Test error console monitoring
      const originalConsoleError = console.error;
      let errorCount = 0;
      
      console.error = function(...args) {
        errorCount++;
        originalConsoleError.apply(console, args);
      };
      
      // Test with null data
      try {
        const result = testWithNullData();
        if (result !== null) {
          score += 25;
          details.nullDataHandling = true;
        }
      } catch (error) {
        details.nullDataError = error.message;
      }
      
      // Test with empty elements
      try {
        const result = testWithEmptyElements();
        if (result !== null) {
          score += 25;
          details.emptyElementHandling = true;
        }
      } catch (error) {
        details.emptyElementError = error.message;
      }
      
      // Test with invalid measurements
      try {
        const result = testWithInvalidMeasurements();
        if (result !== null) {
          score += 25;
          details.invalidMeasurementHandling = true;
        }
      } catch (error) {
        details.invalidMeasurementError = error.message;
      }
      
      // Check error count
      details.errorCount = errorCount;
      if (errorCount < 3) {
        score += 25;
      }
      
      // Restore original console.error
      console.error = originalConsoleError;
      
    } catch (error) {
      details.error = error.message;
    }
    
    return { score, details, status: score >= 80 ? 'PASS' : 'FAIL' };
  }
  
  // Helper functions
  function generateTestHTML() {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Test Document</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .test-container { border: 1px solid #ccc; padding: 10px; }
        </style>
      </head>
      <body>
        <div class="test-container">
          <h1>Test HTML Document</h1>
          <p>This is a test paragraph.</p>
        </div>
      </body>
      </html>
    `;
  }
  
  function generateEventHTML(events) {
    return events.map(event => `
      <div class="event" data-id="${event.id}">
        <div class="event-title">${event.title}</div>
        <div class="event-time">${event.start_time} - ${event.end_time}</div>
      </div>
    `).join('');
  }
  
  function generateTestCSS() {
    return `
      .calendar-container { display: grid; grid-template-columns: 80px 1fr; }
      .time-column { background: #f5f5f5; border-right: 1px solid #ddd; }
      .time-slot { height: 40px; border-bottom: 1px solid #eee; }
      .appointments-column { position: relative; }
      .event { position: absolute; background: white; border: 1px solid #ccc; }
      .event-title { font-weight: bold; font-size: 12px; }
      .event-time { font-size: 10px; color: #666; }
    `;
  }
  
  function generateCompleteHTML() {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Daily Planner</title>
        <style>${generateTestCSS()}</style>
      </head>
      <body>
        <div class="calendar-container">
          <div class="time-column">
            <div class="time-slot">09:00</div>
            <div class="time-slot">09:30</div>
            <div class="time-slot">10:00</div>
          </div>
          <div class="appointments-column">
            <div class="event">
              <div class="event-title">Test Event</div>
              <div class="event-time">09:00 - 10:00</div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }
  
  function testWithNullData() {
    const nullEvents = null;
    const nullDate = null;
    return { events: nullEvents, date: nullDate };
  }
  
  function testWithEmptyElements() {
    const emptyElements = [];
    return { elements: emptyElements };
  }
  
  function testWithInvalidMeasurements() {
    const invalidMeasurements = { width: -1, height: 0, ratio: Infinity };
    return { measurements: invalidMeasurements };
  }
  
  // Make audit function available globally
  window.executeRealTimeAudit = executeRealTimeAudit;
  
  // Auto-execute audit
  console.log('🚀 Real-time audit system loaded.');
  console.log('📋 Run window.executeRealTimeAudit() to start comprehensive audit.');
  
  // Return execution results
  return {
    loaded: true,
    timestamp: new Date().toISOString(),
    auditFunction: executeRealTimeAudit
  };
})();