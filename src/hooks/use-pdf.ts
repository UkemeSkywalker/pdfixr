import { useState, useCallback } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { PDFService } from '@/services/pdf-service'

export function usePDFUpload() {
  return useMutation({
    mutationFn: (file: File) => PDFService.uploadPDF(file),
    onSuccess: (response) => {
      if (!response.success) {
        throw new Error(response.error)
      }
    },
  })
}

export function usePDFDocument(url: string | null) {
  return useQuery({
    queryKey: ['pdf-document', url],
    queryFn: () => PDFService.loadPDFDocument(url!),
    enabled: !!url,
    select: (response) => {
      if (!response.success) {
        throw new Error(response.error)
      }
      return response.data
    },
  })
}

export function usePDFEditor() {
  const [currentPage, setCurrentPage] = useState(1)
  const [zoom, setZoom] = useState(1)
  const [selectedTool, setSelectedTool] = useState<string | null>(null)
  const [isDirty, setIsDirty] = useState(false)

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
  }, [])

  const handleZoomChange = useCallback((newZoom: number) => {
    setZoom(Math.max(0.1, Math.min(3, newZoom)))
  }, [])

  const handleToolSelect = useCallback((tool: string | null) => {
    setSelectedTool(tool)
  }, [])

  const markDirty = useCallback(() => {
    setIsDirty(true)
  }, [])

  const markClean = useCallback(() => {
    setIsDirty(false)
  }, [])

  return {
    currentPage,
    zoom,
    selectedTool,
    isDirty,
    handlePageChange,
    handleZoomChange,
    handleToolSelect,
    markDirty,
    markClean,
  }
}