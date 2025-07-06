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
  // Use custom page size optimized for reMarkable Pro (1404px width)
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [297, 210] // A4 landscape, but we'll optimize layout
  });
  
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  // Set font to avoid encoding issues - this is critical
  pdf.setFont('helvetica', 'normal');
  
  // Title
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`Weekly Planner - Week ${weekNumber}`, pageWidth / 2, 25, { align: 'center' });
  
  // Week range
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'normal');
  const weekRange = `${formatDateShort(weekStartDate)} - ${formatDateShort(weekEndDate)}`;
  pdf.text(weekRange, pageWidth / 2, 35, { align: 'center' });
  
  // Optimized layout for reMarkable Pro
  const startY = 50;
  const rowHeight = 12; // Increased for better readability
  const timeSlots = generateTimeSlots();
  const timeColumnWidth = 35; // Wider time column
  const dayWidth = (pageWidth - timeColumnWidth - 30) / 7; // 7 days with more padding
  
  // Headers with better styling
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Time', 20, startY);
  
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const dayAbbrev = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  dayAbbrev.forEach((day, index) => {
    const x = timeColumnWidth + 20 + (index * dayWidth);
    pdf.text(day, x, startY);
  });
  
  // Draw header underline
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(0.5);
  pdf.line(20, startY + 3, pageWidth - 20, startY + 3);
  
  // Draw grid lines
  pdf.setDrawColor(220, 220, 220);
  pdf.setLineWidth(0.2);
  
  // Time slots and events
  timeSlots.forEach((slot, index) => {
    const y = startY + 15 + (index * rowHeight);
    
    // Skip if we're running out of page space
    if (y > pageHeight - 20) return;
    
    // Time column with better formatting
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(80, 80, 80); // Darker gray for time
    pdf.text(slot.time, 20, y);
    
    // Draw light horizontal line
    pdf.setDrawColor(240, 240, 240);
    pdf.line(20, y + 2, pageWidth - 20, y + 2);
    
    // Add events for this time slot
    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      const currentDate = new Date(weekStartDate);
      currentDate.setDate(currentDate.getDate() + dayIndex);
      
      const dayEvents = events.filter(event => {
        const eventDate = new Date(event.startTime);
        const eventStartMinutes = eventDate.getHours() * 60 + eventDate.getMinutes();
        const slotStartMinutes = slot.hour * 60 + slot.minute;
        
        return eventDate.toDateString() === currentDate.toDateString() &&
               eventStartMinutes >= slotStartMinutes && 
               eventStartMinutes < slotStartMinutes + 30;
      });
      
      if (dayEvents.length > 0) {
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(0, 0, 0); // Black text for events
        
        dayEvents.forEach((event, eventIndex) => {
          const x = timeColumnWidth + 20 + (dayIndex * dayWidth);
          const eventY = y + (eventIndex * 4);
          
          // Better text handling - no truncation with "..."
          const maxChars = Math.floor(dayWidth / 2.5); // Estimate characters that fit
          let title = event.title;
          if (title.length > maxChars) {
            // Smart truncation at word boundaries
            const words = title.split(' ');
            title = '';
            for (const word of words) {
              if ((title + word).length <= maxChars - 1) {
                title += (title ? ' ' : '') + word;
              } else {
                break;
              }
            }
          }
          
          pdf.text(title, x, eventY);
        });
      }
    }
  });
  
  // Draw vertical lines between days
  pdf.setDrawColor(220, 220, 220);
  for (let i = 0; i <= 7; i++) {
    const x = timeColumnWidth + 20 + (i * dayWidth);
    pdf.line(x - 2, startY + 5, x - 2, Math.min(startY + 15 + (timeSlots.length * rowHeight), pageHeight - 20));
  }
  
  // Reset colors
  pdf.setTextColor(0, 0, 0);
  pdf.setDrawColor(0, 0, 0);
  
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

export const exportWeeklyPackageToPDF = async (
  weekStartDate: Date,
  weekEndDate: Date,
  events: CalendarEvent[],
  weekNumber: number,
  dailyNotesMap: { [date: string]: string }
): Promise<string> => {
  const pdf = new jsPDF('portrait', 'mm', 'a4');
  
  // Set font to avoid encoding issues
  pdf.setFont('helvetica', 'normal');
  
  // Page 1: Weekly Overview (Portrait)
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  // Title
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`Weekly Planner - Week ${weekNumber}`, pageWidth / 2, 25, { align: 'center' });
  
  // Week range
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'normal');
  const weekRange = `${formatDateShort(weekStartDate)} - ${formatDateShort(weekEndDate)}`;
  pdf.text(weekRange, pageWidth / 2, 35, { align: 'center' });
  
  // Weekly summary grid
  let currentY = 50;
  const dayHeight = 30;
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  days.forEach((dayName, index) => {
    const currentDate = new Date(weekStartDate);
    currentDate.setDate(currentDate.getDate() + index);
    
    // Day header
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${dayName} - ${formatDateShort(currentDate)}`, 15, currentY);
    currentY += 8;
    
    // Day events
    const dayEvents = events.filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate.toDateString() === currentDate.toDateString();
    });
    
    if (dayEvents.length > 0) {
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      dayEvents.forEach(event => {
        const startTime = new Date(event.startTime).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit', 
          hour12: false 
        });
        const endTime = new Date(event.endTime).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit', 
          hour12: false 
        });
        pdf.text(`• ${startTime}-${endTime}: ${event.title}`, 20, currentY);
        currentY += 5;
      });
    } else {
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'italic');
      pdf.setTextColor(150, 150, 150);
      pdf.text('No events scheduled', 20, currentY);
      pdf.setTextColor(0, 0, 0);
      currentY += 5;
    }
    
    currentY += 10;
    
    // Add page break if needed
    if (currentY > pageHeight - 40 && index < days.length - 1) {
      pdf.addPage();
      currentY = 20;
    }
  });
  
  // Now add daily pages for each day
  for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
    const currentDate = new Date(weekStartDate);
    currentDate.setDate(currentDate.getDate() + dayIndex);
    const dateKey = currentDate.toISOString().split('T')[0];
    const dailyNotes = dailyNotesMap[dateKey] || '';
    
    // Generate daily page using existing function
    const dailyPdfBase64 = await exportDailyToPDF(currentDate, events, dailyNotes);
    
    // Add new page and merge the daily PDF content
    pdf.addPage();
    
    // Since we can't directly merge PDFs, we'll recreate the daily content
    // This is a simplified version - in a real app, you'd use a PDF merger library
    
    // Daily page title
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`Daily Planner - ${formatDate(currentDate)}`, pageWidth / 2, 25, { align: 'center' });
    
    currentY = 40;
    
    // Filter events for this day
    const dayEvents = events.filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate.toDateString() === currentDate.toDateString();
    });
    
    // All-day events
    const allDayEvents = dayEvents.filter(event => {
      const start = new Date(event.startTime);
      const end = new Date(event.endTime);
      return (end.getTime() - start.getTime()) >= (23 * 60 * 60 * 1000); // 23+ hours
    });
    
    if (allDayEvents.length > 0) {
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('All-Day Events', 15, currentY);
      currentY += 8;
      
      allDayEvents.forEach(event => {
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`• ${event.title}`, 20, currentY);
        currentY += 6;
      });
      currentY += 5;
    }
    
    // Timed events
    const timedEvents = dayEvents.filter(event => {
      const start = new Date(event.startTime);
      const end = new Date(event.endTime);
      return (end.getTime() - start.getTime()) < (23 * 60 * 60 * 1000);
    });
    
    if (timedEvents.length > 0) {
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Schedule', 15, currentY);
      currentY += 8;
      
      timedEvents.forEach(event => {
        const startTime = new Date(event.startTime).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit', 
          hour12: false 
        });
        const endTime = new Date(event.endTime).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit', 
          hour12: false 
        });
        
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${startTime} - ${endTime}`, 20, currentY);
        pdf.setFont('helvetica', 'normal');
        pdf.text(event.title, 60, currentY);
        currentY += 6;
        
        if (event.notes) {
          pdf.setFontSize(8);
          pdf.setFont('helvetica', 'italic');
          pdf.setTextColor(100, 100, 100);
          pdf.text(event.notes, 25, currentY);
          pdf.setTextColor(0, 0, 0);
          currentY += 5;
        }
        currentY += 2;
      });
    }
    
    // Daily notes
    if (currentY < pageHeight - 60) {
      currentY += 10;
      pdf.setFontSize(12);
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
        pdf.setTextColor(0, 0, 0);
      }
    }
  }
  
  return pdf.output('datauristring').split(',')[1]; // Return base64
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