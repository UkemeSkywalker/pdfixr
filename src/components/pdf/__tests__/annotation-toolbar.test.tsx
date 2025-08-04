import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { AnnotationToolbar } from '../annotation-toolbar'
import { AnnotationTool } from '@/types'

describe('AnnotationToolbar', () => {
  const mockOnToolSelect = vi.fn()
  const mockOnUndo = vi.fn()
  const mockOnRedo = vi.fn()

  const defaultProps = {
    onToolSelect: mockOnToolSelect,
    onUndo: mockOnUndo,
    onRedo: mockOnRedo,
  }

  const selectedTool: AnnotationTool = {
    type: 'highlight',
    color: '#ffff00',
    strokeWidth: 2,
    opacity: 0.8,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders all annotation tools', () => {
    render(<AnnotationToolbar {...defaultProps} />)
    
    // Check for text tools
    expect(screen.getByLabelText(/highlight selected text/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/underline selected text/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/strike through selected text/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/add a text note/i)).toBeInTheDocument()
    
    // Check for shape tools
    expect(screen.getByLabelText(/draw a rectangle/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/draw a circle/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/draw an arrow/i)).toBeInTheDocument()
    
    // Check for drawing tools
    expect(screen.getByLabelText(/draw freehand/i)).toBeInTheDocument()
  })

  it('renders undo/redo controls', () => {
    render(<AnnotationToolbar {...defaultProps} />)
    
    expect(screen.getByLabelText(/undo last action/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/redo last action/i)).toBeInTheDocument()
  })

  it('renders color picker', () => {
    render(<AnnotationToolbar {...defaultProps} />)
    
    expect(screen.getByLabelText(/select color/i)).toBeInTheDocument()
  })

  it('calls onToolSelect when tool is clicked', () => {
    render(<AnnotationToolbar {...defaultProps} />)
    
    const highlightButton = screen.getByLabelText(/highlight selected text/i)
    fireEvent.click(highlightButton)
    
    expect(mockOnToolSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'highlight',
        color: expect.any(String),
        strokeWidth: expect.any(Number),
        opacity: expect.any(Number),
      })
    )
  })

  it('shows selected tool as active', () => {
    render(<AnnotationToolbar {...defaultProps} selectedTool={selectedTool} />)
    
    const highlightButton = screen.getByLabelText(/highlight selected text/i)
    expect(highlightButton).toHaveAttribute('aria-pressed', 'true')
  })

  it('calls onUndo when undo button is clicked', () => {
    render(<AnnotationToolbar {...defaultProps} canUndo />)
    
    const undoButton = screen.getByLabelText(/undo last action/i)
    fireEvent.click(undoButton)
    
    expect(mockOnUndo).toHaveBeenCalled()
  })

  it('calls onRedo when redo button is clicked', () => {
    render(<AnnotationToolbar {...defaultProps} canRedo />)
    
    const redoButton = screen.getByLabelText(/redo last action/i)
    fireEvent.click(redoButton)
    
    expect(mockOnRedo).toHaveBeenCalled()
  })

  it('disables undo button when canUndo is false', () => {
    render(<AnnotationToolbar {...defaultProps} canUndo={false} />)
    
    const undoButton = screen.getByLabelText(/undo last action/i)
    expect(undoButton).toBeDisabled()
  })

  it('disables redo button when canRedo is false', () => {
    render(<AnnotationToolbar {...defaultProps} canRedo={false} />)
    
    const redoButton = screen.getByLabelText(/redo last action/i)
    expect(redoButton).toBeDisabled()
  })

  it('updates tool color when color picker changes', async () => {
    render(<AnnotationToolbar {...defaultProps} selectedTool={selectedTool} />)
    
    // Click on color picker to open it
    const colorButton = screen.getByLabelText(/select color/i)
    fireEvent.click(colorButton)
    
    // Wait for color picker to open
    await waitFor(() => {
      expect(screen.getByText(/preset colors/i)).toBeInTheDocument()
    })
    
    // Click on a preset color (assuming the first one is red)
    const presetColors = screen.getAllByRole('button')
    const redColor = presetColors.find(button => 
      button.style.backgroundColor === 'rgb(255, 107, 107)' // #ff6b6b
    )
    
    if (redColor) {
      fireEvent.click(redColor)
      
      expect(mockOnToolSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'highlight',
          color: '#ff6b6b',
        })
      )
    }
  })

  it('shows style options when settings button is clicked', async () => {
    render(<AnnotationToolbar {...defaultProps} />)
    
    const settingsButton = screen.getByLabelText(/toggle style options/i)
    fireEvent.click(settingsButton)
    
    await waitFor(() => {
      expect(screen.getByText(/stroke width/i)).toBeInTheDocument()
      expect(screen.getByText(/opacity/i)).toBeInTheDocument()
    })
  })

  it('updates stroke width when slider changes', async () => {
    render(<AnnotationToolbar {...defaultProps} selectedTool={selectedTool} />)
    
    // Open style options
    const settingsButton = screen.getByLabelText(/toggle style options/i)
    fireEvent.click(settingsButton)
    
    await waitFor(() => {
      const strokeSlider = screen.getByDisplayValue('2') // Default stroke width
      fireEvent.change(strokeSlider, { target: { value: '5' } })
      
      expect(mockOnToolSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          strokeWidth: 5,
        })
      )
    })
  })

  it('updates opacity when slider changes', async () => {
    render(<AnnotationToolbar {...defaultProps} selectedTool={selectedTool} />)
    
    // Open style options
    const settingsButton = screen.getByLabelText(/toggle style options/i)
    fireEvent.click(settingsButton)
    
    await waitFor(() => {
      const opacitySlider = screen.getByDisplayValue('0.8') // Current opacity
      fireEvent.change(opacitySlider, { target: { value: '0.5' } })
      
      expect(mockOnToolSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          opacity: 0.5,
        })
      )
    })
  })

  it('renders with vertical orientation', () => {
    render(<AnnotationToolbar {...defaultProps} orientation="vertical" />)
    
    const toolbar = screen.getByRole('generic')
    expect(toolbar).toHaveClass('flex-col')
  })

  it('shows tool labels when showLabels is true', () => {
    render(<AnnotationToolbar {...defaultProps} showLabels />)
    
    expect(screen.getByText('Highlight')).toBeInTheDocument()
    expect(screen.getByText('Rectangle')).toBeInTheDocument()
    expect(screen.getByText('Freehand')).toBeInTheDocument()
  })

  it('disables all tools when disabled prop is true', () => {
    render(<AnnotationToolbar {...defaultProps} disabled />)
    
    const toolbar = screen.getByRole('generic')
    expect(toolbar).toHaveClass('opacity-50', 'pointer-events-none')
  })

  it('shows color indicator on selected tool', () => {
    render(<AnnotationToolbar {...defaultProps} selectedTool={selectedTool} />)
    
    const highlightButton = screen.getByLabelText(/highlight selected text/i)
    const colorIndicator = highlightButton.querySelector('div[style*="background-color"]')
    
    expect(colorIndicator).toBeInTheDocument()
  })

  it('handles tool selection for different tool types', () => {
    render(<AnnotationToolbar {...defaultProps} />)
    
    // Test rectangle tool
    const rectangleButton = screen.getByLabelText(/draw a rectangle/i)
    fireEvent.click(rectangleButton)
    
    expect(mockOnToolSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'rectangle',
      })
    )
    
    // Test circle tool
    const circleButton = screen.getByLabelText(/draw a circle/i)
    fireEvent.click(circleButton)
    
    expect(mockOnToolSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'circle',
      })
    )
  })
})