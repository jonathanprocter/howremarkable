import jsPDF from 'jspdf';
import { CalendarEvent } from '../types/calendar';
import { generateTimeSlots } from './timeSlots';

// reMarkable Paper Pro optimized dimensions
const REMARKABLE_CONFIG = {
  // Landscape dimensions for optimal viewing
  width: 239, // mm
  height: 179, // mm
  margin: 5,
  contentWidth: 229,
  contentHeight: 169
};

const createRemarkablePDF = () => {
  return new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [REMARKABLE_CONFIG.width, REMARKABLE_CONFIG.height],
    compress: true
  });
};

export const exportWeeklyRemarkable = async (
  weekStartDate: Date,
  weekEndDate: Date,
  events: CalendarEvent[],
  weekNumber: number
): Promise<string> => {
  const pdf = createRemarkablePDF();
  
  // Set font for e-ink readability
  pdf.setFont('times', 'normal');
  pdf.setTextColor(0, 0, 0);
  
  // Border
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(1.5);
  pdf.rect(REMARKABLE_CONFIG.margin, REMARKABLE_CONFIG.margin, 
           REMARKABLE_CONFIG.contentWidth, REMARKABLE_CONFIG.contentHeight, 'S');
  
  // Header
  const headerHeight = 20;
  pdf.setFontSize(16);
  pdf.setFont('times', 'bold');
  pdf.text('Weekly Planner - reMarkable Pro Optimized', 
           REMARKABLE_CONFIG.width / 2, REMARKABLE_CONFIG.margin + 8, { align: 'center' });
  
  const monthStart = weekStartDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  const monthEnd = weekEndDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const weekInfo = `${monthStart}-${monthEnd.split(' ')[1]}, ${monthEnd.split(' ')[2]} • Week ${weekNumber}`;
  
  pdf.setFontSize(10);
  pdf.setFont('times', 'normal');
  pdf.text(weekInfo, REMARKABLE_CONFIG.width / 2, REMARKABLE_CONFIG.margin + 16, { align: 'center' });
  
  // Calendar grid optimized for reMarkable Pro
  const gridStartY = REMARKABLE_CONFIG.margin + headerHeight + 3;
  const gridHeight = REMARKABLE_CONFIG.contentHeight - headerHeight - 10;
  const timeColumnWidth = 25;
  const dayColumnWidth = (REMARKABLE_CONFIG.contentWidth - timeColumnWidth) / 7;
  
  // Day headers
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  pdf.setFontSize(8);
  pdf.setFont('times', 'bold');
  
  days.forEach((day, index) => {
    const dayX = REMARKABLE_CONFIG.margin + timeColumnWidth + (index * dayColumnWidth);
    
    // Alternating background for e-ink clarity
    if (index % 2 === 0) {
      pdf.setFillColor(240, 240, 240);
      pdf.rect(dayX, gridStartY, dayColumnWidth, gridHeight, 'F');
    }
    
    pdf.text(day, dayX + dayColumnWidth / 2, gridStartY + 6, { align: 'center' });
    
    // Date
    const currentDate = new Date(weekStartDate);
    currentDate.setDate(weekStartDate.getDate() + index);
    pdf.setFontSize(10);
    pdf.text(currentDate.getDate().toString(), 
             dayX + dayColumnWidth / 2, gridStartY + 12, { align: 'center' });
  });
  
  // Grid lines
  pdf.setDrawColor(128, 128, 128);
  pdf.setLineWidth(0.5);
  
  // Vertical lines
  for (let i = 0; i <= 7; i++) {
    const x = REMARKABLE_CONFIG.margin + timeColumnWidth + (i * dayColumnWidth);
    pdf.line(x, gridStartY, x, gridStartY + gridHeight);
  }
  
  // Time slots
  const timeSlots = generateTimeSlots();
  const slotHeight = Math.max(12, (gridHeight - 15) / timeSlots.length); // Minimum 12 units for readability
  
  timeSlots.forEach((slot, index) => {
    const y = gridStartY + 15 + (index * slotHeight);
    
    // Time labels (every 2 hours for clarity)
    if (index % 4 === 0) {
      pdf.setFontSize(6);
      pdf.setFont('times', 'normal');
      pdf.text(slot.time, REMARKABLE_CONFIG.margin + 2, y + 2);
    }
    
    // Horizontal grid lines
    pdf.setDrawColor(192, 192, 192);
    pdf.setLineWidth(0.3);
    pdf.line(REMARKABLE_CONFIG.margin + timeColumnWidth, y, 
             REMARKABLE_CONFIG.margin + REMARKABLE_CONFIG.contentWidth, y);
  });
  
  // Events - optimized for e-ink display
  events.forEach((event) => {
    const eventDate = new Date(event.startTime);
    const dayIndex = (eventDate.getDay() + 6) % 7; // Monday = 0
    
    if (dayIndex >= 0 && dayIndex < 7) {
      const eventStart = new Date(event.startTime);
      const eventEnd = new Date(event.endTime);
      const startHour = eventStart.getHours();
      const startMinute = eventStart.getMinutes();
      const duration = (eventEnd.getTime() - eventStart.getTime()) / (1000 * 60);
      
      const startSlotIndex = timeSlots.findIndex(slot => 
        slot.hour === startHour && slot.minute === startMinute
      );
      
      if (startSlotIndex >= 0) {
        const eventX = REMARKABLE_CONFIG.margin + timeColumnWidth + (dayIndex * dayColumnWidth);
        const eventY = gridStartY + 15 + (startSlotIndex * slotHeight);
        const eventHeight = Math.max((duration / 30) * slotHeight, slotHeight * 0.8);
        const eventWidth = dayColumnWidth - 2;
        
        // Event styling based on source
        if (event.source === 'google') {
          pdf.setFillColor(220, 220, 220);
          pdf.setDrawColor(0, 102, 204);
        } else if (event.source === 'simplepractice') {
          pdf.setFillColor(230, 230, 230);
          pdf.setDrawColor(51, 153, 51);
        } else {
          pdf.setFillColor(255, 255, 255);
          pdf.setDrawColor(0, 0, 0);
        }
        
        pdf.setLineWidth(1);
        pdf.rect(eventX + 1, eventY, eventWidth, eventHeight, 'FD');
        
        // Event text - optimized for e-ink
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(6);
        pdf.setFont('times', 'bold');
        
        // Clean up title - remove "Appointment" and excessive words
        let cleanTitle = event.title
          .replace(/ Appointment$/, '')
          .replace(/^(.{20}).*/, '$1...')  // Truncate if too long
          .trim();
        
        // Split title into multiple lines if needed
        const titleLines = pdf.splitTextToSize(cleanTitle, eventWidth - 4);
        const maxLines = Math.floor(eventHeight / 4) - 1; // Leave space for time
        
        // Draw title lines
        for (let i = 0; i < Math.min(titleLines.length, maxLines); i++) {
          pdf.text(titleLines[i], eventX + 2, eventY + 5 + (i * 4));
        }
        
        // Event time
        pdf.setFontSize(5);
        pdf.setFont('times', 'normal');
        const timeStr = eventStart.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit', 
          hour12: false 
        });
        const timeY = eventY + eventHeight - 3;
        pdf.text(timeStr, eventX + 2, timeY);
      }
    }
  });
  
  // Statistics
  const statsY = gridStartY + gridHeight + 5;
  pdf.setFontSize(8);
  pdf.setFont('times', 'bold');
  pdf.text('Weekly Stats:', REMARKABLE_CONFIG.margin + 2, statsY);
  
  const weekEvents = events.filter(event => {
    const eventDate = new Date(event.startTime);
    return eventDate >= weekStartDate && eventDate <= weekEndDate;
  });
  
  const totalHours = weekEvents.reduce((sum, event) => {
    return sum + (new Date(event.endTime).getTime() - new Date(event.startTime).getTime()) / (1000 * 60 * 60);
  }, 0);
  
  pdf.setFontSize(7);
  pdf.setFont('times', 'normal');
  pdf.text(`Events: ${weekEvents.length}`, REMARKABLE_CONFIG.margin + 2, statsY + 5);
  pdf.text(`Hours: ${totalHours.toFixed(1)}`, REMARKABLE_CONFIG.margin + 40, statsY + 5);
  
  return pdf.output('datauristring').split(',')[1];
};

export const exportDailyRemarkable = async (
  selectedDate: Date,
  events: CalendarEvent[],
  dailyNotes: string
): Promise<string> => {
  const pdf = createRemarkablePDF();
  
  pdf.setFont('times', 'normal');
  pdf.setTextColor(0, 0, 0);
  
  // Border
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(1.5);
  pdf.rect(REMARKABLE_CONFIG.margin, REMARKABLE_CONFIG.margin, 
           REMARKABLE_CONFIG.contentWidth, REMARKABLE_CONFIG.contentHeight, 'S');
  
  // Header
  pdf.setFontSize(16);
  pdf.setFont('times', 'bold');
  pdf.text('Daily Planner - reMarkable Pro', 
           REMARKABLE_CONFIG.width / 2, REMARKABLE_CONFIG.margin + 8, { align: 'center' });
  
  const dateStr = selectedDate.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  pdf.setFontSize(12);
  pdf.setFont('times', 'normal');
  pdf.text(dateStr, REMARKABLE_CONFIG.width / 2, REMARKABLE_CONFIG.margin + 18, { align: 'center' });
  
  // Content area
  const contentY = REMARKABLE_CONFIG.margin + 25;
  const contentHeight = REMARKABLE_CONFIG.contentHeight - 30;
  const timeColumnWidth = 30;
  
  // Filter and sort events for the day
  const dayEvents = events.filter(event => {
    const eventDate = new Date(event.startTime);
    return eventDate.toDateString() === selectedDate.toDateString();
  }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  
  // Time grid from 6:00 to 23:30
  const startHour = 6;
  const endHour = 23.5;
  const totalHours = endHour - startHour;
  const hourHeight = contentHeight / totalHours;
  
  // Draw time grid
  for (let hour = startHour; hour <= 23; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const time = hour + (minute / 60);
      const y = contentY + ((time - startHour) * hourHeight);
      
      if (minute === 0) {
        pdf.setFontSize(8);
        pdf.setFont('times', 'normal');
        const timeStr = `${hour.toString().padStart(2, '0')}:00`;
        pdf.text(timeStr, REMARKABLE_CONFIG.margin + 2, y + 3);
      }
      
      pdf.setDrawColor(192, 192, 192);
      pdf.setLineWidth(minute === 0 ? 0.5 : 0.3);
      pdf.line(REMARKABLE_CONFIG.margin + timeColumnWidth, y,
               REMARKABLE_CONFIG.margin + REMARKABLE_CONFIG.contentWidth, y);
    }
  }
  
  // Vertical separator
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(1);
  pdf.line(REMARKABLE_CONFIG.margin + timeColumnWidth, contentY,
           REMARKABLE_CONFIG.margin + timeColumnWidth, contentY + contentHeight);
  
  // Events
  dayEvents.forEach((event) => {
    const eventStart = new Date(event.startTime);
    const eventEnd = new Date(event.endTime);
    const startTime = eventStart.getHours() + (eventStart.getMinutes() / 60);
    const endTime = eventEnd.getHours() + (eventEnd.getMinutes() / 60);
    
    if (startTime >= startHour && startTime <= endHour) {
      const eventY = contentY + ((startTime - startHour) * hourHeight);
      const eventHeight = Math.max((endTime - startTime) * hourHeight, hourHeight * 0.8);
      const appointmentWidth = REMARKABLE_CONFIG.contentWidth - timeColumnWidth - 6;
      
      // Event styling
      if (event.source === 'google') {
        pdf.setFillColor(220, 220, 220);
        pdf.setDrawColor(0, 102, 204);
      } else if (event.source === 'simplepractice') {
        pdf.setFillColor(230, 230, 230);
        pdf.setDrawColor(51, 153, 51);
      } else {
        pdf.setFillColor(255, 255, 255);
        pdf.setDrawColor(0, 0, 0);
      }
      
      pdf.setLineWidth(1.5);
      pdf.rect(REMARKABLE_CONFIG.margin + timeColumnWidth + 2, eventY,
               appointmentWidth, eventHeight, 'FD');
      
      // Event text
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(9);
      pdf.setFont('times', 'bold');
      const titleLines = pdf.splitTextToSize(event.title, appointmentWidth - 4);
      pdf.text(titleLines[0] || event.title, 
               REMARKABLE_CONFIG.margin + timeColumnWidth + 4, eventY + 6);
      
      pdf.setFontSize(7);
      pdf.setFont('times', 'normal');
      const timeStr = `${eventStart.toLocaleTimeString('en-US', { 
        hour: '2-digit', minute: '2-digit', hour12: false 
      })}-${eventEnd.toLocaleTimeString('en-US', { 
        hour: '2-digit', minute: '2-digit', hour12: false 
      })}`;
      pdf.text(timeStr, REMARKABLE_CONFIG.margin + timeColumnWidth + 4, eventY + 12);
      
      // Notes if space allows
      if (event.notes && eventHeight > 20) {
        pdf.setFontSize(6);
        pdf.setFont('times', 'italic');
        const notesLines = pdf.splitTextToSize(event.notes, appointmentWidth - 4);
        notesLines.slice(0, 2).forEach((line: string, index: number) => {
          pdf.text(line, REMARKABLE_CONFIG.margin + timeColumnWidth + 4, eventY + 18 + (index * 4));
        });
      }
    }
  });
  
  return pdf.output('datauristring').split(',')[1];
};

export const exportMonthlyRemarkable = async (
  monthDate: Date,
  events: CalendarEvent[]
): Promise<string> => {
  const pdf = createRemarkablePDF();
  
  pdf.setFont('times', 'normal');
  pdf.setTextColor(0, 0, 0);
  
  // Border
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(1.5);
  pdf.rect(REMARKABLE_CONFIG.margin, REMARKABLE_CONFIG.margin, 
           REMARKABLE_CONFIG.contentWidth, REMARKABLE_CONFIG.contentHeight, 'S');
  
  // Header
  pdf.setFontSize(16);
  pdf.setFont('times', 'bold');
  const monthStr = monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  pdf.text(`Monthly Overview - ${monthStr}`, 
           REMARKABLE_CONFIG.width / 2, REMARKABLE_CONFIG.margin + 12, { align: 'center' });
  
  // Calendar grid
  const gridStartY = REMARKABLE_CONFIG.margin + 20;
  const gridHeight = REMARKABLE_CONFIG.contentHeight - 25;
  const cellWidth = REMARKABLE_CONFIG.contentWidth / 7;
  const cellHeight = gridHeight / 6;
  
  // Day headers
  const dayHeaders = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  pdf.setFontSize(8);
  pdf.setFont('times', 'bold');
  
  dayHeaders.forEach((day, index) => {
    pdf.text(day, REMARKABLE_CONFIG.margin + (index * cellWidth) + (cellWidth / 2),
             gridStartY + 6, { align: 'center' });
  });
  
  // Calendar grid
  const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - ((firstDay.getDay() + 6) % 7));
  
  for (let week = 0; week < 6; week++) {
    for (let day = 0; day < 7; day++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + (week * 7) + day);
      
      const cellX = REMARKABLE_CONFIG.margin + (day * cellWidth);
      const cellY = gridStartY + 10 + (week * cellHeight);
      
      // Cell border
      pdf.setDrawColor(128, 128, 128);
      pdf.setLineWidth(0.5);
      pdf.rect(cellX, cellY, cellWidth, cellHeight, 'S');
      
      // Date number
      pdf.setFontSize(7);
      pdf.setFont('times', currentDate.getMonth() === monthDate.getMonth() ? 'bold' : 'normal');
      pdf.setTextColor(currentDate.getMonth() === monthDate.getMonth() ? 0 : 128, 128, 128);
      pdf.text(currentDate.getDate().toString(), cellX + 2, cellY + 6);
      
      // Event count indicator
      const dayEvents = events.filter(event => {
        const eventDate = new Date(event.startTime);
        return eventDate.toDateString() === currentDate.toDateString();
      });
      
      if (dayEvents.length > 0) {
        pdf.setFillColor(0, 0, 0);
        pdf.circle(cellX + cellWidth - 4, cellY + 4, 1, 'F');
        
        pdf.setFontSize(5);
        pdf.setTextColor(0, 0, 0);
        pdf.text(dayEvents.length.toString(), cellX + cellWidth - 8, cellY + 6);
      }
    }
  }
  
  return pdf.output('datauristring').split(',')[1];
};

export const generateRemarkableFilename = (
  type: 'weekly' | 'daily' | 'monthly',
  date: Date
): string => {
  const dateStr = date.toISOString().split('T')[0];
  return `remarkable-${type}-${dateStr}.pdf`;
};