import jsPDF from 'jspdf';
import { CalendarEvent } from '../types/calendar';

// A3 Landscape configuration optimized for professional weekly calendar layout
const GRID_CONFIG = {
  // Page setup - A3 landscape dimensions (1190x842 points)
  pageWidth: 1190,
  pageHeight: 900,

  // Optimized margins for professional layout
  margin: 20,
  headerHeight: 60,
  statsHeight: 0, // Remove stats section to maximize grid space
  legendHeight: 35,

  // Grid structure - optimized for readability and full timeline
  timeColumnWidth: 95, // Proper time column width
  slotHeight: 20, // Larger slots for better readability
  totalSlots: 36, // 6:00 to 23:30

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

    // Create PDF with A3 landscape dimensions
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'pt',
      format: [GRID_CONFIG.pageWidth, GRID_CONFIG.pageHeight]
    });

    // Use full width layout positions
    const centerX = GRID_CONFIG.gridStartX;
    const centerY = GRID_CONFIG.margin;

    // White background
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, GRID_CONFIG.pageWidth, GRID_CONFIG.pageHeight, 'F');

    // HEADER - positioned for full width layout
    pdf.setFont('times', 'bold');
    pdf.setFontSize(24);
    pdf.setTextColor(0, 0, 0);
    pdf.text('WEEKLY PLANNER', GRID_CONFIG.pageWidth / 2, centerY + 25, { align: 'center' });

    // Week info
    pdf.setFont('times', 'bold');
    pdf.setFontSize(16);
    const weekStart = weekStartDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    const weekEnd = weekEndDate.toLocaleDateString('en-US', { day: 'numeric' });
    const weekNumber = Math.ceil(((weekStartDate.getTime() - new Date(weekStartDate.getFullYear(), 0, 1).getTime()) / 86400000 + 1) / 7);
    pdf.text(`${weekStart}-${weekEnd} • Week ${weekNumber}`, GRID_CONFIG.pageWidth / 2, centerY + 45, { align: 'center' });

    // LEGEND - positioned below header
    const legendY = centerY + GRID_CONFIG.headerHeight;
    const legendWidth = GRID_CONFIG.totalGridWidth;
    
    pdf.setFillColor(248, 248, 248);
    pdf.rect(centerX, legendY, legendWidth, GRID_CONFIG.legendHeight, 'F');
    pdf.setLineWidth(1);
    pdf.setDrawColor(0, 0, 0);
    pdf.rect(centerX, legendY, legendWidth, GRID_CONFIG.legendHeight, 'S');

    pdf.setFont('times', 'normal');
    pdf.setFontSize(12);

    // Legend items - centered horizontally
    const legendItemSpacing = 220;
    const totalLegendWidth = 3 * legendItemSpacing;
    const legendStartX = centerX + (legendWidth - totalLegendWidth) / 2;

    let legendX = legendStartX;

    // SimplePractice - white background with cornflower blue border and thick left flag
    pdf.setFillColor(255, 255, 255);
    pdf.rect(legendX, legendY + 12, 18, 12, 'F');
    pdf.setDrawColor(100, 149, 237);
    pdf.setLineWidth(1);
    pdf.rect(legendX, legendY + 12, 18, 12, 'S');
    pdf.setLineWidth(4);
    pdf.line(legendX, legendY + 12, legendX, legendY + 24);
    pdf.setTextColor(0, 0, 0);
    pdf.text('SimplePractice', legendX + 24, legendY + 20);

    legendX += legendItemSpacing;

    // Google Calendar - white background with dashed green border
    pdf.setFillColor(255, 255, 255);
    pdf.rect(legendX, legendY + 12, 18, 12, 'F');
    pdf.setDrawColor(34, 197, 94);
    pdf.setLineWidth(1);
    pdf.setLineDash([3, 2]);
    pdf.rect(legendX, legendY + 12, 18, 12, 'S');
    pdf.setLineDash([]);
    pdf.text('Google Calendar', legendX + 24, legendY + 20);

    legendX += legendItemSpacing;

    // Holidays - filled yellow square
    pdf.setFillColor(255, 255, 0);
    pdf.rect(legendX, legendY + 12, 18, 12, 'F');
    pdf.setDrawColor(245, 158, 11);
    pdf.setLineWidth(1);
    pdf.rect(legendX, legendY + 12, 18, 12, 'S');
    pdf.text('Holidays in United States', legendX + 24, legendY + 20);

    // GRID STRUCTURE - full width utilization
    const gridStartY = GRID_CONFIG.gridStartY;

    // Grid border - full width
    pdf.setLineWidth(2);
    pdf.setDrawColor(0, 0, 0);
    pdf.rect(centerX, gridStartY, GRID_CONFIG.totalGridWidth, 40 + GRID_CONFIG.gridHeight);

    // HEADERS
    // Time header
    pdf.setFillColor(255, 255, 255);
    pdf.rect(centerX, gridStartY, GRID_CONFIG.timeColumnWidth, 40, 'F');
    pdf.setFont('times', 'bold');
    pdf.setFontSize(14);
    pdf.setTextColor(0, 0, 0);
    pdf.text('TIME', centerX + GRID_CONFIG.timeColumnWidth/2, gridStartY + 25, { align: 'center' });

    // Day headers
    const dayNames = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    dayNames.forEach((dayName, index) => {
      const dayX = centerX + GRID_CONFIG.timeColumnWidth + (index * GRID_CONFIG.dayColumnWidth);
      const dayDate = new Date(weekStartDate);
      dayDate.setDate(weekStartDate.getDate() + index);

      // Day header background
      pdf.setFillColor(255, 255, 255);
      pdf.rect(dayX, gridStartY, GRID_CONFIG.dayColumnWidth, 40, 'F');

      // Day name
      pdf.setFont('times', 'bold');
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.text(dayName, dayX + GRID_CONFIG.dayColumnWidth/2, gridStartY + 15, { align: 'center' });

      // Day number
      pdf.setFontSize(16);
      pdf.setTextColor(0, 0, 0);
      pdf.text(dayDate.getDate().toString(), dayX + GRID_CONFIG.dayColumnWidth/2, gridStartY + 30, { align: 'center' });

      // Vertical border between days
      if (index < 6) {
        pdf.setLineWidth(2);
        pdf.setDrawColor(0, 0, 0);
        pdf.line(dayX + GRID_CONFIG.dayColumnWidth, gridStartY, dayX + GRID_CONFIG.dayColumnWidth, gridStartY + 40 + GRID_CONFIG.gridHeight);
      }
    });

    // TIME SLOTS AND GRID - exactly 36 slots from 6:00 to 23:30
    const timeSlots = [];
    for (let hour = 6; hour <= 23; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        timeSlots.push({
          time: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
          hour,
          minute,
          isHour: minute === 0
        });
        if (hour === 23 && minute === 30) break;
      }
    }

    console.log(`Generated ${timeSlots.length} time slots from ${timeSlots[0]?.time} to ${timeSlots[timeSlots.length - 1]?.time}`);

    timeSlots.forEach((slot, index) => {
      const y = gridStartY + 40 + (index * GRID_CONFIG.slotHeight);

      // Time slot background
      pdf.setFillColor(slot.isHour ? 235 : 250, slot.isHour ? 235 : 250, slot.isHour ? 235 : 250);
      pdf.rect(centerX, y, GRID_CONFIG.timeColumnWidth, GRID_CONFIG.slotHeight, 'F');

      // Time label
      pdf.setFont('times', slot.isHour ? 'bold' : 'normal');
      pdf.setFontSize(slot.isHour ? 11 : 9);
      pdf.setTextColor(0, 0, 0);
      pdf.text(slot.time, centerX + GRID_CONFIG.timeColumnWidth/2, y + GRID_CONFIG.slotHeight/2 + 3, { align: 'center' });

      // Day cells
      for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        const cellX = centerX + GRID_CONFIG.timeColumnWidth + (dayIndex * GRID_CONFIG.dayColumnWidth);

        // Cell background - alternating for better readability
        pdf.setFillColor(slot.isHour ? 235 : 255, slot.isHour ? 235 : 255, slot.isHour ? 235 : 255);
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

    // EVENTS - place them exactly like in the calendar with precise positioning
    weekEvents.forEach(event => {
      const eventDate = new Date(event.startTime);
      const eventEndDate = new Date(event.endTime);
      
      // Calculate which day of the week this event falls on
      const dayIndex = Math.floor((eventDate.getTime() - weekStartDate.getTime()) / (1000 * 60 * 60 * 24));

      if (dayIndex >= 0 && dayIndex < 7) {
        const eventHour = eventDate.getHours();
        const eventMinute = eventDate.getMinutes();
        const endHour = eventEndDate.getHours();
        const endMinute = eventEndDate.getMinutes();

        // Only show events within our time range (6:00-23:30)
        if (eventHour >= 6 && eventHour <= 23) {
          // Calculate precise position within the time slot
          const startMinuteOfDay = (eventHour - 6) * 60 + eventMinute;
          const endMinuteOfDay = (endHour - 6) * 60 + endMinute;
          
          // Convert to slot positions (each slot is 30 minutes)
          const startSlot = startMinuteOfDay / 30;
          const endSlot = Math.min(endMinuteOfDay / 30, 35.5); // Cap at 23:30
          
          const eventX = centerX + GRID_CONFIG.timeColumnWidth + (dayIndex * GRID_CONFIG.dayColumnWidth) + 1;
          const eventY = gridStartY + 40 + (startSlot * GRID_CONFIG.slotHeight) + 0.5;
          const eventWidth = GRID_CONFIG.dayColumnWidth - 2;
          const eventHeight = Math.max((endSlot - startSlot) * GRID_CONFIG.slotHeight - 1, 8);

          // Event styling based on type
          const isSimplePractice = event.source === 'simplepractice' || event.title.includes('Appointment');
          const isGoogle = event.source === 'google';
          const isHoliday = event.title.toLowerCase().includes('holiday') || event.source === 'holiday';

          // White background for ALL appointments
          pdf.setFillColor(255, 255, 255);
          pdf.rect(eventX, eventY, eventWidth, eventHeight, 'F');

          if (isSimplePractice) {
            // SimplePractice: Thin cornflower blue border with thick left flag
            // Cornflower blue color: RGB(100, 149, 237)
            pdf.setDrawColor(100, 149, 237);
            pdf.setLineWidth(1);
            pdf.rect(eventX, eventY, eventWidth, eventHeight, 'S');
            
            // Thick left side flag
            pdf.setLineWidth(4);
            pdf.line(eventX, eventY, eventX, eventY + eventHeight);
            
          } else if (isGoogle) {
            // Google Calendar: Dashed green border around entire event
            // Green color: RGB(34, 197, 94)
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

          // Event text
          const eventTitle = event.title.replace(/\s*Appointment\s*$/i, '').trim();
          const startTime = eventDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
          const endTime = eventEndDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

          pdf.setTextColor(0, 0, 0);

          // Calculate available text space - account for thick left border on SimplePractice
          const textX = isSimplePractice ? eventX + 6 : eventX + 3;
          const maxWidth = eventWidth - (isSimplePractice ? 12 : 6);
          
          // Truncate long event names to fit properly
          let displayTitle = eventTitle;
          const maxChars = Math.floor(maxWidth / 3); // Approximate character limit based on width
          if (displayTitle.length > maxChars) {
            displayTitle = displayTitle.substring(0, maxChars - 3) + '...';
          }

          // Event name - improved readability with fixed character spacing
          pdf.setFont('times', 'bold');
          pdf.setFontSize(9);
          
          // CLEAN EVENT TITLE (Fix text formatting issues)
          let cleanTitle = displayTitle
            .replace(/\s+/g, ' ')  // Remove extra spaces
            .replace(/[^\w\s\-\.,:;!?'"()]/g, '') // Remove problematic characters
            .trim();
          
          // Show title for all events that are tall enough
          if (eventHeight >= 10) {
            // Handle text wrapping using proper text width measurement
            const words = cleanTitle.split(' ');
            const maxLines = Math.floor((eventHeight - 8) / 10);
            let currentLine = '';
            let lineCount = 0;
            
            for (const word of words) {
              const testLine = currentLine ? `${currentLine} ${word}` : word;
              const textWidth = pdf.getTextWidth(testLine);
              
              if (textWidth <= maxWidth - 2) {
                currentLine = testLine;
              } else {
                if (lineCount < maxLines && currentLine) {
                  pdf.text(currentLine, textX, eventY + 9 + (lineCount * 10));
                  lineCount++;
                  currentLine = word;
                } else {
                  break;
                }
              }
            }
            
            // Print remaining text if there's space
            if (currentLine && lineCount < maxLines) {
              pdf.text(currentLine, textX, eventY + 9 + (lineCount * 10));
            }
          }

          // Event time - show for medium to large events
          if (eventHeight >= 20) {
            pdf.setFont('times', 'normal');
            pdf.setFontSize(8);
            pdf.text(`${startTime}-${endTime}`, textX, eventY + eventHeight - 5);
          }
        }
      }
    });

    // GRID BORDERS - complete border around the entire grid
    const gridEndY = gridStartY + 40 + GRID_CONFIG.gridHeight;
    pdf.setLineWidth(2);
    pdf.setDrawColor(0, 0, 0);

    // Complete grid outline
    pdf.rect(centerX, gridStartY, GRID_CONFIG.totalGridWidth, 40 + GRID_CONFIG.gridHeight, 'S');

    // Vertical border between time column and days
    pdf.setLineWidth(2);
    pdf.line(
      centerX + GRID_CONFIG.timeColumnWidth, 
      gridStartY, 
      centerX + GRID_CONFIG.timeColumnWidth, 
      gridEndY
    );

    // Vertical lines between all day columns
    for (let i = 1; i < 7; i++) {
      const x = centerX + GRID_CONFIG.timeColumnWidth + (i * GRID_CONFIG.dayColumnWidth);
      pdf.setLineWidth(2);
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