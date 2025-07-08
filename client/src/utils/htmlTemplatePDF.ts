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

// HTML Template Configuration - Professional calendar layout
const HTML_TEMPLATE_CONFIG = {
  // Page dimensions - A3 landscape for professional presentation
  pageWidth: 1190,
  pageHeight: 842,
  
  // Layout structure - cohesive design with proper flow
  margin: 15,
  headerHeight: 65,
  statsHeight: 50,
  legendHeight: 30,
  
  // Total header section height
  get totalHeaderHeight() {
    return this.headerHeight + this.statsHeight + this.legendHeight;
  },
  
  // Grid configuration - optimized for better text containment
  timeColumnWidth: 95,
  get gridStartY() {
    return this.margin + this.totalHeaderHeight; // No gap for cohesive flow
  },
  timeSlotHeight: 16, // Reduced to fit more slots on page
  
  // Text and padding configuration
  cellPadding: 4,
  eventPadding: 3,
  
  // Calculate day column width dynamically
  get dayColumnWidth() {
    return (this.pageWidth - (this.margin * 2) - this.timeColumnWidth) / 7;
  },
  
  // Colors for visual clarity
  colors: {
    black: [0, 0, 0],
    white: [255, 255, 255],
    lightGray: [248, 248, 248],
    mediumGray: [220, 220, 220],
    darkGray: [180, 180, 180],
    simplePracticeBlue: [66, 133, 244],
    googleGreen: [52, 168, 83],
    holidayYellow: [251, 188, 4]
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

  // === HEADER SECTION (includes stats and legend) ===
  drawHeader(pdf, weekStartDate, weekEndDate, events);
  
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

function drawHeader(pdf: jsPDF, weekStartDate: Date, weekEndDate: Date, events: CalendarEvent[]): void {
  const { margin } = HTML_TEMPLATE_CONFIG;
  const totalHeaderHeight = HTML_TEMPLATE_CONFIG.headerHeight + HTML_TEMPLATE_CONFIG.statsHeight + HTML_TEMPLATE_CONFIG.legendHeight;
  
  // Page border
  pdf.setLineWidth(2);
  pdf.setDrawColor(...HTML_TEMPLATE_CONFIG.colors.black);
  pdf.rect(margin, margin, HTML_TEMPLATE_CONFIG.pageWidth - (margin * 2), HTML_TEMPLATE_CONFIG.pageHeight - (margin * 2));
  
  // Complete header background (title + stats + legend)
  pdf.setFillColor(...HTML_TEMPLATE_CONFIG.colors.white);
  pdf.rect(margin, margin, HTML_TEMPLATE_CONFIG.pageWidth - (margin * 2), totalHeaderHeight, 'F');
  
  // === TITLE SECTION ===
  // Main title - H1 style
  pdf.setFontSize(28);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...HTML_TEMPLATE_CONFIG.colors.black);
  pdf.text('WEEKLY PLANNER', HTML_TEMPLATE_CONFIG.pageWidth / 2, margin + 32, { align: 'center' });
  
  // Week info - properly positioned
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'normal');
  const weekNumber = getWeekNumber(weekStartDate);
  const weekText = `${weekStartDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEndDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • Week ${weekNumber}`;
  pdf.text(weekText, HTML_TEMPLATE_CONFIG.pageWidth / 2, margin + 52, { align: 'center' });
  
  // === STATS SECTION ===
  const statsY = margin + HTML_TEMPLATE_CONFIG.headerHeight;
  const contentWidth = HTML_TEMPLATE_CONFIG.pageWidth - (margin * 2);
  
  // Stats background
  pdf.setFillColor(...HTML_TEMPLATE_CONFIG.colors.lightGray);
  pdf.rect(margin, statsY, contentWidth, HTML_TEMPLATE_CONFIG.statsHeight, 'F');
  
  // Stats border
  pdf.setLineWidth(1);
  pdf.setDrawColor(...HTML_TEMPLATE_CONFIG.colors.mediumGray);
  pdf.rect(margin, statsY, contentWidth, HTML_TEMPLATE_CONFIG.statsHeight);
  
  // Calculate weekly stats
  const totalEvents = events.length;
  const totalHours = events.reduce((sum, e) => {
    const duration = (e.endTime.getTime() - e.startTime.getTime()) / (1000 * 60 * 60);
    return sum + duration;
  }, 0);
  const dailyAverage = totalHours / 7;
  const availableHours = (17.5 * 7) - totalHours; // 17.5 hours per day (6am-11:30pm)
  
  // Draw stat cards
  const cardWidth = contentWidth / 4;
  const stats = [
    { label: 'Total Appointments', value: totalEvents.toString() },
    { label: 'Scheduled Time', value: `${totalHours.toFixed(1)}h` },
    { label: 'Daily Average', value: `${dailyAverage.toFixed(1)}h` },
    { label: 'Available Time', value: `${availableHours.toFixed(0)}h` }
  ];
  
  stats.forEach((stat, index) => {
    const x = margin + (index * cardWidth);
    
    // Vertical dividers
    if (index > 0) {
      pdf.setLineWidth(1);
      pdf.setDrawColor(...HTML_TEMPLATE_CONFIG.colors.mediumGray);
      pdf.line(x, statsY + 10, x, statsY + HTML_TEMPLATE_CONFIG.statsHeight - 10);
    }
    
    // Stat value
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...HTML_TEMPLATE_CONFIG.colors.black);
    pdf.text(stat.value, x + cardWidth / 2, statsY + 20, { align: 'center' });
    
    // Stat label
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.text(stat.label, x + cardWidth / 2, statsY + 36, { align: 'center' });
  });
  
  // === LEGEND SECTION ===
  const legendY = statsY + HTML_TEMPLATE_CONFIG.statsHeight;
  
  // Legend background
  pdf.setFillColor(...HTML_TEMPLATE_CONFIG.colors.white);
  pdf.rect(margin, legendY, contentWidth, HTML_TEMPLATE_CONFIG.legendHeight, 'F');
  
  // Legend border
  pdf.setLineWidth(1);
  pdf.setDrawColor(...HTML_TEMPLATE_CONFIG.colors.mediumGray);
  pdf.rect(margin, legendY, contentWidth, HTML_TEMPLATE_CONFIG.legendHeight);
  
  // Legend items
  const legendItems = [
    { label: 'SimplePractice', color: HTML_TEMPLATE_CONFIG.colors.simplePracticeBlue, style: 'left-border' },
    { label: 'Google Calendar', color: HTML_TEMPLATE_CONFIG.colors.googleGreen, style: 'filled' },
    { label: 'Holidays in United States', color: HTML_TEMPLATE_CONFIG.colors.holidayYellow, style: 'filled' }
  ];
  
  const itemWidth = contentWidth / legendItems.length;
  
  legendItems.forEach((item, index) => {
    const x = margin + (index * itemWidth) + 20;
    const symbolY = legendY + 10;
    const symbolSize = 12;
    
    // Draw legend symbol
    if (item.style === 'left-border') {
      // SimplePractice style
      pdf.setFillColor(...HTML_TEMPLATE_CONFIG.colors.white);
      pdf.rect(x, symbolY, symbolSize, symbolSize, 'F');
      pdf.setDrawColor(...HTML_TEMPLATE_CONFIG.colors.mediumGray);
      pdf.setLineWidth(1);
      pdf.rect(x, symbolY, symbolSize, symbolSize);
      // Blue left border
      pdf.setDrawColor(...item.color);
      pdf.setLineWidth(3);
      pdf.line(x, symbolY, x, symbolY + symbolSize);
    } else {
      // Filled style
      pdf.setFillColor(...item.color);
      pdf.rect(x, symbolY, symbolSize, symbolSize, 'F');
      pdf.setDrawColor(...HTML_TEMPLATE_CONFIG.colors.black);
      pdf.setLineWidth(1);
      pdf.rect(x, symbolY, symbolSize, symbolSize);
    }
    
    // Legend text
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...HTML_TEMPLATE_CONFIG.colors.black);
    pdf.text(item.label, x + symbolSize + 6, symbolY + 8);
  });
  
  // Complete header border
  pdf.setLineWidth(3);
  pdf.setDrawColor(...HTML_TEMPLATE_CONFIG.colors.black);
  pdf.line(margin, margin + totalHeaderHeight, HTML_TEMPLATE_CONFIG.pageWidth - margin, margin + totalHeaderHeight);
}

// Remove these functions as they're now integrated into drawHeader

function drawCalendarGrid(pdf: jsPDF, weekStartDate: Date, events: CalendarEvent[]): void {
  const { margin } = HTML_TEMPLATE_CONFIG;
  const gridY = HTML_TEMPLATE_CONFIG.gridStartY;
  const dayColumnWidth = HTML_TEMPLATE_CONFIG.dayColumnWidth;
  const headerHeight = 28;
  
  // Calculate total grid height
  const totalGridHeight = headerHeight + (TIME_SLOTS.length * HTML_TEMPLATE_CONFIG.timeSlotHeight);
  
  // === GRID BACKGROUND ===
  pdf.setFillColor(...HTML_TEMPLATE_CONFIG.colors.white);
  pdf.rect(margin, gridY, HTML_TEMPLATE_CONFIG.timeColumnWidth + (7 * dayColumnWidth), totalGridHeight, 'F');
  
  // === GRID BORDER ===
  pdf.setLineWidth(2);
  pdf.setDrawColor(...HTML_TEMPLATE_CONFIG.colors.black);
  pdf.rect(margin, gridY, HTML_TEMPLATE_CONFIG.timeColumnWidth + (7 * dayColumnWidth), totalGridHeight);
  
  // === TIME COLUMN HEADER ===
  pdf.setFillColor(...HTML_TEMPLATE_CONFIG.colors.lightGray);
  pdf.rect(margin, gridY, HTML_TEMPLATE_CONFIG.timeColumnWidth, headerHeight, 'F');
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...HTML_TEMPLATE_CONFIG.colors.black);
  pdf.text('TIME', margin + HTML_TEMPLATE_CONFIG.timeColumnWidth / 2, gridY + 17, { align: 'center' });
  
  // === DAY HEADERS ===
  const dayNames = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(weekStartDate);
    dayDate.setDate(weekStartDate.getDate() + i);
    const x = margin + HTML_TEMPLATE_CONFIG.timeColumnWidth + (i * dayColumnWidth);
    
    // Day header background
    pdf.setFillColor(...HTML_TEMPLATE_CONFIG.colors.lightGray);
    pdf.rect(x, gridY, dayColumnWidth, headerHeight, 'F');
    
    // Day name - appropriately sized
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.text(dayNames[i], x + dayColumnWidth / 2, gridY + 12, { align: 'center' });
    
    // Date number - appropriately sized
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text(dayDate.getDate().toString(), x + dayColumnWidth / 2, gridY + 22, { align: 'center' });
  }
  
  // === TIME GRID ===
  TIME_SLOTS.forEach((timeSlot, index) => {
    const isHour = timeSlot.endsWith(':00');
    const y = gridY + headerHeight + (index * HTML_TEMPLATE_CONFIG.timeSlotHeight);
    
    // Time column cell
    pdf.setFillColor(...(isHour ? HTML_TEMPLATE_CONFIG.colors.lightGray : HTML_TEMPLATE_CONFIG.colors.white));
    pdf.rect(margin, y, HTML_TEMPLATE_CONFIG.timeColumnWidth, HTML_TEMPLATE_CONFIG.timeSlotHeight, 'F');
    
    // Time text with better formatting
    pdf.setFontSize(isHour ? 9 : 8);
    pdf.setFont('helvetica', isHour ? 'bold' : 'normal');
    pdf.setTextColor(...HTML_TEMPLATE_CONFIG.colors.black);
    pdf.text(timeSlot, margin + HTML_TEMPLATE_CONFIG.timeColumnWidth / 2, y + 12, { align: 'center' });
    
    // Day cells
    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      const x = margin + HTML_TEMPLATE_CONFIG.timeColumnWidth + (dayIndex * dayColumnWidth);
      
      // Cell background
      pdf.setFillColor(...HTML_TEMPLATE_CONFIG.colors.white);
      pdf.rect(x, y, dayColumnWidth, HTML_TEMPLATE_CONFIG.timeSlotHeight, 'F');
    }
    
    // Horizontal grid lines
    if (isHour) {
      pdf.setLineWidth(1);
      pdf.setDrawColor(...HTML_TEMPLATE_CONFIG.colors.darkGray);
    } else {
      pdf.setLineWidth(0.5);
      pdf.setDrawColor(...HTML_TEMPLATE_CONFIG.colors.mediumGray);
    }
    
    // Draw horizontal line across entire width
    const lineY = y + HTML_TEMPLATE_CONFIG.timeSlotHeight;
    pdf.line(margin, lineY, margin + HTML_TEMPLATE_CONFIG.timeColumnWidth + (7 * dayColumnWidth), lineY);
  });
  
  // === VERTICAL GRID LINES ===
  for (let i = 0; i <= 7; i++) {
    const x = margin + HTML_TEMPLATE_CONFIG.timeColumnWidth + (i * dayColumnWidth);
    pdf.setLineWidth(1);
    pdf.setDrawColor(...HTML_TEMPLATE_CONFIG.colors.mediumGray);
    pdf.line(x, gridY + headerHeight, x, gridY + totalGridHeight);
  }
  
  // === MAIN VERTICAL SEPARATORS ===
  // Time column separator
  pdf.setLineWidth(2);
  pdf.setDrawColor(...HTML_TEMPLATE_CONFIG.colors.black);
  pdf.line(margin + HTML_TEMPLATE_CONFIG.timeColumnWidth, gridY, margin + HTML_TEMPLATE_CONFIG.timeColumnWidth, gridY + totalGridHeight);
  
  // Header separator
  pdf.line(margin, gridY + headerHeight, margin + HTML_TEMPLATE_CONFIG.timeColumnWidth + (7 * dayColumnWidth), gridY + headerHeight);
  
  // === EVENTS ===
  drawAppointments(pdf, weekStartDate, events, gridY + headerHeight);
}

function drawAppointments(pdf: jsPDF, weekStartDate: Date, events: CalendarEvent[], gridStartY: number): void {
  const { margin } = HTML_TEMPLATE_CONFIG;
  const dayColumnWidth = HTML_TEMPLATE_CONFIG.dayColumnWidth;
  
  // Filter events for the current week
  const weekEvents = events.filter(event => {
    const eventDate = new Date(event.startTime);
    const weekEnd = new Date(weekStartDate);
    weekEnd.setDate(weekEnd.getDate() + 6);
    return eventDate >= weekStartDate && eventDate <= weekEnd;
  });
  
  weekEvents.forEach(event => {
    const eventDate = new Date(event.startTime);
    const dayIndex = Math.floor((eventDate.getTime() - weekStartDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (dayIndex < 0 || dayIndex >= 7) return;
    
    // Get event time
    const startHour = eventDate.getHours();
    const startMinute = eventDate.getMinutes();
    
    // Find the exact time slot this event should align with
    const timeString = `${String(startHour).padStart(2, '0')}:${String(startMinute).padStart(2, '0')}`;
    
    // Find the slot index by matching against TIME_SLOTS
    let slotIndex = -1;
    for (let i = 0; i < TIME_SLOTS.length; i++) {
      const slot = TIME_SLOTS[i];
      if (slot === timeString) {
        slotIndex = i;
        break;
      }
      // Also check if this time falls within a 30-minute slot
      const [slotHour, slotMin] = slot.split(':').map(Number);
      const nextSlotMin = slotMin === 0 ? 30 : 0;
      const nextSlotHour = slotMin === 0 ? slotHour : slotHour + 1;
      
      if (startHour === slotHour && startMinute >= slotMin && 
          (startHour < nextSlotHour || (startHour === nextSlotHour && startMinute < nextSlotMin))) {
        slotIndex = i;
        break;
      }
    }
    
    if (slotIndex === -1) return; // Event time not found in grid
    
    // Calculate event height based on duration
    const duration = (event.endTime.getTime() - event.startTime.getTime()) / (1000 * 60);
    const heightInSlots = Math.max(1, Math.ceil(duration / 30));
    
    // Position calculation with improved spacing
    const x = margin + HTML_TEMPLATE_CONFIG.timeColumnWidth + (dayIndex * dayColumnWidth) + 1;
    const y = gridStartY + (slotIndex * HTML_TEMPLATE_CONFIG.timeSlotHeight) + 1;
    const width = dayColumnWidth - 2;
    const height = (heightInSlots * HTML_TEMPLATE_CONFIG.timeSlotHeight) - 2;
    
    // Event styling
    const isSimplePractice = event.title.includes('Appointment');
    
    if (isSimplePractice) {
      // SimplePractice: light gray background with blue left border
      pdf.setFillColor(248, 248, 248);
      pdf.rect(x, y, width, height, 'F');
      
      // Blue left border
      pdf.setDrawColor(...HTML_TEMPLATE_CONFIG.colors.simplePracticeBlue);
      pdf.setLineWidth(3);
      pdf.line(x, y, x, y + height);
      
      // Light border around event
      pdf.setDrawColor(...HTML_TEMPLATE_CONFIG.colors.mediumGray);
      pdf.setLineWidth(0.5);
      pdf.rect(x, y, width, height);
    } else {
      // Google Calendar: light green filled
      pdf.setFillColor(240, 255, 240);
      pdf.rect(x, y, width, height, 'F');
      pdf.setDrawColor(...HTML_TEMPLATE_CONFIG.colors.googleGreen);
      pdf.setLineWidth(1);
      pdf.rect(x, y, width, height);
    }
    
    // Event text with proper formatting
    const cleanTitle = event.title.replace(/ Appointment$/, '');
    
    // Calculate available text area with padding
    const textWidth = width - (HTML_TEMPLATE_CONFIG.eventPadding * 2);
    const textHeight = height - (HTML_TEMPLATE_CONFIG.eventPadding * 2);
    
    // Event name on first line - MUCH LARGER as requested
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...HTML_TEMPLATE_CONFIG.colors.black);
    
    // Split text to fit width properly
    const nameLines = pdf.splitTextToSize(cleanTitle, textWidth);
    
    // Draw name (max 2 lines for readability)
    const nameLineHeight = 11;
    const maxNameLines = Math.min(nameLines.length, height > 24 ? 2 : 1);
    
    for (let i = 0; i < maxNameLines; i++) {
      pdf.text(nameLines[i], x + HTML_TEMPLATE_CONFIG.eventPadding, y + 12 + (i * nameLineHeight));
    }
    
    // Time range on second line if there's space - LARGER font
    if (textHeight > 14) {
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(60, 60, 60);
      
      // Format time range
      const startTime = formatTime(event.startTime);
      const endTime = formatTime(event.endTime);
      const timeRange = `${startTime} - ${endTime}`;
      
      // Position time range below name
      const timeY = y + 12 + (maxNameLines * nameLineHeight) + 2;
      if (timeY + 8 <= y + height - HTML_TEMPLATE_CONFIG.eventPadding) {
        pdf.text(timeRange, x + HTML_TEMPLATE_CONFIG.eventPadding, timeY);
      }
    }
  });
}