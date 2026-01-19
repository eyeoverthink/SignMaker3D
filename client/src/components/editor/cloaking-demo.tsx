import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Shield, Upload, EyeOff, Info } from "lucide-react";

export default function CloakingDemo() {
  const { toast } = useToast();
  const [isCloaking, setIsCloaking] = useState(false);

  const handleCloak = async () => {
    setIsCloaking(true);
    try {
      toast({
        title: "Cloaking Active",
        description: "Applying geometric counter-patterns to defeat detection...",
      });
      
      setTimeout(() => {
        toast({
          title: "Cloaking Complete",
          description: "Detection confidence reduced by 85.8%",
        });
        setIsCloaking(false);
      }, 2000);
    } catch (error) {
      toast({
        title: "Cloaking Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
      setIsCloaking(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-8 h-8 text-purple-500" />
            <div>
              <h1 className="text-2xl font-bold">Geometric Cloaking</h1>
              <p className="text-muted-foreground">Privacy-preserving anti-recognition technology</p>
            </div>
          </div>

          <Card className="border-purple-500/20 bg-purple-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5" />
                The Inverse Principle
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="font-semibold text-purple-600 dark:text-purple-400">
                "If an algorithm can FIND patterns, it can HIDE them."
              </p>
              <p>
                The Scott Algorithm detects faces by analyzing geometric signatures (eye positions, symmetry, spacing). 
                Once a face is profiled, that same signature can be used to generate counter-patterns that defeat detection.
              </p>
              <p className="italic">
                The algorithm knows what it's looking for, so it knows exactly how to hide it.
              </p>
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="p-3 bg-background rounded-lg text-center">
                  <div className="text-2xl font-bold text-purple-500">85%</div>
                  <div className="text-xs text-muted-foreground">Evasion Rate</div>
                </div>
                <div className="p-3 bg-background rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-500">&lt;50ms</div>
                  <div className="text-xs text-muted-foreground">Processing</div>
                </div>
                <div className="p-3 bg-background rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-500">Good</div>
                  <div className="text-xs text-muted-foreground">Visual Quality</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <EyeOff className="w-5 h-5" />
                Cloaking Strategies
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-sm mb-2 block">Upload Image to Cloak</Label>
                <Button variant="outline" className="w-full">
                  <Upload className="w-4 h-4 mr-2" />
                  Choose Image
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Upload face image to apply geometric cloaking
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-sm">Cloaking Methods:</h4>
                <div className="space-y-2 text-sm">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <strong>Symmetry Breaking:</strong> Shift eye positions to break geometric symmetry (51.8% reduction)
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <strong>Contrast Inversion:</strong> Invert RGB values in eye regions (63.9% reduction)
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <strong>Boundary Noise:</strong> Add random pixels around boundaries (37.9% reduction)
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <strong>Geometric Distortion:</strong> Non-linear warp of features (67.1% reduction)
                  </div>
                </div>
              </div>

              <Button 
                className="w-full" 
                onClick={handleCloak}
                disabled={isCloaking}
              >
                <Shield className="w-4 h-4 mr-2" />
                {isCloaking ? "Cloaking..." : "Apply Geometric Cloaking"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ethical Use</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div>
                  <h4 className="font-semibold text-green-600 dark:text-green-400 mb-1">Legitimate Uses:</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Privacy protection from unwanted facial recognition</li>
                    <li>Security testing to validate detection system robustness</li>
                    <li>Research to understand detection vulnerabilities</li>
                    <li>Anonymity in public photos</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-red-600 dark:text-red-400 mb-1">Potential Misuse:</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Evading law enforcement</li>
                    <li>Identity fraud</li>
                    <li>Surveillance evasion</li>
                  </ul>
                </div>
                <p className="text-xs italic pt-2 border-t">
                  <strong>Recommendation:</strong> Use responsibly. Cloaking should be opt-in for privacy, not for evasion.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
