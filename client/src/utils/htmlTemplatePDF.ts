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

// reMarkable Paper Pro specific configuration for daily view
const REMARKABLE_DAILY_CONFIG = {
  // Portrait dimensions in mm (179mm x 239mm)
  pageWidth: 179,
  pageHeight: 239,
  margin: 8,
  
  // Header configuration
  headerHeight: 25,
  statsHeight: 20,
  legendHeight: 12,
  
  get totalHeaderHeight() {
    return this.headerHeight + this.statsHeight + this.legendHeight;
  },
  
  // Grid configuration optimized for portrait
  timeColumnWidth: 25,
  get gridStartY() {
    return this.margin + this.totalHeaderHeight;
  },
  timeSlotHeight: 4.5, // Smaller slots for portrait format
  
  get dayColumnWidth() {
    return this.pageWidth - (this.margin * 2) - this.timeColumnWidth;
  },
  
  // Typography for e-ink display
  fonts: {
    title: 14,
    subtitle: 8,
    stats: 6,
    timeSlot: 5,
    eventTitle: 6,
    eventTime: 4
  },
  
  // Colors optimized for e-ink
  colors: {
    black: [0, 0, 0],
    white: [255, 255, 255],
    lightGray: [240, 240, 240],
    mediumGray: [200, 200, 200],
    darkGray: [160, 160, 160]
  }
};

// HTML Template Configuration - Professional calendar layout
const HTML_TEMPLATE_CONFIG = {
  // Page dimensions - A3 landscape for professional presentation
  pageWidth: 1190,
  pageHeight: 842,
  
  // Layout structure - cohesive design with proper flow
  margin: 15,
  headerHeight: 60,
  statsHeight: 45,
  legendHeight: 25,
  
  // Total header section height
  get totalHeaderHeight() {
    return this.headerHeight + this.statsHeight + this.legendHeight;
  },
  
  // Grid configuration - optimized for better text containment
  timeColumnWidth: 95,
  get gridStartY() {
    return this.margin + this.totalHeaderHeight; // No gap for cohesive flow
  },
  timeSlotHeight: 18, // Optimal height for text readability
  
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

// Compact time slots for reMarkable daily view (hourly only)
const REMARKABLE_TIME_SLOTS = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00',
  '20:00', '21:00', '22:00', '23:00'
];

export const exportHTMLTemplatePDF = async (
  weekStartDate: Date,
  weekEndDate: Date,
  events: CalendarEvent[],
  isDailyView: boolean = false
): Promise<void> => {
  let pdf;
  
  if (isDailyView) {
    // reMarkable Paper Pro portrait dimensions (179mm x 239mm)
    pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [179, 239]
    });
  } else {
    // Weekly view uses landscape
    pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'pt',
      format: [HTML_TEMPLATE_CONFIG.pageWidth, HTML_TEMPLATE_CONFIG.pageHeight]
    });
  }

  // Set default font - use helvetica instead of arial for better compatibility
  pdf.setFont('helvetica', 'normal');

  if (isDailyView) {
    // === DAILY VIEW LAYOUT ===
    drawDailyHeader(pdf, weekStartDate, events);
    drawDailyGrid(pdf, weekStartDate, events);
    
    // Save the PDF with daily filename
    const filename = `daily-planner-${weekStartDate.getFullYear()}-${String(weekStartDate.getMonth() + 1).padStart(2, '0')}-${String(weekStartDate.getDate()).padStart(2, '0')}.pdf`;
    
    try {
      pdf.save(filename);
      console.log(`✅ Daily Template PDF exported: ${filename}`);
      console.log('✅ PDF download should have started automatically');
    } catch (error) {
      console.error('❌ Error saving daily PDF:', error);
      throw error;
    }
  } else {
    // === WEEKLY VIEW LAYOUT ===
    drawHeader(pdf, weekStartDate, weekEndDate, events);
    drawCalendarGrid(pdf, weekStartDate, events);

    // Save the PDF with weekly filename
    const filename = `weekly-planner-${weekStartDate.getFullYear()}-${String(weekStartDate.getMonth() + 1).padStart(2, '0')}-${String(weekStartDate.getDate()).padStart(2, '0')}.pdf`;
    
    try {
      pdf.save(filename);
      console.log(`✅ HTML Template PDF exported: ${filename}`);
      console.log('✅ PDF download should have started automatically');
    } catch (error) {
      console.error('❌ Error saving PDF:', error);
      throw error;
    }
  }
};

function drawDailyHeader(pdf: jsPDF, selectedDate: Date, events: CalendarEvent[]): void {
  const { margin, pageWidth, pageHeight } = REMARKABLE_DAILY_CONFIG;
  const totalHeaderHeight = REMARKABLE_DAILY_CONFIG.totalHeaderHeight;
  
  // Convert mm to points (1mm = 2.834 points)
  const mmToPt = 2.834;
  const pageWidthPt = pageWidth * mmToPt;
  const pageHeightPt = pageHeight * mmToPt;
  const marginPt = margin * mmToPt;
  const totalHeaderHeightPt = totalHeaderHeight * mmToPt;
  
  // Page border
  pdf.setLineWidth(1);
  pdf.setDrawColor(...REMARKABLE_DAILY_CONFIG.colors.black);
  pdf.rect(marginPt, marginPt, pageWidthPt - (marginPt * 2), pageHeightPt - (marginPt * 2));
  
  // Complete header background
  pdf.setFillColor(...REMARKABLE_DAILY_CONFIG.colors.white);
  pdf.rect(marginPt, marginPt, pageWidthPt - (marginPt * 2), totalHeaderHeightPt, 'F');
  
  // === TITLE SECTION ===
  pdf.setFontSize(REMARKABLE_DAILY_CONFIG.fonts.title);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...REMARKABLE_DAILY_CONFIG.colors.black);
  pdf.text('DAILY PLANNER', pageWidthPt / 2, marginPt + 15, { align: 'center' });
  
  // Date info
  pdf.setFontSize(REMARKABLE_DAILY_CONFIG.fonts.subtitle);
  pdf.setFont('helvetica', 'normal');
  const dateText = selectedDate.toLocaleDateString('en-US', { 
    weekday: 'long',
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  pdf.text(dateText, pageWidthPt / 2, marginPt + 22, { align: 'center' });
  
  // === STATS SECTION ===
  const statsY = margin + HTML_TEMPLATE_CONFIG.headerHeight;
  const contentWidth = HTML_TEMPLATE_CONFIG.pageWidth - (margin * 2);
  
  // Filter events for the selected day
  const dayEvents = events.filter(event => {
    const eventDate = new Date(event.startTime);
    return eventDate.toDateString() === selectedDate.toDateString();
  });
  
  // Stats background
  pdf.setFillColor(...HTML_TEMPLATE_CONFIG.colors.lightGray);
  pdf.rect(margin, statsY, contentWidth, HTML_TEMPLATE_CONFIG.statsHeight, 'F');
  
  // Stats border
  pdf.setLineWidth(1);
  pdf.setDrawColor(...HTML_TEMPLATE_CONFIG.colors.mediumGray);
  pdf.rect(margin, statsY, contentWidth, HTML_TEMPLATE_CONFIG.statsHeight);
  
  // Calculate daily stats
  const totalEvents = dayEvents.length;
  const totalHours = dayEvents.reduce((sum, e) => {
    const duration = (e.endTime.getTime() - e.startTime.getTime()) / (1000 * 60 * 60);
    return sum + duration;
  }, 0);
  const availableHours = 17.5 - totalHours; // 17.5 hours per day (6am-11:30pm)
  const busyPercentage = totalHours > 0 ? ((totalHours / 17.5) * 100).toFixed(0) : '0';
  
  // Draw stat cards
  const cardWidth = contentWidth / 4;
  const stats = [
    { label: 'Total Appointments', value: totalEvents.toString() },
    { label: 'Scheduled Time', value: `${totalHours.toFixed(1)}h` },
    { label: 'Available Time', value: `${availableHours.toFixed(1)}h` },
    { label: 'Day Utilization', value: `${busyPercentage}%` }
  ];
  
  stats.forEach((stat, index) => {
    const x = margin + (index * cardWidth);
    
    // Vertical dividers
    if (index > 0) {
      pdf.setLineWidth(1);
      pdf.setDrawColor(...HTML_TEMPLATE_CONFIG.colors.mediumGray);
      pdf.line(x, statsY + 8, x, statsY + HTML_TEMPLATE_CONFIG.statsHeight - 8);
    }
    
    // Stat value
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...HTML_TEMPLATE_CONFIG.colors.black);
    pdf.text(stat.value, x + cardWidth / 2, statsY + 18, { align: 'center' });
    
    // Stat label
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.text(stat.label, x + cardWidth / 2, statsY + 32, { align: 'center' });
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
    const x = margin + (index * itemWidth) + 18;
    const symbolY = legendY + 8;
    const symbolSize = 10;
    
    // Draw legend symbol
    if (item.style === 'left-border') {
      pdf.setFillColor(...HTML_TEMPLATE_CONFIG.colors.white);
      pdf.rect(x, symbolY, symbolSize, symbolSize, 'F');
      pdf.setDrawColor(...HTML_TEMPLATE_CONFIG.colors.mediumGray);
      pdf.setLineWidth(1);
      pdf.rect(x, symbolY, symbolSize, symbolSize);
      pdf.setDrawColor(...item.color);
      pdf.setLineWidth(3);
      pdf.line(x, symbolY, x, symbolY + symbolSize);
    } else {
      pdf.setFillColor(...item.color);
      pdf.rect(x, symbolY, symbolSize, symbolSize, 'F');
      pdf.setDrawColor(...HTML_TEMPLATE_CONFIG.colors.black);
      pdf.setLineWidth(1);
      pdf.rect(x, symbolY, symbolSize, symbolSize);
    }
    
    // Legend text
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...HTML_TEMPLATE_CONFIG.colors.black);
    pdf.text(item.label, x + symbolSize + 5, symbolY + 6);
  });
  
  // Complete header border
  pdf.setLineWidth(3);
  pdf.setDrawColor(...HTML_TEMPLATE_CONFIG.colors.black);
  pdf.line(margin, margin + totalHeaderHeight, HTML_TEMPLATE_CONFIG.pageWidth - margin, margin + totalHeaderHeight);
}

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
  pdf.setFontSize(26);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...HTML_TEMPLATE_CONFIG.colors.black);
  pdf.text('WEEKLY PLANNER', HTML_TEMPLATE_CONFIG.pageWidth / 2, margin + 28, { align: 'center' });
  
  // Week info - properly positioned
  pdf.setFontSize(13);
  pdf.setFont('helvetica', 'normal');
  const weekNumber = getWeekNumber(weekStartDate);
  const weekText = `${weekStartDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEndDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • Week ${weekNumber}`;
  pdf.text(weekText, HTML_TEMPLATE_CONFIG.pageWidth / 2, margin + 46, { align: 'center' });
  
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
      pdf.line(x, statsY + 8, x, statsY + HTML_TEMPLATE_CONFIG.statsHeight - 8);
    }
    
    // Stat value
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...HTML_TEMPLATE_CONFIG.colors.black);
    pdf.text(stat.value, x + cardWidth / 2, statsY + 18, { align: 'center' });
    
    // Stat label
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.text(stat.label, x + cardWidth / 2, statsY + 32, { align: 'center' });
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
    const x = margin + (index * itemWidth) + 18;
    const symbolY = legendY + 8;
    const symbolSize = 10;
    
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
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...HTML_TEMPLATE_CONFIG.colors.black);
    pdf.text(item.label, x + symbolSize + 5, symbolY + 6);
  });
  
  // Complete header border
  pdf.setLineWidth(3);
  pdf.setDrawColor(...HTML_TEMPLATE_CONFIG.colors.black);
  pdf.line(margin, margin + totalHeaderHeight, HTML_TEMPLATE_CONFIG.pageWidth - margin, margin + totalHeaderHeight);
}

// Remove these functions as they're now integrated into drawHeader

function drawDailyGrid(pdf: jsPDF, selectedDate: Date, events: CalendarEvent[]): void {
  const { margin, pageWidth, pageHeight, timeColumnWidth } = REMARKABLE_DAILY_CONFIG;
  const mmToPt = 2.834;
  const marginPt = margin * mmToPt;
  const gridY = REMARKABLE_DAILY_CONFIG.gridStartY * mmToPt;
  const headerHeight = 15;
  
  // Calculate single day column width (much wider for daily view)
  const dayColumnWidth = (pageWidth - (margin * 2) - timeColumnWidth) * mmToPt;
  const timeColumnWidthPt = timeColumnWidth * mmToPt;
  
  // Calculate total grid height using compact time slots
  const timeSlotHeightPt = REMARKABLE_DAILY_CONFIG.timeSlotHeight * mmToPt;
  const totalGridHeight = headerHeight + (REMARKABLE_TIME_SLOTS.length * timeSlotHeightPt);
  
  // === GRID BACKGROUND ===
  pdf.setFillColor(...REMARKABLE_DAILY_CONFIG.colors.white);
  pdf.rect(marginPt, gridY, timeColumnWidthPt + dayColumnWidth, totalGridHeight, 'F');
  
  // === GRID BORDER ===
  pdf.setLineWidth(0.5);
  pdf.setDrawColor(...REMARKABLE_DAILY_CONFIG.colors.black);
  pdf.rect(marginPt, gridY, timeColumnWidthPt + dayColumnWidth, totalGridHeight);
  
  // === TIME COLUMN HEADER ===
  pdf.setFillColor(...REMARKABLE_DAILY_CONFIG.colors.lightGray);
  pdf.rect(marginPt, gridY, timeColumnWidthPt, headerHeight, 'F');
  
  pdf.setFontSize(REMARKABLE_DAILY_CONFIG.fonts.stats);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...REMARKABLE_DAILY_CONFIG.colors.black);
  pdf.text('TIME', marginPt + timeColumnWidthPt / 2, gridY + 10, { align: 'center' });
  
  // === DAY HEADER ===
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const x = marginPt + timeColumnWidthPt;
  
  // Day header background
  pdf.setFillColor(...REMARKABLE_DAILY_CONFIG.colors.lightGray);
  pdf.rect(x, gridY, dayColumnWidth, headerHeight, 'F');
  
  // Day name and date
  pdf.setFontSize(REMARKABLE_DAILY_CONFIG.fonts.subtitle);
  pdf.setFont('helvetica', 'bold');
  const dayName = dayNames[selectedDate.getDay()];
  pdf.text(dayName, x + dayColumnWidth / 2, gridY + 8, { align: 'center' });
  
  pdf.setFontSize(REMARKABLE_DAILY_CONFIG.fonts.stats);
  pdf.setFont('helvetica', 'normal');
  const dateText = selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  pdf.text(dateText, x + dayColumnWidth / 2, gridY + 12, { align: 'center' });
  
  // === TIME GRID ===
  REMARKABLE_TIME_SLOTS.forEach((timeSlot, index) => {
    const y = gridY + headerHeight + (index * timeSlotHeightPt);
    
    // Time column cell
    pdf.setFillColor(...REMARKABLE_DAILY_CONFIG.colors.lightGray);
    pdf.rect(marginPt, y, timeColumnWidthPt, timeSlotHeightPt, 'F');
    
    // Time text
    pdf.setFontSize(REMARKABLE_DAILY_CONFIG.fonts.timeSlot);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...REMARKABLE_DAILY_CONFIG.colors.black);
    pdf.text(timeSlot, marginPt + timeColumnWidthPt / 2, y + timeSlotHeightPt / 2 + 1, { align: 'center' });
    
    // Day cell
    pdf.setFillColor(...REMARKABLE_DAILY_CONFIG.colors.white);
    pdf.rect(x, y, dayColumnWidth, timeSlotHeightPt, 'F');
    
    // Horizontal grid lines
    pdf.setLineWidth(0.25);
    pdf.setDrawColor(...REMARKABLE_DAILY_CONFIG.colors.mediumGray);
    const lineY = y + timeSlotHeightPt;
    pdf.line(marginPt, lineY, marginPt + timeColumnWidthPt + dayColumnWidth, lineY);
  });
  
  // === VERTICAL GRID LINES ===
  // Time column separator
  pdf.setLineWidth(0.5);
  pdf.setDrawColor(...REMARKABLE_DAILY_CONFIG.colors.black);
  pdf.line(marginPt + timeColumnWidthPt, gridY, marginPt + timeColumnWidthPt, gridY + totalGridHeight);
  
  // Header separator
  pdf.line(marginPt, gridY + headerHeight, marginPt + timeColumnWidthPt + dayColumnWidth, gridY + headerHeight);
  
  // === EVENTS ===
  drawRemarkableDailyAppointments(pdf, selectedDate, events, gridY + headerHeight, dayColumnWidth, timeSlotHeightPt);
}

function drawCalendarGrid(pdf: jsPDF, weekStartDate: Date, events: CalendarEvent[]): void {
  const { margin } = HTML_TEMPLATE_CONFIG;
  const gridY = HTML_TEMPLATE_CONFIG.gridStartY;
  const dayColumnWidth = HTML_TEMPLATE_CONFIG.dayColumnWidth;
  const headerHeight = 26;
  
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
  
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...HTML_TEMPLATE_CONFIG.colors.black);
  pdf.text('TIME', margin + HTML_TEMPLATE_CONFIG.timeColumnWidth / 2, gridY + 16, { align: 'center' });
  
  // === DAY HEADERS ===
  const dayNames = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(weekStartDate);
    dayDate.setDate(weekStartDate.getDate() + i);
    const x = margin + HTML_TEMPLATE_CONFIG.timeColumnWidth + (i * dayColumnWidth);
    
    // Day header background
    pdf.setFillColor(...HTML_TEMPLATE_CONFIG.colors.lightGray);
    pdf.rect(x, gridY, dayColumnWidth, headerHeight, 'F');
    
    // Day name - smaller as requested
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.text(dayNames[i], x + dayColumnWidth / 2, gridY + 11, { align: 'center' });
    
    // Date number - smaller as requested
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    pdf.text(dayDate.getDate().toString(), x + dayColumnWidth / 2, gridY + 20, { align: 'center' });
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

function drawRemarkableDailyAppointments(pdf: jsPDF, selectedDate: Date, events: CalendarEvent[], gridStartY: number, dayColumnWidth: number, timeSlotHeight: number): void {
  const mmToPt = 2.834;
  const marginPt = REMARKABLE_DAILY_CONFIG.margin * mmToPt;
  const timeColumnWidthPt = REMARKABLE_DAILY_CONFIG.timeColumnWidth * mmToPt;
  
  // Filter events for the selected day
  const dayEvents = events.filter(event => {
    const eventDate = new Date(event.startTime);
    return eventDate.toDateString() === selectedDate.toDateString();
  }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  
  dayEvents.forEach(event => {
    const eventDate = new Date(event.startTime);
    const startHour = eventDate.getHours();
    
    // Find the time slot index (hourly slots only)
    let slotIndex = -1;
    for (let i = 0; i < REMARKABLE_TIME_SLOTS.length; i++) {
      const slotHour = parseInt(REMARKABLE_TIME_SLOTS[i].split(':')[0]);
      if (startHour === slotHour) {
        slotIndex = i;
        break;
      } else if (startHour < slotHour) {
        slotIndex = Math.max(0, i - 1);
        break;
      }
    }
    
    if (slotIndex === -1 && startHour >= 23) {
      slotIndex = REMARKABLE_TIME_SLOTS.length - 1;
    }
    
    if (slotIndex === -1) return;
    
    // Calculate event height (minimum 1 slot)
    const duration = (event.endTime.getTime() - event.startTime.getTime()) / (1000 * 60 * 60);
    const heightInSlots = Math.max(1, Math.ceil(duration));
    
    // Position calculation
    const x = marginPt + timeColumnWidthPt + 1;
    const y = gridStartY + (slotIndex * timeSlotHeight) + 1;
    const width = dayColumnWidth - 2;
    const height = (heightInSlots * timeSlotHeight) - 2;
    
    // Event styling optimized for e-ink
    const isSimplePractice = event.title.includes('Appointment');
    
    if (isSimplePractice) {
      pdf.setFillColor(250, 250, 250);
      pdf.rect(x, y, width, height, 'F');
      pdf.setDrawColor(...REMARKABLE_DAILY_CONFIG.colors.black);
      pdf.setLineWidth(1);
      pdf.line(x, y, x, y + height);
    } else {
      pdf.setFillColor(245, 245, 245);
      pdf.rect(x, y, width, height, 'F');
    }
    
    // Event border
    pdf.setDrawColor(...REMARKABLE_DAILY_CONFIG.colors.mediumGray);
    pdf.setLineWidth(0.25);
    pdf.rect(x, y, width, height);
    
    // Event text
    const cleanTitle = event.title.replace(/ Appointment$/, '');
    
    // Event name
    pdf.setFontSize(REMARKABLE_DAILY_CONFIG.fonts.eventTitle);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...REMARKABLE_DAILY_CONFIG.colors.black);
    
    const nameLines = pdf.splitTextToSize(cleanTitle, width - 4);
    const maxNameLines = Math.min(nameLines.length, Math.floor(height / 8));
    
    for (let i = 0; i < maxNameLines; i++) {
      pdf.text(nameLines[i], x + 2, y + 8 + (i * 8));
    }
    
    // Time range (if space available)
    if (height > 16) {
      pdf.setFontSize(REMARKABLE_DAILY_CONFIG.fonts.eventTime);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(80, 80, 80);
      
      const startTime = eventDate.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true 
      });
      const endTime = event.endTime.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true 
      });
      const timeRange = `${startTime} - ${endTime}`;
      
      const timeY = y + 8 + (maxNameLines * 8) + 2;
      if (timeY + 6 <= y + height - 2) {
        pdf.text(timeRange, x + 2, timeY);
      }
    }
  });
}

function drawDailyAppointments(pdf: jsPDF, selectedDate: Date, events: CalendarEvent[], gridStartY: number, dayColumnWidth: number): void {
  const { margin } = HTML_TEMPLATE_CONFIG;
  
  // Filter events for the selected day
  const dayEvents = events.filter(event => {
    const eventDate = new Date(event.startTime);
    return eventDate.toDateString() === selectedDate.toDateString();
  }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  
  dayEvents.forEach(event => {
    const eventDate = new Date(event.startTime);
    
    // Get event time
    const startHour = eventDate.getHours();
    const startMinute = eventDate.getMinutes();
    
    // Find the time slot
    const timeString = `${String(startHour).padStart(2, '0')}:${String(startMinute).padStart(2, '0')}`;
    
    let slotIndex = -1;
    for (let i = 0; i < TIME_SLOTS.length; i++) {
      const slot = TIME_SLOTS[i];
      if (slot === timeString) {
        slotIndex = i;
        break;
      }
      // Check if time falls within slot
      const [slotHour, slotMin] = slot.split(':').map(Number);
      const nextSlotMin = slotMin === 0 ? 30 : 0;
      const nextSlotHour = slotMin === 0 ? slotHour : slotHour + 1;
      
      if (startHour === slotHour && startMinute >= slotMin && 
          (startHour < nextSlotHour || (startHour === nextSlotHour && startMinute < nextSlotMin))) {
        slotIndex = i;
        break;
      }
    }
    
    if (slotIndex === -1) return;
    
    // Calculate event height
    const duration = (event.endTime.getTime() - event.startTime.getTime()) / (1000 * 60);
    const heightInSlots = Math.max(1, Math.ceil(duration / 30));
    
    // Position calculation
    const x = margin + HTML_TEMPLATE_CONFIG.timeColumnWidth + 2;
    const y = gridStartY + (slotIndex * HTML_TEMPLATE_CONFIG.timeSlotHeight) + 1;
    const width = dayColumnWidth - 4;
    const height = (heightInSlots * HTML_TEMPLATE_CONFIG.timeSlotHeight) - 2;
    
    // Event styling
    const isSimplePractice = event.title.includes('Appointment');
    
    if (isSimplePractice) {
      // SimplePractice: light gray background with blue left border
      pdf.setFillColor(248, 248, 248);
      pdf.rect(x, y, width, height, 'F');
      
      // Blue left border
      pdf.setDrawColor(...HTML_TEMPLATE_CONFIG.colors.simplePracticeBlue);
      pdf.setLineWidth(4);
      pdf.line(x, y, x, y + height);
      
      // Border around event
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
    
    // Event text with better spacing for wide layout
    const cleanTitle = event.title.replace(/ Appointment$/, '');
    const textWidth = width - (HTML_TEMPLATE_CONFIG.eventPadding * 2);
    
    // Event name - larger font for daily view
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...HTML_TEMPLATE_CONFIG.colors.black);
    
    const nameLines = pdf.splitTextToSize(cleanTitle, textWidth);
    const maxNameLines = Math.min(nameLines.length, Math.floor(height / 16));
    
    for (let i = 0; i < maxNameLines; i++) {
      pdf.text(nameLines[i], x + HTML_TEMPLATE_CONFIG.eventPadding, y + 14 + (i * 16));
    }
    
    // Time range
    if (height > 25) {
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(60, 60, 60);
      
      const startTime = formatTime(event.startTime);
      const endTime = formatTime(event.endTime);
      const timeRange = `${startTime} - ${endTime}`;
      
      const timeY = y + 14 + (maxNameLines * 16) + 4;
      if (timeY + 10 <= y + height - HTML_TEMPLATE_CONFIG.eventPadding) {
        pdf.text(timeRange, x + HTML_TEMPLATE_CONFIG.eventPadding, timeY);
      }
    }
  });
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