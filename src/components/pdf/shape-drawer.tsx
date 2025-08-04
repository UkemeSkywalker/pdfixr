'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { AnnotationData, AnnotationTool } from '@/types'
import { cn } from '@/utils/cn'

interface ShapeDrawerProps {
  pageNumber: number
  selectedTool?: AnnotationTool
  scale: number
  onAnnotationAdd?: (annotation: AnnotationData) => void
  disabled?: boolean
  className?: string
}

interface DrawingState {
  isDrawing: boolean
  startPoint: { x: number; y: number } | null
  currentPoint: { x: number; y: number } | null
  previewShape: AnnotationData | null
}

export function ShapeDrawer({
  pageNumber,
  selectedTool,
  scale,
  onAnnotationAdd,
  disabled = false,
  className,
}: ShapeDrawerProps) {
  const [drawingState, setDrawingState] = useState<DrawingState>({
    isDrawing: false,
    startPoint: null,
    currentPoint: null,
    previewShape: null,
  })

  const containerRef = useRef<HTMLDivElement>(null)

  // Check if current tool is a shape tool
  const isShapeTool = selectedTool && ['rectangle', 'circle', 'arrow'].includes(selectedTool.type)

  // Handle mouse down - start drawing
  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    if (disabled || !selectedTool || !isShapeTool) return

    event.preventDefault()
    event.stopPropagation()

    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    const startPoint = {
      x: (event.clientX - rect.left) / scale,
      y: (event.clientY - rect.top) / scale,
    }

    setDrawingState({
      isDrawing: true,
      startPoint,
      currentPoint: startPoint,
      previewShape: null,
    })
  }, [disabled, selectedTool, isShapeTool, scale])

  // Handle mouse move - update preview
  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (!drawingState.isDrawing || !drawingState.startPoint || !selectedTool) return

    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    const currentPoint = {
      x: (event.clientX - rect.left) / scale,
      y: (event.clientY - rect.top) / scale,
    }

    // Create preview shape
    const previewShape = createShapeAnnotation(
      selectedTool,
      pageNumber,
      drawingState.startPoint,
      currentPoint
    )

    setDrawingState(prev => ({
      ...prev,
      currentPoint,
      previewShape,
    }))
  }, [drawingState.isDrawing, drawingState.startPoint, selectedTool, pageNumber, scale])

  // Handle mouse up - finish drawing
  const handleMouseUp = useCallback(() => {
    if (!drawingState.isDrawing || !drawingState.previewShape) {
      setDrawingState({
        isDrawing: false,
        startPoint: null,
        currentPoint: null,
        previewShape: null,
      })
      return
    }

    // Only create annotation if shape has minimum size
    const shape = drawingState.previewShape
    const minSize = 10 / scale // Minimum 10 pixels

    let hasMinimumSize = false
    if (shape.coordinates.width && shape.coordinates.height) {
      hasMinimumSize = shape.coordinates.width >= minSize && shape.coordinates.height >= minSize
    } else if (shape.coordinates.points) {
      // For arrows, check distance between points
      const points = shape.coordinates.points
      if (points.length >= 4) {
        const distance = Math.sqrt(
          Math.pow(points[2] - points[0], 2) + Math.pow(points[3] - points[1], 2)
        )
        hasMinimumSize = distance >= minSize
      }
    }

    if (hasMinimumSize) {
      onAnnotationAdd?.(drawingState.previewShape)
    }

    setDrawingState({
      isDrawing: false,
      startPoint: null,
      currentPoint: null,
      previewShape: null,
    })
  }, [drawingState.isDrawing, drawingState.previewShape, onAnnotationAdd, scale])

  // Handle mouse leave - cancel drawing
  const handleMouseLeave = useCallback(() => {
    if (drawingState.isDrawing) {
      setDrawingState({
        isDrawing: false,
        startPoint: null,
        currentPoint: null,
        previewShape: null,
      })
    }
  }, [drawingState.isDrawing])

  // Handle escape key - cancel drawing
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && drawingState.isDrawing) {
        setDrawingState({
          isDrawing: false,
          startPoint: null,
          currentPoint: null,
          previewShape: null,
        })
      }
    }

    if (drawingState.isDrawing) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [drawingState.isDrawing])

  // Render preview shape
  const renderPreviewShape = () => {
    if (!drawingState.previewShape) return null

    const shape = drawingState.previewShape
    const style = {
      stroke: shape.style.color,
      strokeWidth: shape.style.strokeWidth,
      fill: 'transparent',
      opacity: shape.style.opacity * 0.7, // Make preview slightly transparent
    }

    switch (shape.type) {
      case 'rectangle':
        return (
          <rect
            x={shape.coordinates.x * scale}
            y={shape.coordinates.y * scale}
            width={(shape.coordinates.width || 0) * scale}
            height={(shape.coordinates.height || 0) * scale}
            style={style}
            className="pointer-events-none"
          />
        )

      case 'circle':
        const radius = ((shape.coordinates.width || 0) / 2) * scale
        const centerX = (shape.coordinates.x + (shape.coordinates.width || 0) / 2) * scale
        const centerY = (shape.coordinates.y + (shape.coordinates.height || 0) / 2) * scale
        return (
          <circle
            cx={centerX}
            cy={centerY}
            r={Math.abs(radius)}
            style={style}
            className="pointer-events-none"
          />
        )

      case 'arrow':
        if (!shape.coordinates.points || shape.coordinates.points.length < 4) return null
        const [x1, y1, x2, y2] = shape.coordinates.points
        return (
          <g className="pointer-events-none">
            <line
              x1={x1 * scale}
              y1={y1 * scale}
              x2={x2 * scale}
              y2={y2 * scale}
              style={style}
            />
            {renderArrowHead(x1 * scale, y1 * scale, x2 * scale, y2 * scale, style)}
          </g>
        )

      default:
        return null
    }
  }

  // Render arrow head
  const renderArrowHead = (x1: number, y1: number, x2: number, y2: number, style: any) => {
    const angle = Math.atan2(y2 - y1, x2 - x1)
    const arrowLength = 10
    const arrowAngle = Math.PI / 6

    const arrowX1 = x2 - arrowLength * Math.cos(angle - arrowAngle)
    const arrowY1 = y2 - arrowLength * Math.sin(angle - arrowAngle)
    const arrowX2 = x2 - arrowLength * Math.cos(angle + arrowAngle)
    const arrowY2 = y2 - arrowLength * Math.sin(angle + arrowAngle)

    return (
      <g>
        <line x1={x2} y1={y2} x2={arrowX1} y2={arrowY1} style={style} />
        <line x1={x2} y1={y2} x2={arrowX2} y2={arrowY2} style={style} />
      </g>
    )
  }

  // Show drawing cursor when shape tool is selected
  const cursorClass = isShapeTool && !disabled ? 'cursor-crosshair' : 'cursor-default'

  return (
    <div
      ref={containerRef}
      className={cn(
        'absolute inset-0 pointer-events-auto',
        cursorClass,
        disabled && 'pointer-events-none',
        className
      )}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      {/* SVG overlay for preview shapes */}
      {drawingState.previewShape && (
        <svg
          className="absolute inset-0 pointer-events-none"
          style={{
            width: '100%',
            height: '100%',
          }}
        >
          {renderPreviewShape()}
        </svg>
      )}

      {/* Drawing instructions */}
      {isShapeTool && !disabled && !drawingState.isDrawing && (
        <div className="absolute top-2 left-2 bg-popover border border-border rounded-md px-2 py-1 text-xs text-muted-foreground pointer-events-none z-10">
          Click and drag to draw {selectedTool?.type}
        </div>
      )}

      {/* Drawing feedback */}
      {drawingState.isDrawing && (
        <div className="absolute top-2 right-2 bg-popover border border-border rounded-md px-2 py-1 text-xs text-muted-foreground pointer-events-none z-10">
          Release to finish drawing • Press Escape to cancel
        </div>
      )}
    </div>
  )
}

// Helper function to create shape annotation
function createShapeAnnotation(
  tool: AnnotationTool,
  pageNumber: number,
  startPoint: { x: number; y: number },
  endPoint: { x: number; y: number }
): AnnotationData {
  const now = new Date()
  const id = crypto.randomUUID()

  const baseAnnotation: Omit<AnnotationData, 'coordinates'> = {
    id,
    type: tool.type as 'rectangle' | 'circle' | 'arrow',
    pageNumber,
    style: {
      color: tool.color,
      strokeWidth: tool.strokeWidth,
      opacity: tool.opacity,
    },
    createdAt: now,
    updatedAt: now,
  }

  switch (tool.type) {
    case 'rectangle':
      const rectX = Math.min(startPoint.x, endPoint.x)
      const rectY = Math.min(startPoint.y, endPoint.y)
      const rectWidth = Math.abs(endPoint.x - startPoint.x)
      const rectHeight = Math.abs(endPoint.y - startPoint.y)

      return {
        ...baseAnnotation,
        coordinates: {
          x: rectX,
          y: rectY,
          width: rectWidth,
          height: rectHeight,
        },
      }

    case 'circle':
      const circleX = Math.min(startPoint.x, endPoint.x)
      const circleY = Math.min(startPoint.y, endPoint.y)
      const circleWidth = Math.abs(endPoint.x - startPoint.x)
      const circleHeight = Math.abs(endPoint.y - startPoint.y)

      return {
        ...baseAnnotation,
        coordinates: {
          x: circleX,
          y: circleY,
          width: circleWidth,
          height: circleHeight,
        },
      }

    case 'arrow':
      return {
        ...baseAnnotation,
        coordinates: {
          x: Math.min(startPoint.x, endPoint.x),
          y: Math.min(startPoint.y, endPoint.y),
          points: [startPoint.x, startPoint.y, endPoint.x, endPoint.y],
        },
      }

    default:
      throw new Error(`Unsupported shape type: ${tool.type}`)
  }
}