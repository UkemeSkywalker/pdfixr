/**
 * Utility functions for mapping coordinates between PDF pages and canvas overlay
 */

export interface PDFCoordinates {
  x: number
  y: number
  width?: number
  height?: number
}

export interface CanvasCoordinates {
  x: number
  y: number
  width?: number
  height?: number
}

export interface PageDimensions {
  width: number
  height: number
}

export interface ViewportTransform {
  scale: number
  rotation: number
  offsetX: number
  offsetY: number
}

/**
 * Convert PDF coordinates to canvas coordinates
 * PDF coordinates are typically in points (72 DPI) with origin at bottom-left
 * Canvas coordinates are in pixels with origin at top-left
 */
export function pdfToCanvas(
  pdfCoords: PDFCoordinates,
  pageDimensions: PageDimensions,
  viewport: ViewportTransform
): CanvasCoordinates {
  const { scale, rotation, offsetX, offsetY } = viewport
  
  // Convert from PDF coordinate system (bottom-left origin) to canvas (top-left origin)
  let x = pdfCoords.x
  let y = pageDimensions.height - pdfCoords.y - (pdfCoords.height || 0)
  
  // Apply rotation
  if (rotation !== 0) {
    const centerX = pageDimensions.width / 2
    const centerY = pageDimensions.height / 2
    const radians = (rotation * Math.PI) / 180
    
    const translatedX = x - centerX
    const translatedY = y - centerY
    
    x = translatedX * Math.cos(radians) - translatedY * Math.sin(radians) + centerX
    y = translatedX * Math.sin(radians) + translatedY * Math.cos(radians) + centerY
  }
  
  // Apply scale and offset
  return {
    x: x * scale + offsetX,
    y: y * scale + offsetY,
    width: pdfCoords.width ? pdfCoords.width * scale : undefined,
    height: pdfCoords.height ? pdfCoords.height * scale : undefined,
  }
}

/**
 * Convert canvas coordinates to PDF coordinates
 */
export function canvasToPdf(
  canvasCoords: CanvasCoordinates,
  pageDimensions: PageDimensions,
  viewport: ViewportTransform
): PDFCoordinates {
  const { scale, rotation, offsetX, offsetY } = viewport
  
  // Remove scale and offset
  let x = (canvasCoords.x - offsetX) / scale
  let y = (canvasCoords.y - offsetY) / scale
  
  // Apply inverse rotation
  if (rotation !== 0) {
    const centerX = pageDimensions.width / 2
    const centerY = pageDimensions.height / 2
    const radians = (-rotation * Math.PI) / 180
    
    const translatedX = x - centerX
    const translatedY = y - centerY
    
    x = translatedX * Math.cos(radians) - translatedY * Math.sin(radians) + centerX
    y = translatedX * Math.sin(radians) + translatedY * Math.cos(radians) + centerY
  }
  
  // Convert from canvas coordinate system (top-left origin) to PDF (bottom-left origin)
  y = pageDimensions.height - y - (canvasCoords.height ? canvasCoords.height / scale : 0)
  
  return {
    x,
    y,
    width: canvasCoords.width ? canvasCoords.width / scale : undefined,
    height: canvasCoords.height ? canvasCoords.height / scale : undefined,
  }
}

/**
 * Get the bounding box of a set of coordinates
 */
export function getBoundingBox(coordinates: PDFCoordinates[]): PDFCoordinates {
  if (coordinates.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 }
  }
  
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  
  coordinates.forEach(coord => {
    minX = Math.min(minX, coord.x)
    minY = Math.min(minY, coord.y)
    maxX = Math.max(maxX, coord.x + (coord.width || 0))
    maxY = Math.max(maxY, coord.y + (coord.height || 0))
  })
  
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  }
}

/**
 * Check if a point is within a bounding box
 */
export function isPointInBounds(
  point: { x: number; y: number },
  bounds: PDFCoordinates
): boolean {
  return (
    point.x >= bounds.x &&
    point.x <= bounds.x + (bounds.width || 0) &&
    point.y >= bounds.y &&
    point.y <= bounds.y + (bounds.height || 0)
  )
}

/**
 * Calculate the distance between two points
 */
export function getDistance(
  point1: { x: number; y: number },
  point2: { x: number; y: number }
): number {
  return Math.sqrt(
    Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2)
  )
}

/**
 * Normalize coordinates to ensure they are within page bounds
 */
export function normalizeCoordinates(
  coords: PDFCoordinates,
  pageDimensions: PageDimensions
): PDFCoordinates {
  const normalizedX = Math.max(0, Math.min(coords.x, pageDimensions.width))
  const normalizedY = Math.max(0, Math.min(coords.y, pageDimensions.height))
  
  return {
    x: normalizedX,
    y: normalizedY,
    width: coords.width ? Math.min(coords.width, pageDimensions.width - normalizedX) : undefined,
    height: coords.height ? Math.min(coords.height, pageDimensions.height - normalizedY) : undefined,
  }
}

/**
 * Create a viewport transform from scale and rotation
 */
export function createViewportTransform(
  scale: number,
  rotation: number,
  offsetX: number = 0,
  offsetY: number = 0
): ViewportTransform {
  // Normalize rotation to 0-360 range
  let normalizedRotation = rotation % 360
  if (normalizedRotation < 0) {
    normalizedRotation += 360
  }
  
  return {
    scale,
    rotation: normalizedRotation,
    offsetX,
    offsetY,
  }
}

/**
 * Apply viewport transform to multiple coordinates
 */
export function transformCoordinates(
  coordinates: PDFCoordinates[],
  pageDimensions: PageDimensions,
  viewport: ViewportTransform,
  direction: 'pdfToCanvas' | 'canvasToPdf' = 'pdfToCanvas'
): CanvasCoordinates[] | PDFCoordinates[] {
  const transformFn = direction === 'pdfToCanvas' ? pdfToCanvas : canvasToPdf
  
  return coordinates.map(coord => 
    transformFn(coord, pageDimensions, viewport)
  )
}

/**
 * Get the effective page dimensions after rotation
 */
export function getRotatedPageDimensions(
  originalDimensions: PageDimensions,
  rotation: number
): PageDimensions {
  const normalizedRotation = Math.abs(rotation % 360)
  
  if (normalizedRotation === 90 || normalizedRotation === 270) {
    return {
      width: originalDimensions.height,
      height: originalDimensions.width,
    }
  }
  
  return originalDimensions
}