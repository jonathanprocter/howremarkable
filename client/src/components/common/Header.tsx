import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface HeaderProps {
  weekRangeString: string;
  isOnline: boolean;
  isCurrentWeek: boolean;
  onConnectGoogle: () => void;
  onPreviousWeek: () => void;
  onToday: () => void;
  onNextWeek: () => void;
}

export const Header = ({
  weekRangeString,
  isOnline,
  isCurrentWeek,
  onConnectGoogle,
  onPreviousWeek,
  onToday,
  onNextWeek
}: HeaderProps) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{weekRangeString}</h1>
          <div className="flex items-center mt-1">
            <Badge variant={isOnline ? "default" : "secondary"} className="bg-green-100 text-green-800">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1"></div>
              {isOnline ? "Online" : "Offline"}
            </Badge>
          </div>
        </div>
        <Button onClick={onConnectGoogle} className="bg-blue-600 hover:bg-blue-700">
          Connect Google Calendar
        </Button>
      </div>

      <div className="flex justify-center">
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={onPreviousWeek}
            className="flex items-center"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
          <Button 
            variant={isCurrentWeek ? "default" : "outline"}
            onClick={onToday}
            className={isCurrentWeek ? "bg-blue-600 hover:bg-blue-700" : ""}
          >
            Today
          </Button>
          <Button 
            variant="outline" 
            onClick={onNextWeek}
            className="flex items-center"
          >
            Next
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
};
