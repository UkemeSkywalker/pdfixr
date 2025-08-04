export { PDFViewer } from './pdf-viewer'
export { VirtualizedPDFViewer } from './virtualized-pdf-viewer'
export { PDFViewerWithAnnotations } from './pdf-viewer-with-annotations'
export { CanvasOverlay } from './canvas-overlay'
export { AnnotationLayer } from './annotation-layer'
export { AnnotationToolbar } from './annotation-toolbar'
export { TextHighlighter } from './text-highlighter'
export { TextNote } from './text-note'
export { ShapeDrawer } from './shape-drawer'
export { AnnotationDemo } from './annotation-demo'

// Re-export coordinate mapping utilities
export * from './coordinate-mapper'

// Re-export types that might be useful for consumers
export type { 
  PDFDocument, 
  PDFPage, 
  ApiResponse, 
  UploadResponse,
  TextSelection,
  BoundingBox,
  AnnotationData,
  AnnotationTool
} from '@/types'