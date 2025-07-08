import jsPDF from 'jspdf';
import { CalendarEvent } from '../types/calendar';

// Exact grid configuration matching our fixed calendar
const GRID_CONFIG = {
  // Page setup - A3 landscape
  pageWidth: 1190,
  pageHeight: 842,
  
  // Layout dimensions matching calendar
  margin: 30,
  headerHeight: 50,
  statsHeight: 40,
  legendHeight: 25,
  
  // Grid structure - exactly 36 time slots
  timeColumnWidth: 100,
  slotHeight: 20,
  totalSlots: 36, // 6:00 to 23:30
  
  get dayColumnWidth() {
    return (this.pageWidth - (this.margin * 2) - this.timeColumnWidth) / 7;
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

    // Create PDF
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'pt',
      format: [GRID_CONFIG.pageWidth, GRID_CONFIG.pageHeight]
    });

    // White background
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, GRID_CONFIG.pageWidth, GRID_CONFIG.pageHeight, 'F');

    // HEADER - exactly like calendar
    pdf.setFont('times', 'bold');
    pdf.setFontSize(32);
    pdf.setTextColor(0, 0, 0);
    pdf.text('WEEKLY PLANNER', GRID_CONFIG.pageWidth / 2, GRID_CONFIG.margin + 25, { align: 'center' });

    // Week info
    pdf.setFont('times', 'bold');
    pdf.setFontSize(16);
    const weekStart = weekStartDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    const weekEnd = weekEndDate.toLocaleDateString('en-US', { day: 'numeric' });
    const weekNumber = Math.ceil(((weekStartDate.getTime() - new Date(weekStartDate.getFullYear(), 0, 1).getTime()) / 86400000 + 1) / 7);
    pdf.text(`${weekStart}-${weekEnd} • Week ${weekNumber}`, GRID_CONFIG.pageWidth / 2, GRID_CONFIG.margin + 45, { align: 'center' });

    // STATS SECTION - exactly like calendar
    const statsY = GRID_CONFIG.margin + GRID_CONFIG.headerHeight;
    const statsWidth = GRID_CONFIG.pageWidth - (GRID_CONFIG.margin * 2);
    const statBoxWidth = statsWidth / 4;

    // Stats background
    pdf.setFillColor(248, 248, 248);
    pdf.rect(GRID_CONFIG.margin, statsY, statsWidth, GRID_CONFIG.statsHeight, 'F');

    // Stats border
    pdf.setLineWidth(2);
    pdf.setDrawColor(0, 0, 0);
    pdf.rect(GRID_CONFIG.margin, statsY, statsWidth, GRID_CONFIG.statsHeight, 'S');

    const stats = [
      { label: 'Total Appointments', value: totalEvents.toString() },
      { label: 'Scheduled Time', value: `${totalHours.toFixed(1)}h` },
      { label: 'Daily Average', value: `${(totalHours / 7).toFixed(1)}h` },
      { label: 'Available Time', value: `${(168 - totalHours).toFixed(0)}h` }
    ];

    stats.forEach((stat, index) => {
      const x = GRID_CONFIG.margin + (index * statBoxWidth);
      
      // Stat dividers
      if (index > 0) {
        pdf.setLineWidth(1);
        pdf.line(x, statsY, x, statsY + GRID_CONFIG.statsHeight);
      }
      
      // Stat number
      pdf.setFont('times', 'bold');
      pdf.setFontSize(18);
      pdf.text(stat.value, x + statBoxWidth/2, statsY + 20, { align: 'center' });
      
      // Stat label
      pdf.setFont('times', 'normal');
      pdf.setFontSize(12);
      pdf.text(stat.label, x + statBoxWidth/2, statsY + 35, { align: 'center' });
    });

    // LEGEND - exactly like calendar
    const legendY = statsY + GRID_CONFIG.statsHeight;
    pdf.setFillColor(248, 248, 248);
    pdf.rect(GRID_CONFIG.margin, legendY, statsWidth, GRID_CONFIG.legendHeight, 'F');
    pdf.setLineWidth(2);
    pdf.rect(GRID_CONFIG.margin, legendY, statsWidth, GRID_CONFIG.legendHeight, 'S');

    pdf.setFont('times', 'normal');
    pdf.setFontSize(10);
    
    // Legend items
    let legendX = GRID_CONFIG.margin + 20;
    
    // SimplePractice
    pdf.setFillColor(240, 248, 255);
    pdf.setDrawColor(100, 149, 237);
    pdf.setLineWidth(2);
    pdf.rect(legendX, legendY + 8, 14, 12, 'FD');
    pdf.setLineWidth(6);
    pdf.setDrawColor(100, 149, 237);
    pdf.line(legendX, legendY + 14, legendX + 6, legendY + 14);
    pdf.setTextColor(0, 0, 0);
    pdf.text('SimplePractice', legendX + 20, legendY + 16);
    
    legendX += 120;
    
    // Google Calendar
    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(16, 185, 129);
    pdf.setLineWidth(2);
    pdf.rect(legendX, legendY + 8, 14, 12, 'FD');
    pdf.text('Google Calendar', legendX + 20, legendY + 16);
    
    legendX += 120;
    
    // Holidays
    pdf.setFillColor(254, 243, 199);
    pdf.setDrawColor(245, 158, 11);
    pdf.setLineWidth(2);
    pdf.rect(legendX, legendY + 8, 14, 12, 'FD');
    pdf.text('Holidays in United States', legendX + 20, legendY + 16);

    // GRID STRUCTURE - exactly like calendar
    const gridStartY = GRID_CONFIG.gridStartY;
    
    // Grid border
    pdf.setLineWidth(2);
    pdf.setDrawColor(0, 0, 0);
    pdf.rect(GRID_CONFIG.margin, gridStartY, GRID_CONFIG.timeColumnWidth + (7 * GRID_CONFIG.dayColumnWidth), 50 + GRID_CONFIG.gridHeight);

    // HEADERS
    // Time header
    pdf.setFillColor(240, 240, 240);
    pdf.rect(GRID_CONFIG.margin, gridStartY, GRID_CONFIG.timeColumnWidth, 50, 'F');
    pdf.setFont('times', 'bold');
    pdf.setFontSize(14);
    pdf.text('TIME', GRID_CONFIG.margin + GRID_CONFIG.timeColumnWidth/2, gridStartY + 30, { align: 'center' });

    // Day headers
    const dayNames = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    dayNames.forEach((dayName, index) => {
      const dayX = GRID_CONFIG.margin + GRID_CONFIG.timeColumnWidth + (index * GRID_CONFIG.dayColumnWidth);
      const dayDate = new Date(weekStartDate);
      dayDate.setDate(weekStartDate.getDate() + index);
      
      // Day header background
      pdf.setFillColor(240, 240, 240);
      pdf.rect(dayX, gridStartY, GRID_CONFIG.dayColumnWidth, 50, 'F');
      
      // Day name
      pdf.setFont('times', 'bold');
      pdf.setFontSize(12);
      pdf.text(dayName, dayX + GRID_CONFIG.dayColumnWidth/2, gridStartY + 20, { align: 'center' });
      
      // Day number
      pdf.setFontSize(16);
      pdf.text(dayDate.getDate().toString(), dayX + GRID_CONFIG.dayColumnWidth/2, gridStartY + 40, { align: 'center' });
      
      // Vertical border
      if (index < 6) {
        pdf.setLineWidth(1);
        pdf.line(dayX + GRID_CONFIG.dayColumnWidth, gridStartY, dayX + GRID_CONFIG.dayColumnWidth, gridStartY + 50 + GRID_CONFIG.gridHeight);
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

    timeSlots.forEach((slot, index) => {
      const y = gridStartY + 50 + (index * GRID_CONFIG.slotHeight);
      
      // Time slot background
      pdf.setFillColor(slot.isHour ? 240 : 248, slot.isHour ? 240 : 248, slot.isHour ? 240 : 248);
      pdf.rect(GRID_CONFIG.margin, y, GRID_CONFIG.timeColumnWidth, GRID_CONFIG.slotHeight, 'F');
      
      // Time label
      pdf.setFont('times', slot.isHour ? 'bold' : 'normal');
      pdf.setFontSize(slot.isHour ? 12 : 10);
      pdf.setTextColor(0, 0, 0);
      pdf.text(slot.time, GRID_CONFIG.margin + GRID_CONFIG.timeColumnWidth/2, y + GRID_CONFIG.slotHeight/2 + 3, { align: 'center' });
      
      // Day cells
      for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        const cellX = GRID_CONFIG.margin + GRID_CONFIG.timeColumnWidth + (dayIndex * GRID_CONFIG.dayColumnWidth);
        
        // Cell background
        pdf.setFillColor(slot.isHour ? 240 : 255, slot.isHour ? 240 : 255, slot.isHour ? 240 : 255);
        pdf.rect(cellX, y, GRID_CONFIG.dayColumnWidth, GRID_CONFIG.slotHeight, 'F');
        
        // Cell border
        pdf.setLineWidth(slot.isHour ? 2 : 1);
        pdf.setDrawColor(slot.isHour ? 0 : 221, slot.isHour ? 0 : 221, slot.isHour ? 0 : 221);
        pdf.rect(cellX, y, GRID_CONFIG.dayColumnWidth, GRID_CONFIG.slotHeight, 'S');
      }
      
      // Horizontal grid line
      pdf.setLineWidth(slot.isHour ? 2 : 1);
      pdf.setDrawColor(slot.isHour ? 0 : 221, slot.isHour ? 0 : 221, slot.isHour ? 0 : 221);
      pdf.line(GRID_CONFIG.margin, y, GRID_CONFIG.margin + GRID_CONFIG.timeColumnWidth + (7 * GRID_CONFIG.dayColumnWidth), y);
    });

    // EVENTS - place them exactly like in the calendar
    weekEvents.forEach(event => {
      const eventDate = new Date(event.startTime);
      const dayIndex = Math.floor((eventDate.getTime() - weekStartDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (dayIndex >= 0 && dayIndex < 7) {
        const eventHour = eventDate.getHours();
        const eventMinute = eventDate.getMinutes();
        const slotIndex = timeSlots.findIndex(slot => 
          slot.hour === eventHour && Math.abs(slot.minute - eventMinute) < 30
        );
        
        if (slotIndex >= 0) {
          const duration = (new Date(event.endTime).getTime() - new Date(event.startTime).getTime()) / (1000 * 60);
          const slots = Math.ceil(duration / 30);
          
          const eventX = GRID_CONFIG.margin + GRID_CONFIG.timeColumnWidth + (dayIndex * GRID_CONFIG.dayColumnWidth) + 2;
          const eventY = gridStartY + 50 + (slotIndex * GRID_CONFIG.slotHeight) + 2;
          const eventWidth = GRID_CONFIG.dayColumnWidth - 4;
          const eventHeight = (slots * GRID_CONFIG.slotHeight) - 4;
          
          // Event styling based on type
          const isSimplePractice = event.source === 'simplepractice' || event.title.includes('Appointment');
          const isGoogle = event.source === 'google';
          
          if (isSimplePractice) {
            pdf.setFillColor(240, 248, 255);
            pdf.setDrawColor(100, 149, 237);
          } else if (isGoogle) {
            pdf.setFillColor(255, 255, 255);
            pdf.setDrawColor(16, 185, 129);
          } else {
            pdf.setFillColor(254, 243, 199);
            pdf.setDrawColor(245, 158, 11);
          }
          
          pdf.setLineWidth(2);
          pdf.rect(eventX, eventY, eventWidth, eventHeight, 'FD');
          
          // Event text
          const eventTitle = event.title.replace(/\s*Appointment\s*$/i, '').trim();
          const startTime = eventDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
          const endTime = new Date(event.endTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
          
          pdf.setFont('times', 'bold');
          pdf.setFontSize(8);
          pdf.setTextColor(0, 0, 0);
          
          // Event name (wrapped if needed)
          const maxWidth = eventWidth - 8;
          const lines = pdf.splitTextToSize(eventTitle, maxWidth);
          const nameHeight = Math.min(lines.length * 6, eventHeight - 12);
          
          for (let i = 0; i < lines.length && i * 6 < nameHeight; i++) {
            pdf.text(lines[i], eventX + 4, eventY + 10 + (i * 6));
          }
          
          // Event time
          pdf.setFont('times', 'normal');
          pdf.setFontSize(6);
          pdf.text(`${startTime}-${endTime}`, eventX + 4, eventY + eventHeight - 4);
        }
      }
    });

    // GRID BORDERS - complete border around the entire grid
    const gridEndY = gridStartY + 50 + GRID_CONFIG.gridHeight;
    pdf.setLineWidth(2);
    pdf.setDrawColor(0, 0, 0);
    
    // Bottom border
    pdf.line(
      GRID_CONFIG.margin, 
      gridEndY, 
      GRID_CONFIG.margin + GRID_CONFIG.timeColumnWidth + (7 * GRID_CONFIG.dayColumnWidth), 
      gridEndY
    );
    
    // Left border - to the left of time column
    pdf.line(
      GRID_CONFIG.margin, 
      gridStartY, 
      GRID_CONFIG.margin, 
      gridEndY
    );
    
    // Vertical border between time column and Monday
    pdf.line(
      GRID_CONFIG.margin + GRID_CONFIG.timeColumnWidth, 
      gridStartY, 
      GRID_CONFIG.margin + GRID_CONFIG.timeColumnWidth, 
      gridEndY
    );

    // Download the PDF
    const filename = `Weekly_Calendar_${weekStartDate.toLocaleDateString('en-US').replace(/\//g, '-')}.pdf`;
    pdf.save(filename);

    console.log('PDF exported successfully!');
  } catch (error) {
    console.error('PDF export error:', error);
    throw error;
  }
};