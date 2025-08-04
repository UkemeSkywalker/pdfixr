'use client'

import React, { useRef, useEffect, useCallback, useState } from 'react'
import * as fabric from 'fabric'
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
  const [isClient, setIsClient] = useState(false)

  // Check if we're on the client side
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Initialize Fabric.js canvas - only on client side
  useEffect(() => {
    if (!canvasRef.current || !isClient) return

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
    if (selectedTool) {
      canvas.freeDrawingBrush.width = selectedTool.strokeWidth
      canvas.freeDrawingBrush.color = selectedTool.color
    }

    return () => {
      canvas.dispose()
      fabricCanvasRef.current = null
    }
  }, [width, height, scale, disabled, selectedTool, isClient])

  // Simple drawing for freehand
  useEffect(() => {
    if (!fabricCanvasRef.current || !selectedTool) return

    const canvas = fabricCanvasRef.current
    
    if (selectedTool.type === 'freehand') {
      canvas.isDrawingMode = true
      canvas.freeDrawingBrush.width = selectedTool.strokeWidth
      canvas.freeDrawingBrush.color = selectedTool.color
    } else {
      canvas.isDrawingMode = false
    }

    canvas.renderAll()
  }, [selectedTool])

  // Don't render canvas on server side
  if (!isClient) {
    return (
      <div
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