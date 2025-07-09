import jsPDF from 'jspdf';
import { CalendarEvent } from '../types/calendar';
import { cleanEventTitle } from './titleCleaner';

// Configuration to match dashboard exactly
const DASHBOARD_CONFIG = {
  // Page dimensions - A3 landscape for weekly view
  pageWidth: 1190,
  pageHeight: 842,
  margin: 20,
  
  // Header matching dashboard
  headerHeight: 80,
  headerTextSize: 28,
  weekInfoSize: 16,
  
  // Stats section matching dashboard
  statsHeight: 60,
  statsTextSize: 16,
  statsLabelSize: 12,
  
  // Legend matching dashboard
  legendHeight: 40,
  legendTextSize: 13,
  legendIconSize: 12,
  
  // Grid matching dashboard
  timeColumnWidth: 80,
  slotHeight: 30,
  totalSlots: 36, // 6:00 to 23:30
  
  // Event styling matching dashboard
  eventTextSize: 9,
  eventTimeSize: 8,
  
  // Colors matching dashboard exactly
  colors: {
    headerBg: [248, 249, 250],
    statsBg: [248, 249, 250],
    legendBg: [248, 249, 250],
    hourRow: [240, 240, 240],
    halfHourRow: [248, 248, 248],
    gridBorder: [224, 224, 224],
    text: [0, 0, 0],
    lightText: [102, 102, 102],
    
    // Event colors matching dashboard
    simplePractice: [99, 102, 241], // cornflower blue
    google: [16, 185, 129], // green
    holiday: [245, 158, 11], // orange
    
    // Event backgrounds - white for all
    eventBg: [255, 255, 255]
  }
};

// Time slots exactly matching dashboard
const TIME_SLOTS = [
  '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30',
  '22:00', '22:30', '23:00', '23:30'
];

function getEventTypeForDashboard(event: CalendarEvent) {
  const isHoliday = event.title.toLowerCase().includes('holiday') ||
                   event.calendarId === 'en.usa#holiday@group.v.calendar.google.com';
  
  const isSimplePractice = !isHoliday && event.title.includes('Appointment');
  const isGoogle = event.source === 'google' && !isHoliday && !isSimplePractice;
  
  return { isSimplePractice, isGoogle, isHoliday };
}

function drawDashboardHeader(pdf: jsPDF, weekStartDate: Date, weekEndDate: Date) {
  const { pageWidth, margin, headerHeight } = DASHBOARD_CONFIG;
  
  // Header background
  pdf.setFillColor(...DASHBOARD_CONFIG.colors.headerBg);
  pdf.rect(margin, margin, pageWidth - (margin * 2), headerHeight, 'F');
  
  // Header border
  pdf.setDrawColor(...DASHBOARD_CONFIG.colors.gridBorder);
  pdf.setLineWidth(1);
  pdf.rect(margin, margin, pageWidth - (margin * 2), headerHeight, 'D');
  
  // Title
  pdf.setFont('times', 'bold');
  pdf.setFontSize(DASHBOARD_CONFIG.headerTextSize);
  pdf.setTextColor(...DASHBOARD_CONFIG.colors.text);
  pdf.text('WEEKLY PLANNER', pageWidth / 2, margin + 35, { align: 'center' });
  
  // Week info
  pdf.setFont('times', 'normal');
  pdf.setFontSize(DASHBOARD_CONFIG.weekInfoSize);
  pdf.setTextColor(...DASHBOARD_CONFIG.colors.lightText);
  const weekStart = weekStartDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  const weekEnd = weekEndDate.toLocaleDateString('en-US', { day: 'numeric' });
  const weekNumber = Math.ceil(((weekStartDate.getTime() - new Date(weekStartDate.getFullYear(), 0, 1).getTime()) / 86400000 + 1) / 7);
  pdf.text(`${weekStart}-${weekEnd} • Week ${weekNumber}`, pageWidth / 2, margin + 55, { align: 'center' });
}

function drawDashboardStats(pdf: jsPDF, events: CalendarEvent[]) {
  const { pageWidth, margin, headerHeight, statsHeight } = DASHBOARD_CONFIG;
  const statsY = margin + headerHeight;
  
  // Stats background
  pdf.setFillColor(...DASHBOARD_CONFIG.colors.statsBg);
  pdf.rect(margin, statsY, pageWidth - (margin * 2), statsHeight, 'F');
  
  // Stats border
  pdf.setDrawColor(...DASHBOARD_CONFIG.colors.gridBorder);
  pdf.setLineWidth(1);
  pdf.rect(margin, statsY, pageWidth - (margin * 2), statsHeight, 'D');
  
  // Calculate stats
  const totalEvents = events.length;
  const totalHours = events.reduce((sum, event) => {
    return sum + (new Date(event.endTime).getTime() - new Date(event.startTime).getTime()) / (1000 * 60 * 60);
  }, 0);
  const dailyAverage = totalHours / 7;
  const availableTime = 168 - totalHours;
  
  // Draw stats
  const stats = [
    { number: totalEvents.toString(), label: 'Total Appointments' },
    { number: `${totalHours.toFixed(1)}h`, label: 'Scheduled Time' },
    { number: `${dailyAverage.toFixed(1)}h`, label: 'Daily Average' },
    { number: `${availableTime.toFixed(0)}h`, label: 'Available Time' }
  ];
  
  const statWidth = (pageWidth - (margin * 2)) / 4;
  stats.forEach((stat, index) => {
    const x = margin + (index * statWidth) + (statWidth / 2);
    
    // Number
    pdf.setFont('times', 'bold');
    pdf.setFontSize(DASHBOARD_CONFIG.statsTextSize);
    pdf.setTextColor(...DASHBOARD_CONFIG.colors.text);
    pdf.text(stat.number, x, statsY + 25, { align: 'center' });
    
    // Label
    pdf.setFont('times', 'normal');
    pdf.setFontSize(DASHBOARD_CONFIG.statsLabelSize);
    pdf.setTextColor(...DASHBOARD_CONFIG.colors.lightText);
    pdf.text(stat.label, x, statsY + 40, { align: 'center' });
  });
}

function drawDashboardLegend(pdf: jsPDF) {
  const { pageWidth, margin, headerHeight, statsHeight, legendHeight } = DASHBOARD_CONFIG;
  const legendY = margin + headerHeight + statsHeight;
  
  // Legend background
  pdf.setFillColor(...DASHBOARD_CONFIG.colors.legendBg);
  pdf.rect(margin, legendY, pageWidth - (margin * 2), legendHeight, 'F');
  
  // Legend border
  pdf.setDrawColor(...DASHBOARD_CONFIG.colors.gridBorder);
  pdf.setLineWidth(1);
  pdf.rect(margin, legendY, pageWidth - (margin * 2), legendHeight, 'D');
  
  // Legend items
  const legendItems = [
    { color: DASHBOARD_CONFIG.colors.simplePractice, label: 'SimplePractice' },
    { color: DASHBOARD_CONFIG.colors.google, label: 'Google Calendar' },
    { color: DASHBOARD_CONFIG.colors.holiday, label: 'Holidays in United States' }
  ];
  
  const itemWidth = (pageWidth - (margin * 2)) / 3;
  legendItems.forEach((item, index) => {
    const x = margin + (index * itemWidth) + (itemWidth / 2);
    
    // Icon
    pdf.setFillColor(...item.color);
    pdf.rect(x - 30, legendY + 15, DASHBOARD_CONFIG.legendIconSize, 8, 'F');
    
    // Label
    pdf.setFont('times', 'normal');
    pdf.setFontSize(DASHBOARD_CONFIG.legendTextSize);
    pdf.setTextColor(...DASHBOARD_CONFIG.colors.text);
    pdf.text(item.label, x - 15, legendY + 25, { align: 'left' });
  });
}

function drawDashboardGrid(pdf: jsPDF, weekStartDate: Date, weekEndDate: Date, events: CalendarEvent[]) {
  const { pageWidth, margin, headerHeight, statsHeight, legendHeight, timeColumnWidth, slotHeight } = DASHBOARD_CONFIG;
  const gridY = margin + headerHeight + statsHeight + legendHeight;
  const dayColumnWidth = (pageWidth - (margin * 2) - timeColumnWidth) / 7;
  
  // Create week array
  const week = [];
  const currentDate = new Date(weekStartDate);
  for (let i = 0; i < 7; i++) {
    week.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  // Draw headers
  pdf.setFillColor(...DASHBOARD_CONFIG.colors.headerBg);
  pdf.rect(margin, gridY, timeColumnWidth, 40, 'F');
  pdf.setDrawColor(...DASHBOARD_CONFIG.colors.gridBorder);
  pdf.rect(margin, gridY, timeColumnWidth, 40, 'D');
  
  pdf.setFont('times', 'bold');
  pdf.setFontSize(12);
  pdf.setTextColor(...DASHBOARD_CONFIG.colors.text);
  pdf.text('TIME', margin + (timeColumnWidth / 2), gridY + 25, { align: 'center' });
  
  // Day headers
  week.forEach((date, index) => {
    const x = margin + timeColumnWidth + (index * dayColumnWidth);
    
    pdf.setFillColor(...DASHBOARD_CONFIG.colors.headerBg);
    pdf.rect(x, gridY, dayColumnWidth, 40, 'F');
    pdf.setDrawColor(...DASHBOARD_CONFIG.colors.gridBorder);
    pdf.rect(x, gridY, dayColumnWidth, 40, 'D');
    
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
    const dayNum = date.getDate();
    
    pdf.setFont('times', 'bold');
    pdf.setFontSize(12);
    pdf.text(dayName, x + (dayColumnWidth / 2), gridY + 20, { align: 'center' });
    pdf.setFont('times', 'normal');
    pdf.setFontSize(10);
    pdf.text(dayNum.toString(), x + (dayColumnWidth / 2), gridY + 32, { align: 'center' });
  });
  
  // Time slots
  TIME_SLOTS.forEach((timeSlot, slotIndex) => {
    const y = gridY + 40 + (slotIndex * slotHeight);
    const isHour = timeSlot.endsWith('00');
    
    // Time column
    pdf.setFillColor(...(isHour ? DASHBOARD_CONFIG.colors.hourRow : DASHBOARD_CONFIG.colors.halfHourRow));
    pdf.rect(margin, y, timeColumnWidth, slotHeight, 'F');
    pdf.setDrawColor(...DASHBOARD_CONFIG.colors.gridBorder);
    pdf.rect(margin, y, timeColumnWidth, slotHeight, 'D');
    
    pdf.setFont('times', 'normal');
    pdf.setFontSize(isHour ? 10 : 8);
    pdf.setTextColor(...DASHBOARD_CONFIG.colors.text);
    pdf.text(timeSlot, margin + (timeColumnWidth / 2), y + (slotHeight / 2) + 3, { align: 'center' });
    
    // Day columns
    week.forEach((date, dayIndex) => {
      const x = margin + timeColumnWidth + (dayIndex * dayColumnWidth);
      
      pdf.setFillColor(...(isHour ? DASHBOARD_CONFIG.colors.hourRow : DASHBOARD_CONFIG.colors.halfHourRow));
      pdf.rect(x, y, dayColumnWidth, slotHeight, 'F');
      pdf.setDrawColor(...DASHBOARD_CONFIG.colors.gridBorder);
      pdf.rect(x, y, dayColumnWidth, slotHeight, 'D');
      
      // Draw events for this time slot and day
      const dayEvents = events.filter(event => {
        const eventDate = new Date(event.startTime);
        return eventDate.toDateString() === date.toDateString();
      });
      
      dayEvents.forEach(event => {
        const eventStart = new Date(event.startTime);
        const eventEnd = new Date(event.endTime);
        const startHour = eventStart.getHours();
        const startMinute = eventStart.getMinutes();
        const endHour = eventEnd.getHours();
        const endMinute = eventEnd.getMinutes();
        
        // Check if this event starts in this time slot
        const slotHour = parseInt(timeSlot.split(':')[0]);
        const slotMinute = parseInt(timeSlot.split(':')[1]);
        
        if (startHour === slotHour && startMinute === slotMinute) {
          // Calculate event height
          const durationMinutes = (eventEnd.getTime() - eventStart.getTime()) / (1000 * 60);
          const eventHeight = Math.max((durationMinutes / 30) * slotHeight - 2, slotHeight - 2);
          
          // Get event styling
          const { isSimplePractice, isGoogle, isHoliday } = getEventTypeForDashboard(event);
          
          // Draw event background
          pdf.setFillColor(...DASHBOARD_CONFIG.colors.eventBg);
          pdf.rect(x + 2, y + 1, dayColumnWidth - 4, eventHeight, 'F');
          
          // Draw event border
          if (isSimplePractice) {
            pdf.setDrawColor(...DASHBOARD_CONFIG.colors.simplePractice);
            pdf.setLineWidth(1);
            pdf.rect(x + 2, y + 1, dayColumnWidth - 4, eventHeight, 'D');
            // Thick left border
            pdf.setLineWidth(3);
            pdf.line(x + 2, y + 1, x + 2, y + 1 + eventHeight);
          } else if (isGoogle) {
            pdf.setDrawColor(...DASHBOARD_CONFIG.colors.google);
            pdf.setLineWidth(1);
            pdf.setLineDashPattern([2, 2], 0);
            pdf.rect(x + 2, y + 1, dayColumnWidth - 4, eventHeight, 'D');
            pdf.setLineDashPattern([], 0);
          } else if (isHoliday) {
            pdf.setDrawColor(...DASHBOARD_CONFIG.colors.holiday);
            pdf.setLineWidth(1);
            pdf.rect(x + 2, y + 1, dayColumnWidth - 4, eventHeight, 'D');
          }
          
          // Draw event text
          const cleanTitle = cleanEventTitle(event.title);
          const startTime = eventStart.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
          const endTime = eventEnd.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
          
          pdf.setFont('times', 'normal');
          pdf.setFontSize(DASHBOARD_CONFIG.eventTextSize);
          pdf.setTextColor(...DASHBOARD_CONFIG.colors.text);
          
          // Event title
          const titleLines = pdf.splitTextToSize(cleanTitle, dayColumnWidth - 8);
          pdf.text(titleLines[0] || cleanTitle, x + 4, y + 12);
          
          // Event time
          pdf.setFontSize(DASHBOARD_CONFIG.eventTimeSize);
          pdf.setTextColor(...DASHBOARD_CONFIG.colors.lightText);
          pdf.text(`${startTime}-${endTime}`, x + 4, y + eventHeight - 5);
        }
      });
    });
  });
}

export const exportDashboardExactWeeklyPDF = async (
  weekStartDate: Date,
  weekEndDate: Date,
  events: CalendarEvent[]
): Promise<void> => {
  console.log('Creating dashboard-exact weekly PDF...');
  
  // Filter events for the week
  const weekEvents = events.filter(event => {
    const eventDate = new Date(event.startTime);
    return eventDate >= weekStartDate && eventDate <= weekEndDate;
  });
  
  // Create PDF
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: [DASHBOARD_CONFIG.pageWidth, DASHBOARD_CONFIG.pageHeight]
  });
  
  // White background
  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, DASHBOARD_CONFIG.pageWidth, DASHBOARD_CONFIG.pageHeight, 'F');
  
  // Draw all sections matching dashboard exactly
  drawDashboardHeader(pdf, weekStartDate, weekEndDate);
  drawDashboardStats(pdf, weekEvents);
  drawDashboardLegend(pdf);
  drawDashboardGrid(pdf, weekStartDate, weekEndDate, weekEvents);
  
  // Save PDF
  const filename = `weekly-planner-${weekStartDate.toISOString().split('T')[0]}.pdf`;
  pdf.save(filename);
  
  console.log(`Dashboard-exact weekly PDF exported: ${filename}`);
};

// Daily PDF export matching dashboard daily view
export const exportDashboardExactDailyPDF = async (
  selectedDate: Date,
  events: CalendarEvent[]
): Promise<void> => {
  console.log('Creating dashboard-exact daily PDF...');
  
  // Filter events for the day
  const dayEvents = events.filter(event => {
    const eventDate = new Date(event.startTime);
    return eventDate.toDateString() === selectedDate.toDateString();
  });
  
  // Create PDF in portrait format
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: [595, 842] // A4 portrait
  });
  
  // White background
  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, 595, 842, 'F');
  
  // Header
  pdf.setFont('times', 'bold');
  pdf.setFontSize(20);
  pdf.setTextColor(0, 0, 0);
  pdf.text('DAILY PLANNER', 297, 40, { align: 'center' });
  
  // Date
  pdf.setFont('times', 'normal');
  pdf.setFontSize(16);
  const dateStr = selectedDate.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  pdf.text(dateStr, 297, 60, { align: 'center' });
  
  // Time grid - exactly matching dashboard daily view
  const timeColumnWidth = 80;
  const appointmentColumnWidth = 515 - timeColumnWidth;
  const slotHeight = 20;
  
  TIME_SLOTS.forEach((timeSlot, slotIndex) => {
    const y = 100 + (slotIndex * slotHeight);
    const isHour = timeSlot.endsWith('00');
    
    // Time column
    pdf.setFillColor(isHour ? 240 : 248, isHour ? 240 : 248, isHour ? 240 : 248);
    pdf.rect(40, y, timeColumnWidth, slotHeight, 'F');
    pdf.setDrawColor(224, 224, 224);
    pdf.rect(40, y, timeColumnWidth, slotHeight, 'D');
    
    pdf.setFont('times', 'normal');
    pdf.setFontSize(isHour ? 10 : 8);
    pdf.setTextColor(0, 0, 0);
    pdf.text(timeSlot, 40 + (timeColumnWidth / 2), y + (slotHeight / 2) + 3, { align: 'center' });
    
    // Appointment column
    pdf.setFillColor(isHour ? 240 : 248, isHour ? 240 : 248, isHour ? 240 : 248);
    pdf.rect(40 + timeColumnWidth, y, appointmentColumnWidth, slotHeight, 'F');
    pdf.setDrawColor(224, 224, 224);
    pdf.rect(40 + timeColumnWidth, y, appointmentColumnWidth, slotHeight, 'D');
    
    // Draw events for this time slot
    const slotHour = parseInt(timeSlot.split(':')[0]);
    const slotMinute = parseInt(timeSlot.split(':')[1]);
    
    dayEvents.forEach(event => {
      const eventStart = new Date(event.startTime);
      const eventEnd = new Date(event.endTime);
      const startHour = eventStart.getHours();
      const startMinute = eventStart.getMinutes();
      
      if (startHour === slotHour && startMinute === slotMinute) {
        // Calculate event height
        const durationMinutes = (eventEnd.getTime() - eventStart.getTime()) / (1000 * 60);
        const eventHeight = Math.max((durationMinutes / 30) * slotHeight - 2, slotHeight - 2);
        
        // Get event styling
        const { isSimplePractice, isGoogle, isHoliday } = getEventTypeForDashboard(event);
        
        // Draw event - 3 column layout matching dashboard
        const x = 40 + timeColumnWidth + 2;
        const eventWidth = appointmentColumnWidth - 4;
        
        // Event background
        pdf.setFillColor(255, 255, 255);
        pdf.rect(x, y + 1, eventWidth, eventHeight, 'F');
        
        // Event border
        if (isSimplePractice) {
          pdf.setDrawColor(99, 102, 241);
          pdf.setLineWidth(1);
          pdf.rect(x, y + 1, eventWidth, eventHeight, 'D');
          // Thick left border
          pdf.setLineWidth(3);
          pdf.line(x, y + 1, x, y + 1 + eventHeight);
        } else if (isGoogle) {
          pdf.setDrawColor(16, 185, 129);
          pdf.setLineWidth(1);
          pdf.setLineDashPattern([2, 2], 0);
          pdf.rect(x, y + 1, eventWidth, eventHeight, 'D');
          pdf.setLineDashPattern([], 0);
        } else if (isHoliday) {
          pdf.setDrawColor(245, 158, 11);
          pdf.setLineWidth(1);
          pdf.rect(x, y + 1, eventWidth, eventHeight, 'D');
        }
        
        // Event text in 3-column layout
        const cleanTitle = cleanEventTitle(event.title);
        const startTime = eventStart.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
        const endTime = eventEnd.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
        
        // Left column: Event info
        pdf.setFont('times', 'bold');
        pdf.setFontSize(8);
        pdf.setTextColor(0, 0, 0);
        pdf.text(cleanTitle, x + 4, y + 12);
        
        pdf.setFont('times', 'normal');
        pdf.setFontSize(7);
        pdf.setTextColor(102, 102, 102);
        const source = isHoliday ? 'Holidays in United States' : 
                      isSimplePractice ? 'SimplePractice' : 'Google Calendar';
        pdf.text(`${source} calendar`, x + 4, y + 22);
        
        pdf.setFont('times', 'bold');
        pdf.setFontSize(9);
        pdf.setTextColor(0, 0, 0);
        pdf.text(`${startTime}-${endTime}`, x + 4, y + 32);
        
        // Center column: Event Notes (if exists)
        if (event.notes) {
          const centerX = x + (eventWidth / 3);
          pdf.setFont('times', 'bold');
          pdf.setFontSize(6);
          pdf.text('Event Notes', centerX, y + 12);
          
          // Notes content
          pdf.setFont('times', 'normal');
          pdf.setFontSize(5);
          const notes = event.notes.split('\n').filter(n => n.trim());
          notes.forEach((note, index) => {
            pdf.text(`• ${note.trim()}`, centerX, y + 20 + (index * 8));
          });
        }
        
        // Right column: Action Items (if exists)
        if (event.actionItems) {
          const rightX = x + (eventWidth * 2 / 3);
          pdf.setFont('times', 'bold');
          pdf.setFontSize(6);
          pdf.text('Action Items', rightX, y + 12);
          
          // Action items content
          pdf.setFont('times', 'normal');
          pdf.setFontSize(5);
          const items = event.actionItems.split('\n').filter(i => i.trim());
          items.forEach((item, index) => {
            pdf.text(`• ${item.trim()}`, rightX, y + 20 + (index * 8));
          });
        }
      }
    });
  });
  
  // Save PDF
  const filename = `daily-planner-${selectedDate.toISOString().split('T')[0]}.pdf`;
  pdf.save(filename);
  
  console.log(`Dashboard-exact daily PDF exported: ${filename}`);
};