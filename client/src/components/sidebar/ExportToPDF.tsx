import { Button } from '@/components/ui/button';
import { runPixelPerfectAudit } from '@/utils/pixelPerfectAudit';
import { pdfPerfectionTester } from '@/utils/pdfPerfectionTest';

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