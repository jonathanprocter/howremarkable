import { Button } from '@/components/ui/button';
import { runPixelPerfectAudit } from '@/utils/pixelPerfectAudit';
import { pdfPerfectionTester } from '@/utils/pdfPerfectionTest';
import { pixelPerfectReviewer } from '@/utils/pixelPerfectReview';
import { comprehensivePixelAnalyzer } from '@/utils/comprehensivePixelAnalysis';
import { exportPixelPerfectPDF } from '@/utils/pixelPerfectPDFExportFixed';
import { exportExactGridPDF } from '../../utils/exactGridPDFExport';
import { exportDailyToPDF } from '../../utils/dailyPDFExport';

interface ExportToPDFProps {
  isGoogleConnected: boolean;
  onExportCurrentView: (type?: string) => void;
  onExportWeeklyPackage: () => void;
  onExportDailyView: () => void;
  onExportFullMonth: () => void;
  onExportToGoogleDrive: (type: string) => void;
}

export const ExportToPDF = ({
  isGoogleConnected,
  onExportCurrentView,
  onExportWeeklyPackage,
  onExportDailyView,
  onExportFullMonth,
  onExportToGoogleDrive
}: ExportToPDFProps) => {
  console.log('🔧 ExportToPDF component rendered');
  console.log('🔧 onExportCurrentView:', typeof onExportCurrentView);
  console.log('🔧 onExportDailyView:', typeof onExportDailyView);

  // Make the export function globally available for testing
  (window as any).testDailyExport = () => {
    console.log('🚀 GLOBAL TEST EXPORT CALLED!');
    onExportCurrentView('Daily View');
  };

  // Also make it available with a simple name
  (window as any).export = () => {
    console.log('🚀 SIMPLE EXPORT CALLED!');
    onExportCurrentView('Daily View');
  };

  // Add simple PDF export test
  (window as any).testSimplePDF = async () => {
    try {
      console.log('🧪 Testing Simple PDF Export');

      // Import the simple PDF export function
      const { exportSimplePDF } = await import('../../utils/simplePDFExport');

      // Use current date and get events for today
      const testDate = new Date();
      const events = (window as any).currentEvents || [];
      const todayEvents = events.filter(event => {
        const eventDate = new Date(event.startTime);
        return eventDate.toDateString() === testDate.toDateString();
      });

      console.log('Exporting Simple PDF for date:', testDate.toDateString());
      console.log('Events for this date:', todayEvents.length);

      await exportSimplePDF(testDate, todayEvents);

      console.log('✅ Simple PDF test completed successfully');

    } catch (error) {
      console.error('❌ Simple PDF test failed:', error);
    }
  };

  // Add pixel-perfect review function
  (window as any).runPixelPerfectReview = async () => {
    try {
      console.log('🔍 Running Pixel-Perfect Review');

      // Use current date and get events
      const testDate = new Date();
      const events = (window as any).currentEvents || [];

      console.log('Reviewing for date:', testDate.toDateString());
      console.log('Events for analysis:', events.length);

      const results = await pixelPerfectReviewer.runPixelPerfectReview(testDate, events);

      console.log('\n🎯 PIXEL-PERFECT REVIEW RESULTS:');
      console.log('='.repeat(80));
      console.log(`📊 Overall Score: ${results.overallScore}/${results.maxScore} (${results.percentage}%)`);
      console.log(`🔧 Issues Found: ${results.issues.length}`);
      console.log(`💡 Recommendations: ${results.recommendations.length}`);

      if (results.issues.length > 0) {
        console.log('\n❌ ISSUES FOUND:');
        results.issues.forEach((issue, index) => {
          console.log(`${index + 1}. [${issue.severity.toUpperCase()}] ${issue.description}`);
          console.log(`   Expected: ${issue.expected}`);
          console.log(`   Actual: ${issue.actual}`);
          console.log(`   Fix: ${issue.fixRecommendation}\n`);
        });
      }

      if (results.recommendations.length > 0) {
        console.log('\n💡 RECOMMENDATIONS:');
        results.recommendations.forEach((rec, index) => {
          console.log(`${index + 1}. ${rec}`);
        });
      }

      console.log('\n📊 OVERLAY ANALYSIS:');
      console.log(`Grid Alignment: ${results.visualComparison.overlayAnalysis.gridAlignment}%`);
      console.log(`Text Alignment: ${results.visualComparison.overlayAnalysis.textAlignment}%`);
      console.log(`Color Accuracy: ${results.visualComparison.overlayAnalysis.colorAccuracy}%`);
      console.log(`Spacing Consistency: ${results.visualComparison.overlayAnalysis.spacingConsistency}%`);
      console.log(`Element Positioning: ${results.visualComparison.overlayAnalysis.elementPositioning}%`);

      // Save results to localStorage
      localStorage.setItem('pixelPerfectReviewResults', JSON.stringify(results));

      console.log('✅ Pixel-Perfect Review completed successfully');

      return results;

    } catch (error) {
      console.error('❌ Pixel-Perfect Review failed:', error);
    }
  };

  // Add comprehensive pixel analysis function
  (window as any).runComprehensivePixelAnalysis = async () => {
    try {
      console.log('🔍 Running Comprehensive Pixel Analysis');

      // Use current date and get events
      const testDate = new Date();
      const events = (window as any).currentEvents || [];

      console.log('Analyzing for date:', testDate.toDateString());
      console.log('Events for analysis:', events.length);

      const results = await comprehensivePixelAnalyzer.runComprehensiveAnalysis(testDate, events);

      console.log('\n🎯 COMPREHENSIVE PIXEL ANALYSIS RESULTS:');
      console.log('='.repeat(100));
      console.log(`📊 Overall Score: ${results.overallScore}/${results.maxScore} (${results.percentage}%)`);
      console.log(`🔧 Issues Found: ${results.issues.length}`);
      console.log(`💡 Recommendations: ${results.recommendations.length}`);

      console.log('\n📏 DETAILED MEASUREMENTS:');
      console.log('Dashboard Measurements:', results.measurements.dashboard);
      console.log('Expected PDF Measurements:', results.measurements.expectedPDF);
      console.log('Measurement Differences:', results.measurements.differences);

      if (results.issues.length > 0) {
        console.log('\n❌ DETAILED ISSUES:');
        results.issues.forEach((issue, index) => {
          console.log(`${index + 1}. [${issue.severity.toUpperCase()}] ${issue.description}`);
          console.log(`   Dashboard: ${issue.dashboardValue}`);
          console.log(`   Expected PDF: ${issue.expectedPDFValue}`);
          console.log(`   Difference: ${issue.actualDifference}`);
          console.log(`   Impact Score: ${issue.impactScore}/100`);
          console.log(`   Fix: ${issue.fixRecommendation}`);
          console.log(`   Code Location: ${issue.codeLocation}\n`);
        });
      }

      if (results.recommendations.length > 0) {
        console.log('\n💡 COMPREHENSIVE RECOMMENDATIONS:');
        results.recommendations.forEach((rec, index) => {
          console.log(`${index + 1}. ${rec}`);
        });
      }

      // Save results to localStorage
      localStorage.setItem('comprehensivePixelAnalysisResults', JSON.stringify(results));

      console.log('✅ Comprehensive Pixel Analysis completed successfully');

      return results;

    } catch (error) {
      console.error('❌ Comprehensive Pixel Analysis failed:', error);
    }
  };

  // Add pixel-perfect PDF export function
  (window as any).exportPixelPerfectPDF = async () => {
    try {
      console.log('🎯 Running Pixel-Perfect PDF Export');

      // Use current date and get events
      const testDate = new Date();
      const events = (window as any).currentEvents || [];
      const todayEvents = events.filter(event => {
        const eventDate = new Date(event.startTime);
        return eventDate.toDateString() === testDate.toDateString();
      });

      console.log('Exporting for date:', testDate.toDateString());
      console.log('Events for export:', todayEvents.length);

      await exportPixelPerfectPDF(testDate, todayEvents);

      console.log('✅ Pixel-Perfect PDF Export completed successfully');

    } catch (error) {
      console.error('❌ Pixel-Perfect PDF Export failed:', error);
    }
  };

  // Add pixel-perfect audit test function
  (window as any).testPixelPerfectAudit = async () => {
    try {
      console.log('🔍 STARTING PIXEL-PERFECT AUDIT TEST FROM CONSOLE');
      console.log('='.repeat(80));

      // Get current date and events from window context
      const selectedDate = new Date(); // Default to today
      const events = (window as any).currentEvents || [];

      console.log(`📅 Auditing date: ${selectedDate.toDateString()}`);
      console.log(`📊 Total events: ${events.length}`);

      // Run comprehensive audit
      const auditResults = await runPixelPerfectAudit(selectedDate, events);

      // Display results
      console.log('\n🎯 PIXEL-PERFECT AUDIT RESULTS:');
      console.log('='.repeat(50));
      console.log(`📊 Overall Score: ${auditResults.score}/${auditResults.maxScore} (${auditResults.percentage}%)`);
      console.log(`🔧 Issues Found: ${auditResults.issues.length}`);
      console.log(`📋 Recommendations: ${auditResults.recommendations.length}`);

      // Log detailed results
      if (auditResults.issues.length > 0) {
        console.log('\n❌ ISSUES FOUND:');
        auditResults.issues.forEach((issue, index) => {
          console.log(`${index + 1}. [${issue.severity.toUpperCase()}] ${issue.description}`);
          console.log(`   Expected: ${issue.expected}`);
          console.log(`   Actual: ${issue.actual}`);
          console.log(`   Fix: ${issue.fixRecommendation}`);
          console.log('');
        });
      }

      // Log recommendations
      if (auditResults.recommendations.length > 0) {
        console.log('\n💡 RECOMMENDATIONS:');
        auditResults.recommendations.forEach((rec, index) => {
          console.log(`${index + 1}. ${rec}`);
        });
      }

      // Store results in localStorage
      localStorage.setItem('pixelPerfectAuditResults', JSON.stringify(auditResults));
      console.log('\n✅ Pixel-perfect audit completed! Results saved to localStorage.');

    } catch (error) {
      console.error('❌ Pixel-perfect audit failed:', error);
    }
  };

  // Add comprehensive PDF perfection test function
  (window as any).testPDFPerfection = async () => {
    try {
      console.log('🎯 STARTING COMPREHENSIVE PDF PERFECTION TEST');
      console.log('='.repeat(80));

      // Get current date and events from window context
      const selectedDate = new Date(); // Default to today
      const events = (window as any).currentEvents || [];

      console.log(`📅 Testing date: ${selectedDate.toDateString()}`);
      console.log(`📊 Total events: ${events.length}`);

      // Run comprehensive perfection test
      const perfectionResults = await pdfPerfectionTester.runComprehensivePerfectionTest(selectedDate, events);

      // Generate and display report
      const report = pdfPerfectionTester.generateTestReport(perfectionResults);
      console.log(report);

      // Save results to localStorage for external access
      localStorage.setItem('pdfPerfectionTestResults', JSON.stringify({
        timestamp: new Date().toISOString(),
        date: selectedDate.toISOString(),
        eventCount: events.length,
        results: perfectionResults,
        report: report
      }));

      console.log('\n✅ PDF perfection test completed! Results saved to localStorage.');

    } catch (error) {
      console.error('❌ PDF perfection test failed:', error);
      console.error('Error details:', error.message);
    }
  };

  return (
    <div className="sidebar-section">
      <h3 className="text-sm font-semibold mb-3 text-gray-900">Export Options</h3>

      {/* Daily View Export */}
      <div className="mb-4">
        <h4 className="text-xs font-medium text-gray-700 mb-2">📅 Daily View</h4>
        <div className="space-y-1">
          <Button 
            variant="outline" 
            onClick={() => onExportCurrentView('Daily View')}
            className="w-full text-xs bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
            size="sm"
          >
            📄 Export Daily View
          </Button>
          <Button 
            variant="outline" 
            onClick={() => onExportCurrentView('Dynamic Daily Planner')}
            className="w-full text-xs bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
            size="sm"
          >
            🎯 Dynamic Daily Planner PDF
          </Button>
          <Button 
            variant="outline" 
            onClick={() => onExportCurrentView('Dynamic Daily HTML')}
            className="w-full text-xs bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
            size="sm"
          >
            🌐 Dynamic Daily HTML
          </Button>
          <Button 
            variant="outline" 
            onClick={() => onExportCurrentView('Preview Dynamic Daily')}
            className="w-full text-xs bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
            size="sm"
          >
            👁️ Preview Dynamic Daily
          </Button>
        </div>
      </div>

      {/* PDF Perfection Test */}
      <div className="mb-4">
        <h4 className="text-xs font-medium text-gray-700 mb-2">🎯 PDF Perfection</h4>
        <div className="space-y-1">
          <Button 
            variant="outline" 
            onClick={() => (window as any).testPDFPerfection()}
            className="w-full text-xs bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
            size="sm"
          >
            🎯 Test PDF Perfection
          </Button>
          <Button 
            variant="outline" 
            onClick={() => (window as any).testPixelPerfectAudit()}
            className="w-full text-xs bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100"
            size="sm"
          >
            🔍 Pixel-Perfect Audit
          </Button>
          <Button 
            variant="outline" 
            onClick={() => (window as any).testSimplePDF()}
            className="w-full text-xs bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
            size="sm"
          >
            🚀 Test Simple PDF Export
          </Button>
          <Button 
            variant="outline" 
            onClick={() => (window as any).runPixelPerfectReview()}
            className="w-full text-xs bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
            size="sm"
          >
            🔍 Pixel-Perfect Review
          </Button>
          <Button 
            variant="outline" 
            onClick={() => (window as any).runComprehensivePixelAnalysis()}
            className="w-full text-xs bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
            size="sm"
          >
            🔬 Comprehensive Analysis
          </Button>
          <Button 
            variant="outline" 
            onClick={() => (window as any).exportPixelPerfectPDF()}
            className="w-full text-xs bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
            size="sm"
          >
            🎯 100% Pixel-Perfect Export
          </Button>
        </div>
      </div>

      {/* Google Drive Export Section */}
      <div className="mb-4">
        <h4 className="text-xs font-medium text-gray-700 mb-2">☁️ Google Drive</h4>
        <div className="space-y-1">
          <Button 
            variant="outline" 
            onClick={() => onExportToGoogleDrive('current')}
            className="w-full text-xs whitespace-normal leading-tight h-auto py-2"
            size="sm"
            disabled={!isGoogleConnected}
          >
            {isGoogleConnected ? '☁️ Current to Drive' : (
              <>
                Export Current View
                <br />
                (Connect Google First)
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Weekly Export */}
      <div className="border-t pt-3 mt-3">
        <p className="text-xs text-gray-600 mb-2">📅 Weekly Export</p>
        <Button 
          variant="outline" 
          onClick={() => {
            console.log('🎯 PERFECT WEEKLY EXPORT - OPTIMIZED TYPOGRAPHY!');
            onExportCurrentView('Exact Weekly Spec');
          }}
          className="w-full text-xs mb-2 bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
          size="sm"
        >
          📅 Export Weekly Calendar
        </Button>
      </div>
    </div>
  );
};
```

```
/**
 * Exports the current view to a PDF file.
 *
 * @param {string} type - The type of view to export.
 */
```

```typescript
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Function to handle different export types
export const handleExport = async (
  type: string,
  weekStartDate: Date | null,
  weekEndDate: Date | null,
  currentDate: Date | null,
  events: any[],
  isDailyView: boolean = false,
) => {
  console.log(`Attempting to export: ${type}`);

  // Helper function to convert date to readable format
  const formatDate = (date: Date | null): string => {
    if (!date) return 'N/A';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Switch statement to handle different export types
  switch (type) {
    case 'exact-grid':
      if (!weekStartDate || !weekEndDate) {
        console.error('Week start and end dates are required for exact grid export.');
        return;
      }
      await exportExactGridPDF(weekStartDate, weekEndDate, events);
      break;
    case 'dynamic-daily':
      if (!currentDate) {
        console.error('Current date is required for dynamic daily export.');
        return;
      }
      await exportDynamicDailyPlannerPDF(currentDate, events);
      break;
    case 'preview-daily':
      if (!currentDate) {
        console.error('Current date is required for dynamic daily export.');
        return;
      }
      await exportDynamicDailyPlannerPDF(currentDate, events, true);  // Pass a flag to indicate preview mode
      break;
    case 'dynamic-daily-html':
      if (!currentDate) {
        console.error('Current date is required for dynamic daily HTML export.');
        return;
      }
      await exportDynamicDailyPlannerHTML(currentDate, events);
      break;
    case 'current-view':
      if (isDailyView) {
        await exportDailyToPDF(currentDate, events);
      } else {
        await exportExactGridPDF(weekStartDate, weekEndDate, events);
      }
      break;
    case 'Exact Weekly Spec':
          if (!weekStartDate || !weekEndDate) {
            console.error('Week start and end dates are required for exact weekly spec export.');
            return;
          }
          await exportExactGridPDF(weekStartDate, weekEndDate, events);
          break;
    default:
      console.warn(`Export type "${type}" is not supported.`);
  }
};

// Utility function to trigger file download
const downloadFile = (data: string, filename: string, type: string) => {
  const blob = new Blob([data], { type: type });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};

// Export function for dynamic daily planner to HTML
const exportDynamicDailyPlannerHTML = async (date: Date, events: any[]) => {
  // Basic HTML structure
  let htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Daily Planner - ${formatDate(date)}</title>
      </head>
      <body>
          <h1>Daily Planner - ${formatDate(date)}</h1>
          <ul>
  `;

  // Add events as list items
  events.forEach(event => {
    htmlContent += `<li>${event.title} - ${event.startTime} to ${event.endTime}</li>`;
  });

  htmlContent += `
          </ul>
      </body>
      </html>
  `;

  downloadFile(htmlContent, `daily-planner-${formatDate(date)}.html`, 'text/html');
};

// Placeholder function for dynamic daily planner PDF export (you'll need to implement this)
const exportDynamicDailyPlannerPDF = async (date: Date, events: any[], isPreview: boolean = false) => {
  console.log("Attempting to export dynamic daily planner PDF");

  const doc = new jsPDF();

  // Set document properties
  doc.setProperties({
    title: `Daily Planner - ${formatDate(date)}`,
    author: 'Your Name',
  });

  // Add title to the document
  doc.setFontSize(18);
  doc.text(`Daily Planner - ${formatDate(date)}`, 14, 20);

  // Define the columns
  const columns = ["Title", "Start Time", "End Time"];

  // Prepare the data
  const data = events.map(event => [event.title, event.startTime, event.endTime]);

  // Add the table to the document
  autoTable(doc, {
    head: [columns],
    body: data,
    startY: 30,
  });

  // Save or display the PDF
  if (isPreview) {
    doc.output('dataurlnewwindow');  // Open in new window for preview
  } else {
    doc.save(`daily-planner-${formatDate(date)}.pdf`); // Save the PDF
  }
};
```

```typescript
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Function to export data to PDF with an exact grid layout
export const exportExactGridPDF = async (weekStartDate: Date, weekEndDate: Date, events: any[]) => {
    console.log("Attempting to export exact grid PDF");

    // Convert dates to readable strings
    const startDateStr = weekStartDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    const endDateStr = weekEndDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Initialize jsPDF
    const doc = new jsPDF();

    // Set document properties
    doc.setProperties({
        title: `Weekly Calendar - ${startDateStr} to ${endDateStr}`,
        author: 'Your Name'
    });

    // Add title to the document
    doc.setFontSize(18);
    doc.text(`Weekly Calendar - ${startDateStr} to ${endDateStr}`, 14, 20);

    // Define the columns (days of the week)
    const columns = ["Time", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    // Prepare the data (event data by time slots)
    const data = [];
    const timeSlots = ["9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM"];

    timeSlots.forEach(time => {
        const row = [time];
        for (let i = 0; i < 7; i++) { // For each day of the week
            const dayEvents = events.filter(event => {
                const eventDate = new Date(event.startTime);
                const dayOfWeek = eventDate.getDay(); // 0 for Sunday, 1 for Monday, etc.
                return dayOfWeek === i && event.startTime.includes(time);
            });
            row.push(dayEvents.map(e => e.title).join('\n')); // Add event titles for the time slot
        }
        data.push(row);
    });

    // Add the table to the document
    autoTable(doc, {
        head: [columns],
        body: data,
        startY: 30,
    });

    // Save the PDF
    doc.save(`weekly-calendar-${startDateStr}-to-${endDateStr}.pdf`);
};
```

```typescript
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export const exportDailyToPDF = async (date: Date, events: any[]) => {
    console.log("Attempting to export daily view to PDF");

    // Convert date to readable string
    const dateStr = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Initialize jsPDF
    const doc = new jsPDF();

    // Set document properties
    doc.setProperties({
        title: `Daily View - ${dateStr}`,
        author: 'Your Name'
    });

    // Add title to the document
    doc.setFontSize(18);
    doc.text(`Daily View - ${dateStr}`, 14, 20);

    // Define the columns
    const columns = ["Time", "Event"];

    // Prepare the data
    const data = events.map(event => [event.startTime, event.title]);

    // Add the table to the document
    autoTable(doc, {
        head: [columns],
        body: data,
        startY: 30,
    });

    // Save the PDF
    doc.save(`daily-view-${dateStr}.pdf`);
};
```

```
// Define the columns
    const columns = ["Title", "Start Time", "End Time"];

    // Prepare the data
    const data = events.map(event => [event.title, event.startTime, event.endTime]);

    // Add the table to the document
    autoTable(doc, {
      head: [columns],
      body: data,
      startY: 30,
    });
```

```
import { handleExport } from '../../utils/exportUtils';
```

```typescript
import { handleExport } from '../../utils/exportUtils';
import { exportExactGridPDF } from '../../utils/exactGridPDFExport';
import { exportDailyToPDF } from '../../utils/dailyPDFExport';
```

```typescript
case 'current-view':
          if (isDailyView) {
            await exportDailyToPDF(currentDate, events);
          } else {
            await exportExactGridPDF(weekStartDate, weekEndDate, events);
          }
          break;
```

```
import { exportExactGridPDF } from '../../utils/exactGridPDFExport';
import { exportDynamicDailyPlannerPDF } from '../../utils/dynamicDailyPlannerPDF';
```

```
import { exportExactGridPDF } from '../../utils/exactGridPDFExport';
import { exportDailyToPDF } from '../../utils/dailyPDFExport';
```