// Core PDF types
export interface PDFDocument {
  id: string
  name: string
  url: string
  pages: number
  size: number
  uploadedAt: Date
  modifiedAt: Date
}

export interface PDFPage {
  pageNumber: number
  width: number
  height: number
  rotation: number
}

// Text selection types
export interface TextSelection {
  id: string
  text: string
  pageNumber: number
  boundingBoxes: BoundingBox[]
  startOffset: number
  endOffset: number
  containerElement: HTMLElement
}

export interface BoundingBox {
  x: number
  y: number
  width: number
  height: number
}

// Annotation types
export interface AnnotationData {
  id: string
  type: 'highlight' | 'underline' | 'strikethrough' | 'note' | 'rectangle' | 'circle' | 'arrow' | 'freehand'
  pageNumber: number
  coordinates: {
    x: number
    y: number
    width?: number
    height?: number
    points?: number[]
  }
  style: {
    color: string
    strokeWidth: number
    opacity: number
    fontSize?: number
  }
  content?: string
  createdAt: Date
  updatedAt: Date
}

export interface AnnotationTool {
  type: AnnotationData['type']
  color: string
  strokeWidth: number
  opacity: number
}

// Editor types
export interface EditorTool {
  id: string
  name: string
  icon: string
  category: 'text' | 'shape' | 'image' | 'annotation'
}

export interface EditorState {
  selectedTool: EditorTool | null
  zoom: number
  currentPage: number
  isLoading: boolean
  isDirty: boolean
}

// UI Component types
export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  children: React.ReactNode
  onClick?: () => void
  className?: string
}

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

// API Response types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface UploadResponse {
  documentId: string
  url: string
  pages: number
  size: number
}