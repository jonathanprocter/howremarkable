import jsPDF from 'jspdf';
import { CalendarEvent } from '../types/calendar';
import { cleanEventTitle } from './titleCleaner';

// Daily PDF export that matches the actual DailyView component structure
const DAILY_CONFIG = {
  pageWidth: 612,   // 8.5 inches = 612 points
  pageHeight: 792,  // 11 inches = 792 points
  margin: 20,
  
  // Colors matching the actual DailyView component
  colors: {
    black: [0, 0, 0],
    gray: [128, 128, 128],
    lightGray: [240, 240, 240],
    white: [255, 255, 255],
    simplePracticeBlue: [100, 149, 237],
    googleGreen: [34, 197, 94],
    holidayOrange: [245, 158, 11],
    statsBackground: [240, 240, 240],
    headerBackground: [248, 248, 248],
    separatorGray: [200, 200, 200]
  },
  
  fonts: {
    title: 16,
    subtitle: 12,
    stats: 10,
    timeLabels: 9,
    eventTitle: 9,
    eventMeta: 7,
    legend: 7,
    navButton: 8
  }
};

// Time slots matching the DailyView component (6:00 to 23:30)
const TIME_SLOTS = [
  '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30',
  '22:00', '22:30', '23:00', '23:30'
];

function getEventCalendarSource(event: CalendarEvent) {
  if (event.calendarId === '0np7sib5u30o7oc297j5pb259g') {
    return 'SimplePractice';
  } else if (event.calendarId === 'en.usa#holiday@group.v.calendar.google.com') {
    return 'Holidays in United States';
  } else {
    return 'Google Calendar';
  }
}

function getEventColorClass(event: CalendarEvent) {
  if (event.calendarId === 'en.usa#holiday@group.v.calendar.google.com') {
    return 'personal';
  } else if (event.title.toLowerCase().includes('haircut') ||
             event.title.toLowerCase().includes('dan re:') ||
             event.title.toLowerCase().includes('blake') ||
             event.title.toLowerCase().includes('phone call')) {
    return 'google-calendar';
  } else {
    return 'simplepractice';
  }
}

function isAllDayEvent(event: CalendarEvent) {
  const isMarkedAllDay = (event as any).isAllDay;
  const duration = event.endTime.getTime() - event.startTime.getTime();
  const hours = duration / (1000 * 60 * 60);
  const startHour = event.startTime.getHours();
  const startMinute = event.startTime.getMinutes();
  const isFullDay = startHour === 0 && startMinute === 0 && (hours === 24 || hours % 24 === 0);
  return isMarkedAllDay || isFullDay || hours >= 20;
}

function formatEventTime(event: CalendarEvent) {
  const start = new Date(event.startTime);
  const end = new Date(event.endTime);
  const startTime = start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  const endTime = end.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${startTime}-${endTime}`;
}

function drawHeader(pdf: jsPDF, selectedDate: Date, totalEvents: number) {
  const { margin, colors, fonts } = DAILY_CONFIG;
  
  // Header background
  pdf.setFillColor(...colors.headerBackground);
  pdf.rect(margin, margin, DAILY_CONFIG.pageWidth - 2 * margin, 50, 'F');
  
  // Navigation buttons (left and right)
  const prevDay = new Date(selectedDate);
  prevDay.setDate(prevDay.getDate() - 1);
  const nextDay = new Date(selectedDate);
  nextDay.setDate(nextDay.getDate() + 1);
  
  const prevDayName = prevDay.toLocaleDateString('en-US', { weekday: 'long' });
  const nextDayName = nextDay.toLocaleDateString('en-US', { weekday: 'long' });
  
  // Previous day button (left)
  pdf.setFillColor(...colors.white);
  pdf.setDrawColor(...colors.gray);
  pdf.rect(margin + 5, margin + 8, 70, 16, 'FD');
  pdf.setFontSize(fonts.navButton);
  pdf.setTextColor(...colors.black);
  pdf.text(`← ${prevDayName}`, margin + 8, margin + 18);
  
  // Next day button (right)
  pdf.rect(DAILY_CONFIG.pageWidth - margin - 75, margin + 8, 70, 16, 'FD');
  pdf.text(`${nextDayName} →`, DAILY_CONFIG.pageWidth - margin - 72, margin + 18);
  
  // Weekly Overview button (center top)
  pdf.rect((DAILY_CONFIG.pageWidth - 80) / 2, margin + 8, 80, 16, 'FD');
  pdf.text('📅 Weekly Overview', (DAILY_CONFIG.pageWidth - 80) / 2 + 3, margin + 18);
  
  // Page title (center)
  const dayName = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
  const dateString = selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  
  pdf.setFontSize(fonts.title);
  pdf.setFont('helvetica', 'bold');
  const titleText = `${dayName}, ${dateString}`;
  const titleWidth = pdf.getTextWidth(titleText);
  pdf.text(titleText, (DAILY_CONFIG.pageWidth - titleWidth) / 2, margin + 32);
  
  pdf.setFontSize(fonts.subtitle);
  pdf.setFont('helvetica', 'normal');
  const subtitleText = `${totalEvents} appointments`;
  const subtitleWidth = pdf.getTextWidth(subtitleText);
  pdf.text(subtitleText, (DAILY_CONFIG.pageWidth - subtitleWidth) / 2, margin + 45);
  
  // Legend (right side, smaller)
  const legendX = DAILY_CONFIG.pageWidth - margin - 90;
  pdf.setFontSize(fonts.legend);
  
  // SimplePractice legend
  pdf.setFillColor(...colors.simplePracticeBlue);
  pdf.rect(legendX, margin + 30, 6, 4, 'F');
  pdf.setTextColor(...colors.black);
  pdf.text('SP', legendX + 8, margin + 33);
  
  // Google Calendar legend
  pdf.setFillColor(...colors.googleGreen);
  pdf.rect(legendX + 25, margin + 30, 6, 4, 'F');
  pdf.text('GC', legendX + 33, margin + 33);
  
  // Holidays legend
  pdf.setFillColor(...colors.holidayOrange);
  pdf.rect(legendX + 50, margin + 30, 6, 4, 'F');
  pdf.text('H', legendX + 58, margin + 33);
  
  return margin + 60; // Return Y position for next section
}

function drawStats(pdf: jsPDF, events: CalendarEvent[], yPosition: number) {
  const { margin, colors, fonts } = DAILY_CONFIG;
  
  // Calculate statistics
  const totalEvents = events.length;
  const totalHours = events.reduce((sum, event) => {
    return sum + (event.endTime.getTime() - event.startTime.getTime()) / (1000 * 60 * 60);
  }, 0);
  const availableHours = 24 - totalHours;
  const freeTimePercentage = Math.round((availableHours / 24) * 100);
  
  // Stats background
  pdf.setFillColor(...colors.statsBackground);
  pdf.rect(margin, yPosition, DAILY_CONFIG.pageWidth - 2 * margin, 30, 'F');
  
  // Stats items
  const statsWidth = (DAILY_CONFIG.pageWidth - 2 * margin) / 4;
  pdf.setFontSize(fonts.stats);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...colors.black);
  
  const stats = [
    { label: 'Appointments', value: totalEvents.toString() },
    { label: 'Scheduled', value: `${totalHours.toFixed(1)}h` },
    { label: 'Available', value: `${availableHours.toFixed(1)}h` },
    { label: 'Free Time', value: `${freeTimePercentage}%` }
  ];
  
  stats.forEach((stat, index) => {
    const x = margin + (index * statsWidth) + (statsWidth / 2);
    // Center the stat value
    const valueWidth = pdf.getTextWidth(stat.value);
    pdf.text(stat.value, x - (valueWidth / 2), yPosition + 12);
    
    // Center the stat label
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(fonts.legend);
    const labelWidth = pdf.getTextWidth(stat.label);
    pdf.text(stat.label, x - (labelWidth / 2), yPosition + 24);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(fonts.stats);
  });
  
  return yPosition + 40; // Return Y position for next section
}

function drawAllDayEvents(pdf: jsPDF, events: CalendarEvent[], yPosition: number) {
  const { margin, colors, fonts } = DAILY_CONFIG;
  
  const allDayEvents = events.filter(isAllDayEvent);
  
  if (allDayEvents.length === 0) {
    return yPosition; // No all-day events, return same position
  }
  
  // All Day title
  pdf.setFontSize(fonts.subtitle);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...colors.black);
  pdf.text('All Day', margin, yPosition + 15);
  
  let currentY = yPosition + 25;
  
  // Draw all-day events
  allDayEvents.forEach(event => {
    const colorClass = getEventColorClass(event);
    let fillColor = colors.white;
    let borderColor = colors.gray;
    
    if (colorClass === 'simplepractice') {
      borderColor = colors.simplePracticeBlue;
    } else if (colorClass === 'google-calendar') {
      borderColor = colors.googleGreen;
    } else if (colorClass === 'personal') {
      fillColor = colors.holidayOrange;
      borderColor = colors.holidayOrange;
    }
    
    // Event box
    pdf.setFillColor(...fillColor);
    pdf.setDrawColor(...borderColor);
    pdf.rect(margin, currentY, DAILY_CONFIG.pageWidth - 2 * margin, 20, 'FD');
    
    // Event title
    pdf.setFontSize(fonts.eventTitle);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...colors.black);
    pdf.text(cleanEventTitle(event.title), margin + 5, currentY + 12);
    
    currentY += 25;
  });
  
  return currentY + 10; // Return Y position for next section
}

function drawScheduleGrid(pdf: jsPDF, events: CalendarEvent[], yPosition: number) {
  const { margin, colors, fonts } = DAILY_CONFIG;
  
  // Filter out all-day events
  const timedEvents = events.filter(event => !isAllDayEvent(event));
  
  const timeColumnWidth = 65;
  const appointmentColumnWidth = DAILY_CONFIG.pageWidth - 2 * margin - timeColumnWidth;
  const slotHeight = 20;
  const gridHeight = TIME_SLOTS.length * slotHeight;
  
  // Draw time column header
  pdf.setFillColor(...colors.headerBackground);
  pdf.setDrawColor(...colors.black);
  pdf.rect(margin, yPosition, timeColumnWidth, 25, 'FD');
  pdf.setFontSize(fonts.eventTitle);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...colors.black);
  pdf.text('TIME', margin + 20, yPosition + 15);
  
  // Draw appointment column header
  pdf.rect(margin + timeColumnWidth, yPosition, appointmentColumnWidth, 25, 'FD');
  pdf.text('APPOINTMENTS', margin + timeColumnWidth + 20, yPosition + 15);
  
  const gridStartY = yPosition + 25;
  
  // Draw time slots
  TIME_SLOTS.forEach((time, index) => {
    const slotY = gridStartY + (index * slotHeight);
    const isHour = time.endsWith(':00');
    
    // Time slot background
    pdf.setFillColor(...(isHour ? colors.lightGray : colors.white));
    pdf.rect(margin, slotY, timeColumnWidth, slotHeight, 'F');
    
    // Time slot border
    pdf.setDrawColor(...colors.gray);
    pdf.setLineWidth(0.5);
    pdf.rect(margin, slotY, timeColumnWidth, slotHeight, 'S');
    
    // Time label
    pdf.setFontSize(fonts.timeLabels);
    pdf.setFont('helvetica', isHour ? 'bold' : 'normal');
    pdf.setTextColor(...colors.black);
    const timeWidth = pdf.getTextWidth(time);
    pdf.text(time, margin + timeColumnWidth - timeWidth - 5, slotY + 12);
    
    // Appointment slot background
    pdf.setFillColor(...(isHour ? colors.lightGray : colors.white));
    pdf.rect(margin + timeColumnWidth, slotY, appointmentColumnWidth, slotHeight, 'F');
    
    // Appointment slot border
    pdf.rect(margin + timeColumnWidth, slotY, appointmentColumnWidth, slotHeight, 'S');
  });
  
  // Draw timed events
  timedEvents.forEach(event => {
    const eventStart = new Date(event.startTime);
    const eventEnd = new Date(event.endTime);
    const durationMinutes = (eventEnd.getTime() - eventStart.getTime()) / (1000 * 60);
    
    // Calculate position
    const startHour = eventStart.getHours();
    const startMinute = eventStart.getMinutes();
    const minutesSince6am = (startHour - 6) * 60 + startMinute;
    const slotIndex = Math.floor(minutesSince6am / 30);
    
    if (slotIndex >= 0 && slotIndex < TIME_SLOTS.length) {
      const eventY = gridStartY + (slotIndex * slotHeight);
      const baseEventHeight = Math.max(slotHeight, (durationMinutes / 30) * slotHeight);
      
      // Calculate additional height needed for notes/actions
      const hasNotes = event.notes && event.notes.trim();
      const hasActions = event.actionItems && event.actionItems.trim();
      let additionalHeight = 0;
      
      if (hasNotes || hasActions) {
        const notesLines = hasNotes ? event.notes.split('\n').filter(n => n.trim()).length : 0;
        const actionsLines = hasActions ? event.actionItems.split('\n').filter(a => a.trim()).length : 0;
        const maxLines = Math.max(notesLines, actionsLines);
        additionalHeight = Math.max(0, (maxLines * 8) - 20); // Extra space for content
      }
      
      const eventHeight = baseEventHeight + additionalHeight;
      
      // Determine event styling
      const colorClass = getEventColorClass(event);
      let fillColor = colors.white;
      let borderColor = colors.gray;
      
      if (colorClass === 'simplepractice') {
        borderColor = colors.simplePracticeBlue;
      } else if (colorClass === 'google-calendar') {
        borderColor = colors.googleGreen;
      } else if (colorClass === 'personal') {
        fillColor = colors.holidayOrange;
        borderColor = colors.holidayOrange;
      }
      
      // Event box
      pdf.setFillColor(...fillColor);
      pdf.setDrawColor(...borderColor);
      pdf.setLineWidth(1);
      pdf.rect(margin + timeColumnWidth + 2, eventY + 1, appointmentColumnWidth - 4, eventHeight - 2, 'FD');
      
      // Event content in 3-column layout with vertical separators
      const eventX = margin + timeColumnWidth + 6;
      const columnWidth = (appointmentColumnWidth - 20) / 3;
      
      // Determine layout: use 3 columns if has notes or actions, otherwise single column
      const useThreeColumns = hasNotes || hasActions;
      
      if (useThreeColumns) {
        // Draw vertical separators between columns
        pdf.setDrawColor(...colors.separatorGray);
        pdf.setLineWidth(1);
        
        // First vertical separator (between left and center columns)
        const sep1X = eventX + columnWidth;
        pdf.line(sep1X, eventY + 2, sep1X, eventY + eventHeight - 4);
        
        // Second vertical separator (between center and right columns)
        const sep2X = eventX + columnWidth * 2;
        pdf.line(sep2X, eventY + 2, sep2X, eventY + eventHeight - 4);
        
        // Left column: Title, source, time
        pdf.setFontSize(fonts.eventTitle);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...colors.black);
        const titleLines = pdf.splitTextToSize(cleanEventTitle(event.title), columnWidth - 8);
        let textY = eventY + 12;
        titleLines.forEach(line => {
          pdf.text(line, eventX + 2, textY);
          textY += 10;
        });
        
        pdf.setFontSize(fonts.eventMeta);
        pdf.setFont('helvetica', 'normal');
        pdf.text(getEventCalendarSource(event), eventX + 2, textY + 2);
        pdf.text(formatEventTime(event), eventX + 2, textY + 10);
        
        // Center column: Event Notes (if they exist)
        if (hasNotes) {
          const notesX = eventX + columnWidth + 4;
          pdf.setFontSize(fonts.eventMeta);
          pdf.setFont('helvetica', 'bold');
          pdf.text('Event Notes', notesX, eventY + 12);
          
          pdf.setFont('helvetica', 'normal');
          const notes = event.notes.split('\n')
            .filter(note => note.trim().length > 0)
            .map(note => note.trim().replace(/^[•\s-]+/, '').trim())
            .filter(note => note.length > 0);
          
          let noteY = eventY + 22;
          notes.forEach(note => {
            const noteLines = pdf.splitTextToSize(`• ${note}`, columnWidth - 8);
            noteLines.forEach(line => {
              pdf.text(line, notesX, noteY);
              noteY += 8;
            });
            noteY += 2; // Small gap between notes
          });
        }
        
        // Right column: Action Items (if they exist)
        if (hasActions) {
          const actionsX = eventX + columnWidth * 2 + 4;
          pdf.setFontSize(fonts.eventMeta);
          pdf.setFont('helvetica', 'bold');
          pdf.text('Action Items', actionsX, eventY + 12);
          
          pdf.setFont('helvetica', 'normal');
          const actions = event.actionItems.split('\n')
            .filter(item => item.trim().length > 0)
            .map(item => item.trim().replace(/^[•\s-]+/, '').trim())
            .filter(item => item.length > 0);
          
          let actionY = eventY + 22;
          actions.forEach(action => {
            const actionLines = pdf.splitTextToSize(`• ${action}`, columnWidth - 8);
            actionLines.forEach(line => {
              pdf.text(line, actionsX, actionY);
              actionY += 8;
            });
            actionY += 2; // Small gap between actions
          });
        }
      } else {
        // Single column layout for appointments without notes/actions
        pdf.setFontSize(fonts.eventTitle);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...colors.black);
        const titleLines = pdf.splitTextToSize(cleanEventTitle(event.title), appointmentColumnWidth - 16);
        let textY = eventY + 12;
        titleLines.forEach(line => {
          pdf.text(line, eventX + 2, textY);
          textY += 10;
        });
        
        pdf.setFontSize(fonts.eventMeta);
        pdf.setFont('helvetica', 'normal');
        pdf.text(getEventCalendarSource(event), eventX + 2, textY + 2);
        pdf.text(formatEventTime(event), eventX + 2, textY + 10);
      }
    }
  });
  
  return gridStartY + gridHeight + 20; // Return Y position for next section
}

export const exportMatchingDailyPDF = async (
  selectedDate: Date,
  events: CalendarEvent[]
): Promise<void> => {
  console.log('=== MATCHING DAILY PDF EXPORT ===');
  console.log('Selected date:', selectedDate.toDateString());
  console.log('Total events:', events.length);
  
  // Filter events for selected date
  const dayEvents = events.filter(event => {
    const eventDate = new Date(event.startTime);
    const matches = eventDate.toDateString() === selectedDate.toDateString();
    if (matches) {
      console.log(`✓ Event included: ${event.title}`);
    }
    return matches;
  });
  
  console.log('Day events:', dayEvents.length);
  
  // Create PDF
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: [DAILY_CONFIG.pageWidth, DAILY_CONFIG.pageHeight]
  });
  
  // White background
  pdf.setFillColor(...DAILY_CONFIG.colors.white);
  pdf.rect(0, 0, DAILY_CONFIG.pageWidth, DAILY_CONFIG.pageHeight, 'F');
  
  // Draw sections in order
  let currentY = drawHeader(pdf, selectedDate, dayEvents.length);
  currentY = drawStats(pdf, dayEvents, currentY);
  currentY = drawAllDayEvents(pdf, dayEvents, currentY);
  currentY = drawScheduleGrid(pdf, dayEvents, currentY);
  
  // Save PDF
  const fileName = `daily-planner-matching-${selectedDate.toISOString().split('T')[0]}.pdf`;
  pdf.save(fileName);
  
  console.log(`PDF saved as: ${fileName}`);
  console.log('=== MATCHING DAILY PDF EXPORT COMPLETE ===');
};