import { useState, useRef, useEffect } from "react";
import { useEditorStore } from "@/lib/editor-store";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Image as ImageIcon, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ShoeStringEditorUI } from "./shoe-string-editor-ui";

type DrawingTool = 'freehand' | 'line' | 'bezier' | 'pan';
type TracingMode = 'auto' | 'manual';

export function ShoeStringEditor() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [tracedPaths, setTracedPaths] = useState<any[]>([]);
  const [manualPaths, setManualPaths] = useState<any[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const { toast } = useToast();

  // Mode and tool state
  const [tracingMode, setTracingMode] = useState<TracingMode>('manual');
  const [activeTool, setActiveTool] = useState<DrawingTool>('freehand');
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<{x: number, y: number}[]>([]);
  const [lineStartPoint, setLineStartPoint] = useState<{x: number, y: number} | null>(null);

  // Settings state
  const [simplificationLevel, setSimplificationLevel] = useState(5);
  const [edgeThreshold, setEdgeThreshold] = useState(128);
  const [minPathLength, setMinPathLength] = useState(20);
  const [tubeDiameter, setTubeDiameter] = useState(15);
  const [tubeStyle, setTubeStyle] = useState<"outline" | "filled" | "sketch">("outline");
  const [autoSimplify, setAutoSimplify] = useState(true);
  const [preserveDetails, setPreserveDetails] = useState(false);
  const [invertColors, setInvertColors] = useState(false);
  const [imageOpacity, setImageOpacity] = useState(0.5);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const imgSrc = event.target?.result as string;
      setUploadedImage(imgSrc);
      
      // Load image for manual tracing
      const img = new Image();
      img.src = imgSrc;
      img.onload = () => {
        imageRef.current = img;
        
        // Set canvas size to match image (or constrain to max size)
        const canvas = canvasRef.current;
        if (canvas) {
          const maxWidth = 800;
          const maxHeight = 600;
          let width = img.width;
          let height = img.height;
          
          // Scale down if too large
          if (width > maxWidth || height > maxHeight) {
            const scale = Math.min(maxWidth / width, maxHeight / height);
            width = width * scale;
            height = height * scale;
          }
          
          canvas.width = width;
          canvas.height = height;
          drawCanvas();
        }
      };
    };
    reader.readAsDataURL(file);
  };

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background image if in manual mode
    if (tracingMode === 'manual' && imageRef.current) {
      ctx.globalAlpha = imageOpacity;
      ctx.drawImage(imageRef.current, 0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = 1.0;
    }

    // Draw all manual paths
    ctx.strokeStyle = '#8b5cf6';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const pathsToDraw = tracingMode === 'manual' ? manualPaths : tracedPaths;
    pathsToDraw.forEach(path => {
      if (path.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(path[0].x, path[0].y);
      for (let i = 1; i < path.length; i++) {
        ctx.lineTo(path[i].x, path[i].y);
      }
      ctx.stroke();
    });

    // Draw current path being drawn
    if (currentPath.length > 0) {
      ctx.strokeStyle = '#a78bfa';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(currentPath[0].x, currentPath[0].y);
      for (let i = 1; i < currentPath.length; i++) {
        ctx.lineTo(currentPath[i].x, currentPath[i].y);
      }
      ctx.stroke();
    }

    // Draw line start point
    if (lineStartPoint && activeTool === 'line') {
      ctx.fillStyle = '#8b5cf6';
      ctx.beginPath();
      ctx.arc(lineStartPoint.x, lineStartPoint.y, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  useEffect(() => {
    drawCanvas();
  }, [manualPaths, currentPath, lineStartPoint, imageOpacity, tracingMode]);

  const getCanvasPoint = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height)
    };
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (tracingMode !== 'manual') return;
    
    const point = getCanvasPoint(e);

    if (activeTool === 'freehand') {
      setIsDrawing(true);
      setCurrentPath([point]);
    } else if (activeTool === 'line') {
      if (!lineStartPoint) {
        setLineStartPoint(point);
      } else {
        // Complete the line
        const newPath = [lineStartPoint, point];
        setManualPaths([...manualPaths, newPath]);
        setLineStartPoint(null);
      }
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (tracingMode !== 'manual') return;
    
    const point = getCanvasPoint(e);

    if (activeTool === 'freehand' && isDrawing) {
      setCurrentPath([...currentPath, point]);
    } else if (activeTool === 'line' && lineStartPoint) {
      // Show preview line
      setCurrentPath([lineStartPoint, point]);
    }
  };

  const handleCanvasMouseUp = () => {
    if (tracingMode !== 'manual') return;

    if (activeTool === 'freehand' && isDrawing) {
      if (currentPath.length > 2) {
        setManualPaths([...manualPaths, currentPath]);
      }
      setCurrentPath([]);
      setIsDrawing(false);
    }
  };

  const clearAllPaths = () => {
    if (tracingMode === 'manual') {
      setManualPaths([]);
    } else {
      setTracedPaths([]);
    }
    setCurrentPath([]);
    setLineStartPoint(null);
  };

  const undoLastPath = () => {
    if (tracingMode === 'manual') {
      setManualPaths(manualPaths.slice(0, -1));
    } else {
      setTracedPaths(tracedPaths.slice(0, -1));
    }
  };

  const processImage = async () => {
    if (!uploadedImage || !canvasRef.current) return;

    setIsProcessing(true);
    try {
      // Load image
      const img = new Image();
      img.src = uploadedImage;
      await new Promise((resolve) => { img.onload = resolve; });

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set canvas size
      canvas.width = img.width;
      canvas.height = img.height;

      // Draw image
      ctx.drawImage(img, 0, 0);

      // Get image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      // Step 1: Binarize the image (pure black and white)
      const binary = binarizeImage(imageData, edgeThreshold, invertColors);
      
      // Step 2: Apply Zhang-Suen skeletonization to get centerlines
      const skeleton = zhangSuenSkeleton(binary, canvas.width, canvas.height);
      
      // Step 3: Trace the skeleton paths
      const paths = traceContours(skeleton, canvas.width, canvas.height, minPathLength);
      
      // Simplify paths
      const simplified = autoSimplify 
        ? paths.map(path => simplifyPath(path, simplificationLevel))
        : paths;

      setTracedPaths(simplified);

      // Draw traced paths on canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#8b5cf6';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      simplified.forEach(path => {
        if (path.length < 2) return;
        ctx.beginPath();
        ctx.moveTo(path[0].x, path[0].y);
        for (let i = 1; i < path.length; i++) {
          ctx.lineTo(path[i].x, path[i].y);
        }
        ctx.stroke();
      });

      toast({
        title: "Image traced!",
        description: `Found ${simplified.length} paths`,
      });
    } catch (error) {
      toast({
        title: "Processing failed",
        description: "Could not trace image",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExport = async () => {
    const pathsToExport = tracingMode === 'manual' ? manualPaths : tracedPaths;
    
    if (pathsToExport.length === 0) {
      toast({
        title: "No paths to export",
        description: tracingMode === 'manual' ? "Please draw some paths first" : "Please process an image first",
        variant: "destructive",
      });
      return;
    }

    console.log(`[Shoe String Export] Exporting ${pathsToExport.length} paths in ${tracingMode} mode`);
    console.log('[Shoe String Export] Sample path:', pathsToExport[0]);

    setIsExporting(true);
    try {
      const response = await fetch("/api/export/shoestring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paths: pathsToExport,
          tubeDiameter,
          tubeStyle,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || "Export failed");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `shoestring_trace_${Date.now()}.stl`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Export complete",
        description: `Downloaded ${pathsToExport.length} paths as STL`,
      });
    } catch (error) {
      console.error('[Shoe String Export] Error:', error);
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "Could not generate STL file",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="h-full flex">
      <div className="flex-1 relative bg-gradient-to-br from-zinc-900 via-purple-950/20 to-zinc-900">
        <div className="absolute inset-0 flex items-center justify-center p-8">
          {!uploadedImage ? (
            <div className="text-center">
              <ImageIcon className="h-16 w-16 mx-auto mb-4 text-purple-500/50" />
              <h3 className="text-lg font-medium mb-2">Upload an Image</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Movie scenes, characters, logos, or any iconic image
              </p>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="shoestring-upload"
              />
              <label htmlFor="shoestring-upload">
                <Button asChild>
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    Choose Image
                  </span>
                </Button>
              </label>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <canvas
                ref={canvasRef}
                className="max-w-full max-h-full border border-purple-500/30 rounded-lg shadow-2xl cursor-crosshair"
                style={{ imageRendering: 'crisp-edges' }}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseUp}
              />
            </div>
          )}
        </div>
      </div>

      <ShoeStringEditorUI
        tracingMode={tracingMode}
        setTracingMode={setTracingMode}
        activeTool={activeTool}
        setActiveTool={setActiveTool}
        imageOpacity={imageOpacity}
        setImageOpacity={setImageOpacity}
        tubeDiameter={tubeDiameter}
        setTubeDiameter={setTubeDiameter}
        simplificationLevel={simplificationLevel}
        setSimplificationLevel={setSimplificationLevel}
        edgeThreshold={edgeThreshold}
        setEdgeThreshold={setEdgeThreshold}
        invertColors={invertColors}
        setInvertColors={setInvertColors}
        isProcessing={isProcessing}
        isExporting={isExporting}
        pathCount={tracingMode === 'manual' ? manualPaths.length : tracedPaths.length}
        onProcessImage={processImage}
        onExport={handleExport}
        onUndo={undoLastPath}
        onClear={clearAllPaths}
        onNewImage={handleImageUpload}
      />
    </div>
  );
}

// Step 1: Binarization - Convert to pure black and white
function binarizeImage(imageData: ImageData, threshold: number, invert: boolean): boolean[][] {
  const { width, height, data } = imageData;
  const binary: boolean[][] = Array(height).fill(0).map(() => Array(width).fill(false));

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      
      // Convert to grayscale
      let gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
      if (invert) gray = 255 - gray;

      // Threshold: darker than threshold becomes black (true)
      binary[y][x] = gray < threshold;
    }
  }

  return binary;
}

// Step 2: Zhang-Suen Skeletonization Algorithm
// This erodes the shape from outside in until only a 1-pixel centerline remains
function zhangSuenSkeleton(binary: boolean[][], width: number, height: number): boolean[][] {
  const skeleton = binary.map(row => [...row]);
  let hasChanged = true;
  let iteration = 0;
  const maxIterations = 100; // Prevent infinite loops

  while (hasChanged && iteration < maxIterations) {
    hasChanged = false;
    iteration++;

    // Sub-iteration 1
    const toDelete1: Array<[number, number]> = [];
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        if (skeleton[y][x] && shouldDeleteZhangSuen(skeleton, x, y, 1)) {
          toDelete1.push([x, y]);
        }
      }
    }
    
    for (const [x, y] of toDelete1) {
      skeleton[y][x] = false;
      hasChanged = true;
    }

    // Sub-iteration 2
    const toDelete2: Array<[number, number]> = [];
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        if (skeleton[y][x] && shouldDeleteZhangSuen(skeleton, x, y, 2)) {
          toDelete2.push([x, y]);
        }
      }
    }
    
    for (const [x, y] of toDelete2) {
      skeleton[y][x] = false;
      hasChanged = true;
    }
  }

  return skeleton;
}

// Zhang-Suen deletion conditions
function shouldDeleteZhangSuen(img: boolean[][], x: number, y: number, step: number): boolean {
  // Get 8 neighbors (clockwise from top)
  const p2 = img[y - 1]?.[x] ? 1 : 0;
  const p3 = img[y - 1]?.[x + 1] ? 1 : 0;
  const p4 = img[y]?.[x + 1] ? 1 : 0;
  const p5 = img[y + 1]?.[x + 1] ? 1 : 0;
  const p6 = img[y + 1]?.[x] ? 1 : 0;
  const p7 = img[y + 1]?.[x - 1] ? 1 : 0;
  const p8 = img[y]?.[x - 1] ? 1 : 0;
  const p9 = img[y - 1]?.[x - 1] ? 1 : 0;

  // Count black neighbors (B)
  const B = p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9;

  // Count 0->1 transitions (A)
  const neighbors = [p2, p3, p4, p5, p6, p7, p8, p9, p2];
  let A = 0;
  for (let i = 0; i < 8; i++) {
    if (neighbors[i] === 0 && neighbors[i + 1] === 1) A++;
  }

  // Conditions
  const condition1 = B >= 2 && B <= 6;
  const condition2 = A === 1;

  if (step === 1) {
    const condition3 = p2 * p4 * p6 === 0;
    const condition4 = p4 * p6 * p8 === 0;
    return condition1 && condition2 && condition3 && condition4;
  } else {
    const condition3 = p2 * p4 * p8 === 0;
    const condition4 = p2 * p6 * p8 === 0;
    return condition1 && condition2 && condition3 && condition4;
  }
}

// Trace contours from edge map
function traceContours(edges: boolean[][], width: number, height: number, minLength: number): Array<Array<{x: number, y: number}>> {
  const paths: Array<Array<{x: number, y: number}>> = [];
  const visited: boolean[][] = Array(height).fill(0).map(() => Array(width).fill(false));

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (edges[y][x] && !visited[y][x]) {
        const path = followEdge(edges, visited, x, y, width, height);
        if (path.length >= minLength) {
          paths.push(path);
        }
      }
    }
  }

  return paths;
}

// Follow an edge to create a path
function followEdge(edges: boolean[][], visited: boolean[][], startX: number, startY: number, width: number, height: number): Array<{x: number, y: number}> {
  const path: Array<{x: number, y: number}> = [];
  const stack: Array<{x: number, y: number}> = [{x: startX, y: startY}];

  while (stack.length > 0) {
    const {x, y} = stack.pop()!;
    
    if (x < 0 || x >= width || y < 0 || y >= height) continue;
    if (visited[y][x] || !edges[y][x]) continue;

    visited[y][x] = true;
    path.push({x, y});

    // Check 8 neighbors
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        stack.push({x: x + dx, y: y + dy});
      }
    }
  }

  return path;
}

// Simplify path using Douglas-Peucker algorithm
function simplifyPath(path: Array<{x: number, y: number}>, tolerance: number): Array<{x: number, y: number}> {
  if (path.length <= 2) return path;

  const epsilon = tolerance * 2;
  return douglasPeucker(path, epsilon);
}

function douglasPeucker(points: Array<{x: number, y: number}>, epsilon: number): Array<{x: number, y: number}> {
  if (points.length <= 2) return points;

  let maxDist = 0;
  let maxIndex = 0;
  const end = points.length - 1;

  for (let i = 1; i < end; i++) {
    const dist = perpendicularDistance(points[i], points[0], points[end]);
    if (dist > maxDist) {
      maxDist = dist;
      maxIndex = i;
    }
  }

  if (maxDist > epsilon) {
    const left = douglasPeucker(points.slice(0, maxIndex + 1), epsilon);
    const right = douglasPeucker(points.slice(maxIndex), epsilon);
    return [...left.slice(0, -1), ...right];
  } else {
    return [points[0], points[end]];
  }
}

function perpendicularDistance(point: {x: number, y: number}, lineStart: {x: number, y: number}, lineEnd: {x: number, y: number}): number {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const mag = Math.sqrt(dx * dx + dy * dy);
  if (mag === 0) return Math.sqrt((point.x - lineStart.x) ** 2 + (point.y - lineStart.y) ** 2);
  
  const u = ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / (mag * mag);
  const closestX = lineStart.x + u * dx;
  const closestY = lineStart.y + u * dy;
  
  return Math.sqrt((point.x - closestX) ** 2 + (point.y - closestY) ** 2);
}
