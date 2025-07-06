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
  
  pdf.setFont('helvetica', 'normal');
  
  // Header
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('reMarkable Pro Weekly Planner', 15, 15);
  
  // Week range
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  const weekRange = `Week ${weekNumber} — ${formatDateShort(weekStartDate)} - ${formatDateShort(weekEndDate)}`;
  pdf.text(weekRange, pageWidth - 15, 15, { align: 'right' });
  
  // Header line
  pdf.setLineWidth(0.8);
  pdf.setDrawColor(0, 0, 0);
  pdf.line(15, 20, pageWidth - 15, 20);
  
  // Generate complete grid with events (06:00 to 23:30)
  const timeSlots = generateTimeSlots(); // Should generate 06:00-23:30
  const startY = 30;
  const headerHeight = 15;
  const rowHeight = 4.5; // Smaller rows to fit all time slots on page
  const timeColumnWidth = 30;
  const dayWidth = (pageWidth - 30 - timeColumnWidth) / 7;
  
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
        
        // Fit text to available width
        const maxChars = Math.floor(eventWidth / 1.2);
        let displayTitle = eventWithTime;
        if (eventWithTime.length > maxChars) {
          displayTitle = eventWithTime.substring(0, maxChars - 3) + '...';
        }
        
        pdf.text(displayTitle, eventX + 0.5, y + 2.5);
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
  
  pdf.setFont('helvetica', 'normal');
  
  // Simple header without "reMarkable" branding
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Daily Planner', 15, 20);
  
  // Date on right side
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'normal');
  const dayName = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
  const dateStr = selectedDate.toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  });
  pdf.text(`${dayName}, ${dateStr}`, pageWidth - 15, 20, { align: 'right' });
  
  // Header line
  pdf.setLineWidth(0.8);
  pdf.setDrawColor(0, 0, 0);
  pdf.line(15, 25, pageWidth - 15, 25);
  
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
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  // First, get the weekly overview as a base
  const weeklyPdfData = await exportWeeklyToPDF(weekStartDate, weekEndDate, events, weekNumber);
  
  // Create weekly overview page in portrait mode
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  pdf.setFont('helvetica', 'normal');
  
  // Weekly package cover page
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text('reMarkable Pro Weekly Package', pageWidth / 2, 30, { align: 'center' });
  
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'normal');
  const weekRange = `Week ${weekNumber} — ${formatDateShort(weekStartDate)} - ${formatDateShort(weekEndDate)}`;
  pdf.text(weekRange, pageWidth / 2, 45, { align: 'center' });
  
  // Table of contents
  let currentY = 70;
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Contents:', 20, currentY);
  currentY += 10;
  
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text('• Weekly Overview (Landscape)', 25, currentY);
  currentY += 8;
  
  // Add daily pages to table of contents
  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(weekStartDate);
    currentDate.setDate(currentDate.getDate() + i);
    const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
    const dateStr = formatDate(currentDate);
    pdf.text(`• ${dayName} ${dateStr}`, 25, currentY);
    currentY += 8;
  }
  
  // Add weekly overview in landscape orientation
  pdf.addPage('a4', 'landscape');
  
  // Manually create a condensed weekly view in portrait space
  const weeklyPageWidth = pdf.internal.pageSize.getWidth();
  const weeklyPageHeight = pdf.internal.pageSize.getHeight();
  
  // Header for weekly overview
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Weekly Overview', 15, 20);
  
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text(weekRange, weeklyPageWidth - 15, 20, { align: 'right' });
  
  // Draw basic weekly grid
  const timeSlots = generateTimeSlots();
  const startY = 35;
  const headerHeight = 10;
  const rowHeight = 4; // Very compact rows
  const timeColumnWidth = 25;
  const dayWidth = (weeklyPageWidth - 30 - timeColumnWidth) / 7;
  
  // Table header
  pdf.setFillColor(240, 240, 240);
  pdf.rect(15, startY, weeklyPageWidth - 30, headerHeight, 'F');
  
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Time', 17, startY + 6);
  
  // Day headers
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  days.forEach((day, index) => {
    const currentDate = new Date(weekStartDate);
    currentDate.setDate(currentDate.getDate() + index);
    const dateStr = `${currentDate.getMonth() + 1}/${currentDate.getDate()}`;
    
    const x = timeColumnWidth + 17 + (index * dayWidth);
    pdf.setFontSize(7);
    pdf.text(`${day}`, x, startY + 4);
    pdf.text(`${dateStr}`, x, startY + 7);
  });
  
  // Show condensed time slots (every 2 hours only for overview)
  const condensedSlots = timeSlots.filter((slot, index) => index % 4 === 0);
  const gridStartY = startY + headerHeight;
  
  condensedSlots.forEach((slot, index) => {
    const y = gridStartY + (index * rowHeight * 2);
    
    pdf.setFontSize(6);
    pdf.setFont('helvetica', 'normal');
    pdf.text(slot.time, 17, y + 3);
    
    // Draw grid lines
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.2);
    pdf.line(15, y, weeklyPageWidth - 15, y);
    
    for (let dayIndex = 0; dayIndex <= 7; dayIndex++) {
      const x = timeColumnWidth + 15 + (dayIndex * dayWidth);
      pdf.line(x, startY, x, gridStartY + (condensedSlots.length * rowHeight * 2));
    }
  });
  
  // Border
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(0.5);
  pdf.rect(15, startY, weeklyPageWidth - 30, headerHeight + (condensedSlots.length * rowHeight * 2), 'S');
  
  // Now add daily pages for each day of the week
  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(weekStartDate);
    currentDate.setDate(currentDate.getDate() + i);
    const dateStr = currentDate.toISOString().split('T')[0];
    const dayEvents = events.filter(event => 
      new Date(event.startTime).toDateString() === currentDate.toDateString()
    );
    const dayNotes = dailyNotes[dateStr] || '';
    
    pdf.addPage('a4', 'portrait');
    
    // Create daily page content
    const dailyPageWidth = pdf.internal.pageSize.getWidth();
    
    // Header
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
    pdf.text(`${dayName} Daily Planner`, 15, 20);
    
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(formatDate(currentDate), dailyPageWidth - 15, 20, { align: 'right' });
    
    // Header line
    pdf.setLineWidth(0.8);
    pdf.setDrawColor(0, 0, 0);
    pdf.line(15, 25, dailyPageWidth - 15, 25);
    
    // Schedule section
    let dailyCurrentY = 40;
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Schedule', 15, dailyCurrentY);
    dailyCurrentY += 10;
    
    // Show relevant time slots with events
    const relevantSlots = timeSlots.filter(slot => {
      return dayEvents.some(event => {
        const eventDate = new Date(event.startTime);
        const eventStartMinutes = eventDate.getHours() * 60 + eventDate.getMinutes();
        const slotStartMinutes = slot.hour * 60 + slot.minute;
        return eventStartMinutes >= slotStartMinutes && eventStartMinutes < slotStartMinutes + 30;
      }) || (slot.hour >= 6 && slot.hour <= 22); // Show work hours even if no events
    });
    
    relevantSlots.forEach((slot) => {
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.text(slot.time, 15, dailyCurrentY + 4);
      
      // Line
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.3);
      pdf.line(35, dailyCurrentY, dailyPageWidth - 15, dailyCurrentY);
      
      // Events for this slot
      const slotEvents = dayEvents.filter(event => {
        const eventDate = new Date(event.startTime);
        const eventStartMinutes = eventDate.getHours() * 60 + eventDate.getMinutes();
        const slotStartMinutes = slot.hour * 60 + slot.minute;
        
        return eventStartMinutes >= slotStartMinutes && eventStartMinutes < slotStartMinutes + 30;
      });
      
      slotEvents.forEach(event => {
        const eventStart = new Date(event.startTime);
        const eventEnd = new Date(event.endTime);
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
        
        pdf.setFontSize(8);
        pdf.text(`${startTime}-${endTime} ${event.title}`, 38, dailyCurrentY + 4);
      });
      
      dailyCurrentY += 8;
    });
    
    // Daily notes
    dailyCurrentY += 20;
    
    if (dailyCurrentY > pageHeight - 80) {
      pdf.addPage();
      dailyCurrentY = 30;
    }
    
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Daily Notes', 15, dailyCurrentY);
    dailyCurrentY += 8;
    
    if (dayNotes && dayNotes.trim()) {
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const splitNotes = pdf.splitTextToSize(dayNotes, dailyPageWidth - 30);
      pdf.text(splitNotes, 15, dailyCurrentY);
    } else {
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'italic');
      pdf.setTextColor(150, 150, 150);
      pdf.text('No notes for this day', 15, dailyCurrentY);
      pdf.setTextColor(0, 0, 0);
    }
    
    // Add ruled lines for additional notes
    dailyCurrentY += 30;
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.3);
    
    for (let line = 0; line < 15; line++) {
      if (dailyCurrentY + (line * 8) < pageHeight - 20) {
        pdf.line(15, dailyCurrentY + (line * 8), dailyPageWidth - 15, dailyCurrentY + (line * 8));
      }
    }
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