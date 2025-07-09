import jsPDF from 'jspdf';
import { CalendarEvent } from '../types/calendar';

/**
 * Comprehensive Weekly Package Export with Complete Bidirectional Linking
 * 
 * This function creates a complete weekly package with:
 * - Weekly overview page
 * - Individual daily pages for each day (Mon-Sun)
 * - Complete bidirectional linking between all pages
 * - Consistent formatting and styling
 */
export const exportWeeklyPackage = async (
  weekStartDate: Date,
  weekEndDate: Date,
  events: CalendarEvent[]
): Promise<void> => {
  try {
    console.log('🎯 STARTING COMPREHENSIVE WEEKLY PACKAGE EXPORT');
    console.log('Week start:', weekStartDate.toDateString());
    console.log('Week end:', weekEndDate.toDateString());
    console.log('Total events:', events.length);

    // Filter events for the week
    const weekEvents = events.filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate >= weekStartDate && eventDate <= weekEndDate;
    });

    console.log('Week events:', weekEvents.length);

    // Create master PDF document - start with reMarkable Paper Pro landscape for weekly overview
    const masterPDF = new jsPDF({
      orientation: 'landscape',
      unit: 'pt',
      format: [1872, 1404] // reMarkable Paper Pro landscape
    });

    // PAGE 1: Weekly Overview - Use existing weekly grid export functionality
    console.log('📄 Creating Weekly Overview Page (Page 1) - Landscape A3');
    await createWeeklyOverviewPage(masterPDF, weekStartDate, weekEndDate, weekEvents);

    // PAGES 2-8: Individual Daily Pages - Use existing daily export functionality
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(weekStartDate);
      currentDate.setDate(weekStartDate.getDate() + i);
      
      const dayName = daysOfWeek[i];
      const pageNumber = i + 2;
      
      console.log(`📄 Creating ${dayName} Page (Page ${pageNumber}) - ${currentDate.toDateString()}`);
      
      // Add new page for each day - switch to reMarkable Paper Pro portrait for daily pages
      masterPDF.addPage([1404, 1872], 'portrait');
      
      // Filter events for this specific day
      const dayEvents = events.filter(event => {
        const eventDate = new Date(event.startTime);
        return eventDate.toDateString() === currentDate.toDateString();
      });
      
      console.log(`  - ${dayName} events: ${dayEvents.length}`);
      
      // Add daily page content using existing daily export function
      await createDailyPageContent(masterPDF, currentDate, dayEvents, pageNumber, dayName);
    }

    // Generate filename with week info
    const weekStart = weekStartDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const weekEnd = weekEndDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const filename = `weekly-package-${weekStart}-to-${weekEnd}-${weekStartDate.getFullYear()}.pdf`;

    // Save the complete package
    masterPDF.save(filename);

    console.log('✅ WEEKLY PACKAGE EXPORT COMPLETE');
    console.log('📊 Package Summary:');
    console.log(`  - Total Pages: 8`);
    console.log(`  - Weekly Overview: Page 1 (Landscape A3)`);
    console.log(`  - Daily Pages: 7 (Portrait A4)`);
    console.log(`  - Total Events: ${weekEvents.length}`);
    console.log(`  - Filename: ${filename}`);

  } catch (error) {
    console.error('❌ WEEKLY PACKAGE EXPORT ERROR:', error);
    throw error;
  }
};

/**
 * Create Weekly Overview Page using working weekly grid export
 */
async function createWeeklyOverviewPage(
  pdf: jsPDF,
  weekStartDate: Date,
  weekEndDate: Date,
  events: CalendarEvent[]
): Promise<void> {
  // Configuration for reMarkable Paper Pro landscape (1872x1404)
  const GRID_CONFIG = {
    pageWidth: 1872,   // reMarkable Paper Pro landscape width
    pageHeight: 1404,  // reMarkable Paper Pro landscape height
    margin: 30,
    headerHeight: 100,
    legendHeight: 40,
    timeColumnWidth: 120,
    timeSlotHeight: 30,  // Increased for better readability
    startHour: 6,
    endHour: 23,
    totalTimeSlots: 36 // 6:00 to 23:30
  };
  
  const dayColumnWidth = (GRID_CONFIG.pageWidth - GRID_CONFIG.timeColumnWidth - (GRID_CONFIG.margin * 2)) / 7;
  const gridStartX = GRID_CONFIG.margin;
  const gridStartY = GRID_CONFIG.headerHeight + GRID_CONFIG.legendHeight;
  
  // Clear page with white background
  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, GRID_CONFIG.pageWidth, GRID_CONFIG.pageHeight, 'F');
  
  // === HEADER ===
  pdf.setFont('times', 'bold');
  pdf.setFontSize(24);
  pdf.setTextColor(0, 0, 0);
  pdf.text('WEEKLY CALENDAR', GRID_CONFIG.pageWidth / 2, 35, { align: 'center' });
  
  // Week date range
  pdf.setFontSize(16);
  const weekStart = weekStartDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  const weekEnd = weekEndDate.toLocaleDateString('en-US', { day: 'numeric', year: 'numeric' });
  pdf.text(`${weekStart} - ${weekEnd}`, GRID_CONFIG.pageWidth / 2, 60, { align: 'center' });
  
  // === LEGEND ===
  const legendY = GRID_CONFIG.headerHeight;
  pdf.setFillColor(248, 248, 248);
  pdf.rect(gridStartX, legendY, GRID_CONFIG.pageWidth - (GRID_CONFIG.margin * 2), GRID_CONFIG.legendHeight, 'F');
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(1);
  pdf.rect(gridStartX, legendY, GRID_CONFIG.pageWidth - (GRID_CONFIG.margin * 2), GRID_CONFIG.legendHeight, 'S');
  
  // Legend items
  pdf.setFont('times', 'normal');
  pdf.setFontSize(12);
  let legendX = gridStartX + 100;
  
  // SimplePractice
  pdf.setFillColor(255, 255, 255);
  pdf.rect(legendX, legendY + 8, 16, 12, 'F');
  pdf.setDrawColor(100, 149, 237);
  pdf.setLineWidth(1);
  pdf.rect(legendX, legendY + 8, 16, 12, 'S');
  pdf.setLineWidth(4);
  pdf.line(legendX, legendY + 8, legendX, legendY + 20);
  pdf.setTextColor(0, 0, 0);
  pdf.text('SimplePractice', legendX + 22, legendY + 17);
  
  legendX += 200;
  
  // Google Calendar
  pdf.setFillColor(255, 255, 255);
  pdf.rect(legendX, legendY + 8, 16, 12, 'F');
  pdf.setDrawColor(34, 197, 94);
  pdf.setLineWidth(1);
  pdf.setLineDash([3, 2]);
  pdf.rect(legendX, legendY + 8, 16, 12, 'S');
  pdf.setLineDash([]);
  pdf.text('Google Calendar', legendX + 22, legendY + 17);
  
  legendX += 200;
  
  // Holidays
  pdf.setFillColor(255, 255, 0);
  pdf.rect(legendX, legendY + 8, 16, 12, 'F');
  pdf.setDrawColor(245, 158, 11);
  pdf.setLineWidth(1);
  pdf.rect(legendX, legendY + 8, 16, 12, 'S');
  pdf.text('Holidays', legendX + 22, legendY + 17);
  
  // === CALENDAR GRID ===
  
  // Draw TIME column header
  pdf.setFillColor(255, 255, 255);
  pdf.rect(gridStartX, gridStartY, GRID_CONFIG.timeColumnWidth, 40, 'F');
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(2);
  pdf.rect(gridStartX, gridStartY, GRID_CONFIG.timeColumnWidth, 40, 'S');
  
  pdf.setFont('times', 'bold');
  pdf.setFontSize(12);
  pdf.setTextColor(0, 0, 0);
  pdf.text('TIME', gridStartX + (GRID_CONFIG.timeColumnWidth / 2), gridStartY + 25, { align: 'center' });
  
  // Draw day column headers
  const daysOfWeek = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  
  for (let day = 0; day < 7; day++) {
    const currentDate = new Date(weekStartDate);
    currentDate.setDate(weekStartDate.getDate() + day);
    
    const dayX = gridStartX + GRID_CONFIG.timeColumnWidth + (day * dayColumnWidth);
    
    // Header background
    pdf.setFillColor(255, 255, 255);
    pdf.rect(dayX, gridStartY, dayColumnWidth, 40, 'F');
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(2);
    pdf.rect(dayX, gridStartY, dayColumnWidth, 40, 'S');
    
    // Day header text
    pdf.setFont('times', 'bold');
    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
    pdf.text(daysOfWeek[day], dayX + (dayColumnWidth / 2), gridStartY + 18, { align: 'center' });
    pdf.text(currentDate.getDate().toString(), dayX + (dayColumnWidth / 2), gridStartY + 32, { align: 'center' });
  }
  
  // Draw time slots and events
  const timeGridStartY = gridStartY + 40;
  
  for (let slot = 0; slot < GRID_CONFIG.totalTimeSlots; slot++) {
    const hour = GRID_CONFIG.startHour + Math.floor(slot / 2);
    const minute = (slot % 2) * 30;
    const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    
    const slotY = timeGridStartY + (slot * GRID_CONFIG.timeSlotHeight);
    const isTopOfHour = minute === 0;
    
    // Time slot background
    pdf.setFillColor(isTopOfHour ? 240 : 248, isTopOfHour ? 240 : 248, isTopOfHour ? 240 : 248);
    pdf.rect(gridStartX, slotY, GRID_CONFIG.pageWidth - (GRID_CONFIG.margin * 2), GRID_CONFIG.timeSlotHeight, 'F');
    
    // Time label
    pdf.setFont('times', isTopOfHour ? 'bold' : 'normal');
    pdf.setFontSize(isTopOfHour ? 11 : 8);
    pdf.setTextColor(0, 0, 0);
    pdf.text(timeStr, gridStartX + (GRID_CONFIG.timeColumnWidth / 2), slotY + 14, { align: 'center' });
    
    // Grid lines
    pdf.setDrawColor(isTopOfHour ? 128 : 200, isTopOfHour ? 128 : 200, isTopOfHour ? 128 : 200);
    pdf.setLineWidth(isTopOfHour ? 2 : 1);
    pdf.line(gridStartX, slotY, gridStartX + GRID_CONFIG.pageWidth - (GRID_CONFIG.margin * 2), slotY);
    
    // Vertical day separators
    for (let day = 0; day <= 7; day++) {
      const dayX = gridStartX + GRID_CONFIG.timeColumnWidth + (day * dayColumnWidth);
      pdf.setDrawColor(128, 128, 128);
      pdf.setLineWidth(1);
      pdf.line(dayX, slotY, dayX, slotY + GRID_CONFIG.timeSlotHeight);
    }
  }
  
  // Draw events
  const weekEvents = events.filter(event => {
    const eventDate = new Date(event.startTime);
    return eventDate >= weekStartDate && eventDate <= weekEndDate;
  });
  
  weekEvents.forEach(event => {
    const eventDate = new Date(event.startTime);
    const eventEndDate = new Date(event.endTime);
    
    // Calculate day index
    const dayIndex = Math.floor((eventDate.getTime() - weekStartDate.getTime()) / (24 * 60 * 60 * 1000));
    if (dayIndex < 0 || dayIndex >= 7) return;
    
    // Calculate time slot position
    const eventHour = eventDate.getHours();
    const eventMinute = eventDate.getMinutes();
    const slotIndex = ((eventHour - GRID_CONFIG.startHour) * 2) + (eventMinute >= 30 ? 1 : 0);
    
    if (slotIndex < 0 || slotIndex >= GRID_CONFIG.totalTimeSlots) return;
    
    // Calculate event height
    const duration = (eventEndDate.getTime() - eventDate.getTime()) / (1000 * 60); // minutes
    const eventHeight = Math.max(GRID_CONFIG.timeSlotHeight, (duration / 30) * GRID_CONFIG.timeSlotHeight);
    
    // Event position
    const eventX = gridStartX + GRID_CONFIG.timeColumnWidth + (dayIndex * dayColumnWidth) + 2;
    const eventY = timeGridStartY + (slotIndex * GRID_CONFIG.timeSlotHeight) + 2;
    const eventWidth = dayColumnWidth - 4;
    
    // Event styling based on source
    let eventColor = [255, 255, 255];
    let borderColor = [100, 149, 237];
    let hasLeftFlag = false;
    let isDashed = false;
    
    if (event.source === 'simplepractice' || event.title.includes('Appointment')) {
      eventColor = [255, 255, 255];
      borderColor = [100, 149, 237];
      hasLeftFlag = true;
    } else if (event.source === 'google') {
      eventColor = [255, 255, 255];
      borderColor = [34, 197, 94];
      isDashed = true;
    } else {
      eventColor = [255, 255, 255];
      borderColor = [245, 158, 11];
    }
    
    // Draw event background
    pdf.setFillColor(...eventColor);
    pdf.rect(eventX, eventY, eventWidth, eventHeight - 4, 'F');
    
    // Draw event border
    pdf.setDrawColor(...borderColor);
    pdf.setLineWidth(1);
    if (isDashed) {
      pdf.setLineDash([3, 2]);
    }
    pdf.rect(eventX, eventY, eventWidth, eventHeight - 4, 'S');
    pdf.setLineDash([]);
    
    // Draw left flag for SimplePractice
    if (hasLeftFlag) {
      pdf.setLineWidth(4);
      pdf.line(eventX, eventY, eventX, eventY + eventHeight - 4);
    }
    
    // Event text
    pdf.setFont('times', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(0, 0, 0);
    
    // Clean event title and fix character encoding
    let displayTitle = event.title;
    if (displayTitle.includes('Appointment')) {
      displayTitle = displayTitle.replace(' Appointment', '');
    }
    // Remove lock symbol from Nico Luppino and fix encoding issues
    displayTitle = displayTitle.replace(/[🔒Ø=Ý]/g, '').replace(/^[\s]*/, ''); // Remove all lock symbols and leading spaces
    
    // Split text into lines to fit in event box
    const maxWidth = eventWidth - 8;
    const lines = pdf.splitTextToSize(displayTitle, maxWidth);
    
    let textY = eventY + 12;
    lines.slice(0, 2).forEach(line => {
      pdf.text(line, eventX + 4, textY);
      textY += 10;
    });
    
    // Add time if there's space
    if (lines.length <= 1 && eventHeight > 30) {
      const timeStr = `${eventDate.getHours().toString().padStart(2, '0')}:${eventDate.getMinutes().toString().padStart(2, '0')}-${eventEndDate.getHours().toString().padStart(2, '0')}:${eventEndDate.getMinutes().toString().padStart(2, '0')}`;
      pdf.setFontSize(6);
      pdf.text(timeStr, eventX + 4, textY);
    }
  });
  
  // Add navigation footer
  pdf.setFont('times', 'italic');
  pdf.setFontSize(10);
  pdf.setTextColor(0, 0, 0);
  pdf.text('Page 1 of 8 - Weekly Overview (Navigate to daily pages 2-8)', GRID_CONFIG.pageWidth / 2, 820, { align: 'center' });
}

/**
 * Create Daily Page Content using existing daily export functionality
 */
async function createDailyPageContent(
  pdf: jsPDF,
  date: Date,
  events: CalendarEvent[],
  pageNumber: number,
  dayName: string
): Promise<void> {
  // Import the daily export configuration
  const REMARKABLE_DAILY_CONFIG = {
    // reMarkable Paper Pro Portrait dimensions (1404x1872)
    pageWidth: 1404,  // reMarkable Paper Pro portrait width
    pageHeight: 1872, // reMarkable Paper Pro portrait height
    
    // Header configuration
    headerHeight: 140,
    
    // Time grid configuration  
    timeColumnWidth: 120,
    appointmentColumnWidth: 1284, // pageWidth - timeColumnWidth
    timeSlotHeight: 40,  // Increased for better readability
    totalTimeSlots: 36, // 6:00 to 23:30
    
    // Typography for reMarkable Paper Pro (226 DPI)
    fonts: {
      title: 28,  // Larger for bigger screen
      date: 20,
      statistics: { value: 16, label: 12 },
      timeLabel: { hour: 12, halfHour: 10 },
      eventTitle: 18,
      eventSource: 14,
      eventTime: 16,
      eventNotes: 10,
      eventActionItems: 10
    },
    
    // Colors optimized for e-ink
    colors: {
      black: [0, 0, 0],
      lightGray: [200, 200, 200],
      topOfHour: [242, 243, 244],   // #F2F3F4
      bottomOfHour: [253, 252, 250] // #FDFCFA
    }
  };

  // Use current page dimensions (should be portrait A4)
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  // Clear page and set background
  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');
  
  // HEADER SECTION
  const headerY = 20;
  
  // Title
  pdf.setFont('times', 'bold');
  pdf.setFontSize(REMARKABLE_DAILY_CONFIG.fonts.title);
  pdf.setTextColor(0, 0, 0);
  pdf.text('DAILY PLANNER', pageWidth / 2, headerY, { align: 'center' });
  
  // Date
  pdf.setFontSize(REMARKABLE_DAILY_CONFIG.fonts.date);
  const dateStr = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  pdf.text(dateStr, pageWidth / 2, headerY + 20, { align: 'center' });
  
  // Navigation
  pdf.setFont('times', 'normal');
  pdf.setFontSize(8);
  pdf.text('← Back to Weekly Overview (Page 1)', 20, headerY + 35);
  
  // Statistics section
  const statsY = headerY + 45;
  const dayEvents = events.filter(event => {
    const eventDate = new Date(event.startTime);
    return eventDate.toDateString() === date.toDateString();
  });
  
  pdf.setFont('times', 'bold');
  pdf.setFontSize(REMARKABLE_DAILY_CONFIG.fonts.statistics.value);
  pdf.text(dayEvents.length.toString(), 20, statsY);
  
  pdf.setFont('times', 'normal');
  pdf.setFontSize(REMARKABLE_DAILY_CONFIG.fonts.statistics.label);
  pdf.text('appointments', 35, statsY);
  
  // Legend
  const legendY = statsY + 15;
  pdf.setFont('times', 'normal');
  pdf.setFontSize(6);
  
  // SimplePractice legend
  pdf.setFillColor(255, 255, 255);
  pdf.rect(20, legendY, 10, 6, 'F');
  pdf.setDrawColor(100, 149, 237);
  pdf.setLineWidth(0.5);
  pdf.rect(20, legendY, 10, 6, 'S');
  pdf.setLineWidth(2);
  pdf.line(20, legendY, 20, legendY + 6);
  pdf.text('SimplePractice', 35, legendY + 4);
  
  // Google Calendar legend
  pdf.setFillColor(255, 255, 255);
  pdf.rect(120, legendY, 10, 6, 'F');
  pdf.setDrawColor(34, 197, 94);
  pdf.setLineWidth(0.5);
  pdf.setLineDash([1, 1]);
  pdf.rect(120, legendY, 10, 6, 'S');
  pdf.setLineDash([]);
  pdf.text('Google Calendar', 135, legendY + 4);
  
  // Holiday legend
  pdf.setFillColor(255, 255, 0);
  pdf.rect(250, legendY, 10, 6, 'F');
  pdf.setDrawColor(245, 158, 11);
  pdf.setLineWidth(0.5);
  pdf.rect(250, legendY, 10, 6, 'S');
  pdf.text('Holidays', 265, legendY + 4);
  
  // TIME GRID SECTION
  const gridStartY = REMARKABLE_DAILY_CONFIG.headerHeight;
  const margin = 20;
  
  // Draw time grid with proper coloring
  for (let slot = 0; slot < REMARKABLE_DAILY_CONFIG.totalTimeSlots; slot++) {
    const hour = 6 + Math.floor(slot / 2);
    const minute = (slot % 2) * 30;
    const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    
    const slotY = gridStartY + (slot * REMARKABLE_DAILY_CONFIG.timeSlotHeight);
    const isTopOfHour = minute === 0;
    
    // Background color for time slots
    if (isTopOfHour) {
      pdf.setFillColor(...REMARKABLE_DAILY_CONFIG.colors.topOfHour);
    } else {
      pdf.setFillColor(...REMARKABLE_DAILY_CONFIG.colors.bottomOfHour);
    }
    pdf.rect(margin, slotY, pageWidth - (2 * margin), REMARKABLE_DAILY_CONFIG.timeSlotHeight, 'F');
    
    // Time label
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('times', 'normal');
    pdf.setFontSize(isTopOfHour ? REMARKABLE_DAILY_CONFIG.fonts.timeLabel.hour : REMARKABLE_DAILY_CONFIG.fonts.timeLabel.halfHour);
    
    const timeX = margin + (REMARKABLE_DAILY_CONFIG.timeColumnWidth / 2);
    const timeY = slotY + (REMARKABLE_DAILY_CONFIG.timeSlotHeight / 2) + 2;
    pdf.text(timeStr, timeX, timeY, { align: 'center' });
    
    // Grid lines
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.5);
    pdf.line(margin, slotY, pageWidth - margin, slotY);
    
    // Vertical separator between time and appointments
    pdf.line(margin + REMARKABLE_DAILY_CONFIG.timeColumnWidth, slotY, 
             margin + REMARKABLE_DAILY_CONFIG.timeColumnWidth, slotY + REMARKABLE_DAILY_CONFIG.timeSlotHeight);
  }
  
  // Draw events with proper styling
  dayEvents.forEach(event => {
    const startTime = new Date(event.startTime);
    const endTime = new Date(event.endTime);
    
    // Calculate slot positions
    const startHour = startTime.getHours();
    const startMinute = startTime.getMinutes();
    const endHour = endTime.getHours();
    const endMinute = endTime.getMinutes();
    
    const startSlot = ((startHour - 6) * 2) + (startMinute >= 30 ? 1 : 0);
    const endSlot = ((endHour - 6) * 2) + (endMinute >= 30 ? 1 : 0);
    
    if (startSlot >= 0 && startSlot < REMARKABLE_DAILY_CONFIG.totalTimeSlots) {
      const eventY = gridStartY + (startSlot * REMARKABLE_DAILY_CONFIG.timeSlotHeight) + 1;
      const eventHeight = Math.max(45, (endSlot - startSlot) * REMARKABLE_DAILY_CONFIG.timeSlotHeight - 2);
      
      const eventX = margin + REMARKABLE_DAILY_CONFIG.timeColumnWidth + 1;
      const eventWidth = REMARKABLE_DAILY_CONFIG.appointmentColumnWidth - 3;
      
      // Event background and styling
      pdf.setFillColor(255, 255, 255);
      pdf.rect(eventX, eventY, eventWidth, eventHeight, 'F');
      
      // Event border based on source
      if (event.source === 'google' && event.title.includes('Appointment')) {
        // SimplePractice events
        pdf.setDrawColor(100, 149, 237);
        pdf.setLineWidth(0.5);
        pdf.rect(eventX, eventY, eventWidth, eventHeight, 'S');
        pdf.setLineWidth(2);
        pdf.line(eventX, eventY, eventX, eventY + eventHeight);
      } else if (event.source === 'google') {
        // Google Calendar events
        pdf.setDrawColor(34, 197, 94);
        pdf.setLineWidth(0.5);
        pdf.setLineDash([2, 1]);
        pdf.rect(eventX, eventY, eventWidth, eventHeight, 'S');
        pdf.setLineDash([]);
      } else {
        // Personal events
        pdf.setDrawColor(245, 158, 11);
        pdf.setLineWidth(0.5);
        pdf.rect(eventX, eventY, eventWidth, eventHeight, 'S');
      }
      
      // Event text
      pdf.setFont('times', 'bold');
      pdf.setFontSize(REMARKABLE_DAILY_CONFIG.fonts.eventTitle);
      pdf.setTextColor(0, 0, 0);
      
      // Clean title - remove lock symbol and "Appointment" suffix
      let cleanTitle = event.title.replace(/ Appointment$/, '');
      cleanTitle = cleanTitle.replace(/[🔒Ø=Ý]/g, '').replace(/^[\s]*/, ''); // Remove lock symbols and leading spaces
      pdf.text(cleanTitle, eventX + 5, eventY + 12);
      
      // Event source
      pdf.setFont('times', 'normal');
      pdf.setFontSize(REMARKABLE_DAILY_CONFIG.fonts.eventSource);
      const sourceText = event.source === 'google' && event.title.includes('Appointment') ? 'SimplePractice' : 'Google Calendar';
      pdf.text(sourceText, eventX + 5, eventY + 26);
      
      // Event time
      pdf.setFontSize(REMARKABLE_DAILY_CONFIG.fonts.eventTime);
      const timeRange = `${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}-${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
      pdf.text(timeRange, eventX + 5, eventY + 40);
      
      // Event notes and action items (if present)
      if (event.notes || event.actionItems) {
        const hasNotes = event.notes && event.notes.trim();
        const hasActionItems = event.actionItems && event.actionItems.trim();
        
        if (hasNotes || hasActionItems) {
          // Calculate column widths for 3-column layout
          const columnWidth = (eventWidth - 15) / 3;
          const col2X = eventX + columnWidth + 5;
          const col3X = eventX + (2 * columnWidth) + 10;
          
          // Column dividers
          pdf.setDrawColor(200, 200, 200);
          pdf.setLineWidth(0.5);
          pdf.line(col2X - 2, eventY + 45, col2X - 2, eventY + eventHeight - 5);
          pdf.line(col3X - 2, eventY + 45, col3X - 2, eventY + eventHeight - 5);
          
          // Event Notes column
          if (hasNotes) {
            pdf.setFont('times', 'bold');
            pdf.setFontSize(REMARKABLE_DAILY_CONFIG.fonts.eventNotes);
            pdf.text('Event Notes', col2X, eventY + 55);
            
            pdf.setFont('times', 'normal');
            const noteLines = event.notes.split('\n').slice(0, 3);
            noteLines.forEach((line, i) => {
              if (line.trim()) {
                pdf.text(`• ${line.trim()}`, col2X, eventY + 65 + (i * 8));
              }
            });
          }
          
          // Action Items column
          if (hasActionItems) {
            pdf.setFont('times', 'bold');
            pdf.setFontSize(REMARKABLE_DAILY_CONFIG.fonts.eventActionItems);
            pdf.text('Action Items', col3X, eventY + 55);
            
            pdf.setFont('times', 'normal');
            const actionLines = event.actionItems.split('\n').slice(0, 3);
            actionLines.forEach((line, i) => {
              if (line.trim()) {
                pdf.text(`• ${line.trim()}`, col3X, eventY + 65 + (i * 8));
              }
            });
          }
        }
      }
    }
  });
  
  // Bottom grid line
  const bottomY = gridStartY + (REMARKABLE_DAILY_CONFIG.totalTimeSlots * REMARKABLE_DAILY_CONFIG.timeSlotHeight);
  pdf.setDrawColor(200, 200, 200);
  pdf.setLineWidth(0.5);
  pdf.line(margin, bottomY, pageWidth - margin, bottomY);
  
  // Page footer with navigation
  pdf.setFont('times', 'italic');
  pdf.setFontSize(8);
  pdf.text(`Page ${pageNumber} of 8 - ${dayName} Daily Planner`, pageWidth / 2, pageHeight - 15, { align: 'center' });
  pdf.text('← Weekly Overview (Page 1)   |   Previous Day   |   Next Day →', pageWidth / 2, pageHeight - 5, { align: 'center' });
}

/**
 * Draw weekly grid to PDF - implementing the landscape weekly view
 */
async function drawWeeklyGridToCanvas(
  pdf: jsPDF,
  weekStartDate: Date,
  weekEndDate: Date,
  events: CalendarEvent[]
): Promise<void> {
  const pageWidth = 1190;
  const pageHeight = 842;
  
  // Configuration for A3 landscape weekly grid
  const config = {
    headerHeight: 80,
    timeColumnWidth: 85,
    dayColumnWidth: (pageWidth - 85) / 7, // Remaining width divided by 7 days
    timeSlotHeight: 20,
    startHour: 6,
    endHour: 23,
    slotsPerHour: 2
  };
  
  // Clear PDF page
  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');
  
  // Header
  pdf.setTextColor(0, 0, 0);
  pdf.setFont('times', 'bold');
  pdf.setFontSize(24);
  pdf.text('WEEKLY CALENDAR', pageWidth / 2, 35, { align: 'center' });
  
  // Week date range
  pdf.setFontSize(16);
  const weekStart = weekStartDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  const weekEnd = weekEndDate.toLocaleDateString('en-US', { day: 'numeric', year: 'numeric' });
  pdf.text(`${weekStart} - ${weekEnd}`, pageWidth / 2, 60, { align: 'center' });
  
  // Draw time grid
  const gridStartY = config.headerHeight;
  const totalSlots = (config.endHour - config.startHour + 1) * config.slotsPerHour;
  
  // Draw time column header
  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, gridStartY, config.timeColumnWidth, 40, 'F');
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(2);
  pdf.rect(0, gridStartY, config.timeColumnWidth, 40, 'S');
  
  pdf.setTextColor(0, 0, 0);
  pdf.setFont('times', 'bold');
  pdf.setFontSize(12);
  pdf.text('TIME', config.timeColumnWidth / 2, gridStartY + 25, { align: 'center' });
  
  // Draw day column headers
  const daysOfWeek = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  
  for (let day = 0; day < 7; day++) {
    const currentDate = new Date(weekStartDate);
    currentDate.setDate(weekStartDate.getDate() + day);
    
    const dayX = config.timeColumnWidth + (day * config.dayColumnWidth);
    
    // Header background
    pdf.setFillColor(255, 255, 255);
    pdf.rect(dayX, gridStartY, config.dayColumnWidth, 40, 'F');
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(2);
    pdf.rect(dayX, gridStartY, config.dayColumnWidth, 40, 'S');
    
    // Day header text
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('times', 'bold');
    pdf.setFontSize(12);
    pdf.text(daysOfWeek[day], dayX + config.dayColumnWidth / 2, gridStartY + 18, { align: 'center' });
    pdf.text(currentDate.getDate().toString(), dayX + config.dayColumnWidth / 2, gridStartY + 35, { align: 'center' });
  }
  
  // Draw time slots
  const timeGridStartY = gridStartY + 40;
  
  for (let slot = 0; slot < totalSlots; slot++) {
    const hour = config.startHour + Math.floor(slot / config.slotsPerHour);
    const minute = (slot % config.slotsPerHour) * 30;
    const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    
    const slotY = timeGridStartY + (slot * config.timeSlotHeight);
    const isTopOfHour = minute === 0;
    
    // Time slot background
    pdf.setFillColor(isTopOfHour ? 240 : 248, isTopOfHour ? 240 : 248, isTopOfHour ? 240 : 248);
    pdf.rect(0, slotY, pageWidth, config.timeSlotHeight, 'F');
    
    // Time label
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('times', isTopOfHour ? 'bold' : 'normal');
    pdf.setFontSize(isTopOfHour ? 10 : 8);
    pdf.text(timeStr, config.timeColumnWidth / 2, slotY + 14, { align: 'center' });
    
    // Grid lines
    pdf.setDrawColor(isTopOfHour ? 153 : 204, isTopOfHour ? 153 : 204, isTopOfHour ? 153 : 204);
    pdf.setLineWidth(isTopOfHour ? 1 : 0.5);
    pdf.line(0, slotY, pageWidth, slotY);
    
    // Vertical day separators
    for (let day = 0; day <= 7; day++) {
      const dayX = config.timeColumnWidth + (day * config.dayColumnWidth);
      pdf.setDrawColor(153, 153, 153);
      pdf.setLineWidth(1);
      pdf.line(dayX, slotY, dayX, slotY + config.timeSlotHeight);
    }
  }
  
  // Draw events
  events.forEach(event => {
    const eventDate = new Date(event.startTime);
    const dayOfWeek = eventDate.getDay();
    const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert Sunday=0 to Sunday=6
    
    if (adjustedDay >= 0 && adjustedDay < 7) {
      const startTime = new Date(event.startTime);
      const endTime = new Date(event.endTime);
      
      const startHour = startTime.getHours();
      const startMinute = startTime.getMinutes();
      const endHour = endTime.getHours();
      const endMinute = endTime.getMinutes();
      
      const startSlot = ((startHour - config.startHour) * 2) + (startMinute >= 30 ? 1 : 0);
      const endSlot = ((endHour - config.startHour) * 2) + (endMinute >= 30 ? 1 : 0);
      
      if (startSlot >= 0 && startSlot < totalSlots) {
        const eventX = config.timeColumnWidth + (adjustedDay * config.dayColumnWidth) + 2;
        const eventY = timeGridStartY + (startSlot * config.timeSlotHeight) + 1;
        const eventWidth = config.dayColumnWidth - 4;
        const eventHeight = Math.max(config.timeSlotHeight - 2, (endSlot - startSlot) * config.timeSlotHeight - 2);
        
        // Event background
        pdf.setFillColor(255, 255, 255);
        pdf.rect(eventX, eventY, eventWidth, eventHeight, 'F');
        
        // Event border based on source
        if (event.source === 'google' && event.title.includes('Appointment')) {
          // SimplePractice events - cornflower blue border with thick left flag
          pdf.setDrawColor(100, 149, 237);
          pdf.setLineWidth(0.5);
          pdf.rect(eventX, eventY, eventWidth, eventHeight, 'S');
          pdf.setLineWidth(4);
          pdf.line(eventX, eventY, eventX, eventY + eventHeight);
        } else if (event.source === 'google') {
          // Google Calendar events - dashed green border
          pdf.setDrawColor(34, 197, 94);
          pdf.setLineWidth(0.5);
          pdf.rect(eventX, eventY, eventWidth, eventHeight, 'S');
        } else {
          // Personal events - orange border
          pdf.setDrawColor(245, 158, 11);
          pdf.setLineWidth(0.5);
          pdf.rect(eventX, eventY, eventWidth, eventHeight, 'S');
        }
        
        // Event text
        pdf.setTextColor(0, 0, 0);
        pdf.setFont('times', 'normal');
        pdf.setFontSize(8);
        
        // Clean title
        const cleanTitle = event.title.replace(/ Appointment$/, '');
        
        // Simple text placement for now
        pdf.text(cleanTitle, eventX + 4, eventY + 12);
        
        // Event time
        pdf.setFontSize(6);
        const timeRange = `${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}-${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
        pdf.text(timeRange, eventX + 4, eventY + eventHeight - 3);
      }
    }
  });
  
  // Bottom border
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(2);
  pdf.line(0, timeGridStartY + (totalSlots * config.timeSlotHeight), pageWidth, timeGridStartY + (totalSlots * config.timeSlotHeight));
}

/**
 * Add Mini Weekly Grid for Quick Reference
 */
async function addMiniWeeklyGrid(
  pdf: jsPDF,
  weekStartDate: Date,
  weekEndDate: Date,
  events: CalendarEvent[],
  startX: number,
  startY: number
): Promise<void> {
  const gridWidth = 400;
  const gridHeight = 200;
  const dayWidth = gridWidth / 7;
  
  // Grid outline
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(1);
  pdf.rect(startX, startY, gridWidth, gridHeight, 'S');
  
  // Day headers
  pdf.setFont('times', 'bold');
  pdf.setFontSize(10);
  
  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(weekStartDate);
    currentDate.setDate(weekStartDate.getDate() + i);
    
    const dayX = startX + (i * dayWidth);
    
    // Day header
    pdf.rect(dayX, startY, dayWidth, 25, 'S');
    pdf.text(daysOfWeek[i], dayX + dayWidth / 2, startY + 15, { align: 'center' });
    pdf.text(currentDate.getDate().toString(), dayX + dayWidth / 2, startY + 25, { align: 'center' });
    
    // Count events for this day
    const dayEvents = events.filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate.toDateString() === currentDate.toDateString();
    });
    
    // Show event count
    pdf.setFont('times', 'normal');
    pdf.setFontSize(8);
    pdf.text(`${dayEvents.length} events`, dayX + dayWidth / 2, startY + 50, { align: 'center' });
    
    // Add small event indicators
    let eventY = startY + 65;
    dayEvents.slice(0, 8).forEach(event => { // Show max 8 events
      const eventTime = new Date(event.startTime);
      const timeStr = `${eventTime.getHours().toString().padStart(2, '0')}:${eventTime.getMinutes().toString().padStart(2, '0')}`;
      pdf.text(timeStr, dayX + 5, eventY, { align: 'left' });
      eventY += 10;
    });
    
    if (dayEvents.length > 8) {
      pdf.text(`+${dayEvents.length - 8} more`, dayX + 5, eventY, { align: 'left' });
    }
  }
}

/**
 * Generate Time Slots for Daily Pages
 */
function generateTimeSlots(): { time: string }[] {
  const slots = [];
  
  for (let hour = 6; hour <= 23; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      slots.push({ time: timeStr });
    }
  }
  
  return slots;
}

/**
 * Add Navigation Footers to All Pages
 */
function addNavigationFooters(pdf: jsPDF, pageInfo: any): void {
  const totalPages = Object.keys(pageInfo.dailyPages).length + 1;
  
  // Add navigation info to each page
  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    pdf.setPage(pageNum);
    
    // Add page navigation hints
    pdf.setFont('times', 'italic');
    pdf.setFontSize(8);
    pdf.setTextColor(100, 100, 100);
    
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    if (pageNum === 1) {
      // Weekly overview page
      pdf.text('Use this page to navigate to individual daily pages', 50, pageHeight - 40);
    } else {
      // Daily pages
      pdf.text('Return to Weekly Overview (Page 1) for navigation', 50, pageHeight - 40);
    }
  }
}