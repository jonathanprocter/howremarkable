
import jsPDF from 'jspdf';
import { CalendarEvent } from '../types/calendar';
import { generateTimeSlots } from './timeSlots';

// reMarkable Pro specifications
const REMARKABLE_SPECS = {
  // Physical dimensions in mm
  width: 196.6,
  height: 147.6,
  // Display resolution
  displayWidth: 1872,
  displayHeight: 1404,
  // Optimal DPI for E Ink
  dpi: 226,
  // Stylus interaction zones (minimum touch targets)
  minTouchTarget: 8, // 8mm minimum for stylus accuracy
  // E Ink refresh optimization
  refreshZones: {
    full: 'high-contrast-borders',
    partial: 'light-backgrounds'
  }
};

// Color palette optimized for E Ink display
const EINK_COLORS = {
  black: [0, 0, 0],
  darkGray: [64, 64, 64],
  mediumGray: [128, 128, 128],
  lightGray: [192, 192, 192],
  veryLightGray: [224, 224, 224],
  white: [255, 255, 255]
} as const;

export const exportWeeklyForRemarkable = async (
  weekStartDate: Date,
  weekEndDate: Date,
  events: CalendarEvent[],
  weekNumber: number
): Promise<string> => {
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [REMARKABLE_SPECS.width, REMARKABLE_SPECS.height],
    putOnlyUsedFonts: true,
    compress: true
  });

  // Set up for reMarkable Pro optimization
  pdf.setFont('helvetica', 'normal');
  pdf.setDrawColor(...EINK_COLORS.black);
  
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  // Header section optimized for stylus navigation
  pdf.setFillColor(...EINK_COLORS.white);
  pdf.rect(0, 0, pageWidth, 20, 'F');
  
  // High contrast border for E Ink refresh optimization
  pdf.setDrawColor(...EINK_COLORS.black);
  pdf.setLineWidth(1.5);
  pdf.line(0, 20, pageWidth, 20);
  
  // Header text with proper contrast
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...EINK_COLORS.black);
  pdf.text('WEEKLY PLANNER', pageWidth / 2, 8, { align: 'center' });
  
  // Week info
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  const weekInfo = `Week ${weekNumber} • ${weekStartDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEndDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  pdf.text(weekInfo, pageWidth / 2, 15, { align: 'center' });
  
  // Statistics bar with touch-friendly layout
  const statsY = 25;
  const statsHeight = 15;
  pdf.setFillColor(...EINK_COLORS.veryLightGray);
  pdf.rect(0, statsY, pageWidth, statsHeight, 'F');
  
  const totalEvents = events.length;
  const totalHours = events.reduce((sum, event) => {
    return sum + (new Date(event.endTime).getTime() - new Date(event.startTime).getTime()) / (1000 * 60 * 60);
  }, 0);
  
  // Stats with proper spacing for stylus interaction
  const statSpacing = pageWidth / 4;
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  
  const stats = [
    { label: 'Appointments', value: totalEvents.toString() },
    { label: 'Total Hours', value: `${totalHours.toFixed(1)}h` },
    { label: 'Daily Avg', value: `${(totalHours / 7).toFixed(1)}h` },
    { label: 'Free Time', value: `${(168 - totalHours).toFixed(0)}h` }
  ];
  
  stats.forEach((stat, index) => {
    const x = statSpacing * (index + 0.5);
    pdf.setTextColor(...EINK_COLORS.black);
    pdf.text(stat.value, x, statsY + 6, { align: 'center' });
    pdf.setFontSize(6);
    pdf.setFont('helvetica', 'normal');
    pdf.text(stat.label, x, statsY + 11, { align: 'center' });
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
  });
  
  // Stats border
  pdf.setDrawColor(...EINK_COLORS.darkGray);
  pdf.setLineWidth(0.8);
  pdf.line(0, statsY + statsHeight, pageWidth, statsY + statsHeight);
  
  // Legend optimized for E Ink with clear visual distinction
  const legendY = 45;
  const legendHeight = 12;
  pdf.setFillColor(...EINK_COLORS.veryLightGray);
  pdf.rect(0, legendY, pageWidth, legendHeight, 'F');
  
  const legendItems = [
    { name: 'SimplePractice', symbol: '●', color: EINK_COLORS.black },
    { name: 'Google Calendar', symbol: '◐', color: EINK_COLORS.darkGray },
    { name: 'Personal', symbol: '○', color: EINK_COLORS.mediumGray }
  ];
  
  let legendX = 15;
  legendItems.forEach(item => {
    pdf.setTextColor(...item.color);
    pdf.setFontSize(10);
    pdf.text(item.symbol, legendX, legendY + 7);
    pdf.setTextColor(...EINK_COLORS.black);
    pdf.setFontSize(7);
    pdf.text(item.name, legendX + 6, legendY + 7);
    legendX += 45;
  });
  
  pdf.setDrawColor(...EINK_COLORS.darkGray);
  pdf.setLineWidth(0.8);
  pdf.line(0, legendY + legendHeight, pageWidth, legendY + legendHeight);
  
  // Calendar grid optimized for reMarkable Pro stylus interaction
  const gridStartY = 62;
  const timeSlots = generateTimeSlots();
  const timeColumnWidth = 18;
  const dayWidth = (pageWidth - timeColumnWidth) / 7;
  const rowHeight = 4.2; // Optimized for E Ink refresh and stylus accuracy
  
  // Day headers with strong contrast
  const headerHeight = 12;
  pdf.setFillColor(...EINK_COLORS.lightGray);
  pdf.rect(0, gridStartY, pageWidth, headerHeight, 'F');
  
  // Time header
  pdf.setDrawColor(...EINK_COLORS.black);
  pdf.setLineWidth(1);
  pdf.rect(0, gridStartY, timeColumnWidth, headerHeight, 'S');
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'bold');
  pdf.text('TIME', timeColumnWidth/2, gridStartY + 7, { align: 'center' });
  
  // Day headers with date information
  const dayHeaders = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  dayHeaders.forEach((day, index) => {
    const currentDate = new Date(weekStartDate);
    currentDate.setDate(currentDate.getDate() + index);
    const dateNum = currentDate.getDate();
    
    const dayX = timeColumnWidth + (index * dayWidth);
    
    // Day column border
    pdf.setDrawColor(...EINK_COLORS.black);
    pdf.setLineWidth(1);
    pdf.rect(dayX, gridStartY, dayWidth, headerHeight, 'S');
    
    // Day name and date
    pdf.setFontSize(6);
    pdf.setFont('helvetica', 'bold');
    pdf.text(day, dayX + dayWidth/2, gridStartY + 4, { align: 'center' });
    pdf.setFontSize(8);
    pdf.text(dateNum.toString(), dayX + dayWidth/2, gridStartY + 9, { align: 'center' });
  });
  
  // Time grid with optimized contrast for E Ink
  const gridBodyStartY = gridStartY + headerHeight;
  const drawnEvents = new Set<string>();
  
  timeSlots.forEach((slot, index) => {
    const y = gridBodyStartY + (index * rowHeight);
    const isHour = slot.minute === 0;
    
    // Time column with alternating backgrounds for better readability
    pdf.setFillColor(...(isHour ? EINK_COLORS.lightGray : EINK_COLORS.veryLightGray));
    pdf.rect(0, y, timeColumnWidth, rowHeight, 'F');
    
    // Time borders optimized for E Ink refresh
    pdf.setDrawColor(...(isHour ? EINK_COLORS.black : EINK_COLORS.mediumGray));
    pdf.setLineWidth(isHour ? 1 : 0.5);
    pdf.line(0, y + rowHeight, timeColumnWidth, y + rowHeight);
    
    // Vertical time column border
    pdf.setDrawColor(...EINK_COLORS.black);
    pdf.setLineWidth(1);
    pdf.line(timeColumnWidth, y, timeColumnWidth, y + rowHeight);
    
    // Time labels with proper contrast
    pdf.setFontSize(isHour ? 6 : 5);
    pdf.setFont('helvetica', isHour ? 'bold' : 'normal');
    pdf.setTextColor(...EINK_COLORS.black);
    const timeText = isHour ? slot.time : slot.time.substring(3);
    pdf.text(timeText, timeColumnWidth/2, y + rowHeight/2 + 1, { align: 'center' });
    
    // Calendar cells for each day
    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      const dayX = timeColumnWidth + (dayIndex * dayWidth);
      
      // Cell background
      pdf.setFillColor(...EINK_COLORS.white);
      pdf.rect(dayX, y, dayWidth, rowHeight, 'F');
      
      // Cell borders optimized for E Ink
      pdf.setDrawColor(...(isHour ? EINK_COLORS.darkGray : EINK_COLORS.lightGray));
      pdf.setLineWidth(isHour ? 0.8 : 0.3);
      pdf.line(dayX, y + rowHeight, dayX + dayWidth, y + rowHeight);
      
      if (dayIndex < 6) {
        pdf.setDrawColor(...EINK_COLORS.lightGray);
        pdf.setLineWidth(0.5);
        pdf.line(dayX + dayWidth, y, dayX + dayWidth, y + rowHeight);
      }
      
      // Find and draw events
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
      
      // Draw events with reMarkable Pro optimization
      slotEvents.forEach(event => {
        drawnEvents.add(event.id);
        
        const eventStart = new Date(event.startTime);
        const eventEnd = new Date(event.endTime);
        const durationMinutes = (eventEnd.getTime() - eventStart.getTime()) / (1000 * 60);
        const eventHeightInRows = Math.max(1, Math.ceil(durationMinutes / 30));
        const eventHeight = eventHeightInRows * rowHeight - 0.5;
        
        const eventX = dayX + 0.5;
        const eventWidth = dayWidth - 1;
        
        // Event styling optimized for E Ink contrast
        let bgColor, borderColor, borderWidth;
        switch (event.source) {
          case 'simplepractice':
            bgColor = EINK_COLORS.white;
            borderColor = EINK_COLORS.black;
            borderWidth = 1.5;
            break;
          case 'google':
            bgColor = EINK_COLORS.veryLightGray;
            borderColor = EINK_COLORS.darkGray;
            borderWidth = 1;
            break;
          default:
            bgColor = EINK_COLORS.lightGray;
            borderColor = EINK_COLORS.mediumGray;
            borderWidth = 0.8;
        }
        
        // Draw event block
        pdf.setFillColor(...bgColor);
        pdf.rect(eventX, y + 0.25, eventWidth, eventHeight, 'F');
        
        pdf.setDrawColor(...borderColor);
        pdf.setLineWidth(borderWidth);
        pdf.rect(eventX, y + 0.25, eventWidth, eventHeight, 'S');
        
        // Event content optimized for stylus annotation
        let contentY = y + 1.5;
        const maxTextWidth = eventWidth - 1;
        
        // Event title with high contrast
        pdf.setFontSize(4);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...EINK_COLORS.black);
        
        const cleanTitle = event.title.replace(/[^\w\s\-\.,;:()\[\]]/g, '');
        const titleLines = pdf.splitTextToSize(cleanTitle.toUpperCase(), maxTextWidth);
        
        if (Array.isArray(titleLines)) {
          titleLines.slice(0, Math.floor(eventHeight / 1.5)).forEach(line => {
            if (contentY < y + eventHeight - 0.5) {
              pdf.text(line, eventX + 0.5, contentY);
              contentY += 1.2;
            }
          });
        } else {
          pdf.text(titleLines, eventX + 0.5, contentY);
          contentY += 1.2;
        }
        
        // Time range for reference
        if (contentY < y + eventHeight - 0.5 && eventHeight > 3) {
          pdf.setFontSize(3);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(...EINK_COLORS.darkGray);
          
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
          
          pdf.text(`${startTime}-${endTime}`, eventX + 0.5, contentY);
        }
      });
    }
  });
  
  // Outer grid border for structural clarity
  const totalGridHeight = timeSlots.length * rowHeight;
  pdf.setDrawColor(...EINK_COLORS.black);
  pdf.setLineWidth(1.5);
  pdf.rect(0, gridStartY, pageWidth, headerHeight + totalGridHeight, 'S');
  
  // Add stylus interaction guide in footer
  pdf.setFontSize(5);
  pdf.setFont('helvetica', 'italic');
  pdf.setTextColor(...EINK_COLORS.mediumGray);
  pdf.text('✎ Optimized for reMarkable Pro stylus interaction', pageWidth / 2, pageHeight - 3, { align: 'center' });
  
  return pdf.output('datauristring').split(',')[1];
};

export const exportDailyForRemarkable = async (
  selectedDate: Date,
  events: CalendarEvent[],
  dailyNotes: string
): Promise<string> => {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [REMARKABLE_SPECS.height, REMARKABLE_SPECS.width], // Portrait orientation
    putOnlyUsedFonts: true,
    compress: true
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  pdf.setFont('helvetica', 'normal');
  
  // Header optimized for reMarkable Pro
  const headerHeight = 20;
  pdf.setFillColor(...EINK_COLORS.white);
  pdf.rect(0, 0, pageWidth, headerHeight, 'F');
  
  pdf.setDrawColor(...EINK_COLORS.black);
  pdf.setLineWidth(1.5);
  pdf.line(0, headerHeight, pageWidth, headerHeight);
  
  // Header content
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...EINK_COLORS.black);
  pdf.text('DAILY PLANNER', pageWidth / 2, 8, { align: 'center' });
  
  // Date information
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  const dayName = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
  const dateStr = selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  pdf.text(`${dayName}, ${dateStr}`, pageWidth / 2, 15, { align: 'center' });
  
  // Daily statistics with touch-friendly layout
  const dayEvents = events.filter(event => 
    new Date(event.startTime).toDateString() === selectedDate.toDateString()
  );
  
  const statsY = 25;
  const statsHeight = 12;
  pdf.setFillColor(...EINK_COLORS.veryLightGray);
  pdf.rect(0, statsY, pageWidth, statsHeight, 'F');
  
  const totalEvents = dayEvents.length;
  const totalHours = dayEvents.reduce((sum, event) => {
    return sum + (new Date(event.endTime).getTime() - new Date(event.startTime).getTime()) / (1000 * 60 * 60);
  }, 0);
  
  // Stats layout
  pdf.setFontSize(6);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...EINK_COLORS.black);
  
  const dailyStats = [
    { label: 'Appointments', value: totalEvents.toString() },
    { label: 'Scheduled', value: `${totalHours.toFixed(1)}h` },
    { label: 'Available', value: `${(24 - totalHours).toFixed(1)}h` },
    { label: 'Utilization', value: `${Math.round((totalHours / 24) * 100)}%` }
  ];
  
  const statWidth = pageWidth / 4;
  dailyStats.forEach((stat, index) => {
    const x = statWidth * (index + 0.5);
    pdf.text(stat.value, x, statsY + 5, { align: 'center' });
    pdf.setFontSize(5);
    pdf.setFont('helvetica', 'normal');
    pdf.text(stat.label, x, statsY + 9, { align: 'center' });
    pdf.setFontSize(6);
    pdf.setFont('helvetica', 'bold');
  });
  
  pdf.setDrawColor(...EINK_COLORS.darkGray);
  pdf.setLineWidth(0.8);
  pdf.line(0, statsY + statsHeight, pageWidth, statsY + statsHeight);
  
  // Time schedule with reMarkable Pro optimization
  const gridStartY = 42;
  const timeColumnWidth = 20;
  const appointmentColumnWidth = pageWidth - timeColumnWidth;
  const timeSlots = generateTimeSlots();
  const slotHeight = 4.8; // Optimized for stylus interaction
  
  // Schedule grid with clear borders
  const scheduleHeight = timeSlots.length * slotHeight;
  pdf.setDrawColor(...EINK_COLORS.black);
  pdf.setLineWidth(1);
  pdf.rect(0, gridStartY, pageWidth, scheduleHeight, 'S');
  
  // Vertical separator between time and appointments
  pdf.line(timeColumnWidth, gridStartY, timeColumnWidth, gridStartY + scheduleHeight);
  
  timeSlots.forEach((slot, index) => {
    const slotY = gridStartY + (index * slotHeight);
    const isHour = slot.minute === 0;
    
    // Time column styling
    if (isHour) {
      pdf.setFillColor(...EINK_COLORS.lightGray);
      pdf.setLineWidth(0.8);
    } else {
      pdf.setFillColor(...EINK_COLORS.veryLightGray);
      pdf.setLineWidth(0.4);
    }
    
    // Time slot background
    pdf.rect(0, slotY, timeColumnWidth, slotHeight, 'F');
    
    // Appointment column background
    pdf.setFillColor(...EINK_COLORS.white);
    pdf.rect(timeColumnWidth, slotY, appointmentColumnWidth, slotHeight, 'F');
    
    // Horizontal grid lines
    pdf.setDrawColor(...(isHour ? EINK_COLORS.darkGray : EINK_COLORS.lightGray));
    pdf.line(0, slotY + slotHeight, pageWidth, slotY + slotHeight);
    
    // Time labels with proper hierarchy
    pdf.setFontSize(isHour ? 7 : 5);
    pdf.setFont('helvetica', isHour ? 'bold' : 'normal');
    pdf.setTextColor(...EINK_COLORS.black);
    pdf.text(slot.time, timeColumnWidth/2, slotY + slotHeight/2 + 1, { align: 'center' });
  });
  
  // Draw events in appointment column
  dayEvents.forEach(event => {
    const eventStart = new Date(event.startTime);
    const eventEnd = new Date(event.endTime);
    const durationMinutes = (eventEnd.getTime() - eventStart.getTime()) / (1000 * 60);
    
    // Calculate position in grid
    const startHour = eventStart.getHours();
    const startMinute = eventStart.getMinutes();
    const minutesSince6am = (startHour - 6) * 60 + startMinute;
    const slotIndex = minutesSince6am / 30;
    
    if (slotIndex >= 0 && slotIndex < timeSlots.length) {
      const eventY = gridStartY + (slotIndex * slotHeight);
      const eventHeight = Math.max(slotHeight - 0.5, (durationMinutes / 30) * slotHeight - 0.5);
      
      const eventX = timeColumnWidth + 1;
      const eventWidth = appointmentColumnWidth - 2;
      
      // Event styling based on source
      let bgColor, borderColor, borderWidth;
      switch (event.source) {
        case 'simplepractice':
          bgColor = EINK_COLORS.white;
          borderColor = EINK_COLORS.black;
          borderWidth = 1.2;
          break;
        case 'google':
          bgColor = EINK_COLORS.veryLightGray;
          borderColor = EINK_COLORS.darkGray;
          borderWidth = 0.8;
          break;
        default:
          bgColor = EINK_COLORS.lightGray;
          borderColor = EINK_COLORS.mediumGray;
          borderWidth = 0.6;
      }
      
      // Draw event block
      pdf.setFillColor(...bgColor);
      pdf.rect(eventX, eventY + 0.25, eventWidth, eventHeight, 'F');
      
      pdf.setDrawColor(...borderColor);
      pdf.setLineWidth(borderWidth);
      pdf.rect(eventX, eventY + 0.25, eventWidth, eventHeight, 'S');
      
      // Event content optimized for annotation space
      let textY = eventY + 2;
      const maxWidth = eventWidth - 2;
      
      // Time range
      pdf.setFontSize(6);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...EINK_COLORS.black);
      
      const timeRange = `${eventStart.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: false 
      })}-${eventEnd.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: false 
      })}`;
      
      pdf.text(timeRange, eventX + 1, textY);
      textY += 3;
      
      // Event title
      pdf.setFontSize(5);
      pdf.setFont('helvetica', 'bold');
      const cleanTitle = event.title.replace(/[^\w\s\-\.,;:()\[\]]/g, '');
      const titleLines = pdf.splitTextToSize(cleanTitle, maxWidth);
      
      if (Array.isArray(titleLines)) {
        titleLines.slice(0, 2).forEach(line => {
          if (textY < eventY + eventHeight - 1) {
            pdf.text(line, eventX + 1, textY);
            textY += 2.5;
          }
        });
      } else {
        pdf.text(titleLines, eventX + 1, textY);
        textY += 2.5;
      }
      
      // Additional details with space for annotations
      if (eventHeight > 12 && textY < eventY + eventHeight - 4) {
        pdf.setFontSize(4);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(...EINK_COLORS.darkGray);
        
        if (event.description) {
          const descText = event.description.substring(0, 50) + (event.description.length > 50 ? '...' : '');
          pdf.text(descText, eventX + 1, textY);
          textY += 2;
        }
        
        // Source indicator
        pdf.setFontSize(3);
        pdf.text(`${event.source} calendar`, eventX + 1, eventY + eventHeight - 1);
        
        // Annotation space indicator
        pdf.setTextColor(...EINK_COLORS.lightGray);
        pdf.text('[ annotation space ]', eventX + eventWidth - 25, eventY + eventHeight - 1);
      }
    }
  });
  
  // Notes section optimized for stylus writing
  const notesY = gridStartY + scheduleHeight + 8;
  const notesHeight = pageHeight - notesY - 10;
  
  if (notesHeight > 20) {
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...EINK_COLORS.black);
    pdf.text('DAILY NOTES & REFLECTIONS', 2, notesY);
    
    // Notes border optimized for writing
    pdf.setDrawColor(...EINK_COLORS.darkGray);
    pdf.setLineWidth(0.8);
    pdf.rect(2, notesY + 3, pageWidth - 4, notesHeight - 6, 'S');
    
    if (dailyNotes && dailyNotes.trim()) {
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'normal');
      const splitNotes = pdf.splitTextToSize(dailyNotes, pageWidth - 8);
      pdf.text(splitNotes, 4, notesY + 8);
    } else {
      // Writing lines optimized for stylus
      pdf.setDrawColor(...EINK_COLORS.lightGray);
      pdf.setLineWidth(0.3);
      const lineSpacing = 4;
      const maxLines = Math.floor((notesHeight - 10) / lineSpacing);
      
      for (let line = 0; line < maxLines; line++) {
        const lineY = notesY + 8 + (line * lineSpacing);
        if (lineY < notesY + notesHeight - 8) {
          pdf.line(4, lineY, pageWidth - 4, lineY);
        }
      }
    }
  }
  
  // Footer with reMarkable optimization note
  pdf.setFontSize(4);
  pdf.setFont('helvetica', 'italic');
  pdf.setTextColor(...EINK_COLORS.mediumGray);
  pdf.text('✎ Optimized for reMarkable Pro E Ink display and stylus annotation', pageWidth / 2, pageHeight - 2, { align: 'center' });
  
  return pdf.output('datauristring').split(',')[1];
};

export const generateRemarkableFilename = (type: 'weekly' | 'daily', date: Date): string => {
  const dateStr = date.toISOString().split('T')[0];
  const prefix = type === 'weekly' ? 'reMarkable_Weekly' : 'reMarkable_Daily';
  return `${prefix}_${dateStr}.pdf`;
};
