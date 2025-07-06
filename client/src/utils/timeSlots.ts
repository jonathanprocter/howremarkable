import { TimeSlot } from '../types/calendar';

export const generateTimeSlots = (): TimeSlot[] => {
  const timeSlots: TimeSlot[] = [];
  
  for (let hour = 6; hour <= 23; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      timeSlots.push({
        time: timeString,
        hour,
        minute
      });
    }
  }
  
  // Add the final 23:30 slot
  timeSlots.push({
    time: '23:30',
    hour: 23,
    minute: 30
  });
  
  return timeSlots;
};

export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

export const formatTime12Hour = (date: Date): string => {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

export const getTimeSlotIndex = (time: string): number => {
  const timeSlots = generateTimeSlots();
  return timeSlots.findIndex(slot => slot.time === time);
};

export const isEventInTimeSlot = (event: { startTime: Date; endTime: Date }, timeSlot: TimeSlot): boolean => {
  const slotStart = new Date(event.startTime);
  slotStart.setHours(timeSlot.hour, timeSlot.minute, 0, 0);
  
  const slotEnd = new Date(slotStart);
  slotEnd.setMinutes(slotStart.getMinutes() + 30);
  
  return event.startTime < slotEnd && event.endTime > slotStart;
};

export const getEventDurationInSlots = (event: { startTime: Date; endTime: Date }): number => {
  const durationMs = event.endTime.getTime() - event.startTime.getTime();
  const durationMinutes = durationMs / (1000 * 60);
  return Math.ceil(durationMinutes / 30);
};
