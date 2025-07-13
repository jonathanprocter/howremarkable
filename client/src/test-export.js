window.testCurrentWeeklyExport = async () => {
  try {
    console.log('Testing Current Weekly Export...');
    const { exportCurrentWeeklyView } = await import('./src/utils/currentWeeklyExport');
    
    // Mock data for testing
    const mockEvents = [];
    const weekStart = new Date('2025-07-07');
    const weekEnd = new Date('2025-07-13');
    
    console.log('Calling exportCurrentWeeklyView...');
    await exportCurrentWeeklyView(mockEvents, weekStart, weekEnd);
    console.log('Export completed successfully!');
  } catch (error) {
    console.error('Export failed:', error);
  }
};
