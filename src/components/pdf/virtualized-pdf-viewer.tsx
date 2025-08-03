'use client'

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { FixedSizeList as List } from 'react-window'
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/utils/cn'

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

interface VirtualizedPDFViewerProps {
  fileUrl: string
  onPageChange?: (page: number) => void
  onZoomChange?: (zoom: number) => void
  onDocumentLoad?: (numPages: number) => void
  onError?: (error: Error) => void
  className?: string
  initialPage?: number
  initialZoom?: number
  showControls?: boolean
  itemHeight?: number
  overscan?: number
}

interface PDFPageItemProps {
  index: number
  style: React.CSSProperties
  data: {
    fileUrl: string
    zoom: number
    rotation: number
    onPageLoad: (pageNumber: number, dimensions: { width: number; height: number }) => void
    onPageError: (pageNumber: number, error: Error) => void
  }
}

const PDFPageItem: React.FC<PDFPageItemProps> = ({ index, style, data }) => {
  const pageNumber = index + 1
  const { fileUrl, zoom, rotation, onPageLoad, onPageError } = data

  const handleLoadSuccess = useCallback(
    (page: any) => {
      const { width, height } = page
      onPageLoad(pageNumber, { width, height })
    },
    [pageNumber, onPageLoad]
  )

  const handleLoadError = useCallback(
    (error: Error) => {
      onPageError(pageNumber, error)
    },
    [pageNumber, onPageError]
  )

  return (
    <div style={style} className="flex justify-center items-center p-4">
      <Document file={fileUrl} loading={null} error={null}>
        <Page
          pageNumber={pageNumber}
          scale={zoom}
          rotate={rotation}
          onLoadSuccess={handleLoadSuccess}
          onLoadError={handleLoadError}
          loading={<Skeleton className="h-96 w-72" />}
          error={
            <div className="text-center text-destructive p-8 border border-border bg-surface rounded">
              <p>Failed to load page {pageNumber}</p>
            </div>
          }
          className="border border-border bg-white dark:bg-gray-800 shadow-lg"
          canvasBackground="transparent"
        />
      </Document>
    </div>
  )
}

export function VirtualizedPDFViewer({
  fileUrl,
  onPageChange,
  onZoomChange,
  onDocumentLoad,
  onError,
  className,
  initialPage = 1,
  initialZoom = 1,
  showControls = true,
  itemHeight = 800,
  overscan = 2,
}: VirtualizedPDFViewerProps) {
  const [numPages, setNumPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [zoom, setZoom] = useState(initialZoom)
  const [rotation, setRotation] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pageDimensions, setPageDimensions] = useState<Map<number, { width: number; height: number }>>(new Map())

  const listRef = useRef<List>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const pageInputRef = useRef<HTMLInputElement>(null)

  // Handle document load success
  const onDocumentLoadSuccess = useCallback(
    ({ numPages }: { numPages: number }) => {
      setNumPages(numPages)
      setIsLoading(false)
      setError(null)
      onDocumentLoad?.(numPages)
    },
    [onDocumentLoad]
  )

  // Handle document load error
  const onDocumentLoadError = useCallback(
    (error: Error) => {
      setIsLoading(false)
      setError(error.message)
      onError?.(error)
    },
    [onError]
  )

  // Handle individual page load
  const handlePageLoad = useCallback((pageNumber: number, dimensions: { width: number; height: number }) => {
    setPageDimensions(prev => new Map(prev).set(pageNumber, dimensions))
  }, [])

  // Handle individual page error
  const handlePageError = useCallback((pageNumber: number, error: Error) => {
    console.error(`Error loading page ${pageNumber}:`, error)
  }, [])

  // Navigation functions
  const goToPreviousPage = useCallback(() => {
    if (currentPage > 1) {
      const newPage = currentPage - 1
      setCurrentPage(newPage)
      listRef.current?.scrollToItem(newPage - 1, 'center')
      onPageChange?.(newPage)
    }
  }, [currentPage, onPageChange])

  const goToNextPage = useCallback(() => {
    if (currentPage < numPages) {
      const newPage = currentPage + 1
      setCurrentPage(newPage)
      listRef.current?.scrollToItem(newPage - 1, 'center')
      onPageChange?.(newPage)
    }
  }, [currentPage, numPages, onPageChange])

  const goToPage = useCallback(
    (page: number) => {
      const validPage = Math.max(1, Math.min(page, numPages))
      setCurrentPage(validPage)
      listRef.current?.scrollToItem(validPage - 1, 'center')
      onPageChange?.(validPage)
    },
    [numPages, onPageChange]
  )

  // Zoom functions
  const zoomIn = useCallback(() => {
    const newZoom = Math.min(zoom * 1.2, 3)
    setZoom(newZoom)
    onZoomChange?.(newZoom)
  }, [zoom, onZoomChange])

  const zoomOut = useCallback(() => {
    const newZoom = Math.max(zoom / 1.2, 0.1)
    setZoom(newZoom)
    onZoomChange?.(newZoom)
  }, [zoom, onZoomChange])

  const handleZoomChange = useCallback(
    (newZoom: number) => {
      const validZoom = Math.max(0.1, Math.min(newZoom, 3))
      setZoom(validZoom)
      onZoomChange?.(validZoom)
    },
    [onZoomChange]
  )

  // Rotation function
  const rotateClockwise = useCallback(() => {
    setRotation(prev => (prev + 90) % 360)
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

  // Calculate dynamic item height based on zoom and page dimensions
  const getItemHeight = useCallback(
    (index: number) => {
      const pageNumber = index + 1
      const dimensions = pageDimensions.get(pageNumber)
      if (dimensions) {
        return Math.ceil(dimensions.height * zoom) + 32 // Add padding
      }
      return itemHeight * zoom
    },
    [pageDimensions, zoom, itemHeight]
  )

  // Memoized data for virtual list
  const listData = useMemo(
    () => ({
      fileUrl,
      zoom,
      rotation,
      onPageLoad: handlePageLoad,
      onPageError: handlePageError,
    }),
    [fileUrl, zoom, rotation, handlePageLoad, handlePageError]
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
          goToPage(numPages)
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
            handleZoomChange(1)
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [goToPreviousPage, goToNextPage, goToPage, numPages, zoomIn, zoomOut, handleZoomChange])

  // Render loading state
  if (isLoading) {
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
  if (error) {
    return (
      <div className={cn('flex flex-col h-full', className)}>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-destructive">
            <p className="text-lg font-medium mb-2">Failed to load PDF</p>
            <p className="text-sm text-muted-foreground">{error}</p>
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
              disabled={currentPage <= 1}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextPage}
              disabled={currentPage >= numPages}
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-1 text-sm">
              <Input
                ref={pageInputRef}
                type="number"
                min={1}
                max={numPages}
                value={currentPage}
                onChange={handlePageInputChange}
                onKeyPress={handlePageInputKeyPress}
                className="w-16 h-8 text-center"
                aria-label="Current page"
              />
              <span className="text-muted-foreground">of {numPages}</span>
            </div>
          </div>

          {/* Zoom and Rotation Controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={zoomOut}
              disabled={zoom <= 0.1}
              aria-label="Zoom out"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground min-w-12 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={zoomIn}
              disabled={zoom >= 3}
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

      {/* Virtualized PDF Document */}
      <div className="flex-1 bg-gray-100 dark:bg-gray-900">
        <Document
          file={fileUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={null}
          error={null}
        >
          <List
            ref={listRef}
            height={containerRef.current?.clientHeight ? containerRef.current.clientHeight - (showControls ? 64 : 0) : 600}
            itemCount={numPages}
            itemSize={getItemHeight}
            itemData={listData}
            overscanCount={overscan}
            className="scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600"
          >
            {PDFPageItem}
          </List>
        </Document>
      </div>
    </div>
  )
}