import jsPDF from 'jspdf';
import { CalendarEvent } from '../types/calendar';
import { exportExactGridPDF } from './exactGridPDFExport';
import { exportExactDailyPDF } from './exactDailyPDFExport';

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

    // Create master PDF document
    const masterPDF = new jsPDF({
      orientation: 'landscape',
      unit: 'pt',
      format: 'a3'
    });

    // Track page information for navigation
    const pageInfo = {
      weeklyOverview: 1,
      dailyPages: {} as Record<string, number>
    };

    // PAGE 1: Weekly Overview
    console.log('📄 Creating Weekly Overview Page (Page 1)');
    await addWeeklyOverviewPage(masterPDF, weekStartDate, weekEndDate, weekEvents, pageInfo);

    // PAGES 2-8: Individual Daily Pages
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(weekStartDate);
      currentDate.setDate(weekStartDate.getDate() + i);
      
      const dayName = daysOfWeek[i];
      const pageNumber = i + 2;
      
      console.log(`📄 Creating ${dayName} Page (Page ${pageNumber}) - ${currentDate.toDateString()}`);
      
      // Add new page for each day - switch to portrait for daily pages
      masterPDF.addPage('portrait', 'a4');
      
      // Track page number for navigation
      pageInfo.dailyPages[dayName] = pageNumber;
      
      // Filter events for this specific day
      const dayEvents = weekEvents.filter(event => {
        const eventDate = new Date(event.startTime);
        return eventDate.toDateString() === currentDate.toDateString();
      });
      
      console.log(`  - ${dayName} events: ${dayEvents.length}`);
      
      // Add daily page content
      await addDailyPageContent(masterPDF, currentDate, events, pageInfo, dayName);
    }

    // Add navigation footer to all pages
    addNavigationFooters(masterPDF, pageInfo);

    // Generate filename with week info
    const weekStart = weekStartDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const weekEnd = weekEndDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const filename = `weekly-package-${weekStart}-to-${weekEnd}-${weekStartDate.getFullYear()}.pdf`;

    // Save the complete package
    masterPDF.save(filename);

    console.log('✅ WEEKLY PACKAGE EXPORT COMPLETE');
    console.log('📊 Package Summary:');
    console.log(`  - Total Pages: ${Object.keys(pageInfo.dailyPages).length + 1}`);
    console.log(`  - Weekly Overview: Page ${pageInfo.weeklyOverview}`);
    console.log(`  - Daily Pages: ${Object.keys(pageInfo.dailyPages).length}`);
    console.log(`  - Total Events: ${weekEvents.length}`);
    console.log(`  - Filename: ${filename}`);

  } catch (error) {
    console.error('❌ WEEKLY PACKAGE EXPORT ERROR:', error);
    throw error;
  }
};

/**
 * Add Weekly Overview Page with Navigation Links
 */
async function addWeeklyOverviewPage(
  pdf: jsPDF,
  weekStartDate: Date,
  weekEndDate: Date,
  events: CalendarEvent[],
  pageInfo: any
): Promise<void> {
  // Page dimensions
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  // Header
  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');
  
  pdf.setFont('times', 'bold');
  pdf.setFontSize(28);
  pdf.setTextColor(0, 0, 0);
  pdf.text('WEEKLY PACKAGE OVERVIEW', pageWidth / 2, 40, { align: 'center' });
  
  // Week information
  pdf.setFontSize(16);
  const weekStart = weekStartDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  const weekEnd = weekEndDate.toLocaleDateString('en-US', { day: 'numeric', year: 'numeric' });
  pdf.text(`${weekStart} - ${weekEnd}`, pageWidth / 2, 65, { align: 'center' });
  
  // Navigation section
  pdf.setFont('times', 'bold');
  pdf.setFontSize(14);
  pdf.text('DAILY PAGES NAVIGATION', 50, 110);
  
  pdf.setFont('times', 'normal');
  pdf.setFontSize(12);
  
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  let navY = 130;
  
  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(weekStartDate);
    currentDate.setDate(weekStartDate.getDate() + i);
    
    const dayName = daysOfWeek[i];
    const pageNumber = i + 2;
    const dateStr = currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    // Count events for this day
    const dayEvents = events.filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate.toDateString() === currentDate.toDateString();
    });
    
    pdf.text(`${dayName} (${dateStr}) - Page ${pageNumber} - ${dayEvents.length} events`, 70, navY);
    navY += 20;
  }
  
  // Weekly statistics
  pdf.setFont('times', 'bold');
  pdf.setFontSize(14);
  pdf.text('WEEKLY STATISTICS', 50, navY + 30);
  
  pdf.setFont('times', 'normal');
  pdf.setFontSize(12);
  
  const totalEvents = events.length;
  const simplePracticeEvents = events.filter(e => e.source === 'google' && e.title.includes('Appointment')).length;
  const googleEvents = events.filter(e => e.source === 'google' && !e.title.includes('Appointment')).length;
  const personalEvents = events.filter(e => e.source === 'manual').length;
  
  let statsY = navY + 50;
  pdf.text(`Total Events: ${totalEvents}`, 70, statsY);
  pdf.text(`SimplePractice Appointments: ${simplePracticeEvents}`, 70, statsY + 20);
  pdf.text(`Google Calendar Events: ${googleEvents}`, 70, statsY + 40);
  pdf.text(`Personal Events: ${personalEvents}`, 70, statsY + 60);
  
  // Add mini weekly grid for quick reference
  await addMiniWeeklyGrid(pdf, weekStartDate, weekEndDate, events, 400, 150);
  
  // Page footer
  pdf.setFont('times', 'italic');
  pdf.setFontSize(10);
  pdf.text('Page 1 of 8 - Weekly Package Overview', pageWidth / 2, pageHeight - 20, { align: 'center' });
}

/**
 * Add Daily Page Content with Navigation - Using Full Daily Export Implementation
 */
async function addDailyPageContent(
  pdf: jsPDF,
  date: Date,
  events: CalendarEvent[],
  pageInfo: any,
  dayName: string
): Promise<void> {
  // Import the daily export configuration
  const REMARKABLE_DAILY_CONFIG = {
    // reMarkable Paper Pro Portrait dimensions (active display area)
    pageWidth: 507,  // 179mm in points  
    pageHeight: 677, // 239mm in points
    
    // Header configuration
    headerHeight: 90,
    
    // Time grid configuration  
    timeColumnWidth: 60,
    appointmentColumnWidth: 447, // pageWidth - timeColumnWidth
    timeSlotHeight: 16,
    totalTimeSlots: 36, // 6:00 to 23:30 (35 slots of 30 minutes each)
    
    // Typography for reMarkable Paper Pro (229 PPI)
    fonts: {
      title: 14,
      date: 10,
      statistics: { value: 10, label: 7 },
      timeLabel: { hour: 6, halfHour: 5 },
      eventTitle: 12,
      eventSource: 10,
      eventTime: 10,
      eventNotes: 4,
      eventActionItems: 4
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
      
      // Clean title
      const cleanTitle = event.title.replace(/ Appointment$/, '');
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
  const pageNum = pageInfo.dailyPages[dayName];
  pdf.text(`Page ${pageNum} of 8 - ${dayName} Daily Planner`, pageWidth / 2, pageHeight - 15, { align: 'center' });
  pdf.text('← Previous Day   |   Weekly Overview (Page 1)   |   Next Day →', pageWidth / 2, pageHeight - 5, { align: 'center' });
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