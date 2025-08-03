'use client'

import React, { useRef, useEffect, useCallback, useState } from 'react'
import { fabric } from 'fabric'
import { cn } from '@/utils/cn'

interface CanvasOverlayProps {
  width: number
  height: number
  scale: number
  rotation: number
  pageNumber: number
  onAnnotationAdd?: (annotation: AnnotationData) => void
  onAnnotationUpdate?: (annotation: AnnotationData) => void
  onAnnotationDelete?: (annotationId: string) => void
  annotations?: AnnotationData[]
  selectedTool?: AnnotationTool
  className?: string
  disabled?: boolean
}

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

export function CanvasOverlay({
  width,
  height,
  scale,
  rotation,
  pageNumber,
  onAnnotationAdd,
  onAnnotationUpdate,
  onAnnotationDelete,
  annotations = [],
  selectedTool,
  className,
  disabled = false,
}: CanvasOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentPath, setCurrentPath] = useState<fabric.Path | null>(null)

  // Initialize Fabric.js canvas
  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: width * scale,
      height: height * scale,
      backgroundColor: 'transparent',
      selection: !disabled,
      interactive: !disabled,
      preserveObjectStacking: true,
    })

    fabricCanvasRef.current = canvas

    // Configure canvas settings
    canvas.freeDrawingBrush.width = selectedTool?.strokeWidth || 2
    canvas.freeDrawingBrush.color = selectedTool?.color || '#ff0000'

    return () => {
      canvas.dispose()
      fabricCanvasRef.current = null
    }
  }, [width, height, scale, disabled])

  // Update canvas dimensions when scale changes
  useEffect(() => {
    if (!fabricCanvasRef.current) return

    const canvas = fabricCanvasRef.current
    canvas.setDimensions({
      width: width * scale,
      height: height * scale,
    })
    canvas.setZoom(scale)
    canvas.renderAll()
  }, [width, height, scale])

  // Handle rotation
  useEffect(() => {
    if (!fabricCanvasRef.current) return

    const canvas = fabricCanvasRef.current
    const centerX = (width * scale) / 2
    const centerY = (height * scale) / 2

    canvas.viewportTransform = [1, 0, 0, 1, 0, 0]
    canvas.setViewportTransform([
      Math.cos((rotation * Math.PI) / 180),
      Math.sin((rotation * Math.PI) / 180),
      -Math.sin((rotation * Math.PI) / 180),
      Math.cos((rotation * Math.PI) / 180),
      centerX,
      centerY,
    ])
    canvas.renderAll()
  }, [rotation, width, height, scale])

  // Load existing annotations
  useEffect(() => {
    if (!fabricCanvasRef.current) return

    const canvas = fabricCanvasRef.current
    canvas.clear()

    annotations
      .filter(annotation => annotation.pageNumber === pageNumber)
      .forEach(annotation => {
        const fabricObject = createFabricObject(annotation)
        if (fabricObject) {
          canvas.add(fabricObject)
        }
      })

    canvas.renderAll()
  }, [annotations, pageNumber])

  // Update drawing tool settings
  useEffect(() => {
    if (!fabricCanvasRef.current || !selectedTool) return

    const canvas = fabricCanvasRef.current
    
    // Enable/disable drawing mode based on tool
    if (selectedTool.type === 'freehand') {
      canvas.isDrawingMode = true
      canvas.freeDrawingBrush.width = selectedTool.strokeWidth
      canvas.freeDrawingBrush.color = selectedTool.color
    } else {
      canvas.isDrawingMode = false
    }

    canvas.renderAll()
  }, [selectedTool])

  // Create Fabric.js object from annotation data
  const createFabricObject = useCallback((annotation: AnnotationData): fabric.Object | null => {
    const { type, coordinates, style, content } = annotation

    switch (type) {
      case 'rectangle':
        return new fabric.Rect({
          left: coordinates.x,
          top: coordinates.y,
          width: coordinates.width || 100,
          height: coordinates.height || 50,
          fill: 'transparent',
          stroke: style.color,
          strokeWidth: style.strokeWidth,
          opacity: style.opacity,
        })

      case 'circle':
        return new fabric.Circle({
          left: coordinates.x,
          top: coordinates.y,
          radius: (coordinates.width || 50) / 2,
          fill: 'transparent',
          stroke: style.color,
          strokeWidth: style.strokeWidth,
          opacity: style.opacity,
        })

      case 'arrow':
        if (!coordinates.points || coordinates.points.length < 4) return null
        return new fabric.Line(coordinates.points as [number, number, number, number], {
          stroke: style.color,
          strokeWidth: style.strokeWidth,
          opacity: style.opacity,
        })

      case 'freehand':
        if (!coordinates.points) return null
        const pathString = `M ${coordinates.points.join(' L ')}`
        return new fabric.Path(pathString, {
          stroke: style.color,
          strokeWidth: style.strokeWidth,
          fill: 'transparent',
          opacity: style.opacity,
        })

      case 'note':
        return new fabric.Text(content || 'Note', {
          left: coordinates.x,
          top: coordinates.y,
          fontSize: style.fontSize || 14,
          fill: style.color,
          opacity: style.opacity,
        })

      case 'highlight':
        return new fabric.Rect({
          left: coordinates.x,
          top: coordinates.y,
          width: coordinates.width || 100,
          height: coordinates.height || 20,
          fill: style.color,
          opacity: style.opacity * 0.3,
          stroke: 'transparent',
        })

      case 'underline':
        return new fabric.Line([
          coordinates.x,
          coordinates.y + (coordinates.height || 20),
          coordinates.x + (coordinates.width || 100),
          coordinates.y + (coordinates.height || 20),
        ], {
          stroke: style.color,
          strokeWidth: style.strokeWidth,
          opacity: style.opacity,
        })

      case 'strikethrough':
        return new fabric.Line([
          coordinates.x,
          coordinates.y + (coordinates.height || 20) / 2,
          coordinates.x + (coordinates.width || 100),
          coordinates.y + (coordinates.height || 20) / 2,
        ], {
          stroke: style.color,
          strokeWidth: style.strokeWidth,
          opacity: style.opacity,
        })

      default:
        return null
    }
  }, [])

  // Convert Fabric.js object to annotation data
  const createAnnotationData = useCallback((fabricObject: fabric.Object): AnnotationData | null => {
    if (!selectedTool) return null

    const id = crypto.randomUUID()
    const now = new Date()

    const baseAnnotation: Partial<AnnotationData> = {
      id,
      pageNumber,
      style: {
        color: selectedTool.color,
        strokeWidth: selectedTool.strokeWidth,
        opacity: selectedTool.opacity,
      },
      createdAt: now,
      updatedAt: now,
    }

    if (fabricObject instanceof fabric.Rect) {
      return {
        ...baseAnnotation,
        type: selectedTool.type as 'rectangle' | 'highlight',
        coordinates: {
          x: fabricObject.left || 0,
          y: fabricObject.top || 0,
          width: fabricObject.width || 0,
          height: fabricObject.height || 0,
        },
      } as AnnotationData
    }

    if (fabricObject instanceof fabric.Circle) {
      return {
        ...baseAnnotation,
        type: 'circle',
        coordinates: {
          x: fabricObject.left || 0,
          y: fabricObject.top || 0,
          width: (fabricObject.radius || 0) * 2,
          height: (fabricObject.radius || 0) * 2,
        },
      } as AnnotationData
    }

    if (fabricObject instanceof fabric.Line) {
      return {
        ...baseAnnotation,
        type: selectedTool.type as 'arrow' | 'underline' | 'strikethrough',
        coordinates: {
          x: fabricObject.x1 || 0,
          y: fabricObject.y1 || 0,
          points: [fabricObject.x1 || 0, fabricObject.y1 || 0, fabricObject.x2 || 0, fabricObject.y2 || 0],
        },
      } as AnnotationData
    }

    if (fabricObject instanceof fabric.Path) {
      return {
        ...baseAnnotation,
        type: 'freehand',
        coordinates: {
          x: fabricObject.left || 0,
          y: fabricObject.top || 0,
          points: fabricObject.path?.map(cmd => [cmd[1], cmd[2]]).flat() || [],
        },
      } as AnnotationData
    }

    if (fabricObject instanceof fabric.Text) {
      return {
        ...baseAnnotation,
        type: 'note',
        coordinates: {
          x: fabricObject.left || 0,
          y: fabricObject.top || 0,
        },
        content: fabricObject.text,
        style: {
          ...baseAnnotation.style!,
          fontSize: fabricObject.fontSize,
        },
      } as AnnotationData
    }

    return null
  }, [selectedTool, pageNumber])

  // Handle mouse events for drawing
  const handleMouseDown = useCallback((e: fabric.IEvent) => {
    if (!fabricCanvasRef.current || !selectedTool || selectedTool.type === 'freehand') return

    const canvas = fabricCanvasRef.current
    const pointer = canvas.getPointer(e.e)
    setIsDrawing(true)

    let fabricObject: fabric.Object | null = null

    switch (selectedTool.type) {
      case 'rectangle':
      case 'highlight':
        fabricObject = new fabric.Rect({
          left: pointer.x,
          top: pointer.y,
          width: 0,
          height: 0,
          fill: selectedTool.type === 'highlight' ? selectedTool.color : 'transparent',
          stroke: selectedTool.type === 'rectangle' ? selectedTool.color : 'transparent',
          strokeWidth: selectedTool.strokeWidth,
          opacity: selectedTool.type === 'highlight' ? selectedTool.opacity * 0.3 : selectedTool.opacity,
        })
        break

      case 'circle':
        fabricObject = new fabric.Circle({
          left: pointer.x,
          top: pointer.y,
          radius: 0,
          fill: 'transparent',
          stroke: selectedTool.color,
          strokeWidth: selectedTool.strokeWidth,
          opacity: selectedTool.opacity,
        })
        break

      case 'note':
        const text = prompt('Enter note text:') || 'Note'
        fabricObject = new fabric.Text(text, {
          left: pointer.x,
          top: pointer.y,
          fontSize: 14,
          fill: selectedTool.color,
          opacity: selectedTool.opacity,
        })
        break
    }

    if (fabricObject) {
      canvas.add(fabricObject)
      canvas.setActiveObject(fabricObject)
      canvas.renderAll()
    }
  }, [selectedTool])

  const handleMouseMove = useCallback((e: fabric.IEvent) => {
    if (!fabricCanvasRef.current || !isDrawing || !selectedTool) return

    const canvas = fabricCanvasRef.current
    const pointer = canvas.getPointer(e.e)
    const activeObject = canvas.getActiveObject()

    if (!activeObject) return

    if (activeObject instanceof fabric.Rect) {
      const rect = activeObject as fabric.Rect
      const startX = rect.left || 0
      const startY = rect.top || 0
      
      rect.set({
        width: Math.abs(pointer.x - startX),
        height: Math.abs(pointer.y - startY),
      })
      
      if (pointer.x < startX) rect.set({ left: pointer.x })
      if (pointer.y < startY) rect.set({ top: pointer.y })
    }

    if (activeObject instanceof fabric.Circle) {
      const circle = activeObject as fabric.Circle
      const startX = circle.left || 0
      const startY = circle.top || 0
      const radius = Math.sqrt(Math.pow(pointer.x - startX, 2) + Math.pow(pointer.y - startY, 2)) / 2
      
      circle.set({ radius })
    }

    canvas.renderAll()
  }, [isDrawing, selectedTool])

  const handleMouseUp = useCallback(() => {
    if (!fabricCanvasRef.current || !isDrawing) return

    const canvas = fabricCanvasRef.current
    const activeObject = canvas.getActiveObject()

    setIsDrawing(false)

    if (activeObject) {
      const annotationData = createAnnotationData(activeObject)
      if (annotationData) {
        onAnnotationAdd?.(annotationData)
      }
    }
  }, [isDrawing, createAnnotationData, onAnnotationAdd])

  // Handle path creation for freehand drawing
  const handlePathCreated = useCallback((e: fabric.IEvent<Event> & { path: fabric.Path }) => {
    if (!selectedTool || selectedTool.type !== 'freehand') return

    const annotationData = createAnnotationData(e.path)
    if (annotationData) {
      onAnnotationAdd?.(annotationData)
    }
  }, [selectedTool, createAnnotationData, onAnnotationAdd])

  // Handle object modification
  const handleObjectModified = useCallback((e: fabric.IEvent) => {
    if (!e.target) return

    const annotationData = createAnnotationData(e.target)
    if (annotationData) {
      onAnnotationUpdate?.(annotationData)
    }
  }, [createAnnotationData, onAnnotationUpdate])

  // Handle object selection for deletion
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!fabricCanvasRef.current) return

    const canvas = fabricCanvasRef.current
    const activeObject = canvas.getActiveObject()

    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (activeObject) {
        const annotationData = createAnnotationData(activeObject)
        if (annotationData) {
          onAnnotationDelete?.(annotationData.id)
        }
        canvas.remove(activeObject)
        canvas.renderAll()
      }
    }
  }, [createAnnotationData, onAnnotationDelete])

  // Set up event listeners
  useEffect(() => {
    if (!fabricCanvasRef.current) return

    const canvas = fabricCanvasRef.current

    canvas.on('mouse:down', handleMouseDown)
    canvas.on('mouse:move', handleMouseMove)
    canvas.on('mouse:up', handleMouseUp)
    canvas.on('path:created', handlePathCreated)
    canvas.on('object:modified', handleObjectModified)

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      canvas.off('mouse:down', handleMouseDown)
      canvas.off('mouse:move', handleMouseMove)
      canvas.off('mouse:up', handleMouseUp)
      canvas.off('path:created', handlePathCreated)
      canvas.off('object:modified', handleObjectModified)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleMouseDown, handleMouseMove, handleMouseUp, handlePathCreated, handleObjectModified, handleKeyDown])

  return (
    <canvas
      ref={canvasRef}
      className={cn(
        'absolute top-0 left-0 pointer-events-auto',
        disabled && 'pointer-events-none',
        className
      )}
      style={{
        width: width * scale,
        height: height * scale,
      }}
    />
  )
}