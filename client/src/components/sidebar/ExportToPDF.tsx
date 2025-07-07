import { Button } from '@/components/ui/button';

interface ExportToPDFProps {
  isGoogleConnected: boolean;
  onExportCurrentView: () => void;
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
  return (
    <div className="sidebar-section">
      <h3 className="text-sm font-semibold mb-3 text-gray-900">Export to PDF</h3>
      
      {/* Standard PDF Exports */}
      <div className="mb-4">
        <h4 className="text-xs font-medium text-gray-700 mb-2">Standard PDF</h4>
        <div className="space-y-1">
          <Button 
            variant="outline" 
            onClick={onExportCurrentView}
            className="w-full text-xs"
            size="sm"
          >
            Export Current View
          </Button>
          <Button 
            variant="outline" 
            onClick={onExportWeeklyPackage}
            className="w-full text-xs"
            size="sm"
          >
            Export Weekly Package
          </Button>
          <Button 
            variant="outline" 
            onClick={onExportDailyView}
            className="w-full text-xs"
            size="sm"
          >
            Export Daily View
          </Button>
        </div>
      </div>

      {/* reMarkable Pro Optimized Exports */}
      <div className="mb-4">
        <h4 className="text-xs font-medium text-gray-700 mb-2">reMarkable Pro Optimized</h4>
        <div className="space-y-1">
          <Button 
            variant="outline" 
            onClick={() => onExportToGoogleDrive('reMarkable Weekly')}
            className="w-full text-xs bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
            size="sm"
          >
            📄 Weekly (reMarkable)
          </Button>
          <Button 
            variant="outline" 
            onClick={() => onExportToGoogleDrive('reMarkable Daily')}
            className="w-full text-xs bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
            size="sm"
          >
            📅 Daily (reMarkable)
          </Button>
          <Button 
            variant="outline" 
            onClick={() => onExportToGoogleDrive('reMarkable Monthly')}
            className="w-full text-xs bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
            size="sm"
          >
            📊 Monthly (reMarkable)
          </Button>
          <Button 
            variant="outline" 
            onClick={onExportFullMonth}
            className="w-full text-xs"
            size="sm"
          >
            Export Full Month
          </Button>
        </div>
      </div>
      
      <div>
        <h4 className="text-xs font-medium text-gray-700 mb-2">Google Drive Export</h4>
        <div className="space-y-1">
          <Button 
            variant="outline" 
            onClick={() => onExportToGoogleDrive('current')}
            className="w-full text-xs whitespace-normal leading-tight h-auto py-2"
            size="sm"
          >
            {isGoogleConnected ? 'Export Current View' : (
              <>
                Export Current View
                <br />
                (Connect Google)
              </>
            )}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => onExportToGoogleDrive('weekly')}
            className="w-full text-xs whitespace-normal leading-tight h-auto py-2"
            size="sm"
          >
            {isGoogleConnected ? 'Export Weekly Package' : (
              <>
                Export Weekly Package
                <br />
                (Connect Google)
              </>
            )}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => onExportToGoogleDrive('daily')}
            className="w-full text-xs whitespace-normal leading-tight h-auto py-2"
            size="sm"
          >
            {isGoogleConnected ? 'Export Daily View' : (
              <>
                Export Daily View
                <br />
                (Connect Google)
              </>
            )}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => onExportToGoogleDrive('month')}
            className="w-full text-xs whitespace-normal leading-tight h-auto py-2"
            size="sm"
          >
            {isGoogleConnected ? 'Export Full Month' : (
              <>
                Export Full Month
                <br />
                (Connect Google)
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
