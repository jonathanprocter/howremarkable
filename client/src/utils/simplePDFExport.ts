/**
 * Simplified PDF Export - Direct and Reliable
 */

import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { DynamicDailyPlannerGenerator } from './dynamicDailyPlannerGenerator';
import { CalendarEvent } from '../types/calendar';
import { format } from 'date-fns';

export async function exportSimplePDF(
  date: Date,
  events: CalendarEvent[]
): Promise<void> {
  try {
    console.log('🚀 Starting Simple PDF Export');
    console.log('📅 Date:', format(date, 'yyyy-MM-dd'));
    console.log('📊 Events:', events.length);

    // Create the HTML generator
    const generator = new DynamicDailyPlannerGenerator();
    
    // Generate HTML content
    const html = generator.generateCompleteDailyPlannerHTML(date, events);
    console.log('✅ HTML generated successfully, length:', html.length);
    
    // Create a temporary container in the current document
    const container = document.createElement('div');
    container.innerHTML = html;
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '-9999px';
    container.style.width = '816px';
    container.style.height = '1056px';
    container.style.backgroundColor = '#FAFAF7';
    container.style.fontFamily = 'Georgia, serif';
    
    // Add to document body
    document.body.appendChild(container);
    
    // Wait for rendering
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Capture with html2canvas
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#FAFAF7',
      width: 816,
      height: 1056,
      logging: false
    });
    
    console.log('✅ Canvas captured:', canvas.width, 'x', canvas.height);
    
    // Remove temporary container
    document.body.removeChild(container);
    
    // Create PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: [612, 792],
      compress: false
    });
    
    // Calculate scaling
    const pageWidth = 612;
    const pageHeight = 792;
    const margins = 36;
    const availableWidth = pageWidth - (margins * 2);
    const availableHeight = pageHeight - (margins * 2);
    
    const scaleX = availableWidth / canvas.width;
    const scaleY = availableHeight / canvas.height;
    const scale = Math.min(scaleX, scaleY);
    
    const finalWidth = canvas.width * scale;
    const finalHeight = canvas.height * scale;
    
    // Center on page
    const x = (pageWidth - finalWidth) / 2;
    const y = (pageHeight - finalHeight) / 2;
    
    // Convert to image and add to PDF
    const imgData = canvas.toDataURL('image/png', 1.0);
    pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight);
    
    // Save PDF
    const filename = `Daily_Planner_${format(date, 'yyyy-MM-dd')}.pdf`;
    pdf.save(filename);
    
    console.log('✅ PDF exported successfully:', filename);
    
  } catch (error) {
    console.error('❌ Simple PDF export failed:', error);
    throw new Error(`PDF export failed: ${error.message}`);
  }
}