
import jsPDF from 'jspdf';
import { CalendarEvent } from '../types/calendar';

// Configuration that matches the daily view exactly
const DAILY_CONFIG = {
  pageWidth: 595,
  pageHeight: 842,
  margin: 40,
  timeColumnWidth: 80,
  appointmentColumnWidth: 450,
  timeSlotHeight: 20,
  headerHeight: 120,

  // Typography - match daily view exactly
  fonts: {
    title: { size: 20, weight: 'bold' },
    date: { size: 14, weight: 'normal' },
    stats: { size: 12, weight: 'normal' },
    timeLabels: { size: 9, weight: 'normal' },
    eventTitle: { size: 10, weight: 'bold' },
    eventSource: { size: 8, weight: 'normal' },
    eventTime: { size: 9, weight: 'bold' },
    eventNotes: { size: 8, weight: 'normal' }
  },

  // Colors - match daily view exactly
  colors: {
    black: [0, 0, 0],
    gray: [100, 100, 100],
    lightGray: [240, 240, 240], // #f0f0f0 for hour rows
    mediumGray: [150, 150, 150],
    veryLightGray: [248, 248, 248], // #f8f8f8 for half-hour rows
    white: [255, 255, 255],
    simplePracticeBlue: [66, 133, 244],
    googleGreen: [52, 168, 83],
    holidayOrange: [255, 152, 0],
    holidayYellow: [251, 188, 4]
  }
};

// Time slots exactly matching daily view (6:00 to 23:30)
const TIME_SLOTS = [
  '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30',
  '22:00', '22:30', '23:00', '23:30'
];

// Time slots with isHour property for grid display
const TIME_SLOTS_WITH_HOUR = TIME_SLOTS.map(time => ({
  time,
  isHour: time.endsWith(':00')
}));

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

function drawDailyHeader(pdf: jsPDF, selectedDate: Date, events: CalendarEvent[]) {
  const { margin, pageWidth } = DAILY_CONFIG;

  // Header background
  pdf.setFillColor(...DAILY_CONFIG.colors.white);
  pdf.rect(margin, margin, pageWidth - (margin * 2), DAILY_CONFIG.headerHeight, 'F');

  // Title
  pdf.setFontSize(DAILY_CONFIG.fonts.title.size);
  pdf.setFont('helvetica', DAILY_CONFIG.fonts.title.weight);
  pdf.setTextColor(...DAILY_CONFIG.colors.black);
  pdf.text('DAILY PLANNER', pageWidth / 2, margin + 30, { align: 'center' });

  // Date
  pdf.setFontSize(DAILY_CONFIG.fonts.date.size);
  pdf.setFont('helvetica', DAILY_CONFIG.fonts.date.weight);
  const dateStr = selectedDate.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  pdf.text(dateStr, pageWidth / 2, margin + 50, { align: 'center' });

  // Statistics
  const totalEvents = events.length;
  const totalHours = events.reduce((sum, event) => {
    return sum + (new Date(event.endTime).getTime() - new Date(event.startTime).getTime()) / (1000 * 60 * 60);
  }, 0);
  const availableHours = 24 - totalHours;
  const freeTimePercentage = Math.round((availableHours / 24) * 100);

  pdf.setFontSize(DAILY_CONFIG.fonts.stats.size);
  pdf.setFont('helvetica', DAILY_CONFIG.fonts.stats.weight);

  // Stats positioning
  const statsY = margin + 75;
  const statsSpacing = 80;
  let statsX = pageWidth / 2 - 120;

  // Total events
  pdf.text(totalEvents.toString(), statsX, statsY, { align: 'center' });
  pdf.text('Total', statsX, statsY + 15, { align: 'center' });

  // Hours scheduled
  statsX += statsSpacing;
  pdf.text(totalHours.toFixed(1) + 'h', statsX, statsY, { align: 'center' });
  pdf.text('Scheduled', statsX, statsY + 15, { align: 'center' });

  // Available hours
  statsX += statsSpacing;
  pdf.text(availableHours.toFixed(1) + 'h', statsX, statsY, { align: 'center' });
  pdf.text('Available', statsX, statsY + 15, { align: 'center' });

  // Free time percentage
  statsX += statsSpacing;
  pdf.text(freeTimePercentage + '%', statsX, statsY, { align: 'center' });
  pdf.text('Free Time', statsX, statsY + 15, { align: 'center' });

  // Legend
  const legendY = margin + 105;
  let legendX = pageWidth / 2 - 150;

  // SimplePractice
  pdf.setFillColor(...DAILY_CONFIG.colors.white);
  pdf.rect(legendX, legendY - 5, 10, 8, 'F');
  pdf.setDrawColor(...DAILY_CONFIG.colors.simplePracticeBlue);
  pdf.setLineWidth(1);
  pdf.rect(legendX, legendY - 5, 10, 8);
  pdf.setLineWidth(3);
  pdf.line(legendX, legendY - 5, legendX, legendY + 3);
  pdf.text('SimplePractice', legendX + 15, legendY);

  // Google Calendar
  legendX += 100;
  pdf.setFillColor(...DAILY_CONFIG.colors.white);
  pdf.rect(legendX, legendY - 5, 10, 8, 'F');
  pdf.setDrawColor(...DAILY_CONFIG.colors.googleGreen);
  pdf.setLineWidth(1);
  pdf.setLineDash([2, 1]);
  pdf.rect(legendX, legendY - 5, 10, 8);
  pdf.setLineDash([]);
  pdf.text('Google Calendar', legendX + 15, legendY);

  // Holidays
  legendX += 100;
  pdf.setFillColor(...DAILY_CONFIG.colors.holidayYellow);
  pdf.rect(legendX, legendY - 5, 10, 8, 'F');
  pdf.setDrawColor(...DAILY_CONFIG.colors.holidayOrange);
  pdf.setLineWidth(1);
  pdf.rect(legendX, legendY - 5, 10, 8);
  pdf.text('Holidays in United States', legendX + 15, legendY);

  // Header bottom line
  pdf.setLineWidth(1);
  pdf.setDrawColor(...DAILY_CONFIG.colors.black);
  pdf.line(margin, margin + DAILY_CONFIG.headerHeight, pageWidth - margin, margin + DAILY_CONFIG.headerHeight);
}

function drawTimeGrid(pdf: jsPDF) {
  const { margin, timeColumnWidth, appointmentColumnWidth, timeSlotHeight } = DAILY_CONFIG;
  const gridStartY = margin + DAILY_CONFIG.headerHeight;
  const headerHeight = 25;

  // Column headers - black background like dashboard
  pdf.setFillColor(...DAILY_CONFIG.colors.black);
  pdf.setDrawColor(...DAILY_CONFIG.colors.black);
  pdf.setLineWidth(1);

  // TIME header
  pdf.rect(margin, gridStartY, timeColumnWidth, headerHeight, 'FD');
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...DAILY_CONFIG.colors.white);
  pdf.text('TIME', margin + timeColumnWidth / 2, gridStartY + 15, { align: 'center' });

  // APPOINTMENTS header
  const dayX = margin + timeColumnWidth;
  pdf.rect(dayX, gridStartY, appointmentColumnWidth, headerHeight, 'FD');
  pdf.text('APPOINTMENTS', dayX + appointmentColumnWidth / 2, gridStartY + 15, { align: 'center' });

  // Time slots - match dashboard exactly
  TIME_SLOTS_WITH_HOUR.forEach((slot, index) => {
    const y = gridStartY + headerHeight + (index * timeSlotHeight);

    // Time cell - gray for hours, light gray for half-hours
    const bgColor = slot.isHour ? DAILY_CONFIG.colors.lightGray : DAILY_CONFIG.colors.veryLightGray;
    pdf.setFillColor(...bgColor);
    pdf.rect(margin, y, timeColumnWidth, timeSlotHeight, 'F');

    // Time text
    pdf.setFontSize(DAILY_CONFIG.fonts.timeLabels.size);
    pdf.setFont('helvetica', slot.isHour ? 'bold' : 'normal');
    pdf.setTextColor(...DAILY_CONFIG.colors.black);
    pdf.text(slot.time, margin + timeColumnWidth / 2, y + timeSlotHeight / 2 + 3, { align: 'center' });

    // Appointment cell - white background
    pdf.setFillColor(...DAILY_CONFIG.colors.white);
    pdf.rect(dayX, y, appointmentColumnWidth, timeSlotHeight, 'F');

    // Grid lines - match dashboard styling
    pdf.setLineWidth(0.5);
    pdf.setDrawColor(...DAILY_CONFIG.colors.lightGray);
    pdf.line(margin, y + timeSlotHeight, margin + timeColumnWidth + appointmentColumnWidth, y + timeSlotHeight);
  });

  // Vertical grid lines
  pdf.setLineWidth(1);
  pdf.setDrawColor(...DAILY_CONFIG.colors.black);
  pdf.line(margin + timeColumnWidth, gridStartY, margin + timeColumnWidth, gridStartY + headerHeight + (TIME_SLOTS_WITH_HOUR.length * timeSlotHeight));

  // Outer border
  pdf.rect(margin, gridStartY, timeColumnWidth + appointmentColumnWidth, headerHeight + (TIME_SLOTS_WITH_HOUR.length * timeSlotHeight));
}

function drawAppointments(pdf: jsPDF, selectedDate: Date, events: CalendarEvent[]) {
  const { margin, timeColumnWidth, appointmentColumnWidth, timeSlotHeight } = DAILY_CONFIG;
  const gridStartY = margin + DAILY_CONFIG.headerHeight + 25; // Add header height

  events.forEach((event, index) => {
    console.log(`\n=== Drawing Event ${index + 1}: ${event.title} ===`);

    const eventDate = new Date(event.startTime);
    const endDate = new Date(event.endTime);

    // Calculate position exactly like dashboard
    const startHour = eventDate.getHours();
    const startMinute = eventDate.getMinutes();
    const minutesSince6am = (startHour - 6) * 60 + startMinute;
    const slotsFromStart = minutesSince6am / 30;
    const topPosition = Math.max(0, slotsFromStart * timeSlotHeight);

    // Calculate duration
    const durationMinutes = (endDate.getTime() - eventDate.getTime()) / (1000 * 60);
    const eventHeight = Math.max(40, (durationMinutes / 30) * timeSlotHeight - 2);

    // Skip if outside range
    if (minutesSince6am < 0 || minutesSince6am > (17.5 * 60)) {
      console.log('Event outside time range, skipping');
      return;
    }

    // Position
    const eventX = margin + timeColumnWidth + 2;
    const eventY = gridStartY + topPosition;
    const eventWidth = appointmentColumnWidth - 4;

    // Get event type
    const { isSimplePractice, isGoogle, isHoliday } = getEventTypeInfo(event);

    // Draw background - white like dashboard
    pdf.setFillColor(...DAILY_CONFIG.colors.white);
    pdf.rect(eventX, eventY, eventWidth, eventHeight, 'F');

    // Draw borders based on type - match dashboard exactly
    if (isSimplePractice) {
      // Blue left border
      pdf.setDrawColor(...DAILY_CONFIG.colors.simplePracticeBlue);
      pdf.setLineWidth(3);
      pdf.line(eventX, eventY, eventX, eventY + eventHeight);

      // Thin border around rest
      pdf.setDrawColor(...DAILY_CONFIG.colors.lightGray);
      pdf.setLineWidth(0.5);
      pdf.rect(eventX, eventY, eventWidth, eventHeight);
    } else if (isGoogle) {
      // Dashed green border
      pdf.setDrawColor(...DAILY_CONFIG.colors.googleGreen);
      pdf.setLineWidth(1);
      pdf.setLineDash([3, 2]);
      pdf.rect(eventX, eventY, eventWidth, eventHeight);
      pdf.setLineDash([]);
    } else if (isHoliday) {
      // Yellow background with orange border
      pdf.setFillColor(...DAILY_CONFIG.colors.holidayYellow);
      pdf.rect(eventX, eventY, eventWidth, eventHeight, 'F');
      pdf.setDrawColor(...DAILY_CONFIG.colors.holidayOrange);
      pdf.setLineWidth(1);
      pdf.rect(eventX, eventY, eventWidth, eventHeight);
    }

    // Check for expanded layout
    const hasNotes = !!(event.notes && event.notes.trim());
    const hasActionItems = !!(event.actionItems && event.actionItems.trim());
    const needsExpandedLayout = hasNotes || hasActionItems;

    // Clean title
    let displayTitle = event.title || 'Untitled Event';
    if (displayTitle.endsWith(' Appointment')) {
      displayTitle = displayTitle.slice(0, -12);
    }

    if (needsExpandedLayout) {
      // 3-column layout matching dashboard
      const col1Width = eventWidth * 0.33;
      const col2Width = eventWidth * 0.33;
      const col3Width = eventWidth * 0.34;

      const col1X = eventX + 6;
      const col2X = eventX + col1Width + 8;
      const col3X = eventX + col1Width + col2Width + 10;

      // Column dividers
      pdf.setDrawColor(...DAILY_CONFIG.colors.lightGray);
      pdf.setLineWidth(0.5);
      if (hasNotes) {
        pdf.line(col2X - 2, eventY + 5, col2X - 2, eventY + eventHeight - 5);
      }
      if (hasActionItems) {
        pdf.line(col3X - 2, eventY + 5, col3X - 2, eventY + eventHeight - 5);
      }

      // Column 1: Event info
      let currentY = eventY + 12;

      // Title
      pdf.setFontSize(DAILY_CONFIG.fonts.eventTitle.size);
      pdf.setFont('helvetica', DAILY_CONFIG.fonts.eventTitle.weight);
      pdf.setTextColor(...DAILY_CONFIG.colors.black);
      pdf.text(displayTitle, col1X, currentY);
      currentY += 12;

      // Source
      pdf.setFontSize(DAILY_CONFIG.fonts.eventSource.size);
      pdf.setFont('helvetica', DAILY_CONFIG.fonts.eventSource.weight);
      pdf.setTextColor(...DAILY_CONFIG.colors.gray);
      const sourceText = isSimplePractice ? 'SIMPLEPRACTICE' : 
                        isGoogle ? 'GOOGLE CALENDAR' : 
                        isHoliday ? 'HOLIDAYS IN UNITED STATES' : 'MANUAL';
      pdf.text(sourceText, col1X, currentY);
      currentY += 12;

      // Time
      pdf.setFontSize(DAILY_CONFIG.fonts.eventTime.size);
      pdf.setFont('helvetica', DAILY_CONFIG.fonts.eventTime.weight);
      pdf.setTextColor(...DAILY_CONFIG.colors.black);
      const timeRange = `${eventDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}-${endDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}`;
      pdf.text(timeRange, col1X, currentY);

      // Column 2: Notes
      if (hasNotes) {
        let notesY = eventY + 12;
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...DAILY_CONFIG.colors.black);
        pdf.text('Event Notes', col2X, notesY);
        notesY += 14;

        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        const noteLines = event.notes!.split('\n').filter(line => line.trim());
        noteLines.forEach(line => {
          const cleanLine = line.trim();
          if (cleanLine && notesY + 10 <= eventY + eventHeight - 5) {
            const bulletLine = cleanLine.startsWith('•') ? cleanLine : '• ' + cleanLine;
            pdf.text(bulletLine, col2X, notesY);
            notesY += 10;
          }
        });
      }

      // Column 3: Action Items
      if (hasActionItems) {
        let actionY = eventY + 12;
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...DAILY_CONFIG.colors.black);
        pdf.text('Action Items', col3X, actionY);
        actionY += 14;

        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        const actionLines = event.actionItems!.split('\n').filter(line => line.trim());
        actionLines.forEach(line => {
          const cleanLine = line.trim();
          if (cleanLine && actionY + 10 <= eventY + eventHeight - 5) {
            const bulletLine = cleanLine.startsWith('•') ? cleanLine : '• ' + cleanLine;
            pdf.text(bulletLine, col3X, actionY);
            actionY += 10;
          }
        });
      }

    } else {
      // Simple layout matching dashboard
      let currentY = eventY + 12;
      const padding = 6;

      // Title
      pdf.setFontSize(DAILY_CONFIG.fonts.eventTitle.size);
      pdf.setFont('helvetica', DAILY_CONFIG.fonts.eventTitle.weight);
      pdf.setTextColor(...DAILY_CONFIG.colors.black);
      pdf.text(displayTitle, eventX + padding, currentY);
      currentY += 12;

      // Source
      pdf.setFontSize(DAILY_CONFIG.fonts.eventSource.size);
      pdf.setFont('helvetica', DAILY_CONFIG.fonts.eventSource.weight);
      pdf.setTextColor(...DAILY_CONFIG.colors.gray);
      const sourceText = isSimplePractice ? 'SIMPLEPRACTICE' : 
                        isGoogle ? 'GOOGLE CALENDAR' : 
                        isHoliday ? 'HOLIDAYS IN UNITED STATES' : 'MANUAL';
      pdf.text(sourceText, eventX + padding, currentY);
      currentY += 12;

      // Time
      pdf.setFontSize(DAILY_CONFIG.fonts.eventTime.size);
      pdf.setFont('helvetica', DAILY_CONFIG.fonts.eventTime.weight);
      pdf.setTextColor(...DAILY_CONFIG.colors.black);
      const timeRange = `${eventDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}-${endDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}`;
      pdf.text(timeRange, eventX + padding, currentY);
    }

    console.log(`Event positioned at Y=${eventY}, height=${eventHeight}`);
  });
}

export const exportDailyToPDF = async (
  selectedDate: Date,
  events: CalendarEvent[]
): Promise<void> => {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4'
  });

  console.log(`=== DAILY PDF EXPORT ===`);
  console.log(`Date: ${selectedDate.toDateString()}`);
  console.log(`Total events: ${events.length}`);

  // Filter events for selected date with improved debugging
  const dayEvents = events.filter(event => {
    const eventDate = new Date(event.startTime);
    const eventDateString = eventDate.toISOString().split('T')[0];
    const selectedDateString = selectedDate.toISOString().split('T')[0];
    const matches = eventDateString === selectedDateString;
    console.log(`Event: ${event.title} on ${eventDate.toDateString()}, Selected: ${selectedDate.toDateString()}, Matches: ${matches}`);
    return matches;
  });

  console.log(`Day events: ${dayEvents.length}`);
  console.log('Day events details:', dayEvents.map(e => ({ title: e.title, time: e.startTime.toLocaleTimeString() })));

  // Draw layout
  drawDailyHeader(pdf, selectedDate, dayEvents);
  drawTimeGrid(pdf);
  drawAppointments(pdf, selectedDate, dayEvents);

  // Save PDF
  const fileName = `daily-planner-${selectedDate.toISOString().split('T')[0]}.pdf`;
  pdf.save(fileName);

  console.log(`PDF saved as: ${fileName}`);
};
