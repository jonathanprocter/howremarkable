import jsPDF from 'jspdf';
import { CalendarEvent } from '../types/calendar';
import { drawDailyHeader, drawDailyFooter, drawDailyGrid } from './htmlTemplatePDF';

// Weekly Package Export Configuration
const WEEKLY_CONFIG = {
  pageWidth: 842,   // A3 landscape width for better weekly view
  pageHeight: 595,  // A3 landscape height
  margin: 20,
  timeColumnWidth: 55,
  dayColumnWidth: 100,
  timeSlotHeight: 12,
  headerHeight: 40
};

const DAILY_CONFIG = {
  pageWidth: 612,   // A4 portrait width  
  pageHeight: 792,  // A4 portrait height
  margin: 25,
  timeColumnWidth: 75,
  appointmentColumnWidth: 502,
  timeSlotHeight: 18,
  headerHeight: 60
};

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

    // Create PDF with weekly overview page (A3 landscape for better visibility)
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'pt',
      format: [WEEKLY_CONFIG.pageWidth, WEEKLY_CONFIG.pageHeight]
    });

    // Add weekly overview page
    drawWeeklyOverviewPage(pdf, weekStartDate, weekEndDate, weekEvents);

    // Add daily pages
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    // Page 2-8: Daily pages (Portrait A4)
    dayNames.forEach((dayName, dayIndex) => {
      const currentDate = new Date(weekStartDate);
      currentDate.setDate(weekStartDate.getDate() + dayIndex);

      if (dayIndex > 0) {
        pdf.addPage([DAILY_CONFIG.pageWidth, DAILY_CONFIG.pageHeight], 'portrait');
      }

      const currentPageNum = dayIndex + 2; // Pages 2-8
      const totalPages = 8; // 1 weekly + 7 daily

      console.log(`📄 Creating ${dayName} Page (Page ${currentPageNum}) - ${currentDate.toDateString()}`);

      const dayEvents = weekEvents.filter(event => {
        const eventDate = new Date(event.startTime);
        return eventDate.toDateString() === currentDate.toDateString();
      });

      console.log(`  - ${dayName} events: ${dayEvents.length}`);

      drawDailyHeader(pdf, DAILY_CONFIG, currentDate, dayEvents);
      drawDailyNavigationButtons(pdf, DAILY_CONFIG, currentDate, weekStartDate, weekEndDate, currentPageNum, totalPages);
      drawDailyGrid(pdf, DAILY_CONFIG, currentDate, dayEvents);
    });

    // Generate filename with week info
    const weekStart = weekStartDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const weekEnd = weekEndDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const filename = `weekly-package-${weekStart}-to-${weekEnd}-${weekStartDate.getFullYear()}.pdf`;

    // Save the complete package
    pdf.save(filename);

    console.log('✅ WEEKLY PACKAGE EXPORT COMPLETE');
    console.log('📊 Package Summary:');
    console.log(`  - Total Pages: 8`);
    console.log(`  - Weekly Overview: Page 1 (Landscape A3)`);
    console.log(`  - Daily Pages: 7 (Portrait A4)`);
    console.log(`  - Total Events: ${weekEvents.length}`);
    console.log(`  - Filename: ${filename}`);

  } catch (error) {
    // Comprehensive error handling for weekly package export
    console.error('❌ Weekly package export failed:', error);
    alert('Sorry, something went wrong while generating your weekly package PDF. Please try again or contact support if this issue persists.\n\nError details: ' + (error instanceof Error ? error.message : 'Unknown error'));
    throw new Error(`Weekly package export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * New version with no external calls and dashboard styling
 */
function drawWeeklyOverviewPage(pdf: jsPDF, weekStartDate: Date, weekEndDate: Date, events: CalendarEvent[]) {
  // Enhanced configuration for A3 landscape weekly overview - dashboard matching
  const GRID_CONFIG = {
    pageWidth: 842,   // A3 landscape width
    pageHeight: 595,  // A3 landscape height
    margin: 20,
    headerHeight: 40,
    legendHeight: 30,
    timeColumnWidth: 55,
    timeSlotHeight: 12,
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
  pdf.setFontSize(18);
  pdf.setTextColor(0, 0, 0);
  pdf.text('WEEKLY CALENDAR', GRID_CONFIG.pageWidth / 2, 25, { align: 'center' });

  // Week date range
  pdf.setFontSize(12);
  const weekStart = weekStartDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  const weekEnd = weekEndDate.toLocaleDateString('en-US', { day: 'numeric', year: 'numeric' });
  pdf.text(`${weekStart} - ${weekEnd}`, GRID_CONFIG.pageWidth / 2, 40, { align: 'center' });

  // === LEGEND ===
  const legendY = GRID_CONFIG.headerHeight;
  pdf.setFillColor(248, 248, 248);
  pdf.rect(gridStartX, legendY, GRID_CONFIG.pageWidth - (GRID_CONFIG.margin * 2), GRID_CONFIG.legendHeight, 'F');
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(1);
  pdf.rect(gridStartX, legendY, GRID_CONFIG.pageWidth - (GRID_CONFIG.margin * 2), GRID_CONFIG.legendHeight, 'S');

  // Legend items
  pdf.setFont('times', 'normal');
  pdf.setFontSize(9);
  let legendX = gridStartX + 70;

  // SimplePractice
  pdf.setFillColor(255, 255, 255);
  pdf.rect(legendX, legendY + 7, 14, 10, 'F');
  pdf.setDrawColor(100, 149, 237);
  pdf.setLineWidth(1);
  pdf.rect(legendX, legendY + 7, 14, 10, 'S');
  pdf.setLineWidth(3);
  pdf.line(legendX, legendY + 7, legendX, legendY + 17);
  pdf.setTextColor(0, 0, 0);
  pdf.text('SimplePractice', legendX + 20, legendY + 15);

  legendX += 180;

  // Google Calendar
  pdf.setFillColor(255, 255, 255);
  pdf.rect(legendX, legendY + 7, 14, 10, 'F');
  pdf.setDrawColor(34, 197, 94);
  pdf.setLineWidth(1);
  pdf.setLineDash([3, 2]);
  pdf.rect(legendX, legendY + 7, 14, 10, 'S');
  pdf.setLineDash([]);
  pdf.text('Google Calendar', legendX + 20, legendY + 15);

  legendX += 180;

  // Holidays
  pdf.setFillColor(255, 255, 0);
  pdf.rect(legendX, legendY + 7, 14, 10, 'F');
  pdf.setDrawColor(245, 158, 11);
  pdf.setLineWidth(1);
  pdf.rect(legendX, legendY + 7, 14, 10, 'S');
  pdf.text('Holidays', legendX + 20, legendY + 15);

  // === CALENDAR GRID ===

  // Draw TIME column header
  pdf.setFillColor(255, 255, 255);
  pdf.rect(gridStartX, gridStartY, GRID_CONFIG.timeColumnWidth, 35, 'F');
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(2);
  pdf.rect(gridStartX, gridStartY, GRID_CONFIG.timeColumnWidth, 35, 'S');

  pdf.setFont('times', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(0, 0, 0);
  pdf.text('TIME', gridStartX + (GRID_CONFIG.timeColumnWidth / 2), gridStartY + 22, { align: 'center' });

  // Draw day column headers
  const daysOfWeek = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

  for (let day = 0; day < 7; day++) {
    const currentDate = new Date(weekStartDate);
    currentDate.setDate(weekStartDate.getDate() + day);

    const dayX = gridStartX + GRID_CONFIG.timeColumnWidth + (day * dayColumnWidth);

    // Header background
    pdf.setFillColor(255, 255, 255);
    pdf.rect(dayX, gridStartY, dayColumnWidth, 35, 'F');
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(2);
    pdf.rect(dayX, gridStartY, dayColumnWidth, 35, 'S');

    // Day header text
    pdf.setFont('times', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(0, 0, 0);
    pdf.text(daysOfWeek[day], dayX + (dayColumnWidth / 2), gridStartY + 16, { align: 'center' });
    pdf.text(currentDate.getDate().toString(), dayX + (dayColumnWidth / 2), gridStartY + 28, { align: 'center' });
  }

  // Draw time slots and events
  const timeGridStartY = gridStartY + 35;

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
    pdf.setFontSize(isTopOfHour ? 10 : 8);
    pdf.setTextColor(0, 0, 0);
    pdf.text(timeStr, gridStartX + (GRID_CONFIG.timeColumnWidth / 2), slotY + 11, { align: 'center' });

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

  // Draw events - FILTER OUT CORRUPTED 16:00 EVENTS
  const weekEvents = events.filter(event => {
    const eventDate = new Date(event.startTime);
    const isInWeek = eventDate >= weekStartDate && eventDate <= weekEndDate;

    // CRITICAL FIX: Skip events with corrupted titles that cause 16:00 overlay
    const hasCorruptedTitle = !event.title || 
                             event.title.includes('🔒') ||
                             event.title.includes('📅') ||
                             event.title.includes('➡️') ||
                             event.title.includes('⬅️') ||
                             event.title.includes('Ø') ||
                             event.title.length === 0;

    return isInWeek && !hasCorruptedTitle;
  });

  console.log(`Filtered ${events.length} total events to ${weekEvents.length} clean events`);

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
    pdf.setFontSize(7);
    pdf.setTextColor(0, 0, 0);

    // Clean event title and fix character encoding - COMPLETE CLEANUP
    let displayTitle = event.title || '';

    // Remove ALL problematic characters that cause the 16:00 overlay issue
    displayTitle = displayTitle.replace(/[🔒📅➡️⬅️Ø=ÝÅ]/g, ''); // Remove lock symbols and corrupted chars
    displayTitle = displayTitle.replace(/\s+/g, ' '); // Normalize whitespace
    displayTitle = displayTitle.trim(); // Remove leading/trailing spaces

    // Remove "Appointment" suffix
    if (displayTitle.endsWith(' Appointment')) {
      displayTitle = displayTitle.slice(0, -12);
    }

    // Skip rendering if title is empty or corrupted
    if (!displayTitle || displayTitle.length === 0) {
      return; // Don't render empty/corrupted events
    }

    // Split text into lines to fit in event box
    const maxWidth = eventWidth - 8;
    const lines = pdf.splitTextToSize(displayTitle, maxWidth);

    let textY = eventY + 11;
    lines.slice(0, 2).forEach(line => {
      pdf.text(line, eventX + 4, textY);
      textY += 9;
    });

    // Add time if there's space
    if (lines.length <= 1 && eventHeight > 30) {
      const timeStr = `${eventDate.getHours().toString().padStart(2, '0')}:${eventDate.getMinutes().toString().padStart(2, '0')}-${eventEndDate.getHours().toString().padStart(2, '0')}:${eventEndDate.getMinutes().toString().padStart(2, '0')}`;
      pdf.setFontSize(5);
      pdf.text(timeStr, eventX + 4, textY);
    }
  });

  drawWeeklyNavigationButtons(pdf, GRID_CONFIG, weekStartDate, weekEndDate);
}

/**
 * Add Navigation Footers to All Pages
 */
function drawDailyNavigationButtons(pdf: jsPDF, config: any, selectedDate: Date, weekStartDate: Date, weekEndDate: Date, currentPageNum: number, totalPages: number) {
  const { pageWidth, margin } = config;
  const buttonY = 30;
  const buttonHeight = 20;
  const buttonWidth = 80;

  // Back to Week button (left) - links to page 1
  pdf.setFillColor(240, 240, 240);
  pdf.rect(margin, buttonY, buttonWidth, buttonHeight, 'F');
  pdf.setDrawColor(180, 180, 180);
  pdf.rect(margin, buttonY, buttonWidth, buttonHeight, 'S');
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(60, 60, 60);
  pdf.text('← Week Overview', margin + buttonWidth/2, buttonY + 13, { align: 'center' });

  // Add link annotation to week overview (page 1)
  pdf.link(margin, buttonY, buttonWidth, buttonHeight, { pageNumber: 1 });

  // Previous day button
  if (currentPageNum > 2) { // Page 2 is Monday, so can go previous from Tuesday onwards
    pdf.setFillColor(240, 240, 240);
    pdf.rect(pageWidth - margin - 2*buttonWidth - 10, buttonY, buttonWidth, buttonHeight, 'F');
    pdf.setDrawColor(180, 180, 180);
    pdf.rect(pageWidth - margin - 2*buttonWidth - 10, buttonY, buttonWidth, buttonHeight, 'S');
    pdf.text('← Previous Day', pageWidth - margin - 2*buttonWidth - 10 + buttonWidth/2, buttonY + 13, { align: 'center' });
    // Link to previous day page
    pdf.link(pageWidth - margin - 2*buttonWidth - 10, buttonY, buttonWidth, buttonHeight, { pageNumber: currentPageNum - 1 });
  }

  // Next day button
  if (currentPageNum < totalPages) { // Can go next until Sunday (last page)
    pdf.setFillColor(240, 240, 240);
    pdf.rect(pageWidth - margin - buttonWidth, buttonY, buttonWidth, buttonHeight, 'F');
    pdf.setDrawColor(180, 180, 180);
    pdf.rect(pageWidth - margin - buttonWidth, buttonY, buttonWidth, buttonHeight, 'S');
    pdf.text('Next Day →', pageWidth - margin - buttonWidth + buttonWidth/2, buttonY + 13, { align: 'center' });
    // Link to next day page
    pdf.link(pageWidth - margin - buttonWidth, buttonY, buttonWidth, buttonHeight, { pageNumber: currentPageNum + 1 });
  }

  // Page indicator
  pdf.setFontSize(8);
  pdf.setTextColor(120, 120, 120);
  pdf.text(`Page ${currentPageNum} of ${totalPages}`, pageWidth/2, buttonY + 35, { align: 'center' });
}

/**
 * Add bidirectional navigation to weekly overview with links to daily pages
 */
function drawWeeklyNavigationButtons(pdf: jsPDF, config: any, weekStartDate: Date, weekEndDate: Date) {
  const { pageWidth, margin } = config;
  const buttonY = 25;
  const buttonHeight = 18;
  const buttonWidth = 70;

  // Previous week button
  pdf.setFillColor(240, 240, 240);
  pdf.rect(margin, buttonY, buttonWidth, buttonHeight, 'F');
  pdf.setDrawColor(180, 180, 180);
  pdf.rect(margin, buttonY, buttonWidth, buttonHeight, 'S');
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(60, 60, 60);
  pdf.text('← Prev Week', margin + buttonWidth/2, buttonY + 12, { align: 'center' });

  // Next week button
  pdf.setFillColor(240, 240, 240);
  pdf.rect(pageWidth - margin - buttonWidth, buttonY, buttonWidth, buttonHeight, 'F');
  pdf.setDrawColor(180, 180, 180);
  pdf.rect(pageWidth - margin - buttonWidth, buttonY, buttonWidth, buttonHeight, 'S');
  pdf.text('Next Week →', pageWidth - margin - buttonWidth + buttonWidth/2, buttonY + 12, { align: 'center' });

  // Daily page navigation buttons
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dayButtonWidth = 45;
  const dayButtonHeight = 15;
  const startX = pageWidth/2 - (7 * dayButtonWidth + 6 * 5) / 2; // Center the buttons
  const dayButtonY = buttonY + 30;

  dayNames.forEach((day, index) => {
    const x = startX + index * (dayButtonWidth + 5);
    const pageNum = index + 2; // Pages 2-8 are the daily pages

    pdf.setFillColor(250, 250, 250);
    pdf.rect(x, dayButtonY, dayButtonWidth, dayButtonHeight, 'F');
    pdf.setDrawColor(200, 200, 200);
    pdf.rect(x, dayButtonY, dayButtonWidth, dayButtonHeight, 'S');

    pdf.setFontSize(8);
    pdf.setTextColor(80, 80, 80);
    pdf.text(day, x + dayButtonWidth/2, dayButtonY + 10, { align: 'center' });

    // Add link to corresponding daily page
    pdf.link(x, dayButtonY, dayButtonWidth, dayButtonHeight, { pageNumber: pageNum });
  });

  // Instructions text
  pdf.setFontSize(7);
  pdf.setTextColor(120, 120, 120);
  pdf.text('Click day buttons above to jump to daily pages', pageWidth/2, dayButtonY + 25, { align: 'center' });
}

/**
 * Create Daily Page Content using existing daily export functionality
 */
async function createDailyPageContent(
  pdf: jsPDF,
  date: Date,
  events: CalendarEvent[],
  pageNumber: number,
  dayName: string,
  dayOfWeek: number
): Promise<void> {
  // Use the new imported functions for consistent styling with proper page info
  drawDailyHeader(pdf, date, events, pageNumber, dayOfWeek);
  drawDailyGrid(pdf, date, events);
  drawDailyFooter(pdf, date, pageNumber, dayOfWeek);
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
    pdf.setFontSize(10);
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

function formatDateRange(startDate: Date, endDate: Date): string {
  const startMonth = startDate.toLocaleDateString('en-US', { month: 'short' });
  const startDay = startDate.toLocaleDateString('en-US', { day: 'numeric' });
  const endMonth = endDate.toLocaleDateString('en-US', { month: 'short' });
  const endDay = endDate.toLocaleDateString('en-US', { day: 'numeric' });
  const year = startDate.getFullYear();

  return `${startMonth}-${startDay}-to-${endMonth}-${endDay}-${year}`;
}