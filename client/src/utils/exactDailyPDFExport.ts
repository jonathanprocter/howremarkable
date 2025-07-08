import jsPDF from 'jspdf';
import { CalendarEvent } from '../types/calendar';

// Match the exact dashboard layout
const DAILY_CONFIG = {
  pageWidth: 595,
  pageHeight: 842,
  margin: 20,  // Reduced from 40 to move left
  timeColumnWidth: 80,
  appointmentColumnWidth: 450,
  timeSlotHeight: 20,
  headerHeight: 100,  // Reduced from 120 to move up

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

  // Title - moved up
  pdf.setFontSize(DAILY_CONFIG.fonts.title.size);
  pdf.setFont('helvetica', DAILY_CONFIG.fonts.title.weight);
  pdf.setTextColor(...DAILY_CONFIG.colors.black);
  pdf.text('Daily Planner', pageWidth / 2, margin + 15, { align: 'center' });

  // Date - moved up
  pdf.setFontSize(DAILY_CONFIG.fonts.date.size);
  pdf.setFont('helvetica', DAILY_CONFIG.fonts.date.weight);
  const dateStr = selectedDate.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  pdf.text(dateStr, pageWidth / 2, margin + 35, { align: 'center' });

  // Statistics - moved up and left
  const totalEvents = events.length;
  const totalHours = events.reduce((sum, event) => {
    return sum + (new Date(event.endTime).getTime() - new Date(event.startTime).getTime()) / (1000 * 60 * 60);
  }, 0);
  const availableHours = 24 - totalHours;
  const freeTimePercentage = Math.round((availableHours / 24) * 100);

  pdf.setFontSize(DAILY_CONFIG.fonts.stats.size);
  pdf.setFont('helvetica', DAILY_CONFIG.fonts.stats.weight);
  
  const statsY = margin + 55;  // Moved up
  const statsSpacing = 110;    // Slightly reduced spacing
  
  // Appointments
  pdf.text(`${totalEvents}`, margin + 70, statsY, { align: 'center' });
  pdf.text('Appointments', margin + 70, statsY + 15, { align: 'center' });
  
  // Scheduled
  pdf.text(`${totalHours.toFixed(1)}h`, margin + 70 + statsSpacing, statsY, { align: 'center' });
  pdf.text('Scheduled', margin + 70 + statsSpacing, statsY + 15, { align: 'center' });
  
  // Available
  pdf.text(`${availableHours.toFixed(1)}h`, margin + 70 + statsSpacing * 2, statsY, { align: 'center' });
  pdf.text('Available', margin + 70 + statsSpacing * 2, statsY + 15, { align: 'center' });
  
  // Free Time
  pdf.text(`${freeTimePercentage}%`, margin + 70 + statsSpacing * 3, statsY, { align: 'center' });
  pdf.text('Free Time', margin + 70 + statsSpacing * 3, statsY + 15, { align: 'center' });
}

function drawDashboardLegend(pdf: jsPDF) {
  const { margin, pageWidth } = DAILY_CONFIG;
  const legendY = margin + 80;  // Moved up
  
  pdf.setFontSize(DAILY_CONFIG.fonts.stats.size);
  pdf.setFont('helvetica', DAILY_CONFIG.fonts.stats.weight);
  
  // SimplePractice - moved left
  pdf.setFillColor(...DAILY_CONFIG.colors.white);
  pdf.setDrawColor(...DAILY_CONFIG.colors.simplePracticeBlue);
  pdf.rect(margin + 30, legendY, 12, 8, 'FD');
  pdf.setFillColor(...DAILY_CONFIG.colors.simplePracticeBlue);
  pdf.rect(margin + 30, legendY, 4, 8, 'F');
  pdf.text('SimplePractice', margin + 50, legendY + 6);
  
  // Google Calendar - moved left
  pdf.setFillColor(...DAILY_CONFIG.colors.white);
  pdf.setDrawColor(...DAILY_CONFIG.colors.googleGreen);
  pdf.setLineDash([2, 2]);
  pdf.rect(margin + 160, legendY, 12, 8, 'FD');
  pdf.setLineDash([]);
  pdf.text('Google Calendar', margin + 180, legendY + 6);
  
  // Holidays - moved left
  pdf.setFillColor(...DAILY_CONFIG.colors.white);
  pdf.setDrawColor(...DAILY_CONFIG.colors.holidayOrange);
  pdf.rect(margin + 310, legendY, 12, 8, 'FD');
  pdf.text('Holidays in United States', margin + 330, legendY + 6);
}

function drawDashboardGrid(pdf: jsPDF, selectedDate: Date, events: CalendarEvent[]) {
  const { margin, timeColumnWidth, appointmentColumnWidth, timeSlotHeight } = DAILY_CONFIG;
  const gridStartY = margin + 105;  // Moved up from 130 to 105
  
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

  // Draw time slots exactly like dashboard
  TIME_SLOTS.forEach((timeSlot, index) => {
    const y = gridStartY + (index * timeSlotHeight);
    const isHour = timeSlot.endsWith(':00');
    
    // Time slot background - match dashboard exactly
    if (isHour) {
      pdf.setFillColor(...DAILY_CONFIG.colors.lightGray);  // Gray for top of hour (hour marks)
    } else {
      pdf.setFillColor(...DAILY_CONFIG.colors.white);  // White for bottom of hour (30-minute marks)
    }
    pdf.rect(margin, y, timeColumnWidth + appointmentColumnWidth, timeSlotHeight, 'F');
    
    // Time label - match dashboard font sizes
    pdf.setFontSize(isHour ? 9 : 8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...DAILY_CONFIG.colors.black);
    pdf.text(timeSlot, margin + 8, y + 14);
    
    // Grid lines - subtle like dashboard
    pdf.setDrawColor(...DAILY_CONFIG.colors.mediumGray);
    pdf.setLineWidth(0.5);
    pdf.line(margin, y, margin + timeColumnWidth + appointmentColumnWidth, y);
  });
  
  // Draw vertical separator between time and appointments
  pdf.setDrawColor(...DAILY_CONFIG.colors.mediumGray);
  pdf.setLineWidth(1);
  pdf.line(margin + timeColumnWidth, gridStartY, margin + timeColumnWidth, gridStartY + (TIME_SLOTS.length * timeSlotHeight));
  
  // Draw events exactly like dashboard with precise positioning
  timedEvents.forEach(event => {
    const eventStart = new Date(event.startTime);
    const eventEnd = new Date(event.endTime);
    const durationMinutes = (eventEnd.getTime() - eventStart.getTime()) / (1000 * 60);
    
    // Calculate position exactly like dashboard CSS Grid
    const startHour = eventStart.getHours();
    const startMinute = eventStart.getMinutes();
    const minutesSince6am = (startHour - 6) * 60 + startMinute;
    const slotsFromStart = minutesSince6am / 30;
    const topPosition = gridStartY + (slotsFromStart * timeSlotHeight);
    
    // Calculate height based on duration - match dashboard exactly
    const height = Math.max(56, (durationMinutes / 30) * timeSlotHeight - 4);
    
    // Event styling based on type
    const eventType = getEventTypeInfo(event);
    
    // Draw event background - always white like dashboard
    pdf.setFillColor(...DAILY_CONFIG.colors.white);
    pdf.rect(margin + timeColumnWidth + 2, topPosition, appointmentColumnWidth - 4, height, 'F');
    
    // Draw event borders based on type - match dashboard styling
    if (eventType.isSimplePractice) {
      // SimplePractice: cornflower blue border with thick left flag
      pdf.setDrawColor(...DAILY_CONFIG.colors.simplePracticeBlue);
      pdf.setLineWidth(1);
      pdf.rect(margin + timeColumnWidth + 2, topPosition, appointmentColumnWidth - 4, height, 'D');
      // Thick left flag
      pdf.setFillColor(...DAILY_CONFIG.colors.simplePracticeBlue);
      pdf.rect(margin + timeColumnWidth + 2, topPosition, 4, height, 'F');
    } else if (eventType.isGoogle) {
      // Google Calendar: dashed green border
      pdf.setDrawColor(...DAILY_CONFIG.colors.googleGreen);
      pdf.setLineWidth(1);
      pdf.setLineDash([2, 2]);
      pdf.rect(margin + timeColumnWidth + 2, topPosition, appointmentColumnWidth - 4, height, 'D');
      pdf.setLineDash([]);
    } else {
      // Holiday: orange border
      pdf.setDrawColor(...DAILY_CONFIG.colors.holidayOrange);
      pdf.setLineWidth(1);
      pdf.rect(margin + timeColumnWidth + 2, topPosition, appointmentColumnWidth - 4, height, 'D');
    }
    
    // Draw event content in 3-column layout exactly like dashboard
    const eventX = margin + timeColumnWidth + 8;
    const eventY = topPosition + 12;
    const columnWidth = (appointmentColumnWidth - 16) / 3;
    
    // Left column: Event title, calendar source, and time
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...DAILY_CONFIG.colors.black);
    
    // Clean title - remove "Appointment" suffix like dashboard
    let cleanTitle = event.title;
    if (cleanTitle.endsWith(' Appointment')) {
      cleanTitle = cleanTitle.replace(' Appointment', '');
    }
    pdf.text(cleanTitle, eventX, eventY);
    
    // Source line
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`${event.source} calendar`, eventX, eventY + 12);
    
    // Time range - bold like dashboard
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    const timeStr = `${eventStart.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}-${eventEnd.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}`;
    pdf.text(timeStr, eventX, eventY + 24);
    
    // Center column: Event Notes (if they exist)
    if (event.notes && event.notes.trim()) {
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Event Notes', eventX + columnWidth, eventY);
      
      pdf.setFont('helvetica', 'normal');
      const notes = event.notes.split('\n')
        .filter(note => note.trim().length > 0)
        .map(note => note.trim().replace(/^[•\s-]+/, '').trim())
        .filter(note => note.length > 0 && note !== '•' && note !== '-');
      
      notes.forEach((note, index) => {
        pdf.text(`• ${note}`, eventX + columnWidth, eventY + 12 + (index * 10));
      });
    }
    
    // Right column: Action Items (if they exist)
    if (event.actionItems && event.actionItems.trim()) {
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Action Items', eventX + columnWidth * 2, eventY);
      
      pdf.setFont('helvetica', 'normal');
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