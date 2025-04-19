import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export const generatePDF = async (elementId: string, filename: string): Promise<void> => {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('Element not found');
  }

  try {
    // Capture the element as a canvas
    const canvas = await html2canvas(element, {
      scale: 2, // Higher scale for better quality
      useCORS: true, // Enable loading of external resources
      logging: false,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
    });

    // Convert to PDF
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'px',
      format: [canvas.width, canvas.height]
    });

    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.save(filename);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};