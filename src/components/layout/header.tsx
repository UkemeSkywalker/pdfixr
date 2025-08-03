'use client'

import { FileText, Upload, Download, Save, Settings, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { useFileUpload } from '@/hooks/use-file-upload'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { cn } from '@/utils/cn'

interface HeaderProps {
  onFileUpload?: (file: File) => void
  onSave?: () => void
  onExport?: () => void
  onError?: (error: string) => void
  className?: string
  isFileLoaded?: boolean
  fileName?: string
}

export function Header({ 
  onFileUpload, 
  onSave, 
  onExport, 
  onError,
  className,
  isFileLoaded = false,
  fileName 
}: HeaderProps) {
  const {
    isDragOver,
    isUploading,
    handleDrop,
    handleDragOver,
    handleDragLeave,
    handleFileInputChange
  } = useFileUpload({
    acceptedTypes: ['application/pdf'],
    maxSize: 100 * 1024 * 1024, // 100MB
    onSuccess: onFileUpload,
    onError
  })

  return (
    <>
      <header 
        className={cn(
          "sticky top-0 z-50 w-full border-b-2 border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
          className
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="container flex h-16 items-center justify-between px-4">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <FileText className="h-5 w-5" />
              </div>
              <h1 className="text-xl font-bold text-foreground">PDFixr</h1>
            </div>
            {fileName && (
              <div className="hidden sm:flex items-center space-x-2 ml-4">
                <span className="text-sm text-muted-foreground">•</span>
                <span className="text-sm font-medium text-foreground truncate max-w-48">
                  {fileName}
                </span>
              </div>
            )}
          </div>

          {/* File Actions */}
          <div className="flex items-center space-x-2">
            {/* Upload Button */}
            <div className="relative">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileInputChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                id="file-upload"
              />
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "relative transition-colors",
                  isDragOver && "border-primary bg-primary/10",
                  isUploading && "opacity-50 cursor-not-allowed"
                )}
                disabled={isUploading}
                asChild
              >
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className={cn("h-4 w-4 mr-2", isUploading && "animate-spin")} />
                  {isUploading ? 'Uploading...' : 'Upload PDF'}
                </label>
              </Button>
            </div>

            {/* Save Button - only show when file is loaded */}
            {isFileLoaded && (
              <Button
                variant="outline"
                size="sm"
                onClick={onSave}
                className="hidden sm:flex"
              >
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            )}

            {/* Export Button - only show when file is loaded */}
            {isFileLoaded && (
              <Button
                variant="outline"
                size="sm"
                onClick={onExport}
                className="hidden sm:flex"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            )}

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* User Menu */}
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                  <User className="h-4 w-4" />
                  <span className="sr-only">User menu</span>
                </Button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  className="z-50 min-w-[12rem] overflow-hidden rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95"
                  align="end"
                  sideOffset={4}
                >
                  <DropdownMenu.Item
                    className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Preferences</span>
                  </DropdownMenu.Item>
                  <DropdownMenu.Separator className="my-1 h-px bg-border" />
                  <DropdownMenu.Item
                    className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                  >
                    <span>About PDFixr</span>
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>
        </div>
      </header>

      {/* Drag overlay */}
      {isDragOver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="rounded-lg border-2 border-dashed border-primary bg-primary/10 p-8 text-center">
            <Upload className="mx-auto h-12 w-12 text-primary mb-4" />
            <p className="text-lg font-medium text-foreground">Drop your PDF file here</p>
            <p className="text-sm text-muted-foreground mt-2">Only PDF files are supported</p>
          </div>
        </div>
      )}
    </>
  )
}