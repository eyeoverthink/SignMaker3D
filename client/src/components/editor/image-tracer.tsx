import { useRef, useEffect, useState, useCallback } from "react";
import { useEditorStore } from "@/lib/editor-store";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Upload, Wand2 } from "lucide-react";
import type { SketchPath } from "@shared/schema";

export function ImageTracer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [threshold, setThreshold] = useState(128);
  const [simplify, setSimplify] = useState(2);
  const [isProcessing, setIsProcessing] = useState(false);

  const { uploadedImageData, setTracedPaths, addSketchPath, showGrid } = useEditorStore();

  const traceImage = useCallback(() => {
    const canvas = canvasRef.current;
    const preview = previewRef.current;
    if (!canvas || !preview || !uploadedImageData) return;

    setIsProcessing(true);

    const img = new Image();
    img.onload = () => {
      const maxSize = 400;
      const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
      const width = Math.floor(img.width * scale);
      const height = Math.floor(img.height * scale);

      canvas.width = width;
      canvas.height = height;
      preview.width = width;
      preview.height = height;

      const ctx = canvas.getContext('2d');
      const previewCtx = preview.getContext('2d');
      if (!ctx || !previewCtx) return;

      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const gray = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
        const binary = gray < threshold ? 0 : 255;
        data[i] = binary;
        data[i + 1] = binary;
        data[i + 2] = binary;
      }

      ctx.putImageData(imageData, 0, 0);

      const contours = extractContours(data, width, height, simplify);

      previewCtx.fillStyle = '#1a1a2e';
      previewCtx.fillRect(0, 0, width, height);

      previewCtx.strokeStyle = '#ff6b9d';
      previewCtx.lineWidth = 3;
      previewCtx.lineCap = 'round';
      previewCtx.lineJoin = 'round';
      previewCtx.shadowColor = '#ff6b9d';
      previewCtx.shadowBlur = 10;

      const paths: SketchPath[] = [];
      const centerX = width / 2;
      const centerY = height / 2;

      for (const contour of contours) {
        if (contour.length < 4) continue;

        previewCtx.beginPath();
        previewCtx.moveTo(contour[0].x, contour[0].y);
        
        for (let i = 1; i < contour.length; i++) {
          previewCtx.lineTo(contour[i].x, contour[i].y);
        }
        
        previewCtx.stroke();

        const normalizedPoints = contour.map(p => ({
          x: (p.x - centerX) * 0.5,
          y: (centerY - p.y) * 0.5,
        }));

        paths.push({
          id: `traced-${Date.now()}-${paths.length}`,
          points: normalizedPoints,
          closed: true,
        });
      }

      previewCtx.shadowBlur = 0;
      setTracedPaths(paths);
      setIsProcessing(false);
    };

    img.src = uploadedImageData;
  }, [uploadedImageData, threshold, simplify, setTracedPaths]);

  const applyTracedPaths = useCallback(() => {
    const { tracedPaths } = useEditorStore.getState();
    for (const path of tracedPaths) {
      addSketchPath(path);
    }
    useEditorStore.getState().setInputMode("draw");
  }, [addSketchPath]);

  useEffect(() => {
    if (uploadedImageData) {
      traceImage();
    }
  }, [uploadedImageData, traceImage]);

  if (!uploadedImageData) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted/30">
        <div className="text-center p-8">
          <Upload className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Upload an Image</h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            Upload a photo of handwriting, a drawing, or any shape to trace it into neon tube paths.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-full flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4 bg-muted/30">
        <div className="relative">
          <canvas ref={canvasRef} className="hidden" />
          <canvas
            ref={previewRef}
            className="max-w-full max-h-full rounded-lg shadow-lg"
            data-testid="image-preview-canvas"
          />
          {isProcessing && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg">
              <div className="text-sm text-muted-foreground">Processing...</div>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 border-t bg-card space-y-4">
        <div className="flex gap-6">
          <div className="flex-1 space-y-2">
            <div className="flex justify-between">
              <Label className="text-sm">Threshold</Label>
              <span className="text-xs text-muted-foreground">{threshold}</span>
            </div>
            <Slider
              value={[threshold]}
              onValueChange={([v]) => setThreshold(v)}
              min={50}
              max={200}
              step={5}
              data-testid="slider-threshold"
            />
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex justify-between">
              <Label className="text-sm">Simplify</Label>
              <span className="text-xs text-muted-foreground">{simplify}</span>
            </div>
            <Slider
              value={[simplify]}
              onValueChange={([v]) => setSimplify(v)}
              min={1}
              max={10}
              step={1}
              data-testid="slider-simplify"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={traceImage}
            disabled={isProcessing}
            data-testid="button-retrace"
          >
            <Wand2 className="h-4 w-4 mr-2" />
            Re-trace
          </Button>
          <Button
            variant="default"
            className="flex-1"
            onClick={applyTracedPaths}
            disabled={isProcessing}
            data-testid="button-apply-trace"
          >
            Apply Traced Paths
          </Button>
        </div>
      </div>
    </div>
  );
}

function extractContours(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  simplify: number
): { x: number; y: number }[][] {
  const contours: { x: number; y: number }[][] = [];
  const visited = new Set<number>();

  const getPixel = (x: number, y: number): boolean => {
    if (x < 0 || x >= width || y < 0 || y >= height) return false;
    const idx = (y * width + x) * 4;
    return data[idx] === 0;
  };

  const isEdge = (x: number, y: number): boolean => {
    if (!getPixel(x, y)) return false;
    return !getPixel(x - 1, y) || !getPixel(x + 1, y) || 
           !getPixel(x, y - 1) || !getPixel(x, y + 1);
  };

  for (let y = 0; y < height; y += simplify) {
    for (let x = 0; x < width; x += simplify) {
      const key = y * width + x;
      if (visited.has(key)) continue;
      if (!isEdge(x, y)) continue;

      const contour: { x: number; y: number }[] = [];
      let cx = x, cy = y;
      const directions = [
        [1, 0], [1, 1], [0, 1], [-1, 1],
        [-1, 0], [-1, -1], [0, -1], [1, -1]
      ];

      let steps = 0;
      const maxSteps = 10000;

      while (steps < maxSteps) {
        const ckey = cy * width + cx;
        if (visited.has(ckey)) break;
        visited.add(ckey);

        if (steps % simplify === 0) {
          contour.push({ x: cx, y: cy });
        }

        let found = false;
        for (const [dx, dy] of directions) {
          const nx = cx + dx * simplify;
          const ny = cy + dy * simplify;
          const nkey = ny * width + nx;
          
          if (!visited.has(nkey) && isEdge(nx, ny)) {
            cx = nx;
            cy = ny;
            found = true;
            break;
          }
        }

        if (!found) break;
        steps++;
      }

      if (contour.length >= 4) {
        contours.push(contour);
      }
    }
  }

  return contours;
}
