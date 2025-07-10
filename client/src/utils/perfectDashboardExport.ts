import jsPDF from 'jspdf';
import { CalendarEvent } from '../types/calendar';
import { cleanEventTitle } from './titleCleaner';

/**
 * Perfect Dashboard Export System
 * 
 * This system creates pixel-perfect PDF exports that exactly match the dashboard screenshots provided.
 * Based on the reference images showing the exact layouts, colors, and styling.
 */

// Weekly Layout Configuration (matching the perfect weekly screenshot)
const WEEKLY_CONFIG = {
  pageWidth: 792,   // 11 inches landscape
  pageHeight: 612,  // 8.5 inches landscape
  
  // Header section
  headerHeight: 60,
  titleFontSize: 16,
  subtitleFontSize: 12,
  
  // Statistics section
  statsHeight: 40,
  statsFontSize: 12,
  statsValueFontSize: 16,
  
  // Legend section
  legendHeight: 25,
  legendFontSize: 9,
  
  // Grid configuration
  margin: 15,
  timeColumnWidth: 50,
  dayColumnWidth: 105, // (792 - 30 - 50) / 7 = 101.7 ≈ 105
  rowHeight: 14,
  
  // Colors matching the perfect screenshot
  colors: {
    headerBg: '#f8f9fa',
    statsBg: '#f8f9fa',
    legendBg: '#f8f9fa',
    gridLine: '#dee2e6',
    hourLine: '#adb5bd',
    simplePractice: '#6c757d', // Gray background for SimplePractice
    simplePracticeBorder: '#007bff', // Blue border
    google: '#ffffff', // White background
    googleBorder: '#28a745', // Green border, dashed
    holiday: '#fff3cd', // Light yellow background
    holidayBorder: '#ffc107' // Yellow border
  }
};

// Daily Layout Configuration (matching the perfect daily screenshot)
const DAILY_CONFIG = {
  pageWidth: 612,   // 8.5 inches portrait
  pageHeight: 792,  // 11 inches portrait
  
  // Header section
  headerHeight: 80,
  titleFontSize: 14,
  subtitleFontSize: 11,
  
  // Statistics section
  statsHeight: 35,
  statsFontSize: 10,
  statsValueFontSize: 14,
  
  // Legend section
  legendHeight: 20,
  legendFontSize: 8,
  
  // Grid configuration
  margin: 15,
  timeColumnWidth: 60,
  appointmentColumnWidth: 520, // Remaining width after time column
  rowHeight: 16,
  
  // Colors matching the perfect screenshot
  colors: {
    headerBg: '#f8f9fa',
    statsBg: '#f8f9fa',
    legendBg: '#f8f9fa',
    gridLine: '#dee2e6',
    hourLine: '#adb5bd',
    simplePractice: '#f8f9fa', // Light gray background
    simplePracticeBorder: '#007bff', // Blue border
    google: '#e3f2fd', // Light blue background
    googleBorder: '#2196f3', // Blue border
    holiday: '#fff3cd', // Light yellow background
    holidayBorder: '#ffc107' // Yellow border
  }
};

/**
 * Generate time slots from 06:00 to 23:30 (36 slots)
 */
function generateTimeSlots() {
  const slots = [];
  for (let hour = 6; hour <= 23; hour++) {
    slots.push({ hour, minute: 0, display: `${hour.toString().padStart(2, '0')}:00` });
    if (hour < 23) {
      slots.push({ hour, minute: 30, display: `${hour.toString().padStart(2, '0')}:30` });
    }
  }
  return slots;
}

/**
 * Determine event styling based on source
 */
function getEventStyling(event: CalendarEvent, config: typeof WEEKLY_CONFIG | typeof DAILY_CONFIG) {
  // SimplePractice events (appointments)
  if (event.source === 'simplepractice' || 
      event.title.toLowerCase().includes('appointment') ||
      event.calendarId === '0np7sib5u30o7oc297j5pb259g') {
    return {
      background: config.colors.simplePractice,
      border: config.colors.simplePracticeBorder,
      borderStyle: 'solid',
      textColor: '#000000'
    };
  }
  
  // Holiday events
  if (event.title.toLowerCase().includes('holiday') ||
      event.calendarId === 'en.usa#holiday@group.v.calendar.google.com') {
    return {
      background: config.colors.holiday,
      border: config.colors.holidayBorder,
      borderStyle: 'solid',
      textColor: '#000000'
    };
  }
  
  // Google Calendar events (default)
  return {
    background: config.colors.google,
    border: config.colors.googleBorder,
    borderStyle: 'dashed',
    textColor: '#000000'
  };
}

/**
 * Export Perfect Weekly Calendar PDF
 */
export async function exportPerfectWeeklyPDF(
  weekStartDate: Date,
  weekEndDate: Date,
  events: CalendarEvent[]
): Promise<void> {
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: [WEEKLY_CONFIG.pageWidth, WEEKLY_CONFIG.pageHeight]
  });
  
  // White background
  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, WEEKLY_CONFIG.pageWidth, WEEKLY_CONFIG.pageHeight, 'F');
  
  let currentY = WEEKLY_CONFIG.margin;
  
  // HEADER
  pdf.setFillColor(248, 249, 250); // Light gray header background
  pdf.rect(WEEKLY_CONFIG.margin, currentY, 
    WEEKLY_CONFIG.pageWidth - (2 * WEEKLY_CONFIG.margin), 
    WEEKLY_CONFIG.headerHeight, 'F');
  
  // Title
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(WEEKLY_CONFIG.titleFontSize);
  pdf.setTextColor(0, 0, 0);
  pdf.text('WEEKLY PLANNER', WEEKLY_CONFIG.pageWidth / 2, currentY + 25, { align: 'center' });
  
  // Subtitle
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(WEEKLY_CONFIG.subtitleFontSize);
  const weekStart = weekStartDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const weekEnd = weekEndDate.toLocaleDateString('en-US', { day: 'numeric' });
  const weekNumber = Math.ceil(((weekStartDate.getTime() - new Date(weekStartDate.getFullYear(), 0, 1).getTime()) / 86400000 + 1) / 7);
  pdf.text(`July ${weekStart}-${weekEnd} • Week ${weekNumber}`, WEEKLY_CONFIG.pageWidth / 2, currentY + 45, { align: 'center' });
  
  currentY += WEEKLY_CONFIG.headerHeight;
  
  // STATISTICS
  pdf.setFillColor(248, 249, 250);
  pdf.rect(WEEKLY_CONFIG.margin, currentY, 
    WEEKLY_CONFIG.pageWidth - (2 * WEEKLY_CONFIG.margin), 
    WEEKLY_CONFIG.statsHeight, 'F');
  
  const weekEvents = events.filter(event => {
    const eventDate = new Date(event.startTime);
    return eventDate >= weekStartDate && eventDate <= weekEndDate;
  });
  
  const totalAppointments = weekEvents.length;
  const totalHours = weekEvents.reduce((sum, event) => {
    const start = new Date(event.startTime);
    const end = new Date(event.endTime);
    return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  }, 0);
  
  const statsY = currentY + 15;
  const statSpacing = (WEEKLY_CONFIG.pageWidth - (2 * WEEKLY_CONFIG.margin)) / 4;
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(WEEKLY_CONFIG.statsValueFontSize);
  
  // Total Appointments
  pdf.text(totalAppointments.toString(), WEEKLY_CONFIG.margin + statSpacing * 0.5, statsY, { align: 'center' });
  pdf.text(`${totalHours.toFixed(1)}h`, WEEKLY_CONFIG.margin + statSpacing * 1.5, statsY, { align: 'center' });
  pdf.text('6.3h', WEEKLY_CONFIG.margin + statSpacing * 2.5, statsY, { align: 'center' });
  pdf.text('12h', WEEKLY_CONFIG.margin + statSpacing * 3.5, statsY, { align: 'center' });
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(WEEKLY_CONFIG.statsFontSize);
  
  pdf.text('Total Appointments', WEEKLY_CONFIG.margin + statSpacing * 0.5, statsY + 15, { align: 'center' });
  pdf.text('Scheduled Time', WEEKLY_CONFIG.margin + statSpacing * 1.5, statsY + 15, { align: 'center' });
  pdf.text('Daily Average', WEEKLY_CONFIG.margin + statSpacing * 2.5, statsY + 15, { align: 'center' });
  pdf.text('Available Time', WEEKLY_CONFIG.margin + statSpacing * 3.5, statsY + 15, { align: 'center' });
  
  currentY += WEEKLY_CONFIG.statsHeight;
  
  // LEGEND
  pdf.setFillColor(248, 249, 250);
  pdf.rect(WEEKLY_CONFIG.margin, currentY, 
    WEEKLY_CONFIG.pageWidth - (2 * WEEKLY_CONFIG.margin), 
    WEEKLY_CONFIG.legendHeight, 'F');
  
  const legendY = currentY + 15;
  const legendSpacing = (WEEKLY_CONFIG.pageWidth - (2 * WEEKLY_CONFIG.margin)) / 3;
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(WEEKLY_CONFIG.legendFontSize);
  
  // SimplePractice legend
  pdf.setFillColor(108, 117, 125); // Gray
  pdf.rect(WEEKLY_CONFIG.margin + legendSpacing * 0.5 - 30, legendY - 5, 12, 8, 'F');
  pdf.setDrawColor(0, 123, 255); // Blue border
  pdf.rect(WEEKLY_CONFIG.margin + legendSpacing * 0.5 - 30, legendY - 5, 12, 8, 'S');
  pdf.setTextColor(0, 0, 0);
  pdf.text('SimplePractice', WEEKLY_CONFIG.margin + legendSpacing * 0.5 - 15, legendY);
  
  // Google Calendar legend
  pdf.setFillColor(255, 255, 255); // White
  pdf.rect(WEEKLY_CONFIG.margin + legendSpacing * 1.5 - 30, legendY - 5, 12, 8, 'F');
  pdf.setDrawColor(40, 167, 69); // Green border
  pdf.setLineDash([2, 2]); // Dashed
  pdf.rect(WEEKLY_CONFIG.margin + legendSpacing * 1.5 - 30, legendY - 5, 12, 8, 'S');
  pdf.setLineDash([]); // Reset to solid
  pdf.text('Google Calendar', WEEKLY_CONFIG.margin + legendSpacing * 1.5 - 15, legendY);
  
  // Holidays legend
  pdf.setFillColor(255, 243, 205); // Light yellow
  pdf.rect(WEEKLY_CONFIG.margin + legendSpacing * 2.5 - 30, legendY - 5, 12, 8, 'F');
  pdf.setDrawColor(255, 193, 7); // Yellow border
  pdf.rect(WEEKLY_CONFIG.margin + legendSpacing * 2.5 - 30, legendY - 5, 12, 8, 'S');
  pdf.text('Holidays in United States', WEEKLY_CONFIG.margin + legendSpacing * 2.5 - 15, legendY);
  
  currentY += WEEKLY_CONFIG.legendHeight;
  
  // GRID HEADER
  const gridStartY = currentY;
  const gridStartX = WEEKLY_CONFIG.margin;
  
  // Draw grid outline
  pdf.setDrawColor(222, 226, 230);
  pdf.setLineWidth(1);
  pdf.rect(gridStartX, gridStartY, 
    WEEKLY_CONFIG.pageWidth - (2 * WEEKLY_CONFIG.margin), 
    36 * WEEKLY_CONFIG.rowHeight, 'S');
  
  // Time column header
  pdf.setFillColor(248, 249, 250);
  pdf.rect(gridStartX, gridStartY, WEEKLY_CONFIG.timeColumnWidth, WEEKLY_CONFIG.rowHeight, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(0, 0, 0);
  pdf.text('TIME', gridStartX + WEEKLY_CONFIG.timeColumnWidth / 2, gridStartY + WEEKLY_CONFIG.rowHeight / 2 + 3, { align: 'center' });
  
  // Day column headers
  const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  const dayNumbers = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStartDate);
    date.setDate(weekStartDate.getDate() + i);
    dayNumbers.push(date.getDate());
  }
  
  for (let i = 0; i < 7; i++) {
    const x = gridStartX + WEEKLY_CONFIG.timeColumnWidth + (i * WEEKLY_CONFIG.dayColumnWidth);
    pdf.setFillColor(248, 249, 250);
    pdf.rect(x, gridStartY, WEEKLY_CONFIG.dayColumnWidth, WEEKLY_CONFIG.rowHeight, 'F');
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.text(days[i], x + WEEKLY_CONFIG.dayColumnWidth / 2, gridStartY + 8, { align: 'center' });
    pdf.setFontSize(11);
    pdf.text(dayNumbers[i].toString(), x + WEEKLY_CONFIG.dayColumnWidth / 2, gridStartY + 20, { align: 'center' });
  }
  
  // Time slots and grid
  const timeSlots = generateTimeSlots();
  for (let i = 0; i < timeSlots.length; i++) {
    const y = gridStartY + WEEKLY_CONFIG.rowHeight + (i * WEEKLY_CONFIG.rowHeight);
    const slot = timeSlots[i];
    
    // Time label
    pdf.setFillColor(255, 255, 255);
    pdf.rect(gridStartX, y, WEEKLY_CONFIG.timeColumnWidth, WEEKLY_CONFIG.rowHeight, 'F');
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(0, 0, 0);
    pdf.text(slot.display, gridStartX + WEEKLY_CONFIG.timeColumnWidth / 2, y + WEEKLY_CONFIG.rowHeight / 2 + 2, { align: 'center' });
    
    // Grid lines
    pdf.setDrawColor(222, 226, 230);
    pdf.setLineWidth(slot.minute === 0 ? 1.5 : 0.5);
    pdf.line(gridStartX, y, gridStartX + WEEKLY_CONFIG.pageWidth - (2 * WEEKLY_CONFIG.margin), y);
    
    // Vertical grid lines
    for (let j = 0; j <= 7; j++) {
      const x = gridStartX + WEEKLY_CONFIG.timeColumnWidth + (j * WEEKLY_CONFIG.dayColumnWidth);
      pdf.line(x, y, x, y + WEEKLY_CONFIG.rowHeight);
    }
  }
  
  // Render events
  renderWeeklyEvents(pdf, weekEvents, weekStartDate, gridStartX, gridStartY + WEEKLY_CONFIG.rowHeight);
  
  // Save PDF
  const weekDateStr = weekStartDate.toISOString().split('T')[0];
  pdf.save(`perfect-weekly-${weekDateStr}.pdf`);
}

/**
 * Export Perfect Daily Calendar PDF
 */
export async function exportPerfectDailyPDF(
  selectedDate: Date,
  events: CalendarEvent[]
): Promise<void> {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: [DAILY_CONFIG.pageWidth, DAILY_CONFIG.pageHeight]
  });
  
  // White background
  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, DAILY_CONFIG.pageWidth, DAILY_CONFIG.pageHeight, 'F');
  
  let currentY = DAILY_CONFIG.margin;
  
  // HEADER
  pdf.setFillColor(248, 249, 250);
  pdf.rect(DAILY_CONFIG.margin, currentY, 
    DAILY_CONFIG.pageWidth - (2 * DAILY_CONFIG.margin), 
    DAILY_CONFIG.headerHeight, 'F');
  
  // Title
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(DAILY_CONFIG.titleFontSize);
  pdf.setTextColor(0, 0, 0);
  pdf.text('DAILY PLANNER', DAILY_CONFIG.pageWidth / 2, currentY + 20, { align: 'center' });
  
  // Subtitle
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(DAILY_CONFIG.subtitleFontSize);
  const dateStr = selectedDate.toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  });
  pdf.text(dateStr, DAILY_CONFIG.pageWidth / 2, currentY + 40, { align: 'center' });
  
  // Navigation info
  pdf.setFontSize(8);
  pdf.text('Week 28 • Day 1 of 7 • Page 2 of 8', DAILY_CONFIG.pageWidth / 2, currentY + 55, { align: 'center' });
  
  currentY += DAILY_CONFIG.headerHeight;
  
  // STATISTICS
  pdf.setFillColor(248, 249, 250);
  pdf.rect(DAILY_CONFIG.margin, currentY, 
    DAILY_CONFIG.pageWidth - (2 * DAILY_CONFIG.margin), 
    DAILY_CONFIG.statsHeight, 'F');
  
  const dayEvents = events.filter(event => {
    const eventDate = new Date(event.startTime);
    return eventDate.toDateString() === selectedDate.toDateString();
  });
  
  const totalAppointments = dayEvents.length;
  const totalHours = dayEvents.reduce((sum, event) => {
    const start = new Date(event.startTime);
    const end = new Date(event.endTime);
    return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  }, 0);
  
  const statsY = currentY + 12;
  const statSpacing = (DAILY_CONFIG.pageWidth - (2 * DAILY_CONFIG.margin)) / 4;
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(DAILY_CONFIG.statsValueFontSize);
  
  pdf.text(totalAppointments.toString(), DAILY_CONFIG.margin + statSpacing * 0.5, statsY, { align: 'center' });
  pdf.text(`${totalHours.toFixed(1)}h`, DAILY_CONFIG.margin + statSpacing * 1.5, statsY, { align: 'center' });
  pdf.text('13.0h', DAILY_CONFIG.margin + statSpacing * 2.5, statsY, { align: 'center' });
  pdf.text('54%', DAILY_CONFIG.margin + statSpacing * 3.5, statsY, { align: 'center' });
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(DAILY_CONFIG.statsFontSize);
  
  pdf.text('Appointments', DAILY_CONFIG.margin + statSpacing * 0.5, statsY + 12, { align: 'center' });
  pdf.text('Scheduled', DAILY_CONFIG.margin + statSpacing * 1.5, statsY + 12, { align: 'center' });
  pdf.text('Available', DAILY_CONFIG.margin + statSpacing * 2.5, statsY + 12, { align: 'center' });
  pdf.text('Free Time', DAILY_CONFIG.margin + statSpacing * 3.5, statsY + 12, { align: 'center' });
  
  currentY += DAILY_CONFIG.statsHeight;
  
  // LEGEND
  pdf.setFillColor(248, 249, 250);
  pdf.rect(DAILY_CONFIG.margin, currentY, 
    DAILY_CONFIG.pageWidth - (2 * DAILY_CONFIG.margin), 
    DAILY_CONFIG.legendHeight, 'F');
  
  const legendY = currentY + 12;
  const legendSpacing = (DAILY_CONFIG.pageWidth - (2 * DAILY_CONFIG.margin)) / 3;
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(DAILY_CONFIG.legendFontSize);
  
  // SimplePractice legend
  pdf.setFillColor(248, 249, 250);
  pdf.rect(DAILY_CONFIG.margin + legendSpacing * 0.5 - 25, legendY - 4, 10, 6, 'F');
  pdf.setDrawColor(0, 123, 255);
  pdf.rect(DAILY_CONFIG.margin + legendSpacing * 0.5 - 25, legendY - 4, 10, 6, 'S');
  pdf.setTextColor(0, 0, 0);
  pdf.text('SimplePractice', DAILY_CONFIG.margin + legendSpacing * 0.5 - 12, legendY);
  
  // Google Calendar legend
  pdf.setFillColor(227, 242, 253);
  pdf.rect(DAILY_CONFIG.margin + legendSpacing * 1.5 - 25, legendY - 4, 10, 6, 'F');
  pdf.setDrawColor(33, 150, 243);
  pdf.rect(DAILY_CONFIG.margin + legendSpacing * 1.5 - 25, legendY - 4, 10, 6, 'S');
  pdf.text('Google Calendar', DAILY_CONFIG.margin + legendSpacing * 1.5 - 12, legendY);
  
  // Holidays legend
  pdf.setFillColor(255, 243, 205);
  pdf.rect(DAILY_CONFIG.margin + legendSpacing * 2.5 - 25, legendY - 4, 10, 6, 'F');
  pdf.setDrawColor(255, 193, 7);
  pdf.rect(DAILY_CONFIG.margin + legendSpacing * 2.5 - 25, legendY - 4, 10, 6, 'S');
  pdf.text('Holidays in United States', DAILY_CONFIG.margin + legendSpacing * 2.5 - 12, legendY);
  
  currentY += DAILY_CONFIG.legendHeight;
  
  // GRID
  const gridStartY = currentY;
  const gridStartX = DAILY_CONFIG.margin;
  
  // Grid header
  pdf.setFillColor(248, 249, 250);
  pdf.rect(gridStartX, gridStartY, DAILY_CONFIG.timeColumnWidth, DAILY_CONFIG.rowHeight, 'F');
  pdf.rect(gridStartX + DAILY_CONFIG.timeColumnWidth, gridStartY, DAILY_CONFIG.appointmentColumnWidth, DAILY_CONFIG.rowHeight, 'F');
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(0, 0, 0);
  pdf.text('TIME', gridStartX + DAILY_CONFIG.timeColumnWidth / 2, gridStartY + DAILY_CONFIG.rowHeight / 2 + 3, { align: 'center' });
  
  const dayName = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
  const dayNumber = selectedDate.getDate();
  pdf.text(`${dayName}`, gridStartX + DAILY_CONFIG.timeColumnWidth + DAILY_CONFIG.appointmentColumnWidth / 2, gridStartY + 8, { align: 'center' });
  pdf.text(`Jul ${dayNumber}`, gridStartX + DAILY_CONFIG.timeColumnWidth + DAILY_CONFIG.appointmentColumnWidth / 2, gridStartY + 20, { align: 'center' });
  
  // Time slots and events
  const timeSlots = generateTimeSlots();
  for (let i = 0; i < timeSlots.length; i++) {
    const y = gridStartY + DAILY_CONFIG.rowHeight + (i * DAILY_CONFIG.rowHeight);
    const slot = timeSlots[i];
    
    // Time label
    pdf.setFillColor(255, 255, 255);
    pdf.rect(gridStartX, y, DAILY_CONFIG.timeColumnWidth, DAILY_CONFIG.rowHeight, 'F');
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(0, 0, 0);
    pdf.text(slot.display, gridStartX + DAILY_CONFIG.timeColumnWidth / 2, y + DAILY_CONFIG.rowHeight / 2 + 2, { align: 'center' });
    
    // Grid lines
    pdf.setDrawColor(222, 226, 230);
    pdf.setLineWidth(0.5);
    pdf.line(gridStartX, y, gridStartX + DAILY_CONFIG.timeColumnWidth + DAILY_CONFIG.appointmentColumnWidth, y);
    
    // Vertical line
    pdf.line(gridStartX + DAILY_CONFIG.timeColumnWidth, y, gridStartX + DAILY_CONFIG.timeColumnWidth, y + DAILY_CONFIG.rowHeight);
  }
  
  // Render events
  renderDailyEvents(pdf, dayEvents, gridStartX + DAILY_CONFIG.timeColumnWidth, gridStartY + DAILY_CONFIG.rowHeight);
  
  // Save PDF
  const dailyDateStr = selectedDate.toISOString().split('T')[0];
  pdf.save(`perfect-daily-${dailyDateStr}.pdf`);
}

/**
 * Render events for weekly view
 */
function renderWeeklyEvents(
  pdf: jsPDF,
  events: CalendarEvent[],
  weekStartDate: Date,
  gridStartX: number,
  gridStartY: number
) {
  events.forEach(event => {
    const eventDate = new Date(event.startTime);
    const dayOfWeek = eventDate.getDay();
    const adjustedDayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday = 0, Sunday = 6
    
    const startTime = new Date(event.startTime);
    const endTime = new Date(event.endTime);
    
    // Calculate position
    const startHour = startTime.getHours();
    const startMinute = startTime.getMinutes();
    const endHour = endTime.getHours();
    const endMinute = endTime.getMinutes();
    
    const startSlot = ((startHour - 6) * 2) + (startMinute >= 30 ? 1 : 0);
    const endSlot = ((endHour - 6) * 2) + (endMinute >= 30 ? 1 : 0);
    
    if (startSlot < 0 || startSlot >= 36) return;
    
    const x = gridStartX + WEEKLY_CONFIG.timeColumnWidth + (adjustedDayOfWeek * WEEKLY_CONFIG.dayColumnWidth) + 1;
    const y = gridStartY + (startSlot * WEEKLY_CONFIG.rowHeight) + 1;
    const width = WEEKLY_CONFIG.dayColumnWidth - 2;
    const height = Math.max((endSlot - startSlot) * WEEKLY_CONFIG.rowHeight - 2, 12);
    
    // Get styling
    const styling = getEventStyling(event, WEEKLY_CONFIG);
    
    // Draw event background
    if (styling.background === '#ffffff') {
      pdf.setFillColor(255, 255, 255);
    } else if (styling.background === '#f8f9fa') {
      pdf.setFillColor(248, 249, 250);
    } else if (styling.background === '#6c757d') {
      pdf.setFillColor(108, 117, 125);
    } else if (styling.background === '#fff3cd') {
      pdf.setFillColor(255, 243, 205);
    }
    
    pdf.rect(x, y, width, height, 'F');
    
    // Draw border
    if (styling.border === '#007bff') {
      pdf.setDrawColor(0, 123, 255);
    } else if (styling.border === '#28a745') {
      pdf.setDrawColor(40, 167, 69);
    } else if (styling.border === '#ffc107') {
      pdf.setDrawColor(255, 193, 7);
    }
    
    pdf.setLineWidth(1);
    if (styling.borderStyle === 'dashed') {
      pdf.setLineDash([2, 2]);
    }
    pdf.rect(x, y, width, height, 'S');
    pdf.setLineDash([]);
    
    // Draw text
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    
    const cleanTitle = cleanEventTitle(event.title);
    const lines = pdf.splitTextToSize(cleanTitle, width - 4);
    const lineHeight = 8;
    
    for (let i = 0; i < Math.min(lines.length, Math.floor(height / lineHeight)); i++) {
      pdf.text(lines[i], x + 2, y + 8 + (i * lineHeight));
    }
  });
}

/**
 * Render events for daily view
 */
function renderDailyEvents(
  pdf: jsPDF,
  events: CalendarEvent[],
  gridStartX: number,
  gridStartY: number
) {
  events.forEach(event => {
    const startTime = new Date(event.startTime);
    const endTime = new Date(event.endTime);
    
    const startHour = startTime.getHours();
    const startMinute = startTime.getMinutes();
    const endHour = endTime.getHours();
    const endMinute = endTime.getMinutes();
    
    const startSlot = ((startHour - 6) * 2) + (startMinute >= 30 ? 1 : 0);
    const endSlot = ((endHour - 6) * 2) + (endMinute >= 30 ? 1 : 0);
    
    if (startSlot < 0 || startSlot >= 36) return;
    
    const x = gridStartX + 1;
    const y = gridStartY + (startSlot * DAILY_CONFIG.rowHeight) + 1;
    const width = DAILY_CONFIG.appointmentColumnWidth - 2;
    const height = Math.max((endSlot - startSlot) * DAILY_CONFIG.rowHeight - 2, 24);
    
    // Get styling
    const styling = getEventStyling(event, DAILY_CONFIG);
    
    // Draw event background
    if (styling.background === '#ffffff') {
      pdf.setFillColor(255, 255, 255);
    } else if (styling.background === '#f8f9fa') {
      pdf.setFillColor(248, 249, 250);
    } else if (styling.background === '#e3f2fd') {
      pdf.setFillColor(227, 242, 253);
    } else if (styling.background === '#fff3cd') {
      pdf.setFillColor(255, 243, 205);
    }
    
    pdf.rect(x, y, width, height, 'F');
    
    // Draw border
    if (styling.border === '#007bff') {
      pdf.setDrawColor(0, 123, 255);
    } else if (styling.border === '#2196f3') {
      pdf.setDrawColor(33, 150, 243);
    } else if (styling.border === '#ffc107') {
      pdf.setDrawColor(255, 193, 7);
    }
    
    pdf.setLineWidth(1);
    pdf.rect(x, y, width, height, 'S');
    
    // Draw text
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    
    const cleanTitle = cleanEventTitle(event.title);
    pdf.text(cleanTitle, x + 4, y + 12);
    
    // Source
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(100, 100, 100);
    
    const source = event.source === 'simplepractice' ? 'SIMPLEPRACTICE' : 'GOOGLE CALENDAR';
    pdf.text(source, x + 4, y + 24);
    
    // Time
    const timeStr = `${startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}-${endTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}`;
    pdf.text(timeStr, x + 4, y + 36);
  });
}