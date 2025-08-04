import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { TextHighlighter } from '../text-highlighter'
import { textSelectionService } from '@/services/text-selection-service'
import { AnnotationTool } from '@/types'

// Mock the text selection service
vi.mock('@/services/text-selection-service', () => ({
  textSelectionService: {
    addSelectionChangeListener: vi.fn(),
    removeSelectionChangeListener: vi.fn(),
    getCurrentSelection: vi.fn(),
  },
}))

// Mock window.getSelection
const mockSelection = {
  removeAllRanges: vi.fn(),
  isCollapsed: false,
}

Object.defineProperty(window, 'getSelection', {
  writable: true,
  value: vi.fn(() => mockSelection),
})

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'test-uuid-123'),
  },
})

describe('TextHighlighter', () => {
  const mockOnAnnotationAdd = vi.fn()
  const mockOnSelectionChange = vi.fn()

  const defaultProps = {
    pageNumber: 1,
    onAnnotationAdd: mockOnAnnotationAdd,
    onSelectionChange: mockOnSelectionChange,
  }

  const highlightTool: AnnotationTool = {
    type: 'highlight',
    color: '#ffff00',
    strokeWidth: 2,
    opacity: 0.8,
  }

  const mockTextSelection = {
    id: 'selection-123',
    text: 'Selected text',
    pageNumber: 1,
    boundingBoxes: [
      { x: 100, y: 200, width: 150, height: 20 },
      { x: 100, y: 220, width: 100, height: 20 },
    ],
    startOffset: 0,
    endOffset: 13,
    containerElement: document.createElement('div'),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders without crashing', () => {
    render(<TextHighlighter {...defaultProps} />)
    expect(screen.getByRole('generic')).toBeInTheDocument()
  })

  it('sets up text selection listeners on mount', () => {
    render(<TextHighlighter {...defaultProps} />)
    
    expect(textSelectionService.addSelectionChangeListener).toHaveBeenCalledWith(
      expect.any(Function)
    )
  })

  it('removes text selection listeners on unmount', () => {
    const { unmount } = render(<TextHighlighter {...defaultProps} />)
    
    unmount()
    
    expect(textSelectionService.removeSelectionChangeListener).toHaveBeenCalledWith(
      expect.any(Function)
    )
  })

  it('calls onSelectionChange when text is selected', () => {
    render(<TextHighlighter {...defaultProps} />)
    
    // Get the listener function that was registered
    const listenerCall = (textSelectionService.addSelectionChangeListener as any).mock.calls[0]
    const selectionChangeListener = listenerCall[0]
    
    // Simulate text selection
    selectionChangeListener(mockTextSelection)
    
    expect(mockOnSelectionChange).toHaveBeenCalledWith(mockTextSelection)
  })

  it('shows highlight preview when text is selected with highlight tool', () => {
    render(<TextHighlighter {...defaultProps} selectedTool={highlightTool} />)
    
    // Get the listener function and simulate selection
    const listenerCall = (textSelectionService.addSelectionChangeListener as any).mock.calls[0]
    const selectionChangeListener = listenerCall[0]
    
    selectionChangeListener(mockTextSelection)
    
    // Check if preview elements are rendered
    const previewElements = screen.getAllByRole('generic')
    expect(previewElements.length).toBeGreaterThan(1) // Container + preview boxes
  })

  it('shows selection hint when text is selected', () => {
    render(<TextHighlighter {...defaultProps} selectedTool={highlightTool} />)
    
    // Get the listener function and simulate selection
    const listenerCall = (textSelectionService.addSelectionChangeListener as any).mock.calls[0]
    const selectionChangeListener = listenerCall[0]
    
    selectionChangeListener(mockTextSelection)
    
    expect(screen.getByText(/Click or press Enter to apply highlight/)).toBeInTheDocument()
  })

  it('creates annotation when Enter key is pressed with selection', () => {
    render(<TextHighlighter {...defaultProps} selectedTool={highlightTool} />)
    
    // Simulate text selection
    const listenerCall = (textSelectionService.addSelectionChangeListener as any).mock.calls[0]
    const selectionChangeListener = listenerCall[0]
    selectionChangeListener(mockTextSelection)
    
    // Simulate Enter key press
    fireEvent.keyDown(document, { key: 'Enter' })
    
    expect(mockOnAnnotationAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'highlight',
        pageNumber: 1,
        content: 'Selected text',
        style: expect.objectContaining({
          color: '#ffff00',
          opacity: 0.8,
        }),
      })
    )
  })

  it('clears selection when Escape key is pressed', () => {
    render(<TextHighlighter {...defaultProps} selectedTool={highlightTool} />)
    
    // Simulate text selection
    const listenerCall = (textSelectionService.addSelectionChangeListener as any).mock.calls[0]
    const selectionChangeListener = listenerCall[0]
    selectionChangeListener(mockTextSelection)
    
    // Simulate Escape key press
    fireEvent.keyDown(document, { key: 'Escape' })
    
    expect(mockSelection.removeAllRanges).toHaveBeenCalled()
  })

  it('handles double-click for quick highlighting', async () => {
    // Mock getCurrentSelection to return our test selection
    ;(textSelectionService.getCurrentSelection as any).mockReturnValue(mockTextSelection)
    
    render(<TextHighlighter {...defaultProps} selectedTool={highlightTool} />)
    
    // Simulate double-click
    fireEvent.doubleClick(document)
    
    await waitFor(() => {
      expect(mockOnAnnotationAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'highlight',
          pageNumber: 1,
          content: 'Selected text',
        })
      )
    })
  })

  it('does not create annotation for non-text tools', () => {
    const rectangleTool: AnnotationTool = {
      type: 'rectangle',
      color: '#ff0000',
      strokeWidth: 2,
      opacity: 1,
    }

    render(<TextHighlighter {...defaultProps} selectedTool={rectangleTool} />)
    
    // Simulate text selection
    const listenerCall = (textSelectionService.addSelectionChangeListener as any).mock.calls[0]
    const selectionChangeListener = listenerCall[0]
    selectionChangeListener(mockTextSelection)
    
    // Simulate Enter key press
    fireEvent.keyDown(document, { key: 'Enter' })
    
    expect(mockOnAnnotationAdd).not.toHaveBeenCalled()
  })

  it('handles underline tool correctly', () => {
    const underlineTool: AnnotationTool = {
      type: 'underline',
      color: '#0000ff',
      strokeWidth: 2,
      opacity: 1,
    }

    render(<TextHighlighter {...defaultProps} selectedTool={underlineTool} />)
    
    // Simulate text selection
    const listenerCall = (textSelectionService.addSelectionChangeListener as any).mock.calls[0]
    const selectionChangeListener = listenerCall[0]
    selectionChangeListener(mockTextSelection)
    
    // Simulate Enter key press
    fireEvent.keyDown(document, { key: 'Enter' })
    
    expect(mockOnAnnotationAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'underline',
        style: expect.objectContaining({
          color: '#0000ff',
        }),
      })
    )
  })

  it('handles strikethrough tool correctly', () => {
    const strikethroughTool: AnnotationTool = {
      type: 'strikethrough',
      color: '#ff0000',
      strokeWidth: 2,
      opacity: 1,
    }

    render(<TextHighlighter {...defaultProps} selectedTool={strikethroughTool} />)
    
    // Simulate text selection
    const listenerCall = (textSelectionService.addSelectionChangeListener as any).mock.calls[0]
    const selectionChangeListener = listenerCall[0]
    selectionChangeListener(mockTextSelection)
    
    // Simulate Enter key press
    fireEvent.keyDown(document, { key: 'Enter' })
    
    expect(mockOnAnnotationAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'strikethrough',
        style: expect.objectContaining({
          color: '#ff0000',
        }),
      })
    )
  })

  it('does not show preview when disabled', () => {
    render(<TextHighlighter {...defaultProps} selectedTool={highlightTool} disabled />)
    
    // Get the listener function and simulate selection
    const listenerCall = (textSelectionService.addSelectionChangeListener as any).mock.calls[0]
    const selectionChangeListener = listenerCall[0]
    
    selectionChangeListener(mockTextSelection)
    
    // Should not show hint when disabled
    expect(screen.queryByText(/Click or press Enter to apply/)).not.toBeInTheDocument()
  })

  it('calculates correct bounding box for annotation', () => {
    render(<TextHighlighter {...defaultProps} selectedTool={highlightTool} />)
    
    // Simulate text selection with multiple bounding boxes
    const selectionWithMultipleBoxes = {
      ...mockTextSelection,
      boundingBoxes: [
        { x: 100, y: 200, width: 150, height: 20 },
        { x: 50, y: 220, width: 200, height: 20 },
        { x: 75, y: 240, width: 100, height: 20 },
      ],
    }
    
    const listenerCall = (textSelectionService.addSelectionChangeListener as any).mock.calls[0]
    const selectionChangeListener = listenerCall[0]
    selectionChangeListener(selectionWithMultipleBoxes)
    
    // Simulate Enter key press
    fireEvent.keyDown(document, { key: 'Enter' })
    
    expect(mockOnAnnotationAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        coordinates: {
          x: 50, // min x
          y: 200, // min y
          width: 200, // max x - min x (250 - 50)
          height: 60, // max y - min y (260 - 200)
        },
      })
    )
  })
})