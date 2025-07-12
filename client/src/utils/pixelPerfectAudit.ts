/**
 * Pixel-Perfect Audit System for Dynamic Daily Planner
 * Comprehensive testing and validation system to ensure 100% accuracy
 */

import { format } from 'date-fns';
import { CalendarEvent } from '@/shared/types';
import { DynamicDailyPlannerGenerator } from './dynamicDailyPlannerGenerator';
import html2canvas from 'html2canvas';

export interface AuditResult {
  score: number;
  maxScore: number;
  percentage: number;
  issues: AuditIssue[];
  recommendations: string[];
  measurements: AuditMeasurements;
  screenshots: {
    html: string;
    canvas: string;
  };
}

export interface AuditIssue {
  category: 'layout' | 'typography' | 'data' | 'formatting' | 'statistics';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  expected: string;
  actual: string;
  fixRecommendation: string;
}

export interface AuditMeasurements {
  containerWidth: number;
  containerHeight: number;
  timeColumnWidth: number;
  appointmentColumnWidth: number;
  notesColumnWidth: number;
  timeSlotHeight: number;
  headerHeight: number;
  fontSizes: {
    title: string;
    timeLabels: string;
    appointmentTitles: string;
    statistics: string;
  };
  colors: {
    background: string;
    text: string;
    borders: string;
    appointments: string;
  };
}

export class PixelPerfectAudit {
  private generator: DynamicDailyPlannerGenerator;
  private auditContainer: HTMLElement | null = null;

  constructor() {
    this.generator = new DynamicDailyPlannerGenerator();
  }

  /**
   * Run comprehensive pixel-perfect audit
   */
  async runFullAudit(date: Date, events: CalendarEvent[]): Promise<AuditResult> {
    console.log('🔍 Starting Pixel-Perfect Audit System');
    console.log(`📅 Audit Date: ${format(date, 'EEEE, MMMM d, yyyy')}`);
    console.log(`📊 Total Events: ${events.length}`);

    // Generate HTML and create audit container
    const html = this.generator.generateCompleteDailyPlannerHTML(date, events);
    await this.createAuditContainer(html);

    // Run all audit tests
    const measurements = await this.extractMeasurements();
    const dataAudit = await this.auditDataIntegrity(date, events);
    const layoutAudit = await this.auditLayoutPrecision();
    const typographyAudit = await this.auditTypography();
    const statisticsAudit = await this.auditStatistics(date, events);
    const screenshots = await this.captureScreenshots();

    // Compile results
    const allIssues = [
      ...dataAudit.issues,
      ...layoutAudit.issues,
      ...typographyAudit.issues,
      ...statisticsAudit.issues
    ];

    const totalScore = dataAudit.score + layoutAudit.score + typographyAudit.score + statisticsAudit.score;
    const maxScore = dataAudit.maxScore + layoutAudit.maxScore + typographyAudit.maxScore + statisticsAudit.maxScore;
    const percentage = Math.round((totalScore / maxScore) * 100);

    // Generate recommendations
    const recommendations = this.generateRecommendations(allIssues);

    // Clean up
    await this.cleanupAuditContainer();

    console.log(`✅ Audit Complete - Score: ${totalScore}/${maxScore} (${percentage}%)`);
    console.log(`🔧 Issues Found: ${allIssues.length}`);
    console.log(`📋 Recommendations: ${recommendations.length}`);

    return {
      score: totalScore,
      maxScore,
      percentage,
      issues: allIssues,
      recommendations,
      measurements,
      screenshots
    };
  }

  /**
   * Create audit container with HTML content
   */
  private async createAuditContainer(html: string): Promise<void> {
    this.auditContainer = document.createElement('div');
    this.auditContainer.innerHTML = html;
    this.auditContainer.style.position = 'absolute';
    this.auditContainer.style.left = '-9999px';
    this.auditContainer.style.top = '-9999px';
    this.auditContainer.style.width = '8.5in';
    this.auditContainer.style.background = '#FAFAF7';
    this.auditContainer.style.padding = '0.75in';
    this.auditContainer.style.fontSize = '14px';
    this.auditContainer.style.fontFamily = 'Georgia, serif';
    this.auditContainer.setAttribute('data-audit-container', 'true');

    document.body.appendChild(this.auditContainer);
    
    // Wait for rendering
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  /**
   * Extract precise measurements from rendered HTML
   */
  private async extractMeasurements(): Promise<AuditMeasurements> {
    if (!this.auditContainer) throw new Error('Audit container not initialized');

    const container = this.auditContainer.querySelector('.daily-planner') as HTMLElement;
    const timeColumn = this.auditContainer.querySelector('.time-column') as HTMLElement;
    const appointmentsColumn = this.auditContainer.querySelector('.appointments-column') as HTMLElement;
    const notesColumn = this.auditContainer.querySelector('.notes-column') as HTMLElement;
    const header = this.auditContainer.querySelector('.header-section') as HTMLElement;

    const containerRect = container?.getBoundingClientRect();
    const timeColumnRect = timeColumn?.getBoundingClientRect();
    const appointmentsColumnRect = appointmentsColumn?.getBoundingClientRect();
    const notesColumnRect = notesColumn?.getBoundingClientRect();
    const headerRect = header?.getBoundingClientRect();

    // Get computed styles
    const containerStyle = container ? getComputedStyle(container) : null;
    const titleElement = this.auditContainer.querySelector('h1') as HTMLElement;
    const timeLabel = this.auditContainer.querySelector('.time-slot') as HTMLElement;
    const appointmentTitle = this.auditContainer.querySelector('.appointment-title') as HTMLElement;
    const statValue = this.auditContainer.querySelector('.stat-value') as HTMLElement;

    return {
      containerWidth: containerRect?.width || 0,
      containerHeight: containerRect?.height || 0,
      timeColumnWidth: timeColumnRect?.width || 0,
      appointmentColumnWidth: appointmentsColumnRect?.width || 0,
      notesColumnWidth: notesColumnRect?.width || 0,
      timeSlotHeight: this.calculateTimeSlotHeight(),
      headerHeight: headerRect?.height || 0,
      fontSizes: {
        title: titleElement ? getComputedStyle(titleElement).fontSize : '0px',
        timeLabels: timeLabel ? getComputedStyle(timeLabel).fontSize : '0px',
        appointmentTitles: appointmentTitle ? getComputedStyle(appointmentTitle).fontSize : '0px',
        statistics: statValue ? getComputedStyle(statValue).fontSize : '0px'
      },
      colors: {
        background: containerStyle?.backgroundColor || '',
        text: containerStyle?.color || '',
        borders: containerStyle?.borderColor || '',
        appointments: this.getAppointmentColor()
      }
    };
  }

  /**
   * Audit data integrity and completeness
   */
  private async auditDataIntegrity(date: Date, events: CalendarEvent[]): Promise<{score: number; maxScore: number; issues: AuditIssue[]}> {
    const issues: AuditIssue[] = [];
    let score = 0;
    const maxScore = 20;

    // Test 1: Event count accuracy (5 points)
    const dayEvents = events.filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate.toDateString() === date.toDateString();
    });
    
    const renderedAppointments = this.auditContainer?.querySelectorAll('.appointment-block') || [];
    
    if (dayEvents.length === renderedAppointments.length) {
      score += 5;
    } else {
      issues.push({
        category: 'data',
        severity: 'critical',
        description: 'Event count mismatch',
        expected: `${dayEvents.length} events`,
        actual: `${renderedAppointments.length} rendered`,
        fixRecommendation: 'Check event filtering logic in convertCalendarEventsToAppointments'
      });
    }

    // Test 2: Time slot accuracy (5 points)
    const timeSlots = this.auditContainer?.querySelectorAll('.time-slot') || [];
    const expectedSlots = 36; // 06:00 to 23:30 in 30-minute increments
    
    if (timeSlots.length === expectedSlots) {
      score += 5;
    } else {
      issues.push({
        category: 'data',
        severity: 'high',
        description: 'Time slot count incorrect',
        expected: `${expectedSlots} time slots`,
        actual: `${timeSlots.length} time slots`,
        fixRecommendation: 'Verify generateTimeSlots method returns correct count'
      });
    }

    // Test 3: Appointment duration accuracy (5 points)
    let durationAccurate = true;
    dayEvents.forEach((event, index) => {
      const startTime = new Date(event.startTime);
      const endTime = new Date(event.endTime);
      const expectedDuration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
      
      const appointmentElement = renderedAppointments[index] as HTMLElement;
      const actualHeight = appointmentElement?.offsetHeight || 0;
      const expectedHeight = this.calculateExpectedHeight(expectedDuration);
      
      if (Math.abs(actualHeight - expectedHeight) > 5) { // 5px tolerance
        durationAccurate = false;
        issues.push({
          category: 'data',
          severity: 'medium',
          description: `Appointment duration rendering incorrect for ${event.title}`,
          expected: `${expectedHeight}px height`,
          actual: `${actualHeight}px height`,
          fixRecommendation: 'Check getAppointmentHeight calculation'
        });
      }
    });
    
    if (durationAccurate) score += 5;

    // Test 4: Notes and action items display (5 points)
    const eventsWithNotes = dayEvents.filter(event => 
      event.notes && event.notes.length > 0
    );
    const eventsWithActions = dayEvents.filter(event => 
      event.actionItems && event.actionItems.length > 0
    );
    
    const notesDisplayed = this.auditContainer?.querySelectorAll('.event-notes') || [];
    const actionsDisplayed = this.auditContainer?.querySelectorAll('.action-items') || [];
    
    if (eventsWithNotes.length === notesDisplayed.length && eventsWithActions.length === actionsDisplayed.length) {
      score += 5;
    } else {
      issues.push({
        category: 'data',
        severity: 'medium',
        description: 'Notes/action items display mismatch',
        expected: `${eventsWithNotes.length} notes, ${eventsWithActions.length} actions`,
        actual: `${notesDisplayed.length} notes, ${actionsDisplayed.length} actions`,
        fixRecommendation: 'Verify conditional rendering logic for notes and action items'
      });
    }

    return { score, maxScore, issues };
  }

  /**
   * Audit layout precision and positioning
   */
  private async auditLayoutPrecision(): Promise<{score: number; maxScore: number; issues: AuditIssue[]}> {
    const issues: AuditIssue[] = [];
    let score = 0;
    const maxScore = 15;

    // Test 1: Column layout accuracy (5 points)
    const mainContent = this.auditContainer?.querySelector('.main-content') as HTMLElement;
    const computedStyle = mainContent ? getComputedStyle(mainContent) : null;
    
    if (computedStyle?.display === 'grid') {
      score += 5;
    } else {
      issues.push({
        category: 'layout',
        severity: 'high',
        description: 'Main content not using CSS Grid',
        expected: 'display: grid',
        actual: computedStyle?.display || 'unknown',
        fixRecommendation: 'Ensure main-content uses CSS Grid for column layout'
      });
    }

    // Test 2: Time column width (5 points)
    const timeColumn = this.auditContainer?.querySelector('.time-column') as HTMLElement;
    const timeColumnWidth = timeColumn?.offsetWidth || 0;
    const expectedTimeColumnWidth = 90; // From specification
    
    if (Math.abs(timeColumnWidth - expectedTimeColumnWidth) <= 5) {
      score += 5;
    } else {
      issues.push({
        category: 'layout',
        severity: 'medium',
        description: 'Time column width incorrect',
        expected: `${expectedTimeColumnWidth}px`,
        actual: `${timeColumnWidth}px`,
        fixRecommendation: 'Adjust time-column CSS width to match specification'
      });
    }

    // Test 3: Appointment positioning (5 points)
    const appointments = this.auditContainer?.querySelectorAll('.appointment-block') || [];
    let positioningAccurate = true;
    
    appointments.forEach((appointment, index) => {
      const appointmentElement = appointment as HTMLElement;
      const topPosition = appointmentElement.offsetTop;
      const expectedTop = this.calculateExpectedPosition(appointmentElement);
      
      if (Math.abs(topPosition - expectedTop) > 10) { // 10px tolerance
        positioningAccurate = false;
        issues.push({
          category: 'layout',
          severity: 'high',
          description: `Appointment ${index + 1} positioning incorrect`,
          expected: `${expectedTop}px from top`,
          actual: `${topPosition}px from top`,
          fixRecommendation: 'Check appointment positioning calculation in renderAppointmentHTML'
        });
      }
    });
    
    if (positioningAccurate) score += 5;

    return { score, maxScore, issues };
  }

  /**
   * Audit typography and font rendering
   */
  private async auditTypography(): Promise<{score: number; maxScore: number; issues: AuditIssue[]}> {
    const issues: AuditIssue[] = [];
    let score = 0;
    const maxScore = 10;

    // Test 1: Font family consistency (5 points)
    const elements = [
      this.auditContainer?.querySelector('h1'),
      this.auditContainer?.querySelector('.time-slot'),
      this.auditContainer?.querySelector('.appointment-title'),
      this.auditContainer?.querySelector('.stat-value')
    ];
    
    let fontConsistent = true;
    elements.forEach(element => {
      if (element) {
        const fontFamily = getComputedStyle(element).fontFamily;
        if (!fontFamily.includes('Georgia')) {
          fontConsistent = false;
          issues.push({
            category: 'typography',
            severity: 'medium',
            description: `Element not using Georgia font: ${element.tagName}`,
            expected: 'Georgia, serif',
            actual: fontFamily,
            fixRecommendation: 'Ensure all elements inherit Georgia font family'
          });
        }
      }
    });
    
    if (fontConsistent) score += 5;

    // Test 2: Font size hierarchy (5 points)
    const titleElement = this.auditContainer?.querySelector('h1') as HTMLElement;
    const timeLabel = this.auditContainer?.querySelector('.time-slot') as HTMLElement;
    
    const titleSize = titleElement ? parseFloat(getComputedStyle(titleElement).fontSize) : 0;
    const timeLabelSize = timeLabel ? parseFloat(getComputedStyle(timeLabel).fontSize) : 0;
    
    if (titleSize > timeLabelSize && titleSize >= 24) { // Title should be larger and at least 24px
      score += 5;
    } else {
      issues.push({
        category: 'typography',
        severity: 'medium',
        description: 'Font size hierarchy incorrect',
        expected: 'Title > Time labels, Title >= 24px',
        actual: `Title: ${titleSize}px, Time: ${timeLabelSize}px`,
        fixRecommendation: 'Adjust font sizes to create proper hierarchy'
      });
    }

    return { score, maxScore, issues };
  }

  /**
   * Audit statistics accuracy and display
   */
  private async auditStatistics(date: Date, events: CalendarEvent[]): Promise<{score: number; maxScore: number; issues: AuditIssue[]}> {
    const issues: AuditIssue[] = [];
    let score = 0;
    const maxScore = 15;

    // Calculate expected statistics - filter events for the current day first
    const dayEvents = events.filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate.toDateString() === date.toDateString();
    });
    
    console.log(`🔍 Audit Statistics: ${dayEvents.length} events for ${date.toDateString()}`);
    
    const appointments = this.generator.convertCalendarEventsToAppointments(dayEvents);
    const dayAppointments = appointments;

    // Get week range
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay() + 1); // Monday
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6); // Sunday

    const weekEvents = events.filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate >= weekStart && eventDate <= weekEnd;
    });
    
    console.log(`🔍 Audit Statistics: ${weekEvents.length} events for week ${weekStart.toDateString()} to ${weekEnd.toDateString()}`);
    
    const weekAppointments = this.generator.convertCalendarEventsToAppointments(weekEvents);

    // Test 1: Daily appointment count (5 points)
    const dailyCountElement = this.auditContainer?.querySelector('.stat-value') as HTMLElement;
    const displayedDailyCount = dailyCountElement ? parseInt(dailyCountElement.textContent || '0') : 0;
    
    if (displayedDailyCount === dayAppointments.length) {
      score += 5;
    } else {
      issues.push({
        category: 'statistics',
        severity: 'high',
        description: 'Daily appointment count incorrect',
        expected: `${dayAppointments.length} appointments`,
        actual: `${displayedDailyCount} appointments`,
        fixRecommendation: 'Check daily appointment filtering logic'
      });
    }

    // Test 2: Weekly appointment count (5 points)
    const weeklyCountElements = this.auditContainer?.querySelectorAll('.stat-value') || [];
    const weeklyCountElement = weeklyCountElements[1] as HTMLElement;
    const displayedWeeklyCount = weeklyCountElement ? parseInt(weeklyCountElement.textContent || '0') : 0;
    
    if (displayedWeeklyCount === weekAppointments.length) {
      score += 5;
    } else {
      issues.push({
        category: 'statistics',
        severity: 'high',
        description: 'Weekly appointment count incorrect',
        expected: `${weekAppointments.length} appointments`,
        actual: `${displayedWeeklyCount} appointments`,
        fixRecommendation: 'Check weekly appointment filtering logic'
      });
    }

    // Test 3: Weekly utilization calculation (5 points)
    const weeklyHours = weekAppointments.reduce((total, apt) => {
      return total + (apt.duration_minutes / 60);
    }, 0);
    
    const businessHoursPerWeek = 7 * 17.5; // 7 days × 17.5 hours (6:00-23:30)
    const expectedUtilization = Math.round((weeklyHours / businessHoursPerWeek) * 100);
    
    const utilizationElements = this.auditContainer?.querySelectorAll('.stat-value') || [];
    const utilizationElement = utilizationElements[3] as HTMLElement;
    const displayedUtilization = utilizationElement ? parseInt(utilizationElement.textContent?.replace('%', '') || '0') : 0;
    
    if (Math.abs(displayedUtilization - expectedUtilization) <= 2) { // 2% tolerance
      score += 5;
    } else {
      issues.push({
        category: 'statistics',
        severity: 'medium',
        description: 'Weekly utilization calculation incorrect',
        expected: `${expectedUtilization}%`,
        actual: `${displayedUtilization}%`,
        fixRecommendation: 'Check weekly utilization calculation logic'
      });
    }

    return { score, maxScore, issues };
  }

  /**
   * Capture screenshots for visual comparison
   */
  private async captureScreenshots(): Promise<{html: string; canvas: string}> {
    if (!this.auditContainer) throw new Error('Audit container not initialized');

    // Capture HTML screenshot
    const htmlCanvas = await html2canvas(this.auditContainer, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#FAFAF7',
      logging: false
    });

    const htmlScreenshot = htmlCanvas.toDataURL('image/png');
    
    // For canvas screenshot, we'll use the same HTML canvas
    const canvasScreenshot = htmlScreenshot;

    return {
      html: htmlScreenshot,
      canvas: canvasScreenshot
    };
  }

  /**
   * Generate actionable recommendations based on issues
   */
  private generateRecommendations(issues: AuditIssue[]): string[] {
    const recommendations: string[] = [];
    
    // Group issues by category
    const categoryGroups = issues.reduce((groups, issue) => {
      if (!groups[issue.category]) groups[issue.category] = [];
      groups[issue.category].push(issue);
      return groups;
    }, {} as Record<string, AuditIssue[]>);

    // Generate category-specific recommendations
    Object.entries(categoryGroups).forEach(([category, categoryIssues]) => {
      const criticalIssues = categoryIssues.filter(issue => issue.severity === 'critical');
      const highIssues = categoryIssues.filter(issue => issue.severity === 'high');
      
      if (criticalIssues.length > 0) {
        recommendations.push(`CRITICAL ${category.toUpperCase()}: Address ${criticalIssues.length} critical issues immediately`);
      }
      
      if (highIssues.length > 0) {
        recommendations.push(`HIGH ${category.toUpperCase()}: Fix ${highIssues.length} high-priority issues`);
      }
    });

    // Add specific recommendations
    if (issues.some(issue => issue.category === 'data')) {
      recommendations.push('Review event filtering and data conversion logic');
    }
    
    if (issues.some(issue => issue.category === 'layout')) {
      recommendations.push('Verify CSS Grid implementation and positioning calculations');
    }
    
    if (issues.some(issue => issue.category === 'typography')) {
      recommendations.push('Ensure consistent font usage and proper size hierarchy');
    }
    
    if (issues.some(issue => issue.category === 'statistics')) {
      recommendations.push('Validate weekly statistics calculation and display logic');
    }

    return recommendations;
  }

  /**
   * Helper methods for calculations
   */
  private calculateTimeSlotHeight(): number {
    const timeSlots = this.auditContainer?.querySelectorAll('.time-slot') || [];
    if (timeSlots.length === 0) return 0;
    
    const firstSlot = timeSlots[0] as HTMLElement;
    return firstSlot.offsetHeight;
  }

  private calculateExpectedHeight(durationMinutes: number): number {
    const slotsNeeded = Math.ceil(durationMinutes / 30);
    const slotHeight = this.calculateTimeSlotHeight();
    return slotsNeeded * slotHeight;
  }

  private calculateExpectedPosition(appointmentElement: HTMLElement): number {
    // This would need to be implemented based on the specific positioning logic
    // For now, return the current position as a placeholder
    return appointmentElement.offsetTop;
  }

  private getAppointmentColor(): string {
    const appointmentElement = this.auditContainer?.querySelector('.appointment-block') as HTMLElement;
    if (!appointmentElement) return '';
    
    const style = getComputedStyle(appointmentElement);
    return style.backgroundColor || style.borderColor || '';
  }

  private async cleanupAuditContainer(): Promise<void> {
    if (this.auditContainer) {
      document.body.removeChild(this.auditContainer);
      this.auditContainer = null;
    }
  }
}

// Export function for browser console access
declare global {
  interface Window {
    runPixelPerfectAudit: (date: Date, events: CalendarEvent[]) => Promise<AuditResult>;
  }
}

export async function runPixelPerfectAudit(date: Date, events: CalendarEvent[]): Promise<AuditResult> {
  const audit = new PixelPerfectAudit();
  return await audit.runFullAudit(date, events);
}

// Make available globally
if (typeof window !== 'undefined') {
  window.runPixelPerfectAudit = runPixelPerfectAudit;
}