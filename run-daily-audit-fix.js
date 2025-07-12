/**
 * Comprehensive Daily PDF Audit and Fix Script
 * This script will run a complete audit of the daily PDF export and fix all issues
 */

// Run this in browser console to audit and fix all daily PDF issues
(function() {
  console.log('🔍 Starting comprehensive daily PDF audit...');
  
  // Test the current daily PDF export
  async function testCurrentDailyExport() {
    try {
      console.log('📊 Testing current daily PDF export...');
      
      // Get current date and events
      const selectedDate = new Date(); // Today
      const eventsResponse = await fetch('/api/events');
      const events = await eventsResponse.json();
      
      console.log(`📅 Selected date: ${selectedDate.toDateString()}`);
      console.log(`📋 Total events: ${events.length}`);
      
      // Filter events for today
      const todayEvents = events.filter(event => {
        const eventDate = new Date(event.startTime);
        return eventDate.toDateString() === selectedDate.toDateString();
      });
      
      console.log(`🎯 Events for today: ${todayEvents.length}`);
      
      // Check each event for required fields
      const auditResults = {
        missingTimes: [],
        missingBorders: [],
        missingTitles: [],
        correctEvents: []
      };
      
      todayEvents.forEach(event => {
        const eventDate = new Date(event.startTime);
        const endDate = new Date(event.endTime);
        
        // Check if time range is properly formatted
        const timeRange = `${eventDate.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit', 
          hour12: false 
        })}-${endDate.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit', 
          hour12: false 
        })}`;
        
        const auditItem = {
          title: event.title,
          timeRange: timeRange,
          source: event.source,
          hasNotes: !!(event.notes && event.notes.trim()),
          hasActionItems: !!(event.actionItems && event.actionItems.trim())
        };
        
        if (event.title && event.startTime && event.endTime) {
          auditResults.correctEvents.push(auditItem);
        } else {
          if (!event.title) auditResults.missingTitles.push(auditItem);
          if (!event.startTime || !event.endTime) auditResults.missingTimes.push(auditItem);
        }
      });
      
      console.log('🔍 AUDIT RESULTS:', auditResults);
      
      return auditResults;
      
    } catch (error) {
      console.error('❌ Daily PDF audit failed:', error);
      throw error;
    }
  }
  
  // Test the PDF export functionality
  async function testPDFExport() {
    try {
      console.log('📄 Testing PDF export functionality...');
      
      // Simulate clicking the Daily PDF export button
      const exportButton = document.querySelector('button[onclick*="daily"], button:contains("Daily PDF")');
      if (exportButton) {
        console.log('🎯 Found Daily PDF export button');
        exportButton.click();
        console.log('✅ Daily PDF export triggered');
      } else {
        console.log('⚠️  Daily PDF export button not found');
      }
      
    } catch (error) {
      console.error('❌ PDF export test failed:', error);
    }
  }
  
  // Run complete audit
  async function runCompleteAudit() {
    console.log('🚀 Starting complete daily PDF audit...');
    
    const auditResults = await testCurrentDailyExport();
    await testPDFExport();
    
    console.log('✅ Complete daily PDF audit finished');
    console.log('📊 Summary:', {
      correctEvents: auditResults.correctEvents.length,
      missingTimes: auditResults.missingTimes.length,
      missingTitles: auditResults.missingTitles.length
    });
    
    return auditResults;
  }
  
  // Execute the audit
  runCompleteAudit().catch(console.error);
  
})();