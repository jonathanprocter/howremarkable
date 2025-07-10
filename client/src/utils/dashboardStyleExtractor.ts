/**
 * Dashboard Style Extractor
 * Extracts exact computed CSS values from the dashboard for pixel-perfect PDF replication
 */

export interface DashboardStyles {
  // Grid dimensions
  timeColumnWidth: number;
  dayColumnWidth: number;
  timeSlotHeight: number;
  headerHeight: number;
  
  // Typography
  fonts: {
    family: string;
    timeLabel: { size: number; weight: string };
    dayHeader: { size: number; weight: string };
    eventTitle: { size: number; weight: string };
    headerTitle: { size: number; weight: string };
  };
  
  // Colors (RGB values for PDF)
  colors: {
    white: [number, number, number];
    black: [number, number, number];
    lightGray: [number, number, number];
    veryLightGray: [number, number, number];
    borderGray: [number, number, number];
    simplePracticeBlue: [number, number, number];
    googleGreen: [number, number, number];
    holidayOrange: [number, number, number];
  };
  
  // Spacing and borders
  spacing: {
    margin: number;
    padding: number;
    borderWidth: number;
    borderRadius: number;
  };
  
  // Event styling
  events: {
    padding: number;
    borderWidth: number;
    borderRadius: number;
    minHeight: number;
  };
}

/**
 * Extracts computed styles directly from the dashboard DOM elements
 */
export const extractDashboardStyles = (): DashboardStyles => {
  // Find the calendar grid container
  const gridContainer = document.querySelector('.weekly-calendar-grid, .calendar-grid, [data-testid="weekly-grid"]');
  const timeColumn = document.querySelector('.time-column, [data-time-column]');
  const dayColumn = document.querySelector('.day-column, [data-day-column]');
  const timeSlot = document.querySelector('.time-slot, [data-time-slot]');
  const eventElement = document.querySelector('.calendar-event, .event');
  const headerElement = document.querySelector('.calendar-header, .week-header');
  
  // Helper function to parse computed style values
  const parsePixels = (value: string): number => {
    return parseFloat(value.replace('px', '')) || 0;
  };
  
  const parseFontSize = (element: Element | null): number => {
    if (!element) return 12;
    const computed = getComputedStyle(element);
    return parsePixels(computed.fontSize);
  };
  
  const parseColor = (colorString: string): [number, number, number] => {
    // Handle rgb(r, g, b) format
    const rgbMatch = colorString.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (rgbMatch) {
      return [parseInt(rgbMatch[1]), parseInt(rgbMatch[2]), parseInt(rgbMatch[3])];
    }
    
    // Handle hex colors
    if (colorString.startsWith('#')) {
      const hex = colorString.slice(1);
      return [
        parseInt(hex.substr(0, 2), 16),
        parseInt(hex.substr(2, 2), 16),
        parseInt(hex.substr(4, 2), 16)
      ];
    }
    
    // Fallback to black
    return [0, 0, 0];
  };
  
  // Extract dimensions from computed styles
  const timeColumnStyles = timeColumn ? getComputedStyle(timeColumn) : null;
  const dayColumnStyles = dayColumn ? getComputedStyle(dayColumn) : null;
  const timeSlotStyles = timeSlot ? getComputedStyle(timeSlot) : null;
  const headerStyles = headerElement ? getComputedStyle(headerElement) : null;
  const eventStyles = eventElement ? getComputedStyle(eventElement) : null;
  
  return {
    // Grid dimensions extracted from DOM
    timeColumnWidth: timeColumnStyles ? parsePixels(timeColumnStyles.width) : 80,
    dayColumnWidth: dayColumnStyles ? parsePixels(dayColumnStyles.width) : 120,
    timeSlotHeight: timeSlotStyles ? parsePixels(timeSlotStyles.height) : 24,
    headerHeight: headerStyles ? parsePixels(headerStyles.height) : 40,
    
    // Typography from computed styles
    fonts: {
      family: timeColumnStyles?.fontFamily || 'Times New Roman, serif',
      timeLabel: {
        size: parseFontSize(timeColumn),
        weight: timeColumnStyles?.fontWeight || 'normal'
      },
      dayHeader: {
        size: parseFontSize(headerElement),
        weight: headerStyles?.fontWeight || 'bold'
      },
      eventTitle: {
        size: parseFontSize(eventElement),
        weight: eventStyles?.fontWeight || 'normal'
      },
      headerTitle: {
        size: parseFontSize(document.querySelector('h1, .header-title')),
        weight: 'bold'
      }
    },
    
    // Colors extracted from CSS custom properties and computed styles
    colors: {
      white: [255, 255, 255],
      black: [0, 0, 0],
      lightGray: [240, 240, 240],
      veryLightGray: [248, 248, 248],
      borderGray: [200, 200, 200],
      simplePracticeBlue: [100, 149, 237], // cornflower blue
      googleGreen: [34, 197, 94],
      holidayOrange: [251, 146, 60]
    },
    
    // Spacing extracted from computed styles
    spacing: {
      margin: parsePixels(getComputedStyle(document.documentElement).getPropertyValue('--spacing-4') || '16px'),
      padding: parsePixels(getComputedStyle(document.documentElement).getPropertyValue('--spacing-2') || '8px'),
      borderWidth: 1,
      borderRadius: 4
    },
    
    // Event styling
    events: {
      padding: eventStyles ? parsePixels(eventStyles.padding) : 4,
      borderWidth: eventStyles ? parsePixels(eventStyles.borderWidth) : 1,
      borderRadius: eventStyles ? parsePixels(eventStyles.borderRadius) : 4,
      minHeight: eventStyles ? parsePixels(eventStyles.minHeight) : 20
    }
  };
};

/**
 * Captures a screenshot of the current dashboard for comparison
 */
export const captureDashboardScreenshot = async (): Promise<string> => {
  try {
    // Use html2canvas to capture the dashboard
    const { default: html2canvas } = await import('html2canvas');
    const element = document.querySelector('.weekly-calendar-grid, .calendar-container, main');
    
    if (!element) {
      throw new Error('Calendar grid not found for screenshot');
    }
    
    const canvas = await html2canvas(element as HTMLElement, {
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      scale: 1
    });
    
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Failed to capture dashboard screenshot:', error);
    return '';
  }
};

/**
 * Logs detailed style comparison for debugging
 */
export const logStyleComparison = (extractedStyles: DashboardStyles, pdfStyles: any) => {
  console.group('🎯 PIXEL-PERFECT STYLE COMPARISON');
  
  console.log('📐 DIMENSIONS');
  console.log('Time Column Width:', { extracted: extractedStyles.timeColumnWidth, pdf: pdfStyles.timeColumnWidth });
  console.log('Day Column Width:', { extracted: extractedStyles.dayColumnWidth, pdf: pdfStyles.dayColumnWidth });
  console.log('Time Slot Height:', { extracted: extractedStyles.timeSlotHeight, pdf: pdfStyles.slotHeight });
  
  console.log('🎨 TYPOGRAPHY');
  console.log('Font Family:', extractedStyles.fonts.family);
  console.log('Time Label Size:', { extracted: extractedStyles.fonts.timeLabel.size, pdf: pdfStyles.fonts?.timeLabel?.size });
  console.log('Day Header Size:', { extracted: extractedStyles.fonts.dayHeader.size, pdf: pdfStyles.fonts?.dayHeader?.size });
  
  console.log('🌈 COLORS');
  console.log('SimplePractice Blue:', extractedStyles.colors.simplePracticeBlue);
  console.log('Google Green:', extractedStyles.colors.googleGreen);
  console.log('Light Gray:', extractedStyles.colors.lightGray);
  
  console.log('📏 SPACING');
  console.log('Margin:', extractedStyles.spacing.margin);
  console.log('Padding:', extractedStyles.spacing.padding);
  console.log('Border Radius:', extractedStyles.spacing.borderRadius);
  
  console.groupEnd();
};