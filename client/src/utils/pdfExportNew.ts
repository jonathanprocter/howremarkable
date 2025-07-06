import jsPDF from 'jspdf';
import { CalendarEvent } from '../types/calendar';
import { formatDate, formatDateShort } from './dateUtils';
import { generateTimeSlots } from './timeSlots';

export const exportWeeklyToPDF = async (
  weekStartDate: Date,
  weekEndDate: Date,
  events: CalendarEvent[],
  weekNumber: number
): Promise<string> => {
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });
  
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  // EXACT MATCH TO HTML: Times New Roman font, border, backgrounds
  pdf.setFont('times', 'normal');
  
  // Page border - exact match to .planner-container border: 2px solid black
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(2);
  pdf.rect(0, 0, pageWidth, pageHeight, 'S');
  
  // Header section - exact match to .header styling
  pdf.setFillColor(255, 255, 255); // White background
  pdf.rect(0, 0, pageWidth, 25, 'F');
  
  // Header bottom border - exact match to border-bottom: 3px solid black
  pdf.setLineWidth(3);
  pdf.setDrawColor(0, 0, 0);
  pdf.line(0, 25, pageWidth, 25);
  
  // Header content - exact match to HTML structure
  pdf.setFontSize(18); // 24px scaled for PDF
  pdf.setFont('times', 'bold');
  pdf.setTextColor(0, 0, 0);
  pdf.text('Weekly Planner', pageWidth / 2, 12, { align: 'center' });
  
  // Week info - exact match to .week-info
  pdf.setFontSize(12); // 16px scaled for PDF
  pdf.setFont('times', 'bold');
  const monthStart = weekStartDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  const monthEnd = weekEndDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const weekInfo = `${monthStart}-${monthEnd.split(' ')[1]}, ${monthEnd.split(' ')[2]} • Week ${weekNumber}`;
  pdf.text(weekInfo, pageWidth / 2, 20, { align: 'center' });
  
  // Week statistics section - exact match to .week-stats
  const totalEvents = events.length;
  const totalHours = events.reduce((sum, event) => {
    return sum + (new Date(event.endTime).getTime() - new Date(event.startTime).getTime()) / (1000 * 60 * 60);
  }, 0);
  
  // Stats background - exact match to background: #f8f8f8
  pdf.setFillColor(248, 248, 248);
  pdf.rect(0, 25, pageWidth, 15, 'F');
  
  // Stats grid layout - exact match to grid-template-columns: repeat(4, 1fr)
  const statWidth = pageWidth / 4;
  const statItems = [
    { label: 'Total Appointments', value: totalEvents.toString() },
    { label: 'Scheduled Time', value: `${totalHours.toFixed(1)}h` },
    { label: 'Daily Average', value: `${(totalHours / 7).toFixed(1)}h` },
    { label: 'Available Time', value: `${(168 - totalHours).toFixed(0)}h` }
  ];
  
  statItems.forEach((stat, index) => {
    const x = index * statWidth;
    
    // Vertical dividers - exact match to border-right: 1px solid black
    if (index < statItems.length - 1) {
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(1);
      pdf.line(x + statWidth, 25, x + statWidth, 40);
    }
    
    // Stat number - exact match to .stat-number font-size: 18px, font-weight: bold
    pdf.setFont('times', 'bold');
    pdf.setFontSize(14); // 18px scaled
    pdf.text(stat.value, x + statWidth/2, 32, { align: 'center' });
    
    // Stat label - exact match to font-size: 12px
    pdf.setFont('times', 'normal');
    pdf.setFontSize(9); // 12px scaled
    pdf.text(stat.label, x + statWidth/2, 37, { align: 'center' });
  });
  
  // Stats bottom border - exact match to border-bottom: 2px solid black
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(2);
  pdf.line(0, 40, pageWidth, 40);
  
  // Legend section - exact match to .legend
  pdf.setFillColor(248, 248, 248); // background: #f8f8f8
  pdf.rect(0, 40, pageWidth, 12, 'F');
  
  // Legend items - exact match to HTML legend structure
  pdf.setFontSize(7); // 10px scaled
  pdf.setFont('times', 'normal');
  
  const legendItems = [
    { 
      name: 'SimplePractice', 
      bgColor: [245, 245, 245], // #f5f5f5
      borderColor: [100, 149, 237], // #6495ED
      borderStyle: 'simplepractice' // border-left: 6px solid #6495ED
    },
    { 
      name: 'Google Calendar', 
      bgColor: [224, 224, 224], // #e0e0e0
      borderColor: [102, 102, 102], // #666
      borderStyle: 'dashed' // border: 2px dashed #666
    },
    { 
      name: 'Personal', 
      bgColor: [240, 240, 240], // #f0f0f0
      borderColor: [153, 153, 153], // #999
      borderStyle: 'double' // border-style: double
    }
  ];
  
  let legendX = 15;
  legendItems.forEach((item, index) => {
    // Legend symbol - exact match to .legend-symbol dimensions 14x12
    pdf.setFillColor(item.bgColor[0], item.bgColor[1], item.bgColor[2]);
    pdf.rect(legendX, 44, 10, 8, 'F');
    
    // Border styling based on source type
    pdf.setDrawColor(item.borderColor[0], item.borderColor[1], item.borderColor[2]);
    if (item.borderStyle === 'simplepractice') {
      pdf.setLineWidth(2);
      pdf.rect(legendX, 44, 10, 8, 'S');
      // Left accent border
      pdf.setLineWidth(4);
      pdf.line(legendX, 44, legendX, 52);
    } else {
      pdf.setLineWidth(2);
      pdf.rect(legendX, 44, 10, 8, 'S');
    }
    
    // Legend text
    pdf.setTextColor(0, 0, 0);
    pdf.text(item.name, legendX + 15, 48);
    
    legendX += 75; // Space between legend items
  });
  
  // Legend bottom border - exact match to border-bottom: 2px solid black
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(2);
  pdf.line(0, 52, pageWidth, 52);
  
  // Calendar container - exact match to .calendar-grid CSS Grid
  // grid-template-columns: 80px repeat(7, 1fr); grid-template-rows: 60px repeat(29, 35px)
  const timeSlots = generateTimeSlots(); // 06:00 to 23:30 (29 half-hour slots)
  const calendarStartY = 58;
  const headerHeight = 15; // 60px scaled to 15mm
  const rowHeight = 8.75; // 35px scaled to 8.75mm  
  const timeColumnWidth = 20; // 80px scaled to 20mm
  const dayWidth = (pageWidth - timeColumnWidth) / 7;
  
  // Calendar grid header - exact match to day-header styling
  pdf.setFillColor(240, 240, 240); // #f0f0f0
  pdf.rect(0, calendarStartY, pageWidth, headerHeight, 'F');
  
  // Time header - exact match to .time-header
  pdf.setFillColor(240, 240, 240);
  pdf.rect(0, calendarStartY, timeColumnWidth, headerHeight, 'F');
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(2);
  pdf.rect(0, calendarStartY, timeColumnWidth, headerHeight, 'S');
  pdf.line(timeColumnWidth, calendarStartY, timeColumnWidth, calendarStartY + headerHeight);
  pdf.line(0, calendarStartY + headerHeight, pageWidth, calendarStartY + headerHeight);
  
  // TIME label - exact match to HTML
  pdf.setFont('times', 'bold');
  pdf.setFontSize(9); // 12px scaled
  pdf.text('TIME', timeColumnWidth/2, calendarStartY + headerHeight/2 + 2, { align: 'center' });
  
  // Day headers - exact match to .day-header structure
  const dayHeaders = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  dayHeaders.forEach((day, index) => {
    const currentDate = new Date(weekStartDate);
    currentDate.setDate(currentDate.getDate() + index);
    const dateNum = currentDate.getDate();
    
    const dayX = timeColumnWidth + (index * dayWidth);
    
    // Day header background and border
    pdf.setFillColor(240, 240, 240); // #f0f0f0
    pdf.rect(dayX, calendarStartY, dayWidth, headerHeight, 'F');
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(1);
    if (index < 6) {
      pdf.line(dayX + dayWidth, calendarStartY, dayX + dayWidth, calendarStartY + headerHeight);
    }
    
    // Day name - exact match to .day-name
    pdf.setFont('times', 'bold');
    pdf.setFontSize(9); // 12px scaled
    pdf.text(day, dayX + dayWidth/2, calendarStartY + 5, { align: 'center' });
    
    // Day date - exact match to .day-date  
    pdf.setFontSize(12); // 16px scaled
    pdf.text(dateNum.toString(), dayX + dayWidth/2, calendarStartY + 11, { align: 'center' });
  });
  
  // Time grid and appointments - exact match to HTML structure
  const gridStartY = calendarStartY + headerHeight;
  const drawnEvents = new Set<string>();
  
  // Draw all time slots with exact styling from HTML
  timeSlots.forEach((slot, index) => {
    const y = gridStartY + (index * rowHeight);
    const isHour = slot.minute === 0;
    
    // Time slot styling - exact match to .time-slot and .time-slot.hour
    pdf.setFillColor(isHour ? 240 : 248, isHour ? 240 : 248, isHour ? 240 : 248); // #f0f0f0 : #f8f8f8
    pdf.rect(0, y, timeColumnWidth, rowHeight, 'F');
    
    // Time slot borders - exact match to border-bottom styling
    pdf.setDrawColor(isHour ? 0 : 221, isHour ? 0 : 221, isHour ? 0 : 221); // black : #ddd
    pdf.setLineWidth(isHour ? 2 : 1);
    pdf.line(0, y + rowHeight, timeColumnWidth, y + rowHeight);
    
    // Time column right border - exact match to border-right: 2px solid black
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(2);
    pdf.line(timeColumnWidth, y, timeColumnWidth, y + rowHeight);
    
    // Time labels - exact match to HTML font styling
    pdf.setFont('times', 'bold');
    pdf.setFontSize(isHour ? 8 : 7); // 11px : 10px scaled
    pdf.setTextColor(0, 0, 0);
    pdf.text(isHour ? slot.time : slot.time.substring(3), timeColumnWidth/2, y + rowHeight/2 + 2, { align: 'center' });
    
    // Calendar cells for each day
    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      const dayX = timeColumnWidth + (dayIndex * dayWidth);
      
      // Calendar cell background - exact match to .calendar-cell
      pdf.setFillColor(255, 255, 255); // white
      pdf.rect(dayX, y, dayWidth, rowHeight, 'F');
      
      // Calendar cell borders - exact match to border styling
      pdf.setDrawColor(isHour ? 0 : 221, isHour ? 0 : 221, isHour ? 0 : 221);
      pdf.setLineWidth(isHour ? 2 : 1);
      pdf.line(dayX, y + rowHeight, dayX + dayWidth, y + rowHeight);
      
      if (dayIndex < 6) {
        pdf.setDrawColor(221, 221, 221); // #ddd
        pdf.setLineWidth(1);
        pdf.line(dayX + dayWidth, y, dayX + dayWidth, y + rowHeight);
      }
      
      // Find appointments for this time slot and day
      const currentDate = new Date(weekStartDate);
      currentDate.setDate(currentDate.getDate() + dayIndex);
      
      const slotEvents = events.filter(event => {
        if (drawnEvents.has(event.id)) return false;
        
        const eventDate = new Date(event.startTime);
        const eventStartMinutes = eventDate.getHours() * 60 + eventDate.getMinutes();
        const slotStartMinutes = slot.hour * 60 + slot.minute;
        
        return eventDate.toDateString() === currentDate.toDateString() &&
               eventStartMinutes >= slotStartMinutes && 
               eventStartMinutes < slotStartMinutes + 30;
      });
      
      // Draw appointments with exact HTML styling
      slotEvents.forEach(event => {
        drawnEvents.add(event.id);
        
        const eventStart = new Date(event.startTime);
        const eventEnd = new Date(event.endTime);
        const durationMinutes = (eventEnd.getTime() - eventStart.getTime()) / (1000 * 60);
        const eventHeightInRows = Math.max(1, Math.ceil(durationMinutes / 30));
        const eventHeight = eventHeightInRows * rowHeight - 2; // Account for margins
        
        const eventX = dayX + 1; // left: 2px
        const eventWidth = dayWidth - 2; // right: 2px
        
        // Appointment styling based on source - exact match to HTML CSS classes
        let bgColor, borderColor, borderWidth, borderStyle;
        switch (event.source) {
          case 'simplepractice':
            bgColor = [245, 245, 245]; // #f5f5f5
            borderColor = [100, 149, 237]; // #6495ED
            borderWidth = 1;
            borderStyle = 'simplepractice';
            break;
          case 'google':
            bgColor = [224, 224, 224]; // #e0e0e0
            borderColor = [102, 102, 102]; // #666
            borderWidth = 1;
            borderStyle = 'dashed';
            break;
          default: // personal
            bgColor = [240, 240, 240]; // #f0f0f0
            borderColor = [153, 153, 153]; // #999
            borderWidth = 1;
            borderStyle = 'double';
        }
        
        // Draw appointment background
        pdf.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
        pdf.rect(eventX, y + 1, eventWidth, eventHeight, 'F');
        
        // Draw appointment border
        pdf.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
        pdf.setLineWidth(borderWidth);
        pdf.rect(eventX, y + 1, eventWidth, eventHeight, 'S');
        
        // SimplePractice left accent border - exact match to border-left: 4px solid #6495ED
        if (borderStyle === 'simplepractice') {
          pdf.setLineWidth(3);
          pdf.line(eventX, y + 1, eventX, y + 1 + eventHeight);
        }
        
        // Appointment content - exact match to HTML structure
        let contentY = y + 3;
        
        // Appointment name - exact match to .appointment-name styling
        pdf.setFont('times', 'bold');
        pdf.setFontSize(5); // 7px scaled, font-weight: bold
        pdf.setTextColor(0, 0, 0);
        const cleanTitle = event.title.replace(/[^\w\s\-\.,;:()\[\]]/g, '');
        const titleLines = pdf.splitTextToSize(cleanTitle.toUpperCase(), eventWidth - 2);
        
        if (Array.isArray(titleLines)) {
          titleLines.slice(0, Math.floor(eventHeight / 3)).forEach(line => {
            if (contentY < y + eventHeight - 2) {
              pdf.text(line, eventX + 2, contentY);
              contentY += 2;
            }
          });
        } else {
          pdf.text(titleLines, eventX + 2, contentY);
          contentY += 2;
        }
        
        // Appointment time - exact match to .appointment-time styling
        if (contentY < y + eventHeight - 1) {
          pdf.setFont('times', 'normal');
          pdf.setFontSize(4); // 6px scaled, font-weight: normal, opacity: 0.8
          pdf.setTextColor(80, 80, 80);
          
          const startTime = eventStart.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit', 
            hour12: false 
          });
          const endTime = eventEnd.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit', 
            hour12: false 
          });
          
          pdf.text(`${startTime}-${endTime}`, eventX + 2, contentY);
        }
      });
    }
  });
  
  return pdf.output('datauristring').split(',')[1];
};

// Placeholder for other export functions - will be implemented with exact HTML matching
export const exportDailyToPDF = async (
  selectedDate: Date,
  events: CalendarEvent[],
  dailyNotes: string
): Promise<string> => {
  // Will implement with exact HTML structure from daily planner template
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  pdf.text('Daily planner - exact HTML formatting coming next', 10, 10);
  
  return pdf.output('datauristring').split(',')[1];
};

export const exportWeeklyPackageToPDF = async (
  weekStartDate: Date,
  weekEndDate: Date,
  events: CalendarEvent[],
  weekNumber: number,
  dailyNotes: { [date: string]: string }
): Promise<string> => {
  // Will implement with exact HTML structure
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });
  
  pdf.text('Weekly package - exact HTML formatting coming next', 10, 10);
  
  return pdf.output('datauristring').split(',')[1];
};

export const generateFilename = (type: 'weekly' | 'daily' | 'weekly-package', date: Date): string => {
  const dateStr = date.toISOString().split('T')[0];
  switch (type) {
    case 'weekly':
      return `weekly-planner-${dateStr}.pdf`;
    case 'daily':
      return `daily-planner-${dateStr}.pdf`;
    case 'weekly-package':
      return `weekly-package-${dateStr}.pdf`;
    default:
      return `planner-${dateStr}.pdf`;
  }
};