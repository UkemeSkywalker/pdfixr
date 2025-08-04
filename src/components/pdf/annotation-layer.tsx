'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { CanvasOverlay, AnnotationData, AnnotationTool } from './canvas-overlay'
import { TextNote } from './text-note'
import { ShapeDrawer } from './shape-drawer'
import { pdfToCanvas, canvasToPdf, createViewportTransform, PageDimensions } from './coordinate-mapper'
import { cn } from '@/utils/cn'

interface AnnotationLayerProps {
  pageNumber: number
  pageDimensions: PageDimensions
  scale: number
  rotation: number
  selectedTool?: AnnotationTool
  annotations?: AnnotationData[]
  onAnnotationAdd?: (annotation: AnnotationData) => void
  onAnnotationUpdate?: (annotation: AnnotationData) => void
  onAnnotationDelete?: (annotationId: string) => void
  onSelectionChange?: (selectedAnnotations: AnnotationData[]) => void
  className?: string
  disabled?: boolean
  showBounds?: boolean
}

interface AnnotationLayerState {
  selectedAnnotations: string[]
  hoveredAnnotation: string | null
  editingAnnotation: string | null
  isDragging: boolean
  dragOffset: { x: number; y: number }
}

export function AnnotationLayer({
  pageNumber,
  pageDimensions,
  scale,
  rotation,
  selectedTool,
  annotations = [],
  onAnnotationAdd,
  onAnnotationUpdate,
  onAnnotationDelete,
  onSelectionChange,
  className,
  disabled = false,
  showBounds = false,
}: AnnotationLayerProps) {
  const [state, setState] = useState<AnnotationLayerState>({
    selectedAnnotations: [],
    hoveredAnnotation: null,
    editingAnnotation: null,
    isDragging: false,
    dragOffset: { x: 0, y: 0 },
  })

  const layerRef = useRef<HTMLDivElement>(null)
  const pageAnnotations = annotations.filter(ann => ann.pageNumber === pageNumber)

  // Create viewport transform
  const viewport = createViewportTransform(scale, rotation)

  // Handle annotation selection
  const handleAnnotationSelect = useCallback((annotationId: string, multiSelect: boolean = false) => {
    setState(prev => {
      let newSelection: string[]
      
      if (multiSelect) {
        newSelection = prev.selectedAnnotations.includes(annotationId)
          ? prev.selectedAnnotations.filter(id => id !== annotationId)
          : [...prev.selectedAnnotations, annotationId]
      } else {
        newSelection = prev.selectedAnnotations.includes(annotationId) ? [] : [annotationId]
      }

      return { ...prev, selectedAnnotations: newSelection }
    })
  }, [])

  // Handle annotation hover
  const handleAnnotationHover = useCallback((annotationId: string | null) => {
    setState(prev => ({ ...prev, hoveredAnnotation: annotationId }))
  }, [])

  // Handle annotation editing
  const handleStartEdit = useCallback((annotationId: string) => {
    setState(prev => ({ 
      ...prev, 
      editingAnnotation: annotationId,
      selectedAnnotations: [annotationId]
    }))
  }, [])

  const handleEndEdit = useCallback(() => {
    setState(prev => ({ ...prev, editingAnnotation: null }))
  }, [])

  // Handle annotation addition from canvas
  const handleCanvasAnnotationAdd = useCallback((annotation: AnnotationData) => {
    // Convert canvas coordinates to PDF coordinates
    const pdfCoords = canvasToPdf(annotation.coordinates, pageDimensions, viewport)
    
    const pdfAnnotation: AnnotationData = {
      ...annotation,
      coordinates: pdfCoords,
    }

    onAnnotationAdd?.(pdfAnnotation)
  }, [pageDimensions, viewport, onAnnotationAdd])

  // Handle annotation update from canvas
  const handleCanvasAnnotationUpdate = useCallback((annotation: AnnotationData) => {
    // Convert canvas coordinates to PDF coordinates
    const pdfCoords = canvasToPdf(annotation.coordinates, pageDimensions, viewport)
    
    const pdfAnnotation: AnnotationData = {
      ...annotation,
      coordinates: pdfCoords,
      updatedAt: new Date(),
    }

    onAnnotationUpdate?.(pdfAnnotation)
  }, [pageDimensions, viewport, onAnnotationUpdate])

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (disabled) return

    switch (e.key) {
      case 'Delete':
      case 'Backspace':
        if (state.selectedAnnotations.length > 0) {
          state.selectedAnnotations.forEach(id => {
            onAnnotationDelete?.(id)
          })
          setState(prev => ({ ...prev, selectedAnnotations: [] }))
        }
        break
      
      case 'Escape':
        setState(prev => ({ 
          ...prev, 
          selectedAnnotations: [], 
          hoveredAnnotation: null,
          editingAnnotation: null
        }))
        break
      
      case 'a':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault()
          const allIds = pageAnnotations.map(ann => ann.id)
          setState(prev => ({ ...prev, selectedAnnotations: allIds }))
        }
        break
    }
  }, [disabled, state.selectedAnnotations, pageAnnotations, onAnnotationDelete])

  // Set up keyboard event listeners
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Notify parent of selection changes
  useEffect(() => {
    const selectedAnnotationObjects = pageAnnotations.filter(ann => 
      state.selectedAnnotations.includes(ann.id)
    )
    onSelectionChange?.(selectedAnnotationObjects)
  }, [state.selectedAnnotations, pageAnnotations, onSelectionChange])

  // Convert PDF annotations to canvas coordinates for display
  const canvasAnnotations = pageAnnotations.map(annotation => {
    const canvasCoords = pdfToCanvas(annotation.coordinates, pageDimensions, viewport)
    return {
      ...annotation,
      coordinates: canvasCoords,
    }
  })

  // Render annotation bounds for debugging
  const renderAnnotationBounds = () => {
    if (!showBounds) return null

    return canvasAnnotations.map(annotation => {
      const { coordinates, id } = annotation
      const isSelected = state.selectedAnnotations.includes(id)
      const isHovered = state.hoveredAnnotation === id

      return (
        <div
          key={`bounds-${id}`}
          className={cn(
            'absolute border-2 pointer-events-none',
            isSelected && 'border-blue-500 bg-blue-500/10',
            isHovered && !isSelected && 'border-yellow-500 bg-yellow-500/10',
            !isSelected && !isHovered && 'border-gray-400 bg-gray-400/5'
          )}
          style={{
            left: coordinates.x,
            top: coordinates.y,
            width: coordinates.width || 10,
            height: coordinates.height || 10,
          }}
        />
      )
    })
  }

  // Render selection handles
  const renderSelectionHandles = () => {
    if (state.selectedAnnotations.length !== 1) return null

    const selectedAnnotation = canvasAnnotations.find(ann => 
      state.selectedAnnotations.includes(ann.id)
    )

    if (!selectedAnnotation) return null

    const { coordinates } = selectedAnnotation
    const handleSize = 8

    const handles = [
      { x: coordinates.x - handleSize / 2, y: coordinates.y - handleSize / 2, cursor: 'nw-resize' },
      { x: coordinates.x + (coordinates.width || 0) - handleSize / 2, y: coordinates.y - handleSize / 2, cursor: 'ne-resize' },
      { x: coordinates.x - handleSize / 2, y: coordinates.y + (coordinates.height || 0) - handleSize / 2, cursor: 'sw-resize' },
      { x: coordinates.x + (coordinates.width || 0) - handleSize / 2, y: coordinates.y + (coordinates.height || 0) - handleSize / 2, cursor: 'se-resize' },
    ]

    return handles.map((handle, index) => (
      <div
        key={`handle-${index}`}
        className="absolute bg-blue-500 border border-white shadow-sm"
        style={{
          left: handle.x,
          top: handle.y,
          width: handleSize,
          height: handleSize,
          cursor: handle.cursor,
        }}
      />
    ))
  }

  // Render text notes
  const renderTextNotes = () => {
    return pageAnnotations
      .filter(annotation => annotation.type === 'note')
      .map(annotation => (
        <TextNote
          key={annotation.id}
          annotation={annotation}
          scale={scale}
          isSelected={state.selectedAnnotations.includes(annotation.id)}
          isEditing={state.editingAnnotation === annotation.id}
          onUpdate={onAnnotationUpdate}
          onDelete={onAnnotationDelete}
          onStartEdit={() => handleStartEdit(annotation.id)}
          onEndEdit={handleEndEdit}
          onSelect={() => handleAnnotationSelect(annotation.id)}
          disabled={disabled}
        />
      ))
  }

  return (
    <div
      ref={layerRef}
      className={cn(
        'absolute inset-0 pointer-events-none',
        className
      )}
      style={{
        width: pageDimensions.width * scale,
        height: pageDimensions.height * scale,
      }}
    >
      {/* Shape drawer for drawing shapes */}
      <ShapeDrawer
        pageNumber={pageNumber}
        selectedTool={selectedTool}
        scale={scale}
        onAnnotationAdd={handleCanvasAnnotationAdd}
        disabled={disabled}
        className="pointer-events-auto"
      />

      {/* Canvas overlay temporarily disabled due to Fabric.js issues */}
      {false && (
        <CanvasOverlay
          width={pageDimensions.width}
          height={pageDimensions.height}
          scale={scale}
          rotation={rotation}
          pageNumber={pageNumber}
          annotations={canvasAnnotations.filter(ann => ann.type !== 'note')}
          selectedTool={selectedTool}
          onAnnotationAdd={handleCanvasAnnotationAdd}
          onAnnotationUpdate={handleCanvasAnnotationUpdate}
          onAnnotationDelete={onAnnotationDelete}
          disabled={disabled}
          className="pointer-events-auto"
        />
      )}

      {/* Text notes overlay */}
      {renderTextNotes()}

      {/* Annotation bounds (for debugging) */}
      {renderAnnotationBounds()}

      {/* Selection handles */}
      {renderSelectionHandles()}

      {/* Annotation info overlay */}
      {state.hoveredAnnotation && (
        <div className="absolute top-2 left-2 bg-black/80 text-white text-xs px-2 py-1 rounded pointer-events-none">
          {pageAnnotations.find(ann => ann.id === state.hoveredAnnotation)?.type || 'Unknown'}
        </div>
      )}
    </div>
  )
}