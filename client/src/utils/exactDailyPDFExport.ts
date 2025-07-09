import jsPDF from 'jspdf';
import { CalendarEvent } from '../types/calendar';

// reMarkable Paper Pro portrait dimensions optimized
const DAILY_CONFIG = {
  // reMarkable Paper Pro portrait: 179 x 239 mm active display area
  // Convert to points: 179mm = 507.4pt, 239mm = 677.5pt
  pageWidth: 507,   // 179mm in points (179 * 72 / 25.4)
  pageHeight: 677,  // 239mm in points (239 * 72 / 25.4)  
  margin: 8,        // Minimal margins for maximum space usage
  timeColumnWidth: 50,  // Compact time column for narrow screen
  appointmentColumnWidth: 449,  // Remaining width for appointments
  timeSlotHeight: 16,  // Compact slots to fit full timeline in portrait
  headerHeight: 90,     // Adjusted for new header structure

  // Typography optimized for reMarkable Paper Pro e-ink display
  fonts: {
    title: { size: 12, weight: 'bold' },      // Smaller title for narrow screen
    date: { size: 8, weight: 'normal' },      // Compact date info
    stats: { size: 6, weight: 'normal' },     // Very compact stats
    timeLabels: { size: 5, weight: 'normal' }, // Tiny time labels
    eventTitle: { size: 7, weight: 'bold' },  // Appointment name size - scaled to dashboard proportions
    eventSource: { size: 6, weight: 'normal' }, // Calendar source size - scaled to dashboard proportions
    eventTime: { size: 6, weight: 'bold' },   // Appointment time size - scaled to dashboard proportions
    eventNotes: { size: 4, weight: 'normal' }  // Very compact notes
  },

  // Colors matching dashboard
  colors: {
    black: [0, 0, 0],
    gray: [100, 100, 100],
    lightGray: [240, 240, 240],
    mediumGray: [150, 150, 150],
    veryLightGray: [248, 248, 248],
    white: [255, 255, 255],
    bottomHourColor: [253, 252, 250], // #FDFCFA - light cream for bottom-of-hour rows
    topHourColor: [242, 243, 244], // #F2F3F4 - light gray for top-of-hour rows
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

// Helper function for military time formatting
const formatMilitaryTime = (date: Date) => {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

function getEventTypeInfo(event: CalendarEvent) {
  // Check for holiday events first
  const isHoliday = event.title.toLowerCase().includes('holiday') ||
                   event.calendarId === 'en.usa#holiday@group.v.calendar.google.com';

  // Check for "Dan re: Supervision" - this is the only Google Calendar appointment
  const isDanSupervision = event.title === 'Dan re: Supervision';

  // All other appointments (except holidays and Dan's supervision) are SimplePractice
  // This includes appointments like "Nancy Grossman Appointment", "Sherrifa Hoosein Appointment", etc.
  const isSimplePractice = !isHoliday && !isDanSupervision && 
                           (event.title.includes('Appointment') || 
                            event.title.includes('Sherrifa Hoosein'));

  // Only Dan's supervision is Google Calendar
  const isGoogle = isDanSupervision;

  console.log(`Event type detection for "${event.title}":`, {
    source: event.source,
    isSimplePractice,
    isGoogle,
    isHoliday
  });

  return { 
    isSimplePractice, 
    isGoogle, 
    isHoliday,
    source: isHoliday ? 'Holidays in United States' : 
            isSimplePractice ? 'SimplePractice' : 
            'Google Calendar'
  };
}

function drawDashboardHeader(pdf: jsPDF, selectedDate: Date, events: CalendarEvent[]) {
  const { margin, pageWidth } = DAILY_CONFIG;

  // Header border - full width box around entire header
  const headerBoxY = margin + 8;
  const headerBoxHeight = 75;
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(1);
  pdf.rect(margin, headerBoxY, pageWidth - (margin * 2), headerBoxHeight, 'D');

  // Title section with border
  const titleSectionHeight = 35;
  pdf.setFillColor(255, 255, 255); // White background
  pdf.rect(margin, headerBoxY, pageWidth - (margin * 2), titleSectionHeight, 'F');
  pdf.line(margin, headerBoxY + titleSectionHeight, pageWidth - margin, headerBoxY + titleSectionHeight);

  // Title - WEEKLY PLANNER at the top
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...DAILY_CONFIG.colors.black);
  pdf.text('WEEKLY PLANNER', pageWidth / 2, headerBoxY + 15, { align: 'center' });

  // Date range and week number
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  
  // Calculate week start (Monday) and end (Sunday) based on selected date
  const weekStart = new Date(selectedDate);
  const dayOfWeek = weekStart.getDay();
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sunday is 0, Monday is 1
  weekStart.setDate(weekStart.getDate() - daysFromMonday);
  
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  
  // Calculate week number (ISO week)
  const startOfYear = new Date(selectedDate.getFullYear(), 0, 1);
  const daysSinceStart = Math.floor((weekStart.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
  const weekNumber = Math.ceil((daysSinceStart + startOfYear.getDay() + 1) / 7);
  
  const dateRange = `July ${weekStart.getDate()}-${weekEnd.getDate()} • Week ${weekNumber}`;
  pdf.text(dateRange, pageWidth / 2, headerBoxY + 28, { align: 'center' });

  // Statistics table - full width spanning the four boxes
  const dayEvents = events.filter(event => {
    const eventDate = new Date(event.startTime);
    return eventDate.toDateString() === selectedDate.toDateString();
  });
  
  const totalAppointments = dayEvents.length;
  const scheduledMinutes = dayEvents.reduce((total, event) => {
    return total + (event.endTime.getTime() - event.startTime.getTime()) / (1000 * 60);
  }, 0);
  const scheduledHours = Math.round(scheduledMinutes / 60 * 10) / 10;
  const dailyAverage = scheduledHours; // For daily view, this is the same as scheduled time
  const availableTime = Math.max(0, 12 - scheduledHours); // Assuming 12-hour workday
  
  // Statistics table positioned in lower section of header
  const tableY = headerBoxY + titleSectionHeight;
  const tableHeight = 25;
  const colWidth = (pageWidth - (margin * 2)) / 4;
  
  // Table background
  pdf.setFillColor(245, 245, 245); // Light gray background
  pdf.rect(margin, tableY, pageWidth - (margin * 2), tableHeight, 'F');
  
  // Vertical dividers
  for (let i = 1; i < 4; i++) {
    pdf.line(margin + (colWidth * i), tableY, margin + (colWidth * i), tableY + tableHeight);
  }
  
  // Values (top row)
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(...DAILY_CONFIG.colors.black);
  pdf.text(`${totalAppointments}`, margin + colWidth * 0.5, tableY + 8, { align: 'center' });
  pdf.text(`${scheduledHours}h`, margin + colWidth * 1.5, tableY + 8, { align: 'center' });
  pdf.text(`${dailyAverage}h`, margin + colWidth * 2.5, tableY + 8, { align: 'center' });
  pdf.text(`${availableTime}h`, margin + colWidth * 3.5, tableY + 8, { align: 'center' });
  
  // Labels (bottom row)
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(6);
  pdf.text('Total Appointments', margin + colWidth * 0.5, tableY + 18, { align: 'center' });
  pdf.text('Scheduled Time', margin + colWidth * 1.5, tableY + 18, { align: 'center' });
  pdf.text('Daily Average', margin + colWidth * 2.5, tableY + 18, { align: 'center' });
  pdf.text('Available Time', margin + colWidth * 3.5, tableY + 18, { align: 'center' });

  // Legend section - full width below statistics table
  const legendY = headerBoxY + titleSectionHeight + tableHeight;
  const legendHeight = headerBoxHeight - titleSectionHeight - tableHeight;
  
  // Legend background
  pdf.setFillColor(255, 255, 255); // White background
  pdf.rect(margin, legendY, pageWidth - (margin * 2), legendHeight, 'F');
  
  // Legend items positioned horizontally with proper centering and proportional sizing
  pdf.setFontSize(4);
  pdf.setFont('helvetica', 'normal');
  
  const legendItemSpacing = (pageWidth - (margin * 2)) / 3;
  const legendItemY = legendY + (legendHeight / 2) - 3; // Vertically centered
  const iconSize = 8;
  const iconHeight = 4;
  
  // Calculate horizontal centering for each legend item
  const centerOffset = legendItemSpacing / 2;
  
  // SimplePractice - left position, centered
  const sp1X = margin + centerOffset - 25;
  pdf.setFillColor(...DAILY_CONFIG.colors.white);
  pdf.setDrawColor(...DAILY_CONFIG.colors.simplePracticeBlue);
  pdf.setLineWidth(0.5);
  pdf.rect(sp1X, legendItemY, iconSize, iconHeight, 'FD');
  pdf.setFillColor(...DAILY_CONFIG.colors.simplePracticeBlue);
  pdf.rect(sp1X, legendItemY, 2, iconHeight, 'F');
  pdf.setTextColor(...DAILY_CONFIG.colors.black);
  pdf.text('SimplePractice', sp1X + 10, legendItemY + 3);
  
  // Google Calendar - center position, centered
  const gc1X = margin + centerOffset + legendItemSpacing - 30;
  pdf.setFillColor(...DAILY_CONFIG.colors.white);
  pdf.setDrawColor(...DAILY_CONFIG.colors.googleGreen);
  pdf.setLineWidth(0.5);
  pdf.setLineDash([1, 1]);
  pdf.rect(gc1X, legendItemY, iconSize, iconHeight, 'FD');
  pdf.setLineDash([]);
  pdf.setTextColor(...DAILY_CONFIG.colors.black);
  pdf.text('Google Calendar', gc1X + 10, legendItemY + 3);
  
  // Holidays - right position, centered
  const h1X = margin + centerOffset + legendItemSpacing * 2 - 50;
  pdf.setFillColor(...DAILY_CONFIG.colors.holidayYellow);
  pdf.setDrawColor(...DAILY_CONFIG.colors.holidayOrange);
  pdf.setLineWidth(0.5);
  pdf.rect(h1X, legendItemY, iconSize, iconHeight, 'FD');
  pdf.setTextColor(...DAILY_CONFIG.colors.black);
  pdf.text('Holidays in United States', h1X + 10, legendItemY + 3);
}



function drawDashboardGrid(pdf: jsPDF, selectedDate: Date, events: CalendarEvent[]) {
  const { margin, timeColumnWidth, appointmentColumnWidth, timeSlotHeight, headerHeight, pageWidth } = DAILY_CONFIG;
  const gridStartY = headerHeight;  // Grid starts after header space
  const totalGridHeight = timeSlotHeight * TIME_SLOTS.length;  // Full timeline to 23:30 (36 slots * 16px = 576px)
  const gridWidth = pageWidth - (margin * 2);  // Match header width exactly
  
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
  console.log(`📅 Drawing time slots from ${TIME_SLOTS[0]} to ${TIME_SLOTS[TIME_SLOTS.length - 1]} (${TIME_SLOTS.length} slots)`);
  TIME_SLOTS.forEach((timeSlot, index) => {
    const y = gridStartY + (index * timeSlotHeight);
    const isHour = timeSlot.endsWith(':00');
    
    // Time slot background - match dashboard exactly
    if (isHour) {
      pdf.setFillColor(...DAILY_CONFIG.colors.topHourColor);  // #F9F6EE for top of hour (hour marks)
    } else {
      pdf.setFillColor(...DAILY_CONFIG.colors.bottomHourColor);  // #FFFFF0 for bottom of hour (30-minute marks)
    }
    pdf.rect(margin, y, gridWidth, timeSlotHeight, 'F');
    
    // Time label - centered both vertically and horizontally in the time column
    pdf.setFontSize(isHour ? DAILY_CONFIG.fonts.timeLabels.size + 1 : DAILY_CONFIG.fonts.timeLabels.size);
    pdf.setFont('helvetica', isHour ? 'bold' : 'normal');
    pdf.setTextColor(...DAILY_CONFIG.colors.black);
    pdf.text(timeSlot, margin + timeColumnWidth / 2, y + timeSlotHeight / 2 + 2, { align: 'center' });
    
    // Grid lines - subtle like dashboard
    pdf.setDrawColor(...DAILY_CONFIG.colors.mediumGray);
    pdf.setLineWidth(0.5);
    pdf.line(margin, y, margin + gridWidth, y);
  });
  
  // Draw vertical separator between time and appointments
  pdf.setDrawColor(...DAILY_CONFIG.colors.mediumGray);
  pdf.setLineWidth(1);
  pdf.line(margin + timeColumnWidth, gridStartY, margin + timeColumnWidth, gridStartY + totalGridHeight);
  
  // Draw bottom border to close the grid at 23:30
  pdf.setDrawColor(...DAILY_CONFIG.colors.mediumGray);
  pdf.setLineWidth(1);
  pdf.line(margin, gridStartY + totalGridHeight, margin + gridWidth, gridStartY + totalGridHeight);
  
  // Draw events exactly like dashboard with precise positioning
  timedEvents.forEach(event => {
    const eventStart = new Date(event.startTime);
    const eventEnd = new Date(event.endTime);
    const durationMinutes = (eventEnd.getTime() - eventStart.getTime()) / (1000 * 60);
    
    // Calculate position exactly like dashboard CSS Grid
    const startHour = eventStart.getHours();
    const startMinute = eventStart.getMinutes();
    
    // Calculate exact slot position from 6:00 AM starting point
    const slotIndex = ((startHour - 6) * 2) + (startMinute >= 30 ? 1 : 0);
    const slotStartY = gridStartY + (slotIndex * timeSlotHeight);
    
    // Calculate duration in slots, ensuring proper containment
    const durationSlots = Math.ceil(durationMinutes / 30);
    const slotEndY = gridStartY + ((slotIndex + durationSlots) * timeSlotHeight);
    
    // Strictly contain within grid boundaries with conservative margins
    const topPosition = slotStartY + 4; // Start 4px below the grid line
    const bottomPosition = slotEndY - 4; // End 4px before the next grid line
    const exactHeight = Math.max(bottomPosition - topPosition, 8); // Minimum 8px height, strictly contained
    
    console.log(`📅 Event: ${event.title}`);
    console.log(`  ⏰ Start: ${formatMilitaryTime(eventStart)} (${startHour}:${startMinute.toString().padStart(2, '0')})`);
    console.log(`  ⏳ Duration: ${durationMinutes} minutes (${durationSlots} slots)`);
    console.log(`  📍 Slot index: ${slotIndex} (calculated: ${startHour - 6}*2 + ${startMinute >= 30 ? 1 : 0})`);
    console.log(`  📐 Top position: ${topPosition}px (gridStart: ${gridStartY} + slot: ${slotIndex} * height: ${timeSlotHeight})`);
    console.log(`  📏 Height: ${exactHeight}px`);
    
    // Event styling based on type
    const eventType = getEventTypeInfo(event);
    
    // Draw event background - always white like dashboard, STRICTLY contained within grid boundaries
    const eventBoxX = margin + timeColumnWidth + 8; // Start even further from time column
    const eventBoxWidth = appointmentColumnWidth - 16; // Much smaller width to ensure strict containment
    pdf.setFillColor(...DAILY_CONFIG.colors.white);
    pdf.rect(eventBoxX, topPosition, eventBoxWidth, exactHeight, 'F');
    
    // Draw event borders based on type - match dashboard styling EXACTLY, strictly contained
    if (eventType.isSimplePractice) {
      // SimplePractice: white background with thin cornflower blue border and left flag
      pdf.setDrawColor(...DAILY_CONFIG.colors.simplePracticeBlue);
      pdf.setLineWidth(0.5);
      pdf.rect(eventBoxX, topPosition, eventBoxWidth, exactHeight, 'D');
      // Thin left flag (2px wide instead of 4px)
      pdf.setFillColor(...DAILY_CONFIG.colors.simplePracticeBlue);
      pdf.rect(eventBoxX, topPosition, 2, exactHeight, 'F');
    } else if (eventType.isGoogle) {
      // Google Calendar: white background with dashed green border all around
      pdf.setDrawColor(...DAILY_CONFIG.colors.googleGreen);
      pdf.setLineWidth(0.5);
      pdf.setLineDash([2, 2]);
      pdf.rect(eventBoxX, topPosition, eventBoxWidth, exactHeight, 'D');
      pdf.setLineDash([]);
    } else {
      // Holiday: orange border around appointment
      pdf.setDrawColor(...DAILY_CONFIG.colors.holidayOrange);
      pdf.setLineWidth(0.5);
      pdf.rect(eventBoxX, topPosition, eventBoxWidth, exactHeight, 'D');
    }
    
    // Draw event content in 3-column layout optimized for reMarkable Paper Pro
    const eventX = margin + timeColumnWidth + 11; // Align with further reduced event box
    const eventY = topPosition + 2;  // Position at the very top of the appointment square
    const columnWidth = (appointmentColumnWidth - 35) / 3;  // Further reduced column width to match contained appointment box
    
    // Left column: Event title, calendar source, and time
    pdf.setFontSize(DAILY_CONFIG.fonts.eventTitle.size);
    pdf.setFont('helvetica', DAILY_CONFIG.fonts.eventTitle.weight);
    pdf.setTextColor(...DAILY_CONFIG.colors.black);
    
    // Clean title - minimal processing to preserve patient names
    let cleanTitle = event.title;
    if (cleanTitle.endsWith(' Appointment')) {
      cleanTitle = cleanTitle.replace(' Appointment', '');
    }
    // Only remove lock emoji and preserve all other text
    cleanTitle = cleanTitle.replace(/🔒\s*/, '').trim();
    
    console.log(`Event ${event.id}: "${event.title}" -> "${cleanTitle}"`);
    
    // Handle case where title might be empty or just "Appointment"
    if (!cleanTitle || cleanTitle === 'Appointment' || cleanTitle.trim() === '') {
      cleanTitle = 'Untitled Appointment';
    }
    
    // Appointment name at the very top
    pdf.text(cleanTitle, eventX, eventY + 8);
    
    // Source line below the name with small spacing
    pdf.setFontSize(DAILY_CONFIG.fonts.eventSource.size);
    pdf.setFont('helvetica', DAILY_CONFIG.fonts.eventSource.weight);
    pdf.setTextColor(...DAILY_CONFIG.colors.black);
    pdf.text(eventType.source, eventX, eventY + 14);
    
    // Time range below the source with small spacing
    pdf.setFontSize(DAILY_CONFIG.fonts.eventTime.size);
    pdf.setFont('helvetica', DAILY_CONFIG.fonts.eventTime.weight);
    pdf.setTextColor(...DAILY_CONFIG.colors.black);
    const timeRange = `${formatMilitaryTime(eventStart)} - ${formatMilitaryTime(eventEnd)}`;
    pdf.text(timeRange, eventX, eventY + 20);
    
    // Center column: Event Notes (if they exist)
    if (event.notes && event.notes.trim()) {
      pdf.setFontSize(DAILY_CONFIG.fonts.eventNotes.size + 1);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...DAILY_CONFIG.colors.black);
      const notesHeaderX = eventX + columnWidth; // Position directly over vertical line
      pdf.text('Event Notes', notesHeaderX, eventY + 2); // Move up to align with vertical line
      
      // Draw underline for Event Notes header
      pdf.setDrawColor(...DAILY_CONFIG.colors.black);
      pdf.setLineWidth(0.3);
      pdf.line(notesHeaderX, eventY + 3, notesHeaderX + 30, eventY + 3);
      
      pdf.setFontSize(DAILY_CONFIG.fonts.eventNotes.size);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...DAILY_CONFIG.colors.black);
      const notes = event.notes.split('\n')
        .filter(note => note.trim().length > 0)
        .map(note => note.trim().replace(/^[•\s-]+/, '').trim())
        .filter(note => note.length > 0 && note !== '•' && note !== '-');
      
      let currentY = eventY + 10;
      notes.forEach((note, index) => {
        // Wrap text to fit within column width with block text formatting
        const maxWidth = columnWidth - 10; // Leave margin for bullet and spacing
        const lines = pdf.splitTextToSize(`- ${note}`, maxWidth);
        
        lines.forEach((line, lineIndex) => {
          pdf.setTextColor(...DAILY_CONFIG.colors.black);
          pdf.text(line, notesHeaderX, currentY);
          currentY += 5; // Compact line spacing scaled to dashboard
        });
        currentY += 1; // Minimal gap between bullet points
      });
    }
    
    // Right column: Action Items (if they exist)
    if (event.actionItems && event.actionItems.trim()) {
      pdf.setFontSize(DAILY_CONFIG.fonts.eventNotes.size + 1);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...DAILY_CONFIG.colors.black);
      const actionHeaderX = eventX + columnWidth * 2; // Position directly over vertical line
      pdf.text('Action Items', actionHeaderX, eventY + 2); // Move up to align with vertical line
      
      // Draw underline for Action Items header
      pdf.setDrawColor(...DAILY_CONFIG.colors.black);
      pdf.setLineWidth(0.3);
      pdf.line(actionHeaderX, eventY + 3, actionHeaderX + 30, eventY + 3);
      
      pdf.setFontSize(DAILY_CONFIG.fonts.eventNotes.size);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...DAILY_CONFIG.colors.black);
      const actionItems = event.actionItems.split('\n')
        .filter(item => item.trim().length > 0)
        .map(item => item.trim().replace(/^[•\s-]+/, '').trim())
        .filter(item => item.length > 0 && item !== '•' && item !== '-');
      
      let currentY = eventY + 10;
      actionItems.forEach((item, index) => {
        // Wrap text to fit within column width with block text formatting
        const maxWidth = columnWidth - 10; // Leave margin for bullet and spacing
        const lines = pdf.splitTextToSize(`- ${item}`, maxWidth);
        
        lines.forEach((line, lineIndex) => {
          pdf.setTextColor(...DAILY_CONFIG.colors.black);
          pdf.text(line, actionHeaderX, currentY);
          currentY += 5; // Compact line spacing scaled to dashboard
        });
        currentY += 1; // Minimal gap between bullet points
      });
    }
    
    // Draw vertical lines only where the bullets are located
    if ((event.notes && event.notes.trim()) || (event.actionItems && event.actionItems.trim())) {
      pdf.setDrawColor(100, 100, 100); // Dark gray for visibility
      pdf.setLineWidth(0.5);
      
      // Draw vertical line only in the bullet area for notes
      if (event.notes && event.notes.trim()) {
        const notesX = eventX + columnWidth; // Align with header position
        const bulletStartY = eventY + 6; // Start higher to align with headers
        
        // Calculate actual height of notes content
        const notes = event.notes.split('\n')
          .filter(note => note.trim().length > 0)
          .map(note => note.trim().replace(/^[•\s-]+/, '').trim())
          .filter(note => note.length > 0 && note !== '•' && note !== '-');
        
        let notesHeight = 0;
        notes.forEach(note => {
          const lines = pdf.splitTextToSize(`- ${note}`, columnWidth - 10);
          notesHeight += lines.length * 5; // 5pt line spacing
          notesHeight += 1; // Gap between bullet points
        });
        
        const bulletEndY = bulletStartY + notesHeight - 1;
        pdf.line(notesX - 5, bulletStartY, notesX - 5, bulletEndY);
      }
      
      // Draw vertical line only in the bullet area for action items
      if (event.actionItems && event.actionItems.trim()) {
        const actionX = eventX + columnWidth * 2; // Align with header position
        const bulletStartY = eventY + 6; // Start higher to align with headers
        
        // Calculate actual height of action items content
        const actionItems = event.actionItems.split('\n')
          .filter(item => item.trim().length > 0)
          .map(item => item.trim().replace(/^[•\s-]+/, '').trim())
          .filter(item => item.length > 0 && item !== '•' && item !== '-');
        
        let actionHeight = 0;
        actionItems.forEach(item => {
          const lines = pdf.splitTextToSize(`- ${item}`, columnWidth - 10);
          actionHeight += lines.length * 5; // 5pt line spacing
          actionHeight += 1; // Gap between bullet points
        });
        
        const bulletEndY = bulletStartY + actionHeight - 1;
        pdf.line(actionX - 5, bulletStartY, actionX - 5, bulletEndY);
      }
    }
  });
}



export const exportExactDailyPDF = async (
  selectedDate: Date,
  events: CalendarEvent[]
): Promise<void> => {
  try {
    console.log(`🚀🚀🚀 EXACT DAILY PDF EXPORT START 🚀🚀🚀`);
    console.log(`📅 Date: ${selectedDate.toDateString()}`);
    console.log(`📊 Total events: ${events.length}`);
    
    // Add a visible alert to confirm the function is being called
    console.log('🔥 CREATING PDF OBJECT...');

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: [DAILY_CONFIG.pageWidth, DAILY_CONFIG.pageHeight]
    });
    
    console.log('✅ PDF OBJECT CREATED SUCCESSFULLY');

    // Filter events for selected date
    const dayEvents = events.filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate.toDateString() === selectedDate.toDateString();
    });

    console.log(`Day events: ${dayEvents.length}`);
    dayEvents.forEach((event, i) => {
      console.log(`Event ${i + 1}: ${event.title} at ${formatMilitaryTime(new Date(event.startTime))}`);
    });

    // Draw exactly what the dashboard shows
    console.log('Drawing header...');
    drawDashboardHeader(pdf, selectedDate, dayEvents);
    
    console.log('Drawing grid...');
    drawDashboardGrid(pdf, selectedDate, events);

    // Save PDF
    const fileName = `daily-planner-${selectedDate.toISOString().split('T')[0]}.pdf`;
    console.log(`Saving PDF as: ${fileName}`);
    pdf.save(fileName);

    console.log(`=== EXACT DAILY PDF EXPORT COMPLETE ===`);
    
  } catch (error) {
    console.error('=== EXACT DAILY PDF EXPORT ERROR ===');
    console.error('Error details:', error);
    console.error('Error stack:', error.stack);
    throw error;
  }
};