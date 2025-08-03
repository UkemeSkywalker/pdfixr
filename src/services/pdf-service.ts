import { PDFDocument as PDFLibDocument } from 'pdf-lib'
import { PDFDocument, UploadResponse, ApiResponse } from '@/types'

export class PDFService {
  static async uploadPDF(file: File): Promise<ApiResponse<UploadResponse>> {
    try {
      // Validate file type
      if (file.type !== 'application/pdf') {
        return {
          success: false,
          error: 'Invalid file type. Please upload a PDF file.',
        }
      }

      // Validate file size (50MB limit)
      const maxSize = 50 * 1024 * 1024
      if (file.size > maxSize) {
        return {
          success: false,
          error: 'File size too large. Maximum size is 50MB.',
        }
      }

      // Read PDF to get page count
      const arrayBuffer = await file.arrayBuffer()
      const pdfDoc = await PDFLibDocument.load(arrayBuffer)
      const pageCount = pdfDoc.getPageCount()

      // Create document ID and URL (in a real app, this would be handled by the backend)
      const documentId = crypto.randomUUID()
      const url = URL.createObjectURL(file)

      return {
        success: true,
        data: {
          documentId,
          url,
          pages: pageCount,
          size: file.size,
        },
      }
    } catch {
      return {
        success: false,
        error: 'Failed to process PDF file.',
      }
    }
  }

  static async loadPDFDocument(url: string): Promise<ApiResponse<PDFDocument>> {
    try {
      const response = await fetch(url)
      const arrayBuffer = await response.arrayBuffer()
      const pdfDoc = await PDFLibDocument.load(arrayBuffer)

      const document: PDFDocument = {
        id: crypto.randomUUID(),
        name: 'document.pdf',
        url,
        pages: pdfDoc.getPageCount(),
        size: arrayBuffer.byteLength,
        uploadedAt: new Date(),
        modifiedAt: new Date(),
      }

      return {
        success: true,
        data: document,
      }
    } catch {
      return {
        success: false,
        error: 'Failed to load PDF document.',
      }
    }
  }

  static async exportPDF(pdfDoc: PDFLibDocument): Promise<ApiResponse<Blob>> {
    try {
      const pdfBytes = await pdfDoc.save()
      const blob = new Blob([pdfBytes], { type: 'application/pdf' })

      return {
        success: true,
        data: blob,
      }
    } catch {
      return {
        success: false,
        error: 'Failed to export PDF.',
      }
    }
  }
}