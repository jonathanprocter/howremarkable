/**
 * Audit-Based PDF Export System
 * Implements all fixes identified by the comprehensive audit system
 */

import jsPDF from 'jspdf';
import { CalendarEvent } from '../types/calendar';
import { cleanEventTitle, cleanTextForPDF } from './titleCleaner';
import { generateTimeSlots } from './timeSlots';

// Enhanced configuration based on audit findings
const AUDIT_ENHANCED_CONFIG = {
  // Page setup - A3 landscape for professional presentation
  pageWidth: 1190,
  pageHeight: 842,
  
  // Layout fixes based on audit recommendations
  margin: 25,
  headerHeight: 60,
  legendHeight: 35,
  
  // Critical fixes: Dashboard-matching dimensions
  timeColumnWidth: 80, // Matches dashboard exactly
  dayColumnWidth: 150, // Optimized for content
  timeSlotHeight: 40, // Matches dashboard exactly
  
  // Typography fixes: Enhanced font sizes
  fonts: {
    title: 20,
    weekInfo: 16,
    dayHeader: 14,
    timeHour: 12,
    timeHalf: 10,
    eventTitle: 11,
    eventTime: 10,
    legend: 12
  },
  
  // Color fixes: Exact dashboard colors
  colors: {
    simplePractice: '#6495ED',
    google: '#22C55E',
    holiday: '#F59E0B',
    gridLine: '#E5E7EB',
    background: '#FFFFFF',
    timeSlotBg: '#F8F9FA',
    hourBg: '#F0F0F0'
  },
  
  // Grid structure optimizations
  gridLineWidth: 1,
  borderWidth: 0.5,
  
  get contentWidth() {
    return this.pageWidth - (2 * this.margin);
  },
  
  get gridStartX() {
    return this.margin;
  },
  
  get gridStartY() {
    return this.margin + this.headerHeight + this.legendHeight;
  },
  
  get totalGridWidth() {
    return this.timeColumnWidth + (this.dayColumnWidth * 7);
  },
  
  get gridHeight() {
    return 36 * this.timeSlotHeight; // Full 6:00-23:30 timeline
  }
};

export const exportAuditEnhancedPDF = async (
  weekStartDate: Date,
  weekEndDate: Date,
  events: CalendarEvent[] = []
): Promise<void> => {
  try {
    console.log('🔧 Creating audit-enhanced PDF export...');
    
    // Filter events for the week
    const weekEvents = filterWeekEvents(events, weekStartDate, weekEndDate);
    
    // Create PDF with enhanced configuration
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'pt',
      format: [AUDIT_ENHANCED_CONFIG.pageWidth, AUDIT_ENHANCED_CONFIG.pageHeight]
    });
    
    // Set enhanced font
    pdf.setFont('helvetica');
    
    // Draw enhanced header
    drawEnhancedHeader(pdf, weekStartDate, weekEndDate);
    
    // Draw enhanced legend
    drawEnhancedLegend(pdf);
    
    // Draw enhanced grid
    drawEnhancedGrid(pdf);
    
    // Draw enhanced events
    drawEnhancedEvents(pdf, weekEvents, weekStartDate);
    
    // Save with audit-enhanced naming
    const fileName = `audit-enhanced-weekly-${formatDate(weekStartDate)}.pdf`;
    pdf.save(fileName);
    
    console.log('✅ Audit-enhanced PDF export completed');
    
  } catch (error) {
    console.error('❌ Audit-enhanced PDF export failed:', error);
    throw error;
  }
};

function filterWeekEvents(events: CalendarEvent[], weekStart: Date, weekEnd: Date): CalendarEvent[] {
  return (events || []).filter(event => {
    if (!event?.startTime || !event?.endTime) return false;
    
    try {
      const eventDate = new Date(event.startTime);
      if (isNaN(eventDate.getTime())) return false;
      
      return eventDate >= weekStart && eventDate <= weekEnd;
    } catch (error) {
      console.warn('Error filtering event:', event, error);
      return false;
    }
  });
}

function drawEnhancedHeader(pdf: jsPDF, weekStart: Date, weekEnd: Date): void {
  const config = AUDIT_ENHANCED_CONFIG;
  
  // Header background
  pdf.setFillColor(255, 255, 255);
  pdf.rect(config.gridStartX, config.margin, config.contentWidth, config.headerHeight, 'F');
  
  // Enhanced title
  pdf.setFontSize(config.fonts.title);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0, 0, 0);
  
  const title = 'WEEKLY CALENDAR';
  const titleWidth = pdf.getTextWidth(title);
  const titleX = config.gridStartX + (config.contentWidth - titleWidth) / 2;
  pdf.text(title, titleX, config.margin + 25);
  
  // Enhanced week info
  pdf.setFontSize(config.fonts.weekInfo);
  pdf.setFont('helvetica', 'normal');
  
  const weekInfo = `${formatDate(weekStart)} - ${formatDate(weekEnd)}`;
  const weekInfoWidth = pdf.getTextWidth(weekInfo);
  const weekInfoX = config.gridStartX + (config.contentWidth - weekInfoWidth) / 2;
  pdf.text(weekInfo, weekInfoX, config.margin + 50);
}

function drawEnhancedLegend(pdf: jsPDF): void {
  const config = AUDIT_ENHANCED_CONFIG;
  const legendY = config.margin + config.headerHeight + 10;
  
  // Legend background
  pdf.setFillColor(248, 249, 250);
  pdf.rect(config.gridStartX, legendY, config.contentWidth, config.legendHeight, 'F');
  
  // Legend items
  const legendItems = [
    { label: 'SimplePractice', color: config.colors.simplePractice },
    { label: 'Google Calendar', color: config.colors.google },
    { label: 'Holidays', color: config.colors.holiday }
  ];
  
  pdf.setFontSize(config.fonts.legend);
  pdf.setFont('helvetica', 'normal');
  
  const itemSpacing = config.contentWidth / legendItems.length;
  
  legendItems.forEach((item, index) => {
    const itemX = config.gridStartX + (index * itemSpacing) + 20;
    const itemY = legendY + 20;
    
    // Color indicator
    pdf.setFillColor(item.color);
    pdf.rect(itemX, itemY - 8, 12, 8, 'F');
    
    // Label
    pdf.setTextColor(0, 0, 0);
    pdf.text(item.label, itemX + 18, itemY);
  });
}

function drawEnhancedGrid(pdf: jsPDF): void {
  const config = AUDIT_ENHANCED_CONFIG;
  const timeSlots = generateTimeSlots();
  
  // Grid background
  pdf.setFillColor(255, 255, 255);
  pdf.rect(config.gridStartX, config.gridStartY, config.totalGridWidth, config.gridHeight, 'F');
  
  // Draw time column
  drawTimeColumn(pdf, timeSlots);
  
  // Draw day columns
  drawDayColumns(pdf);
  
  // Draw grid lines
  drawGridLines(pdf, timeSlots);
}

function drawTimeColumn(pdf: jsPDF, timeSlots: string[]): void {
  const config = AUDIT_ENHANCED_CONFIG;
  
  // Time column background
  pdf.setFillColor(248, 249, 250);
  pdf.rect(config.gridStartX, config.gridStartY, config.timeColumnWidth, config.gridHeight, 'F');
  
  // Time labels
  pdf.setTextColor(0, 0, 0);
  
  timeSlots.forEach((timeSlot, index) => {
    const y = config.gridStartY + (index * config.timeSlotHeight) + (config.timeSlotHeight / 2) + 4;
    const isHour = timeSlot.endsWith(':00');
    
    // Enhanced font sizing
    pdf.setFontSize(isHour ? config.fonts.timeHour : config.fonts.timeHalf);
    pdf.setFont('helvetica', isHour ? 'bold' : 'normal');
    
    // Right-align time labels
    const timeWidth = pdf.getTextWidth(timeSlot);
    const timeX = config.gridStartX + config.timeColumnWidth - timeWidth - 10;
    pdf.text(timeSlot, timeX, y);
  });
}

function drawDayColumns(pdf: jsPDF): void {
  const config = AUDIT_ENHANCED_CONFIG;
  const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  
  days.forEach((day, index) => {
    const dayX = config.gridStartX + config.timeColumnWidth + (index * config.dayColumnWidth);
    
    // Day header background
    pdf.setFillColor(240, 240, 240);
    pdf.rect(dayX, config.gridStartY, config.dayColumnWidth, config.timeSlotHeight, 'F');
    
    // Day label
    pdf.setFontSize(config.fonts.dayHeader);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    
    const dayWidth = pdf.getTextWidth(day);
    const dayLabelX = dayX + (config.dayColumnWidth - dayWidth) / 2;
    pdf.text(day, dayLabelX, config.gridStartY + 25);
  });
}

function drawGridLines(pdf: jsPDF, timeSlots: string[]): void {
  const config = AUDIT_ENHANCED_CONFIG;
  
  pdf.setLineWidth(config.gridLineWidth);
  pdf.setDrawColor(229, 231, 235);
  
  // Horizontal lines
  timeSlots.forEach((timeSlot, index) => {
    const y = config.gridStartY + (index * config.timeSlotHeight);
    const isHour = timeSlot.endsWith(':00');
    
    // Enhanced line weights
    pdf.setLineWidth(isHour ? 1.5 : 0.5);
    pdf.line(config.gridStartX, y, config.gridStartX + config.totalGridWidth, y);
  });
  
  // Vertical lines
  pdf.setLineWidth(config.gridLineWidth);
  
  // Time column separator
  pdf.setLineWidth(2);
  pdf.line(
    config.gridStartX + config.timeColumnWidth,
    config.gridStartY,
    config.gridStartX + config.timeColumnWidth,
    config.gridStartY + config.gridHeight
  );
  
  // Day column separators
  pdf.setLineWidth(1);
  for (let i = 1; i < 7; i++) {
    const x = config.gridStartX + config.timeColumnWidth + (i * config.dayColumnWidth);
    pdf.line(x, config.gridStartY, x, config.gridStartY + config.gridHeight);
  }
}

function drawEnhancedEvents(pdf: jsPDF, events: CalendarEvent[], weekStart: Date): void {
  const config = AUDIT_ENHANCED_CONFIG;
  const timeSlots = generateTimeSlots();
  
  events.forEach(event => {
    try {
      const eventStart = new Date(event.startTime);
      const eventEnd = new Date(event.endTime);
      
      // Calculate position
      const dayIndex = getDayIndex(eventStart, weekStart);
      if (dayIndex < 0 || dayIndex > 6) return;
      
      const startSlot = getTimeSlotIndex(eventStart, timeSlots);
      const endSlot = getTimeSlotIndex(eventEnd, timeSlots);
      
      if (startSlot < 0 || endSlot < 0) return;
      
      // Calculate dimensions
      const eventX = config.gridStartX + config.timeColumnWidth + (dayIndex * config.dayColumnWidth) + 2;
      const eventY = config.gridStartY + (startSlot * config.timeSlotHeight) + 2;
      const eventWidth = config.dayColumnWidth - 4;
      const eventHeight = Math.max((endSlot - startSlot) * config.timeSlotHeight - 4, 30);
      
      // Draw enhanced event
      drawEnhancedEvent(pdf, event, eventX, eventY, eventWidth, eventHeight);
      
    } catch (error) {
      console.warn('Error drawing event:', event, error);
    }
  });
}

function drawEnhancedEvent(
  pdf: jsPDF,
  event: CalendarEvent,
  x: number,
  y: number,
  width: number,
  height: number
): void {
  const config = AUDIT_ENHANCED_CONFIG;
  
  // Determine event type and styling
  const eventType = getEventType(event);
  const eventColors = getEventColors(eventType);
  
  // Draw event background
  pdf.setFillColor(...eventColors.background);
  pdf.rect(x, y, width, height, 'F');
  
  // Draw event border
  pdf.setDrawColor(...eventColors.border);
  pdf.setLineWidth(config.borderWidth);
  pdf.rect(x, y, width, height, 'S');
  
  // Draw event text
  drawEventText(pdf, event, x, y, width, height);
}

function getEventType(event: CalendarEvent): string {
  const title = event.title.toLowerCase();
  if (title.includes('appointment')) return 'simplepractice';
  if (title.includes('holiday')) return 'holiday';
  return 'google';
}

function getEventColors(eventType: string): { background: number[], border: number[] } {
  const config = AUDIT_ENHANCED_CONFIG;
  
  switch (eventType) {
    case 'simplepractice':
      return {
        background: [255, 255, 255],
        border: [100, 149, 237]
      };
    case 'google':
      return {
        background: [255, 255, 255],
        border: [34, 197, 94]
      };
    case 'holiday':
      return {
        background: [254, 243, 199],
        border: [249, 115, 22]
      };
    default:
      return {
        background: [255, 255, 255],
        border: [156, 163, 175]
      };
  }
}

function drawEventText(
  pdf: jsPDF,
  event: CalendarEvent,
  x: number,
  y: number,
  width: number,
  height: number
): void {
  const config = AUDIT_ENHANCED_CONFIG;
  
  // Event title
  pdf.setFontSize(config.fonts.eventTitle);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0, 0, 0);
  
  const cleanTitle = cleanEventTitle(event.title);
  const titleLines = wrapText(pdf, cleanTitle, width - 8);
  
  let textY = y + 15;
  titleLines.forEach(line => {
    if (textY < y + height - 5) {
      pdf.text(line, x + 4, textY);
      textY += 12;
    }
  });
  
  // Event time
  if (textY < y + height - 15) {
    pdf.setFontSize(config.fonts.eventTime);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(75, 85, 99);
    
    const timeText = formatEventTime(event);
    pdf.text(timeText, x + 4, textY);
  }
}

function wrapText(pdf: jsPDF, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  
  words.forEach(word => {
    const testLine = currentLine + (currentLine ? ' ' : '') + word;
    const testWidth = pdf.getTextWidth(testLine);
    
    if (testWidth <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
      }
      currentLine = word;
    }
  });
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines;
}

function formatEventTime(event: CalendarEvent): string {
  const start = new Date(event.startTime);
  const end = new Date(event.endTime);
  
  const startTime = start.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: false 
  });
  
  const endTime = end.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: false 
  });
  
  return `${startTime} - ${endTime}`;
}

function getDayIndex(eventDate: Date, weekStart: Date): number {
  const dayDiff = Math.floor((eventDate.getTime() - weekStart.getTime()) / (24 * 60 * 60 * 1000));
  return dayDiff;
}

function getTimeSlotIndex(eventTime: Date, timeSlots: string[]): number {
  const hour = eventTime.getHours();
  const minute = eventTime.getMinutes();
  const timeString = `${hour.toString().padStart(2, '0')}:${minute >= 30 ? '30' : '00'}`;
  
  return timeSlots.findIndex(slot => slot === timeString);
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}

// Export comprehensive audit fixes
export const AUDIT_FIXES = {
  'time-column-width': 'Updated from 50px to 80px to match dashboard',
  'time-slot-height': 'Updated from 12px to 40px to match dashboard',
  'header-height': 'Updated from 35px to 60px to match dashboard',
  'font-sizes': 'Increased all font sizes to match dashboard proportions',
  'colors': 'Updated to exact dashboard color values',
  'grid-lines': 'Enhanced grid line consistency and weights',
  'event-styling': 'Improved event backgrounds and borders',
  'text-rendering': 'Enhanced text wrapping and positioning'
};

console.log('🔧 Audit-based PDF export system loaded with fixes:', Object.keys(AUDIT_FIXES));