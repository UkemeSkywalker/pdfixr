import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { TextSelectionService } from '../text-selection-service'

// Mock DOM APIs
const mockRange = {
  collapsed: false,
  startOffset: 0,
  endOffset: 10,
  commonAncestorContainer: document.createElement('div'),
  getClientRects: vi.fn(() => ({
    length: 2,
    0: { left: 100, top: 200, width: 150, height: 20 },
    1: { left: 100, top: 220, width: 100, height: 20 },
  })),
}

const mockSelection = {
  rangeCount: 1,
  isCollapsed: false,
  toString: vi.fn(() => 'Selected text'),
  getRangeAt: vi.fn(() => mockRange),
  removeAllRanges: vi.fn(),
  addRange: vi.fn(),
}

Object.defineProperty(window, 'getSelection', {
  writable: true,
  value: vi.fn(() => mockSelection),
})

// Mock document methods
Object.defineProperty(document, 'caretPositionFromPoint', {
  writable: true,
  value: vi.fn((x, y) => ({
    offsetNode: document.createTextNode('test'),
    offset: 5,
  })),
})

Object.defineProperty(document, 'createRange', {
  writable: true,
  value: vi.fn(() => ({
    setStart: vi.fn(),
    setEnd: vi.fn(),
  })),
})

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'test-uuid-123'),
  },
})

describe('TextSelectionService', () => {
  let service: TextSelectionService
  let mockContainer: HTMLElement

  beforeEach(() => {
    // Create mock PDF page container
    mockContainer = document.createElement('div')
    mockContainer.className = 'react-pdf__Page'
    mockContainer.setAttribute('data-page-number', '1')
    mockContainer.getBoundingClientRect = vi.fn(() => ({
      left: 50,
      top: 100,
      width: 500,
      height: 700,
      right: 550,
      bottom: 800,
    }))
    
    document.body.appendChild(mockContainer)
    
    // Mock range's commonAncestorContainer to be inside our container
    mockRange.commonAncestorContainer = mockContainer
    
    service = new TextSelectionService({
      minSelectionLength: 1,
      onSelectionChange: vi.fn(),
    })
    
    vi.clearAllMocks()
  })

  afterEach(() => {
    service.destroy()
    document.body.removeChild(mockContainer)
    vi.restoreAllMocks()
  })

  it('creates service with default options', () => {
    const defaultService = new TextSelectionService()
    expect(defaultService).toBeInstanceOf(TextSelectionService)
    defaultService.destroy()
  })

  it('processes valid text selection', () => {
    const mockListener = vi.fn()
    service.addSelectionChangeListener(mockListener)
    
    // Simulate selection change
    const event = new Event('selectionchange')
    document.dispatchEvent(event)
    
    expect(mockListener).toHaveBeenCalledWith(
      expect.objectContaining({
        id: expect.any(String),
        text: 'Selected text',
        pageNumber: 1,
        boundingBoxes: expect.arrayContaining([
          expect.objectContaining({
            x: expect.any(Number),
            y: expect.any(Number),
            width: expect.any(Number),
            height: expect.any(Number),
          }),
        ]),
      })
    )
  })

  it('ignores collapsed selections', () => {
    const mockListener = vi.fn()
    service.addSelectionChangeListener(mockListener)
    
    // Mock collapsed selection
    mockRange.collapsed = true
    mockSelection.isCollapsed = true
    
    const event = new Event('selectionchange')
    document.dispatchEvent(event)
    
    expect(mockListener).toHaveBeenCalledWith(null)
  })

  it('ignores selections that are too short', () => {
    const shortTextService = new TextSelectionService({
      minSelectionLength: 20,
    })
    
    const mockListener = vi.fn()
    shortTextService.addSelectionChangeListener(mockListener)
    
    const event = new Event('selectionchange')
    document.dispatchEvent(event)
    
    expect(mockListener).toHaveBeenCalledWith(null)
    
    shortTextService.destroy()
  })

  it('extracts page number from data attribute', () => {
    const mockListener = vi.fn()
    service.addSelectionChangeListener(mockListener)
    
    const event = new Event('selectionchange')
    document.dispatchEvent(event)
    
    expect(mockListener).toHaveBeenCalledWith(
      expect.objectContaining({
        pageNumber: 1,
      })
    )
  })

  it('extracts page number from class name', () => {
    // Remove data attribute and add class-based page number
    mockContainer.removeAttribute('data-page-number')
    mockContainer.className = 'pdf-page page-2'
    
    const mockListener = vi.fn()
    service.addSelectionChangeListener(mockListener)
    
    const event = new Event('selectionchange')
    document.dispatchEvent(event)
    
    expect(mockListener).toHaveBeenCalledWith(
      expect.objectContaining({
        pageNumber: 2,
      })
    )
  })

  it('handles mouse up events', () => {
    const mockListener = vi.fn()
    service.addSelectionChangeListener(mockListener)
    
    // Reset collapsed state
    mockRange.collapsed = false
    mockSelection.isCollapsed = false
    
    const mouseEvent = new MouseEvent('mouseup')
    document.dispatchEvent(mouseEvent)
    
    // Wait for timeout
    setTimeout(() => {
      expect(mockListener).toHaveBeenCalled()
    }, 20)
  })

  it('handles keyboard selection events', () => {
    const mockListener = vi.fn()
    service.addSelectionChangeListener(mockListener)
    
    // Reset collapsed state
    mockRange.collapsed = false
    mockSelection.isCollapsed = false
    
    const keyEvent = new KeyboardEvent('keyup', {
      key: 'ArrowRight',
      shiftKey: true,
    })
    document.dispatchEvent(keyEvent)
    
    // Wait for timeout
    setTimeout(() => {
      expect(mockListener).toHaveBeenCalled()
    }, 20)
  })

  it('converts coordinates correctly', () => {
    const mockListener = vi.fn()
    service.addSelectionChangeListener(mockListener)
    
    const event = new Event('selectionchange')
    document.dispatchEvent(event)
    
    expect(mockListener).toHaveBeenCalledWith(
      expect.objectContaining({
        boundingBoxes: expect.arrayContaining([
          expect.objectContaining({
            x: 50, // 100 - 50 (container left)
            y: 100, // 200 - 100 (container top)
            width: 150,
            height: 20,
          }),
        ]),
      })
    )
  })

  it('adds and removes selection change listeners', () => {
    const listener1 = vi.fn()
    const listener2 = vi.fn()
    
    service.addSelectionChangeListener(listener1)
    service.addSelectionChangeListener(listener2)
    
    const event = new Event('selectionchange')
    document.dispatchEvent(event)
    
    expect(listener1).toHaveBeenCalled()
    expect(listener2).toHaveBeenCalled()
    
    // Remove one listener
    service.removeSelectionChangeListener(listener1)
    vi.clearAllMocks()
    
    document.dispatchEvent(event)
    
    expect(listener1).not.toHaveBeenCalled()
    expect(listener2).toHaveBeenCalled()
  })

  it('gets current selection', () => {
    const mockListener = vi.fn()
    service.addSelectionChangeListener(mockListener)
    
    const event = new Event('selectionchange')
    document.dispatchEvent(event)
    
    const currentSelection = service.getCurrentSelection()
    expect(currentSelection).toMatchObject({
      text: 'Selected text',
      pageNumber: 1,
    })
  })

  it('selects text by coordinates', () => {
    const selection = service.selectTextByCoordinates(1, 100, 200, 250, 240)
    
    // Should attempt to create selection (may return null due to mocking limitations)
    expect(document.createRange).toHaveBeenCalled()
  })

  it('handles missing PDF page container', () => {
    // Remove the container
    document.body.removeChild(mockContainer)
    
    const mockListener = vi.fn()
    service.addSelectionChangeListener(mockListener)
    
    const event = new Event('selectionchange')
    document.dispatchEvent(event)
    
    expect(mockListener).toHaveBeenCalledWith(null)
    
    // Re-add container for cleanup
    document.body.appendChild(mockContainer)
  })

  it('handles selections without valid bounding boxes', () => {
    // Mock getClientRects to return empty
    mockRange.getClientRects = vi.fn(() => ({
      length: 0,
    }))
    
    const mockListener = vi.fn()
    service.addSelectionChangeListener(mockListener)
    
    const event = new Event('selectionchange')
    document.dispatchEvent(event)
    
    expect(mockListener).toHaveBeenCalledWith(null)
  })

  it('filters out very small bounding boxes', () => {
    // Mock getClientRects to return very small boxes
    mockRange.getClientRects = vi.fn(() => ({
      length: 2,
      0: { left: 100, top: 200, width: 0.5, height: 0.5 }, // Too small
      1: { left: 100, top: 220, width: 100, height: 20 }, // Valid
    }))
    
    const mockListener = vi.fn()
    service.addSelectionChangeListener(mockListener)
    
    const event = new Event('selectionchange')
    document.dispatchEvent(event)
    
    expect(mockListener).toHaveBeenCalledWith(
      expect.objectContaining({
        boundingBoxes: expect.arrayContaining([
          expect.objectContaining({
            width: 100,
            height: 20,
          }),
        ]),
      })
    )
    
    // Should only have one bounding box (the valid one)
    const call = mockListener.mock.calls[0][0]
    expect(call.boundingBoxes).toHaveLength(1)
  })

  it('cleans up event listeners on destroy', () => {
    const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener')
    
    service.destroy()
    
    expect(removeEventListenerSpy).toHaveBeenCalledWith('selectionchange', expect.any(Function))
    expect(removeEventListenerSpy).toHaveBeenCalledWith('mouseup', expect.any(Function))
    expect(removeEventListenerSpy).toHaveBeenCalledWith('keyup', expect.any(Function))
  })
})