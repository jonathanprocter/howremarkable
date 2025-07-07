import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CalendarEvent } from '../types/calendar';
import { exportWeeklyToPDF, generateFilename } from '../utils/pdfExportSimple';
import { getWeekNumber, getWeekStartDate, getWeekEndDate } from '../utils/dateUtils';

export default function Planner() {
  const [viewMode, setViewMode] = useState<'weekly' | 'daily'>('weekly');
  const currentDate = new Date(2025, 6, 7); // Fixed to July 7, 2025
  const [selectedDate, setSelectedDate] = useState(currentDate);

  // Simple events fetch
  const { data: events = [], isLoading } = useQuery({
    queryKey: ['/api/events/1'],
    staleTime: 1000 * 60 * 5,
    retry: false
  });

  const handlePDFExport = async () => {
    try {
      const weekStartDate = getWeekStartDate(currentDate);
      const weekEndDate = getWeekEndDate(currentDate);
      const weekNumber = getWeekNumber(currentDate);
      
      const pdfContent = await exportWeeklyToPDF(
        weekStartDate,
        weekEndDate,
        events,
        weekNumber
      );
      
      const filename = generateFilename('weekly', weekStartDate);
      
      // Create download link
      const link = document.createElement('a');
      link.href = pdfContent;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log('PDF exported successfully');
    } catch (error) {
      console.error('PDF Export Error:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Loading planner...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">Digital Planner</h1>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setViewMode('weekly')}
                className={`px-4 py-2 rounded ${viewMode === 'weekly' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              >
                Weekly
              </button>
              <button
                onClick={() => setViewMode('daily')}
                className={`px-4 py-2 rounded ${viewMode === 'daily' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              >
                Daily
              </button>
              <button
                onClick={handlePDFExport}
                className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Export PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold mb-4">
            Week of July 7-13, 2025
          </h2>
          
          {/* Events Summary */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Events This Week</h3>
            <p className="text-gray-600">Total events: {events.length}</p>
          </div>

          {/* Events List */}
          <div className="space-y-3">
            {events.map((event: CalendarEvent) => (
              <div key={event.id} className="border rounded p-3">
                <h4 className="font-medium">{event.title}</h4>
                <p className="text-sm text-gray-600">
                  {new Date(event.startTime).toLocaleDateString()} at{' '}
                  {new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
                {event.description && (
                  <p className="text-sm text-gray-700 mt-1">{event.description}</p>
                )}
              </div>
            ))}
          </div>

          {events.length === 0 && (
            <p className="text-gray-500 text-center py-8">
              No events scheduled for this week
            </p>
          )}
        </div>
      </div>
    </div>
  );
}