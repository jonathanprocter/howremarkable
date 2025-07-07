import jsPDF from 'jspdf';
import { CalendarEvent } from '../types/calendar';
import { formatWeekRange } from './dateUtils';

// reMarkable Pro EXACT specifications from HTML template
const REMARKABLE_SPECS = {
  // Page dimensions: Exact reMarkable Pro landscape (11" x 8.5")
  pageWidth: 279.4,   // 11 inches in mm
  pageHeight: 215.9,  // 8.5 inches in mm
  margin: 7.6,        // 0.3 inch margin
  
  // Grid specifications from HTML template (60px hour height, 100px time column)
  timeColumnWidthPx: 100,    // 100px as specified
  hourHeightPx: 60,          // 60px as specified
  borderWidthPx: 3,          // 3px borders for e-ink
  
  // Convert pixels to mm (assuming 96 DPI standard)
  get pxToMm() { return 25.4 / 96; },
  get timeColumnWidth() { return this.timeColumnWidthPx * this.pxToMm; },
  get hourHeight() { return this.hourHeightPx * this.pxToMm; },
  get borderWidth() { return this.borderWidthPx * this.pxToMm; },
  
  // Content area calculations
  get contentWidth() { return this.pageWidth - (2 * this.margin); },
  get contentHeight() { return this.pageHeight - (2 * this.margin); },
  
  // Day columns (7 days after time column)
  get dayColumnWidth() { return (this.contentWidth - this.timeColumnWidth) / 7; },
  
  // Grid dimensions
  totalHours: 16,  // 6AM to 9PM
  startHour: 6,    // Start at 6AM
  endHour: 21,     // End at 9PM
  
  // Header specifications
  headerHeight: 25.4,  // 1 inch for header
  statsHeight: 15.24,  // 0.6 inch for stats
  
  // Typography (Times New Roman for e-ink)
  fonts: {
    header: { size: 18, weight: 'bold' },
    weekInfo: { size: 12, weight: 'bold' },
    stats: { size: 10, weight: 'normal' },
    statsNumber: { size: 14, weight: 'bold' },
    dayHeader: { size: 10, weight: 'bold' },
    timeSlot: { size: 8, weight: 'bold' },
    appointmentTitle: { size: 7, weight: 'bold' },
    appointmentTime: { size: 6, weight: 'normal' }
  }
};

export const exportRemarkableProPerfect = async (
  weekStartDate: Date,
  weekEndDate: Date,
  events: CalendarEvent[]
): Promise<void> => {
  console.log('🎯 Creating perfect reMarkable Pro PDF with exact specifications');
  
  // Create PDF with exact reMarkable Pro dimensions
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [REMARKABLE_SPECS.pageWidth, REMARKABLE_SPECS.pageHeight]
  });
  
  // Set Times New Roman font (best for e-ink)
  pdf.setFont('times', 'normal');
  
  // Generate all sections with precise measurements
  const currentY = await generatePerfectLayout(pdf, weekStartDate, weekEndDate, events);
  
  // Save with descriptive filename
  const weekRange = formatWeekRange(weekStartDate, weekEndDate);
  const filename = `reMarkable-Pro-Weekly-${weekRange.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`;
  
  pdf.save(filename);
  console.log('✅ Perfect reMarkable Pro PDF generated with exact specifications');
};

async function generatePerfectLayout(
  pdf: jsPDF, 
  weekStartDate: Date, 
  weekEndDate: Date, 
  events: CalendarEvent[]
): Promise<number> {
  const { margin } = REMARKABLE_SPECS;
  let currentY = margin;
  
  // 1. HEADER - Professional title and week info
  currentY = generatePerfectHeader(pdf, weekStartDate, weekEndDate, currentY);
  
  // 2. STATISTICS - Real appointment data
  currentY = generatePerfectStats(pdf, events, weekStartDate, weekEndDate, currentY);
  
  // 3. MAIN CALENDAR GRID - Exact 60px height, 100px time column
  currentY = generatePerfectCalendarGrid(pdf, weekStartDate, events, currentY);
  
  return currentY;
}

function generatePerfectHeader(pdf: jsPDF, weekStartDate: Date, weekEndDate: Date, startY: number): number {
  const { margin, contentWidth, headerHeight, fonts } = REMARKABLE_SPECS;
  
  // Header background with thick border
  pdf.setFillColor(248, 248, 248);
  pdf.rect(margin, startY, contentWidth, headerHeight, 'F');
  
  // Thick border for e-ink visibility
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(REMARKABLE_SPECS.borderWidth);
  pdf.rect(margin, startY, contentWidth, headerHeight, 'S');
  
  // Main title: "WEEKLY PLANNER"
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(fonts.header.size);
  pdf.setFont('times', 'bold');
  pdf.text('WEEKLY PLANNER', margin + contentWidth / 2, startY + 12, { align: 'center' });
  
  // Week range and week number
  const weekRange = formatWeekRange(weekStartDate, weekEndDate);
  const weekNumber = getWeekNumber(weekStartDate);
  const weekInfo = `${weekRange} • Week ${weekNumber}`;
  
  pdf.setFontSize(fonts.weekInfo.size);
  pdf.text(weekInfo, margin + contentWidth / 2, startY + 20, { align: 'center' });
  
  return startY + headerHeight;
}

function generatePerfectStats(pdf: jsPDF, events: CalendarEvent[], weekStartDate: Date, weekEndDate: Date, startY: number): number {
  const { margin, contentWidth, statsHeight, fonts } = REMARKABLE_SPECS;
  
  // Calculate real statistics
  const weekEvents = events.filter(event => {
    const eventDate = new Date(event.startTime);
    return eventDate >= weekStartDate && eventDate <= weekEndDate;
  });
  
  const totalAppointments = weekEvents.length;
  const totalMinutes = weekEvents.reduce((sum, event) => {
    return sum + (new Date(event.endTime).getTime() - new Date(event.startTime).getTime()) / (1000 * 60);
  }, 0);
  const scheduledHours = totalMinutes / 60;
  const dailyAverage = scheduledHours / 7;
  const availableHours = (16 * 7) - scheduledHours; // 16 hours per day
  
  // Stats background
  pdf.setFillColor(248, 248, 248);
  pdf.rect(margin, startY, contentWidth, statsHeight, 'F');
  
  // Stats border
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(REMARKABLE_SPECS.borderWidth);
  pdf.rect(margin, startY, contentWidth, statsHeight, 'S');
  
  // Four stat columns
  const statWidth = contentWidth / 4;
  const stats = [
    { number: totalAppointments.toString(), label: 'Total Appointments' },
    { number: `${scheduledHours.toFixed(1)}h`, label: 'Scheduled Time' },
    { number: `${dailyAverage.toFixed(1)}h`, label: 'Daily Average' },
    { number: `${availableHours.toFixed(1)}h`, label: 'Available Time' }
  ];
  
  stats.forEach((stat, index) => {
    const statX = margin + (index * statWidth);
    
    // Vertical separator
    if (index > 0) {
      pdf.setLineWidth(1);
      pdf.line(statX, startY, statX, startY + statsHeight);
    }
    
    // Large number
    pdf.setFontSize(fonts.statsNumber.size);
    pdf.setFont('times', 'bold');
    pdf.text(stat.number, statX + statWidth / 2, startY + 8, { align: 'center' });
    
    // Label
    pdf.setFontSize(fonts.stats.size);
    pdf.setFont('times', 'normal');
    pdf.text(stat.label, statX + statWidth / 2, startY + 12, { align: 'center' });
  });
  
  return startY + statsHeight;
}

function generatePerfectCalendarGrid(pdf: jsPDF, weekStartDate: Date, events: CalendarEvent[], startY: number): number {
  const { margin, contentWidth, timeColumnWidth, dayColumnWidth, hourHeight, totalHours, startHour, fonts } = REMARKABLE_SPECS;
  
  const gridHeight = (totalHours * hourHeight) + 20; // Extra space for day headers
  const dayHeaderHeight = 15;
  
  // Main grid border
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(REMARKABLE_SPECS.borderWidth);
  pdf.rect(margin, startY, contentWidth, gridHeight, 'S');
  
  // DAY HEADERS ROW
  generatePerfectDayHeaders(pdf, weekStartDate, startY, dayHeaderHeight);
  
  // TIME SLOTS COLUMN (left side)
  generatePerfectTimeSlots(pdf, startY + dayHeaderHeight);
  
  // GRID LINES (horizontal and vertical)
  generatePerfectGridLines(pdf, startY + dayHeaderHeight, gridHeight - dayHeaderHeight);
  
  // APPOINTMENTS
  generatePerfectAppointments(pdf, weekStartDate, events, startY + dayHeaderHeight);
  
  return startY + gridHeight;
}

function generatePerfectDayHeaders(pdf: jsPDF, weekStartDate: Date, gridY: number, headerHeight: number): void {
  const { margin, timeColumnWidth, dayColumnWidth, fonts } = REMARKABLE_SPECS;
  
  // TIME header
  pdf.setFillColor(240, 240, 240);
  pdf.rect(margin, gridY, timeColumnWidth, headerHeight, 'F');
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(1);
  pdf.rect(margin, gridY, timeColumnWidth, headerHeight, 'S');
  
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(fonts.dayHeader.size);
  pdf.setFont('times', 'bold');
  pdf.text('TIME', margin + timeColumnWidth / 2, gridY + 10, { align: 'center' });
  
  // Day headers
  const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  
  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(weekStartDate);
    dayDate.setDate(weekStartDate.getDate() + i);
    
    const dayX = margin + timeColumnWidth + (i * dayColumnWidth);
    
    // Day header background
    pdf.setFillColor(240, 240, 240);
    pdf.rect(dayX, gridY, dayColumnWidth, headerHeight, 'F');
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(1);
    pdf.rect(dayX, gridY, dayColumnWidth, headerHeight, 'S');
    
    // Day name
    pdf.setFontSize(fonts.dayHeader.size);
    pdf.setFont('times', 'bold');
    pdf.text(days[i], dayX + dayColumnWidth / 2, gridY + 6, { align: 'center' });
    
    // Day number
    pdf.setFontSize(fonts.dayHeader.size);
    pdf.text(dayDate.getDate().toString(), dayX + dayColumnWidth / 2, gridY + 12, { align: 'center' });
  }
}

function generatePerfectTimeSlots(pdf: jsPDF, timeGridY: number): void {
  const { margin, timeColumnWidth, hourHeight, startHour, totalHours, fonts } = REMARKABLE_SPECS;
  
  for (let i = 0; i < totalHours; i++) {
    const hour = startHour + i;
    const slotY = timeGridY + (i * hourHeight);
    
    // Time slot background
    pdf.setFillColor(248, 248, 248);
    pdf.rect(margin, slotY, timeColumnWidth, hourHeight, 'F');
    
    // Time slot border
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(1);
    pdf.rect(margin, slotY, timeColumnWidth, hourHeight, 'S');
    
    // Time label
    const timeLabel = `${hour.toString().padStart(2, '0')}:00`;
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(fonts.timeSlot.size);
    pdf.setFont('times', 'bold');
    pdf.text(timeLabel, margin + timeColumnWidth / 2, slotY + hourHeight / 2 + 2, { align: 'center' });
  }
}

function generatePerfectGridLines(pdf: jsPDF, timeGridY: number, gridHeight: number): void {
  const { margin, contentWidth, timeColumnWidth, dayColumnWidth, hourHeight, totalHours } = REMARKABLE_SPECS;
  
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(1);
  
  // Vertical lines (day separators)
  for (let i = 1; i < 7; i++) {
    const x = margin + timeColumnWidth + (i * dayColumnWidth);
    pdf.line(x, timeGridY, x, timeGridY + gridHeight);
  }
  
  // Horizontal lines (hour separators)
  for (let i = 1; i < totalHours; i++) {
    const y = timeGridY + (i * hourHeight);
    pdf.line(margin + timeColumnWidth, y, margin + contentWidth, y);
  }
}

function generatePerfectAppointments(pdf: jsPDF, weekStartDate: Date, events: CalendarEvent[], timeGridY: number): void {
  const { margin, timeColumnWidth, dayColumnWidth, hourHeight, startHour, fonts } = REMARKABLE_SPECS;
  
  // Filter events for this week
  const weekEndDate = new Date(weekStartDate);
  weekEndDate.setDate(weekStartDate.getDate() + 6);
  
  const weekEvents = events.filter(event => {
    const eventDate = new Date(event.startTime);
    return eventDate >= weekStartDate && eventDate <= weekEndDate;
  });
  
  console.log(`📊 Processing ${weekEvents.length} events for perfect layout`);
  
  weekEvents.forEach(event => {
    const eventStart = new Date(event.startTime);
    const eventEnd = new Date(event.endTime);
    
    // Calculate day column (0-6)
    const dayIndex = eventStart.getDay() === 0 ? 6 : eventStart.getDay() - 1;
    
    // Calculate hour position
    const startHour24 = eventStart.getHours();
    const startMinute = eventStart.getMinutes();
    const endHour24 = eventEnd.getHours();
    const endMinute = eventEnd.getMinutes();
    
    // Only show events within business hours
    if (startHour24 >= startHour && startHour24 <= 21) {
      // Calculate exact position
      const startHourIndex = startHour24 - startHour;
      const minuteOffset = (startMinute / 60) * hourHeight;
      const duration = ((endHour24 - startHour24) * 60 + (endMinute - startMinute)) / 60; // hours
      
      const appointmentX = margin + timeColumnWidth + (dayIndex * dayColumnWidth) + 2;
      const appointmentY = timeGridY + (startHourIndex * hourHeight) + minuteOffset + 1;
      const appointmentWidth = dayColumnWidth - 4;
      const appointmentHeight = Math.max(duration * hourHeight - 2, 12);
      
      // Appointment background (light gray for e-ink)
      pdf.setFillColor(245, 245, 245);
      pdf.rect(appointmentX, appointmentY, appointmentWidth, appointmentHeight, 'F');
      
      // Appointment border (thick for e-ink)
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(2);
      pdf.rect(appointmentX, appointmentY, appointmentWidth, appointmentHeight, 'S');
      
      // Clean appointment title
      let cleanTitle = event.title.replace(/\s*Appointment\s*$/i, '').trim();
      if (cleanTitle.length > 18) {
        cleanTitle = cleanTitle.substring(0, 18) + '...';
      }
      
      // Appointment title
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(fonts.appointmentTitle.size);
      pdf.setFont('times', 'bold');
      pdf.text(cleanTitle, appointmentX + 2, appointmentY + 8, { maxWidth: appointmentWidth - 4 });
      
      // Time stamp (if space allows)
      if (appointmentHeight > 15) {
        const timeText = `${startHour24.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}`;
        pdf.setFontSize(fonts.appointmentTime.size);
        pdf.setFont('times', 'normal');
        pdf.text(timeText, appointmentX + 2, appointmentY + appointmentHeight - 3);
      }
    }
  });
}

function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

export const generateRemarkableProFilename = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `remarkable-pro-weekly-${year}-${month}-${day}`;
};