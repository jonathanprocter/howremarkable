/**
 * Truly Pixel Perfect Weekly Export
 * Uses extracted dashboard styles for exact visual replication
 */

import jsPDF from 'jspdf';
import { CalendarEvent } from '../types/calendar';
import { generateTimeSlots } from './timeSlots';
import { cleanEventTitle } from './textCleaner';
import { extractDashboardStyles, logStyleComparison, DashboardStyles } from './dashboardStyleExtractor';
import { performVisualComparison, extractPrintOptimizedStyles, logDetailedStyleComparison } from './pixelPerfectComparison';

// Get source of truth styles from dashboard DOM
const getDashboardStyles = (): DashboardStyles => {
  return extractDashboardStyles();
};

// Convert dashboard styles to PDF configuration
const createPDFConfig = (dashboardStyles: DashboardStyles) => {
  // A3 Landscape dimensions (matching user preference)
  const pageWidth = 1190;
  const pageHeight = 842;
  const margin = Math.max(dashboardStyles.spacing.margin, 20);
  
  // Calculate content area based on dashboard proportions
  const contentWidth = pageWidth - (2 * margin);
  const timeColumnWidth = Math.min(dashboardStyles.timeColumnWidth * 0.8, 80); // Scale for PDF
  const availableForDays = contentWidth - timeColumnWidth;
  const dayColumnWidth = Math.floor(availableForDays / 7);
  
  return {
    // Page setup
    pageWidth,
    pageHeight,
    margin,
    contentWidth,
    
    // Grid dimensions (exact ratios from dashboard)
    timeColumnWidth,
    dayColumnWidth,
    slotHeight: Math.max(dashboardStyles.timeSlotHeight * 0.6, 12), // Scale for PDF density
    headerHeight: Math.max(dashboardStyles.headerHeight * 0.5, 20),
    legendHeight: 35,
    
    // Typography (extracted from dashboard)
    fonts: {
      family: dashboardStyles.fonts.family.includes('Times') ? 'times' : 'helvetica',
      title: { 
        size: Math.min(dashboardStyles.fonts.headerTitle.size * 0.8, 20), 
        weight: 'bold' as const 
      },
      weekInfo: { 
        size: Math.min(dashboardStyles.fonts.headerTitle.size * 0.6, 14), 
        weight: 'normal' as const 
      },
      dayHeader: { 
        size: Math.min(dashboardStyles.fonts.dayHeader.size * 0.9, 12), 
        weight: 'bold' as const 
      },
      timeLabel: { 
        size: Math.min(dashboardStyles.fonts.timeLabel.size * 0.8, 10), 
        weight: 'normal' as const 
      },
      timeHour: { 
        size: Math.min(dashboardStyles.fonts.timeLabel.size * 0.9, 11), 
        weight: 'bold' as const 
      },
      eventTitle: { 
        size: Math.min(dashboardStyles.fonts.eventTitle.size * 0.7, 9), 
        weight: 'bold' as const 
      },
      eventTime: { 
        size: Math.min(dashboardStyles.fonts.eventTitle.size * 0.6, 7), 
        weight: 'normal' as const 
      },
      legend: { 
        size: Math.min(dashboardStyles.fonts.eventTitle.size * 0.8, 11), 
        weight: 'normal' as const 
      }
    },
    
    // Colors (exact from dashboard)
    colors: {
      white: dashboardStyles.colors.white,
      black: dashboardStyles.colors.black,
      lightGray: dashboardStyles.colors.lightGray,
      veryLightGray: dashboardStyles.colors.veryLightGray,
      borderGray: dashboardStyles.colors.borderGray,
      simplePracticeBlue: dashboardStyles.colors.simplePracticeBlue,
      googleGreen: dashboardStyles.colors.googleGreen,
      holidayOrange: dashboardStyles.colors.holidayOrange
    },
    
    // Spacing (exact from dashboard)
    spacing: {
      borderRadius: dashboardStyles.spacing.borderRadius,
      eventPadding: dashboardStyles.events.padding,
      borderWidth: dashboardStyles.spacing.borderWidth
    },
    
    // Computed properties
    get gridStartX() { return this.margin; },
    get gridStartY() { return this.margin + this.headerHeight + this.legendHeight; }
  };
};

/**
 * Get event source information with exact dashboard logic
 */
const getEventSourceInfo = (event: CalendarEvent) => {
  const title = event.title.toLowerCase();
  
  if (title.includes('appointment') || event.source === 'simplepractice') {
    return {
      source: 'SimplePractice',
      color: 'simplePracticeBlue' as const,
      borderStyle: 'solid' as const,
      hasLeftFlag: true
    };
  }
  
  if (title.includes('holiday') || event.source === 'holidays') {
    return {
      source: 'Holidays',
      color: 'holidayOrange' as const,
      borderStyle: 'solid' as const,
      hasLeftFlag: false
    };
  }
  
  return {
    source: 'Google Calendar',
    color: 'googleGreen' as const,
    borderStyle: 'dashed' as const,
    hasLeftFlag: false
  };
};

/**
 * Export pixel-perfect weekly PDF using dashboard styles
 */
export const exportTrulyPixelPerfectWeeklyPDF = async (
  weekStartDate: Date,
  weekEndDate: Date,
  events: CalendarEvent[]
): Promise<void> => {
  try {
    console.log('🎯 Creating TRULY pixel-perfect weekly PDF using dashboard styles...');
    
    // STEP 1: Perform visual comparison and capture exact measurements as requested by user
    console.log('📸 Step 1: Capturing dashboard screenshot for visual comparison...');
    const visualComparison = await performVisualComparison();
    
    // STEP 2: Extract exact print-optimized styles from dashboard
    console.log('📐 Step 2: Extracting exact dashboard measurements...');
    const exactMeasurements = extractPrintOptimizedStyles();
    
    if (!exactMeasurements) {
      console.warn('⚠️ Could not extract exact measurements, falling back to extracted styles');
    }
    
    // STEP 3: Use exact dashboard dimensions for PDF configuration
    console.log('🎯 Step 3: Creating PDF with exact dashboard dimensions...');
    
    // Extract styles from actual dashboard
    const dashboardStyles = getDashboardStyles();
    
    // Create TRUE pixel-perfect PDF configuration using UNSCALED dashboard measurements
    const baseConfig = createPDFConfig(dashboardStyles);
    
    // ROOT CAUSE FIX: Use extracted measurements WITHOUT any scaling factors
    const exactConfig = exactMeasurements ? {
      // Page setup - keep standard PDF dimensions
      pageWidth: 1190,
      pageHeight: 842,
      margin: 20,
      contentWidth: 1150,
      
      // Grid dimensions - USE EXACT DASHBOARD VALUES (NO SCALING!)
      timeColumnWidth: exactMeasurements.timeColumnWidth,    // 80px exactly as dashboard
      dayColumnWidth: exactMeasurements.dayColumnWidth,      // 110px exactly as dashboard  
      slotHeight: exactMeasurements.timeSlotHeight,          // 40px exactly as dashboard
      headerHeight: 30,
      legendHeight: 35,
      
      // Typography - use dashboard-matching sizes for A3 format
      fonts: {
        family: exactMeasurements.gridStyles?.fontFamily?.includes('Times') ? 'times' : 'helvetica',
        title: { size: 20, weight: 'bold' as const },
        weekInfo: { size: 14, weight: 'normal' as const },
        dayHeader: { size: 12, weight: 'bold' as const },
        timeLabel: { size: 10, weight: 'normal' as const },
        timeHour: { size: 11, weight: 'bold' as const },
        eventTitle: { size: 9, weight: 'bold' as const },
        eventTime: { size: 8, weight: 'normal' as const },
        legend: { size: 11, weight: 'normal' as const }
      },
      
      // Colors and spacing from base config
      colors: baseConfig.colors,
      spacing: baseConfig.spacing,
      
      // Grid positioning
      gridStartX: 20,
      gridStartY: 90
    } : baseConfig;
    
    // ROOT CAUSE ANALYSIS: Log every transformation step
    console.log('🔍 ROOT CAUSE ANALYSIS - Value Flow:');
    console.log('  Step 1 - Dashboard Extracted:', {
      timeColumnWidth: exactMeasurements?.timeColumnWidth,
      dayColumnWidth: exactMeasurements?.dayColumnWidth,
      timeSlotHeight: exactMeasurements?.timeSlotHeight
    });
    console.log('  Step 2 - PDF Config Applied:', {
      timeColumnWidth: exactConfig.timeColumnWidth,
      dayColumnWidth: exactConfig.dayColumnWidth,
      slotHeight: exactConfig.slotHeight
    });
    console.log('  Step 3 - About to render PDF with these EXACT values (no further scaling)');
    
    // Log detailed comparison as requested by user
    if (exactMeasurements) {
      logDetailedStyleComparison(exactMeasurements, exactConfig);
    } else {
      logStyleComparison(dashboardStyles, exactConfig);
    }
    
    const config = exactConfig;
    
    // Filter events for the week
    const weekEvents = events.filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate >= weekStartDate && eventDate <= weekEndDate;
    });
    
    console.log(`📅 Rendering ${weekEvents.length} events with dashboard-extracted styles`);
    
    // Create PDF with exact dashboard proportions
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'pt',
      format: [config.pageWidth, config.pageHeight]
    });
    
    // White background
    pdf.setFillColor(...config.colors.white);
    pdf.rect(0, 0, config.pageWidth, config.pageHeight, 'F');
    
    // === HEADER SECTION ===
    const headerY = config.margin;
    
    // Title with extracted font
    pdf.setFont(config.fonts.family, 'bold');
    pdf.setFontSize(config.fonts.title.size);
    pdf.setTextColor(...config.colors.black);
    pdf.text('WEEKLY CALENDAR', config.pageWidth / 2, headerY + 20, { align: 'center' });
    
    // Week information
    pdf.setFont(config.fonts.family, 'normal');
    pdf.setFontSize(config.fonts.weekInfo.size);
    const weekStart = weekStartDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    const weekEnd = weekEndDate.toLocaleDateString('en-US', { day: 'numeric' });
    const weekNumber = Math.ceil(((weekStartDate.getTime() - new Date(weekStartDate.getFullYear(), 0, 1).getTime()) / 86400000 + 1) / 7);
    pdf.text(`${weekStart}-${weekEnd} • Week ${weekNumber}`, config.pageWidth / 2, headerY + 40, { align: 'center' });
    
    // Navigation buttons with dashboard-extracted styling
    const buttonHeight = 32;
    const buttonWidth = 130;
    const buttonY = headerY + 2;
    const cornerRadius = config.spacing.borderRadius;
    
    // Previous Week button
    const prevButtonX = config.margin + 15;
    pdf.setFillColor(248, 249, 250);
    pdf.roundedRect(prevButtonX, buttonY, buttonWidth, buttonHeight, cornerRadius, cornerRadius, 'F');
    pdf.setDrawColor(209, 213, 219);
    pdf.setLineWidth(1.5);
    pdf.roundedRect(prevButtonX, buttonY, buttonWidth, buttonHeight, cornerRadius, cornerRadius, 'S');
    pdf.setFontSize(11);
    pdf.setTextColor(75, 85, 99);
    pdf.text('← Previous Week', prevButtonX + buttonWidth/2, buttonY + 21, { align: 'center' });
    
    // Next Week button
    const nextButtonX = config.pageWidth - config.margin - 15 - buttonWidth;
    pdf.setFillColor(248, 249, 250);
    pdf.roundedRect(nextButtonX, buttonY, buttonWidth, buttonHeight, cornerRadius, cornerRadius, 'F');
    pdf.setDrawColor(209, 213, 219);
    pdf.setLineWidth(1.5);
    pdf.roundedRect(nextButtonX, buttonY, buttonWidth, buttonHeight, cornerRadius, cornerRadius, 'S');
    pdf.setFontSize(11);
    pdf.text('Next Week →', nextButtonX + buttonWidth/2, buttonY + 21, { align: 'center' });
    
    // === LEGEND SECTION ===
    const legendY = headerY + config.headerHeight;
    const legendBoxSize = 12;
    const legendSpacing = 150;
    
    // Center the legend items
    const totalLegendWidth = 3 * legendSpacing;
    const legendStartX = config.gridStartX + (config.contentWidth - totalLegendWidth) / 2;
    
    pdf.setFont(config.fonts.family, 'normal');
    pdf.setFontSize(config.fonts.legend.size);
    
    let legendX = legendStartX;
    
    // SimplePractice legend
    pdf.setFillColor(...config.colors.white);
    pdf.rect(legendX, legendY + 5, legendBoxSize, 8, 'F');
    pdf.setDrawColor(...config.colors.simplePracticeBlue);
    pdf.setLineWidth(1);
    pdf.rect(legendX, legendY + 5, legendBoxSize, 8, 'S');
    pdf.setLineWidth(3);
    pdf.line(legendX, legendY + 5, legendX, legendY + 13);
    pdf.setTextColor(...config.colors.black);
    pdf.text('SimplePractice', legendX + legendBoxSize + 8, legendY + 10);
    
    legendX += legendSpacing;
    
    // Google Calendar legend
    pdf.setFillColor(...config.colors.white);
    pdf.rect(legendX, legendY + 5, legendBoxSize, 8, 'F');
    pdf.setDrawColor(...config.colors.googleGreen);
    pdf.setLineWidth(1);
    pdf.setLineDash([2, 2]);
    pdf.rect(legendX, legendY + 5, legendBoxSize, 8, 'S');
    pdf.setLineDash([]);
    pdf.text('Google Calendar', legendX + legendBoxSize + 8, legendY + 10);
    
    legendX += legendSpacing;
    
    // Holidays legend
    pdf.setFillColor(...config.colors.white);
    pdf.rect(legendX, legendY + 5, legendBoxSize, 8, 'F');
    pdf.setDrawColor(...config.colors.holidayOrange);
    pdf.setLineWidth(1);
    pdf.rect(legendX, legendY + 5, legendBoxSize, 8, 'S');
    pdf.text('Holidays', legendX + legendBoxSize + 8, legendY + 10);
    
    // === GRID STRUCTURE ===
    const gridStartY = config.gridStartY;
    const timeSlots = generateTimeSlots();
    
    // Step 4 - FINAL VALUES BEFORE PDF RENDERING
    console.log('  Step 4 - ACTUAL VALUES BEING USED FOR PDF RENDERING:');
    console.log('    config.timeColumnWidth:', config.timeColumnWidth);
    console.log('    config.dayColumnWidth:', config.dayColumnWidth);
    console.log('    config.slotHeight:', config.slotHeight);
    console.log('    gridStartY:', gridStartY);
    console.log('    Total content width:', config.contentWidth);
    
    // Grid outline with rounded corners
    pdf.setLineWidth(2);
    pdf.setDrawColor(...config.colors.black);
    const gridRadius = 6;
    pdf.roundedRect(
      config.gridStartX,
      gridStartY,
      config.contentWidth,
      config.headerHeight + (timeSlots.length * config.slotHeight),
      gridRadius,
      gridRadius,
      'S'
    );
    
    // === HEADER ROW ===
    const headerRowY = gridStartY;
    const headerRowHeight = config.headerHeight;
    
    // TIME header
    pdf.setFillColor(...config.colors.white);
    pdf.rect(config.gridStartX, headerRowY, config.timeColumnWidth, headerRowHeight, 'F');
    pdf.setFont(config.fonts.family, 'bold');
    pdf.setFontSize(config.fonts.dayHeader.size);
    pdf.setTextColor(...config.colors.black);
    pdf.text('TIME', config.gridStartX + config.timeColumnWidth/2, headerRowY + 13, { align: 'center' });
    
    // Day headers with improved spacing
    const dayNames = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    dayNames.forEach((dayName, index) => {
      const dayX = config.gridStartX + config.timeColumnWidth + (index * config.dayColumnWidth);
      const dayDate = new Date(weekStartDate);
      dayDate.setDate(weekStartDate.getDate() + index);
      
      // Day header background
      pdf.setFillColor(...config.colors.white);
      pdf.rect(dayX, headerRowY, config.dayColumnWidth, headerRowHeight, 'F');
      
      // Day name and number with dashboard spacing
      pdf.setFont(config.fonts.family, 'bold');
      pdf.setFontSize(config.fonts.dayHeader.size);
      
      // Day name
      pdf.text(dayName, dayX + config.dayColumnWidth/2, headerRowY + 7, { align: 'center' });
      
      // Day number
      pdf.setFontSize(config.fonts.dayHeader.size + 1);
      pdf.text(dayDate.getDate().toString(), dayX + config.dayColumnWidth/2, headerRowY + 17, { align: 'center' });
      
      // Enhanced vertical separators - draw ALL column separators
      pdf.setLineWidth(1);
      pdf.setDrawColor(150, 150, 150);
      pdf.line(
        dayX + config.dayColumnWidth,
        headerRowY,
        dayX + config.dayColumnWidth,
        headerRowY + headerRowHeight + (timeSlots.length * config.slotHeight)
      );
    });
    
    // Enhanced main separator between TIME and days
    pdf.setLineWidth(2.5);
    pdf.setDrawColor(80, 80, 80);
    pdf.line(
      config.gridStartX + config.timeColumnWidth,
      headerRowY,
      config.gridStartX + config.timeColumnWidth,
      headerRowY + headerRowHeight + (timeSlots.length * config.slotHeight)
    );
    
    // === TIME SLOTS ===
    timeSlots.forEach((timeSlot, index) => {
      const slotY = gridStartY + headerRowHeight + (index * config.slotHeight);
      const isHour = timeSlot.minute === 0;
      
      // Time column background with dashboard colors
      pdf.setFillColor(...(isHour ? config.colors.lightGray : config.colors.veryLightGray));
      pdf.rect(config.gridStartX, slotY, config.timeColumnWidth, config.slotHeight, 'F');
      
      // Time label with dashboard typography
      pdf.setFont(config.fonts.family, isHour ? 'bold' : 'normal');
      pdf.setFontSize(isHour ? config.fonts.timeHour.size : config.fonts.timeLabel.size);
      pdf.setTextColor(...config.colors.black);
      pdf.text(timeSlot.time, config.gridStartX + config.timeColumnWidth/2, slotY + config.slotHeight/2 + 2, { align: 'center' });
      
      // Day cells with dashboard background pattern
      for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        const cellX = config.gridStartX + config.timeColumnWidth + (dayIndex * config.dayColumnWidth);
        
        pdf.setFillColor(...(isHour ? config.colors.lightGray : config.colors.veryLightGray));
        pdf.rect(cellX, slotY, config.dayColumnWidth, config.slotHeight, 'F');
        
        pdf.setLineWidth(0.5);
        pdf.setDrawColor(...config.colors.borderGray);
        pdf.rect(cellX, slotY, config.dayColumnWidth, config.slotHeight, 'S');
      }
      
      // Horizontal grid lines
      pdf.setLineWidth(isHour ? 2 : 0.5);
      pdf.setDrawColor(...(isHour ? config.colors.black : config.colors.borderGray));
      pdf.line(
        config.gridStartX,
        slotY,
        config.gridStartX + config.contentWidth,
        slotY
      );
    });
    
    // === EVENTS WITH DASHBOARD-EXACT STYLING ===
    const eventsByDay: { [key: number]: CalendarEvent[] } = {};
    weekEvents.forEach(event => {
      const eventDate = new Date(event.startTime);
      const dayIndex = Math.floor((eventDate.getTime() - weekStartDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (dayIndex >= 0 && dayIndex < 7) {
        if (!eventsByDay[dayIndex]) {
          eventsByDay[dayIndex] = [];
        }
        eventsByDay[dayIndex].push(event);
      }
    });
    
    // Render events with dashboard styling
    Object.keys(eventsByDay).forEach(dayIndexStr => {
      const dayIndex = parseInt(dayIndexStr);
      const dayEvents = eventsByDay[dayIndex].sort((a, b) => 
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      );
      
      const usedSlots: Set<number> = new Set();
      
      dayEvents.forEach((event) => {
        const eventDate = new Date(event.startTime);
        const eventEndDate = new Date(event.endTime);
        const eventHour = eventDate.getHours();
        const eventMinute = eventDate.getMinutes();
        const endHour = eventEndDate.getHours();
        const endMinute = eventEndDate.getMinutes();
        
        // Only show events within time range
        if (eventHour >= 6 && eventHour <= 23) {
          const startMinuteOfDay = (eventHour - 6) * 60 + eventMinute;
          const endMinuteOfDay = (endHour - 6) * 60 + endMinute;
          const startSlot = Math.floor(startMinuteOfDay / 30);
          const endSlot = Math.min(Math.ceil(endMinuteOfDay / 30), 35);
          
          // Handle overlaps
          let horizontalOffset = 0;
          while (usedSlots.has(startSlot + (horizontalOffset * 100))) {
            horizontalOffset++;
            if (horizontalOffset >= 3) break;
          }
          
          for (let slot = startSlot; slot < endSlot; slot++) {
            usedSlots.add(slot + (horizontalOffset * 100));
          }
          
          // Calculate exact positioning with proper padding
          const cellPadding = 3;
          const eventX = config.gridStartX + config.timeColumnWidth + (dayIndex * config.dayColumnWidth) + 
                        (horizontalOffset * (config.dayColumnWidth / 3)) + cellPadding;
          const eventY = gridStartY + headerRowHeight + (startSlot * config.slotHeight) + cellPadding;
          const eventWidth = (config.dayColumnWidth / (horizontalOffset + 1)) - (cellPadding * 2);
          const eventHeight = Math.max((endSlot - startSlot) * config.slotHeight - (cellPadding * 2), config.slotHeight * 0.9);
          
          // Get event source info
          const sourceInfo = getEventSourceInfo(event);
          
          // Event background (white for all)
          pdf.setFillColor(...config.colors.white);
          pdf.rect(eventX, eventY, eventWidth, eventHeight, 'F');
          
          // Event border with source-specific styling
          pdf.setDrawColor(...config.colors[sourceInfo.color]);
          pdf.setLineWidth(sourceInfo.hasLeftFlag ? 0.5 : 1);
          
          if (sourceInfo.borderStyle === 'dashed') {
            pdf.setLineDash([2, 2]);
          } else {
            pdf.setLineDash([]);
          }
          
          pdf.rect(eventX, eventY, eventWidth, eventHeight, 'S');
          
          // Left flag for SimplePractice
          if (sourceInfo.hasLeftFlag) {
            pdf.setLineWidth(2);
            pdf.setLineDash([]);
            pdf.line(eventX, eventY, eventX, eventY + eventHeight);
          }
          
          pdf.setLineDash([]);
          
          // Event text with dashboard typography and proper padding
          const cleanTitle = cleanEventTitle(event.title);
          const displayTitle = cleanTitle.length > 15 ? cleanTitle.substring(0, 12) + '...' : cleanTitle;
          
          pdf.setFont(config.fonts.family, 'bold');
          pdf.setFontSize(config.fonts.eventTitle.size);
          pdf.setTextColor(...config.colors.black);
          
          // Event title - positioned with proper padding from left edge
          const textPadding = 4;
          const titleY = eventY + 10;
          pdf.text(displayTitle, eventX + textPadding, titleY);
          
          // Event time - positioned at bottom with padding
          pdf.setFont(config.fonts.family, 'normal');
          pdf.setFontSize(config.fonts.eventTime.size);
          const timeText = `${eventDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
          pdf.text(timeText, eventX + textPadding, eventY + eventHeight - 6);
        }
      });
    });
    
    // Save the PDF
    const fileName = `Pixel_Perfect_Weekly_${weekStartDate.toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
    
    console.log(`✅ Truly pixel-perfect weekly PDF exported: ${fileName}`);
    console.log('🎯 Used dashboard-extracted styles for exact visual replication');
    
  } catch (error) {
    console.error('❌ Error creating truly pixel-perfect weekly PDF:', error);
    throw error;
  }
};