'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { AnnotationLayer } from './annotation-layer'
import { AnnotationData, AnnotationTool } from './canvas-overlay'
import { PageDimensions } from './coordinate-mapper'
import { cn } from '@/utils/cn'

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

interface PDFViewerWithAnnotationsProps {
  fileUrl: string
  onPageChange?: (page: number) => void
  onZoomChange?: (zoom: number) => void
  onDocumentLoad?: (numPages: number) => void
  onError?: (error: Error) => void
  onAnnotationAdd?: (annotation: AnnotationData) => void
  onAnnotationUpdate?: (annotation: AnnotationData) => void
  onAnnotationDelete?: (annotationId: string) => void
  onSelectionChange?: (selectedAnnotations: AnnotationData[]) => void
  annotations?: AnnotationData[]
  selectedTool?: AnnotationTool
  className?: string
  initialPage?: number
  initialZoom?: number
  showControls?: boolean
  showAnnotationBounds?: boolean
  annotationsEnabled?: boolean
}

interface PDFViewerState {
  numPages: number
  currentPage: number
  zoom: number
  rotation: number
  isLoading: boolean
  error: string | null
  pageDimensions: Map<number, PageDimensions>
}

export function PDFViewerWithAnnotations({
  fileUrl,
  onPageChange,
  onZoomChange,
  onDocumentLoad,
  onError,
  onAnnotationAdd,
  onAnnotationUpdate,
  onAnnotationDelete,
  onSelectionChange,
  annotations = [],
  selectedTool,
  className,
  initialPage = 1,
  initialZoom = 1,
  showControls = true,
  showAnnotationBounds = false,
  annotationsEnabled = true,
}: PDFViewerWithAnnotationsProps) {
  const [state, setState] = useState<PDFViewerState>({
    numPages: 0,
    currentPage: initialPage,
    zoom: initialZoom,
    rotation: 0,
    isLoading: true,
    error: null,
    pageDimensions: new Map(),
  })

  const containerRef = useRef<HTMLDivElement>(null)
  const pageInputRef = useRef<HTMLInputElement>(null)

  // Handle document load success
  const onDocumentLoadSuccess = useCallback(
    ({ numPages }: { numPages: number }) => {
      setState(prev => ({
        ...prev,
        numPages,
        isLoading: false,
        error: null,
      }))
      onDocumentLoad?.(numPages)
    },
    [onDocumentLoad]
  )

  // Handle document load error
  const onDocumentLoadError = useCallback(
    (error: Error) => {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message,
      }))
      onError?.(error)
    },
    [onError]
  )

  // Handle page load success
  const onPageLoadSuccess = useCallback((page: any) => {
    const { width, height } = page
    setState(prev => ({
      ...prev,
      pageDimensions: new Map(prev.pageDimensions).set(state.currentPage, { width, height }),
    }))
  }, [state.currentPage])

  // Navigation functions
  const goToPreviousPage = useCallback(() => {
    if (state.currentPage > 1) {
      const newPage = state.currentPage - 1
      setState(prev => ({ ...prev, currentPage: newPage }))
      onPageChange?.(newPage)
    }
  }, [state.currentPage, onPageChange])

  const goToNextPage = useCallback(() => {
    if (state.currentPage < state.numPages) {
      const newPage = state.currentPage + 1
      setState(prev => ({ ...prev, currentPage: newPage }))
      onPageChange?.(newPage)
    }
  }, [state.currentPage, state.numPages, onPageChange])

  const goToPage = useCallback(
    (page: number) => {
      const validPage = Math.max(1, Math.min(page, state.numPages))
      setState(prev => ({ ...prev, currentPage: validPage }))
      onPageChange?.(validPage)
    },
    [state.numPages, onPageChange]
  )

  // Zoom functions
  const zoomIn = useCallback(() => {
    const newZoom = Math.min(state.zoom * 1.2, 3)
    setState(prev => ({ ...prev, zoom: newZoom }))
    onZoomChange?.(newZoom)
  }, [state.zoom, onZoomChange])

  const zoomOut = useCallback(() => {
    const newZoom = Math.max(state.zoom / 1.2, 0.1)
    setState(prev => ({ ...prev, zoom: newZoom }))
    onZoomChange?.(newZoom)
  }, [state.zoom, onZoomChange])

  const setZoom = useCallback(
    (zoom: number) => {
      const validZoom = Math.max(0.1, Math.min(zoom, 3))
      setState(prev => ({ ...prev, zoom: validZoom }))
      onZoomChange?.(validZoom)
    },
    [onZoomChange]
  )

  // Rotation function
  const rotateClockwise = useCallback(() => {
    setState(prev => ({ ...prev, rotation: (prev.rotation + 90) % 360 }))
  }, [])

  // Handle page input change
  const handlePageInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const page = parseInt(e.target.value, 10)
      if (!isNaN(page)) {
        goToPage(page)
      }
    },
    [goToPage]
  )

  // Handle page input key press
  const handlePageInputKeyPress = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        const page = parseInt(e.currentTarget.value, 10)
        if (!isNaN(page)) {
          goToPage(page)
        }
        e.currentTarget.blur()
      }
    },
    [goToPage]
  )

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return

      switch (e.key) {
        case 'ArrowLeft':
        case 'PageUp':
          e.preventDefault()
          goToPreviousPage()
          break
        case 'ArrowRight':
        case 'PageDown':
          e.preventDefault()
          goToNextPage()
          break
        case 'Home':
          e.preventDefault()
          goToPage(1)
          break
        case 'End':
          e.preventDefault()
          goToPage(state.numPages)
          break
        case '+':
        case '=':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            zoomIn()
          }
          break
        case '-':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            zoomOut()
          }
          break
        case '0':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            setZoom(1)
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [goToPreviousPage, goToNextPage, goToPage, state.numPages, zoomIn, zoomOut, setZoom])

  // Get current page dimensions
  const currentPageDimensions = state.pageDimensions.get(state.currentPage) || { width: 612, height: 792 }

  // Render loading state
  if (state.isLoading) {
    return (
      <div className={cn('flex flex-col h-full', className)}>
        {showControls && (
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-20" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
            </div>
          </div>
        )}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Skeleton className="h-96 w-72 mx-auto mb-4" />
            <Skeleton className="h-4 w-32 mx-auto" />
          </div>
        </div>
      </div>
    )
  }

  // Render error state
  if (state.error) {
    return (
      <div className={cn('flex flex-col h-full', className)}>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-destructive">
            <p className="text-lg font-medium mb-2">Failed to load PDF</p>
            <p className="text-sm text-muted-foreground">{state.error}</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col h-full bg-background', className)} ref={containerRef}>
      {showControls && (
        <div className="flex items-center justify-between p-4 border-b border-border bg-surface">
          {/* Navigation Controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousPage}
              disabled={state.currentPage <= 1}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextPage}
              disabled={state.currentPage >= state.numPages}
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-1 text-sm">
              <Input
                ref={pageInputRef}
                type="number"
                min={1}
                max={state.numPages}
                value={state.currentPage}
                onChange={handlePageInputChange}
                onKeyPress={handlePageInputKeyPress}
                className="w-16 h-8 text-center"
                aria-label="Current page"
              />
              <span className="text-muted-foreground">of {state.numPages}</span>
            </div>
          </div>

          {/* Zoom and Rotation Controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={zoomOut}
              disabled={state.zoom <= 0.1}
              aria-label="Zoom out"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground min-w-12 text-center">
              {Math.round(state.zoom * 100)}%
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={zoomIn}
              disabled={state.zoom >= 3}
              aria-label="Zoom in"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={rotateClockwise}
              aria-label="Rotate clockwise"
            >
              <RotateCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* PDF Document with Annotations */}
      <div className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-900">
        <div className="flex justify-center p-4">
          <div className="relative">
            <Document
              file={fileUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={<Skeleton className="h-96 w-72" />}
              error={
                <div className="text-center text-destructive p-8">
                  <p>Failed to load PDF document</p>
                </div>
              }
              className="shadow-lg"
            >
              <Page
                pageNumber={state.currentPage}
                scale={state.zoom}
                rotate={state.rotation}
                onLoadSuccess={onPageLoadSuccess}
                loading={<Skeleton className="h-96 w-72" />}
                error={
                  <div className="text-center text-destructive p-8">
                    <p>Failed to load page {state.currentPage}</p>
                  </div>
                }
                className="border border-border bg-white dark:bg-gray-800"
                canvasBackground="transparent"
              />
            </Document>

            {/* Annotation Layer */}
            {annotationsEnabled && (
              <AnnotationLayer
                pageNumber={state.currentPage}
                pageDimensions={currentPageDimensions}
                scale={state.zoom}
                rotation={state.rotation}
                selectedTool={selectedTool}
                annotations={annotations}
                onAnnotationAdd={onAnnotationAdd}
                onAnnotationUpdate={onAnnotationUpdate}
                onAnnotationDelete={onAnnotationDelete}
                onSelectionChange={onSelectionChange}
                showBounds={showAnnotationBounds}
                className="pointer-events-auto"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}