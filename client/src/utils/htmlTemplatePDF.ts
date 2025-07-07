import jsPDF from 'jspdf';
import { CalendarEvent } from '../types/calendar';

// HTML Template Configuration - Full landscape weekly view
const HTML_TEMPLATE_CONFIG = {
  // Page dimensions - A3 landscape for full weekly view (16.5in x 11.7in)
  pageWidth: 1190,  // A3 landscape width in points
  pageHeight: 842,  // A3 landscape height in points
  
  // Grid configuration for full week display
  timeColumnWidth: 60,
  dayColumnWidth: 161, // (1190 - 60) / 7 = ~161 points per day
  
  // Header sections - more compact for full view
  headerHeight: 45,
  statsHeight: 35,
  legendHeight: 25,
  
  // Grid positioning
  gridStartY: 105, // After header, stats, and legend (more compact)
  timeSlotHeight: 18, // Height for each 30-minute slot (reduced for compactness)
  
  // Colors matching HTML template
  colors: {
    black: { r: 0, g: 0, b: 0 },
    lightGrey: { r: 248, g: 248, b: 248 },
    darkGrey: { r: 238, g: 238, b: 238 },
    borderGrey: { r: 204, g: 204, b: 204 },
    simplePracticeBlue: { r: 66, g: 133, b: 244 },
    googleGreen: { r: 52, g: 168, b: 83 }
  }
};

// Time slots from 06:00 to 23:30 (matches HTML template)
const TIME_SLOTS = [
  '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30',
  '22:00', '22:30', '23:00', '23:30'
];

export const exportHTMLTemplatePDF = async (
  weekStartDate: Date,
  weekEndDate: Date,
  events: CalendarEvent[]
): Promise<void> => {
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: [HTML_TEMPLATE_CONFIG.pageWidth, HTML_TEMPLATE_CONFIG.pageHeight]
  });

  // Set default font - use helvetica instead of arial for better compatibility
  pdf.setFont('helvetica', 'normal');

  // === HEADER SECTION ===
  drawHeader(pdf, weekStartDate, weekEndDate);
  
  // === STATS SECTION ===
  drawStats(pdf, events);
  
  // === LEGEND SECTION ===
  drawLegend(pdf);
  
  // === CALENDAR GRID ===
  drawCalendarGrid(pdf, weekStartDate, events);

  // Save the PDF
  const filename = `weekly-planner-${weekStartDate.getFullYear()}-${String(weekStartDate.getMonth() + 1).padStart(2, '0')}-${String(weekStartDate.getDate()).padStart(2, '0')}.pdf`;
  pdf.save(filename);
  
  console.log(`HTML Template PDF exported: ${filename}`);
};

function drawHeader(pdf: jsPDF, weekStartDate: Date, weekEndDate: Date): void {
  // Main border
  pdf.setLineWidth(3);
  pdf.setDrawColor(0, 0, 0);
  pdf.rect(0, 0, HTML_TEMPLATE_CONFIG.pageWidth, HTML_TEMPLATE_CONFIG.pageHeight);
  
  // Header background
  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, HTML_TEMPLATE_CONFIG.pageWidth, HTML_TEMPLATE_CONFIG.headerHeight, 'F');
  
  // Header border
  pdf.setLineWidth(3);
  pdf.line(0, HTML_TEMPLATE_CONFIG.headerHeight, HTML_TEMPLATE_CONFIG.pageWidth, HTML_TEMPLATE_CONFIG.headerHeight);
  
  // Title
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0, 0, 0);
  pdf.text('WEEKLY PLANNER', HTML_TEMPLATE_CONFIG.pageWidth / 2, 20, { align: 'center' });
  
  // Week information
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  const weekText = `${weekStartDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - ${weekEndDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
  pdf.text(weekText, HTML_TEMPLATE_CONFIG.pageWidth / 2, 40, { align: 'center' });
}

function drawStats(pdf: jsPDF, events: CalendarEvent[]): void {
  const statsY = HTML_TEMPLATE_CONFIG.headerHeight;
  
  // Stats background
  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, statsY, HTML_TEMPLATE_CONFIG.pageWidth, HTML_TEMPLATE_CONFIG.statsHeight, 'F');
  
  // Stats border
  pdf.setLineWidth(3);
  pdf.line(0, statsY + HTML_TEMPLATE_CONFIG.statsHeight, HTML_TEMPLATE_CONFIG.pageWidth, statsY + HTML_TEMPLATE_CONFIG.statsHeight);
  
  // Calculate stats
  const totalEvents = events.length;
  const simplePracticeEvents = events.filter(e => e.title.includes('Appointment')).length;
  const googleEvents = events.filter(e => !e.title.includes('Appointment')).length;
  const totalHours = Math.round(events.reduce((sum, e) => {
    const duration = (e.endTime.getTime() - e.startTime.getTime()) / (1000 * 60 * 60);
    return sum + duration;
  }, 0));
  
  // Draw 4 stat cards
  const cardWidth = HTML_TEMPLATE_CONFIG.pageWidth / 4;
  const stats = [
    { label: 'Total Events', value: totalEvents.toString() },
    { label: 'SimplePractice', value: simplePracticeEvents.toString() },
    { label: 'Google Calendar', value: googleEvents.toString() },
    { label: 'Total Hours', value: totalHours.toString() }
  ];
  
  stats.forEach((stat, index) => {
    const x = index * cardWidth;
    
    // Card border
    if (index < 3) {
      pdf.setLineWidth(2);
      pdf.line(x + cardWidth, statsY, x + cardWidth, statsY + HTML_TEMPLATE_CONFIG.statsHeight);
    }
    
    // Stat number
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text(stat.value, x + cardWidth / 2, statsY + 16, { align: 'center' });
    
    // Stat label
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(stat.label, x + cardWidth / 2, statsY + 30, { align: 'center' });
  });
}

function drawLegend(pdf: jsPDF): void {
  const legendY = HTML_TEMPLATE_CONFIG.headerHeight + HTML_TEMPLATE_CONFIG.statsHeight;
  
  // Legend background
  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, legendY, HTML_TEMPLATE_CONFIG.pageWidth, HTML_TEMPLATE_CONFIG.legendHeight, 'F');
  
  // Legend border
  pdf.setLineWidth(3);
  pdf.line(0, legendY + HTML_TEMPLATE_CONFIG.legendHeight, HTML_TEMPLATE_CONFIG.pageWidth, legendY + HTML_TEMPLATE_CONFIG.legendHeight);
  
  // Legend items
  const legendItems = [
    { label: 'SimplePractice', color: { r: 66, g: 133, b: 244 }, style: 'solid' },
    { label: 'Google Calendar', color: { r: 52, g: 168, b: 83 }, style: 'dashed' },
    { label: 'US Holidays', color: { r: 251, g: 188, b: 4 }, style: 'solid' }
  ];
  
  let x = 20;
  legendItems.forEach(item => {
    // Legend symbol
    pdf.setFillColor(255, 255, 255);
    pdf.rect(x, legendY + 12, 16, 12, 'F');
    
    if (item.style === 'dashed') {
      pdf.setDrawColor(item.color.r, item.color.g, item.color.b);
      pdf.setLineWidth(2);
      pdf.setLineDashPattern([3, 3], 0);
      pdf.rect(x, legendY + 12, 16, 12);
      pdf.setLineDashPattern([], 0);
    } else {
      pdf.setDrawColor(204, 204, 204);
      pdf.setLineWidth(2);
      pdf.rect(x, legendY + 12, 16, 12);
      if (item.label === 'SimplePractice') {
        pdf.setDrawColor(item.color.r, item.color.g, item.color.b);
        pdf.setLineWidth(6);
        pdf.line(x, legendY + 12, x, legendY + 24);
      } else if (item.label === 'US Holidays') {
        pdf.setFillColor(item.color.r, item.color.g, item.color.b);
        pdf.rect(x, legendY + 12, 16, 12, 'F');
      }
    }
    
    // Legend text
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);
    pdf.text(item.label, x + 22, legendY + 18);
    
    x += 120;
  });
}

function drawCalendarGrid(pdf: jsPDF, weekStartDate: Date, events: CalendarEvent[]): void {
  const gridY = HTML_TEMPLATE_CONFIG.gridStartY;
  
  // === TIME COLUMN HEADER ===
  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, gridY, HTML_TEMPLATE_CONFIG.timeColumnWidth, 30, 'F');
  
  pdf.setLineWidth(2);
  pdf.setDrawColor(0, 0, 0);
  pdf.rect(0, gridY, HTML_TEMPLATE_CONFIG.timeColumnWidth, 30);
  
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('TIME', HTML_TEMPLATE_CONFIG.timeColumnWidth / 2, gridY + 18, { align: 'center' });
  
  // === DAY HEADERS ===
  const dayNames = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(weekStartDate);
    dayDate.setDate(weekStartDate.getDate() + i);
    
    const x = HTML_TEMPLATE_CONFIG.timeColumnWidth + (i * HTML_TEMPLATE_CONFIG.dayColumnWidth);
    
    // Day header background
    pdf.setFillColor(255, 255, 255);
    pdf.rect(x, gridY, HTML_TEMPLATE_CONFIG.dayColumnWidth, 30, 'F');
    
    // Day header borders - strong vertical lines
    pdf.setLineWidth(2);
    pdf.setDrawColor(0, 0, 0);
    pdf.rect(x, gridY, HTML_TEMPLATE_CONFIG.dayColumnWidth, 30);
    
    // Extra strong vertical borders between day columns
    pdf.setLineWidth(3);
    pdf.line(x, gridY, x, gridY + 30);
    if (i === 6) {
      pdf.line(x + HTML_TEMPLATE_CONFIG.dayColumnWidth, gridY, x + HTML_TEMPLATE_CONFIG.dayColumnWidth, gridY + 30);
    }
    
    // Day name
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text(dayNames[i], x + HTML_TEMPLATE_CONFIG.dayColumnWidth / 2, gridY + 12, { align: 'center' });
    
    // Day date
    pdf.setFontSize(14);
    pdf.text(dayDate.getDate().toString(), x + HTML_TEMPLATE_CONFIG.dayColumnWidth / 2, gridY + 25, { align: 'center' });
  }
  
  // === TIME SLOTS AND CELLS ===
  TIME_SLOTS.forEach((timeSlot, index) => {
    const isHour = timeSlot.endsWith(':00');
    const y = gridY + 30 + (index * HTML_TEMPLATE_CONFIG.timeSlotHeight);
    
    // Time slot with darker backgrounds for better readability
    if (isHour) {
      pdf.setFillColor(220, 220, 220); // Darker for hour slots
    } else {
      pdf.setFillColor(240, 240, 240); // Slightly darker for half-hour slots
    }
    pdf.rect(0, y, HTML_TEMPLATE_CONFIG.timeColumnWidth, HTML_TEMPLATE_CONFIG.timeSlotHeight, 'F');
    
    pdf.setLineWidth(isHour ? 2 : 1);
    pdf.setDrawColor(0, 0, 0);
    pdf.rect(0, y, HTML_TEMPLATE_CONFIG.timeColumnWidth, HTML_TEMPLATE_CONFIG.timeSlotHeight);
    
    pdf.setFontSize(isHour ? 9 : 8);
    pdf.setFont('helvetica', 'bold');
    pdf.text(timeSlot, HTML_TEMPLATE_CONFIG.timeColumnWidth / 2, y + HTML_TEMPLATE_CONFIG.timeSlotHeight / 2 + 3, { align: 'center' });
    
    // Calendar cells for each day
    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      const x = HTML_TEMPLATE_CONFIG.timeColumnWidth + (dayIndex * HTML_TEMPLATE_CONFIG.dayColumnWidth);
      
      // Cell background
      pdf.setFillColor(255, 255, 255);
      pdf.rect(x, y, HTML_TEMPLATE_CONFIG.dayColumnWidth, HTML_TEMPLATE_CONFIG.timeSlotHeight, 'F');
      
      // Cell horizontal border
      pdf.setLineWidth(isHour ? 2 : 1);
      if (isHour) {
        pdf.setDrawColor(0, 0, 0);
      } else {
        pdf.setDrawColor(204, 204, 204);
      }
      pdf.line(x, y, x + HTML_TEMPLATE_CONFIG.dayColumnWidth, y);
      pdf.line(x, y + HTML_TEMPLATE_CONFIG.timeSlotHeight, x + HTML_TEMPLATE_CONFIG.dayColumnWidth, y + HTML_TEMPLATE_CONFIG.timeSlotHeight);
      
      // Strong vertical borders between days
      pdf.setLineWidth(2);
      pdf.setDrawColor(0, 0, 0);
      pdf.line(x, y, x, y + HTML_TEMPLATE_CONFIG.timeSlotHeight);
      
      // Right border for last column
      if (dayIndex === 6) {
        pdf.line(x + HTML_TEMPLATE_CONFIG.dayColumnWidth, y, x + HTML_TEMPLATE_CONFIG.dayColumnWidth, y + HTML_TEMPLATE_CONFIG.timeSlotHeight);
      }
    }
  });
  
  // === VERTICAL GRID LINES ===
  // Draw strong vertical lines through entire grid
  for (let i = 0; i <= 7; i++) {
    const x = HTML_TEMPLATE_CONFIG.timeColumnWidth + (i * HTML_TEMPLATE_CONFIG.dayColumnWidth);
    pdf.setLineWidth(3);
    pdf.setDrawColor(0, 0, 0);
    pdf.line(x, gridY, x, gridY + 30 + (TIME_SLOTS.length * HTML_TEMPLATE_CONFIG.timeSlotHeight));
  }
  
  // === APPOINTMENTS ===
  drawAppointments(pdf, weekStartDate, events, gridY);
}

function drawAppointments(pdf: jsPDF, weekStartDate: Date, events: CalendarEvent[], gridY: number): void {
  events.forEach(event => {
    const eventDate = new Date(event.startTime);
    const dayIndex = Math.floor((eventDate.getTime() - weekStartDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (dayIndex < 0 || dayIndex >= 7) return;
    
    const startHour = eventDate.getHours();
    const startMinute = eventDate.getMinutes();
    const timeSlot = `${String(startHour).padStart(2, '0')}:${String(startMinute).padStart(2, '0')}`;
    const slotIndex = TIME_SLOTS.indexOf(timeSlot);
    
    if (slotIndex === -1) return;
    
    const duration = (event.endTime.getTime() - event.startTime.getTime()) / (1000 * 60);
    const heightInSlots = Math.max(1, Math.round(duration / 30));
    
    const x = HTML_TEMPLATE_CONFIG.timeColumnWidth + (dayIndex * HTML_TEMPLATE_CONFIG.dayColumnWidth) + 2;
    const y = gridY + 30 + (slotIndex * HTML_TEMPLATE_CONFIG.timeSlotHeight) + 2;
    const width = HTML_TEMPLATE_CONFIG.dayColumnWidth - 4;
    const height = (heightInSlots * HTML_TEMPLATE_CONFIG.timeSlotHeight) - 4;
    
    // Appointment background
    pdf.setFillColor(255, 255, 255);
    pdf.rect(x, y, width, height, 'F');
    
    // Appointment border
    const isSimplePractice = event.title.includes('Appointment');
    if (isSimplePractice) {
      pdf.setDrawColor(204, 204, 204);
      pdf.setLineWidth(2);
      pdf.rect(x, y, width, height);
      
      // Left blue border
      pdf.setDrawColor(66, 133, 244);
      pdf.setLineWidth(6);
      pdf.line(x, y, x, y + height);
    } else {
      pdf.setDrawColor(52, 168, 83);
      pdf.setLineWidth(2);
      pdf.setLineDashPattern([3, 3], 0);
      pdf.rect(x, y, width, height);
      pdf.setLineDashPattern([], 0);
    }
    
    // Appointment text
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    
    const appointmentName = event.title.replace(' Appointment', '').toUpperCase();
    const lines = pdf.splitTextToSize(appointmentName, width - 6);
    
    let textY = y + 10;
    lines.forEach((line: string) => {
      if (textY < y + height - 6) {
        pdf.text(line, x + 3, textY);
        textY += 8;
      }
    });
  });
}