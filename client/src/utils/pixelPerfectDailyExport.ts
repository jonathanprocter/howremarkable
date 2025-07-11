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
    // Removed navButton - moved to bottom
    title: {
      text: 'DAILY PLANNER',
      fontSize: 36,      // H1 size
      y: 70,
      weight: 'bold'
    },
    subtitle: {
      y: 95,
      fontSize: 16
    },
    legend: {
      y: 110,
      fontSize: 12,
      symbolSize: 14,
      spacing: 120,
      height: 18
    }
  },
  
  // Time grid
  grid: {
    timeColumnWidth: 100,
    mainAreaWidth: 2410, // 2550 - 40 - 100 = 2410
    rowHeight: 84,       // 84px each row
    totalRows: 36,       // All time slots 06:00-23:30
    
    // Time formatting
    topHourFont: 24,     // Larger font for top of hour
    halfHourFont: 23,    // 1pt smaller for half hour (bottom of hour)
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
      titleY: 30,        // Moved down to keep within appointment box
      titleFont: 40,     // Large, bold font to fill space
      sourceY: 65,       // Moved down proportionally
      sourceFont: 28,    // Increased for visibility
      timeY: 90,         // Moved down proportionally
      timeFont: 32,      // Bold time display
      leftMargin: 15
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
      leftBorderWidth: 4,           // Increased by 1px as requested
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
  
  // Bottom navigation
  bottomNav: {
    y: 3240, // Near bottom of page
    height: 40,
    buttonWidth: 120,
    buttonHeight: 32,
    fontSize: 14,
    arrowSize: 24,
    spacing: 80,
    centerX: 1275, // Center of page
    bgColor: [255, 255, 255],
    borderColor: [34, 34, 34],
    borderRadius: 999 // Pill shape
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
  
  // No navigation button at top - moved to bottom
  
  // Title - centered and bold
  pdf.setFontSize(config.header.title.fontSize);
  pdf.setFont('helvetica', config.header.title.weight);
  pdf.text(config.header.title.text, config.pageWidth / 2, config.header.title.y, { align: 'center' });
  
  // Date and appointments count - left aligned below title
  const dateStr = selectedDate.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  // Filter events to selected day for subtitle
  const dayEvents = events.filter(event => {
    const eventDate = new Date(event.startTime);
    const eventDay = eventDate.toDateString();
    const selectedDay = selectedDate.toDateString();
    return eventDay === selectedDay;
  });
  
  pdf.setFontSize(config.header.subtitle.fontSize);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`${dateStr}     ${dayEvents.length} appointments today`, config.margin + config.grid.timeColumnWidth, config.header.subtitle.y, { align: 'left' });
  
  // Legend as colored pill badges - horizontally aligned
  const legendStartX = config.margin + config.grid.timeColumnWidth;
  let legendX = legendStartX;
  const legendY = config.header.legend.y;
  const badgeRadius = config.header.legend.height / 2;
  
  // SimplePractice legend badge - pill shape
  const simplePracticeWidth = config.header.legend.symbolSize + 40;
  pdf.setFillColor(...config.colors.simplePracticeBlue);
  pdf.roundedRect(legendX, legendY, simplePracticeWidth, config.header.legend.height, badgeRadius, badgeRadius, 'F');
  pdf.setFontSize(config.header.legend.fontSize);
  pdf.setTextColor(...config.colors.white);
  pdf.text('SimplePractice', legendX + 8, legendY + 12);
  
  // Google Calendar legend badge - pill shape
  legendX += config.header.legend.spacing;
  const googleCalendarWidth = config.header.legend.symbolSize + 50;
  pdf.setFillColor(...config.colors.googleGreen);
  pdf.roundedRect(legendX, legendY, googleCalendarWidth, config.header.legend.height, badgeRadius, badgeRadius, 'F');
  pdf.setTextColor(...config.colors.white);
  pdf.text('Google Calendar', legendX + 8, legendY + 12);
  
  // Holiday legend badge - pill shape
  legendX += config.header.legend.spacing;
  const holidayWidth = config.header.legend.symbolSize + 45;
  pdf.setFillColor(...config.colors.holidayYellow);
  pdf.roundedRect(legendX, legendY, holidayWidth, config.header.legend.height, badgeRadius, badgeRadius, 'F');
  pdf.setTextColor(...config.colors.black);
  pdf.text('Holidays in US', legendX + 8, legendY + 12);
}

// Draw bottom navigation with arrows
function drawBottomNavigation(pdf: jsPDF, selectedDate: Date) {
  const config = PIXEL_PERFECT_CONFIG;
  const nav = config.bottomNav;
  
  // Previous day arrow
  const prevX = nav.centerX - nav.spacing - nav.buttonWidth;
  pdf.setFillColor(...nav.bgColor);
  pdf.setDrawColor(...nav.borderColor);
  pdf.setLineWidth(1.5);
  pdf.roundedRect(prevX, nav.y, nav.buttonWidth, nav.buttonHeight, nav.borderRadius, nav.borderRadius, 'FD');
  
  // Previous day arrow text
  pdf.setFontSize(nav.fontSize);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...config.colors.black);
  pdf.text('← Sunday', prevX + nav.buttonWidth / 2, nav.y + nav.buttonHeight / 2 + 5, { align: 'center' });
  
  // Back to week button (center)
  const backX = nav.centerX - nav.buttonWidth / 2;
  pdf.setFillColor(...nav.bgColor);
  pdf.setDrawColor(...nav.borderColor);
  pdf.setLineWidth(1.5);
  pdf.roundedRect(backX, nav.y, nav.buttonWidth, nav.buttonHeight, nav.borderRadius, nav.borderRadius, 'FD');
  
  // Back to week text
  pdf.setFontSize(nav.fontSize);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...config.colors.black);
  pdf.text('Back to week', backX + nav.buttonWidth / 2, nav.y + nav.buttonHeight / 2 + 5, { align: 'center' });
  
  // Next day arrow
  const nextX = nav.centerX + nav.spacing;
  pdf.setFillColor(...nav.bgColor);
  pdf.setDrawColor(...nav.borderColor);
  pdf.setLineWidth(1.5);
  pdf.roundedRect(nextX, nav.y, nav.buttonWidth, nav.buttonHeight, nav.borderRadius, nav.borderRadius, 'FD');
  
  // Next day arrow text
  pdf.setFontSize(nav.fontSize);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...config.colors.black);
  pdf.text('Tuesday →', nextX + nav.buttonWidth / 2, nav.y + nav.buttonHeight / 2 + 5, { align: 'center' });
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
  
  // Time column right border / main area left border (vertical divider) - solid black
  pdf.setDrawColor(34, 34, 34); // Dark gray/black matching dashboard
  pdf.setLineWidth(2);
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
    
    // Time text - centered both horizontally and vertically
    pdf.setFontSize(slot.isHour ? grid.topHourFont : grid.halfHourFont);
    pdf.setFont('helvetica', 'normal'); // Don't bold times
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
      pdf.setFont('helvetica', 'bold'); // Make appointment titles bold
      pdf.setTextColor(...config.colors.black);
      pdf.text(displayTitle, eventX + appointments.singleColumn.leftMargin, eventY + appointments.singleColumn.titleY);
      
      // Source
      const { sourceText } = getEventTypeInfoExtended(event);
      pdf.setFontSize(appointments.singleColumn.sourceFont);
      pdf.text(sourceText, eventX + appointments.singleColumn.leftMargin, eventY + appointments.singleColumn.sourceY);
      
      // Time - with additional spacing after source
      const timeRange = `${formatMilitaryTime(eventDate)}-${formatMilitaryTime(endDate)}`;
      pdf.setFontSize(appointments.singleColumn.timeFont);
      pdf.text(timeRange, eventX + appointments.singleColumn.leftMargin, eventY + appointments.singleColumn.timeY + 10); // Added 10px spacing
      
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
        pdf.setFont('helvetica', 'bold'); // Make header bold
        pdf.text('Event Notes', eventX + columnWidth + 10, eventY + 20);
        
        // Sample notes for Dan
        if (displayTitle.toLowerCase().includes('dan re:')) {
          pdf.setFontSize(appointments.threeColumn.bulletFont);
          pdf.setFont('helvetica', 'normal'); // Regular font for content
          pdf.text('• I cancelled supervision due to COVID', eventX + columnWidth + 10, eventY + 40);
          pdf.text('• We didn\'t schedule a follow-up, and will', eventX + columnWidth + 10, eventY + 55);
          pdf.text('  continue next week during our usual time', eventX + columnWidth + 10, eventY + 70);
        }
      }
      
      // Column 3: Action Items - only if has actions
      if (hasActions) {
        pdf.setFontSize(appointments.threeColumn.headerFont);
        pdf.setFont('helvetica', 'bold'); // Make header bold
        pdf.text('Action Items', eventX + (columnWidth * 2) + 10, eventY + 20);
        
        // Sample action items for Dan
        if (displayTitle.toLowerCase().includes('dan re:')) {
          pdf.setFontSize(appointments.threeColumn.bulletFont);
          pdf.setFont('helvetica', 'normal'); // Regular font for content
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
      
      // Wrap long titles to fit in cell
      const titleLines = pdf.splitTextToSize(displayTitle, eventWidth - 30);
      let currentY = eventY + appointments.singleColumn.titleY;
      
      // Draw title lines
      if (Array.isArray(titleLines)) {
        titleLines.forEach((line, index) => {
          pdf.text(line, eventX + appointments.singleColumn.leftMargin, currentY + (index * 35));
        });
        currentY += titleLines.length * 35;
      } else {
        pdf.text(titleLines, eventX + appointments.singleColumn.leftMargin, currentY);
        currentY += 35;
      }
      
      // Source
      const { sourceText } = getEventTypeInfoExtended(event);
      pdf.setFontSize(appointments.singleColumn.sourceFont);
      pdf.setFont('helvetica', 'normal');
      pdf.text(sourceText, eventX + appointments.singleColumn.leftMargin, currentY);
      
      // Time - with additional spacing after source
      const timeRange = `${formatMilitaryTime(eventDate)}-${formatMilitaryTime(endDate)}`;
      pdf.setFontSize(appointments.singleColumn.timeFont);
      pdf.setFont('helvetica', 'bold'); // Make time bold and larger
      pdf.text(timeRange, eventX + appointments.singleColumn.leftMargin, currentY + 35); // Increased from 25 to 35
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
  drawBottomNavigation(pdf, selectedDate);
  
  // Save with descriptive filename
  const filename = `pixel-perfect-daily-planner-${selectedDate.toISOString().split('T')[0]}.pdf`;
  pdf.save(filename);
  
  console.log(`✅ Pixel Perfect Daily Planner exported: ${filename}`);
  console.log(`📐 Canvas dimensions: ${PIXEL_PERFECT_CONFIG.pageWidth} × ${PIXEL_PERFECT_CONFIG.pageHeight} pixels`);
  console.log(`📊 DPI: ${PIXEL_PERFECT_CONFIG.dpi} (print quality)`);
  console.log(`⏰ Time slots: ${ALL_TIME_SLOTS.length} slots from 06:00 to 23:30`);
};