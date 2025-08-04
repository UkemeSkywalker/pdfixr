'use client'

import { AnnotationData } from '@/types'

/**
 * Annotation History Service
 * Manages undo/redo functionality for annotation operations
 */

export interface HistoryState {
  annotations: AnnotationData[]
  timestamp: Date
  action: HistoryAction
}

export interface HistoryAction {
  type: 'add' | 'update' | 'delete' | 'batch'
  description: string
  annotationIds: string[]
}

export interface HistoryOptions {
  maxHistorySize?: number
  debounceTime?: number
}

export class AnnotationHistoryService {
  private undoStack: HistoryState[] = []
  private redoStack: HistoryState[] = []
  private currentState: AnnotationData[] = []
  private options: Required<HistoryOptions>
  private debounceTimer: NodeJS.Timeout | null = null

  constructor(options: HistoryOptions = {}) {
    this.options = {
      maxHistorySize: 50,
      debounceTime: 300,
      ...options,
    }
  }

  /**
   * Initialize with current annotations
   */
  public initialize(annotations: AnnotationData[]): void {
    this.currentState = [...annotations]
    this.undoStack = []
    this.redoStack = []
  }

  /**
   * Save current state to history
   */
  public saveState(
    annotations: AnnotationData[],
    action: HistoryAction,
    debounce: boolean = false
  ): void {
    if (debounce) {
      this.debouncedSaveState(annotations, action)
      return
    }

    // Don't save if state hasn't changed
    if (this.areAnnotationsEqual(this.currentState, annotations)) {
      return
    }

    // Save current state to undo stack
    const historyState: HistoryState = {
      annotations: [...this.currentState],
      timestamp: new Date(),
      action,
    }

    this.undoStack.push(historyState)

    // Limit undo stack size
    if (this.undoStack.length > this.options.maxHistorySize) {
      this.undoStack.shift()
    }

    // Clear redo stack when new action is performed
    this.redoStack = []

    // Update current state
    this.currentState = [...annotations]
  }

  /**
   * Debounced save state for rapid changes
   */
  private debouncedSaveState(annotations: AnnotationData[], action: HistoryAction): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
    }

    this.debounceTimer = setTimeout(() => {
      this.saveState(annotations, action, false)
      this.debounceTimer = null
    }, this.options.debounceTime)
  }

  /**
   * Undo last action
   */
  public undo(): AnnotationData[] | null {
    if (this.undoStack.length === 0) {
      return null
    }

    const previousState = this.undoStack.pop()!
    
    // Save current state to redo stack
    const redoState: HistoryState = {
      annotations: [...this.currentState],
      timestamp: new Date(),
      action: {
        type: 'batch',
        description: `Redo: ${previousState.action.description}`,
        annotationIds: previousState.action.annotationIds,
      },
    }

    this.redoStack.push(redoState)

    // Limit redo stack size
    if (this.redoStack.length > this.options.maxHistorySize) {
      this.redoStack.shift()
    }

    // Restore previous state
    this.currentState = [...previousState.annotations]
    
    return this.currentState
  }

  /**
   * Redo last undone action
   */
  public redo(): AnnotationData[] | null {
    if (this.redoStack.length === 0) {
      return null
    }

    const nextState = this.redoStack.pop()!
    
    // Save current state to undo stack
    const undoState: HistoryState = {
      annotations: [...this.currentState],
      timestamp: new Date(),
      action: {
        type: 'batch',
        description: `Undo: ${nextState.action.description}`,
        annotationIds: nextState.action.annotationIds,
      },
    }

    this.undoStack.push(undoState)

    // Restore next state
    this.currentState = [...nextState.annotations]
    
    return this.currentState
  }

  /**
   * Check if undo is available
   */
  public canUndo(): boolean {
    return this.undoStack.length > 0
  }

  /**
   * Check if redo is available
   */
  public canRedo(): boolean {
    return this.redoStack.length > 0
  }

  /**
   * Get undo stack size
   */
  public getUndoStackSize(): number {
    return this.undoStack.length
  }

  /**
   * Get redo stack size
   */
  public getRedoStackSize(): number {
    return this.redoStack.length
  }

  /**
   * Get last action description
   */
  public getLastActionDescription(): string | null {
    if (this.undoStack.length === 0) return null
    return this.undoStack[this.undoStack.length - 1].action.description
  }

  /**
   * Get next action description (for redo)
   */
  public getNextActionDescription(): string | null {
    if (this.redoStack.length === 0) return null
    return this.redoStack[this.redoStack.length - 1].action.description
  }

  /**
   * Clear all history
   */
  public clearHistory(): void {
    this.undoStack = []
    this.redoStack = []
    
    // Clear debounce timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
      this.debounceTimer = null
    }
  }

  /**
   * Get history statistics
   */
  public getHistoryStats(): {
    undoCount: number
    redoCount: number
    totalActions: number
    memoryUsage: number
  } {
    const totalActions = this.undoStack.length + this.redoStack.length
    
    // Rough memory usage calculation (in KB)
    const avgAnnotationSize = 500 // bytes
    const memoryUsage = Math.round(
      (totalActions * avgAnnotationSize * this.currentState.length) / 1024
    )

    return {
      undoCount: this.undoStack.length,
      redoCount: this.redoStack.length,
      totalActions,
      memoryUsage,
    }
  }

  /**
   * Export history for debugging
   */
  public exportHistory(): {
    undoStack: HistoryState[]
    redoStack: HistoryState[]
    currentState: AnnotationData[]
  } {
    return {
      undoStack: [...this.undoStack],
      redoStack: [...this.redoStack],
      currentState: [...this.currentState],
    }
  }

  /**
   * Create action for adding annotation
   */
  public static createAddAction(annotation: AnnotationData): HistoryAction {
    return {
      type: 'add',
      description: `Add ${annotation.type}`,
      annotationIds: [annotation.id],
    }
  }

  /**
   * Create action for updating annotation
   */
  public static createUpdateAction(annotation: AnnotationData): HistoryAction {
    return {
      type: 'update',
      description: `Update ${annotation.type}`,
      annotationIds: [annotation.id],
    }
  }

  /**
   * Create action for deleting annotation
   */
  public static createDeleteAction(annotation: AnnotationData): HistoryAction {
    return {
      type: 'delete',
      description: `Delete ${annotation.type}`,
      annotationIds: [annotation.id],
    }
  }

  /**
   * Create action for batch operations
   */
  public static createBatchAction(
    description: string,
    annotationIds: string[]
  ): HistoryAction {
    return {
      type: 'batch',
      description,
      annotationIds,
    }
  }

  /**
   * Compare two annotation arrays for equality
   */
  private areAnnotationsEqual(a: AnnotationData[], b: AnnotationData[]): boolean {
    if (a.length !== b.length) return false

    // Sort by ID for consistent comparison
    const sortedA = [...a].sort((x, y) => x.id.localeCompare(y.id))
    const sortedB = [...b].sort((x, y) => x.id.localeCompare(y.id))

    for (let i = 0; i < sortedA.length; i++) {
      if (!this.areAnnotationsDeepEqual(sortedA[i], sortedB[i])) {
        return false
      }
    }

    return true
  }

  /**
   * Deep compare two annotations
   */
  private areAnnotationsDeepEqual(a: AnnotationData, b: AnnotationData): boolean {
    // Compare basic properties
    if (
      a.id !== b.id ||
      a.type !== b.type ||
      a.pageNumber !== b.pageNumber ||
      a.content !== b.content
    ) {
      return false
    }

    // Compare coordinates
    const coordsA = a.coordinates
    const coordsB = b.coordinates
    if (
      coordsA.x !== coordsB.x ||
      coordsA.y !== coordsB.y ||
      coordsA.width !== coordsB.width ||
      coordsA.height !== coordsB.height
    ) {
      return false
    }

    // Compare points array if present
    if (coordsA.points || coordsB.points) {
      if (!coordsA.points || !coordsB.points) return false
      if (coordsA.points.length !== coordsB.points.length) return false
      for (let i = 0; i < coordsA.points.length; i++) {
        if (coordsA.points[i] !== coordsB.points[i]) return false
      }
    }

    // Compare style
    const styleA = a.style
    const styleB = b.style
    if (
      styleA.color !== styleB.color ||
      styleA.strokeWidth !== styleB.strokeWidth ||
      styleA.opacity !== styleB.opacity ||
      styleA.fontSize !== styleB.fontSize
    ) {
      return false
    }

    return true
  }

  /**
   * Destroy the service and clean up
   */
  public destroy(): void {
    this.clearHistory()
    this.currentState = []
  }
}

// Export singleton instance
export const annotationHistoryService = new AnnotationHistoryService()