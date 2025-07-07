import jsPDF from 'jspdf';
import { CalendarEvent } from '../types/calendar';
import { formatDate } from './dateUtils';
import { generateTimeSlots } from './timeSlots';

// Simple PDF export without spread operators that cause TypeScript issues
export const exportWeeklyRemarkable = async (
  weekStartDate: Date,
  weekEndDate: Date,
  events: CalendarEvent[],
  weekNumber: number
): Promise<string> => {
  // Create PDF in landscape mode for reMarkable Pro
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [239, 179] // reMarkable Pro landscape dimensions
  });

  // Set up colors without spread operators
  pdf.setTextColor(0, 0, 0);
  pdf.setDrawColor(0, 0, 0);
  pdf.setFillColor(255, 255, 255);

  // Page border
  pdf.setLineWidth(2);
  pdf.rect(5, 5, 229, 169, 'S');

  // Header
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Weekly Planner', 119.5, 15, { align: 'center' });

  // Week info
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  const monthStart = weekStartDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  const monthEnd = weekEndDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const weekInfo = `${monthStart} - ${monthEnd.split(' ')[1]}, ${monthEnd.split(' ')[2]} • Week ${weekNumber}`;
  pdf.text(weekInfo, 119.5, 22, { align: 'center' });

  // Header separator
  pdf.setLineWidth(1);
  pdf.line(5, 25, 234, 25);

  // Calendar grid
  const gridStartY = 30;
  const gridHeight = 140;
  const timeColumnWidth = 25;
  const dayColumnWidth = (229 - timeColumnWidth) / 7;

  // Time column header
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Time', 17.5, gridStartY + 8, { align: 'center' });

  // Day headers
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  days.forEach((day, index) => {
    const dayX = 30 + (index * dayColumnWidth);
    
    // Day header
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'bold');
    pdf.text(day, dayX + dayColumnWidth / 2, gridStartY + 6, { align: 'center' });
    
    // Date
    const currentDate = new Date(weekStartDate);
    currentDate.setDate(weekStartDate.getDate() + index);
    pdf.setFontSize(9);
    pdf.text(
      currentDate.getDate().toString(),
      dayX + dayColumnWidth / 2,
      gridStartY + 12,
      { align: 'center' }
    );
  });

  // Grid lines
  pdf.setDrawColor(128, 128, 128);
  pdf.setLineWidth(0.5);
  
  // Vertical lines
  for (let i = 0; i <= 7; i++) {
    const x = 30 + (i * dayColumnWidth);
    pdf.line(x, gridStartY, x, gridStartY + gridHeight);
  }

  // Time column divider
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(1);
  pdf.line(30, gridStartY, 30, gridStartY + gridHeight);

  // Time slots
  const timeSlots = generateTimeSlots();
  const slotHeight = (gridHeight - 15) / timeSlots.length;

  timeSlots.forEach((slot, index) => {
    const y = gridStartY + 15 + (index * slotHeight);
    
    // Time labels for major hours
    if (slot.minute === 0) {
      pdf.setFontSize(6);
      pdf.setFont('helvetica', 'normal');
      pdf.text(slot.time, 17.5, y + 3, { align: 'center' });
    }
    
    // Horizontal grid lines
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.3);
    pdf.line(30, y, 234, y);
  });

  // Add events
  events.forEach(event => {
    const eventStart = new Date(event.startTime);
    const eventEnd = new Date(event.endTime);
    
    // Find which day column this event belongs to
    const dayIndex = Math.floor((eventStart.getTime() - weekStartDate.getTime()) / (1000 * 60 * 60 * 24));
    if (dayIndex >= 0 && dayIndex < 7) {
      const dayX = 30 + (dayIndex * dayColumnWidth);
      
      // Calculate Y position based on time
      const startHour = eventStart.getHours() + (eventStart.getMinutes() / 60);
      const endHour = eventEnd.getHours() + (eventEnd.getMinutes() / 60);
      const startMinutesSince6AM = Math.max(0, (startHour - 6) * 60 + eventStart.getMinutes() - (6 * 60));
      const eventDuration = (endHour - startHour) * 60;
      
      const eventY = gridStartY + 15 + (startMinutesSince6AM / 60) * (slotHeight * 2);
      const eventHeight = (eventDuration / 60) * (slotHeight * 2);
      
      // Draw event box
      pdf.setFillColor(245, 245, 245);
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(0.5);
      pdf.rect(dayX + 1, eventY, dayColumnWidth - 2, Math.max(8, eventHeight), 'FD');
      
      // Event text
      let eventTitle = event.title.replace(/\s*Appointment\s*$/i, '').trim();
      if (eventTitle.length > 15) {
        eventTitle = eventTitle.substring(0, 15) + '...';
      }
      
      pdf.setFontSize(6);
      pdf.setFont('helvetica', 'bold');
      pdf.text(eventTitle, dayX + 2, eventY + 4);
      
      // Event time
      const timeStr = `${eventStart.getHours().toString().padStart(2, '0')}:${eventStart.getMinutes().toString().padStart(2, '0')}`;
      pdf.setFontSize(5);
      pdf.setFont('helvetica', 'normal');
      pdf.text(timeStr, dayX + 2, eventY + Math.max(8, eventHeight) - 1);
    }
  });

  // Download the PDF
  const filename = `weekly-planner-${formatDate(weekStartDate)}.pdf`;
  pdf.save(filename);
  
  return filename;
};