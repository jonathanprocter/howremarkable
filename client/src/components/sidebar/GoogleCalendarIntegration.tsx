import { Button } from '@/components/ui/button';

interface GoogleCalendarIntegrationProps {
  isConnected: boolean;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

export const GoogleCalendarIntegration = ({
  isConnected,
  onSelectAll,
  onDeselectAll
}: GoogleCalendarIntegrationProps) => {
  return (
    <div className="sidebar-section">
      <h3 className="text-sm font-semibold mb-3 text-gray-900">Google Calendar</h3>
      <p className="text-xs text-gray-600 mb-3">
        {isConnected ? "Connected to Google Calendar" : "Ready to connect to Google Calendar"}
      </p>
      <div className="space-y-2">
        <Button 
          onClick={onSelectAll}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          size="sm"
        >
          Select All
        </Button>
        <Button 
          onClick={onDeselectAll}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          size="sm"
        >
          Deselect All
        </Button>
      </div>
    </div>
  );
};
