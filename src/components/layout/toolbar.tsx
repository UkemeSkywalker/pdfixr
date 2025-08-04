"use client";

import React, { useState, useCallback } from "react";
import {
  MousePointer,
  Highlighter,
  Underline,
  Strikethrough,
  StickyNote,
  Square,
  Circle,
  ArrowRight,
  Type,
  Image,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RotateCw,
  Palette,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";
import * as Tooltip from "@radix-ui/react-tooltip";
// Simple separator component
const Separator = ({ className }: { className?: string }) => (
  <div className={cn("bg-border", className)} />
);

export type AnnotationTool =
  | "select"
  | "highlight"
  | "underline"
  | "strikethrough"
  | "note"
  | "rectangle"
  | "circle"
  | "arrow"
  | "text"
  | "image";

export type ToolGroup =
  | "selection"
  | "annotation"
  | "shapes"
  | "content"
  | "actions"
  | "zoom";

interface ToolbarProps {
  activeTool: AnnotationTool;
  onToolChange: (tool: AnnotationTool) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onExport?: () => void;
  onColorChange?: (color: string) => void;
  canUndo?: boolean;
  canRedo?: boolean;
  zoomLevel?: number;
  className?: string;
  position?: "top" | "bottom";
  isFloating?: boolean;
}

const toolGroups: Record<
  ToolGroup,
  { tools: AnnotationTool[]; label: string }
> = {
  selection: {
    tools: ["select"],
    label: "Selection",
  },
  annotation: {
    tools: ["highlight", "underline", "strikethrough", "note"],
    label: "Annotations",
  },
  shapes: {
    tools: ["rectangle", "circle", "arrow"],
    label: "Shapes",
  },
  content: {
    tools: ["text", "image"],
    label: "Content",
  },
  actions: {
    tools: [],
    label: "Actions",
  },
  zoom: {
    tools: [],
    label: "Zoom",
  },
};

const toolConfig: Record<
  AnnotationTool,
  { icon: React.ComponentType<unknown>; label: string; shortcut?: string }
> = {
  select: { icon: MousePointer, label: "Select", shortcut: "V" },
  highlight: { icon: Highlighter, label: "Highlight", shortcut: "H" },
  underline: { icon: Underline, label: "Underline", shortcut: "U" },
  strikethrough: { icon: Strikethrough, label: "Strikethrough", shortcut: "S" },
  note: { icon: StickyNote, label: "Note", shortcut: "N" },
  rectangle: { icon: Square, label: "Rectangle", shortcut: "R" },
  circle: { icon: Circle, label: "Circle", shortcut: "C" },
  arrow: { icon: ArrowRight, label: "Arrow", shortcut: "A" },
  text: { icon: Type, label: "Text", shortcut: "T" },
  image: { icon: Image, label: "Image", shortcut: "I" },
};

const colorOptions = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#3b82f6", // blue
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#000000", // black
];

export function Toolbar({
  activeTool,
  onToolChange,
  onUndo,
  onRedo,
  onZoomIn,
  onZoomOut,
  onExport,
  onColorChange,
  canUndo = false,
  canRedo = false,
  zoomLevel = 100,
  className,
  position = "top",
  isFloating = true,
}: ToolbarProps) {
  const [selectedColor, setSelectedColor] = useState("#ef4444");
  const [showColorPicker, setShowColorPicker] = useState(false);

  const handleToolSelect = useCallback(
    (tool: AnnotationTool) => {
      onToolChange(tool);
    },
    [onToolChange]
  );

  const handleColorSelect = useCallback(
    (color: string) => {
      setSelectedColor(color);
      onColorChange?.(color);
      setShowColorPicker(false);
    },
    [onColorChange]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        switch (e.key.toLowerCase()) {
          case "z":
            e.preventDefault();
            if (e.shiftKey) {
              onRedo?.();
            } else {
              onUndo?.();
            }
            break;
          case "=":
          case "+":
            e.preventDefault();
            onZoomIn?.();
            break;
          case "-":
            e.preventDefault();
            onZoomOut?.();
            break;
        }
        return;
      }

      // Tool shortcuts
      const toolEntry = Object.entries(toolConfig).find(
        ([_, config]) => config.shortcut?.toLowerCase() === e.key.toLowerCase()
      );
      if (toolEntry) {
        e.preventDefault();
        handleToolSelect(toolEntry[0] as AnnotationTool);
      }
    },
    [onUndo, onRedo, onZoomIn, onZoomOut, handleToolSelect]
  );

  // Add keyboard event listeners
  React.useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const ToolButton = ({ tool }: { tool: AnnotationTool }) => {
    const config = toolConfig[tool];
    const Icon = config.icon;
    const isActive = activeTool === tool;

    return (
      <Tooltip.Provider>
        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <Button
              variant={isActive ? "default" : "ghost"}
              size="sm"
              onClick={() => handleToolSelect(tool)}
              className={cn(
                "h-9 w-9 p-0 transition-all duration-200",
                isActive && "bg-primary text-primary-foreground shadow-sm",
                !isActive && "hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="sr-only">{config.label}</span>
            </Button>
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content
              className="z-50 overflow-hidden rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground animate-in fade-in-0 zoom-in-95"
              sideOffset={5}
            >
              {config.label}
              {config.shortcut && (
                <span className="ml-2 text-xs opacity-60">
                  {config.shortcut}
                </span>
              )}
              <Tooltip.Arrow className="fill-primary" />
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>
      </Tooltip.Provider>
    );
  };

  return (
    <div
      className={cn(
        "flex items-center gap-1 bg-white border-2 border-gray-200 rounded-lg shadow-lg",
        isFloating && "fixed left-1/2 transform -translate-x-1/2 z-40",
        position === "top" && isFloating && "top-20",
        position === "bottom" && isFloating && "bottom-6",
        !isFloating && "relative",
        className
      )}
    >
      <div className="flex items-center gap-1 p-2">
        {/* Selection Tools */}
        <div className="flex items-center gap-1">
          {toolGroups.selection.tools.map((tool) => (
            <ToolButton key={tool} tool={tool} />
          ))}
        </div>

        <Separator className="w-px h-6 mx-1" />

        {/* Annotation Tools */}
        <div className="flex items-center gap-1">
          {toolGroups.annotation.tools.map((tool) => (
            <ToolButton key={tool} tool={tool} />
          ))}
        </div>

        <Separator className="w-px h-6 mx-1" />

        {/* Shape Tools */}
        <div className="flex items-center gap-1">
          {toolGroups.shapes.tools.map((tool) => (
            <ToolButton key={tool} tool={tool} />
          ))}
        </div>

        <Separator className="w-px h-6 mx-1" />

        {/* Content Tools */}
        <div className="flex items-center gap-1">
          {toolGroups.content.tools.map((tool) => (
            <ToolButton key={tool} tool={tool} />
          ))}
        </div>

        <Separator className="w-px h-6 mx-1" />

        {/* Color Picker */}
        <Tooltip.Provider>
          <Tooltip.Root
            open={showColorPicker}
            onOpenChange={setShowColorPicker}
          >
            <Tooltip.Trigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0 relative"
                onClick={() => setShowColorPicker(!showColorPicker)}
              >
                <Palette className="h-4 w-4" />
                <div
                  className="absolute bottom-1 right-1 w-2 h-2 rounded-full border border-background"
                  style={{ backgroundColor: selectedColor }}
                />
                <span className="sr-only">Color picker</span>
              </Button>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content
                className="z-50 overflow-hidden rounded-md bg-popover p-2 text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95"
                sideOffset={5}
              >
                <div className="grid grid-cols-4 gap-1">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      className={cn(
                        "w-6 h-6 rounded border-2 transition-all hover:scale-110",
                        selectedColor === color
                          ? "border-primary"
                          : "border-transparent"
                      )}
                      style={{ backgroundColor: color }}
                      onClick={() => handleColorSelect(color)}
                    />
                  ))}
                </div>
                <Tooltip.Arrow className="fill-popover" />
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Provider>

        <Separator className="w-px h-6 mx-1" />

        {/* Action Tools */}
        <div className="flex items-center gap-1">
          <Tooltip.Provider>
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onUndo}
                  disabled={!canUndo}
                  className="h-9 w-9 p-0"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span className="sr-only">Undo</span>
                </Button>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content
                  className="z-50 overflow-hidden rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground animate-in fade-in-0 zoom-in-95"
                  sideOffset={5}
                >
                  Undo
                  <span className="ml-2 text-xs opacity-60">⌘Z</span>
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
                  onClick={onRedo}
                  disabled={!canRedo}
                  className="h-9 w-9 p-0"
                >
                  <RotateCw className="h-4 w-4" />
                  <span className="sr-only">Redo</span>
                </Button>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content
                  className="z-50 overflow-hidden rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground animate-in fade-in-0 zoom-in-95"
                  sideOffset={5}
                >
                  Redo
                  <span className="ml-2 text-xs opacity-60">⌘⇧Z</span>
                  <Tooltip.Arrow className="fill-primary" />
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
          </Tooltip.Provider>
        </div>

        <Separator className="w-px h-6 mx-1" />

        {/* Zoom Controls */}
        <div className="flex items-center gap-1">
          <Tooltip.Provider>
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onZoomOut}
                  className="h-9 w-9 p-0"
                >
                  <ZoomOut className="h-4 w-4" />
                  <span className="sr-only">Zoom out</span>
                </Button>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content
                  className="z-50 overflow-hidden rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground animate-in fade-in-0 zoom-in-95"
                  sideOffset={5}
                >
                  Zoom Out
                  <span className="ml-2 text-xs opacity-60">⌘-</span>
                  <Tooltip.Arrow className="fill-primary" />
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
          </Tooltip.Provider>

          <div className="px-2 py-1 text-xs font-medium text-muted-foreground min-w-[3rem] text-center">
            {Math.round(zoomLevel)}%
          </div>

          <Tooltip.Provider>
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onZoomIn}
                  className="h-9 w-9 p-0"
                >
                  <ZoomIn className="h-4 w-4" />
                  <span className="sr-only">Zoom in</span>
                </Button>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content
                  className="z-50 overflow-hidden rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground animate-in fade-in-0 zoom-in-95"
                  sideOffset={5}
                >
                  Zoom In
                  <span className="ml-2 text-xs opacity-60">⌘+</span>
                  <Tooltip.Arrow className="fill-primary" />
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
          </Tooltip.Provider>
        </div>

        <Separator className="w-px h-6 mx-1" />

        {/* Export */}
        <Tooltip.Provider>
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onExport}
                className="h-9 w-9 p-0"
              >
                <Download className="h-4 w-4" />
                <span className="sr-only">Export</span>
              </Button>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content
                className="z-50 overflow-hidden rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground animate-in fade-in-0 zoom-in-95"
                sideOffset={5}
              >
                Export PDF
                <Tooltip.Arrow className="fill-primary" />
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Provider>
      </div>
    </div>
  );
}
