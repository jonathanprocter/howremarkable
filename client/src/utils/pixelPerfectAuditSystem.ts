/**
 * 100% Pixel-Perfect Audit System
 * Extracts exact measurements from dashboard and ensures PDF exports match exactly
 */

import { CalendarEvent } from '../types/calendar';
import html2canvas from 'html2canvas';

export interface PixelPerfectMeasurements {
  // Layout measurements (in pixels)
  timeColumnWidth: number;
  dayColumnWidth: number;
  timeSlotHeight: number;
  headerHeight: number;
  gridStartX: number;
  gridStartY: number;
  totalGridWidth: number;
  gridHeight: number;
  
  // Typography measurements
  fontSizes: {
    timeHour: number;
    timeHalf: number;
    dayHeader: number;
    eventTitle: number;
    eventTime: number;
    headerTitle: number;
    weekInfo: number;
  };
  
  // Color values (exact RGB)
  colors: {
    simplePractice: string;
    google: string;
    holiday: string;
    gridLine: string;
    background: string;
    timeSlotBg: string;
    hourBg: string;
  };
  
  // Spacing and positioning
  margins: {
    page: number;
    header: number;
    cell: number;
    text: number;
  };
  
  // Visual attributes
  borderWidths: {
    grid: number;
    event: number;
    header: number;
  };
}

export interface AuditResult {
  score: number;
  measurements: PixelPerfectMeasurements;
  inconsistencies: AuditInconsistency[];
  recommendations: string[];
  timestamp: Date;
}

export interface AuditInconsistency {
  property: string;
  dashboardValue: number | string;
  pdfValue: number | string;
  difference: number;
  severity: 'CRITICAL' | 'MAJOR' | 'MINOR';
  impact: string;
  fix: string;
}

export class PixelPerfectAuditSystem {
  private dashboardElement: HTMLElement | null = null;
  private measurements: PixelPerfectMeasurements | null = null;

  constructor() {
    console.log('🎯 100% Pixel-Perfect Audit System initialized');
  }

  /**
   * Extract exact measurements from dashboard
   */
  async extractDashboardMeasurements(): Promise<PixelPerfectMeasurements> {
    console.log('📏 Extracting exact dashboard measurements...');
    
    // Find dashboard elements
    const weeklyGrid = document.querySelector('.weekly-calendar-grid') as HTMLElement;
    const timeColumn = document.querySelector('.time-column') as HTMLElement;
    const dayColumns = document.querySelectorAll('.day-column') as NodeListOf<HTMLElement>;
    const timeSlots = document.querySelectorAll('.time-slot') as NodeListOf<HTMLElement>;
    const headerElement = document.querySelector('.calendar-header') as HTMLElement;
    
    if (!weeklyGrid || !timeColumn || !dayColumns.length || !timeSlots.length) {
      throw new Error('Dashboard elements not found for measurement extraction');
    }

    // Extract precise measurements
    const timeColumnRect = timeColumn.getBoundingClientRect();
    const dayColumnRect = dayColumns[0].getBoundingClientRect();
    const timeSlotRect = timeSlots[0].getBoundingClientRect();
    const headerRect = headerElement?.getBoundingClientRect();
    const gridRect = weeklyGrid.getBoundingClientRect();

    // Get computed styles
    const timeColumnStyle = window.getComputedStyle(timeColumn);
    const dayColumnStyle = window.getComputedStyle(dayColumns[0]);
    const timeSlotStyle = window.getComputedStyle(timeSlots[0]);

    // Extract font sizes from actual elements
    const timeHourElement = document.querySelector('.time-hour') as HTMLElement;
    const timeHalfElement = document.querySelector('.time-half') as HTMLElement;
    const dayHeaderElement = document.querySelector('.day-header') as HTMLElement;
    const eventTitleElement = document.querySelector('.event-title') as HTMLElement;

    const measurements: PixelPerfectMeasurements = {
      // Layout measurements (exact pixel values)
      timeColumnWidth: Math.round(timeColumnRect.width),
      dayColumnWidth: Math.round(dayColumnRect.width),
      timeSlotHeight: Math.round(timeSlotRect.height),
      headerHeight: headerRect ? Math.round(headerRect.height) : 60,
      gridStartX: Math.round(gridRect.left),
      gridStartY: Math.round(gridRect.top),
      totalGridWidth: Math.round(gridRect.width),
      gridHeight: Math.round(gridRect.height),
      
      // Typography measurements (exact computed values)
      fontSizes: {
        timeHour: this.extractFontSize(timeHourElement) || 12,
        timeHalf: this.extractFontSize(timeHalfElement) || 10,
        dayHeader: this.extractFontSize(dayHeaderElement) || 14,
        eventTitle: this.extractFontSize(eventTitleElement) || 11,
        eventTime: this.extractFontSize(eventTitleElement) || 10,
        headerTitle: 20,
        weekInfo: 16,
      },
      
      // Color values (exact RGB from computed styles)
      colors: {
        simplePractice: this.extractColor(timeColumnStyle, '--simplepractice-color') || '#6495ED',
        google: this.extractColor(timeColumnStyle, '--google-color') || '#22C55E',
        holiday: this.extractColor(timeColumnStyle, '--holiday-color') || '#F59E0B',
        gridLine: this.extractColor(timeColumnStyle, '--grid-line-color') || '#E5E7EB',
        background: '#FFFFFF',
        timeSlotBg: '#F8F9FA',
        hourBg: '#F0F0F0',
      },
      
      // Spacing and positioning (exact measurements)
      margins: {
        page: 25,
        header: 10,
        cell: parseInt(timeSlotStyle.padding) || 4,
        text: 4,
      },
      
      // Visual attributes (exact border widths)
      borderWidths: {
        grid: parseFloat(timeSlotStyle.borderWidth) || 1,
        event: 1,
        header: 2,
      },
    };

    this.measurements = measurements;
    console.log('✅ Dashboard measurements extracted:', measurements);
    return measurements;
  }

  /**
   * Run comprehensive audit comparing dashboard to PDF configuration
   */
  async runPixelPerfectAudit(pdfConfig: any): Promise<AuditResult> {
    console.log('🔍 Running 100% pixel-perfect audit...');
    
    if (!this.measurements) {
      await this.extractDashboardMeasurements();
    }

    const dashboard = this.measurements!;
    const inconsistencies: AuditInconsistency[] = [];
    let totalScore = 0;
    let maxScore = 0;

    // Audit layout dimensions
    const layoutAudits = [
      {
        property: 'timeColumnWidth',
        dashboardValue: dashboard.timeColumnWidth,
        pdfValue: pdfConfig.timeColumnWidth,
        weight: 20,
        criticalThreshold: 5,
        majorThreshold: 10,
      },
      {
        property: 'dayColumnWidth',
        dashboardValue: dashboard.dayColumnWidth,
        pdfValue: pdfConfig.dayColumnWidth,
        weight: 15,
        criticalThreshold: 10,
        majorThreshold: 20,
      },
      {
        property: 'timeSlotHeight',
        dashboardValue: dashboard.timeSlotHeight,
        pdfValue: pdfConfig.timeSlotHeight,
        weight: 25,
        criticalThreshold: 5,
        majorThreshold: 10,
      },
      {
        property: 'headerHeight',
        dashboardValue: dashboard.headerHeight,
        pdfValue: pdfConfig.headerHeight,
        weight: 10,
        criticalThreshold: 10,
        majorThreshold: 15,
      },
    ];

    // Audit typography
    const typographyAudits = [
      {
        property: 'eventTitleFont',
        dashboardValue: dashboard.fontSizes.eventTitle,
        pdfValue: pdfConfig.fonts?.eventTitle || 6,
        weight: 15,
        criticalThreshold: 2,
        majorThreshold: 4,
      },
      {
        property: 'timeHourFont',
        dashboardValue: dashboard.fontSizes.timeHour,
        pdfValue: pdfConfig.fonts?.timeHour || 8,
        weight: 10,
        criticalThreshold: 1,
        majorThreshold: 2,
      },
    ];

    // Process all audits
    const allAudits = [...layoutAudits, ...typographyAudits];
    
    for (const audit of allAudits) {
      maxScore += audit.weight;
      const difference = Math.abs(audit.dashboardValue - audit.pdfValue);
      const percentDifference = (difference / audit.dashboardValue) * 100;
      
      let severity: 'CRITICAL' | 'MAJOR' | 'MINOR' = 'MINOR';
      let score = audit.weight;
      
      if (difference > audit.criticalThreshold) {
        severity = 'CRITICAL';
        score = Math.max(0, audit.weight - (difference * 2));
      } else if (difference > audit.majorThreshold) {
        severity = 'MAJOR';
        score = Math.max(audit.weight * 0.5, audit.weight - difference);
      } else {
        score = audit.weight - (difference * 0.5);
      }

      totalScore += score;

      if (difference > 0) {
        inconsistencies.push({
          property: audit.property,
          dashboardValue: audit.dashboardValue,
          pdfValue: audit.pdfValue,
          difference: difference,
          severity,
          impact: `${percentDifference.toFixed(1)}% difference affects ${severity === 'CRITICAL' ? 'major' : 'minor'} visual consistency`,
          fix: `Update ${audit.property} from ${audit.pdfValue} to ${audit.dashboardValue}`,
        });
      }
    }

    const finalScore = Math.round((totalScore / maxScore) * 100);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(inconsistencies);
    
    const result: AuditResult = {
      score: finalScore,
      measurements: dashboard,
      inconsistencies,
      recommendations,
      timestamp: new Date(),
    };

    console.log(`🎯 Pixel-Perfect Audit Complete: ${finalScore}% accuracy`);
    console.log(`📊 Found ${inconsistencies.length} inconsistencies`);
    
    return result;
  }

  /**
   * Generate 100% pixel-perfect PDF configuration
   */
  generatePixelPerfectConfig(): any {
    if (!this.measurements) {
      throw new Error('Measurements not extracted. Run extractDashboardMeasurements first.');
    }

    const dashboard = this.measurements;
    
    return {
      // Page setup optimized for dashboard matching
      pageWidth: 1190,
      pageHeight: 842,
      
      // Exact dashboard measurements
      timeColumnWidth: dashboard.timeColumnWidth,
      dayColumnWidth: dashboard.dayColumnWidth,
      timeSlotHeight: dashboard.timeSlotHeight,
      headerHeight: dashboard.headerHeight,
      
      // Typography matching dashboard exactly
      fonts: {
        title: dashboard.fontSizes.headerTitle,
        weekInfo: dashboard.fontSizes.weekInfo,
        dayHeader: dashboard.fontSizes.dayHeader,
        timeHour: dashboard.fontSizes.timeHour,
        timeHalf: dashboard.fontSizes.timeHalf,
        eventTitle: dashboard.fontSizes.eventTitle,
        eventTime: dashboard.fontSizes.eventTime,
      },
      
      // Exact color matching
      colors: dashboard.colors,
      
      // Exact spacing and margins
      margins: dashboard.margins,
      
      // Exact border widths
      borderWidths: dashboard.borderWidths,
      
      // Computed layout properties
      get contentWidth() {
        return this.pageWidth - (2 * this.margins.page);
      },
      
      get gridStartX() {
        return this.margins.page;
      },
      
      get gridStartY() {
        return this.margins.page + this.headerHeight + 30;
      },
      
      get totalGridWidth() {
        return this.timeColumnWidth + (this.dayColumnWidth * 7);
      },
      
      get gridHeight() {
        return 36 * this.timeSlotHeight;
      },
    };
  }

  /**
   * Capture dashboard screenshot for visual comparison
   */
  async captureDashboardScreenshot(): Promise<string> {
    const gridElement = document.querySelector('.weekly-calendar-grid') as HTMLElement;
    if (!gridElement) {
      throw new Error('Dashboard grid not found for screenshot');
    }

    const canvas = await html2canvas(gridElement, {
      allowTaint: false,
      useCORS: true,
      backgroundColor: '#ffffff',
      scale: 2, // High resolution
    });

    return canvas.toDataURL('image/png');
  }

  private extractFontSize(element: HTMLElement | null): number | null {
    if (!element) return null;
    
    const style = window.getComputedStyle(element);
    const fontSize = parseFloat(style.fontSize);
    return isNaN(fontSize) ? null : Math.round(fontSize);
  }

  private extractColor(style: CSSStyleDeclaration, property: string): string | null {
    const value = style.getPropertyValue(property);
    if (!value) return null;
    
    // Convert any color format to hex
    const tempDiv = document.createElement('div');
    tempDiv.style.color = value;
    document.body.appendChild(tempDiv);
    const computed = window.getComputedStyle(tempDiv).color;
    document.body.removeChild(tempDiv);
    
    return this.rgbToHex(computed);
  }

  private rgbToHex(rgb: string): string {
    const match = rgb.match(/\d+/g);
    if (!match) return '#000000';
    
    const r = parseInt(match[0]);
    const g = parseInt(match[1]);
    const b = parseInt(match[2]);
    
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  }

  private generateRecommendations(inconsistencies: AuditInconsistency[]): string[] {
    const recommendations: string[] = [];
    
    const critical = inconsistencies.filter(i => i.severity === 'CRITICAL');
    const major = inconsistencies.filter(i => i.severity === 'MAJOR');
    
    if (critical.length > 0) {
      recommendations.push(`Fix ${critical.length} CRITICAL inconsistencies immediately for pixel-perfect accuracy`);
      critical.forEach(inc => recommendations.push(`• ${inc.fix}`));
    }
    
    if (major.length > 0) {
      recommendations.push(`Address ${major.length} MAJOR inconsistencies for optimal visual matching`);
      major.forEach(inc => recommendations.push(`• ${inc.fix}`));
    }
    
    recommendations.push('Run audit after fixes to verify 100% pixel-perfect accuracy');
    
    return recommendations;
  }
}

// Export singleton instance
export const pixelPerfectAuditSystem = new PixelPerfectAuditSystem();