import jsPDF from 'jspdf';
import { CalendarEvent } from '@/types/calendar';
import { cleanEventTitle } from './textWrappers';

export interface CurrentWeeklyExportConfig {
  pageWidth: number;
  pageHeight: number;
  margins: number;
  headerHeight: number;
  timeColumnWidth: number;
  dayColumnWidth: number;
  timeSlotHeight: number;
  fonts: {
    title: number;
    weekInfo: number;
    dayHeader: number;
    timeLabel: number;
    eventTitle: number;
    eventTime: number;
  };
}

const CURRENT_WEEKLY_CONFIG: CurrentWeeklyExportConfig = {
  pageWidth: 792, // 11" landscape
  pageHeight: 612, // 8.5" landscape
  margins: 20,
  headerHeight: 40,
  timeColumnWidth: 60,
  dayColumnWidth: 102, // (792 - 20*2 - 60) / 7 = 102
  timeSlotHeight: 14,
  fonts: {
    title: 16,
    weekInfo: 12,
    dayHeader: 9,
    timeLabel: 7,
    eventTitle: 6,
    eventTime: 5,
  },
};

export const exportCurrentWeeklyView = (
  events: CalendarEvent[],
  weekStart: Date,
  weekEnd: Date
): void => {
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: [CURRENT_WEEKLY_CONFIG.pageWidth, CURRENT_WEEKLY_CONFIG.pageHeight]
  });

  pdf.setFont('helvetica');
  
  // Draw header
  drawCurrentWeeklyHeader(pdf, weekStart, weekEnd);
  
  // Draw grid and events
  drawCurrentWeeklyGrid(pdf, events, weekStart);
  
  // Save the PDF
  const weekStartStr = weekStart.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  });
  const weekEndStr = weekEnd.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });
  
  pdf.save(`current-weekly-${weekStartStr}-${weekEndStr}.pdf`);
};

const drawCurrentWeeklyHeader = (pdf: jsPDF, weekStart: Date, weekEnd: Date): void => {
  const { pageWidth, margins, headerHeight, fonts } = CURRENT_WEEKLY_CONFIG;
  
  // Title
  pdf.setFontSize(fonts.title);
  pdf.setFont('helvetica', 'bold');
  pdf.text('WEEKLY PLANNER', margins, margins + 20);
  
  // Week info
  pdf.setFontSize(fonts.weekInfo);
  pdf.setFont('helvetica', 'normal');
  const weekStartStr = weekStart.toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric' 
  });
  const weekEndStr = weekEnd.toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric',
    year: 'numeric'
  });
  pdf.text(`${weekStartStr} - ${weekEndStr}`, margins, margins + 35);
};

const drawCurrentWeeklyGrid = (pdf: jsPDF, events: CalendarEvent[], weekStart: Date): void => {
  const { 
    pageWidth, 
    pageHeight, 
    margins, 
    headerHeight, 
    timeColumnWidth, 
    dayColumnWidth, 
    timeSlotHeight,
    fonts 
  } = CURRENT_WEEKLY_CONFIG;
  
  const gridStartY = margins + headerHeight;
  const gridHeight = pageHeight - margins * 2 - headerHeight;
  const totalSlots = 36; // 6:00 AM to 11:30 PM (half-hour slots)
  
  // Draw day headers
  pdf.setFontSize(fonts.dayHeader);
  pdf.setFont('helvetica', 'bold');
  
  const dayNames = ['TIME', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  
  for (let i = 0; i < dayNames.length; i++) {
    const x = margins + (i === 0 ? 0 : timeColumnWidth + (i - 1) * dayColumnWidth);
    const width = i === 0 ? timeColumnWidth : dayColumnWidth;
    
    // Header background (white)
    pdf.setFillColor(255, 255, 255);
    pdf.rect(x, gridStartY, width, 25, 'F');
    
    // Header border
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(1);
    pdf.rect(x, gridStartY, width, 25, 'S');
    
    // Header text
    pdf.setTextColor(0, 0, 0);
    const textWidth = pdf.getTextWidth(dayNames[i]);
    pdf.text(dayNames[i], x + (width - textWidth) / 2, gridStartY + 16);
    
    // Add day number for day columns
    if (i > 0) {
      const dayDate = new Date(weekStart);
      dayDate.setDate(weekStart.getDate() + (i - 1));
      const dayNum = dayDate.getDate().toString();
      
      pdf.setFontSize(fonts.dayHeader - 1);
      const dayNumWidth = pdf.getTextWidth(dayNum);
      pdf.text(dayNum, x + (width - dayNumWidth) / 2, gridStartY + 22);
    }
  }
  
  // Draw time slots and grid
  const timeGridStartY = gridStartY + 25;
  
  for (let slot = 0; slot < totalSlots; slot++) {
    const y = timeGridStartY + slot * timeSlotHeight;
    const hour = Math.floor(slot / 2) + 6;
    const minute = (slot % 2) * 30;
    const isHourSlot = minute === 0;
    
    // Time slot background (grey for top-of-hour, white for half-hour)
    pdf.setFillColor(isHourSlot ? 240 : 248, isHourSlot ? 240 : 248, isHourSlot ? 240 : 248);
    pdf.rect(margins, y, timeColumnWidth, timeSlotHeight, 'F');
    
    // Time label
    pdf.setFontSize(fonts.timeLabel);
    pdf.setFont('helvetica', isHourSlot ? 'bold' : 'normal');
    pdf.setTextColor(0, 0, 0);
    
    const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    const timeWidth = pdf.getTextWidth(timeStr);
    pdf.text(timeStr, margins + timeColumnWidth - timeWidth - 5, y + timeSlotHeight / 2 + 2);
    
    // Day columns background (white)
    for (let day = 0; day < 7; day++) {
      const dayX = margins + timeColumnWidth + day * dayColumnWidth;
      pdf.setFillColor(255, 255, 255);
      pdf.rect(dayX, y, dayColumnWidth, timeSlotHeight, 'F');
      
      // Grid lines
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.5);
      pdf.line(dayX, y, dayX + dayColumnWidth, y);
      
      // Vertical separators
      if (day > 0) {
        pdf.setDrawColor(150, 150, 150);
        pdf.setLineWidth(1);
        pdf.line(dayX, gridStartY, dayX, timeGridStartY + totalSlots * timeSlotHeight);
      }
    }
  }
  
  // Draw events
  drawCurrentWeeklyEvents(pdf, events, weekStart, timeGridStartY);
  
  // Draw outer grid border
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(2);
  pdf.rect(margins, gridStartY, pageWidth - margins * 2, 25 + totalSlots * timeSlotHeight, 'S');
};

const drawCurrentWeeklyEvents = (pdf: jsPDF, events: CalendarEvent[], weekStart: Date, gridStartY: number): void => {
  const { 
    margins, 
    timeColumnWidth, 
    dayColumnWidth, 
    timeSlotHeight,
    fonts 
  } = CURRENT_WEEKLY_CONFIG;
  
  // Filter events for the current week
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  
  const weekEvents = events.filter(event => {
    const eventDate = new Date(event.startTime);
    return eventDate >= weekStart && eventDate <= weekEnd;
  });
  
  weekEvents.forEach(event => {
    const eventStart = new Date(event.startTime);
    const eventEnd = new Date(event.endTime);
    const dayOfWeek = eventStart.getDay();
    const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sunday = 6, Monday = 0
    
    // Calculate position
    const eventHour = eventStart.getHours();
    const eventMinute = eventStart.getMinutes();
    const slotIndex = (eventHour - 6) * 2 + (eventMinute >= 30 ? 1 : 0);
    
    const x = margins + timeColumnWidth + adjustedDay * dayColumnWidth + 2;
    const y = gridStartY + slotIndex * timeSlotHeight + 2;
    
    // Calculate height based on duration
    const durationMinutes = (eventEnd.getTime() - eventStart.getTime()) / (1000 * 60);
    const height = Math.max((durationMinutes / 30) * timeSlotHeight - 4, timeSlotHeight - 4);
    
    const width = dayColumnWidth - 4;
    
    // Event background and border based on type
    const eventType = getEventType(event);
    drawEventWithCurrentStyling(pdf, x, y, width, height, event, eventType);
  });
};

const getEventType = (event: CalendarEvent): 'simplepractice' | 'google' | 'holiday' => {
  if (event.calendarId === 'en.usa#holiday@group.v.calendar.google.com') {
    return 'holiday';
  }
  
  if (event.title.toLowerCase().includes('haircut') ||
      event.title.toLowerCase().includes('hair and beard') ||
      event.title.toLowerCase().includes('dan re:') ||
      event.title.toLowerCase().includes('supervision') ||
      event.title.toLowerCase().includes('blake') ||
      event.title.toLowerCase().includes('phone call') ||
      event.title.toLowerCase().includes('call with')) {
    return 'google';
  }
  
  return 'simplepractice';
};

const drawEventWithCurrentStyling = (
  pdf: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  event: CalendarEvent,
  eventType: 'simplepractice' | 'google' | 'holiday'
): void => {
  const { fonts } = CURRENT_WEEKLY_CONFIG;
  
  // White background
  pdf.setFillColor(255, 255, 255);
  pdf.rect(x, y, width, height, 'F');
  
  // Event-specific styling
  if (eventType === 'simplepractice') {
    // Cornflower blue border with thick left flag
    pdf.setDrawColor(100, 149, 237);
    pdf.setLineWidth(0.5);
    pdf.rect(x, y, width, height, 'S');
    
    // Thick left flag
    pdf.setFillColor(100, 149, 237);
    pdf.rect(x, y, 3, height, 'F');
  } else if (eventType === 'google') {
    // Dashed green border
    pdf.setDrawColor(34, 197, 94);
    pdf.setLineWidth(0.5);
    pdf.setLineDashPattern([2, 2], 0);
    pdf.rect(x, y, width, height, 'S');
    pdf.setLineDashPattern([], 0); // Reset dash pattern
  } else if (eventType === 'holiday') {
    // Orange border
    pdf.setDrawColor(245, 158, 11);
    pdf.setLineWidth(0.5);
    pdf.rect(x, y, width, height, 'S');
  }
  
  // Event text
  pdf.setTextColor(0, 0, 0);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(fonts.eventTitle);
  
  const eventTitle = cleanEventTitle(event.title);
  const maxWidth = width - 8;
  
  // Wrap text to fit
  const words = eventTitle.split(' ');
  let lines: string[] = [];
  let currentLine = '';
  
  words.forEach(word => {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = pdf.getTextWidth(testLine);
    
    if (testWidth <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        lines.push(word);
      }
    }
  });
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  // Draw event title lines
  const maxLines = Math.floor((height - 10) / 8);
  lines.slice(0, maxLines).forEach((line, index) => {
    pdf.text(line, x + 4, y + 8 + index * 8);
  });
  
  // Draw time if there's space
  if (height > 16) {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(fonts.eventTime);
    
    const startTime = new Date(event.startTime);
    const endTime = new Date(event.endTime);
    const timeStr = `${startTime.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: false 
    })} - ${endTime.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: false 
    })}`;
    
    const timeY = y + height - 4;
    pdf.text(timeStr, x + 4, timeY);
  }
};