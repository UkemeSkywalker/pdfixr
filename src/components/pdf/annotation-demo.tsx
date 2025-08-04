"use client";

import React, { useState, useCallback } from "react";
import { PDFViewerWithAnnotations } from "./pdf-viewer-with-annotations";
import { SimplePDFViewer } from "./simple-pdf-viewer";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnnotationData, AnnotationTool, TextSelection } from "@/types";
import { annotationPersistenceService } from "@/services/annotation-persistence-service";
import {
  annotationHistoryService,
  AnnotationHistoryService,
} from "@/services/annotation-history-service";
import { cn } from "@/utils/cn";

interface AnnotationDemoProps {
  pdfUrl: string;
  className?: string;
  selectedTool?: AnnotationTool;
  onToolChange?: (tool: AnnotationTool) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

export function AnnotationDemo({ 
  pdfUrl, 
  className,
  selectedTool: externalSelectedTool,
  onToolChange,
  onUndo: externalOnUndo,
  onRedo: externalOnRedo,
  canUndo: externalCanUndo,
  canRedo: externalCanRedo
}: AnnotationDemoProps) {
  const [annotations, setAnnotations] = useState<AnnotationData[]>([]);
  const [internalSelectedTool, setInternalSelectedTool] = useState<AnnotationTool>({
    type: "highlight",
    color: "#ffff00",
    strokeWidth: 2,
    opacity: 0.8,
  });

  // Use external tool if provided, otherwise use internal
  const selectedTool = externalSelectedTool || internalSelectedTool;
  const [currentSelection, setCurrentSelection] =
    useState<TextSelection | null>(null);
  const [historyStats, setHistoryStats] = useState({
    undoCount: 0,
    redoCount: 0,
  });

  // Update history stats
  const updateHistoryStats = useCallback(() => {
    setHistoryStats({
      undoCount: annotationHistoryService.getUndoStackSize(),
      redoCount: annotationHistoryService.getRedoStackSize(),
    });
  }, []);

  // Load annotations on mount
  React.useEffect(() => {
    if (!annotationPersistenceService) return;

    const loadAnnotations = async () => {
      try {
        const loadedAnnotations =
          await annotationPersistenceService.loadAnnotations(pdfUrl);
        setAnnotations(loadedAnnotations);
        annotationHistoryService.initialize(loadedAnnotations);
        updateHistoryStats();
      } catch (error) {
        console.error("Failed to load annotations:", error);
      }
    };
    loadAnnotations();
  }, [pdfUrl, updateHistoryStats]);

  // Save annotations when they change
  React.useEffect(() => {
    if (!annotationPersistenceService) return;

    const saveAnnotations = async () => {
      try {
        await annotationPersistenceService.saveAnnotations(pdfUrl, annotations);
      } catch (error) {
        console.error("Failed to save annotations:", error);
      }
    };

    if (annotations.length > 0) {
      saveAnnotations();
    }
  }, [annotations, pdfUrl]);

  // Handle annotation addition
  const handleAnnotationAdd = useCallback(
    (annotation: AnnotationData) => {
      setAnnotations((prev) => {
        const newAnnotations = [...prev, annotation];
        annotationHistoryService.saveState(
          newAnnotations,
          AnnotationHistoryService.createAddAction(annotation)
        );
        updateHistoryStats();
        return newAnnotations;
      });
    },
    [updateHistoryStats]
  );

  // Handle annotation update
  const handleAnnotationUpdate = useCallback(
    (annotation: AnnotationData) => {
      setAnnotations((prev) => {
        const newAnnotations = prev.map((a) =>
          a.id === annotation.id ? annotation : a
        );
        annotationHistoryService.saveState(
          newAnnotations,
          AnnotationHistoryService.createUpdateAction(annotation)
        );
        updateHistoryStats();
        return newAnnotations;
      });
    },
    [updateHistoryStats]
  );

  // Handle annotation deletion
  const handleAnnotationDelete = useCallback(
    (annotationId: string) => {
      setAnnotations((prev) => {
        const annotation = prev.find((a) => a.id === annotationId);
        const newAnnotations = prev.filter((a) => a.id !== annotationId);

        if (annotation) {
          annotationHistoryService.saveState(
            newAnnotations,
            AnnotationHistoryService.createDeleteAction(annotation)
          );
        }
        updateHistoryStats();
        return newAnnotations;
      });
    },
    [updateHistoryStats]
  );



  // Handle undo
  const handleUndo = useCallback(() => {
    if (externalOnUndo) {
      externalOnUndo();
    } else {
      const previousState = annotationHistoryService.undo();
      if (previousState) {
        setAnnotations(previousState);
        updateHistoryStats();
      }
    }
  }, [externalOnUndo, updateHistoryStats]);

  // Handle redo
  const handleRedo = useCallback(() => {
    if (externalOnRedo) {
      externalOnRedo();
    } else {
      const nextState = annotationHistoryService.redo();
      if (nextState) {
        setAnnotations(nextState);
        updateHistoryStats();
      }
    }
  }, [externalOnRedo, updateHistoryStats]);

  // Handle tool selection
  const handleToolChange = useCallback((tool: AnnotationTool) => {
    if (onToolChange) {
      onToolChange(tool);
    } else {
      setInternalSelectedTool(tool);
    }
  }, [onToolChange]);

  // Handle text selection change
  const handleTextSelectionChange = useCallback(
    (selection: TextSelection | null) => {
      setCurrentSelection(selection);
    },
    []
  );

  // Handle annotation selection change
  const handleAnnotationSelectionChange = useCallback(
    (selectedAnnotations: AnnotationData[]) => {
      console.log("Selected annotations:", selectedAnnotations);
    },
    []
  );

  return (
    <TooltipProvider>
      <div className={cn("flex flex-col h-full", className)}>
        {/* Status Bar */}
        <div className="border-b border-border bg-muted/50 px-4 py-2 text-sm text-muted-foreground">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span>Annotations: {annotations.length}</span>
              <span>Tool: {selectedTool.type}</span>
              {currentSelection && (
                <span>Selected: &ldquo;{currentSelection.text.slice(0, 30)}&hellip;&rdquo;</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span>Undo: {historyStats.undoCount}</span>
              <span>Redo: {historyStats.redoCount}</span>
            </div>
          </div>
        </div>

        {/* PDF Viewer */}
        <div className="flex-1">
          <PDFViewerWithAnnotations 
            fileUrl={pdfUrl}
            annotations={annotations}
            selectedTool={selectedTool}
            onAnnotationAdd={handleAnnotationAdd}
            onAnnotationUpdate={handleAnnotationUpdate}
            onAnnotationDelete={handleAnnotationDelete}
            onSelectionChange={handleAnnotationSelectionChange}
            onTextSelectionChange={handleTextSelectionChange}
            annotationsEnabled={true}
            showControls={true}
          />
        </div>

        {/* Instructions */}
        <div className="border-t border-border bg-muted/30 p-3 text-xs text-muted-foreground">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div>
              <strong>Text Highlighting:</strong> Select text and click or press
              Enter to apply {selectedTool.type}
            </div>
            <div>
              <strong>Shapes:</strong> Click and drag to draw shapes on the PDF
            </div>
            <div>
              <strong>Keyboard:</strong> Ctrl+Z (Undo), Ctrl+Y (Redo), Escape
              (Cancel)
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
