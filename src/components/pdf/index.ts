export { PDFViewer } from './pdf-viewer'
export { VirtualizedPDFViewer } from './virtualized-pdf-viewer'
export { PDFViewerWithAnnotations } from './pdf-viewer-with-annotations'
export { CanvasOverlay } from './canvas-overlay'
export { AnnotationLayer } from './annotation-layer'

// Re-export coordinate mapping utilities
export * from './coordinate-mapper'

// Re-export types that might be useful for consumers
export type { 
  PDFDocument, 
  PDFPage, 
  ApiResponse, 
  UploadResponse 
} from '@/types'

export type { 
  AnnotationData, 
  AnnotationTool 
} from './canvas-overlay'