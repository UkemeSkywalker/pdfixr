'use client'

import React, { useState, useCallback } from 'react'
import { 
  Highlighter, 
  Underline, 
  Strikethrough, 
  Type, 
  Square, 
  Circle, 
  ArrowRight,
  Pen,
  Undo,
  Redo,
  Palette,
  Settings
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ColorPicker } from '@/components/ui/color-picker'
import { Tooltip } from '@/components/ui/tooltip'
import { cn } from '@/utils/cn'
import { AnnotationTool } from './canvas-overlay'

interface AnnotationToolbarProps {
  selectedTool?: AnnotationTool
  onToolSelect: (tool: AnnotationTool) => void
  onUndo?: () => void
  onRedo?: () => void
  canUndo?: boolean
  canRedo?: boolean
  disabled?: boolean
  className?: string
  orientation?: 'horizontal' | 'vertical'
  showLabels?: boolean
}

interface ToolDefinition {
  type: AnnotationTool['type']
  icon: React.ComponentType<{ className?: string }>
  label: string
  description: string
  category: 'text' | 'shape' | 'drawing'
  shortcut?: string
}

const ANNOTATION_TOOLS: ToolDefinition[] = [
  {
    type: 'highlight',
    icon: Highlighter,
    label: 'Highlight',
    description: 'Highlight selected text',
    category: 'text',
    shortcut: 'H',
  },
  {
    type: 'underline',
    icon: Underline,
    label: 'Underline',
    description: 'Underline selected text',
    category: 'text',
    shortcut: 'U',
  },
  {
    type: 'strikethrough',
    icon: Strikethrough,
    label: 'Strikethrough',
    description: 'Strike through selected text',
    category: 'text',
    shortcut: 'S',
  },
  {
    type: 'note',
    icon: Type,
    label: 'Text Note',
    description: 'Add a text note',
    category: 'text',
    shortcut: 'T',
  },
  {
    type: 'rectangle',
    icon: Square,
    label: 'Rectangle',
    description: 'Draw a rectangle',
    category: 'shape',
    shortcut: 'R',
  },
  {
    type: 'circle',
    icon: Circle,
    label: 'Circle',
    description: 'Draw a circle',
    category: 'shape',
    shortcut: 'C',
  },
  {
    type: 'arrow',
    icon: ArrowRight,
    label: 'Arrow',
    description: 'Draw an arrow',
    category: 'shape',
    shortcut: 'A',
  },
  {
    type: 'freehand',
    icon: Pen,
    label: 'Freehand',
    description: 'Draw freehand',
    category: 'drawing',
    shortcut: 'F',
  },
]

const DEFAULT_COLORS = [
  '#ffff00', // Yellow
  '#ff6b6b', // Red
  '#4ecdc4', // Teal
  '#45b7d1', // Blue
  '#96ceb4', // Green
  '#feca57', // Orange
]

export function AnnotationToolbar({
  selectedTool,
  onToolSelect,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  disabled = false,
  className,
  orientation = 'horizontal',
  showLabels = false,
}: AnnotationToolbarProps) {
  const [currentColor, setCurrentColor] = useState('#ffff00')
  const [strokeWidth, setStrokeWidth] = useState(2)
  const [opacity, setOpacity] = useState(1)
  const [showStyleOptions, setShowStyleOptions] = useState(false)

  // Handle tool selection
  const handleToolSelect = useCallback((toolType: AnnotationTool['type']) => {
    const tool: AnnotationTool = {
      type: toolType,
      color: currentColor,
      strokeWidth,
      opacity,
    }
    onToolSelect(tool)
  }, [currentColor, strokeWidth, opacity, onToolSelect])

  // Handle color change
  const handleColorChange = useCallback((color: string) => {
    setCurrentColor(color)
    if (selectedTool) {
      onToolSelect({
        ...selectedTool,
        color,
      })
    }
  }, [selectedTool, onToolSelect])

  // Handle stroke width change
  const handleStrokeWidthChange = useCallback((width: number) => {
    setStrokeWidth(width)
    if (selectedTool) {
      onToolSelect({
        ...selectedTool,
        strokeWidth: width,
      })
    }
  }, [selectedTool, onToolSelect])

  // Handle opacity change
  const handleOpacityChange = useCallback((newOpacity: number) => {
    setOpacity(newOpacity)
    if (selectedTool) {
      onToolSelect({
        ...selectedTool,
        opacity: newOpacity,
      })
    }
  }, [selectedTool, onToolSelect])

  // Group tools by category
  const textTools = ANNOTATION_TOOLS.filter(tool => tool.category === 'text')
  const shapeTools = ANNOTATION_TOOLS.filter(tool => tool.category === 'shape')
  const drawingTools = ANNOTATION_TOOLS.filter(tool => tool.category === 'drawing')

  // Render tool button
  const renderToolButton = (tool: ToolDefinition) => {
    const isSelected = selectedTool?.type === tool.type
    const Icon = tool.icon

    return (
      <Tooltip key={tool.type} content={`${tool.description}${tool.shortcut ? ` (${tool.shortcut})` : ''}`}>
        <Button
          variant={isSelected ? 'default' : 'outline'}
          size="sm"
          disabled={disabled}
          onClick={() => handleToolSelect(tool.type)}
          className={cn(
            'relative',
            isSelected && 'bg-primary text-primary-foreground',
            orientation === 'vertical' && showLabels && 'justify-start'
          )}
          aria-label={tool.description}
          aria-pressed={isSelected}
        >
          <Icon className={cn('h-4 w-4', showLabels && orientation === 'horizontal' && 'mr-2')} />
          {showLabels && (
            <span className={cn(
              'text-xs',
              orientation === 'vertical' && 'ml-2'
            )}>
              {tool.label}
            </span>
          )}
          {isSelected && (
            <div
              className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full"
              style={{ backgroundColor: currentColor }}
            />
          )}
        </Button>
      </Tooltip>
    )
  }

  // Render tool group
  const renderToolGroup = (tools: ToolDefinition[], title: string) => (
    <div className={cn(
      'flex gap-1',
      orientation === 'vertical' && 'flex-col'
    )}>
      {showLabels && (
        <div className="text-xs font-medium text-muted-foreground px-2 py-1">
          {title}
        </div>
      )}
      <div className={cn(
        'flex gap-1',
        orientation === 'vertical' && 'flex-col'
      )}>
        {tools.map(renderToolButton)}
      </div>
    </div>
  )

  return (
    <div className={cn(
      'flex items-center gap-2 p-2 bg-background border border-border rounded-lg shadow-sm',
      orientation === 'vertical' && 'flex-col items-stretch',
      disabled && 'opacity-50 pointer-events-none',
      className
    )}>
      {/* Text Annotation Tools */}
      {renderToolGroup(textTools, 'Text')}

      {/* Separator */}
      <div className={cn(
        'w-px h-6 bg-border',
        orientation === 'vertical' && 'w-full h-px'
      )} />

      {/* Shape Tools */}
      {renderToolGroup(shapeTools, 'Shapes')}

      {/* Separator */}
      <div className={cn(
        'w-px h-6 bg-border',
        orientation === 'vertical' && 'w-full h-px'
      )} />

      {/* Drawing Tools */}
      {renderToolGroup(drawingTools, 'Drawing')}

      {/* Separator */}
      <div className={cn(
        'w-px h-6 bg-border',
        orientation === 'vertical' && 'w-full h-px'
      )} />

      {/* Style Controls */}
      <div className={cn(
        'flex items-center gap-2',
        orientation === 'vertical' && 'flex-col w-full'
      )}>
        {/* Color Picker */}
        <ColorPicker
          value={currentColor}
          onChange={handleColorChange}
          presetColors={DEFAULT_COLORS}
          disabled={disabled}
          size="sm"
        />

        {/* Style Options Toggle */}
        <Tooltip content="Style options">
          <Button
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={() => setShowStyleOptions(!showStyleOptions)}
            className={cn(showStyleOptions && 'bg-muted')}
            aria-label="Toggle style options"
            aria-expanded={showStyleOptions}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </Tooltip>
      </div>

      {/* Separator */}
      <div className={cn(
        'w-px h-6 bg-border',
        orientation === 'vertical' && 'w-full h-px'
      )} />

      {/* Undo/Redo Controls */}
      <div className={cn(
        'flex items-center gap-1',
        orientation === 'vertical' && 'flex-col w-full'
      )}>
        <Tooltip content="Undo (Ctrl+Z)">
          <Button
            variant="outline"
            size="sm"
            disabled={disabled || !canUndo}
            onClick={onUndo}
            aria-label="Undo last action"
          >
            <Undo className="h-4 w-4" />
          </Button>
        </Tooltip>
        <Tooltip content="Redo (Ctrl+Y)">
          <Button
            variant="outline"
            size="sm"
            disabled={disabled || !canRedo}
            onClick={onRedo}
            aria-label="Redo last action"
          >
            <Redo className="h-4 w-4" />
          </Button>
        </Tooltip>
      </div>

      {/* Extended Style Options */}
      {showStyleOptions && (
        <div className={cn(
          'absolute top-full left-0 mt-2 p-3 bg-popover border border-border rounded-md shadow-lg z-50 min-w-[250px]',
          orientation === 'vertical' && 'left-full top-0 ml-2'
        )}>
          <div className="space-y-3">
            {/* Stroke Width */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Stroke Width: {strokeWidth}px
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={strokeWidth}
                onChange={(e) => handleStrokeWidthChange(parseInt(e.target.value, 10))}
                className="w-full"
                disabled={disabled}
              />
            </div>

            {/* Opacity */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Opacity: {Math.round(opacity * 100)}%
              </label>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.1"
                value={opacity}
                onChange={(e) => handleOpacityChange(parseFloat(e.target.value))}
                className="w-full"
                disabled={disabled}
              />
            </div>

            {/* Close Button */}
            <div className="flex justify-end pt-2 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowStyleOptions(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}