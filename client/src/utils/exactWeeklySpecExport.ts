import jsPDF from 'jspdf';
import { CalendarEvent } from '../types/calendar';

// EXACT WEEKLY PLANNER SPECIFICATIONS IMPLEMENTATION
export const exportExactWeeklySpec = async (
  weekStartDate: Date,
  weekEndDate: Date,
  events: CalendarEvent[]
): Promise<void> => {
  console.log('🎯 Starting EXACT weekly planner export with precise specifications...');
  
  // EXACT CANVAS DIMENSIONS - 3300x2550 pixels at 300 DPI
  // Convert to points for jsPDF: 1 inch = 72 points, 300 DPI = 300 pixels per inch
  // 3300 pixels / 300 DPI = 11 inches = 792 points
  // 2550 pixels / 300 DPI = 8.5 inches = 612 points
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: [792, 612] // 11" x 8.5" in points
  });

  // Scale factor: 792 points / 3300 pixels = 0.24
  const SCALE = 792 / 3300;

  // EXACT SPECIFICATIONS matching Python implementation
  const SPEC = {
    // Canvas
    TOTAL_WIDTH: 3300,
    TOTAL_HEIGHT: 2550,
    DPI: 300,
    
    // Margins
    MARGIN: 30,
    
    // Header (matching Python: header_height = 120, line_spacing = 20, table_start_y = header_height + line_spacing + 30)
    HEADER_HEIGHT: 120,
    HEADER_LINE_SPACING: 20,
    HEADER_FONT_SIZE: 60,
    TABLE_START_Y: 170, // 120 + 20 + 30
    
    // Table calculations (matching Python)
    AVAILABLE_HEIGHT: 2350, // height - table_start_y - margin = 2550 - 170 - 30
    TOTAL_ROWS: 37, // 1 header + 36 time slots
    ROW_HEIGHT: 63, // available_height // total_rows = 2350 // 37
    
    // Column calculations (matching Python)
    TIME_COL_WIDTH: 180,
    AVAILABLE_WIDTH: 3240, // width - (2 * margin) - time_col_width = 3300 - 60 - 180
    DAY_COL_WIDTH: 462, // available_width // 7 = 3240 // 7
    
    // Colors
    BLACK: [0, 0, 0],
    WHITE: [255, 255, 255],
    GREY_BG: [220, 220, 220],
    
    // Font sizes (matching Python)
    TOP_HOUR_FONT: 28,
    HALF_HOUR_FONT: 24,
    HEADER_FONT: 60,
    
    // Borders
    HEADER_BORDER: 2,
    CELL_BORDER: 1
  };

  // Filter events for this week
  const weekEvents = events.filter(event => {
    const eventDate = new Date(event.startTime);
    return eventDate >= weekStartDate && eventDate <= weekEndDate;
  });

  // Set white background
  pdf.setFillColor(...SPEC.WHITE);
  pdf.rect(0, 0, 792, 612, 'F');

  // Draw all components
  drawExactHeader(pdf, weekStartDate, weekEndDate, SPEC, SCALE);
  drawExactTable(pdf, weekStartDate, weekEvents, SPEC, SCALE);
  
  // Save with exact filename
  const filename = `exact-weekly-planner-${weekStartDate.toISOString().split('T')[0]}.pdf`;
  pdf.save(filename);
  
  console.log(`✅ EXACT weekly planner exported: ${filename}`);
};

function drawExactHeader(pdf: jsPDF, weekStartDate: Date, weekEndDate: Date, SPEC: any, SCALE: number): void {
  // Header font setup (matching Python: font_header_large 60pt)
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(SPEC.HEADER_FONT * SCALE);
  pdf.setTextColor(...SPEC.BLACK);
  
  // "WEEKLY PLANNER" moved down to be centered in header space
  pdf.text('WEEKLY PLANNER', SPEC.TOTAL_WIDTH * SCALE / 2, 70 * SCALE, { align: 'center' });
  
  // Week info positioned flush with left side of Time column with smaller font
  const weekStart = weekStartDate.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
  const weekEnd = weekEndDate.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
  const weekNumber = Math.ceil(((weekStartDate.getTime() - new Date(weekStartDate.getFullYear(), 0, 1).getTime()) / 86400000 + 1) / 7);
  const weekText = `WEEK ${weekNumber} -- ${weekStart} - ${weekEnd}`;
  
  // Set smaller font size for week info
  pdf.setFontSize((SPEC.HEADER_FONT - 10) * SCALE);
  // Position flush with left side of Time column
  pdf.text(weekText, SPEC.MARGIN * SCALE, 90 * SCALE);
  
  // Header line (matching Python: margin to width - margin at header_height + line_spacing)
  pdf.setLineWidth(SPEC.HEADER_BORDER * SCALE);
  pdf.setDrawColor(...SPEC.BLACK);
  pdf.line(
    SPEC.MARGIN * SCALE,
    (SPEC.HEADER_HEIGHT + SPEC.HEADER_LINE_SPACING) * SCALE,
    (SPEC.TOTAL_WIDTH - SPEC.MARGIN) * SCALE,
    (SPEC.HEADER_HEIGHT + SPEC.HEADER_LINE_SPACING) * SCALE
  );
}

function drawExactTable(pdf: jsPDF, weekStartDate: Date, events: CalendarEvent[], SPEC: any, SCALE: number): void {
  // Column positions - flush to left margin to prevent Sunday cutoff
  const columnPositions = [];
  let currentX = SPEC.MARGIN;
  
  // Time column
  columnPositions.push({ start: currentX, end: currentX + SPEC.TIME_COL_WIDTH });
  currentX += SPEC.TIME_COL_WIDTH;
  
  // Calculate adjusted day column width to fit all days within page
  const availableWidth = SPEC.TOTAL_WIDTH - SPEC.MARGIN * 2 - SPEC.TIME_COL_WIDTH;
  const adjustedDayWidth = availableWidth / 7;
  
  // Day columns with adjusted width
  for (let i = 0; i < 7; i++) {
    columnPositions.push({ start: currentX, end: currentX + adjustedDayWidth });
    currentX += adjustedDayWidth;
  }

  // Day headers with full day names and dates
  const dayHeaders = ['Time'];
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  // Generate full day headers with dates
  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(weekStartDate);
    dayDate.setDate(weekStartDate.getDate() + i);
    const formattedDate = `${dayDate.getMonth() + 1}-${dayDate.getDate()}-${dayDate.getFullYear()}`;
    dayHeaders.push(`${dayNames[i]} ${formattedDate}`);
  }
  
  // Draw header row (matching Python logic exactly)
  let currentY = SPEC.TABLE_START_Y * SCALE;
  
  // Draw header row cells
  for (let col = 0; col < dayHeaders.length; col++) {
    const x = columnPositions[col].start * SCALE;
    const width = (columnPositions[col].end - columnPositions[col].start) * SCALE;
    
    // Header cell background
    pdf.setFillColor(...SPEC.WHITE);
    pdf.rect(x, currentY, width, SPEC.ROW_HEIGHT * SCALE, 'F');
    
    // Header cell border (matching Python: width=2 for header)
    pdf.setLineWidth(SPEC.HEADER_BORDER * SCALE);
    pdf.setDrawColor(...SPEC.BLACK);
    pdf.rect(x, currentY, width, SPEC.ROW_HEIGHT * SCALE, 'S');
    
    // Header text (matching Python: font_normal for headers)
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(SPEC.TOP_HOUR_FONT * SCALE);
    pdf.setTextColor(...SPEC.BLACK);
    pdf.text(
      dayHeaders[col],
      x + width / 2,
      currentY + SPEC.ROW_HEIGHT * SCALE / 2 + 5,
      { align: 'center' }
    );
  }
  
  currentY += SPEC.ROW_HEIGHT * SCALE;

  // Generate time slots exactly like Python (6 AM to 11 PM with 30-minute increments)
  const timeSlots = [];
  for (let hour = 6; hour < 24; hour++) {
    timeSlots.push({ time: `${hour.toString().padStart(2, '0')}00`, isTopHour: true });
    timeSlots.push({ time: `${hour.toString().padStart(2, '0')}30`, isTopHour: false });
  }

  // Draw all time slot rows (matching Python logic exactly)
  timeSlots.forEach((slot, rowIndex) => {
    const y = currentY + (rowIndex * SPEC.ROW_HEIGHT * SCALE);
    
    // Background color for entire row (matching Python: is_top_of_hour = time_slot.endswith('00'))
    const bgColor = slot.isTopHour ? SPEC.GREY_BG : SPEC.WHITE;
    const fontToUse = slot.isTopHour ? SPEC.TOP_HOUR_FONT : SPEC.HALF_HOUR_FONT;
    
    // Fill background for top of hour rows only within the grid area
    if (slot.isTopHour) {
      pdf.setFillColor(...bgColor);
      // Gray background only within the grid, not extending beyond right grid line
      const gridWidth = columnPositions[columnPositions.length - 1].end - columnPositions[0].start;
      pdf.rect(
        columnPositions[0].start * SCALE,
        y,
        gridWidth * SCALE,
        SPEC.ROW_HEIGHT * SCALE,
        'F'
      );
    }
    
    // Draw all cells in this row
    for (let col = 0; col < dayHeaders.length; col++) {
      const x = columnPositions[col].start * SCALE;
      const width = (columnPositions[col].end - columnPositions[col].start) * SCALE;
      
      // Cell border (matching Python: width=1 for cells)
      pdf.setLineWidth(SPEC.CELL_BORDER * SCALE);
      pdf.setDrawColor(...SPEC.BLACK);
      pdf.rect(x, y, width, SPEC.ROW_HEIGHT * SCALE, 'S');
      
      // Time column text - perfectly centered both horizontally and vertically
      if (col === 0) {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(fontToUse * SCALE);
        pdf.setTextColor(...SPEC.BLACK);
        
        // Calculate exact center position
        const centerX = x + (width / 2);
        const centerY = y + (SPEC.ROW_HEIGHT * SCALE / 2);
        
        // Adjust for font baseline - center the text exactly
        const fontAdjustment = (fontToUse * SCALE) / 3; // Approximate font baseline adjustment
        const textY = centerY + fontAdjustment;
        
        pdf.text(
          slot.time,
          centerX,
          textY,
          { align: 'center' }
        );
      }
    }
  });

  // Draw appointments with exact styling
  drawExactAppointments(pdf, weekStartDate, events, SPEC, SCALE, columnPositions, SPEC.TABLE_START_Y * SCALE, timeSlots);
}

function drawExactAppointments(pdf: jsPDF, weekStartDate: Date, events: CalendarEvent[], SPEC: any, SCALE: number, columnPositions: any[], headerY: number, timeSlots: any[]): void {
  events.forEach(event => {
    const eventDate = new Date(event.startTime);
    const endDate = new Date(event.endTime);
    
    // Calculate day index (1-7 for Mon-Sun, skip TIME column)
    const dayIndex = Math.floor((eventDate.getTime() - weekStartDate.getTime()) / (1000 * 60 * 60 * 24));
    if (dayIndex < 0 || dayIndex > 6) return;
    
    const columnIndex = dayIndex + 1; // +1 to skip TIME column
    
    // Find time slot indices
    const startHour = eventDate.getHours();
    const startMinute = eventDate.getMinutes();
    const endHour = endDate.getHours();
    const endMinute = endDate.getMinutes();
    
    // Convert to 24-hour format strings
    const startTimeStr = `${startHour.toString().padStart(2, '0')}${startMinute >= 30 ? '30' : '00'}`;
    const endTimeStr = `${endHour.toString().padStart(2, '0')}${endMinute >= 30 ? '30' : '00'}`;
    
    const startSlotIndex = timeSlots.findIndex(slot => slot.time === startTimeStr);
    const endSlotIndex = timeSlots.findIndex(slot => slot.time === endTimeStr);
    
    if (startSlotIndex === -1) return;
    
    // Calculate position
    const x = columnPositions[columnIndex].start * SCALE + 2;
    const y = headerY + ((startSlotIndex + 1) * SPEC.ROW_HEIGHT * SCALE) + 2;
    const width = (columnPositions[columnIndex].end - columnPositions[columnIndex].start) * SCALE - 4;
    const height = Math.max(
      SPEC.ROW_HEIGHT * SCALE - 4,
      endSlotIndex > startSlotIndex ? (endSlotIndex - startSlotIndex) * SPEC.ROW_HEIGHT * SCALE - 4 : SPEC.ROW_HEIGHT * SCALE - 4
    );
    
    // White background for all appointments
    pdf.setFillColor(...SPEC.WHITE);
    pdf.rect(x, y, width, height, 'F');
    
    // Styling based on event type
    if (event.title.includes('Appointment')) {
      // SimplePractice - cornflower blue border with thick left edge
      pdf.setDrawColor(100, 149, 237);
      pdf.setLineWidth(1 * SCALE);
      pdf.rect(x, y, width, height, 'S');
      
      // Thick left border - 2px thicker than before
      pdf.setLineWidth(5 * SCALE); // Made 2px thicker (was 3, now 5)
      pdf.line(x, y, x, y + height);
      
    } else if (event.source === 'google') {
      // Google Calendar - green dashed border
      pdf.setDrawColor(34, 197, 94);
      pdf.setLineWidth(1 * SCALE);
      pdf.setLineDashPattern([3 * SCALE, 2 * SCALE], 0);
      pdf.rect(x, y, width, height, 'S');
      pdf.setLineDashPattern([], 0);
      
    } else {
      // Holidays - solid yellow
      pdf.setFillColor(255, 193, 7);
      pdf.rect(x, y, width, height, 'F');
    }
    
    // Event text - sized to fit proportionally within the appointment box
    const padding = 4; // Reduced padding for better text fitting
    
    // Clean title and handle long text
    let title = event.title.replace(' Appointment', '');
    const source = event.source === 'google' ? 'GOOGLE CALENDAR' : 'SIMPLEPRACTICE';
    const timeText = `${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}-${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
    
    // Calculate available space for text
    const availableHeight = height - (padding * 2);
    const availableWidth = width - (padding * 2);
    
    // Calculate proportional font sizes that fit within the box
    // Use much larger base sizes for better visibility
    const baseHeightRatio = availableHeight / 63; // Based on standard row height
    const baseWidthRatio = availableWidth / 400; // Based on typical column width
    const scaleFactor = Math.min(baseHeightRatio, baseWidthRatio, 2.0); // Allow scaling up to 200%
    
    // Apply proportional sizing with dramatically larger limits for maximum readability
    const titleFontSize = Math.max(18, Math.min(36, 28 * scaleFactor)); // Between 18-36pt (dramatically larger)
    const sourceFontSize = Math.max(14, Math.min(28, 22 * scaleFactor)); // Between 14-28pt (dramatically larger)
    const timeFontSize = Math.max(16, Math.min(32, 24 * scaleFactor)); // Between 16-32pt (dramatically larger)
    
    // Calculate text positioning to fit all three lines within the box
    const lineHeight = availableHeight / 3; // Divide space into 3 equal parts
    const titleY = y + padding + (lineHeight * 0.7); // Position in first third
    const sourceY = y + padding + (lineHeight * 1.5); // Position in second third
    const timeY = y + padding + (lineHeight * 2.3); // Position in third third
    
    // Measure and truncate title if needed to fit width
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(titleFontSize * SCALE);
    let truncatedTitle = title;
    const titleWidth = pdf.getTextWidth(truncatedTitle);
    
    if (titleWidth > availableWidth) {
      // Truncate title to fit within available width
      const charRatio = availableWidth / titleWidth;
      const maxChars = Math.floor(title.length * charRatio * 0.9); // 90% safety margin
      truncatedTitle = title.substring(0, Math.max(1, maxChars - 3)) + '...';
    }
    
    // Draw title - proportionally sized and positioned
    pdf.setTextColor(...SPEC.BLACK);
    pdf.text(truncatedTitle, x + padding, titleY);
    
    // Draw source - positioned in middle section
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(sourceFontSize * SCALE);
    pdf.text(source, x + padding, sourceY);
    
    // Draw time range - positioned at bottom section
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(timeFontSize * SCALE);
    pdf.text(timeText, x + padding, timeY);
  });
}