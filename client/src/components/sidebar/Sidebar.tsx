
import { MiniCalendar } from './MiniCalendar';
import { GoogleCalendarIntegration } from './GoogleCalendarIntegration';
import { QuickActions } from './QuickActions';
import { ExportToPDF } from './ExportToPDF';
import { DailyNotes } from './DailyNotes';
import { CalendarEvent, ViewMode } from '../../types/calendar';

interface SidebarProps {
  currentDate: Date;
  selectedDate: Date;
  viewMode: ViewMode;
  dailyNotes: string;
  onDateChange: (date: Date) => void;
  onSelectedDateChange: (date: Date) => void;
  onViewModeChange: (mode: ViewMode) => void;
  onNotesChange: (notes: string) => void;
  onCreateEvent: (startTime: Date, endTime: Date) => void;
  events: CalendarEvent[];
  onWeekChange: (direction: 'prev' | 'next') => void;
}

export const Sidebar = ({
  currentDate,
  selectedDate,
  viewMode,
  dailyNotes,
  onDateChange,
  onSelectedDateChange,
  onViewModeChange,
  onNotesChange,
  onCreateEvent,
  events,
  onWeekChange
}: SidebarProps) => {
  return (
    <div className="w-64 bg-gray-50 p-4 border-r border-gray-200">
      <MiniCalendar
        currentDate={currentDate}
        selectedDate={selectedDate}
        onDateSelect={onSelectedDateChange}
      />
      
      <GoogleCalendarIntegration
        isConnected={true}
        onSelectAll={() => {}}
        onDeselectAll={() => {}}
      />
      
      <QuickActions
        onGoToToday={() => onDateChange(new Date())}
        onGoToDate={() => {}}
        onRefreshEvents={() => {}}
        onSyncNotes={() => {}}
      />
      
      <ExportToPDF
        isGoogleConnected={true}
        onExportCurrentView={() => {}}
        onExportWeeklyPackage={() => {}}
        onExportDailyView={() => {}}
        onExportFullMonth={() => {}}
        onExportToGoogleDrive={() => {}}
      />
      
      <DailyNotes
        notes={dailyNotes}
        onSaveNotes={onNotesChange}
      />
    </div>
  );
};
