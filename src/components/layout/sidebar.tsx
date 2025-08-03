'use client'

import React, { useState, useCallback } from 'react'
import { 
  ChevronLeft, 
  ChevronRight, 
  FileText, 
  Layers, 
  Settings,
  Eye,
  EyeOff,
  Trash2,
  MoreVertical
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils/cn'
import * as Tooltip from '@radix-ui/react-tooltip'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'

interface PDFPage {
  id: string
  pageNumber: number
  thumbnail?: string
  width: number
  height: number
}

interface Annotation {
  id: string
  type: 'highlight' | 'underline' | 'strikethrough' | 'note' | 'shape' | 'text' | 'image'
  pageNumber: number
  visible: boolean
  color?: string
  content?: string
}

interface SidebarProps {
  isCollapsed?: boolean
  onToggleCollapse?: () => void
  pages?: PDFPage[]
  annotations?: Annotation[]
  currentPage?: number
  onPageSelect?: (pageNumber: number) => void
  onAnnotationToggle?: (annotationId: string) => void
  onAnnotationDelete?: (annotationId: string) => void
  selectedAnnotation?: string
  onAnnotationSelect?: (annotationId: string) => void
  className?: string
  isMobile?: boolean
}

type SidebarTab = 'pages' | 'layers' | 'properties'

export function Sidebar({
  isCollapsed = false,
  onToggleCollapse,
  pages = [],
  annotations = [],
  currentPage = 1,
  onPageSelect,
  onAnnotationToggle,
  onAnnotationDelete,
  selectedAnnotation,
  onAnnotationSelect,
  className,
  isMobile = false
}: SidebarProps) {
  const [activeTab, setActiveTab] = useState<SidebarTab>('pages')

  const handlePageSelect = useCallback((pageNumber: number) => {
    onPageSelect?.(pageNumber)
  }, [onPageSelect])

  const handleAnnotationToggle = useCallback((annotationId: string) => {
    onAnnotationToggle?.(annotationId)
  }, [onAnnotationToggle])

  const handleAnnotationDelete = useCallback((annotationId: string) => {
    onAnnotationDelete?.(annotationId)
  }, [onAnnotationDelete])

  const handleAnnotationSelect = useCallback((annotationId: string) => {
    onAnnotationSelect?.(annotationId)
  }, [onAnnotationSelect])

  const getAnnotationIcon = (type: Annotation['type']) => {
    switch (type) {
      case 'highlight':
        return '🖍️'
      case 'underline':
        return '📝'
      case 'strikethrough':
        return '❌'
      case 'note':
        return '📝'
      case 'shape':
        return '🔷'
      case 'text':
        return '📄'
      case 'image':
        return '🖼️'
      default:
        return '📌'
    }
  }

  const currentPageAnnotations = annotations.filter(
    annotation => annotation.pageNumber === currentPage
  )

  if (isMobile && isCollapsed) {
    return null
  }

  return (
    <div
      className={cn(
        'flex flex-col bg-surface border-r-2 border-border transition-all duration-300 ease-in-out',
        isCollapsed ? 'w-12' : 'w-80',
        isMobile && 'fixed left-0 top-16 bottom-0 z-30 shadow-lg',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <div className="flex rounded-lg bg-muted p-1">
              <Button
                variant={activeTab === 'pages' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('pages')}
                className="h-7 px-2 text-xs"
              >
                <FileText className="h-3 w-3 mr-1" />
                Pages
              </Button>
              <Button
                variant={activeTab === 'layers' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('layers')}
                className="h-7 px-2 text-xs"
              >
                <Layers className="h-3 w-3 mr-1" />
                Layers
              </Button>
              <Button
                variant={activeTab === 'properties' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('properties')}
                className="h-7 px-2 text-xs"
              >
                <Settings className="h-3 w-3 mr-1" />
                Properties
              </Button>
            </div>
          </div>
        )}
        
        <Tooltip.Provider>
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleCollapse}
                className="h-8 w-8 p-0"
              >
                {isCollapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
                <span className="sr-only">
                  {isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                </span>
              </Button>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content
                className="z-50 overflow-hidden rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground animate-in fade-in-0 zoom-in-95"
                side="right"
                sideOffset={5}
              >
                {isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                <Tooltip.Arrow className="fill-primary" />
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Provider>
      </div>

      {/* Content */}
      {!isCollapsed && (
        <div className="flex-1 overflow-hidden">
          {/* Pages Tab */}
          {activeTab === 'pages' && (
            <div className="h-full overflow-y-auto p-3">
              <div className="space-y-2">
                {pages.map((page) => (
                  <div
                    key={page.id}
                    className={cn(
                      'group relative rounded-lg border-2 cursor-pointer transition-all hover:shadow-md',
                      currentPage === page.pageNumber
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    )}
                    onClick={() => handlePageSelect(page.pageNumber)}
                  >
                    <div className="aspect-[3/4] p-2">
                      {page.thumbnail ? (
                        <img
                          src={page.thumbnail}
                          alt={`Page ${page.pageNumber}`}
                          className="w-full h-full object-contain rounded bg-white"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted rounded flex items-center justify-center">
                          <FileText className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="absolute bottom-1 left-1 right-1 bg-background/90 backdrop-blur-sm rounded px-2 py-1">
                      <p className="text-xs font-medium text-center">
                        Page {page.pageNumber}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              {pages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                  <FileText className="h-8 w-8 mb-2" />
                  <p className="text-sm">No pages available</p>
                </div>
              )}
            </div>
          )}

          {/* Layers Tab */}
          {activeTab === 'layers' && (
            <div className="h-full overflow-y-auto p-3">
              <div className="space-y-1">
                {annotations.map((annotation) => (
                  <div
                    key={annotation.id}
                    className={cn(
                      'group flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors',
                      selectedAnnotation === annotation.id
                        ? 'bg-primary/10 border border-primary/20'
                        : 'hover:bg-muted'
                    )}
                    onClick={() => handleAnnotationSelect(annotation.id)}
                  >
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <span className="text-sm">
                        {getAnnotationIcon(annotation.type)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {annotation.type.charAt(0).toUpperCase() + annotation.type.slice(1)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Page {annotation.pageNumber}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleAnnotationToggle(annotation.id)
                        }}
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        {annotation.visible ? (
                          <Eye className="h-3 w-3" />
                        ) : (
                          <EyeOff className="h-3 w-3" />
                        )}
                        <span className="sr-only">
                          {annotation.visible ? 'Hide' : 'Show'} annotation
                        </span>
                      </Button>
                      
                      <DropdownMenu.Root>
                        <DropdownMenu.Trigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-3 w-3" />
                            <span className="sr-only">More options</span>
                          </Button>
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Portal>
                          <DropdownMenu.Content
                            className="z-50 min-w-[8rem] overflow-hidden rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95"
                            align="end"
                            sideOffset={4}
                          >
                            <DropdownMenu.Item
                              className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                              onClick={() => handleAnnotationDelete(annotation.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              <span>Delete</span>
                            </DropdownMenu.Item>
                          </DropdownMenu.Content>
                        </DropdownMenu.Portal>
                      </DropdownMenu.Root>
                    </div>
                  </div>
                ))}
              </div>
              
              {annotations.length === 0 && (
                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                  <Layers className="h-8 w-8 mb-2" />
                  <p className="text-sm">No annotations</p>
                </div>
              )}
            </div>
          )}

          {/* Properties Tab */}
          {activeTab === 'properties' && (
            <div className="h-full overflow-y-auto p-3">
              {selectedAnnotation ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium mb-2">Annotation Properties</h3>
                    <div className="space-y-2">
                      <div>
                        <label className="text-xs text-muted-foreground">Type</label>
                        <p className="text-sm">
                          {annotations.find(a => a.id === selectedAnnotation)?.type}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Page</label>
                        <p className="text-sm">
                          {annotations.find(a => a.id === selectedAnnotation)?.pageNumber}
                        </p>
                      </div>
                      {annotations.find(a => a.id === selectedAnnotation)?.color && (
                        <div>
                          <label className="text-xs text-muted-foreground">Color</label>
                          <div className="flex items-center space-x-2">
                            <div
                              className="w-4 h-4 rounded border"
                              style={{
                                backgroundColor: annotations.find(a => a.id === selectedAnnotation)?.color
                              }}
                            />
                            <p className="text-sm">
                              {annotations.find(a => a.id === selectedAnnotation)?.color}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : currentPageAnnotations.length > 0 ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium mb-2">Page {currentPage} Annotations</h3>
                    <p className="text-xs text-muted-foreground mb-3">
                      {currentPageAnnotations.length} annotation{currentPageAnnotations.length !== 1 ? 's' : ''}
                    </p>
                    <div className="space-y-2">
                      {currentPageAnnotations.map((annotation) => (
                        <div
                          key={annotation.id}
                          className="p-2 rounded border cursor-pointer hover:bg-muted"
                          onClick={() => handleAnnotationSelect(annotation.id)}
                        >
                          <p className="text-sm font-medium">
                            {annotation.type.charAt(0).toUpperCase() + annotation.type.slice(1)}
                          </p>
                          {annotation.content && (
                            <p className="text-xs text-muted-foreground truncate">
                              {annotation.content}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                  <Settings className="h-8 w-8 mb-2" />
                  <p className="text-sm">Select an annotation</p>
                  <p className="text-xs">to view properties</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Collapsed state icons */}
      {isCollapsed && (
        <div className="flex flex-col items-center py-3 space-y-2">
          <Tooltip.Provider>
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => {
                    setActiveTab('pages')
                    onToggleCollapse?.()
                  }}
                >
                  <FileText className="h-4 w-4" />
                  <span className="sr-only">Pages</span>
                </Button>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content
                  className="z-50 overflow-hidden rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground animate-in fade-in-0 zoom-in-95"
                  side="right"
                  sideOffset={5}
                >
                  Pages
                  <Tooltip.Arrow className="fill-primary" />
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
          </Tooltip.Provider>

          <Tooltip.Provider>
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => {
                    setActiveTab('layers')
                    onToggleCollapse?.()
                  }}
                >
                  <Layers className="h-4 w-4" />
                  <span className="sr-only">Layers</span>
                </Button>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content
                  className="z-50 overflow-hidden rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground animate-in fade-in-0 zoom-in-95"
                  side="right"
                  sideOffset={5}
                >
                  Layers
                  <Tooltip.Arrow className="fill-primary" />
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
          </Tooltip.Provider>

          <Tooltip.Provider>
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => {
                    setActiveTab('properties')
                    onToggleCollapse?.()
                  }}
                >
                  <Settings className="h-4 w-4" />
                  <span className="sr-only">Properties</span>
                </Button>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content
                  className="z-50 overflow-hidden rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground animate-in fade-in-0 zoom-in-95"
                  side="right"
                  sideOffset={5}
                >
                  Properties
                  <Tooltip.Arrow className="fill-primary" />
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
          </Tooltip.Provider>
        </div>
      )}
    </div>
  )
}