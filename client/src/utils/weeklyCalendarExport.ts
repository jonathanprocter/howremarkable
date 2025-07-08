import jsPDF from 'jspdf';
import { CalendarEvent } from '../types/calendar';
import { getWeekNumber } from './dateUtils';

// Clean weekly calendar export with proper formatting
const WEEKLY_CONFIG = {
  // Page setup - A4 landscape
  pageWidth: 842,
  pageHeight: 595,
  margin: 20,
  
  // Layout
  headerHeight: 60,
  legendHeight: 30,
  timeColumnWidth: 60,
  
  // Time range
  startHour: 6,
  endHour: 23,
  endMinute: 30,
  slotHeight: 15, // Height per 30-minute slot
  
  // Colors
  headerBg: [245, 245, 245],
  gridBorder: [200, 200, 200],
  hourRowBg: [240, 240, 240], // Grey background for hour rows
  hourLine: [150, 150, 150],
  eventBg: [255, 255, 255], // White background for events
  googleEventBorder: [52, 168, 83], // Green for Google Calendar
  simplePracticeEventBorder: [66, 133, 244], // Blue for SimplePractice
  personalEventBorder: [255, 152, 0] // Orange for personal events
};

export const exportWeeklyCalendar = async (
  weekStartDate: Date,
  weekEndDate: Date,
  events: CalendarEvent[]
): Promise<void> => {
  console.log('Starting weekly calendar export...');
  
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: 'a4'
  });

  // Filter events for this week
  const weekEvents = events.filter(event => {
    const eventDate = new Date(event.startTime);
    return eventDate >= weekStartDate && eventDate <= weekEndDate;
  });

  drawCalendarPage(pdf, weekStartDate, weekEndDate, weekEvents);
  
  // Save the PDF
  const filename = `weekly-calendar-${weekStartDate.toISOString().split('T')[0]}.pdf`;
  pdf.save(filename);
  
  console.log(`✅ Weekly calendar exported: ${filename}`);
};

function drawCalendarPage(pdf: jsPDF, weekStartDate: Date, weekEndDate: Date, events: CalendarEvent[]): void {
  const { margin, headerHeight, legendHeight, timeColumnWidth } = WEEKLY_CONFIG;
  const contentWidth = WEEKLY_CONFIG.pageWidth - (margin * 2);
  const dayColumnWidth = (contentWidth - timeColumnWidth) / 7;
  
  // Main border
  pdf.setLineWidth(2);
  pdf.setDrawColor(0, 0, 0);
  pdf.rect(margin, margin, contentWidth, WEEKLY_CONFIG.pageHeight - (margin * 2));
  
  // Header
  drawHeader(pdf, weekStartDate, weekEndDate, margin, contentWidth);
  
  // Legend
  drawLegend(pdf, margin, headerHeight, contentWidth);
  
  // Day headers
  drawDayHeaders(pdf, weekStartDate, margin, headerHeight + legendHeight, timeColumnWidth, dayColumnWidth);
  
  // Time grid
  drawTimeGrid(pdf, margin, headerHeight + legendHeight, timeColumnWidth, dayColumnWidth);
  
  // Events
  drawEvents(pdf, weekStartDate, events, margin, headerHeight + legendHeight, timeColumnWidth, dayColumnWidth);
}

function drawHeader(pdf: jsPDF, weekStartDate: Date, weekEndDate: Date, margin: number, contentWidth: number): void {
  const { headerHeight } = WEEKLY_CONFIG;
  
  // Header background
  pdf.setFillColor(...WEEKLY_CONFIG.headerBg);
  pdf.rect(margin, margin, contentWidth, headerHeight, 'F');
  
  // Header border
  pdf.setLineWidth(1);
  pdf.setDrawColor(0, 0, 0);
  pdf.line(margin, margin + headerHeight, margin + contentWidth, margin + headerHeight);
  
  // Title
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0, 0, 0);
  pdf.text('Weekly Calendar', WEEKLY_CONFIG.pageWidth / 2, margin + 25, { align: 'center' });
  
  // Week info
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  const weekNumber = getWeekNumber(weekStartDate);
  const weekText = `Week ${weekNumber}: ${weekStartDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEndDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  pdf.text(weekText, WEEKLY_CONFIG.pageWidth / 2, margin + 45, { align: 'center' });
}

function drawLegend(pdf: jsPDF, margin: number, headerHeight: number, contentWidth: number): void {
  const legendY = margin + headerHeight;
  const { legendHeight } = WEEKLY_CONFIG;
  
  // Legend background
  pdf.setFillColor(255, 255, 255);
  pdf.rect(margin, legendY, contentWidth, legendHeight, 'F');
  
  // Legend border
  pdf.setLineWidth(1);
  pdf.setDrawColor(0, 0, 0);
  pdf.line(margin, legendY + legendHeight, margin + contentWidth, legendY + legendHeight);
  
  // Legend items
  const legendItems = [
    { label: 'SimplePractice', color: WEEKLY_CONFIG.simplePracticeEventBorder, style: 'solid' },
    { label: 'Google Calendar', color: WEEKLY_CONFIG.googleEventBorder, style: 'dashed' },
    { label: 'Personal', color: WEEKLY_CONFIG.personalEventBorder, style: 'solid' }
  ];
  
  let x = margin + 50;
  legendItems.forEach((item) => {
    // Draw legend box
    pdf.setFillColor(...WEEKLY_CONFIG.eventBg);
    pdf.rect(x, legendY + 8, 16, 12, 'F');
    
    if (item.style === 'dashed') {
      pdf.setDrawColor(...item.color);
      pdf.setLineWidth(2);
      pdf.setLineDashPattern([2, 2], 0);
      pdf.rect(x, legendY + 8, 16, 12);
      pdf.setLineDashPattern([], 0);
    } else {
      pdf.setDrawColor(...item.color);
      pdf.setLineWidth(2);
      pdf.rect(x, legendY + 8, 16, 12);
    }
    
    // Legend label
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);
    pdf.text(item.label, x + 22, legendY + 15);
    
    x += 100;
  });
}

function drawDayHeaders(pdf: jsPDF, weekStartDate: Date, margin: number, headerHeight: number, timeColumnWidth: number, dayColumnWidth: number): void {
  const dayNames = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  const headerY = margin + headerHeight;
  const dayHeaderHeight = 30;
  
  // Time column header
  pdf.setFillColor(...WEEKLY_CONFIG.headerBg);
  pdf.rect(margin, headerY, timeColumnWidth, dayHeaderHeight, 'F');
  pdf.setLineWidth(1);
  pdf.setDrawColor(0, 0, 0);
  pdf.rect(margin, headerY, timeColumnWidth, dayHeaderHeight);
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0, 0, 0);
  pdf.text('TIME', margin + timeColumnWidth / 2, headerY + 18, { align: 'center' });
  
  // Day headers
  for (let i = 0; i < 7; i++) {
    const x = margin + timeColumnWidth + (i * dayColumnWidth);
    const dayDate = new Date(weekStartDate);
    dayDate.setDate(dayDate.getDate() + i);
    
    // Day header background
    pdf.setFillColor(...WEEKLY_CONFIG.headerBg);
    pdf.rect(x, headerY, dayColumnWidth, dayHeaderHeight, 'F');
    
    // Day header border
    pdf.setLineWidth(1);
    pdf.setDrawColor(0, 0, 0);
    pdf.rect(x, headerY, dayColumnWidth, dayHeaderHeight);
    
    // Day name
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.text(dayNames[i], x + dayColumnWidth / 2, headerY + 12, { align: 'center' });
    
    // Day date
    pdf.setFontSize(12);
    pdf.text(dayDate.getDate().toString(), x + dayColumnWidth / 2, headerY + 24, { align: 'center' });
  }
}

function drawTimeGrid(pdf: jsPDF, margin: number, headerHeight: number, timeColumnWidth: number, dayColumnWidth: number): void {
  const gridStartY = margin + headerHeight + 30;
  const { startHour, endHour, endMinute, slotHeight } = WEEKLY_CONFIG;
  
  // Generate time slots - ensuring we go through 23:30
  const timeSlots = [];
  for (let hour = startHour; hour <= endHour; hour++) {
    timeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
    if (hour < endHour || (hour === endHour && endMinute >= 30)) {
      timeSlots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
  }
  
  timeSlots.forEach((timeSlot, index) => {
    const y = gridStartY + (index * slotHeight);
    const isHour = timeSlot.endsWith(':00');
    
    // Time column background
    pdf.setFillColor(255, 255, 255);
    pdf.rect(margin, y, timeColumnWidth, slotHeight, 'F');
    
    // Time label
    pdf.setFontSize(isHour ? 9 : 8);
    pdf.setFont('helvetica', isHour ? 'bold' : 'normal');
    pdf.setTextColor(0, 0, 0);
    pdf.text(timeSlot, margin + timeColumnWidth / 2, y + slotHeight / 2 + 3, { align: 'center' });
    
    // Day columns with grey background for hour rows
    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      const x = margin + timeColumnWidth + (dayIndex * dayColumnWidth);
      
      // Hour row background - grey for hour rows (:00), white for half-hour rows (:30)
      if (isHour) {
        pdf.setFillColor(...WEEKLY_CONFIG.hourRowBg);
        pdf.rect(x, y, dayColumnWidth, slotHeight, 'F');
      } else {
        pdf.setFillColor(255, 255, 255);
        pdf.rect(x, y, dayColumnWidth, slotHeight, 'F');
      }
      
      // Cell border
      pdf.setLineWidth(0.5);
      pdf.setDrawColor(...WEEKLY_CONFIG.gridBorder);
      pdf.rect(x, y, dayColumnWidth, slotHeight);
    }
    
    // Grid lines
    pdf.setLineWidth(isHour ? 1 : 0.5);
    pdf.setDrawColor(...(isHour ? WEEKLY_CONFIG.hourLine : WEEKLY_CONFIG.gridBorder));
    pdf.line(margin, y, margin + timeColumnWidth + (7 * dayColumnWidth), y);
  });
  
  // Vertical day separators
  for (let dayIndex = 0; dayIndex <= 7; dayIndex++) {
    const x = margin + timeColumnWidth + (dayIndex * dayColumnWidth);
    pdf.setLineWidth(1);
    pdf.setDrawColor(0, 0, 0);
    pdf.line(x, gridStartY, x, gridStartY + (timeSlots.length * slotHeight));
  }
}

function drawEvents(pdf: jsPDF, weekStartDate: Date, events: CalendarEvent[], margin: number, headerHeight: number, timeColumnWidth: number, dayColumnWidth: number): void {
  const gridStartY = margin + headerHeight + 30;
  const { startHour, slotHeight } = WEEKLY_CONFIG;
  
  events.forEach((event) => {
    const eventDate = new Date(event.startTime);
    const endDate = new Date(event.endTime);
    
    // Calculate day index
    const dayIndex = Math.floor((eventDate.getTime() - weekStartDate.getTime()) / (1000 * 60 * 60 * 24));
    if (dayIndex < 0 || dayIndex > 6) return;
    
    // Calculate time position
    const startHour24 = eventDate.getHours();
    const startMinute = eventDate.getMinutes();
    const endHour24 = endDate.getHours();
    const endMinute = endDate.getMinutes();
    
    // Convert to slot positions
    const startSlotIndex = ((startHour24 - startHour) * 2) + (startMinute >= 30 ? 1 : 0);
    const endSlotIndex = ((endHour24 - startHour) * 2) + (endMinute >= 30 ? 1 : 0);
    
    if (startSlotIndex < 0) return;
    
    // Calculate position and size
    const x = margin + timeColumnWidth + (dayIndex * dayColumnWidth) + 1;
    const y = gridStartY + (startSlotIndex * slotHeight) + 1;
    const width = dayColumnWidth - 2;
    const height = Math.max(slotHeight - 2, (endSlotIndex - startSlotIndex) * slotHeight - 2);
    
    // Draw event with white background
    pdf.setFillColor(...WEEKLY_CONFIG.eventBg); // White background
    pdf.rect(x, y, width, height, 'F');
    
    // Event border styling based on source
    if (event.title.includes('Appointment')) {
      // SimplePractice events - solid blue border
      pdf.setDrawColor(...WEEKLY_CONFIG.simplePracticeEventBorder);
      pdf.setLineWidth(2);
      pdf.rect(x, y, width, height);
    } else if (event.source === 'google') {
      // Google Calendar events - dashed green border
      pdf.setDrawColor(...WEEKLY_CONFIG.googleEventBorder);
      pdf.setLineWidth(2);
      pdf.setLineDashPattern([3, 3], 0);
      pdf.rect(x, y, width, height);
      pdf.setLineDashPattern([], 0); // Reset dash pattern
    } else {
      // Personal events - solid orange border
      pdf.setDrawColor(...WEEKLY_CONFIG.personalEventBorder);
      pdf.setLineWidth(2);
      pdf.rect(x, y, width, height);
    }
    
    // Event text
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);
    
    // Clean title
    let title = event.title.replace(' Appointment', '');
    if (title.length > 12) {
      title = title.substring(0, 12) + '...';
    }
    
    pdf.text(title, x + 2, y + 10);
    
    // Time
    const timeText = `${startHour24.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}`;
    pdf.setFontSize(6);
    pdf.text(timeText, x + 2, y + height - 2);
  });
}