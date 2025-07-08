import jsPDF from 'jspdf';
import { CalendarEvent } from '../types/calendar';

// A3 Landscape configuration optimized for proper centering
const GRID_CONFIG = {
  // Page setup - A3 landscape dimensions (842x595 points)
  pageWidth: 842,
  pageHeight: 595,

  // Layout dimensions optimized for proper centering
  margin: 20,
  headerHeight: 60,
  statsHeight: 40,
  legendHeight: 30,

  // Grid structure - properly sized for A3 landscape
  timeColumnWidth: 80, // Proportional time column
  slotHeight: 12, // Smaller slots to fit all content
  totalSlots: 36, // 6:00 to 23:30

  get contentWidth() {
    return this.pageWidth - (2 * this.margin);
  },

  get dayColumnWidth() {
    // Calculate day column width to use remaining space evenly
    return Math.floor((this.contentWidth - this.timeColumnWidth) / 7);
  },

  get totalGridWidth() {
    return this.timeColumnWidth + (7 * this.dayColumnWidth);
  },

  get gridStartX() {
    // Center the grid horizontally
    return (this.pageWidth - this.totalGridWidth) / 2;
  },

  get gridStartY() {
    return this.margin + this.headerHeight + this.statsHeight + this.legendHeight;
  },

  get gridHeight() {
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

    // Calculate stats
    const totalEvents = weekEvents.length;
    const totalHours = weekEvents.reduce((sum, event) => {
      return sum + (new Date(event.endTime).getTime() - new Date(event.startTime).getTime()) / (1000 * 60 * 60);
    }, 0);

    // Create PDF with A3 landscape dimensions
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'pt',
      format: 'a3'
    });

    // Use calculated centered positions
    const centerX = GRID_CONFIG.gridStartX;
    const centerY = GRID_CONFIG.margin;

    // White background
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, GRID_CONFIG.pageWidth, GRID_CONFIG.pageHeight, 'F');

    // HEADER - properly positioned and sized
    pdf.setFont('times', 'bold');
    pdf.setFontSize(16);
    pdf.setTextColor(0, 0, 0);
    pdf.text('WEEKLY PLANNER', GRID_CONFIG.pageWidth / 2, centerY + 20, { align: 'center' });

    // Week info
    pdf.setFont('times', 'bold');
    pdf.setFontSize(12);
    const weekStart = weekStartDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    const weekEnd = weekEndDate.toLocaleDateString('en-US', { day: 'numeric' });
    const weekNumber = Math.ceil(((weekStartDate.getTime() - new Date(weekStartDate.getFullYear(), 0, 1).getTime()) / 86400000 + 1) / 7);
    pdf.text(`${weekStart}-${weekEnd} • Week ${weekNumber}`, GRID_CONFIG.pageWidth / 2, centerY + 35, { align: 'center' });

    // STATS SECTION - properly centered
    const statsY = centerY + GRID_CONFIG.headerHeight;
    const statsWidth = GRID_CONFIG.totalGridWidth;
    const statBoxWidth = statsWidth / 4;

    // Stats background
    pdf.setFillColor(248, 248, 248);
    pdf.rect(centerX, statsY, statsWidth, GRID_CONFIG.statsHeight, 'F');

    // Stats border
    pdf.setLineWidth(1);
    pdf.setDrawColor(0, 0, 0);
    pdf.rect(centerX, statsY, statsWidth, GRID_CONFIG.statsHeight, 'S');

    const stats = [
      { label: 'Total Appointments', value: totalEvents.toString() },
      { label: 'Scheduled Time', value: `${totalHours.toFixed(1)}h` },
      { label: 'Daily Average', value: `${(totalHours / 7).toFixed(1)}h` },
      { label: 'Available Time', value: `${(168 - totalHours).toFixed(0)}h` }
    ];

    stats.forEach((stat, index) => {
      const x = centerX + (index * statBoxWidth);

      // Stat dividers
      if (index > 0) {
        pdf.setLineWidth(1);
        pdf.line(x, statsY, x, statsY + GRID_CONFIG.statsHeight);
      }

      // Stat number
      pdf.setFont('times', 'bold');
      pdf.setFontSize(12);
      pdf.text(stat.value, x + statBoxWidth/2, statsY + 15, { align: 'center' });

      // Stat label
      pdf.setFont('times', 'normal');
      pdf.setFontSize(8);
      pdf.text(stat.label, x + statBoxWidth/2, statsY + 28, { align: 'center' });
    });

    // LEGEND - properly positioned
    const legendY = statsY + GRID_CONFIG.statsHeight;
    pdf.setFillColor(248, 248, 248);
    pdf.rect(centerX, legendY, statsWidth, GRID_CONFIG.legendHeight, 'F');
    pdf.setLineWidth(1);
    pdf.rect(centerX, legendY, statsWidth, GRID_CONFIG.legendHeight, 'S');

    pdf.setFont('times', 'normal');
    pdf.setFontSize(10);

    // Legend items
    let legendX = centerX + 20;

    // SimplePractice
    pdf.setFillColor(240, 248, 255);
    pdf.setDrawColor(100, 149, 237);
    pdf.setLineWidth(2);
    pdf.rect(legendX, legendY + 10, 16, 14, 'FD');
    pdf.setLineWidth(6);
    pdf.setDrawColor(100, 149, 237);
    pdf.line(legendX, legendY + 17, legendX + 8, legendY + 17);
    pdf.setTextColor(0, 0, 0);
    pdf.text('SimplePractice', legendX + 22, legendY + 19);

    legendX += 140;

    // Google Calendar
    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(16, 185, 129);
    pdf.setLineWidth(1);
    pdf.rect(legendX, legendY + 8, 12, 10, 'FD');
    pdf.setLineWidth(3);
    pdf.setDrawColor(16, 185, 129);
    pdf.line(legendX, legendY + 13, legendX + 6, legendY + 13);
    pdf.text('Google Calendar', legendX + 18, legendY + 15);

    legendX += 140;

    // Holidays
    pdf.setFillColor(254, 243, 199);
    pdf.setDrawColor(245, 158, 11);
    pdf.setLineWidth(1);
    pdf.rect(legendX, legendY + 8, 12, 10, 'FD');
    pdf.setLineWidth(3);
    pdf.setDrawColor(245, 158, 11);
    pdf.line(legendX, legendY + 13, legendX + 6, legendY + 13);
    pdf.text('Holidays in United States', legendX + 18, legendY + 15);

    // GRID STRUCTURE - properly centered
    const gridStartY = GRID_CONFIG.gridStartY;

    // Grid border
    pdf.setLineWidth(1);
    pdf.setDrawColor(0, 0, 0);
    pdf.rect(centerX, gridStartY, GRID_CONFIG.totalGridWidth, 30 + GRID_CONFIG.gridHeight);

    // HEADERS
    // Time header
    pdf.setFillColor(240, 240, 240);
    pdf.rect(centerX, gridStartY, GRID_CONFIG.timeColumnWidth, 30, 'F');
    pdf.setFont('times', 'bold');
    pdf.setFontSize(10);
    pdf.text('TIME', centerX + GRID_CONFIG.timeColumnWidth/2, gridStartY + 20, { align: 'center' });

    // Day headers
    const dayNames = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    dayNames.forEach((dayName, index) => {
      const dayX = centerX + GRID_CONFIG.timeColumnWidth + (index * GRID_CONFIG.dayColumnWidth);
      const dayDate = new Date(weekStartDate);
      dayDate.setDate(weekStartDate.getDate() + index);

      // Day header background
      pdf.setFillColor(240, 240, 240);
      pdf.rect(dayX, gridStartY, GRID_CONFIG.dayColumnWidth, 30, 'F');

      // Day name
      pdf.setFont('times', 'bold');
      pdf.setFontSize(9);
      pdf.text(dayName, dayX + GRID_CONFIG.dayColumnWidth/2, gridStartY + 12, { align: 'center' });

      // Day number
      pdf.setFontSize(12);
      pdf.text(dayDate.getDate().toString(), dayX + GRID_CONFIG.dayColumnWidth/2, gridStartY + 24, { align: 'center' });

      // Vertical border between days
      if (index < 6) {
        pdf.setLineWidth(1);
        pdf.setDrawColor(0, 0, 0);
        pdf.line(dayX + GRID_CONFIG.dayColumnWidth, gridStartY, dayX + GRID_CONFIG.dayColumnWidth, gridStartY + 30 + GRID_CONFIG.gridHeight);
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
      const y = gridStartY + 30 + (index * GRID_CONFIG.slotHeight);

      // Time slot background
      pdf.setFillColor(slot.isHour ? 240 : 248, slot.isHour ? 240 : 248, slot.isHour ? 240 : 248);
      pdf.rect(centerX, y, GRID_CONFIG.timeColumnWidth, GRID_CONFIG.slotHeight, 'F');

      // Time label
      pdf.setFont('times', slot.isHour ? 'bold' : 'normal');
      pdf.setFontSize(slot.isHour ? 8 : 7);
      pdf.setTextColor(0, 0, 0);
      pdf.text(slot.time, centerX + GRID_CONFIG.timeColumnWidth/2, y + GRID_CONFIG.slotHeight/2 + 2, { align: 'center' });

      // Day cells
      for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        const cellX = centerX + GRID_CONFIG.timeColumnWidth + (dayIndex * GRID_CONFIG.dayColumnWidth);

        // Cell background
        pdf.setFillColor(slot.isHour ? 240 : 255, slot.isHour ? 240 : 255, slot.isHour ? 240 : 255);
        pdf.rect(cellX, y, GRID_CONFIG.dayColumnWidth, GRID_CONFIG.slotHeight, 'F');

        // Cell border
        pdf.setLineWidth(slot.isHour ? 1 : 0.5);
        pdf.setDrawColor(slot.isHour ? 0 : 221, slot.isHour ? 0 : 221, slot.isHour ? 0 : 221);
        pdf.rect(cellX, y, GRID_CONFIG.dayColumnWidth, GRID_CONFIG.slotHeight, 'S');
      }

      // Horizontal grid line
      pdf.setLineWidth(slot.isHour ? 1 : 0.5);
      pdf.setDrawColor(slot.isHour ? 0 : 221, slot.isHour ? 0 : 221, slot.isHour ? 0 : 221);
      pdf.line(centerX, y, centerX + GRID_CONFIG.totalGridWidth, y);
    });

    // EVENTS - place them exactly like in the calendar
    weekEvents.forEach(event => {
      const eventDate = new Date(event.startTime);
      const dayIndex = Math.floor((eventDate.getTime() - weekStartDate.getTime()) / (1000 * 60 * 60 * 24));

      if (dayIndex >= 0 && dayIndex < 7) {
        const eventHour = eventDate.getHours();
        const eventMinute = eventDate.getMinutes();

        // Calculate slot index based on our 36-slot grid (6:00-23:30)
        const slotIndex = ((eventHour - 6) * 2) + (eventMinute >= 30 ? 1 : 0);

        // Only place events within our time range
        if (slotIndex >= 0 && slotIndex < 36) {
          const duration = (new Date(event.endTime).getTime() - new Date(event.startTime).getTime()) / (1000 * 60);
          const slots = Math.ceil(duration / 30);

          const eventX = centerX + GRID_CONFIG.timeColumnWidth + (dayIndex * GRID_CONFIG.dayColumnWidth) + 1;
          const eventY = gridStartY + 30 + (slotIndex * GRID_CONFIG.slotHeight) + 1;
          const eventWidth = GRID_CONFIG.dayColumnWidth - 2;
          const eventHeight = (slots * GRID_CONFIG.slotHeight) - 2;

          // Event styling based on type
          const isSimplePractice = event.source === 'simplepractice' || event.title.includes('Appointment');
          const isGoogle = event.source === 'google';

          // White background for all appointments
          pdf.setFillColor(255, 255, 255);
          pdf.rect(eventX, eventY, eventWidth, eventHeight, 'F');

          if (isSimplePractice) {
            // Cornflower blue left flag and thin blue border
            pdf.setFillColor(100, 149, 237);
            pdf.rect(eventX, eventY, 4, eventHeight, 'F');
            pdf.setDrawColor(100, 149, 237);
            pdf.setLineWidth(1);
            pdf.rect(eventX, eventY, eventWidth, eventHeight, 'S');
          } else if (isGoogle) {
            // Dashed green border for Google Calendar
            pdf.setDrawColor(16, 185, 129);
            pdf.setLineWidth(1);
            pdf.setLineDash([3, 2]);
            pdf.rect(eventX, eventY, eventWidth, eventHeight, 'S');
            pdf.setLineDash([]);
          } else {
            // Orange border for other events
            pdf.setDrawColor(245, 158, 11);
            pdf.setLineWidth(1);
            pdf.rect(eventX, eventY, eventWidth, eventHeight, 'S');
          }

          // Event text
          const eventTitle = event.title.replace(/\s*Appointment\s*$/i, '').trim();
          const startTime = eventDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
          const endTime = new Date(event.endTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

          pdf.setTextColor(0, 0, 0);

          // Event name
          pdf.setFont('times', 'bold');
          pdf.setFontSize(6);
          const maxWidth = eventWidth - (isSimplePractice ? 6 : 4);
          const lines = pdf.splitTextToSize(eventTitle, maxWidth);
          const nameHeight = Math.min(lines.length * 4, eventHeight - 8);

          const textX = isSimplePractice ? eventX + 4 : eventX + 2;

          for (let i = 0; i < lines.length && i * 4 < nameHeight; i++) {
            pdf.text(lines[i], textX, eventY + 6 + (i * 4));
          }

          // Event time
          pdf.setFont('times', 'normal');
          pdf.setFontSize(5);
          pdf.text(`${startTime}-${endTime}`, textX, eventY + eventHeight - 4);
        }
      }
    });

    // GRID BORDERS - complete border around the entire grid
    const gridEndY = gridStartY + 30 + GRID_CONFIG.gridHeight;
    pdf.setLineWidth(1);
    pdf.setDrawColor(0, 0, 0);

    // Complete grid outline
    pdf.rect(centerX, gridStartY, GRID_CONFIG.totalGridWidth, 30 + GRID_CONFIG.gridHeight, 'S');

    // Vertical border between time column and Monday
    pdf.line(
      centerX + GRID_CONFIG.timeColumnWidth, 
      gridStartY, 
      centerX + GRID_CONFIG.timeColumnWidth, 
      gridEndY
    );

    // Vertical lines between all day columns
    for (let i = 1; i < 7; i++) {
      const x = centerX + GRID_CONFIG.timeColumnWidth + (i * GRID_CONFIG.dayColumnWidth);
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