import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { PDFViewer } from '../pdf-viewer'

// Simple integration test to verify component structure
describe('PDF Components Integration', () => {
  it('renders PDFViewer with basic structure', () => {
    const mockProps = {
      fileUrl: 'test-pdf-url',
      onPageChange: vi.fn(),
      onZoomChange: vi.fn(),
      onDocumentLoad: vi.fn(),
      onError: vi.fn(),
    }

    render(<PDFViewer {...mockProps} />)
    
    // Should render the main container
    expect(document.querySelector('.flex.flex-col.h-full')).toBeInTheDocument()
    
    // Should show loading state initially
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('renders PDFViewer without controls', () => {
    const mockProps = {
      fileUrl: 'test-pdf-url',
      showControls: false,
    }

    render(<PDFViewer {...mockProps} />)
    
    // Should not render controls section
    expect(document.querySelector('.border-b.border-border')).not.toBeInTheDocument()
  })

  it('applies custom className', () => {
    const mockProps = {
      fileUrl: 'test-pdf-url',
      className: 'custom-test-class',
    }

    render(<PDFViewer {...mockProps} />)
    
    // Should apply custom class
    expect(document.querySelector('.custom-test-class')).toBeInTheDocument()
  })
})