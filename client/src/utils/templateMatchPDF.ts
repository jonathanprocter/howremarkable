import jsPDF from 'jspdf';
import { CalendarEvent } from '../types/calendar';

// Template-exact positioning system based on your HTML template
const TIME_POSITIONS = {
  '06:00': 0,    // 6:00 AM = 0px top
  '06:30': 30,   // 6:30 AM = 30px top
  '07:00': 60,   // 7:00 AM = 60px top
  '07:30': 90,   // 7:30 AM = 90px top
  '08:00': 120,  // 8:00 AM = 120px top
  '08:30': 150,  // 8:30 AM = 150px top
  '09:00': 180,  // 9:00 AM = 180px top
  '09:30': 210,  // 9:30 AM = 210px top
  '10:00': 240,  // 10:00 AM = 240px top
  '10:30': 270,  // 10:30 AM = 270px top
  '11:00': 300,  // 11:00 AM = 300px top
  '11:30': 330,  // 11:30 AM = 330px top
  '12:00': 360,  // 12:00 PM = 360px top
  '12:30': 390,  // 12:30 PM = 390px top
  '13:00': 420,  // 1:00 PM = 420px top
  '13:30': 450,  // 1:30 PM = 450px top
  '14:00': 480,  // 2:00 PM = 480px top
  '14:30': 510,  // 2:30 PM = 510px top
  '15:00': 540,  // 3:00 PM = 540px top
  '15:30': 570,  // 3:30 PM = 570px top
  '16:00': 600,  // 4:00 PM = 600px top
  '16:30': 630,  // 4:30 PM = 630px top
  '17:00': 660,  // 5:00 PM = 660px top
  '17:30': 690,  // 5:30 PM = 690px top
  '18:00': 720,  // 6:00 PM = 720px top
  '18:30': 750,  // 6:30 PM = 750px top
  '19:00': 780,  // 7:00 PM = 780px top
  '19:30': 810,  // 7:30 PM = 810px top
  '20:00': 840,  // 8:00 PM = 840px top
  '20:30': 870,  // 8:30 PM = 870px top
  '21:00': 900,  // 9:00 PM = 900px top
  '21:30': 930,  // 9:30 PM = 930px top
  '22:00': 960,  // 10:00 PM = 960px top
  '22:30': 990,  // 10:30 PM = 990px top
  '23:00': 1020, // 11:00 PM = 1020px top
  '23:30': 1050, // 11:30 PM = 1050px top
};

const TEMPLATE_CONFIG = {
  // A4 Landscape dimensions in points (1 point = 1/72 inch)
  pageWidth: 842,
  pageHeight: 595,
  
  // Grid layout from your template
  timeColumnWidth: 60,
  dayColumnWidth: 110,
  headerHeight: 80,
  gridStartY: 80,
  totalGridHeight: 480,
  
  // Template colors - exact match to your CSS
  lightBlue: [135, 206, 235], // #87CEEB
  borderGray: [102, 102, 102], // #666
  headerGray: [240, 240, 240], // #f0f0f0
  timeGray: [153, 153, 153], // #999
};

export const exportTemplateMatchPDF = async (
  weekStartDate: Date,
  weekEndDate: Date,
  events: CalendarEvent[]
): Promise<void> => {
  console.log('Starting Template Match PDF export...');
  
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: 'a4'
  });

  // Set font for the entire document
  pdf.setFont('helvetica', 'normal');
  
  // Title
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  const title = `Week of ${weekStartDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEndDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${weekStartDate.getFullYear()}`;
  const titleWidth = pdf.getTextWidth(title);
  pdf.text(title, (TEMPLATE_CONFIG.pageWidth - titleWidth) / 2, 40);
  
  // Draw main border
  pdf.setLineWidth(2);
  pdf.setDrawColor(0, 0, 0);
  pdf.rect(20, 20, TEMPLATE_CONFIG.pageWidth - 40, TEMPLATE_CONFIG.pageHeight - 40);
  
  // Draw header section
  pdf.setFillColor(...TEMPLATE_CONFIG.headerGray);
  pdf.rect(20, 20, TEMPLATE_CONFIG.pageWidth - 40, TEMPLATE_CONFIG.headerHeight, 'F');
  pdf.setLineWidth(3);
  pdf.line(20, TEMPLATE_CONFIG.headerHeight + 20, TEMPLATE_CONFIG.pageWidth - 20, TEMPLATE_CONFIG.headerHeight + 20);
  
  // Draw grid headers
  const gridStartX = 40;
  const gridStartY = TEMPLATE_CONFIG.gridStartY + 20;
  
  // Time column header
  pdf.setFillColor(...TEMPLATE_CONFIG.timeGray);
  pdf.rect(gridStartX, gridStartY, TEMPLATE_CONFIG.timeColumnWidth, 30, 'F');
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 255, 255);
  pdf.text('TIME', gridStartX + 15, gridStartY + 20);
  
  // Day headers
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const dates = [];
  
  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(weekStartDate);
    currentDate.setDate(weekStartDate.getDate() + i);
    dates.push(currentDate);
    
    const dayX = gridStartX + TEMPLATE_CONFIG.timeColumnWidth + (i * TEMPLATE_CONFIG.dayColumnWidth);
    
    // Day header background
    pdf.setFillColor(...TEMPLATE_CONFIG.headerGray);
    pdf.rect(dayX, gridStartY, TEMPLATE_CONFIG.dayColumnWidth, 30, 'F');
    
    // Day header border
    pdf.setLineWidth(1);
    pdf.setDrawColor(0, 0, 0);
    pdf.rect(dayX, gridStartY, TEMPLATE_CONFIG.dayColumnWidth, 30);
    
    // Day name
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    const dayName = dayNames[i].substring(0, 3).toUpperCase();
    const dayNameWidth = pdf.getTextWidth(dayName);
    pdf.text(dayName, dayX + (TEMPLATE_CONFIG.dayColumnWidth - dayNameWidth) / 2, gridStartY + 12);
    
    // Date
    pdf.setFontSize(16);
    const dateStr = currentDate.getDate().toString();
    const dateWidth = pdf.getTextWidth(dateStr);
    pdf.text(dateStr, dayX + (TEMPLATE_CONFIG.dayColumnWidth - dateWidth) / 2, gridStartY + 25);
  }
  
  // Draw time slots
  const timeSlots = Object.keys(TIME_POSITIONS);
  for (let i = 0; i < timeSlots.length; i++) {
    const timeSlot = timeSlots[i];
    const yPosition = gridStartY + 30 + (i * 15); // 15px per half hour
    
    // Time slot background
    const isHour = timeSlot.endsWith(':00');
    if (isHour) {
      pdf.setFillColor(...TEMPLATE_CONFIG.headerGray);
      pdf.rect(gridStartX, yPosition, TEMPLATE_CONFIG.timeColumnWidth, 15, 'F');
    } else {
      pdf.setFillColor(248, 248, 248);
      pdf.rect(gridStartX, yPosition, TEMPLATE_CONFIG.timeColumnWidth, 15, 'F');
    }
    
    // Time slot border
    pdf.setLineWidth(isHour ? 2 : 1);
    pdf.setDrawColor(isHour ? 0 : 221, isHour ? 0 : 221, isHour ? 0 : 221);
    pdf.line(gridStartX, yPosition + 15, gridStartX + TEMPLATE_CONFIG.timeColumnWidth, yPosition + 15);
    
    // Time text
    pdf.setFontSize(isHour ? 11 : 10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    const timeWidth = pdf.getTextWidth(timeSlot);
    pdf.text(timeSlot, gridStartX + (TEMPLATE_CONFIG.timeColumnWidth - timeWidth) / 2, yPosition + 10);
  }
  
  // Draw day columns and events
  for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
    const dayX = gridStartX + TEMPLATE_CONFIG.timeColumnWidth + (dayIndex * TEMPLATE_CONFIG.dayColumnWidth);
    const currentDate = dates[dayIndex];
    
    // Day column background
    pdf.setFillColor(255, 255, 255);
    pdf.rect(dayX, gridStartY + 30, TEMPLATE_CONFIG.dayColumnWidth, TEMPLATE_CONFIG.totalGridHeight, 'F');
    
    // Day column border
    pdf.setLineWidth(1);
    pdf.setDrawColor(221, 221, 221);
    pdf.rect(dayX, gridStartY + 30, TEMPLATE_CONFIG.dayColumnWidth, TEMPLATE_CONFIG.totalGridHeight);
    
    // Filter events for this day
    const dayEvents = events.filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate.toDateString() === currentDate.toDateString();
    });
    
    // Draw events
    dayEvents.forEach(event => {
      const startTime = new Date(event.startTime);
      const endTime = new Date(event.endTime);
      
      // Get position from template mapping
      const startHour = startTime.getHours();
      const startMinute = startTime.getMinutes();
      const timeKey = `${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}`;
      
      // Find closest template position
      let templatePosition = TIME_POSITIONS[timeKey];
      if (templatePosition === undefined) {
        // Find closest time slot for events that don't exactly match
        const eventMinutes = startHour * 60 + startMinute;
        let closestTime = '';
        let closestDiff = 999999;
        
        for (const [time, pos] of Object.entries(TIME_POSITIONS)) {
          const [hours, minutes] = time.split(':').map(Number);
          const timeMinutes = hours * 60 + minutes;
          const diff = Math.abs(eventMinutes - timeMinutes);
          if (diff < closestDiff) {
            closestDiff = diff;
            closestTime = time;
            templatePosition = pos;
          }
        }
        console.log(`Mapped ${timeKey} to closest time ${closestTime} at position ${templatePosition}`);
      }
      
      // Calculate event height based on duration (convert to PDF points)
      const durationMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
      const eventHeight = Math.max(15, (durationMinutes / 30) * 15); // Each 30min = 15 PDF points
      
      // Convert template position to PDF coordinates
      // Template: 30px per 30min slot = 1px per minute from 6AM
      // PDF: 15 points per 30min slot = 0.5 points per minute from 6AM
      const minutesSince6AM = (startHour - 6) * 60 + startMinute;
      const eventY = gridStartY + 30 + (minutesSince6AM * 0.5);
      
      // Draw event box with exact template styling
      pdf.setFillColor(...TEMPLATE_CONFIG.lightBlue);
      pdf.setDrawColor(...TEMPLATE_CONFIG.borderGray);
      pdf.setLineWidth(0.5);
      pdf.rect(dayX + 2, eventY, TEMPLATE_CONFIG.dayColumnWidth - 4, eventHeight, 'FD');
      
      // Event title (remove "Appointment" suffix)
      let eventTitle = event.title.replace(/\s+Appointment\s*$/, '').trim();
      if (eventTitle.length > 20) {
        eventTitle = eventTitle.substring(0, 18) + '...';
      }
      
      // Draw event text
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      pdf.text(eventTitle, dayX + 4, eventY + 12);
      
      // Duration text
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(0, 0, 0);
      pdf.text(`${Math.round(durationMinutes)}min`, dayX + 4, eventY + eventHeight - 4);
    });
  }
  
  // Generate filename
  const filename = `weekly-planner-${weekStartDate.toISOString().split('T')[0]}.pdf`;
  
  // Save the PDF
  pdf.save(filename);
  
  console.log(`Template Match PDF exported: ${filename}`);
};