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

// Helper function to determine event type and styling
interface EventTypeInfo {
  isSimplePractice: boolean;
  isGoogle: boolean;
  isHoliday: boolean;
  sourceText: string;
}

function getEventTypeInfo(event: CalendarEvent): EventTypeInfo {
  // Check for SimplePractice events
  const isSimplePractice = 
    event.source === 'simplepractice' || 
    event.title.toLowerCase().includes('appointment') ||
    event.notes?.toLowerCase().includes('simplepractice') ||
    event.calendarId === '0np7sib5u30o7oc297j5pb259g'; // Your SimplePractice calendar ID
  
  // Check for Google Calendar events  
  const isGoogle = 
    event.source === 'google' && !isSimplePractice && !event.title.toLowerCase().includes('holiday');
  
  // Check for holidays
  const isHoliday = 
    event.title.toLowerCase().includes('holiday') ||
    event.calendarId === 'en.usa#holiday@group.v.calendar.google.com' ||
    event.source === 'holiday';
  
  // Determine source text for display
  let sourceText = '';
  if (isSimplePractice) {
    sourceText = 'SIMPLEPRACTICE';
  } else if (isGoogle) {
    sourceText = 'GOOGLE CALENDAR';
  } else if (isHoliday) {
    sourceText = 'HOLIDAYS IN UNITED STATES';
  } else {
    sourceText = (event.source || 'MANUAL').toUpperCase();
  }
  
  return {
    isSimplePractice,
    isGoogle,
    isHoliday,
    sourceText
  };
}

// reMarkable Paper Pro specific configuration for daily view
const REMARKABLE_DAILY_CONFIG = {
  // Use points instead of mm for consistency with jsPDF
  pageWidth: 507,   // 179mm * 2.834 points/mm
  pageHeight: 677,  // 239mm * 2.834 points/mm
  margin: 23,       // 8mm * 2.834 points/mm
  
  // Header configuration  
  headerHeight: 57,  // 20mm * 2.834
  statsHeight: 43,   // 15mm * 2.834  
  legendHeight: 28,  // 10mm * 2.834
  
  get totalHeaderHeight() {
    return this.headerHeight + this.statsHeight + this.legendHeight;
  },
  
  // Grid configuration
  timeColumnWidth: 71,  // 25mm * 2.834
  timeSlotHeight: 20,   // Increased from 17 to 20 for better event spacing
  
  get gridStartY() {
    return this.margin + this.totalHeaderHeight;
  },
  
  get dayColumnWidth() {
    return this.pageWidth - (this.margin * 2) - this.timeColumnWidth;
  },
  
  // Typography - adjusted for points with increased font sizes
  fonts: {
    title: 16,
    subtitle: 10,
    stats: 8,
    timeSlot: 7,
    eventTitle: 11,    // INCREASED from 8 to 11
    eventSource: 8,    // INCREASED from 6 to 8
    eventTime: 9       // INCREASED from 7 to 9
  },
  
  colors: {
    black: [0, 0, 0],
    white: [255, 255, 255],
    lightGray: [245, 245, 245],
    mediumGray: [200, 200, 200],
    darkGray: [100, 100, 100],
    simplePracticeBlue: [66, 133, 244],
    googleGreen: [52, 168, 83],
    holidayYellow: [251, 188, 4]
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
    // reMarkable Paper Pro portrait dimensions (507pt x 677pt)
    pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: [507, 677]
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
    console.log('=== DAILY EVENT DEBUGGING ===');
    const dayEvents = events.filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate.getFullYear() === weekStartDate.getFullYear() &&
             eventDate.getMonth() === weekStartDate.getMonth() &&
             eventDate.getDate() === weekStartDate.getDate();
    });
    
    dayEvents.forEach(event => {
      const eventType = getEventTypeInfo(event);
      console.log({
        title: event.title,
        source: event.source,
        calendarId: event.calendarId,
        startTime: event.startTime.toLocaleString(),
        eventType: eventType,
        shouldBeSimplePractice: eventType.isSimplePractice,
        shouldBeGoogle: eventType.isGoogle,
        shouldBeHoliday: eventType.isHoliday
      });
    });
    
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
  
  // Page border - full page
  pdf.setLineWidth(2);
  pdf.setDrawColor(...REMARKABLE_DAILY_CONFIG.colors.black);
  pdf.rect(margin, margin, pageWidth - (margin * 2), pageHeight - (margin * 2));
  
  // Filter events for the selected day  
  const dayEvents = events.filter(event => {
    const eventDate = new Date(event.startTime);
    return eventDate.getFullYear() === selectedDate.getFullYear() &&
           eventDate.getMonth() === selectedDate.getMonth() &&
           eventDate.getDate() === selectedDate.getDate();
  });
  
  // === TITLE SECTION ===
  pdf.setFontSize(REMARKABLE_DAILY_CONFIG.fonts.title);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...REMARKABLE_DAILY_CONFIG.colors.black);
  pdf.text('DAILY PLANNER', pageWidth / 2, margin + 20, { align: 'center' });
  
  // Date info
  pdf.setFontSize(REMARKABLE_DAILY_CONFIG.fonts.subtitle);
  pdf.setFont('helvetica', 'normal');
  const dateText = selectedDate.toLocaleDateString('en-US', { 
    weekday: 'long',
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  pdf.text(dateText, pageWidth / 2, margin + 35, { align: 'center' });
  
  // Navigation buttons (visual representation)
  const navY = margin + 45;
  const buttonWidth = 60;
  const buttonHeight = 16;
  
  // Back to Week button
  pdf.setFillColor(...REMARKABLE_DAILY_CONFIG.colors.white);
  pdf.setDrawColor(...REMARKABLE_DAILY_CONFIG.colors.mediumGray);
  pdf.setLineWidth(1);
  pdf.rect(margin + 20, navY, buttonWidth + 20, buttonHeight, 'FD');
  pdf.setFontSize(7);
  pdf.setTextColor(...REMARKABLE_DAILY_CONFIG.colors.black);
  pdf.text('← Back to Week', margin + 30, navY + 10);
  
  // Previous/Next day buttons
  const rightButtonX = pageWidth - margin - 80;
  pdf.rect(rightButtonX, navY, 30, buttonHeight, 'FD');
  pdf.rect(rightButtonX + 35, navY, 30, buttonHeight, 'FD');
  pdf.text('◀', rightButtonX + 12, navY + 10);
  pdf.text('▶', rightButtonX + 47, navY + 10);
  
  // === STATS SECTION ===
  const statsY = margin + REMARKABLE_DAILY_CONFIG.headerHeight;
  const contentWidth = pageWidth - (margin * 2);
  
  // Calculate stats
  const totalEvents = dayEvents.length;
  const totalHours = dayEvents.reduce((sum, e) => {
    const duration = (e.endTime.getTime() - e.startTime.getTime()) / (1000 * 60 * 60);
    return sum + duration;
  }, 0);
  const availableHours = 17.5 - totalHours; // Business hours 6am-11:30pm
  const freeTimePercentage = totalHours > 0 ? Math.round((availableHours / 17.5) * 100) : 100;
  
  // Stats background
  pdf.setFillColor(...REMARKABLE_DAILY_CONFIG.colors.lightGray);
  pdf.rect(margin, statsY, contentWidth, REMARKABLE_DAILY_CONFIG.statsHeight, 'F');
  
  // Stats border
  pdf.setLineWidth(1);
  pdf.setDrawColor(...REMARKABLE_DAILY_CONFIG.colors.mediumGray);
  pdf.rect(margin, statsY, contentWidth, REMARKABLE_DAILY_CONFIG.statsHeight);
  
  // Draw stat cards
  const cardWidth = contentWidth / 4;
  const stats = [
    { label: 'Appointments', value: totalEvents.toString() },
    { label: 'Scheduled', value: `${totalHours.toFixed(1)}h` },
    { label: 'Available', value: `${availableHours.toFixed(1)}h` },
    { label: 'Free Time', value: `${freeTimePercentage}%` }
  ];
  
  stats.forEach((stat, index) => {
    const x = margin + (index * cardWidth);
    
    // Vertical dividers
    if (index > 0) {
      pdf.setLineWidth(1);
      pdf.setDrawColor(...REMARKABLE_DAILY_CONFIG.colors.mediumGray);
      pdf.line(x, statsY + 8, x, statsY + REMARKABLE_DAILY_CONFIG.statsHeight - 8);
    }
    
    // Stat value (large, bold)
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...REMARKABLE_DAILY_CONFIG.colors.black);
    pdf.text(stat.value, x + cardWidth / 2, statsY + 18, { align: 'center' });
    
    // Stat label (smaller)
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text(stat.label, x + cardWidth / 2, statsY + 32, { align: 'center' });
  });
  
  // === LEGEND SECTION ===
  const legendY = statsY + REMARKABLE_DAILY_CONFIG.statsHeight;
  
  // Legend background
  pdf.setFillColor(...REMARKABLE_DAILY_CONFIG.colors.white);
  pdf.rect(margin, legendY, contentWidth, REMARKABLE_DAILY_CONFIG.legendHeight, 'F');
  
  // Legend border
  pdf.setLineWidth(1);
  pdf.setDrawColor(...REMARKABLE_DAILY_CONFIG.colors.mediumGray);
  pdf.rect(margin, legendY, contentWidth, REMARKABLE_DAILY_CONFIG.legendHeight);
  
  // Legend items
  const legendItems = [
    { label: 'SimplePractice', color: REMARKABLE_DAILY_CONFIG.colors.simplePracticeBlue, style: 'left-border' },
    { label: 'Google Calendar', color: REMARKABLE_DAILY_CONFIG.colors.googleGreen, style: 'dashed' },
    { label: 'Holidays in United States', color: REMARKABLE_DAILY_CONFIG.colors.holidayYellow, style: 'filled' }
  ];
  
  const itemWidth = contentWidth / legendItems.length;
  
  legendItems.forEach((item, index) => {
    const x = margin + (index * itemWidth) + 20;
    const symbolY = legendY + 10;
    const symbolSize = 12;
    
    // Draw legend symbol
    if (item.style === 'left-border') {
      pdf.setFillColor(...REMARKABLE_DAILY_CONFIG.colors.white);
      pdf.rect(x, symbolY, symbolSize, symbolSize, 'F');
      pdf.setDrawColor(...REMARKABLE_DAILY_CONFIG.colors.mediumGray);
      pdf.setLineWidth(1);
      pdf.rect(x, symbolY, symbolSize, symbolSize);
      pdf.setDrawColor(...item.color);
      pdf.setLineWidth(3);
      pdf.line(x, symbolY, x, symbolY + symbolSize);
    } else if (item.style === 'dashed') {
      pdf.setFillColor(...REMARKABLE_DAILY_CONFIG.colors.white);
      pdf.rect(x, symbolY, symbolSize, symbolSize, 'F');
      pdf.setDrawColor(...item.color);
      pdf.setLineWidth(1);
      pdf.setLineDash([2, 1]);
      pdf.rect(x, symbolY, symbolSize, symbolSize);
      pdf.setLineDash([]);
    } else {
      pdf.setFillColor(...item.color);
      pdf.rect(x, symbolY, symbolSize, symbolSize, 'F');
      pdf.setDrawColor(...REMARKABLE_DAILY_CONFIG.colors.black);
      pdf.setLineWidth(1);
      pdf.rect(x, symbolY, symbolSize, symbolSize);
    }
    
    // Legend text
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...REMARKABLE_DAILY_CONFIG.colors.black);
    pdf.text(item.label, x + symbolSize + 6, symbolY + 8);
  });
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
  const { margin, pageWidth, timeColumnWidth, timeSlotHeight } = REMARKABLE_DAILY_CONFIG;
  const gridY = REMARKABLE_DAILY_CONFIG.gridStartY;
  const dayColumnWidth = REMARKABLE_DAILY_CONFIG.dayColumnWidth;
  
  // Time slots (6:00 to 23:30 in 30-minute increments)
  const timeSlots = [];
  for (let hour = 6; hour <= 23; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      timeSlots.push({
        time: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
        hour,
        minute,
        isHour: minute === 0
      });
      if (hour === 23 && minute === 30) break;
    }
  }
  
  const totalGridHeight = timeSlots.length * timeSlotHeight;
  const headerHeight = 25;
  
  // === GRID BACKGROUND ===
  pdf.setFillColor(...REMARKABLE_DAILY_CONFIG.colors.white);
  pdf.rect(margin, gridY, timeColumnWidth + dayColumnWidth, headerHeight + totalGridHeight, 'F');
  
  // === GRID BORDER ===
  pdf.setLineWidth(2);
  pdf.setDrawColor(...REMARKABLE_DAILY_CONFIG.colors.black);
  pdf.rect(margin, gridY, timeColumnWidth + dayColumnWidth, headerHeight + totalGridHeight);
  
  // === HEADERS ===
  // Time column header
  pdf.setFillColor(...REMARKABLE_DAILY_CONFIG.colors.lightGray);
  pdf.rect(margin, gridY, timeColumnWidth, headerHeight, 'F');
  
  pdf.setFontSize(REMARKABLE_DAILY_CONFIG.fonts.stats);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...REMARKABLE_DAILY_CONFIG.colors.black);
  pdf.text('TIME', margin + timeColumnWidth / 2, gridY + 16, { align: 'center' });
  
  // Day header
  const dayX = margin + timeColumnWidth;
  pdf.setFillColor(...REMARKABLE_DAILY_CONFIG.colors.lightGray);
  pdf.rect(dayX, gridY, dayColumnWidth, headerHeight, 'F');
  
  const dayName = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
  const dateStr = selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text(dayName, dayX + dayColumnWidth / 2, gridY + 12, { align: 'center' });
  
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.text(dateStr, dayX + dayColumnWidth / 2, gridY + 20, { align: 'center' });
  
  // === TIME GRID ===
  timeSlots.forEach((slot, index) => {
    const y = gridY + headerHeight + (index * timeSlotHeight);
    
    // Time column cell
    pdf.setFillColor(...REMARKABLE_DAILY_CONFIG.colors.lightGray);
    pdf.rect(margin, y, timeColumnWidth, timeSlotHeight, 'F');
    
    // Time text
    pdf.setFontSize(REMARKABLE_DAILY_CONFIG.fonts.timeSlot);
    pdf.setFont('helvetica', slot.isHour ? 'bold' : 'normal');
    pdf.setTextColor(...REMARKABLE_DAILY_CONFIG.colors.black);
    pdf.text(slot.time, margin + timeColumnWidth / 2, y + timeSlotHeight / 2 + 2, { align: 'center' });
    
    // Day cell
    pdf.setFillColor(...REMARKABLE_DAILY_CONFIG.colors.white);
    pdf.rect(dayX, y, dayColumnWidth, timeSlotHeight, 'F');
    
    // Horizontal grid lines
    pdf.setLineWidth(0.5);
    pdf.setDrawColor(...REMARKABLE_DAILY_CONFIG.colors.mediumGray);
    pdf.line(margin, y + timeSlotHeight, margin + timeColumnWidth + dayColumnWidth, y + timeSlotHeight);
  });
  
  // === VERTICAL GRID LINES ===
  pdf.setLineWidth(2);
  pdf.setDrawColor(...REMARKABLE_DAILY_CONFIG.colors.black);
  pdf.line(margin + timeColumnWidth, gridY, margin + timeColumnWidth, gridY + headerHeight + totalGridHeight);
  
  // Header separator
  pdf.line(margin, gridY + headerHeight, margin + timeColumnWidth + dayColumnWidth, gridY + headerHeight);
  
  // === EVENTS ===
  drawRemarkableDailyAppointments(pdf, selectedDate, events, gridY + headerHeight, dayColumnWidth, timeSlotHeight);
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
  const { margin, timeColumnWidth } = REMARKABLE_DAILY_CONFIG;
  
  // Filter events for the selected day
  const dayEvents = events.filter(event => {
    const eventDate = new Date(event.startTime);
    return eventDate.getFullYear() === selectedDate.getFullYear() &&
           eventDate.getMonth() === selectedDate.getMonth() &&
           eventDate.getDate() === selectedDate.getDate();
  }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  
  console.log(`=== RENDERING ${dayEvents.length} EVENTS WITH 3-COLUMN LAYOUT ===`);
  
  dayEvents.forEach((event, index) => {
    const eventDate = new Date(event.startTime);
    const endDate = new Date(event.endTime);
    const startHour = eventDate.getHours();
    const startMinute = eventDate.getMinutes();
    const endHour = endDate.getHours();
    const endMinute = endDate.getMinutes();
    
    console.log(`\n--- Event ${index + 1}: "${event.title}" ---`);
    console.log(`Has notes: ${!!(event.notes && event.notes.trim())}`);
    console.log(`Has action items: ${!!(event.actionItems && event.actionItems.trim())}`);
    
    // Calculate position based on 30-minute slots from 6:00
    const startMinutesFrom6 = (startHour - 6) * 60 + startMinute;
    const endMinutesFrom6 = (endHour - 6) * 60 + endMinute;
    const startSlot = Math.max(0, startMinutesFrom6 / 30);
    const endSlot = Math.min(35, endMinutesFrom6 / 30);
    const durationSlots = Math.max(2, endSlot - startSlot);
    
    if (startSlot < 0 || startSlot > 35) {
      console.log('Event outside time range, skipping');
      return;
    }
    
    // Check if event has notes or action items for expanded layout
    const hasNotes = !!(event.notes && event.notes.trim());
    const hasActionItems = !!(event.actionItems && event.actionItems.trim());
    const needsExpandedLayout = hasNotes || hasActionItems;
    
    // Position calculation
    const eventX = margin + timeColumnWidth + 3;
    const eventY = gridStartY + (startSlot * timeSlotHeight) + 1;
    const eventWidth = dayColumnWidth - 6;
    
    // Adjust height based on content - taller for events with notes/action items
    let eventHeight;
    if (needsExpandedLayout) {
      // Calculate height needed for notes and action items
      const notesLines = hasNotes ? event.notes!.split('\n').filter(line => line.trim()).length : 0;
      const actionLines = hasActionItems ? event.actionItems!.split('\n').filter(line => line.trim()).length : 0;
      const maxContentLines = Math.max(notesLines, actionLines);
      const minimumHeight = 60 + (maxContentLines * 10); // Base height + content
      eventHeight = Math.max(minimumHeight, (durationSlots * timeSlotHeight) - 2);
    } else {
      eventHeight = Math.max(55, (durationSlots * timeSlotHeight) - 2);
    }
    
    console.log(`Position: X=${eventX}, Y=${eventY}, Width=${eventWidth}, Height=${eventHeight}`);
    console.log(`Expanded layout: ${needsExpandedLayout}`);
    
    // Determine event type
    const isSimplePractice = event.source === 'simplepractice' || 
                           event.title.toLowerCase().includes('appointment') ||
                           event.calendarId?.includes('simplepractice') ||
                           event.calendarId === '0np7sib5u30o7oc297j5pb259g';
    
    const isHoliday = event.title.toLowerCase().includes('holiday') ||
                     event.calendarId === 'en.usa#holiday@group.v.calendar.google.com';
    
    const isGoogle = event.source === 'google' && !isSimplePractice && !isHoliday;
    
    // Draw event background (WHITE)
    pdf.setFillColor(255, 255, 255);
    pdf.rect(eventX, eventY, eventWidth, eventHeight, 'F');
    
    // Draw borders based on event type
    if (isSimplePractice) {
      pdf.setDrawColor(66, 133, 244);
      pdf.setLineWidth(4);
      pdf.line(eventX, eventY, eventX, eventY + eventHeight);
      
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.5);
      pdf.line(eventX + 4, eventY, eventX + eventWidth, eventY);
      pdf.line(eventX + eventWidth, eventY, eventX + eventWidth, eventY + eventHeight);
      pdf.line(eventX, eventY + eventHeight, eventX + eventWidth, eventY + eventHeight);
      
    } else if (isGoogle) {
      pdf.setDrawColor(52, 168, 83);
      pdf.setLineWidth(2);
      pdf.setLineDash([4, 2]);
      pdf.rect(eventX, eventY, eventWidth, eventHeight);
      pdf.setLineDash([]);
      
    } else if (isHoliday) {
      pdf.setFillColor(251, 188, 4);
      pdf.rect(eventX, eventY, eventWidth, eventHeight, 'F');
      pdf.setDrawColor(255, 152, 0);
      pdf.setLineWidth(1);
      pdf.rect(eventX, eventY, eventWidth, eventHeight);
      
    } else {
      pdf.setDrawColor(156, 163, 175);
      pdf.setLineWidth(1);
      pdf.rect(eventX, eventY, eventWidth, eventHeight);
    }
    
    // === TEXT RENDERING - 3 COLUMN LAYOUT ===
    const padding = isSimplePractice ? 8 : 6;
    const startX = eventX + padding;
    const contentWidth = eventWidth - (padding * 2);
    
    if (needsExpandedLayout) {
      // === 3-COLUMN LAYOUT ===
      const col1Width = contentWidth * 0.33; // Left: Event info
      const col2Width = contentWidth * 0.33; // Center: Notes  
      const col3Width = contentWidth * 0.33; // Right: Action items
      
      const col1X = startX;
      const col2X = startX + col1Width + 5;
      const col3X = startX + col1Width + col2Width + 10;
      
      // Draw column dividers for clarity
      pdf.setDrawColor(220, 220, 220);
      pdf.setLineWidth(0.5);
      pdf.line(col2X - 3, eventY + 5, col2X - 3, eventY + eventHeight - 5);
      pdf.line(col3X - 3, eventY + 5, col3X - 3, eventY + eventHeight - 5);
      
      // === COLUMN 1: Event Info ===
      let col1Y = eventY + 15;
      
      // Event title
      const cleanTitle = event.title.replace(/ Appointment$/, '').trim();
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      
      const titleLines = pdf.splitTextToSize(cleanTitle, col1Width - 5);
      for (let i = 0; i < Math.min(titleLines.length, 2); i++) {
        pdf.text(titleLines[i], col1X, col1Y);
        col1Y += 11;
      }
      
      // Source
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 100, 100);
      
      let sourceText = '';
      if (isSimplePractice) sourceText = 'SIMPLEPRACTICE';
      else if (isGoogle) sourceText = 'GOOGLE CALENDAR';
      else if (isHoliday) sourceText = 'HOLIDAYS IN UNITED STATES';
      else sourceText = (event.source || 'MANUAL').toUpperCase();
      
      pdf.text(sourceText, col1X, col1Y);
      col1Y += 10;
      
      // Time
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      
      const startTimeStr = eventDate.toLocaleTimeString('en-US', { 
        hour: '2-digit', minute: '2-digit', hour12: false 
      });
      const endTimeStr = endDate.toLocaleTimeString('en-US', { 
        hour: '2-digit', minute: '2-digit', hour12: false 
      });
      const timeRange = `${startTimeStr}-${endTimeStr}`;
      
      pdf.text(timeRange, col1X, col1Y);
      
      // === COLUMN 2: Event Notes ===
      if (hasNotes) {
        let col2Y = eventY + 15;
        
        // Header
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(0, 0, 0);
        pdf.text('Event Notes', col2X, col2Y);
        col2Y += 12;
        
        // Notes content
        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(0, 0, 0);
        
        const noteLines = event.notes!.split('\n').filter(line => line.trim());
        noteLines.forEach(note => {
          const cleanNote = note.trim().replace(/^[•\s-]+/, '').trim();
          if (cleanNote && col2Y + 8 <= eventY + eventHeight - 5) {
            // Add bullet point
            pdf.text('•', col2X, col2Y);
            // Wrap text if needed
            const wrappedNote = pdf.splitTextToSize(cleanNote, col2Width - 10);
            for (let i = 0; i < Math.min(wrappedNote.length, 2); i++) {
              pdf.text(wrappedNote[i], col2X + 8, col2Y + (i * 8));
            }
            col2Y += Math.min(wrappedNote.length, 2) * 8 + 2;
          }
        });
      }
      
      // === COLUMN 3: Action Items ===
      if (hasActionItems) {
        let col3Y = eventY + 15;
        
        // Header
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(0, 0, 0);
        pdf.text('Action Items', col3X, col3Y);
        col3Y += 12;
        
        // Action items content
        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(0, 0, 0);
        
        const actionLines = event.actionItems!.split('\n').filter(line => line.trim());
        actionLines.forEach(action => {
          const cleanAction = action.trim().replace(/^[•\s-]+/, '').trim();
          if (cleanAction && col3Y + 8 <= eventY + eventHeight - 5) {
            // Add bullet point
            pdf.text('•', col3X, col3Y);
            // Wrap text if needed
            const wrappedAction = pdf.splitTextToSize(cleanAction, col3Width - 10);
            for (let i = 0; i < Math.min(wrappedAction.length, 2); i++) {
              pdf.text(wrappedAction[i], col3X + 8, col3Y + (i * 8));
            }
            col3Y += Math.min(wrappedAction.length, 2) * 8 + 2;
          }
        });
      }
      
    } else {
      // === SIMPLE LAYOUT (No notes/action items) ===
      let currentY = eventY + 15;
      
      // Event title
      const cleanTitle = event.title.replace(/ Appointment$/, '').trim();
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      
      const titleLines = pdf.splitTextToSize(cleanTitle, contentWidth);
      for (let i = 0; i < Math.min(titleLines.length, 2); i++) {
        pdf.text(titleLines[i], startX, currentY);
        currentY += 12;
      }
      
      // Source
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 100, 100);
      
      let sourceText = '';
      if (isSimplePractice) sourceText = 'SIMPLEPRACTICE';
      else if (isGoogle) sourceText = 'GOOGLE CALENDAR';
      else if (isHoliday) sourceText = 'HOLIDAYS IN UNITED STATES';
      else sourceText = (event.source || 'MANUAL').toUpperCase();
      
      pdf.text(sourceText, startX, currentY);
      currentY += 10;
      
      // Time
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      
      const startTimeStr = eventDate.toLocaleTimeString('en-US', { 
        hour: '2-digit', minute: '2-digit', hour12: false 
      });
      const endTimeStr = endDate.toLocaleTimeString('en-US', { 
        hour: '2-digit', minute: '2-digit', hour12: false 
      });
      const timeRange = `${startTimeStr}-${endTimeStr}`;
      
      pdf.text(timeRange, startX, currentY);
    }
    
    console.log(`Finished rendering event ${index + 1}`);
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