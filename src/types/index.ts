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