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
  const pdf = new jsPDF('landscape', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  // Title
  pdf.setFontSize(16);
  pdf.text(`Weekly Planner - Week ${weekNumber}`, pageWidth / 2, 20, { align: 'center' });
  
  // Week range
  pdf.setFontSize(12);
  const weekRange = `${formatDateShort(weekStartDate)} - ${formatDateShort(weekEndDate)}`;
  pdf.text(weekRange, pageWidth / 2, 30, { align: 'center' });
  
  // Create a simple weekly grid
  const startY = 40;
  const rowHeight = 8;
  const timeSlots = generateTimeSlots();
  const dayWidth = (pageWidth - 30) / 8; // 7 days + 1 time column
  
  // Headers
  const days = ['Time', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  days.forEach((day, index) => {
    pdf.text(day, 15 + (index * dayWidth), startY);
  });
  
  // Time slots and events
  timeSlots.forEach((slot, index) => {
    const y = startY + 10 + (index * rowHeight);
    pdf.setFontSize(8);
    pdf.text(slot.time, 15, y);
    
    // Add events for this time slot
    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      const currentDate = new Date(weekStartDate);
      currentDate.setDate(currentDate.getDate() + dayIndex);
      
      const dayEvents = events.filter(event => {
        const eventDate = new Date(event.startTime);
        return eventDate.toDateString() === currentDate.toDateString() &&
               eventDate.getHours() === slot.hour &&
               eventDate.getMinutes() === slot.minute;
      });
      
      if (dayEvents.length > 0) {
        pdf.setFontSize(6);
        dayEvents.forEach((event, eventIndex) => {
          pdf.text(event.title, 15 + ((dayIndex + 1) * dayWidth), y + (eventIndex * 3));
        });
      }
    }
  });
  
  return pdf.output('datauristring').split(',')[1]; // Return base64
};

export const exportDailyToPDF = async (
  selectedDate: Date,
  events: CalendarEvent[],
  dailyNotes: string
): Promise<string> => {
  const pdf = new jsPDF('portrait', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  
  // Title
  pdf.setFontSize(16);
  pdf.text(`Daily Planner - ${formatDate(selectedDate)}`, pageWidth / 2, 20, { align: 'center' });
  
  // Events section
  let currentY = 40;
  pdf.setFontSize(14);
  pdf.text('Schedule', 15, currentY);
  currentY += 10;
  
  const dayEvents = events.filter(event => {
    const eventDate = new Date(event.startTime);
    return eventDate.toDateString() === selectedDate.toDateString();
  });
  
  if (dayEvents.length > 0) {
    dayEvents.forEach(event => {
      pdf.setFontSize(10);
      const timeStr = `${event.startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} - ${event.endTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
      pdf.text(`${timeStr}: ${event.title}`, 15, currentY);
      currentY += 6;
      
      if (event.notes || event.actionItems) {
        pdf.setFontSize(8);
        if (event.notes) {
          pdf.text(`Notes: ${event.notes}`, 20, currentY);
          currentY += 4;
        }
        if (event.actionItems) {
          pdf.text(`Action Items: ${event.actionItems}`, 20, currentY);
          currentY += 4;
        }
      }
      currentY += 3;
    });
  } else {
    pdf.setFontSize(10);
    pdf.text('No events scheduled', 15, currentY);
    currentY += 10;
  }
  
  // Daily Notes section
  currentY += 10;
  pdf.setFontSize(14);
  pdf.text('Daily Notes', 15, currentY);
  currentY += 10;
  
  if (dailyNotes) {
    pdf.setFontSize(10);
    const splitNotes = pdf.splitTextToSize(dailyNotes, pageWidth - 30);
    pdf.text(splitNotes, 15, currentY);
  } else {
    pdf.setFontSize(10);
    pdf.text('No notes for this day', 15, currentY);
  }
  
  return pdf.output('datauristring').split(',')[1]; // Return base64
};

export const generateFilename = (type: 'weekly' | 'daily', date: Date): string => {
  const dateStr = date.toISOString().split('T')[0];
  return type === 'weekly' 
    ? `Weekly_Planner_${dateStr}.pdf`
    : `Daily_Planner_${dateStr}.pdf`;
};