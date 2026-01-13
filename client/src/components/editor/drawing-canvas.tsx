import { useRef, useEffect, useCallback, useState } from "react";
import { useEditorStore } from "@/lib/editor-store";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Undo2, Trash2, Pencil, Circle, Minus, Square } from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { SketchPath } from "@shared/schema";

type DrawingTool = "freehand" | "line" | "circle" | "rectangle";

export function DrawingCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>([]);
  const [brushSize, setBrushSize] = useState(8);
  const [activeTool, setActiveTool] = useState<DrawingTool>("freehand");
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  
  const { sketchPaths, addSketchPath, removeSketchPath, setSketchPaths, showGrid } = useEditorStore();

  const getCanvasPoint = useCallback((e: React.MouseEvent | React.TouchEvent): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  }, []);

  const smoothPath = useCallback((points: { x: number; y: number }[]): { x: number; y: number }[] => {
    if (points.length < 3) return points;
    
    const smoothed: { x: number; y: number }[] = [points[0]];
    
    for (let i = 1; i < points.length - 1; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const next = points[i + 1];
      
      smoothed.push({
        x: (prev.x + curr.x * 2 + next.x) / 4,
        y: (prev.y + curr.y * 2 + next.y) / 4,
      });
    }
    
    smoothed.push(points[points.length - 1]);
    return smoothed;
  }, []);

  const generateShapePoints = useCallback((
    start: { x: number; y: number },
    end: { x: number; y: number },
    tool: DrawingTool
  ): { x: number; y: number }[] => {
    if (tool === "line") {
      return [start, end];
    }
    
    if (tool === "circle") {
      const cx = (start.x + end.x) / 2;
      const cy = (start.y + end.y) / 2;
      const rx = Math.abs(end.x - start.x) / 2;
      const ry = Math.abs(end.y - start.y) / 2;
      
      const points: { x: number; y: number }[] = [];
      const segments = 32;
      
      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        points.push({
          x: cx + Math.cos(angle) * rx,
          y: cy + Math.sin(angle) * ry,
        });
      }
      
      return points;
    }
    
    if (tool === "rectangle") {
      return [
        start,
        { x: end.x, y: start.y },
        end,
        { x: start.x, y: end.y },
        start,
      ];
    }
    
    return [start, end];
  }, []);

  const handlePointerDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const point = getCanvasPoint(e);
    if (!point) return;

    setIsDrawing(true);
    setStartPoint(point);
    
    if (activeTool === "freehand") {
      setCurrentPath([point]);
    } else {
      setCurrentPath([point, point]);
    }
  }, [getCanvasPoint, activeTool]);

  const handlePointerMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;

    const point = getCanvasPoint(e);
    if (!point) return;

    if (activeTool === "freehand") {
      setCurrentPath(prev => [...prev, point]);
    } else if (startPoint) {
      setCurrentPath(generateShapePoints(startPoint, point, activeTool));
    }
  }, [isDrawing, getCanvasPoint, activeTool, startPoint, generateShapePoints]);

  const handlePointerUp = useCallback(() => {
    if (!isDrawing || currentPath.length < 2) {
      setIsDrawing(false);
      setCurrentPath([]);
      setStartPoint(null);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Check minimum path length/size to avoid degenerate geometry
    const minDistance = 10; // pixels
    let totalDistance = 0;
    
    if (activeTool === "freehand") {
      for (let i = 1; i < currentPath.length; i++) {
        const dx = currentPath[i].x - currentPath[i-1].x;
        const dy = currentPath[i].y - currentPath[i-1].y;
        totalDistance += Math.sqrt(dx * dx + dy * dy);
      }
    } else if (startPoint && currentPath.length >= 2) {
      const endPoint = currentPath[currentPath.length - 1];
      const dx = endPoint.x - startPoint.x;
      const dy = endPoint.y - startPoint.y;
      totalDistance = Math.sqrt(dx * dx + dy * dy);
    }
    
    if (totalDistance < minDistance) {
      setIsDrawing(false);
      setCurrentPath([]);
      setStartPoint(null);
      return;
    }

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const scale = 0.5;

    let finalPath = currentPath;
    if (activeTool === "freehand") {
      finalPath = smoothPath(currentPath);
    }

    const normalizedPoints = finalPath.map(p => ({
      x: (p.x - centerX) * scale,
      y: (centerY - p.y) * scale,
    }));

    const newPath: SketchPath = {
      id: `path-${Date.now()}`,
      points: normalizedPoints,
      closed: activeTool === "circle" || activeTool === "rectangle",
    };

    addSketchPath(newPath);
    setIsDrawing(false);
    setCurrentPath([]);
    setStartPoint(null);
  }, [isDrawing, currentPath, addSketchPath, activeTool, smoothPath, startPoint]);

  const handleUndo = useCallback(() => {
    if (sketchPaths.length > 0) {
      const lastPath = sketchPaths[sketchPaths.length - 1];
      removeSketchPath(lastPath.id);
    }
  }, [sketchPaths, removeSketchPath]);

  const handleClear = useCallback(() => {
    setSketchPaths([]);
  }, [setSketchPaths]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resizeObserver = new ResizeObserver(() => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    });

    resizeObserver.observe(container);
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;

    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (showGrid) {
      ctx.strokeStyle = '#2a2a4e';
      ctx.lineWidth = 1;
      const gridSize = 20;

      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }

      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      ctx.strokeStyle = '#3a3a5e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2, 0);
      ctx.lineTo(canvas.width / 2, canvas.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, canvas.height / 2);
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
    }

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const scale = 2;

    ctx.strokeStyle = '#ff6b9d';
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = '#ff6b9d';
    ctx.shadowBlur = 15;

    for (const path of sketchPaths) {
      if (path.points.length < 2) continue;

      ctx.beginPath();
      const firstPoint = path.points[0];
      ctx.moveTo(centerX + firstPoint.x * scale, centerY - firstPoint.y * scale);

      for (let i = 1; i < path.points.length; i++) {
        const point = path.points[i];
        ctx.lineTo(centerX + point.x * scale, centerY - point.y * scale);
      }

      if (path.closed) {
        ctx.closePath();
      }

      ctx.stroke();
    }

    if (currentPath.length > 1) {
      ctx.strokeStyle = '#00ff88';
      ctx.shadowColor = '#00ff88';
      ctx.lineWidth = brushSize;
      
      ctx.beginPath();
      ctx.moveTo(currentPath[0].x, currentPath[0].y);

      for (let i = 1; i < currentPath.length; i++) {
        ctx.lineTo(currentPath[i].x, currentPath[i].y);
      }

      if (activeTool === "circle" || activeTool === "rectangle") {
        ctx.closePath();
      }

      ctx.stroke();
    }

    ctx.shadowBlur = 0;
  }, [sketchPaths, currentPath, showGrid, brushSize, activeTool]);

  const tools: { id: DrawingTool; icon: typeof Pencil; label: string }[] = [
    { id: "freehand", icon: Pencil, label: "Freehand" },
    { id: "line", icon: Minus, label: "Line" },
    { id: "circle", icon: Circle, label: "Circle/Oval" },
    { id: "rectangle", icon: Square, label: "Rectangle" },
  ];

  return (
    <div ref={containerRef} className="w-full h-full relative">
      <canvas
        ref={canvasRef}
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
        className="w-full h-full cursor-crosshair touch-none"
        data-testid="drawing-canvas"
      />
      
      <div className="absolute top-4 left-4 flex flex-col gap-3">
        <div className="bg-card/90 backdrop-blur-sm rounded-lg p-3 border shadow-lg">
          <div className="flex gap-1 mb-3">
            {tools.map((tool) => (
              <Tooltip key={tool.id}>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant={activeTool === tool.id ? "default" : "ghost"}
                    onClick={() => setActiveTool(tool.id)}
                    data-testid={`tool-${tool.id}`}
                  >
                    <tool.icon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>{tool.label}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-xs">Brush Size</Label>
              <span className="text-xs text-muted-foreground font-mono">{brushSize}px</span>
            </div>
            <Slider
              value={[brushSize]}
              onValueChange={([v]) => setBrushSize(v)}
              min={2}
              max={20}
              step={1}
              className="w-32"
              data-testid="slider-brush-size"
            />
          </div>
        </div>
        
        <div className="bg-card/90 backdrop-blur-sm rounded-lg p-2 border shadow-lg flex gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                onClick={handleUndo}
                disabled={sketchPaths.length === 0}
                data-testid="button-undo"
              >
                <Undo2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Undo Last Stroke</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                onClick={handleClear}
                disabled={sketchPaths.length === 0}
                data-testid="button-clear"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Clear Canvas</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      <div className="absolute top-4 right-4 bg-card/90 backdrop-blur-sm rounded-lg px-3 py-2 border shadow-lg">
        <span className="text-xs text-muted-foreground">Strokes: </span>
        <span className="text-sm font-mono">{sketchPaths.length}</span>
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-card/90 backdrop-blur-sm rounded-lg px-4 py-2 border shadow-lg">
        <p className="text-xs text-muted-foreground text-center">
          {activeTool === "freehand" 
            ? "Draw freely to create your neon sign path"
            : activeTool === "line"
            ? "Click and drag to draw a straight line"
            : activeTool === "circle"
            ? "Click and drag to draw a circle or oval"
            : "Click and drag to draw a rectangle"
          }
        </p>
      </div>
    </div>
  );
}
