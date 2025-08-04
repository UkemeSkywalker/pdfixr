'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { X, Edit3, Check, MoreVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/utils/cn'
import { AnnotationData } from '@/types'

interface TextNoteProps {
  annotation: AnnotationData
  scale: number
  isSelected?: boolean
  isEditing?: boolean
  onUpdate?: (annotation: AnnotationData) => void
  onDelete?: (annotationId: string) => void
  onStartEdit?: () => void
  onEndEdit?: () => void
  onSelect?: () => void
  className?: string
  disabled?: boolean
}

export function TextNote({
  annotation,
  scale,
  isSelected = false,
  isEditing = false,
  onUpdate,
  onDelete,
  onStartEdit,
  onEndEdit,
  onSelect,
  className,
  disabled = false,
}: TextNoteProps) {
  const [content, setContent] = useState(annotation.content || '')
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [showMenu, setShowMenu] = useState(false)
  
  const noteRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMenu])

  // Handle content change
  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent)
  }, [])

  // Handle save
  const handleSave = useCallback(() => {
    if (!onUpdate) return

    const updatedAnnotation: AnnotationData = {
      ...annotation,
      content: content.trim(),
      updatedAt: new Date(),
    }

    onUpdate(updatedAnnotation)
    onEndEdit?.()
  }, [annotation, content, onUpdate, onEndEdit])

  // Handle cancel
  const handleCancel = useCallback(() => {
    setContent(annotation.content || '')
    onEndEdit?.()
  }, [annotation.content, onEndEdit])

  // Handle delete
  const handleDelete = useCallback(() => {
    if (!onDelete) return
    onDelete(annotation.id)
    setShowMenu(false)
  }, [annotation.id, onDelete])

  // Handle mouse down for dragging
  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    if (disabled || isEditing) return

    event.preventDefault()
    event.stopPropagation()

    const rect = noteRef.current?.getBoundingClientRect()
    if (!rect) return

    setIsDragging(true)
    setDragOffset({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    })

    onSelect?.()
  }, [disabled, isEditing, onSelect])

  // Handle mouse move for dragging
  useEffect(() => {
    if (!isDragging || disabled) return

    const handleMouseMove = (event: MouseEvent) => {
      if (!noteRef.current || !onUpdate) return

      const container = noteRef.current.parentElement
      if (!container) return

      const containerRect = container.getBoundingClientRect()
      const newX = (event.clientX - containerRect.left - dragOffset.x) / scale
      const newY = (event.clientY - containerRect.top - dragOffset.y) / scale

      const updatedAnnotation: AnnotationData = {
        ...annotation,
        coordinates: {
          ...annotation.coordinates,
          x: Math.max(0, newX),
          y: Math.max(0, newY),
        },
        updatedAt: new Date(),
      }

      onUpdate(updatedAnnotation)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, dragOffset, scale, annotation, onUpdate, disabled])

  // Handle keyboard events
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSave()
    } else if (event.key === 'Escape') {
      event.preventDefault()
      handleCancel()
    }
  }, [handleSave, handleCancel])

  // Handle double-click to start editing
  const handleDoubleClick = useCallback((event: React.MouseEvent) => {
    if (disabled) return
    event.preventDefault()
    event.stopPropagation()
    onStartEdit?.()
  }, [disabled, onStartEdit])

  // Calculate note position and size
  const noteStyle = {
    left: annotation.coordinates.x * scale,
    top: annotation.coordinates.y * scale,
    fontSize: (annotation.style.fontSize || 14) * scale,
    color: annotation.style.color,
    opacity: annotation.style.opacity,
  }

  // Render editing mode
  if (isEditing) {
    return (
      <div
        ref={noteRef}
        className={cn(
          'absolute bg-yellow-100 dark:bg-yellow-900/50 border-2 border-yellow-400 rounded-md p-2 min-w-32 shadow-lg z-10',
          className
        )}
        style={noteStyle}
      >
        <div className="flex items-center gap-1 mb-1">
          <Input
            ref={inputRef}
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter note text..."
            className="text-xs h-6 bg-transparent border-none p-0 focus:ring-0"
            style={{ color: annotation.style.color }}
          />
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleSave}
            className="h-5 w-5 p-0 text-green-600 hover:text-green-700"
            disabled={!content.trim()}
          >
            <Check className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCancel}
            className="h-5 w-5 p-0 text-red-600 hover:text-red-700"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    )
  }

  // Render display mode
  return (
    <div
      ref={noteRef}
      className={cn(
        'absolute bg-yellow-100 dark:bg-yellow-900/50 border rounded-md p-2 min-w-24 max-w-48 shadow-md cursor-move select-none',
        isSelected && 'border-blue-500 border-2',
        !isSelected && 'border-yellow-400',
        isDragging && 'cursor-grabbing',
        disabled && 'cursor-default',
        className
      )}
      style={noteStyle}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      onClick={onSelect}
    >
      {/* Note Content */}
      <div className="text-xs break-words" style={{ color: annotation.style.color }}>
        {annotation.content || 'Empty note'}
      </div>

      {/* Note Actions */}
      {isSelected && !disabled && (
        <div className="absolute -top-2 -right-2">
          <div className="relative">
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation()
                setShowMenu(!showMenu)
              }}
              className="h-6 w-6 p-0 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
            >
              <MoreVertical className="h-3 w-3" />
            </Button>

            {/* Context Menu */}
            {showMenu && (
              <div
                ref={menuRef}
                className="absolute top-full right-0 mt-1 bg-popover border border-border rounded-md shadow-lg z-20 min-w-24"
              >
                <div className="py-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onStartEdit?.()
                      setShowMenu(false)
                    }}
                    className="flex items-center gap-2 w-full px-3 py-1 text-xs hover:bg-muted text-left"
                  >
                    <Edit3 className="h-3 w-3" />
                    Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete()
                    }}
                    className="flex items-center gap-2 w-full px-3 py-1 text-xs hover:bg-muted text-destructive text-left"
                  >
                    <X className="h-3 w-3" />
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Resize Handle */}
      {isSelected && !disabled && (
        <div className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 rounded-tl-md cursor-se-resize opacity-50 hover:opacity-100" />
      )}
    </div>
  )
}