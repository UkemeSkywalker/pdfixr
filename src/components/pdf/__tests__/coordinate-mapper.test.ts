import { describe, it, expect } from 'vitest'
import {
  pdfToCanvas,
  canvasToPdf,
  createViewportTransform,
  getBoundingBox,
  isPointInBounds,
  getDistance,
  normalizeCoordinates,
  getRotatedPageDimensions,
} from '../coordinate-mapper'

describe('CoordinateMapper', () => {
  const pageDimensions = { width: 612, height: 792 }
  const viewport = createViewportTransform(1, 0, 0, 0)

  describe('pdfToCanvas', () => {
    it('converts PDF coordinates to canvas coordinates', () => {
      const pdfCoords = { x: 100, y: 100, width: 50, height: 30 }
      const canvasCoords = pdfToCanvas(pdfCoords, pageDimensions, viewport)

      expect(canvasCoords.x).toBe(100)
      expect(canvasCoords.y).toBe(662) // 792 - 100 - 30 = 662
      expect(canvasCoords.width).toBe(50)
      expect(canvasCoords.height).toBe(30)
    })

    it('handles scaling', () => {
      const scaledViewport = createViewportTransform(2, 0, 0, 0)
      const pdfCoords = { x: 100, y: 100, width: 50, height: 30 }
      const canvasCoords = pdfToCanvas(pdfCoords, pageDimensions, scaledViewport)

      expect(canvasCoords.x).toBe(200)
      expect(canvasCoords.y).toBe(1324) // (792 - 100 - 30) * 2 = 1324
      expect(canvasCoords.width).toBe(100)
      expect(canvasCoords.height).toBe(60)
    })
  })

  describe('canvasToPdf', () => {
    it('converts canvas coordinates to PDF coordinates', () => {
      const canvasCoords = { x: 100, y: 662, width: 50, height: 30 }
      const pdfCoords = canvasToPdf(canvasCoords, pageDimensions, viewport)

      expect(pdfCoords.x).toBe(100)
      expect(pdfCoords.y).toBe(100)
      expect(pdfCoords.width).toBe(50)
      expect(pdfCoords.height).toBe(30)
    })

    it('handles scaling', () => {
      const scaledViewport = createViewportTransform(2, 0, 0, 0)
      const canvasCoords = { x: 200, y: 1324, width: 100, height: 60 }
      const pdfCoords = canvasToPdf(canvasCoords, pageDimensions, scaledViewport)

      expect(pdfCoords.x).toBe(100)
      expect(pdfCoords.y).toBe(100)
      expect(pdfCoords.width).toBe(50)
      expect(pdfCoords.height).toBe(30)
    })
  })

  describe('getBoundingBox', () => {
    it('calculates bounding box for multiple coordinates', () => {
      const coordinates = [
        { x: 10, y: 20, width: 30, height: 40 },
        { x: 50, y: 10, width: 20, height: 30 },
        { x: 5, y: 70, width: 10, height: 5 },
      ]

      const boundingBox = getBoundingBox(coordinates)

      expect(boundingBox.x).toBe(5)
      expect(boundingBox.y).toBe(10)
      expect(boundingBox.width).toBe(65) // 70 - 5
      expect(boundingBox.height).toBe(65) // 75 - 10
    })

    it('returns zero bounds for empty array', () => {
      const boundingBox = getBoundingBox([])

      expect(boundingBox.x).toBe(0)
      expect(boundingBox.y).toBe(0)
      expect(boundingBox.width).toBe(0)
      expect(boundingBox.height).toBe(0)
    })
  })

  describe('isPointInBounds', () => {
    it('returns true for point inside bounds', () => {
      const point = { x: 15, y: 25 }
      const bounds = { x: 10, y: 20, width: 30, height: 40 }

      expect(isPointInBounds(point, bounds)).toBe(true)
    })

    it('returns false for point outside bounds', () => {
      const point = { x: 5, y: 15 }
      const bounds = { x: 10, y: 20, width: 30, height: 40 }

      expect(isPointInBounds(point, bounds)).toBe(false)
    })

    it('returns true for point on bounds edge', () => {
      const point = { x: 10, y: 20 }
      const bounds = { x: 10, y: 20, width: 30, height: 40 }

      expect(isPointInBounds(point, bounds)).toBe(true)
    })
  })

  describe('getDistance', () => {
    it('calculates distance between two points', () => {
      const point1 = { x: 0, y: 0 }
      const point2 = { x: 3, y: 4 }

      expect(getDistance(point1, point2)).toBe(5)
    })

    it('returns zero for same point', () => {
      const point = { x: 10, y: 20 }

      expect(getDistance(point, point)).toBe(0)
    })
  })

  describe('normalizeCoordinates', () => {
    it('clamps coordinates to page bounds', () => {
      const coords = { x: -10, y: 800, width: 700, height: 100 }
      const normalized = normalizeCoordinates(coords, pageDimensions)

      expect(normalized.x).toBe(0)
      expect(normalized.y).toBe(792)
      expect(normalized.width).toBe(612)
      expect(normalized.height).toBe(0)
    })

    it('leaves valid coordinates unchanged', () => {
      const coords = { x: 100, y: 200, width: 300, height: 400 }
      const normalized = normalizeCoordinates(coords, pageDimensions)

      expect(normalized).toEqual(coords)
    })
  })

  describe('getRotatedPageDimensions', () => {
    it('swaps dimensions for 90 degree rotation', () => {
      const rotated = getRotatedPageDimensions(pageDimensions, 90)

      expect(rotated.width).toBe(792)
      expect(rotated.height).toBe(612)
    })

    it('swaps dimensions for 270 degree rotation', () => {
      const rotated = getRotatedPageDimensions(pageDimensions, 270)

      expect(rotated.width).toBe(792)
      expect(rotated.height).toBe(612)
    })

    it('keeps dimensions for 0 degree rotation', () => {
      const rotated = getRotatedPageDimensions(pageDimensions, 0)

      expect(rotated).toEqual(pageDimensions)
    })

    it('keeps dimensions for 180 degree rotation', () => {
      const rotated = getRotatedPageDimensions(pageDimensions, 180)

      expect(rotated).toEqual(pageDimensions)
    })
  })

  describe('createViewportTransform', () => {
    it('creates viewport transform with default values', () => {
      const transform = createViewportTransform(1.5, 90)

      expect(transform.scale).toBe(1.5)
      expect(transform.rotation).toBe(90)
      expect(transform.offsetX).toBe(0)
      expect(transform.offsetY).toBe(0)
    })

    it('normalizes rotation to 0-360 range', () => {
      const transform = createViewportTransform(1, 450)

      expect(transform.rotation).toBe(90)
    })

    it('handles negative rotation', () => {
      const transform = createViewportTransform(1, -90)

      expect(transform.rotation).toBe(270)
    })
  })
})