import { Button } from '@/components/ui/button';

interface QuickActionsProps {
  onGoToToday: () => void;
  onGoToDate: () => void;
  onRefreshEvents: () => void;
  onSyncNotes: () => void;
}

export const QuickActions = ({
  onGoToToday,
  onGoToDate,
  onRefreshEvents,
  onSyncNotes
}: QuickActionsProps) => {
  return (
    <div className="sidebar-section">
      <h3 className="text-sm font-semibold mb-3 text-gray-900">Quick Actions</h3>
      <div className="space-y-2">
        <Button 
          variant="outline" 
          onClick={onGoToToday}
          className="w-full"
          size="sm"
        >
          Go to Today
        </Button>
        <Button 
          variant="outline" 
          onClick={onGoToDate}
          className="w-full"
          size="sm"
        >
          Go to Date
        </Button>
        <Button 
          variant="outline" 
          onClick={onRefreshEvents}
          className="w-full"
          size="sm"
        >
          Refresh Events
        </Button>
        <Button 
          variant="outline" 
          onClick={onSyncNotes}
          className="w-full"
          size="sm"
        >
          Sync Notes to Calendar
        </Button>
      </div>
    </div>
  );
};
