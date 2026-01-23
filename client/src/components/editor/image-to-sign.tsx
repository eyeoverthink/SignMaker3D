import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, Download, Image as ImageIcon, Trash2 } from "lucide-react";
import { toast } from "sonner";

const LED_TYPES = [
  { value: "6mm", label: "6mm Silicone Neon" },
  { value: "8mm", label: "8mm Silicone Neon" },
  { value: "10.5mm", label: "10.5mm LED Strip" },
  { value: "14mm", label: "14mm Individual Pixels" }
];

export function ImageToSign() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [tolerance, setTolerance] = useState(1.5);
  const [ledType, setLedType] = useState("6mm");
  const [signHeight, setSignHeight] = useState(30);
  const [wallThickness, setWallThickness] = useState(2);
  const [baseThickness, setBaseThickness] = useState(2);
  const [isExporting, setIsExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error("Please upload a valid image file (PNG, JPG, etc.)");
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
      toast.success("Image loaded successfully!");
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
      toast.success("Image loaded successfully!");
    } else {
      toast.error("Please drop a valid image file");
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleExport = async () => {
    if (!imageFile) {
      toast.error("Please upload an image first");
      return;
    }

    setIsExporting(true);
    try {
      const formData = new FormData();
      formData.append("image", imageFile);
      formData.append("tolerance", tolerance.toString());
      formData.append("ledType", ledType);
      formData.append("signHeight", signHeight.toString());
      formData.append("wallThickness", wallThickness.toString());
      formData.append("baseThickness", baseThickness.toString());

      const response = await fetch("/api/export/image-to-sign", {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Export failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Image_Sign_${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Image sign exported successfully!");
    } catch (error) {
      console.error("Export error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to export image sign");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 p-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Scott Engine: Image to Sign</h3>
        <p className="text-sm text-muted-foreground">
          Transform any PNG/JPG into a hollowed, channeled 3D neon sign. Upload an image and the Scott Engine
          will extract contours, simplify paths, and generate LED-ready STL files.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label className="text-sm font-medium mb-3 block">Image Upload</Label>
          
          {!selectedImage ? (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm font-medium mb-1">Drop image here or click to browse</p>
              <p className="text-xs text-muted-foreground">Supports PNG, JPG, JPEG (max 10MB)</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
          ) : (
            <Card>
              <CardContent className="p-4">
                <div className="relative">
                  <img
                    src={selectedImage}
                    alt="Uploaded preview"
                    className="w-full h-auto max-h-[300px] object-contain rounded-lg bg-muted"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={clearImage}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Upload className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground truncate">
                    {imageFile?.name}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-semibold">Scott Engine Settings</h4>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="tolerance">Contour Simplification Tolerance</Label>
              <span className="text-sm text-muted-foreground">{tolerance.toFixed(1)}%</span>
            </div>
            <Slider
              id="tolerance"
              min={0.5}
              max={5.0}
              step={0.1}
              value={[tolerance]}
              onValueChange={(v) => setTolerance(v[0])}
            />
            <p className="text-xs text-muted-foreground">
              Lower = More detail (complex paths) | Higher = Smoother (simplified paths)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ledType">LED Type</Label>
            <Select value={ledType} onValueChange={setLedType}>
              <SelectTrigger id="ledType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LED_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="signHeight">Sign Height (mm)</Label>
              <Input
                id="signHeight"
                type="number"
                min={10}
                max={100}
                value={signHeight}
                onChange={(e) => setSignHeight(Number(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="wallThickness">Wall Thickness (mm)</Label>
              <Input
                id="wallThickness"
                type="number"
                min={1}
                max={5}
                step={0.5}
                value={wallThickness}
                onChange={(e) => setWallThickness(Number(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="baseThickness">Base Thickness (mm)</Label>
              <Input
                id="baseThickness"
                type="number"
                min={1}
                max={5}
                step={0.5}
                value={baseThickness}
                onChange={(e) => setBaseThickness(Number(e.target.value))}
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t">
          <Button
            onClick={handleExport}
            disabled={!selectedImage || isExporting}
            className="w-full"
            size="lg"
          >
            {isExporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Generating Sign...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Generate LED Sign from Image
              </>
            )}
          </Button>
        </div>

        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <h4 className="text-sm font-semibold">What You'll Get:</h4>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
            <li>Image_Sign_Body.stl - Main shell with LED channel</li>
            <li>Image_Sign_Lid.stl - Snap-fit diffuser cover</li>
            <li>Image_Sign.scad - OpenSCAD source file</li>
            <li>ASSEMBLY_INSTRUCTIONS.md - Complete build guide</li>
            <li>BOM.md - Bill of materials</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
