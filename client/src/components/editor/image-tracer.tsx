import { useRef, useEffect, useState, useCallback } from "react";
import { useEditorStore } from "@/lib/editor-store";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { 
  Upload, Wand2, Image as ImageIcon, X, Pencil, Circle, Minus, Square, 
  Undo2, Trash2, MousePointer2, Sparkles, PenTool, Check
} from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { SketchPath } from "@shared/schema";

type TraceMode = "auto" | "manual";
type DrawingTool = "freehand" | "line" | "circle" | "rectangle" | "pen";

interface AnchorPoint {
  x: number;
  y: number;
  handleIn?: { x: number; y: number };
  handleOut?: { x: number; y: number };
}

export function ImageTracer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Auto trace state
  const [threshold, setThreshold] = useState(128);
  const [simplify, setSimplify] = useState(2);
  const [minContourLength, setMinContourLength] = useState(15);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Image adjustment state
  const [invert, setInvert] = useState(false);
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  
  // Mode and manual trace state
  const [traceMode, setTraceMode] = useState<TraceMode>("auto");
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>([]);
  const [manualPaths, setManualPaths] = useState<{ points: { x: number; y: number }[]; closed: boolean }[]>([]);
  const [brushSize, setBrushSize] = useState(8);
  const [activeTool, setActiveTool] = useState<DrawingTool>("freehand");
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [imageSize, setImageSize] = useState<{ width: number; height: number }>({ width: 600, height: 400 });
  
  // Pen tool state
  const [penAnchors, setPenAnchors] = useState<AnchorPoint[]>([]);
  const [isDraggingHandle, setIsDraggingHandle] = useState(false);
  const [selectedAnchorIndex, setSelectedAnchorIndex] = useState<number | null>(null);

  const { uploadedImageData, setUploadedImageData, setTracedPaths, setSketchPaths } = useEditorStore();

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadedImageData(event.target?.result as string);
      setManualPaths([]);
    };
    reader.readAsDataURL(file);
  }, [setUploadedImageData]);

  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Drawing helpers
  const getCanvasPoint = useCallback((e: React.MouseEvent | React.TouchEvent): { x: number; y: number } | null => {
    const canvas = drawingRef.current;
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

  // Convert bezier anchors to path points
  const bezierToPoints = useCallback((anchors: AnchorPoint[]): { x: number; y: number }[] => {
    if (anchors.length < 2) return anchors.map(a => ({ x: a.x, y: a.y }));
    
    const points: { x: number; y: number }[] = [];
    const segments = 16; // Points per curve segment
    
    for (let i = 0; i < anchors.length - 1; i++) {
      const p0 = anchors[i];
      const p3 = anchors[i + 1];
      
      // Control points
      const p1 = p0.handleOut || { x: p0.x, y: p0.y };
      const p2 = p3.handleIn || { x: p3.x, y: p3.y };
      
      for (let t = 0; t <= segments; t++) {
        const u = t / segments;
        const u2 = u * u;
        const u3 = u2 * u;
        const mu = 1 - u;
        const mu2 = mu * mu;
        const mu3 = mu2 * mu;
        
        points.push({
          x: mu3 * p0.x + 3 * mu2 * u * p1.x + 3 * mu * u2 * p2.x + u3 * p3.x,
          y: mu3 * p0.y + 3 * mu2 * u * p1.y + 3 * mu * u2 * p2.y + u3 * p3.y,
        });
      }
    }
    
    return points;
  }, []);

  const handlePointerDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (traceMode !== "manual") return;
    
    const point = getCanvasPoint(e);
    if (!point) return;

    // Pen tool: add anchor point on click
    if (activeTool === "pen") {
      // Check if clicking near an existing anchor to select it
      const clickRadius = 10;
      for (let i = 0; i < penAnchors.length; i++) {
        const anchor = penAnchors[i];
        const dist = Math.sqrt((anchor.x - point.x) ** 2 + (anchor.y - point.y) ** 2);
        if (dist < clickRadius) {
          setSelectedAnchorIndex(i);
          setIsDraggingHandle(true);
          return;
        }
      }
      
      // Add new anchor point
      const newAnchor: AnchorPoint = { x: point.x, y: point.y };
      setPenAnchors(prev => [...prev, newAnchor]);
      setSelectedAnchorIndex(penAnchors.length);
      setIsDraggingHandle(true);
      return;
    }

    setIsDrawing(true);
    setStartPoint(point);
    
    if (activeTool === "freehand") {
      setCurrentPath([point]);
    } else {
      setCurrentPath([point, point]);
    }
  }, [getCanvasPoint, activeTool, traceMode, penAnchors]);

  const handlePointerMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (traceMode !== "manual") return;

    const point = getCanvasPoint(e);
    if (!point) return;

    // Pen tool: drag to create bezier handles
    if (activeTool === "pen" && isDraggingHandle && selectedAnchorIndex !== null) {
      setPenAnchors(prev => {
        const updated = [...prev];
        const anchor = updated[selectedAnchorIndex];
        if (anchor) {
          const dx = point.x - anchor.x;
          const dy = point.y - anchor.y;
          anchor.handleOut = { x: anchor.x + dx, y: anchor.y + dy };
          anchor.handleIn = { x: anchor.x - dx, y: anchor.y - dy };
        }
        return updated;
      });
      return;
    }

    if (!isDrawing) return;

    if (activeTool === "freehand") {
      setCurrentPath(prev => [...prev, point]);
    } else if (startPoint) {
      setCurrentPath(generateShapePoints(startPoint, point, activeTool));
    }
  }, [isDrawing, getCanvasPoint, activeTool, startPoint, generateShapePoints, traceMode, isDraggingHandle, selectedAnchorIndex]);

  const handlePointerUp = useCallback(() => {
    // Pen tool: stop dragging handle
    if (activeTool === "pen") {
      setIsDraggingHandle(false);
      return;
    }

    if (!isDrawing || currentPath.length < 2) {
      setIsDrawing(false);
      setCurrentPath([]);
      setStartPoint(null);
      return;
    }

    // Check minimum path size using bounding box diagonal for shapes
    const minDistance = 10;
    let pathSize = 0;
    
    if (activeTool === "freehand") {
      // For freehand, sum segment lengths
      for (let i = 1; i < currentPath.length; i++) {
        const dx = currentPath[i].x - currentPath[i-1].x;
        const dy = currentPath[i].y - currentPath[i-1].y;
        pathSize += Math.sqrt(dx * dx + dy * dy);
      }
    } else {
      // For shapes, use bounding box diagonal
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      for (const p of currentPath) {
        minX = Math.min(minX, p.x);
        maxX = Math.max(maxX, p.x);
        minY = Math.min(minY, p.y);
        maxY = Math.max(maxY, p.y);
      }
      pathSize = Math.sqrt((maxX - minX) ** 2 + (maxY - minY) ** 2);
    }
    
    if (pathSize < minDistance) {
      setIsDrawing(false);
      setCurrentPath([]);
      setStartPoint(null);
      return;
    }

    let finalPath = currentPath;
    if (activeTool === "freehand") {
      finalPath = smoothPath(currentPath);
    }

    const isClosed = activeTool === "circle" || activeTool === "rectangle";
    setManualPaths(prev => [...prev, { points: finalPath, closed: isClosed }]);
    setIsDrawing(false);
    setCurrentPath([]);
    setStartPoint(null);
  }, [isDrawing, currentPath, activeTool, smoothPath]);

  // Finalize pen path and add to manual paths
  const finalizePenPath = useCallback(() => {
    if (penAnchors.length < 2) return;
    
    const pathPoints = bezierToPoints(penAnchors);
    if (pathPoints.length >= 2) {
      setManualPaths(prev => [...prev, { points: pathPoints, closed: false }]);
    }
    setPenAnchors([]);
    setSelectedAnchorIndex(null);
  }, [penAnchors, bezierToPoints]);

  const handleUndo = useCallback(() => {
    if (activeTool === "pen" && penAnchors.length > 0) {
      setPenAnchors(prev => prev.slice(0, -1));
      return;
    }
    setManualPaths(prev => prev.slice(0, -1));
  }, [activeTool, penAnchors]);

  const handleClear = useCallback(() => {
    setManualPaths([]);
    setPenAnchors([]);
    setSelectedAnchorIndex(null);
  }, []);

  // Auto trace function
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

      setImageSize({ width, height });

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
      
      // Step 1: Apply image adjustments (brightness, contrast, invert)
      const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));
      for (let i = 0; i < data.length; i += 4) {
        let r = data[i], g = data[i + 1], b = data[i + 2];
        
        // Apply brightness
        r = Math.min(255, Math.max(0, r + brightness));
        g = Math.min(255, Math.max(0, g + brightness));
        b = Math.min(255, Math.max(0, b + brightness));
        
        // Apply contrast
        r = Math.min(255, Math.max(0, contrastFactor * (r - 128) + 128));
        g = Math.min(255, Math.max(0, contrastFactor * (g - 128) + 128));
        b = Math.min(255, Math.max(0, contrastFactor * (b - 128) + 128));
        
        // Apply invert
        if (invert) {
          r = 255 - r;
          g = 255 - g;
          b = 255 - b;
        }
        
        data[i] = r;
        data[i + 1] = g;
        data[i + 2] = b;
      }
      
      // Step 2: Convert to grayscale
      const gray = new Float32Array(width * height);
      for (let i = 0; i < data.length; i += 4) {
        gray[i / 4] = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      }
      
      // Step 3: Apply Sobel edge detection
      const edges = new Float32Array(width * height);
      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          const idx = y * width + x;
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
      
      let maxEdge = 0;
      for (let i = 0; i < edges.length; i++) {
        if (edges[i] > maxEdge) maxEdge = edges[i];
      }
      
      const edgeThreshold = (threshold / 255) * maxEdge * 0.5;
      for (let i = 0; i < data.length; i += 4) {
        const edgeVal = edges[i / 4];
        const binary = edgeVal > edgeThreshold ? 0 : 255;
        data[i] = binary;
        data[i + 1] = binary;
        data[i + 2] = binary;
      }

      ctx.putImageData(imageData, 0, 0);

      const contours = extractContours(data, width, height, simplify, minContourLength);

      // Draw preview with original image underneath
      previewCtx.drawImage(img, 0, 0, width, height);
      // Add semi-transparent overlay
      previewCtx.fillStyle = 'rgba(15, 15, 26, 0.7)';
      previewCtx.fillRect(0, 0, width, height);

      const paths: SketchPath[] = [];
      const centerX = width / 2;
      const centerY = height / 2;

      for (const contour of contours) {
        if (contour.length < 3) continue;

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
  }, [uploadedImageData, threshold, simplify, minContourLength, setTracedPaths, invert, brightness, contrast]);

  // Draw manual paths on drawing canvas
  useEffect(() => {
    const drawing = drawingRef.current;
    if (!drawing || !uploadedImageData) return;

    const ctx = drawing.getContext('2d');
    if (!ctx) return;

    // Load and draw background image
    const img = new Image();
    img.onload = () => {
      const maxSize = 600;
      const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
      const width = Math.floor(img.width * scale);
      const height = Math.floor(img.height * scale);

      drawing.width = width;
      drawing.height = height;
      setImageSize({ width, height });

      // Draw image with overlay
      ctx.drawImage(img, 0, 0, width, height);
      ctx.fillStyle = 'rgba(15, 15, 26, 0.5)';
      ctx.fillRect(0, 0, width, height);

      // Draw existing manual paths
      ctx.strokeStyle = '#ff6b9d';
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.shadowColor = '#ff6b9d';
      ctx.shadowBlur = 10;

      for (const pathObj of manualPaths) {
        if (pathObj.points.length < 2) continue;
        ctx.beginPath();
        ctx.moveTo(pathObj.points[0].x, pathObj.points[0].y);
        for (let i = 1; i < pathObj.points.length; i++) {
          ctx.lineTo(pathObj.points[i].x, pathObj.points[i].y);
        }
        if (pathObj.closed) {
          ctx.closePath();
        }
        ctx.stroke();
      }

      // Draw current path
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

      // Draw pen tool anchors and bezier curve preview
      if (penAnchors.length > 0) {
        ctx.shadowBlur = 0;
        
        // Draw bezier curve preview
        if (penAnchors.length >= 2) {
          const bezierPoints = bezierToPointsLocal(penAnchors);
          ctx.strokeStyle = '#00ff88';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(bezierPoints[0].x, bezierPoints[0].y);
          for (let i = 1; i < bezierPoints.length; i++) {
            ctx.lineTo(bezierPoints[i].x, bezierPoints[i].y);
          }
          ctx.stroke();
        }
        
        // Draw anchor points and handles
        for (let i = 0; i < penAnchors.length; i++) {
          const anchor = penAnchors[i];
          
          // Draw handles
          if (anchor.handleIn || anchor.handleOut) {
            ctx.strokeStyle = '#888';
            ctx.lineWidth = 1;
            
            if (anchor.handleIn) {
              ctx.beginPath();
              ctx.moveTo(anchor.x, anchor.y);
              ctx.lineTo(anchor.handleIn.x, anchor.handleIn.y);
              ctx.stroke();
              
              ctx.fillStyle = '#fff';
              ctx.beginPath();
              ctx.arc(anchor.handleIn.x, anchor.handleIn.y, 4, 0, Math.PI * 2);
              ctx.fill();
            }
            
            if (anchor.handleOut) {
              ctx.beginPath();
              ctx.moveTo(anchor.x, anchor.y);
              ctx.lineTo(anchor.handleOut.x, anchor.handleOut.y);
              ctx.stroke();
              
              ctx.fillStyle = '#fff';
              ctx.beginPath();
              ctx.arc(anchor.handleOut.x, anchor.handleOut.y, 4, 0, Math.PI * 2);
              ctx.fill();
            }
          }
          
          // Draw anchor point
          ctx.fillStyle = selectedAnchorIndex === i ? '#00ff88' : '#fff';
          ctx.strokeStyle = '#000';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(anchor.x, anchor.y, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
      }

      ctx.shadowBlur = 0;
    };
    
    // Local bezier function for drawing
    function bezierToPointsLocal(anchors: AnchorPoint[]): { x: number; y: number }[] {
      if (anchors.length < 2) return anchors.map(a => ({ x: a.x, y: a.y }));
      
      const points: { x: number; y: number }[] = [];
      const segments = 16;
      
      for (let i = 0; i < anchors.length - 1; i++) {
        const p0 = anchors[i];
        const p3 = anchors[i + 1];
        const p1 = p0.handleOut || { x: p0.x, y: p0.y };
        const p2 = p3.handleIn || { x: p3.x, y: p3.y };
        
        for (let t = 0; t <= segments; t++) {
          const u = t / segments;
          const u2 = u * u;
          const u3 = u2 * u;
          const mu = 1 - u;
          const mu2 = mu * mu;
          const mu3 = mu2 * mu;
          
          points.push({
            x: mu3 * p0.x + 3 * mu2 * u * p1.x + 3 * mu * u2 * p2.x + u3 * p3.x,
            y: mu3 * p0.y + 3 * mu2 * u * p1.y + 3 * mu * u2 * p2.y + u3 * p3.y,
          });
        }
      }
      
      return points;
    }
    
    img.src = uploadedImageData;
  }, [uploadedImageData, manualPaths, currentPath, brushSize, penAnchors, selectedAnchorIndex]);

  const applyTracedPaths = useCallback(() => {
    if (traceMode === "auto") {
      const { tracedPaths } = useEditorStore.getState();
      setSketchPaths(tracedPaths);
    } else {
      // Convert manual paths to sketch paths
      const { width, height } = imageSize;
      const centerX = width / 2;
      const centerY = height / 2;

      const paths: SketchPath[] = manualPaths.map((pathObj, idx) => ({
        id: `manual-${Date.now()}-${idx}`,
        points: pathObj.points.map(p => ({
          x: (p.x - centerX) * 0.5,
          y: (centerY - p.y) * 0.5,
        })),
        closed: pathObj.closed,
      }));

      setSketchPaths(paths);
    }
    useEditorStore.getState().setInputMode("draw");
  }, [traceMode, manualPaths, imageSize, setSketchPaths]);

  useEffect(() => {
    if (uploadedImageData && traceMode === "auto") {
      traceImage();
    }
  }, [uploadedImageData, traceImage, traceMode]);

  const tools: { id: DrawingTool; icon: typeof Pencil; label: string }[] = [
    { id: "freehand", icon: Pencil, label: "Freehand" },
    { id: "pen", icon: PenTool, label: "Pen (Bezier Curves)" },
    { id: "line", icon: Minus, label: "Line" },
    { id: "circle", icon: Circle, label: "Circle/Oval" },
    { id: "rectangle", icon: Square, label: "Rectangle" },
  ];

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
      {/* Mode Toggle */}
      <div className="p-3 border-b bg-card flex items-center gap-2">
        <Button
          variant={traceMode === "auto" ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setTraceMode("auto");
            traceImage();
          }}
          data-testid="button-auto-trace-mode"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          Auto Trace
        </Button>
        <Button
          variant={traceMode === "manual" ? "default" : "outline"}
          size="sm"
          onClick={() => setTraceMode("manual")}
          data-testid="button-manual-trace-mode"
        >
          <MousePointer2 className="h-4 w-4 mr-2" />
          Manual Trace
        </Button>
        
        <div className="flex-1" />
        
        <span className="text-xs text-muted-foreground">
          {traceMode === "auto" 
            ? `${useEditorStore.getState().tracedPaths.length} paths detected`
            : `${manualPaths.length} paths drawn`
          }
        </span>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 bg-muted/30 relative">
        {traceMode === "auto" ? (
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
        ) : (
          <>
            {/* Manual trace drawing canvas */}
            <canvas
              ref={drawingRef}
              onMouseDown={handlePointerDown}
              onMouseMove={handlePointerMove}
              onMouseUp={handlePointerUp}
              onMouseLeave={handlePointerUp}
              onTouchStart={handlePointerDown}
              onTouchMove={handlePointerMove}
              onTouchEnd={handlePointerUp}
              className="max-w-full max-h-full rounded-lg shadow-lg cursor-crosshair touch-none"
              data-testid="manual-trace-canvas"
            />
            
            {/* Drawing tools overlay */}
            <div className="absolute top-8 left-8 flex flex-col gap-3">
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
                      <TooltipContent side="right">
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
                      disabled={manualPaths.length === 0 && penAnchors.length === 0}
                      data-testid="button-undo"
                    >
                      <Undo2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{activeTool === "pen" ? "Remove Last Point" : "Undo Last Stroke"}</p>
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={handleClear}
                      disabled={manualPaths.length === 0 && penAnchors.length === 0}
                      data-testid="button-clear"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>Clear All</p>
                  </TooltipContent>
                </Tooltip>
                
                {activeTool === "pen" && penAnchors.length >= 2 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant="default"
                        onClick={finalizePenPath}
                        data-testid="button-finish-path"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>Finish Path</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>

            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-card/90 backdrop-blur-sm rounded-lg px-4 py-2 border shadow-lg">
              <p className="text-xs text-muted-foreground text-center">
                {activeTool === "pen" 
                  ? "Click to add anchor points, drag to create curves, then click ✓ to finish"
                  : "Trace over the image with your mouse or finger"
                }
              </p>
            </div>
          </>
        )}
      </div>

      <div className="p-4 border-t bg-card space-y-4">
        {traceMode === "auto" ? (
          <>
            <div className="flex items-center gap-4 mb-3">
              <Label className="text-sm font-medium">Image Adjustments:</Label>
              <Button
                variant={invert ? "default" : "outline"}
                size="sm"
                onClick={() => setInvert(!invert)}
                data-testid="button-invert"
              >
                Invert (Negative)
              </Button>
            </div>
            
            <div className="flex gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex justify-between">
                  <Label className="text-sm">Brightness</Label>
                  <span className="text-xs text-muted-foreground">{brightness}</span>
                </div>
                <Slider
                  value={[brightness]}
                  onValueChange={([v]) => setBrightness(v)}
                  min={-100}
                  max={100}
                  step={5}
                  data-testid="slider-brightness"
                />
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex justify-between">
                  <Label className="text-sm">Contrast</Label>
                  <span className="text-xs text-muted-foreground">{contrast}</span>
                </div>
                <Slider
                  value={[contrast]}
                  onValueChange={([v]) => setContrast(v)}
                  min={-100}
                  max={100}
                  step={5}
                  data-testid="slider-contrast"
                />
              </div>
            </div>

            <div className="flex gap-4">
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
                <p className="text-xs text-muted-foreground">Lower = more edges</p>
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
              <div className="flex-1 space-y-2">
                <div className="flex justify-between">
                  <Label className="text-sm">Min Path Length</Label>
                  <span className="text-xs text-muted-foreground">{minContourLength}</span>
                </div>
                <Slider
                  value={[minContourLength]}
                  onValueChange={([v]) => setMinContourLength(v)}
                  min={5}
                  max={50}
                  step={5}
                  data-testid="slider-min-contour"
                />
                <p className="text-xs text-muted-foreground">Higher = less noise</p>
              </div>
            </div>
          </>
        ) : (
          <div className="text-sm text-muted-foreground text-center py-2">
            Draw paths directly on the image above. Use the tools on the left to switch between freehand, line, circle, and rectangle.
          </div>
        )}

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
              setManualPaths([]);
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
          {traceMode === "auto" && (
            <Button
              variant="outline"
              onClick={traceImage}
              disabled={isProcessing}
              data-testid="button-retrace"
            >
              <Wand2 className="h-4 w-4 mr-2" />
              Re-trace
            </Button>
          )}
          <Button
            variant="default"
            className="flex-1"
            onClick={applyTracedPaths}
            disabled={isProcessing || (traceMode === "auto" ? useEditorStore.getState().tracedPaths.length === 0 : manualPaths.length === 0)}
            data-testid="button-apply-trace"
          >
            Apply {traceMode === "auto" ? "Traced" : "Manual"} Paths
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
  simplify: number,
  minLength: number
): { x: number; y: number }[][] {
  const contours: { x: number; y: number }[][] = [];
  const visited = new Set<number>();
  
  // Strict max distance - only allow immediate neighbors (diagonal = sqrt(2) ≈ 1.41)
  // This prevents connecting separate strokes
  const maxJumpDistance = 2.0;

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
  
  // Count neighboring edge pixels to identify noise vs real edges
  const countEdgeNeighbors = (x: number, y: number): number => {
    let count = 0;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        if (isEdge(x + dx, y + dy)) count++;
      }
    }
    return count;
  };

  for (let y = 0; y < height; y += simplify) {
    for (let x = 0; x < width; x += simplify) {
      const key = y * width + x;
      if (visited.has(key)) continue;
      if (!isEdge(x, y)) continue;
      
      // Skip isolated pixels (noise) - must have at least 2 neighbors for real edges
      if (countEdgeNeighbors(x, y) < 2) {
        visited.add(key);
        continue;
      }

      let contour: { x: number; y: number }[] = [];
      let cx = x, cy = y;
      
      // Only check immediate 8-connected neighbors
      const directions = [
        [1, 0], [0, 1], [-1, 0], [0, -1],
        [1, 1], [-1, 1], [-1, -1], [1, -1]
      ];

      let steps = 0;
      const maxSteps = 10000;

      while (steps < maxSteps) {
        const ckey = cy * width + cx;
        if (visited.has(ckey)) break;
        visited.add(ckey);

        contour.push({ x: cx, y: cy });

        let found = false;
        let bestDist = Infinity;
        let bestX = cx, bestY = cy;
        
        // Find closest unvisited edge neighbor - only immediate neighbors
        for (const [dx, dy] of directions) {
          const nx = cx + dx;
          const ny = cy + dy;
          const nkey = ny * width + nx;
          
          if (!visited.has(nkey) && isEdge(nx, ny)) {
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < bestDist) {
              bestDist = dist;
              bestX = nx;
              bestY = ny;
              found = true;
            }
          }
        }

        if (found && bestDist <= maxJumpDistance) {
          cx = bestX;
          cy = bestY;
        } else {
          break;
        }
        steps++;
      }

      // Save final contour if long enough
      if (contour.length >= minLength) {
        contours.push(contour);
      }
    }
  }

  // Post-process: split contours that have large jumps between points
  const splitContours: { x: number; y: number }[][] = [];
  const maxPointDistance = 3; // Max distance between consecutive points
  
  for (const contour of contours) {
    let segment: { x: number; y: number }[] = [];
    
    for (let i = 0; i < contour.length; i++) {
      const point = contour[i];
      
      if (segment.length === 0) {
        segment.push(point);
      } else {
        const lastPoint = segment[segment.length - 1];
        const dist = Math.sqrt((point.x - lastPoint.x) ** 2 + (point.y - lastPoint.y) ** 2);
        
        if (dist <= maxPointDistance) {
          segment.push(point);
        } else {
          // Large jump detected - save current segment and start new one
          if (segment.length >= minLength) {
            splitContours.push(segment);
          }
          segment = [point];
        }
      }
    }
    
    // Don't forget the last segment
    if (segment.length >= minLength) {
      splitContours.push(segment);
    }
  }

  // Final filter: remove tiny contours
  return splitContours.filter(contour => {
    if (contour.length < minLength) return false;
    
    // Calculate bounding box
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const p of contour) {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    }
    
    // Filter out tiny contours (noise)
    const boxSize = Math.max(maxX - minX, maxY - minY);
    return boxSize >= minLength;
  });
}
