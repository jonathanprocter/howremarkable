/**
 * Test script for audit-driven export validation
 * Verifies the audit system is working correctly
 */

const puppeteer = require('puppeteer');

async function testAuditExportSystem() {
  console.log('🧪 TESTING AUDIT EXPORT SYSTEM');
  console.log('='.repeat(50));
  
  let browser;
  try {
    // Launch browser
    browser = await puppeteer.launch({ 
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    
    const page = await browser.newPage();
    
    // Navigate to the application
    console.log('📍 Navigating to application...');
    await page.goto('http://localhost:5000', { waitUntil: 'networkidle2' });
    
    // Wait for the calendar to load
    console.log('⏳ Waiting for calendar to load...');
    await page.waitForSelector('.weekly-calendar-container', { timeout: 10000 });
    
    // Execute pixel-perfect audit in browser
    console.log('🔍 Running pixel-perfect audit...');
    const auditResults = await page.evaluate(() => {
      // Check if audit function exists
      if (typeof window.testPixelPerfectAudit === 'function') {
        return window.testPixelPerfectAudit();
      } else {
        // Import and run audit manually
        const timeColumn = document.querySelector('.time-column');
        const dayColumns = document.querySelectorAll('.day-column');
        const timeSlots = document.querySelectorAll('[class*="time-slot"]');
        
        return {
          measurements: {
            timeColumnWidth: timeColumn ? timeColumn.getBoundingClientRect().width : 0,
            dayColumnWidth: dayColumns[0] ? dayColumns[0].getBoundingClientRect().width : 0,
            timeSlotHeight: timeSlots[0] ? timeSlots[0].getBoundingClientRect().height : 0,
            totalColumns: dayColumns.length
          },
          status: 'Manual measurements captured'
        };
      }
    });
    
    console.log('📊 Audit Results:', JSON.stringify(auditResults, null, 2));
    
    // Test export button availability
    console.log('🔍 Testing export button availability...');
    const exportButtons = await page.evaluate(() => {
      const auditOnlyBtn = document.querySelector('button:contains("📊 Audit Only")');
      const exportAuditBtn = document.querySelector('button:contains("🔍 Export + Audit")');
      const trulyPixelBtn = document.querySelector('button:contains("Truly Pixel Perfect")');
      
      return {
        auditOnly: !!auditOnlyBtn,
        exportAudit: !!exportAuditBtn,
        trulyPixel: !!trulyPixelBtn
      };
    });
    
    console.log('🎛️ Export Buttons:', exportButtons);
    
    // Extract dashboard styles for comparison
    console.log('🎨 Extracting dashboard styles...');
    const dashboardStyles = await page.evaluate(() => {
      const timeColumn = document.querySelector('.time-column');
      const dayColumn = document.querySelector('.day-column');
      const timeSlot = document.querySelector('[class*="time-slot"]');
      
      if (!timeColumn || !dayColumn || !timeSlot) {
        return { error: 'Required elements not found' };
      }
      
      const timeColumnRect = timeColumn.getBoundingClientRect();
      const dayColumnRect = dayColumn.getBoundingClientRect();
      const timeSlotRect = timeSlot.getBoundingClientRect();
      
      return {
        timeColumnWidth: Math.round(timeColumnRect.width),
        dayColumnWidth: Math.round(dayColumnRect.width),
        timeSlotHeight: Math.round(timeSlotRect.height),
        measurements: {
          timeColumn: timeColumnRect,
          dayColumn: dayColumnRect,
          timeSlot: timeSlotRect
        }
      };
    });
    
    console.log('📏 Dashboard Measurements:', dashboardStyles);
    
    console.log('\n✅ AUDIT SYSTEM TEST COMPLETE');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testAuditExportSystem };
}

// Run if called directly
if (require.main === module) {
  testAuditExportSystem().catch(console.error);
}