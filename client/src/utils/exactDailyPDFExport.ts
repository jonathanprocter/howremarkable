import jsPDF from 'jspdf';
import { CalendarEvent } from '../types/calendar';

// Match the exact dashboard layout
const DAILY_CONFIG = {
  pageWidth: 595,
  pageHeight: 842,
  margin: 40,
  timeColumnWidth: 80,
  appointmentColumnWidth: 450,
  timeSlotHeight: 20,
  headerHeight: 120,

  // Typography matching dashboard
  fonts: {
    title: { size: 20, weight: 'bold' },
    date: { size: 14, weight: 'normal' },
    stats: { size: 12, weight: 'normal' },
    timeLabels: { size: 9, weight: 'normal' },
    eventTitle: { size: 10, weight: 'bold' },
    eventSource: { size: 8, weight: 'normal' },
    eventTime: { size: 10, weight: 'bold' },
    eventNotes: { size: 8, weight: 'normal' }
  },

  // Colors matching dashboard
  colors: {
    black: [0, 0, 0],
    gray: [100, 100, 100],
    lightGray: [240, 240, 240],
    mediumGray: [150, 150, 150],
    veryLightGray: [248, 248, 248],
    white: [255, 255, 255],
    simplePracticeBlue: [100, 149, 237],
    googleGreen: [52, 168, 83],
    holidayOrange: [255, 152, 0],
    holidayYellow: [251, 188, 4]
  }
};

// Time slots exactly matching dashboard (6:00 to 23:30)
const TIME_SLOTS = [
  '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30',
  '22:00', '22:30', '23:00', '23:30'
];

function getEventTypeInfo(event: CalendarEvent) {
  const isSimplePractice = event.source === 'simplepractice' || 
                           event.notes?.toLowerCase().includes('simple practice') ||
                           event.title?.toLowerCase().includes('simple practice') ||
                           event.description?.toLowerCase().includes('simple practice') ||
                           event.title?.toLowerCase().includes('appointment');

  const isHoliday = event.title.toLowerCase().includes('holiday') ||
                   event.calendarId === 'en.usa#holiday@group.v.calendar.google.com';

  const isGoogle = event.source === 'google' && !isSimplePractice && !isHoliday;

  return { isSimplePractice, isGoogle, isHoliday };
}

function drawDashboardHeader(pdf: jsPDF, selectedDate: Date, events: CalendarEvent[]) {
  const { margin, pageWidth } = DAILY_CONFIG;

  // Title
  pdf.setFontSize(DAILY_CONFIG.fonts.title.size);
  pdf.setFont('helvetica', DAILY_CONFIG.fonts.title.weight);
  pdf.setTextColor(...DAILY_CONFIG.colors.black);
  pdf.text('Daily Planner', pageWidth / 2, margin + 20, { align: 'center' });

  // Date
  pdf.setFontSize(DAILY_CONFIG.fonts.date.size);
  pdf.setFont('helvetica', DAILY_CONFIG.fonts.date.weight);
  const dateStr = selectedDate.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  pdf.text(dateStr, pageWidth / 2, margin + 40, { align: 'center' });

  // Statistics - exactly like dashboard
  const totalEvents = events.length;
  const totalHours = events.reduce((sum, event) => {
    return sum + (new Date(event.endTime).getTime() - new Date(event.startTime).getTime()) / (1000 * 60 * 60);
  }, 0);
  const availableHours = 24 - totalHours;
  const freeTimePercentage = Math.round((availableHours / 24) * 100);

  pdf.setFontSize(DAILY_CONFIG.fonts.stats.size);
  pdf.setFont('helvetica', DAILY_CONFIG.fonts.stats.weight);
  
  const statsY = margin + 60;
  const statsSpacing = 120;
  
  // Appointments
  pdf.text(`${totalEvents}`, margin + 80, statsY, { align: 'center' });
  pdf.text('Appointments', margin + 80, statsY + 15, { align: 'center' });
  
  // Scheduled
  pdf.text(`${totalHours.toFixed(1)}h`, margin + 80 + statsSpacing, statsY, { align: 'center' });
  pdf.text('Scheduled', margin + 80 + statsSpacing, statsY + 15, { align: 'center' });
  
  // Available
  pdf.text(`${availableHours.toFixed(1)}h`, margin + 80 + statsSpacing * 2, statsY, { align: 'center' });
  pdf.text('Available', margin + 80 + statsSpacing * 2, statsY + 15, { align: 'center' });
  
  // Free Time
  pdf.text(`${freeTimePercentage}%`, margin + 80 + statsSpacing * 3, statsY, { align: 'center' });
  pdf.text('Free Time', margin + 80 + statsSpacing * 3, statsY + 15, { align: 'center' });
}

function drawDashboardLegend(pdf: jsPDF) {
  const { margin, pageWidth } = DAILY_CONFIG;
  const legendY = margin + 100;
  
  pdf.setFontSize(DAILY_CONFIG.fonts.stats.size);
  pdf.setFont('helvetica', DAILY_CONFIG.fonts.stats.weight);
  
  // SimplePractice
  pdf.setFillColor(...DAILY_CONFIG.colors.white);
  pdf.setDrawColor(...DAILY_CONFIG.colors.simplePracticeBlue);
  pdf.rect(margin + 40, legendY, 12, 8, 'FD');
  pdf.setFillColor(...DAILY_CONFIG.colors.simplePracticeBlue);
  pdf.rect(margin + 40, legendY, 4, 8, 'F');
  pdf.text('SimplePractice', margin + 60, legendY + 6);
  
  // Google Calendar
  pdf.setFillColor(...DAILY_CONFIG.colors.white);
  pdf.setDrawColor(...DAILY_CONFIG.colors.googleGreen);
  pdf.setLineDash([2, 2]);
  pdf.rect(margin + 180, legendY, 12, 8, 'FD');
  pdf.setLineDash([]);
  pdf.text('Google Calendar', margin + 200, legendY + 6);
  
  // Holidays
  pdf.setFillColor(...DAILY_CONFIG.colors.white);
  pdf.setDrawColor(...DAILY_CONFIG.colors.holidayOrange);
  pdf.rect(margin + 340, legendY, 12, 8, 'FD');
  pdf.text('Holidays in United States', margin + 360, legendY + 6);
}

function drawDashboardGrid(pdf: jsPDF, selectedDate: Date, events: CalendarEvent[]) {
  const { margin, timeColumnWidth, appointmentColumnWidth, timeSlotHeight } = DAILY_CONFIG;
  const gridStartY = margin + 130;
  
  // Filter events for the selected date
  const dayEvents = events.filter(event => {
    const eventDate = new Date(event.startTime);
    return eventDate.toDateString() === selectedDate.toDateString();
  });
  
  // Filter out all-day events from timeline
  const timedEvents = dayEvents.filter(event => {
    const isMarkedAllDay = (event as any).isAllDay;
    const duration = event.endTime.getTime() - event.startTime.getTime();
    const hours = duration / (1000 * 60 * 60);
    const startHour = event.startTime.getHours();
    const startMinute = event.startTime.getMinutes();
    const isFullDay = startHour === 0 && startMinute === 0 && (hours === 24 || hours % 24 === 0);
    return !(isMarkedAllDay || isFullDay || hours >= 20);
  });

  // Draw time slots
  TIME_SLOTS.forEach((timeSlot, index) => {
    const y = gridStartY + (index * timeSlotHeight);
    const isHour = timeSlot.endsWith(':00');
    
    // Time slot background
    if (isHour) {
      pdf.setFillColor(...DAILY_CONFIG.colors.lightGray);
    } else {
      pdf.setFillColor(...DAILY_CONFIG.colors.veryLightGray);
    }
    pdf.rect(margin, y, timeColumnWidth + appointmentColumnWidth, timeSlotHeight, 'F');
    
    // Time label
    pdf.setFontSize(isHour ? DAILY_CONFIG.fonts.timeLabels.size : DAILY_CONFIG.fonts.timeLabels.size - 1);
    pdf.setFont('helvetica', DAILY_CONFIG.fonts.timeLabels.weight);
    pdf.setTextColor(...DAILY_CONFIG.colors.black);
    pdf.text(timeSlot, margin + 10, y + 14);
    
    // Grid lines
    pdf.setDrawColor(...DAILY_CONFIG.colors.mediumGray);
    pdf.setLineWidth(0.5);
    pdf.line(margin, y, margin + timeColumnWidth + appointmentColumnWidth, y);
  });
  
  // Draw vertical separator
  pdf.setDrawColor(...DAILY_CONFIG.colors.mediumGray);
  pdf.setLineWidth(1);
  pdf.line(margin + timeColumnWidth, gridStartY, margin + timeColumnWidth, gridStartY + (TIME_SLOTS.length * timeSlotHeight));
  
  // Draw events exactly like dashboard
  timedEvents.forEach(event => {
    const eventStart = new Date(event.startTime);
    const eventEnd = new Date(event.endTime);
    const durationMinutes = (eventEnd.getTime() - eventStart.getTime()) / (1000 * 60);
    
    // Calculate position exactly like dashboard
    const startHour = eventStart.getHours();
    const startMinute = eventStart.getMinutes();
    const minutesSince6am = (startHour - 6) * 60 + startMinute;
    const slotsFromStart = minutesSince6am / 30;
    const topPosition = gridStartY + (slotsFromStart * timeSlotHeight);
    
    // Calculate height exactly like dashboard
    const height = Math.max(56, (durationMinutes / 30) * timeSlotHeight - 4);
    
    // Event styling based on type
    const eventType = getEventTypeInfo(event);
    
    // Draw event background
    pdf.setFillColor(...DAILY_CONFIG.colors.white);
    pdf.rect(margin + timeColumnWidth + 5, topPosition, appointmentColumnWidth - 10, height, 'F');
    
    // Draw event borders
    if (eventType.isSimplePractice) {
      pdf.setDrawColor(...DAILY_CONFIG.colors.simplePracticeBlue);
      pdf.setLineWidth(1);
      pdf.rect(margin + timeColumnWidth + 5, topPosition, appointmentColumnWidth - 10, height, 'D');
      pdf.setFillColor(...DAILY_CONFIG.colors.simplePracticeBlue);
      pdf.rect(margin + timeColumnWidth + 5, topPosition, 4, height, 'F');
    } else if (eventType.isGoogle) {
      pdf.setDrawColor(...DAILY_CONFIG.colors.googleGreen);
      pdf.setLineWidth(1);
      pdf.setLineDash([2, 2]);
      pdf.rect(margin + timeColumnWidth + 5, topPosition, appointmentColumnWidth - 10, height, 'D');
      pdf.setLineDash([]);
    } else {
      pdf.setDrawColor(...DAILY_CONFIG.colors.holidayOrange);
      pdf.setLineWidth(1);
      pdf.rect(margin + timeColumnWidth + 5, topPosition, appointmentColumnWidth - 10, height, 'D');
    }
    
    // Draw event content in 3-column layout exactly like dashboard
    const eventX = margin + timeColumnWidth + 10;
    const eventY = topPosition + 12;
    const columnWidth = (appointmentColumnWidth - 20) / 3;
    
    // Left column: Event title, calendar, and time
    pdf.setFontSize(DAILY_CONFIG.fonts.eventTitle.size);
    pdf.setFont('helvetica', DAILY_CONFIG.fonts.eventTitle.weight);
    pdf.setTextColor(...DAILY_CONFIG.colors.black);
    pdf.text(event.title, eventX, eventY);
    
    pdf.setFontSize(DAILY_CONFIG.fonts.eventSource.size);
    pdf.setFont('helvetica', DAILY_CONFIG.fonts.eventSource.weight);
    pdf.text(`${event.source} calendar`, eventX, eventY + 12);
    
    pdf.setFontSize(DAILY_CONFIG.fonts.eventTime.size);
    pdf.setFont('helvetica', DAILY_CONFIG.fonts.eventTime.weight);
    const timeStr = `${eventStart.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}-${eventEnd.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}`;
    pdf.text(timeStr, eventX, eventY + 24);
    
    // Center column: Event Notes (if they exist)
    if (event.notes) {
      pdf.setFontSize(DAILY_CONFIG.fonts.eventNotes.size);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Event Notes', eventX + columnWidth, eventY);
      
      pdf.setFont('helvetica', DAILY_CONFIG.fonts.eventNotes.weight);
      const notes = event.notes.split('\n')
        .filter(note => note.trim().length > 0)
        .map(note => note.trim().replace(/^[•\s-]+/, '').trim())
        .filter(note => note.length > 0 && note !== '•' && note !== '-');
      
      notes.forEach((note, index) => {
        pdf.text(`• ${note}`, eventX + columnWidth, eventY + 12 + (index * 10));
      });
    }
    
    // Right column: Action Items (if they exist)
    if (event.actionItems) {
      pdf.setFontSize(DAILY_CONFIG.fonts.eventNotes.size);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Action Items', eventX + columnWidth * 2, eventY);
      
      pdf.setFont('helvetica', DAILY_CONFIG.fonts.eventNotes.weight);
      const actionItems = event.actionItems.split('\n')
        .filter(item => item.trim().length > 0)
        .map(item => item.trim().replace(/^[•\s-]+/, '').trim())
        .filter(item => item.length > 0 && item !== '•' && item !== '-');
      
      actionItems.forEach((item, index) => {
        pdf.text(`• ${item}`, eventX + columnWidth * 2, eventY + 12 + (index * 10));
      });
    }
  });
}

export const exportExactDailyPDF = async (
  selectedDate: Date,
  events: CalendarEvent[]
): Promise<void> => {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4'
  });

  console.log(`=== EXACT DAILY PDF EXPORT ===`);
  console.log(`Date: ${selectedDate.toDateString()}`);
  console.log(`Total events: ${events.length}`);

  // Filter events for selected date
  const dayEvents = events.filter(event => {
    const eventDate = new Date(event.startTime);
    return eventDate.toDateString() === selectedDate.toDateString();
  });

  console.log(`Day events: ${dayEvents.length}`);

  // Draw exactly what the dashboard shows
  drawDashboardHeader(pdf, selectedDate, dayEvents);
  drawDashboardLegend(pdf);
  drawDashboardGrid(pdf, selectedDate, events);

  // Save PDF
  const fileName = `daily-planner-${selectedDate.toISOString().split('T')[0]}.pdf`;
  pdf.save(fileName);

  console.log(`PDF saved as: ${fileName}`);
};