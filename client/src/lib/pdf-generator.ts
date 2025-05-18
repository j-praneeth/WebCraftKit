import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export const generatePDF = async (element: string | HTMLElement, filename: string): Promise<void> => {
  let targetElement: HTMLElement | null;
  
  if (typeof element === 'string') {
    targetElement = document.getElementById(element);
  } else {
    targetElement = element;
  }

  if (!targetElement) {
    throw new Error('Element not found');
  }

  try {
    // Capture the element as a canvas
    const canvas = await html2canvas(targetElement, {
      scale: 2, // Higher scale for better quality
      useCORS: true, // Enable loading of external resources
      logging: false,
      windowWidth: targetElement.scrollWidth,
      windowHeight: targetElement.scrollHeight,
    });

    // Convert to PDF with A4 dimensions
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Calculate dimensions
    const imgWidth = 210; // A4 width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    pdf.save(filename);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};