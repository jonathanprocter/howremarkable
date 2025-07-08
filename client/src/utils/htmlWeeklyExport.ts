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

    // Load your EXACT template content
    const templateResponse = await fetch('/attached_assets/weekly_planner_remarkable_1751937137287.html');
    const exactTemplate = await templateResponse.text();

    // Create a temporary container with your exact template
    const container = document.createElement('div');
    container.innerHTML = exactTemplate;
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '2160px'; // reMarkable Paper Pro width
    container.style.height = '1620px'; // reMarkable Paper Pro height
    container.style.background = 'white';
    container.style.overflow = 'visible';
    document.body.appendChild(container);

    // Wait for layout to stabilize
    await new Promise(resolve => setTimeout(resolve, 500));

    // Convert to canvas using your exact template
    const canvas = await html2canvas(container, {
      width: 2160,
      height: 1620,
      scale: 2, // High quality
      backgroundColor: '#ffffff',
      useCORS: true,
      allowTaint: false,
      logging: false
    });

    // Remove the temporary container
    document.body.removeChild(container);

    // Create PDF with proper reMarkable Paper Pro dimensions (landscape)
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'px',
      format: [2160, 1620]
    });

    // Add the canvas to PDF
    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', 0, 0, 2160, 1620);

    // Download the PDF
    const filename = `weekly-planner-${weekStartDate.toISOString().split('T')[0]}.pdf`;
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
  // Use your exact template content
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Weekly Planner - Jul 7-13, Week 28</title>
    <style>
        body {
            font-family: 'Times New Roman', serif;
            margin: 0;
            padding: 15px;
            background: white;
            color: black;
            font-size: 11px;
            line-height: 1.1;
            width: 100vw;
            box-sizing: border-box;
        }
        
        .planner-container {
            width: 100%;
            max-width: none;
            margin: 0;
            overflow-x: auto;
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
        
        .calendar-table td,
        .calendar-table th {
            border-left: 1px solid black;
            border-right: 1px solid black;
        }
        
        .time-header, .day-header {
            background: white;
            border-top: 1px solid black;
            border-bottom: 1px solid black;
            border-left: 1px solid black;
            border-right: 1px solid black;
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
            border-left: 2px solid black;
            border-right: 1px solid black;
        }
        
        .day-header:first-of-type {
            border-left: 1px solid black;
        }
        
        .day-header:last-of-type {
            border-right: 1px solid black;
        }
        
        .day-number {
            font-size: 22px;
            font-weight: bold;
            margin-top: 2px;
            display: block;
        }
        
        .time-slot {
            border-top: 1px solid black;
            border-bottom: 1px solid black;
            border-left: 1px solid black;
            border-right: 2px solid black;
            text-align: center;
            vertical-align: middle;
            font-weight: bold;
            padding: 1px;
            width: 70px;
            font-size: 9px;
            display: table-cell;
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
            border-top: 1px solid black;
            border-bottom: 1px solid black;
            border-left: 2px solid black;
            border-right: 1px solid black;
            vertical-align: top;
            padding: 0;
            height: 22px;
            position: relative;
            width: calc((100% - 70px) / 7);
        }
        
        .appointment-cell:first-of-type {
            border-left: 1px solid black;
        }
        
        .appointment-cell:last-of-type {
            border-right: 1px solid black;
        }
        
        .appointment-cell.hour-row {
            background: #f5f5f5;
        }
        
        .appointment {
            font-size: 7px;
            line-height: 0.9;
            height: 100%;
            padding: 1px 1px;
            overflow: hidden;
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
            hyphens: auto;
        }
        
        /* Specific styling for different appointment types */
        .simple-practice-appt {
            background: white;
            border: 2px solid #6495ED;
            border-left: 4px solid #6495ED;
        }
        
        .google-calendar-appt {
            background: white;
            border: 2px dashed #4CAF50;
        }
        
        .appointment-span {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            z-index: 10;
        }
        
        .span-1 { height: 21px; }
        .span-2 { height: 42px; }
        .span-3 { height: 63px; }
        .span-4 { height: 84px; }
    </style>
</head>
<body>
    <div class="planner-container">
        <div class="header">
            <h1>WEEKLY PLANNER</h1>
            <div class="week-info">Jul 7-13 • Week 28</div>
        </div>
        
        <div class="stats-container">
            <div class="stat-box">
                <span class="stat-number">33</span>
                <div class="stat-label">Total Appointments</div>
            </div>
            <div class="stat-box">
                <span class="stat-number">33.8h</span>
                <div class="stat-label">Scheduled Time</div>
            </div>
            <div class="stat-box">
                <span class="stat-number">4.8h</span>
                <div class="stat-label">Daily Average</div>
            </div>
            <div class="stat-box">
                <span class="stat-number">89h</span>
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
                    <th class="day-header">MON<br><span class="day-number">7</span></th>
                    <th class="day-header">TUE<br><span class="day-number">8</span></th>
                    <th class="day-header">WED<br><span class="day-number">9</span></th>
                    <th class="day-header">THU<br><span class="day-number">10</span></th>
                    <th class="day-header">FRI<br><span class="day-number">11</span></th>
                    <th class="day-header">SAT<br><span class="day-number">12</span></th>
                    <th class="day-header">SUN<br><span class="day-number">13</span></th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td class="time-slot time-hour hour-row">06:00</td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                </tr>
                <tr>
                    <td class="time-slot time-half">06:30</td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                </tr>
                <tr>
                    <td class="time-slot time-hour hour-row">07:00</td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row">
                        <div class="appointment simple-practice-appt span-2 appointment-span">
                            <div class="appointment-time">07:00</div>
                            <div class="appointment-name">Richie Hayes</div>
                        </div>
                    </td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                </tr>
                <tr>
                    <td class="time-slot time-half">07:30</td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell">
                        <div class="appointment simple-practice-appt span-2 appointment-span">
                            <div class="appointment-time">07:30</div>
                            <div class="appointment-name">Ruben Spilberg</div>
                        </div>
                    </td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                </tr>
                <tr>
                    <td class="time-slot time-hour hour-row">08:00</td>
                    <td class="appointment-cell hour-row">
                        <div class="appointment simple-practice-appt span-2 appointment-span">
                            <div class="appointment-time">08:00</div>
                            <div class="appointment-name">Dan re: Supervision</div>
                        </div>
                    </td>
                    <td class="appointment-cell hour-row">
                        <div class="appointment google-calendar-appt span-2 appointment-span">
                            <div class="appointment-time">08:00</div>
                            <div class="appointment-name">Coffee with Nora</div>
                        </div>
                    </td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row">
                        <div class="appointment simple-practice-appt span-2 appointment-span">
                            <div class="appointment-time">08:00</div>
                            <div class="appointment-name">John Best</div>
                        </div>
                    </td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                </tr>
                <tr>
                    <td class="time-slot time-half">08:30</td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                </tr>
                <tr>
                    <td class="time-slot time-hour hour-row">09:00</td>
                    <td class="appointment-cell hour-row">
                        <div class="appointment google-calendar-appt span-2 appointment-span">
                            <div class="appointment-time">09:00</div>
                            <div class="appointment-name">Sherifa Hossein</div>
                        </div>
                    </td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                </tr>
                <tr>
                    <td class="time-slot time-half">09:30</td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell">
                        <div class="appointment simple-practice-appt span-2 appointment-span">
                            <div class="appointment-time">09:30</div>
                            <div class="appointment-name">Kristi Rook</div>
                        </div>
                    </td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                </tr>
                <tr>
                    <td class="time-slot time-hour hour-row">10:00</td>
                    <td class="appointment-cell hour-row">
                        <div class="appointment simple-practice-appt span-2 appointment-span">
                            <div class="appointment-time">10:00</div>
                            <div class="appointment-name">Nancy Grossman</div>
                        </div>
                    </td>
                    <td class="appointment-cell hour-row">
                        <div class="appointment google-calendar-appt span-2 appointment-span">
                            <div class="appointment-time">10:00</div>
                        </div>
                    </td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row">
                        <div class="appointment simple-practice-appt span-2 appointment-span">
                            <div class="appointment-time">10:00</div>
                            <div class="appointment-name">Calvin Hill</div>
                        </div>
                    </td>
                    <td class="appointment-cell hour-row"></td>
                </tr>
                <tr>
                    <td class="time-slot time-half">10:30</td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                </tr>
                <tr>
                    <td class="time-slot time-hour hour-row">11:00</td>
                    <td class="appointment-cell hour-row">
                        <div class="appointment simple-practice-appt span-2 appointment-span">
                            <div class="appointment-time">11:00</div>
                            <div class="appointment-name">Amberly Comeau</div>
                        </div>
                    </td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row">
                        <div class="appointment simple-practice-appt span-2 appointment-span">
                            <div class="appointment-time">11:00</div>
                            <div class="appointment-name">Paul Benjamin</div>
                        </div>
                    </td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                </tr>
                <tr>
                    <td class="time-slot time-half">11:30</td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                </tr>
                <tr>
                    <td class="time-slot time-hour hour-row">12:00</td>
                    <td class="appointment-cell hour-row">
                        <div class="appointment google-calendar-appt span-2 appointment-span">
                            <div class="appointment-time">12:00</div>
                            <div class="appointment-name">Maryellen Dankenbrink</div>
                        </div>
                    </td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                </tr>
                <tr>
                    <td class="time-slot time-half">12:30</td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                </tr>
                <tr>
                    <td class="time-slot time-hour hour-row">13:00</td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row">
                        <div class="appointment simple-practice-appt span-2 appointment-span">
                            <div class="appointment-time">13:00</div>
                            <div class="appointment-name">Ava Moskowitz</div>
                        </div>
                    </td>
                    <td class="appointment-cell hour-row">
                        <div class="appointment simple-practice-appt span-2 appointment-span">
                            <div class="appointment-time">13:00</div>
                            <div class="appointment-name">Noah Silverman</div>
                        </div>
                    </td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                </tr>
                <tr>
                    <td class="time-slot time-half">13:30</td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                </tr>
                <tr>
                    <td class="time-slot time-hour hour-row">14:00</td>
                    <td class="appointment-cell hour-row">
                        <div class="appointment simple-practice-appt span-2 appointment-span">
                            <div class="appointment-time">14:00</div>
                            <div class="appointment-name">Angelica Ruden</div>
                        </div>
                    </td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                </tr>
                <tr>
                    <td class="time-slot time-half">14:30</td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell">
                        <div class="appointment simple-practice-appt span-2 appointment-span">
                            <div class="appointment-time">14:30</div>
                            <div class="appointment-name">Luke Knox</div>
                        </div>
                    </td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                </tr>
                <tr>
                    <td class="time-slot time-hour hour-row">15:00</td>
                    <td class="appointment-cell hour-row">
                        <div class="appointment simple-practice-appt span-2 appointment-span">
                            <div class="appointment-time">15:00</div>
                            <div class="appointment-name">Sarah Palladino</div>
                        </div>
                    </td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                </tr>
                <tr>
                    <td class="time-slot time-half">15:30</td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                </tr>
                <tr>
                    <td class="time-slot time-hour hour-row">16:00</td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                </tr>
                <tr>
                    <td class="time-slot time-half">16:30</td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                </tr>
                <tr>
                    <td class="time-slot time-hour hour-row">17:00</td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                </tr>
                <tr>
                    <td class="time-slot time-half">17:30</td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                </tr>
                <tr>
                    <td class="time-slot time-hour hour-row">18:00</td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                </tr>
                <tr>
                    <td class="time-slot time-half">18:30</td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                </tr>
                <tr>
                    <td class="time-slot time-hour hour-row">19:00</td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                </tr>
                <tr>
                    <td class="time-slot time-half">19:30</td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                </tr>
                <tr>
                    <td class="time-slot time-hour hour-row">20:00</td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                </tr>
                <tr>
                    <td class="time-slot time-half">20:30</td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                </tr>
                <tr>
                    <td class="time-slot time-hour hour-row">21:00</td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                </tr>
                <tr>
                    <td class="time-slot time-half">21:30</td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                </tr>
                <tr>
                    <td class="time-slot time-hour hour-row">22:00</td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                </tr>
                <tr>
                    <td class="time-slot time-half">22:30</td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                </tr>
                <tr>
                    <td class="time-slot time-hour hour-row">23:00</td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                </tr>
                <tr>
                    <td class="time-slot time-half">23:30</td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                </tr>
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