import { Button } from '@/components/ui/button';

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

      // Import and run audit directly
      const { performPixelPerfectAudit, exportAuditResults } = await import('../../utils/pixelPerfectAudit');
      const auditResults = await performPixelPerfectAudit();
      exportAuditResults(auditResults);

      console.log('✅ Pixel-perfect audit completed! Check localStorage for results.');

    } catch (error) {
      console.error('❌ Pixel-perfect audit test failed:', error);
    }
  };

  // Add standalone audit function (no export)
  const runStandaloneAudit = async () => {
    try {
      console.log('🔍 RUNNING STANDALONE PIXEL-PERFECT AUDIT...');
      console.log('='.repeat(50));

      const { performPixelPerfectAudit, exportAuditResults } = await import('../../utils/pixelPerfectAudit');
      const auditResults = await performPixelPerfectAudit();
      exportAuditResults(auditResults);

      // Display key results in an alert
      alert(`Pixel-Perfect Audit Complete!\n\nScore: ${auditResults.pixelDiffScore}%\nElements measured: ${auditResults.measurements.length}\nKnown compromises: ${auditResults.compromises.length}\n\nFull results logged to console and saved to localStorage.`);

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
          <p className="text-xs text-gray-600 mb-2">🎯 Custom Weekly Layout</p>
          <Button 
            variant="outline" 
            onClick={() => {
              console.log('🎯 CUSTOM WEEKLY EXPORT - WITH USER SPECIFICATIONS!');
              onExportCurrentView('Custom Weekly');
            }}
            className="w-full text-xs mb-2 bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
            size="sm"
          >
            📋 Custom Weekly (3300x2550px)
          </Button>
          <Button 
            variant="outline" 
            onClick={() => {
              console.log('🎯 PIXEL PERFECT WEEKLY EXPORT - FROM CHECKPOINT!');
              onExportCurrentView('Pixel Perfect Weekly');
            }}
            className="w-full text-xs bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 font-bold"
            size="sm"
          >
            🎯 PERFECT Weekly (Checkpoint Version)
          </Button>
        </div>
    </div>
  );
};