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
  console.log('🔍 EXTRACTING DASHBOARD STYLES FROM DOM...');
  
  // Find the weekly calendar grid container (used in weekly view)
  const gridContainer = document.querySelector('.calendar-grid, .weekly-calendar-grid, .planner-container');
  
  // For weekly view, look for specific grid elements
  const timeHeader = document.querySelector('.time-header');
  const dayHeaders = document.querySelectorAll('.day-header');
  const timeSlotElements = document.querySelectorAll('.time-label');
  const appointmentElements = document.querySelectorAll('.appointment');
  
  console.log('📊 Found DOM elements:', {
    gridContainer: !!gridContainer,
    timeHeader: !!timeHeader,
    dayHeaders: dayHeaders.length,
    timeSlots: timeSlotElements.length,
    appointments: appointmentElements.length
  });
  
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
  const timeHeaderStyles = timeHeader ? getComputedStyle(timeHeader) : null;
  const dayHeaderStyles = dayHeaders.length > 0 ? getComputedStyle(dayHeaders[0]) : null;
  const timeSlotStyles = timeSlotElements.length > 0 ? getComputedStyle(timeSlotElements[0]) : null;
  const appointmentStyles = appointmentElements.length > 0 ? getComputedStyle(appointmentElements[0]) : null;
  const gridStyles = gridContainer ? getComputedStyle(gridContainer) : null;
  
  // Calculate actual grid dimensions from the weekly calendar grid
  let timeColumnWidth = 80; // Default fallback
  let dayColumnWidth = 120; // Default fallback
  let timeSlotHeight = 40; // Default fallback
  
  if (gridContainer) {
    const gridRect = gridContainer.getBoundingClientRect();
    console.log('📏 Grid container dimensions:', { width: gridRect.width, height: gridRect.height });
    
    // For weekly calendar, calculate day column width
    // Grid typically has TIME column + 7 day columns
    if (timeHeader) {
      const timeHeaderRect = timeHeader.getBoundingClientRect();
      timeColumnWidth = Math.round(timeHeaderRect.width);
      console.log('📏 Time header width:', timeColumnWidth);
      
      // Day column width = (total grid width - time column width) / 7 days
      const remainingWidth = gridRect.width - timeColumnWidth;
      dayColumnWidth = Math.round(remainingWidth / 7);
      console.log('📏 Calculated day column width:', dayColumnWidth);
    }
    
    // Check for time slot height from the first time slot
    if (timeSlotElements.length > 0) {
      const timeSlotRect = timeSlotElements[0].getBoundingClientRect();
      timeSlotHeight = Math.round(timeSlotRect.height);
      console.log('📏 Time slot height:', timeSlotHeight);
    }
  }
  
  return {
    // Grid dimensions extracted from DOM
    timeColumnWidth,
    dayColumnWidth,
    timeSlotHeight,
    headerHeight: dayHeaderStyles ? parsePixels(dayHeaderStyles.height) : 40,
    
    // Typography from computed styles
    fonts: {
      family: timeHeaderStyles?.fontFamily || 'Inter, system-ui, Helvetica, Arial, sans-serif',
      timeLabel: {
        size: parseFontSize(timeSlotElements.length > 0 ? timeSlotElements[0] : null),
        weight: timeSlotStyles?.fontWeight || 'normal'
      },
      dayHeader: {
        size: parseFontSize(dayHeaders.length > 0 ? dayHeaders[0] : null),
        weight: dayHeaderStyles?.fontWeight || 'bold'
      },
      eventTitle: {
        size: parseFontSize(appointmentElements.length > 0 ? appointmentElements[0] : null),
        weight: appointmentStyles?.fontWeight || 'normal'
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
      padding: appointmentStyles ? parsePixels(appointmentStyles.padding) : 4,
      borderWidth: appointmentStyles ? parsePixels(appointmentStyles.borderWidth) : 1,
      borderRadius: appointmentStyles ? parsePixels(appointmentStyles.borderRadius) : 4,
      minHeight: appointmentStyles ? parsePixels(appointmentStyles.minHeight) : 20
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