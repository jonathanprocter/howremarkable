/**
 * Export Actions - Centralized export functionality for the digital planner
 * Provides consistent export interfaces for different PDF export types
 */

import { CalendarEvent } from '../types/calendar';

export const exportDailyToPDF = async (events: CalendarEvent[], selectedDate: Date, dailyNotes: string) => {
  try {
    const { exportExactDailyPDF } = await import('./exactDailyPDFExport');
    
    // Filter events for the selected date
    const dayEvents = events.filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate.toDateString() === selectedDate.toDateString();
    });
    
    await exportExactDailyPDF(selectedDate, dayEvents);
  } catch (error) {
    console.error('Daily PDF export failed:', error);
    throw error;
  }
};

export const exportWeeklyToPDF = async (events: CalendarEvent[], weekRange: { startDate: Date; endDate: Date }) => {
  try {
    const { exportExactGridPDF } = await import('./exactGridPDFExport');
    await exportExactGridPDF(weekRange.startDate, weekRange.endDate, events);
  } catch (error) {
    console.error('Weekly PDF export failed:', error);
    throw error;
  }
};

export const exportWeeklyPackageToPDF = async (events: CalendarEvent[], weekRange: { startDate: Date; endDate: Date }) => {
  try {
    const { exportWeeklyPackagePDF } = await import('./weeklyPackageExport');
    await exportWeeklyPackagePDF(weekRange.startDate, weekRange.endDate, events);
  } catch (error) {
    console.error('Weekly package PDF export failed:', error);
    throw error;
  }
};

export const exportRemarkableDailyToPDF = async (events: CalendarEvent[], selectedDate: Date, dailyNotes: string) => {
  try {
    const { exportPixelPerfectDailyPlanner } = await import('./pixelPerfectDailyExport');
    
    // Filter events for the selected date
    const dayEvents = events.filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate.toDateString() === selectedDate.toDateString();
    });
    
    await exportPixelPerfectDailyPlanner(selectedDate, dayEvents);
  } catch (error) {
    console.error('reMarkable daily PDF export failed:', error);
    throw error;
  }
};

export const exportRemarkableWeeklyToPDF = async (events: CalendarEvent[], weekRange: { startDate: Date; endDate: Date }) => {
  try {
    const { exportWeeklyCalendarPDF } = await import('./weeklyCalendarExport');
    await exportWeeklyCalendarPDF(weekRange.startDate, weekRange.endDate, events);
  } catch (error) {
    console.error('reMarkable weekly PDF export failed:', error);
    throw error;
  }
};

export const exportTrulyPixelPerfectToPDF = async (events: CalendarEvent[], weekRange: { startDate: Date; endDate: Date }) => {
  try {
    const { exportTrulyPixelPerfectPDF } = await import('./trulyPixelPerfectExport');
    await exportTrulyPixelPerfectPDF(weekRange.startDate, weekRange.endDate, events);
  } catch (error) {
    console.error('Truly pixel perfect PDF export failed:', error);
    throw error;
  }
};