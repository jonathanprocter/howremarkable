import jsPDF from 'jspdf';
import { CalendarEvent } from '../types/calendar';

/**
 * Browser-Matching PDF Export
 * Creates PDF exports that exactly match what's displayed in the browser
 */

export const exportBrowserMatchingWeeklyPDF = async (
  weekStartDate: Date,
  weekEndDate: Date,
  events: CalendarEvent[]
): Promise<void> => {
  console.log('🔄 Creating browser-matching weekly PDF...');

  // Create PDF with exact browser size - NO SCALING
  // Total width needed: 80px + (137.79 * 7) = 1044.53px
  // Add margins: 40px total = 1084.53px
  // Height needed: 120px header + (40px * 36 slots) + 40px = 1600px
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'px',
    format: [1085, 1600]  // Exact size needed for browser measurements
  });

  // USE EXACT BROWSER MEASUREMENTS - NO CALCULATIONS
  const config = {
    margin: 20,
    timeColumnWidth: 80,           // EXACT from debugging
    dayColumnWidth: 137.79296875,  // EXACT from debugging  
    timeSlotHeight: 40,            // EXACT from debugging
    headerHeight: 120
  };
  
  console.log('📊 Using EXACT browser measurements:', config);

  const gridStartX = config.margin;
  const gridStartY = config.margin + config.headerHeight;
  const totalGridWidth = config.timeColumnWidth + (config.dayColumnWidth * 7);

  // White background
  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, 1085, 1600, 'F');

  // HEADER - exactly match browser title
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(20);
  pdf.setTextColor(0, 0, 0);
  pdf.text('WEEKLY CALENDAR', 1085 / 2, config.margin + 25, { align: 'center' });

  // Week info
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(14);
  const weekStart = weekStartDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  const weekEnd = weekEndDate.toLocaleDateString('en-US', { day: 'numeric' });
  pdf.text(`${weekStart} - ${weekEnd}, 2025`, 1085 / 2, config.margin + 45, { align: 'center' });

  // LEGEND - moved to top below header
  const legendY = config.margin + 60;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  
  // Center the legend items
  const legendStartX = 1085 / 2 - 180; // Center 3 items spanning about 360px
  
  // SimplePractice legend
  pdf.setFillColor(255, 255, 255);
  pdf.rect(legendStartX, legendY, 20, 10, 'F');
  pdf.setDrawColor(100, 149, 237);
  pdf.setLineWidth(1);
  pdf.rect(legendStartX, legendY, 20, 10, 'S');
  pdf.setLineWidth(2);
  pdf.line(legendStartX, legendY, legendStartX, legendY + 10);
  pdf.setTextColor(0, 0, 0);
  pdf.text('SimplePractice', legendStartX + 25, legendY + 7);
  
  // Google Calendar legend
  pdf.setFillColor(255, 255, 255);
  pdf.rect(legendStartX + 150, legendY, 20, 10, 'F');
  pdf.setDrawColor(34, 197, 94);
  pdf.setLineWidth(1);
  for (let i = 0; i < 20; i += 6) {
    pdf.line(legendStartX + 150 + i, legendY, legendStartX + 150 + Math.min(i + 3, 20), legendY);
    pdf.line(legendStartX + 150 + i, legendY + 10, legendStartX + 150 + Math.min(i + 3, 20), legendY + 10);
  }
  for (let i = 0; i < 10; i += 6) {
    pdf.line(legendStartX + 150, legendY + i, legendStartX + 150, legendY + Math.min(i + 3, 10));
    pdf.line(legendStartX + 170, legendY + i, legendStartX + 170, legendY + Math.min(i + 3, 10));
  }
  pdf.text('Google Calendar', legendStartX + 175, legendY + 7);
  
  // Holiday legend
  pdf.setFillColor(255, 235, 59);
  pdf.rect(legendStartX + 320, legendY, 20, 10, 'F');
  pdf.setDrawColor(245, 158, 11);
  pdf.setLineWidth(1);
  pdf.rect(legendStartX + 320, legendY, 20, 10, 'S');
  pdf.text('Holidays', legendStartX + 345, legendY + 7);

  // GRID STRUCTURE - match browser exactly
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(1);

  // Main grid border
  pdf.rect(gridStartX, gridStartY, totalGridWidth, config.timeSlotHeight * 36, 'S'); // 6:00-23:30 = 36 slots

  // TIME COLUMN
  pdf.setFillColor(240, 240, 240); // Gray background for header
  pdf.rect(gridStartX, gridStartY, config.timeColumnWidth, config.timeSlotHeight, 'F');
  pdf.rect(gridStartX, gridStartY, config.timeColumnWidth, config.timeSlotHeight, 'S');
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(0, 0, 0);
  pdf.text('TIME', gridStartX + config.timeColumnWidth/2, gridStartY + config.timeSlotHeight/2 + 3, { align: 'center' });

  // DAY HEADERS - match browser day format
  const dayNames = ['MON 7', 'TUE 8', 'WED 9', 'THU 10', 'FRI 11', 'SAT 12', 'SUN 13'];
  dayNames.forEach((dayName, index) => {
    const dayX = gridStartX + config.timeColumnWidth + (index * config.dayColumnWidth);
    
    // Gray header background
    pdf.setFillColor(240, 240, 240);
    pdf.rect(dayX, gridStartY, config.dayColumnWidth, config.timeSlotHeight, 'F');
    pdf.rect(dayX, gridStartY, config.dayColumnWidth, config.timeSlotHeight, 'S');
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.text(dayName, dayX + config.dayColumnWidth/2, gridStartY + config.timeSlotHeight/2 + 3, { align: 'center' });
  });

  // TIME SLOTS - exactly match browser time display
  for (let slot = 0; slot < 36; slot++) {
    const hour = Math.floor(slot / 2) + 6;
    const minute = (slot % 2) * 30;
    const timeY = gridStartY + ((slot + 1) * config.timeSlotHeight);
    
    // Time slot background (alternating like browser)
    if (slot % 2 === 0) {
      pdf.setFillColor(248, 248, 248); // Light gray for hour rows
    } else {
      pdf.setFillColor(255, 255, 255); // White for half-hour rows
    }
    pdf.rect(gridStartX, timeY, totalGridWidth, config.timeSlotHeight, 'F');
    
    // Horizontal line
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.5);
    pdf.line(gridStartX, timeY, gridStartX + totalGridWidth, timeY);
    
    // Time label - match browser format
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(slot % 2 === 0 ? 9 : 8); // Slightly larger for hour labels
    pdf.setTextColor(0, 0, 0);
    const timeLabel = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    pdf.text(timeLabel, gridStartX + config.timeColumnWidth/2, timeY + config.timeSlotHeight/2 + 2, { align: 'center' });
  }

  // VERTICAL DAY SEPARATORS
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(1);
  for (let day = 0; day <= 7; day++) {
    const lineX = gridStartX + config.timeColumnWidth + (day * config.dayColumnWidth);
    pdf.line(lineX, gridStartY, lineX, gridStartY + (config.timeSlotHeight * 36));
  }

  // EVENTS - match browser styling exactly
  const weekEvents = events.filter(event => {
    const eventDate = new Date(event.startTime);
    return eventDate >= weekStartDate && eventDate <= weekEndDate;
  });

  console.log(`Rendering ${weekEvents.length} events...`);

  weekEvents.forEach(event => {
    const eventDate = new Date(event.startTime);
    const eventEnd = new Date(event.endTime);
    
    // Calculate day column (0-6 for Mon-Sun)
    const dayOfWeek = (eventDate.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0 format
    
    // Calculate time slot position
    const startHour = eventDate.getHours();
    const startMinute = eventDate.getMinutes();
    const startSlot = ((startHour - 6) * 2) + (startMinute >= 30 ? 1 : 0);
    
    const endHour = eventEnd.getHours();
    const endMinute = eventEnd.getMinutes();
    const endSlot = ((endHour - 6) * 2) + (endMinute >= 30 ? 1 : 0);
    
    if (startSlot < 0 || startSlot >= 36) return; // Skip events outside time range
    
    const eventX = gridStartX + config.timeColumnWidth + (dayOfWeek * config.dayColumnWidth) + 2;
    const eventY = gridStartY + ((startSlot + 1) * config.timeSlotHeight) + 2;
    const eventWidth = config.dayColumnWidth - 4;
    const eventHeight = Math.max((endSlot - startSlot) * config.timeSlotHeight - 4, config.timeSlotHeight - 4);
    
    // Event styling based on source (match browser exactly)
    pdf.setFillColor(255, 255, 255); // White background for all events
    
    if (event.title.toLowerCase().includes('appointment')) {
      // SimplePractice appointments - cornflower blue border with thick left flag
      pdf.rect(eventX, eventY, eventWidth, eventHeight, 'F');
      pdf.setDrawColor(100, 149, 237); // Cornflower blue
      pdf.setLineWidth(1);
      pdf.rect(eventX, eventY, eventWidth, eventHeight, 'S');
      // Thick left border flag
      pdf.setLineWidth(4);
      pdf.line(eventX, eventY, eventX, eventY + eventHeight);
    } else if (event.source === 'google') {
      // Google Calendar events - dashed green border
      pdf.rect(eventX, eventY, eventWidth, eventHeight, 'F');
      pdf.setDrawColor(34, 197, 94); // Green
      pdf.setLineWidth(1);
      // Dashed border (approximate with short lines)
      const dashLength = 3;
      for (let i = 0; i < eventWidth; i += dashLength * 2) {
        pdf.line(eventX + i, eventY, eventX + Math.min(i + dashLength, eventWidth), eventY);
        pdf.line(eventX + i, eventY + eventHeight, eventX + Math.min(i + dashLength, eventWidth), eventY + eventHeight);
      }
      for (let i = 0; i < eventHeight; i += dashLength * 2) {
        pdf.line(eventX, eventY + i, eventX, eventY + Math.min(i + dashLength, eventHeight));
        pdf.line(eventX + eventWidth, eventY + i, eventX + eventWidth, eventY + Math.min(i + dashLength, eventHeight));
      }
    } else {
      // Holiday/other events - orange border
      pdf.rect(eventX, eventY, eventWidth, eventHeight, 'F');
      pdf.setDrawColor(245, 158, 11); // Orange
      pdf.setLineWidth(1);
      pdf.rect(eventX, eventY, eventWidth, eventHeight, 'S');
    }
    
    // Event text - match browser font and size
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(0, 0, 0);
    
    // Event title (remove "Appointment" suffix like browser)
    let displayTitle = event.title;
    if (displayTitle.toLowerCase().includes(' appointment')) {
      displayTitle = displayTitle.replace(/ appointment$/i, '');
    }
    
    // Truncate if too long
    if (displayTitle.length > 15) {
      displayTitle = displayTitle.substring(0, 15) + '...';
    }
    
    pdf.text(displayTitle, eventX + 3, eventY + 12);
    
    // Time display
    pdf.setFontSize(7);
    const timeDisplay = `${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}-${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
    pdf.text(timeDisplay, eventX + 3, eventY + eventHeight - 5);
  });

  // Legend is now at the top

  // Save PDF
  const filename = `browser-matching-weekly-${weekStartDate.getFullYear()}-${String(weekStartDate.getMonth() + 1).padStart(2, '0')}-${String(weekStartDate.getDate()).padStart(2, '0')}.pdf`;
  pdf.save(filename);
  
  console.log(`✅ Browser-matching weekly PDF saved: ${filename}`);
};

export const exportBrowserMatchingDailyPDF = async (
  selectedDate: Date,
  events: CalendarEvent[]
): Promise<void> => {
  console.log('🔄 Creating browser-matching daily PDF...');

  // Create PDF with 8.5x11 portrait format
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: [612, 792]
  });

  // Filter events for selected date
  const dayEvents = events.filter(event => {
    const eventDate = new Date(event.startTime);
    return eventDate.toDateString() === selectedDate.toDateString();
  });

  console.log(`Found ${dayEvents.length} events for ${selectedDate.toDateString()}`);

  // Configuration for daily view
  const config = {
    margin: 30,
    timeColumnWidth: 80,
    appointmentColumnWidth: 502,
    timeSlotHeight: 20,
    headerHeight: 100
  };

  const gridStartY = config.margin + config.headerHeight;

  // White background
  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, 612, 792, 'F');

  // HEADER
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(24);
  pdf.setTextColor(0, 0, 0);
  pdf.text('DAILY PLANNER', 612 / 2, config.margin + 30, { align: 'center' });

  // Date
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(16);
  const dateStr = selectedDate.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  pdf.text(dateStr, 612 / 2, config.margin + 60, { align: 'center' });

  // Navigation buttons
  const buttonWidth = 100;
  const buttonHeight = 25;
  
  // Back to week button
  pdf.setFillColor(245, 245, 245);
  pdf.rect(config.margin, config.margin + 70, buttonWidth, buttonHeight, 'F');
  pdf.setDrawColor(200, 200, 200);
  pdf.setLineWidth(1);
  pdf.rect(config.margin, config.margin + 70, buttonWidth, buttonHeight, 'S');
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(0, 0, 0);
  pdf.text('← Back to Week', config.margin + buttonWidth/2, config.margin + 70 + buttonHeight/2 + 3, { align: 'center' });

  // Previous/Next day buttons
  pdf.setFillColor(245, 245, 245);
  pdf.rect(612 - config.margin - buttonWidth - 30, config.margin + 70, 25, buttonHeight, 'F');
  pdf.rect(612 - config.margin - buttonWidth - 30, config.margin + 70, 25, buttonHeight, 'S');
  pdf.text('<', 612 - config.margin - buttonWidth - 30 + 12, config.margin + 70 + buttonHeight/2 + 3, { align: 'center' });
  
  pdf.rect(612 - config.margin - 25, config.margin + 70, 25, buttonHeight, 'F');
  pdf.rect(612 - config.margin - 25, config.margin + 70, 25, buttonHeight, 'S');
  pdf.text('>', 612 - config.margin - 25 + 12, config.margin + 70 + buttonHeight/2 + 3, { align: 'center' });

  // GRID HEADERS
  pdf.setFillColor(255, 255, 255); // White headers like browser
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(1);
  
  // Time header
  pdf.rect(config.margin, gridStartY, config.timeColumnWidth, config.timeSlotHeight, 'F');
  pdf.rect(config.margin, gridStartY, config.timeColumnWidth, config.timeSlotHeight, 'S');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.text('TIME', config.margin + config.timeColumnWidth/2, gridStartY + config.timeSlotHeight/2 + 3, { align: 'center' });

  // Appointment header
  pdf.rect(config.margin + config.timeColumnWidth, gridStartY, config.appointmentColumnWidth, config.timeSlotHeight, 'F');
  pdf.rect(config.margin + config.timeColumnWidth, gridStartY, config.appointmentColumnWidth, config.timeSlotHeight, 'S');
  pdf.text('APPOINTMENTS', config.margin + config.timeColumnWidth + config.appointmentColumnWidth/2, gridStartY + config.timeSlotHeight/2 + 3, { align: 'center' });

  // TIME GRID - 6:00 to 23:30 (36 slots)
  for (let slot = 0; slot < 36; slot++) {
    const hour = Math.floor(slot / 2) + 6;
    const minute = (slot % 2) * 30;
    const timeY = gridStartY + ((slot + 1) * config.timeSlotHeight);
    
    // Alternating row backgrounds (match browser)
    if (slot % 2 === 0) {
      pdf.setFillColor(240, 240, 240); // Gray for hour rows
    } else {
      pdf.setFillColor(248, 248, 248); // Light gray for half-hour rows
    }
    pdf.rect(config.margin, timeY, config.timeColumnWidth + config.appointmentColumnWidth, config.timeSlotHeight, 'F');
    
    // Grid lines
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.5);
    pdf.line(config.margin, timeY, config.margin + config.timeColumnWidth + config.appointmentColumnWidth, timeY);
    
    // Time labels
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(slot % 2 === 0 ? 10 : 9);
    pdf.setTextColor(0, 0, 0);
    const timeLabel = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    pdf.text(timeLabel, config.margin + config.timeColumnWidth/2, timeY + config.timeSlotHeight/2 + 2, { align: 'center' });
  }

  // Vertical separator between time and appointments
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(1);
  pdf.line(config.margin + config.timeColumnWidth, gridStartY, config.margin + config.timeColumnWidth, gridStartY + (36 * config.timeSlotHeight));

  // APPOINTMENTS
  dayEvents.forEach(event => {
    const eventStart = new Date(event.startTime);
    const eventEnd = new Date(event.endTime);
    
    const startHour = eventStart.getHours();
    const startMinute = eventStart.getMinutes();
    const startSlot = ((startHour - 6) * 2) + (startMinute >= 30 ? 1 : 0);
    
    const endHour = eventEnd.getHours();
    const endMinute = eventEnd.getMinutes();
    const endSlot = ((endHour - 6) * 2) + (endMinute >= 30 ? 1 : 0);
    
    if (startSlot < 0 || startSlot >= 36) return; // Skip events outside time range
    
    const eventX = config.margin + config.timeColumnWidth + 5;
    const eventY = gridStartY + ((startSlot + 1) * config.timeSlotHeight) + 2;
    const eventWidth = config.appointmentColumnWidth - 10;
    const eventHeight = Math.max((endSlot - startSlot) * config.timeSlotHeight - 4, config.timeSlotHeight - 4);
    
    // Event background - white
    pdf.setFillColor(255, 255, 255);
    pdf.rect(eventX, eventY, eventWidth, eventHeight, 'F');
    
    // Event border based on source
    if (event.title.toLowerCase().includes('appointment')) {
      // SimplePractice - cornflower blue with thick left flag
      pdf.setDrawColor(100, 149, 237);
      pdf.setLineWidth(1);
      pdf.rect(eventX, eventY, eventWidth, eventHeight, 'S');
      pdf.setLineWidth(4);
      pdf.line(eventX, eventY, eventX, eventY + eventHeight);
    } else if (event.source === 'google') {
      // Google Calendar - dashed green
      pdf.setDrawColor(34, 197, 94);
      pdf.setLineWidth(1);
      // Simplified dashed border
      pdf.rect(eventX, eventY, eventWidth, eventHeight, 'S');
    } else {
      // Holiday - orange
      pdf.setDrawColor(245, 158, 11);
      pdf.setLineWidth(1);
      pdf.rect(eventX, eventY, eventWidth, eventHeight, 'S');
    }
    
    // Event text
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
    
    let displayTitle = event.title;
    if (displayTitle.toLowerCase().includes(' appointment')) {
      displayTitle = displayTitle.replace(/ appointment$/i, '');
    }
    
    pdf.text(displayTitle, eventX + 5, eventY + 15);
    
    // Source and time
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    const source = event.title.toLowerCase().includes('appointment') ? 'SimplePractice' : 'Google Calendar';
    pdf.text(source, eventX + 5, eventY + 30);
    
    pdf.setFontSize(24); // Large time display like browser
    const timeDisplay = `${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}-${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
    pdf.text(timeDisplay, eventX + 5, eventY + 55);
  });

  // Save PDF
  const filename = `browser-matching-daily-${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}.pdf`;
  pdf.save(filename);
  
  console.log(`✅ Browser-matching daily PDF saved: ${filename}`);
};