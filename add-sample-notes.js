/**
 * Script to add sample Event Notes and Action Items to existing events
 * This demonstrates the enhanced PDF export functionality
 */

async function addSampleNotesAndActionItems() {
  console.log('🎯 Adding sample Event Notes and Action Items to database events...');
  
  // Sample data for events with notes and action items
  const sampleEnhancements = [
    {
      title: "Dan re: Supervision",
      notes: [
        "Review quarterly performance metrics",
        "Discuss team development goals",
        "Address any outstanding issues"
      ],
      actionItems: [
        "Schedule follow-up meeting for next week",
        "Prepare performance review documents",
        "Send meeting summary to team"
      ]
    },
    {
      title: "Sherrifa Hoosein Appointment",
      notes: [
        "Previous session focused on anxiety management",
        "Client showed improvement in coping strategies"
      ],
      actionItems: [
        "Assign homework exercises",
        "Schedule next appointment",
        "Follow up on medication compliance"
      ]
    },
    {
      title: "Coffee with Nora",
      notes: [
        "Fully's Revenue update and LMHC discussion",
        "Market analysis for Q3 expansion"
      ],
      actionItems: [
        "See if she's interested in the Commack Office?",
        "Send location details and lease terms"
      ]
    },
    {
      title: "Call with Blake",
      notes: [
        "Received the receipt for the Pfizer transaction",
        "Discussed budget allocations for next quarter"
      ],
      actionItems: [
        "Client follow-up required",
        "Process insurance claim",
        "Update billing records"
      ]
    },
    {
      title: "Vivian Meador Appointment",
      notes: [
        "Review notes prior to our session",
        "Patient showing progress with treatment plan"
      ],
      actionItems: [
        "Send the Vivian email to let him know about the passing of her brother",
        "Adjust treatment plan as needed",
        "Schedule grief counseling resources"
      ]
    }
  ];

  try {
    // First, get current events from the API
    const response = await fetch('/api/events');
    const events = await response.json();
    
    console.log(`📊 Found ${events.length} existing events in database`);
    
    let updatedCount = 0;
    
    // Update events with sample notes and action items
    for (const enhancement of sampleEnhancements) {
      // Find matching event by title (case-insensitive partial match)
      const matchingEvent = events.find(event => 
        event.title && event.title.toLowerCase().includes(enhancement.title.toLowerCase())
      );
      
      if (matchingEvent) {
        console.log(`📝 Updating event: ${matchingEvent.title}`);
        
        // Update the event with notes and action items
        const updateResponse = await fetch(`/api/events/${matchingEvent.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            notes: enhancement.notes,
            actionItems: enhancement.actionItems
          })
        });
        
        if (updateResponse.ok) {
          console.log(`✅ Successfully updated: ${matchingEvent.title}`);
          updatedCount++;
        } else {
          console.error(`❌ Failed to update: ${matchingEvent.title}`);
        }
      } else {
        console.log(`⚠️ No matching event found for: ${enhancement.title}`);
      }
    }
    
    console.log(`🎉 Successfully updated ${updatedCount} events with sample notes and action items`);
    console.log('📦 Enhanced PDF exports will now show Event Notes and Action Items for these events');
    
    // Provide instructions for testing
    console.log('\n🔍 To test the enhanced exports:');
    console.log('1. Use "Enhanced Weekly with Notes" button');
    console.log('2. Use "Enhanced Daily with Notes" button');
    console.log('3. Use "Enhanced Weekly Package (8 Pages)" button');
    console.log('\nThese exports will include the Event Notes and Action Items in expanded layouts.');
    
    return {
      success: true,
      updatedCount,
      totalEvents: events.length
    };
    
  } catch (error) {
    console.error('❌ Error adding sample notes and action items:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Make function available globally for testing
window.addSampleNotesAndActionItems = addSampleNotesAndActionItems;

// Auto-run if this script is executed directly
if (typeof window !== 'undefined') {
  console.log('🎯 Sample notes enhancement script loaded');
  console.log('Run addSampleNotesAndActionItems() to add sample data');
}

export { addSampleNotesAndActionItems };