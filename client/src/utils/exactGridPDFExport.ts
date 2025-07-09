import jsPDF from 'jspdf';
import { CalendarEvent } from '../types/calendar';
import { cleanEventTitle, cleanTextForPDF } from './titleCleaner';
import { generateTimeSlots } from './timeSlots';

// Exact dashboard-matching landscape configuration for weekly calendar
const GRID_CONFIG = {
  // Page setup - 11x8.5 landscape dimensions
  pageWidth: 792,   // 11 inches = 792 points
  pageHeight: 612,  // 8.5 inches = 612 points

  // Improved spacing for better readability
  margin: 25,  // Increased margin for better spacing
  headerHeight: 50,  // Increased header height for navigation buttons
  statsHeight: 0, // Remove stats section to maximize grid space
  legendHeight: 25,  // Increased legend height for better visibility

  // Grid structure - improved spacing
  timeColumnWidth: 60, // Increased time column width for better readability
  slotHeight: 14, // Increased slot height for better appointment visibility
  get totalSlots() {
    return generateTimeSlots().length; // Dynamic slot count based on time range
  },

  get contentWidth() {
    return this.pageWidth - (2 * this.margin);
  },

  get dayColumnWidth() {
    // Calculate day column width to use remaining space evenly
    return Math.floor((this.contentWidth - this.timeColumnWidth) / 7);
  },

  get totalGridWidth() {
    // Use FULL content width
    return this.contentWidth;
  },

  get gridStartX() {
    // Start at margin
    return this.margin;
  },

  get gridStartY() {
    return this.margin + this.headerHeight + this.legendHeight;
  },

  get gridHeight() {
    // Use remaining vertical space after headers - ensure full 36 slots are visible
    return this.totalSlots * this.slotHeight;
  }
};

export const exportExactGridPDF = async (
  weekStartDate: Date,
  weekEndDate: Date,
  events: CalendarEvent[]
): Promise<void> => {
  try {
    console.log('Creating PDF with exact grid layout...');

    // Filter events for the week
    const weekEvents = events.filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate >= weekStartDate && eventDate <= weekEndDate;
    });

    // Create PDF with 8.5 x 11 inch landscape dimensions (smaller format)
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'pt',
      format: [792, 612] // 11 x 8.5 inches (landscape)
    });

    // Use full width layout positions
    const centerX = GRID_CONFIG.gridStartX;
    const centerY = GRID_CONFIG.margin;

    // White background
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, GRID_CONFIG.pageWidth, GRID_CONFIG.pageHeight, 'F');

    // HEADER - improved spacing and navigation
    pdf.setFont('times', 'bold');
    pdf.setFontSize(16);  // Larger title font for better visibility
    pdf.setTextColor(0, 0, 0);
    pdf.text('WEEKLY CALENDAR', GRID_CONFIG.pageWidth / 2, centerY + 20, { align: 'center' });

    // Week info
    pdf.setFont('times', 'normal');
    pdf.setFontSize(12);  // Larger week info font
    const weekStart = weekStartDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    const weekEnd = weekEndDate.toLocaleDateString('en-US', { day: 'numeric' });
    const weekNumber = Math.ceil(((weekStartDate.getTime() - new Date(weekStartDate.getFullYear(), 0, 1).getTime()) / 86400000 + 1) / 7);
    pdf.text(`${weekStart}-${weekEnd} • Week ${weekNumber}`, GRID_CONFIG.pageWidth / 2, centerY + 35, { align: 'center' });

    // Navigation buttons - styled to match dashboard
    const buttonHeight = 20;
    const buttonWidth = 100;
    
    // Previous week button
    const prevButtonX = centerX + 50;
    const prevButtonY = centerY + 8;
    pdf.setFillColor(245, 245, 245);
    pdf.rect(prevButtonX, prevButtonY, buttonWidth, buttonHeight, 'F');
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(1);
    pdf.rect(prevButtonX, prevButtonY, buttonWidth, buttonHeight, 'S');
    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);
    pdf.text('← Previous Week', prevButtonX + buttonWidth/2, prevButtonY + 13, { align: 'center' });
    
    // Next week button
    const nextButtonX = GRID_CONFIG.pageWidth - centerX - 50 - buttonWidth;
    const nextButtonY = centerY + 8;
    pdf.setFillColor(245, 245, 245);
    pdf.rect(nextButtonX, nextButtonY, buttonWidth, buttonHeight, 'F');
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(1);
    pdf.rect(nextButtonX, nextButtonY, buttonWidth, buttonHeight, 'S');
    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Next Week →', nextButtonX + buttonWidth/2, nextButtonY + 13, { align: 'center' });

    // LEGEND - positioned below header with improved spacing
    const legendY = centerY + GRID_CONFIG.headerHeight + 5;
    const legendWidth = GRID_CONFIG.totalGridWidth;
    
    pdf.setFillColor(248, 248, 248);
    pdf.rect(centerX, legendY, legendWidth, GRID_CONFIG.legendHeight, 'F');
    pdf.setLineWidth(1);
    pdf.setDrawColor(0, 0, 0);
    pdf.rect(centerX, legendY, legendWidth, GRID_CONFIG.legendHeight, 'S');

    pdf.setFont('times', 'normal');
    pdf.setFontSize(8);  // Exact dashboard legend font size

    // Legend items - exact dashboard spacing
    const legendItemSpacing = 100;  // Exact dashboard spacing
    const totalLegendWidth = 3 * legendItemSpacing;
    const legendStartX = centerX + (legendWidth - totalLegendWidth) / 2;

    let legendX = legendStartX;

    // SimplePractice - white background with cornflower blue border and thick left flag
    pdf.setFillColor(255, 255, 255);
    pdf.rect(legendX, legendY + 3, 8, 5, 'F');  // Exact dashboard legend boxes
    pdf.setDrawColor(100, 149, 237);
    pdf.setLineWidth(0.5);
    pdf.rect(legendX, legendY + 3, 8, 5, 'S');
    pdf.setLineWidth(1.5);  // Exact dashboard left flag thickness
    pdf.line(legendX, legendY + 3, legendX, legendY + 8);
    pdf.setTextColor(0, 0, 0);
    pdf.text('SimplePractice', legendX + 12, legendY + 6);

    legendX += legendItemSpacing;

    // Google Calendar - white background with dashed green border
    pdf.setFillColor(255, 255, 255);
    pdf.rect(legendX, legendY + 3, 8, 5, 'F');  // Exact dashboard legend boxes
    pdf.setDrawColor(34, 197, 94);
    pdf.setLineWidth(0.5);
    pdf.setLineDash([1, 1]);
    pdf.rect(legendX, legendY + 3, 8, 5, 'S');
    pdf.setLineDash([]);
    pdf.text('Google Calendar', legendX + 12, legendY + 6);

    legendX += legendItemSpacing;

    // Holidays - filled yellow square
    pdf.setFillColor(255, 255, 0);
    pdf.rect(legendX, legendY + 3, 8, 5, 'F');  // Exact dashboard legend boxes
    pdf.setDrawColor(245, 158, 11);
    pdf.setLineWidth(0.5);
    pdf.rect(legendX, legendY + 3, 8, 5, 'S');
    pdf.text('Holidays', legendX + 12, legendY + 6);

    // GRID STRUCTURE - full width utilization
    const gridStartY = GRID_CONFIG.gridStartY;

    // Grid border - full width
    pdf.setLineWidth(2);
    pdf.setDrawColor(0, 0, 0);
    pdf.rect(centerX, gridStartY, GRID_CONFIG.totalGridWidth, 30 + GRID_CONFIG.gridHeight);

    // HEADERS
    // Time header
    pdf.setFillColor(255, 255, 255);
    pdf.rect(centerX, gridStartY, GRID_CONFIG.timeColumnWidth, 20, 'F');
    pdf.setFont('times', 'bold');
    pdf.setFontSize(8);  // Exact dashboard time header font
    pdf.setTextColor(0, 0, 0);
    pdf.text('TIME', centerX + GRID_CONFIG.timeColumnWidth/2, gridStartY + 13, { align: 'center' });

    // Day headers
    const dayNames = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    dayNames.forEach((dayName, index) => {
      const dayX = centerX + GRID_CONFIG.timeColumnWidth + (index * GRID_CONFIG.dayColumnWidth);
      const dayDate = new Date(weekStartDate);
      dayDate.setDate(weekStartDate.getDate() + index);

      // Day header background
      pdf.setFillColor(255, 255, 255);
      pdf.rect(dayX, gridStartY, GRID_CONFIG.dayColumnWidth, 20, 'F');

      // Day name
      pdf.setFont('times', 'bold');
      pdf.setFontSize(7);  // Exact dashboard day name font
      pdf.setTextColor(0, 0, 0);
      pdf.text(dayName, dayX + GRID_CONFIG.dayColumnWidth/2, gridStartY + 10, { align: 'center' });

      // Day number
      pdf.setFontSize(8);  // Exact dashboard day number font
      pdf.setTextColor(0, 0, 0);
      pdf.text(dayDate.getDate().toString(), dayX + GRID_CONFIG.dayColumnWidth/2, gridStartY + 17, { align: 'center' });

      // Vertical border between days
      if (index < 6) {
        pdf.setLineWidth(0.5);
        pdf.setDrawColor(0, 0, 0);
        pdf.line(dayX + GRID_CONFIG.dayColumnWidth, gridStartY, dayX + GRID_CONFIG.dayColumnWidth, gridStartY + 20 + GRID_CONFIG.gridHeight);
      }
    });

    // TIME SLOTS AND GRID - use the proper generateTimeSlots function
    const timeSlots = generateTimeSlots().map(slot => ({
      ...slot,
      isHour: slot.minute === 0
    }));

    console.log(`Generated ${timeSlots.length} time slots from ${timeSlots[0]?.time} to ${timeSlots[timeSlots.length - 1]?.time}`);

    timeSlots.forEach((slot, index) => {
      const y = gridStartY + 20 + (index * GRID_CONFIG.slotHeight);

      // Time slot background - exact dashboard colors
      pdf.setFillColor(slot.isHour ? 240 : 248, slot.isHour ? 240 : 248, slot.isHour ? 240 : 248);
      pdf.rect(centerX, y, GRID_CONFIG.timeColumnWidth, GRID_CONFIG.slotHeight, 'F');

      // Time label - exact dashboard fonts
      pdf.setFont('times', slot.isHour ? 'bold' : 'normal');
      pdf.setFontSize(slot.isHour ? 6 : 5);  // Exact dashboard time fonts
      pdf.setTextColor(0, 0, 0);
      pdf.text(slot.time, centerX + GRID_CONFIG.timeColumnWidth/2, y + GRID_CONFIG.slotHeight/2 + 1.5, { align: 'center' });

      // Day cells
      for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        const cellX = centerX + GRID_CONFIG.timeColumnWidth + (dayIndex * GRID_CONFIG.dayColumnWidth);

        // Cell background - exact dashboard alternating colors
        pdf.setFillColor(slot.isHour ? 240 : 255, slot.isHour ? 240 : 255, slot.isHour ? 240 : 255);
        pdf.rect(cellX, y, GRID_CONFIG.dayColumnWidth, GRID_CONFIG.slotHeight, 'F');

        // Cell border - consistent grid lines
        pdf.setLineWidth(0.5);
        pdf.setDrawColor(200, 200, 200);
        pdf.rect(cellX, y, GRID_CONFIG.dayColumnWidth, GRID_CONFIG.slotHeight, 'S');
      }

      // Horizontal grid lines - stronger for hour marks
      if (slot.isHour) {
        pdf.setLineWidth(1.5);
        pdf.setDrawColor(100, 100, 100);
      } else {
        pdf.setLineWidth(0.5);
        pdf.setDrawColor(200, 200, 200);
      }
      pdf.line(centerX, y, centerX + GRID_CONFIG.totalGridWidth, y);
    });

    // EVENTS - place them exactly like dashboard with NO overlapping using absolute positioning
    console.log(`📅 Rendering ${weekEvents.length} events for weekly PDF export`);
    
    // Group events by day to handle overlaps properly
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

    // Render events for each day with proper positioning
    Object.keys(eventsByDay).forEach(dayIndexStr => {
      const dayIndex = parseInt(dayIndexStr);
      const dayEvents = eventsByDay[dayIndex].sort((a, b) => 
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      );
      
      console.log(`📅 Day ${dayIndex}: ${dayEvents.length} events`);
      
      // Track used time slots for overlap detection
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
          // Calculate precise slot position matching dashboard
          const startMinuteOfDay = (eventHour - 6) * 60 + eventMinute;
          const endMinuteOfDay = (endHour - 6) * 60 + endMinute;
          
          // Convert to slot positions (each slot is 30 minutes)
          const startSlot = Math.floor(startMinuteOfDay / 30);
          const endSlot = Math.min(Math.ceil(endMinuteOfDay / 30), 35); // Cap at 23:30
          
          // Check for overlaps and adjust position
          let horizontalOffset = 0;
          const maxOverlaps = 3; // Limit to 3 overlapping events max
          
          // Find available horizontal position
          while (horizontalOffset < maxOverlaps) {
            let hasOverlap = false;
            for (let slot = startSlot; slot < endSlot; slot++) {
              if (usedSlots.has(slot * 10 + horizontalOffset)) {
                hasOverlap = true;
                break;
              }
            }
            
            if (!hasOverlap) {
              // Mark slots as used
              for (let slot = startSlot; slot < endSlot; slot++) {
                usedSlots.add(slot * 10 + horizontalOffset);
              }
              break;
            }
            
            horizontalOffset++;
          }
          
          // Calculate event dimensions with overlap handling
          const baseEventWidth = GRID_CONFIG.dayColumnWidth - 2;
          const eventWidth = horizontalOffset > 0 ? Math.max(baseEventWidth * 0.6, 40) : baseEventWidth;
          const eventHeight = Math.max((endSlot - startSlot) * GRID_CONFIG.slotHeight - 1, 8);
          
          // Position with horizontal offset for overlapping events
          const eventX = centerX + GRID_CONFIG.timeColumnWidth + (dayIndex * GRID_CONFIG.dayColumnWidth) + 1 + (horizontalOffset * (eventWidth * 0.3));
          const eventY = gridStartY + 20 + (startSlot * GRID_CONFIG.slotHeight) + 1;
          
          console.log(`  📍 Event ${eventIndex + 1}: "${event.title}" at slot ${startSlot}-${endSlot}, offset ${horizontalOffset}`);

          // Event styling based on type - exact dashboard matching
          const isSimplePractice = event.source === 'simplepractice' || event.title.includes('Appointment');
          const isGoogle = event.source === 'google' && !isSimplePractice;
          const isHoliday = event.title.toLowerCase().includes('holiday') || event.source === 'holiday';

          // White background for ALL appointments - exact dashboard match
          pdf.setFillColor(255, 255, 255);
          pdf.rect(eventX, eventY, eventWidth, eventHeight, 'F');

          if (isSimplePractice) {
            // SimplePractice: Thin cornflower blue border with thick left flag
            pdf.setDrawColor(100, 149, 237);
            pdf.setLineWidth(0.5);
            pdf.rect(eventX, eventY, eventWidth, eventHeight, 'S');
            
            // Thick left side flag - dashboard matching thickness
            pdf.setLineWidth(2);
            pdf.line(eventX, eventY, eventX, eventY + eventHeight);
            
          } else if (isGoogle) {
            // Google Calendar: Dashed green border around entire event
            pdf.setDrawColor(34, 197, 94);
            pdf.setLineWidth(1);
            pdf.setLineDash([3, 2]);
            pdf.rect(eventX, eventY, eventWidth, eventHeight, 'S');
            pdf.setLineDash([]);
            
          } else if (isHoliday) {
            // Holidays: Orange border
            pdf.setDrawColor(245, 158, 11);
            pdf.setLineWidth(1);
            pdf.rect(eventX, eventY, eventWidth, eventHeight, 'S');
            
          } else {
            // Default: Gray border
            pdf.setDrawColor(156, 163, 175);
            pdf.setLineWidth(1);
            pdf.rect(eventX, eventY, eventWidth, eventHeight, 'S');
          }

          // Event text - exact dashboard matching
          const eventTitle = cleanEventTitle(event.title);
          const startTime = eventDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
          const endTime = eventEndDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

          pdf.setTextColor(0, 0, 0);

          // Calculate available text space - account for thick left border on SimplePractice
          const textX = isSimplePractice ? eventX + 6 : eventX + 3;
          const maxWidth = eventWidth - (isSimplePractice ? 12 : 6);
          
          // Clean and truncate event title
          let displayTitle = eventTitle;
          const maxChars = Math.floor(maxWidth / 3);
          if (displayTitle.length > maxChars) {
            displayTitle = displayTitle.substring(0, maxChars - 3) + '...';
          }

          // Event name - exact dashboard matching font
          pdf.setFont('times', 'bold');
          pdf.setFontSize(5);
          
          const cleanTitle = cleanTextForPDF(displayTitle);
          
          // Show title for all events that are tall enough
          if (eventHeight >= 8) {
            // Handle text wrapping using proper text width measurement
            const words = cleanTitle.split(' ');
            const maxLines = Math.floor((eventHeight - 4) / 5);
            let currentLine = '';
            let lineCount = 0;
            
            for (const word of words) {
              const testLine = currentLine ? `${currentLine} ${word}` : word;
              const textWidth = pdf.getTextWidth(testLine);
              
              if (textWidth <= maxWidth - 1) {
                currentLine = testLine;
              } else {
                if (lineCount < maxLines && currentLine) {
                  pdf.text(currentLine, textX, eventY + 6 + (lineCount * 5));
                  lineCount++;
                  currentLine = word;
                } else {
                  break;
                }
              }
            }
            
            // Print remaining text if there's space
            if (currentLine && lineCount < maxLines) {
              pdf.text(currentLine, textX, eventY + 6 + (lineCount * 5));
            }
          }

          // Event time - show for medium to large events
          if (eventHeight >= 12) {
            pdf.setFont('times', 'normal');
            pdf.setFontSize(4);
            pdf.text(`${startTime}-${endTime}`, textX, eventY + eventHeight - 2);
          }
        }
      });
    });

    // GRID BORDERS - complete border around the entire grid
    const gridEndY = gridStartY + 20 + GRID_CONFIG.gridHeight;
    pdf.setLineWidth(0.5);
    pdf.setDrawColor(0, 0, 0);

    // Complete grid outline
    pdf.rect(centerX, gridStartY, GRID_CONFIG.totalGridWidth, 20 + GRID_CONFIG.gridHeight, 'S');

    // Vertical border between time column and days
    pdf.setLineWidth(0.5);
    pdf.line(
      centerX + GRID_CONFIG.timeColumnWidth, 
      gridStartY, 
      centerX + GRID_CONFIG.timeColumnWidth, 
      gridEndY
    );

    // Vertical lines between all day columns
    for (let i = 1; i < 7; i++) {
      const x = centerX + GRID_CONFIG.timeColumnWidth + (i * GRID_CONFIG.dayColumnWidth);
      pdf.setLineWidth(0.5);
      pdf.line(x, gridStartY, x, gridEndY);
    }

    // Download the PDF
    const filename = `Weekly_Calendar_${weekStartDate.toLocaleDateString('en-US').replace(/\//g, '-')}.pdf`;
    pdf.save(filename);

    console.log('PDF exported successfully!');
  } catch (error) {
    console.error('PDF export error:', error);
    throw error;
  }
};