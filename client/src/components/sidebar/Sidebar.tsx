import { MiniCalendar } from './MiniCalendar';
import { GoogleCalendarIntegration } from './GoogleCalendarIntegration';
import { QuickActions } from './QuickActions';
import { ExportToPDF } from './ExportToPDF';
import { DailyNotes } from './DailyNotes';
import { AuthAuditSystem } from './AuthAuditSystem';
import { CalendarState } from '../../types/calendar';

interface SidebarProps {
  state: CalendarState;
  onDateSelect: (date: Date) => void;
  onGoToToday: () => void;
  onGoToDate: () => void;
  onRefreshEvents: () => void;
  onSyncNotes: () => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onExportCurrentView: (type?: string) => void;
  onExportWeeklyPackage: () => void;
  onExportDailyView: () => void;
  onExportFullMonth: () => void;
  onExportToGoogleDrive: (type: string) => void;
  onSaveNotes: (notes: string) => void;
}

export const Sidebar = ({
  state,
  onDateSelect,
  onGoToToday,
  onGoToDate,
  onRefreshEvents,
  onSyncNotes,
  onSelectAll,
  onDeselectAll,
  onExportCurrentView,
  onExportWeeklyPackage,
  onExportDailyView,
  onExportFullMonth,
  onExportToGoogleDrive,
  onSaveNotes
}: SidebarProps) => {
  const currentDateString = state.selectedDate.toISOString().split('T')[0];
  const dailyNotes = state.dailyNotes[currentDateString] || '';

  return (
    <div className="w-64 bg-gray-50 p-4 border-r border-gray-200 overflow-y-auto h-full">
      <MiniCalendar
        currentDate={state.currentDate}
        selectedDate={state.selectedDate}
        onDateSelect={onDateSelect}
      />
      
      <GoogleCalendarIntegration
        isConnected={state.isGoogleConnected}
        onSelectAll={onSelectAll}
        onDeselectAll={onDeselectAll}
      />
      
      <QuickActions
        onGoToToday={onGoToToday}
        onGoToDate={onGoToDate}
        onRefreshEvents={onRefreshEvents}
        onSyncNotes={onSyncNotes}
      />
      
      <ExportToPDF
        isGoogleConnected={state.isGoogleConnected}
        onExportCurrentView={onExportCurrentView}
        onExportWeeklyPackage={onExportWeeklyPackage}
        onExportDailyView={onExportDailyView}
        onExportFullMonth={onExportFullMonth}
        onExportToGoogleDrive={onExportToGoogleDrive}
      />
      
      <DailyNotes
        notes={dailyNotes}
        onSaveNotes={onSaveNotes}
      />
      
      <div className="mt-4">
        <AuthAuditSystem />
      </div>
    </div>
  );
};
