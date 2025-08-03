'use client'

import { useState, useCallback } from 'react'

interface UseFileUploadOptions {
  acceptedTypes?: string[]
  maxSize?: number // in bytes
  onSuccess?: (file: File) => void
  onError?: (error: string) => void
}

interface UseFileUploadReturn {
  isDragOver: boolean
  isUploading: boolean
  uploadFile: (file: File) => void
  handleDrop: (e: React.DragEvent) => void
  handleDragOver: (e: React.DragEvent) => void
  handleDragLeave: (e: React.DragEvent) => void
  handleFileInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export function useFileUpload({
  acceptedTypes = ['application/pdf'],
  maxSize = 100 * 1024 * 1024, // 100MB default
  onSuccess,
  onError
}: UseFileUploadOptions = {}): UseFileUploadReturn {
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const validateFile = useCallback((file: File): string | null => {
    if (!acceptedTypes.includes(file.type)) {
      return `File type not supported. Please upload: ${acceptedTypes.join(', ')}`
    }
    
    if (file.size > maxSize) {
      return `File size too large. Maximum size: ${Math.round(maxSize / (1024 * 1024))}MB`
    }
    
    return null
  }, [acceptedTypes, maxSize])

  const uploadFile = useCallback(async (file: File) => {
    const error = validateFile(file)
    if (error) {
      onError?.(error)
      return
    }

    setIsUploading(true)
    try {
      // Simulate upload delay for better UX
      await new Promise(resolve => setTimeout(resolve, 100))
      onSuccess?.(file)
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }, [validateFile, onSuccess, onError])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    const validFile = files.find(file => acceptedTypes.includes(file.type))
    
    if (validFile) {
      uploadFile(validFile)
    } else if (files.length > 0) {
      onError?.(`Please upload a valid file type: ${acceptedTypes.join(', ')}`)
    }
  }, [acceptedTypes, uploadFile, onError])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    // Only set drag over to false if we're leaving the drop zone entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false)
    }
  }, [])

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      uploadFile(file)
    }
    // Reset input value to allow uploading the same file again
    e.target.value = ''
  }, [uploadFile])

  return {
    isDragOver,
    isUploading,
    uploadFile,
    handleDrop,
    handleDragOver,
    handleDragLeave,
    handleFileInputChange
  }
}