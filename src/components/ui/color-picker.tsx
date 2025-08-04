'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from './button'
import { cn } from '@/utils/cn'

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
  presetColors?: string[]
  showAlpha?: boolean
  disabled?: boolean
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const DEFAULT_PRESET_COLORS = [
  '#ffff00', // Yellow
  '#ff6b6b', // Red
  '#4ecdc4', // Teal
  '#45b7d1', // Blue
  '#96ceb4', // Green
  '#feca57', // Orange
  '#ff9ff3', // Pink
  '#54a0ff', // Light Blue
  '#5f27cd', // Purple
  '#00d2d3', // Cyan
  '#ff9f43', // Amber
  '#10ac84', // Emerald
  '#ee5a24', // Dark Orange
  '#0984e3', // Dark Blue
  '#6c5ce7', // Violet
  '#a29bfe', // Light Purple
]

export function ColorPicker({
  value,
  onChange,
  presetColors = DEFAULT_PRESET_COLORS,
  showAlpha = false,
  disabled = false,
  className,
  size = 'md',
}: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [customColor, setCustomColor] = useState(value)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false)
        buttonRef.current?.focus()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const handleColorSelect = (color: string) => {
    onChange(color)
    setCustomColor(color)
    setIsOpen(false)
  }

  const handleCustomColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = event.target.value
    setCustomColor(newColor)
    onChange(newColor)
  }

  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  }

  const gridSizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  }

  return (
    <div className={cn('relative', className)}>
      {/* Color Preview Button */}
      <Button
        ref={buttonRef}
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'p-1 border-2',
          sizeClasses[size]
        )}
        aria-label="Select color"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div
          className="w-full h-full rounded-sm border border-border"
          style={{ backgroundColor: value }}
        />
      </Button>

      {/* Color Picker Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 mt-2 p-3 bg-popover border border-border rounded-md shadow-lg z-50 min-w-[200px]"
          role="dialog"
          aria-label="Color picker"
        >
          {/* Preset Colors Grid */}
          <div className="mb-3">
            <h4 className="text-sm font-medium mb-2 text-foreground">Preset Colors</h4>
            <div className="grid grid-cols-8 gap-1">
              {presetColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={cn(
                    'rounded border-2 transition-all hover:scale-110 focus:scale-110 focus:outline-none focus:ring-2 focus:ring-ring',
                    gridSizeClasses[size],
                    value === color ? 'border-foreground' : 'border-border'
                  )}
                  style={{ backgroundColor: color }}
                  onClick={() => handleColorSelect(color)}
                  aria-label={`Select color ${color}`}
                  title={color}
                />
              ))}
            </div>
          </div>

          {/* Custom Color Input */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-foreground">Custom Color</h4>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={customColor}
                onChange={handleCustomColorChange}
                className="w-8 h-8 rounded border border-border cursor-pointer"
                aria-label="Custom color picker"
              />
              <input
                type="text"
                value={customColor}
                onChange={(e) => {
                  setCustomColor(e.target.value)
                  // Validate hex color before applying
                  if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
                    onChange(e.target.value)
                  }
                }}
                className="flex-1 px-2 py-1 text-sm border border-border rounded bg-background text-foreground"
                placeholder="#000000"
                pattern="^#[0-9A-F]{6}$"
                aria-label="Custom color hex value"
              />
            </div>
          </div>

          {/* Alpha Slider (if enabled) */}
          {showAlpha && (
            <div className="mt-3 space-y-2">
              <h4 className="text-sm font-medium text-foreground">Opacity</h4>
              <input
                type="range"
                min="0"
                max="100"
                defaultValue="100"
                className="w-full"
                aria-label="Color opacity"
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 mt-3 pt-2 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => {
                onChange(customColor)
                setIsOpen(false)
              }}
            >
              Apply
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}