"use client";

import React, { useEffect, useCallback, useRef, useState } from "react";
import {
  textSelectionService,
  TextSelection,
} from "@/services/text-selection-service";
import { AnnotationData, AnnotationTool } from "./canvas-overlay";
import { cn } from "@/utils/cn";

interface TextHighlighterProps {
  pageNumber: number;
  selectedTool?: AnnotationTool;
  onAnnotationAdd?: (annotation: AnnotationData) => void;
  onSelectionChange?: (selection: TextSelection | null) => void;
  disabled?: boolean;
  className?: string;
}

interface HighlightOverlay {
  id: string;
  selection: TextSelection;
  style: {
    color: string;
    opacity: number;
    type: "highlight" | "underline" | "strikethrough";
  };
}

export function TextHighlighter({
  pageNumber,
  selectedTool,
  onAnnotationAdd,
  onSelectionChange,
  disabled = false,
  className,
}: TextHighlighterProps) {
  const [currentSelection, setCurrentSelection] =
    useState<TextSelection | null>(null);
  const [pendingHighlight, setPendingHighlight] =
    useState<HighlightOverlay | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle text selection changes
  const handleSelectionChange = useCallback(
    (selection: TextSelection | null) => {
      if (disabled) return;

      setCurrentSelection(selection);
      onSelectionChange?.(selection);

      // If we have a selection and a text annotation tool is selected, show preview
      if (
        selection &&
        selectedTool &&
        isTextAnnotationTool(selectedTool.type)
      ) {
        const overlay: HighlightOverlay = {
          id: `preview-${selection.id}`,
          selection,
          style: {
            color: selectedTool.color,
            opacity: selectedTool.opacity,
            type: selectedTool.type as
              | "highlight"
              | "underline"
              | "strikethrough",
          },
        };
        setPendingHighlight(overlay);
      } else {
        setPendingHighlight(null);
      }
    },
    [disabled, selectedTool, onSelectionChange]
  );

  // Set up text selection service
  useEffect(() => {
    if (!textSelectionService) return;
    
    textSelectionService.addSelectionChangeListener(handleSelectionChange);
    return () => {
      textSelectionService.removeSelectionChangeListener(handleSelectionChange);
    };
  }, [handleSelectionChange]);

  // Handle click to apply annotation
  const handleClick = useCallback(
    (event: MouseEvent) => {
      if (disabled || !currentSelection || !selectedTool) return;

      // Only handle text annotation tools
      if (!isTextAnnotationTool(selectedTool.type)) return;

      // Check if click is within the current page
      const pageContainer = document.querySelector(
        `[data-page-number="${pageNumber}"]`
      );
      if (!pageContainer || !pageContainer.contains(event.target as Node))
        return;

      // Create annotation from current selection
      const annotation = createAnnotationFromSelection(
        currentSelection,
        selectedTool
      );
      if (annotation) {
        onAnnotationAdd?.(annotation);

        // Clear selection after applying annotation
        window.getSelection()?.removeAllRanges();
        setCurrentSelection(null);
        setPendingHighlight(null);
      }
    },
    [disabled, currentSelection, selectedTool, pageNumber, onAnnotationAdd]
  );

  // Handle double-click for quick highlighting
  const handleDoubleClick = useCallback(
    (event: MouseEvent) => {
      if (disabled || !selectedTool) return;

      // Only handle highlight tool for double-click
      if (selectedTool.type !== "highlight") return;

      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) return;

      // Get the current selection and create annotation immediately
      const textSelection = textSelectionService?.getCurrentSelection();
      if (textSelection && textSelection.pageNumber === pageNumber) {
        const annotation = createAnnotationFromSelection(
          textSelection,
          selectedTool
        );
        if (annotation) {
          onAnnotationAdd?.(annotation);
          selection.removeAllRanges();
        }
      }
    },
    [disabled, selectedTool, pageNumber, onAnnotationAdd]
  );

  // Set up click handlers
  useEffect(() => {
    if (disabled) return;

    document.addEventListener("click", handleClick);
    document.addEventListener("dblclick", handleDoubleClick);

    return () => {
      document.removeEventListener("click", handleClick);
      document.removeEventListener("dblclick", handleDoubleClick);
    };
  }, [handleClick, handleDoubleClick, disabled]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (disabled) return;

      // Apply annotation on Enter key
      if (
        event.key === "Enter" &&
        currentSelection &&
        selectedTool &&
        isTextAnnotationTool(selectedTool.type)
      ) {
        event.preventDefault();
        const annotation = createAnnotationFromSelection(
          currentSelection,
          selectedTool
        );
        if (annotation) {
          onAnnotationAdd?.(annotation);
          window.getSelection()?.removeAllRanges();
          setCurrentSelection(null);
          setPendingHighlight(null);
        }
      }

      // Cancel selection on Escape
      if (event.key === "Escape") {
        window.getSelection()?.removeAllRanges();
        setCurrentSelection(null);
        setPendingHighlight(null);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [disabled, currentSelection, selectedTool, onAnnotationAdd]);

  // Render highlight preview overlay
  const renderHighlightPreview = () => {
    if (
      !pendingHighlight ||
      pendingHighlight.selection.pageNumber !== pageNumber
    ) {
      return null;
    }

    const { selection, style } = pendingHighlight;

    return selection.boundingBoxes.map((box, index) => {
      const overlayStyle = getOverlayStyle(
        style.type,
        style.color,
        style.opacity
      );

      return (
        <div
          key={`preview-${selection.id}-${index}`}
          className={cn(
            "absolute pointer-events-none transition-opacity duration-200",
            overlayStyle.className
          )}
          style={{
            left: box.x,
            top: box.y,
            width: box.width,
            height: box.height,
            backgroundColor:
              style.type === "highlight" ? style.color : "transparent",
            opacity:
              style.type === "highlight" ? style.opacity * 0.3 : style.opacity,
            borderBottom:
              style.type === "underline"
                ? `${2}px solid ${style.color}`
                : undefined,
            textDecoration:
              style.type === "strikethrough" ? "line-through" : undefined,
            textDecorationColor:
              style.type === "strikethrough" ? style.color : undefined,
            ...overlayStyle.style,
          }}
        />
      );
    });
  };

  // Render selection hint
  const renderSelectionHint = () => {
    if (
      !currentSelection ||
      !selectedTool ||
      !isTextAnnotationTool(selectedTool.type)
    ) {
      return null;
    }

    return (
      <div className="absolute top-2 right-2 bg-popover border border-border rounded-md px-2 py-1 text-xs text-muted-foreground pointer-events-none z-10">
        Click or press Enter to apply {selectedTool.type}
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className={cn("absolute inset-0 pointer-events-none", className)}
    >
      {renderHighlightPreview()}
      {renderSelectionHint()}
    </div>
  );
}

// Helper function to check if tool is a text annotation tool
function isTextAnnotationTool(toolType: string): boolean {
  return ["highlight", "underline", "strikethrough"].includes(toolType);
}

// Helper function to create annotation from text selection
function createAnnotationFromSelection(
  selection: TextSelection,
  tool: AnnotationTool
): AnnotationData | null {
  if (!isTextAnnotationTool(tool.type)) return null;

  // Calculate overall bounding box from all selection boxes
  const boundingBoxes = selection.boundingBoxes;
  if (boundingBoxes.length === 0) return null;

  const minX = Math.min(...boundingBoxes.map((box) => box.x));
  const minY = Math.min(...boundingBoxes.map((box) => box.y));
  const maxX = Math.max(...boundingBoxes.map((box) => box.x + box.width));
  const maxY = Math.max(...boundingBoxes.map((box) => box.y + box.height));

  const annotation: AnnotationData = {
    id: crypto.randomUUID(),
    type: tool.type as "highlight" | "underline" | "strikethrough",
    pageNumber: selection.pageNumber,
    coordinates: {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    },
    style: {
      color: tool.color,
      strokeWidth: tool.strokeWidth,
      opacity: tool.opacity,
    },
    content: selection.text,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return annotation;
}

// Helper function to get overlay styling
function getOverlayStyle(type: string, color: string, opacity: number) {
  switch (type) {
    case "highlight":
      return {
        className: "rounded-sm",
        style: {},
      };

    case "underline":
      return {
        className: "",
        style: {
          borderBottom: `2px solid ${color}`,
        },
      };

    case "strikethrough":
      return {
        className: "",
        style: {
          position: "relative" as const,
          "::after": {
            content: '""',
            position: "absolute" as const,
            top: "50%",
            left: 0,
            right: 0,
            height: "2px",
            backgroundColor: color,
            opacity,
          },
        },
      };

    default:
      return {
        className: "",
        style: {},
      };
  }
}
