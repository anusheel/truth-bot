import fs from 'fs';
// Import the `getDocument` function from pdfjs-dist
// The legacy build is often recommended for Node environments.
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.js';

export async function extractTextWithPDFjs(pdfPath: string): Promise<string> {
  if (!fs.existsSync(pdfPath)) {
    console.log("PDF file does not exist:", pdfPath);
    return "";
  }

  const rawData = new Uint8Array(fs.readFileSync(pdfPath));
  const loadingTask = getDocument({ data: rawData });

  // Load the PDF
  const pdf = await loadingTask.promise;
  let extractedText = "";

  // Iterate through all pages
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    // Extract and concatenate text from the page
    const pageText = content.items.map(item => (item as any).str).join(' ');
    extractedText += pageText + "\n";
  }

  return extractedText.trim();
}
