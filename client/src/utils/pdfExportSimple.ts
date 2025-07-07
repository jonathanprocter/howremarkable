import jsPDF from 'jspdf';
import { CalendarEvent } from '../types/calendar';

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
    
    // Calculate statistics
    const totalEvents = events.length;
    const scheduledHours = events.reduce((total, event) => {
      const duration = (new Date(event.endTime).getTime() - new Date(event.startTime).getTime()) / (1000 * 60 * 60);
      return total + duration;
    }, 0);
    const dailyAverage = totalEvents > 0 ? scheduledHours / 7 : 0;
    const availableHours = (7 * 24) - scheduledHours;
    
    // Set fonts and colors
    pdf.setFont('times', 'normal');
    
    // Page border
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.5);
    pdf.rect(5, 5, pageWidth - 10, pageHeight - 10);
    
    // Header
    pdf.setFillColor(255, 255, 255);
    pdf.rect(5, 5, pageWidth - 10, 25, 'F');
    
    pdf.setLineWidth(1);
    pdf.line(5, 30, pageWidth - 5, 30);
    
    pdf.setFontSize(24);
    pdf.setFont('times', 'bold');
    pdf.text('WEEKLY PLANNER', pageWidth / 2, 18, { align: 'center' });
    
    pdf.setFontSize(16);
    pdf.setFont('times', 'bold');
    const weekInfo = `July 7-13, 2025 • Week ${weekNumber}`;
    pdf.text(weekInfo, pageWidth / 2, 26, { align: 'center' });
    
    // Week Statistics
    const statsY = 35;
    pdf.setFillColor(248, 248, 248);
    pdf.rect(5, statsY, pageWidth - 10, 15, 'F');
    
    pdf.setLineWidth(0.5);
    pdf.line(5, statsY + 15, pageWidth - 5, statsY + 15);
    
    const statWidth = (pageWidth - 10) / 4;
    pdf.setFont('times', 'normal');
    pdf.setFontSize(12);
    
    // Draw stat divisions
    for (let i = 1; i < 4; i++) {
      pdf.line(5 + (i * statWidth), statsY, 5 + (i * statWidth), statsY + 15);
    }
    
    // Stat values
    pdf.setFont('times', 'bold');
    pdf.setFontSize(18);
    pdf.text(totalEvents.toString(), 5 + statWidth * 0.5, statsY + 7, { align: 'center' });
    pdf.text(scheduledHours.toFixed(1) + 'h', 5 + statWidth * 1.5, statsY + 7, { align: 'center' });
    pdf.text(dailyAverage.toFixed(1) + 'h', 5 + statWidth * 2.5, statsY + 7, { align: 'center' });
    pdf.text(Math.round(availableHours) + 'h', 5 + statWidth * 3.5, statsY + 7, { align: 'center' });
    
    // Stat labels
    pdf.setFont('times', 'normal');
    pdf.setFontSize(12);
    pdf.text('Total Appointments', 5 + statWidth * 0.5, statsY + 12, { align: 'center' });
    pdf.text('Scheduled Time', 5 + statWidth * 1.5, statsY + 12, { align: 'center' });
    pdf.text('Daily Average', 5 + statWidth * 2.5, statsY + 12, { align: 'center' });
    pdf.text('Available Time', 5 + statWidth * 3.5, statsY + 12, { align: 'center' });
    
    // Legend
    const legendY = 55;
    pdf.setFillColor(248, 248, 248);
    pdf.rect(5, legendY, pageWidth - 10, 12, 'F');
    
    pdf.setLineWidth(0.5);
    pdf.line(5, legendY + 12, pageWidth - 5, legendY + 12);
    
    pdf.setFont('times', 'normal');
    pdf.setFontSize(10);
    
    // Legend items
    let legendX = 15;
    const legendItems = [
      { name: 'SimplePractice', color: [245, 245, 245], border: [100, 149, 237] },
      { name: 'Google Calendar', color: [224, 224, 224], border: [102, 102, 102] },
      { name: 'Outlook', color: [245, 245, 245], border: [51, 51, 51] },
      { name: 'Personal', color: [240, 240, 240], border: [153, 153, 153] }
    ];
    
    legendItems.forEach(item => {
      // Legend symbol
      pdf.setFillColor(item.color[0], item.color[1], item.color[2]);
      pdf.rect(legendX, legendY + 3, 10, 6, 'F');
      pdf.setDrawColor(item.border[0], item.border[1], item.border[2]);
      pdf.setLineWidth(1);
      pdf.rect(legendX, legendY + 3, 10, 6, 'S');
      
      // Legend text
      pdf.setTextColor(0, 0, 0);
      pdf.text(item.name, legendX + 15, legendY + 7);
      
      legendX += 60;
    });
    
    // Calendar Grid
    const gridY = 72;
    const timeColWidth = 20;
    const dayColWidth = (pageWidth - 10 - timeColWidth) / 7;
    const rowHeight = 8;
    const headerHeight = 15;
    
    // Grid header
    pdf.setFillColor(240, 240, 240);
    pdf.rect(5, gridY, pageWidth - 10, headerHeight, 'F');
    
    // Time header
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(1);
    pdf.rect(5, gridY, timeColWidth, headerHeight, 'S');
    
    pdf.setFont('times', 'bold');
    pdf.setFontSize(12);
    pdf.text('TIME', 5 + timeColWidth/2, gridY + headerHeight/2 + 2, { align: 'center' });
    
    // Day headers
    const dayNames = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    dayNames.forEach((day, index) => {
      const currentDate = new Date(weekStartDate);
      currentDate.setDate(currentDate.getDate() + index);
      const dateNum = currentDate.getDate();
      
      const dayX = 5 + timeColWidth + (index * dayColWidth);
      
      pdf.setFillColor(240, 240, 240);
      pdf.rect(dayX, gridY, dayColWidth, headerHeight, 'F');
      pdf.setLineWidth(0.5);
      pdf.rect(dayX, gridY, dayColWidth, headerHeight, 'S');
      
      pdf.setFont('times', 'bold');
      pdf.setFontSize(12);
      pdf.text(day, dayX + dayColWidth/2, gridY + 6, { align: 'center' });
      pdf.setFontSize(16);
      pdf.text(dateNum.toString(), dayX + dayColWidth/2, gridY + 12, { align: 'center' });
    });
    
    // Time slots (6:00 - 21:30)
    for (let hour = 6; hour <= 21; hour++) {
      for (let half = 0; half < 2; half++) {
        if (hour === 21 && half === 1) break; // Stop at 21:30
        
        const timeY = gridY + headerHeight + ((hour - 6) * 2 + half) * rowHeight;
        const timeStr = half === 0 ? `${hour}:00` : `${hour}:30`;
        const isHour = half === 0;
        
        // Time slot
        pdf.setFillColor(isHour ? 240 : 248, isHour ? 240 : 248, isHour ? 240 : 248);
        pdf.rect(5, timeY, timeColWidth, rowHeight, 'F');
        pdf.setLineWidth(isHour ? 1 : 0.25);
        pdf.rect(5, timeY, timeColWidth, rowHeight, 'S');
        
        if (isHour) {
          pdf.setFont('times', 'bold');
          pdf.setFontSize(11);
          pdf.text(timeStr, 5 + timeColWidth/2, timeY + rowHeight/2 + 1, { align: 'center' });
        }
        
        // Day columns
        for (let day = 0; day < 7; day++) {
          const dayX = 5 + timeColWidth + (day * dayColWidth);
          pdf.setFillColor(255, 255, 255);
          pdf.rect(dayX, timeY, dayColWidth, rowHeight, 'F');
          pdf.setLineWidth(isHour ? 1 : 0.25);
          pdf.rect(dayX, timeY, dayColWidth, rowHeight, 'S');
        }
      }
    }
    
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