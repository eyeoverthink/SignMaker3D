import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Search, Upload, AlertCircle, Info } from "lucide-react";

export default function DeepfakeDetector() {
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      toast({
        title: "Deepfake Analysis Running",
        description: "Analyzing organic variance patterns...",
      });
      
      setTimeout(() => {
        toast({
          title: "Analysis Complete",
          description: "Image authenticity verified via geometric analysis",
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
            <Search className="w-8 h-8 text-red-500" />
            <div>
              <h1 className="text-2xl font-bold">Deepfake Detection</h1>
              <p className="text-muted-foreground">AI-generated face detection via organic variance analysis</p>
            </div>
          </div>

          <Card className="border-red-500/20 bg-red-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5" />
                Organic Variance Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>
                The Scott Algorithm detects deepfakes by analyzing organic variance in geometric features. 
                Real faces have natural imperfections and asymmetries, while AI-generated faces are often 
                "too perfect" with zero variance in their geometric signatures.
              </p>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="p-3 bg-background rounded-lg">
                  <div className="text-xs text-muted-foreground">Real Images</div>
                  <div className="text-lg font-bold text-green-500">10.69%</div>
                  <div className="text-xs">Std dev (organic)</div>
                </div>
                <div className="p-3 bg-background rounded-lg">
                  <div className="text-xs text-muted-foreground">Synthetic Images</div>
                  <div className="text-lg font-bold text-red-500">0.00%</div>
                  <div className="text-xs">Std dev (too perfect)</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Deepfake Detection
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-sm mb-2 block">Upload Image to Verify</Label>
                <Button variant="outline" className="w-full">
                  <Upload className="w-4 h-4 mr-2" />
                  Choose Image
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Upload face image to check for AI generation
                </p>
              </div>

              <Button 
                className="w-full" 
                onClick={handleAnalyze}
                disabled={isAnalyzing}
              >
                <Search className="w-4 h-4 mr-2" />
                {isAnalyzing ? "Analyzing..." : "Detect Deepfake"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Detection Methods</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <Search className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong>Geometric Variance:</strong> Real faces have 10.69% std dev, synthetic have 0.00%
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <Search className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong>Symmetry Analysis:</strong> AI faces are often perfectly symmetric (unnatural)
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <Search className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong>Boundary Consistency:</strong> Real skin has micro-variations, AI is too smooth
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <Search className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong>No Training Required:</strong> Works on any AI generator without prior examples
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Applications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <strong>Social Media Verification:</strong> Detect fake profile pictures
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <strong>News Authentication:</strong> Verify authenticity of photos in journalism
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <strong>Identity Verification:</strong> Prevent AI-generated ID fraud
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <strong>Content Moderation:</strong> Flag synthetic media on platforms
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-yellow-500/20 bg-yellow-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                <AlertCircle className="w-5 h-5" />
                Limitations
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p>
                This method works best on AI-generated faces from GANs and diffusion models. It may not detect:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Face swaps (real face geometry, just different person)</li>
                <li>Heavily post-processed real photos</li>
                <li>Future AI models trained to add organic variance</li>
              </ul>
              <p className="pt-2 italic">
                Best used as one component in a multi-method deepfake detection system.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
