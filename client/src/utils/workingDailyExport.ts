
import jsPDF from 'jspdf';
import { CalendarEvent } from '../types/calendar';

// Configuration for daily planner PDF
const DAILY_CONFIG = {
  pageWidth: 612,   // 8.5 inches at 72 DPI
  pageHeight: 792,  // 11 inches at 72 DPI
  margin: 40,
  timeColumnWidth: 80,
  eventColumnWidth: 492, // pageWidth - timeColumnWidth - margins
  timeSlotHeight: 20,
  headerHeight: 100,
  
  colors: {
    black: [0, 0, 0],
    gray: [128, 128, 128],
    lightGray: [245, 245, 245],
    white: [255, 255, 255],
    simplePracticeBlue: [100, 149, 237],
    googleGreen: [34, 197, 94],
    holidayYellow: [255, 193, 7]
  },
  
  fonts: {
    title: 18,
    subtitle: 14,
    timeLabel: 10,
    eventTitle: 12,
    eventDetails: 9
  }
};

// Time slots from 6:00 AM to 11:30 PM
const TIME_SLOTS = [
  '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30',
  '22:00', '22:30', '23:00', '23:30'
];

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: false 
  });
}

function cleanEventTitle(title: string): string {
  // Remove problematic characters and extra spaces
  return title
    .replace(/[^\w\s\-\.\,\:\(\)]/g, '') // Remove special characters except common punctuation
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim();
}

function getEventType(event: CalendarEvent) {
  const isSimplePractice = event.source === 'simplepractice' || 
                          event.title?.toLowerCase().includes('appointment') ||
                          event.calendarId === '0np7sib5u30o7oc297j5pb259g';
  const isHoliday = event.title?.toLowerCase().includes('holiday') ||
                   event.calendarId === 'en.usa#holiday@group.v.calendar.google.com';
  const isGoogle = event.source === 'google' && !isSimplePractice && !isHoliday;
  
  return { isSimplePractice, isGoogle, isHoliday };
}

function drawHeader(pdf: jsPDF, selectedDate: Date, events: CalendarEvent[]) {
  const { margin, pageWidth } = DAILY_CONFIG;
  
  // Title
  pdf.setFontSize(DAILY_CONFIG.fonts.title);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...DAILY_CONFIG.colors.black);
  pdf.text('DAILY PLANNER', pageWidth / 2, margin + 25, { align: 'center' });
  
  // Date
  pdf.setFontSize(DAILY_CONFIG.fonts.subtitle);
  pdf.setFont('helvetica', 'normal');
  const dateStr = selectedDate.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  pdf.text(dateStr, pageWidth / 2, margin + 45, { align: 'center' });
  
  // Filter events for this day
  const dayEvents = events.filter(event => {
    const eventDate = new Date(event.startTime);
    return eventDate.toDateString() === selectedDate.toDateString();
  });
  
  // Statistics
  const totalEvents = dayEvents.length;
  const totalHours = dayEvents.reduce((sum, event) => {
    return sum + (new Date(event.endTime).getTime() - new Date(event.startTime).getTime()) / (1000 * 60 * 60);
  }, 0);
  
  pdf.setFontSize(10);
  pdf.text(`${totalEvents} appointments • ${totalHours.toFixed(1)}h scheduled`, pageWidth / 2, margin + 60, { align: 'center' });
  
  // Legend
  const legendY = margin + 80;
  let legendX = margin + 40;
  
  // SimplePractice legend
  pdf.setFillColor(...DAILY_CONFIG.colors.white);
  pdf.rect(legendX, legendY - 6, 12, 8, 'F');
  pdf.setDrawColor(...DAILY_CONFIG.colors.simplePracticeBlue);
  pdf.setLineWidth(3);
  pdf.line(legendX, legendY - 6, legendX, legendY + 2);
  pdf.setLineWidth(1);
  pdf.setDrawColor(...DAILY_CONFIG.colors.gray);
  pdf.rect(legendX, legendY - 6, 12, 8);
  pdf.setFontSize(9);
  pdf.setTextColor(...DAILY_CONFIG.colors.black);
  pdf.text('SimplePractice', legendX + 18, legendY - 1);
  
  // Google Calendar legend
  legendX += 120;
  pdf.setFillColor(...DAILY_CONFIG.colors.white);
  pdf.rect(legendX, legendY - 6, 12, 8, 'F');
  pdf.setDrawColor(...DAILY_CONFIG.colors.googleGreen);
  pdf.setLineWidth(2);
  pdf.setLineDash([3, 2]);
  pdf.rect(legendX, legendY - 6, 12, 8);
  pdf.setLineDash([]);
  pdf.text('Google Calendar', legendX + 18, legendY - 1);
  
  // Holidays legend
  legendX += 120;
  pdf.setFillColor(...DAILY_CONFIG.colors.holidayYellow);
  pdf.rect(legendX, legendY - 6, 12, 8, 'F');
  pdf.setDrawColor(...DAILY_CONFIG.colors.black);
  pdf.setLineWidth(1);
  pdf.rect(legendX, legendY - 6, 12, 8);
  pdf.text('Holidays', legendX + 18, legendY - 1);
}

function drawTimeGrid(pdf: jsPDF) {
  const { margin, timeColumnWidth, eventColumnWidth, timeSlotHeight } = DAILY_CONFIG;
  const gridStartY = margin + DAILY_CONFIG.headerHeight;
  
  // Column headers
  pdf.setFillColor(...DAILY_CONFIG.colors.lightGray);
  pdf.rect(margin, gridStartY, timeColumnWidth, 25, 'F');
  pdf.rect(margin + timeColumnWidth, gridStartY, eventColumnWidth, 25, 'F');
  
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...DAILY_CONFIG.colors.black);
  pdf.text('TIME', margin + timeColumnWidth / 2, gridStartY + 16, { align: 'center' });
  pdf.text('APPOINTMENTS', margin + timeColumnWidth + eventColumnWidth / 2, gridStartY + 16, { align: 'center' });
  
  // Time slots
  TIME_SLOTS.forEach((timeSlot, index) => {
    const y = gridStartY + 25 + (index * timeSlotHeight);
    const isHour = timeSlot.endsWith(':00');
    
    // Time column background
    pdf.setFillColor(...(isHour ? DAILY_CONFIG.colors.lightGray : DAILY_CONFIG.colors.white));
    pdf.rect(margin, y, timeColumnWidth, timeSlotHeight, 'F');
    
    // Time label
    pdf.setFontSize(DAILY_CONFIG.fonts.timeLabel);
    pdf.setFont('helvetica', isHour ? 'bold' : 'normal');
    pdf.setTextColor(...DAILY_CONFIG.colors.black);
    pdf.text(timeSlot, margin + timeColumnWidth / 2, y + timeSlotHeight / 2 + 3, { align: 'center' });
    
    // Event column background
    pdf.setFillColor(...DAILY_CONFIG.colors.white);
    pdf.rect(margin + timeColumnWidth, y, eventColumnWidth, timeSlotHeight, 'F');
    
    // Horizontal grid lines
    pdf.setLineWidth(0.5);
    pdf.setDrawColor(...DAILY_CONFIG.colors.gray);
    pdf.line(margin, y, margin + timeColumnWidth + eventColumnWidth, y);
  });
  
  // Final bottom line
  const finalY = gridStartY + 25 + (TIME_SLOTS.length * timeSlotHeight);
  pdf.line(margin, finalY, margin + timeColumnWidth + eventColumnWidth, finalY);
  
  // Vertical separator
  pdf.setLineWidth(1);
  pdf.setDrawColor(...DAILY_CONFIG.colors.black);
  pdf.line(margin + timeColumnWidth, gridStartY, margin + timeColumnWidth, finalY);
  
  // Outer border
  pdf.setLineWidth(1);
  pdf.setDrawColor(...DAILY_CONFIG.colors.black);
  pdf.rect(margin, gridStartY, timeColumnWidth + eventColumnWidth, 25 + (TIME_SLOTS.length * timeSlotHeight));
}

function drawEvents(pdf: jsPDF, selectedDate: Date, events: CalendarEvent[]) {
  const { margin, timeColumnWidth, eventColumnWidth, timeSlotHeight } = DAILY_CONFIG;
  const gridStartY = margin + DAILY_CONFIG.headerHeight + 25;
  
  // Filter events for selected date
  const dayEvents = events.filter(event => {
    const eventDate = new Date(event.startTime);
    return eventDate.toDateString() === selectedDate.toDateString();
  }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  
  console.log(`Drawing ${dayEvents.length} events for ${selectedDate.toDateString()}`);
  
  dayEvents.forEach((event, index) => {
    const eventStart = new Date(event.startTime);
    const eventEnd = new Date(event.endTime);
    
    // Calculate position based on time slots
    const startHour = eventStart.getHours();
    const startMinute = eventStart.getMinutes();
    const totalMinutesFrom6AM = (startHour - 6) * 60 + startMinute;
    
    // Skip events outside our time range
    if (totalMinutesFrom6AM < 0 || totalMinutesFrom6AM > (17.5 * 60)) {
      console.log(`Event ${event.title} outside time range, skipping`);
      return;
    }
    
    // Calculate Y position (each 30-minute slot = timeSlotHeight pixels)
    const slotIndex = totalMinutesFrom6AM / 30;
    const eventY = gridStartY + (slotIndex * timeSlotHeight);
    
    // Calculate duration and height
    const durationMinutes = (eventEnd.getTime() - eventStart.getTime()) / (1000 * 60);
    const eventHeight = Math.max(16, (durationMinutes / 30) * timeSlotHeight);
    
    const eventX = margin + timeColumnWidth + 2;
    const eventWidth = eventColumnWidth - 4;
    
    // Get event type and style
    const { isSimplePractice, isGoogle, isHoliday } = getEventType(event);
    
    // Draw event background
    pdf.setFillColor(...DAILY_CONFIG.colors.white);
    pdf.rect(eventX, eventY, eventWidth, eventHeight, 'F');
    
    // Draw event border based on type
    if (isSimplePractice) {
      pdf.setDrawColor(...DAILY_CONFIG.colors.simplePracticeBlue);
      pdf.setLineWidth(3);
      pdf.line(eventX, eventY, eventX, eventY + eventHeight);
      pdf.setLineWidth(1);
      pdf.setDrawColor(...DAILY_CONFIG.colors.gray);
      pdf.rect(eventX, eventY, eventWidth, eventHeight);
    } else if (isGoogle) {
      pdf.setDrawColor(...DAILY_CONFIG.colors.googleGreen);
      pdf.setLineWidth(2);
      pdf.setLineDash([3, 2]);
      pdf.rect(eventX, eventY, eventWidth, eventHeight);
      pdf.setLineDash([]);
    } else if (isHoliday) {
      pdf.setFillColor(...DAILY_CONFIG.colors.holidayYellow);
      pdf.rect(eventX, eventY, eventWidth, eventHeight, 'F');
      pdf.setDrawColor(...DAILY_CONFIG.colors.black);
      pdf.setLineWidth(1);
      pdf.rect(eventX, eventY, eventWidth, eventHeight);
    } else {
      pdf.setDrawColor(...DAILY_CONFIG.colors.gray);
      pdf.setLineWidth(1);
      pdf.rect(eventX, eventY, eventWidth, eventHeight);
    }
    
    // Event text content
    const textPadding = 4;
    let currentY = eventY + 12;
    
    // Event title
    let title = cleanEventTitle(event.title || 'Untitled Event');
    if (title.endsWith(' Appointment')) {
      title = title.slice(0, -12);
    }
    
    pdf.setFontSize(DAILY_CONFIG.fonts.eventTitle);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...DAILY_CONFIG.colors.black);
    
    // Wrap title if too long
    const maxTitleWidth = eventWidth - (textPadding * 2);
    const titleLines = pdf.splitTextToSize(title, maxTitleWidth);
    
    if (Array.isArray(titleLines)) {
      titleLines.forEach((line, lineIndex) => {
        if (currentY + 12 < eventY + eventHeight) {
          pdf.text(line, eventX + textPadding, currentY);
          currentY += 12;
        }
      });
    } else {
      pdf.text(titleLines, eventX + textPadding, currentY);
      currentY += 12;
    }
    
    // Event source
    if (currentY + 10 < eventY + eventHeight) {
      pdf.setFontSize(DAILY_CONFIG.fonts.eventDetails);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...DAILY_CONFIG.colors.gray);
      
      let sourceText = '';
      if (isSimplePractice) sourceText = 'SIMPLEPRACTICE';
      else if (isGoogle) sourceText = 'GOOGLE CALENDAR';
      else if (isHoliday) sourceText = 'HOLIDAY';
      else sourceText = 'MANUAL';
      
      pdf.text(sourceText, eventX + textPadding, currentY);
      currentY += 10;
    }
    
    // Event time
    if (currentY + 10 < eventY + eventHeight) {
      pdf.setFontSize(DAILY_CONFIG.fonts.eventDetails);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...DAILY_CONFIG.colors.black);
      
      const timeRange = `${formatTime(eventStart)} - ${formatTime(eventEnd)}`;
      pdf.text(timeRange, eventX + textPadding, currentY);
    }
  });
}

export const exportWorkingDailyPDF = async (
  selectedDate: Date,
  events: CalendarEvent[]
): Promise<void> => {
  try {
    console.log('=== WORKING DAILY PDF EXPORT ===');
    console.log('Date:', selectedDate.toDateString());
    console.log('Total events:', events.length);
    
    // Filter events for the selected date
    const dayEvents = events.filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate.toDateString() === selectedDate.toDateString();
    });
    
    console.log('Events for selected date:', dayEvents.length);
    
    // Create PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: [DAILY_CONFIG.pageWidth, DAILY_CONFIG.pageHeight]
    });
    
    // Draw all sections
    drawHeader(pdf, selectedDate, events);
    drawTimeGrid(pdf);
    drawEvents(pdf, selectedDate, events);
    
    // Save PDF
    const fileName = `daily-planner-${selectedDate.toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
    
    console.log(`PDF saved as: ${fileName}`);
    console.log('=== DAILY PDF EXPORT COMPLETE ===');
    
  } catch (error) {
    console.error('Daily PDF export failed:', error);
    throw error;
  }
};
