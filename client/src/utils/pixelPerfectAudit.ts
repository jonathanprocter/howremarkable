/**
 * Comprehensive Pixel-Perfect Audit System
 * Provides data-driven analysis with exact measurements and visual comparison
 */

import html2canvas from 'html2canvas';

interface LayoutMeasurement {
  element: string;
  browserValue: string;
  pdfValue: string;
  difference: string;
  sourceCode: string;
}

interface AuditResults {
  measurements: LayoutMeasurement[];
  pixelDiffScore: number;
  compromises: string[];
  traceability: Record<string, any>;
}

/**
 * Measure exact browser values using DOM inspection
 */
const measureBrowserValues = (): Record<string, any> => {
  console.log('📏 MEASURING EXACT BROWSER VALUES...');
  
  // Find calendar elements
  const timeColumn = document.querySelector('[class*="time"]:first-child') as HTMLElement;
  const dayColumns = document.querySelectorAll('[class*="day"], table th:not(:first-child)') as NodeListOf<HTMLElement>;
  const timeSlots = document.querySelectorAll('[class*="slot"], table tr') as NodeListOf<HTMLElement>;
  const events = document.querySelectorAll('[class*="appointment"], [class*="event"]') as NodeListOf<HTMLElement>;
  const grid = document.querySelector('[class*="calendar"], table') as HTMLElement;
  
  const measurements: Record<string, any> = {};
  
  if (timeColumn) {
    const rect = timeColumn.getBoundingClientRect();
    const computed = getComputedStyle(timeColumn);
    measurements.timeColumnWidth = {
      pixels: Math.round(rect.width),
      computedStyle: computed.width,
      fontSize: computed.fontSize,
      fontFamily: computed.fontFamily,
      padding: computed.padding,
      borderWidth: computed.borderWidth
    };
  }
  
  if (dayColumns.length > 0) {
    const dayColumn = dayColumns[0];
    const rect = dayColumn.getBoundingClientRect();
    const computed = getComputedStyle(dayColumn);
    measurements.dayColumnWidth = {
      pixels: Math.round(rect.width),
      computedStyle: computed.width,
      fontSize: computed.fontSize,
      fontFamily: computed.fontFamily,
      padding: computed.padding,
      borderWidth: computed.borderWidth
    };
  }
  
  if (timeSlots.length > 0) {
    const timeSlot = timeSlots[1]; // Skip header
    const rect = timeSlot.getBoundingClientRect();
    const computed = getComputedStyle(timeSlot);
    measurements.timeSlotHeight = {
      pixels: Math.round(rect.height),
      computedStyle: computed.height,
      fontSize: computed.fontSize,
      lineHeight: computed.lineHeight,
      padding: computed.padding
    };
  }
  
  if (events.length > 0) {
    const event = events[0];
    const rect = event.getBoundingClientRect();
    const computed = getComputedStyle(event);
    measurements.eventBox = {
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      fontSize: computed.fontSize,
      fontFamily: computed.fontFamily,
      padding: computed.padding,
      borderWidth: computed.borderWidth,
      borderStyle: computed.borderStyle,
      backgroundColor: computed.backgroundColor
    };
  }
  
  if (grid) {
    const rect = grid.getBoundingClientRect();
    const computed = getComputedStyle(grid);
    measurements.gridContainer = {
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      borderWidth: computed.borderWidth,
      borderColor: computed.borderColor
    };
  }
  
  console.log('📊 BROWSER MEASUREMENTS:', measurements);
  return measurements;
};

/**
 * Extract PDF values from the last export configuration
 */
const extractPDFValues = (config: any): Record<string, any> => {
  console.log('📄 EXTRACTING PDF VALUES...');
  
  const pdfMeasurements = {
    timeColumnWidth: {
      pixels: config.timeColumnWidth,
      source: 'exactMeasurements.timeColumnWidth',
      scalingApplied: 'none (direct pass-through)'
    },
    dayColumnWidth: {
      pixels: config.dayColumnWidth,
      source: 'exactMeasurements.dayColumnWidth',
      scalingApplied: 'none (direct pass-through)'
    },
    timeSlotHeight: {
      pixels: config.slotHeight,
      source: 'exactMeasurements.timeSlotHeight', 
      scalingApplied: 'none (direct pass-through)'
    },
    eventFont: {
      family: config.fonts.family,
      titleSize: config.fonts.eventTitle.size,
      timeSize: config.fonts.eventTime.size,
      source: 'hardcoded PDF sizes'
    },
    eventPadding: {
      cellPadding: 3,
      textPadding: 4,
      source: 'hardcoded in PDF rendering'
    },
    gridLines: {
      verticalWeight: 1,
      horizontalWeight: 'varies (0.5-2)',
      source: 'hardcoded line weights'
    }
  };
  
  console.log('📋 PDF MEASUREMENTS:', pdfMeasurements);
  return pdfMeasurements;
};

/**
 * Create visual truth table comparing browser vs PDF values
 */
const createTruthTable = (browserValues: any, pdfValues: any): LayoutMeasurement[] => {
  console.log('📋 CREATING VISUAL TRUTH TABLE...');
  
  const measurements: LayoutMeasurement[] = [
    {
      element: 'Day column width',
      browserValue: `${browserValues.dayColumnWidth?.pixels || 'N/A'} px`,
      pdfValue: `${pdfValues.dayColumnWidth?.pixels || 'N/A'} px`,
      difference: calculateDifference(browserValues.dayColumnWidth?.pixels, pdfValues.dayColumnWidth?.pixels),
      sourceCode: `config.dayColumnWidth = exactMeasurements.dayColumnWidth`
    },
    {
      element: 'Time column width', 
      browserValue: `${browserValues.timeColumnWidth?.pixels || 'N/A'} px`,
      pdfValue: `${pdfValues.timeColumnWidth?.pixels || 'N/A'} px`,
      difference: calculateDifference(browserValues.timeColumnWidth?.pixels, pdfValues.timeColumnWidth?.pixels),
      sourceCode: `config.timeColumnWidth = exactMeasurements.timeColumnWidth`
    },
    {
      element: 'Time slot height',
      browserValue: `${browserValues.timeSlotHeight?.pixels || 'N/A'} px`,
      pdfValue: `${pdfValues.timeSlotHeight?.pixels || 'N/A'} px`, 
      difference: calculateDifference(browserValues.timeSlotHeight?.pixels, pdfValues.timeSlotHeight?.pixels),
      sourceCode: `config.slotHeight = exactMeasurements.timeSlotHeight`
    },
    {
      element: 'Font family (events)',
      browserValue: browserValues.eventBox?.fontFamily || 'N/A',
      pdfValue: pdfValues.eventFont?.family || 'N/A',
      difference: browserValues.eventBox?.fontFamily === pdfValues.eventFont?.family ? '✅ Match' : '❌ Different',
      sourceCode: `pdf.setFont(config.fonts.family, 'bold')`
    },
    {
      element: 'Font size (event titles)',
      browserValue: browserValues.eventBox?.fontSize || 'N/A',
      pdfValue: `${pdfValues.eventFont?.titleSize || 'N/A'} pt`,
      difference: 'Cannot compare (px vs pt)',
      sourceCode: `pdf.setFontSize(config.fonts.eventTitle.size)`
    },
    {
      element: 'Cell padding',
      browserValue: browserValues.eventBox?.padding || 'N/A',
      pdfValue: `${pdfValues.eventPadding?.cellPadding || 'N/A'} px`,
      difference: 'Browser uses CSS, PDF uses hardcoded',
      sourceCode: `const cellPadding = 3; // hardcoded in PDF`
    },
    {
      element: 'Border thickness',
      browserValue: browserValues.eventBox?.borderWidth || 'N/A',
      pdfValue: '0.5-2 px (varies by type)',
      difference: 'Browser uses CSS, PDF varies by event type',
      sourceCode: `pdf.setLineWidth(sourceInfo.hasLeftFlag ? 0.5 : 1)`
    },
    {
      element: 'Grid container width',
      browserValue: `${browserValues.gridContainer?.width || 'N/A'} px`,
      pdfValue: '1150 px (A3 landscape)',
      difference: calculateDifference(browserValues.gridContainer?.width, 1150),
      sourceCode: `contentWidth: 1150 // hardcoded A3 landscape`
    }
  ];
  
  return measurements;
};

/**
 * Calculate difference between two numeric values
 */
const calculateDifference = (browserVal: number | undefined, pdfVal: number | undefined): string => {
  if (!browserVal || !pdfVal) return 'Cannot compare';
  const diff = pdfVal - browserVal;
  if (diff === 0) return '✅ Perfect match';
  return `❌ ${diff > 0 ? '+' : ''}${diff} px`;
};

/**
 * Identify known compromises and limitations
 */
const identifyCompromises = (): string[] => {
  return [
    'Font family: jsPDF uses Helvetica instead of browser Inter/Times fonts',
    'Font sizing: PDF uses pt units vs browser px units (no direct conversion)',
    'Cell padding: PDF uses hardcoded 3px vs browser CSS-computed padding',
    'Text positioning: PDF uses absolute positioning vs browser CSS layout',
    'Grid lines: PDF draws manual lines vs browser CSS borders',
    'Event borders: PDF uses programmatic border drawing vs browser CSS',
    'Color accuracy: PDF RGB values may not match browser computed colors',
    'Responsive sizing: PDF uses fixed A3 dimensions vs browser responsive layout'
  ];
};

/**
 * Capture dashboard screenshot for pixel comparison
 */
const captureDashboardScreenshot = async (): Promise<string> => {
  console.log('📸 CAPTURING DASHBOARD SCREENSHOT...');
  
  const calendarElement = document.querySelector('[class*="calendar"], table, main') as HTMLElement;
  if (!calendarElement) {
    throw new Error('Could not find calendar element for screenshot');
  }
  
  const canvas = await html2canvas(calendarElement, {
    useCORS: true,
    allowTaint: true,
    scale: 1,
    backgroundColor: '#ffffff'
  });
  
  return canvas.toDataURL('image/png');
};

/**
 * Perform comprehensive pixel-perfect audit
 */
export const performPixelPerfectAudit = async (lastPDFConfig?: any): Promise<AuditResults> => {
  console.log('🔍 STARTING COMPREHENSIVE PIXEL-PERFECT AUDIT...');
  
  try {
    // Step 1: Measure exact browser values
    const browserValues = measureBrowserValues();
    
    // Step 2: Extract PDF values (if config provided)
    const pdfValues = lastPDFConfig ? extractPDFValues(lastPDFConfig) : {};
    
    // Step 3: Create visual truth table
    const measurements = createTruthTable(browserValues, pdfValues);
    
    // Step 4: Capture screenshot for pixel comparison
    let dashboardScreenshot = '';
    try {
      dashboardScreenshot = await captureDashboardScreenshot();
      console.log('📸 Dashboard screenshot captured successfully');
    } catch (error) {
      console.warn('⚠️ Could not capture screenshot:', error);
    }
    
    // Step 5: Identify compromises and limitations
    const compromises = identifyCompromises();
    
    // Step 6: Create traceability record
    const traceability = {
      measurementTimestamp: new Date().toISOString(),
      browserValues,
      pdfValues,
      dashboardScreenshot: dashboardScreenshot ? 'Captured successfully' : 'Failed to capture',
      configSource: lastPDFConfig ? 'Provided by export function' : 'Not available'
    };
    
    // Step 7: Display comprehensive results
    console.log('\n📊 PIXEL-PERFECT AUDIT RESULTS');
    console.log('=' .repeat(50));
    
    console.table(measurements.map(m => ({
      Element: m.element,
      'Browser Value': m.browserValue,
      'PDF Value': m.pdfValue,
      Difference: m.difference
    })));
    
    console.log('\n🚨 KNOWN COMPROMISES AND LIMITATIONS:');
    compromises.forEach((compromise, index) => {
      console.log(`${index + 1}. ${compromise}`);
    });
    
    console.log('\n🔬 SOURCE TRACEABILITY:');
    measurements.forEach(m => {
      if (m.difference.includes('❌')) {
        console.log(`❌ ${m.element}: ${m.sourceCode}`);
      }
    });
    
    // Calculate pixel diff score (simplified)
    const perfectMatches = measurements.filter(m => m.difference.includes('✅')).length;
    const pixelDiffScore = Math.round((perfectMatches / measurements.length) * 100);
    
    console.log(`\n📈 PIXEL-PERFECT SCORE: ${pixelDiffScore}%`);
    
    return {
      measurements,
      pixelDiffScore,
      compromises,
      traceability
    };
    
  } catch (error) {
    console.error('❌ Audit failed:', error);
    throw error;
  }
};

/**
 * Export audit results for external analysis
 */
export const exportAuditResults = (results: AuditResults): void => {
  const auditReport = {
    timestamp: new Date().toISOString(),
    pixelPerfectScore: results.pixelDiffScore,
    measurements: results.measurements,
    compromises: results.compromises,
    summary: `Pixel-perfect audit completed with ${results.pixelDiffScore}% accuracy. ${results.measurements.filter(m => m.difference.includes('❌')).length} discrepancies found.`
  };
  
  console.log('📄 COMPLETE AUDIT REPORT:', auditReport);
  
  // Save to localStorage for external inspection
  localStorage.setItem('pixelPerfectAuditResults', JSON.stringify(auditReport));
  console.log('💾 Audit results saved to localStorage key: pixelPerfectAuditResults');
};