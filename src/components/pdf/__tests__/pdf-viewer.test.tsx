import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { PDFViewer } from '../pdf-viewer'

// Mock react-pdf
vi.mock('react-pdf', () => ({
  Document: ({ children, onLoadSuccess, onLoadError, file }: any) => {
    // Simulate successful load after a short delay
    React.useEffect(() => {
      setTimeout(() => {
        if (file === 'valid-pdf-url') {
          onLoadSuccess({ numPages: 5 })
        } else if (file === 'invalid-pdf-url') {
          onLoadError(new Error('Failed to load PDF'))
        }
      }, 100)
    }, [file, onLoadSuccess, onLoadError])

    return <div data-testid="pdf-document">{children}</div>
  },
  Page: ({ pageNumber, onLoadSuccess, scale, rotate }: any) => {
    React.useEffect(() => {
      setTimeout(() => {
        onLoadSuccess?.({ width: 612, height: 792 })
      }, 50)
    }, [onLoadSuccess])

    return (
      <div 
        data-testid={`pdf-page-${pageNumber}`}
        data-scale={scale}
        data-rotate={rotate}
      >
        Page {pageNumber}
      </div>
    )
  },
  pdfjs: {
    GlobalWorkerOptions: { workerSrc: '' },
    version: '3.11.174'
  }
}))

describe('PDFViewer', () => {
  const mockProps = {
    fileUrl: 'valid-pdf-url',
    onPageChange: vi.fn(),
    onZoomChange: vi.fn(),
    onDocumentLoad: vi.fn(),
    onError: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  it('renders loading state initially', () => {
    render(<PDFViewer {...mockProps} />)
    
    expect(screen.getByTestId('pdf-document')).toBeInTheDocument()
    // Should show skeleton loading elements
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('renders PDF document after successful load', async () => {
    render(<PDFViewer {...mockProps} />)
    
    await waitFor(() => {
      expect(screen.getByTestId('pdf-page-1')).toBeInTheDocument()
    })

    expect(mockProps.onDocumentLoad).toHaveBeenCalledWith(5)
    expect(screen.getByText('of 5')).toBeInTheDocument()
  })

  it('renders error state when PDF fails to load', async () => {
    render(<PDFViewer {...mockProps} fileUrl="invalid-pdf-url" />)
    
    await waitFor(() => {
      expect(screen.getByText('Failed to load PDF')).toBeInTheDocument()
    })

    expect(mockProps.onError).toHaveBeenCalledWith(expect.any(Error))
  })

  it('handles page navigation correctly', async () => {
    const user = userEvent.setup()
    render(<PDFViewer {...mockProps} />)
    
    await waitFor(() => {
      expect(screen.getByTestId('pdf-page-1')).toBeInTheDocument()
    })

    // Test next page button
    const nextButton = screen.getByLabelText('Next page')
    await user.click(nextButton)
    
    expect(mockProps.onPageChange).toHaveBeenCalledWith(2)

    // Test previous page button
    const prevButton = screen.getByLabelText('Previous page')
    await user.click(prevButton)
    
    expect(mockProps.onPageChange).toHaveBeenCalledWith(1)
  })

  it('handles zoom controls correctly', async () => {
    const user = userEvent.setup()
    render(<PDFViewer {...mockProps} />)
    
    await waitFor(() => {
      expect(screen.getByTestId('pdf-page-1')).toBeInTheDocument()
    })

    // Test zoom in
    const zoomInButton = screen.getByLabelText('Zoom in')
    await user.click(zoomInButton)
    
    expect(mockProps.onZoomChange).toHaveBeenCalledWith(1.2)

    // Test zoom out
    const zoomOutButton = screen.getByLabelText('Zoom out')
    await user.click(zoomOutButton)
    
    expect(mockProps.onZoomChange).toHaveBeenCalledWith(expect.closeTo(0.833, 2))
  })

  it('handles page input correctly', async () => {
    const user = userEvent.setup()
    render(<PDFViewer {...mockProps} />)
    
    await waitFor(() => {
      expect(screen.getByTestId('pdf-page-1')).toBeInTheDocument()
    })

    const pageInput = screen.getByLabelText('Current page')
    
    // Clear and type new page number
    await user.clear(pageInput)
    await user.type(pageInput, '3')
    await user.keyboard('{Enter}')
    
    expect(mockProps.onPageChange).toHaveBeenCalledWith(3)
  })

  it('handles keyboard navigation', async () => {
    render(<PDFViewer {...mockProps} />)
    
    await waitFor(() => {
      expect(screen.getByTestId('pdf-page-1')).toBeInTheDocument()
    })

    // Test arrow key navigation
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(mockProps.onPageChange).toHaveBeenCalledWith(2)

    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(mockProps.onPageChange).toHaveBeenCalledWith(1)

    // Test zoom keyboard shortcuts
    fireEvent.keyDown(window, { key: '+', ctrlKey: true })
    expect(mockProps.onZoomChange).toHaveBeenCalledWith(1.2)

    fireEvent.keyDown(window, { key: '-', ctrlKey: true })
    expect(mockProps.onZoomChange).toHaveBeenCalledWith(expect.closeTo(0.833, 2))
  })

  it('respects zoom limits', async () => {
    const user = userEvent.setup()
    render(<PDFViewer {...mockProps} initialZoom={3} />)
    
    await waitFor(() => {
      expect(screen.getByTestId('pdf-page-1')).toBeInTheDocument()
    })

    const zoomInButton = screen.getByLabelText('Zoom in')
    expect(zoomInButton).toBeDisabled()

    // Test minimum zoom
    render(<PDFViewer {...mockProps} initialZoom={0.1} />)
    
    await waitFor(() => {
      expect(screen.getByTestId('pdf-page-1')).toBeInTheDocument()
    })

    const zoomOutButton = screen.getByLabelText('Zoom out')
    expect(zoomOutButton).toBeDisabled()
  })

  it('respects page navigation limits', async () => {
    render(<PDFViewer {...mockProps} initialPage={1} />)
    
    await waitFor(() => {
      expect(screen.getByTestId('pdf-page-1')).toBeInTheDocument()
    })

    const prevButton = screen.getByLabelText('Previous page')
    expect(prevButton).toBeDisabled()

    // Test last page
    render(<PDFViewer {...mockProps} initialPage={5} />)
    
    await waitFor(() => {
      expect(screen.getByTestId('pdf-page-5')).toBeInTheDocument()
    })

    const nextButton = screen.getByLabelText('Next page')
    expect(nextButton).toBeDisabled()
  })

  it('handles rotation correctly', async () => {
    const user = userEvent.setup()
    render(<PDFViewer {...mockProps} />)
    
    await waitFor(() => {
      expect(screen.getByTestId('pdf-page-1')).toBeInTheDocument()
    })

    const rotateButton = screen.getByLabelText('Rotate clockwise')
    await user.click(rotateButton)
    
    // Check if page has rotation applied
    const page = screen.getByTestId('pdf-page-1')
    expect(page).toHaveAttribute('data-rotate', '90')
  })

  it('can hide controls', async () => {
    render(<PDFViewer {...mockProps} showControls={false} />)
    
    await waitFor(() => {
      expect(screen.getByTestId('pdf-page-1')).toBeInTheDocument()
    })

    expect(screen.queryByLabelText('Next page')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Previous page')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Zoom in')).not.toBeInTheDocument()
  })

  it('validates page input bounds', async () => {
    const user = userEvent.setup()
    render(<PDFViewer {...mockProps} />)
    
    await waitFor(() => {
      expect(screen.getByTestId('pdf-page-1')).toBeInTheDocument()
    })

    const pageInput = screen.getByLabelText('Current page')
    
    // Test invalid high page number
    await user.clear(pageInput)
    await user.type(pageInput, '10')
    await user.keyboard('{Enter}')
    
    // Should clamp to max page (5)
    expect(mockProps.onPageChange).toHaveBeenCalledWith(5)

    // Test invalid low page number
    await user.clear(pageInput)
    await user.type(pageInput, '0')
    await user.keyboard('{Enter}')
    
    // Should clamp to min page (1)
    expect(mockProps.onPageChange).toHaveBeenCalledWith(1)
  })

  it('displays zoom percentage correctly', async () => {
    render(<PDFViewer {...mockProps} initialZoom={1.5} />)
    
    await waitFor(() => {
      expect(screen.getByTestId('pdf-page-1')).toBeInTheDocument()
    })

    expect(screen.getByText('150%')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(<PDFViewer {...mockProps} className="custom-class" />)
    
    const container = document.querySelector('.custom-class')
    expect(container).toBeInTheDocument()
  })
})