import { useRef, useEffect, useState, useCallback } from "react";
import { useEditorStore } from "@/lib/editor-store";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Upload, Wand2, Image as ImageIcon, X, Check } from "lucide-react";
import type { SketchPath } from "@shared/schema";

export function ImageTracer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [threshold, setThreshold] = useState(128);
  const [simplify, setSimplify] = useState(2);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pathsApplied, setPathsApplied] = useState(false);

  const { uploadedImageData, setUploadedImageData, setTracedPaths, tracedPaths, sketchPaths, showGrid } = useEditorStore();

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setPathsApplied(false);
    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadedImageData(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, [setUploadedImageData]);

  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const traceImage = useCallback(() => {
    const canvas = canvasRef.current;
    const preview = previewRef.current;
    if (!canvas || !preview || !uploadedImageData) return;

    setIsProcessing(true);

    const img = new Image();
    img.onload = () => {
      const maxSize = 600;
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
      
      // Convert to grayscale array for edge detection
      const gray = new Float32Array(width * height);
      for (let i = 0; i < data.length; i += 4) {
        gray[i / 4] = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      }
      
      // Apply Sobel edge detection for sharper edges
      const edges = new Float32Array(width * height);
      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          const idx = y * width + x;
          // Sobel kernels
          const gx = 
            -gray[(y-1)*width + (x-1)] + gray[(y-1)*width + (x+1)] +
            -2*gray[y*width + (x-1)] + 2*gray[y*width + (x+1)] +
            -gray[(y+1)*width + (x-1)] + gray[(y+1)*width + (x+1)];
          const gy = 
            -gray[(y-1)*width + (x-1)] - 2*gray[(y-1)*width + x] - gray[(y-1)*width + (x+1)] +
            gray[(y+1)*width + (x-1)] + 2*gray[(y+1)*width + x] + gray[(y+1)*width + (x+1)];
          edges[idx] = Math.sqrt(gx * gx + gy * gy);
        }
      }
      
      // Find max edge value for normalization
      let maxEdge = 0;
      for (let i = 0; i < edges.length; i++) {
        if (edges[i] > maxEdge) maxEdge = edges[i];
      }
      
      // Apply threshold to edges
      const edgeThreshold = (threshold / 255) * maxEdge * 0.5;
      for (let i = 0; i < data.length; i += 4) {
        const edgeVal = edges[i / 4];
        const binary = edgeVal > edgeThreshold ? 0 : 255;
        data[i] = binary;
        data[i + 1] = binary;
        data[i + 2] = binary;
      }

      ctx.putImageData(imageData, 0, 0);

      const contours = extractContours(data, width, height, simplify);

      // Draw sharp preview
      previewCtx.fillStyle = '#0f0f1a';
      previewCtx.fillRect(0, 0, width, height);

      const paths: SketchPath[] = [];
      const centerX = width / 2;
      const centerY = height / 2;

      for (const contour of contours) {
        if (contour.length < 3) continue;

        // Draw crisp lines without blur
        previewCtx.strokeStyle = '#00ff88';
        previewCtx.lineWidth = 2;
        previewCtx.lineCap = 'round';
        previewCtx.lineJoin = 'round';
        
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

      setTracedPaths(paths);
      setIsProcessing(false);
    };

    img.src = uploadedImageData;
  }, [uploadedImageData, threshold, simplify, setTracedPaths]);

  const applyTracedPaths = useCallback(() => {
    const { tracedPaths, setSketchPaths } = useEditorStore.getState();
    // Replace existing paths with traced paths - keep in image mode for export
    setSketchPaths(tracedPaths);
    setPathsApplied(true);
    // Don't switch to draw mode - stay in image mode so export uses traced paths
  }, []);

  useEffect(() => {
    if (uploadedImageData) {
      traceImage();
    }
  }, [uploadedImageData, traceImage]);

  if (!uploadedImageData) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted/30">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          data-testid="input-image-file"
        />
        <div 
          className="text-center p-12 border-2 border-dashed border-muted-foreground/30 rounded-xl cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors max-w-md"
          onClick={openFilePicker}
          data-testid="upload-drop-zone"
        >
          <div className="bg-primary/10 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <ImageIcon className="h-10 w-10 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Click to Upload Image</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Upload a photo of handwriting, a logo, or any shape to trace it into neon tube paths
          </p>
          <Button 
            variant="default" 
            size="lg"
            onClick={(e) => {
              e.stopPropagation();
              openFilePicker();
            }}
            data-testid="button-upload-image"
          >
            <Upload className="h-4 w-4 mr-2" />
            Choose Image
          </Button>
          <p className="text-xs text-muted-foreground mt-4">
            Supports JPG, PNG, GIF, SVG
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
              <Label className="text-sm">Edge Sensitivity</Label>
              <span className="text-xs text-muted-foreground">{threshold}</span>
            </div>
            <Slider
              value={[threshold]}
              onValueChange={([v]) => setThreshold(v)}
              min={20}
              max={200}
              step={5}
              data-testid="slider-threshold"
            />
            <p className="text-xs text-muted-foreground">Lower = more edges detected</p>
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex justify-between">
              <Label className="text-sm">Detail Level</Label>
              <span className="text-xs text-muted-foreground">{simplify}</span>
            </div>
            <Slider
              value={[simplify]}
              onValueChange={([v]) => setSimplify(v)}
              min={1}
              max={5}
              step={1}
              data-testid="slider-simplify"
            />
            <p className="text-xs text-muted-foreground">Lower = more detail</p>
          </div>
        </div>

        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            data-testid="input-image-file-change"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setUploadedImageData(null);
              setTracedPaths([]);
              setPathsApplied(false);
            }}
            data-testid="button-clear-image"
            title="Remove image"
          >
            <X className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            onClick={openFilePicker}
            disabled={isProcessing}
            data-testid="button-change-image"
          >
            <Upload className="h-4 w-4 mr-2" />
            Change
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setPathsApplied(false);
              traceImage();
            }}
            disabled={isProcessing}
            data-testid="button-retrace"
          >
            <Wand2 className="h-4 w-4 mr-2" />
            Re-trace
          </Button>
          <Button
            variant={pathsApplied ? "outline" : "default"}
            className="flex-1"
            onClick={applyTracedPaths}
            disabled={isProcessing || tracedPaths.length === 0}
            data-testid="button-apply-trace"
          >
            {pathsApplied ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Paths Ready ({sketchPaths.length}) - Export Now
              </>
            ) : (
              `Apply Traced Paths (${tracedPaths.length})`
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Moore-Neighbor Tracing Algorithm (like maze solving)
// Follows the boundary of shapes by always keeping the edge on one side
function extractContours(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  simplify: number
): { x: number; y: number }[][] {
  const contours: { x: number; y: number }[][] = [];
  const visited = new Uint8Array(width * height); // Track visited pixels
  
  // Check if pixel is foreground (black = edge)
  const isForeground = (x: number, y: number): boolean => {
    if (x < 0 || x >= width || y < 0 || y >= height) return false;
    const idx = (y * width + x) * 4;
    return data[idx] === 0; // Black pixels are edges
  };

  // Moore neighborhood: 8-connected neighbors in clockwise order
  // Starting from right, going clockwise: E, SE, S, SW, W, NW, N, NE
  const directions = [
    [1, 0],   // E
    [1, 1],   // SE
    [0, 1],   // S
    [-1, 1],  // SW
    [-1, 0],  // W
    [-1, -1], // NW
    [0, -1],  // N
    [1, -1]   // NE
  ];

  // Find starting point for a contour (leftmost foreground pixel)
  const findStart = (): [number, number] | null => {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        if (isForeground(x, y) && visited[idx] === 0) {
          return [x, y];
        }
      }
    }
    return null;
  };

  // Trace boundary using Moore-Neighbor algorithm
  const traceBoundary = (startX: number, startY: number): { x: number; y: number }[] => {
    const boundary: { x: number; y: number }[] = [];
    let x = startX;
    let y = startY;
    let dir = 0; // Start searching from East
    
    const startIdx = y * width + x;
    let steps = 0;
    const maxSteps = width * height; // Prevent infinite loops
    
    do {
      // Mark as visited
      visited[y * width + x] = 1;
      
      // Add point to boundary (with simplification)
      if (steps % Math.max(1, simplify) === 0) {
        boundary.push({ x, y });
      }
      
      // Search for next boundary pixel using Moore neighborhood
      // Start from the direction we came from + 2 (to stay on boundary)
      let searchDir = (dir + 5) % 8; // Start 90° counter-clockwise from where we came
      let found = false;
      
      for (let i = 0; i < 8; i++) {
        const checkDir = (searchDir + i) % 8;
        const [dx, dy] = directions[checkDir];
        const nx = x + dx;
        const ny = y + dy;
        
        if (isForeground(nx, ny)) {
          // Found next boundary pixel
          x = nx;
          y = ny;
          dir = checkDir;
          found = true;
          break;
        }
      }
      
      if (!found) break; // Dead end
      steps++;
      
      // Stop if we've returned to start
      if (steps > 2 && x === startX && y === startY) break;
      
    } while (steps < maxSteps);
    
    return boundary;
  };

  // Find and trace all contours
  let start = findStart();
  while (start !== null) {
    const [x, y] = start;
    const contour = traceBoundary(x, y);
    
    // Only keep contours with enough points
    if (contour.length >= 4) {
      // Simplify using Douglas-Peucker if needed
      const simplified = simplifyPath(contour, simplify * 0.5);
      if (simplified.length >= 3) {
        contours.push(simplified);
      }
    }
    
    start = findStart();
  }

  return contours;
}

// Douglas-Peucker path simplification algorithm
function simplifyPath(points: { x: number; y: number }[], tolerance: number): { x: number; y: number }[] {
  if (points.length <= 2) return points;
  
  // Find point with maximum distance from line between first and last
  let maxDist = 0;
  let maxIndex = 0;
  const first = points[0];
  const last = points[points.length - 1];
  
  for (let i = 1; i < points.length - 1; i++) {
    const dist = perpendicularDistance(points[i], first, last);
    if (dist > maxDist) {
      maxDist = dist;
      maxIndex = i;
    }
  }
  
  // If max distance is greater than tolerance, recursively simplify
  if (maxDist > tolerance) {
    const left = simplifyPath(points.slice(0, maxIndex + 1), tolerance);
    const right = simplifyPath(points.slice(maxIndex), tolerance);
    return [...left.slice(0, -1), ...right];
  } else {
    return [first, last];
  }
}

// Calculate perpendicular distance from point to line
function perpendicularDistance(
  point: { x: number; y: number },
  lineStart: { x: number; y: number },
  lineEnd: { x: number; y: number }
): number {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const norm = Math.sqrt(dx * dx + dy * dy);
  
  if (norm === 0) {
    return Math.sqrt(
      (point.x - lineStart.x) ** 2 + (point.y - lineStart.y) ** 2
    );
  }
  
  return Math.abs(
    dy * point.x - dx * point.y + lineEnd.x * lineStart.y - lineEnd.y * lineStart.x
  ) / norm;
}
