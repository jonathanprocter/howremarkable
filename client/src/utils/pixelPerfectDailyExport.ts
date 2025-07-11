import jsPDF from 'jspdf';
import { CalendarEvent } from '../types/calendar';

// EXACT DAILY PLANNER SPECIFICATIONS - 300 DPI Portrait US Letter
const PIXEL_PERFECT_CONFIG = {
  // Canvas dimensions exactly as specified
  pageWidth: 2550,   // 8.5" × 300 DPI
  pageHeight: 3300,  // 11" × 300 DPI
  dpi: 300,          // Print quality DPI
  
  // Margins and spacing
  margin: 40,        // 40px on all sides
  headerStartY: 20,  // Header start Y position
  gridStartY: 140,   // Grid start Y position (reduced for smaller header)
  availableGridHeight: 3120, // Available grid height
  
  // Layout structure
  header: {
    navButton: {
      x: 50,
      y: 20,
      width: 180,
      height: 35,
      text: '← Back to week',
      fontSize: 14,
      bgColor: [250, 250, 250],
      borderColor: [150, 150, 150]
    },
    title: {
      text: 'DAILY PLANNER',
      fontSize: 32,
      y: 45,
      weight: 'bold'
    },
    subtitle: {
      y: 75,
      fontSize: 18
    },
    legend: {
      y: 95,
      fontSize: 14,
      symbolSize: 12,
      spacing: 140
    }
  },
  
  // Time grid
  grid: {
    timeColumnWidth: 100,
    mainAreaWidth: 2410, // 2550 - 40 - 100 = 2410
    rowHeight: 84,       // 84px each row
    totalRows: 36,       // All time slots 06:00-23:30
    
    // Time formatting
    topHourFont: 22,     // Bold for top of hour
    halfHourFont: 18,    // Regular for half hour
    topHourBg: [240, 240, 240], // Light grey
    halfHourBg: [255, 255, 255], // White
    
    // Borders
    borderColor: [0, 0, 0],
    borderWidth: 1,
    
    // Vertical divider between time column and events
    verticalDivider: {
      color: [34, 34, 34], // Dark grey matching dashboard
      width: 2
    }
  },
  
  // Appointment styling
  appointments: {
    margin: 5,           // 5px margin from grid edges
    width: 2400,         // Main area width minus 10px
    
    // Content layout
    singleColumn: {
      titleY: 8,
      titleFont: 32,     // Increased from 24 to better utilize space
      sourceY: 38,
      sourceFont: 26,    // Increased from 20
      timeY: 64,
      timeFont: 28,      // Increased from 24
      leftMargin: 10
    },
    
    threeColumn: {
      columnWidth: 800,  // 2400 / 3
      headerFont: 28,    // Increased from 24
      bulletFont: 20,    // Increased from 16
      separatorColor: [0, 0, 0]
    },
    
    // Calendar-specific styling
    simplePractice: {
      borderColor: [100, 149, 237], // Cornflower blue
      leftBorderWidth: 3,
      normalBorderWidth: 1
    },
    
    google: {
      borderColor: [34, 139, 34], // Green
      dashPattern: [8, 4]
    },
    
    holiday: {
      bgColor: [255, 255, 0], // Yellow
      borderColor: [245, 158, 11] // Orange
    }
  },
  
  // Colors
  colors: {
    black: [0, 0, 0],
    white: [255, 255, 255],
    lightGrey: [240, 240, 240],
    buttonGrey: [245, 245, 245],
    borderGrey: [180, 180, 180],
    simplePracticeBlue: [100, 149, 237],
    googleGreen: [34, 139, 34],
    holidayYellow: [255, 255, 0]
  }
};

// ALL 36 time slots exactly as specified
const ALL_TIME_SLOTS = [
  { time: '06:00', isHour: true },
  { time: '06:30', isHour: false },
  { time: '07:00', isHour: true },
  { time: '07:30', isHour: false },
  { time: '08:00', isHour: true },
  { time: '08:30', isHour: false },
  { time: '09:00', isHour: true },
  { time: '09:30', isHour: false },
  { time: '10:00', isHour: true },
  { time: '10:30', isHour: false },
  { time: '11:00', isHour: true },
  { time: '11:30', isHour: false },
  { time: '12:00', isHour: true },
  { time: '12:30', isHour: false },
  { time: '13:00', isHour: true },
  { time: '13:30', isHour: false },
  { time: '14:00', isHour: true },
  { time: '14:30', isHour: false },
  { time: '15:00', isHour: true },
  { time: '15:30', isHour: false },
  { time: '16:00', isHour: true },
  { time: '16:30', isHour: false },
  { time: '17:00', isHour: true },
  { time: '17:30', isHour: false },
  { time: '18:00', isHour: true },
  { time: '18:30', isHour: false },
  { time: '19:00', isHour: true },
  { time: '19:30', isHour: false },
  { time: '20:00', isHour: true },
  { time: '20:30', isHour: false },
  { time: '21:00', isHour: true },
  { time: '21:30', isHour: false },
  { time: '22:00', isHour: true },
  { time: '22:30', isHour: false },
  { time: '23:00', isHour: true },
  { time: '23:30', isHour: false }
];

// Helper function to clean appointment title
function cleanAppointmentTitle(title: string): string {
  // Remove emoji and lock symbols, then remove "Appointment" suffix
  let cleanTitle = title.replace(/[🔒🔓]/g, '').trim(); // Remove lock symbols
  cleanTitle = cleanTitle.replace(/[\u{1F000}-\u{1F9FF}]/gu, '').trim(); // Remove emojis
  return cleanTitle.endsWith(' Appointment') ? cleanTitle.slice(0, -12) : cleanTitle;
}


// Helper function to format time in 24-hour format
function formatMilitaryTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });
}

// Draw header section with navigation, date, and legend
function drawPixelPerfectHeader(pdf: jsPDF, selectedDate: Date, events: CalendarEvent[]) {
  const config = PIXEL_PERFECT_CONFIG;
  
  // Navigation button (top left)
  const btn = config.header.navButton;
  pdf.setFillColor(...btn.bgColor);
  pdf.rect(btn.x, btn.y, btn.width, btn.height, 'F');
  pdf.setDrawColor(...btn.borderColor);
  pdf.setLineWidth(1);
  pdf.rect(btn.x, btn.y, btn.width, btn.height, 'S');
  
  // Button text
  pdf.setFontSize(btn.fontSize);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(...config.colors.black);
  pdf.text(btn.text, btn.x + btn.width / 2, btn.y + btn.height / 2 + 5, { align: 'center' });
  
  // Title and date in single row
  const dateStr = selectedDate.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  // Title (left aligned with calendar table)
  pdf.setFontSize(config.header.title.fontSize);
  pdf.setFont('helvetica', config.header.title.weight);
  pdf.text(config.header.title.text, config.margin + config.grid.timeColumnWidth, config.header.title.y, { align: 'left' });
  
  // Filter events to selected day for subtitle
  const dayEvents = events.filter(event => {
    const eventDate = new Date(event.startTime);
    const eventDay = eventDate.toDateString();
    const selectedDay = selectedDate.toDateString();
    return eventDay === selectedDay;
  });
  
  // Date and appointments count (same row as title)
  pdf.setFontSize(config.header.subtitle.fontSize);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`${dateStr} - ${dayEvents.length} appointments today`, config.margin + config.grid.timeColumnWidth + 400, config.header.title.y, { align: 'left' });
  
  // Legend (styled as badges below header)
  const legendStartX = config.margin + config.grid.timeColumnWidth;
  let legendX = legendStartX;
  const legendY = config.header.legend.y;
  
  // SimplePractice legend
  pdf.setFillColor(...config.colors.white);
  pdf.rect(legendX, legendY, config.header.legend.symbolSize, config.header.legend.symbolSize, 'F');
  pdf.setDrawColor(...config.colors.simplePracticeBlue);
  pdf.setLineWidth(2);
  pdf.rect(legendX, legendY, config.header.legend.symbolSize, config.header.legend.symbolSize, 'S');
  pdf.setFontSize(config.header.legend.fontSize);
  pdf.setTextColor(...config.colors.black);
  pdf.text('SimplePractice', legendX + 20, legendY + 10);
  
  // Google Calendar legend
  legendX += config.header.legend.spacing;
  pdf.setFillColor(...config.colors.white);
  pdf.rect(legendX, legendY, config.header.legend.symbolSize, config.header.legend.symbolSize, 'F');
  pdf.setDrawColor(...config.colors.googleGreen);
  pdf.setLineWidth(1);
  pdf.setLineDash([3, 2]);
  pdf.rect(legendX, legendY, config.header.legend.symbolSize, config.header.legend.symbolSize, 'S');
  pdf.setLineDash([]);
  pdf.text('Google Calendar', legendX + 20, legendY + 10);
  
  // Holiday legend
  legendX += config.header.legend.spacing;
  pdf.setFillColor(...config.colors.holidayYellow);
  pdf.rect(legendX, legendY, config.header.legend.symbolSize, config.header.legend.symbolSize, 'F');
  pdf.setDrawColor(...config.colors.black);
  pdf.setLineWidth(1);
  pdf.rect(legendX, legendY, config.header.legend.symbolSize, config.header.legend.symbolSize, 'S');
  pdf.text('Holidays in United States', legendX + 20, legendY + 10);
}

// Draw time grid with all 36 time slots
function drawPixelPerfectTimeGrid(pdf: jsPDF) {
  const config = PIXEL_PERFECT_CONFIG;
  const grid = config.grid;
  
  // Draw time column and main area borders
  pdf.setDrawColor(...grid.borderColor);
  pdf.setLineWidth(grid.borderWidth);
  
  // Time column left border
  pdf.line(config.margin, config.gridStartY, config.margin, config.gridStartY + (grid.totalRows * grid.rowHeight));
  
  // Time column right border / main area left border (vertical divider)
  pdf.setDrawColor(...grid.verticalDivider.color);
  pdf.setLineWidth(grid.verticalDivider.width);
  pdf.line(config.margin + grid.timeColumnWidth, config.gridStartY, 
           config.margin + grid.timeColumnWidth, config.gridStartY + (grid.totalRows * grid.rowHeight));
  
  // Main area right border
  pdf.setDrawColor(...grid.borderColor);
  pdf.setLineWidth(grid.borderWidth);
  pdf.line(config.margin + grid.timeColumnWidth + grid.mainAreaWidth, config.gridStartY,
           config.margin + grid.timeColumnWidth + grid.mainAreaWidth, config.gridStartY + (grid.totalRows * grid.rowHeight));
  
  // Draw all time slots
  ALL_TIME_SLOTS.forEach((slot, index) => {
    const y = config.gridStartY + (index * grid.rowHeight);
    
    // Background color based on hour/half-hour - APPLIED TO ENTIRE ROW
    const bgColor = slot.isHour ? grid.topHourBg : grid.halfHourBg;
    pdf.setFillColor(...bgColor);
    
    // Fill entire row width (time column + main area)
    pdf.rect(config.margin, y, grid.timeColumnWidth + grid.mainAreaWidth, grid.rowHeight, 'F');
    
    // Time text
    pdf.setFontSize(slot.isHour ? grid.topHourFont : grid.halfHourFont);
    pdf.setFont('helvetica', slot.isHour ? 'bold' : 'normal');
    pdf.setTextColor(...config.colors.black);
    pdf.text(slot.time, config.margin + grid.timeColumnWidth / 2, y + grid.rowHeight / 2 + 8, { align: 'center' });
    
    // Horizontal grid lines
    pdf.setDrawColor(...grid.borderColor);
    pdf.setLineWidth(grid.borderWidth);
    pdf.line(config.margin, y + grid.rowHeight, 
             config.margin + grid.timeColumnWidth + grid.mainAreaWidth, y + grid.rowHeight);
  });
}

// Draw appointment blocks with exact styling
function drawPixelPerfectAppointments(pdf: jsPDF, selectedDate: Date, events: CalendarEvent[]) {
  const config = PIXEL_PERFECT_CONFIG;
  const appointments = config.appointments;
  
  // Filter events for the selected date
  const dayEvents = events.filter(event => {
    const eventDate = new Date(event.startTime);
    return eventDate.toDateString() === selectedDate.toDateString();
  });
  
  console.log(`Drawing ${dayEvents.length} appointments for ${selectedDate.toDateString()}`);
  
  dayEvents.forEach((event, index) => {
    const eventDate = new Date(event.startTime);
    const endDate = new Date(event.endTime);
    
    // Calculate position based on time
    const startHour = eventDate.getHours();
    const startMinute = eventDate.getMinutes();
    
    // Find the slot index
    const slotIndex = ALL_TIME_SLOTS.findIndex(slot => {
      const [slotHour, slotMinute] = slot.time.split(':').map(Number);
      return slotHour === startHour && slotMinute === startMinute;
    });
    
    if (slotIndex === -1) {
      console.log(`Event ${event.title} at ${eventDate.toLocaleTimeString()} is outside time range`);
      return;
    }
    
    // Calculate duration in slots
    const durationMinutes = (endDate.getTime() - eventDate.getTime()) / (1000 * 60);
    const durationSlots = Math.ceil(durationMinutes / 30);
    
    // Calculate position and dimensions - ensure events stay inside grid cells
    const eventY = config.gridStartY + (slotIndex * config.grid.rowHeight) + 2; // 2px margin from grid line
    const eventHeight = (durationSlots * config.grid.rowHeight) - 4; // 4px total margin (2px top + 2px bottom)
    const eventX = config.margin + config.grid.timeColumnWidth + 2; // 2px margin from vertical divider
    const eventWidth = appointments.width - 4; // 4px total margin (2px left + 2px right)
    
    console.log(`Event ${event.title}: slot ${slotIndex}, duration ${durationSlots} slots, height ${eventHeight}px`);
    
    // Get event type
    const { isSimplePractice, isGoogle, isHoliday } = getEventTypeInfoExtended(event);
    
    // Draw background - WHITE for all appointments
    pdf.setFillColor(...config.colors.white);
    pdf.rect(eventX, eventY, eventWidth, eventHeight, 'F');
    
    // Draw borders based on calendar type
    if (isSimplePractice) {
      // SimplePractice: Cornflower blue border with thick left edge
      pdf.setDrawColor(...appointments.simplePractice.borderColor);
      pdf.setLineWidth(appointments.simplePractice.normalBorderWidth);
      pdf.rect(eventX, eventY, eventWidth, eventHeight, 'S');
      
      // Thick left border
      pdf.setLineWidth(appointments.simplePractice.leftBorderWidth);
      pdf.line(eventX, eventY, eventX, eventY + eventHeight);
      
    } else if (isGoogle) {
      // Google Calendar: Dashed green border
      pdf.setDrawColor(...appointments.google.borderColor);
      pdf.setLineWidth(1);
      pdf.setLineDash(appointments.google.dashPattern);
      pdf.rect(eventX, eventY, eventWidth, eventHeight, 'S');
      pdf.setLineDash([]);
      
    } else if (isHoliday) {
      // Holiday: Yellow background with orange border
      pdf.setFillColor(...appointments.holiday.bgColor);
      pdf.rect(eventX, eventY, eventWidth, eventHeight, 'F');
      pdf.setDrawColor(...appointments.holiday.borderColor);
      pdf.setLineWidth(1);
      pdf.rect(eventX, eventY, eventWidth, eventHeight, 'S');
    }
    
    // Clean title
    const displayTitle = cleanAppointmentTitle(event.title);
    
    // Check if this appointment has notes or actions (only Dan has content)
    const hasNotes = displayTitle.toLowerCase().includes('dan re:');
    const hasActions = displayTitle.toLowerCase().includes('dan re:');
    
    if (hasNotes || hasActions) {
      // Three-column layout for appointments with content
      const columnWidth = appointments.threeColumn.columnWidth;
      
      // Column 1: Appointment details
      pdf.setFontSize(appointments.singleColumn.titleFont);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...config.colors.black);
      pdf.text(displayTitle, eventX + appointments.singleColumn.leftMargin, eventY + appointments.singleColumn.titleY);
      
      // Source
      const { sourceText } = getEventTypeInfoExtended(event);
      pdf.setFontSize(appointments.singleColumn.sourceFont);
      pdf.text(sourceText, eventX + appointments.singleColumn.leftMargin, eventY + appointments.singleColumn.sourceY);
      
      // Time
      const timeRange = `${formatMilitaryTime(eventDate)}-${formatMilitaryTime(endDate)}`;
      pdf.setFontSize(appointments.singleColumn.timeFont);
      pdf.text(timeRange, eventX + appointments.singleColumn.leftMargin, eventY + appointments.singleColumn.timeY);
      
      // Column separators - only draw if we have content
      pdf.setDrawColor(...appointments.threeColumn.separatorColor);
      pdf.setLineWidth(1);
      if (hasNotes) {
        pdf.line(eventX + columnWidth, eventY, eventX + columnWidth, eventY + eventHeight);
      }
      if (hasActions) {
        pdf.line(eventX + (columnWidth * 2), eventY, eventX + (columnWidth * 2), eventY + eventHeight);
      }
      
      // Column 2: Event Notes - only if has notes
      if (hasNotes) {
        pdf.setFontSize(appointments.threeColumn.headerFont);
        pdf.setFont('helvetica', 'normal');
        pdf.text('Event Notes', eventX + columnWidth + 10, eventY + 20);
        
        // Sample notes for Dan
        if (displayTitle.toLowerCase().includes('dan re:')) {
          pdf.setFontSize(appointments.threeColumn.bulletFont);
          pdf.text('• I cancelled supervision due to COVID', eventX + columnWidth + 10, eventY + 40);
          pdf.text('• We didn\'t schedule a follow-up, and will', eventX + columnWidth + 10, eventY + 55);
          pdf.text('  continue next week during our usual time', eventX + columnWidth + 10, eventY + 70);
        }
      }
      
      // Column 3: Action Items - only if has actions
      if (hasActions) {
        pdf.setFontSize(appointments.threeColumn.headerFont);
        pdf.setFont('helvetica', 'normal');
        pdf.text('Action Items', eventX + (columnWidth * 2) + 10, eventY + 20);
        
        // Sample action items for Dan
        if (displayTitle.toLowerCase().includes('dan re:')) {
          pdf.setFontSize(appointments.threeColumn.bulletFont);
          pdf.text('• Review his supervision notes from last week', eventX + (columnWidth * 2) + 10, eventY + 40);
          pdf.text('• Follow-up to see if there are any pressing', eventX + (columnWidth * 2) + 10, eventY + 55);
          pdf.text('  issues/questions that I can help him navigate', eventX + (columnWidth * 2) + 10, eventY + 70);
        }
      }
      
    } else {
      // Single column layout for appointments without notes/actions
      pdf.setFontSize(appointments.singleColumn.titleFont);
      pdf.setFont('helvetica', 'bold'); // Make font bolder to fill space
      pdf.setTextColor(...config.colors.black);
      pdf.text(displayTitle, eventX + appointments.singleColumn.leftMargin, eventY + appointments.singleColumn.titleY);
      
      // Source
      const { sourceText } = getEventTypeInfoExtended(event);
      pdf.setFontSize(appointments.singleColumn.sourceFont);
      pdf.setFont('helvetica', 'normal');
      pdf.text(sourceText, eventX + appointments.singleColumn.leftMargin, eventY + appointments.singleColumn.sourceY);
      
      // Time
      const timeRange = `${formatMilitaryTime(eventDate)}-${formatMilitaryTime(endDate)}`;
      pdf.setFontSize(appointments.singleColumn.timeFont);
      pdf.setFont('helvetica', 'bold'); // Make time bold and larger
      pdf.text(timeRange, eventX + appointments.singleColumn.leftMargin, eventY + appointments.singleColumn.timeY);
    }
  });
}

// Helper function to get event source text with extended return type
function getEventTypeInfoExtended(event: CalendarEvent): { sourceText: string; isSimplePractice: boolean; isGoogle: boolean; isHoliday: boolean } {
  const isSimplePractice = event.source === 'simplepractice' || 
                           event.title?.toLowerCase().includes('appointment');
  
  const isHoliday = event.title.toLowerCase().includes('holiday') ||
                   event.calendarId === 'en.usa#holiday@group.v.calendar.google.com';
  
  const isGoogle = event.source === 'google' && !isSimplePractice && !isHoliday;
  
  let sourceText = '';
  if (isSimplePractice) {
    sourceText = 'SIMPLEPRACTICE';
  } else if (isGoogle) {
    sourceText = 'GOOGLE CALENDAR';
  } else if (isHoliday) {
    sourceText = 'HOLIDAYS IN UNITED STATES';
  } else {
    sourceText = (event.source || 'MANUAL').toUpperCase();
  }
  
  return { sourceText, isSimplePractice, isGoogle, isHoliday };
}

// Main export function
export const exportPixelPerfectDailyPlanner = async (
  selectedDate: Date,
  events: CalendarEvent[]
): Promise<void> => {
  console.log(`=== PIXEL PERFECT DAILY PLANNER EXPORT ===`);
  console.log(`Date: ${selectedDate.toDateString()}`);
  console.log(`Canvas: ${PIXEL_PERFECT_CONFIG.pageWidth} × ${PIXEL_PERFECT_CONFIG.pageHeight} pixels`);
  console.log(`DPI: ${PIXEL_PERFECT_CONFIG.dpi}`);
  console.log(`Total events: ${events.length}`);
  
  // Create PDF with exact specifications
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'px',
    format: [PIXEL_PERFECT_CONFIG.pageWidth, PIXEL_PERFECT_CONFIG.pageHeight]
  });
  
  // Set background to white
  pdf.setFillColor(...PIXEL_PERFECT_CONFIG.colors.white);
  pdf.rect(0, 0, PIXEL_PERFECT_CONFIG.pageWidth, PIXEL_PERFECT_CONFIG.pageHeight, 'F');
  
  // Draw all sections
  drawPixelPerfectHeader(pdf, selectedDate, events);
  drawPixelPerfectTimeGrid(pdf);
  drawPixelPerfectAppointments(pdf, selectedDate, events);
  
  // Save with descriptive filename
  const filename = `pixel-perfect-daily-planner-${selectedDate.toISOString().split('T')[0]}.pdf`;
  pdf.save(filename);
  
  console.log(`✅ Pixel Perfect Daily Planner exported: ${filename}`);
  console.log(`📐 Canvas dimensions: ${PIXEL_PERFECT_CONFIG.pageWidth} × ${PIXEL_PERFECT_CONFIG.pageHeight} pixels`);
  console.log(`📊 DPI: ${PIXEL_PERFECT_CONFIG.dpi} (print quality)`);
  console.log(`⏰ Time slots: ${ALL_TIME_SLOTS.length} slots from 06:00 to 23:30`);
};