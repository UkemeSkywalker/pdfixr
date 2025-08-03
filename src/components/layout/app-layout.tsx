'use client'

import React, { useState } from 'react'
import { Header } from './header'
import { Toolbar, AnnotationTool } from './toolbar'
import { Sidebar } from './sidebar'
import { useToolbar } from '@/hooks/use-toolbar'
import { useSidebar } from '@/hooks/use-sidebar'
import { cn } from '@/utils/cn'

interface AppLayoutProps {
  children: React.ReactNode
  className?: string
}

// Mock data for demonstration
const mockPages = [
  {
    id: '1',
    pageNumber: 1,
    thumbnail: undefined,
    width: 612,
    height: 792
  },
  {
    id: '2',
    pageNumber: 2,
    thumbnail: undefined,
    width: 612,
    height: 792
  }
]

const mockAnnotations = [
  {
    id: 'ann1',
    type: 'highlight' as const,
    pageNumber: 1,
    visible: true,
    color: '#ef4444',
    content: 'Sample highlight'
  },
  {
    id: 'ann2',
    type: 'note' as const,
    pageNumber: 1,
    visible: true,
    content: 'Sample note'
  }
]

export function AppLayout({ children, className }: AppLayoutProps) {
  const [currentFile, setCurrentFile] = useState<File | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedAnnotation, setSelectedAnnotation] = useState<string>()

  const {
    activeTool,
    selectedColor,
    canUndo,
    canRedo,
    zoomLevel,
    setActiveTool,
    setSelectedColor,
    undo,
    redo,
    zoomIn,
    zoomOut
  } = useToolbar({
    initialTool: 'select',
    onToolChange: (tool) => console.log('Tool changed:', tool),
    onColorChange: (color) => console.log('Color changed:', color)
  })

  const {
    isCollapsed,
    isMobile,
    toggleCollapse
  } = useSidebar()

  const handleFileUpload = (file: File) => {
    setCurrentFile(file)
    console.log('File uploaded:', file.name)
  }

  const handleSave = () => {
    console.log('Save clicked')
  }

  const handleExport = () => {
    console.log('Export clicked')
  }

  const handleError = (error: string) => {
    console.error('Error:', error)
  }

  const handlePageSelect = (pageNumber: number) => {
    setCurrentPage(pageNumber)
    console.log('Page selected:', pageNumber)
  }

  const handleAnnotationToggle = (annotationId: string) => {
    console.log('Annotation toggle:', annotationId)
  }

  const handleAnnotationDelete = (annotationId: string) => {
    console.log('Annotation delete:', annotationId)
  }

  const handleAnnotationSelect = (annotationId: string) => {
    setSelectedAnnotation(annotationId)
    console.log('Annotation selected:', annotationId)
  }

  return (
    <div className={cn('min-h-screen bg-background', className)}>
      {/* Header */}
      <Header
        onFileUpload={handleFileUpload}
        onSave={handleSave}
        onExport={handleExport}
        onError={handleError}
        isFileLoaded={!!currentFile}
        fileName={currentFile?.name}
      />

      {/* Main Content Area */}
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar */}
        <Sidebar
          isCollapsed={isCollapsed}
          onToggleCollapse={toggleCollapse}
          pages={currentFile ? mockPages : []}
          annotations={currentFile ? mockAnnotations : []}
          currentPage={currentPage}
          onPageSelect={handlePageSelect}
          onAnnotationToggle={handleAnnotationToggle}
          onAnnotationDelete={handleAnnotationDelete}
          selectedAnnotation={selectedAnnotation}
          onAnnotationSelect={handleAnnotationSelect}
          isMobile={isMobile}
        />

        {/* Main Content */}
        <div className="flex-1 relative">
          {children}
          
          {/* Floating Toolbar - only show when file is loaded */}
          {currentFile && (
            <Toolbar
              activeTool={activeTool}
              onToolChange={setActiveTool}
              onUndo={undo}
              onRedo={redo}
              onZoomIn={zoomIn}
              onZoomOut={zoomOut}
              onExport={handleExport}
              onColorChange={setSelectedColor}
              canUndo={canUndo}
              canRedo={canRedo}
              zoomLevel={zoomLevel}
              position="top"
              isFloating={true}
            />
          )}
        </div>
      </div>
    </div>
  )
}