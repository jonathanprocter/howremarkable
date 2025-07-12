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
    console.log('✅ HTML generated, length:', html.length);
    
    // Create a new window/popup to render the HTML cleanly
    const popupWindow = window.open('', '_blank', 'width=816,height=1056,scrollbars=no');
    
    if (!popupWindow) {
      throw new Error('Failed to open popup window for PDF generation. Please allow popups for this site.');
    }
    
    console.log('✅ Popup window opened successfully');
    
    // Write the HTML to the popup window
    popupWindow.document.write(html);
    popupWindow.document.close();
    
    console.log('✅ HTML written to popup window');
    
    // Wait for the popup to load completely
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Popup window load timeout'));
      }, 10000);
      
      if (popupWindow.document.readyState === 'complete') {
        clearTimeout(timeout);
        resolve(null);
      } else {
        popupWindow.addEventListener('load', () => {
          clearTimeout(timeout);
          resolve(null);
        });
      }
    });
    
    // Additional wait for fonts and rendering
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Find the content in the popup
    const content = popupWindow.document.body;
    console.log('✅ Content element found in popup:', content.tagName);
    
    // Capture the content as canvas
    const canvas = await html2canvas(content, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#FAFAF7',
      width: 816,
      height: 1056,
      logging: true,
      foreignObjectRendering: true,
      removeContainer: false,
      imageTimeout: 10000,
      onclone: (clonedDoc) => {
        // Ensure styling is preserved in cloned document
        const style = clonedDoc.createElement('style');
        style.textContent = `
          body { font-family: Georgia, serif; background: #FAFAF7; margin: 0; padding: 0; }
          * { box-sizing: border-box; }
        `;
        clonedDoc.head.appendChild(style);
        console.log('✅ Styles applied to cloned document');
      }
    });
    
    console.log('✅ Canvas created:', canvas.width, 'x', canvas.height);
    
    // Close the popup window
    popupWindow.close();
    
    // Verify canvas has content
    if (canvas.width === 0 || canvas.height === 0) {
      throw new Error('Canvas has no content - check HTML rendering');
    }
    
    // Create PDF with high quality settings
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: [612, 792], // US Letter in points
      compress: false,
      precision: 2
    });
    
    console.log('✅ PDF document created');
    
    // Calculate dimensions to fit the page properly
    const pageWidth = 612;
    const pageHeight = 792;
    const margins = 36; // 0.5 inch margins
    const availableWidth = pageWidth - (margins * 2);
    const availableHeight = pageHeight - (margins * 2);
    
    // Scale to fit within available space
    const scaleX = availableWidth / canvas.width;
    const scaleY = availableHeight / canvas.height;
    const scale = Math.min(scaleX, scaleY);
    
    const finalWidth = canvas.width * scale;
    const finalHeight = canvas.height * scale;
    
    // Center the image on the page
    const x = (pageWidth - finalWidth) / 2;
    const y = (pageHeight - finalHeight) / 2;
    
    console.log('✅ Calculated dimensions:', { finalWidth, finalHeight, x, y });
    
    // Convert canvas to image data
    const imgData = canvas.toDataURL('image/png', 1.0);
    console.log('✅ Canvas converted to image data, length:', imgData.length);
    
    // Add the canvas image to PDF
    pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight, '', 'FAST');
    console.log('✅ Image added to PDF');
    
    // Generate filename
    const filename = `Daily_Planner_${format(date, 'yyyy-MM-dd')}.pdf`;
    
    // Save the PDF
    pdf.save(filename);
    
    console.log('✅ Dynamic Daily Planner PDF exported successfully:', filename);
    
  } catch (error) {
    console.error('❌ Dynamic Daily Planner PDF export failed:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // Provide more detailed error information
    if (error.name === 'SecurityError') {
      console.error('Security error - popup blocked or cross-origin issue');
    } else if (error.name === 'TypeError') {
      console.error('Type error - likely HTML2Canvas or jsPDF issue');
    }
    
    throw new Error(`PDF export failed: ${error.message || 'Unknown error'}`);
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