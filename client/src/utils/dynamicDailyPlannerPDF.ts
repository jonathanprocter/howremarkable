/**
 * Dynamic Daily Planner PDF Export
 * Creates PDF from the dynamic daily planner HTML generator
 */

import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { DynamicDailyPlannerGenerator } from './dynamicDailyPlannerGenerator';
import { CalendarEvent } from '../types/calendar';
import { format } from 'date-fns';

export async function exportDynamicDailyPlannerToPDF(
  date: Date,
  events: CalendarEvent[]
): Promise<void> {
  try {
    console.log('🚀 Starting Dynamic Daily Planner PDF Export');
    console.log('📅 Date:', format(date, 'yyyy-MM-dd'));
    console.log('📋 Events:', events.length);

    // Create the planner generator
    const generator = new DynamicDailyPlannerGenerator();
    
    // Generate the complete HTML
    const html = generator.generateCompleteDailyPlannerHTML(date, events);
    
    // Create a temporary container to render the HTML
    const container = document.createElement('div');
    container.innerHTML = html;
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '-9999px';
    container.style.width = '8.5in'; // 816px at 96dpi
    container.style.minHeight = '11in'; // 1056px at 96dpi
    container.style.background = '#FAFAF7';
    container.style.padding = '0.75in';
    container.style.fontSize = '14px';
    container.style.fontFamily = 'Georgia, serif';
    
    // Add to DOM temporarily
    document.body.appendChild(container);
    
    // Wait for fonts and all content to render
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Capture the HTML as canvas with high quality settings
    const canvas = await html2canvas(container, {
      scale: 3, // Higher scale for better quality
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#FAFAF7',
      width: 816, // 8.5in at 96dpi
      height: 1056, // 11in at 96dpi
      logging: false,
      foreignObjectRendering: true,
      removeContainer: false,
      imageTimeout: 30000,
      onclone: (clonedDoc) => {
        // Ensure proper styling in cloned document
        const style = clonedDoc.createElement('style');
        style.textContent = `
          * { box-sizing: border-box; }
          body { font-family: Georgia, serif; }
        `;
        clonedDoc.head.appendChild(style);
      }
    });
    
    // Remove temporary container
    document.body.removeChild(container);
    
    // Create PDF with high quality settings
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: [612, 792], // US Letter in points
      compress: false,
      precision: 2
    });
    
    // Calculate dimensions to fit the page properly
    const pageWidth = 612;
    const pageHeight = 792;
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    // If the image is too tall, scale it down to fit
    let finalWidth = imgWidth;
    let finalHeight = imgHeight;
    
    if (imgHeight > pageHeight) {
      finalHeight = pageHeight;
      finalWidth = (canvas.width * finalHeight) / canvas.height;
    }
    
    // Center the image on the page
    const x = (pageWidth - finalWidth) / 2;
    const y = (pageHeight - finalHeight) / 2;
    
    // Add the canvas image to PDF with high quality
    const imgData = canvas.toDataURL('image/png', 1.0);
    pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight, '', 'FAST');
    
    // Generate filename
    const filename = `Daily_Planner_${format(date, 'yyyy-MM-dd')}.pdf`;
    
    // Save the PDF
    pdf.save(filename);
    
    console.log('✅ Dynamic Daily Planner PDF exported successfully:', filename);
    
  } catch (error) {
    console.error('❌ Dynamic Daily Planner PDF export failed:', error);
    throw error;
  }
}

export async function exportDynamicDailyPlannerHTML(
  date: Date,
  events: CalendarEvent[]
): Promise<string> {
  try {
    console.log('🚀 Starting Dynamic Daily Planner HTML Export');
    
    // Create the planner generator
    const generator = new DynamicDailyPlannerGenerator();
    
    // Generate the complete HTML
    const html = generator.generateCompleteDailyPlannerHTML(date, events);
    
    // Create a blob and download
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    // Create temporary link and trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = `Daily_Planner_${format(date, 'yyyy-MM-dd')}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    URL.revokeObjectURL(url);
    
    console.log('✅ Dynamic Daily Planner HTML exported successfully');
    
    return html;
    
  } catch (error) {
    console.error('❌ Dynamic Daily Planner HTML export failed:', error);
    throw error;
  }
}

export async function previewDynamicDailyPlanner(
  date: Date,
  events: CalendarEvent[]
): Promise<void> {
  try {
    console.log('🚀 Starting Dynamic Daily Planner Preview');
    
    // Create the planner generator
    const generator = new DynamicDailyPlannerGenerator();
    
    // Generate the complete HTML
    const html = generator.generateCompleteDailyPlannerHTML(date, events);
    
    // Open in a new window
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(html);
      newWindow.document.close();
    }
    
    console.log('✅ Dynamic Daily Planner preview opened');
    
  } catch (error) {
    console.error('❌ Dynamic Daily Planner preview failed:', error);
    throw error;
  }
}