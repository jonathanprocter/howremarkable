
import jsPDF from 'jspdf';
import { CalendarEvent } from '../types/calendar';

// Configuration for larger daily view portrait (8.5x11 inches - bigger to match portrait view)
const DAILY_CONFIG = {
  pageWidth: 612,   // 8.5 inches = 612 points
  pageHeight: 792,  // 11 inches = 792 points
  margin: 30,       // Reduced margin for more space
  timeColumnWidth: 90,  // Slightly wider time column for better readability
  appointmentColumnWidth: 492,  // Remaining width for appointments (612 - 90 - 30 = 492)
  timeSlotHeight: 22,  // Bigger slots to match portrait view better
  headerHeight: 100,     // Reduced header to make room for bigger content

  // Typography - proportional to time grid size
  fonts: {
    title: { size: 20, weight: 'bold' },      // Large title for "DAILY PLANNER"
    date: { size: 16, weight: 'normal' },     // Date display
    stats: { size: 12, weight: 'normal' },    // Statistics display
    timeLabels: { size: 10, weight: 'normal' }, // Time labels (6:00, 6:30, etc.)
    eventTitle: { size: 12, weight: 'bold' },  // Appointment title font
    eventSource: { size: 10, weight: 'normal' }, // Calendar source font
    eventTime: { size: 24, weight: 'bold' },   // Large time display matching dashboard
    eventNotes: { size: 10, weight: 'normal' },  // Notes section
    notesHeader: { size: 10, weight: 'bold' },   // "Event Notes" header
    actionsHeader: { size: 10, weight: 'bold' }  // "Action Items" header
  },

  // Colors - match dashboard daily view exactly
  colors: {
    black: [0, 0, 0],
    gray: [100, 100, 100],
    lightGray: [240, 240, 240], // #f0f0f0 for hour rows
    mediumGray: [150, 150, 150],
    veryLightGray: [248, 248, 248], // #f8f8f8 for half-hour rows
    white: [255, 255, 255],
    simplePracticeBlue: [100, 149, 237], // #6495ED cornflower blue
    googleGreen: [34, 197, 94], // #22c55e dashed green
    holidayOrange: [245, 158, 11], // #f59e0b
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

  // Navigation buttons to match dashboard
  const buttonHeight = 18;
  const buttonWidth = 80;
  const buttonY = margin + 10;
  
  // Back to Weekly button (left side)
  const backButtonX = margin + 20;
  pdf.setFillColor(245, 245, 245); // Light gray background
  pdf.rect(backButtonX, buttonY, buttonWidth, buttonHeight, 'F');
  pdf.setDrawColor(128, 128, 128); // Gray border
  pdf.setLineWidth(1);
  pdf.rect(backButtonX, buttonY, buttonWidth, buttonHeight, 'S');
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(0, 0, 0);
  pdf.text('Back to week', backButtonX + buttonWidth/2, buttonY + 12, { align: 'center' });

  // Previous day button
  const prevButtonX = backButtonX + buttonWidth + 10;
  pdf.setFillColor(245, 245, 245);
  pdf.rect(prevButtonX, buttonY, 25, buttonHeight, 'F');
  pdf.setDrawColor(128, 128, 128);
  pdf.rect(prevButtonX, buttonY, 25, buttonHeight, 'S');
  pdf.text('<', prevButtonX + 12.5, buttonY + 12, { align: 'center' });

  // Next day button
  const nextButtonX = prevButtonX + 25 + 5;
  pdf.setFillColor(245, 245, 245);
  pdf.rect(nextButtonX, buttonY, 25, buttonHeight, 'F');
  pdf.setDrawColor(128, 128, 128);
  pdf.rect(nextButtonX, buttonY, 25, buttonHeight, 'S');
  pdf.text('>', nextButtonX + 12.5, buttonY + 12, { align: 'center' });

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

  // Sort events by start time to ensure proper rendering order
  const sortedEvents = [...events].sort((a, b) => 
    new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  // Track used vertical positions to prevent overlaps
  const usedPositions: { [key: number]: number } = {};

  sortedEvents.forEach((event, index) => {
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
    const eventHeight = Math.max(60, (durationMinutes / 30) * timeSlotHeight - 4); // Minimum height for text display

    // Skip if outside range (6:00 to 23:30)
    if (minutesSince6am < 0 || minutesSince6am > (17.5 * 60)) {
      console.log('Event outside time range, skipping');
      return;
    }

    // Check for overlapping events and adjust horizontal positioning
    let horizontalOffset = 0;
    const timeSlot = Math.floor(slotsFromStart);
    
    // Find available horizontal position for overlapping events
    while (usedPositions[timeSlot + horizontalOffset] !== undefined) {
      horizontalOffset += 1;
      if (horizontalOffset > 3) break; // Max 4 overlapping events
    }
    
    // Mark this position as used
    const endSlot = Math.ceil((minutesSince6am + durationMinutes) / 30);
    for (let i = timeSlot; i < endSlot; i++) {
      usedPositions[i + horizontalOffset] = index;
    }

    // Position with horizontal offset for overlapping events - ensure within page margins
    const maxOverlaps = 4;
    const availableWidth = appointmentColumnWidth - 8; // More margin for page containment
    const eventWidth = horizontalOffset > 0 ? Math.max(120, availableWidth / (horizontalOffset + 1)) : availableWidth;
    const eventX = margin + timeColumnWidth + 4 + (horizontalOffset * (eventWidth + 2)); // More margin from left
    const eventY = gridStartY + topPosition;

    // Get event type
    const { isSimplePractice, isGoogle, isHoliday } = getEventTypeInfo(event);

    // Draw background - white like dashboard
    pdf.setFillColor(...DAILY_CONFIG.colors.white);
    pdf.rect(eventX, eventY, eventWidth, eventHeight, 'F');

    // Draw borders based on type - match dashboard exactly
    if (isSimplePractice) {
      // Cornflower blue border with thick left flag
      pdf.setDrawColor(...DAILY_CONFIG.colors.simplePracticeBlue);
      pdf.setLineWidth(1);
      pdf.rect(eventX, eventY, eventWidth, eventHeight);
      pdf.setLineWidth(4);
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

    // Clean title - remove "Appointment" suffix like dashboard
    let displayTitle = event.title || 'Untitled Event';
    if (displayTitle.endsWith(' Appointment')) {
      displayTitle = displayTitle.slice(0, -12);
    }

    // Check for notes/action items to determine layout - only show 3-column if content exists
    const hasNotes = !!(event.notes && event.notes.trim());
    const hasActionItems = !!(event.actionItems && event.actionItems.trim());
    const needsExpandedLayout = hasNotes || hasActionItems;

    if (needsExpandedLayout && eventHeight >= 70) {
      // 3-column layout for events with notes/action items (only if enough height)
      const col1Width = Math.min(eventWidth * 0.33, 140);
      const col2Width = Math.min(eventWidth * 0.33, 140);
      const col3Width = eventWidth - col1Width - col2Width;

      const col1X = eventX + 6;
      const col2X = eventX + col1Width + 8;
      const col3X = eventX + col1Width + col2Width + 10;

      // Column dividers - only draw if we have content in those columns
      pdf.setDrawColor(...DAILY_CONFIG.colors.lightGray);
      pdf.setLineWidth(0.5);
      if (hasNotes) {
        pdf.line(col2X - 2, eventY + 5, col2X - 2, eventY + eventHeight - 5);
      }
      if (hasActionItems) {
        pdf.line(col3X - 2, eventY + 5, col3X - 2, eventY + eventHeight - 5);
      }

      // Column 1: Event info
      let currentY = eventY + 14;

      // Title - larger and bolder
      pdf.setFontSize(DAILY_CONFIG.fonts.eventTitle.size);
      pdf.setFont('helvetica', DAILY_CONFIG.fonts.eventTitle.weight);
      pdf.setTextColor(...DAILY_CONFIG.colors.black);
      pdf.text(displayTitle, col1X, currentY);
      currentY += 14;

      // Source - match dashboard text
      pdf.setFontSize(DAILY_CONFIG.fonts.eventSource.size);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...DAILY_CONFIG.colors.gray);
      const sourceText = isSimplePractice ? 'SIMPLEPRACTICE' : 
                        isGoogle ? 'GOOGLE CALENDAR' : 
                        isHoliday ? 'HOLIDAYS IN UNITED STATES' : 'MANUAL';
      pdf.text(sourceText, col1X, currentY);
      currentY += 14;

      // Time - larger and bolder like dashboard
      pdf.setFontSize(DAILY_CONFIG.fonts.eventTime.size);
      pdf.setFont('helvetica', DAILY_CONFIG.fonts.eventTime.weight);
      pdf.setTextColor(...DAILY_CONFIG.colors.black);
      const timeRange = `${eventDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}-${endDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}`;
      pdf.text(timeRange, col1X, currentY);

      // Column 2: Event Notes
      if (hasNotes) {
        let notesY = eventY + 14;
        pdf.setFontSize(DAILY_CONFIG.fonts.notesHeader.size);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...DAILY_CONFIG.colors.black);
        pdf.text('Event Notes', col2X, notesY);
        notesY += 16;

        pdf.setFontSize(DAILY_CONFIG.fonts.eventNotes.size);
        pdf.setFont('helvetica', 'normal');
        const noteLines = event.notes!.split('\n').filter(line => line.trim());
        noteLines.forEach(line => {
          const cleanLine = line.trim().replace(/^[•\s-]+/, '').trim();
          if (cleanLine && notesY + 10 <= eventY + eventHeight - 5) {
            pdf.text(cleanLine, col2X, notesY);
            notesY += 11;
          }
        });
      }

      // Column 3: Action Items
      if (hasActionItems) {
        let actionY = eventY + 14;
        pdf.setFontSize(DAILY_CONFIG.fonts.actionsHeader.size);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...DAILY_CONFIG.colors.black);
        pdf.text('Action Items', col3X, actionY);
        actionY += 16;

        pdf.setFontSize(DAILY_CONFIG.fonts.eventNotes.size);
        pdf.setFont('helvetica', 'normal');
        const actionLines = event.actionItems!.split('\n').filter(line => line.trim());
        actionLines.forEach(line => {
          const cleanLine = line.trim().replace(/^[•\s-]+/, '').trim();
          if (cleanLine && actionY + 10 <= eventY + eventHeight - 5) {
            pdf.text(cleanLine, col3X, actionY);
            actionY += 11;
          }
        });
      }

    } else {
      // Simple single-column layout like dashboard
      let currentY = eventY + 14;
      const padding = 8;

      // Title - larger and bolder
      pdf.setFontSize(DAILY_CONFIG.fonts.eventTitle.size);
      pdf.setFont('helvetica', DAILY_CONFIG.fonts.eventTitle.weight);
      pdf.setTextColor(...DAILY_CONFIG.colors.black);
      pdf.text(displayTitle, eventX + padding, currentY);
      currentY += 14;

      // Source - match dashboard
      pdf.setFontSize(DAILY_CONFIG.fonts.eventSource.size);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...DAILY_CONFIG.colors.gray);
      const sourceText = isSimplePractice ? 'SIMPLEPRACTICE' : 
                        isGoogle ? 'GOOGLE CALENDAR' : 
                        isHoliday ? 'HOLIDAYS IN UNITED STATES' : 'MANUAL';
      pdf.text(sourceText, eventX + padding, currentY);
      currentY += 14;

      // Time - larger and bolder
      if (currentY + 12 <= eventY + eventHeight - 5) {
        pdf.setFontSize(DAILY_CONFIG.fonts.eventTime.size);
        pdf.setFont('helvetica', DAILY_CONFIG.fonts.eventTime.weight);
        pdf.setTextColor(...DAILY_CONFIG.colors.black);
        const timeRange = `${eventDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}-${endDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}`;
        pdf.text(timeRange, eventX + padding, currentY);
      }
    }

    console.log(`Event positioned at Y=${eventY}, height=${eventHeight}, width=${eventWidth}, offset=${horizontalOffset}, layout=${needsExpandedLayout ? '3-column' : 'simple'}`);
  });
}

export const exportDailyToPDF = async (
  selectedDate: Date,
  events: CalendarEvent[]
): Promise<void> => {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: [612, 792] // 8.5 x 11 inches
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
