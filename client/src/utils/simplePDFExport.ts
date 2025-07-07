import jsPDF from 'jspdf';
import { CalendarEvent } from '../types/calendar';
import { formatDate } from './dateUtils';

// Enhanced PDF export that exactly matches the user's template
export const exportWeeklyRemarkable = async (
  weekStartDate: Date,
  weekEndDate: Date,
  events: CalendarEvent[],
  weekNumber: number
): Promise<string> => {
  // Create PDF in landscape mode for reMarkable Pro (exact template dimensions)
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [297, 210] // A4 landscape for exact template matching
  });

  // Template-exact styling
  pdf.setTextColor(0, 0, 0);
  pdf.setDrawColor(0, 0, 0);
  pdf.setFillColor(255, 255, 255);

  // Main border (exact template style)
  pdf.setLineWidth(1.5);
  pdf.rect(10, 10, 277, 190, 'S');

  // Header section with exact template styling
  pdf.setFillColor(240, 240, 240);
  pdf.rect(10, 10, 277, 25, 'F');
  
  // Header border
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(1);
  pdf.line(10, 35, 287, 35);

  // Week navigation arrows and title (matching template)
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('<', 20, 26);
  pdf.text('>', 270, 26);
  
  // Week title
  const startMonth = weekStartDate.toLocaleDateString('en-US', { month: 'short' });
  const endMonth = weekEndDate.toLocaleDateString('en-US', { month: 'short' });
  const startDay = weekStartDate.getDate();
  const endDay = weekEndDate.getDate();
  const year = weekStartDate.getFullYear();
  const weekTitle = `Week of ${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
  
  pdf.setFontSize(12);
  pdf.text(weekTitle, 148.5, 26, { align: 'center' });

  // View buttons (Weekly/Daily)
  pdf.setFillColor(50, 50, 50);
  pdf.rect(220, 15, 30, 15, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(8);
  pdf.text('Weekly', 235, 24, { align: 'center' });
  
  pdf.setTextColor(0, 0, 0);
  pdf.setFillColor(255, 255, 255);
  pdf.rect(252, 15, 30, 15, 'S');
  pdf.text('Daily', 267, 24, { align: 'center' });

  // Calendar grid with exact template dimensions
  const gridStartX = 10;
  const gridStartY = 40;
  const gridWidth = 277;
  const gridHeight = 155;
  const timeColumnWidth = 35;
  const dayColumnWidth = (gridWidth - timeColumnWidth) / 7;

  // Day headers with exact template styling
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const dayAbbrevs = ['Jun 30', 'Jul 1', 'Jul 2', 'Jul 3', 'Jul 4', 'Jul 5', 'Jul 6'];
  
  // Header row background
  pdf.setFillColor(248, 248, 248);
  pdf.rect(gridStartX, gridStartY, gridWidth, 20, 'F');
  
  // Time column header
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  
  dayNames.forEach((dayName, index) => {
    const dayX = gridStartX + timeColumnWidth + (index * dayColumnWidth);
    
    // Day name
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.text(dayName, dayX + dayColumnWidth / 2, gridStartY + 8, { align: 'center' });
    
    // Date
    const currentDate = new Date(weekStartDate);
    currentDate.setDate(weekStartDate.getDate() + index);
    const dateStr = currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text(dateStr, dayX + dayColumnWidth / 2, gridStartY + 16, { align: 'center' });
  });

  // Grid structure with exact time slots (6:00 AM to 11:30 PM)
  const timeSlots = [];
  for (let hour = 6; hour <= 23; hour++) {
    timeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
    if (hour < 23 || hour === 23) { // Include 23:30
      timeSlots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
  }

  const slotHeight = (gridHeight - 20) / timeSlots.length;

  // Draw time slots and grid lines
  timeSlots.forEach((timeSlot, index) => {
    const y = gridStartY + 20 + (index * slotHeight);
    
    // Time labels (every hour and half hour)
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    pdf.text(timeSlot, gridStartX + 5, y + 4);
    
    // Horizontal grid lines
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.3);
    if (timeSlot.endsWith(':00')) {
      pdf.setLineWidth(0.5); // Thicker lines for hours
    }
    pdf.line(gridStartX + timeColumnWidth, y, gridStartX + gridWidth, y);
  });

  // Vertical grid lines
  pdf.setDrawColor(200, 200, 200);
  pdf.setLineWidth(0.5);
  
  // Time column separator
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(1);
  pdf.line(gridStartX + timeColumnWidth, gridStartY, gridStartX + timeColumnWidth, gridStartY + gridHeight);
  
  // Day column separators
  pdf.setDrawColor(200, 200, 200);
  pdf.setLineWidth(0.5);
  for (let i = 1; i <= 7; i++) {
    const x = gridStartX + timeColumnWidth + (i * dayColumnWidth);
    pdf.line(x, gridStartY, x, gridStartY + gridHeight);
  }

  // Add events with precise positioning
  events.forEach(event => {
    const eventStart = new Date(event.startTime);
    const eventEnd = new Date(event.endTime);
    
    // Determine day column
    const dayIndex = Math.floor((eventStart.getTime() - weekStartDate.getTime()) / (1000 * 60 * 60 * 24));
    if (dayIndex >= 0 && dayIndex < 7) {
      const dayX = gridStartX + timeColumnWidth + (dayIndex * dayColumnWidth);
      
      // Calculate precise Y position based on time
      const startHour = eventStart.getHours();
      const startMinute = eventStart.getMinutes();
      const endHour = eventEnd.getHours();
      const endMinute = eventEnd.getMinutes();
      
      // Find slot index for start time
      const startSlotIndex = ((startHour - 6) * 2) + (startMinute >= 30 ? 1 : 0);
      const endSlotIndex = ((endHour - 6) * 2) + (endMinute >= 30 ? 1 : 0);
      
      const eventY = gridStartY + 20 + (startSlotIndex * slotHeight);
      const eventHeight = Math.max(slotHeight * 0.8, (endSlotIndex - startSlotIndex) * slotHeight);
      
      // Event box with template styling
      pdf.setFillColor(230, 240, 255);
      pdf.setDrawColor(100, 150, 255);
      pdf.setLineWidth(1);
      pdf.rect(dayX + 2, eventY + 1, dayColumnWidth - 4, eventHeight - 2, 'FD');
      
      // Event title (remove "Appointment" suffix)
      let eventTitle = event.title.replace(/\s*Appointment\s*$/i, '').trim();
      
      // Split title into multiple lines if needed
      const maxCharsPerLine = Math.floor(dayColumnWidth / 3);
      const titleLines = [];
      if (eventTitle.length > maxCharsPerLine) {
        const words = eventTitle.split(' ');
        let currentLine = '';
        words.forEach(word => {
          if ((currentLine + word).length <= maxCharsPerLine) {
            currentLine += (currentLine ? ' ' : '') + word;
          } else {
            if (currentLine) titleLines.push(currentLine);
            currentLine = word;
          }
        });
        if (currentLine) titleLines.push(currentLine);
      } else {
        titleLines.push(eventTitle);
      }
      
      // Draw title lines
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(6);
      pdf.setFont('helvetica', 'bold');
      titleLines.slice(0, 2).forEach((line, lineIndex) => {
        pdf.text(line, dayX + 4, eventY + 6 + (lineIndex * 4));
      });
      
      // Event time range
      const startTimeStr = `${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}`;
      const endTimeStr = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
      const timeRange = `${startTimeStr}-${endTimeStr}`;
      
      pdf.setFontSize(5);
      pdf.setFont('helvetica', 'normal');
      pdf.text(timeRange, dayX + 4, eventY + eventHeight - 3);
      
      // Duration in minutes
      const durationMinutes = Math.round((eventEnd.getTime() - eventStart.getTime()) / (1000 * 60));
      pdf.setTextColor(100, 100, 100);
      pdf.text(`${durationMinutes}min`, dayX + dayColumnWidth - 15, eventY + eventHeight - 3);
    }
  });

  // Download the PDF
  const filename = `weekly-planner-${formatDate(weekStartDate)}.pdf`;
  pdf.save(filename);
  
  return filename;
};