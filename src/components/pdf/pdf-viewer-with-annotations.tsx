"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { Document, Page, pdfjs } from 'react-pdf';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AnnotationLayer } from "./annotation-layer";
import { TextHighlighter } from "./text-highlighter";
import { AnnotationData, AnnotationTool, TextSelection } from "@/types";
import { PageDimensions } from "./coordinate-mapper";
import { cn } from "@/utils/cn";

// Configure PDF.js worker properly for Next.js
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

interface PDFViewerWithAnnotationsProps {
  fileUrl: string;
  onPageChange?: (page: number) => void;
  onZoomChange?: (zoom: number) => void;
  onDocumentLoad?: (numPages: number) => void;
  onError?: (error: Error) => void;
  onAnnotationAdd?: (annotation: AnnotationData) => void;
  onAnnotationUpdate?: (annotation: AnnotationData) => void;
  onAnnotationDelete?: (annotationId: string) => void;
  onSelectionChange?: (selectedAnnotations: AnnotationData[]) => void;
  onTextSelectionChange?: (selection: TextSelection | null) => void;
  annotations?: AnnotationData[];
  selectedTool?: AnnotationTool;
  className?: string;
  initialPage?: number;
  initialZoom?: number;
  showControls?: boolean;
  showAnnotationBounds?: boolean;
  annotationsEnabled?: boolean;
}

export function PDFViewerWithAnnotations({
  fileUrl,
  onPageChange,
  onZoomChange,
  onDocumentLoad,
  onError,
  onAnnotationAdd,
  onAnnotationUpdate,
  onAnnotationDelete,
  onSelectionChange,
  onTextSelectionChange,
  annotations = [],
  selectedTool,
  className,
  initialPage = 1,
  initialZoom = 1,
  showControls = true,
  showAnnotationBounds = false,
  annotationsEnabled = true,
}: PDFViewerWithAnnotationsProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [zoom, setZoom] = useState<number>(initialZoom);
  const [rotation, setRotation] = useState<number>(0);
  const [pageDimensions, setPageDimensions] = useState<PageDimensions>({ width: 612, height: 792 });

  const containerRef = useRef<HTMLDivElement>(null);
  const pageInputRef = useRef<HTMLInputElement>(null);

  // Handle document load success
  const onDocumentLoadSuccess = useCallback(
    ({ numPages }: { numPages: number }) => {
      console.log('Document loaded with', numPages, 'pages');
      setNumPages(numPages);
      onDocumentLoad?.(numPages);
    },
    [onDocumentLoad]
  );

  // Handle document load error
  const onDocumentLoadError = useCallback(
    (error: Error) => {
      console.error('Document load error:', error);
      onError?.(error);
    },
    [onError]
  );

  // Handle page load success
  const onPageLoadSuccess = useCallback(
    (page: unknown) => {
      const { width, height } = page;
      setPageDimensions({ width, height });
    },
    []
  );

  // Navigation functions
  const goToPreviousPage = useCallback(() => {
    if (currentPage > 1) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
      onPageChange?.(newPage);
    }
  }, [currentPage, onPageChange]);

  const goToNextPage = useCallback(() => {
    if (currentPage < numPages) {
      const newPage = currentPage + 1;
      setCurrentPage(newPage);
      onPageChange?.(newPage);
    }
  }, [currentPage, numPages, onPageChange]);

  const goToPage = useCallback(
    (page: number) => {
      const validPage = Math.max(1, Math.min(page, numPages));
      setCurrentPage(validPage);
      onPageChange?.(validPage);
    },
    [numPages, onPageChange]
  );

  // Zoom functions
  const zoomIn = useCallback(() => {
    const newZoom = Math.min(zoom * 1.2, 3);
    setZoom(newZoom);
    onZoomChange?.(newZoom);
  }, [zoom, onZoomChange]);

  const zoomOut = useCallback(() => {
    const newZoom = Math.max(zoom / 1.2, 0.1);
    setZoom(newZoom);
    onZoomChange?.(newZoom);
  }, [zoom, onZoomChange]);

  const handleSetZoom = useCallback(
    (newZoom: number) => {
      const validZoom = Math.max(0.1, Math.min(newZoom, 3));
      setZoom(validZoom);
      onZoomChange?.(validZoom);
    },
    [onZoomChange]
  );

  // Rotation function
  const rotateClockwise = useCallback(() => {
    setRotation((prev) => (prev + 90) % 360);
  }, []);

  // Handle page input change
  const handlePageInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const page = parseInt(e.target.value, 10);
      if (!isNaN(page)) {
        goToPage(page);
      }
    },
    [goToPage]
  );

  // Handle page input key press
  const handlePageInputKeyPress = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        const page = parseInt(e.currentTarget.value, 10);
        if (!isNaN(page)) {
          goToPage(page);
        }
        e.currentTarget.blur();
      }
    },
    [goToPage]
  );

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;

      switch (e.key) {
        case "ArrowLeft":
        case "PageUp":
          e.preventDefault();
          goToPreviousPage();
          break;
        case "ArrowRight":
        case "PageDown":
          e.preventDefault();
          goToNextPage();
          break;
        case "Home":
          e.preventDefault();
          goToPage(1);
          break;
        case "End":
          e.preventDefault();
          goToPage(numPages);
          break;
        case "+":
        case "=":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            zoomIn();
          }
          break;
        case "-":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            zoomOut();
          }
          break;
        case "0":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handleSetZoom(1);
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    goToPreviousPage,
    goToNextPage,
    goToPage,
    numPages,
    zoomIn,
    zoomOut,
    handleSetZoom,
  ]);

  // Get current page dimensions
  const currentPageDimensions = pageDimensions;

  return (
    <div
      className={cn("flex flex-col h-full bg-background", className)}
      ref={containerRef}
    >
      {showControls && (
        <div className="flex items-center justify-between p-4 border-b border-border bg-surface">
          {/* Navigation Controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousPage}
              disabled={currentPage <= 1}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextPage}
              disabled={currentPage >= numPages}
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-1 text-sm">
              <Input
                ref={pageInputRef}
                type="number"
                min={1}
                max={numPages}
                value={currentPage}
                onChange={handlePageInputChange}
                onKeyPress={handlePageInputKeyPress}
                className="w-16 h-8 text-center"
                aria-label="Current page"
              />
              <span className="text-muted-foreground">of {numPages}</span>
            </div>
          </div>

          {/* Zoom and Rotation Controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={zoomOut}
              disabled={zoom <= 0.1}
              aria-label="Zoom out"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground min-w-12 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={zoomIn}
              disabled={zoom >= 3}
              aria-label="Zoom in"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={rotateClockwise}
              aria-label="Rotate clockwise"
            >
              <RotateCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* PDF Document with Annotations */}
      <div className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-900">
        <div className="flex justify-center p-4">
          <div className="relative">
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
                pageNumber={currentPage}
                scale={zoom}
                rotate={rotation}
                onLoadSuccess={onPageLoadSuccess}
                loading={
                  <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                }
                error={
                  <div className="text-center text-destructive p-8">
                    <p>Error loading page {currentPage}!</p>
                  </div>
                }
                className="border border-border bg-white dark:bg-gray-800 shadow-md"
                renderTextLayer={true}
                renderAnnotationLayer={false}
              />

              {/* Text Highlighter Layer */}
              {annotationsEnabled && (
                <TextHighlighter
                  pageNumber={currentPage}
                  selectedTool={selectedTool}
                  onAnnotationAdd={onAnnotationAdd}
                  onSelectionChange={onTextSelectionChange}
                  className="absolute inset-0 pointer-events-none"
                />
              )}

              {/* Annotation Layer */}
              {annotationsEnabled && (
                <AnnotationLayer
                  pageNumber={currentPage}
                  pageDimensions={currentPageDimensions}
                  scale={zoom}
                  rotation={rotation}
                  selectedTool={selectedTool}
                  annotations={annotations}
                  onAnnotationAdd={onAnnotationAdd}
                  onAnnotationUpdate={onAnnotationUpdate}
                  onAnnotationDelete={onAnnotationDelete}
                  onSelectionChange={onSelectionChange}
                  showBounds={showAnnotationBounds}
                  className="absolute inset-0 pointer-events-auto"
                />
              )}
            </Document>
          </div>
        </div>
      </div>
    </div>
  );
}
