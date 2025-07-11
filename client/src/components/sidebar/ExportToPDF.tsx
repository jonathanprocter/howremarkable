import { Button } from '@/components/ui/button';
import { runPixelPerfectAudit } from '@/utils/pixelPerfectAudit';

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
      
      // Show summary alert
      alert(`Pixel-Perfect Audit Complete!\n\nScore: ${auditResults.percentage}%\nIssues: ${auditResults.issues.length}\nRecommendations: ${auditResults.recommendations.length}\n\nCheck console for detailed results.`);

    } catch (error) {
      console.error('❌ Pixel-perfect audit test failed:', error);
      alert('Audit failed. Check console for details.');
    }
  };

  // Add standalone audit function (no export)
  const runStandaloneAudit = async () => {
    try {
      console.log('🔍 RUNNING STANDALONE PIXEL-PERFECT AUDIT...');
      console.log('='.repeat(50));

      const { runPixelPerfectAudit } = await import('../../utils/pixelPerfectAudit');
      const currentDate = (window as any).selectedDate || new Date();
      const currentEvents = (window as any).currentEvents || [];
      const auditResults = await runPixelPerfectAudit(currentDate, currentEvents);

      // Display key results in an alert
      alert(`Pixel-Perfect Audit Complete!\n\nScore: ${auditResults.percentage}%\nIssues Found: ${auditResults.issues.length}\nRecommendations: ${auditResults.recommendations.length}\n\nFull results logged to console and saved to localStorage.`);

    } catch (error) {
      console.error('❌ Standalone audit failed:', error);
      alert('Audit failed. Check console for details.');
    }
  };

  const testExport = () => {
    console.log('🚀 DIRECT TEST EXPORT CALLED!');
    onExportCurrentView('Test Export');
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

        {/* Pixel-Perfect Audit Section */}
        <div className="border-t pt-3 mt-3">
          <p className="text-xs text-gray-600 mb-2">🔍 Quality Audit</p>
          <Button 
            variant="outline" 
            onClick={async () => {
              console.log('🔍 RUNNING COMPREHENSIVE AUDIT WITH REAL EVENTS...');
              
              // Check for existing events first
              const currentEvents = (window as any).currentEvents || [];
              console.log(`📊 Current events count: ${currentEvents.length}`);
              
              // If no events, create sample data for comprehensive testing
              if (currentEvents.length === 0) {
                console.log('📊 Creating sample events for comprehensive audit test...');
                
                const sampleEvents = [
                  {
                    id: 'audit-test-1',
                    title: 'Dan re: Supervision',
                    startTime: new Date('2025-07-11T10:00:00'),
                    endTime: new Date('2025-07-11T11:00:00'),
                    source: 'google',
                    notes: 'Review client progress\nDiscuss treatment goals',
                    actionItems: 'Update treatment plan\nSchedule follow-up',
                    calendarId: 'primary'
                  },
                  {
                    id: 'audit-test-2',
                    title: 'Nancy Grossman Appointment',
                    startTime: new Date('2025-07-11T14:30:00'),
                    endTime: new Date('2025-07-11T15:30:00'),
                    source: 'simplepractice',
                    notes: 'Initial consultation',
                    actionItems: 'Complete intake forms',
                    calendarId: 'simplepractice'
                  },
                  {
                    id: 'audit-test-3',
                    title: 'Team Meeting',
                    startTime: new Date('2025-07-11T16:00:00'),
                    endTime: new Date('2025-07-11T17:00:00'),
                    source: 'google',
                    notes: 'Weekly team sync',
                    actionItems: 'Prepare presentation',
                    calendarId: 'primary'
                  }
                ];
                
                (window as any).currentEvents = sampleEvents;
                console.log(`✅ Created ${sampleEvents.length} sample events for testing`);
              }
              
              // Run comprehensive audit
              console.log('🔍 Running comprehensive audit with events...');
              const result = await (window as any).testPixelPerfectAudit();
              
              // Analyze results
              console.log('\n🎯 COMPREHENSIVE AUDIT ANALYSIS:');
              console.log('=====================================');
              
              if (result) {
                console.log(`📊 Overall Score: ${result.percentage}%`);
                console.log(`🔧 Issues Found: ${result.issues.length}`);
                console.log(`📋 Recommendations: ${result.recommendations.length}`);
                
                if (result.issues.length > 0) {
                  console.log('\n⚠️ ISSUES FOUND:');
                  result.issues.forEach((issue, index) => {
                    console.log(`${index + 1}. [${issue.severity.toUpperCase()}] ${issue.description}`);
                    console.log(`   Expected: ${issue.expected}`);
                    console.log(`   Actual: ${issue.actual}`);
                    console.log(`   Fix: ${issue.fixRecommendation}`);
                  });
                }
                
                if (result.recommendations.length > 0) {
                  console.log('\n💡 RECOMMENDATIONS:');
                  result.recommendations.forEach((rec, index) => {
                    console.log(`${index + 1}. ${rec}`);
                  });
                }
              }
              
              console.log('\n🎯 COMPREHENSIVE AUDIT COMPLETE!');
            }}
            className="w-full text-xs mb-2 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
            size="sm"
          >
            🔍 Run Comprehensive Audit
          </Button>
        </div>
    </div>
  );
};