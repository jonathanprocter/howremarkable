import jsPDF from 'jspdf';
import { CalendarEvent } from '../types/calendar';
import { cleanEventTitle, cleanTextForPDF } from './titleCleaner';
import { generateTimeSlots } from './timeSlots';

/**
 * Pixel-Perfect Weekly PDF Export
 * Creates exact replica of the dashboard view based on the attached PDF analysis
 */

const PIXEL_PERFECT_CONFIG = {
  // Page dimensions - 11x8.5 landscape
  pageWidth: 792,
  pageHeight: 612,
  
  // Exact dashboard margins and spacing
  margin: 20,
  headerHeight: 60,
  legendHeight: 25,
  
  // Grid configuration matching dashboard exactly
  timeColumnWidth: 80,
  slotHeight: 30,
  
  // Dashboard colors
  colors: {
    white: [255, 255, 255],
    black: [0, 0, 0],
    lightGray: [240, 240, 240],
    veryLightGray: [248, 248, 248],
    simplePracticeBlue: [100, 149, 237],
    googleGreen: [34, 197, 94],
    holidayOrange: [245, 158, 11],
    borderGray: [200, 200, 200]
  },
  
  // Typography matching dashboard exactly
  fonts: {
    title: { size: 16, weight: 'bold' },
    weekInfo: { size: 12, weight: 'normal' },
    legend: { size: 8, weight: 'normal' },
    dayHeader: { size: 8, weight: 'bold' },
    timeLabel: { size: 8, weight: 'normal' },
    timeHour: { size: 9, weight: 'bold' },
    eventTitle: { size: 6, weight: 'bold' },
    eventTime: { size: 5, weight: 'normal' }
  },
  
  get contentWidth() {
    return this.pageWidth - (2 * this.margin);
  },
  
  get dayColumnWidth() {
    return Math.floor((this.contentWidth - this.timeColumnWidth) / 7);
  },
  
  get gridStartX() {
    return this.margin;
  },
  
  get gridStartY() {
    return this.margin + this.headerHeight + this.legendHeight;
  }
};

export const exportPixelPerfectWeeklyPDF = async (
  weekStartDate: Date,
  weekEndDate: Date,
  events: CalendarEvent[]
): Promise<void> => {
  try {
    console.log('🎯 Creating pixel-perfect weekly PDF...');

    // Filter events for the week
    const weekEvents = events.filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate >= weekStartDate && eventDate <= weekEndDate;
    });

    // Create PDF
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'pt',
      format: [792, 612]
    });

    // White background
    pdf.setFillColor(...PIXEL_PERFECT_CONFIG.colors.white);
    pdf.rect(0, 0, PIXEL_PERFECT_CONFIG.pageWidth, PIXEL_PERFECT_CONFIG.pageHeight, 'F');

    // === HEADER SECTION ===
    const headerY = PIXEL_PERFECT_CONFIG.margin;
    
    // Main title
    pdf.setFont('times', 'bold');
    pdf.setFontSize(PIXEL_PERFECT_CONFIG.fonts.title.size);
    pdf.setTextColor(...PIXEL_PERFECT_CONFIG.colors.black);
    pdf.text('WEEKLY CALENDAR', PIXEL_PERFECT_CONFIG.pageWidth / 2, headerY + 20, { align: 'center' });

    // Week information
    pdf.setFont('times', 'normal');
    pdf.setFontSize(PIXEL_PERFECT_CONFIG.fonts.weekInfo.size);
    const weekStart = weekStartDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    const weekEnd = weekEndDate.toLocaleDateString('en-US', { day: 'numeric' });
    const weekNumber = Math.ceil(((weekStartDate.getTime() - new Date(weekStartDate.getFullYear(), 0, 1).getTime()) / 86400000 + 1) / 7);
    pdf.text(`${weekStart}-${weekEnd} • Week ${weekNumber}`, PIXEL_PERFECT_CONFIG.pageWidth / 2, headerY + 40, { align: 'center' });

    // Navigation buttons - exact dashboard styling
    const buttonHeight = 20;
    const buttonWidth = 120;
    const buttonY = headerY + 5;
    
    // Previous Week button
    const prevButtonX = PIXEL_PERFECT_CONFIG.margin + 20;
    pdf.setFillColor(245, 245, 245);
    pdf.rect(prevButtonX, buttonY, buttonWidth, buttonHeight, 'F');
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(1);
    pdf.rect(prevButtonX, buttonY, buttonWidth, buttonHeight, 'S');
    pdf.setFontSize(10);
    pdf.setTextColor(...PIXEL_PERFECT_CONFIG.colors.black);
    pdf.text('!• Previous Week', prevButtonX + buttonWidth/2, buttonY + 13, { align: 'center' });
    
    // Next Week button  
    const nextButtonX = PIXEL_PERFECT_CONFIG.pageWidth - PIXEL_PERFECT_CONFIG.margin - 20 - buttonWidth;
    pdf.setFillColor(245, 245, 245);
    pdf.rect(nextButtonX, buttonY, buttonWidth, buttonHeight, 'F');
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(1);
    pdf.rect(nextButtonX, buttonY, buttonWidth, buttonHeight, 'S');
    pdf.setFontSize(10);
    pdf.text('Next Week !\'', nextButtonX + buttonWidth/2, buttonY + 13, { align: 'center' });

    // === LEGEND SECTION ===
    const legendY = headerY + PIXEL_PERFECT_CONFIG.headerHeight;
    const legendBoxSize = 12;
    const legendSpacing = 150;
    
    // Center the legend items
    const totalLegendWidth = 3 * legendSpacing;
    const legendStartX = PIXEL_PERFECT_CONFIG.gridStartX + (PIXEL_PERFECT_CONFIG.contentWidth - totalLegendWidth) / 2;
    
    pdf.setFont('times', 'normal');
    pdf.setFontSize(PIXEL_PERFECT_CONFIG.fonts.legend.size);
    
    let legendX = legendStartX;
    
    // SimplePractice
    pdf.setFillColor(...PIXEL_PERFECT_CONFIG.colors.white);
    pdf.rect(legendX, legendY + 5, legendBoxSize, 8, 'F');
    pdf.setDrawColor(...PIXEL_PERFECT_CONFIG.colors.simplePracticeBlue);
    pdf.setLineWidth(1);
    pdf.rect(legendX, legendY + 5, legendBoxSize, 8, 'S');
    pdf.setLineWidth(3);
    pdf.line(legendX, legendY + 5, legendX, legendY + 13);
    pdf.setTextColor(...PIXEL_PERFECT_CONFIG.colors.black);
    pdf.text('SimplePractice', legendX + legendBoxSize + 8, legendY + 10);
    
    legendX += legendSpacing;
    
    // Google Calendar
    pdf.setFillColor(...PIXEL_PERFECT_CONFIG.colors.white);
    pdf.rect(legendX, legendY + 5, legendBoxSize, 8, 'F');
    pdf.setDrawColor(...PIXEL_PERFECT_CONFIG.colors.googleGreen);
    pdf.setLineWidth(1);
    pdf.setLineDash([2, 2]);
    pdf.rect(legendX, legendY + 5, legendBoxSize, 8, 'S');
    pdf.setLineDash([]);
    pdf.text('Google Calendar', legendX + legendBoxSize + 8, legendY + 10);
    
    legendX += legendSpacing;
    
    // Holidays
    pdf.setFillColor(...PIXEL_PERFECT_CONFIG.colors.white);
    pdf.rect(legendX, legendY + 5, legendBoxSize, 8, 'F');
    pdf.setDrawColor(...PIXEL_PERFECT_CONFIG.colors.holidayOrange);
    pdf.setLineWidth(1);
    pdf.rect(legendX, legendY + 5, legendBoxSize, 8, 'S');
    pdf.text('Holidays', legendX + legendBoxSize + 8, legendY + 10);

    // === GRID STRUCTURE ===
    const gridStartY = PIXEL_PERFECT_CONFIG.gridStartY;
    const timeSlots = generateTimeSlots();
    
    // Grid outline
    pdf.setLineWidth(2);
    pdf.setDrawColor(...PIXEL_PERFECT_CONFIG.colors.black);
    pdf.rect(
      PIXEL_PERFECT_CONFIG.gridStartX, 
      gridStartY, 
      PIXEL_PERFECT_CONFIG.contentWidth, 
      20 + (timeSlots.length * PIXEL_PERFECT_CONFIG.slotHeight)
    );

    // === HEADER ROW ===
    const headerRowY = gridStartY;
    const headerRowHeight = 20;
    
    // TIME header
    pdf.setFillColor(...PIXEL_PERFECT_CONFIG.colors.white);
    pdf.rect(PIXEL_PERFECT_CONFIG.gridStartX, headerRowY, PIXEL_PERFECT_CONFIG.timeColumnWidth, headerRowHeight, 'F');
    pdf.setFont('times', 'bold');
    pdf.setFontSize(PIXEL_PERFECT_CONFIG.fonts.dayHeader.size);
    pdf.setTextColor(...PIXEL_PERFECT_CONFIG.colors.black);
    pdf.text('TIME', PIXEL_PERFECT_CONFIG.gridStartX + PIXEL_PERFECT_CONFIG.timeColumnWidth/2, headerRowY + 13, { align: 'center' });
    
    // Day headers
    const dayNames = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    dayNames.forEach((dayName, index) => {
      const dayX = PIXEL_PERFECT_CONFIG.gridStartX + PIXEL_PERFECT_CONFIG.timeColumnWidth + (index * PIXEL_PERFECT_CONFIG.dayColumnWidth);
      const dayDate = new Date(weekStartDate);
      dayDate.setDate(weekStartDate.getDate() + index);
      
      // Day header background
      pdf.setFillColor(...PIXEL_PERFECT_CONFIG.colors.white);
      pdf.rect(dayX, headerRowY, PIXEL_PERFECT_CONFIG.dayColumnWidth, headerRowHeight, 'F');
      
      // Day name and number
      pdf.setFont('times', 'bold');
      pdf.setFontSize(PIXEL_PERFECT_CONFIG.fonts.dayHeader.size);
      pdf.text(dayName, dayX + PIXEL_PERFECT_CONFIG.dayColumnWidth/2, headerRowY + 8, { align: 'center' });
      pdf.text(dayDate.getDate().toString(), dayX + PIXEL_PERFECT_CONFIG.dayColumnWidth/2, headerRowY + 16, { align: 'center' });
      
      // Vertical separator
      if (index < 6) {
        pdf.setLineWidth(1);
        pdf.setDrawColor(...PIXEL_PERFECT_CONFIG.colors.black);
        pdf.line(
          dayX + PIXEL_PERFECT_CONFIG.dayColumnWidth, 
          headerRowY, 
          dayX + PIXEL_PERFECT_CONFIG.dayColumnWidth, 
          headerRowY + headerRowHeight + (timeSlots.length * PIXEL_PERFECT_CONFIG.slotHeight)
        );
      }
    });
    
    // Vertical separator between time column and day columns
    pdf.setLineWidth(2);
    pdf.setDrawColor(...PIXEL_PERFECT_CONFIG.colors.black);
    pdf.line(
      PIXEL_PERFECT_CONFIG.gridStartX + PIXEL_PERFECT_CONFIG.timeColumnWidth,
      headerRowY,
      PIXEL_PERFECT_CONFIG.gridStartX + PIXEL_PERFECT_CONFIG.timeColumnWidth,
      headerRowY + headerRowHeight + (timeSlots.length * PIXEL_PERFECT_CONFIG.slotHeight)
    );

    // === TIME SLOTS ===
    timeSlots.forEach((timeSlot, index) => {
      const slotY = gridStartY + headerRowHeight + (index * PIXEL_PERFECT_CONFIG.slotHeight);
      const isHour = timeSlot.minute === 0;
      
      // Time column background
      pdf.setFillColor(...(isHour ? PIXEL_PERFECT_CONFIG.colors.lightGray : PIXEL_PERFECT_CONFIG.colors.veryLightGray));
      pdf.rect(PIXEL_PERFECT_CONFIG.gridStartX, slotY, PIXEL_PERFECT_CONFIG.timeColumnWidth, PIXEL_PERFECT_CONFIG.slotHeight, 'F');
      
      // Time label
      pdf.setFont('times', isHour ? 'bold' : 'normal');
      pdf.setFontSize(isHour ? PIXEL_PERFECT_CONFIG.fonts.timeHour.size : PIXEL_PERFECT_CONFIG.fonts.timeLabel.size);
      pdf.setTextColor(...PIXEL_PERFECT_CONFIG.colors.black);
      pdf.text(timeSlot.time, PIXEL_PERFECT_CONFIG.gridStartX + PIXEL_PERFECT_CONFIG.timeColumnWidth/2, slotY + PIXEL_PERFECT_CONFIG.slotHeight/2 + 2, { align: 'center' });
      
      // Day cells
      for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        const cellX = PIXEL_PERFECT_CONFIG.gridStartX + PIXEL_PERFECT_CONFIG.timeColumnWidth + (dayIndex * PIXEL_PERFECT_CONFIG.dayColumnWidth);
        
        // Cell background - exact dashboard alternating colors
        pdf.setFillColor(...(isHour ? PIXEL_PERFECT_CONFIG.colors.lightGray : PIXEL_PERFECT_CONFIG.colors.veryLightGray));
        pdf.rect(cellX, slotY, PIXEL_PERFECT_CONFIG.dayColumnWidth, PIXEL_PERFECT_CONFIG.slotHeight, 'F');
        
        // Cell border
        pdf.setLineWidth(0.5);
        pdf.setDrawColor(...PIXEL_PERFECT_CONFIG.colors.borderGray);
        pdf.rect(cellX, slotY, PIXEL_PERFECT_CONFIG.dayColumnWidth, PIXEL_PERFECT_CONFIG.slotHeight, 'S');
      }
      
      // Horizontal grid line
      pdf.setLineWidth(isHour ? 2 : 0.5);
      pdf.setDrawColor(...(isHour ? PIXEL_PERFECT_CONFIG.colors.black : PIXEL_PERFECT_CONFIG.colors.borderGray));
      pdf.line(
        PIXEL_PERFECT_CONFIG.gridStartX,
        slotY,
        PIXEL_PERFECT_CONFIG.gridStartX + PIXEL_PERFECT_CONFIG.contentWidth,
        slotY
      );
    });

    // === EVENTS ===
    console.log(`📅 Rendering ${weekEvents.length} events for pixel-perfect weekly PDF`);
    
    // Group events by day
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

    // Render events
    Object.keys(eventsByDay).forEach(dayIndexStr => {
      const dayIndex = parseInt(dayIndexStr);
      const dayEvents = eventsByDay[dayIndex].sort((a, b) => 
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      );
      
      const usedSlots: Set<number> = new Set();
      
      dayEvents.forEach((event, eventIndex) => {
        const eventDate = new Date(event.startTime);
        const eventEndDate = new Date(event.endTime);
        const eventHour = eventDate.getHours();
        const eventMinute = eventDate.getMinutes();
        const endHour = eventEndDate.getHours();
        const endMinute = eventEndDate.getMinutes();

        // Only show events within our time range (6:00-23:30)
        if (eventHour >= 6 && eventHour <= 23) {
          // Calculate slot position
          const startMinuteOfDay = (eventHour - 6) * 60 + eventMinute;
          const endMinuteOfDay = (endHour - 6) * 60 + endMinute;
          const startSlot = Math.floor(startMinuteOfDay / 30);
          const endSlot = Math.min(Math.ceil(endMinuteOfDay / 30), 35);
          
          // Handle overlaps
          let horizontalOffset = 0;
          while (horizontalOffset < 3) {
            let hasOverlap = false;
            for (let slot = startSlot; slot < endSlot; slot++) {
              if (usedSlots.has(slot * 10 + horizontalOffset)) {
                hasOverlap = true;
                break;
              }
            }
            
            if (!hasOverlap) {
              for (let slot = startSlot; slot < endSlot; slot++) {
                usedSlots.add(slot * 10 + horizontalOffset);
              }
              break;
            }
            
            horizontalOffset++;
          }
          
          // Event dimensions
          const baseEventWidth = PIXEL_PERFECT_CONFIG.dayColumnWidth - 4;
          const eventWidth = horizontalOffset > 0 ? Math.max(baseEventWidth * 0.6, 40) : baseEventWidth;
          const eventHeight = Math.max((endSlot - startSlot) * PIXEL_PERFECT_CONFIG.slotHeight - 2, 10);
          
          // Event position
          const eventX = PIXEL_PERFECT_CONFIG.gridStartX + PIXEL_PERFECT_CONFIG.timeColumnWidth + (dayIndex * PIXEL_PERFECT_CONFIG.dayColumnWidth) + 2 + (horizontalOffset * (eventWidth * 0.3));
          const eventY = gridStartY + headerRowHeight + (startSlot * PIXEL_PERFECT_CONFIG.slotHeight) + 2;
          
          // Event type detection
          const isSimplePractice = event.source === 'simplepractice' || event.title.includes('Appointment');
          const isGoogle = event.source === 'google' && !isSimplePractice;
          const isHoliday = event.title.toLowerCase().includes('holiday') || event.source === 'holiday';

          // White background for all events
          pdf.setFillColor(...PIXEL_PERFECT_CONFIG.colors.white);
          pdf.rect(eventX, eventY, eventWidth, eventHeight, 'F');

          // Event borders - exact dashboard styling
          if (isSimplePractice) {
            // SimplePractice: cornflower blue border with thick left flag
            pdf.setDrawColor(...PIXEL_PERFECT_CONFIG.colors.simplePracticeBlue);
            pdf.setLineWidth(1);
            pdf.rect(eventX, eventY, eventWidth, eventHeight, 'S');
            pdf.setLineWidth(4);
            pdf.line(eventX, eventY, eventX, eventY + eventHeight);
          } else if (isGoogle) {
            // Google Calendar: dashed green border
            pdf.setDrawColor(...PIXEL_PERFECT_CONFIG.colors.googleGreen);
            pdf.setLineWidth(1);
            pdf.setLineDash([2, 2]);
            pdf.rect(eventX, eventY, eventWidth, eventHeight, 'S');
            pdf.setLineDash([]);
          } else if (isHoliday) {
            // Holidays: orange border
            pdf.setDrawColor(...PIXEL_PERFECT_CONFIG.colors.holidayOrange);
            pdf.setLineWidth(1);
            pdf.rect(eventX, eventY, eventWidth, eventHeight, 'S');
          }

          // Event text
          const eventTitle = cleanEventTitle(event.title);
          const startTime = eventDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
          const endTime = eventEndDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

          pdf.setTextColor(...PIXEL_PERFECT_CONFIG.colors.black);
          
          // Event name
          if (eventHeight >= 10) {
            pdf.setFont('times', 'bold');
            pdf.setFontSize(PIXEL_PERFECT_CONFIG.fonts.eventTitle.size);
            
            const textX = isSimplePractice ? eventX + 8 : eventX + 4;
            const maxWidth = eventWidth - (isSimplePractice ? 12 : 8);
            
            // Text wrapping
            const words = eventTitle.split(' ');
            let currentLine = '';
            let lineY = eventY + 8;
            
            for (const word of words) {
              const testLine = currentLine ? `${currentLine} ${word}` : word;
              const textWidth = pdf.getTextWidth(testLine);
              
              if (textWidth <= maxWidth) {
                currentLine = testLine;
              } else {
                if (currentLine && lineY < eventY + eventHeight - 5) {
                  pdf.text(currentLine, textX, lineY);
                  lineY += 7;
                  currentLine = word;
                } else {
                  break;
                }
              }
            }
            
            if (currentLine && lineY < eventY + eventHeight - 5) {
              pdf.text(currentLine, textX, lineY);
            }
          }
          
          // Event time
          if (eventHeight >= 16) {
            pdf.setFont('times', 'normal');
            pdf.setFontSize(PIXEL_PERFECT_CONFIG.fonts.eventTime.size);
            const timeText = `${startTime}-${endTime}`;
            const textX = isSimplePractice ? eventX + 8 : eventX + 4;
            pdf.text(timeText, textX, eventY + eventHeight - 3);
          }
        }
      });
    });

    // Final grid outline
    pdf.setLineWidth(2);
    pdf.setDrawColor(...PIXEL_PERFECT_CONFIG.colors.black);
    pdf.rect(
      PIXEL_PERFECT_CONFIG.gridStartX,
      gridStartY,
      PIXEL_PERFECT_CONFIG.contentWidth,
      headerRowHeight + (timeSlots.length * PIXEL_PERFECT_CONFIG.slotHeight)
    );

    // Save PDF
    const filename = `Pixel_Perfect_Weekly_${weekStartDate.toLocaleDateString('en-US').replace(/\//g, '-')}.pdf`;
    pdf.save(filename);
    
    console.log('✅ Pixel-perfect weekly PDF exported successfully!');
    
  } catch (error) {
    console.error('❌ Pixel-perfect PDF export error:', error);
    throw error;
  }
};