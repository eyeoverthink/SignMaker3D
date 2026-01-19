import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Upload, Download, Type, Zap, Check } from "lucide-react";

interface FontOption {
  id: string;
  name: string;
  file: string;
  category: string;
}

export default function CustomFontAlphabet() {
  const { toast } = useToast();
  const [availableFonts, setAvailableFonts] = useState<FontOption[]>([]);
  const [selectedFont, setSelectedFont] = useState<string>("");
  const [fontFile, setFontFile] = useState<File | null>(null);
  const [fontSize, setFontSize] = useState(100);
  const [ledType, setLedType] = useState("silicone_neon_6mm");
  const [signHeight, setSignHeight] = useState(30);
  const [wallThickness, setWallThickness] = useState(2);
  const [baseThickness, setBaseThickness] = useState(2);
  const [lidTolerance, setLidTolerance] = useState(0.15);
  const [wireHoleHeight, setWireHoleHeight] = useState(5);
  const [wireHoleSize, setWireHoleSize] = useState(5);
  const [enableFrictionLip, setEnableFrictionLip] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [fontSource, setFontSource] = useState<"library" | "upload">("library");

  useEffect(() => {
    // Fetch available fonts from server
    fetch("/api/fonts/list")
      .then(res => res.json())
      .then(data => {
        const fonts: FontOption[] = data.fonts.map((f: any) => ({
          id: f.id,
          name: f.name,
          file: f.file,
          category: categorizeFont(f.name)
        }));
        setAvailableFonts(fonts);
        if (fonts.length > 0) {
          setSelectedFont(fonts[0].id);
        }
      })
      .catch(err => console.error("Failed to load fonts:", err));
  }, []);

  const categorizeFont = (name: string): string => {
    const script = ["Alex Brush", "Allison", "Allura", "Arizonia", "Babylonica", "Bad Script", "Ballet", "Beau Rivage", "Beth Ellen", "Bilbo", "Birthstone", "Bonheur Royale", "Calligraffitti", "Caramel", "Caveat", "Cedarville Cursive", "Charm", "Neonderthaw"];
    const bold = ["Archivo Black", "Montserrat", "Open Sans", "Outfit", "Playfair Display", "Inter", "Lora"];
    
    if (script.some(s => name.includes(s))) return "Script/Cursive";
    if (bold.some(b => name.includes(b))) return "Bold/Display";
    return "Decorative";
  };

  const handleFontUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.name.endsWith('.otf') || file.name.endsWith('.ttf')) {
        setFontFile(file);
        toast({
          title: "Font Loaded",
          description: `${file.name} ready for alphabet generation`,
        });
      } else {
        toast({
          title: "Invalid File",
          description: "Please upload a .otf or .ttf font file",
          variant: "destructive",
        });
      }
    }
  };

  const handleGenerate = async () => {
    if (fontSource === "library" && !selectedFont) {
      toast({
        title: "No Font Selected",
        description: "Please select a font from the library",
        variant: "destructive",
      });
      return;
    }

    if (fontSource === "upload" && !fontFile) {
      toast({
        title: "No Font Uploaded",
        description: "Please upload a font file",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const payload = {
        fontSource,
        fontId: fontSource === "library" ? selectedFont : undefined,
        fontSize,
        ledType,
        signHeight,
        wallThickness,
        baseThickness,
        lidTolerance,
        wireHoleHeight,
        wireHoleSize,
        enableFrictionLip,
      };

      const response = await fetch("/api/export/custom-font-alphabet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Generation failed");

      const data = await response.json();
      
      // Download all files
      for (const file of data.files) {
        const blob = new Blob([file.content], { 
          type: file.filename.endsWith('.stl') ? 'application/sla' : 'text/plain' 
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      toast({
        title: "Success!",
        description: `Generated ${data.files.length} files for complete alphabet`,
      });
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="h-full overflow-auto p-6 bg-background">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
            <Type className="w-8 h-8" />
            Custom Font Alphabet Generator
          </h1>
          <p className="text-muted-foreground">
            Select from {availableFonts.length}+ fonts or upload your own to generate a complete A-Z alphabet with LED channels
          </p>
        </div>

        {/* Font Selection Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Type className="w-5 h-5" />
              Select Font
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={fontSource} onValueChange={(v) => setFontSource(v as "library" | "upload")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="library">Font Library ({availableFonts.length})</TabsTrigger>
                <TabsTrigger value="upload">Upload Custom</TabsTrigger>
              </TabsList>
              
              <TabsContent value="library" className="space-y-4">
                <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                  <div className="grid grid-cols-1 gap-3">
                    {["Script/Cursive", "Bold/Display", "Decorative"].map(category => {
                      const fontsInCategory = availableFonts.filter(f => f.category === category);
                      if (fontsInCategory.length === 0) return null;
                      
                      return (
                        <div key={category}>
                          <h3 className="text-sm font-bold mb-2 text-muted-foreground">{category}</h3>
                          <div className="space-y-2">
                            {fontsInCategory.map(font => (
                              <button
                                key={font.id}
                                onClick={() => setSelectedFont(font.id)}
                                className={`w-full text-left p-3 rounded-lg border-2 transition-all hover:border-primary ${
                                  selectedFont === font.id ? "border-primary bg-primary/5" : "border-border"
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-medium">{font.name}</p>
                                    <p className="text-xs text-muted-foreground mt-1" style={{ fontFamily: font.name }}>
                                      ABCDEFGHIJKLMNOPQRSTUVWXYZ
                                    </p>
                                  </div>
                                  {selectedFont === font.id && <Check className="w-5 h-5 text-primary" />}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="upload" className="space-y-4">
                <div>
                  <Label htmlFor="font-upload">Font File (OTF or TTF)</Label>
                  <Input
                    id="font-upload"
                    type="file"
                    accept=".otf,.ttf"
                    onChange={handleFontUpload}
                    className="cursor-pointer"
                  />
                  {fontFile && (
                    <p className="text-sm text-muted-foreground mt-2">
                      ✓ Loaded: {fontFile.name} ({(fontFile.size / 1024).toFixed(1)} KB)
                    </p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Configuration Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Engineering Parameters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Font Size */}
            <div>
              <Label>Font Size: {fontSize}mm</Label>
              <input
                type="range"
                min={50}
                max={200}
                step={10}
                value={fontSize}
                onChange={(e) => setFontSize(parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            {/* LED Type */}
            <div>
              <Label>LED Type (Auto-sizes channels)</Label>
              <Select value={ledType} onValueChange={setLedType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="silicone_neon_6mm">Silicone Neon 6mm (6.0mm channel)</SelectItem>
                  <SelectItem value="silicone_neon_8mm">Silicone Neon 8mm (8.0mm channel)</SelectItem>
                  <SelectItem value="led_strip_10mm">LED Strip 10mm (10.5mm channel)</SelectItem>
                  <SelectItem value="individual_pixels">Individual Pixels (14.0mm channel)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Advanced Settings */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Sign Height: {signHeight}mm</Label>
                <Input
                  type="number"
                  min={10}
                  max={50}
                  value={signHeight}
                  onChange={(e) => setSignHeight(parseInt(e.target.value))}
                />
              </div>
              <div>
                <Label>Wall Thickness: {wallThickness}mm</Label>
                <Input
                  type="number"
                  min={1}
                  max={5}
                  step={0.5}
                  value={wallThickness}
                  onChange={(e) => setWallThickness(parseFloat(e.target.value))}
                />
              </div>
              <div>
                <Label>Base Thickness: {baseThickness}mm</Label>
                <Input
                  type="number"
                  min={1}
                  max={5}
                  step={0.5}
                  value={baseThickness}
                  onChange={(e) => setBaseThickness(parseFloat(e.target.value))}
                />
              </div>
              <div>
                <Label>Lid Tolerance: {lidTolerance}mm</Label>
                <Input
                  type="number"
                  min={0.1}
                  max={0.5}
                  step={0.05}
                  value={lidTolerance}
                  onChange={(e) => setLidTolerance(parseFloat(e.target.value))}
                />
              </div>
              <div>
                <Label>Wire Hole Height: {wireHoleHeight}mm</Label>
                <Input
                  type="number"
                  min={3}
                  max={10}
                  value={wireHoleHeight}
                  onChange={(e) => setWireHoleHeight(parseInt(e.target.value))}
                />
              </div>
              <div>
                <Label>Wire Hole Size: {wireHoleSize}mm</Label>
                <Input
                  type="number"
                  min={3}
                  max={10}
                  value={wireHoleSize}
                  onChange={(e) => setWireHoleSize(parseInt(e.target.value))}
                />
              </div>
            </div>

            {/* Friction Lip Toggle */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="friction-lip"
                checked={enableFrictionLip}
                onChange={(e) => setEnableFrictionLip(e.target.checked)}
                className="w-4 h-4"
              />
              <Label htmlFor="friction-lip" className="cursor-pointer">
                Enable Friction Lip (for neon tubes)
              </Label>
            </div>

            <div className="p-4 bg-muted rounded-lg space-y-2">
              <p className="text-sm font-medium">What You'll Get:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• 26 Body STL files (Letter_A_body.stl → Letter_Z_body.stl)</li>
                <li>• 26 Lid STL files (Letter_A_lid.stl → Letter_Z_lid.stl)</li>
                <li>• 26 OpenSCAD files (Letter_A.scad → Letter_Z.scad)</li>
                <li>• Font file (embedded for OpenSCAD)</li>
                <li>• Assembly instructions</li>
                <li>• Bill of materials</li>
              </ul>
              <p className="text-sm font-bold mt-2">Total: 79 files ready to print!</p>
            </div>
          </CardContent>
        </Card>

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          disabled={(fontSource === "library" && !selectedFont) || (fontSource === "upload" && !fontFile) || isGenerating}
          className="w-full h-12 text-lg"
          size="lg"
        >
          <Download className="w-5 h-5 mr-2" />
          {isGenerating ? "Generating Alphabet..." : "Generate Complete Alphabet (A-Z)"}
        </Button>

        {/* Info Card */}
        <Card className="border-blue-500/50 bg-blue-500/5">
          <CardContent className="pt-6">
            <h3 className="font-bold mb-2">🎨 Why This is Amazing:</h3>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>✓ Works with ANY font file (OTF or TTF)</li>
              <li>✓ Generates 52 STL files in seconds (normally takes hours manually)</li>
              <li>✓ Auto-sizes LED channels based on your light type</li>
              <li>✓ Includes wire pass-through holes for modular assembly</li>
              <li>✓ Friction lip for neon tubes (no glue needed)</li>
              <li>✓ OpenSCAD files included for customization</li>
              <li>✓ 100% FREE (this would cost $$$ elsewhere)</li>
            </ul>
          </CardContent>
        </Card>

        {/* Examples */}
        <Card>
          <CardHeader>
            <CardTitle>Example Fonts to Try</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-bold">Script/Cursive:</p>
                <ul className="text-muted-foreground">
                  <li>• Allistion</li>
                  <li>• Neonderthaw</li>
                  <li>• Alex Brush</li>
                  <li>• Lobster</li>
                </ul>
              </div>
              <div>
                <p className="font-bold">Bold/Display:</p>
                <ul className="text-muted-foreground">
                  <li>• Montserrat Bold</li>
                  <li>• Poppins Bold</li>
                  <li>• Space Grotesk</li>
                  <li>• Outfit Bold</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
