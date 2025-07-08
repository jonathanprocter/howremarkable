import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { CalendarEvent } from '../types/calendar';
import { getWeekNumber } from './dateUtils';

export const exportWeeklyCalendarHTML = async (
  weekStartDate: Date,
  weekEndDate: Date,
  events: CalendarEvent[]
): Promise<void> => {
  try {
    console.log('Starting HTML-based weekly calendar export...');
    
    // Filter events for the current week
    const weekEvents = events.filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate >= weekStartDate && eventDate <= weekEndDate;
    });

    // Calculate statistics
    const totalEvents = weekEvents.length;
    const totalHours = weekEvents.reduce((sum, e) => {
      const duration = (new Date(e.endTime).getTime() - new Date(e.startTime).getTime()) / (1000 * 60 * 60);
      return sum + duration;
    }, 0);
    const dailyAverage = totalHours / 7;
    const availableTime = (7 * 17.5) - totalHours; // 17.5 hours per day (6:00-23:30)

    // Create the HTML structure
    const htmlContent = generateWeeklyHTML(
      weekStartDate,
      weekEndDate,
      weekEvents,
      { totalEvents, totalHours, dailyAverage, availableTime }
    );

    // Create a temporary container
    const container = document.createElement('div');
    container.innerHTML = htmlContent;
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '842px'; // A4 landscape width
    container.style.background = 'white';
    document.body.appendChild(container);

    // Convert to canvas
    const canvas = await html2canvas(container, {
      width: 842,
      height: 720,
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
      allowTaint: false,
      logging: false
    });

    // Remove the temporary container
    document.body.removeChild(container);

    // Create PDF
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'pt',
      format: [842, 720]
    });

    // Add the canvas to PDF
    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', 0, 0, 842, 720);

    // Download the PDF
    const filename = `weekly-calendar-${weekStartDate.getFullYear()}-${(weekStartDate.getMonth() + 1).toString().padStart(2, '0')}-${weekStartDate.getDate().toString().padStart(2, '0')}.pdf`;
    pdf.save(filename);

    console.log(`✅ Weekly calendar exported: ${filename}`);
  } catch (error) {
    console.error('Error exporting weekly calendar:', error);
    throw error;
  }
};

function generateWeeklyHTML(
  weekStartDate: Date, 
  weekEndDate: Date, 
  events: CalendarEvent[],
  stats: { totalEvents: number; totalHours: number; dailyAverage: number; availableTime: number }
): string {
  const weekNumber = getWeekNumber(weekStartDate);
  const startMonth = weekStartDate.toLocaleDateString('en-US', { month: 'short' });
  const startDay = weekStartDate.getDate();
  const endDay = weekEndDate.getDate();

  // Generate time slots from 6:00 to 23:30
  const timeSlots = [];
  for (let hour = 6; hour <= 23; hour++) {
    timeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
    if (hour < 23 || hour === 23) {
      timeSlots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
  }

  // Create day headers
  const dayNames = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  const dayHeaders = dayNames.map((dayName, index) => {
    const dayDate = new Date(weekStartDate);
    dayDate.setDate(weekStartDate.getDate() + index);
    return {
      name: dayName,
      number: dayDate.getDate()
    };
  });

  // Process events by day and time
  const eventsByDayAndTime = processEventsForGrid(events, weekStartDate, timeSlots);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Weekly Planner - ${startMonth} ${startDay}-${endDay}, Week ${weekNumber}</title>
    <style>
        body {
            font-family: 'Times New Roman', serif;
            margin: 0;
            padding: 15px;
            background: white;
            color: black;
            font-size: 11px;
            line-height: 1.1;
            width: 842px;
            height: 720px;
            box-sizing: border-box;
        }
        
        .planner-container {
            width: 100%;
            margin: 0;
        }
        
        .header {
            text-align: center;
            margin-bottom: 12px;
        }
        
        .header h1 {
            font-size: 20px;
            font-weight: bold;
            margin: 0;
            letter-spacing: 1.5px;
        }
        
        .header .week-info {
            font-size: 14px;
            margin: 3px 0;
        }
        
        .stats-container {
            display: flex;
            justify-content: space-between;
            margin: 10px 0;
            border: 2px solid black;
        }
        
        .stat-box {
            flex: 1;
            text-align: center;
            padding: 6px;
            border-right: 1px solid black;
        }
        
        .stat-box:last-child {
            border-right: none;
        }
        
        .stat-number {
            font-size: 16px;
            font-weight: bold;
            display: block;
        }
        
        .stat-label {
            font-size: 9px;
            margin-top: 1px;
        }
        
        .legend {
            display: flex;
            justify-content: center;
            gap: 25px;
            margin: 8px 0;
            font-size: 10px;
        }
        
        .legend-item {
            display: flex;
            align-items: center;
            gap: 5px;
        }
        
        .legend-box {
            width: 12px;
            height: 12px;
            border: 1px solid black;
        }
        
        .simple-practice {
            background: white;
            border: 2px solid #6495ED;
            border-left: 4px solid #6495ED;
        }
        
        .google-calendar {
            background: white;
            border: 2px dashed #4CAF50;
        }
        
        .holidays {
            background: #ffd700;
        }
        
        .calendar-table {
            width: 100%;
            border-collapse: collapse;
            border: 2px solid black;
            table-layout: fixed;
        }
        
        .time-header, .day-header {
            background: white;
            border: 1px solid black;
            text-align: center;
            font-weight: bold;
            padding: 6px 3px;
            vertical-align: middle;
        }
        
        .time-header {
            width: 70px;
            font-size: 13px;
            border-right: 2px solid black;
        }
        
        .day-header {
            font-size: 13px;
            padding: 8px 4px;
            letter-spacing: 0.3px;
            width: calc((100% - 70px) / 7);
        }
        
        .day-number {
            font-size: 22px;
            font-weight: bold;
            margin-top: 2px;
            display: block;
        }
        
        .time-slot {
            border: 1px solid black;
            border-right: 2px solid black;
            text-align: center;
            vertical-align: middle;
            font-weight: bold;
            padding: 1px;
            width: 70px;
            font-size: 9px;
        }
        
        .time-slot.hour-row {
            background: #f5f5f5;
        }
        
        .time-hour {
            font-size: 11px;
        }
        
        .time-half {
            font-size: 9px;
            color: #666;
        }
        
        .hour-row {
            background: #f5f5f5;
        }
        
        .appointment-cell {
            border: 1px solid black;
            vertical-align: top;
            padding: 0;
            height: 15px;
            position: relative;
            width: calc((100% - 70px) / 7);
        }
        
        .appointment-cell.hour-row {
            background: #f5f5f5;
        }
        
        .appointment {
            font-size: 7px;
            line-height: 0.9;
            height: 100%;
            padding: 1px;
            overflow: hidden;
            word-wrap: break-word;
        }
        
        .appointment-time {
            font-size: 6px;
            color: #333;
            font-weight: normal;
        }
        
        .appointment-name {
            font-weight: bold;
            margin-top: 0;
            font-size: 7px;
            word-wrap: break-word;
            overflow-wrap: break-word;
        }
        
        .simple-practice-appt {
            background: white;
            border: 1px solid #6495ED;
            border-left: 3px solid #6495ED;
        }
        
        .google-calendar-appt {
            background: white;
            border: 1px dashed #4CAF50;
        }
        
        .holiday-appt {
            background: #ffd700;
        }
    </style>
</head>
<body>
    <div class="planner-container">
        <div class="header">
            <h1>WEEKLY PLANNER</h1>
            <div class="week-info">${startMonth} ${startDay}-${endDay} • Week ${weekNumber}</div>
        </div>
        
        <div class="stats-container">
            <div class="stat-box">
                <span class="stat-number">${stats.totalEvents}</span>
                <div class="stat-label">Total Appointments</div>
            </div>
            <div class="stat-box">
                <span class="stat-number">${stats.totalHours.toFixed(1)}h</span>
                <div class="stat-label">Scheduled Time</div>
            </div>
            <div class="stat-box">
                <span class="stat-number">${stats.dailyAverage.toFixed(1)}h</span>
                <div class="stat-label">Daily Average</div>
            </div>
            <div class="stat-box">
                <span class="stat-number">${stats.availableTime.toFixed(0)}h</span>
                <div class="stat-label">Available Time</div>
            </div>
        </div>
        
        <div class="legend">
            <div class="legend-item">
                <div class="legend-box simple-practice"></div>
                <span>SimplePractice</span>
            </div>
            <div class="legend-item">
                <div class="legend-box google-calendar"></div>
                <span>Google Calendar</span>
            </div>
            <div class="legend-item">
                <div class="legend-box holidays"></div>
                <span>Holidays in United States</span>
            </div>
        </div>
        
        <table class="calendar-table">
            <thead>
                <tr>
                    <th class="time-header">TIME</th>
                    ${dayHeaders.map(day => `
                        <th class="day-header">
                            ${day.name}
                            <span class="day-number">${day.number}</span>
                        </th>
                    `).join('')}
                </tr>
            </thead>
            <tbody>
                ${timeSlots.map((timeSlot, timeIndex) => {
                  const isHour = timeSlot.endsWith(':00');
                  const rowClass = isHour ? 'hour-row' : '';
                  const timeClass = isHour ? 'time-hour' : 'time-half';
                  
                  return `
                    <tr class="${rowClass}">
                        <td class="time-slot ${rowClass}">
                            <span class="${timeClass}">${timeSlot}</span>
                        </td>
                        ${dayHeaders.map((_, dayIndex) => {
                          const dayEvents = eventsByDayAndTime[dayIndex]?.[timeIndex] || [];
                          return `
                            <td class="appointment-cell ${rowClass}">
                              ${dayEvents.map(event => {
                                const eventType = getEventType(event);
                                const cleanTitle = event.title.replace(' Appointment', '');
                                const startTime = new Date(event.startTime);
                                const timeStr = startTime.toLocaleTimeString('en-US', { 
                                  hour: '2-digit', 
                                  minute: '2-digit',
                                  hour12: false 
                                });
                                
                                return `
                                  <div class="appointment ${eventType}">
                                    <div class="appointment-name">${cleanTitle}</div>
                                    <div class="appointment-time">${timeStr}</div>
                                  </div>
                                `;
                              }).join('')}
                            </td>
                          `;
                        }).join('')}
                    </tr>
                  `;
                }).join('')}
            </tbody>
        </table>
    </div>
</body>
</html>`;
}

function processEventsForGrid(events: CalendarEvent[], weekStartDate: Date, timeSlots: string[]): any[][] {
  const grid: any[][] = Array(7).fill(null).map(() => Array(timeSlots.length).fill(null).map(() => []));
  
  events.forEach(event => {
    const eventDate = new Date(event.startTime);
    const dayIndex = Math.floor((eventDate.getTime() - weekStartDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (dayIndex >= 0 && dayIndex < 7) {
      const eventHour = eventDate.getHours();
      const eventMinute = eventDate.getMinutes();
      
      // Find the corresponding time slot
      const timeSlotIndex = timeSlots.findIndex(slot => {
        const [slotHour, slotMinute] = slot.split(':').map(Number);
        return (eventHour === slotHour && eventMinute >= slotMinute && eventMinute < slotMinute + 30) ||
               (eventHour === slotHour && slotMinute === 0 && eventMinute < 30) ||
               (eventHour === slotHour && slotMinute === 30 && eventMinute >= 30);
      });
      
      if (timeSlotIndex >= 0) {
        grid[dayIndex][timeSlotIndex].push(event);
      }
    }
  });
  
  return grid;
}

function getEventType(event: CalendarEvent): string {
  if (event.title.includes('Appointment') || event.source === 'simplepractice') {
    return 'simple-practice-appt';
  } else if (event.source === 'google') {
    return 'google-calendar-appt';
  } else {
    return 'holiday-appt';
  }
}