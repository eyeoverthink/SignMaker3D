import { useRef, useEffect, useCallback, useState } from "react";
import { useEditorStore } from "@/lib/editor-store";
import type { SketchPath } from "@shared/schema";

export function DrawingCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>([]);
  
  const { sketchPaths, addSketchPath, showGrid } = useEditorStore();

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

  const handlePointerDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const point = getCanvasPoint(e);
    if (!point) return;

    setIsDrawing(true);
    setCurrentPath([point]);
  }, [getCanvasPoint]);

  const handlePointerMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;

    const point = getCanvasPoint(e);
    if (!point) return;

    setCurrentPath(prev => [...prev, point]);
  }, [isDrawing, getCanvasPoint]);

  const handlePointerUp = useCallback(() => {
    if (!isDrawing || currentPath.length < 2) {
      setIsDrawing(false);
      setCurrentPath([]);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const scale = 0.5;

    const normalizedPoints = currentPath.map(p => ({
      x: (p.x - centerX) * scale,
      y: (centerY - p.y) * scale,
    }));

    const newPath: SketchPath = {
      id: `path-${Date.now()}`,
      points: normalizedPoints,
      closed: false,
    };

    addSketchPath(newPath);
    setIsDrawing(false);
    setCurrentPath([]);
  }, [isDrawing, currentPath, addSketchPath]);

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
    ctx.lineWidth = 8;
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

      ctx.stroke();
    }

    if (currentPath.length > 1) {
      ctx.strokeStyle = '#00ff88';
      ctx.shadowColor = '#00ff88';
      
      ctx.beginPath();
      ctx.moveTo(currentPath[0].x, currentPath[0].y);

      for (let i = 1; i < currentPath.length; i++) {
        ctx.lineTo(currentPath[i].x, currentPath[i].y);
      }

      ctx.stroke();
    }

    ctx.shadowBlur = 0;
  }, [sketchPaths, currentPath, showGrid]);

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
      
      <div className="absolute top-4 left-4 bg-card/80 backdrop-blur-sm rounded px-3 py-2 text-sm">
        <span className="text-muted-foreground">Paths: </span>
        <span className="font-mono">{sketchPaths.length}</span>
      </div>
    </div>
  );
}
