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
  
  // Generate basic grid
  const timeSlots = generateTimeSlots();
  const startY = 30;
  const headerHeight = 15;
  const rowHeight = 8;
  const timeColumnWidth = 30;
  const dayWidth = (pageWidth - 30 - timeColumnWidth) / 7;
  
  // Table header
  pdf.setFillColor(240, 240, 240);
  pdf.rect(15, startY, pageWidth - 30, headerHeight, 'F');
  
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
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
  
  // Grid lines
  const gridStartY = startY + headerHeight;
  timeSlots.forEach((slot, index) => {
    const y = gridStartY + (index * rowHeight);
    
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    pdf.text(slot.time, 18, y + 3.5);
    
    // Horizontal lines
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.3);
    pdf.line(15, y, pageWidth - 15, y);
    
    // Vertical lines
    for (let dayIndex = 0; dayIndex <= 7; dayIndex++) {
      const x = timeColumnWidth + 15 + (dayIndex * dayWidth);
      pdf.line(x, startY, x, gridStartY + (timeSlots.length * rowHeight));
    }
  });
  
  // Borders
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
  
  pdf.setFont('helvetica', 'normal');
  
  // Header
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('reMarkable Pro Daily Planner', 15, 15);
  
  // Date
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text(formatDate(selectedDate), pageWidth - 15, 15, { align: 'right' });
  
  // Header line
  pdf.setLineWidth(0.8);
  pdf.setDrawColor(0, 0, 0);
  pdf.line(15, 20, pageWidth - 15, 20);
  
  // Schedule section
  let currentY = 35;
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Schedule', 15, currentY);
  currentY += 10;
  
  // Time slots
  const timeSlots = generateTimeSlots();
  const rowHeight = 8;
  
  timeSlots.forEach((slot, index) => {
    const y = currentY + (index * rowHeight);
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.text(slot.time, 15, y + 4);
    
    // Line
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.3);
    pdf.line(35, y, pageWidth - 15, y);
    
    // Events for this slot
    const slotEvents = events.filter(event => {
      const eventDate = new Date(event.startTime);
      const eventStartMinutes = eventDate.getHours() * 60 + eventDate.getMinutes();
      const slotStartMinutes = slot.hour * 60 + slot.minute;
      
      return eventDate.toDateString() === selectedDate.toDateString() &&
             eventStartMinutes >= slotStartMinutes && 
             eventStartMinutes < slotStartMinutes + 30;
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
      pdf.text(`${startTime}-${endTime} ${event.title}`, 38, y + 4);
    });
  });
  
  // Daily notes
  currentY = 35 + (timeSlots.length * rowHeight) + 20;
  
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Daily Notes', 15, currentY);
  currentY += 8;
  
  if (dailyNotes && dailyNotes.trim()) {
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    const splitNotes = pdf.splitTextToSize(dailyNotes, pageWidth - 30);
    pdf.text(splitNotes, 15, currentY);
  } else {
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'italic');
    pdf.setTextColor(150, 150, 150);
    pdf.text('No notes for this day', 15, currentY);
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
  // For now, just return the weekly PDF
  return await exportWeeklyToPDF(weekStartDate, weekEndDate, events, weekNumber);
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