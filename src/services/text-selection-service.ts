'use client'

/**
 * Text Selection Service
 * Handles text selection detection and highlighting on PDF pages
 */

export interface TextSelection {
  id: string
  text: string
  pageNumber: number
  boundingBoxes: BoundingBox[]
  startOffset: number
  endOffset: number
  containerElement: HTMLElement
}

export interface BoundingBox {
  x: number
  y: number
  width: number
  height: number
}

export interface TextSelectionOptions {
  minSelectionLength?: number
  allowCrossPageSelection?: boolean
  highlightColor?: string
  onSelectionChange?: (selection: TextSelection | null) => void
}

export class TextSelectionService {
  private currentSelection: TextSelection | null = null
  private options: TextSelectionOptions
  private selectionChangeListeners: ((selection: TextSelection | null) => void)[] = []

  constructor(options: TextSelectionOptions = {}) {
    this.options = {
      minSelectionLength: 1,
      allowCrossPageSelection: false,
      highlightColor: '#ffff00',
      ...options,
    }

    // Only setup listeners on client side
    if (typeof window !== 'undefined') {
      this.setupSelectionListeners()
    }
  }

  /**
   * Set up global selection event listeners
   */
  private setupSelectionListeners(): void {
    if (typeof window === 'undefined') return

    document.addEventListener('selectionchange', this.handleSelectionChange.bind(this))
    document.addEventListener('mouseup', this.handleMouseUp.bind(this))
    document.addEventListener('keyup', this.handleKeyUp.bind(this))
  }

  /**
   * Handle selection change events
   */
  private handleSelectionChange(): void {
    if (typeof window === 'undefined') return

    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) {
      this.clearSelection()
      return
    }

    const range = selection.getRangeAt(0)
    if (range.collapsed) {
      this.clearSelection()
      return
    }

    this.processSelection(selection, range)
  }

  /**
   * Handle mouse up events for selection completion
   */
  private handleMouseUp(event: MouseEvent): void {
    if (typeof window === 'undefined') return

    // Small delay to ensure selection is processed
    setTimeout(() => {
      const selection = window.getSelection()
      if (selection && !selection.isCollapsed) {
        this.finalizeSelection()
      }
    }, 10)
  }

  /**
   * Handle keyboard events for selection
   */
  private handleKeyUp(event: KeyboardEvent): void {
    if (typeof window === 'undefined') return

    if (event.shiftKey && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
      setTimeout(() => {
        const selection = window.getSelection()
        if (selection && !selection.isCollapsed) {
          this.finalizeSelection()
        }
      }, 10)
    }
  }

  /**
   * Process the current browser selection
   */
  private processSelection(selection: Selection, range: Range): void {
    const selectedText = selection.toString().trim()

    if (selectedText.length < (this.options.minSelectionLength || 1)) {
      this.clearSelection()
      return
    }

    // Find the PDF page container
    const pageContainer = this.findPDFPageContainer(range.commonAncestorContainer)
    if (!pageContainer) {
      this.clearSelection()
      return
    }

    const pageNumber = this.extractPageNumber(pageContainer)
    if (pageNumber === null) {
      this.clearSelection()
      return
    }

    // Get bounding boxes for the selection
    const boundingBoxes = this.getBoundingBoxesFromRange(range, pageContainer)
    if (boundingBoxes.length === 0) {
      this.clearSelection()
      return
    }

    // Create text selection object
    const textSelection: TextSelection = {
      id: crypto.randomUUID(),
      text: selectedText,
      pageNumber,
      boundingBoxes,
      startOffset: range.startOffset,
      endOffset: range.endOffset,
      containerElement: pageContainer,
    }

    this.currentSelection = textSelection
    this.notifySelectionChange(textSelection)
  }

  /**
   * Find the PDF page container element
   */
  private findPDFPageContainer(node: Node): HTMLElement | null {
    let current = node instanceof Element ? node : node.parentElement

    while (current) {
      // Look for React-PDF page container
      if (current.classList.contains('react-pdf__Page') ||
        current.classList.contains('pdf-page') ||
        current.hasAttribute('data-page-number')) {
        return current as HTMLElement
      }
      current = current.parentElement
    }

    return null
  }

  /**
   * Extract page number from container element
   */
  private extractPageNumber(container: HTMLElement): number | null {
    // Try data attribute first
    const pageAttr = container.getAttribute('data-page-number')
    if (pageAttr) {
      return parseInt(pageAttr, 10)
    }

    // Try to find page number in class names
    const classMatch = container.className.match(/page-(\d+)/)
    if (classMatch) {
      return parseInt(classMatch[1], 10)
    }

    // Try to find in parent elements
    let parent = container.parentElement
    while (parent) {
      const parentPageAttr = parent.getAttribute('data-page-number')
      if (parentPageAttr) {
        return parseInt(parentPageAttr, 10)
      }
      parent = parent.parentElement
    }

    return null
  }

  /**
   * Get bounding boxes from a selection range
   */
  private getBoundingBoxesFromRange(range: Range, container: HTMLElement): BoundingBox[] {
    const boundingBoxes: BoundingBox[] = []

    try {
      // Get all client rects for the range
      const rects = range.getClientRects()
      const containerRect = container.getBoundingClientRect()

      for (let i = 0; i < rects.length; i++) {
        const rect = rects[i]

        // Convert to container-relative coordinates
        const boundingBox: BoundingBox = {
          x: rect.left - containerRect.left,
          y: rect.top - containerRect.top,
          width: rect.width,
          height: rect.height,
        }

        // Filter out very small or invalid boxes
        if (boundingBox.width > 1 && boundingBox.height > 1) {
          boundingBoxes.push(boundingBox)
        }
      }
    } catch (error) {
      console.warn('Error getting bounding boxes from range:', error)
    }

    return boundingBoxes
  }

  /**
   * Finalize the current selection
   */
  private finalizeSelection(): void {
    if (this.currentSelection) {
      this.notifySelectionChange(this.currentSelection)
    }
  }

  /**
   * Clear the current selection
   */
  private clearSelection(): void {
    if (this.currentSelection) {
      this.currentSelection = null
      this.notifySelectionChange(null)
    }
  }

  /**
   * Get the current text selection
   */
  public getCurrentSelection(): TextSelection | null {
    return this.currentSelection
  }

  /**
   * Programmatically select text by coordinates
   */
  public selectTextByCoordinates(
    pageNumber: number,
    startX: number,
    startY: number,
    endX: number,
    endY: number
  ): TextSelection | null {
    const pageContainer = this.findPageContainer(pageNumber)
    if (!pageContainer) return null

    try {
      const range = this.createRangeFromCoordinates(pageContainer, startX, startY, endX, endY)
      if (!range) return null

      const selection = window.getSelection()
      if (selection) {
        selection.removeAllRanges()
        selection.addRange(range)
        this.processSelection(selection, range)
        return this.currentSelection
      }
    } catch (error) {
      console.warn('Error selecting text by coordinates:', error)
    }

    return null
  }

  /**
   * Find page container by page number
   */
  private findPageContainer(pageNumber: number): HTMLElement | null {
    const containers = document.querySelectorAll('[data-page-number]')
    for (const container of containers) {
      if (parseInt(container.getAttribute('data-page-number') || '0', 10) === pageNumber) {
        return container as HTMLElement
      }
    }
    return null
  }

  /**
   * Create a range from coordinates
   */
  private createRangeFromCoordinates(
    container: HTMLElement,
    startX: number,
    startY: number,
    endX: number,
    endY: number
  ): Range | null {
    try {
      const range = document.createRange()

      // Find start and end positions
      const startPos = this.getTextPositionFromPoint(container, startX, startY)
      const endPos = this.getTextPositionFromPoint(container, endX, endY)

      if (!startPos || !endPos) return null

      range.setStart(startPos.node, startPos.offset)
      range.setEnd(endPos.node, endPos.offset)

      return range
    } catch (error) {
      console.warn('Error creating range from coordinates:', error)
      return null
    }
  }

  /**
   * Get text position from point coordinates
   */
  private getTextPositionFromPoint(
    container: HTMLElement,
    x: number,
    y: number
  ): { node: Node; offset: number } | null {
    const containerRect = container.getBoundingClientRect()
    const clientX = containerRect.left + x
    const clientY = containerRect.top + y

    // Use caretPositionFromPoint or caretRangeFromPoint
    if (document.caretPositionFromPoint) {
      const position = document.caretPositionFromPoint(clientX, clientY)
      if (position) {
        return { node: position.offsetNode, offset: position.offset }
      }
    } else if ((document as any).caretRangeFromPoint) {
      const range = (document as any).caretRangeFromPoint(clientX, clientY)
      if (range) {
        return { node: range.startContainer, offset: range.startOffset }
      }
    }

    return null
  }

  /**
   * Add selection change listener
   */
  public addSelectionChangeListener(listener: (selection: TextSelection | null) => void): void {
    this.selectionChangeListeners.push(listener)
  }

  /**
   * Remove selection change listener
   */
  public removeSelectionChangeListener(listener: (selection: TextSelection | null) => void): void {
    const index = this.selectionChangeListeners.indexOf(listener)
    if (index > -1) {
      this.selectionChangeListeners.splice(index, 1)
    }
  }

  /**
   * Notify all listeners of selection change
   */
  private notifySelectionChange(selection: TextSelection | null): void {
    this.selectionChangeListeners.forEach(listener => {
      try {
        listener(selection)
      } catch (error) {
        console.warn('Error in selection change listener:', error)
      }
    })

    // Also call the options callback
    this.options.onSelectionChange?.(selection)
  }

  /**
   * Destroy the service and clean up listeners
   */
  public destroy(): void {
    if (typeof window === 'undefined') return

    document.removeEventListener('selectionchange', this.handleSelectionChange.bind(this))
    document.removeEventListener('mouseup', this.handleMouseUp.bind(this))
    document.removeEventListener('keyup', this.handleKeyUp.bind(this))
    this.selectionChangeListeners = []
    this.currentSelection = null
  }
}

// Export singleton instance (only create on client side)
export const textSelectionService = typeof window !== 'undefined'
  ? new TextSelectionService()
  : null as unknown