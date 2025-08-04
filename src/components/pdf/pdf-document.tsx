"use client";

import React from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Skeleton } from "@/components/ui/skeleton";
import "@/styles/pdf.css";

// Configure PDF.js worker properly for Next.js
if (typeof window !== "undefined") {
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();
}

interface PDFDocumentProps {
  fileUrl: string;
  currentPage: number;
  zoom: number;
  rotation: number;
  onLoadSuccess: (data: { numPages: number }) => void;
  onLoadError: (error: Error) => void;
  onPageLoadSuccess: (page: unknown) => void;
}

export default function PDFDocument({
  fileUrl,
  currentPage,
  zoom,
  rotation,
  onLoadSuccess,
  onLoadError,
  onPageLoadSuccess,
}: PDFDocumentProps) {
  console.log("PDFDocument rendering with:", { fileUrl, currentPage, zoom });

  return (
    <div className="pdf-document-container">
      <Document
        file={fileUrl}
        onLoadSuccess={(data) => {
          console.log("PDF loaded successfully:", data);
          onLoadSuccess(data);
        }}
        onLoadError={(error) => {
          console.error("PDF load error:", error);
          onLoadError(error);
        }}
        loading={
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <Skeleton className="h-96 w-72 mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">Loading PDF...</p>
            </div>
          </div>
        }
        error={
          <div className="text-center text-destructive p-8">
            <p className="text-lg font-medium mb-2">
              Failed to load PDF document
            </p>
            <p className="text-sm">Please check if the file is a valid PDF</p>
          </div>
        }
        className="shadow-lg"
      >
        <Page
          pageNumber={currentPage}
          scale={zoom}
          rotate={rotation}
          onLoadSuccess={(page) => {
            console.log("Page loaded successfully:", page);
            onPageLoadSuccess(page);
          }}
          onLoadError={(error) => {
            console.error("Page load error:", error);
          }}
          loading={
            <div className="flex items-center justify-center p-8">
              <div className="text-center">
                <Skeleton className="h-96 w-72 mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">
                  Loading page {currentPage}...
                </p>
              </div>
            </div>
          }
          error={
            <div className="text-center text-destructive p-8">
              <p className="text-lg font-medium mb-2">
                Failed to load page {currentPage}
              </p>
              <p className="text-sm">Please try refreshing the page</p>
            </div>
          }
          className="border border-border bg-white dark:bg-gray-800"
          canvasBackground="transparent"
          data-page-number={currentPage}
          renderTextLayer={false}
          renderAnnotationLayer={false}
        />
      </Document>
    </div>
  );
}
