import jsPDF from 'jspdf';
import { CalendarEvent } from '../types/calendar';

// Exact grid configuration matching our fixed calendar
const GRID_CONFIG = {
  // Page setup - Custom format to fit complete timeline
  pageWidth: 1400,
  pageHeight: 1600, // Sufficient height for all 36 time slots plus headers
  
  // Layout dimensions optimized for full visibility and centering
  margin: 50, // Increased margin for better centering
  headerHeight: 60, // More space for header
  statsHeight: 40,
  legendHeight: 30, // More space for legend visibility
  
  // Grid structure - exactly 36 time slots
  timeColumnWidth: 85,
  slotHeight: 28, // Slightly reduced for better fit while maintaining readability
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

    // Calculate total content width and center positioning
    const totalContentWidth = GRID_CONFIG.timeColumnWidth + (7 * GRID_CONFIG.dayColumnWidth);
    const centerX = (GRID_CONFIG.pageWidth - totalContentWidth) / 2;
    
    // Calculate total content height for vertical centering with perfect balance
    const totalContentHeight = GRID_CONFIG.headerHeight + GRID_CONFIG.statsHeight + GRID_CONFIG.legendHeight + 50 + GRID_CONFIG.gridHeight;
    const centerY = Math.max(50, (GRID_CONFIG.pageHeight - totalContentHeight) / 2 + 20); // Perfect vertical centering

    // White background
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, GRID_CONFIG.pageWidth, GRID_CONFIG.pageHeight, 'F');

    // HEADER - centered on page
    pdf.setFont('times', 'bold');
    pdf.setFontSize(28);
    pdf.setTextColor(0, 0, 0);
    pdf.text('WEEKLY PLANNER', GRID_CONFIG.pageWidth / 2, centerY + 25, { align: 'center' });

    // Week info
    pdf.setFont('times', 'bold');
    pdf.setFontSize(14);
    const weekStart = weekStartDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    const weekEnd = weekEndDate.toLocaleDateString('en-US', { day: 'numeric' });
    const weekNumber = Math.ceil(((weekStartDate.getTime() - new Date(weekStartDate.getFullYear(), 0, 1).getTime()) / 86400000 + 1) / 7);
    pdf.text(`${weekStart}-${weekEnd} • Week ${weekNumber}`, GRID_CONFIG.pageWidth / 2, centerY + 50, { align: 'center' });

    // STATS SECTION - centered on page
    const statsY = centerY + GRID_CONFIG.headerHeight;
    const statsWidth = totalContentWidth;
    const statBoxWidth = statsWidth / 4;

    // Stats background
    pdf.setFillColor(248, 248, 248);
    pdf.rect(centerX, statsY, statsWidth, GRID_CONFIG.statsHeight, 'F');

    // Stats border
    pdf.setLineWidth(2);
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
      
      // Stat number - with better spacing
      pdf.setFont('times', 'bold');
      pdf.setFontSize(16);
      pdf.text(stat.value, x + statBoxWidth/2, statsY + 18, { align: 'center' });
      
      // Stat label
      pdf.setFont('times', 'normal');
      pdf.setFontSize(11);
      pdf.text(stat.label, x + statBoxWidth/2, statsY + 32, { align: 'center' });
    });

    // LEGEND - centered on page
    const legendY = statsY + GRID_CONFIG.statsHeight;
    pdf.setFillColor(248, 248, 248);
    pdf.rect(centerX, legendY, statsWidth, GRID_CONFIG.legendHeight, 'F');
    pdf.setLineWidth(2);
    pdf.rect(centerX, legendY, statsWidth, GRID_CONFIG.legendHeight, 'S');

    pdf.setFont('times', 'normal');
    pdf.setFontSize(10);
    
    // Legend items - better positioned with more space
    let legendX = centerX + 30;
    
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
    
    legendX += 170;
    
    // Google Calendar
    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(16, 185, 129);
    pdf.setLineWidth(2);
    pdf.rect(legendX, legendY + 10, 16, 14, 'FD');
    pdf.setLineWidth(6);
    pdf.setDrawColor(16, 185, 129);
    pdf.line(legendX, legendY + 17, legendX + 8, legendY + 17);
    pdf.text('Google Calendar', legendX + 22, legendY + 19);
    
    legendX += 170;
    
    // Holidays
    pdf.setFillColor(254, 243, 199);
    pdf.setDrawColor(245, 158, 11);
    pdf.setLineWidth(2);
    pdf.rect(legendX, legendY + 10, 16, 14, 'FD');
    pdf.setLineWidth(6);
    pdf.setDrawColor(245, 158, 11);
    pdf.line(legendX, legendY + 17, legendX + 8, legendY + 17);
    pdf.text('Holidays in United States', legendX + 22, legendY + 19);

    // GRID STRUCTURE - centered on page
    const gridStartY = centerY + GRID_CONFIG.headerHeight + GRID_CONFIG.statsHeight + GRID_CONFIG.legendHeight;
    
    // Grid border
    pdf.setLineWidth(2);
    pdf.setDrawColor(0, 0, 0);
    pdf.rect(centerX, gridStartY, GRID_CONFIG.timeColumnWidth + (7 * GRID_CONFIG.dayColumnWidth), 50 + GRID_CONFIG.gridHeight);

    // HEADERS
    // Time header
    pdf.setFillColor(240, 240, 240);
    pdf.rect(centerX, gridStartY, GRID_CONFIG.timeColumnWidth, 50, 'F');
    pdf.setFont('times', 'bold');
    pdf.setFontSize(14);
    pdf.text('TIME', centerX + GRID_CONFIG.timeColumnWidth/2, gridStartY + 30, { align: 'center' });

    // Day headers
    const dayNames = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    dayNames.forEach((dayName, index) => {
      const dayX = centerX + GRID_CONFIG.timeColumnWidth + (index * GRID_CONFIG.dayColumnWidth);
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
      
      // Bold vertical border between days
      if (index < 6) {
        pdf.setLineWidth(2);
        pdf.setDrawColor(0, 0, 0);
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
      pdf.rect(centerX, y, GRID_CONFIG.timeColumnWidth, GRID_CONFIG.slotHeight, 'F');
      
      // Time label - compact for full timeline visibility
      pdf.setFont('times', slot.isHour ? 'bold' : 'normal');
      pdf.setFontSize(slot.isHour ? 10 : 8);
      pdf.setTextColor(0, 0, 0);
      pdf.text(slot.time, centerX + GRID_CONFIG.timeColumnWidth/2, y + GRID_CONFIG.slotHeight/2 + 2, { align: 'center' });
      
      // Day cells
      for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        const cellX = centerX + GRID_CONFIG.timeColumnWidth + (dayIndex * GRID_CONFIG.dayColumnWidth);
        
        // Cell background
        pdf.setFillColor(slot.isHour ? 240 : 255, slot.isHour ? 240 : 255, slot.isHour ? 240 : 255);
        pdf.rect(cellX, y, GRID_CONFIG.dayColumnWidth, GRID_CONFIG.slotHeight, 'F');
        
        // Cell border
        pdf.setLineWidth(slot.isHour ? 2 : 1);
        pdf.setDrawColor(slot.isHour ? 0 : 221, slot.isHour ? 0 : 221, slot.isHour ? 0 : 221);
        pdf.rect(cellX, y, GRID_CONFIG.dayColumnWidth, GRID_CONFIG.slotHeight, 'S');
        
        // Bold vertical lines between days (skip to avoid double lines)
        // The main vertical borders are drawn separately
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
        
        // Calculate slot index based on our 36-slot grid (6:00-23:30)
        // Each hour has 2 slots (0 and 30 minute marks)
        const slotIndex = ((eventHour - 6) * 2) + (eventMinute >= 30 ? 1 : 0);
        
        // Only place events within our time range
        if (slotIndex >= 0 && slotIndex < 36) {
          const duration = (new Date(event.endTime).getTime() - new Date(event.startTime).getTime()) / (1000 * 60);
          const slots = Math.ceil(duration / 30);
          
          const eventX = centerX + GRID_CONFIG.timeColumnWidth + (dayIndex * GRID_CONFIG.dayColumnWidth) + 2;
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
          
          // Event text - improved readability
          const eventTitle = event.title.replace(/\s*Appointment\s*$/i, '').trim();
          const startTime = eventDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
          const endTime = new Date(event.endTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
          
          pdf.setTextColor(0, 0, 0);
          
          // Event name - larger and bolder
          pdf.setFont('times', 'bold');
          pdf.setFontSize(9);
          const maxWidth = eventWidth - 8;
          const lines = pdf.splitTextToSize(eventTitle, maxWidth);
          const nameHeight = Math.min(lines.length * 7, eventHeight - 14);
          
          for (let i = 0; i < lines.length && i * 7 < nameHeight; i++) {
            pdf.text(lines[i], eventX + 4, eventY + 12 + (i * 7));
          }
          
          // Event time - clearer positioning
          pdf.setFont('times', 'normal');
          pdf.setFontSize(7);
          pdf.text(`${startTime}-${endTime}`, eventX + 4, eventY + eventHeight - 6);
        }
      }
    });

    // GRID BORDERS - complete border around the entire grid
    const gridEndY = gridStartY + 50 + GRID_CONFIG.gridHeight;
    pdf.setLineWidth(2);
    pdf.setDrawColor(0, 0, 0);
    
    // Complete grid outline - centered
    pdf.rect(centerX, gridStartY, GRID_CONFIG.timeColumnWidth + (7 * GRID_CONFIG.dayColumnWidth), 50 + GRID_CONFIG.gridHeight, 'S');
    
    // Vertical border between time column and Monday
    pdf.line(
      centerX + GRID_CONFIG.timeColumnWidth, 
      gridStartY, 
      centerX + GRID_CONFIG.timeColumnWidth, 
      gridEndY
    );
    
    // Bold vertical lines between all day columns
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