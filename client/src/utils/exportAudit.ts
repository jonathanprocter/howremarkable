import { CalendarEvent } from '../types/calendar';

/**
 * Comprehensive Export Audit Utility
 * 
 * This utility ensures that PDF exports match the dashboard exactly by:
 * 1. Auditing event data completeness
 * 2. Validating calendar filtering
 * 3. Checking notes and action items
 * 4. Ensuring proper event categorization
 */

export interface ExportAuditReport {
  totalEvents: number;
  dayEvents: number;
  missingNotes: string[];
  missingActionItems: string[];
  eventsBySource: {
    simplepractice: number;
    google: number;
    manual: number;
    holiday: number;
  };
  warnings: string[];
  errors: string[];
}

export function auditExportData(
  allEvents: CalendarEvent[],
  filteredEvents: CalendarEvent[],
  selectedDate?: Date
): ExportAuditReport {
  const report: ExportAuditReport = {
    totalEvents: filteredEvents.length,
    dayEvents: 0,
    missingNotes: [],
    missingActionItems: [],
    eventsBySource: {
      simplepractice: 0,
      google: 0,
      manual: 0,
      holiday: 0
    },
    warnings: [],
    errors: []
  };

  // Filter events for specific date if provided
  let eventsToAudit = filteredEvents;
  if (selectedDate) {
    eventsToAudit = filteredEvents.filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate.toDateString() === selectedDate.toDateString();
    });
    report.dayEvents = eventsToAudit.length;
  }

  // Audit each event
  eventsToAudit.forEach(event => {
    // Check event completeness
    if (!event.id || !event.title || !event.startTime || !event.endTime) {
      report.errors.push(`Event missing required fields: ${event.title || 'Unknown'}`);
    }

    // Check for notes and action items
    if (event.notes && event.notes.trim()) {
      // Notes exist - good
    } else {
      // Check if this is an event that should have notes
      if (event.source === 'manual' || event.title.includes('Supervision')) {
        report.missingNotes.push(event.title);
      }
    }

    if (event.actionItems && event.actionItems.trim()) {
      // Action items exist - good
    } else {
      // Check if this is an event that should have action items
      if (event.source === 'manual' || event.title.includes('Supervision')) {
        report.missingActionItems.push(event.title);
      }
    }

    // Categorize by source
    if (event.source === 'simplepractice' || event.title.toLowerCase().includes('appointment')) {
      report.eventsBySource.simplepractice++;
    } else if (event.source === 'google' && !event.title.toLowerCase().includes('holiday')) {
      report.eventsBySource.google++;
    } else if (event.title.toLowerCase().includes('holiday')) {
      report.eventsBySource.holiday++;
    } else if (event.source === 'manual') {
      report.eventsBySource.manual++;
    }
  });

  // Generate warnings
  if (report.totalEvents === 0) {
    report.warnings.push('No events found for export');
  }

  if (selectedDate && report.dayEvents === 0) {
    report.warnings.push(`No events found for ${selectedDate.toDateString()}`);
  }

  if (filteredEvents.length < allEvents.length) {
    report.warnings.push(`Calendar filtering applied: ${filteredEvents.length}/${allEvents.length} events`);
  }

  return report;
}

export function logExportAudit(report: ExportAuditReport, exportType: string): void {
  console.log(`\n=== EXPORT AUDIT REPORT - ${exportType.toUpperCase()} ===`);
  console.log(`Total Events: ${report.totalEvents}`);
  if (report.dayEvents > 0) {
    console.log(`Day Events: ${report.dayEvents}`);
  }
  
  console.log(`Events by Source:`);
  console.log(`  - SimplePractice: ${report.eventsBySource.simplepractice}`);
  console.log(`  - Google Calendar: ${report.eventsBySource.google}`);
  console.log(`  - Manual: ${report.eventsBySource.manual}`);
  console.log(`  - Holidays: ${report.eventsBySource.holiday}`);

  if (report.warnings.length > 0) {
    console.log(`\nWarnings:`);
    report.warnings.forEach(warning => console.log(`  ⚠️ ${warning}`));
  }

  if (report.errors.length > 0) {
    console.log(`\nErrors:`);
    report.errors.forEach(error => console.log(`  ❌ ${error}`));
  }

  if (report.missingNotes.length > 0) {
    console.log(`\nEvents Missing Notes:`);
    report.missingNotes.forEach(title => console.log(`  📝 ${title}`));
  }

  if (report.missingActionItems.length > 0) {
    console.log(`\nEvents Missing Action Items:`);
    report.missingActionItems.forEach(title => console.log(`  ✅ ${title}`));
  }

  console.log(`=== END AUDIT REPORT ===\n`);
}

/**
 * Ensure events have all required fields for PDF export
 */
export function validateEventData(events: CalendarEvent[]): CalendarEvent[] {
  return events.map(event => ({
    ...event,
    // Ensure all required fields exist
    id: event.id || `temp-${Date.now()}`,
    title: event.title || 'Untitled Event',
    description: event.description || '',
    notes: event.notes || '',
    actionItems: event.actionItems || '',
    source: event.source || 'manual',
    color: event.color || '#4285F4',
    calendarId: event.calendarId || ''
  }));
}

/**
 * Clean event title for PDF display
 */
export function cleanEventTitle(title: string): string {
  return title
    .replace(/🔒\s*/g, '') // Remove lock symbol
    .replace(/[\u{1F500}-\u{1F6FF}]/gu, '') // Remove emoji symbols
    .replace(/Ø=ÜÅ/g, '') // Remove corrupted symbols
    .replace(/Ø=Ý/g, '') // Remove corrupted symbols
    .replace(/!•/g, '') // Remove broken navigation symbols
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();
}