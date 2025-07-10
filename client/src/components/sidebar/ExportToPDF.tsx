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
      
      // This will trigger the full audit system when an export is called
      onExportCurrentView('Enhanced Pixel Perfect Audit Test');
      
    } catch (error) {
      console.error('❌ Pixel-perfect audit test failed:', error);
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
            🔍 Test Pixel-Perfect Audit
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
          <Button 
            variant="outline" 
            onClick={() => {
              console.log('🔥 DAILY VIEW BUTTON CLICKED!');
              console.log('🔥 About to call onExportCurrentView with "Daily View"');
              console.log('🔥 Function type:', typeof onExportCurrentView);
              try {
                onExportCurrentView('Daily View');
                console.log('🔥 onExportCurrentView called successfully');
              } catch (error) {
                console.error('🔥 Error calling onExportCurrentView:', error);
              }
            }}
            className="w-full text-xs"
            size="sm"
          >
            📅 Export Daily View
          </Button>
          <Button 
            variant="outline" 
            onClick={() => onExportCurrentView('Weekly Package')}
            className="w-full text-xs"
            size="sm"
          >
            📋 Export Weekly Package
          </Button>
        </div>
      </div>

      {/* Perfect Dashboard Exports */}
      <div className="mb-4">
        <h4 className="text-xs font-medium text-purple-700 mb-2">✨ Perfect Dashboard Match</h4>
        <div className="space-y-1">
          <Button 
            variant="outline" 
            onClick={() => onExportCurrentView('Pixel Perfect Weekly')}
            className="w-full text-xs bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
            size="sm"
          >
            🎯 Pixel Perfect Weekly
          </Button>
          <Button 
            variant="outline" 
            onClick={() => onExportCurrentView('Perfect Weekly')}
            className="w-full text-xs bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100 font-medium"
            size="sm"
          >
            ✨ Perfect Weekly
          </Button>
          <Button 
            variant="outline" 
            onClick={() => onExportCurrentView('Perfect Daily')}
            className="w-full text-xs bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100 font-medium"
            size="sm"
          >
            ✨ Perfect Daily
          </Button>
        </div>
      </div>

      {/* reMarkable Pro Optimized Exports */}
      <div className="mb-4">
        <h4 className="text-xs font-medium text-gray-700 mb-2">📱 reMarkable Pro</h4>
        <div className="space-y-1">
          <Button 
            variant="outline" 
            onClick={() => onExportCurrentView('reMarkable Daily')}
            className="w-full text-xs bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
            size="sm"
          >
            📅 Daily (reMarkable)
          </Button>
          <Button 
            variant="outline" 
            onClick={() => onExportCurrentView('reMarkable Weekly')}
            className="w-full text-xs bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
            size="sm"
          >
            📄 Weekly (reMarkable)
          </Button>
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
          <Button 
            variant="outline" 
            onClick={() => onExportToGoogleDrive('weekly')}
            className="w-full text-xs whitespace-normal leading-tight h-auto py-2"
            size="sm"
            disabled={!isGoogleConnected}
          >
            {isGoogleConnected ? '☁️ Weekly to Drive' : (
              <>
                Export Weekly Package
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
            onClick={onExportWeeklyPackage}
            className="w-full text-xs opacity-60"
            size="sm"
          >
            Legacy Weekly PDF
          </Button>
          <Button 
            variant="outline" 
            onClick={onExportDailyView}
            className="w-full text-xs opacity-60"
            size="sm"
          >
            Legacy Daily PDF
          </Button>
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
    </div>
  );
};
