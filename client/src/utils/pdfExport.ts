import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
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
  
  pdf.setFont('times', 'normal');
  
  // Professional border around entire page
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(2);
  pdf.rect(2, 2, pageWidth - 4, pageHeight - 4, 'S');
  
  // Header section with gray background
  pdf.setFillColor(248, 248, 248);
  pdf.rect(2, 2, pageWidth - 4, 25, 'F');
  
  // Header content
  pdf.setFontSize(18);
  pdf.setFont('times', 'bold');
  pdf.setTextColor(0, 0, 0);
  pdf.text('WEEKLY PLANNER', pageWidth / 2, 12, { align: 'center' });
  
  // Week range
  pdf.setFontSize(12);
  pdf.setFont('times', 'normal');
  const weekRange = `${formatDateShort(weekStartDate)} - ${formatDateShort(weekEndDate)} • Week ${weekNumber}`;
  pdf.text(weekRange, pageWidth / 2, 20, { align: 'center' });
  
  // Header separator
  pdf.setLineWidth(3);
  pdf.setDrawColor(0, 0, 0);
  pdf.line(2, 27, pageWidth - 2, 27);
  
  // Week statistics section
  const totalEvents = events.length;
  const totalHours = events.reduce((sum, event) => {
    return sum + (new Date(event.endTime).getTime() - new Date(event.startTime).getTime()) / (1000 * 60 * 60);
  }, 0);
  
  const statsY = 32;
  pdf.setFillColor(248, 248, 248);
  pdf.rect(2, 27, pageWidth - 4, 12, 'F');
  
  pdf.setFontSize(8);
  pdf.setFont('times', 'normal');
  
  const statItems = [
    { label: 'Total Appointments', value: totalEvents.toString() },
    { label: 'Scheduled Time', value: `${totalHours.toFixed(1)}h` },
    { label: 'Daily Average', value: `${(totalHours / 7).toFixed(1)}h` },
    { label: 'Available Time', value: `${(168 - totalHours).toFixed(0)}h` }
  ];
  
  statItems.forEach((stat, index) => {
    const x = 15 + (index * (pageWidth - 30) / 4);
    pdf.setFont('times', 'bold');
    pdf.setFontSize(12);
    pdf.text(stat.value, x + 25, statsY + 3);
    pdf.setFont('times', 'normal');
    pdf.setFontSize(7);
    pdf.text(stat.label, x + 25, statsY + 7);
    
    if (index < statItems.length - 1) {
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(0.5);
      pdf.line(x + 50, 27, x + 50, 39);
    }
  });
  
  // Stats section bottom border
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(2);
  pdf.line(2, 39, pageWidth - 2, 39);
  
  // Legend section
  const legendY = 45;
  pdf.setFillColor(248, 248, 248);
  pdf.rect(2, 39, pageWidth - 4, 8, 'F');
  
  pdf.setFontSize(7);
  pdf.setFont('times', 'normal');
  const legendItems = [
    { name: 'SimplePractice', color: [245, 245, 245], border: [100, 149, 237] },
    { name: 'Google Calendar', color: [224, 224, 224], border: [102, 102, 102] },
    { name: 'Personal', color: [240, 240, 240], border: [153, 153, 153] }
  ];
  
  legendItems.forEach((item, index) => {
    const x = 15 + (index * 60);
    pdf.setFillColor(item.color[0], item.color[1], item.color[2]);
    pdf.rect(x, legendY - 2, 8, 4, 'F');
    pdf.setDrawColor(item.border[0], item.border[1], item.border[2]);
    pdf.setLineWidth(1);
    pdf.rect(x, legendY - 2, 8, 4, 'S');
    pdf.setTextColor(0, 0, 0);
    pdf.text(item.name, x + 12, legendY);
  });
  
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(2);
  pdf.line(2, 47, pageWidth - 2, 47);
  
  // Calendar grid setup
  const timeSlots = generateTimeSlots();
  const startY = 54;
  const headerHeight = 12;
  const rowHeight = 4.2;
  const timeColumnWidth = 22;
  const dayWidth = (pageWidth - 22 - 6) / 7;
  
  // Table header
  pdf.setFillColor(240, 240, 240);
  pdf.rect(15, startY, pageWidth - 30, headerHeight, 'F');
  
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0, 0, 0);
  pdf.text('Time', 17, startY + 6);
  
  // Day headers
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  days.forEach((day, index) => {
    const currentDate = new Date(weekStartDate);
    currentDate.setDate(currentDate.getDate() + index);
    const dateStr = `${currentDate.getMonth() + 1}/${currentDate.getDate()}`;
    
    const x = timeColumnWidth + 17 + (index * dayWidth);
    pdf.text(`${day} ${dateStr}`, x, startY + 4);
  });
  
  // Draw table borders
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(0.5);
  pdf.rect(15, startY, pageWidth - 30, headerHeight, 'S');
  
  // Time slots grid
  const gridStartY = startY + headerHeight;
  const drawnEvents = new Set<string>();
  
  // Draw all time slots with grid lines
  timeSlots.forEach((slot, index) => {
    const y = gridStartY + (index * rowHeight);
    
    // Time column
    pdf.setFontSize(6);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);
    pdf.text(slot.time, 17, y + 3);
    
    // Draw horizontal grid lines
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.2);
    pdf.line(15, y, pageWidth - 15, y);
    
    // Draw vertical grid lines for days
    for (let dayIndex = 0; dayIndex <= 7; dayIndex++) {
      const x = timeColumnWidth + 15 + (dayIndex * dayWidth);
      pdf.setDrawColor(150, 150, 150);
      pdf.setLineWidth(0.2);
      pdf.line(x, startY, x, gridStartY + (timeSlots.length * rowHeight));
    }
    
    // Add events for each day in this time slot
    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      const currentDate = new Date(weekStartDate);
      currentDate.setDate(currentDate.getDate() + dayIndex);
      
      // Find events that START in this time slot
      const slotEvents = events.filter(event => {
        if (drawnEvents.has(event.id)) return false;
        
        const eventDate = new Date(event.startTime);
        const eventStartMinutes = eventDate.getHours() * 60 + eventDate.getMinutes();
        const slotStartMinutes = slot.hour * 60 + slot.minute;
        
        return eventDate.toDateString() === currentDate.toDateString() &&
               eventStartMinutes >= slotStartMinutes && 
               eventStartMinutes < slotStartMinutes + 30;
      });
      
      slotEvents.forEach(event => {
        drawnEvents.add(event.id);
        
        // Calculate event dimensions
        const eventStart = new Date(event.startTime);
        const eventEnd = new Date(event.endTime);
        const durationMinutes = (eventEnd.getTime() - eventStart.getTime()) / (1000 * 60);
        const eventHeightInRows = Math.max(1, Math.ceil(durationMinutes / 30));
        const eventHeight = eventHeightInRows * rowHeight - 0.5;
        
        const eventX = timeColumnWidth + 15 + (dayIndex * dayWidth) + 0.5;
        const eventWidth = dayWidth - 1;
        
        // Draw event block
        pdf.setFillColor(220, 220, 220);
        pdf.rect(eventX, y + 0.5, eventWidth, eventHeight, 'F');
        
        // Draw event border
        pdf.setDrawColor(100, 100, 100);
        pdf.setLineWidth(0.3);
        pdf.rect(eventX, y + 0.5, eventWidth, eventHeight, 'S');
        
        // Event text
        pdf.setFontSize(5);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(0, 0, 0);
        
        // Format event with time and title
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
        
        const cleanTitle = event.title.replace(/[^\w\s\-\.,;:()\[\]]/g, '');
        const eventWithTime = `${startTime}-${endTime} ${cleanTitle}`;
        
        // Use PDF's built-in text wrapping for better display
        const splitText = pdf.splitTextToSize(eventWithTime, eventWidth - 1);
        
        // Display multiple lines if text wraps
        if (Array.isArray(splitText)) {
          splitText.forEach((line, lineIndex) => {
            if (lineIndex < Math.floor(eventHeight / 2)) { // Limit lines to fit in event height
              pdf.text(line, eventX + 0.5, y + 2.5 + (lineIndex * 1.5));
            }
          });
        } else {
          pdf.text(splitText, eventX + 0.5, y + 2.5);
        }
      });
    }
  });
  
  // Draw final bottom border
  const finalY = gridStartY + (timeSlots.length * rowHeight);
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(0.5);
  pdf.line(15, finalY, pageWidth - 15, finalY);
  
  // Draw outer table border
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(0.8);
  pdf.rect(15, startY, pageWidth - 30, headerHeight + (timeSlots.length * rowHeight), 'S');
  
  return pdf.output('datauristring').split(',')[1];
};

export const exportDailyToPDF = async (
  selectedDate: Date,
  events: CalendarEvent[],
  dailyNotes: string
): Promise<string> => {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  pdf.setFont('times', 'normal');
  
  // Professional border around entire page
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(2);
  pdf.rect(2, 2, pageWidth - 4, pageHeight - 4, 'S');
  
  // Header section with gray background
  pdf.setFillColor(248, 248, 248);
  pdf.rect(2, 2, pageWidth - 4, 25, 'F');
  
  // Header content
  pdf.setFontSize(18);
  pdf.setFont('times', 'bold');
  pdf.setTextColor(0, 0, 0);
  pdf.text('DAILY PLANNER', pageWidth / 2, 12, { align: 'center' });
  
  // Date and navigation info
  pdf.setFontSize(12);
  pdf.setFont('times', 'normal');
  const dayName = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
  const dateStr = selectedDate.toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  });
  pdf.text(`${dayName}, ${dateStr}`, pageWidth / 2, 20, { align: 'center' });
  
  // Header separator
  pdf.setLineWidth(3);
  pdf.setDrawColor(0, 0, 0);
  pdf.line(2, 27, pageWidth - 2, 27);
  
  // Time grid layout matching your preferred format
  const timeSlots = generateTimeSlots(); // 06:00 to 23:30
  const startY = 35;
  const timeColumnWidth = 35;
  const rowHeight = 7; // Adjust to fit all slots on page
  
  // Draw time grid border
  const gridHeight = timeSlots.length * rowHeight;
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(0.5);
  pdf.rect(15, startY, pageWidth - 30, gridHeight, 'S');
  
  // Draw vertical line separating time column
  pdf.line(15 + timeColumnWidth, startY, 15 + timeColumnWidth, startY + gridHeight);
  
  timeSlots.forEach((slot, index) => {
    const y = startY + (index * rowHeight);
    
    // Draw horizontal grid lines
    if (index > 0) {
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.3);
      pdf.line(15, y, pageWidth - 15, y);
    }
    
    // Time labels (only show major hours, not 30-min slots for cleaner look)
    if (slot.minute === 0) {
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      pdf.text(slot.time, 17, y + 5);
    } else {
      // Show 30-minute marks smaller
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 100, 100);
      pdf.text(slot.time.substring(3), 25, y + 4); // Just show :30
    }
    
    // Check for events in this time slot
    const slotEvents = events.filter(event => {
      const eventDate = new Date(event.startTime);
      const eventStartMinutes = eventDate.getHours() * 60 + eventDate.getMinutes();
      const slotStartMinutes = slot.hour * 60 + slot.minute;
      
      return eventDate.toDateString() === selectedDate.toDateString() &&
             eventStartMinutes >= slotStartMinutes && 
             eventStartMinutes < slotStartMinutes + 30;
    });
    
    // Draw events as blocks spanning multiple rows if needed
    slotEvents.forEach(event => {
      const eventStart = new Date(event.startTime);
      const eventEnd = new Date(event.endTime);
      const durationMinutes = (eventEnd.getTime() - eventStart.getTime()) / (1000 * 60);
      const eventHeightInRows = Math.max(1, Math.ceil(durationMinutes / 30));
      const eventHeight = eventHeightInRows * rowHeight - 1;
      
      const eventX = 15 + timeColumnWidth + 2;
      const eventWidth = pageWidth - 30 - timeColumnWidth - 4;
      
      // Draw event background
      pdf.setFillColor(230, 230, 230);
      pdf.rect(eventX, y + 1, eventWidth, eventHeight, 'F');
      
      // Draw event border
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(0.5);
      pdf.rect(eventX, y + 1, eventWidth, eventHeight, 'S');
      
      // Event text
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      
      // Format title to fit width
      const cleanTitle = event.title.replace(/[^\w\s\-\.,;:()\[\]]/g, '');
      const maxChars = Math.floor(eventWidth / 2.5);
      let displayTitle = cleanTitle;
      if (cleanTitle.length > maxChars) {
        displayTitle = cleanTitle.substring(0, maxChars - 3) + '...';
      }
      
      pdf.text(displayTitle, eventX + 3, y + 5);
    });
  });
  
  // Daily notes section at bottom if there's space
  let notesY = startY + gridHeight + 20;
  
  if (notesY < pageHeight - 60) {
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.text('Daily Notes', 15, notesY);
    notesY += 10;
    
    if (dailyNotes && dailyNotes.trim()) {
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const splitNotes = pdf.splitTextToSize(dailyNotes, pageWidth - 30);
      pdf.text(splitNotes, 15, notesY);
    } else {
      // Draw lines for writing
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.3);
      for (let line = 0; line < 8; line++) {
        const lineY = notesY + (line * 8);
        if (lineY < pageHeight - 20) {
          pdf.line(15, lineY, pageWidth - 15, lineY);
        }
      }
    }
  }
  
  return pdf.output('datauristring').split(',')[1];
};

export const exportWeeklyPackageToPDF = async (
  weekStartDate: Date,
  weekEndDate: Date,
  events: CalendarEvent[],
  weekNumber: number,
  dailyNotes: { [date: string]: string }
): Promise<string> => {
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });
  
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  pdf.setFont('helvetica', 'normal');
  
  // Page 1: Weekly Overview (using existing weekly format)
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Weekly Planner', 15, 15);
  
  // Week range
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  const weekRange = `Week ${weekNumber} — ${formatDateShort(weekStartDate)} - ${formatDateShort(weekEndDate)}`;
  pdf.text(weekRange, pageWidth - 15, 15, { align: 'right' });
  
  // Header line
  pdf.setLineWidth(0.8);
  pdf.setDrawColor(0, 0, 0);
  pdf.line(15, 20, pageWidth - 15, 20);
  
  // Navigation footer
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'italic');
  pdf.setTextColor(100, 100, 100);
  pdf.text('Navigate to: Daily Pages 2-8', pageWidth / 2, pageHeight - 10, { align: 'center' });
  pdf.setTextColor(0, 0, 0);
  
  // Generate complete grid with events (reuse existing logic)
  const timeSlots = generateTimeSlots();
  const startY = 30;
  const headerHeight = 15;
  const rowHeight = 4.5;
  const timeColumnWidth = 30;
  const dayWidth = (pageWidth - 30 - timeColumnWidth) / 7;
  
  // Table header
  pdf.setFillColor(240, 240, 240);
  pdf.rect(15, startY, pageWidth - 30, headerHeight, 'F');
  
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0, 0, 0);
  pdf.text('Time', 17, startY + 6);
  
  // Day headers with navigation hints
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  days.forEach((day, index) => {
    const currentDate = new Date(weekStartDate);
    currentDate.setDate(currentDate.getDate() + index);
    const dateStr = `${currentDate.getMonth() + 1}/${currentDate.getDate()}`;
    
    const x = timeColumnWidth + 17 + (index * dayWidth);
    pdf.setFontSize(8);
    pdf.text(`${day} ${dateStr}`, x, startY + 4);
    pdf.setFontSize(6);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`→ Page ${index + 2}`, x, startY + 8);
    pdf.setTextColor(0, 0, 0);
  });
  
  // Draw table borders
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(0.5);
  pdf.rect(15, startY, pageWidth - 30, headerHeight, 'S');
  
  // Time slots grid with events
  const gridStartY = startY + headerHeight;
  const drawnEvents = new Set<string>();
  
  timeSlots.forEach((slot, index) => {
    const y = gridStartY + (index * rowHeight);
    
    pdf.setFontSize(6);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);
    pdf.text(slot.time, 17, y + 3);
    
    // Draw grid lines
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.2);
    pdf.line(15, y, pageWidth - 15, y);
    
    for (let dayIndex = 0; dayIndex <= 7; dayIndex++) {
      const x = timeColumnWidth + 15 + (dayIndex * dayWidth);
      pdf.setDrawColor(150, 150, 150);
      pdf.setLineWidth(0.2);
      pdf.line(x, startY, x, gridStartY + (timeSlots.length * rowHeight));
    }
    
    // Add events for each day
    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
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
      
      slotEvents.forEach(event => {
        drawnEvents.add(event.id);
        
        const eventStart = new Date(event.startTime);
        const eventEnd = new Date(event.endTime);
        const durationMinutes = (eventEnd.getTime() - eventStart.getTime()) / (1000 * 60);
        const eventHeightInRows = Math.max(1, Math.ceil(durationMinutes / 30));
        const eventHeight = eventHeightInRows * rowHeight - 0.5;
        
        const eventX = timeColumnWidth + 15 + (dayIndex * dayWidth) + 0.5;
        const eventWidth = dayWidth - 1;
        
        // Draw event block
        pdf.setFillColor(220, 220, 220);
        pdf.rect(eventX, y + 0.5, eventWidth, eventHeight, 'F');
        
        pdf.setDrawColor(100, 100, 100);
        pdf.setLineWidth(0.3);
        pdf.rect(eventX, y + 0.5, eventWidth, eventHeight, 'S');
        
        // Comprehensive event info for weekly view
        let weeklyLineY = y + 1.5;
        const weeklyLineHeight = 1.8;
        const weeklyMaxWidth = eventWidth - 1;
        
        // Time range header
        pdf.setFontSize(4);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(0, 0, 0);
        
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
        
        pdf.text(`${startTime}-${endTime}`, eventX + 0.5, weeklyLineY);
        weeklyLineY += weeklyLineHeight;
        
        // Event title
        pdf.setFontSize(4);
        pdf.setFont('helvetica', 'bold');
        const cleanTitle = event.title.replace(/[^\w\s\-\.,;:()\[\]]/g, '');
        const titleLines = pdf.splitTextToSize(cleanTitle, weeklyMaxWidth);
        
        if (Array.isArray(titleLines)) {
          titleLines.slice(0, Math.floor(eventHeight / 2)).forEach(line => {
            if (weeklyLineY < y + eventHeight - 1) {
              pdf.text(line, eventX + 0.5, weeklyLineY);
              weeklyLineY += weeklyLineHeight;
            }
          });
        } else {
          pdf.text(titleLines, eventX + 0.5, weeklyLineY);
          weeklyLineY += weeklyLineHeight;
        }
        
        // Critical info (description/notes) if space allows
        if (eventHeight > 8 && weeklyLineY < y + eventHeight - 3) {
          pdf.setFontSize(3.5);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(60, 60, 60);
          
          let criticalInfo = '';
          if (event.description && event.description.trim()) {
            criticalInfo = event.description.substring(0, 30) + '...';
          } else if (event.notes && event.notes.trim()) {
            criticalInfo = event.notes.substring(0, 30) + '...';
          }
          
          if (criticalInfo) {
            const infoLines = pdf.splitTextToSize(criticalInfo, weeklyMaxWidth);
            if (Array.isArray(infoLines)) {
              infoLines.slice(0, 1).forEach(line => {
                if (weeklyLineY < y + eventHeight - 1.5) {
                  pdf.text(line, eventX + 0.5, weeklyLineY);
                  weeklyLineY += weeklyLineHeight - 0.3;
                }
              });
            } else {
              pdf.text(infoLines, eventX + 0.5, weeklyLineY);
              weeklyLineY += weeklyLineHeight;
            }
          }
          pdf.setTextColor(0, 0, 0);
        }
        
        // Action items indicator
        if (event.actionItems && event.actionItems.trim() && eventHeight > 6) {
          pdf.setFontSize(3);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(120, 0, 0);
          if (weeklyLineY < y + eventHeight - 1) {
            pdf.text('⚡ Actions', eventX + 0.5, weeklyLineY);
          }
          pdf.setTextColor(0, 0, 0);
        }
        
        // Navigation hint and source
        if (eventHeight > 3) {
          pdf.setFontSize(3);
          pdf.setTextColor(80, 80, 80);
          const sourceIcon = event.source === 'google' ? '📅' : event.source === 'simplepractice' ? '🏥' : '📝';
          pdf.text(`${sourceIcon} → P${dayIndex + 2}`, eventX + 0.5, y + eventHeight - 0.5);
          pdf.setTextColor(0, 0, 0);
        }
      });
    }
  });
  
  // Draw outer border
  const finalY = gridStartY + (timeSlots.length * rowHeight);
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(0.8);
  pdf.rect(15, startY, pageWidth - 30, headerHeight + (timeSlots.length * rowHeight), 'S');
  
  // Pages 2-8: Daily Pages
  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(weekStartDate);
    currentDate.setDate(currentDate.getDate() + i);
    const dateStr = currentDate.toISOString().split('T')[0];
    const dayEvents = events.filter(event => 
      new Date(event.startTime).toDateString() === currentDate.toDateString()
    );
    const dayNotes = dailyNotes[dateStr] || '';
    
    pdf.addPage('a4', 'portrait');
    
    const dailyPageWidth = pdf.internal.pageSize.getWidth();
    const dailyPageHeight = pdf.internal.pageSize.getHeight();
    
    // Header with navigation
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
    pdf.text('Daily Planner', 15, 20);
    
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'normal');
    const fullDateStr = currentDate.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
    pdf.text(`${dayName}, ${fullDateStr}`, dailyPageWidth - 15, 20, { align: 'right' });
    
    // Navigation links
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'italic');
    pdf.setTextColor(100, 100, 100);
    pdf.text('← Weekly Overview (Page 1)', 15, 28);
    
    if (i > 0) {
      pdf.text(`← ${new Date(weekStartDate.getTime() + (i-1) * 24*60*60*1000).toLocaleDateString('en-US', { weekday: 'short' })} (Page ${i+1})`, dailyPageWidth / 2 - 40, 28);
    }
    if (i < 6) {
      pdf.text(`${new Date(weekStartDate.getTime() + (i+1) * 24*60*60*1000).toLocaleDateString('en-US', { weekday: 'short' })} (Page ${i+3}) →`, dailyPageWidth / 2 + 40, 28);
    }
    pdf.setTextColor(0, 0, 0);
    
    // Header line
    pdf.setLineWidth(0.8);
    pdf.setDrawColor(0, 0, 0);
    pdf.line(15, 32, dailyPageWidth - 15, 32);
    
    // Time grid layout
    const dailyTimeSlots = generateTimeSlots();
    const dailyStartY = 40;
    const dailyTimeColumnWidth = 35;
    const dailyRowHeight = 6;
    
    // Draw time grid border
    const dailyGridHeight = dailyTimeSlots.length * dailyRowHeight;
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.5);
    pdf.rect(15, dailyStartY, dailyPageWidth - 30, dailyGridHeight, 'S');
    
    // Vertical line separating time column
    pdf.line(15 + dailyTimeColumnWidth, dailyStartY, 15 + dailyTimeColumnWidth, dailyStartY + dailyGridHeight);
    
    dailyTimeSlots.forEach((slot, index) => {
      const y = dailyStartY + (index * dailyRowHeight);
      
      // Draw horizontal grid lines
      if (index > 0) {
        pdf.setDrawColor(200, 200, 200);
        pdf.setLineWidth(0.3);
        pdf.line(15, y, dailyPageWidth - 15, y);
      }
      
      // Time labels
      if (slot.minute === 0) {
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(0, 0, 0);
        pdf.text(slot.time, 17, y + 4);
      } else {
        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(100, 100, 100);
        pdf.text(slot.time.substring(3), 25, y + 3);
      }
      
      // Check for events in this time slot
      const slotEvents = dayEvents.filter(event => {
        const eventDate = new Date(event.startTime);
        const eventStartMinutes = eventDate.getHours() * 60 + eventDate.getMinutes();
        const slotStartMinutes = slot.hour * 60 + slot.minute;
        
        return eventStartMinutes >= slotStartMinutes && 
               eventStartMinutes < slotStartMinutes + 30;
      });
      
      // Draw events as blocks
      slotEvents.forEach(event => {
        const eventStart = new Date(event.startTime);
        const eventEnd = new Date(event.endTime);
        const durationMinutes = (eventEnd.getTime() - eventStart.getTime()) / (1000 * 60);
        const eventHeightInRows = Math.max(1, Math.ceil(durationMinutes / 30));
        const eventHeight = eventHeightInRows * dailyRowHeight - 1;
        
        const eventX = 15 + dailyTimeColumnWidth + 2;
        const eventWidth = dailyPageWidth - 30 - dailyTimeColumnWidth - 4;
        
        // Draw event background
        pdf.setFillColor(230, 230, 230);
        pdf.rect(eventX, y + 1, eventWidth, eventHeight, 'F');
        
        pdf.setDrawColor(0, 0, 0);
        pdf.setLineWidth(0.5);
        pdf.rect(eventX, y + 1, eventWidth, eventHeight, 'S');
        
        // Comprehensive event information display
        let currentLineY = y + 3;
        const lineHeight = 2.5;
        const maxWidth = eventWidth - 6;
        
        // Time range (bold header)
        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(0, 0, 0);
        
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
        
        const timeRange = `${startTime}-${endTime}`;
        pdf.text(timeRange, eventX + 3, currentLineY);
        currentLineY += lineHeight + 1;
        
        // Event title
        pdf.setFontSize(6);
        pdf.setFont('helvetica', 'bold');
        const cleanTitle = event.title.replace(/[^\w\s\-\.,;:()\[\]]/g, '');
        const titleLines = pdf.splitTextToSize(cleanTitle, maxWidth);
        
        if (Array.isArray(titleLines)) {
          titleLines.slice(0, 2).forEach(line => {
            if (currentLineY < y + eventHeight - 2) {
              pdf.text(line, eventX + 3, currentLineY);
              currentLineY += lineHeight;
            }
          });
        } else {
          pdf.text(titleLines, eventX + 3, currentLineY);
          currentLineY += lineHeight;
        }
        
        // Event description (if available)
        if (event.description && event.description.trim() && currentLineY < y + eventHeight - 6) {
          pdf.setFontSize(5);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(60, 60, 60);
          
          const cleanDescription = event.description.replace(/[^\w\s\-\.,;:()\[\]]/g, '');
          const descLines = pdf.splitTextToSize(`Desc: ${cleanDescription}`, maxWidth);
          
          if (Array.isArray(descLines)) {
            descLines.slice(0, 2).forEach(line => {
              if (currentLineY < y + eventHeight - 4) {
                pdf.text(line, eventX + 3, currentLineY);
                currentLineY += lineHeight - 0.5;
              }
            });
          } else {
            pdf.text(descLines, eventX + 3, currentLineY);
            currentLineY += lineHeight;
          }
          pdf.setTextColor(0, 0, 0);
        }
        
        // Event notes (if available)
        if (event.notes && event.notes.trim() && currentLineY < y + eventHeight - 4) {
          pdf.setFontSize(5);
          pdf.setFont('helvetica', 'italic');
          pdf.setTextColor(80, 80, 80);
          
          const cleanNotes = event.notes.replace(/[^\w\s\-\.,;:()\[\]]/g, '');
          const notesLines = pdf.splitTextToSize(`Notes: ${cleanNotes}`, maxWidth);
          
          if (Array.isArray(notesLines)) {
            notesLines.slice(0, 1).forEach(line => {
              if (currentLineY < y + eventHeight - 2) {
                pdf.text(line, eventX + 3, currentLineY);
                currentLineY += lineHeight - 0.5;
              }
            });
          } else {
            pdf.text(notesLines, eventX + 3, currentLineY);
            currentLineY += lineHeight;
          }
          pdf.setTextColor(0, 0, 0);
        }
        
        // Action items (if available)
        if (event.actionItems && event.actionItems.trim() && currentLineY < y + eventHeight - 4) {
          pdf.setFontSize(5);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(120, 0, 0);
          
          const cleanActions = event.actionItems.replace(/[^\w\s\-\.,;:()\[\]]/g, '');
          const actionLines = pdf.splitTextToSize(`Actions: ${cleanActions}`, maxWidth);
          
          if (Array.isArray(actionLines)) {
            actionLines.slice(0, 1).forEach(line => {
              if (currentLineY < y + eventHeight - 2) {
                pdf.text(line, eventX + 3, currentLineY);
                currentLineY += lineHeight - 0.5;
              }
            });
          } else {
            pdf.text(actionLines, eventX + 3, currentLineY);
            currentLineY += lineHeight;
          }
          pdf.setTextColor(0, 0, 0);
        }
        
        // Source indicator
        if (currentLineY < y + eventHeight - 2) {
          pdf.setFontSize(4);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(120, 120, 120);
          const sourceText = event.source === 'google' ? '📅' : event.source === 'simplepractice' ? '🏥' : '📝';
          pdf.text(`${sourceText} ${event.source}`, eventX + 3, y + eventHeight - 1);
        }
        
        // Navigation hint (if space allows)
        if (eventHeight > 20) {
          pdf.setFontSize(4);
          pdf.setTextColor(80, 80, 80);
          pdf.text('← Weekly (P1)', eventX + eventWidth - 15, y + eventHeight - 1);
          pdf.setTextColor(0, 0, 0);
        }
      });
    });
    
    // Daily notes section
    let notesY = dailyStartY + dailyGridHeight + 15;
    
    if (notesY < dailyPageHeight - 60) {
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      pdf.text('Daily Notes', 15, notesY);
      notesY += 8;
      
      if (dayNotes && dayNotes.trim()) {
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        const splitNotes = pdf.splitTextToSize(dayNotes, dailyPageWidth - 30);
        pdf.text(splitNotes, 15, notesY);
      } else {
        // Draw lines for writing
        pdf.setDrawColor(200, 200, 200);
        pdf.setLineWidth(0.3);
        for (let line = 0; line < 6; line++) {
          const lineY = notesY + (line * 8);
          if (lineY < dailyPageHeight - 20) {
            pdf.line(15, lineY, dailyPageWidth - 15, lineY);
          }
        }
      }
    }
    
    // reMarkable optimization section
    if (notesY + 40 < dailyPageHeight - 30) {
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      pdf.text('Quick Actions & Tasks', 15, notesY + 20);
      
      // Add checkboxes for task management
      pdf.setDrawColor(100, 100, 100);
      pdf.setLineWidth(0.5);
      for (let task = 0; task < 3; task++) {
        const taskY = notesY + 30 + (task * 8);
        pdf.rect(15, taskY - 3, 4, 4, 'S'); // Checkbox
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.text('Task/Note: ________________________________', 22, taskY);
      }
      
      // Add sync instructions
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'italic');
      pdf.setTextColor(100, 100, 100);
      pdf.text('Sync Instructions: Export markups → Upload to app → Auto-sync to Google Calendar', 15, dailyPageHeight - 25);
    }
    
    // Footer navigation
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'italic');
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Page ${i + 2} of 8 | Navigate: ← Weekly (P1) | Daily Pages (P2-P8)`, dailyPageWidth / 2, dailyPageHeight - 10, { align: 'center' });
  }
  
  return pdf.output('datauristring').split(',')[1];
};

export const generateFilename = (type: 'weekly' | 'daily' | 'weekly-package', date: Date): string => {
  const dateStr = date.toISOString().split('T')[0];
  if (type === 'weekly-package') {
    return `Weekly_Package_${dateStr}.pdf`;
  }
  return type === 'weekly' 
    ? `Weekly_Planner_${dateStr}.pdf`
    : `Daily_Planner_${dateStr}.pdf`;
};