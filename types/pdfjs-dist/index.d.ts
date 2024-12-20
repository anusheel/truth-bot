// types/pdfjs-dist/index.d.ts
declare module 'pdfjs-dist/legacy/build/pdf.js' {
    interface PDFDocumentProxy {
      numPages: number;
      getPage(pageNumber: number): Promise<PDFPageProxy>;
    }
  
    interface PDFPageProxy {
      getTextContent(): Promise<{ items: { str: string }[] }>;
    }
  
    interface GetDocumentParams {
      data: Uint8Array;
    }
  
    interface GetDocumentResult {
      promise: Promise<PDFDocumentProxy>;
    }
  
    export function getDocument(params: GetDocumentParams): GetDocumentResult;
  }
  