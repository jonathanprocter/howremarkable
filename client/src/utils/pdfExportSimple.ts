import jsPDF from 'jspdf';
import { CalendarEvent } from '../types/calendar';
import { formatDate } from './dateUtils';

export const exportWeeklyToPDF = async (
  weekStartDate: Date,
  weekEndDate: Date,
  events: CalendarEvent[],
  weekNumber: number
): Promise<string> => {
  try {
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });
    
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // Set font to a basic one that definitely works
    pdf.setFont('helvetica', 'normal');
    
    // Simple header
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Weekly Planner', pageWidth / 2, 20, { align: 'center' });
    
    // Week info
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'normal');
    const weekInfo = `${weekStartDate.toLocaleDateString()} - ${weekEndDate.toLocaleDateString()} • Week ${weekNumber}`;
    pdf.text(weekInfo, pageWidth / 2, 30, { align: 'center' });
    
    // Simple border
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(1);
    pdf.rect(10, 10, pageWidth - 20, pageHeight - 20);
    
    // Days of week header
    const dayHeaders = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const startX = 20;
    const dayWidth = (pageWidth - 40) / 7;
    let currentY = 50;
    
    // Draw day headers
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    dayHeaders.forEach((day, index) => {
      const x = startX + (index * dayWidth);
      pdf.text(day, x + dayWidth/2, currentY, { align: 'center' });
    });
    
    // Draw header line
    currentY += 5;
    pdf.line(startX, currentY, pageWidth - 20, currentY);
    
    // Filter events for this week
    const weekEvents = events.filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate >= weekStartDate && eventDate <= weekEndDate;
    });
    
    // Group events by day
    const eventsByDay: { [key: number]: CalendarEvent[] } = {};
    weekEvents.forEach(event => {
      const dayOfWeek = new Date(event.startTime).getDay();
      const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert Sunday=0 to Sunday=6
      if (!eventsByDay[adjustedDay]) {
        eventsByDay[adjustedDay] = [];
      }
      eventsByDay[adjustedDay].push(event);
    });
    
    // Draw events for each day
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    
    for (let day = 0; day < 7; day++) {
      const x = startX + (day * dayWidth);
      let eventY = currentY + 10;
      
      if (eventsByDay[day]) {
        eventsByDay[day].forEach(event => {
          if (eventY < pageHeight - 30) { // Don't go too close to bottom
            const startTime = new Date(event.startTime).toLocaleTimeString('en-US', { 
              hour: 'numeric', 
              minute: '2-digit',
              hour12: true 
            });
            const endTime = new Date(event.endTime).toLocaleTimeString('en-US', { 
              hour: 'numeric', 
              minute: '2-digit',
              hour12: true 
            });
            
            // Event title
            const eventText = event.title.length > 20 ? event.title.substring(0, 20) + '...' : event.title;
            pdf.text(eventText, x + 2, eventY);
            
            // Event time
            pdf.text(`${startTime}-${endTime}`, x + 2, eventY + 4);
            
            eventY += 12;
          }
        });
      }
    }
    
    // Add event count
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.text(`Total Events: ${weekEvents.length}`, startX, pageHeight - 20);
    
    return pdf.output('datauristring');
    
  } catch (error) {
    console.error('PDF Export Error:', error);
    throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const exportDailyToPDF = async (
  selectedDate: Date,
  events: CalendarEvent[],
  dailyNotes: string
): Promise<string> => {
  try {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // Set font
    pdf.setFont('helvetica', 'normal');
    
    // Simple header
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Daily Planner', pageWidth / 2, 20, { align: 'center' });
    
    // Date
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'normal');
    const dateStr = selectedDate.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    pdf.text(dateStr, pageWidth / 2, 30, { align: 'center' });
    
    // Simple border
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(1);
    pdf.rect(10, 10, pageWidth - 20, pageHeight - 20);
    
    // Filter events for selected date
    const dayEvents = events.filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate.toDateString() === selectedDate.toDateString();
    });
    
    // Events section
    let currentY = 50;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.text('Appointments:', 20, currentY);
    
    currentY += 10;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    
    if (dayEvents.length === 0) {
      pdf.text('No appointments scheduled', 20, currentY);
    } else {
      dayEvents.forEach(event => {
        const startTime = new Date(event.startTime).toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        });
        const endTime = new Date(event.endTime).toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        });
        
        pdf.text(`${startTime} - ${endTime}: ${event.title}`, 20, currentY);
        if (event.description) {
          currentY += 5;
          pdf.setFont('helvetica', 'italic');
          pdf.text(`  ${event.description}`, 20, currentY);
          pdf.setFont('helvetica', 'normal');
        }
        currentY += 8;
      });
    }
    
    // Notes section
    currentY += 10;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.text('Notes:', 20, currentY);
    
    currentY += 10;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    
    if (dailyNotes) {
      const lines = pdf.splitTextToSize(dailyNotes, pageWidth - 40);
      pdf.text(lines, 20, currentY);
    } else {
      pdf.text('No notes for this day', 20, currentY);
    }
    
    return pdf.output('datauristring');
    
  } catch (error) {
    console.error('Daily PDF Export Error:', error);
    throw new Error(`Failed to generate daily PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const exportWeeklyPackageToPDF = async (
  weekStartDate: Date,
  weekEndDate: Date,
  events: CalendarEvent[],
  weekNumber: number,
  dailyNotes: { [date: string]: string }
): Promise<string> => {
  // For now, just use the weekly export
  return exportWeeklyToPDF(weekStartDate, weekEndDate, events, weekNumber);
};

export const generateFilename = (type: 'weekly' | 'daily' | 'weekly-package', date: Date): string => {
  const dateStr = date.toISOString().split('T')[0];
  return `${type}-planner-${dateStr}.pdf`;
};