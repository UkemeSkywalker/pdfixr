'use client'

import { useState, useCallback } from 'react'
import { AnnotationTool } from '@/components/layout/toolbar'

interface UseToolbarOptions {
  initialTool?: AnnotationTool
  onToolChange?: (tool: AnnotationTool) => void
  onColorChange?: (color: string) => void
}

interface UseToolbarReturn {
  activeTool: AnnotationTool
  selectedColor: string
  history: any[]
  historyIndex: number
  canUndo: boolean
  canRedo: boolean
  zoomLevel: number
  setActiveTool: (tool: AnnotationTool) => void
  setSelectedColor: (color: string) => void
  undo: () => void
  redo: () => void
  addToHistory: (action: any) => void
  zoomIn: () => void
  zoomOut: () => void
  setZoomLevel: (level: number) => void
}

export function useToolbar({
  initialTool = 'select',
  onToolChange,
  onColorChange
}: UseToolbarOptions = {}): UseToolbarReturn {
  const [activeTool, setActiveToolState] = useState<AnnotationTool>(initialTool)
  const [selectedColor, setSelectedColorState] = useState('#ef4444')
  const [history, setHistory] = useState<any[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [zoomLevel, setZoomLevelState] = useState(100)

  const canUndo = historyIndex >= 0
  const canRedo = historyIndex < history.length - 1

  const setActiveTool = useCallback((tool: AnnotationTool) => {
    setActiveToolState(tool)
    onToolChange?.(tool)
  }, [onToolChange])

  const setSelectedColor = useCallback((color: string) => {
    setSelectedColorState(color)
    onColorChange?.(color)
  }, [onColorChange])

  const addToHistory = useCallback((action: any) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1)
      newHistory.push(action)
      return newHistory
    })
    setHistoryIndex(prev => prev + 1)
  }, [historyIndex])

  const undo = useCallback(() => {
    if (canUndo) {
      setHistoryIndex(prev => prev - 1)
      // TODO: Implement actual undo logic based on action type
    }
  }, [canUndo])

  const redo = useCallback(() => {
    if (canRedo) {
      setHistoryIndex(prev => prev + 1)
      // TODO: Implement actual redo logic based on action type
    }
  }, [canRedo])

  const zoomIn = useCallback(() => {
    setZoomLevelState(prev => Math.min(prev + 25, 500))
  }, [])

  const zoomOut = useCallback(() => {
    setZoomLevelState(prev => Math.max(prev - 25, 25))
  }, [])

  const setZoomLevel = useCallback((level: number) => {
    setZoomLevelState(Math.max(25, Math.min(level, 500)))
  }, [])

  return {
    activeTool,
    selectedColor,
    history,
    historyIndex,
    canUndo,
    canRedo,
    zoomLevel,
    setActiveTool,
    setSelectedColor,
    undo,
    redo,
    addToHistory,
    zoomIn,
    zoomOut,
    setZoomLevel
  }
}