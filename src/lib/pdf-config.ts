// PDF-lib configuration
export const PDF_CONFIG = {
  maxFileSize: 50 * 1024 * 1024, // 50MB
  allowedTypes: ['application/pdf'],
  quality: 1.0,
  compression: true,
} as const

// React-PDF configuration
export const REACT_PDF_OPTIONS = {
  cMapUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/cmaps/',
  cMapPacked: true,
  standardFontDataUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/standard_fonts/',
  workerSrc: 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js',
} as const

// Fabric.js canvas configuration
export const CANVAS_CONFIG = {
  width: 800,
  height: 1000,
  backgroundColor: '#ffffff',
  selection: true,
  preserveObjectStacking: true,
} as const