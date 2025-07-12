/**
 * Pixel-Perfect PDF Export System
 * Uses exact dashboard measurements for 100% accuracy
 */

import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { CalendarEvent } from '../types/calendar';
import { format } from 'date-fns';

interface DashboardMeasurements {
  timeColumnWidth: number;
  dayColumnWidth: number;
  timeSlotHeight: number;
  headerHeight: number;
  scalingFactor: number;
}

interface PDFConfig {
  pageWidth: number;
  pageHeight: number;
  margins: { top: number; right: number; bottom: number; left: number };
  timeColumnWidth: number;
  dayColumnWidth: number;
  timeSlotHeight: number;
  headerHeight: number;
  fontSizes: {
    title: number;
    header: number;
    timeLabel: number;
    eventTitle: number;
    eventTime: number;
  };
}

export async function exportPixelPerfectPDF(
  date: Date,
  events: CalendarEvent[]
): Promise<void> {
  try {
    console.log('🎯 Starting Pixel-Perfect PDF Export');
    console.log('📅 Date:', format(date, 'yyyy-MM-dd'));
    console.log('📊 Events:', events.length);

    // Extract exact dashboard measurements
    const dashboardMeasurements = await extractDashboardMeasurements();
    console.log('📏 Dashboard measurements:', dashboardMeasurements);
    
    // Calculate PDF configuration based on dashboard
    const pdfConfig = calculatePDFConfig(dashboardMeasurements);
    console.log('📐 PDF configuration:', pdfConfig);
    
    // Generate pixel-perfect HTML
    const html = generatePixelPerfectHTML(date, events, pdfConfig);
    console.log('✅ Pixel-perfect HTML generated, length:', html.length);
    
    // Create temporary container with exact PDF dimensions
    const container = document.createElement('div');
    container.innerHTML = html;
    container.style.position = 'fixed';
    container.style.left = '0px';
    container.style.top = '0px';
    container.style.width = `${pdfConfig.pageWidth}px`;
    container.style.height = `${pdfConfig.pageHeight}px`;
    container.style.backgroundColor = '#ffffff';
    container.style.fontFamily = 'Arial, sans-serif';
    container.style.zIndex = '9999';
    container.style.overflow = 'hidden';
    
    // Add to document
    document.body.appendChild(container);
    
    // Wait for rendering and font loading
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Capture with exact dimensions
    const canvas = await html2canvas(container, {
      scale: 2, // Use 2x scaling for better quality
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: pdfConfig.pageWidth,
      height: pdfConfig.pageHeight,
      logging: true,
      foreignObjectRendering: true,
      onclone: (clonedDoc) => {
        console.log('📸 html2canvas cloned document successfully');
        const clonedContainer = clonedDoc.querySelector('div');
        if (clonedContainer) {
          console.log('📸 Cloned container found:', clonedContainer.getBoundingClientRect());
        }
      }
    });
    
    console.log('✅ Canvas captured:', canvas.width, 'x', canvas.height);
    
    // Remove temporary container
    document.body.removeChild(container);
    
    // Create PDF with exact dimensions
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: [pdfConfig.pageWidth, pdfConfig.pageHeight],
      compress: false
    });
    
    // Add image with proper scaling compensation
    const imgData = canvas.toDataURL('image/png', 1.0);
    const actualWidth = canvas.width;
    const actualHeight = canvas.height;
    
    // Calculate scaling to fit PDF page exactly
    const scaleX = pdfConfig.pageWidth / actualWidth;
    const scaleY = pdfConfig.pageHeight / actualHeight;
    const scale = Math.min(scaleX, scaleY);
    
    const finalWidth = actualWidth * scale;
    const finalHeight = actualHeight * scale;
    
    // Center the image on the page
    const x = (pdfConfig.pageWidth - finalWidth) / 2;
    const y = (pdfConfig.pageHeight - finalHeight) / 2;
    
    console.log('📐 PDF image scaling:', {
      canvasSize: `${actualWidth}x${actualHeight}`,
      pdfPageSize: `${pdfConfig.pageWidth}x${pdfConfig.pageHeight}`,
      scale,
      finalSize: `${finalWidth}x${finalHeight}`,
      position: `${x}, ${y}`
    });
    
    pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight);
    
    // Save PDF
    const filename = `Pixel_Perfect_Daily_${format(date, 'yyyy-MM-dd')}.pdf`;
    pdf.save(filename);
    
    console.log('✅ Pixel-perfect PDF exported successfully:', filename);
    
  } catch (error) {
    console.error('❌ Pixel-perfect PDF export failed:', error);
    throw new Error(`Pixel-perfect PDF export failed: ${error.message}`);
  }
}

async function extractDashboardMeasurements(): Promise<DashboardMeasurements> {
  console.log('📏 Extracting dashboard measurements...');
  
  // Try multiple selectors to find calendar elements
  const calendarSelectors = [
    '.calendar-container',
    '.weekly-calendar-grid',
    '.daily-view',
    'main',
    '.content'
  ];
  
  let calendarContainer: Element | null = null;
  for (const selector of calendarSelectors) {
    calendarContainer = document.querySelector(selector);
    if (calendarContainer) {
      console.log(`📍 Found calendar container: ${selector}`);
      break;
    }
  }
  
  if (!calendarContainer) {
    console.warn('⚠️ Using document body as container');
    calendarContainer = document.body;
  }
  
  // Extract measurements with fallbacks
  const timeColumnSelectors = ['.time-column', '[class*="time"]'];
  let timeColumn: Element | null = null;
  for (const selector of timeColumnSelectors) {
    timeColumn = calendarContainer.querySelector(selector);
    if (timeColumn) break;
  }
  const timeColumnWidth = timeColumn?.getBoundingClientRect().width || 80;
  
  const dayColumnSelectors = ['.day-column', '[class*="day"]'];
  const dayColumns = calendarContainer.querySelectorAll(dayColumnSelectors.join(','));
  const dayColumnWidth = dayColumns.length > 0 ? 
    dayColumns[0].getBoundingClientRect().width : 137;
  
  const timeSlotSelectors = ['.time-slot', '[class*="slot"]'];
  const timeSlots = calendarContainer.querySelectorAll(timeSlotSelectors.join(','));
  const timeSlotHeight = timeSlots.length > 0 ?
    timeSlots[0].getBoundingClientRect().height : 40;
  
  const headerSelectors = ['.calendar-header', '[class*="header"]'];
  let header: Element | null = null;
  for (const selector of headerSelectors) {
    header = calendarContainer.querySelector(selector);
    if (header) break;
  }
  const headerHeight = header?.getBoundingClientRect().height || 50;
  
  // Calculate scaling factor based on 8.5x11 page
  const pageWidth = 612;
  const margins = 40;
  const availableWidth = pageWidth - (margins * 2);
  const dashboardTotalWidth = timeColumnWidth + (dayColumnWidth * 7);
  const scalingFactor = dashboardTotalWidth > 0 ? availableWidth / dashboardTotalWidth : 1;
  
  console.log('📐 Scaling calculation:', {
    pageWidth,
    margins,
    availableWidth,
    timeColumnWidth,
    dayColumnWidth,
    dashboardTotalWidth,
    scalingFactor
  });
  
  return {
    timeColumnWidth,
    dayColumnWidth,
    timeSlotHeight,
    headerHeight,
    scalingFactor
  };
}

function calculatePDFConfig(dashboard: DashboardMeasurements): PDFConfig {
  console.log('📐 Calculating PDF configuration...');
  
  // Standard PDF dimensions
  const pageWidth = 612;
  const pageHeight = 792;
  const margins = { top: 40, right: 40, bottom: 40, left: 40 };
  
  // Apply consistent scaling factor to all elements
  const timeColumnWidth = dashboard.timeColumnWidth * dashboard.scalingFactor;
  const dayColumnWidth = dashboard.dayColumnWidth * dashboard.scalingFactor;
  const timeSlotHeight = dashboard.timeSlotHeight * dashboard.scalingFactor;
  const headerHeight = dashboard.headerHeight * dashboard.scalingFactor;
  
  // Calculate font sizes proportional to scaling but with minimum readable sizes
  const baseFontScale = Math.max(dashboard.scalingFactor, 0.7); // Minimum scale factor
  const fontSizes = {
    title: Math.max(Math.round(20 * baseFontScale), 14),
    header: Math.max(Math.round(16 * baseFontScale), 12),
    timeLabel: Math.max(Math.round(12 * baseFontScale), 10),
    eventTitle: Math.max(Math.round(14 * baseFontScale), 11),
    eventTime: Math.max(Math.round(12 * baseFontScale), 10)
  };
  
  console.log('🔤 Calculated font sizes:', fontSizes);
  console.log('📏 Scaled dimensions:', {
    timeColumnWidth,
    dayColumnWidth,
    timeSlotHeight,
    headerHeight
  });
  
  return {
    pageWidth,
    pageHeight,
    margins,
    timeColumnWidth,
    dayColumnWidth,
    timeSlotHeight,
    headerHeight,
    fontSizes
  };
}

function generatePixelPerfectHTML(
  date: Date,
  events: CalendarEvent[],
  config: PDFConfig
): string {
  console.log('🎨 Generating pixel-perfect HTML...');
  
  // Filter events for the specific date
  const dayEvents = events.filter(event => {
    const eventDate = new Date(event.startTime);
    return eventDate.toDateString() === date.toDateString();
  });
  
  console.log(`📅 Events for ${date.toDateString()}: ${dayEvents.length}`);
  
  // Calculate time slots (6:00 to 23:30)
  const timeSlots = [];
  for (let hour = 6; hour <= 23; hour++) {
    timeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
    if (hour < 23) {
      timeSlots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
  }
  timeSlots.push('23:30');
  
  // Generate HTML with exact measurements
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: Arial, sans-serif;
          width: ${config.pageWidth}px;
          height: ${config.pageHeight}px;
          background: #ffffff;
          overflow: hidden;
        }
        
        .container {
          width: 100%;
          height: 100%;
          padding: ${config.margins.top}px ${config.margins.right}px ${config.margins.bottom}px ${config.margins.left}px;
        }
        
        .header {
          height: ${config.headerHeight}px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 2px solid #333;
          margin-bottom: 20px;
          padding-bottom: 10px;
        }
        
        .title {
          font-size: ${config.fontSizes.title}px;
          font-weight: bold;
          color: #333;
        }
        
        .date {
          font-size: ${config.fontSizes.header}px;
          color: #666;
        }
        
        .calendar-grid {
          display: grid;
          grid-template-columns: ${config.timeColumnWidth}px 1fr;
          gap: 0;
          border: 1px solid #333;
        }
        
        .time-column {
          background: #f8f8f8;
          border-right: 2px solid #333;
        }
        
        .time-slot {
          height: ${config.timeSlotHeight}px;
          border-bottom: 1px solid #ddd;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: ${config.fontSizes.timeLabel}px;
          color: #333;
        }
        
        .time-slot:nth-child(even) {
          background: #f0f0f0;
        }
        
        .appointments-column {
          position: relative;
        }
        
        .appointment-slot {
          height: ${config.timeSlotHeight}px;
          border-bottom: 1px solid #ddd;
          position: relative;
        }
        
        .event {
          position: absolute;
          background: #ffffff;
          border: 1px solid #333;
          border-radius: 4px;
          padding: 4px;
          font-size: ${config.fontSizes.eventTitle}px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .event.simplepractice {
          border-left: 4px solid #6495ed;
          border-color: #6495ed;
        }
        
        .event.google-calendar {
          border: 1px dashed #22c55e;
        }
        
        .event.holiday {
          background: #fbbf24;
          border-color: #f59e0b;
        }
        
        .event-title {
          font-weight: bold;
          font-size: ${config.fontSizes.eventTitle}px;
          line-height: 1.2;
        }
        
        .event-time {
          font-size: ${config.fontSizes.eventTime}px;
          color: #666;
          margin-top: 2px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="title">DAILY PLANNER</div>
          <div class="date">${format(date, 'EEEE, MMMM d, yyyy')}</div>
        </div>
        
        <div class="calendar-grid">
          <div class="time-column">
            ${timeSlots.map(time => `
              <div class="time-slot">${time}</div>
            `).join('')}
          </div>
          
          <div class="appointments-column">
            ${timeSlots.map((time, index) => `
              <div class="appointment-slot" data-time="${time}"></div>
            `).join('')}
            
            ${dayEvents.map(event => {
              const startTime = new Date(event.startTime);
              const endTime = new Date(event.endTime);
              const startHour = startTime.getHours();
              const startMinute = startTime.getMinutes();
              const endHour = endTime.getHours();
              const endMinute = endTime.getMinutes();
              
              // Calculate position and height
              const startSlot = ((startHour - 6) * 2) + (startMinute >= 30 ? 1 : 0);
              const endSlot = ((endHour - 6) * 2) + (endMinute >= 30 ? 1 : 0);
              const duration = Math.max(endSlot - startSlot, 1); // Minimum 1 slot
              
              const top = startSlot * config.timeSlotHeight;
              const height = Math.max(duration * config.timeSlotHeight - 2, config.timeSlotHeight - 2); // Minimum height
              
              // Determine event type
              let eventClass = 'event';
              if (event.title.includes('Appointment')) {
                eventClass += ' simplepractice';
              } else if (event.calendarId && event.calendarId.includes('google')) {
                eventClass += ' google-calendar';
              } else if (event.title.includes('Holiday')) {
                eventClass += ' holiday';
              }
              
              const cleanTitle = event.title.replace(' Appointment', '').trim();
              const timeRange = `${format(startTime, 'HH:mm')}-${format(endTime, 'HH:mm')}`;
              
              return `
                <div class="${eventClass}" style="top: ${top}px; height: ${height}px; left: 4px; right: 4px;">
                  <div class="event-title">${cleanTitle}</div>
                  <div class="event-time">${timeRange}</div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}