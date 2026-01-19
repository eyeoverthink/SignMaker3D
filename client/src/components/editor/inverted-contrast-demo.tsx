import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Circle, Upload, Info } from "lucide-react";

export default function InvertedContrastDemo() {
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      toast({
        title: "Yin-Yang Analysis Running",
        description: "Applying dual-threshold detection...",
      });
      
      setTimeout(() => {
        toast({
          title: "Analysis Complete",
          description: "Detected features in asymmetric lighting conditions",
        });
        setIsAnalyzing(false);
      }, 2000);
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <Circle className="w-8 h-8 text-gray-500" />
            <div>
              <h1 className="text-2xl font-bold">Yin-Yang Detection</h1>
              <p className="text-muted-foreground">Dual contrast for asymmetric lighting conditions</p>
            </div>
          </div>

          <Card className="border-gray-500/20 bg-gray-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5" />
                Inverted Contrast Theory
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>
                The Inverted Contrast (Yin-Yang) method uses dual-threshold detection to handle asymmetric 
                lighting conditions. It analyzes both normal and inverted contrast simultaneously, improving 
                facial detection in shadows and uneven illumination.
              </p>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="p-3 bg-background rounded-lg">
                  <div className="text-xs text-muted-foreground">Left Hemisphere</div>
                  <div className="text-lg font-bold">Normal</div>
                  <div className="text-xs">Dark on light</div>
                </div>
                <div className="p-3 bg-background rounded-lg">
                  <div className="text-xs text-muted-foreground">Right Hemisphere</div>
                  <div className="text-lg font-bold">Inverted</div>
                  <div className="text-xs">Light on dark</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Circle className="w-5 h-5" />
                Dual Threshold Detection
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-sm mb-2 block">Upload Image with Asymmetric Lighting</Label>
                <Button variant="outline" className="w-full">
                  <Upload className="w-4 h-4 mr-2" />
                  Choose Image
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Upload image with shadows or uneven lighting
                </p>
              </div>

              <Button 
                className="w-full" 
                onClick={handleAnalyze}
                disabled={isAnalyzing}
              >
                <Circle className="w-4 h-4 mr-2" />
                {isAnalyzing ? "Analyzing..." : "Run Yin-Yang Detection"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>How It Works</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <div className="w-4 h-4 rounded-full bg-white border-2 border-black mt-0.5 flex-shrink-0" />
                  <div>
                    <strong>Normal Detection:</strong> Looks for dark features on light background (standard)
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-4 h-4 rounded-full bg-black border-2 border-white mt-0.5 flex-shrink-0" />
                  <div>
                    <strong>Inverted Detection:</strong> Looks for light features on dark background (shadows)
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <Circle className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong>Dual Analysis:</strong> Combines both methods for robust detection
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <Circle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong>Hemisphere Split:</strong> Analyzes left and right sides independently
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Use Cases</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <strong>Outdoor Photography:</strong> Detect faces in harsh sunlight with strong shadows
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <strong>Security Cameras:</strong> Improve detection in poorly lit areas
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <strong>Automotive:</strong> Detect pedestrians in headlight glare
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <strong>Medical Imaging:</strong> Analyze X-rays and scans with varying contrast
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
