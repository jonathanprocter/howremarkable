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
  headerHeight: 98,     // Optimized header space for navigation (moved up ~1 more row)

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

  // Title - DAILY PLANNER at the top
  pdf.setFontSize(16);  // Larger title for prominence
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...DAILY_CONFIG.colors.black);
  pdf.text('DAILY PLANNER', pageWidth / 2, margin + 15, { align: 'center' });

  // Date - clean formatting under title
  pdf.setFontSize(12);  // Proper date font
  pdf.setFont('helvetica', 'normal');
  const dateStr = selectedDate.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  pdf.text(dateStr, pageWidth / 2, margin + 30, { align: 'center' });

  // Navigation buttons - Back to week, <, >
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  
  // Back to week button (left)
  pdf.text('Back to week', margin + 30, margin + 50, { align: 'left' });
  
  // Navigation arrows (right side)
  pdf.text('<', pageWidth - margin - 40, margin + 50, { align: 'center' });
  pdf.text('>', pageWidth - margin - 20, margin + 50, { align: 'center' });

  // Statistics - compact layout below navigation
  const totalEvents = events.length;
  const totalHours = events.reduce((sum, event) => {
    return sum + (new Date(event.endTime).getTime() - new Date(event.startTime).getTime()) / (1000 * 60 * 60);
  }, 0);
  const availableHours = 24 - totalHours;
  const freeTimePercentage = Math.round((availableHours / 24) * 100);

  const statsY = margin + 65;  // Adjusted positioning for navigation elements
  const statsSpacing = 100;    // Tighter spacing for narrow screen
  
  // Statistics with proper sizing for reMarkable Paper Pro
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  
  // Appointments
  pdf.text(`${totalEvents}`, margin + 60, statsY, { align: 'center' });
  pdf.setFontSize(6);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Appointments', margin + 60, statsY + 8, { align: 'center' });
  
  // Scheduled
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`${totalHours.toFixed(1)}h`, margin + 60 + statsSpacing, statsY, { align: 'center' });
  pdf.setFontSize(6);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Scheduled', margin + 60 + statsSpacing, statsY + 8, { align: 'center' });
  
  // Available
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`${availableHours.toFixed(1)}h`, margin + 60 + statsSpacing * 2, statsY, { align: 'center' });
  pdf.setFontSize(6);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Available', margin + 60 + statsSpacing * 2, statsY + 8, { align: 'center' });
  
  // Free Time
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`${freeTimePercentage}%`, margin + 60 + statsSpacing * 3, statsY, { align: 'center' });
  pdf.setFontSize(6);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Free Time', margin + 60 + statsSpacing * 3, statsY + 8, { align: 'center' });
}

function drawDashboardLegend(pdf: jsPDF) {
  const { margin, pageWidth } = DAILY_CONFIG;
  const legendY = margin + 35;  // Compact positioning for reMarkable Paper Pro
  
  pdf.setFontSize(9);  // Proper legend font size
  pdf.setFont('helvetica', 'normal');
  
  // SimplePractice - compact positioning for reMarkable Paper Pro
  pdf.setFillColor(...DAILY_CONFIG.colors.white);
  pdf.setDrawColor(...DAILY_CONFIG.colors.simplePracticeBlue);
  pdf.rect(margin + 20, legendY, 12, 7, 'FD');
  pdf.setFillColor(...DAILY_CONFIG.colors.simplePracticeBlue);
  pdf.rect(margin + 20, legendY, 3, 7, 'F');
  pdf.text('SimplePractice', margin + 38, legendY + 5);
  
  // Google Calendar - compact positioning
  pdf.setFillColor(...DAILY_CONFIG.colors.white);
  pdf.setDrawColor(...DAILY_CONFIG.colors.googleGreen);
  pdf.setLineDash([2, 2]);
  pdf.rect(margin + 140, legendY, 12, 7, 'FD');
  pdf.setLineDash([]);
  pdf.text('Google Calendar', margin + 158, legendY + 5);
  
  // Holidays - compact positioning for reMarkable Paper Pro
  pdf.setFillColor(...DAILY_CONFIG.colors.holidayYellow);
  pdf.setDrawColor(...DAILY_CONFIG.colors.holidayOrange);
  pdf.rect(margin + 280, legendY, 12, 7, 'FD');
  pdf.text('Holidays', margin + 298, legendY + 5);
}

function drawDashboardGrid(pdf: jsPDF, selectedDate: Date, events: CalendarEvent[]) {
  const { margin, timeColumnWidth, appointmentColumnWidth, timeSlotHeight, headerHeight } = DAILY_CONFIG;
  const gridStartY = headerHeight;  // Grid starts after header space
  const totalGridHeight = timeSlotHeight * TIME_SLOTS.length;  // Full timeline to 23:30 (36 slots * 16px = 576px)
  
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
      pdf.setFillColor(...DAILY_CONFIG.colors.lightGray);  // Gray for top of hour (hour marks)
    } else {
      pdf.setFillColor(...DAILY_CONFIG.colors.white);  // White for bottom of hour (30-minute marks)
    }
    pdf.rect(2, y, timeColumnWidth + appointmentColumnWidth, timeSlotHeight, 'F');
    
    // Time label - centered both vertically and horizontally in the time column
    pdf.setFontSize(isHour ? DAILY_CONFIG.fonts.timeLabels.size + 1 : DAILY_CONFIG.fonts.timeLabels.size);
    pdf.setFont('helvetica', isHour ? 'bold' : 'normal');
    pdf.setTextColor(...DAILY_CONFIG.colors.black);
    pdf.text(timeSlot, 2 + timeColumnWidth / 2, y + timeSlotHeight / 2 + 2, { align: 'center' });
    
    // Grid lines - subtle like dashboard
    pdf.setDrawColor(...DAILY_CONFIG.colors.mediumGray);
    pdf.setLineWidth(0.5);
    pdf.line(2, y, 2 + timeColumnWidth + appointmentColumnWidth, y);
  });
  
  // Draw vertical separator between time and appointments (moved left to reduce time column space)
  pdf.setDrawColor(...DAILY_CONFIG.colors.mediumGray);
  pdf.setLineWidth(1);
  pdf.line(2 + timeColumnWidth, gridStartY, 2 + timeColumnWidth, gridStartY + totalGridHeight);
  
  // Draw bottom border to close the grid at 23:30
  pdf.setDrawColor(...DAILY_CONFIG.colors.mediumGray);
  pdf.setLineWidth(1);
  pdf.line(2, gridStartY + totalGridHeight, 2 + timeColumnWidth + appointmentColumnWidth, gridStartY + totalGridHeight);
  
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
    const topPosition = gridStartY + (slotIndex * timeSlotHeight);
    
    // Calculate height based on EXACT duration to fill the time slots completely
    const durationSlots = Math.ceil(durationMinutes / 30);
    const exactHeight = durationSlots * timeSlotHeight - 2; // Minimal gap for visual separation
    
    console.log(`📅 Event: ${event.title}`);
    console.log(`  ⏰ Start: ${formatMilitaryTime(eventStart)} (${startHour}:${startMinute.toString().padStart(2, '0')})`);
    console.log(`  ⏳ Duration: ${durationMinutes} minutes (${durationSlots} slots)`);
    console.log(`  📍 Slot index: ${slotIndex} (calculated: ${startHour - 6}*2 + ${startMinute >= 30 ? 1 : 0})`);
    console.log(`  📐 Top position: ${topPosition}px (gridStart: ${gridStartY} + slot: ${slotIndex} * height: ${timeSlotHeight})`);
    console.log(`  📏 Height: ${exactHeight}px`);
    
    // Minimum height for text visibility
    const minHeight = 45;
    
    // Calculate additional height needed for wrapped text with better spacing
    let maxContentLines = 3; // base: title, source, time
    if (event.notes && event.notes.trim()) {
      const noteLines = event.notes.split('\n').filter(n => n.trim()).length;
      maxContentLines = Math.max(maxContentLines, noteLines + 2); // +2 for header and spacing
    }
    if (event.actionItems && event.actionItems.trim()) {
      const actionLines = event.actionItems.split('\n').filter(a => a.trim()).length;
      maxContentLines = Math.max(maxContentLines, actionLines + 2); // +2 for header and spacing
    }
    
    const contentHeight = maxContentLines * 10 + 30;
    const height = Math.max(exactHeight, minHeight, contentHeight);
    
    // Event styling based on type
    const eventType = getEventTypeInfo(event);
    
    // Draw event background - always white like dashboard, aligned exactly with time slots
    pdf.setFillColor(...DAILY_CONFIG.colors.white);
    pdf.rect(2 + timeColumnWidth + 4, topPosition + 1, appointmentColumnWidth - 6, exactHeight, 'F');
    
    // Draw event borders based on type - match dashboard styling EXACTLY, aligned with time slots
    if (eventType.isSimplePractice) {
      // SimplePractice: white background with thin cornflower blue border and left flag
      pdf.setDrawColor(...DAILY_CONFIG.colors.simplePracticeBlue);
      pdf.setLineWidth(0.5);
      pdf.rect(2 + timeColumnWidth + 4, topPosition + 1, appointmentColumnWidth - 6, exactHeight, 'D');
      // Thin left flag (2px wide instead of 4px)
      pdf.setFillColor(...DAILY_CONFIG.colors.simplePracticeBlue);
      pdf.rect(2 + timeColumnWidth + 4, topPosition + 1, 2, exactHeight, 'F');
    } else if (eventType.isGoogle) {
      // Google Calendar: white background with dashed green border all around
      pdf.setDrawColor(...DAILY_CONFIG.colors.googleGreen);
      pdf.setLineWidth(0.5);
      pdf.setLineDash([3, 3]);
      pdf.rect(2 + timeColumnWidth + 4, topPosition + 1, appointmentColumnWidth - 6, exactHeight, 'D');
      pdf.setLineDash([]);
    } else {
      // Holiday: orange border around appointment
      pdf.setDrawColor(...DAILY_CONFIG.colors.holidayOrange);
      pdf.setLineWidth(0.5);
      pdf.rect(2 + timeColumnWidth + 4, topPosition + 1, appointmentColumnWidth - 6, exactHeight, 'D');
    }
    
    // Draw event content in 3-column layout optimized for reMarkable Paper Pro
    const eventX = 2 + timeColumnWidth + 10;
    const eventY = topPosition + 3;  // Position at the very top of the appointment square
    const columnWidth = (appointmentColumnWidth - 25) / 3;  // Wider columns for better text fitting
    
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
    
    // Source line below the name
    pdf.setFontSize(DAILY_CONFIG.fonts.eventSource.size);
    pdf.setFont('helvetica', DAILY_CONFIG.fonts.eventSource.weight);
    pdf.setTextColor(...DAILY_CONFIG.colors.black);
    pdf.text(eventType.source, eventX, eventY + 15);
    
    // Time range below the source
    pdf.setFontSize(DAILY_CONFIG.fonts.eventTime.size);
    pdf.setFont('helvetica', DAILY_CONFIG.fonts.eventTime.weight);
    pdf.setTextColor(...DAILY_CONFIG.colors.black);
    const timeRange = `${formatMilitaryTime(eventStart)} - ${formatMilitaryTime(eventEnd)}`;
    pdf.text(timeRange, eventX, eventY + 22);
    
    // Center column: Event Notes (if they exist)
    if (event.notes && event.notes.trim()) {
      pdf.setFontSize(DAILY_CONFIG.fonts.eventNotes.size + 1);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...DAILY_CONFIG.colors.black);
      const notesHeaderX = eventX + columnWidth + 2;
      pdf.text('Event Notes', notesHeaderX, eventY + 4);
      
      // Draw underline for Event Notes header
      pdf.setDrawColor(...DAILY_CONFIG.colors.black);
      pdf.setLineWidth(0.3);
      pdf.line(notesHeaderX, eventY + 5, notesHeaderX + 30, eventY + 5);
      
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
      const actionHeaderX = eventX + columnWidth * 2 + 2;
      pdf.text('Action Items', actionHeaderX, eventY + 4);
      
      // Draw underline for Action Items header
      pdf.setDrawColor(...DAILY_CONFIG.colors.black);
      pdf.setLineWidth(0.3);
      pdf.line(actionHeaderX, eventY + 5, actionHeaderX + 30, eventY + 5);
      
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
        const notesX = eventX + columnWidth + 2;
        const bulletStartY = eventY + 10; // Start where bullets begin
        
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
        const actionX = eventX + columnWidth * 2 + 2;
        const bulletStartY = eventY + 10; // Start where bullets begin
        
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
    
    console.log('Drawing legend...');
    drawDashboardLegend(pdf);
    
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