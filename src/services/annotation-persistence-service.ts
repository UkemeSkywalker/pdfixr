'use client'

import { AnnotationData } from '@/components/pdf/canvas-overlay'

/**
 * Annotation Persistence Service
 * Handles saving, loading, and managing PDF annotations
 */

export interface AnnotationDocument {
  id: string
  pdfUrl: string
  annotations: AnnotationData[]
  createdAt: Date
  updatedAt: Date
  version: number
}

export interface AnnotationFilter {
  pageNumber?: number
  type?: AnnotationData['type']
  dateRange?: {
    start: Date
    end: Date
  }
}

export interface AnnotationExportOptions {
  format: 'json' | 'csv' | 'pdf'
  includeContent?: boolean
  includeMetadata?: boolean
}

export class AnnotationPersistenceService {
  private storageKey = 'pdf-annotations'
  private documents: Map<string, AnnotationDocument> = new Map()

  constructor() {
    if (typeof window !== 'undefined') {
      this.loadFromStorage()
    }
  }

  /**
   * Save annotations for a PDF document
   */
  public async saveAnnotations(pdfUrl: string, annotations: AnnotationData[]): Promise<void> {
    try {
      const documentId = this.generateDocumentId(pdfUrl)
      const existingDoc = this.documents.get(documentId)
      
      const document: AnnotationDocument = {
        id: documentId,
        pdfUrl,
        annotations: [...annotations], // Create a copy
        createdAt: existingDoc?.createdAt || new Date(),
        updatedAt: new Date(),
        version: (existingDoc?.version || 0) + 1,
      }

      this.documents.set(documentId, document)
      await this.saveToStorage()
      
      console.log(`Saved ${annotations.length} annotations for document ${documentId}`)
    } catch (error) {
      console.error('Error saving annotations:', error)
      throw new Error('Failed to save annotations')
    }
  }

  /**
   * Load annotations for a PDF document
   */
  public async loadAnnotations(pdfUrl: string): Promise<AnnotationData[]> {
    try {
      const documentId = this.generateDocumentId(pdfUrl)
      const document = this.documents.get(documentId)
      
      if (!document) {
        return []
      }

      // Validate and clean annotations
      const validAnnotations = document.annotations.filter(this.validateAnnotation)
      
      console.log(`Loaded ${validAnnotations.length} annotations for document ${documentId}`)
      return validAnnotations
    } catch (error) {
      console.error('Error loading annotations:', error)
      return []
    }
  }

  /**
   * Add a single annotation
   */
  public async addAnnotation(pdfUrl: string, annotation: AnnotationData): Promise<void> {
    try {
      const existingAnnotations = await this.loadAnnotations(pdfUrl)
      const updatedAnnotations = [...existingAnnotations, annotation]
      await this.saveAnnotations(pdfUrl, updatedAnnotations)
    } catch (error) {
      console.error('Error adding annotation:', error)
      throw new Error('Failed to add annotation')
    }
  }

  /**
   * Update an existing annotation
   */
  public async updateAnnotation(pdfUrl: string, annotation: AnnotationData): Promise<void> {
    try {
      const existingAnnotations = await this.loadAnnotations(pdfUrl)
      const index = existingAnnotations.findIndex(a => a.id === annotation.id)
      
      if (index === -1) {
        throw new Error(`Annotation with id ${annotation.id} not found`)
      }

      const updatedAnnotations = [...existingAnnotations]
      updatedAnnotations[index] = {
        ...annotation,
        updatedAt: new Date(),
      }

      await this.saveAnnotations(pdfUrl, updatedAnnotations)
    } catch (error) {
      console.error('Error updating annotation:', error)
      throw new Error('Failed to update annotation')
    }
  }

  /**
   * Delete an annotation
   */
  public async deleteAnnotation(pdfUrl: string, annotationId: string): Promise<void> {
    try {
      const existingAnnotations = await this.loadAnnotations(pdfUrl)
      const filteredAnnotations = existingAnnotations.filter(a => a.id !== annotationId)
      
      if (filteredAnnotations.length === existingAnnotations.length) {
        console.warn(`Annotation with id ${annotationId} not found`)
        return
      }

      await this.saveAnnotations(pdfUrl, filteredAnnotations)
    } catch (error) {
      console.error('Error deleting annotation:', error)
      throw new Error('Failed to delete annotation')
    }
  }

  /**
   * Get filtered annotations
   */
  public async getFilteredAnnotations(
    pdfUrl: string,
    filter: AnnotationFilter
  ): Promise<AnnotationData[]> {
    try {
      const allAnnotations = await this.loadAnnotations(pdfUrl)
      
      return allAnnotations.filter(annotation => {
        // Filter by page number
        if (filter.pageNumber !== undefined && annotation.pageNumber !== filter.pageNumber) {
          return false
        }

        // Filter by type
        if (filter.type && annotation.type !== filter.type) {
          return false
        }

        // Filter by date range
        if (filter.dateRange) {
          const annotationDate = new Date(annotation.createdAt)
          if (annotationDate < filter.dateRange.start || annotationDate > filter.dateRange.end) {
            return false
          }
        }

        return true
      })
    } catch (error) {
      console.error('Error filtering annotations:', error)
      return []
    }
  }

  /**
   * Get annotation statistics
   */
  public async getAnnotationStats(pdfUrl: string): Promise<{
    total: number
    byType: Record<string, number>
    byPage: Record<number, number>
    lastModified: Date | null
  }> {
    try {
      const annotations = await this.loadAnnotations(pdfUrl)
      
      const stats = {
        total: annotations.length,
        byType: {} as Record<string, number>,
        byPage: {} as Record<number, number>,
        lastModified: null as Date | null,
      }

      annotations.forEach(annotation => {
        // Count by type
        stats.byType[annotation.type] = (stats.byType[annotation.type] || 0) + 1
        
        // Count by page
        stats.byPage[annotation.pageNumber] = (stats.byPage[annotation.pageNumber] || 0) + 1
        
        // Track last modified
        const updatedAt = new Date(annotation.updatedAt)
        if (!stats.lastModified || updatedAt > stats.lastModified) {
          stats.lastModified = updatedAt
        }
      })

      return stats
    } catch (error) {
      console.error('Error getting annotation stats:', error)
      return {
        total: 0,
        byType: {},
        byPage: {},
        lastModified: null,
      }
    }
  }

  /**
   * Export annotations
   */
  public async exportAnnotations(
    pdfUrl: string,
    options: AnnotationExportOptions
  ): Promise<string | Blob> {
    try {
      const annotations = await this.loadAnnotations(pdfUrl)
      
      switch (options.format) {
        case 'json':
          return this.exportAsJSON(annotations, options)
        
        case 'csv':
          return this.exportAsCSV(annotations, options)
        
        case 'pdf':
          throw new Error('PDF export not yet implemented')
        
        default:
          throw new Error(`Unsupported export format: ${options.format}`)
      }
    } catch (error) {
      console.error('Error exporting annotations:', error)
      throw new Error('Failed to export annotations')
    }
  }

  /**
   * Import annotations
   */
  public async importAnnotations(pdfUrl: string, data: string | File): Promise<number> {
    try {
      let annotationsData: AnnotationData[]

      if (typeof data === 'string') {
        annotationsData = JSON.parse(data)
      } else {
        const text = await data.text()
        annotationsData = JSON.parse(text)
      }

      // Validate imported annotations
      const validAnnotations = annotationsData.filter(this.validateAnnotation)
      
      if (validAnnotations.length === 0) {
        throw new Error('No valid annotations found in import data')
      }

      // Merge with existing annotations
      const existingAnnotations = await this.loadAnnotations(pdfUrl)
      const mergedAnnotations = this.mergeAnnotations(existingAnnotations, validAnnotations)
      
      await this.saveAnnotations(pdfUrl, mergedAnnotations)
      
      return validAnnotations.length
    } catch (error) {
      console.error('Error importing annotations:', error)
      throw new Error('Failed to import annotations')
    }
  }

  /**
   * Clear all annotations for a document
   */
  public async clearAnnotations(pdfUrl: string): Promise<void> {
    try {
      await this.saveAnnotations(pdfUrl, [])
    } catch (error) {
      console.error('Error clearing annotations:', error)
      throw new Error('Failed to clear annotations')
    }
  }

  /**
   * Get all document IDs
   */
  public getDocumentIds(): string[] {
    return Array.from(this.documents.keys())
  }

  /**
   * Delete a document and all its annotations
   */
  public async deleteDocument(pdfUrl: string): Promise<void> {
    try {
      const documentId = this.generateDocumentId(pdfUrl)
      this.documents.delete(documentId)
      await this.saveToStorage()
    } catch (error) {
      console.error('Error deleting document:', error)
      throw new Error('Failed to delete document')
    }
  }

  // Private methods

  private generateDocumentId(pdfUrl: string): string {
    // Create a simple hash of the PDF URL
    let hash = 0
    for (let i = 0; i < pdfUrl.length; i++) {
      const char = pdfUrl.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return `doc_${Math.abs(hash).toString(36)}`
  }

  private validateAnnotation(annotation: any): annotation is AnnotationData {
    return (
      annotation &&
      typeof annotation.id === 'string' &&
      typeof annotation.type === 'string' &&
      typeof annotation.pageNumber === 'number' &&
      annotation.coordinates &&
      typeof annotation.coordinates.x === 'number' &&
      typeof annotation.coordinates.y === 'number' &&
      annotation.style &&
      typeof annotation.style.color === 'string' &&
      annotation.createdAt &&
      annotation.updatedAt
    )
  }

  private async loadFromStorage(): Promise<void> {
    if (typeof window === 'undefined') return
    
    try {
      const stored = localStorage.getItem(this.storageKey)
      if (stored) {
        const data = JSON.parse(stored)
        this.documents = new Map(Object.entries(data))
      }
    } catch (error) {
      console.error('Error loading from storage:', error)
      this.documents = new Map()
    }
  }

  private async saveToStorage(): Promise<void> {
    if (typeof window === 'undefined') return
    
    try {
      const data = Object.fromEntries(this.documents)
      localStorage.setItem(this.storageKey, JSON.stringify(data))
    } catch (error) {
      console.error('Error saving to storage:', error)
      throw new Error('Failed to save to storage')
    }
  }

  private exportAsJSON(annotations: AnnotationData[], options: AnnotationExportOptions): string {
    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      annotations: annotations.map(annotation => ({
        ...annotation,
        content: options.includeContent ? annotation.content : undefined,
      })),
    }

    return JSON.stringify(exportData, null, 2)
  }

  private exportAsCSV(annotations: AnnotationData[], options: AnnotationExportOptions): string {
    const headers = [
      'ID',
      'Type',
      'Page',
      'X',
      'Y',
      'Width',
      'Height',
      'Color',
      'Created',
      'Updated',
    ]

    if (options.includeContent) {
      headers.push('Content')
    }

    const rows = annotations.map(annotation => {
      const row = [
        annotation.id,
        annotation.type,
        annotation.pageNumber.toString(),
        annotation.coordinates.x.toString(),
        annotation.coordinates.y.toString(),
        (annotation.coordinates.width || '').toString(),
        (annotation.coordinates.height || '').toString(),
        annotation.style.color,
        annotation.createdAt.toISOString(),
        annotation.updatedAt.toISOString(),
      ]

      if (options.includeContent) {
        row.push(annotation.content || '')
      }

      return row
    })

    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
      .join('\n')
  }

  private mergeAnnotations(
    existing: AnnotationData[],
    imported: AnnotationData[]
  ): AnnotationData[] {
    const merged = [...existing]
    const existingIds = new Set(existing.map(a => a.id))

    imported.forEach(annotation => {
      if (!existingIds.has(annotation.id)) {
        merged.push(annotation)
      }
    })

    return merged
  }
}

// Export singleton instance (only create on client side)
export const annotationPersistenceService = typeof window !== 'undefined' 
  ? new AnnotationPersistenceService() 
  : null as any