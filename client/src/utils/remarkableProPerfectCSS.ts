import jsPDF from 'jspdf';
import { CalendarEvent } from '../types/calendar';
import { formatWeekRange } from './dateUtils';

// EXACT CSS Grid replication from HTML template
const CSS_GRID_SPECS = {
  // CSS Grid template from HTML:
  // grid-template-columns: 100px repeat(7, 1fr)
  // grid-template-rows: 80px repeat(16, 60px)
  
  // Page: 11" x 8.5" landscape, 0.3" margins
  pageWidth: 279.4,    // 11" in mm
  pageHeight: 215.9,   // 8.5" in mm
  margin: 7.62,        // 0.3" in mm
  
  // CSS pixel to mm conversion (96 DPI standard)
  pxToMm: 25.4 / 96,   // 0.264583mm per pixel
  
  // Exact CSS Grid dimensions
  timeColumnPx: 100,   // 100px time column
  dayHeaderPx: 80,     // 80px day header row
  hourSlotPx: 60,      // 60px per hour slot
  totalHours: 16,      // 16 hours (6AM-9PM)
  
  // Convert to mm
  get timeColumnMm() { return this.timeColumnPx * this.pxToMm; },
  get dayHeaderMm() { return this.dayHeaderPx * this.pxToMm; },
  get hourSlotMm() { return this.hourSlotPx * this.pxToMm; },
  
  // Content dimensions
  get contentWidth() { return this.pageWidth - (2 * this.margin); },
  get contentHeight() { return this.pageHeight - (2 * this.margin); },
  
  // Day columns: (content width - time column) / 7 days
  get dayColumnMm() { return (this.contentWidth - this.timeColumnMm) / 7; },
  
  // Grid totals
  get gridTotalHeight() { return this.dayHeaderMm + (this.totalHours * this.hourSlotMm); },
  
  // Header space above grid
  headerSpace: 15,  // 15mm for title and stats
  
  // Typography exactly matching template
  fonts: {
    title: { size: 14, family: 'times', weight: 'bold' },
    stats: { size: 8, family: 'times', weight: 'normal' },
    dayName: { size: 12, family: 'times', weight: 'bold' },
    dayDate: { size: 16, family: 'times', weight: 'bold' },
    timeLabel: { size: 10, family: 'times', weight: 'bold' },
    appointment: { size: 7, family: 'times', weight: 'bold' },
    appointmentTime: { size: 6, family: 'times', weight: 'normal' }
  },
  
  // E-ink optimized styling
  borderWidth: 0.5,  // Thicker borders for e-ink
  lightGray: [245, 245, 245],
  darkGray: [200, 200, 200],
  black: [0, 0, 0]
};

export const exportRemarkableProPerfect = async (
  weekStartDate: Date,
  weekEndDate: Date,
  events: CalendarEvent[]
): Promise<void> => {
  console.log('🎯 Creating EXACT CSS Grid PDF matching HTML template');
  console.log(`📊 Processing ${events.length} events for exact CSS Grid layout`);
  
  // Create PDF with exact reMarkable Pro dimensions
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [CSS_GRID_SPECS.pageWidth, CSS_GRID_SPECS.pageHeight]
  });
  
  // Set Times New Roman font for entire document
  pdf.setFont(CSS_GRID_SPECS.fonts.title.family, CSS_GRID_SPECS.fonts.title.weight);
  
  // Generate exact CSS Grid layout
  await generateExactCSSGrid(pdf, weekStartDate, weekEndDate, events);
  
  // Save with descriptive filename
  const filename = `remarkable-pro-perfect-${weekStartDate.toISOString().split('T')[0]}.pdf`;
  pdf.save(filename);
  console.log('✅ EXACT CSS Grid PDF generated matching HTML template');
};

async function generateExactCSSGrid(
  pdf: jsPDF,
  weekStartDate: Date,
  weekEndDate: Date,
  events: CalendarEvent[]
): Promise<void> {
  const { margin, contentWidth, headerSpace } = CSS_GRID_SPECS;
  let currentY = margin;
  
  // 1. Compact header (title + stats)
  currentY = generateCompactHeader(pdf, weekStartDate, weekEndDate, currentY);
  
  // 2. EXACT CSS Grid replication
  currentY = generateCSSGridStructure(pdf, weekStartDate, events, currentY);
}

function generateCompactHeader(pdf: jsPDF, weekStartDate: Date, weekEndDate: Date, startY: number): number {
  const { contentWidth, margin, fonts } = CSS_GRID_SPECS;
  const centerX = margin + (contentWidth / 2);
  
  // Title
  pdf.setFont(fonts.title.family, fonts.title.weight);
  pdf.setFontSize(fonts.title.size);
  pdf.text('WEEKLY PLANNER', centerX, startY + 5, { align: 'center' });
  
  // Week range
  const weekRange = formatWeekRange(weekStartDate, weekEndDate);
  pdf.setFontSize(fonts.stats.size);
  pdf.text(weekRange, centerX, startY + 10, { align: 'center' });
  
  return startY + CSS_GRID_SPECS.headerSpace;
}

function generateCSSGridStructure(pdf: jsPDF, weekStartDate: Date, events: CalendarEvent[], startY: number): number {
  const { margin, timeColumnMm, dayColumnMm, dayHeaderMm, hourSlotMm, totalHours, fonts, borderWidth } = CSS_GRID_SPECS;
  
  // Grid starting position
  const gridStartX = margin;
  const gridStartY = startY;
  
  // Draw time column header (top-left cell)
  pdf.setFillColor(...CSS_GRID_SPECS.lightGray);
  pdf.rect(gridStartX, gridStartY, timeColumnMm, dayHeaderMm, 'F');
  pdf.setLineWidth(borderWidth);
  pdf.rect(gridStartX, gridStartY, timeColumnMm, dayHeaderMm, 'S');
  
  // Draw day headers (top row)
  generateDayHeaders(pdf, weekStartDate, gridStartX + timeColumnMm, gridStartY, dayColumnMm, dayHeaderMm);
  
  // Draw time slots (left column)
  generateTimeSlots(pdf, gridStartX, gridStartY + dayHeaderMm, timeColumnMm, hourSlotMm, totalHours);
  
  // Draw day grid cells
  generateDayGrid(pdf, gridStartX + timeColumnMm, gridStartY + dayHeaderMm, dayColumnMm, hourSlotMm, totalHours);
  
  // Draw appointments in exact grid positions
  generateAppointments(pdf, weekStartDate, events, gridStartX + timeColumnMm, gridStartY + dayHeaderMm, dayColumnMm, hourSlotMm);
  
  return gridStartY + dayHeaderMm + (totalHours * hourSlotMm);
}

function generateDayHeaders(pdf: jsPDF, weekStartDate: Date, startX: number, startY: number, dayWidth: number, headerHeight: number): void {
  const { fonts, borderWidth } = CSS_GRID_SPECS;
  const dayNames = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  
  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(weekStartDate);
    dayDate.setDate(weekStartDate.getDate() + i);
    
    const x = startX + (i * dayWidth);
    const centerX = x + (dayWidth / 2);
    
    // Header background
    pdf.setFillColor(...CSS_GRID_SPECS.lightGray);
    pdf.rect(x, startY, dayWidth, headerHeight, 'F');
    
    // Header border
    pdf.setLineWidth(borderWidth);
    pdf.rect(x, startY, dayWidth, headerHeight, 'S');
    
    // Day name
    pdf.setFont(fonts.dayName.family, fonts.dayName.weight);
    pdf.setFontSize(fonts.dayName.size);
    pdf.text(dayNames[i], centerX, startY + 12, { align: 'center' });
    
    // Day date
    pdf.setFont(fonts.dayDate.family, fonts.dayDate.weight);
    pdf.setFontSize(fonts.dayDate.size);
    pdf.text(dayDate.getDate().toString(), centerX, startY + 18, { align: 'center' });
  }
}

function generateTimeSlots(pdf: jsPDF, startX: number, startY: number, timeWidth: number, hourHeight: number, totalHours: number): void {
  const { fonts, borderWidth } = CSS_GRID_SPECS;
  
  for (let hour = 0; hour < totalHours; hour++) {
    const actualHour = 6 + hour; // Start at 6AM
    const y = startY + (hour * hourHeight);
    const centerX = startX + (timeWidth / 2);
    const centerY = y + (hourHeight / 2);
    
    // Time slot background
    pdf.setFillColor(...CSS_GRID_SPECS.darkGray);
    pdf.rect(startX, y, timeWidth, hourHeight, 'F');
    
    // Time slot border
    pdf.setLineWidth(borderWidth);
    pdf.rect(startX, y, timeWidth, hourHeight, 'S');
    
    // Time label
    pdf.setFont(fonts.timeLabel.family, fonts.timeLabel.weight);
    pdf.setFontSize(fonts.timeLabel.size);
    const timeLabel = `${actualHour.toString().padStart(2, '0')}:00`;
    pdf.text(timeLabel, centerX, centerY + 2, { align: 'center' });
  }
}

function generateDayGrid(pdf: jsPDF, startX: number, startY: number, dayWidth: number, hourHeight: number, totalHours: number): void {
  const { borderWidth } = CSS_GRID_SPECS;
  
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < totalHours; hour++) {
      const x = startX + (day * dayWidth);
      const y = startY + (hour * hourHeight);
      
      // Grid cell border
      pdf.setLineWidth(borderWidth);
      pdf.rect(x, y, dayWidth, hourHeight, 'S');
    }
  }
}

function generateAppointments(pdf: jsPDF, weekStartDate: Date, events: CalendarEvent[], startX: number, startY: number, dayWidth: number, hourHeight: number): void {
  const { fonts } = CSS_GRID_SPECS;
  
  // Filter events for this week
  const weekEvents = events.filter(event => {
    const eventDate = new Date(event.startTime);
    const weekEnd = new Date(weekStartDate);
    weekEnd.setDate(weekEnd.getDate() + 6);
    return eventDate >= weekStartDate && eventDate <= weekEnd;
  });
  
  weekEvents.forEach(event => {
    const eventStart = new Date(event.startTime);
    const eventEnd = new Date(event.endTime);
    
    // Calculate day position (0-6)
    const dayIndex = Math.floor((eventStart.getTime() - weekStartDate.getTime()) / (24 * 60 * 60 * 1000));
    if (dayIndex < 0 || dayIndex > 6) return;
    
    // Calculate hour position (0-15 for 6AM-9PM)
    const startHour = eventStart.getHours();
    const startMinute = eventStart.getMinutes();
    const hourIndex = startHour - 6; // Offset by 6AM
    
    if (hourIndex < 0 || hourIndex >= 16) return;
    
    // Calculate position and size
    const x = startX + (dayIndex * dayWidth);
    const y = startY + (hourIndex * hourHeight) + (startMinute / 60 * hourHeight);
    const duration = (eventEnd.getTime() - eventStart.getTime()) / (1000 * 60); // minutes
    const height = Math.min(duration / 60 * hourHeight, hourHeight * 2); // Max 2 hours
    
    // Draw appointment block
    pdf.setFillColor(240, 240, 240);
    pdf.rect(x + 1, y, dayWidth - 2, height, 'F');
    pdf.setLineWidth(0.5);
    pdf.rect(x + 1, y, dayWidth - 2, height, 'S');
    
    // Clean appointment title
    let title = event.title;
    if (title.includes('Appointment')) {
      title = title.replace(' Appointment', '');
    }
    
    // Appointment title
    pdf.setFont(fonts.appointment.family, fonts.appointment.weight);
    pdf.setFontSize(fonts.appointment.size);
    pdf.text(title, x + 2, y + 4, { maxWidth: dayWidth - 4 });
    
    // Appointment time
    pdf.setFont(fonts.appointmentTime.family, fonts.appointmentTime.weight);
    pdf.setFontSize(fonts.appointmentTime.size);
    const timeText = `${eventStart.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
    pdf.text(timeText, x + 2, y + height - 2);
  });
}

function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

export const generateRemarkableProFilename = (date: Date): string => {
  return `remarkable-pro-perfect-${date.toISOString().split('T')[0]}.pdf`;
};