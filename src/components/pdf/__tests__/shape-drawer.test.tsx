import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { ShapeDrawer } from '../shape-drawer'
import { AnnotationTool } from '@/types'

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'test-uuid-123'),
  },
})

describe('ShapeDrawer', () => {
  const mockOnAnnotationAdd = vi.fn()

  const defaultProps = {
    pageNumber: 1,
    scale: 1,
    onAnnotationAdd: mockOnAnnotationAdd,
  }

  const rectangleTool: AnnotationTool = {
    type: 'rectangle',
    color: '#ff0000',
    strokeWidth: 2,
    opacity: 1,
  }

  const circleTool: AnnotationTool = {
    type: 'circle',
    color: '#00ff00',
    strokeWidth: 3,
    opacity: 0.8,
  }

  const arrowTool: AnnotationTool = {
    type: 'arrow',
    color: '#0000ff',
    strokeWidth: 2,
    opacity: 1,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crashing', () => {
    render(<ShapeDrawer {...defaultProps} />)
    expect(screen.getByRole('generic')).toBeInTheDocument()
  })

  it('shows crosshair cursor when shape tool is selected', () => {
    render(<ShapeDrawer {...defaultProps} selectedTool={rectangleTool} />)
    const container = screen.getByRole('generic')
    expect(container).toHaveClass('cursor-crosshair')
  })

  it('shows default cursor when no shape tool is selected', () => {
    const textTool: AnnotationTool = {
      type: 'highlight',
      color: '#ffff00',
      strokeWidth: 2,
      opacity: 1,
    }
    render(<ShapeDrawer {...defaultProps} selectedTool={textTool} />)
    const container = screen.getByRole('generic')
    expect(container).toHaveClass('cursor-default')
  })

  it('shows drawing instructions when shape tool is selected', () => {
    render(<ShapeDrawer {...defaultProps} selectedTool={rectangleTool} />)
    expect(screen.getByText(/Click and drag to draw rectangle/)).toBeInTheDocument()
  })

  it('starts drawing on mouse down with rectangle tool', () => {
    render(<ShapeDrawer {...defaultProps} selectedTool={rectangleTool} />)
    const container = screen.getByRole('generic')
    
    fireEvent.mouseDown(container, { clientX: 100, clientY: 100 })
    
    // Should show drawing feedback
    expect(screen.getByText(/Release to finish drawing/)).toBeInTheDocument()
  })

  it('creates rectangle annotation on mouse up', () => {
    const { container } = render(<ShapeDrawer {...defaultProps} selectedTool={rectangleTool} />)
    const drawingArea = container.firstChild as HTMLElement
    
    // Mock getBoundingClientRect
    drawingArea.getBoundingClientRect = vi.fn(() => ({
      left: 0,
      top: 0,
      width: 500,
      height: 700,
      right: 500,
      bottom: 700,
    }))
    
    // Start drawing
    fireEvent.mouseDown(drawingArea, { clientX: 100, clientY: 100 })
    
    // Move mouse to create shape
    fireEvent.mouseMove(drawingArea, { clientX: 200, clientY: 150 })
    
    // Finish drawing
    fireEvent.mouseUp(drawingArea)
    
    expect(mockOnAnnotationAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'rectangle',
        pageNumber: 1,
        coordinates: expect.objectContaining({
          x: 100,
          y: 100,
          width: 100,
          height: 50,
        }),
        style: expect.objectContaining({
          color: '#ff0000',
          strokeWidth: 2,
          opacity: 1,
        }),
      })
    )
  })

  it('creates circle annotation with circle tool', () => {
    const { container } = render(<ShapeDrawer {...defaultProps} selectedTool={circleTool} />)
    const drawingArea = container.firstChild as HTMLElement
    
    drawingArea.getBoundingClientRect = vi.fn(() => ({
      left: 0,
      top: 0,
      width: 500,
      height: 700,
      right: 500,
      bottom: 700,
    }))
    
    fireEvent.mouseDown(drawingArea, { clientX: 50, clientY: 50 })
    fireEvent.mouseMove(drawingArea, { clientX: 150, clientY: 150 })
    fireEvent.mouseUp(drawingArea)
    
    expect(mockOnAnnotationAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'circle',
        coordinates: expect.objectContaining({
          x: 50,
          y: 50,
          width: 100,
          height: 100,
        }),
      })
    )
  })

  it('creates arrow annotation with arrow tool', () => {
    const { container } = render(<ShapeDrawer {...defaultProps} selectedTool={arrowTool} />)
    const drawingArea = container.firstChild as HTMLElement
    
    drawingArea.getBoundingClientRect = vi.fn(() => ({
      left: 0,
      top: 0,
      width: 500,
      height: 700,
      right: 500,
      bottom: 700,
    }))
    
    fireEvent.mouseDown(drawingArea, { clientX: 100, clientY: 100 })
    fireEvent.mouseMove(drawingArea, { clientX: 200, clientY: 200 })
    fireEvent.mouseUp(drawingArea)
    
    expect(mockOnAnnotationAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'arrow',
        coordinates: expect.objectContaining({
          points: [100, 100, 200, 200],
        }),
      })
    )
  })

  it('does not create annotation for very small shapes', () => {
    const { container } = render(<ShapeDrawer {...defaultProps} selectedTool={rectangleTool} />)
    const drawingArea = container.firstChild as HTMLElement
    
    drawingArea.getBoundingClientRect = vi.fn(() => ({
      left: 0,
      top: 0,
      width: 500,
      height: 700,
      right: 500,
      bottom: 700,
    }))
    
    // Draw very small rectangle
    fireEvent.mouseDown(drawingArea, { clientX: 100, clientY: 100 })
    fireEvent.mouseMove(drawingArea, { clientX: 102, clientY: 102 })
    fireEvent.mouseUp(drawingArea)
    
    expect(mockOnAnnotationAdd).not.toHaveBeenCalled()
  })

  it('cancels drawing on mouse leave', () => {
    const { container } = render(<ShapeDrawer {...defaultProps} selectedTool={rectangleTool} />)
    const drawingArea = container.firstChild as HTMLElement
    
    drawingArea.getBoundingClientRect = vi.fn(() => ({
      left: 0,
      top: 0,
      width: 500,
      height: 700,
      right: 500,
      bottom: 700,
    }))
    
    fireEvent.mouseDown(drawingArea, { clientX: 100, clientY: 100 })
    fireEvent.mouseMove(drawingArea, { clientX: 200, clientY: 200 })
    
    // Mouse leaves the drawing area
    fireEvent.mouseLeave(drawingArea)
    
    // Should not show drawing feedback anymore
    expect(screen.queryByText(/Release to finish drawing/)).not.toBeInTheDocument()
  })

  it('cancels drawing on escape key', () => {
    const { container } = render(<ShapeDrawer {...defaultProps} selectedTool={rectangleTool} />)
    const drawingArea = container.firstChild as HTMLElement
    
    drawingArea.getBoundingClientRect = vi.fn(() => ({
      left: 0,
      top: 0,
      width: 500,
      height: 700,
      right: 500,
      bottom: 700,
    }))
    
    fireEvent.mouseDown(drawingArea, { clientX: 100, clientY: 100 })
    fireEvent.mouseMove(drawingArea, { clientX: 200, clientY: 200 })
    
    // Press escape
    fireEvent.keyDown(document, { key: 'Escape' })
    
    // Should not show drawing feedback anymore
    expect(screen.queryByText(/Release to finish drawing/)).not.toBeInTheDocument()
  })

  it('does not respond to mouse events when disabled', () => {
    const { container } = render(
      <ShapeDrawer {...defaultProps} selectedTool={rectangleTool} disabled />
    )
    const drawingArea = container.firstChild as HTMLElement
    
    expect(drawingArea).toHaveClass('pointer-events-none')
    
    fireEvent.mouseDown(drawingArea, { clientX: 100, clientY: 100 })
    
    expect(screen.queryByText(/Release to finish drawing/)).not.toBeInTheDocument()
  })

  it('handles scale correctly', () => {
    const { container } = render(
      <ShapeDrawer {...defaultProps} selectedTool={rectangleTool} scale={2} />
    )
    const drawingArea = container.firstChild as HTMLElement
    
    drawingArea.getBoundingClientRect = vi.fn(() => ({
      left: 0,
      top: 0,
      width: 500,
      height: 700,
      right: 500,
      bottom: 700,
    }))
    
    fireEvent.mouseDown(drawingArea, { clientX: 100, clientY: 100 })
    fireEvent.mouseMove(drawingArea, { clientX: 200, clientY: 200 })
    fireEvent.mouseUp(drawingArea)
    
    // Coordinates should be scaled down
    expect(mockOnAnnotationAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        coordinates: expect.objectContaining({
          x: 50, // 100 / 2
          y: 50, // 100 / 2
          width: 50, // 100 / 2
          height: 50, // 100 / 2
        }),
      })
    )
  })

  it('does not start drawing with non-shape tools', () => {
    const highlightTool: AnnotationTool = {
      type: 'highlight',
      color: '#ffff00',
      strokeWidth: 2,
      opacity: 1,
    }
    
    const { container } = render(<ShapeDrawer {...defaultProps} selectedTool={highlightTool} />)
    const drawingArea = container.firstChild as HTMLElement
    
    fireEvent.mouseDown(drawingArea, { clientX: 100, clientY: 100 })
    
    expect(screen.queryByText(/Release to finish drawing/)).not.toBeInTheDocument()
  })
})