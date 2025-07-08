import jsPDF from 'jspdf';
import { CalendarEvent } from '../types/calendar';
import { getWeekNumber } from './dateUtils';

// Helper function to format time
function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit', 
    hour12: true 
  });
}

// HTML Template Configuration - Matching exact template dimensions
const HTML_TEMPLATE_CONFIG = {
  // Page dimensions - A3 landscape for better visibility
  pageWidth: 1190,   // A3 landscape width in points
  pageHeight: 842,   // A3 landscape height in points
  
  // Grid configuration matching HTML template exactly
  timeColumnWidth: 90,  // Wider time column for better readability
  dayColumnWidth: 157,  // Calculated: (1190 - 90) / 7 = ~157 points per day
  
  // Header sections - better proportions for A3
  headerHeight: 60,
  statsHeight: 45, 
  legendHeight: 35,
  
  // Grid positioning - optimized for A3 size
  gridStartY: 140, // More space for header sections
  timeSlotHeight: 20, // Taller slots for better readability
  
  // Colors exactly matching HTML template
  colors: {
    black: { r: 0, g: 0, b: 0 },
    lightGrey: { r: 248, g: 248, b: 248 },  // #f8f8f8
    darkGrey: { r: 240, g: 240, b: 240 },   // #f0f0f0
    borderGrey: { r: 221, g: 221, b: 221 }, // #ddd
    simplePracticeBlue: { r: 100, g: 149, b: 237 }, // #6495ED
    googleGreen: { r: 52, g: 168, b: 83 }
  }
};

// Time slots from 06:00 to 23:30 (matches HTML template)
const TIME_SLOTS = [
  '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30',
  '22:00', '22:30', '23:00', '23:30'
];

export const exportHTMLTemplatePDF = async (
  weekStartDate: Date,
  weekEndDate: Date,
  events: CalendarEvent[]
): Promise<void> => {
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: [HTML_TEMPLATE_CONFIG.pageWidth, HTML_TEMPLATE_CONFIG.pageHeight]
  });

  // Set default font - use helvetica instead of arial for better compatibility
  pdf.setFont('helvetica', 'normal');

  // === HEADER SECTION ===
  drawHeader(pdf, weekStartDate, weekEndDate);
  
  // === STATS SECTION ===
  drawStats(pdf, events);
  
  // === LEGEND SECTION ===
  drawLegend(pdf);
  
  // === CALENDAR GRID ===
  drawCalendarGrid(pdf, weekStartDate, events);

  // Save the PDF
  const filename = `weekly-planner-${weekStartDate.getFullYear()}-${String(weekStartDate.getMonth() + 1).padStart(2, '0')}-${String(weekStartDate.getDate()).padStart(2, '0')}.pdf`;
  
  try {
    pdf.save(filename);
    console.log(`✅ HTML Template PDF exported: ${filename}`);
    console.log('✅ PDF download should have started automatically');
  } catch (error) {
    console.error('❌ Error saving PDF:', error);
    throw error;
  }
};

function drawHeader(pdf: jsPDF, weekStartDate: Date, weekEndDate: Date): void {
  // Outer container border - matching HTML template .planner-container
  const margin = 15;
  pdf.setLineWidth(2);
  pdf.setDrawColor(0, 0, 0);
  pdf.rect(margin, margin, HTML_TEMPLATE_CONFIG.pageWidth - (margin * 2), HTML_TEMPLATE_CONFIG.pageHeight - (margin * 2));
  
  // Header section - matching HTML template .header
  const headerX = margin;
  const headerY = margin;
  const headerWidth = HTML_TEMPLATE_CONFIG.pageWidth - (margin * 2);
  
  // Header background
  pdf.setFillColor(255, 255, 255);
  pdf.rect(headerX, headerY, headerWidth, HTML_TEMPLATE_CONFIG.headerHeight, 'F');
  
  // Header bottom border - matching HTML template border-bottom: 3px solid black
  pdf.setLineWidth(3);
  pdf.line(headerX, headerY + HTML_TEMPLATE_CONFIG.headerHeight, headerX + headerWidth, headerY + HTML_TEMPLATE_CONFIG.headerHeight);
  
  // Title - centered and properly sized for A3
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0, 0, 0);
  pdf.text('WEEKLY PLANNER', HTML_TEMPLATE_CONFIG.pageWidth / 2, margin + 25, { align: 'center' });
  
  // Week information - centered and properly sized
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'normal');
  const weekNumber = getWeekNumber(weekStartDate);
  const weekText = `Week ${weekNumber} - ${weekStartDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEndDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  pdf.text(weekText, HTML_TEMPLATE_CONFIG.pageWidth / 2, margin + 45, { align: 'center' });
}

function drawStats(pdf: jsPDF, events: CalendarEvent[]): void {
  const margin = 15; // Match grid margin
  const contentWidth = HTML_TEMPLATE_CONFIG.pageWidth - (margin * 2);
  const statsY = margin + HTML_TEMPLATE_CONFIG.headerHeight;
  
  // Stats background - matching HTML template
  pdf.setFillColor(248, 248, 248); // #f8f8f8 background
  pdf.rect(margin, statsY, contentWidth, HTML_TEMPLATE_CONFIG.statsHeight, 'F');
  
  // Stats bottom border
  pdf.setLineWidth(2);
  pdf.setDrawColor(0, 0, 0);
  pdf.line(margin, statsY + HTML_TEMPLATE_CONFIG.statsHeight, margin + contentWidth, statsY + HTML_TEMPLATE_CONFIG.statsHeight);
  
  // Calculate stats
  const totalEvents = events.length;
  const simplePracticeEvents = events.filter(e => e.title.includes('Appointment')).length;
  const googleEvents = events.filter(e => !e.title.includes('Appointment')).length;
  const totalHours = Math.round(events.reduce((sum, e) => {
    const duration = (e.endTime.getTime() - e.startTime.getTime()) / (1000 * 60 * 60);
    return sum + duration;
  }, 0));
  
  // Draw 4 stat cards matching HTML template grid
  const cardWidth = contentWidth / 4;
  const stats = [
    { label: 'Total Events', value: totalEvents.toString() },
    { label: 'SimplePractice', value: simplePracticeEvents.toString() },
    { label: 'Google Calendar', value: googleEvents.toString() },
    { label: 'Total Hours', value: totalHours.toString() }
  ];
  
  stats.forEach((stat, index) => {
    const x = margin + (index * cardWidth);
    
    // Card border
    if (index < 3) {
      pdf.setLineWidth(2);
      pdf.line(x + cardWidth, statsY, x + cardWidth, statsY + HTML_TEMPLATE_CONFIG.statsHeight);
    }
    
    // Stat number
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text(stat.value, x + cardWidth / 2, statsY + 16, { align: 'center' });
    
    // Stat label
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(stat.label, x + cardWidth / 2, statsY + 30, { align: 'center' });
  });
}

function drawLegend(pdf: jsPDF): void {
  const margin = 15;
  const contentWidth = HTML_TEMPLATE_CONFIG.pageWidth - (margin * 2);
  const legendY = margin + HTML_TEMPLATE_CONFIG.headerHeight + HTML_TEMPLATE_CONFIG.statsHeight;
  
  // Legend background with visible white fill
  pdf.setFillColor(255, 255, 255);
  pdf.rect(margin, legendY, contentWidth, HTML_TEMPLATE_CONFIG.legendHeight, 'F');
  
  // Strong legend border for visibility
  pdf.setLineWidth(2);
  pdf.setDrawColor(0, 0, 0);
  pdf.rect(margin, legendY, contentWidth, HTML_TEMPLATE_CONFIG.legendHeight);
  
  // Legend items positioned horizontally with proper spacing
  const legendItems = [
    { label: 'SimplePractice', color: { r: 66, g: 133, b: 244 }, style: 'left-border' },
    { label: 'Google Calendar', color: { r: 52, g: 168, b: 83 }, style: 'dashed' },
    { label: 'US Holidays', color: { r: 251, g: 188, b: 4 }, style: 'filled' }
  ];
  
  // Calculate spacing to center legend items
  const totalItemsWidth = legendItems.length * 200; // Approximate width per item
  const startX = margin + (contentWidth - totalItemsWidth) / 2;
  
  legendItems.forEach((item, index) => {
    const x = startX + (index * 200);
    const symbolY = legendY + 8;
    const symbolSize = 16;
    
    if (item.style === 'dashed') {
      // Google Calendar - dashed green border
      pdf.setFillColor(255, 255, 255);
      pdf.rect(x, symbolY, symbolSize, symbolSize, 'F');
      
      pdf.setDrawColor(item.color.r, item.color.g, item.color.b);
      pdf.setLineWidth(2);
      pdf.setLineDashPattern([3, 2], 0);
      pdf.rect(x, symbolY, symbolSize, symbolSize);
      pdf.setLineDashPattern([], 0);
    } else if (item.style === 'left-border') {
      // SimplePractice - white box with blue left border
      pdf.setFillColor(255, 255, 255);
      pdf.rect(x, symbolY, symbolSize, symbolSize, 'F');
      
      // Regular gray border
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(1);
      pdf.rect(x, symbolY, symbolSize, symbolSize);
      
      // Blue left border (thick)
      pdf.setDrawColor(item.color.r, item.color.g, item.color.b);
      pdf.setLineWidth(4);
      pdf.line(x, symbolY, x, symbolY + symbolSize);
    } else if (item.style === 'filled') {
      // US Holidays - solid yellow filled box
      pdf.setFillColor(item.color.r, item.color.g, item.color.b);
      pdf.rect(x, symbolY, symbolSize, symbolSize, 'F');
      
      // Dark border for contrast
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(1);
      pdf.rect(x, symbolY, symbolSize, symbolSize);
    }
    
    // Legend text - properly positioned
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);
    pdf.text(item.label, x + symbolSize + 6, symbolY + 10);
  });
}

function drawCalendarGrid(pdf: jsPDF, weekStartDate: Date, events: CalendarEvent[]): void {
  const margin = 15; // Match header margin
  const contentWidth = HTML_TEMPLATE_CONFIG.pageWidth - (margin * 2);
  const gridY = margin + HTML_TEMPLATE_CONFIG.gridStartY;
  
  // Calculate day column width exactly matching HTML template
  const dayColumnWidth = HTML_TEMPLATE_CONFIG.dayColumnWidth;
  
  // === TIME COLUMN HEADER ===
  pdf.setFillColor(255, 255, 255);
  pdf.rect(margin, gridY, HTML_TEMPLATE_CONFIG.timeColumnWidth, 35, 'F');
  
  pdf.setLineWidth(2);
  pdf.setDrawColor(0, 0, 0);
  pdf.rect(margin, gridY, HTML_TEMPLATE_CONFIG.timeColumnWidth, 35);
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('TIME', margin + HTML_TEMPLATE_CONFIG.timeColumnWidth / 2, gridY + 20, { align: 'center' });
  
  // === DAY HEADERS ===
  const dayNames = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(weekStartDate);
    dayDate.setDate(weekStartDate.getDate() + i);
    
    const x = margin + HTML_TEMPLATE_CONFIG.timeColumnWidth + (i * dayColumnWidth);
    
    // Day header background
    pdf.setFillColor(255, 255, 255);
    pdf.rect(x, gridY, dayColumnWidth, 35, 'F');
    
    // Day header borders
    pdf.setLineWidth(1);
    pdf.setDrawColor(0, 0, 0);
    pdf.rect(x, gridY, dayColumnWidth, 35);
    
    // Bottom border for header row
    pdf.setLineWidth(3);
    pdf.line(x, gridY + 35, x + dayColumnWidth, gridY + 35);
    
    // Day name - matching HTML template font sizes
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.text(dayNames[i], x + dayColumnWidth / 2, gridY + 15, { align: 'center' });
    
    // Day date - matching HTML template
    pdf.setFontSize(12);
    pdf.text(dayDate.getDate().toString(), x + dayColumnWidth / 2, gridY + 28, { align: 'center' });
  }
  
  // === TIME SLOTS AND CELLS ===
  TIME_SLOTS.forEach((timeSlot, index) => {
    const isHour = timeSlot.endsWith(':00');
    const y = gridY + 35 + (index * HTML_TEMPLATE_CONFIG.timeSlotHeight);
    
    // Time slot background - matching HTML template colors
    if (isHour) {
      pdf.setFillColor(240, 240, 240); // #f0f0f0 for hours
    } else {
      pdf.setFillColor(248, 248, 248); // #f8f8f8 for half-hours
    }
    pdf.rect(margin, y, HTML_TEMPLATE_CONFIG.timeColumnWidth, HTML_TEMPLATE_CONFIG.timeSlotHeight, 'F');
    
    // Time slot borders
    pdf.setLineWidth(isHour ? 2 : 1);
    pdf.setDrawColor(0, 0, 0);
    pdf.rect(margin, y, HTML_TEMPLATE_CONFIG.timeColumnWidth, HTML_TEMPLATE_CONFIG.timeSlotHeight);
    
    // Time text - matching HTML template font sizes
    pdf.setFontSize(isHour ? 8 : 7);
    pdf.setFont('helvetica', 'bold');
    pdf.text(timeSlot, margin + HTML_TEMPLATE_CONFIG.timeColumnWidth / 2, y + HTML_TEMPLATE_CONFIG.timeSlotHeight / 2 + 2, { align: 'center' });
    
    // Calendar cells for each day
    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      const x = margin + HTML_TEMPLATE_CONFIG.timeColumnWidth + (dayIndex * dayColumnWidth);
      
      // Cell background
      pdf.setFillColor(255, 255, 255);
      pdf.rect(x, y, dayColumnWidth, HTML_TEMPLATE_CONFIG.timeSlotHeight, 'F');
      
      // Cell borders - matching HTML template
      pdf.setLineWidth(isHour ? 2 : 1);
      pdf.setDrawColor(isHour ? 0 : 221, isHour ? 0 : 221, isHour ? 0 : 221); // #ddd for half-hour borders
      pdf.line(x, y + HTML_TEMPLATE_CONFIG.timeSlotHeight, x + dayColumnWidth, y + HTML_TEMPLATE_CONFIG.timeSlotHeight);
      
      // Vertical borders between days
      pdf.setLineWidth(1);
      pdf.setDrawColor(221, 221, 221); // #ddd
      pdf.line(x, y, x, y + HTML_TEMPLATE_CONFIG.timeSlotHeight);
      
      // Right border for last column
      if (dayIndex === 6) {
        pdf.line(x + dayColumnWidth, y, x + dayColumnWidth, y + HTML_TEMPLATE_CONFIG.timeSlotHeight);
      }
    }
  });
  
  // === VERTICAL GRID LINES ===
  // Draw strong vertical lines through entire grid - FIXED positioning
  for (let i = 0; i <= 7; i++) {
    const x = margin + HTML_TEMPLATE_CONFIG.timeColumnWidth + (i * dayColumnWidth);
    pdf.setLineWidth(3);
    pdf.setDrawColor(0, 0, 0);
    pdf.line(x, gridY, x, gridY + 30 + (TIME_SLOTS.length * HTML_TEMPLATE_CONFIG.timeSlotHeight));
  }
  
  // === APPOINTMENTS ===
  drawAppointments(pdf, weekStartDate, events, gridY);
}

function drawAppointments(pdf: jsPDF, weekStartDate: Date, events: CalendarEvent[], gridY: number): void {
  const margin = 15; // Match grid margin
  const dayColumnWidth = HTML_TEMPLATE_CONFIG.dayColumnWidth;
  
  // Filter events for this week
  const weekEvents = events.filter(event => {
    const eventDate = new Date(event.startTime);
    const weekEnd = new Date(weekStartDate);
    weekEnd.setDate(weekEnd.getDate() + 6);
    return eventDate >= weekStartDate && eventDate <= weekEnd;
  });
  
  // Group events by day to handle overlapping
  const eventsByDay = Array.from({ length: 7 }, () => []);
  
  weekEvents.forEach(event => {
    const eventDate = new Date(event.startTime);
    const dayIndex = Math.floor((eventDate.getTime() - weekStartDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (dayIndex >= 0 && dayIndex < 7) {
      eventsByDay[dayIndex].push(event);
    }
  });
  
  // Draw events for each day
  eventsByDay.forEach((dayEvents, dayIndex) => {
    dayEvents.forEach((event, eventIndex) => {
      const eventDate = new Date(event.startTime);
      const startHour = eventDate.getHours();
      const startMinute = eventDate.getMinutes();
      
      // Find the closest time slot
      let slotIndex = -1;
      const eventTime = startHour * 60 + startMinute;
      
      for (let i = 0; i < TIME_SLOTS.length; i++) {
        const [slotHour, slotMinute] = TIME_SLOTS[i].split(':').map(Number);
        const slotTime = slotHour * 60 + slotMinute;
        
        if (eventTime >= slotTime) {
          slotIndex = i;
        } else {
          break;
        }
      }
      
      if (slotIndex === -1) return;
      
      const duration = (event.endTime.getTime() - event.startTime.getTime()) / (1000 * 60);
      const heightInSlots = Math.max(1, Math.round(duration / 30));
      
      // Calculate position with better spacing
      const x = margin + HTML_TEMPLATE_CONFIG.timeColumnWidth + (dayIndex * dayColumnWidth) + 3;
      const y = gridY + 35 + (slotIndex * HTML_TEMPLATE_CONFIG.timeSlotHeight) + 2;
      const width = dayColumnWidth - 6;
      const height = (heightInSlots * HTML_TEMPLATE_CONFIG.timeSlotHeight) - 4;
    
      // Appointment styling matching HTML template
      const isSimplePractice = event.title.includes('Appointment');
      if (isSimplePractice) {
        // SimplePractice styling: light background with blue left border
        pdf.setFillColor(250, 250, 250); // Very light background
        pdf.rect(x, y, width, height, 'F');
        
        // Blue border around appointment
        pdf.setDrawColor(100, 149, 237); // #6495ED
        pdf.setLineWidth(1);
        pdf.rect(x, y, width, height);
        
        // Thick blue left border (matching HTML template border-left: 8px solid #6495ED)
        pdf.setDrawColor(100, 149, 237); // #6495ED
        pdf.setLineWidth(4);
        pdf.line(x, y, x, y + height);
      } else {
        // Google Calendar event - light green background with green border
        pdf.setFillColor(240, 255, 240); // Light green background
        pdf.rect(x, y, width, height, 'F');
        
        // Green border
        pdf.setDrawColor(52, 168, 83); // #34a853
        pdf.setLineWidth(1);
        pdf.rect(x, y, width, height);
      }
      
      // Appointment text - better readability
      const cleanTitle = event.title.replace(/ Appointment$/, '');
      const timeText = `${formatTime(event.startTime)}`;
      
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      
      // Multi-line text fitting with proper spacing
      const lines = pdf.splitTextToSize(cleanTitle, width - 8);
      const lineHeight = 8;
      
      lines.forEach((line: string, index: number) => {
        if (index < 2) { // Limit to 2 lines to prevent overflow
          pdf.text(line, x + 4, y + 10 + (index * lineHeight));
        }
      });
      
      // Time at bottom with better positioning
      pdf.setFontSize(6);
      pdf.setFont('helvetica', 'normal');
      pdf.text(timeText, x + 4, y + height - 4);
    });
  });
}