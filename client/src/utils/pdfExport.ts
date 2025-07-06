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
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  // Title
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`Daily Planner - ${formatDate(selectedDate)}`, pageWidth / 2, 20, { align: 'center' });
  
  let currentY = 35;
  
  // Filter events for the selected date
  const dayEvents = events.filter(event => {
    const eventDate = new Date(event.startTime);
    const selectedDateStr = selectedDate.toDateString();
    const eventDateStr = eventDate.toDateString();
    
    // For all-day events, check if the date falls within the event range
    const duration = event.endTime.getTime() - event.startTime.getTime();
    const hours = duration / (1000 * 60 * 60);
    const isAllDayEvent = (event as any).isAllDay || hours >= 20;
    
    if (isAllDayEvent) {
      const selectedDateOnly = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
      const eventStartOnly = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
      const eventEndDate = new Date(event.endTime);
      const eventEndOnly = new Date(eventEndDate.getFullYear(), eventEndDate.getMonth(), eventEndDate.getDate());
      
      return selectedDateOnly >= eventStartOnly && selectedDateOnly < eventEndOnly;
    }
    
    return eventDateStr === selectedDateStr;
  });

  // Separate all-day and timed events
  const allDayEvents = dayEvents.filter(event => {
    if ((event as any).isAllDay) return true;
    const duration = event.endTime.getTime() - event.startTime.getTime();
    const hours = duration / (1000 * 60 * 60);
    const startHour = event.startTime.getHours();
    const startMinute = event.startTime.getMinutes();
    const isFullDay = startHour === 0 && startMinute === 0 && (hours === 24 || hours % 24 === 0);
    return isFullDay || hours >= 20;
  });

  const timedEvents = dayEvents.filter(event => {
    if ((event as any).isAllDay) return false;
    const duration = event.endTime.getTime() - event.startTime.getTime();
    const hours = duration / (1000 * 60 * 60);
    const startHour = event.startTime.getHours();
    const startMinute = event.startTime.getMinutes();
    const isFullDay = startHour === 0 && startMinute === 0 && (hours === 24 || hours % 24 === 0);
    return !isFullDay && hours < 20;
  });
  
  // All-Day Events Section
  if (allDayEvents.length > 0) {
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('All Day Events', 15, currentY);
    currentY += 8;
    
    allDayEvents.forEach(event => {
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`• ${event.title}`, 20, currentY);
      currentY += 6;
      
      if (event.notes) {
        pdf.setFontSize(8);
        pdf.setTextColor(100, 100, 100);
        const notes = pdf.splitTextToSize(`Notes: ${event.notes}`, pageWidth - 40);
        pdf.text(notes, 25, currentY);
        currentY += notes.length * 4;
        pdf.setTextColor(0, 0, 0);
      }
      currentY += 2;
    });
    currentY += 5;
  }
  
  // Schedule Section with Time Slots
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Schedule', 15, currentY);
  currentY += 10;
  
  const timeSlots = generateTimeSlots();
  const slotHeight = 8; // Match the visual height better
  
  // Track events that span multiple slots to avoid drawing them multiple times
  const drawnEvents = new Set();
  
  // Draw time grid with events inline (like the actual daily view)
  timeSlots.forEach((timeSlot, index) => {
    if (currentY > pageHeight - 30) {
      pdf.addPage();
      currentY = 20;
    }
    
    // Time column
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text(timeSlot.time, 15, currentY + 3);
    
    // Check for events that START in this time slot
    const slotEvents = timedEvents.filter(event => {
      if (drawnEvents.has(event.id)) return false;
      
      const eventStart = new Date(event.startTime);
      const eventStartMinutes = eventStart.getHours() * 60 + eventStart.getMinutes();
      const slotStartMinutes = timeSlot.hour * 60 + timeSlot.minute;
      return eventStartMinutes >= slotStartMinutes && eventStartMinutes < slotStartMinutes + 30;
    });
    
    // Calculate the height needed for this row (including any events)
    let rowHeight = slotHeight;
    
    if (slotEvents.length > 0) {
      slotEvents.forEach(event => {
        drawnEvents.add(event.id);
        
        const eventStart = new Date(event.startTime);
        const eventEnd = new Date(event.endTime);
        const eventDurationMinutes = (eventEnd.getTime() - eventStart.getTime()) / (1000 * 60);
        const eventDurationInSlots = Math.ceil(eventDurationMinutes / 30);
        
        // Calculate how much this event spans beyond the current slot
        const additionalHeight = (eventDurationInSlots - 1) * slotHeight;
        rowHeight = Math.max(rowHeight, slotHeight + additionalHeight);
        
        // Draw event block that spans the calculated height
        const blockWidth = pageWidth - 50;
        const eventTop = currentY;
        const eventHeight = eventDurationInSlots * slotHeight;
        
        // Draw event block background
        pdf.setFillColor(240, 248, 255); // Light blue background
        pdf.rect(33, eventTop, blockWidth, eventHeight, 'F');
        
        // Draw event border
        pdf.setDrawColor(100, 149, 237); // Cornflower blue border
        pdf.setLineWidth(1.0);
        pdf.rect(33, eventTop, blockWidth, eventHeight, 'S');
        
        // Event title
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(0, 0, 0);
        pdf.text(event.title, 35, eventTop + 4);
        
        // Event time and source
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
        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(70, 70, 70);
        pdf.text(`${event.notes || event.source} • ${startTime} - ${endTime}`, 35, eventTop + 8);
        
        console.log(`PDF Export - Event: ${event.title}, Duration: ${eventDurationMinutes}min, Slots: ${eventDurationInSlots}, Height: ${eventHeight}px`);
      });
    }
    
    // Draw horizontal line at the bottom of this row
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.1);
    pdf.line(15, currentY + rowHeight, pageWidth - 15, currentY + rowHeight);
    
    currentY += rowHeight;
  });
  
  // Reset drawing properties
  pdf.setTextColor(0, 0, 0);
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(0.1);
  
  // Daily Notes section
  if (currentY > pageHeight - 50) {
    pdf.addPage();
    currentY = 20;
  }
  
  currentY += 10;
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Daily Notes', 15, currentY);
  currentY += 10;
  
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
    pdf.setTextColor(0, 0, 0);
  }
  
  return pdf.output('datauristring').split(',')[1]; // Return base64
};

export const generateFilename = (type: 'weekly' | 'daily', date: Date): string => {
  const dateStr = date.toISOString().split('T')[0];
  return type === 'weekly' 
    ? `Weekly_Planner_${dateStr}.pdf`
    : `Daily_Planner_${dateStr}.pdf`;
};