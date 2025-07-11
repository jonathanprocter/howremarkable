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

      {/* Debug Export Section */}
      <div className="mb-4">
        <h4 className="text-xs font-medium text-red-700 mb-2">🐛 Debug Exports</h4>
        <div className="space-y-1">
          <button
            onClick={() => {
              console.log('🔍 ENHANCED PIXEL-PERFECT AUDIT TEST BUTTON CLICKED!');
              onExportCurrentView('Enhanced Pixel Perfect Audit Test');
            }}
            className="w-full text-xs bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 border rounded px-2 py-1 font-medium"
            style={{ pointerEvents: 'auto', zIndex: 9999 }}
          >
            🔍 Export + Audit
          </button>
          <button
            onClick={runStandaloneAudit}
            className="w-full text-xs bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 border rounded px-2 py-1 font-medium"
            style={{ pointerEvents: 'auto', zIndex: 9999 }}
          >
            📊 Audit Only (No Export)
          </button>
          <button
            onClick={() => {
              console.log('🟢 HTML BUTTON CLICKED!');
              alert('Button clicked!');
              testExport();
            }}
            className="w-full text-xs bg-red-50 border-red-200 text-red-700 hover:bg-red-100 border rounded px-2 py-1"
            style={{ pointerEvents: 'auto', zIndex: 9999 }}
          >
            🔍 Test Export (Debug)
          </button>
          <Button 
            variant="outline" 
            onClick={() => onExportCurrentView('JSON Export')}
            className="w-full text-xs bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100"
            size="sm"
          >
            📄 JSON Export
          </Button>
          <Button 
            variant="outline" 
            onClick={() => onExportCurrentView('CSV Export')}
            className="w-full text-xs bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
            size="sm"
          >
            📊 CSV Export
          </Button>
        </div>
      </div>

      {/* Standard Text Exports */}
      <div className="mb-4">
        <h4 className="text-xs font-medium text-gray-700 mb-2">📝 Text Exports</h4>
        <div className="space-y-1">
          <Button 
            variant="outline" 
            onClick={() => onExportCurrentView('Current View')}
            className="w-full text-xs"
            size="sm"
          >
            📄 Export Current View
          </Button>
        </div>
      </div>

      {/* Perfect Dashboard Exports */}
      <div className="mb-4">
        <h4 className="text-xs font-medium text-emerald-700 mb-2">🎯 Dashboard Perfect Match</h4>
        <div className="space-y-1">
          <Button 
            variant="outline" 
            onClick={() => onExportCurrentView('Pixel Perfect Daily')}
            className="w-full text-xs bg-red-50 border-red-200 text-red-700 hover:bg-red-100 font-bold"
            size="sm"
          >
            📐 Pixel Perfect Daily (300 DPI)
          </Button>

        </div>
      </div>

      {/* reMarkable Pro Optimized Exports */}
      <div className="mb-4">
        <h4 className="text-xs font-medium text-gray-700 mb-2">📱 reMarkable Pro</h4>
        <div className="space-y-1">
          <Button 
            variant="outline" 
            onClick={() => onExportCurrentView('reMarkable Monthly')}
            className="w-full text-xs bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
            size="sm"
          >
            📊 Monthly (reMarkable)
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

      {/* Legacy PDF Exports (for compatibility) */}
      <div>
        <h4 className="text-xs font-medium text-gray-500 mb-2">📄 Legacy PDF (May Have Issues)</h4>
        <div className="space-y-1">
          <Button 
            variant="outline" 
            onClick={onExportFullMonth}
            className="w-full text-xs opacity-60"
            size="sm"
          >
            Legacy Full Month
          </Button>
        </div>
      </div>
      <div className="border-t pt-3 mt-3">
          <p className="text-xs text-gray-600 mb-2">🎯 Perfect Weekly Layout</p>
          <Button 
            variant="outline" 
            onClick={async () => {
              console.log('🔍 RUNNING COMPREHENSIVE EXPORT AUDIT...');
              try {
                const { testAuditSystem } = await import('../../utils/findPerfectExport');
                await testAuditSystem();
              } catch (error) {
                console.error('❌ Audit failed:', error);
              }
            }}
            className="w-full text-xs bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100 font-bold"
            size="sm"
          >
            🔍 Find Perfect Export (Audit)
          </Button>

          <Button 
            variant="outline" 
            onClick={() => {
              console.log('🎯 PIXEL PERFECT DASHBOARD EXPORT - LATEST VERSION!');
              onExportCurrentView('Pixel Perfect Dashboard');
            }}
            className="w-full text-xs bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 font-bold"
            size="sm"
          >
            🎯 PERFECT Weekly (Latest Version)
          </Button>

          <p className="text-xs text-gray-600 mb-2 mt-3">📦 Multi-Page Export</p>
          <Button 
            variant="outline" 
            onClick={() => onExportCurrentView('Weekly Package')}
            className="w-full text-xs bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
            size="sm"
          >
            📦 Weekly Package (8 Pages)
          </Button>
        </div>
    </div>
  );
};