'use client'

import React, { useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'

// Configure PDF.js worker properly for Next.js
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

interface SimplePDFViewerProps {
  fileUrl: string
}

export function SimplePDFViewer({ fileUrl }: SimplePDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0)
  const [pageNumber, setPageNumber] = useState<number>(1)

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    console.log('Document loaded with', numPages, 'pages')
    setNumPages(numPages)
  }

  function onDocumentLoadError(error: Error) {
    console.error('Document load error:', error)
  }

  return (
    <div className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-900">
      <div className="flex justify-center p-4">
        <Document
          file={fileUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={
            <div className="flex items-center justify-center p-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-sm text-muted-foreground">Loading PDF...</p>
              </div>
            </div>
          }
          error={
            <div className="text-center text-destructive p-8">
              <p className="text-lg font-medium mb-2">Error loading PDF!</p>
              <p className="text-sm">Please check if the file is valid</p>
            </div>
          }
          className="shadow-lg"
        >
          <Page 
            pageNumber={pageNumber}
            scale={1.2}
            loading={
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            }
            error={
              <div className="text-center text-destructive p-8">
                <p>Error loading page {pageNumber}!</p>
              </div>
            }
            className="border border-border bg-white dark:bg-gray-800 shadow-md"
            renderTextLayer={true}
            renderAnnotationLayer={false}
          />
        </Document>
      </div>
    </div>
  )
}