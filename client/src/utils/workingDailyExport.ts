
import jsPDF from 'jspdf';
import { CalendarEvent } from '../types/calendar';

// Configuration for daily planner PDF
const DAILY_CONFIG = {
  pageWidth: 612,   // 8.5 inches
  pageHeight: 792,  // 11 inches
  margin: 25,
  timeColumnWidth: 90,
  eventColumnWidth: 497, // pageWidth - timeColumnWidth - margins
  timeSlotHeight: 20,
  headerHeight: 80,
  
  colors: {
    black: [0, 0, 0],
    gray: [128, 128, 128],
    lightGray: [240, 240, 240],
    white: [255, 255, 255],
    simplePracticeBlue: [100, 149, 237],
    googleGreen: [34, 197, 94],
    holidayYellow: [255, 255, 0]
  },
  
  fonts: {
    title: 16,
    subtitle: 12,
    timeLabel: 10,
    eventTitle: 11,
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

function getEventType(event: CalendarEvent) {
  const isSimplePractice = event.source === 'simplepractice' || 
                          event.title?.toLowerCase().includes('appointment');
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
  pdf.text('DAILY PLANNER', pageWidth / 2, margin + 20, { align: 'center' });
  
  // Date
  pdf.setFontSize(DAILY_CONFIG.fonts.subtitle);
  pdf.setFont('helvetica', 'normal');
  const dateStr = selectedDate.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  pdf.text(dateStr, pageWidth / 2, margin + 35, { align: 'center' });
  
  // Statistics
  const totalEvents = events.length;
  const totalHours = events.reduce((sum, event) => {
    return sum + (new Date(event.endTime).getTime() - new Date(event.startTime).getTime()) / (1000 * 60 * 60);
  }, 0);
  
  pdf.setFontSize(10);
  pdf.text(`${totalEvents} appointments • ${totalHours.toFixed(1)}h scheduled`, pageWidth / 2, margin + 50, { align: 'center' });
  
  // Legend
  const legendY = margin + 65;
  let legendX = margin + 50;
  
  // SimplePractice
  pdf.setFillColor(...DAILY_CONFIG.colors.white);
  pdf.rect(legendX, legendY - 5, 10, 8, 'F');
  pdf.setDrawColor(...DAILY_CONFIG.colors.simplePracticeBlue);
  pdf.setLineWidth(2);
  pdf.line(legendX, legendY - 5, legendX, legendY + 3);
  pdf.setFontSize(8);
  pdf.setTextColor(...DAILY_CONFIG.colors.black);
  pdf.text('SimplePractice', legendX + 15, legendY);
  
  // Google Calendar
  legendX += 120;
  pdf.setFillColor(...DAILY_CONFIG.colors.white);
  pdf.rect(legendX, legendY - 5, 10, 8, 'F');
  pdf.setDrawColor(...DAILY_CONFIG.colors.googleGreen);
  pdf.setLineDash([2, 1]);
  pdf.rect(legendX, legendY - 5, 10, 8);
  pdf.setLineDash([]);
  pdf.text('Google Calendar', legendX + 15, legendY);
  
  // Holidays
  legendX += 120;
  pdf.setFillColor(...DAILY_CONFIG.colors.holidayYellow);
  pdf.rect(legendX, legendY - 5, 10, 8, 'F');
  pdf.setDrawColor(...DAILY_CONFIG.colors.black);
  pdf.setLineWidth(1);
  pdf.rect(legendX, legendY - 5, 10, 8);
  pdf.text('Holidays', legendX + 15, legendY);
}

function drawTimeGrid(pdf: jsPDF) {
  const { margin, timeColumnWidth, eventColumnWidth, timeSlotHeight } = DAILY_CONFIG;
  const gridStartY = margin + DAILY_CONFIG.headerHeight;
  
  // Headers
  pdf.setFillColor(...DAILY_CONFIG.colors.lightGray);
  pdf.rect(margin, gridStartY, timeColumnWidth, 20, 'F');
  pdf.rect(margin + timeColumnWidth, gridStartY, eventColumnWidth, 20, 'F');
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...DAILY_CONFIG.colors.black);
  pdf.text('TIME', margin + timeColumnWidth / 2, gridStartY + 13, { align: 'center' });
  pdf.text('APPOINTMENTS', margin + timeColumnWidth + eventColumnWidth / 2, gridStartY + 13, { align: 'center' });
  
  // Time slots
  TIME_SLOTS.forEach((timeSlot, index) => {
    const y = gridStartY + 20 + (index * timeSlotHeight);
    const isHour = timeSlot.endsWith(':00');
    
    // Time column
    pdf.setFillColor(...(isHour ? DAILY_CONFIG.colors.lightGray : DAILY_CONFIG.colors.white));
    pdf.rect(margin, y, timeColumnWidth, timeSlotHeight, 'F');
    
    pdf.setFontSize(DAILY_CONFIG.fonts.timeLabel);
    pdf.setFont('helvetica', isHour ? 'bold' : 'normal');
    pdf.setTextColor(...DAILY_CONFIG.colors.black);
    pdf.text(timeSlot, margin + timeColumnWidth / 2, y + timeSlotHeight / 2 + 3, { align: 'center' });
    
    // Event column
    pdf.setFillColor(...DAILY_CONFIG.colors.white);
    pdf.rect(margin + timeColumnWidth, y, eventColumnWidth, timeSlotHeight, 'F');
    
    // Grid lines
    pdf.setLineWidth(0.5);
    pdf.setDrawColor(...DAILY_CONFIG.colors.gray);
    pdf.line(margin, y + timeSlotHeight, margin + timeColumnWidth + eventColumnWidth, y + timeSlotHeight);
  });
  
  // Vertical separator
  pdf.setLineWidth(1);
  pdf.setDrawColor(...DAILY_CONFIG.colors.black);
  pdf.line(margin + timeColumnWidth, gridStartY, margin + timeColumnWidth, gridStartY + 20 + (TIME_SLOTS.length * timeSlotHeight));
  
  // Outer border
  pdf.rect(margin, gridStartY, timeColumnWidth + eventColumnWidth, 20 + (TIME_SLOTS.length * timeSlotHeight));
}

function drawEvents(pdf: jsPDF, selectedDate: Date, events: CalendarEvent[]) {
  const { margin, timeColumnWidth, eventColumnWidth, timeSlotHeight } = DAILY_CONFIG;
  const gridStartY = margin + DAILY_CONFIG.headerHeight + 20;
  
  // Filter events for selected date
  const dayEvents = events.filter(event => {
    const eventDate = new Date(event.startTime);
    return eventDate.toDateString() === selectedDate.toDateString();
  }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  
  console.log(`Drawing ${dayEvents.length} events for ${selectedDate.toDateString()}`);
  
  dayEvents.forEach((event, index) => {
    const eventDate = new Date(event.startTime);
    const endDate = new Date(event.endTime);
    
    // Calculate position
    const startHour = eventDate.getHours();
    const startMinute = eventDate.getMinutes();
    const minutesSince6am = (startHour - 6) * 60 + startMinute;
    
    if (minutesSince6am < 0 || minutesSince6am > (17.5 * 60)) {
      console.log(`Event ${event.title} outside time range, skipping`);
      return;
    }
    
    const slotsFromStart = minutesSince6am / 30;
    const topPosition = slotsFromStart * timeSlotHeight;
    
    // Calculate duration
    const durationMinutes = (endDate.getTime() - eventDate.getTime()) / (1000 * 60);
    const eventHeight = Math.max(30, (durationMinutes / 30) * timeSlotHeight);
    
    const eventX = margin + timeColumnWidth + 3;
    const eventY = gridStartY + topPosition;
    const eventWidth = eventColumnWidth - 6;
    
    console.log(`Event: ${event.title}, Position: ${eventX}, ${eventY}, Size: ${eventWidth}x${eventHeight}`);
    
    // Get event type and style accordingly
    const { isSimplePractice, isGoogle, isHoliday } = getEventType(event);
    
    // Draw background
    pdf.setFillColor(...DAILY_CONFIG.colors.white);
    pdf.rect(eventX, eventY, eventWidth, eventHeight, 'F');
    
    // Draw border based on type
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
    
    // Event text
    let currentY = eventY + 12;
    const textPadding = 6;
    
    // Title
    let title = event.title || 'Untitled Event';
    if (title.endsWith(' Appointment')) {
      title = title.slice(0, -12);
    }
    
    pdf.setFontSize(DAILY_CONFIG.fonts.eventTitle);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...DAILY_CONFIG.colors.black);
    pdf.text(title, eventX + textPadding, currentY);
    currentY += 14;
    
    // Source
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
      currentY += 12;
    }
    
    // Time
    if (currentY + 10 < eventY + eventHeight) {
      pdf.setFontSize(DAILY_CONFIG.fonts.eventDetails);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...DAILY_CONFIG.colors.black);
      
      const timeRange = `${formatTime(eventDate)} - ${formatTime(endDate)}`;
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
    
  } catch (error) {
    console.error('Daily PDF export failed:', error);
    throw error;
  }
};
