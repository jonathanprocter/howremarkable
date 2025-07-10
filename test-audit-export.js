// Test script to trigger pixel-perfect audit system
console.log('🔍 Testing Pixel-Perfect Audit System');

// Simulate export button click by calling the planner's export handler
fetch('/api/events/1')
  .then(response => response.json())
  .then(events => {
    console.log(`Loaded ${events.length} events for audit testing`);
    
    // Filter events for Monday July 7, 2025
    const testDate = new Date('2025-07-07');
    const dayEvents = events.filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate.toDateString() === testDate.toDateString();
    });
    
    console.log(`Found ${dayEvents.length} events for Monday July 7, 2025`);
    
    // Display events that will be audited
    dayEvents.forEach((event, index) => {
      console.log(`Event ${index + 1}: ${event.title} (${event.startTime} - ${event.endTime})`);
    });
    
    console.log('\nNow trigger a daily export to see the pixel-perfect audit in action...');
  })
  .catch(error => {
    console.error('Error loading events:', error);
  });